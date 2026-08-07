"""
Geospatial Utilities

Shared geo-computation helpers used across all UrbanCore services.
These are pure functions — no side effects, no dependencies on frameworks.
"""

from __future__ import annotations

import math
from typing import Any

import pyproj
from pyproj import Transformer
from shapely.geometry import Polygon, mapping, shape
from shapely.ops import transform


# ─── CRS Transformations ─────────────────────────────────────

_WGS84 = pyproj.CRS("EPSG:4326")
_WEB_MERCATOR = pyproj.CRS("EPSG:3857")


def wgs84_to_web_mercator(geometry_geojson: dict[str, Any]) -> dict[str, Any]:
    """Transform a GeoJSON geometry from WGS84 to Web Mercator (EPSG:3857)."""
    transformer = Transformer.from_crs(_WGS84, _WEB_MERCATOR, always_xy=True)
    geom = shape(geometry_geojson)
    projected = transform(transformer.transform, geom)
    return mapping(projected)  # type: ignore[return-value]


def to_utm(geometry_geojson: dict[str, Any], zone: int, northern: bool = True) -> dict[str, Any]:
    """Transform a GeoJSON geometry to a UTM zone for metric calculations."""
    hemisphere = "north" if northern else "south"
    utm_crs = pyproj.CRS(f"+proj=utm +zone={zone} +{hemisphere} +datum=WGS84")
    transformer = Transformer.from_crs(_WGS84, utm_crs, always_xy=True)
    geom = shape(geometry_geojson)
    projected = transform(transformer.transform, geom)
    return mapping(projected)  # type: ignore[return-value]


# ─── AOI Utilities ───────────────────────────────────────────

def aoi_area_sqkm(aoi_geojson: dict[str, Any]) -> float:
    """
    Compute AOI area in square kilometres.

    Uses geodesic computation via pyproj for accuracy on large AOIs.
    """
    geom = shape(aoi_geojson)
    geod = pyproj.Geod(ellps="WGS84")
    area_sqm, _ = geod.geometry_area_perimeter(geom)
    return abs(area_sqm) / 1_000_000


def aoi_centroid(aoi_geojson: dict[str, Any]) -> tuple[float, float]:
    """Return (longitude, latitude) centroid of an AOI polygon."""
    geom = shape(aoi_geojson)
    centroid = geom.centroid
    return (centroid.x, centroid.y)


def utm_zone_from_aoi(aoi_geojson: dict[str, Any]) -> tuple[int, bool]:
    """
    Determine the best UTM zone for an AOI.

    Returns (zone_number, is_northern_hemisphere).
    """
    lon, lat = aoi_centroid(aoi_geojson)
    zone = int((lon + 180) / 6) + 1
    northern = lat >= 0
    return zone, northern


def validate_aoi(aoi_geojson: dict[str, Any], max_area_sqkm: float = 500.0) -> None:
    """
    Validate an AOI polygon.

    Raises ValueError if:
    - The geometry is not a valid polygon
    - The AOI is larger than max_area_sqkm (prevents DoS via enormous jobs)
    """
    from urbancore_shared.exceptions import ValidationError  # avoid circular import

    try:
        geom = shape(aoi_geojson)
        if not geom.is_valid:
            raise ValidationError("AOI polygon geometry is not valid (self-intersections?)")
        if geom.geom_type != "Polygon":
            raise ValidationError(f"AOI must be a Polygon, got {geom.geom_type}")
    except Exception as e:
        if isinstance(e, ValidationError):
            raise
        raise ValidationError(f"AOI geometry parse error: {e}") from e

    area = aoi_area_sqkm(aoi_geojson)
    if area > max_area_sqkm:
        raise ValidationError(
            f"AOI area {area:.1f} km² exceeds maximum allowed {max_area_sqkm} km²."
        )


# ─── Bounding Box ────────────────────────────────────────────

def aoi_to_bbox(aoi_geojson: dict[str, Any]) -> tuple[float, float, float, float]:
    """
    Return (min_lon, min_lat, max_lon, max_lat) bounding box for an AOI.
    Useful for tile requests and imagery downloads.
    """
    geom = shape(aoi_geojson)
    return geom.bounds  # (minx, miny, maxx, maxy)


def bbox_to_wkt(bbox: tuple[float, float, float, float]) -> str:
    """Convert (min_lon, min_lat, max_lon, max_lat) bbox to WKT polygon."""
    minx, miny, maxx, maxy = bbox
    return (
        f"POLYGON(({minx} {miny}, {maxx} {miny}, "
        f"{maxx} {maxy}, {minx} {maxy}, {minx} {miny}))"
    )


# ─── Epoch Helpers ───────────────────────────────────────────

def parse_epoch(epoch_str: str) -> tuple[int, int]:
    """
    Parse an epoch string like '2024-Q1' or '2024-06'.

    Returns (year, quarter_or_month).
    Raises ValueError on invalid format.
    """
    parts = epoch_str.split("-")
    if len(parts) != 2:
        raise ValueError(f"Invalid epoch format: {epoch_str!r}. Expected 'YYYY-QN' or 'YYYY-MM'.")

    year = int(parts[0])
    period = parts[1]

    if period.startswith("Q"):
        quarter = int(period[1:])
        if not (1 <= quarter <= 4):
            raise ValueError(f"Quarter must be 1-4, got {quarter}")
        return year, quarter
    else:
        month = int(period)
        if not (1 <= month <= 12):
            raise ValueError(f"Month must be 1-12, got {month}")
        return year, month


def epoch_to_date_range(epoch_str: str) -> tuple[str, str]:
    """
    Convert an epoch string to an ISO date range (start, end).
    Used for Sentinel-2 imagery queries.

    '2024-Q1' → ('2024-01-01', '2024-03-31')
    '2024-06' → ('2024-06-01', '2024-06-30')
    """
    parts = epoch_str.split("-")
    year = int(parts[0])
    period = parts[1]

    if period.startswith("Q"):
        quarter = int(period[1:])
        month_start = (quarter - 1) * 3 + 1
        month_end = quarter * 3
        # Last day of end month
        import calendar
        last_day = calendar.monthrange(year, month_end)[1]
        return (
            f"{year}-{month_start:02d}-01",
            f"{year}-{month_end:02d}-{last_day:02d}",
        )
    else:
        month = int(period)
        import calendar
        last_day = calendar.monthrange(year, month)[1]
        return (
            f"{year}-{month:02d}-01",
            f"{year}-{month:02d}-{last_day:02d}",
        )
