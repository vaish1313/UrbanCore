"""
Database Health and Observability Subsystem.

Why this file exists:
Provides production-grade, highly reliable health checks for the PostgreSQL/PostGIS database.
It separates observability concerns from connection management and business logic.

Why it belongs here:
`backend/app/db/` isolates database-specific infrastructure. Placing health checks here ensures
that the API layer (`backend/app/api/`) simply calls an interface without needing to understand
SQLAlchemy engine internals.

Dependencies:
- `sqlalchemy.ext.asyncio`: For asynchronous database connections.
- `sqlalchemy.exc`: For granular error catching (OperationalError, TimeoutError).
- `app.core.logger`: For internal logging of sensitive errors.
- `app.db.session`: To access the lazy-initialized write engine.

Interaction:
FastAPI health routes (`/health/liveness`, `/health/readiness`) will call `check_database_health()`
to determine if Kubernetes should restart the pod or route traffic to it.

Future Extension Points:
- Define a shared `BaseHealthCheck` interface that Redis, Celery, and Google Earth Engine
  health checkers can inherit from.
- Integrate directly with Prometheus instrumentation libraries.
"""

import time
import asyncio
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.exc import OperationalError, TimeoutError as SATimeoutError

from backend.app.core.logger import get_logger
from backend.app.db.session import get_write_engine

logger = get_logger(__name__)

# ==========================================
# Data Structures
# ==========================================
# We use dataclasses here as they are instantly serializable by FastAPI
# and extremely lightweight, avoiding Pydantic overhead for high-frequency probes.

@dataclass
class PoolStatus:
    size: int
    checked_out: int
    overflow: int
    checked_in: int

@dataclass
class DatabaseHealth:
    status: str
    service: str
    latency_ms: Optional[float]
    timestamp: str
    database_version: Optional[str]
    pool: Optional[PoolStatus]
    error: Optional[str]

    def dict(self) -> Dict[str, Any]:
        """Convert to a FastAPI/Pydantic-friendly dictionary."""
        return asdict(self)


# ==========================================
# Helpers
# ==========================================
async def check_database_latency() -> float:
    """
    Measures the exact latency of executing a simple query.
    
    Why it exists:
    Used to detect degrading database performance before it causes full outages.
    
    When to use it:
    In readiness probes or Prometheus metrics collectors.
    """
    engine = get_write_engine()
    start_time = time.perf_counter()
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    latency = (time.perf_counter() - start_time) * 1000
    return round(latency, 2)


async def get_database_metadata() -> str:
    """
    Retrieves the PostgreSQL version string.
    
    Why it exists:
    Useful for audit logs and ensuring migrations match the deployed DB version.
    """
    engine = get_write_engine()
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT version();"))
        version = result.scalar()
        return str(version) if version else "Unknown"


async def check_connection_pool() -> PoolStatus:
    """
    Inspects the current state of the SQLAlchemy connection pool.
    
    Why it exists:
    Identifies connection leaks and pool exhaustion. If `checked_out` hits
    the max size repeatedly, the system needs PgBouncer or a larger pool.
    """
    engine = get_write_engine()
    # Access the underlying synchronous engine's pool metrics
    pool = engine.pool
    return PoolStatus(
        size=pool.size(),
        checked_out=pool.checkedout(),
        overflow=pool.overflow(),
        checked_in=pool.checkedin()
    )


# ==========================================
# Main Health Check Orchestrator
# ==========================================
async def check_database_health() -> DatabaseHealth:
    """
    Orchestrates a comprehensive database health check suitable for Kubernetes probes.

    Why it exists:
    Provides a single entry point for API health routes to query the database state.
    It catches exceptions securely, logging sensitive stack traces internally while
    returning safe, sanitized error strings publicly.

    When to use it:
    In `/api/v1/health` routes mapped to Kubernetes liveness/readiness probes.
    
    Future Extension:
    This pattern can be mirrored for `check_redis_health()`.
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    
    try:
        # We use asyncio.wait_for to prevent a hung database connection 
        # from hanging the entire Kubernetes readiness probe.
        latency = await asyncio.wait_for(check_database_latency(), timeout=2.0)
        version = await asyncio.wait_for(get_database_metadata(), timeout=1.0)
        pool_status = await check_connection_pool()
        
        return DatabaseHealth(
            status="healthy",
            service="postgresql",
            latency_ms=latency,
            timestamp=timestamp,
            database_version=version,
            pool=pool_status,
            error=None
        )
        
    except asyncio.TimeoutError:
        logger.error("Database health check timed out after 2 seconds.")
        return DatabaseHealth(
            status="unhealthy",
            service="postgresql",
            latency_ms=None,
            timestamp=timestamp,
            database_version=None,
            pool=None,
            error="Connection timeout"
        )
    except SATimeoutError as e:
        logger.error("Database connection pool exhausted.", exc_info=e)
        return DatabaseHealth(
            status="unhealthy",
            service="postgresql",
            latency_ms=None,
            timestamp=timestamp,
            database_version=None,
            pool=None,
            error="Pool exhaustion"
        )
    except OperationalError as e:
        # OperationalError covers network failure and bad auth.
        # We log the full error but sanitize the output to avoid leaking IPs/passwords.
        logger.error("Database network or authentication failure.", exc_info=e)
        return DatabaseHealth(
            status="unhealthy",
            service="postgresql",
            latency_ms=None,
            timestamp=timestamp,
            database_version=None,
            pool=None,
            error="Network or authentication failure"
        )
    except Exception as e:
        logger.error("Unexpected error during database health check.", exc_info=e)
        return DatabaseHealth(
            status="unhealthy",
            service="postgresql",
            latency_ms=None,
            timestamp=timestamp,
            database_version=None,
            pool=None,
            error="Unexpected internal error"
        )
