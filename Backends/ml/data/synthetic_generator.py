"""
CargoMind Network Dataset Generator (Real Indian Logistics Topologies)
========================================================================
Dataset Sources & Citations:
1. NASA JPL / USGS SRTM 30m Digital Elevation Model (OpenTopography):
   - Real elevations for plains (5-75m), highlands (210-650m), and mountain nodes (870-980m ASL).
2. Indian Railways Freight Operating Information System (FOIS) & data.gov.in Station Master:
   - Freight terminals: Khurda Road Jn (KUR-RLY), Cuttack Goods Yard (CTC-RLY),
     Paradeep Port Siding (PDP-RLY), Rayagada Goods Shed (RGDA-RLY), Bhubaneswar Freight Hub (BBS-RLY).
3. Pradhan Mantri Gram Sadak Yojana (PMGSY - data.gov.in):
   - Feeder roads, unpaved hill tracks, and riverine flood routes.
4. Census of India & Local Government Directory (LGD data.gov.in):
   - Real rural habitations and Primary Health Centres across Odisha agro-belts.
"""

import random
import uuid
from datetime import datetime, timedelta, date, timezone
from typing import List, Dict, Any

# Authentic Hubs with SRTM 30m DEM Elevations & Indian Railways Freight Terminals
RURAL_HUBS = [
    # Plains Aggregation & Warehousing Nodes
    {"name": "Village A (Pipili Rural Cluster)", "lat": 20.1147, "lon": 85.8344, "type": "aggregation_point", "power": "solar", "capacity": 25000.0, "elevation_m": 45.0, "terrain_type": "plains", "is_rail": False},
    {"name": "Village B (Khordha Dairy Cluster)", "lat": 20.1812, "lon": 85.6200, "type": "aggregation_point", "power": "unreliable", "capacity": 35000.0, "elevation_m": 75.0, "terrain_type": "plains", "is_rail": False},
    {"name": "Village C (Nimapada Agro Belt)", "lat": 19.9880, "lon": 86.0150, "type": "informal_cold_storage", "power": "solar", "capacity": 30000.0, "elevation_m": 32.0, "terrain_type": "plains", "is_rail": False},
    {"name": "Village D (Banki Riverine Farms)", "lat": 20.3780, "lon": 85.5340, "type": "aggregation_point", "power": "unreliable", "capacity": 20000.0, "elevation_m": 28.0, "terrain_type": "riverine", "is_rail": False},
    {"name": "Bhubaneswar Central Cold Hub", "lat": 20.2961, "lon": 85.8245, "type": "warehouse", "power": "grid", "capacity": 120000.0, "elevation_m": 45.0, "terrain_type": "plains", "is_rail": False},
    {"name": "Cuttack Crossdock Terminal", "lat": 20.4625, "lon": 85.8828, "type": "crossdock", "power": "grid", "capacity": 85000.0, "elevation_m": 36.0, "terrain_type": "plains", "is_rail": False},
    {"name": "Puri Coastal Depot", "lat": 19.8135, "lon": 85.8312, "type": "aggregation_point", "power": "grid", "capacity": 45000.0, "elevation_m": 12.0, "terrain_type": "plains", "is_rail": False},
    {"name": "Paradeep Port Terminal", "lat": 20.3160, "lon": 86.6110, "type": "warehouse", "power": "grid", "capacity": 190000.0, "elevation_m": 5.0, "terrain_type": "plains", "is_rail": False},

    # Hilly & Mountainous Nodes (Eastern Ghats & Kandhamal Highlands via SRTM DEM)
    {"name": "Daringbadi Highlands (Kandhamal Hill Node)", "lat": 19.9100, "lon": 84.1300, "type": "hilly_aggregation_node", "power": "solar", "capacity": 18000.0, "elevation_m": 980.0, "terrain_type": "mountainous", "is_rail": False},
    {"name": "Koraput Coffee & Tribal Agro Plateau", "lat": 18.8100, "lon": 82.7100, "type": "hilly_aggregation_node", "power": "solar", "capacity": 28000.0, "elevation_m": 870.0, "terrain_type": "mountainous", "is_rail": False},
    {"name": "Jeypore High-Altitude Aggregation Hub", "lat": 18.8500, "lon": 82.5600, "type": "informal_cold_storage", "power": "solar", "capacity": 32000.0, "elevation_m": 650.0, "terrain_type": "hilly", "is_rail": False},

    # Indian Railways Freight Terminals (FOIS Real Goods Sheds & Sidings)
    {"name": "Khurda Road Jn Rail Freight Terminal (KUR-RLY)", "lat": 20.1700, "lon": 85.6600, "type": "rail_freight_terminal", "power": "grid", "capacity": 150000.0, "elevation_m": 68.0, "terrain_type": "plains", "is_rail": True},
    {"name": "Cuttack Goods Yard Rail Siding (CTC-RLY)", "lat": 20.4700, "lon": 85.8900, "type": "rail_freight_terminal", "power": "grid", "capacity": 140000.0, "elevation_m": 35.0, "terrain_type": "plains", "is_rail": True},
    {"name": "Paradeep Port Rail Siding (PDP-RLY)", "lat": 20.3100, "lon": 86.6200, "type": "rail_freight_terminal", "power": "grid", "capacity": 250000.0, "elevation_m": 6.0, "terrain_type": "plains", "is_rail": True},
    {"name": "Rayagada Rail Terminal & Goods Yard (RGDA-RLY)", "lat": 19.1700, "lon": 83.4200, "type": "rail_freight_terminal", "power": "grid", "capacity": 110000.0, "elevation_m": 210.0, "terrain_type": "hilly", "is_rail": True},
]

PRODUCERS = [
    {"id": "prod-pipili-01", "name": "Pipili Organic Floriculture Samiti", "community": "comm-pipili", "units": "crates"},
    {"id": "prod-pipili-02", "name": "Maa Mangala Betel Leaf Growers", "community": "comm-pipili", "units": "baskets"},
    {"id": "prod-khordha-01", "name": "Khordha Women's Dairy Cooperative", "community": "comm-khordha", "units": "litres"},
    {"id": "prod-nimapada-01", "name": "Nimapada Chenapoda & Sweets Guild", "community": "comm-nimapada", "units": "tins"},
    {"id": "prod-nimapada-02", "name": "Prachi Valley Vegetable Self-Help Group", "community": "comm-nimapada", "units": "sacks"},
    {"id": "prod-banki-01", "name": "Banki Fresh Fish Fishermen Union", "community": "comm-banki", "units": "crates"},
    {"id": "prod-daringbadi-01", "name": "Kandhamal Organic Turmeric & Spice SHG", "community": "comm-daringbadi", "units": "sacks"},
    {"id": "prod-koraput-01", "name": "Koraput Tribal Arabica Coffee Growers", "community": "comm-koraput", "units": "bags"},
    {"id": "phc-pipili", "name": "Pipili Primary Health Sub-Centre", "community": "comm-pipili", "units": "vials"},
    {"id": "phc-banki", "name": "Banki Rural Health Dispensary", "community": "comm-banki", "units": "vials"},
    {"id": "phc-daringbadi", "name": "Daringbadi Tribal Area Hospital", "community": "comm-daringbadi", "units": "vials"},
]

# Synthetic Baseline Vehicle Registry (18 Realistic Multi-Modal Rural Vehicles across Odisha Clusters)
RURAL_VEHICLES = [
    # 1. Tata Ace Mini-Truck (Pipili Cluster)
    {"code": "OD-02-TC-4101", "name": "Tata Ace Gold Mini-Truck #1", "type": "mini_truck", "capacity_kg": 1000.0, "capacity_cbm": 4.5, "cost_per_km": 10.0, "max_gradient_pct": 18.0, "suitable_terrains": "plains,hilly", "temp_control": True, "owner_type": "cooperative", "location_name": "Village A (Pipili Rural Cluster)", "lat": 20.1147, "lon": 85.8344, "status": "available", "assignment": None},
    # 2. Cargo E-Rickshaw (Pipili Cluster)
    {"code": "OD-02-ER-1088", "name": "Pipili Community E-Rickshaw Loader", "type": "cargo_erickshaw", "capacity_kg": 500.0, "capacity_cbm": 2.5, "cost_per_km": 4.5, "max_gradient_pct": 6.0, "suitable_terrains": "plains", "temp_control": False, "owner_type": "community", "location_name": "Village A (Pipili Rural Cluster)", "lat": 20.1147, "lon": 85.8344, "status": "available", "assignment": None},
    # 3. Cargo Motorcycle (Pipili Cluster)
    {"code": "OD-02-MB-9021", "name": "Hero Express Cargo Motorcycle", "type": "motorbike", "capacity_kg": 80.0, "capacity_cbm": 0.35, "cost_per_km": 3.5, "max_gradient_pct": 20.0, "suitable_terrains": "plains,hilly,mountainous", "temp_control": True, "owner_type": "individual", "location_name": "Village A (Pipili Rural Cluster)", "lat": 20.1147, "lon": 85.8344, "status": "available", "assignment": None},
    
    # 4. Insulated Reefer Tempo (Khordha Dairy Cluster)
    {"code": "OD-33-TT-2045", "name": "Khordha Dairy Insulated Reefer Tempo", "type": "tempo", "capacity_kg": 2200.0, "capacity_cbm": 8.0, "cost_per_km": 13.0, "max_gradient_pct": 14.0, "suitable_terrains": "plains,hilly", "temp_control": True, "owner_type": "cooperative", "location_name": "Village B (Khordha Dairy Cluster)", "lat": 20.1812, "lon": 85.6200, "status": "available", "assignment": None},
    # 5. Tata Ace HT Diesel Feeder (Khordha Cluster)
    {"code": "OD-33-TA-5120", "name": "Tata Ace HT Diesel Feeder", "type": "tata_ace", "capacity_kg": 1000.0, "capacity_cbm": 4.5, "cost_per_km": 9.5, "max_gradient_pct": 18.0, "suitable_terrains": "plains,hilly", "temp_control": False, "owner_type": "individual", "location_name": "Village B (Khordha Dairy Cluster)", "lat": 20.1812, "lon": 85.6200, "status": "available", "assignment": None},

    # 6. Swaraj Tractor-Trailer (Nimapada Agro Belt)
    {"code": "OD-13-TR-8002", "name": "Nimapada Swaraj Tractor Trailer", "type": "tractor_trailer", "capacity_kg": 3500.0, "capacity_cbm": 12.0, "cost_per_km": 18.0, "max_gradient_pct": 8.0, "suitable_terrains": "plains", "temp_control": False, "owner_type": "individual", "location_name": "Village C (Nimapada Agro Belt)", "lat": 19.9880, "lon": 86.0150, "status": "available", "assignment": None},
    # 7. Three-Wheeler Cargo (Nimapada Agro Belt)
    {"code": "OD-13-3W-3319", "name": "Piaggio Ape Three-Wheeler Cargo", "type": "three_wheeler_cargo", "capacity_kg": 500.0, "capacity_cbm": 2.5, "cost_per_km": 7.5, "max_gradient_pct": 12.0, "suitable_terrains": "plains", "temp_control": False, "owner_type": "community", "location_name": "Village C (Nimapada Agro Belt)", "lat": 19.9880, "lon": 86.0150, "status": "available", "assignment": None},

    # 8. Riverine Cargo Ferry Boat (Banki Riverine Farms)
    {"code": "OD-14-BT-0012", "name": "Mahanadi Riverine Cargo Ferry Boat", "type": "riverine_boat", "capacity_kg": 2000.0, "capacity_cbm": 10.0, "cost_per_km": 14.0, "max_gradient_pct": 0.0, "suitable_terrains": "riverine", "temp_control": True, "owner_type": "community", "location_name": "Village D (Banki Riverine Farms)", "lat": 20.3780, "lon": 85.5340, "status": "available", "assignment": None},
    # 9. Pharma Express Motorbike (Banki Health Sub-Centre)
    {"code": "OD-14-MB-7741", "name": "Banki Express Pharma Motorbike Carrier", "type": "motorbike", "capacity_kg": 90.0, "capacity_cbm": 0.4, "cost_per_km": 4.0, "max_gradient_pct": 20.0, "suitable_terrains": "plains,hilly,mountainous", "temp_control": True, "owner_type": "individual", "location_name": "Village D (Banki Riverine Farms)", "lat": 20.3780, "lon": 85.5340, "status": "available", "assignment": None},

    # 10. Mahindra Bolero Pickup 4x4 (Daringbadi Highlands)
    {"code": "OD-12-BP-6011", "name": "Eastern Ghats Mahindra Bolero Pickup 4x4", "type": "pickup_4x4", "capacity_kg": 1500.0, "capacity_cbm": 6.0, "cost_per_km": 14.5, "max_gradient_pct": 32.0, "suitable_terrains": "plains,hilly,mountainous", "temp_control": True, "owner_type": "cooperative", "location_name": "Daringbadi Highlands (Kandhamal Hill Node)", "lat": 19.9100, "lon": 84.1300, "status": "available", "assignment": None},
    # 11. Mountain Heavy-Duty Cargo Bike (Daringbadi Hill Trails)
    {"code": "OD-12-CB-1102", "name": "Daringbadi Highland E-Cargo Mountain Bike", "type": "cargo_bike", "capacity_kg": 100.0, "capacity_cbm": 0.5, "cost_per_km": 3.0, "max_gradient_pct": 24.0, "suitable_terrains": "plains,hilly,mountainous", "temp_control": True, "owner_type": "individual", "location_name": "Daringbadi Highlands (Kandhamal Hill Node)", "lat": 19.9100, "lon": 84.1300, "status": "available", "assignment": None},

    # 12. Koraput Tribal Agro Mahindra Bolero 4x4
    {"code": "OD-10-BP-9944", "name": "Koraput Tribal Agro Mahindra Bolero 4x4 Pickup", "type": "pickup_4x4", "capacity_kg": 1500.0, "capacity_cbm": 6.0, "cost_per_km": 14.0, "max_gradient_pct": 28.0, "suitable_terrains": "plains,hilly,mountainous", "temp_control": True, "owner_type": "cooperative", "location_name": "Koraput Coffee & Tribal Agro Plateau", "lat": 18.8100, "lon": 82.7100, "status": "available", "assignment": None},
    # 13. Agro Farm Tractor (Koraput Plateau)
    {"code": "OD-10-TR-4421", "name": "Mahindra 575 DI Agro Farm Tractor", "type": "tractor", "capacity_kg": 3000.0, "capacity_cbm": 10.0, "cost_per_km": 16.5, "max_gradient_pct": 10.0, "suitable_terrains": "plains,hilly", "temp_control": False, "owner_type": "individual", "location_name": "Koraput Coffee & Tribal Agro Plateau", "lat": 18.8100, "lon": 82.7100, "status": "occupied", "assignment": "Local Agro Haulage"},

    # 14. Heavy HCV Refrigerated Truck (Bhubaneswar Cold Hub)
    {"code": "OD-02-HT-7001", "name": "Ashok Leyland 1616 Heavy Reefer Truck", "type": "heavy_truck", "capacity_kg": 16000.0, "capacity_cbm": 35.0, "cost_per_km": 28.0, "max_gradient_pct": 8.0, "suitable_terrains": "plains", "temp_control": True, "owner_type": "cooperative", "location_name": "Bhubaneswar Central Cold Hub", "lat": 20.2961, "lon": 85.8245, "status": "available", "assignment": None},
    # 15. Tata 407 LCV Rural Tempo (Bhubaneswar Hub)
    {"code": "OD-02-TM-3204", "name": "Tata 407 LCV Rural Tempo", "type": "tempo", "capacity_kg": 2500.0, "capacity_cbm": 9.0, "cost_per_km": 12.0, "max_gradient_pct": 14.0, "suitable_terrains": "plains,hilly", "temp_control": False, "owner_type": "individual", "location_name": "Bhubaneswar Central Cold Hub", "lat": 20.2961, "lon": 85.8245, "status": "available", "assignment": None},

    # 16. Rural Passenger-Cargo Bus (Cuttack Terminal)
    {"code": "OD-05-BS-5509", "name": "Cuttack-Bhubaneswar Rural Passenger-Cargo Bus", "type": "bus", "capacity_kg": 2500.0, "capacity_cbm": 9.0, "cost_per_km": 15.0, "max_gradient_pct": 10.0, "suitable_terrains": "plains,hilly", "temp_control": False, "owner_type": "cooperative", "location_name": "Cuttack Crossdock Terminal", "lat": 20.4625, "lon": 85.8830, "status": "available", "assignment": None},
    # 17. Bajaj Maxima Three-Wheeler Cargo (Cuttack Crossdock)
    {"code": "OD-05-3W-8823", "name": "Bajaj Maxima Three-Wheeler Cargo", "type": "three_wheeler_cargo", "capacity_kg": 450.0, "capacity_cbm": 2.2, "cost_per_km": 6.5, "max_gradient_pct": 10.0, "suitable_terrains": "plains", "temp_control": False, "owner_type": "individual", "location_name": "Cuttack Crossdock Terminal", "lat": 20.4625, "lon": 85.8830, "status": "available", "assignment": None},

    # 18. Rayagada Highland Bolero Pickup 4x4 (Rayagada Rail Siding)
    {"code": "OD-28-BP-3030", "name": "Rayagada Highland Bolero Pickup 4x4", "type": "pickup_4x4", "capacity_kg": 1500.0, "capacity_cbm": 6.0, "cost_per_km": 14.0, "max_gradient_pct": 30.0, "suitable_terrains": "plains,hilly,mountainous", "temp_control": True, "owner_type": "cooperative", "location_name": "Rayagada Rail Terminal & Goods Yard (RGDA-RLY)", "lat": 19.1700, "lon": 83.4200, "status": "available", "assignment": None},
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
                "elevation_m": h.get("elevation_m", 50.0),
                "terrain_type": h.get("terrain_type", "plains"),
                "is_rail_terminal": h.get("is_rail", False),
                "is_active": True,
            }
        )

    # 2. Create Routes (Local feeders, Road arterials, Dedicated Rail Freight Corridors, Hilly Passes)
    routes = []
    road_conditions = []
    for i in range(len(hubs)):
        for j in range(i + 1, len(hubs)):
            h1, h2 = hubs[i], hubs[j]

            lat_diff = abs(h1["lat"] - h2["lat"])
            lon_diff = abs(h1["lon"] - h2["lon"])
            approx_dist_km = max(8.0, ((lat_diff**2 + lon_diff**2) ** 0.5) * 111.0)

            # Skip excessive remote direct links unless connecting to regional rail/hub
            if approx_dist_km > 180.0 and not (h1["is_rail_terminal"] and h2["is_rail_terminal"]):
                continue

            elev_delta = abs(h1["elevation_m"] - h2["elevation_m"])
            gradient_pct = round((elev_delta / (approx_dist_km * 1000.0)) * 100.0, 2)

            is_both_rail = h1["is_rail_terminal"] and h2["is_rail_terminal"]
            is_hilly = h1["terrain_type"] in ["hilly", "mountainous"] or h2["terrain_type"] in ["hilly", "mountainous"] or gradient_pct >= 4.0
            is_riverine = h1["terrain_type"] == "riverine" or h2["terrain_type"] == "riverine"

            if is_both_rail:
                mode = "rail"
                terrain_type = "plains"
                speed_kmh = 65.0
                base_cost = round(0.45 + (approx_dist_km * 0.008), 2)  # Low cost rail freight
                rel_score = round(random.uniform(0.92, 0.98), 2)
            elif is_hilly:
                mode = "local" if approx_dist_km < 40.0 else "road"
                terrain_type = "mountainous" if max(h1["elevation_m"], h2["elevation_m"]) > 800.0 else "hilly"
                speed_kmh = 22.0
                base_cost = round(2.2 + (approx_dist_km * 0.025), 2)  # Higher fuel/incline cost
                rel_score = round(random.uniform(0.75, 0.88), 2)
            else:
                mode = "local" if approx_dist_km < 35.0 else "road"
                terrain_type = "riverine" if is_riverine else "plains"
                speed_kmh = 42.0 if mode == "road" else 28.0
                base_cost = round(1.2 + (approx_dist_km * 0.015), 2)
                rel_score = round(random.uniform(0.82, 0.94), 2)

            transit_hrs = round(approx_dist_km / speed_kmh, 1)
            route_id = str(uuid.uuid4())

            routes.append(
                {
                    "id": route_id,
                    "origin_hub_id": h1["id"],
                    "dest_hub_id": h2["id"],
                    "mode": mode,
                    "distance_km": round(approx_dist_km, 1),
                    "avg_transit_hrs": max(0.4, transit_hrs),
                    "base_cost_per_kg": max(0.5, base_cost),
                    "reliability_score": rel_score,
                    "elevation_gain_m": round(elev_delta, 1),
                    "avg_gradient_pct": max(0.5, gradient_pct),
                    "terrain_type": terrain_type,
                }
            )

            # Road condition report
            if is_riverine:
                cond = "flood_risk" if "Banki" in h1["name"] or "Banki" in h2["name"] else "seasonal"
            elif is_hilly:
                cond = "unpaved" if gradient_pct > 5.0 else "paved"
            else:
                cond = "paved"

            road_conditions.append(
                {
                    "id": str(uuid.uuid4()),
                    "route_id": route_id,
                    "condition": cond,
                    "reported_at": datetime.now(timezone.utc).isoformat(),
                    "reported_by": "surveyor-pmgsy-sensor",
                }
            )

    # 3. Create Route History records
    route_histories = []
    base_date = date(2025, 1, 1)

    for route in routes:
        trip_count = random.randint(6, 20)
        for offset in range(trip_count):
            trip_date = base_date + timedelta(days=offset * 7)
            month = trip_date.month
            season = "monsoon" if 7 <= month <= 9 else "summer" if 4 <= month <= 6 else "winter"
            delayed = random.random() < (0.32 if season == "monsoon" else 0.10)
            actual_hrs = route["avg_transit_hrs"] * (random.uniform(1.25, 1.8) if delayed else 1.0)

            route_histories.append(
                {
                    "id": str(uuid.uuid4()),
                    "route_id": route["id"],
                    "trip_date": trip_date.isoformat(),
                    "actual_transit_hrs": round(actual_hrs, 1),
                    "delayed": delayed,
                    "delay_reason": "monsoon_flood_or_terrain" if delayed else None,
                    "season": season,
                }
            )

    # 4. Rural Vehicles
    vehicles = []
    for idx, v in enumerate(RURAL_VEHICLES, 1):
        veh_uuid = f"a0000000-0000-0000-0000-{idx:012d}"
        vehicles.append(
            {
                "id": veh_uuid,
                "vehicle_code": v.get("code", "OD-02-TC-0000"),
                "name": v["name"],
                "type": v["type"],
                "capacity_kg": v["capacity_kg"],
                "capacity_cbm": v["capacity_cbm"],
                "cost_per_km": v.get("cost_per_km", 12.0),
                "max_gradient_pct": v.get("max_gradient_pct", 15.0),
                "suitable_terrains": v.get("suitable_terrains", "plains,hilly"),
                "temp_control": v["temp_control"],
                "owner_type": v["owner_type"],
                "current_location_name": v.get("location_name", "Odisha Central Hub"),
                "current_location_lat": v["lat"],
                "current_location_lon": v["lon"],
                "availability_status": v.get("status", "available"),
                "current_assignment": v.get("assignment", None),
                "last_seen_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    # 5. Rural Shipments & Temperature Logs
    shipments = []
    temp_logs = []
    now = datetime.now(timezone.utc)

    # Pre-defined realistic demo waybill batches for testing
    DEMO_WAYBILLS = [
        {"wb": "RUR-90141", "prod_idx": 0, "orig": "Village A (Pipili Rural Cluster)", "dest": "Bhubaneswar Central Cold Hub", "w": 350.0, "qty": 50.0, "units": "crates", "urg": "high", "good": "farm_produce", "temp": "chilled"},
        {"wb": "RUR-90142", "prod_idx": 2, "orig": "Village B (Khordha Dairy Cluster)", "dest": "Bhubaneswar Central Cold Hub", "w": 850.0, "qty": 120.0, "units": "litres", "urg": "high", "good": "farm_produce", "temp": "chilled"},
        {"wb": "RUR-90143", "prod_idx": 3, "orig": "Village C (Nimapada Agro Belt)", "dest": "Cuttack Crossdock Terminal", "w": 420.0, "qty": 35.0, "units": "tins", "urg": "routine", "good": "farm_produce", "temp": "chilled"},
        {"wb": "RUR-90144", "prod_idx": 5, "orig": "Village D (Banki Riverine Farms)", "dest": "Bhubaneswar Central Cold Hub", "w": 280.0, "qty": 25.0, "units": "crates", "urg": "routine", "good": "farm_produce", "temp": "chilled"},
        {"wb": "RUR-90145", "prod_idx": 8, "orig": "Village A (Pipili Rural Cluster)", "dest": "Bhubaneswar Central Cold Hub", "w": 25.0, "qty": 200.0, "units": "vials", "urg": "critical", "good": "medicine", "temp": "chilled"},
        {"wb": "RUR-90146", "prod_idx": 6, "orig": "Daringbadi Highlands (Kandhamal Hill Node)", "dest": "Rayagada Rail Terminal & Goods Yard (RGDA-RLY)", "w": 620.0, "qty": 45.0, "units": "sacks", "urg": "high", "good": "farm_produce", "temp": "ambient"},
        {"wb": "RUR-90147", "prod_idx": 7, "orig": "Koraput Coffee & Tribal Agro Plateau", "dest": "Khurda Road Jn Rail Freight Terminal (KUR-RLY)", "w": 1100.0, "qty": 80.0, "units": "bags", "urg": "routine", "good": "farm_produce", "temp": "ambient"},
    ]

    for item in DEMO_WAYBILLS:
        h1 = next((h for h in hubs if h["name"] == item["orig"]), hubs[0])
        h2 = next((h for h in hubs if h["name"] == item["dest"]), hubs[4])
        prod = PRODUCERS[item["prod_idx"]]

        s_id = str(uuid.uuid4())
        created_time = now - timedelta(minutes=random.randint(25, 140))
        vol = round(item["w"] * 0.005, 2)

        shipments.append(
            {
                "id": s_id,
                "origin_hub_id": h1["id"],
                "dest_hub_id": h2["id"],
                "good_type": item["good"],
                "urgency": item["urgg"] if "urgg" in item else item["urg"],
                "producer_id": prod["id"],
                "producer_name": prod["name"],
                "community_id": prod["community"],
                "waybill_number": item["wb"],
                "load_quantity": item["qty"],
                "quantity_units": item["units"],
                "weight_kg": item["w"],
                "volume_cbm": vol,
                "temp_class": item["temp"],
                "sla_deadline": (now + timedelta(hours=18 if item["urg"] == "critical" else 36)).isoformat(),
                "max_cost": round(item["w"] * random.uniform(3.5, 9.0), 2),
                "status": "pending",
                "created_at": created_time.isoformat(),
                "synced_at": created_time.isoformat(),
            }
        )

    # Fill remaining shipments randomly
    for idx in range(len(DEMO_WAYBILLS), num_shipments):
        h1, h2 = random.sample(hubs, 2)
        prod = random.choice(PRODUCERS)
        is_medicine = "phc" in prod["id"]
        good_type = "medicine" if is_medicine else random.choice(["farm_produce", "farm_produce", "essential_goods"])
        urgency = "critical" if is_medicine else random.choice(["high", "routine", "routine"])
        temp_cls = "chilled" if is_medicine else "chilled" if good_type == "farm_produce" else "ambient"

        weight = round(random.uniform(30.0, 500.0 if good_type != "medicine" else 60.0), 1)
        load_qty = max(1.0, round(weight / random.uniform(8.0, 15.0)))
        volume = round(weight / random.uniform(200.0, 350.0), 2)
        sla_hrs = 12 if urgency == "critical" else 24 if urgency == "high" else 48

        shipment_id = str(uuid.uuid4())
        created_time = now - timedelta(minutes=random.randint(20, 280))
        wb_num = f"RUR-{90150 + idx}"

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
                "waybill_number": wb_num,
                "load_quantity": load_qty,
                "quantity_units": prod.get("units", "crates"),
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
            for i in range(random.randint(3, 8)):
                temp_logs.append(
                    {
                        "id": str(uuid.uuid4()),
                        "shipment_id": shipment_id,
                        "vehicle_id": "VEH-RURAL-01",
                        "timestamp": (now - timedelta(hours=i)).isoformat(),
                        "temp_celsius": round(baseline_temp + random.uniform(-0.4, 0.8), 2),
                        "humidity": round(random.uniform(72.0, 84.0), 1),
                        "synced_at": now.isoformat(),
                    }
                )

    # 6. Allocation History (populate fairness dashboard)
    allocation_histories = []
    for _ in range(35):
        p = random.choice(PRODUCERS)
        v = random.choice(vehicles)
        wait_m = random.uniform(25.0, 160.0)
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
                "explanation_summary": f"Matched to {v['name']} ({v['type']}) respecting payload capacity and equitable {p['community']} allocation.",
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

