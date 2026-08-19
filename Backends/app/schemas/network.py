from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.models.hub import HubType
from app.models.route import TransportMode


class HubBase(BaseModel):
    name: str
    lat: float
    lon: float
    type: HubType
    cold_storage_capacity_kg: float = Field(default=0.0, ge=0)
    is_active: bool = True


class HubCreate(HubBase):
    pass


class HubRead(HubBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)


class HubCapacityRead(BaseModel):
    hub_id: UUID
    hub_name: str
    total_cold_storage_capacity_kg: float
    available_capacity_kg: float
    utilization_percentage: float


class RouteBase(BaseModel):
    origin_hub_id: UUID
    dest_hub_id: UUID
    mode: TransportMode
    avg_transit_hrs: float = Field(..., gt=0)
    base_cost_per_kg: float = Field(..., gt=0)
    reliability_score: float = Field(default=1.0, ge=0.0, le=1.0)


class RouteCreate(RouteBase):
    pass


class RouteRead(RouteBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)


class RouteScoreRead(BaseModel):
    route_id: UUID
    origin_hub_id: UUID
    dest_hub_id: UUID
    mode: TransportMode
    avg_transit_hrs: float
    base_cost_per_kg: float
    reliability_score: float
    composite_score: float


class NetworkGraphRead(BaseModel):
    hubs: List[HubRead]
    routes: List[RouteRead]

