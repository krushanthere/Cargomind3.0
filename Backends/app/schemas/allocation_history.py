from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class AllocationHistoryBase(BaseModel):
    producer_id: str
    producer_name: str = "Local Producer"
    community_id: str
    shipment_id: Optional[UUID] = None
    vehicle_id: Optional[UUID] = None
    wait_time_minutes: float = 0.0
    allocation_score: float = 1.0
    urgency: str = "routine"
    good_type: str = "farm_produce"
    explanation_summary: Optional[str] = None
    client_id: Optional[UUID] = None


class AllocationHistoryCreate(AllocationHistoryBase):
    pass


class AllocationHistoryRead(AllocationHistoryBase):
    id: UUID
    matched_at: datetime
    synced_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CommunityFairnessMetric(BaseModel):
    community_id: str
    producer_count: int
    total_allocations: int
    average_wait_time_minutes: float
    max_wait_time_minutes: float
    critical_goods_fulfilled_pct: float
    fairness_index: float  # 0.0 - 1.0 (1.0 = perfectly fair)


class FairnessMetricsResponse(BaseModel):
    overall_fairness_index: float
    regional_avg_wait_minutes: float
    total_dispatches_7d: int
    community_breakdown: List[CommunityFairnessMetric]
    recent_allocations: List[AllocationHistoryRead]
