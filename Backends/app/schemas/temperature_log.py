from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class TemperatureLogBase(BaseModel):
    shipment_id: UUID
    vehicle_id: str
    timestamp: datetime
    temp_celsius: float
    humidity: Optional[float] = None
    client_id: Optional[UUID] = None


class TemperatureLogCreate(TemperatureLogBase):
    pass


class TemperatureLogBatchItem(BaseModel):
    shipment_id: UUID
    vehicle_id: str
    temp_celsius: float
    humidity: Optional[float] = None
    timestamp: Optional[datetime] = None
    recorded_at: Optional[datetime] = None
    client_id: Optional[UUID] = None


class TemperatureLogBatchCreate(BaseModel):
    logs: List[TemperatureLogBatchItem]


class TemperatureLogRead(TemperatureLogBase):
    id: UUID
    synced_at: datetime

    model_config = ConfigDict(from_attributes=True)
