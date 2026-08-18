import { apiPost } from "@/lib/api/client";

import type {
  RiskResult,
} from "@/types";

export interface RiskPredictionRequest {
  shipment_id?: string;
  origin_hub_id?: string;
  dest_hub_id?: string;
  transit_hours?: number;
  temp_class?: string;
  season?: string;
}

export async function predictRisk(
  data: RiskPredictionRequest,
) {
  return apiPost<
    RiskResult,
    RiskPredictionRequest
  >("/risk/predict", data);
}