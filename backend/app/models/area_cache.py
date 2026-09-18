"""
AreaCache model — stores per-bbox-per-year analysis results.

Serves as a shared cache so that if multiple users request
the same 2km x 2km area + year, the pipeline only runs once.
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean,
    DateTime, Enum as SAEnum, Text, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import func

from app.db.base_class import Base


class CacheStatus(str, enum.Enum):
    """Pipeline execution status for a cached area entry."""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class AreaCache(Base):
    """
    Shared area result cache keyed by (bbox_key, year).

    When two users request the same 2km x 2km area + year:
      - First request: is_new=True  → pipeline runs, writes results here
      - Second request: is_new=False → results returned instantly from DB
    """

    __tablename__ = "area_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ── Cache lookup key ────────────────────────────────────────────────
    # Format: "{min_lat:.4f}_{min_lon:.4f}_{max_lat:.4f}_{max_lon:.4f}"
    # Composite unique: same bbox + same year = same cache entry (one pipeline run)
    bbox_key = Column(String(100), nullable=False, index=True)
    year = Column(Integer, nullable=False)

    __table_args__ = (
        Index("ix_area_cache_lookup", "bbox_key", "year", unique=True),
    )

    # ── Bounding box coordinates ────────────────────────────────────────
    min_lat = Column(Float, nullable=False)
    min_lon = Column(Float, nullable=False)
    max_lat = Column(Float, nullable=False)
    max_lon = Column(Float, nullable=False)

    # Reverse geocoded area name (optional, filled after first run)
    area_name = Column(String(200), nullable=True)

    # ── Spectral index results (from ImageProcessor) ────────────────────
    ndvi_mean = Column(Float, nullable=True)   # Vegetation index
    ndbi_mean = Column(Float, nullable=True)   # Built-up index
    ndwi_mean = Column(Float, nullable=True)   # Water index
    built_up_pct = Column(Float, nullable=True)  # % of area that is built-up
    change_pct_from_prev_year = Column(Float, nullable=True)  # YoY change

    # ── AI inference results (from BuildingDetector) ────────────────────
    construction_detected = Column(Boolean, nullable=True)
    mask_png_path = Column(String(500), nullable=True)  # S3 / local path to mask
    rgb_png_path = Column(String(500), nullable=True)   # S3 / local path to RGB

    # ── Zone violation results (from ViolationChecker) ──────────────────
    is_river_buffer = Column(Boolean, default=False, nullable=False)
    is_forest_boundary = Column(Boolean, default=False, nullable=False)
    is_crz_zone = Column(Boolean, default=False, nullable=False)
    is_green_belt = Column(Boolean, default=False, nullable=False)
    zone_overlap_pct = Column(Float, default=0.0, nullable=False)

    # ── Status tracking ─────────────────────────────────────────────────
    status = Column(SAEnum(CacheStatus), default=CacheStatus.PENDING, nullable=False)
    error_message = Column(Text, nullable=True)
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Popularity counter — incremented on every cache hit
    request_count = Column(Integer, default=1, nullable=False)

    def __repr__(self):
        return (
            f"<AreaCache bbox={self.bbox_key} year={self.year} "
            f"status={self.status} hits={self.request_count}>"
        )
