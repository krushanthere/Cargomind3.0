from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class AccelerometerSample(BaseModel):
    x: float = Field(..., description="Acceleration in X axis (m/s^2)")
    y: float = Field(..., description="Acceleration in Y axis (m/s^2)")
    z: float = Field(..., description="Acceleration in Z axis (m/s^2)")
    timestamp: Optional[str] = None


class SensorStreamProcessRequest(BaseModel):
    device_id: Optional[str] = "mobile-client-01"
    route_id: Optional[UUID] = None
    road_segment_id: Optional[UUID] = None
    samples: List[AccelerometerSample]
    duration_seconds: Optional[float] = None
    sensor_temperature_celsius: Optional[float] = None
    weather_temperature_celsius: Optional[float] = None


class VibrationSummaryResponse(BaseModel):
    sample_count: int
    duration_seconds: float
    duration_formatted: str
    rms_acceleration: float
    peak_acceleration: float
    mean_magnitude: float
    variance: float
    bumpiness_level: str
    bumpiness_emoji: str
    is_active: bool
    temperature_reading: Dict[str, Any]
    pinn_stress_assessment: Optional[Dict[str, Any]] = None
    road_segment_id: Optional[UUID] = None


class SensorTelemetryIngestRequest(BaseModel):
    device_id: str
    client_id: Optional[str] = None
    route_id: Optional[UUID] = None
    road_segment_id: Optional[UUID] = None
    vibration_rms: float
    peak_acceleration: float
    duration_seconds: float
    sensor_temperature_celsius: Optional[float] = None
    timestamp: Optional[datetime] = None
