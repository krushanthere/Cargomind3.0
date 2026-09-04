import { apiClient } from "./client";
import { WeatherData, WeatherRiskResponse } from "../../types";

export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
  return apiClient.get<WeatherData>(`/weather/current?lat=${lat}&lon=${lon}`);
}

export async function calculateWeatherRoadRisk(payload: {
  lat: number;
  lon: number;
  iri_score?: number;
  elevation_m?: number;
  slope_pct?: number;
  w_iri?: number;
  w_elevation?: number;
  w_weather?: number;
}): Promise<WeatherRiskResponse> {
  return apiClient.post<WeatherRiskResponse>("/weather/risk-factor", payload);
}
