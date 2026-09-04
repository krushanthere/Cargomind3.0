import asyncio
from datetime import datetime, timezone
import math
from typing import Optional, Dict, Tuple, Any
import httpx

from app.core.config import settings
from app.services.weather.base import BaseWeatherProvider, WeatherData


# WMO Weather interpretation codes (WW)
WMO_DESCRIPTIONS: Dict[int, str] = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


class OpenMeteoProvider(BaseWeatherProvider):
    """Open-Meteo Weather API Provider with in-memory TTL caching and graceful climate model fallback."""

    def __init__(self, timeout_seconds: float = 3.0, cache_ttl_seconds: int = 900):
        self.timeout = timeout_seconds
        self.cache_ttl = cache_ttl_seconds
        # In-memory cache keyed by (rounded_lat, rounded_lon) -> (timestamp, WeatherData)
        self._cache: Dict[Tuple[float, float], Tuple[float, WeatherData]] = {}

    def _get_cache_key(self, lat: float, lon: float) -> Tuple[float, float]:
        # Spatial resolution of ~0.1 deg (~11 km) for caching
        return (round(lat, 1), round(lon, 1))

    async def get_weather(
        self,
        lat: float,
        lon: float,
        timestamp: Optional[datetime] = None,
    ) -> WeatherData:
        now_utc = datetime.now(timezone.utc)
        cache_key = self._get_cache_key(lat, lon)
        now_ts = now_utc.timestamp()

        # Check cache
        if cache_key in self._cache:
            cached_ts, cached_data = self._cache[cache_key]
            if (now_ts - cached_ts) < self.cache_ttl:
                return cached_data

        # Attempt to query Open-Meteo REST API
        try:
            params = {
                "latitude": lat,
                "longitude": lon,
                "current": [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "precipitation",
                    "rain",
                    "weather_code",
                    "wind_speed_10m",
                ],
                "hourly": [
                    "precipitation_probability",
                    "rain",
                ],
                "forecast_days": 1,
                "timezone": "auto",
            }
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(settings.OPENMETEO_BASE_URL, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    current = data.get("current", {})
                    hourly = data.get("hourly", {})

                    temp = float(current.get("temperature_2m", 26.0))
                    rain_rate = float(current.get("rain", current.get("precipitation", 0.0)))
                    humidity = float(current.get("relative_humidity_2m", 70.0))
                    wind = float(current.get("wind_speed_10m", 10.0))
                    w_code = int(current.get("weather_code", 0))

                    # Hourly accumulation / probability
                    rain_series = hourly.get("rain", [])
                    accumulated_24h = sum(float(r) for r in rain_series) if rain_series else rain_rate * 4
                    prob_series = hourly.get("precipitation_probability", [])
                    precip_prob = float(prob_series[0]) if prob_series else (90.0 if rain_rate > 2.0 else 20.0)

                    w_desc = WMO_DESCRIPTIONS.get(w_code, "Partly cloudy")
                    alert = None
                    if w_code in [82, 95, 96, 99] or rain_rate > 20.0:
                        alert = f"Severe Weather Warning: {w_desc} with intense precipitation ({rain_rate:.1f} mm/h)"

                    is_monsoon = rain_rate > 3.0 or accumulated_24h > 35.0 or (now_utc.month in [6, 7, 8, 9] and humidity > 75.0)

                    weather_obj = WeatherData(
                        lat=lat,
                        lon=lon,
                        timestamp=now_utc,
                        temperature_celsius=temp,
                        rainfall_mm_hr=rain_rate,
                        accumulated_rain_24h_mm=round(accumulated_24h, 1),
                        precipitation_probability_pct=round(precip_prob, 1),
                        humidity_pct=round(humidity, 1),
                        wind_speed_kmh=round(wind, 1),
                        weather_code=w_code,
                        weather_description=w_desc,
                        severe_weather_alert=alert,
                        is_monsoon_risk=is_monsoon,
                        source="openmeteo",
                        raw_payload={"current": current},
                    )

                    self._cache[cache_key] = (now_ts, weather_obj)
                    return weather_obj
        except Exception:
            pass

        # Fallback to authentic regional NER climate model
        return self._regional_climate_fallback(lat, lon, now_utc)

    def _regional_climate_fallback(self, lat: float, lon: float, current_time: datetime) -> WeatherData:
        """Deterministic North-Eastern Region (NER) climate baseline when live API is unreachable."""
        month = current_time.month
        is_monsoon_season = month in [5, 6, 7, 8, 9]

        # Cherrapunji / Mawsynram / Meghalaya Plateau coordinates have exceptionally high rainfall
        is_meghalaya = (25.0 <= lat <= 26.0) and (90.0 <= lon <= 92.8)
        is_highland = lat > 27.0 or (lat > 25.5 and lon > 93.5)

        if is_monsoon_season:
            temp = 24.5 if not is_highland else 18.0
            rain_rate = 14.5 if is_meghalaya else 6.2
            accumulated_24h = 85.0 if is_meghalaya else 42.0
            precip_prob = 85.0
            humidity = 88.0
            w_code = 63 if not is_meghalaya else 65
            w_desc = "Moderate Monsoon Rain" if not is_meghalaya else "Heavy Monsoon Downpour"
            is_monsoon_risk = True
            alert = "Monsoon Precipitation Active (Regional Baseline)"
        else:
            temp = 22.0 if not is_highland else 12.0
            rain_rate = 0.0
            accumulated_24h = 0.5
            precip_prob = 10.0
            humidity = 60.0
            w_code = 1
            w_desc = "Mainly Clear"
            is_monsoon_risk = False
            alert = None

        return WeatherData(
            lat=lat,
            lon=lon,
            timestamp=current_time,
            temperature_celsius=temp,
            rainfall_mm_hr=rain_rate,
            accumulated_rain_24h_mm=accumulated_24h,
            precipitation_probability_pct=precip_prob,
            humidity_pct=humidity,
            wind_speed_kmh=12.0,
            weather_code=w_code,
            weather_description=w_desc,
            severe_weather_alert=alert,
            is_monsoon_risk=is_monsoon_risk,
            source="regional_climate_model",
        )
