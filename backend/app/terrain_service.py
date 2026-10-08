from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import text

from .builder_service import engine


TERRAIN_COLUMNS = (
    "mean_elevation_m, min_elevation_m, max_elevation_m, mean_slope_deg, "
    "max_slope_deg, flat_land_percentage, terrain_roughness_m, dem_source, calculated_at"
)


def get_builder_aoi_terrain(aoi_id: str) -> dict | None:
    """Return DEM-derived terrain metrics for one existing Builder AOI."""
    query = text(f"""
        SELECT aoi_id, {TERRAIN_COLUMNS}
        FROM builder_aoi_terrain
        WHERE aoi_id = :aoi_id
    """)
    try:
        with engine.connect() as conn:
            row = conn.execute(query, {"aoi_id": aoi_id}).fetchone()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")

    if not row:
        return None

    return {
        "aoi_id": row.aoi_id,
        "mean_elevation_m": float(row.mean_elevation_m),
        "min_elevation_m": float(row.min_elevation_m),
        "max_elevation_m": float(row.max_elevation_m),
        "mean_slope_deg": float(row.mean_slope_deg),
        "max_slope_deg": float(row.max_slope_deg),
        "flat_land_percentage": float(row.flat_land_percentage),
        "terrain_roughness_m": float(row.terrain_roughness_m),
        "dem_source": row.dem_source,
        "calculated_at": row.calculated_at.isoformat() if isinstance(row.calculated_at, datetime) else str(row.calculated_at),
    }
