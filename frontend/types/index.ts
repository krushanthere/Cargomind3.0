export type TenantRole = "shipper" | "carrier" | "admin";

export type ShipmentTempClass =
  | "frozen"
  | "chilled"
  | "ambient";

export type GoodType =
  | "farm_produce"
  | "medicine"
  | "essential_goods";

export type UrgencyLevel =
  | "routine"
  | "high"
  | "critical";

export type ShipmentStatus =
  | "pending"
  | "grouped"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type HubType =
  | "aggregation_point"
  | "informal_cold_storage"
  | "warehouse"
  | "crossdock";

export type PowerReliability =
  | "grid"
  | "solar"
  | "unreliable";

export type RouteMode = "road" | "local";

export type RoadCondition =
  | "paved"
  | "unpaved"
  | "seasonal"
  | "flood_risk";

export type VehicleType =
  | "motorbike"
  | "tempo"
  | "tractor"
  | "shared_auto"
  | "other";

export type VehicleOwnerType =
  | "individual"
  | "community"
  | "cooperative";

export type VehicleAvailability =
  | "available"
  | "en_route"
  | "offline";

export type PlanStatus =
  | "proposed"
  | "accepted"
  | "rejected"
  | "draft"
  | "dispatched";

export type DecisionType =
  | "risk"
  | "fairness"
  | "urgency"
  | "dynamic_window"
  | "confidence"
  | "capacity"
  | "cost"
  | "routing";

/* ----------------------------- */
/* Tenant                        */
/* ----------------------------- */

export interface Tenant {
  id: string;
  name: string;
  type: TenantRole;
}

/* ----------------------------- */
/* Hub / Rural Pickup Point      */
/* ----------------------------- */

export interface Hub {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: HubType;
  power_reliability?: PowerReliability;
  cold_storage_capacity_kg: number;
  is_active: boolean;
}

/* ----------------------------- */
/* Route & Road Condition        */
/* ----------------------------- */

export interface NetworkRoute {
  id: string;
  origin_hub_id: string;
  dest_hub_id: string;
  mode: RouteMode;
  avg_transit_hrs: number;
  base_cost_per_kg: number;
  reliability_score: number;
  current_condition?: RoadCondition;
}

export interface RoadConditionReport {
  id: string;
  route_id: string;
  condition: RoadCondition;
  reported_at: string;
  reported_by?: string;
  notes?: string;
}

/* ----------------------------- */
/* Rural Transport Fleet         */
/* ----------------------------- */

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  capacity_kg: number;
  capacity_cbm: number;
  temp_control: boolean;
  owner_type: VehicleOwnerType;
  current_location_lat: number;
  current_location_lon: number;
  availability_status: VehicleAvailability;
  last_seen_at: string;
  client_id?: string;
  synced_at?: string;
}

/* ----------------------------- */
/* Shipment / Community Pickup   */
/* ----------------------------- */

export interface Shipment {
  id: string;
  tenant_id: string;
  origin_hub_id: string;
  dest_hub_id: string;
  good_type: GoodType;
  urgency: UrgencyLevel;
  producer_id: string;
  producer_name: string;
  community_id: string;
  weight_kg: number;
  volume_cbm: number;
  temp_class: ShipmentTempClass;
  sla_deadline: string;
  max_cost?: number;
  status: ShipmentStatus;
  client_id?: string;
  synced_at?: string;
  created_at?: string;
}

export interface CreateShipmentRequest {
  origin_hub_id: string;
  dest_hub_id: string;
  good_type: GoodType;
  urgency: UrgencyLevel;
  producer_id?: string;
  producer_name?: string;
  community_id?: string;
  weight_kg: number;
  volume_cbm: number;
  temp_class: ShipmentTempClass;
  sla_deadline: string;
  max_cost?: number;
  client_id?: string;
}

/* ----------------------------- */
/* Dynamic Matching & Dispatch   */
/* ----------------------------- */

export interface DispatchMatchItem {
  shipment_id: string;
  good_type: GoodType;
  urgency: UrgencyLevel;
  producer_id: string;
  producer_name: string;
  community_id: string;
  weight_kg: number;
  matched_vehicle_id: string;
  matched_vehicle_name: string;
  matched_vehicle_type: VehicleType;
  wait_time_minutes: number;
  fairness_boost_pts: number;
  allocation_score: number;
  route_mode: RouteMode;
  dynamic_window_extended: boolean;
  explanation_summary: string;
  reasons: string[];
}

export interface DispatchMatchResponse {
  status: string;
  matched_at: string;
  matched_count: number;
  unmatched_count: number;
  matches: DispatchMatchItem[];
  fairness_summary: string;
}

/* ----------------------------- */
/* Fairness & Allocation History */
/* ----------------------------- */

export interface AllocationHistory {
  id: string;
  producer_id: string;
  producer_name: string;
  community_id: string;
  shipment_id?: string;
  vehicle_id?: string;
  matched_at: string;
  wait_time_minutes: number;
  allocation_score: number;
  urgency: string;
  good_type: string;
  explanation_summary?: string;
  synced_at?: string;
}

export interface CommunityFairnessMetric {
  community_id: string;
  producer_count: number;
  total_allocations: number;
  average_wait_time_minutes: number;
  max_wait_time_minutes: number;
  critical_goods_fulfilled_pct: number;
  fairness_index: number;
}

export interface FairnessMetricsResponse {
  overall_fairness_index: number;
  regional_avg_wait_minutes: number;
  total_dispatches_7d: number;
  community_breakdown: CommunityFairnessMetric[];
  recent_allocations: AllocationHistory[];
}

/* ----------------------------- */
/* Explainability                */
/* ----------------------------- */

export interface ExplanationItem {
  id?: string;
  plan_id?: string;
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
  delay_component?: number;
  spoilage_component?: number;
  confidence?: "low" | "high";
  predicted_delay_hrs?: number;
  remaining_shelf_life_pct?: number;
  details?: Record<string, any>;
}

/* ----------------------------- */
/* Temperature telemetry         */
/* ----------------------------- */

export interface TemperatureLog {
  id?: string;
  shipment_id: string;
  vehicle_id?: string;
  timestamp: string;
  recorded_at?: string;
  temp_celsius: number;
  humidity?: number;
  synced_at?: string;
  client_id?: string;
}

/* ----------------------------- */
/* Offline Sync Queue            */
/* ----------------------------- */

export interface OfflineQueueItem {
  id: string;
  type: "shipment" | "road_condition" | "temperature_log" | "vehicle_status";
  data: any;
  queued_at: string;
  status: "pending" | "syncing" | "synced" | "failed";
  retry_count: number;
}

export interface OfflineSyncState {
  isOnline: boolean;
  pendingCount: number;
  lastSyncedAt?: string;
}

/* ----------------------------- */
/* AI & Intelligence Interfaces  */
/* ----------------------------- */

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
  good_type?: GoodType;
  urgency?: UrgencyLevel;
  weight_kg?: number;
  volume_cbm?: number;
  temp_class?: ShipmentTempClass;
  sla_deadline?: string;
  max_cost?: number;
}

export interface NarratePlanRequest {
  plan_id: string;
}

export interface NarratePlanResponse {
  plan_id: string;
  narrative: string;
  grounded_in?: string[];
}

export interface ParseQueryResponse {
  filters: Record<string, unknown>;
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

/* ----------------------------- */
/* Consolidation Types           */
/* ----------------------------- */

export interface ConsolidationPlan {
  id: string;
  tenant_id?: string;
  shipment_ids: string[];
  route_ids: string[];
  departure_time: string;
  total_cost: number;
  risk_score: number;
  plan_rank?: number;
  status: PlanStatus;
}

export interface ConsolidationRequest {
  shipment_ids?: string[];
  origin_hub_id?: string;
  destination_hub_id?: string;
  departure_time?: string;
}

/* ----------------------------- */
/* API Error Response            */
/* ----------------------------- */

export interface APIErrorResponse {
  detail?: string;
  message?: string;
}