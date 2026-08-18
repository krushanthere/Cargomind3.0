from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://shipmerge:shipmerge_password@localhost:5432/shipmerge_db"
    SYNC_DATABASE_URL: str = "postgresql+psycopg2://shipmerge:shipmerge_password@localhost:5432/shipmerge_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET: str = "dev_secret_key_change_in_production_1234567890"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
