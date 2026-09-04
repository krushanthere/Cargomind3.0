import pytest
import uuid
from datetime import datetime, timezone
from app.models.shipment import Shipment, TempClass, GoodType, UrgencyLevel
from app.models.route import Route, TransportMode
from app.models.vehicle import Vehicle, VehicleType, VehicleAvailability, VehicleOwnerType
from app.services.optimizer.solver import ConsolidationSolver


def test_cpsat_with_st_gnn_soft_penalty():
    hub_a = uuid.uuid4()
    hub_b = uuid.uuid4()
    route_good = Route(
        id=uuid.uuid4(),
        origin_hub_id=hub_a,
        dest_hub_id=hub_b,
        mode=TransportMode.road,
        avg_transit_hrs=4.0,
        base_cost_per_kg=2.0,
        reliability_score=0.95,
        distance_km=100.0,
        avg_gradient_pct=1.5,
        elevation_gain_m=50.0,
        terrain_type="plains",
    )
    route_degraded = Route(
        id=uuid.uuid4(),
        origin_hub_id=hub_a,
        dest_hub_id=hub_b,
        mode=TransportMode.road,
        avg_transit_hrs=4.0,
        base_cost_per_kg=2.0,
        reliability_score=0.95,
        distance_km=100.0,
        avg_gradient_pct=1.5,
        elevation_gain_m=50.0,
        terrain_type="plains",
    )

    shipment = Shipment(
        id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        origin_hub_id=hub_a,
        dest_hub_id=hub_b,
        good_type=GoodType.farm_produce,
        urgency=UrgencyLevel.routine,
        producer_id="p1",
        producer_name="Assam Agro",
        community_id="comm-jorhat",
        weight_kg=200.0,
        volume_cbm=1.0,
        temp_class=TempClass.ambient,
        sla_deadline=datetime.now(timezone.utc),
        max_cost=5000.0,
    )

    vehicle = Vehicle(
        id=uuid.uuid4(),
        name="Tata Ace #1",
        type=VehicleType.mini_truck,
        capacity_kg=1500.0,
        capacity_cbm=6.0,
        cost_per_km=10.0,
        temp_control=False,
        owner_type=VehicleOwnerType.cooperative,
        current_location_lat=26.18,
        current_location_lon=91.74,
        availability_status=VehicleAvailability.available,
    )

    # ST-GNN marks route_degraded as highly degraded (risk 0.90) and route_good as low degradation (risk 0.05)
    st_gnn_risks = {
        route_good.id: 0.05,
        route_degraded.id: 0.90,
    }

    solver = ConsolidationSolver()

    # Case A: Optimization with ST-GNN soft penalty
    plans_with_st_gnn = solver.solve(
        shipments=[shipment],
        candidate_routes=[route_degraded, route_good],
        candidate_departure_times=[datetime.now(timezone.utc)],
        available_vehicles=[vehicle],
        st_gnn_degradation_scores=st_gnn_risks,
        lambda_degradation=500.0,
    )

    assert len(plans_with_st_gnn) > 0
    chosen_plan = plans_with_st_gnn[0]
    # CP-SAT should favor route_good due to degradation soft penalty
    assert route_good.id in chosen_plan["route_ids"]
    assert chosen_plan["st_gnn_integrated"] is True


def test_cpsat_solver_of_record_disabling_st_gnn():
    hub_a = uuid.uuid4()
    hub_b = uuid.uuid4()
    route = Route(
        id=uuid.uuid4(),
        origin_hub_id=hub_a,
        dest_hub_id=hub_b,
        mode=TransportMode.road,
        avg_transit_hrs=4.0,
        base_cost_per_kg=2.0,
        reliability_score=0.95,
        distance_km=100.0,
    )
    shipment = Shipment(
        id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        origin_hub_id=hub_a,
        dest_hub_id=hub_b,
        good_type=GoodType.farm_produce,
        urgency=UrgencyLevel.routine,
        producer_id="p1",
        producer_name="Assam Agro",
        community_id="comm-jorhat",
        weight_kg=200.0,
        volume_cbm=1.0,
        temp_class=TempClass.ambient,
        sla_deadline=datetime.now(timezone.utc),
        max_cost=5000.0,
    )

    solver = ConsolidationSolver()
    # When st_gnn_degradation_scores is empty or None, CP-SAT operates on baseline
    plans = solver.solve(
        shipments=[shipment],
        candidate_routes=[route],
        candidate_departure_times=[datetime.now(timezone.utc)],
        st_gnn_degradation_scores=None,
    )
    assert len(plans) > 0
    assert plans[0]["st_gnn_integrated"] is False
