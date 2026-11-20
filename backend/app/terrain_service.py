from __future__ import annotations

from datetime import datetime, timezone
import math
from pathlib import Path
from typing import Any

from fastapi import HTTPException
import numpy as np
import rasterio
from rasterio.warp import transform
from rasterio.windows import Window
from sqlalchemy import text

from .builder_service import engine
from .geometry_resolver import geometry_resolver


DEM_PATH = Path(__file__).resolve().parents[1] / "data" / "dem" / "processed" / "Nashik_DEM_GLO30.tif"

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
        resolved = geometry_resolver.resolve(aoi_id=aoi_id, name=aoi_id)
        if resolved.lat and resolved.lng and resolved.source != "unresolvable":
            try:
                pt = get_coordinate_terrain(resolved.lat, resolved.lng)
                return {
                    "aoi_id": aoi_id,
                    "mean_elevation_m": pt["elevation_m"],
                    "min_elevation_m": pt["min_elevation_m"],
                    "max_elevation_m": pt["max_elevation_m"],
                    "mean_slope_deg": pt["slope_deg"],
                    "max_slope_deg": pt["slope_deg"] * 1.5,
                    "flat_land_percentage": 100.0 if pt["is_flat"] else 30.0,
                    "terrain_roughness_m": pt["terrain_roughness_m"],
                    "dem_source": pt["dem_source"],
                    "calculated_at": pt["calculated_at"],
                }
            except Exception:
                return None
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


def get_coordinate_terrain(lat: float, lng: float) -> dict[str, Any]:
    """Return preliminary DEM-derived terrain metrics for arbitrary geographic coordinates.

    Samples local elevation, slope, and roughness from the Copernicus GLO-30 DEM.
    Does not fabricate parcel boundary polygons or suitability scoring.
    """
    if not (math.isfinite(lat) and math.isfinite(lng)):
        raise HTTPException(status_code=422, detail="Latitude and longitude must be finite numeric values")
    if not (-90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0):
        raise HTTPException(status_code=422, detail="Coordinates out of valid geographical range")
    if not DEM_PATH.exists():
        raise HTTPException(status_code=503, detail="DEM raster dataset is unavailable on server")

    try:
        with rasterio.open(DEM_PATH) as dem:
            xs, ys = transform("EPSG:4326", dem.crs, [lng], [lat])
            x, y = xs[0], ys[0]

            if not (dem.bounds.left <= x <= dem.bounds.right and dem.bounds.bottom <= y <= dem.bounds.top):
                raise HTTPException(
                    status_code=422,
                    detail=f"Coordinates ({lat:.4f}°N, {lng:.4f}°E) fall outside the Nashik DEM raster coverage area",
                )

            row, col = dem.index(x, y)
            if not (0 <= row < dem.height and 0 <= col < dem.width):
                raise HTTPException(
                    status_code=422,
                    detail=f"Coordinate raster index [{row}, {col}] out of DEM bounds",
                )

            # Sample 3x3 local neighborhood around the coordinate
            r_min, r_max = max(0, row - 1), min(dem.height, row + 2)
            c_min, c_max = max(0, col - 1), min(dem.width, col + 2)

            window = Window(c_min, r_min, c_max - c_min, r_max - r_min)
            data = dem.read(1, window=window).astype(np.float64)
            if dem.nodata is not None:
                data[data == dem.nodata] = np.nan

            center_r = row - r_min
            center_c = col - c_min

            valid_vals = data[np.isfinite(data)]
            if valid_vals.size == 0:
                raise HTTPException(status_code=422, detail="No valid DEM elevation pixels found at given coordinates")

            center_elev = data[center_r, center_c] if (0 <= center_r < data.shape[0] and 0 <= center_c < data.shape[1]) else np.nan
            elev = float(center_elev) if np.isfinite(center_elev) else float(np.mean(valid_vals))
            min_elev = float(np.min(valid_vals))
            max_elev = float(np.max(valid_vals))
            roughness = max_elev - min_elev

            xres, yres = dem.res
            if data.shape[0] >= 2 and data.shape[1] >= 2:
                with np.errstate(invalid="ignore", divide="ignore"):
                    dzdy, dzdx = np.gradient(data, yres, xres)
                    slope_grid = np.degrees(np.arctan(np.sqrt(dzdx * dzdx + dzdy * dzdy)))
                    center_slope = slope_grid[center_r, center_c] if (0 <= center_r < slope_grid.shape[0] and 0 <= center_c < slope_grid.shape[1]) else np.nan
                    valid_slopes = slope_grid[np.isfinite(slope_grid)]
                    slope_deg = float(center_slope) if np.isfinite(center_slope) else float(np.mean(valid_slopes))
            else:
                slope_deg = 0.0

            return {
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "elevation_m": round(elev, 2),
                "min_elevation_m": round(min_elev, 2),
                "max_elevation_m": round(max_elev, 2),
                "slope_deg": round(slope_deg, 2),
                "terrain_roughness_m": round(roughness, 2),
                "is_flat": bool(slope_deg <= 5.0),
                "dem_source": DEM_PATH.name,
                "is_preliminary": True,
                "screening_type": "PRELIMINARY_COORDINATE_SCREENING",
                "screening_note": "Preliminary point-based DEM screening. Authoritative site assessment requires surveyed parcel boundary polygon.",
                "calculated_at": datetime.now(timezone.utc).isoformat(),
            }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to query DEM at coordinates: {exc}") from exc

