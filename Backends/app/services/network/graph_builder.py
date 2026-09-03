import json
from typing import Optional, Dict, Any
import networkx as nx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.hub import Hub
from app.models.route import Route
from app.core.config import settings

try:
    import redis.asyncio as redis
except ImportError:
    redis = None


class NetworkGraphBuilder:
    def __init__(self, db: AsyncSession):
        self.db = db
        self._redis_client = None
        if redis:
            try:
                self._redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            except Exception:
                self._redis_client = None

    async def get_graph(self) -> nx.DiGraph:
        cache_key = "shipmerge:network_graph_data"
        graph_data = None

        if self._redis_client:
            try:
                cached_json = await self._redis_client.get(cache_key)
                if cached_json:
                    graph_data = json.loads(cached_json)
            except Exception:
                graph_data = None

        if not graph_data:
            graph_data = await self._build_from_db()
            if self._redis_client and graph_data:
                try:
                    await self._redis_client.set(cache_key, json.dumps(graph_data), ex=300)
                except Exception:
                    pass

        G = nx.DiGraph()
        for node in graph_data["nodes"]:
            G.add_node(node["id"], name=node["name"], lat=node["lat"], lon=node["lon"], type=node["type"])

        for edge in graph_data["edges"]:
            G.add_edge(
                edge["origin_hub_id"],
                edge["dest_hub_id"],
                id=edge["id"],
                mode=edge["mode"],
                avg_transit_hrs=edge["avg_transit_hrs"],
                base_cost_per_kg=edge["base_cost_per_kg"],
                reliability_score=edge["reliability_score"],
            )

        return G

    async def invalidate_cache(self) -> None:
        if self._redis_client:
            try:
                await self._redis_client.delete("shipmerge:network_graph_data")
            except Exception:
                pass

    async def _build_from_db(self) -> Dict[str, Any]:
        hubs_stmt = select(Hub).where(Hub.is_active.is_(True))
        routes_stmt = select(Route)

        hubs_res = await self.db.execute(hubs_stmt)
        routes_res = await self.db.execute(routes_stmt)

        hubs = list(hubs_res.scalars().all())
        routes = list(routes_res.scalars().all())

        nodes = [
            {
                "id": str(h.id),
                "name": h.name,
                "lat": h.lat,
                "lon": h.lon,
                "type": h.type.value if hasattr(h.type, "value") else str(h.type),
                "elevation_m": getattr(h, "elevation_m", 50.0),
                "terrain_type": getattr(h, "terrain_type", "plains"),
                "is_rail_terminal": getattr(h, "is_rail_terminal", False),
            }
            for h in hubs
        ]

        edges = [
            {
                "id": str(r.id),
                "origin_hub_id": str(r.origin_hub_id),
                "dest_hub_id": str(r.dest_hub_id),
                "mode": r.mode.value if hasattr(r.mode, "value") else str(r.mode),
                "distance_km": getattr(r, "distance_km", 25.0),
                "avg_transit_hrs": r.avg_transit_hrs,
                "base_cost_per_kg": r.base_cost_per_kg,
                "reliability_score": r.reliability_score,
                "elevation_gain_m": getattr(r, "elevation_gain_m", 0.0),
                "avg_gradient_pct": getattr(r, "avg_gradient_pct", 1.0),
                "terrain_type": getattr(r, "terrain_type", "plains"),
            }
            for r in routes
        ]

        return {"nodes": nodes, "edges": edges}
