import asyncio
import pytest
import pytest_asyncio
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.models import Base, Tenant, TenantType, Hub, HubType, Route, TransportMode, Shipment, TempClass, ShipmentStatus
from app.core.database import get_db
from app.core.auth import create_access_token

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine_test = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(bind=engine_test, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session():
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def sample_tenant(db_session: AsyncSession):
    tenant = Tenant(id=uuid4(), name="Test Shipper Co", type=TenantType.shipper)
    db_session.add(tenant)
    await db_session.commit()
    await db_session.refresh(tenant)
    return tenant


@pytest_asyncio.fixture(scope="function")
async def second_tenant(db_session: AsyncSession):
    tenant = Tenant(id=uuid4(), name="Rival Logistics Corp", type=TenantType.shipper)
    db_session.add(tenant)
    await db_session.commit()
    await db_session.refresh(tenant)
    return tenant


@pytest_asyncio.fixture(scope="function")
async def carrier_tenant(db_session: AsyncSession):
    tenant = Tenant(id=uuid4(), name="National Express Carrier", type=TenantType.carrier)
    db_session.add(tenant)
    await db_session.commit()
    await db_session.refresh(tenant)
    return tenant


@pytest_asyncio.fixture(scope="function")
async def sample_hubs_and_routes(db_session: AsyncSession):
    h1 = Hub(id=uuid4(), name="Mumbai Hub", lat=19.0760, lon=72.8777, type=HubType.warehouse, cold_storage_capacity_kg=50000.0)
    h2 = Hub(id=uuid4(), name="Delhi Hub", lat=28.7041, lon=77.1025, type=HubType.crossdock, cold_storage_capacity_kg=60000.0)
    db_session.add_all([h1, h2])
    await db_session.commit()

    r1 = Route(
        id=uuid4(),
        origin_hub_id=h1.id,
        dest_hub_id=h2.id,
        mode=TransportMode.road,
        avg_transit_hrs=28.0,
        base_cost_per_kg=2.5,
        reliability_score=0.88,
    )
    r2 = Route(
        id=uuid4(),
        origin_hub_id=h1.id,
        dest_hub_id=h2.id,
        mode=TransportMode.rail,
        avg_transit_hrs=34.0,
        base_cost_per_kg=1.8,
        reliability_score=0.94,
    )
    db_session.add_all([r1, r2])
    await db_session.commit()

    return {"h1": h1, "h2": h2, "r1": r1, "r2": r2}
