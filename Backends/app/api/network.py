from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.route import TransportMode
from app.schemas.network import (
    HubRead,
    HubCapacityRead,
    RouteRead,
    RouteScoreRead,
    NetworkGraphRead,
)
from app.repositories.hub_repository import HubRepository
from app.repositories.route_repository import RouteRepository
from app.services.network.route_scorer import RouteScorer

router = APIRouter(tags=["Network & Routes"])


@router.get("/network/graph", response_model=NetworkGraphRead)
@router.get("/graph", response_model=NetworkGraphRead)
async def get_network_graph(db: AsyncSession = Depends(get_db)):
    hub_repo = HubRepository(db)
    route_repo = RouteRepository(db)
    hubs = await hub_repo.list_all()
    routes = await route_repo.list_routes()
    return NetworkGraphRead(hubs=hubs, routes=routes)


@router.get("/hubs", response_model=List[HubRead])
@router.get("/network/hubs", response_model=List[HubRead])
async def list_hubs(db: AsyncSession = Depends(get_db)):
    repo = HubRepository(db)
    return await repo.list_all()


@router.get("/hubs/{hub_id}/capacity", response_model=HubCapacityRead)
@router.get("/network/hubs/{hub_id}/capacity", response_model=HubCapacityRead)
async def get_hub_capacity(hub_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = HubRepository(db)
    capacity_info = await repo.get_capacity_info(hub_id)
    if not capacity_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hub not found",
        )
    return capacity_info


@router.get("/routes", response_model=List[RouteRead])
@router.get("/network/routes", response_model=List[RouteRead])
async def list_routes(
    origin: Optional[UUID] = Query(None),
    dest: Optional[UUID] = Query(None),
    mode: Optional[TransportMode] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    repo = RouteRepository(db)
    return await repo.list_routes(origin_hub_id=origin, dest_hub_id=dest, mode=mode)


@router.get("/routes/candidate-scores", response_model=List[RouteScoreRead])
async def get_candidate_route_scores(
    origin_hub_id: UUID = Query(...),
    dest_hub_id: UUID = Query(...),
    vehicle_type: Optional[str] = Query(None, description="Vehicle profile type for terrain gradient filtering"),
    season: Optional[str] = Query("monsoon", description="Season: monsoon or dry"),
    urgency: Optional[str] = Query("routine", description="Consignment urgency level"),
    db: AsyncSession = Depends(get_db),
):
    scorer = RouteScorer(db)
    scores = await scorer.score_candidate_routes(
        origin_hub_id,
        dest_hub_id,
        vehicle_type=vehicle_type,
        season=season,
        urgency=urgency,
    )

    results = []
    for s in scores:
        if s.get("route_id"):
            results.append(
                RouteScoreRead(
                    route_id=UUID(s["route_id"]),
                    origin_hub_id=origin_hub_id,
                    dest_hub_id=dest_hub_id,
                    mode=TransportMode(s["mode"]) if s["mode"] in ["road", "rail"] else TransportMode.road,
                    avg_transit_hrs=s["total_transit_hrs"],
                    base_cost_per_kg=s["total_cost_per_kg"],
                    reliability_score=s["reliability_score"],
                    composite_score=s["composite_score"],
                )
            )
    return results
