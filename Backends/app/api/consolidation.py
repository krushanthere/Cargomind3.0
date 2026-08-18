from typing import List
from uuid import UUID
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_tenant, TenantContext
from app.schemas.consolidation import (
    ConsolidationPlanRequest,
    ConsolidationPlanRead,
    ExplanationItem,
)
from app.repositories.shipment_repository import ShipmentRepository
from app.repositories.route_repository import RouteRepository
from app.repositories.plan_repository import PlanRepository
from app.services.optimizer.solver import ConsolidationSolver
from app.services.optimizer.plan_ranker import PlanRanker
from app.services.explain.shap_explainer import SHAPExplainerService
from app.services.explain.constraint_tracer import ConstraintTracer

router = APIRouter(prefix="/consolidation", tags=["Consolidation & Optimization"])


@router.post("/plan", response_model=List[ConsolidationPlanRead])
async def create_consolidation_plan(
    req: ConsolidationPlanRequest,
    ctx: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    shipment_repo = ShipmentRepository(db, ctx.tenant_id)
    route_repo = RouteRepository(db)
    plan_repo = PlanRepository(db, ctx.tenant_id)

    # 1. Fetch pending shipments
    if req.shipment_ids:
        shipments = []
        for sid in req.shipment_ids:
            s = await shipment_repo.get_by_id(sid)
            if s:
                shipments.append(s)
    else:
        shipments = await shipment_repo.get_pending_shipments(
            origin_hub_id=req.corridor_origin_hub_id,
            dest_hub_id=req.corridor_dest_hub_id,
        )

    if not shipments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending shipments available for consolidation plan creation",
        )

    # 2. Fetch candidate routes
    orig_id = req.corridor_origin_hub_id or shipments[0].origin_hub_id
    dest_id = req.corridor_dest_hub_id or shipments[0].dest_hub_id
    candidate_routes = await route_repo.list_routes(origin_hub_id=orig_id, dest_hub_id=dest_id)

    if not candidate_routes:
        # Fetch any routes matching origin or dest
        candidate_routes = await route_repo.list_routes(origin_hub_id=orig_id)
    if not candidate_routes:
        candidate_routes = await route_repo.list_routes()

    if not candidate_routes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No routes found in network connecting requested corridor",
        )

    dep_start = req.departure_window_start or datetime.now(timezone.utc)
    dep_times = [dep_start, dep_start + timedelta(hours=2), dep_start + timedelta(hours=6)]

    # 3. Run solver with different objective weightings to generate Pareto candidate set
    solver = ConsolidationSolver()
    solver_results = []

    # Run cost-heavy, risk-heavy, and balanced weightings
    weightings = [(0.8, 0.2), (0.2, 0.8), (0.5, 0.5)]
    for w_cost, w_risk in weightings:
        plans = solver.solve(
            shipments=shipments,
            candidate_routes=candidate_routes,
            candidate_departure_times=dep_times,
            w_cost=w_cost,
            w_risk=w_risk,
        )
        solver_results.extend(plans)

    # 4. Rank and select Pareto optimal plans
    ranker = PlanRanker()
    top_pareto_plans = ranker.rank_and_select_pareto_plans(solver_results, top_k=3)

    saved_plans = []
    shap_service = SHAPExplainerService()
    tracer = ConstraintTracer()

    # 5. Persist plans and explanations to DB
    for p_data in top_pareto_plans:
        plan_obj = await plan_repo.create(
            shipment_ids=[str(s) for s in p_data["shipment_ids"]],
            route_ids=[str(r) for r in p_data["route_ids"]],
            departure_time=p_data["departure_time"],
            total_cost=p_data["total_cost"],
            risk_score=p_data["risk_score"],
            plan_rank=p_data["plan_rank"],
        )

        # Generate SHAP & constraint tracer explanations
        first_temp = shipments[0].temp_class.value if shipments else "chilled"
        tot_weight = sum(s.weight_kg for s in shipments)

        explanations_data = tracer.trace_binding_constraints(
            plan_id=str(plan_obj.id),
            shipment_count=len(p_data["shipment_ids"]),
            temp_class=first_temp,
            total_weight=tot_weight,
            mode="road",
        )

        shap_contribs = shap_service.explain_prediction(
            mode="road",
            season="summer",
            reliability=0.88,
            avg_transit_hrs=24.0,
            temp_class=first_temp,
        )

        for sc in shap_contribs:
            explanations_data.append(
                {
                    "decision_type": "risk",
                    "factor_name": sc["factor_name"],
                    "factor_weight": sc["factor_weight"],
                    "human_readable_text": sc["text"],
                }
            )

        await plan_repo.save_explanations(plan_obj.id, explanations_data)

        # Re-fetch plan with explanations
        full_plan = await plan_repo.get_plan_with_explanations(plan_obj.id)
        if full_plan:
            saved_plans.append(full_plan)

    return saved_plans


@router.get("/{plan_id}", response_model=ConsolidationPlanRead)
async def get_consolidation_plan(
    plan_id: UUID,
    ctx: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    plan_repo = PlanRepository(db, ctx.tenant_id)
    plan = await plan_repo.get_plan_with_explanations(plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consolidation plan not found or access denied",
        )
    return plan


@router.get("/{plan_id}/explanation", response_model=List[ExplanationItem])
async def get_plan_explanations(
    plan_id: UUID,
    ctx: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    plan_repo = PlanRepository(db, ctx.tenant_id)
    plan = await plan_repo.get_plan_with_explanations(plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consolidation plan not found or access denied",
        )
    return plan.explanations
