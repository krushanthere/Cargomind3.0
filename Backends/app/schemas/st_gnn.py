from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class STGNNPredictionRequest(BaseModel):
    corridor_id: str = Field(default="cor-nh27", description="Corridor ID")
    lat: Optional[float] = None
    lon: Optional[float] = None
    iri_score: Optional[float] = Field(default=3.5, description="IRI Road Roughness (m/km)")
    elevation_m: Optional[float] = Field(default=100.0, description="Elevation in meters")
    gradient_pct: Optional[float] = Field(default=2.0, description="Slope gradient %")
    vibration_rms: Optional[float] = Field(default=None, description="Observed sensor vibration RMS")
    historical_incidents: Optional[int] = Field(default=1, description="Past incident count")


class STGNNPredictionResponse(BaseModel):
    corridor_id: str
    degradation_risk: float = Field(..., ge=0.0, le=1.0, description="Predicted road degradation risk")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence score")
    risk_level: str
    is_simulated: bool
    predicted_degradation: str
    governing_drivers: List[str]
    features: Optional[Dict[str, float]] = None
    name: Optional[str] = None
    distance_km: Optional[float] = None
    corridor_type: Optional[str] = None


class STGNNCorridorRisksListResponse(BaseModel):
    corridors: List[STGNNPredictionResponse]
    total_corridors: int
    solver_integration_mode: str = "CP-SAT Soft Cost Penalty"
    lambda_weight: float
