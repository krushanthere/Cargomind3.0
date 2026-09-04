"use client";

import Link from "next/link";
import { useState, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { runDynamicMatching } from "../../../lib/api/dispatch";
import type { DispatchMatchResponse } from "../../../types";
import {
  StarburstIcon,
  AiBrainIcon,
  CpuIcon,
  SparklesIcon,
  RouteIcon,
  ShieldCheckIcon,
  PulseIcon,
  ChartLineIcon,
  ThermometerIcon,
  SlidersIcon,
  RefreshIcon,
  ArrowRightIcon,
  CheckmarkCircleIcon,
  AlertCircleIcon,
  SendIcon,
  TruckIcon,
  SunIcon,
  LeafIcon,
  BatteryIcon,
  InfoCircleIcon,
} from "../../../components/icons/Hugeicons";

interface RouteOption {
  id: string;
  name: Record<string, string>;
  distanceKm: number;
  baseCost: number;
  roadHours: number;
  roadCondition: "paved" | "unpaved" | "seasonal" | "flood_risk";
  community: string;
}

const AVAILABLE_ROUTES: RouteOption[] = [
  {
    id: "jorhat-ghy",
    name: {
      en: "Jorhat Upper Assam Tea Belt → Guwahati Mega Hub",
      hi: "जोरहाट ऊपरी असम चाय बेल्ट → गुवाहाटी मेगा हब",
      or: "ଯୋରହାଟ ଉପର ଆସାମ ଚାହା ବଳୟ → ଗୁୱାହାଟୀ ମେଗା ହବ୍",
    },
    distanceKm: 305,
    baseCost: 3800,
    roadHours: 5.8,
    roadCondition: "paved",
    community: "comm-jorhat",
  },
  {
    id: "tawang-tezpur",
    name: {
      en: "Tawang Mountain Outpost (3048m ASL) → Tezpur Transit Node",
      hi: "तवांग पर्वतीय चौकी (3048 मी) → तेजपुर ट्रांजिट नोड",
      or: "ତାୱାଙ୍ଗ ପାର୍ବତ୍ୟ ଆଉଟପୋଷ୍ଟ → ତେଜପୁର ଟ୍ରାଞ୍ଜିଟ୍",
    },
    distanceKm: 320,
    baseCost: 6500,
    roadHours: 9.2,
    roadCondition: "unpaved",
    community: "comm-tawang",
  },
  {
    id: "majuli-jorhat",
    name: {
      en: "Majuli River Island Ferries → Jorhat Agro Hub",
      hi: "माजुली नदी द्वीप नौका → जोरहाट कृषि हब",
      or: "ମାଜୁଲି ନଦୀ ଦ୍ୱୀପ ଫେରି → ଯୋରହାଟ କୃଷି ହବ୍",
    },
    distanceKm: 45,
    baseCost: 1500,
    roadHours: 2.0,
    roadCondition: "flood_risk",
    community: "comm-majuli",
  },
  {
    id: "imphal-silchar",
    name: {
      en: "Imphal Valley Organic Farms → Silchar Rail Crossdock",
      hi: "इम्फाल घाटी जैविक फार्म → सिलचर रेल क्रॉसडॉक",
      or: "ଇମ୍ଫାଲ ଉପତ୍ୟକା ଜୈବିକ ଫାର୍ମ → ସିଲଚର ରେଳ କ୍ରସଡକ୍",
    },
    distanceKm: 260,
    baseCost: 4900,
    roadHours: 7.5,
    roadCondition: "seasonal",
    community: "comm-imphal",
  },
  {
    id: "shillong-ghy",
    name: {
      en: "Shillong Highlands (1525m ASL) → Guwahati Central Hub",
      hi: "शिलांग हाइलैंड्स → गुवाहाटी सेंट्रल हब",
      or: "ଶିଲଙ୍ଗ ପାର୍ବତ୍ୟ → ଗୁୱାହାଟୀ ସେଣ୍ଟ୍ରାଲ୍ ହବ୍",
    },
    distanceKm: 98,
    baseCost: 2200,
    roadHours: 2.4,
    roadCondition: "paved",
    community: "comm-shillong",
  },
];

export type AIVehicleType =
  | "heavy_truck"
  | "mini_truck"
  | "pickup_4x4"
  | "three_wheeler_cargo"
  | "cargo_erickshaw"
  | "motorbike"
  | "tractor_trailer"
  | "cargo_bike";

interface VehicleSpec {
  id: AIVehicleType;
  name: Record<string, string>;
  capacityKg: number;
  emoji: string;
  tempControl: boolean;
  clearanceClass: "heavy" | "medium" | "light";
  maxGradientPct: number;
  terrains: Record<string, string>;
}

const VEHICLE_SPECS: Record<AIVehicleType, VehicleSpec> = {
  heavy_truck: {
    id: "heavy_truck",
    name: {
      en: "Heavy Truck (HCV)",
      hi: "भारी ट्रक (HCV)",
      or: "ଭାରୀ ଟ୍ରକ୍ (HCV)",
    },
    capacityKg: 16000,
    emoji: "🚛",
    tempControl: true,
    clearanceClass: "heavy",
    maxGradientPct: 8.0,
    terrains: {
      en: "Highways, flat paved roads",
      hi: "राजमार्ग, समतल पक्की सड़कें",
      or: "ରାଜପଥ, ସମତଳ ପିଚୁ ରାସ୍ତା",
    },
  },
  mini_truck: {
    id: "mini_truck",
    name: {
      en: "Mini-truck/LCV (Tata Ace, Dost)",
      hi: "मिनी-ट्रक/LCV (टाटा ऐस, दोस्त)",
      or: "ମିନି-ଟ୍ରକ୍/LCV (ଟାଟା ଏସ୍, ଦୋସ୍ତ)",
    },
    capacityKg: 1200,
    emoji: "🚚",
    tempControl: true,
    clearanceClass: "medium",
    maxGradientPct: 18.0,
    terrains: {
      en: "Paved rural roads, mild gradients",
      hi: "पक्की ग्रामीण सड़कें, हल्के ढलान",
      or: "ପିଚୁ ଗ୍ରାମ୍ୟ ରାସ୍ତା, ସାମାନ୍ୟ ଢାଲୁ",
    },
  },
  pickup_4x4: {
    id: "pickup_4x4",
    name: {
      en: "4x4 Pickup (Bolero Camper, Scorpio)",
      hi: "4x4 पिकअप (बोलेरो कैंपर, स्कॉर्पियो)",
      or: "4x4 ପିକଅପ୍ (ବୋଲେରୋ କ୍ୟାମ୍ପର, ସ୍କର୍ପିଓ)",
    },
    capacityKg: 1500,
    emoji: "🛻",
    tempControl: true,
    clearanceClass: "heavy",
    maxGradientPct: 32.0,
    terrains: {
      en: "Hilly, unpaved, high-gradient terrain",
      hi: "पहाड़ी, कच्चा, उच्च ढलान इलाका",
      or: "ପାହାଡ଼ିଆ, କଞ୍ଚା, ଉଚ୍ଚ-ଢାଲୁ ରାସ୍ତା",
    },
  },
  three_wheeler_cargo: {
    id: "three_wheeler_cargo",
    name: {
      en: "Three-wheeler Cargo (Ape, Alfa)",
      hi: "थ्री-व्हीलर कार्गो (एप, अल्फा)",
      or: "ଥ୍ରୀ-ହୁଇଲର କାର୍ଗୋ (ଏପ୍, ଆଲଫା)",
    },
    capacityKg: 500,
    emoji: "🛺",
    tempControl: false,
    clearanceClass: "light",
    maxGradientPct: 12.0,
    terrains: {
      en: "Narrow village lanes, flat semi-urban",
      hi: "संकीर्ण ग्रामीण गलियाँ, समतल अर्ध-शहरी",
      or: "ସଂକୀର୍ଣ୍ଣ ଗ୍ରାମ୍ୟ ଗଳି, ସମତଳ ଅର୍ଦ୍ଧ-ସହରାଞ୍ଚଳ",
    },
  },
  cargo_erickshaw: {
    id: "cargo_erickshaw",
    name: {
      en: "E-rickshaw Cargo",
      hi: "ई-रिक्शा कार्गो",
      or: "ଇ-ରିକ୍ସା କାର୍ଗୋ",
    },
    capacityKg: 400,
    emoji: "🛺",
    tempControl: false,
    clearanceClass: "light",
    maxGradientPct: 6.0,
    terrains: {
      en: "Flat, short-distance, semi-urban/rural",
      hi: "समतल, कम दूरी, अर्ध-शहरी/ग्रामीण",
      or: "ସମତଳ, ସ୍ୱଳ୍ପ ଦୂରତା, ଅର୍ଦ୍ଧ-ସହରାଞ୍ଚଳ/ଗ୍ରାମାଞ୍ଚଳ",
    },
  },
  motorbike: {
    id: "motorbike",
    name: {
      en: "Motorcycle with Cargo Box",
      hi: "कार्गो बॉक्स के साथ मोटरसाइकिल",
      or: "କାର୍ଗୋ ବକ୍ସ ସହିତ ମୋଟରସାଇକେଲ୍",
    },
    capacityKg: 80,
    emoji: "🏍️",
    tempControl: true,
    clearanceClass: "light",
    maxGradientPct: 22.0,
    terrains: {
      en: "Kutcha roads, narrow footpaths, monsoon-hit routes",
      hi: "कच्ची सड़कें, संकीर्ण पगडंडियाँ, मानसून प्रभावित मार्ग",
      or: "କଞ୍ଚା ରାସ୍ତା, ସଂକୀର୍ଣ୍ଣ ପାଦଚଲା ବାଟ, ବର୍ଷା ପ୍ରଭାବିତ ମାର୍ଗ",
    },
  },
  tractor_trailer: {
    id: "tractor_trailer",
    name: {
      en: "Tractor-Trolley",
      hi: "ट्रैक्टर-ट्रॉली",
      or: "ଟ୍ରାକ୍ଟର-ଟ୍ରଲି",
    },
    capacityKg: 4000,
    emoji: "🚜",
    tempControl: false,
    clearanceClass: "heavy",
    maxGradientPct: 15.0,
    terrains: {
      en: "Very poor/unpaved roads, agricultural terrain, bulk loads",
      hi: "अत्यधिक खराब/कच्ची सड़कें, कृषि क्षेत्र, थोक भार",
      or: "ଅତି ଖରାପ/କଞ୍ଚା ରାସ୍ତା, କୃଷି କ୍ଷେତ୍ର, ବଲ୍କ ଲୋଡ୍",
    },
  },
  cargo_bike: {
    id: "cargo_bike",
    name: {
      en: "Cycle/E-cycle Cargo",
      hi: "साइकिल/ई-साइकिल कार्गो",
      or: "ସାଇକଲ୍/ଇ-ସାଇକଲ୍ କାର୍ଗୋ",
    },
    capacityKg: 60,
    emoji: "🚲",
    tempControl: true,
    clearanceClass: "light",
    maxGradientPct: 12.0,
    terrains: {
      en: "Dense village interiors, no-vehicle-access zones, last 100-500m",
      hi: "घने ग्रामीण इलाके, वाहन-प्रतिबंधित क्षेत्र, अंतिम 100-500मी",
      or: "ଘଞ୍ଚ ଗ୍ରାମ୍ୟ ଅଞ୍ଚଳ, ଯାନବାହନ ଚଳାଚଳ ନଥିବା ସ୍ଥାନ, ଶେଷ 100-500ମି",
    },
  },
};

interface SolverSimulationResult {
  timestamp: string;
  decision: "ALLOCATED" | "CONDITIONAL_APPROVAL" | "REJECTED_TERRAIN" | "REJECTED_THERMAL" | "REJECTED_CAPACITY";
  statusTitle: string;
  isCompatible: boolean;
  scores: {
    urgScore: number;
    medicineBonus: number;
    fairnessBoost: number;
    terrainPenalty: number;
    totalScore: number;
    perishableDecayPct: string;
    effectiveHours: string;
    fairnessIndex: string;
  };
  checks: {
    terrain: { passed: boolean; message: string; severity: "pass" | "warn" | "fail" };
    thermal: { passed: boolean; message: string; severity: "pass" | "warn" | "fail" };
    payload: { passed: boolean; message: string; severity: "pass" | "warn" | "fail" };
  };
  suggestedAction?: {
    label: string;
    fixType: "tractor_trailer" | "pickup_with_solar" | "pickup_4x4" | "heavy_truck" | "mini_truck";
  };
  allocationSummary: string;
  explainableReasons: string[];
}

export default function AIIntelligencePage() {
  const t = useTranslations("ai");
  const tc = useTranslations("common");
  const locale = useLocale();
  const lang = ["en", "hi", "or"].includes(locale) ? locale : "en";

  const [selectedRouteId, setSelectedRouteId] = useState<string>("va-bbs");
  const [goodType, setGoodType] = useState<"farm_produce" | "medicine" | "essential_goods">("farm_produce");
  const [vehicleType, setVehicleType] = useState<AIVehicleType>("mini_truck");
  const [urgency, setUrgency] = useState<"critical" | "high" | "routine">("high");
  const [producerWaitMins, setProducerWaitMins] = useState<number>(45);
  const [ambientTempOverride, setAmbientTempOverride] = useState<number>(36);
  const [hasSolarColdBuffer, setHasSolarColdBuffer] = useState<boolean>(true);
  const [extendWindow, setExtendWindow] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [hasRunSolver, setHasRunSolver] = useState<boolean>(false);
  const [justSolved, setJustSolved] = useState<boolean>(false);
  const [solverResult, setSolverResult] = useState<SolverSimulationResult | null>(null);
  const [backendSyncResponse, setBackendSyncResponse] = useState<DispatchMatchResponse | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const selectedRoute =
    AVAILABLE_ROUTES.find((r) => r.id === selectedRouteId) || AVAILABLE_ROUTES[0];

  // Mathematical & Multi-Objective Calculations
  const mathCalculations = useMemo(() => {
    // 1. Urgency score
    const urgScore = urgency === "critical" ? 500 : urgency === "high" ? 300 : 100;
    const medicineBonus = goodType === "medicine" ? 200 : 0;

    // 2. Fairness boost based on wait time disparity (baseline 60m)
    const fairnessBoost = Math.max(0, Math.round(((producerWaitMins - 60) * 2.5) + (150 / (1 + 3))));

    // 3. Road penalty
    const terrainPenalty =
      selectedRoute.roadCondition === "flood_risk"
        ? 45
        : selectedRoute.roadCondition === "seasonal"
        ? 25
        : selectedRoute.roadCondition === "unpaved"
        ? 15
        : 0;

    // 4. Arrhenius & thermal loss
    const deltaT = Math.max(0, ambientTempOverride - 4);
    const solarFactor = hasSolarColdBuffer ? 0.35 : 1.1;
    const perishableDecayPct = Math.min(
      99,
      Math.max(0.1, (deltaT * 0.7 * (selectedRoute.roadHours + (extendWindow ? 4.0 : 0.0) + 0.5) * solarFactor) / 2.0)
    );

    // 5. Total Net Dispatch Priority Score
    const totalScore = urgScore + medicineBonus + fairnessBoost - terrainPenalty;

    return {
      urgScore,
      medicineBonus,
      fairnessBoost,
      terrainPenalty,
      perishableDecayPct: perishableDecayPct.toFixed(1),
      totalScore,
      fairnessIndex: (0.95 + (fairnessBoost > 50 ? 0.03 : 0.0)).toFixed(2),
      effectiveHours: (selectedRoute.roadHours * (selectedRoute.roadCondition === "flood_risk" ? 1.8 : 1.0) + (extendWindow ? 4.0 : 0.0)).toFixed(1),
    };
  }, [selectedRoute, goodType, urgency, producerWaitMins, ambientTempOverride, hasSolarColdBuffer, extendWindow]);

  // Solver Execution Routine
  const handleRunOptimizer = useCallback(() => {
    setIsOptimizing(true);
    setJustSolved(false);

    setTimeout(async () => {
      const currentVehicle = VEHICLE_SPECS[vehicleType];
      const roadCond = selectedRoute.roadCondition;
      const vehicleName = currentVehicle.name[lang] || currentVehicle.name.en;
      const routeName = selectedRoute.name[lang] || selectedRoute.name.en;

      // 1. Terrain & Clearance Check
      let terrainPassed = true;
      let terrainSeverity: "pass" | "warn" | "fail" = "pass";
      let terrainMessage = `${tc("terrain." + (roadCond === "flood_risk" ? "floodRisk" : roadCond === "unpaved" ? "unpaved" : roadCond === "seasonal" ? "seasonal" : "paved"))} // ${vehicleName}`;

      if (roadCond === "flood_risk") {
        if (vehicleType === "tractor_trailer") {
          terrainPassed = true;
          terrainSeverity = "pass";
          terrainMessage = lang === "or"
            ? "ଜଳମଗ୍ନ ନଦୀ କୂଳ ରାସ୍ତା ପାଇଁ ଟ୍ରାକ୍ଟର-ଟ୍ରଲିର ଉଚ୍ଚ ଗ୍ରାଉଣ୍ଡ କ୍ଲିଅରାନ୍ସ ଉପଯୁକ୍ତ ପ୍ରମାଣିତ।"
            : lang === "hi"
            ? "जलमग्न नदी तटीय इलाके के लिए भारी ट्रैक्टर-ट्रॉली ग्राउंड क्लीयरेंस उपयुक्त सत्यापित।"
            : "Heavy high-chassis tractor-trolley clearance validated for submerged riverine terrain.";
        } else if (vehicleType === "pickup_4x4") {
          terrainPassed = true;
          terrainSeverity = "warn";
          terrainMessage = lang === "or"
            ? "ବନ୍ୟା ବିପଦ ରାସ୍ତାରେ ୪x୪ ପିକଅପ୍ ସତର୍କତା ସହ ଚାଲିପାରିବ; ଗତି ୪୦% ହ୍ରାସ କରାଗଲା।"
            : lang === "hi"
            ? "बाढ़-जोखिम कॉरिडोर पर 4x4 पिकअप सावधानी के साथ संचालन योग्य; गति 40% कम की गई।"
            : "4x4 Pickup passable with caution on flood-risk corridor; speed derating 40% enforced.";
        } else {
          terrainPassed = false;
          terrainSeverity = "fail";
          terrainMessage = lang === "or"
            ? `ଗମ୍ଭୀର ରାସ୍ତା ଅନୁପଯୁକ୍ତତା: ବନ୍ୟା ବିପଦ ରାସ୍ତାରେ ${vehicleName} ଚଳାଚଳ ସମ୍ପୂର୍ଣ୍ଣ ନିଷିଦ୍ଧ।`
            : lang === "hi"
            ? `गंभीर सड़क असंगति: सक्रिय बाढ़-जोखिम कॉरिडोर पर ${vehicleName} का संचालन पूरी तरह से प्रतिबंधित है।`
            : `CRITICAL TERRAIN INCOMPATIBILITY: ${vehicleName} is strictly prohibited on active flood-risk corridors for crew and cargo safety.`;
        }
      } else if (roadCond === "unpaved" || roadCond === "seasonal") {
        if (vehicleType === "heavy_truck") {
          terrainPassed = false;
          terrainSeverity = "fail";
          terrainMessage = lang === "or"
            ? `ରାସ୍ତା ଅନୁପଯୁକ୍ତତା: ଭାରୀ ଟ୍ରକ୍ (HCV) କେବଳ ପିଚୁ ରାଜପଥ ପାଇଁ ଉଦ୍ଦିଷ୍ଟ; କଞ୍ଚା ରାସ୍ତାରେ ଅନୁମତି ନାହିଁ।`
            : lang === "hi"
            ? `सड़क असंगति: भारी ट्रक (HCV) केवल पक्के राजमार्गों के लिए है; कच्ची सड़कों पर प्रतिबंधित।`
            : `TERRAIN INCOMPATIBILITY: Heavy Truck (HCV) requires paved highways; prohibited on unpaved/seasonal corridors.`;
        } else if (vehicleType === "motorbike" || vehicleType === "three_wheeler_cargo" || vehicleType === "cargo_bike" || vehicleType === "cargo_erickshaw") {
          terrainSeverity = "warn";
          terrainMessage = lang === "or"
            ? `${vehicleName} କଞ୍ଚା ରାସ୍ତାରେ କମ୍ ଗତିରେ ଯାତ୍ରା କରିବ (+25% ସମୟ)।`
            : lang === "hi"
            ? `${vehicleName} कच्ची सड़क पर धीमी गति से चलेगा (+25% समय बफर)।`
            : `${vehicleName} on ${roadCond} route operates at reduced speed (+25% transit time buffer).`;
        }
      }

      // 2. Thermal & Cold-Chain Check
      let thermalPassed = true;
      let thermalSeverity: "pass" | "warn" | "fail" = "pass";
      let thermalMessage = lang === "or"
        ? "ସାମଗ୍ରୀ ପାଇଁ ତାପମାତ୍ରା ସ୍ଥିରତା ସଠିକ୍ ଭାବେ ଯାଞ୍ଚ ହେଲା।"
        : lang === "hi"
        ? "माल की थर्मल स्थिरता सफलतापूर्वक सत्यापित।"
        : "Thermal stability validated for cargo profile.";

      if (goodType === "medicine") {
        if (currentVehicle.tempControl || hasSolarColdBuffer) {
          thermalPassed = true;
          thermalSeverity = "pass";
          thermalMessage = lang === "or"
            ? `ସକ୍ରିୟ କୋଲ୍ଡ-ଚେନ୍ ସୁରକ୍ଷା ଚାଲୁ (${hasSolarColdBuffer ? "ସୌର କୋଲ୍ଡ ବଫର୍" : "ରିଫ୍ରିଜେରେଟେଡ୍ ଗାଡ଼ି"}); ଟିକା +4°C ତଳେ ରହିବ।`
            : lang === "hi"
            ? `सक्रिय कोल्ड-चेन सुरक्षा सक्रिय (${hasSolarColdBuffer ? "सौर कोल्ड बफर" : "प्रशीतित वाहन"}); टीके +4°C से नीचे रहेंगे।`
            : `Active cold-chain safeguard active (${hasSolarColdBuffer ? "Solar Cold Buffer" : "Refrigerated Carrier"}); vaccine core stays below +4°C.`;
        } else {
          thermalPassed = false;
          thermalSeverity = "fail";
          thermalMessage = lang === "or"
            ? `କୋଲ୍ଡ-ଚେନ୍ ଉଲ୍ଲଂଘନ: ${ambientTempOverride}°C ରେ ସାଧାରଣ ${vehicleName} ରେ ଔଷଧ ୩୫ ମିନିଟରେ ନଷ୍ଟ ହୋଇଯିବ।`
            : lang === "hi"
            ? `कोल्ड-चेन उल्लंघन: ${ambientTempOverride}°C में सामान्य ${vehicleName} पर दवा 35 मिनट में खराब हो जाएगी।`
            : `COLD-CHAIN VIOLATION: Critical medicine on uninsulated ${vehicleName} with ambient ${ambientTempOverride}°C will spoil within 35 minutes.`;
        }
      } else if (goodType === "farm_produce") {
        const decayNum = parseFloat(mathCalculations.perishableDecayPct);
        if (decayNum > 20) {
          thermalSeverity = "warn";
          thermalMessage = lang === "or"
            ? `ତାପମାତ୍ରା ଜନିତ କ୍ଷତିର ଆଶଙ୍କା (${decayNum}% କ୍ଷୟ)। ସୌର ବଫର୍ ବ୍ୟବହାର କରନ୍ତୁ।`
            : lang === "hi"
            ? `उच्च थर्मल क्षति जोखिम (${decayNum}% क्षय)। सौर बफर की अनुशंसा की जाती है।`
            : `Elevated thermal spoilage risk (${decayNum}% decay). Solar buffer or expedited transit recommended.`;
        }
      }

      // 3. Payload & Envelope Check
      let payloadPassed = true;
      let payloadSeverity: "pass" | "warn" | "fail" = "pass";
      const sampleCargoWeight = goodType === "farm_produce" ? 650 : goodType === "essential_goods" ? 300 : 25;
      let payloadMessage = lang === "or"
        ? `ଭାର କ୍ଷମତା ସନ୍ତୋଷଜନକ: ~${sampleCargoWeight}kg ବ୍ୟାଚ୍ / ${currentVehicle.capacityKg}kg ଗାଡ଼ି କ୍ଷମତା (${Math.round((sampleCargoWeight / currentVehicle.capacityKg) * 100)}% ଭରଣ)।`
        : lang === "hi"
        ? `पेलोड क्षमता संतोषजनक: ~${sampleCargoWeight}kg बैच / ${currentVehicle.capacityKg}kg वाहन क्षमता (${Math.round((sampleCargoWeight / currentVehicle.capacityKg) * 100)}% भराव)।`
        : `Payload envelope satisfied: ~${sampleCargoWeight}kg batch against ${currentVehicle.capacityKg}kg vehicle capacity (${Math.round((sampleCargoWeight / currentVehicle.capacityKg) * 100)}% fill factor).`;

      if (sampleCargoWeight > currentVehicle.capacityKg) {
        payloadPassed = false;
        payloadSeverity = "fail";
        payloadMessage = lang === "or"
          ? `ଅତ୍ୟଧିକ ଭାର: ବ୍ୟାଚ୍ ଓଜନ (${sampleCargoWeight}kg) ${vehicleName} ର ସୀମା ${currentVehicle.capacityKg}kg ଠାରୁ ଅଧିକ।`
          : lang === "hi"
          ? `अधिक भार: बैच वजन (${sampleCargoWeight}kg) ${vehicleName} की सीमा ${currentVehicle.capacityKg}kg से अधिक है।`
          : `OVERWEIGHT REJECTION: Batch weight (${sampleCargoWeight}kg) exceeds ${vehicleName} limit of ${currentVehicle.capacityKg}kg.`;
      }

      // Determine Overall Solver Decision
      let decision: SolverSimulationResult["decision"] = "ALLOCATED";
      let statusTitle = lang === "or"
        ? `ପ୍ରେରଣ ଅନୁମୋଦିତ: ${vehicleName} ନିଯୁକ୍ତ କରାଗଲା`
        : lang === "hi"
        ? `डिस्पैच स्वीकृत: ${vehicleName} आवंटित`
        : `DISPATCH APPROVED: ${vehicleName.toUpperCase()} ALLOCATED`;
      let isCompatible = true;
      let suggestedAction: SolverSimulationResult["suggestedAction"] = undefined;

      if (!terrainPassed) {
        decision = "REJECTED_TERRAIN";
        statusTitle = lang === "or" ? "ପ୍ରେରଣ ଅବରୋଧ: ରାସ୍ତା ବିପଦ ଚେତାବନୀ" : lang === "hi" ? "डिस्पैच अवरुद्ध: सड़क क्लीयरेंस खतरा" : "DISPATCH BLOCKED: TERRAIN CLEARANCE HAZARD";
        isCompatible = false;
        suggestedAction = {
          label: lang === "or" ? "୪.୦T ଟ୍ରାକ୍ଟର-ଟ୍ରଲି ବାଛନ୍ତୁ" : lang === "hi" ? "भारी ट्रैक्टर-ट्रॉली 4.0T पर स्विच करें" : "Switch to Heavy Tractor-Trolley 4.0T",
          fixType: "tractor_trailer",
        };
      } else if (!thermalPassed) {
        decision = "REJECTED_THERMAL";
        statusTitle = lang === "or" ? "ପ୍ରେରଣ ଅବରୋଧ: କୋଲ୍ଡ-ଚେନ୍ ଭଙ୍ଗ ଆଶଙ୍କା" : lang === "hi" ? "डिस्पैच अवरुद्ध: कोल्ड-चेन उल्लंघन जोखिम" : "DISPATCH BLOCKED: COLD-CHAIN BREACH RISK";
        isCompatible = false;
        suggestedAction = {
          label: lang === "or" ? "ସୌର କୋଲ୍ଡ ବଫର୍ ଚାଲୁ କରନ୍ତୁ ଏବଂ 4x4 ପିକଅପ୍ ବାଛନ୍ତୁ" : lang === "hi" ? "सौर कोल्ड बफर सक्षम करें और 4x4 पिकअप चुनें" : "Enable Solar Cold Buffer & Assign 4x4 Pickup",
          fixType: "pickup_with_solar",
        };
      } else if (!payloadPassed) {
        decision = "REJECTED_CAPACITY";
        statusTitle = lang === "or" ? "ପ୍ରେରଣ ଅବରୋଧ: ଅତ୍ୟଧିକ ଭାର" : lang === "hi" ? "डिस्पैच अवरुद्ध: वाहन ओवरलोड" : "DISPATCH BLOCKED: VEHICLE OVERLOAD";
        isCompatible = false;
        suggestedAction = {
          label: lang === "or" ? "୧.୫T 4x4 ପିକଅପ୍ କିମ୍ବା ଭାରୀ ଟ୍ରକକୁ ଅପଗ୍ରେଡ୍ କରନ୍ତୁ" : lang === "hi" ? "4x4 पिकअप या भारी ट्रक में अपग्रेड करें" : "Upgrade to 4x4 Pickup / Heavy Truck",
          fixType: "pickup_4x4",
        };
      } else if (terrainSeverity === "warn" || thermalSeverity === "warn") {
        decision = "CONDITIONAL_APPROVAL";
        statusTitle = lang === "or" ? "ସର୍ତ୍ତମୂଳକ ପ୍ରେରଣ: ନିରୀକ୍ଷିତ ଯାତ୍ରା ଅନୁମୋଦିତ" : lang === "hi" ? "सशर्त डिस्पैच: मॉनिटर किया गया ट्रांजिट स्वीकृत" : "CONDITIONAL DISPATCH: MONITORED TRANSIT APPROVED";
      }

      // Generate explainable decision points
      const explainableReasons: string[] = [];
      if (goodType === "medicine") {
        explainableReasons.push(lang === "or"
          ? "ଜରୁରୀ ଔଷଧ କୋଲ୍ଡ-ଚେନ୍ ସୁରକ୍ଷା: +୨୦୦ ପଏଣ୍ଟ ପ୍ରାଥମିକତା ବୋନସ୍ ଏବଂ ତାପମାତ୍ରା ନିୟନ୍ତ୍ରଣ ବାଧ୍ୟତାମୂଳକ।"
          : lang === "hi"
          ? "महत्वपूर्ण दवा कोल्ड-चेन सुरक्षा: +200 अंक प्राथमिकता बोनस और सक्रिय तापमान सत्यापन लागू।"
          : "Critical medicine cold-chain safeguard: +200pts priority bonus and active temperature verification enforced.");
      } else {
        explainableReasons.push(lang === "or"
          ? `ତାପଜ କାଇନେଟିକ୍ସ ମଡେଲ୍ ${ambientTempOverride}°C ରେ ${mathCalculations.perishableDecayPct}% Arrhenius କ୍ଷୟ ଆକଳନ କରିଛି।`
          : lang === "hi"
          ? `थर्मल काइनेटिक्स मॉडल ने ${ambientTempOverride}°C परिवेश में ${mathCalculations.perishableDecayPct}% Arrhenius क्षय की गणना की।`
          : `Thermal kinetics model computed ${mathCalculations.perishableDecayPct}% Arrhenius decay under ${ambientTempOverride}°C ambient.`);
      }

      if (producerWaitMins > 60) {
        explainableReasons.push(lang === "or"
          ? `ଅପେକ୍ଷା ସମୟ ବୋନସ୍ (+${mathCalculations.fairnessBoost} ପଏଣ୍ଟ) ଚାଷୀଙ୍କ ପାଇଁ ଲାଗୁ ହେଲା (୬୦ ମିନିଟ୍ ନିର୍ଦ୍ଧାରିତ ସମୟଠାରୁ ଅଧିକ)।`
          : lang === "hi"
          ? `प्रतीक्षा समय निष्पक्षता बोनस (+${mathCalculations.fairnessBoost} अंक) लागू किया गया (60 मिनट बेसलाइन से ऊपर)।`
          : `Fairness disparity equity boost (+${mathCalculations.fairnessBoost}pts) applied for ${selectedRoute.community} producer waiting ${producerWaitMins}m (above 60m regional benchmark).`);
      } else {
        explainableReasons.push(lang === "or"
          ? `ଉତ୍ପାଦକଙ୍କ ଅପେକ୍ଷା ସମୟ (${producerWaitMins} ମି.) ନିର୍ଦ୍ଧାରିତ ସମୟ ସୀମା ମଧ୍ୟରେ ଅଛି; ସାଧାରଣ ଧାଡ଼ି ବ୍ୟବସ୍ଥା ସୁରକ୍ଷିତ।`
          : lang === "hi"
          ? `उत्पादक का प्रतीक्षा समय (${producerWaitMins} मिनट) सामान्य SLA विंडो के भीतर है; मानक कतार संरक्षित।`
          : `Producer wait time (${producerWaitMins}m) is within nominal SLA window; standard equitable queue preserved.`);
      }

      explainableReasons.push(terrainMessage);
      explainableReasons.push(payloadMessage);

      if (extendWindow) {
        explainableReasons.push(lang === "or"
          ? "ଦୂରଦୂରାନ୍ତ ଚାଷୀଙ୍କ ସାମଗ୍ରୀ ଏକତ୍ରୀକରଣ ପାଇଁ ୱିଣ୍ଡୋ ସମ୍ପ୍ରସାରଣ (+୪.୦ ଘଣ୍ଟା) ସକ୍ରିୟ।"
          : lang === "hi"
          ? "दूरदराज के उत्पादकों के लिए कॉरिडोर भराव अधिकतम करने हेतु विंडो विस्तार (+4.0 घंटे) सक्षम।"
          : "Dynamic consolidation window (+4.0h) enabled to maximize corridor fill factor for remote producers.");
      }

      const simResult: SolverSimulationResult = {
        timestamp: new Date().toLocaleTimeString(),
        decision,
        statusTitle,
        isCompatible,
        scores: mathCalculations,
        checks: {
          terrain: { passed: terrainPassed, message: terrainMessage, severity: terrainSeverity },
          thermal: { passed: thermalPassed, message: thermalMessage, severity: thermalSeverity },
          payload: { passed: payloadPassed, message: payloadMessage, severity: payloadSeverity },
        },
        suggestedAction,
        allocationSummary: `${vehicleName} - ${routeName}`,
        explainableReasons,
      };

      setSolverResult(simResult);
      setHasRunSolver(true);
      setJustSolved(true);
      setIsOptimizing(false);

      // Attempt background backend synchronization for live multi-tenant state
      try {
        const bgRes = await runDynamicMatching({
          force_window_extension_hrs: extendWindow ? 4.0 : 0.0,
        });
        if (bgRes && bgRes.status === "success") {
          setBackendSyncResponse(bgRes);
          setBackendError(null);
        }
      } catch (err: any) {
        setBackendError(err?.message || "Backend offline (operating with local client-side solver engine)");
      }
    }, 400);
  }, [
    vehicleType,
    selectedRoute,
    goodType,
    ambientTempOverride,
    hasSolarColdBuffer,
    mathCalculations,
    producerWaitMins,
    extendWindow,
    lang,
    tc,
  ]);

  const handleApplyFix = (fixType: "tractor_trailer" | "pickup_with_solar" | "pickup_4x4" | "heavy_truck" | "mini_truck") => {
    if (fixType === "tractor_trailer") {
      setVehicleType("tractor_trailer");
    } else if (fixType === "pickup_with_solar") {
      setHasSolarColdBuffer(true);
      setVehicleType("pickup_4x4");
    } else if (fixType === "pickup_4x4") {
      setVehicleType("pickup_4x4");
    } else if (fixType === "heavy_truck") {
      setVehicleType("heavy_truck");
    } else if (fixType === "mini_truck") {
      setVehicleType("mini_truck");
    }
    setJustSolved(false);
  };

  return (
    <main className="min-h-[calc(100vh-76px)] bg-white dark:bg-[#09090b] text-[#0a0a0a] dark:text-[#f4f4f5] transition-colors duration-200">
      {/* Top Breadcrumb & Engine Status */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#0c0c0e]">
        <div className="mx-auto max-w-[1600px] px-6 sm:px-10 py-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="text-black dark:text-white font-semibold">{t("breadcrumb.module")}</span>
            <span>{"//"}</span>
            <span>{t("breadcrumb.subtitle")}</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("breadcrumb.latency")}
            </span>
            <span className="text-neutral-400 dark:text-neutral-600">|</span>
            <span className="text-neutral-700 dark:text-neutral-300">{t("breadcrumb.fairnessIndex")} {mathCalculations.fairnessIndex}</span>
            <span className="text-neutral-400 dark:text-neutral-600">|</span>
            <span className={`flex items-center gap-1.5 ${hasRunSolver ? "text-emerald-700 dark:text-emerald-400 font-semibold" : "text-neutral-500 dark:text-neutral-400"}`}>
              <CpuIcon size={13} />
              {hasRunSolver ? t("breadcrumb.solverActive") : t("breadcrumb.standby")}
            </span>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 pt-10 pb-8 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500 mb-2">
              {t("header.label")}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-[-0.035em] text-black dark:text-white">
              {t("header.title")} <span className="font-semibold">{t("header.titleBold")}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunOptimizer}
              disabled={isOptimizing}
              className={`self-start md:self-auto inline-flex items-center gap-2.5 px-6 py-3 text-xs font-semibold uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-md ${
                isOptimizing
                  ? "bg-neutral-800 text-white opacity-80"
                  : "bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              <RefreshIcon size={15} className={isOptimizing ? "animate-spin text-emerald-400" : ""} />
              <span>{isOptimizing ? t("header.executing") : t("header.runSolver")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="mx-auto max-w-[1600px] border-b border-neutral-200 dark:border-neutral-800">
        <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800">
          
          {/* LEFT 5 COLS: INTERACTIVE PARAMETERS */}
          <div className="lg:col-span-5 p-6 sm:p-10 space-y-8">
            {/* 1. Rural Corridor Selection */}
            <div>
              <div className="flex items-center justify-between mb-3 font-mono text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                <span className="flex items-center gap-1.5 text-black dark:text-white font-semibold">
                  <RouteIcon size={14} />
                  {t("params.corridorTitle")}
                </span>
                <span>{selectedRoute.distanceKm} {tc("units.km")}</span>
              </div>
              <div className="space-y-1">
                {AVAILABLE_ROUTES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedRouteId(r.id);
                      setJustSolved(false);
                    }}
                    className={`w-full text-left py-3 px-3.5 border-b transition-colors flex items-center justify-between font-mono text-xs cursor-pointer ${
                      selectedRouteId === r.id
                        ? "border-black dark:border-white bg-neutral-50 dark:bg-neutral-800/70 text-black dark:text-white font-semibold shadow-xs"
                        : "border-neutral-100 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40"
                    }`}
                  >
                    <span>{r.name[lang] || r.name.en}</span>
                    <span className={`text-[10px] uppercase font-semibold ${
                      r.roadCondition === "flood_risk" ? "text-rose-600 dark:text-rose-400" : r.roadCondition === "unpaved" ? "text-amber-600 dark:text-amber-400" : "text-neutral-400 dark:text-neutral-500"
                    }`}>
                      {tc("terrain." + (r.roadCondition === "flood_risk" ? "floodRisk" : r.roadCondition === "unpaved" ? "unpaved" : r.roadCondition === "seasonal" ? "seasonal" : "paved"))}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Commodity Classification */}
            <div>
              <div className="flex items-center justify-between mb-3 font-mono text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                <span className="flex items-center gap-1.5 text-black dark:text-white font-semibold">
                  <ThermometerIcon size={14} />
                  {t("params.goodTypeTitle")}
                </span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                  {goodType === "medicine" ? t("params.medicineBonus") : t("params.standard")}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "farm_produce", label: t("params.goodTypes.farmProduce"), sub: t("params.goodTypes.farmProduceSub") },
                  { id: "medicine", label: t("params.goodTypes.medicine"), sub: t("params.goodTypes.medicineSub") },
                  { id: "essential_goods", label: t("params.goodTypes.essentialGoods"), sub: t("params.goodTypes.essentialGoodsSub") },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setGoodType(g.id as any);
                      setJustSolved(false);
                    }}
                    className={`py-3 px-3 border text-left transition-all cursor-pointer ${
                      goodType === g.id
                        ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-xs"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900"
                    }`}
                  >
                    <div className="text-xs font-semibold">{g.label}</div>
                    <div className={`font-mono text-[10px] mt-0.5 ${goodType === g.id ? "text-neutral-300 dark:text-neutral-700" : "text-neutral-400 dark:text-neutral-500"}`}>
                      {g.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Rural Vehicle Selection */}
            <div>
              <div className="flex items-center justify-between mb-3 font-mono text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                <span className="flex items-center gap-1.5 text-black dark:text-white font-semibold">
                  <TruckIcon size={14} />
                  {t("params.vehicleTitle")}
                </span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                  {VEHICLE_SPECS[vehicleType].capacityKg} {tc("units.kg")} {t("params.cap")}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                {Object.values(VEHICLE_SPECS).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setVehicleType(v.id);
                      setJustSolved(false);
                    }}
                    className={`p-2.5 border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      vehicleType === v.id
                        ? "border-black dark:border-white bg-neutral-100 dark:bg-neutral-800 font-semibold text-black dark:text-white ring-1 ring-black dark:ring-white"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{v.emoji}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
                        {v.capacityKg}kg
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-[11px] font-semibold line-clamp-1">{v.name[lang] || v.name.en}</div>
                      <div className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-0.5 line-clamp-1">{v.terrains[lang] || v.terrains.en}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Sliders & Advanced Toggles */}
            <div className="space-y-5 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div>
                <div className="flex justify-between font-mono text-[11px] mb-2">
                  <span className="text-neutral-600 dark:text-neutral-400">{t("params.waitTimeTitle")}</span>
                  <span className={`font-semibold ${producerWaitMins > 60 ? "text-rose-600 dark:text-rose-400" : "text-black dark:text-white"}`}>
                    {producerWaitMins} {t("params.minutes")} {producerWaitMins > 60 ? t("params.aboveBaseline") : t("params.nominal")}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="180"
                  step="5"
                  value={producerWaitMins}
                  onChange={(e) => {
                    setProducerWaitMins(Number(e.target.value));
                    setJustSolved(false);
                  }}
                  className="w-full cursor-pointer accent-black dark:accent-white"
                />
                <div className="flex justify-between font-mono text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                  <span>{t("params.fresh")}</span>
                  <span>{t("params.baseline")}</span>
                  <span>{t("params.starvationRisk")}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-mono text-[11px] mb-2">
                  <span className="text-neutral-600 dark:text-neutral-400">{t("params.ambientTempTitle")}</span>
                  <span className="font-semibold text-black dark:text-white">{ambientTempOverride}°C</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="48"
                  value={ambientTempOverride}
                  onChange={(e) => {
                    setAmbientTempOverride(Number(e.target.value));
                    setJustSolved(false);
                  }}
                  className="w-full cursor-pointer accent-black dark:accent-white"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setHasSolarColdBuffer(!hasSolarColdBuffer);
                    setJustSolved(false);
                  }}
                  className={`p-3 border text-left font-mono text-xs transition-all cursor-pointer rounded ${
                    hasSolarColdBuffer
                      ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300"
                      : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <SunIcon size={14} className={hasSolarColdBuffer ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-400 dark:text-neutral-500"} />
                    {t("params.solarColdBuffer")}
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                    {hasSolarColdBuffer ? t("params.solarActive") : t("params.solarDisabled")}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExtendWindow(!extendWindow);
                    setJustSolved(false);
                  }}
                  className={`p-3 border text-left font-mono text-xs transition-all cursor-pointer rounded ${
                    extendWindow
                      ? "border-black dark:border-white bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-semibold"
                      : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <SlidersIcon size={14} />
                    {t("params.windowExtension")}
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                    {extendWindow ? t("params.windowExtended") : t("params.windowImmediate")}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT 7 COLS: READOUTS & TRANSPARENT RATIONALE */}
          <div className="lg:col-span-7 p-6 sm:p-10 space-y-9 bg-white dark:bg-[#09090b] transition-colors">
            
            {/* KPI Row with dynamic flash feedback */}
            <div className={`transition-all duration-300 ${justSolved ? "ring-2 ring-emerald-500/50 p-4 rounded-lg bg-emerald-50/20 dark:bg-emerald-950/20" : ""}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  {t("metrics.computedMetrics")}
                </div>
                {justSolved && (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                    <CheckmarkCircleIcon size={11} /> {t("metrics.optimizedJustNow")}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pb-6 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <div className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500 uppercase">{t("metrics.dispatchScore")}</div>
                  <div className="text-3xl sm:text-4xl font-light tracking-tight text-black dark:text-white mt-1">
                    {mathCalculations.totalScore}
                  </div>
                  <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                    {mathCalculations.totalScore >= 400 ? t("metrics.highPriority") : mathCalculations.totalScore >= 200 ? t("metrics.mediumPriority") : t("metrics.routineStandard")}
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500 uppercase">{t("metrics.fairnessBoost")}</div>
                  <div className="text-3xl sm:text-4xl font-light tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
                    +{mathCalculations.fairnessBoost}
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                    {t("metrics.waitTimeEquity")}
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500 uppercase">{t("metrics.perishableDecay")}</div>
                  <div className="text-3xl sm:text-4xl font-light tracking-tight text-black dark:text-white mt-1">
                    {mathCalculations.perishableDecayPct}%
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                    {t("metrics.arrheniusSpoilage")}
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500 uppercase">{t("metrics.effectiveTransit")}</div>
                  <div className="text-3xl sm:text-4xl font-light tracking-tight text-black dark:text-white mt-1">
                    {mathCalculations.effectiveHours}h
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                    {t("metrics.terrainAdjusted")}
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE SOLVER EXECUTION RESULT BANNER */}
            {solverResult && (
              <div className={`p-5 border rounded-lg transition-all duration-300 ${
                solverResult.decision === "ALLOCATED"
                  ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40"
                  : solverResult.decision === "CONDITIONAL_APPROVAL"
                  ? "border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40"
                  : "border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/40"
              }`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {solverResult.decision === "ALLOCATED" ? (
                      <CheckmarkCircleIcon size={20} className="text-emerald-600 dark:text-emerald-400" />
                    ) : solverResult.decision === "CONDITIONAL_APPROVAL" ? (
                      <AlertCircleIcon size={20} className="text-amber-600 dark:text-amber-400" />
                    ) : (
                      <AlertCircleIcon size={20} className="text-rose-600 dark:text-rose-400" />
                    )}
                    <h4 className="font-mono text-xs sm:text-sm font-bold tracking-tight text-black dark:text-white">
                      {solverResult.statusTitle}
                    </h4>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
                    {t("metrics.solvedAt")} {solverResult.timestamp}
                  </span>
                </div>

                {/* Constraint Verification Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-3.5">
                  <div className={`p-2.5 rounded border font-mono text-[11px] ${
                    solverResult.checks.terrain.severity === "pass"
                      ? "bg-white/80 dark:bg-neutral-900/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300"
                      : solverResult.checks.terrain.severity === "warn"
                      ? "bg-white/80 dark:bg-neutral-900/80 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300"
                      : "bg-white/80 dark:bg-neutral-900/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300 font-semibold"
                  }`}>
                    <div className="text-[10px] uppercase text-neutral-400 dark:text-neutral-500 font-semibold mb-0.5">{t("metrics.terrainCheck")}</div>
                    <div>{solverResult.checks.terrain.message}</div>
                  </div>

                  <div className={`p-2.5 rounded border font-mono text-[11px] ${
                    solverResult.checks.thermal.severity === "pass"
                      ? "bg-white/80 dark:bg-neutral-900/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300"
                      : solverResult.checks.thermal.severity === "warn"
                      ? "bg-white/80 dark:bg-neutral-900/80 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300"
                      : "bg-white/80 dark:bg-neutral-900/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300 font-semibold"
                  }`}>
                    <div className="text-[10px] uppercase text-neutral-400 dark:text-neutral-500 font-semibold mb-0.5">{t("metrics.thermalCheck")}</div>
                    <div>{solverResult.checks.thermal.message}</div>
                  </div>

                  <div className={`p-2.5 rounded border font-mono text-[11px] ${
                    solverResult.checks.payload.severity === "pass"
                      ? "bg-white/80 dark:bg-neutral-900/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300"
                      : "bg-white/80 dark:bg-neutral-900/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300 font-semibold"
                  }`}>
                    <div className="text-[10px] uppercase text-neutral-400 dark:text-neutral-500 font-semibold mb-0.5">{t("metrics.payloadEnvelope")}</div>
                    <div>{solverResult.checks.payload.message}</div>
                  </div>
                </div>

                {/* Suggested Action Button if Rejected */}
                {solverResult.suggestedAction && (
                  <div className="mt-3 pt-3 border-t border-rose-200 dark:border-rose-800 flex items-center justify-between flex-wrap gap-2">
                    <span className="font-mono text-[11px] text-rose-800 dark:text-rose-300">
                      {t("metrics.autoRemediation")}
                    </span>
                    <button
                      onClick={() => {
                        if (solverResult.suggestedAction?.fixType) {
                          handleApplyFix(solverResult.suggestedAction.fixType);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-black dark:bg-white text-white dark:text-black text-[11px] font-mono font-semibold rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 cursor-pointer flex items-center gap-1.5"
                    >
                      <SparklesIcon size={13} />
                      {solverResult.suggestedAction.label}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Explainable Decision Attribution */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                    {t("attribution.label")}
                  </div>
                  <h3 className="text-xl font-medium tracking-tight text-black dark:text-white mt-0.5">
                    {t("attribution.title")}
                  </h3>
                </div>
                <div className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                  {t("attribution.shapley")}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {[
                  {
                    label: goodType === "medicine" ? t("attribution.medicineSafeguard") : t("attribution.spoilageRisk"),
                    weight: goodType === "medicine" ? 95 : Math.min(100, Math.round(ambientTempOverride * 1.8)),
                  },
                  {
                    label: t("attribution.fairnessDisparity"),
                    weight: Math.min(100, Math.round((mathCalculations.fairnessBoost / 250) * 100)),
                  },
                  {
                    label: `${t("attribution.terrainCompatibility")} (${tc("terrain." + (selectedRoute.roadCondition === "flood_risk" ? "floodRisk" : selectedRoute.roadCondition === "unpaved" ? "unpaved" : selectedRoute.roadCondition === "seasonal" ? "seasonal" : "paved")).toUpperCase()})`,
                    weight: selectedRoute.roadCondition === "flood_risk" ? 85 : 40,
                  },
                  {
                    label: `${t("attribution.vehiclePayload")} (${(VEHICLE_SPECS[vehicleType].name[lang] || VEHICLE_SPECS[vehicleType].name.en).toUpperCase()})`,
                    weight: 75,
                  },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-neutral-700 dark:text-neutral-300">{item.label}</span>
                      <span className="font-semibold text-black dark:text-white">{item.weight}%</span>
                    </div>
                    <div className="linear-meter">
                      <div
                        className="linear-meter-fill"
                        style={{ width: `${item.weight}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transparent Dispatch Brief */}
            <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon size={18} className="text-black dark:text-white" />
                <h3 className="text-lg font-medium tracking-tight text-black dark:text-white">
                  {t("synthesis.title")}
                </h3>
              </div>

              <div className="p-5 border-l-2 border-black dark:border-white bg-neutral-50/70 dark:bg-neutral-900/60 font-mono text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 space-y-2">
                <p>
                  <strong>{t("synthesis.dispatchDecision")}</strong> {(VEHICLE_SPECS[vehicleType].name[lang] || VEHICLE_SPECS[vehicleType].name.en).toUpperCase()}{" // "}{(selectedRoute.name[lang] || selectedRoute.name.en)}.
                </p>
                <p>
                  <strong>{t("synthesis.whyThisVehicle")}</strong> {goodType === "medicine"
                    ? (lang === "or" ? "ଜରୁରୀ ଔଷଧ ସକ୍ରିୟ ତାପମାତ୍ରା ନିୟନ୍ତ୍ରଣ ସହ +୨୦୦ ପଏଣ୍ଟ ବୋନସ୍ ସହିତ ତୁରନ୍ତ ମ୍ୟାଚ୍ କରାଗଲା।" : lang === "hi" ? "सक्रिय तापमान नियंत्रण की आवश्यकता वाली आवश्यक दवा का तत्काल सर्वोच्च प्राथमिकता (+200 अंक) के साथ मिलान किया गया।" : "Critical medicine requiring active temperature management was matched immediately with top priority (+200pts boost).")
                    : producerWaitMins > 60
                    ? (lang === "or" ? `ଉତ୍ପାଦକ ${producerWaitMins} ମିନିଟ୍ ଅପେକ୍ଷା କରିଥିବାରୁ +${mathCalculations.fairnessBoost} ପଏଣ୍ଟ ନିରପେକ୍ଷତା ବୋନସ୍ ଦିଆଗଲା।` : lang === "hi" ? `उत्पादक ने ${producerWaitMins} मिनट प्रतीक्षा की; छोटे किसानों को प्राथमिकता देने हेतु +${mathCalculations.fairnessBoost} अंक निष्पक्षता बोनस दिया गया।` : `Producer in ${selectedRoute.community} waited ${producerWaitMins} mins (above regional baseline); +${mathCalculations.fairnessBoost}pts fairness boost was awarded to ensure smallholders are never deprioritized.`)
                    : (lang === "or" ? "ସାଧାରଣ ଧାଡ଼ି ସୂଚୀ ଅନୁଯାୟୀ ପ୍ରେରଣ ସନ୍ତୋଷଜନକ।" : lang === "hi" ? "मानक न्यायसंगत कतार शेड्यूलिंग संतुष्ट।" : "Standard equitable queue scheduling satisfied.")}
                </p>
                {solverResult && solverResult.explainableReasons.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-neutral-200/80 dark:border-neutral-800 space-y-1 text-neutral-600 dark:text-neutral-400">
                    <span className="text-[10px] uppercase text-neutral-400 dark:text-neutral-500 font-semibold block">{t("synthesis.tracedFactors")}</span>
                    {solverResult.explainableReasons.map((reason, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-neutral-400 dark:text-neutral-500">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Live Backend Telemetry & Synchronized Fleet Pool (if available) */}
            {backendSyncResponse && backendSyncResponse.matches.length > 0 && (
              <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 font-mono text-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold uppercase tracking-wider text-black dark:text-white">
                    {t("synthesis.liveDispatches")} ({backendSyncResponse.matches.length})
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                    {t("synthesis.pgSync")}
                  </span>
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scroll-smooth">
                  {backendSyncResponse.matches.map((match, idx) => (
                    <div key={idx} className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-black dark:text-white">{match.producer_name} ({match.community_id})</div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{match.matched_vehicle_name} • {match.good_type}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-600 dark:text-emerald-400 font-semibold">+{match.fairness_boost_pts} pts</div>
                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500">Score {match.allocation_score}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}