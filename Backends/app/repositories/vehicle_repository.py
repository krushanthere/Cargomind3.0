from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.vehicle import Vehicle, VehicleAvailability, VehicleType


class VehicleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, vehicle_id: UUID) -> Optional[Vehicle]:
        stmt = select(Vehicle).where(Vehicle.id == vehicle_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_vehicles(
        self,
        status: Optional[VehicleAvailability] = None,
        type: Optional[VehicleType] = None,
        temp_control_only: bool = False,
    ) -> List[Vehicle]:
        stmt = select(Vehicle)
        if status:
            stmt = stmt.where(Vehicle.availability_status == status)
        if type:
            stmt = stmt.where(Vehicle.type == type)
        if temp_control_only:
            stmt = stmt.where(Vehicle.temp_control == True)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_available_vehicles(self) -> List[Vehicle]:
        stmt = select(Vehicle).where(Vehicle.availability_status == VehicleAvailability.available)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> Vehicle:
        vehicle = Vehicle(**kwargs)
        self.db.add(vehicle)
        await self.db.commit()
        await self.db.refresh(vehicle)
        return vehicle

    async def update_status(
        self,
        vehicle_id: UUID,
        status: VehicleAvailability,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
    ) -> Optional[Vehicle]:
        stmt = select(Vehicle).where(Vehicle.id == vehicle_id)
        result = await self.db.execute(stmt)
        vehicle = result.scalar_one_or_none()
        if not vehicle:
            return None

        vehicle.availability_status = status
        vehicle.last_seen_at = datetime.now(timezone.utc)
        if lat is not None:
            vehicle.current_location_lat = lat
        if lon is not None:
            vehicle.current_location_lon = lon

        await self.db.commit()
        await self.db.refresh(vehicle)
        return vehicle
