from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class StressDecayRequest(BaseModel):
    temperature_celsius: float = Field(default=22.0, description="Ambient or container temperature (°C)")
    vibration_rms: Optional[float] = Field(default=None, description="RMS vibration in m/s^2")
    peak_acceleration: Optional[float] = Field(default=None, description="Peak acceleration in m/s^2")
    duration_hrs: float = Field(default=1.0, gt=0, description="Exposure duration in hours")
    vibration_intensity: Optional[str] = Field(default=None, description="Low, moderate, high, severe")


class StressDecayResponse(BaseModel):
    stress_factor: float = Field(..., ge=0.0, le=1.0, description="Normalized mechanical stress factor")
    stress_multiplier: float = Field(..., ge=1.0, description="Additive multiplier applied to Arrhenius decay")
    mechanical_damage: float = Field(..., ge=0.0, le=1.0, description="Accumulated physical bruising fraction")
    confidence: str
    vibration_level: str
    vibration_rms: float
    peak_acceleration: float
    duration_hrs: float
    thermal_amplification: float
