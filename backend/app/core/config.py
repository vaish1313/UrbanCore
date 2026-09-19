"""
Application configuration settings.
"""
from typing import List, Optional
from pydantic import Field, PostgresDsn, RedisDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Application
    APP_NAME: str = "UrbanCore"
    APP_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    
    # Security
    SECRET_KEY: str = Field(..., min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    POSTGRES_SERVER: str
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    DATABASE_URL: Optional[PostgresDsn] = None
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], values) -> str:
        """Assemble database URL from components."""
        if isinstance(v, str):
            return v
        data = values.data
        return PostgresDsn.build(
            scheme="postgresql",
            username=data.get("POSTGRES_USER"),
            password=data.get("POSTGRES_PASSWORD"),
            host=data.get("POSTGRES_SERVER"),
            port=data.get("POSTGRES_PORT"),
            path=f"/{data.get('POSTGRES_DB') or ''}",
        )
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    REDIS_URL: Optional[RedisDsn] = None
    
    @field_validator("REDIS_URL", mode="before")
    @classmethod
    def assemble_redis_connection(cls, v: Optional[str], values) -> str:
        """Assemble Redis URL from components."""
        if isinstance(v, str):
            return v
        data = values.data
        password = data.get("REDIS_PASSWORD")
        auth = f":{password}@" if password else ""
        return f"redis://{auth}{data.get('REDIS_HOST')}:{data.get('REDIS_PORT')}/{data.get('REDIS_DB')}"
    
    # Celery
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None
    
    # AWS S3
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "urbancore-storage"
    S3_ENDPOINT_URL: Optional[str] = None
    
    # Google Earth Engine
    GEE_SERVICE_ACCOUNT_EMAIL: str = ""
    GEE_PRIVATE_KEY_PATH: str = ""
    GOOGLE_DRIVE_FOLDER_NAME: str = "UrbanCore_Data"
    GOOGLE_DRIVE_FOLDER_ID: str = ""
    
    # Sentinel Hub
    SENTINEL_HUB_CLIENT_ID: str = ""
    SENTINEL_HUB_CLIENT_SECRET: str = ""
    
    # Email
    SENDGRID_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@urbancore.com"
    FROM_NAME: str = "UrbanCore"
    
    # SMS
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    
    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = ""
    
    # AI Model
    MODEL_PATH: str = "/app/ml_models"
    SAM_CHECKPOINT_PATH: str = "/app/ml_models/sam_vit_h_4b8939.pth"
    UNET_CHECKPOINT_PATH: str = "/app/ml_models/best_unet_urbancore.pth"
    ENABLE_SAM: bool = True
    DEVICE: str = "cuda"
    BATCH_SIZE: int = 8
    NUM_WORKERS: int = 4
    
    # Training
    TRAIN_DATA_PATH: str = "/data/training"
    VAL_DATA_PATH: str = "/data/validation"
    TEST_DATA_PATH: str = "/data/test"
    TENSORBOARD_LOG_DIR: str = "/logs/tensorboard"
    CHECKPOINT_DIR: str = "/app/ml_models"
    
    # Processing
    TEMP_DIR: str = "/tmp/urbancore"
    MAX_UPLOAD_SIZE: int = 100_000_000
    ALLOWED_EXTENSIONS: str = ".tif,.tiff,.geojson,.shp,.zip"
    
    # Monitoring
    PROMETHEUS_PORT: int = 9090
    FLOWER_PORT: int = 5555
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    CORS_ALLOW_CREDENTIALS: bool = True
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "/logs/urbancore.log"
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | List[str]) -> List[str]:
        """Parse CORS origins."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


# Global settings instance
settings = Settings()
