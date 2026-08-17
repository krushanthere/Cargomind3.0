from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.models.tenant import TenantType


class TenantBase(BaseModel):
    name: str
    type: TenantType = TenantType.shipper


class TenantCreate(TenantBase):
    pass


class TenantRead(TenantBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
