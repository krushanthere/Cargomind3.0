import os
import pickle
import numpy as np
from typing import Dict, Any

try:
    import xgboost as xgb
except Exception:
    xgb = None


class DelayRiskModel:
    """Predicts probability of shipment delay based on route, seasonality, departure hour,

    transport mode, and historical reliability using trained Gradient Boosting / XGBoost model.
    """

    SEASON_MAP = {"summer": 0, "monsoon": 1, "post_monsoon": 2, "winter": 3}
    MODE_MAP = {"road": 0, "rail": 1}

    def __init__(
        self,
        model_path_json: str = "ml/artifacts/delay_model.json",
        model_path_pkl: str = "ml/artifacts/delay_model.pkl",
    ):
        self.booster = None
        self.sklearn_model = None

        # Try loading XGBoost booster first if available
        if xgb and os.path.exists(model_path_json):
            try:
                self.booster = xgb.Booster()
                self.booster.load_model(model_path_json)
            except Exception:
                self.booster = None

        # Fallback to pickle sklearn GradientBoostingClassifier
        if not self.booster and os.path.exists(model_path_pkl):
            try:
                with open(model_path_pkl, "rb") as f:
                    self.sklearn_model = pickle.load(f)
            except Exception:
                self.sklearn_model = None

    def predict_delay_probability(
        self,
        mode: str,
        season: str,
        departure_hour: int,
        historical_reliability: float,
        avg_transit_hrs: float,
        route_id_hash: int = 0,
    ) -> Dict[str, float]:
        mode_val = self.MODE_MAP.get(mode.lower(), 0)
        season_val = self.SEASON_MAP.get(season.lower(), 0)

        # Baseline heuristic formula
        season_risk = 0.25 if season_val == 1 else 0.10
        mode_risk = 0.15 if mode_val == 0 else 0.05
        unreliability = 1.0 - max(0.0, min(1.0, historical_reliability))
        baseline_prob = min(0.95, max(0.02, unreliability * 0.5 + season_risk + mode_risk))

        prob = baseline_prob

        features = np.array(
            [[route_id_hash % 1000, mode_val, season_val, departure_hour, historical_reliability, avg_transit_hrs]],
            dtype=np.float32,
        )

        if self.booster:
            try:
                dmatrix = xgb.DMatrix(
                    features,
                    feature_names=[
                        "route_id_hash",
                        "mode",
                        "season",
                        "departure_hour",
                        "historical_reliability",
                        "avg_transit_hrs",
                    ],
                )
                preds = self.booster.predict(dmatrix)
                prob = float(preds[0])
            except Exception:
                prob = baseline_prob
        elif self.sklearn_model:
            try:
                prob_arr = self.sklearn_model.predict_proba(features)
                prob = float(prob_arr[0][1])
            except Exception:
                prob = baseline_prob

        predicted_delay_hrs = round(prob * avg_transit_hrs * 0.4, 2)

        return {
            "delay_probability": round(prob, 4),
            "predicted_delay_hrs": predicted_delay_hrs,
            "baseline_prob": round(baseline_prob, 4),
        }
