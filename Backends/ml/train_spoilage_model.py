import os
import pickle
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from ml.data.synthetic_generator import generate_synthetic_dataset


def train_spoilage_model():
    print("Generating synthetic dataset for Spoilage ML correction model...")
    dataset = generate_synthetic_dataset(num_shipments=500)
    temp_logs = dataset["temperature_logs"]

    # Group temp logs by shipment
    shipment_logs = {}
    for log in temp_logs:
        sid = log["shipment_id"]
        if sid not in shipment_logs:
            shipment_logs[sid] = []
        shipment_logs[sid].append(log)

    X = []
    y = []

    for sid, logs in shipment_logs.items():
        if not logs:
            continue
        avg_temp = np.mean([l["temp_celsius"] for l in logs])
        transit_hrs = len(logs) * 1.5
        target_temp = -18.0 if avg_temp < 0 else 4.0
        q10 = 2.5 if target_temp < 0 else 2.0
        base_spoilage = min(1.0, max(0.0, (transit_hrs * (q10 ** ((avg_temp - target_temp) / 10.0))) / 500.0))

        # Synthetic deviation correction ground truth
        residual = 0.05 * np.sin(avg_temp) + np.random.normal(0, 0.01)

        X.append([transit_hrs, avg_temp, target_temp, q10, base_spoilage])
        y.append(residual)

    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.float32)

    if len(X) == 0:
        # Fallback dummy data if dataset had no logs
        X = np.random.rand(100, 5)
        y = np.random.normal(0, 0.02, 100)

    model = GradientBoostingRegressor(n_estimators=30, random_state=42)
    model.fit(X, y)

    os.makedirs("ml/artifacts", exist_ok=True)
    model_path = "ml/artifacts/spoilage_model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    print(f"Spoilage Correction Model saved successfully to {model_path}")


if __name__ == "__main__":
    train_spoilage_model()
