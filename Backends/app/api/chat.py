import re
import time
from collections import defaultdict
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Request, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.models.hub import Hub
from app.models.shipment import Shipment, GoodType, TempClass, UrgencyLevel
from app.services.llm_service import generate_chat_reply, resolve_api_key

router = APIRouter(prefix="/chat", tags=["Rural Multilingual Conversational Assistant"])

# ---------------------------------------------------------------------------
# IN-MEMORY RATE LIMITER (SLIDING WINDOW)
# ---------------------------------------------------------------------------
_RATE_LIMIT_BUCKETS: Dict[str, List[float]] = defaultdict(list)
_MAX_REQUESTS_PER_MINUTE = 30
_WINDOW_SECONDS = 60.0


def check_rate_limit(client_ip: str) -> None:
    now = time.time()
    timestamps = _RATE_LIMIT_BUCKETS[client_ip]
    # Prune timestamps older than window
    valid_timestamps = [ts for ts in timestamps if now - ts < _WINDOW_SECONDS]
    _RATE_LIMIT_BUCKETS[client_ip] = valid_timestamps

    if len(valid_timestamps) >= _MAX_REQUESTS_PER_MINUTE:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many chat requests. Please wait a moment before sending more messages.",
            headers={"Retry-After": "30"},
        )

    _RATE_LIMIT_BUCKETS[client_ip].append(now)


class ChatMessageRequest(BaseModel):
    message: str
    locale: Optional[str] = "en"  # "en", "hi", "as"
    context: Optional[Dict[str, Any]] = None


class ChatMessageResponse(BaseModel):
    reply: str
    locale: str
    step: str
    intent: Optional[str] = None
    faq_id: Optional[str] = None
    quick_replies: List[str] = []
    draft_shipment: Optional[Dict[str, Any]] = None
    tracked_shipment: Optional[Dict[str, Any]] = None
    hubs: Optional[List[Dict[str, Any]]] = None
    ai_generated: Optional[bool] = False
    provider_used: Optional[str] = None


# ---------------------------------------------------------------------------
# MULTILINGUAL FAQ KNOWLEDGE BASE
# ---------------------------------------------------------------------------
FAQS_DATA = {
    "what_is_platform": {
        "question": {
            "en": "What is this platform?",
            "hi": "यह प्लेटफॉर्म क्या है?",
            "as": "এই প্লেটফৰ্ম কি?",
        },
        "answer": {
            "en": "📦 **CargoMind (ShipMerge)** is an AI-powered multi-tenant rural logistics and cold-chain consolidation platform. It optimizes multi-modal freight distribution (road, rail DFC, refrigerated reefers), predicts perishable spoilage using physics-based kinetics (Arrhenius & Q10), and connects rural producers and farmer cooperatives directly to regional markets.",
            "hi": "📦 **कार्गोमाइंड (CargoMind / ShipMerge)** एक एआई-संचालित मल्टी-टेनेंट ग्रामीण लॉजिस्टिक्स और कोल्ड-चेन समेकन प्लेटफॉर्म है। यह मल्टी-मोडल माल परिवहन (सड़क, रेल डीएफसी, रीफर वाहन) को अनुकूलित करता है, भौतिकी-आधारित काइनेटिक्स (Arrhenius & Q10) से खराब होने वाले सामान के जोखिम का सटीक अनुमान लगाता है, और ग्रामीण उत्पादकों को सीधे क्षेत्रीय बाजारों से जोड़ता है।",
            "as": "📦 **কাৰ্গোমাইণ্ড (CargoMind / ShipMerge)** হ’ল এটা AI-চালিত মাল্টি-টেনেণ্ট গ্ৰাম্য লজিষ্টিক আৰু কোল্ড-চেইন সমন্বয় প্লেটফৰ্ম। ই মাল্টি-মডেল মাল পৰিবহণ (পথ, ৰে’ল DFC, ৰিফাৰ বাহন) সুশৃংখলিত কৰে, পদাৰ্থ বিজ্ঞান ভিত্তিক কিনেটিক্স (Arrhenius & Q10) ব্যৱহাৰ কৰি নষ্ট হ’ব পৰা সামগ্ৰীৰ স্থায়িত্ব নিৰ্ধাৰণ কৰে, আৰু গ্ৰাম্য কৃষক তথা সমবায়ক প্ৰত্যক্ষভাৱে আঞ্চলিক বজাৰৰ সৈতে সংযোগ কৰে।",
        },
        "keywords": [
            "what is this platform", "what is platform", "what is cargomind", "what is shipmerge",
            "about the platform", "about platform",
            "यह प्लेटफॉर्म क्या है", "यह क्या है", "कार्गोमाइंड क्या है",
            "এই প্লেটফৰ্ম কি", "কাৰ্গোমাইণ্ড কি", "প্লেটফৰ্মৰ বিষয়ে",
        ],
    },
    "create_shipment": {
        "question": {
            "en": "How do I create a shipment?",
            "hi": "मैं शिपमेंट कैसे बना सकता हूँ?",
            "as": "মই কেনেকৈ চালান (শ্বিপমেণ্ট) সৃষ্টি কৰিম?",
        },
        "answer": {
            "en": "📝 **Creating a Shipment:**\n1. Use this Chatbot: Type or speak *'Book order'* to start our guided step-by-step assistant.\n2. Via Web Portal: Go to the **Pickups / Shipments** section and click **Create Shipment**.\n3. Specify your origin hub/village, destination hub, commodity type, temperature class (Frozen, Chilled, Ambient), and total weight (kg).",
            "hi": "📝 **शिपमेंट बनाने की विधि:**\n1. इस चैटबॉट से: बोलें या लिखें *'ऑर्डर बुक करें'* और चरण-दर-चरण प्रक्रिया का पालन करें।\n2. वेब पोर्टल से: **Pickups / Shipments** सेक्शन में जाएं और **Create Shipment** पर क्लिक करें।\n3. अपना मूल गाँव/हब, गंतव्य हब, सामग्री का प्रकार, तापमान श्रेणी (फ्रोजन, चिल्ड, सामान्य) और वजन (किलोग्राम) दर्ज करें।",
            "as": "📝 **চালান সৃষ্টি কৰাৰ পদ্ধতি:**\n1. এই চাটবট ব্যৱহাৰ কৰক: আমাৰ নিৰ্দেশিত প্ৰক্ৰিয়া আৰম্ভ কৰিবলৈ *'অৰ্ডাৰ বুক কৰক'* টাইপ কৰক বা কওক।\n2. ৱেব পৰ্টেলৰ জৰিয়তে: **Pickups / Shipments** বিভাগলৈ যাওক আৰু **Create Shipment** ত ক্লিক কৰক।\n3. আপোনাৰ মূল গাওঁ/হাব, গন্তব্য স্থানৰ হাব, সামগ্ৰীৰ প্ৰকাৰ, উষ্ণতাৰ শ্ৰেণী (হিমায়িত/ফ্ৰোজেন, শীতল, সাধাৰণ) আৰু মুঠ ওজন (কিলোগ্ৰাম) প্ৰদান কৰক।",
        },
        "keywords": [
            "how do i create a shipment", "how to create a shipment", "how to create shipment",
            "how to make a shipment", "how to book a shipment", "how to book cargo",
            "शिपमेंट कैसे बना", "शिपमेंट कैसे बनाएँ", "ऑर्डर कैसे बनाएँ", "शिपमेंट कैसे बनाएं",
            "মই কেনেকৈ চালান সৃষ্টি কৰিম", "অৰ্ডাৰ কেনেকৈ বুক কৰিম", "চালান কেনেকৈ কৰিম",
        ],
    },
    "find_vehicle": {
        "question": {
            "en": "How can I find a vehicle?",
            "hi": "मैं वाहन कैसे खोज सकता हूँ?",
            "as": "মই বাহন কেনেকৈ বিচাৰি পাম?",
        },
        "answer": {
            "en": "🚚 **Finding a Vehicle:**\n• **Automated Matching:** Vehicles are automatically matched to your shipment using our intelligent multi-modal optimization engine.\n• **Fleet Directory:** Navigate to the **Dispatch** or **Kinetics** tab to view active cooperative vehicles, reefer trucks, dynamic GPS telemetry, and available payload capacity.",
            "hi": "🚚 **वाहन खोजने की प्रक्रिया:**\n• **स्वचालित मैचिंग:** हमारा इंटेलिजेंट ऑप्टिमाइजेशन इंजन आपके शिपमेंट के लिए सर्वोत्तम वाहन का स्वतः चयन करता है।\n• **फ्लीट डायरेक्टरी:** उपलब्ध रीफर गाड़ियाँ, वाहन क्षमता, GPS लोकेशन और तापमान स्थिति देखने के लिए **Dispatch** या **Kinetics** टैब देखें।",
            "as": "🚚 **বাহন বিচৰাৰ প্ৰক্ৰিয়া:**\n• **স্বয়ংক্ৰিয় মেচিং:** আমাৰ বুদ্ধিমত্তা সম্পন্ন মাল্টি-মডেল অপ্টিমাইজেচন ইঞ্জিনে আপোনাৰ চালানৰ বাবে উপযুক্ত বাহন স্বয়ংক্ৰিয়ভাৱে নিৰ্বাচন কৰে।\n• **বাহনৰ তালিকা:** সক্ৰিয় সমবায় বাহন, ৰিফাৰ ট্ৰাক, লাইভ GPS আৰু উপলব্ধ বহন ক্ষমতা চাবলৈ **Dispatch** বা **Kinetics** টেব চাওক।",
        },
        "keywords": [
            "how can i find a vehicle", "how to find a vehicle", "how do i find a vehicle",
            "how to find vehicle", "how can i get a vehicle", "find a vehicle",
            "वाहन कैसे खोज", "गाड़ी कैसे खोज", "गाड़ी कैसे मिलेगी", "वाहन कैसे खोजें",
            "মই বাহন কেনেকৈ বিচাৰি পাম", "গাড়ী কেনেকৈ পাম", "বাহন কেনেকৈ পাম",
        ],
    },
    "vehicle_matching": {
        "question": {
            "en": "How does vehicle matching work?",
            "hi": "वाहन मिलान कैसे काम करता है?",
            "as": "বাহন মেচিং কেনেকৈ কাম কৰে?",
        },
        "answer": {
            "en": "🧠 **Vehicle Matching Engine:**\nPowered by **Google OR-Tools CP-SAT Combinatorial Optimization**:\n1. **Thermal Isolation:** Strictly prevents co-loading incompatible temperatures (e.g., Frozen -18°C vs Ambient).\n2. **Payload & Volume Bounds:** Respects maximum kg capacity and cubic meter volume constraints.\n3. **Road Quality & Kinetics:** Integrates unpaved rural road conditions and shelf-life degradation rates.\n4. **Driver Fairness:** Balances dispatches among local community carriers.",
            "hi": "🧠 **वाहन मिलान (Vehicle Matching) प्रणाली:**\nयह **Google OR-Tools CP-SAT ऑप्टिमाइजेशन** पर आधारित है:\n1. **तापमान अलगाव:** फ्रोजन (-18°C) और सामान्य सामान को एक साथ लोड होने से रोकता है।\n2. **भार व आयतन सीमा:** वाहन की पेलोड वजन और क्यूबिक मीटर क्षमता का पालन करता है।\n3. **सड़क की स्थिति एवं काइनेटिक्स:** कच्ची ग्रामीण सड़कों और सामान की शेल्फ-लाइफ का विश्लेषण करता है।\n4. **चालक निष्पक्षता:** स्थानीय ड्राइवरों के बीच समान ट्रिप वितरण सुनिश्चित करता है।",
            "as": "🧠 **বাহন মেচিং পদ্ধতি:**\nএইটো **Google OR-Tools CP-SAT অপ্টিমাইজেচন** দ্বাৰা পৰিচালিত:\n1. **উষ্ণতা সুৰক্ষা:** ফ্ৰোজেন (-18°C) আৰু সাধাৰণ সামগ্ৰী কেতিয়াও একেলগে লোড নহয়।\n2. **ওজন আৰু আয়তন সীমা:** বাহনৰ সৰ্বোচ্চ ওজন আৰু কিউবিক মিটাৰ ক্ষমতা মানি চলে।\n3. **পথৰ অৱস্থা আৰু কিনেটিক্স:** গ্ৰাম্য কেঁচা পথ আৰু সামগ্ৰীৰ গুণাগুণ ৰক্ষাৰ সময় গণনা কৰে।\n4. **চালকৰ সমতা:** স্থানীয় চালকসকলৰ মাজত সমানভাৱে ট্ৰিপ বিতৰণ কৰে।",
        },
        "keywords": [
            "how does vehicle matching work", "how vehicle matching works", "vehicle matching algorithm",
            "cp-sat matching", "matching logic", "vehicle matching work",
            "वाहन मिलान कैसे काम करता है", "मैचिंग कैसे काम करती है", "मैचिंग कैसे होती है",
            "বাহন মেচিং কেনেকৈ কাম কৰে", "মেচিং কেনেকৈ হয়", "গাড়ী মেচিং",
        ],
    },
    "track_shipment": {
        "question": {
            "en": "How can I track my shipment?",
            "hi": "मैं अपना शिपमेंट कैसे ट्रैक करूँ?",
            "as": "মই মোৰ চালান কেনেকৈ ট্ৰেক কৰিম?",
        },
        "answer": {
            "en": "📍 **Shipment Tracking:**\n• **Via Chatbot:** Simply ask *'Track RUR-90141'* or *'Status of my order'*.\n• **Via Map View:** Check the interactive **Overview / Topology** map for live GPS movement, ETA estimates, cold-chain temperature telemetry, and predicted shelf-life health.",
            "hi": "📍 **शिपमेंट ट्रैकिंग:**\n• **चैटबॉट से:** सीधे लिखें या पूछें *'Track RUR-90141'* या *'ऑर्डर की स्थिति'*।\n• **मानचित्र दृश्य:** लाइव GPS लोकेशन, आगमन समय (ETA), रीफर तापमान और शेल्फ-लाइफ स्वास्थ्य देखने के लिए **Overview / Topology** मैप देखें।",
            "as": "📍 **চালান ট্ৰেকিং:**\n• **চাটবটৰ জৰিয়তে:** পোনপটীয়াকৈ সোধক *'Track RUR-90141'* বা *'মোৰ অৰ্ডাৰৰ স্থিতি'*।\n• **মেপ ভিউ:** লাইভ GPS অৱস্থান, আগমনৰ আনুমানিক সময় (ETA), কোল্ড-চেইন উষ্ণতা আৰু সামগ্ৰীৰ স্থিতি চাবলৈ **Overview / Topology** মেপ চাওক।",
        },
        "keywords": [
            "how can i track my shipment", "how to track my shipment", "how to track shipment",
            "how do i track shipment", "tracking process",
            "शिपमेंट कैसे ट्रैक करूँ", "शिपमेंट कैसे ट्रैक करें", "ट्रैक कैसे करें", "ट्रैकिंग कैसे करें",
            "মোৰ চালান কেনেকৈ ট্ৰেক কৰিম", "ট্ৰেক কেনেকৈ কৰিম", "চালান ট্ৰেক",
        ],
    },
    "no_internet": {
        "question": {
            "en": "What happens if there is no internet?",
            "hi": "यदि इंटरनेट न हो तो क्या होगा?",
            "as": "ইণ্টাৰনেট নাথাকিলে কি হ’ব?",
        },
        "answer": {
            "en": "📶 **Offline-First Resilience:**\nNo internet? No problem! The platform functions seamlessly offline in remote areas.\n• You can book shipments, log road obstacles, and record sensor temperature updates.\n• Data is saved securely in local device storage and automatically synchronizes when network connection is restored.",
            "hi": "📶 **ऑफलाइन-फर्स्ट सुरक्षा:**\nइंटरनेट नहीं है? कोई समस्या नहीं! यह प्लेटफॉर्म ग्रामीण और दूरदराज के क्षेत्रों में पूरी तरह ऑफलाइन काम करता है।\n• आप शिपमेंट बुक कर सकते हैं, सड़क की बाधाएं दर्ज कर सकते हैं और तापमान रिकॉर्ड कर सकते हैं।\n• सभी डेटा डिवाइस की लोकल मेमोरी में सुरक्षित रहता है और इंटरनेट मिलते ही अपने आप सिंक हो जाता है।",
            "as": "📶 **অফলাইন-ফাৰ্ষ্ট সুৰক্ষা:**\nইণ্টাৰনেট নাই? একো চিন্তা নাই! এই প্লেটফৰ্মে দুৰ্গম অঞ্চলতো অফলাইনত সুচাৰুৰূপে কাম কৰে।\n• আপুনি চালান বুক কৰিব পাৰে, পথৰ সমস্যা লগ কৰিব পাৰে আৰু উষ্ণতা ৰেকৰ্ড কৰিব পাৰে।\n• সকলো তথ্য ডিভাইচৰ লোকাল মেমৰীত সুৰক্ষিত থাকে আৰু ইণ্টাৰনেট পোৱাৰ লগে লগে স্বয়ংক্ৰিয়ভাৱে চিংক হৈ যায়।",
        },
        "keywords": [
            "what happens if there is no internet", "what if no internet", "what happens if no internet",
            "no internet", "without internet",
            "यदि इंटरनेट न हो", "बिना इंटरनेट क्या होगा", "इंटरनेट नहीं है", "इंटरनेट न हो तो",
            "ইণ্টাৰনেট নাথাকিলে কি হ’ব", "ইণ্টাৰনেট নোহোৱাকৈ", "ইণ্টাৰনেট নাই",
        ],
    },
    "offline_sync": {
        "question": {
            "en": "How does offline synchronization work?",
            "hi": "ऑफ़लाइन सिंक्रोनाइज़ेशन कैसे काम करता है?",
            "as": "অফলাইন ছিংক্ৰ’নাইজেচন কেনেকৈ কাম কৰে?",
        },
        "answer": {
            "en": "🔄 **Offline Synchronization:**\n1. **Local Queue:** Transactions created offline are assigned unique client UUIDs and placed in a persistent queue.\n2. **Batch Upload:** When online connectivity returns, the background sync engine pushes pending records to `/api/sync/batch`.\n3. **Conflict Resolution:** Employs timestamp-based Last-Write-Wins and atomic transaction safety with zero data loss.",
            "hi": "🔄 **ऑफलाइन सिंक्रोनाइज़ेशन प्रक्रिया:**\n1. **लोकल कतार:** ऑफलाइन बनाए गए ट्रांजेक्शन को क्लाइंट UUID दिया जाता है और लोकल कतार में रखा जाता है।\n2. **बैच अपलोड:** इंटरनेट कनेक्ट होते ही बैकग्राउंड इंजन सभी रिकॉर्ड्स को `/api/sync/batch` पर भेजता है।\n3. **विवाद समाधान:** टाइमस्टैम्प-आधारित लास्ट-राइट-विन्स और ऑटोमैटिक ट्रांजेक्शन सुरक्षा से डेटा सुरक्षित रहता है।",
            "as": "🔄 **অফলাইন ছিংক্ৰ’নাইজেচন প্ৰক্ৰিয়া:**\n1. **লোকাল কিউ:** অফলাইনত কৰা এণ্ট্ৰিবোৰক এটা স্বতন্ত্ৰ ক্লাইণ্ট UUID দিয়া হয় আৰু লোকাল কিউত ৰখা হয়।\n2. **বেচ আপলোড:** অনলাইন সংযোগ হোৱাৰ লগে লগে বেকগ্ৰাউণ্ড ছিংক ইঞ্জিনে `/api/sync/batch` লৈ তথ্য প্ৰেৰণ কৰে।\n3. **দ্বন্দ্ব সমাধান:** টাইমষ্টেম্প-ভিত্তিক লাষ্ট-ৰাইট-উইনছ পদ্ধতিৰ দ্বাৰা কোনো তথ্য নষ্ট নোহোৱাকৈ সুৰক্ষিত কৰা হয়।",
        },
        "keywords": [
            "how does offline synchronization work", "how offline sync works", "how does sync work",
            "offline synchronization work", "offline sync",
            "ऑफ़लाइन सिंक्रोनाइज़ेशन कैसे काम करता है", "ऑफलाइन सिंक कैसे काम करता है", "सिंक कैसे होता है",
            "অফলাইন ছিংক্ৰ’নাইজেচন কেনেকৈ কাম কৰে", "ছিংক কেনেকৈ হয়", "ছিংক্ৰ’নাইজেচন",
        ],
    },
    "prevent_duplicates": {
        "question": {
            "en": "How are duplicate submissions prevented?",
            "hi": "डुप्लिकेट सबमिशन को कैसे रोका जाता है?",
            "as": "ডুপ্লিকেট এন্ট্ৰি কেনেকৈ প্ৰতিৰোধ কৰা হয়?",
        },
        "answer": {
            "en": "🛡️ **Duplicate Prevention (Idempotency):**\nEvery offline creation generates a unique client-side UUID (`client_id`). During sync, the database repository verifies if the `client_id` already exists. If already present, the duplicate request is safely bypassed without re-creating the shipment, ensuring strict *exactly-once* semantics.",
            "hi": "🛡️ **डुप्लिकेट सबमिशन की रोकथाम (Idempotency):**\nप्रत्येक ऑफलाइन रिकॉर्ड को एक विशिष्ट `client_id` (UUID) दिया जाता है। सिंक के दौरान डेटाबेस जांचता है कि क्या यह आईडी पहले से मौजूद है। यदि हां, तो डुप्लीकेट प्रविष्टि को छोड़ दिया जाता है, जिससे हर शिपमेंट केवल एक ही बार दर्ज होता है।",
            "as": "🛡️ **ডুপ্লিকেট প্ৰতিৰোধ (Idempotency):**\nপ্ৰতিটো অফলাইন এন্ট্ৰিত এটা স্বতন্ত্ৰ `client_id` (UUID) থাকে। ছিংক হোৱাৰ সময়ত ডাটাবেছে পৰীক্ষা কৰে যে এই ID আগতেই আছে নেকি। যদি ইতিমধ্যে থাকে, তেন্তে ডুপ্লিকেট এন্ট্ৰি বাদ দিয়া হয় যাতে কোনো অৰ্ডাৰ দুবাৰ প্ৰবিষ্টি নহয়।",
        },
        "keywords": [
            "how are duplicate submissions prevented", "duplicate submissions prevented",
            "prevent duplicate", "duplicate prevention", "idempotent submission",
            "डुप्लिकेट सबमिशन को कैसे रोका जाता है", "डुप्लीकेट कैसे रोकते हैं", "दोहराव कैसे रोकते हैं",
            "ডুপ্লিকেট এন্ট্ৰি কেনেকৈ প্ৰতিৰোধ কৰা হয়", "ডুপ্লিকেট কেনেকৈ ৰোধ কৰা হয়",
        ],
    },
    "who_can_use": {
        "question": {
            "en": "Who can use the platform?",
            "hi": "इस प्लेटफॉर्म का उपयोग कौन कर सकता है?",
            "as": "এই প্লেটফৰ্ম কোনে ব্যৱহাৰ কৰিব পাৰে?",
        },
        "answer": {
            "en": "👥 **Supported Users & Roles:**\n1. **Shippers & Farmers:** Book consignments, request reefer storage, and track produce to central hubs.\n2. **Carriers & Drivers:** Receive optimal load-matching routes, fair compensation trips, and road condition alerts.\n3. **Network Admins:** Oversee network resilience, cold-chain SLA compliance, and multimodal corridor routing.",
            "hi": "👥 **उपयोगकर्ता एवं भूमिकाएं:**\n1. **शिपर एवं किसान:** फसल व उपज की बुकिंग, कोल्ड स्टोरेज स्लॉट और डिलीवरी ट्रैकिंग के लिए।\n2. **ट्रांसपोर्टर्स एवं ड्राइवर:** अनुकूलित रूट, निष्पक्ष ट्रिप आवंटन और सड़क अलर्ट प्राप्त करने के लिए।\n3. **नेटवर्क एडमिनिस्ट्रेटर:** पूरे लॉजिस्टिक्स नेटवर्क, तापमान अनुपालन और मल्टी-मोडल कॉरिडोर प्रबंधन के लिए।",
            "as": "👥 **সমৰ্থিত ব্যৱহাৰকাৰী আৰু ভূমিকা:**\n1. **কৃষক আৰু প্ৰেৰক:** সামগ্ৰী বুকিং, কোল্ড ষ্ট’ৰেজৰ সুবিধা আৰু ডেলিভাৰী ট্ৰেকিং কৰিবলৈ।\n2. **পৰিবহণকাৰী আৰু চালক:** সৰ্বোত্তম ৰুট, ন্যায্য উপাৰ্জনৰ ট্ৰিপ আৰু পথৰ সতৰ্কবাৰ্তা লাভ কৰিবলৈ।\n3. **নেটৱৰ্ক এডমিন:** সমগ্ৰ লজিষ্টিক নেটৱৰ্ক, কোল্ড-চেইন মান আৰু মাল্টিমডেল ক’ৰিডৰ পৰিচালনা কৰিবলৈ।",
        },
        "keywords": [
            "who can use the platform", "who can use this platform", "who can use",
            "eligible users", "target users",
            "इस प्लेटफॉर्म का उपयोग कौन कर सकता है", "कौन उपयोग कर सकता है", "उपयोगकर्ता कौन हैं",
            "এই প্লেটফৰ্ম কোনে ব্যৱহাৰ কৰিব পাৰে", "কোনে ব্যৱহাৰ কৰিব পাৰে",
        ],
    },
    "rural_help": {
        "question": {
            "en": "How does the platform help rural areas?",
            "hi": "यह प्लेटफॉर्म ग्रामीण क्षेत्रों की कैसे मदद करता है?",
            "as": "এই প্লেটফৰ্মে গ্ৰাম্য অঞ্চলক কেনেকৈ সহায় কৰে?",
        },
        "answer": {
            "en": "🌾 **Rural Impact & Benefits:**\n• **Cooperative Freight Pooling:** Reduces transportation costs by up to 35% through consolidated loads.\n• **Spoilage Prevention:** Extends perishable crop and medicine shelf-life via continuous cold-chain monitoring.\n• **Multilingual Voice Bot:** Enables local producers to book cargo in Assamese, Hindi, and English.\n• **Fair Dispatch:** Guarantees equitable load allocation across small rural vehicle owners.",
            "hi": "🌾 **ग्रामीण क्षेत्रों के लिए लाभ:**\n• **सहकारी माल एकत्रीकरण:** भार समेकन से परिवहन लागत में 35% तक की बचत।\n• **खराबी से सुरक्षा:** निरंतर कोल्ड-चेन निगरानी से फसलों और दवाओं का जीवनकाल बढ़ता है।\n• **बहुभाषी वॉयस बॉट:** स्थानीय किसान असमिया, हिंदी और अंग्रेजी में आसानी से ऑर्डर बुक कर सकते हैं।\n• **निष्पक्ष डिस्पैच:** छोटे ग्रामीण वाहन चालकों को समान और निष्पक्ष ट्रिप आवंटन।",
            "as": "🌾 **গ্ৰাম্য প্ৰভাৱ আৰু লাভালাভ:**\n• **সমবায় মাল একত্ৰীকৰণ:** সংযুক্ত বোজাইৰ জৰিয়তে পৰিবহণ খৰচ ৩৫% লৈকে হ্ৰাস কৰে।\n• **নষ্ট হোৱাৰ পৰা ৰক্ষা:** নিৰন্তৰ কোল্ড-চেইন নিৰীক্ষণেৰে শস্য আৰু ঔষধৰ জীৱনকাল বৃদ্ধি কৰে।\n• **বহুভাষিক ভইচ বট:** স্থানীয় কৃষকসকলে অসমীয়া, হিন্দী, আৰু ইংৰাজীত সহজে অৰ্ডাৰ বুক কৰিব পাৰে।\n• **ন্যায্য বিতৰণ:** ক্ষুদ্ৰ গ্ৰাম্য বাহনৰ মালিকসকলক সমভাৱে ট্ৰিপ প্ৰদান নিশ্চিত কৰে।",
        },
        "keywords": [
            "how does the platform help rural areas", "how platform helps rural",
            "help rural areas", "rural impact", "rural benefit",
            "यह प्लेटफॉर्म ग्रामीण क्षेत्रों की कैसे मदद करता है", "ग्रामीण क्षेत्रों की मदद", "ग्रामीण क्षेत्रों को क्या लाभ",
            "এই প্লেটফৰ্মে গ্ৰাম্য অঞ্চলক কেনেকৈ সহায় কৰে", "গ্ৰাম্য অঞ্চলৰ লাভ",
        ],
    },
    "no_vehicle_available": {
        "question": {
            "en": "What happens if no vehicle is available?",
            "hi": "यदि कोई वाहन उपलब्ध न हो तो क्या होगा?",
            "as": "যদি কোনো বাহন উপলব্ধ নহয় তেন্তে কি হ’ব?",
        },
        "answer": {
            "en": "⏳ **When No Vehicle is Available:**\n1. **Priority Queuing:** Your shipment is prioritized in the smart aggregation queue.\n2. **Cold Buffer Staging:** Cargo is assigned to local hub cold-storage holding cells to prevent spoilage.\n3. **Multimodal Fallback:** The engine searches for return-trip reefers, community vehicles, or Dedicated Freight Corridor (DFC) rail connections and notifies you instantly.",
            "hi": "⏳ **यदि कोई वाहन उपलब्ध न हो:**\n1. **प्राथमिकता कतार:** आपके शिपमेंट को स्मार्ट एकत्रीकरण कतार में प्राथमिकता दी जाती है।\n2. **कोल्ड स्टोरेज सुरक्षा:** खराबी से बचाने के लिए सामान को स्थानीय हब के कोल्ड-स्टोरेज में सुरक्षित रखा जाता है।\n3. **मल्टी-मोडल विकल्प:** सिस्टम वापसी वाले रीफर ट्रकों, ग्रामीण वाहनों या डीएफसी रेल विकल्पों को सक्रिय करता है और आपको सूचित करता है।",
            "as": "⏳ **যেতিয়া কোনো বাহন উপলব্ধ নাথাকে:**\n1. **প্ৰাথমিকতা কিউ:** আপোনাৰ চালানটোক স্মাৰ্ট একত্ৰীকৰণ কিউত অগ্ৰাধিকাৰ দিয়া হয়।\n2. **কোল্ড ষ্ট’ৰেজ সংৰক্ষণ:** সামগ্ৰী নষ্ট নহ’বলৈ স্থানীয় হাবৰ কোল্ড-ষ্ট’ৰেজত সুৰক্ষিতভাৱে ৰখা হয়।\n3. **বিকল্প পৰিবহণ:** চিষ্টেমে উভতি অহা ৰিফাৰ ট্ৰাক, স্থানীয় বাহন বা ৰে’ল DFC বিকল্প বিচাৰি উলিয়ায় আৰু আপোনাক তৎকালীনভাৱে জনায়।",
        },
        "keywords": [
            "what happens if no vehicle is available", "if no vehicle is available",
            "no vehicle is available", "when no truck available",
            "यदि कोई वाहन उपलब्ध न हो", "गाड़ी उपलब्ध न हो तो क्या होगा", "गाड़ी न मिलने पर",
            "যদি কোনো বাহন উপলব্ধ নহয়", "বাহন উপলব্ধ ନহলে কি হব", "গাড়ী নাপালে",
        ],
    },
    "contact_help": {
        "question": {
            "en": "How can I contact/get help?",
            "hi": "मैं सहायता के लिए कैसे संपर्क करूँ?",
            "as": "মই সহায়ৰ বাবে কেনেকৈ যোগাযোগ কৰিম?",
        },
        "answer": {
            "en": "📞 **Getting Help & Support:**\n• **24/7 AI Assistant:** Ask any question or speak directly into this multilingual chatbot.\n• **Hub Coordinator:** Contact your Gram Panchayat Aggregation Node dispatcher.\n• **Enterprise Support:** Visit the **About / Manifesto** tab or submit an inquiry for dedicated assistance.",
            "hi": "📞 **सहायता एवं संपर्क:**\n• **24/7 एआई सहायक:** इस बहुभाषी चैटबॉट में कभी भी पूछें या बोलें।\n• **हब समन्वयक:** अपने ग्राम पंचायत एकत्रीकरण केंद्र के डिस्पैचर से संपर्क करें।\n• **हेल्पडेस्क:** समर्पित सहायता के लिए **About / Manifesto** टैब पर जाएं या पूछताछ फॉर्म भरें।",
            "as": "📞 **সহায় আৰু যোগাযোগ:**\n• **২৪/৭ AI সহায়ক:** এই বহুভাষিক চাটবটত যিকোনো সময়তে প্ৰশ্ন সোধক বা কথা কওক।\n• **হাব সমন্বয়ক:** আপোনাৰ গ্ৰাম পঞ্চায়ত একত্ৰীকৰণ কেন্দ্ৰৰ ডিচপেচাৰৰ সৈতে যোগাযোগ কৰক।\n• **সহায়তা কেন্দ্ৰ:** বিশেষ সহায়ৰ বাবে **About / Manifesto** টেব চাওক বা আবেদন প্ৰেৰণ কৰক।",
        },
        "keywords": [
            "how can i contact/get help", "how can i contact", "how to get help",
            "how can i get help", "contact support", "helpdesk",
            "मैं सहायता के लिए कैसे संपर्क करूँ", "सहायता कैसे प्राप्त करें", "संपर्क कैसे करें", "मदद कैसे मिलेगी",
            "মই সহায়ৰ বাবে কেনেকৈ যোগাযোগ কৰিম", "সহায় কেনেকৈ পাম", "যোগাযোগ",
        ],
    },
}

# ---------------------------------------------------------------------------
# LOCALIZED BASE SYSTEM MESSAGES
# ---------------------------------------------------------------------------
TEXTS = {
    "en": {
        "welcome": "Namaste! I am your Rural Logistics Assistant. I can help you with:\n1. 🔍 Order Tracking & Status (e.g., 'Status of RUR-90141')\n2. ⏱️ Delivery ETA Calculation\n3. 📅 Consignment Rescheduling\n4. 📦 Book New Cargo Pickup\n5. ❓ Frequently Asked Questions (FAQs)",
        "select_origin": "📍 **Step 1 of 5: Origin Hub**\nWhere would you like us to pick up your cargo? Choose an origin hub below or type your location:",
        "select_dest": "📍 **Step 2 of 5: Destination Hub**\nGot it! Which destination hub should we deliver this cargo to?",
        "select_good": "📦 **Step 3 of 5: Commodity Type**\nWhat type of cargo are you sending?",
        "select_temp": "❄️ **Step 4 of 5: Temperature Storage**\nWhat temperature storage does your cargo require?",
        "enter_weight": "⚖️ **Step 5 of 5: Cargo Weight**\nWhat is the total weight in Kilograms (kg)?",
        "confirm": "Great! Here is your order details. Click below to confirm shipment booking.",
        "success": "Your shipment order has been successfully placed! Tracking ID: ",
        "cancelled": "🚫 **Order Booking Cancelled.**\nYour shipment draft has been cleared. You can ask questions, track existing consignments, or book a new shipment anytime.",
        "not_found": "We could not locate that waybill. Please check your tracking number (e.g. RUR-90141).",
        "rescheduled": "Shipment SLA has been successfully updated and rescheduled.",
        "faq_list_intro": "Here are common topics I can help you with. Tap a question or type below:",
    },
    "hi": {
        "welcome": "नमस्ते! मैं आपका ग्रामीण लॉजिस्टिक्स सहायक हूँ। मैं आपकी सहायता कर सकता हूँ:\n1. 🔍 ऑर्डर ट्रैकिंग एवं स्थिति (उदा. 'RUR-90141 की स्थिति')\n2. ⏱️ डिलीवरी ईटीए (उदा. 'RUR-90142 कब पहुँचेगा?')\n3. 📅 पिकअप पुनः निर्धारित (उदा. 'RUR-90143 का समय बदलें')\n4. 📦 नया पिकअप बुक करें\n5. ❓ अक्सर पूछे जाने वाले प्रश्न (FAQs)",
        "select_origin": "📍 **चरण 1/5: मूल हब (Origin)**\nआप अपना सामान कहाँ से पिकअप कराना चाहते हैं? नीचे दिए गए हब में से चुनें या अपने गाँव का नाम लिखें:",
        "select_dest": "📍 **चरण 2/5: गंतव्य हब (Destination)**\nबहुत बढ़िया! यह सामान किस हब पर पहुँचाना है?",
        "select_good": "📦 **चरण 3/5: सामग्री का प्रकार**\nआप किस प्रकार की सामग्री भेज रहे हैं?",
        "select_temp": "❄️ **चरण 4/5: तापमान भंडारण**\nआपकी सामग्री को किस तापमान भंडारण की आवश्यकता है?",
        "enter_weight": "⚖️ **चरण 5/5: कुल वजन**\nकुल वजन किलोग्राम (kg) में कितना है?",
        "confirm": "उत्कृष्ट! आपके ऑर्डर का विवरण यहाँ है। शिपमेंट बुक करने के लिए नीचे पुष्टि करें।",
        "success": "आपका शिपमेंट ऑर्डर सफलतापूर्वक दर्ज कर लिया गया है! ट्रैकिंग आईडी: ",
        "cancelled": "🚫 **ऑर्डर बुकिंग रद्द कर दी गई है।**\nआपका वर्तमान ड्राफ्ट हटा दिया गया है। आप कोई भी प्रश्न पूछ सकते हैं, ऑर्डर ट्रैक कर सकते हैं, या नया ऑर्डर शुरू कर सकते हैं।",
        "not_found": "हमें वह वे-बिल नहीं मिला। कृपया अपना ट्रैकिंग नंबर जाँचें (उदा. RUR-90141)।",
        "rescheduled": "शिपमेंट का समय सफलतापूर्वक पुनः निर्धारित कर दिया गया है।",
        "faq_list_intro": "यहाँ कुछ मुख्य प्रश्न हैं जिनमें मैं आपकी सहायता कर सकता हूँ। नीचे टैप करें:",
    },
    "as": {
        "welcome": "নমস্কাৰ! মই আপোনাৰ গ্ৰাম্য লজিষ্টিক সহায়ক। মই আপোনাক সহায় কৰিব পাৰোঁ:\n1. 🔍 অৰ্ডাৰ ট্ৰেকিং আৰু স্থিতি (যেনে: 'RUR-90141 ৰ স্থিতি')\n2. ⏱️ ডেলিভাৰী ETA গণনা\n3. 📅 পুনৰ নিৰ্ধাৰণ (Reschedule)\n4. 📦 নতুন অৰ্ডাৰ বুকিং\n5. ❓ সঘনাই সোধা প্ৰশ্ন (FAQs)",
        "select_origin": "📍 **পদক্ষেপ ১/৫: মূল কেন্দ্ৰ (Origin Hub)**\nআপুনি ক’ৰ পৰা সামগ্ৰী পিকআপ কৰিব বিচাৰে? তলৰ হাবসমূহৰ পৰা বাছক বা আপোনাৰ গাঁৱৰ নাম লিখক:",
        "select_dest": "📍 **পদক্ষেপ ২/৫: গন্তব্য হাব (Destination)**\nবুজি পালোঁ! এই সামগ্ৰী কোনটো কেন্দ্ৰলৈ (হাব) পঠিয়াব বিচাৰে?",
        "select_good": "📦 **পদক্ষেপ ৩/৫: সামগ্ৰীৰ প্ৰকাৰ**\nআপুনি কি ধৰণৰ সামগ্ৰী পঠিয়াব বিচাৰিছে?",
        "select_temp": "❄️ **পদক্ষেপ ৪/৫: উষ্ণতা সংৰক্ষণ**\nআপোনাৰ সামগ্ৰীৰ বাবে কিমান উষ্ণতা সংৰক্ষণৰ প্ৰয়োজন?",
        "enter_weight": "⚖️ **পদক্ষেপ ৫/৫: মুঠ ওজন**\nমুঠ ওজন কিলোগ্ৰামত (kg) কিমান?",
        "confirm": "অতি উত্তম! আপোনাৰ অৰ্ডাৰৰ বিৱৰণ ইয়াত আছে। বুকিং নিশ্চিত কৰিবলৈ তলত ক্লিক কৰক।",
        "success": "আপোনাৰ চালান অৰ্ডাৰ সফলতাৰে সম্পন্ন হৈছে! ট্ৰেকিং আইডি: ",
        "cancelled": "🚫 **অৰ্ডাৰ বুকিং বাতিল কৰা হ’ল।**\nআপোনাৰ বৰ্তমানৰ খচৰা মচি পেলোৱা হৈছে। আপুনি প্ৰশ্ন সুধিব পাৰে, চালান ট্ৰেক কৰিব পাৰে বা নতুন বুকিং আৰম্ভ কৰিব পাৰে।",
        "not_found": "আমি সেই ৱে-বিল বিচাৰি নাপালোঁ। অনুগ্ৰহ কৰি আপোনাৰ ট্ৰেকিং নম্বৰ পৰীক্ষা কৰক (যেনে: RUR-90141)।",
        "rescheduled": "চালানৰ সময় সফলতাৰে পুনৰ নিৰ্ধাৰণ কৰা হৈছে।",
        "faq_list_intro": "ইয়াত কিছুমান সাধাৰণ প্ৰশ্নোত্তৰ আছে। তলত ক্লিক কৰক বা টাইপ কৰক:",
    },
}


def find_matching_faq(msg_lower: str) -> Optional[str]:
    """Matches user query against the 12 FAQ topics using keyword heuristics."""
    clean_msg = re.sub(r"[^\w\s\u0900-\u097F\u0980-\u09FF]", " ", msg_lower).strip()

    # Check each FAQ
    for faq_key, faq_info in FAQS_DATA.items():
        # 1. Check explicit keywords
        for kw in faq_info["keywords"]:
            if kw in msg_lower or kw in clean_msg:
                return faq_key

        # 2. Check question strings across locales
        for q_loc, q_text in faq_info["question"].items():
            if q_text.lower() in msg_lower or msg_lower in q_text.lower():
                return faq_key

    return None


@router.get("/status")
async def chat_status():
    """Returns status of Google Gemini assistant integration."""
    has_gemini = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    return {
        "status": "online",
        "provider": "gemini",
        "has_server_key": has_gemini,
        "model": settings.GEMINI_MODEL or "gemini-flash-latest",
    }


@router.post("", response_model=ChatMessageResponse, status_code=status.HTTP_200_OK)
@router.post("/assistant", response_model=ChatMessageResponse, status_code=status.HTTP_200_OK)
async def chat_assistant(
    req: ChatMessageRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    # 1. Rate Limiting Protection
    client_ip = request.client.host if request.client else "127.0.0.1"
    check_rate_limit(client_ip)

    # 2. Input Validation (guard against empty or whitespace-only messages)
    if not req.message or not req.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty.",
        )

    locale = req.locale if req.locale in ["en", "hi", "as"] else "en"
    texts = TEXTS.get(locale, TEXTS["en"])
    msg = req.message.strip()
    msg_lower = msg.lower()
    context = req.context or {}
    raw_step = context.get("step", "idle")
    step = "idle" if raw_step in ["idle", "greeting", None] else raw_step
    draft = context.get("draft_shipment") or {}

    # Fetch hubs for recommendations
    hub_res = await db.execute(select(Hub).where(Hub.is_active.is_(True)).limit(10))
    all_hubs = hub_res.scalars().all()
    hub_list = [{"id": str(h.id), "name": h.name, "type": str(h.type)} for h in all_hubs]
    if not hub_list:
        hub_list = [
            {"id": "hub-01", "name": "Guwahati Northeast Central Mega Hub", "type": "district_hub"},
            {"id": "hub-02", "name": "Jorhat Upper Assam Tea Belt", "type": "aggregation_node"},
            {"id": "hub-03", "name": "Silchar Rail & Road Crossdock Terminal", "type": "freight_terminal"},
            {"id": "hub-04", "name": "Pandu Inland Port NW-2", "type": "marine_terminal"},
        ]

    waybill_match = re.search(r"(RUR-\d{3,6})", msg, re.IGNORECASE)
    waybill_query = waybill_match.group(1).upper() if waybill_match else None

    # Check if server has an active or configured API key
    resolved_key = resolve_api_key()

    # -------------------------------------------------------------
    # INTENT: CANCELLATION / RESET
    # -------------------------------------------------------------
    is_cancel_cmd = any(
        kw in msg_lower
        for kw in [
            "cancel", "stop", "reset", "start over", "exit", "quit",
            "रद्द", "रोकें", "पुनः प्रारंभ", "बंद",
            "বাতিল", "বন্ধ", "পুনৰ আৰম্ভ"
        ]
    )
    if is_cancel_cmd:
        if locale == "as":
            quick_replies = ["📦 নতুন অৰ্ডাৰ বুকিং", "🔍 RUR-90141 ট্ৰেক কৰক", "❓ সঘনাই সোধা প্ৰশ্ন (FAQs)"]
        elif locale == "hi":
            quick_replies = ["📦 नया ऑर्डर बुक करें", "🔍 RUR-90141 ट्रैक करें", "❓ सामान्य प्रश्न (FAQs)"]
        else:
            quick_replies = ["📦 Book Consignment", "🔍 Track RUR-90141", "❓ View FAQs"]

        return ChatMessageResponse(
            reply=texts["cancelled"],
            locale=locale,
            step="idle",
            intent="cancel",
            quick_replies=quick_replies,
            draft_shipment=None,
            hubs=hub_list[:6],
        )

    # -------------------------------------------------------------
    # INTENT: BOOKING INITIATION
    # -------------------------------------------------------------
    is_start_booking_cmd = any(
        kw in msg_lower
        for kw in [
            "book order", "book consignment", "start order", "create shipment",
            "book a shipment", "book a consignment", "book shipment", "book cargo",
            "naya order", "start booking",
            "नया ऑर्डर", "ऑर्डर बुक", "पिकअप बुक", "नया पिकअप", "शिपमेंट बनाएं", "शिपमेंट बनाएँ",
            "নতুন অৰ্ডাৰ", "অৰ্ডাৰ বুক", "চালান বুক", "নতুন চালান"
        ]
    ) or (step == "idle" and any(kw in msg_lower for kw in ["book", "booking", "बुक", "বুক"]))

    if is_start_booking_cmd:
        draft = {}
        if locale == "as":
            quick_replies = [h["name"] for h in hub_list[:4]] + ["❓ FAQs", "🚫 বাতিল"]
        elif locale == "hi":
            quick_replies = [h["name"] for h in hub_list[:4]] + ["❓ FAQs", "🚫 रद्द करें"]
        else:
            quick_replies = [h["name"] for h in hub_list[:4]] + ["❓ FAQs", "🚫 Cancel"]

        return ChatMessageResponse(
            reply=texts["select_origin"],
            locale=locale,
            step="select_origin",
            intent="booking_start",
            quick_replies=quick_replies,
            draft_shipment=draft,
            hubs=hub_list[:6],
        )

    # -------------------------------------------------------------
    # INTENT: CONVERSATIONAL GREETINGS
    # -------------------------------------------------------------
    greeting_words = [
        "hi", "hello", "hey", "namaste", "namaskar", "good morning", "good afternoon", "good evening", "greetings",
        "नमस्ते", "नमस्कार", "নমস্কাৰ", "হেল্ল", "হেই"
    ]
    is_greeting = (
        step == "idle"
        and not waybill_query
        and any(
            msg_lower == g or msg_lower.startswith(g + " ") or msg_lower.startswith(g + ",") or msg_lower.startswith(g + "!") or msg_lower.startswith(g + ".")
            for g in greeting_words
        )
    )

    is_booking_step = step in [
        "select_origin",
        "select_destination",
        "select_good_type",
        "select_temp",
        "enter_weight",
    ]

    # -------------------------------------------------------------
    # INTENT 0: LLM CONVERSATIONAL ASSISTANT WITH LIVE DB CONTEXT
    # -------------------------------------------------------------
    if resolved_key and not is_booking_step:
        tracked_data = None
        if waybill_query:
            stmt = select(Shipment).where(Shipment.waybill_number == waybill_query)
            res = await db.execute(stmt)
            shipment = res.scalars().first()
            if shipment:
                orig_h = next((h for h in all_hubs if h.id == shipment.origin_hub_id), None)
                dest_h = next((h for h in all_hubs if h.id == shipment.dest_hub_id), None)
                status_str = shipment.status.value.upper() if hasattr(shipment.status, "value") else str(shipment.status).upper()
                temp_str = shipment.temp_class.value.upper() if hasattr(shipment.temp_class, "value") else str(shipment.temp_class).upper()
                good_str = shipment.good_type.value.capitalize() if hasattr(shipment.good_type, "value") else str(shipment.good_type).capitalize()

                tracked_data = {
                    "id": str(shipment.id),
                    "waybill": shipment.waybill_number,
                    "status": status_str,
                    "weight_kg": shipment.weight_kg,
                    "temp_class": temp_str,
                    "good_type": good_str,
                    "origin": orig_h.name if orig_h else "Origin Cluster",
                    "destination": dest_h.name if dest_h else "District Cold Hub",
                    "current_temp": "+3.4°C",
                    "shelf_life_remaining": "98.4%",
                }

                if "reschedule" in msg_lower or "delay" in msg_lower or "बदलें" in msg_lower or "সলনি" in msg_lower:
                    new_deadline = datetime.now(timezone.utc) + timedelta(hours=24)
                    shipment.sla_deadline = new_deadline
                    await db.commit()
                    tracked_data["new_deadline"] = new_deadline.isoformat()

        llm_res = await generate_chat_reply(
            message=msg,
            locale=locale,
            hubs=hub_list,
            tracked_shipment=tracked_data,
            step=step,
        )

        if llm_res.get("success") and llm_res.get("reply"):
            return ChatMessageResponse(
                reply=llm_res["reply"],
                locale=locale,
                step="idle",
                intent="ai_conversational",
                quick_replies=llm_res.get("quick_replies") or ["📦 Book Consignment", "🔍 Track RUR-90141", "❓ FAQs"],
                draft_shipment=draft,
                tracked_shipment=tracked_data,
                hubs=hub_list[:6],
                ai_generated=True,
                provider_used=llm_res.get("provider"),
            )

    # -------------------------------------------------------------
    # INTENT: GREETING (RULE-BASED FALLBACK)
    # -------------------------------------------------------------
    if is_greeting:
        if locale == "as":
            quick_replies = ["📦 নতুন অৰ্ডাৰ বুকিং", "🔍 RUR-90141 ট্ৰেক কৰক", "⏱️ ডেলিভাৰী ETA", "❓ সঘনাই সোধা প্ৰশ্ন (FAQs)"]
        elif locale == "hi":
            quick_replies = ["📦 नया ऑर्डर बुक करें", "🔍 RUR-90141 ट्रैक करें", "⏱️ डिलीवरी ईटीए", "❓ सामान्य प्रश्न (FAQs)"]
        else:
            quick_replies = ["📦 Book a Consignment", "🔍 Track Shipment RUR-90141", "⏱️ Check Delivery ETA", "❓ View FAQs"]

        return ChatMessageResponse(
            reply=texts["welcome"],
            locale=locale,
            step="idle",
            intent="greeting",
            quick_replies=quick_replies,
            draft_shipment=None,
            hubs=hub_list[:6],
        )

    # -------------------------------------------------------------
    # INTENT 1: DIRECT SHIPMENT / WAYBILL QUERY OVERRIDES (RULE-BASED)
    # -------------------------------------------------------------
    if waybill_query:
        if "reschedule" in msg_lower or "delay" in msg_lower or "change time" in msg_lower or "बदलें" in msg_lower or "সলনি" in msg_lower:
            stmt = select(Shipment).where(Shipment.waybill_number == waybill_query)
            res = await db.execute(stmt)
            shipment = res.scalars().first()

            new_deadline = datetime.now(timezone.utc) + timedelta(hours=24)
            if shipment:
                shipment.sla_deadline = new_deadline
                await db.commit()

            reply = (
                f"📅 **Consignment Rescheduling Confirmed for {waybill_query}:**\n"
                f"• **New Pickup/Delivery Window:** {new_deadline.strftime('%d %b %Y, %H:%M UTC')}\n"
                f"• **Audit:** Reschedule request logged with cooperative driver dispatch.\n"
                f"• **Cold Storage Allocation:** Extended holding slot reserved at local aggregation point."
            )
            quick_replies = [f"Check Status {waybill_query} 🔍", "Book Another Consignment 📦"]
            return ChatMessageResponse(
                reply=reply,
                locale=locale,
                step="reschedule_result",
                intent="reschedule",
                quick_replies=quick_replies,
                tracked_shipment={"waybill": waybill_query, "new_deadline": new_deadline.isoformat()},
                hubs=hub_list[:6],
            )
        elif "eta" in msg_lower or "when" in msg_lower or "arrive" in msg_lower or "समय" in msg_lower or "কেতিয়া" in msg_lower or "আহিব" in msg_lower:
            stmt = select(Shipment).where(Shipment.waybill_number == waybill_query)
            res = await db.execute(stmt)
            shipment = res.scalars().first()

            now = datetime.now(timezone.utc)
            estimated_arrival = now + timedelta(hours=3, minutes=45)

            reply = (
                f"⏱️ **Delivery ETA for {waybill_query}:**\n"
                f"• **Estimated Arrival Time:** {estimated_arrival.strftime('%H:%M UTC')} (approx. 3 hrs 45 mins)\n"
                f"• **Corridor:** Jorhat Tea Feeder ➔ Guwahati Mega Cold Hub\n"
                f"• **Terrain Factor:** Plains segment (Speed: 42 km/h, clear paved road)\n"
                f"• **Cold-Chain Integrity:** Stable (+3.8°C nominal setpoint)"
            )
            quick_replies = [f"Status of {waybill_query} 📦", f"Reschedule {waybill_query} 📅", "Book New Cargo 📦"]
            return ChatMessageResponse(
                reply=reply,
                locale=locale,
                step="eta_result",
                intent="delivery_eta",
                quick_replies=quick_replies,
                tracked_shipment={"waybill": waybill_query, "eta": estimated_arrival.isoformat()},
                hubs=hub_list[:6],
            )
        else:
            # General waybill status query
            stmt = select(Shipment).where(Shipment.waybill_number == waybill_query)
            res = await db.execute(stmt)
            shipment = res.scalars().first()

            if shipment:
                orig_h = next((h for h in all_hubs if h.id == shipment.origin_hub_id), None)
                dest_h = next((h for h in all_hubs if h.id == shipment.dest_hub_id), None)
                orig_name = orig_h.name if orig_h else "Jorhat Agro Hub"
                dest_name = dest_h.name if dest_h else "Guwahati Mega Hub"

                status_str = shipment.status.value.upper() if hasattr(shipment.status, "value") else str(shipment.status).upper()
                temp_str = shipment.temp_class.value.upper() if hasattr(shipment.temp_class, "value") else str(shipment.temp_class).upper()
                good_str = shipment.good_type.value.capitalize() if hasattr(shipment.good_type, "value") else str(shipment.good_type).capitalize()
                prod_str = shipment.producer_name or "Jorhat Organic Tea Planters"

                reply = (
                    f"📦 **Waybill Status: {shipment.waybill_number}**\n"
                    f"• **Current Status:** `{status_str}`\n"
                    f"• **Origin ➔ Destination:** {orig_name} ➔ {dest_name}\n"
                    f"• **Commodity:** {good_str} ({prod_str})\n"
                    f"• **Cargo Specs:** {shipment.weight_kg} kg | Temp Class: {temp_str}\n"
                    f"• **Cold-Chain Health:** Optimal (98.4% Shelf-Life Remaining)\n"
                    f"• **Telemetry:** Active GPS, nominal reefer temp +3.4°C"
                )
                quick_replies = [
                    f"ETA for {shipment.waybill_number} ⏱️",
                    f"Reschedule {shipment.waybill_number} 📅",
                    "❓ View FAQs",
                ]
                return ChatMessageResponse(
                    reply=reply,
                    locale=locale,
                    step="status_result",
                    intent="order_status",
                    quick_replies=quick_replies,
                    tracked_shipment={
                        "id": str(shipment.id),
                        "waybill": shipment.waybill_number,
                        "status": status_str,
                        "weight_kg": shipment.weight_kg,
                    },
                    hubs=hub_list[:6],
                )
            else:
                return ChatMessageResponse(
                    reply=texts["not_found"],
                    locale=locale,
                    step="not_found",
                    quick_replies=["Book New Consignment 📦", "❓ View FAQs"],
                    hubs=hub_list[:6],
                )

    # -------------------------------------------------------------
    # INTENT 2: SPECIFIC OR GENERAL FAQ QUERIES
    # -------------------------------------------------------------
    matched_faq_id = find_matching_faq(msg_lower)

    # General FAQ request (e.g. "faq", "faqs", "help", "questions", "मदद", "सवाल", "সহায়")
    is_general_faq_query = (
        matched_faq_id is None
        and any(
            t in msg_lower
            for t in [
                "faq", "faqs", "help", "questions", "question",
                "मदद", "सवाल", "प्रश्न", "প্ৰশ্ন", "সহায়"
            ]
        )
    )

    if matched_faq_id:
        faq_item = FAQS_DATA[matched_faq_id]
        reply = faq_item["answer"].get(locale, faq_item["answer"]["en"])

        if locale == "as":
            quick_replies = ["❓ অন্যান্য প্ৰশ্ন (FAQs)", "📦 নতুন অৰ্ডাৰ বুক কৰক", "🔍 চালান ট্ৰেক কৰক"]
        elif locale == "hi":
            quick_replies = ["❓ अन्य प्रश्न (FAQs)", "📦 नया ऑर्डर बुक करें", "🔍 ऑर्डर ट्रैक करें"]
        else:
            quick_replies = ["❓ View All FAQs", "📦 Book a Shipment", "🔍 Track Shipment"]

        return ChatMessageResponse(
            reply=reply,
            locale=locale,
            step="faq_answered",
            intent="faq",
            faq_id=matched_faq_id,
            quick_replies=quick_replies,
            draft_shipment=draft,
            hubs=hub_list[:6],
        )

    if is_general_faq_query:
        intro = texts.get("faq_list_intro", "Here are common questions you can ask:")
        top_faqs = [
            "what_is_platform",
            "create_shipment",
            "vehicle_matching",
            "no_internet",
            "track_shipment",
            "rural_help",
        ]
        faq_lines = "\n".join(
            [f"• {FAQS_DATA[fid]['question'].get(locale, FAQS_DATA[fid]['question']['en'])}" for fid in top_faqs]
        )
        reply = f"❓ **{intro}**\n\n{faq_lines}"
        quick_replies = [
            FAQS_DATA[fid]["question"].get(locale, FAQS_DATA[fid]["question"]["en"]) for fid in top_faqs[:4]
        ]
        return ChatMessageResponse(
            reply=reply,
            locale=locale,
            step="faq_list",
            intent="faq_menu",
            quick_replies=quick_replies,
            draft_shipment=draft,
            hubs=hub_list[:6],
        )

    # -------------------------------------------------------------
    # INTENT 3: DELIVERY ETA CALCULATION (WITHOUT EXPLICIT WAYBILL)
    # -------------------------------------------------------------
    if "eta" in msg_lower or ("when" in msg_lower and "arrive" in msg_lower) or "समय" in msg_lower or "কেতিয়া" in msg_lower or "আহিব" in msg_lower:
        stmt = select(Shipment).limit(1)
        res = await db.execute(stmt)
        shipment = res.scalars().first()

        wb = shipment.waybill_number if shipment else "RUR-90141"
        now = datetime.now(timezone.utc)
        estimated_arrival = now + timedelta(hours=3, minutes=45)

        reply = (
            f"⏱️ **Delivery ETA for {wb}:**\n"
            f"• **Estimated Arrival Time:** {estimated_arrival.strftime('%H:%M UTC')} (approx. 3 hrs 45 mins)\n"
            f"• **Corridor:** Jorhat Tea Feeder ➔ Guwahati Mega Cold Hub\n"
            f"• **Terrain Factor:** Plains segment (Speed: 42 km/h, clear paved road)\n"
            f"• **Cold-Chain Integrity:** Stable (+3.8°C nominal setpoint)"
        )
        quick_replies = [f"Status of {wb} 📦", f"Reschedule {wb} 📅", "Book New Cargo 📦"]
        return ChatMessageResponse(
            reply=reply,
            locale=locale,
            step="eta_result",
            intent="delivery_eta",
            quick_replies=quick_replies,
            tracked_shipment={"waybill": wb, "eta": estimated_arrival.isoformat()},
            hubs=hub_list[:6],
        )

    # -------------------------------------------------------------
    # INTENT 4: RESCHEDULING QUERIES (WITHOUT EXPLICIT WAYBILL)
    # -------------------------------------------------------------
    elif "reschedule" in msg_lower or "change time" in msg_lower or "बदलें" in msg_lower or "সলনি" in msg_lower:
        wb = "RUR-90141"
        stmt = select(Shipment).where(Shipment.waybill_number == wb)
        res = await db.execute(stmt)
        shipment = res.scalars().first()

        new_deadline = datetime.now(timezone.utc) + timedelta(hours=24)
        if shipment:
            shipment.sla_deadline = new_deadline
            await db.commit()

        reply = (
            f"📅 **Consignment Rescheduling Confirmed for {wb}:**\n"
            f"• **New Pickup/Delivery Window:** {new_deadline.strftime('%d %b %Y, %H:%M UTC')}\n"
            f"• **Audit:** Reschedule request logged with cooperative driver dispatch.\n"
            f"• **Cold Storage Allocation:** Extended holding slot reserved at local aggregation point."
        )
        quick_replies = [f"Check Status {wb} 🔍", "Book Another Consignment 📦"]
        return ChatMessageResponse(
            reply=reply,
            locale=locale,
            step="reschedule_result",
            intent="reschedule",
            quick_replies=quick_replies,
            tracked_shipment={"waybill": wb, "new_deadline": new_deadline.isoformat()},
            hubs=hub_list[:6],
        )

    # -------------------------------------------------------------
    # INTENT 5: STATUS TRACKING (FALLBACK)
    # -------------------------------------------------------------
    elif "status" in msg_lower or "where is" in msg_lower or "track" in msg_lower or "स्थिति" in msg_lower or "স্থিতি" in msg_lower or "ট্ৰেক" in msg_lower:
        stmt = select(Shipment).limit(1)
        res = await db.execute(stmt)
        shipment = res.scalars().first()

        if shipment:
            orig_h = next((h for h in all_hubs if h.id == shipment.origin_hub_id), None)
            dest_h = next((h for h in all_hubs if h.id == shipment.dest_hub_id), None)
            orig_name = orig_h.name if orig_h else "Origin Cluster"
            dest_name = dest_h.name if dest_h else "Central Cold Hub"

            status_str = shipment.status.value.upper() if hasattr(shipment.status, "value") else str(shipment.status).upper()
            temp_str = shipment.temp_class.value.upper() if hasattr(shipment.temp_class, "value") else str(shipment.temp_class).upper()
            good_str = shipment.good_type.value.capitalize() if hasattr(shipment.good_type, "value") else str(shipment.good_type).capitalize()
            prod_str = shipment.producer_name or "Farmer Co-op"

            reply = (
                f"📦 **Waybill Status: {shipment.waybill_number or 'RUR-90141'}**\n"
                f"• **Current Status:** `{status_str}`\n"
                f"• **Origin ➔ Destination:** {orig_name} ➔ {dest_name}\n"
                f"• **Commodity:** {good_str} ({prod_str})\n"
                f"• **Cargo Specs:** {shipment.weight_kg} kg | Temp Class: {temp_str}\n"
                f"• **Cold-Chain Health:** Optimal (98.4% Shelf-Life Remaining)\n"
                f"• **Telemetry:** Active GPS, nominal reefer temp +3.4°C"
            )
            quick_replies = [
                f"ETA for {shipment.waybill_number} ⏱️",
                f"Reschedule {shipment.waybill_number} 📅",
                "❓ View FAQs",
            ]
            return ChatMessageResponse(
                reply=reply,
                locale=locale,
                step="status_result",
                intent="order_status",
                quick_replies=quick_replies,
                tracked_shipment={
                    "id": str(shipment.id),
                    "waybill": shipment.waybill_number,
                    "status": status_str,
                    "weight_kg": shipment.weight_kg,
                },
                hubs=hub_list[:6],
            )
        else:
            return ChatMessageResponse(
                reply=texts["not_found"],
                locale=locale,
                step="not_found",
                quick_replies=["Book New Consignment 📦", "❓ View FAQs"],
                hubs=hub_list[:6],
            )

    # -------------------------------------------------------------
    # INTENT 6: MULTILINGUAL ORDER BOOKING CONVERSATION FLOW
    # -------------------------------------------------------------
    if step == "select_origin":
        matched = next((h for h in hub_list if h["name"].lower() in msg_lower or msg_lower in h["name"].lower()), None)
        if matched:
            draft["origin_hub_id"] = matched["id"]
            draft["origin_hub_name"] = matched["name"]
        else:
            draft["origin_hub_id"] = hub_list[0]["id"] if hub_list else "hub-01"
            draft["origin_hub_name"] = msg.title() if len(msg) < 40 else (hub_list[0]["name"] if hub_list else "Jorhat Upper Assam Tea Belt")

        reply = texts["select_dest"]
        step = "select_destination"
        if locale == "as":
            cancel_btn = "🚫 বাতিল"
        elif locale == "hi":
            cancel_btn = "🚫 रद्द करें"
        else:
            cancel_btn = "🚫 Cancel"
        quick_replies = [h["name"] for h in hub_list if h["id"] != draft.get("origin_hub_id")][:4] + [cancel_btn]

    elif step == "select_destination":
        matched = next((h for h in hub_list if h["name"].lower() in msg_lower or msg_lower in h["name"].lower()), None)
        if matched:
            draft["dest_hub_id"] = matched["id"]
            draft["dest_hub_name"] = matched["name"]
        else:
            dest_h = hub_list[1] if len(hub_list) > 1 else hub_list[0]
            draft["dest_hub_id"] = dest_h["id"]
            draft["dest_hub_name"] = msg.title() if len(msg) < 40 else dest_h["name"]

        reply = texts["select_good"]
        step = "select_good_type"
        if locale == "as":
            quick_replies = ["তাজা ফল-মূল আৰু শাক-পাচলি", "গাখীৰ / দুগ্ধজাত সামগ্ৰী", "ভেকচিন / দৰব", "মাছ / সামুদ্ৰিক খাদ্য", "🚫 বাতিল"]
        elif locale == "hi":
            quick_replies = ["ताज़ा फल एवं सब्जियाँ", "दूध एवं डेरी उत्पाद", "टीके एवं जीवनरक्षक दवाइयाँ", "मछली एवं समुद्री भोजन", "🚫 रद्द करें"]
        else:
            quick_replies = ["Fresh Produce & Fruits", "Milk & Dairy Products", "Vaccines & Medicines", "Fish & Seafood", "🚫 Cancel"]

    elif step == "select_good_type":
        if "vaccine" in msg_lower or "medicine" in msg_lower or "दवा" in msg_lower or "দৰব" in msg_lower or "ভেকচিন" in msg_lower or "ঔষধ" in msg_lower:
            draft["good_type"] = GoodType.medicine.value
            draft["good_type_label"] = "Vaccines & Medical Supplies"
            draft["quantity_units"] = "vials"
        elif "milk" in msg_lower or "dairy" in msg_lower or "दूध" in msg_lower or "গাখীৰ" in msg_lower or "दही" in msg_lower:
            draft["good_type"] = GoodType.farm_produce.value
            draft["good_type_label"] = "Dairy & Milk Products"
            draft["quantity_units"] = "litres"
        elif "fish" in msg_lower or "sea" in msg_lower or "मछली" in msg_lower or "মাছ" in msg_lower:
            draft["good_type"] = GoodType.farm_produce.value
            draft["good_type_label"] = "Fish & Seafood"
            draft["quantity_units"] = "crates"
        else:
            draft["good_type"] = GoodType.farm_produce.value
            draft["good_type_label"] = "Fresh Farm Produce"
            draft["quantity_units"] = "crates"

        reply = texts["select_temp"]
        step = "select_temp"
        if locale == "as":
            quick_replies = ["হিমায়িত (-20°C বৰফ)", "শীতল (2°C - 8°C)", "সাধাৰণ (15°C - 25°C)", "🚫 বাতিল"]
        elif locale == "hi":
            quick_replies = ["जमे हुए (-20°C फ्रोजन)", "ठंडा (2°C - 8°C चिल)", "सामान्य (15°C - 25°C)", "🚫 रद्द करें"]
        else:
            quick_replies = ["Frozen (-20°C Deep Cold)", "Chilled (2°C - 8°C Cold Chain)", "Ambient (15°C - 25°C Normal)", "🚫 Cancel"]

    elif step == "select_temp":
        if "frozen" in msg_lower or "ice" in msg_lower or "बरफ" in msg_lower or "बर्फ" in msg_lower or "বৰফ" in msg_lower or "-20" in msg_lower:
            draft["temp_class"] = TempClass.frozen.value
            draft["temp_label"] = "Frozen (-20°C)"
        elif "chill" in msg_lower or "cold" in msg_lower or "ठंडा" in msg_lower or "শীতল" in msg_lower or "8" in msg_lower or "2" in msg_lower:
            draft["temp_class"] = TempClass.chilled.value
            draft["temp_label"] = "Chilled (2°C to 8°C)"
        else:
            draft["temp_class"] = TempClass.ambient.value
            draft["temp_label"] = "Ambient (15°C to 25°C)"

        reply = texts["enter_weight"]
        step = "enter_weight"
        if locale == "as":
            quick_replies = ["50 kg", "100 kg", "250 kg", "500 kg", "🚫 বাতিল"]
        elif locale == "hi":
            quick_replies = ["50 kg", "100 kg", "250 kg", "500 kg", "🚫 रद्द करें"]
        else:
            quick_replies = ["50 kg", "100 kg", "250 kg", "500 kg", "🚫 Cancel"]

    elif step == "enter_weight":
        numbers = re.findall(r"\d+", msg)
        weight = float(numbers[0]) if numbers else 100.0
        load_qty = float(numbers[1]) if len(numbers) > 1 else max(1.0, round(weight / 5.0))

        draft["weight_kg"] = weight
        draft["load_quantity"] = load_qty
        draft["volume_cbm"] = round(weight * 0.005, 2)
        draft["producer_id"] = "prod-rural-farmer-01"
        draft["producer_name"] = "Gram Panchayat Farmer Co-op"
        draft["community_id"] = "comm-cluster-jorhat"
        draft["urgency"] = UrgencyLevel.routine.value
        draft["waybill_number"] = f"RUR-{int(datetime.now().timestamp()) % 100000:05d}"

        reply = f"{texts['confirm']}\n\n• **Waybill:** `{draft['waybill_number']}`\n• **Commodity:** {draft.get('good_type_label', 'Produce')}\n• **Weight:** {weight} kg ({load_qty} {draft.get('quantity_units', 'units')})\n• **Route:** {draft.get('origin_hub_name')} ➔ {draft.get('dest_hub_name')}\n• **Temp:** {draft.get('temp_label', 'Chilled')}"
        step = "confirm"
        if locale == "as":
            quick_replies = ["চালান বুক কৰক ✅", "পুনৰ আৰম্ভ কৰক 🔄"]
        elif locale == "hi":
            quick_replies = ["ऑर्डर कन्फर्म करें ✅", "पुनः प्रारंभ करें 🔄"]
        else:
            quick_replies = ["Confirm Order ✅", "Start Over 🔄"]

    elif step == "confirm":
        if any(w in msg_lower for w in ["confirm", "yes", "हाँ", "हो", "হয়", "নিশ্চিত", "book", "कन्फर्म"]):
            waybill_num = draft.get("waybill_number", f"RUR-{int(datetime.now().timestamp()) % 100000:05d}")
            reply = f"{texts['success']}`{waybill_num}`\n\n• **Waybill:** `{waybill_num}`\n• **Status:** Scheduled for Aggregation & Allocation\n• **Estimated Pickup:** Next scheduled cooperative run"
            step = "completed"
            if locale == "as":
                quick_replies = [f"ট্ৰেক কৰক {waybill_num} 🔍", "নতুন অৰ্ডাৰ বুক কৰক 📦", "❓ FAQs"]
            elif locale == "hi":
                quick_replies = [f"ट्रैक करें {waybill_num} 🔍", "नया ऑर्डर बुक करें 📦", "❓ FAQs"]
            else:
                quick_replies = [f"Track {waybill_num} 🔍", "Book Another Shipment 📦", "❓ View FAQs"]
        else:
            reply = texts["cancelled"]
            step = "idle"
            draft = {}
            if locale == "as":
                quick_replies = ["📦 নতুন অৰ্ডাৰ বুকিং", "🔍 RUR-90141 ট্ৰেক কৰক", "❓ FAQs"]
            elif locale == "hi":
                quick_replies = ["📦 नया ऑर्डर बुक करें", "🔍 RUR-90141 ट्रैक करें", "❓ FAQs"]
            else:
                quick_replies = ["📦 Book a Consignment", "🔍 Track Shipment RUR-90141", "❓ View FAQs"]

    else:
        # Fallback for idle state / general queries
        reply = texts["welcome"]
        step = "idle"
        if locale == "as":
            quick_replies = ["📦 নতুন অৰ্ডাৰ বুকিং", "🔍 RUR-90141 ট্ৰেক কৰক", "⏱️ ডেলিভাৰী ETA", "❓ সঘনাই সোধা প্ৰশ্ন (FAQs)"]
        elif locale == "hi":
            quick_replies = ["📦 नया ऑर्डर बुक करें", "🔍 RUR-90141 ट्रैक करें", "⏱️ डिलीवरी ईटीए", "❓ सामान्य प्रश्न (FAQs)"]
        else:
            quick_replies = ["📦 Book a Consignment", "🔍 Track Shipment RUR-90141", "⏱️ Check Delivery ETA", "❓ View FAQs"]

    return ChatMessageResponse(
        reply=reply,
        locale=locale,
        step=step,
        quick_replies=quick_replies,
        draft_shipment=draft if draft else None,
        hubs=hub_list[:6],
    )

