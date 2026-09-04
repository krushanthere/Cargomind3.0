import { apiClient } from "./client";
import {
  AccelerometerSample,
  VibrationSummary,
  PINNStressAssessment,
} from "../../types";

export async function processSensorStream(payload: {
  samples: AccelerometerSample[];
  duration_seconds?: number;
  sensor_temperature_celsius?: number;
  weather_temperature_celsius?: number;
  road_segment_id?: string;
}): Promise<VibrationSummary> {
  return apiClient.post<VibrationSummary>("/sensors/process", payload);
}

export async function evaluateStressDecay(payload: {
  temperature_celsius?: number;
  vibration_rms?: number;
  peak_acceleration?: number;
  duration_hrs?: number;
  vibration_intensity?: string;
}): Promise<PINNStressAssessment> {
  return apiClient.post<PINNStressAssessment>("/sensors/stress-decay", payload);
}
