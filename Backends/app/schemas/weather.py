from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class WeatherObservationResponse(BaseModel):
    lat: float
    lon: float
    timestamp: datetime
    temperature_celsius: float
    rainfall_mm_hr: float
    accumulated_rain_24h_mm: float
    precipitation_probability_pct: float
    humidity_pct: float
    wind_speed_kmh: float
    weather_code: int
    weather_description: str
    severe_weather_alert: Optional[str] = None
    is_monsoon_risk: bool
    source: str


class WeatherRiskCalculationRequest(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0)
    lon: float = Field(..., ge=-180.0, le=180.0)
    iri_score: Optional[float] = Field(default=3.5, description="IRI Road Roughness Index (m/km)")
    elevation_m: Optional[float] = Field(default=150.0, description="SRTM Elevation in meters")
    slope_pct: Optional[float] = Field(default=2.5, description="Terrain gradient slope percentage")
    w_iri: Optional[float] = None
    w_elevation: Optional[float] = None
    w_weather: Optional[float] = None


class WeatherRiskResponse(BaseModel):
    weather_risk: float = Field(..., ge=0.0, le=1.0)
    risk_level: str
    combined_road_risk: float = Field(..., ge=0.0, le=1.0)
    accessibility_score: float = Field(..., ge=0.0, le=100.0)
    iri_risk: float
    elevation_risk: float
    rainfall_mm_hr: float
    accumulated_rain_24h_mm: float
    precipitation_probability_pct: float
    temperature_celsius: float
    severe_alert: Optional[str] = None
    is_monsoon_risk: bool
    weights: Dict[str, float]
    weather_source: str
    weather_integrated: bool
