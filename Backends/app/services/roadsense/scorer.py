import math
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from uuid import UUID

from app.models.roadsense import (
    RoadSegment,
    RoadReport,
    VehicleProfile,
    RoadSegmentStatus,
    RoadSurfaceType,
    RoadWidthClass,
    VehicleProfileType,
    ClearanceClass,
)
from app.schemas.roadsense import RoadabilityScoreResponse


# Pre-defined vehicle capability rules
VEHICLE_CAPABILITIES: Dict[str, Dict[str, Any]] = {
    "cargo_boat": {
        "name": "Brahmaputra/Barak Shallow-Draft Cargo Boat",
        "max_width_m": 3.50,
        "min_width_class": [RoadWidthClass.two_lane, RoadWidthClass.intermediate, RoadWidthClass.single_lane, RoadWidthClass.narrow_track],
        "allowed_surfaces": [RoadSurfaceType.paved, RoadSurfaceType.unpaved, RoadSurfaceType.dirt, RoadSurfaceType.gravel, RoadSurfaceType.asphalt, RoadSurfaceType.concrete],
        "clearance": "high",
        "min_viable_score": 15.0,
    },
    "cargo_ropeway": {
        "name": "Aerial Gravity & Motorized Cargo Ropeway",
        "max_width_m": 1.20,
        "min_width_class": [RoadWidthClass.two_lane, RoadWidthClass.intermediate, RoadWidthClass.single_lane, RoadWidthClass.narrow_track],
        "allowed_surfaces": [RoadSurfaceType.paved, RoadSurfaceType.unpaved, RoadSurfaceType.dirt, RoadSurfaceType.gravel, RoadSurfaceType.asphalt, RoadSurfaceType.concrete],
        "clearance": "ultra_high",
        "min_viable_score": 10.0,
    },
    "atv": {
        "name": "Heavy-Duty 4x4/6x6 Mountain ATV",
        "max_width_m": 1.40,
        "min_width_class": [RoadWidthClass.two_lane, RoadWidthClass.intermediate, RoadWidthClass.single_lane, RoadWidthClass.narrow_track],
        "allowed_surfaces": [
            RoadSurfaceType.asphalt,
            RoadSurfaceType.concrete,
            RoadSurfaceType.paved,
            RoadSurfaceType.gravel,
            RoadSurfaceType.unpaved,
            RoadSurfaceType.dirt,
        ],
        "clearance": "ultra_high",
        "min_viable_score": 15.0,
    },
    "river_ferry": {
        "name": "Inland Ro-Ro / Ro-Pax River Ferry",
        "max_width_m": 8.50,
        "min_width_class": [RoadWidthClass.two_lane, RoadWidthClass.intermediate, RoadWidthClass.single_lane, RoadWidthClass.narrow_track],
        "allowed_surfaces": [RoadSurfaceType.paved, RoadSurfaceType.unpaved, RoadSurfaceType.dirt, RoadSurfaceType.gravel, RoadSurfaceType.asphalt, RoadSurfaceType.concrete],
        "clearance": "high",
        "min_viable_score": 20.0,
    },
    "truck": {
        "name": "Heavy 16T Commercial Truck",
        "max_width_m": 2.50,
        "min_width_class": [RoadWidthClass.two_lane, RoadWidthClass.intermediate],
        "allowed_surfaces": [RoadSurfaceType.asphalt, RoadSurfaceType.concrete, RoadSurfaceType.paved],
        "clearance": "standard",
        "min_viable_score": 60.0,
    },
    "mini_truck": {
        "name": "Tata Ace / Mini-Truck",
        "max_width_m": 1.85,
        "min_width_class": [RoadWidthClass.two_lane, RoadWidthClass.intermediate, RoadWidthClass.single_lane],
        "allowed_surfaces": [
            RoadSurfaceType.asphalt,
            RoadSurfaceType.concrete,
            RoadSurfaceType.paved,
            RoadSurfaceType.gravel,
        ],
        "clearance": "standard",
        "min_viable_score": 45.0,
    },
    "tata_ace": {
        "name": "Tata Ace (Chhota Hathi)",
        "max_width_m": 1.85,
        "min_width_class": [RoadWidthClass.two_lane, RoadWidthClass.intermediate, RoadWidthClass.single_lane],
        "allowed_surfaces": [
            RoadSurfaceType.asphalt,
            RoadSurfaceType.concrete,
            RoadSurfaceType.paved,
            RoadSurfaceType.gravel,
        ],
        "clearance": "standard",
        "min_viable_score": 45.0,
    },
    "bolero_pickup": {
        "name": "Mahindra Bolero Pickup 4x4",
        "max_width_m": 1.95,
        "min_width_class": [
            RoadWidthClass.two_lane,
            RoadWidthClass.intermediate,
            RoadWidthClass.single_lane,
            RoadWidthClass.narrow_track,
        ],
        "allowed_surfaces": [
            RoadSurfaceType.asphalt,
            RoadSurfaceType.concrete,
            RoadSurfaceType.paved,
            RoadSurfaceType.gravel,
            RoadSurfaceType.unpaved,
            RoadSurfaceType.dirt,
        ],
        "clearance": "high",
        "min_viable_score": 35.0,
    },
    "pickup_4x4": {
        "name": "Mahindra Bolero Pickup 4x4",
        "max_width_m": 1.95,
        "min_width_class": [
            RoadWidthClass.two_lane,
            RoadWidthClass.intermediate,
            RoadWidthClass.single_lane,
            RoadWidthClass.narrow_track,
        ],
        "allowed_surfaces": [
            RoadSurfaceType.asphalt,
            RoadSurfaceType.concrete,
            RoadSurfaceType.paved,
            RoadSurfaceType.gravel,
            RoadSurfaceType.unpaved,
            RoadSurfaceType.dirt,
        ],
        "clearance": "high",
        "min_viable_score": 35.0,
    },
    "tractor": {
        "name": "Agro Farm Tractor Trailer",
        "max_width_m": 2.20,
        "min_width_class": [
            RoadWidthClass.two_lane,
            RoadWidthClass.intermediate,
            RoadWidthClass.single_lane,
            RoadWidthClass.narrow_track,
        ],
        "allowed_surfaces": [
            RoadSurfaceType.asphalt,
            RoadSurfaceType.concrete,
            RoadSurfaceType.paved,
            RoadSurfaceType.gravel,
            RoadSurfaceType.unpaved,
            RoadSurfaceType.dirt,
        ],
        "clearance": "ultra_high",
        "min_viable_score": 20.0,
    },
    "two_wheeler": {
        "name": "Cargo Motorbike / E-Bike",
        "max_width_m": 0.85,
        "min_width_class": [
            RoadWidthClass.two_lane,
            RoadWidthClass.intermediate,
            RoadWidthClass.single_lane,
            RoadWidthClass.narrow_track,
        ],
        "allowed_surfaces": [
            RoadSurfaceType.asphalt,
            RoadSurfaceType.concrete,
            RoadSurfaceType.paved,
            RoadSurfaceType.gravel,
            RoadSurfaceType.unpaved,
            RoadSurfaceType.dirt,
        ],
        "clearance": "high",
        "min_viable_score": 30.0,
    },
}


class RoadSenseScorer:
    """RoadSense Roadability Scoring Engine:
    Combines static road attributes with recency-decayed crowdsourced driver reports,
    evaluates vehicle profile compatibility, and produces transparent explainable breakdowns.
    """

    DECAY_HALF_LIFE_HOURS: float = 18.0  # Time for report impact to halve
    DECAY_WINDOW_HOURS: float = 72.0     # Horizon after which reports decay to ~zero

    @classmethod
    def calculate_roadability(
        cls,
        segment: RoadSegment,
        vehicle_type: VehicleProfileType | str,
        current_time: Optional[datetime] = None,
        weather_risk: Optional[float] = None,
    ) -> RoadabilityScoreResponse:
        now = current_time or datetime.now(timezone.utc)
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)

        v_key = vehicle_type.value if hasattr(vehicle_type, "value") else str(vehicle_type)
        v_key = v_key.lower().replace("-", "_")

        breakdown: List[str] = []

        # 1. Base Static Road Score
        static_score = segment.static_base_score
        surface_str = segment.surface_type.value if hasattr(segment.surface_type, "value") else str(segment.surface_type)
        width_str = segment.width_class.value if hasattr(segment.width_class, "value") else str(segment.width_class)
        width_label = width_str.replace("_", " ")

        breakdown.append(
            f"{segment.length_km:.1f}km {width_label} road ({surface_str} surface, static base score: {static_score:.0f}/100)"
        )

        # 2. Recency-Decayed Crowdsourced Report Impact
        reports = segment.reports or []
        recency_penalty, last_note, last_time, report_breakdown = cls._calculate_report_adjustment(
            reports=reports,
            current_time=now,
        )
        breakdown.extend(report_breakdown)

        # 2b. Real-Time Weather / Rainfall Impact (Feature 1)
        weather_penalty = 0.0
        if weather_risk is not None and weather_risk > 0.05:
            weather_penalty = -round(weather_risk * 25.0, 1)  # Up to -25 pts for severe downpours
            w_label = "Severe Downpour / Flood Risk" if weather_risk > 0.6 else "Moderate Rainfall / Wet Surface" if weather_risk > 0.3 else "Light Rain"
            breakdown.append(
                f"Real-time weather signal ({w_label}): [{weather_penalty:+.1f} pts weather-risk adjustment]."
            )

        # Raw combined score before vehicle filtering
        raw_score = max(0.0, min(100.0, static_score + recency_penalty + weather_penalty))

        # 3. Vehicle Profile Compatibility Filtering
        final_score, is_recommended, vehicle_breakdown = cls._evaluate_vehicle_fit(
            segment=segment,
            vehicle_key=v_key,
            raw_score=raw_score,
            recency_penalty=recency_penalty,
        )
        breakdown.extend(vehicle_breakdown)

        # 4. Status and Emoji Determination
        status_enum, status_emoji = cls._determine_status_and_emoji(final_score, is_recommended, segment.current_status)

        return RoadabilityScoreResponse(
            segment_id=segment.id,
            segment_name=segment.name,
            vehicle_type=VehicleProfileType(v_key) if v_key in VehicleProfileType._value2member_map_ else VehicleProfileType.truck,
            score=round(final_score, 1),
            status=status_enum,
            status_emoji=status_emoji,
            recommended=is_recommended,
            breakdown=breakdown,
            static_base_score=round(static_score, 1),
            recency_penalty=round(recency_penalty, 1),
            last_report_note=last_note,
            last_reported_at=last_time,
        )

    @classmethod
    def _calculate_report_adjustment(
        cls,
        reports: List[RoadReport],
        current_time: datetime,
    ) -> Tuple[float, Optional[str], Optional[datetime], List[str]]:
        if not reports:
            return 0.0, None, None, ["No active crowdsourced hazard reports — operating on static road baseline."]

        breakdown: List[str] = []
        # Sort newest first
        sorted_reports = sorted(
            reports,
            key=lambda r: r.reported_at if r.reported_at.tzinfo else r.reported_at.replace(tzinfo=timezone.utc),
            reverse=True,
        )

        latest = sorted_reports[0]
        rep_time = latest.reported_at
        if rep_time.tzinfo is None:
            rep_time = rep_time.replace(tzinfo=timezone.utc)

        age_hours = max(0.0, (current_time - rep_time).total_seconds() / 3600.0)

        # Exponential decay factor: decay factor = exp(-ln(2) * age / half_life)
        decay = math.exp(-0.693 * (age_hours / cls.DECAY_HALF_LIFE_HOURS))
        if age_hours > cls.DECAY_WINDOW_HOURS:
            decay = 0.0

        # Maximum penalty/bonus points for latest report status
        if latest.status == RoadSegmentStatus.blocked:
            max_impact = -75.0
            impact_desc = "BLOCKED"
        elif latest.status == RoadSegmentStatus.difficult:
            max_impact = -40.0
            impact_desc = "DIFFICULT"
        else:  # clear
            max_impact = +8.0
            impact_desc = "CLEAR"

        primary_adjustment = max_impact * decay

        # Human-readable time format
        if age_hours < 1.0:
            mins = max(1, int(age_hours * 60))
            time_text = f"{mins}min ago"
        elif age_hours < 24.0:
            hrs = int(age_hours)
            time_text = f"{hrs}h ago"
        else:
            days = int(age_hours / 24.0)
            time_text = f"{days}d ago"

        note_snip = f' "{latest.note}"' if latest.note else ""
        breakdown.append(
            f"Driver report {time_text} ({impact_desc}):{note_snip} "
            f"[{primary_adjustment:+.1f} pts adjusted for {cls.DECAY_WINDOW_HOURS:.0f}h decay curve]."
        )

        return primary_adjustment, latest.note, rep_time, breakdown

    @classmethod
    def _evaluate_vehicle_fit(
        cls,
        segment: RoadSegment,
        vehicle_key: str,
        raw_score: float,
        recency_penalty: float,
    ) -> Tuple[float, bool, List[str]]:
        v_spec = VEHICLE_CAPABILITIES.get(vehicle_key, VEHICLE_CAPABILITIES["mini_truck"])
        breakdown: List[str] = []
        is_recommended = True
        adjusted_score = raw_score

        # Rule 1: Width Class Compatibility
        if segment.width_class not in v_spec["min_width_class"]:
            is_recommended = False
            adjusted_score = min(adjusted_score, 25.0)
            breakdown.append(
                f"Vehicle '{v_spec['name']}' (width: {v_spec['max_width_m']:.2f}m) exceeds "
                f"road width class '{segment.width_class.value.replace('_', ' ')}' — NOT RECOMMENDED."
            )

        # Rule 2: Surface Type Compatibility
        if segment.surface_type not in v_spec["allowed_surfaces"]:
            is_recommended = False
            adjusted_score = min(adjusted_score, 30.0)
            breakdown.append(
                f"Vehicle '{v_spec['name']}' cannot navigate '{segment.surface_type.value}' surface "
                f"(requires {', '.join([s.value for s in v_spec['allowed_surfaces']])}) — NOT RECOMMENDED."
            )

        # Rule 3: Severe Blocked Condition
        if segment.current_status == RoadSegmentStatus.blocked:
            if vehicle_key != "two_wheeler":
                is_recommended = False
                adjusted_score = min(adjusted_score, 25.0)
                breakdown.append(
                    "Severe road blockage or hazard flagged by active driver reports — NOT RECOMMENDED for commercial fleet."
                )

        # Rule 4: High Traction / Ground Clearance Vehicle Bonus (Tractor & Bolero Pickup 4x4)
        if vehicle_key in ["tractor", "bolero_pickup", "pickup_4x4"]:
            if segment.surface_type in [RoadSurfaceType.dirt, RoadSurfaceType.unpaved, RoadSurfaceType.gravel]:
                if segment.current_status != RoadSegmentStatus.blocked:
                    bonus = 25.0 if vehicle_key == "tractor" else 20.0
                    adjusted_score = min(100.0, adjusted_score + bonus)
                    is_recommended = True
                    if vehicle_key == "tractor":
                        breakdown.append(
                            "Agro Tractor high-traction torque and ultra-high clearance verified for rough/unpaved track."
                        )
                    else:
                        breakdown.append(
                            "Mahindra Bolero Pickup 4x4 high-traction 4WD torque and rugged clearance verified for rough/unpaved track."
                        )

        # Rule 5: Final viability threshold check
        if adjusted_score < v_spec["min_viable_score"]:
            is_recommended = False
            if not any("NOT RECOMMENDED" in b for b in breakdown):
                breakdown.append(
                    f"Overall Roadability score ({adjusted_score:.1f}) is below minimum viable threshold ({v_spec['min_viable_score']:.0f}) for '{v_spec['name']}'."
                )
        elif is_recommended:
            breakdown.append(
                f"Vehicle '{v_spec['name']}' verified viable: dimensions, clearance, and traction compatible."
            )

        return adjusted_score, is_recommended, breakdown

    @classmethod
    def _determine_status_and_emoji(
        cls,
        score: float,
        is_recommended: bool,
        current_status: RoadSegmentStatus,
    ) -> Tuple[RoadSegmentStatus, str]:
        if not is_recommended or score < 40.0 or current_status == RoadSegmentStatus.blocked:
            return RoadSegmentStatus.blocked, "🔴"
        elif score < 70.0 or current_status == RoadSegmentStatus.difficult:
            return RoadSegmentStatus.difficult, "🟡"
        else:
            return RoadSegmentStatus.clear, "🟢"
