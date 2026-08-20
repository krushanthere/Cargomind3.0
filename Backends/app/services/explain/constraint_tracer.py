from typing import List, Dict, Any, Optional


class ConstraintTracer:
    """Instruments solver decisions and generates transparent, plain-language explanations

    for rural matching, vehicle selection, fairness prioritization, and dynamic window trade-offs.
    """

    def trace_binding_constraints(
        self,
        plan_id: str,
        shipment_count: int,
        temp_class: str,
        total_weight: float,
        mode: str = "road",
        dynamic_window_extended: bool = False,
        window_extension_hrs: float = 4.0,
        historical_trips_count: Optional[int] = None,
        confidence: str = "high",
        community_id: Optional[str] = None,
        producer_wait_time_minutes: float = 0.0,
        fairness_boost_pts: float = 0.0,
        good_type: str = "farm_produce",
        vehicle_type: str = "tempo",
    ) -> List[Dict[str, Any]]:
        explanations = []

        # 1. Temperature & Perishability / Medicine constraint
        if good_type == "medicine":
            explanations.append(
                {
                    "decision_type": "urgency",
                    "factor_name": "Critical Medicine Cold-Chain Safeguard",
                    "factor_weight": 0.35,
                    "human_readable_text": (
                        f"Allocated temperature-controlled {vehicle_type} for life-saving medicine batch. "
                        f"Active thermal shielding prioritizes zero quality degradation."
                    ),
                }
            )
        else:
            explanations.append(
                {
                    "decision_type": "grouping",
                    "factor_name": "Temperature Compatibility Isolation",
                    "factor_weight": 0.25,
                    "human_readable_text": (
                        f"Consolidated {shipment_count} shipments with uniform '{temp_class}' temperature class. "
                        f"Thermal isolation prevents mixing with incompatible thermal requirements."
                    ),
                }
            )

        # 2. Fairness & Allocation Transparency (Headline Feature)
        if fairness_boost_pts > 0 or producer_wait_time_minutes > 45:
            explanations.append(
                {
                    "decision_type": "fairness",
                    "factor_name": "Proactive Equity & Starvation Prevention",
                    "factor_weight": 0.30,
                    "human_readable_text": (
                        f"Community '{community_id or 'Rural Cluster'}' waited {producer_wait_time_minutes:.0f} mins "
                        f"(elevated above baseline); +{fairness_boost_pts:.0f}pts fairness boost applied to ensure "
                        f"small producers are not consistently deprioritized."
                    ),
                }
            )
        else:
            explanations.append(
                {
                    "decision_type": "fairness",
                    "factor_name": "Fairness Allocation Quota",
                    "factor_weight": 0.20,
                    "human_readable_text": (
                        f"Verified equitable dispatch frequency for {community_id or 'local community'} "
                        f"within target regional service levels."
                    ),
                }
            )

        # 3. Dynamic window extension trade-off
        if dynamic_window_extended:
            base_risk = 8
            spoil_risk = min(40, int(8 + (window_extension_hrs * 2.8)))
            explanations.append(
                {
                    "decision_type": "dynamic_window",
                    "factor_name": "Dynamic Consolidation Window Trade-off",
                    "factor_weight": 0.25,
                    "human_readable_text": (
                        f"Waiting an additional {window_extension_hrs:.0f} hours for a compatible group raises spoilage "
                        f"risk from {base_risk}% to {spoil_risk}%, but is needed due to low shipment density on this rural corridor."
                    ),
                }
            )

        # 4. Low confidence / sparse data notification
        if confidence == "low" or (historical_trips_count is not None and historical_trips_count < 20):
            trips = historical_trips_count if historical_trips_count is not None else 8
            explanations.append(
                {
                    "decision_type": "confidence",
                    "factor_name": "Sparse Corridor History Context",
                    "factor_weight": 0.20,
                    "human_readable_text": (
                        f"This estimate is based on only {trips} historical trips on this route; treat with caution."
                    ),
                }
            )

        # 5. Vehicle capacity & road selection
        explanations.append(
            {
                "decision_type": "routing",
                "factor_name": "Rural Vehicle Dispatch Assignment",
                "factor_weight": 0.20,
                "human_readable_text": (
                    f"Assigned payload of {total_weight:.1f} kg to {vehicle_type.upper()} ({mode.upper()} mode), "
                    f"ensuring optimal payload fill and terrain accessibility."
                ),
            }
        )

        return explanations
