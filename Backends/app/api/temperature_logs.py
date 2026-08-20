import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.temperature_log import TemperatureLog
from app.schemas.temperature_log import (
    TemperatureLogBatchCreate,
    TemperatureLogBatchItem,
    TemperatureLogRead,
)

router = APIRouter(prefix="/temperature-logs", tags=["Temperature Telemetry"])


@router.post("/batch", status_code=status.HTTP_201_CREATED)
async def batch_upload_temperature_logs(
    payload: TemperatureLogBatchCreate,
    db: AsyncSession = Depends(get_db),
):
    """Bulk-upload endpoint for IoT devices logging locally in low-connectivity areas.

    Sets synced_at to the upload timestamp while preserving local recorded_at / timestamp.
    """
    now = datetime.now(timezone.utc)
    created_logs = []

    for item in payload.logs:
        rec_time = item.recorded_at or item.timestamp or now
        tlog = TemperatureLog(
            id=uuid.uuid4(),
            shipment_id=item.shipment_id,
            vehicle_id=item.vehicle_id,
            timestamp=rec_time,
            temp_celsius=item.temp_celsius,
            humidity=item.humidity,
            client_id=item.client_id,
            synced_at=now,
        )
        db.add(tlog)
        created_logs.append(tlog)

    await db.commit()
    return {
        "status": "success",
        "synced_at": now.isoformat(),
        "synced_count": len(created_logs),
    }
