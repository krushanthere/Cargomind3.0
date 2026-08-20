import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Enum, Float, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class VehicleType(str, enum.Enum):
    motorbike = "motorbike"
    tempo = "tempo"
    tractor = "tractor"
    shared_auto = "shared_auto"
    other = "other"


class VehicleOwnerType(str, enum.Enum):
    individual = "individual"
    community = "community"
    cooperative = "cooperative"


class VehicleAvailability(str, enum.Enum):
    available = "available"
    en_route = "en_route"
    offline = "offline"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    type: Mapped[VehicleType] = mapped_column(Enum(VehicleType), default=VehicleType.tempo, nullable=False)
    capacity_kg: Mapped[float] = mapped_column(Float, nullable=False, default=1000.0)
    capacity_cbm: Mapped[float] = mapped_column(Float, nullable=False, default=5.0)
    temp_control: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    owner_type: Mapped[VehicleOwnerType] = mapped_column(
        Enum(VehicleOwnerType), default=VehicleOwnerType.individual, nullable=False
    )
    current_location_lat: Mapped[float] = mapped_column(Float, nullable=False, default=20.2961)
    current_location_lon: Mapped[float] = mapped_column(Float, nullable=False, default=85.8245)
    availability_status: Mapped[VehicleAvailability] = mapped_column(
        Enum(VehicleAvailability), default=VehicleAvailability.available, nullable=False, index=True
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    client_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    allocations = relationship("AllocationHistory", back_populates="vehicle", cascade="all, delete-orphan")
