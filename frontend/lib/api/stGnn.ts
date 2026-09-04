import { apiClient } from "./client";
import { STGNNPrediction, STGNNCorridorRisksListResponse } from "../../types";

export async function predictSTGNN(payload: {
  corridor_id?: string;
  lat?: number;
  lon?: number;
  iri_score?: number;
  elevation_m?: number;
  gradient_pct?: number;
  vibration_rms?: number;
  historical_incidents?: number;
}): Promise<STGNNPrediction> {
  return apiClient.post<STGNNPrediction>("/st-gnn/predict", payload);
}

export async function getCorridorDegradationRisks(): Promise<STGNNCorridorRisksListResponse> {
  return apiClient.get<STGNNCorridorRisksListResponse>("/st-gnn/corridor-risks");
}
