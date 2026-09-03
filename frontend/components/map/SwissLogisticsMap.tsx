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

import { RoadSegment, RoadSegmentStatus } from "../../types";

export interface MapHub {
  id: string;
  name: string;
  code: string;
  node_type: "aggregation_point" | "informal_cold_storage" | "warehouse" | "crossdock" | "rail_freight_terminal" | "hilly_aggregation_node";
  power_reliability: "grid" | "solar" | "unreliable";
  elevation_m: number;
  terrain_type: "plains" | "hilly" | "mountainous" | "riverine";
  is_rail_terminal?: boolean;
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
  mode: "local" | "road" | "rail" | "road_plus_rail";
  condition: "paved" | "unpaved" | "seasonal" | "flood_risk";
  terrain_type?: "plains" | "hilly" | "mountainous" | "riverine";
  gradient_pct?: number;
  elevation_gain_m?: number;
  path: string;
  distanceKm: number;
  transitHours: number;
  status: "Clear" | "Flooded Alert" | "Unpaved Caution" | "Optimal" | "Rail Corridor" | "Mountain Pass";
  osm_way_id?: string;
  road_score?: number;
}

export interface MapVehicle {
  id: string;
  name: string;
  type: "mini_truck" | "tata_ace" | "pickup_4x4" | "bolero_pickup" | "tractor_trailer" | "cargo_erickshaw" | "cargo_bike" | "riverine_boat" | "tempo" | "motorbike" | "shared_auto" | "tractor" | "truck" | "heavy_truck" | "three_wheeler_cargo" | "other";
  capacityKg: number;
  usedKg: number;
  load_utilization_pct: number;
  cost_per_km: number;
  max_gradient_pct: number;
  temp_control: boolean;
  x: number;
  y: number;
  status: "available" | "en_route";
}

export interface RoadSenseMapSegment {
  id: string;
  name: string;
  osm_way_id: string;
  path: string;
  status: RoadSegmentStatus;
  score: number;
  width: string;
  surface: string;
  length_km: number;
  note?: string;
  vehicle_viability: {
    truck: boolean;
    mini_truck: boolean;
    tractor: boolean;
    two_wheeler: boolean;
  };
}

export const ROADSENSE_SEGMENTS_GEO: RoadSenseMapSegment[] = [
  {
    id: "seg-1",
    name: "Pipili–Nimapada State Highway Link (OD-SH-60)",
    osm_way_id: "way/498217301",
    path: "M 385 390 L 470 390",
    status: "clear",
    score: 95,
    width: "Two-Lane (7.0m)",
    surface: "Asphalt",
    length_km: 14.5,
    note: "Highway corridor clear, smooth asphalt, normal transit speeds.",
    vehicle_viability: { truck: true, mini_truck: true, tractor: true, two_wheeler: true },
  },
  {
    id: "seg-2",
    name: "Pipili–Delanga Rural Connecting Road",
    osm_way_id: "way/512903812",
    path: "M 385 390 L 335 365",
    status: "clear",
    score: 80,
    width: "Intermediate (4.5m)",
    surface: "Paved",
    length_km: 8.2,
    note: "Paved rural connector operational.",
    vehicle_viability: { truck: true, mini_truck: true, tractor: true, two_wheeler: true },
  },
  {
    id: "seg-3",
    name: "Nimapada–Gop Agro Corridor (OD-SH-13)",
    osm_way_id: "way/602819441",
    path: "M 470 390 L 470 450",
    status: "difficult",
    score: 62,
    width: "Intermediate (4.2m)",
    surface: "Paved / Gravel Patches",
    length_km: 12.0,
    note: "Severe potholes & waterlogged patch near km 5. Speed derated 35%.",
    vehicle_viability: { truck: false, mini_truck: true, tractor: true, two_wheeler: true },
  },
  {
    id: "seg-4",
    name: "Balipatna Canal Embankment Road",
    osm_way_id: "way/381902155",
    path: "M 385 390 Q 425 355 470 390",
    status: "difficult",
    score: 42,
    width: "Single-Lane (3.2m)",
    surface: "Unpaved Silt",
    length_km: 5.4,
    note: "Loose silt and heavy ruts along canal bund. Narrow passing points.",
    vehicle_viability: { truck: false, mini_truck: false, tractor: true, two_wheeler: true },
  },
  {
    id: "seg-5",
    name: "Kushabhadra River Causeway & Feeder Track",
    osm_way_id: "way/719283014",
    path: "M 400 405 L 435 425",
    status: "blocked",
    score: 18,
    width: "Narrow Track (2.4m)",
    surface: "Dirt",
    length_km: 3.1,
    note: "Causeway submerged under 2.5ft floodwater after flash rain — impassable for 4-wheelers.",
    vehicle_viability: { truck: false, mini_truck: false, tractor: false, two_wheeler: false },
  },
  {
    id: "seg-6",
    name: "Khordha Dairy Cluster Access Arterial",
    osm_way_id: "way/672190342",
    path: "M 310 350 L 380 320",
    status: "clear",
    score: 92,
    width: "Two-Lane (6.0m)",
    surface: "Asphalt",
    length_km: 7.2,
    note: "Express milk tanker route fully operational.",
    vehicle_viability: { truck: true, mini_truck: true, tractor: true, two_wheeler: true },
  },
  {
    id: "seg-7",
    name: "Banki Mahanadi Riverine Ghat Approach",
    osm_way_id: "way/552918029",
    path: "M 300 270 L 340 280",
    status: "difficult",
    score: 38,
    width: "Narrow Track (2.8m)",
    surface: "Unpaved Mud",
    length_km: 3.8,
    note: "Mud accumulation along riverbank approach after morning high tide.",
    vehicle_viability: { truck: false, mini_truck: false, tractor: true, two_wheeler: true },
  },
];

export const RURAL_HUBS_GEO: MapHub[] = [
  // Plains Aggregation & Warehousing Nodes
  { id: "v_a", name: "Village A (Pipili Rural Cluster)", code: "VIL-A", node_type: "aggregation_point", power_reliability: "solar", elevation_m: 45, terrain_type: "plains", is_rail_terminal: false, x: 385, y: 390, capacityKg: 25000, usedKg: 18500, tempZones: ["+4°C Horticulture", "+12°C Floriculture"], activeDocks: 4, riskStatus: "Optimal" },
  { id: "v_b", name: "Village B (Khordha Dairy Cluster)", code: "VIL-B", node_type: "aggregation_point", power_reliability: "unreliable", elevation_m: 75, terrain_type: "plains", is_rail_terminal: false, x: 310, y: 350, capacityKg: 35000, usedKg: 29000, tempZones: ["+2°C to +4°C Raw Milk", "Chilled Produce"], activeDocks: 5, riskStatus: "Optimal" },
  { id: "v_c", name: "Village C (Nimapada Agro Belt)", code: "VIL-C", node_type: "informal_cold_storage", power_reliability: "solar", elevation_m: 32, terrain_type: "plains", is_rail_terminal: false, x: 470, y: 390, capacityKg: 30000, usedKg: 22000, tempZones: ["+4°C Dairy Sweets", "+8°C Vegetables"], activeDocks: 4, riskStatus: "Optimal" },
  { id: "v_d", name: "Village D (Banki Riverine Farms)", code: "VIL-D", node_type: "aggregation_point", power_reliability: "unreliable", elevation_m: 28, terrain_type: "riverine", is_rail_terminal: false, x: 300, y: 270, capacityKg: 20000, usedKg: 14000, tempZones: ["+2°C Fresh Fish", "+10°C Organic Greens"], activeDocks: 3, riskStatus: "Moderate" },
  { id: "bbs", name: "Bhubaneswar Central Cold Hub", code: "BBS-HUB", node_type: "warehouse", power_reliability: "grid", elevation_m: 45, terrain_type: "plains", is_rail_terminal: false, x: 380, y: 320, capacityKg: 120000, usedKg: 92000, tempZones: ["-25°C Frozen", "+4°C Chilled", "+2°C Pharma"], activeDocks: 18, riskStatus: "Optimal" },
  { id: "ctc", name: "Cuttack Crossdock Terminal", code: "CTC-XDK", node_type: "crossdock", power_reliability: "grid", elevation_m: 36, terrain_type: "plains", is_rail_terminal: false, x: 395, y: 260, capacityKg: 85000, usedKg: 64000, tempZones: ["+4°C Chilled Dairy", "-18°C Frozen"], activeDocks: 12, riskStatus: "Optimal" },
  { id: "puri", name: "Puri Coastal Depot", code: "PURI-DEPOT", node_type: "aggregation_point", power_reliability: "grid", elevation_m: 12, terrain_type: "plains", is_rail_terminal: false, x: 390, y: 460, capacityKg: 45000, usedKg: 28000, tempZones: ["-18°C Seafood", "+4°C Dairy"], activeDocks: 6, riskStatus: "Optimal" },
  { id: "pdp", name: "Paradeep Port Deepwater Terminal", code: "PDP-PORT", node_type: "warehouse", power_reliability: "grid", elevation_m: 5, terrain_type: "plains", is_rail_terminal: false, x: 560, y: 310, capacityKg: 190000, usedKg: 162000, tempZones: ["-25°C Marine Export", "+4°C Chilled"], activeDocks: 24, riskStatus: "Moderate" },

  // Hilly & Mountain Nodes (NASA SRTM 30m DEM Benchmarks)
  { id: "daringbadi", name: "Daringbadi Highlands (Kandhamal)", code: "DBG-HILL", node_type: "hilly_aggregation_node", power_reliability: "solar", elevation_m: 980, terrain_type: "mountainous", is_rail_terminal: false, x: 170, y: 430, capacityKg: 18000, usedKg: 12500, tempZones: ["+4°C Organic Spices", "+10°C Coffee"], activeDocks: 2, riskStatus: "Moderate" },
  { id: "koraput", name: "Koraput Tribal Agro Plateau", code: "KPT-HILL", node_type: "hilly_aggregation_node", power_reliability: "solar", elevation_m: 870, terrain_type: "mountainous", is_rail_terminal: false, x: 100, y: 520, capacityKg: 28000, usedKg: 21000, tempZones: ["+4°C Arabica Coffee", "+12°C Ginger"], activeDocks: 3, riskStatus: "Optimal" },

  // Indian Railways Freight Terminals (FOIS Goods Yards & Sidings)
  { id: "kur_rly", name: "Khurda Road Jn Rail Freight Terminal", code: "KUR-RLY", node_type: "rail_freight_terminal", power_reliability: "grid", elevation_m: 68, terrain_type: "plains", is_rail_terminal: true, x: 335, y: 365, capacityKg: 150000, usedKg: 110000, tempZones: ["Rail Reefer Flatcars", "Dry Bulk Shed"], activeDocks: 16, riskStatus: "Optimal" },
  { id: "ctc_rly", name: "Cuttack Goods Yard Rail Siding", code: "CTC-RLY", node_type: "rail_freight_terminal", power_reliability: "grid", elevation_m: 35, terrain_type: "plains", is_rail_terminal: true, x: 420, y: 240, capacityKg: 140000, usedKg: 95000, tempZones: ["Intermodal Container Siding", "Cold Storage Rake"], activeDocks: 14, riskStatus: "Optimal" },
  { id: "pdp_rly", name: "Paradeep Port Rail Siding", code: "PDP-RLY", node_type: "rail_freight_terminal", power_reliability: "grid", elevation_m: 6, terrain_type: "plains", is_rail_terminal: true, x: 580, y: 290, capacityKg: 250000, usedKg: 195000, tempZones: ["Marine Bulk Rakes", "Reefer Yard"], activeDocks: 20, riskStatus: "Optimal" },
  { id: "rgda_rly", name: "Rayagada Rail Terminal & Goods Yard", code: "RGDA-RLY", node_type: "rail_freight_terminal", power_reliability: "grid", elevation_m: 210, terrain_type: "hilly", is_rail_terminal: true, x: 130, y: 470, capacityKg: 110000, usedKg: 78000, tempZones: ["Eastern Ghats Rail Transit", "Bulk Agro Siding"], activeDocks: 8, riskStatus: "Optimal" },
];

export const RURAL_CORRIDORS_GEO: MapCorridor[] = [
  // Plains Feeder & Arterial Corridors
  { id: "c_va_bbs", from: "v_a", to: "bbs", mode: "local", condition: "paved", terrain_type: "plains", gradient_pct: 0.8, elevation_gain_m: 0, path: "M 385 390 L 380 320", distanceKm: 20, transitHours: 0.6, status: "Clear" },
  { id: "c_vb_bbs", from: "v_b", to: "bbs", mode: "local", condition: "paved", terrain_type: "plains", gradient_pct: 1.2, elevation_gain_m: 30, path: "M 310 350 L 380 320", distanceKm: 25, transitHours: 0.7, status: "Clear" },
  { id: "c_vc_bbs", from: "v_c", to: "bbs", mode: "local", condition: "unpaved", terrain_type: "plains", gradient_pct: 0.6, elevation_gain_m: 13, path: "M 470 390 L 380 320", distanceKm: 38, transitHours: 1.2, status: "Unpaved Caution" },
  { id: "c_vd_ctc", from: "v_d", to: "ctc", mode: "local", condition: "flood_risk", terrain_type: "riverine", gradient_pct: 0.5, elevation_gain_m: 8, path: "M 300 270 L 395 260", distanceKm: 42, transitHours: 1.8, status: "Flooded Alert" },
  { id: "c_va_puri", from: "v_a", to: "puri", mode: "local", condition: "paved", terrain_type: "plains", gradient_pct: 0.8, elevation_gain_m: 33, path: "M 385 390 L 390 460", distanceKm: 40, transitHours: 0.9, status: "Clear" },
  { id: "c_bbs_ctc", from: "bbs", to: "ctc", mode: "road", condition: "paved", terrain_type: "plains", gradient_pct: 0.5, elevation_gain_m: 9, path: "M 380 320 L 395 260", distanceKm: 28, transitHours: 0.6, status: "Clear" },
  { id: "c_ctc_pdp", from: "ctc", to: "pdp", mode: "road", condition: "paved", terrain_type: "plains", gradient_pct: 0.4, elevation_gain_m: 31, path: "M 395 260 L 560 310", distanceKm: 85, transitHours: 2.0, status: "Clear" },
  { id: "c_bbs_pdp", from: "bbs", to: "pdp", mode: "road", condition: "seasonal", terrain_type: "plains", gradient_pct: 0.4, elevation_gain_m: 40, path: "M 380 320 Q 470 300 560 310", distanceKm: 105, transitHours: 2.6, status: "Clear" },

  // Hilly & Mountain Ascent Corridors
  { id: "c_dbg_rgda", from: "daringbadi", to: "rgda_rly", mode: "local", condition: "unpaved", terrain_type: "mountainous", gradient_pct: 6.8, elevation_gain_m: 770, path: "M 170 430 L 130 470", distanceKm: 65, transitHours: 2.8, status: "Mountain Pass" },
  { id: "c_kpt_rgda", from: "koraput", to: "rgda_rly", mode: "road", condition: "paved", terrain_type: "mountainous", gradient_pct: 5.4, elevation_gain_m: 660, path: "M 100 520 L 130 470", distanceKm: 78, transitHours: 3.2, status: "Mountain Pass" },
  { id: "c_vb_dbg", from: "v_b", to: "daringbadi", mode: "road", condition: "seasonal", terrain_type: "hilly", gradient_pct: 4.8, elevation_gain_m: 905, path: "M 310 350 Q 240 380 170 430", distanceKm: 130, transitHours: 4.5, status: "Mountain Pass" },

  // Indian Railways Freight Corridors (Dedicated Multi-Leg Heavy Rail)
  { id: "rly_kur_ctc", from: "kur_rly", to: "ctc_rly", mode: "rail", condition: "paved", terrain_type: "plains", gradient_pct: 0.3, elevation_gain_m: 33, path: "M 335 365 Q 370 300 420 240", distanceKm: 48, transitHours: 0.7, status: "Rail Corridor" },
  { id: "rly_ctc_pdp", from: "ctc_rly", to: "pdp_rly", mode: "rail", condition: "paved", terrain_type: "plains", gradient_pct: 0.2, elevation_gain_m: 29, path: "M 420 240 Q 500 250 580 290", distanceKm: 82, transitHours: 1.2, status: "Rail Corridor" },
  { id: "rly_rgda_kur", from: "rgda_rly", to: "kur_rly", mode: "rail", condition: "paved", terrain_type: "hilly", gradient_pct: 1.1, elevation_gain_m: 142, path: "M 130 470 Q 230 420 335 365", distanceKm: 280, transitHours: 4.2, status: "Rail Corridor" },
];

export const RURAL_VEHICLES_MAP: MapVehicle[] = [
  { id: "veh-1", name: "Heavy Truck (HCV)", type: "truck", capacityKg: 16000, usedKg: 12500, load_utilization_pct: 78.1, cost_per_km: 28.0, max_gradient_pct: 8.0, temp_control: true, x: 420, y: 260, status: "en_route" },
  { id: "veh-2", name: "Mini-truck/LCV (Tata Ace, Dost)", type: "mini_truck", capacityKg: 1200, usedKg: 940, load_utilization_pct: 78.3, cost_per_km: 10.0, max_gradient_pct: 18.0, temp_control: true, x: 382, y: 355, status: "en_route" },
  { id: "veh-3", name: "4x4 Pickup (Bolero Camper, Scorpio)", type: "pickup_4x4", capacityKg: 1500, usedKg: 1180, load_utilization_pct: 78.7, cost_per_km: 14.5, max_gradient_pct: 32.0, temp_control: true, x: 150, y: 450, status: "en_route" },
  { id: "veh-4", name: "Three-wheeler Cargo (Ape, Alfa)", type: "three_wheeler_cargo", capacityKg: 500, usedKg: 390, load_utilization_pct: 78.0, cost_per_km: 7.5, max_gradient_pct: 12.0, temp_control: false, x: 345, y: 335, status: "en_route" },
  { id: "veh-5", name: "E-rickshaw Cargo", type: "cargo_erickshaw", capacityKg: 400, usedKg: 320, load_utilization_pct: 80.0, cost_per_km: 4.5, max_gradient_pct: 6.0, temp_control: false, x: 375, y: 405, status: "en_route" },
  { id: "veh-6", name: "Motorcycle with Cargo Box", type: "motorbike", capacityKg: 80, usedKg: 60, load_utilization_pct: 75.0, cost_per_km: 3.5, max_gradient_pct: 22.0, temp_control: true, x: 330, y: 265, status: "en_route" },
  { id: "veh-7", name: "Tractor-Trolley", type: "tractor_trailer", capacityKg: 4000, usedKg: 3200, load_utilization_pct: 80.0, cost_per_km: 18.0, max_gradient_pct: 15.0, temp_control: false, x: 490, y: 360, status: "en_route" },
  { id: "veh-8", name: "Cycle/E-cycle Cargo", type: "cargo_bike", capacityKg: 60, usedKg: 48, load_utilization_pct: 80.0, cost_per_km: 1.5, max_gradient_pct: 12.0, temp_control: true, x: 185, y: 420, status: "en_route" },
];

interface SwissLogisticsMapProps {
  selectedHubId?: string;
  onSelectHub?: (hub: MapHub) => void;
  roadSegments?: RoadSenseMapSegment[];
  onSelectSegment?: (segment: RoadSenseMapSegment) => void;
}

function SwissLogisticsMapComponent({
  selectedHubId = "v_a",
  onSelectHub,
  roadSegments = [],
  onSelectSegment,
}: SwissLogisticsMapProps) {
  const t = useTranslations("home.network");
  const tc = useTranslations("common");
  const tm = useTranslations("map");

  const [activeFilter, setActiveFilter] = useState<"all" | "roadsense" | "local" | "road" | "rail" | "hilly">("roadsense");
  const [hoveredHub, setHoveredHub] = useState<MapHub | null>(null);
  const [selectedRoadSenseSeg, setSelectedRoadSenseSeg] = useState<RoadSenseMapSegment | null>(ROADSENSE_SEGMENTS_GEO[4]);

  const currentSelectedHub =
    RURAL_HUBS_GEO.find((h) => h.id === selectedHubId) || RURAL_HUBS_GEO[0];

  const visibleCorridors = RURAL_CORRIDORS_GEO.filter((c) => {
    if (activeFilter === "all" || activeFilter === "roadsense") return true;
    if (activeFilter === "rail") return c.mode === "rail";
    if (activeFilter === "hilly") return c.terrain_type === "hilly" || c.terrain_type === "mountainous";
    return c.mode === activeFilter;
  });

  return (
    <div className="w-full bg-white dark:bg-[#121215] border border-neutral-200 dark:border-neutral-800 transition-colors duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-[#0c0c0e] font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-black dark:text-white font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>{tm("title")}</span>
          </div>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <span className="text-neutral-500 dark:text-neutral-400 text-[10px]">
            {tm("subtitle")}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-700 p-0.5 rounded-full text-[10px]">
          {(["roadsense", "all", "local", "road", "rail", "hilly"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveFilter(mode)}
              className={`px-3 py-1 rounded-full uppercase tracking-wider transition-colors cursor-pointer ${
                activeFilter === mode
                  ? "bg-black text-white dark:bg-white dark:text-black font-semibold"
                  : "text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              {mode === "roadsense"
                ? tm("filterRoadSense")
                : mode === "all"
                ? tm("filterAll")
                : mode === "local"
                ? tm("filterLocal")
                : mode === "road"
                ? tm("filterRoad")
                : mode === "rail"
                ? tm("filterRail")
                : tm("filterHilly")}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full overflow-hidden bg-white dark:bg-[#09090b] swiss-grid-pattern py-8 px-4 flex items-center justify-center min-h-[580px] transition-colors duration-200">
        <svg
          viewBox="0 0 740 640"
          className="w-full max-w-[740px] h-auto overflow-visible select-none"
        >
          <g className="text-neutral-200 dark:text-neutral-800 stroke-current" strokeWidth="0.5" strokeDasharray="3 6">
            <line x1="80" y1="120" x2="680" y2="120" />
            <line x1="80" y1="260" x2="680" y2="260" />
            <line x1="80" y1="390" x2="680" y2="390" />
            <line x1="80" y1="520" x2="680" y2="520" />
            <line x1="180" y1="40" x2="180" y2="600" />
            <line x1="380" y1="40" x2="380" y2="600" />
            <line x1="560" y1="40" x2="560" y2="600" />
          </g>

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
            {tm("bayOfBengal")}
          </text>

          <path
            d="M 60 380 Q 140 340 180 430 T 120 560"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="3"
            strokeDasharray="8 4"
          />
          <text
            x="70"
            y="480"
            fontFamily="JetBrains Mono, monospace"
            fontSize="8.5"
            fill="#94a3b8"
            letterSpacing="0.15em"
            transform="rotate(-55 70 480)"
          >
            {tm("easternGhats")}
          </text>

          <path
            d="M 120 260 Q 220 280 300 270 T 395 260 T 560 310"
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 120 260 Q 220 280 300 270 T 395 260 T 560 310"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <text
            x="200"
            y="235"
            fontFamily="JetBrains Mono, monospace"
            fontSize="8"
            fill="#a1a1aa"
          >
            {tm("mahanadiBasin")}
          </text>

          {activeFilter !== "roadsense" && visibleCorridors.map((c) => {
            const isConnectedToSelected =
              c.from === selectedHubId || c.to === selectedHubId;

            const isRail = c.mode === "rail";
            const isMountainPass = c.terrain_type === "mountainous" || c.terrain_type === "hilly";
            const isFloodRisk = c.condition === "flood_risk";
            const isUnpaved = c.condition === "unpaved";
            const isSeasonal = c.condition === "seasonal";

            const strokeColor = isRail
              ? "#4338ca"
              : isFloodRisk
              ? "#e11d48"
              : isMountainPass
              ? "#b45309"
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
                  strokeWidth={isRail ? 3.0 : isConnectedToSelected ? 2.5 : isFloodRisk ? 2.2 : 1.5}
                  strokeDasharray={isRail ? "5 3" : isFloodRisk ? "4 4" : isUnpaved ? "3 5" : isSeasonal ? "6 4" : "none"}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />

                {isRail && (
                  <path
                    d={c.path}
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="1.5"
                    strokeDasharray="2 6"
                  />
                )}

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

          {(activeFilter === "roadsense" || activeFilter === "all") && (
            <g className="roadsense-layer">
              {ROADSENSE_SEGMENTS_GEO.map((seg) => {
                const isSelected = selectedRoadSenseSeg?.id === seg.id;
                const strokeColor =
                  seg.status === "clear"
                    ? "#10b981"
                    : seg.status === "difficult"
                    ? "#f59e0b"
                    : "#ef4444";

                return (
                  <g
                    key={seg.id}
                    onClick={() => {
                      setSelectedRoadSenseSeg(seg);
                      if (onSelectSegment) onSelectSegment(seg);
                    }}
                    className="cursor-pointer group"
                  >
                    <path
                      d={seg.path}
                      fill="none"
                      stroke={isSelected ? strokeColor : "transparent"}
                      strokeWidth={isSelected ? 10 : 8}
                      strokeOpacity={isSelected ? 0.35 : 0.1}
                      strokeLinecap="round"
                      className="group-hover:stroke-neutral-300 transition-all"
                    />

                    <path
                      d={seg.path}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 4.0 : 3.0}
                      strokeDasharray={seg.status === "blocked" ? "6 3" : seg.status === "difficult" ? "4 2" : "none"}
                      strokeLinecap="round"
                      className="transition-all duration-200"
                    />

                    {seg.status === "blocked" && (
                      <circle cx="417" cy="415" r="5" fill="#ef4444" className="animate-ping" opacity="0.75" />
                    )}
                    {seg.status === "blocked" && (
                      <circle cx="417" cy="415" r="3.5" fill="#ef4444" />
                    )}

                    {seg.status === "difficult" && seg.id === "seg-3" && (
                      <circle cx="470" cy="420" r="3" fill="#f59e0b" />
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {RURAL_VEHICLES_MAP.map((veh) => (
            <g key={veh.id} className="transition-transform duration-700">
              <circle
                cx={veh.x}
                cy={veh.y}
                r="4.5"
                fill="#000000"
                stroke="#ffffff"
                strokeWidth="1.5"
                className="drop-shadow-xs"
              />
              <text
                x={veh.x + 7}
                y={veh.y + 3}
                fontFamily="JetBrains Mono, monospace"
                fontSize="7.5"
                fontWeight="bold"
                fill="#000000"
                className="bg-white/80"
              >
                {veh.name.split(" ")[0]} ({veh.load_utilization_pct}%)
              </text>
            </g>
          ))}

          {RURAL_HUBS_GEO.map((hub) => {
            const isSelected = hub.id === selectedHubId;
            const isHovered = hoveredHub?.id === hub.id;
            const isRailTerminal = hub.is_rail_terminal;
            const isMountainNode = hub.node_type === "hilly_aggregation_node";
            const isAggregation = hub.node_type === "aggregation_point";
            const isInformalSolar = hub.node_type === "informal_cold_storage";

            return (
              <g
                key={hub.id}
                className="cursor-pointer group"
                onClick={() => onSelectHub && onSelectHub(hub)}
                onMouseEnter={() => setHoveredHub(hub)}
                onMouseLeave={() => setHoveredHub(null)}
              >
                {isSelected && (
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r="16"
                    fill="none"
                    stroke="#0a0a0a"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                    className="animate-spin-slow"
                  />
                )}

                {isHovered && !isSelected && (
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r="12"
                    fill="#f4f4f5"
                    stroke="#71717a"
                    strokeWidth="0.8"
                  />
                )}

                {isRailTerminal ? (
                  <rect
                    x={hub.x - 6}
                    y={hub.y - 6}
                    width="12"
                    height="12"
                    fill={isSelected ? "#312e81" : "#4338ca"}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="transition-all duration-200"
                  />
                ) : isMountainNode ? (
                  <polygon
                    points={`${hub.x},${hub.y - 8} ${hub.x - 7},${hub.y + 6} ${hub.x + 7},${hub.y + 6}`}
                    fill={isSelected ? "#78350f" : "#b45309"}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="transition-all duration-200"
                  />
                ) : isAggregation ? (
                  <rect
                    x={hub.x - 5}
                    y={hub.y - 5}
                    width="10"
                    height="10"
                    transform={`rotate(45 ${hub.x} ${hub.y})`}
                    fill={isSelected ? "#000000" : "#ffffff"}
                    stroke="#000000"
                    strokeWidth={isSelected ? 2 : 1.5}
                    className="transition-all duration-200"
                  />
                ) : (
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r={isSelected ? 7 : 5.5}
                    fill="#ffffff"
                    stroke={isSelected ? "#0a0a0a" : "#27272a"}
                    strokeWidth={isSelected ? 2 : 1.4}
                    className="transition-all duration-200"
                  />
                )}

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

                <text
                  x={hub.x + 13}
                  y={hub.y + 14}
                  fontFamily="Inter, sans-serif"
                  fontSize="8"
                  fill="#6b7280"
                  className="pointer-events-none"
                >
                  {hub.node_type.replace(/_/g, " ")}
                </text>
              </g>
            );
          })}
        </svg>

        {selectedRoadSenseSeg ? (
          <div className="absolute top-4 right-4 p-4 border border-black dark:border-neutral-700 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xs font-mono text-xs max-w-sm space-y-3 shadow-md animate-fade-up transition-colors duration-200">
            <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              <span>{tm("segmentIntelligence")}</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-white ${
                selectedRoadSenseSeg.status === "clear" ? "bg-emerald-600" : selectedRoadSenseSeg.status === "difficult" ? "bg-amber-600" : "bg-rose-600"
              }`}>
                {selectedRoadSenseSeg.status === "clear" ? `🟢 ${tc("status.clear")}` : selectedRoadSenseSeg.status === "difficult" ? `🟡 ${tc("status.difficult")}` : `🔴 ${tc("status.blocked")}`}
              </span>
            </div>

            <div>
              <div className="font-semibold text-black dark:text-white text-sm">{selectedRoadSenseSeg.name}</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">OSM: {selectedRoadSenseSeg.osm_way_id}</div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] bg-neutral-50 dark:bg-neutral-900 p-2.5 border border-neutral-200 dark:border-neutral-800">
              <div>
                <span className="text-neutral-400 dark:text-neutral-500 block">{tm("score")}</span>
                <span className={`font-bold text-sm ${
                  selectedRoadSenseSeg.score >= 70 ? "text-emerald-700 dark:text-emerald-400" : selectedRoadSenseSeg.score >= 40 ? "text-amber-700 dark:text-amber-400" : "text-rose-700 dark:text-rose-400"
                }`}>
                  {selectedRoadSenseSeg.score}/100
                </span>
              </div>
              <div>
                <span className="text-neutral-400 dark:text-neutral-500 block">{tm("surface")}</span>
                <span className="font-semibold text-black dark:text-white">{selectedRoadSenseSeg.surface}</span>
              </div>
              <div>
                <span className="text-neutral-400 dark:text-neutral-500 block">{tm("width")}</span>
                <span className="font-semibold text-black dark:text-white">{selectedRoadSenseSeg.width}</span>
              </div>
            </div>

            {selectedRoadSenseSeg.note && (
              <div className="p-2 bg-neutral-100/70 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-[11px] font-sans text-neutral-700 dark:text-neutral-300 leading-snug">
                <span className="font-mono text-[9px] text-neutral-500 dark:text-neutral-400 block uppercase font-bold mb-0.5">{tm("latestDriverObs")}</span>
                {selectedRoadSenseSeg.note}
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              <div className="font-mono text-[9px] text-neutral-400 dark:text-neutral-500 uppercase font-bold">{tm("vehicleViabilityRec")}</div>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                <div className={`p-1.5 border rounded flex items-center justify-between ${
                  selectedRoadSenseSeg.vehicle_viability.truck ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300 opacity-80"
                }`}>
                  <span>🚛 16T Truck</span>
                  <span className="font-bold">{selectedRoadSenseSeg.vehicle_viability.truck ? `${tc("status.viable")} ✅` : `${tc("status.no")} ❌`}</span>
                </div>
                <div className={`p-1.5 border rounded flex items-center justify-between ${
                  selectedRoadSenseSeg.vehicle_viability.mini_truck ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300 opacity-80"
                }`}>
                  <span>🚐 Mini-Truck</span>
                  <span className="font-bold">{selectedRoadSenseSeg.vehicle_viability.mini_truck ? `${tc("status.viable")} ✅` : `${tc("status.no")} ❌`}</span>
                </div>
                <div className={`p-1.5 border rounded flex items-center justify-between ${
                  selectedRoadSenseSeg.vehicle_viability.tractor ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300 opacity-80"
                }`}>
                  <span>🚜 Tractor</span>
                  <span className="font-bold">{selectedRoadSenseSeg.vehicle_viability.tractor ? `${tc("status.viable")} ✅` : `${tc("status.no")} ❌`}</span>
                </div>
                <div className={`p-1.5 border rounded flex items-center justify-between ${
                  selectedRoadSenseSeg.vehicle_viability.two_wheeler ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300 opacity-80"
                }`}>
                  <span>🛵 2-Wheeler</span>
                  <span className="font-bold">{selectedRoadSenseSeg.vehicle_viability.two_wheeler ? `${tc("status.viable")} ✅` : `${tc("status.no")} ❌`}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute top-4 right-4 p-4 border border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xs font-mono text-xs max-w-xs space-y-2 shadow-xs transition-colors duration-200">
            <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              <span>{currentSelectedHub.node_type.replace(/_/g, " ")}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
                {tm("power")} {currentSelectedHub.power_reliability}
              </span>
            </div>
            <div className="font-semibold text-black dark:text-white text-sm">{currentSelectedHub.name}</div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                🏔️ {currentSelectedHub.elevation_m}m ASL
              </span>
              <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold uppercase border border-neutral-200 dark:border-neutral-700">
                {currentSelectedHub.terrain_type}
              </span>
            </div>
            <div className="text-[11px] text-neutral-600 dark:text-neutral-400">
              {tm("capacity")} {(currentSelectedHub.usedKg / 1000).toFixed(1)}T / {(currentSelectedHub.capacityKg / 1000).toFixed(1)}T
            </div>
            <div className="linear-meter">
              <div
                className="linear-meter-fill"
                style={{
                  width: `${Math.round((currentSelectedHub.usedKg / currentSelectedHub.capacityKg) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 p-3.5 border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#121215]/95 backdrop-blur-xs font-mono text-[10px] space-y-2 text-neutral-700 dark:text-neutral-300 shadow-xs max-w-sm transition-colors duration-200">
          <div className="text-neutral-400 dark:text-neutral-500 uppercase text-[9px] font-bold">{tm("legendTitle")}</div>
          
          <div className="grid grid-cols-3 gap-2 pt-0.5 font-bold">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" />
              <span>{tm("clearLegend")}</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs" />
              <span>{tm("difficultLegend")}</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs" />
              <span>{tm("blockedLegend")}</span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-neutral-100 dark:border-neutral-800 space-y-1 text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="w-4 h-[1.5px] bg-black dark:bg-white inline-block" />
              <span>{tm("pavedFeederLegend")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-[2px] bg-indigo-600 border-b border-dashed border-white inline-block" />
              <span>{tm("railSidingLegend")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-[1.5px] border-b border-dashed border-amber-700 dark:border-amber-400 inline-block" />
              <span>{tm("mountainPassLegend")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const SwissLogisticsMap = memo(SwissLogisticsMapComponent);
export default memo(SwissLogisticsMapComponent);
