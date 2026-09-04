from typing import List, Optional
from fastapi import APIRouter, Query, status
from app.schemas.accessibility import (
    AccessibilityIndexItem,
    AccessibilityIndexResponse,
    AccessibilityCalculationRequest,
    AccessibilitySummaryStats,
)
from app.services.accessibility.scorer import AccessibilityScorer

router = APIRouter(prefix="/accessibility", tags=["Accessibility Intelligence & Dynamic Index"])


@router.get("/index", response_model=AccessibilityIndexResponse)
async def get_accessibility_index(
    state: Optional[str] = Query(None, description="Filter by NER State (e.g., Assam, Meghalaya)"),
    district: Optional[str] = Query(None, description="Filter by District ID or Name"),
    search: Optional[str] = Query(None, description="Search village / cluster name"),
    min_score: Optional[float] = Query(None, description="Minimum accessibility score (0-100)"),
    max_score: Optional[float] = Query(None, description="Maximum accessibility score (0-100)"),
    limit: int = Query(50, ge=1, le=200, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
):
    """Retrieve dynamic Accessibility Scores for PMGSY habitations across the North Eastern Region.
    Composite score factors in:
    1. PMGSY Road Connectivity & Surface Quality (25%)
    2. SRTM 30m DEM Terrain Slope & Elevation (20%)
    3. Multi-modal Rail & Inland Waterway Proximity (20%)
    4. Disaster, Landslide & Flood Resilience (20%)
    5. Proximity to Primary Agro-Health Logistics Hubs (15%)
    """
    items = AccessibilityScorer.get_habitations_index(
        state=state,
        district=district,
        search=search,
        min_score=min_score,
        max_score=max_score,
        limit=limit,
        offset=offset,
    )

    avg_score = round(sum(i.composite_score for i in items) / len(items), 1) if items else 0.0

    return AccessibilityIndexResponse(
        total_locations=len(items),
        average_score=avg_score,
        state_filter=state,
        district_filter=district,
        items=items,
    )


@router.post("/calculate", response_model=AccessibilityIndexItem, status_code=status.HTTP_200_OK)
async def calculate_dynamic_accessibility(
    payload: AccessibilityCalculationRequest,
):
    """On-the-fly Accessibility Score calculation for arbitrary coordinates or simulated
    disruption events (e.g., monsoon washout, bridge closure, vehicle type restriction).
    """
    return AccessibilityScorer.calculate_custom_score(payload)


@router.get("/summary", response_model=AccessibilitySummaryStats)
async def get_accessibility_summary():
    """Retrieve macro-level accessibility summary across NER states and focus districts."""
    return AccessibilityScorer.get_summary_statistics()
