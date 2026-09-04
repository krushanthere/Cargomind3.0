from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, Dict, Any


@dataclass
class WeatherData:
    lat: float
    lon: float
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    temperature_celsius: float = 26.0
    rainfall_mm_hr: float = 0.0
    accumulated_rain_24h_mm: float = 0.0
    precipitation_probability_pct: float = 0.0
    humidity_pct: float = 65.0
    wind_speed_kmh: float = 10.0
    weather_code: int = 0
    weather_description: str = "Clear"
    severe_weather_alert: Optional[str] = None
    is_monsoon_risk: bool = False
    source: str = "openmeteo"
    raw_payload: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "lat": self.lat,
            "lon": self.lon,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "temperature_celsius": self.temperature_celsius,
            "rainfall_mm_hr": self.rainfall_mm_hr,
            "accumulated_rain_24h_mm": self.accumulated_rain_24h_mm,
            "precipitation_probability_pct": self.precipitation_probability_pct,
            "humidity_pct": self.humidity_pct,
            "wind_speed_kmh": self.wind_speed_kmh,
            "weather_code": self.weather_code,
            "weather_description": self.weather_description,
            "severe_weather_alert": self.severe_weather_alert,
            "is_monsoon_risk": self.is_monsoon_risk,
            "source": self.source,
        }


class BaseWeatherProvider(ABC):
    """Abstract interface for weather providers (OpenMeteo, OpenWeatherMap, Mock, etc.)."""

    @abstractmethod
    async def get_weather(
        self,
        lat: float,
        lon: float,
        timestamp: Optional[datetime] = None,
    ) -> WeatherData:
        """Fetch weather observations for the specified coordinate."""
        pass
