from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AccessibilityScoreBreakdown(BaseModel):
    road_connectivity: float = Field(..., description="Road connectivity score (0-25)")
    terrain_difficulty: float = Field(..., description="Terrain and slope score (0-20, higher = easier terrain)")
    multimodal_proximity: float = Field(..., description="Rail and inland waterway proximity (0-20)")
    disaster_resilience: float = Field(..., description="Flood and landslide safety score (0-20)")
    hub_proximity: float = Field(..., description="Proximity to primary logistics/health hub (0-15)")
    rainfall_risk: Optional[float] = Field(default=0.0, description="Normalized weather / rainfall risk factor (0-1)")
    weather_summary: Optional[str] = Field(default=None, description="Current weather condition summary")


class AccessibilityIndexItem(BaseModel):
    id: str
    name: str
    state: str
    district: str
    lat: float
    lon: float
    population: int
    elevation_m: float
    terrain_type: str
    road_status: str
    nearest_hub_name: str
    distance_to_hub_km: float
    composite_score: float = Field(..., description="Composite Accessibility Score (0-100)")
    accessibility_tier: str = Field(..., description="Highly Accessible | Moderately Accessible | Constrained | Critical Isolation")
    breakdown: AccessibilityScoreBreakdown
    recommended_mode: str
    disaster_risk_level: str
    rainfall_mm_hr: Optional[float] = Field(default=0.0, description="Rainfall rate mm/h")
    weather_risk: Optional[float] = Field(default=0.0, description="Normalized weather risk")


class AccessibilityIndexResponse(BaseModel):
    total_locations: int
    average_score: float
    state_filter: Optional[str] = None
    district_filter: Optional[str] = None
    items: List[AccessibilityIndexItem]


class AccessibilityCalculationRequest(BaseModel):
    lat: float = Field(..., description="Latitude")
    lon: float = Field(..., description="Longitude")
    state: Optional[str] = Field("Assam", description="State name")
    elevation_m: Optional[float] = Field(50.0, description="Elevation in meters (SRTM)")
    slope_pct: Optional[float] = Field(2.0, description="Terrain slope percentage")
    road_surface: Optional[str] = Field("paved", description="asphalt, paved, unpaved, mud_track")
    road_status: Optional[str] = Field("clear", description="clear, difficult, blocked")
    nearest_hub_dist_km: Optional[float] = Field(15.0, description="Distance to nearest aggregation node")
    season: Optional[str] = Field("monsoon", description="monsoon or dry")
    is_flood_prone: Optional[bool] = Field(False, description="Is in floodplain or flood risk zone")
    rainfall_mm_hr: Optional[float] = Field(None, description="Optional explicit rainfall rate mm/h")
    include_weather: Optional[bool] = Field(True, description="Whether to include weather risk")


class AccessibilitySummaryStats(BaseModel):
    total_villages_analyzed: int
    regional_avg_accessibility: float
    highly_accessible_pct: float
    moderately_accessible_pct: float
    severely_constrained_pct: float
    critical_isolation_pct: float
    state_breakdowns: Dict[str, Any]
    flood_vulnerable_clusters_count: int
