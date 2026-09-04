from uuid import UUID
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.shipment import ShipmentCreate
from app.schemas.road_condition import RoadConditionCreate
from app.schemas.roadsense import RoadReportCreate
from app.schemas.temperature_log import TemperatureLogBatchItem
from app.schemas.vehicle import VehicleUpdateStatus
from app.schemas.sensor import SensorTelemetryIngestRequest


class VehicleSyncItem(BaseModel):
    id: UUID
    availability_status: str
    current_location_lat: Optional[float] = None
    current_location_lon: Optional[float] = None
    client_id: Optional[UUID] = None


class SyncBatchRequest(BaseModel):
    client_id: Optional[UUID] = None
    device_id: Optional[str] = "offline-agent-01"
    sync_timestamp: Optional[datetime] = None
    shipments: List[ShipmentCreate] = []
    road_conditions: List[RoadConditionCreate] = []
    road_reports: List[RoadReportCreate] = []
    temperature_logs: List[TemperatureLogBatchItem] = []
    vehicle_updates: List[VehicleSyncItem] = []
    sensor_telemetry: List[SensorTelemetryIngestRequest] = []


class SyncBatchResponse(BaseModel):
    status: str = "success"
    synced_at: datetime
    processed_shipments: int
    processed_road_conditions: int
    processed_road_reports: int = 0
    processed_temperature_logs: int
    processed_vehicle_updates: int
    processed_sensor_telemetry: int = 0
    details: Dict[str, Any] = {}
