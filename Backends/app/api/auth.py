from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import create_access_token
from app.models.tenant import Tenant, TenantType
from app.schemas.tenant import TenantRead, TenantCreate

router = APIRouter(prefix="/auth", tags=["Auth & Tenants"])


class TokenRequest(BaseModel):
    tenant_id: UUID
    role: TenantType = TenantType.shipper


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tenant_id: UUID
    role: TenantType


@router.post("/register-tenant", response_model=TenantRead, status_code=status.HTTP_201_CREATED)
async def register_tenant(data: TenantCreate, db: AsyncSession = Depends(get_db)):
    tenant = Tenant(id=uuid4(), name=data.name, type=data.type)
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    return tenant


@router.post("/token", response_model=TokenResponse)
async def get_token(data: TokenRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(Tenant).where(Tenant.id == data.tenant_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()

    if not tenant:
        # Auto-create demo tenant if missing
        tenant = Tenant(id=data.tenant_id, name=f"Tenant-{data.tenant_id}", type=data.role)
        db.add(tenant)
        await db.commit()
        await db.refresh(tenant)

    token_data = {"tenant_id": str(tenant.id), "role": tenant.type.value}
    token_str = create_access_token(token_data)

    return TokenResponse(
        access_token=token_str,
        token_type="bearer",
        tenant_id=tenant.id,
        role=tenant.type,
    )
