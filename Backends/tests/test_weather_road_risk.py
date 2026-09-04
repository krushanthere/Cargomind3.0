import pytest
from datetime import datetime, timezone
from app.services.weather.base import BaseWeatherProvider, WeatherData
from app.services.weather.open_meteo import OpenMeteoProvider
from app.services.weather.service import WeatherService
from app.services.accessibility.scorer import AccessibilityScorer
from app.schemas.accessibility import AccessibilityCalculationRequest


class MockWeatherProvider(BaseWeatherProvider):
    def __init__(self, rain_rate: float = 0.0, accum_24h: float = 0.0, temp: float = 24.0, alert: str = None):
        self.rain_rate = rain_rate
        self.accum_24h = accum_24h
        self.temp = temp
        self.alert = alert

    async def get_weather(self, lat: float, lon: float, timestamp=None) -> WeatherData:
        return WeatherData(
            lat=lat,
            lon=lon,
            timestamp=datetime.now(timezone.utc),
            temperature_celsius=self.temp,
            rainfall_mm_hr=self.rain_rate,
            accumulated_rain_24h_mm=self.accum_24h,
            precipitation_probability_pct=90.0 if self.rain_rate > 0 else 10.0,
            humidity_pct=85.0 if self.rain_rate > 0 else 60.0,
            wind_speed_kmh=15.0,
            weather_code=65 if self.rain_rate > 15 else (61 if self.rain_rate > 0 else 0),
            weather_description="Rain" if self.rain_rate > 0 else "Clear",
            severe_weather_alert=self.alert,
            is_monsoon_risk=self.rain_rate > 5.0,
            source="mock",
        )


@pytest.mark.asyncio
async def test_weather_service_clear_conditions():
    mock_prov = MockWeatherProvider(rain_rate=0.0, accum_24h=0.0, temp=25.0)
    WeatherService.set_provider(mock_prov)

    obs = await WeatherService.get_weather(26.18, 91.74)
    assert obs.rainfall_mm_hr == 0.0
    assert obs.temperature_celsius == 25.0

    risk = WeatherService.calculate_weather_risk_factor(obs)
    assert risk["weather_risk"] < 0.1
    assert "Optimal" in risk["risk_level"]


@pytest.mark.asyncio
async def test_weather_service_heavy_monsoon_rain():
    mock_prov = MockWeatherProvider(rain_rate=24.0, accum_24h=95.0, temp=22.0)
    WeatherService.set_provider(mock_prov)

    obs = await WeatherService.get_weather(25.27, 91.73)  # Cherrapunji coords
    assert obs.rainfall_mm_hr == 24.0

    risk = WeatherService.calculate_weather_risk_factor(obs)
    assert risk["weather_risk"] >= 0.65
    assert "Severe" in risk["risk_level"] or "Moderate" in risk["risk_level"]


@pytest.mark.asyncio
async def test_combine_road_risk_weights():
    # IRI = 0.5 (medium roughness), Elevation = 0.4 (hilly), Weather = 0.8 (heavy rain)
    res = WeatherService.combine_road_risk(
        iri_risk=0.5,
        elevation_risk=0.4,
        weather_risk=0.8,
        w_iri=0.45,
        w_elevation=0.30,
        w_weather=0.25,
    )
    expected_risk = (0.45 * 0.5 + 0.30 * 0.4 + 0.25 * 0.8) / 1.0  # 0.225 + 0.120 + 0.200 = 0.545
    assert abs(res["combined_road_risk"] - expected_risk) < 0.01
    assert res["accessibility_score"] == round((1.0 - expected_risk) * 100, 1)
    assert res["weather_integrated"] is True


@pytest.mark.asyncio
async def test_combine_road_risk_fallback_when_no_weather():
    # When weather_risk is None, weights redistribute to IRI + Elevation only
    res = WeatherService.combine_road_risk(
        iri_risk=0.6,
        elevation_risk=0.4,
        weather_risk=None,
        w_iri=0.45,
        w_elevation=0.30,
        w_weather=0.25,
    )
    expected_risk = (0.45 * 0.6 + 0.30 * 0.4) / 0.75  # (0.27 + 0.12) / 0.75 = 0.52
    assert abs(res["combined_road_risk"] - expected_risk) < 0.01
    assert res["weather_risk"] == 0.0


@pytest.mark.asyncio
async def test_accessibility_scorer_incorporates_weather():
    req = AccessibilityCalculationRequest(
        lat=26.1820,
        lon=91.7450,
        state="Assam",
        road_surface="asphalt",
        road_status="clear",
        slope_pct=3.0,
        elevation_m=55.0,
        season="monsoon",
        rainfall_mm_hr=28.0,  # Torrential rain
    )
    item = AccessibilityScorer.calculate_custom_score(req)
    assert item.breakdown.rainfall_risk is not None
    assert item.breakdown.rainfall_risk > 0.5
    assert "Rainfall: 28.0 mm/h" in item.breakdown.weather_summary
    assert item.rainfall_mm_hr == 28.0
