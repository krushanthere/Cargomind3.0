from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.weather import (
    WeatherObservationResponse,
    WeatherRiskCalculationRequest,
    WeatherRiskResponse,
)
from app.services.weather.service import WeatherService

router = APIRouter(prefix="/weather", tags=["Weather Intelligence & Road-Risk Integration"])


@router.get("/current", response_model=WeatherObservationResponse)
async def get_current_weather(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude"),
):
    """Retrieve real-time / current weather telemetry (rainfall rate, 24h accumulation,
    precipitation probability, temperature, humidity, severe alerts) for given coordinates.
    """
    try:
        data = await WeatherService.get_weather(lat, lon)
        return WeatherObservationResponse(
            lat=data.lat,
            lon=data.lon,
            timestamp=data.timestamp,
            temperature_celsius=data.temperature_celsius,
            rainfall_mm_hr=data.rainfall_mm_hr,
            accumulated_rain_24h_mm=data.accumulated_rain_24h_mm,
            precipitation_probability_pct=data.precipitation_probability_pct,
            humidity_pct=data.humidity_pct,
            wind_speed_kmh=data.wind_speed_kmh,
            weather_code=data.weather_code,
            weather_description=data.weather_description,
            severe_weather_alert=data.severe_weather_alert,
            is_monsoon_risk=data.is_monsoon_risk,
            source=data.source,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch weather telemetry: {str(e)}",
        )


@router.post("/risk-factor", response_model=WeatherRiskResponse)
async def calculate_weather_road_risk(
    payload: WeatherRiskCalculationRequest,
):
    """Compute weather-integrated road-risk and NER Accessibility score.
    Combines:
    1. IRI Road Roughness Index
    2. SRTM Elevation & Terrain Gradient
    3. Real-Time Rainfall Intensity & Precipitation Risk
    """
    try:
        weather_obs = await WeatherService.get_weather(payload.lat, payload.lon)
        w_factor = WeatherService.calculate_weather_risk_factor(weather_obs)

        # Normalize IRI risk: typical IRI 2.0 (excellent) to 14.0+ (very rough/eroded)
        iri_val = payload.iri_score or 3.5
        norm_iri = min(1.0, max(0.0, (iri_val - 2.0) / 10.0))

        # Normalize elevation/gradient risk: slope 0% to 25%+
        slope = payload.slope_pct or 2.5
        elev = payload.elevation_m or 100.0
        norm_elev = min(1.0, max(0.0, (slope / 20.0) * 0.7 + (elev / 2500.0) * 0.3))

        combined_res = WeatherService.combine_road_risk(
            iri_risk=norm_iri,
            elevation_risk=norm_elev,
            weather_risk=w_factor["weather_risk"],
            w_iri=payload.w_iri,
            w_elevation=payload.w_elevation,
            w_weather=payload.w_weather,
        )

        return WeatherRiskResponse(
            weather_risk=w_factor["weather_risk"],
            risk_level=w_factor["risk_level"],
            combined_road_risk=combined_res["combined_road_risk"],
            accessibility_score=combined_res["accessibility_score"],
            iri_risk=round(norm_iri, 3),
            elevation_risk=round(norm_elev, 3),
            rainfall_mm_hr=weather_obs.rainfall_mm_hr,
            accumulated_rain_24h_mm=weather_obs.accumulated_rain_24h_mm,
            precipitation_probability_pct=weather_obs.precipitation_probability_pct,
            temperature_celsius=weather_obs.temperature_celsius,
            severe_alert=weather_obs.severe_weather_alert,
            is_monsoon_risk=weather_obs.is_monsoon_risk,
            weights=combined_res["weights"],
            weather_source=weather_obs.source,
            weather_integrated=combined_res["weather_integrated"],
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate weather-integrated risk: {str(e)}",
        )
