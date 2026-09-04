import enum
import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional
from sqlalchemy import String, Enum, Float, Boolean, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class RoadSegmentStatus(str, enum.Enum):
    clear = "clear"
    difficult = "difficult"
    blocked = "blocked"


class RoadSurfaceType(str, enum.Enum):
    asphalt = "asphalt"
    paved = "paved"
    unpaved = "unpaved"
    gravel = "gravel"
    dirt = "dirt"
    concrete = "concrete"


class RoadWidthClass(str, enum.Enum):
    single_lane = "single_lane"
    intermediate = "intermediate"
    two_lane = "two_lane"
    narrow_track = "narrow_track"


class VehicleProfileType(str, enum.Enum):
    truck = "truck"
    mini_truck = "mini_truck"
    tractor = "tractor"
    two_wheeler = "two_wheeler"


class ClearanceClass(str, enum.Enum):
    standard = "standard"
    high = "high"
    ultra_high = "ultra_high"
    low = "low"


class RoadSegment(Base):
    __tablename__ = "road_segments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    osm_way_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    geometry: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)  # GeoJSON LineString coordinates [[lon, lat], ...]
    length_km: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    width_class: Mapped[RoadWidthClass] = mapped_column(
        Enum(RoadWidthClass), default=RoadWidthClass.single_lane, nullable=False
    )
    surface_type: Mapped[RoadSurfaceType] = mapped_column(
        Enum(RoadSurfaceType), default=RoadSurfaceType.paved, nullable=False
    )
    static_base_score: Mapped[float] = mapped_column(Float, nullable=False, default=70.0)
    current_status: Mapped[RoadSegmentStatus] = mapped_column(
        Enum(RoadSegmentStatus), default=RoadSegmentStatus.clear, nullable=False, index=True
    )
    last_report_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    route_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("routes.id", ondelete="SET NULL"), nullable=True, index=True
    )
    block_name: Mapped[str] = mapped_column(String(100), nullable=False, default="Kamrup-Metro Corridor")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    reports: Mapped[List["RoadReport"]] = relationship(
        "RoadReport",
        back_populates="segment",
        cascade="all, delete-orphan",
        order_by="desc(RoadReport.reported_at)",
        lazy="selectin",
    )


class RoadReport(Base):
    __tablename__ = "road_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    segment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("road_segments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reporter_id: Mapped[str] = mapped_column(String(255), nullable=False, default="driver-anonymous")
    status: Mapped[RoadSegmentStatus] = mapped_column(
        Enum(RoadSegmentStatus), default=RoadSegmentStatus.clear, nullable=False, index=True
    )
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    reported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )
    client_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    segment: Mapped["RoadSegment"] = relationship("RoadSegment", back_populates="reports")


class VehicleProfile(Base):
    __tablename__ = "vehicle_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type: Mapped[VehicleProfileType] = mapped_column(
        Enum(VehicleProfileType), unique=True, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    max_width: Mapped[float] = mapped_column(Float, nullable=False)  # in meters
    clearance_class: Mapped[ClearanceClass] = mapped_column(
        Enum(ClearanceClass), default=ClearanceClass.standard, nullable=False
    )
    min_surface_rating: Mapped[float] = mapped_column(Float, nullable=False, default=40.0)
    unpaved_capable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
