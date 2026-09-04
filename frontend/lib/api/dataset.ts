import { apiClient } from "./client";

export interface DatasetSummary {
  region: string;
  states_covered: string[];
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
  return apiClient.get<DatasetSummary>("/api/dataset/summary");
}

export async function fetchHabitations(params?: {
  state?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<HabitationsResponse> {
  const q = new URLSearchParams();
  if (params?.state) q.set("state", params.state);
  if (params?.search) q.set("search", params.search);
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  const qs = q.toString();
  return apiClient.get<HabitationsResponse>(`/api/dataset/habitations${qs ? `?${qs}` : ""}`);
}

export async function queryElevationPoint(lat: number, lon: number): Promise<ElevationPointResponse> {
  return apiClient.post<ElevationPointResponse>("/api/dataset/elevation/point", { lat, lon });
}

export async function queryElevationProfile(
  orig_lat: number,
  orig_lon: number,
  dest_lat: number,
  dest_lon: number,
  distance_km?: number
): Promise<ElevationProfileResponse> {
  return apiClient.post<ElevationProfileResponse>("/api/dataset/elevation/profile", {
    orig_lat,
    orig_lon,
    dest_lat,
    dest_lon,
    distance_km,
  });
}
