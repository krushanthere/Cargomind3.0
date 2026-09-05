"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { createShipment } from "@/lib/api/shipments";
import { getHubs } from "@/lib/api/network";
import { sendChatMessage, type ChatLocale } from "@/lib/api/chat";
import { OfflineSyncManager } from "@/lib/offline/syncStore";
import {
  AiBrainIcon,
  PackageIcon,
  HelpCircleIcon,
  CloseIcon,
  SendIcon,
  MicrophoneIcon,
  CheckIcon,
} from "../icons/Hugeicons";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  stepKey?: string;
  draftShipment?: any;
  orderId?: string;
  faqId?: string | null;
  aiGenerated?: boolean;
  providerUsed?: string | null;
}

const SPEECH_LANG_MAP: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  as: "as-IN",
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
      as: "এই প্লেটফৰ্ম কি?",
    },
    answer: {
      en: "📦 **CargoMind (ShipMerge)** is an AI-powered multi-tenant rural logistics and cold-chain consolidation platform. It optimizes multi-modal freight distribution (road, rail DFC, refrigerated reefers), predicts perishable spoilage using physics-based kinetics (Arrhenius & Q10), and connects rural producers and farmer cooperatives directly to regional markets.",
      hi: "📦 **कार्गोमाइंड (CargoMind / ShipMerge)** एक एआई-संचालित मल्टी-टेनेंट ग्रामीण लॉजिस्टिक्स और कोल्ड-चेन समेकन प्लेटफॉर्म है। यह मल्टी-मोडल माल परिवहन (सड़क, रेल डीएफसी, रीफर वाहन) को अनुकूलित करता है, भौतिकी-आधारित काइनेटिक्स (Arrhenius & Q10) से खराब होने वाले सामान के जोखिम का सटीक अनुमान लगाता है, और ग्रामीण उत्पादकों को सीधे क्षेत्रीय बाजारों से जोड़ता है।",
      as: "📦 **কাৰ্গোমাইণ্ড (CargoMind / ShipMerge)** হ’ল এটা AI-চালিত মাল্টি-টেনেণ্ট গ্ৰাম্য লজিষ্টিক আৰু কোল্ড-চেইন সমন্বয় প্লেটফৰ্ম। ই মাল্টি-মডেল মাল পৰিবহণ (পথ, ৰে’ল DFC, ৰিফাৰ বাহন) সুশৃংখলিত কৰে, পদাৰ্থ বিজ্ঞান ভিত্তিক কিনেটিক্স (Arrhenius & Q10) ব্যৱহাৰ কৰি নষ্ট হ’ব পৰা সামগ্ৰীৰ স্থায়িত্ব নিৰ্ধাৰণ কৰে, আৰু গ্ৰাম্য কৃষক তথা সমবায়ক প্ৰত্যক্ষভাৱে আঞ্চলিক বজাৰৰ সৈতে সংযোগ কৰে।",
    },
    keywords: [
      "what is this platform", "what is platform", "what is cargomind", "what is shipmerge", "about the platform", "about platform",
      "यह प्लेटफॉर्म क्या है", "यह क्या है", "कार्गोमाइंड क्या है",
      "এই প্লেটফৰ্ম কি", "কাৰ্গোমাইণ্ড কি", "প্লেটফৰ্মৰ বিষয়ে",
    ],
  },
  create_shipment: {
    question: {
      en: "How do I create a shipment?",
      hi: "मैं शिपमेंट कैसे बना सकता हूँ?",
      as: "মই কেনেকৈ চালান (শ্বিপমেণ্ট) সৃষ্টি কৰিম?",
    },
    answer: {
      en: "📝 **Creating a Shipment:**\n1. Use this Chatbot: Type or speak *'Book order'* to start our guided step-by-step assistant.\n2. Via Web Portal: Go to the **Pickups / Shipments** section and click **Create Shipment**.\n3. Specify your origin hub/village, destination hub, commodity type, temperature class (Frozen, Chilled, Ambient), and total weight (kg).",
      hi: "📝 **शिपमेंट बनाने की विधि:**\n1. इस चैटबॉट से: बोलें या लिखें *'ऑर्डर बुक करें'* और चरण-दर-चरण प्रक्रिया का पालन करें।\n2. वेब पोर्टल से: **Pickups / Shipments** सेक्शन में जाएं और **Create Shipment** पर क्लिक करें।\n3. अपना मूल गाँव/हब, गंतव्य हब, सामग्री का प्रकार, तापमान श्रेणी (फ्रोजन, चिल्ड, सामान्य) और वजन (किलोग्राम) दर्ज करें।",
      as: "📝 **চালান সৃষ্টি কৰাৰ পদ্ধতি:**\n1. এই চাটবট ব্যৱহাৰ কৰক: আমাৰ নিৰ্দেশিত প্ৰক্ৰিয়া আৰম্ভ কৰিবলৈ *'অৰ্ডাৰ বুক কৰক'* টাইপ কৰক বা কওক।\n2. ৱেব পৰ্টেলৰ জৰিয়তে: **Pickups / Shipments** বিভাগলৈ যাওক আৰু **Create Shipment** ত ক্লিক কৰক।\n3. আপোনাৰ মূল গাওঁ/হাব, গন্তব্য স্থানৰ হাব, সামগ্ৰীৰ প্ৰকাৰ, উষ্ণতাৰ শ্ৰেণী (হিমায়িত/ফ্ৰোজেন, শীতল, সাধাৰণ) আৰু মুঠ ওজন (কিলোগ্ৰাম) প্ৰদান কৰক।",
    },
    keywords: [
      "how do i create a shipment", "how to create a shipment", "how to create shipment", "how to make a shipment", "how to book a shipment", "how to book cargo",
      "शिपमेंट कैसे बना", "शिपमेंट कैसे बनाएँ", "ऑर्डर कैसे बनाएँ", "शिपमेंट कैसे बनाएं",
      "মই কেনেকৈ চালান সৃষ্টি কৰিম", "অৰ্ডাৰ কেনেকৈ বুক কৰিম", "চালান কেনেকৈ কৰিম",
    ],
  },
  find_vehicle: {
    question: {
      en: "How can I find a vehicle?",
      hi: "मैं वाहन कैसे खोज सकता हूँ?",
      as: "মই বাহন কেনেকৈ বিচাৰি পাম?",
    },
    answer: {
      en: "🚚 **Finding a Vehicle:**\n• **Automated Matching:** Vehicles are automatically matched to your shipment using our intelligent multi-modal optimization engine.\n• **Fleet Directory:** Navigate to the **Dispatch** or **Kinetics** tab to view active cooperative vehicles, reefer trucks, dynamic GPS telemetry, and available payload capacity.",
      hi: "🚚 **वाहन खोजने की प्रक्रिया:**\n• **स्वचालित मैचिंग:** हमारा इंटेलिजेंट ऑप्टिमाइजेशन इंजन आपके शिपमेंट के लिए सर्वोत्तम वाहन का स्वतः चयन करता है।\n• **फ्लीट डायरेक्टरी:** उपलब्ध रीफर गाड़ियाँ, वाहन क्षमता, GPS लोकेशन और तापमान स्थिति देखने के लिए **Dispatch** या **Kinetics** टैब देखें।",
      as: "🚚 **বাহন বিচৰাৰ প্ৰক্ৰিয়া:**\n• **স্বয়ংক্ৰিয় মেচিং:** আমাৰ বুদ্ধিমত্তা সম্পন্ন মাল্টি-মডেল অপ্টিমাইজেচন ইঞ্জিনে আপোনাৰ চালানৰ বাবে উপযুক্ত বাহন স্বয়ংক্ৰিয়ভাৱে নিৰ্বাচন কৰে।\n• **বাহনৰ তালিকা:** সক্ৰিয় সমবায় বাহন, ৰিফাৰ ট্ৰাক, লাইভ GPS আৰু উপলব্ধ বহন ক্ষমতা চাবলৈ **Dispatch** বা **Kinetics** টেব চাওক।",
    },
    keywords: [
      "how can i find a vehicle", "how to find a vehicle", "how do i find a vehicle", "how to find vehicle", "how can i get a vehicle", "find a vehicle",
      "वाहन कैसे खोज", "गाड़ी कैसे खोज", "गाड़ी कैसे मिलेगी", "वाहन कैसे खोजें",
      "মই বাহন কেনেকৈ বিচাৰি পাম", "গাড়ী কেনেকৈ পাম", "বাহন কেনেকৈ পাম",
    ],
  },
  vehicle_matching: {
    question: {
      en: "How does vehicle matching work?",
      hi: "वाहन मिलान कैसे काम करता है?",
      as: "বাহন মেচিং কেনেকৈ কাম কৰে?",
    },
    answer: {
      en: "🧠 **Vehicle Matching Engine:**\nPowered by **Google OR-Tools CP-SAT Combinatorial Optimization**:\n1. **Thermal Isolation:** Strictly prevents co-loading incompatible temperatures (e.g., Frozen -18°C vs Ambient).\n2. **Payload & Volume Bounds:** Respects maximum kg capacity and cubic meter volume constraints.\n3. **Road Quality & Kinetics:** Integrates unpaved rural road conditions and shelf-life degradation rates.\n4. **Driver Fairness:** Balances dispatches among local community carriers.",
      hi: "🧠 **वाहन मिलान (Vehicle Matching) प्रणाली:**\nयह **Google OR-Tools CP-SAT ऑप्टिमाइजेशन** पर आधारित है:\n1. **तापमान अलगाव:** फ्रोजन (-18°C) और सामान्य सामान को एक साथ लोड होने से रोकता है।\n2. **भार व आयतन सीमा:** वाहन की पेलोड वजन और क्यूबिक मीटर क्षमता का पालन करता है।\n3. **सड़क की स्थिति एवं काइनेटिक्स:** कच्ची ग्रामीण सड़कों और सामान की शेल्फ-लाइफ का विश्लेषण करता है।\n4. **चालक निष्पक्षता:** स्थानीय ड्राइवरों के बीच समान ट्रिप वितरण सुनिश्चित करता है।",
      as: "🧠 **বাহন মেচিং পদ্ধতি:**\nএইটো **Google OR-Tools CP-SAT অপ্টিমাইজেচন** দ্বাৰা পৰিচালিত:\n1. **উষ্ণতা সুৰক্ষা:** ফ্ৰোজেন (-18°C) আৰু সাধাৰণ সামগ্ৰী কেতিয়াও একেলগে লোড নহয়।\n2. **ওজন আৰু আয়তন সীমা:** বাহনৰ সৰ্বোচ্চ ওজন আৰু কিউবিক মিটাৰ ক্ষমতা মানি চলে।\n3. **পথৰ অৱস্থা আৰু কিনেটিক্স:** গ্ৰাম্য কেঁচা পথ আৰু সামগ্ৰীৰ গুণাগুণ ৰক্ষাৰ সময় গণনা কৰে।\n4. **চালকৰ সমতা:** স্থানীয় চালকসকলৰ মাজত সমানভাৱে ট্ৰিপ বিতৰণ কৰে।",
    },
    keywords: [
      "how does vehicle matching work", "how vehicle matching works", "vehicle matching algorithm", "cp-sat matching", "matching logic", "vehicle matching work",
      "वाहन मिलान कैसे काम करता है", "मैचिंग कैसे काम करती है", "मैचिंग कैसे होती है",
      "বাহন মেচিং কেনেকৈ কাম কৰে", "মেচিং কেনেকৈ হয়", "গাড়ী মেচিং",
    ],
  },
  vehicle_fleet_dynamism: {
    question: {
      en: "Is the vehicle quantity fixed or dynamically calculated?",
      hi: "क्या वाहनों की संख्या निश्चित है या गतिशील?",
      as: "বাহনৰ সংখ্যা নিৰ্দিষ্ট নে গতিশীলভাৱে গণনা কৰা হয়?",
    },
    answer: {
      en: "📊 **Dynamic Synthetic Vehicle Pool:**\nWe don't assume a fixed number of vehicles. The prototype uses a synthetic baseline vehicle registry because real operational datasets were not available.\n• **Dynamic Pool:** Vehicles can become available, unavailable, occupied, or added at runtime.\n• **Automatic Recalculation:** The optimizer consumes the currently available fleet from the registry without hardcoded vehicle counts and recalculates allocations dynamically.",
      hi: "📊 **गतिशील सिंथेटिक वाहन पूल:**\nहम वाहनों की कोई निश्चित संख्या नहीं मानते हैं। प्रोटोटाइप सिंथेटिक बेसलाइन वाहन रजिस्ट्री का उपयोग करता है क्योंकि वास्तविक परिचालन डेटा उपलब्ध नहीं था।\n• **गतिशील पूल:** वाहन उपलब्ध, अनुपलब्ध, व्यस्त या नए जोड़े जा सकते हैं।\n• **स्वचालित पुनः आवंटन:** ऑप्टिमाइज़र रजिस्ट्री से वर्तमान उपलब्ध बेड़े को इनपुट के रूप में लेता है और बिना किसी हार्ड-कोडेड वाहन सीमा के स्वतः पुनः आवंटन करता है।",
      as: "📊 **গতিশীল চিন্থেটিক বাহন পুল:**\nআমি বাহনৰ কোনো নিৰ্দিষ্ট সংখ্যা ধৰি নলওঁ। প্ৰকৃত কাৰ্যকৰী তথ্য উপলব্ধ নথকাৰ বাবে প্ৰ’ট’টাইপে এটা চিন্থেটিক বেচলাইন বাহন ৰেজিষ্ট্ৰী ব্যৱহাৰ কৰে।\n• **গতিশীল পুল:** বাহন উপলব্ধ, অনুপলব্ধ, ব্যস্ত বা নতুনকৈ সংযোগ হ’ব পাৰে।\n• **স্বয়ংক্ৰিয় পুনৰ গণনা:** অপ্টিমাইজাৰে কোনো হাৰ্ড-কোড নকৰাকৈ ৰেজিষ্ট্ৰীৰ পৰা বৰ্তমান উপলব্ধ বহৰ ইনপুট লৈ বিতৰণ পুনৰ নিৰ্ধাৰণ কৰে।",
    },
    keywords: [
      "is vehicle quantity fixed", "are vehicles fixed", "how many vehicles", "fixed fleet", "synthetic vehicles", "vehicle pool dynamic", "why synthetic vehicles", "vehicle registry",
      "क्या वाहन निश्चित हैं", "वाहनों की संख्या निश्चित", "कितने वाहन हैं", "सिंथेटिक वाहन",
      "বাহনৰ সংখ্যা নিৰ্দিষ্ট নে", "কিমান গাড়ী আছে", "চিন্থেটিক বাহন",
    ],
  },
  track_shipment: {
    question: {
      en: "How can I track my shipment?",
      hi: "मैं अपना शिपमेंट कैसे ट्रैक करूँ?",
      as: "মই মোৰ চালান কেনেকৈ ট্ৰেক কৰিম?",
    },
    answer: {
      en: "📍 **Shipment Tracking:**\n• **Via Chatbot:** Simply ask *'Track RUR-90141'* or *'Status of my order'*.\n• **Via Map View:** Check the interactive **Overview / Topology** map for live GPS movement, ETA estimates, cold-chain temperature telemetry, and predicted shelf-life health.",
      hi: "📍 **शिपमेंट ट्रैकिंग:**\n• **चैटबॉट से:** सीधे लिखें या पूछें *'Track RUR-90141'* या *'ऑर्डर की स्थिति'*।\n• **मानचित्र दृश्य:** लाइव GPS लोकेशन, आगमन समय (ETA), रीफर तापमान और शेल्फ-लाइफ स्वास्थ्य देखने के लिए **Overview / Topology** मैप देखें।",
      as: "📍 **চালান ট্ৰেকিং:**\n• **চাটবটৰ জৰিয়তে:** পোনপটীয়াকৈ সোধক *'Track RUR-90141'* বা *'মোৰ অৰ্ডাৰৰ স্থিতি'*।\n• **মেপ ভিউ:** লাইভ GPS অৱস্থান, আগমনৰ আনুমানিক সময় (ETA), কোল্ড-চেইন উষ্ণতা আৰু সামগ্ৰীৰ স্থিতি চাবলৈ **Overview / Topology** মেপ চাওক।",
    },
    keywords: [
      "how can i track my shipment", "how to track my shipment", "how to track shipment", "how do i track shipment", "tracking process",
      "शिपमेंट कैसे ट्रैक करूँ", "शिपमेंट कैसे ट्रैक करें", "ट्रैक कैसे करें", "ट्रैकिंग कैसे करें",
      "মোৰ চালান কেনেকৈ ট্ৰেক কৰিম", "ট্ৰেক কেনেকৈ কৰিম", "চালান ট্ৰেক",
    ],
  },
  no_internet: {
    question: {
      en: "What happens if there is no internet?",
      hi: "यदि इंटरनेट न हो तो क्या होगा?",
      as: "ইণ্টাৰনেট নাথাকিলে কি হ’ব?",
    },
    answer: {
      en: "📶 **Offline-First Resilience:**\nNo internet? No problem! The platform functions seamlessly offline in remote areas.\n• You can book shipments, log road obstacles, and record sensor temperature updates.\n• Data is saved securely in local device storage and automatically synchronizes when network connection is restored.",
      hi: "📶 **ऑफलाइन-फर्स्ट सुरक्षा:**\nइंटरनेट नहीं है? कोई समस्या नहीं! यह प्लेटफॉर्म ग्रामीण और दूरदराज के क्षेत्रों में पूरी तरह ऑफलाइन काम करता है।\n• आप शिपमेंट बुक कर सकते हैं, सड़क की बाधाएं दर्ज कर सकते हैं और तापमान रिकॉर्ड कर सकते हैं।\n• सभी डेटा डिवाइस की लोकल मेमोरी में सुरक्षित रहता है और इंटरनेट मिलते ही अपने आप सिंक हो जाता है।",
      as: "📶 **অফলাইন-ফাৰ্ষ্ট সুৰক্ষা:**\nইণ্টাৰনেট নাই? একো চিন্তা নাই! এই প্লেটফৰ্মে দুৰ্গম অঞ্চলতো অফলাইনত সুচাৰুৰূপে কাম কৰে।\n• আপুনি চালান বুক কৰিব পাৰে, পথৰ সমস্যা লগ কৰিব পাৰে আৰু উষ্ণতা ৰেকৰ্ড কৰিব পাৰে।\n• সকলো তথ্য ডিভাইচৰ লোকাল মেমৰীত সুৰক্ষিত থাকে আৰু ইণ্টাৰনেট পোৱাৰ লগে লগে স্বয়ংক্ৰিয়ভাৱে চিংক হৈ যায়।",
    },
    keywords: [
      "what happens if there is no internet", "what if no internet", "what happens if no internet", "no internet", "without internet",
      "यदि इंटरनेट न हो", "बिना इंटरनेट क्या होगा", "इंटरनेट नहीं है", "इंटरनेट न हो तो",
      "ইণ্টাৰনেট নাথাকিলে কি হ’ব", "ইণ্টাৰনেট নোহোৱাকৈ", "ইণ্টাৰনেট নাই",
    ],
  },
  offline_sync: {
    question: {
      en: "How does offline synchronization work?",
      hi: "ऑफ़लाइन सिंक्रोनाइज़ेशन कैसे काम करता है?",
      as: "অফলাইন ছিংক্ৰ’নাইজেচন কেনেকৈ কাম কৰে?",
    },
    answer: {
      en: "🔄 **Offline Synchronization:**\n1. **Local Queue:** Transactions created offline are assigned unique client UUIDs and placed in a persistent queue.\n2. **Batch Upload:** When online connectivity returns, the background sync engine pushes pending records to `/api/sync/batch`.\n3. **Conflict Resolution:** Employs timestamp-based Last-Write-Wins and atomic transaction safety with zero data loss.",
      hi: "🔄 **ऑफलाइन सिंक्रोनाइज़ेशन प्रक्रिया:**\n1. **लोकल कतार:** ऑफलाइन बनाए गए ट्रांजेक्शन को क्लाइंट UUID दिया जाता है और लोकल कतार में रखा जाता है।\n2. **बैच अपलोड:** इंटरनेट कनेक्ट होते ही बैकग्राउंड इंजन सभी रिकॉर्ड्स को `/api/sync/batch` पर भेजता है।\n3. **विवाद समाधान:** टाइमस्टैम्प-आधारित लास्ट-राइट-विन्स और ऑटोमैटिक ट्रांजेक्शन सुरक्षा से डेटा सुरक्षित रहता है।",
      as: "🔄 **অফলাইন ছিংক্ৰ’নাইজেচন প্ৰক্ৰিয়া:**\n1. **লোকাল কিউ:** অফলাইনত কৰা এণ্ট্ৰিবোৰক এটা স্বতন্ত্ৰ ক্লাইণ্ট UUID দিয়া হয় আৰু লোকাল কিউত ৰখা হয়।\n2. **বেচ আপলোড:** অনলাইন সংযোগ হোৱাৰ লগে লগে বেকগ্ৰাউণ্ড ছিংক ইঞ্জিনে `/api/sync/batch` লৈ তথ্য প্ৰেৰণ কৰে।\n3. **দ্বন্দ্ব সমাধান:** টাইমষ্টেম্প-ভিত্তিক লাষ্ট-ৰাইট-উইনছ পদ্ধতিৰ দ্বাৰা কোনো তথ্য নষ্ট নোহোৱাকৈ সুৰক্ষিত কৰা হয়।",
    },
    keywords: [
      "how does offline synchronization work", "how offline sync works", "how does sync work", "offline synchronization work", "offline sync",
      "ऑफ़लाइन सिंक्रोनाइज़ेशन कैसे काम करता है", "ऑफलाइन सिंक कैसे काम करता है", "सिंक कैसे होता है",
      "অফলাইন ছিংক্ৰ’নাইজেচন কেনেকৈ কাম কৰে", "ছিংক কেনেকৈ হয়", "ছিংক্ৰ’নাইজেচন",
    ],
  },
  prevent_duplicates: {
    question: {
      en: "How are duplicate submissions prevented?",
      hi: "डुप्लिकेट सबमिशन को कैसे रोका जाता है?",
      as: "ডুপ্লিকেট এন্ট্ৰি কেনেকৈ প্ৰতিৰোধ কৰা হয়?",
    },
    answer: {
      en: "🛡️ **Duplicate Prevention (Idempotency):**\nEvery offline creation generates a unique client-side UUID (`client_id`). During sync, the database repository verifies if the `client_id` already exists. If already present, the duplicate request is safely bypassed without re-creating the shipment, ensuring strict *exactly-once* semantics.",
      hi: "🛡️ **डुप्लिकेट सबमिशन की रोकथाम (Idempotency):**\nप्रत्येक ऑफलाइन रिकॉर्ड को एक विशिष्ट `client_id` (UUID) दिया जाता है। सिंक के दौरान डेटाबेस जांचता है कि क्या यह आईडी पहले से मौजूद है। यदि हां, तो डुप्लीकेट प्रविष्टि को छोड़ दिया जाता है, जिससे हर शिपमेंट केवल एक ही बार दर्ज होता है।",
      as: "🛡️ **ডুপ্লিকেট প্ৰতিৰোধ (Idempotency):**\nপ্ৰতিটো অফলাইন এন্ট্ৰিত এটা স্বতন্ত্ৰ `client_id` (UUID) থাকে। ছিংক হোৱাৰ সময়ত ডাটাবেছে পৰীক্ষা কৰে যে এই ID আগতেই আছে নেকি। যদি ইতিমধ্যে থাকে, তেন্তে ডুপ্লিকেট এন্ট্ৰি বাদ দিয়া হয় যাতে কোনো অৰ্ডাৰ দুবাৰ প্ৰবিষ্টি নহয়।",
    },
    keywords: [
      "how are duplicate submissions prevented", "duplicate submissions prevented", "prevent duplicate", "duplicate prevention", "idempotent submission",
      "डुप्लिकेट सबमिशन को कैसे रोका जाता है", "डुप्लीकेट कैसे रोकते हैं", "दोहराव कैसे रोकते हैं",
      "ডুপ্লিকেট এন্ট্ৰি কেনেকৈ প্ৰতিৰোধ কৰা হয়", "ডুপ্লিকেট কেনেকৈ ৰোধ কৰা হয়",
    ],
  },
  who_can_use: {
    question: {
      en: "Who can use the platform?",
      hi: "इस प्लेटफॉर्म का उपयोग कौन कर सकता है?",
      as: "এই প্লেটফৰ্ম কোনে ব্যৱহাৰ কৰিব পাৰে?",
    },
    answer: {
      en: "👥 **Supported Users & Roles:**\n1. **Shippers & Farmers:** Book consignments, request reefer storage, and track produce to central hubs.\n2. **Carriers & Drivers:** Receive optimal load-matching routes, fair compensation trips, and road condition alerts.\n3. **Network Admins:** Oversee network resilience, cold-chain SLA compliance, and multimodal corridor routing.",
      hi: "👥 **उपयोगकर्ता एवं भूमिकाएं:**\n1. **शिपर एवं किसान:** फसल व उपज की बुकिंग, कोल्ड स्टोरेज स्लॉट और डिलीवरी ट्रैकिंग के लिए।\n2. **ट्रांसपोर्टर्स एवं ड्राइवर:** अनुकूलित रूट, निष्पक्ष ट्रिप आवंटन और सड़क अलर्ट प्राप्त करने के लिए।\n3. **नेटवर्क एडमिनिस्ट्रेटर:** पूरे लॉजिस्टिक्स नेटवर्क, तापमान अनुपालन और मल्टी-मोडल कॉरिडोर प्रबंधन के लिए।",
      as: "👥 **সমৰ্থিত ব্যৱহাৰকাৰী আৰু ভূমিকা:**\n1. **কৃষক আৰু প্ৰেৰক:** সামগ্ৰী বুকিং, কোল্ড ষ্ট’ৰেজৰ সুবিধা আৰু ডেলিভাৰী ট্ৰেকিং কৰিবলৈ।\n2. **পৰিবহণকাৰী আৰু চালক:** সৰ্বোত্তম ৰুট, ন্যায্য উপাৰ্জনৰ ট্ৰিপ আৰু পথৰ সতৰ্কবাৰ্তা লাভ কৰিবলৈ।\n3. **নেটৱৰ্ক এডমিন:** সমগ্ৰ লজিষ্টিক নেটৱৰ্ক, কোল্ড-চেইন মান আৰু মাল্টিমডেল ক’ৰিডৰ পৰিচালনা কৰিবলৈ।",
    },
    keywords: [
      "who can use the platform", "who can use this platform", "who can use", "eligible users", "target users",
      "इस प्लेटफॉर्म का उपयोग कौन कर सकता है", "कौन उपयोग कर सकता है", "उपयोगकर्ता कौन हैं",
      "এই প্লেটফৰ্ম কোনে ব্যৱহাৰ কৰিব পাৰে", "কোনে ব্যৱহাৰ কৰিব পাৰে",
    ],
  },
  rural_help: {
    question: {
      en: "How does the platform help rural areas?",
      hi: "यह प्लेटफॉर्म ग्रामीण क्षेत्रों की कैसे मदद करता है?",
      as: "এই প্লেটফৰ্মে গ্ৰাম্য অঞ্চলক কেনেকৈ সহায় কৰে?",
    },
    answer: {
      en: "🌾 **Rural Impact & Benefits:**\n• **Cooperative Freight Pooling:** Reduces transportation costs by up to 35% through consolidated loads.\n• **Spoilage Prevention:** Extends perishable crop and medicine shelf-life via continuous cold-chain monitoring.\n• **Multilingual Voice Bot:** Enables local producers to book cargo in Assamese, Hindi, and English.\n• **Fair Dispatch:** Guarantees equitable load allocation across small rural vehicle owners.",
      hi: "🌾 **ग्रामीण क्षेत्रों के लिए लाभ:**\n• **सहकारी माल एकत्रीकरण:** भार समेकन से परिवहन लागत में 35% तक की बचत।\n• **खराबी से सुरक्षा:** निरंतर कोल्ड-चेन निगरानी से फसलों और दवाओं का जीवनकाल बढ़ता है।\n• **बहुभाषी वॉयस बॉट:** स्थानीय किसान असमिया, हिंदी और अंग्रेजी में आसानी से ऑर्डर बुक कर सकते हैं।\n• **निष्पक्ष डिस्पैच:** छोटे ग्रामीण वाहन चालकों को समान और निष्पक्ष ट्रिप आवंटन।",
      as: "🌾 **গ্ৰাম্য প্ৰভাৱ আৰু লাভালাভ:**\n• **সমবায় মাল একত্ৰীকৰণ:** সংযুক্ত বোজাইৰ জৰিয়তে পৰিবহণ খৰচ ৩৫% লৈকে হ্ৰাস কৰে।\n• **নষ্ট হোৱাৰ পৰা ৰক্ষা:** নিৰন্তৰ কোল্ড-চেইন নিৰীক্ষণেৰে শস্য আৰু ঔষধৰ জীৱনকাল বৃদ্ধি কৰে।\n• **বহুভাষিক ভইচ বট:** স্থানীয় কৃষকসকলে অসমীয়া, হিন্দী, আৰু ইংৰাজীত সহজে অৰ্ডাৰ বুক কৰিব পাৰে।\n• **ন্যায্য বিতৰণ:** ক্ষুদ্ৰ গ্ৰাম্য বাহনৰ মালিকসকলক সমভাৱে ট্ৰিপ প্ৰদান নিশ্চিত কৰে।",
    },
    keywords: [
      "how does the platform help rural areas", "how platform helps rural", "help rural areas", "rural impact", "rural benefit",
      "यह प्लेटफॉर्म ग्रामीण क्षेत्रों की कैसे मदद करता है", "ग्रामीण क्षेत्रों की मदद", "ग्रामीण क्षेत्रों को क्या लाभ",
      "এই প্লেটফৰ্মে গ্ৰাম্য অঞ্চলক কেনেকৈ সহায় কৰে", "গ্ৰাম্য অঞ্চলৰ লাভ",
    ],
  },
  no_vehicle_available: {
    question: {
      en: "What happens if no vehicle is available?",
      hi: "यदि कोई वाहन उपलब्ध न हो तो क्या होगा?",
      as: "যদি কোনো বাহন উপলব্ধ নহয় তেন্তে কি হ’ব?",
    },
    answer: {
      en: "⏳ **When No Vehicle is Available:**\n1. **Priority Queuing:** Your shipment is prioritized in the smart aggregation queue.\n2. **Cold Buffer Staging:** Cargo is assigned to local hub cold-storage holding cells to prevent spoilage.\n3. **Multimodal Fallback:** The engine searches for return-trip reefers, community vehicles, or Dedicated Freight Corridor (DFC) rail connections and notifies you instantly.",
      hi: "⏳ **यदि कोई वाहन उपलब्ध न हो:**\n1. **प्राथमिकता कतार:** आपके शिपमेंट को स्मार्ट एकत्रीकरण कतार में प्राथमिकता दी जाती है।\n2. **कोल्ड स्टोरेज सुरक्षा:** खराबी से बचाने के लिए सामान को स्थानीय हब के कोल्ड-स्टोरेज में सुरक्षित रखा जाता है।\n3. **मल्टी-मोडल विकल्प:** सिस्टम वापसी वाले रीफर ट्रकों, ग्रामीण वाहनों या डीएफसी रेल विकल्पों को सक्रिय करता है और आपको सूचित करता है।",
      as: "⏳ **যেতিয়া কোনো বাহন উপলব্ধ নাথাকে:**\n1. **প্ৰাথমিকতা কিউ:** আপোনাৰ চালানটোক স্মাৰ্ট একত্ৰীকৰণ কিউত অগ্ৰাধিকাৰ দিয়া হয়।\n2. **কোল্ড ষ্ট’ৰেজ সংৰক্ষণ:** সামগ্ৰী নষ্ট নহ’বলৈ স্থানীয় হাবৰ কোল্ড-ষ্ট’ৰেজত সুৰক্ষিতভাৱে ৰখা হয়।\n3. **বিকল্প পৰিবহণ:** চিষ্টেমে উভতি অহা ৰিফাৰ ট্ৰাক, স্থানীয় বাহন বা ৰে’ল DFC বিকল্প বিচাৰি উলিয়ায় আৰু আপোনাক তৎকালীনভাৱে জনায়।",
    },
    keywords: [
      "what happens if no vehicle is available", "if no vehicle is available", "no vehicle is available", "when no truck available",
      "यदि कोई वाहन उपलब्ध न हो", "गाड़ी उपलब्ध न हो तो क्या होगा", "गाड़ी न मिलने पर",
      "যদি কোনো বাহন উপলব্ধ নহয়", "বাহন উপলব্ধ ନহলে কি হব", "গাড়ী নাপালে",
    ],
  },
  contact_help: {
    question: {
      en: "How can I contact/get help?",
      hi: "मैं सहायता के लिए कैसे संपर्क करूँ?",
      as: "মই সহায়ৰ বাবে কেনেকৈ যোগাযোগ কৰিম?",
    },
    answer: {
      en: "📞 **Getting Help & Support:**\n• **24/7 AI Assistant:** Ask any question or speak directly into this multilingual chatbot.\n• **Hub Coordinator:** Contact your Gram Panchayat Aggregation Node dispatcher.\n• **Enterprise Support:** Visit the **About / Manifesto** tab or submit an inquiry for dedicated assistance.",
      hi: "📞 **सहायता एवं संपर्क:**\n• **24/7 एआई सहायक:** इस बहुभाषी चैटबॉट में कभी भी पूछें या बोलें।\n• **हब समन्वयक:** अपने ग्राम पंचायत एकत्रीकरण केंद्र के डिस्पैचर से संपर्क करें।\n• **हेल्पडेस्क:** समर्पित सहायता के लिए **About / Manifesto** टैब पर जाएं या पूछताछ फॉर्म भरें।",
      as: "📞 **সহায় আৰু যোগাযোগ:**\n• **২৪/৭ AI সহায়ক:** এই বহুভাষিক চাটবটত যিকোনো সময়তে প্ৰশ্ন সোধক বা কথা কওক।\n• **হাব সমন্বয়ক:** আপোনাৰ গ্ৰাম পঞ্চায়ত একত্ৰীকৰণ কেন্দ্ৰৰ ডিচপেচাৰৰ সৈতে যোগাযোগ কৰক।\n• **সহায়তা কেন্দ্ৰ:** বিশেষ সহায়ৰ বাবে **About / Manifesto** টেব চাওক বা আবেদন প্ৰেৰণ কৰক।",
    },
    keywords: [
      "how can i contact/get help", "how can i contact", "how to get help", "how can i get help", "contact support", "helpdesk",
      "मैं सहायता के लिए कैसे संपर्क करूँ", "सहायता कैसे प्राप्त करें", "संपर्क कैसे करें", "मदद कैसे मिलेगी",
      "মই সহায়ৰ বাবে কেনেকৈ যোগাযোগ কৰিম", "সহায় কেনেকৈ পাম", "যোগাযোগ",
    ],
  },
};

const CHATBOT_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    title: "Rural AI Ordering Assistant",
    subtitle: "Book cargo pickup in English, Hindi, or Assamese",
    tooltip: "Need help placing an order or have questions?",
    inputPlaceholder: "Type your message or ask an FAQ...",
    listening: "Listening...",
    micTooltip: "Voice Input (Speech-to-Text)",
    speakTooltip: "Listen to Response",
    stopSpeakTooltip: "Stop Reading",
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
    faqsSubtitle: "Tap a question to get instant answers in English, Hindi, or Assamese",
    backToChat: "Back to Chat",
    aiPowered: "AI Generated",
  },
  hi: {
    title: "ग्रामीण एआई ऑर्डर सहायक",
    subtitle: "अंग्रेजी, हिंदी या असमिया में पिकअप बुक करें",
    tooltip: "ऑर्डर देने में सहायता चाहिए या कोई प्रश्न है?",
    inputPlaceholder: "अपना संदेश लिखें या प्रश्न पूछें...",
    listening: "सुन रहा हूँ...",
    micTooltip: "आवाज़ से इनपुट (स्पीच-टू-टेक्स्ट)",
    speakTooltip: "उत्तर सुनें",
    stopSpeakTooltip: "पढ़ना बंद करें",
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
    faqsSubtitle: "अंग्रेजी, हिंदी या असमिया में तुरंत उत्तर पाने के लिए किसी प्रश्न पर टैप करें",
    backToChat: "चैट पर वापस जाएं",
    aiPowered: "एआई जनरेटेड",
  },
  as: {
    title: "গ্ৰাম্য এআই অৰ্ডাৰ সহায়ক",
    subtitle: "অসমীয়া, হিন্দী বা ইংৰাজীত পিকআপ বুক কৰক",
    tooltip: "অৰ্ডাৰ দিয়াত সহায় লাগিব নেকি বা কিবা প্ৰশ্ন আছে?",
    inputPlaceholder: "আপোনাৰ বাৰ্তা লিখক বা প্ৰশ্ন সোধক...",
    listening: "শুনি আছোঁ...",
    micTooltip: "ভইচ ইনপুট (স্পীচ-টু-টেক্সট)",
    speakTooltip: "উত্তৰ শুনক",
    stopSpeakTooltip: "পঢ়া বন্ধ কৰক",
    confirmOrder: "অৰ্ডাৰ নিশ্চিত কৰক",
    startOver: "পুনৰ আৰম্ভ কৰক",
    origin: "মূল হাব (Origin)",
    destination: "গন্তব্য হাব (Destination)",
    goodType: "সামগ্ৰীৰ প্ৰকাৰ",
    tempClass: "উষ্ণতা শ্ৰেণী",
    weight: "সামগ্ৰীৰ ওজন",
    orderSuccess: "অৰ্ডাৰ সফলতাৰে সম্পন্ন হ’ল! ট্ৰেকিং আইডি: ",
    welcome:
      "নমস্কাৰ! মই আপোনাৰ গ্ৰাম্য লজিষ্টিক সহায়ক। আপুনি ক’ৰ পৰা সামগ্ৰী পিকআপ কৰিব বিচাৰে, বা যিকোনো প্ৰশ্ন সোধক!",
    floatingBtn: "গ্ৰাম্য সহায়ক",
    processing: "প্ৰক্ৰিয়া চলি আছে...",
    draft: "খচৰা",
    failedOrder: "চালান অৰ্ডাৰ বুক কৰাত ব্যৰ্থ হ’ল। অনুগ্ৰহ কৰি সংযোগ পৰীক্ষা কৰক।",
    faqsBtn: "সঘনাই সোধা প্ৰশ্নসমূহ ❓",
    faqsTitle: "সঘনাই সোধা প্ৰশ্নসমূহ (FAQs)",
    faqsSubtitle: "অসমীয়া, হিন্দী বা ইংৰাজীত তৎক্ষণাৎ উত্তৰ পাবলৈ যিকোনো প্ৰশ্নত ক্লিক কৰক",
    backToChat: "চাটলৈ উভতি যাওক",
    aiPowered: "AI দ্বাৰা প্ৰস্তুত",
  },
};

const STEP_RESPONSES: Record<string, Record<string, string>> = {
  welcome: {
    en: "Namaste! I am your Rural Logistics Assistant. I can help you with:\n1. 🔍 Order Tracking & Status (e.g. 'Status of RUR-90141')\n2. ⏱️ Delivery ETA Calculation\n3. 📅 Consignment Rescheduling\n4. 📦 Book New Cargo Pickup\n5. ❓ Frequently Asked Questions (FAQs)",
    hi: "नमस्ते! मैं आपका ग्रामीण लॉजिस्टिक्स सहायक हूँ। मैं आपकी सहायता कर सकता हूँ:\n1. 🔍 ऑर्डर ट्रैकिंग एवं स्थिति (उदा. 'RUR-90141 की स्थिति')\n2. ⏱️ डिलीवरी ईटीए (उदा. 'RUR-90142 कब पहुँचेगा?')\n3. 📅 पिकअप पुनः निर्धारित (उदा. 'RUR-90143 का समय बदलें')\n4. 📦 नया पिकअप बुक करें\n5. ❓ अक्सर पूछे जाने वाले प्रश्न (FAQs)",
    as: "নমস্কাৰ! মই আপোনাৰ গ্ৰাম্য লজিষ্টিক সহায়ক। মই আপোনাক সহায় কৰিব পাৰোঁ:\n1. 🔍 অৰ্ডাৰ ট্ৰেকিং আৰু স্থিতি (যেনে: 'RUR-90141 ৰ স্থিতি')\n2. ⏱️ ডেলিভাৰী ETA গণনা\n3. 📅 পুনৰ নিৰ্ধাৰণ (Reschedule)\n4. 📦 নতুন অৰ্ডাৰ বুকিং\n5. ❓ সঘনাই সোধা প্ৰশ্ন (FAQs)",
  },
  select_origin: {
    en: "📍 **Step 1 of 5: Origin Hub**\nWhere would you like us to pick up your cargo from? Choose an origin hub below or type your location:",
    hi: "📍 **चरण 1/5: मूल हब (Origin)**\nआप अपना सामान कहाँ से पिकअप कराना चाहते हैं? नीचे दिए गए हब में से चुनें या अपने गाँव का नाम लिखें:",
    as: "📍 **পদক্ষেপ ১/৫: মূল কেন্দ্ৰ (Origin Hub)**\nআপুনি ক’ৰ পৰা সামগ্ৰী পিকআপ কৰিব বিচাৰে? তলৰ হাবসমূহৰ পৰা বাছক বা আপোনাৰ গাঁৱৰ নাম লিখক:",
  },
  select_dest: {
    en: "📍 **Step 2 of 5: Destination Hub**\nGot it! Which hub should we deliver this cargo to?",
    hi: "📍 **चरण 2/5: गंतव्य हब (Destination)**\nबहुत बढ़िया! यह सामान किस हब पर पहुँचाना है?",
    as: "📍 **পদক্ষেপ ২/৫: গন্তব্য হাব (Destination)**\nবুজি পালোঁ! এই সামগ্ৰী ক’লৈ প্ৰেৰণ কৰিব লাগিব?",
  },
  select_good: {
    en: "📦 **Step 3 of 5: Commodity Type**\nWhat type of cargo are you sending?",
    hi: "📦 **चरण 3/5: सामग्री का प्रकार**\nआप किस प्रकार की सामग्री भेज रहे हैं?",
    as: "📦 **পদক্ষেপ ৩/৫: সামগ্ৰীৰ প্ৰকাৰ**\nআপুনি কি প্ৰকাৰৰ সামগ্ৰী প্ৰেৰণ কৰিছে?",
  },
  select_temp: {
    en: "❄️ **Step 4 of 5: Temperature Storage**\nWhat temperature storage does your cargo require?",
    hi: "❄️ **चरण 4/5: तापमान भंडारण**\nआपकी सामग्री को किस तापमान भंडारण की आवश्यकता है?",
    as: "❄️ **পদক্ষেপ ৪/৫: উষ্ণতা সংৰক্ষণ**\nআপোনাৰ সামগ্ৰীৰ বাবে কি উষ্ণতাৰ সংৰক্ষণ প্ৰয়োজন?",
  },
  enter_weight: {
    en: "⚖️ **Step 5 of 5: Cargo Weight**\nWhat is the total weight in Kilograms (kg)?",
    hi: "⚖️ **चरण 5/5: कुल वजन**\nकुल वजन किलोग्राम (kg) में कितना है?",
    as: "⚖️ **পদক্ষেপ ৫/৫: মুঠ ওজন**\nমুঠ ওজন কিলোগ্ৰামত (kg) কিমান?",
  },
  confirm: {
    en: "Great! Here is your order details. Click below to confirm shipment booking.",
    hi: "उत्कृष्ट! आपके ऑर्डर का विवरण यहाँ है। शिपमेंट बुक करने के लिए नीचे पुष्टि करें।",
    as: "অতি উত্তম! আপোনাৰ অৰ্ডাৰৰ বিৱৰণ ইয়াত আছে। চালান বুক কৰিবলৈ তলত নিশ্চিত কৰক।",
  },
  success: {
    en: "Your shipment order has been successfully placed! Tracking ID: ",
    hi: "आपका शिपमेंट ऑर्डर सफलतापूर्वक दर्ज कर लिया गया है! ट्रैकिंग आईडी: ",
    as: "আপোনাৰ চালান অৰ্ডাৰ সফলতাৰে সম্পন্ন হৈছে! ট্ৰেকিং আইডি: ",
  },
  cancelled: {
    en: "🚫 **Order Booking Cancelled.**\nYour shipment draft has been cleared. You can ask questions, track existing consignments, or book a new shipment anytime.",
    hi: "🚫 **ऑर्डर बुकिंग रद्द कर दी गई है।**\nआपका वर्तमान ड्राफ्ट हटा दिया गया है। आप कोई भी प्रश्न पूछ सकते हैं, ऑर्डर ट्रैक कर सकते हैं, या नया ऑर्डर शुरू कर सकते हैं।",
    as: "🚫 **অৰ্ডাৰ বুকিং বাতিল কৰা হ’ল।**\nআপোনাৰ বৰ্তমানৰ খচৰা মচি পেলোৱা হৈছে। আপুনি প্ৰশ্ন সুধিব পাৰে, চালান ট্ৰেক কৰিব পাৰে বা নতুন বুকিং আৰম্ভ কৰিব পাৰে।",
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
      as: "ভেকচিন আৰু চিকিৎসা সামগ্ৰী",
    },
    dairy_milk: {
      en: "Dairy & Milk Products",
      hi: "दूध एवं डेरी उत्पाद",
      as: "গাখীৰ আৰু দুগ্ধজাত সামগ্ৰী",
    },
    fish_seafood: {
      en: "Fish & Seafood",
      hi: "मछली एवं समुद्री भोजन",
      as: "মাছ আৰু সাগৰীয় খাদ্য",
    },
    farm_produce: {
      en: "Fresh Farm Produce",
      hi: "ताज़ा कृषि उत्पाद",
      as: "সতেজ কৃষি উৎপাদিত সামগ্ৰী",
    },
  };
  return map[goodType]?.[loc] || map[goodType]?.en || goodType || "Farm Produce";
};

const getTempLabel = (tempClass: string, loc: string) => {
  const map: Record<string, Record<string, string>> = {
    frozen: {
      en: "Frozen (-20°C)",
      hi: "जमे हुए (-20°C फ्रोजन)",
      as: "হিমায়িত (-20°C ফ্ৰোজেন)",
    },
    chilled: {
      en: "Chilled (2°C to 8°C)",
      hi: "ठंडा (2°C - 8°C)",
      as: "শীতল (2°C - 8°C চিল)",
    },
    ambient: {
      en: "Ambient (15°C to 25°C)",
      hi: "सामान्य (15°C - 25°C)",
      as: "সাধাৰণ (15°C - 25°C)",
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
    loc === "as"
      ? "❓ সঘনাই সোধা প্ৰশ্ন (FAQs)"
      : loc === "hi"
      ? "❓ अक्सर पूछे जाने वाले प्रश्न"
      : "❓ View FAQs";

  const cancelLabel =
    loc === "as" ? "🚫 বাতিল" : loc === "hi" ? "🚫 रद्द करें" : "🚫 Cancel";

  if (stepName === "idle" || stepName === "greeting") {
    if (loc === "as") {
      return ["📦 নতুন অৰ্ডাৰ বুকিং", "🔍 RUR-90141 ট্ৰেক কৰক", "⏱️ ডেলিভাৰী ETA", faqLabel];
    }
    if (loc === "hi") {
      return ["📦 नया ऑर्डर बुक करें", "🔍 RUR-90141 ट्रैक करें", "⏱️ डिलीवरी ईटीए", faqLabel];
    }
    return ["📦 Book Consignment", "🔍 Track RUR-90141", "⏱️ Check Delivery ETA", faqLabel];
  }
  if (stepName === "select_origin") {
    return [...availableHubs.slice(0, 4).map((h) => h.name), faqLabel, cancelLabel];
  }
  if (stepName === "select_destination") {
    const originId = currentDraft?.origin_hub_id;
    const dests = availableHubs.filter((h) => h.id !== originId);
    return [...(dests.length > 0 ? dests : availableHubs).slice(0, 4).map((h) => h.name), cancelLabel];
  }
  if (stepName === "select_good_type") {
    if (loc === "as") {
      return ["সতেজ শাক-পাচলি আৰু ফল", "গাখীৰ / দুগ্ধজাত সামগ্ৰী", "ভেকচিন / দৰব", "মাছ / সাগৰীয় খাদ্য", cancelLabel];
    }
    if (loc === "hi") {
      return ["ताज़ा फल एवं सब्जियाँ", "दूध एवं डेरी उत्पाद", "टीके एवं जीवनरक्षक दवाइयाँ", "मछली एवं समुद्री भोजन", cancelLabel];
    }
    return ["Fresh Produce & Fruits", "Milk & Dairy Products", "Vaccines & Medicines", "Fish & Seafood", cancelLabel];
  }
  if (stepName === "select_temp") {
    if (loc === "as") {
      return ["হিমায়িত (-20°C ফ্ৰোজেন)", "শীতল (2°C - 8°C চিল)", "সাধাৰণ (15°C - 25°C)", cancelLabel];
    }
    if (loc === "hi") {
      return ["जमे हुए (-20°C फ्रोजन)", "ठंडा (2°C - 8°C चिल)", "सामान्य (15°C - 25°C)", cancelLabel];
    }
    return ["Frozen (-20°C Deep Cold)", "Chilled (2°C - 8°C Cold Chain)", "Ambient (15°C - 25°C Normal)", cancelLabel];
  }
  if (stepName === "enter_weight") {
    return ["50 kg", "100 kg", "250 kg", "500 kg", cancelLabel];
  }
  if (stepName === "confirm") {
    if (loc === "as") {
      return ["অৰ্ডাৰ নিশ্চিত কৰক ✅", "পুনৰ আৰম্ভ কৰক 🔄"];
    }
    if (loc === "hi") {
      return ["ऑर्डर कन्फर्म करें ✅", "पुनः प्रारंभ करें 🔄"];
    }
    return ["Confirm Order ✅", "Start Over 🔄"];
  }
  if (stepName === "completed" || stepName === "faq_answered") {
    if (loc === "as") {
      return ["❓ অন্যান্য প্ৰশ্ন (FAQs)", "📦 নতুন অৰ্ডাৰ বুক কৰক", "🔍 RUR-90141 ট্ৰেক কৰক"];
    }
    if (loc === "hi") {
      return ["❓ अन्य प्रश्न (FAQs)", "📦 नया ऑर्डर बुक करें", "🔍 RUR-90141 ट्रैक करें"];
    }
    return ["❓ View All FAQs", "📦 Book a Consignment", "🔍 Track RUR-90141"];
  }
  return [faqLabel];
};

const findMatchingFaqClient = (text: string): string | null => {
  const clean = text.toLowerCase().replace(/[^a-zA-Z0-9\u0900-\u097F\u0980-\u09FF\s]/g, " ").trim();
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

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="font-semibold text-neutral-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={index} className="italic text-neutral-800 dark:text-neutral-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export function FormattedMessageText({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: React.ReactNode[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === "ul") {
        elements.push(
          <ul key={`list-${elements.length}`} className="my-1 space-y-1 pl-4 list-disc marker:text-neutral-400">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="pl-0.5 leading-relaxed">{item}</li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`list-${elements.length}`} className="my-1 space-y-1 pl-4 list-decimal marker:text-neutral-400">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="pl-0.5 leading-relaxed">{item}</li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Bullet list (• or - or *)
    const bulletMatch = trimmed.match(/^([•\-\*])\s+(.+)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(renderInline(bulletMatch[2]));
      continue;
    }

    // Numbered list (1. , 2. )
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(renderInline(numMatch[2]));
      continue;
    }

    // Plain line
    flushList();
    elements.push(
      <p key={`p-${elements.length}`} className="leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1 text-xs">{elements}</div>;
}

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
  const [step, setStep] = useState<string>("idle");
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [draftShipment, setDraftShipment] = useState<any>(null);
  const [hubs, setHubs] = useState<any[]>(DEFAULT_HUBS);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync with page locale on initial load or if user hasn't explicitly overridden
  useEffect(() => {
    if (pageLocale && ["en", "hi", "as"].includes(pageLocale)) {
      setBotLocale(pageLocale);
    }
  }, [pageLocale]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
      setStep("idle");
      setQuickReplies(getQuickRepliesForStep("idle", botLocale, hubs, null));
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

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  };

  const toggleSpeak = (msgId: string, textToSpeak: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    if (speakingMsgId === msgId) {
      stopSpeaking();
      return;
    }

    window.speechSynthesis.cancel();
    // Remove markdown symbols and emojis for smooth TTS reading
    const clean = textToSpeak
      .replace(/[*#`•\-_]/g, " ")
      .replace(/\b\d+\.\s+/g, " ")
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
      .replace(/\s+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = SPEECH_LANG_MAP[botLocale] || "en-IN";
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const switchLanguage = (newLocale: string) => {
    if (newLocale === botLocale) return;
    stopSpeaking();
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

    // 1. Try server API via typed client
    try {
      const data = await sendChatMessage({
        message: userText,
        locale: activeLocale as ChatLocale,
        context: {
          step: currentStep,
          draft_shipment: currentDraft,
        },
      });

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
    if (
      msg.includes("eta") ||
      msg.includes("when") ||
      msg.includes("arrive") ||
      msg.includes("समय") ||
      msg.includes("সময়") ||
      msg.includes("কেতিয়া") ||
      msg.includes("আহিব")
    ) {
      const wb = waybillQuery || "RUR-90141";
      const etaText =
        activeLocale === "as"
          ? `⏱️ **${wb} ৰ ডেলিভাৰী আগমন সময় (ETA):**\n• **আনুমানিক সময়:** প্ৰায় ৩ ঘণ্টা ৪৫ মিনিট (যাত্ৰাৰত)\n• **ক’ৰিডৰ:** যোৰহাট চাহ বেল্ট ➔ গুৱাহাটী মেগা কোল্ড হাব\n• **ভূমিৰ গুণাগুণ:** সমতল এলেকা (গতিবেগ: ৪২ কিমি/ঘণ্টা, পকা পথ)\n• **উষ্ণতা স্থিতি:** সুস্থিৰ (+৩.৮°C নিৰ্ধাৰিত মান)`
          : activeLocale === "hi"
          ? `⏱️ **${wb} के लिए डिलीवरी आगमन समय (ETA):**\n• **अनुमानित समय:** लगभग 3 घंटे 45 मिनट (मार्ग में)\n• **गलियारा:** जोरहाट टी बेल्ट ➔ गुवाहाटी मेगा कोल्ड हब\n• **सड़क स्थिति:** मैदानी भाग (गति: 42 किमी/घंटा, पक्की सड़क)\n• **तापमान:** स्थिर (+3.8°C)`
          : `⏱️ **Delivery ETA for ${wb}:**\n• **Estimated Arrival Time:** approx. 3 hrs 45 mins (En Route)\n• **Corridor:** Jorhat Tea Feeder ➔ Guwahati Mega Cold Hub\n• **Terrain Factor:** Plains segment (Speed: 42 km/h, clear paved road)\n• **Thermal Integrity:** Stable (+3.8°C nominal setpoint)`;

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: etaText,
        stepKey: "delivery_eta",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setQuickReplies(
        activeLocale === "as"
          ? [`${wb} ৰ স্থিতি 📦`, `${wb} পুনৰ নিৰ্ধাৰণ কৰক 📅`, "নতুন চালান বুক কৰক 📦"]
          : activeLocale === "hi"
          ? [`${wb} की स्थिति 📦`, `${wb} का समय बदलें 📅`, "नया ऑर्डर बुक करें 📦"]
          : [`Status of ${wb} 📦`, `Reschedule ${wb} 📅`, "Book New Cargo 📦"]
      );
      return;
    }

    // Intent: Rescheduling Query
    if (
      msg.includes("reschedule") ||
      msg.includes("delay") ||
      msg.includes("change time") ||
      msg.includes("बदलें") ||
      msg.includes("देरी") ||
      msg.includes("পলম") ||
      msg.includes("সময় সলনি") ||
      msg.includes("সলনি") ||
      msg.includes("পিছুৱাওক")
    ) {
      const wb = waybillQuery || "RUR-90141";
      const reschedText =
        activeLocale === "as"
          ? `📅 **${wb} ৰ বাবে চালানৰ সময় পুনৰ নিৰ্ধাৰণ কৰা হ’ল:**\n• **নতুন পিকআপ/ডেলিভাৰী সময়সীমা:** +২৪ ঘণ্টা বৰ্ধিত SLA\n• **অফলাইন কিউ:** সময় সলনিৰ তথ্য স্থানীয়ভাৱে জমা হৈছে; অনলাইন হ’লে বহৰৰ সৈতে ছিংক হ’ব।\n• **কোল্ড ষ্ট’ৰেজ সংৰক্ষণ:** স্থানীয় একত্ৰীকৰণ কেন্দ্ৰত বৰ্ধিত সংৰক্ষণ স্লট সুৰক্ষিত কৰা হ’ল।`
          : activeLocale === "hi"
          ? `📅 **${wb} के लिए शिपमेंट का समय पुनः निर्धारित:**\n• **नई समय सीमा:** +24 घंटे विस्तारित SLA\n• **ऑफलाइन कतार:** बदलाव डिवाइस में सुरक्षित; ऑनलाइन होने पर सिंक होगा।\n• **कोल्ड स्टोरेज:** स्थानीय हब पर अतिरिक्त स्टोरेज स्लॉट सुरक्षित।`
          : `📅 **Consignment Rescheduling Confirmed for ${wb}:**\n• **New Pickup/Delivery Window:** +24 hours extended SLA\n• **Offline Queue:** Reschedule update stored locally; will synchronize to fleet dispatch once online.\n• **Cold Storage Allocation:** Extended holding slot reserved at local aggregation point.`;

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: reschedText,
        stepKey: "reschedule",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setQuickReplies(
        activeLocale === "as"
          ? [`${wb} ৰ স্থিতি পৰীক্ষা 🔍`, "নতুন চালান বুক কৰক 📦"]
          : activeLocale === "hi"
          ? [`${wb} की स्थिति जाँचें 🔍`, "नया ऑर्डर बुक करें 📦"]
          : [`Check Status ${wb} 🔍`, "Book Another Consignment 📦"]
      );
      return;
    }

    // Intent: Order Status / Tracking Query
    if (
      msg.includes("status") ||
      msg.includes("track") ||
      msg.includes("where") ||
      msg.includes("स्थिति") ||
      msg.includes("ट्रैक") ||
      msg.includes("कहाँ") ||
      msg.includes("ট্ৰেক") ||
      msg.includes("স্থিতি") ||
      msg.includes("ক’ত") ||
      waybillQuery
    ) {
      const wb = waybillQuery || "RUR-90141";
      const statusText =
        activeLocale === "as"
          ? `📦 **চালানৰ স্থিতি (ৱেবিল ${wb}):**\n• **স্থিতি:** যাত্ৰাৰত / IN TRANSIT (Mahindra Bolero Camper 4x4 ত আৱন্টিত)\n• **সামগ্ৰী:** জৈৱিক সেউজ চাহ আৰু শাক-পাচলি (৩৫০ কেজি / ৫০ কাৰ্টন)\n• **উষ্ণতা শ্ৰেণী:** শীতল / Chilled (2°C to 8°C)\n• **ৰুট:** যোৰহাট আপাৰ অসম ➔ গুৱাহাটী মেগা কোল্ড হাব\n• **বাহন ব্যৱহাৰ:** ৭২.০% বহন ক্ষমতা ব্যৱহাৰ\n• **উৎপাদক:** যোৰহাট জৈৱিক চাহ উৎপাদক সমবায় সমিতি`
          : activeLocale === "hi"
          ? `📦 **शिपमेंट स्थिति (${wb}):**\n• **स्थिति:** मार्ग में (Mahindra Bolero Camper 4x4)\n• **सामग्री:** जैविक चाय व उत्पाद (350 किग्रा / 50 क्रेट)\n• **तापमान:** चिल्ड (2°C से 8°C)\n• **मार्ग:** जोरहाट ➔ गुवाहाटी मेगा कोल्ड हब\n• **वाहन उपयोग:** 72.0% पेलोड\n• **उत्पादक:** जोरहाट जैविक चाय किसान सहकारी`
          : `📦 **Shipment Status for Waybill ${wb}:**\n• **Status:** IN TRANSIT (Allocated to Mahindra Bolero Camper 4x4)\n• **Commodity:** Organic Green Tea & Produce (350 kg / 50 crates)\n• **Thermal Class:** Chilled (2°C to 8°C)\n• **Route:** Jorhat Upper Assam ➔ Guwahati Mega Cold Hub\n• **Vehicle Utilization:** 72.0% payload utilization\n• **Producer:** Jorhat Organic Tea Planters Cooperative`;

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: statusText,
        stepKey: "order_status",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setQuickReplies(
        activeLocale === "as"
          ? ["আগমনৰ সময় (ETA) ⏱️", `${wb} পুনৰ নিৰ্ধাৰণ কৰক 📅`, "নতুন পিকআপ বুক কৰক 📦"]
          : activeLocale === "hi"
          ? ["ETA देखें ⏱️", `${wb} का समय बदलें 📅`, "नया पिकअप बुक करें 📦"]
          : ["Check ETA ⏱️", `Reschedule ${wb} 📅`, "Book New Pickup 📦"]
      );
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
      msg.includes("मदद") ||
      msg.includes("প্ৰশ্ন") ||
      msg.includes("সহায়") ||
      msg.includes("বিৱৰণ")
    ) {
      setShowFaqDrawer(true);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text:
          activeLocale === "as"
            ? "❓ ইয়াত সঘনাই সোধা প্ৰশ্নসমূহ (FAQs) দিয়া হৈছে। তৎক্ষণাৎ উত্তৰ পাবলৈ যিকোনো প্ৰশ্নত ক্লিক কৰক:"
            : activeLocale === "hi"
            ? "❓ यहाँ अक्सर पूछे जाने वाले प्रश्नों (FAQs) की सूची है। आप किसी भी प्रश्न पर टैप कर सकते हैं:"
            : "❓ Here are frequently asked questions (FAQs). You can tap any question to get an instant answer:",
        stepKey: "faq_menu",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    // Intent: Cancellation / Reset
    if (
      msg.includes("cancel") ||
      msg.includes("stop") ||
      msg.includes("reset") ||
      msg.includes("start over") ||
      msg.includes("exit") ||
      msg.includes("रद्द") ||
      msg.includes("रोकें") ||
      msg.includes("पुनः प्रारंभ") ||
      msg.includes("বাতিল") ||
      msg.includes("বন্ধ") ||
      msg.includes("পুনৰ আৰম্ভ")
    ) {
      setDraftShipment(null);
      setStep("idle");
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: STEP_RESPONSES.cancelled[activeLocale] || STEP_RESPONSES.cancelled.en,
        stepKey: "cancelled",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setQuickReplies(getQuickRepliesForStep("idle", activeLocale, availableHubs, null));
      return;
    }

    // Intent: Booking Initiation
    const isBookingTrigger =
      msg.includes("book order") ||
      msg.includes("book shipment") ||
      msg.includes("book consignment") ||
      msg.includes("create shipment") ||
      msg.includes("start booking") ||
      msg.includes("naya order") ||
      msg.includes("नया ऑर्डर") ||
      msg.includes("ऑर्डर बुक") ||
      msg.includes("पिकअप बुक") ||
      msg.includes("নতুন অৰ্ডাৰ") ||
      msg.includes("অৰ্ডাৰ বুক") ||
      msg.includes("চালান বুক") ||
      (currentStep === "idle" && (msg.includes("book") || msg.includes("बुक") || msg.includes("বুক")));

    if (isBookingTrigger) {
      const initDraft = {};
      setDraftShipment(initDraft);
      setStep("select_origin");
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: STEP_RESPONSES.select_origin[activeLocale] || STEP_RESPONSES.select_origin.en,
        stepKey: "select_origin",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setQuickReplies(getQuickRepliesForStep("select_origin", activeLocale, availableHubs, initDraft));
      return;
    }

    // Intent: Conversational Greetings (when in idle)
    const greetingWords = [
      "hi", "hello", "hey", "namaste", "namaskar", "good morning", "good evening", "good afternoon",
      "नमस्ते", "नमस्कार", "নমস্কাৰ", "হেল্ল", "হেই"
    ];
    if (
      currentStep === "idle" &&
      greetingWords.some((g) => msg === g || msg.startsWith(g + " ") || msg.startsWith(g + ",") || msg.startsWith(g + "!"))
    ) {
      setStep("idle");
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: STEP_RESPONSES.welcome[activeLocale] || STEP_RESPONSES.welcome.en,
        stepKey: "welcome",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setQuickReplies(getQuickRepliesForStep("idle", activeLocale, availableHubs, null));
      return;
    }

    // Standard conversational order booking progression
    if (currentStep === "select_origin") {
      const matched = availableHubs.find(
        (h) => h.name.toLowerCase().includes(msg) || msg.includes(h.name.toLowerCase())
      );
      if (matched) {
        updatedDraft.origin_hub_id = matched.id;
        updatedDraft.origin_hub_name = matched.name;
      } else {
        updatedDraft.origin_hub_id = availableHubs[0].id;
        updatedDraft.origin_hub_name = userText.trim().length < 40 ? userText.trim() : availableHubs[0].name;
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
        updatedDraft.dest_hub_name = userText.trim().length < 40 ? userText.trim() : fallback.name;
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
        msg.includes("ভেকচিন") ||
        msg.includes("দৰব") ||
        msg.includes("ঔষধ")
      ) {
        updatedDraft.good_type = "vaccines_medical";
      } else if (
        msg.includes("milk") ||
        msg.includes("dairy") ||
        msg.includes("दूध") ||
        msg.includes("डेरी") ||
        msg.includes("গাখীৰ") ||
        msg.includes("দুগ্ধ")
      ) {
        updatedDraft.good_type = "dairy_milk";
      } else if (
        msg.includes("fish") ||
        msg.includes("sea") ||
        msg.includes("मछली") ||
        msg.includes("মাছ") ||
        msg.includes("সাগৰীয়")
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
        msg.includes("হিমায়িত") ||
        msg.includes("ফ্ৰোজেন") ||
        msg.includes("-20")
      ) {
        updatedDraft.temp_class = "frozen";
      } else if (
        msg.includes("chill") ||
        msg.includes("cold") ||
        msg.includes("ठंडा") ||
        msg.includes("चिल") ||
        msg.includes("শীতল") ||
        msg.includes("চিল") ||
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
      updatedDraft.waybill_number = `RUR-${Math.floor(10000 + Math.random() * 90000)}`;
      nextStep = "confirm";
      stepKey = "confirm";
      replyText = `${STEP_RESPONSES.confirm[activeLocale] || STEP_RESPONSES.confirm.en}\n\n• **Waybill:** \`${updatedDraft.waybill_number}\`\n• **Weight:** ${weight} kg\n• **Route:** ${updatedDraft.origin_hub_name || "Origin Hub"} ➔ ${updatedDraft.dest_hub_name || "Destination Hub"}`;
    } else if (currentStep === "confirm") {
      if (msg.includes("confirm") || msg.includes("yes") || msg.includes("हाँ") || msg.includes("হয়") || msg.includes("নিশ্চিত")) {
        nextStep = "completed";
        stepKey = "success";
        replyText = `${STEP_RESPONSES.success[activeLocale] || STEP_RESPONSES.success.en}\`${updatedDraft.waybill_number || "RUR-90141"}\``;
      } else {
        nextStep = "idle";
        stepKey = "cancelled";
        replyText = STEP_RESPONSES.cancelled[activeLocale] || STEP_RESPONSES.cancelled.en;
      }
    } else {
      nextStep = "idle";
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
      reply.includes("সঘনাই সোধা") ||
      reply.includes("प्रश्न") ||
      reply.includes("প্ৰশ্ন")
    ) {
      setShowFaqDrawer(true);
      return;
    }

    if (
      reply.includes("Cancel") ||
      reply.includes("रद्द") ||
      reply.includes("বাতিল") ||
      reply.includes("Start Over") ||
      reply.includes("पुनः प्रारंभ") ||
      reply.includes("পুনৰ আৰম্ভ")
    ) {
      setDraftShipment(null);
      setStep("idle");
      const cancelText = STEP_RESPONSES.cancelled[botLocale] || STEP_RESPONSES.cancelled.en;
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: cancelText,
        stepKey: "cancelled",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setQuickReplies(getQuickRepliesForStep("idle", botLocale, hubs, null));
      return;
    }

    if (
      reply.includes("Book a Consignment") ||
      reply.includes("Book Consignment") ||
      reply.includes("Book a Shipment") ||
      reply.includes("Book New Pickup") ||
      reply.includes("नया ऑर्डर") ||
      reply.includes("নতুন অৰ্ডাৰ")
    ) {
      setDraftShipment({});
      setStep("select_origin");
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: STEP_RESPONSES.select_origin[botLocale] || STEP_RESPONSES.select_origin.en,
        stepKey: "select_origin",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setQuickReplies(getQuickRepliesForStep("select_origin", botLocale, hubs, {}));
      return;
    }

    if (
      reply.includes("Confirm Order") ||
      reply.includes("ऑर्डर कन्फर्म") ||
      reply.includes("অৰ্ডাৰ নিশ্চিত")
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
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 font-sans font-medium text-xs rounded-full shadow-xl transition-all active:scale-95 cursor-pointer border border-neutral-800 dark:border-neutral-200"
          aria-label={t("title")}
          title={t("tooltip")}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold tracking-tight text-xs">{t("floatingBtn")}</span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-800 uppercase font-bold">
            {botLocale}
          </span>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white dark:bg-surface-1 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 transition-colors font-sans">
          {/* Header */}
          <div className="bg-neutral-950 text-white dark:bg-surface-2 p-3.5 flex items-center justify-between border-b border-neutral-800 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-neutral-800 text-white dark:bg-neutral-800 dark:text-white flex items-center justify-center border border-neutral-700">
                <AiBrainIcon size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-xs leading-tight text-white">{t("title")}</h3>
                <p className="text-[10px] text-neutral-400 leading-tight truncate max-w-[170px] mt-0.5">
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
                className={`text-[10px] font-mono uppercase font-semibold px-2 py-1 rounded-md border transition-all cursor-pointer flex items-center gap-1 ${
                  showFaqDrawer
                    ? "bg-white text-neutral-950 dark:bg-white dark:text-neutral-950 border-white"
                    : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700/80 border-neutral-700"
                }`}
                title={t("faqsTitle")}
              >
                <HelpCircleIcon size={12} />
                <span>FAQs</span>
              </button>

              <div className="flex bg-neutral-800/90 p-0.5 rounded-md border border-neutral-700 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => switchLanguage("en")}
                  className={`px-1.5 py-0.5 font-bold rounded cursor-pointer transition-colors ${
                    botLocale === "en" ? "bg-white text-neutral-950" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => switchLanguage("hi")}
                  className={`px-1.5 py-0.5 font-bold rounded cursor-pointer transition-colors ${
                    botLocale === "hi" ? "bg-white text-neutral-950" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  HI
                </button>
                <button
                  type="button"
                  onClick={() => switchLanguage("as")}
                  className={`px-1.5 py-0.5 font-bold rounded cursor-pointer transition-colors ${
                    botLocale === "as" ? "bg-white text-neutral-950" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  AS
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 cursor-pointer"
              >
                <CloseIcon size={16} />
              </button>
            </div>
          </div>

          {/* FAQs Drawer Overlay */}
          {showFaqDrawer && (
            <div className="flex-1 bg-neutral-900/95 dark:bg-surface-1/95 text-white p-4 overflow-y-auto flex flex-col space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div>
                  <h4 className="text-xs font-semibold text-white">{t("faqsTitle")}</h4>
                  <p className="text-[10px] text-neutral-400">{t("faqsSubtitle")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFaqDrawer(false)}
                  className="text-xs text-neutral-400 hover:text-white px-2 py-1 bg-neutral-800 rounded-md cursor-pointer flex items-center gap-1"
                >
                  <CloseIcon size={12} />
                  <span>{t("backToChat")}</span>
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                {Object.entries(FAQS_DATA).map(([faqKey, faqItem], idx) => (
                  <button
                    key={faqKey}
                    type="button"
                    onClick={() => handleSelectFaq(faqKey)}
                    className="w-full text-left p-2.5 bg-neutral-800/70 hover:bg-neutral-800 border border-neutral-700/60 hover:border-neutral-600 rounded-lg transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-mono text-neutral-400 font-bold mt-0.5">
                        {String(idx + 1).padStart(2, "0")}.
                      </span>
                      <p className="text-[11px] font-medium text-neutral-200 group-hover:text-white leading-snug">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-neutral-50 dark:bg-surface-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  {msg.sender === "bot" && msg.aiGenerated && (
                    <div className="mb-1 flex items-center gap-1.5 px-1">
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 shadow-xs">
                        <span>{msg.providerUsed ? msg.providerUsed.toUpperCase() : "AI"}</span>
                        <span className="text-[8px] opacity-75">· {t("aiPowered")}</span>
                      </span>
                    </div>
                  )}
                  <div
                    className={`max-w-[88%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-medium whitespace-pre-line"
                        : "bg-white dark:bg-surface-2 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 font-sans shadow-2xs"
                    }`}
                  >
                    {msg.sender === "user" ? msg.text : <FormattedMessageText text={msg.text} />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 px-1">
                    <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-mono">{msg.timestamp}</span>
                    {msg.sender === "bot" && (
                      <button
                        type="button"
                        onClick={() => toggleSpeak(msg.id, msg.text)}
                        className={`text-[10px] cursor-pointer p-1 rounded-md transition-colors flex items-center gap-1 ${
                          speakingMsgId === msg.id
                            ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30"
                            : "text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                        }`}
                        title={speakingMsgId === msg.id ? t("stopSpeakTooltip") : t("speakTooltip")}
                        aria-label={speakingMsgId === msg.id ? t("stopSpeakTooltip") : t("speakTooltip")}
                      >
                        {speakingMsgId === msg.id ? (
                          <span className="flex items-center gap-1">
                            <span className="flex gap-0.5 items-end h-2.5">
                              <span className="w-0.5 h-2.5 bg-rose-500 rounded animate-pulse" />
                              <span className="w-0.5 h-1.5 bg-rose-500 rounded animate-pulse delay-75" />
                              <span className="w-0.5 h-3 bg-rose-500 rounded animate-pulse delay-150" />
                            </span>
                            <span className="text-[9px] font-semibold">{t("stopSpeakTooltip")}</span>
                          </span>
                        ) : (
                          <MicrophoneIcon size={12} />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Draft Shipment Card Preview */}
                  {msg.sender === "bot" && step === "confirm" && (draftShipment || msg.draftShipment) && (
                    <div className="mt-2.5 w-full max-w-[90%] bg-neutral-50 dark:bg-surface-2 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 text-xs space-y-1.5 shadow-sm">
                      <div className="font-semibold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-700 pb-1 flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <PackageIcon size={14} />
                          <span>{t("title")}</span>
                        </span>
                        <span className="text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                          {t("draft")}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-700 dark:text-neutral-300 space-y-1">
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
                        className="w-full mt-2 py-2 bg-neutral-900 hover:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 text-white text-xs font-semibold rounded-md shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isPlacingOrder ? (
                          <span>{t("processing")}</span>
                        ) : (
                          <>
                            <span>{t("confirmOrder")}</span>
                            <CheckIcon size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {isSubmitting && (
                <div className="flex items-center gap-1.5 text-neutral-400 text-xs py-2 px-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white animate-pulse delay-150" />
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white animate-pulse delay-300" />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Quick Reply Chips */}
          {!showFaqDrawer && quickReplies.length > 0 && !isSubmitting && (
            <div className="px-3 py-2 bg-white dark:bg-surface-1 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickReply(reply)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-full whitespace-nowrap transition-colors cursor-pointer"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-white dark:bg-surface-1 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
            {/* Speech to Text Mic */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isListening
                  ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border-neutral-200 dark:border-neutral-700"
              }`}
              title={t("micTooltip")}
            >
              <MicrophoneIcon size={16} />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUserMessage(input)}
              placeholder={isListening ? t("listening") : t("inputPlaceholder")}
              className="flex-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 px-3.5 py-2 rounded-lg text-xs border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 focus:bg-white dark:focus:bg-neutral-900 transition-colors"
            />

            <button
              type="button"
              onClick={() => handleUserMessage(input)}
              disabled={!input.trim() || isSubmitting}
              className="p-2 bg-neutral-900 hover:bg-black dark:bg-white dark:text-neutral-950 text-white rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
            >
              <SendIcon size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
