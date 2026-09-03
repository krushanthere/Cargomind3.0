from typing import List, Dict, Any
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
        w_cost: float = 0.4,
        w_time: float = 0.4,
        w_reliability: float = 0.2,
    ) -> List[Dict[str, Any]]:
        G = await self.graph_builder.get_graph()

        orig_str = str(origin_hub_id)
        dest_str = str(dest_hub_id)

        if orig_str not in G or dest_str not in G:
            return []

        candidates = []
        try:
            # Find all simple paths between origin and destination (up to length 3)
            paths = list(nx.all_simple_paths(G, orig_str, dest_str, cutoff=3))
        except Exception:
            paths = []

        for path in paths:
            total_time = 0.0
            total_cost = 0.0
            total_reliability = 1.0
            total_distance = 0.0
            has_rail = False
            has_road = False
            edge_details = []

            for i in range(len(path) - 1):
                u, v = path[i], path[i + 1]
                edge_data = G.get_edge_data(u, v)
                if not edge_data:
                    continue
                total_time += edge_data.get("avg_transit_hrs", 1.0)
                total_cost += edge_data.get("base_cost_per_kg", 2.0)
                total_reliability *= edge_data.get("reliability_score", 0.95)
                dist = edge_data.get("distance_km", 25.0)
                total_distance += dist

                mode_str = edge_data.get("mode", "road")
                if mode_str == "rail":
                    has_rail = True
                else:
                    has_road = True

                edge_details.append(edge_data)

            if has_rail and has_road:
                route_mode_label = "road_plus_rail"
            elif has_rail:
                route_mode_label = "rail"
            elif len(edge_details) == 1:
                route_mode_label = edge_details[0].get("mode", "road")
            else:
                route_mode_label = "multimodal"

            # CO2 emission estimate: ~110g CO2/tonne-km for road vs ~28g CO2/tonne-km for rail
            co2_kg_per_tonne = (
                (total_distance * 0.028) if route_mode_label == "rail"
                else (total_distance * 0.055) if route_mode_label == "road_plus_rail"
                else (total_distance * 0.110)
            )

            candidates.append(
                {
                    "path_nodes": path,
                    "edges": edge_details,
                    "route_id": edge_details[0]["id"] if len(edge_details) == 1 else None,
                    "mode": route_mode_label,
                    "total_transit_hrs": round(total_time, 2),
                    "total_cost_per_kg": round(total_cost, 2),
                    "total_distance_km": round(total_distance, 1),
                    "co2_emissions_kg_per_tonne": round(co2_kg_per_tonne, 2),
                    "is_intermodal_rail": has_rail,
                    "reliability_score": round(total_reliability, 4),
                }
            )

        if not candidates:
            return []

        # Normalize metrics to compute composite scores
        max_cost = max(c["total_cost_per_kg"] for c in candidates) or 1.0
        max_time = max(c["total_transit_hrs"] for c in candidates) or 1.0

        for c in candidates:
            norm_cost = c["total_cost_per_kg"] / max_cost
            norm_time = c["total_transit_hrs"] / max_time
            rel = c["reliability_score"]

            # Lower cost and lower time are better; higher reliability is better
            cost_score = 1.0 - norm_cost
            time_score = 1.0 - norm_time
            reliability_score = rel

            # Intermodal rail bonus for high bulk / long distances
            intermodal_bonus = 0.08 if c.get("is_intermodal_rail") else 0.0

            c["composite_score"] = round(
                (w_cost * cost_score) + (w_time * time_score) + (w_reliability * reliability_score) + intermodal_bonus, 4
            )

        # Sort candidates descending by composite score
        candidates.sort(key=lambda x: x["composite_score"], reverse=True)
        return candidates
