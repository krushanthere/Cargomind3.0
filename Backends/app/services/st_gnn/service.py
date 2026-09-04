from typing import Dict, List, Any, Optional
from uuid import UUID
from app.services.st_gnn.model import STGNNModel
from app.services.st_gnn.graph import SpatialTemporalRoadGraph
from app.services.weather.service import WeatherService


class STGNNService:
    """Service providing ST-GNN Road Degradation signals to CP-SAT and Dashboards."""

    _model: Optional[STGNNModel] = None

    @classmethod
    def get_model(cls) -> STGNNModel:
        if cls._model is None:
            cls._model = STGNNModel()
        return cls._model

    @classmethod
    async def predict_road_degradation(
        cls,
        corridor_id: str,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        iri_score: float = 3.5,
        elevation_m: float = 100.0,
        gradient_pct: float = 2.0,
        vibration_rms: Optional[float] = None,
        historical_incidents: int = 1,
    ) -> Dict[str, Any]:
        """Fetches live weather if coordinates are provided and runs ST-GNN prediction."""
        model = cls.get_model()
        rain_rate = 0.0
        temp = 24.0
        is_live = False

        if lat is not None and lon is not None:
            try:
                w = await WeatherService.get_weather(lat, lon)
                rain_rate = w.rainfall_mm_hr
                temp = w.temperature_celsius
                is_live = True
            except Exception:
                pass

        return model.predict_corridor_degradation(
            corridor_id=corridor_id,
            iri_score=iri_score,
            elevation_m=elevation_m,
            gradient_pct=gradient_pct,
            rainfall_mm_hr=rain_rate,
            temperature_celsius=temp,
            vibration_rms=vibration_rms,
            historical_incidents=historical_incidents,
            is_live_telemetry=is_live or (vibration_rms is not None),
        )

    @classmethod
    async def get_all_corridors_degradation_risks(cls) -> List[Dict[str, Any]]:
        """Returns degradation predictions for all primary logistics corridors."""
        results = []
        for c in SpatialTemporalRoadGraph.CORRIDORS:
            # Map corridor to sample coordinates in NER
            lat_lon_map = {
                "cor-nh27": (26.18, 91.74),
                "cor-gsroad": (25.57, 91.89),
                "cor-nh10": (27.33, 88.60),
                "cor-nh29": (25.67, 94.10),
                "cor-nh37": (26.75, 94.20),
                "cor-nh13": (27.58, 91.86),
                "cor-nh6": (24.83, 92.77),
                "cor-majuli": (26.95, 94.21),
            }
            coords = lat_lon_map.get(c["id"], (26.0, 92.0))
            pred = await cls.predict_road_degradation(
                corridor_id=c["id"],
                lat=coords[0],
                lon=coords[1],
                iri_score=c["base_iri"],
                elevation_m=c["elev_m"],
                gradient_pct=c["grad_pct"],
            )
            pred["name"] = c["name"]
            pred["distance_km"] = c["dist_km"]
            pred["corridor_type"] = c["type"]
            results.append(pred)
        return results
