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
    # 1. Create a vehicle with code, location name, and operating cost
    create_payload = {
        "vehicle_code": "AS-01-TC-4101",
        "name": "Jorhat Solar Reefer Tempo",
        "type": "tempo",
        "capacity_kg": 1800.0,
        "capacity_cbm": 6.5,
        "cost_per_km": 11.5,
        "temp_control": True,
        "owner_type": "cooperative",
        "current_location_name": "Jorhat Upper Assam Tea Belt",
        "current_location_lat": 26.75,
        "current_location_lon": 94.22,
        "availability_status": "available",
        "current_assignment": None,
    }
    res = await client.post("/api/vehicles", json=create_payload)
    assert res.status_code == 201
    v_data = res.json()
    assert v_data["vehicle_code"] == "AS-01-TC-4101"
    assert v_data["name"] == "Jorhat Solar Reefer Tempo"
    assert v_data["temp_control"] is True
    assert v_data["type"] == "tempo"
    assert v_data["cost_per_km"] == 11.5
    assert v_data["current_location_name"] == "Jorhat Upper Assam Tea Belt"

    vehicle_id = v_data["id"]

    # 2. List vehicles with location and temp_control filter
    list_res = await client.get("/api/vehicles?temp_control_only=true&location=Jorhat")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1
    assert any(v["vehicle_code"] == "AS-01-TC-4101" for v in list_res.json())

    # 3. Update vehicle details via PATCH /api/vehicles/{id}
    update_res = await client.patch(
        f"/api/vehicles/{vehicle_id}",
        json={"cost_per_km": 12.5, "current_assignment": "Route RUR-101"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["cost_per_km"] == 12.5
    assert update_res.json()["current_assignment"] == "Route RUR-101"

    # 4. Update vehicle status via PATCH /api/vehicles/{id}/status
    patch_res = await client.patch(
        f"/api/vehicles/{vehicle_id}/status",
        json={"availability_status": "occupied", "current_location_lat": 20.25, "current_location_lon": 85.80, "current_assignment": "Dispatched Waybill RUR-90141"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["availability_status"] == "occupied"
    assert patch_res.json()["current_assignment"] == "Dispatched Waybill RUR-90141"

    # 5. Delete vehicle
    del_res = await client.delete(f"/api/vehicles/{vehicle_id}")
    assert del_res.status_code == 204

    # 6. Verify deleted vehicle returns 404
    get_res = await client.get(f"/api/vehicles/{vehicle_id}")
    assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_dynamic_optimizer_allocation_recalculation(client: AsyncClient, sample_tenant, sample_hubs_and_routes):
    """Verifies that changing vehicle availability immediately changes optimizer allocation dynamically."""
    token = create_access_token({"tenant_id": str(sample_tenant.id), "role": "shipper"})
    headers = {"Authorization": f"Bearer {token}"}

    # Create 2 vehicles: Vehicle 1 (Bolero 4x4) and Vehicle 2 (Tata Ace)
    v1_res = await client.post(
        "/api/vehicles",
        json={
            "vehicle_code": "OD-12-BP-9901",
            "name": "Highland Bolero 4x4",
            "type": "pickup_4x4",
            "capacity_kg": 1500.0,
            "capacity_cbm": 6.0,
            "temp_control": True,
            "owner_type": "cooperative",
            "current_location_name": "Tawang Mountain Outpost",
            "availability_status": "available",
        },
    )
    v1_id = v1_res.json()["id"]

    v2_res = await client.post(
        "/api/vehicles",
        json={
            "vehicle_code": "AS-01-TC-9902",
            "name": "Guwahati Tata Ace",
            "type": "mini_truck",
            "capacity_kg": 1000.0,
            "capacity_cbm": 4.5,
            "temp_control": True,
            "owner_type": "individual",
            "current_location_name": "Guwahati Mega Hub",
            "availability_status": "available",
        },
    )
    v2_id = v2_res.json()["id"]

    # Create urgent medicine shipment
    ship_res = await client.post(
        "/api/shipments",
        json={
            "origin_hub_id": str(sample_hubs_and_routes["h1"].id),
            "dest_hub_id": str(sample_hubs_and_routes["h2"].id),
            "good_type": "medicine",
            "urgency": "critical",
            "producer_id": "phc-tawang",
            "producer_name": "Tawang District Hospital",
            "community_id": "comm-tawang",
            "weight_kg": 150.0,
            "volume_cbm": 0.8,
            "temp_class": "chilled",
            "sla_deadline": (datetime.now(timezone.utc) + timedelta(hours=18)).isoformat(),
        },
        headers=headers,
    )
    assert ship_res.status_code == 201

    # Match when both vehicles are available -> matches successfully
    match_1 = await client.post("/api/dispatch/match", json={}, headers=headers)
    assert match_1.status_code == 200
    m_data_1 = match_1.json()
    assert m_data_1["matched_count"] >= 1

    # Now toggle the assigned vehicle to 'offline'
    await client.patch(
        f"/api/vehicles/{v1_id}/status",
        json={"availability_status": "offline"},
    )

    # Re-run matching -> optimizer recalculates allocation without the offline vehicle
    match_2 = await client.post("/api/dispatch/match", json={}, headers=headers)
    assert match_2.status_code == 200
    m_data_2 = match_2.json()
    assert all(m["matched_vehicle_id"] != v1_id for m in m_data_2["matches"])


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
                "producer_id": "phc-jorhat",
                "producer_name": "Jorhat Health Sub-Centre",
                "community_id": "comm-jorhat",
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


def test_vehicle_remaining_capacity_and_thermal_isolation():
    # 1. Payload remaining capacity test
    s_produce = Shipment(good_type=GoodType.farm_produce, temp_class=TempClass.chilled, weight_kg=300.0, volume_cbm=1.5)

    # Vehicle capacity 500kg, currently holding 300kg -> adding 300kg exceeds 500kg
    res_overflow = validate_vehicle_compatibility(
        shipment=s_produce,
        vehicle_capacity_kg=500.0,
        vehicle_capacity_cbm=3.0,
        vehicle_temp_control=True,
        current_assigned_weight_kg=300.0,
        current_assigned_volume_cbm=1.0,
        current_temp_class=TempClass.chilled,
    )
    assert res_overflow["valid"] is False
    assert "exceeds vehicle remaining capacity" in res_overflow["reason"]

    # Fits within remaining capacity
    res_fits = validate_vehicle_compatibility(
        shipment=s_produce,
        vehicle_capacity_kg=1000.0,
        vehicle_capacity_cbm=5.0,
        vehicle_temp_control=True,
        current_assigned_weight_kg=300.0,
        current_assigned_volume_cbm=1.0,
        current_temp_class=TempClass.chilled,
    )
    assert res_fits["valid"] is True

    # 2. Thermal isolation conflict (trying to mix Ambient onto a Chilled batch)
    s_ambient = Shipment(good_type=GoodType.essential_goods, temp_class=TempClass.ambient, weight_kg=100.0, volume_cbm=0.5)
    res_thermal_conflict = validate_vehicle_compatibility(
        shipment=s_ambient,
        vehicle_capacity_kg=1000.0,
        vehicle_capacity_cbm=5.0,
        vehicle_temp_control=True,
        current_assigned_weight_kg=200.0,
        current_assigned_volume_cbm=1.0,
        current_temp_class=TempClass.chilled,
    )
    assert res_thermal_conflict["valid"] is False
    assert "Thermal conflict" in res_thermal_conflict["reason"]

    # 3. Flood risk terrain constraint (disqualifies motorbike/shared_auto)
    res_flood_bike = validate_vehicle_compatibility(
        shipment=s_ambient,
        vehicle_capacity_kg=200.0,
        vehicle_capacity_cbm=1.0,
        vehicle_temp_control=False,
        road_condition="flood_risk",
        vehicle_type="motorbike",
    )
    assert res_flood_bike["valid"] is False
    assert "cannot safely traverse flood-risk" in res_flood_bike["reason"]

    res_flood_tempo = validate_vehicle_compatibility(
        shipment=s_ambient,
        vehicle_capacity_kg=1500.0,
        vehicle_capacity_cbm=6.0,
        vehicle_temp_control=False,
        road_condition="flood_risk",
        vehicle_type="tempo",
    )
    assert res_flood_tempo["valid"] is True

