export type TenantRole = "shipper" | "carrier" | "admin";

export type ShipmentTempClass =
  | "frozen"
  | "chilled"
  | "ambient";

export type ShipmentStatus =
  | "pending"
  | "consolidated"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type HubType =
  | "origin"
  | "destination"
  | "transfer";

export type RouteMode = "road" | "rail";

export type PlanStatus =
  | "draft"
  | "approved"
  | "dispatched"
  | "cancelled";

export type DecisionType =
  | "risk"
  | "capacity"
  | "cost";

export type PlanType =
  | "Cost Optimized"
  | "Fastest"
  | "Lowest Risk";

/* ----------------------------- */
/* Tenant                        */
/* ----------------------------- */

export interface Tenant {
  id: string;
  name: string;
  type: TenantRole;
}

/* ----------------------------- */
/* Hub                           */
/* ----------------------------- */

export interface Hub {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: HubType;
  cold_storage_capacity_kg: number;
  is_active: boolean;
}

/* ----------------------------- */
/* Route                         */
/* ----------------------------- */

export interface NetworkRoute {
  id: string;
  origin_hub_id: string;
  dest_hub_id: string;
  mode: RouteMode;
  avg_transit_hrs: number;
  base_cost_per_kg: number;
  reliability_score: number;
}

/* ----------------------------- */
/* Shipment                      */
/* ----------------------------- */

export interface Shipment {
  id: string;
  tenant_id: string;
  origin_hub_id: string;
  dest_hub_id: string;
  weight_kg: number;
  volume_cbm: number;
  temp_class: ShipmentTempClass;
  sla_deadline: string;
  max_cost: number;
  status: ShipmentStatus;
}

export interface CreateShipmentRequest {
  origin_hub_id: string;
  dest_hub_id: string;
  weight_kg: number;
  volume_cbm: number;
  temp_class: ShipmentTempClass;
  sla_deadline: string;
  max_cost: number;
}

/* ----------------------------- */
/* Consolidation                 */
/* ----------------------------- */

export interface ConsolidationPlan {
  id: string;
  tenant_id?: string;
  shipment_ids: string[];
  route_ids: string[];
  departure_time: string;
  total_cost: number;
  risk_score: number;
  plan_rank: number;
  status: PlanStatus;

  /*
   * These fields are useful for the frontend
   * when the backend returns additional
   * optimization information.
   */
  transit_hours?: number;
  distance_km?: number;
  capacity_used?: number;
  capacity_total?: number;
  reliability_score?: number;
  road_percentage?: number;
  rail_percentage?: number;
}

export interface ConsolidationRequest {
  shipment_ids?: string[];
  origin_hub_id?: string;
  destination_hub_id?: string;
  departure_time?: string;
}

/* ----------------------------- */
/* Explainability                */
/* ----------------------------- */

export interface ExplanationItem {
  id?: string;
  plan_id: string;
  decision_type: DecisionType;
  factor_name: string;
  factor_weight: number;
  human_readable_text: string;
}

/* ----------------------------- */
/* Risk                          */
/* ----------------------------- */

export interface RiskResult {
  risk_score: number;
  delay_risk?: number;
  spoilage_risk?: number;

  /*
   * Optional because different backend
   * risk responses may expose additional
   * model information.
   */
  factors?: RiskFactor[];
}

export interface RiskFactor {
  name: string;
  weight: number;
  contribution?: number;
  description?: string;
}

/* ----------------------------- */
/* Temperature telemetry         */
/* ----------------------------- */

export interface TemperatureLog {
  id?: string;
  shipment_id: string;
  timestamp: string;
  temperature_c: number;
}

export interface TemperatureAnomaly {
  id?: string;
  shipment_id: string;
  severity: "info" | "warning" | "critical";
  timestamp?: string;
  temperature?: number;
  message?: string;
}

/* ----------------------------- */
/* AI                            */
/* ----------------------------- */

export interface NarratePlanRequest {
  plan_id: string;
}

export interface NarratePlanResponse {
  plan_id: string;
  narrative: string;
  grounded_in?: string[];
}

export interface SummarizeAnomalyRequest {
  shipment_id: string;
  logs: TemperatureLog[];
}

export interface SummarizeAnomalyResponse {
  shipment_id: string;
  severity: "info" | "warning" | "critical";
  summary: string;
  recommended_action: string;
  grounded_in?: string[];
}

export interface AIChatRequest {
  plan_id?: string;
  question: string;
}

export interface AIChatResponse {
  answer: string;
  grounded_in?: string[];
}

export interface ExtractShipmentResponse {
  origin_hub_id?: string;
  destination_hub_id?: string;
  weight_kg?: number;
  volume_cbm?: number;
  temp_class?: ShipmentTempClass;
  sla_deadline?: string;
  max_cost?: number;
}

export interface ParseQueryResponse {
  filters: Record<string, unknown>;
}

/* ----------------------------- */
/* API errors                    */
/* ----------------------------- */

export interface APIErrorResponse {
  detail?: string;
  message?: string;
}