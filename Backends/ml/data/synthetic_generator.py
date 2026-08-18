import random
import uuid
from datetime import datetime, timedelta, date, timezone
from typing import List, Dict, Any

INDIAN_HUBS = [
    {"name": "Mumbai Hub", "lat": 19.0760, "lon": 72.8777, "type": "warehouse", "capacity": 50000.0},
    {"name": "Delhi Hub", "lat": 28.7041, "lon": 77.1025, "type": "crossdock", "capacity": 60000.0},
    {"name": "Bengaluru Hub", "lat": 12.9716, "lon": 77.5946, "type": "warehouse", "capacity": 45000.0},
    {"name": "Chennai Port Hub", "lat": 13.0827, "lon": 80.2707, "type": "crossdock", "capacity": 40000.0},
    {"name": "Kolkata Hub", "lat": 22.5726, "lon": 88.3639, "type": "rail_yard", "capacity": 55000.0},
    {"name": "Hyderabad Hub", "lat": 17.3850, "lon": 78.4867, "type": "warehouse", "capacity": 40000.0},
    {"name": "Ahmedabad Hub", "lat": 23.0225, "lon": 72.5714, "type": "crossdock", "capacity": 35000.0},
    {"name": "Pune Hub", "lat": 18.5204, "lon": 73.8567, "type": "warehouse", "capacity": 30000.0},
    {"name": "Jaipur Hub", "lat": 26.9124, "lon": 75.7873, "type": "crossdock", "capacity": 25000.0},
    {"name": "Nagpur Rail Junction", "lat": 21.1458, "lon": 79.0882, "type": "rail_yard", "capacity": 70000.0},
    {"name": "Lucknow Hub", "lat": 26.8467, "lon": 80.9462, "type": "warehouse", "capacity": 20000.0},
    {"name": "Bhopal Hub", "lat": 23.2599, "lon": 77.4126, "type": "rail_yard", "capacity": 30000.0},
    {"name": "Indore Hub", "lat": 22.7196, "lon": 75.8577, "type": "crossdock", "capacity": 25000.0},
    {"name": "Surat Hub", "lat": 21.1702, "lon": 72.8311, "type": "warehouse", "capacity": 30000.0},
    {"name": "Visakhapatnam Hub", "lat": 17.6868, "lon": 83.2185, "type": "crossdock", "capacity": 35000.0},
]

SEASONS = ["summer", "monsoon", "winter", "post_monsoon"]
TEMP_CLASSES = ["frozen", "chilled", "ambient"]
TRANSPORT_MODES = ["road", "rail"]


def generate_synthetic_dataset(num_shipments: int = 500) -> Dict[str, Any]:
    random.seed(42)

    # 1. Create Hubs
    hubs = []
    for h in INDIAN_HUBS:
        hubs.append(
            {
                "id": str(uuid.uuid4()),
                "name": h["name"],
                "lat": h["lat"],
                "lon": h["lon"],
                "type": h["type"],
                "cold_storage_capacity_kg": h["capacity"],
                "is_active": True,
            }
        )

    # 2. Create Routes connecting hubs
    routes = []
    for i in range(len(hubs)):
        for j in range(i + 1, len(hubs)):
            h1, h2 = hubs[i], hubs[j]

            # Estimate transit hrs based on rough distance
            lat_diff = abs(h1["lat"] - h2["lat"])
            lon_diff = abs(h1["lon"] - h2["lon"])
            approx_dist_km = ((lat_diff**2 + lon_diff**2) ** 0.5) * 111.0

            # Road route
            routes.append(
                {
                    "id": str(uuid.uuid4()),
                    "origin_hub_id": h1["id"],
                    "dest_hub_id": h2["id"],
                    "mode": "road",
                    "avg_transit_hrs": round(approx_dist_km / 50.0, 1),
                    "base_cost_per_kg": round(1.5 + (approx_dist_km * 0.008), 2),
                    "reliability_score": round(random.uniform(0.75, 0.95), 2),
                }
            )

            # Rail route for longer distances (> 300 km)
            if approx_dist_km > 300:
                routes.append(
                    {
                        "id": str(uuid.uuid4()),
                        "origin_hub_id": h1["id"],
                        "dest_hub_id": h2["id"],
                        "mode": "rail",
                        "avg_transit_hrs": round(approx_dist_km / 40.0 + 4.0, 1),  # includes loading
                        "base_cost_per_kg": round(1.0 + (approx_dist_km * 0.005), 2),
                        "reliability_score": round(random.uniform(0.85, 0.98), 2),
                    }
                )

    # 3. Create Route History records
    route_histories = []
    base_date = date(2025, 1, 1)

    for route in routes:
        for day_offset in range(0, 180, 5):
            trip_date = base_date + timedelta(days=day_offset)
            month = trip_date.month

            # Seasonal delay probability (higher during July-Sept monsoon)
            if 7 <= month <= 9:
                season = "monsoon"
                delay_prob = 0.35 if route["mode"] == "road" else 0.15
            elif 4 <= month <= 6:
                season = "summer"
                delay_prob = 0.20 if route["mode"] == "road" else 0.10
            else:
                season = "winter" if month in [12, 1, 2] else "post_monsoon"
                delay_prob = 0.10

            delayed = random.random() < delay_prob
            actual_hrs = route["avg_transit_hrs"]
            delay_reason = None

            if delayed:
                delay_factor = random.uniform(1.2, 1.8)
                actual_hrs = round(actual_hrs * delay_factor, 1)
                delay_reason = random.choice(
                    ["monsoon_waterlogging", "traffic_congestion", "rail_signal_delay", "checkpoint_hold"]
                )

            route_histories.append(
                {
                    "id": str(uuid.uuid4()),
                    "route_id": route["id"],
                    "trip_date": trip_date.isoformat(),
                    "actual_transit_hrs": actual_hrs,
                    "delayed": delayed,
                    "delay_reason": delay_reason,
                    "season": season,
                }
            )

    # 4. Generate Synthetic Shipments & Temperature Logs
    shipments = []
    temp_logs = []
    now = datetime.now(timezone.utc)

    for _ in range(num_shipments):
        h1, h2 = random.sample(hubs, 2)
        temp_cls = random.choice(TEMP_CLASSES)
        weight = round(random.uniform(100.0, 5000.0), 1)
        volume = round(weight / random.uniform(200.0, 400.0), 2)
        sla_hrs = random.choice([24, 48, 72, 96])

        shipment_id = str(uuid.uuid4())
        shipments.append(
            {
                "id": shipment_id,
                "origin_hub_id": h1["id"],
                "dest_hub_id": h2["id"],
                "weight_kg": weight,
                "volume_cbm": volume,
                "temp_class": temp_cls,
                "sla_deadline": (now + timedelta(hours=sla_hrs)).isoformat(),
                "max_cost": round(weight * random.uniform(5.0, 15.0), 2),
                "status": "pending",
                "created_at": now.isoformat(),
            }
        )

        # Generate temperature excursion logs for cold-chain shipments
        if temp_cls in ["frozen", "chilled"]:
            baseline_temp = -18.0 if temp_cls == "frozen" else 4.0
            vehicle_id = f"VEH-{random.randint(100, 999)}"
            num_logs = random.randint(10, 24)

            for i in range(num_logs):
                t_stamp = now - timedelta(hours=num_logs - i)
                # Excursion simulation: random walk + spike
                temp_fluctuation = random.gauss(0, 0.8)
                if random.random() < 0.05:  # 5% chance of door open spike
                    temp_fluctuation += random.uniform(3.0, 8.0)

                temp_logs.append(
                    {
                        "id": str(uuid.uuid4()),
                        "shipment_id": shipment_id,
                        "vehicle_id": vehicle_id,
                        "timestamp": t_stamp.isoformat(),
                        "temp_celsius": round(baseline_temp + temp_fluctuation, 2),
                        "humidity": round(random.uniform(70.0, 90.0), 1),
                    }
                )

    return {
        "hubs": hubs,
        "routes": routes,
        "route_histories": route_histories,
        "shipments": shipments,
        "temperature_logs": temp_logs,
    }
