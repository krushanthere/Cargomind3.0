import math
from typing import Dict, List, Any, Tuple, Optional
import numpy as np


class SpatialTemporalRoadGraph:
    """Spatio-Temporal Graph representation for North-Eastern Region (NER) logistics corridors.
    Nodes: Logistics hubs & road segment waypoints.
    Edges: Intermodal highway, rail, and waterway corridors with physical geometric features.
    """

    # Authentic NER corridor topology benchmarks
    CORRIDORS = [
        {"id": "cor-nh27", "name": "NH-27 Guwahati–Siliguri 4-Lane Trunk", "u": "guwahati", "v": "siliguri", "dist_km": 480.0, "base_iri": 2.8, "elev_m": 85.0, "grad_pct": 1.2, "type": "highway"},
        {"id": "cor-gsroad", "name": "GS Road Shillong–Guwahati Hill Expressway", "u": "guwahati", "v": "shillong", "dist_km": 100.0, "base_iri": 3.2, "elev_m": 1525.0, "grad_pct": 5.8, "type": "hill_road"},
        {"id": "cor-nh10", "name": "NH-10 Sevoke–Gangtok Teesta Gorge Pass", "u": "siliguri", "v": "gangtok", "dist_km": 115.0, "base_iri": 6.5, "elev_m": 1650.0, "grad_pct": 8.4, "type": "mountain_pass"},
        {"id": "cor-nh29", "name": "NH-29 Dimapur–Kohima–Imphal Ghat Road", "u": "dimapur", "v": "imphal", "dist_km": 215.0, "base_iri": 5.8, "elev_m": 1445.0, "grad_pct": 7.2, "type": "mountain_pass"},
        {"id": "cor-nh37", "name": "NH-37 Jorhat–Guwahati Upper Assam Arterial", "u": "jorhat", "v": "guwahati", "dist_km": 305.0, "base_iri": 3.4, "elev_m": 95.0, "grad_pct": 1.5, "type": "highway"},
        {"id": "cor-nh13", "name": "NH-13 Trans-Arunachal Tawang Highland Arterial", "u": "tezpur", "v": "tawang", "dist_km": 320.0, "base_iri": 7.8, "elev_m": 3048.0, "grad_pct": 12.5, "type": "highland_track"},
        {"id": "cor-nh6", "name": "NH-6 Meghalaya–Silchar Barak Valley Pass", "u": "shillong", "v": "silchar", "dist_km": 135.0, "base_iri": 8.5, "elev_m": 850.0, "grad_pct": 9.0, "type": "sinking_zone"},
        {"id": "cor-majuli", "name": "Majuli Island Ferry & Ro-Ro Riverine Route", "u": "jorhat", "v": "majuli", "dist_km": 45.0, "base_iri": 4.0, "elev_m": 84.0, "grad_pct": 0.5, "type": "riverine"},
    ]

    NODES = [
        "guwahati", "siliguri", "shillong", "gangtok", "dimapur", "imphal", "jorhat", "tezpur", "tawang", "silchar", "majuli"
    ]

    @classmethod
    def get_adjacency_matrix(cls) -> Tuple[np.ndarray, List[str]]:
        """Constructs normalized symmetric normalized graph Laplacian matrix S = D^(-1/2) * (A + I) * D^(-1/2)."""
        n = len(cls.NODES)
        node_idx = {name: i for i, name in enumerate(cls.NODES)}
        a_mat = np.eye(n, dtype=np.float32)  # Self-loops

        for c in cls.CORRIDORS:
            i = node_idx.get(c["u"])
            j = node_idx.get(c["v"])
            if i is not None and j is not None:
                # Spatial weight inversely proportional to distance and terrain slope
                w = float(1.0 / (1.0 + math.log1p(c["dist_km"] / 50.0) + (c["grad_pct"] * 0.1)))
                a_mat[i, j] = w
                a_mat[j, i] = w

        # Degree matrix D
        deg = np.sum(a_mat, axis=1)
        deg_inv_sqrt = np.where(deg > 0, 1.0 / np.sqrt(deg), 0.0)
        d_inv = np.diag(deg_inv_sqrt)

        # Normalized Laplacian
        s_norm = d_inv @ a_mat @ d_inv
        return s_norm, cls.NODES
