import math
from typing import Optional, Dict, Any
from app.core.config import settings


class StressDecayModel:
    """Physics-Informed Neural / Kinetic Stress-Decay Model (PINN Layer).

    Layered additively on top of Arrhenius / Q10 thermal degradation kinetics:
        final_decay = thermal_decay * stress_multiplier

    Physical Constraints Enforced:
    1. Zero vibration / no sensor data -> stress_multiplier = 1.0 (Neutral, zero added decay)
    2. Monotonicity w.r.t vibration intensity: d(Damage)/d(RMS) >= 0
    3. Monotonicity w.r.t duration: d(Damage)/d(t) >= 0
    4. Synergistic thermal-mechanical coupling: high temp softens produce/packaging tissue,
       amplifying mechanical impact bruising.
    """

    # Configurable physical calibration constants
    # Baseline nominal vibration threshold for smooth paved highway (m/s^2)
    BASELINE_RMS_THRESHOLD: float = 0.50
    # Peak shock threshold where structural bruising commences (m/s^2)
    SHOCK_PEAK_THRESHOLD: float = 2.50
    # Power-law fatigue exponent for perishable organic goods (Paris' law / Manson-Coffin analogue)
    FATIGUE_EXPONENT: float = 1.45
    # Thermal softening coupling coefficient (per degree C above 15°C)
    THERMAL_COUPLING_COEFF: float = 0.015

    @classmethod
    def calculate_stress_multiplier(
        cls,
        temperature_celsius: float = 22.0,
        vibration_rms: Optional[float] = None,
        peak_acceleration: Optional[float] = None,
        duration_hrs: float = 1.0,
        vibration_intensity: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Calculates mechanical stress factor and multiplier from vibration telemetry.

        Args:
            temperature_celsius: Ambient/container temperature
            vibration_rms: Root-mean-square acceleration in m/s^2 (excluding gravity)
            peak_acceleration: Peak transient shock acceleration in m/s^2
            duration_hrs: Exposure duration in transit hours
            vibration_intensity: Optional qualitative tag ("low", "moderate", "high", "severe")

        Returns:
            Dict containing stress_factor [0, 1], stress_multiplier [1.0, 3.5],
            mechanical_damage [0, 1], and confidence.
        """
        if not settings.FEATURE_STRESS_DECAY_ENABLED:
            return cls._neutral_fallback("Feature Disabled")

        # Mandatory Fallback: When no vibration/accelerometer data exists
        if vibration_rms is None and peak_acceleration is None and not vibration_intensity:
            return cls._neutral_fallback("No Sensor Telemetry")

        # Derive RMS from intensity string if numerical RMS is absent
        if vibration_rms is None:
            intensity_map = {"low": 0.4, "moderate": 1.2, "high": 2.2, "severe": 3.8}
            vibration_rms = intensity_map.get((vibration_intensity or "low").lower(), 0.0)

        # Sanitize and bound inputs (guard against NaN / negative / physical impossibilities)
        rms = max(0.0, min(20.0, float(vibration_rms)))
        peak = max(rms, min(30.0, float(peak_acceleration or (rms * 1.8))))
        dur = max(0.01, min(168.0, float(duration_hrs)))
        temp = max(-30.0, min(65.0, float(temperature_celsius)))

        # Sub-threshold vibration on smooth highway creates negligible stress
        if rms <= cls.BASELINE_RMS_THRESHOLD and peak <= cls.SHOCK_PEAK_THRESHOLD:
            return {
                "stress_factor": 0.0,
                "stress_multiplier": 1.0,
                "mechanical_damage": 0.0,
                "confidence": "high",
                "vibration_level": "Low / Smooth Highway",
                "vibration_rms": round(rms, 3),
                "peak_acceleration": round(peak, 3),
                "duration_hrs": round(dur, 2),
                "thermal_amplification": 1.0,
            }

        # 1. Normalized vibration intensity excess over baseline
        excess_rms = max(0.0, rms - cls.BASELINE_RMS_THRESHOLD)
        excess_peak = max(0.0, peak - cls.SHOCK_PEAK_THRESHOLD)

        # 2. Fatigue stress accumulation (Power-law damage accumulation S-N curve)
        cyclic_stress = (excess_rms ** cls.FATIGUE_EXPONENT) * math.log1p(dur)
        shock_stress = (excess_peak / 5.0) * 0.40
        raw_mechanical_stress = cyclic_stress + shock_stress

        # 3. Thermal-Mechanical Coupling Multiplier
        # Higher temperatures soften plant cellular membranes (turgor loss), multiplying vibration damage
        temp_delta = max(0.0, temp - 15.0)
        thermal_amplification = 1.0 + (temp_delta * cls.THERMAL_COUPLING_COEFF)

        # 4. Final Coupled Mechanical Stress Factor in [0.0, 1.0]
        coupled_stress = raw_mechanical_stress * thermal_amplification
        # Sigmoidal compression to ensure smooth saturation in [0, 1]
        stress_factor = round(1.0 - math.exp(-0.35 * coupled_stress), 4)

        # 5. Stress Multiplier (scales thermal Arrhenius decay by 1.0x to up to 2.5x)
        # e.g., on severe mountain dirt roads with heavy jolting, shelf-life depletion accelerates by ~2.2x
        stress_multiplier = round(1.0 + (1.50 * stress_factor), 4)
        mechanical_damage = round(stress_factor, 4)

        if stress_factor >= 0.65:
            v_level = "Severe Vibration / High Shock"
        elif stress_factor >= 0.35:
            v_level = "Moderate Vibration / Bumpy Road"
        elif stress_factor >= 0.10:
            v_level = "Mild Vibration"
        else:
            v_level = "Minimal Vibration"

        return {
            "stress_factor": stress_factor,
            "stress_multiplier": stress_multiplier,
            "mechanical_damage": mechanical_damage,
            "confidence": "high" if dur >= 0.2 else "low",
            "vibration_level": v_level,
            "vibration_rms": round(rms, 3),
            "peak_acceleration": round(peak, 3),
            "duration_hrs": round(dur, 2),
            "thermal_amplification": round(thermal_amplification, 3),
        }

    @staticmethod
    def _neutral_fallback(reason: str) -> Dict[str, Any]:
        """Neutral fallback returning multiplier=1.0 and zero mechanical damage."""
        return {
            "stress_factor": 0.0,
            "stress_multiplier": 1.0,
            "mechanical_damage": 0.0,
            "confidence": "baseline_fallback",
            "vibration_level": f"Neutral ({reason})",
            "vibration_rms": 0.0,
            "peak_acceleration": 0.0,
            "duration_hrs": 0.0,
            "thermal_amplification": 1.0,
        }
