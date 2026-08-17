from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.hub import Hub
from app.models.shipment import Shipment, ShipmentStatus, TempClass


class HubRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, hub_id: UUID) -> Optional[Hub]:
        stmt = select(Hub).where(Hub.id == hub_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self, is_active_only: bool = True) -> List[Hub]:
        stmt = select(Hub)
        if is_active_only:
            stmt = stmt.where(Hub.is_active.is_(True))
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> Hub:
        hub = Hub(**kwargs)
        self.db.add(hub)
        await self.db.commit()
        await self.db.refresh(hub)
        return hub

    async def get_capacity_info(self, hub_id: UUID) -> Optional[dict]:
        hub = await self.get_by_id(hub_id)
        if not hub:
            return None

        # Compute current cold storage weight at this hub for pending/in_transit frozen/chilled shipments
        stmt = select(func.coalesce(func.sum(Shipment.weight_kg), 0.0)).where(
            Shipment.origin_hub_id == hub_id,
            Shipment.temp_class.in_([TempClass.frozen, TempClass.chilled]),
            Shipment.status.in_([ShipmentStatus.pending, ShipmentStatus.in_transit]),
        )
        result = await self.db.execute(stmt)
        used_weight = float(result.scalar_one())
        total_capacity = hub.cold_storage_capacity_kg
        avail_capacity = max(0.0, total_capacity - used_weight)
        utilization_pct = (used_weight / total_capacity * 100.0) if total_capacity > 0 else 0.0

        return {
            "hub_id": hub.id,
            "hub_name": hub.name,
            "total_cold_storage_capacity_kg": total_capacity,
            "available_capacity_kg": avail_capacity,
            "utilization_percentage": round(utilization_pct, 2),
        }
