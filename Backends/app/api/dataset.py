"""
CargoMind North Eastern Region (NER) Real Open Dataset API Router
================================================================
Provides endpoints to explore and query real open datasets:
- Census 2011 Primary Census Abstract (PCA) (3,379 settlements, 8 states)
- PMGSY GeoSadak Habitations (66,899 points)
- PMGSY GeoSadak Rural Roads (45,870 lines)
- NASA/USGS SRTM 30m DEM Elevation (38 tiles)
- GatiShakti Northeast Frontier Railway (NFR) stations & tracks
- Open Data Dictionary & Metadata
"""

import os
import json
import math
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field

from pathlib import Path
from app.services.network.terrain_service import TerrainService

router = APIRouter(prefix="/dataset", tags=["Real Open Datasets (NER)"])

PROCESSED_DIR = str(Path(__file__).resolve().parent.parent.parent / "data" / "processed")


class ElevationQueryRequest(BaseModel):
    lat: float
    lon: float


class ElevationProfileRequest(BaseModel):
    orig_lat: float
    orig_lon: float
    dest_lat: float
    dest_lon: float
    distance_km: Optional[float] = None


class CensusDemandProxyRequest(BaseModel):
    state: Optional[str] = Field(None, description="NER State name")
    district: Optional[str] = Field(None, description="District name")
    settlement_name: Optional[str] = Field(None, description="Settlement name")
    households: Optional[int] = Field(None, description="Override households count")
    total_population: Optional[int] = Field(None, description="Override population count")
    cultivators: Optional[int] = Field(None, description="Override cultivator/farmer count")
    agri_labourers: Optional[int] = Field(None, description="Override agricultural labourers count")
    child_0_6: Optional[int] = Field(None, description="Override child 0-6 population")


@router.get("/summary", summary="Get comprehensive NER real dataset overview and metrics")
async def get_dataset_summary() -> Dict[str, Any]:
    """Returns high-level statistics across all 8 North Eastern Region states:
    Census PCA demographics, habitations count, road segments count,
    SRTM DEM elevation coverage, and GatiShakti railway network.
    """
    summary_path = os.path.join(PROCESSED_DIR, "ner_habitations_summary.json")
    if not os.path.exists(summary_path):
        raise HTTPException(status_code=404, detail="Dataset summary not found. Run dataset pipeline first.")

    with open(summary_path, "r") as f:
        hab_summary = json.load(f)

    # Railway summary
    rail_path = os.path.join(PROCESSED_DIR, "ner_railway_network.json")
    rail_count = 1128
    tracks_count = 293
    if os.path.exists(rail_path):
        with open(rail_path, "r") as f:
            r_data = json.load(f)
            rail_count = r_data.get("total_ner_stations", rail_count)
            tracks_count = r_data.get("total_ner_tracks", tracks_count)

    # Census PCA summary
    census_path = os.path.join(PROCESSED_DIR, "ner_census_pca_summary.json")
    census_data: Dict[str, Any] = {}
    if os.path.exists(census_path):
        with open(census_path, "r") as f:
            census_data = json.load(f)

    return {
        "region": "North Eastern Region (NER), India",
        "states_covered": [
            "Arunachal Pradesh",
            "Assam",
            "Manipur",
            "Meghalaya",
            "Mizoram",
            "Nagaland",
            "Sikkim",
            "Tripura",
        ],
        "census_metrics": {
            "total_settlements": census_data.get("total_records", 3379),
            "total_villages": census_data.get("total_villages", 3197),
            "total_cd_blocks": census_data.get("total_cd_blocks", 162),
            "total_towns": census_data.get("total_towns", 20),
            "total_population": census_data.get("total_population", 2873763),
            "total_households": census_data.get("total_households", 596764),
            "total_cultivators": census_data.get("total_cultivators", 491823),
            "total_agri_labourers": census_data.get("total_agricultural_labourers", 136475),
            "overall_literacy_rate_pct": census_data.get("overall_literacy_rate_pct", 63.9),
            "overall_st_sc_pct": census_data.get("overall_st_sc_pct", 61.4),
            "total_daily_agri_produce_tons": census_data.get("total_daily_agri_produce_tons", 9712.9),
            "total_daily_inbound_freight_tons": census_data.get("total_daily_inbound_freight_tons", 3560.9),
        },
        "total_habitations": hab_summary.get("total_habitations_count", 66899),
        "total_roads_length_km": 45870,
        "total_railway_stations": rail_count,
        "total_railway_tracks": tracks_count,
        "srtm_dem_tiles_count": 38,
        "srtm_resolution": "1 Arc-Second (~30m Spatial Grid)",
        "sources": [
            {
                "name": "Census of India 2011 Primary Census Abstract (PCA)",
                "authority": "Office of the Registrar General & Census Commissioner of India",
                "license": "Government Open Data License (GODL)",
                "url": "https://censusindia.gov.in/",
            },
            {
                "name": "PMGSY GeoSadak Open Data",
                "authority": "Ministry of Rural Development, Govt. of India",
                "license": "Government Open Data License (GODL)",
                "url": "https://geosadak-pmgsy.nic.in/opendata/",
            },
            {
                "name": "NASA/USGS SRTM 30m Digital Elevation Model",
                "authority": "USGS / NASA Earth Science Data Systems",
                "license": "Public Domain (Open Access)",
                "url": "https://earthexplorer.usgs.gov/",
            },
            {
                "name": "GatiShakti Railway Network",
                "authority": "Ministry of Railways / BISAG-N",
                "license": "Open Data via NDAP",
                "url": "https://yashveeeeeeer.github.io/india-geodata/",
            },
        ],
        "state_breakdown": hab_summary.get("state_summaries", {}),
        "census_state_breakdown": census_data.get("state_breakdown", {}),
    }


# =====================================================================
# CENSUS 2011 PRIMARY CENSUS ABSTRACT (PCA) ENDPOINTS
# =====================================================================

@router.get("/census/summary", summary="Get aggregated Census PCA socio-economic and agrarian statistics across 8 NER states")
async def get_census_summary() -> Dict[str, Any]:
    """Returns aggregated demographic, agrarian workforce, literacy, and freight metrics
    derived from the 2011 Primary Census Abstract dataset across all 8 NER states.
    """
    census_path = os.path.join(PROCESSED_DIR, "ner_census_pca_summary.json")
    if not os.path.exists(census_path):
        raise HTTPException(status_code=404, detail="Census dataset summary not found.")

    with open(census_path, "r") as f:
        return json.load(f)


@router.get("/census/settlements", summary="Search and filter Census settlements with socio-demographic indicators")
async def get_census_settlements(
    state: Optional[str] = Query(None, description="Filter by state (e.g. Assam, Meghalaya, Arunachal Pradesh)"),
    district: Optional[str] = Query(None, description="Filter by district (e.g. Kokrajhar, Tawang, Ribhoi)"),
    level: Optional[str] = Query(None, description="Filter by level: VILLAGE, CD BLOCK, TOWN"),
    area_type: Optional[str] = Query(None, description="Filter by area type: Rural, Urban, Total"),
    search: Optional[str] = Query(None, description="Search settlement or CD block name"),
    min_cultivators: Optional[int] = Query(None, ge=0, description="Filter by minimum main cultivator count"),
    sort_by: Optional[str] = Query("total_population", description="Sort by field: total_population, main_cultivators, households, literacy_rate_pct"),
    order: Optional[str] = Query("desc", description="Sort order: asc, desc"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> Dict[str, Any]:
    """Returns standardized Census settlements with 96 demographic & agrarian indicators
    and derived logistics demand proxies.
    """
    settlements_path = os.path.join(PROCESSED_DIR, "ner_census_settlements.json")
    if not os.path.exists(settlements_path):
        raise HTTPException(status_code=404, detail="Census settlements dataset not found.")

    with open(settlements_path, "r") as f:
        records: List[Dict[str, Any]] = json.load(f)

    # Normalize params in case called directly as python function
    state_str = state if isinstance(state, str) else None
    district_str = district if isinstance(district, str) else None
    level_str = level if isinstance(level, str) else None
    area_type_str = area_type if isinstance(area_type, str) else None
    search_str = search if isinstance(search, str) else None
    min_cult = min_cultivators if isinstance(min_cultivators, int) else None
    sort_str = sort_by if isinstance(sort_by, str) else "total_population"
    order_str = order if isinstance(order, str) else "desc"
    lim = limit if isinstance(limit, int) else 50
    off = offset if isinstance(offset, int) else 0

    if state_str:
        st_clean = state_str.lower().replace(" ", "")
        records = [r for r in records if r.get("state", "").lower().replace(" ", "") == st_clean or r.get("state_code", "").lower() == st_clean]

    if district_str:
        dist_clean = district_str.lower().strip()
        records = [r for r in records if dist_clean in r.get("district", "").lower()]

    if level_str:
        lvl_clean = level_str.upper().strip()
        records = [r for r in records if r.get("level", "") == lvl_clean]

    if area_type_str:
        area_clean = area_type_str.capitalize().strip()
        records = [r for r in records if r.get("area_type", "") == area_clean]

    if min_cult is not None:
        records = [r for r in records if r.get("main_cultivators", 0) >= min_cult]

    if search_str:
        s_clean = search_str.lower().strip()
        records = [r for r in records if s_clean in r.get("name", "").lower() or s_clean in r.get("district", "").lower()]

    # Sorting
    reverse = (order_str.lower() != "asc")
    if sort_str in ["total_population", "main_cultivators", "households", "literacy_rate_pct", "main_agri_labourers"]:
        records.sort(key=lambda x: x.get(sort_str, 0), reverse=reverse)

    total_matches = len(records)
    paginated = records[off : off + lim]

    return {
        "total_matches": total_matches,
        "limit": lim,
        "offset": off,
        "data": paginated,
    }


@router.post("/census/demand-proxy", summary="Calculate logistics demand & fleet requirements from census demographics")
async def calculate_census_demand_proxy(req: CensusDemandProxyRequest) -> Dict[str, Any]:
    """Calculates granular freight demand proxies (daily agricultural harvest output,
    inbound FMCG throughput, and temperature-controlled cold-chain medical units)
    for a specific settlement or demographic profile.
    """
    baseline = {}
    if req.settlement_name or req.state or req.district:
        settlements_path = os.path.join(PROCESSED_DIR, "ner_census_settlements.json")
        if os.path.exists(settlements_path):
            with open(settlements_path, "r") as f:
                all_s = json.load(f)
                matches = [
                    s for s in all_s
                    if (not req.settlement_name or req.settlement_name.lower() in s.get("name", "").lower())
                    and (not req.state or req.state.lower().replace(" ", "") in s.get("state", "").lower().replace(" ", ""))
                    and (not req.district or req.district.lower() in s.get("district", "").lower())
                ]
                if matches:
                    baseline = matches[0]

    households = req.households if req.households is not None else baseline.get("households", 250)
    total_pop = req.total_population if req.total_population is not None else baseline.get("total_population", 1200)
    cultivators = req.cultivators if req.cultivators is not None else baseline.get("main_cultivators", 180)
    agri_labourers = req.agri_labourers if req.agri_labourers is not None else baseline.get("main_agri_labourers", 45)
    child_0_6 = req.child_0_6 if req.child_0_6 is not None else baseline.get("child_0_6_population", int(total_pop * 0.12))

    # Algorithmic throughput projections
    daily_agri_produce_kg = round(cultivators * 18.5 + agri_labourers * 4.5, 1)
    daily_inbound_freight_kg = round(households * 3.8 + total_pop * 0.45, 1)
    coldchain_pharma_demand_units = round(child_0_6 * 0.85 + total_pop * 0.04, 1)

    # Optimal vehicle recommendation
    if daily_agri_produce_kg > 4000:
        recommended_vehicle = "heavy_truck"
        vehicle_description = "Ashok Leyland 16T HCV Reefer (Bulk Harvest Arterial Corridor)"
        trips_per_week = max(1, math.ceil((daily_agri_produce_kg * 7) / 16000))
    elif daily_agri_produce_kg > 800:
        recommended_vehicle = "pickup_4x4"
        vehicle_description = "Mahindra Bolero Camper 4x4 (High-Gradient Rural Feeder)"
        trips_per_week = max(2, math.ceil((daily_agri_produce_kg * 7) / 1500))
    else:
        recommended_vehicle = "mini_truck"
        vehicle_description = "Tata Ace Gold Diesel Feeder (Micro Hamlet Consolidation)"
        trips_per_week = max(1, math.ceil((daily_agri_produce_kg * 7) / 1000))

    return {
        "settlement_name": baseline.get("name", req.settlement_name or "Custom Demographic Cluster"),
        "state": baseline.get("state", req.state or "NER"),
        "district": baseline.get("district", req.district or "Regional"),
        "input_metrics": {
            "households": households,
            "total_population": total_pop,
            "cultivators": cultivators,
            "agri_labourers": agri_labourers,
            "child_0_6": child_0_6,
        },
        "freight_projections": {
            "daily_outbound_agri_produce_kg": daily_agri_produce_kg,
            "daily_outbound_agri_produce_tons": round(daily_agri_produce_kg / 1000.0, 2),
            "weekly_outbound_agri_produce_tons": round((daily_agri_produce_kg * 7) / 1000.0, 2),
            "daily_inbound_essential_goods_kg": daily_inbound_freight_kg,
            "daily_inbound_essential_goods_tons": round(daily_inbound_freight_kg / 1000.0, 2),
            "weekly_coldchain_pharma_units": round(coldchain_pharma_demand_units * 7, 1),
        },
        "dispatch_recommendation": {
            "recommended_vehicle": recommended_vehicle,
            "vehicle_name": vehicle_description,
            "estimated_weekly_trips": trips_per_week,
            "consolidation_feasibility_score": round(min(99.0, max(45.0, (cultivators / max(1, total_pop * 0.35)) * 85.0)), 1),
        },
    }


# =====================================================================
# PMGSY HABITATIONS & ROADS ENDPOINTS
# =====================================================================

@router.get("/habitations", summary="List and filter real PMGSY habitations with population & DEM elevation")
async def get_habitations(
    state: Optional[str] = Query(None, description="Filter by state (e.g. Assam, Sikkim, ArunachalPradesh)"),
    search: Optional[str] = Query(None, description="Search habitation name"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> Dict[str, Any]:
    """Returns real PMGSY habitations with coordinates, population, and SRTM DEM elevation."""
    hab_path = os.path.join(PROCESSED_DIR, "ner_habitations_sampled.json")
    if not os.path.exists(hab_path):
        raise HTTPException(status_code=404, detail="Habitations dataset not found.")

    with open(hab_path, "r") as f:
        habs: List[Dict[str, Any]] = json.load(f)

    st_str = state if isinstance(state, str) else None
    search_str = search if isinstance(search, str) else None
    lim = limit if isinstance(limit, int) else 50
    off = offset if isinstance(offset, int) else 0

    if st_str:
        st_clean = st_str.lower().replace(" ", "")
        habs = [h for h in habs if h.get("state", "").lower().replace(" ", "") == st_clean]

    if search_str:
        s_clean = search_str.lower()
        habs = [h for h in habs if s_clean in h.get("name", "").lower()]

    total = len(habs)
    paginated = habs[off : off + lim]

    return {
        "total_matches": total,
        "limit": lim,
        "offset": off,
        "data": paginated,
    }


@router.get("/roads", summary="Get PMGSY road segments GeoJSON with roughness & width characteristics")
async def get_roads(
    state: Optional[str] = Query(None, description="Filter by state"),
    limit: int = Query(100, ge=1, le=300),
) -> Dict[str, Any]:
    """Returns PMGSY road vectors in GeoJSON format with IRI roughness base scores."""
    roads_path = os.path.join(PROCESSED_DIR, "ner_roads.geojson")
    if not os.path.exists(roads_path):
        raise HTTPException(status_code=404, detail="Roads GeoJSON dataset not found.")

    with open(roads_path, "r") as f:
        geojson = json.load(f)

    features = geojson.get("features", [])
    st_str = state if isinstance(state, str) else None
    lim = limit if isinstance(limit, int) else 100

    if st_str:
        st_clean = st_str.lower().replace(" ", "")
        features = [f for f in features if f.get("properties", {}).get("state", "").lower().replace(" ", "") == st_clean]

    return {
        "type": "FeatureCollection",
        "metadata": geojson.get("metadata", {}),
        "features": features[:lim],
    }


@router.get("/railways", summary="Get Northeast Frontier Railway (NFR) stations and sidings")
async def get_railways(
    freight_only: bool = Query(False, description="Filter to active freight terminals and sidings only")
) -> Dict[str, Any]:
    """Returns GatiShakti railway stations and tracks across the North Eastern Region."""
    rail_path = os.path.join(PROCESSED_DIR, "ner_railway_network.json")
    if not os.path.exists(rail_path):
        raise HTTPException(status_code=404, detail="Railway dataset not found.")

    with open(rail_path, "r") as f:
        data = json.load(f)

    stations = data.get("stations", [])
    fo = freight_only if isinstance(freight_only, bool) else False
    if fo:
        stations = [s for s in stations if s.get("is_freight_terminal", False)]

    return {
        "total_stations": len(stations),
        "total_tracks": data.get("total_ner_tracks", 0),
        "stations": stations,
        "sample_tracks": data.get("tracks", []),
    }


@router.post("/elevation/point", summary="Query exact SRTM 30m DEM elevation for any coordinate")
async def get_elevation_point(req: ElevationQueryRequest) -> Dict[str, Any]:
    """Looks up exact SRTM 30m DEM elevation in meters ASL for latitude and longitude."""
    elev = TerrainService.get_elevation_m(req.lat, req.lon)
    terrain = TerrainService.classify_terrain(elev)
    return {
        "lat": req.lat,
        "lon": req.lon,
        "elevation_m": elev,
        "terrain_type": terrain,
        "source": "NASA/USGS SRTM 30m DEM (GL1 1-arc-second)",
    }


@router.post("/elevation/profile", summary="Calculate route incline, gradient % and transit penalty factors")
async def get_elevation_profile(req: ElevationProfileRequest) -> Dict[str, Any]:
    """Computes elevation gain, gradient percentage, hilliness slowdown, and cost multiplier."""
    dist_km = req.distance_km
    if not dist_km:
        dist_km = max(5.0, math.hypot(req.dest_lat - req.orig_lat, req.dest_lon - req.orig_lon) * 111.0)

    metrics = TerrainService.calculate_route_terrain_metrics(
        orig_lat=req.orig_lat,
        orig_lon=req.orig_lon,
        dest_lat=req.dest_lat,
        dest_lon=req.dest_lon,
        distance_km=dist_km,
    )
    return metrics


@router.get("/dictionary", summary="Get complete Open Data Dictionary markdown")
async def get_data_dictionary() -> Dict[str, Any]:
    """Returns the open data dictionary detailing all datasets, licensing, and fields."""
    dict_path = os.path.join(PROCESSED_DIR, "DATA_DICTIONARY.md")
    if not os.path.exists(dict_path):
        raise HTTPException(status_code=404, detail="Data dictionary not found.")

    with open(dict_path, "r") as f:
        content = f.read()

    return {"content": content}
