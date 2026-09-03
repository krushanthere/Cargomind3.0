import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.roadsense import (
    RoadSegment,
    RoadReport,
    VehicleProfile,
    RoadSegmentStatus,
    RoadSurfaceType,
    RoadWidthClass,
    VehicleProfileType,
    ClearanceClass,
)


# Standard Vehicle Profiles for Rural Fleet Viability
VEHICLE_PROFILES_DATA: List[Dict[str, Any]] = [
    {
        "type": VehicleProfileType.truck,
        "name": "Heavy 16T Commercial Truck (Eicher Pro / Tata Signa)",
        "max_width": 2.50,
        "clearance_class": ClearanceClass.standard,
        "min_surface_rating": 60.0,
        "unpaved_capable": False,
        "description": "Requires two-lane paved/asphalt roads. Strict width >= 3.5m and surface rating >= 60.",
    },
    {
        "type": VehicleProfileType.mini_truck,
        "name": "Tata Ace / Mini-Truck",
        "max_width": 1.85,
        "clearance_class": ClearanceClass.standard,
        "min_surface_rating": 45.0,
        "unpaved_capable": True,
        "description": "Highly maneuverable rural workhorse. Capable of single-lane paved and compacted gravel roads.",
    },
    {
        "type": VehicleProfileType.tractor,
        "name": "Mahindra / Swaraj Agro Farm Tractor Trailer",
        "max_width": 2.20,
        "clearance_class": ClearanceClass.ultra_high,
        "min_surface_rating": 20.0,
        "unpaved_capable": True,
        "description": "Ultra-high ground clearance and high-torque traction. Ideal for mud, waterlogged, and broken dirt tracks.",
    },
    {
        "type": VehicleProfileType.two_wheeler,
        "name": "Heavy-Duty Cargo Motorbike / E-Bike Carrier",
        "max_width": 0.85,
        "clearance_class": ClearanceClass.high,
        "min_surface_rating": 30.0,
        "unpaved_capable": True,
        "description": "Narrow profile can bypass tight bottlenecks, footpaths, and narrow culvert passages.",
    },
]


# Authentic OSM Overpass Road Segments (Pipili-Nimapada-Gop Rural Block, Odisha)
OSM_ODISHA_SEGMENTS_DATA: List[Dict[str, Any]] = [
    {
        "name": "Pipili–Nimapada State Highway Link (OD-SH-60)",
        "osm_way_id": "way/498217301",
        "geometry": [
            [85.8344, 20.1147],
            [85.8750, 20.1080],
            [85.9250, 20.0990],
            [85.9750, 20.0920],
            [86.0120, 20.0890],
        ],
        "length_km": 14.5,
        "width_class": RoadWidthClass.two_lane,
        "surface_type": RoadSurfaceType.asphalt,
        "static_base_score": 95.0,
        "current_status": RoadSegmentStatus.clear,
        "block_name": "Pipili-Nimapada",
    },
    {
        "name": "Pipili–Delanga Rural Connecting Road",
        "osm_way_id": "way/512903812",
        "geometry": [
            [85.8344, 20.1147],
            [85.8100, 20.0900],
            [85.7850, 20.0650],
            [85.7600, 20.0450],
        ],
        "length_km": 8.2,
        "width_class": RoadWidthClass.intermediate,
        "surface_type": RoadSurfaceType.paved,
        "static_base_score": 80.0,
        "current_status": RoadSegmentStatus.clear,
        "block_name": "Pipili-Nimapada",
    },
    {
        "name": "Nimapada–Gop Agro Corridor (OD-SH-13)",
        "osm_way_id": "way/602819441",
        "geometry": [
            [86.0120, 20.0890],
            [86.0100, 20.0550],
            [86.0080, 20.0250],
            [86.0050, 19.9980],
        ],
        "length_km": 12.0,
        "width_class": RoadWidthClass.intermediate,
        "surface_type": RoadSurfaceType.paved,
        "static_base_score": 78.0,
        "current_status": RoadSegmentStatus.difficult,
        "block_name": "Nimapada-Gop",
    },
    {
        "name": "Balipatna Canal Embankment Road",
        "osm_way_id": "way/381902155",
        "geometry": [
            [85.9200, 20.1800],
            [85.9320, 20.1650],
            [85.9450, 20.1550],
            [85.9550, 20.1450],
        ],
        "length_km": 5.4,
        "width_class": RoadWidthClass.single_lane,
        "surface_type": RoadSurfaceType.unpaved,
        "static_base_score": 48.0,
        "current_status": RoadSegmentStatus.difficult,
        "block_name": "Pipili-Nimapada",
    },
    {
        "name": "Kushabhadra River Causeway & Feeder Track",
        "osm_way_id": "way/719283014",
        "geometry": [
            [85.8850, 20.0950],
            [85.8920, 20.0880],
            [85.9050, 20.0800],
        ],
        "length_km": 3.1,
        "width_class": RoadWidthClass.narrow_track,
        "surface_type": RoadSurfaceType.dirt,
        "static_base_score": 25.0,
        "current_status": RoadSegmentStatus.blocked,
        "block_name": "Pipili-Nimapada",
    },
    {
        "name": "Nimapada Cold Hub–Village C Agri Access Road",
        "osm_way_id": "way/882194012",
        "geometry": [
            [86.0200, 20.0950],
            [86.0280, 20.1020],
            [86.0350, 20.1100],
        ],
        "length_km": 2.8,
        "width_class": RoadWidthClass.single_lane,
        "surface_type": RoadSurfaceType.concrete,
        "static_base_score": 68.0,
        "current_status": RoadSegmentStatus.clear,
        "block_name": "Nimapada-Gop",
    },
    {
        "name": "Delanga Station–Paddy Aggregation Feeder",
        "osm_way_id": "way/441920381",
        "geometry": [
            [85.7650, 20.0500],
            [85.7780, 20.0620],
            [85.7900, 20.0750],
        ],
        "length_km": 4.6,
        "width_class": RoadWidthClass.single_lane,
        "surface_type": RoadSurfaceType.gravel,
        "static_base_score": 52.0,
        "current_status": RoadSegmentStatus.clear,
        "block_name": "Pipili-Nimapada",
    },
    {
        "name": "Village A Floriculture Cluster Link Road",
        "osm_way_id": "way/901238411",
        "geometry": [
            [85.8350, 20.1180],
            [85.8420, 20.1250],
            [85.8500, 20.1350],
        ],
        "length_km": 3.5,
        "width_class": RoadWidthClass.intermediate,
        "surface_type": RoadSurfaceType.asphalt,
        "static_base_score": 85.0,
        "current_status": RoadSegmentStatus.clear,
        "block_name": "Pipili-Nimapada",
    },
    {
        "name": "Khordha Dairy Cluster Access Arterial",
        "osm_way_id": "way/672190342",
        "geometry": [
            [85.6200, 20.1800],
            [85.6420, 20.1720],
            [85.6650, 20.1650],
        ],
        "length_km": 7.2,
        "width_class": RoadWidthClass.two_lane,
        "surface_type": RoadSurfaceType.asphalt,
        "static_base_score": 92.0,
        "current_status": RoadSegmentStatus.clear,
        "block_name": "Khordha-Rural",
    },
    {
        "name": "Banki Mahanadi Riverine Ghat Approach",
        "osm_way_id": "way/552918029",
        "geometry": [
            [85.5300, 20.3700],
            [85.5420, 20.3620],
            [85.5550, 20.3550],
        ],
        "length_km": 3.8,
        "width_class": RoadWidthClass.narrow_track,
        "surface_type": RoadSurfaceType.unpaved,
        "static_base_score": 35.0,
        "current_status": RoadSegmentStatus.difficult,
        "block_name": "Mahanadi-Basin",
    },
]


async def seed_roadsense_data(session: AsyncSession) -> Dict[str, Any]:
    """Seed standard Vehicle Profiles, OSM Rural Odisha Road Segments,
    and realistic crowdsourced RoadReports.
    """
    now = datetime.now(timezone.utc)

    # 1. Seed Vehicle Profiles
    profiles_map = {}
    for p_data in VEHICLE_PROFILES_DATA:
        existing = await session.execute(
            select(VehicleProfile).where(VehicleProfile.type == p_data["type"])
        )
        profile = existing.scalar_one_or_none()
        if not profile:
            profile = VehicleProfile(
                id=uuid.uuid4(),
                type=p_data["type"],
                name=p_data["name"],
                max_width=p_data["max_width"],
                clearance_class=p_data["clearance_class"],
                min_surface_rating=p_data["min_surface_rating"],
                unpaved_capable=p_data["unpaved_capable"],
                description=p_data["description"],
            )
            session.add(profile)
        profiles_map[p_data["type"]] = profile

    await session.flush()

    # 2. Seed OSM Odisha Segments
    segments_map = {}
    for s_data in OSM_ODISHA_SEGMENTS_DATA:
        existing = await session.execute(
            select(RoadSegment).where(RoadSegment.osm_way_id == s_data["osm_way_id"])
        )
        segment = existing.scalar_one_or_none()
        if not segment:
            segment = RoadSegment(
                id=uuid.uuid4(),
                name=s_data["name"],
                osm_way_id=s_data["osm_way_id"],
                geometry=s_data["geometry"],
                length_km=s_data["length_km"],
                width_class=s_data["width_class"],
                surface_type=s_data["surface_type"],
                static_base_score=s_data["static_base_score"],
                current_status=s_data["current_status"],
                block_name=s_data["block_name"],
                created_at=now,
                updated_at=now,
            )
            session.add(segment)
        segments_map[s_data["osm_way_id"]] = segment

    await session.flush()

    # 3. Seed Realistic Mock Crowdsourced RoadReports
    mock_reports_data = [
        # Report 1: Recent blocked report on Kushabhadra Causeway (35 mins ago)
        {
            "osm_way_id": "way/719283014",
            "reporter_id": "driver-odisha-401 (Mahindra Camper)",
            "status": RoadSegmentStatus.blocked,
            "note": "Kushabhadra causeway submerged under 2.5ft floodwater after flash rain — impassable for 4-wheelers.",
            "reported_at": now - timedelta(minutes=35),
        },
        # Report 2: Older report on Kushabhadra Causeway (28 hours ago)
        {
            "osm_way_id": "way/719283014",
            "reporter_id": "driver-odisha-208 (Agro Tractor)",
            "status": RoadSegmentStatus.difficult,
            "note": "High water levels on causeway; tractor crossed with caution.",
            "reported_at": now - timedelta(hours=28),
        },
        # Report 3: Difficult report on Nimapada-Gop Agro Corridor (2.5 hours ago)
        {
            "osm_way_id": "way/602819441",
            "reporter_id": "driver-odisha-115 (Tata Ace)",
            "status": RoadSegmentStatus.difficult,
            "note": "Severe potholes and waterlogged gravel patch near km 5. Slow movement required.",
            "reported_at": now - timedelta(hours=2, minutes=30),
        },
        # Report 4: Difficult report on Balipatna Canal Road (4 hours ago)
        {
            "osm_way_id": "way/381902155",
            "reporter_id": "field-agent-pipili",
            "status": RoadSegmentStatus.difficult,
            "note": "Loose silt and heavy ruts along canal embankment. Narrow passing points.",
            "reported_at": now - timedelta(hours=4),
        },
        # Report 5: Difficult report on Banki Riverine Approach (1.5 hours ago)
        {
            "osm_way_id": "way/552918029",
            "reporter_id": "driver-odisha-302 (Cargo Bike)",
            "status": RoadSegmentStatus.difficult,
            "note": "Mud accumulation along riverbank approach after morning high tide.",
            "reported_at": now - timedelta(hours=1, minutes=30),
        },
        # Report 6: Clear report on Pipili-Nimapada State Highway (1 hour ago)
        {
            "osm_way_id": "way/498217301",
            "reporter_id": "driver-odisha-104 (Eicher Truck)",
            "status": RoadSegmentStatus.clear,
            "note": "Highway corridor clear, smooth asphalt surface, normal transit speeds.",
            "reported_at": now - timedelta(hours=1),
        },
        # Report 7: Clear report on Village A Floriculture Link (3 hours ago)
        {
            "osm_way_id": "way/901238411",
            "reporter_id": "driver-odisha-221 (Solar Reefer Tempo)",
            "status": RoadSegmentStatus.clear,
            "note": "Paved link road clear all the way to Village A aggregation dock.",
            "reported_at": now - timedelta(hours=3),
        },
        # Report 8: Clear report on Khordha Dairy Arterial (5 hours ago)
        {
            "osm_way_id": "way/672190342",
            "reporter_id": "driver-odisha-509 (Milk Tanker)",
            "status": RoadSegmentStatus.clear,
            "note": "Express asphalt route fully operational with zero blockages.",
            "reported_at": now - timedelta(hours=5),
        },
    ]

    seeded_reports = []
    for r_data in mock_reports_data:
        seg = segments_map.get(r_data["osm_way_id"])
        if seg:
            report = RoadReport(
                id=uuid.uuid4(),
                segment_id=seg.id,
                reporter_id=r_data["reporter_id"],
                status=r_data["status"],
                note=r_data["note"],
                reported_at=r_data["reported_at"],
                synced_at=now,
            )
            session.add(report)
            seeded_reports.append(report)

            # Update segment latest status and timestamp if it's the most recent report
            if not seg.last_report_at or r_data["reported_at"] > seg.last_report_at:
                seg.current_status = r_data["status"]
                seg.last_report_at = r_data["reported_at"]

    await session.commit()

    return {
        "vehicle_profiles_count": len(profiles_map),
        "segments_count": len(segments_map),
        "reports_count": len(seeded_reports),
    }
