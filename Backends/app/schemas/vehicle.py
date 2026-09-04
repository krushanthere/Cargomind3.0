from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.vehicle import VehicleType, VehicleOwnerType, VehicleAvailability


class VehicleBase(BaseModel):
    vehicle_code: str = "AS-01-TC-0000"
    name: str
    type: VehicleType = VehicleType.tempo
    capacity_kg: float = Field(default=1000.0, gt=0)
    capacity_cbm: float = Field(default=5.0, gt=0)
    cost_per_km: float = Field(default=12.0, ge=0)
    max_gradient_pct: float = Field(default=15.0, ge=0)
    suitable_terrains: str = "plains,hilly"
    temp_control: bool = False
    owner_type: VehicleOwnerType = VehicleOwnerType.individual
    current_location_name: str = "Guwahati Central Logistics Hub"
    current_location_lat: float = 26.1820
    current_location_lon: float = 91.7450
    availability_status: VehicleAvailability = VehicleAvailability.available
    current_assignment: Optional[str] = None
    client_id: Optional[UUID] = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    vehicle_code: Optional[str] = None
    name: Optional[str] = None
    type: Optional[VehicleType] = None
    capacity_kg: Optional[float] = Field(default=None, gt=0)
    capacity_cbm: Optional[float] = Field(default=None, gt=0)
    cost_per_km: Optional[float] = Field(default=None, ge=0)
    max_gradient_pct: Optional[float] = None
    suitable_terrains: Optional[str] = None
    temp_control: Optional[bool] = None
    owner_type: Optional[VehicleOwnerType] = None
    current_location_name: Optional[str] = None
    current_location_lat: Optional[float] = None
    current_location_lon: Optional[float] = None
    availability_status: Optional[VehicleAvailability] = None
    current_assignment: Optional[str] = None


class VehicleUpdateStatus(BaseModel):
    availability_status: VehicleAvailability
    current_location_name: Optional[str] = None
    current_location_lat: Optional[float] = None
    current_location_lon: Optional[float] = None
    current_assignment: Optional[str] = None


class VehicleRead(VehicleBase):
    id: UUID
    last_seen_at: datetime
    synced_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
