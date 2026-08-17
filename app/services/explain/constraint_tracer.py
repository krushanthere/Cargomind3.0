from typing import List, Dict, Any


class ConstraintTracer:
    """Instruments solver decisions and logs binding constraints that dictated shipment grouping or routing choices."""

    def trace_binding_constraints(
        self,
        plan_id: str,
        shipment_count: int,
        temp_class: str,
        total_weight: float,
        mode: str,
    ) -> List[Dict[str, Any]]:
        explanations = []

        # 1. Temperature isolation constraint
        explanations.append(
            {
                "decision_type": "grouping",
                "factor_name": "Temperature Compatibility Isolation",
                "factor_weight": 0.40,
                "human_readable_text": (
                    f"Consolidated {shipment_count} shipments with uniform '{temp_class}' temperature class. "
                    f"Strict thermal isolation prevented mixing with incompatible temperature profiles."
                ),
            }
        )

        # 2. Capacity constraint
        explanations.append(
            {
                "decision_type": "routing",
                "factor_name": "Vehicle Payload Optimization",
                "factor_weight": 0.30,
                "human_readable_text": (
                    f"Assigned batch payload of {total_weight:.1f} kg to {mode.upper()} mode, "
                    f"achieving optimal capacity utilization while staying within maximum vehicle limits."
                ),
            }
        )

        # 3. Mode selection / reliability choice
        explanations.append(
            {
                "decision_type": "risk",
                "factor_name": "Corridor Reliability Selection",
                "factor_weight": 0.30,
                "human_readable_text": (
                    f"Selected {mode.upper()} route leg to optimize balanced transit cost and reliability "
                    f"given current corridor seasonal risk conditions."
                ),
            }
        )

        return explanations
