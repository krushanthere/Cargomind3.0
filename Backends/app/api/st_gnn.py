from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional
from app.core.config import settings
from app.schemas.st_gnn import (
    STGNNPredictionRequest,
    STGNNPredictionResponse,
    STGNNCorridorRisksListResponse,
)
from app.services.st_gnn.service import STGNNService

router = APIRouter(prefix="/st-gnn", tags=["ST-GNN: Auxiliary Spatio-Temporal Road Degradation Intelligence"])


@router.post("/predict", response_model=STGNNPredictionResponse)
async def predict_road_degradation_endpoint(
    payload: STGNNPredictionRequest,
):
    """Auxiliary ST-GNN Road Degradation Forecast:
    Predicts spatial and temporal degradation risk across road corridors.
    Feeds as a soft cost penalty into Google OR-Tools CP-SAT solver of record.
    """
    try:
        res = await STGNNService.predict_road_degradation(
            corridor_id=payload.corridor_id,
            lat=payload.lat,
            lon=payload.lon,
            iri_score=payload.iri_score or 3.5,
            elevation_m=payload.elevation_m or 100.0,
            gradient_pct=payload.gradient_pct or 2.0,
            vibration_rms=payload.vibration_rms,
            historical_incidents=payload.historical_incidents or 1,
        )
        return STGNNPredictionResponse(**res)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ST-GNN prediction error: {str(e)}",
        )


@router.get("/corridor-risks", response_model=STGNNCorridorRisksListResponse)
async def list_corridor_degradation_risks():
    """Retrieve ST-GNN road degradation risks across all mapped logistics corridors."""
    try:
        corridors_data = await STGNNService.get_all_corridors_degradation_risks()
        items = [STGNNPredictionResponse(**c) for c in corridors_data]
        return STGNNCorridorRisksListResponse(
            corridors=items,
            total_corridors=len(items),
            solver_integration_mode="CP-SAT Soft Cost Penalty",
            lambda_weight=settings.ST_GNN_LAMBDA_WEIGHT,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch corridor degradation risks: {str(e)}",
        )
