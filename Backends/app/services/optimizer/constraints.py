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


def validate_vehicle_compatibility(
    shipment: Shipment,
    vehicle_capacity_kg: float,
    vehicle_capacity_cbm: float,
    vehicle_temp_control: bool,
    road_condition: str = "paved",
    vehicle_type: str = "tempo",
) -> Dict[str, Any]:
    """Validates if a shipment can be assigned to a specific rural vehicle."""
    # 1. Weight capacity
    if shipment.weight_kg > vehicle_capacity_kg:
        return {
            "valid": False,
            "reason": f"Shipment weight ({shipment.weight_kg:.1f}kg) exceeds vehicle capacity ({vehicle_capacity_kg:.1f}kg)",
        }

    # 2. Volume capacity
    if shipment.volume_cbm > vehicle_capacity_cbm:
        return {
            "valid": False,
            "reason": f"Shipment volume ({shipment.volume_cbm:.1f}cbm) exceeds vehicle capacity ({vehicle_capacity_cbm:.1f}cbm)",
        }

    # 3. Temperature control for medicines & frozen/chilled goods
    requires_temp_control = (
        (hasattr(shipment, "good_type") and getattr(shipment.good_type, "value", str(shipment.good_type)) == "medicine")
        or shipment.temp_class in [TempClass.frozen, TempClass.chilled]
    )
    if requires_temp_control and not vehicle_temp_control:
        return {
            "valid": False,
            "reason": "Cold-chain medicine / perishables require a temperature-controlled / insulated vehicle",
        }

    # 4. Severe terrain / flood risk vs vehicle type
    if road_condition == "flood_risk" and vehicle_type in ["motorbike", "shared_auto"]:
        return {
            "valid": False,
            "reason": f"Vehicle type '{vehicle_type}' cannot safely traverse flood-risk / waterlogged road segment",
        }

    return {"valid": True}

