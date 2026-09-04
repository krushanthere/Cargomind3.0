import enum
import uuid
from typing import Any, Dict
from datetime import datetime, timezone
from sqlalchemy import String, Enum, Float, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class VehicleType(str, enum.Enum):
    # Specialized North East India Fleet Types
    cargo_boat = "cargo_boat"
    cargo_ropeway = "cargo_ropeway"
    atv = "atv"
    river_ferry = "river_ferry"

    # Multimodal and standard variants / backward compatibility
    riverine_boat = "riverine_boat"
    pickup_4x4 = "pickup_4x4"
    mini_truck = "mini_truck"
    heavy_truck = "heavy_truck"
    truck = "truck"
    three_wheeler_cargo = "three_wheeler_cargo"
    tata_ace = "tata_ace"
    bolero_pickup = "bolero_pickup"
    tractor_trailer = "tractor_trailer"
    cargo_erickshaw = "cargo_erickshaw"
    cargo_bike = "cargo_bike"
    tempo = "tempo"
    motorbike = "motorbike"
    shared_auto = "shared_auto"
    tractor = "tractor"
    bus = "bus"
    rail_cargo_wagon = "rail_cargo_wagon"
    other = "other"


class VehicleOwnerType(str, enum.Enum):
    individual = "individual"
    community = "community"
    cooperative = "cooperative"


class VehicleAvailability(str, enum.Enum):
    available = "available"
    en_route = "en_route"
    occupied = "occupied"
    maintenance = "maintenance"
    offline = "offline"


# Default Vehicle Specifications Table (Capacity, Cost/km, Max Gradient, Suitable Terrains)
VEHICLE_TYPE_SPECS: dict[str, dict[str, Any]] = {
    "cargo_boat": {
        "name": "Brahmaputra/Barak Shallow-Draft Cargo Boat",
        "capacity_kg": 3500.0,
        "capacity_cbm": 12.0,
        "cost_per_km": 10.0,
        "max_gradient_pct": 0.0,
        "suitable_terrains": ["riverine"],
        "temp_control_capable": True,
        "description": "Used across Brahmaputra/Barak riverine char areas (Majuli, Dhubri, Silchar) for island produce and rural crossings.",
    },
    "cargo_ropeway": {
        "name": "Aerial Gravity & Motorized Cargo Ropeway",
        "capacity_kg": 600.0,
        "capacity_cbm": 2.0,
        "cost_per_km": 5.0,
        "max_gradient_pct": 85.0,
        "suitable_terrains": ["mountainous", "hilly"],
        "temp_control_capable": True,
        "description": "Used in steep valleys and roadless gorges in Meghalaya (Cherrapunji/Jowai), Arunachal (Tawang), and Sikkim for cliffside transport.",
    },
    "atv": {
        "name": "Heavy-Duty 4x4/6x6 All-Terrain Vehicle (ATV)",
        "capacity_kg": 800.0,
        "capacity_cbm": 3.0,
        "cost_per_km": 9.0,
        "max_gradient_pct": 45.0,
        "suitable_terrains": ["mountainous", "hilly", "plains"],
        "temp_control_capable": True,
        "description": "Used for muddy unpaved mountain trails, landslide bypasses, and extreme off-road terrain in Arunachal, Nagaland, and Mizoram.",
    },
    "river_ferry": {
        "name": "Inland Waterway Ro-Ro / Ro-Pax River Ferry",
        "capacity_kg": 25000.0,
        "capacity_cbm": 65.0,
        "cost_per_km": 18.0,
        "max_gradient_pct": 0.0,
        "suitable_terrains": ["riverine"],
        "temp_control_capable": True,
        "description": "Heavy roll-on freight ferry operating on NW-2 & NW-16 (Guwahati, Neamati-Majuli, Dhubri) for bulk multi-ton transit.",
    },
    "riverine_boat": {
        "name": "Brahmaputra/Barak Shallow-Draft Cargo Boat",
        "capacity_kg": 3500.0,
        "capacity_cbm": 12.0,
        "cost_per_km": 10.0,
        "max_gradient_pct": 0.0,
        "suitable_terrains": ["riverine"],
        "temp_control_capable": True,
    },
    "heavy_truck": {
        "name": "Heavy Truck (HCV)",
        "capacity_kg": 16000.0,
        "capacity_cbm": 35.0,
        "cost_per_km": 28.0,
        "max_gradient_pct": 8.0,
        "suitable_terrains": ["plains"],
        "temp_control_capable": True,
    },
    "truck": {
        "name": "Heavy Truck (HCV)",
        "capacity_kg": 16000.0,
        "capacity_cbm": 35.0,
        "cost_per_km": 28.0,
        "max_gradient_pct": 8.0,
        "suitable_terrains": ["plains"],
        "temp_control_capable": True,
    },
    "three_wheeler_cargo": {
        "name": "Three-wheeler Cargo (Ape, Alfa)",
        "capacity_kg": 500.0,
        "capacity_cbm": 2.5,
        "cost_per_km": 7.5,
        "max_gradient_pct": 12.0,
        "suitable_terrains": ["plains"],
        "temp_control_capable": False,
    },
    "mini_truck": {
        "name": "Tata Ace (Chhota Hathi)",
        "capacity_kg": 1000.0,
        "capacity_cbm": 4.5,
        "cost_per_km": 10.0,
        "max_gradient_pct": 18.0,
        "suitable_terrains": ["plains", "hilly"],
        "temp_control_capable": True,
    },
    "tata_ace": {
        "name": "Tata Ace (Chhota Hathi)",
        "capacity_kg": 1000.0,
        "capacity_cbm": 4.5,
        "cost_per_km": 10.0,
        "max_gradient_pct": 18.0,
        "suitable_terrains": ["plains", "hilly"],
        "temp_control_capable": True,
    },
    "pickup_4x4": {
        "name": "Mahindra Bolero Pickup 4x4",
        "capacity_kg": 1500.0,
        "capacity_cbm": 6.0,
        "cost_per_km": 14.5,
        "max_gradient_pct": 30.0,
        "suitable_terrains": ["plains", "hilly", "mountainous"],
        "temp_control_capable": True,
    },
    "bolero_pickup": {
        "name": "Mahindra Bolero Pickup 4x4",
        "capacity_kg": 1500.0,
        "capacity_cbm": 6.0,
        "cost_per_km": 14.5,
        "max_gradient_pct": 30.0,
        "suitable_terrains": ["plains", "hilly", "mountainous"],
        "temp_control_capable": True,
    },
    "tractor_trailer": {
        "name": "Swaraj / Mahindra Agro Tractor Trailer",
        "capacity_kg": 3500.0,
        "capacity_cbm": 12.0,
        "cost_per_km": 18.0,
        "max_gradient_pct": 8.0,
        "suitable_terrains": ["plains"],
        "temp_control_capable": False,
    },
    "cargo_erickshaw": {
        "name": "Mahindra Treo Zor / Euler EV Cargo",
        "capacity_kg": 500.0,
        "capacity_cbm": 2.5,
        "cost_per_km": 6.0,
        "max_gradient_pct": 6.0,
        "suitable_terrains": ["plains"],
        "temp_control_capable": False,
    },
    "cargo_bike": {
        "name": "Heavy-Duty Cargo E-Bike / Mountain Carrier",
        "capacity_kg": 100.0,
        "capacity_cbm": 0.5,
        "cost_per_km": 3.0,
        "max_gradient_pct": 22.0,
        "suitable_terrains": ["plains", "hilly", "mountainous"],
        "temp_control_capable": True,
    },
    "tempo": {
        "name": "Force Traveller / Ashok Leyland Dost",
        "capacity_kg": 1800.0,
        "capacity_cbm": 7.0,
        "cost_per_km": 13.0,
        "max_gradient_pct": 14.0,
        "suitable_terrains": ["plains", "hilly"],
        "temp_control_capable": True,
    },
    "motorbike": {
        "name": "Hero Passion Rural Carrier Box",
        "capacity_kg": 80.0,
        "capacity_cbm": 0.35,
        "cost_per_km": 4.0,
        "max_gradient_pct": 20.0,
        "suitable_terrains": ["plains", "hilly", "mountainous"],
        "temp_control_capable": True,
    },
    "shared_auto": {
        "name": "Bajaj Maxima / Piaggio Ape Cargo",
        "capacity_kg": 450.0,
        "capacity_cbm": 2.2,
        "cost_per_km": 7.0,
        "max_gradient_pct": 8.0,
        "suitable_terrains": ["plains"],
        "temp_control_capable": False,
    },
    "tractor": {
        "name": "Agro Farm Tractor",
        "capacity_kg": 3000.0,
        "capacity_cbm": 10.0,
        "cost_per_km": 17.0,
        "max_gradient_pct": 8.0,
        "suitable_terrains": ["plains"],
        "temp_control_capable": False,
    },
    "bus": {
        "name": "Rural Passenger-Cargo Bus",
        "capacity_kg": 2500.0,
        "capacity_cbm": 9.0,
        "cost_per_km": 15.0,
        "max_gradient_pct": 10.0,
        "suitable_terrains": ["plains", "hilly"],
        "temp_control_capable": False,
    },
    "rail_cargo_wagon": {
        "name": "NFR Rail Cargo Wagon Rake",
        "capacity_kg": 55000.0,
        "capacity_cbm": 85.0,
        "cost_per_km": 6.5,
        "max_gradient_pct": 2.5,
        "suitable_terrains": ["plains"],
        "temp_control_capable": True,
    },
    "other": {
        "name": "Auxiliary Rural Carrier",
        "capacity_kg": 1000.0,
        "capacity_cbm": 4.0,
        "cost_per_km": 10.0,
        "max_gradient_pct": 12.0,
        "suitable_terrains": ["plains", "hilly"],
        "temp_control_capable": False,
    },
}


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_code: Mapped[str] = mapped_column(String(50), nullable=False, default="AS-01-TC-0000", index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    type: Mapped[VehicleType] = mapped_column(Enum(VehicleType), default=VehicleType.cargo_boat, nullable=False)
    capacity_kg: Mapped[float] = mapped_column(Float, nullable=False, default=1000.0)
    capacity_cbm: Mapped[float] = mapped_column(Float, nullable=False, default=5.0)
    cost_per_km: Mapped[float] = mapped_column(Float, nullable=False, default=12.0)
    max_gradient_pct: Mapped[float] = mapped_column(Float, nullable=False, default=15.0)
    suitable_terrains: Mapped[str] = mapped_column(String(100), nullable=False, default="plains,hilly")
    temp_control: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    owner_type: Mapped[VehicleOwnerType] = mapped_column(
        Enum(VehicleOwnerType), default=VehicleOwnerType.individual, nullable=False
    )
    current_location_name: Mapped[str] = mapped_column(String(255), nullable=False, default="Guwahati Central Logistics Hub")
    current_location_lat: Mapped[float] = mapped_column(Float, nullable=False, default=26.1820)
    current_location_lon: Mapped[float] = mapped_column(Float, nullable=False, default=91.7450)
    availability_status: Mapped[VehicleAvailability] = mapped_column(
        Enum(VehicleAvailability), default=VehicleAvailability.available, nullable=False, index=True
    )
    current_assignment: Mapped[str | None] = mapped_column(String(255), nullable=True, default=None)
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
