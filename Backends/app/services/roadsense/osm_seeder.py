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


# Standard Vehicle Profiles for Rural Fleet Viability across NER Terrains
VEHICLE_PROFILES_DATA: List[Dict[str, Any]] = [
    {
        "type": VehicleProfileType.truck,
        "name": "Heavy 16T Commercial Truck (Ashok Leyland / Tata Prima)",
        "max_width": 2.50,
        "clearance_class": ClearanceClass.standard,
        "min_surface_rating": 60.0,
        "unpaved_capable": False,
        "description": "Requires two-lane paved/asphalt arterial highways (NH-27). Strict width >= 3.5m and surface rating >= 60.",
    },
    {
        "type": VehicleProfileType.mini_truck,
        "name": "Tata Ace / Mini-Truck",
        "max_width": 1.85,
        "clearance_class": ClearanceClass.standard,
        "min_surface_rating": 45.0,
        "unpaved_capable": True,
        "description": "Highly maneuverable rural workhorse. Capable of single-lane paved and compacted gravel roads in valleys.",
    },
    {
        "type": VehicleProfileType.tractor,
        "name": "Mahindra / Swaraj Agro Farm Tractor Trailer",
        "max_width": 2.20,
        "clearance_class": ClearanceClass.ultra_high,
        "min_surface_rating": 20.0,
        "unpaved_capable": True,
        "description": "Ultra-high ground clearance and high-torque traction. Ideal for mud, monsoon waterlogging, and broken dirt tracks.",
    },
    {
        "type": VehicleProfileType.two_wheeler,
        "name": "Heavy-Duty Mountain Cargo Bike / E-Bike Carrier",
        "max_width": 0.85,
        "clearance_class": ClearanceClass.high,
        "min_surface_rating": 30.0,
        "unpaved_capable": True,
        "description": "Narrow profile can navigate high mountain passes, single-track hill paths, and narrow rope bridges.",
    },
]


# Authentic OSM / PMGSY Road Segments across North Eastern Region (NER)
OSM_NER_SEGMENTS_DATA: List[Dict[str, Any]] = [
    {
        "name": "Guwahati–Shillong GS Expressway Link (NH-106)",
        "osm_way_id": "way/498217301",
        "geometry": [
            [91.7450, 26.1820],
            [91.7820, 26.0500],
            [91.8200, 25.8500],
            [91.8933, 25.5788],
        ],
        "length_km": 98.5,
        "width_class": RoadWidthClass.two_lane,
        "surface_type": RoadSurfaceType.asphalt,
        "static_base_score": 92.0,
        "current_status": RoadSegmentStatus.clear,
        "block_name": "Guwahati-Shillong-Corridor",
    },
    {
        "name": "Dimapur–Kohima Mountain Highway (NH-29 Ghats)",
        "osm_way_id": "way/719283014",
        "geometry": [
            [93.7270, 25.9060],
            [93.8500, 25.8200],
            [93.9800, 25.7500],
            [94.1086, 25.6751],
        ],
        "length_km": 74.0,
        "width_class": RoadWidthClass.intermediate,
        "surface_type": RoadSurfaceType.paved,
        "static_base_score": 68.0,
        "current_status": RoadSegmentStatus.difficult,
        "block_name": "Kohima-Dimapur-Ghats",
    },
    {
        "name": "Naharlagun–Tawang High-Pass Mountain Highway (NH-13)",
        "osm_way_id": "way/602819441",
        "geometry": [
            [93.6920, 27.1050],
            [92.8500, 27.3500],
            [92.2000, 27.5000],
            [91.8653, 27.5861],
        ],
        "length_km": 185.0,
        "width_class": RoadWidthClass.single_lane,
        "surface_type": RoadSurfaceType.gravel,
        "static_base_score": 52.0,
        "current_status": RoadSegmentStatus.difficult,
        "block_name": "Tawang-Himalayan-Pass",
    },
    {
        "name": "Ziro Valley PMGSY Organic Agri Link Road",
        "osm_way_id": "way/381902155",
        "geometry": [
            [93.8350, 27.5950],
            [93.8100, 27.5600],
            [93.7800, 27.5200],
        ],
        "length_km": 12.4,
        "width_class": RoadWidthClass.single_lane,
        "surface_type": RoadSurfaceType.paved,
        "static_base_score": 75.0,
        "current_status": RoadSegmentStatus.clear,
        "block_name": "Ziro-Valley",
    },
    {
        "name": "Silchar–Imphal National Corridor (NH-37 Hill Pass)",
        "osm_way_id": "way/552918029",
        "geometry": [
            [92.7789, 24.8333],
            [93.2000, 24.8100],
            [93.6500, 24.8150],
            [93.9368, 24.8170],
        ],
        "length_km": 135.0,
        "width_class": RoadWidthClass.intermediate,
        "surface_type": RoadSurfaceType.paved,
        "static_base_score": 64.0,
        "current_status": RoadSegmentStatus.difficult,
        "block_name": "Barak-Imphal-Pass",
    },
    {
        "name": "Guwahati NH-27 East-West Arterial Expressway",
        "osm_way_id": "way/672190342",
        "geometry": [
            [91.6850, 26.1780],
            [91.7450, 26.1820],
            [91.9500, 26.2000],
            [92.7926, 26.6338],
        ],
        "length_km": 115.0,
        "width_class": RoadWidthClass.two_lane,
        "surface_type": RoadSurfaceType.asphalt,
        "static_base_score": 95.0,
        "current_status": RoadSegmentStatus.clear,
        "block_name": "Brahmaputra-Expressway",
    },
    {
        "name": "Shillong–Cherrapunji (Sohra) Cloud Corridor",
        "osm_way_id": "way/901238411",
        "geometry": [
            [91.8933, 25.5788],
            [91.8200, 25.4200],
            [91.7300, 25.2700],
        ],
        "length_km": 54.0,
        "width_class": RoadWidthClass.intermediate,
        "surface_type": RoadSurfaceType.asphalt,
        "static_base_score": 82.0,
        "current_status": RoadSegmentStatus.clear,
        "block_name": "Khasi-Highlands",
    },
    {
        "name": "Majuli Riverine Island Flood Approach Track",
        "osm_way_id": "way/512903812",
        "geometry": [
            [94.2037, 26.7509],
            [94.2100, 26.8500],
            [94.2167, 26.9500],
        ],
        "length_km": 28.5,
        "width_class": RoadWidthClass.narrow_track,
        "surface_type": RoadSurfaceType.unpaved,
        "static_base_score": 40.0,
        "current_status": RoadSegmentStatus.difficult,
        "block_name": "Majuli-Island",
    },
]


async def seed_roadsense_data(session: AsyncSession) -> Dict[str, Any]:
    """Seed standard Vehicle Profiles, PMGSY/OSM Rural NER Road Segments,
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

    # 2. Seed OSM NER Segments
    segments_map = {}
    for s_data in OSM_NER_SEGMENTS_DATA:
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

    # 3. Seed Realistic Crowdsourced RoadReports from NER drivers
    mock_reports_data = [
        # Report 1: Monsoon landslide on Dimapur-Kohima Ghats (35 mins ago)
        {
            "osm_way_id": "way/719283014",
            "reporter_id": "driver-ner-401 (Mahindra Bolero 4x4)",
            "status": RoadSegmentStatus.blocked,
            "note": "Landslide debris near Paglapahar on NH-29; road blocked for heavy vehicles. 4x4 Bolero can detour via bypass.",
            "reported_at": now - timedelta(minutes=35),
        },
        # Report 2: Difficult report on NH-29 (28 hours ago)
        {
            "osm_way_id": "way/719283014",
            "reporter_id": "driver-ner-208 (Agro Tractor)",
            "status": RoadSegmentStatus.difficult,
            "note": "Mud accumulation and falling rocks; cautious crawl speed advised.",
            "reported_at": now - timedelta(hours=28),
        },
        # Report 3: High snow & slush on Tawang Himalayan Pass (2.5 hours ago)
        {
            "osm_way_id": "way/602819441",
            "reporter_id": "driver-ner-115 (Tata Ace)",
            "status": RoadSegmentStatus.difficult,
            "note": "Sela Pass stretch slushy with gravel washouts. Snow chains recommended above 2400m.",
            "reported_at": now - timedelta(hours=2, minutes=30),
        },
        # Report 4: Difficult report on Silchar-Imphal Pass (4 hours ago)
        {
            "osm_way_id": "way/552918029",
            "reporter_id": "field-agent-shillong",
            "status": RoadSegmentStatus.difficult,
            "note": "Single-lane bottleneck due to culvert repair near Nungba. Minor 20-min delay.",
            "reported_at": now - timedelta(hours=4),
        },
        # Report 5: Difficult report on Majuli Island Access (1.5 hours ago)
        {
            "osm_way_id": "way/512903812",
            "reporter_id": "driver-ner-302 (Mountain Cargo Bike)",
            "status": RoadSegmentStatus.difficult,
            "note": "Brahmaputra water level high at ghat approach ramp. Tractor & cargo bike crossing operational.",
            "reported_at": now - timedelta(hours=1, minutes=30),
        },
        # Report 6: Clear report on Guwahati-Shillong Expressway (1 hour ago)
        {
            "osm_way_id": "way/498217301",
            "reporter_id": "driver-ner-104 (Ashok Leyland 16T)",
            "status": RoadSegmentStatus.clear,
            "note": "Four-lane highway clear, excellent asphalt grip, normal 50 km/h hill climbing speeds.",
            "reported_at": now - timedelta(hours=1),
        },
        # Report 7: Clear report on Shillong-Cherrapunji Cloud Corridor (3 hours ago)
        {
            "osm_way_id": "way/901238411",
            "reporter_id": "driver-ner-221 (Solar Reefer)",
            "status": RoadSegmentStatus.clear,
            "note": "Paved tourist/freight road clear with good visibility up to Sohra depot.",
            "reported_at": now - timedelta(hours=3),
        },
        # Report 8: Clear report on NH-27 East-West Expressway (5 hours ago)
        {
            "osm_way_id": "way/672190342",
            "reporter_id": "driver-ner-509 (Milk Tanker)",
            "status": RoadSegmentStatus.clear,
            "note": "Smooth asphalt transit corridor, zero blockages between Guwahati and Tezpur.",
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

            # Update segment latest status and timestamp
            if not seg.last_report_at or r_data["reported_at"] > seg.last_report_at:
                seg.current_status = r_data["status"]
                seg.last_report_at = r_data["reported_at"]

    await session.commit()

    return {
        "vehicle_profiles_count": len(profiles_map),
        "segments_count": len(segments_map),
        "reports_count": len(seeded_reports),
    }
