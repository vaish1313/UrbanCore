"""
GIS Service Configuration
"""

from __future__ import annotations

from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class GISServiceConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )

    app_env: str = Field(default="development")
    log_level: str = Field(default="info")
    service_port: int = Field(default=8002)

    gis_service_internal_secret: str = Field(min_length=16)

    database_url: str
    redis_url: str
    celery_broker_url: str
    celery_result_backend: str

    minio_endpoint: str = Field(default="minio:9000")
    minio_access_key: str
    minio_secret_key: str
    minio_bucket_results: str = Field(default="urbancore-results")
    minio_use_ssl: bool = Field(default=False)

    # DEM configuration
    dem_source: str = Field(default="SRTM-30m")
    dem_data_dir: str = Field(default="/app/data/dem")

    # Slope thresholds for suitability scoring
    slope_unsuitable_deg: float = Field(default=30.0)
    slope_marginal_deg: float = Field(default=15.0)
    slope_suitable_deg: float = Field(default=8.0)


@lru_cache(maxsize=1)
def get_config() -> GISServiceConfig:
    return GISServiceConfig()
