import pytest
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from app.models.shipment import Shipment, TempClass, ShipmentStatus
from app.models.route import Route, TransportMode
from app.services.optimizer.solver import ConsolidationSolver
from app.services.optimizer.constraints import validate_group_constraints


def test_temperature_group_constraints():
    now = datetime.now(timezone.utc)
    s1 = Shipment(id=uuid4(), weight_kg=1000, volume_cbm=4, temp_class=TempClass.frozen, sla_deadline=now)
    s2 = Shipment(id=uuid4(), weight_kg=1500, volume_cbm=5, temp_class=TempClass.chilled, sla_deadline=now)

    res = validate_group_constraints([s1, s2])
    assert res["valid"] is False
    assert "Incompatible temperature classes" in res["reason"]


def test_consolidation_solver():
    now = datetime.now(timezone.utc)
    s1 = Shipment(id=uuid4(), tenant_id=uuid4(), origin_hub_id=uuid4(), dest_hub_id=uuid4(), weight_kg=2000, volume_cbm=6, temp_class=TempClass.chilled, sla_deadline=now+timedelta(hours=48), status=ShipmentStatus.pending)
    s2 = Shipment(id=uuid4(), tenant_id=uuid4(), origin_hub_id=s1.origin_hub_id, dest_hub_id=s1.dest_hub_id, weight_kg=2500, volume_cbm=7, temp_class=TempClass.chilled, sla_deadline=now+timedelta(hours=48), status=ShipmentStatus.pending)

    r1 = Route(id=uuid4(), origin_hub_id=s1.origin_hub_id, dest_hub_id=s1.dest_hub_id, mode=TransportMode.road, avg_transit_hrs=24.0, base_cost_per_kg=2.0, reliability_score=0.90)

    solver = ConsolidationSolver()
    plans = solver.solve([s1, s2], [r1], [now])
    assert len(plans) > 0
    p = plans[0]
    assert len(p["shipment_ids"]) == 2
    assert p["total_cost"] > 0

