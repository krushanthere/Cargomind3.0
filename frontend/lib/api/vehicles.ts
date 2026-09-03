import { apiClient } from "./client";
import { Vehicle, VehicleAvailability, VehicleType } from "../../types";

export async function getVehicles(params?: {
  status?: VehicleAvailability;
  type?: VehicleType;
  temp_control_only?: boolean;
  location?: string;
}): Promise<Vehicle[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append("status", params.status);
  if (params?.type) searchParams.append("type", params.type);
  if (params?.temp_control_only) searchParams.append("temp_control_only", "true");
  if (params?.location) searchParams.append("location", params.location);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return apiClient.get<Vehicle[]>(`/vehicles${query}`);
}

export async function createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
  return apiClient.post<Vehicle>("/vehicles", data);
}

export async function getVehicle(vehicleId: string): Promise<Vehicle> {
  return apiClient.get<Vehicle>(`/vehicles/${vehicleId}`);
}

export async function updateVehicle(
  vehicleId: string,
  data: Partial<Vehicle>
): Promise<Vehicle> {
  return apiClient.patch<Vehicle>(`/vehicles/${vehicleId}`, data);
}

export async function updateVehicleStatus(
  vehicleId: string,
  status: VehicleAvailability,
  lat?: number,
  lon?: number,
  location_name?: string,
  current_assignment?: string | null
): Promise<Vehicle> {
  return apiClient.patch<Vehicle>(`/vehicles/${vehicleId}/status`, {
    availability_status: status,
    current_location_lat: lat,
    current_location_lon: lon,
    current_location_name: location_name,
    current_assignment: current_assignment,
  });
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  return apiClient.delete<void>(`/vehicles/${vehicleId}`);
}
