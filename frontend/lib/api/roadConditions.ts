import { apiClient } from "./client";
import { RoadConditionReport, RoadCondition } from "../../types";

export async function getRoadConditions(): Promise<RoadConditionReport[]> {
  return apiClient.get<RoadConditionReport[]>("/road-conditions");
}

export async function reportRoadCondition(data: {
  route_id: string;
  condition: RoadCondition;
  reported_by?: string;
  notes?: string;
}): Promise<RoadConditionReport> {
  return apiClient.post<RoadConditionReport>("/road-conditions", data);
}

export async function getRouteRoadCondition(
  routeId: string
): Promise<RoadConditionReport> {
  return apiClient.get<RoadConditionReport>(`/road-conditions/route/${routeId}`);
}
