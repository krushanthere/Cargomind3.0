import { apiClient } from "./client";
import {
  DispatchMatchResponse,
  FairnessMetricsResponse,
  AllocationHistory,
} from "../../types";

export interface MatchDispatchRequest {
  corridor_origin_hub_id?: string;
  corridor_dest_hub_id?: string;
  force_window_extension_hrs?: number;
}

export async function runDynamicMatching(
  req: MatchDispatchRequest = {}
): Promise<DispatchMatchResponse> {
  return apiClient.post<DispatchMatchResponse>("/dispatch/match", req);
}

export async function getFairnessMetrics(): Promise<FairnessMetricsResponse> {
  return apiClient.get<FairnessMetricsResponse>("/dispatch/fairness-metrics");
}

export async function getAllocationHistory(
  limit: number = 50
): Promise<AllocationHistory[]> {
  return apiClient.get<AllocationHistory[]>(`/dispatch/history?limit=${limit}`);
}
