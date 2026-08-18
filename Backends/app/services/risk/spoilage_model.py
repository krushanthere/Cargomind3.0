import math
import os
import pickle
from typing import Dict, Any, List
from app.models.shipment import TempClass


class SpoilageRiskModel:
    """Computes shelf-life decay using Q10/Arrhenius temperature acceleration models

    and applies a trained ML Gradient Boosting Regressor correction.
    """

    # Baseline storage temperature (°C) and nominal shelf-life (hours) by temp class
    BASELINE_SPECS = {
        TempClass.frozen: {"target_temp": -18.0, "nominal_shelf_life_hrs": 720.0, "q10": 2.5},
        TempClass.chilled: {"target_temp": 4.0, "nominal_shelf_life_hrs": 168.0, "q10": 2.0},
        TempClass.ambient: {"target_temp": 22.0, "nominal_shelf_life_hrs": 2160.0, "q10": 1.5},
    }

    def __init__(self, model_path: str = "ml/artifacts/spoilage_model.pkl"):
        self.model_path = model_path
        self.ml_model = None
        if os.path.exists(model_path):
            try:
                with open(model_path, "rb") as f:
                    self.ml_model = pickle.load(f)
            except Exception:
                self.ml_model = None

    def calculate_spoilage_risk(
        self,
        temp_class: TempClass,
        transit_hrs: float,
        temp_logs: List[Dict[str, Any]] = None,
        ambient_forecast_temp: float = 32.0,
    ) -> Dict[str, float]:
        specs = self.BASELINE_SPECS.get(temp_class, self.BASELINE_SPECS[TempClass.ambient])
        target_temp = specs["target_temp"]
        nominal_shelf_life = specs["nominal_shelf_life_hrs"]
        q10 = specs["q10"]

        # If temperature logs exist, compute actual cumulative kinetic thermal exposure
        if temp_logs and len(temp_logs) > 0:
            total_effective_hrs = 0.0
            avg_temp = sum(l["temp_celsius"] for l in temp_logs) / len(temp_logs)
            dt = transit_hrs / len(temp_logs)

            for log in temp_logs:
                actual_temp = log["temp_celsius"]
                temp_diff = max(0.0, actual_temp - target_temp)
                acceleration_factor = q10 ** (temp_diff / 10.0)
                total_effective_hrs += dt * acceleration_factor
        else:
            # Estimate exposure using ambient forecast temperature & typical container insulation loss
            insulation_factor = 0.15 if temp_class != TempClass.ambient else 1.0
            est_container_temp = target_temp + (ambient_forecast_temp - target_temp) * insulation_factor
            temp_diff = max(0.0, est_container_temp - target_temp)
            acceleration_factor = q10 ** (temp_diff / 10.0)
            total_effective_hrs = transit_hrs * acceleration_factor
            avg_temp = est_container_temp

        # Baseline remaining shelf-life fraction
        used_shelf_life_fraction = total_effective_hrs / nominal_shelf_life
        remaining_shelf_life_pct = max(0.0, min(100.0, (1.0 - used_shelf_life_fraction) * 100.0))

        # Base spoilage risk score (0.0 to 1.0)
        base_spoilage_score = min(1.0, max(0.0, used_shelf_life_fraction))

        # Apply ML correction if model artifact exists
        ml_correction = 0.0
        if self.ml_model:
            try:
                features = [[transit_hrs, avg_temp, target_temp, q10, base_spoilage_score]]
                ml_correction = float(self.ml_model.predict(features)[0])
            except Exception:
                ml_correction = 0.0

        final_spoilage_score = min(1.0, max(0.0, base_spoilage_score + ml_correction))

        return {
            "spoilage_risk_score": round(final_spoilage_score, 4),
            "remaining_shelf_life_pct": round(remaining_shelf_life_pct, 2),
            "effective_exposure_hrs": round(total_effective_hrs, 2),
            "acceleration_factor": round(total_effective_hrs / max(0.1, transit_hrs), 2),
        }
