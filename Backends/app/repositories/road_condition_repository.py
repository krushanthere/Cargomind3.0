from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.road_condition import RoadConditionReport, RoadConditionType


class RoadConditionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_latest_for_route(self, route_id: UUID) -> Optional[RoadConditionReport]:
        stmt = (
            select(RoadConditionReport)
            .where(RoadConditionReport.route_id == route_id)
            .order_by(RoadConditionReport.reported_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_reports(self, limit: int = 50) -> List[RoadConditionReport]:
        stmt = select(RoadConditionReport).order_by(RoadConditionReport.reported_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> RoadConditionReport:
        report = RoadConditionReport(**kwargs)
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)
        return report
