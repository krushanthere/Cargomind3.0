from uuid import UUID
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict
from app.models.roadsense import (
    RoadSegmentStatus,
    RoadSurfaceType,
    RoadWidthClass,
    VehicleProfileType,
    ClearanceClass,
)


# --- Road Report Schemas ---
class RoadReportBase(BaseModel):
    segment_id: UUID
    reporter_id: Optional[str] = "driver-field"
    status: RoadSegmentStatus = RoadSegmentStatus.clear
    note: Optional[str] = None
    client_id: Optional[UUID] = None


class RoadReportCreate(RoadReportBase):
    pass


class RoadReportRead(RoadReportBase):
    id: UUID
    reported_at: datetime
    synced_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Road Segment Schemas ---
class RoadSegmentBase(BaseModel):
    name: str
    osm_way_id: Optional[str] = None
    geometry: Optional[Any] = None  # GeoJSON LineString or list of coordinates
    length_km: float = 1.0
    width_class: RoadWidthClass = RoadWidthClass.single_lane
    surface_type: RoadSurfaceType = RoadSurfaceType.paved
    static_base_score: float = 70.0
    current_status: RoadSegmentStatus = RoadSegmentStatus.clear
    block_name: Optional[str] = "Kamrup-Metro Corridor"
    route_id: Optional[UUID] = None


class RoadSegmentCreate(RoadSegmentBase):
    pass


class RoadSegmentRead(RoadSegmentBase):
    id: UUID
    last_report_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoadSegmentWithReports(RoadSegmentRead):
    reports: List[RoadReportRead] = []

    model_config = ConfigDict(from_attributes=True)


# --- Vehicle Profile Schemas ---
class VehicleProfileBase(BaseModel):
    type: VehicleProfileType
    name: str
    max_width: float
    clearance_class: ClearanceClass = ClearanceClass.standard
    min_surface_rating: float = 40.0
    unpaved_capable: bool = True
    description: Optional[str] = None


class VehicleProfileCreate(VehicleProfileBase):
    pass


class VehicleProfileRead(VehicleProfileBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)


# --- Roadability Scoring & Recommendation Schemas (Phase 2 Ready) ---
class RoadabilityScoreResponse(BaseModel):
    segment_id: UUID
    segment_name: str
    vehicle_type: VehicleProfileType
    score: float
    status: RoadSegmentStatus
    status_emoji: str
    recommended: bool
    breakdown: List[str]
    static_base_score: float
    recency_penalty: float
    last_report_note: Optional[str] = None
    last_reported_at: Optional[datetime] = None
