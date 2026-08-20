import pytest
import uuid
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient
from app.core.auth import create_access_token
from app.models import (
    Vehicle,
    VehicleType,
    VehicleOwnerType,
    VehicleAvailability,
    RoadConditionReport,
    RoadConditionType,
    Shipment,
    ShipmentStatus,
    GoodType,
    UrgencyLevel,
    TempClass,
    AllocationHistory,
)
from app.services.optimizer.fairness_calculator import FairnessCalculator
from app.services.optimizer.constraints import validate_vehicle_compatibility
from app.services.risk.delay_model import DelayRiskModel


@pytest.mark.asyncio
async def test_rural_vehicles_api(client: AsyncClient):
    # 1. Create a vehicle
    create_payload = {
        "name": "Pipili Solar Reefer Tempo",
        "type": "tempo",
        "capacity_kg": 1800.0,
        "capacity_cbm": 6.5,
        "temp_control": True,
        "owner_type": "cooperative",
        "current_location_lat": 20.1147,
        "current_location_lon": 85.8344,
        "availability_status": "available",
    }
    res = await client.post("/api/vehicles", json=create_payload)
    assert res.status_code == 201
    v_data = res.json()
    assert v_data["name"] == "Pipili Solar Reefer Tempo"
    assert v_data["temp_control"] is True
    assert v_data["type"] == "tempo"

    vehicle_id = v_data["id"]

    # 2. List vehicles
    list_res = await client.get("/api/vehicles?temp_control_only=true")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Update vehicle status
    patch_res = await client.patch(
        f"/api/vehicles/{vehicle_id}/status",
        json={"availability_status": "en_route", "current_location_lat": 20.25, "current_location_lon": 85.80},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["availability_status"] == "en_route"


@pytest.mark.asyncio
async def test_road_condition_reporting(client: AsyncClient, sample_hubs_and_routes):
    route_id = str(sample_hubs_and_routes["r1"].id)
    report_payload = {
        "route_id": route_id,
        "condition": "flood_risk",
        "reported_by": "surveyor-agent-01",
        "notes": "Mahanadi basin tributary overflow near km 14",
    }
    res = await client.post("/api/road-conditions", json=report_payload)
    assert res.status_code == 201
    assert res.json()["condition"] == "flood_risk"

    # Query latest condition for route
    query_res = await client.get(f"/api/road-conditions/route/{route_id}")
    assert query_res.status_code == 200
    assert query_res.json()["condition"] == "flood_risk"


@pytest.mark.asyncio
async def test_offline_batch_sync_and_idempotency(client: AsyncClient, sample_tenant, sample_hubs_and_routes):
    token = create_access_token({"tenant_id": str(sample_tenant.id), "role": "shipper"})
    headers = {"Authorization": f"Bearer {token}"}

    client_id_1 = str(uuid.uuid4())
    sync_payload = {
        "client_id": str(uuid.uuid4()),
        "device_id": "offline-field-device-101",
        "shipments": [
            {
                "origin_hub_id": str(sample_hubs_and_routes["h1"].id),
                "dest_hub_id": str(sample_hubs_and_routes["h2"].id),
                "good_type": "medicine",
                "urgency": "critical",
                "producer_id": "phc-pipili",
                "producer_name": "Pipili Primary Health Sub-Centre",
                "community_id": "comm-pipili",
                "weight_kg": 25.0,
                "volume_cbm": 0.3,
                "temp_class": "chilled",
                "sla_deadline": (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat(),
                "client_id": client_id_1,
            }
        ],
        "road_conditions": [
            {
                "route_id": str(sample_hubs_and_routes["r1"].id),
                "condition": "unpaved",
                "reported_by": "offline-field-device-101",
            }
        ],
        "temperature_logs": [],
        "vehicle_updates": [],
    }

    # 1. First sync -> processed
    sync_res = await client.post("/api/sync/batch", json=sync_payload, headers=headers)
    assert sync_res.status_code == 200
    assert sync_res.json()["processed_shipments"] == 1
    assert sync_res.json()["processed_road_conditions"] == 1

    # 2. Duplicate sync with same client_id -> idempotent (0 newly processed shipments)
    sync_res_2 = await client.post("/api/sync/batch", json=sync_payload, headers=headers)
    assert sync_res_2.status_code == 200
    assert sync_res_2.json()["processed_shipments"] == 0


@pytest.mark.asyncio
async def test_dynamic_dispatch_and_fairness(client: AsyncClient, sample_tenant, sample_hubs_and_routes):
    token = create_access_token({"tenant_id": str(sample_tenant.id), "role": "shipper"})
    headers = {"Authorization": f"Bearer {token}"}

    # Create available vehicle
    await client.post(
        "/api/vehicles",
        json={
            "name": "Community Auto Carrier",
            "type": "tempo",
            "capacity_kg": 1500.0,
            "capacity_cbm": 5.0,
            "temp_control": True,
            "owner_type": "community",
            "availability_status": "available",
        },
    )

    # Create pending rural shipment (Urgent Medicine from remote cluster)
    shipment_payload = {
        "origin_hub_id": str(sample_hubs_and_routes["h1"].id),
        "dest_hub_id": str(sample_hubs_and_routes["h2"].id),
        "good_type": "medicine",
        "urgency": "critical",
        "producer_id": "phc-banki",
        "producer_name": "Banki Health Clinic",
        "community_id": "comm-banki",
        "weight_kg": 40.0,
        "volume_cbm": 0.5,
        "temp_class": "chilled",
        "sla_deadline": (datetime.now(timezone.utc) + timedelta(hours=18)).isoformat(),
    }
    ship_res = await client.post("/api/shipments", json=shipment_payload, headers=headers)
    assert ship_res.status_code == 201

    # Trigger dynamic matching
    match_res = await client.post("/api/dispatch/match", json={}, headers=headers)
    assert match_res.status_code == 200
    data = match_res.json()
    assert data["status"] == "success"
    assert data["matched_count"] >= 1
    assert any(m["good_type"] == "medicine" for m in data["matches"])

    # Check fairness metrics endpoint
    fairness_res = await client.get("/api/dispatch/fairness-metrics")
    assert fairness_res.status_code == 200
    f_data = fairness_res.json()
    assert 0.0 <= f_data["overall_fairness_index"] <= 1.0
    assert len(f_data["recent_allocations"]) >= 1


@pytest.mark.asyncio
async def test_risk_prediction_with_confidence_and_road_condition(client: AsyncClient, sample_hubs_and_routes):
    route_id = str(sample_hubs_and_routes["r1"].id)

    # Route with zero/few histories -> confidence should be "low"
    payload = {
        "route_id": route_id,
        "temp_class": "chilled",
        "weight_kg": 500.0,
        "road_condition": "flood_risk",
    }
    res = await client.post("/api/risk/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["confidence"] == "low"  # few histories in test database
    assert data["details"]["road_condition"] == "flood_risk"
    assert data["delay_component"] > 0.3  # flood risk elevates delay component


def test_fairness_calculator():
    stats_map = {
        "comm-long-wait": {"total_matches": 1, "avg_wait_minutes": 180.0},
        "comm-fresh": {"total_matches": 10, "avg_wait_minutes": 30.0},
    }
    calc = FairnessCalculator(stats_map, regional_avg_wait=60.0)

    s_long = Shipment(community_id="comm-long-wait")
    s_fresh = Shipment(community_id="comm-fresh")

    boost_long = calc.calculate_fairness_boost(s_long)
    boost_fresh = calc.calculate_fairness_boost(s_fresh)

    assert boost_long > boost_fresh
    assert "exceeds regional average" in calc.get_fairness_rationale(s_long)


def test_medicine_temp_control_constraint():
    s_med = Shipment(good_type=GoodType.medicine, temp_class=TempClass.chilled, weight_kg=50.0, volume_cbm=0.5)

    # Vehicle without temp_control -> invalid
    res_no_temp = validate_vehicle_compatibility(
        shipment=s_med,
        vehicle_capacity_kg=1000.0,
        vehicle_capacity_cbm=5.0,
        vehicle_temp_control=False,
    )
    assert res_no_temp["valid"] is False
    assert "require a temperature-controlled" in res_no_temp["reason"]

    # Vehicle with temp_control -> valid
    res_temp = validate_vehicle_compatibility(
        shipment=s_med,
        vehicle_capacity_kg=1000.0,
        vehicle_capacity_cbm=5.0,
        vehicle_temp_control=True,
    )
    assert res_temp["valid"] is True
