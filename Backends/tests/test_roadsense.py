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
    # 1. Seed database with PMGSY/OSM NER data
    seed_stats = await seed_roadsense_data(db_session)
    assert seed_stats["segments_count"] == 8
    assert seed_stats["reports_count"] >= 8
    assert seed_stats["vehicle_profiles_count"] == 4

    # 2. List all segments
    list_res = await client.get("/api/roadsense/segments")
    assert list_res.status_code == 200
    segments = list_res.json()
    assert len(segments) == 8

    # Pick the Dimapur-Kohima Ghats segment which has reports
    ghat_seg = next(s for s in segments if s["osm_way_id"] == "way/719283014")
    assert ghat_seg["name"] == "Dimapur–Kohima Mountain Highway (NH-29 Ghats)"
    assert ghat_seg["surface_type"] == "paved"
    assert ghat_seg["width_class"] == "intermediate"
    assert ghat_seg["static_base_score"] == 68.0
    assert ghat_seg["current_status"] == "blocked"

    # 3. Query segment by ID
    seg_id = ghat_seg["id"]
    detail_res = await client.get(f"/api/roadsense/segments/{seg_id}")
    assert detail_res.status_code == 200
    data = detail_res.json()

    assert data["id"] == seg_id
    assert data["static_base_score"] == 68.0
    assert data["length_km"] == 74.0
    assert data["geometry"] is not None
    assert len(data["geometry"]) >= 3
    assert len(data["reports"]) >= 2
    # Reports should be ordered latest first
    assert "Landslide debris near Paglapahar" in data["reports"][0]["note"]
    assert data["reports"][0]["status"] == "blocked"


@pytest.mark.asyncio
async def test_roadsense_submit_report_and_update_status(client: AsyncClient, db_session: AsyncSession):
    # 1. Create a clean segment
    repo = RoadSenseRepository(db_session)
    seg = await repo.create_segment(
        name="Guwahati Airport Arterial Bypass",
        osm_way_id="way/990011223",
        geometry=[[91.58, 26.11], [91.65, 26.13], [91.74, 26.18]],
        length_km=18.5,
        width_class=RoadWidthClass.two_lane,
        surface_type=RoadSurfaceType.asphalt,
        static_base_score=92.0,
        current_status=RoadSegmentStatus.clear,
        block_name="Kamrup-Metro",
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
        "reporter_id": "driver-ner-77",
        "status": "difficult",
        "note": "Localized water accumulation on shoulder near Borjhar",
    }
    rep_res = await client.post("/api/roadsense/reports", json=report_payload)
    assert rep_res.status_code == 201
    rep_data = rep_res.json()
    assert rep_data["status"] == "difficult"
    assert rep_data["note"] == "Localized water accumulation on shoulder near Borjhar"

    # 4. Verify segment's live status updated immediately
    seg_updated = await client.get(f"/api/roadsense/segments/{seg_id}")
    assert seg_updated.status_code == 200
    updated_data = seg_updated.json()
    assert updated_data["current_status"] == "difficult"
    assert len(updated_data["reports"]) == 1
    assert updated_data["reports"][0]["reporter_id"] == "driver-ner-77"


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
    # 1. Seed PMGSY/OSM NER data & reports
    await seed_roadsense_data(db_session)
    repo = RoadSenseRepository(db_session)

    # Fetch 3 distinct test segments:
    # A. Smooth GS Expressway Link (NH-106)
    expressway = await repo.get_segment_by_osm_id("way/498217301")
    assert expressway is not None

    # B. Dimapur-Kohima Ghats (Intermediate road with fresh blocked landslide report)
    ghat_seg = await repo.get_segment_by_osm_id("way/719283014")
    assert ghat_seg is not None

    # C. Majuli Island Flood Approach Track (Unpaved single lane with difficult report)
    majuli_track = await repo.get_segment_by_osm_id("way/512903812")
    assert majuli_track is not None

    # 2. Test Scoring for GS Expressway Link (Smooth asphalt two-lane)
    score_exp_truck = await client.get(
        f"/api/roadsense/score?segment_id={expressway.id}&vehicle_type=truck"
    )
    assert score_exp_truck.status_code == 200
    data_ht = score_exp_truck.json()
    assert data_ht["score"] >= 85.0
    assert data_ht["status_emoji"] == "🟢"
    assert data_ht["recommended"] is True
    assert len(data_ht["breakdown"]) >= 2
    assert any("verified viable" in b for b in data_ht["breakdown"])

    # 3. Test Scoring for Landslide Blocked Ghats:
    score_ghat_truck = await client.get(
        f"/api/roadsense/score?segment_id={ghat_seg.id}&vehicle_type=truck"
    )
    assert score_ghat_truck.status_code == 200
    data_ct = score_ghat_truck.json()
    assert data_ct["score"] <= 35.0
    assert data_ct["status_emoji"] == "🔴"
    assert data_ct["recommended"] is False
    assert any("NOT RECOMMENDED" in b for b in data_ct["breakdown"])

    # 4. Test Vehicle Differentiation on Unpaved Majuli Track:
    # - Truck: unpaved surface & narrow track -> NOT RECOMMENDED
    score_majuli_truck = await client.get(
        f"/api/roadsense/score?segment_id={majuli_track.id}&vehicle_type=truck"
    )
    assert score_majuli_truck.status_code == 200
    data_cart = score_majuli_truck.json()
    assert data_cart["recommended"] is False
    assert data_cart["status_emoji"] in ["🔴", "🟡"]

    # - Tractor: high-clearance & unpaved capable -> RECOMMENDED with high-traction bonus
    score_majuli_tractor = await client.get(
        f"/api/roadsense/score?segment_id={majuli_track.id}&vehicle_type=tractor"
    )
    assert score_majuli_tractor.status_code == 200
    data_catr = score_majuli_tractor.json()
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
