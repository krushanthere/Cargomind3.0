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


class RiskResult(BaseModel):
    risk_score: float = Field(..., ge=0.0, le=1.0)
    spoilage_component: float = Field(..., ge=0.0, le=1.0)
    delay_component: float = Field(..., ge=0.0, le=1.0)
    confidence: str = Field(default="high")  # "low" or "high"
    predicted_delay_hrs: float
    remaining_shelf_life_pct: float
    details: Dict[str, Any]

