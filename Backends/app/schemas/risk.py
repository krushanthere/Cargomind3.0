from datetime import datetime
from uuid import UUID
from typing import Optional, Dict
from pydantic import BaseModel, ConfigDict, Field
from app.models.shipment import TempClass


class RiskPredictionRequest(BaseModel):
    shipment_id: Optional[UUID] = None
    origin_hub_id: UUID
    dest_hub_id: UUID
    weight_kg: float = Field(..., gt=0)
    temp_class: TempClass
    route_id: UUID
    departure_time: datetime
    season: str = "summer"


class RiskResult(BaseModel):
    risk_score: float = Field(..., ge=0.0, le=1.0)
    spoilage_component: float = Field(..., ge=0.0, le=1.0)
    delay_component: float = Field(..., ge=0.0, le=1.0)
    predicted_delay_hrs: float
    remaining_shelf_life_pct: float
    details: Dict[str, float]
