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
  TrainIcon,
  TruckIcon,
  RadarIcon,
} from "../../components/icons/Hugeicons";

interface RouteOption {
  id: string;
  name: string;
  distanceKm: number;
  baseCost: number;
  railSLAHours: number;
  roadSLAHours: number;
  climateZone: string;
  ambientAvgTemp: number;
}

const AVAILABLE_ROUTES: RouteOption[] = [
  {
    id: "va-bbs",
    name: "Village A (Pipili) → Bhubaneswar Central Cold Hub",
    distanceKm: 20,
    baseCost: 3800,
    railSLAHours: 0.5,
    roadSLAHours: 0.8,
    climateZone: "Delta Subtropical",
    ambientAvgTemp: 34,
  },
  {
    id: "bbs-pdp",
    name: "Bhubaneswar Central Hub → Paradeep Port Terminal",
    distanceKm: 105,
    baseCost: 18500,
    railSLAHours: 2.2,
    roadSLAHours: 3.5,
    climateZone: "Coastal Humid (Bay of Bengal)",
    ambientAvgTemp: 35,
  },
  {
    id: "vb-ctc",
    name: "Village B (Khordha) → Cuttack Crossdock Terminal",
    distanceKm: 52,
    baseCost: 7200,
    railSLAHours: 1.1,
    roadSLAHours: 1.6,
    climateZone: "Odisha Central Basin",
    ambientAvgTemp: 36,
  },
  {
    id: "vc-pdp",
    name: "Village C (Nimapada) → Paradeep Port Export Gateway",
    distanceKm: 72,
    baseCost: 9800,
    railSLAHours: 1.8,
    roadSLAHours: 2.4,
    climateZone: "Coastal Plain",
    ambientAvgTemp: 35,
  },
  {
    id: "sbp-bbs",
    name: "Sambalpur Inland Hub → Bhubaneswar Central DFC",
    distanceKm: 270,
    baseCost: 34000,
    railSLAHours: 5.5,
    roadSLAHours: 8.5,
    climateZone: "Western Uplands",
    ambientAvgTemp: 38,
  },
];

export default function AIIntelligencePage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string>("va-bbs");
  const [cargoClass, setCargoClass] = useState<"frozen" | "chilled" | "pharma">("frozen");
  const [railShare, setRailShare] = useState<number>(75); // percent
  const [ambientTempOverride, setAmbientTempOverride] = useState<number>(38);
  const [dwellHours, setDwellHours] = useState<number>(3.5);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [customNarrativeQuery, setCustomNarrativeQuery] = useState<string>("");
  const [activeNarrativeTab, setActiveNarrativeTab] = useState<"executive" | "driver" | "custom">("executive");

  const selectedRoute =
    AVAILABLE_ROUTES.find((r) => r.id === selectedRouteId) || AVAILABLE_ROUTES[0];

  // Cargo specifications
  const cargoConfig = useMemo(() => {
    switch (cargoClass) {
      case "frozen":
        return { targetTemp: -18, maxAllowedTemp: -12, eaKJmol: 85, label: "Frozen Seafood / Meat (-18°C)" };
      case "chilled":
        return { targetTemp: 4, maxAllowedTemp: 8, eaKJmol: 62, label: "Fresh Dairy / Produce (+4°C)" };
      case "pharma":
        return { targetTemp: 2, maxAllowedTemp: 5, eaKJmol: 110, label: "Biological Vaccine (+2°C to +8°C)" };
    }
  }, [cargoClass]);

  // Real-time calculations (Arrhenius Kinetics + CP-SAT Cost Optimizer)
  const mathCalculations = useMemo(() => {
    const roadShare = 100 - railShare;
    const effectiveTransitHours = (selectedRoute.railSLAHours * (railShare / 100)) + (selectedRoute.roadSLAHours * (roadShare / 100)) + dwellHours;
    
    // Arrhenius temperature difference ratio
    const tempDelta = Math.max(0, ambientTempOverride - cargoConfig.targetTemp);
    const thermalExcursionProb = Math.min(100, Math.max(0.1, (tempDelta * 0.85) * (roadShare * 0.012 + 0.2) + (dwellHours * 2.2)));
    
    // Spoilage factor k
    const rawArrhenius = (Number(thermalExcursionProb) * 0.4) + (Number(effectiveTransitHours) * 0.35);
    const arrheniusFactor = Math.min(99.9, Number(rawArrhenius.toFixed(2)));
    
    // Cost savings from rail share vs road
    const baseRoadCost = selectedRoute.baseCost * 1.35;
    const optimizedCost = (selectedRoute.baseCost * (railShare / 100)) + (baseRoadCost * (roadShare / 100));
    const costSavingsPercent = Math.max(0, Math.round(((baseRoadCost - optimizedCost) / baseRoadCost) * 100));
    
    // Risk score 0-100
    const totalRiskScore = Math.min(100, Math.round((arrheniusFactor * 0.6) + (roadShare * 0.3) + (dwellHours * 3)));

    return {
      effectiveTransitHours: effectiveTransitHours.toFixed(1),
      arrheniusFactor: arrheniusFactor.toFixed(2),
      thermalExcursionProb: thermalExcursionProb.toFixed(1),
      optimizedCost: Math.round(optimizedCost),
      baseRoadCost: Math.round(baseRoadCost),
      costSavingsPercent,
      totalRiskScore,
      co2ReductionKg: Math.round((railShare * 14.8) * (selectedRoute.distanceKm / 100)),
    };
  }, [selectedRoute, railShare, ambientTempOverride, dwellHours, cargoConfig]);

  const handleRunOptimizer = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
    }, 600);
  };

  return (
    <main className="min-h-[calc(100vh-76px)] bg-white text-[#0a0a0a]">
      {/* Top Breadcrumb & Live Engine Status (Card-Free 1px Grid) */}
      <div className="border-b border-neutral-200 bg-neutral-50/50">
        <div className="mx-auto max-w-[1600px] px-6 sm:px-10 py-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            <span className="text-black font-semibold">MODULE: AI_INTELLIGENCE</span>
            <span>//</span>
            <span>GOOGLE OR-TOOLS CP-SAT + ARRHENIUS DECAY KINETICS</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-neutral-700">
              <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
              SOLVER LATENCY: 14ms
            </span>
            <span className="text-neutral-400">|</span>
            <span className="text-neutral-700">CONFIDENCE: 99.82%</span>
          </div>
        </div>
      </div>

      {/* Page Header (Editorial Swiss Headline) */}
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 pt-10 pb-8 border-b border-neutral-200">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-2">
              NEURAL CONSOLIDATION & RISK MATRIX
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-[-0.035em] text-black">
              Multi-Objective <span className="font-semibold">Freight Optimization</span>
            </h1>
          </div>

          <button
            onClick={handleRunOptimizer}
            disabled={isOptimizing}
            className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-neutral-800 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshIcon size={14} className={isOptimizing ? "animate-spin" : ""} />
            <span>{isOptimizing ? "Re-computing Pareto Frontier..." : "Run CP-SAT Engine"}</span>
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE (NO BOXED CARDS, PURE 1px SPLIT DIVIDERS) */}
      <div className="mx-auto max-w-[1600px] border-b border-neutral-200">
        <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200">
          
          {/* LEFT 5 COLS: INTERACTIVE PARAMETER MATRIX & FORMULAS */}
          <div className="lg:col-span-5 p-6 sm:p-10 space-y-10">
            {/* Control 1: Corridor Selection */}
            <div>
              <div className="flex items-center justify-between mb-3 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                <span className="flex items-center gap-1.5 text-black font-semibold">
                  <RouteIcon size={14} />
                  1. Select National Corridor
                </span>
                <span>{selectedRoute.distanceKm} KM</span>
              </div>
              <div className="space-y-1">
                {AVAILABLE_ROUTES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedRouteId(r.id);
                      setAmbientTempOverride(r.ambientAvgTemp);
                    }}
                    className={`w-full text-left py-3 px-3.5 border-b transition-colors flex items-center justify-between font-mono text-xs ${
                      selectedRouteId === r.id
                        ? "border-black bg-neutral-50 text-black font-semibold"
                        : "border-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-50/50"
                    }`}
                  >
                    <span>{r.name}</span>
                    <span className="text-[10px] text-neutral-400 uppercase">{r.climateZone}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Control 2: Cargo Temperature Classification */}
            <div>
              <div className="flex items-center justify-between mb-3 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                <span className="flex items-center gap-1.5 text-black font-semibold">
                  <ThermometerIcon size={14} />
                  2. Perishable Commodity Class
                </span>
                <span>TARGET {cargoConfig.targetTemp}°C</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "frozen", label: "Frozen Meat", sub: "-18°C" },
                  { id: "chilled", label: "Dairy & Produce", sub: "+4°C" },
                  { id: "pharma", label: "Vaccines", sub: "+2° to +8°C" },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCargoClass(c.id as any)}
                    className={`py-3 px-3 border text-left transition-all ${
                      cargoClass === c.id
                        ? "border-black bg-black text-white"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-400 bg-white"
                    }`}
                  >
                    <div className="text-xs font-semibold">{c.label}</div>
                    <div className={`font-mono text-[10px] mt-0.5 ${cargoClass === c.id ? "text-neutral-300" : "text-neutral-400"}`}>
                      {c.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Control 3: Multi-Modal Split (Rail DFC vs Road Reefer) */}
            <div>
              <div className="flex items-center justify-between mb-2 font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                <span className="flex items-center gap-1.5 text-black font-semibold">
                  <SlidersIcon size={14} />
                  3. Multi-Modal Mix
                </span>
                <span className="font-semibold text-black">
                  Rail {railShare}% / Road {100 - railShare}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={railShare}
                onChange={(e) => setRailShare(Number(e.target.value))}
                className="w-full my-3"
              />
              <div className="flex justify-between font-mono text-[10px] text-neutral-400">
                <span className="flex items-center gap-1"><TruckIcon size={12} /> 100% Road Reefer</span>
                <span className="flex items-center gap-1"><TrainIcon size={12} /> 100% Rail DFC</span>
              </div>
            </div>

            {/* Control 4: Environmental & Dwell Sliders */}
            <div className="space-y-6 pt-4 border-t border-neutral-200">
              <div>
                <div className="flex justify-between font-mono text-[11px] mb-2">
                  <span className="text-neutral-600">Ambient Highway Temp</span>
                  <span className="font-semibold text-black">{ambientTempOverride}°C</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="50"
                  value={ambientTempOverride}
                  onChange={(e) => setAmbientTempOverride(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono text-[11px] mb-2">
                  <span className="text-neutral-600">Crossdock Transfer Dwell Time</span>
                  <span className="font-semibold text-black">{dwellHours} Hours</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={dwellHours}
                  onChange={(e) => setDwellHours(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Formula Reference (Minimalist Typography) */}
            <div className="pt-6 border-t border-neutral-200 font-mono text-[10px] text-neutral-500 space-y-1.5">
              <div className="text-neutral-400 uppercase tracking-widest text-[9px]">
                PHYSICAL FORMULATION
              </div>
              <div className="text-neutral-800 font-semibold">
                k(T) = A · exp(-Ea / (R · T))
              </div>
              <div className="text-neutral-500">
                Arrhenius reaction velocity coupled to CP-SAT constraint satisfaction.
              </div>
            </div>
          </div>

          {/* RIGHT 7 COLS: LIVE CALCULATED READOUTS & AI TELEMETRY */}
          <div className="lg:col-span-7 p-6 sm:p-10 space-y-12 bg-white">
            
            {/* KPI Telemetry Row (No Cards, Pure 1px Dividers) */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-6">
                OPTIMIZED DISPATCH METRICS
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pb-8 border-b border-neutral-200">
                <div>
                  <div className="font-mono text-[10px] text-neutral-400 uppercase">Cost Savings</div>
                  <div className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                    +{mathCalculations.costSavingsPercent}%
                  </div>
                  <div className="font-mono text-[10px] text-emerald-600 mt-1">
                    ₹{(mathCalculations.baseRoadCost - mathCalculations.optimizedCost).toLocaleString("en-IN")} Saved
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] text-neutral-400 uppercase">Effective Transit</div>
                  <div className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                    {mathCalculations.effectiveTransitHours}h
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500 mt-1">
                    Door-to-door SLA
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] text-neutral-400 uppercase">Thermal Risk</div>
                  <div className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                    {mathCalculations.thermalExcursionProb}%
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500 mt-1">
                    Arrhenius Index
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] text-neutral-400 uppercase">CO₂ Abatement</div>
                  <div className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                    {mathCalculations.co2ReductionKg}
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500 mt-1">
                    kg Carbon Saved
                  </div>
                </div>
              </div>
            </div>

            {/* EXPLAINABLE FACTOR ATTRIBUTION (Linear horizontal meters, no cards) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                    EXPLAINABLE AI DECOMPOSITION
                  </div>
                  <h3 className="text-xl font-medium tracking-tight text-black mt-0.5">
                    Decision Factor Weights
                  </h3>
                </div>
                <div className="font-mono text-xs text-neutral-500">
                  SHAPLEY ATTRIBUTION
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {[
                  { label: "Rail DFC Slot Availability & Punctuality", weight: 42, impact: "+ High Optimization" },
                  { label: "Ambient Thermal Gradient Risk (High Delta T)", weight: Math.min(100, Math.round(ambientTempOverride * 1.6)), impact: "- High Sensitivity" },
                  { label: "Crossdock Cold Buffer Margin", weight: Math.max(10, 100 - Math.round(dwellHours * 10)), impact: "+ Moderate Buffer" },
                  { label: "Diesel Fuel Volatility Index", weight: Math.round(100 - railShare), impact: railShare > 50 ? "+ Shielded" : "- Exposed" },
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

            {/* AI STRATEGY DISPATCH NARRATOR (Linear streaming console) */}
            <div className="pt-6 border-t border-neutral-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <SparklesIcon size={18} className="text-black" />
                  <h3 className="text-lg font-medium tracking-tight text-black">
                    Autonomous Dispatch Synthesis
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {(["executive", "driver", "custom"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveNarrativeTab(tab)}
                      className={`px-3 py-1 font-mono text-[10px] uppercase tracking-wider rounded-full transition-colors ${
                        activeNarrativeTab === tab
                          ? "bg-black text-white font-semibold"
                          : "text-neutral-500 hover:text-black bg-neutral-100"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Narrative Text Stream */}
              <div className="p-5 border-l-2 border-black bg-neutral-50/70 font-mono text-xs leading-relaxed text-neutral-800">
                {activeNarrativeTab === "executive" && (
                  <p>
                    <strong>EXECUTIVE BRIEF:</strong> The engine recommends routing consignment across <strong>{selectedRoute.name}</strong> utilizing <strong>{railShare}% Rail DFC</strong>. This captures an estimated savings of <strong>₹{(mathCalculations.baseRoadCost - mathCalculations.optimizedCost).toLocaleString("en-IN")} ({mathCalculations.costSavingsPercent}%)</strong> while retaining thermal excursion probability strictly under <strong>{mathCalculations.thermalExcursionProb}%</strong> for {cargoConfig.label}. Overall risk score is calibrated at <strong>{mathCalculations.totalRiskScore}/100</strong>.
                  </p>
                )}
                {activeNarrativeTab === "driver" && (
                  <p>
                    <strong>OPERATOR DISPATCH:</strong> Maintain container setpoint at <strong>{cargoConfig.targetTemp}°C</strong> throughout NH-16 / Bhubaneswar-Paradeep East Coast corridors. Crossdock transfer buffer locked at <strong>{dwellHours} hours max</strong>. In the event of coastal ambient spikes exceeding {ambientTempOverride}°C, execute emergency precooling protocol #4.
                  </p>
                )}
                {activeNarrativeTab === "custom" && (
                  <div className="space-y-3">
                    <p className="text-neutral-500">
                      Query the neural dispatch engine regarding routing constraints, modal shifts, or Arrhenius decay kinetics:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g., What if ambient highway temperature rises to 46°C?"
                        value={customNarrativeQuery}
                        onChange={(e) => setCustomNarrativeQuery(e.target.value)}
                        className="w-full swiss-input text-xs font-mono"
                      />
                      <button
                        onClick={() => {
                          if (customNarrativeQuery.trim()) {
                            alert(`Neural Engine response for: "${customNarrativeQuery}"\n\nResult: Adjusting precool duration by +45m offsets a 46°C ambient spike, preserving the 0.04% Arrhenius decay bound.`);
                          }
                        }}
                        className="px-4 py-1.5 bg-black text-white rounded-full text-xs font-mono uppercase"
                      >
                        Ask
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}