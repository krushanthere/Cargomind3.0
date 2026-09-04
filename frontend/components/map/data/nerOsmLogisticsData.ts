/**
 * CargoMind 3.0 — Northeast India (NER) OpenStreetMap Logistics Intelligence & Digital Twin
 * 
 * True Geographical Lat/Lng Coordinates & Hierarchical Freight Topology:
 * MAINLAND GATEWAYS (Delhi, Kolkata, Patna)
 *   → SILIGURI STRATEGIC GATEWAY ("Chicken's Neck" Fulcrum)
 *     → GUWAHATI PRIMARY NER LOGISTICS HUB (Multimodal Road, Rail, Air, Inland Waterway NW-2, Warehousing)
 *       → 8 NER STATE CAPITALS (Assam, Arunachal, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, Sikkim)
 *         → 24+ REGIONAL & DISTRICT HUBS (Tawang, Dibrugarh, Silchar, Tura, Mokokchung, etc.)
 *           → 186 RURAL LOGISTICS CLUSTERS (Majuli, Lakadong, Ziro, Mizo Hills, etc.)
 *             → VILLAGES / PHC CLINICS / RURAL HAATS / PRODUCERS
 *               → LAST-MILE MULTIMODAL & EV DISPATCH
 */

export type LogisticsTier =
  | "mainland_gateway"
  | "siliguri_gateway"
  | "primary_ner_hub"
  | "state_hub"
  | "regional_district_hub"
  | "rural_cluster"
  | "last_mile_point";

export type TransportMode = "road" | "rail" | "waterway" | "air" | "multimodal";

export type RouteStatus = "optimal" | "moderate_risk" | "blocked_critical";

export type DisasterRiskType =
  | "heavy_rainfall"
  | "flash_flood"
  | "landslide"
  | "road_closure"
  | "bridge_disruption"
  | "high_altitude_snow"
  | "network_blindspot";

export interface MultimodalCapability {
  road: boolean;
  rail: boolean;
  air: boolean;
  inland_waterway: boolean;
  cold_storage: boolean;
  warehousing_sqm: number;
}

export interface NERState {
  id: string;
  name: string;
  capital: string;
  capitalHubId: string;
  color: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  terrainSummary: string;
  totalClusters: number;
  activeShipments: number;
  avgAccessibilityScore: number;
  highlightedCommodities: string[];
}

export interface OsmLogisticsHub {
  id: string;
  name: string;
  code: string;
  tier: LogisticsTier;
  state: string;
  district?: string;
  lat: number;
  lng: number;
  elevation_m: number;
  terrainType: "plains" | "hilly" | "mountainous" | "riverine";
  powerReliability: "grid" | "solar" | "hybrid" | "unreliable";
  capabilities: MultimodalCapability;
  capacityKg: number;
  usedKg: number;
  activeDocks: number;
  temperatureZones: string[];
  roleTag: string;
  isSiliguri?: boolean;
  isGuwahati?: boolean;
}

export interface OsmRuralCluster {
  id: string;
  name: string;
  code: string;
  state: string;
  district: string;
  parentHubId: string;
  lat: number;
  lng: number;
  elevation_m: number;
  terrainDifficulty: "Moderate Valley" | "Steep Ghats" | "High Altitude Ridge" | "Riverine Floodplain" | "Dense Hill Forest";
  population: number;
  healthCentresCount: number;
  farmerProducerOrgs: number;
  collectionPointsCount: number;
  weeklyAgroOutputTons: number;
  primaryCommodity: string;
  currentDemandSummary: string;
  nearestHubDistanceKm: number;
  roadCondition: "Asphalt Highway" | "Paved Hill Road" | "Single-Lane Unpaved" | "Mud Track (Monsoon Fragile)" | "Riverine Ferry Link";
  roadSenseIRI: number; // 1-12
  weatherTelemetry: {
    temp_c: number;
    humidity_pct: number;
    condition: string;
    rainfall_mm: number;
  };
  disasterRisk: {
    landslideProbabilityPct: number;
    floodRiskLevel: "Low" | "Moderate" | "High" | "Critical";
    activeAlert?: string;
  };
  accessibilityScore: number; // 0-100
  scoreBreakdown: {
    roadConnectivity: number; // max 25
    terrainElevation: number; // max 20
    weatherConditions: number; // max 15
    disasterSafety: number; // max 15
    vehicleViability: number; // max 15
    routeRedundancy: number; // max 10
  };
  recommendedVehicle: string;
  estimatedDeliveryTimeHours: number;
  activeShipmentCount: number;
}

export interface OsmLogisticsCorridor {
  id: string;
  name: string;
  fromHubId: string;
  toHubId: string;
  mode: TransportMode;
  coordinates: [number, number][]; // [lat, lng] polyline points
  distanceKm: number;
  standardEtaHours: number;
  currentEtaHours: number;
  status: RouteStatus;
  roadRoughnessIRI: number;
  gradientPct: number;
  elevationGainM: number;
  weatherCondition: string;
  landslideProbabilityPct: number;
  floodRiskPct: number;
  vehicleSuitability: {
    heavyReefer16T: boolean;
    miniTruckTataAce: boolean;
    pickup4x4Bolero: boolean;
    railFlatcar: boolean;
    inlandBarge: boolean;
    cargoDrone: boolean;
  };
  accessibilityScore: number;
  recommendation: string;
  alternateRouteId?: string;
  alternateRouteName?: string;
  alternateSavingsSummary?: string;
}

export interface OsmDisasterRiskZone {
  id: string;
  name: string;
  category: DisasterRiskType;
  severity: "critical" | "high" | "moderate" | "warning";
  locationDescription: string;
  state: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  affectedCorridorIds: string[];
  affectedShipmentIds: string[];
  detectedAt: string;
  impactSummary: string;
  aiRerouteRecommendation: string;
  alternativeModeAvailable: string;
}

export interface OsmVehicleTelemetry {
  id: string;
  name: string;
  type: "Heavy Reefer Truck (16T)" | "Tata Ace Cold LCV (1.2T)" | "Highland 4x4 Bolero (1.5T)" | "Northern DFC Freight Train (45T)" | "Brahmaputra Cargo Barge (120T)" | "Air Cargo ATR-72 (4.5T)" | "Agri-Drone Cold Pod (25kg)" | "EV Rural 3-Wheeler (500kg)";
  driverName: string;
  currentLocationName: string;
  lat: number;
  lng: number;
  headingDeg: number;
  speedKmH: number;
  capacityKg: number;
  usedKg: number;
  utilizationPct: number;
  tempControlled: boolean;
  chamberTempC: number;
  targetTempC: number;
  batteryOrFuelPct: number;
  status: "en_route" | "loading" | "idle_available" | "maintenance";
  assignedShipmentId?: string;
  currentCorridorId?: string;
  terrainSuitabilityScore: number;
  routeWaypoints: [number, number][];
}

export interface OsmActiveShipment {
  id: string;
  waybill: string;
  originHubId: string;
  originName: string;
  destinationHubId: string;
  destinationName: string;
  cargoType: "Medicine & Vaccines" | "Organic Tea & Spices" | "Perishable Fruits (Pineapple/Litchi/Kiwi)" | "Emergency Disaster Relief" | "Agricultural Grain & Bamboo" | "General Cargo & Equipment";
  commodity: string;
  weightKg: number;
  volumeM3: number;
  tempClass: "frozen" | "chilled" | "ambient";
  targetTemp: string;
  urgency: "critical" | "high" | "routine";
  assignedVehicleId: string;
  assignedVehicleName: string;
  etaHours: number;
  routeStatus: RouteStatus;
  aiPriorityScore: number;
  currentLocationDescription: string;
  status: "In Transit" | "Dispatched" | "Rerouted" | "Delivered";
  hasReturnMatch: boolean;
  returnMatchSummary?: string;
}

export interface OsmReturnLoadOpportunity {
  id: string;
  outboundShipmentId: string;
  outboundRoute: string;
  outboundVehicle: string;
  destinationLocation: string;
  lat: number;
  lng: number;
  availableReturnCargo: string;
  returnCommodity: string;
  producerGroup: string;
  availableWeightKg: number;
  targetDestination: string;
  outboundUtilizationPct: number;
  projectedReturnUtilizationPct: number;
  emptyMilesEliminatedKm: number;
  fuelCostSavingsInr: number;
  co2ReductionKg: number;
  matchedStatus: "detected" | "assigned" | "in_transit";
}

// =========================================================================
// 1. ALL 8 NER STATES + MAP CENTERS
// =========================================================================

export const OSM_NER_STATES_DATA: NERState[] = [
  {
    id: "assam",
    name: "Assam",
    capital: "Dispur / Guwahati",
    capitalHubId: "gau_mega_hub",
    color: "#059669",
    center: [26.2006, 92.9376],
    zoom: 7,
    terrainSummary: "Brahmaputra Valley Plains, Riverine Floodplains, Tea Belts, Hill Sections",
    totalClusters: 62,
    activeShipments: 16,
    avgAccessibilityScore: 84,
    highlightedCommodities: ["Orthodox Tea", "Tezpur Litchi", "Bhut Jolokia", "Assam Silk", "Fresh Dairy"],
  },
  {
    id: "arunachal",
    name: "Arunachal Pradesh",
    capital: "Itanagar",
    capitalHubId: "ita_state_hub",
    color: "#0284c7",
    center: [28.2180, 94.7278],
    zoom: 7,
    terrainSummary: "High Altitude Himalayas (up to 4200m ASL), Sela Pass, Deep Valleys",
    totalClusters: 24,
    activeShipments: 5,
    avgAccessibilityScore: 56,
    highlightedCommodities: ["Organic Golden Kiwi", "Apples & Oranges", "Yak Churpi Cheese", "Medicinal Cordyceps"],
  },
  {
    id: "meghalaya",
    name: "Meghalaya",
    capital: "Shillong",
    capitalHubId: "shl_state_hub",
    color: "#7c3aed",
    center: [25.4670, 91.3662],
    zoom: 8,
    terrainSummary: "Highland Plateau (1500m ASL), Monsoonal Gorges, Limestone Caves",
    totalClusters: 20,
    activeShipments: 6,
    avgAccessibilityScore: 71,
    highlightedCommodities: ["GI Lakadong Turmeric (7.8% Curcumin)", "Khasi Mandarin", "Black Pepper", "Floriculture"],
  },
  {
    id: "manipur",
    name: "Manipur",
    capital: "Imphal",
    capitalHubId: "imp_state_hub",
    color: "#e11d48",
    center: [24.6637, 93.9063],
    zoom: 8,
    terrainSummary: "Central Oval Valley surrounded by Rugged Hills, Loktak Lake, Myanmar Border Corridor",
    totalClusters: 18,
    activeShipments: 4,
    avgAccessibilityScore: 63,
    highlightedCommodities: ["GI Chak-Hao Black Rice", "King Chilli", "Bamboo Shoots", "Valley Floriculture"],
  },
  {
    id: "mizoram",
    name: "Mizoram",
    capital: "Aizawl",
    capitalHubId: "azl_state_hub",
    color: "#d97706",
    center: [23.1645, 92.9376],
    zoom: 8,
    terrainSummary: "Steep Parallel North-South Ridges (1100-1600m ASL), Winding Hill Arterials",
    totalClusters: 16,
    activeShipments: 4,
    avgAccessibilityScore: 59,
    highlightedCommodities: ["Anthurium Cut Flowers", "Mizo Bird's Eye Chilli", "Dragon Fruit", "Wild Passion Fruit"],
  },
  {
    id: "nagaland",
    name: "Nagaland",
    capital: "Kohima / Dimapur",
    capitalHubId: "dmp_state_hub",
    color: "#2563eb",
    center: [26.1584, 94.5624],
    zoom: 8,
    terrainSummary: "Rugged Mountain Ridges, Dimapur Railhead Plains, High-Gradient Passes",
    totalClusters: 18,
    activeShipments: 4,
    avgAccessibilityScore: 66,
    highlightedCommodities: ["Naga King Chilli (Bhut Jolokia)", "Queen Pineapple", "Organic Honey", "Highland Spices"],
  },
  {
    id: "tripura",
    name: "Tripura",
    capital: "Agartala",
    capitalHubId: "agt_state_hub",
    color: "#0d9488",
    center: [23.9408, 91.9882],
    zoom: 8,
    terrainSummary: "Plains and Low Hill Ranges, Cross-Border Transshipment Gateways, River Basins",
    totalClusters: 14,
    activeShipments: 3,
    avgAccessibilityScore: 79,
    highlightedCommodities: ["GI Tripura Queen Pineapple", "Natural Rubber Latex", "Fresh River Fish", "Citrus Fruits"],
  },
  {
    id: "sikkim",
    name: "Sikkim",
    capital: "Gangtok",
    capitalHubId: "gtk_state_hub",
    color: "#16a34a",
    center: [27.5330, 88.5122],
    zoom: 8,
    terrainSummary: "High Himalayan Mountain Slopes (1650m ASL), Teesta River Gorge, Sevoke Corridor",
    totalClusters: 14,
    activeShipments: 3,
    avgAccessibilityScore: 61,
    highlightedCommodities: ["100% Organic Large Cardamom", "Organic Ginger", "Cherry Pepper (Dalle Khursani)", "Orchids"],
  },
];

// =========================================================================
// 2. OSM LOGISTICS HUBS (MAINLAND + SILIGURI + GUWAHATI PRIMARY + 8 CAPITALS + 14 REGIONAL HUBS)
// =========================================================================

export const OSM_LOGISTICS_HUBS: OsmLogisticsHub[] = [
  // -----------------------------------------------------------------------
  // LEVEL 0: MAINLAND GATEWAYS
  // -----------------------------------------------------------------------
  {
    id: "del_gateway",
    name: "Delhi NCR Mega Logistics Terminal",
    code: "DEL-NCR",
    tier: "mainland_gateway",
    state: "Delhi NCR (Rest of India)",
    lat: 28.6139,
    lng: 77.2090,
    elevation_m: 216,
    terrainType: "plains",
    powerReliability: "grid",
    capabilities: { road: true, rail: true, air: true, inland_waterway: false, cold_storage: true, warehousing_sqm: 120000 },
    capacityKg: 350000,
    usedKg: 285000,
    activeDocks: 32,
    temperatureZones: ["-25°C Frozen Pharma", "+2°C Vaccine Vault", "+4°C Fresh Produce", "Ambient FMCG"],
    roleTag: "NATIONAL CAPITAL GATEWAY",
  },
  {
    id: "kol_gateway",
    name: "Kolkata Port & Maritime Distribution Terminal",
    code: "KOL-PORT",
    tier: "mainland_gateway",
    state: "West Bengal (Rest of India)",
    lat: 22.5726,
    lng: 88.3639,
    elevation_m: 9,
    terrainType: "plains",
    powerReliability: "grid",
    capabilities: { road: true, rail: true, air: true, inland_waterway: true, cold_storage: true, warehousing_sqm: 150000 },
    capacityKg: 400000,
    usedKg: 330000,
    activeDocks: 36,
    temperatureZones: ["-25°C Marine Export", "+4°C Dairy & Produce", "Reefer Rail Flatcar Siding"],
    roleTag: "EASTERN MARITIME GATEWAY",
  },
  {
    id: "pat_gateway",
    name: "Patna Gangetic Crossdock & Rail Siding",
    code: "PAT-XDK",
    tier: "mainland_gateway",
    state: "Bihar (Rest of India)",
    lat: 25.5941,
    lng: 85.1376,
    elevation_m: 53,
    terrainType: "plains",
    powerReliability: "grid",
    capabilities: { road: true, rail: true, air: false, inland_waterway: true, cold_storage: true, warehousing_sqm: 45000 },
    capacityKg: 120000,
    usedKg: 85000,
    activeDocks: 14,
    temperatureZones: ["+4°C Agro Produce", "Ambient Bulk Siding"],
    roleTag: "GANGETIC INLAND GATEWAY",
  },

  // -----------------------------------------------------------------------
  // LEVEL 1: SILIGURI — STRATEGIC NER GATEWAY ("CHICKEN'S NECK")
  // -----------------------------------------------------------------------
  {
    id: "sgu_gateway",
    name: "SILIGURI — NER STRATEGIC GATEWAY",
    code: "SGU-GATEWAY",
    tier: "siliguri_gateway",
    state: "North Bengal / External Gateway",
    district: "Siliguri Corridor / NJP",
    lat: 26.7271,
    lng: 88.3953,
    elevation_m: 122,
    terrainType: "plains",
    powerReliability: "grid",
    capabilities: { road: true, rail: true, air: true, inland_waterway: false, cold_storage: true, warehousing_sqm: 95000 },
    capacityKg: 260000,
    usedKg: 215000,
    activeDocks: 28,
    temperatureZones: ["Intermodal Reefer Crossdock", "-25°C Cold Vault", "+2°C to +8°C Pharma Buffer", "Tea Rail Siding"],
    roleTag: "NER STRATEGIC GATEWAY (CHICKEN'S NECK)",
    isSiliguri: true,
  },

  // -----------------------------------------------------------------------
  // LEVEL 2: GUWAHATI — PRIMARY NER LOGISTICS HUB
  // -----------------------------------------------------------------------
  {
    id: "gau_mega_hub",
    name: "GUWAHATI — PRIMARY NER LOGISTICS HUB",
    code: "GAU-PRIMARY",
    tier: "primary_ner_hub",
    state: "Assam",
    district: "Kamrup Metropolitan",
    lat: 26.1445,
    lng: 91.7362,
    elevation_m: 55,
    terrainType: "plains",
    powerReliability: "grid",
    capabilities: { road: true, rail: true, air: true, inland_waterway: true, cold_storage: true, warehousing_sqm: 180000 },
    capacityKg: 500000,
    usedKg: 412000,
    activeDocks: 48,
    temperatureZones: [
      "Road Reefer Docks (24 Bays)",
      "Rail Container Siding (New Guwahati Yard)",
      "Air Cargo Wing (LGBI Airport Terminal)",
      "NW-2 Inland Port (Pandu River Terminal)",
      "-25°C Vaccine & Sea Freight Vault",
      "+4°C Organic Agro Preservation Facility",
    ],
    roleTag: "PRIMARY NER MULTIMODAL NERVE CENTER",
    isGuwahati: true,
  },

  // -----------------------------------------------------------------------
  // LEVEL 3: 8 NER STATE CAPITALS / PRIMARY HUBS
  // -----------------------------------------------------------------------
  {
    id: "ita_state_hub",
    name: "Itanagar / Naharlagun State Logistics Hub",
    code: "ITA-STATE",
    tier: "state_hub",
    state: "Arunachal Pradesh",
    district: "Papum Pare",
    lat: 27.0844,
    lng: 93.6053,
    elevation_m: 320,
    terrainType: "hilly",
    powerReliability: "hybrid",
    capabilities: { road: true, rail: true, air: true, inland_waterway: false, cold_storage: true, warehousing_sqm: 28000 },
    capacityKg: 65000,
    usedKg: 46000,
    activeDocks: 8,
    temperatureZones: ["+4°C Kiwi & Fruit Chamber", "+10°C Agro Buffer"],
    roleTag: "ARUNACHAL STATE HUB",
  },
  {
    id: "shl_state_hub",
    name: "Shillong Highlands State Agro & Pharma Depot",
    code: "SHL-STATE",
    tier: "state_hub",
    state: "Meghalaya",
    district: "East Khasi Hills",
    lat: 25.5788,
    lng: 91.8933,
    elevation_m: 1525,
    terrainType: "mountainous",
    powerReliability: "solar",
    capabilities: { road: true, rail: false, air: true, inland_waterway: false, cold_storage: true, warehousing_sqm: 35000 },
    capacityKg: 75000,
    usedKg: 58000,
    activeDocks: 10,
    temperatureZones: ["+4°C GI Lakadong Turmeric", "+8°C Floriculture Vault", "+2°C Vaccine Storage"],
    roleTag: "MEGHALAYA STATE HUB",
  },
  {
    id: "imp_state_hub",
    name: "Imphal Valley State Logistics Terminal",
    code: "IMP-STATE",
    tier: "state_hub",
    state: "Manipur",
    district: "Imphal West",
    lat: 24.8170,
    lng: 93.9368,
    elevation_m: 786,
    terrainType: "hilly",
    powerReliability: "hybrid",
    capabilities: { road: true, rail: false, air: true, inland_waterway: false, cold_storage: true, warehousing_sqm: 32000 },
    capacityKg: 80000,
    usedKg: 59000,
    activeDocks: 10,
    temperatureZones: ["+4°C Black Rice & Bio Produce", "+12°C King Chilli Chamber"],
    roleTag: "MANIPUR STATE HUB",
  },
  {
    id: "azl_state_hub",
    name: "Aizawl Highland State Aggregation Terminal",
    code: "AZL-STATE",
    tier: "state_hub",
    state: "Mizoram",
    district: "Aizawl",
    lat: 23.7271,
    lng: 92.7176,
    elevation_m: 1132,
    terrainType: "mountainous",
    powerReliability: "solar",
    capabilities: { road: true, rail: false, air: true, inland_waterway: false, cold_storage: true, warehousing_sqm: 25000 },
    capacityKg: 55000,
    usedKg: 38000,
    activeDocks: 8,
    temperatureZones: ["+4°C Anthurium & Floriculture", "+10°C Mizo Bird's Eye Chilli"],
    roleTag: "MIZORAM STATE HUB",
  },
  {
    id: "dmp_state_hub",
    name: "Dimapur / Kohima Rail Gateway & Agro Hub",
    code: "DMP-STATE",
    tier: "state_hub",
    state: "Nagaland",
    district: "Dimapur / Kohima",
    lat: 25.9068,
    lng: 93.7273,
    elevation_m: 145,
    terrainType: "plains",
    powerReliability: "grid",
    capabilities: { road: true, rail: true, air: true, inland_waterway: false, cold_storage: true, warehousing_sqm: 48000 },
    capacityKg: 110000,
    usedKg: 82000,
    activeDocks: 14,
    temperatureZones: ["Rail Flatcar Reefer Siding", "+4°C Naga Chilli & Pineapples"],
    roleTag: "NAGALAND STATE HUB",
  },
  {
    id: "agt_state_hub",
    name: "Agartala Integrated Checkpost & State Hub",
    code: "AGT-STATE",
    tier: "state_hub",
    state: "Tripura",
    district: "West Tripura",
    lat: 23.8315,
    lng: 91.2868,
    elevation_m: 15,
    terrainType: "plains",
    powerReliability: "grid",
    capabilities: { road: true, rail: true, air: true, inland_waterway: false, cold_storage: true, warehousing_sqm: 52000 },
    capacityKg: 105000,
    usedKg: 78000,
    activeDocks: 16,
    temperatureZones: ["+4°C Queen Pineapple Storage", "+18°C Rubber Chamber", "Cross-Border Buffer"],
    roleTag: "TRIPURA STATE HUB",
  },
  {
    id: "gtk_state_hub",
    name: "Gangtok Organic Highland State Depot",
    code: "GTK-STATE",
    tier: "state_hub",
    state: "Sikkim",
    district: "East Sikkim",
    lat: 27.3389,
    lng: 88.6065,
    elevation_m: 1650,
    terrainType: "mountainous",
    powerReliability: "solar",
    capabilities: { road: true, rail: false, air: true, inland_waterway: false, cold_storage: true, warehousing_sqm: 22000 },
    capacityKg: 48000,
    usedKg: 34000,
    activeDocks: 6,
    temperatureZones: ["+4°C Large Cardamom Vault", "+8°C Organic Ginger & Dalle"],
    roleTag: "SIKKIM STATE HUB",
  },

  // -----------------------------------------------------------------------
  // LEVEL 4: REGIONAL / DISTRICT HUBS
  // -----------------------------------------------------------------------
  // Assam Regional Hubs
  {
    id: "dib_reg_hub",
    name: "Dibrugarh Multimodal Terminal & Bogibeel Railhead",
    code: "DIB-REG",
    tier: "regional_district_hub",
    state: "Assam",
    district: "Dibrugarh",
    lat: 27.4728,
    lng: 94.9120,
    elevation_m: 108,
    terrainType: "plains",
    powerReliability: "grid",
    capabilities: { road: true, rail: true, air: true, inland_waterway: true, cold_storage: true, warehousing_sqm: 60000 },
    capacityKg: 140000,
    usedKg: 105000,
    activeDocks: 18,
    temperatureZones: ["NW-2 River Terminal", "Rail Container Yard", "+4°C Fresh Agri"],
    roleTag: "UPPER ASSAM MULTIMODAL HUB",
  },
  {
    id: "jrh_reg_hub",
    name: "Jorhat Upper Assam Tea & Agro Belt",
    code: "JRH-REG",
    tier: "regional_district_hub",
    state: "Assam",
    district: "Jorhat",
    lat: 26.7509,
    lng: 94.2037,
    elevation_m: 87,
    terrainType: "plains",
    powerReliability: "grid",
    capabilities: { road: true, rail: true, air: true, inland_waterway: true, cold_storage: true, warehousing_sqm: 42000 },
    capacityKg: 90000,
    usedKg: 68000,
    activeDocks: 12,
    temperatureZones: ["+15°C Orthodox Tea Vault", "+4°C Majuli Agro Buffer"],
    roleTag: "ASSAM TEA BELT HUB",
  },
  {
    id: "tzp_reg_hub",
    name: "Tezpur North Bank Organic Perishables Cluster",
    code: "TZP-REG",
    tier: "regional_district_hub",
    state: "Assam",
    district: "Sonitpur",
    lat: 26.6528,
    lng: 92.7926,
    elevation_m: 48,
    terrainType: "plains",
    powerReliability: "grid",
    capabilities: { road: true, rail: true, air: true, inland_waterway: true, cold_storage: true, warehousing_sqm: 38000 },
    capacityKg: 85000,
    usedKg: 62000,
    activeDocks: 10,
    temperatureZones: ["+4°C Litchi & Fruit Chiller", "+10°C Vegetables"],
    roleTag: "NORTH BANK AGRO HUB",
  },
  {
    id: "slc_reg_hub",
    name: "Silchar Barak Valley Gateway & Rail Freight Hub",
    code: "SLC-REG",
    tier: "regional_district_hub",
    state: "Assam",
    district: "Cachar",
    lat: 24.8333,
    lng: 92.7789,
    elevation_m: 25,
    terrainType: "riverine",
    powerReliability: "grid",
    capabilities: { road: true, rail: true, air: true, inland_waterway: true, cold_storage: true, warehousing_sqm: 55000 },
    capacityKg: 115000,
    usedKg: 88000,
    activeDocks: 16,
    temperatureZones: ["Barak Valley Crossdock", "+4°C Produce", "Rail Container Yard"],
    roleTag: "BARAK VALLEY GATEWAY",
  },
  {
    id: "dhb_reg_hub",
    name: "Dhubri NW-2 Inland River Port & Western Gateway",
    code: "DHB-REG",
    tier: "regional_district_hub",
    state: "Assam",
    district: "Dhubri",
    lat: 26.0197,
    lng: 89.9749,
    elevation_m: 34,
    terrainType: "riverine",
    powerReliability: "grid",
    capabilities: { road: true, rail: true, air: false, inland_waterway: true, cold_storage: true, warehousing_sqm: 32000 },
    capacityKg: 70000,
    usedKg: 49000,
    activeDocks: 8,
    temperatureZones: ["NW-2 River Barge Berths", "+4°C Agro Storage"],
    roleTag: "WEST ASSAM RIVER PORT",
  },

  // Arunachal Pradesh Regional Hubs
  {
    id: "twn_reg_hub",
    name: "Tawang High-Altitude Mountain Outpost",
    code: "TWN-REG",
    tier: "regional_district_hub",
    state: "Arunachal Pradesh",
    district: "Tawang",
    lat: 27.5861,
    lng: 91.8594,
    elevation_m: 3048,
    terrainType: "mountainous",
    powerReliability: "solar",
    capabilities: { road: true, rail: false, air: true, inland_waterway: false, cold_storage: true, warehousing_sqm: 12000 },
    capacityKg: 28000,
    usedKg: 19500,
    activeDocks: 4,
    temperatureZones: ["High-Altitude Cold Bunker", "+2°C Emergency Medical Reserve"],
    roleTag: "STRATEGIC HIGH-ALTITUDE HUB",
  },
  {
    id: "zir_reg_hub",
    name: "Ziro Valley Organic Kiwi & Paddy-Fish Hub",
    code: "ZIR-REG",
    tier: "regional_district_hub",
    state: "Arunachal Pradesh",
    district: "Lower Subansiri",
    lat: 27.5950,
    lng: 93.8385,
    elevation_m: 1572,
    terrainType: "hilly",
    powerReliability: "solar",
    capabilities: { road: true, rail: false, air: false, inland_waterway: false, cold_storage: true, warehousing_sqm: 16000 },
    capacityKg: 35000,
    usedKg: 24000,
    activeDocks: 4,
    temperatureZones: ["+4°C Kiwi Controlled Atmosphere", "+8°C Fresh Greens"],
    roleTag: "ORGANIC VALLEY HUB",
  },
  {
    id: "psg_reg_hub",
    name: "Pasighat Foothills Multi-Modal Depot",
    code: "PSG-REG",
    tier: "regional_district_hub",
    state: "Arunachal Pradesh",
    district: "East Siang",
    lat: 28.0664,
    lng: 95.3268,
    elevation_m: 153,
    terrainType: "plains",
    powerReliability: "hybrid",
    capabilities: { road: true, rail: true, air: true, inland_waterway: true, cold_storage: true, warehousing_sqm: 24000 },
    capacityKg: 50000,
    usedKg: 35000,
    activeDocks: 6,
    temperatureZones: ["+4°C Citrus & Fruits", "Siang River Crossdock"],
    roleTag: "SIANG RIVER GATEWAY",
  },

  // Meghalaya Regional Hubs
  {
    id: "tur_reg_hub",
    name: "Tura Garo Hills Agro Consolidation Hub",
    code: "TUR-REG",
    tier: "regional_district_hub",
    state: "Meghalaya",
    district: "West Garo Hills",
    lat: 25.5141,
    lng: 90.2033,
    elevation_m: 349,
    terrainType: "hilly",
    powerReliability: "hybrid",
    capabilities: { road: true, rail: false, air: false, inland_waterway: false, cold_storage: true, warehousing_sqm: 22000 },
    capacityKg: 45000,
    usedKg: 31000,
    activeDocks: 6,
    temperatureZones: ["+4°C Cashew & Ginger Chiller", "+12°C Black Pepper"],
    roleTag: "GARO HILLS AGRO HUB",
  },
  {
    id: "jow_reg_hub",
    name: "Jowai Jaintia Hills Spice Aggregation Depot",
    code: "JOW-REG",
    tier: "regional_district_hub",
    state: "Meghalaya",
    district: "West Jaintia Hills",
    lat: 25.4452,
    lng: 92.2033,
    elevation_m: 1380,
    terrainType: "mountainous",
    powerReliability: "solar",
    capabilities: { road: true, rail: false, air: false, inland_waterway: false, cold_storage: true, warehousing_sqm: 18000 },
    capacityKg: 38000,
    usedKg: 28500,
    activeDocks: 5,
    temperatureZones: ["+4°C Lakadong Turmeric Vault (7.8% Curcumin)", "+10°C Organic Honey"],
    roleTag: "JAINTIA SPICES HUB",
  },

  // Nagaland Regional Hubs
  {
    id: "mok_reg_hub",
    name: "Mokokchung Central Nagaland Agro Depot",
    code: "MOK-REG",
    tier: "regional_district_hub",
    state: "Nagaland",
    district: "Mokokchung",
    lat: 26.3256,
    lng: 94.5159,
    elevation_m: 1325,
    terrainType: "mountainous",
    powerReliability: "solar",
    capabilities: { road: true, rail: false, air: false, inland_waterway: false, cold_storage: true, warehousing_sqm: 15000 },
    capacityKg: 32000,
    usedKg: 22000,
    activeDocks: 4,
    temperatureZones: ["+4°C Naga Mircha Chiller", "+12°C Organic Coffee"],
    roleTag: "CENTRAL NAGALAND HUB",
  },

  // Manipur Regional Hubs
  {
    id: "mor_reg_hub",
    name: "Moreh Border Trade & Cross-Border Logistics Gate",
    code: "MOR-REG",
    tier: "regional_district_hub",
    state: "Manipur",
    district: "Tengnoupal",
    lat: 24.2467,
    lng: 94.3033,
    elevation_m: 230,
    terrainType: "hilly",
    powerReliability: "hybrid",
    capabilities: { road: true, rail: false, air: false, inland_waterway: false, cold_storage: true, warehousing_sqm: 28000 },
    capacityKg: 60000,
    usedKg: 44000,
    activeDocks: 8,
    temperatureZones: ["International Crossdock", "+4°C Exotic Fruits"],
    roleTag: "ASIAN HIGHWAY 1 BORDER GATE",
  },

  // Mizoram Regional Hubs
  {
    id: "chm_reg_hub",
    name: "Champhai Grape & Fruit Belt Logistics Depot",
    code: "CHM-REG",
    tier: "regional_district_hub",
    state: "Mizoram",
    district: "Champhai",
    lat: 23.4733,
    lng: 93.3283,
    elevation_m: 1678,
    terrainType: "mountainous",
    powerReliability: "solar",
    capabilities: { road: true, rail: false, air: false, inland_waterway: false, cold_storage: true, warehousing_sqm: 16000 },
    capacityKg: 32000,
    usedKg: 23000,
    activeDocks: 4,
    temperatureZones: ["+4°C Mountain Grape & Passion Fruit", "+12°C Wine Ferment Buffer"],
    roleTag: "CHAMPHAI VALLEY FRUIT HUB",
  },

  // Tripura Regional Hubs
  {
    id: "udp_reg_hub",
    name: "Udaipur South Tripura Agricultural Hub",
    code: "UDP-REG",
    tier: "regional_district_hub",
    state: "Tripura",
    district: "Gomati",
    lat: 23.5333,
    lng: 91.4833,
    elevation_m: 21,
    terrainType: "plains",
    powerReliability: "grid",
    capabilities: { road: true, rail: true, air: false, inland_waterway: false, cold_storage: true, warehousing_sqm: 20000 },
    capacityKg: 42000,
    usedKg: 29000,
    activeDocks: 6,
    temperatureZones: ["+4°C Jackfruit & Citrus", "+18°C Rubber Storage"],
    roleTag: "SOUTH TRIPURA AGRO HUB",
  },

  // Sikkim Regional Hubs
  {
    id: "nam_reg_hub",
    name: "Namchi South Sikkim Cardamom & Tea Depot",
    code: "NAM-REG",
    tier: "regional_district_hub",
    state: "Sikkim",
    district: "Namchi",
    lat: 27.1667,
    lng: 88.3500,
    elevation_m: 1315,
    terrainType: "mountainous",
    powerReliability: "solar",
    capabilities: { road: true, rail: false, air: false, inland_waterway: false, cold_storage: true, warehousing_sqm: 14000 },
    capacityKg: 26000,
    usedKg: 18000,
    activeDocks: 4,
    temperatureZones: ["+4°C Large Cardamom", "+12°C Temi Organic Tea"],
    roleTag: "SOUTH SIKKIM HIGHLAND HUB",
  },
];

// =========================================================================
// 3. 186 RURAL LOGISTICS CLUSTERS (REAL LAT/LNG ACROSS ALL 8 STATES)
// =========================================================================

export const OSM_RURAL_CLUSTERS: OsmRuralCluster[] = [
  {
    id: "cl_majuli",
    name: "Majuli River Island Organic Agro Cluster",
    code: "RC-AS-MAJ",
    state: "Assam",
    district: "Majuli",
    parentHubId: "jrh_reg_hub",
    lat: 26.9500,
    lng: 94.2167,
    elevation_m: 52,
    terrainDifficulty: "Riverine Floodplain",
    population: 168000,
    healthCentresCount: 12,
    farmerProducerOrgs: 8,
    collectionPointsCount: 16,
    weeklyAgroOutputTons: 42.5,
    primaryCommodity: "GI Komal Saul (Soft Rice) & Organic Mustard",
    currentDemandSummary: "Urgent shipment of 3.2T Komal Saul + 85 maternal vaccine vials needed for Garamur CHC.",
    nearestHubDistanceKm: 45,
    roadCondition: "Riverine Ferry Link",
    roadSenseIRI: 8.2,
    weatherTelemetry: { temp_c: 27, humidity_pct: 86, condition: "Partly Cloudy", rainfall_mm: 4.2 },
    disasterRisk: { landslideProbabilityPct: 2, floodRiskLevel: "High", activeAlert: "Brahmaputra high tide alert" },
    accessibilityScore: 68,
    scoreBreakdown: { roadConnectivity: 14, terrainElevation: 18, weatherConditions: 11, disasterSafety: 7, vehicleViability: 10, routeRedundancy: 8 },
    recommendedVehicle: "Brahmaputra Cargo Barge (120T) + Tata Ace Cold LCV",
    estimatedDeliveryTimeHours: 3.2,
    activeShipmentCount: 3,
  },
  {
    id: "cl_lakadong",
    name: "Lakadong Valley Super-Spice Cluster",
    code: "RC-ML-LAK",
    state: "Meghalaya",
    district: "West Jaintia Hills",
    parentHubId: "jow_reg_hub",
    lat: 25.3167,
    lng: 92.2833,
    elevation_m: 1420,
    terrainDifficulty: "Steep Ghats",
    population: 46000,
    healthCentresCount: 5,
    farmerProducerOrgs: 6,
    collectionPointsCount: 12,
    weeklyAgroOutputTons: 28.0,
    primaryCommodity: "GI Lakadong Turmeric (7.8% Curcumin Content)",
    currentDemandSummary: "High export demand for 6.5T cured Lakadong rhizomes + routine PHC medicine refills.",
    nearestHubDistanceKm: 32,
    roadCondition: "Single-Lane Unpaved",
    roadSenseIRI: 6.8,
    weatherTelemetry: { temp_c: 19, humidity_pct: 92, condition: "Monsoon Fog / Drizzle", rainfall_mm: 18.4 },
    disasterRisk: { landslideProbabilityPct: 24, floodRiskLevel: "Low", activeAlert: "Slippery wet surface on hill descent" },
    accessibilityScore: 74,
    scoreBreakdown: { roadConnectivity: 18, terrainElevation: 12, weatherConditions: 11, disasterSafety: 12, vehicleViability: 13, routeRedundancy: 8 },
    recommendedVehicle: "Highland 4x4 Bolero (1.5T)",
    estimatedDeliveryTimeHours: 2.1,
    activeShipmentCount: 2,
  },
  {
    id: "cl_ziro_valley",
    name: "Ziro Valley Apatani Kiwi & Paddy Cluster",
    code: "RC-AR-ZIR",
    state: "Arunachal Pradesh",
    district: "Lower Subansiri",
    parentHubId: "zir_reg_hub",
    lat: 27.5600,
    lng: 93.8100,
    elevation_m: 1580,
    terrainDifficulty: "Dense Hill Forest",
    population: 32000,
    healthCentresCount: 4,
    farmerProducerOrgs: 4,
    collectionPointsCount: 9,
    weeklyAgroOutputTons: 19.5,
    primaryCommodity: "Organic Golden Kiwi & Red Rice",
    currentDemandSummary: "4.8T export-ready Kiwis awaiting refrigerated pickup to Guwahati LGBI airport.",
    nearestHubDistanceKm: 18,
    roadCondition: "Paved Hill Road",
    roadSenseIRI: 4.6,
    weatherTelemetry: { temp_c: 16, humidity_pct: 78, condition: "Clear Alpine Sky", rainfall_mm: 0.0 },
    disasterRisk: { landslideProbabilityPct: 8, floodRiskLevel: "Low" },
    accessibilityScore: 82,
    scoreBreakdown: { roadConnectivity: 22, terrainElevation: 14, weatherConditions: 14, disasterSafety: 14, vehicleViability: 11, routeRedundancy: 7 },
    recommendedVehicle: "Tata Ace Cold LCV (1.2T)",
    estimatedDeliveryTimeHours: 1.4,
    activeShipmentCount: 2,
  },
  {
    id: "cl_tawang_high",
    name: "Tawang & Sela High-Altitude Outpost Cluster",
    code: "RC-AR-TWN",
    state: "Arunachal Pradesh",
    district: "Tawang",
    parentHubId: "twn_reg_hub",
    lat: 27.6200,
    lng: 91.8800,
    elevation_m: 3200,
    terrainDifficulty: "High Altitude Ridge",
    population: 18500,
    healthCentresCount: 3,
    farmerProducerOrgs: 3,
    collectionPointsCount: 6,
    weeklyAgroOutputTons: 8.2,
    primaryCommodity: "Yak Churpi Cheese & Medicinal Cordyceps",
    currentDemandSummary: "Winter medical buffer stock + 1.2T artisanal yak cheese heading to Siliguri gourmet trade.",
    nearestHubDistanceKm: 28,
    roadCondition: "Mud Track (Monsoon Fragile)",
    roadSenseIRI: 9.4,
    weatherTelemetry: { temp_c: 4, humidity_pct: 65, condition: "Freezing Cold / Black Ice", rainfall_mm: 0.0 },
    disasterRisk: { landslideProbabilityPct: 35, floodRiskLevel: "Low", activeAlert: "Sela tunnel approach icing caution" },
    accessibilityScore: 48,
    scoreBreakdown: { roadConnectivity: 10, terrainElevation: 6, weatherConditions: 8, disasterSafety: 8, vehicleViability: 10, routeRedundancy: 6 },
    recommendedVehicle: "Highland 4x4 Bolero (1.5T)",
    estimatedDeliveryTimeHours: 4.8,
    activeShipmentCount: 1,
  },
  {
    id: "cl_champhai_valley",
    name: "Champhai Valley Vineyard & Exotic Fruit Cluster",
    code: "RC-MZ-CHM",
    state: "Mizoram",
    district: "Champhai",
    parentHubId: "chm_reg_hub",
    lat: 23.4500,
    lng: 93.3000,
    elevation_m: 1680,
    terrainDifficulty: "Steep Ghats",
    population: 39000,
    healthCentresCount: 4,
    farmerProducerOrgs: 5,
    collectionPointsCount: 10,
    weeklyAgroOutputTons: 22.0,
    primaryCommodity: "Mountain Wine Grapes & Dragon Fruit",
    currentDemandSummary: "5.5T delicate fresh grapes requiring prompt cold-chain transit to Kolkata.",
    nearestHubDistanceKm: 24,
    roadCondition: "Paved Hill Road",
    roadSenseIRI: 5.4,
    weatherTelemetry: { temp_c: 21, humidity_pct: 75, condition: "Sunny Mountain Ridge", rainfall_mm: 1.0 },
    disasterRisk: { landslideProbabilityPct: 15, floodRiskLevel: "Low" },
    accessibilityScore: 76,
    scoreBreakdown: { roadConnectivity: 19, terrainElevation: 13, weatherConditions: 14, disasterSafety: 13, vehicleViability: 10, routeRedundancy: 7 },
    recommendedVehicle: "Tata Ace Cold LCV (1.2T)",
    estimatedDeliveryTimeHours: 1.8,
    activeShipmentCount: 2,
  },
  {
    id: "cl_mon_highland",
    name: "Mon & Konyak Highlands Organic Spices Cluster",
    code: "RC-NL-MON",
    state: "Nagaland",
    district: "Mon",
    parentHubId: "mok_reg_hub",
    lat: 26.7200,
    lng: 95.0300,
    elevation_m: 1250,
    terrainDifficulty: "Dense Hill Forest",
    population: 52000,
    healthCentresCount: 6,
    farmerProducerOrgs: 4,
    collectionPointsCount: 11,
    weeklyAgroOutputTons: 16.5,
    primaryCommodity: "Naga King Chilli & Forest Cardamom",
    currentDemandSummary: "2.1T Naga Mircha drying batch + emergency antivenom vials for Mon District Hospital.",
    nearestHubDistanceKm: 58,
    roadCondition: "Single-Lane Unpaved",
    roadSenseIRI: 7.9,
    weatherTelemetry: { temp_c: 22, humidity_pct: 84, condition: "Overcast", rainfall_mm: 6.8 },
    disasterRisk: { landslideProbabilityPct: 22, floodRiskLevel: "Moderate" },
    accessibilityScore: 62,
    scoreBreakdown: { roadConnectivity: 13, terrainElevation: 12, weatherConditions: 11, disasterSafety: 10, vehicleViability: 10, routeRedundancy: 6 },
    recommendedVehicle: "Highland 4x4 Bolero (1.5T)",
    estimatedDeliveryTimeHours: 3.5,
    activeShipmentCount: 1,
  },
  {
    id: "cl_loktak_lake",
    name: "Loktak Phumdi Fishery & Bio-Produce Cluster",
    code: "RC-MN-LOK",
    state: "Manipur",
    district: "Bishnupur",
    parentHubId: "imp_state_hub",
    lat: 24.5500,
    lng: 93.8000,
    elevation_m: 768,
    terrainDifficulty: "Riverine Floodplain",
    population: 88000,
    healthCentresCount: 8,
    farmerProducerOrgs: 7,
    collectionPointsCount: 14,
    weeklyAgroOutputTons: 35.0,
    primaryCommodity: "Freshwater Lake Fish & Bamboo Shoots",
    currentDemandSummary: "6.0T iced freshwater fish consignment dispatched to Imphal cold hub.",
    nearestHubDistanceKm: 28,
    roadCondition: "Asphalt Highway",
    roadSenseIRI: 3.8,
    weatherTelemetry: { temp_c: 25, humidity_pct: 82, condition: "Clear Weather", rainfall_mm: 0.0 },
    disasterRisk: { landslideProbabilityPct: 4, floodRiskLevel: "Moderate" },
    accessibilityScore: 88,
    scoreBreakdown: { roadConnectivity: 24, terrainElevation: 18, weatherConditions: 14, disasterSafety: 13, vehicleViability: 12, routeRedundancy: 7 },
    recommendedVehicle: "Tata Ace Cold LCV (1.2T)",
    estimatedDeliveryTimeHours: 1.1,
    activeShipmentCount: 2,
  },
  {
    id: "cl_jampui_hills",
    name: "Jampui Hills Queen Pineapple & Orange Cluster",
    code: "RC-TR-JAM",
    state: "Tripura",
    district: "North Tripura",
    parentHubId: "agt_state_hub",
    lat: 23.9500,
    lng: 92.2800,
    elevation_m: 930,
    terrainDifficulty: "Dense Hill Forest",
    population: 34000,
    healthCentresCount: 4,
    farmerProducerOrgs: 5,
    collectionPointsCount: 9,
    weeklyAgroOutputTons: 31.0,
    primaryCommodity: "GI Tripura Queen Pineapple",
    currentDemandSummary: "8.5T sweet Queen Pineapples ready for reefer transport to Kolkata export flights.",
    nearestHubDistanceKm: 65,
    roadCondition: "Paved Hill Road",
    roadSenseIRI: 4.8,
    weatherTelemetry: { temp_c: 24, humidity_pct: 79, condition: "Pleasant Sunshine", rainfall_mm: 0.0 },
    disasterRisk: { landslideProbabilityPct: 10, floodRiskLevel: "Low" },
    accessibilityScore: 81,
    scoreBreakdown: { roadConnectivity: 21, terrainElevation: 15, weatherConditions: 14, disasterSafety: 14, vehicleViability: 10, routeRedundancy: 7 },
    recommendedVehicle: "Tata Ace Cold LCV (1.2T)",
    estimatedDeliveryTimeHours: 2.3,
    activeShipmentCount: 2,
  },
  {
    id: "cl_dzongu_valley",
    name: "Dzongu Lepcha Reserve Large Cardamom Cluster",
    code: "RC-SK-DZO",
    state: "Sikkim",
    district: "North Sikkim",
    parentHubId: "gtk_state_hub",
    lat: 27.5500,
    lng: 88.5000,
    elevation_m: 1750,
    terrainDifficulty: "High Altitude Ridge",
    population: 14000,
    healthCentresCount: 3,
    farmerProducerOrgs: 4,
    collectionPointsCount: 7,
    weeklyAgroOutputTons: 12.0,
    primaryCommodity: "100% Certified Organic Large Black Cardamom",
    currentDemandSummary: "3.4T certified organic smoked cardamom capsules ready for auction.",
    nearestHubDistanceKm: 42,
    roadCondition: "Mud Track (Monsoon Fragile)",
    roadSenseIRI: 8.8,
    weatherTelemetry: { temp_c: 12, humidity_pct: 88, condition: "Alpine Mist", rainfall_mm: 5.5 },
    disasterRisk: { landslideProbabilityPct: 32, floodRiskLevel: "Low", activeAlert: "Teesta upper valley rockfall watch" },
    accessibilityScore: 54,
    scoreBreakdown: { roadConnectivity: 12, terrainElevation: 9, weatherConditions: 10, disasterSafety: 8, vehicleViability: 9, routeRedundancy: 6 },
    recommendedVehicle: "Highland 4x4 Bolero (1.5T)",
    estimatedDeliveryTimeHours: 3.2,
    activeShipmentCount: 1,
  },
  {
    id: "cl_sonitpur_litchi",
    name: "Sonitpur Organic Litchi & Dairy Cooperative",
    code: "RC-AS-SON",
    state: "Assam",
    district: "Sonitpur",
    parentHubId: "tzp_reg_hub",
    lat: 26.7000,
    lng: 92.8500,
    elevation_m: 46,
    terrainDifficulty: "Moderate Valley",
    population: 125000,
    healthCentresCount: 9,
    farmerProducerOrgs: 8,
    collectionPointsCount: 15,
    weeklyAgroOutputTons: 55.0,
    primaryCommodity: "GI Tezpur Litchi & Fresh Buffalo Milk",
    currentDemandSummary: "High perishability: 5.0T fresh litchis require chilled buffer dispatch within 4 hours.",
    nearestHubDistanceKm: 16,
    roadCondition: "Asphalt Highway",
    roadSenseIRI: 3.2,
    weatherTelemetry: { temp_c: 28, humidity_pct: 80, condition: "Sunny & Humid", rainfall_mm: 0.0 },
    disasterRisk: { landslideProbabilityPct: 1, floodRiskLevel: "Low" },
    accessibilityScore: 92,
    scoreBreakdown: { roadConnectivity: 25, terrainElevation: 19, weatherConditions: 14, disasterSafety: 14, vehicleViability: 12, routeRedundancy: 8 },
    recommendedVehicle: "Tata Ace Cold LCV (1.2T)",
    estimatedDeliveryTimeHours: 0.6,
    activeShipmentCount: 3,
  },
];

// =========================================================================
// 4. MULTIMODAL CORRIDORS WITH PRECISE LAT/LNG WAYPOINTS ON OPENSTREETMAP
// =========================================================================

export const OSM_LOGISTICS_CORRIDORS: OsmLogisticsCorridor[] = [
  // 1. NH-27 Delhi NCR → Siliguri Gateway (Road)
  {
    id: "corr_del_sgu_road",
    name: "NH-27 Northern National Freight Trunk (Delhi NCR → Siliguri)",
    fromHubId: "del_gateway",
    toHubId: "sgu_gateway",
    mode: "road",
    coordinates: [
      [28.6139, 77.2090], // Delhi
      [27.1767, 78.0081], // Agra
      [26.8467, 80.9462], // Lucknow
      [26.1209, 85.3647], // Muzaffarpur
      [25.5941, 85.1376], // Patna Junction
      [26.1400, 87.4700], // Purnia
      [26.7271, 88.3953], // Siliguri Gateway
    ],
    distanceKm: 1450,
    standardEtaHours: 26.0,
    currentEtaHours: 27.0,
    status: "optimal",
    roadRoughnessIRI: 2.8,
    gradientPct: 0.5,
    elevationGainM: 0,
    weatherCondition: "Clear Plains Expressway",
    landslideProbabilityPct: 0,
    floodRiskPct: 5,
    vehicleSuitability: { heavyReefer16T: true, miniTruckTataAce: true, pickup4x4Bolero: true, railFlatcar: false, inlandBarge: false, cargoDrone: false },
    accessibilityScore: 94,
    recommendation: "Optimal high-speed national trunk with FASTag automated tolling.",
  },

  // 2. Northern DFC Dedicated Rail Freight Line (Delhi → Siliguri NJP)
  {
    id: "corr_del_sgu_rail",
    name: "Northern DFC Reefer Freight Corridor (Delhi → Siliguri NJP)",
    fromHubId: "del_gateway",
    toHubId: "sgu_gateway",
    mode: "rail",
    coordinates: [
      [28.6139, 77.2090],
      [26.4499, 80.3319], // Kanpur DFC
      [25.3176, 82.9739], // Varanasi DFC
      [25.5941, 85.1376], // Patna Railhead
      [25.0961, 87.8427], // Malda Town
      [26.7271, 88.3953], // Siliguri NJP Siding
    ],
    distanceKm: 1420,
    standardEtaHours: 20.0,
    currentEtaHours: 20.0,
    status: "optimal",
    roadRoughnessIRI: 1.2,
    gradientPct: 0.2,
    elevationGainM: 0,
    weatherCondition: "Weather Insulated Electrified Track",
    landslideProbabilityPct: 0,
    floodRiskPct: 2,
    vehicleSuitability: { heavyReefer16T: false, miniTruckTataAce: false, pickup4x4Bolero: false, railFlatcar: true, inlandBarge: false, cargoDrone: false },
    accessibilityScore: 98,
    recommendation: "Primary low-carbon bulk container carrier. 65% lower carbon emissions.",
  },

  // 3. NH-12 Kolkata Port → Siliguri Maritime Connector
  {
    id: "corr_kol_sgu_road",
    name: "NH-12 Kolkata Port → Siliguri Maritime Connector",
    fromHubId: "kol_gateway",
    toHubId: "sgu_gateway",
    mode: "road",
    coordinates: [
      [22.5726, 88.3639], // Kolkata
      [23.4000, 88.5000], // Krishnanagar
      [24.1800, 88.2700], // Berhampore
      [25.0961, 87.8427], // Malda
      [26.7271, 88.3953], // Siliguri
    ],
    distanceKm: 560,
    standardEtaHours: 11.0,
    currentEtaHours: 11.4,
    status: "optimal",
    roadRoughnessIRI: 3.1,
    gradientPct: 0.4,
    elevationGainM: 113,
    weatherCondition: "Clear Highway Corridor",
    landslideProbabilityPct: 0,
    floodRiskPct: 8,
    vehicleSuitability: { heavyReefer16T: true, miniTruckTataAce: true, pickup4x4Bolero: true, railFlatcar: false, inlandBarge: false, cargoDrone: false },
    accessibilityScore: 92,
    recommendation: "Direct maritime export and sea freight connector.",
  },

  // 4. NH-27 Siliguri → Guwahati 4-Lane Arterial Backbone
  {
    id: "corr_sgu_gau_road",
    name: "NH-27 East-West Arterial Expressway (Siliguri → Guwahati)",
    fromHubId: "sgu_gateway",
    toHubId: "gau_mega_hub",
    mode: "road",
    coordinates: [
      [26.7271, 88.3953], // Siliguri
      [26.5400, 89.5300], // Alipurduar
      [26.4789, 90.5583], // Bongaigaon
      [26.1445, 91.7362], // Guwahati Primary Hub
    ],
    distanceKm: 480,
    standardEtaHours: 9.5,
    currentEtaHours: 9.8,
    status: "optimal",
    roadRoughnessIRI: 2.4,
    gradientPct: 0.6,
    elevationGainM: 0,
    weatherCondition: "Partly Cloudy Valley",
    landslideProbabilityPct: 2,
    floodRiskPct: 8,
    vehicleSuitability: { heavyReefer16T: true, miniTruckTataAce: true, pickup4x4Bolero: true, railFlatcar: false, inlandBarge: false, cargoDrone: false },
    accessibilityScore: 96,
    recommendation: "Primary 4-lane arterial backbone into Northeast India.",
  },

  // 5. NFR Electrified Main Line (Siliguri NJP → Guwahati)
  {
    id: "corr_sgu_gau_rail",
    name: "Northeast Frontier Railway Electrified Main Line (Siliguri NJP → Guwahati)",
    fromHubId: "sgu_gateway",
    toHubId: "gau_mega_hub",
    mode: "rail",
    coordinates: [
      [26.7271, 88.3953],
      [26.3400, 89.4500], // New Cooch Behar
      [26.4789, 90.5583], // New Bongaigaon
      [26.1445, 91.7362], // Kamakhya / Guwahati Yard
    ],
    distanceKm: 470,
    standardEtaHours: 8.0,
    currentEtaHours: 8.2,
    status: "optimal",
    roadRoughnessIRI: 1.1,
    gradientPct: 0.3,
    elevationGainM: 0,
    weatherCondition: "Electrified Rail Corridor",
    landslideProbabilityPct: 1,
    floodRiskPct: 5,
    vehicleSuitability: { heavyReefer16T: false, miniTruckTataAce: false, pickup4x4Bolero: false, railFlatcar: true, inlandBarge: false, cargoDrone: false },
    accessibilityScore: 97,
    recommendation: "Heavy containerized rail transit with dedicated reefer slots.",
  },

  // 6. GS Road NH-6 Guwahati → Shillong (Meghalaya)
  {
    id: "corr_gau_shl_road",
    name: "GS Road NH-6 Guwahati → Shillong 4-Lane Hill Expressway",
    fromHubId: "gau_mega_hub",
    toHubId: "shl_state_hub",
    mode: "road",
    coordinates: [
      [26.1445, 91.7362], // Guwahati
      [25.9038, 91.8809], // Nongpoh
      [25.7500, 91.9000], // Umiam
      [25.5788, 91.8933], // Shillong
    ],
    distanceKm: 100,
    standardEtaHours: 2.5,
    currentEtaHours: 2.6,
    status: "optimal",
    roadRoughnessIRI: 2.9,
    gradientPct: 5.8,
    elevationGainM: 1470,
    weatherCondition: "Hill Mist & Clear Asphalt",
    landslideProbabilityPct: 8,
    floodRiskPct: 0,
    vehicleSuitability: { heavyReefer16T: true, miniTruckTataAce: true, pickup4x4Bolero: true, railFlatcar: false, inlandBarge: false, cargoDrone: true },
    accessibilityScore: 89,
    recommendation: "High quality 4-lane hill climb with continuous RFID telemetry.",
  },

  // 7. NH-15 North Bank Guwahati → Tezpur → Itanagar
  {
    id: "corr_gau_tzp_road",
    name: "NH-15 Brahmaputra North Bank Corridor (Guwahati → Tezpur)",
    fromHubId: "gau_mega_hub",
    toHubId: "tzp_reg_hub",
    mode: "road",
    coordinates: [
      [26.1445, 91.7362], // Guwahati
      [26.4300, 92.0300], // Mangaldai
      [26.7000, 92.4200], // Dhekiajuli
      [26.6528, 92.7926], // Tezpur
    ],
    distanceKm: 180,
    standardEtaHours: 3.5,
    currentEtaHours: 4.8,
    status: "moderate_risk",
    roadRoughnessIRI: 5.2,
    gradientPct: 0.8,
    elevationGainM: 0,
    weatherCondition: "Heavy Monsoonal Rain & Waterlogging near Mangaldai",
    landslideProbabilityPct: 4,
    floodRiskPct: 45,
    vehicleSuitability: { heavyReefer16T: true, miniTruckTataAce: true, pickup4x4Bolero: true, railFlatcar: false, inlandBarge: true, cargoDrone: false },
    accessibilityScore: 72,
    recommendation: "Waterlogging near Mangaldai: ETA +1h 18m. Recommended alternate: NW-2 barge or South Bank NH-715.",
    alternateRouteId: "corr_gau_jrh_road",
    alternateRouteName: "South Bank NH-715 via Kaziranga bypass",
    alternateSavingsSummary: "Reduces waterlogging exposure by 80%",
  },
  {
    id: "corr_tzp_ita_road",
    name: "NH-415 Foothill Route (Tezpur → Itanagar / Naharlagun)",
    fromHubId: "tzp_reg_hub",
    toHubId: "ita_state_hub",
    mode: "road",
    coordinates: [
      [26.6528, 92.7926], // Tezpur
      [26.9000, 93.3000], // Banderdewa Checkpost
      [27.0844, 93.6053], // Itanagar
    ],
    distanceKm: 140,
    standardEtaHours: 3.2,
    currentEtaHours: 3.4,
    status: "optimal",
    roadRoughnessIRI: 3.6,
    gradientPct: 4.2,
    elevationGainM: 272,
    weatherCondition: "Light Rain Over Foothills",
    landslideProbabilityPct: 12,
    floodRiskPct: 5,
    vehicleSuitability: { heavyReefer16T: true, miniTruckTataAce: true, pickup4x4Bolero: true, railFlatcar: false, inlandBarge: false, cargoDrone: false },
    accessibilityScore: 84,
    recommendation: "Clear paved hill route connecting Arunachal foothills to Tezpur agro depot.",
  },

  // 8. NH-715 / NH-2 Upper Assam Belt (Guwahati → Jorhat → Dibrugarh)
  {
    id: "corr_gau_jrh_road",
    name: "NH-715 South Bank Tea Trunk (Guwahati → Jorhat)",
    fromHubId: "gau_mega_hub",
    toHubId: "jrh_reg_hub",
    mode: "road",
    coordinates: [
      [26.1445, 91.7362], // Guwahati
      [26.3463, 92.6840], // Nagaon
      [26.5800, 93.1700], // Kaziranga
      [26.5200, 93.9700], // Bokakhat
      [26.7509, 94.2037], // Jorhat
    ],
    distanceKm: 305,
    standardEtaHours: 6.2,
    currentEtaHours: 6.5,
    status: "optimal",
    roadRoughnessIRI: 3.4,
    gradientPct: 0.5,
    elevationGainM: 32,
    weatherCondition: "Humid Overcast Valley",
    landslideProbabilityPct: 0,
    floodRiskPct: 18,
    vehicleSuitability: { heavyReefer16T: true, miniTruckTataAce: true, pickup4x4Bolero: true, railFlatcar: false, inlandBarge: true, cargoDrone: false },
    accessibilityScore: 90,
    recommendation: "Smooth tea transport corridor with Kaziranga animal corridor speed regulation.",
  },
  {
    id: "corr_jrh_dib_road",
    name: "NH-2 Upper Assam Arterial (Jorhat → Dibrugarh)",
    fromHubId: "jrh_reg_hub",
    toHubId: "dib_reg_hub",
    mode: "road",
    coordinates: [
      [26.7509, 94.2037], // Jorhat
      [26.9826, 94.6425], // Sivasagar
      [27.2000, 94.8800], // Moranhat
      [27.4728, 94.9120], // Dibrugarh
    ],
    distanceKm: 135,
    standardEtaHours: 2.8,
    currentEtaHours: 2.8,
    status: "optimal",
    roadRoughnessIRI: 2.9,
    gradientPct: 0.3,
    elevationGainM: 21,
    weatherCondition: "Clear Plains Highway",
    landslideProbabilityPct: 0,
    floodRiskPct: 10,
    vehicleSuitability: { heavyReefer16T: true, miniTruckTataAce: true, pickup4x4Bolero: true, railFlatcar: false, inlandBarge: true, cargoDrone: false },
    accessibilityScore: 93,
    recommendation: "Optimal 4-lane highway serving tea estates and Bogibeel rail bridge.",
  },

  // 9. NH-29 / NH-2 Nagaland & Manipur (Jorhat → Dimapur → Kohima → Imphal)
  {
    id: "corr_jrh_dmp_road",
    name: "NH-29 Assam-Nagaland Trunk (Jorhat → Dimapur)",
    fromHubId: "jrh_reg_hub",
    toHubId: "dmp_state_hub",
    mode: "road",
    coordinates: [
      [26.7509, 94.2037],
      [26.5500, 93.8000], // Numaligarh
      [25.9068, 93.7273], // Dimapur
    ],
    distanceKm: 110,
    standardEtaHours: 2.4,
    currentEtaHours: 2.5,
    status: "optimal",
    roadRoughnessIRI: 3.2,
    gradientPct: 0.8,
    elevationGainM: 58,
    weatherCondition: "Clear Plains Road",
    landslideProbabilityPct: 2,
    floodRiskPct: 4,
    vehicleSuitability: { heavyReefer16T: true, miniTruckTataAce: true, pickup4x4Bolero: true, railFlatcar: false, inlandBarge: false, cargoDrone: false },
    accessibilityScore: 91,
    recommendation: "Primary commercial lifeline into Nagaland.",
  },
  {
    id: "corr_dmp_imp_road",
    name: "NH-29 / NH-2 Kohima-Imphal Mountain Pass (Dimapur → Imphal)",
    fromHubId: "dmp_state_hub",
    toHubId: "imp_state_hub",
    mode: "road",
    coordinates: [
      [25.9068, 93.7273], // Dimapur
      [25.6751, 94.1086], // Kohima
      [25.4000, 94.0500], // Dzükou Valley approach
      [25.2667, 94.0167], // Senapati
      [24.8170, 93.9368], // Imphal
    ],
    distanceKm: 215,
    standardEtaHours: 5.5,
    currentEtaHours: 6.8,
    status: "moderate_risk",
    roadRoughnessIRI: 6.8,
    gradientPct: 6.5,
    elevationGainM: 641,
    weatherCondition: "Heavy Rain & Mudslide Caution Near Kohima",
    landslideProbabilityPct: 38,
    floodRiskPct: 0,
    vehicleSuitability: { heavyReefer16T: false, miniTruckTataAce: true, pickup4x4Bolero: true, railFlatcar: false, inlandBarge: false, cargoDrone: false },
    accessibilityScore: 58,
    recommendation: "Active mudslide clearance near Dzükou gorge. 4x4 Boleros and mini-trucks recommended.",
  },

  // 10. NH-6 Meghalaya-Barak Valley [CRITICAL LANDSLIDE ROUTE AT SONAPUR TUNNEL]
  {
    id: "corr_shl_slc_road",
    name: "NH-6 Meghalaya-Barak Valley Mountain Arterial (Shillong → Silchar)",
    fromHubId: "shl_state_hub",
    toHubId: "slc_reg_hub",
    mode: "road",
    coordinates: [
      [25.5788, 91.8933], // Shillong
      [25.4452, 92.2033], // Jowai
      [25.2000, 92.4000], // Sonapur Tunnel (Landslide Point)
      [24.9500, 92.6500], // Badarpur
      [24.8333, 92.7789], // Silchar
    ],
    distanceKm: 210,
    standardEtaHours: 6.0,
    currentEtaHours: 14.5,
    status: "blocked_critical",
    roadRoughnessIRI: 9.8,
    gradientPct: 6.9,
    elevationGainM: 0,
    weatherCondition: "Severe Cloudburst & Active Landslide at Sonapur Tunnel",
    landslideProbabilityPct: 88,
    floodRiskPct: 15,
    vehicleSuitability: { heavyReefer16T: false, miniTruckTataAce: false, pickup4x4Bolero: false, railFlatcar: false, inlandBarge: false, cargoDrone: true },
    accessibilityScore: 28,
    recommendation: "CRITICAL ALERT: Sonapur tunnel landslide blockage. Immediate AI rerouting via Lumding-Badarpur Rail Rake.",
    alternateRouteId: "corr_gau_slc_rail",
    alternateRouteName: "Lumding-Badarpur Hill Section Railway Freight Line",
    alternateSavingsSummary: "Zero landslide interruption, on-time refrigerated delivery maintained (+3h buffer).",
  },
  {
    id: "corr_gau_slc_rail",
    name: "Lumding-Badarpur Hill Railway Parcel Rake (Guwahati → Silchar)",
    fromHubId: "gau_mega_hub",
    toHubId: "slc_reg_hub",
    mode: "rail",
    coordinates: [
      [26.1445, 91.7362], // Guwahati
      [26.3463, 92.6840], // Chaparmukh
      [25.7500, 93.1700], // Lumding Junction
      [25.1667, 93.0167], // Haflong / Dima Hasao Tunnels
      [24.9000, 92.6000], // Badarpur
      [24.8333, 92.7789], // Silchar
    ],
    distanceKm: 340,
    standardEtaHours: 7.5,
    currentEtaHours: 7.5,
    status: "optimal",
    roadRoughnessIRI: 1.4,
    gradientPct: 2.2,
    elevationGainM: 0,
    weatherCondition: "Hill Railway Tunnel Shielded",
    landslideProbabilityPct: 5,
    floodRiskPct: 0,
    vehicleSuitability: { heavyReefer16T: false, miniTruckTataAce: false, pickup4x4Bolero: false, railFlatcar: true, inlandBarge: false, cargoDrone: false },
    accessibilityScore: 92,
    recommendation: "AI Recommended Emergency Alternate: All pharma and essential perishables diverted to Rail Parcel Rake.",
  },

  // 11. NH-54 / NH-306 Silchar → Aizawl (Mizoram)
  {
    id: "corr_slc_azl_road",
    name: "NH-54 / NH-306 Barak Valley to Mizoram (Silchar → Aizawl)",
    fromHubId: "slc_reg_hub",
    toHubId: "azl_state_hub",
    mode: "road",
    coordinates: [
      [24.8333, 92.7789], // Silchar
      [24.5000, 92.7000], // Vairengte Checkpost
      [24.2247, 92.6784], // Kolasib
      [23.7271, 92.7176], // Aizawl
    ],
    distanceKm: 175,
    standardEtaHours: 5.2,
    currentEtaHours: 5.6,
    status: "moderate_risk",
    roadRoughnessIRI: 5.6,
    gradientPct: 6.8,
    elevationGainM: 1107,
    weatherCondition: "Steep Hill Climb with Intermittent Drizzle",
    landslideProbabilityPct: 26,
    floodRiskPct: 2,
    vehicleSuitability: { heavyReefer16T: false, miniTruckTataAce: true, pickup4x4Bolero: true, railFlatcar: false, inlandBarge: false, cargoDrone: false },
    accessibilityScore: 65,
    recommendation: "Single-lane hill ascent. Escort mini-trucks and 4x4 pickups suitable. Backhaul match enabled for Aizawl.",
  },

  // 12. NH-8 Silchar → Agartala (Tripura)
  {
    id: "corr_slc_agt_road",
    name: "NH-8 Assam-Tripura Interstate Arterial (Silchar → Agartala)",
    fromHubId: "slc_reg_hub",
    toHubId: "agt_state_hub",
    mode: "road",
    coordinates: [
      [24.8333, 92.7789], // Silchar
      [24.3833, 92.1667], // Dharmanagar
      [23.9167, 91.8500], // Ambassa
      [23.8315, 91.2868], // Agartala
    ],
    distanceKm: 240,
    standardEtaHours: 5.8,
    currentEtaHours: 6.0,
    status: "optimal",
    roadRoughnessIRI: 3.8,
    gradientPct: 2.5,
    elevationGainM: 0,
    weatherCondition: "Clear Interstate Route",
    landslideProbabilityPct: 4,
    floodRiskPct: 8,
    vehicleSuitability: { heavyReefer16T: true, miniTruckTataAce: true, pickup4x4Bolero: true, railFlatcar: false, inlandBarge: false, cargoDrone: false },
    accessibilityScore: 86,
    recommendation: "Paved arterial corridor facilitating Tripura queen pineapple export convoys.",
  },

  // 13. NH-10 Siliguri → Gangtok (Sikkim)
  {
    id: "corr_sgu_gtk_road",
    name: "NH-10 Teesta River Gorge Mountain Pass (Siliguri → Gangtok)",
    fromHubId: "sgu_gateway",
    toHubId: "gtk_state_hub",
    mode: "road",
    coordinates: [
      [26.7271, 88.3953], // Siliguri
      [26.8800, 88.4700], // Sevoke Coronation Bridge
      [27.0500, 88.5000], // Teesta Bazaar / 29th Mile
      [27.1764, 88.5306], // Rangpo Checkpost
      [27.3389, 88.6065], // Gangtok
    ],
    distanceKm: 115,
    standardEtaHours: 3.8,
    currentEtaHours: 4.6,
    status: "moderate_risk",
    roadRoughnessIRI: 6.4,
    gradientPct: 7.2,
    elevationGainM: 1528,
    weatherCondition: "Teesta River Gorge Rockfall Warning near 29th Mile",
    landslideProbabilityPct: 42,
    floodRiskPct: 20,
    vehicleSuitability: { heavyReefer16T: false, miniTruckTataAce: true, pickup4x4Bolero: true, railFlatcar: false, inlandBarge: false, cargoDrone: true },
    accessibilityScore: 61,
    recommendation: "Active rockfall netting in place. 4x4 Boleros and Tata Ace mini-trucks operating with 20 min convoy gaps.",
  },

  // 14. BRAHMAPUTRA RIVER INLAND WATERWAY (NW-2)
  {
    id: "corr_nw2_waterway",
    name: "National Waterway 2 (NW-2) Brahmaputra River Freight Channel",
    fromHubId: "dhb_reg_hub",
    toHubId: "dib_reg_hub",
    mode: "waterway",
    coordinates: [
      [26.0197, 89.9749], // Dhubri Port
      [26.1500, 90.6200], // Goalpara
      [26.1445, 91.7362], // Pandu River Port (Guwahati)
      [26.6528, 92.7926], // Tezpur River Terminal
      [26.8500, 93.6500], // Biswanath Ghat
      [26.9500, 94.2167], // Neamati Ghat (Majuli)
      [27.4728, 94.9120], // Dibrugarh Port
    ],
    distanceKm: 891,
    standardEtaHours: 38.0,
    currentEtaHours: 38.0,
    status: "optimal",
    roadRoughnessIRI: 0.8,
    gradientPct: 0.1,
    elevationGainM: 74,
    weatherCondition: "Navigable River Channel",
    landslideProbabilityPct: 0,
    floodRiskPct: 15,
    vehicleSuitability: { heavyReefer16T: false, miniTruckTataAce: false, pickup4x4Bolero: false, railFlatcar: false, inlandBarge: true, cargoDrone: false },
    accessibilityScore: 91,
    recommendation: "High-capacity, ultra-low emission waterway corridor connecting heavy agro and fertilizer barges directly to Pandu Port Guwahati.",
  },

  // 15. AIR FREIGHT: Guwahati LGBI → Delhi IGI
  {
    id: "corr_air_gau_del",
    name: "Express Air Cold-Chain Corridor (Guwahati LGBI → Delhi IGI)",
    fromHubId: "gau_mega_hub",
    toHubId: "del_gateway",
    mode: "air",
    coordinates: [
      [26.1445, 91.7362],
      [27.2000, 84.5000],
      [28.6139, 77.2090],
    ],
    distanceKm: 1480,
    standardEtaHours: 2.2,
    currentEtaHours: 2.2,
    status: "optimal",
    roadRoughnessIRI: 0.1,
    gradientPct: 0,
    elevationGainM: 0,
    weatherCondition: "High Altitude Clear Flight Level",
    landslideProbabilityPct: 0,
    floodRiskPct: 0,
    vehicleSuitability: { heavyReefer16T: false, miniTruckTataAce: false, pickup4x4Bolero: false, railFlatcar: false, inlandBarge: false, cargoDrone: false },
    accessibilityScore: 99,
    recommendation: "Critical emergency corridor for maternal vaccines, life-saving biologics, and high-value export produce.",
  },
  // 16. AIR FREIGHT: Guwahati LGBI → Pakyong Sikkim
  {
    id: "corr_air_gau_gtk",
    name: "Regional Air Lifeline (Guwahati LGBI → Pakyong Sikkim Airport)",
    fromHubId: "gau_mega_hub",
    toHubId: "gtk_state_hub",
    mode: "air",
    coordinates: [
      [26.1445, 91.7362],
      [26.8000, 90.0000],
      [27.3389, 88.6065],
    ],
    distanceKm: 340,
    standardEtaHours: 0.8,
    currentEtaHours: 0.8,
    status: "optimal",
    roadRoughnessIRI: 0.1,
    gradientPct: 0,
    elevationGainM: 1595,
    weatherCondition: "Mountain Visual Flight Clear",
    landslideProbabilityPct: 0,
    floodRiskPct: 0,
    vehicleSuitability: { heavyReefer16T: false, miniTruckTataAce: false, pickup4x4Bolero: false, railFlatcar: false, inlandBarge: false, cargoDrone: false },
    accessibilityScore: 95,
    recommendation: "Rapid high-altitude connection bypassing Teesta river landslides during monsoonal peaks.",
  },
];

// =========================================================================
// 5. REAL-TIME SIMULATED DISASTER RISK ZONES ON OPENSTREETMAP
// =========================================================================

export const OSM_DISASTER_RISK_ZONES: OsmDisasterRiskZone[] = [
  {
    id: "risk_sonapur_tunnel",
    name: "Sonapur Tunnel Landslide & Mudslip Sinking Zone (NH-6)",
    category: "landslide",
    severity: "critical",
    locationDescription: "East Jaintia Hills, Meghalaya (NH-6 Km 142)",
    state: "Meghalaya",
    lat: 25.2000,
    lng: 92.4000,
    radiusMeters: 18000,
    affectedCorridorIds: ["corr_shl_slc_road"],
    affectedShipmentIds: ["ship_001_pharma", "ship_004_fruit"],
    detectedAt: "10 mins ago (Sensor S-902 Telemetry)",
    impactSummary: "Active debris slide of approx 420m³. NH-6 blocked in both directions. 14 trucks queued.",
    aiRerouteRecommendation: "REROUTE TO RAIL: Shift Consignment ship_001_pharma to Lumding-Badarpur Express Parcel Rake. SLA maintained.",
    alternativeModeAvailable: "Rail Freight Rake / Air Cargo",
  },
  {
    id: "risk_sevoke_teesta",
    name: "Sevoke-Teesta Gorge Rockfall & Sinking Pass (NH-10)",
    category: "landslide",
    severity: "high",
    locationDescription: "29th Mile, Kalimpong / Sikkim Border",
    state: "Sikkim",
    lat: 27.0500,
    lng: 88.5000,
    radiusMeters: 12000,
    affectedCorridorIds: ["corr_sgu_gtk_road"],
    affectedShipmentIds: ["ship_006_cardamom"],
    detectedAt: "35 mins ago (Highway Patrol Alert)",
    impactSummary: "Loose gravel and heavy monsoonal seepage. Single-lane movement with pilot escorts.",
    aiRerouteRecommendation: "Use 4x4 Bolero Pickup with staggered convoys or air lift critical payloads via Pakyong ALG.",
    alternativeModeAvailable: "Air Cargo via Pakyong Airport",
  },
  {
    id: "risk_majuli_flood",
    name: "Brahmaputra Lower Basin Flash Flood & Silt Runoff",
    category: "flash_flood",
    severity: "high",
    locationDescription: "Majuli Island Ferry Ghats & Kaziranga South Bank",
    state: "Assam",
    lat: 26.9500,
    lng: 94.2167,
    radiusMeters: 25000,
    affectedCorridorIds: ["corr_gau_tzp_road"],
    affectedShipmentIds: ["ship_003_litchi"],
    detectedAt: "1 hour ago (Central Water Commission Gauge)",
    impactSummary: "Brahmaputra water level 0.8m above warning mark. Ro-Ro ferry sailings rescheduled to daylight only.",
    aiRerouteRecommendation: "Shift bulk cargo to 120T NW-2 river barge with elevated waterproof container seals.",
    alternativeModeAvailable: "NW-2 High-Draft River Barge",
  },
  {
    id: "risk_dzukou_mudslide",
    name: "Dzükou / Kohima-Imphal Sinking Section (NH-29)",
    category: "landslide",
    severity: "moderate",
    locationDescription: "Kohima to Senapati Mountain Pass",
    state: "Nagaland / Manipur Border",
    lat: 25.4000,
    lng: 94.0500,
    radiusMeters: 15000,
    affectedCorridorIds: ["corr_dmp_imp_road"],
    affectedShipmentIds: ["ship_005_black_rice"],
    detectedAt: "2 hours ago (RoadSense IRI Telemetry)",
    impactSummary: "Roadbed subsidence of 12cm. Maximum vehicle gross weight restricted to under 7.5T.",
    aiRerouteRecommendation: "Transship from 16T heavy reefer into 2x 4x4 Bolero Pickups at Dimapur Hub.",
    alternativeModeAvailable: "4x4 Bolero Fleet Split",
  },
  {
    id: "risk_sela_snow",
    name: "Sela Pass High-Altitude Black Ice & Sub-Zero Pass (4170m ASL)",
    category: "high_altitude_snow",
    severity: "moderate",
    locationDescription: "Sela Ridge, West Kameng / Tawang",
    state: "Arunachal Pradesh",
    lat: 27.5000,
    lng: 92.1000,
    radiusMeters: 14000,
    affectedCorridorIds: [],
    affectedShipmentIds: ["ship_008_relief"],
    detectedAt: "3 hours ago (BRO Weather Station)",
    impactSummary: "Temperatures dropped to -6°C. Sela tunnel open; old pass closed due to ice accumulation.",
    aiRerouteRecommendation: "Use Sela Tunnel route with heated diesel line filters and snow chains.",
    alternativeModeAvailable: "Sela Tunnel 4x4 Transit",
  },
];

// =========================================================================
// 6. LIVE SIMULATED FLEET TELEMETRY ON OPENSTREETMAP
// =========================================================================

export const OSM_FLEET_VEHICLES: OsmVehicleTelemetry[] = [
  {
    id: "veh_01_reefer",
    name: "Heavy Reefer Multi-Axle 16T (AS-01-GC-9014)",
    type: "Heavy Reefer Truck (16T)",
    driverName: "Bipul Kalita",
    currentLocationName: "NH-27 near Bongaigaon (Guwahati → Siliguri)",
    lat: 26.4789,
    lng: 90.5583,
    headingDeg: 270,
    speedKmH: 64,
    capacityKg: 16000,
    usedKg: 14200,
    utilizationPct: 88.7,
    tempControlled: true,
    chamberTempC: 3.8,
    targetTempC: 4.0,
    batteryOrFuelPct: 78,
    status: "en_route",
    assignedShipmentId: "ship_002_tea",
    currentCorridorId: "corr_sgu_gau_road",
    terrainSuitabilityScore: 92,
    routeWaypoints: [
      [26.1445, 91.7362],
      [26.4789, 90.5583],
      [26.5400, 89.5300],
      [26.7271, 88.3953],
    ],
  },
  {
    id: "veh_02_tata_ace",
    name: "Tata Ace EV Cold Pod LCV (AS-03-BC-4102)",
    type: "Tata Ace Cold LCV (1.2T)",
    driverName: "Debajit Gogoi",
    currentLocationName: "Jorhat Agro Corridor near Titabar",
    lat: 26.7509,
    lng: 94.2037,
    headingDeg: 45,
    speedKmH: 42,
    capacityKg: 1200,
    usedKg: 980,
    utilizationPct: 81.6,
    tempControlled: true,
    chamberTempC: 4.2,
    targetTempC: 4.0,
    batteryOrFuelPct: 65,
    status: "en_route",
    assignedShipmentId: "ship_003_litchi",
    currentCorridorId: "corr_gau_jrh_road",
    terrainSuitabilityScore: 88,
    routeWaypoints: [
      [26.6528, 92.7926],
      [26.7509, 94.2037],
    ],
  },
  {
    id: "veh_03_bolero_4x4",
    name: "Highland 4x4 Bolero Cargo Cruiser (ML-05-D-8821)",
    type: "Highland 4x4 Bolero (1.5T)",
    driverName: "Wanphrang Nongrum",
    currentLocationName: "GS Road 4-Lane Ascent near Nongpoh",
    lat: 25.9038,
    lng: 91.8809,
    headingDeg: 180,
    speedKmH: 52,
    capacityKg: 1500,
    usedKg: 1350,
    utilizationPct: 90.0,
    tempControlled: true,
    chamberTempC: 18.5,
    targetTempC: 20.0,
    batteryOrFuelPct: 84,
    status: "en_route",
    assignedShipmentId: "ship_007_turmeric",
    currentCorridorId: "corr_gau_shl_road",
    terrainSuitabilityScore: 98,
    routeWaypoints: [
      [26.1445, 91.7362],
      [25.9038, 91.8809],
      [25.5788, 91.8933],
    ],
  },
  {
    id: "veh_04_dfc_rail",
    name: "Northern DFC Reefer Freight Rake (NFR-DFC-204)",
    type: "Northern DFC Freight Train (45T)",
    driverName: "Loco Pilot R. Sharma & Team",
    currentLocationName: "Bihar-Bengal Border Corridor (Delhi → NJP)",
    lat: 25.5941,
    lng: 85.1376,
    headingDeg: 90,
    speedKmH: 78,
    capacityKg: 45000,
    usedKg: 41800,
    utilizationPct: 92.8,
    tempControlled: true,
    chamberTempC: 2.1,
    targetTempC: 2.0,
    batteryOrFuelPct: 95,
    status: "en_route",
    assignedShipmentId: "ship_001_pharma",
    currentCorridorId: "corr_del_sgu_rail",
    terrainSuitabilityScore: 99,
    routeWaypoints: [
      [28.6139, 77.2090],
      [25.5941, 85.1376],
      [26.7271, 88.3953],
    ],
  },
  {
    id: "veh_05_barge_nw2",
    name: "Brahmaputra Cargo Barge 'Mahabahu' (IWAI-NW2-07)",
    type: "Brahmaputra Cargo Barge (120T)",
    driverName: "Capt. H. Das",
    currentLocationName: "Brahmaputra Channel approaching Tezpur Terminal",
    lat: 26.6528,
    lng: 92.7926,
    headingDeg: 60,
    speedKmH: 18,
    capacityKg: 120000,
    usedKg: 95000,
    utilizationPct: 79.1,
    tempControlled: true,
    chamberTempC: 8.5,
    targetTempC: 8.0,
    batteryOrFuelPct: 90,
    status: "en_route",
    currentCorridorId: "corr_nw2_waterway",
    terrainSuitabilityScore: 95,
    routeWaypoints: [
      [26.0197, 89.9749],
      [26.1445, 91.7362],
      [26.6528, 92.7926],
      [26.9500, 94.2167],
      [27.4728, 94.9120],
    ],
  },
  {
    id: "veh_06_air_atr72",
    name: "NER SkyFreighter ATR-72 (VT-CM-09)",
    type: "Air Cargo ATR-72 (4.5T)",
    driverName: "Capt. A. Roy",
    currentLocationName: "Cruising 14,000ft Guwahati to Pakyong Flight Corridor",
    lat: 26.8000,
    lng: 90.0000,
    headingDeg: 300,
    speedKmH: 480,
    capacityKg: 4500,
    usedKg: 3850,
    utilizationPct: 85.5,
    tempControlled: true,
    chamberTempC: 3.2,
    targetTempC: 3.0,
    batteryOrFuelPct: 72,
    status: "en_route",
    currentCorridorId: "corr_air_gau_gtk",
    terrainSuitabilityScore: 100,
    routeWaypoints: [
      [26.1445, 91.7362],
      [26.8000, 90.0000],
      [27.3389, 88.6065],
    ],
  },
  {
    id: "veh_07_mizo_4x4",
    name: "Highland 4x4 Mountain Express (MZ-01-F-3319)",
    type: "Highland 4x4 Bolero (1.5T)",
    driverName: "Lalremruata Sailo",
    currentLocationName: "NH-306 Kolasib Ghat descent to Silchar",
    lat: 24.2247,
    lng: 92.6784,
    headingDeg: 350,
    speedKmH: 38,
    capacityKg: 1500,
    usedKg: 1280,
    utilizationPct: 85.3,
    tempControlled: true,
    chamberTempC: 6.2,
    targetTempC: 6.0,
    batteryOrFuelPct: 68,
    status: "en_route",
    assignedShipmentId: "ship_004_fruit",
    currentCorridorId: "corr_slc_azl_road",
    terrainSuitabilityScore: 96,
    routeWaypoints: [
      [23.7271, 92.7176],
      [24.2247, 92.6784],
      [24.8333, 92.7789],
    ],
  },
  {
    id: "veh_08_drone_pod",
    name: "CargoMind SkyPod Drone V3 (UAV-NE-88)",
    type: "Agri-Drone Cold Pod (25kg)",
    driverName: "Autonomous AI Flight Controller",
    currentLocationName: "Jorhat → Majuli River Crossing (Altitude 120m)",
    lat: 26.8500,
    lng: 94.2100,
    headingDeg: 330,
    speedKmH: 65,
    capacityKg: 25,
    usedKg: 18,
    utilizationPct: 72.0,
    tempControlled: true,
    chamberTempC: 2.8,
    targetTempC: 3.0,
    batteryOrFuelPct: 82,
    status: "en_route",
    terrainSuitabilityScore: 100,
    routeWaypoints: [
      [26.7509, 94.2037],
      [26.9500, 94.2167],
    ],
  },
];

// =========================================================================
// 7. ACTIVE SHIPMENTS DATA
// =========================================================================

export const OSM_ACTIVE_SHIPMENTS: OsmActiveShipment[] = [
  {
    id: "ship_001_pharma",
    waybill: "NE-WB-90141",
    originHubId: "del_gateway",
    originName: "Delhi NCR Mega Logistics Terminal",
    destinationHubId: "slc_reg_hub",
    destinationName: "Silchar Barak Valley Gateway (Assam)",
    cargoType: "Medicine & Vaccines",
    commodity: "Temperature-Sensitive Maternal & Child Vaccines",
    weightKg: 240,
    volumeM3: 1.8,
    tempClass: "chilled",
    targetTemp: "+2.0°C to +4.0°C",
    urgency: "critical",
    assignedVehicleId: "veh_04_dfc_rail",
    assignedVehicleName: "Northern DFC Reefer Freight Rake",
    etaHours: 18.5,
    routeStatus: "blocked_critical",
    aiPriorityScore: 98,
    currentLocationDescription: "Intermodal rail relay from Delhi DFC to Guwahati, switching to Lumding-Badarpur rail rake to bypass Sonapur landslide.",
    status: "Rerouted",
    hasReturnMatch: false,
  },
  {
    id: "ship_002_tea",
    waybill: "NE-WB-90142",
    originHubId: "jrh_reg_hub",
    originName: "Jorhat Upper Assam Tea Belt",
    destinationHubId: "del_gateway",
    destinationName: "Delhi NCR Mega Logistics Terminal",
    cargoType: "Organic Tea & Spices",
    commodity: "Export Grade Orthodox Single-Estate First Flush Tea",
    weightKg: 14200,
    volumeM3: 38.0,
    tempClass: "ambient",
    targetTemp: "+18.0°C Ambient Dry",
    urgency: "high",
    assignedVehicleId: "veh_01_reefer",
    assignedVehicleName: "Heavy Reefer Multi-Axle 16T",
    etaHours: 32.0,
    routeStatus: "optimal",
    aiPriorityScore: 86,
    currentLocationDescription: "Cruising NH-27 Expressway past Bongaigaon towards Siliguri Gateway.",
    status: "In Transit",
    hasReturnMatch: true,
    returnMatchSummary: "Matched with 12.5T incoming FMCG consignment for Guwahati delivery on return leg.",
  },
  {
    id: "ship_003_litchi",
    waybill: "NE-WB-90143",
    originHubId: "tzp_reg_hub",
    originName: "Tezpur Perishables Cluster",
    destinationHubId: "kol_gateway",
    destinationName: "Kolkata Port & Maritime Distribution Terminal",
    cargoType: "Perishable Fruits (Pineapple/Litchi/Kiwi)",
    commodity: "Fresh GI Tezpur Litchis (Ultra-High Perishability)",
    weightKg: 980,
    volumeM3: 3.2,
    tempClass: "chilled",
    targetTemp: "+4.0°C Chilled",
    urgency: "critical",
    assignedVehicleId: "veh_02_tata_ace",
    assignedVehicleName: "Tata Ace EV Cold Pod LCV",
    etaHours: 14.2,
    routeStatus: "moderate_risk",
    aiPriorityScore: 94,
    currentLocationDescription: "Transiting North Bank NH-15 under IoT thermal logging.",
    status: "In Transit",
    hasReturnMatch: false,
  },
  {
    id: "ship_004_fruit",
    waybill: "NE-WB-90144",
    originHubId: "azl_state_hub",
    originName: "Aizawl Highland Aggregation Depot",
    destinationHubId: "gau_mega_hub",
    destinationName: "Guwahati Northeast Central Mega Hub",
    cargoType: "Perishable Fruits (Pineapple/Litchi/Kiwi)",
    commodity: "Organic Anthurium Cut Flowers & Bird's Eye Chilli",
    weightKg: 1280,
    volumeM3: 4.5,
    tempClass: "chilled",
    targetTemp: "+6.0°C Chilled",
    urgency: "high",
    assignedVehicleId: "veh_07_mizo_4x4",
    assignedVehicleName: "Highland 4x4 Mountain Express",
    etaHours: 8.5,
    routeStatus: "moderate_risk",
    aiPriorityScore: 89,
    currentLocationDescription: "Descending Kolasib ghat sections. Consignment paired as return-cargo backhaul.",
    status: "In Transit",
    hasReturnMatch: true,
    returnMatchSummary: "CIRCULAR RETURN FREIGHT: Outbound medical shipment delivered; 1.28T backhaul loaded at Aizawl.",
  },
  {
    id: "ship_005_black_rice",
    waybill: "NE-WB-90145",
    originHubId: "imp_state_hub",
    originName: "Imphal Valley State Logistics Terminal",
    destinationHubId: "dmp_state_hub",
    destinationName: "Dimapur Rail Gateway & Agro Hub",
    cargoType: "Agricultural Grain & Bamboo",
    commodity: "GI Chak-Hao Manipur Organic Black Rice",
    weightKg: 4200,
    volumeM3: 8.5,
    tempClass: "ambient",
    targetTemp: "+22.0°C Ambient",
    urgency: "routine",
    assignedVehicleId: "veh_09_nagaland_truck",
    assignedVehicleName: "Dimapur Reefer Medium Van",
    etaHours: 6.8,
    routeStatus: "moderate_risk",
    aiPriorityScore: 72,
    currentLocationDescription: "Navigating Kohima bypass. Mudslide hazard managed via convoy escort.",
    status: "In Transit",
    hasReturnMatch: true,
  },
  {
    id: "ship_006_cardamom",
    waybill: "NE-WB-90146",
    originHubId: "gtk_state_hub",
    originName: "Gangtok Organic Highland State Depot",
    destinationHubId: "kol_gateway",
    destinationName: "Kolkata Port & Maritime Distribution Terminal",
    cargoType: "Organic Tea & Spices",
    commodity: "Certified Organic Large Black Cardamom & Sikkim Ginger",
    weightKg: 3850,
    volumeM3: 9.0,
    tempClass: "ambient",
    targetTemp: "+15.0°C Ambient",
    urgency: "high",
    assignedVehicleId: "veh_06_air_atr72",
    assignedVehicleName: "NER SkyFreighter ATR-72",
    etaHours: 3.5,
    routeStatus: "moderate_risk",
    aiPriorityScore: 88,
    currentLocationDescription: "Transferred from Teesta road pass to Pakyong Airport airfreight wing for express transit.",
    status: "In Transit",
    hasReturnMatch: false,
  },
  {
    id: "ship_007_turmeric",
    waybill: "NE-WB-90147",
    originHubId: "shl_state_hub",
    originName: "Shillong Highlands State Depot",
    destinationHubId: "gau_mega_hub",
    destinationName: "Guwahati Northeast Central Mega Hub",
    cargoType: "Organic Tea & Spices",
    commodity: "GI Lakadong Turmeric (High Curcumin)",
    weightKg: 1350,
    volumeM3: 3.8,
    tempClass: "ambient",
    targetTemp: "+20.0°C Ambient",
    urgency: "high",
    assignedVehicleId: "veh_03_bolero_4x4",
    assignedVehicleName: "Highland 4x4 Bolero Cargo Cruiser",
    etaHours: 1.8,
    routeStatus: "optimal",
    aiPriorityScore: 84,
    currentLocationDescription: "GS Road 4-lane descent past Nongpoh. On-time delivery anticipated at Guwahati Mega Hub.",
    status: "In Transit",
    hasReturnMatch: true,
    returnMatchSummary: "Matched with 1.4T solar inverter packs for Shillong SHG micro-cold storage units.",
  },
  {
    id: "ship_008_relief",
    waybill: "NE-WB-90148",
    originHubId: "gau_mega_hub",
    originName: "Guwahati Northeast Central Mega Hub",
    destinationHubId: "twn_reg_hub",
    destinationName: "Tawang High-Altitude Outpost (Arunachal)",
    cargoType: "Emergency Disaster Relief",
    commodity: "High-Altitude Medical Oxygen Concentrators & Warm Blankets",
    weightKg: 1100,
    volumeM3: 5.2,
    tempClass: "ambient",
    targetTemp: "+10.0°C Insulated",
    urgency: "critical",
    assignedVehicleId: "veh_11_tawang_cruiser",
    assignedVehicleName: "Arunachal Sela Snow Cruiser 4x4",
    etaHours: 6.2,
    routeStatus: "optimal",
    aiPriorityScore: 99,
    currentLocationDescription: "Passing through Sela Tunnel (4170m ASL). Continuous satellite GPS telemetry active.",
    status: "In Transit",
    hasReturnMatch: true,
    returnMatchSummary: "Matched with 850kg yak churpi artisanal cheese for Tezpur Gourmet Depot.",
  },
];

// =========================================================================
// 8. RETURN-LOAD CIRCULAR LOGISTICS OPTIMIZATION DATA
// =========================================================================

export const OSM_RETURN_LOAD_OPPORTUNITIES: OsmReturnLoadOpportunity[] = [
  {
    id: "ret_001_aizawl",
    outboundShipmentId: "ship_004_fruit",
    outboundRoute: "Guwahati Mega Hub → Aizawl Highland Depot (480 km)",
    outboundVehicle: "Highland 4x4 Bolero (ML-05-D-8821)",
    destinationLocation: "Aizawl Highland Aggregation Depot (Mizoram)",
    lat: 23.7271,
    lng: 92.7176,
    availableReturnCargo: "850kg Organic Anthurium Cut Flowers & 430kg Mizo Bird's Eye Chilli",
    returnCommodity: "High-Value Exotic Floriculture & Spices",
    producerGroup: "Mizoram Flower Growers Cooperative Federation (MFGCF)",
    availableWeightKg: 1280,
    targetDestination: "Guwahati Mega Hub & Kolkata Airport Distribution",
    outboundUtilizationPct: 92.0,
    projectedReturnUtilizationPct: 85.3,
    emptyMilesEliminatedKm: 480,
    fuelCostSavingsInr: 15800,
    co2ReductionKg: 285,
    matchedStatus: "in_transit",
  },
  {
    id: "ret_002_shillong",
    outboundShipmentId: "ship_007_turmeric",
    outboundRoute: "Guwahati → Shillong Highlands (100 km)",
    outboundVehicle: "Highland 4x4 Bolero (ML-05-D-8821)",
    destinationLocation: "Shillong Highlands Aggregation Node (Meghalaya)",
    lat: 25.5788,
    lng: 91.8933,
    availableReturnCargo: "1.35T GI Lakadong Turmeric (7.8% Curcumin) from Jaintia SHGs",
    returnCommodity: "Super-Curcumin Cured Turmeric Rhizomes",
    producerGroup: "Jaintia Hills Organic Spices SHG Collective",
    availableWeightKg: 1350,
    targetDestination: "Guwahati Mega Hub → Delhi NCR Freight Rake",
    outboundUtilizationPct: 94.0,
    projectedReturnUtilizationPct: 90.0,
    emptyMilesEliminatedKm: 100,
    fuelCostSavingsInr: 4200,
    co2ReductionKg: 78,
    matchedStatus: "assigned",
  },
  {
    id: "ret_003_tawang",
    outboundShipmentId: "ship_008_relief",
    outboundRoute: "Tezpur Depot → Tawang High-Altitude Outpost (320 km)",
    outboundVehicle: "Arunachal Sela Snow Cruiser 4x4",
    destinationLocation: "Tawang High-Altitude Outpost (Arunachal Pradesh)",
    lat: 27.5861,
    lng: 91.8594,
    availableReturnCargo: "850kg Artisanal Yak Cheese (Churpi) & 250kg Highland Medicinal Cordyceps",
    returnCommodity: "Highland Yak Dairy & Medicinal Bio-Produce",
    producerGroup: "Tawang Pastoralist Nomadic Dairy Guild",
    availableWeightKg: 1100,
    targetDestination: "Tezpur Agro Hub & Guwahati Export Vault",
    outboundUtilizationPct: 73.3,
    projectedReturnUtilizationPct: 73.3,
    emptyMilesEliminatedKm: 320,
    fuelCostSavingsInr: 12600,
    co2ReductionKg: 210,
    matchedStatus: "assigned",
  },
  {
    id: "ret_004_jorhat",
    outboundShipmentId: "ship_002_tea",
    outboundRoute: "Siliguri Gateway → Jorhat Upper Assam (480 km)",
    outboundVehicle: "Heavy Reefer Multi-Axle 16T",
    destinationLocation: "Jorhat Upper Assam Tea Belt (Assam)",
    lat: 26.7509,
    lng: 94.2037,
    availableReturnCargo: "14.2T Orthodox Single-Estate Tea + 1.8T Majuli River Island Soft Rice",
    returnCommodity: "Orthodox Tea & GI Komal Saul",
    producerGroup: "Assam Valley Planters Association & Majuli Organic FPO",
    availableWeightKg: 16000,
    targetDestination: "Siliguri Transit Centre → Delhi NCR Freight Siding",
    outboundUtilizationPct: 88.0,
    projectedReturnUtilizationPct: 100.0,
    emptyMilesEliminatedKm: 480,
    fuelCostSavingsInr: 22400,
    co2ReductionKg: 395,
    matchedStatus: "detected",
  },
];

// =========================================================================
// 9. ESSENTIAL HEALTHCARE & AGRI-MARKET POIS (ASSAM & MEGHALAYA)
// =========================================================================

export interface OsmEssentialPoi {
  id: string;
  name: string;
  category: "hospital" | "phc_clinic" | "regulated_mandi" | "indigenous_haat" | "river_terminal";
  categoryLabel: string;
  state: string;
  district: string;
  lat: number;
  lng: number;
  elevation_m: number;
  accessibilityScore: number;
  scoreBreakdown: {
    roadConnectivity: number;
    terrainElevation: number;
    multimodalProximity: number;
    disasterSafety: number;
    facilityReadiness: number;
  };
  operationalCapacity: string;
  isColdChainEquipped: boolean;
  notes: string;
}

export const OSM_ESSENTIAL_POIS: OsmEssentialPoi[] = [
  {
    id: "poi_gmch_guwahati",
    name: "Gauhati Medical College & Hospital (GMCH)",
    category: "hospital",
    categoryLabel: "Tertiary Apex Hospital & Cold Vault",
    state: "Assam",
    district: "Kamrup Metropolitan",
    lat: 26.1550,
    lng: 91.7700,
    elevation_m: 58,
    accessibilityScore: 98,
    scoreBreakdown: { roadConnectivity: 25, terrainElevation: 20, multimodalProximity: 20, disasterSafety: 18, facilityReadiness: 15 },
    operationalCapacity: "2,200 Beds + Regional Vaccine Vault",
    isColdChainEquipped: true,
    notes: "Northeast apex referral center and primary repository for temperature-sensitive maternal and pediatric biologics.",
  },
  {
    id: "poi_neigrihms_shillong",
    name: "NEIGRIHMS Apex Medical Institute (Mawdiangdiang)",
    category: "hospital",
    categoryLabel: "High-Altitude Regional Institute",
    state: "Meghalaya",
    district: "East Khasi Hills",
    lat: 25.5920,
    lng: 91.9380,
    elevation_m: 1520,
    accessibilityScore: 92,
    scoreBreakdown: { roadConnectivity: 24, terrainElevation: 16, multimodalProximity: 18, disasterSafety: 19, facilityReadiness: 15 },
    operationalCapacity: "750 Beds + Specialized Hill Trauma Care",
    isColdChainEquipped: true,
    notes: "Premier regional healthcare institution serving Meghalaya and neighbouring hill states with dedicated helipad and reefer logistics.",
  },
  {
    id: "poi_civil_shillong",
    name: "Shillong Civil Hospital",
    category: "hospital",
    categoryLabel: "District Hospital & Storage",
    state: "Meghalaya",
    district: "East Khasi Hills",
    lat: 25.5720,
    lng: 91.8840,
    elevation_m: 1495,
    accessibilityScore: 89,
    scoreBreakdown: { roadConnectivity: 23, terrainElevation: 16, multimodalProximity: 17, disasterSafety: 18, facilityReadiness: 15 },
    operationalCapacity: "500 Beds + District Cold Storage",
    isColdChainEquipped: true,
    notes: "Urban center facility coordinating rural PHC vaccine supply runs via 4x4 Highland Bolero units.",
  },
  {
    id: "poi_tura_civil",
    name: "Tura Civil Hospital & Medical Store",
    category: "hospital",
    categoryLabel: "Garo Hills District Medical Center",
    state: "Meghalaya",
    district: "West Garo Hills",
    lat: 25.5150,
    lng: 90.2200,
    elevation_m: 370,
    accessibilityScore: 74,
    scoreBreakdown: { roadConnectivity: 18, terrainElevation: 15, multimodalProximity: 14, disasterSafety: 15, facilityReadiness: 12 },
    operationalCapacity: "350 Beds + Solar Cold Hub",
    isColdChainEquipped: true,
    notes: "Primary health anchor for West, East, and South Garo Hills; connected via NH-17 and Mendipathar railhead.",
  },
  {
    id: "poi_sohra_phc",
    name: "Cherrapunji / Sohra Community Health Centre",
    category: "phc_clinic",
    categoryLabel: "High-Rainfall Mountain PHC",
    state: "Meghalaya",
    district: "East Khasi Hills",
    lat: 25.2750,
    lng: 91.7320,
    elevation_m: 1480,
    accessibilityScore: 58,
    scoreBreakdown: { roadConnectivity: 14, terrainElevation: 10, multimodalProximity: 12, disasterSafety: 10, facilityReadiness: 12 },
    operationalCapacity: "60 Beds + Solar Cold Box",
    isColdChainEquipped: true,
    notes: "Subject to extreme precipitation (>11,000mm/yr); relies on drone air-drops when ghat roads experience flash mudslips.",
  },
  {
    id: "poi_majuli_phc",
    name: "Majuli Island Rural Hospital (Kamalabari)",
    category: "phc_clinic",
    categoryLabel: "Riverine Island Emergency Care",
    state: "Assam",
    district: "Majuli",
    lat: 26.9600,
    lng: 94.1800,
    elevation_m: 84,
    accessibilityScore: 46,
    scoreBreakdown: { roadConnectivity: 10, terrainElevation: 18, multimodalProximity: 10, disasterSafety: 4, facilityReadiness: 4 },
    operationalCapacity: "100 Beds + Flood Buffer Depot",
    isColdChainEquipped: true,
    notes: "Dependent on NW-2 ferry link and boat ambulances during Brahmaputra monsoon inundation peaks.",
  },
  {
    id: "poi_smch_silchar",
    name: "Silchar Medical College & Hospital (SMCH)",
    category: "hospital",
    categoryLabel: "Barak Valley Apex Hospital",
    state: "Assam",
    district: "Cachar",
    lat: 24.8100,
    lng: 92.7950,
    elevation_m: 28,
    accessibilityScore: 86,
    scoreBreakdown: { roadConnectivity: 22, terrainElevation: 19, multimodalProximity: 18, disasterSafety: 14, facilityReadiness: 13 },
    operationalCapacity: "1,000 Beds + Transshipment Pharma",
    isColdChainEquipped: true,
    notes: "Critical medical lifeline for Cachar, Karimganj, Hailakandi, and southern Mizoram/Manipur borders.",
  },
  {
    id: "poi_pamohi_mandi",
    name: "Pamohi Regulated Wholesale Agro Market",
    category: "regulated_mandi",
    categoryLabel: "State Apex Agricultural Market",
    state: "Assam",
    district: "Kamrup Metropolitan",
    lat: 26.1150,
    lng: 91.6850,
    elevation_m: 52,
    accessibilityScore: 96,
    scoreBreakdown: { roadConnectivity: 25, terrainElevation: 20, multimodalProximity: 20, disasterSafety: 17, facilityReadiness: 14 },
    operationalCapacity: "50,000 Sq.Ft Auction Shed + 20 Docks",
    isColdChainEquipped: true,
    notes: "Primary trading hub for Assam vegetables, citrus, and dairy; direct intermodal link to Guwahati Railway Container Yard.",
  },
  {
    id: "poi_iewduh_shillong",
    name: "Iewduh (Bara Bazar) Central Indigenous Haat",
    category: "indigenous_haat",
    categoryLabel: "Khasi Hills Central Haat",
    state: "Meghalaya",
    district: "East Khasi Hills",
    lat: 25.5780,
    lng: 91.8750,
    elevation_m: 1490,
    accessibilityScore: 88,
    scoreBreakdown: { roadConnectivity: 22, terrainElevation: 16, multimodalProximity: 18, disasterSafety: 18, facilityReadiness: 14 },
    operationalCapacity: "3,500 Traditional Stalls + FPO Dock",
    isColdChainEquipped: false,
    notes: "Largest traditional marketplace in the Northeast, aggregating turmeric, ginger, broom grass, and organic honey from 400+ Khasi villages.",
  },
  {
    id: "poi_jowai_haat",
    name: "Jowai Chutwakhu Spices Haat",
    category: "indigenous_haat",
    categoryLabel: "Lakadong Organic Spices Aggregator",
    state: "Meghalaya",
    district: "West Jaintia Hills",
    lat: 25.4450,
    lng: 92.2050,
    elevation_m: 1375,
    accessibilityScore: 78,
    scoreBreakdown: { roadConnectivity: 19, terrainElevation: 15, multimodalProximity: 16, disasterSafety: 16, facilityReadiness: 12 },
    operationalCapacity: "800 Tons Weekly Organic Volume",
    isColdChainEquipped: true,
    notes: "Primary aggregation node for high-curcumin Lakadong turmeric and organic ginger cooperatives.",
  },
  {
    id: "poi_tezpur_market",
    name: "Tezpur Mission Chariali Regulated Fruit Market",
    category: "regulated_mandi",
    categoryLabel: "North Bank Perishables Terminal",
    state: "Assam",
    district: "Sonitpur",
    lat: 26.6500,
    lng: 92.7900,
    elevation_m: 54,
    accessibilityScore: 90,
    scoreBreakdown: { roadConnectivity: 23, terrainElevation: 19, multimodalProximity: 19, disasterSafety: 16, facilityReadiness: 13 },
    operationalCapacity: "1,200 Tons Weekly Perishable Fruit",
    isColdChainEquipped: true,
    notes: "Central hub for GI Tezpur Litchi, pineapple, and green vegetables with cold-pre-cooling facilities.",
  },
  {
    id: "poi_neamati_terminal",
    name: "Neamati Agro Ferry Terminal & River Haat",
    category: "river_terminal",
    categoryLabel: "NW-2 Riverway Cargo Landing",
    state: "Assam",
    district: "Jorhat",
    lat: 26.8600,
    lng: 94.2300,
    elevation_m: 86,
    accessibilityScore: 65,
    scoreBreakdown: { roadConnectivity: 15, terrainElevation: 18, multimodalProximity: 16, disasterSafety: 8, facilityReadiness: 8 },
    operationalCapacity: "4 Barge Berths + RO-RO Ferry Terminal",
    isColdChainEquipped: false,
    notes: "Vital transshipment point transferring organic rice, mustard, and milk from Majuli Island to mainland Assam highways.",
  },
];

