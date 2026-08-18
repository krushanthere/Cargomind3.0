import enum
import uuid
from sqlalchemy import String, Enum, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class HubType(str, enum.Enum):
    warehouse = "warehouse"
    rail_yard = "rail_yard"
    crossdock = "crossdock"


class Hub(Base):
    __tablename__ = "hubs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)
    type: Mapped[HubType] = mapped_column(Enum(HubType), nullable=False)
    cold_storage_capacity_kg: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    routes_origin = relationship("Route", foreign_keys="Route.origin_hub_id", back_populates="origin_hub")
    routes_dest = relationship("Route", foreign_keys="Route.dest_hub_id", back_populates="dest_hub")
    shipments_origin = relationship("Shipment", foreign_keys="Shipment.origin_hub_id", back_populates="origin_hub")
    shipments_dest = relationship("Shipment", foreign_keys="Shipment.dest_hub_id", back_populates="dest_hub")
