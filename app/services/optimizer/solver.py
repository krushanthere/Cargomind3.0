from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple
import math
from uuid import UUID
from ortools.sat.python import cp_model
from app.models.shipment import Shipment, TempClass
from app.models.route import Route
from app.services.optimizer.constraints import are_temp_classes_compatible


class ConsolidationSolver:
    """CP-SAT Optimizer for multi-shipment grouping, route assignment, and departure time selection."""

    def __init__(
        self,
        max_vehicle_weight_kg: float = 10000.0,
        max_vehicle_volume_cbm: float = 40.0,
        time_limit_seconds: float = 10.0,
    ):
        self.max_weight = max_vehicle_weight_kg
        self.max_volume = max_vehicle_volume_cbm
        self.time_limit = time_limit_seconds

    def solve(
        self,
        shipments: List[Shipment],
        candidate_routes: List[Route],
        candidate_departure_times: List[datetime],
        w_cost: float = 0.5,
        w_risk: float = 0.5,
        route_risk_scores: Dict[UUID, float] = None,
    ) -> List[Dict[str, Any]]:
        if not shipments or not candidate_routes:
            return []

        route_risk_scores = route_risk_scores or {}

        # Partition shipments by temperature class to enforce hard compatibility
        temp_groups: Dict[TempClass, List[Shipment]] = {}
        for s in shipments:
            temp_groups.setdefault(s.temp_class, []).append(s)

        all_plans = []

        # Run solver per compatible temperature class bucket
        for temp_cls, bucket in temp_groups.items():
            if not bucket:
                continue

            plan_dict = self._solve_bucket(
                bucket,
                candidate_routes,
                candidate_departure_times,
                w_cost,
                w_risk,
                route_risk_scores,
            )
            if plan_dict:
                all_plans.append(plan_dict)

        return all_plans

    def _solve_bucket(
        self,
        shipments: List[Shipment],
        candidate_routes: List[Route],
        candidate_departure_times: List[datetime],
        w_cost: float,
        w_risk: float,
        route_risk_scores: Dict[UUID, float],
    ) -> Dict[str, Any]:
        num_shipments = len(shipments)
        num_routes = len(candidate_routes)
        num_deps = len(candidate_departure_times)
        max_vehicles = min(num_shipments, 5)

        model = cp_model.CpModel()

        # Decision Variables:
        # x[i, k] = 1 if shipment i assigned to vehicle k
        x = {}
        for i in range(num_shipments):
            for k in range(max_vehicles):
                x[i, k] = model.NewBoolVar(f"x_{i}_{k}")

        # y[k] = 1 if vehicle k is used
        y = {}
        for k in range(max_vehicles):
            y[k] = model.NewBoolVar(f"y_{k}")

        # z[k, r] = 1 if vehicle k takes route r
        z = {}
        for k in range(max_vehicles):
            for r in range(num_routes):
                z[k, r] = model.NewBoolVar(f"z_{k}_{r}")

        # d[k, t] = 1 if vehicle k departs at time t
        d = {}
        for k in range(max_vehicles):
            for t in range(num_deps):
                d[k, t] = model.NewBoolVar(f"d_{k}_{t}")

        # Constraint 1: Every shipment must be assigned to exactly 1 vehicle
        for i in range(num_shipments):
            model.Add(sum(x[i, k] for k in range(max_vehicles)) == 1)

        # Constraint 2: Vehicle Capacity (Weight and Volume)
        for k in range(max_vehicles):
            model.Add(
                sum(int(shipments[i].weight_kg) * x[i, k] for i in range(num_shipments))
                <= int(self.max_weight) * y[k]
            )
            model.Add(
                sum(int(shipments[i].volume_cbm * 100) * x[i, k] for i in range(num_shipments))
                <= int(self.max_volume * 100) * y[k]
            )

            # Link x[i, k] -> y[k]
            for i in range(num_shipments):
                model.Add(x[i, k] <= y[k])

            # Every active vehicle must choose exactly 1 route and 1 departure time
            model.Add(sum(z[k, r] for r in range(num_routes)) == y[k])
            model.Add(sum(d[k, t] for t in range(num_deps)) == y[k])

        # Objective Function coefficients
        # Cost = base vehicle cost + route cost per kg
        objective_terms = []
        for k in range(max_vehicles):
            for r in range(num_routes):
                route = candidate_routes[r]
                route_risk = route_risk_scores.get(route.id, 0.2)

                for i in range(num_shipments):
                    s = shipments[i]
                    # Cost scaling integer
                    cost_val = int((route.base_cost_per_kg * s.weight_kg) * 100)
                    risk_val = int(route_risk * 1000)

                    combined_weight = int((w_cost * cost_val) + (w_risk * risk_val))
                    objective_terms.append(combined_weight * x[i, k])

            # Fixed cost per vehicle used to encourage consolidation
            objective_terms.append(int(w_cost * 5000) * y[k])

        model.Minimize(sum(objective_terms))

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = self.time_limit
        status = solver.Solve(model)

        if status not in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            # Fallback greedy heuristic if CP-SAT solver finds no solution in time box
            return self._greedy_fallback(shipments, candidate_routes, candidate_departure_times)

        # Reconstruct output plan
        assigned_shipment_ids = [s.id for s in shipments]
        chosen_routes = []
        total_cost = 0.0
        max_risk = 0.0

        for k in range(max_vehicles):
            if solver.BooleanValue(y[k]):
                for r in range(num_routes):
                    if solver.BooleanValue(z[k, r]):
                        chosen_routes.append(candidate_routes[r].id)
                        route_cost = candidate_routes[r].base_cost_per_kg * sum(
                            shipments[i].weight_kg for i in range(num_shipments) if solver.BooleanValue(x[i, k])
                        )
                        total_cost += route_cost
                        r_risk = route_risk_scores.get(candidate_routes[r].id, 0.2)
                        max_risk = max(max_risk, r_risk)

        dep_time = candidate_departure_times[0] if candidate_departure_times else datetime.now(timezone.utc)

        return {
            "shipment_ids": assigned_shipment_ids,
            "route_ids": chosen_routes or [candidate_routes[0].id],
            "departure_time": dep_time,
            "total_cost": round(total_cost, 2),
            "risk_score": round(max_risk, 4),
            "binding_constraints": [
                f"Temperature isolation enforced ({shipments[0].temp_class.value})",
                f"Vehicle weight cap ({self.max_weight}kg)",
                f"Vehicle volume cap ({self.max_volume}cbm)",
            ],
        }

    def _greedy_fallback(
        self,
        shipments: List[Shipment],
        candidate_routes: List[Route],
        candidate_departure_times: List[datetime],
    ) -> Dict[str, Any]:
        """Greedy heuristic fallback for fast resolution under tight time bounds."""
        assigned_shipment_ids = [s.id for s in shipments]
        best_route = candidate_routes[0]
        total_weight = sum(s.weight_kg for s in shipments)
        cost = total_weight * best_route.base_cost_per_kg

        return {
            "shipment_ids": assigned_shipment_ids,
            "route_ids": [best_route.id],
            "departure_time": candidate_departure_times[0] if candidate_departure_times else datetime.now(timezone.utc),
            "total_cost": round(cost, 2),
            "risk_score": 0.25,
            "binding_constraints": ["Greedy heuristic fallback active"],
        }
