import uuid
from datetime import datetime, timezone, timedelta
import pytest
from httpx import AsyncClient
from app.models.tenant import TenantType
from app.models.shipment import TempClass, GoodType, UrgencyLevel
from app.models.roadsense import RoadSegmentStatus, VehicleProfileType
from app.models.vehicle import VehicleType, VehicleAvailability, VehicleOwnerType
from app.models.hub import Hub, HubType, PowerReliability
from app.models.route import Route, TransportMode


@pytest.mark.asyncio
async def test_all_39_endpoints_end_to_end(client: AsyncClient, db_session):
    # 1. Health
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"

    # 2. Auth - register tenant
    r = await client.post(
        "/api/auth/register-tenant",
        json={"name": "Test Shipper Tenant", "type": "shipper"},
    )
    assert r.status_code == 201
    tenant_shipper_id = r.json()["id"]

    # 3. Auth - get token
    r = await client.post(
        "/api/auth/token",
        json={"tenant_id": tenant_shipper_id, "role": "shipper"},
    )
    assert r.status_code == 200
    token = r.json()["access_token"]
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Tenant-ID": tenant_shipper_id,
        "X-Tenant-Role": "shipper",
    }

    # 4. Chat - status
    r = await client.get("/api/chat/status")
    assert r.status_code == 200
    assert r.json()["status"] == "online"

    # 5. Chat - post message
    r = await client.post(
        "/api/chat",
        json={"message": "What is this platform?", "locale": "en"},
    )
    assert r.status_code == 200
    assert "CargoMind" in r.json()["reply"]

    # 6. Chat - post assistant (alias)
    r = await client.post(
        "/api/chat/assistant",
        json={"message": "ऑर्डर कैसे बनाएँ", "locale": "hi"},
    )
    assert r.status_code == 200
    assert len(r.json()["reply"]) > 0

    # 7. Create Hubs & Routes in DB for testing
    h1 = Hub(
        id=uuid.uuid4(),
        name="Jorhat Agro Node",
        lat=26.75,
        lon=94.22,
        type=HubType.aggregation_point,
        power_reliability=PowerReliability.solar,
        cold_storage_capacity_kg=25000.0,
    )
    h2 = Hub(
        id=uuid.uuid4(),
        name="Guwahati Mega Cold Hub",
        lat=26.18,
        lon=91.75,
        type=HubType.warehouse,
        power_reliability=PowerReliability.grid,
        cold_storage_capacity_kg=50000.0,
    )
    db_session.add_all([h1, h2])
    await db_session.commit()

    r1 = Route(
        id=uuid.uuid4(),
        origin_hub_id=h1.id,
        dest_hub_id=h2.id,
        mode=TransportMode.road,
        avg_transit_hrs=0.6,
        base_cost_per_kg=1.5,
        reliability_score=0.92,
        distance_km=20.0,
    )
    db_session.add(r1)
    await db_session.commit()

    hub1_id = str(h1.id)
    hub2_id = str(h2.id)
    route1_id = str(r1.id)

    # 8. Network Graph
    r = await client.get("/api/network/graph", headers=headers)
    assert r.status_code == 200
    graph_data = r.json()
    assert "hubs" in graph_data
    assert "routes" in graph_data
    assert len(graph_data["hubs"]) >= 2

    # 9. Graph (alias)
    r = await client.get("/api/graph", headers=headers)
    assert r.status_code == 200

    # 10. Hubs
    r = await client.get("/api/hubs", headers=headers)
    assert r.status_code == 200
    assert len(r.json()) >= 2

    # 11. Network Hubs (alias)
    r = await client.get("/api/network/hubs", headers=headers)
    assert r.status_code == 200

    # 12. Hub Capacity
    r = await client.get(f"/api/hubs/{hub1_id}/capacity", headers=headers)
    assert r.status_code == 200
    assert r.json()["total_cold_storage_capacity_kg"] == 25000.0

    # 13. Network Hub Capacity (alias)
    r = await client.get(f"/api/network/hubs/{hub1_id}/capacity", headers=headers)
    assert r.status_code == 200

    # 14. Routes
    r = await client.get("/api/routes", headers=headers)
    assert r.status_code == 200
    assert len(r.json()) >= 1

    # 15. Network Routes (alias)
    r = await client.get("/api/network/routes", headers=headers)
    assert r.status_code == 200

    # 16. Candidate Route Scores
    r = await client.get(
        f"/api/routes/candidate-scores?origin_hub_id={hub1_id}&dest_hub_id={hub2_id}",
        headers=headers,
    )
    assert r.status_code == 200
    assert len(r.json()) >= 1

    # 17. Road Conditions
    r = await client.get("/api/road-conditions", headers=headers)
    assert r.status_code == 200

    # 18. Report Road Condition
    r = await client.post(
        "/api/road-conditions",
        headers=headers,
        json={
            "route_id": route1_id,
            "condition": "paved",
            "reported_by": "tester-agent",
            "notes": "Clear conditions on corridor",
        },
    )
    assert r.status_code == 201

    # 19. Route Condition for single route
    r = await client.get(f"/api/road-conditions/route/{route1_id}", headers=headers)
    assert r.status_code == 200
    assert r.json()["condition"] == "paved"

    # 20. Create RoadSense Segment
    r = await client.post(
        "/api/roadsense/segments",
        headers=headers,
        json={
            "osm_way_id": "way/999999",
            "name": "Test Rural Corridor NH-Test",
            "block_name": "Test Block",
            "district": "Kamrup",
            "surface_type": "paved",
            "width_meters": 4.5,
            "condition_grade": "good",
            "current_status": "clear",
            "elevation_gain_m": 10.0,
            "gradient_pct": 2.0,
            "has_bridge_culvert": True,
            "bridge_weight_limit_tonnes": 15.0,
            "lat_start": 20.0,
            "lon_start": 85.8,
            "lat_end": 20.1,
            "lon_end": 85.9,
            "length_km": 5.0,
            "terrain_type": "plains",
        },
    )
    assert r.status_code == 201
    created_seg = r.json()
    seg1_id = created_seg["id"]

    # 21. RoadSense Single Segment with Reports
    r = await client.get(f"/api/roadsense/segments/{seg1_id}", headers=headers)
    assert r.status_code == 200
    assert "reports" in r.json()

    # 22. RoadSense list segments
    r = await client.get("/api/roadsense/segments", headers=headers)
    assert r.status_code == 200
    assert len(r.json()) > 0

    # 23. Submit RoadSense Report
    r = await client.post(
        "/api/roadsense/reports",
        headers=headers,
        json={
            "segment_id": seg1_id,
            "status": "clear",
            "reporter_id": "test-reporter",
            "note": "Smooth passage for all reefer vehicles",
        },
    )
    assert r.status_code == 201

    # 24. RoadSense Vehicle Profiles
    r = await client.get("/api/roadsense/vehicle-profiles", headers=headers)
    assert r.status_code == 200

    # 25. RoadSense Roadability Score
    r = await client.get(
        f"/api/roadsense/score?segment_id={seg1_id}&vehicle_type=truck",
        headers=headers,
    )
    assert r.status_code == 200
    score_data = r.json()
    assert "score" in score_data
    assert "recommended" in score_data

    # 26. Risk Prediction
    r = await client.post(
        "/api/risk/predict",
        headers=headers,
        json={
            "route_id": route1_id,
            "origin_hub_id": hub1_id,
            "dest_hub_id": hub2_id,
            "temp_class": "frozen",
            "transit_hours": 3.5,
            "weight_kg": 500.0,
            "season": "summer",
            "road_condition": "paved",
        },
    )
    assert r.status_code == 200
    risk_res = r.json()
    assert "risk_score" in risk_res
    assert "spoilage_component" in risk_res

    # 27. Create Shipment
    now_iso = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    client_ship_id = str(uuid.uuid4())
    r = await client.post(
        "/api/shipments",
        headers=headers,
        json={
            "origin_hub_id": hub1_id,
            "dest_hub_id": hub2_id,
            "good_type": "farm_produce",
            "urgency": "high",
            "producer_id": "prod-001",
            "producer_name": "Test Farmer Cooperative",
            "community_id": "comm-test",
            "waybill_number": "RUR-88888",
            "load_quantity": 25.0,
            "quantity_units": "crates",
            "weight_kg": 350.0,
            "volume_cbm": 1.2,
            "temp_class": "chilled",
            "sla_deadline": now_iso,
            "max_cost": 2500.0,
            "client_id": client_ship_id,
        },
    )
    assert r.status_code == 201
    created_shipment = r.json()
    shipment_id = created_shipment["id"]

    # 28. List Shipments
    r = await client.get("/api/shipments", headers=headers)
    assert r.status_code == 200
    shipments_list = r.json()
    assert len(shipments_list) > 0

    # 29. Get Single Shipment
    r = await client.get(f"/api/shipments/{shipment_id}", headers=headers)
    assert r.status_code == 200
    assert r.json()["id"] == shipment_id

    # 30. List Vehicles
    r = await client.get("/api/vehicles", headers=headers)
    assert r.status_code == 200

    # 31. Create Vehicle
    r = await client.post(
        "/api/vehicles",
        headers=headers,
        json={
            "vehicle_code": "OD-02-TC-9999",
            "name": "Mahindra Bolero Maxi Truck HD",
            "type": "bolero_pickup",
            "capacity_kg": 1700.0,
            "capacity_cbm": 7.5,
            "cost_per_km": 14.0,
            "max_gradient_pct": 18.0,
            "suitable_terrains": "plains,hilly",
            "temp_control": True,
            "owner_type": "cooperative",
            "current_location_name": "Guwahati Central Hub",
            "current_location_lat": 26.18,
            "current_location_lon": 91.75,
            "availability_status": "available",
        },
    )
    assert r.status_code == 201
    created_v = r.json()
    new_v_id = created_v["id"]

    # 32. Get Single Vehicle
    r = await client.get(f"/api/vehicles/{new_v_id}", headers=headers)
    assert r.status_code == 200
    assert r.json()["name"] == "Mahindra Bolero Maxi Truck HD"

    # 33. Patch Vehicle
    r = await client.patch(
        f"/api/vehicles/{new_v_id}",
        headers=headers,
        json={"cost_per_km": 15.5},
    )
    assert r.status_code == 200
    assert r.json()["cost_per_km"] == 15.5

    # 34. Patch Vehicle Status
    r = await client.patch(
        f"/api/vehicles/{new_v_id}/status",
        headers=headers,
        json={"availability_status": "en_route", "current_assignment": "Assigned to Jorhat-Guwahati Reefer Run"},
    )
    assert r.status_code == 200
    assert r.json()["availability_status"] == "en_route"

    # 35. Dispatch Matching
    r = await client.post(
        "/api/dispatch/match",
        headers=headers,
        json={},
    )
    assert r.status_code == 200
    dispatch_res = r.json()
    assert dispatch_res["status"] == "success"
    assert "matches" in dispatch_res

    # 36. Dispatch Fairness Metrics
    r = await client.get("/api/dispatch/fairness-metrics", headers=headers)
    assert r.status_code == 200
    fairness = r.json()
    assert "overall_fairness_index" in fairness
    assert "community_breakdown" in fairness

    # 37. Dispatch History
    r = await client.get("/api/dispatch/history", headers=headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)

    # 38. Temperature Logs Batch Upload
    r = await client.post(
        "/api/temperature-logs/batch",
        headers=headers,
        json={
            "logs": [
                {
                    "shipment_id": shipment_id,
                    "vehicle_id": "OD-02-TC-9999",
                    "temp_celsius": 4.2,
                    "humidity": 85.0,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            ]
        },
    )
    assert r.status_code == 201
    assert r.json()["status"] == "success"

    # 39. Offline Sync Batch
    r = await client.post(
        "/api/sync/batch",
        headers=headers,
        json={
            "device_id": "test-device-tablet-01",
            "shipments": [
                {
                    "origin_hub_id": hub1_id,
                    "dest_hub_id": hub2_id,
                    "good_type": "medicine",
                    "urgency": "critical",
                    "producer_id": "phc-01",
                    "producer_name": "Rural Primary Health Center",
                    "community_id": "comm-health",
                    "weight_kg": 15.0,
                    "volume_cbm": 0.1,
                    "temp_class": "chilled",
                    "sla_deadline": now_iso,
                    "client_id": str(uuid.uuid4()),
                }
            ],
            "road_conditions": [],
            "road_reports": [],
            "temperature_logs": [],
            "vehicle_updates": [],
        },
    )
    assert r.status_code == 200
    assert r.json()["status"] == "success"
    assert r.json()["processed_shipments"] == 1

    # 40. Delete Vehicle
    r = await client.delete(f"/api/vehicles/{new_v_id}", headers=headers)
    assert r.status_code == 204
