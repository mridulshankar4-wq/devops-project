from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Alert Fatigue Reducer"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite+aiosqlite:///./alerts.db"

    SECRET_KEY: str = "alert-fatigue-reducer-secret-2024"
    ALGORITHM: str = "HS256"

    PROMETHEUS_PORT: int = 8000
    GRAFANA_PORT: int = 3001

    ALERT_CORRELATION_WINDOW: int = 300  # seconds
    ALERT_SUPPRESSION_DURATION: int = 3600  # seconds
    MAX_ALERTS_PER_GROUP: int = 100

    DEMO_ALERT_INTERVAL: float = 3.0  # seconds between demo alerts
    DEMO_ENABLED: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
