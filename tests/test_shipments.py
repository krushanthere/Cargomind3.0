import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient
from app.core.auth import create_access_token


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_create_and_get_shipment(client: AsyncClient, sample_tenant, sample_hubs_and_routes):
    token = create_access_token({"tenant_id": str(sample_tenant.id), "role": "shipper"})
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "origin_hub_id": str(sample_hubs_and_routes["h1"].id),
        "dest_hub_id": str(sample_hubs_and_routes["h2"].id),
        "weight_kg": 1500.0,
        "volume_cbm": 5.0,
        "temp_class": "chilled",
        "sla_deadline": (datetime.now(timezone.utc) + timedelta(hours=48)).isoformat(),
        "max_cost": 4500.0,
    }

    response = await client.post("/api/shipments", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["weight_kg"] == 1500.0
    assert data["temp_class"] == "chilled"
    assert data["max_cost"] == 4500.0

    shipment_id = data["id"]
    get_res = await client.get(f"/api/shipments/{shipment_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == shipment_id
