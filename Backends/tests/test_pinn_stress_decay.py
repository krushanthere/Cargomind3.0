import pytest
from app.services.stress_decay.model import StressDecayModel
from app.services.risk.spoilage_model import SpoilageRiskModel
from app.models.shipment import TempClass


def test_pinn_no_vibration_neutral_fallback():
    # Without sensor data, stress multiplier MUST be exactly 1.0 and mechanical damage 0.0
    res = StressDecayModel.calculate_stress_multiplier(
        temperature_celsius=24.0,
        vibration_rms=None,
        peak_acceleration=None,
    )
    assert res["stress_multiplier"] == 1.0
    assert res["mechanical_damage"] == 0.0
    assert res["stress_factor"] == 0.0


def test_pinn_smooth_highway_low_stress():
    # Very low vibration below threshold (e.g. 0.3 m/s^2)
    res = StressDecayModel.calculate_stress_multiplier(
        temperature_celsius=20.0,
        vibration_rms=0.30,
        peak_acceleration=1.2,
        duration_hrs=2.0,
    )
    assert res["stress_multiplier"] == 1.0
    assert res["mechanical_damage"] == 0.0


def test_pinn_rough_mountain_road_high_stress():
    # Severe vibration on bumpy unpaved track (RMS = 2.4 m/s^2, Peak = 5.2 m/s^2)
    res = StressDecayModel.calculate_stress_multiplier(
        temperature_celsius=28.0,
        vibration_rms=2.4,
        peak_acceleration=5.2,
        duration_hrs=6.0,
    )
    assert res["stress_multiplier"] > 1.30
    assert res["mechanical_damage"] > 0.20
    assert "Severe" in res["vibration_level"] or "Moderate" in res["vibration_level"]


def test_pinn_physical_monotonicity_vibration():
    # Increasing vibration MUST not reduce damage
    m_low = StressDecayModel.calculate_stress_multiplier(temperature_celsius=25.0, vibration_rms=0.8, duration_hrs=3.0)
    m_mid = StressDecayModel.calculate_stress_multiplier(temperature_celsius=25.0, vibration_rms=1.6, duration_hrs=3.0)
    m_high = StressDecayModel.calculate_stress_multiplier(temperature_celsius=25.0, vibration_rms=3.0, duration_hrs=3.0)

    assert m_low["mechanical_damage"] <= m_mid["mechanical_damage"]
    assert m_mid["mechanical_damage"] <= m_high["mechanical_damage"]
    assert m_low["stress_multiplier"] <= m_mid["stress_multiplier"]
    assert m_mid["stress_multiplier"] <= m_high["stress_multiplier"]


def test_pinn_physical_monotonicity_duration():
    # Longer exposure duration MUST not reduce accumulated damage
    d_short = StressDecayModel.calculate_stress_multiplier(temperature_celsius=25.0, vibration_rms=1.8, duration_hrs=1.0)
    d_long = StressDecayModel.calculate_stress_multiplier(temperature_celsius=25.0, vibration_rms=1.8, duration_hrs=12.0)

    assert d_short["mechanical_damage"] <= d_long["mechanical_damage"]
    assert d_short["stress_multiplier"] <= d_long["stress_multiplier"]


def test_spoilage_model_additive_pinn_layer():
    spoilage_model = SpoilageRiskModel()

    # Case A: Thermal baseline without sensor vibration
    res_thermal_only = spoilage_model.calculate_spoilage_risk(
        temp_class=TempClass.chilled,
        transit_hrs=12.0,
        vibration_rms=None,
    )

    # Case B: Same thermal conditions with severe bumpy road vibration
    res_with_vibration = spoilage_model.calculate_spoilage_risk(
        temp_class=TempClass.chilled,
        transit_hrs=12.0,
        vibration_rms=2.8,
        peak_acceleration=6.0,
    )

    assert res_thermal_only["stress_multiplier"] == 1.0
    assert res_with_vibration["stress_multiplier"] > 1.25
    # Combined spoilage risk score must be higher with vibration
    assert res_with_vibration["spoilage_risk_score"] > res_thermal_only["spoilage_risk_score"]
    # Remaining shelf life must be lower with vibration
    assert res_with_vibration["remaining_shelf_life_pct"] < res_thermal_only["remaining_shelf_life_pct"]
    assert res_with_vibration["vibration_telemetry_integrated"] is True
