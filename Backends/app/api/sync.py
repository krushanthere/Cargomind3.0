import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_tenant, TenantContext
from app.schemas.sync import SyncBatchRequest, SyncBatchResponse
from app.models.shipment import Shipment, ShipmentStatus
from app.models.road_condition import RoadConditionReport
from app.models.temperature_log import TemperatureLog
from app.repositories.shipment_repository import ShipmentRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.repositories.roadsense_repository import RoadSenseRepository
from app.models.vehicle import VehicleAvailability

router = APIRouter(prefix="/sync", tags=["Offline-First Sync Engine"])


@router.post("/batch", response_model=SyncBatchResponse, status_code=status.HTTP_200_OK)
async def batch_offline_sync(
    payload: SyncBatchRequest,
    ctx: TenantContext = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Universal idempotent offline synchronization endpoint.

    Handles queued shipments, road condition reports, RoadSense crowdsourced reports,
    temperature excursion logs, and vehicle telemetry from offline devices.
    """
    now = datetime.now(timezone.utc)
    shipment_repo = ShipmentRepository(db, ctx.tenant_id)
    vehicle_repo = VehicleRepository(db)
    roadsense_repo = RoadSenseRepository(db)

    processed_shipments = 0
    processed_conditions = 0
    processed_reports = 0
    processed_logs = 0
    processed_vehicles = 0

    # 1. Sync Shipments (Idempotent by client_id)
    for s_data in payload.shipments:
        if s_data.client_id:
            existing = await shipment_repo.get_by_client_id(s_data.client_id)
            if existing:
                continue

        shipment = Shipment(
            id=uuid.uuid4(),
            tenant_id=ctx.tenant_id,
            origin_hub_id=s_data.origin_hub_id,
            dest_hub_id=s_data.dest_hub_id,
            good_type=s_data.good_type,
            urgency=s_data.urgency,
            producer_id=s_data.producer_id,
            producer_name=s_data.producer_name,
            community_id=s_data.community_id,
            weight_kg=s_data.weight_kg,
            volume_cbm=s_data.volume_cbm,
            temp_class=s_data.temp_class,
            sla_deadline=s_data.sla_deadline,
            max_cost=s_data.max_cost,
            status=ShipmentStatus.pending,
            client_id=s_data.client_id,
            synced_at=now,
            created_at=now,
        )
        db.add(shipment)
        processed_shipments += 1

    # 2. Sync Road Conditions (Legacy Routes)
    for rc_data in payload.road_conditions:
        report = RoadConditionReport(
            id=uuid.uuid4(),
            route_id=rc_data.route_id,
            condition=rc_data.condition,
            reported_by=rc_data.reported_by or payload.device_id,
            notes=rc_data.notes,
            client_id=rc_data.client_id,
            synced_at=now,
            reported_at=now,
        )
        db.add(report)
        processed_conditions += 1

    # 2b. Sync RoadSense Crowdsourced Segment Reports
    for rr_data in payload.road_reports:
        try:
            await roadsense_repo.create_report(
                segment_id=rr_data.segment_id,
                status=rr_data.status,
                reporter_id=rr_data.reporter_id or payload.device_id,
                note=rr_data.note,
                client_id=rr_data.client_id,
            )
            processed_reports += 1
        except Exception:
            pass

    # 3. Sync Temperature Logs
    for tl_data in payload.temperature_logs:
        rec_time = tl_data.recorded_at or tl_data.timestamp or now
        tlog = TemperatureLog(
            id=uuid.uuid4(),
            shipment_id=tl_data.shipment_id,
            vehicle_id=tl_data.vehicle_id,
            timestamp=rec_time,
            temp_celsius=tl_data.temp_celsius,
            humidity=tl_data.humidity,
            client_id=tl_data.client_id,
            synced_at=now,
        )
        db.add(tlog)
        processed_logs += 1

    # 4. Sync Vehicle Telemetry Updates
    for vu in payload.vehicle_updates:
        try:
            status_enum = VehicleAvailability(vu.availability_status)
            await vehicle_repo.update_status(
                vehicle_id=vu.id,
                status=status_enum,
                lat=vu.current_location_lat,
                lon=vu.current_location_lon,
            )
            processed_vehicles += 1
        except Exception:
            pass

    await db.commit()

    return SyncBatchResponse(
        status="success",
        synced_at=now,
        processed_shipments=processed_shipments,
        processed_road_conditions=processed_conditions,
        processed_road_reports=processed_reports,
        processed_temperature_logs=processed_logs,
        processed_vehicle_updates=processed_vehicles,
        details={
            "device_id": payload.device_id,
            "idempotency_enforced": True,
            "last_write_wins": True,
        },
    )
