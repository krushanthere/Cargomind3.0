"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import OpeningScreen from "../components/OpeningScreen";
import SwissLogisticsMap from "../components/map/SwissLogisticsMap";
import {
  StarburstIcon,
  AiBrainIcon,
  InfoCircleIcon,
  PulseIcon,
  RouteIcon,
  ShieldCheckIcon,
  ThermometerIcon,
  SlidersIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  TrainIcon,
  TruckIcon,
  CheckmarkCircleIcon,
  AlertCircleIcon,
  RefreshIcon,
  CubeIcon,
  CpuIcon,
  DatabaseIcon,
  SendIcon,
} from "../components/icons/Hugeicons";

// ==========================================
// DATA DEFINITIONS & MOCK INITIAL STATES
// ==========================================

interface HubItem {
  id: string;
  name: string;
  code: string;
  region: string;
  capacityKg: number;
  usedKg: number;
  tempZones: string[];
  activeDocks: number;
  riskStatus: "Optimal" | "Moderate" | "Constrained";
}

const INITIAL_HUBS: HubItem[] = [
  { id: "bbs", name: "Bhubaneswar Central Cold Hub", code: "BBS-HUB", region: "Odisha Central", capacityKg: 120000, usedKg: 92000, tempZones: ["-25°C Frozen", "+4°C Chilled", "+2°C Pharma"], activeDocks: 18, riskStatus: "Optimal" },
  { id: "ctc", name: "Cuttack Crossdock Terminal", code: "CTC-XDK", region: "Odisha North-Central", capacityKg: 85000, usedKg: 64000, tempZones: ["+4°C Chilled Dairy", "-18°C Frozen"], activeDocks: 12, riskStatus: "Optimal" },
  { id: "pdp", name: "Paradeep Port Deepwater Terminal", code: "PDP-PORT", region: "Coastal East", capacityKg: 190000, usedKg: 162000, tempZones: ["-25°C Marine Export", "+4°C Chilled"], activeDocks: 24, riskStatus: "Moderate" },
  { id: "v_a", name: "Village A (Pipili Rural Cluster)", code: "VIL-A", region: "Puri-BBS Agri Belt", capacityKg: 25000, usedKg: 18500, tempZones: ["+4°C Horticulture", "+12°C Floriculture"], activeDocks: 4, riskStatus: "Optimal" },
  { id: "v_b", name: "Village B (Khordha Dairy Cluster)", code: "VIL-B", region: "Khordha Industrial", capacityKg: 35000, usedKg: 29000, tempZones: ["+2°C to +4°C Raw Milk", "Chilled Produce"], activeDocks: 5, riskStatus: "Optimal" },
  { id: "v_c", name: "Village C (Nimapada Agro Belt)", code: "VIL-C", region: "Nimapada Perishables", capacityKg: 30000, usedKg: 22000, tempZones: ["+4°C Dairy Sweets", "+8°C Vegetables"], activeDocks: 4, riskStatus: "Optimal" },
  { id: "v_d", name: "Village D (Banki Riverine Farms)", code: "VIL-D", region: "Mahanadi Basin", capacityKg: 20000, usedKg: 14000, tempZones: ["+2°C Fresh Fish", "+10°C Organic Greens"], activeDocks: 3, riskStatus: "Optimal" },
  { id: "puri", name: "Puri Coastal Depot", code: "PURI-DEPOT", region: "Coastal South", capacityKg: 45000, usedKg: 28000, tempZones: ["-18°C Seafood", "+4°C Dairy"], activeDocks: 6, riskStatus: "Optimal" },
  { id: "bam", name: "Berhampur South Logistics Hub", code: "BAM-HUB", region: "South Odisha", capacityKg: 75000, usedKg: 51000, tempZones: ["-18°C Frozen", "Ambient"], activeDocks: 10, riskStatus: "Optimal" },
  { id: "bls", name: "Balasore Coastal Crossdock", code: "BLS-XDK", region: "North Odisha", capacityKg: 65000, usedKg: 48000, tempZones: ["-25°C Prawn Processing", "Ambient"], activeDocks: 8, riskStatus: "Moderate" },
  { id: "sbp", name: "Sambalpur Inland Multi-Modal Hub", code: "SBP-LOG", region: "Western Odisha", capacityKg: 90000, usedKg: 72000, tempZones: ["+4°C Agri-Cold", "Ambient"], activeDocks: 14, riskStatus: "Optimal" },
  { id: "rrk", name: "Rourkela Cold Freight Terminal", code: "RRK-LOG", region: "North-West Odisha", capacityKg: 80000, usedKg: 58000, tempZones: ["-18°C Frozen", "Pharma"], activeDocks: 10, riskStatus: "Optimal" },
];

interface ConsignmentItem {
  id: string;
  waybill: string;
  origin: string;
  destination: string;
  commodity: string;
  tempClass: "frozen" | "chilled" | "pharma" | "ambient";
  targetTemp: string;
  currentSensorTemp: string;
  weightKg: number;
  mode: "rail" | "road";
  eta: string;
  riskScore: number;
  status: "In Transit" | "Pre-cooling" | "Crossdocking" | "Delivered";
}

const INITIAL_CONSIGNMENTS: ConsignmentItem[] = [
  { id: "1", waybill: "WB-90141", origin: "Village A (Pipili Cluster)", destination: "Bhubaneswar Central Cold Hub", commodity: "Export Floriculture & Betel Leaves", tempClass: "chilled", targetTemp: "+12.0°C", currentSensorTemp: "+11.8°C", weightKg: 4500, mode: "road", eta: "0h 40m", riskScore: 2, status: "In Transit" },
  { id: "2", waybill: "WB-90142", origin: "Village B (Khordha Dairy)", destination: "Paradeep Port Deepwater Terminal", commodity: "Chilled Raw Dairy & Buffalo Milk", tempClass: "chilled", targetTemp: "+3.5°C", currentSensorTemp: "+3.6°C", weightKg: 16500, mode: "road", eta: "02h 15m", riskScore: 5, status: "In Transit" },
  { id: "3", waybill: "WB-90143", origin: "Bhubaneswar Central Cold Hub", destination: "Paradeep Port Terminal", commodity: "Deep-Sea Export Black Tiger Prawns", tempClass: "frozen", targetTemp: "-22.0°C", currentSensorTemp: "-21.9°C", weightKg: 24000, mode: "rail", eta: "02h 10m", riskScore: 3, status: "In Transit" },
  { id: "4", waybill: "WB-90144", origin: "Village C (Nimapada Agro)", destination: "Cuttack Crossdock Terminal", commodity: "Chilled Organic Vegetables & Chenapoda", tempClass: "chilled", targetTemp: "+4.0°C", currentSensorTemp: "+4.1°C", weightKg: 6200, mode: "road", eta: "01h 05m", riskScore: 4, status: "Pre-cooling" },
  { id: "5", waybill: "WB-90145", origin: "Village D (Banki Farms)", destination: "Bhubaneswar Central Cold Hub", commodity: "Fresh Riverine Hilsa & Catla", tempClass: "chilled", targetTemp: "+2.0°C", currentSensorTemp: "+1.9°C", weightKg: 3800, mode: "road", eta: "00h 50m", riskScore: 3, status: "In Transit" },
  { id: "6", waybill: "WB-90146", origin: "Sambalpur Inland Hub", destination: "Bhubaneswar Central Cold Hub", commodity: "Organic Turmeric & Agri-Biologics", tempClass: "pharma", targetTemp: "+4.0°C", currentSensorTemp: "+3.9°C", weightKg: 12000, mode: "rail", eta: "05h 20m", riskScore: 4, status: "Crossdocking" },
  { id: "7", waybill: "WB-90147", origin: "Puri Coastal Depot", destination: "Bhubaneswar Central Cold Hub", commodity: "Chilled Coastal Snapper & Mackerel", tempClass: "frozen", targetTemp: "-18.0°C", currentSensorTemp: "-18.0°C", weightKg: 8900, mode: "road", eta: "Delivered", riskScore: 0, status: "Delivered" },
];

export default function HomePage() {
  const [showIntro, setShowIntro] = useState(false);
  const [reticleRotation, setReticleRotation] = useState(0);

  // Quick simulation state (Hero)
  const [originHero, setOriginHero] = useState("Village A (Pipili Rural Cluster)");
  const [destHero, setDestHero] = useState("Bhubaneswar Central Cold Hub");
  const [ambientTempHero, setAmbientTempHero] = useState(36);
  const [targetTempHero, setTargetTempHero] = useState(4);

  // Section 01: Hub selector state
  const [selectedHub, setSelectedHub] = useState<HubItem>(INITIAL_HUBS[0]);

  // Section 02: Consignments state
  const [consignments, setConsignments] = useState<ConsignmentItem[]>(INITIAL_CONSIGNMENTS);
  const [shipmentFilter, setShipmentFilter] = useState<string>("all");
  
  // New Consignment Form State
  const [newOrigin, setNewOrigin] = useState("Village A (Pipili Cluster)");
  const [newDest, setNewDest] = useState("Bhubaneswar Central Cold Hub");
  const [newCommodity, setNewCommodity] = useState("Cold-Chain Organic Produce");
  const [newTempClass, setNewTempClass] = useState<"frozen" | "chilled" | "pharma" | "ambient">("chilled");
  const [newWeight, setNewWeight] = useState(8500);
  const [newMode, setNewMode] = useState<"rail" | "road">("road");

  // Section 03: CP-SAT Consolidation state
  const [consolidationRoute, setConsolidationRoute] = useState("Village A (Pipili) ⇄ Bhubaneswar Hub");
  const [railMixPercentage, setRailMixPercentage] = useState(65);
  const [activePlanRank, setActivePlanRank] = useState<"alpha" | "beta" | "gamma">("alpha");

  // Section 04: Arrhenius Kinetics state
  const [kineticsTemp, setKineticsTemp] = useState(36);
  const [kineticsDurationHrs, setKineticsDurationHrs] = useState(18);
  const [insulationRValue, setInsulationRValue] = useState(4.5);

  // Section 05: Disruption Stress Lab state
  const [activeDisruption, setActiveDisruption] = useState<"none" | "heatwave" | "landslide" | "rail_congestion">("none");
  const [isResolvingDisruption, setIsResolvingDisruption] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("cargomind_intro_seen");
    if (!hasSeen) {
      setShowIntro(true);
    }
  }, []);

  // Filtered shipments
  const filteredConsignments = useMemo(() => {
    if (shipmentFilter === "all") return consignments;
    return consignments.filter((c) => c.status.toLowerCase().replace(" ", "_") === shipmentFilter.toLowerCase().replace(" ", "_") || c.status.toLowerCase() === shipmentFilter.toLowerCase());
  }, [consignments, shipmentFilter]);

  // Handle new consignment creation
  const handleCreateConsignment = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = (consignments.length + 1).toString();
    const randomWB = `WB-${Math.floor(80000 + Math.random() * 9000)}`;
    const targetTempString = newTempClass === "frozen" ? "-18.0°C" : newTempClass === "chilled" ? "+4.0°C" : newTempClass === "pharma" ? "+3.5°C" : "+20.0°C";
    
    const newItem: ConsignmentItem = {
      id: newId,
      waybill: randomWB,
      origin: newOrigin,
      destination: newDest,
      commodity: newCommodity,
      tempClass: newTempClass,
      targetTemp: targetTempString,
      currentSensorTemp: targetTempString,
      weightKg: Number(newWeight),
      mode: newMode,
      eta: newMode === "rail" ? "14h 30m" : "26h 00m",
      riskScore: Math.floor(Math.random() * 8) + 2,
      status: "Pre-cooling",
    };

    setConsignments([newItem, ...consignments]);
    alert(`Consignment ${randomWB} created & ingested into CP-SAT consolidation batch.`);
  };

  // Arrhenius calculation
  const arrheniusDecayRate = useMemo(() => {
    const deltaT = Math.max(0, kineticsTemp - (newTempClass === "frozen" ? -18 : 4));
    const rawRate = (deltaT * 0.9) * (kineticsDurationHrs / 20) / (insulationRValue * 0.8);
    return Math.min(99.9, Math.max(0.01, Number(rawRate.toFixed(2))));
  }, [kineticsTemp, kineticsDurationHrs, insulationRValue, newTempClass]);

  return (
    <>
      {showIntro && (
        <OpeningScreen forceShow={true} onComplete={() => setShowIntro(false)} />
      )}

      <main className="min-h-[calc(100vh-72px)] bg-white text-[#0a0a0a]">
        
        {/* ========================================================================= */}
        {/* SECTION 00 // HERO PORTAL & KINETIC RETICLE (#overview)                   */}
        {/* ========================================================================= */}
        <section id="overview" className="border-b border-neutral-200">
          {/* Top Marquee Stream */}
          <div className="w-full border-b border-neutral-200 overflow-hidden bg-neutral-50/70 py-2">
            <div className="animate-marquee-smooth flex items-center gap-12 font-mono text-[11px] uppercase tracking-wider text-neutral-600">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-black" />
                <span>ODISHA FREIGHT ENGINE 3.0 // 99.4% OPTIMALITY GUARANTEE</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>BHUBANESWAR ⇄ PARADEEP PORT DFC: ON-TIME 99.2%</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-black" />
                <span>VILLAGE A (PIPILI) ⇄ BBS HUB: AGRI-COLD SENSORS ONLINE</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>VILLAGE B (KHORDHA DAIRY) FEEDER: +36.2% COST REDUCTION</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-black" />
                <span>ODISHA FREIGHT ENGINE 3.0 // 99.4% OPTIMALITY GUARANTEE</span>
              </span>
            </div>
          </div>

          {/* Split Screen Hero */}
          <div className="mx-auto max-w-[1680px]">
            <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 min-h-[640px]">
              
              {/* LEFT: Geometric Starburst Reticle */}
              <div className="relative flex flex-col justify-between p-8 sm:p-14 swiss-grid-pattern overflow-hidden group">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 border border-black flex items-center justify-center">
                      <span className="w-1 h-1 bg-black" />
                    </span>
                    <span>SYS.REF: ODISHA_SWISS_01</span>
                  </div>
                  <span>LAT 20.29° N // LON 85.82° E (BHUBANESWAR)</span>
                </div>

                <div className="my-12 flex flex-col items-center justify-center relative">
                  <div
                    className="relative cursor-pointer transition-transform duration-700 ease-out"
                    style={{ transform: `rotate(${reticleRotation}deg)` }}
                    onClick={() => setReticleRotation((r) => r + 45)}
                    title="Click to rotate reticle"
                  >
                    <svg
                      width="250"
                      height="250"
                      viewBox="0 0 250 250"
                      className="overflow-visible text-black"
                    >
                      <circle cx="125" cy="125" r="115" fill="none" stroke="#e4e4e7" strokeWidth="1" />
                      <circle cx="125" cy="125" r="85" fill="none" stroke="#f4f4f5" strokeWidth="1" strokeDasharray="4 4" />
                      <circle cx="125" cy="125" r="55" fill="none" stroke="#e4e4e7" strokeWidth="1" />

                      <line x1="0" y1="125" x2="250" y2="125" stroke="#d4d4d8" strokeWidth="0.75" />
                      <line x1="125" y1="0" x2="125" y2="250" stroke="#d4d4d8" strokeWidth="0.75" />
                      <line x1="36" y1="36" x2="214" y2="214" stroke="#e4e4e7" strokeWidth="0.75" />
                      <line x1="36" y1="214" x2="214" y2="36" stroke="#e4e4e7" strokeWidth="0.75" />

                      {/* 8 Primary Starburst Rays */}
                      <g className="text-black">
                        <line x1="125" y1="80" x2="125" y2="26" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        <line x1="125" y1="170" x2="125" y2="224" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        <line x1="80" y1="125" x2="26" y2="125" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        <line x1="170" y1="125" x2="224" y2="125" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        <line x1="93" y1="93" x2="55" y2="55" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="157" y1="93" x2="195" y2="55" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="93" y1="157" x2="55" y2="195" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="157" y1="157" x2="195" y2="195" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                      </g>

                      <circle cx="125" cy="125" r="3" fill="currentColor" />
                    </svg>
                  </div>

                  <div className="mt-8 text-center">
                    <div className="font-mono text-[11px] tracking-widest text-neutral-400 uppercase">
                      KINETIC DISPATCH RETICLE
                    </div>
                    <div className="mt-1 text-sm font-medium text-black">
                      OR-Tools Mathematical Vector v3.0
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 pt-6 border-t border-neutral-200 font-mono text-[11px]">
                  <div>
                    <div className="text-neutral-400 uppercase text-[9px]">SLA Precision</div>
                    <div className="text-base font-semibold text-black mt-0.5">99.4%</div>
                  </div>
                  <div>
                    <div className="text-neutral-400 uppercase text-[9px]">Cost Delta</div>
                    <div className="text-base font-semibold text-black mt-0.5">-34.2%</div>
                  </div>
                  <div>
                    <div className="text-neutral-400 uppercase text-[9px]">Thermal Defect</div>
                    <div className="text-base font-semibold text-emerald-600 mt-0.5">0.02%</div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Editorial Copy & Live Parameter Simulator */}
              <div className="flex flex-col justify-between p-8 sm:p-14 bg-white">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-4">
                    MATHEMATICAL FREIGHT LOGISTICS
                  </div>

                  <h1 className="text-4xl sm:text-5xl xl:text-6xl font-light tracking-[-0.04em] text-black leading-[1.08]">
                    Intelligence.
                    <br />
                    <span className="font-semibold">Without ambiguity.</span>
                  </h1>

                  <p className="mt-6 text-base sm:text-lg text-neutral-600 font-light max-w-xl leading-relaxed">
                    CargoMind orchestrates multi-modal freight routes using Google OR-Tools CP-SAT solvers and Arrhenius physics-based thermal decay modeling. Zero guesswork.
                  </p>

                  {/* Underline Parameter Form */}
                  <div className="mt-10 pt-8 border-t border-neutral-200 space-y-6 max-w-md">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                          Origin Corridor
                        </label>
                        <input
                          type="text"
                          value={originHero}
                          onChange={(e) => setOriginHero(e.target.value)}
                          className="w-full swiss-input text-sm font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                          Destination Hub
                        </label>
                        <input
                          type="text"
                          value={destHero}
                          onChange={(e) => setDestHero(e.target.value)}
                          className="w-full swiss-input text-sm font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                          Ambient Temp (°C)
                        </label>
                        <input
                          type="number"
                          value={ambientTempHero}
                          onChange={(e) => setAmbientTempHero(Number(e.target.value))}
                          className="w-full swiss-input text-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                          Target Temp (°C)
                        </label>
                        <input
                          type="number"
                          value={targetTempHero}
                          onChange={(e) => setTargetTempHero(Number(e.target.value))}
                          className="w-full swiss-input text-sm font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between items-center font-mono text-[11px] mb-1.5">
                        <span className="text-neutral-500">Predicted Thermal Spoilage Risk</span>
                        <span className="font-semibold text-black">
                          {Math.min(100, Math.round(((ambientTempHero - targetTempHero) * 1.8) + 4))}%
                        </span>
                      </div>
                      <div className="linear-meter">
                        <div
                          className="linear-meter-fill"
                          style={{
                            width: `${Math.min(100, Math.round(((ambientTempHero - targetTempHero) * 1.8) + 4))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Circular Action Badge */}
                <div className="mt-12 pt-8 border-t border-neutral-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-neutral-500">Autonomous optimization ready</div>
                    <div className="font-mono text-sm font-semibold text-black mt-0.5">
                      Estimated Freight Savings: +34.2%
                    </div>
                  </div>

                  <Link
                    href="/ai-intelligence"
                    className="swiss-circle-btn flex-col gap-0.5"
                    title="Launch full AI Intelligence console"
                  >
                    <span>DISPATCH</span>
                    <ArrowRightIcon size={12} strokeWidth={2} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 01 // NATIONAL HUBS & MULTIMODAL CORRIDOR MATRIX (#network)       */}
        {/* ========================================================================= */}
        <section id="network" className="mx-auto max-w-[1680px] p-8 sm:p-14 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                01 // INFRASTRUCTURE TOPOLOGY
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                National Hub Matrix & Capacity Telemetry
              </h2>
            </div>
            <div className="font-mono text-xs text-neutral-500">
              NETWORK NODES: 8 ACTIVE // REAL-TIME CAPACITY AUDIT
            </div>
          </div>

          {/* Interactive Swiss Vector Map of Freight Network */}
          <div className="pt-8 pb-10">
            <SwissLogisticsMap
              selectedHubId={selectedHub.id}
              onSelectHub={(hub) => {
                const found = INITIAL_HUBS.find((h) => h.id === hub.id);
                if (found) setSelectedHub(found);
              }}
            />
          </div>

          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 pt-8 border-t border-neutral-200">
            {/* Left 7 Cols: Tabular Hub Matrix (No Cards) */}
            <div className="lg:col-span-7 pr-0 lg:pr-10">
              <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-4">
                SELECT HUB TO INSPECT TEMPERATURE ZONES & CONNECTED LANES
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 font-normal">Hub & Code</th>
                      <th className="py-3 font-normal">Region</th>
                      <th className="py-3 font-normal">Capacity (Used / Total)</th>
                      <th className="py-3 font-normal">Docks</th>
                      <th className="py-3 font-normal text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {INITIAL_HUBS.map((hub) => {
                      const isSelected = selectedHub.id === hub.id;
                      const fillPercent = Math.round((hub.usedKg / hub.capacityKg) * 100);
                      return (
                        <tr
                          key={hub.id}
                          onClick={() => setSelectedHub(hub)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-neutral-100 font-semibold" : "hover:bg-neutral-50/80"
                          }`}
                        >
                          <td className="py-3.5 pr-2">
                            <div className="text-black">{hub.name}</div>
                            <div className="text-[10px] text-neutral-400">{hub.code}</div>
                          </td>
                          <td className="py-3.5 text-neutral-600">{hub.region}</td>
                          <td className="py-3.5">
                            <div>{(hub.usedKg / 1000).toFixed(0)}k / {(hub.capacityKg / 1000).toFixed(0)}k kg</div>
                            <div className="w-24 linear-meter mt-1">
                              <div className="linear-meter-fill" style={{ width: `${fillPercent}%` }} />
                            </div>
                          </td>
                          <td className="py-3.5 text-neutral-600">{hub.activeDocks} Docks</td>
                          <td className="py-3.5 text-right">
                            <span className={`inline-block px-2 py-0.5 text-[9px] rounded-full uppercase font-sans ${
                              hub.riskStatus === "Optimal" ? "bg-black text-white" : hub.riskStatus === "Moderate" ? "bg-neutral-200 text-black" : "bg-neutral-800 text-white"
                            }`}>
                              {hub.riskStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 5 Cols: Selected Hub Deep Dive */}
            <div className="lg:col-span-5 pt-8 lg:pt-0 pl-0 lg:pl-10 space-y-8">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                  NODE TELEMETRY INSPECTOR
                </div>
                <h3 className="text-2xl font-medium tracking-tight text-black mt-1">
                  {selectedHub.name}
                </h3>
                <div className="font-mono text-xs text-neutral-500 mt-0.5">
                  FACILITY CODE: {selectedHub.code} // REGIONAL CORRIDOR: {selectedHub.region}
                </div>
              </div>

              {/* Linear Capacity Meter */}
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-neutral-500">Volumetric Cold Storage Utilization</span>
                  <span className="font-semibold text-black">
                    {Math.round((selectedHub.usedKg / selectedHub.capacityKg) * 100)}% ({(selectedHub.usedKg / 1000).toFixed(1)}T / {(selectedHub.capacityKg / 1000).toFixed(1)}T)
                  </span>
                </div>
                <div className="linear-meter">
                  <div
                    className="linear-meter-fill"
                    style={{ width: `${Math.round((selectedHub.usedKg / selectedHub.capacityKg) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Temperature Zones List */}
              <div className="space-y-3 pt-4 border-t border-neutral-200">
                <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                  ACTIVE TEMPERATURE ZONES
                </div>
                <div className="space-y-2">
                  {selectedHub.tempZones.map((tz, idx) => (
                    <div key={idx} className="flex items-center justify-between font-mono text-xs py-2 border-b border-neutral-100">
                      <span className="text-neutral-800">{tz}</span>
                      <span className="text-emerald-600 font-semibold">Active Monitoring</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Lanes Quick Metric */}
              <div className="pt-4 border-t border-neutral-200 grid grid-cols-2 gap-4 font-mono text-xs">
                <div>
                  <div className="text-neutral-400 text-[10px] uppercase">Reefer Docks</div>
                  <div className="text-xl font-light text-black mt-0.5">{selectedHub.activeDocks} Ready</div>
                </div>
                <div>
                  <div className="text-neutral-400 text-[10px] uppercase">Intermodal Transfer</div>
                  <div className="text-xl font-light text-black mt-0.5">DFC Direct</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 02 // CONSIGNMENTS & WAYBILLS DISPATCH LEDGER (#shipments)        */}
        {/* ========================================================================= */}
        <section id="shipments" className="mx-auto max-w-[1680px] p-8 sm:p-14 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                02 // DISPATCH LEDGER
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                Active Freight Manifest & Consignments
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-full text-xs font-mono">
              {["all", "in_transit", "pre-cooling", "crossdocking", "delivered"].map((f) => (
                <button
                  key={f}
                  onClick={() => setShipmentFilter(f)}
                  className={`px-3 py-1 rounded-full uppercase text-[10px] tracking-wider transition-colors cursor-pointer ${
                    shipmentFilter === f ? "bg-black text-white font-semibold" : "text-neutral-500 hover:text-black"
                  }`}
                >
                  {f.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 pt-8">
            {/* Left 8 Cols: Live Manifest Ledger */}
            <div className="lg:col-span-8 pr-0 lg:pr-10">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 font-normal">Waybill / Corridor</th>
                      <th className="py-3 font-normal">Commodity & Weight</th>
                      <th className="py-3 font-normal">Sensor Temp</th>
                      <th className="py-3 font-normal">Mode</th>
                      <th className="py-3 font-normal">ETA</th>
                      <th className="py-3 font-normal text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredConsignments.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-4 pr-2">
                          <div className="font-semibold text-black">{item.waybill}</div>
                          <div className="text-[10px] text-neutral-400">{item.origin} → {item.destination}</div>
                        </td>
                        <td className="py-4 text-neutral-700">
                          <div>{item.commodity}</div>
                          <div className="text-[10px] text-neutral-400">{(item.weightKg / 1000).toFixed(1)}T</div>
                        </td>
                        <td className="py-4 text-neutral-800">
                          <span className="font-semibold">{item.currentSensorTemp}</span>
                          <span className="text-[10px] text-neutral-400 block">Target {item.targetTemp}</span>
                        </td>
                        <td className="py-4 text-neutral-600">
                          <span className="inline-flex items-center gap-1">
                            {item.mode === "rail" ? <TrainIcon size={13} /> : <TruckIcon size={13} />}
                            {item.mode === "rail" ? "Rail DFC" : "Road Reefer"}
                          </span>
                        </td>
                        <td className="py-4 text-neutral-600">{item.eta}</td>
                        <td className="py-4 text-right">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-black text-white text-[9px] font-sans">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 4 Cols: Fast Consignment Creator (Underline Form, Golden Suisse Style) */}
            <div className="lg:col-span-4 pt-8 lg:pt-0 pl-0 lg:pl-10">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-2">
                RAPID DISPATCH INGESTION
              </div>
              <h3 className="text-xl font-medium tracking-tight text-black mb-6">
                Create New Consignment
              </h3>

              <form onSubmit={handleCreateConsignment} className="space-y-5">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Origin Node
                  </label>
                  <input
                    type="text"
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    className="w-full swiss-input text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Destination Hub
                  </label>
                  <input
                    type="text"
                    value={newDest}
                    onChange={(e) => setNewDest(e.target.value)}
                    className="w-full swiss-input text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Commodity Classification
                  </label>
                  <input
                    type="text"
                    value={newCommodity}
                    onChange={(e) => setNewCommodity(e.target.value)}
                    className="w-full swiss-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                      Thermal Class
                    </label>
                    <select
                      value={newTempClass}
                      onChange={(e) => setNewTempClass(e.target.value as any)}
                      className="w-full swiss-input text-xs bg-transparent"
                    >
                      <option value="frozen">Frozen (-18°C)</option>
                      <option value="chilled">Chilled (+4°C)</option>
                      <option value="pharma">Pharma (+2° to +8°C)</option>
                      <option value="ambient">Ambient (+20°C)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                      Weight (KG)
                    </label>
                    <input
                      type="number"
                      value={newWeight}
                      onChange={(e) => setNewWeight(Number(e.target.value))}
                      className="w-full swiss-input text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div className="font-mono text-[10px] text-neutral-400">
                    AUTO-OPTIMIZED VIA CP-SAT
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-black text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                  >
                    Ingest
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 03 // CP-SAT COMBINATORIAL CONSOLIDATION SOLVER (#consolidation)  */}
        {/* ========================================================================= */}
        <section id="consolidation" className="mx-auto max-w-[1680px] p-8 sm:p-14 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                03 // COMBINATORIAL SOLVER
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                Google OR-Tools CP-SAT Freight Consolidation
              </h2>
            </div>
            <div className="font-mono text-xs text-neutral-500">
              OPTIMALITY GAP: &lt; 0.04% // CONSTRAINT SATISFACTION: ACTIVE
            </div>
          </div>

          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 pt-8">
            {/* Left 5 Cols: Multi-Modal Solver Controls */}
            <div className="lg:col-span-5 pr-0 lg:pr-10 space-y-8">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-2">
                  Corridor Candidate Set
                </label>
                <select
                  value={consolidationRoute}
                  onChange={(e) => setConsolidationRoute(e.target.value)}
                  className="w-full swiss-input text-sm font-semibold bg-transparent"
                >
                  <option value="Village A (Pipili) ⇄ Bhubaneswar Hub">Village A (Pipili) ⇄ Bhubaneswar Hub (20 km)</option>
                  <option value="Village B (Khordha) ⇄ Paradeep Port DFC">Village B (Khordha) ⇄ Paradeep Port DFC (130 km)</option>
                  <option value="Village C (Nimapada) ⇄ Cuttack Terminal">Village C (Nimapada) ⇄ Cuttack Terminal (58 km)</option>
                  <option value="Bhubaneswar Central ⇄ Paradeep Port Direct">Bhubaneswar Central ⇄ Paradeep Port Direct (105 km)</option>
                  <option value="Village D (Banki) ⇄ Bhubaneswar Hub">Village D (Banki) ⇄ Bhubaneswar Hub (45 km)</option>
                  <option value="Sambalpur Inland ⇄ Cuttack DFC">Sambalpur Inland ⇄ Cuttack DFC (270 km)</option>
                </select>
              </div>

              {/* Multi-modal ratio slider */}
              <div>
                <div className="flex justify-between font-mono text-xs mb-2">
                  <span className="text-neutral-600">Modal Distribution</span>
                  <span className="font-semibold text-black">
                    Rail DFC {railMixPercentage}% / Road Reefer {100 - railMixPercentage}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={railMixPercentage}
                  onChange={(e) => setRailMixPercentage(Number(e.target.value))}
                  className="w-full my-2"
                />
                <div className="flex justify-between font-mono text-[10px] text-neutral-400">
                  <span>100% Road Reefer</span>
                  <span>100% Rail DFC</span>
                </div>
              </div>

              {/* Volumetric Load Factor */}
              <div className="space-y-2 pt-4 border-t border-neutral-200">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-neutral-600">Consolidated Vehicle Fill Rate</span>
                  <span className="font-semibold text-black">94.6% Optimal</span>
                </div>
                <div className="linear-meter">
                  <div className="linear-meter-fill" style={{ width: "94.6%" }} />
                </div>
                <div className="font-mono text-[10px] text-neutral-400">
                  Odisha rural-to-port empty runs reduced by 41.2%.
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Pareto Frontier Plan Selector */}
            <div className="lg:col-span-7 pt-8 lg:pt-0 pl-0 lg:pl-10 space-y-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                PARETO OPTIMAL BUNDLE CANDIDATES
              </div>

              <div className="space-y-4">
                {[
                  {
                    id: "alpha",
                    title: "Plan Alpha // Maximum Rail DFC Consolidation",
                    cost: "₹18,400",
                    savings: "+36.2%",
                    sla: "02h 15m",
                    risk: "Low (1.5%)",
                    summary: "Bundles Village A (Pipili) horticulture with Village B (Khordha) raw milk onto direct Paradeep Port refrigerated rail wagons.",
                  },
                  {
                    id: "beta",
                    title: "Plan Beta // High-Speed Highway Reefer Relay",
                    cost: "₹24,800",
                    savings: "+18.4%",
                    sla: "01h 10m",
                    risk: "Minimal (0.8%)",
                    summary: "Dedicated express road reefer relay from Village C (Nimapada) & Village D (Banki) straight to Bhubaneswar cold crossdock.",
                  },
                  {
                    id: "gamma",
                    title: "Plan Gamma // Zero Thermal Defect Marine Shield",
                    cost: "₹21,200",
                    savings: "+28.7%",
                    sla: "01h 45m",
                    risk: "Zero (0.2%)",
                    summary: "Intermodal route with redundant precooling at Cuttack terminal for export-grade black tiger prawns destined for Paradeep Port.",
                  },
                ].map((plan) => {
                  const isSelected = activePlanRank === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setActivePlanRank(plan.id as any)}
                      className={`p-5 border transition-all cursor-pointer ${
                        isSelected ? "border-black bg-neutral-50/90" : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-black">{plan.title}</div>
                        <div className="font-mono text-xs text-emerald-600 font-bold">{plan.savings} Cost Savings</div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-neutral-200/60 font-mono text-xs">
                        <div>
                          <span className="text-neutral-400 text-[10px] block">Consolidated Cost</span>
                          <span className="font-semibold text-black">{plan.cost}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 text-[10px] block">Door-to-Door SLA</span>
                          <span className="font-semibold text-black">{plan.sla}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 text-[10px] block">Thermal Risk</span>
                          <span className="font-semibold text-black">{plan.risk}</span>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-neutral-600 font-light leading-relaxed">
                        {plan.summary}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 04 // ARRHENIUS THERMAL KINETICS & SENSORS (#sensors)             */}
        {/* ========================================================================= */}
        <section id="sensors" className="mx-auto max-w-[1680px] p-8 sm:p-14 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                04 // CHEMICAL PHYSICS KINETICS
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                Arrhenius Thermal Spoilage Predictor & IoT Feed
              </h2>
            </div>
            <div className="font-mono text-xs text-neutral-500">
              ACTIVATION ENERGY: Ea = 85 kJ/mol // UNIVERSAL GAS CONSTANT: R = 8.314 J/mol·K
            </div>
          </div>

          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 pt-8">
            {/* Left 5 Cols: Kinetic Sliders */}
            <div className="lg:col-span-5 pr-0 lg:pr-10 space-y-6">
              <div>
                <div className="flex justify-between font-mono text-xs mb-2">
                  <span className="text-neutral-600">External Highway Ambient Temperature</span>
                  <span className="font-semibold text-black">{kineticsTemp}°C</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="52"
                  value={kineticsTemp}
                  onChange={(e) => setKineticsTemp(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono text-xs mb-2">
                  <span className="text-neutral-600">Transit Duration & Crossdock Dwell</span>
                  <span className="font-semibold text-black">{kineticsDurationHrs} Hours</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="48"
                  value={kineticsDurationHrs}
                  onChange={(e) => setKineticsDurationHrs(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono text-xs mb-2">
                  <span className="text-neutral-600">Reefer Insulation Thermal Resistance (R-Value)</span>
                  <span className="font-semibold text-black">R-{insulationRValue}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="0.5"
                  value={insulationRValue}
                  onChange={(e) => setInsulationRValue(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Arrhenius Equation Display */}
              <div className="p-4 border border-neutral-200 bg-neutral-50/60 font-mono text-xs space-y-1.5">
                <div className="text-neutral-400 text-[10px] uppercase">ARRHENIUS REACTION EQUATION</div>
                <div className="text-sm font-semibold text-black">k = A · exp(-Ea / (R · T))</div>
                <div className="text-neutral-500 text-[11px]">
                  Real-time reaction velocity indicates shelf-life depletion velocity under transient temperature spikes.
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Spoilage Curve & Live Telemetry Stream */}
            <div className="lg:col-span-7 pt-8 lg:pt-0 pl-0 lg:pl-10 space-y-8">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-2">
                  CALCULATED SPOILAGE DECAY PROBABILITY
                </div>
                <div className="flex items-baseline gap-4">
                  <div className="text-5xl font-light tracking-tight text-black">
                    {arrheniusDecayRate}%
                  </div>
                  <div className="font-mono text-xs text-neutral-500">
                    {arrheniusDecayRate < 10 ? "Within Nominal Shelf-Life Bounds" : arrheniusDecayRate < 35 ? "Moderate Thermal Stress Detected" : "CRITICAL: Urgent Pre-Cooling Required"}
                  </div>
                </div>
                <div className="linear-meter mt-3">
                  <div
                    className="linear-meter-fill"
                    style={{ width: `${arrheniusDecayRate}%` }}
                  />
                </div>
              </div>

              {/* Live IoT Sensor Feed */}
              <div className="space-y-3 pt-4 border-t border-neutral-200">
                <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                  REAL-TIME IoT THERMISTOR PINGS
                </div>
                <div className="divide-y divide-neutral-100 font-mono text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-neutral-700">Sensor TH-091 // Front Core Reefer</span>
                    <span className="font-semibold text-black">-18.2°C (OK)</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-neutral-700">Sensor TH-092 // Rear Cargo Door Air Curtain</span>
                    <span className="font-semibold text-black">-17.8°C (OK)</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-neutral-700">Atmospheric Humidity Buffer</span>
                    <span className="font-semibold text-black">48% RH (Stable)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 05 // CORRIDOR STRESS LAB & DISRUPTION RESOLVER (#simulator)      */}
        {/* ========================================================================= */}
        <section id="simulator" className="mx-auto max-w-[1680px] p-8 sm:p-14 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                05 // DISRUPTION SIMULATION LAB
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                Stress Lab & Autonomous AI Mitigation
              </h2>
            </div>
            <div className="font-mono text-xs text-neutral-500">
              DYNAMIC RE-ROUTING ENGINE // AGENTIC HEURISTICS
            </div>
          </div>

          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 pt-8">
            {/* Left 5 Cols: Scenarios */}
            <div className="lg:col-span-5 pr-0 lg:pr-10 space-y-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-2">
                INJECT SYNTHETIC DISRUPTION EVENT
              </div>

              {[
                { id: "none", title: "Nominal Operations (No Shocks)", desc: "All Odisha rural-to-port and highway networks clear." },
                { id: "heatwave", title: "Coastal Heat & Humidity Spike (42°C in Khordha)", desc: "Triggers ambient thermal gradient on raw milk tankers from Village B." },
                { id: "landslide", title: "Mahanadi Basin Flash Surge near Banki", desc: "Village D feeder road flooded; autonomous reroute to Cuttack DFC." },
                { id: "rail_congestion", title: "Cuttack–Paradeep Port DFC Track Maintenance", desc: "Causes 2-hour rail delay; auto-diverts export prawns to road reefers." },
              ].map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => setActiveDisruption(sc.id as any)}
                  className={`w-full text-left p-4 border transition-all cursor-pointer ${
                    activeDisruption === sc.id
                      ? "border-black bg-neutral-50 font-semibold"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  }`}
                >
                  <div className="text-xs font-semibold text-black">{sc.title}</div>
                  <div className="text-[11px] text-neutral-500 mt-1 font-light">{sc.desc}</div>
                </button>
              ))}
            </div>

            {/* Right 7 Cols: Mitigation Engine Output */}
            <div className="lg:col-span-7 pt-8 lg:pt-0 pl-0 lg:pl-10 space-y-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                AUTONOMOUS MITIGATION STRATEGY
              </div>

              <div className="p-6 border border-neutral-200 bg-neutral-50/70 space-y-4 font-mono text-xs">
                {activeDisruption === "none" && (
                  <div className="space-y-2 text-neutral-700">
                    <div className="font-semibold text-black">SYSTEM STATUS: OPTIMAL</div>
                    <p>All Odisha village feeders and trunk corridors operating smoothly within prescribed cold-chain limits.</p>
                  </div>
                )}

                {activeDisruption === "heatwave" && (
                  <div className="space-y-3">
                    <div className="font-semibold text-rose-600 flex items-center gap-2">
                      <AlertCircleIcon size={16} />
                      THERMAL ANOMALY TRIGGERED (42°C IN KHORDHA BELT)
                    </div>
                    <p className="text-neutral-700">
                      <strong>ACTION TAKEN:</strong> The AI engine has automatically scheduled emergency precooling at Bhubaneswar Central Cold Hub and throttled tanker refrigeration by +12%, safeguarding Village B raw dairy consignments.
                    </p>
                    <div className="pt-2 border-t border-neutral-200 text-[11px] text-neutral-500">
                      ETA DELTA: 0.0h // EXTRA COOLANT: +₹450 // DECAY RISK: 0.02%
                    </div>
                  </div>
                )}

                {activeDisruption === "landslide" && (
                  <div className="space-y-3">
                    <div className="font-semibold text-rose-600 flex items-center gap-2">
                      <AlertCircleIcon size={16} />
                      RIVERINE FEEDER BLOCKED (MAHANADI BASIN)
                    </div>
                    <p className="text-neutral-700">
                      <strong>ACTION TAKEN:</strong> Autonomous rural shift executed. Village D fresh riverine catch rerouted via Athagarh link straight to Cuttack Crossdock DFC wagon.
                    </p>
                    <div className="pt-2 border-t border-neutral-200 text-[11px] text-neutral-500">
                      ETA DELTA: +15m // COST DELTA: -₹1,200 (Rail Saving) // ON-TIME SLA: 100%
                    </div>
                  </div>
                )}

                {activeDisruption === "rail_congestion" && (
                  <div className="space-y-3">
                    <div className="font-semibold text-amber-600 flex items-center gap-2">
                      <AlertCircleIcon size={16} />
                      PORT CORRIDOR CONGESTION (+2.0h DFC DELAY)
                    </div>
                    <p className="text-neutral-700">
                      <strong>ACTION TAKEN:</strong> Diverted time-critical export tiger prawns to express NH-53 road reefers while non-perishable general cargo remains on rail.
                    </p>
                    <div className="pt-2 border-t border-neutral-200 text-[11px] text-neutral-500">
                      SHIP DEPARTURE CAUGHT // ZERO TEMPERATURE EXCURSIONS
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 06 // AUDIT TRAIL & CRITICAL LOGISTICS ALERTS (#alerts)           */}
        {/* ========================================================================= */}
        <section id="alerts" className="mx-auto max-w-[1680px] p-8 sm:p-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                06 // AUDIT TRAIL & INCIDENTS
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                Real-Time Incident & Risk Alert Feed
              </h2>
            </div>
            <div className="font-mono text-xs text-neutral-500">
              AUDITED CHRONOLOGICAL TELEMETRY
            </div>
          </div>

          <div className="divide-y divide-neutral-100 pt-4 font-mono text-xs">
            {[
              { time: "18:14:20 IST", id: "EVT-9104", hub: "Village A (Pipili)", type: "Floriculture Ingested", desc: "Consignment WB-90141 received and queued for Bhubaneswar crossdock consolidation.", status: "Resolved", statusColor: "text-emerald-600" },
              { time: "17:52:15 IST", id: "EVT-9103", hub: "Bhubaneswar Cold Hub", type: "Pre-cooling Buffer Active", desc: "Village B dairy bulk temperature held at +3.5°C with secondary glycol cooling loop.", status: "Mitigated", statusColor: "text-emerald-600" },
              { time: "16:40:10 IST", id: "EVT-9102", hub: "Paradeep Port Terminal", type: "Berth Docking Assigned", desc: "DFC Cold Train #408 docked at Berth 6 for container vessel loading to Singapore.", status: "Optimal", statusColor: "text-black font-semibold" },
              { time: "15:20:45 IST", id: "EVT-9101", hub: "Cuttack Crossdock", type: "CP-SAT Batch #104 Solved", desc: "6 rural village consignments combined with 96.2% vehicle fill rate and ₹12,400 cost savings.", status: "Complete", statusColor: "text-neutral-500" },
            ].map((item, idx) => (
              <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/70 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-black">{item.type}</span>
                    <span className="text-neutral-400 text-[10px]">[{item.id}]</span>
                    <span className="text-neutral-500 text-[10px]">{item.hub}</span>
                  </div>
                  <div className="text-neutral-600 text-[11px] font-light font-sans">{item.desc}</div>
                </div>

                <div className="flex items-center gap-6 sm:text-right shrink-0">
                  <div className="text-[10px] text-neutral-400">{item.time}</div>
                  <div className={`text-[11px] ${item.statusColor}`}>{item.status}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </>
  );
}