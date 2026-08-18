"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

interface CorridorOption {
  id: string;
  name: string;
  roadDistanceKm: number;
  baseRoadHours: number;
  baseRailHours: number;
  roadCostPerKg: number;
  railCostPerKg: number;
  roadReliability: number;
  railReliability: number;
  vulnerability: string;
}

const CORRIDORS: CorridorOption[] = [
  {
    id: "delhi-mumbai",
    name: "Delhi Logistics Hub ⇄ Mumbai Crossdock",
    roadDistanceKm: 1410,
    baseRoadHours: 24,
    baseRailHours: 19,
    roadCostPerKg: 3.2,
    railCostPerKg: 2.1,
    roadReliability: 0.88,
    railReliability: 0.95,
    vulnerability: "Western Highway Expressway & Monsoon Bottlenecks",
  },
  {
    id: "bengaluru-chennai",
    name: "Bengaluru Cold Park ⇄ Chennai Harbor Hub",
    roadDistanceKm: 340,
    baseRoadHours: 6.5,
    baseRailHours: 5.0,
    roadCostPerKg: 1.4,
    railCostPerKg: 1.0,
    roadReliability: 0.92,
    railReliability: 0.97,
    vulnerability: "Urban Ring Road Congestion & Port Queues",
  },
  {
    id: "hyderabad-kolkata",
    name: "Hyderabad Industrial Hub ⇄ Kolkata Terminal",
    roadDistanceKm: 1520,
    baseRoadHours: 28,
    baseRailHours: 22,
    roadCostPerKg: 3.6,
    railCostPerKg: 2.4,
    roadReliability: 0.82,
    railReliability: 0.93,
    vulnerability: "Eastern Ghats Highway Gradients & Weather Excursions",
  },
  {
    id: "jaipur-ahmedabad",
    name: "Jaipur Logistics Center ⇄ Ahmedabad Hub",
    roadDistanceKm: 670,
    baseRoadHours: 12,
    baseRailHours: 9.5,
    roadCostPerKg: 1.8,
    railCostPerKg: 1.3,
    roadReliability: 0.89,
    railReliability: 0.96,
    vulnerability: "High Summer Ambient Heat Zone (>44°C)",
  },
];

export default function SimulatorPage() {
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>("delhi-mumbai");
  const [cargoTempClass, setCargoTempClass] = useState<"frozen" | "chilled" | "ambient">("frozen");
  const [cargoWeightKg, setCargoWeightKg] = useState<number>(3500);

  // Simulation disruption parameters
  const [monsoonIntensity, setMonsoonIntensity] = useState<number>(45); // 0 - 100%
  const [ambientTempC, setAmbientTempC] = useState<number>(38); // 20 - 50°C
  const [insulationLossPct, setInsulationLossPct] = useState<number>(20); // 5 - 60%
  const [trafficSeverity, setTrafficSeverity] = useState<"low" | "medium" | "heavy">("medium");

  // 48-Hour Interactive Time Scrubber
  const [timeHour, setTimeHour] = useState<number>(14);

  const corridor = useMemo(
    () => CORRIDORS.find((c) => c.id === selectedCorridorId) || CORRIDORS[0],
    [selectedCorridorId]
  );

  // Dynamic Mathematical Physics & Risk Calculations
  const simulationMetrics = useMemo(() => {
    // Traffic factor
    const trafficMultiplier = trafficSeverity === "heavy" ? 1.35 : trafficSeverity === "medium" ? 1.15 : 1.0;
    const weatherDelayHours = (monsoonIntensity / 100) * 6.5;

    const actualRoadHours = Math.round((corridor.baseRoadHours * trafficMultiplier + weatherDelayHours) * 10) / 10;
    const actualRailHours = Math.round((corridor.baseRailHours + (monsoonIntensity / 100) * 1.5) * 10) / 10;

    // Road Delay Probability Model (Simulating XGBoost)
    const roadUnreliability = (1 - corridor.roadReliability) + (monsoonIntensity / 100) * 0.35 + (trafficSeverity === "heavy" ? 0.25 : 0.1);
    const roadDelayProb = Math.min(0.96, Math.max(0.05, roadUnreliability));

    const railDelayProb = Math.min(0.4, Math.max(0.02, (1 - corridor.railReliability) + (monsoonIntensity / 100) * 0.08));

    // Thermal decay kinetics (Arrhenius / Q10)
    const targetTemp = cargoTempClass === "frozen" ? -18 : cargoTempClass === "chilled" ? 4 : 22;
    const nominalShelfLife = cargoTempClass === "frozen" ? 720 : cargoTempClass === "chilled" ? 168 : 2160;
    const q10 = cargoTempClass === "frozen" ? 2.5 : cargoTempClass === "chilled" ? 2.0 : 1.5;

    // Container internal temp estimation
    const insulationEff = Math.max(0.1, 0.95 - insulationLossPct / 100);
    const roadContainerTemp = targetTemp + (ambientTempC - targetTemp) * (1 - insulationEff);
    const railContainerTemp = targetTemp + (ambientTempC - targetTemp) * ((1 - insulationEff) * 0.45); // Rail reefers have dedicated backup gensets

    // Spoilage calculation
    const roadTempDiff = Math.max(0, roadContainerTemp - targetTemp);
    const roadAccelFactor = Math.pow(q10, roadTempDiff / 10.0);
    const roadEffectiveExposureHrs = actualRoadHours * roadAccelFactor;
    const roadRemainingShelfLife = Math.max(0, Math.min(100, (1 - roadEffectiveExposureHrs / nominalShelfLife) * 100));
    const roadSpoilageRisk = Math.min(1.0, Math.max(0.02, roadEffectiveExposureHrs / nominalShelfLife));

    const railTempDiff = Math.max(0, railContainerTemp - targetTemp);
    const railAccelFactor = Math.pow(q10, railTempDiff / 10.0);
    const railEffectiveExposureHrs = actualRailHours * railAccelFactor;
    const railRemainingShelfLife = Math.max(0, Math.min(100, (1 - railEffectiveExposureHrs / nominalShelfLife) * 100));
    const railSpoilageRisk = Math.min(1.0, Math.max(0.01, railEffectiveExposureHrs / nominalShelfLife));

    // Commercial metrics
    const roadCost = cargoWeightKg * corridor.roadCostPerKg;
    const railCost = cargoWeightKg * corridor.railCostPerKg;
    const costSavings = roadCost - railCost;
    const costSavingsPct = Math.round((costSavings / roadCost) * 100);

    // Carbon estimation (kg CO2e)
    const roadCO2 = Math.round(cargoWeightKg * (corridor.roadDistanceKm / 1000) * 0.105);
    const railCO2 = Math.round(cargoWeightKg * (corridor.roadDistanceKm / 1000) * 0.028);
    const carbonSavedPct = Math.round(((roadCO2 - railCO2) / roadCO2) * 100);

    // Time scrubber telemetry snapshot at `timeHour`
    const progressPct = Math.min(100, (timeHour / actualRoadHours) * 100);
    const instantTempRoad = targetTemp + ((ambientTempC - targetTemp) * (1 - insulationEff)) * (Math.min(1, timeHour / 12));
    const instantTempRail = targetTemp + ((ambientTempC - targetTemp) * ((1 - insulationEff) * 0.45)) * (Math.min(1, timeHour / 12));

    return {
      actualRoadHours,
      actualRailHours,
      roadDelayProb: Math.round(roadDelayProb * 100),
      railDelayProb: Math.round(railDelayProb * 100),
      roadContainerTemp: Math.round(roadContainerTemp * 10) / 10,
      railContainerTemp: Math.round(railContainerTemp * 10) / 10,
      roadRemainingShelfLife: Math.round(roadRemainingShelfLife * 10) / 10,
      railRemainingShelfLife: Math.round(railRemainingShelfLife * 10) / 10,
      roadSpoilageRisk: Math.round(roadSpoilageRisk * 100),
      railSpoilageRisk: Math.round(railSpoilageRisk * 100),
      roadCost,
      railCost,
      costSavings,
      costSavingsPct,
      roadCO2,
      railCO2,
      carbonSavedPct,
      progressPct: Math.round(progressPct),
      instantTempRoad: Math.round(instantTempRoad * 10) / 10,
      instantTempRail: Math.round(instantTempRail * 10) / 10,
      targetTemp,
    };
  }, [corridor, cargoTempClass, cargoWeightKg, monsoonIntensity, ambientTempC, insulationLossPct, trafficSeverity, timeHour]);

  return (
    <main className="cargomind-grid min-h-[calc(100vh-88px)] px-6 pb-20 pt-8">
      <div className="mx-auto max-w-[1700px]">
        {/* Header */}
        <section className="animate-fade-up flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/45 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400 opacity-60" />
                <span className="relative h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              Digital Twin & Disruption Simulator
            </div>

            <h1 className="text-4xl font-semibold tracking-[-0.055em] text-[#111a20] sm:text-5xl">
              Corridor Stress Lab
            </h1>

            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-500">
              Stress-test freight corridors against extreme weather, thermal excursions, and highway congestion. Compare road vs. multimodal rail resilience in real time.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                setMonsoonIntensity(80);
                setAmbientTempC(44);
                setInsulationLossPct(35);
                setTrafficSeverity("heavy");
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200/80 bg-rose-50/70 px-4 text-xs font-semibold text-rose-700 backdrop-blur-md transition-all hover:bg-rose-100"
            >
              ⚡ Extreme Disruption Preset
            </button>

            <button
              type="button"
              onClick={() => {
                setMonsoonIntensity(10);
                setAmbientTempC(30);
                setInsulationLossPct(10);
                setTrafficSeverity("low");
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/60 px-4 text-xs font-semibold text-slate-600 backdrop-blur-md transition-all hover:bg-white"
            >
              🌿 Optimal Conditions
            </button>
          </div>
        </section>

        {/* Main Grid: Controls + Live Simulation Output */}
        <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_1.5fr]">
          {/* Left: Stress Controls */}
          <div className="space-y-5">
            {/* Corridor & Cargo Selector */}
            <div className="cargomind-panel rounded-[28px] p-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Scenario Setup
                </span>
                <span className="rounded-full bg-slate-200/60 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                  {corridor.roadDistanceKm} km Corridor
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Select Target Freight Corridor
                  </label>
                  <select
                    value={selectedCorridorId}
                    onChange={(e) => setSelectedCorridorId(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/70 bg-white/60 px-4 text-xs font-medium text-[#111a20] outline-none transition-all focus:bg-white"
                  >
                    {CORRIDORS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">
                      Temperature Class
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-white/40 p-1">
                      {(["frozen", "chilled", "ambient"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setCargoTempClass(t)}
                          className={`rounded-xl py-2 text-[11px] font-semibold capitalize transition-all ${
                            cargoTempClass === t
                              ? "bg-[#111216] text-white shadow-sm"
                              : "text-slate-500 hover:text-[#111216]"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">
                      Cargo Weight (kg)
                    </label>
                    <input
                      type="number"
                      min={500}
                      max={10000}
                      step={500}
                      value={cargoWeightKg}
                      onChange={(e) => setCargoWeightKg(Number(e.target.value))}
                      className="h-11 w-full rounded-2xl border border-white/70 bg-white/60 px-4 text-xs font-semibold text-[#111a20] outline-none focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Environmental & Highway Physics Sliders */}
            <div className="cargomind-panel rounded-[28px] p-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Disruption Parameters
                </span>
                <span className="text-[11px] font-semibold text-rose-600">
                  Active Simulation
                </span>
              </div>

              <div className="mt-6 space-y-6">
                {/* Monsoon Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">🌧️ Monsoon Precipitation & Flash Flood Risk</span>
                    <span className="font-mono text-cyan-600">{monsoonIntensity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={monsoonIntensity}
                    onChange={(e) => setMonsoonIntensity(Number(e.target.value))}
                    className="mt-3 w-full"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                    <span>Dry Clear Skies</span>
                    <span>Moderate Rain</span>
                    <span>Severe Monsoon Alert</span>
                  </div>
                </div>

                {/* Summer Ambient Heat */}
                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">☀️ Ambient Heat Index (Summer Peak)</span>
                    <span className="font-mono text-amber-600">{ambientTempC}°C</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={50}
                    value={ambientTempC}
                    onChange={(e) => setAmbientTempC(Number(e.target.value))}
                    className="mt-3 w-full"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                    <span>20°C Mild</span>
                    <span>35°C Standard</span>
                    <span>50°C Heatwave</span>
                  </div>
                </div>

                {/* Reefer Insulation Loss */}
                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">❄️ Reefer Container Thermal Seal Loss</span>
                    <span className="font-mono text-rose-600">{insulationLossPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    value={insulationLossPct}
                    onChange={(e) => setInsulationLossPct(Number(e.target.value))}
                    className="mt-3 w-full"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                    <span>5% Factory New</span>
                    <span>25% Standard Service</span>
                    <span>60% Degraded Insulation</span>
                  </div>
                </div>

                {/* Traffic Severity */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    🚦 Highway Traffic & Border Checkpost Congestion
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["low", "medium", "heavy"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setTrafficSeverity(lvl)}
                        className={`rounded-xl py-2.5 text-xs font-semibold capitalize transition-all ${
                          trafficSeverity === lvl
                            ? "border border-slate-900 bg-[#111216] text-white shadow-sm"
                            : "border border-white/60 bg-white/40 text-slate-600 hover:bg-white/70"
                        }`}
                      >
                        {lvl === "low" ? "Flowing" : lvl === "medium" ? "Moderate" : "Gridlock"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Simulation Output & Comparison */}
          <div className="space-y-5">
            {/* Direct Comparison Cards: Road vs Multimodal Rail */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Standalone Road */}
              <div className="cargomind-panel rounded-[28px] p-6 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200/70 px-3 py-1 text-[11px] font-semibold text-slate-700">
                    🚛 Standard Road Reefer
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      simulationMetrics.roadDelayProb > 50
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {simulationMetrics.roadDelayProb}% Delay Risk
                  </span>
                </div>

                <div className="mt-5 space-y-3.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Transit Duration</span>
                    <span className="text-xl font-bold text-[#111a20]">
                      {simulationMetrics.actualRoadHours} hrs
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Peak Cargo Excursion</span>
                    <span className="text-xl font-bold text-rose-600">
                      {simulationMetrics.roadContainerTemp}°C{" "}
                      <span className="text-[10px] font-normal text-slate-400">
                        (target {simulationMetrics.targetTemp}°C)
                      </span>
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Remaining Shelf-Life</span>
                    <span className="text-base font-semibold text-slate-700">
                      {simulationMetrics.roadRemainingShelfLife}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-slate-200/60 pt-3">
                    <span className="text-xs text-slate-500">Transport Cost</span>
                    <span className="text-lg font-bold text-slate-800">
                      ₹{simulationMetrics.roadCost.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Carbon Footprint</span>
                    <span className="text-xs font-semibold text-slate-600">
                      {simulationMetrics.roadCO2} kg CO₂e
                    </span>
                  </div>
                </div>
              </div>

              {/* CargoMind Multimodal Consolidation */}
              <div className="relative overflow-hidden rounded-[28px] bg-[#111216] p-6 text-white shadow-xl">
                <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-400/15 blur-2xl" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                    🚆 CargoMind Multimodal Rail
                  </span>
                  <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                    {simulationMetrics.railDelayProb}% Delay Risk
                  </span>
                </div>

                <div className="relative z-10 mt-5 space-y-3.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-white/60">Transit Duration</span>
                    <span className="text-xl font-bold text-emerald-400">
                      {simulationMetrics.actualRailHours} hrs{" "}
                      <span className="text-xs font-normal text-emerald-300">
                        (-{(simulationMetrics.actualRoadHours - simulationMetrics.actualRailHours).toFixed(1)}h)
                      </span>
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-white/60">Container Internal Temp</span>
                    <span className="text-xl font-bold text-cyan-300">
                      {simulationMetrics.railContainerTemp}°C{" "}
                      <span className="text-[10px] font-normal text-white/40">
                        (Active GenSet)
                      </span>
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-white/60">Remaining Shelf-Life</span>
                    <span className="text-base font-semibold text-emerald-300">
                      {simulationMetrics.railRemainingShelfLife}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-white/15 pt-3">
                    <span className="text-xs text-white/60">Transport Cost</span>
                    <span className="text-lg font-bold text-white">
                      ₹{simulationMetrics.railCost.toLocaleString("en-IN")}{" "}
                      <span className="text-xs font-normal text-emerald-400">
                        (-{simulationMetrics.costSavingsPct}%)
                      </span>
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-white/60">Carbon Footprint</span>
                    <span className="text-xs font-semibold text-emerald-400">
                      {simulationMetrics.railCO2} kg CO₂e (-{simulationMetrics.carbonSavedPct}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive 48-Hour Journey Scrubber */}
            <div className="cargomind-panel rounded-[28px] p-6">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-sm font-semibold text-[#111a20]">
                    Interactive Journey Time Scrubber (Hour 0 ➔ 48)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Drag the scrubber to inspect container kinetics and temperature excursion across journey timeline.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-1 text-xs font-mono font-bold text-slate-700">
                  <span>T + {timeHour}h : 00m</span>
                </div>
              </div>

              <div className="mt-5">
                <input
                  type="range"
                  min={0}
                  max={Math.max(36, Math.ceil(simulationMetrics.actualRoadHours))}
                  step={1}
                  value={timeHour}
                  onChange={(e) => setTimeHour(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Progress & Thermal comparison bar */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/50 p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Road Reefer at T+{timeHour}h
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-rose-600">
                      {simulationMetrics.instantTempRoad}°C
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Excursion: +{(simulationMetrics.instantTempRoad - simulationMetrics.targetTemp).toFixed(1)}°C
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/50 p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Rail Multimodal at T+{timeHour}h
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-emerald-600">
                      {simulationMetrics.instantTempRail}°C
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Excursion: +{(simulationMetrics.instantTempRail - simulationMetrics.targetTemp).toFixed(1)}°C
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Proactive AI Decision Callout */}
            <div className="cargomind-panel-strong flex items-start gap-4 rounded-[28px] p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#111216] text-white">
                ✨
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-[#111a20]">
                  CargoMind Optimizer Recommendation
                </h4>
                <p className="text-xs leading-5 text-slate-600">
                  {simulationMetrics.roadDelayProb > 40
                    ? `Given high ${monsoonIntensity > 40 ? "monsoon intensity" : "congestion"} on ${corridor.name}, shift standard batching to Multimodal Rail. You save ₹${simulationMetrics.costSavings.toLocaleString("en-IN")} and safeguard ${simulationMetrics.railRemainingShelfLife}% product shelf life.`
                    : `Current corridor conditions are stable. Standard road consolidation yields optimal transit time of ${simulationMetrics.actualRoadHours}h while preserving target cold envelope.`}
                </p>
                <div className="pt-2">
                  <Link
                    href="/consolidation"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#111216] underline underline-offset-4 hover:opacity-75"
                  >
                    Run Automated CP-SAT Consolidation Batch ➔
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
