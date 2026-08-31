from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.shipments import router as shipments_router
from app.api.network import router as network_router
from app.api.risk import router as risk_router
from app.api.dispatch import router as dispatch_router
from app.api.vehicles import router as vehicles_router
from app.api.road_conditions import router as road_conditions_router
from app.api.temperature_logs import router as temperature_logs_router
from app.api.sync import router as sync_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(shipments_router)
api_router.include_router(network_router)
api_router.include_router(risk_router)
api_router.include_router(dispatch_router)
api_router.include_router(vehicles_router)
api_router.include_router(road_conditions_router)
api_router.include_router(temperature_logs_router)
api_router.include_router(sync_router)


