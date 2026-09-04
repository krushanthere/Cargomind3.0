import enum
import uuid
from datetime import date
from sqlalchemy import String, Enum, Float, Boolean, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class TransportMode(str, enum.Enum):
    road = "road"
    local = "local"
    rail = "rail"
    waterway = "waterway"


class Route(Base):
    __tablename__ = "routes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    origin_hub_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hubs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    dest_hub_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hubs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    mode: Mapped[TransportMode] = mapped_column(Enum(TransportMode), default=TransportMode.road, nullable=False)
    distance_km: Mapped[float] = mapped_column(Float, nullable=False, default=25.0)
    avg_transit_hrs: Mapped[float] = mapped_column(Float, nullable=False)
    base_cost_per_kg: Mapped[float] = mapped_column(Float, nullable=False)
    reliability_score: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    elevation_gain_m: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    avg_gradient_pct: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    terrain_type: Mapped[str] = mapped_column(String(50), nullable=False, default="plains")

    origin_hub = relationship("Hub", foreign_keys=[origin_hub_id], back_populates="routes_origin")
    dest_hub = relationship("Hub", foreign_keys=[dest_hub_id], back_populates="routes_dest")
    history = relationship("RouteHistory", back_populates="route", cascade="all, delete-orphan")
    road_conditions = relationship("RoadConditionReport", back_populates="route", cascade="all, delete-orphan")


class RouteHistory(Base):
    __tablename__ = "route_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("routes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    trip_date: Mapped[date] = mapped_column(Date, nullable=False)
    actual_transit_hrs: Mapped[float] = mapped_column(Float, nullable=False)
    delayed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    delay_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    season: Mapped[str] = mapped_column(String(50), nullable=False, default="summer")

    route = relationship("Route", back_populates="history")
