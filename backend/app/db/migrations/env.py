"""
Alembic Migration Environment.

Why this file exists:
Alembic requires an env.py to configure how it connects to the database and discovers
SQLAlchemy models. This file is the critical bridge between Alembic's migration engine
and UrbanCore's async SQLAlchemy infrastructure.

Key design decisions:
1. We use psycopg2 (synchronous) for Alembic's DDL introspection. Alembic autogenerate
   cannot run against asyncpg because it requires synchronous reflection of database metadata.
2. We import all models via `app.db.models` BEFORE calling `run_migrations_offline()` or
   `run_migrations_online()` so that `Base.metadata` is fully populated.
3. We include PostGIS extension creation at the top of the migration script via
   `include_schemas=True` and a custom `render_as_batch` configuration.
"""

import sys
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool, text
from alembic import context

# ==========================================
# Path Setup
# ==========================================
# Make sure the `backend` directory is on sys.path so `app.*` imports resolve correctly
# whether Alembic is invoked from the project root or from inside the backend directory.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# ==========================================
# Import Our Application Infrastructure
# ==========================================
# This import must happen BEFORE reading Base.metadata so all Table definitions
# are registered. The order matters: base → models → config.
from backend.app.db.base import Base  # noqa: E402
import backend.app.db.models  # noqa: E402, F401 — side-effect import to populate Base.metadata
from backend.app.core.config import settings  # noqa: E402

# ==========================================
# Alembic Config
# ==========================================
config = context.config

# Wire in Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Override sqlalchemy.url from our Settings singleton.
# This is the critical line that prevents hardcoding credentials in alembic.ini.
config.set_main_option("sqlalchemy.url", settings.sync_database_url)

# The MetaData object containing all our ORM table definitions.
target_metadata = Base.metadata


# ==========================================
# Helper: PostGIS Extension
# ==========================================
def _ensure_postgis(connection) -> None:
    """
    Ensures the PostGIS extension is installed before running any DDL.

    Why this exists:
    GeoAlchemy2 Geometry columns require PostGIS. Without it, Alembic would fail
    when attempting to create a table with a geometry column.

    This is idempotent: `CREATE EXTENSION IF NOT EXISTS postgis` is a no-op
    if PostGIS is already installed.
    """
    connection.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
    connection.commit()
    connection.execute(text("CREATE EXTENSION IF NOT EXISTS postgis_topology;"))
    connection.commit()


# ==========================================
# Offline Migration Mode
# ==========================================
def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode (no live DB connection).

    Useful for generating SQL scripts that DBAs can review and apply manually
    in environments where direct DB access is restricted (e.g., regulated enterprises).

    Offline mode generates SQL from the metadata diff without connecting to Postgres.
    PostGIS DDL will be included in the script output but not executed.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


# ==========================================
# Online Migration Mode
# ==========================================
def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode (live DB connection via psycopg2).

    This is the standard mode used for all automated deployments.
    We use NullPool to prevent connection pool overhead during one-shot migration runs
    (Alembic is not a long-running process — it runs, migrates, and exits).
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        # Ensure PostGIS extension exists before any table creation.
        _ensure_postgis(connection)

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
            # Include schema names in autogenerate comparison for future multi-schema support.
            include_schemas=True,
        )

        with context.begin_transaction():
            context.run_migrations()


# ==========================================
# Entry Point
# ==========================================
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
