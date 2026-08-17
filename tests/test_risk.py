import pytest
from datetime import datetime, timezone, timedelta
from app.services.risk.spoilage_model import SpoilageRiskModel
from app.services.risk.delay_model import DelayRiskModel
from app.models.shipment import TempClass


def test_spoilage_risk_model():
    model = SpoilageRiskModel()
    res_frozen = model.calculate_spoilage_risk(TempClass.frozen, transit_hrs=24.0)
    assert 0.0 <= res_frozen["spoilage_risk_score"] <= 1.0
    assert res_frozen["remaining_shelf_life_pct"] > 80.0

    res_chilled = model.calculate_spoilage_risk(TempClass.chilled, transit_hrs=72.0)
    assert 0.0 <= res_chilled["spoilage_risk_score"] <= 1.0


def test_delay_risk_model():
    model = DelayRiskModel()
    res = model.predict_delay_probability(
        mode="road",
        season="monsoon",
        departure_hour=14,
        historical_reliability=0.80,
        avg_transit_hrs=30.0,
    )
    assert 0.0 <= res["delay_probability"] <= 1.0
    assert res["predicted_delay_hrs"] > 0
