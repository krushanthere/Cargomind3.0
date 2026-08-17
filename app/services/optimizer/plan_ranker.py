from typing import List, Dict, Any


class PlanRanker:
    """Takes solver outputs, deduplicates, and ranks them based on Pareto optimality between total_cost and risk_score."""

    def rank_and_select_pareto_plans(self, solver_plans: List[Dict[str, Any]], top_k: int = 3) -> List[Dict[str, Any]]:
        if not solver_plans:
            return []

        # Deduplicate plans based on (total_cost, risk_score, departure_time)
        unique_plans = []
        seen = set()

        for plan in solver_plans:
            key = (
                round(plan["total_cost"], 2),
                round(plan["risk_score"], 4),
                tuple(sorted([str(s) for s in plan.get("shipment_ids", [])])),
                tuple(sorted([str(r) for r in plan.get("route_ids", [])])),
            )
            if key not in seen:
                seen.add(key)
                unique_plans.append(plan)

        if not unique_plans:
            return []

        # Compute Pareto Dominance
        pareto_front = []
        non_pareto = []

        for p in unique_plans:
            is_dominated = False
            for other in unique_plans:
                if p == other:
                    continue
                # other dominates p if cost(other) <= cost(p) and risk(other) <= risk(p) and at least 1 strict inequality
                if (
                    other["total_cost"] <= p["total_cost"]
                    and other["risk_score"] <= p["risk_score"]
                    and (other["total_cost"] < p["total_cost"] or other["risk_score"] < p["risk_score"])
                ):
                    is_dominated = True
                    break

            if not is_dominated:
                pareto_front.append(p)
            else:
                non_pareto.append(p)

        # Sort Pareto front by balanced score = 0.5 * norm_cost + 0.5 * norm_risk
        max_c = max(p["total_cost"] for p in unique_plans) or 1.0
        max_r = max(p["risk_score"] for p in unique_plans) or 1.0

        for p in pareto_front + non_pareto:
            norm_c = p["total_cost"] / max_c
            norm_r = p["risk_score"] / max_r
            p["rank_score"] = round(0.5 * norm_c + 0.5 * norm_r, 4)

        pareto_front.sort(key=lambda x: x["rank_score"])
        non_pareto.sort(key=lambda x: x["rank_score"])

        ranked_list = pareto_front + non_pareto

        # Assign plan_rank (1 = top pick)
        for rank_idx, plan in enumerate(ranked_list[:top_k], start=1):
            plan["plan_rank"] = rank_idx

        return ranked_list[:top_k]
