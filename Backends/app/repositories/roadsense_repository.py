import uuid
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from app.models.roadsense import (
    RoadSegment,
    RoadReport,
    VehicleProfile,
    RoadSegmentStatus,
    VehicleProfileType,
)


class RoadSenseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_segments(self, block_name: Optional[str] = None) -> List[RoadSegment]:
        stmt = (
            select(RoadSegment)
            .options(selectinload(RoadSegment.reports))
            .order_by(RoadSegment.name)
        )
        if block_name:
            stmt = stmt.where(RoadSegment.block_name == block_name)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_segment(self, segment_id: uuid.UUID) -> Optional[RoadSegment]:
        stmt = (
            select(RoadSegment)
            .where(RoadSegment.id == segment_id)
            .options(selectinload(RoadSegment.reports))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_segment_by_osm_id(self, osm_way_id: str) -> Optional[RoadSegment]:
        stmt = (
            select(RoadSegment)
            .where(RoadSegment.osm_way_id == osm_way_id)
            .options(selectinload(RoadSegment.reports))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_segment(self, **kwargs) -> RoadSegment:
        segment = RoadSegment(**kwargs)
        self.db.add(segment)
        await self.db.commit()
        await self.db.refresh(segment)
        return segment

    async def create_report(
        self,
        segment_id: uuid.UUID,
        status: RoadSegmentStatus,
        reporter_id: str = "driver-field",
        note: Optional[str] = None,
        client_id: Optional[uuid.UUID] = None,
        reported_at: Optional[datetime] = None,
    ) -> RoadReport:
        now = datetime.now(timezone.utc)
        rep_time = reported_at or now

        # Create the report record
        report = RoadReport(
            id=uuid.uuid4(),
            segment_id=segment_id,
            reporter_id=reporter_id,
            status=status,
            note=note,
            client_id=client_id,
            reported_at=rep_time,
            synced_at=now,
        )
        self.db.add(report)

        # Update segment's current_status, last_report_at, and reports list
        segment = await self.get_segment(segment_id)
        if segment:
            segment.current_status = status
            segment.last_report_at = rep_time
            segment.updated_at = now
            if report not in segment.reports:
                segment.reports.insert(0, report)

        await self.db.commit()
        await self.db.refresh(report)
        return report

    async def list_reports_for_segment(self, segment_id: uuid.UUID, limit: int = 20) -> List[RoadReport]:
        stmt = (
            select(RoadReport)
            .where(RoadReport.segment_id == segment_id)
            .order_by(RoadReport.reported_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_vehicle_profiles(self) -> List[VehicleProfile]:
        stmt = select(VehicleProfile).order_by(VehicleProfile.type)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_vehicle_profile(self, profile_type: VehicleProfileType) -> Optional[VehicleProfile]:
        stmt = select(VehicleProfile).where(VehicleProfile.type == profile_type)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_vehicle_profile(self, **kwargs) -> VehicleProfile:
        profile = VehicleProfile(**kwargs)
        self.db.add(profile)
        await self.db.commit()
        await self.db.refresh(profile)
        return profile
