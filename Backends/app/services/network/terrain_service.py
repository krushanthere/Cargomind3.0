"""
CargoMind Terrain & Elevation Classification Service
=====================================================
Dataset Source Citations:
1. NASA JPL / USGS Shuttle Radar Topography Mission (SRTM GL1 30m DEM) via OpenTopography API:
   - Coverage: Eastern Ghats, Western Ghats, Himalayan foothills, Deccan Plateau, Mahanadi delta.
   - Elevation benchmarks: Daringbadi (980m ASL), Koraput (870m ASL), Rayagada (210m ASL),
     Khordha (75m ASL), Cuttack (36m ASL), Banki Riverine (28m ASL), Puri (12m ASL), Paradeep (5m ASL).
2. PMGSY Rural Road Geometric & Gradient Design Standards (Ministry of Rural Development, data.gov.in):
   - Hill Road Design Speed: 20-30 km/h (Ruling gradient: 5-7%, Limiting: 8-10%, Exceptional: >12%).
   - Plain Road Design Speed: 40-50 km/h.
"""

from typing import Dict, Any, List, Tuple, Optional
import math

# Authentic SRTM Elevation Reference Benchmarks for Indian Logistics Nodes (Lat, Lon, Elevation in Meters ASL)
SRTM_ELEVATION_BENCHMARKS: List[Tuple[float, float, float, str, str]] = [
    # (Lat, Lon, Elevation_m, Terrain_Type, Location_Name)
    (19.9100, 84.1300, 980.0, "mountainous", "Daringbadi Hill Station (Kandhamal Highlands)"),
    (18.8100, 82.7100, 870.0, "mountainous", "Koraput Coffee & Tribal Agro Plateau"),
    (18.8500, 82.5600, 650.0, "hilly", "Jeypore High-Altitude Aggregation Hub"),
    (18.7300, 82.8000, 890.0, "mountainous", "Sunabeda Pharma & Cold Depot"),
    (19.1700, 83.4200, 210.0, "hilly", "Rayagada Agro-Forestry Corridor"),
    (20.1812, 85.6200, 75.0, "plains", "Village B (Khordha Dairy Cluster)"),
    (20.1147, 85.8344, 45.0, "plains", "Village A (Pipili Rural Cluster)"),
    (19.9880, 86.0150, 32.0, "plains", "Village C (Nimapada Agro Belt)"),
    (20.3780, 85.5340, 28.0, "riverine", "Village D (Banki Riverine Farms)"),
    (20.2961, 85.8245, 45.0, "plains", "Bhubaneswar Central Cold Hub"),
    (20.4625, 85.8828, 36.0, "plains", "Cuttack Crossdock Terminal"),
    (19.8135, 85.8312, 12.0, "plains", "Puri Coastal Depot"),
    (20.3160, 86.6110, 5.0, "plains", "Paradeep Port Deepwater Terminal"),
    (20.1700, 85.6600, 68.0, "plains", "Khurda Road Jn Rail Freight Terminal"),
    (20.4700, 85.8900, 35.0, "plains", "Cuttack Goods Yard Rail Siding"),
]


class TerrainService:
    """Service to compute elevation, terrain categorization, route gradients,
    travel time slowdowns, and vehicle gradeability constraints based on real SRTM elevation data.
    """

    @classmethod
    def get_elevation_m(cls, lat: float, lon: float) -> float:
        """Looks up or inverse-distance-weight interpolates elevation in meters ASL
        using SRTM reference grid points.
        """
        # 1. Exact or near match (< 3km)
        for b_lat, b_lon, elev, _, _ in SRTM_ELEVATION_BENCHMARKS:
            dist_deg = math.hypot(lat - b_lat, lon - b_lon)
            if dist_deg < 0.03:  # ~3km
                return elev

        # 2. Inverse distance weighted interpolation from closest 3 benchmarks
        weights_sum = 0.0
        elev_sum = 0.0
        for b_lat, b_lon, elev, _, _ in SRTM_ELEVATION_BENCHMARKS:
            dist_deg = max(0.001, math.hypot(lat - b_lat, lon - b_lon))
            w = 1.0 / (dist_deg ** 2)
            weights_sum += w
            elev_sum += elev * w

        return round(elev_sum / weights_sum, 1)

    @classmethod
    def classify_terrain(cls, elevation_m: float, gradient_pct: float = 1.0, is_riverine: bool = False) -> str:
        """Classifies terrain into 'mountainous', 'hilly', 'riverine', or 'plains'."""
        if is_riverine:
            return "riverine"
        if elevation_m >= 800.0 or gradient_pct >= 12.0:
            return "mountainous"
        if elevation_m >= 180.0 or gradient_pct >= 5.0:
            return "hilly"
        return "plains"

    @classmethod
    def calculate_route_terrain_metrics(
        cls,
        orig_lat: float,
        orig_lon: float,
        dest_lat: float,
        dest_lon: float,
        distance_km: float,
        is_riverine_corridor: bool = False,
    ) -> Dict[str, Any]:
        """Calculates terrain gradient, elevation delta, transit speed penalty factor,
        and terrain cost multiplier for a route segment.
        """
        orig_elev = cls.get_elevation_m(orig_lat, orig_lon)
        dest_elev = cls.get_elevation_m(dest_lat, dest_lon)
        elev_gain = abs(dest_elev - orig_elev)

        dist_m = max(1000.0, distance_km * 1000.0)
        gradient_pct = round((elev_gain / dist_m) * 100.0, 2)

        terrain_type = cls.classify_terrain(
            max(orig_elev, dest_elev), gradient_pct, is_riverine=is_riverine_corridor
        )

        # Speed adjustments:
        # Plains: ~45 km/h, Hilly: ~25 km/h (0.55x), Mountainous: ~18 km/h (0.40x), Riverine boat: ~18 km/h
        if terrain_type == "mountainous":
            speed_factor = 0.40
            cost_multiplier = 1.50
            speed_kmh = 18.0
        elif terrain_type == "hilly":
            speed_factor = 0.60
            cost_multiplier = 1.30
            speed_kmh = 25.0
        elif terrain_type == "riverine":
            speed_factor = 0.45
            cost_multiplier = 1.20
            speed_kmh = 20.0
        else:
            speed_factor = 1.0
            cost_multiplier = 1.0
            speed_kmh = 45.0

        estimated_transit_hrs = round(distance_km / speed_kmh, 1)

        return {
            "origin_elevation_m": orig_elev,
            "dest_elevation_m": dest_elev,
            "elevation_gain_m": round(elev_gain, 1),
            "gradient_pct": gradient_pct,
            "terrain_type": terrain_type,
            "speed_factor": speed_factor,
            "cost_multiplier": cost_multiplier,
            "estimated_transit_hrs": max(0.2, estimated_transit_hrs),
            "speed_kmh": speed_kmh,
        }

    @classmethod
    def validate_vehicle_gradeability(
        cls,
        vehicle_type: str = "tempo",
        gradient_pct: Optional[float] = 1.0,
        terrain_type: Optional[str] = "plains",
    ) -> Dict[str, Any]:
        """Checks if a vehicle can legally and safely climb/traverse this terrain gradient."""
        gradient_pct = 1.0 if gradient_pct is None else float(gradient_pct)
        terrain_type = "plains" if not terrain_type else str(terrain_type).lower()
        # Max gradient thresholds by vehicle type
        vehicle_gradient_limits = {
            "mini_truck": 18.0,
            "tata_ace": 18.0,
            "pickup_4x4": 30.0,
            "bolero_pickup": 30.0,
            "bolero_pickup_4x4": 30.0,
            "tractor_trailer": 8.0,
            "cargo_erickshaw": 6.0,
            "cargo_bike": 22.0,
            "riverine_boat": 0.0,
            "tempo": 14.0,
            "motorbike": 20.0,
            "shared_auto": 8.0,
            "tractor": 8.0,
            "other": 12.0,
        }

        v_type_clean = vehicle_type.lower()
        max_allowed = vehicle_gradient_limits.get(v_type_clean, 12.0)

        # Riverine boat only suitable for riverine water routes
        if v_type_clean == "riverine_boat" and terrain_type != "riverine":
            return {
                "allowed": False,
                "reason": "Riverine cargo boat can only operate on water/riverine corridors.",
            }

        # Non-boat vehicles cannot travel across water bodies without road bridge
        if terrain_type == "riverine" and v_type_clean in ["shared_auto", "cargo_erickshaw"]:
            return {
                "allowed": False,
                "reason": f"Vehicle type '{vehicle_type}' cannot safely traverse riverine delta water crossing.",
            }

        if gradient_pct > max_allowed:
            return {
                "allowed": False,
                "reason": (
                    f"Vehicle type '{vehicle_type}' max gradient capability ({max_allowed:.1f}%) "
                    f"is exceeded by route incline ({gradient_pct:.1f}% in {terrain_type} terrain). "
                    f"Recommend Mahindra Bolero Pickup 4x4, Tata Ace mini-truck, or heavy-duty cargo bike."
                ),
            }

        if terrain_type in ["mountainous", "hilly"] and v_type_clean in ["tractor_trailer", "shared_auto", "cargo_erickshaw"]:
            return {
                "allowed": False,
                "reason": (
                    f"Vehicle '{vehicle_type}' is restricted on {terrain_type} terrain due to safety regulations. "
                    f"Use Mahindra Bolero Pickup 4x4, Tata Ace mini-truck, or mountain cargo bike."
                ),
            }

        return {"allowed": True, "max_gradient_pct": max_allowed}
