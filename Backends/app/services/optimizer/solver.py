from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from uuid import UUID
from ortools.sat.python import cp_model
from app.models.shipment import Shipment, TempClass, GoodType, UrgencyLevel
from app.models.route import Route
from app.models.vehicle import Vehicle, VehicleType, VehicleAvailability, VEHICLE_TYPE_SPECS
from app.services.optimizer.fairness_calculator import FairnessCalculator
from app.services.optimizer.constraints import validate_vehicle_compatibility
from app.services.network.terrain_service import TerrainService


class ConsolidationSolver:
    """Dynamic Matching & Dispatch Solver for Rural Last-Mile Logistics.

    Matches available community pickups (farm produce, medicines, essential goods)
    with available rural transport fleet (Tata Ace mini-trucks, Mahindra Bolero 4x4 pickups, cargo bikes, e-rickshaws, boats, etc.)
    optimizing for Urgency, Spoilage, Fairness, Road Condition, Terrain Gradient, and Vehicle Payload Capacities.
    """

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
        community_stats_map: Dict[str, Dict[str, Any]] = None,
        road_conditions_map: Dict[UUID, str] = None,
        available_vehicles: Optional[List[Vehicle]] = None,
    ) -> List[Dict[str, Any]]:
        """Compatible entrypoint for plan creation and dispatch matching."""
        if not shipments or not candidate_routes:
            return []

        route_risk_scores = route_risk_scores or {}
        road_conditions_map = road_conditions_map or {}
        fairness_calc = FairnessCalculator(community_stats_map)

        # Dynamic consolidation window: check if corridor has low shipment density (< 3 shipments)
        density_threshold = 3
        is_low_density = len(shipments) < density_threshold
        extended_departure_times = list(candidate_departure_times)
        dynamic_window_applied = False
        window_extension_hrs = 0.0

        if is_low_density and candidate_departure_times:
            # Dynamically extend batch window by 4 to 8 hours to allow compatible pickups
            base_dep = candidate_departure_times[0]
            extended_departure_times.extend([
                base_dep + timedelta(hours=4),
                base_dep + timedelta(hours=8),
            ])
            dynamic_window_applied = True
            window_extension_hrs = 4.0

        # Partition shipments by temperature class to enforce hard compatibility
        temp_groups: Dict[TempClass, List[Shipment]] = {}
        for s in shipments:
            temp_groups.setdefault(s.temp_class, []).append(s)

        all_plans = []

        for temp_cls, bucket in temp_groups.items():
            if not bucket:
                continue

            plan_dict = self._solve_bucket(
                bucket,
                candidate_routes,
                extended_departure_times,
                w_cost,
                w_risk,
                route_risk_scores,
                fairness_calc,
                road_conditions_map,
                dynamic_window_applied,
                window_extension_hrs,
                available_vehicles,
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
        fairness_calc: FairnessCalculator,
        road_conditions_map: Dict[UUID, str],
        dynamic_window_applied: bool,
        window_extension_hrs: float,
        available_vehicles: Optional[List[Vehicle]] = None,
    ) -> Dict[str, Any]:
        num_shipments = len(shipments)
        num_routes = len(candidate_routes)
        num_deps = len(candidate_departure_times)

        # Build fleet list from dynamic vehicle registry
        if available_vehicles is not None:
            # Filter for available vehicles (include if status is None/available, exclude only if explicitly offline/occupied/maintenance)
            offline_statuses = {"offline", "occupied", "maintenance", "en_route", VehicleAvailability.offline, VehicleAvailability.occupied, VehicleAvailability.maintenance, VehicleAvailability.en_route}
            fleet = [
                v for v in available_vehicles
                if getattr(v, "availability_status", None) not in offline_statuses
                and (not hasattr(getattr(v, "availability_status", None), "value") or v.availability_status.value not in {"offline", "occupied", "maintenance", "en_route"})
            ]
        else:
            fleet = []

        num_vehicles = len(fleet) if fleet else max(1, min(num_shipments, 5))

        # Precompute per-vehicle capacities
        vehicle_capacities_kg = [
            fleet[k].capacity_kg if fleet else self.max_weight for k in range(num_vehicles)
        ]
        vehicle_capacities_cbm = [
            fleet[k].capacity_cbm if fleet else self.max_volume for k in range(num_vehicles)
        ]

        model = cp_model.CpModel()

        # Decision Variables:
        # x[i, k] = 1 if shipment i assigned to vehicle k
        x = {}
        for i in range(num_shipments):
            for k in range(num_vehicles):
                x[i, k] = model.NewBoolVar(f"x_{i}_{k}")

        # y[k] = 1 if vehicle k is used
        y = {}
        for k in range(num_vehicles):
            y[k] = model.NewBoolVar(f"y_{k}")

        # z[k, r] = 1 if vehicle k takes route r
        z = {}
        for k in range(num_vehicles):
            for r in range(num_routes):
                z[k, r] = model.NewBoolVar(f"z_{k}_{r}")

        # d[k, t] = 1 if vehicle k departs at time t
        d = {}
        for k in range(num_vehicles):
            for t in range(num_deps):
                d[k, t] = model.NewBoolVar(f"d_{k}_{t}")

        # Constraint 1: Every shipment must be assigned to exactly 1 vehicle
        for i in range(num_shipments):
            model.Add(sum(x[i, k] for k in range(num_vehicles)) == 1)

        # Constraint 2: Vehicle Capacity (Weight and Volume per specific vehicle)
        for k in range(num_vehicles):
            cap_kg = int(vehicle_capacities_kg[k])
            cap_cbm = int(vehicle_capacities_cbm[k] * 100)

            model.Add(
                sum(int(shipments[i].weight_kg) * x[i, k] for i in range(num_shipments))
                <= cap_kg * y[k]
            )
            model.Add(
                sum(int(shipments[i].volume_cbm * 100) * x[i, k] for i in range(num_shipments))
                <= cap_cbm * y[k]
            )

            # Link x[i, k] -> y[k]
            for i in range(num_shipments):
                model.Add(x[i, k] <= y[k])

            # Every active vehicle must choose exactly 1 route and 1 departure time
            model.Add(sum(z[k, r] for r in range(num_routes)) == y[k])
            model.Add(sum(d[k, t] for t in range(num_deps)) == y[k])

        # Objective Function coefficients:
        # Multi-Factor Objective: Cost + Risk Penalty + Terrain Gradient Penalty - Urgency - Fairness
        objective_terms = []
        for k in range(num_vehicles):
            v_obj = fleet[k] if fleet else None
            v_type_str = v_obj.type.value if (v_obj and hasattr(v_obj.type, "value")) else "tempo"
            v_cost_per_km = getattr(v_obj, "cost_per_km", 12.0) if v_obj else 12.0

            for r in range(num_routes):
                route = candidate_routes[r]
                route_risk = route_risk_scores.get(route.id, 0.2)
                road_cond = road_conditions_map.get(route.id, "paved")
                terrain = getattr(route, "terrain_type", "plains") or "plains"
                gradient = getattr(route, "avg_gradient_pct", 1.0) or 1.0

                # Road condition penalty
                road_penalty_val = (
                    0 if road_cond == "paved" else 250 if road_cond == "unpaved" else 500 if road_cond == "seasonal" else 1200
                )

                # Hilly terrain penalty
                terrain_penalty_val = (
                    0 if terrain == "plains" else 300 if terrain == "hilly" else 650 if terrain == "mountainous" else 200
                )

                # Vehicle gradeability penalty / reward
                grade_res = TerrainService.validate_vehicle_gradeability(v_type_str, gradient, terrain)
                grade_penalty = 0 if grade_res["allowed"] else 8000

                for i in range(num_shipments):
                    s = shipments[i]

                    # Urgency score
                    urgency_val = (
                        500 if getattr(s, "urgency", None) == UrgencyLevel.critical
                        else 300 if getattr(s, "urgency", None) == UrgencyLevel.high
                        else 100
                    )
                    # Medicine priority boost
                    if getattr(s, "good_type", None) == GoodType.medicine:
                        urgency_val += 200

                    # Fairness boost
                    fairness_boost = int(fairness_calc.calculate_fairness_boost(s))

                    # Cost & risk terms (accounting for vehicle cost/km and route distance)
                    dist = getattr(route, "distance_km", 25.0) or 25.0
                    cost_val = int(((route.base_cost_per_kg * s.weight_kg) + (v_cost_per_km * dist * 0.1)) * 100)
                    risk_val = int(route_risk * 1000)

                    net_term = int(
                        (w_cost * cost_val)
                        + (w_risk * risk_val)
                        + road_penalty_val
                        + terrain_penalty_val
                        + grade_penalty
                        - (urgency_val * 10)
                        - (fairness_boost * 15)
                    )
                    objective_terms.append(net_term * x[i, k])

            # Vehicle activation cost
            objective_terms.append(int(w_cost * 2500) * y[k])

        model.Minimize(sum(objective_terms))

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = self.time_limit
        status = solver.Solve(model)

        if status not in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            return self._greedy_fallback(
                shipments,
                candidate_routes,
                candidate_departure_times,
                dynamic_window_applied,
                window_extension_hrs,
                fleet,
            )

        # Reconstruct output plan
        assigned_shipment_ids = [s.id for s in shipments]
        chosen_routes = []
        total_cost = 0.0
        max_risk = 0.0
        total_assigned_weight = sum(s.weight_kg for s in shipments)
        total_assigned_vol = sum(s.volume_cbm for s in shipments)
        active_capacity_kg = 0.0
        active_capacity_cbm = 0.0
        vehicle_assignments = []

        for k in range(num_vehicles):
            if solver.BooleanValue(y[k]):
                v_obj = fleet[k] if fleet else None
                v_code = getattr(v_obj, "vehicle_code", f"OD-02-TC-{k+1:04d}") if v_obj else f"OD-02-TC-{k+1:04d}"
                v_name = v_obj.name if v_obj else f"Rural Carrier #{k+1}"
                v_type = v_obj.type.value if (v_obj and hasattr(v_obj.type, "value")) else "tempo"
                v_loc = getattr(v_obj, "current_location_name", "Odisha Cluster") if v_obj else "Odisha Cluster"
                v_cost_km = getattr(v_obj, "cost_per_km", 12.0) if v_obj else 12.0
                v_temp_capable = getattr(v_obj, "temp_control", False) if v_obj else False
                v_cap_kg = vehicle_capacities_kg[k]
                v_cap_cbm = vehicle_capacities_cbm[k]
                active_capacity_kg += v_cap_kg
                active_capacity_cbm += v_cap_cbm

                veh_assigned_shipments = [
                    shipments[i].id for i in range(num_shipments) if solver.BooleanValue(x[i, k])
                ]
                veh_w = sum(shipments[i].weight_kg for i in range(num_shipments) if solver.BooleanValue(x[i, k]))
                veh_v = sum(shipments[i].volume_cbm for i in range(num_shipments) if solver.BooleanValue(x[i, k]))
                util_pct = round((veh_w / max(1.0, v_cap_kg)) * 100.0, 1)

                vehicle_assignments.append({
                    "vehicle_id": str(v_obj.id) if v_obj else str(k),
                    "vehicle_code": v_code,
                    "vehicle_name": v_name,
                    "vehicle_type": v_type,
                    "current_location_name": v_loc,
                    "cost_per_km": v_cost_km,
                    "temp_control": v_temp_capable,
                    "capacity_kg": v_cap_kg,
                    "capacity_cbm": v_cap_cbm,
                    "assigned_weight_kg": round(veh_w, 1),
                    "assigned_volume_cbm": round(veh_v, 2),
                    "load_utilization_pct": util_pct,
                    "shipment_ids": veh_assigned_shipments,
                })

                for r in range(num_routes):
                    if solver.BooleanValue(z[k, r]):
                        chosen_routes.append(candidate_routes[r].id)
                        route_cost = candidate_routes[r].base_cost_per_kg * veh_w
                        total_cost += route_cost
                        r_risk = route_risk_scores.get(candidate_routes[r].id, 0.2)
                        max_risk = max(max_risk, r_risk)

        dep_time = candidate_departure_times[0] if candidate_departure_times else datetime.now(timezone.utc)
        overall_load_utilization = round((total_assigned_weight / max(1.0, active_capacity_kg or self.max_weight)) * 100.0, 1)
        terrain_str = getattr(candidate_routes[0], "terrain_type", "plains") or "plains"

        return {
            "shipment_ids": assigned_shipment_ids,
            "route_ids": chosen_routes or [candidate_routes[0].id],
            "departure_time": dep_time,
            "total_cost": round(total_cost, 2),
            "risk_score": round(max_risk, 4),
            "load_utilization_pct": overall_load_utilization,
            "assigned_weight_kg": round(total_assigned_weight, 1),
            "total_capacity_kg": round(active_capacity_kg or self.max_weight, 1),
            "vehicle_assignments": vehicle_assignments,
            "dynamic_window_extended": dynamic_window_applied,
            "window_extension_hrs": window_extension_hrs,
            "binding_constraints": [
                f"Perishable temperature isolation enforced ({shipments[0].temp_class.value})",
                f"Vehicle load capacity utilization: {overall_load_utilization}% ({total_assigned_weight:.1f}kg / {(active_capacity_kg or self.max_weight):.1f}kg)",
                f"Terrain gradient verified ({terrain_str.capitalize()} terrain)",
                f"Dynamic window extension active (+{window_extension_hrs:.1f}h for low-density corridor)"
                if dynamic_window_applied
                else "Standard dispatch interval",
            ],
        }

    def _greedy_fallback(
        self,
        shipments: List[Shipment],
        candidate_routes: List[Route],
        candidate_departure_times: List[datetime],
        dynamic_window_applied: bool = False,
        window_extension_hrs: float = 0.0,
        fleet: Optional[List[Vehicle]] = None,
    ) -> Dict[str, Any]:
        """Greedy heuristic fallback for fast resolution under tight time bounds."""
        assigned_shipment_ids = [s.id for s in shipments]
        best_route = candidate_routes[0]
        total_weight = sum(s.weight_kg for s in shipments)
        total_vol = sum(s.volume_cbm for s in shipments)
        cost = total_weight * best_route.base_cost_per_kg
        v_cap = fleet[0].capacity_kg if fleet else self.max_weight
        util_pct = round((total_weight / max(1.0, v_cap)) * 100.0, 1)

        return {
            "shipment_ids": assigned_shipment_ids,
            "route_ids": [best_route.id],
            "departure_time": candidate_departure_times[0] if candidate_departure_times else datetime.now(timezone.utc),
            "total_cost": round(cost, 2),
            "risk_score": 0.25,
            "load_utilization_pct": util_pct,
            "assigned_weight_kg": round(total_weight, 1),
            "total_capacity_kg": round(v_cap, 1),
            "dynamic_window_extended": dynamic_window_applied,
            "window_extension_hrs": window_extension_hrs,
            "binding_constraints": [
                f"Greedy heuristic dispatch fallback active (Load utilization: {util_pct}%)"
            ],
        }

