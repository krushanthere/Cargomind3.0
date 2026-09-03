from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.shipment import TempClass, ShipmentStatus, GoodType, UrgencyLevel


class ShipmentBase(BaseModel):
    origin_hub_id: UUID
    dest_hub_id: UUID
    good_type: GoodType = GoodType.farm_produce
    urgency: UrgencyLevel = UrgencyLevel.routine
    producer_id: str = "prod-community-01"
    producer_name: str = "Community Farmer / Primary Health Centre"
    community_id: str = "comm-cluster-01"
    waybill_number: Optional[str] = "RUR-90001"
    load_quantity: float = Field(default=1.0, gt=0)
    quantity_units: str = "units"
    weight_kg: float = Field(..., gt=0)
    volume_cbm: float = Field(..., gt=0)
    temp_class: TempClass
    sla_deadline: datetime
    max_cost: Optional[float] = Field(None, ge=0)
    client_id: Optional[UUID] = None


class ShipmentCreate(ShipmentBase):
    pass


class ShipmentRead(BaseModel):
    id: UUID
    tenant_id: UUID
    origin_hub_id: UUID
    dest_hub_id: UUID
    good_type: GoodType
    urgency: UrgencyLevel
    producer_id: str
    producer_name: str
    community_id: str
    waybill_number: str = "RUR-90001"
    load_quantity: float = 1.0
    quantity_units: str = "units"
    weight_kg: float
    volume_cbm: float
    temp_class: TempClass
    sla_deadline: datetime
    max_cost: Optional[float] = None
    status: ShipmentStatus
    client_id: Optional[UUID] = None
    synced_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CarrierShipmentRead(BaseModel):
    id: UUID
    origin_hub_id: UUID
    dest_hub_id: UUID
    good_type: GoodType
    urgency: UrgencyLevel
    producer_id: str
    producer_name: str
    community_id: str
    waybill_number: str = "RUR-90001"
    load_quantity: float = 1.0
    quantity_units: str = "units"
    weight_kg: float
    volume_cbm: float
    temp_class: TempClass
    sla_deadline: datetime
    status: ShipmentStatus
    client_id: Optional[UUID] = None
    synced_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

