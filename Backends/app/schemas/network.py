from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.models.hub import HubType, PowerReliability
from app.models.route import TransportMode
from app.schemas.road_condition import RoadConditionRead


class HubBase(BaseModel):
    name: str
    lat: float
    lon: float
    type: HubType = HubType.aggregation_point
    power_reliability: PowerReliability = PowerReliability.grid
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
    power_reliability: PowerReliability = PowerReliability.grid


class RouteBase(BaseModel):
    origin_hub_id: UUID
    dest_hub_id: UUID
    mode: TransportMode = TransportMode.road
    avg_transit_hrs: float = Field(..., gt=0)
    base_cost_per_kg: float = Field(..., gt=0)
    reliability_score: float = Field(default=1.0, ge=0.0, le=1.0)


class RouteCreate(RouteBase):
    pass


class RouteRead(RouteBase):
    id: UUID
    current_condition: Optional[str] = "paved"

    model_config = ConfigDict(from_attributes=True)


class RouteScoreRead(BaseModel):
    route_id: UUID
    origin_hub_id: UUID
    dest_hub_id: UUID
    mode: TransportMode
    avg_transit_hrs: float
    base_cost_per_kg: float
    reliability_score: float
    current_condition: Optional[str] = "paved"
    composite_score: float


class NetworkGraphRead(BaseModel):
    hubs: List[HubRead]
    routes: List[RouteRead]
    road_conditions: Optional[List[RoadConditionRead]] = []


