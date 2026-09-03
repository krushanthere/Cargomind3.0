import asyncio
import uuid
from datetime import datetime, timezone, timedelta, date
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
    RoadSegment,
    RoadReport,
    VehicleProfile,
)
from ml.data.synthetic_generator import generate_synthetic_dataset
from app.services.roadsense.osm_seeder import seed_roadsense_data


async def seed_demo_data():
    print("Connecting to database for seeding...")
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        print("Recreating table schema for clean seeding...")
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # 1. Create Default Demo Tenants
        tenant_shipper = Tenant(id=uuid.uuid4(), name="Rural Farmers & Health Cooperative", type=TenantType.shipper)
        tenant_carrier = Tenant(id=uuid.uuid4(), name="Local Community Transport Fleet", type=TenantType.carrier)
        tenant_admin = Tenant(id=uuid.uuid4(), name="Rural Last-Mile Admin Platform", type=TenantType.admin)
        session.add_all([tenant_shipper, tenant_carrier, tenant_admin])
        await session.commit()

        print(f"Created Tenants:\n - Shipper: {tenant_shipper.id}\n - Carrier: {tenant_carrier.id}\n - Admin: {tenant_admin.id}")

        # 2. Generate Synthetic Dataset (Rural Hubs, Routes, Histories, Shipments, Fleet)
        raw_data = generate_synthetic_dataset(num_shipments=50)

        hub_id_map = {}
        for h_data in raw_data["hubs"]:
            hub = Hub(
                id=uuid.UUID(h_data["id"]),
                name=h_data["name"],
                lat=h_data["lat"],
                lon=h_data["lon"],
                type=HubType(h_data["type"]),
                power_reliability=PowerReliability(h_data["power_reliability"]),
                cold_storage_capacity_kg=h_data["cold_storage_capacity_kg"],
                elevation_m=h_data.get("elevation_m", 50.0),
                terrain_type=h_data.get("terrain_type", "plains"),
                is_rail_terminal=h_data.get("is_rail_terminal", False),
                is_active=h_data["is_active"],
            )
            session.add(hub)
            hub_id_map[h_data["id"]] = hub.id

        await session.commit()
        print(f"Seeded {len(raw_data['hubs'])} Rural Aggregation Hubs, Mountain Nodes, and Rail Freight Terminals.")

        # 3. Seed Rural Fleet (Synthetic Registry of 18 Realistic Multi-Modal Vehicles)
        vehicle_id_map = {}
        for v_data in raw_data["vehicles"]:
            status_enum = VehicleAvailability(v_data.get("availability_status", "available"))
            vehicle = Vehicle(
                id=uuid.UUID(v_data["id"]),
                vehicle_code=v_data.get("vehicle_code", "OD-02-TC-0000"),
                name=v_data["name"],
                type=VehicleType(v_data["type"]),
                capacity_kg=v_data["capacity_kg"],
                capacity_cbm=v_data["capacity_cbm"],
                cost_per_km=v_data.get("cost_per_km", 12.0),
                max_gradient_pct=v_data.get("max_gradient_pct", 15.0),
                suitable_terrains=v_data.get("suitable_terrains", "plains,hilly"),
                temp_control=v_data["temp_control"],
                owner_type=VehicleOwnerType(v_data["owner_type"]),
                current_location_name=v_data.get("current_location_name", "Odisha Central Hub"),
                current_location_lat=v_data["current_location_lat"],
                current_location_lon=v_data["current_location_lon"],
                availability_status=status_enum,
                current_assignment=v_data.get("current_assignment", None),
                last_seen_at=datetime.fromisoformat(v_data["last_seen_at"]),
            )
            session.add(vehicle)
            vehicle_id_map[v_data["id"]] = vehicle.id

        await session.commit()
        print(f"Seeded {len(raw_data['vehicles'])} Synthetic Fleet Registry Vehicles (Tata Ace, Mahindra Bolero Pickups, Tractor-Trailers, E-Rickshaws, Cargo Bikes, Boats).")

        # 4. Seed Routes & Conditions
        route_id_map = {}
        for r_data in raw_data["routes"]:
            route = Route(
                id=uuid.UUID(r_data["id"]),
                origin_hub_id=hub_id_map[r_data["origin_hub_id"]],
                dest_hub_id=hub_id_map[r_data["dest_hub_id"]],
                mode=TransportMode(r_data["mode"]),
                distance_km=r_data.get("distance_km", 25.0),
                avg_transit_hrs=r_data["avg_transit_hrs"],
                base_cost_per_kg=r_data["base_cost_per_kg"],
                reliability_score=r_data["reliability_score"],
                elevation_gain_m=r_data.get("elevation_gain_m", 0.0),
                avg_gradient_pct=r_data.get("avg_gradient_pct", 1.0),
                terrain_type=r_data.get("terrain_type", "plains"),
            )
            session.add(route)
            route_id_map[r_data["id"]] = route.id

        await session.commit()
        print(f"Seeded {len(raw_data['routes'])} Local, Road, Rail Freight, & Mountain Routes.")

        for rc_data in raw_data["road_conditions"]:
            r_cond = RoadConditionReport(
                id=uuid.UUID(rc_data["id"]),
                route_id=route_id_map[rc_data["route_id"]],
                condition=RoadConditionType(rc_data["condition"]),
                reported_at=datetime.fromisoformat(rc_data["reported_at"]),
                reported_by=rc_data["reported_by"],
            )
            session.add(r_cond)

        for rh_data in raw_data["route_histories"]:
            rh = RouteHistory(
                id=uuid.UUID(rh_data["id"]),
                route_id=route_id_map[rh_data["route_id"]],
                trip_date=date.fromisoformat(rh_data["trip_date"]),
                actual_transit_hrs=rh_data["actual_transit_hrs"],
                delayed=rh_data["delayed"],
                delay_reason=rh_data["delay_reason"],
                season=rh_data["season"],
            )
            session.add(rh)

        await session.commit()
        print(f"Seeded {len(raw_data['road_conditions'])} Road Condition Reports & {len(raw_data['route_histories'])} History Logs.")

        # 5. Seed Rural Shipments
        now = datetime.now(timezone.utc)
        shipment_id_map = {}
        for s_data in raw_data["shipments"]:
            shipment = Shipment(
                id=uuid.UUID(s_data["id"]),
                tenant_id=tenant_shipper.id,
                origin_hub_id=hub_id_map[s_data["origin_hub_id"]],
                dest_hub_id=hub_id_map[s_data["dest_hub_id"]],
                good_type=GoodType(s_data["good_type"]),
                urgency=UrgencyLevel(s_data["urgency"]),
                producer_id=s_data["producer_id"],
                producer_name=s_data["producer_name"],
                community_id=s_data["community_id"],
                waybill_number=s_data.get("waybill_number", f"RUR-{s_data['id'][:5].upper()}"),
                load_quantity=s_data.get("load_quantity", 1.0),
                quantity_units=s_data.get("quantity_units", "units"),
                weight_kg=s_data["weight_kg"],
                volume_cbm=s_data["volume_cbm"],
                temp_class=TempClass(s_data["temp_class"]),
                sla_deadline=datetime.fromisoformat(s_data["sla_deadline"]),
                max_cost=s_data["max_cost"],
                status=ShipmentStatus.pending,
                created_at=datetime.fromisoformat(s_data["created_at"]),
                synced_at=datetime.fromisoformat(s_data["synced_at"]),
            )
            session.add(shipment)
            shipment_id_map[s_data["id"]] = shipment.id

        await session.commit()
        print(f"Seeded {len(raw_data['shipments'])} Pending Rural Pickups (Produce, Medicines, Goods) with Waybills & Load Quantities.")

        # 6. Seed Temperature Logs
        for tl_data in raw_data["temperature_logs"]:
            if tl_data["shipment_id"] in shipment_id_map:
                tlog = TemperatureLog(
                    id=uuid.UUID(tl_data["id"]),
                    shipment_id=shipment_id_map[tl_data["shipment_id"]],
                    vehicle_id=tl_data["vehicle_id"],
                    timestamp=datetime.fromisoformat(tl_data["timestamp"]),
                    temp_celsius=tl_data["temp_celsius"],
                    humidity=tl_data["humidity"],
                    synced_at=datetime.fromisoformat(tl_data["synced_at"]),
                )
                session.add(tlog)

        # 7. Seed Historical Allocations for Fairness Dashboard
        for ah_data in raw_data["allocation_histories"]:
            v_uuid = uuid.UUID(ah_data["vehicle_id"]) if ah_data["vehicle_id"] in vehicle_id_map else None
            ah = AllocationHistory(
                id=uuid.UUID(ah_data["id"]),
                producer_id=ah_data["producer_id"],
                producer_name=ah_data["producer_name"],
                community_id=ah_data["community_id"],
                vehicle_id=v_uuid,
                matched_at=datetime.fromisoformat(ah_data["matched_at"]),
                wait_time_minutes=ah_data["wait_time_minutes"],
                allocation_score=ah_data["allocation_score"],
                urgency=ah_data["urgency"],
                good_type=ah_data["good_type"],
                explanation_summary=ah_data["explanation_summary"],
                synced_at=datetime.fromisoformat(ah_data["synced_at"]),
            )
            session.add(ah)

        await session.commit()
        print(f"Seeded {len(raw_data['allocation_histories'])} Historical Allocation Records for Fairness Verification.")

        # 8. Seed RoadSense OSM Odisha Segments, Vehicle Profiles & Reports
        rs_stats = await seed_roadsense_data(session)
        print(
            f"Seeded RoadSense Intelligence: {rs_stats['vehicle_profiles_count']} Vehicle Profiles, "
            f"{rs_stats['segments_count']} OSM Odisha Road Segments, {rs_stats['reports_count']} Crowdsourced Reports."
        )

    await engine.dispose()
    print("Demo Data Seeding Complete!")


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
