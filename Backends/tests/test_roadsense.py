import pytest
import uuid
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.roadsense import (
    RoadSegment,
    RoadReport,
    VehicleProfile,
    RoadSegmentStatus,
    RoadSurfaceType,
    RoadWidthClass,
    VehicleProfileType,
)
from app.services.roadsense.osm_seeder import seed_roadsense_data
from app.repositories.roadsense_repository import RoadSenseRepository


@pytest.mark.asyncio
async def test_roadsense_seed_and_query_segment_by_id(client: AsyncClient, db_session: AsyncSession):
    # 1. Seed database with OSM Odisha data
    seed_stats = await seed_roadsense_data(db_session)
    assert seed_stats["segments_count"] == 10
    assert seed_stats["reports_count"] >= 8
    assert seed_stats["vehicle_profiles_count"] == 4

    # 2. List all segments
    list_res = await client.get("/api/roadsense/segments")
    assert list_res.status_code == 200
    segments = list_res.json()
    assert len(segments) == 10

    # Pick the Kushabhadra causeway segment which has reports
    causeway = next(s for s in segments if s["osm_way_id"] == "way/719283014")
    assert causeway["name"] == "Kushabhadra River Causeway & Feeder Track"
    assert causeway["surface_type"] == "dirt"
    assert causeway["width_class"] == "narrow_track"
    assert causeway["static_base_score"] == 25.0
    assert causeway["current_status"] == "blocked"

    # 3. Query segment by ID (DoD requirement: query segment by ID and get back static score and report history)
    seg_id = causeway["id"]
    detail_res = await client.get(f"/api/roadsense/segments/{seg_id}")
    assert detail_res.status_code == 200
    data = detail_res.json()

    assert data["id"] == seg_id
    assert data["static_base_score"] == 25.0
    assert data["length_km"] == 3.1
    assert data["geometry"] is not None
    assert len(data["geometry"]) >= 3
    assert len(data["reports"]) >= 2
    # Reports should be ordered latest first
    assert "submerged under 2.5ft floodwater" in data["reports"][0]["note"]
    assert data["reports"][0]["status"] == "blocked"


@pytest.mark.asyncio
async def test_roadsense_submit_report_and_update_status(client: AsyncClient, db_session: AsyncSession):
    # 1. Create a clean segment
    repo = RoadSenseRepository(db_session)
    seg = await repo.create_segment(
        name="Puri-Konark Marine Coastal Road",
        osm_way_id="way/990011223",
        geometry=[[85.83, 19.81], [85.95, 19.85], [86.08, 19.89]],
        length_km=22.5,
        width_class=RoadWidthClass.two_lane,
        surface_type=RoadSurfaceType.asphalt,
        static_base_score=90.0,
        current_status=RoadSegmentStatus.clear,
        block_name="Puri-Coastal",
    )
    seg_id = str(seg.id)

    # 2. Check initial segment status
    seg_res = await client.get(f"/api/roadsense/segments/{seg_id}")
    assert seg_res.status_code == 200
    assert seg_res.json()["current_status"] == "clear"
    assert len(seg_res.json()["reports"]) == 0

    # 3. Driver submits a 'difficult' report
    report_payload = {
        "segment_id": seg_id,
        "reporter_id": "driver-odisha-77",
        "status": "difficult",
        "note": "Sand drift and localized water accumulation on shoulder",
    }
    rep_res = await client.post("/api/roadsense/reports", json=report_payload)
    assert rep_res.status_code == 201
    rep_data = rep_res.json()
    assert rep_data["status"] == "difficult"
    assert rep_data["note"] == "Sand drift and localized water accumulation on shoulder"

    # 4. Verify segment's live status updated immediately
    seg_updated = await client.get(f"/api/roadsense/segments/{seg_id}")
    assert seg_updated.status_code == 200
    updated_data = seg_updated.json()
    assert updated_data["current_status"] == "difficult"
    assert len(updated_data["reports"]) == 1
    assert updated_data["reports"][0]["reporter_id"] == "driver-odisha-77"


@pytest.mark.asyncio
async def test_roadsense_vehicle_profiles_api(client: AsyncClient, db_session: AsyncSession):
    # Seed vehicle profiles
    await seed_roadsense_data(db_session)

    res = await client.get("/api/roadsense/vehicle-profiles")
    assert res.status_code == 200
    profiles = res.json()
    assert len(profiles) == 4

    types = {p["type"] for p in profiles}
    assert types == {"truck", "mini_truck", "tractor", "two_wheeler"}

    truck = next(p for p in profiles if p["type"] == "truck")
    assert truck["max_width"] == 2.50
    assert truck["unpaved_capable"] is False

    tractor = next(p for p in profiles if p["type"] == "tractor")
    assert tractor["clearance_class"] == "ultra_high"
    assert tractor["min_surface_rating"] == 20.0


@pytest.mark.asyncio
async def test_roadsense_scoring_service_and_dod(client: AsyncClient, db_session: AsyncSession):
    # 1. Seed OSM Odisha data & reports
    await seed_roadsense_data(db_session)
    repo = RoadSenseRepository(db_session)

    # Fetch 3 distinct test segments:
    # A. Smooth State Highway Link (OD-SH-60)
    highway = await repo.get_segment_by_osm_id("way/498217301")
    assert highway is not None

    # B. Kushabhadra Causeway (Narrow dirt track with fresh blocked flood report)
    causeway = await repo.get_segment_by_osm_id("way/719283014")
    assert causeway is not None

    # C. Balipatna Canal Road (Unpaved single lane with difficult report)
    canal_road = await repo.get_segment_by_osm_id("way/381902155")
    assert canal_road is not None

    # 2. Test Scoring for Highway Link (Smooth asphalt two-lane)
    score_highway_truck = await client.get(
        f"/api/roadsense/score?segment_id={highway.id}&vehicle_type=truck"
    )
    assert score_highway_truck.status_code == 200
    data_ht = score_highway_truck.json()
    assert data_ht["score"] >= 85.0
    assert data_ht["status_emoji"] == "🟢"
    assert data_ht["recommended"] is True
    assert len(data_ht["breakdown"]) >= 2
    assert any("verified viable" in b for b in data_ht["breakdown"])

    # 3. Test Scoring for Submerged Causeway:
    # - Truck: should be hard-flagged NOT RECOMMENDED (width violation + unpaved violation + submerged)
    score_causeway_truck = await client.get(
        f"/api/roadsense/score?segment_id={causeway.id}&vehicle_type=truck"
    )
    assert score_causeway_truck.status_code == 200
    data_ct = score_causeway_truck.json()
    assert data_ct["score"] <= 25.0
    assert data_ct["status_emoji"] == "🔴"
    assert data_ct["recommended"] is False
    assert any("NOT RECOMMENDED" in b for b in data_ct["breakdown"])
    assert any("submerged" in b or "floodwater" in b for b in data_ct["breakdown"])

    # 4. Test Vehicle Differentiation on Unpaved Canal Road:
    # - Truck: unpaved surface & single lane -> NOT RECOMMENDED
    score_canal_truck = await client.get(
        f"/api/roadsense/score?segment_id={canal_road.id}&vehicle_type=truck"
    )
    assert score_canal_truck.status_code == 200
    data_cart = score_canal_truck.json()
    assert data_cart["recommended"] is False
    assert data_cart["status_emoji"] in ["🔴", "🟡"]

    # - Tractor: high-clearance & unpaved capable -> RECOMMENDED with high-traction bonus
    score_canal_tractor = await client.get(
        f"/api/roadsense/score?segment_id={canal_road.id}&vehicle_type=tractor"
    )
    assert score_canal_tractor.status_code == 200
    data_catr = score_canal_tractor.json()
    assert data_catr["recommended"] is True
    assert data_catr["score"] > data_cart["score"]
    assert any("Agro Tractor high-traction torque" in b for b in data_catr["breakdown"])


@pytest.mark.asyncio
async def test_roadsense_time_decay_behavior(db_session: AsyncSession):
    from app.services.roadsense.scorer import RoadSenseScorer

    now = datetime.now(timezone.utc)
    seg = RoadSegment(
        id=uuid.uuid4(),
        name="Test Corridor Segment",
        osm_way_id="way/test-decay",
        length_km=5.0,
        width_class=RoadWidthClass.intermediate,
        surface_type=RoadSurfaceType.paved,
        static_base_score=80.0,
        current_status=RoadSegmentStatus.difficult,
    )

    # 1. Fresh report (30 mins ago) -> high penalty impact
    rep_fresh = RoadReport(
        id=uuid.uuid4(),
        segment_id=seg.id,
        reporter_id="driver-1",
        status=RoadSegmentStatus.difficult,
        note="Obstruction on road",
        reported_at=now - timedelta(minutes=30),
        synced_at=now,
    )
    seg.reports = [rep_fresh]
    res_fresh = RoadSenseScorer.calculate_roadability(seg, "mini_truck", current_time=now)
    assert res_fresh.recency_penalty < -30.0  # High penalty

    # 2. Older report (36 hours ago ~ 2 half-lives) -> decayed penalty
    rep_old = RoadReport(
        id=uuid.uuid4(),
        segment_id=seg.id,
        reporter_id="driver-1",
        status=RoadSegmentStatus.difficult,
        note="Obstruction on road",
        reported_at=now - timedelta(hours=36),
        synced_at=now,
    )
    seg.reports = [rep_old]
    res_old = RoadSenseScorer.calculate_roadability(seg, "mini_truck", current_time=now)
    assert res_old.recency_penalty > res_fresh.recency_penalty  # Penalty decayed towards 0
    assert -15.0 < res_old.recency_penalty < -5.0

    # 3. Very old report (> 72 hours) -> decayed completely
    rep_expired = RoadReport(
        id=uuid.uuid4(),
        segment_id=seg.id,
        reporter_id="driver-1",
        status=RoadSegmentStatus.difficult,
        note="Old resolved issue",
        reported_at=now - timedelta(hours=80),
        synced_at=now,
    )
    seg.reports = [rep_expired]
    res_expired = RoadSenseScorer.calculate_roadability(seg, "mini_truck", current_time=now)
    assert res_expired.recency_penalty == 0.0  # Decayed to 0
    assert res_expired.score == seg.static_base_score  # Returned to static base score


@pytest.mark.asyncio
async def test_roadsense_dispatch_integration_dod(
    client: AsyncClient, db_session: AsyncSession, sample_tenant, sample_hubs_and_routes
):
    from app.core.auth import create_access_token
    token = create_access_token({"tenant_id": str(sample_tenant.id), "role": "shipper"})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Seed RoadSense segments
    await seed_roadsense_data(db_session)

    # 2. Create available vehicle
    await client.post(
        "/api/vehicles",
        json={
            "name": "Pipili Cold Express Tempo",
            "type": "mini_truck",
            "capacity_kg": 1500.0,
            "capacity_cbm": 6.0,
            "temp_control": True,
            "owner_type": "cooperative",
            "availability_status": "available",
        },
    )

    # 3. Create pending rural shipment from Pipili
    shipment_payload = {
        "origin_hub_id": str(sample_hubs_and_routes["h1"].id),
        "dest_hub_id": str(sample_hubs_and_routes["h2"].id),
        "good_type": "farm_produce",
        "urgency": "high",
        "producer_id": "pipili-agro",
        "producer_name": "Pipili Floriculture SHG",
        "community_id": "comm-pipili",
        "weight_kg": 250.0,
        "volume_cbm": 1.2,
        "temp_class": "chilled",
        "sla_deadline": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
    }
    ship_res = await client.post("/api/shipments", json=shipment_payload, headers=headers)
    assert ship_res.status_code == 201

    # 4. Trigger dynamic dispatch matching
    match_res = await client.post("/api/dispatch/match", json={}, headers=headers)
    assert match_res.status_code == 200
    data = match_res.json()
    assert data["status"] == "success"
    assert data["matched_count"] >= 1

    match = data["matches"][0]
    # Verify DoD: dispatch output includes a roadability score and per-vehicle recommendation for each leg
    assert "roadability_score" in match
    assert match["roadability_score"] >= 0.0
    assert "roadability_emoji" in match
    assert match["roadability_emoji"] in ["🟢", "🟡", "🔴"]
    assert "road_breakdown" in match
    assert len(match["road_breakdown"]) >= 1
    assert "vehicle_recommendations" in match

    recs = match["vehicle_recommendations"]
    assert "truck" in recs
    assert "mini_truck" in recs
    assert "tractor" in recs
    assert "two_wheeler" in recs
    assert isinstance(recs["truck"]["recommended"], bool)
    assert isinstance(recs["tractor"]["recommended"], bool)
    assert any("RoadSense:" in r for r in match["reasons"])
