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
            edge_details = []

            for i in range(len(path) - 1):
                u, v = path[i], path[i + 1]
                edge_data = G.get_edge_data(u, v)
                if not edge_data:
                    continue
                total_time += edge_data["avg_transit_hrs"]
                total_cost += edge_data["base_cost_per_kg"]
                total_reliability *= edge_data["reliability_score"]
                edge_details.append(edge_data)

            candidates.append(
                {
                    "path_nodes": path,
                    "edges": edge_details,
                    "route_id": edge_details[0]["id"] if len(edge_details) == 1 else None,
                    "mode": edge_details[0]["mode"] if len(edge_details) == 1 else "multimodal",
                    "total_transit_hrs": round(total_time, 2),
                    "total_cost_per_kg": round(total_cost, 2),
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

            c["composite_score"] = round(
                (w_cost * cost_score) + (w_time * time_score) + (w_reliability * reliability_score), 4
            )

        # Sort candidates descending by composite score
        candidates.sort(key=lambda x: x["composite_score"], reverse=True)
        return candidates
