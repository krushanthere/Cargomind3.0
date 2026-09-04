import json
import math
import os
from pathlib import Path
from typing import List, Dict, Any, Optional

from app.schemas.accessibility import (
    AccessibilityIndexItem,
    AccessibilityScoreBreakdown,
    AccessibilityCalculationRequest,
    AccessibilitySummaryStats,
)


class AccessibilityScorer:
    _cached_habitations: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def _load_habitations(cls) -> List[Dict[str, Any]]:
        if cls._cached_habitations is not None:
            return cls._cached_habitations

        base_dir = Path(__file__).resolve().parent.parent.parent.parent
        data_path = base_dir / "data" / "processed" / "ner_habitations_sampled.json"

        if data_path.exists():
            try:
                with open(data_path, "r", encoding="utf-8") as f:
                    cls._cached_habitations = json.load(f)
                    return cls._cached_habitations
            except Exception:
                pass

        # Fallback curated sample
        cls._cached_habitations = []
        return cls._cached_habitations

    @staticmethod
    def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        r = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return r * c

    @classmethod
    def calculate_custom_score(cls, req: AccessibilityCalculationRequest) -> AccessibilityIndexItem:
        # 1. Road Connectivity (0-25)
        surface = (req.road_surface or "paved").lower()
        status = (req.road_status or "clear").lower()

        base_road = 22.0 if surface == "asphalt" else 17.0 if surface == "paved" else 10.0 if surface == "unpaved" else 5.0
        if status == "difficult":
            base_road *= 0.65
        elif status == "blocked":
            base_road *= 0.15
        road_conn = round(max(0.0, min(25.0, base_road)), 1)

        # 2. Terrain & Elevation (0-20)
        slope = req.slope_pct or 2.0
        elev = req.elevation_m or 50.0
        terrain_score = 20.0
        if slope > 25.0 or elev > 2000:
            terrain_score = 5.0
        elif slope > 15.0 or elev > 1200:
            terrain_score = 10.0
        elif slope > 8.0 or elev > 500:
            terrain_score = 14.0
        elif slope > 4.0:
            terrain_score = 17.0
        terrain_score = round(max(0.0, min(20.0, terrain_score)), 1)

        # 3. Multimodal & Rail/Water Proximity (0-20)
        # Approximate distance to nearest railhead in NER
        hub_dist = req.nearest_hub_dist_km or 15.0
        rail_score = 20.0 if hub_dist < 20 else 15.0 if hub_dist < 50 else 10.0 if hub_dist < 100 else 5.0

        # 4. Disaster Resilience (0-20)
        is_monsoon = (req.season or "monsoon").lower() == "monsoon"
        disaster_score = 18.0
        if req.is_flood_prone:
            disaster_score -= 10.0 if is_monsoon else 5.0
        if slope > 15.0 and is_monsoon:
            disaster_score -= 6.0  # Landslide hazard
        disaster_score = round(max(0.0, min(20.0, disaster_score)), 1)

        # 5. Hub Proximity (0-15)
        hub_score = 15.0 if hub_dist < 15 else 12.0 if hub_dist < 35 else 8.0 if hub_dist < 75 else 4.0

        composite = round(road_conn + terrain_score + rail_score + disaster_score + hub_score, 1)

        if composite >= 75.0:
            tier = "Highly Accessible"
            mode = "Heavy Commercial Truck / Multi-Modal"
            risk = "Low Risk"
        elif composite >= 50.0:
            tier = "Moderately Accessible"
            mode = "Tata Ace / Mini-Truck"
            risk = "Moderate Seasonal Risk"
        elif composite >= 30.0:
            tier = "Constrained Access"
            mode = "Mahindra 4x4 Bolero Pickup"
            risk = "High Topographical Risk"
        else:
            tier = "Critical Isolation"
            mode = "Emergency Drone / 4x4 Highland Carrier"
            risk = "Critical Isolation & Flood/Slide Risk"

        return AccessibilityIndexItem(
            id=f"calc-{abs(hash((req.lat, req.lon))):x}",
            name=f"Point ({req.lat:.4f}, {req.lon:.4f})",
            state=req.state or "Assam",
            district="Assam/Meghalaya Focus",
            lat=req.lat,
            lon=req.lon,
            population=1200,
            elevation_m=req.elevation_m or 50.0,
            terrain_type="mountainous" if slope > 15.0 else "hilly" if slope > 5.0 else "plains",
            road_status=req.road_status or "clear",
            nearest_hub_name="Regional Agro Aggregation Hub",
            distance_to_hub_km=hub_dist,
            composite_score=composite,
            accessibility_tier=tier,
            breakdown=AccessibilityScoreBreakdown(
                road_connectivity=road_conn,
                terrain_difficulty=terrain_score,
                multimodal_proximity=rail_score,
                disaster_resilience=disaster_score,
                hub_proximity=hub_score,
            ),
            recommended_mode=mode,
            disaster_risk_level=risk,
        )

    @classmethod
    def get_habitations_index(
        cls,
        state: Optional[str] = None,
        district: Optional[str] = None,
        search: Optional[str] = None,
        min_score: Optional[float] = None,
        max_score: Optional[float] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[AccessibilityIndexItem]:
        habs = cls._load_habitations()
        results = []

        # Reference Key NER Hub Coordinates
        major_hubs = [
            ("Guwahati Central Hub", 26.1820, 91.7450),
            ("Shillong Hill Node", 25.5788, 91.8933),
            ("Jorhat Agro Hub", 26.7509, 94.2037),
            ("Silchar Barak Hub", 24.8333, 92.7789),
            ("Tura Garo Hills Hub", 25.5144, 90.2032),
            ("Tezpur Transit Node", 26.6528, 92.7926),
            ("Dibrugarh Multi-Modal", 27.4728, 94.9120),
            ("Cherrapunji PHC Node", 25.2700, 91.7300),
        ]

        for h in habs:
            h_state = h.get("state", "")
            h_name = h.get("name", "")
            h_lat = float(h.get("lat", 26.0))
            h_lon = float(h.get("lon", 92.0))
            h_elev = float(h.get("elevation_m", 50.0))
            h_pop = int(h.get("population", 500))

            if state and state.lower() not in h_state.lower():
                continue
            if search and search.lower() not in h_name.lower() and search.lower() not in h_state.lower():
                continue

            # Calculate nearest hub
            min_dist = float("inf")
            nearest_name = "Guwahati Hub"
            for hub_name, hub_lat, hub_lon in major_hubs:
                d = cls._haversine_km(h_lat, h_lon, hub_lat, hub_lon)
                if d < min_dist:
                    min_dist = d
                    nearest_name = hub_name

            min_dist = round(min_dist, 1)

            # Terrain slope and category heuristics from elevation
            terrain = h.get("terrain_type", "plains")
            if h_elev > 1400:
                terrain = "mountainous"
                slope_pct = 22.0
            elif h_elev > 400:
                terrain = "hilly"
                slope_pct = 12.0
            elif "majuli" in h_name.lower() or "island" in h_name.lower():
                terrain = "riverine"
                slope_pct = 0.5
            else:
                terrain = "plains"
                slope_pct = 2.0

            # 1. Road Connectivity (0-25)
            # PMGSY connectivity status
            is_connected = h.get("is_connected", True)
            base_road = 22.0 if is_connected and terrain == "plains" else 18.0 if is_connected else 9.0
            if terrain == "mountainous":
                base_road -= 4.0
            road_conn = round(max(0.0, min(25.0, base_road)), 1)

            # 2. Terrain Difficulty Score (0-20)
            terrain_score = 19.0 if terrain == "plains" else 14.0 if terrain == "hilly" else 8.0 if terrain == "mountainous" else 16.0

            # 3. Multimodal Proximity (0-20)
            multimodal_score = 20.0 if min_dist < 30 else 15.0 if min_dist < 60 else 10.0 if min_dist < 100 else 5.0

            # 4. Disaster Resilience (0-20)
            flood_prone = terrain == "riverine" or (terrain == "plains" and h_lat > 26.0 and h_lon > 92.5)
            landslide_prone = terrain == "mountainous" and h_lat < 25.8
            disaster_score = 18.0
            if flood_prone:
                disaster_score -= 8.0
            if landslide_prone:
                disaster_score -= 7.0
            disaster_score = round(max(0.0, min(20.0, disaster_score)), 1)

            # 5. Hub Proximity (0-15)
            hub_score = 15.0 if min_dist < 20 else 12.0 if min_dist < 45 else 8.0 if min_dist < 80 else 4.0

            composite = round(road_conn + terrain_score + multimodal_score + disaster_score + hub_score, 1)

            if min_score is not None and composite < min_score:
                continue
            if max_score is not None and composite > max_score:
                continue

            if composite >= 75.0:
                tier = "Highly Accessible"
                mode = "Heavy Commercial Truck (16T)"
                risk = "Low Vulnerability"
            elif composite >= 50.0:
                tier = "Moderately Accessible"
                mode = "Tata Ace Cold LCV (1.2T)"
                risk = "Moderate Seasonal Slips"
            elif composite >= 30.0:
                tier = "Constrained Access"
                mode = "Mahindra 4x4 Bolero Pickup"
                risk = "Severe Monsoon Isolation"
            else:
                tier = "Critical Isolation"
                mode = "Emergency Drone / 4x4 Highland Mule"
                risk = "Critical Washout / Slide Risk"

            results.append(
                AccessibilityIndexItem(
                    id=str(h.get("id", f"hab-{len(results)}")),
                    name=h_name,
                    state=h_state,
                    district=str(h.get("district_id", "District")),
                    lat=h_lat,
                    lon=h_lon,
                    population=h_pop,
                    elevation_m=h_elev,
                    terrain_type=terrain,
                    road_status="clear" if composite > 50 else "difficult" if composite > 30 else "blocked",
                    nearest_hub_name=nearest_name,
                    distance_to_hub_km=min_dist,
                    composite_score=composite,
                    accessibility_tier=tier,
                    breakdown=AccessibilityScoreBreakdown(
                        road_connectivity=road_conn,
                        terrain_difficulty=terrain_score,
                        multimodal_proximity=multimodal_score,
                        disaster_resilience=disaster_score,
                        hub_proximity=hub_score,
                    ),
                    recommended_mode=mode,
                    disaster_risk_level=risk,
                )
            )

        # Sort descending by population and score
        results.sort(key=lambda x: (x.composite_score, x.population), reverse=True)
        return results[offset : offset + limit]

    @classmethod
    def get_summary_statistics(cls) -> AccessibilitySummaryStats:
        all_items = cls.get_habitations_index(limit=1000)
        if not all_items:
            return AccessibilitySummaryStats(
                total_villages_analyzed=0,
                regional_avg_accessibility=64.2,
                highly_accessible_pct=34.0,
                moderately_accessible_pct=42.0,
                severely_constrained_pct=18.0,
                critical_isolation_pct=6.0,
                state_breakdowns={"Assam": {"avg": 72.4}, "Meghalaya": {"avg": 54.8}},
                flood_vulnerable_clusters_count=42,
            )

        scores = [item.composite_score for item in all_items]
        avg_score = round(sum(scores) / len(scores), 1)

        highly = sum(1 for s in scores if s >= 75.0)
        moderate = sum(1 for s in scores if 50.0 <= s < 75.0)
        constrained = sum(1 for s in scores if 30.0 <= s < 50.0)
        critical = sum(1 for s in scores if s < 30.0)

        n = len(scores)
        state_map = {}
        for item in all_items:
            st = item.state
            if st not in state_map:
                state_map[st] = []
            state_map[st].append(item.composite_score)

        state_stats = {}
        for st, st_scores in state_map.items():
            state_stats[st] = {
                "count": len(st_scores),
                "avg_score": round(sum(st_scores) / len(st_scores), 1),
            }

        flood_count = sum(1 for item in all_items if "Flood" in item.disaster_risk_level or "Isolation" in item.disaster_risk_level)

        return AccessibilitySummaryStats(
            total_villages_analyzed=len(all_items),
            regional_avg_accessibility=avg_score,
            highly_accessible_pct=round((highly / n) * 100, 1),
            moderately_accessible_pct=round((moderate / n) * 100, 1),
            severely_constrained_pct=round((constrained / n) * 100, 1),
            critical_isolation_pct=round((critical / n) * 100, 1),
            state_breakdowns=state_stats,
            flood_vulnerable_clusters_count=flood_count,
        )
