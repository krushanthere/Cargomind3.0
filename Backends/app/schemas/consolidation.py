from datetime import datetime
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.models.consolidation_plan import PlanStatus


class ConsolidationPlanRequest(BaseModel):
    shipment_ids: Optional[List[UUID]] = None
    corridor_origin_hub_id: Optional[UUID] = None
    corridor_dest_hub_id: Optional[UUID] = None
    departure_window_start: Optional[datetime] = None
    max_risk_threshold: Optional[float] = 0.5


class ExplanationItem(BaseModel):
    id: UUID
    plan_id: UUID
    decision_type: str
    factor_name: str
    factor_weight: float
    human_readable_text: str

    model_config = ConfigDict(from_attributes=True)


class ConsolidationPlanRead(BaseModel):
    id: UUID
    tenant_id: UUID
    shipment_ids: List[UUID]
    route_ids: List[UUID]
    departure_time: datetime
    total_cost: float
    risk_score: float
    plan_rank: int
    status: PlanStatus
    created_at: datetime
    explanations: Optional[List[ExplanationItem]] = []

    model_config = ConfigDict(from_attributes=True)
