"""
AI Service FastAPI Application

Internal API — not publicly exposed. Called only by the Gateway.
Protected by X-Internal-Secret header authentication.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, Request, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from fastapi.responses import JSONResponse

from app.core.config import get_config
from app.api.routers import jobs, health

config = get_config()
logger = logging.getLogger(__name__)

# Internal secret auth
api_key_header = APIKeyHeader(name="X-Internal-Secret", auto_error=False)


async def verify_internal_secret(api_key: str = Security(api_key_header)) -> str:
    """Verify that requests come from the trusted Gateway."""
    if api_key != config.ai_service_internal_secret:
        raise HTTPException(status_code=401, detail="Unauthorized internal request")
    return api_key


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown hooks."""
    logger.info("🤖 UrbanCore AI Service starting up...")
    # Pre-warm model on startup (optional — reduces first-request latency)
    # from app.infrastructure.models.registry import ModelRegistry
    # await ModelRegistry.instance().preload()
    yield
    logger.info("AI Service shutting down...")


def create_app() -> FastAPI:
    app = FastAPI(
        title="UrbanCore AI Service",
        description="Internal service for U-Net inference, SAM refinement, and change detection",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs" if config.app_env != "production" else None,
        redoc_url=None,
    )

    # ─── Exception Handlers ──────────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(f"Unhandled error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": "ERR_INTERNAL", "message": "Internal AI service error"},
        )

    # ─── Routers ─────────────────────────────────────────────
    app.include_router(health.router, tags=["health"])
    app.include_router(
        jobs.router,
        prefix="/internal/jobs",
        tags=["jobs"],
        dependencies=[Security(verify_internal_secret)],
    )

    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=config.service_port,
        reload=config.app_env == "development",
        log_level=config.log_level,
    )
