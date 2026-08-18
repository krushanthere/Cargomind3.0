from datetime import datetime
from typing import List, Dict, Any
from app.models.shipment import TempClass, Shipment


def are_temp_classes_compatible(temp_a: TempClass, temp_b: TempClass) -> bool:
    """Strict temperature-class compatibility check.

    - Frozen (-18°C) cannot be mixed with Chilled (+4°C) or Ambient (+22°C).
    - Chilled (+4°C) cannot be mixed with Frozen or Ambient.
    - Ambient (+22°C) cannot be mixed with Frozen or Chilled.
    """
    return temp_a == temp_b


def validate_group_constraints(
    shipments: List[Shipment],
    max_vehicle_weight_kg: float = 10000.0,
    max_vehicle_volume_cbm: float = 40.0,
) -> Dict[str, Any]:
    """Validates if a proposed group of shipments satisfies weight, volume, and temperature constraints."""
    if not shipments:
        return {"valid": False, "reason": "Empty shipment group"}

    # 1. Temperature compatibility
    first_temp = shipments[0].temp_class
    for s in shipments[1:]:
        if not are_temp_classes_compatible(first_temp, s.temp_class):
            return {
                "valid": False,
                "reason": f"Incompatible temperature classes ({first_temp.value} vs {s.temp_class.value})",
            }

    # 2. Total Weight and Volume
    total_weight = sum(s.weight_kg for s in shipments)
    total_volume = sum(s.volume_cbm for s in shipments)

    if total_weight > max_vehicle_weight_kg:
        return {
            "valid": False,
            "reason": f"Exceeds max vehicle weight capacity ({total_weight:.1f}kg > {max_vehicle_weight_kg:.1f}kg)",
        }

    if total_volume > max_vehicle_volume_cbm:
        return {
            "valid": False,
            "reason": f"Exceeds max vehicle volume capacity ({total_volume:.1f}cbm > {max_vehicle_volume_cbm:.1f}cbm)",
        }

    return {
        "valid": True,
        "total_weight_kg": total_weight,
        "total_volume_cbm": total_volume,
        "temp_class": first_temp,
    }


def validate_sla_and_budget(
    shipment: Shipment,
    transit_hrs: float,
    departure_time: datetime,
    total_cost: float,
) -> Dict[str, Any]:
    """Validates SLA deadline and maximum cost constraints for an individual shipment."""
    # Check SLA deadline
    arrival_time = departure_time.timestamp() + (transit_hrs * 3600.0)
    sla_time = shipment.sla_deadline.timestamp()

    if arrival_time > sla_time:
        sla_overdue_hrs = (arrival_time - sla_time) / 3600.0
        return {
            "valid": False,
            "reason": f"SLA deadline exceeded by {sla_overdue_hrs:.1f} hours",
        }

    # Check max cost limit if set by shipper
    if shipment.max_cost is not None and total_cost > shipment.max_cost:
        return {
            "valid": False,
            "reason": f"Cost ({total_cost:.2f}) exceeds shipper max cost limit ({shipment.max_cost:.2f})",
        }

    return {"valid": True}
