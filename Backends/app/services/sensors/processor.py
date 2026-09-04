import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings


class SensorDataProcessor:
    """Processes smartphone & IoT accelerometer and temperature telemetry:
    - Removes baseline gravity (high-pass filter / norm offset)
    - Computes RMS acceleration, Peak acceleration, Vector magnitude, and Variance
    - Categorizes road bumpiness / roughness
    - Formats temperature with strict source attribution (sensor vs weather vs profile vs unavailable)
    - Integrates with PINN Stress-Decay Layer
    """

    GRAVITY_MS2: float = 9.80665

    @classmethod
    def process_accelerometer_stream(
        cls,
        samples: List[Dict[str, Any]],
        duration_seconds: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Processes raw accelerometer samples: [{x, y, z, timestamp}].

        Returns summary metrics: RMS, Peak, Variance, Bumpiness Level, Duration.
        """
        if not samples:
            return {
                "sample_count": 0,
                "duration_seconds": 0.0,
                "duration_formatted": "00:00",
                "rms_acceleration": 0.0,
                "peak_acceleration": 0.0,
                "mean_magnitude": 0.0,
                "variance": 0.0,
                "bumpiness_level": "Unavailable",
                "bumpiness_emoji": "⚪",
                "is_active": False,
            }

        magnitudes = []
        timestamps = []

        for s in samples:
            x = float(s.get("x", 0.0))
            y = float(s.get("y", 0.0))
            z = float(s.get("z", 0.0))

            # Magnitude with gravity compensation:
            # If device reports including gravity (~9.81m/s^2 at rest), subtract gravity.
            # If device already uses userAcceleration (linear acceleration without gravity), norm is directly usable.
            raw_norm = math.sqrt(x * x + y * y + z * z)
            if raw_norm > 5.0:
                dyn_mag = abs(raw_norm - cls.GRAVITY_MS2)
            else:
                dyn_mag = raw_norm

            magnitudes.append(dyn_mag)
            if "timestamp" in s:
                timestamps.append(s["timestamp"])

        n = len(magnitudes)
        mean_mag = sum(magnitudes) / n
        sq_sum = sum(m * m for m in magnitudes)
        rms = math.sqrt(sq_sum / n)
        peak = max(magnitudes)
        variance = sum((m - mean_mag) ** 2 for m in magnitudes) / max(1, n - 1)

        # Estimate duration
        if duration_seconds is not None:
            dur_sec = max(0.1, float(duration_seconds))
        elif len(timestamps) >= 2:
            try:
                t0 = datetime.fromisoformat(str(timestamps[0]).replace("Z", "+00:00"))
                t1 = datetime.fromisoformat(str(timestamps[-1]).replace("Z", "+00:00"))
                dur_sec = max(0.5, abs((t1 - t0).total_seconds()))
            except Exception:
                dur_sec = max(0.5, n * 0.05)  # Assume ~20Hz sampling rate
        else:
            dur_sec = max(0.5, n * 0.05)

        mins = int(dur_sec // 60)
        secs = int(dur_sec % 60)
        dur_formatted = f"{mins:02d}:{secs:02d}"

        # Categorize bumpiness / vibration roughness
        if rms > 2.2 or peak > 5.0:
            bumpiness = "High (Severe Potholes / Unpaved Ghat)"
            emoji = "🔴"
        elif rms > 1.0 or peak > 2.5:
            bumpiness = "Moderate (Bumpy / Patchwork Pavement)"
            emoji = "🟡"
        elif rms > 0.4:
            bumpiness = "Low (Standard Rural Asphalt)"
            emoji = "🟢"
        else:
            bumpiness = "Smooth (Express Corridor)"
            emoji = "🟢"

        return {
            "sample_count": n,
            "duration_seconds": round(dur_sec, 2),
            "duration_formatted": dur_formatted,
            "rms_acceleration": round(rms, 3),
            "peak_acceleration": round(peak, 3),
            "mean_magnitude": round(mean_mag, 3),
            "variance": round(variance, 4),
            "bumpiness_level": bumpiness,
            "bumpiness_emoji": emoji,
            "is_active": True,
        }

    @classmethod
    def format_temperature_reading(
        cls,
        sensor_temp: Optional[float] = None,
        weather_temp: Optional[float] = None,
        shipment_target_temp: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Distinguishes temperature telemetry by authentic source.
        Never fabricates sensor readings.
        """
        if sensor_temp is not None:
            return {
                "temperature_celsius": round(float(sensor_temp), 1),
                "source": "sensor",
                "source_label": "Direct Device / Thermistor Sensor",
                "is_sensor_available": True,
                "confidence": "high",
            }
        elif weather_temp is not None:
            return {
                "temperature_celsius": round(float(weather_temp), 1),
                "source": "weather",
                "source_label": "External Weather API Telemetry",
                "is_sensor_available": False,
                "confidence": "medium",
            }
        elif shipment_target_temp is not None:
            return {
                "temperature_celsius": round(float(shipment_target_temp), 1),
                "source": "shipment_spec",
                "source_label": "Nominal Shipment Class Baseline",
                "is_sensor_available": False,
                "confidence": "low",
            }
        else:
            return {
                "temperature_celsius": None,
                "source": "unavailable",
                "source_label": "Temperature Unavailable",
                "is_sensor_available": False,
                "confidence": "none",
            }
