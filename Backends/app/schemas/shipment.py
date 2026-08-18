from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.shipment import TempClass, ShipmentStatus


class ShipmentBase(BaseModel):
    origin_hub_id: UUID
    dest_hub_id: UUID
    weight_kg: float = Field(..., gt=0)
    volume_cbm: float = Field(..., gt=0)
    temp_class: TempClass
    sla_deadline: datetime
    max_cost: Optional[float] = Field(None, ge=0)


class ShipmentCreate(ShipmentBase):
    pass


class ShipmentRead(BaseModel):
    id: UUID
    tenant_id: UUID
    origin_hub_id: UUID
    dest_hub_id: UUID
    weight_kg: float
    volume_cbm: float
    temp_class: TempClass
    sla_deadline: datetime
    max_cost: Optional[float] = None
    status: ShipmentStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CarrierShipmentRead(BaseModel):
    id: UUID
    origin_hub_id: UUID
    dest_hub_id: UUID
    weight_kg: float
    volume_cbm: float
    temp_class: TempClass
    sla_deadline: datetime
    status: ShipmentStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
