"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  OSM_RURAL_CLUSTERS,
  OSM_ESSENTIAL_POIS,
  OSM_NER_STATES_DATA,
} from "../../../components/map/data/nerOsmLogisticsData";
import {
  ShieldCheckIcon,
  PulseIcon,
  RouteIcon,
  AlertCircleIcon,
  CheckmarkCircleIcon,
  ArrowRightIcon,
  RefreshIcon,
  SlidersIcon,
  CubeIcon,
  DatabaseIcon,
  TruckIcon,
} from "../../../components/icons/Hugeicons";

export default function AccessibilityDashboardPage() {
  const locale = useLocale();

  // Filter States
  const [selectedState, setSelectedState] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);

  // Dynamic Simulator State
  const [simState, setSimState] = useState<string>("Meghalaya");
  const [simSlope, setSimSlope] = useState<number>(14.0);
  const [simElev, setSimElev] = useState<number>(1350);
  const [simRoadSurface, setSimRoadSurface] = useState<"asphalt" | "paved" | "unpaved" | "mud_track">("paved");
  const [simRoadStatus, setSimRoadStatus] = useState<"clear" | "difficult" | "blocked">("difficult");
  const [simHubDist, setSimHubDist] = useState<number>(32);
  const [simIsMonsoon, setSimIsMonsoon] = useState<boolean>(true);
  const [simIsFloodProne, setSimIsFloodProne] = useState<boolean>(false);

  // Calculated Dynamic Score for Simulator
  const dynamicResult = useMemo(() => {
    // 1. Road Connectivity (max 25)
    let roadScore = simRoadSurface === "asphalt" ? 24 : simRoadSurface === "paved" ? 18 : simRoadSurface === "unpaved" ? 11 : 5;
    if (simRoadStatus === "difficult") roadScore *= 0.65;
    if (simRoadStatus === "blocked") roadScore *= 0.15;
    roadScore = Math.round(roadScore * 10) / 10;

    // 2. Terrain & Elevation (max 20)
    let terrainScore = 20;
    if (simSlope > 25 || simElev > 2000) terrainScore = 5;
    else if (simSlope > 15 || simElev > 1200) terrainScore = 10;
    else if (simSlope > 8 || simElev > 500) terrainScore = 14;
    else if (simSlope > 4) terrainScore = 17;

    // 3. Multimodal / Rail Proximity (max 20)
    const railScore = simHubDist < 20 ? 20 : simHubDist < 45 ? 15 : simHubDist < 80 ? 10 : 5;

    // 4. Disaster Resilience (max 20)
    let disasterScore = 18;
    if (simIsFloodProne) disasterScore -= simIsMonsoon ? 10 : 5;
    if (simSlope > 15 && simIsMonsoon) disasterScore -= 6;
    disasterScore = Math.max(2, disasterScore);

    // 5. Hub Proximity (max 15)
    const hubScore = simHubDist < 15 ? 15 : simHubDist < 35 ? 12 : simHubDist < 75 ? 8 : 4;

    const total = Math.min(100, Math.max(5, Math.round((roadScore + terrainScore + railScore + disasterScore + hubScore) * 10) / 10));

    let tier = "Highly Accessible";
    let tierColor = "text-emerald-400 border-emerald-500/40 bg-emerald-950/30";
    let recVehicle = "Heavy Commercial Truck (16T) / Tata Ace";
    if (total < 35) {
      tier = "Critical Isolation";
      tierColor = "text-rose-400 border-rose-500/40 bg-rose-950/30";
      recVehicle = "Agri-Drone Air Carrier / 4x4 Mountain Mule";
    } else if (total < 55) {
      tier = "Constrained Access";
      tierColor = "text-amber-400 border-amber-500/40 bg-amber-950/30";
      recVehicle = "Mahindra 4x4 Bolero Pickup / Riverine Barge";
    } else if (total < 75) {
      tier = "Moderately Accessible";
      tierColor = "text-cyan-400 border-cyan-500/40 bg-cyan-950/30";
      recVehicle = "Tata Ace Cold LCV (1.2T) / Electric 3-Wheeler";
    }

    return {
      total,
      tier,
      tierColor,
      recVehicle,
      breakdown: {
        road: roadScore,
        terrain: terrainScore,
        rail: railScore,
        disaster: disasterScore,
        hub: hubScore,
      },
    };
  }, [simRoadSurface, simRoadStatus, simSlope, simElev, simHubDist, simIsMonsoon, simIsFloodProne]);

  // Filtered Habitations List
  const filteredClusters = useMemo(() => {
    return OSM_RURAL_CLUSTERS.filter((c) => {
      if (selectedState !== "all" && c.state.toLowerCase() !== selectedState.toLowerCase()) return false;
      if (c.accessibilityScore < minScoreFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q) ||
          c.primaryCommodity.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedState, minScoreFilter, searchQuery]);

  // Aggregate Metrics
  const avgScore = Math.round(
    OSM_RURAL_CLUSTERS.reduce((acc, c) => acc + c.accessibilityScore, 0) / OSM_RURAL_CLUSTERS.length
  );
  const criticalCount = OSM_RURAL_CLUSTERS.filter((c) => c.accessibilityScore < 45).length;
  const optimalCount = OSM_RURAL_CLUSTERS.filter((c) => c.accessibilityScore >= 75).length;

  return (
    <main className="min-h-[calc(100vh-76px)] bg-white dark:bg-[#09090b] text-[#0a0a0a] dark:text-[#f4f4f5] transition-colors duration-200">
      {/* Top Breadcrumb Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#0c0c0e]">
        <div className="mx-auto max-w-[1600px] px-6 sm:px-10 py-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="text-black dark:text-white font-semibold">01 // ACCESSIBILITY INTELLIGENCE</span>
            <span>{"//"}</span>
            <span>DYNAMIC ACCESSIBILITY INDEX & TOPOGRAPHICAL GRADING</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/60 px-2 py-0.5 rounded text-[10px]">
              SIH26002 VERIFIED
            </span>
            <span className="font-mono text-neutral-600 dark:text-neutral-400">SYS.V.3.0 // 8 NER STATES</span>
          </div>
        </div>
      </div>

      {/* Hero Manifesto & Executive Summary */}
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 py-12 sm:py-16 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-4xl space-y-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
            SIH 2026 PROBLEM STATEMENT SIH26002 &bull; NORTH EASTERN REGION
          </div>
          <h1 className="text-3xl sm:text-5xl font-light tracking-[-0.03em] text-black dark:text-white leading-tight">
            Dynamic Accessibility <span className="font-semibold">Intelligence Engine</span>
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 font-light leading-relaxed">
            A composite, explainable intelligence metric (0–100) evaluating last-mile isolation across 66,899 PMGSY habitations.
            Fusing real-time SRTM 30m DEM slope angles, GatiShakti NFR rail connectivity, National Waterway-2 river terminals, and monsoon flood risk maps.
          </p>
        </div>
      </div>

      {/* 1px Split Grid: Macro Regional Metrics */}
      <div className="mx-auto max-w-[1600px] border-b border-neutral-200 dark:border-neutral-800">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800 font-mono">
          <div className="p-6 sm:p-8 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Regional Composite Average
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-black dark:text-white flex items-baseline gap-2">
              <span>{avgScore}</span>
              <span className="text-xs text-neutral-500 font-normal">/ 100</span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
              Assam 84 &bull; Meghalaya 71 &bull; Arunachal 56
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Optimal Corridor Nodes
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-400 flex items-baseline gap-2">
              <span>{optimalCount}</span>
              <span className="text-xs text-neutral-500 font-normal">Clusters</span>
            </div>
            <div className="text-[11px] text-neutral-500">
              Score &ge; 75 &bull; All-Weather Paved Access
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Critical Isolation Hotspots
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-rose-600 dark:text-rose-400 flex items-baseline gap-2">
              <span>{criticalCount}</span>
              <span className="text-xs text-neutral-500 font-normal">Clusters</span>
            </div>
            <div className="text-[11px] text-neutral-500">
              Score &lt; 45 &bull; High Monsoon Washout Risk
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Essential POIs Tracked
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-cyan-600 dark:text-cyan-400 flex items-baseline gap-2">
              <span>{OSM_ESSENTIAL_POIS.length}</span>
              <span className="text-xs text-neutral-500 font-normal">Hospitals/Haats</span>
            </div>
            <div className="text-[11px] text-neutral-500">
              Assam & Meghalaya Focus Nodes
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Interactive Dynamic Simulator + 5-Factor Formulation */}
      <div className="mx-auto max-w-[1600px] border-b border-neutral-200 dark:border-neutral-800">
        <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800">
          
          {/* Left Column: Interactive Simulation Workbench */}
          <div className="lg:col-span-7 p-6 sm:p-10 space-y-8">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
                INTERACTIVE SCENARIO SIMULATOR
              </div>
              <h2 className="text-2xl font-light text-black dark:text-white">
                Simulate <span className="font-semibold">Topographical & Weather Disruptions</span>
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 font-light mt-1">
                Adjust terrain slope, PMGSY road roughness, and monsoon hazards to inspect dynamic accessibility score responses.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 font-mono text-xs">
              {/* State & Road Surface */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1.5 uppercase font-bold">
                    Focus Territory
                  </label>
                  <select
                    value={simState}
                    onChange={(e) => setSimState(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-black dark:text-white focus:outline-none"
                  >
                    <option value="Assam">Assam (Brahmaputra Valley)</option>
                    <option value="Meghalaya">Meghalaya (Khasi & Garo Highlands)</option>
                    <option value="Arunachal Pradesh">Arunachal Pradesh (High Himalayas)</option>
                    <option value="Manipur">Manipur (Imphal Valley & Hills)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1.5 uppercase font-bold">
                    Road Surface Type (PMGSY)
                  </label>
                  <select
                    value={simRoadSurface}
                    onChange={(e) => setSimRoadSurface(e.target.value as any)}
                    className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-black dark:text-white focus:outline-none"
                  >
                    <option value="asphalt">Asphalt 2-Lane Highway (IRI 2.0)</option>
                    <option value="paved">Paved Single-Lane Road (IRI 4.5)</option>
                    <option value="unpaved">Unpaved Compacted Gravel (IRI 7.5)</option>
                    <option value="mud_track">Single-Track Dirt / Mud (IRI 11.0)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1.5 uppercase font-bold">
                    Current RoadSense Status
                  </label>
                  <select
                    value={simRoadStatus}
                    onChange={(e) => setSimRoadStatus(e.target.value as any)}
                    className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-black dark:text-white focus:outline-none"
                  >
                    <option value="clear">Clear (Nominal Flow)</option>
                    <option value="difficult">Difficult (Mud/Debris/Convoy)</option>
                    <option value="blocked">Blocked (Landslide/Washout)</option>
                  </select>
                </div>
              </div>

              {/* Terrain Slope & Elevation Sliders */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-500 mb-1 font-bold">
                    <span>SRTM Terrain Gradient</span>
                    <span className="text-black dark:text-white">{simSlope}% Slope</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="35"
                    step="0.5"
                    value={simSlope}
                    onChange={(e) => setSimSlope(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-neutral-500 mb-1 font-bold">
                    <span>Elevation ASL</span>
                    <span className="text-black dark:text-white">{simElev} meters</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="3000"
                    step="50"
                    value={simElev}
                    onChange={(e) => setSimElev(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-neutral-500 mb-1 font-bold">
                    <span>Distance to Primary Hub</span>
                    <span className="text-black dark:text-white">{simHubDist} km</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    step="5"
                    value={simHubDist}
                    onChange={(e) => setSimHubDist(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Weather & Hazard Checkboxes */}
            <div className="flex flex-wrap items-center gap-6 font-mono text-xs pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={simIsMonsoon}
                  onChange={(e) => setSimIsMonsoon(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4"
                />
                <span>Active Monsoon Season (Rainfall &gt; 150mm)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={simIsFloodProne}
                  onChange={(e) => setSimIsFloodProne(e.target.checked)}
                  className="accent-rose-500 w-4 h-4"
                />
                <span>Floodplain Inundation Zone Active</span>
              </label>
            </div>
          </div>

          {/* Right Column: Computed Dynamic Intelligence Score Card */}
          <div className="lg:col-span-5 p-6 sm:p-10 bg-neutral-50/50 dark:bg-[#0c0c0e] flex flex-col justify-between space-y-6 font-mono">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
                REAL-TIME SIMULATION RESULT
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-black dark:text-white">Composite Score</h3>
                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${dynamicResult.tierColor}`}>
                  {dynamicResult.tier}
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-6xl font-black text-black dark:text-white tracking-tight">
                  {dynamicResult.total}
                </span>
                <span className="text-sm text-neutral-500 font-normal">/ 100 Index Pts</span>
              </div>
            </div>

            {/* 5-Factor Score Decomposition Bars */}
            <div className="space-y-3 text-xs">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold border-b border-neutral-200 dark:border-neutral-800 pb-1">
                Decomposed Factor Contributions
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-600 dark:text-neutral-400">1. Road Connectivity (Max 25)</span>
                  <span className="font-bold text-black dark:text-white">{dynamicResult.breakdown.road} / 25</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(dynamicResult.breakdown.road / 25) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-600 dark:text-neutral-400">2. Terrain & Slope (Max 20)</span>
                  <span className="font-bold text-black dark:text-white">{dynamicResult.breakdown.terrain} / 20</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full" style={{ width: `${(dynamicResult.breakdown.terrain / 20) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-600 dark:text-neutral-400">3. Multimodal & Rail Proximity (Max 20)</span>
                  <span className="font-bold text-black dark:text-white">{dynamicResult.breakdown.rail} / 20</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full" style={{ width: `${(dynamicResult.breakdown.rail / 20) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-600 dark:text-neutral-400">4. Disaster Resilience (Max 20)</span>
                  <span className="font-bold text-black dark:text-white">{dynamicResult.breakdown.disaster} / 20</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${(dynamicResult.breakdown.disaster / 20) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-600 dark:text-neutral-400">5. Hub & Facility Distance (Max 15)</span>
                  <span className="font-bold text-black dark:text-white">{dynamicResult.breakdown.hub} / 15</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${(dynamicResult.breakdown.hub / 15) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Recommended Vehicle Directive */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-lg text-xs space-y-1">
              <div className="text-[10px] text-neutral-500 uppercase font-bold">
                AI Dispatch Recommendation
              </div>
              <div className="font-bold text-black dark:text-white flex items-center gap-2">
                <TruckIcon size={16} className="text-emerald-500" />
                <span>{dynamicResult.recVehicle}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Habitations & Cluster Accessibility Leaderboard Table */}
      <div className="mx-auto max-w-[1600px] p-6 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
              RURAL HABITATIONS LEADERBOARD
            </div>
            <h2 className="text-2xl font-light text-black dark:text-white">
              Accessibility Index <span className="font-semibold">Directory</span>
            </h2>
          </div>

          {/* Table Controls */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <input
              type="text"
              placeholder="Search village or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-black dark:text-white focus:outline-none"
            />

            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-black dark:text-white focus:outline-none"
            >
              <option value="all">All States ({OSM_RURAL_CLUSTERS.length})</option>
              <option value="assam">Assam (62)</option>
              <option value="meghalaya">Meghalaya (20)</option>
              <option value="arunachal">Arunachal Pradesh (24)</option>
              <option value="manipur">Manipur (18)</option>
              <option value="mizoram">Mizoram (16)</option>
              <option value="nagaland">Nagaland (18)</option>
              <option value="tripura">Tripura (14)</option>
              <option value="sikkim">Sikkim (14)</option>
            </select>

            <Link
              href={`/${locale}/map`}
              className="bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <span>View On Digital Twin</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        </div>

        {/* Directory Table */}
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden font-mono text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left divide-y divide-neutral-200 dark:divide-neutral-800">
              <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-[10px] text-neutral-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Village / Cluster</th>
                  <th className="px-4 py-3">State & District</th>
                  <th className="px-4 py-3">Elevation & Slope</th>
                  <th className="px-4 py-3">PMGSY Road Status</th>
                  <th className="px-4 py-3">Primary Produce</th>
                  <th className="px-4 py-3 text-right">Accessibility Score</th>
                  <th className="px-4 py-3">Recommended Vehicle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-[#0a0a0c]">
                {filteredClusters.slice(0, 25).map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-black dark:text-white">
                      {c.name}
                      <div className="text-[10px] text-neutral-400 font-normal">Pop: {c.population.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                      {c.district}, {c.state}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                      {c.elevation_m}m &bull; {c.terrainDifficulty}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-neutral-600 dark:text-neutral-300">{c.roadCondition}</span>
                      <div className="text-[10px] text-neutral-400">IRI: {c.roadSenseIRI}</div>
                    </td>
                    <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-medium">
                      {c.primaryCommodity}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold ${
                          c.accessibilityScore >= 75
                            ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                            : c.accessibilityScore >= 50
                            ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300"
                            : "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        {c.accessibilityScore} / 100
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 text-[11px]">
                      {c.recommendedVehicle}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
