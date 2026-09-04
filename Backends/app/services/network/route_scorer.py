from typing import List, Dict, Any, Optional
from uuid import UUID
import networkx as nx
from app.services.network.graph_builder import NetworkGraphBuilder
from sqlalchemy.ext.asyncio import AsyncSession


class RouteScorer:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.graph_builder = NetworkGraphBuilder(db)

    async def score_candidate_routes(
        self,
        origin_hub_id: UUID,
        dest_hub_id: UUID,
        vehicle_type: Optional[str] = "pickup_4x4",
        season: Optional[str] = "monsoon",
        urgency: Optional[str] = "routine",
        w_cost: float = 0.25,
        w_time: float = 0.25,
        w_reliability: float = 0.20,
        w_terrain: float = 0.15,
        w_safety: float = 0.15,
    ) -> List[Dict[str, Any]]:
        """Multi-factor terrain-aware route evaluation weighing:
        Distance + SRTM elevation/slope + Weather/Monsoon hazard + Road Condition (RoadSense)
        + Vehicle gradient tolerance + Urgency SLA requirements.
        """
        G = await self.graph_builder.get_graph()

        orig_str = str(origin_hub_id)
        dest_str = str(dest_hub_id)

        if orig_str not in G or dest_str not in G:
            return []

        candidates = []
        try:
            # Find simple paths between origin and destination (up to length 4)
            paths = list(nx.all_simple_paths(G, orig_str, dest_str, cutoff=4))
        except Exception:
            paths = []

        # Vehicle Max Gradient and Capabilities
        vehicle_max_gradients = {
            "heavy_truck": 8.0,
            "truck": 8.0,
            "three_wheeler_cargo": 10.0,
            "cargo_erickshaw": 6.0,
            "mini_truck": 18.0,
            "tata_ace": 18.0,
            "tempo": 14.0,
            "pickup_4x4": 32.0,
            "bolero_pickup": 32.0,
            "tractor": 15.0,
            "tractor_trailer": 8.0,
            "motorbike": 22.0,
            "cargo_bike": 22.0,
            "riverine_boat": 0.0,
            "rail_cargo_wagon": 3.0,
            "other": 45.0,  # Drones / Mountain carriers
        }
        max_allowed_grad = vehicle_max_gradients.get(vehicle_type or "pickup_4x4", 20.0)

        # Dynamic urgency weight adjustments
        if urgency == "critical":
            w_time = max(w_time, 0.45)
            w_cost = 0.10
            w_reliability = 0.25
        elif urgency == "high":
            w_time = max(w_time, 0.35)
            w_cost = 0.20

        is_monsoon = (season or "monsoon").lower() == "monsoon"

        for path in paths:
            total_time = 0.0
            total_cost = 0.0
            total_reliability = 1.0
            total_distance = 0.0
            total_elev_gain = 0.0
            max_route_grad = 0.0
            has_rail = False
            has_waterway = False
            has_road = False
            edge_details = []
            route_infeasible_reason = None

            for i in range(len(path) - 1):
                u, v = path[i], path[i + 1]
                edge_data = G.get_edge_data(u, v)
                if not edge_data:
                    continue

                dist = edge_data.get("distance_km", 25.0)
                base_time = edge_data.get("avg_transit_hrs", 1.0)
                base_cost = edge_data.get("base_cost_per_kg", 2.0)
                base_rel = edge_data.get("reliability_score", 0.95)
                elev_gain = edge_data.get("elevation_gain_m", 0.0)
                grad_pct = edge_data.get("avg_gradient_pct", 1.0)
                terrain = edge_data.get("terrain_type", "plains")
                mode_str = edge_data.get("mode", "road")

                # Terrain & Monsoon transit time and reliability modifier
                time_multiplier = 1.0
                rel_multiplier = 1.0

                if is_monsoon:
                    if terrain in ["mountainous", "hilly"]:
                        time_multiplier += 0.35 + (grad_pct * 0.03)  # Rain slowdown on ghats
                        rel_multiplier *= 0.85  # Landslide/mudslip probability
                    elif terrain == "riverine":
                        time_multiplier += 0.15  # River current speed variance
                        rel_multiplier *= 0.90
                    else:
                        time_multiplier += 0.10
                elif terrain in ["mountainous", "hilly"]:
                    time_multiplier += grad_pct * 0.02

                adjusted_time = base_time * time_multiplier
                adjusted_rel = base_rel * rel_multiplier

                total_time += adjusted_time
                total_cost += base_cost
                total_reliability *= adjusted_rel
                total_distance += dist
                total_elev_gain += elev_gain
                max_route_grad = max(max_route_grad, grad_pct)

                if mode_str == "rail":
                    has_rail = True
                elif mode_str == "waterway":
                    has_waterway = True
                else:
                    has_road = True

                # Check vehicle gradient feasibility
                if mode_str not in ["rail", "waterway"] and grad_pct > max_allowed_grad:
                    route_infeasible_reason = (
                        f"Gradient {grad_pct:.1f}% exceeds {vehicle_type} limit ({max_allowed_grad:.1f}%)"
                    )

                edge_details.append(edge_data)

            # Determine composite mode label
            modes_present = []
            if has_road:
                modes_present.append("road")
            if has_rail:
                modes_present.append("rail")
            if has_waterway:
                modes_present.append("waterway")

            if len(modes_present) > 1:
                route_mode_label = "+".join(modes_present)
            elif modes_present:
                route_mode_label = modes_present[0]
            else:
                route_mode_label = "road"

            # CO2 emission estimate (g CO2/tonne-km: Road ~110, Waterway ~35, Rail ~28, Drone ~15)
            co2_factor = 0.110
            if route_mode_label == "rail":
                co2_factor = 0.028
            elif route_mode_label == "waterway":
                co2_factor = 0.035
            elif "rail" in route_mode_label or "waterway" in route_mode_label:
                co2_factor = 0.060

            co2_kg_per_tonne = total_distance * co2_factor

            # Terrain difficulty index (0-100: higher = more challenging)
            terrain_difficulty = min(100.0, (max_route_grad * 2.5) + (total_elev_gain / 35.0))

            candidates.append(
                {
                    "path_nodes": path,
                    "edges": edge_details,
                    "route_id": edge_details[0]["id"] if len(edge_details) == 1 else None,
                    "mode": route_mode_label,
                    "total_transit_hrs": round(total_time, 2),
                    "total_cost_per_kg": round(total_cost, 2),
                    "total_distance_km": round(total_distance, 1),
                    "total_elevation_gain_m": round(total_elev_gain, 1),
                    "max_gradient_pct": round(max_route_grad, 2),
                    "terrain_difficulty_score": round(terrain_difficulty, 1),
                    "co2_emissions_kg_per_tonne": round(co2_kg_per_tonne, 2),
                    "is_intermodal_rail": has_rail,
                    "is_intermodal_waterway": has_waterway,
                    "reliability_score": round(total_reliability, 4),
                    "is_feasible": route_infeasible_reason is None,
                    "infeasible_reason": route_infeasible_reason,
                    "season": season,
                    "urgency": urgency,
                }
            )

        if not candidates:
            return []

        # Normalize metrics to compute composite scores
        max_cost = max(c["total_cost_per_kg"] for c in candidates) or 1.0
        max_time = max(c["total_transit_hrs"] for c in candidates) or 1.0
        max_diff = max(c["terrain_difficulty_score"] for c in candidates) or 1.0

        for c in candidates:
            norm_cost = c["total_cost_per_kg"] / max_cost
            norm_time = c["total_transit_hrs"] / max_time
            norm_diff = c["terrain_difficulty_score"] / max_diff
            rel = c["reliability_score"]

            cost_score = 1.0 - norm_cost
            time_score = 1.0 - norm_time
            terrain_safety_score = 1.0 - (norm_diff * 0.8)
            reliability_score = rel

            # Bonus for sustainable intermodal routing (Rail / Inland Waterway)
            intermodal_bonus = 0.08 if (c.get("is_intermodal_rail") or c.get("is_intermodal_waterway")) else 0.0

            # Infeasibility penalty
            feasibility_factor = 1.0 if c["is_feasible"] else 0.25

            raw_composite = (
                (w_cost * cost_score)
                + (w_time * time_score)
                + (w_reliability * reliability_score)
                + (w_terrain * terrain_safety_score)
                + (w_safety * reliability_score)
                + intermodal_bonus
            )

            c["composite_score"] = round(raw_composite * feasibility_factor, 4)
            c["accessibility_rating"] = (
                "Optimal Corridor" if c["composite_score"] > 0.75
                else "Moderate Hill Route" if c["composite_score"] > 0.50
                else "High-Constraint Route"
            )

        # Sort candidates descending by composite score
        candidates.sort(key=lambda x: x["composite_score"], reverse=True)
        return candidates
