import pytest
from app.services.st_gnn.model import STGNNModel
from app.services.st_gnn.service import STGNNService
from app.services.st_gnn.graph import SpatialTemporalRoadGraph


def test_st_gnn_graph_laplacian():
    laplacian, nodes = SpatialTemporalRoadGraph.get_adjacency_matrix()
    assert laplacian.shape == (len(nodes), len(nodes))
    # Check diagonal elements are positive (self-loops present)
    for i in range(len(nodes)):
        assert laplacian[i, i] > 0.0


def test_st_gnn_prediction_clear_dry_highway():
    model = STGNNModel()
    pred = model.predict_corridor_degradation(
        corridor_id="cor-nh27",
        iri_score=2.8,
        elevation_m=85.0,
        gradient_pct=1.2,
        rainfall_mm_hr=0.0,
        temperature_celsius=24.0,
        vibration_rms=0.4,
    )
    assert 0.0 <= pred["degradation_risk"] <= 1.0
    assert pred["degradation_risk"] < 0.35
    assert pred["risk_level"] == "Low Degradation Risk"


def test_st_gnn_prediction_monsoon_mountain_pass():
    model = STGNNModel()
    # High rainfall + steep ghat slope + rough IRI + high vibration
    pred = model.predict_corridor_degradation(
        corridor_id="cor-nh10",
        iri_score=7.5,
        elevation_m=1650.0,
        gradient_pct=8.5,
        rainfall_mm_hr=28.0,
        temperature_celsius=20.0,
        vibration_rms=2.2,
        historical_incidents=5,
        is_live_telemetry=True,
    )
    assert pred["degradation_risk"] > 0.50
    assert pred["confidence"] >= 0.85
    assert pred["is_simulated"] is False
    assert any("rainfall" in d.lower() or "roughness" in d.lower() for d in pred["governing_drivers"])


@pytest.mark.asyncio
async def test_st_gnn_service_corridors_list():
    corridors = await STGNNService.get_all_corridors_degradation_risks()
    assert len(corridors) >= 6
    for c in corridors:
        assert "degradation_risk" in c
        assert "confidence" in c
        assert "risk_level" in c
        assert "name" in c
