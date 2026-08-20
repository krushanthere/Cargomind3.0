from datetime import datetime
from uuid import UUID
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.shipment import TempClass
from app.repositories.route_repository import RouteRepository
from app.services.risk.spoilage_model import SpoilageRiskModel
from app.services.risk.delay_model import DelayRiskModel
from app.schemas.risk import RiskResult


class UnifiedRiskPredictor:
    """Unified risk engine combining spoilage decay kinetics and XGBoost delay probability."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.route_repo = RouteRepository(db)
        self.spoilage_model = SpoilageRiskModel()
        self.delay_model = DelayRiskModel()

    async def predict_risk(
        self,
        route_id: Optional[UUID] = None,
        origin_hub_id: Optional[UUID] = None,
        dest_hub_id: Optional[UUID] = None,
        temp_class: TempClass = TempClass.chilled,
        departure_time: Optional[datetime] = None,
        weight_kg: float = 1000.0,
        season: str = "summer",
        temp_logs: Optional[List[Dict[str, Any]]] = None,
        road_condition: Optional[str] = None,
        w_spoilage: float = 0.6,
        w_delay: float = 0.4,
    ) -> RiskResult:
        route = None
        historical_trips_count = 0
        if route_id:
            route = await self.route_repo.get_by_id(route_id)
        elif origin_hub_id and dest_hub_id:
            routes = await self.route_repo.list_routes(origin_hub_id=origin_hub_id, dest_hub_id=dest_hub_id)
            if routes:
                route = routes[0]

        if not route:
            # Default fallback route params if route ID not found
            avg_transit_hrs = 24.0
            mode = "road"
            reliability = 0.85
            route_hash = hash(str(route_id or "default_route"))
            latest_condition = road_condition or "paved"
            historical_trips_count = 0
        else:
            avg_transit_hrs = route.avg_transit_hrs
            mode = route.mode.value if hasattr(route.mode, "value") else str(route.mode)
            reliability = route.reliability_score
            route_hash = hash(str(route.id))
            latest_condition = road_condition or await self.route_repo.get_latest_condition(route.id)
            historical_trips_count = await self.route_repo.count_route_history(route.id)

        # Confidence calculation: < 20 historical trips tags confidence: "low"
        confidence = "low" if historical_trips_count < 20 else "high"

        dep_hour = departure_time.hour if departure_time else 10

        # 1. Predict Delay Risk
        delay_res = self.delay_model.predict_delay_probability(
            mode=mode,
            season=season,
            departure_hour=dep_hour,
            historical_reliability=reliability,
            avg_transit_hrs=avg_transit_hrs,
            route_id_hash=route_hash,
            road_condition=latest_condition,
        )
        delay_component = delay_res["delay_probability"]
        predicted_delay_hrs = delay_res["predicted_delay_hrs"]

        # 2. Predict Spoilage Risk considering effective transit hours = avg_transit + predicted_delay
        total_expected_transit_hrs = avg_transit_hrs + predicted_delay_hrs
        spoilage_res = self.spoilage_model.calculate_spoilage_risk(
            temp_class=temp_class,
            transit_hrs=total_expected_transit_hrs,
            temp_logs=temp_logs,
        )
        spoilage_component = spoilage_res["spoilage_risk_score"]
        remaining_shelf_life_pct = spoilage_res["remaining_shelf_life_pct"]

        # Combined composite risk score (0.0 to 1.0)
        overall_risk_score = round(
            (w_spoilage * spoilage_component) + (w_delay * delay_component), 4
        )

        return RiskResult(
            risk_score=overall_risk_score,
            spoilage_component=round(spoilage_component, 4),
            delay_component=round(delay_component, 4),
            confidence=confidence,
            predicted_delay_hrs=predicted_delay_hrs,
            remaining_shelf_life_pct=remaining_shelf_life_pct,
            details={
                "base_transit_hrs": avg_transit_hrs,
                "expected_total_transit_hrs": total_expected_transit_hrs,
                "acceleration_factor": spoilage_res["acceleration_factor"],
                "historical_reliability": reliability,
                "historical_trips_count": historical_trips_count,
                "road_condition": latest_condition,
                "confidence": confidence,
            },
        )

