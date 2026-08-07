"""
AI Service — Application Core Configuration

Uses pydantic-settings for environment-based config.
Fails fast with a clear error if required vars are missing.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AIServiceConfig(BaseSettings):
    """
    All configuration for the AI service.
    Values are loaded from environment variables (case-insensitive).
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── Application ─────────────────────────────────────────
    app_env: str = Field(default="development")
    log_level: str = Field(default="info")
    service_port: int = Field(default=8001)

    # ─── Internal Security ───────────────────────────────────
    ai_service_internal_secret: str = Field(min_length=16)

    # ─── Database ────────────────────────────────────────────
    database_url: str = Field(
        description="PostgreSQL connection string with PostGIS",
    )

    # ─── Redis / Celery ──────────────────────────────────────
    redis_url: str
    celery_broker_url: str
    celery_result_backend: str

    # ─── Object Storage ──────────────────────────────────────
    minio_endpoint: str = Field(default="minio:9000")
    minio_access_key: str
    minio_secret_key: str
    minio_bucket_imagery: str = Field(default="urbancore-imagery")
    minio_bucket_results: str = Field(default="urbancore-results")
    minio_use_ssl: bool = Field(default=False)

    # ─── Model Registry ──────────────────────────────────────
    model_weights_dir: Path = Field(default=Path("/app/models"))
    unet_model_path: Path = Field(default=Path("/app/models/unet_resnet34_v1.0.0.pth"))
    unet_model_version: str = Field(default="v1.0.0")
    sam_model_path: Path = Field(default=Path("/app/models/sam_vit_h.pth"))
    sam_model_type: str = Field(default="vit_h")

    # ─── Inference ───────────────────────────────────────────
    inference_device: str = Field(default="cpu")  # 'cpu' | 'cuda' | 'mps'
    unet_confidence_threshold: float = Field(default=0.5, ge=0.0, le=1.0)
    sam_points_per_side: int = Field(default=32)

    @field_validator("inference_device")
    @classmethod
    def validate_device(cls, v: str) -> str:
        valid = {"cpu", "cuda", "mps"}
        if v not in valid:
            raise ValueError(f"inference_device must be one of {valid}")
        return v


@lru_cache(maxsize=1)
def get_config() -> AIServiceConfig:
    """
    Return the singleton config instance.
    @lru_cache ensures this is only constructed once.
    """
    return AIServiceConfig()
