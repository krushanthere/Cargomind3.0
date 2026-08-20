from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.road_condition import RoadConditionType


class RoadConditionBase(BaseModel):
    route_id: UUID
    condition: RoadConditionType = RoadConditionType.paved
    reported_by: Optional[str] = None
    notes: Optional[str] = None
    client_id: Optional[UUID] = None


class RoadConditionCreate(RoadConditionBase):
    pass


class RoadConditionRead(RoadConditionBase):
    id: UUID
    reported_at: datetime
    synced_at: datetime

    model_config = ConfigDict(from_attributes=True)
