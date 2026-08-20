from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.shipment import Shipment, ShipmentStatus
from app.repositories.base import BaseTenantRepository


class ShipmentRepository(BaseTenantRepository[Shipment]):
    def __init__(self, db: AsyncSession, tenant_id: UUID):
        super().__init__(Shipment, db, tenant_id)

    async def get_pending_shipments(
        self,
        origin_hub_id: Optional[UUID] = None,
        dest_hub_id: Optional[UUID] = None,
    ) -> List[Shipment]:
        stmt = select(Shipment).where(
            Shipment.tenant_id == self.tenant_id,
            Shipment.status == ShipmentStatus.pending,
        )
        if origin_hub_id:
            stmt = stmt.where(Shipment.origin_hub_id == origin_hub_id)
        if dest_hub_id:
            stmt = stmt.where(Shipment.dest_hub_id == dest_hub_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_client_id(self, client_id: UUID) -> Optional[Shipment]:
        stmt = select(Shipment).where(
            Shipment.tenant_id == self.tenant_id,
            Shipment.client_id == client_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_status(self, shipment_id: UUID, status: ShipmentStatus) -> Optional[Shipment]:
        shipment = await self.get_by_id(shipment_id)
        if shipment:
            shipment.status = status
            await self.db.commit()
            await self.db.refresh(shipment)
        return shipment

