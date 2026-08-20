from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.vehicle import VehicleType, VehicleOwnerType, VehicleAvailability


class VehicleBase(BaseModel):
    name: str
    type: VehicleType = VehicleType.tempo
    capacity_kg: float = Field(default=1000.0, gt=0)
    capacity_cbm: float = Field(default=5.0, gt=0)
    temp_control: bool = False
    owner_type: VehicleOwnerType = VehicleOwnerType.individual
    current_location_lat: float = 20.2961
    current_location_lon: float = 85.8245
    availability_status: VehicleAvailability = VehicleAvailability.available
    client_id: Optional[UUID] = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdateStatus(BaseModel):
    availability_status: VehicleAvailability
    current_location_lat: Optional[float] = None
    current_location_lon: Optional[float] = None


class VehicleRead(VehicleBase):
    id: UUID
    last_seen_at: datetime
    synced_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
