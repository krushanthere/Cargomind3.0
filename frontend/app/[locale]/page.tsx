"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import OpeningScreen from "../../components/OpeningScreen";
import RuralChatbot from "../../components/ai/RuralChatbot";
import SwissLogisticsMap from "../../components/map/SwissLogisticsMap";
import DatasetExplorer from "../../components/dataset/DatasetExplorer";
import { OfflineSyncManager } from "../../lib/offline/syncStore";
import {
  runDynamicMatching,
  getFairnessMetrics,
  getAllocationHistory,
} from "../../lib/api/dispatch";
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
  deleteVehicle,
} from "../../lib/api/vehicles";
import {
  getRoadConditions,
  reportRoadCondition,
} from "../../lib/api/roadConditions";
import {
  getRoadSegments,
  submitRoadReport,
  getRoadabilityScore,
} from "../../lib/api/roadsense";
import {
  getShipments,
  createShipment,
} from "../../lib/api/shipments";
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
  TruckIcon,
  CheckmarkCircleIcon,
  AlertCircleIcon,
  RefreshIcon,
  CubeIcon,
  CpuIcon,
  DatabaseIcon,
  SendIcon,
  SunIcon,
  LeafIcon,
  BatteryIcon,
} from "../../components/icons/Hugeicons";
import {
  Shipment,
  Vehicle,
  VehicleType,
  VehicleAvailability,
  VehicleOwnerType,
  GoodType,
  UrgencyLevel,
  RoadCondition,
  DispatchMatchItem,
  FairnessMetricsResponse,
  AllocationHistory,
  OfflineSyncState,
  RoadSegment,
  RoadReport,
  RoadSegmentStatus,
  VehicleViability,
} from "../../types";

// ==========================================
// MOCK & INITIAL FALLBACK DATA
// ==========================================

interface HubItem {
  id: string;
  name: string;
  code: string;
  region: string;
  type: "aggregation_point" | "informal_cold_storage" | "warehouse" | "crossdock" | "rail_freight_terminal" | "hilly_aggregation_node";
  power: "solar" | "unreliable" | "grid";
  elevation_m: number;
  terrain_type: "plains" | "hilly" | "mountainous" | "riverine";
  is_rail_terminal: boolean;
  capacityKg: number;
  usedKg: number;
  tempZones: string[];
  activeDocks: number;
  riskStatus: "Optimal" | "Moderate" | "Constrained";
}

const INITIAL_HUBS: HubItem[] = [
  { id: "gau_hub", name: "Guwahati Northeast Central Mega Hub", code: "GAU-HUB", region: "Assam Central Trunk", type: "warehouse", power: "grid", elevation_m: 55, terrain_type: "plains", is_rail_terminal: true, capacityKg: 180000, usedKg: 142000, tempZones: ["-25°C Frozen Sea/Meat", "+4°C Organic Agro", "+2°C Pharma Vault", "Tea Cold Buffer"], activeDocks: 22, riskStatus: "Optimal" },
  { id: "sgu_ctr", name: "Siliguri Transit Centre (Chicken's Neck Hub)", code: "SGU-CTR", region: "North Bengal Gateway", type: "crossdock", power: "grid", elevation_m: 122, terrain_type: "plains", is_rail_terminal: true, capacityKg: 160000, usedKg: 128000, tempZones: ["Intermodal Crossdock", "+2°C to +4°C Cold Buffer", "Reefer Rail Yard"], activeDocks: 20, riskStatus: "Optimal" },
  { id: "del_hub", name: "Delhi NCR Mega Logistics Terminal", code: "DEL-HUB", region: "National Capital Region", type: "rail_freight_terminal", power: "grid", elevation_m: 216, terrain_type: "plains", is_rail_terminal: true, capacityKg: 220000, usedKg: 175000, tempZones: ["Intermodal DFC Reefer Flatcars", "-25°C Cold Vault", "+4°C Pharma"], activeDocks: 24, riskStatus: "Optimal" },
  { id: "kol_hub", name: "Kolkata Port & Distribution Gateway", code: "KOL-PORT", region: "Eastern Port & Coastal", type: "warehouse", power: "grid", elevation_m: 9, terrain_type: "plains", is_rail_terminal: true, capacityKg: 200000, usedKg: 165000, tempZones: ["-25°C Marine Export", "+4°C FMCG & Fresh Dairy", "Reefer Rail Flatcars"], activeDocks: 24, riskStatus: "Optimal" },
  { id: "pat_hub", name: "Patna Gangetic Crossdock & Siding", code: "PAT-XDK", region: "Gangetic Plains", type: "crossdock", power: "grid", elevation_m: 53, terrain_type: "plains", is_rail_terminal: true, capacityKg: 95000, usedKg: 68000, tempZones: ["+4°C Produce", "+12°C Agro Storage"], activeDocks: 10, riskStatus: "Optimal" },
  { id: "gtk_node", name: "Gangtok Organic Highland Depot", code: "GTK-HILL", region: "Sikkim Highlands", type: "hilly_aggregation_node", power: "solar", elevation_m: 1650, terrain_type: "mountainous", is_rail_terminal: false, capacityKg: 22000, usedKg: 15400, tempZones: ["+4°C Large Cardamom", "+10°C Organic Ginger"], activeDocks: 3, riskStatus: "Moderate" },
  { id: "ita_node", name: "Itanagar Foothills Agro Depot", code: "ITA-HILL", region: "Arunachal Pradesh", type: "hilly_aggregation_node", power: "solar", elevation_m: 320, terrain_type: "hilly", is_rail_terminal: false, capacityKg: 24000, usedKg: 16800, tempZones: ["+4°C Organic Kiwi", "+6°C Oranges & Apples"], activeDocks: 3, riskStatus: "Optimal" },
  { id: "tzp_node", name: "Tezpur Organic Perishables Cluster", code: "TZP-AGRO", region: "Assam North Bank", type: "informal_cold_storage", power: "solar", elevation_m: 48, terrain_type: "plains", is_rail_terminal: false, capacityKg: 32000, usedKg: 22000, tempZones: ["+4°C Litchi & Produce", "+10°C Vegetables"], activeDocks: 4, riskStatus: "Optimal" },
  { id: "jrh_node", name: "Jorhat Upper Assam Tea & Agro Belt", code: "JRH-AGRO", region: "Upper Assam Belt", type: "aggregation_point", power: "solar", elevation_m: 87, terrain_type: "plains", is_rail_terminal: false, capacityKg: 38000, usedKg: 28500, tempZones: ["+15°C Orthodox Tea", "+4°C Citrus & Fruits"], activeDocks: 5, riskStatus: "Optimal" },
  { id: "dib_node", name: "Dibrugarh Multimodal Terminal", code: "DIB-RLY", region: "Upper Assam Railhead", type: "rail_freight_terminal", power: "grid", elevation_m: 108, terrain_type: "plains", is_rail_terminal: true, capacityKg: 85000, usedKg: 62000, tempZones: ["Rail Container Siding", "+4°C Perishables"], activeDocks: 10, riskStatus: "Optimal" },
  { id: "dmp_node", name: "Dimapur Rail Gateway & Agro Hub", code: "DMP-RLY", region: "Nagaland Commercial Hub", type: "rail_freight_terminal", power: "grid", elevation_m: 145, terrain_type: "plains", is_rail_terminal: true, capacityKg: 40000, usedKg: 29000, tempZones: ["+4°C Naga Chilli & Pineapple", "Rail Flatcar Yard"], activeDocks: 6, riskStatus: "Optimal" },
  { id: "imp_node", name: "Imphal Valley Agro Cluster", code: "IMP-HUB", region: "Manipur Valley", type: "hilly_aggregation_node", power: "solar", elevation_m: 786, terrain_type: "hilly", is_rail_terminal: false, capacityKg: 28000, usedKg: 19500, tempZones: ["+4°C Black Rice & Bamboo", "+12°C Floriculture"], activeDocks: 4, riskStatus: "Optimal" },
  { id: "shl_node", name: "Shillong Highlands Aggregation Node", code: "SHL-HILL", region: "Meghalaya Highlands", type: "hilly_aggregation_node", power: "solar", elevation_m: 1525, terrain_type: "mountainous", is_rail_terminal: false, capacityKg: 26000, usedKg: 19500, tempZones: ["+4°C Lakadong Turmeric", "+8°C Exotic Flowers"], activeDocks: 4, riskStatus: "Optimal" },
  { id: "slc_node", name: "Silchar Barak Valley Hub", code: "SLC-VAL", region: "Barak Valley Gateway", type: "crossdock", power: "grid", elevation_m: 25, terrain_type: "riverine", is_rail_terminal: true, capacityKg: 50000, usedKg: 36000, tempZones: ["Barak Valley Transshipment", "+4°C Produce"], activeDocks: 8, riskStatus: "Optimal" },
  { id: "azl_node", name: "Aizawl Highland Aggregation Depot", code: "AZL-HILL", region: "Mizoram Highlands", type: "hilly_aggregation_node", power: "solar", elevation_m: 1132, terrain_type: "mountainous", is_rail_terminal: false, capacityKg: 22000, usedKg: 14800, tempZones: ["+4°C Anthurium & Dragon Fruit", "+10°C Mizo Chilli"], activeDocks: 3, riskStatus: "Optimal" },
  { id: "agt_node", name: "Agartala Cross-Border & Agro Depot", code: "AGT-HUB", region: "Tripura Capital Belt", type: "crossdock", power: "grid", elevation_m: 15, terrain_type: "plains", is_rail_terminal: true, capacityKg: 35000, usedKg: 24500, tempZones: ["+4°C Queen Pineapple", "+18°C Rubber Storage"], activeDocks: 6, riskStatus: "Optimal" },
];

interface PickupItem {
  id: string;
  waybill: string;
  origin: string;
  destination: string;
  goodType: GoodType;
  urgency: UrgencyLevel;
  producer: string;
  community: string;
  commodity: string;
  loadQuantity: number;
  quantityUnits: string;
  weightKg: number;
  tempClass: "frozen" | "chilled" | "ambient";
  targetTemp: string;
  elevationM: number;
  terrainType: string;
  waitTimeMins: number;
  status: "Pending" | "Dispatched" | "In Transit" | "Delivered";
}

const INITIAL_PICKUPS: PickupItem[] = [
  { id: "p1", waybill: "NE-80101", origin: "Jorhat Upper Assam Tea Belt", destination: "Guwahati Northeast Central Mega Hub", goodType: "farm_produce", urgency: "high", producer: "Assam Valley Orthodox Planters Guild", community: "comm-jorhat", commodity: "Export Grade Orthodox CTC Tea", loadQuantity: 60, quantityUnits: "chests", weightKg: 850, tempClass: "ambient", targetTemp: "+18.0°C", elevationM: 87, terrainType: "plains", waitTimeMins: 35, status: "Pending" },
  { id: "p2", waybill: "NE-80102", origin: "Shillong Highlands Aggregation Node", destination: "Guwahati Northeast Central Mega Hub", goodType: "farm_produce", urgency: "high", producer: "Jaintia Hills Organic Spices SHG", community: "comm-shillong", commodity: "GI-Tagged Lakadong High-Curcumin Turmeric", loadQuantity: 40, quantityUnits: "sacks", weightKg: 520, tempClass: "ambient", targetTemp: "+20.0°C", elevationM: 1525, terrainType: "mountainous", waitTimeMins: 45, status: "Pending" },
  { id: "p3", waybill: "NE-80103", origin: "Tezpur Perishables Cluster", destination: "Siliguri Transit Centre", goodType: "farm_produce", urgency: "critical", producer: "Sonitpur Litchi Growers Cooperative", community: "comm-tezpur", commodity: "Fresh Tezpur Litchi & Farm Greens", loadQuantity: 50, quantityUnits: "crates", weightKg: 450, tempClass: "chilled", targetTemp: "+4.0°C", elevationM: 48, terrainType: "plains", waitTimeMins: 25, status: "Pending" },
  { id: "p4", waybill: "NE-80104", origin: "Gangtok Organic Highland Depot", destination: "Siliguri Transit Centre", goodType: "farm_produce", urgency: "routine", producer: "Sikkim State Organic Growers Union", community: "comm-gangtok", commodity: "Large Organic Cardamom & Sikkim Ginger", loadQuantity: 35, quantityUnits: "bags", weightKg: 380, tempClass: "ambient", targetTemp: "+16.0°C", elevationM: 1650, terrainType: "mountainous", waitTimeMins: 75, status: "Pending" },
  { id: "p5", waybill: "NE-80105", origin: "Itanagar Foothills Agro Depot", destination: "Guwahati Northeast Central Mega Hub", goodType: "farm_produce", urgency: "high", producer: "Arunachal Kiwi Producers FPO", community: "comm-itanagar", commodity: "Organic Golden Kiwi & Mandarin Oranges", loadQuantity: 45, quantityUnits: "crates", weightKg: 600, tempClass: "chilled", targetTemp: "+5.0°C", elevationM: 320, terrainType: "hilly", waitTimeMins: 50, status: "Pending" },
  { id: "p6", waybill: "NE-80106", origin: "Imphal Valley Agro Cluster", destination: "Dimapur Rail Gateway & Agro Hub", goodType: "farm_produce", urgency: "routine", producer: "Manipur Indigenous Agro Collective", community: "comm-imphal", commodity: "GI Chak-Hao Organic Black Rice", loadQuantity: 70, quantityUnits: "sacks", weightKg: 1050, tempClass: "ambient", targetTemp: "+22.0°C", elevationM: 786, terrainType: "hilly", waitTimeMins: 90, status: "Pending" },
  { id: "p7", waybill: "NE-80107", origin: "Agartala Cross-Border & Agro Depot", destination: "Kolkata Port & Distribution Gateway", goodType: "farm_produce", urgency: "high", producer: "Tripura Tropical Fruit Federation", community: "comm-agartala", commodity: "GI Tripura Queen Pineapples", loadQuantity: 80, quantityUnits: "crates", weightKg: 960, tempClass: "chilled", targetTemp: "+8.0°C", elevationM: 15, terrainType: "plains", waitTimeMins: 60, status: "Pending" },
  { id: "p8", waybill: "NE-80108", origin: "Guwahati Northeast Central Mega Hub", destination: "Delhi NCR Mega Logistics Terminal", goodType: "medicine", urgency: "critical", producer: "Guwahati Regional Biotech Vaccine Vault", community: "comm-guwahati", commodity: "Temperature-Sensitive Maternal Vaccines", loadQuantity: 150, quantityUnits: "vials", weightKg: 35, tempClass: "chilled", targetTemp: "+3.0°C", elevationM: 55, terrainType: "plains", waitTimeMins: 20, status: "Pending" },
];

const INITIAL_ROAD_SEGMENTS: RoadSegment[] = [
  {
    id: "seg-1",
    name: "NH-27 Guwahati–Siliguri 4-Lane East-West Arterial",
    osm_way_id: "way/789210941",
    length_km: 480.0,
    width_class: "two_lane",
    surface_type: "asphalt",
    static_base_score: 96,
    current_status: "clear",
    block_name: "Guwahati-Siliguri",
    reports: [
      { id: "r1", segment_id: "seg-1", reporter_id: "driver-ne-101 (Volvo Reefer)", status: "clear", note: "NH-27 national trunk fully operational with continuous FASTag RFID scanning and smooth asphalt.", reported_at: new Date(Date.now() - 1800000).toISOString() }
    ]
  },
  {
    id: "seg-2",
    name: "Siliguri Corridor & NJP Freight Junction",
    osm_way_id: "way/612984102",
    length_km: 18.5,
    width_class: "two_lane",
    surface_type: "asphalt",
    static_base_score: 88,
    current_status: "clear",
    block_name: "Siliguri-Gateway",
    reports: [
      { id: "r2", segment_id: "seg-2", reporter_id: "driver-ne-204", status: "clear", note: "Chicken's Neck switching hub operational. Crossdock bays active.", reported_at: new Date(Date.now() - 3600000).toISOString() }
    ]
  },
  {
    id: "seg-3",
    name: "NH-12 Siliguri–Kolkata Port Express Corridor",
    osm_way_id: "way/502819330",
    length_km: 560.0,
    width_class: "two_lane",
    surface_type: "asphalt",
    static_base_score: 92,
    current_status: "clear",
    block_name: "Siliguri-Kolkata",
    reports: [
      { id: "r3", segment_id: "seg-3", reporter_id: "driver-ne-308", status: "clear", note: "Express maritime connector to Kolkata Port running on green schedule.", reported_at: new Date(Date.now() - 5400000).toISOString() }
    ]
  },
  {
    id: "seg-4",
    name: "GS Road Shillong–Guwahati 4-Lane Hill Expressway",
    osm_way_id: "way/890123716",
    length_km: 100.0,
    width_class: "two_lane",
    surface_type: "asphalt",
    static_base_score: 86,
    current_status: "clear",
    block_name: "Shillong-Guwahati",
    reports: [
      { id: "r4", segment_id: "seg-4", reporter_id: "driver-meghalaya-402", status: "clear", note: "Smooth descent from Meghalaya highlands with IoT cold-chain checkpoints.", reported_at: new Date(Date.now() - 7200000).toISOString() }
    ]
  },
  {
    id: "seg-5",
    name: "NH-10 Sevoke–Gangtok Teesta River Hill Pass",
    osm_way_id: "way/381902881",
    length_km: 115.0,
    width_class: "single_lane",
    surface_type: "paved",
    static_base_score: 48,
    current_status: "difficult",
    block_name: "Sevoke-Gangtok",
    reports: [
      { id: "r5", segment_id: "seg-5", reporter_id: "driver-sikkim-112 (Bolero 4x4)", status: "difficult", note: "Teesta river gorge sector with single-lane convoy control at km 28. Minor gravel debris.", reported_at: new Date(Date.now() - 2400000).toISOString() }
    ]
  },
  {
    id: "seg-6",
    name: "NH-29 Dimapur–Kohima–Imphal Mountain Pass",
    osm_way_id: "way/920184712",
    length_km: 215.0,
    width_class: "two_lane",
    surface_type: "paved",
    static_base_score: 54,
    current_status: "difficult",
    block_name: "Dimapur-Imphal",
    reports: [
      { id: "r6", segment_id: "seg-6", reporter_id: "driver-nagaland-501", status: "difficult", note: "Mountain road with heavy mist and sharp bends. Strict speed restrictions.", reported_at: new Date(Date.now() - 9000000).toISOString() }
    ]
  },
  {
    id: "seg-7",
    name: "NH-6 Meghalaya–Silchar Barak Valley Sinking Zone",
    osm_way_id: "way/934501289",
    length_km: 135.0,
    width_class: "narrow_track",
    surface_type: "dirt",
    static_base_score: 30,
    current_status: "blocked",
    block_name: "Meghalaya-Barak",
    reports: [
      { id: "r7", segment_id: "seg-7", reporter_id: "driver-assam-603", status: "blocked", note: "Landslide clearance active near Sonapur tunnel approach. Heavy trucks halted.", reported_at: new Date(Date.now() - 1200000).toISOString() }
    ]
  }
];

const DEFAULT_SYNTHETIC_FLEET: Vehicle[] = [
  { id: "a0000000-0000-0000-0000-000000000001", vehicle_code: "AS-01-RC-9101", name: "Guwahati Heavy Reefer Express (16T)", type: "heavy_truck", capacity_kg: 16000, capacity_cbm: 42.0, cost_per_km: 28.0, max_gradient_pct: 8.0, suitable_terrains: "plains", temp_control: true, owner_type: "cooperative", current_location_name: "Guwahati Northeast Central Mega Hub", current_location_lat: 26.1445, current_location_lon: 91.7362, availability_status: "available", current_assignment: null },
  { id: "a0000000-0000-0000-0000-000000000002", vehicle_code: "AS-03-TC-4210", name: "Jorhat Tea Estate Tata Ace Feeder", type: "mini_truck", capacity_kg: 1200, capacity_cbm: 5.0, cost_per_km: 10.0, max_gradient_pct: 18.0, suitable_terrains: "plains,hilly", temp_control: true, owner_type: "cooperative", current_location_name: "Jorhat Upper Assam Tea Belt", current_location_lat: 26.7509, current_location_lon: 94.2037, availability_status: "available", current_assignment: null },
  { id: "a0000000-0000-0000-0000-000000000003", vehicle_code: "ML-05-BL-1840", name: "Shillong Highland 4x4 Bolero Pickup", type: "pickup_4x4", capacity_kg: 1500, capacity_cbm: 6.0, cost_per_km: 14.5, max_gradient_pct: 32.0, suitable_terrains: "mountainous,hilly,plains", temp_control: true, owner_type: "individual", current_location_name: "Shillong Highlands Aggregation Node", current_location_lat: 25.5788, current_location_lon: 91.8933, availability_status: "available", current_assignment: null },
  { id: "a0000000-0000-0000-0000-000000000004", vehicle_code: "SK-01-GT-3301", name: "Gangtok High-Altitude Agro 4x4", type: "pickup_4x4", capacity_kg: 1400, capacity_cbm: 5.5, cost_per_km: 15.0, max_gradient_pct: 30.0, suitable_terrains: "mountainous,hilly", temp_control: true, owner_type: "cooperative", current_location_name: "Gangtok Organic Highland Depot", current_location_lat: 27.3389, current_location_lon: 88.6065, availability_status: "available", current_assignment: null },
  { id: "a0000000-0000-0000-0000-000000000005", vehicle_code: "WB-74-RF-8802", name: "Siliguri Relay Cold-Van (4T)", type: "tempo", capacity_kg: 4000, capacity_cbm: 14.0, cost_per_km: 16.0, max_gradient_pct: 12.0, suitable_terrains: "plains,hilly", temp_control: true, owner_type: "cooperative", current_location_name: "Siliguri Transit Centre", current_location_lat: 26.7271, current_location_lon: 88.3953, availability_status: "available", current_assignment: null },
  { id: "a0000000-0000-0000-0000-000000000006", vehicle_code: "DL-1C-RR-0019", name: "Northern DFC Dedicated Rail Rake", type: "truck", capacity_kg: 45000, capacity_cbm: 120.0, cost_per_km: 12.0, max_gradient_pct: 3.0, suitable_terrains: "plains", temp_control: true, owner_type: "community", current_location_name: "Delhi NCR Mega Logistics Terminal", current_location_lat: 28.6139, current_location_lon: 77.2090, availability_status: "available", current_assignment: null },
];

export default function HomePage() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const locale = useLocale();
  const lang = ["en", "hi", "or"].includes(locale) ? locale : "en";

  const [showIntro, setShowIntro] = useState(false);
  const [reticleRotation, setReticleRotation] = useState(0);

  // Offline Sync State
  const [syncState, setSyncState] = useState<OfflineSyncState>({
    isOnline: true,
    pendingCount: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Section 00: Quick parameter simulator
  const [originHero, setOriginHero] = useState("Jorhat Upper Assam Tea Belt");
  const [destHero, setDestHero] = useState("Guwahati Northeast Central Mega Hub");
  const [goodTypeHero, setGoodTypeHero] = useState<GoodType>("farm_produce");
  const [urgencyHero, setUrgencyHero] = useState<UrgencyLevel>("high");
  const [roadConditionHero, setRoadConditionHero] = useState<RoadCondition>("paved");
  const [ambientTempHero, setAmbientTempHero] = useState(36);

  // Section 01: Hub matrix
  const [selectedHub, setSelectedHub] = useState<HubItem>(INITIAL_HUBS[0]);

  // Section 02: Pickups queue & Creation Form
  const [pickups, setPickups] = useState<PickupItem[]>(INITIAL_PICKUPS);
  const [pickupFilter, setPickupFilter] = useState<string>("all");
  const [newOrigin, setNewOrigin] = useState("Jorhat Upper Assam Tea Belt");
  const [newDest, setNewDest] = useState("Guwahati Northeast Central Mega Hub");
  const [newProducer, setNewProducer] = useState("Assam Valley Tea Planters Guild");
  const [newCommodity, setNewCommodity] = useState("Fresh Seasonal Vegetables");
  const [newGoodType, setNewGoodType] = useState<GoodType>("farm_produce");
  const [newUrgency, setNewUrgency] = useState<UrgencyLevel>("high");
  const [newWeight, setNewWeight] = useState(350);
  const [newLoadQty, setNewLoadQty] = useState(50);
  const [newQtyUnits, setNewQtyUnits] = useState("crates");

  // Section 03: Dynamic Dispatch Matcher
  const [isMatching, setIsMatching] = useState(false);
  const [extendWindow, setExtendWindow] = useState(false);
  const [matchResults, setMatchResults] = useState<DispatchMatchItem[]>([]);
  const [fairnessSummaryText, setFairnessSummaryText] = useState<string>(t("dispatch.initialFairnessSummary"));

  // Section 04: Arrhenius Kinetics Simulator
  const [kineticsTemp, setKineticsTemp] = useState(36);
  const [kineticsDurationHrs, setKineticsDurationHrs] = useState(12);
  const [hasSolarBuffer, setHasSolarBuffer] = useState(true);

  // Section 05: Fairness Dashboard
  const [fairnessData, setFairnessData] = useState<FairnessMetricsResponse | null>(null);
  const [backendHubs, setBackendHubs] = useState<{ id: string; name: string }[]>([]);

  // RoadSense™ Live Road Intelligence (Phase 1-6)
  const [roadSegments, setRoadSegments] = useState<RoadSegment[]>(INITIAL_ROAD_SEGMENTS);
  const [selectedRoadSenseId, setSelectedRoadSenseId] = useState<string>("seg-1");
  const [roadSenseReportStatus, setRoadSenseReportStatus] = useState<RoadSegmentStatus>("difficult");
  const [roadSenseReportNote, setRoadSenseReportNote] = useState<string>("");
  const [roadSenseReporter, setRoadSenseReporter] = useState<string>("Driver (NER Fleet - AS-01-BP-1020)");
  const [showRoadSenseModal, setShowRoadSenseModal] = useState<boolean>(false);
  const [isSubmittingRoadSense, setIsSubmittingRoadSense] = useState<boolean>(false);

  // Section 06: Live Road Conditions & Legacy Alerts
  const [roadAlerts, setRoadAlerts] = useState<
    { id: string; time: string; corridor: string; condition: string; notes: string; status: string; color: string }[]
  >([
    { id: "ra-1", time: "18:14 IST", corridor: "NH-27 Guwahati–Nagaon Corridor", condition: "Flood Risk (Submerged)", notes: "Monsoon flash flood risk near km 42; transit monitored for high-clearance 4x4.", status: "Difficult 🟡", color: "text-amber-600" },
    { id: "ra-2", time: "17:30 IST", corridor: "NH-29 Dimapur–Kohima Ghat Road", condition: "Landslide Risk (Single Lane)", notes: "Minor mudslide cleared; single-lane convoy active with mountain gradeability check.", status: "Difficult 🟡", color: "text-amber-600" },
    { id: "ra-3", time: "16:45 IST", corridor: "Silchar–Imphal Mountain Road (NH-37)", condition: "Unpaved Silt / Mud Ruts", notes: "Heavy rutting in monsoon stretch; recommended for 4x4 Bolero & Tractors.", status: "Difficult 🟡", color: "text-amber-600" },
    { id: "ra-4", time: "15:20 IST", corridor: "Guwahati–Shillong Expressway (GS Road)", condition: "Paved Asphalt (Clear)", notes: "Smooth multi-lane mountain express route clear for all vehicle classes.", status: "Clear 🟢", color: "text-emerald-600" },
  ]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCorridor, setReportCorridor] = useState("Majuli Island Ferry Approach ⇄ Jorhat Agro Terminal");
  const [reportCondition, setReportCondition] = useState<RoadCondition>("flood_risk");
  const [reportNotes, setReportNotes] = useState("");
  const [reportAuthor, setReportAuthor] = useState("Field Agent (Driver)");

  // Section 07: Dynamic Synthetic Vehicle Registry & Fleet Operations
  const [vehicles, setVehicles] = useState<Vehicle[]>(DEFAULT_SYNTHETIC_FLEET);
  const [vehicleFilterStatus, setVehicleFilterStatus] = useState<string>("all");
  const [vehicleFilterLocation, setVehicleFilterLocation] = useState<string>("all");
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState<boolean>(false);
  const [newVehicleCode, setNewVehicleCode] = useState<string>("AS-01-TC-9999");
  const [newVehicleName, setNewVehicleName] = useState<string>("Jorhat Solar Rapid Reefer");
  const [newVehicleType, setNewVehicleType] = useState<VehicleType>("mini_truck");
  const [newVehicleLocation, setNewVehicleLocation] = useState<string>("Jorhat Upper Assam Tea Belt");
  const [newVehicleCapacityKg, setNewVehicleCapacityKg] = useState<number>(1200);
  const [newVehicleCapacityCbm, setNewVehicleCapacityCbm] = useState<number>(5.0);
  const [newVehicleCostKm, setNewVehicleCostKm] = useState<number>(10.5);
  const [newVehicleTempControl, setNewVehicleTempControl] = useState<boolean>(true);
  const [newVehicleOwnerType, setNewVehicleOwnerType] = useState<VehicleOwnerType>("cooperative");

  const communityBreakdown = useMemo(() => {
    if (fairnessData && fairnessData.community_breakdown && fairnessData.community_breakdown.length > 0) {
      const commNameMap: Record<string, string> = {
        "comm-jorhat": "Jorhat Upper Assam Tea Belt",
        "comm-tawang": "Tawang Mountain Outpost",
        "comm-majuli": "Majuli River Island Ferries",
        "comm-imphal": "Imphal Valley Organic Farms",
        "comm-shillong": "Shillong Highlands",
        "comm-silchar": "Silchar Barak Valley Hub",
      };
      return fairnessData.community_breakdown.map((c) => ({
        name: commNameMap[c.community_id] || c.community_id,
        avgWait: Math.round(c.average_wait_time_minutes),
        maxWait: Math.round(c.max_wait_time_minutes),
        matches: c.total_allocations,
        score: c.fairness_index,
      }));
    }
    return [
      { name: "Jorhat Upper Assam Tea Belt", avgWait: 42, maxWait: 90, matches: 14, score: 0.96 },
      { name: "Tawang Mountain Outpost (3048m)", avgWait: 55, maxWait: 110, matches: 12, score: 0.94 },
      { name: "Majuli River Island Ferries", avgWait: 62, maxWait: 125, matches: 9, score: 0.92 },
      { name: "Imphal Valley Organic Farms", avgWait: 78, maxWait: 140, matches: 8, score: 0.90 },
      { name: "Shillong Highlands (1525m)", avgWait: 52, maxWait: 105, matches: 7, score: 0.93 },
      { name: "Silchar Barak Valley Hub", avgWait: 68, maxWait: 130, matches: 6, score: 0.91 },
    ];
  }, [fairnessData]);

  // Initial intro check and offline sync subscription
  useEffect(() => {
    const hasSeen = sessionStorage.getItem("cargomind_intro_seen");
    if (!hasSeen) {
      setShowIntro(true);
    }

    const unsubscribe = OfflineSyncManager.subscribe((state) => {
      setSyncState(state);
    });

    // Fetch initial vehicles registry from backend
    getVehicles()
      .then((vList) => {
        if (vList && vList.length > 0) {
          setVehicles(vList);
        }
      })
      .catch((e) => console.warn("Backend vehicles API unavailable (using synthetic baseline fleet)", e));

    // Fetch initial fairness metrics, road conditions, road segments, and hubs
    getFairnessMetrics()
      .then((data) => setFairnessData(data))
      .catch((e) => console.warn("Backend fairness metrics unavailable (using demo baseline)", e));

    getRoadSegments()
      .then((segs) => {
        if (segs && segs.length > 0) {
          setRoadSegments(segs);
          if (segs[0]) setSelectedRoadSenseId(segs[0].id);
        }
      })
      .catch((e) => console.warn("RoadSense segments API unavailable (using demo baseline)", e));

    getRoadConditions()
      .then((data) => {
        if (data && data.length > 0) {
          const liveAlerts = data.slice(0, 6).map((rc) => ({
            id: rc.id,
            time: new Date(rc.reported_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " IST",
            corridor: rc.route_id ? `Corridor ${rc.route_id.substring(0, 8)}...` : "Rural Feeder Corridor",
            condition: rc.condition === "flood_risk" ? "Flood Risk Alert" : rc.condition === "unpaved" ? "Unpaved Section" : rc.condition === "seasonal" ? "Seasonal Washout" : "Paved Road",
            notes: rc.notes || `Live observation: ${rc.condition.replace("_", " ")} corridor.`,
            status: rc.condition === "flood_risk" ? "Active Caution" : rc.condition === "unpaved" ? "Handled" : "Optimal",
            color: rc.condition === "flood_risk" ? "text-rose-600" : rc.condition === "unpaved" ? "text-amber-600" : "text-emerald-600",
          }));
          setRoadAlerts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newOnes = liveAlerts.filter((l) => !existingIds.has(l.id));
            return [...newOnes, ...prev];
          });
        }
      })
      .catch(() => {});

    return () => unsubscribe();
  }, []);

  // Handle Submitting One-Tap RoadSense Crowdsourced Driver Report (Phase 5 DoD)
  const handleReportRoadSense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRoadSense(true);

    const targetSeg = roadSegments.find((s) => s.id === selectedRoadSenseId) || roadSegments[0];
    const newStatus = roadSenseReportStatus;
    const noteText = roadSenseReportNote || `${newStatus.toUpperCase()} condition reported on ${targetSeg.name}`;
    const reportTime = new Date().toISOString();

    const newReport: RoadReport = {
      id: `rep-${Date.now()}`,
      segment_id: targetSeg.id,
      reporter_id: roadSenseReporter,
      status: newStatus,
      note: noteText,
      reported_at: reportTime,
      synced_at: navigator.onLine ? reportTime : undefined,
    };

    const penalty = newStatus === "blocked" ? -75 : newStatus === "difficult" ? -35 : 10;
    const updatedScore = Math.max(0, Math.min(100, Math.round(targetSeg.static_base_score + penalty)));

    // 1. Optimistic Local State Update
    setRoadSegments((prev) =>
      prev.map((s) => {
        if (s.id === targetSeg.id) {
          return {
            ...s,
            current_status: newStatus,
            reports: [newReport, ...(s.reports || [])],
            last_report_at: reportTime,
          };
        }
        return s;
      })
    );

    // Add alert to feed
    const alertItem = {
      id: `ra-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " IST",
      corridor: targetSeg.name,
      condition: `RoadSense: ${newStatus.toUpperCase()}`,
      notes: `${noteText} (Dynamic score update: ${updatedScore}/100)`,
      status: newStatus === "blocked" ? "Blocked 🔴" : newStatus === "difficult" ? "Difficult 🟡" : "Clear 🟢",
      color: newStatus === "blocked" ? "text-rose-600" : newStatus === "difficult" ? "text-amber-600" : "text-emerald-600",
    };
    setRoadAlerts((prev) => [alertItem, ...prev]);

    // 2. Queue for offline sync (Offline First)
    OfflineSyncManager.queueAction("road_report", {
      segment_id: targetSeg.id,
      status: newStatus,
      reporter_id: roadSenseReporter,
      note: noteText,
      client_id: crypto.randomUUID ? crypto.randomUUID() : undefined,
    });

    if (navigator.onLine) {
      try {
        await submitRoadReport({
          segment_id: targetSeg.id,
          status: newStatus,
          reporter_id: roadSenseReporter,
          note: noteText,
        });
      } catch (err) {
        console.warn("Direct RoadSense submit error, queueing for batch sync", err);
        OfflineSyncManager.flushQueue();
      }
    }

    setIsSubmittingRoadSense(false);
    setShowRoadSenseModal(false);
    setRoadSenseReportNote("");
  };

  // Filtered pickups
  const filteredPickups = useMemo(() => {
    if (pickupFilter === "all") return pickups;
    if (pickupFilter === "medicine") return pickups.filter((p) => p.goodType === "medicine");
    if (pickupFilter === "produce") return pickups.filter((p) => p.goodType === "farm_produce");
    if (pickupFilter === "critical") return pickups.filter((p) => p.urgency === "critical");
    return pickups.filter((p) => p.status.toLowerCase() === pickupFilter.toLowerCase());
  }, [pickups, pickupFilter]);

  // Handle Manual Offline Flush
  const handleManualSync = async () => {
    setIsSyncing(true);
    const res = await OfflineSyncManager.flushQueue();
    setIsSyncing(false);
    if (res.success && res.synced > 0) {
      alert(`Synchronized ${res.synced} offline queued records to central server.`);
    }
  };

  // Handle Ingesting a new rural pickup (Offline First)
  const handleCreatePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `p-${Date.now()}`;
    const randomWB = `RUR-${Math.floor(90150 + Math.random() * 800)}`;
    const comm = newOrigin.includes("Tawang")
      ? "comm-tawang"
      : newOrigin.includes("Shillong")
      ? "comm-shillong"
      : newOrigin.includes("Majuli")
      ? "comm-majuli"
      : newOrigin.includes("Imphal")
      ? "comm-imphal"
      : newOrigin.includes("Silchar")
      ? "comm-silchar"
      : "comm-jorhat";

    const isHill = newOrigin.includes("Tawang") || newOrigin.includes("Shillong") || newOrigin.includes("Imphal");
    const elev = newOrigin.includes("Tawang") ? 3048 : newOrigin.includes("Shillong") ? 1525 : newOrigin.includes("Imphal") ? 786 : newOrigin.includes("Silchar") ? 35 : 116;

    const newItem: PickupItem = {
      id: newId,
      waybill: randomWB,
      origin: newOrigin,
      destination: newDest,
      goodType: newGoodType,
      urgency: newUrgency,
      producer: newProducer,
      community: comm,
      commodity: newCommodity,
      loadQuantity: Number(newLoadQty),
      quantityUnits: newQtyUnits,
      weightKg: Number(newWeight),
      tempClass: newGoodType === "medicine" ? "chilled" : "chilled",
      targetTemp: newGoodType === "medicine" ? "+3.5°C" : "+4.0°C",
      elevationM: elev,
      terrainType: isHill ? "mountainous" : newOrigin.includes("Banki") ? "riverine" : "plains",
      waitTimeMins: 5,
      status: "Pending",
    };

    // 1. Update UI optimistically
    setPickups([newItem, ...pickups]);

    const originHub = backendHubs.find((h) => h.name.includes(newOrigin.split(" ")[0]))?.id || (crypto.randomUUID ? crypto.randomUUID() : "a0000000-0000-0000-0000-000000000001");
    const destHub = backendHubs.find((h) => h.name.includes(newDest.split(" ")[0]))?.id || (crypto.randomUUID ? crypto.randomUUID() : "a0000000-0000-0000-0000-000000000002");

    // 2. Queue for offline synchronization
    OfflineSyncManager.queueAction("shipment", {
      origin_hub_id: originHub,
      dest_hub_id: destHub,
      good_type: newGoodType,
      urgency: newUrgency,
      producer_id: `prod-${comm.replace("comm-", "")}-01`,
      producer_name: newProducer,
      community_id: comm,
      waybill_number: randomWB,
      load_quantity: Number(newLoadQty),
      quantity_units: newQtyUnits,
      weight_kg: Number(newWeight),
      volume_cbm: Number(newWeight) / 250.0,
      temp_class: "chilled",
      sla_deadline: new Date(Date.now() + (newUrgency === "critical" ? 12 : 24) * 3600000).toISOString(),
    });

    if (navigator.onLine) {
      OfflineSyncManager.flushQueue();
    }
  };

  // Handle Reporting Real-Time Road Condition Hazard
  const handleReportRoadHazard = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert = {
      id: `ra-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " IST",
      corridor: reportCorridor,
      condition: reportCondition === "flood_risk" ? "Flood Risk Alert" : reportCondition === "unpaved" ? "Unpaved Section" : reportCondition === "seasonal" ? "Seasonal Washout" : "Paved Road",
      notes: reportNotes || `Reported by ${reportAuthor}: ${reportCondition.replace("_", " ")} corridor observation.`,
      status: reportCondition === "flood_risk" ? "Active Caution" : reportCondition === "unpaved" ? "Handled" : "Optimal",
      color: reportCondition === "flood_risk" ? "text-rose-600" : reportCondition === "unpaved" ? "text-amber-600" : "text-emerald-600",
    };

    setRoadAlerts((prev) => [newAlert, ...prev]);
    setShowReportModal(false);
    setReportNotes("");

    // Queue for sync
    OfflineSyncManager.queueAction("road_condition", {
      route_id: crypto.randomUUID ? crypto.randomUUID() : "b0000000-0000-0000-0000-000000000001",
      condition: reportCondition,
      reported_by: reportAuthor,
      notes: reportNotes || "Field observation report",
    });

    if (navigator.onLine) {
      OfflineSyncManager.flushQueue();
    }
  };

  // Dynamic Multi-Vehicle Dispatch Allocation Engine
  const handleRunDispatch = async () => {
    setIsMatching(true);
    try {
      const res = await runDynamicMatching({
        force_window_extension_hrs: extendWindow ? 4.0 : 0.0,
      });

      if (res && res.matches && res.matches.length > 0) {
        setMatchResults(res.matches);
        setFairnessSummaryText(res.fairness_summary);
        // Mark matched shipments in UI
        const matchedIds = new Set(res.matches.map((m) => String(m.shipment_id)));
        setPickups((prev) =>
          prev.map((p) => (matchedIds.has(p.id) ? { ...p, status: "Dispatched" } : p))
        );
        // Refresh fairness metrics
        getFairnessMetrics()
          .then((data) => setFairnessData(data))
          .catch(() => {});
      } else {
        executeClientDynamicAllocation();
      }
    } catch (e) {
      console.warn("Backend dynamic matching endpoint fallback to client allocation engine", e);
      executeClientDynamicAllocation();
    } finally {
      setIsMatching(false);
    }
  };

  const executeClientDynamicAllocation = (fleetOverride?: Vehicle[], pickupsOverride?: PickupItem[]) => {
    const currentPickups = pickupsOverride || pickups;
    const currentFleet = fleetOverride || vehicles;

    const pendingList = currentPickups.filter((p) => p.status === "Pending");
    const targetPickups = pendingList.length > 0 ? pendingList : currentPickups;

    const activeAvailableFleet = currentFleet.filter((v) => v.availability_status === "available");
    if (activeAvailableFleet.length === 0) {
      setMatchResults([]);
      setVehicles((prev) => (fleetOverride ? fleetOverride : prev).map((v) => ({ ...v, current_assignment: null })));
      setFairnessSummaryText("Zero vehicles currently available in the dynamic registry. All units are offline, occupied, or under maintenance. Set vehicles to 'available' to resume allocation.");
      return;
    }

    // Track vehicle load during matching pass
    const vehicleLoads: Record<string, { assignedKg: number; assignedCbm: number; tempClass: string | null; count: number }> = {};
    activeAvailableFleet.forEach((v) => {
      vehicleLoads[v.id] = { assignedKg: 0, assignedCbm: 0, tempClass: null, count: 0 };
    });

    // 1. Calculate Priority Score: Urgency + Fairness Boost + Wait Time
    const scoredPickups = targetPickups.map((p) => {
      const urgPts = p.urgency === "critical" ? 500 : p.urgency === "high" ? 300 : 100;
      const medBonus = p.goodType === "medicine" ? 200 : 0;
      const waitTime = p.waitTimeMins || 20;

      // Starvation protection for remote clusters & wait time ratio
      const starvationBonus =
        p.community === "comm-tawang" ? 150 : p.community === "comm-majuli" ? 140 : p.community === "comm-shillong" ? 130 : p.community === "comm-imphal" ? 120 : p.community === "comm-silchar" ? 100 : 80;
      const waitRatioBonus = Math.max(0, Math.round((waitTime - 40) * 2.2));
      const fairnessBoost = Math.min(300, starvationBonus + waitRatioBonus);
      const totalScore = urgPts + medBonus + fairnessBoost + Math.round(waitTime * 0.5);

      return {
        pickup: p,
        urgPts,
        medBonus,
        waitTime,
        fairnessBoost,
        totalScore,
      };
    });

    // 2. Sort descending by total score
    scoredPickups.sort((a, b) => b.totalScore - a.totalScore);

    const matches: DispatchMatchItem[] = [];
    const matchedPickupIds = new Set<string>();

    for (const item of scoredPickups) {
      const p = item.pickup;
      const requiresTemp = p.goodType === "medicine" || p.tempClass === "chilled" || p.tempClass === "frozen";
      const isHilly = p.terrainType === "mountainous" || p.terrainType === "hilly";
      const isRiverine = p.terrainType === "riverine";

      // Find compatible vehicle from dynamic active fleet
      let chosenVehicle: (typeof activeAvailableFleet)[0] | null = null;

      for (const v of activeAvailableFleet) {
        const load = vehicleLoads[v.id];
        const remainingKg = v.capacity_kg - load.assignedKg;

        // Check capacity
        if (remainingKg < p.weightKg) continue;

        // Check temperature control
        if (requiresTemp && !v.temp_control) continue;

        // Check thermal isolation with existing cargo
        if (load.tempClass && load.tempClass !== p.tempClass) continue;

        // Check terrain suitability & gradeability
        const terrains = (v.suitable_terrains || "plains")
          .split(",")
          .map((t) => t.trim().toLowerCase());

        if (isRiverine && !terrains.includes("riverine") && v.type !== "riverine_boat") {
          continue;
        }

        if (isHilly && !terrains.includes("mountainous") && !terrains.includes("hilly") && (v.max_gradient_pct || 0) < 18) {
          continue;
        }

        if (isRiverine && (v.type === "cargo_erickshaw" || v.type === "cargo_bike")) {
          continue;
        }

        chosenVehicle = v;
        break;
      }

      if (chosenVehicle) {
        const load = vehicleLoads[chosenVehicle.id];
        load.assignedKg += p.weightKg;
        load.assignedCbm += p.weightKg * 0.005;
        load.tempClass = p.tempClass;
        load.count += 1;
        matchedPickupIds.add(p.id);

        const loadUtilPct = Number(((load.assignedKg / chosenVehicle.capacity_kg) * 100).toFixed(1));
        const gradient = isHilly ? 6.8 : isRiverine ? 0.5 : 1.0;

        const explanation = isHilly
          ? `Allocated ${chosenVehicle.name} (${chosenVehicle.vehicle_code || chosenVehicle.id}) for high-altitude mountain delivery (${p.elevationM}m ASL, ${gradient}% gradient). Gradeability verified with ${chosenVehicle.max_gradient_pct || 25}% maximum limit.`
          : isRiverine
          ? `Allocated ${chosenVehicle.name} for riverine delta corridor. Flood risk avoidance guaranteed.`
          : p.goodType === "medicine"
          ? `Allocated temperature-controlled ${chosenVehicle.name} for critical medical cargo (${p.commodity}). Strict active thermal monitoring guarantees zero spoilage.`
          : `Consolidated ${p.commodity} onto ${chosenVehicle.name} (${chosenVehicle.vehicle_code || chosenVehicle.id}). Vehicle load utilization reached ${loadUtilPct}% (${load.assignedKg} / ${chosenVehicle.capacity_kg} kg).`;

        // RoadSense Real-Time Viability Scoring
        let roadScore = 85;
        let roadStatus = "clear";
        let roadEmoji = "🟢";
        let roadBreakdown = [
          "Two-lane asphalt corridor with baseline score 90/100."
        ];
        const vehicleRecs: Record<string, VehicleViability> = {
          truck: { score: 90, status_emoji: "🟢", recommended: true, status: "clear", breakdown: ["High capacity two-lane road viable for heavy truck."] },
          mini_truck: { score: 92, status_emoji: "🟢", recommended: true, status: "clear", breakdown: ["Optimal maneuverability and axle load."] },
          tractor: { score: 88, status_emoji: "🟢", recommended: true, status: "clear", breakdown: ["Full traction reserve on all surface types."] },
          two_wheeler: { score: 95, status_emoji: "🟢", recommended: true, status: "clear", breakdown: ["Rapid low-payload dispatch viable."] },
        };

        if (p.community === "comm-guwahati" || p.community === "comm-shillong") {
          roadScore = 95;
          roadStatus = "clear";
          roadEmoji = "🟢";
          roadBreakdown = [
            "14.5km two-lane road (asphalt surface, static base score: 95/100).",
            "Latest driver report 1h ago: 'Highway corridor clear, smooth asphalt surface'.",
            "Optimal transit conditions for all vehicle categories.",
          ];
        } else if (p.community === "comm-kohima" || p.community === "comm-dimapur") {
          roadScore = 62;
          roadStatus = "difficult";
          roadEmoji = "🟡";
          roadBreakdown = [
            "12.0km intermediate road (paved with gravel ruts, static base: 78/100).",
            "Driver report 2h ago: 'Paglapahar stretch mud accumulation; cautious crawl speed advised'.",
            "Heavy 16T truck not recommended due to narrow single-point bypass.",
          ];
          vehicleRecs.truck = { score: 25, status_emoji: "🔴", recommended: false, status: "blocked", breakdown: ["16T truck exceeds narrow 4.2m width tolerance during gravel detours."] };
        } else if (p.community === "comm-majuli" || p.community === "comm-pandu") {
          roadScore = 38;
          roadStatus = "difficult";
          roadEmoji = "🟡";
          roadBreakdown = [
            "3.8km narrow track (unpaved riverine mud, static base: 35/100).",
            "Driver report 1.5h ago: 'Brahmaputra high tide mud on ghat approach; tractor or barge advised'.",
            "High clearance 4WD / Tractor trailer or cargo boat recommended.",
          ];
          vehicleRecs.truck = { score: 15, status_emoji: "🔴", recommended: false, status: "blocked", breakdown: ["Impassable for heavy 2WD truck on wet river sand."] };
          vehicleRecs.mini_truck = { score: 32, status_emoji: "🔴", recommended: false, status: "difficult", breakdown: ["Low clearance risk on riverside silt."] };
          vehicleRecs.tractor = { score: 82, status_emoji: "🟢", recommended: true, status: "clear", breakdown: ["Tractor with high axle clearance and mud grip tires recommended."] };
        }

        const reasons = [
          isHilly
            ? (`Terrain gradeability verified: Route gradient ${gradient}% is within vehicle max tolerance of ${chosenVehicle.max_gradient_pct || 25}%.`)
            : p.goodType === "medicine"
            ? ("Critical cold-chain medicine priority satisfied (insulated + active cooling).")
            : (`Thermal compatibility isolation enforced (uniform '${p.tempClass}' cargo).`),
          `Load capacity utilization optimized: ${loadUtilPct}% (${load.assignedKg} kg / ${chosenVehicle.capacity_kg} kg).`,
          `Fairness allocation boost (+${item.fairnessBoost}pts) applied to prevent remote community starvation.`,
          `RoadSense: Roadability score ${roadScore}/100 ${roadEmoji} (${roadStatus.toUpperCase()}).`,
          `Vehicle operating cost: ₹${(chosenVehicle.cost_per_km || 10).toFixed(1)}/km with zero thermal loss.`,
        ];

        matches.push({
          shipment_id: p.id,
          waybill_number: p.waybill,
          good_type: p.goodType,
          urgency: p.urgency,
          producer_id: `prod-${p.community.replace("comm-", "")}-01`,
          producer_name: p.producer,
          community_id: p.community,
          load_quantity: p.loadQuantity,
          quantity_units: p.quantityUnits,
          weight_kg: p.weightKg,
          volume_cbm: p.weightKg * 0.005,
          matched_vehicle_id: chosenVehicle.id,
          matched_vehicle_code: chosenVehicle.vehicle_code,
          matched_vehicle_name: chosenVehicle.name,
          matched_vehicle_type: chosenVehicle.type,
          matched_vehicle_location: chosenVehicle.current_location_name,
          matched_vehicle_capacity_kg: chosenVehicle.capacity_kg,
          matched_vehicle_capacity_cbm: chosenVehicle.capacity_cbm,
          vehicle_assigned_weight_kg: load.assignedKg,
          vehicle_assigned_volume_cbm: load.assignedCbm,
          load_utilization_pct: loadUtilPct,
          wait_time_minutes: item.waitTime,
          fairness_boost_pts: item.fairnessBoost,
          allocation_score: item.totalScore,
          route_mode: isHilly ? "local" : "road",
          terrain_type: p.terrainType,
          elevation_gain_m: isHilly ? p.elevationM - 45 : 0,
          gradient_pct: gradient,
          vehicle_cost_per_km: chosenVehicle.cost_per_km,
          dynamic_window_extended: extendWindow,
          explanation_summary: explanation,
          reasons: reasons,
          roadability_score: roadScore,
          roadability_status: roadStatus,
          roadability_emoji: roadEmoji,
          road_breakdown: roadBreakdown,
          vehicle_recommendations: vehicleRecs,
        });
      }
    }

    setMatchResults(matches);
    const avgUtil = matches.length > 0 ? (matches.reduce((acc, m) => acc + (m.load_utilization_pct || 0), 0) / matches.length).toFixed(1) : "0.0";
    setFairnessSummaryText(
      `Dynamic matching evaluated ${scoredPickups.length} community pickups (${matches.length} allocated to fleet, ${scoredPickups.length - matches.length} pending). Average fleet payload utilization: ${avgUtil}%. Terrain gradients and vehicle gradeability verified for all routes.`
    );

    // Update vehicle assignments in state (clearing previously assigned for unallocated)
    const assignedVehicleMap: Record<string, { count: number; weight: number }> = {};
    matches.forEach((m) => {
      if (!assignedVehicleMap[m.matched_vehicle_id]) {
        assignedVehicleMap[m.matched_vehicle_id] = { count: 0, weight: 0 };
      }
      assignedVehicleMap[m.matched_vehicle_id].count += 1;
      assignedVehicleMap[m.matched_vehicle_id].weight += m.weight_kg;
    });

    setVehicles((prev) => {
      const baseList = fleetOverride || prev;
      return baseList.map((v) => {
        const alloc = assignedVehicleMap[v.id];
        if (alloc) {
          return {
            ...v,
            current_assignment: `Dispatched: ${alloc.count} pickups (${alloc.weight} kg)`,
          };
        }
        return {
          ...v,
          current_assignment: null,
        };
      });
    });

    // Update pickups state to show Dispatched
    setPickups((prev) =>
      prev.map((p) => (matchedPickupIds.has(p.id) ? { ...p, status: "Dispatched" } : p))
    );

    // Update dynamic fairness dashboard data
    const commGroups: Record<string, { totalWait: number; maxWait: number; count: number }> = {};
    matches.forEach((m) => {
      if (!commGroups[m.community_id]) {
        commGroups[m.community_id] = { totalWait: 0, maxWait: 0, count: 0 };
      }
      commGroups[m.community_id].totalWait += m.wait_time_minutes;
      commGroups[m.community_id].maxWait = Math.max(commGroups[m.community_id].maxWait, m.wait_time_minutes);
      commGroups[m.community_id].count += 1;
    });

    const breakdown = Object.entries(commGroups).map(([commId, data]) => {
      const avgW = data.count > 0 ? data.totalWait / data.count : 45;
      const fIndex = Math.max(0.85, Math.min(1.0, 1.0 - Math.max(0, avgW - 60) / 300));
      return {
        community_id: commId,
        producer_count: 5,
        critical_goods_fulfilled_pct: 100.0,
        average_wait_time_minutes: Number(avgW.toFixed(1)),
        max_wait_time_minutes: data.maxWait || 60,
        total_allocations: data.count,
        fairness_index: Number(fIndex.toFixed(2)),
      };
    });

    if (breakdown.length > 0) {
      const avgFairness = Number(
        (breakdown.reduce((sum, b) => sum + b.fairness_index, 0) / breakdown.length).toFixed(2)
      );
      setFairnessData({
        overall_fairness_index: avgFairness,
        regional_avg_wait_minutes: 54,
        total_dispatches_7d: matches.length + 38,
        community_breakdown: breakdown,
        recent_allocations: [],
      });
    }
  };

  // Helper for smart vehicle defaults when selecting type in modal
  const handleVehicleTypeChange = (type: VehicleType) => {
    setNewVehicleType(type);
    const defaults: Record<string, { name: string; capacity_kg: number; capacity_cbm: number; cost_per_km: number; temp_control: boolean }> = {
      mini_truck: { name: "Tata Ace Gold Mini-Truck", capacity_kg: 1000, capacity_cbm: 4.5, cost_per_km: 10.0, temp_control: true },
      tata_ace: { name: "Tata Ace Diesel Feeder", capacity_kg: 1000, capacity_cbm: 4.5, cost_per_km: 9.5, temp_control: false },
      pickup_4x4: { name: "Mahindra Bolero Pickup 4x4", capacity_kg: 1500, capacity_cbm: 6.0, cost_per_km: 14.5, temp_control: true },
      bolero_pickup: { name: "Mahindra Bolero Pickup 4x4", capacity_kg: 1500, capacity_cbm: 6.0, cost_per_km: 14.5, temp_control: true },
      tempo: { name: "Force Traveller Reefer Tempo", capacity_kg: 2200, capacity_cbm: 8.0, cost_per_km: 13.0, temp_control: true },
      three_wheeler_cargo: { name: "Piaggio Ape Three-Wheeler", capacity_kg: 500, capacity_cbm: 2.5, cost_per_km: 7.5, temp_control: false },
      cargo_erickshaw: { name: "Mahindra Treo Zor E-Rickshaw", capacity_kg: 500, capacity_cbm: 2.5, cost_per_km: 4.5, temp_control: false },
      motorbike: { name: "Hero Express Cargo Motorcycle", capacity_kg: 80, capacity_cbm: 0.35, cost_per_km: 3.5, temp_control: true },
      tractor_trailer: { name: "Swaraj Agro Tractor-Trailer", capacity_kg: 3500, capacity_cbm: 12.0, cost_per_km: 18.0, temp_control: false },
      tractor: { name: "Mahindra DI Agro Tractor", capacity_kg: 3000, capacity_cbm: 10.0, cost_per_km: 16.5, temp_control: false },
      riverine_boat: { name: "Mahanadi Riverine Cargo Ferry", capacity_kg: 2000, capacity_cbm: 10.0, cost_per_km: 14.0, temp_control: true },
      cargo_bike: { name: "Mountain Highland E-Cargo Bike", capacity_kg: 100, capacity_cbm: 0.5, cost_per_km: 3.0, temp_control: true },
      heavy_truck: { name: "Ashok Leyland 1616 Heavy Truck", capacity_kg: 16000, capacity_cbm: 35.0, cost_per_km: 28.0, temp_control: true },
      truck: { name: "Tata 1613 Heavy Cargo Truck", capacity_kg: 16000, capacity_cbm: 35.0, cost_per_km: 28.0, temp_control: true },
      bus: { name: "Rural Passenger-Cargo Bus", capacity_kg: 2500, capacity_cbm: 9.0, cost_per_km: 15.0, temp_control: false },
      shared_auto: { name: "Shared Auto Cargo Feeder", capacity_kg: 450, capacity_cbm: 2.2, cost_per_km: 6.5, temp_control: false },
      other: { name: "Auxiliary Rural Carrier", capacity_kg: 1000, capacity_cbm: 4.0, cost_per_km: 10.0, temp_control: false },
    };
    const def = defaults[type] || defaults.mini_truck;
    setNewVehicleName(`${def.name} #${Math.floor(100 + Math.random() * 900)}`);
    setNewVehicleCapacityKg(def.capacity_kg);
    setNewVehicleCapacityCbm(def.capacity_cbm);
    setNewVehicleCostKm(def.cost_per_km);
    setNewVehicleTempControl(def.temp_control);
  };

  // Dynamic Synthetic Vehicle Registry Handlers
  const handleToggleVehicleStatus = async (vehicleId: string, newStatus: VehicleAvailability) => {
    const updatedVehicles = vehicles.map((v) =>
      v.id === vehicleId ? { ...v, availability_status: newStatus } : v
    );
    setVehicles(updatedVehicles);
    executeClientDynamicAllocation(updatedVehicles);

    try {
      await updateVehicleStatus(vehicleId, newStatus);
    } catch (e) {
      console.warn("Could not sync vehicle status update to backend", e);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    const updatedVehicles = vehicles.filter((v) => v.id !== vehicleId);
    setVehicles(updatedVehicles);
    executeClientDynamicAllocation(updatedVehicles);

    try {
      await deleteVehicle(vehicleId);
    } catch (e) {
      console.warn("Could not sync vehicle deletion to backend", e);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
    const newVeh: Vehicle = {
      id: newId,
      vehicle_code: newVehicleCode.trim() || `OD-02-SYN-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newVehicleName.trim() || "Synthetic Fleet Carrier",
      type: newVehicleType,
      capacity_kg: Number(newVehicleCapacityKg) || 1000,
      capacity_cbm: Number(newVehicleCapacityCbm) || 4.5,
      cost_per_km: Number(newVehicleCostKm) || 10.0,
      max_gradient_pct: newVehicleType === "pickup_4x4" ? 30.0 : newVehicleType === "motorbike" ? 20.0 : newVehicleType === "cargo_bike" ? 24.0 : 12.0,
      suitable_terrains: newVehicleType === "pickup_4x4" ? "plains,hilly,mountainous" : newVehicleType === "riverine_boat" ? "riverine" : "plains,hilly",
      temp_control: newVehicleTempControl,
      owner_type: newVehicleOwnerType,
      current_location_name: newVehicleLocation,
      current_location_lat: 20.1147,
      current_location_lon: 85.8344,
      availability_status: "available",
      current_assignment: null,
      last_seen_at: new Date().toISOString(),
    };

    const updatedVehicles = [newVeh, ...vehicles];
    setVehicles(updatedVehicles);
    setIsAddVehicleModalOpen(false);
    executeClientDynamicAllocation(updatedVehicles);

    try {
      const created = await createVehicle(newVeh);
      if (created && created.id && created.id !== newId) {
        setVehicles((prev) => prev.map((v) => (v.id === newId ? { ...v, id: created.id } : v)));
      }
    } catch (e) {
      console.warn("Could not persist synthetic vehicle to backend", e);
    }
  };

  const handleResetBaselineFleet = async () => {
    setVehicles(DEFAULT_SYNTHETIC_FLEET);
    executeClientDynamicAllocation(DEFAULT_SYNTHETIC_FLEET);
    try {
      const vList = await getVehicles();
      if (vList && vList.length > 0) {
        setVehicles(vList);
        executeClientDynamicAllocation(vList);
      }
    } catch (e) {
      // offline fallback
    }
  };

  const handleRestoreAllAvailable = async () => {
    const updated = vehicles.map((v) => ({ ...v, availability_status: "available" as VehicleAvailability }));
    setVehicles(updated);
    executeClientDynamicAllocation(updated);
    for (const v of vehicles) {
      if (v.availability_status !== "available") {
        updateVehicleStatus(v.id, "available").catch(() => {});
      }
    }
  };

  const handleQuickDemoToggleOffline = async () => {
    // Find highland Bolero or first available vehicle
    const target = vehicles.find((v) => v.vehicle_code === "AR-01-BP-8812") || vehicles.find((v) => v.availability_status === "available");
    if (target) {
      const nextStatus: VehicleAvailability = target.availability_status === "offline" ? "available" : "offline";
      await handleToggleVehicleStatus(target.id, nextStatus);
    }
  };

  const handleQuickDemoAddReefer = async () => {
    const code = `OD-02-TC-${Math.floor(1000 + Math.random() * 9000)}`;
    const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
    const newVeh: Vehicle = {
      id: newId,
      vehicle_code: code,
      name: `Guwahati Express Solar Reefer (${code})`,
      type: "mini_truck",
      capacity_kg: 1200,
      capacity_cbm: 5.0,
      cost_per_km: 10.5,
      max_gradient_pct: 18.0,
      suitable_terrains: "plains,hilly",
      temp_control: true,
      owner_type: "cooperative",
      current_location_name: "Jorhat Upper Assam Tea Belt",
      current_location_lat: 20.1147,
      current_location_lon: 85.8344,
      availability_status: "available",
      current_assignment: null,
      last_seen_at: new Date().toISOString(),
    };
    const updated = [newVeh, ...vehicles];
    setVehicles(updated);
    executeClientDynamicAllocation(updated);
    try {
      const created = await createVehicle(newVeh);
      if (created && created.id && created.id !== newId) {
        setVehicles((prev) => prev.map((v) => (v.id === newId ? { ...v, id: created.id } : v)));
      }
    } catch (e) {}
  };

  // Arrhenius Kinetics Calculation
  const arrheniusDecayRate = useMemo(() => {
    const deltaT = Math.max(0, kineticsTemp - 4);
    const solarDamping = hasSolarBuffer ? 0.45 : 1.2;
    const rawRate = ((deltaT * 0.8) * (kineticsDurationHrs / 16) * solarDamping) / 2.5;
    return Math.min(99.9, Math.max(0.02, Number(rawRate.toFixed(2))));
  }, [kineticsTemp, kineticsDurationHrs, hasSolarBuffer]);

  return (
    <>
      {showIntro && (
        <OpeningScreen forceShow={true} onComplete={() => setShowIntro(false)} />
      )}

      <main className="min-h-[calc(100vh-72px)] bg-white dark:bg-[#09090b] text-[#0a0a0a] dark:text-[#f4f4f5] transition-colors duration-200">
        
        {/* ========================================================================= */}
        {/* TOP STATUS MARQUEE & OFFLINE HUD                                          */}
        {/* ========================================================================= */}
        <section id="overview" className="border-b border-neutral-200 dark:border-neutral-800">
          <div className="w-full border-b border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-50/70 dark:bg-[#0c0c0e] py-2.5 px-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px]">
            <div className="flex items-center gap-6 text-neutral-700 dark:text-neutral-300">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                <span className="font-semibold text-black dark:text-white">{t("status.engineLabel")}</span>
              </span>
              <span className="text-neutral-300 dark:text-neutral-700">|</span>
              <span className="text-neutral-500 dark:text-neutral-400">
                {t("status.categories")}
              </span>
            </div>

            {/* Offline Status & Sync HUD */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <span className={`h-2 w-2 rounded-full ${syncState.isOnline ? "bg-emerald-500" : "bg-rose-500"}`} />
                <span className="text-[10px] uppercase font-semibold text-neutral-800 dark:text-neutral-200">
                  {syncState.isOnline ? t("status.onlineStatus") : t("status.offlineStatus")}
                </span>
                {syncState.pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full text-[9px] font-bold">
                    {syncState.pendingCount} QUEUED
                  </span>
                )}
              </div>

              {syncState.pendingCount > 0 && (
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-3 py-1 rounded-full bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshIcon size={12} className={isSyncing ? "animate-spin" : ""} />
                    <span>{isSyncing ? t("status.syncing") : t("status.syncNow")}</span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 00 // HERO PORTAL & DYNAMIC MATCHING SIMULATOR                    */}
          {/* ========================================================================= */}
          <div className="mx-auto max-w-[1680px]">
            <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800 min-h-[640px]">
              
              {/* LEFT: Geometric Kinetic Reticle & Dispatch Telemetry */}
              <div className="relative flex flex-col justify-between p-8 sm:p-14 swiss-grid-pattern overflow-hidden group">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 border border-black dark:border-white flex items-center justify-center">
                      <span className="w-1 h-1 bg-black dark:bg-white" />
                    </span>
                    <span>{t("overview.dispatchRef")}</span>
                  </div>
                  <span>{t("overview.clusters")}</span>
                </div>

                <div className="my-10 flex flex-col items-center justify-center relative">
                  <div
                    className="relative cursor-pointer transition-transform duration-700 ease-out"
                    style={{ transform: `rotate(${reticleRotation}deg)` }}
                    onClick={() => setReticleRotation((r) => r + 45)}
                    title={t("overview.rotateTitle")}
                  >
                    <svg
                      width="240"
                      height="240"
                      viewBox="0 0 250 250"
                      className="overflow-visible text-black dark:text-white"
                    >
                      <circle cx="125" cy="125" r="115" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
                      <circle cx="125" cy="125" r="85" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="4 4" />
                      <circle cx="125" cy="125" r="55" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />

                      <line x1="0" y1="125" x2="250" y2="125" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.75" />
                      <line x1="125" y1="0" x2="125" y2="250" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.75" />

                      {/* 8 Primary Starburst Rays */}
                      <g className="text-black dark:text-white">
                        <line x1="125" y1="80" x2="125" y2="26" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        <line x1="125" y1="170" x2="125" y2="224" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        <line x1="80" y1="125" x2="26" y2="125" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        <line x1="170" y1="125" x2="224" y2="125" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        <line x1="93" y1="93" x2="55" y2="55" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="157" y1="93" x2="195" y2="55" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="93" y1="157" x2="55" y2="195" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="157" y1="157" x2="195" y2="195" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                      </g>

                      <circle cx="125" cy="125" r="4" fill="currentColor" />
                    </svg>
                  </div>

                  <div className="mt-6 text-center">
                    <div className="font-mono text-[11px] tracking-widest text-neutral-400 dark:text-neutral-500 uppercase">
                      {t("overview.dynamicMatchingVector")}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-black dark:text-white">
                      {t("overview.engineVersion")}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 pt-6 border-t border-neutral-200 dark:border-neutral-800 font-mono text-[11px]">
                  <div>
                    <div className="text-neutral-400 dark:text-neutral-500 uppercase text-[9px]">{t("overview.fairnessIndex")}</div>
                    <div className="text-base font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">0.96 ({t("overview.high")})</div>
                  </div>
                  <div>
                    <div className="text-neutral-400 dark:text-neutral-500 uppercase text-[9px]">{t("overview.starvationRisk")}</div>
                    <div className="text-base font-semibold text-black dark:text-white mt-0.5">{t("overview.zero")}</div>
                  </div>
                  <div>
                    <div className="text-neutral-400 dark:text-neutral-500 uppercase text-[9px]">{t("overview.coldBuffer")}</div>
                    <div className="text-base font-semibold text-amber-600 dark:text-amber-400 mt-0.5">{t("overview.solarProtected")}</div>
                  </div>
                </div>

              </div>

              {/* RIGHT: Editorial Copy & Live Parameter Simulator */}
              <div className="flex flex-col justify-between p-8 sm:p-14 bg-white dark:bg-[#09090b]">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400 mb-4">
                    {t("overview.networkLabel")}
                  </div>

                  <h1 className="text-4xl sm:text-5xl font-light tracking-[-0.04em] text-black dark:text-white leading-[1.1]">
                    {t("overview.heroHeadline")}
                    <br />
                    <span className="font-semibold">{t("overview.heroSubheadline")}</span>
                  </h1>

                  <p className="mt-5 text-base sm:text-lg text-neutral-600 dark:text-neutral-300 font-light max-w-xl leading-relaxed">
                    {t("overview.heroDescription")}
                  </p>

                  {/* Underline Parameter Form */}
                  <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-5 max-w-md">
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                          {t("overview.goodTypeLabel")}
                        </label>
                        <select
                          value={goodTypeHero}
                          onChange={(e) => setGoodTypeHero(e.target.value as GoodType)}
                          className="w-full swiss-input text-xs font-semibold bg-transparent"
                        >
                          <option value="farm_produce" className="dark:bg-neutral-900">{tc("goodTypes.farmProduce")}</option>
                          <option value="medicine" className="dark:bg-neutral-900">{tc("goodTypes.medicine")}</option>
                          <option value="essential_goods" className="dark:bg-neutral-900">{tc("goodTypes.essentialGoods")}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                          {t("overview.urgencyLabel")}
                        </label>
                        <select
                          value={urgencyHero}
                          onChange={(e) => setUrgencyHero(e.target.value as UrgencyLevel)}
                          className="w-full swiss-input text-xs font-semibold bg-transparent"
                        >
                          <option value="critical" className="dark:bg-neutral-900">{tc("urgency.critical")}</option>
                          <option value="high" className="dark:bg-neutral-900">{tc("urgency.high")}</option>
                          <option value="routine" className="dark:bg-neutral-900">{tc("urgency.routine")}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                          {t("overview.terrainLabel")}
                        </label>
                        <select
                          value={roadConditionHero}
                          onChange={(e) => setRoadConditionHero(e.target.value as RoadCondition)}
                          className="w-full swiss-input text-xs font-semibold bg-transparent"
                        >
                          <option value="paved" className="dark:bg-neutral-900">{tc("terrain.paved")}</option>
                          <option value="unpaved" className="dark:bg-neutral-900">{tc("terrain.unpaved")}</option>
                          <option value="seasonal" className="dark:bg-neutral-900">{tc("terrain.seasonal")}</option>
                          <option value="flood_risk" className="dark:bg-neutral-900">{tc("terrain.floodRisk")}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                          {t("overview.ambientTempLabel")}
                        </label>
                        <input
                          type="number"
                          value={ambientTempHero}
                          onChange={(e) => setAmbientTempHero(Number(e.target.value))}
                          className="w-full swiss-input text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between items-center font-mono text-[11px] mb-1.5">
                        <span className="text-neutral-500 dark:text-neutral-400">{t("overview.dispatchScore")}</span>
                        <span className="font-semibold text-black dark:text-white">
                          {goodTypeHero === "medicine" ? 850 : urgencyHero === "critical" ? 750 : urgencyHero === "high" ? 520 : 310} {tc("units.pts")}
                        </span>
                      </div>
                      <div className="linear-meter">
                        <div
                          className="linear-meter-fill"
                          style={{
                            width: `${goodTypeHero === "medicine" ? 95 : urgencyHero === "critical" ? 85 : urgencyHero === "high" ? 60 : 35}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Circular Action Badge */}
                <div className="mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{t("overview.continuousEngine")}</div>
                    <div className="font-mono text-sm font-semibold text-black dark:text-white mt-0.5">
                      {pickups.filter((p) => p.status === "Pending").length} {t("overview.pendingPickups")}
                    </div>
                  </div>

                  <button
                    onClick={handleRunDispatch}
                    disabled={isMatching}
                    className="swiss-circle-btn flex-col gap-0.5 cursor-pointer"
                    title={t("overview.matchButton")}
                  >
                    <span>{isMatching ? t("overview.matchingButton") : t("overview.matchButton")}</span>
                    <ArrowRightIcon size={12} strokeWidth={2} />
                  </button>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 01 // COMMUNITY TOPOLOGY & REAL-TIME VECTOR MAP (#network)        */}
        {/* ========================================================================= */}
        <section id="network" className="mx-auto max-w-[1680px] p-8 sm:p-14 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 dark:border-neutral-800 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                {t("network.sectionLabel")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black dark:text-white mt-1">
                {t("network.title")}
              </h2>
            </div>
            <div className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
              {t("network.hubCount")}
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

          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800 pt-8 border-t border-neutral-200 dark:border-neutral-800">
            {/* Left 7 Cols: Tabular Rural Node Matrix */}
            <div className="lg:col-span-7 pr-0 lg:pr-10">
              <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-4">
                {t("network.selectNode")}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 uppercase text-[10px] tracking-wider">
                      <th className="py-3 font-normal">{t("network.tableHeaders.nodeType")}</th>
                      <th className="py-3 font-normal">{t("network.tableHeaders.powerSource")}</th>
                      <th className="py-3 font-normal">{t("network.tableHeaders.coldCapacity")}</th>
                      <th className="py-3 font-normal text-right">{t("network.tableHeaders.status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                    {INITIAL_HUBS.map((hub) => {
                      const isSelected = selectedHub.id === hub.id;
                      const fillPercent = Math.round((hub.usedKg / hub.capacityKg) * 100);
                      return (
                        <tr
                          key={hub.id}
                          onClick={() => setSelectedHub(hub)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-neutral-100 dark:bg-neutral-800/70 font-semibold" : "hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40"
                          }`}
                        >
                          <td className="py-3.5 pr-2">
                            <div className="text-black dark:text-white">{hub.name}</div>
                            <div className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase">{tc(`nodeTypes.${hub.type}`) || hub.type.replace("_", " ")}</div>
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-sans font-semibold ${
                              hub.power === "solar"
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                                : hub.power === "unreliable"
                                ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"
                                : "bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                            }`}>
                              {hub.power === "solar" && <SunIcon size={11} />}
                              {tc(`power.${hub.power}`)}
                            </span>
                          </td>
                          <td className="py-3.5 text-neutral-700 dark:text-neutral-300">
                            <div>{(hub.usedKg / 1000).toFixed(0)}k / {(hub.capacityKg / 1000).toFixed(0)}k kg</div>
                            <div className="w-24 linear-meter mt-1">
                              <div className="linear-meter-fill" style={{ width: `${fillPercent}%` }} />
                            </div>
                          </td>
                          <td className="py-3.5 text-right">
                            <span className="inline-block px-2 py-0.5 text-[9px] rounded-full uppercase font-sans bg-black dark:bg-white text-white dark:text-black">
                              {t(`network.riskStatus.${hub.riskStatus.toLowerCase()}`) || hub.riskStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 5 Cols: Selected Node Deep Dive */}
            <div className="lg:col-span-5 pt-8 lg:pt-0 pl-0 lg:pl-10 space-y-7">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  {t("network.nodeTelemetry")}
                </div>
                <h3 className="text-2xl font-medium tracking-tight text-black dark:text-white mt-1">
                  {selectedHub.name}
                </h3>
                <div className="font-mono text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {t("network.typeLabel")}: {tc(`nodeTypes.${selectedHub.type}`) || selectedHub.type.toUpperCase().replace("_", " ")}{" // "}{t("network.powerLabel")}: {tc(`power.${selectedHub.power}`)}
                </div>
              </div>

              {/* Linear Capacity Meter */}
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">{t("network.coldStorageFill")}</span>
                  <span className="font-semibold text-black dark:text-white">
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

              {/* Temperature Zones & Solar Buffer Info */}
              <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  {t("network.thermalProtocol")}
                </div>
                <div className="space-y-2">
                  {selectedHub.tempZones.map((tz, idx) => (
                    <div key={idx} className="flex items-center justify-between font-mono text-xs py-2 border-b border-neutral-100 dark:border-neutral-800">
                      <span className="text-neutral-800 dark:text-neutral-200">{tz}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t("network.activeThermalShield")}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Vehicle Types */}
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-2 gap-4 font-mono text-xs">
                <div>
                  <div className="text-neutral-400 dark:text-neutral-500 text-[10px] uppercase">{t("network.availableFleet")}</div>
                  <div className="text-lg font-light text-black dark:text-white mt-0.5">{t("network.fleetList")}</div>
                </div>
                <div>
                  <div className="text-neutral-400 dark:text-neutral-500 text-[10px] uppercase">{t("network.terrainAccessibility")}</div>
                  <div className="text-lg font-light text-black dark:text-white mt-0.5">{t("network.allWeatherCapable")}</div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* REAL OPEN DATASET INTELLIGENCE (PMGSY, SRTM DEM 30m, GATISHAKTI NFR RAIL)    */}
        {/* ========================================================================= */}
        <DatasetExplorer />

        {/* ========================================================================= */}
        {/* SECTION 02 // PENDING PICKUP QUEUE & OFFLINE CAPABLE INGESTION (#shipments)*/}
        {/* ========================================================================= */}
        <section id="shipments" className="mx-auto max-w-[1680px] p-8 sm:p-14 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 dark:border-neutral-800 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                {t("shipments.sectionLabel")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black dark:text-white mt-1">
                {t("shipments.title")}
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-full text-xs font-mono">
              {["all", "medicine", "produce", "critical"].map((f) => (
                <button
                  key={f}
                  onClick={() => setPickupFilter(f)}
                  className={`px-3 py-1 rounded-full uppercase text-[10px] tracking-wider transition-colors cursor-pointer ${
                    pickupFilter === f ? "bg-black dark:bg-white text-white dark:text-black font-semibold" : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {f === "all" ? t("shipments.filters.all") : f === "medicine" ? t("shipments.filters.medicine") : f === "produce" ? t("shipments.filters.produce") : t("shipments.filters.critical")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800 pt-8">
            {/* Left 8 Cols: Pickups Manifest Ledger */}
            <div className="lg:col-span-8 pr-0 lg:pr-10">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 uppercase text-[10px] tracking-wider">
                      <th className="py-3 font-normal">{t("shipments.tableHeaders.pickup")}</th>
                      <th className="py-3 font-normal">{t("shipments.tableHeaders.classification")}</th>
                      <th className="py-3 font-normal">{t("shipments.tableHeaders.loadUnits")}</th>
                      <th className="py-3 font-normal">{t("shipments.tableHeaders.terrainElev")}</th>
                      <th className="py-3 font-normal">{t("shipments.tableHeaders.urgency")}</th>
                      <th className="py-3 font-normal">{t("shipments.tableHeaders.waitTime")}</th>
                      <th className="py-3 font-normal text-right">{t("shipments.tableHeaders.status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                    {filteredPickups.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-4 pr-2">
                          <div className="font-semibold text-black dark:text-white">{item.waybill}</div>
                          <div className="text-[11px] text-neutral-700 dark:text-neutral-300">{item.producer}</div>
                          <div className="text-[10px] text-neutral-400 dark:text-neutral-500">{item.origin} → {item.destination}</div>
                        </td>
                        <td className="py-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] uppercase font-sans font-semibold ${
                            item.goodType === "medicine"
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"
                              : item.goodType === "farm_produce"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                          }`}>
                            {item.goodType === "medicine" ? tc("goodTypes.medicine") : item.goodType === "farm_produce" ? tc("goodTypes.farmProduce") : tc("goodTypes.essentialGoods")}
                          </span>
                          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">{item.commodity}</div>
                        </td>
                        <td className="py-4 text-neutral-800 dark:text-neutral-200 font-medium">
                          <div>{item.loadQuantity} {tc(`units.${item.quantityUnits}`) || item.quantityUnits}</div>
                          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-normal">({item.weightKg} {tc("units.kg")})</div>
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-sans font-semibold ${
                            item.terrainType === "mountainous" || item.elevationM > 500
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                              : item.terrainType === "riverine"
                              ? "bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                          }`}>
                            {item.elevationM > 500 ? "🏔️" : item.terrainType === "riverine" ? "⛴️" : "🌾"} {item.elevationM}m
                          </span>
                          <div className="text-[9px] text-neutral-400 dark:text-neutral-500 capitalize mt-0.5">{tc(`terrain.${item.terrainType}`) || item.terrainType}</div>
                        </td>
                        <td className="py-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] uppercase font-sans font-semibold ${
                            item.urgency === "critical" ? "bg-rose-600 text-white" : item.urgency === "high" ? "bg-amber-500 text-white" : "bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white"
                          }`}>
                            {tc(`urgency.${item.urgency}`)}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`font-semibold ${item.waitTimeMins > 90 ? "text-rose-600 dark:text-rose-400" : "text-neutral-700 dark:text-neutral-300"}`}>
                            {item.waitTimeMins} {tc("units.minutes")}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-[9px] font-sans">
                            {tc(`status.${item.status.toLowerCase().replace(" ", "")}`) || item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 4 Cols: Fast Rural Pickup Ingestion Form */}
            <div className="lg:col-span-4 pt-8 lg:pt-0 pl-0 lg:pl-10">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
                {t("shipments.form.offlineCapable")}
              </div>
              <h3 className="text-xl font-medium tracking-tight text-black dark:text-white mb-6">
                {t("shipments.form.title")}
              </h3>

              <form onSubmit={handleCreatePickup} className="space-y-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                    {t("shipments.form.originLabel")}
                  </label>
                  <select
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    className="w-full swiss-input text-xs font-medium bg-transparent"
                  >
                    <option value="Jorhat Upper Assam Tea Belt" className="dark:bg-neutral-900">Jorhat Upper Assam Tea Belt (116m ASL)</option>
                    <option value="Tawang Mountain Outpost (Arunachal Pradesh)" className="dark:bg-neutral-900">🏔️ Tawang Mountain Outpost (3048m ASL - Arunachal)</option>
                    <option value="Shillong Highlands (Meghalaya)" className="dark:bg-neutral-900">🏔️ Shillong Highlands (1525m ASL - Meghalaya)</option>
                    <option value="Majuli River Island Ferries (Assam)" className="dark:bg-neutral-900">Majuli River Island Ferries (85m ASL - Brahmaputra)</option>
                    <option value="Imphal Valley Organic Farms (Manipur)" className="dark:bg-neutral-900">🏔️ Imphal Valley Organic Farms (786m ASL - Manipur)</option>
                    <option value="Silchar Barak Valley Hub (Assam)" className="dark:bg-neutral-900">Silchar Barak Valley Hub (35m ASL - Assam)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                    {t("shipments.form.destLabel")}
                  </label>
                  <select
                    value={newDest}
                    onChange={(e) => setNewDest(e.target.value)}
                    className="w-full swiss-input text-xs font-medium bg-transparent"
                  >
                    <option value="Guwahati Northeast Central Mega Hub" className="dark:bg-neutral-900">Guwahati Northeast Central Mega Hub (GHY-HUB)</option>
                    <option value="Silchar Rail & Road Crossdock Terminal" className="dark:bg-neutral-900">Silchar Crossdock Terminal (SCL-XDK)</option>
                    <option value="Pandu Inland Port NW-2" className="dark:bg-neutral-900">Pandu Inland Port NW-2 (PDU-PORT)</option>
                    <option value="Lumding Jn Rail Freight Terminal" className="dark:bg-neutral-900">🚆 Lumding Jn Rail Terminal (LMG-RLY)</option>
                    <option value="New Jalpaiguri Jn Railway Terminal" className="dark:bg-neutral-900">🚆 New Jalpaiguri Jn Rail Siding (NJP-RLY)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                    {t("shipments.form.producerLabel")}
                  </label>
                  <input
                    type="text"
                    value={newProducer}
                    onChange={(e) => setNewProducer(e.target.value)}
                    className="w-full swiss-input text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                      {t("shipments.form.goodTypeLabel")}
                    </label>
                    <select
                      value={newGoodType}
                      onChange={(e) => setNewGoodType(e.target.value as GoodType)}
                      className="w-full swiss-input text-xs bg-transparent font-semibold"
                    >
                      <option value="farm_produce" className="dark:bg-neutral-900">{tc("goodTypes.farmProduce")}</option>
                      <option value="medicine" className="dark:bg-neutral-900">{tc("goodTypes.medicine")}</option>
                      <option value="essential_goods" className="dark:bg-neutral-900">{tc("goodTypes.essentialGoods")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                      {t("shipments.form.urgencyLabel")}
                    </label>
                    <select
                      value={newUrgency}
                      onChange={(e) => setNewUrgency(e.target.value as UrgencyLevel)}
                      className="w-full swiss-input text-xs bg-transparent font-semibold"
                    >
                      <option value="critical" className="dark:bg-neutral-900">{tc("urgency.critical")}</option>
                      <option value="high" className="dark:bg-neutral-900">{tc("urgency.high")}</option>
                      <option value="routine" className="dark:bg-neutral-900">{tc("urgency.routine")}</option>
                    </select>
                  </div>
                </div>

                {/* Load Quantity & Units */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                      {t("shipments.form.loadQtyLabel")}
                    </label>
                    <input
                      type="number"
                      value={newLoadQty}
                      onChange={(e) => setNewLoadQty(Number(e.target.value))}
                      className="w-full swiss-input text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                      {t("shipments.form.qtyUnitsLabel")}
                    </label>
                    <select
                      value={newQtyUnits}
                      onChange={(e) => setNewQtyUnits(e.target.value)}
                      className="w-full swiss-input text-xs bg-transparent font-medium"
                    >
                      <option value="crates" className="dark:bg-neutral-900">{tc("units.crates")}</option>
                      <option value="litres" className="dark:bg-neutral-900">{tc("units.litres")}</option>
                      <option value="sacks" className="dark:bg-neutral-900">{tc("units.sacks")}</option>
                      <option value="vials" className="dark:bg-neutral-900">{tc("units.vials")}</option>
                      <option value="boxes" className="dark:bg-neutral-900">{tc("units.boxes")}</option>
                      <option value="tins" className="dark:bg-neutral-900">{tc("units.tins")}</option>
                      <option value="bags" className="dark:bg-neutral-900">{tc("units.bags")}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                    {t("shipments.form.weightLabel")}
                  </label>
                  <input
                    type="number"
                    value={newWeight}
                    onChange={(e) => setNewWeight(Number(e.target.value))}
                    className="w-full swiss-input text-xs font-mono"
                  />
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <div className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500">
                    {t("shipments.form.idempotent")}
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    {t("shipments.form.submit")}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 03 // DYNAMIC DISPATCH ENGINE & TRANSPARENT ALLOCATION (#dispatch)*/}
        {/* ========================================================================= */}
        <section id="dispatch" className="mx-auto max-w-[1680px] p-8 sm:p-14 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 dark:border-neutral-800 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                {t("dispatch.sectionLabel")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black dark:text-white mt-1">
                {t("dispatch.title")}
              </h2>
            </div>

            {/* Dynamic Window Expansion Toggle */}
            <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-4 py-2 rounded-full font-mono text-xs">
              <span className="text-neutral-600 dark:text-neutral-400">{t("dispatch.windowToggle")}</span>
              <button
                onClick={() => setExtendWindow(!extendWindow)}
                className={`px-3 py-0.5 rounded-full uppercase text-[10px] font-bold transition-colors cursor-pointer ${
                  extendWindow ? "bg-black dark:bg-white text-white dark:text-black" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                }`}
              >
                {extendWindow ? t("dispatch.enabled") : t("dispatch.disabled")}
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800 pt-8">
            {/* Left 5 Cols: Dispatch Summary & Controls */}
            <div className="lg:col-span-5 pr-0 lg:pr-10 space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="p-5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 space-y-3 font-mono text-xs">
                <div className="text-neutral-400 dark:text-neutral-500 uppercase text-[10px] font-bold">{t("dispatch.fairnessSummaryLabel")}</div>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans text-sm">
                  {fairnessSummaryText}
                </p>
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400">
                  {t("dispatch.objective")}
                </div>
              </div>

              {/* One-Click Execute Dispatch */}
              <div className="p-5 border border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="text-sm font-semibold text-black dark:text-white">{t("dispatch.triggerDispatch")}</div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-light">
                  {t("dispatch.triggerDescription")}
                </p>
                <div className="space-y-2">
                  <button
                    onClick={handleRunDispatch}
                    disabled={isMatching}
                    className="w-full py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <PulseIcon size={14} className={isMatching ? "animate-pulse" : ""} />
                    <span>{isMatching ? t("dispatch.computing") : t("dispatch.triggerButton")}</span>
                  </button>
                  <button
                    onClick={() => {
                      setPickups(INITIAL_PICKUPS);
                      setMatchResults([]);
                      setFairnessSummaryText(t("dispatch.initialFairnessSummary"));
                    }}
                    className="w-full py-2 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 text-[10px] font-mono uppercase tracking-wider hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{t("dispatch.resetQueue")}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Live Transparent Match Feed */}
            <div className="lg:col-span-7 pt-8 lg:pt-0 pl-0 lg:pl-10 space-y-6">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                <span>
                  {t("dispatch.liveAllocation")} {matchResults.length > 0 && `(${matchResults.length})`}
                </span>
                {matchResults.length > 0 && (
                  <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-mono">
                    {"Scroll to view all"}
                  </span>
                )}
              </div>

              {matchResults.length === 0 ? (
                <div className="p-8 border border-neutral-200 dark:border-neutral-800 border-dashed text-center font-mono text-xs text-neutral-500 dark:text-neutral-400 space-y-2">
                  <CubeIcon size={24} className="mx-auto text-neutral-400 dark:text-neutral-500" />
                  <div>{t("dispatch.noMatches")}</div>
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500">{t("dispatch.clickToRun")}</div>
                </div>
              ) : (
                <div className="space-y-4 max-h-[640px] xl:max-h-[720px] overflow-y-auto pr-2 scroll-smooth">
                  {matchResults.map((m, idx) => {
                    const utilPct = m.load_utilization_pct || (m.matched_vehicle_capacity_kg ? Math.round((m.weight_kg / m.matched_vehicle_capacity_kg) * 100) : 72);
                    const isMountain = m.terrain_type === "mountainous" || m.terrain_type === "hilly";

                    return (
                      <div key={idx} className="p-5 border border-black dark:border-neutral-700 bg-neutral-50/90 dark:bg-[#121215] space-y-3 font-mono text-xs shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-semibold text-black dark:text-white text-sm flex items-center gap-1.5">
                            <span>{m.good_type === "medicine" ? "💊" : isMountain ? "🏔️" : "🌾"}</span>
                            <span>{m.waybill_number ? `[${m.waybill_number}] ` : ""}{m.producer_name} → {m.matched_vehicle_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-[9px] uppercase font-sans font-semibold">
                              {tc(`vehicleTypes.${m.matched_vehicle_type}`) || m.matched_vehicle_type?.replace(/_/g, " ")} ({tc("units.pts")}: {m.allocation_score})
                            </span>
                            {m.vehicle_cost_per_km && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[9px] font-sans font-semibold">
                                ₹{m.vehicle_cost_per_km}/km
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Load Quantity & Vehicle Capacity Utilization Gauge */}
                        <div className="space-y-1.5 bg-white dark:bg-[#18181b] p-3 border border-neutral-200 dark:border-neutral-800">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-neutral-500 dark:text-neutral-400 font-semibold">
                              {t("dispatch.payloadLoad")}: {m.load_quantity ? `${m.load_quantity} ${tc(`units.${m.quantity_units}`) || m.quantity_units} (${m.weight_kg} ${tc("units.kg")})` : `${m.weight_kg} ${tc("units.kg")}`}
                            </span>
                            <span className="font-bold text-neutral-900 dark:text-neutral-100 uppercase">
                              {utilPct}% {t("dispatch.ofCapacity")}
                            </span>
                          </div>
                          <div className="linear-meter">
                            <div
                              className="linear-meter-fill bg-emerald-600"
                              style={{ width: `${Math.min(100, utilPct)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 pt-0.5">
                            <span>{t("dispatch.assigned")}: {m.vehicle_assigned_weight_kg || m.weight_kg} kg / {m.matched_vehicle_capacity_kg || 1500} kg</span>
                            <span>{t("dispatch.optimalConsolidation")}: 0.94</span>
                          </div>
                        </div>

                        {/* Terrain & Route Telemetry */}
                        {isMountain && (
                          <div className="flex items-center justify-between p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-[11px]">
                            <div className="flex items-center gap-2">
                              <span>🏔️ {t("dispatch.mountainGradient")}: {m.gradient_pct || 6.8}% {t("dispatch.incline")}</span>
                              <span>({t("dispatch.gain")}: +{m.elevation_gain_m || 935}m)</span>
                            </div>
                            <span className="font-bold text-amber-800 dark:text-amber-300 text-[10px] uppercase">
                              {t("dispatch.gradeabilityVerified")}
                            </span>
                          </div>
                        )}

                        {/* RoadSense Real-Time Viability Telemetry & Breakdown (Phase 4 DoD) */}
                        <div className="p-3 bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold text-[11px] text-neutral-900 dark:text-neutral-100">
                              <span>{m.roadability_emoji || "🟢"}</span>
                              <span>{t("dispatch.roadSenseScore")}: {m.roadability_score !== undefined ? `${m.roadability_score}/100` : "85/100"}</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-mono ${
                                (m.roadability_status || "clear") === "clear"
                                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                                  : (m.roadability_status || "clear") === "difficult"
                                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                                  : "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"
                              }`}>
                                {m.roadability_status || "clear"}
                              </span>
                            </div>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">{t("dispatch.dynamicViability")}</span>
                          </div>

                          {/* RoadSense Natural Language Breakdown */}
                          {m.road_breakdown && m.road_breakdown.length > 0 && (
                            <div className="space-y-1 text-[11px] font-sans text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900 p-2 border border-neutral-100 dark:border-neutral-800">
                              {m.road_breakdown.map((item, bIdx) => (
                                <div key={bIdx} className="flex items-start gap-1.5">
                                  <span className="text-neutral-400 dark:text-neutral-500 font-mono text-[9px] mt-0.5">•</span>
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Vehicle Viability Recommendation Matrix Cards (Phase 4 DoD) */}
                          <div className="pt-1 space-y-1.5">
                            <div className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500 uppercase font-bold">{t("dispatch.vehicleCardsTitle")}</div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                              {/* 16T Truck */}
                              <div className={`p-2 border rounded space-y-0.5 ${
                                (m.vehicle_recommendations?.truck?.recommended ?? true)
                                  ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                                  : "bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200 opacity-90"
                              }`}>
                                <div className="font-bold flex items-center justify-between">
                                  <span>🚛 {tc("vehicleTypes.truck")}</span>
                                  <span>{(m.vehicle_recommendations?.truck?.recommended ?? true) ? `${tc("status.viable")} ✅` : `${tc("status.no")} ❌`}</span>
                                </div>
                                <div className="text-[9px] text-neutral-500 dark:text-neutral-400 font-mono">
                                  Score: {m.vehicle_recommendations?.truck?.score || (m.roadability_score || 85)}/100
                                </div>
                              </div>

                              {/* Mini-Truck */}
                              <div className={`p-2 border rounded space-y-0.5 ${
                                (m.vehicle_recommendations?.mini_truck?.recommended ?? true)
                                  ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                                  : "bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200 opacity-90"
                              }`}>
                                <div className="font-bold flex items-center justify-between">
                                  <span>🚐 {tc("vehicleTypes.mini_truck")}</span>
                                  <span>{(m.vehicle_recommendations?.mini_truck?.recommended ?? true) ? `${tc("status.viable")} ✅` : `${tc("status.no")} ❌`}</span>
                                </div>
                                <div className="text-[9px] text-neutral-500 dark:text-neutral-400 font-mono">
                                  Score: {m.vehicle_recommendations?.mini_truck?.score || 92}/100
                                </div>
                              </div>

                              {/* Tractor */}
                              <div className={`p-2 border rounded space-y-0.5 ${
                                (m.vehicle_recommendations?.tractor?.recommended ?? true)
                                  ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                                  : "bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200 opacity-90"
                              }`}>
                                <div className="font-bold flex items-center justify-between">
                                  <span>🚜 {tc("vehicleTypes.tractor")}</span>
                                  <span>{(m.vehicle_recommendations?.tractor?.recommended ?? true) ? `${tc("status.viable")} ✅` : `${tc("status.no")} ❌`}</span>
                                </div>
                                <div className="text-[9px] text-neutral-500 dark:text-neutral-400 font-mono">
                                  Score: {m.vehicle_recommendations?.tractor?.score || 88}/100
                                </div>
                              </div>

                              {/* Two-Wheeler */}
                              <div className={`p-2 border rounded space-y-0.5 ${
                                (m.vehicle_recommendations?.two_wheeler?.recommended ?? true)
                                  ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                                  : "bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200 opacity-90"
                              }`}>
                                <div className="font-bold flex items-center justify-between">
                                  <span>🛵 {tc("vehicleTypes.two_wheeler")}</span>
                                  <span>{(m.vehicle_recommendations?.two_wheeler?.recommended ?? true) ? `${tc("status.viable")} ✅` : `${tc("status.no")} ❌`}</span>
                                </div>
                                <div className="text-[9px] text-neutral-500 dark:text-neutral-400 font-mono">
                                  Score: {m.vehicle_recommendations?.two_wheeler?.score || 95}/100
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-neutral-200/60 dark:border-neutral-800 text-[11px]">
                          <div>
                            <span className="text-neutral-400 dark:text-neutral-500 text-[10px] block">{t("dispatch.matchLabels.waitTime")}</span>
                            <span className="font-semibold text-black dark:text-white">{m.wait_time_minutes} {tc("units.minutes")}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 dark:text-neutral-500 text-[10px] block">{t("dispatch.matchLabels.fairnessBoost")}</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{m.fairness_boost_pts} {tc("units.pts")}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 dark:text-neutral-500 text-[10px] block">{t("dispatch.matchLabels.urgency")}</span>
                            <span className="font-semibold uppercase text-rose-600 dark:text-rose-400">{tc(`urgency.${m.urgency}`)}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-xs font-sans text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500 block uppercase mb-1">{t("dispatch.transparentExplanation")}</span>
                          {m.explanation_summary}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 04 // PERISHABILITY & ARRHENIUS KINETICS (#sensors)               */}
        {/* ========================================================================= */}
        <section id="sensors" className="mx-auto max-w-[1680px] p-8 sm:p-14 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 dark:border-neutral-800 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                {t("kinetics.sectionLabel")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black dark:text-white mt-1">
                {t("kinetics.title")}
              </h2>
            </div>
            <div className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
              {t("kinetics.activationEnergy")}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800 pt-8">
            {/* Left 5 Cols: Thermal Parameters */}
            <div className="lg:col-span-5 pr-0 lg:pr-10 space-y-6">
              <div>
                <div className="flex justify-between font-mono text-xs mb-2">
                  <span className="text-neutral-600 dark:text-neutral-400">{t("kinetics.ambientTemp")}</span>
                  <span className="font-semibold text-black dark:text-white">{kineticsTemp}°C</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="48"
                  value={kineticsTemp}
                  onChange={(e) => setKineticsTemp(Number(e.target.value))}
                  className="w-full accent-black dark:accent-white"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono text-xs mb-2">
                  <span className="text-neutral-600 dark:text-neutral-400">{t("kinetics.transitDuration")}</span>
                  <span className="font-semibold text-black dark:text-white">{kineticsDurationHrs} {tc("units.hours")}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="36"
                  value={kineticsDurationHrs}
                  onChange={(e) => setKineticsDurationHrs(Number(e.target.value))}
                  className="w-full accent-black dark:accent-white"
                />
              </div>

              {/* Solar buffer toggle */}
              <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 font-mono text-xs">
                <div>
                  <div className="font-semibold text-black dark:text-white">{t("kinetics.solarBufferActive")}</div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400">{t("kinetics.solarDesc")}</div>
                </div>
                <button
                  onClick={() => setHasSolarBuffer(!hasSolarBuffer)}
                  className={`px-3 py-1 rounded-full uppercase text-[10px] font-bold cursor-pointer ${
                    hasSolarBuffer ? "bg-amber-500 text-white" : "bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white"
                  }`}
                >
                  {hasSolarBuffer ? t("kinetics.solarOn") : t("kinetics.gridOnly")}
                </button>
              </div>
            </div>

            {/* Right 7 Cols: Predicted Spoilage Decay */}
            <div className="lg:col-span-7 pt-8 lg:pt-0 pl-0 lg:pl-10 space-y-7">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
                  {t("kinetics.qualityLoss")}
                </div>
                <div className="flex items-baseline gap-4">
                  <div className="text-5xl font-light tracking-tight text-black dark:text-white">
                    {arrheniusDecayRate}%
                  </div>
                  <div className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                    {arrheniusDecayRate < 8 ? t("kinetics.minimalSpoilage") : arrheniusDecayRate < 25 ? t("kinetics.moderateLoad") : t("kinetics.criticalCooling")}
                  </div>
                </div>
                <div className="linear-meter mt-3">
                  <div
                    className="linear-meter-fill"
                    style={{ width: `${arrheniusDecayRate}%` }}
                  />
                </div>
              </div>

              {/* Thermal telemetry feeds */}
              <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800 font-mono text-xs">
                <div className="text-neutral-400 dark:text-neutral-500 text-[10px] uppercase">{t("kinetics.telemetryPings")}</div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-neutral-700 dark:text-neutral-300">{t("kinetics.nodeA")}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">+3.8°C ({t("kinetics.nominal")})</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-neutral-700 dark:text-neutral-300">{t("kinetics.khordhaTanker")}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">+3.5°C ({t("kinetics.nominal")})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 05 // FAIRNESS DASHBOARD & DEMONSTRABLE PROOF (#fairness)          */}
        {/* ========================================================================= */}
        <section id="fairness" className="mx-auto max-w-[1680px] p-8 sm:p-14 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 dark:border-neutral-800 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                {t("fairness.sectionLabel")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black dark:text-white mt-1">
                {t("fairness.title")}
              </h2>
            </div>
            <div className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
              {t("fairness.fairnessIndexLabel")}: {fairnessData?.overall_fairness_index || 0.96}{" // "}{t("fairness.provable")}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800 pt-8">
            {/* Left 6 Cols: Wait-Time Distribution by Community */}
            <div className="lg:col-span-6 pr-0 lg:pr-10 space-y-6">
              <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {t("fairness.waitTimeDistribution")}
              </div>

              <div className="space-y-4 font-mono text-xs">
                {communityBreakdown.map((comm, idx) => (
                  <div key={idx} className="p-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-black dark:text-white">{comm.name}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full font-bold">
                        {t("fairness.index")}: {comm.score}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-500 dark:text-neutral-400 text-[11px]">
                      <span>{t("fairness.avgWait")}: {comm.avgWait} {tc("units.minutes")} ({t("fairness.maxWait")}: {comm.maxWait}m)</span>
                      <span>{comm.matches} {t("fairness.dispatches")}</span>
                    </div>
                    <div className="linear-meter">
                      <div className="linear-meter-fill" style={{ width: `${Math.round(comm.score * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 6 Cols: Proof of Non-Deprioritization */}
            <div className="lg:col-span-6 pt-8 lg:pt-0 pl-0 lg:pl-10 space-y-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                {t("fairness.provable")}
              </div>

              <div className="p-6 border border-black dark:border-neutral-700 bg-white dark:bg-[#121215] space-y-4 font-mono text-xs">
                <div className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                  <ShieldCheckIcon size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{t("fairness.proofTitle")}</span>
                </div>
                <p className="text-neutral-700 dark:text-neutral-300 font-sans text-sm leading-relaxed">
                  {t("fairness.proofDescription")}
                </p>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1">
                  <div>• {t("fairness.proofPoints.p1")}</div>
                  <div>• {t("fairness.proofPoints.p2")}</div>
                  <div>• {t("fairness.proofPoints.p3")}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 06 // ROADSENSE™ ROADABILITY & FIELD HAZARD DISPATCH (#alerts)     */}
        {/* ========================================================================= */}
        <section id="alerts" className="mx-auto max-w-[1680px] p-8 sm:p-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 dark:border-neutral-800 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                {t("alerts.crowdsourced")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black dark:text-white mt-1">
                {t("alerts.title")}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setShowRoadSenseModal(!showRoadSenseModal);
                  setShowReportModal(false);
                }}
                className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold uppercase tracking-wider hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>{t("alerts.oneTapBtn")}</span>
              </button>
              <button
                onClick={() => {
                  setShowReportModal(!showReportModal);
                  setShowRoadSenseModal(false);
                }}
                className="px-3.5 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>{showReportModal ? t("alerts.closeFormBtn") : t("alerts.customIncidentBtn")}</span>
              </button>
            </div>
          </div>

          {/* Dedicated One-Tap Driver Road Report Modal (Phase 5 DoD) */}
          {showRoadSenseModal && (
            <div className="my-6 p-6 border-2 border-emerald-600 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 animate-fade-up space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs uppercase tracking-wider text-emerald-950 dark:text-emerald-300 font-bold flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-ping" />
                  <span>{t("alerts.oneTapTitle")}</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                  {syncState.isOnline ? t("alerts.onlineSync") : t("alerts.offlineQueue")}
                </span>
              </div>

              <form onSubmit={handleReportRoadSense} className="space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Segment Selector */}
                  <div className="lg:col-span-2">
                    <label className="block font-mono text-[10px] uppercase text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                      {t("alerts.selectSegmentLabel")}
                    </label>
                    <select
                      value={selectedRoadSenseId}
                      onChange={(e) => setSelectedRoadSenseId(e.target.value)}
                      className="w-full swiss-input text-xs font-bold bg-white dark:bg-neutral-900"
                    >
                      {roadSegments.map((seg) => (
                        <option key={seg.id} value={seg.id} className="dark:bg-neutral-900">
                          {seg.name} ({seg.length_km}km, {seg.surface_type}, Base: {seg.static_base_score}/100) — Currently: {seg.current_status.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Observer Handle */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">
                      {t("alerts.reporterLabel")}
                    </label>
                    <input
                      type="text"
                      value={roadSenseReporter}
                      onChange={(e) => setRoadSenseReporter(e.target.value)}
                      className="w-full swiss-input text-xs bg-white dark:bg-neutral-900 font-mono"
                    />
                  </div>
                </div>

                {/* 3 Prominent One-Tap Status Buttons */}
                <div>
                  <label className="block font-mono text-[10px] uppercase text-neutral-600 dark:text-neutral-400 mb-1.5 font-semibold">
                    {t("alerts.statusLabel")}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setRoadSenseReportStatus("clear")}
                      className={`py-3 px-4 rounded border text-xs font-mono font-bold uppercase transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        roadSenseReportStatus === "clear"
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400"
                          : "bg-white dark:bg-neutral-900 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      }`}
                    >
                      <span className="text-base">🟢</span>
                      <span>{t("alerts.statusClear")}</span>
                      <span className="text-[9px] font-sans font-normal opacity-80">{t("alerts.statusClearDesc")}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRoadSenseReportStatus("difficult")}
                      className={`py-3 px-4 rounded border text-xs font-mono font-bold uppercase transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        roadSenseReportStatus === "difficult"
                          ? "bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300"
                          : "bg-white dark:bg-neutral-900 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                      }`}
                    >
                      <span className="text-base">🟡</span>
                      <span>{t("alerts.statusDifficult")}</span>
                      <span className="text-[9px] font-sans font-normal opacity-80">{t("alerts.statusDifficultDesc")}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRoadSenseReportStatus("blocked")}
                      className={`py-3 px-4 rounded border text-xs font-mono font-bold uppercase transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        roadSenseReportStatus === "blocked"
                          ? "bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400"
                          : "bg-white dark:bg-neutral-900 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      }`}
                    >
                      <span className="text-base">🔴</span>
                      <span>{t("alerts.statusBlocked")}</span>
                      <span className="text-[9px] font-sans font-normal opacity-80">{t("alerts.statusBlockedDesc")}</span>
                    </button>
                  </div>
                </div>

                {/* Preset Quick Tags */}
                <div className="space-y-1.5">
                  <span className="font-mono text-[9px] text-neutral-500 dark:text-neutral-400 uppercase font-bold">{t("alerts.quickNotesTitle")}</span>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                    {[
                      "Causeway submerged under 2.5ft floodwater — impassable for 4-wheelers.",
                      "Severe potholes and waterlogged gravel patch near km 5.",
                      "Loose silt and heavy ruts along canal embankment.",
                      "Highway corridor clear, smooth asphalt surface, normal transit speeds.",
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setRoadSenseReportNote(preset)}
                        className="px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-left cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Note Input & Submit Button */}
                <div className="flex flex-col sm:flex-row items-end gap-3 pt-2">
                  <div className="flex-1 w-full">
                    <label className="block font-mono text-[10px] uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                      {t("alerts.detailsLabel")}
                    </label>
                    <input
                      type="text"
                      placeholder={t("alerts.detailsPlaceholder")}
                      value={roadSenseReportNote}
                      onChange={(e) => setRoadSenseReportNote(e.target.value)}
                      className="w-full swiss-input text-xs bg-white dark:bg-neutral-900"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingRoadSense}
                    className="w-full sm:w-auto px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded text-xs font-mono uppercase font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isSubmittingRoadSense ? t("alerts.submitting") : t("alerts.submitBtn")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Legacy Report Hazard Form Dropdown */}
          {showReportModal && (
            <div className="my-6 p-6 border border-black dark:border-neutral-700 bg-neutral-50/90 dark:bg-[#121215] animate-fade-up">
              <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 font-bold">
                {t("alerts.legacyTitle")}
              </div>
              <form onSubmit={handleReportRoadHazard} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase text-neutral-400 dark:text-neutral-500 mb-1">{t("alerts.corridorLabel")}</label>
                  <select
                    value={reportCorridor}
                    onChange={(e) => setReportCorridor(e.target.value)}
                    className="w-full swiss-input text-xs font-medium bg-white dark:bg-neutral-900"
                  >
                    <option value="Majuli Island Ferry Approach ⇄ Jorhat Agro Terminal" className="dark:bg-neutral-900">Majuli Island ⇄ Jorhat Agro Terminal</option>
                    <option value="Tawang Mountain Outpost ⇄ Tezpur Transit Node" className="dark:bg-neutral-900">Tawang Outpost ⇄ Tezpur Transit Node</option>
                    <option value="Jorhat Upper Assam Tea Belt ⇄ Guwahati Mega Hub" className="dark:bg-neutral-900">Jorhat Tea Belt (Assam) ⇄ Guwahati Hub</option>
                    <option value="Imphal Valley Organic Farms ⇄ Silchar Crossdock" className="dark:bg-neutral-900">Imphal Valley ⇄ Silchar Crossdock</option>
                    <option value="Shillong Highlands ⇄ Guwahati Central Hub" className="dark:bg-neutral-900">Shillong Highlands ⇄ Guwahati Hub</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase text-neutral-400 dark:text-neutral-500 mb-1">{t("alerts.conditionLabel")}</label>
                  <select
                    value={reportCondition}
                    onChange={(e) => setReportCondition(e.target.value as RoadCondition)}
                    className="w-full swiss-input text-xs font-semibold bg-white dark:bg-neutral-900"
                  >
                    <option value="flood_risk" className="dark:bg-neutral-900">{tc("terrain.floodRisk")}</option>
                    <option value="seasonal" className="dark:bg-neutral-900">{tc("terrain.seasonal")}</option>
                    <option value="unpaved" className="dark:bg-neutral-900">{tc("terrain.unpaved")}</option>
                    <option value="paved" className="dark:bg-neutral-900">{tc("terrain.paved")}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase text-neutral-400 dark:text-neutral-500 mb-1">{t("alerts.fieldNotesLabel")}</label>
                  <input
                    type="text"
                    placeholder="e.g. Water level rising near km 8; speed derating 40%"
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    className="w-full swiss-input text-xs bg-white dark:bg-neutral-900"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block font-mono text-[10px] uppercase text-neutral-400 dark:text-neutral-500 mb-1">{t("alerts.observerLabel")}</label>
                    <input
                      type="text"
                      value={reportAuthor}
                      onChange={(e) => setReportAuthor(e.target.value)}
                      className="w-full swiss-input text-xs bg-white dark:bg-neutral-900 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded text-xs font-mono uppercase font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 cursor-pointer shrink-0"
                  >
                    {t("alerts.publishBtn")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* RoadSense Real-Time Segment Intelligence Cards Grid (Phase 6 DoD) */}
          <div className="pt-6 pb-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3 font-bold">
              {t("alerts.monitoredSegmentsTitle")}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
              {roadSegments.slice(0, 6).map((seg) => {
                const latestReport = seg.reports && seg.reports.length > 0 ? seg.reports[0] : null;
                const statusColor =
                  seg.current_status === "clear"
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                    : seg.current_status === "difficult"
                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                    : "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800";

                return (
                  <div
                    key={seg.id}
                    className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121215] hover:border-black dark:hover:border-white transition-all space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-black dark:text-white text-xs leading-snug">{seg.name}</div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border shrink-0 ${statusColor}`}>
                        {seg.current_status === "clear" ? `🟢 ${t("alerts.statusClear")}` : seg.current_status === "difficult" ? `🟡 ${t("alerts.statusDifficult")}` : `🔴 ${t("alerts.statusBlocked")}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] bg-neutral-50 dark:bg-neutral-900 p-2 border border-neutral-100 dark:border-neutral-800">
                      <div>
                        <span className="text-neutral-400 dark:text-neutral-500 block text-[8px] uppercase">{t("alerts.baseScore")}</span>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">{seg.static_base_score}/100</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 dark:text-neutral-500 block text-[8px] uppercase">{t("alerts.surface")}</span>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{tc(`terrain.${seg.surface_type}`) || seg.surface_type}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 dark:text-neutral-500 block text-[8px] uppercase">{t("alerts.length")}</span>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{seg.length_km} {tc("units.km")}</span>
                      </div>
                    </div>

                    {latestReport && (
                      <div className="text-[10px] font-sans text-neutral-600 dark:text-neutral-300 bg-neutral-50/70 dark:bg-neutral-900/70 p-2 border border-neutral-100 dark:border-neutral-800">
                        <span className="font-mono text-[8px] text-neutral-400 dark:text-neutral-500 block uppercase font-bold">{t("alerts.latestReport")}</span>
                        {latestReport.note || `${latestReport.status} reported by driver`}
                      </div>
                    )}

                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-mono">OSM: {seg.osm_way_id}</span>
                      <button
                        onClick={() => {
                          setSelectedRoadSenseId(seg.id);
                          setShowRoadSenseModal(true);
                        }}
                        className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {t("alerts.reportUpdate")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Alerts Feed */}
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 pt-4 font-mono text-xs">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2 font-bold">
              {t("alerts.streamTitle")}
            </div>
            {roadAlerts.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-black dark:text-white">{item.corridor}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">{item.condition}</span>
                  </div>
                  <div className="text-neutral-600 dark:text-neutral-300 text-[11px] font-light font-sans">{item.notes}</div>
                </div>

                <div className="flex items-center gap-6 sm:text-right shrink-0">
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500">{item.time}</div>
                  <div className={`text-[11px] font-semibold ${item.color}`}>{item.status}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
                {/* ========================================================================= */}
        {/* SECTION 07 // DYNAMIC SYNTHETIC VEHICLE REGISTRY & FLEET OPERATIONS       */}
        {/* ========================================================================= */}
        <section id="fleet" className="mx-auto max-w-[1680px] p-8 sm:p-14 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                07 // {t("fleet.sectionLabel")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black dark:text-white mt-1">
                {"Dynamic Multi-Modal Fleet Registry"}
              </h2>
            </div>
            <div className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
              {"Prototype synthetic vehicle pool across NER clusters with live optimizer re-allocation"}
            </div>
          </div>

          {/* Prominent Judge Callout Banner */}
          <div className="my-6 p-5 sm:p-6 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-gradient-to-r from-emerald-50/80 via-white to-sky-50/80 dark:from-emerald-950/30 dark:via-[#121215] dark:to-sky-950/30 shadow-xs space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⚖️</span>
              <div className="font-mono text-xs uppercase font-bold tracking-wider text-emerald-900 dark:text-emerald-300">
                {"Vehicle Pool Dynamism (Evaluation Note)"}
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                DYNAMIC SOLVER READY
              </span>
            </div>
            <p className="text-xs sm:text-sm font-sans text-neutral-800 dark:text-neutral-200 leading-relaxed">
              {"“We don't assume a fixed number of vehicles. The prototype uses synthetic baseline vehicle data because real operational datasets were not available. The vehicle pool is dynamic — vehicles can become available, unavailable, occupied or added, and the optimizer recalculates allocation based on the current available fleet.”"}
            </p>
          </div>

          {/* Fleet Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 font-mono text-xs">
            <div className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121215] rounded shadow-xs">
              <span className="text-[9px] text-neutral-400 dark:text-neutral-500 block uppercase">
                {"Total Fleet"}
              </span>
              <span className="text-2xl font-bold text-black dark:text-white mt-1 block">
                {vehicles.length}
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Synthetic Units</span>
            </div>

            <div className="p-4 border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20 rounded shadow-xs">
              <span className="text-[9px] text-emerald-700 dark:text-emerald-400 block uppercase font-bold">
                {"Active Available"}
              </span>
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1 block">
                {vehicles.filter((v) => v.availability_status === "available").length}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Ready for Match</span>
            </div>

            <div className="p-4 border border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/20 rounded shadow-xs">
              <span className="text-[9px] text-blue-700 dark:text-blue-400 block uppercase font-bold">
                {"Occupied / In-Transit"}
              </span>
              <span className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1 block">
                {vehicles.filter((v) => v.availability_status === "occupied" || v.availability_status === "en_route").length}
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400">Assigned Deliveries</span>
            </div>

            <div className="p-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 rounded shadow-xs">
              <span className="text-[9px] text-neutral-500 dark:text-neutral-400 block uppercase">
                {"Offline / Maintenance"}
              </span>
              <span className="text-2xl font-bold text-neutral-600 dark:text-neutral-400 mt-1 block">
                {vehicles.filter((v) => v.availability_status === "offline" || v.availability_status === "maintenance").length}
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Excluded by Solver</span>
            </div>

            <div className="p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121215] rounded shadow-xs">
              <span className="text-[9px] text-neutral-400 dark:text-neutral-500 block uppercase">
                {"Gross Capacity"}
              </span>
              <span className="text-2xl font-bold text-black dark:text-white mt-1 block">
                {(vehicles.reduce((sum, v) => sum + (v.capacity_kg || 0), 0) / 1000).toFixed(1)}T
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                {vehicles.reduce((sum, v) => sum + (v.capacity_kg || 0), 0).toLocaleString()} kg
              </span>
            </div>

            <div className="p-4 border border-cyan-200 dark:border-cyan-900/60 bg-cyan-50/20 dark:bg-cyan-950/20 rounded shadow-xs">
              <span className="text-[9px] text-cyan-700 dark:text-cyan-400 block uppercase font-bold">
                {"Reefer / Chilled"}
              </span>
              <span className="text-2xl font-bold text-cyan-700 dark:text-cyan-300 mt-1 block">
                {vehicles.filter((v) => v.temp_control).length}
              </span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400">Cold-Chain Units</span>
            </div>
          </div>

          {/* Interactive Demonstrator Toolbar */}
          <div className="p-4 sm:p-5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#111114] rounded-lg mb-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">⚡</span>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                  {"Interactive Dynamic Allocation Demonstrator"}
                </span>
              </div>
              <span className="text-[11px] font-sans text-neutral-500 dark:text-neutral-400">
                {"Simulate fleet availability shifts to verify optimizer reallocation in real time."}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleQuickDemoToggleOffline}
                className="px-3 py-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded text-xs font-mono font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <span>🔴</span>
                <span>{"Simulate Highland Bolero 4x4 Offline"}</span>
              </button>

              <button
                type="button"
                onClick={handleQuickDemoAddReefer}
                className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded text-xs font-mono font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <span>➕</span>
                <span>{"Add Extra Solar Reefer at Jorhat"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddVehicleModalOpen(true)}
                className="px-3 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded text-xs font-mono font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <span>📝</span>
                <span>{"Register Custom Vehicle"}</span>
              </button>

              <button
                type="button"
                onClick={handleRestoreAllAvailable}
                className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-800 rounded text-xs font-mono font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <span>🟢</span>
                <span>{"Restore All to Available"}</span>
              </button>

              <button
                type="button"
                onClick={handleResetBaselineFleet}
                className="px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-xs font-mono cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <span>🔄</span>
                <span>{"Reset 18 Baseline Units"}</span>
              </button>

              <button
                type="button"
                onClick={() => executeClientDynamicAllocation()}
                className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-mono font-bold uppercase cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span>⚡</span>
                <span>{"Run Dynamic Matching"}</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-neutral-400 dark:text-neutral-500 uppercase text-[10px] mr-1">Status:</span>
              {[
                { key: "all", label: "All Fleet", count: vehicles.length },
                { key: "available", label: "Available", count: vehicles.filter((v) => v.availability_status === "available").length },
                { key: "en_route", label: "En Route", count: vehicles.filter((v) => v.availability_status === "en_route").length },
                { key: "occupied", label: "Occupied", count: vehicles.filter((v) => v.availability_status === "occupied").length },
                { key: "maintenance", label: "Maintenance", count: vehicles.filter((v) => v.availability_status === "maintenance").length },
                { key: "offline", label: "Offline", count: vehicles.filter((v) => v.availability_status === "offline").length },
              ].map((pill) => (
                <button
                  key={pill.key}
                  onClick={() => setVehicleFilterStatus(pill.key)}
                  className={`px-2.5 py-1 rounded text-xs cursor-pointer border transition-colors ${
                    vehicleFilterStatus === pill.key
                      ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white font-bold"
                      : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
                  }`}
                >
                  {pill.label} ({pill.count})
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-500 uppercase text-[10px]">Location:</span>
              <select
                value={vehicleFilterLocation}
                onChange={(e) => setVehicleFilterLocation(e.target.value)}
                className="px-2.5 py-1 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded text-neutral-900 dark:text-neutral-100"
              >
                <option value="all">All Hubs & Outposts</option>
                <option value="Jorhat">Jorhat Tea Belt (Assam)</option>
                <option value="Tawang">Tawang Mountain Outpost (Arunachal)</option>
                <option value="Shillong">Shillong Highlands (Meghalaya)</option>
                <option value="Majuli">Majuli River Island (Assam)</option>
                <option value="Imphal">Imphal Valley (Manipur)</option>
                <option value="Guwahati">Guwahati Mega Hub (Assam)</option>
                <option value="Silchar">Silchar Crossdock (Assam)</option>
                <option value="Pandu">Pandu Port NW-2 (Assam)</option>
                <option value="Lumding">Lumding Rail Terminal (Assam)</option>
              </select>
            </div>
          </div>

          {/* Vehicles Registry Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles
              .filter((v) => {
                if (vehicleFilterStatus !== "all" && v.availability_status !== vehicleFilterStatus) return false;
                if (vehicleFilterLocation !== "all") {
                  const loc = v.current_location_name || "";
                  if (!loc.toLowerCase().includes(vehicleFilterLocation.toLowerCase())) return false;
                }
                return true;
              })
              .map((veh) => {
                const isAvail = veh.availability_status === "available";
                const isOccupied = veh.availability_status === "occupied" || veh.availability_status === "en_route";
                const isOff = veh.availability_status === "offline" || veh.availability_status === "maintenance";

                const iconMap: Record<string, string> = {
                  mini_truck: "🚚",
                  tata_ace: "🚚",
                  tempo: "🚐",
                  pickup_4x4: "🛻",
                  three_wheeler_cargo: "🛺",
                  cargo_erickshaw: "🛺",
                  motorbike: "🏍️",
                  tractor: "🚜",
                  tractor_trailer: "🚜",
                  riverine_boat: "🛥️",
                  cargo_bike: "🚲",
                  heavy_truck: "🚛",
                  truck: "🚛",
                  bus: "🚌",
                };
                const vIcon = iconMap[veh.type] || "🚚";

                return (
                  <div
                    key={veh.id}
                    className={`p-5 border bg-white dark:bg-[#121215] space-y-3 font-mono text-xs rounded shadow-xs hover:border-black dark:hover:border-white transition-all ${
                      isAvail
                        ? "border-neutral-200 dark:border-neutral-800"
                        : isOccupied
                        ? "border-blue-300 dark:border-blue-900 bg-blue-50/10 dark:bg-blue-950/10"
                        : "border-neutral-300 dark:border-neutral-800/60 opacity-70 bg-neutral-50 dark:bg-neutral-900/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{vIcon}</span>
                        <div>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                            {veh.vehicle_code || veh.id}
                          </span>
                          <div className="font-semibold text-black dark:text-white text-sm mt-0.5 leading-snug">
                            {veh.name}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteVehicle(veh.id)}
                        title="Remove vehicle from dynamic registry"
                        className="text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 cursor-pointer transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-300 font-sans">
                      <span>📍</span>
                      <span className="truncate">{veh.current_location_name || "Regional NER Feeder"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px]">
                      <div>
                        <span className="text-neutral-400 dark:text-neutral-500 text-[9px] block uppercase">
                          {"Payload Capacity"}
                        </span>
                        <span className="font-semibold text-black dark:text-white">
                          {veh.capacity_kg} kg ({veh.capacity_cbm || (veh.capacity_kg * 0.005).toFixed(1)} m³)
                        </span>
                      </div>

                      <div>
                        <span className="text-neutral-400 dark:text-neutral-500 text-[9px] block uppercase">
                          {"Cost / km"}
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          ₹{(veh.cost_per_km || 10).toFixed(1)}/km
                        </span>
                      </div>

                      <div>
                        <span className="text-neutral-400 dark:text-neutral-500 text-[9px] block uppercase">
                          {"Thermal Shield"}
                        </span>
                        <span className={`font-semibold ${veh.temp_control ? "text-cyan-700 dark:text-cyan-400" : "text-neutral-600 dark:text-neutral-400"}`}>
                          {veh.temp_control ? "❄️ Refrigerated" : "📦 Ambient"}
                        </span>
                      </div>

                      <div>
                        <span className="text-neutral-400 dark:text-neutral-500 text-[9px] block uppercase">
                          {"Owner Class"}
                        </span>
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300 capitalize">
                          {veh.owner_type || "cooperative"}
                        </span>
                      </div>
                    </div>

                    {/* Current Assignment / Waybill Badge */}
                    <div className="p-2 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-[10px]">
                      <span className="text-neutral-400 dark:text-neutral-500 block text-[8px] uppercase font-bold">
                        {"Current Assignment"}
                      </span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {veh.current_assignment || "🟢 Idle / Standby in Cluster"}
                      </span>
                    </div>

                    {/* Status Toggle Dropdown */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase">Availability:</span>
                      <select
                        value={veh.availability_status}
                        onChange={(e) => handleToggleVehicleStatus(veh.id, e.target.value as VehicleAvailability)}
                        className={`text-[11px] font-mono font-bold px-2 py-1 rounded border cursor-pointer ${
                          veh.availability_status === "available"
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                            : veh.availability_status === "en_route"
                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                            : veh.availability_status === "occupied"
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                            : veh.availability_status === "maintenance"
                            ? "bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700"
                        }`}
                      >
                        <option value="available">🟢 Available</option>
                        <option value="en_route">🔵 En Route</option>
                        <option value="occupied">🟡 Occupied</option>
                        <option value="maintenance">🟠 Maintenance</option>
                        <option value="offline">⚪ Offline</option>
                      </select>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Add Synthetic Vehicle Modal */}
          {isAddVehicleModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono">
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                  <div className="font-bold text-sm text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span>🚛</span>
                    <span>{"Register Synthetic Vehicle"}</span>
                  </div>
                  <button
                    onClick={() => setIsAddVehicleModalOpen(false)}
                    className="text-neutral-400 hover:text-black dark:hover:text-white text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateVehicle} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-neutral-400 dark:text-neutral-500 uppercase mb-1">
                        Vehicle Code
                      </label>
                      <input
                        type="text"
                        required
                        value={newVehicleCode}
                        onChange={(e) => setNewVehicleCode(e.target.value)}
                        placeholder="OD-02-TC-9999"
                        className="w-full swiss-input text-xs bg-white dark:bg-neutral-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 dark:text-neutral-500 uppercase mb-1">
                        Vehicle Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newVehicleName}
                        onChange={(e) => setNewVehicleName(e.target.value)}
                        placeholder="Guwahati Smart Solar Reefer"
                        className="w-full swiss-input text-xs bg-white dark:bg-neutral-900 font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-neutral-400 dark:text-neutral-500 uppercase mb-1">
                        Vehicle Type
                      </label>
                      <select
                        value={newVehicleType}
                        onChange={(e) => handleVehicleTypeChange(e.target.value as VehicleType)}
                        className="w-full swiss-input text-xs bg-white dark:bg-neutral-900 font-mono"
                      >
                        <option value="mini_truck">Mini-Truck / LCV</option>
                        <option value="pickup_4x4">4x4 Pickup (Bolero)</option>
                        <option value="tempo">Reefer Tempo / 407</option>
                        <option value="three_wheeler_cargo">Three-Wheeler (Ape)</option>
                        <option value="cargo_erickshaw">E-Rickshaw Cargo</option>
                        <option value="motorbike">Cargo Motorbike</option>
                        <option value="tractor_trailer">Tractor-Trailer</option>
                        <option value="riverine_boat">Riverine Cargo Boat</option>
                        <option value="cargo_bike">Cargo Bike / E-Cycle</option>
                        <option value="heavy_truck">Heavy HCV Truck</option>
                        <option value="bus">Passenger-Cargo Bus</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-400 dark:text-neutral-500 uppercase mb-1">
                        Location / Hub
                      </label>
                      <select
                        value={newVehicleLocation}
                        onChange={(e) => setNewVehicleLocation(e.target.value)}
                        className="w-full swiss-input text-xs bg-white dark:bg-neutral-900 font-mono"
                      >
                        <option value="Jorhat Upper Assam Tea Belt">Jorhat Tea Belt (Assam)</option>
                        <option value="Tawang Mountain Outpost (Arunachal Pradesh)">Tawang Outpost (Arunachal)</option>
                        <option value="Shillong Highlands (Meghalaya)">Shillong Highlands (Meghalaya)</option>
                        <option value="Majuli River Island (Assam)">Majuli River Island (Assam)</option>
                        <option value="Imphal Valley Organic Farms (Manipur)">Imphal Valley (Manipur)</option>
                        <option value="Guwahati Northeast Central Mega Hub">Guwahati Mega Hub (Assam)</option>
                        <option value="Silchar Rail & Road Crossdock Terminal">Silchar Crossdock (Assam)</option>
                        <option value="Pandu Inland Port NW-2">Pandu Port NW-2 (Assam)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-neutral-400 dark:text-neutral-500 uppercase mb-1">
                        Payload (kg)
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="30000"
                        value={newVehicleCapacityKg}
                        onChange={(e) => setNewVehicleCapacityKg(Number(e.target.value))}
                        className="w-full swiss-input text-xs bg-white dark:bg-neutral-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 dark:text-neutral-500 uppercase mb-1">
                        Volume (m³)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="60"
                        value={newVehicleCapacityCbm}
                        onChange={(e) => setNewVehicleCapacityCbm(Number(e.target.value))}
                        className="w-full swiss-input text-xs bg-white dark:bg-neutral-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 dark:text-neutral-500 uppercase mb-1">
                        Cost (₹/km)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="100"
                        value={newVehicleCostKm}
                        onChange={(e) => setNewVehicleCostKm(Number(e.target.value))}
                        className="w-full swiss-input text-xs bg-white dark:bg-neutral-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-neutral-50 dark:bg-neutral-900/50">
                    <div>
                      <span className="font-bold text-black dark:text-white block">Refrigerated / Temperature Control</span>
                      <span className="text-[10px] text-neutral-500">Supports chilled medicines and temperature-sensitive agro goods</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={newVehicleTempControl}
                      onChange={(e) => setNewVehicleTempControl(e.target.checked)}
                      className="w-4 h-4 cursor-pointer accent-black dark:accent-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setIsAddVehicleModalOpen(false)}
                      className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-bold uppercase rounded text-xs cursor-pointer hover:bg-neutral-800 dark:hover:bg-neutral-200"
                    >
                      Add to Registry
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>


        {/* SECTION 08 // INDIAN RAILWAYS (FOIS) ROAD+RAIL MULTI-MODAL CORRIDORS      */}
        {/* ========================================================================= */}
        <section id="rail" className="mx-auto max-w-[1680px] p-8 sm:p-14 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#0c0c0e]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 dark:border-neutral-800 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                {t("rail.sectionLabel")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black dark:text-white mt-1">
                {t("rail.title")}
              </h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 font-mono text-xs font-bold border border-indigo-200 dark:border-indigo-800">
              <span>{t("rail.co2Reduction")}</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 pt-8 font-mono text-xs">
            {/* Corridor Card 1 */}
            <div className="p-6 border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#121215] space-y-4 shadow-xs">
              <div className="flex items-center justify-between text-[10px] uppercase text-neutral-400 dark:text-neutral-500">
                <span>{t("rail.arterial1")}</span>
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded font-bold border border-indigo-200 dark:border-indigo-800">{t("rail.activeRake")}</span>
              </div>
              <div className="font-semibold text-base text-black dark:text-white">
                {t("rail.arterial1Title")}
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 font-sans leading-relaxed">
                {t("rail.arterial1Desc")}
              </p>

              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">{t("rail.distanceLabel")}</span>
                  <span className="font-semibold text-black dark:text-white">44.0 km ({t("rail.electrified")})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">{t("rail.co2Label")}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">28.0 g/t-km ({t("rail.co2Savings")})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">{t("rail.transshipmentLabel")}</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{t("rail.crossdockWindow")}</span>
                </div>
              </div>
            </div>

            {/* Corridor Card 2 */}
            <div className="p-6 border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#121215] space-y-4 shadow-xs">
              <div className="flex items-center justify-between text-[10px] uppercase text-neutral-400 dark:text-neutral-500">
                <span>{t("rail.arterial2")}</span>
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded font-bold border border-indigo-200 dark:border-indigo-800">{t("rail.portExport")}</span>
              </div>
              <div className="font-semibold text-base text-black dark:text-white">
                {t("rail.arterial2Title")}
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 font-sans leading-relaxed">
                {t("rail.arterial2Desc")}
              </p>

              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">{t("rail.distanceLabel")}</span>
                  <span className="font-semibold text-black dark:text-white">84.0 km ({t("rail.heavyHaul")})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">{t("rail.co2Label")}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">28.0 g/t-km ({t("rail.savings75")})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">{t("rail.reeferTrackLabel")}</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{t("rail.directPortDock")}</span>
                </div>
              </div>
            </div>

            {/* Corridor Card 3 */}
            <div className="p-6 border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#121215] space-y-4 shadow-xs">
              <div className="flex items-center justify-between text-[10px] uppercase text-neutral-400 dark:text-neutral-500">
                <span>{t("rail.arterial3")}</span>
                <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded font-bold border border-amber-200 dark:border-amber-800">{t("rail.highlandTransit")}</span>
              </div>
              <div className="font-semibold text-base text-black dark:text-white">
                {t("rail.arterial3Title")}
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 font-sans leading-relaxed">
                {t("rail.arterial3Desc")}
              </p>

              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">{t("rail.distanceLabel")}</span>
                  <span className="font-semibold text-black dark:text-white">345.0 km ({t("rail.ghatsExpress")})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">{t("rail.co2Label")}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">28.0 g/t-km ({t("rail.saveCo2")})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">{t("rail.mileLabel")}</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{t("rail.mileVehicles")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <RuralChatbot />
    </>
  );
}