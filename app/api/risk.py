from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.risk import RiskPredictionRequest, RiskResult
from app.services.risk.predictor import UnifiedRiskPredictor

router = APIRouter(prefix="/risk", tags=["Risk Prediction"])


@router.post("/predict", response_model=RiskResult)
async def predict_risk_endpoint(
    req: RiskPredictionRequest,
    db: AsyncSession = Depends(get_db),
):
    predictor = UnifiedRiskPredictor(db)
    res = await predictor.predict_risk(
        route_id=req.route_id,
        temp_class=req.temp_class,
        departure_time=req.departure_time,
        weight_kg=req.weight_kg,
        season=req.season,
    )
    return res
