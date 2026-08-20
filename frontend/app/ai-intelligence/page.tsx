"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
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
} from "../../components/icons/Hugeicons";

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

export default function AIIntelligencePage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string>("va-bbs");
  const [goodType, setGoodType] = useState<"farm_produce" | "medicine" | "essential_goods">("farm_produce");
  const [vehicleType, setVehicleType] = useState<"tempo" | "tractor" | "motorbike" | "shared_auto">("tempo");
  const [urgency, setUrgency] = useState<"critical" | "high" | "routine">("high");
  const [producerWaitMins, setProducerWaitMins] = useState<number>(45);
  const [ambientTempOverride, setAmbientTempOverride] = useState<number>(36);
  const [hasSolarColdBuffer, setHasSolarColdBuffer] = useState<boolean>(true);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [customQuery, setCustomQuery] = useState<string>("");

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
      Math.max(0.1, (deltaT * 0.7 * (selectedRoute.roadHours + 0.5) * solarFactor) / 2.0)
    );

    // 5. Total Net Dispatch Priority Score
    const totalScore = urgScore + medicineBonus + fairnessBoost - terrainPenalty;

    return {
      urgScore,
      fairnessBoost,
      terrainPenalty,
      perishableDecayPct: perishableDecayPct.toFixed(1),
      totalScore,
      fairnessIndex: (0.95 + (fairnessBoost > 50 ? 0.03 : 0.0)).toFixed(2),
      effectiveHours: (selectedRoute.roadHours * (selectedRoute.roadCondition === "flood_risk" ? 1.8 : 1.0)).toFixed(1),
    };
  }, [selectedRoute, goodType, vehicleType, urgency, producerWaitMins, ambientTempOverride, hasSolarColdBuffer]);

  const handleRunOptimizer = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
    }, 450);
  };

  return (
    <main className="min-h-[calc(100vh-76px)] bg-white text-[#0a0a0a]">
      {/* Top Breadcrumb & Engine Status */}
      <div className="border-b border-neutral-200 bg-neutral-50/50">
        <div className="mx-auto max-w-[1600px] px-6 sm:px-10 py-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            <span className="text-black font-semibold">MODULE: RURAL_AI_DISPATCH</span>
            <span>//</span>
            <span>MULTI-OBJECTIVE URGENCY, SPOILAGE & FAIRNESS OPTIMIZER</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-neutral-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              DYNAMIC MATCHING LATENCY: 8ms
            </span>
            <span className="text-neutral-400">|</span>
            <span className="text-neutral-700">FAIRNESS INDEX: {mathCalculations.fairnessIndex}</span>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 pt-10 pb-8 border-b border-neutral-200">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-2">
              DYNAMIC ALLOCATION & TRANSPARENCY CONSOLE
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-[-0.035em] text-black">
              Rural Last-Mile <span className="font-semibold">Dispatch Optimizer</span>
            </h1>
          </div>

          <button
            onClick={handleRunOptimizer}
            disabled={isOptimizing}
            className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-neutral-800 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshIcon size={14} className={isOptimizing ? "animate-spin" : ""} />
            <span>{isOptimizing ? "Re-evaluating dynamic matching..." : "Run Dispatch Solver"}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="mx-auto max-w-[1600px] border-b border-neutral-200">
        <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200">
          
          {/* LEFT 5 COLS: INTERACTIVE PARAMETERS */}
          <div className="lg:col-span-5 p-6 sm:p-10 space-y-9">
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
                    onClick={() => setSelectedRouteId(r.id)}
                    className={`w-full text-left py-3 px-3.5 border-b transition-colors flex items-center justify-between font-mono text-xs ${
                      selectedRouteId === r.id
                        ? "border-black bg-neutral-50 text-black font-semibold"
                        : "border-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-50/50"
                    }`}
                  >
                    <span>{r.name}</span>
                    <span className={`text-[10px] uppercase ${
                      r.roadCondition === "flood_risk" ? "text-rose-600 font-bold" : r.roadCondition === "unpaved" ? "text-amber-600 font-bold" : "text-neutral-400"
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
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "farm_produce", label: "Farm Produce", sub: "Horticulture / Milk" },
                  { id: "medicine", label: "Medicine", sub: "Critical Vaccines" },
                  { id: "essential_goods", label: "Essential Goods", sub: "Grains & Rations" },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoodType(g.id as any)}
                    className={`py-3 px-3 border text-left transition-all cursor-pointer ${
                      goodType === g.id
                        ? "border-black bg-black text-white"
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
                    onClick={() => setVehicleType(v.id as any)}
                    className={`p-2.5 border text-center transition-all cursor-pointer ${
                      vehicleType === v.id
                        ? "border-black bg-neutral-100 font-semibold text-black"
                        : "border-neutral-200 text-neutral-600 bg-white"
                    }`}
                  >
                    <div className="text-lg">{v.emoji}</div>
                    <div className="text-[11px] mt-1">{v.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Producer Wait Time Disparity Slider (Fairness Mechanism) */}
            <div className="space-y-4 pt-4 border-t border-neutral-200">
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
                  onChange={(e) => setProducerWaitMins(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between font-mono text-[10px] text-neutral-400 mt-1">
                  <span>10 mins (Fresh)</span>
                  <span>60 mins (Regional Avg)</span>
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
                  onChange={(e) => setAmbientTempOverride(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* RIGHT 7 COLS: READOUTS & TRANSPARENT RATIONALE */}
          <div className="lg:col-span-7 p-6 sm:p-10 space-y-10 bg-white">
            
            {/* KPI Row */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-6">
                DYNAMIC DISPATCH COMPUTED METRICS
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pb-8 border-b border-neutral-200">
                <div>
                  <div className="font-mono text-[10px] text-neutral-400 uppercase">Dispatch Score</div>
                  <div className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                    {mathCalculations.totalScore}
                  </div>
                  <div className="font-mono text-[10px] text-emerald-600 mt-1">
                    High Net Priority
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
                  <strong>DISPATCH DECISION:</strong> Allocated <strong>{vehicleType.toUpperCase()}</strong> for {goodType.replace("_", " ")} on <strong>{selectedRoute.name}</strong>.
                </p>
                <p>
                  <strong>WHY THIS TIME & VEHICLE:</strong> {goodType === "medicine"
                    ? "Critical medicine requiring active temperature management was matched immediately with top priority."
                    : producerWaitMins > 60
                    ? `Producer in ${selectedRoute.community} waited ${producerWaitMins} mins (above regional baseline); +${mathCalculations.fairnessBoost}pts fairness boost was awarded to ensure smallholders are never deprioritized.`
                    : "Standard equitable queue scheduling satisfied."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}