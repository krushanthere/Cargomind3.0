from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple
from app.core.config import settings
from app.services.weather.base import BaseWeatherProvider, WeatherData
from app.services.weather.open_meteo import OpenMeteoProvider


class WeatherService:
    """Unified Weather Intelligence and Road-Risk Integration Service.
    Incorporates real-time / recent weather and rainfall into the accessibility & road-risk pipeline.
    """

    _provider_instance: Optional[BaseWeatherProvider] = None

    @classmethod
    def get_provider(cls) -> BaseWeatherProvider:
        if cls._provider_instance is None:
            provider_type = (settings.WEATHER_PROVIDER or "openmeteo").lower()
            if provider_type == "openmeteo":
                cls._provider_instance = OpenMeteoProvider()
            else:
                cls._provider_instance = OpenMeteoProvider()
        return cls._provider_instance

    @classmethod
    def set_provider(cls, provider: BaseWeatherProvider) -> None:
        """Allow replacing the provider at runtime (e.g. for testing or custom sensors)."""
        cls._provider_instance = provider

    @classmethod
    async def get_weather(
        cls,
        lat: float,
        lon: float,
        timestamp: Optional[datetime] = None,
    ) -> WeatherData:
        """Fetch weather data using the active provider."""
        provider = cls.get_provider()
        return await provider.get_weather(lat, lon, timestamp)

    @staticmethod
    def calculate_weather_risk_factor(weather: Optional[WeatherData]) -> Dict[str, Any]:
        """Calculates a normalized weather-risk factor in [0.0, 1.0].
        Rainfall/precipitation is prioritized as the primary road-risk driver.

        Risk formula:
        - Rainfall intensity (mm/hr): 0 to 30+ mm/h -> normalized to [0, 1]
        - Accumulated 24h rainfall (mm): 0 to 100+ mm -> normalized to [0, 1]
        - Precipitation probability (%): 0 to 100% -> normalized to [0, 1]
        - Severe weather warning modifier: boosts risk if active thunderstorm/cloudburst
        """
        if not weather or not settings.FEATURE_WEATHER_RISK_ENABLED:
            return {
                "weather_risk": 0.0,
                "risk_level": "Neutral / Weather Disabled",
                "intensity_component": 0.0,
                "accumulation_component": 0.0,
                "probability_component": 0.0,
                "rainfall_mm_hr": 0.0,
                "accumulated_rain_24h_mm": 0.0,
                "precipitation_probability_pct": 0.0,
                "temperature_celsius": 25.0,
                "severe_alert": None,
                "is_monsoon_risk": False,
                "source": "disabled_or_unavailable",
            }

        # 1. Rainfall intensity risk (torrential threshold = 30 mm/h)
        intensity_risk = min(1.0, max(0.0, weather.rainfall_mm_hr / 30.0))

        # 2. Accumulated rainfall risk (saturated soil / flash flood threshold = 100 mm)
        accum_risk = min(1.0, max(0.0, weather.accumulated_rain_24h_mm / 100.0))

        # 3. Precipitation probability risk
        prob_risk = min(1.0, max(0.0, weather.precipitation_probability_pct / 100.0))

        # Weighted composite weather-risk factor
        composite_weather_risk = (0.50 * intensity_risk) + (0.30 * accum_risk) + (0.20 * prob_risk)

        # Severe weather alert boost
        if weather.severe_weather_alert:
            composite_weather_risk = max(composite_weather_risk, 0.85)

        composite_weather_risk = round(min(1.0, max(0.0, composite_weather_risk)), 4)

        if composite_weather_risk >= 0.70:
            level = "Severe Rain Hazard"
        elif composite_weather_risk >= 0.40:
            level = "Moderate Rain Hazard"
        elif composite_weather_risk >= 0.15:
            level = "Low Rain Hazard"
        else:
            level = "Optimal / Dry Conditions"

        return {
            "weather_risk": composite_weather_risk,
            "risk_level": level,
            "intensity_component": round(intensity_risk, 3),
            "accumulation_component": round(accum_risk, 3),
            "probability_component": round(prob_risk, 3),
            "rainfall_mm_hr": weather.rainfall_mm_hr,
            "accumulated_rain_24h_mm": weather.accumulated_rain_24h_mm,
            "precipitation_probability_pct": weather.precipitation_probability_pct,
            "temperature_celsius": weather.temperature_celsius,
            "severe_alert": weather.severe_weather_alert,
            "is_monsoon_risk": weather.is_monsoon_risk,
            "source": weather.source,
        }

    @staticmethod
    def combine_road_risk(
        iri_risk: float,
        elevation_risk: float,
        weather_risk: Optional[float] = None,
        w_iri: Optional[float] = None,
        w_elevation: Optional[float] = None,
        w_weather: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Combines normalized IRI road roughness, SRTM elevation/terrain slope risk,
        and weather/rainfall risk using configurable weights.

        Formula:
            road_risk = w_iri * iri_risk + w_elevation * elevation_risk + w_weather * weather_risk
        """
        w_iri = w_iri if w_iri is not None else settings.WEIGHT_IRI_RISK
        w_elevation = w_elevation if w_elevation is not None else settings.WEIGHT_ELEVATION_RISK
        w_weather = w_weather if w_weather is not None else settings.WEIGHT_WEATHER_RISK

        # Normalize inputs to [0, 1]
        norm_iri = max(0.0, min(1.0, float(iri_risk)))
        norm_elev = max(0.0, min(1.0, float(elevation_risk)))

        if weather_risk is not None and settings.FEATURE_WEATHER_RISK_ENABLED:
            norm_weather = max(0.0, min(1.0, float(weather_risk)))
            total_w = w_iri + w_elevation + w_weather
            combined = (
                (w_iri * norm_iri) + (w_elevation * norm_elev) + (w_weather * norm_weather)
            ) / max(0.001, total_w)
            active_weights = {
                "w_iri": round(w_iri, 2),
                "w_elevation": round(w_elevation, 2),
                "w_weather": round(w_weather, 2),
            }
        else:
            # Fallback when weather data is disabled or unavailable
            norm_weather = 0.0
            total_w = w_iri + w_elevation
            combined = ((w_iri * norm_iri) + (w_elevation * norm_elev)) / max(0.001, total_w)
            active_weights = {
                "w_iri": round(w_iri / total_w, 2),
                "w_elevation": round(w_elevation / total_w, 2),
                "w_weather": 0.0,
            }

        combined = round(min(1.0, max(0.0, combined)), 4)
        accessibility_score = round((1.0 - combined) * 100.0, 1)

        return {
            "combined_road_risk": combined,
            "accessibility_score": accessibility_score,
            "iri_risk": norm_iri,
            "elevation_risk": norm_elev,
            "weather_risk": norm_weather,
            "weights": active_weights,
            "weather_integrated": weather_risk is not None and settings.FEATURE_WEATHER_RISK_ENABLED,
        }
