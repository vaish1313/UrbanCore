"""Transparent V1 GIS-based suitability screening for canonical Builder AOIs.

This module intentionally does not alter the legacy suitability columns on
``builder_aois``. It calculates a reproducible screening score from the
DEM-derived terrain table and the existing PostGIS restricted-zone dataset.
The score is not legal, zoning, environmental, or construction approval.
"""

from __future__ import annotations

from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np
import rasterio
from fastapi import HTTPException
from sqlalchemy import text

from .builder_service import engine


# Approved V1 model configuration. Keep these values isolated and explicit so
# future model revisions can be reviewed without changing the data pipeline.
SLOPE_BREAKPOINTS = ((0.0, 100.0), (5.0, 80.0), (15.0, 40.0), (25.0, 0.0))
ROUGHNESS_BREAKPOINTS = ((0.0, 100.0), (25.0, 50.0), (50.0, 0.0))
TERRAIN_WEIGHTS = {
    "slope_score": 0.35,
    "flat_land_score": 0.30,
    "roughness_score": 0.20,
    "elevation_score": 0.15,
}
OVERALL_TERRAIN_WEIGHT = 0.70
OVERALL_CONSTRAINT_WEIGHT = 0.30

DEM_PATH = Path(__file__).resolve().parents[1] / "data" / "dem" / "processed" / "Nashik_DEM_GLO30.tif"


def _clamp(value: float, lower: float = 0.0, upper: float = 100.0) -> float:
    return max(lower, min(upper, float(value)))


def _finite(value: Any, field_name: str) -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field_name} is not numeric") from exc
    if not np.isfinite(numeric):
        raise ValueError(f"{field_name} is not finite")
    return numeric


def piecewise_score(value: float, breakpoints: tuple[tuple[float, float], ...]) -> float:
    """Linearly interpolate an ascending breakpoint score curve."""
    numeric = _finite(value, "normalization input")
    if numeric <= breakpoints[0][0]:
        return _clamp(breakpoints[0][1])
    for (x0, y0), (x1, y1) in zip(breakpoints, breakpoints[1:]):
        if numeric <= x1:
            fraction = (numeric - x0) / (x1 - x0)
            return _clamp(y0 + fraction * (y1 - y0))
    return _clamp(breakpoints[-1][1])


def normalize_slope(mean_slope_deg: float) -> float:
    return piecewise_score(mean_slope_deg, SLOPE_BREAKPOINTS)


def normalize_flat_land(flat_land_percentage: float) -> float:
    return _clamp(_finite(flat_land_percentage, "flat_land_percentage"))


def normalize_roughness(terrain_roughness_m: float) -> float:
    return piecewise_score(terrain_roughness_m, ROUGHNESS_BREAKPOINTS)


def normalize_constraint(restricted_intersection_percentage: float) -> float:
    return _clamp(100.0 - _finite(restricted_intersection_percentage, "restricted_intersection_percentage"))


def normalize_elevation(elevation: float, minimum: float, median: float, maximum: float) -> float:
    """Score distance from the district-relative median elevation.

    The median is the neutral/most favorable reference only for this screening
    normalization. It does not imply that any elevation is legally or
    technically preferred for construction.
    """
    value = _finite(elevation, "mean_elevation_m")
    minimum = _finite(minimum, "minimum elevation")
    median = _finite(median, "median elevation")
    maximum = _finite(maximum, "maximum elevation")
    if not minimum <= median <= maximum:
        raise ValueError("Invalid district elevation statistics")
    if maximum == minimum:
        return 100.0
    if value <= median:
        denominator = median - minimum
        score = 100.0 if denominator == 0 else 100.0 * (value - minimum) / denominator
    else:
        denominator = maximum - median
        score = 100.0 if denominator == 0 else 100.0 * (maximum - value) / denominator
    return _clamp(score)


@lru_cache(maxsize=1)
def get_nashik_elevation_stats() -> dict[str, float]:
    """Read min/median/max from valid pixels in the processed Nashik DEM."""
    if not DEM_PATH.exists():
        raise RuntimeError(f"Processed Nashik DEM not found: {DEM_PATH}")
    with rasterio.open(DEM_PATH) as dataset:
        values = dataset.read(1, masked=True).compressed().astype(np.float64, copy=False)
    values = values[np.isfinite(values)]
    if values.size == 0:
        raise RuntimeError("Processed Nashik DEM contains no valid finite elevation pixels")
    return {
        "min_elevation": float(np.min(values)),
        "median_elevation": float(np.median(values)),
        "max_elevation": float(np.max(values)),
    }


def _load_aoi_inputs(aoi_id: str) -> dict[str, Any] | None:
    query = text("""
        SELECT
            a.id AS aoi_id,
            a.geometry IS NOT NULL AS has_geometry,
            t.mean_elevation_m,
            t.mean_slope_deg,
            t.flat_land_percentage,
            t.terrain_roughness_m
        FROM builder_aois a
        LEFT JOIN builder_aoi_terrain t ON t.aoi_id = a.id
        WHERE a.id = :aoi_id
    """)
    with engine.connect() as conn:
        row = conn.execute(query, {"aoi_id": aoi_id}).mappings().first()
    if not row:
        return None
    if row["mean_elevation_m"] is None:
        raise HTTPException(404, f"Terrain metrics for AOI '{aoi_id}' not found")
    return dict(row)


def _restricted_intersection_percentage(aoi_id: str) -> tuple[float | None, bool, str | None]:
    """Return restricted overlap percentage and explicit availability status."""
    query = text("""
        SELECT
            CASE
                WHEN a.geometry IS NULL OR ST_Area(a.geometry::geography) = 0 THEN NULL
                WHEN COUNT(rz.id) = 0 THEN 0.0
                ELSE 100.0 * ST_Area(
                    ST_Intersection(
                        a.geometry::geography,
                        ST_UnaryUnion(ST_Collect(rz.geometry))::geography
                    )
                ) / ST_Area(a.geometry::geography)
            END AS restricted_percentage
        FROM builder_aois a
        LEFT JOIN restricted_zones rz
          ON ST_Intersects(rz.geometry, a.geometry)
        WHERE a.id = :aoi_id
        GROUP BY a.geometry
    """)
    try:
        with engine.connect() as conn:
            value = conn.execute(query, {"aoi_id": aoi_id}).scalar_one_or_none()
    except Exception as exc:
        return None, False, f"Restricted-zone intersection could not be assessed because restricted-zone data is unavailable: {exc}"

    if value is None:
        return None, False, "Restricted-zone intersection could not be assessed because AOI geometry is unavailable."
    return _clamp(float(value)), True, None


def _reasons(factors: dict[str, float], constraint_available: bool, restricted_percentage: float | None) -> tuple[list[str], list[str]]:
    positive: list[str] = []
    negative: list[str] = []
    if factors["slope_score"] >= 75:
        positive.append("Low average slope")
    elif factors["slope_score"] <= 40:
        negative.append("High average slope")
    if factors["flat_land_score"] >= 75:
        positive.append("High percentage of flat terrain")
    elif factors["flat_land_score"] <= 40:
        negative.append("Low percentage of flat terrain")
    if factors["roughness_score"] >= 75:
        positive.append("Low terrain roughness")
    elif factors["roughness_score"] <= 40:
        negative.append("High terrain roughness")
    if factors["elevation_score"] >= 75:
        positive.append("Elevation is near the district-relative screening reference")
    elif factors["elevation_score"] <= 40:
        negative.append("Elevation is far from the district-relative screening reference")
    if not constraint_available:
        negative.append("Restricted-zone intersection data unavailable; constraint score set to 0")
    elif restricted_percentage == 0:
        positive.append("No restricted-zone intersection detected")
    else:
        negative.append("Restricted-zone intersection detected")
    return positive, negative


def calculate_terrain_score(factors: dict[str, float]) -> float:
    return _clamp(sum(TERRAIN_WEIGHTS[name] * _finite(factors[name], name) for name in TERRAIN_WEIGHTS))


def calculate_overall_score(terrain_score: float, constraint_score: float) -> float:
    return _clamp(
        OVERALL_TERRAIN_WEIGHT * _finite(terrain_score, "terrain_score")
        + OVERALL_CONSTRAINT_WEIGHT * _finite(constraint_score, "constraint_score")
    )


def calculate_builder_aoi_suitability(aoi_id: str) -> dict[str, Any] | None:
    """Calculate deterministic V1 screening suitability for one canonical AOI."""
    inputs = _load_aoi_inputs(aoi_id)
    if inputs is None:
        return None
    stats = get_nashik_elevation_stats()
    mean_slope = _finite(inputs["mean_slope_deg"], "mean_slope_deg")
    flat_land = _finite(inputs["flat_land_percentage"], "flat_land_percentage")
    roughness = _finite(inputs["terrain_roughness_m"], "terrain_roughness_m")
    elevation = _finite(inputs["mean_elevation_m"], "mean_elevation_m")

    factors = {
        "slope_score": normalize_slope(mean_slope),
        "flat_land_score": normalize_flat_land(flat_land),
        "roughness_score": normalize_roughness(roughness),
        "elevation_score": normalize_elevation(
            elevation,
            stats["min_elevation"],
            stats["median_elevation"],
            stats["max_elevation"],
        ),
    }
    terrain_score = calculate_terrain_score(factors)
    restricted_percentage, constraint_available, unavailable_reason = _restricted_intersection_percentage(aoi_id)
    constraint_score = normalize_constraint(restricted_percentage) if constraint_available else None
    factors["constraint_score"] = constraint_score
    overall_score = calculate_overall_score(terrain_score, constraint_score) if constraint_score is not None else None
    positive, negative = _reasons(factors, constraint_available, restricted_percentage)

    return {
        "aoi_id": aoi_id,
        "overall_score": round(overall_score, 2) if overall_score is not None else None,
        "terrain_score": round(terrain_score, 2),
        "constraint_score": round(constraint_score, 2) if constraint_score is not None else None,
        "factors": {key: round(value, 2) if value is not None else None for key, value in factors.items()},
        "inputs": {
            "mean_slope_deg": mean_slope,
            "flat_land_percentage": _clamp(flat_land),
            "terrain_roughness_m": roughness,
            "mean_elevation_m": elevation,
            "restricted_intersection_percentage": restricted_percentage,
        },
        "elevation_reference": stats,
        "constraint_data_available": constraint_available,
        "constraint_status": "ASSESSED" if constraint_available else "UNAVAILABLE",
        "constraint_unavailable_reason": unavailable_reason,
        "positive_factors": positive,
        "negative_factors": negative,
        "calculated_at": datetime.now(timezone.utc).isoformat(),
    }
