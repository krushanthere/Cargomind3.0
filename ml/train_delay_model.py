import os
import pickle
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from ml.data.synthetic_generator import generate_synthetic_dataset

try:
    import xgboost as xgb
except Exception:
    xgb = None


def train_delay_model():
    print("Generating synthetic dataset for delay risk model...")
    dataset = generate_synthetic_dataset(num_shipments=500)
    route_histories = dataset["route_histories"]
    routes = {r["id"]: r for r in dataset["routes"]}

    X = []
    y = []

    season_map = {"summer": 0, "monsoon": 1, "post_monsoon": 2, "winter": 3}
    mode_map = {"road": 0, "rail": 1}

    for rh in route_histories:
        route = routes.get(rh["route_id"])
        if not route:
            continue
        route_hash = hash(rh["route_id"]) % 1000
        mode_val = mode_map.get(route["mode"], 0)
        season_val = season_map.get(rh["season"], 0)
        dep_hour = np.random.randint(0, 24)
        rel = route["reliability_score"]
        transit_hrs = route["avg_transit_hrs"]

        X.append([route_hash, mode_val, season_val, dep_hour, rel, transit_hrs])
        y.append(1 if rh["delayed"] else 0)

    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int32)

    os.makedirs("ml/artifacts", exist_ok=True)

    # 1. Train Sklearn GradientBoostingClassifier
    print("Training Sklearn GradientBoostingClassifier...")
    clf = GradientBoostingClassifier(n_estimators=50, random_state=42)
    clf.fit(X, y)
    with open("ml/artifacts/delay_model.pkl", "wb") as f:
        pickle.dump(clf, f)
    print("Sklearn Delay Model saved to ml/artifacts/delay_model.pkl")

    # 2. Train XGBoost model if C runtime is functional
    if xgb:
        try:
            print("Training XGBoost classifier...")
            dtrain = xgb.DMatrix(
                X,
                label=y,
                feature_names=[
                    "route_id_hash",
                    "mode",
                    "season",
                    "departure_hour",
                    "historical_reliability",
                    "avg_transit_hrs",
                ],
            )
            params = {
                "objective": "binary:logistic",
                "eval_metric": "logloss",
                "max_depth": 4,
                "eta": 0.1,
                "seed": 42,
            }
            booster = xgb.train(params, dtrain, num_boost_round=50)
            booster.save_model("ml/artifacts/delay_model.json")
            print("XGBoost Delay Model saved to ml/artifacts/delay_model.json")
        except Exception as e:
            print(f"XGBoost training skipped due to platform C library setup: {e}")


if __name__ == "__main__":
    train_delay_model()
