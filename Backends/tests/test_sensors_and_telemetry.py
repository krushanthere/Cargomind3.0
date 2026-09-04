import pytest
import math
from app.services.sensors.processor import SensorDataProcessor


def test_sensor_accelerometer_gravity_removal_and_rms():
    # Simulate a stream of accelerometer readings at rest (z ~ 9.81) plus small vibration oscillation
    samples = []
    for i in range(100):
        # 2 Hz oscillation with amplitude 1.5 m/s^2 on top of gravity
        t = i * 0.05
        ax = 1.2 * math.sin(2 * math.pi * 2 * t)
        ay = 0.8 * math.cos(2 * math.pi * 2 * t)
        az = 9.81 + 1.5 * math.sin(2 * math.pi * 3 * t)
        samples.append({"x": ax, "y": ay, "z": az, "timestamp": f"2026-09-04T10:00:{i:02d}Z"})

    summary = SensorDataProcessor.process_accelerometer_stream(samples, duration_seconds=5.0)
    assert summary["sample_count"] == 100
    assert summary["duration_seconds"] == 5.0
    assert summary["rms_acceleration"] > 0.5
    assert summary["peak_acceleration"] > 1.2
    assert summary["is_active"] is True
    assert "Moderate" in summary["bumpiness_level"] or "High" in summary["bumpiness_level"]


def test_sensor_temperature_source_attribution():
    # Case 1: Direct sensor reading available
    r_sensor = SensorDataProcessor.format_temperature_reading(sensor_temp=34.2, weather_temp=31.0)
    assert r_sensor["source"] == "sensor"
    assert r_sensor["temperature_celsius"] == 34.2
    assert r_sensor["is_sensor_available"] is True

    # Case 2: Only weather temperature available
    r_weather = SensorDataProcessor.format_temperature_reading(sensor_temp=None, weather_temp=29.5)
    assert r_weather["source"] == "weather"
    assert r_weather["temperature_celsius"] == 29.5
    assert r_weather["is_sensor_available"] is False

    # Case 3: Only shipment profile baseline available
    r_spec = SensorDataProcessor.format_temperature_reading(sensor_temp=None, weather_temp=None, shipment_target_temp=4.0)
    assert r_spec["source"] == "shipment_spec"
    assert r_spec["temperature_celsius"] == 4.0

    # Case 4: None available (clearly marked unavailable, never fabricated)
    r_none = SensorDataProcessor.format_temperature_reading(sensor_temp=None, weather_temp=None, shipment_target_temp=None)
    assert r_none["source"] == "unavailable"
    assert r_none["temperature_celsius"] is None
