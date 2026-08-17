from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.shipments import router as shipments_router
from app.api.network import router as network_router
from app.api.risk import router as risk_router
from app.api.consolidation import router as consolidation_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(shipments_router)
api_router.include_router(network_router)
api_router.include_router(risk_router)
api_router.include_router(consolidation_router)
