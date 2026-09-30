from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", 
        extra="ignore",
        protected_namespaces=('settings_',)
    )
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:3000"
    supabase_url: str = ""
    supabase_publishable_key: str = ""
    supabase_project_id: str = ""
    # A service key is optional. Do not expose it to the frontend.
    supabase_service_role_key: str = ""
    # PostgreSQL / PostGIS database URL
    database_url: str = ""
    gee_service_account_email: str = ""
    gee_private_key_path: str = ""
    google_drive_folder_id: str = ""
    google_drive_folder_name: str = "UrbanCore_Data"
    # Google Cloud Storage settings
    gcs_bucket_name: str = "urbancore-satellite-imagery"
    gcs_project_id: str = "final-year-project-501711"
    # Local default; set MODEL_PATH=/outputs/best_unet_urbancore.pth in Docker.
    model_path: str = "../outputs/best_unet_urbancore.pth"
    unet_checkpoint_path: str = "../outputs/urbancore_unet_v1.pth"
    band_stats_path: str = "../outputs/band_stats.json"
    sam_3d_model: str = "facebook/sam-3d-body-dinov3"
    hf_token: str = ""
    enable_sam: bool = True
    device: str = "cpu"
    data_dir: str = "./data/analyses"
    gee_poll_interval_seconds: int = 30
    gee_export_timeout_seconds: int = 1800
    # Model and preprocessing versions for cache invalidation
    model_version: str = "v1"
    preprocessing_version: str = "v1" 
    # GEE version for TIFF cache invalidation
    gee_version: str = "v1"

    @property
    def origins(self) -> list[str]:
        return [value.strip() for value in self.cors_origins.split(",") if value.strip()]

    @property
    def analysis_dir(self) -> Path:
        path = Path(self.data_dir)
        path.mkdir(parents=True, exist_ok=True)
        return path


settings = Settings()
