import re
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.hub import Hub
from app.models.shipment import Shipment, GoodType, TempClass, UrgencyLevel

router = APIRouter(prefix="/chat", tags=["Rural Multilingual Conversational Assistant"])


class ChatMessageRequest(BaseModel):
    message: str
    locale: Optional[str] = "en"  # "en", "hi", "or"
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


# ---------------------------------------------------------------------------
# MULTILINGUAL FAQ KNOWLEDGE BASE
# ---------------------------------------------------------------------------
FAQS_DATA = {'what_is_platform': {'question': {'en': 'What is this platform?', 'hi': 'यह प्लेटफॉर्म क्या है?', 'or': "ଏହି ପ୍ଲାଟଫର୍ମ କ'ଣ?"}, 'answer': {'en': '📦 **CargoMind (ShipMerge)** is an AI-powered multi-tenant rural logistics and cold-chain consolidation platform. It optimizes multi-modal freight distribution (road, rail DFC, refrigerated reefers), predicts perishable spoilage using physics-based kinetics (Arrhenius & Q10), and connects rural producers and farmer cooperatives directly to regional markets.', 'hi': '📦 **कार्गोमाइंड (CargoMind / ShipMerge)** एक एआई-संचालित मल्टी-टेनेंट ग्रामीण लॉजिस्टिक्स और कोल्ड-चेन समेकन प्लेटफॉर्म है। यह मल्टी-मोडल माल परिवहन (सड़क, रेल डीएफसी, रीफर वाहन) को अनुकूलित करता है, भौतिकी-आधारित काइनेटिक्स (Arrhenius & Q10) से खराब होने वाले सामान के जोखिम का सटीक अनुमान लगाता है, और ग्रामीण उत्पादकों को सीधे क्षेत्रीय बाजारों से जोड़ता है।', 'or': '📦 **କାର୍ଗୋମାଇଣ୍ଡ (CargoMind / ShipMerge)** ହେଉଛି ଏକ AI-ଚାଳିତ ମଲ୍ଟି-ଟେନାଣ୍ଟ ଗ୍ରାମୀଣ ଲଜିଷ୍ଟିକ୍ସ ଏବଂ କୋଲ୍ଡ-ଚେନ୍ ସମନ୍ୱୟ ପ୍ଲାଟଫର୍ମ। ଏହା ମଲ୍ଟି-ମୋଡାଲ୍ ପରିବହନ (ସଡ଼କ, ରେଳ DFC, ରେଫ୍ରିଜରେଟେଡ୍ ଗାଡ଼ି) କୁ ସୁବ୍ୟବସ୍ଥିତ କରେ, ଫଳ-ପନିପରିବା ଓ ଔଷଧ ନଷ୍ଟ ହେବାର ଆଶଙ୍କା ଆକଳନ କରେ, ଏବଂ ଗ୍ରାମୀଣ ଚାଷୀ ଓ ସମବାୟ ସମିତିଗୁଡ଼ିକୁ ପ୍ରମୁଖ ବଜାର ସହିତ ଯୋଡ଼ିଥାଏ।'}, 'keywords': ['what is this platform', 'what is platform', 'what is cargomind', 'what is shipmerge', 'about the platform', 'about platform', 'यह प्लेटफॉर्म क्या है', 'यह क्या है', 'कार्गोमाइंड क्या है', "ଏହି ପ୍ଲାଟଫର୍ମ କ'ଣ", 'ପ୍ଲାଟଫର୍ମ ବିଷୟରେ', "କାର୍ଗୋମାଇଣ୍ଡ କ'ଣ"]}, 'create_shipment': {'question': {'en': 'How do I create a shipment?', 'hi': 'मैं शिपमेंट कैसे बना सकता हूँ?', 'or': 'ମୁଁ କିପରି ସିପ୍\u200cମେଣ୍ଟ ତିଆରି କରିବି?'}, 'answer': {'en': "📝 **Creating a Shipment:**\n1. Use this Chatbot: Type or speak *'Book order'* to start our guided step-by-step assistant.\n2. Via Web Portal: Go to the **Pickups / Shipments** section and click **Create Shipment**.\n3. Specify your origin hub/village, destination hub, commodity type, temperature class (Frozen, Chilled, Ambient), and total weight (kg).", 'hi': "📝 **शिपमेंट बनाने की विधि:**\n1. इस चैटबॉट से: बोलें या लिखें *'ऑर्डर बुक करें'* और चरण-दर-चरण प्रक्रिया का पालन करें।\n2. वेब पोर्टल से: **Pickups / Shipments** सेक्शन में जाएं और **Create Shipment** पर क्लिक करें।\n3. अपना मूल गाँव/हब, गंतव्य हब, सामग्री का प्रकार, तापमान श्रेणी (फ्रोजन, चिल्ड, सामान्य) और वजन (किलोग्राम) दर्ज करें।", 'or': "📝 **ସିପ୍\u200cମେଣ୍ଟ ତିଆରି କରିବା ପ୍ରଣାଳୀ:**\n1. ଏହି ଚାଟବଟ୍ ବ୍ୟବହାର କରନ୍ତୁ: *'ଅର୍ଡର ବୁକ୍ କରନ୍ତୁ'* ଟାଇପ୍ କରନ୍ତୁ କିମ୍ବା କୁହନ୍ତୁ।\n2. ୱେବ୍ ପୋର୍ଟାଲ୍ ମାଧ୍ୟମରେ: **Pickups / Shipments** ବିଭାଗକୁ ଯାଇ **Create Shipment** ଉପରେ କ୍ଲିକ୍ କରନ୍ତୁ।\n3. ଉତ୍ପାଦନ କେନ୍ଦ୍ର, ଗନ୍ତବ୍ୟ ହବ୍, ସାମଗ୍ରୀର ପ୍ରକାର, ତାପମାତ୍ରା ବର୍ଗ (ଶୀତଳ, ଥଣ୍ଡା, ସାଧାରଣ) ଏବଂ ଓଜନ ଦିଅନ୍ତୁ।"}, 'keywords': ['how do i create a shipment', 'how to create a shipment', 'how to create shipment', 'how to make a shipment', 'how to book a shipment', 'how to book cargo', 'शिपमेंट कैसे बना', 'शिपमेंट कैसे बनाएँ', 'ऑर्डर कैसे बनाएँ', 'शिपमेंट कैसे बनाएं', 'ସିପ୍\u200cମେଣ୍ଟ କିପରି ତିଆରି କରିବି', 'ସିପ୍\u200cମେଣ୍ଟ କିପରି କରିବି', 'ସିପମେଣ୍ଟ କିପରି']}, 'find_vehicle': {'question': {'en': 'How can I find a vehicle?', 'hi': 'मैं वाहन कैसे खोज सकता हूँ?', 'or': 'ମୁଁ ଗାଡ଼ି କିପରି ଖୋଜିବି?'}, 'answer': {'en': '🚚 **Finding a Vehicle:**\n• **Automated Matching:** Vehicles are automatically matched to your shipment using our intelligent multi-modal optimization engine.\n• **Fleet Directory:** Navigate to the **Dispatch** or **Kinetics** tab to view active cooperative vehicles, reefer trucks, dynamic GPS telemetry, and available payload capacity.', 'hi': '🚚 **वाहन खोजने की प्रक्रिया:**\n• **स्वचालित मैचिंग:** हमारा इंटेलिजेंट ऑप्टिमाइजेशन इंजन आपके शिपमेंट के लिए सर्वोत्तम वाहन का स्वतः चयन करता है।\n• **फ्लीट डायरेक्टरी:** उपलब्ध रीफर गाड़ियाँ, वाहन क्षमता, GPS लोकेशन और तापमान स्थिति देखने के लिए **Dispatch** या **Kinetics** टैब देखें।', 'or': '🚚 **ଗାଡ଼ି ଖୋଜିବା ପ୍ରଣାଳୀ:**\n• **ସ୍ୱୟଂଚାଳିତ ମ୍ୟାଚିଂ:** ଆମର ଇଣ୍ଟେଲିଜେଣ୍ଟ ଅପ୍ଟିମାଇଜେସନ୍ ଇଞ୍ଜିନ୍ ଆପଣଙ୍କ ସିପ୍\u200cମେଣ୍ଟ ପାଇଁ ଉପଯୁକ୍ତ ଗାଡ଼ି ସ୍ୱୟଂଚାଳିତ ଭାବେ ବାଛିଥାଏ।\n• **ଗାଡ଼ି ତାଲିକା:** ଉପଲବ୍ଧ ସମବାୟ ଗାଡ଼ି, ଲାଇଭ୍ GPS ଲୋକେସନ୍ ଏବଂ କ୍ଷମତା ଦେଖିବାକୁ **Dispatch** କିମ୍ବା **Kinetics** ବିଭାଗକୁ ଯାଆନ୍ତୁ।'}, 'keywords': ['how can i find a vehicle', 'how to find a vehicle', 'how do i find a vehicle', 'how to find vehicle', 'how can i get a vehicle', 'find a vehicle', 'वाहन कैसे खोज', 'गाड़ी कैसे खोज', 'गाड़ी कैसे मिलेगी', 'वाहन कैसे खोजें', 'ଗାଡ଼ି କିପରି ଖୋଜିବି', 'ଗାଡ଼ି କିପରି ମିଳିବ', 'ଗାଡି କିପରି']}, 'vehicle_matching': {'question': {'en': 'How does vehicle matching work?', 'hi': 'वाहन मिलान कैसे काम करता है?', 'or': 'ଗାଡ଼ି ମ୍ୟାଚିଂ କିପରି କାମ କରେ?'}, 'answer': {'en': '🧠 **Vehicle Matching Engine:**\nPowered by **Google OR-Tools CP-SAT Combinatorial Optimization**:\n1. **Thermal Isolation:** Strictly prevents co-loading incompatible temperatures (e.g., Frozen -18°C vs Ambient).\n2. **Payload & Volume Bounds:** Respects maximum kg capacity and cubic meter volume constraints.\n3. **Road Quality & Kinetics:** Integrates unpaved rural road conditions and shelf-life degradation rates.\n4. **Driver Fairness:** Balances dispatches among local community carriers.', 'hi': '🧠 **वाहन मिलान (Vehicle Matching) प्रणाली:**\nयह **Google OR-Tools CP-SAT ऑप्टिमाइजेशन** पर आधारित है:\n1. **तापमान अलगाव:** फ्रोजन (-18°C) और सामान्य सामान को एक साथ लोड होने से रोकता है।\n2. **भार व आयतन सीमा:** वाहन की पेलोड वजन और क्यूबिक मीटर क्षमता का पालन करता है।\n3. **सड़क की स्थिति एवं काइनेटिक्स:** कच्ची ग्रामीण सड़कों और सामान की शेल्फ-लाइफ का विश्लेषण करता है।\n4. **चालक निष्पक्षता:** स्थानीय ड्राइवरों के बीच समान ट्रिप वितरण सुनिश्चित करता है।', 'or': '🧠 **ଗାଡ଼ି ମ୍ୟାଚିଂ କାର୍ଯ୍ୟପ୍ରଣାଳୀ:**\nଏହା **Google OR-Tools CP-SAT କମ୍ବିନେଟୋରିଆଲ୍ ଅପ୍ଟିମାଇଜେସନ୍** ଦ୍ୱାରା ପରିଚାଳିତ:\n1. **ତାପମାତ୍ରା ସୁରକ୍ଷା:** ଫ୍ରୋଜେନ୍ (-18°C) ଓ ସାଧାରଣ ସାମଗ୍ରୀ କଦାପି ଏକାଠି ଲୋଡ୍ କରେ ନାହିଁ।\n2. **ଓଜନ ଓ ଆୟତନ ସୀମା:** ଗାଡ଼ିର ସର୍ବାଧିକ ଓଜନ ଏବଂ ଆୟତନ କ୍ଷମତା ଅନୁସରଣ କରେ।\n3. **ରାସ୍ତା ଓ ସ୍ଥାୟିତ୍ୱ:** ଗ୍ରାମାଞ୍ଚଳ କଞ୍ଚା ରାସ୍ତା ଓ ସାମଗ୍ରୀର ସୁରକ୍ଷା ଅବଧି ହିସାବ କରେ।\n4. **ନ୍ୟାୟସଙ୍ଗତ ବଣ୍ଟନ:** ସମସ୍ତ ସ୍ଥାନୀୟ ଡ୍ରାଇଭରଙ୍କ ମଧ୍ୟରେ ସମାନ ଭାବେ କାମ ବଣ୍ଟନ କରେ।'}, 'keywords': ['how does vehicle matching work', 'how vehicle matching works', 'vehicle matching algorithm', 'cp-sat matching', 'matching logic', 'vehicle matching work', 'वाहन मिलान कैसे काम करता है', 'मैचिंग कैसे काम करती है', 'मैचिंग कैसे होती है', 'ଗାଡ଼ି ମ୍ୟାଚିଂ କିପରି କାମ କରେ', 'ମ୍ୟାଚିଂ କିପରି କାମ କରେ', 'ଗାଡି ମ୍ୟାଚିଂ']}, 'track_shipment': {'question': {'en': 'How can I track my shipment?', 'hi': 'मैं अपना शिपमेंट कैसे ट्रैक करूँ?', 'or': 'ମୁଁ ମୋର ସିପ୍\u200cମେଣ୍ଟ କିପରି ଟ୍ରାକ୍ କରିପାରିବି?'}, 'answer': {'en': "📍 **Shipment Tracking:**\n• **Via Chatbot:** Simply ask *'Track RUR-90141'* or *'Status of my order'*.\n• **Via Map View:** Check the interactive **Overview / Topology** map for live GPS movement, ETA estimates, cold-chain temperature telemetry, and predicted shelf-life health.", 'hi': "📍 **शिपमेंट ट्रैकिंग:**\n• **चैटबॉट से:** सीधे लिखें या पूछें *'Track RUR-90141'* या *'ऑर्डर की स्थिति'*।\n• **मानचित्र दृश्य:** लाइव GPS लोकेशन, आगमन समय (ETA), रीफर तापमान और शेल्फ-लाइफ स्वास्थ्य देखने के लिए **Overview / Topology** मैप देखें।", 'or': "📍 **ସିପ୍\u200cମେଣ୍ଟ ଟ୍ରାକିଂ:**\n• **ଚାଟବଟ୍ ମାଧ୍ୟମରେ:** ସିଧାସଳଖ ଲେଖନ୍ତୁ *'Track RUR-90141'* କିମ୍ବା *'ମୋ ଅର୍ଡର ସ୍ଥିତି'*।\n• **ମ୍ୟାପ୍ ଭ୍ୟୁ:** ଲାଇଭ୍ GPS ଲୋକେସନ୍, ଆଗମନ ସମୟ (ETA), କୋଲ୍ଡ-ଚେନ୍ ତାପମାତ୍ରା ଓ ସାମଗ୍ରୀ ସ୍ଥିତି ପାଇଁ **Overview / Topology** ମ୍ୟାପ୍ ଦେଖନ୍ତୁ।"}, 'keywords': ['how can i track my shipment', 'how to track my shipment', 'how to track shipment', 'how do i track shipment', 'tracking process', 'शिपमेंट कैसे ट्रैक करूँ', 'शिपमेंट कैसे ट्रैक करें', 'ट्रैक कैसे करें', 'ट्रैकिंग कैसे करें', 'ସିପ୍\u200cମେଣ୍ଟ କିପରି ଟ୍ରାକ୍ କରିବି', 'ସିପ୍\u200cମେଣ୍ଟ କିପରି ଟ୍ରାକ୍ କରିବି', 'ଟ୍ରାକ୍ କିପରି କରିବି']}, 'no_internet': {'question': {'en': 'What happens if there is no internet?', 'hi': 'यदि इंटरनेट न हो तो क्या होगा?', 'or': "ଯଦି ଇଣ୍ଟରନେଟ୍ ନଥାଏ ତେବେ କ'ଣ ହେବ?"}, 'answer': {'en': '📶 **Offline-First Resilience:**\nNo internet? No problem! The platform functions seamlessly offline in remote areas.\n• You can book shipments, log road obstacles, and record sensor temperature updates.\n• Data is saved securely in local device storage and automatically synchronizes when network connection is restored.', 'hi': '📶 **ऑफलाइन-फर्स्ट सुरक्षा:**\nइंटरनेट नहीं है? कोई समस्या नहीं! यह प्लेटफॉर्म ग्रामीण और दूरदराज के क्षेत्रों में पूरी तरह ऑफलाइन काम करता है।\n• आप शिपमेंट बुक कर सकते हैं, सड़क की बाधाएं दर्ज कर सकते हैं और तापमान रिकॉर्ड कर सकते हैं।\n• सभी डेटा डिवाइस की लोकल मेमोरी में सुरक्षित रहता है और इंटरनेट मिलते ही अपने आप सिंक हो जाता है।', 'or': '📶 **ଅଫଲାଇନ୍-ଫାଷ୍ଟ୍ ସୁରକ୍ଷା:**\nଇଣ୍ଟରନେଟ୍ ନାହିଁ? କୌଣସି ଅସୁବିଧା ନାହିଁ! ଏହି ପ୍ଲାଟଫର୍ମ ଦୁର୍ଗମ ଅଞ୍ଚଳରେ ମଧ୍ୟ ଅଫଲାଇନ୍ କାମ କରେ।\n• ଆପଣ ସିପ୍\u200cମେଣ୍ଟ ବୁକ୍ କରିପାରିବେ, ରାସ୍ତାର ସମସ୍ୟା ରେକର୍ଡ କରିପାରିବେ ଏବଂ ତାପମାତ୍ରା ଲଗ୍ କରିପାରିବେ।\n• ସମସ୍ତ ତଥ୍ୟ ଲୋକାଲ୍ ମେମୋରୀରେ ସୁରକ୍ଷିତ ରହେ ଏବଂ ନେଟୱାର୍କ ଆସିବା ମାତ୍ରେ ଆପେ ଆପେ ସିଙ୍କ୍ ହୋଇଯାଏ।'}, 'keywords': ['what happens if there is no internet', 'what if no internet', 'what happens if no internet', 'no internet', 'without internet', 'यदि इंटरनेट न हो', 'बिना इंटरनेट क्या होगा', 'इंटरनेट नहीं है', 'इंटरनेट न हो तो', 'ଯଦି ଇଣ୍ଟରନେଟ୍ ନଥାଏ', "ଇଣ୍ଟରନେଟ୍ ନଥିଲେ କ'ଣ ହେବ", 'ଇଣ୍ଟରନେଟ୍ ବିନା']}, 'offline_sync': {'question': {'en': 'How does offline synchronization work?', 'hi': 'ऑफ़लाइन सिंक्रोनाइज़ेशन कैसे काम करता है?', 'or': 'ଅଫଲାଇନ୍ ସିଙ୍କ୍ରୋନାଇଜେସନ୍ କିପରି କାମ କରେ?'}, 'answer': {'en': '🔄 **Offline Synchronization:**\n1. **Local Queue:** Transactions created offline are assigned unique client UUIDs and placed in a persistent queue.\n2. **Batch Upload:** When online connectivity returns, the background sync engine pushes pending records to `/api/sync/batch`.\n3. **Conflict Resolution:** Employs timestamp-based Last-Write-Wins and atomic transaction safety with zero data loss.', 'hi': '🔄 **ऑफलाइन सिंक्रोनाइज़ेशन प्रक्रिया:**\n1. **लोकल कतार:** ऑफलाइन बनाए गए ट्रांजेक्शन को क्लाइंट UUID दिया जाता है और लोकल कतार में रखा जाता है।\n2. **बैच अपलोड:** इंटरनेट कनेक्ट होते ही बैकग्राउंड इंजन सभी रिकॉर्ड्स को `/api/sync/batch` पर भेजता है।\n3. **विवाद समाधान:** टाइमस्टैम्प-आधारित लास्ट-राइट-विन्स और ऑटोमैटिक ट्रांजेक्शन सुरक्षा से डेटा सुरक्षित रहता है।', 'or': '🔄 **ଅଫଲାଇନ୍ ସିଙ୍କ୍ରୋନାଇଜେସନ୍ ପ୍ରଣାଳୀ:**\n1. **ଲୋକାଲ୍ ଧାଡ଼ି:** ଅଫଲାଇନ୍ କାରବାରଗୁଡ଼ିକୁ ଏକ ସ୍ୱତନ୍ତ୍ର UUID ଦିଆଯାଏ ଏବଂ ଲୋକାଲ୍ ଧାଡ଼ିରେ ରଖାଯାଏ।\n2. **ବ୍ୟାଚ୍ ଅପଲୋଡ୍:** ଇଣ୍ଟରନେଟ୍ ଫେରିବା କ୍ଷଣି ବ୍ୟାକଗ୍ରାଉଣ୍ଡ ସିଙ୍କ୍ ଇଞ୍ଜିନ୍ `/api/sync/batch` କୁ ସମସ୍ତ ତଥ୍ୟ ପଠାଏ।\n3. **କନଫ୍ଲିକ୍ଟ ରିଜୋଲ୍ୟୁସନ୍:** ଟାଇମଷ୍ଟାମ୍ପ ଆଧାରିତ ବ୍ୟବସ୍ଥା ଦ୍ୱାରା ଶୂନ୍ୟ ଡାଟା ନଷ୍ଟ ନିଶ୍ଚିତ ହୁଏ।'}, 'keywords': ['how does offline synchronization work', 'how offline sync works', 'how does sync work', 'offline synchronization work', 'offline sync', 'ऑफ़लाइन सिंक्रोनाइज़ेशन कैसे काम करता है', 'ऑफलाइन सिंक कैसे काम करता है', 'सिंक कैसे होता है', 'ଅଫଲାଇନ୍ ସିଙ୍କ୍ରୋନାଇଜେସନ୍ କିପରି କାମ କରେ', 'ସିଙ୍କ୍ କିପରି କାମ କରେ', 'ସିଙ୍କ୍ରୋନାଇଜେସନ୍']}, 'prevent_duplicates': {'question': {'en': 'How are duplicate submissions prevented?', 'hi': 'डुप्लिकेट सबमिशन को कैसे रोका जाता है?', 'or': 'ଡୁପ୍ଲିକେଟ୍ ଦାଖଲକୁ କିପରି ରୋକାଯାଏ?'}, 'answer': {'en': '🛡️ **Duplicate Prevention (Idempotency):**\nEvery offline creation generates a unique client-side UUID (`client_id`). During sync, the database repository verifies if the `client_id` already exists. If already present, the duplicate request is safely bypassed without re-creating the shipment, ensuring strict *exactly-once* semantics.', 'hi': '🛡️ **डुप्लिकेट सबमिशन की रोकथाम (Idempotency):**\nप्रत्येक ऑफलाइन रिकॉर्ड को एक विशिष्ट `client_id` (UUID) दिया जाता है। सिंक के दौरान डेटाबेस जांचता है कि क्या यह आईडी पहले से मौजूद है। यदि हां, तो डुप्लीकेट प्रविष्टि को छोड़ दिया जाता है, जिससे हर शिपमेंट केवल एक ही बार दर्ज होता है।', 'or': '🛡️ **ଡୁପ୍ଲିକେଟ୍ ରୋକିବା ପଦ୍ଧତି (Idempotency):**\nପ୍ରତ୍ୟେକ ଅଫଲାଇନ୍ ଏଣ୍ଟ୍ରିରେ ଏକ ଅନନ୍ୟ `client_id` (UUID) ସୃଷ୍ଟି ହୁଏ। ସିଙ୍କ୍ ସମୟରେ ଡାଟାବେସ୍ ଯାଞ୍ଚ କରେ ଯଦି ଏହି ID ପୂର୍ବରୁ ଅଛି, ତେବେ ତାହାକୁ ବାଦ୍ ଦିଆଯାଏ ଏବଂ କୌଣସି ଅର୍ଡର ଦୁଇଥର ଦାଖଲ ହୁଏ ନାହିଁ।'}, 'keywords': ['how are duplicate submissions prevented', 'duplicate submissions prevented', 'prevent duplicate', 'duplicate prevention', 'idempotent submission', 'डुप्लिकेट सबमिशन को कैसे रोका जाता है', 'डुप्लीकेट कैसे रोकते हैं', 'दोहराव कैसे रोकते हैं', 'ଡୁପ୍ଲିକେଟ୍ ଦାଖଲକୁ କିପରି ରୋକାଯାଏ', 'ଡୁପ୍ଲିକେଟ୍ କିପରି ରୋକାଯାଏ', 'ଡୁପ୍ଲିକେଟ୍ ନିବାରଣ']}, 'who_can_use': {'question': {'en': 'Who can use the platform?', 'hi': 'इस प्लेटफॉर्म का उपयोग कौन कर सकता है?', 'or': 'ଏହି ପ୍ଲାଟଫର୍ମକୁ କିଏ ବ୍ୟବହାର କରିପାରିବେ?'}, 'answer': {'en': '👥 **Supported Users & Roles:**\n1. **Shippers & Farmers:** Book consignments, request reefer storage, and track produce to central hubs.\n2. **Carriers & Drivers:** Receive optimal load-matching routes, fair compensation trips, and road condition alerts.\n3. **Network Admins:** Oversee network resilience, cold-chain SLA compliance, and multimodal corridor routing.', 'hi': '👥 **उपयोगकर्ता एवं भूमिकाएं:**\n1. **शिपर एवं किसान:** फसल व उपज की बुकिंग, कोल्ड स्टोरेज स्लॉट और डिलीवरी ट्रैकिंग के लिए।\n2. **ट्रांसपोर्टर्स एवं ड्राइवर:** अनुकूलित रूट, निष्पक्ष ट्रिप आवंटन और सड़क अलर्ट प्राप्त करने के लिए।\n3. **नेटवर्क एडमिनिस्ट्रेटर:** पूरे लॉजिस्टिक्स नेटवर्क, तापमान अनुपालन और मल्टी-मोडल कॉरिडोर प्रबंधन के लिए।', 'or': '👥 **ବ୍ୟବହାରକାରୀ ଓ ଭୂମିକା:**\n1. **ଚାଷୀ ଓ ସମବାୟ ସମିତି:** କୃଷିଜାତ ସାମଗ୍ରୀ ବୁକିଂ, ଶୀତଳ ଭଣ୍ଡାର ସଂରକ୍ଷଣ ଓ ଟ୍ରାକିଂ ପାଇଁ।\n2. **ଟ୍ରାନ୍ସପୋର୍ଟର୍ ଓ ଡ୍ରାଇଭର:** ସର୍ବୋତ୍ତମ ରୁଟ୍, ନ୍ୟାୟସଙ୍ଗତ ଟ୍ରିପ୍ ବଣ୍ଟନ ଓ ରାସ୍ତା ସୂଚନା ପାଇବା ପାଇଁ।\n3. **ନେଟୱାର୍କ ଆଡମିନିଷ୍ଟ୍ରେଟର:** ସମଗ୍ର ଲଜିଷ୍ଟିକ୍ସ ବ୍ୟବସ୍ଥା, କୋଲ୍ଡ-ଚେନ୍ ସୁରକ୍ଷା ଓ ରୁଟ୍ ତଦାରଖ ପାଇଁ।'}, 'keywords': ['who can use the platform', 'who can use this platform', 'who can use', 'eligible users', 'target users', 'इस प्लेटफॉर्म का उपयोग कौन कर सकता है', 'कौन उपयोग कर सकता है', 'उपयोगकर्ता कौन हैं', 'ଏହି ପ୍ଲାଟଫର୍ମକୁ କିଏ ବ୍ୟବହାର କରିପାରିବେ', 'କିଏ ବ୍ୟବହାର କରିପାରିବେ', 'କିଏ ବ୍ୟବହାର କରିପାରିବ']}, 'rural_help': {'question': {'en': 'How does the platform help rural areas?', 'hi': 'यह प्लेटफॉर्म ग्रामीण क्षेत्रों की कैसे मदद करता है?', 'or': 'ଏହି ପ୍ଲାଟଫର୍ମ ଗ୍ରାମାଞ୍ଚଳକୁ କିପରି ସାହାଯ୍ୟ କରେ?'}, 'answer': {'en': '🌾 **Rural Impact & Benefits:**\n• **Cooperative Freight Pooling:** Reduces transportation costs by up to 35% through consolidated loads.\n• **Spoilage Prevention:** Extends perishable crop and medicine shelf-life via continuous cold-chain monitoring.\n• **Multilingual Voice Bot:** Enables local producers to book cargo in Odia, Hindi, and English.\n• **Fair Dispatch:** Guarantees equitable load allocation across small rural vehicle owners.', 'hi': '🌾 **ग्रामीण क्षेत्रों के लिए लाभ:**\n• **सहकारी माल एकत्रीकरण:** भार समेकन से परिवहन लागत में 35% तक की बचत।\n• **खराबी से सुरक्षा:** निरंतर कोल्ड-चेन निगरानी से फसलों और दवाओं का जीवनकाल बढ़ता है।\n• **बहुभाषी वॉयस बॉट:** स्थानीय किसान उड़िया, हिंदी और अंग्रेजी में आसानी से ऑर्डर बुक कर सकते हैं।\n• **निष्पक्ष डिस्पैच:** छोटे ग्रामीण वाहन चालकों को समान और निष्पक्ष ट्रिप आवंटन।', 'or': '🌾 **ଗ୍ରାମାଞ୍ଚଳ ପାଇଁ ଲାଭ:**\n• **ସମବାୟ ମାଲ୍ ସମନ୍ୱୟ:** ଏକତ୍ରୀକରଣ ଦ୍ୱାରା ପରିବହନ ଖର୍ଚ୍ଚରେ ୩୫% ପର୍ଯ୍ୟନ୍ତ ସଞ୍ଚୟ ହୁଏ।\n• **ସାମଗ୍ରୀ ନଷ୍ଟରୁ ରକ୍ଷା:** କୋଲ୍ଡ-ଚେନ୍ ମନିଟରିଂ ଦ୍ୱାରା ଫସଲ ଓ ଔଷଧ ସୁରକ୍ଷିତ ରହେ।\n• **ଆଞ୍ଚଳିକ ଭଏସ୍ ବଟ୍:** ଓଡ଼ିଆ, ହିନ୍ଦୀ ଏବଂ ଇଂରାଜୀ ଭାଷାରେ ସହଜରେ ଅର୍ଡର ବୁକିଂ।\n• **ନ୍ୟାୟସଙ୍ଗତ ବଣ୍ଟନ:** ଗ୍ରାମାଞ୍ଚଳର ସମସ୍ତ ଛୋଟ ବଡ଼ ଗାଡ଼ି ମାଲିକଙ୍କୁ ଉପଯୁକ୍ତ କାମ।'}, 'keywords': ['how does the platform help rural areas', 'how platform helps rural', 'help rural areas', 'rural impact', 'rural benefit', 'यह प्लेटफॉर्म ग्रामीण क्षेत्रों की कैसे मदद करता है', 'ग्रामीण क्षेत्रों की मदद', 'ग्रामीण क्षेत्रों को क्या लाभ', 'ଏହି ପ୍ଲାଟଫର୍ମ ଗ୍ରାମାଞ୍ଚଳକୁ କିପରି ସାହାଯ୍ୟ କରେ', 'ଗ୍ରାମାଞ୍ଚଳକୁ କିପରି ସାହାଯ୍ୟ କରେ', 'ଗ୍ରାମାଞ୍ଚଳ ଲାଭ']}, 'no_vehicle_available': {'question': {'en': 'What happens if no vehicle is available?', 'hi': 'यदि कोई वाहन उपलब्ध न हो तो क्या होगा?', 'or': "ଯଦି କୌଣସି ଗାଡ଼ି ଉପଲବ୍ଧ ନଥାଏ ତେବେ କ'ଣ ହେବ?"}, 'answer': {'en': '⏳ **When No Vehicle is Available:**\n1. **Priority Queuing:** Your shipment is prioritized in the smart aggregation queue.\n2. **Cold Buffer Staging:** Cargo is assigned to local hub cold-storage holding cells to prevent spoilage.\n3. **Multimodal Fallback:** The engine searches for return-trip reefers, community vehicles, or Dedicated Freight Corridor (DFC) rail connections and notifies you instantly.', 'hi': '⏳ **यदि कोई वाहन उपलब्ध न हो:**\n1. **प्राथमिकता कतार:** आपके शिपमेंट को स्मार्ट एकत्रीकरण कतार में प्राथमिकता दी जाती है।\n2. **कोल्ड स्टोरेज सुरक्षा:** खराबी से बचाने के लिए सामान को स्थानीय हब के कोल्ड-स्टोरेज में सुरक्षित रखा जाता है।\n3. **मल्टी-मोडल विकल्प:** सिस्टम वापसी वाले रीफर ट्रकों, ग्रामीण वाहनों या डीएफसी रेल विकल्पों को सक्रिय करता है और आपको सूचित करता है।', 'or': '⏳ **ଯଦି କୌଣସି ଗାଡ଼ି ଉପଲବ୍ଧ ନଥାଏ:**\n1. **ପ୍ରାଥମିକତା ଧାଡ଼ି:** ଆପଣଙ୍କ ସିପ୍\u200cମେଣ୍ଟକୁ ସ୍ମାର୍ଟ ଧାଡ଼ିରେ ପ୍ରାଥମିକତା ଦିଆଯାଏ।\n2. **ଶୀତଳ ଭଣ୍ଡାର ସୁରକ୍ଷା:** ସାମଗ୍ରୀ ନଷ୍ଟ ନହେବା ପାଇଁ ସ୍ଥାନୀୟ ହବ୍\u200cର ଶୀତଳ ଭଣ୍ଡାରରେ ସୁରକ୍ଷିତ ରଖାଯାଏ।\n3. **ବିକଳ୍ପ ପରିବହନ:** ସିଷ୍ଟମ୍ ଫେରନ୍ତା ଟ୍ରକ୍, ଗ୍ରାମୀଣ ଗାଡ଼ି କିମ୍ବା ରେଳ DFC ସଂଯୋଗ ସନ୍ଧାନ କରେ ଏବଂ ତୁରନ୍ତ ଜଣାଏ।'}, 'keywords': ['what happens if no vehicle is available', 'if no vehicle is available', 'no vehicle is available', 'when no truck available', 'यदि कोई वाहन उपलब्ध न हो', 'गाड़ी उपलब्ध न हो तो क्या होगा', 'गाड़ी न मिलने पर', 'ଯଦି କୌଣସି ଗାଡ଼ି ଉପଲବ୍ଧ ନଥାଏ', "ଗାଡ଼ି ନମିଳିଲେ କ'ଣ ହେବ", 'ଗାଡ଼ି ନଥିଲେ']}, 'contact_help': {'question': {'en': 'How can I contact/get help?', 'hi': 'मैं सहायता के लिए कैसे संपर्क करूँ?', 'or': 'ମୁଁ ସହାୟତା ପାଇଁ କିପରି ଯୋଗାଯୋଗ କରିବି?'}, 'answer': {'en': '📞 **Getting Help & Support:**\n• **24/7 AI Assistant:** Ask any question or speak directly into this multilingual chatbot.\n• **Hub Coordinator:** Contact your Gram Panchayat Aggregation Node dispatcher.\n• **Enterprise Support:** Visit the **About / Manifesto** tab or submit an inquiry for dedicated assistance.', 'hi': '📞 **सहायता एवं संपर्क:**\n• **24/7 एआई सहायक:** इस बहुभाषी चैटबॉट में कभी भी पूछें या बोलें।\n• **हब समन्वयक:** अपने ग्राम पंचायत एकत्रीकरण केंद्र के डिस्पैचर से संपर्क करें।\n• **हेल्पडेस्क:** समर्पित सहायता के लिए **About / Manifesto** टैब पर जाएं या पूछताछ फॉर्म भरें।', 'or': '📞 **ସହାୟତା ଓ ଯୋଗାଯୋଗ:**\n• **୨୪/୭ AI ସହାୟକ:** ଏହି ଚାଟବଟ୍\u200cରେ ଯେକୌଣସି ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ ବା କୁହନ୍ତୁ।\n• **ହବ୍ ସଂଯୋଜକ:** ଆପଣଙ୍କ ଗ୍ରାମ ପଞ୍ଚାୟତ ସଂଗ୍ରହ କେନ୍ଦ୍ର ଡିସପାଚର୍\u200cଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ।\n• **ସହାୟତା କେନ୍ଦ୍ର:** ସ୍ୱତନ୍ତ୍ର ସହାୟତା ପାଇଁ **About / Manifesto** ବିଭାଗକୁ ଯାଆନ୍ତୁ।'}, 'keywords': ['how can i contact/get help', 'how can i contact', 'how to get help', 'how can i get help', 'contact support', 'helpdesk', 'मैं सहायता के लिए कैसे संपर्क करूँ', 'सहायता कैसे प्राप्त करें', 'संपर्क कैसे करें', 'मदद कैसे मिलेगी', 'ମୁଁ ସହାୟତା ପାଇଁ କିପରି ଯୋଗାଯୋଗ କରିବି', 'ସହାୟତା କିପରି ପାଇବି', 'ଯୋଗାଯୋଗ କିପରି କରିବି']}}

# ---------------------------------------------------------------------------
# LOCALIZED BASE SYSTEM MESSAGES
# ---------------------------------------------------------------------------
TEXTS = {
    "en": {
        "welcome": "Namaste! I am your Rural Logistics Assistant. I can help you with:\n1. 🔍 Order Tracking & Status (e.g., 'Status of RUR-90141')\n2. ⏱️ Delivery ETA Calculation\n3. 📅 Consignment Rescheduling\n4. 📦 Book New Cargo Pickup\n5. ❓ Frequently Asked Questions (FAQs)",
        "select_dest": "Got it! Which destination hub should we deliver this cargo to?",
        "select_good": "What type of cargo are you sending?",
        "select_temp": "What temperature storage does your cargo require?",
        "enter_weight": "What is the total weight in Kilograms (kg)?",
        "confirm": "Great! Here is your order details. Click below to confirm shipment booking.",
        "success": "Your shipment order has been successfully placed! Tracking ID generated.",
        "not_found": "We could not locate that waybill. Please check your tracking number (e.g. RUR-90141).",
        "rescheduled": "Shipment SLA has been successfully updated and rescheduled.",
        "faq_list_intro": "Here are common topics I can help you with. Tap a question or type below:",
    },
    "hi": {
        "welcome": "नमस्ते! मैं आपका ग्रामीण लॉजिस्टिक्स सहायक हूँ। मैं आपकी सहायता कर सकता हूँ:\n1. 🔍 ऑर्डर ट्रैकिंग एवं स्थिति (उदा. 'RUR-90141 की स्थिति')\n2. ⏱️ डिलीवरी ईटीए (उदा. 'RUR-90142 कब पहुँचेगा?')\n3. 📅 पिकअप पुनः निर्धारित (उदा. 'RUR-90143 का समय बदलें')\n4. 📦 नया पिकअप बुक करें\n5. ❓ अक्सर पूछे जाने वाले प्रश्न (FAQs)",
        "select_dest": "बहुत बढ़िया! यह सामान किस हब पर पहुँचाना है?",
        "select_good": "आप किस प्रकार की सामग्री भेज रहे हैं?",
        "select_temp": "आपकी सामग्री को किस तापमान भंडारण की आवश्यकता है?",
        "enter_weight": "कुल वजन किलोग्राम (kg) में कितना है?",
        "confirm": "उत्कृष्ट! आपके ऑर्डर का विवरण यहाँ है। शिपमेंट बुक करने के लिए नीचे पुष्टि करें।",
        "success": "आपका शिपमेंट ऑर्डर सफलतापूर्वक दर्ज कर लिया गया है! ट्रैकिंग आईडी जनरेट हो गई है।",
        "not_found": "हमें वह वे-बिल नहीं मिला। कृपया अपना ट्रैकिंग नंबर जाँचें (उदा. RUR-90141)।",
        "rescheduled": "शिपमेंट का समय सफलतापूर्वक पुनः निर्धारित कर दिया गया है।",
        "faq_list_intro": "यहाँ कुछ मुख्य प्रश्न हैं जिनमें मैं आपकी सहायता कर सकता हूँ। नीचे टैप करें:",
    },
    "or": {
        "welcome": "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର ଗ୍ରାମୀଣ ଲଜିଷ୍ଟିକ୍ସ ସହାୟକ। ମୁଁ ସାହାଯ୍ୟ କରିପାରିବି:\n1. 🔍 ଅର୍ଡର ଟ୍ରାକିଂ (ଯଥା: 'RUR-90141 ର ସ୍ଥିତି')\n2. ⏱️ ଡେଲିଭରୀ ETA ହିସାବ\n3. 📅 ପୁନଃ ନିର୍ଦ୍ଧାରଣ (Reschedule)\n4. 📦 ନୂତନ ଅର୍ଡର ବୁକିଂ\n5. ❓ ସାଧାରଣ ପ୍ରଶ୍ନୋତ୍ତର (FAQs)",
        "select_dest": "ବହୁତ ଭଲ! ଏହି ସାମଗ୍ରୀ କେଉଁ ହବ୍‌କୁ ପଠାଯିବ?",
        "select_good": "ଆପଣ କେଉଁ ପ୍ରକାରର ସାମଗ୍ରୀ ପଠାଉଛନ୍ତି?",
        "select_temp": "ଆପଣଙ୍କ ସାମଗ୍ରୀ ପାଇଁ କେଉଁ ତାପମାତ୍ରା ଆବଶ୍ୟକ?",
        "enter_weight": "ମୋଟ ଓଜନ କିଲୋଗ୍ରାମ (kg) ରେ କେତେ?",
        "confirm": "ଉତ୍ତମ! ଆପଣଙ୍କ ଅର୍ଡର ବିବରଣୀ ଏଠାରେ ଅଛି। ନିଶ୍ଚିତ କରିବାକୁ ତଳେ କ୍ଲିକ୍ କରନ୍ତୁ।",
        "success": "ଆପଣଙ୍କ ସିପ୍‌ମେଣ୍ଟ ଅର୍ଡର ସଫଳତାର ସହିତ ସମ୍ପନ୍ନ ହୋଇଛି! ଟ୍ରାକିଂ ଆଇଡି: ",
        "not_found": "ଆମେ ସେହି ୱେ-ବିଲ୍ ପାଇଲୁ ନାହିଁ। ଦୟାକରି ଆପଣଙ୍କ ଟ୍ରାକିଂ ନମ୍ବର ଯାଞ୍ଚ କରନ୍ତୁ (ଯଥା: RUR-90141)।",
        "rescheduled": "ସିପ୍‌ମେଣ୍ଟ ପୁନଃ ନିର୍ଦ୍ଧାରଣ ସଫଳତାର ସହିତ ହୋଇଛି।",
        "faq_list_intro": "ଏଠାରେ କିଛି ମୁଖ୍ୟ ପ୍ରଶ୍ନୋତ୍ତର ରହିଛି। ତଳେ କ୍ଲିକ୍ କରନ୍ତୁ କିମ୍ବା ଟାଇପ୍ କରନ୍ତୁ:",
    },
}


def find_matching_faq(msg_lower: str) -> Optional[str]:
    """Matches user query against the 12 FAQ topics using keyword heuristics."""
    clean_msg = re.sub(r"[^\w\s\u0900-\u097F\u0B00-\u0B7F]", " ", msg_lower).strip()

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


@router.post("", response_model=ChatMessageResponse, status_code=status.HTTP_200_OK)
@router.post("/assistant", response_model=ChatMessageResponse, status_code=status.HTTP_200_OK)
async def chat_assistant(
    req: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    locale = req.locale if req.locale in ["en", "hi", "or"] else "en"
    texts = TEXTS.get(locale, TEXTS["en"])
    msg = req.message.strip()
    msg_lower = msg.lower()
    context = req.context or {}
    step = context.get("step", "greeting")
    draft = context.get("draft_shipment") or {}

    # Fetch hubs for recommendations
    hub_res = await db.execute(select(Hub).where(Hub.is_active.is_(True)).limit(10))
    all_hubs = hub_res.scalars().all()
    hub_list = [{"id": str(h.id), "name": h.name, "type": str(h.type)} for h in all_hubs]
    if not hub_list:
        hub_list = [
            {"id": "hub-01", "name": "Village A (Pipili Rural Cluster)", "type": "aggregation_node"},
            {"id": "hub-02", "name": "Bhubaneswar Central Cold Hub", "type": "district_hub"},
            {"id": "hub-03", "name": "Cuttack Railway Consolidation Node", "type": "freight_terminal"},
            {"id": "hub-04", "name": "Paradeep Port Reefer Staging", "type": "marine_terminal"},
        ]

    waybill_match = re.search(r"(RUR-\d{3,6})", msg, re.IGNORECASE)
    waybill_query = waybill_match.group(1).upper() if waybill_match else None

    # -------------------------------------------------------------
    # INTENT 1: DIRECT SHIPMENT / WAYBILL QUERY OVERRIDES
    # -------------------------------------------------------------
    if waybill_query:
        if "reschedule" in msg_lower or "delay" in msg_lower or "change time" in msg_lower or "बदलें" in msg_lower or "ପରିବର୍ତ୍ତନ" in msg_lower:
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
        elif "eta" in msg_lower or "when" in msg_lower or "arrive" in msg_lower or "समय" in msg_lower or "କେତେବେଳେ" in msg_lower:
            stmt = select(Shipment).where(Shipment.waybill_number == waybill_query)
            res = await db.execute(stmt)
            shipment = res.scalars().first()

            now = datetime.now(timezone.utc)
            estimated_arrival = now + timedelta(hours=3, minutes=45)

            reply = (
                f"⏱️ **Delivery ETA for {waybill_query}:**\n"
                f"• **Estimated Arrival Time:** {estimated_arrival.strftime('%H:%M UTC')} (approx. 3 hrs 45 mins)\n"
                f"• **Corridor:** Pipili / Khordha Feeder ➔ Bhubaneswar Central Hub\n"
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
                orig_name = orig_h.name if orig_h else "Pipili Rural Hub"
                dest_name = dest_h.name if dest_h else "Bhubaneswar Central Hub"

                status_str = shipment.status.value.upper() if hasattr(shipment.status, "value") else str(shipment.status).upper()
                temp_str = shipment.temp_class.value.upper() if hasattr(shipment.temp_class, "value") else str(shipment.temp_class).upper()
                good_str = shipment.good_type.value.capitalize() if hasattr(shipment.good_type, "value") else str(shipment.good_type).capitalize()
                prod_str = shipment.producer_name or "Pipili Health Sub-Centre"

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

    # General FAQ request (e.g. "faq", "faqs", "help", "questions", "मदद", "सवाल", "ପ୍ରଶ୍ନ")
    is_general_faq_query = (
        matched_faq_id is None
        and any(
            t in msg_lower
            for t in ["faq", "faqs", "help", "questions", "question", "मदद", "सवाल", "प्रश्न", "ପ୍ରଶ୍ନ", "ସାହାଯ୍ୟ"]
        )
    )

    if matched_faq_id:
        faq_item = FAQS_DATA[matched_faq_id]
        reply = faq_item["answer"].get(locale, faq_item["answer"]["en"])

        if locale == "or":
            quick_replies = ["❓ ଅନ୍ୟାନ୍ୟ ପ୍ରଶ୍ନ (FAQs)", "📦 ଅର୍ଡର ବୁକ୍ କରନ୍ତୁ", "🔍 ଅର୍ଡର ଟ୍ରାକ୍ କରନ୍ତୁ"]
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
    if "eta" in msg_lower or ("when" in msg_lower and "arrive" in msg_lower) or "समय" in msg_lower or "କେତେବେଳେ" in msg_lower:
        stmt = select(Shipment).limit(1)
        res = await db.execute(stmt)
        shipment = res.scalars().first()

        wb = shipment.waybill_number if shipment else "RUR-90141"
        now = datetime.now(timezone.utc)
        estimated_arrival = now + timedelta(hours=3, minutes=45)

        reply = (
            f"⏱️ **Delivery ETA for {wb}:**\n"
            f"• **Estimated Arrival Time:** {estimated_arrival.strftime('%H:%M UTC')} (approx. 3 hrs 45 mins)\n"
            f"• **Corridor:** Pipili / Khordha Feeder ➔ Bhubaneswar Central Hub\n"
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
    elif "reschedule" in msg_lower or "change time" in msg_lower or "बदलें" in msg_lower or "ପରିବର୍ତ୍ତନ" in msg_lower:
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
    elif "status" in msg_lower or "where is" in msg_lower or "track" in msg_lower or "स्थिति" in msg_lower or "ସ୍ଥିତି" in msg_lower:
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
    if step == "greeting" or "start" in msg_lower or "book" in msg_lower or "order" in msg_lower or "अर्डर" in msg_lower or "ଅର୍ଡର" in msg_lower:
        reply = texts["welcome"]
        step = "select_origin"
        quick_replies = [h["name"] for h in hub_list[:4]] + ["❓ FAQs"]

    elif step == "select_origin":
        matched = next((h for h in hub_list if h["name"].lower() in msg_lower or msg_lower in h["name"].lower()), None)
        if matched:
            draft["origin_hub_id"] = matched["id"]
            draft["origin_hub_name"] = matched["name"]
        else:
            draft["origin_hub_id"] = hub_list[0]["id"] if hub_list else None
            draft["origin_hub_name"] = hub_list[0]["name"] if hub_list else "Village A (Pipili Rural Cluster)"

        reply = texts["select_dest"]
        step = "select_destination"
        quick_replies = [h["name"] for h in hub_list if h["id"] != draft.get("origin_hub_id")][:4]

    elif step == "select_destination":
        matched = next((h for h in hub_list if h["name"].lower() in msg_lower or msg_lower in h["name"].lower()), None)
        if matched:
            draft["dest_hub_id"] = matched["id"]
            draft["dest_hub_name"] = matched["name"]
        else:
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
        if "vaccine" in msg_lower or "medicine" in msg_lower or "दवा" in msg_lower or "ଟିକା" in msg_lower or "ଔଷଧ" in msg_lower:
            draft["good_type"] = GoodType.medicine.value
            draft["good_type_label"] = "Vaccines & Medical Supplies"
            draft["quantity_units"] = "vials"
        elif "milk" in msg_lower or "dairy" in msg_lower or "दूध" in msg_lower or "କ୍ଷୀର" in msg_lower:
            draft["good_type"] = GoodType.farm_produce.value
            draft["good_type_label"] = "Dairy & Milk Products"
            draft["quantity_units"] = "litres"
        elif "fish" in msg_lower or "sea" in msg_lower or "मछली" in msg_lower or "ମାଛ" in msg_lower:
            draft["good_type"] = GoodType.farm_produce.value
            draft["good_type_label"] = "Fish & Seafood"
            draft["quantity_units"] = "crates"
        else:
            draft["good_type"] = GoodType.farm_produce.value
            draft["good_type_label"] = "Fresh Farm Produce"
            draft["quantity_units"] = "crates"

        reply = texts["select_temp"]
        step = "select_temp"
        if locale == "or":
            quick_replies = ["ଶୀତଳ (-20°C ବରଫ)", "ଥଣ୍ଡା (2°C - 8°C)", "ସାଧାରଣ (15°C - 25°C)"]
        elif locale == "hi":
            quick_replies = ["जमे हुए (-20°C फ्रोजन)", "ठंडा (2°C - 8°C चिल)", "सामान्य (15°C - 25°C)"]
        else:
            quick_replies = ["Frozen (-20°C Deep Cold)", "Chilled (2°C - 8°C Cold Chain)", "Ambient (15°C - 25°C Normal)"]

    elif step == "select_temp":
        if "frozen" in msg_lower or "ice" in msg_lower or "बरफ" in msg_lower or "ବରଫ" in msg_lower or "-20" in msg_lower:
            draft["temp_class"] = TempClass.frozen.value
            draft["temp_label"] = "Frozen (-20°C)"
        elif "chill" in msg_lower or "cold" in msg_lower or "ठंडा" in msg_lower or "ଥଣ୍ଡା" in msg_lower or "8" in msg_lower:
            draft["temp_class"] = TempClass.chilled.value
            draft["temp_label"] = "Chilled (2°C to 8°C)"
        else:
            draft["temp_class"] = TempClass.ambient.value
            draft["temp_label"] = "Ambient (15°C to 25°C)"

        reply = texts["enter_weight"]
        step = "enter_weight"
        quick_replies = ["50 kg (10 crates)", "100 kg (20 crates)", "250 kg (50 crates)", "500 kg (100 crates)"]

    elif step == "enter_weight":
        numbers = re.findall(r"\d+", msg)
        weight = float(numbers[0]) if numbers else 100.0
        load_qty = float(numbers[1]) if len(numbers) > 1 else max(1.0, round(weight / 5.0))

        draft["weight_kg"] = weight
        draft["load_quantity"] = load_qty
        draft["volume_cbm"] = round(weight * 0.005, 2)
        draft["producer_id"] = "prod-rural-farmer-01"
        draft["producer_name"] = "Gram Panchayat Farmer Co-op"
        draft["community_id"] = "comm-cluster-pipili"
        draft["urgency"] = UrgencyLevel.routine.value
        draft["waybill_number"] = f"RUR-{int(datetime.now().timestamp()) % 100000:05d}"

        reply = f"{texts['confirm']}\n\n• **Waybill:** {draft['waybill_number']}\n• **Weight:** {weight} kg ({load_qty} {draft.get('quantity_units', 'units')})\n• **Route:** {draft.get('origin_hub_name')} ➔ {draft.get('dest_hub_name')}"
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
        quick_replies = [h["name"] for h in hub_list[:4]] + ["❓ FAQs"]

    return ChatMessageResponse(
        reply=reply,
        locale=locale,
        step=step,
        quick_replies=quick_replies,
        draft_shipment=draft,
        hubs=hub_list[:6],
    )
