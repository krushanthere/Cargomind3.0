import asyncio
import json
import uuid
import os
from datetime import datetime, timezone, timedelta, date
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.core.config import settings
from app.models import (
    Base,
    Tenant,
    TenantType,
    Hub,
    HubType,
    PowerReliability,
    Route,
    RouteHistory,
    TransportMode,
    Shipment,
    TempClass,
    ShipmentStatus,
    GoodType,
    UrgencyLevel,
    TemperatureLog,
    Vehicle,
    VehicleType,
    VehicleOwnerType,
    VehicleAvailability,
    RoadConditionReport,
    RoadConditionType,
    AllocationHistory,
)
from app.services.roadsense.osm_seeder import seed_roadsense_data


# Real Authentic NER Hubs across Assam & Meghalaya and Strategic Gateway Corridor
NER_REAL_HUBS = [
    {
        "key": "ghy_mega",
        "name": "Guwahati Central Multimodal Mega-Hub (GHY)",
        "lat": 26.1820,
        "lon": 91.7450,
        "type": HubType.rail_freight_terminal,
        "power_reliability": PowerReliability.grid,
        "cold_storage_capacity_kg": 75000.0,
        "elevation_m": 54.0,
        "terrain_type": "plains",
        "is_rail_terminal": True,
        "is_active": True,
    },
    {
        "key": "shl_agro",
        "name": "Shillong Hill Agro-Aggregation Node (SHL)",
        "lat": 25.5788,
        "lon": 91.8933,
        "type": HubType.hilly_aggregation_node,
        "power_reliability": PowerReliability.solar,
        "cold_storage_capacity_kg": 25000.0,
        "elevation_m": 1525.0,
        "terrain_type": "hilly",
        "is_rail_terminal": False,
        "is_active": True,
    },
    {
        "key": "pandu_port",
        "name": "Pandu Port NW-2 Multimodal River Terminal",
        "lat": 26.1550,
        "lon": 91.7050,
        "type": HubType.warehouse,
        "power_reliability": PowerReliability.grid,
        "cold_storage_capacity_kg": 40000.0,
        "elevation_m": 50.0,
        "terrain_type": "riverine",
        "is_rail_terminal": True,
        "is_active": True,
    },
    {
        "key": "lumding_rail",
        "name": "Lumding Junction NFR Rail Freight Yard",
        "lat": 25.7500,
        "lon": 93.1700,
        "type": HubType.rail_yard,
        "power_reliability": PowerReliability.grid,
        "cold_storage_capacity_kg": 30000.0,
        "elevation_m": 135.0,
        "terrain_type": "plains",
        "is_rail_terminal": True,
        "is_active": True,
    },
    {
        "key": "silchar_node",
        "name": "Silchar Barak Valley Transit Node (IXS)",
        "lat": 24.8333,
        "lon": 92.7789,
        "type": HubType.aggregation_point,
        "power_reliability": PowerReliability.grid,
        "cold_storage_capacity_kg": 20000.0,
        "elevation_m": 25.0,
        "terrain_type": "plains",
        "is_rail_terminal": True,
        "is_active": True,
    },
    {
        "key": "tura_agro",
        "name": "Tura Garo Hills Agro-Collection Node",
        "lat": 25.5144,
        "lon": 90.2032,
        "type": HubType.hilly_aggregation_node,
        "power_reliability": PowerReliability.solar,
        "cold_storage_capacity_kg": 15000.0,
        "elevation_m": 360.0,
        "terrain_type": "hilly",
        "is_rail_terminal": False,
        "is_active": True,
    },
    {
        "key": "jorhat_agro",
        "name": "Jorhat Upper Assam Agro-Logistics Center",
        "lat": 26.7509,
        "lon": 94.2037,
        "type": HubType.aggregation_point,
        "power_reliability": PowerReliability.grid,
        "cold_storage_capacity_kg": 35000.0,
        "elevation_m": 87.0,
        "terrain_type": "plains",
        "is_rail_terminal": True,
        "is_active": True,
    },
    {
        "key": "dibrugarh_hub",
        "name": "Dibrugarh Multi-Modal Rail-River Node (DBRG)",
        "lat": 27.4728,
        "lon": 94.9120,
        "type": HubType.rail_freight_terminal,
        "power_reliability": PowerReliability.grid,
        "cold_storage_capacity_kg": 45000.0,
        "elevation_m": 108.0,
        "terrain_type": "plains",
        "is_rail_terminal": True,
        "is_active": True,
    },
    {
        "key": "tezpur_node",
        "name": "Tezpur North Bank Agro-Transit Hub",
        "lat": 26.6528,
        "lon": 92.7926,
        "type": HubType.aggregation_point,
        "power_reliability": PowerReliability.grid,
        "cold_storage_capacity_kg": 20000.0,
        "elevation_m": 60.0,
        "terrain_type": "plains",
        "is_rail_terminal": True,
        "is_active": True,
    },
    {
        "key": "cherra_node",
        "name": "Cherrapunji / Sohra Mountain PHC Node",
        "lat": 25.2700,
        "lon": 91.7300,
        "type": HubType.hilly_aggregation_node,
        "power_reliability": PowerReliability.solar,
        "cold_storage_capacity_kg": 8000.0,
        "elevation_m": 1484.0,
        "terrain_type": "mountainous",
        "is_rail_terminal": False,
        "is_active": True,
    },
    {
        "key": "mendipathar_rail",
        "name": "Mendipathar Meghalaya Railhead Terminal",
        "lat": 25.9200,
        "lon": 90.6200,
        "type": HubType.rail_yard,
        "power_reliability": PowerReliability.grid,
        "cold_storage_capacity_kg": 18000.0,
        "elevation_m": 120.0,
        "terrain_type": "plains",
        "is_rail_terminal": True,
        "is_active": True,
    },
    {
        "key": "jowai_spices",
        "name": "Jowai Lakadong Spices Cluster Hub",
        "lat": 25.4500,
        "lon": 92.2000,
        "type": HubType.hilly_aggregation_node,
        "power_reliability": PowerReliability.solar,
        "cold_storage_capacity_kg": 20000.0,
        "elevation_m": 1380.0,
        "terrain_type": "hilly",
        "is_rail_terminal": False,
        "is_active": True,
    },
    {
        "key": "majuli_island",
        "name": "Majuli Island Riverine Agro-Cluster",
        "lat": 26.9500,
        "lon": 94.1700,
        "type": HubType.aggregation_point,
        "power_reliability": PowerReliability.solar,
        "cold_storage_capacity_kg": 12000.0,
        "elevation_m": 84.0,
        "terrain_type": "riverine",
        "is_rail_terminal": False,
        "is_active": True,
    },
    {
        "key": "siliguri_gate",
        "name": "Siliguri Strategic Gateway (Chicken's Neck)",
        "lat": 26.7271,
        "lon": 88.3953,
        "type": HubType.crossdock,
        "power_reliability": PowerReliability.grid,
        "cold_storage_capacity_kg": 100000.0,
        "elevation_m": 122.0,
        "terrain_type": "plains",
        "is_rail_terminal": True,
        "is_active": True,
    },
]

# Authentic Inter-Hub Routes with Real Topographical Constraints
NER_REAL_ROUTES = [
    # Guwahati <-> Shillong (NH-6 GS Road)
    {"orig": 1, "dest": 2, "mode": TransportMode.road, "dist_km": 98.5, "hrs": 2.8, "cost_kg": 3.2, "elev_gain": 1471.0, "grad_pct": 5.8, "terrain": "hilly", "rel": 0.94},
    {"orig": 2, "dest": 1, "mode": TransportMode.road, "dist_km": 98.5, "hrs": 2.4, "cost_kg": 2.8, "elev_gain": 0.0, "grad_pct": 5.8, "terrain": "hilly", "rel": 0.95},

    # Guwahati <-> Pandu Port (Urban Link)
    {"orig": 1, "dest": 3, "mode": TransportMode.local, "dist_km": 12.0, "hrs": 0.5, "cost_kg": 0.8, "elev_gain": 0.0, "grad_pct": 0.5, "terrain": "plains", "rel": 0.99},
    {"orig": 3, "dest": 1, "mode": TransportMode.local, "dist_km": 12.0, "hrs": 0.5, "cost_kg": 0.8, "elev_gain": 4.0, "grad_pct": 0.5, "terrain": "plains", "rel": 0.99},

    # Guwahati <-> Lumding (NFR Broad Gauge Railway & NH-27)
    {"orig": 1, "dest": 4, "mode": TransportMode.rail, "dist_km": 181.0, "hrs": 3.2, "cost_kg": 1.2, "elev_gain": 81.0, "grad_pct": 0.8, "terrain": "plains", "rel": 0.96},
    {"orig": 4, "dest": 1, "mode": TransportMode.rail, "dist_km": 181.0, "hrs": 3.2, "cost_kg": 1.2, "elev_gain": 0.0, "grad_pct": 0.8, "terrain": "plains", "rel": 0.96},
    {"orig": 1, "dest": 4, "mode": TransportMode.road, "dist_km": 195.0, "hrs": 4.2, "cost_kg": 4.5, "elev_gain": 85.0, "grad_pct": 1.2, "terrain": "plains", "rel": 0.92},

    # Lumding <-> Silchar (Dima Hasao Hill Section / Badarpur)
    {"orig": 4, "dest": 5, "mode": TransportMode.rail, "dist_km": 198.0, "hrs": 5.5, "cost_kg": 1.8, "elev_gain": 450.0, "grad_pct": 3.5, "terrain": "hilly", "rel": 0.86},
    {"orig": 5, "dest": 4, "mode": TransportMode.rail, "dist_km": 198.0, "hrs": 5.5, "cost_kg": 1.8, "elev_gain": 450.0, "grad_pct": 3.5, "terrain": "hilly", "rel": 0.86},
    {"orig": 4, "dest": 5, "mode": TransportMode.road, "dist_km": 215.0, "hrs": 7.0, "cost_kg": 6.0, "elev_gain": 580.0, "grad_pct": 4.2, "terrain": "hilly", "rel": 0.82},

    # Guwahati <-> Tura (NH-17 / Mendipathar)
    {"orig": 1, "dest": 6, "mode": TransportMode.road, "dist_km": 218.0, "hrs": 5.0, "cost_kg": 5.2, "elev_gain": 310.0, "grad_pct": 2.5, "terrain": "hilly", "rel": 0.90},
    {"orig": 6, "dest": 1, "mode": TransportMode.road, "dist_km": 218.0, "hrs": 4.8, "cost_kg": 5.0, "elev_gain": 0.0, "grad_pct": 2.5, "terrain": "hilly", "rel": 0.91},

    # Mendipathar Rail <-> Guwahati
    {"orig": 1, "dest": 11, "mode": TransportMode.rail, "dist_km": 131.0, "hrs": 2.8, "cost_kg": 1.0, "elev_gain": 66.0, "grad_pct": 0.6, "terrain": "plains", "rel": 0.97},
    {"orig": 11, "dest": 1, "mode": TransportMode.rail, "dist_km": 131.0, "hrs": 2.8, "cost_kg": 1.0, "elev_gain": 0.0, "grad_pct": 0.6, "terrain": "plains", "rel": 0.97},
    {"orig": 11, "dest": 6, "mode": TransportMode.road, "dist_km": 92.0, "hrs": 2.4, "cost_kg": 2.5, "elev_gain": 240.0, "grad_pct": 3.0, "terrain": "hilly", "rel": 0.92},

    # Guwahati <-> Jorhat (NH-27 / Kaziranga Arterial)
    {"orig": 1, "dest": 7, "mode": TransportMode.road, "dist_km": 305.0, "hrs": 6.5, "cost_kg": 6.5, "elev_gain": 33.0, "grad_pct": 0.8, "terrain": "plains", "rel": 0.91},
    {"orig": 7, "dest": 1, "mode": TransportMode.road, "dist_km": 305.0, "hrs": 6.5, "cost_kg": 6.5, "elev_gain": 0.0, "grad_pct": 0.8, "terrain": "plains", "rel": 0.91},

    # Pandu Port <-> Jorhat / Neamati Ghat (NW-2 Brahmaputra Riverway)
    {"orig": 3, "dest": 7, "mode": TransportMode.waterway, "dist_km": 320.0, "hrs": 14.0, "cost_kg": 1.5, "elev_gain": 37.0, "grad_pct": 0.1, "terrain": "riverine", "rel": 0.89},
    {"orig": 7, "dest": 3, "mode": TransportMode.waterway, "dist_km": 320.0, "hrs": 10.0, "cost_kg": 1.2, "elev_gain": 0.0, "grad_pct": 0.1, "terrain": "riverine", "rel": 0.92},

    # Jorhat <-> Dibrugarh (Upper Assam Arterial)
    {"orig": 7, "dest": 8, "mode": TransportMode.road, "dist_km": 135.0, "hrs": 2.8, "cost_kg": 3.0, "elev_gain": 21.0, "grad_pct": 0.5, "terrain": "plains", "rel": 0.95},
    {"orig": 7, "dest": 8, "mode": TransportMode.rail, "dist_km": 138.0, "hrs": 2.4, "cost_kg": 1.1, "elev_gain": 21.0, "grad_pct": 0.5, "terrain": "plains", "rel": 0.98},

    # Jorhat <-> Majuli Island (Ferry & River Link)
    {"orig": 7, "dest": 13, "mode": TransportMode.waterway, "dist_km": 24.0, "hrs": 1.2, "cost_kg": 1.8, "elev_gain": 0.0, "grad_pct": 0.0, "terrain": "riverine", "rel": 0.85},
    {"orig": 13, "dest": 7, "mode": TransportMode.waterway, "dist_km": 24.0, "hrs": 1.2, "cost_kg": 1.8, "elev_gain": 3.0, "grad_pct": 0.0, "terrain": "riverine", "rel": 0.85},

    # Guwahati <-> Tezpur (North Bank NH-15)
    {"orig": 1, "dest": 9, "mode": TransportMode.road, "dist_km": 178.0, "hrs": 3.8, "cost_kg": 4.0, "elev_gain": 10.0, "grad_pct": 0.6, "terrain": "plains", "rel": 0.94},
    {"orig": 9, "dest": 7, "mode": TransportMode.road, "dist_km": 165.0, "hrs": 3.5, "cost_kg": 3.8, "elev_gain": 27.0, "grad_pct": 0.7, "terrain": "plains", "rel": 0.93},

    # Shillong <-> Cherrapunji / Sohra (Steep Mountain Ghats)
    {"orig": 2, "dest": 10, "mode": TransportMode.road, "dist_km": 54.0, "hrs": 1.8, "cost_kg": 2.5, "elev_gain": 420.0, "grad_pct": 8.5, "terrain": "mountainous", "rel": 0.88},
    {"orig": 10, "dest": 2, "mode": TransportMode.road, "dist_km": 54.0, "hrs": 1.6, "cost_kg": 2.2, "elev_gain": 460.0, "grad_pct": 8.5, "terrain": "mountainous", "rel": 0.89},

    # Shillong <-> Jowai Lakadong (NH-6 Hill Spine)
    {"orig": 2, "dest": 12, "mode": TransportMode.road, "dist_km": 64.0, "hrs": 1.9, "cost_kg": 2.4, "elev_gain": 220.0, "grad_pct": 5.2, "terrain": "hilly", "rel": 0.92},
    {"orig": 12, "dest": 2, "mode": TransportMode.road, "dist_km": 64.0, "hrs": 1.8, "cost_kg": 2.4, "elev_gain": 365.0, "grad_pct": 5.2, "terrain": "hilly", "rel": 0.93},
    {"orig": 12, "dest": 5, "mode": TransportMode.road, "dist_km": 138.0, "hrs": 4.5, "cost_kg": 4.8, "elev_gain": 0.0, "grad_pct": 6.8, "terrain": "hilly", "rel": 0.81},

    # Siliguri Gateway <-> Guwahati (NH-27 Arterial Freight Spine & Railway)
    {"orig": 14, "dest": 1, "mode": TransportMode.road, "dist_km": 465.0, "hrs": 9.5, "cost_kg": 9.5, "elev_gain": 0.0, "grad_pct": 0.6, "terrain": "plains", "rel": 0.93},
    {"orig": 1, "dest": 14, "mode": TransportMode.road, "dist_km": 465.0, "hrs": 9.5, "cost_kg": 9.5, "elev_gain": 68.0, "grad_pct": 0.6, "terrain": "plains", "rel": 0.93},
    {"orig": 14, "dest": 1, "mode": TransportMode.rail, "dist_km": 450.0, "hrs": 7.5, "cost_kg": 2.5, "elev_gain": 0.0, "grad_pct": 0.4, "terrain": "plains", "rel": 0.97},
    {"orig": 1, "dest": 14, "mode": TransportMode.rail, "dist_km": 450.0, "hrs": 7.5, "cost_kg": 2.5, "elev_gain": 68.0, "grad_pct": 0.4, "terrain": "plains", "rel": 0.97},
]


async def load_ner_real_data():
    print("======================================================================")
    print("  🌱 Loading Authentic NER Logistics & Accessibility Data (SIH26002)")
    print("  📍 Focus: Assam + Meghalaya Corridor & Strategic Gateway Topology")
    print("======================================================================")

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        print("Recreating database tables for clean NER real data ingestion...")
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # 1. Create Authentic NER Tenants
        tenant_as = Tenant(
            id=uuid.uuid5(uuid.NAMESPACE_DNS, "as_agri_mission"),
            name="Assam State Agricultural Marketing Board & Organic Mission (ASAMB)",
            type=TenantType.shipper,
        )
        tenant_mbda = Tenant(
            id=uuid.uuid5(uuid.NAMESPACE_DNS, "mbda_agro_logistics"),
            name="Meghalaya Basin Development Authority (MBDA - Agro Logistics)",
            type=TenantType.shipper,
        )
        tenant_carrier = Tenant(
            id=uuid.uuid5(uuid.NAMESPACE_DNS, "ner_multimodal_fleet"),
            name="Northeast Frontier Multimodal Logistics Fleet",
            type=TenantType.carrier,
        )
        tenant_admin = Tenant(
            id=uuid.uuid5(uuid.NAMESPACE_DNS, "gatishakti_ner_admin"),
            name="GatiShakti NER Accessibility Intelligence Admin",
            type=TenantType.admin,
        )
        session.add_all([tenant_as, tenant_mbda, tenant_carrier, tenant_admin])
        await session.commit()
        print("✅ Seeded 4 Authentic NER Institutional Tenants.")

        # 2. Seed Real NER Hubs
        hub_instances = []
        hub_map = {}
        for idx, h_data in enumerate(NER_REAL_HUBS, 1):
            h_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"ner_hub_{h_data['key']}")
            hub = Hub(
                id=h_id,
                name=h_data["name"],
                lat=h_data["lat"],
                lon=h_data["lon"],
                type=h_data["type"],
                power_reliability=h_data["power_reliability"],
                cold_storage_capacity_kg=h_data["cold_storage_capacity_kg"],
                elevation_m=h_data["elevation_m"],
                terrain_type=h_data["terrain_type"],
                is_rail_terminal=h_data["is_rail_terminal"],
                is_active=h_data["is_active"],
            )
            hub_instances.append(hub)
            hub_map[idx] = h_id

        session.add_all(hub_instances)
        await session.commit()
        print(f"✅ Seeded {len(hub_instances)} Real NER Multimodal Hubs across Assam & Meghalaya.")

        # 3. Seed Real Routes & Topographies
        route_instances = []
        route_histories = []
        for r_data in NER_REAL_ROUTES:
            orig_id = hub_map[r_data["orig"]]
            dest_id = hub_map[r_data["dest"]]
            route_id = uuid.uuid4()
            route = Route(
                id=route_id,
                origin_hub_id=orig_id,
                dest_hub_id=dest_id,
                mode=r_data["mode"],
                distance_km=r_data["dist_km"],
                avg_transit_hrs=r_data["hrs"],
                base_cost_per_kg=r_data["cost_kg"],
                reliability_score=r_data["rel"],
                elevation_gain_m=r_data["elev_gain"],
                avg_gradient_pct=r_data["grad_pct"],
                terrain_type=r_data["terrain"],
            )
            route_instances.append(route)

            # Add historical transit variance (Monsoon vs Dry season)
            base_date = date.today() - timedelta(days=90)
            for d_offset in range(0, 90, 15):
                trip_dt = base_date + timedelta(days=d_offset)
                is_monsoon = trip_dt.month in [5, 6, 7, 8, 9]
                actual_hrs = r_data["hrs"] * (1.35 if is_monsoon and r_data["grad_pct"] > 4.0 else 1.05)
                delayed = actual_hrs > (r_data["hrs"] * 1.2)
                reason = "Heavy monsoon rainfall / ghat slope slippage" if delayed else None
                route_histories.append(
                    RouteHistory(
                        id=uuid.uuid4(),
                        route_id=route_id,
                        trip_date=trip_dt,
                        actual_transit_hrs=round(actual_hrs, 2),
                        delayed=delayed,
                        delay_reason=reason,
                        season="monsoon" if is_monsoon else "winter",
                    )
                )

        session.add_all(route_instances)
        session.add_all(route_histories)
        await session.commit()
        print(f"✅ Seeded {len(route_instances)} Real Topographical Corridors and {len(route_histories)} Historical Trips.")

        # 4. Seed Multi-Modal Fleet (4x4, EV, Heavy Reefer, Barges, Freight Wagons, Drones)
        fleet_data = [
            {
                "code": "AS-01-EE-1001",
                "name": "Guwahati ColdChain Reefer HCV (16T)",
                "type": VehicleType.heavy_truck,
                "cap_kg": 16000.0,
                "cap_cbm": 35.0,
                "cost_km": 28.0,
                "max_grad": 8.0,
                "terrains": "plains",
                "temp": True,
                "lat": 26.1820,
                "lon": 91.7450,
                "loc": "Guwahati Central Multimodal Mega-Hub (GHY)",
            },
            {
                "code": "ML-05-BX-2001",
                "name": "Shillong Highland 4x4 Bolero Pickup #1",
                "type": VehicleType.pickup_4x4,
                "cap_kg": 1500.0,
                "cap_cbm": 6.0,
                "cost_km": 14.5,
                "max_grad": 32.0,
                "terrains": "plains,hilly,mountainous",
                "temp": True,
                "lat": 25.5788,
                "lon": 91.8933,
                "loc": "Shillong Hill Agro-Aggregation Node (SHL)",
            },
            {
                "code": "ML-05-BX-2002",
                "name": "Jowai Spices 4x4 Bolero Pickup #2",
                "type": VehicleType.pickup_4x4,
                "cap_kg": 1500.0,
                "cap_cbm": 6.0,
                "cost_km": 14.5,
                "max_grad": 30.0,
                "terrains": "plains,hilly,mountainous",
                "temp": True,
                "lat": 25.4500,
                "lon": 92.2000,
                "loc": "Jowai Lakadong Spices Cluster Hub",
            },
            {
                "code": "AS-03-TC-3001",
                "name": "Jorhat Agro Tata Ace Cold LCV",
                "type": VehicleType.tata_ace,
                "cap_kg": 1200.0,
                "cap_cbm": 4.5,
                "cost_km": 10.0,
                "max_grad": 18.0,
                "terrains": "plains,hilly",
                "temp": True,
                "lat": 26.7509,
                "lon": 94.2037,
                "loc": "Jorhat Upper Assam Agro-Logistics Center",
            },
            {
                "code": "NW2-BG-4001",
                "name": "Brahmaputra Cargo Barge 'Lachit' (120T)",
                "type": VehicleType.riverine_boat,
                "cap_kg": 120000.0,
                "cap_cbm": 180.0,
                "cost_km": 15.0,
                "max_grad": 0.0,
                "terrains": "riverine",
                "temp": True,
                "lat": 26.1550,
                "lon": 91.7050,
                "loc": "Pandu Port NW-2 Multimodal River Terminal",
            },
            {
                "code": "NFR-WG-5001",
                "name": "NFR High-Capacity Agro Freight Rake",
                "type": VehicleType.rail_cargo_wagon,
                "cap_kg": 60000.0,
                "cap_cbm": 95.0,
                "cost_km": 6.5,
                "max_grad": 2.5,
                "terrains": "plains",
                "temp": True,
                "lat": 25.7500,
                "lon": 93.1700,
                "loc": "Lumding Junction NFR Rail Freight Yard",
            },
            {
                "code": "ML-08-DR-6001",
                "name": "Cherrapunji Emergency Mountain Vaccine Drone",
                "type": VehicleType.other,
                "cap_kg": 25.0,
                "cap_cbm": 0.2,
                "cost_km": 20.0,
                "max_grad": 45.0,
                "terrains": "plains,hilly,mountainous",
                "temp": True,
                "lat": 25.2700,
                "lon": 91.7300,
                "loc": "Cherrapunji / Sohra Mountain PHC Node",
            },
            {
                "code": "ML-07-TC-7001",
                "name": "Tura Garo Hills Community Mini-Truck",
                "type": VehicleType.mini_truck,
                "cap_kg": 1500.0,
                "cap_cbm": 5.0,
                "cost_km": 11.0,
                "max_grad": 20.0,
                "terrains": "plains,hilly",
                "temp": False,
                "lat": 25.5144,
                "lon": 90.2032,
                "loc": "Tura Garo Hills Agro-Collection Node",
            },
        ]

        vehicles = []
        for v in fleet_data:
            vehicles.append(
                Vehicle(
                    id=uuid.uuid4(),
                    vehicle_code=v["code"],
                    name=v["name"],
                    type=v["type"],
                    capacity_kg=v["cap_kg"],
                    capacity_cbm=v["cap_cbm"],
                    cost_per_km=v["cost_km"],
                    max_gradient_pct=v["max_grad"],
                    suitable_terrains=v["terrains"],
                    temp_control=v["temp"],
                    owner_type=VehicleOwnerType.cooperative,
                    current_location_name=v["loc"],
                    current_location_lat=v["lat"],
                    current_location_lon=v["lon"],
                    availability_status=VehicleAvailability.available,
                )
            )

        session.add_all(vehicles)
        await session.commit()
        print(f"✅ Seeded {len(vehicles)} Specialized Multi-Modal NER Fleet Vehicles.")

        # 5. Seed Real Authentic Perishable & Essential Shipments
        now = datetime.now(timezone.utc)
        shipments_data = [
            {
                "orig": 12, "dest": 1, "weight": 850.0, "cbm": 3.2,
                "temp": TempClass.ambient, "target": "20C", "good": GoodType.farm_produce,
                "urgency": UrgencyLevel.high, "status": ShipmentStatus.pending,
                "desc": "High-Curcumin Lakadong Turmeric (Batch LK-2026-A)",
            },
            {
                "orig": 7, "dest": 14, "weight": 4200.0, "cbm": 14.0,
                "temp": TempClass.ambient, "target": "22C", "good": GoodType.farm_produce,
                "urgency": UrgencyLevel.routine, "status": ShipmentStatus.in_transit,
                "desc": "GI-Tagged Assam Orthodox Golden Tip Tea",
            },
            {
                "orig": 9, "dest": 1, "weight": 650.0, "cbm": 2.5,
                "temp": TempClass.chilled, "target": "4C to 8C", "good": GoodType.farm_produce,
                "urgency": UrgencyLevel.critical, "status": ShipmentStatus.pending,
                "desc": "GI-Tagged Tezpur Perishable Seedless Litchi",
            },
            {
                "orig": 1, "dest": 10, "weight": 45.0, "cbm": 0.35,
                "temp": TempClass.chilled, "target": "2C to 8C", "good": GoodType.medicine,
                "urgency": UrgencyLevel.critical, "status": ShipmentStatus.in_transit,
                "desc": "Pediatric Vaccines & Antivenom Serum for Sohra PHC",
            },
            {
                "orig": 3, "dest": 13, "weight": 8500.0, "cbm": 22.0,
                "temp": TempClass.ambient, "target": "Ambient", "good": GoodType.essential_goods,
                "urgency": UrgencyLevel.high, "status": ShipmentStatus.pending,
                "desc": "Emergency Flood Buffer Relief Grain & Medical Kits for Majuli",
            },
            {
                "orig": 6, "dest": 2, "weight": 1100.0, "cbm": 4.0,
                "temp": TempClass.ambient, "target": "18C", "good": GoodType.farm_produce,
                "urgency": UrgencyLevel.routine, "status": ShipmentStatus.pending,
                "desc": "Organic Garo Hills High-Aroma Ginger & Cashew",
            },
        ]

        shipment_instances = []
        for idx, s in enumerate(shipments_data, 1):
            s_id = uuid.uuid4()
            shipment = Shipment(
                id=s_id,
                tenant_id=tenant_as.id if "Assam" in s["desc"] or "Tezpur" in s["desc"] else tenant_mbda.id,
                origin_hub_id=hub_map[s["orig"]],
                dest_hub_id=hub_map[s["dest"]],
                good_type=s["good"],
                urgency=s["urgency"],
                producer_id=f"prod-ner-{idx:03d}",
                producer_name=s["desc"],
                community_id=f"comm-cluster-{idx:02d}",
                waybill_number=f"NER-2026-{idx:04d}",
                load_quantity=s["weight"] / 50.0,
                quantity_units="crates",
                weight_kg=s["weight"],
                volume_cbm=s["cbm"],
                temp_class=s["temp"],
                sla_deadline=now + timedelta(hours=36),
                max_cost=s["weight"] * 15.0,
                status=s["status"],
            )
            shipment_instances.append(shipment)

        session.add_all(shipment_instances)
        await session.commit()
        print(f"✅ Seeded {len(shipment_instances)} Priority Regional Consignments.")

        # 6. Seed Authentic RoadSense Telemetry & PMGSY Road Segments
        print("🛣️  Seeding RoadSense Telemetry across NER Corridors...")
        await seed_roadsense_data(session)

    print("======================================================================")
    print("  🎉 REAL NER DATA LOAD COMPLETED SUCCESSFULLY!")
    print("======================================================================")


if __name__ == "__main__":
    asyncio.run(load_ner_real_data())
