"""add_area_cache_table

Revision ID: 001_area_cache
Revises:
Create Date: 2026-09-18

Creates the area_cache table with:
  - Composite unique index on (bbox_key, year) for O(1) cache lookups
  - All spectral index, AI result, and zone violation columns
  - CacheStatus enum (PENDING, PROCESSING, COMPLETED, FAILED)
  - request_count for cache popularity tracking
"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from alembic import op

revision: str = "001_area_cache"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the CacheStatus enum type in Postgres
    cache_status_enum = sa.Enum(
        "PENDING", "PROCESSING", "COMPLETED", "FAILED",
        name="cachestatus"
    )
    cache_status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "area_cache",
        # Primary key
        sa.Column("id", UUID(as_uuid=True), primary_key=True),

        # Cache lookup key
        sa.Column("bbox_key", sa.String(100), nullable=False),
        sa.Column("year", sa.Integer, nullable=False),

        # Bounding box coordinates
        sa.Column("min_lat", sa.Float, nullable=False),
        sa.Column("min_lon", sa.Float, nullable=False),
        sa.Column("max_lat", sa.Float, nullable=False),
        sa.Column("max_lon", sa.Float, nullable=False),

        # Optional reverse-geocoded name
        sa.Column("area_name", sa.String(200), nullable=True),

        # Spectral index results
        sa.Column("ndvi_mean", sa.Float, nullable=True),
        sa.Column("ndbi_mean", sa.Float, nullable=True),
        sa.Column("ndwi_mean", sa.Float, nullable=True),
        sa.Column("built_up_pct", sa.Float, nullable=True),
        sa.Column("change_pct_from_prev_year", sa.Float, nullable=True),

        # AI inference results
        sa.Column("construction_detected", sa.Boolean, nullable=True),
        sa.Column("mask_png_path", sa.String(500), nullable=True),
        sa.Column("rgb_png_path", sa.String(500), nullable=True),

        # Zone violation results
        sa.Column("is_river_buffer", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("is_forest_boundary", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("is_crz_zone", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("is_green_belt", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("zone_overlap_pct", sa.Float, nullable=False, server_default="0.0"),

        # Status tracking
        sa.Column(
            "status",
            sa.Enum("PENDING", "PROCESSING", "COMPLETED", "FAILED", name="cachestatus"),
            nullable=False,
            server_default="PENDING"
        ),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("processed_at", sa.DateTime, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime,
            nullable=False,
            server_default=sa.func.now()
        ),

        # Popularity counter
        sa.Column("request_count", sa.Integer, nullable=False, server_default="1"),
    )

    # Composite unique index — the actual cache lookup key
    op.create_index(
        "ix_area_cache_lookup",
        "area_cache",
        ["bbox_key", "year"],
        unique=True,
    )

    # Non-unique index on bbox_key alone for range queries
    op.create_index(
        "ix_area_cache_bbox_key",
        "area_cache",
        ["bbox_key"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_area_cache_bbox_key", table_name="area_cache")
    op.drop_index("ix_area_cache_lookup", table_name="area_cache")
    op.drop_table("area_cache")

    # Drop the enum type
    sa.Enum(name="cachestatus").drop(op.get_bind(), checkfirst=True)
