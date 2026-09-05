import re
import json
import logging
from typing import Optional, Dict, Any, List, Tuple
import httpx

from app.core.config import settings

logger = logging.getLogger("cargomind.llm")

# ---------------------------------------------------------------------------
# SYSTEM PROMPT GROUNDING CARGOMIND DOMAIN KNOWLEDGE
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are the AI Conversational Assistant for CargoMind (ShipMerge), an AI-optimized multi-modal rural logistics and cold-chain consolidation network designed for Team NASCENT (Smart India Hackathon 2026).

YOUR MISSION & EXPERTISE:
1. Rural Freight Consolidation: You help rural farmers, dairy cooperatives, floriculture groups, and healthcare centres pool freight, reduce logistics costs by ~35%, and transport goods safely to regional urban hubs.
2. Cold-Chain & Spoilage Kinetics:
   - Explain temperature classes:
     • Frozen (-20°C to -18°C): Meat, fish, deep-freeze seafood.
     • Chilled (+2°C to +8°C): Fresh milk, dairy, vaccines, life-saving medicines, leafy vegetables.
     • Ambient (+15°C to +25°C): Root crops (potatoes, onions), grains, packaged essential supplies.
   - You understand physics-based shelf-life kinetics (Arrhenius activation energy & Q10 degradation rates) that predict perishable loss during transport delays or thermal deviations.
3. Multi-Modal Coordination:
   - Multi-modal freight combining rural 4x4 pickup feeders (e.g. Mahindra Bolero), refrigerated reefers, Dedicated Freight Corridor (DFC) rail wagons via FOIS integration, and inland riverine links.
4. Intelligent Vehicle Allocation:
   - Powered by Google OR-Tools CP-SAT combinatorial optimization ensuring strict thermal isolation (never co-load frozen with ambient cargo), payload weight & volume limits, road bump/pothole penalty factors, and fair trip allocation among rural drivers.
5. Offline-First Resilience:
   - The platform works offline in remote tribal and rural areas using client-generated UUIDs (idempotency), local persistent queues, and background sync to `/api/sync/batch` when 4G/5G connectivity returns.
6. Order Booking Assistance:
   - Guide users step-by-step to book cargo pickups (Origin hub, Destination hub, Commodity type, Temperature requirement, Weight in kg).

COMMUNICATION & LANGUAGE GUIDELINES:
- When locale is "hi" (Hindi): Respond in polite, natural Hindi in Devanagari script.
- When locale is "as" (Assamese): Respond in polite, natural Assamese in Assamese/Bengali script.
- When locale is "en" (English): Respond in clear, professional, accessible English.
- Formatting: Use clean markdown, bolding, bullet points, and appropriate emojis (📦, ❄️, 🚚, ⏱️, 🌾, 📍).
- Tone: Empathetic to rural producers, highly knowledgeable about logistics, cold chains, and cooperative workflows.
- Keep responses concise (usually 2 to 4 short paragraphs or bulleted points).
"""


def resolve_api_key() -> Optional[str]:
    """Resolves the Gemini API key from server environment variables."""
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        return settings.GEMINI_API_KEY.strip()
    return None


async def call_gemini_api(
    api_key: str,
    prompt: str,
    system_prompt: str,
    model: str = "gemini-2.0-flash",
) -> Optional[str]:
    """Calls Google Gemini REST API asynchronously."""
    models_to_try = [
        model,
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-flash-latest",
        "gemini-2.5-flash-lite",
        "gemini-2.5-pro",
        "gemini-pro-latest",
    ]
    seen = set()
    candidate_models = [m for m in models_to_try if m and not (m in seen or seen.add(m))]

    async with httpx.AsyncClient(timeout=12.0) as client:
        for m in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
            payload = {
                "system_instruction": {
                    "parts": [{"text": system_prompt}]
                },
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": prompt}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.3,
                    "maxOutputTokens": 800,
                },
            }

            try:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"].strip()
                elif response.status_code == 429:
                    logger.warning(
                        "Gemini API rate limit (429) hit for model %s. Retrying or falling back to rules.",
                        m,
                    )
                else:
                    logger.warning(
                        "Gemini API returned status %d for model %s: %s",
                        response.status_code,
                        m,
                        response.text[:200],
                    )
            except httpx.TimeoutException:
                logger.warning("Gemini API request timed out for model %s (12s threshold)", m)
            except Exception as exc:
                logger.warning("Gemini API call failed for model %s: %s", m, exc)

    return None


async def generate_chat_reply(
    message: str,
    locale: str = "en",
    hubs: Optional[List[Dict[str, Any]]] = None,
    tracked_shipment: Optional[Dict[str, Any]] = None,
    step: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Coordinates LLM reply generation using Google Gemini and live CargoMind database context.
    Falls back gracefully if no key is configured or call fails.
    """
    resolved_key = resolve_api_key()

    if not resolved_key:
        return {
            "success": False,
            "reply": None,
            "provider": "gemini",
            "error": "No Gemini API key configured",
        }

    loc_label = 'Hindi' if locale == 'hi' else 'Assamese' if locale == 'as' else 'English'
    prompt_sections = [
        f"USER MESSAGE: {message}",
        f"USER REQUESTED LOCALE: {locale} ({loc_label})",
    ]

    if step and step not in ["idle", "greeting"]:
        prompt_sections.append(f"CURRENT CONVERSATION STEP: {step}")
    else:
        prompt_sections.append("CURRENT CONVERSATION STATE: General Assistant / Conversational Exploration")

    if hubs:
        hub_summary = ", ".join([f"{h.get('name')} ({h.get('type', 'hub')})" for h in hubs[:6]])
        prompt_sections.append(f"ACTIVE CARGOMIND HUBS: {hub_summary}")

    if tracked_shipment:
        prompt_sections.append(
            f"LIVE SHIPMENT TELEMETRY IN DATABASE:\n"
            f"• Waybill: {tracked_shipment.get('waybill', 'N/A')}\n"
            f"• Status: {tracked_shipment.get('status', 'N/A')}\n"
            f"• Commodity: {tracked_shipment.get('good_type', 'Farm Produce')}\n"
            f"• Weight: {tracked_shipment.get('weight_kg', 'N/A')} kg\n"
            f"• Temp Class: {tracked_shipment.get('temp_class', 'Chilled')}\n"
            f"• Route: {tracked_shipment.get('origin', 'Origin Hub')} ➔ {tracked_shipment.get('destination', 'Destination Hub')}\n"
            f"• Current Reefer Temp: {tracked_shipment.get('current_temp', '+3.8°C')}\n"
            f"• Remaining Shelf-Life: {tracked_shipment.get('shelf_life_remaining', '98.2%')}"
        )

    prompt = "\n\n".join(prompt_sections)

    model_name = settings.GEMINI_MODEL or "gemini-2.0-flash"
    reply_text = await call_gemini_api(resolved_key, prompt, SYSTEM_PROMPT, model=model_name)

    if reply_text:
        quick_replies = generate_smart_quick_replies(message, locale)
        return {
            "success": True,
            "reply": reply_text,
            "quick_replies": quick_replies,
            "provider": "gemini",
            "error": None,
        }

    return {
        "success": False,
        "reply": None,
        "provider": "gemini",
        "error": "Gemini API request failed or returned empty output",
    }


def generate_smart_quick_replies(message: str, locale: str) -> List[str]:
    """Generates context-aware chip buttons for the user to tap next."""
    msg_lower = message.lower()

    if locale == "hi":
        if "track" in msg_lower or "स्थिति" in msg_lower:
            return ["RUR-90141 का ईटीए ⏱️", "नया ऑर्डर बुक करें 📦", "❓ अक्सर पूछे जाने वाले प्रश्न"]
        if "order" in msg_lower or "बुक" in msg_lower or "पिकअप" in msg_lower:
            return ["गुवाहाटी हब से 📍", "जोरहाट हब 🏢", "कोल्ड स्टोरेज आवश्यकताएं ❄️"]
        if "hello" in msg_lower or "hi" in msg_lower or "नमस्ते" in msg_lower:
            return ["📦 नया ऑर्डर बुक करें", "🔍 RUR-90141 ट्रैक करें", "⏱️ डिलीवरी ईटीए", "❓ सामान्य प्रश्न (FAQs)"]
        return ["📦 नया ऑर्डर बुक करें", "🔍 RUR-90141 ट्रैक करें", "❓ सामान्य प्रश्न (FAQs)"]

    if locale == "as":
        if "track" in msg_lower or "স্থিতি" in msg_lower:
            return ["RUR-90141 ৰ ETA ⏱️", "নতুন অৰ্ডাৰ বুক কৰক 📦", "❓ সঘনাই সোধা প্ৰশ্ন"]
        if "order" in msg_lower or "বুক" in msg_lower or "পিকআপ" in msg_lower:
            return ["যোৰহাট হাবৰ পৰা 📍", "গুৱাহাটী কেন্দ্ৰীয় হাব 🏢", "কোল্ড ষ্ট’ৰেজ প্ৰয়োজনীয়তা ❄️"]
        if "hello" in msg_lower or "hi" in msg_lower or "নমস্কাৰ" in msg_lower:
            return ["📦 নতুন অৰ্ডাৰ বুকিং", "🔍 RUR-90141 ট্ৰেক কৰক", "⏱️ ডেলিভাৰী ETA", "❓ সঘনাই সোধা প্ৰশ্ন (FAQs)"]
        return ["📦 নতুন অৰ্ডাৰ বুকিং", "🔍 RUR-90141 ট্ৰেক কৰক", "❓ সঘনাই সোধা প্ৰশ্ন (FAQs)"]

    # English default
    if "track" in msg_lower or "status" in msg_lower:
        return ["Check ETA for RUR-90141 ⏱️", "Book New Pickup 📦", "❓ View FAQs"]
    if "cold" in msg_lower or "temp" in msg_lower or "spoil" in msg_lower:
        return ["Chilled (+2°C to +8°C) ❄️", "Frozen (-20°C) 🧊", "Book Reefer Consignment 🚚"]
    if any(g in msg_lower for g in ["hi", "hello", "hey", "namaste", "good morning", "good evening"]):
        return ["📦 Book Consignment", "🔍 Track RUR-90141", "⏱️ Check Delivery ETA", "❓ View FAQs"]
    return ["📦 Book a Consignment", "🔍 Track Shipment RUR-90141", "❓ View FAQs"]
