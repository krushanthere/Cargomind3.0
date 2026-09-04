import { apiClient } from "./client";

export interface CensusMetrics {
  total_settlements: number;
  total_villages: number;
  total_cd_blocks: number;
  total_towns: number;
  total_population: number;
  total_households: number;
  total_cultivators: number;
  total_agri_labourers: number;
  overall_literacy_rate_pct: number;
  overall_st_sc_pct: number;
  total_daily_agri_produce_tons: number;
  total_daily_inbound_freight_tons: number;
}

export interface CensusStateSummary {
  state_code: string;
  total_settlements: number;
  villages_count: number;
  cd_blocks_count: number;
  towns_count: number;
  total_population: number;
  total_households: number;
  total_workers: number;
  main_cultivators: number;
  main_agri_labourers: number;
  literates_population: number;
  literacy_rate_pct: number;
  st_population: number;
  sc_population: number;
  st_sc_percentage: number;
  agri_workforce_pct: number;
  daily_agri_tonnage: number;
  daily_inbound_tonnage: number;
}

export interface CensusSummary {
  dataset_name: string;
  authority: string;
  license: string;
  region: string;
  states_count: number;
  total_records: number;
  total_villages: number;
  total_cd_blocks: number;
  total_towns: number;
  total_population: number;
  total_households: number;
  total_workers: number;
  total_cultivators: number;
  total_agricultural_labourers: number;
  overall_literacy_rate_pct: number;
  overall_st_sc_pct: number;
  total_daily_agri_produce_tons: number;
  total_daily_inbound_freight_tons: number;
  state_breakdown: Record<string, CensusStateSummary>;
}

export interface CensusSettlementItem {
  state: string;
  state_code: string;
  district: string;
  level: string;
  name: string;
  area_type: string;
  state_code_num: number;
  district_code: number;
  cd_block_code: number;
  town_village_code: number;
  households: number;
  total_population: number;
  male_population: number;
  female_population: number;
  child_0_6_population: number;
  sc_population: number;
  st_population: number;
  st_sc_percentage: number;
  literates_population: number;
  illiterates_population: number;
  literacy_rate_pct: number;
  total_workers: number;
  main_workers: number;
  main_cultivators: number;
  main_agri_labourers: number;
  main_household_industry: number;
  main_other_workers: number;
  marginal_workers: number;
  marginal_cultivators: number;
  marginal_agri_labourers: number;
  non_workers: number;
  cultivator_ratio_pct: number;
  agri_workforce_total: number;
  agri_workforce_pct: number;
  logistics_metrics: {
    daily_agri_produce_kg: number;
    daily_agri_produce_tons: number;
    daily_inbound_freight_kg: number;
    daily_inbound_freight_tons: number;
    coldchain_pharma_demand_units: number;
    recommended_pickup_vehicle: string;
  };
}

export interface CensusSettlementsResponse {
  total_matches: number;
  limit: number;
  offset: number;
  data: CensusSettlementItem[];
}

export interface CensusDemandProxyRequest {
  state?: string;
  district?: string;
  settlement_name?: string;
  households?: number;
  total_population?: number;
  cultivators?: number;
  agri_labourers?: number;
  child_0_6?: number;
}

export interface CensusDemandProxyResponse {
  settlement_name: string;
  state: string;
  district: string;
  input_metrics: {
    households: number;
    total_population: number;
    cultivators: number;
    agri_labourers: number;
    child_0_6: number;
  };
  freight_projections: {
    daily_outbound_agri_produce_kg: number;
    daily_outbound_agri_produce_tons: number;
    weekly_outbound_agri_produce_tons: number;
    daily_inbound_essential_goods_kg: number;
    daily_inbound_essential_goods_tons: number;
    weekly_coldchain_pharma_units: number;
  };
  dispatch_recommendation: {
    recommended_vehicle: string;
    vehicle_name: string;
    estimated_weekly_trips: number;
    consolidation_feasibility_score: number;
  };
}

export interface DatasetSummary {
  region: string;
  states_covered: string[];
  census_metrics?: CensusMetrics;
  total_habitations: number;
  total_roads_length_km: number;
  total_railway_stations: number;
  total_railway_tracks: number;
  srtm_dem_tiles_count: number;
  srtm_resolution: string;
  sources: Array<{
    name: string;
    authority: string;
    license: string;
    url: string;
  }>;
  state_breakdown: Record<
    string,
    {
      habitations_count: number;
      total_population: number;
      avg_population_per_habitation: number;
      sample_top_habitations: string[];
    }
  >;
  census_state_breakdown?: Record<string, CensusStateSummary>;
}

export interface HabitationItem {
  id: string;
  name: string;
  state: string;
  state_code: string;
  district_id: number;
  block_id: number;
  population: number;
  estimated_weekly_demand_kg: number;
  lat: number;
  lon: number;
  elevation_m?: number;
  terrain_type?: string;
}

export interface HabitationsResponse {
  total_matches: number;
  limit: number;
  offset: number;
  data: HabitationItem[];
}

export interface ElevationPointResponse {
  lat: number;
  lon: number;
  elevation_m: number;
  terrain_type: string;
  source: string;
}

export interface ElevationProfileResponse {
  origin_elevation_m: number;
  dest_elevation_m: number;
  elevation_gain_m: number;
  gradient_pct: number;
  terrain_type: string;
  speed_factor: number;
  cost_multiplier: number;
  estimated_transit_hrs: number;
  speed_kmh: number;
}

export async function fetchDatasetSummary(): Promise<DatasetSummary> {
  return apiClient.get<DatasetSummary>("/dataset/summary");
}

export async function fetchCensusSummary(): Promise<CensusSummary> {
  return apiClient.get<CensusSummary>("/dataset/census/summary");
}

export async function fetchCensusSettlements(params?: {
  state?: string;
  district?: string;
  level?: string;
  area_type?: string;
  search?: string;
  min_cultivators?: number;
  sort_by?: string;
  order?: string;
  limit?: number;
  offset?: number;
}): Promise<CensusSettlementsResponse> {
  const q = new URLSearchParams();
  if (params?.state && params.state !== "All States") q.set("state", params.state);
  if (params?.district) q.set("district", params.district);
  if (params?.level && params.level !== "All Levels") q.set("level", params.level);
  if (params?.area_type && params.area_type !== "All Types") q.set("area_type", params.area_type);
  if (params?.search) q.set("search", params.search);
  if (params?.min_cultivators !== undefined) q.set("min_cultivators", String(params.min_cultivators));
  if (params?.sort_by) q.set("sort_by", params.sort_by);
  if (params?.order) q.set("order", params.order);
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  const qs = q.toString();
  return apiClient.get<CensusSettlementsResponse>(`/dataset/census/settlements${qs ? `?${qs}` : ""}`);
}

export async function calculateCensusDemandProxy(req: CensusDemandProxyRequest): Promise<CensusDemandProxyResponse> {
  return apiClient.post<CensusDemandProxyResponse>("/dataset/census/demand-proxy", req);
}

export async function fetchHabitations(params?: {
  state?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<HabitationsResponse> {
  const q = new URLSearchParams();
  if (params?.state && params.state !== "All States") q.set("state", params.state);
  if (params?.search) q.set("search", params.search);
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  const qs = q.toString();
  return apiClient.get<HabitationsResponse>(`/dataset/habitations${qs ? `?${qs}` : ""}`);
}

export async function queryElevationPoint(lat: number, lon: number): Promise<ElevationPointResponse> {
  return apiClient.post<ElevationPointResponse>("/dataset/elevation/point", { lat, lon });
}

export async function queryElevationProfile(
  orig_lat: number,
  orig_lon: number,
  dest_lat: number,
  dest_lon: number,
  distance_km?: number
): Promise<ElevationProfileResponse> {
  return apiClient.post<ElevationProfileResponse>("/dataset/elevation/profile", {
    orig_lat,
    orig_lon,
    dest_lat,
    dest_lon,
    distance_km,
  });
}
