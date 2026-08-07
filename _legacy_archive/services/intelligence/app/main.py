"""
Intelligence Service FastAPI Application — RAG, Reports, Semantic Search
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, Request, Security
from fastapi.security.api_key import APIKeyHeader
from fastapi.responses import JSONResponse

from app.core.config import get_config
from app.api.routers import health, reports, search, ingest

config = get_config()
logger = logging.getLogger(__name__)

api_key_header = APIKeyHeader(name="X-Internal-Secret", auto_error=False)


async def verify_internal_secret(api_key: str = Security(api_key_header)) -> str:
    if api_key != config.intelligence_service_internal_secret:
        raise HTTPException(status_code=401, detail="Unauthorized internal request")
    return api_key


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🧠 UrbanCore Intelligence Service starting up...")
    yield
    logger.info("Intelligence Service shutting down...")


def create_app() -> FastAPI:
    app = FastAPI(
        title="UrbanCore Intelligence Service",
        description="RAG over urban policies, role-based report generation, geospatial semantic search",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs" if config.app_env != "production" else None,
    )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(f"Unhandled error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": "ERR_INTERNAL", "message": "Intelligence service error"},
        )

    internal_deps = [Security(verify_internal_secret)]

    app.include_router(health.router, tags=["health"])
    app.include_router(reports.router, prefix="/internal/reports", tags=["reports"], dependencies=internal_deps)
    app.include_router(search.router, prefix="/internal/search", tags=["search"], dependencies=internal_deps)
    app.include_router(ingest.router, prefix="/internal/ingest", tags=["ingest"], dependencies=internal_deps)

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
