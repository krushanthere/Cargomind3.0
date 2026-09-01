from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_tenant, TenantContext
from app.models.shipment import Shipment, ShipmentStatus, UrgencyLevel, GoodType
from app.models.vehicle import Vehicle, VehicleAvailability
from app.schemas.allocation_history import (
    AllocationHistoryRead,
    FairnessMetricsResponse,
)
from app.repositories.shipment_repository import ShipmentRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.repositories.route_repository import RouteRepository
from app.repositories.allocation_repository import AllocationRepository
from app.services.optimizer.fairness_calculator import FairnessCalculator
from app.services.optimizer.constraints import validate_vehicle_compatibility
from app.services.explain.constraint_tracer import ConstraintTracer

router = APIRouter(prefix="/dispatch", tags=["Dynamic Rural Dispatch & Fairness"])


class DispatchMatchRequest(BaseModel):
    corridor_origin_hub_id: Optional[UUID] = None
    corridor_dest_hub_id: Optional[UUID] = None
    force_window_extension_hrs: Optional[float] = None


class DispatchMatchItem(BaseModel):
    shipment_id: UUID
    good_type: str
    urgency: str
    producer_id: str
    producer_name: str
    community_id: str
    weight_kg: float
    matched_vehicle_id: UUID
    matched_vehicle_name: str
    matched_vehicle_type: str
    wait_time_minutes: float
    fairness_boost_pts: float
    allocation_score: float
    route_mode: str
    dynamic_window_extended: bool
    explanation_summary: str
    reasons: List[str]


class DispatchMatchResponse(BaseModel):
    status: str = "success"
    matched_at: datetime
    matched_count: int
    unmatched_count: int
    matches: List[DispatchMatchItem]
    fairness_summary: str


@router.post("/match", response_model=DispatchMatchResponse)
async def run_dynamic_matching(
    req: DispatchMatchRequest = DispatchMatchRequest(),
    ctx: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Dynamic Matching & Dispatch Engine:

    Matches pending rural pickups against available fleet, optimizing for
    Urgency, Spoilage Kinetics, Fairness Boost (Wait time), Road Conditions, and Payload Capacity.
    """
    now = datetime.now(timezone.utc)
    shipment_repo = ShipmentRepository(db, ctx.tenant_id)
    vehicle_repo = VehicleRepository(db)
    route_repo = RouteRepository(db)
    allocation_repo = AllocationRepository(db)
    tracer = ConstraintTracer()

    # 1. Fetch pending shipments & available vehicles
    pending_shipments = await shipment_repo.get_pending_shipments(
        origin_hub_id=req.corridor_origin_hub_id,
        dest_hub_id=req.corridor_dest_hub_id,
    )
    available_vehicles = await vehicle_repo.get_available_vehicles()

    if not available_vehicles:
        # Fallback to list any vehicles if available list is empty
        available_vehicles = await vehicle_repo.list_vehicles()

    # 2. Get community fairness stats
    fairness_summary_data = await allocation_repo.get_all_communities_fairness_summary()
    reg_avg_wait = fairness_summary_data.get("regional_avg_wait_minutes", 60.0)
    comm_stats_map = {
        c["community_id"]: {
            "total_matches": c["total_allocations"],
            "avg_wait_minutes": c["average_wait_time_minutes"],
        }
        for c in fairness_summary_data.get("community_breakdown", [])
    }
    fairness_calc = FairnessCalculator(comm_stats_map, regional_avg_wait=reg_avg_wait)

    # 3. Dynamic window check
    is_low_density = len(pending_shipments) < 3
    window_ext = req.force_window_extension_hrs or (4.0 if is_low_density else 0.0)
    dynamic_window_extended = window_ext > 0

    # 4. Sort shipments by Net Priority: Urgency + Fairness Boost + Wait Time
    def priority_key(s: Shipment):
        urg_pts = 500 if s.urgency == UrgencyLevel.critical else 300 if s.urgency == UrgencyLevel.high else 100
        if s.good_type == GoodType.medicine:
            urg_pts += 200
        f_boost = fairness_calc.calculate_fairness_boost(s)
        # Approximate wait time from created_at
        created = s.created_at or now
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        wait_mins = max(10.0, (now - created).total_seconds() / 60.0)
        return urg_pts + f_boost + (wait_mins * 0.5)

    sorted_shipments = sorted(pending_shipments, key=priority_key, reverse=True)

    # 5. Initialize active vehicle load tracking for multi-pickup bin packing
    vehicle_load_map: Dict[UUID, Dict[str, Any]] = {
        v.id: {
            "vehicle": v,
            "assigned_weight_kg": 0.0,
            "assigned_volume_cbm": 0.0,
            "temp_class": None,
            "assigned_count": 0,
        }
        for v in available_vehicles
    }

    matched_items = []

    for shipment in sorted_shipments:
        if not available_vehicles:
            break

        f_boost = fairness_calc.calculate_fairness_boost(shipment)
        created = shipment.created_at or now
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        wait_mins = max(15.0, (now - created).total_seconds() / 60.0)

        # Look up road condition for route if available
        road_cond = "paved"
        if shipment.origin_hub_id and shipment.dest_hub_id:
            routes = await route_repo.list_routes(
                origin_hub_id=shipment.origin_hub_id,
                dest_hub_id=shipment.dest_hub_id,
            )
            if routes:
                road_cond = await route_repo.get_latest_condition(routes[0].id)

        # Find best compatible vehicle with capacity and thermal compatibility
        best_v = None
        best_compat_score = -1.0

        for v in available_vehicles:
            v_state = vehicle_load_map[v.id]
            v_type = v.type.value if hasattr(v.type, "value") else str(v.type)

            compat = validate_vehicle_compatibility(
                shipment=shipment,
                vehicle_capacity_kg=v.capacity_kg,
                vehicle_capacity_cbm=v.capacity_cbm,
                vehicle_temp_control=v.temp_control,
                road_condition=road_cond,
                vehicle_type=v_type,
                current_assigned_weight_kg=v_state["assigned_weight_kg"],
                current_assigned_volume_cbm=v_state["assigned_volume_cbm"],
                current_temp_class=v_state["temp_class"],
            )

            if compat["valid"]:
                # Scoring candidate: prefer existing batch with same temp class (consolidation efficiency)
                # followed by smallest sufficient capacity
                score = 100.0
                if v_state["temp_class"] == shipment.temp_class and v_state["assigned_count"] > 0:
                    score += 50.0  # Co-loading bonus for consolidating same thermal class
                remaining_kg = v.capacity_kg - (v_state["assigned_weight_kg"] + shipment.weight_kg)
                score += max(0.0, 10.0 - (remaining_kg / 500.0))

                if score > best_compat_score:
                    best_compat_score = score
                    best_v = v

        if best_v:
            v_state = vehicle_load_map[best_v.id]
            v_state["assigned_weight_kg"] += shipment.weight_kg
            v_state["assigned_volume_cbm"] += shipment.volume_cbm
            v_state["temp_class"] = shipment.temp_class
            v_state["assigned_count"] += 1

            v_type = best_v.type.value if hasattr(best_v.type, "value") else str(best_v.type)
            gt = shipment.good_type.value if hasattr(shipment.good_type, "value") else str(shipment.good_type)
            urg = shipment.urgency.value if hasattr(shipment.urgency, "value") else str(shipment.urgency)

            exps = tracer.trace_binding_constraints(
                plan_id=str(shipment.id),
                shipment_count=v_state["assigned_count"],
                temp_class=shipment.temp_class.value if hasattr(shipment.temp_class, "value") else str(shipment.temp_class),
                total_weight=shipment.weight_kg,
                mode="local",
                dynamic_window_extended=dynamic_window_extended,
                window_extension_hrs=window_ext,
                community_id=shipment.community_id,
                producer_wait_time_minutes=wait_mins,
                fairness_boost_pts=f_boost,
                good_type=gt,
                vehicle_type=v_type,
            )
            summary_text = exps[1]["human_readable_text"] if len(exps) > 1 else exps[0]["human_readable_text"]

            # Log to allocation_history for verifiable proof
            score = round(priority_key(shipment), 2)
            await allocation_repo.create(
                producer_id=shipment.producer_id,
                producer_name=shipment.producer_name,
                community_id=shipment.community_id,
                shipment_id=shipment.id,
                vehicle_id=best_v.id,
                matched_at=now,
                wait_time_minutes=round(wait_mins, 1),
                allocation_score=score,
                urgency=urg,
                good_type=gt,
                explanation_summary=summary_text,
            )

            # Update shipment status
            await shipment_repo.update_status(shipment.id, ShipmentStatus.grouped)

            matched_items.append(
                DispatchMatchItem(
                    shipment_id=shipment.id,
                    good_type=gt,
                    urgency=urg,
                    producer_id=shipment.producer_id,
                    producer_name=shipment.producer_name,
                    community_id=shipment.community_id,
                    weight_kg=shipment.weight_kg,
                    matched_vehicle_id=best_v.id,
                    matched_vehicle_name=best_v.name,
                    matched_vehicle_type=v_type,
                    wait_time_minutes=round(wait_mins, 1),
                    fairness_boost_pts=round(f_boost, 1),
                    allocation_score=score,
                    route_mode="local",
                    dynamic_window_extended=dynamic_window_extended,
                    explanation_summary=summary_text,
                    reasons=[e["human_readable_text"] for e in exps],
                )
            )

    unmatched_count = len(sorted_shipments) - len(matched_items)
    fairness_msg = (
        f"Dynamic matching evaluated {len(sorted_shipments)} community pickups ({len(matched_items)} allocated, {unmatched_count} pending). "
        f"Regional fairness index: {fairness_summary_data.get('overall_fairness_index', 0.95):.2f}. "
        f"Producers with extended wait times received automated priority boosts."
    )

    return DispatchMatchResponse(
        status="success",
        matched_at=now,
        matched_count=len(matched_items),
        unmatched_count=unmatched_count,
        matches=matched_items,
        fairness_summary=fairness_msg,
    )


@router.get("/fairness-metrics", response_model=FairnessMetricsResponse)
async def get_fairness_metrics(
    db: AsyncSession = Depends(get_db),
):
    """Fairness Dashboard Endpoint:

    Returns aggregate wait-time distribution across communities, total matches,
    and demonstrable proof of non-deprioritization.
    """
    repo = AllocationRepository(db)
    summary = await repo.get_all_communities_fairness_summary()
    recent = await repo.list_recent(limit=20)

    return FairnessMetricsResponse(
        overall_fairness_index=summary["overall_fairness_index"],
        regional_avg_wait_minutes=summary["regional_avg_wait_minutes"],
        total_dispatches_7d=summary["total_dispatches_7d"],
        community_breakdown=summary["community_breakdown"],
        recent_allocations=recent,
    )


@router.get("/history", response_model=List[AllocationHistoryRead])
async def list_allocation_history(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    repo = AllocationRepository(db)
    return await repo.list_recent(limit=limit)
