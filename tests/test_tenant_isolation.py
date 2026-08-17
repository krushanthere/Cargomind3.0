import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient
from app.core.auth import create_access_token


@pytest.mark.asyncio
async def test_tenant_data_isolation(client: AsyncClient, sample_tenant, second_tenant, sample_hubs_and_routes):
    token_a = create_access_token({"tenant_id": str(sample_tenant.id), "role": "shipper"})
    headers_a = {"Authorization": f"Bearer {token_a}"}

    token_b = create_access_token({"tenant_id": str(second_tenant.id), "role": "shipper"})
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Tenant A creates a shipment
    payload = {
        "origin_hub_id": str(sample_hubs_and_routes["h1"].id),
        "dest_hub_id": str(sample_hubs_and_routes["h2"].id),
        "weight_kg": 2000.0,
        "volume_cbm": 8.0,
        "temp_class": "frozen",
        "sla_deadline": (datetime.now(timezone.utc) + timedelta(hours=36)).isoformat(),
        "max_cost": 6000.0,
    }
    create_res = await client.post("/api/shipments", json=payload, headers=headers_a)
    assert create_res.status_code == 201
    shipment_id = create_res.json()["id"]

    # Tenant B tries to fetch Tenant A's shipment by ID -> 404 Not Found
    get_res_b = await client.get(f"/api/shipments/{shipment_id}", headers=headers_b)
    assert get_res_b.status_code == 404

    # Tenant B lists shipments -> empty list
    list_res_b = await client.get("/api/shipments", headers=headers_b)
    assert list_res_b.status_code == 200
    assert len(list_res_b.json()) == 0


@pytest.mark.asyncio
async def test_carrier_role_field_masking(client: AsyncClient, sample_tenant, carrier_tenant, sample_hubs_and_routes):
    token_shipper = create_access_token({"tenant_id": str(sample_tenant.id), "role": "shipper"})
    token_carrier = create_access_token({"tenant_id": str(sample_tenant.id), "role": "carrier"})

    payload = {
        "origin_hub_id": str(sample_hubs_and_routes["h1"].id),
        "dest_hub_id": str(sample_hubs_and_routes["h2"].id),
        "weight_kg": 1000.0,
        "volume_cbm": 4.0,
        "temp_class": "chilled",
        "sla_deadline": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
        "max_cost": 3000.0,
    }
    create_res = await client.post("/api/shipments", json=payload, headers={"Authorization": f"Bearer {token_shipper}"})
    assert create_res.status_code == 201

    # Carrier query -> max_cost field must be masked / excluded
    list_res_carrier = await client.get("/api/shipments", headers={"Authorization": f"Bearer {token_carrier}"})
    assert list_res_carrier.status_code == 200
    carrier_item = list_res_carrier.json()[0]
    assert "max_cost" not in carrier_item or carrier_item["max_cost"] is None
