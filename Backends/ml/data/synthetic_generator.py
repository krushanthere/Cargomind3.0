import random
import uuid
from datetime import datetime, timedelta, date, timezone
from typing import List, Dict, Any

RURAL_HUBS = [
    {"name": "Village A (Pipili Rural Cluster)", "lat": 20.1147, "lon": 85.8344, "type": "aggregation_point", "power": "solar", "capacity": 25000.0},
    {"name": "Village B (Khordha Dairy Cluster)", "lat": 20.1812, "lon": 85.6200, "type": "aggregation_point", "power": "unreliable", "capacity": 35000.0},
    {"name": "Village C (Nimapada Agro Belt)", "lat": 19.9880, "lon": 86.0150, "type": "informal_cold_storage", "power": "solar", "capacity": 30000.0},
    {"name": "Village D (Banki Riverine Farms)", "lat": 20.3780, "lon": 85.5340, "type": "aggregation_point", "power": "unreliable", "capacity": 20000.0},
    {"name": "Bhubaneswar Central Cold Hub", "lat": 20.2961, "lon": 85.8245, "type": "warehouse", "power": "grid", "capacity": 120000.0},
    {"name": "Cuttack Crossdock Terminal", "lat": 20.4625, "lon": 85.8828, "type": "crossdock", "power": "grid", "capacity": 85000.0},
    {"name": "Puri Coastal Depot", "lat": 19.8135, "lon": 85.8312, "type": "aggregation_point", "power": "grid", "capacity": 45000.0},
    {"name": "Paradeep Port Terminal", "lat": 20.3160, "lon": 86.6110, "type": "warehouse", "power": "grid", "capacity": 190000.0},
]

PRODUCERS = [
    {"id": "prod-pipili-01", "name": "Pipili Organic Floriculture Samiti", "community": "comm-pipili"},
    {"id": "prod-pipili-02", "name": "Maa Mangala Betel Leaf Growers", "community": "comm-pipili"},
    {"id": "prod-khordha-01", "name": "Khordha Women's Dairy Cooperative", "community": "comm-khordha"},
    {"id": "prod-nimapada-01", "name": "Nimapada Chenapoda & Sweets Guild", "community": "comm-nimapada"},
    {"id": "prod-nimapada-02", "name": "Prachi Valley Vegetable Self-Help Group", "community": "comm-nimapada"},
    {"id": "prod-banki-01", "name": "Banki Fresh Fish Fishermen Union", "community": "comm-banki"},
    {"id": "phc-pipili", "name": "Pipili Primary Health Sub-Centre", "community": "comm-pipili"},
    {"id": "phc-banki", "name": "Banki Rural Health Dispensary", "community": "comm-banki"},
]

RURAL_VEHICLES = [
    {"name": "Kisan Mahindra Bolero Maxi-Truck #1", "type": "tempo", "capacity_kg": 1500.0, "capacity_cbm": 6.5, "temp_control": True, "owner_type": "cooperative", "lat": 20.1147, "lon": 85.8344},
    {"name": "Pipili Community E-Rickshaw Loader", "type": "shared_auto", "capacity_kg": 450.0, "capacity_cbm": 2.2, "temp_control": False, "owner_type": "community", "lat": 20.1147, "lon": 85.8344},
    {"name": "Khordha Dairy Insulated Reefer Tempo", "type": "tempo", "capacity_kg": 2200.0, "capacity_cbm": 8.0, "temp_control": True, "owner_type": "cooperative", "lat": 20.1812, "lon": 85.6200},
    {"name": "Nimapada Swaraj Tractor Trailer", "type": "tractor", "capacity_kg": 3500.0, "capacity_cbm": 12.0, "temp_control": False, "owner_type": "individual", "lat": 19.9880, "lon": 86.0150},
    {"name": "Banki Riverine Express Motorbike Carrier", "type": "motorbike", "capacity_kg": 90.0, "capacity_cbm": 0.4, "temp_control": True, "owner_type": "individual", "lat": 20.3780, "lon": 85.5340},
    {"name": "Bhubaneswar Rapid Vaccine Auto-Carrier", "type": "shared_auto", "capacity_kg": 350.0, "capacity_cbm": 1.5, "temp_control": True, "owner_type": "community", "lat": 20.2961, "lon": 85.8245},
    {"name": "Puri Coastal Multi-Utility Van", "type": "tempo", "capacity_kg": 1200.0, "capacity_cbm": 5.0, "temp_control": False, "owner_type": "individual", "lat": 19.8135, "lon": 85.8312},
]

SEASONS = ["summer", "monsoon", "winter", "post_monsoon"]
GOOD_TYPES = ["farm_produce", "medicine", "essential_goods"]
URGENCY_LEVELS = ["routine", "high", "critical"]
TEMP_CLASSES = ["frozen", "chilled", "ambient"]
ROAD_CONDITIONS = ["paved", "unpaved", "seasonal", "flood_risk"]


def generate_synthetic_dataset(num_shipments: int = 50) -> Dict[str, Any]:
    random.seed(42)

    # 1. Create Hubs
    hubs = []
    for h in RURAL_HUBS:
        hubs.append(
            {
                "id": str(uuid.uuid4()),
                "name": h["name"],
                "lat": h["lat"],
                "lon": h["lon"],
                "type": h["type"],
                "power_reliability": h["power"],
                "cold_storage_capacity_kg": h["capacity"],
                "is_active": True,
            }
        )

    # 2. Create Routes (focusing on local and road connections)
    routes = []
    road_conditions = []
    for i in range(len(hubs)):
        for j in range(i + 1, len(hubs)):
            h1, h2 = hubs[i], hubs[j]

            lat_diff = abs(h1["lat"] - h2["lat"])
            lon_diff = abs(h1["lon"] - h2["lon"])
            approx_dist_km = max(5.0, ((lat_diff**2 + lon_diff**2) ** 0.5) * 111.0)

            # Local route for short village feeders (< 35km), Road for trunk connects
            mode = "local" if approx_dist_km < 35.0 else "road"
            route_id = str(uuid.uuid4())

            routes.append(
                {
                    "id": route_id,
                    "origin_hub_id": h1["id"],
                    "dest_hub_id": h2["id"],
                    "mode": mode,
                    "avg_transit_hrs": round(approx_dist_km / (30.0 if mode == "local" else 45.0), 1),
                    "base_cost_per_kg": round(1.2 + (approx_dist_km * 0.015), 2),
                    "reliability_score": round(random.uniform(0.78, 0.94), 2),
                }
            )

            # Road condition
            cond = "flood_risk" if "Banki" in h1["name"] or "Banki" in h2["name"] else random.choice(["paved", "paved", "unpaved", "seasonal"])
            road_conditions.append(
                {
                    "id": str(uuid.uuid4()),
                    "route_id": route_id,
                    "condition": cond,
                    "reported_at": datetime.now(timezone.utc).isoformat(),
                    "reported_by": "agent-rural-surveyor",
                }
            )

    # 3. Create Route History records
    route_histories = []
    base_date = date(2025, 1, 1)

    for route in routes:
        trip_count = random.randint(6, 28)
        for offset in range(trip_count):
            trip_date = base_date + timedelta(days=offset * 5)
            month = trip_date.month
            season = "monsoon" if 7 <= month <= 9 else "summer" if 4 <= month <= 6 else "winter"
            delayed = random.random() < (0.35 if season == "monsoon" else 0.12)
            actual_hrs = route["avg_transit_hrs"] * (random.uniform(1.3, 1.9) if delayed else 1.0)

            route_histories.append(
                {
                    "id": str(uuid.uuid4()),
                    "route_id": route["id"],
                    "trip_date": trip_date.isoformat(),
                    "actual_transit_hrs": round(actual_hrs, 1),
                    "delayed": delayed,
                    "delay_reason": "monsoon_waterlogging" if delayed else None,
                    "season": season,
                }
            )

    # 4. Rural Vehicles
    vehicles = []
    for v in RURAL_VEHICLES:
        vehicles.append(
            {
                "id": str(uuid.uuid4()),
                "name": v["name"],
                "type": v["type"],
                "capacity_kg": v["capacity_kg"],
                "capacity_cbm": v["capacity_cbm"],
                "temp_control": v["temp_control"],
                "owner_type": v["owner_type"],
                "current_location_lat": v["lat"],
                "current_location_lon": v["lon"],
                "availability_status": "available",
                "last_seen_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    # 5. Rural Shipments & Temperature Logs
    shipments = []
    temp_logs = []
    now = datetime.now(timezone.utc)

    for idx in range(num_shipments):
        h1, h2 = random.sample(hubs, 2)
        prod = random.choice(PRODUCERS)
        is_medicine = "phc" in prod["id"]
        good_type = "medicine" if is_medicine else random.choice(["farm_produce", "farm_produce", "essential_goods"])
        urgency = "critical" if is_medicine else random.choice(["high", "routine", "routine"])
        temp_cls = "chilled" if is_medicine else "chilled" if good_type == "farm_produce" else "ambient"

        weight = round(random.uniform(20.0, 600.0 if good_type != "medicine" else 80.0), 1)
        volume = round(weight / random.uniform(200.0, 350.0), 2)
        sla_hrs = 12 if urgency == "critical" else 24 if urgency == "high" else 48

        shipment_id = str(uuid.uuid4())
        created_time = now - timedelta(minutes=random.randint(20, 280))

        shipments.append(
            {
                "id": shipment_id,
                "origin_hub_id": h1["id"],
                "dest_hub_id": h2["id"],
                "good_type": good_type,
                "urgency": urgency,
                "producer_id": prod["id"],
                "producer_name": prod["name"],
                "community_id": prod["community"],
                "weight_kg": weight,
                "volume_cbm": volume,
                "temp_class": temp_cls,
                "sla_deadline": (now + timedelta(hours=sla_hrs)).isoformat(),
                "max_cost": round(weight * random.uniform(4.0, 12.0), 2),
                "status": "pending",
                "created_at": created_time.isoformat(),
                "synced_at": created_time.isoformat(),
            }
        )

        if temp_cls in ["frozen", "chilled"]:
            baseline_temp = 4.0 if temp_cls == "chilled" else -18.0
            for i in range(random.randint(4, 10)):
                temp_logs.append(
                    {
                        "id": str(uuid.uuid4()),
                        "shipment_id": shipment_id,
                        "vehicle_id": "VEH-RURAL-01",
                        "timestamp": (now - timedelta(hours=i)).isoformat(),
                        "temp_celsius": round(baseline_temp + random.uniform(-0.5, 1.2), 2),
                        "humidity": round(random.uniform(70.0, 85.0), 1),
                        "synced_at": now.isoformat(),
                    }
                )

    # 6. Allocation History (to populate fairness dashboard on startup)
    allocation_histories = []
    for _ in range(35):
        p = random.choice(PRODUCERS)
        v = random.choice(vehicles)
        wait_m = random.uniform(25.0, 180.0)
        matched_dt = now - timedelta(days=random.randint(0, 6), hours=random.randint(1, 12))
        urg = "critical" if "phc" in p["id"] else random.choice(["high", "routine"])
        gt = "medicine" if "phc" in p["id"] else "farm_produce"

        allocation_histories.append(
            {
                "id": str(uuid.uuid4()),
                "producer_id": p["id"],
                "producer_name": p["name"],
                "community_id": p["community"],
                "vehicle_id": v["id"],
                "matched_at": matched_dt.isoformat(),
                "wait_time_minutes": round(wait_m, 1),
                "allocation_score": round(random.uniform(320.0, 580.0), 1),
                "urgency": urg,
                "good_type": gt,
                "explanation_summary": f"Matched to {v['name']} based on {urg.upper()} priority and equitable {p['community']} allocation.",
                "synced_at": matched_dt.isoformat(),
            }
        )

    return {
        "hubs": hubs,
        "routes": routes,
        "road_conditions": road_conditions,
        "route_histories": route_histories,
        "vehicles": vehicles,
        "shipments": shipments,
        "temperature_logs": temp_logs,
        "allocation_histories": allocation_histories,
    }
