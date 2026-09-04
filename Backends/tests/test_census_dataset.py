import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dataset_unified_summary(client: AsyncClient):
    r = await client.get("/api/dataset/summary")
    assert r.status_code == 200
    data = r.json()
    assert "census_metrics" in data
    assert data["census_metrics"]["total_settlements"] == 3379
    assert data["census_metrics"]["total_cultivators"] > 400000
    assert len(data["states_covered"]) == 8


@pytest.mark.asyncio
async def test_census_summary_endpoint(client: AsyncClient):
    r = await client.get("/api/dataset/census/summary")
    assert r.status_code == 200
    summary = r.json()
    assert summary["dataset_name"] == "Census of India 2011 Primary Census Abstract (PCA)"
    assert summary["total_records"] == 3379
    assert summary["total_villages"] == 3197
    assert summary["total_cd_blocks"] == 162
    assert "state_breakdown" in summary
    assert "Assam" in summary["state_breakdown"]
    assert "Meghalaya" in summary["state_breakdown"]


@pytest.mark.asyncio
async def test_census_settlements_filtering(client: AsyncClient):
    # Filter by state
    r = await client.get("/api/dataset/census/settlements?state=Assam&limit=10")
    assert r.status_code == 200
    res = r.json()
    assert res["total_matches"] == 1103
    assert len(res["data"]) == 10
    for s in res["data"]:
        assert s["state"] == "Assam"

    # Filter by level
    r = await client.get("/api/dataset/census/settlements?level=CD+BLOCK&limit=5")
    assert r.status_code == 200
    res = r.json()
    assert res["total_matches"] == 162
    for s in res["data"]:
        assert s["level"] == "CD BLOCK"


@pytest.mark.asyncio
async def test_census_demand_proxy_calculation(client: AsyncClient):
    r = await client.post(
        "/api/dataset/census/demand-proxy",
        json={
            "settlement_name": "Kokrajhar",
            "households": 500,
            "total_population": 2500,
            "cultivators": 400,
            "agri_labourers": 100,
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert "freight_projections" in data
    assert "dispatch_recommendation" in data
    assert data["freight_projections"]["daily_outbound_agri_produce_tons"] > 0
    assert data["freight_projections"]["daily_inbound_essential_goods_tons"] > 0
    assert data["dispatch_recommendation"]["recommended_vehicle"] in ["heavy_truck", "pickup_4x4", "mini_truck"]
