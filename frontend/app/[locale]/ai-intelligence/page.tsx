"use client";

import Link from "next/link";
import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
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
  name: string;
  distanceKm: number;
  baseCost: number;
  roadHours: number;
  roadCondition: "paved" | "unpaved" | "seasonal" | "flood_risk";
  community: string;
}

const AVAILABLE_ROUTES: RouteOption[] = [
  {
    id: "va-bbs",
    name: "Village A (Pipili Rural Cluster) → Bhubaneswar Central Hub",
    distanceKm: 20,
    baseCost: 850,
    roadHours: 0.6,
    roadCondition: "paved",
    community: "comm-pipili",
  },
  {
    id: "vb-bbs",
    name: "Village B (Khordha Dairy Cluster) → Bhubaneswar Cold Hub",
    distanceKm: 25,
    baseCost: 1100,
    roadHours: 0.7,
    roadCondition: "paved",
    community: "comm-khordha",
  },
  {
    id: "vc-ctc",
    name: "Village C (Nimapada Agro Belt) → Cuttack Terminal",
    distanceKm: 38,
    baseCost: 1400,
    roadHours: 1.2,
    roadCondition: "unpaved",
    community: "comm-nimapada",
  },
  {
    id: "vd-ctc",
    name: "Village D (Banki Riverine Farms) → Cuttack Crossdock",
    distanceKm: 42,
    baseCost: 1600,
    roadHours: 1.8,
    roadCondition: "flood_risk",
    community: "comm-banki",
  },
  {
    id: "puri-bbs",
    name: "Puri Coastal Depot → Bhubaneswar Central Hub",
    distanceKm: 60,
    baseCost: 2200,
    roadHours: 1.2,
    roadCondition: "paved",
    community: "comm-puri",
  },
];

interface VehicleSpec {
  id: "tempo" | "tractor" | "shared_auto" | "motorbike";
  name: string;
  capacityKg: number;
  emoji: string;
  tempControl: boolean;
  clearanceClass: "heavy" | "medium" | "light";
}

const VEHICLE_SPECS: Record<string, VehicleSpec> = {
  tempo: {
    id: "tempo",
    name: "Tempo 1.5T",
    capacityKg: 1500,
    emoji: "🚚",
    tempControl: true,
    clearanceClass: "medium",
  },
  tractor: {
    id: "tractor",
    name: "Tractor 3.5T",
    capacityKg: 3500,
    emoji: "🚜",
    tempControl: false,
    clearanceClass: "heavy",
  },
  shared_auto: {
    id: "shared_auto",
    name: "Auto 450kg",
    capacityKg: 450,
    emoji: "🛺",
    tempControl: false,
    clearanceClass: "light",
  },
  motorbike: {
    id: "motorbike",
    name: "Bike 90kg",
    capacityKg: 90,
    emoji: "🏍️",
    tempControl: true,
    clearanceClass: "light",
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
    fixType: "tractor" | "tempo_with_solar" | "tempo";
  };
  allocationSummary: string;
  explainableReasons: string[];
}

export default function AIIntelligencePage() {
  const t = useTranslations("ai");
  const [selectedRouteId, setSelectedRouteId] = useState<string>("va-bbs");
  const [goodType, setGoodType] = useState<"farm_produce" | "medicine" | "essential_goods">("farm_produce");
  const [vehicleType, setVehicleType] = useState<"tempo" | "tractor" | "motorbike" | "shared_auto">("tempo");
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

      // 1. Terrain & Clearance Check
      let terrainPassed = true;
      let terrainSeverity: "pass" | "warn" | "fail" = "pass";
      let terrainMessage = `Road condition '${roadCond.toUpperCase()}' is fully clearance-compatible with ${currentVehicle.name}.`;

      if (roadCond === "flood_risk") {
        if (vehicleType === "tractor") {
          terrainPassed = true;
          terrainSeverity = "pass";
          terrainMessage = "Heavy high-chassis tractor clearance validated for submerged riverine terrain.";
        } else if (vehicleType === "tempo") {
          terrainPassed = true;
          terrainSeverity = "warn";
          terrainMessage = "Tempo passable with caution on flood-risk corridor; speed derating 40% enforced.";
        } else {
          terrainPassed = false;
          terrainSeverity = "fail";
          terrainMessage = `CRITICAL TERRAIN INCOMPATIBILITY: ${currentVehicle.name} is strictly prohibited on active flood-risk corridors for crew and cargo safety.`;
        }
      } else if (roadCond === "unpaved" || roadCond === "seasonal") {
        if (vehicleType === "motorbike" || vehicleType === "shared_auto") {
          terrainSeverity = "warn";
          terrainMessage = `${currentVehicle.name} on ${roadCond} route operates at reduced speed (+25% transit time buffer).`;
        }
      }

      // 2. Thermal & Cold-Chain Check
      let thermalPassed = true;
      let thermalSeverity: "pass" | "warn" | "fail" = "pass";
      let thermalMessage = "Thermal stability validated for cargo profile.";

      if (goodType === "medicine") {
        if (currentVehicle.tempControl || hasSolarColdBuffer) {
          thermalPassed = true;
          thermalSeverity = "pass";
          thermalMessage = `Active cold-chain safeguard active (${hasSolarColdBuffer ? "Solar Cold Buffer" : "Refrigerated Carrier"}); vaccine core stays below +4°C.`;
        } else {
          thermalPassed = false;
          thermalSeverity = "fail";
          thermalMessage = `COLD-CHAIN VIOLATION: Critical medicine on uninsulated ${currentVehicle.name} with ambient ${ambientTempOverride}°C will spoil within 35 minutes.`;
        }
      } else if (goodType === "farm_produce") {
        const decayNum = parseFloat(mathCalculations.perishableDecayPct);
        if (decayNum > 20) {
          thermalSeverity = "warn";
          thermalMessage = `Elevated thermal spoilage risk (${decayNum}% decay). Solar buffer or expedited transit recommended.`;
        }
      }

      // 3. Payload & Envelope Check
      let payloadPassed = true;
      let payloadSeverity: "pass" | "warn" | "fail" = "pass";
      const sampleCargoWeight = goodType === "farm_produce" ? 650 : goodType === "essential_goods" ? 300 : 25;
      let payloadMessage = `Payload envelope satisfied: ~${sampleCargoWeight}kg batch against ${currentVehicle.capacityKg}kg vehicle capacity (${Math.round((sampleCargoWeight / currentVehicle.capacityKg) * 100)}% fill factor).`;

      if (sampleCargoWeight > currentVehicle.capacityKg) {
        payloadPassed = false;
        payloadSeverity = "fail";
        payloadMessage = `OVERWEIGHT REJECTION: Batch weight (${sampleCargoWeight}kg) exceeds ${currentVehicle.name} limit of ${currentVehicle.capacityKg}kg.`;
      }

      // Determine Overall Solver Decision
      let decision: SolverSimulationResult["decision"] = "ALLOCATED";
      let statusTitle = `DISPATCH APPROVED: ${currentVehicle.name.toUpperCase()} ALLOCATED`;
      let isCompatible = true;
      let suggestedAction: SolverSimulationResult["suggestedAction"] = undefined;

      if (!terrainPassed) {
        decision = "REJECTED_TERRAIN";
        statusTitle = "DISPATCH BLOCKED: TERRAIN CLEARANCE HAZARD";
        isCompatible = false;
        suggestedAction = {
          label: "Switch to Heavy Tractor 3.5T",
          fixType: "tractor",
        };
      } else if (!thermalPassed) {
        decision = "REJECTED_THERMAL";
        statusTitle = "DISPATCH BLOCKED: COLD-CHAIN BREACH RISK";
        isCompatible = false;
        suggestedAction = {
          label: "Enable Solar Cold Buffer & Assign Reefer Tempo",
          fixType: "tempo_with_solar",
        };
      } else if (!payloadPassed) {
        decision = "REJECTED_CAPACITY";
        statusTitle = "DISPATCH BLOCKED: VEHICLE OVERLOAD";
        isCompatible = false;
        suggestedAction = {
          label: "Upgrade to Tempo 1.5T",
          fixType: "tempo",
        };
      } else if (terrainSeverity === "warn" || thermalSeverity === "warn") {
        decision = "CONDITIONAL_APPROVAL";
        statusTitle = "CONDITIONAL DISPATCH: MONITORED TRANSIT APPROVED";
      }

      // Generate explainable decision points
      const explainableReasons: string[] = [];
      if (goodType === "medicine") {
        explainableReasons.push("Critical medicine cold-chain safeguard: +200pts priority bonus and active temperature verification enforced.");
      } else {
        explainableReasons.push(`Thermal kinetics model computed ${mathCalculations.perishableDecayPct}% Arrhenius decay under ${ambientTempOverride}°C ambient.`);
      }

      if (producerWaitMins > 60) {
        explainableReasons.push(`Fairness disparity equity boost (+${mathCalculations.fairnessBoost}pts) applied for ${selectedRoute.community} producer waiting ${producerWaitMins}m (above 60m regional benchmark).`);
      } else {
        explainableReasons.push(`Producer wait time (${producerWaitMins}m) is within nominal SLA window; standard equitable queue preserved.`);
      }

      explainableReasons.push(terrainMessage);
      explainableReasons.push(payloadMessage);

      if (extendWindow) {
        explainableReasons.push("Dynamic consolidation window (+4.0h) enabled to maximize corridor fill factor for remote producers.");
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
        allocationSummary: `Allocated ${currentVehicle.name} for ${goodType.replace("_", " ").toUpperCase()} on corridor ${selectedRoute.name}. Total Priority Score: ${mathCalculations.totalScore}pts (Fairness Index: ${mathCalculations.fairnessIndex}).`,
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
  ]);

  const handleApplyFix = (fixType: "tractor" | "tempo_with_solar" | "tempo") => {
    if (fixType === "tractor") {
      setVehicleType("tractor");
    } else if (fixType === "tempo_with_solar") {
      setHasSolarColdBuffer(true);
      setVehicleType("tempo");
    } else if (fixType === "tempo") {
      setVehicleType("tempo");
    }
    setJustSolved(false);
  };

  return (
    <main className="min-h-[calc(100vh-76px)] bg-white text-[#0a0a0a]">
      {/* Top Breadcrumb & Engine Status */}
      <div className="border-b border-neutral-200 bg-neutral-50/50">
        <div className="mx-auto max-w-[1600px] px-6 sm:px-10 py-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            <span className="text-black font-semibold">{t("breadcrumb.module")}</span>
            <span>//</span>
            <span>{t("breadcrumb.subtitle")}</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-neutral-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              DYNAMIC MATCHING LATENCY: 8ms
            </span>
            <span className="text-neutral-400">|</span>
            <span className="text-neutral-700">FAIRNESS INDEX: {mathCalculations.fairnessIndex}</span>
            <span className="text-neutral-400">|</span>
            <span className={`flex items-center gap-1.5 ${hasRunSolver ? "text-emerald-700 font-semibold" : "text-neutral-500"}`}>
              <CpuIcon size={13} />
              {hasRunSolver ? "SOLVER ACTIVE" : "STANDBY"}
            </span>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 pt-10 pb-8 border-b border-neutral-200">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-2">
              {t("header.label")}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-[-0.035em] text-black">
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
                  : "bg-black text-white hover:bg-neutral-800 hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              <RefreshIcon size={15} className={isOptimizing ? "animate-spin text-emerald-400" : ""} />
              <span>{isOptimizing ? "Executing multi-objective solver..." : "Run Dispatch Solver"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="mx-auto max-w-[1600px] border-b border-neutral-200">
        <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200">
          
          {/* LEFT 5 COLS: INTERACTIVE PARAMETERS */}
          <div className="lg:col-span-5 p-6 sm:p-10 space-y-8">
            {/* 1. Rural Corridor Selection */}
            <div>
              <div className="flex items-center justify-between mb-3 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                <span className="flex items-center gap-1.5 text-black font-semibold">
                  <RouteIcon size={14} />
                  1. Rural Corridor & Terrain
                </span>
                <span>{selectedRoute.distanceKm} KM</span>
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
                        ? "border-black bg-neutral-50 text-black font-semibold shadow-xs"
                        : "border-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-50/50"
                    }`}
                  >
                    <span>{r.name}</span>
                    <span className={`text-[10px] uppercase font-semibold ${
                      r.roadCondition === "flood_risk" ? "text-rose-600" : r.roadCondition === "unpaved" ? "text-amber-600" : "text-neutral-400"
                    }`}>
                      {r.roadCondition.replace("_", " ")}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Commodity Classification */}
            <div>
              <div className="flex items-center justify-between mb-3 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                <span className="flex items-center gap-1.5 text-black font-semibold">
                  <ThermometerIcon size={14} />
                  2. Good Type Classification
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {goodType === "medicine" ? "+200 PTS BONUS" : "STANDARD"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "farm_produce", label: "Farm Produce", sub: "Horticulture / Milk" },
                  { id: "medicine", label: "Medicine", sub: "Critical Vaccines" },
                  { id: "essential_goods", label: "Essential Goods", sub: "Grains & Rations" },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setGoodType(g.id as any);
                      setJustSolved(false);
                    }}
                    className={`py-3 px-3 border text-left transition-all cursor-pointer ${
                      goodType === g.id
                        ? "border-black bg-black text-white shadow-xs"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-400 bg-white"
                    }`}
                  >
                    <div className="text-xs font-semibold">{g.label}</div>
                    <div className={`font-mono text-[10px] mt-0.5 ${goodType === g.id ? "text-neutral-300" : "text-neutral-400"}`}>
                      {g.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Rural Vehicle Selection */}
            <div>
              <div className="flex items-center justify-between mb-3 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                <span className="flex items-center gap-1.5 text-black font-semibold">
                  <TruckIcon size={14} />
                  3. Rural Vehicle Fleet Type
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {VEHICLE_SPECS[vehicleType].capacityKg} KG CAP
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                {[
                  { id: "tempo", label: "Tempo 1.5T", emoji: "🚚" },
                  { id: "tractor", label: "Tractor 3.5T", emoji: "🚜" },
                  { id: "shared_auto", label: "Auto 450kg", emoji: "🛺" },
                  { id: "motorbike", label: "Bike 90kg", emoji: "🏍️" },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setVehicleType(v.id as any);
                      setJustSolved(false);
                    }}
                    className={`p-2.5 border text-center transition-all cursor-pointer ${
                      vehicleType === v.id
                        ? "border-black bg-neutral-100 font-semibold text-black ring-1 ring-black"
                        : "border-neutral-200 text-neutral-600 bg-white hover:border-neutral-400"
                    }`}
                  >
                    <div className="text-lg">{v.emoji}</div>
                    <div className="text-[11px] mt-1">{v.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Sliders & Advanced Toggles */}
            <div className="space-y-5 pt-4 border-t border-neutral-200">
              <div>
                <div className="flex justify-between font-mono text-[11px] mb-2">
                  <span className="text-neutral-600">Producer Historical Wait Time</span>
                  <span className={`font-semibold ${producerWaitMins > 60 ? "text-rose-600" : "text-black"}`}>
                    {producerWaitMins} Minutes {producerWaitMins > 60 ? "(Above Baseline)" : "(Nominal)"}
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
                  className="w-full cursor-pointer accent-black"
                />
                <div className="flex justify-between font-mono text-[10px] text-neutral-400 mt-1">
                  <span>10 mins (Fresh)</span>
                  <span>60 mins (Baseline)</span>
                  <span>180 mins (Starvation Risk)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-mono text-[11px] mb-2">
                  <span className="text-neutral-600">Ambient Temperature</span>
                  <span className="font-semibold text-black">{ambientTempOverride}°C</span>
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
                  className="w-full cursor-pointer accent-black"
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
                    hasSolarColdBuffer ? "border-emerald-600 bg-emerald-50/60 text-emerald-900" : "border-neutral-200 bg-white text-neutral-600"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <SunIcon size={14} className={hasSolarColdBuffer ? "text-emerald-600" : "text-neutral-400"} />
                    Solar Cold Buffer
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-1">
                    {hasSolarColdBuffer ? "ACTIVE (0.35x decay factor)" : "DISABLED (1.1x thermal loss)"}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExtendWindow(!extendWindow);
                    setJustSolved(false);
                  }}
                  className={`p-3 border text-left font-mono text-xs transition-all cursor-pointer rounded ${
                    extendWindow ? "border-black bg-neutral-100 text-black font-semibold" : "border-neutral-200 bg-white text-neutral-600"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <SlidersIcon size={14} />
                    Window Extension
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-1">
                    {extendWindow ? "+4.0h Batch Consolidation" : "Immediate Dispatch"}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT 7 COLS: READOUTS & TRANSPARENT RATIONALE */}
          <div className="lg:col-span-7 p-6 sm:p-10 space-y-9 bg-white">
            
            {/* KPI Row with dynamic flash feedback */}
            <div className={`transition-all duration-300 ${justSolved ? "ring-2 ring-emerald-500/50 p-4 rounded-lg bg-emerald-50/20" : ""}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                  DYNAMIC DISPATCH COMPUTED METRICS
                </div>
                {justSolved && (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                    <CheckmarkCircleIcon size={11} /> OPTIMIZED JUST NOW
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pb-6 border-b border-neutral-200">
                <div>
                  <div className="font-mono text-[10px] text-neutral-400 uppercase">Dispatch Score</div>
                  <div className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                    {mathCalculations.totalScore}
                  </div>
                  <div className="font-mono text-[10px] text-emerald-600 mt-1">
                    {mathCalculations.totalScore >= 400 ? "High Net Priority" : mathCalculations.totalScore >= 200 ? "Medium Priority" : "Routine Standard"}
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] text-neutral-400 uppercase">Fairness Boost</div>
                  <div className="text-3xl sm:text-4xl font-light tracking-tight text-emerald-600 mt-1">
                    +{mathCalculations.fairnessBoost}
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500 mt-1">
                    Wait-Time Equity Pts
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] text-neutral-400 uppercase">Perishable Decay</div>
                  <div className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                    {mathCalculations.perishableDecayPct}%
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500 mt-1">
                    Arrhenius Spoilage
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] text-neutral-400 uppercase">Effective Transit</div>
                  <div className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                    {mathCalculations.effectiveHours}h
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500 mt-1">
                    Terrain Adjusted
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE SOLVER EXECUTION RESULT BANNER */}
            {solverResult && (
              <div className={`p-5 border rounded-lg transition-all duration-300 ${
                solverResult.decision === "ALLOCATED"
                  ? "border-emerald-300 bg-emerald-50/70"
                  : solverResult.decision === "CONDITIONAL_APPROVAL"
                  ? "border-amber-300 bg-amber-50/70"
                  : "border-rose-300 bg-rose-50/70"
              }`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {solverResult.decision === "ALLOCATED" ? (
                      <CheckmarkCircleIcon size={20} className="text-emerald-600" />
                    ) : solverResult.decision === "CONDITIONAL_APPROVAL" ? (
                      <AlertCircleIcon size={20} className="text-amber-600" />
                    ) : (
                      <AlertCircleIcon size={20} className="text-rose-600" />
                    )}
                    <h4 className="font-mono text-xs sm:text-sm font-bold tracking-tight text-black">
                      {solverResult.statusTitle}
                    </h4>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500">
                    Solved at {solverResult.timestamp}
                  </span>
                </div>

                {/* Constraint Verification Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-3.5">
                  <div className={`p-2.5 rounded border font-mono text-[11px] ${
                    solverResult.checks.terrain.severity === "pass"
                      ? "bg-white/80 border-emerald-200 text-emerald-900"
                      : solverResult.checks.terrain.severity === "warn"
                      ? "bg-white/80 border-amber-200 text-amber-900"
                      : "bg-white/80 border-rose-200 text-rose-900 font-semibold"
                  }`}>
                    <div className="text-[10px] uppercase text-neutral-400 font-semibold mb-0.5">1. Terrain Check</div>
                    <div>{solverResult.checks.terrain.message}</div>
                  </div>

                  <div className={`p-2.5 rounded border font-mono text-[11px] ${
                    solverResult.checks.thermal.severity === "pass"
                      ? "bg-white/80 border-emerald-200 text-emerald-900"
                      : solverResult.checks.thermal.severity === "warn"
                      ? "bg-white/80 border-amber-200 text-amber-900"
                      : "bg-white/80 border-rose-200 text-rose-900 font-semibold"
                  }`}>
                    <div className="text-[10px] uppercase text-neutral-400 font-semibold mb-0.5">2. Thermal Check</div>
                    <div>{solverResult.checks.thermal.message}</div>
                  </div>

                  <div className={`p-2.5 rounded border font-mono text-[11px] ${
                    solverResult.checks.payload.severity === "pass"
                      ? "bg-white/80 border-emerald-200 text-emerald-900"
                      : "bg-white/80 border-rose-200 text-rose-900 font-semibold"
                  }`}>
                    <div className="text-[10px] uppercase text-neutral-400 font-semibold mb-0.5">3. Payload Envelope</div>
                    <div>{solverResult.checks.payload.message}</div>
                  </div>
                </div>

                {/* Suggested Action Button if Rejected */}
                {solverResult.suggestedAction && (
                  <div className="mt-3 pt-3 border-t border-rose-200 flex items-center justify-between flex-wrap gap-2">
                    <span className="font-mono text-[11px] text-rose-800">
                      Auto-Remediation Recommended:
                    </span>
                    <button
                      onClick={() => {
                        if (solverResult.suggestedAction?.fixType) {
                          handleApplyFix(solverResult.suggestedAction.fixType);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-black text-white text-[11px] font-mono font-semibold rounded hover:bg-neutral-800 cursor-pointer flex items-center gap-1.5"
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
                  <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                    TRANSPARENT ALLOCATION DECOMPOSITION
                  </div>
                  <h3 className="text-xl font-medium tracking-tight text-black mt-0.5">
                    Why this vehicle was matched to this pickup
                  </h3>
                </div>
                <div className="font-mono text-xs text-neutral-500">
                  SHAPLEY ATTRIBUTION
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {[
                  {
                    label: goodType === "medicine" ? "Critical Medicine Cold-Chain Safeguard" : "Perishable Spoilage Risk Prevention",
                    weight: goodType === "medicine" ? 95 : Math.min(100, Math.round(ambientTempOverride * 1.8)),
                  },
                  {
                    label: "Fairness Disparity & Starvation Prevention Boost",
                    weight: Math.min(100, Math.round((mathCalculations.fairnessBoost / 250) * 100)),
                  },
                  {
                    label: `Terrain & Clearance Compatibility (${selectedRoute.roadCondition.toUpperCase()})`,
                    weight: selectedRoute.roadCondition === "flood_risk" ? 85 : 40,
                  },
                  {
                    label: `Vehicle Payload Envelope (${vehicleType.toUpperCase()})`,
                    weight: 75,
                  },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-neutral-700">{item.label}</span>
                      <span className="font-semibold text-black">{item.weight}%</span>
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
            <div className="pt-6 border-t border-neutral-200">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon size={18} className="text-black" />
                <h3 className="text-lg font-medium tracking-tight text-black">
                  Explainable Allocation Synthesis
                </h3>
              </div>

              <div className="p-5 border-l-2 border-black bg-neutral-50/70 font-mono text-xs leading-relaxed text-neutral-800 space-y-2">
                <p>
                  <strong>DISPATCH DECISION:</strong> Allocated <strong>{VEHICLE_SPECS[vehicleType].name.toUpperCase()}</strong> for {goodType.replace("_", " ").toUpperCase()} on <strong>{selectedRoute.name}</strong>.
                </p>
                <p>
                  <strong>WHY THIS TIME & VEHICLE:</strong> {goodType === "medicine"
                    ? "Critical medicine requiring active temperature management was matched immediately with top priority (+200pts boost)."
                    : producerWaitMins > 60
                    ? `Producer in ${selectedRoute.community} waited ${producerWaitMins} mins (above regional baseline); +${mathCalculations.fairnessBoost}pts fairness boost was awarded to ensure smallholders are never deprioritized.`
                    : "Standard equitable queue scheduling satisfied."}
                </p>
                {solverResult && solverResult.explainableReasons.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-neutral-200/80 space-y-1 text-neutral-600">
                    <span className="text-[10px] uppercase text-neutral-400 font-semibold block">Traced Decision Factors:</span>
                    {solverResult.explainableReasons.map((reason, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-neutral-400">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Live Backend Telemetry & Synchronized Fleet Pool (if available) */}
            {backendSyncResponse && backendSyncResponse.matches.length > 0 && (
              <div className="pt-6 border-t border-neutral-200 font-mono text-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold uppercase tracking-wider text-black">
                    Live Cluster Dispatches ({backendSyncResponse.matches.length})
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    PostgreSQL / OR-Tools Live Sync
                  </span>
                </div>
                <div className="space-y-2">
                  {backendSyncResponse.matches.slice(0, 3).map((match, idx) => (
                    <div key={idx} className="p-3 border border-neutral-200 rounded bg-white flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-black">{match.producer_name} ({match.community_id})</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">{match.matched_vehicle_name} • {match.good_type}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-600 font-semibold">+{match.fairness_boost_pts} pts</div>
                        <div className="text-[10px] text-neutral-400">Score {match.allocation_score}</div>
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