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
  state: string;
  node_type: "aggregation_point" | "informal_cold_storage" | "warehouse" | "crossdock" | "rail_freight_terminal" | "hilly_aggregation_node";
  power_reliability: "grid" | "solar" | "unreliable";
  elevation_m: number;
  terrain_type: "plains" | "hilly" | "mountainous" | "riverine";
  is_rail_terminal?: boolean;
  x: number;
  y: number;
  capacityKg: number;
  usedKg: number;
  tempZones: string[];
  activeDocks: number;
  riskStatus: "Optimal" | "Moderate" | "Constrained";
  role_tag?: string;
  label_pos?: "top" | "bottom" | "left" | "right" | "top-left" | "bottom-left" | "bottom-right" | "top-right";
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
  type: string;
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
    name: "NH-27 Guwahati–Siliguri 4-Lane East-West Arterial",
    osm_way_id: "way/789210941",
    path: "M 680 240 L 430 240",
    status: "clear",
    score: 96,
    width: "Four-Lane (14.0m)",
    surface: "Asphalt (High Speed)",
    length_km: 480.0,
    note: "Primary national transit trunk. Optimal heavy reefer corridor with continuous FASTag RFID telemetry.",
    vehicle_viability: { truck: true, mini_truck: true, tractor: true, two_wheeler: true },
  },
  {
    id: "seg-2",
    name: "Siliguri Corridor Junction & NJP Logistics Siding",
    osm_way_id: "way/612984102",
    path: "M 430 240 L 405 270",
    status: "clear",
    score: 88,
    width: "Multi-Lane Hub (12.0m)",
    surface: "Asphalt",
    length_km: 18.5,
    note: "Strategic transit fulcrum ('Chicken's Neck'). High-throughput crossdock switching with dedicated rail siding.",
    vehicle_viability: { truck: true, mini_truck: true, tractor: true, two_wheeler: true },
  },
  {
    id: "seg-3",
    name: "NH-12 Siliguri–Kolkata Port Express Corridor",
    osm_way_id: "way/502819330",
    path: "M 430 240 L 430 480",
    status: "clear",
    score: 92,
    width: "Four-Lane Expressway (13.5m)",
    surface: "Asphalt",
    length_km: 560.0,
    note: "Direct marine export and industrial connector from Siliguri crossdock down to Kolkata Port.",
    vehicle_viability: { truck: true, mini_truck: true, tractor: true, two_wheeler: true },
  },
  {
    id: "seg-4",
    name: "Northern Freight Trunk: Delhi NCR → Siliguri (NH-27/NH-19)",
    osm_way_id: "way/410928172",
    path: "M 430 240 Q 250 260 80 240",
    status: "clear",
    score: 90,
    width: "6-Lane National Corridor (18.0m)",
    surface: "Asphalt",
    length_km: 1450.0,
    note: "National capital multi-modal line. Seamless CP-SAT long-haul reefer relay into Northern India.",
    vehicle_viability: { truck: true, mini_truck: true, tractor: true, two_wheeler: true },
  },
  {
    id: "seg-5",
    name: "NH-10 Sevoke–Gangtok Teesta River Hill Pass",
    osm_way_id: "way/381902881",
    path: "M 430 90 L 430 240",
    status: "difficult",
    score: 48,
    width: "Two-Lane Mountain Cut (6.5m)",
    surface: "Paved / Rockfall Netting",
    length_km: 115.0,
    note: "High-altitude descent from Sikkim highlands (1650m ASL). Narrow curves & active rockfall protection near Sevoke.",
    vehicle_viability: { truck: false, mini_truck: true, tractor: true, two_wheeler: true },
  },
  {
    id: "seg-6",
    name: "GS Road Shillong–Guwahati 4-Lane Hill Corridor",
    osm_way_id: "way/890123716",
    path: "M 680 340 L 680 240",
    status: "clear",
    score: 86,
    width: "Four-Lane Hill Expressway (12.0m)",
    surface: "Asphalt",
    length_km: 100.0,
    note: "Meghalaya organic agricultural express route with smart IoT thermal checkpoints.",
    vehicle_viability: { truck: true, mini_truck: true, tractor: true, two_wheeler: true },
  },
  {
    id: "seg-7",
    name: "NH-15 Brahmaputra North Bank Tezpur Valley Link",
    osm_way_id: "way/904128471",
    path: "M 780 160 L 680 240",
    status: "clear",
    score: 82,
    width: "Two-Lane Highway (7.5m)",
    surface: "Asphalt",
    length_km: 180.0,
    note: "North Bank agricultural collector for Tezpur litchi, organic tea, and dairy produce.",
    vehicle_viability: { truck: true, mini_truck: true, tractor: true, two_wheeler: true },
  },
  {
    id: "seg-8",
    name: "NH-29 Dimapur–Kohima–Imphal Mountain Pass",
    osm_way_id: "way/920184712",
    path: "M 950 260 L 970 360",
    status: "difficult",
    score: 54,
    width: "Two-Lane Mountain Pass (7.0m)",
    surface: "Paved Gravel",
    length_km: 215.0,
    note: "Mountain arterial serving Manipur valley with steep hairpin bends. Escort vehicles advised.",
    vehicle_viability: { truck: false, mini_truck: true, tractor: true, two_wheeler: true },
  },
  {
    id: "seg-9",
    name: "NH-6 Meghalaya–Silchar Barak Valley Sinking Zone",
    osm_way_id: "way/934501289",
    path: "M 680 340 L 790 400",
    status: "blocked",
    score: 30,
    width: "Single-Lane Mountain Route (4.5m)",
    surface: "Loose Silt / Rock Bed",
    length_km: 135.0,
    note: "Active landslide clearance near Sonapur tunnel. Rerouting required via rail parcel rake.",
    vehicle_viability: { truck: false, mini_truck: false, tractor: false, two_wheeler: false },
  },
];

export const RURAL_HUBS_GEO: MapHub[] = [
  // 1. Primary Mega Hub (Guwahati, Assam)
  {
    id: "gau_hub",
    name: "Guwahati Northeast Central Mega Hub",
    code: "GAU-HUB",
    state: "Assam",
    node_type: "warehouse",
    power_reliability: "grid",
    elevation_m: 55,
    terrain_type: "plains",
    is_rail_terminal: true,
    x: 680,
    y: 240,
    capacityKg: 180000,
    usedKg: 142000,
    tempZones: ["-25°C Frozen Sea/Meat", "+4°C Organic Agro", "+2°C Pharma Vault", "Tea Cold Buffer"],
    activeDocks: 22,
    riskStatus: "Optimal",
    role_tag: "PRIMARY MEGA HUB",
    label_pos: "bottom-right",
  },

  // 2. Strategic Central Gateway (Siliguri, North Bengal)
  {
    id: "sgu_ctr",
    name: "Siliguri Transit Centre (Chicken's Neck Hub)",
    code: "SGU-CTR",
    state: "West Bengal / Gateway",
    node_type: "crossdock",
    power_reliability: "grid",
    elevation_m: 122,
    terrain_type: "plains",
    is_rail_terminal: true,
    x: 430,
    y: 240,
    capacityKg: 160000,
    usedKg: 128000,
    tempZones: ["Intermodal Crossdock", "+2°C to +4°C Cold Buffer", "Reefer Rail Yard"],
    activeDocks: 20,
    riskStatus: "Optimal",
    role_tag: "TRANSIT CENTRE",
    label_pos: "top-left",
  },

  // 3. National Capital Gateway (Delhi NCR)
  {
    id: "del_hub",
    name: "Delhi NCR Mega Logistics Terminal",
    code: "DEL-HUB",
    state: "Delhi NCR",
    node_type: "rail_freight_terminal",
    power_reliability: "grid",
    elevation_m: 216,
    terrain_type: "plains",
    is_rail_terminal: true,
    x: 80,
    y: 240,
    capacityKg: 220000,
    usedKg: 175000,
    tempZones: ["Intermodal DFC Reefer Flatcars", "-25°C Cold Vault", "+4°C Pharma"],
    activeDocks: 24,
    riskStatus: "Optimal",
    role_tag: "DELHI TERMINAL",
    label_pos: "top-left",
  },

  // 4. Eastern Maritime Gateway (Kolkata Port)
  {
    id: "kol_hub",
    name: "Kolkata Port & Distribution Gateway",
    code: "KOL-PORT",
    state: "West Bengal",
    node_type: "warehouse",
    power_reliability: "grid",
    elevation_m: 9,
    terrain_type: "plains",
    is_rail_terminal: true,
    x: 430,
    y: 480,
    capacityKg: 200000,
    usedKg: 165000,
    tempZones: ["-25°C Marine Export", "+4°C FMCG & Fresh Dairy", "Reefer Rail Flatcars"],
    activeDocks: 24,
    riskStatus: "Optimal",
    role_tag: "PORT GATEWAY",
    label_pos: "right",
  },

  // 5. Gangetic Plains Connector (Patna)
  {
    id: "pat_hub",
    name: "Patna Gangetic Crossdock & Siding",
    code: "PAT-XDK",
    state: "Bihar",
    node_type: "crossdock",
    power_reliability: "grid",
    elevation_m: 53,
    terrain_type: "plains",
    is_rail_terminal: true,
    x: 250,
    y: 260,
    capacityKg: 95000,
    usedKg: 68000,
    tempZones: ["+4°C Produce", "+12°C Agro Storage"],
    activeDocks: 10,
    riskStatus: "Optimal",
    label_pos: "bottom",
  },

  // 6. Sikkim (Gangtok)
  {
    id: "gtk_node",
    name: "Gangtok Organic Highland Depot",
    code: "GTK-HILL",
    state: "Sikkim",
    node_type: "hilly_aggregation_node",
    power_reliability: "solar",
    elevation_m: 1650,
    terrain_type: "mountainous",
    is_rail_terminal: false,
    x: 430,
    y: 90,
    capacityKg: 22000,
    usedKg: 15400,
    tempZones: ["+4°C Large Cardamom", "+10°C Organic Ginger"],
    activeDocks: 3,
    riskStatus: "Moderate",
    label_pos: "top",
  },

  // 7. Arunachal Pradesh (Itanagar / Naharlagun)
  {
    id: "ita_node",
    name: "Itanagar Foothills Agro Depot",
    code: "ITA-HILL",
    state: "Arunachal Pradesh",
    node_type: "hilly_aggregation_node",
    power_reliability: "solar",
    elevation_m: 320,
    terrain_type: "hilly",
    is_rail_terminal: false,
    x: 880,
    y: 100,
    capacityKg: 24000,
    usedKg: 16800,
    tempZones: ["+4°C Organic Kiwi", "+6°C Oranges & Apples"],
    activeDocks: 3,
    riskStatus: "Optimal",
    label_pos: "top",
  },

  // 8. Assam - North Bank (Tezpur)
  {
    id: "tzp_node",
    name: "Tezpur Perishables Cluster",
    code: "TZP-AGRO",
    state: "Assam",
    node_type: "informal_cold_storage",
    power_reliability: "solar",
    elevation_m: 48,
    terrain_type: "plains",
    is_rail_terminal: false,
    x: 780,
    y: 160,
    capacityKg: 32000,
    usedKg: 22000,
    tempZones: ["+4°C Litchi & Produce", "+10°C Vegetables"],
    activeDocks: 4,
    riskStatus: "Optimal",
    label_pos: "top",
  },

  // 9. Assam - Upper Assam Tea (Jorhat)
  {
    id: "jrh_node",
    name: "Jorhat Upper Assam Tea Belt",
    code: "JRH-AGRO",
    state: "Assam",
    node_type: "aggregation_point",
    power_reliability: "solar",
    elevation_m: 87,
    terrain_type: "plains",
    is_rail_terminal: false,
    x: 900,
    y: 190,
    capacityKg: 38000,
    usedKg: 28500,
    tempZones: ["+15°C Orthodox Tea", "+4°C Citrus & Fruits"],
    activeDocks: 5,
    riskStatus: "Optimal",
    label_pos: "bottom",
  },

  // 10. Assam - East Multimodal Terminal (Dibrugarh)
  {
    id: "dib_node",
    name: "Dibrugarh Multimodal Terminal",
    code: "DIB-RLY",
    state: "Assam",
    node_type: "rail_freight_terminal",
    power_reliability: "grid",
    elevation_m: 108,
    terrain_type: "plains",
    is_rail_terminal: true,
    x: 1040,
    y: 140,
    capacityKg: 85000,
    usedKg: 62000,
    tempZones: ["Rail Container Siding", "+4°C Perishables"],
    activeDocks: 10,
    riskStatus: "Optimal",
    label_pos: "right",
  },

  // 11. Nagaland (Dimapur)
  {
    id: "dmp_node",
    name: "Dimapur Rail Gateway & Agro Hub",
    code: "DMP-RLY",
    state: "Nagaland",
    node_type: "rail_freight_terminal",
    power_reliability: "grid",
    elevation_m: 145,
    terrain_type: "plains",
    is_rail_terminal: true,
    x: 950,
    y: 260,
    capacityKg: 40000,
    usedKg: 29000,
    tempZones: ["+4°C Naga Chilli & Pineapple", "Rail Flatcar Yard"],
    activeDocks: 6,
    riskStatus: "Optimal",
    label_pos: "right",
  },

  // 12. Manipur (Imphal)
  {
    id: "imp_node",
    name: "Imphal Valley Agro Cluster",
    code: "IMP-HUB",
    state: "Manipur",
    node_type: "hilly_aggregation_node",
    power_reliability: "solar",
    elevation_m: 786,
    terrain_type: "hilly",
    is_rail_terminal: false,
    x: 970,
    y: 360,
    capacityKg: 28000,
    usedKg: 19500,
    tempZones: ["+4°C Black Rice & Bamboo", "+12°C Floriculture"],
    activeDocks: 4,
    riskStatus: "Optimal",
    label_pos: "right",
  },

  // 13. Meghalaya (Shillong)
  {
    id: "shl_node",
    name: "Shillong Highlands Aggregation Node",
    code: "SHL-HILL",
    state: "Meghalaya",
    node_type: "hilly_aggregation_node",
    power_reliability: "solar",
    elevation_m: 1525,
    terrain_type: "mountainous",
    is_rail_terminal: false,
    x: 680,
    y: 340,
    capacityKg: 26000,
    usedKg: 19500,
    tempZones: ["+4°C Lakadong Turmeric", "+8°C Exotic Flowers"],
    activeDocks: 4,
    riskStatus: "Optimal",
    label_pos: "left",
  },

  // 14. Assam - Barak Valley Gateway (Silchar)
  {
    id: "slc_node",
    name: "Silchar Barak Valley Hub",
    code: "SLC-VAL",
    state: "Assam",
    node_type: "crossdock",
    power_reliability: "grid",
    elevation_m: 25,
    terrain_type: "riverine",
    is_rail_terminal: true,
    x: 790,
    y: 400,
    capacityKg: 50000,
    usedKg: 36000,
    tempZones: ["Barak Valley Transshipment", "+4°C Produce"],
    activeDocks: 8,
    riskStatus: "Optimal",
    label_pos: "bottom",
  },

  // 15. Mizoram (Aizawl)
  {
    id: "azl_node",
    name: "Aizawl Highland Aggregation Depot",
    code: "AZL-HILL",
    state: "Mizoram",
    node_type: "hilly_aggregation_node",
    power_reliability: "solar",
    elevation_m: 1132,
    terrain_type: "mountainous",
    is_rail_terminal: false,
    x: 820,
    y: 500,
    capacityKg: 22000,
    usedKg: 14800,
    tempZones: ["+4°C Anthurium & Dragon Fruit", "+10°C Mizo Chilli"],
    activeDocks: 3,
    riskStatus: "Optimal",
    label_pos: "bottom",
  },

  // 16. Tripura (Agartala)
  {
    id: "agt_node",
    name: "Agartala Cross-Border & Agro Depot",
    code: "AGT-HUB",
    state: "Tripura",
    node_type: "crossdock",
    power_reliability: "grid",
    elevation_m: 15,
    terrain_type: "plains",
    is_rail_terminal: true,
    x: 690,
    y: 470,
    capacityKg: 35000,
    usedKg: 24500,
    tempZones: ["+4°C Queen Pineapple", "+18°C Rubber Storage"],
    activeDocks: 6,
    riskStatus: "Optimal",
    label_pos: "left",
  },
];

export const RURAL_CORRIDORS_GEO: MapCorridor[] = [
  // Core National Arterials (Connecting Northeast to Delhi & Kolkata via Siliguri)
  {
    id: "c_sgu_del_road",
    from: "sgu_ctr",
    to: "del_hub",
    mode: "road",
    condition: "paved",
    terrain_type: "plains",
    gradient_pct: 0.5,
    elevation_gain_m: 94,
    path: "M 430 240 Q 250 260 80 240",
    distanceKm: 1450,
    transitHours: 26.0,
    status: "Optimal",
  },
  {
    id: "rly_sgu_del",
    from: "sgu_ctr",
    to: "del_hub",
    mode: "rail",
    condition: "paved",
    terrain_type: "plains",
    gradient_pct: 0.2,
    elevation_gain_m: 94,
    path: "M 430 240 Q 250 220 80 240",
    distanceKm: 1420,
    transitHours: 20.0,
    status: "Rail Corridor",
  },
  {
    id: "c_gau_sgu_road",
    from: "gau_hub",
    to: "sgu_ctr",
    mode: "road",
    condition: "paved",
    terrain_type: "plains",
    gradient_pct: 0.6,
    elevation_gain_m: 67,
    path: "M 680 240 L 430 240",
    distanceKm: 480,
    transitHours: 9.5,
    status: "Optimal",
  },
  {
    id: "rly_gau_sgu",
    from: "gau_hub",
    to: "sgu_ctr",
    mode: "rail",
    condition: "paved",
    terrain_type: "plains",
    gradient_pct: 0.3,
    elevation_gain_m: 67,
    path: "M 680 240 Q 555 215 430 240",
    distanceKm: 470,
    transitHours: 8.0,
    status: "Rail Corridor",
  },
  {
    id: "c_sgu_kol_road",
    from: "sgu_ctr",
    to: "kol_hub",
    mode: "road",
    condition: "paved",
    terrain_type: "plains",
    gradient_pct: 0.4,
    elevation_gain_m: 0,
    path: "M 430 240 L 430 480",
    distanceKm: 560,
    transitHours: 11.0,
    status: "Optimal",
  },
  {
    id: "rly_sgu_kol",
    from: "sgu_ctr",
    to: "kol_hub",
    mode: "rail",
    condition: "paved",
    terrain_type: "plains",
    gradient_pct: 0.2,
    elevation_gain_m: 0,
    path: "M 430 240 Q 405 360 430 480",
    distanceKm: 575,
    transitHours: 9.5,
    status: "Rail Corridor",
  },

  // Sikkim Pass
  {
    id: "c_sgu_gtk",
    from: "sgu_ctr",
    to: "gtk_node",
    mode: "local",
    condition: "seasonal",
    terrain_type: "mountainous",
    gradient_pct: 7.2,
    elevation_gain_m: 1528,
    path: "M 430 90 L 430 240",
    distanceKm: 115,
    transitHours: 3.8,
    status: "Mountain Pass",
  },

  // North Bank (Guwahati -> Tezpur -> Itanagar)
  {
    id: "c_gau_tzp",
    from: "gau_hub",
    to: "tzp_node",
    mode: "local",
    condition: "paved",
    terrain_type: "plains",
    gradient_pct: 0.4,
    elevation_gain_m: 0,
    path: "M 680 240 L 780 160",
    distanceKm: 180,
    transitHours: 3.5,
    status: "Clear",
  },
  {
    id: "c_tzp_ita",
    from: "tzp_node",
    to: "ita_node",
    mode: "local",
    condition: "paved",
    terrain_type: "hilly",
    gradient_pct: 4.2,
    elevation_gain_m: 272,
    path: "M 780 160 L 880 100",
    distanceKm: 140,
    transitHours: 3.2,
    status: "Clear",
  },

  // Upper Assam & Nagaland (Guwahati -> Jorhat -> Dibrugarh / Dimapur)
  {
    id: "c_gau_jrh",
    from: "gau_hub",
    to: "jrh_node",
    mode: "road",
    condition: "paved",
    terrain_type: "plains",
    gradient_pct: 0.5,
    elevation_gain_m: 32,
    path: "M 680 240 Q 790 220 900 190",
    distanceKm: 305,
    transitHours: 6.2,
    status: "Clear",
  },
  {
    id: "c_jrh_dib",
    from: "jrh_node",
    to: "dib_node",
    mode: "road",
    condition: "paved",
    terrain_type: "plains",
    gradient_pct: 0.3,
    elevation_gain_m: 21,
    path: "M 900 190 L 1040 140",
    distanceKm: 135,
    transitHours: 2.8,
    status: "Clear",
  },
  {
    id: "c_jrh_dmp",
    from: "jrh_node",
    to: "dmp_node",
    mode: "road",
    condition: "paved",
    terrain_type: "plains",
    gradient_pct: 0.8,
    elevation_gain_m: 58,
    path: "M 900 190 L 950 260",
    distanceKm: 110,
    transitHours: 2.4,
    status: "Clear",
  },
  {
    id: "c_dmp_imp",
    from: "dmp_node",
    to: "imp_node",
    mode: "local",
    condition: "seasonal",
    terrain_type: "mountainous",
    gradient_pct: 6.5,
    elevation_gain_m: 641,
    path: "M 950 260 L 970 360",
    distanceKm: 215,
    transitHours: 5.5,
    status: "Mountain Pass",
  },

  // Meghalaya & Southern Northeast (Guwahati -> Shillong -> Silchar -> Aizawl / Agartala)
  {
    id: "c_gau_shl",
    from: "gau_hub",
    to: "shl_node",
    mode: "road",
    condition: "paved",
    terrain_type: "hilly",
    gradient_pct: 5.8,
    elevation_gain_m: 1470,
    path: "M 680 240 L 680 340",
    distanceKm: 100,
    transitHours: 2.5,
    status: "Mountain Pass",
  },
  {
    id: "c_shl_slc",
    from: "shl_node",
    to: "slc_node",
    mode: "local",
    condition: "unpaved",
    terrain_type: "mountainous",
    gradient_pct: 5.2,
    elevation_gain_m: 0,
    path: "M 680 340 L 790 400",
    distanceKm: 210,
    transitHours: 6.0,
    status: "Unpaved Caution",
  },
  {
    id: "c_slc_azl",
    from: "slc_node",
    to: "azl_node",
    mode: "local",
    condition: "seasonal",
    terrain_type: "mountainous",
    gradient_pct: 6.8,
    elevation_gain_m: 1107,
    path: "M 790 400 L 820 500",
    distanceKm: 175,
    transitHours: 5.2,
    status: "Mountain Pass",
  },
  {
    id: "c_slc_agt",
    from: "slc_node",
    to: "agt_node",
    mode: "road",
    condition: "paved",
    terrain_type: "hilly",
    gradient_pct: 2.5,
    elevation_gain_m: 0,
    path: "M 790 400 L 690 470",
    distanceKm: 240,
    transitHours: 5.8,
    status: "Clear",
  },
];

export const RURAL_VEHICLES_MAP: MapVehicle[] = [
  { id: "veh-1", name: "Heavy Reefer Truck (NH-27)", type: "truck", capacityKg: 16000, usedKg: 13500, load_utilization_pct: 84.4, cost_per_km: 28.0, max_gradient_pct: 8.0, temp_control: true, x: 555, y: 240, status: "en_route" },
  { id: "veh-2", name: "Tata Ace Tea LCV (Jorhat)", type: "mini_truck", capacityKg: 1200, usedKg: 940, load_utilization_pct: 78.3, cost_per_km: 10.0, max_gradient_pct: 18.0, temp_control: true, x: 790, y: 215, status: "en_route" },
  { id: "veh-3", name: "Highland 4x4 Bolero (Shillong)", type: "pickup_4x4", capacityKg: 1500, usedKg: 1220, load_utilization_pct: 81.3, cost_per_km: 14.5, max_gradient_pct: 32.0, temp_control: true, x: 680, y: 290, status: "en_route" },
  { id: "veh-4", name: "Northern DFC Rail Rake (Delhi)", type: "truck", capacityKg: 45000, usedKg: 41000, load_utilization_pct: 91.1, cost_per_km: 12.0, max_gradient_pct: 3.0, temp_control: true, x: 255, y: 230, status: "en_route" },
  { id: "veh-5", name: "Kolkata Port Reefer (NH-12)", type: "heavy_truck", capacityKg: 18000, usedKg: 15300, load_utilization_pct: 85.0, cost_per_km: 29.5, max_gradient_pct: 8.0, temp_control: true, x: 430, y: 360, status: "en_route" },
];

interface SwissLogisticsMapProps {
  selectedHubId?: string;
  onSelectHub?: (hub: MapHub) => void;
  roadSegments?: RoadSenseMapSegment[];
  onSelectSegment?: (segment: RoadSenseMapSegment) => void;
}

function SwissLogisticsMapComponent({
  selectedHubId = "gau_hub",
  onSelectHub,
  roadSegments = [],
  onSelectSegment,
}: SwissLogisticsMapProps) {
  const t = useTranslations("home.network");
  const tc = useTranslations("common");
  const tm = useTranslations("map");

  const [activeFilter, setActiveFilter] = useState<"all" | "national" | "roadsense" | "local" | "road" | "rail" | "hilly">("all");
  const [hoveredHub, setHoveredHub] = useState<MapHub | null>(null);
  const [selectedRoadSenseSeg, setSelectedRoadSenseSeg] = useState<RoadSenseMapSegment | null>(null);

  const currentSelectedHub =
    RURAL_HUBS_GEO.find((h) => h.id === selectedHubId) || RURAL_HUBS_GEO[0];

  const visibleCorridors = RURAL_CORRIDORS_GEO.filter((c) => {
    if (activeFilter === "all" || activeFilter === "roadsense") return true;
    if (activeFilter === "national") {
      return c.id.includes("gau_sgu") || c.id.includes("sgu_kol") || c.id.includes("sgu_del");
    }
    if (activeFilter === "rail") return c.mode === "rail";
    if (activeFilter === "hilly") return c.terrain_type === "hilly" || c.terrain_type === "mountainous";
    return c.mode === activeFilter;
  });

  return (
    <div className="w-full bg-white dark:bg-[#121215] border border-neutral-200 dark:border-neutral-800 transition-colors duration-200">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#0c0c0e] font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-black dark:text-white font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="tracking-wide">{tm("title")}</span>
          </div>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <span className="text-neutral-500 dark:text-neutral-400 text-[10px] hidden sm:inline">
            Northeast India Multi-Modal Grid (Seven Sisters & Sikkim)
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-700 p-0.5 rounded-full text-[10px]">
          {(["all", "national", "roadsense", "local", "road", "rail", "hilly"] as const).map((mode) => (
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
                : mode === "national"
                ? tm("filterNational")
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

      {/* Spacious Vector Canvas */}
      <div className="relative w-full overflow-hidden bg-white dark:bg-[#09090b] swiss-grid-pattern py-6 px-4 flex items-center justify-center min-h-[580px] transition-colors duration-200">
        <svg
          viewBox="0 0 1140 560"
          className="w-full max-w-[1140px] h-auto overflow-visible select-none"
        >
          {/* Subtle Swiss Grid Hairlines */}
          <g className="text-neutral-200 dark:text-neutral-800/60 stroke-current" strokeWidth="0.5" strokeDasharray="3 6">
            <line x1="40" y1="90" x2="1100" y2="90" />
            <line x1="40" y1="240" x2="1100" y2="240" />
            <line x1="40" y1="360" x2="1100" y2="360" />
            <line x1="40" y1="480" x2="1100" y2="480" />
            <line x1="80" y1="40" x2="80" y2="530" />
            <line x1="250" y1="40" x2="250" y2="530" />
            <line x1="430" y1="40" x2="430" y2="530" />
            <line x1="680" y1="40" x2="680" y2="530" />
            <line x1="900" y1="40" x2="900" y2="530" />
            <line x1="1040" y1="40" x2="1040" y2="530" />
          </g>

          {/* Minimalist Watermark Geography */}
          {/* Himalayan Ridge Guide */}
          <path
            d="M 360 65 Q 520 40 680 45 T 1060 65"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="dark:stroke-neutral-800"
          />
          <text
            x="480"
            y="48"
            fontFamily="JetBrains Mono, monospace"
            fontSize="8"
            fill="#94a3b8"
            letterSpacing="0.2em"
            opacity="0.8"
          >
            EASTERN HIMALAYAN RIDGELINE (SIKKIM & ARUNACHAL)
          </text>

          {/* Brahmaputra River Basin */}
          <path
            d="M 1080 120 Q 900 170 680 240 T 450 250"
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="6"
            strokeLinecap="round"
            className="dark:stroke-sky-950/40"
          />
          <path
            d="M 1080 120 Q 900 170 680 240 T 450 250"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.7"
          />
          <text
            x="720"
            y="190"
            fontFamily="JetBrains Mono, monospace"
            fontSize="7.5"
            fill="#0284c7"
            letterSpacing="0.1em"
            opacity="0.8"
          >
            {tm("brahmaputraBasin")}
          </text>

          {/* Siliguri Strategic Gateway Marker */}
          <rect
            x="412"
            y="212"
            width="36"
            height="56"
            fill="#fef3c7"
            stroke="#f59e0b"
            strokeWidth="0.8"
            strokeDasharray="2 2"
            opacity="0.35"
            rx="4"
            className="dark:fill-amber-950/20"
          />
          <text
            x="360"
            y="285"
            fontFamily="JetBrains Mono, monospace"
            fontSize="7"
            fill="#d97706"
            fontWeight="600"
            letterSpacing="0.05em"
          >
            {tm("siliguriCorridor")}
          </text>

          {/* Gangetic Northern Trunk Watermark */}
          <text
            x="130"
            y="225"
            fontFamily="JetBrains Mono, monospace"
            fontSize="7.5"
            fill="#a1a1aa"
            letterSpacing="0.15em"
            opacity="0.7"
          >
            GANGETIC PLAINS // DFC NORTHERN TRUNK
          </text>

          {/* Bay of Bengal Reach */}
          <path
            d="M 460 500 Q 540 530 640 550"
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="dark:stroke-neutral-800"
          />
          <text
            x="480"
            y="525"
            fontFamily="JetBrains Mono, monospace"
            fontSize="7.5"
            fill="#a1a1aa"
            letterSpacing="0.15em"
            opacity="0.6"
          >
            BAY OF BENGAL (PORT DISTRIBUTION REACH)
          </text>

          {/* Corridors & Multi-Modal Routing Lines */}
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
              : "#94a3b8";

            return (
              <g key={c.id}>
                {isConnectedToSelected && (
                  <path
                    d={c.path}
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="dark:stroke-neutral-800"
                  />
                )}

                <path
                  d={c.path}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isRail ? 2.5 : isConnectedToSelected ? 2.2 : isFloodRisk ? 1.8 : 1.4}
                  strokeDasharray={isRail ? "4 3" : isFloodRisk ? "3 3" : isUnpaved ? "2 3" : isSeasonal ? "5 3" : "none"}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />

                {isRail && (
                  <path
                    d={c.path}
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="1.2"
                    strokeDasharray="2 5"
                  />
                )}

                {isFloodRisk && (
                  <circle r="3" fill="#e11d48">
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

          {/* RoadSense Layer */}
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
                      strokeWidth={isSelected ? 8 : 6}
                      strokeOpacity={isSelected ? 0.3 : 0.08}
                      strokeLinecap="round"
                      className="group-hover:stroke-neutral-300 transition-all"
                    />

                    <path
                      d={seg.path}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3.2 : 2.0}
                      strokeDasharray={seg.status === "blocked" ? "5 3" : seg.status === "difficult" ? "4 2" : "none"}
                      strokeLinecap="round"
                      className="transition-all duration-200"
                    />

                    {seg.status === "blocked" && (
                      <circle cx="735" cy="370" r="4" fill="#ef4444" className="animate-ping" opacity="0.75" />
                    )}
                    {seg.status === "blocked" && (
                      <circle cx="735" cy="370" r="3" fill="#ef4444" />
                    )}

                    {seg.status === "difficult" && seg.id === "seg-5" && (
                      <circle cx="430" cy="165" r="3" fill="#f59e0b" />
                    )}
                    {seg.status === "difficult" && seg.id === "seg-8" && (
                      <circle cx="960" cy="310" r="3" fill="#f59e0b" />
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Minimalist Live Fleet Pulses */}
          {RURAL_VEHICLES_MAP.map((veh) => (
            <g key={veh.id} className="transition-transform duration-700">
              <circle
                cx={veh.x}
                cy={veh.y}
                r="3.5"
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth="1.2"
                className="dark:fill-white dark:stroke-black drop-shadow-xs"
              />
              <circle
                cx={veh.x}
                cy={veh.y}
                r="7"
                fill="none"
                stroke="#0f172a"
                strokeWidth="0.6"
                opacity="0.4"
                className="animate-ping"
              />
            </g>
          ))}

          {/* Interactive Hub Nodes */}
          {RURAL_HUBS_GEO.map((hub) => {
            const isSelected = hub.id === selectedHubId;
            const isHovered = hoveredHub?.id === hub.id;
            const isRailTerminal = hub.is_rail_terminal;
            const isMountainNode = hub.node_type === "hilly_aggregation_node";
            const isAggregation = hub.node_type === "aggregation_point";
            const isGuwahatiHub = hub.id === "gau_hub";
            const isSiliguriCtr = hub.id === "sgu_ctr";

            // Smart Label Offset Calculation
            let labelX = hub.x + 12;
            let labelY = hub.y + 4;
            let textAnchor: "start" | "end" | "middle" = "start";

            if (hub.label_pos === "top") {
              labelX = hub.x;
              labelY = hub.y - 12;
              textAnchor = "middle";
            } else if (hub.label_pos === "bottom") {
              labelX = hub.x;
              labelY = hub.y + 18;
              textAnchor = "middle";
            } else if (hub.label_pos === "left") {
              labelX = hub.x - 12;
              labelY = hub.y + 4;
              textAnchor = "end";
            } else if (hub.label_pos === "top-left") {
              labelX = hub.x - 10;
              labelY = hub.y - 8;
              textAnchor = "end";
            } else if (hub.label_pos === "bottom-right") {
              labelX = hub.x + 12;
              labelY = hub.y + 12;
              textAnchor = "start";
            }

            return (
              <g
                key={hub.id}
                className="cursor-pointer group"
                onClick={() => onSelectHub && onSelectHub(hub)}
                onMouseEnter={() => setHoveredHub(hub)}
                onMouseLeave={() => setHoveredHub(null)}
              >
                {/* Glowing Aura for Primary Mega Hub & Transit Centre */}
                {(isGuwahatiHub || isSiliguriCtr) && (
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r={isGuwahatiHub ? 18 : 16}
                    fill="none"
                    stroke={isGuwahatiHub ? "#10b981" : "#f59e0b"}
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                    opacity="0.9"
                    className="animate-spin-slow"
                  />
                )}

                {isSelected && (
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r="14"
                    fill="none"
                    stroke="#0a0a0a"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    className="dark:stroke-white animate-spin-slow"
                  />
                )}

                {isHovered && !isSelected && (
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r="10"
                    fill="#f1f5f9"
                    stroke="#94a3b8"
                    strokeWidth="0.8"
                    className="dark:fill-neutral-800 dark:stroke-neutral-600"
                  />
                )}

                {isRailTerminal ? (
                  <rect
                    x={hub.x - 5}
                    y={hub.y - 5}
                    width="10"
                    height="10"
                    fill={isSelected ? "#1e1b4b" : isGuwahatiHub ? "#047857" : isSiliguriCtr ? "#d97706" : "#4338ca"}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    className="transition-all duration-200"
                  />
                ) : isMountainNode ? (
                  <polygon
                    points={`${hub.x},${hub.y - 6} ${hub.x - 6},${hub.y + 5} ${hub.x + 6},${hub.y + 5}`}
                    fill={isSelected ? "#78350f" : "#b45309"}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    className="transition-all duration-200"
                  />
                ) : isAggregation ? (
                  <rect
                    x={hub.x - 4}
                    y={hub.y - 4}
                    width="8"
                    height="8"
                    transform={`rotate(45 ${hub.x} ${hub.y})`}
                    fill={isSelected ? "#000000" : "#ffffff"}
                    stroke="#000000"
                    strokeWidth={isSelected ? 1.8 : 1.2}
                    className="dark:fill-neutral-900 dark:stroke-white transition-all duration-200"
                  />
                ) : (
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r={isSelected ? 6 : 4.5}
                    fill="#ffffff"
                    stroke={isSelected ? "#0a0a0a" : "#334155"}
                    strokeWidth={isSelected ? 1.8 : 1.2}
                    className="dark:fill-neutral-900 dark:stroke-neutral-300 transition-all duration-200"
                  />
                )}

                {/* Clean Hub Code Label */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={textAnchor}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9"
                  fontWeight={isSelected ? "700" : "600"}
                  fill={isSelected ? "#0a0a0a" : "#334155"}
                  className="dark:fill-neutral-200 transition-colors pointer-events-none"
                >
                  {hub.code}
                </text>

                {/* Subtle Clean Role Badge */}
                {hub.role_tag && (
                  <text
                    x={labelX}
                    y={labelY + 11}
                    textAnchor={textAnchor}
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="7"
                    fontWeight="bold"
                    fill={isGuwahatiHub ? "#059669" : isSiliguriCtr ? "#d97706" : "#2563eb"}
                    className="pointer-events-none tracking-wider"
                  >
                    ★ {hub.role_tag}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Telemetry Deep-Dive or Segment Modal */}
        {selectedRoadSenseSeg ? (
          <div className="absolute top-4 right-4 p-3.5 border border-black dark:border-neutral-700 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md font-mono text-xs max-w-xs space-y-2.5 shadow-lg animate-fade-up transition-colors duration-200">
            <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              <span>{tm("segmentIntelligence")}</span>
              <button
                onClick={() => setSelectedRoadSenseSeg(null)}
                className="text-neutral-400 hover:text-black dark:hover:text-white px-1 font-bold text-xs"
                title="Close"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="font-semibold text-black dark:text-white text-xs">{selectedRoadSenseSeg.name}</div>
              <div className="text-[9px] text-neutral-500 dark:text-neutral-400">OSM: {selectedRoadSenseSeg.osm_way_id}</div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-[9px] bg-neutral-50 dark:bg-neutral-900 p-2 border border-neutral-200 dark:border-neutral-800">
              <div>
                <span className="text-neutral-400 block">{tm("score")}</span>
                <span className={`font-bold text-xs ${
                  selectedRoadSenseSeg.score >= 70 ? "text-emerald-600" : selectedRoadSenseSeg.score >= 40 ? "text-amber-600" : "text-rose-600"
                }`}>
                  {selectedRoadSenseSeg.score}/100
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block">{tm("surface")}</span>
                <span className="font-semibold text-black dark:text-white truncate block">{selectedRoadSenseSeg.surface.split(" ")[0]}</span>
              </div>
              <div>
                <span className="text-neutral-400 block">{tm("width")}</span>
                <span className="font-semibold text-black dark:text-white">{selectedRoadSenseSeg.width.split(" ")[0]}</span>
              </div>
            </div>

            {selectedRoadSenseSeg.note && (
              <div className="p-1.5 bg-neutral-100/70 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-[10px] font-sans text-neutral-700 dark:text-neutral-300 leading-tight">
                {selectedRoadSenseSeg.note}
              </div>
            )}

            <div className="grid grid-cols-2 gap-1 font-mono text-[9px]">
              <div className={`p-1 border rounded flex items-center justify-between ${
                selectedRoadSenseSeg.vehicle_viability.truck ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300 opacity-70"
              }`}>
                <span>🚛 16T Truck</span>
                <span>{selectedRoadSenseSeg.vehicle_viability.truck ? "✅" : "❌"}</span>
              </div>
              <div className={`p-1 border rounded flex items-center justify-between ${
                selectedRoadSenseSeg.vehicle_viability.mini_truck ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300 opacity-70"
              }`}>
                <span>🚐 Mini-Truck</span>
                <span>{selectedRoadSenseSeg.vehicle_viability.mini_truck ? "✅" : "❌"}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute top-4 right-4 p-3 border border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md font-mono text-xs max-w-xs space-y-1.5 shadow-xs transition-colors duration-200">
            <div className="flex items-center justify-between text-[9px] text-neutral-400 uppercase tracking-wider">
              <span>{currentSelectedHub.node_type.replace(/_/g, " ")} // {currentSelectedHub.state}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
                {tm("power")} {currentSelectedHub.power_reliability}
              </span>
            </div>
            <div className="font-semibold text-black dark:text-white text-xs">{currentSelectedHub.name}</div>
            <div className="flex items-center gap-2 text-[9px]">
              <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                🏔️ {currentSelectedHub.elevation_m}m ASL
              </span>
              <span className="px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 uppercase font-semibold">
                {currentSelectedHub.terrain_type}
              </span>
            </div>
            <div className="text-[10px] text-neutral-600 dark:text-neutral-400 pt-0.5">
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

        {/* Minimalist Legend Panel */}
        <div className="absolute bottom-4 left-4 p-3 border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#121215]/95 backdrop-blur-md font-mono text-[9px] space-y-1.5 text-neutral-700 dark:text-neutral-300 shadow-xs max-w-xs transition-colors duration-200">
          <div className="text-neutral-400 dark:text-neutral-500 uppercase text-[8.5px] font-bold">{tm("legendTitle")}</div>
          
          <div className="grid grid-cols-3 gap-2 font-semibold">
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 bg-emerald-500 rounded-xs" />
              <span>{tm("clearLegend")}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 bg-amber-500 rounded-xs" />
              <span>{tm("difficultLegend")}</span>
            </div>
            <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <span className="w-2 h-2 bg-rose-500 rounded-xs" />
              <span>{tm("blockedLegend")}</span>
            </div>
          </div>

          <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-[1.5px] bg-black dark:bg-white inline-block" />
              <span>Road</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-[2px] bg-indigo-600 border-b border-dashed border-white inline-block" />
              <span>Rail DFC</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-[1.5px] border-b border-dashed border-amber-700 inline-block" />
              <span>Pass</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const SwissLogisticsMap = memo(SwissLogisticsMapComponent);
export default memo(SwissLogisticsMapComponent);
