from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.vehicle import VehicleAvailability, VehicleType
from app.schemas.vehicle import VehicleCreate, VehicleRead, VehicleUpdate, VehicleUpdateStatus
from app.repositories.vehicle_repository import VehicleRepository

router = APIRouter(prefix="/vehicles", tags=["Rural Transport Fleet & Synthetic Registry"])


@router.get("", response_model=List[VehicleRead])
async def list_vehicles(
    status: Optional[VehicleAvailability] = Query(None),
    type: Optional[VehicleType] = Query(None),
    temp_control_only: bool = Query(False),
    location: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Query synthetic vehicle registry with optional filtering by status, type, location or thermal capability."""
    repo = VehicleRepository(db)
    return await repo.list_vehicles(status=status, type=type, temp_control_only=temp_control_only, location_name=location)


@router.post("", response_model=VehicleRead, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    data: VehicleCreate,
    db: AsyncSession = Depends(get_db),
):
    """Add a new synthetic vehicle to the dynamic fleet registry."""
    repo = VehicleRepository(db)
    return await repo.create(**data.model_dump())


@router.get("/{vehicle_id}", response_model=VehicleRead)
async def get_vehicle(
    vehicle_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get single vehicle details by vehicle ID."""
    repo = VehicleRepository(db)
    v = await repo.get_by_id(vehicle_id)
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return v


@router.patch("/{vehicle_id}", response_model=VehicleRead)
async def update_vehicle(
    vehicle_id: UUID,
    data: VehicleUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update general vehicle parameters (capacity, operating cost, location, assignment, etc.)."""
    repo = VehicleRepository(db)
    v = await repo.update(vehicle_id=vehicle_id, **data.model_dump(exclude_unset=True))
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return v


@router.patch("/{vehicle_id}/status", response_model=VehicleRead)
async def update_vehicle_status(
    vehicle_id: UUID,
    data: VehicleUpdateStatus,
    db: AsyncSession = Depends(get_db),
):
    """Update vehicle availability status (available, en_route, occupied, maintenance, offline) or assignment."""
    repo = VehicleRepository(db)
    v = await repo.update_status(
        vehicle_id=vehicle_id,
        status=data.availability_status,
        lat=data.current_location_lat,
        lon=data.current_location_lon,
        location_name=data.current_location_name,
        current_assignment=data.current_assignment,
    )
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return v


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Remove a vehicle from the synthetic registry to demonstrate dynamic capacity recalculation."""
    repo = VehicleRepository(db)
    deleted = await repo.delete(vehicle_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return None
