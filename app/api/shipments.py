from typing import List, Optional, Union
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_tenant, TenantContext
from app.models.tenant import TenantType
from app.models.shipment import ShipmentStatus
from app.schemas.shipment import ShipmentCreate, ShipmentRead, CarrierShipmentRead
from app.repositories.shipment_repository import ShipmentRepository

router = APIRouter(prefix="/shipments", tags=["Shipments"])


@router.post("", response_model=ShipmentRead, status_code=status.HTTP_201_CREATED)
async def create_shipment(
    data: ShipmentCreate,
    ctx: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    repo = ShipmentRepository(db, ctx.tenant_id)
    shipment = await repo.create(**data.model_dump())
    return shipment


@router.get("", response_model=List[Union[ShipmentRead, CarrierShipmentRead]])
async def list_shipments(
    status: Optional[ShipmentStatus] = Query(None),
    ctx: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    repo = ShipmentRepository(db, ctx.tenant_id)
    filters = {}
    if status:
        filters["status"] = status
    shipments = await repo.list_all(filters=filters)

    if ctx.role == TenantType.carrier:
        return [CarrierShipmentRead.model_validate(s) for s in shipments]
    return [ShipmentRead.model_validate(s) for s in shipments]


@router.get("/{shipment_id}", response_model=Union[ShipmentRead, CarrierShipmentRead])
async def get_shipment(
    shipment_id: UUID,
    ctx: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    repo = ShipmentRepository(db, ctx.tenant_id)
    shipment = await repo.get_by_id(shipment_id)
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found or access denied",
        )

    if ctx.role == TenantType.carrier:
        return CarrierShipmentRead.model_validate(shipment)
    return ShipmentRead.model_validate(shipment)
