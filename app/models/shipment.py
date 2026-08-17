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
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    volume_cbm: Mapped[float] = mapped_column(Float, nullable=False)
    temp_class: Mapped[TempClass] = mapped_column(Enum(TempClass), nullable=False)
    sla_deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    max_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[ShipmentStatus] = mapped_column(
        Enum(ShipmentStatus), nullable=False, default=ShipmentStatus.pending, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    tenant = relationship("Tenant", back_populates="shipments")
    origin_hub = relationship("Hub", foreign_keys=[origin_hub_id], back_populates="shipments_origin")
    dest_hub = relationship("Hub", foreign_keys=[dest_hub_id], back_populates="shipments_dest")
    temperature_logs = relationship("TemperatureLog", back_populates="shipment", cascade="all, delete-orphan")
