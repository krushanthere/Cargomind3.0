from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from app.schemas.sensor import (
    SensorStreamProcessRequest,
    VibrationSummaryResponse,
    SensorTelemetryIngestRequest,
)
from app.schemas.stress_decay import (
    StressDecayRequest,
    StressDecayResponse,
)
from app.services.sensors.processor import SensorDataProcessor
from app.services.stress_decay.model import StressDecayModel

router = APIRouter(prefix="/sensors", tags=["Sensors: Bumpy Road, Accelerometer & Heat Telemetry"])


@router.post("/process", response_model=VibrationSummaryResponse)
async def process_sensor_stream(
    payload: SensorStreamProcessRequest,
):
    """Processes real-time accelerometer stream:
    - Calculates RMS vibration, Peak acceleration, Vector magnitude, Variance
    - Removes gravity
    - Accurately identifies temperature source (Sensor vs Weather vs Spec)
    - Computes PINN mechanical stress multiplier
    """
    try:
        sample_dicts = [s.model_dump() for s in payload.samples]
        vibe_summary = SensorDataProcessor.process_accelerometer_stream(
            samples=sample_dicts,
            duration_seconds=payload.duration_seconds,
        )

        temp_reading = SensorDataProcessor.format_temperature_reading(
            sensor_temp=payload.sensor_temperature_celsius,
            weather_temp=payload.weather_temperature_celsius,
        )

        # PINN Stress calculation
        dur_hrs = vibe_summary["duration_seconds"] / 3600.0 if vibe_summary["duration_seconds"] > 0 else 1.0
        current_temp = temp_reading["temperature_celsius"] if temp_reading["temperature_celsius"] is not None else 24.0

        pinn_eval = StressDecayModel.calculate_stress_multiplier(
            temperature_celsius=current_temp,
            vibration_rms=vibe_summary["rms_acceleration"],
            peak_acceleration=vibe_summary["peak_acceleration"],
            duration_hrs=dur_hrs,
        )

        return VibrationSummaryResponse(
            sample_count=vibe_summary["sample_count"],
            duration_seconds=vibe_summary["duration_seconds"],
            duration_formatted=vibe_summary["duration_formatted"],
            rms_acceleration=vibe_summary["rms_acceleration"],
            peak_acceleration=vibe_summary["peak_acceleration"],
            mean_magnitude=vibe_summary["mean_magnitude"],
            variance=vibe_summary["variance"],
            bumpiness_level=vibe_summary["bumpiness_level"],
            bumpiness_emoji=vibe_summary["bumpiness_emoji"],
            is_active=vibe_summary["is_active"],
            temperature_reading=temp_reading,
            pinn_stress_assessment=pinn_eval,
            road_segment_id=payload.road_segment_id,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sensor processing error: {str(e)}",
        )


@router.post("/stress-decay", response_model=StressDecayResponse)
async def evaluate_stress_decay(
    payload: StressDecayRequest,
):
    """Direct PINN Stress-Decay Model endpoint:
    Evaluates mechanical damage and multiplicative stress factor applied onto thermal kinetics.
    """
    res = StressDecayModel.calculate_stress_multiplier(
        temperature_celsius=payload.temperature_celsius,
        vibration_rms=payload.vibration_rms,
        peak_acceleration=payload.peak_acceleration,
        duration_hrs=payload.duration_hrs,
        vibration_intensity=payload.vibration_intensity,
    )
    return StressDecayResponse(**res)
