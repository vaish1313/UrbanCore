"""
Intelligence Service Configuration
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class IntelligenceServiceConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )

    app_env: str = Field(default="development")
    log_level: str = Field(default="info")
    service_port: int = Field(default=8003)

    intelligence_service_internal_secret: str = Field(min_length=16)

    database_url: str
    redis_url: str
    celery_broker_url: str
    celery_result_backend: str

    minio_endpoint: str = Field(default="minio:9000")
    minio_access_key: str
    minio_secret_key: str
    minio_bucket_reports: str = Field(default="urbancore-reports")
    minio_use_ssl: bool = Field(default=False)

    # ─── LLM ─────────────────────────────────────────────────
    llm_provider: Literal["ollama", "openai", "anthropic"] = Field(default="ollama")
    ollama_base_url: str = Field(default="http://ollama:11434")
    ollama_model: str = Field(default="llama3.1:8b")
    openai_api_key: str = Field(default="")
    openai_model: str = Field(default="gpt-4o-mini")
    anthropic_api_key: str = Field(default="")

    # ─── Embeddings ──────────────────────────────────────────
    embedding_provider: Literal["ollama", "openai"] = Field(default="ollama")
    embedding_model: str = Field(default="nomic-embed-text")
    embedding_dimensions: int = Field(default=768)

    # ─── RAG Settings ────────────────────────────────────────
    rag_top_k: int = Field(default=5)                 # Number of chunks to retrieve
    rag_similarity_threshold: float = Field(default=0.7)
    chunk_size: int = Field(default=512)
    chunk_overlap: int = Field(default=64)


@lru_cache(maxsize=1)
def get_config() -> IntelligenceServiceConfig:
    return IntelligenceServiceConfig()
