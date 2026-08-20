from typing import Dict, Any, List
from app.models.shipment import Shipment


class FairnessCalculator:
    """Calculates allocation priority adjustments based on producer & community historical wait times.

    Ensures smallholders and vulnerable remote communities are not systematically deprioritized.
    """

    def __init__(self, community_stats_map: Dict[str, Dict[str, Any]] = None, regional_avg_wait: float = 60.0):
        self.community_stats = community_stats_map or {}
        self.regional_avg_wait = max(15.0, regional_avg_wait)

    def calculate_fairness_boost(self, shipment: Shipment) -> float:
        """Computes a dynamic fairness priority boost score (0 to 500).

        - Producers with higher historical average wait time get higher boost.
        - Producers with zero recent matches get an immediate starvation prevention boost.
        """
        comm_id = shipment.community_id or "comm-cluster-01"
        stats = self.community_stats.get(comm_id, {"total_matches": 0, "avg_wait_minutes": 0.0})

        avg_wait = stats.get("avg_wait_minutes", 0.0)
        total_matches = stats.get("total_matches", 0)

        # 1. Wait time disparity ratio
        wait_ratio = (avg_wait / self.regional_avg_wait) if self.regional_avg_wait > 0 else 1.0
        wait_boost = min(300.0, max(0.0, (wait_ratio - 0.8) * 150.0))

        # 2. Starvation penalty (infrequent matches get boost)
        starvation_boost = 150.0 / (1.0 + total_matches)

        total_boost = round(wait_boost + starvation_boost, 2)
        return total_boost

    def get_fairness_rationale(self, shipment: Shipment) -> str:
        comm_id = shipment.community_id or "comm-cluster-01"
        stats = self.community_stats.get(comm_id, {"total_matches": 0, "avg_wait_minutes": 0.0})
        avg_w = stats.get("avg_wait_minutes", 0.0)

        if avg_w > self.regional_avg_wait:
            delta = round((avg_w - self.regional_avg_wait) / 60.0, 1)
            return (
                f"Community '{comm_id}' average wait time ({avg_w:.0f}m) exceeds regional average "
                f"({self.regional_avg_wait:.0f}m) by {delta}h; +{self.calculate_fairness_boost(shipment):.0f}pts fairness boost applied."
            )
        return f"Fair allocation quota verified for {comm_id} (baseline wait within acceptable bounds)."
