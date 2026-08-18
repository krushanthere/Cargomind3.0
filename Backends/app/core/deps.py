from uuid import UUID
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import decode_token
from app.models.tenant import Tenant, TenantType

security = HTTPBearer(auto_error=False)


class TenantContext:
    def __init__(self, tenant_id: UUID, role: TenantType, name: str = ""):
        self.tenant_id = tenant_id
        self.role = role
        self.name = name


async def get_current_tenant(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    x_tenant_role: Optional[str] = Header(None, alias="X-Tenant-Role"),
    db: AsyncSession = Depends(get_db),
) -> TenantContext:
    # First check JWT Bearer Token if present
    if credentials:
        payload = decode_token(credentials.credentials)
        tenant_id_str = payload.get("tenant_id")
        role_str = payload.get("role", "shipper")
        if not tenant_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing tenant_id claim",
            )
        try:
            tenant_uuid = UUID(tenant_id_str)
            role = TenantType(role_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid tenant_id or role in token",
            )
        return TenantContext(tenant_id=tenant_uuid, role=role)

    # Fallback to X-Tenant-ID header (for easy API testing / development)
    if x_tenant_id:
        try:
            tenant_uuid = UUID(x_tenant_id)
            role = TenantType(x_tenant_role) if x_tenant_role else TenantType.shipper
            return TenantContext(tenant_id=tenant_uuid, role=role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid X-Tenant-ID header format",
            )

    # Fetch default demo tenant if DB has tenants, else raise 401
    stmt = select(Tenant).limit(1)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()
    if tenant:
        return TenantContext(tenant_id=tenant.id, role=tenant.type, name=tenant.name)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication credentials required (Bearer token or X-Tenant-ID header)",
    )
