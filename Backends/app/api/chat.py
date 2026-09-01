from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_tenant, TenantContext
from app.models.shipment import TempClass, GoodType, UrgencyLevel
from app.repositories.hub_repository import HubRepository

router = APIRouter(prefix="/chat", tags=["AI Chatbot"])


class ChatMessageRequest(BaseModel):
    message: str
    locale: str = "en"  # "en", "hi", "or"
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class ChatMessageResponse(BaseModel):
    reply: str
    locale: str
    step: str  # "greeting" | "select_origin" | "select_destination" | "select_good_type" | "select_temp" | "enter_weight" | "confirm"
    quick_replies: List[str]
    draft_shipment: Optional[Dict[str, Any]] = None
    hubs: Optional[List[Dict[str, Any]]] = None


LOCALIZED_RESPONSES = {
    "en": {
        "welcome": "Namaste! I am your Rural Logistics Assistant. Where would you like to pick up your cargo from?",
        "select_dest": "Got it! Which hub should we deliver this cargo to?",
        "select_good": "What type of cargo are you sending?",
        "select_temp": "What temperature storage does your cargo require?",
        "enter_weight": "What is the total weight in Kilograms (kg)?",
        "confirm": "Great! Here is your order details. Click below to confirm shipment booking.",
        "success": "Your shipment order has been successfully placed! Tracking ID generated.",
    },
    "hi": {
        "welcome": "नमस्ते! मैं आपका ग्रामीण लॉजिस्टिक्स सहायक हूँ। आप अपना सामान कहाँ से पिकअप कराना चाहते हैं?",
        "select_dest": "बहुत बढ़िया! यह सामान किस हब पर पहुँचाना है?",
        "select_good": "आप किस प्रकार की सामग्री भेज रहे हैं?",
        "select_temp": "आपकी सामग्री को किस तापमान भंडारण की आवश्यकता है?",
        "enter_weight": "कुल वजन किलोग्राम (kg) में कितना है?",
        "confirm": "उत्कृष्ट! आपके ऑर्डर का विवरण यहाँ है। शिपमेंट बुक करने के लिए नीचे पुष्टि करें।",
        "success": "आपका शिपमेंट ऑर्डर सफलतापूर्वक दर्ज कर लिया गया है! ट्रैकिंग आईडी जनरेट हो गई है।",
    },
    "or": {
        "welcome": "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର ଗ୍ରାମୀଣ ଲଜିଷ୍ଟିକ୍ସ ସହାୟକ। ଆପଣ କେଉଁ ସ୍ଥାନରୁ ସାମଗ୍ରୀ ପିକ୍-ଅପ୍ କରିବାକୁ ଚାହାଁନ୍ତି?",
        "select_dest": "ବହୁତ ଭଲ! ଏହି ସାମଗ୍ରୀ କେଉଁ ହବ୍‌କୁ ପଠାଯିବ?",
        "select_good": "ଆପଣ କେଉଁ ପ୍ରକାରର ସାମଗ୍ରୀ ପଠାଉଛନ୍ତି?",
        "select_temp": "ଆପଣଙ୍କ ସାମଗ୍ରୀ ପାଇଁ କେଉଁ ତାପମାତ୍ରା ଆବଶ୍ୟକ?",
        "enter_weight": "ମୋଟ ଓଜନ କିଲୋଗ୍ରାମ (kg) ରେ କେତେ?",
        "confirm": "ଉତ୍ତମ! ଆପଣଙ୍କ ଅର୍ଡର ବିବରଣୀ ଏଠାରେ ଅଛି। ନିଶ୍ଚିତ କରିବାକୁ ତଳେ କ୍ଲିକ୍ କରନ୍ତୁ।",
        "success": "ଆପଣଙ୍କ ସିପ୍‌ମେଣ୍ଟ ଅର୍ଡର ସଫଳତାର ସହିତ ସମ୍ପନ୍ନ ହୋଇଛି! ଟ୍ରାକିଂ ଆଇଡି ମିଳିଗଲା।",
    }
}


@router.post("/assistant", response_model=ChatMessageResponse)
async def chat_assistant(
    payload: ChatMessageRequest,
    ctx: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    locale = payload.locale if payload.locale in ["en", "hi", "or"] else "en"
    texts = LOCALIZED_RESPONSES.get(locale, LOCALIZED_RESPONSES["en"])

    # Fetch available hubs for selection
    repo = HubRepository(db)
    all_hubs = await repo.list_all()
    hub_list = [
        {"id": str(h.id), "name": h.name, "location": f"{h.lat:.2f}, {h.lon:.2f}", "type": h.type.value if hasattr(h.type, "value") else str(h.type)}
        for h in all_hubs[:8]
    ]

    msg = payload.message.strip().lower()
    context = payload.context or {}
    step = context.get("step", "greeting")

    quick_replies = []
    draft = context.get("draft_shipment", {})

    if step == "greeting" or "start" in msg or "order" in msg or "अर्डर" in msg or "ଅର୍ଡର" in msg or "book" in msg:
        reply = texts["welcome"]
        step = "select_origin"
        quick_replies = [h["name"] for h in hub_list[:4]]

    elif step == "select_origin":
        # Find origin hub by name match
        matched = next((h for h in hub_list if h["name"].lower() in msg or msg in h["name"].lower()), None)
        if matched:
            draft["origin_hub_id"] = matched["id"]
            draft["origin_hub_name"] = matched["name"]
        else:
            draft["origin_hub_id"] = hub_list[0]["id"] if hub_list else None
            draft["origin_hub_name"] = hub_list[0]["name"] if hub_list else "Koraput Hub"

        reply = texts["select_dest"]
        step = "select_destination"
        quick_replies = [h["name"] for h in hub_list if h["id"] != draft.get("origin_hub_id")][:4]

    elif step == "select_destination":
        matched = next((h for h in hub_list if h["name"].lower() in msg or msg in h["name"].lower()), None)
        if matched:
            draft["dest_hub_id"] = matched["id"]
            draft["dest_hub_name"] = matched["name"]
        else:
            # Fallback to second hub if available
            dest_h = hub_list[1] if len(hub_list) > 1 else hub_list[0]
            draft["dest_hub_id"] = dest_h["id"]
            draft["dest_hub_name"] = dest_h["name"]

        reply = texts["select_good"]
        step = "select_good_type"
        if locale == "or":
            quick_replies = ["ଫଳ ଓ ପନିପରିବା", "କ୍ଷୀର / ଦୁଗ୍ଧ ସାମଗ୍ରୀ", "ଟିକା / ଔଷଧ", "ମାଛ / ସାମୁଦ୍ରିକ ଖାଦ୍ୟ"]
        elif locale == "hi":
            quick_replies = ["ताज़ा फल एवं सब्जियाँ", "दूध एवं डेरी उत्पाद", "टीके एवं जीवनरक्षक दवाइयाँ", "मछली एवं समुद्री भोजन"]
        else:
            quick_replies = ["Fresh Produce & Fruits", "Milk & Dairy Products", "Vaccines & Medicines", "Fish & Seafood"]

    elif step == "select_good_type":
        if "vaccine" in msg or "medicine" in msg or "दवा" in msg or "ଟିକା" in msg or "ଔଷଧ" in msg:
            draft["good_type"] = GoodType.vaccines_medical.value
            draft["good_type_label"] = "Vaccines & Medical Supplies"
        elif "milk" in msg or "dairy" in msg or "दूध" in msg or "କ୍ଷୀର" in msg:
            draft["good_type"] = GoodType.dairy_milk.value
            draft["good_type_label"] = "Dairy & Milk Products"
        elif "fish" in msg or "sea" in msg or "मछली" in msg or "ମାଛ" in msg:
            draft["good_type"] = GoodType.fish_seafood.value
            draft["good_type_label"] = "Fish & Seafood"
        else:
            draft["good_type"] = GoodType.farm_produce.value
            draft["good_type_label"] = "Fresh Farm Produce"

        reply = texts["select_temp"]
        step = "select_temp"
        if locale == "or":
            quick_replies = ["ଶୀତଳ (-20°C ବରଫ)", "ଥଣ୍ଡା (2°C - 8°C)", "ସାଧାରଣ (15°C - 25°C)"]
        elif locale == "hi":
            quick_replies = ["जमे हुए (-20°C फ्रोजन)", "ठंडा (2°C - 8°C चिल)", "सामान्य (15°C - 25°C)"]
        else:
            quick_replies = ["Frozen (-20°C Deep Cold)", "Chilled (2°C - 8°C Cold Chain)", "Ambient (15°C - 25°C Normal)"]

    elif step == "select_temp":
        if "frozen" in msg or "ice" in msg or "बरफ" in msg or "ବରଫ" in msg or "-20" in msg:
            draft["temp_class"] = TempClass.frozen.value
            draft["temp_label"] = "Frozen (-20°C)"
        elif "chill" in msg or "cold" in msg or "ठंडा" in msg or "ଥଣ୍ଡା" in msg or "8" in msg:
            draft["temp_class"] = TempClass.chilled.value
            draft["temp_label"] = "Chilled (2°C to 8°C)"
        else:
            draft["temp_class"] = TempClass.ambient.value
            draft["temp_label"] = "Ambient (15°C to 25°C)"

        reply = texts["enter_weight"]
        step = "enter_weight"
        quick_replies = ["50 kg", "100 kg", "250 kg", "500 kg"]

    elif step == "enter_weight":
        import re
        numbers = re.findall(r"\d+", msg)
        weight = float(numbers[0]) if numbers else 100.0
        draft["weight_kg"] = weight
        draft["volume_cbm"] = round(weight * 0.005, 2)
        draft["producer_id"] = "prod-rural-farmer-01"
        draft["producer_name"] = "Gram Panchayat Farmer Co-op"
        draft["community_id"] = "comm-cluster-koraput"
        draft["urgency"] = UrgencyLevel.routine.value

        reply = texts["confirm"]
        step = "confirm"
        if locale == "or":
            quick_replies = ["ସିପ୍‌ମେଣ୍ଟ ବୁକ୍ କରନ୍ତୁ ✅", "ପୁନର୍ବାର ଆରମ୍ଭ କରନ୍ତୁ 🔄"]
        elif locale == "hi":
            quick_replies = ["ऑर्डर कन्फर्म करें ✅", "पुनः प्रारंभ करें 🔄"]
        else:
            quick_replies = ["Confirm Order ✅", "Start Over 🔄"]

    else:
        reply = texts["welcome"]
        step = "select_origin"
        quick_replies = [h["name"] for h in hub_list[:4]]

    return ChatMessageResponse(
        reply=reply,
        locale=locale,
        step=step,
        quick_replies=quick_replies,
        draft_shipment=draft,
        hubs=hub_list,
    )
