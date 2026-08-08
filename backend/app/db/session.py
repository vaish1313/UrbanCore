"""
Database Session Management and Engine Configuration.

Why this file exists:
Manages the lifecycle of SQLAlchemy 2.0 asynchronous engines and database sessions.
It handles connection pooling, lazy initialization of engines, and provides context
managers and FastAPI dependencies for safe database interactions.

Why it belongs here:
`backend/app/db/` isolates database infrastructure setup from business logic (`services/`)
and data access (`repositories/`), strictly enforcing Clean Architecture boundaries.

Dependencies:
- `sqlalchemy.ext.asyncio`: Core SQLAlchemy 2.0 async APIs.
- `app.core.config`: Strongly typed configuration values for pooling and connection strings.
- `app.core.logger`: Unified structured logging.

Interaction:
- FastAPI endpoints inject `get_db` to receive a scoped session.
- Background jobs (Celery) use `session_scope` to execute database transactions safely.
- Repositories receive `AsyncSession` instances and remain agnostic to connection logic.

Future Extension Points:
- Implement read/write splitting logic fully (routing SELECTs to read replicas).
- Add metrics interception (e.g., OpenTelemetry hooks into the engine events).

Trade-offs:
- Lazy initialization adds a microscopic overhead to the first database request, but
  drastically improves application startup time, testability, and Celery worker safety.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.exc import SQLAlchemyError

from backend.app.core.config import settings
from backend.app.core.logger import get_logger

logger = get_logger(__name__)

# Global singleton engines (lazy initialized)
_write_engine: Optional[AsyncEngine] = None
_read_engine: Optional[AsyncEngine] = None
_async_session_factory: Optional[async_sessionmaker[AsyncSession]] = None


def get_write_engine() -> AsyncEngine:
    """
    Lazily initializes and returns the primary SQLAlchemy async engine for writes.

    Why Lazy Initialization?
    Creating the engine during module import forces database connections to instantiate
    immediately when the app starts. This breaks testing (where we want to mock the DB
    before it connects) and causes issues in fork-based Celery workers. Lazy initialization
    ensures the engine is only built when explicitly requested.

    Returns:
        AsyncEngine: The globally cached write engine.
    """
    global _write_engine
    if _write_engine is None:
        logger.info("Initializing Write Database Engine...")
        _write_engine = create_async_engine(
            settings.async_database_url,
            echo=settings.DATABASE_ECHO,
            future=True,
            pool_pre_ping=True,
            pool_size=settings.DATABASE_POOL_SIZE,
            max_overflow=settings.DATABASE_MAX_OVERFLOW,
            pool_timeout=settings.DATABASE_POOL_TIMEOUT,
            pool_recycle=settings.DATABASE_POOL_RECYCLE,
        )
    return _write_engine


def get_read_engine() -> AsyncEngine:
    """
    Lazily initializes and returns the secondary SQLAlchemy async engine for reads.

    Design for Future Scalability:
    Currently, this returns the write engine. As UrbanCore scales, this function will be
    updated to connect to a PostgreSQL read replica (e.g., using a separate URL from config).
    Repositories utilizing `get_read_engine()` will scale horizontally with zero code changes.

    Returns:
        AsyncEngine: The globally cached read engine.
    """
    global _read_engine
    if _read_engine is None:
        # Future: Replace with settings.async_read_database_url when replicas are deployed.
        logger.info("Initializing Read Database Engine (Currently pointing to Primary)...")
        _read_engine = get_write_engine()
    return _read_engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """
    Lazily initializes and returns the async session factory.

    Returns:
        async_sessionmaker: The factory bound to the write engine.
    """
    global _async_session_factory
    if _async_session_factory is None:
        # expire_on_commit=False prevents MissingGreenlet errors in async SQLAlchemy.
        # autoflush=False ensures flushes only happen when explicitly requested.
        _async_session_factory = async_sessionmaker(
            bind=get_write_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
            autocommit=False,
        )
    return _async_session_factory


async def dispose_engines() -> None:
    """
    Gracefully disposes of all engine connection pools.

    Lifecycle:
    This must be called during FastAPI's shutdown lifespan event or Celery worker
    shutdown to prevent connection leaks on the database server.
    """
    global _write_engine, _read_engine
    if _write_engine:
        logger.info("Disposing Write Database Engine...")
        await _write_engine.dispose()
        _write_engine = None
    if _read_engine and _read_engine is not _write_engine:
        logger.info("Disposing Read Database Engine...")
        await _read_engine.dispose()
        _read_engine = None


@asynccontextmanager
async def session_scope() -> AsyncGenerator[AsyncSession, None]:
    """
    Asynchronous context manager for standalone database transactions.

    Why this exists:
    Provides a safe way to execute database operations in background tasks, CLI scripts,
    or Celery workers where FastAPI's dependency injection is unavailable.

    Lifecycle:
    Yields a session. If an exception occurs, the transaction is rolled back.
    The session is always closed. Transaction committing must be handled by the caller.

    Yields:
        AsyncSession: An active SQLAlchemy async session.
    """
    factory = get_session_factory()
    session: AsyncSession = factory()
    try:
        yield session
    except SQLAlchemyError as sql_err:
        logger.error("SQLAlchemy error in session_scope. Rolling back.", exc_info=sql_err)
        await session.rollback()
        raise
    except Exception as exc:
        logger.error("Unhandled exception in session_scope. Rolling back.", exc_info=exc)
        await session.rollback()
        raise
    finally:
        await session.close()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI Dependency for database session injection.

    Lifecycle:
    Identical to `session_scope()`. Creates a session per request, yields it,
    rolls back on failure, and ensures it is securely closed.
    Does NOT call commit(). Transaction ownership belongs entirely to the Service Layer,
    adhering to Clean Architecture principles.

    Yields:
        AsyncSession: An active SQLAlchemy async session.
    """
    async with session_scope() as session:
        yield session
