from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.route import Route, TransportMode, RouteHistory
from app.models.road_condition import RoadConditionReport


class RouteRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, route_id: UUID) -> Optional[Route]:
        stmt = select(Route).where(Route.id == route_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_routes(
        self,
        origin_hub_id: Optional[UUID] = None,
        dest_hub_id: Optional[UUID] = None,
        mode: Optional[TransportMode] = None,
    ) -> List[Route]:
        stmt = select(Route)
        if origin_hub_id:
            stmt = stmt.where(Route.origin_hub_id == origin_hub_id)
        if dest_hub_id:
            stmt = stmt.where(Route.dest_hub_id == dest_hub_id)
        if mode:
            stmt = stmt.where(Route.mode == mode)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> Route:
        route = Route(**kwargs)
        self.db.add(route)
        await self.db.commit()
        await self.db.refresh(route)
        return route

    async def get_route_history(self, route_id: UUID, limit: int = 50) -> List[RouteHistory]:
        stmt = select(RouteHistory).where(RouteHistory.route_id == route_id).order_by(RouteHistory.trip_date.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def count_route_history(self, route_id: UUID) -> int:
        stmt = select(func.count(RouteHistory.id)).where(RouteHistory.route_id == route_id)
        result = await self.db.execute(stmt)
        return result.scalar_one() or 0

    async def get_latest_condition(self, route_id: UUID) -> str:
        stmt = (
            select(RoadConditionReport.condition)
            .where(RoadConditionReport.route_id == route_id)
            .order_by(RoadConditionReport.reported_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        cond = result.scalar_one_or_none()
        if cond:
            return cond.value if hasattr(cond, "value") else str(cond)
        return "paved"

