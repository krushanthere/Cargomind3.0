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
  LayersIcon,
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
      as: "০০ // অৱলোকন আৰু গতিশীল ভেক্টৰ",
    },
    subtitle: {
      en: "Live rural corridor telemetry & fairness estimator",
      hi: "लाइव ग्रामीण कॉरिडोर टेलीमेट्री एवं निष्पक्षता अनुमानक",
      as: "লাইভ গ্ৰাম্য কৰিডৰ টেলিমেট্ৰী আৰু ন্যায্যতা মূল্যাংকনকাৰী",
    },
    targetHref: "/#overview",
    badge: { en: "PORTAL", hi: "पोर्टल", as: "পৰ্টেল" },
    icon: PulseIcon,
  },
  {
    id: "s-network",
    category: "section",
    title: {
      en: "01 // Community Topology & Storage",
      hi: "01 // सामुदायिक टोपोलॉजी एवं भंडारण",
      as: "০১ // সম্প্ৰদায় টপোলজি আৰু সংৰক্ষণ",
    },
    subtitle: {
      en: "Guwahati Mega Hub, Pandu Port NW-2, Silchar & Mountain Nodes",
      hi: "गुवाहाटी मेगा हब, पांडु पोर्ट NW-2, सिलचर एवं पर्वतीय नोड्स",
      as: "গুৱাহাটী মেগা হাব, পাণ্ডু প’ৰ্ট NW-2, শিলচৰ আৰু পাৰ্বত্য নোড",
    },
    targetHref: "/#network",
    badge: { en: "TOPOLOGY", hi: "टोपोलॉजी", as: "টপোলজি" },
    icon: RouteIcon,
  },
  {
    id: "s-dataset",
    category: "section",
    title: {
      en: "02 // NER Open Dataset Intelligence",
      hi: "02 // पूर्वोत्तर ओपन डेटासेट इंटेलिजेंस",
      as: "০২ // উত্তৰ-পূৰ্বাঞ্চল মুক্ত তথ্য ভাণ্ডাৰ",
    },
    subtitle: {
      en: "66,899 PMGSY habitations, 45,870km roads, NASA SRTM 30m DEM & NFR Railways",
      hi: "66,899 पीएमजीएसवाई बस्तियां, 45,870 किमी सड़कें, नासा एसआरटीएम 30 मीटर डीईएम",
      as: "৬৬,৮৯৯ PMGSY বসতি, ৪৫,৮৭০ কিমি পথ, নাছা SRTM ৩০মি DEM",
    },
    targetHref: "/#dataset",
    badge: { en: "OPEN DATA", hi: "ओपन डेटा", as: "মুক্ত তথ্য" },
    icon: LayersIcon,
  },
  {
    id: "s-shipments",
    category: "section",
    title: {
      en: "03 // Active Pickups & Ingestion",
      hi: "03 // सक्रिय पिकअप एवं प्रविष्टि",
      as: "০৩ // সক্ৰিয় পিকআপ আৰু সংগ্ৰহ",
    },
    subtitle: {
      en: "Offline-capable community pickup queue and ledger",
      hi: "ऑफलाइन-सक्षम सामुदायिक पिकअप कतार एवं खाता",
      as: "অফলাইন-সক্ষম সম্প্ৰদায় পিকআপ শাৰী আৰু খতিয়ান",
    },
    targetHref: "/#shipments",
    badge: { en: "LEDGER", hi: "खाता", as: "খতিয়ান" },
    icon: CubeIcon,
  },
  {
    id: "s-dispatch",
    category: "section",
    title: {
      en: "04 // Dynamic Dispatch & Matching",
      hi: "04 // डायनामिक डिस्पैच एवं मैचिंग",
      as: "০৪ // গতিশীল প্ৰেৰণ আৰু মিলন",
    },
    subtitle: {
      en: "Fairness-weighted remote vehicle and pickup matcher",
      hi: "निष्पक्षता-भारित वाहन एवं पिकअप मैचर",
      as: "ন্যায্যতা-ভাৰিত বাহন আৰু পিকআপ মিলনকাৰী",
    },
    targetHref: "/#dispatch",
    badge: { en: "DISPATCH", hi: "डिस्पैच", as: "প্ৰেৰণ" },
    icon: SlidersIcon,
  },
  {
    id: "s-sensors",
    category: "section",
    title: {
      en: "05 // Arrhenius Thermal Kinetics",
      hi: "05 // Arrhenius थर्मल काइनेटिक्स",
      as: "০৫ // আৰহেনিয়াছ তাপীয় গতিবিজ্ঞান",
    },
    subtitle: {
      en: "Perishability decay & solar cold buffer telemetry",
      hi: "खराबी क्षय एवं सौर कोल्ड बफर टेलीमेट्री",
      as: "ক্ষয়শীলতা আৰু সৌৰ শীতল বাফাৰ টেলিমেট্ৰী",
    },
    targetHref: "/#sensors",
    badge: { en: "KINETICS", hi: "काइनेटिक्स", as: "গতিবিজ্ঞান" },
    icon: ThermometerIcon,
  },
  {
    id: "s-fairness",
    category: "section",
    title: {
      en: "06 // Provable Fairness Audit",
      hi: "06 // प्रमाणनीय निष्पक्षता ऑडिट",
      as: "০৬ // প্ৰমাণযোগ্য ন্যায্যতা পৰীক্ষা",
    },
    subtitle: {
      en: "Jain's fairness index & community non-deprioritization proof",
      hi: "जैन निष्पक्षता सूचकांक एवं गैर-उपेक्षा गारंटी",
      as: "জৈনৰ ন্যায্যতা সূচক আৰু সম্প্ৰদায় সুৰক্ষা",
    },
    targetHref: "/#fairness",
    badge: { en: "FAIRNESS", hi: "निष्पक्षता", as: "ন্যায্যতা" },
    icon: ShieldCheckIcon,
  },
  {
    id: "s-alerts",
    category: "section",
    title: {
      en: "07 // Real-Time Terrain Surveillance",
      hi: "07 // रीयल-टाइम इलाका निगरानी",
      as: "০৭ // ৰিয়েল-টাইম ভূখণ্ড নিৰীক্ষণ",
    },
    subtitle: {
      en: "Flood risk, landslide passes, and road condition reports",
      hi: "बाढ़ जोखिम, भूस्खलन दर्रे एवं सड़क स्थिति रिपोर्ट",
      as: "বানপানীৰ বিপদাশংকা, ভূমিস্খলন আৰু পথৰ অৱস্থা প্ৰতিবেদন",
    },
    targetHref: "/#alerts",
    badge: { en: "SURVEILLANCE", hi: "निगरानी", as: "নিৰীক্ষণ" },
    icon: AlertCircleIcon,
  },
  {
    id: "s-ai",
    category: "section",
    title: {
      en: "AI Intelligence Suite",
      hi: "AI इंटेलिजेंस सूट",
      as: "AI বুদ্ধিমত্তা চ্যুট",
    },
    subtitle: {
      en: "Multi-objective dispatch optimizer & SHAP attribution",
      hi: "मल्टी-ऑब्जेक्टिव डिस्पैच ऑप्टिमाइज़र एवं SHAP कंसोल",
      as: "বহু-উদ্দেশ্যমূলক প্ৰেৰণ অপ্টিমাইজাৰ আৰু SHAP ব্যাখ্যা",
    },
    targetHref: "/ai-intelligence",
    badge: { en: "AI CONSOLE", hi: "AI कंसोल", as: "AI কন্সোল" },
    icon: AiBrainIcon,
  },
  {
    id: "s-about",
    category: "section",
    title: {
      en: "About CargoMind Manifesto",
      hi: "कार्गोमाइंड घोषणापत्र",
      as: "কাৰ্গোমাইণ্ড ঘোষণাপত্ৰ",
    },
    subtitle: {
      en: "Remote area logistics platform & architecture blueprint",
      hi: "ग्रामीण क्षेत्र लॉजिस्टिक्स प्लेटफ़ॉर्म एवं आर्किटेक्चर",
      as: "দুৰ্গম অঞ্চলৰ লজিষ্টিক মঞ্চ আৰু গাঁথনি ব্লুপ্ৰিণ্ট",
    },
    targetHref: "/about",
    badge: { en: "MANIFESTO", hi: "घोषणापत्र", as: "ঘোষণাপত্ৰ" },
    icon: RouteIcon,
  },

  // HUBS & VILLAGES
  {
    id: "h-ghy",
    category: "hub",
    title: {
      en: "Guwahati Northeast Central Mega Hub",
      hi: "गुवाहाटी पूर्वोत्तर सेंट्रल मेगा हब",
      as: "গুৱাহাটী উত্তৰ-পূব কেন্দ্ৰীয় মেগা হাব",
    },
    subtitle: {
      en: "GHY-HUB // Central Multi-Temp 250T facility (-25°C / +4°C / +2°C)",
      hi: "GHY-HUB // केंद्रीय मल्टी-तापमान 250 टन सुविधा (-25°C / +4°C / +2°C)",
      as: "GHY-HUB // কেন্দ্ৰীয় মাল্টি-তাপমাত্ৰা ২৫০ টন সুবিধা (-25°C / +4°C / +2°C)",
    },
    targetHref: "/#network",
    badge: { en: "HUB", hi: "हब", as: "হাব" },
    icon: RouteIcon,
  },
  {
    id: "h-jorhat",
    category: "hub",
    title: {
      en: "Jorhat Upper Assam Tea Belt",
      hi: "जोरहाट ऊपरी असम चाय बेल्ट",
      as: "যোৰহাট উজনি অসম চাহ বলয়",
    },
    subtitle: {
      en: "JRH-AGRO // Organic green tea & bio-fertilizer aggregation",
      hi: "JRH-AGRO // जैविक चाय एवं कृषि उत्पाद संग्रह केंद्र",
      as: "JRH-AGRO // জৈৱিক চাহ আৰু কৃষি উৎপাদিত সামগ্ৰী সংগ্ৰহ কেন্দ্ৰ",
    },
    targetHref: "/#network",
    badge: { en: "AGRO", hi: "कृषि", as: "কৃষি" },
    icon: RouteIcon,
  },
  {
    id: "h-tawang",
    category: "hub",
    title: {
      en: "Tawang Mountain Outpost (3048m ASL)",
      hi: "तवांग पर्वतीय चौकी (3048 मी)",
      as: "টাৱাং পাৰ্বত্য চকীয়াল (৩০৪৮ মি)",
    },
    subtitle: {
      en: "TWG-MTN // High-altitude medical supplies & organic kiwi depot",
      hi: "TWG-MTN // उच्च पर्वतीय जीवनरक्षक दवाइयाँ एवं कीवी डिपो",
      as: "TWG-MTN // উচ্চ পাৰ্বত্য জৰুৰী ঔষধ আৰু কিৱি ডিপো",
    },
    targetHref: "/#network",
    badge: { en: "HIGHLAND", hi: "पर्वतीय", as: "পাৰ্বত্য" },
    icon: RouteIcon,
  },
  {
    id: "h-majuli",
    category: "hub",
    title: {
      en: "Majuli River Island Ferries",
      hi: "माजुली नदी द्वीप नौका टर्मिनल",
      as: "মাজুলী নদী দ্বীপ ফেৰী",
    },
    subtitle: {
      en: "MJL-ISL // Brahmaputra freshwater fisheries & pottery co-op",
      hi: "MJL-ISL // ब्रह्मपुत्र मीठे पानी की मत्स्य पालन एवं हस्तशिल्प",
      as: "MJL-ISL // ব্ৰহ্মপুত্ৰৰ মিঠা পানীৰ মাছ আৰু মৃৎশিল্প সমবায়",
    },
    targetHref: "/#network",
    badge: { en: "ISLAND", hi: "द्वीप", as: "দ্বীপ" },
    icon: RouteIcon,
  },
  {
    id: "h-imphal",
    category: "hub",
    title: {
      en: "Imphal Valley Organic Farms",
      hi: "इम्फाल घाटी जैविक फार्म",
      as: "ইম্ফল উপত্যকা জৈৱিক ফাৰ্ম",
    },
    subtitle: {
      en: "IMP-VAL // Black rice & King Chilli (Bhut Jolokia) cold-chain node",
      hi: "IMP-VAL // चक-हाओ काला चावल एवं भूत जोलोकिया कोल्ड-चेन",
      as: "IMP-VAL // চাক-হাও ক’লা চাউল আৰু ভূত জলকীয়া ক’ল্ড-চেইন",
    },
    targetHref: "/#network",
    badge: { en: "VALLEY", hi: "घाटी", as: "উপত্যকা" },
    icon: RouteIcon,
  },
  {
    id: "h-pandu",
    category: "hub",
    title: {
      en: "Pandu Inland Port (NW-2 Brahmaputra)",
      hi: "पांडु अंतर्देशीय बंदरगाह (NW-2)",
      as: "পাণ্ডু অভ্যন্তৰীণ বন্দৰ (NW-2 ব্ৰহ্মপুত্ৰ)",
    },
    subtitle: {
      en: "PDU-PORT // Low-carbon eco-barge waterway terminal (180T)",
      hi: "PDU-PORT // कम कार्बन इको-बार्ज जलमार्ग टर्मिनल (180 टन)",
      as: "PDU-PORT // কম কাৰ্বনযুক্ত ইক’-বাৰ্জ জলপথ টাৰ্মিনেল (১৮০ টন)",
    },
    targetHref: "/#network",
    badge: { en: "PORT", hi: "बंदरगाह", as: "বন্দৰ" },
    icon: RouteIcon,
  },
  {
    id: "h-silchar",
    category: "hub",
    title: {
      en: "Silchar Rail & Road Crossdock Terminal",
      hi: "सिलचर रेल एवं सड़क क्रॉसडॉक",
      as: "শিলচৰ ৰে’ল আৰু পথ ক্ৰছডক টাৰ্মিনেল",
    },
    subtitle: {
      en: "SCL-XDK // Barak Valley intermodal rail-feeder hub (110T)",
      hi: "SCL-XDK // बराक घाटी इंटरमॉडल रेल-फीडर हब (110 टन)",
      as: "SCL-XDK // বৰাক উপত্যকা আন্তঃমডেল ৰে’ল-ফিডাৰ হাব (১১০ টন)",
    },
    targetHref: "/#network",
    badge: { en: "CROSSDOCK", hi: "क्रॉसडॉक", as: "ক্ৰছডক" },
    icon: RouteIcon,
  },
  {
    id: "h-shillong",
    category: "hub",
    title: {
      en: "Shillong Highlands Transit Node",
      hi: "शिलांग हाइलैंड्स ट्रांजिट नोड",
      as: "শ্বিলং উচ্চভূমি ট্ৰাঞ্জিট নোড",
    },
    subtitle: {
      en: "SHL-MTN // Lakadong turmeric & temperate horticulture depot (65T)",
      hi: "SHL-MTN // लकाडोंग हल्दी एवं बागवानी डिपो (65 टन)",
      as: "SHL-MTN // লাকাডং হালধি আৰু নাতিশীতোষ্ণ উদ্যান শস্য ডিপো (৬৫ টন)",
    },
    targetHref: "/#network",
    badge: { en: "HIGHLAND", hi: "पर्वतीय", as: "পাৰ্বত্য" },
    icon: RouteIcon,
  },

  // CONSIGNMENTS & PICKUPS
  {
    id: "c-90141",
    category: "consignment",
    title: {
      en: "RUR-90141 // Jorhat → Guwahati Mega Hub",
      hi: "RUR-90141 // जोरहाट → गुवाहाटी मेगा हब",
      as: "RUR-90141 // যোৰহাট → গুৱাহাটী মেগা হাব",
    },
    subtitle: {
      en: "Organic Green Tea & Floriculture (+12.0°C) // Solar Reefer Tempo",
      hi: "जैविक चाय एवं पुष्प (+12.0°C) // सौर रीफर टेम्पो",
      as: "RUR-90141 // জৈৱিক সেউজ চাহ আৰু ফুল (+12.0°C) // সৌৰ ৰিফাৰ টেম্প’",
    },
    targetHref: "/#shipments",
    badge: { en: "PENDING", hi: "लंबित", as: "বাকী" },
    icon: TruckIcon,
  },
  {
    id: "c-90142",
    category: "consignment",
    title: {
      en: "RUR-90142 // Majuli Island → Guwahati Mega Hub",
      hi: "RUR-90142 // माजुली द्वीप → गुवाहाटी मेगा हब",
      as: "RUR-90142 // মাজুলী দ্বীপ → গুৱাহাটী মেগা হাব",
    },
    subtitle: {
      en: "Fresh Brahmaputra Fish (+2.0°C) // Insulated River Carrier",
      hi: "ताज़ी ब्रह्मपुत्र मछली (+2.0°C) // इंसुलेटेड रिवर कैरियर",
      as: "সতেজ ব্ৰহ্মপুত্ৰৰ মাছ (+2.0°C) // উত্তাপহীন নদী বাহন",
    },
    targetHref: "/#shipments",
    badge: { en: "PENDING", hi: "लंबित", as: "বাকী" },
    icon: TruckIcon,
  },
  {
    id: "c-90143",
    category: "consignment",
    title: {
      en: "RUR-90145 // Tawang Outpost → Tezpur Transit Node",
      hi: "RUR-90145 // तवांग चौकी → तेजपुर ट्रांजिट नोड",
      as: "RUR-90145 // টাৱাং চকীয়াল → তেজপুৰ ট্ৰাঞ্জিট নোড",
    },
    subtitle: {
      en: "Maternal Vaccines (+3.0°C) // Mountain Bolero 4x4 // Critical Urgency",
      hi: "मातृ टीके (+3.0°C) // माउंटेन बोलेरो 4x4 // गंभीर आपातकालीन",
      as: "মাতৃ প্ৰতিষেধক (+3.0°C) // পাৰ্বত্য বলেৰো 4x4 // জৰুৰীকালীন",
    },
    targetHref: "/#shipments",
    badge: { en: "CRITICAL", hi: "गंभीर", as: "জৰুৰী" },
    icon: TruckIcon,
  },
  {
    id: "c-90144",
    category: "consignment",
    title: {
      en: "RUR-90143 // Shillong Highlands → Guwahati Central Hub",
      hi: "RUR-90143 // शिलांग हाइलैंड्स → गुवाहाटी सेंट्रल हब",
      as: "RUR-90143 // শ্বিলং উচ্চভূমি → গুৱাহাটী কেন্দ্ৰীয় হাব",
    },
    subtitle: {
      en: "Lakadong Organic Turmeric (+4.0°C) // Pre-cooling Active",
      hi: "लकाडोंग जैविक हल्दी (+4.0°C) // प्री-कूलिंग सक्रिय",
      as: "লাকাডং জৈৱিক হালধি (+4.0°C) // প্ৰাক-শীতলীকৰণ সক্ৰিয়",
    },
    targetHref: "/#shipments",
    badge: { en: "PRE-COOL", hi: "प्री-कूलिंग", as: "প্ৰাক-শীতল" },
    icon: TruckIcon,
  },
  {
    id: "c-90145",
    category: "consignment",
    title: {
      en: "RUR-90144 // Imphal Valley → Silchar Rail Crossdock",
      hi: "RUR-90144 // इम्फाल घाटी → सिलचर रेल क्रॉसडॉक",
      as: "RUR-90144 // ইম্ফল উপত্যকা → শিলচৰ ৰে’ল ক্ৰছডক",
    },
    subtitle: {
      en: "King Chilli & Black Rice (+4.0°C) // Mountain E-Cargo Carrier",
      hi: "भूत जोलोकिया एवं काला चावल (+4.0°C) // माउंटेन ई-कार्गो",
      as: "ভূত জলকীয়া আৰু ক’লা চাউল (+4.0°C) // পাৰ্বত্য ই-কাৰ্গো",
    },
    targetHref: "/#shipments",
    badge: { en: "PENDING", hi: "लंबित", as: "বাকী" },
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
    const lang = ["en", "hi", "as"].includes(locale) ? locale : "en";
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
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="CargoMind Quick Search"
        className="w-full max-w-2xl bg-white dark:bg-surface-1 border border-neutral-900 dark:border-neutral-700 shadow-2xl overflow-hidden transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Input Bar */}
        <div className="relative flex items-center px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <SearchIcon size={18} className="text-black dark:text-white shrink-0 mr-3" strokeWidth={1.8} />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={filteredResults.length > 0}
            aria-controls="search-results-list"
            aria-activedescendant={filteredResults[selectedIndex] ? `search-item-${filteredResults[selectedIndex].id}` : undefined}
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
              type="button"
              aria-label="Clear search query"
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
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-neutral-50 dark:bg-surface-1 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto font-mono text-[10px]">
          {(["all", "consignment", "hub", "section"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
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
        <div
          id="search-results-list"
          role="listbox"
          aria-label="Search results"
          className="max-h-[380px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60"
        >
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
                <button
                  key={item.id}
                  id={`search-item-${item.id}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors ${
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
                          <span className="px-1.5 py-px rounded text-[8.5px] uppercase font-mono tracking-wider bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
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
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-neutral-50 dark:bg-surface-1 border-t border-neutral-200 dark:border-neutral-800 font-mono text-[9.5px] text-neutral-400 dark:text-neutral-500">
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


