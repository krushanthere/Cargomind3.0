import enum
import uuid
from sqlalchemy import String, Enum, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class HubType(str, enum.Enum):
    aggregation_point = "aggregation_point"
    informal_cold_storage = "informal_cold_storage"
    warehouse = "warehouse"
    crossdock = "crossdock"
    rail_yard = "rail_yard"
    rail_freight_terminal = "rail_freight_terminal"
    hilly_aggregation_node = "hilly_aggregation_node"


class PowerReliability(str, enum.Enum):
    grid = "grid"
    solar = "solar"
    unreliable = "unreliable"


class TerrainType(str, enum.Enum):
    plains = "plains"
    hilly = "hilly"
    mountainous = "mountainous"
    riverine = "riverine"


class Hub(Base):
    __tablename__ = "hubs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)
    type: Mapped[HubType] = mapped_column(Enum(HubType), default=HubType.aggregation_point, nullable=False)
    power_reliability: Mapped[PowerReliability] = mapped_column(
        Enum(PowerReliability), default=PowerReliability.grid, nullable=False
    )
    cold_storage_capacity_kg: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    elevation_m: Mapped[float] = mapped_column(Float, nullable=False, default=50.0)
    terrain_type: Mapped[str] = mapped_column(String(50), nullable=False, default="plains")
    is_rail_terminal: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    @property
    def node_type(self) -> HubType:
        return self.type

    routes_origin = relationship("Route", foreign_keys="Route.origin_hub_id", back_populates="origin_hub")
    routes_dest = relationship("Route", foreign_keys="Route.dest_hub_id", back_populates="dest_hub")
    shipments_origin = relationship("Shipment", foreign_keys="Shipment.origin_hub_id", back_populates="origin_hub")
    shipments_dest = relationship("Shipment", foreign_keys="Shipment.dest_hub_id", back_populates="dest_hub")
