from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.api.router import api_router

settings.check_production_security()

app = FastAPI(
    title="ShipMerge API",
    description="Multi-tenant logistics consolidation & risk prediction backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)



@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "ShipMerge API",
        "environment": settings.ENVIRONMENT,
    }

