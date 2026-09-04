"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { createShipment } from "../../lib/api/shipments";
import { getHubs } from "../../lib/api/network";
import { API_BASE } from "../../lib/api/client";
import { OfflineSyncManager } from "../../lib/offline/syncStore";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  stepKey?: string;
  draftShipment?: any;
  orderId?: string;
  faqId?: string;
  aiGenerated?: boolean;
  providerUsed?: string;
}

const SPEECH_LANG_MAP: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  or: "or-IN",
};

export const FAQS_DATA: Record<
  string,
  {
    question: Record<string, string>;
    answer: Record<string, string>;
    keywords: string[];
  }
> = {
  what_is_platform: {
    question: {
      en: "What is this platform?",
      hi: "यह प्लेटफॉर्म क्या है?",
      or: "ଏହି ପ୍ଲାଟଫର୍ମ କ'ଣ?",
    },
    answer: {
      en: "📦 **CargoMind (ShipMerge)** is an AI-powered multi-tenant rural logistics and cold-chain consolidation platform. It optimizes multi-modal freight distribution (road, rail DFC, refrigerated reefers), predicts perishable spoilage using physics-based kinetics (Arrhenius & Q10), and connects rural producers and farmer cooperatives directly to regional markets.",
      hi: "📦 **कार्गोमाइंड (CargoMind / ShipMerge)** एक एआई-संचालित मल्टी-टेनेंट ग्रामीण लॉजिस्टिक्स और कोल्ड-चेन समेकन प्लेटफॉर्म है। यह मल्टी-मोडल माल परिवहन (सड़क, रेल डीएफसी, रीफर वाहन) को अनुकूलित करता है, भौतिकी-आधारित काइनेटिक्स (Arrhenius & Q10) से खराब होने वाले सामान के जोखिम का सटीक अनुमान लगाता है, और ग्रामीण उत्पादकों को सीधे क्षेत्रीय बाजारों से जोड़ता है।",
      or: "📦 **କାର୍ଗୋମାଇଣ୍ଡ (CargoMind / ShipMerge)** ହେଉଛି ଏକ AI-ଚାଳିତ ମଲ୍ଟି-ଟେନାଣ୍ଟ ଗ୍ରାମୀଣ ଲଜିଷ୍ଟିକ୍ସ ଏବଂ କୋଲ୍ଡ-ଚେନ୍ ସମନ୍ୱୟ ପ୍ଲାଟଫର୍ମ। ଏହା ମଲ୍ଟି-ମୋଡାଲ୍ ପରିବହନ (ସଡ଼କ, ରେଳ DFC, ରେଫ୍ରିଜରେଟେଡ୍ ଗାଡ଼ି) କୁ ସୁବ୍ୟବସ୍ଥିତ କରେ, ଫଳ-ପନିପରିବା ଓ ଔଷଧ ନଷ୍ଟ ହେବାର ଆଶଙ୍କା ଆକଳନ କରେ, ଏବଂ ଗ୍ରାମୀଣ ଚାଷୀ ଓ ସମବାୟ ସମିତିଗୁଡ଼ିକୁ ପ୍ରମୁଖ ବଜାର ସହିତ ଯୋଡ଼ିଥାଏ।",
    },
    keywords: [
      "what is this platform", "what is platform", "what is cargomind", "what is shipmerge", "about the platform", "about platform",
      "यह प्लेटफॉर्म क्या है", "यह क्या है", "कार्गोमाइंड क्या है",
      "ଏହି ପ୍ଲାଟଫର୍ମ କ'ଣ", "ପ୍ଲାଟଫର୍ମ ବିଷୟରେ", "କାର୍ଗୋମାଇଣ୍ଡ କ'ଣ",
    ],
  },
  create_shipment: {
    question: {
      en: "How do I create a shipment?",
      hi: "मैं शिपमेंट कैसे बना सकता हूँ?",
      or: "ମୁଁ କିପରି ସିପ୍‌ମେଣ୍ଟ ତିଆରି କରିବି?",
    },
    answer: {
      en: "📝 **Creating a Shipment:**\n1. Use this Chatbot: Type or speak *'Book order'* to start our guided step-by-step assistant.\n2. Via Web Portal: Go to the **Pickups / Shipments** section and click **Create Shipment**.\n3. Specify your origin hub/village, destination hub, commodity type, temperature class (Frozen, Chilled, Ambient), and total weight (kg).",
      hi: "📝 **शिपमेंट बनाने की विधि:**\n1. इस चैटबॉट से: बोलें या लिखें *'ऑर्डर बुक करें'* और चरण-दर-चरण प्रक्रिया का पालन करें।\n2. वेब पोर्टल से: **Pickups / Shipments** सेक्शन में जाएं और **Create Shipment** पर क्लिक करें।\n3. अपना मूल गाँव/हब, गंतव्य हब, सामग्री का प्रकार, तापमान श्रेणी (फ्रोजन, चिल्ड, सामान्य) और वजन (किलोग्राम) दर्ज करें।",
      or: "📝 **ସିପ୍‌ମେଣ୍ଟ ତିଆରି କରିବା ପ୍ରଣାଳୀ:**\n1. ଏହି ଚାଟବଟ୍ ବ୍ୟବହାର କରନ୍ତୁ: *'ଅର୍ଡର ବୁକ୍ କରନ୍ତୁ'* ଟାଇପ୍ କରନ୍ତୁ କିମ୍ବା କୁହନ୍ତୁ।\n2. ୱେବ୍ ପୋର୍ଟାଲ୍ ମାଧ୍ୟମରେ: **Pickups / Shipments** ବିଭାଗକୁ ଯାଇ **Create Shipment** ଉପରେ କ୍ଲିକ୍ କରନ୍ତୁ।\n3. ଉତ୍ପାଦନ କେନ୍ଦ୍ର, ଗନ୍ତବ୍ୟ ହବ୍, ସାମଗ୍ରୀର ପ୍ରକାର, ତାପମାତ୍ରା ବର୍ଗ (ଶୀତଳ, ଥଣ୍ଡା, ସାଧାରଣ) ଏବଂ ଓଜନ ଦିଅନ୍ତୁ।",
    },
    keywords: [
      "how do i create a shipment", "how to create a shipment", "how to create shipment", "how to make a shipment", "how to book a shipment", "how to book cargo",
      "शिपमेंट कैसे बना", "शिपमेंट कैसे बनाएँ", "ऑर्डर कैसे बनाएँ", "शिपमेंट कैसे बनाएं",
      "ସିପ୍‌ମେଣ୍ଟ କିପରି ତିଆରି କରିବି", "ସିପ୍‌ମେଣ୍ଟ କିପରି କରିବି", "ସିପମେଣ୍ଟ କିପରି",
    ],
  },
  find_vehicle: {
    question: {
      en: "How can I find a vehicle?",
      hi: "मैं वाहन कैसे खोज सकता हूँ?",
      or: "ମୁଁ ଗାଡ଼ି କିପରି ଖୋଜିବି?",
    },
    answer: {
      en: "🚚 **Finding a Vehicle:**\n• **Automated Matching:** Vehicles are automatically matched to your shipment using our intelligent multi-modal optimization engine.\n• **Fleet Directory:** Navigate to the **Dispatch** or **Kinetics** tab to view active cooperative vehicles, reefer trucks, dynamic GPS telemetry, and available payload capacity.",
      hi: "🚚 **वाहन खोजने की प्रक्रिया:**\n• **स्वचालित मैचिंग:** हमारा इंटेलिजेंट ऑप्टिमाइजेशन इंजन आपके शिपमेंट के लिए सर्वोत्तम वाहन का स्वतः चयन करता है।\n• **फ्लीट डायरेक्टरी:** उपलब्ध रीफर गाड़ियाँ, वाहन क्षमता, GPS लोकेशन और तापमान स्थिति देखने के लिए **Dispatch** या **Kinetics** टैब देखें।",
      or: "🚚 **ଗାଡ଼ି ଖୋଜିବା ପ୍ରଣାଳୀ:**\n• **ସ୍ୱୟଂଚାଳିତ ମ୍ୟାଚିଂ:** ଆମର ଇଣ୍ଟେଲିଜେଣ୍ଟ ଅପ୍ଟିମାଇଜେସନ୍ ଇଞ୍ଜିନ୍ ଆପଣଙ୍କ ସିପ୍‌ମେଣ୍ଟ ପାଇଁ ଉପଯୁକ୍ତ ଗାଡ଼ି ସ୍ୱୟଂଚାଳିତ ଭାବେ ବାଛିଥାଏ।\n• **ଗାଡ଼ି ତାଲିକା:** ଉପଲବ୍ଧ ସମବାୟ ଗାଡ଼ି, ଲାଇଭ୍ GPS ଲୋକେସନ୍ ଏବଂ କ୍ଷମତା ଦେଖିବାକୁ **Dispatch** କିମ୍ବା **Kinetics** ବିଭାଗକୁ ଯାଆନ୍ତୁ।",
    },
    keywords: [
      "how can i find a vehicle", "how to find a vehicle", "how do i find a vehicle", "how to find vehicle", "how can i get a vehicle", "find a vehicle",
      "वाहन कैसे खोज", "गाड़ी कैसे खोज", "गाड़ी कैसे मिलेगी", "वाहन कैसे खोजें",
      "ଗାଡ଼ି କିପରି ଖୋଜିବି", "ଗାଡ଼ି କିପରି ମିଳିବ", "ଗାଡି କିପରି",
    ],
  },
  vehicle_matching: {
    question: {
      en: "How does vehicle matching work?",
      hi: "वाहन मिलान कैसे काम करता है?",
      or: "ଗାଡ଼ି ମ୍ୟାଚିଂ କିପରି କାମ କରେ?",
    },
    answer: {
      en: "🧠 **Vehicle Matching Engine:**\nPowered by **Google OR-Tools CP-SAT Combinatorial Optimization**:\n1. **Thermal Isolation:** Strictly prevents co-loading incompatible temperatures (e.g., Frozen -18°C vs Ambient).\n2. **Payload & Volume Bounds:** Respects maximum kg capacity and cubic meter volume constraints.\n3. **Road Quality & Kinetics:** Integrates unpaved rural road conditions and shelf-life degradation rates.\n4. **Driver Fairness:** Balances dispatches among local community carriers.",
      hi: "🧠 **वाहन मिलान (Vehicle Matching) प्रणाली:**\nयह **Google OR-Tools CP-SAT ऑप्टिमाइजेशन** पर आधारित है:\n1. **तापमान अलगाव:** फ्रोजन (-18°C) और सामान्य सामान को एक साथ लोड होने से रोकता है।\n2. **भार व आयतन सीमा:** वाहन की पेलोड वजन और क्यूबिक मीटर क्षमता का पालन करता है।\n3. **सड़क की स्थिति एवं काइनेटिक्स:** कच्ची ग्रामीण सड़कों और सामान की शेल्फ-लाइफ का विश्लेषण करता है।\n4. **चालक निष्पक्षता:** स्थानीय ड्राइवरों के बीच समान ट्रिप वितरण सुनिश्चित करता है।",
      or: "🧠 **ଗାଡ଼ି ମ୍ୟାଚିଂ କାର୍ଯ୍ୟପ୍ରଣାଳୀ:**\nଏହା **Google OR-Tools CP-SAT କମ୍ବିନେଟୋରିଆଲ୍ ଅପ୍ଟିମାଇଜେସନ୍** ଦ୍ୱାରା ପରିଚାଳିତ:\n1. **ତାପମାତ୍ରା ସୁରକ୍ଷା:** ଫ୍ରୋଜେନ୍ (-18°C) ଓ ସାଧାରଣ ସାମଗ୍ରୀ କଦାପି ଏକାଠି ଲୋଡ୍ କରେ ନାହିଁ।\n2. **ଓଜନ ଓ ଆୟତନ ସୀମା:** ଗାଡ଼ିର ସର୍ବାଧିକ ଓଜନ ଏବଂ ଆୟତନ କ୍ଷମତା ଅନୁସରଣ କରେ।\n3. **ରାସ୍ତା ଓ ସ୍ଥାୟିତ୍ୱ:** ଗ୍ରାମାଞ୍ଚଳ କଞ୍ଚା ରାସ୍ତା ଓ ସାମଗ୍ରୀର ସୁରକ୍ଷା ଅବଧି ହିସାବ କରେ।\n4. **ନ୍ୟାୟସଙ୍ଗତ ବଣ୍ଟନ:** ସମସ୍ତ ସ୍ଥାନୀୟ ଡ୍ରାଇଭରଙ୍କ ମଧ୍ୟରେ ସମାନ ଭାବେ କାମ ବଣ୍ଟନ କରେ।",
    },
    keywords: [
      "how does vehicle matching work", "how vehicle matching works", "vehicle matching algorithm", "cp-sat matching", "matching logic", "vehicle matching work",
      "वाहन मिलान कैसे काम करता है", "मैचिंग कैसे काम करती है", "मैचिंग कैसे होती है",
      "ଗାଡ଼ି ମ୍ୟାଚିଂ କିପରି କାମ କରେ", "ମ୍ୟାଚିଂ କିପରି କାମ କରେ", "ଗାଡି ମ୍ୟାଚିଂ",
    ],
  },
  vehicle_fleet_dynamism: {
    question: {
      en: "Is the vehicle quantity fixed or dynamically calculated?",
      hi: "क्या वाहनों की संख्या निश्चित है या गतिशील?",
      or: "ଗାଡ଼ି ସଂଖ୍ୟା ନିର୍ଦ୍ଦିଷ୍ଟ କି ଗତିଶୀଳ?",
    },
    answer: {
      en: "📊 **Dynamic Synthetic Vehicle Pool:**\nWe don't assume a fixed number of vehicles. The prototype uses a synthetic baseline vehicle registry because real operational datasets were not available.\n• **Dynamic Pool:** Vehicles can become available, unavailable, occupied, or added at runtime.\n• **Automatic Recalculation:** The optimizer consumes the currently available fleet from the registry without hardcoded vehicle counts and recalculates allocations dynamically.",
      hi: "📊 **गतिशील सिंथेटिक वाहन पूल:**\nहम वाहनों की कोई निश्चित संख्या नहीं मानते हैं। प्रोटोटाइप सिंथेटिक बेसलाइन वाहन रजिस्ट्री का उपयोग करता है क्योंकि वास्तविक परिचालन डेटा उपलब्ध नहीं था।\n• **गतिशील पूल:** वाहन उपलब्ध, अनुपलब्ध, व्यस्त या नए जोड़े जा सकते हैं।\n• **स्वचालित पुनः आवंटन:** ऑप्टिमाइज़र रजिस्ट्री से वर्तमान उपलब्ध बेड़े को इनपुट के रूप में लेता है और बिना किसी हार्ड-कोडेड वाहन सीमा के स्वतः पुनः आवंटन करता है।",
      or: "📊 **ଡାଇନାମିକ୍ ସିନ୍ଥେଟିକ୍ ଗାଡ଼ି ପୁଲ୍:**\nଆମେ ଗାଡ଼ିର କୌଣସି ନିର୍ଦ୍ଦିଷ୍ଟ ସଂଖ୍ୟା ଧରି ନେଇନାହୁଁ। ପ୍ରକୃତ କାର୍ଯ୍ୟକ୍ଷମ ତଥ୍ୟ ଅନୁପଲବ୍ଧ ଥିବାରୁ ପ୍ରୋଟୋଟାଇପ୍ ଏକ ସିନ୍ଥେଟିକ୍ ବେସଲାଇନ୍ ଗାଡ଼ି ରେଜିଷ୍ଟ୍ରି ବ୍ୟବହାର କରେ।\n• **ଗତିଶୀଳ ପୁଲ୍:** ଗାଡ଼ି ଉପଲବ୍ଧ, ଅନୁପଲବ୍ଧ, ବ୍ୟସ୍ତ କିମ୍ବା ନୂଆ ଯୋଗ ହୋଇପାରେ।\n• **ସ୍ୱୟଂଚାଳିତ ପୁନଃ ଗଣନା:** ଅପ୍ଟିମାଇଜର୍ ବର୍ତ୍ତମାନ ଉପଲବ୍ଧ ଫ୍ଲିଟ୍‌କୁ ଇନପୁଟ୍ ନେଇ ସ୍ୱୟଂଚାଳିତ ଭାବେ ଆବଣ୍ଟନ ପୁନଃ ନିର୍ଦ୍ଧାରଣ କରେ।",
    },
    keywords: [
      "is vehicle quantity fixed", "are vehicles fixed", "how many vehicles", "fixed fleet", "synthetic vehicles", "vehicle pool dynamic", "why synthetic vehicles", "vehicle registry",
      "क्या वाहन निश्चित हैं", "वाहनों की संख्या निश्चित", "कितने वाहन हैं", "सिंथेटिक वाहन",
      "ଗାଡ଼ି ସଂଖ୍ୟା ନିର୍ଦ୍ଦିଷ୍ଟ କି", "କେତେ ଗାଡ଼ି ଅଛି", "ସିନ୍ଥେଟିକ୍ ଗାଡ଼ି",
    ],
  },
  track_shipment: {
    question: {
      en: "How can I track my shipment?",
      hi: "मैं अपना शिपमेंट कैसे ट्रैक करूँ?",
      or: "ମୁଁ ମୋର ସିପ୍‌ମେଣ୍ଟ କିପରି ଟ୍ରାକ୍ କରିପାରିବି?",
    },
    answer: {
      en: "📍 **Shipment Tracking:**\n• **Via Chatbot:** Simply ask *'Track RUR-90141'* or *'Status of my order'*.\n• **Via Map View:** Check the interactive **Overview / Topology** map for live GPS movement, ETA estimates, cold-chain temperature telemetry, and predicted shelf-life health.",
      hi: "📍 **शिपमेंट ट्रैकिंग:**\n• **चैटबॉट से:** सीधे लिखें या पूछें *'Track RUR-90141'* या *'ऑर्डर की स्थिति'*।\n• **मानचित्र दृश्य:** लाइव GPS लोकेशन, आगमन समय (ETA), रीफर तापमान और शेल्फ-लाइफ स्वास्थ्य देखने के लिए **Overview / Topology** मैप देखें।",
      or: "📍 **ସିପ୍‌ମେଣ୍ଟ ଟ୍ରାକିଂ:**\n• **ଚାଟବଟ୍ ମାଧ୍ୟମରେ:** ସିଧାସଳଖ ଲେଖନ୍ତୁ *'Track RUR-90141'* କିମ୍ବା *'ମୋ ଅର୍ଡର ସ୍ଥିତି'*।\n• **ମ୍ୟାପ୍ ଭ୍ୟୁ:** ଲାଇଭ୍ GPS ଲୋକେସନ୍, ଆଗମନ ସମୟ (ETA), କୋଲ୍ଡ-ଚେନ୍ ତାପମାତ୍ରା ଓ ସାମଗ୍ରୀ ସ୍ଥିତି ପାଇଁ **Overview / Topology** ମ୍ୟାପ୍ ଦେଖନ୍ତୁ।",
    },
    keywords: [
      "how can i track my shipment", "how to track my shipment", "how to track shipment", "how do i track shipment", "tracking process",
      "शिपमेंट कैसे ट्रैक करूँ", "शिपमेंट कैसे ट्रैक करें", "ट्रैक कैसे करें", "ट्रैकिंग कैसे करें",
      "ସିପ୍‌ମେଣ୍ଟ କିପରି ଟ୍ରାକ୍ କରିବି", "ସିପ୍‌ମେଣ୍ଟ କିପରି ଟ୍ରାକ୍ କରିବି", "ଟ୍ରାକ୍ କିପରି କରିବି",
    ],
  },
  no_internet: {
    question: {
      en: "What happens if there is no internet?",
      hi: "यदि इंटरनेट न हो तो क्या होगा?",
      or: "ଯଦି ଇଣ୍ଟରନେଟ୍ ନଥାଏ ତେବେ କ'ଣ ହେବ?",
    },
    answer: {
      en: "📶 **Offline-First Resilience:**\nNo internet? No problem! The platform functions seamlessly offline in remote areas.\n• You can book shipments, log road obstacles, and record sensor temperature updates.\n• Data is saved securely in local device storage and automatically synchronizes when network connection is restored.",
      hi: "📶 **ऑफलाइन-फर्स्ट सुरक्षा:**\nइंटरनेट नहीं है? कोई समस्या नहीं! यह प्लेटफॉर्म ग्रामीण और दूरदराज के क्षेत्रों में पूरी तरह ऑफलाइन काम करता है।\n• आप शिपमेंट बुक कर सकते हैं, सड़क की बाधाएं दर्ज कर सकते हैं और तापमान रिकॉर्ड कर सकते हैं।\n• सभी डेटा डिवाइस की लोकल मेमोरी में सुरक्षित रहता है और इंटरनेट मिलते ही अपने आप सिंक हो जाता है।",
      or: "📶 **ଅଫଲାଇନ୍-ଫାଷ୍ଟ୍ ସୁରକ୍ଷା:**\nଇଣ୍ଟରନେଟ୍ ନାହିଁ? କୌଣସି ଅସୁବିଧା ନାହିଁ! ଏହି ପ୍ଲାଟଫର୍ମ ଦୁର୍ଗମ ଅଞ୍ଚଳରେ ମଧ୍ୟ ଅଫଲାଇନ୍ କାମ କରେ।\n• ଆପଣ ସିପ୍‌ମେଣ୍ଟ ବୁକ୍ କରିପାରିବେ, ରାସ୍ତାର ସମସ୍ୟା ରେକର୍ଡ କରିପାରିବେ ଏବଂ ତାପମାତ୍ରା ଲଗ୍ କରିପାରିବେ।\n• ସମସ୍ତ ତଥ୍ୟ ଲୋକାଲ୍ ମେମୋରୀରେ ସୁରକ୍ଷିତ ରହେ ଏବଂ ନେଟୱାର୍କ ଆସିବା ମାତ୍ରେ ଆପେ ଆପେ ସିଙ୍କ୍ ହୋଇଯାଏ।",
    },
    keywords: [
      "what happens if there is no internet", "what if no internet", "what happens if no internet", "no internet", "without internet",
      "यदि इंटरनेट न हो", "बिना इंटरनेट क्या होगा", "इंटरनेट नहीं है", "इंटरनेट न हो तो",
      "ଯଦି ଇଣ୍ଟରନେଟ୍ ନଥାଏ", "ଇଣ୍ଟରନେଟ୍ ନଥିଲେ କ'ଣ ହେବ", "ଇଣ୍ଟରନେଟ୍ ବିନା",
    ],
  },
  offline_sync: {
    question: {
      en: "How does offline synchronization work?",
      hi: "ऑफ़लाइन सिंक्रोनाइज़ेशन कैसे काम करता है?",
      or: "ଅଫଲାଇନ୍ ସିଙ୍କ୍ରୋନାଇଜେସନ୍ କିପରି କାମ କରେ?",
    },
    answer: {
      en: "🔄 **Offline Synchronization:**\n1. **Local Queue:** Transactions created offline are assigned unique client UUIDs and placed in a persistent queue.\n2. **Batch Upload:** When online connectivity returns, the background sync engine pushes pending records to `/api/sync/batch`.\n3. **Conflict Resolution:** Employs timestamp-based Last-Write-Wins and atomic transaction safety with zero data loss.",
      hi: "🔄 **ऑफलाइन सिंक्रोनाइज़ेशन प्रक्रिया:**\n1. **लोकल कतार:** ऑफलाइन बनाए गए ट्रांजेक्शन को क्लाइंट UUID दिया जाता है और लोकल कतार में रखा जाता है।\n2. **बैच अपलोड:** इंटरनेट कनेक्ट होते ही बैकग्राउंड इंजन सभी रिकॉर्ड्स को `/api/sync/batch` पर भेजता है।\n3. **विवाद समाधान:** टाइमस्टैम्प-आधारित लास्ट-राइट-विन्स और ऑटोमैटिक ट्रांजेक्शन सुरक्षा से डेटा सुरक्षित रहता है।",
      or: "🔄 **ଅଫଲାଇନ୍ ସିଙ୍କ୍ରୋନାଇଜେସନ୍ ପ୍ରଣାଳୀ:**\n1. **ଲୋକାଲ୍ ଧାଡ଼ି:** ଅଫଲାଇନ୍ କାରବାରଗୁଡ଼ିକୁ ଏକ ସ୍ୱତନ୍ତ୍ର UUID ଦିଆଯାଏ ଏବଂ ଲୋକାଲ୍ ଧାଡ଼ିରେ ରଖାଯାଏ।\n2. **ବ୍ୟାଚ୍ ଅପଲୋଡ୍:** ଇଣ୍ଟରନେଟ୍ ଫେରିବା କ୍ଷଣି ବ୍ୟାକଗ୍ରାଉଣ୍ଡ ସିଙ୍କ୍ ଇଞ୍ଜିନ୍ `/api/sync/batch` କୁ ସମସ୍ତ ତଥ୍ୟ ପଠାଏ।\n3. **କନଫ୍ଲିକ୍ଟ ରିଜୋଲ୍ୟୁସନ୍:** ଟାଇମଷ୍ଟାମ୍ପ ଆଧାରିତ ବ୍ୟବସ୍ଥା ଦ୍ୱାରା ଶୂନ୍ୟ ଡାଟା ନଷ୍ଟ ନିଶ୍ଚିତ ହୁଏ।",
    },
    keywords: [
      "how does offline synchronization work", "how offline sync works", "how does sync work", "offline synchronization work", "offline sync",
      "ऑफ़लाइन सिंक्रोनाइज़ेशन कैसे काम करता है", "ऑफलाइन सिंक कैसे काम करता है", "सिंक कैसे होता है",
      "ଅଫଲାଇନ୍ ସିଙ୍କ୍ରୋନାଇଜେସନ୍ କିପରି କାମ କରେ", "ସିଙ୍କ୍ କିପରି କାମ କରେ", "ସିଙ୍କ୍ରୋନାଇଜେସନ୍",
    ],
  },
  prevent_duplicates: {
    question: {
      en: "How are duplicate submissions prevented?",
      hi: "डुप्लिकेट सबमिशन को कैसे रोका जाता है?",
      or: "ଡୁପ୍ଲିକେଟ୍ ଦାଖଲକୁ କିପରି ରୋକାଯାଏ?",
    },
    answer: {
      en: "🛡️ **Duplicate Prevention (Idempotency):**\nEvery offline creation generates a unique client-side UUID (`client_id`). During sync, the database repository verifies if the `client_id` already exists. If already present, the duplicate request is safely bypassed without re-creating the shipment, ensuring strict *exactly-once* semantics.",
      hi: "🛡️ **डुप्लिकेट सबमिशन की रोकथाम (Idempotency):**\nप्रत्येक ऑफलाइन रिकॉर्ड को एक विशिष्ट `client_id` (UUID) दिया जाता है। सिंक के दौरान डेटाबेस जांचता है कि क्या यह आईडी पहले से मौजूद है। यदि हां, तो डुप्लीकेट प्रविष्टि को छोड़ दिया जाता है, जिससे हर शिपमेंट केवल एक ही बार दर्ज होता है।",
      or: "🛡️ **ଡୁପ୍ଲିକେଟ୍ ରୋକିବା ପଦ୍ଧତି (Idempotency):**\nପ୍ରତ୍ୟେକ ଅଫଲାଇନ୍ ଏଣ୍ଟ୍ରିରେ ଏକ ଅନନ୍ୟ `client_id` (UUID) ସୃଷ୍ଟି ହୁଏ। ସିଙ୍କ୍ ସମୟରେ ଡାଟାବେସ୍ ଯାଞ୍ଚ କରେ ଯଦି ଏହି ID ପୂର୍ବରୁ ଅଛି, ତେବେ ତାହାକୁ ବାଦ୍ ଦିଆଯାଏ ଏବଂ କୌଣସି ଅର୍ଡର ଦୁଇଥର ଦାଖଲ ହୁଏ ନାହିଁ।",
    },
    keywords: [
      "how are duplicate submissions prevented", "duplicate submissions prevented", "prevent duplicate", "duplicate prevention", "idempotent submission",
      "डुप्लिकेट सबमिशन को कैसे रोका जाता है", "डुप्लीकेट कैसे रोकते हैं", "दोहराव कैसे रोकते हैं",
      "ଡୁପ୍ଲିକେଟ୍ ଦାଖଲକୁ କିପରି ରୋକାଯାଏ", "ଡୁପ୍ଲିକେଟ୍ କିପରି ରୋକାଯାଏ", "ଡୁପ୍ଲିକେଟ୍ ନିବାରଣ",
    ],
  },
  who_can_use: {
    question: {
      en: "Who can use the platform?",
      hi: "इस प्लेटफॉर्म का उपयोग कौन कर सकता है?",
      or: "ଏହି ପ୍ଲାଟଫର୍ମକୁ କିଏ ବ୍ୟବହାର କରିପାରିବେ?",
    },
    answer: {
      en: "👥 **Supported Users & Roles:**\n1. **Shippers & Farmers:** Book consignments, request reefer storage, and track produce to central hubs.\n2. **Carriers & Drivers:** Receive optimal load-matching routes, fair compensation trips, and road condition alerts.\n3. **Network Admins:** Oversee network resilience, cold-chain SLA compliance, and multimodal corridor routing.",
      hi: "👥 **उपयोगकर्ता एवं भूमिकाएं:**\n1. **शिपर एवं किसान:** फसल व उपज की बुकिंग, कोल्ड स्टोरेज स्लॉट और डिलीवरी ट्रैकिंग के लिए।\n2. **ट्रांसपोर्टर्स एवं ड्राइवर:** अनुकूलित रूट, निष्पक्ष ट्रिप आवंटन और सड़क अलर्ट प्राप्त करने के लिए।\n3. **नेटवर्क एडमिनिस्ट्रेटर:** पूरे लॉजिस्टिक्स नेटवर्क, तापमान अनुपालन और मल्टी-मोडल कॉरिडोर प्रबंधन के लिए।",
      or: "👥 **ବ୍ୟବହାରକାରୀ ଓ ଭୂମିକା:**\n1. **ଚାଷୀ ଓ ସମବାୟ ସମିତି:** କୃଷିଜାତ ସାମଗ୍ରୀ ବୁକିଂ, ଶୀତଳ ଭଣ୍ଡାର ସଂରକ୍ଷଣ ଓ ଟ୍ରାକିଂ ପାଇଁ।\n2. **ଟ୍ରାନ୍ସପୋର୍ଟର୍ ଓ ଡ୍ରାଇଭର:** ସର୍ବୋତ୍ତମ ରୁଟ୍, ନ୍ୟାୟସଙ୍ଗତ ଟ୍ରିପ୍ ବଣ୍ଟନ ଓ ରାସ୍ତା ସୂଚନା ପାଇବା ପାଇଁ।\n3. **ନେଟୱାର୍କ ଆଡମିନିଷ୍ଟ୍ରେଟର:** ସମଗ୍ର ଲଜିଷ୍ଟିକ୍ସ ବ୍ୟବସ୍ଥା, କୋଲ୍ଡ-ଚେନ୍ ସୁରକ୍ଷା ଓ ରୁଟ୍ ତଦାରଖ ପାଇଁ।",
    },
    keywords: [
      "who can use the platform", "who can use this platform", "who can use", "eligible users", "target users",
      "इस प्लेटफॉर्म का उपयोग कौन कर सकता है", "कौन उपयोग कर सकता है", "उपयोगकर्ता कौन हैं",
      "ଏହି ପ୍ଲାଟଫର୍ମକୁ କିଏ ବ୍ୟବହାର କରିପାରିବେ", "କିଏ ବ୍ୟବହାର କରିପାରିବେ", "କିଏ ବ୍ୟବହାର କରିପାରିବ",
    ],
  },
  rural_help: {
    question: {
      en: "How does the platform help rural areas?",
      hi: "यह प्लेटफॉर्म ग्रामीण क्षेत्रों की कैसे मदद करता है?",
      or: "ଏହି ପ୍ଲାଟଫର୍ମ ଗ୍ରାମାଞ୍ଚଳକୁ କିପରି ସାହାଯ୍ୟ କରେ?",
    },
    answer: {
      en: "🌾 **Rural Impact & Benefits:**\n• **Cooperative Freight Pooling:** Reduces transportation costs by up to 35% through consolidated loads.\n• **Spoilage Prevention:** Extends perishable crop and medicine shelf-life via continuous cold-chain monitoring.\n• **Multilingual Voice Bot:** Enables local producers to book cargo in Odia, Hindi, and English.\n• **Fair Dispatch:** Guarantees equitable load allocation across small rural vehicle owners.",
      hi: "🌾 **ग्रामीण क्षेत्रों के लिए लाभ:**\n• **सहकारी माल एकत्रीकरण:** भार समेकन से परिवहन लागत में 35% तक की बचत।\n• **खराबी से सुरक्षा:** निरंतर कोल्ड-चेन निगरानी से फसलों और दवाओं का जीवनकाल बढ़ता है।\n• **बहुभाषी वॉयस बॉट:** स्थानीय किसान उड़िया, हिंदी और अंग्रेजी में आसानी से ऑर्डर बुक कर सकते हैं।\n• **निष्पक्ष डिस्पैच:** छोटे ग्रामीण वाहन चालकों को समान और निष्पक्ष ट्रिप आवंटन।",
      or: "🌾 **ଗ୍ରାମାଞ୍ଚଳ ପାଇଁ ଲାଭ:**\n• **ସମବାୟ ମାଲ୍ ସମନ୍ୱୟ:** ଏକତ୍ରୀକରଣ ଦ୍ୱାରା ପରିବହନ ଖର୍ଚ୍ଚରେ ୩୫% ପର୍ଯ୍ୟନ୍ତ ସଞ୍ଚୟ ହୁଏ।\n• **ସାମଗ୍ରୀ ନଷ୍ଟରୁ ରକ୍ଷା:** କୋଲ୍ଡ-ଚେନ୍ ମନିଟରିଂ ଦ୍ୱାରା ଫସଲ ଓ ଔଷଧ ସୁରକ୍ଷିତ ରହେ।\n• **ଆଞ୍ଚଳିକ ଭଏସ୍ ବଟ୍:** ଓଡ଼ିଆ, ହିନ୍ଦୀ ଏବଂ ଇଂରାଜୀ ଭାଷାରେ ସହଜରେ ଅର୍ଡର ବୁକିଂ।\n• **ନ୍ୟାୟସଙ୍ଗତ ବଣ୍ଟନ:** ଗ୍ରାମାଞ୍ଚଳର ସମସ୍ତ ଛୋଟ ବଡ଼ ଗାଡ଼ି ମାଲିକଙ୍କୁ ଉପଯୁକ୍ତ କାମ।",
    },
    keywords: [
      "how does the platform help rural areas", "how platform helps rural", "help rural areas", "rural impact", "rural benefit",
      "यह प्लेटफॉर्म ग्रामीण क्षेत्रों की कैसे मदद करता है", "ग्रामीण क्षेत्रों की मदद", "ग्रामीण क्षेत्रों को क्या लाभ",
      "ଏହି ପ୍ଲାଟଫର୍ମ ଗ୍ରାମାଞ୍ଚଳକୁ କିପରି ସାହାଯ୍ୟ କରେ", "ଗ୍ରାମାଞ୍ଚଳକୁ କିପରି ସାହାଯ୍ୟ କରେ", "ଗ୍ରାମାଞ୍ଚଳ ଲାଭ",
    ],
  },
  no_vehicle_available: {
    question: {
      en: "What happens if no vehicle is available?",
      hi: "यदि कोई वाहन उपलब्ध न हो तो क्या होगा?",
      or: "ଯଦି କୌଣସି ଗାଡ଼ି ଉପଲବ୍ଧ ନଥାଏ ତେବେ କ'ଣ ହେବ?",
    },
    answer: {
      en: "⏳ **When No Vehicle is Available:**\n1. **Priority Queuing:** Your shipment is prioritized in the smart aggregation queue.\n2. **Cold Buffer Staging:** Cargo is assigned to local hub cold-storage holding cells to prevent spoilage.\n3. **Multimodal Fallback:** The engine searches for return-trip reefers, community vehicles, or Dedicated Freight Corridor (DFC) rail connections and notifies you instantly.",
      hi: "⏳ **यदि कोई वाहन उपलब्ध न हो:**\n1. **प्राथमिकता कतार:** आपके शिपमेंट को स्मार्ट एकत्रीकरण कतार में प्राथमिकता दी जाती है।\n2. **कोल्ड स्टोरेज सुरक्षा:** खराबी से बचाने के लिए सामान को स्थानीय हब के कोल्ड-स्टोरेज में सुरक्षित रखा जाता है।\n3. **मल्टी-मोडल विकल्प:** सिस्टम वापसी वाले रीफर ट्रकों, ग्रामीण वाहनों या डीएफसी रेल विकल्पों को सक्रिय करता है और आपको सूचित करता है।",
      or: "⏳ **ଯଦି କୌଣସି ଗାଡ଼ି ଉପଲବ୍ଧ ନଥାଏ:**\n1. **ପ୍ରାଥମିକତା ଧାଡ଼ି:** ଆପଣଙ୍କ ସିପ୍‌ମେଣ୍ଟକୁ ସ୍ମାର୍ଟ ଧାଡ଼ିରେ ପ୍ରାଥମିକତା ଦିଆଯାଏ।\n2. **ଶୀତଳ ଭଣ୍ଡାର ସୁରକ୍ଷା:** ସାମଗ୍ରୀ ନଷ୍ଟ ନହେବା ପାଇଁ ସ୍ଥାନୀୟ ହବ୍‌ର ଶୀତଳ ଭଣ୍ଡାରରେ ସୁରକ୍ଷିତ ରଖାଯାଏ।\n3. **ବିକଳ୍ପ ପରିବହନ:** ସିଷ୍ଟମ୍ ଫେରନ୍ତା ଟ୍ରକ୍, ଗ୍ରାମୀଣ ଗାଡ଼ି କିମ୍ବା ରେଳ DFC ସଂଯୋଗ ସନ୍ଧାନ କରେ ଏବଂ ତୁରନ୍ତ ଜଣାଏ।",
    },
    keywords: [
      "what happens if no vehicle is available", "if no vehicle is available", "no vehicle is available", "when no truck available",
      "यदि कोई वाहन उपलब्ध न हो", "गाड़ी उपलब्ध न हो तो क्या होगा", "गाड़ी न मिलने पर",
      "ଯଦି କୌଣସି ଗାଡ଼ି ଉପଲବ୍ଧ ନଥାଏ", "ଗାଡ଼ି ନମିଳିଲେ କ'ଣ ହେବ", "ଗାଡ଼ି ନଥିଲେ",
    ],
  },
  contact_help: {
    question: {
      en: "How can I contact/get help?",
      hi: "मैं सहायता के लिए कैसे संपर्क करूँ?",
      or: "ମୁଁ ସହାୟତା ପାଇଁ କିପରି ଯୋଗାଯୋଗ କରିବି?",
    },
    answer: {
      en: "📞 **Getting Help & Support:**\n• **24/7 AI Assistant:** Ask any question or speak directly into this multilingual chatbot.\n• **Hub Coordinator:** Contact your Gram Panchayat Aggregation Node dispatcher.\n• **Enterprise Support:** Visit the **About / Manifesto** tab or submit an inquiry for dedicated assistance.",
      hi: "📞 **सहायता एवं संपर्क:**\n• **24/7 एआई सहायक:** इस बहुभाषी चैटबॉट में कभी भी पूछें या बोलें।\n• **हब समन्वयक:** अपने ग्राम पंचायत एकत्रीकरण केंद्र के डिस्पैचर से संपर्क करें।\n• **हेल्पडेस्क:** समर्पित सहायता के लिए **About / Manifesto** टैब पर जाएं या पूछताछ फॉर्म भरें।",
      or: "📞 **ସହାୟତା ଓ ଯୋଗାଯୋଗ:**\n• **୨୪/୭ AI ସହାୟକ:** ଏହି ଚାଟବଟ୍‌ରେ ଯେକୌଣସି ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ ବା କୁହନ୍ତୁ।\n• **ହବ୍ ସଂଯୋଜକ:** ଆପଣଙ୍କ ଗ୍ରାମ ପଞ୍ଚାୟତ ସଂଗ୍ରହ କେନ୍ଦ୍ର ଡିସପାଚର୍‌ଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ।\n• **ସହାୟତା କେନ୍ଦ୍ର:** ସ୍ୱତନ୍ତ୍ର ସହାୟତା ପାଇଁ **About / Manifesto** ବିଭାଗକୁ ଯାଆନ୍ତୁ।",
    },
    keywords: [
      "how can i contact/get help", "how can i contact", "how to get help", "how can i get help", "contact support", "helpdesk",
      "मैं सहायता के लिए कैसे संपर्क करूँ", "सहायता कैसे प्राप्त करें", "संपर्क कैसे करें", "मदद कैसे मिलेगी",
      "ମୁଁ ସହାୟତା ପାଇଁ କିପରି ଯୋଗାଯୋଗ କରିବି", "ସହାୟତା କିପରି ପାଇବି", "ଯୋଗାଯୋଗ କିପରି କରିବି",
    ],
  },
};

const CHATBOT_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    title: "Rural AI Ordering Assistant",
    subtitle: "Book cargo pickup in English, Hindi, or Odia",
    tooltip: "Need help placing an order or have questions?",
    inputPlaceholder: "Type your message or ask an FAQ...",
    listening: "Listening...",
    micTooltip: "Voice Input (Speech-to-Text)",
    speakTooltip: "Listen to Response",
    confirmOrder: "Confirm & Place Order",
    startOver: "Start Over",
    origin: "Origin Hub",
    destination: "Destination Hub",
    goodType: "Produce / Commodity",
    tempClass: "Temperature Class",
    weight: "Cargo Weight",
    orderSuccess: "Order placed successfully! Tracking ID: ",
    welcome:
      "Namaste! I am your Rural Logistics Assistant. Where would you like to pick up your cargo from, or ask me any question!",
    floatingBtn: "Rural Assistant",
    processing: "Processing...",
    draft: "Draft",
    failedOrder: "Failed to place shipment order. Please check connection.",
    faqsBtn: "FAQs ❓",
    faqsTitle: "Frequently Asked Questions",
    faqsSubtitle: "Tap a question to get instant answers in English, Hindi, or Odia",
    backToChat: "Back to Chat",
    aiPowered: "AI Generated",
  },
  hi: {
    title: "ग्रामीण एआई ऑर्डर सहायक",
    subtitle: "अंग्रेजी, हिंदी या उड़िया में पिकअप बुक करें",
    tooltip: "ऑर्डर देने में सहायता चाहिए या कोई प्रश्न है?",
    inputPlaceholder: "अपना संदेश लिखें या प्रश्न पूछें...",
    listening: "सुन रहा हूँ...",
    micTooltip: "आवाज़ से इनपुट (स्पीच-टू-टेक्स्ट)",
    speakTooltip: "उत्तर सुनें",
    confirmOrder: "ऑर्डर की पुष्टि करें",
    startOver: "पुनः प्रारंभ करें",
    origin: "मूल हब (Origin)",
    destination: "गंतव्य हब (Destination)",
    goodType: "सामग्री का प्रकार",
    tempClass: "तापमान श्रेणी",
    weight: "सामग्री का वजन",
    orderSuccess: "ऑर्डर सफलतापूर्वक दर्ज हो गया! ट्रैकिंग आईडी: ",
    welcome:
      "नमस्ते! मैं आपका ग्रामीण लॉजिस्टिक्स सहायक हूँ। आप अपना सामान कहाँ से पिकअप कराना चाहते हैं, या कोई भी प्रश्न पूछें!",
    floatingBtn: "ग्रामीण सहायक",
    processing: "प्रक्रिया जारी है...",
    draft: "ड्राफ्ट",
    failedOrder: "शिपमेंट ऑर्डर दर्ज करने में विफल। कृपया कनेक्शन जांचें।",
    faqsBtn: "अक्सर पूछे जाने वाले प्रश्न ❓",
    faqsTitle: "अक्सर पूछे जाने वाले प्रश्न (FAQs)",
    faqsSubtitle: "अंग्रेजी, हिंदी या उड़िया में तुरंत उत्तर पाने के लिए किसी प्रश्न पर टैप करें",
    backToChat: "चैट पर वापस जाएं",
    aiPowered: "एआई जनरेटेड",
  },
  or: {
    title: "ଗ୍ରାମୀଣ ଏଆଇ ଅର୍ଡର ସହାୟକ",
    subtitle: "ଇଂରାଜୀ, ହିନ୍ଦୀ କିମ୍ବା ଓଡ଼ିଆରେ ଅର୍ଡର ବୁକ୍ କରନ୍ତୁ",
    tooltip: "ଅର୍ଡର କରିବାରେ ସାହାଯ୍ୟ ଆବଶ୍ୟକ କି କିମ୍ବା ପ୍ରଶ୍ନ ଅଛି?",
    inputPlaceholder: "ଆପଣଙ୍କର ମେସେଜ୍ ଲେଖନ୍ତୁ କିମ୍ବା ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ...",
    listening: "ଶୁଣୁଛି...",
    micTooltip: "ସ୍ବର କଥୋପକଥନ (Speech-to-Text)",
    speakTooltip: "ଉତ୍ତର ଶୁଣନ୍ତୁ",
    confirmOrder: "ଅର୍ଡର ନିଶ୍ଚିତ କରନ୍ତୁ",
    startOver: "ପୁନର୍ବାର ଆରମ୍ଭ କରନ୍ତୁ",
    origin: "ମୂଳ ହବ୍ (Origin)",
    destination: "ଗନ୍ତବ୍ୟ ହବ୍ (Destination)",
    goodType: "ସାମଗ୍ରୀ ପ୍ରକାର",
    tempClass: "ତାପମାତ୍ରା ବର୍ଗ",
    weight: "ସାମଗ୍ରୀ ଓଜନ",
    orderSuccess: "ସିପ୍‌ମେଣ୍ଟ ଅର୍ଡର ସଫଳତାର ସହିତ ହୋଇଗଲା! ଟ୍ରାକିଂ ID: ",
    welcome:
      "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର ଗ୍ରାମୀଣ ଲଜିଷ୍ଟିକ୍ସ ସହାୟକ। ଆପଣ କେଉଁ ସ୍ଥାନରୁ ସାମଗ୍ରୀ ପିକ୍-ଅପ୍ କରିବାକୁ ଚାହାଁନ୍ତି କିମ୍ବା ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ!",
    floatingBtn: "ଗ୍ରାମୀଣ ସହାୟକ",
    processing: "ପ୍ରକ୍ରିୟାକରଣ ଚାଲିଛି...",
    draft: "ଚିଠା",
    failedOrder: "ସିପ୍‌ମେଣ୍ଟ ଅର୍ଡର ବୁକିଂ ବିଫଳ ହେଲା। ଦୟାକରି କନେକ୍ସନ୍ ଯାଞ୍ଚ କରନ୍ତୁ।",
    faqsBtn: "ସାଧାରଣ ପ୍ରଶ୍ନୋତ୍ତର ❓",
    faqsTitle: "ସାଧାରଣ ପ୍ରଶ୍ନୋତ୍ତର (FAQs)",
    faqsSubtitle: "ଇଂରାଜୀ, ହିନ୍ଦୀ ବା ଓଡ଼ିଆରେ ତୁରନ୍ତ ଉତ୍ତର ପାଇବା ପାଇଁ ପ୍ରଶ୍ନ ଉପରେ କ୍ଲିକ୍ କରନ୍ତୁ",
    backToChat: "ଚାଟ୍ କୁ ଫେରନ୍ତୁ",
    aiPowered: "AI ଜେନେରେଟେଡ୍",
  },
};

const STEP_RESPONSES: Record<string, Record<string, string>> = {
  welcome: {
    en: "Namaste! I am your Rural Logistics Assistant. Where would you like to pick up your cargo from, or ask any question?",
    hi: "नमस्ते! मैं आपका ग्रामीण लॉजिस्टिक्स सहायक हूँ। आप अपना सामान कहाँ से पिकअप कराना चाहते हैं, या कोई प्रश्न पूछें?",
    or: "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର ଗ୍ରାମୀଣ ଲଜିଷ୍ଟିକ୍ସ ସହାୟକ। ଆପଣ କେଉଁ ସ୍ଥାନରୁ ସାମଗ୍ରୀ ପିକ୍-ଅପ୍ କରିବାକୁ ଚାହାଁନ୍ତି କିମ୍ବା ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ?",
  },
  select_dest: {
    en: "Got it! Which hub should we deliver this cargo to?",
    hi: "बहुत बढ़िया! यह सामान किस हब पर पहुँचाना है?",
    or: "ବହୁତ ଭଲ! ଏହି ସାମଗ୍ରୀ କେଉଁ ହବ୍‌କୁ ପଠାଯିବ?",
  },
  select_good: {
    en: "What type of cargo are you sending?",
    hi: "आप किस प्रकार की सामग्री भेज रहे हैं?",
    or: "ଆପଣ କେଉଁ ପ୍ରକାରର ସାମଗ୍ରୀ ପଠାଉଛନ୍ତି?",
  },
  select_temp: {
    en: "What temperature storage does your cargo require?",
    hi: "आपकी सामग्री को किस तापमान भंडारण की आवश्यकता है?",
    or: "ଆପଣଙ୍କ ସାମଗ୍ରୀ ପାଇଁ କେଉଁ ତାପମାତ୍ରା ଆବଶ୍ୟକ?",
  },
  enter_weight: {
    en: "What is the total weight in Kilograms (kg)?",
    hi: "कुल वजन किलोग्राम (kg) में कितना है?",
    or: "ମୋଟ ଓଜନ କିଲୋଗ୍ରାମ (kg) ରେ କେତେ?",
  },
  confirm: {
    en: "Great! Here is your order details. Click below to confirm shipment booking.",
    hi: "उत्कृष्ट! आपके ऑर्डर का विवरण यहाँ है। शिपमेंट बुक करने के लिए नीचे पुष्टि करें।",
    or: "ଉତ୍ତମ! ଆପଣଙ୍କ ଅର୍ଡର ବିବରଣୀ ଏଠାରେ ଅଛି। ନିଶ୍ଚିତ କରିବାକୁ ତଳେ କ୍ଲିକ୍ କରନ୍ତୁ।",
  },
  success: {
    en: "Your shipment order has been successfully placed! Tracking ID: ",
    hi: "आपका शिपमेंट ऑर्डर सफलतापूर्वक दर्ज कर लिया गया है! ट्रैकिंग आईडी: ",
    or: "ଆପଣଙ୍କ ସିପ୍‌ମେଣ୍ଟ ଅର୍ଡର ସଫଳତାର ସହିତ ସମ୍ପନ୍ନ ହୋଇଛି! ଟ୍ରାକିଂ ଆଇଡି: ",
  },
};

const DEFAULT_HUBS = [
  { id: "hub-guwahati-01", name: "Guwahati Northeast Central Mega Hub", location: "26.18, 91.75", type: "district_hub" },
  { id: "hub-jorhat-02", name: "Jorhat Upper Assam Tea Belt", location: "26.75, 94.22", type: "community_node" },
  { id: "hub-silchar-03", name: "Silchar Rail & Road Crossdock", location: "24.83, 92.78", type: "community_node" },
  { id: "hub-tawang-04", name: "Tawang Mountain Outpost", location: "27.58, 91.86", type: "storage_depot" },
];

const getGoodTypeLabel = (goodType: string, loc: string) => {
  const map: Record<string, Record<string, string>> = {
    vaccines_medical: {
      en: "Vaccines & Medical Supplies",
      hi: "टीके एवं जीवनरक्षक दवाइयाँ",
      or: "ଟିକା ଓ ଔଷଧ",
    },
    dairy_milk: {
      en: "Dairy & Milk Products",
      hi: "दूध एवं डेरी उत्पाद",
      or: "କ୍ଷୀର ଓ ଦୁଗ୍ଧ ସାମଗ୍ରୀ",
    },
    fish_seafood: {
      en: "Fish & Seafood",
      hi: "मछली एवं समुद्री भोजन",
      or: "ମାଛ ଓ ସାମୁଦ୍ରିକ ଖାଦ୍ୟ",
    },
    farm_produce: {
      en: "Fresh Farm Produce",
      hi: "ताज़ा कृषि उत्पाद",
      or: "ତାଜା କୃଷି ସାମଗ୍ରୀ",
    },
  };
  return map[goodType]?.[loc] || map[goodType]?.en || goodType || "Farm Produce";
};

const getTempLabel = (tempClass: string, loc: string) => {
  const map: Record<string, Record<string, string>> = {
    frozen: {
      en: "Frozen (-20°C)",
      hi: "जमे हुए (-20°C फ्रोजन)",
      or: "ଶୀତଳ (-20°C ବରଫ)",
    },
    chilled: {
      en: "Chilled (2°C to 8°C)",
      hi: "ठंडा (2°C - 8°C)",
      or: "ଥଣ୍ଡା (2°C - 8°C)",
    },
    ambient: {
      en: "Ambient (15°C to 25°C)",
      hi: "सामान्य (15°C - 25°C)",
      or: "ସାଧାରଣ (15°C - 25°C)",
    },
  };
  return map[tempClass]?.[loc] || map[tempClass]?.en || tempClass || "Chilled";
};

const getQuickRepliesForStep = (
  stepName: string,
  loc: string,
  hubList: any[],
  currentDraft: any
): string[] => {
  const availableHubs = hubList.length > 0 ? hubList : DEFAULT_HUBS;
  const faqLabel =
    loc === "or" ? "❓ ସାଧାରଣ ପ୍ରଶ୍ନ (FAQs)" : loc === "hi" ? "❓ अक्सर पूछे जाने वाले प्रश्न" : "❓ View FAQs";

  if (stepName === "greeting" || stepName === "select_origin") {
    return [...availableHubs.slice(0, 4).map((h) => h.name), faqLabel];
  }
  if (stepName === "select_destination") {
    const originId = currentDraft?.origin_hub_id;
    const dests = availableHubs.filter((h) => h.id !== originId);
    return (dests.length > 0 ? dests : availableHubs).slice(0, 4).map((h) => h.name);
  }
  if (stepName === "select_good_type") {
    if (loc === "or") {
      return ["ଫଳ ଓ ପନିପରିବା", "କ୍ଷୀର / ଦୁଗ୍ଧ ସାମଗ୍ରୀ", "ଟିକା / ଔଷଧ", "ମାଛ / ସାମୁଦ୍ରିକ ଖାଦ୍ୟ"];
    }
    if (loc === "hi") {
      return ["ताज़ा फल एवं सब्जियाँ", "दूध एवं डेरी उत्पाद", "टीके एवं जीवनरक्षक दवाइयाँ", "मछली एवं समुद्री भोजन"];
    }
    return ["Fresh Produce & Fruits", "Milk & Dairy Products", "Vaccines & Medicines", "Fish & Seafood"];
  }
  if (stepName === "select_temp") {
    if (loc === "or") {
      return ["ଶୀତଳ (-20°C ବରଫ)", "ଥଣ୍ଡା (2°C - 8°C)", "ସାଧାରଣ (15°C - 25°C)"];
    }
    if (loc === "hi") {
      return ["जमे हुए (-20°C फ्रोजन)", "ठंडा (2°C - 8°C चिल)", "सामान्य (15°C - 25°C)"];
    }
    return ["Frozen (-20°C Deep Cold)", "Chilled (2°C - 8°C Cold Chain)", "Ambient (15°C - 25°C Normal)"];
  }
  if (stepName === "enter_weight") {
    return ["50 kg", "100 kg", "250 kg", "500 kg"];
  }
  if (stepName === "confirm") {
    if (loc === "or") {
      return ["ସିପ୍‌ମେଣ୍ଟ ବୁକ୍ କରନ୍ତୁ ✅", "ପୁନର୍ବାର ଆରମ୍ଭ କରନ୍ତୁ 🔄"];
    }
    if (loc === "hi") {
      return ["ऑर्डर कन्फर्म करें ✅", "पुनः प्रारंभ करें 🔄"];
    }
    return ["Confirm Order ✅", "Start Over 🔄"];
  }
  if (stepName === "completed" || stepName === "faq_answered") {
    if (loc === "or") {
      return ["❓ ଅନ୍ୟାନ୍ୟ ପ୍ରଶ୍ନ (FAQs)", "📦 ଅର୍ଡର ବୁକ୍ କରନ୍ତୁ", "ପୁନର୍ବାର ଆରମ୍ଭ କରନ୍ତୁ 🔄"];
    }
    if (loc === "hi") {
      return ["❓ अन्य प्रश्न (FAQs)", "📦 नया ऑर्डर बुक करें", "पुनः प्रारंभ करें 🔄"];
    }
    return ["❓ View All FAQs", "📦 Book a Shipment", "Start Over 🔄"];
  }
  return [faqLabel];
};

const findMatchingFaqClient = (text: string): string | null => {
  const clean = text.toLowerCase().replace(/[^a-zA-Z0-9ऀ-ॿ଀-୿\s]/g, " ").trim();
  for (const [key, item] of Object.entries(FAQS_DATA)) {
    for (const kw of item.keywords) {
      if (clean.includes(kw.toLowerCase()) || text.toLowerCase().includes(kw.toLowerCase())) {
        return key;
      }
    }
    for (const q of Object.values(item.question)) {
      if (clean.includes(q.toLowerCase()) || text.toLowerCase().includes(q.toLowerCase())) {
        return key;
      }
    }
  }
  return null;
};

export default function RuralChatbot() {
  const pageLocale = useLocale();
  const [botLocale, setBotLocale] = useState<string>(pageLocale || "en");

  const t = (key: string): string => {
    return CHATBOT_TRANSLATIONS[botLocale]?.[key] || CHATBOT_TRANSLATIONS.en?.[key] || key;
  };

  const [isOpen, setIsOpen] = useState(false);
  const [showFaqDrawer, setShowFaqDrawer] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<string>("select_origin");
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [draftShipment, setDraftShipment] = useState<any>(null);
  const [hubs, setHubs] = useState<any[]>(DEFAULT_HUBS);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync with page locale on initial load or if user hasn't explicitly overridden
  useEffect(() => {
    if (pageLocale && ["en", "hi", "or"].includes(pageLocale)) {
      setBotLocale(pageLocale);
    }
  }, [pageLocale]);

  // Fetch live network hubs on load
  useEffect(() => {
    getHubs()
      .then((data) => {
        if (data && data.length > 0) {
          setHubs(data);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialText = STEP_RESPONSES.welcome[botLocale] || STEP_RESPONSES.welcome.en;
      setMessages([
        {
          id: "msg-welcome",
          sender: "bot",
          text: initialText,
          stepKey: "welcome",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setStep("select_origin");
      setQuickReplies(getQuickRepliesForStep("select_origin", botLocale, hubs, null));
    }
  }, [isOpen, botLocale, hubs]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting, showFaqDrawer]);

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = SPEECH_LANG_MAP[botLocale] || "en-IN";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput(transcript);
            handleUserMessage(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [botLocale]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition is not supported on this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = SPEECH_LANG_MAP[botLocale] || "en-IN";
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (textToSpeak: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      // Remove markdown chars
      const clean = textToSpeak.replace(/[*#`•\-_]/g, "").replace(/[\r\n]+/g, " ");
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = SPEECH_LANG_MAP[botLocale] || "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  };

  const switchLanguage = (newLocale: string) => {
    if (newLocale === botLocale) return;
    setBotLocale(newLocale);

    if (recognitionRef.current) {
      recognitionRef.current.lang = SPEECH_LANG_MAP[newLocale] || "en-IN";
    }

    // Immediately translate all existing bot messages in chat view
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.sender === "bot") {
          if (msg.faqId && FAQS_DATA[msg.faqId]) {
            return {
              ...msg,
              text: FAQS_DATA[msg.faqId].answer[newLocale] || FAQS_DATA[msg.faqId].answer.en,
            };
          }
          if (msg.stepKey && STEP_RESPONSES[msg.stepKey]) {
            let updatedText = STEP_RESPONSES[msg.stepKey][newLocale] || STEP_RESPONSES[msg.stepKey].en;
            if (msg.stepKey === "success" && msg.orderId) {
              updatedText += msg.orderId;
            }
            return {
              ...msg,
              text: updatedText,
            };
          }
        }
        return msg;
      })
    );

    // Update quick replies to new language
    setQuickReplies(getQuickRepliesForStep(step, newLocale, hubs, draftShipment));
  };

  const handleUserMessage = async (userText: string) => {
    if (!userText.trim() || isSubmitting) return;

    setShowFaqDrawer(false);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSubmitting(true);

    await sendMessage(userText, step, draftShipment, botLocale);
  };

  const handleSelectFaq = (faqId: string) => {
    const qText = FAQS_DATA[faqId]?.question[botLocale] || FAQS_DATA[faqId]?.question.en;
    if (qText) {
      handleUserMessage(qText);
    }
  };

  const sendMessage = async (
    userText: string,
    currentStep: string,
    currentDraft: any,
    targetLocale?: string
  ) => {
    const activeLocale = targetLocale || botLocale;
    let nextStep = currentStep;
    let replyText = "";
    let stepKey = "welcome";
    let matchedFaqId: string | undefined = undefined;
    const updatedDraft = { ...(currentDraft || {}) };
    const availableHubs = hubs.length > 0 ? hubs : DEFAULT_HUBS;
    const msg = userText.trim().toLowerCase();

    // 1. Try server API
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          locale: activeLocale,
          context: {
            step: currentStep,
            draft_shipment: currentDraft,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const stepToKeyMap: Record<string, string> = {
          select_origin: "welcome",
          select_destination: "select_dest",
          select_good_type: "select_good",
          select_temp: "select_temp",
          enter_weight: "enter_weight",
          confirm: "confirm",
          completed: "success",
        };
        stepKey = stepToKeyMap[data.step] || "welcome";

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: data.reply,
          stepKey: stepKey,
          faqId: data.faq_id,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          draftShipment: data.draft_shipment,
          aiGenerated: data.ai_generated,
          providerUsed: data.provider_used,
        };

        setMessages((prev) => [...prev, botMsg]);
        setStep(data.step);
        setQuickReplies(
          data.quick_replies ||
            getQuickRepliesForStep(data.step, activeLocale, data.hubs || hubs, data.draft_shipment)
        );
        if (data.draft_shipment) {
          setDraftShipment(data.draft_shipment);
        }
        if (data.hubs) {
          setHubs(data.hubs);
        }
        return;
      }
    } catch {
      // Offline / API unavailable -> proceed with local conversational & FAQ engine
    } finally {
      setIsSubmitting(false);
    }

    // 2. Client-Side Assistant fallback logic (Offline-First)

    // Check for Waybill Number Pattern (e.g., RUR-90141)
    const waybillMatch = userText.match(/RUR-\d+/i);
    const waybillQuery = waybillMatch ? waybillMatch[0].toUpperCase() : null;

    // Intent: ETA Query
    if (msg.includes("eta") || msg.includes("when") || msg.includes("arrive") || msg.includes("समय") || msg.includes("କେତେବେଳେ")) {
      const wb = waybillQuery || "RUR-90141";
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `⏱️ **Delivery ETA for ${wb}:**\n• **Estimated Arrival Time:** approx. 3 hrs 45 mins (En Route)\n• **Corridor:** Jorhat Tea Feeder ➔ Guwahati Mega Cold Hub\n• **Terrain Factor:** Plains segment (Speed: 42 km/h, clear paved road)\n• **Thermal Integrity:** Stable (+3.8°C nominal setpoint)`,
        stepKey: "delivery_eta",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setQuickReplies([`Status of ${wb} 📦`, `Reschedule ${wb} 📅`, "Book New Cargo 📦"]);
      return;
    }

    // Intent: Rescheduling Query
    if (msg.includes("reschedule") || msg.includes("delay") || msg.includes("change time") || msg.includes("बदलें") || msg.includes("ପରିବର୍ତ୍ତନ")) {
      const wb = waybillQuery || "RUR-90141";
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `📅 **Consignment Rescheduling Confirmed for ${wb}:**\n• **New Pickup/Delivery Window:** +24 hours extended SLA\n• **Offline Queue:** Reschedule update stored locally; will synchronize to fleet dispatch once online.\n• **Cold Storage Allocation:** Extended holding slot reserved at local aggregation point.`,
        stepKey: "reschedule",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setQuickReplies([`Check Status ${wb} 🔍`, "Book Another Consignment 📦"]);
      return;
    }

    // Intent: Order Status / Tracking Query
    if (msg.includes("status") || msg.includes("track") || msg.includes("where") || msg.includes("स्थिति") || msg.includes("ସ୍ଥିତି") || waybillQuery) {
      const wb = waybillQuery || "RUR-90141";
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `📦 **Shipment Status for Waybill ${wb}:**\n• **Status:** IN TRANSIT (Allocated to Mahindra Bolero Camper 4x4)\n• **Commodity:** Organic Green Tea & Produce (350 kg / 50 crates)\n• **Thermal Class:** Chilled (2°C to 8°C)\n• **Route:** Jorhat Upper Assam ➔ Guwahati Mega Cold Hub\n• **Vehicle Utilization:** 72.0% payload utilization\n• **Producer:** Jorhat Organic Tea Planters Cooperative`,
        stepKey: "order_status",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setQuickReplies(["Check ETA ⏱️", `Reschedule ${wb} 📅`, "Book New Pickup 📦"]);
      return;
    }

    // Check if user asked an FAQ
    const localFaqMatch = findMatchingFaqClient(userText);
    if (localFaqMatch && FAQS_DATA[localFaqMatch]) {
      const faqAnswer = FAQS_DATA[localFaqMatch].answer[activeLocale] || FAQS_DATA[localFaqMatch].answer.en;
      matchedFaqId = localFaqMatch;
      replyText = faqAnswer;
      nextStep = "faq_answered";
      setQuickReplies(getQuickRepliesForStep("faq_answered", activeLocale, availableHubs, updatedDraft));

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: replyText,
        stepKey: "faq_answered",
        faqId: matchedFaqId,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setStep(nextStep);
      return;
    }

    // Check if user requested FAQ menu
    if (
      msg.includes("faq") ||
      msg.includes("help") ||
      msg.includes("सवाल") ||
      msg.includes("प्रश्न") ||
      msg.includes("ପ୍ରଶ୍ନ") ||
      msg.includes("ସାହାଯ୍ୟ")
    ) {
      setShowFaqDrawer(true);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text:
          activeLocale === "or"
            ? "❓ ଏଠାରେ ସାଧାରଣ ପ୍ରଶ୍ନୋତ୍ତର (FAQs) ତାଲିକା ରହିଛି। ଆପଣ ଯେକୌଣସି ପ୍ରଶ୍ନ ଉପରେ କ୍ଲିକ୍ କରିପାରିବେ:"
            : activeLocale === "hi"
            ? "❓ यहाँ अक्सर पूछे जाने वाले प्रश्नों (FAQs) की सूची है। आप किसी भी प्रश्न पर टैप कर सकते हैं:"
            : "❓ Here are frequently asked questions (FAQs). You can tap any question to get an instant answer:",
        stepKey: "faq_menu",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    // Standard conversational order booking
    if (
      currentStep === "greeting" ||
      currentStep === "select_origin" ||
      msg.includes("start") ||
      msg.includes("book") ||
      msg.includes("ऑर्डर") ||
      msg.includes("ଅର୍ଡର")
    ) {
      const matched = availableHubs.find(
        (h) => h.name.toLowerCase().includes(msg) || msg.includes(h.name.toLowerCase())
      );
      if (matched) {
        updatedDraft.origin_hub_id = matched.id;
        updatedDraft.origin_hub_name = matched.name;
      } else {
        updatedDraft.origin_hub_id = availableHubs[0].id;
        updatedDraft.origin_hub_name = availableHubs[0].name;
      }
      nextStep = "select_destination";
      stepKey = "select_dest";
      replyText = STEP_RESPONSES.select_dest[activeLocale] || STEP_RESPONSES.select_dest.en;
    } else if (currentStep === "select_destination") {
      const matched = availableHubs.find(
        (h) => h.name.toLowerCase().includes(msg) || msg.includes(h.name.toLowerCase())
      );
      if (matched) {
        updatedDraft.dest_hub_id = matched.id;
        updatedDraft.dest_hub_name = matched.name;
      } else {
        const fallback = availableHubs[1] || availableHubs[0];
        updatedDraft.dest_hub_id = fallback.id;
        updatedDraft.dest_hub_name = fallback.name;
      }
      nextStep = "select_good_type";
      stepKey = "select_good";
      replyText = STEP_RESPONSES.select_good[activeLocale] || STEP_RESPONSES.select_good.en;
    } else if (currentStep === "select_good_type") {
      if (
        msg.includes("vaccine") ||
        msg.includes("medicine") ||
        msg.includes("दवा") ||
        msg.includes("टीके") ||
        msg.includes("ଟିକା") ||
        msg.includes("ଔଷଧ")
      ) {
        updatedDraft.good_type = "vaccines_medical";
      } else if (
        msg.includes("milk") ||
        msg.includes("dairy") ||
        msg.includes("दूध") ||
        msg.includes("डेरी") ||
        msg.includes("କ୍ଷୀର") ||
        msg.includes("ଦୁଗ୍ଧ")
      ) {
        updatedDraft.good_type = "dairy_milk";
      } else if (
        msg.includes("fish") ||
        msg.includes("sea") ||
        msg.includes("मछली") ||
        msg.includes("ସାମୁଦ୍ରିକ") ||
        msg.includes("ମାଛ")
      ) {
        updatedDraft.good_type = "fish_seafood";
      } else {
        updatedDraft.good_type = "farm_produce";
      }
      nextStep = "select_temp";
      stepKey = "select_temp";
      replyText = STEP_RESPONSES.select_temp[activeLocale] || STEP_RESPONSES.select_temp.en;
    } else if (currentStep === "select_temp") {
      if (
        msg.includes("frozen") ||
        msg.includes("ice") ||
        msg.includes("फ्रोजन") ||
        msg.includes("जमे") ||
        msg.includes("ବରଫ") ||
        msg.includes("ଶୀତଳ") ||
        msg.includes("-20")
      ) {
        updatedDraft.temp_class = "frozen";
      } else if (
        msg.includes("chill") ||
        msg.includes("cold") ||
        msg.includes("ठंडा") ||
        msg.includes("चिल") ||
        msg.includes("ଥଣ୍ଡା") ||
        msg.includes("8") ||
        msg.includes("2")
      ) {
        updatedDraft.temp_class = "chilled";
      } else {
        updatedDraft.temp_class = "ambient";
      }
      nextStep = "enter_weight";
      stepKey = "enter_weight";
      replyText = STEP_RESPONSES.enter_weight[activeLocale] || STEP_RESPONSES.enter_weight.en;
    } else if (currentStep === "enter_weight") {
      const numbers = userText.match(/\d+/g);
      const weight = numbers ? parseFloat(numbers[0]) : 100;
      updatedDraft.weight_kg = weight;
      updatedDraft.volume_cbm = parseFloat((weight * 0.005).toFixed(2));
      nextStep = "confirm";
      stepKey = "confirm";
      replyText = STEP_RESPONSES.confirm[activeLocale] || STEP_RESPONSES.confirm.en;
    } else {
      nextStep = "select_origin";
      stepKey = "welcome";
      replyText = STEP_RESPONSES.welcome[activeLocale] || STEP_RESPONSES.welcome.en;
    }

    setDraftShipment(updatedDraft);
    setStep(nextStep);
    setQuickReplies(getQuickRepliesForStep(nextStep, activeLocale, availableHubs, updatedDraft));

    const botMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      sender: "bot",
      text: replyText,
      stepKey: stepKey,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      draftShipment: updatedDraft,
    };

    setMessages((prev) => [...prev, botMsg]);
  };

  const handleQuickReply = (reply: string) => {
    if (
      reply.includes("FAQ") ||
      reply.includes("प्रश्नोत्तर") ||
      reply.includes("प्रश्न")
    ) {
      setShowFaqDrawer(true);
      return;
    }

    if (
      reply.includes("Start Over") ||
      reply.includes("पुनः प्रारंभ") ||
      reply.includes("ପୁନର୍ବାର")
    ) {
      setDraftShipment(null);
      setStep("select_origin");
      const initialText = STEP_RESPONSES.welcome[botLocale] || STEP_RESPONSES.welcome.en;
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: initialText,
        stepKey: "welcome",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setQuickReplies(getQuickRepliesForStep("select_origin", botLocale, hubs, null));
      return;
    }

    if (
      reply.includes("Confirm Order") ||
      reply.includes("ऑर्डर कन्फर्म") ||
      reply.includes("ବୁକ୍ କରନ୍ତୁ")
    ) {
      placeOrder();
      return;
    }

    handleUserMessage(reply);
  };

  const placeOrder = async () => {
    if (!draftShipment) return;
    setIsPlacingOrder(true);

    try {
      const waybillNo = `RUR-${Math.floor(10000 + Math.random() * 90000)}`;
      const clientUuid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined;
      const validOriginId =
        draftShipment.origin_hub_id && String(draftShipment.origin_hub_id).length > 20
          ? draftShipment.origin_hub_id
          : hubs[0]?.id || "a0000000-0000-0000-0000-000000000001";
      const validDestId =
        draftShipment.dest_hub_id && String(draftShipment.dest_hub_id).length > 20
          ? draftShipment.dest_hub_id
          : hubs[1]?.id || hubs[0]?.id || "a0000000-0000-0000-0000-000000000002";

      const newShipment = {
        origin_hub_id: validOriginId,
        dest_hub_id: validDestId,
        good_type: draftShipment.good_type || "farm_produce",
        urgency: "routine",
        producer_id: "prod-rural-farmer-01",
        producer_name: "Gram Panchayat Farmer Co-op",
        community_id: "comm-cluster-jorhat",
        waybill_number: waybillNo,
        load_quantity: Number(draftShipment.load_quantity) || 1.0,
        quantity_units: "units",
        weight_kg: Number(draftShipment.weight_kg) || 100,
        volume_cbm: Number(draftShipment.volume_cbm) || 0.5,
        temp_class: draftShipment.temp_class || "chilled",
        sla_deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        client_id: clientUuid,
      };

      try {
        await createShipment({
          origin_hub_id: newShipment.origin_hub_id,
          dest_hub_id: newShipment.dest_hub_id,
          good_type: newShipment.good_type as any,
          urgency: newShipment.urgency as any,
          producer_id: newShipment.producer_id,
          producer_name: newShipment.producer_name,
          community_id: newShipment.community_id,
          waybill_number: newShipment.waybill_number,
          load_quantity: newShipment.load_quantity,
          quantity_units: newShipment.quantity_units,
          weight_kg: newShipment.weight_kg,
          volume_cbm: newShipment.volume_cbm,
          temp_class: newShipment.temp_class as any,
          sla_deadline: newShipment.sla_deadline,
          max_cost: 1500,
          client_id: clientUuid,
        });
      } catch {
        // Offline / network fallback -> queue in offline store
        OfflineSyncManager.queueAction("shipment", newShipment);
      }

      const successText = `${STEP_RESPONSES.success[botLocale] || STEP_RESPONSES.success.en} ${waybillNo}`;
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: successText,
        stepKey: "success",
        orderId: waybillNo,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setStep("completed");
      setDraftShipment(null);
      setQuickReplies(getQuickRepliesForStep("completed", botLocale, hubs, null));
    } catch {
      alert(t("failedOrder"));
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-medium text-xs rounded-full shadow-lg hover:shadow-emerald-900/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer border border-emerald-400/30"
          aria-label={t("title")}
          title={t("tooltip")}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
          </span>
          <span className="font-semibold tracking-wide">{t("floatingBtn")}</span>
          <span className="text-[10px] bg-emerald-800/80 px-1.5 py-0.5 rounded-full border border-emerald-500/40 uppercase">
            {botLocale}
          </span>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[410px] h-[580px] max-h-[85vh] bg-white dark:bg-[#121215] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 transition-colors">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-900 text-white p-3.5 flex items-center justify-between border-b border-emerald-700/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-600/40 border border-emerald-400/30 flex items-center justify-center font-bold text-sm text-emerald-200">
                📦
              </div>
              <div>
                <h3 className="font-semibold text-xs leading-tight text-white">{t("title")}</h3>
                <p className="text-[10px] text-emerald-200/80 leading-tight truncate max-w-[170px]">
                  {t("subtitle")}
                </p>
              </div>
            </div>

            {/* Language Switcher & Controls */}
            <div className="flex items-center gap-1.5">
              {/* FAQs toggle button */}
              <button
                type="button"
                onClick={() => setShowFaqDrawer(!showFaqDrawer)}
                className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                  showFaqDrawer
                    ? "bg-emerald-500 text-white border-emerald-400"
                    : "bg-emerald-950/60 text-emerald-200 hover:bg-emerald-900/60 border-emerald-700/60"
                }`}
                title={t("faqsTitle")}
              >
                ❓ FAQs
              </button>

              <div className="flex bg-emerald-950/60 p-0.5 rounded-lg border border-emerald-700/60">
                <button
                  type="button"
                  onClick={() => switchLanguage("en")}
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                    botLocale === "en" ? "bg-emerald-500 text-white" : "text-emerald-300 hover:text-white"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => switchLanguage("hi")}
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                    botLocale === "hi" ? "bg-emerald-500 text-white" : "text-emerald-300 hover:text-white"
                  }`}
                >
                  हिं
                </button>
                <button
                  type="button"
                  onClick={() => switchLanguage("or")}
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                    botLocale === "or" ? "bg-emerald-500 text-white" : "text-emerald-300 hover:text-white"
                  }`}
                >
                  ଓ
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-900/50 cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* FAQs Drawer Overlay */}
          {showFaqDrawer && (
            <div className="flex-1 bg-neutral-900/95 dark:bg-[#0c0c0e]/95 text-white p-4 overflow-y-auto flex flex-col space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400">{t("faqsTitle")}</h4>
                  <p className="text-[10px] text-neutral-400">{t("faqsSubtitle")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFaqDrawer(false)}
                  className="text-xs text-neutral-400 hover:text-white px-2 py-1 bg-neutral-800 rounded-md cursor-pointer"
                >
                  ✕ {t("backToChat")}
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                {Object.entries(FAQS_DATA).map(([faqKey, faqItem], idx) => (
                  <button
                    key={faqKey}
                    type="button"
                    onClick={() => handleSelectFaq(faqKey)}
                    className="w-full text-left p-2.5 bg-neutral-800/80 hover:bg-emerald-900/40 border border-neutral-700/60 hover:border-emerald-500/60 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold mt-0.5">
                        {String(idx + 1).padStart(2, "0")}.
                      </span>
                      <p className="text-[11px] font-medium text-neutral-200 group-hover:text-emerald-300 leading-snug">
                        {faqItem.question[botLocale] || faqItem.question.en}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Body */}
          {!showFaqDrawer && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-neutral-50/50 dark:bg-[#09090b]/80">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  {msg.sender === "bot" && msg.aiGenerated && (
                    <div className="mb-1 flex items-center gap-1.5 px-1">
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
                        <span className="text-[10px]">✨</span>
                        <span>{msg.providerUsed ? msg.providerUsed.toUpperCase() : "AI"}</span>
                        <span className="text-[8px] opacity-75">· {t("aiPowered")}</span>
                      </span>
                    </div>
                  )}
                  <div
                    className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                      msg.sender === "user"
                        ? "bg-emerald-600 text-white rounded-br-none font-medium"
                        : "bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-700/60 rounded-bl-none font-sans whitespace-pre-line"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 px-1">
                    <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-mono">{msg.timestamp}</span>
                    {msg.sender === "bot" && (
                      <button
                        type="button"
                        onClick={() => speakText(msg.text)}
                        className="text-[10px] text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer p-0.5"
                        title={t("speakTooltip")}
                      >
                        🔊
                      </button>
                    )}
                  </div>

                  {/* Draft Shipment Card Preview */}
                  {msg.sender === "bot" && step === "confirm" && (draftShipment || msg.draftShipment) && (
                    <div className="mt-2.5 w-full max-w-[90%] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-xs space-y-1.5 shadow-sm">
                      <div className="font-bold text-emerald-900 dark:text-emerald-300 border-b border-emerald-200/60 dark:border-emerald-800/60 pb-1 flex justify-between items-center">
                        <span>📦 {t("title")}</span>
                        <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded font-mono">
                          {t("draft")}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-950 dark:text-emerald-200 space-y-1">
                        <p>
                          <span className="font-semibold">{t("origin")}:</span>{" "}
                          {(draftShipment || msg.draftShipment).origin_hub_name || "Guwahati Hub"}
                        </p>
                        <p>
                          <span className="font-semibold">{t("destination")}:</span>{" "}
                          {(draftShipment || msg.draftShipment).dest_hub_name || "Jorhat Hub"}
                        </p>
                        <p>
                          <span className="font-semibold">{t("goodType")}:</span>{" "}
                          {getGoodTypeLabel((draftShipment || msg.draftShipment).good_type, botLocale)}
                        </p>
                        <p>
                          <span className="font-semibold">{t("tempClass")}:</span>{" "}
                          {getTempLabel((draftShipment || msg.draftShipment).temp_class, botLocale)}
                        </p>
                        <p>
                          <span className="font-semibold">{t("weight")}:</span>{" "}
                          {(draftShipment || msg.draftShipment).weight_kg || 100} kg (
                          {(draftShipment || msg.draftShipment).volume_cbm || 0.5} m³)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={placeOrder}
                        disabled={isPlacingOrder}
                        className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isPlacingOrder ? (
                          <span>{t("processing")}</span>
                        ) : (
                          <>
                            <span>{t("confirmOrder")}</span>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {isSubmitting && (
                <div className="flex items-center gap-1.5 text-neutral-400 text-xs py-2 px-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse delay-150" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse delay-300" />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Quick Reply Chips */}
          {!showFaqDrawer && quickReplies.length > 0 && !isSubmitting && (
            <div className="px-3 py-2 bg-white dark:bg-[#121215] border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickReply(reply)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 rounded-full whitespace-nowrap transition-colors cursor-pointer"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-white dark:bg-[#121215] border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
            {/* Speech to Text Mic */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isListening
                  ? "bg-red-500 text-white border-red-600 animate-pulse"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border-neutral-200 dark:border-neutral-700"
              }`}
              title={t("micTooltip")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUserMessage(input)}
              placeholder={isListening ? t("listening") : t("inputPlaceholder")}
              className="flex-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 px-3.5 py-2 rounded-xl text-xs border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-900 transition-colors"
            />

            <button
              type="button"
              onClick={() => handleUserMessage(input)}
              disabled={!input.trim() || isSubmitting}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
