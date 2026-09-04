import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_get_accessibility_index():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/accessibility/index?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "average_score" in data
        assert len(data["items"]) <= 10
        if len(data["items"]) > 0:
            item = data["items"][0]
            assert "composite_score" in item
            assert "breakdown" in item
            assert "road_connectivity" in item["breakdown"]
            assert "terrain_difficulty" in item["breakdown"]
            assert "multimodal_proximity" in item["breakdown"]
            assert "disaster_resilience" in item["breakdown"]
            assert "hub_proximity" in item["breakdown"]
            assert 0 <= item["composite_score"] <= 100


@pytest.mark.asyncio
async def test_calculate_dynamic_accessibility():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "lat": 25.5788,
            "lon": 91.8933,
            "state": "Meghalaya",
            "elevation_m": 1525.0,
            "slope_pct": 18.5,
            "road_surface": "paved",
            "road_status": "clear",
            "nearest_hub_dist_km": 12.0,
            "season": "monsoon",
            "is_flood_prone": False,
        }
        response = await client.post("/api/accessibility/calculate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "composite_score" in data
        assert "accessibility_tier" in data
        assert data["breakdown"]["terrain_difficulty"] > 0
        assert data["composite_score"] > 0


@pytest.mark.asyncio
async def test_get_accessibility_summary():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/accessibility/summary")
        assert response.status_code == 200
        data = response.json()
        assert "regional_avg_accessibility" in data
        assert "state_breakdowns" in data
        assert "flood_vulnerable_clusters_count" in data
