from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.road_condition import RoadConditionCreate, RoadConditionRead
from app.repositories.road_condition_repository import RoadConditionRepository

router = APIRouter(prefix="/road-conditions", tags=["Road Conditions & Terrain"])


@router.get("", response_model=List[RoadConditionRead])
async def list_road_conditions(
    db: AsyncSession = Depends(get_db),
):
    repo = RoadConditionRepository(db)
    return await repo.list_reports()


@router.post("", response_model=RoadConditionRead, status_code=status.HTTP_201_CREATED)
async def report_road_condition(
    data: RoadConditionCreate,
    db: AsyncSession = Depends(get_db),
):
    repo = RoadConditionRepository(db)
    return await repo.create(**data.model_dump())


@router.get("/route/{route_id}", response_model=RoadConditionRead)
async def get_route_condition(
    route_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    repo = RoadConditionRepository(db)
    report = await repo.get_latest_for_route(route_id)
    if not report:
        # Return synthetic default paved report
        from datetime import datetime, timezone
        import uuid
        from app.models.road_condition import RoadConditionType
        return RoadConditionRead(
            id=uuid.uuid4(),
            route_id=route_id,
            condition=RoadConditionType.paved,
            reported_at=datetime.now(timezone.utc),
            synced_at=datetime.now(timezone.utc),
        )
    return report
