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
from app.repositories.roadsense_repository import RoadSenseRepository
from app.services.optimizer.fairness_calculator import FairnessCalculator
from app.services.optimizer.constraints import validate_vehicle_compatibility
from app.services.explain.constraint_tracer import ConstraintTracer
from app.services.roadsense.scorer import RoadSenseScorer

router = APIRouter(prefix="/dispatch", tags=["Dynamic Rural Dispatch & Fairness"])


class DispatchMatchRequest(BaseModel):
    corridor_origin_hub_id: Optional[UUID] = None
    corridor_dest_hub_id: Optional[UUID] = None
    force_window_extension_hrs: Optional[float] = None


class DispatchMatchItem(BaseModel):
    shipment_id: UUID
    waybill_number: str = "RUR-90001"
    good_type: str
    urgency: str
    producer_id: str
    producer_name: str
    community_id: str
    load_quantity: float = 1.0
    quantity_units: str = "units"
    weight_kg: float
    volume_cbm: float = 0.5
    matched_vehicle_id: UUID
    matched_vehicle_code: str = "AS-01-BP-1020"
    matched_vehicle_name: str
    matched_vehicle_type: str
    matched_vehicle_location: str = "NER Central Fleet Cluster"
    matched_vehicle_capacity_kg: float = 1500.0
    matched_vehicle_capacity_cbm: float = 6.5
    vehicle_assigned_weight_kg: float = 0.0
    vehicle_assigned_volume_cbm: float = 0.0
    load_utilization_pct: float = 0.0
    wait_time_minutes: float
    fairness_boost_pts: float
    allocation_score: float
    route_mode: str
    terrain_type: str = "plains"
    elevation_gain_m: float = 0.0
    gradient_pct: float = 1.0
    vehicle_cost_per_km: float = 12.0
    dynamic_window_extended: bool
    explanation_summary: str
    reasons: List[str]
    roadability_score: float = 85.0
    roadability_status: str = "clear"
    roadability_emoji: str = "🟢"
    road_breakdown: List[str] = []
    vehicle_recommendations: Dict[str, Dict[str, Any]] = {}


class DispatchMatchResponse(BaseModel):
    status: str = "success"
    matched_at: datetime
    matched_count: int
    unmatched_count: int
    avg_load_utilization_pct: float = 0.0
    total_dispatched_weight_kg: float = 0.0
    matches: List[DispatchMatchItem]
    fairness_summary: str


@router.post("/match", response_model=DispatchMatchResponse)
async def run_dynamic_matching(
    req: DispatchMatchRequest = DispatchMatchRequest(),
    ctx: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Dynamic Matching & Dispatch Engine:

    Matches pending rural pickups against available multi-vehicle fleet, optimizing for
    Load Capacity Utilization, Urgency, Terrain & Gradient Elevation, Fairness Boost, and Road Conditions.
    """
    now = datetime.now(timezone.utc)
    shipment_repo = ShipmentRepository(db, ctx.tenant_id)
    vehicle_repo = VehicleRepository(db)
    route_repo = RouteRepository(db)
    allocation_repo = AllocationRepository(db)
    roadsense_repo = RoadSenseRepository(db)
    tracer = ConstraintTracer()

    segments = await roadsense_repo.list_segments()

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
            "assigned_shipments": [],
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

        # Look up road condition, terrain, and gradient for route
        road_cond = "paved"
        terrain_type = "plains"
        gradient_pct = 1.0
        elevation_gain_m = 0.0
        route_mode_str = "local"

        if shipment.origin_hub_id and shipment.dest_hub_id:
            routes = await route_repo.list_routes(
                origin_hub_id=shipment.origin_hub_id,
                dest_hub_id=shipment.dest_hub_id,
            )
            if routes:
                r0 = routes[0]
                road_cond = await route_repo.get_latest_condition(r0.id)
                terrain_type = getattr(r0, "terrain_type", "plains")
                gradient_pct = getattr(r0, "avg_gradient_pct", 1.0)
                elevation_gain_m = getattr(r0, "elevation_gain_m", 0.0)
                route_mode_str = r0.mode.value if hasattr(r0.mode, "value") else str(r0.mode)

        # Find best compatible vehicle with capacity, terrain gradeability, and thermal compatibility
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
                terrain_type=terrain_type,
                gradient_pct=gradient_pct,
            )

            if compat["valid"]:
                # Scoring candidate: prefer existing batch with same temp class (consolidation efficiency)
                # followed by smallest sufficient capacity for high load utilization
                score = 100.0
                if v_state["temp_class"] == shipment.temp_class and v_state["assigned_count"] > 0:
                    score += 50.0  # Co-loading bonus for consolidating same thermal class
                remaining_kg = v.capacity_kg - (v_state["assigned_weight_kg"] + shipment.weight_kg)
                score += max(0.0, 10.0 - (remaining_kg / 500.0))

                # Preference for hill-suitable vehicles in hilly terrain
                if terrain_type in ["hilly", "mountainous"] and v_type in [
                    "pickup_4x4",
                    "bolero_pickup",
                    "mini_truck",
                    "tata_ace",
                    "cargo_bike",
                ]:
                    score += 25.0

                if score > best_compat_score:
                    best_compat_score = score
                    best_v = v

        if best_v:
            v_state = vehicle_load_map[best_v.id]
            v_state["assigned_weight_kg"] += shipment.weight_kg
            v_state["assigned_volume_cbm"] += shipment.volume_cbm
            v_state["temp_class"] = shipment.temp_class
            v_state["assigned_count"] += 1
            v_state["assigned_shipments"].append(shipment.id)

            v_type = best_v.type.value if hasattr(best_v.type, "value") else str(best_v.type)
            gt = shipment.good_type.value if hasattr(shipment.good_type, "value") else str(shipment.good_type)
            urg = shipment.urgency.value if hasattr(shipment.urgency, "value") else str(shipment.urgency)
            waybill = getattr(shipment, "waybill_number", f"RUR-{str(shipment.id)[:5].upper()}")
            load_qty = getattr(shipment, "load_quantity", 1.0)
            qty_units = getattr(shipment, "quantity_units", "units")
            cost_km = getattr(best_v, "cost_per_km", 12.0)

            load_util_pct = round((v_state["assigned_weight_kg"] / max(1.0, best_v.capacity_kg)) * 100.0, 1)

            exps = tracer.trace_binding_constraints(
                plan_id=str(shipment.id),
                shipment_count=v_state["assigned_count"],
                temp_class=shipment.temp_class.value if hasattr(shipment.temp_class, "value") else str(shipment.temp_class),
                total_weight=shipment.weight_kg,
                mode=route_mode_str,
                dynamic_window_extended=dynamic_window_extended,
                window_extension_hrs=window_ext,
                community_id=shipment.community_id,
                producer_wait_time_minutes=wait_mins,
                fairness_boost_pts=f_boost,
                good_type=gt,
                vehicle_type=v_type,
            )
            terrain_exp = f"Terrain: {terrain_type.capitalize()} (incline: {gradient_pct:.1f}%, elev gain: {elevation_gain_m:.0f}m). Vehicle load utilization: {load_util_pct}%."
            summary_text = f"{exps[1]['human_readable_text'] if len(exps) > 1 else exps[0]['human_readable_text']} | {terrain_exp}"

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

            # RoadSense Evaluation for Corridor / Segment
            matched_seg = None
            comm_lower = (shipment.community_id or "").lower()
            prod_lower = (shipment.producer_name or "").lower()

            for s in segments:
                s_name = s.name.lower()
                if "jorhat" in comm_lower or "jorhat" in prod_lower or "tea" in prod_lower:
                    if "jorhat" in s_name or "nh-27" in s_name or "nagaon" in s_name:
                        matched_seg = s
                        break
                elif "tawang" in comm_lower or "tawang" in prod_lower or "arunachal" in prod_lower:
                    if "tawang" in s_name or "nh-13" in s_name or "trans-arunachal" in s_name:
                        matched_seg = s
                        break
                elif "majuli" in comm_lower or "majuli" in prod_lower or "island" in prod_lower:
                    if "majuli" in s_name or "ferry" in s_name or "brahmaputra" in s_name:
                        matched_seg = s
                        break
                elif "imphal" in comm_lower or "imphal" in prod_lower or "silchar" in prod_lower:
                    if "imphal" in s_name or "silchar" in s_name or "nh-37" in s_name:
                        matched_seg = s
                        break
                elif "shillong" in comm_lower or "shillong" in prod_lower or "meghalaya" in prod_lower:
                    if "shillong" in s_name or "gs road" in s_name:
                        matched_seg = s
                        break
                elif "dimapur" in comm_lower or "kohima" in comm_lower:
                    if "nh-29" in s_name or "dimapur" in s_name or "kohima" in s_name:
                        matched_seg = s
                        break

            if not matched_seg and segments:
                matched_seg = segments[0]

            road_score = 80.0
            road_status_val = "clear"
            road_emoji = "🟢"
            road_breakdown_list = ["Standard paved road segment."]
            vehicle_recommendations = {}

            if matched_seg:
                rs_eval = RoadSenseScorer.calculate_roadability(matched_seg, vehicle_type=v_type, current_time=now)
                road_score = rs_eval.score
                road_status_val = rs_eval.status.value
                road_emoji = rs_eval.status_emoji
                road_breakdown_list = rs_eval.breakdown

                for vt in ["truck", "mini_truck", "tractor", "two_wheeler"]:
                    v_res = RoadSenseScorer.calculate_roadability(matched_seg, vehicle_type=vt, current_time=now)
                    vehicle_recommendations[vt] = {
                        "score": v_res.score,
                        "status_emoji": v_res.status_emoji,
                        "recommended": v_res.recommended,
                        "status": v_res.status.value,
                        "breakdown": v_res.breakdown,
                    }
            else:
                for vt in ["truck", "mini_truck", "tractor", "two_wheeler"]:
                    vehicle_recommendations[vt] = {
                        "score": 80.0,
                        "status_emoji": "🟢",
                        "recommended": True,
                        "status": "clear",
                        "breakdown": ["Default baseline road segment."],
                    }

            road_exp = f"RoadSense: {matched_seg.name if matched_seg else 'Corridor'} (Score: {road_score:.0f}/100 {road_emoji})."

            v_code = getattr(best_v, "vehicle_code", f"AS-01-TC-{str(best_v.id)[:4].upper()}")
            v_loc = getattr(best_v, "current_location_name", "NER Central Fleet Cluster")

            matched_items.append(
                DispatchMatchItem(
                    shipment_id=shipment.id,
                    waybill_number=waybill,
                    good_type=gt,
                    urgency=urg,
                    producer_id=shipment.producer_id,
                    producer_name=shipment.producer_name,
                    community_id=shipment.community_id,
                    load_quantity=load_qty,
                    quantity_units=qty_units,
                    weight_kg=shipment.weight_kg,
                    volume_cbm=shipment.volume_cbm,
                    matched_vehicle_id=best_v.id,
                    matched_vehicle_code=v_code,
                    matched_vehicle_name=best_v.name,
                    matched_vehicle_type=v_type,
                    matched_vehicle_location=v_loc,
                    matched_vehicle_capacity_kg=best_v.capacity_kg,
                    matched_vehicle_capacity_cbm=best_v.capacity_cbm,
                    vehicle_assigned_weight_kg=round(v_state["assigned_weight_kg"], 1),
                    vehicle_assigned_volume_cbm=round(v_state["assigned_volume_cbm"], 2),
                    load_utilization_pct=load_util_pct,
                    wait_time_minutes=round(wait_mins, 1),
                    fairness_boost_pts=round(f_boost, 1),
                    allocation_score=score,
                    route_mode=route_mode_str,
                    terrain_type=terrain_type,
                    elevation_gain_m=elevation_gain_m,
                    gradient_pct=gradient_pct,
                    vehicle_cost_per_km=cost_km,
                    dynamic_window_extended=dynamic_window_extended,
                    explanation_summary=summary_text,
                    reasons=[e["human_readable_text"] for e in exps] + [terrain_exp, road_exp],
                    roadability_score=road_score,
                    roadability_status=road_status_val,
                    roadability_emoji=road_emoji,
                    road_breakdown=road_breakdown_list,
                    vehicle_recommendations=vehicle_recommendations,
                )
            )

    # Update active vehicles' current_assignment in registry
    for v_id, v_state in vehicle_load_map.items():
        if v_state["assigned_count"] > 0:
            assigned_summary = f"Assigned {v_state['assigned_count']} pickups ({v_state['assigned_weight_kg']:.0f} kg / {v_state['vehicle'].capacity_kg:.0f} kg)"
            await vehicle_repo.update_status(
                vehicle_id=v_id,
                status=VehicleAvailability.available,
                current_assignment=assigned_summary,
            )

    unmatched_count = len(sorted_shipments) - len(matched_items)
    tot_weight = sum(m.weight_kg for m in matched_items)
    avg_util = round(sum(m.load_utilization_pct for m in matched_items) / max(1, len(matched_items)), 1) if matched_items else 0.0

    fairness_msg = (
        f"Dynamic matching evaluated {len(sorted_shipments)} community pickups ({len(matched_items)} allocated, {unmatched_count} pending). "
        f"Average fleet payload utilization: {avg_util}%. "
        f"Regional fairness index: {fairness_summary_data.get('overall_fairness_index', 0.95):.2f}. "
        f"Terrain gradients and vehicle gradeability verified for all routes."
    )

    return DispatchMatchResponse(
        status="success",
        matched_at=now,
        matched_count=len(matched_items),
        unmatched_count=unmatched_count,
        avg_load_utilization_pct=avg_util,
        total_dispatched_weight_kg=round(tot_weight, 1),
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
