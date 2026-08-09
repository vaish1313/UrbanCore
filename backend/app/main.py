"""
UrbanCore API Main Entry Point.
"""
from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from backend.app.core.config import settings
from backend.app.core.logger import get_logger
from backend.app.db.health import check_database_health
from backend.app.db.session import dispose_engines

from backend.app.api.v1.auth.router import router as auth_router
from backend.app.api.v1.aois.router import router as aois_router, hotspots_router
from backend.app.api.v1.health.router import router as health_router
from backend.app.api.v1.admin.router import router as admin_router

logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager. Runs on startup and shutdown.
    """
    # Startup actions
    logger.info("UrbanCore API starting...")
    
    # Run database health check
    health = await check_database_health()
    if health.status != "healthy":
        logger.critical(f"Database connection failed: {health.error}")
        raise Exception(f"Database connection failed: {health.error}")
        
    logger.info("Database connected — pool healthy")
    
    yield
    
    # Shutdown actions
    logger.info("UrbanCore API shutting down...")
    await dispose_engines()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

# CORS Middleware
allowed_origins = settings.ALLOWED_ORIGINS
if settings.ENVIRONMENT == "dev":
    allowed_origins = ["http://localhost:3000", "http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip Middleware (compress responses > 1000 bytes)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Register routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(aois_router, prefix="/api/v1/aois", tags=["AOIs"])
app.include_router(hotspots_router, prefix="/api/v1/hotspots", tags=["Hotspots"])
app.include_router(health_router, prefix="/api/v1/health", tags=["Health"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])

@app.get("/")
async def root():
    """Root endpoint for basic verification."""
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
