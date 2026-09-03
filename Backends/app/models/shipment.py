import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Enum, Float, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class TempClass(str, enum.Enum):
    frozen = "frozen"
    chilled = "chilled"
    ambient = "ambient"


class GoodType(str, enum.Enum):
    farm_produce = "farm_produce"
    medicine = "medicine"
    essential_goods = "essential_goods"


class UrgencyLevel(str, enum.Enum):
    routine = "routine"
    high = "high"
    critical = "critical"


class ShipmentStatus(str, enum.Enum):
    pending = "pending"
    grouped = "grouped"
    in_transit = "in_transit"
    delivered = "delivered"


class Shipment(Base):
    __tablename__ = "shipments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    origin_hub_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hubs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    dest_hub_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hubs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    good_type: Mapped[GoodType] = mapped_column(
        Enum(GoodType), default=GoodType.farm_produce, nullable=False, index=True
    )
    urgency: Mapped[UrgencyLevel] = mapped_column(
        Enum(UrgencyLevel), default=UrgencyLevel.routine, nullable=False, index=True
    )
    producer_id: Mapped[str] = mapped_column(String(255), default="prod-community-01", nullable=False, index=True)
    producer_name: Mapped[str] = mapped_column(String(255), default="Community Farmer / Primary Health Centre", nullable=False)
    community_id: Mapped[str] = mapped_column(String(255), default="comm-cluster-01", nullable=False, index=True)
    waybill_number: Mapped[str] = mapped_column(String(50), default="RUR-90001", nullable=False, index=True)
    load_quantity: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    quantity_units: Mapped[str] = mapped_column(String(50), nullable=False, default="units")
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    volume_cbm: Mapped[float] = mapped_column(Float, nullable=False)
    temp_class: Mapped[TempClass] = mapped_column(Enum(TempClass), nullable=False)
    sla_deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    max_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[ShipmentStatus] = mapped_column(
        Enum(ShipmentStatus), nullable=False, default=ShipmentStatus.pending, index=True
    )
    client_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    tenant = relationship("Tenant", back_populates="shipments")
    origin_hub = relationship("Hub", foreign_keys=[origin_hub_id], back_populates="shipments_origin")
    dest_hub = relationship("Hub", foreign_keys=[dest_hub_id], back_populates="shipments_dest")
    temperature_logs = relationship("TemperatureLog", back_populates="shipment", cascade="all, delete-orphan")
    allocations = relationship("AllocationHistory", back_populates="shipment")
