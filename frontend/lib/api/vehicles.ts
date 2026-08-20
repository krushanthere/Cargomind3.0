import { apiClient } from "./client";
import { Vehicle, VehicleAvailability, VehicleType } from "../../types";

export async function getVehicles(params?: {
  status?: VehicleAvailability;
  type?: VehicleType;
  temp_control_only?: boolean;
}): Promise<Vehicle[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append("status", params.status);
  if (params?.type) searchParams.append("type", params.type);
  if (params?.temp_control_only) searchParams.append("temp_control_only", "true");

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return apiClient.get<Vehicle[]>(`/vehicles${query}`);
}

export async function createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
  return apiClient.post<Vehicle>("/vehicles", data);
}

export async function updateVehicleStatus(
  vehicleId: string,
  status: VehicleAvailability,
  lat?: number,
  lon?: number
): Promise<Vehicle> {
  return apiClient.patch<Vehicle>(`/vehicles/${vehicleId}/status`, {
    availability_status: status,
    current_location_lat: lat,
    current_location_lon: lon,
  });
}
