from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.models.shipment import TempClass


class RiskPredictionRequest(BaseModel):
    shipment_id: Optional[UUID] = None
    origin_hub_id: Optional[UUID] = None
    dest_hub_id: Optional[UUID] = None
    weight_kg: float = Field(default=1000.0, gt=0)
    temp_class: TempClass = TempClass.chilled
    route_id: Optional[UUID] = None
    departure_time: Optional[datetime] = None
    season: str = "summer"
    road_condition: str = "paved"
    vibration_rms: Optional[float] = Field(default=None, description="RMS vibration in m/s^2")
    peak_acceleration: Optional[float] = Field(default=None, description="Peak acceleration in m/s^2")
    vibration_intensity: Optional[str] = Field(default=None, description="low, moderate, high, severe")
    sensor_temperature_celsius: Optional[float] = Field(default=None, description="Direct sensor temperature reading")


class RiskResult(BaseModel):
    risk_score: float = Field(..., ge=0.0, le=1.0)
    spoilage_component: float = Field(..., ge=0.0, le=1.0)
    delay_component: float = Field(..., ge=0.0, le=1.0)
    confidence: str = Field(default="high")  # "low" or "high"
    predicted_delay_hrs: float
    remaining_shelf_life_pct: float
    thermal_spoilage_component: Optional[float] = Field(default=None, description="Baseline Arrhenius thermal decay")
    mechanical_stress_multiplier: Optional[float] = Field(default=1.0, description="PINN mechanical stress multiplier")
    mechanical_stress_factor: Optional[float] = Field(default=0.0, description="Normalized mechanical damage factor")
    details: Dict[str, Any]

