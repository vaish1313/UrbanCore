"""
Configuration System for UrbanCore Backend.

Why it exists:
This file is the single source of truth for all application configuration. It prevents
hardcoding sensitive values (like database passwords) and centralizes environment variable
validation, ensuring the application fails fast on startup if something is misconfigured.

Why its location was chosen:
`backend/app/core/` houses foundational, cross-cutting concerns that apply globally across
the entire application rather than to a specific business domain.

How it interacts with the rest of the project:
Any module needing an environment variable will import the `settings` singleton from this file.
This guarantees all variables are strongly typed (via Pydantic v2) and validated.
"""

from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import RedisDsn


class Settings(BaseSettings):
    """
    Application settings derived from environment variables.
    Pydantic will automatically validate these fields on startup.
    """
    # Environment & Application
    PROJECT_NAME: str = "UrbanCore API"
    VERSION: str = "0.1.0"
    ENVIRONMENT: Literal["dev", "staging", "prod"] = "dev"
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    ALLOWED_ORIGINS: list[str] = ["*"]

    # Database Settings
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_ECHO: bool = False
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE: int = 1800

    # Redis / Celery Broker
    REDIS_URL: RedisDsn

    @property
    def async_database_url(self) -> str:
        """
        Constructs the async database URL for SQLAlchemy's asyncpg engine.
        Constructed dynamically from individual components to allow easier
        overrides in different deployment environments (e.g., Docker Compose vs Kubernetes).
        """
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def sync_database_url(self) -> str:
        """
        Constructs the synchronous database URL for Alembic migrations.

        Alembic's autogenerate runs DDL introspection synchronously, so it cannot use
        asyncpg. We swap the driver to psycopg2 which is the standard synchronous
        PostgreSQL adapter. This URL is ONLY used by Alembic, never by the app server.
        """
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


    # Pydantic v2 configuration specifying how to read the .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  # Ignore any extra variables present in the environment
    )

# Instantiate as a singleton to be imported safely across the application
settings = Settings()
