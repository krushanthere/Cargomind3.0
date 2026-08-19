"use client";

import React, { useState } from "react";
import {
  TrainIcon,
  TruckIcon,
  PulseIcon,
  ShieldCheckIcon,
  CrosshairIcon,
} from "../icons/Hugeicons";

export interface MapHub {
  id: string;
  name: string;
  code: string;
  type: "Hub" | "Port" | "Village" | "Terminal";
  x: number; // SVG coordinate
  y: number; // SVG coordinate
  capacityKg: number;
  usedKg: number;
  tempZones: string[];
  activeDocks: number;
  riskStatus: "Optimal" | "Moderate" | "Constrained";
}

export interface MapCorridor {
  id: string;
  from: string;
  to: string;
  mode: "rail" | "road";
  path: string;
  distanceKm: number;
  transitHours: number;
  status: "Clear" | "Congested" | "Weather Alert";
}

export const ODISHA_HUBS_GEO: MapHub[] = [
  { id: "bbs", name: "Bhubaneswar Central Cold Hub", code: "BBS-HUB", type: "Hub", x: 380, y: 320, capacityKg: 120000, usedKg: 92000, tempZones: ["-25°C Frozen", "+4°C Chilled", "+2°C Pharma"], activeDocks: 18, riskStatus: "Optimal" },
  { id: "ctc", name: "Cuttack Crossdock Terminal", code: "CTC-XDK", type: "Terminal", x: 395, y: 260, capacityKg: 85000, usedKg: 64000, tempZones: ["+4°C Chilled Dairy", "-18°C Frozen"], activeDocks: 12, riskStatus: "Optimal" },
  { id: "pdp", name: "Paradeep Port Deepwater Terminal", code: "PDP-PORT", type: "Port", x: 560, y: 310, capacityKg: 190000, usedKg: 162000, tempZones: ["-25°C Marine Export", "+4°C Chilled"], activeDocks: 24, riskStatus: "Moderate" },
  { id: "puri", name: "Puri Coastal Depot", code: "PURI-DEPOT", type: "Hub", x: 390, y: 460, capacityKg: 45000, usedKg: 28000, tempZones: ["-18°C Seafood", "+4°C Dairy"], activeDocks: 6, riskStatus: "Optimal" },
  { id: "v_a", name: "Village A (Pipili Rural Cluster)", code: "VIL-A", type: "Village", x: 385, y: 390, capacityKg: 25000, usedKg: 18500, tempZones: ["+4°C Horticulture", "+12°C Floriculture"], activeDocks: 4, riskStatus: "Optimal" },
  { id: "v_b", name: "Village B (Khordha Dairy Cluster)", code: "VIL-B", type: "Village", x: 310, y: 350, capacityKg: 35000, usedKg: 29000, tempZones: ["+2°C to +4°C Raw Milk", "Chilled Produce"], activeDocks: 5, riskStatus: "Optimal" },
  { id: "v_c", name: "Village C (Nimapada Agro Belt)", code: "VIL-C", type: "Village", x: 470, y: 390, capacityKg: 30000, usedKg: 22000, tempZones: ["+4°C Dairy Sweets", "+8°C Vegetables"], activeDocks: 4, riskStatus: "Optimal" },
  { id: "v_d", name: "Village D (Banki Riverine Farms)", code: "VIL-D", type: "Village", x: 300, y: 270, capacityKg: 20000, usedKg: 14000, tempZones: ["+2°C Fresh Fish", "+10°C Organic Greens"], activeDocks: 3, riskStatus: "Optimal" },
  { id: "bam", name: "Berhampur South Logistics Hub", code: "BAM-HUB", type: "Hub", x: 230, y: 530, capacityKg: 75000, usedKg: 51000, tempZones: ["-18°C Frozen", "Ambient"], activeDocks: 10, riskStatus: "Optimal" },
  { id: "bls", name: "Balasore Coastal Crossdock", code: "BLS-XDK", type: "Terminal", x: 540, y: 120, capacityKg: 65000, usedKg: 48000, tempZones: ["-25°C Prawn Processing", "Ambient"], activeDocks: 8, riskStatus: "Moderate" },
  { id: "sbp", name: "Sambalpur Inland Multi-Modal Hub", code: "SBP-LOG", type: "Hub", x: 180, y: 200, capacityKg: 90000, usedKg: 72000, tempZones: ["+4°C Agri-Cold", "Ambient"], activeDocks: 14, riskStatus: "Optimal" },
  { id: "rrk", name: "Rourkela Cold Freight Terminal", code: "RRK-LOG", type: "Terminal", x: 240, y: 80, capacityKg: 80000, usedKg: 58000, tempZones: ["-18°C Frozen", "Pharma"], activeDocks: 10, riskStatus: "Optimal" },
];

export const ODISHA_CORRIDORS_GEO: MapCorridor[] = [
  // Village Feeders to Bhubaneswar & Cuttack
  { id: "c_va_bbs", from: "v_a", to: "bbs", mode: "road", path: "M 385 390 L 380 320", distanceKm: 20, transitHours: 0.6, status: "Clear" },
  { id: "c_vb_bbs", from: "v_b", to: "bbs", mode: "road", path: "M 310 350 L 380 320", distanceKm: 25, transitHours: 0.7, status: "Clear" },
  { id: "c_vc_bbs", from: "v_c", to: "bbs", mode: "road", path: "M 470 390 L 380 320", distanceKm: 38, transitHours: 1.0, status: "Clear" },
  { id: "c_vd_ctc", from: "v_d", to: "ctc", mode: "road", path: "M 300 270 L 395 260", distanceKm: 42, transitHours: 1.1, status: "Clear" },
  { id: "c_va_puri", from: "v_a", to: "puri", mode: "road", path: "M 385 390 L 390 460", distanceKm: 40, transitHours: 0.9, status: "Clear" },
  
  // Core Trunk Corridors
  { id: "c_bbs_ctc", from: "bbs", to: "ctc", mode: "rail", path: "M 380 320 L 395 260", distanceKm: 28, transitHours: 0.5, status: "Clear" },
  { id: "c_ctc_pdp", from: "ctc", to: "pdp", mode: "rail", path: "M 395 260 L 560 310", distanceKm: 85, transitHours: 1.8, status: "Clear" },
  { id: "c_bbs_pdp", from: "bbs", to: "pdp", mode: "rail", path: "M 380 320 Q 470 300 560 310", distanceKm: 105, transitHours: 2.2, status: "Clear" },
  { id: "c_vc_pdp", from: "v_c", to: "pdp", mode: "road", path: "M 470 390 L 560 310", distanceKm: 72, transitHours: 1.8, status: "Clear" },
  { id: "c_bbs_puri", from: "bbs", to: "puri", mode: "road", path: "M 380 320 L 390 460", distanceKm: 60, transitHours: 1.2, status: "Clear" },
  
  // Regional Odisha Trunk Interconnects
  { id: "c_bbs_bam", from: "bbs", to: "bam", mode: "rail", path: "M 380 320 Q 300 440 230 530", distanceKm: 170, transitHours: 3.5, status: "Clear" },
  { id: "c_ctc_bls", from: "ctc", to: "bls", mode: "rail", path: "M 395 260 Q 470 180 540 120", distanceKm: 180, transitHours: 3.8, status: "Clear" },
  { id: "c_ctc_sbp", from: "ctc", to: "sbp", mode: "rail", path: "M 395 260 Q 280 220 180 200", distanceKm: 270, transitHours: 5.5, status: "Clear" },
  { id: "c_sbp_rrk", from: "sbp", to: "rrk", mode: "rail", path: "M 180 200 L 240 80", distanceKm: 150, transitHours: 2.8, status: "Clear" },
];

interface SwissLogisticsMapProps {
  selectedHubId?: string;
  onSelectHub?: (hub: MapHub) => void;
}

export default function SwissLogisticsMap({
  selectedHubId = "bbs",
  onSelectHub,
}: SwissLogisticsMapProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "rail" | "road">("all");
  const [hoveredHub, setHoveredHub] = useState<MapHub | null>(null);

  const currentSelectedHub =
    ODISHA_HUBS_GEO.find((h) => h.id === selectedHubId) || ODISHA_HUBS_GEO[0];

  const visibleCorridors = ODISHA_CORRIDORS_GEO.filter((c) => {
    if (activeFilter === "all") return true;
    return c.mode === activeFilter;
  });

  return (
    <div className="w-full bg-white border border-neutral-200">
      {/* Map Top Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 border-b border-neutral-200 bg-neutral-50/60 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-black font-semibold">
            <span className="h-2 w-2 rounded-full bg-black animate-pulse" />
            <span>ODISHA & BHUBANESWAR FREIGHT NETWORK</span>
          </div>
          <span className="text-neutral-300">|</span>
          <span className="text-neutral-500 text-[10px]">
            BHUBANESWAR METRO // VILLAGES A, B, C, D & COASTAL DFC LANES
          </span>
        </div>

        {/* Mode Filter Toggles */}
        <div className="flex items-center gap-1 bg-white border border-neutral-200 p-0.5 rounded-full text-[10px]">
          {(["all", "rail", "road"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveFilter(mode)}
              className={`px-3 py-1 rounded-full uppercase tracking-wider transition-colors cursor-pointer ${
                activeFilter === mode
                  ? "bg-black text-white font-semibold"
                  : "text-neutral-500 hover:text-black"
              }`}
            >
              {mode === "all" ? "All Corridors" : mode === "rail" ? "Rail DFC" : "Road Reefer"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map SVG Canvas */}
      <div className="relative w-full overflow-hidden bg-white swiss-grid-pattern py-8 px-4 flex items-center justify-center min-h-[580px]">
        <svg
          viewBox="0 0 740 640"
          className="w-full max-w-[740px] h-auto overflow-visible select-none"
        >
          {/* Subtle Grid Lat/Lon Lines */}
          <g className="text-neutral-200 stroke-current" strokeWidth="0.5" strokeDasharray="3 6">
            <line x1="80" y1="120" x2="680" y2="120" />
            <line x1="80" y1="260" x2="680" y2="260" />
            <line x1="80" y1="390" x2="680" y2="390" />
            <line x1="80" y1="520" x2="680" y2="520" />
            <line x1="180" y1="40" x2="180" y2="600" />
            <line x1="380" y1="40" x2="380" y2="600" />
            <line x1="560" y1="40" x2="560" y2="600" />
          </g>

          {/* East Coastline (Bay of Bengal Contours in Minimalist Vector) */}
          <path
            d="M 640 40 Q 560 140 570 260 T 580 340 Q 510 440 430 480 Q 340 520 250 620"
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="2.5"
            strokeDasharray="6 6"
          />
          <text
            x="600"
            y="440"
            fontFamily="JetBrains Mono, monospace"
            fontSize="9"
            fill="#a1a1aa"
            letterSpacing="0.2em"
            transform="rotate(65 600 440)"
          >
            BAY OF BENGAL (COASTAL EXPORT ZONE)
          </text>

          {/* Mahanadi River Flow Vector */}
          <path
            d="M 120 180 Q 230 230 300 270 T 395 260 T 480 275 Q 530 290 560 310"
            fill="none"
            stroke="#d4d4d8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <text
            x="200"
            y="235"
            fontFamily="JetBrains Mono, monospace"
            fontSize="8"
            fill="#a1a1aa"
          >
            Mahanadi River Basin
          </text>

          {/* Rural Village Cluster Buffer Zone Highlight (Pipili, Khordha, Nimapada, Banki) */}
          <path
            d="M 280 250 Q 400 230 500 370 T 380 430 T 280 380 Z"
            fill="none"
            stroke="#f4f4f5"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Corridor Interconnect Paths */}
          {visibleCorridors.map((c) => {
            const isConnectedToSelected =
              c.from === selectedHubId || c.to === selectedHubId;

            return (
              <g key={c.id}>
                {isConnectedToSelected && (
                  <path
                    d={c.path}
                    fill="none"
                    stroke="#e4e4e7"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                )}

                <path
                  d={c.path}
                  fill="none"
                  stroke={
                    isConnectedToSelected
                      ? "#0a0a0a"
                      : c.mode === "rail"
                      ? "#52525b"
                      : "#a1a1aa"
                  }
                  strokeWidth={isConnectedToSelected ? 2.5 : c.mode === "rail" ? 1.8 : 1.2}
                  strokeDasharray={c.mode === "rail" ? "5 6" : "none"}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />

                {/* Animated Flow Dot on Rail DFC */}
                {c.mode === "rail" && (
                  <circle r="2.5" fill="#000000">
                    <animateMotion
                      path={c.path}
                      dur={`${Math.max(4, Math.round(c.transitHours * 2))}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Hub & Village Nodes */}
          {ODISHA_HUBS_GEO.map((hub) => {
            const isSelected = hub.id === selectedHubId;
            const isVillage = hub.type === "Village";
            const isPort = hub.type === "Port";
            const fillRatio = hub.usedKg / hub.capacityKg;

            return (
              <g
                key={hub.id}
                onClick={() => onSelectHub?.(hub)}
                onMouseEnter={() => setHoveredHub(hub)}
                onMouseLeave={() => setHoveredHub(null)}
                className="cursor-pointer group"
              >
                {/* Selection Halo */}
                {isSelected && (
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r={isVillage ? "18" : "24"}
                    fill="none"
                    stroke="#0a0a0a"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                    className="animate-starburst-spin-fast"
                  />
                )}

                {/* Outer Geometry (Square for Villages, Circle for Hubs) */}
                {isVillage ? (
                  <rect
                    x={hub.x - (isSelected ? 7 : 5.5)}
                    y={hub.y - (isSelected ? 7 : 5.5)}
                    width={isSelected ? 14 : 11}
                    height={isSelected ? 14 : 11}
                    fill="#ffffff"
                    stroke={isSelected ? "#0a0a0a" : "#71717a"}
                    strokeWidth={isSelected ? 1.8 : 1.2}
                    className="transition-all duration-200"
                  />
                ) : (
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r={isSelected ? 10 : isPort ? 9 : 8}
                    fill="#ffffff"
                    stroke={isSelected ? "#0a0a0a" : "#71717a"}
                    strokeWidth={isSelected ? 2 : 1.2}
                    className="transition-all duration-200"
                  />
                )}

                {/* Inner Core Dot */}
                <circle
                  cx={hub.x}
                  cy={hub.y}
                  r={isSelected ? 4 : isVillage ? 2.5 : 3.5}
                  fill={
                    isSelected
                      ? "#0a0a0a"
                      : isVillage
                      ? "#0a0a0a"
                      : hub.riskStatus === "Optimal"
                      ? "#10b981"
                      : "#0a0a0a"
                  }
                  className="transition-all duration-200"
                />

                {/* Node Code Label */}
                <text
                  x={hub.x + (isVillage ? 12 : 14)}
                  y={hub.y + 4}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize={isVillage ? "9" : "10"}
                  fontWeight={isSelected ? "700" : isVillage ? "600" : "500"}
                  fill={isSelected ? "#0a0a0a" : isVillage ? "#27272a" : "#52525b"}
                  className="transition-colors pointer-events-none"
                >
                  {hub.code}
                </text>

                {/* Node Subtitle */}
                <text
                  x={hub.x + (isVillage ? 12 : 14)}
                  y={hub.y + 15}
                  fontFamily="Inter, sans-serif"
                  fontSize="8"
                  fill="#a1a1aa"
                  className="pointer-events-none"
                >
                  {isVillage ? "Rural Feeder" : `${Math.round(fillRatio * 100)}% Cap`}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Protocol & Map Key */}
        <div className="absolute bottom-4 left-4 p-3 border border-neutral-200 bg-white/95 backdrop-blur-xs font-mono text-[10px] space-y-1.5 text-neutral-600">
          <div className="text-neutral-400 uppercase text-[9px]">ODISHA LOGISTICS PROTOCOL</div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-[2px] bg-black border-dashed border-b border-black" />
            <span>East Coast DFC Rail Corridor (BBS–CTC–PDP)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-[1.5px] bg-neutral-400" />
            <span>Regional Reefer Arterial (NH-16, NH-316, NH-53)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 border border-black inline-block" />
            <span>Rural Consolidation Nodes (Villages A, B, C, D)</span>
          </div>
        </div>

        {/* Selected Hub Telemetry Cardlet */}
        <div className="absolute top-4 right-4 p-4 border border-neutral-200 bg-white/95 backdrop-blur-xs font-mono text-xs max-w-xs space-y-2">
          <div className="text-[10px] text-neutral-400 uppercase tracking-wider">
            {currentSelectedHub.type.toUpperCase()} TELEMETRY
          </div>
          <div className="font-semibold text-black text-sm">{currentSelectedHub.name}</div>
          <div className="text-[11px] text-neutral-600">
            Capacity: {(currentSelectedHub.usedKg / 1000).toFixed(1)}T / {(currentSelectedHub.capacityKg / 1000).toFixed(1)}T
          </div>
          <div className="linear-meter">
            <div
              className="linear-meter-fill"
              style={{
                width: `${Math.round((currentSelectedHub.usedKg / currentSelectedHub.capacityKg) * 100)}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1">
            <span>DOCKS: {currentSelectedHub.activeDocks} ACTIVE</span>
            <span className="text-black font-semibold uppercase">{currentSelectedHub.riskStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
