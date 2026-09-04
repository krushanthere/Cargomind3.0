import logging
from typing import Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("cargomind.config")


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://shipmerge:shipmerge_password@localhost:5432/shipmerge_db"
    SYNC_DATABASE_URL: str = "postgresql+psycopg2://shipmerge:shipmerge_password@localhost:5432/shipmerge_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET: str = "dev_secret_key_change_in_production_1234567890"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ENVIRONMENT: str = "development"

    # CORS Configuration
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, list[str]]) -> Union[list[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Google Gemini API Assistant Configuration
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-flash-latest"

    # Feature Flags
    FEATURE_WEATHER_RISK_ENABLED: bool = True
    FEATURE_STRESS_DECAY_ENABLED: bool = True
    FEATURE_SENSOR_CAPTURE_ENABLED: bool = True
    FEATURE_ST_GNN_ENABLED: bool = True

    # Weather Service Configuration
    WEATHER_PROVIDER: str = "openmeteo"  # "openmeteo", "openweather", or "mock"
    OPENWEATHER_API_KEY: str | None = None
    OPENMETEO_BASE_URL: str = "https://api.open-meteo.com/v1/forecast"

    # Road Risk Composite Weights (IRI + SRTM + Weather)
    WEIGHT_IRI_RISK: float = 0.45
    WEIGHT_ELEVATION_RISK: float = 0.30
    WEIGHT_WEATHER_RISK: float = 0.25

    # ST-GNN Road Degradation Soft Penalty Weight in CP-SAT
    ST_GNN_LAMBDA_WEIGHT: float = 350.0

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    def check_production_security(self) -> None:
        if self.ENVIRONMENT.lower() == "production":
            if self.JWT_SECRET == "dev_secret_key_change_in_production_1234567890" or len(self.JWT_SECRET) < 32:
                logger.warning(
                    "SECURITY WARNING: Default or short JWT_SECRET configured in production. "
                    "Please set a strong JWT_SECRET (32+ chars) in your production environment."
                )


settings = Settings()

