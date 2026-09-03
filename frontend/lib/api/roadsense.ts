import { apiClient } from "./client";
import {
  RoadSegment,
  RoadReport,
  RoadSegmentStatus,
  VehicleProfile,
  VehicleProfileType,
  RoadabilityScoreResponse,
} from "../../types";

export async function getRoadSegments(blockName?: string): Promise<RoadSegment[]> {
  const query = blockName ? `?block_name=${encodeURIComponent(blockName)}` : "";
  return apiClient.get<RoadSegment[]>(`/roadsense/segments${query}`);
}

export async function getRoadSegment(segmentId: string): Promise<RoadSegment> {
  return apiClient.get<RoadSegment>(`/roadsense/segments/${segmentId}`);
}

export async function submitRoadReport(data: {
  segment_id: string;
  status: RoadSegmentStatus;
  reporter_id?: string;
  note?: string;
  client_id?: string;
}): Promise<RoadReport> {
  return apiClient.post<RoadReport>("/roadsense/reports", data);
}

export async function getVehicleProfiles(): Promise<VehicleProfile[]> {
  return apiClient.get<VehicleProfile[]>("/roadsense/vehicle-profiles");
}

export async function getRoadabilityScore(
  segmentId: string,
  vehicleType: VehicleProfileType = "truck"
): Promise<RoadabilityScoreResponse> {
  return apiClient.get<RoadabilityScoreResponse>(
    `/roadsense/score?segment_id=${segmentId}&vehicle_type=${vehicleType}`
  );
}
