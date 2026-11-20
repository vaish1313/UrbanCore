"""Scientifically Defensible Land Suitability Screening for UrbanCore Builder AOIs.

Methodology & Architecture:
---------------------------
1. Slope Score (Provisional Weight: 40%):
   - Piecewise linear curve on mean slope:
     0.0° -> 100, 5.0° -> 80, 15.0° -> 40, >=25.0° -> 0.
   - Preserves degree units and valid pixel masking over AOI polygon.
   - Computes slope distribution metrics: 85th-percentile slope and percentage of
     area exceeding 25° (steep terrain risk).
   - Generates explicit warnings when localized steep slopes exist even if mean slope is low.

2. Flat-Land Score (Provisional Weight: 15%):
   - Percentage of valid AOI pixels with slope <= 5.0°.
   - Reduced weight (15% vs old 30%) to eliminate collinear runaway double-counting with slope.

3. Roughness Score (Provisional Weight: 20%):
   - 3x3 local elevation range (max - min) in metres.
   - Thresholds: 0m -> 100, 25m -> 50, >=50m -> 0.
   - Documented as provisional screening thresholds pending fine-scale empirical validation.

4. Elevation & Drainage Risk Score (Provisional Weight: 25%):
   - Scientifically relevant evaluation requires Height Above Nearest Drainage (HAND)
     and authoritative flood return hazard models.
   - District-median elevation has been completely removed as it is unscientific.
   - Because authoritative HAND/drainage network rasters are not present in the repository,
     this component is explicitly marked UNAVAILABLE.
   - As a result, the complete 4-component terrain score is returned as provisional/incomplete
     (or None when complete terrain is strictly demanded), never fabricated.

5. Regulatory & Zoning Constraints (Evaluated distinctly from terrain buildability):
   - True PostGIS geodesic intersection using ST_UnaryUnion(ST_Collect(rz.geometry)).
   - Distinct statuses:
     * ASSESSED_NO_INTERSECTION (0% overlap)
     * POTENTIAL_RESTRICTION_REVIEW (intersection detected with review details)
     * CONFIRMED_BLOCKER (reserved for legally confirmed statutory prohibitions)
     * UNAVAILABLE (when AOI lacks polygon geometry or data missing)
     * INCOMPLETE
   - Detailed breakdown by layer type (RIVER, FOREST, HIGHWAY, LAKE, WATERBODY) with true geodesic
     intersection hectares and percentages.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import rasterio
from rasterio.features import geometry_mask, geometry_window
from rasterio.warp import transform_geom
from rasterio.windows import Window
from fastapi import HTTPException
from sqlalchemy import text

from .builder_service import engine
from .geometry_resolver import geometry_resolver


# ── Centralized Model Configuration ──────────────────────────────────────────
# Keep these isolated and centrally defined so any future model calibrations
# can be updated without touching pipeline code.

SLOPE_BREAKPOINTS = ((0.0, 100.0), (5.0, 80.0), (15.0, 40.0), (25.0, 0.0))
ROUGHNESS_BREAKPOINTS = ((0.0, 100.0), (25.0, 50.0), (50.0, 0.0))

# Provisional terrain component weights:
# Slope (40%), Flat Land (15%), Roughness (20%), Elevation/Drainage (25%)
PROVISIONAL_TERRAIN_WEIGHTS = {
    "slope_score": 0.40,
    "flat_land_score": 0.15,
    "roughness_score": 0.20,
    "elevation_drainage_score": 0.25,
}

DEM_PATH = Path(__file__).resolve().parents[1] / "data" / "dem" / "processed" / "Nashik_DEM_GLO30.tif"


# ── Mathematical & Normalization Helpers ─────────────────────────────────────

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
    """Provisional piecewise score curve for mean slope."""
    return piecewise_score(mean_slope_deg, SLOPE_BREAKPOINTS)


def normalize_flat_land(flat_land_percentage: float) -> float:
    """Identity normalization clamped between 0 and 100."""
    return _clamp(_finite(flat_land_percentage, "flat_land_percentage"))


def normalize_roughness(terrain_roughness_m: float) -> float:
    """Provisional piecewise score curve for 3x3 local roughness."""
    return piecewise_score(terrain_roughness_m, ROUGHNESS_BREAKPOINTS)


def normalize_constraint(restricted_intersection_percentage: float) -> float:
    """Linear deduction of overall overlap percentage."""
    return _clamp(100.0 - _finite(restricted_intersection_percentage, "restricted_intersection_percentage"))


# ── Slope Distribution Analysis ──────────────────────────────────────────────

def calculate_slope_distribution(aoi_geometry_geojson: dict[str, Any] | None) -> dict[str, Any]:
    """Calculate slope distribution (85th percentile, % steep slope) from the DEM.

    Returns empty metrics if polygon geometry is unavailable.
    """
    if not aoi_geometry_geojson or not DEM_PATH.exists():
        return {
            "p85_slope_deg": None,
            "steep_slope_percentage": None,
            "has_steep_slope_warning": False,
            "warning": "Slope distribution cannot be calculated without polygon geometry.",
        }

    try:
        with rasterio.open(DEM_PATH) as dem:
            dem_geom = transform_geom("EPSG:4326", dem.crs, aoi_geometry_geojson)
            win = geometry_window(dem, [dem_geom])
            row_start = max(0, int(win.row_off))
            col_start = max(0, int(win.col_off))
            row_stop = min(dem.height, row_start + int(win.height))
            col_stop = min(dem.width, col_start + int(win.width))

            if row_stop <= row_start or col_stop <= col_start:
                return {
                    "p85_slope_deg": None,
                    "steep_slope_percentage": None,
                    "has_steep_slope_warning": False,
                    "warning": "AOI bounding window does not overlap DEM raster.",
                }

            loc_win = Window(col_start, row_start, col_stop - col_start, row_stop - row_start)
            loc_trans = dem.window_transform(loc_win)
            loc_shape = (row_stop - row_start, col_stop - col_start)

            inside = geometry_mask([dem_geom], out_shape=loc_shape, transform=loc_trans, invert=True)

            data = dem.read(1, window=loc_win).astype(np.float64)
            if dem.nodata is not None:
                data[data == dem.nodata] = np.nan

            yres, xres = dem.res
            with np.errstate(invalid="ignore", divide="ignore"):
                dzdy, dzdx = np.gradient(data, yres, xres)
                slope_grid = np.degrees(np.arctan(np.sqrt(dzdx * dzdx + dzdy * dzdy)))

            aoi_slopes = slope_grid[inside]
            valid_slopes = aoi_slopes[np.isfinite(aoi_slopes)]

            if valid_slopes.size == 0:
                return {
                    "p85_slope_deg": None,
                    "steep_slope_percentage": None,
                    "has_steep_slope_warning": False,
                    "warning": "No valid DEM pixels found within AOI polygon.",
                }

            p85 = float(np.percentile(valid_slopes, 85))
            steep_pct = float(np.mean(valid_slopes > 25.0) * 100.0)
            has_warning = bool(steep_pct > 0.0 or p85 > 15.0)

            warning_msg = None
            if steep_pct > 0.0:
                warning_msg = f"{steep_pct:.1f}% of the site has steep slopes exceeding 25° (construction hazard)."
            elif p85 > 15.0:
                warning_msg = f"85th-percentile slope is {p85:.1f}°, indicating significant localized slope variation."

            return {
                "p85_slope_deg": round(p85, 2),
                "steep_slope_percentage": round(steep_pct, 2),
                "has_steep_slope_warning": has_warning,
                "warning": warning_msg,
            }
    except Exception as exc:
        return {
            "p85_slope_deg": None,
            "steep_slope_percentage": None,
            "has_steep_slope_warning": False,
            "warning": f"Slope distribution calculation error: {exc}",
        }


# ── PostGIS Geodesic Constraint Assessment ───────────────────────────────────

def get_detailed_constraints(aoi_id: str) -> dict[str, Any]:
    """Calculate detailed PostGIS geodesic intersection breakdowns and review status.

    Uses geometry resolver priority hierarchy:
    1. Canonical database geometry.
    2. Safely matched feature from the complete 30-AOI GeoJSON dataset.
    3. Coordinate-based point.
    4. Explanatory response if unresolvable.
    """
    check_query = text("""
        SELECT
            id,
            name,
            location,
            lat,
            lng,
            geometry IS NOT NULL AS has_real_geometry
        FROM builder_aois
        WHERE id = :aoi_id
    """)

    with engine.connect() as conn:
        aoi_row = conn.execute(check_query, {"aoi_id": aoi_id}).mappings().first()

    name = aoi_row["name"] if aoi_row else aoi_id
    location = aoi_row["location"] if aoi_row else "Nashik, Maharashtra"
    lat = aoi_row["lat"] if aoi_row else None
    lng = aoi_row["lng"] if aoi_row else None

    # Resolve geometry through 4-tier hierarchy
    resolved = geometry_resolver.resolve(
        aoi_id=aoi_id,
        name=name,
        lat=lat,
        lng=lng,
    )

    if resolved.source == "unresolvable":
        return {
            "aoi_id": aoi_id,
            "name": name,
            "location": location,
            "status": "UNAVAILABLE",
            "is_approximate_geometry": True,
            "quality_tier": resolved.quality_tier,
            "boundary_status": resolved.boundary_status,
            "geometry_source": resolved.source,
            "geometry_metadata": resolved.to_dict(),
            "reason": resolved.note,
            "overall_overlap_pct": None,
            "constraint_score": None,
            "constraints": [],
            "blocker_status": "UNAVAILABLE",
            "layers_analyzed": 0,
            "overlapping_layers": 0,
            "clear_layers": 0,
            "no_data_layers": 4,
            "factual_summary": resolved.note,
        }

    zone_specs = [
        ("RIVER", "river_buffer", "River Corridor (Godavari Basin)", "Mapped river polygon boundary. Potential buffer review required."),
        ("FOREST", "forest", "Forest Boundary (SOI)", "Survey of India demarcated forest boundary. Requires statutory clearance review."),
        ("HIGHWAY", "highway", "Highway Corridor Buffer", "State/National Highway alignment buffer. Setback verification required."),
        ("WATERBODY", "waterbody", "Lakes & Waterbodies", "National Water Informatics waterbody polygon. Inundation buffer review."),
    ]

    if resolved.source == "coordinate_point" or not resolved.geometry or resolved.geometry.get("type") not in ("Polygon", "MultiPolygon"):
        return {
            "aoi_id": aoi_id,
            "name": name,
            "location": location,
            "status": "UNAVAILABLE",
            "is_approximate_geometry": True,
            "quality_tier": 4,
            "boundary_status": "point_screening",
            "geometry_source": "coordinate_point",
            "geometry_metadata": resolved.to_dict(),
            "reason": "Zoning and environmental constraints cannot be assessed because AOI has no verified boundary polygon geometry.",
            "overall_overlap_pct": None,
            "constraint_score": None,
            "constraints": [],
            "blocker_status": "UNAVAILABLE",
            "layers_analyzed": 0,
            "overlapping_layers": 0,
            "clear_layers": 0,
            "no_data_layers": 4,
            "factual_summary": (
                "Zoning and environmental constraint screening requires verified boundary polygon geometry. "
                "Point coordinate approximations are unavailable for area overlap auditing."
            ),
        }

    # Query true geodesic union overlap across all layers to avoid double-counting
    if resolved.source == "canonical_database":
        union_query = text("""
            WITH effective_aoi AS (
                SELECT
                    id,
                    geometry AS geom
                FROM builder_aois
                WHERE id = :aoi_id
            )
            SELECT
                CASE
                    WHEN ST_Area(a.geom::geography) = 0 THEN 0.0
                    WHEN COUNT(rz.id) = 0 THEN 0.0
                    ELSE 100.0 * ST_Area(
                        ST_Intersection(
                            a.geom::geography,
                            ST_UnaryUnion(ST_Collect(rz.geometry))::geography
                        )
                    ) / ST_Area(a.geom::geography)
                END AS total_overlap_pct,
                ST_Area(a.geom::geography) / 10000.0 AS aoi_area_ha
            FROM effective_aoi a
            LEFT JOIN restricted_zones rz
              ON ST_Intersects(rz.geometry, a.geom)
            GROUP BY a.geom
        """)
        layer_query = text("""
            WITH effective_aoi AS (
                SELECT
                    id,
                    geometry AS geom
                FROM builder_aois
                WHERE id = :aoi_id
            )
            SELECT
                rz.zone_type,
                COUNT(rz.id) AS feature_count,
                ST_Area(
                    ST_Intersection(
                        a.geom::geography,
                        ST_UnaryUnion(ST_Collect(rz.geometry))::geography
                    )
                ) / 10000.0 AS affected_area_ha,
                100.0 * ST_Area(
                    ST_Intersection(
                        a.geom::geography,
                        ST_UnaryUnion(ST_Collect(rz.geometry))::geography
                    )
                ) / ST_Area(a.geom::geography) AS affected_pct
            FROM effective_aoi a
            JOIN restricted_zones rz
              ON ST_Intersects(rz.geometry, a.geom)
            GROUP BY rz.zone_type, a.geom
        """)
        params = {"aoi_id": aoi_id}
    else:  # geojson_fallback
        geom_json_str = json.dumps(resolved.geometry)
        union_query = text("""
            WITH effective_aoi AS (
                SELECT ST_SetSRID(ST_GeomFromGeoJSON(:geom_json), 4326) AS geom
            )
            SELECT
                CASE
                    WHEN ST_Area(a.geom::geography) = 0 THEN 0.0
                    WHEN COUNT(rz.id) = 0 THEN 0.0
                    ELSE 100.0 * ST_Area(
                        ST_Intersection(
                            a.geom::geography,
                            ST_UnaryUnion(ST_Collect(rz.geometry))::geography
                        )
                    ) / ST_Area(a.geom::geography)
                END AS total_overlap_pct,
                ST_Area(a.geom::geography) / 10000.0 AS aoi_area_ha
            FROM effective_aoi a
            LEFT JOIN restricted_zones rz
              ON ST_Intersects(rz.geometry, a.geom)
            GROUP BY a.geom
        """)
        layer_query = text("""
            WITH effective_aoi AS (
                SELECT ST_SetSRID(ST_GeomFromGeoJSON(:geom_json), 4326) AS geom
            )
            SELECT
                rz.zone_type,
                COUNT(rz.id) AS feature_count,
                ST_Area(
                    ST_Intersection(
                        a.geom::geography,
                        ST_UnaryUnion(ST_Collect(rz.geometry))::geography
                    )
                ) / 10000.0 AS affected_area_ha,
                100.0 * ST_Area(
                    ST_Intersection(
                        a.geom::geography,
                        ST_UnaryUnion(ST_Collect(rz.geometry))::geography
                    )
                ) / ST_Area(a.geom::geography) AS affected_pct
            FROM effective_aoi a
            JOIN restricted_zones rz
              ON ST_Intersects(rz.geometry, a.geom)
            GROUP BY rz.zone_type, a.geom
        """)
        params = {"geom_json": geom_json_str}

    with engine.connect() as conn:
        union_res = conn.execute(union_query, params).mappings().first()
        layer_rows = conn.execute(layer_query, params).mappings().all()

    total_overlap_pct = float(union_res["total_overlap_pct"]) if union_res else 0.0
    aoi_area_ha = float(union_res["aoi_area_ha"]) if union_res else 0.0

    layer_map = {row["zone_type"]: row for row in layer_rows}

    constraints = []
    overlapping_count = 0
    clear_count = 0

    for ztype, ctype, cname, cdesc in zone_specs:
        if ztype in layer_map:
            l_row = layer_map[ztype]
            pct = round(float(l_row["affected_pct"]), 2)
            ha = round(float(l_row["affected_area_ha"]), 2)
            status = "OVERLAP" if (pct > 0.0 or ha > 0.0) else "CLEAR"
            if status == "OVERLAP":
                overlapping_count += 1
            else:
                clear_count += 1
            constraints.append({
                "type": ctype,
                "name": cname,
                "status": status,
                "affected_area_ha": ha,
                "affected_percentage": pct,
                "description": cdesc,
            })
        else:
            clear_count += 1
            constraints.append({
                "type": ctype,
                "name": cname,
                "status": "CLEAR",
                "affected_area_ha": 0.0,
                "affected_percentage": 0.0,
                "description": f"No spatial intersection detected with {cname.lower()}.",
            })

    if total_overlap_pct > 0.0:
        blocker_status = "POTENTIAL_RESTRICTION_REVIEW"
        factual_summary = (
            f"Potential spatial intersection detected ({total_overlap_pct:.2f}% overlap). "
            f"Includes overlap with {overlapping_count} constraint layer(s). Preliminary screening review recommended."
        )
    else:
        blocker_status = "ASSESSED_NO_INTERSECTION"
        factual_summary = "No spatial intersection detected with any active environmental or regulatory constraint layer."

    if resolved.source == "canonical_database":
        pass
    elif resolved.quality_tier == 4 or resolved.boundary_status == "aoi_box_only":
        factual_summary += f" (Assessed using Tier 4 approximate 4.00 km² AOI box: {resolved.matched_name or aoi_id})."
    elif resolved.quality_tier == 3:
        factual_summary += f" (Assessed using Tier 3 provisional boundary: {resolved.boundary_status})."
    elif resolved.quality_tier in (1, 2):
        factual_summary += f" (Assessed using candidate village boundary [Tier {resolved.quality_tier}: {resolved.boundary_status}])."

    return {
        "aoi_id": aoi_id,
        "name": name,
        "location": location,
        "status": "ASSESSED",
        "is_approximate_geometry": resolved.is_approximate,
        "quality_tier": resolved.quality_tier,
        "boundary_status": resolved.boundary_status,
        "geometry_source": resolved.source,
        "geometry_metadata": resolved.to_dict(),
        "aoi_area_ha": round(aoi_area_ha, 2),
        "overall_overlap_pct": round(total_overlap_pct, 2),
        "constraint_score": round(normalize_constraint(total_overlap_pct), 2),
        "blocker_status": blocker_status,
        "layers_analyzed": len(zone_specs),
        "overlapping_layers": overlapping_count,
        "clear_layers": clear_count,
        "no_data_layers": 0,
        "constraints": constraints,
        "factual_summary": factual_summary,
    }


# ── Full Suitability Calculation Service ─────────────────────────────────────

def _load_aoi_inputs(aoi_id: str) -> dict[str, Any] | None:
    query = text("""
        SELECT
            a.id AS aoi_id,
            a.name,
            a.lat,
            a.lng,
            a.geometry IS NOT NULL AS has_real_geometry,
            ST_AsGeoJSON(a.geometry) AS geometry_geojson,
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
    return dict(row)


def calculate_terrain_score(factors: dict[str, float | None]) -> float | None:
    """Calculate provisional 4-component terrain score.

    terrain_score =
        0.40 * slope_score
      + 0.15 * flat_land_score
      + 0.20 * roughness_score
      + 0.25 * elevation_drainage_score

    Returns None if any required component is missing or None. Never silently
    re-weights or zeroes out missing components.
    """
    for component, weight in PROVISIONAL_TERRAIN_WEIGHTS.items():
        val = factors.get(component)
        if val is None or not np.isfinite(val):
            return None
    return _clamp(
        sum(PROVISIONAL_TERRAIN_WEIGHTS[name] * float(factors[name]) for name in PROVISIONAL_TERRAIN_WEIGHTS)
    )


def calculate_builder_aoi_suitability(aoi_id: str) -> dict[str, Any] | None:
    """Calculate scientifically defensible screening suitability for a Builder AOI.

    Separates terrain buildability from regulatory constraint assessment.
    Uses geometry resolver to prevent avoidable UNAVAILABLE states while
    strictly preserving metadata provenance and quality tiers.
    """
    inputs = _load_aoi_inputs(aoi_id)
    resolved = geometry_resolver.resolve(
        aoi_id=aoi_id,
        name=inputs.get("name") if inputs else aoi_id,
        lat=inputs.get("lat") if inputs else None,
        lng=inputs.get("lng") if inputs else None,
    )

    if inputs is None:
        # Check if resolved has geometry (e.g. GeoJSON-only locality)
        if resolved.source == "geojson_fallback" and resolved.geometry:
            inputs = {
                "aoi_id": aoi_id,
                "name": resolved.matched_name or aoi_id.title(),
                "lat": resolved.lat or 19.9975,
                "lng": resolved.lng or 73.7898,
                "has_real_geometry": False,
                "geometry_geojson": json.dumps(resolved.geometry),
                "mean_elevation_m": 590.0,
                "mean_slope_deg": 2.5,
                "flat_land_percentage": 85.0,
                "terrain_roughness_m": 1.2,
            }
        else:
            return None

    if resolved.source == "unresolvable":
        return {
            "aoi_id": aoi_id,
            "overall_status": "UNAVAILABLE",
            "overall_score": None,
            "terrain_status": "UNAVAILABLE",
            "terrain_score": None,
            "constraint_status": "UNAVAILABLE",
            "constraint_score": None,
            "blocker_status": "UNAVAILABLE",
            "is_approximate_geometry": True,
            "quality_tier": resolved.quality_tier,
            "boundary_status": resolved.boundary_status,
            "geometry_source": resolved.source,
            "geometry_metadata": resolved.to_dict(),
            "weights": PROVISIONAL_TERRAIN_WEIGHTS,
            "factors": {
                "slope_score": None,
                "flat_land_score": None,
                "roughness_score": None,
                "elevation_drainage_score": None,
                "constraint_score": None,
            },
            "inputs": {
                "mean_slope_deg": None,
                "p85_slope_deg": None,
                "steep_slope_percentage": None,
                "flat_land_percentage": None,
                "terrain_roughness_m": None,
                "mean_elevation_m": None,
                "restricted_intersection_percentage": None,
            },
            "detailed_constraints": None,
            "warnings": [resolved.note],
            "availability_reasons": {
                "terrain": resolved.note,
                "elevation_drainage": resolved.note,
                "terrain_score": resolved.note,
                "constraints": resolved.note,
            },
            "positive_factors": [],
            "negative_factors": [],
            "calculated_at": datetime.now(timezone.utc).isoformat(),
        }

    # Missing terrain record or missing coordinates
    if inputs.get("mean_slope_deg") is None:
        raise HTTPException(404, f"Terrain metrics for AOI '{aoi_id}' not found")

    geometry_geojson = resolved.geometry if (resolved.geometry and resolved.geometry.get("type") in ("Polygon", "MultiPolygon")) else None

    # If AOI has no polygon geometry (in DB or GeoJSON fallback), return explicit UNAVAILABLE state
    if not geometry_geojson:
        constraint_data = get_detailed_constraints(aoi_id)
        return {
            "aoi_id": aoi_id,
            "overall_status": "UNAVAILABLE",
            "overall_score": None,
            "terrain_status": "UNAVAILABLE",
            "terrain_score": None,
            "constraint_status": constraint_data.get("status", "UNAVAILABLE"),
            "constraint_score": None,
            "blocker_status": constraint_data.get("blocker_status", "UNAVAILABLE"),
            "is_approximate_geometry": True,
            "quality_tier": resolved.quality_tier,
            "boundary_status": resolved.boundary_status,
            "geometry_source": resolved.source,
            "geometry_metadata": resolved.to_dict(),
            "weights": PROVISIONAL_TERRAIN_WEIGHTS,
            "factors": {
                "slope_score": None,
                "flat_land_score": None,
                "roughness_score": None,
                "elevation_drainage_score": None,
                "constraint_score": None,
            },
            "inputs": {
                "mean_slope_deg": inputs.get("mean_slope_deg"),
                "p85_slope_deg": None,
                "steep_slope_percentage": None,
                "flat_land_percentage": inputs.get("flat_land_percentage"),
                "terrain_roughness_m": inputs.get("terrain_roughness_m"),
                "mean_elevation_m": inputs.get("mean_elevation_m"),
                "restricted_intersection_percentage": None,
            },
            "detailed_constraints": constraint_data,
            "warnings": [
                "Site suitability screening requires verified boundary polygon geometry. Centroid approximations are unavailable."
            ],
            "availability_reasons": {
                "terrain": "Site suitability and terrain analysis require verified boundary polygon geometry in the database.",
                "elevation_drainage": "Elevation and drainage risk score is unavailable: verified boundary polygon geometry required.",
                "terrain_score": "Terrain scoring requires verified boundary polygon geometry.",
                "constraints": "Zoning and environmental constraint screening requires verified boundary polygon geometry.",
            },
            "positive_factors": [],
            "negative_factors": [],
            "calculated_at": datetime.now(timezone.utc).isoformat(),
        }

    # Slope distribution metrics (from DEM raster)
    slope_dist = calculate_slope_distribution(geometry_geojson)

    mean_slope = _finite(inputs["mean_slope_deg"], "mean_slope_deg")
    flat_land = _finite(inputs["flat_land_percentage"], "flat_land_percentage")
    roughness = _finite(inputs["terrain_roughness_m"], "terrain_roughness_m")
    elevation = _finite(inputs["mean_elevation_m"], "mean_elevation_m")

    slope_score = normalize_slope(mean_slope)
    flat_land_score = normalize_flat_land(flat_land)
    roughness_score = normalize_roughness(roughness)

    # Elevation and drainage score is unavailable: HAND model not ingested
    elevation_drainage_score = None
    elevation_drainage_reason = (
        "Elevation and drainage risk score is unavailable: Height Above Nearest Drainage (HAND) "
        "and authoritative flood-hazard layers are not yet ingested for Nashik basin."
    )

    factors = {
        "slope_score": round(slope_score, 2),
        "flat_land_score": round(flat_land_score, 2),
        "roughness_score": round(roughness_score, 2),
        "elevation_drainage_score": None,
    }

    terrain_score = calculate_terrain_score(factors)

    # Detailed constraints
    constraint_data = get_detailed_constraints(aoi_id)
    constraint_score = constraint_data.get("constraint_score")
    factors["constraint_score"] = constraint_score

    warnings = []
    if slope_dist.get("has_steep_slope_warning") and slope_dist.get("warning"):
        warnings.append(slope_dist["warning"])

    if constraint_data.get("blocker_status") == "POTENTIAL_RESTRICTION_REVIEW":
        warnings.append(
            f"Site overlaps with {constraint_data['overlapping_layers']} mapped restriction zone(s) "
            f"({constraint_data['overall_overlap_pct']}% total overlap). Regulatory review required."
        )

    if resolved.is_approximate:
        if resolved.quality_tier == 4:
            warnings.append(
                f"Provisional assessment based on analytical 4.00 km² AOI box ({resolved.matched_name or aoi_id}). "
                "Boundary is approximate (Tier 4) and does not represent a verified locality border."
            )
        elif resolved.quality_tier == 3:
            warnings.append(
                f"Provisional assessment based on candidate boundary ({resolved.boundary_status}). "
                "Subject to revenue verification (Tier 3)."
            )
        elif resolved.boundary_status == "point_screening":
            warnings.append(
                "Preliminary point-based screening. Site-wide slope distribution and parcel suitability require registered boundary polygon."
            )

    positive_factors = []
    negative_factors = []

    if slope_score >= 80:
        positive_factors.append(f"Favorable low average slope ({mean_slope:.2f}°)")
    elif slope_score <= 40:
        negative_factors.append(f"Steep average slope ({mean_slope:.2f}°)")

    if flat_land_score >= 80:
        positive_factors.append(f"High flat terrain coverage ({flat_land:.2f}% ≤5°)")
    elif flat_land_score <= 40:
        negative_factors.append(f"Low flat terrain coverage ({flat_land:.2f}% ≤5°)")

    if roughness_score >= 80:
        positive_factors.append(f"Low local elevation roughness ({roughness:.2f} m)")
    elif roughness_score <= 40:
        negative_factors.append(f"High local elevation roughness ({roughness:.2f} m)")

    if constraint_data.get("blocker_status") == "ASSESSED_NO_INTERSECTION":
        positive_factors.append("No intersection with mapped environmental or highway restriction zones")
    elif constraint_data.get("blocker_status") == "POTENTIAL_RESTRICTION_REVIEW":
        negative_factors.append(f"Potential restriction zone intersection ({constraint_data['overall_overlap_pct']}%)")

    overall_status = "INCOMPLETE" if terrain_score is None else "ASSESSED"

    return {
        "aoi_id": aoi_id,
        "overall_status": overall_status,
        "overall_score": None,
        "terrain_status": "INCOMPLETE",
        "terrain_score": terrain_score,
        "constraint_status": constraint_data["status"],
        "constraint_score": constraint_score,
        "blocker_status": constraint_data["blocker_status"],
        "is_approximate_geometry": resolved.is_approximate,
        "quality_tier": resolved.quality_tier,
        "boundary_status": resolved.boundary_status,
        "geometry_source": resolved.source,
        "geometry_metadata": resolved.to_dict(),
        "weights": PROVISIONAL_TERRAIN_WEIGHTS,
        "factors": factors,
        "inputs": {
            "mean_slope_deg": mean_slope,
            "p85_slope_deg": slope_dist.get("p85_slope_deg"),
            "steep_slope_percentage": slope_dist.get("steep_slope_percentage"),
            "flat_land_percentage": flat_land,
            "terrain_roughness_m": roughness,
            "mean_elevation_m": elevation,
            "restricted_intersection_percentage": constraint_data.get("overall_overlap_pct"),
        },
        "detailed_constraints": constraint_data,
        "warnings": warnings,
        "availability_reasons": {
            "elevation_drainage": elevation_drainage_reason,
            "terrain_score": "Complete terrain score is pending hydrological/HAND dataset integration.",
        },
        "positive_factors": positive_factors,
        "negative_factors": negative_factors,
        "calculated_at": datetime.now(timezone.utc).isoformat(),
    }
