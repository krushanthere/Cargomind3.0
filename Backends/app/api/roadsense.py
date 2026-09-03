from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.roadsense import (
    RoadSegmentRead,
    RoadSegmentWithReports,
    RoadSegmentCreate,
    RoadReportCreate,
    RoadReportRead,
    VehicleProfileRead,
    RoadabilityScoreResponse,
)
from app.models.roadsense import VehicleProfileType
from app.repositories.roadsense_repository import RoadSenseRepository
from app.services.roadsense.scorer import RoadSenseScorer

router = APIRouter(prefix="/roadsense", tags=["RoadSense: Real-Time Roadability Intelligence"])


@router.get("/segments", response_model=List[RoadSegmentRead])
async def list_road_segments(
    block_name: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all mapped rural road segments with current statuses and static base scores."""
    repo = RoadSenseRepository(db)
    return await repo.list_segments(block_name=block_name)


@router.get("/segments/{segment_id}", response_model=RoadSegmentWithReports)
async def get_road_segment(
    segment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve detailed road segment telemetry, geometry, width/surface attributes,
    static base score, and full chronological crowdsourced report history.
    """
    repo = RoadSenseRepository(db)
    segment = await repo.get_segment(segment_id)
    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Road segment with id '{segment_id}' not found",
        )
    return segment


@router.post("/segments", response_model=RoadSegmentRead, status_code=status.HTTP_201_CREATED)
async def create_road_segment(
    payload: RoadSegmentCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new OSM road segment in the network."""
    repo = RoadSenseRepository(db)
    return await repo.create_segment(**payload.model_dump())


@router.post("/reports", response_model=RoadReportRead, status_code=status.HTTP_201_CREATED)
async def submit_road_report(
    payload: RoadReportCreate,
    db: AsyncSession = Depends(get_db),
):
    """Submit a live crowdsourced driver / field agent road condition report
    (clear, difficult, blocked) with optional hazard notes.
    Dynamically updates the segment's live status and timestamp.
    """
    repo = RoadSenseRepository(db)
    segment = await repo.get_segment(payload.segment_id)
    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Road segment with id '{payload.segment_id}' not found",
        )

    return await repo.create_report(
        segment_id=payload.segment_id,
        status=payload.status,
        reporter_id=payload.reporter_id or "driver-field",
        note=payload.note,
        client_id=payload.client_id,
    )


@router.get("/vehicle-profiles", response_model=List[VehicleProfileRead])
async def list_vehicle_profiles(
    db: AsyncSession = Depends(get_db),
):
    """List standard vehicle profiles (Truck, Mini-Truck, Tractor, Two-Wheeler)
    with width tolerances and clearance thresholds.
    """
    repo = RoadSenseRepository(db)
    return await repo.list_vehicle_profiles()


@router.get("/score", response_model=RoadabilityScoreResponse)
async def compute_roadability_score(
    segment_id: UUID,
    vehicle_type: VehicleProfileType = VehicleProfileType.truck,
    db: AsyncSession = Depends(get_db),
):
    """Compute real-time Roadability Score (0-100) for a given road segment and vehicle type.
    Combines static road attributes with recency-decayed crowdsourced driver reports,
    performs vehicle profile feasibility filtering, and generates an explainable breakdown.
    """
    repo = RoadSenseRepository(db)
    segment = await repo.get_segment(segment_id)
    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Road segment with id '{segment_id}' not found",
        )

    return RoadSenseScorer.calculate_roadability(segment=segment, vehicle_type=vehicle_type)
