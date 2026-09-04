import os
import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock

from app.core.config import settings
from app.services import llm_service
from app.api.chat import _RATE_LIMIT_BUCKETS


@pytest.fixture(autouse=True)
def reset_rate_limiter_buckets():
    _RATE_LIMIT_BUCKETS.clear()
    yield
    _RATE_LIMIT_BUCKETS.clear()


@pytest.mark.asyncio
async def test_chat_status_endpoint(client: AsyncClient):
    """Test that GET /api/chat/status returns online status and Gemini server key readiness."""
    response = await client.get("/api/chat/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["provider"] == "gemini"
    assert "has_server_key" in data
    assert "model" in data


@pytest.mark.asyncio
async def test_chat_rule_based_fallback_without_key(client: AsyncClient):
    """Test that chat assistant falls back gracefully to FAQs when no server key is configured."""
    with patch.object(settings, "GEMINI_API_KEY", None):
        response = await client.post(
            "/api/chat",
            json={
                "message": "What is this platform?",
                "locale": "en",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "CargoMind" in data["reply"]
        assert data["ai_generated"] is False or data["ai_generated"] is None


@pytest.mark.asyncio
async def test_chat_order_booking_flow(client: AsyncClient):
    """Test the conversational order booking state machine."""
    # Start booking
    resp = await client.post(
        "/api/chat",
        json={"message": "Book order", "locale": "en", "context": {"step": "greeting"}},
    )
    assert resp.status_code == 200
    assert resp.json()["step"] == "select_origin"

    # Select origin
    resp2 = await client.post(
        "/api/chat",
        json={"message": "Village A", "locale": "en", "context": {"step": "select_origin"}},
    )
    assert resp2.status_code == 200
    assert resp2.json()["step"] == "select_destination"


@pytest.mark.asyncio
async def test_chat_with_gemini_server_proxy(client: AsyncClient):
    """Test that POST /api/chat uses server GEMINI_API_KEY and returns Gemini response without leaking key."""
    fake_secret_key = "AIzaSySecretServerKey123456789"
    mock_reply = "📦 Fresh tomatoes should be transported in chilled reefer units at 10°C to 12°C to prevent chilling injury."

    with patch.object(settings, "GEMINI_API_KEY", fake_secret_key), \
         patch("app.api.chat.generate_chat_reply", new_callable=AsyncMock) as mock_llm:

        mock_llm.return_value = {
            "success": True,
            "reply": mock_reply,
            "quick_replies": ["Reefer Options 🚚", "Book Order 📦"],
            "provider": "gemini",
            "error": None,
        }

        # Request has NO client-side API key
        response = await client.post(
            "/api/chat",
            json={
                "message": "How should I transport fresh tomatoes to prevent spoilage?",
                "locale": "en",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["ai_generated"] is True
        assert data["provider_used"] == "gemini"
        assert data["reply"] == mock_reply

        # DoD: Verify secret key is NEVER leaked in response payload or headers
        raw_response_text = response.text
        assert fake_secret_key not in raw_response_text
        for header_val in response.headers.values():
            assert fake_secret_key not in header_val


@pytest.mark.asyncio
async def test_chat_llm_failure_falls_back_to_rules(client: AsyncClient):
    """Test that if the LLM API fails, the chatbot gracefully falls back without 500 error."""
    with patch.object(settings, "GEMINI_API_KEY", "AIzaSyTestKey"), \
         patch("app.api.chat.generate_chat_reply", new_callable=AsyncMock) as mock_llm:

        mock_llm.return_value = {
            "success": False,
            "reply": None,
            "provider": "gemini",
            "error": "Quota exceeded",
        }

        response = await client.post(
            "/api/chat",
            json={
                "message": "What is this platform?",
                "locale": "en",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["ai_generated"] is False or data["ai_generated"] is None
        assert "CargoMind" in data["reply"]


def test_gitignore_and_env_example():
    """Test that .gitignore protects .env and .env.example exists."""
    assert os.path.exists("Backends/.env.example") or os.path.exists(".env.example")
    gitignore_path = ".gitignore" if os.path.exists(".gitignore") else "../.gitignore"
    with open(gitignore_path, "r") as f:
        gitignore_content = f.read()
    assert ".env" in gitignore_content


@pytest.mark.asyncio
async def test_chat_empty_message_validation(client: AsyncClient):
    """Test that empty or whitespace-only messages return 400 Bad Request."""
    # Empty string
    resp1 = await client.post("/api/chat", json={"message": "", "locale": "en"})
    assert resp1.status_code == 400
    assert "cannot be empty" in resp1.json()["detail"].lower()

    # Whitespace only
    resp2 = await client.post("/api/chat", json={"message": "   \n\t  ", "locale": "en"})
    assert resp2.status_code == 400
    assert "cannot be empty" in resp2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_chat_malformed_payload(client: AsyncClient):
    """Test that malformed JSON payloads return 422 Unprocessable Entity without crashing."""
    resp = await client.post(
        "/api/chat",
        headers={"Content-Type": "application/json"},
        content=b'{"invalid_field": 123}',
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_chat_rate_limiting(client: AsyncClient):
    """Test that exceeding maximum rapid requests from a single client returns 429 Too Many Requests."""
    from app.api.chat import _RATE_LIMIT_BUCKETS
    _RATE_LIMIT_BUCKETS.clear()

    # Perform requests up to limit
    for _ in range(30):
        resp = await client.post("/api/chat", json={"message": "What is this platform?", "locale": "en"})
        assert resp.status_code == 200

    # 31st request exceeds the limit
    rate_limited_resp = await client.post("/api/chat", json={"message": "What is this platform?", "locale": "en"})
    assert rate_limited_resp.status_code == 429
    assert "too many" in rate_limited_resp.json()["detail"].lower()
    assert "Retry-After" in rate_limited_resp.headers

    # Reset rate limit bucket for subsequent tests
    _RATE_LIMIT_BUCKETS.clear()


@pytest.mark.asyncio
async def test_gemini_upstream_rate_limit_fallback(client: AsyncClient):
    """Test that upstream Google Gemini 429 response falls back gracefully without 500 error."""
    with patch.object(settings, "GEMINI_API_KEY", "AIzaSyValidLookingKey"), \
         patch("app.api.chat.generate_chat_reply", new_callable=AsyncMock) as mock_llm:

        mock_llm.return_value = {
            "success": False,
            "reply": None,
            "provider": "gemini",
            "error": "Gemini API rate limit (429) hit",
        }

        response = await client.post(
            "/api/chat",
            json={
                "message": "How does vehicle matching work?",
                "locale": "en",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["ai_generated"] is False or data["ai_generated"] is None
        assert "Vehicle Matching" in data["reply"]


@pytest.mark.asyncio
async def test_chat_assamese_faq_and_booking(client: AsyncClient):
    """Test that chat endpoint supports Assamese locale, FAQ matching, and booking."""
    with patch.object(settings, "GEMINI_API_KEY", None):
        # 1. Assamese FAQ query
        resp_faq = await client.post(
            "/api/chat",
            json={"message": "এই প্লেটফৰ্ম কি?", "locale": "as"},
        )
        assert resp_faq.status_code == 200
        data_faq = resp_faq.json()
        assert data_faq["locale"] == "as"
        assert "কাৰ্গোমাইণ্ড" in data_faq["reply"]

        # 2. Assamese Booking Flow
        resp_booking = await client.post(
            "/api/chat",
            json={"message": "নতুন অৰ্ডাৰ", "locale": "as", "context": {"step": "greeting"}},
        )
        assert resp_booking.status_code == 200
        data_booking = resp_booking.json()
        assert data_booking["locale"] == "as"
        assert data_booking["step"] == "select_origin"
        assert "নমস্কাৰ" in data_booking["reply"]



