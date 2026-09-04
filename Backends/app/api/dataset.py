"""
CargoMind North Eastern Region (NER) Real Open Dataset API Router
================================================================
Provides endpoints to explore and query real open datasets:
- PMGSY GeoSadak Habitations (66,899 points)
- PMGSY GeoSadak Rural Roads (45,870 lines)
- NASA/USGS SRTM 30m DEM Elevation (38 tiles)
- GatiShakti Northeast Frontier Railway (NFR) stations & tracks
- Open Data Dictionary & Metadata
"""

import os
import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from app.services.network.terrain_service import TerrainService

router = APIRouter(prefix="/dataset", tags=["Real Open Datasets (NER)"])

PROCESSED_DIR = "/Users/krushantapodha/Untitled23/Backends/data/processed"


class ElevationQueryRequest(BaseModel):
    lat: float
    lon: float


class ElevationProfileRequest(BaseModel):
    orig_lat: float
    orig_lon: float
    dest_lat: float
    dest_lon: float
    distance_km: Optional[float] = None


@router.get("/summary", summary="Get comprehensive NER real dataset overview and metrics")
async def get_dataset_summary() -> Dict[str, Any]:
    """Returns high-level statistics across all 8 North Eastern Region states:
    habitations count, road segments count, SRTM DEM elevation coverage,
    and GatiShakti railway network.
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

    return {
        "region": "North Eastern Region (NER), India",
        "states_covered": [
            "Assam",
            "Arunachal Pradesh",
            "Manipur",
            "Meghalaya",
            "Mizoram",
            "Nagaland",
            "Sikkim",
            "Tripura",
        ],
        "total_habitations": hab_summary.get("total_habitations_count", 66899),
        "total_roads_length_km": 45870,
        "total_railway_stations": rail_count,
        "total_railway_tracks": tracks_count,
        "srtm_dem_tiles_count": 38,
        "srtm_resolution": "1 Arc-Second (~30m Spatial Grid)",
        "sources": [
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
    }


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

    if state:
        st_clean = state.lower().replace(" ", "")
        habs = [h for h in habs if h.get("state", "").lower().replace(" ", "") == st_clean]

    if search:
        s_clean = search.lower()
        habs = [h for h in habs if s_clean in h.get("name", "").lower()]

    total = len(habs)
    paginated = habs[offset : offset + limit]

    return {
        "total_matches": total,
        "limit": limit,
        "offset": offset,
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
    if state:
        st_clean = state.lower().replace(" ", "")
        features = [f for f in features if f.get("properties", {}).get("state", "").lower().replace(" ", "") == st_clean]

    return {
        "type": "FeatureCollection",
        "metadata": geojson.get("metadata", {}),
        "features": features[:limit],
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
    if freight_only:
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
