"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  SearchIcon,
  CloseIcon,
  RouteIcon,
  TruckIcon,
  CubeIcon,
  AiBrainIcon,
  PulseIcon,
  ShieldCheckIcon,
  ThermometerIcon,
  SlidersIcon,
  AlertCircleIcon,
  ArrowRightIcon,
} from "../icons/Hugeicons";

interface SearchItem {
  id: string;
  category: "all" | "consignment" | "hub" | "section";
  title: Record<string, string>;
  subtitle: Record<string, string>;
  targetHref: string;
  badge?: Record<string, string>;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const SEARCH_DATABASE_I18N: SearchItem[] = [
  // SECTIONS
  {
    id: "s-overview",
    category: "section",
    title: {
      en: "00 // Hero Portal & Dynamic Vector",
      hi: "00 // अवलोकन एवं डायनामिक वेक्टर",
      or: "00 // ସମୀକ୍ଷା ଓ ଡାଇନାମିକ୍ ଭେକ୍ଟର",
    },
    subtitle: {
      en: "Live rural corridor telemetry & fairness estimator",
      hi: "लाइव ग्रामीण कॉरिडोर टेलीमेट्री एवं निष्पक्षता अनुमानक",
      or: "ଲାଇଭ୍ ଗ୍ରାମୀଣ କରିଡର ତଥ୍ୟ ଓ ନିରପେକ୍ଷତା ଆକଳନ",
    },
    targetHref: "/#overview",
    badge: { en: "PORTAL", hi: "पोर्टल", or: "ପୋର୍ଟାଲ" },
    icon: PulseIcon,
  },
  {
    id: "s-network",
    category: "section",
    title: {
      en: "01 // Community Topology & Storage",
      hi: "01 // सामुदायिक टोपोलॉजी एवं भंडारण",
      or: "01 // ଗ୍ରାମୀଣ ଟୋପୋଲୋଜି ଓ ଶୀତଳ ଭଣ୍ଡାର",
    },
    subtitle: {
      en: "Bhubaneswar Central, Cuttack, & Village Nodes A-D",
      hi: "भुवनेश्वर सेंट्रल, कटक, एवं ग्राम नोड्स A-D",
      or: "ଭୁବନେଶ୍ୱର ସେଣ୍ଟ୍ରାଲ୍, କଟକ, ଏବଂ ଗ୍ରାମ ନୋଡ୍ A-D",
    },
    targetHref: "/#network",
    badge: { en: "TOPOLOGY", hi: "टोपोलॉजी", or: "ଟୋପୋଲୋଜି" },
    icon: RouteIcon,
  },
  {
    id: "s-shipments",
    category: "section",
    title: {
      en: "02 // Active Pickups & Ingestion",
      hi: "02 // सक्रिय पिकअप एवं प्रविष्टि",
      or: "02 // ସକ୍ରିୟ ପିକଅପ୍ ଓ ବୁକିଂ",
    },
    subtitle: {
      en: "Offline-capable community pickup queue and ledger",
      hi: "ऑफलाइन-सक्षम सामुदायिक पिकअप कतार एवं खाता",
      or: "ଅଫଲାଇନ୍ ସୁରକ୍ଷିତ ଗ୍ରାମୀଣ ପିକଅପ୍ କ୍ୟୁ ଏବଂ ତାଲିକା",
    },
    targetHref: "/#shipments",
    badge: { en: "LEDGER", hi: "खाता", or: "ତାଲିକା" },
    icon: CubeIcon,
  },
  {
    id: "s-dispatch",
    category: "section",
    title: {
      en: "03 // Dynamic Dispatch & Matching",
      hi: "03 // डायनामिक डिस्पैच एवं मैचिंग",
      or: "03 // ଡାଇନାମିକ୍ ପ୍ରେରଣ ଓ ମ୍ୟାଚିଂ",
    },
    subtitle: {
      en: "Fairness-weighted remote vehicle and pickup matcher",
      hi: "निष्पक्षता-भारित वाहन एवं पिकअप मैचर",
      or: "ନିରପେକ୍ଷତା-ଆଧାରିତ ଗାଡ଼ି ଓ ପିକଅପ୍ ମ୍ୟାଚର୍",
    },
    targetHref: "/#dispatch",
    badge: { en: "DISPATCH", hi: "डिस्पैच", or: "ପ୍ରେରଣ" },
    icon: SlidersIcon,
  },
  {
    id: "s-sensors",
    category: "section",
    title: {
      en: "04 // Arrhenius Thermal Kinetics",
      hi: "04 // Arrhenius थर्मल काइनेटिक्स",
      or: "04 // Arrhenius ତାପଜ କାଇନେଟିକ୍ସ",
    },
    subtitle: {
      en: "Perishability decay & solar cold buffer telemetry",
      hi: "खराबी क्षय एवं सौर कोल्ड बफर टेलीमेट्री",
      or: "ସାମଗ୍ରୀ କ୍ଷୟ ଓ ସୌର କୋଲ୍ଡ ବଫର୍ ତଥ୍ୟ",
    },
    targetHref: "/#sensors",
    badge: { en: "KINETICS", hi: "काइनेटिक्स", or: "କାଇନେଟିକ୍ସ" },
    icon: ThermometerIcon,
  },
  {
    id: "s-fairness",
    category: "section",
    title: {
      en: "05 // Provable Fairness Audit",
      hi: "05 // प्रमाणनीय निष्पक्षता ऑडिट",
      or: "05 // ପ୍ରମାଣିତ ନିରପେକ୍ଷତା ଅଡିଟ୍",
    },
    subtitle: {
      en: "Jain's fairness index & community non-deprioritization proof",
      hi: "जैन निष्पक्षता सूचकांक एवं गैर-उपेक्षा गारंटी",
      or: "ଜୈନ୍ ନିରପେକ୍ଷତା ସୂଚକାଙ୍କ ଓ ଅଣ-ଅବହେଳା ପ୍ରମାଣ",
    },
    targetHref: "/#fairness",
    badge: { en: "FAIRNESS", hi: "निष्पक्षता", or: "ନିରପେକ୍ଷତା" },
    icon: ShieldCheckIcon,
  },
  {
    id: "s-alerts",
    category: "section",
    title: {
      en: "06 // Real-Time Terrain Surveillance",
      hi: "06 // रीयल-टाइम इलाका निगरानी",
      or: "06 // ଲାଇଭ୍ ରାସ୍ତା ନିରୀକ୍ଷଣ",
    },
    subtitle: {
      en: "Flood risk, unpaved tracks, and road condition reports",
      hi: "बाढ़ जोखिम, कच्ची सड़कें एवं सड़क स्थिति रिपोर्ट",
      or: "ବନ୍ୟା ବିପଦ, କଞ୍ଚା ରାସ୍ତା ଓ ସଡ଼କ ସ୍ଥିତି ରିପୋର୍ଟ",
    },
    targetHref: "/#alerts",
    badge: { en: "SURVEILLANCE", hi: "निगरानी", or: "ନିରୀକ୍ଷଣ" },
    icon: AlertCircleIcon,
  },
  {
    id: "s-ai",
    category: "section",
    title: {
      en: "AI Intelligence Suite",
      hi: "AI इंटेलिजेंस सूट",
      or: "AI ଇଣ୍ଟେଲିଜେନ୍ସ ସୁଟ୍",
    },
    subtitle: {
      en: "Multi-objective dispatch optimizer & SHAP attribution",
      hi: "मल्टी-ऑब्जेक्टिव डिस्पैच ऑप्टिमाइज़र एवं SHAP कंसोल",
      or: "ମଲ୍ଟି-ଅବଜେକ୍ଟିଭ୍ ପ୍ରେରଣ ଅପ୍ଟିମାଇଜର୍ ଓ SHAP କନସୋଲ୍",
    },
    targetHref: "/ai-intelligence",
    badge: { en: "AI CONSOLE", hi: "AI कंसोल", or: "AI କନସୋଲ୍" },
    icon: AiBrainIcon,
  },
  {
    id: "s-about",
    category: "section",
    title: {
      en: "About CargoMind Manifesto",
      hi: "कार्गोमाइंड घोषणापत्र",
      or: "କାର୍ଗୋମାଇଣ୍ଡ ଘୋଷଣାନାମା",
    },
    subtitle: {
      en: "Remote area logistics platform & architecture blueprint",
      hi: "ग्रामीण क्षेत्र लॉजिस्टिक्स प्लेटफ़ॉर्म एवं आर्किटेक्चर",
      or: "ଗ୍ରାମୀଣ ପରିବହନ ପ୍ଲାଟଫର୍ମ ଓ ସିଷ୍ଟମ୍ ରୂପରେଖ",
    },
    targetHref: "/about",
    badge: { en: "MANIFESTO", hi: "घोषणापत्र", or: "ଘୋଷଣାନାମା" },
    icon: RouteIcon,
  },

  // HUBS & VILLAGES
  {
    id: "h-bbs",
    category: "hub",
    title: {
      en: "Bhubaneswar Central Cold Hub",
      hi: "भुवनेश्वर सेंट्रल कोल्ड हब",
      or: "ଭୁବନେଶ୍ୱର ସେଣ୍ଟ୍ରାଲ୍ କୋଲ୍ଡ ହବ୍",
    },
    subtitle: {
      en: "BBS-HUB // Central Multi-Temp 120T facility (-25°C / +4°C / +2°C)",
      hi: "BBS-HUB // केंद्रीय मल्टी-तापमान 120 टन सुविधा (-25°C / +4°C / +2°C)",
      or: "BBS-HUB // କେନ୍ଦ୍ରୀୟ ମଲ୍ଟି-ତାପମାତ୍ରା ୧୨୦ ଟନ୍ ସୁବିଧା (-25°C / +4°C / +2°C)",
    },
    targetHref: "/#network",
    badge: { en: "HUB", hi: "हब", or: "ହବ୍" },
    icon: RouteIcon,
  },
  {
    id: "h-va",
    category: "hub",
    title: {
      en: "Village A (Pipili Rural Cluster)",
      hi: "ग्राम A (पिपिली ग्रामीण क्लस्टर)",
      or: "ଗ୍ରାମ A (ପିପିଲି ଗ୍ରାମୀଣ କ୍ଲଷ୍ଟର)",
    },
    subtitle: {
      en: "VIL-A // Export floriculture & betel leaves rural aggregation",
      hi: "VIL-A // निर्यात पुष्प कृषि एवं पान के पत्ते ग्रामीण संग्रह",
      or: "VIL-A // ରପ୍ତାନି ଫୁଲ ଚାଷ ଓ ପାନ ପତ୍ର ଗ୍ରାମୀଣ ସଂଗ୍ରହ କେନ୍ଦ୍ର",
    },
    targetHref: "/#network",
    badge: { en: "VILLAGE", hi: "गाँव", or: "ଗ୍ରାମ" },
    icon: RouteIcon,
  },
  {
    id: "h-vb",
    category: "hub",
    title: {
      en: "Village B (Khordha Dairy Cluster)",
      hi: "ग्राम B (खोरधा डेरी क्लस्टर)",
      or: "ଗ୍ରାମ B (ଖୋର୍ଦ୍ଧା ଦୁଗ୍ଧ କ୍ଲଷ୍ଟର)",
    },
    subtitle: {
      en: "VIL-B // Chilled raw milk & dairy tanker aggregation node",
      hi: "VIL-B // ठंडा कच्चा दूध एवं डेरी टैंकर संग्रह नोड",
      or: "VIL-B // ଶୀତଳ କଞ୍ଚା କ୍ଷୀର ଓ ଦୁଗ୍ଧ ଟ୍ୟାଙ୍କର ସଂଗ୍ରହ ନୋଡ୍",
    },
    targetHref: "/#network",
    badge: { en: "VILLAGE", hi: "गाँव", or: "ଗ୍ରାମ" },
    icon: RouteIcon,
  },
  {
    id: "h-vc",
    category: "hub",
    title: {
      en: "Village C (Nimapada Agro Belt)",
      hi: "ग्राम C (निमापड़ा कृषि बेल्ट)",
      or: "ଗ୍ରାମ C (ନିମାପଡ଼ା କୃଷି ବଳୟ)",
    },
    subtitle: {
      en: "VIL-C // Organic vegetables & traditional sweets cold-chain node",
      hi: "VIL-C // जैविक सब्जियाँ एवं पारंपरिक मिठाइयाँ कोल्ड-चेन नोड",
      or: "VIL-C // ଜୈବିକ ପନିପରିବା ଓ ଛେନାପୋଡ଼ ଶୀତଳ ଭଣ୍ଡାର ନୋଡ୍",
    },
    targetHref: "/#network",
    badge: { en: "VILLAGE", hi: "गाँव", or: "ଗ୍ରାମ" },
    icon: RouteIcon,
  },
  {
    id: "h-vd",
    category: "hub",
    title: {
      en: "Village D (Banki Riverine Farms)",
      hi: "ग्राम D (बांकी नदी तटीय फार्म)",
      or: "ଗ୍ରାମ D (ବାଙ୍କୀ ନଦୀ କୂଳ ଫାର୍ମ)",
    },
    subtitle: {
      en: "VIL-D // Mahanadi riverine freshwater fisheries node",
      hi: "VIL-D // महानदी मीठे पानी की मत्स्य पालन नोड",
      or: "VIL-D // ମହାନଦୀ ମଧୁର ଜଳ ମତ୍ସ୍ୟ ସଂଗ୍ରହ ନୋଡ୍",
    },
    targetHref: "/#network",
    badge: { en: "VILLAGE", hi: "गाँव", or: "ଗ୍ରାମ" },
    icon: RouteIcon,
  },
  {
    id: "h-pdp",
    category: "hub",
    title: {
      en: "Paradeep Port Terminal",
      hi: "पारादीप पोर्ट टर्मिनल",
      or: "ପାରାଦ୍ୱୀପ ବନ୍ଦର ଟର୍ମିନାଲ୍",
    },
    subtitle: {
      en: "PDP-PORT // Coastal export gateway for marine catch",
      hi: "PDP-PORT // समुद्री उत्पादों के लिए तटीय निर्यात गेटवे",
      or: "PDP-PORT // ସାମୁଦ୍ରିକ ମାଛ ରପ୍ତାନି ପାଇଁ ଉପକୂଳ ବନ୍ଦର",
    },
    targetHref: "/#network",
    badge: { en: "PORT", hi: "बंदरगाह", or: "ବନ୍ଦର" },
    icon: RouteIcon,
  },
  {
    id: "h-ctc",
    category: "hub",
    title: {
      en: "Cuttack Crossdock Terminal",
      hi: "कटक क्रॉसडॉक टर्मिनल",
      or: "କଟକ କ୍ରସଡକ୍ ଟର୍ମିନାଲ୍",
    },
    subtitle: {
      en: "CTC-XDK // Rural feeder transfer crossdock (85T)",
      hi: "CTC-XDK // ग्रामीण फीडर स्थानांतरण क्रॉसडॉक (85 टन)",
      or: "CTC-XDK // ଗ୍ରାମୀଣ ଫିଡର୍ ସ୍ଥାନାନ୍ତରଣ କ୍ରସଡକ୍ (୮୫ ଟନ୍)",
    },
    targetHref: "/#network",
    badge: { en: "TERMINAL", hi: "टर्मिनल", or: "ଟର୍ମିନାଲ୍" },
    icon: RouteIcon,
  },
  {
    id: "h-puri",
    category: "hub",
    title: {
      en: "Puri Coastal Depot",
      hi: "पुरी तटीय डिपो",
      or: "ପୁରୀ ଉପକୂଳ ଡିପୋ",
    },
    subtitle: {
      en: "PURI-DEPOT // Coastal fisheries storage & rural depot (45T)",
      hi: "PURI-DEPOT // तटीय मत्स्य भंडारण एवं ग्रामीण डिपो (45 टन)",
      or: "PURI-DEPOT // ଉପକୂଳ ମତ୍ସ୍ୟ ଶୀତଳ ଭଣ୍ଡାର ଓ ଗ୍ରାମୀଣ ଡିପୋ (୪୫ ଟନ୍)",
    },
    targetHref: "/#network",
    badge: { en: "DEPOT", hi: "डिपो", or: "ଡିପୋ" },
    icon: RouteIcon,
  },

  // CONSIGNMENTS & PICKUPS
  {
    id: "c-90141",
    category: "consignment",
    title: {
      en: "RUR-90141 // Village A → Bhubaneswar Cold Hub",
      hi: "RUR-90141 // ग्राम A → भुवनेश्वर कोल्ड हब",
      or: "RUR-90141 // ଗ୍ରାମ A → ଭୁବନେଶ୍ୱର କୋଲ୍ଡ ହବ୍",
    },
    subtitle: {
      en: "Floriculture & Betel Leaves (+12.0°C) // Solar Reefer Tempo",
      hi: "फूल एवं पान के पत्ते (+12.0°C) // सौर रीफर टेम्पो",
      or: "ଫୁଲ ଓ ପାନ ପତ୍ର (+12.0°C) // ସୌର ରିଫର୍ ଟେମ୍ପୋ",
    },
    targetHref: "/#shipments",
    badge: { en: "PENDING", hi: "लंबित", or: "ବଳକା" },
    icon: TruckIcon,
  },
  {
    id: "c-90142",
    category: "consignment",
    title: {
      en: "RUR-90142 // Village B → Bhubaneswar Cold Hub",
      hi: "RUR-90142 // ग्राम B → भुवनेश्वर कोल्ड हब",
      or: "RUR-90142 // ଗ୍ରାମ B → ଭୁବନେଶ୍ୱର କୋଲ୍ଡ ହବ୍",
    },
    subtitle: {
      en: "Chilled Raw Dairy (+3.5°C) // Insulated Carrier Tempo",
      hi: "ठंडा कच्चा दूध (+3.5°C) // इंसुलेटेड कैरियर टेम्पो",
      or: "ଶୀତଳ କଞ୍ଚା କ୍ଷୀର (+3.5°C) // ଇନସୁଲେଟେଡ୍ ଟେମ୍ପୋ",
    },
    targetHref: "/#shipments",
    badge: { en: "PENDING", hi: "लंबित", or: "ବଳକା" },
    icon: TruckIcon,
  },
  {
    id: "c-90143",
    category: "consignment",
    title: {
      en: "RUR-90145 // Village A → Bhubaneswar Cold Hub",
      hi: "RUR-90145 // ग्राम A → भुवनेश्वर कोल्ड हब",
      or: "RUR-90145 // ଗ୍ରାମ A → ଭୁବନେଶ୍ୱର କୋଲ୍ଡ ହବ୍",
    },
    subtitle: {
      en: "Maternal Vaccines (+3.0°C) // Solar Reefer Tempo // Critical Urgency",
      hi: "मातृ टीके (+3.0°C) // सौर रीफर टेम्पो // गंभीर आपातकालीन",
      or: "ମାତୃ ସ୍ୱାସ୍ଥ୍ୟ ଟିକା (+3.0°C) // ସୌର ରିଫର୍ ଟେମ୍ପୋ // ଅତ୍ୟନ୍ତ ଜରୁରୀ",
    },
    targetHref: "/#shipments",
    badge: { en: "CRITICAL", hi: "गंभीर", or: "ଜରୁରୀ" },
    icon: TruckIcon,
  },
  {
    id: "c-90144",
    category: "consignment",
    title: {
      en: "RUR-90143 // Village C → Cuttack Terminal",
      hi: "RUR-90143 // ग्राम C → कटक टर्मिनल",
      or: "RUR-90143 // ଗ୍ରାମ C → କଟକ ଟର୍ମିନାଲ୍",
    },
    subtitle: {
      en: "Fresh Chenapoda (+4.0°C) // Pre-cooling Active",
      hi: "ताज़ा छेनापोड़ा (+4.0°C) // प्री-कूलिंग सक्रिय",
      or: "ତାଜା ଛେନାପୋଡ଼ (+4.0°C) // ପ୍ରି-କୁଲିଂ ସକ୍ରିୟ",
    },
    targetHref: "/#shipments",
    badge: { en: "PRE-COOL", hi: "प्री-कूलिंग", or: "ପ୍ରି-କୁଲିଂ" },
    icon: TruckIcon,
  },
  {
    id: "c-90145",
    category: "consignment",
    title: {
      en: "RUR-90144 // Village D → Bhubaneswar Cold Hub",
      hi: "RUR-90144 // ग्राम D → भुवनेश्वर कोल्ड हब",
      or: "RUR-90144 // ଗ୍ରାମ D → ଭୁବନେଶ୍ୱର କୋଲ୍ଡ ହବ୍",
    },
    subtitle: {
      en: "Fresh Riverine Catch (+2.0°C) // Shared Auto Carrier",
      hi: "ताज़ी नदी की मछली (+2.0°C) // साझा ऑटो कैरियर",
      or: "ତାଜା ନଦୀ ମାଛ (+2.0°C) // ସେୟାର୍ଡ ଅଟୋ କ୍ୟାରିଅର୍",
    },
    targetHref: "/#shipments",
    badge: { en: "PENDING", hi: "लंबित", or: "ବଳକା" },
    icon: TruckIcon,
  },
];

interface LogisticsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogisticsSearchModal({
  isOpen,
  onClose,
}: LogisticsSearchModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("search");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "consignment" | "hub" | "section">("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const localizedItems = useMemo(() => {
    const lang = ["en", "hi", "or"].includes(locale) ? locale : "en";
    return SEARCH_DATABASE_I18N.map((item) => ({
      id: item.id,
      category: item.category,
      title: item.title[lang] || item.title.en,
      subtitle: item.subtitle[lang] || item.subtitle.en,
      badge: item.badge ? item.badge[lang] || item.badge.en : undefined,
      targetHref: item.targetHref,
      icon: item.icon,
    }));
  }, [locale]);

  const filteredResults = useMemo(() => {
    return localizedItems.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const q = query.toLowerCase().trim();
      if (!q) return matchesCategory;
      const matchesQuery =
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [localizedItems, selectedCategory, query]);

  const handleSelect = (item: (typeof localizedItems)[0]) => {
    onClose();
    if (item.targetHref.startsWith("/#")) {
      const sectionId = item.targetHref.replace("/#", "");
      if (pathname === `/${locale}` || pathname === "/") {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", `/${locale}#${sectionId}`);
        }
      } else {
        router.push(`/${locale}#${sectionId}`);
      }
    } else {
      router.push(`/${locale}${item.targetHref}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === "Enter" && filteredResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredResults[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#121215] border border-neutral-900 dark:border-neutral-700 shadow-2xl overflow-hidden transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Input Bar */}
        <div className="relative flex items-center px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <SearchIcon size={18} className="text-black dark:text-white shrink-0 mr-3" strokeWidth={1.8} />
          <input
            ref={inputRef}
            type="text"
            placeholder={t("placeholder")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-black dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none font-mono"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-neutral-400 hover:text-black dark:text-neutral-500 dark:hover:text-white transition-colors mr-2 cursor-pointer"
            >
              <CloseIcon size={14} />
            </button>
          )}
          <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-neutral-200 dark:border-neutral-800">
            <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-[9px] text-neutral-500 dark:text-neutral-400 font-semibold uppercase">
              ESC
            </span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-neutral-50 dark:bg-[#0c0c0e] border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto font-mono text-[10px]">
          {(["all", "consignment", "hub", "section"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-full uppercase tracking-wider transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-black text-white dark:bg-white dark:text-black font-semibold"
                  : "text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
              }`}
            >
              {t(cat)}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-neutral-400 dark:text-neutral-500 font-mono hidden sm:inline uppercase">
            {filteredResults.length} {t("matches")}
          </span>
        </div>

        {/* Search Results List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
          {filteredResults.length === 0 ? (
            <div className="p-10 text-center font-mono text-xs text-neutral-400 dark:text-neutral-500 space-y-1">
              <div>{t("noResults")} &quot;{query}&quot;</div>
              <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
                {t("trySearching")}
              </div>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors ${
                    isSelected ? "bg-neutral-100/90 dark:bg-neutral-800/80" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <div className={`p-1.5 rounded-full border shrink-0 ${
                      isSelected
                        ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                        : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                    }`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-black dark:text-white truncate font-mono">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[8.5px] uppercase font-mono tracking-wider bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[10.5px] text-neutral-500 dark:text-neutral-400 truncate font-sans font-light mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 font-mono text-[10px] text-neutral-400 dark:text-neutral-500">
                    <span className="hidden sm:inline uppercase">{t("jump")}</span>
                    <ArrowRightIcon size={12} className={isSelected ? "text-black dark:text-white translate-x-0.5" : "text-neutral-300 dark:text-neutral-600"} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-neutral-50 dark:bg-[#0c0c0e] border-t border-neutral-200 dark:border-neutral-800 font-mono text-[9.5px] text-neutral-400 dark:text-neutral-500">
          <div className="flex items-center gap-3">
            <span>{t("navigate")}</span>
            <span>{t("select")}</span>
            <span>{t("close")}</span>
          </div>
          <div>{t("directory")}</div>
        </div>
      </div>
    </div>
  );
}

