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
    Route,
    RouteHistory,
    TransportMode,
    Shipment,
    TempClass,
    ShipmentStatus,
    TemperatureLog,
)
from ml.data.synthetic_generator import generate_synthetic_dataset


async def seed_demo_data():
    print("Connecting to database for seeding...")
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        print("Creating table schema if not present...")
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # 1. Create Default Demo Tenants
        tenant_shipper = Tenant(id=uuid.uuid4(), name="ColdChain Logistics India", type=TenantType.shipper)
        tenant_carrier = Tenant(id=uuid.uuid4(), name="Indian Rail Express", type=TenantType.carrier)
        tenant_admin = Tenant(id=uuid.uuid4(), name="ShipMerge Admin Platform", type=TenantType.admin)
        session.add_all([tenant_shipper, tenant_carrier, tenant_admin])
        await session.commit()

        print(f"Created Tenants:\n - Shipper: {tenant_shipper.id}\n - Carrier: {tenant_carrier.id}\n - Admin: {tenant_admin.id}")

        # 2. Generate Synthetic Dataset (Indian Hubs, Routes, Histories, Shipments)
        raw_data = generate_synthetic_dataset(num_shipments=50)

        hub_id_map = {}
        for h_data in raw_data["hubs"]:
            hub = Hub(
                id=uuid.UUID(h_data["id"]),
                name=h_data["name"],
                lat=h_data["lat"],
                lon=h_data["lon"],
                type=HubType(h_data["type"]),
                cold_storage_capacity_kg=h_data["cold_storage_capacity_kg"],
                is_active=h_data["is_active"],
            )
            session.add(hub)
            hub_id_map[h_data["id"]] = hub.id

        await session.commit()
        print(f"Seeded {len(raw_data['hubs'])} Indian Hubs.")

        route_id_map = {}
        for r_data in raw_data["routes"]:
            route = Route(
                id=uuid.UUID(r_data["id"]),
                origin_hub_id=hub_id_map[r_data["origin_hub_id"]],
                dest_hub_id=hub_id_map[r_data["dest_hub_id"]],
                mode=TransportMode(r_data["mode"]),
                avg_transit_hrs=r_data["avg_transit_hrs"],
                base_cost_per_kg=r_data["base_cost_per_kg"],
                reliability_score=r_data["reliability_score"],
            )
            session.add(route)
            route_id_map[r_data["id"]] = route.id

        await session.commit()
        print(f"Seeded {len(raw_data['routes'])} Highway & Rail Routes.")

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
        print(f"Seeded {len(raw_data['route_histories'])} Route History Records.")

        now = datetime.now(timezone.utc)
        shipment_id_map = {}
        for s_data in raw_data["shipments"]:
            shipment = Shipment(
                id=uuid.UUID(s_data["id"]),
                tenant_id=tenant_shipper.id,
                origin_hub_id=hub_id_map[s_data["origin_hub_id"]],
                dest_hub_id=hub_id_map[s_data["dest_hub_id"]],
                weight_kg=s_data["weight_kg"],
                volume_cbm=s_data["volume_cbm"],
                temp_class=TempClass(s_data["temp_class"]),
                sla_deadline=now + timedelta(hours=48),
                max_cost=s_data["max_cost"],
                status=ShipmentStatus.pending,
                created_at=now,
            )
            session.add(shipment)
            shipment_id_map[s_data["id"]] = shipment.id

        await session.commit()
        print(f"Seeded {len(raw_data['shipments'])} Pending Temperature-Sensitive Shipments.")

        for tl_data in raw_data["temperature_logs"]:
            if tl_data["shipment_id"] in shipment_id_map:
                tlog = TemperatureLog(
                    id=uuid.UUID(tl_data["id"]),
                    shipment_id=shipment_id_map[tl_data["shipment_id"]],
                    vehicle_id=tl_data["vehicle_id"],
                    timestamp=datetime.fromisoformat(tl_data["timestamp"]),
                    temp_celsius=tl_data["temp_celsius"],
                    humidity=tl_data["humidity"],
                )
                session.add(tlog)

        await session.commit()
        print(f"Seeded {len(raw_data['temperature_logs'])} Temperature Excursion Logs.")

    await engine.dispose()
    print("Demo Data Seeding Complete!")


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
