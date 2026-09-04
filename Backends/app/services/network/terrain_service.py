"""
CargoMind Terrain & Elevation Classification Service (North Eastern Region - NER)
================================================================================
Dataset Source Citations:
1. NASA JPL / USGS Shuttle Radar Topography Mission (SRTM GL1 30m DEM - 38 Regional Tiles):
   - Coverage: Assam Brahmaputra Valley (25-80m), Meghalaya Khasi Plateau (1400-1500m),
     Arunachal Himalayas & Tawang Pass (1500-2820m+ ASL), Nagaland & Manipur Hills (780-1450m),
     Mizoram Ridges (900-1100m), Tripura Valleys (16-35m), Sikkim Himalayas (330-1504m+ ASL).
2. PMGSY Rural Road Geometric & Gradient Design Standards (Ministry of Rural Development, data.gov.in):
   - Hill Road Design Speed: 20-30 km/h (Ruling gradient: 5-7%, Limiting: 8-10%, Exceptional: >12%).
   - Plain Road Design Speed: 40-50 km/h.
"""

from typing import Dict, Any, List, Tuple, Optional
import os
import math
import numpy as np

# Try importing tifffile for exact 30m DEM lookups
try:
    import tifffile
    HAS_TIFFFILE = True
except ImportError:
    HAS_TIFFFILE = False

SRTM_DIR = "/Users/krushantapodha/Untitled23/Backends/data/raw/srtm"

# Authentic SRTM Elevation Benchmarks for North Eastern Region Logistics Nodes (Lat, Lon, Elev_m, Terrain, Location)
NER_SRTM_BENCHMARKS: List[Tuple[float, float, float, str, str]] = [
    (27.5861, 91.8653, 2820.0, "mountainous", "Tawang High-Altitude Mountain Depot (Arunachal Pradesh)"),
    (27.5950, 93.8350, 1572.0, "mountainous", "Ziro Valley Organic Kiwi Hub (Arunachal Pradesh)"),
    (27.3389, 88.6065, 1504.0, "mountainous", "Gangtok Highland Cold Storage (Sikkim)"),
    (25.2700, 91.7300, 1484.0, "mountainous", "Cherrapunji (Sohra) Highland Node (Meghalaya)"),
    (25.6751, 94.1086, 1445.0, "mountainous", "Kohima Highland Aggregation Node (Nagaland)"),
    (25.5788, 91.8933, 1432.0, "hilly", "Shillong Central Consolidation Depot (Meghalaya)"),
    (23.7271, 92.7176, 1069.0, "mountainous", "Aizawl Highland Aggregation Depot (Mizoram)"),
    (24.3333, 93.6833, 922.0, "hilly", "Churachandpur Highland Node (Manipur)"),
    (24.8170, 93.9368, 783.0, "hilly", "Imphal Valley Agro-Pharma Hub (Manipur)"),
    (27.1764, 88.5300, 330.0, "hilly", "Rangpo Multi-Modal Transit Terminal (Sikkim)"),
    (27.1050, 93.6920, 290.0, "hilly", "Naharlagun Rail Freight Hub (Arunachal Pradesh)"),
    (28.0667, 95.3333, 155.0, "hilly", "Pasighat Siang Agro Hub (Arunachal Pradesh)"),
    (25.9060, 93.7270, 145.0, "plains", "Dimapur Rail Freight Terminal (Nagaland)"),
    (27.4728, 94.9120, 108.0, "plains", "Dibrugarh Upper Assam Logistics Depot (Assam)"),
    (26.7509, 94.2037, 95.0, "plains", "Jorhat Tea & Spice Depot (Assam)"),
    (25.9220, 90.6250, 85.0, "plains", "Mendipathar Rail Siding Hub (Meghalaya)"),
    (26.9500, 94.2167, 84.0, "riverine", "Majuli Riverine Island Agri-Hub (Assam)"),
    (24.1870, 92.5350, 72.0, "plains", "Bairabi Rail Siding Terminal (Mizoram)"),
    (26.6338, 92.7926, 68.0, "plains", "Tezpur Agro-Consolidation Centre (Assam)"),
    (26.1820, 91.7450, 50.0, "plains", "Guwahati Central Freight & Cold Hub (Assam)"),
    (26.1780, 91.6850, 48.0, "riverine", "Pandu Inland River Port Terminal (Assam)"),
    (24.8333, 92.7789, 25.0, "plains", "Silchar Barak Valley Crossdock (Assam)"),
    (23.5333, 91.4833, 24.0, "plains", "Udaipur Agro Consolidation Depot (Tripura)"),
    (23.8315, 91.2868, 16.0, "plains", "Agartala Rail Logistics Hub (Tripura)"),
]

# Module cache for loaded TIFF tiles
_TIFF_CACHE: Dict[str, Any] = {}


class TerrainService:
    """Service to compute elevation, terrain categorization, route gradients,
    travel time slowdowns, and vehicle gradeability constraints based on real SRTM 30m DEM data.
    """

    @classmethod
    def get_elevation_m(cls, lat: float, lon: float) -> float:
        """Looks up exact SRTM 30m DEM elevation from GeoTIFF tiles, falling back to
        inverse-distance-weighted interpolation across regional NER benchmarks.
        """
        if HAS_TIFFFILE and os.path.exists(SRTM_DIR):
            lat_floor = int(math.floor(lat))
            lon_floor = int(math.floor(lon))
            fname = f"n{lat_floor:02d}_e{lon_floor:03d}_1arc_v3.tif"
            p = os.path.join(SRTM_DIR, fname)
            if os.path.exists(p):
                try:
                    if fname not in _TIFF_CACHE:
                        _TIFF_CACHE[fname] = tifffile.imread(p)
                    data = _TIFF_CACHE[fname]
                    row = int(np.clip(round((lat_floor + 1.0 - lat) * 3600), 0, 3600))
                    col = int(np.clip(round((lon - lon_floor) * 3600), 0, 3600))
                    elev = float(data[row, col])
                    if elev > -200:
                        return max(5.0, round(elev, 1))
                except Exception:
                    pass

        # Exact or near match in benchmark table (< 4km)
        for b_lat, b_lon, elev, _, _ in NER_SRTM_BENCHMARKS:
            dist_deg = math.hypot(lat - b_lat, lon - b_lon)
            if dist_deg < 0.04:
                return elev

        # Inverse distance weighted interpolation from nearest 3 benchmarks
        weights_sum = 0.0
        elev_sum = 0.0
        for b_lat, b_lon, elev, _, _ in NER_SRTM_BENCHMARKS:
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
        if elevation_m >= 1000.0 or gradient_pct >= 10.0:
            return "mountainous"
        if elevation_m >= 200.0 or gradient_pct >= 4.0:
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
        and terrain cost multiplier for a route segment across North Eastern Region topography.
        """
        orig_elev = cls.get_elevation_m(orig_lat, orig_lon)
        dest_elev = cls.get_elevation_m(dest_lat, dest_lon)
        elev_gain = abs(dest_elev - orig_elev)

        dist_m = max(1000.0, distance_km * 1000.0)
        gradient_pct = round((elev_gain / dist_m) * 100.0, 2)

        terrain_type = cls.classify_terrain(
            max(orig_elev, dest_elev), gradient_pct, is_riverine=is_riverine_corridor
        )

        # Speed adjustments for NER terrain:
        # Plains (NH-27): ~45 km/h, Hilly (Shillong/Imphal): ~25 km/h, Mountainous (Tawang/Kohima): ~18 km/h, Waterway (NW-2): ~18 km/h
        if terrain_type == "mountainous":
            speed_factor = 0.40
            cost_multiplier = 1.55
            speed_kmh = 18.0
        elif terrain_type == "hilly":
            speed_factor = 0.60
            cost_multiplier = 1.30
            speed_kmh = 25.0
        elif terrain_type == "riverine":
            speed_factor = 0.45
            cost_multiplier = 1.15
            speed_kmh = 18.0
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
        """Checks if a vehicle can legally and safely climb/traverse this terrain gradient in NER."""
        gradient_pct = 1.0 if gradient_pct is None else float(gradient_pct)
        terrain_type = "plains" if not terrain_type else str(terrain_type).lower()

        # Max gradient capability by vehicle archetype
        vehicle_gradient_limits = {
            "pickup_4x4": 32.0,
            "bolero_pickup": 32.0,
            "bolero_pickup_4x4": 32.0,
            "bolero_camper": 32.0,
            "cargo_bike": 24.0,
            "motorbike": 22.0,
            "mini_truck": 18.0,
            "tata_ace": 18.0,
            "tempo": 14.0,
            "heavy_truck": 8.0,
            "truck": 8.0,
            "tractor_trailer": 8.0,
            "tractor": 8.0,
            "three_wheeler_cargo": 12.0,
            "shared_auto": 8.0,
            "cargo_erickshaw": 6.0,
            "riverine_boat": 0.0,
            "rail_cargo_wagon": 2.5,
            "other": 12.0,
        }

        v_type_clean = vehicle_type.lower()
        max_allowed = vehicle_gradient_limits.get(v_type_clean, 12.0)

        # Riverine boat only suitable for Brahmaputra waterway routes
        if v_type_clean == "riverine_boat" and terrain_type != "riverine":
            return {
                "allowed": False,
                "reason": "Riverine cargo boat can only operate on Brahmaputra inland water routes (NW-2).",
            }

        # Non-boat vehicles cannot travel across water bodies without road bridge
        if terrain_type == "riverine" and v_type_clean in ["shared_auto", "cargo_erickshaw", "tractor_trailer"]:
            return {
                "allowed": False,
                "reason": f"Vehicle type '{vehicle_type}' cannot safely traverse riverine delta water crossing without RO-RO ferry.",
            }

        if gradient_pct > max_allowed:
            return {
                "allowed": False,
                "reason": (
                    f"Vehicle type '{vehicle_type}' max gradient capability ({max_allowed:.1f}%) "
                    f"is exceeded by route incline ({gradient_pct:.1f}% in {terrain_type} terrain). "
                    f"Recommend Mahindra Bolero Camper 4x4, Tata Ace mini-truck, or heavy-duty mountain cargo bike."
                ),
            }

        if terrain_type in ["mountainous"] and v_type_clean in ["tractor_trailer", "shared_auto", "cargo_erickshaw", "heavy_truck"]:
            return {
                "allowed": False,
                "reason": (
                    f"Vehicle '{vehicle_type}' is restricted on high {terrain_type} ghat passes due to safety regulations. "
                    f"Use Mahindra Bolero Camper 4x4 or Mountain E-Cargo Bike."
                ),
            }

        return {"allowed": True, "max_gradient_pct": max_allowed}
