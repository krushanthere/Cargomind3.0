import pytest
import uuid
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient
from app.core.auth import create_access_token
from app.models import (
    Hub,
    HubType,
    Route,
    TransportMode,
    Vehicle,
    VehicleType,
    VehicleOwnerType,
    VehicleAvailability,
    Shipment,
    ShipmentStatus,
    GoodType,
    UrgencyLevel,
    TempClass,
)
from app.services.network.terrain_service import TerrainService
from app.services.optimizer.solver import ConsolidationSolver
from app.services.optimizer.constraints import validate_vehicle_compatibility


@pytest.mark.asyncio
async def test_load_quantity_and_utilization_in_dispatch(client: AsyncClient, sample_tenant, sample_hubs_and_routes):
    token = create_access_token({"tenant_id": str(sample_tenant.id), "role": "shipper"})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a vehicle with 1500kg capacity
    v_res = await client.post(
        "/api/vehicles",
        json={
            "name": "Tata Ace Mini-Truck #10",
            "type": "mini_truck",
            "capacity_kg": 1500.0,
            "capacity_cbm": 6.5,
            "cost_per_km": 12.0,
            "max_gradient_pct": 18.0,
            "suitable_terrains": "plains,hilly",
            "temp_control": True,
            "owner_type": "cooperative",
            "availability_status": "available",
        },
    )
    assert v_res.status_code == 201

    # 2. Create a shipment with load quantity and quantity units
    shipment_payload = {
        "origin_hub_id": str(sample_hubs_and_routes["h1"].id),
        "dest_hub_id": str(sample_hubs_and_routes["h2"].id),
        "good_type": "farm_produce",
        "urgency": "high",
        "producer_id": "prod-pipili-01",
        "producer_name": "Pipili Farmer Samiti",
        "community_id": "comm-pipili",
        "waybill_number": "RUR-TEST-01",
        "load_quantity": 40.0,
        "quantity_units": "crates",
        "weight_kg": 600.0,
        "volume_cbm": 3.0,
        "temp_class": "chilled",
        "sla_deadline": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
    }
    ship_res = await client.post("/api/shipments", json=shipment_payload, headers=headers)
    assert ship_res.status_code == 201
    s_data = ship_res.json()
    assert s_data["load_quantity"] == 40.0
    assert s_data["quantity_units"] == "crates"
    assert s_data["waybill_number"] == "RUR-TEST-01"

    # 3. Trigger dynamic dispatch matching
    match_res = await client.post("/api/dispatch/match", json={}, headers=headers)
    assert match_res.status_code == 200
    data = match_res.json()
    assert data["status"] == "success"
    assert data["matched_count"] >= 1
    assert data["avg_load_utilization_pct"] > 0.0

    match_item = next(m for m in data["matches"] if m["waybill_number"] == "RUR-TEST-01")
    assert match_item["load_quantity"] == 40.0
    assert match_item["quantity_units"] == "crates"
    assert match_item["matched_vehicle_capacity_kg"] == 1500.0
    assert match_item["load_utilization_pct"] == round((600.0 / 1500.0) * 100.0, 1)


def test_srtm_elevation_and_terrain_classification():
    # 1. Check SRTM elevation for Daringbadi Highlands (should be high altitude)
    elev_daringbadi = TerrainService.get_elevation_m(19.9100, 84.1300)
    assert elev_daringbadi >= 800.0

    # 2. Check SRTM elevation for Bhubaneswar Central Hub (coastal plains)
    elev_bbs = TerrainService.get_elevation_m(20.2961, 85.8245)
    assert elev_bbs < 100.0

    # 3. Calculate route terrain metrics for hill ascent
    metrics = TerrainService.calculate_route_terrain_metrics(
        orig_lat=20.2961, orig_lon=85.8245,  # BBS (45m)
        dest_lat=19.9100, dest_lon=84.1300,  # Daringbadi (980m)
        distance_km=140.0,
    )
    assert metrics["terrain_type"] in ["hilly", "mountainous"]
    assert metrics["elevation_gain_m"] > 800.0
    assert metrics["speed_factor"] < 1.0  # Slowdown applied
    assert metrics["cost_multiplier"] > 1.0  # Fuel/grade penalty applied


def test_hilly_terrain_vehicle_restrictions():
    # Tractor-trailer on steep 14% mountain gradient -> should be restricted
    res_tractor = TerrainService.validate_vehicle_gradeability(
        vehicle_type="tractor_trailer",
        gradient_pct=14.0,
        terrain_type="mountainous",
    )
    assert res_tractor["allowed"] is False
    assert "exceeded" in res_tractor["reason"] or "restricted" in res_tractor["reason"]

    # 4x4 pickup / bolero pickup on steep 14% mountain gradient -> allowed
    res_pickup = TerrainService.validate_vehicle_gradeability(
        vehicle_type="pickup_4x4",
        gradient_pct=14.0,
        terrain_type="mountainous",
    )
    assert res_pickup["allowed"] is True

    res_bolero = TerrainService.validate_vehicle_gradeability(
        vehicle_type="bolero_pickup",
        gradient_pct=25.0,
        terrain_type="mountainous",
    )
    assert res_bolero["allowed"] is True

    # Tata Ace on moderate 15% hilly gradient -> allowed
    res_tata_ace = TerrainService.validate_vehicle_gradeability(
        vehicle_type="tata_ace",
        gradient_pct=15.0,
        terrain_type="hilly",
    )
    assert res_tata_ace["allowed"] is True

    # Cargo bike on mountain paths -> allowed up to 22%
    res_bike = TerrainService.validate_vehicle_gradeability(
        vehicle_type="cargo_bike",
        gradient_pct=18.0,
        terrain_type="mountainous",
    )
    assert res_bike["allowed"] is True

    # Riverine boat on plains route -> restricted
    res_boat_plains = TerrainService.validate_vehicle_gradeability(
        vehicle_type="riverine_boat",
        gradient_pct=1.0,
        terrain_type="plains",
    )
    assert res_boat_plains["allowed"] is False


@pytest.mark.asyncio
async def test_chatbot_status_eta_and_reschedule(client: AsyncClient, sample_tenant, sample_hubs_and_routes):
    token = create_access_token({"tenant_id": str(sample_tenant.id), "role": "shipper"})
    headers = {"Authorization": f"Bearer {token}"}

    # Create shipment for chatbot testing
    wb = "RUR-99999"
    await client.post(
        "/api/shipments",
        json={
            "origin_hub_id": str(sample_hubs_and_routes["h1"].id),
            "dest_hub_id": str(sample_hubs_and_routes["h2"].id),
            "good_type": "medicine",
            "urgency": "critical",
            "producer_id": "phc-pipili",
            "producer_name": "Pipili Health Sub-Centre",
            "community_id": "comm-pipili",
            "waybill_number": wb,
            "load_quantity": 50.0,
            "quantity_units": "vials",
            "weight_kg": 15.0,
            "volume_cbm": 0.2,
            "temp_class": "chilled",
            "sla_deadline": (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat(),
        },
        headers=headers,
    )

    # 1. Chat query for order status
    status_res = await client.post(
        "/api/chat/assistant",
        json={"message": f"Where is my order {wb}?", "locale": "en"},
        headers=headers,
    )
    assert status_res.status_code == 200
    s_reply = status_res.json()
    assert s_reply["intent"] == "order_status"
    assert wb in s_reply["reply"]
    assert "Medicine" in s_reply["reply"] or "Pipili" in s_reply["reply"]

    # 2. Chat query for delivery ETA
    eta_res = await client.post(
        "/api/chat/assistant",
        json={"message": f"What is the delivery ETA for {wb}?", "locale": "en"},
        headers=headers,
    )
    assert eta_res.status_code == 200
    eta_reply = eta_res.json()
    assert eta_reply["intent"] == "delivery_eta"
    assert "ETA" in eta_reply["reply"]

    # 3. Chat query for rescheduling
    reschedule_res = await client.post(
        "/api/chat/assistant",
        json={"message": f"Please reschedule {wb} to tomorrow", "locale": "en"},
        headers=headers,
    )
    assert reschedule_res.status_code == 200
    r_reply = reschedule_res.json()
    assert r_reply["intent"] == "reschedule"
    assert "Rescheduling Confirmed" in r_reply["reply"]


@pytest.mark.asyncio
async def test_multi_vehicle_type_vrp_solver():
    now = datetime.now(timezone.utc)
    s1 = Shipment(
        id=uuid.uuid4(), weight_kg=800.0, volume_cbm=2.5,
        temp_class=TempClass.chilled, sla_deadline=now + timedelta(hours=24),
    )
    s2 = Shipment(
        id=uuid.uuid4(), weight_kg=400.0, volume_cbm=1.2,
        temp_class=TempClass.chilled, sla_deadline=now + timedelta(hours=24),
    )

    r1 = Route(
        id=uuid.uuid4(), avg_transit_hrs=2.0, base_cost_per_kg=1.5,
        reliability_score=0.92, distance_km=30.0, elevation_gain_m=50.0,
        avg_gradient_pct=1.5, terrain_type="plains",
    )

    fleet = [
        Vehicle(
            id=uuid.uuid4(), name="Bolero Mini-Truck", type=VehicleType.mini_truck,
            capacity_kg=1500.0, capacity_cbm=6.5, cost_per_km=12.0,
            max_gradient_pct=18.0, suitable_terrains="plains,hilly",
        ),
        Vehicle(
            id=uuid.uuid4(), name="Cargo E-Bike", type=VehicleType.cargo_bike,
            capacity_kg=100.0, capacity_cbm=0.5, cost_per_km=3.0,
            max_gradient_pct=22.0, suitable_terrains="plains,hilly,mountainous",
        ),
    ]

    solver = ConsolidationSolver()
    plans = solver.solve([s1, s2], [r1], [now], available_vehicles=fleet)
    assert len(plans) > 0
    p = plans[0]
    assert len(p["shipment_ids"]) == 2
    assert p["load_utilization_pct"] == round((1200.0 / 1500.0) * 100.0, 1)
    assert len(p["vehicle_assignments"]) >= 1
    assert p["vehicle_assignments"][0]["vehicle_type"] == "mini_truck"


@pytest.mark.asyncio
async def test_chatbot_multilingual_faqs(client: AsyncClient, sample_tenant):
    token = create_access_token({"tenant_id": str(sample_tenant.id), "role": "shipper"})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Test General FAQ Menu in English, Hindi, Odia
    for loc, query in [("en", "faq"), ("hi", "सवाल"), ("or", "ପ୍ରଶ୍ନ")]:
        res = await client.post(
            "/api/chat/assistant",
            json={"message": query, "locale": loc},
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "faq_menu"
        assert len(data["quick_replies"]) > 0

    # 2. Test All 12 FAQs in English
    questions_en = [
        ("What is this platform?", "what_is_platform"),
        ("How do I create a shipment?", "create_shipment"),
        ("How can I find a vehicle?", "find_vehicle"),
        ("How does vehicle matching work?", "vehicle_matching"),
        ("How can I track my shipment?", "track_shipment"),
        ("What happens if there is no internet?", "no_internet"),
        ("How does offline synchronization work?", "offline_sync"),
        ("How are duplicate submissions prevented?", "prevent_duplicates"),
        ("Who can use the platform?", "who_can_use"),
        ("How does the platform help rural areas?", "rural_help"),
        ("What happens if no vehicle is available?", "no_vehicle_available"),
        ("How can I contact/get help?", "contact_help"),
    ]

    for q_text, expected_id in questions_en:
        res = await client.post(
            "/api/chat/assistant",
            json={"message": q_text, "locale": "en"},
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "faq"
        assert data["faq_id"] == expected_id
        assert len(data["reply"]) > 20

    # 3. Test FAQs in Hindi
    questions_hi = [
        ("यह प्लेटफॉर्म क्या है?", "what_is_platform"),
        ("यदि इंटरनेट न हो तो क्या होगा?", "no_internet"),
        ("वाहन मिलान कैसे काम करता है?", "vehicle_matching"),
        ("यह प्लेटफॉर्म ग्रामीण क्षेत्रों की कैसे मदद करता है?", "rural_help"),
    ]
    for q_text, expected_id in questions_hi:
        res = await client.post(
            "/api/chat/assistant",
            json={"message": q_text, "locale": "hi"},
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "faq"
        assert data["faq_id"] == expected_id

    # 4. Test FAQs in Odia
    questions_or = [
        ("ଏହି ପ୍ଲାଟଫର୍ମ କ'ଣ?", "what_is_platform"),
        ("ଯଦି ଇଣ୍ଟରନେଟ୍ ନଥାଏ ତେବେ କ'ଣ ହେବ?", "no_internet"),
        ("ଗାଡ଼ି ମ୍ୟାଚିଂ କିପରି କାମ କରେ?", "vehicle_matching"),
        ("ଏହି ପ୍ଲାଟଫର୍ମ ଗ୍ରାମାଞ୍ଚଳକୁ କିପରି ସାହାଯ୍ୟ କରେ?", "rural_help"),
    ]
    for q_text, expected_id in questions_or:
        res = await client.post(
            "/api/chat/assistant",
            json={"message": q_text, "locale": "or"},
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "faq"
        assert data["faq_id"] == expected_id
