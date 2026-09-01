"use client";

import React, { useState, memo } from "react";
import { useTranslations } from "next-intl";
import {
  TruckIcon,
  PulseIcon,
  ShieldCheckIcon,
  CrosshairIcon,
  AlertCircleIcon,
  SunIcon,
  BatteryIcon,
  LeafIcon,
} from "../icons/Hugeicons";

export interface MapHub {
  id: string;
  name: string;
  code: string;
  node_type: "aggregation_point" | "informal_cold_storage" | "warehouse" | "crossdock";
  power_reliability: "grid" | "solar" | "unreliable";
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
  mode: "local" | "road";
  condition: "paved" | "unpaved" | "seasonal" | "flood_risk";
  path: string;
  distanceKm: number;
  transitHours: number;
  status: "Clear" | "Flooded Alert" | "Unpaved Caution" | "Optimal";
}

export interface MapVehicle {
  id: string;
  name: string;
  type: "motorbike" | "tempo" | "tractor" | "shared_auto";
  capacityKg: number;
  usedKg: number;
  temp_control: boolean;
  x: number;
  y: number;
  status: "available" | "en_route";
}

export const RURAL_HUBS_GEO: MapHub[] = [
  { id: "v_a", name: "Village A (Pipili Rural Cluster)", code: "VIL-A", node_type: "aggregation_point", power_reliability: "solar", x: 385, y: 390, capacityKg: 25000, usedKg: 18500, tempZones: ["+4°C Horticulture", "+12°C Floriculture"], activeDocks: 4, riskStatus: "Optimal" },
  { id: "v_b", name: "Village B (Khordha Dairy Cluster)", code: "VIL-B", node_type: "aggregation_point", power_reliability: "unreliable", x: 310, y: 350, capacityKg: 35000, usedKg: 29000, tempZones: ["+2°C to +4°C Raw Milk", "Chilled Produce"], activeDocks: 5, riskStatus: "Optimal" },
  { id: "v_c", name: "Village C (Nimapada Agro Belt)", code: "VIL-C", node_type: "informal_cold_storage", power_reliability: "solar", x: 470, y: 390, capacityKg: 30000, usedKg: 22000, tempZones: ["+4°C Dairy Sweets", "+8°C Vegetables"], activeDocks: 4, riskStatus: "Optimal" },
  { id: "v_d", name: "Village D (Banki Riverine Farms)", code: "VIL-D", node_type: "aggregation_point", power_reliability: "unreliable", x: 300, y: 270, capacityKg: 20000, usedKg: 14000, tempZones: ["+2°C Fresh Fish", "+10°C Organic Greens"], activeDocks: 3, riskStatus: "Moderate" },
  { id: "bbs", name: "Bhubaneswar Central Cold Hub", code: "BBS-HUB", node_type: "warehouse", power_reliability: "grid", x: 380, y: 320, capacityKg: 120000, usedKg: 92000, tempZones: ["-25°C Frozen", "+4°C Chilled", "+2°C Pharma"], activeDocks: 18, riskStatus: "Optimal" },
  { id: "ctc", name: "Cuttack Crossdock Terminal", code: "CTC-XDK", node_type: "crossdock", power_reliability: "grid", x: 395, y: 260, capacityKg: 85000, usedKg: 64000, tempZones: ["+4°C Chilled Dairy", "-18°C Frozen"], activeDocks: 12, riskStatus: "Optimal" },
  { id: "puri", name: "Puri Coastal Depot", code: "PURI-DEPOT", node_type: "aggregation_point", power_reliability: "grid", x: 390, y: 460, capacityKg: 45000, usedKg: 28000, tempZones: ["-18°C Seafood", "+4°C Dairy"], activeDocks: 6, riskStatus: "Optimal" },
  { id: "pdp", name: "Paradeep Port Deepwater Terminal", code: "PDP-PORT", node_type: "warehouse", power_reliability: "grid", x: 560, y: 310, capacityKg: 190000, usedKg: 162000, tempZones: ["-25°C Marine Export", "+4°C Chilled"], activeDocks: 24, riskStatus: "Moderate" },
];

export const RURAL_CORRIDORS_GEO: MapCorridor[] = [
  { id: "c_va_bbs", from: "v_a", to: "bbs", mode: "local", condition: "paved", path: "M 385 390 L 380 320", distanceKm: 20, transitHours: 0.6, status: "Clear" },
  { id: "c_vb_bbs", from: "v_b", to: "bbs", mode: "local", condition: "paved", path: "M 310 350 L 380 320", distanceKm: 25, transitHours: 0.7, status: "Clear" },
  { id: "c_vc_bbs", from: "v_c", to: "bbs", mode: "local", condition: "unpaved", path: "M 470 390 L 380 320", distanceKm: 38, transitHours: 1.2, status: "Unpaved Caution" },
  { id: "c_vd_ctc", from: "v_d", to: "ctc", mode: "local", condition: "flood_risk", path: "M 300 270 L 395 260", distanceKm: 42, transitHours: 1.8, status: "Flooded Alert" },
  { id: "c_va_puri", from: "v_a", to: "puri", mode: "local", condition: "paved", path: "M 385 390 L 390 460", distanceKm: 40, transitHours: 0.9, status: "Clear" },
  { id: "c_bbs_ctc", from: "bbs", to: "ctc", mode: "road", condition: "paved", path: "M 380 320 L 395 260", distanceKm: 28, transitHours: 0.6, status: "Clear" },
  { id: "c_ctc_pdp", from: "ctc", to: "pdp", mode: "road", condition: "paved", path: "M 395 260 L 560 310", distanceKm: 85, transitHours: 2.0, status: "Clear" },
  { id: "c_bbs_pdp", from: "bbs", to: "pdp", mode: "road", condition: "seasonal", path: "M 380 320 Q 470 300 560 310", distanceKm: 105, transitHours: 2.6, status: "Clear" },
  { id: "c_vc_pdp", from: "v_c", to: "pdp", mode: "local", condition: "unpaved", path: "M 470 390 L 560 310", distanceKm: 72, transitHours: 2.2, status: "Unpaved Caution" },
];

export const RURAL_VEHICLES_MAP: MapVehicle[] = [
  { id: "veh-1", name: "Pipili Solar Reefer Tempo #1", type: "tempo", capacityKg: 1500, usedKg: 1200, temp_control: true, x: 382, y: 355, status: "en_route" },
  { id: "veh-2", name: "Banki Riverine Motorbike Courier", type: "motorbike", capacityKg: 90, usedKg: 40, temp_control: true, x: 330, y: 265, status: "en_route" },
  { id: "veh-3", name: "Nimapada Agri-Tractor Trailer", type: "tractor", capacityKg: 3500, usedKg: 2800, temp_control: false, x: 490, y: 360, status: "en_route" },
  { id: "veh-4", name: "Khordha Community Auto Loader", type: "shared_auto", capacityKg: 450, usedKg: 350, temp_control: false, x: 345, y: 335, status: "en_route" },
];

interface SwissLogisticsMapProps {
  selectedHubId?: string;
  onSelectHub?: (hub: MapHub) => void;
}

function SwissLogisticsMapComponent({
  selectedHubId = "v_a",
  onSelectHub,
}: SwissLogisticsMapProps) {
  const t = useTranslations("home.network");
  const tc = useTranslations("common");

  const [activeFilter, setActiveFilter] = useState<"all" | "local" | "road">("all");
  const [hoveredHub, setHoveredHub] = useState<MapHub | null>(null);

  const currentSelectedHub =
    RURAL_HUBS_GEO.find((h) => h.id === selectedHubId) || RURAL_HUBS_GEO[0];

  const visibleCorridors = RURAL_CORRIDORS_GEO.filter((c) => {
    if (activeFilter === "all") return true;
    return c.mode === activeFilter;
  });

  return (
    <div className="w-full bg-white border border-neutral-200">
      {/* Map Top Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 border-b border-neutral-200 bg-neutral-50/60 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-black font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>RURAL LAST-MILE TOPOLOGY & VEHICLE DISPATCH</span>
          </div>
          <span className="text-neutral-300">|</span>
          <span className="text-neutral-500 text-[10px]">
            COMMUNITY PICKUP NODES // INFORMAL SOLAR COLD STORES // TERRAIN CONDITIONS
          </span>
        </div>

        {/* Mode Filter Toggles */}
        <div className="flex items-center gap-1 bg-white border border-neutral-200 p-0.5 rounded-full text-[10px]">
          {(["all", "local", "road"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveFilter(mode)}
              className={`px-3 py-1 rounded-full uppercase tracking-wider transition-colors cursor-pointer ${
                activeFilter === mode
                  ? "bg-black text-white font-semibold"
                  : "text-neutral-500 hover:text-black"
              }`}
            >
              {mode === "all" ? "All Corridors" : mode === "local" ? "Local Feeders" : "Road Arterials"}
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
            BAY OF BENGAL (COASTAL REACH)
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
            Mahanadi River Basin (Banki Feeder)
          </text>

          {/* Rural Agricultural Cluster Buffer Zone Highlight */}
          <path
            d="M 280 250 Q 400 230 500 370 T 380 430 T 280 380 Z"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Corridor Paths & Road Conditions */}
          {visibleCorridors.map((c) => {
            const isConnectedToSelected =
              c.from === selectedHubId || c.to === selectedHubId;

            const isFloodRisk = c.condition === "flood_risk";
            const isUnpaved = c.condition === "unpaved";
            const isSeasonal = c.condition === "seasonal";

            const strokeColor = isFloodRisk
              ? "#e11d48"
              : isSeasonal
              ? "#d97706"
              : isConnectedToSelected
              ? "#0a0a0a"
              : "#71717a";

            return (
              <g key={c.id}>
                {isConnectedToSelected && (
                  <path
                    d={c.path}
                    fill="none"
                    stroke="#f4f4f5"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                )}

                <path
                  d={c.path}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isConnectedToSelected ? 2.5 : isFloodRisk ? 2.2 : 1.5}
                  strokeDasharray={isFloodRisk ? "4 4" : isUnpaved ? "3 5" : isSeasonal ? "6 4" : "none"}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />

                {/* Flood Risk Pulsing Dot */}
                {isFloodRisk && (
                  <circle r="4" fill="#e11d48">
                    <animateMotion
                      path={c.path}
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Moving Rural Transport Vehicles */}
          {RURAL_VEHICLES_MAP.map((veh) => (
            <g key={veh.id} className="cursor-pointer">
              {/* Vehicle Halo */}
              <circle
                cx={veh.x}
                cy={veh.y}
                r="7"
                fill="#000000"
                className="opacity-90"
              />
              <circle
                cx={veh.x}
                cy={veh.y}
                r="3"
                fill={veh.temp_control ? "#10b981" : "#ffffff"}
              />
              <text
                x={veh.x + 9}
                y={veh.y + 3}
                fontFamily="JetBrains Mono, monospace"
                fontSize="8"
                fontWeight="600"
                fill="#0a0a0a"
              >
                {veh.type === "tempo" ? "🚚" : veh.type === "tractor" ? "🚜" : veh.type === "motorbike" ? "🏍️" : "🛺"} {veh.name.split(" ")[0]}
              </text>
            </g>
          ))}

          {/* Hub & Rural Nodes with Distinct Marker Geometries */}
          {RURAL_HUBS_GEO.map((hub) => {
            const isSelected = hub.id === selectedHubId;
            const isAggregation = hub.node_type === "aggregation_point";
            const isInformalSolar = hub.node_type === "informal_cold_storage";
            const isWarehouse = hub.node_type === "warehouse";
            const isCrossdock = hub.node_type === "crossdock";
            const fillRatio = hub.usedKg / hub.capacityKg;

            return (
              <g
                key={hub.id}
                onClick={() => onSelectHub?.(hub)}
                onMouseEnter={() => setHoveredHub(hub)}
                onMouseLeave={() => setHoveredHub(null)}
                className="cursor-pointer group"
              >
                {/* Selection Ring */}
                {isSelected && (
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r={isAggregation ? "18" : "22"}
                    fill="none"
                    stroke="#0a0a0a"
                    strokeWidth="1.2"
                    strokeDasharray="2 3"
                    className="animate-starburst-spin-fast"
                  />
                )}

                {/* Marker Geometry based on Node Type */}
                {isAggregation ? (
                  // Village Aggregation Point: Diamond
                  <polygon
                    points={`${hub.x},${hub.y - 8} ${hub.x + 8},${hub.y} ${hub.x},${hub.y + 8} ${hub.x - 8},${hub.y}`}
                    fill="#ffffff"
                    stroke={isSelected ? "#0a0a0a" : "#4b5563"}
                    strokeWidth={isSelected ? 2 : 1.4}
                    className="transition-all duration-200"
                  />
                ) : isInformalSolar ? (
                  // Informal Solar Cold Storage: Hexagon with Solar Tint
                  <polygon
                    points={`${hub.x - 7},${hub.y - 4} ${hub.x},${hub.y - 8} ${hub.x + 7},${hub.y - 4} ${hub.x + 7},${hub.y + 4} ${hub.x},${hub.y + 8} ${hub.x - 7},${hub.y + 4}`}
                    fill="#fef3c7"
                    stroke={isSelected ? "#0a0a0a" : "#d97706"}
                    strokeWidth={isSelected ? 2 : 1.5}
                    className="transition-all duration-200"
                  />
                ) : isWarehouse ? (
                  // Formal Warehouse: Rounded Square
                  <rect
                    x={hub.x - 8}
                    y={hub.y - 8}
                    width="16"
                    height="16"
                    rx="3"
                    fill="#ffffff"
                    stroke={isSelected ? "#0a0a0a" : "#1f2937"}
                    strokeWidth={isSelected ? 2.2 : 1.5}
                    className="transition-all duration-200"
                  />
                ) : (
                  // Crossdock: Circle
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r="8"
                    fill="#ffffff"
                    stroke={isSelected ? "#0a0a0a" : "#4b5563"}
                    strokeWidth={isSelected ? 2 : 1.4}
                    className="transition-all duration-200"
                  />
                )}

                {/* Inner Core Symbol */}
                <circle
                  cx={hub.x}
                  cy={hub.y}
                  r="3"
                  fill={
                    hub.power_reliability === "solar"
                      ? "#f59e0b"
                      : hub.power_reliability === "unreliable"
                      ? "#ef4444"
                      : "#10b981"
                  }
                  className="transition-all duration-200"
                />

                {/* Node Code Label */}
                <text
                  x={hub.x + 13}
                  y={hub.y + 3}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.5"
                  fontWeight={isSelected ? "700" : "600"}
                  fill={isSelected ? "#0a0a0a" : "#374151"}
                  className="transition-colors pointer-events-none"
                >
                  {hub.code}
                </text>

                {/* Node Subtitle (Power & Type) */}
                <text
                  x={hub.x + 13}
                  y={hub.y + 14}
                  fontFamily="Inter, sans-serif"
                  fontSize="8"
                  fill="#6b7280"
                  className="pointer-events-none"
                >
                  {isAggregation
                    ? `Pickup (${hub.power_reliability})`
                    : isInformalSolar
                    ? "Solar Cold-Store"
                    : `${Math.round(fillRatio * 100)}% Cap`}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Protocol & Map Legend */}
        <div className="absolute bottom-4 left-4 p-3.5 border border-neutral-200 bg-white/95 backdrop-blur-xs font-mono text-[10px] space-y-2 text-neutral-700 shadow-xs max-w-xs">
          <div className="text-neutral-400 uppercase text-[9px] font-bold">RURAL NETWORK LEGEND</div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rotate-45 border border-black inline-block bg-white" />
              <span>Aggregation Point</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 border border-amber-600 bg-amber-100 inline-block" />
              <span>Solar Cold Storage</span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-neutral-100 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-4 h-[1.5px] bg-black inline-block" />
              <span>Paved Feeder Route</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-[1.5px] border-b border-dashed border-neutral-500 inline-block" />
              <span>Unpaved / Seasonal Link</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-[2px] bg-rose-600 inline-block" />
              <span className="text-rose-600 font-semibold">Flood Risk Alert</span>
            </div>
          </div>
        </div>

        {/* Selected Hub Telemetry Cardlet */}
        <div className="absolute top-4 right-4 p-4 border border-neutral-200 bg-white/95 backdrop-blur-xs font-mono text-xs max-w-xs space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase tracking-wider">
            <span>{currentSelectedHub.node_type.replace("_", " ")}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-semibold">
              Power: {currentSelectedHub.power_reliability}
            </span>
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
            <span>COLD SLOTS: {currentSelectedHub.activeDocks} ACTIVE</span>
            <span className="text-black font-semibold uppercase">{currentSelectedHub.riskStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(SwissLogisticsMapComponent);

