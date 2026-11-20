import json
from fastapi import HTTPException
from sqlalchemy import create_engine, text
from .config import settings

# ── Database engine (same pattern as municipal_service.py) ────────────────────
DATABASE_URL = settings.database_url
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)


from .geometry_resolver import geometry_resolver


# ── Helpers ───────────────────────────────────────────────────────────────────

def _row_to_aoi(row) -> dict:
    """Serialise a DB row into the response dict the frontend expects.

    Resolves geometry through the priority hierarchy:
    1. Canonical database geometry (builder_aois.geometry).
    2. Safely matched feature from the complete 30-AOI GeoJSON dataset.
    3. Coordinate-based point.
    """
    resolved = geometry_resolver.resolve(
        aoi_id=row.id,
        name=row.name,
        lat=row.lat,
        lng=row.lng,
        db_geometry=row.geometry,
        db_queried=True,
    )

    # Use resolved polygon/multipolygon geometry if available
    geometry = None
    if resolved.geometry and resolved.geometry.get("type") in ("Polygon", "MultiPolygon"):
        geometry = resolved.geometry

    return {
        "id":   row.id,
        "name": row.name,
        "location": row.location,
        "village":  row.village,
        "taluka":   row.taluka,
        "district": row.district,
        "category": row.category,
        "status":   row.status,
        # Nested coords object matching frontend AOI type
        "coords": {
            "lat": row.lat,
            "lng": row.lng,
            "x":   row.map_x,
            "y":   row.map_y,
        },
        "geometry": geometry,
        "geometryMetadata": resolved.to_dict(),
        "isApproximateGeometry": resolved.is_approximate,
        "qualityTier": resolved.quality_tier,
        "boundaryStatus": resolved.boundary_status,
        "geometrySource": resolved.source,
        # Scoring
        "suitabilityScore":          row.suitability_score,
        "accessibilityScore":        row.accessibility_score,
        "waterAvailabilityScore":    row.water_availability_score,
        "environmentalRiskScore":    row.environmental_risk_score,
        "developmentPotentialScore": row.development_potential_score,
        # Terrain (nested object matching frontend AOI.terrain)
        "terrain": {
            "elevation":      row.elevation,
            "slope":          row.slope,
            "roughness":      row.roughness,
            "flatLandPercent": row.flat_land_percent,
            "readiness":      row.readiness,
        },
        # Constraints (nested object matching frontend AOI.constraints)
        "constraints": {
            "floodZoneOverlapPercent":      row.flood_zone_overlap_pct,
            "forestBoundaryOverlapPercent": row.forest_boundary_overlap_pct,
            "greenBeltOverlapPercent":      row.green_belt_overlap_pct,
            "protectedAreaOverlapPercent":  row.protected_area_overlap_pct,
            "environmentalRestriction":     row.environmental_restriction,
        },
        "estimatedConstructionAreaSqM": row.estimated_construction_area_sqm,
        "summary": row.summary,
    }


def _attach_history(aois: list[dict]) -> list[dict]:
    """
    Fetch construction history for a list of AOIs and attach it in-place.
    Uses a single IN-clause query to avoid N+1.
    """
    if not aois:
        return aois

    ids = [a["id"] for a in aois]
    placeholders = ", ".join(f":id_{i}" for i in range(len(ids)))
    params = {f"id_{i}": v for i, v in enumerate(ids)}

    query = text(f"""
        SELECT aoi_id, year, buildings_count, built_up_change_pct
        FROM   builder_aoi_construction_history
        WHERE  aoi_id IN ({placeholders})
        ORDER  BY aoi_id, year
    """)

    history_map: dict[str, list] = {}
    with engine.connect() as conn:
        rows = conn.execute(query, params).fetchall()
        for row in rows:
            history_map.setdefault(row.aoi_id, []).append({
                "year":                 row.year,
                "buildingsCount":       row.buildings_count,
                "builtUpChangePercent": row.built_up_change_pct,
            })

    for aoi in aois:
        aoi["constructionHistory"] = history_map.get(aoi["id"], [])

    return aois


# ── Public service functions ──────────────────────────────────────────────────

def get_builder_aois(
    search: str | None = None,
    category: str | None = None,
    status: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict]:
    """
    Return builder AOIs from PostGIS with optional filters.

    Parameters
    ----------
    search   : Case-insensitive substring match on name, village, or id.
    category : Exact match on category (residential, commercial, industrial,
               protected, highway, dam).
    status   : Exact match on status (green, yellow, red).
    limit    : Max rows to return (1-100).
    offset   : Pagination offset.
    """
    query_str = """
        SELECT
            id, name, location, village, taluka, district, category, status,
            lat, lng, map_x, map_y,
            ST_AsGeoJSON(geometry) AS geometry,
            suitability_score, accessibility_score, water_availability_score,
            environmental_risk_score, development_potential_score,
            elevation, slope, roughness, flat_land_percent, readiness,
            flood_zone_overlap_pct, forest_boundary_overlap_pct,
            green_belt_overlap_pct, protected_area_overlap_pct,
            environmental_restriction, estimated_construction_area_sqm, summary
        FROM builder_aois
        WHERE 1=1
    """
    params: dict = {"limit": limit, "offset": offset}

    if search:
        query_str += " AND (lower(name) LIKE :search OR lower(village) LIKE :search OR lower(id) LIKE :search)"
        params["search"] = f"%{search.lower()}%"

    if category:
        query_str += " AND category = :category"
        params["category"] = category

    if status:
        query_str += " AND status = :status"
        params["status"] = status

    query_str += " ORDER BY name ASC LIMIT :limit OFFSET :offset"

    try:
        with engine.connect() as conn:
            rows = conn.execute(text(query_str), params).fetchall()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")

    aois = [_row_to_aoi(r) for r in rows]
    if search and not aois:
        resolved = geometry_resolver.resolve(aoi_id=search, name=search)
        if resolved.source == "geojson_fallback" and resolved.geometry:
            synthetic = get_builder_aoi_by_id(resolved.matched_id or search)
            if synthetic:
                return [synthetic]

    return _attach_history(aois)


def get_builder_aoi_by_id(aoi_id: str) -> dict | None:
    """Return a single AOI by its slug id, or None if not found."""
    query = text("""
        SELECT
            id, name, location, village, taluka, district, category, status,
            lat, lng, map_x, map_y,
            ST_AsGeoJSON(geometry) AS geometry,
            suitability_score, accessibility_score, water_availability_score,
            environmental_risk_score, development_potential_score,
            elevation, slope, roughness, flat_land_percent, readiness,
            flood_zone_overlap_pct, forest_boundary_overlap_pct,
            green_belt_overlap_pct, protected_area_overlap_pct,
            environmental_restriction, estimated_construction_area_sqm, summary
        FROM builder_aois
        WHERE id = :aoi_id
    """)

    try:
        with engine.connect() as conn:
            row = conn.execute(query, {"aoi_id": aoi_id}).fetchone()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")

    if not row:
        # Fallback to GeoJSON resolution for unseeded or GeoJSON-only localities
        resolved = geometry_resolver.resolve(aoi_id=aoi_id, name=aoi_id)
        if resolved.source == "geojson_fallback" and resolved.geometry:
            centroid_lat = resolved.lat or 19.9975
            centroid_lng = resolved.lng or 73.7898
            area_sqm = int((resolved.area_km2 or 4.0) * 1_000_000)
            return {
                "id": aoi_id,
                "name": resolved.matched_name or aoi_id.replace("-", " ").title(),
                "location": f"{resolved.matched_name or aoi_id.title()}, Nashik",
                "village": resolved.matched_name or aoi_id.title(),
                "taluka": "Nashik",
                "district": "Nashik",
                "category": "residential",
                "status": "yellow",
                "coords": {
                    "lat": centroid_lat,
                    "lng": centroid_lng,
                    "x": 50,
                    "y": 50,
                },
                "geometry": resolved.geometry,
                "geometryMetadata": resolved.to_dict(),
                "isApproximateGeometry": resolved.is_approximate,
                "qualityTier": resolved.quality_tier,
                "boundaryStatus": resolved.boundary_status,
                "geometrySource": resolved.source,
                "suitabilityScore": 0,
                "accessibilityScore": 0,
                "waterAvailabilityScore": 0,
                "environmentalRiskScore": 0,
                "developmentPotentialScore": 0,
                "terrain": {
                    "elevation": 590.0,
                    "slope": 2.5,
                    "roughness": "Moderate",
                    "flatLandPercent": 85.0,
                    "readiness": "MEDIUM",
                },
                "constraints": {
                    "floodZoneOverlapPercent": 0,
                    "forestBoundaryOverlapPercent": 0,
                    "greenBeltOverlapPercent": 0,
                    "protectedAreaOverlapPercent": 0,
                    "environmentalRestriction": "Low",
                },
                "estimatedConstructionAreaSqM": area_sqm,
                "summary": resolved.note,
                "constructionHistory": [],
            }
        return None

    aoi = _row_to_aoi(row)
    return _attach_history([aoi])[0]


def get_aois_near(aoi_id: str, limit: int = 4) -> list[dict]:
    """
    Return the `limit` nearest AOIs to the given aoi_id (by centroid distance).
    Used by the AreaComparison component via /api/v1/aois/compare/{aoi_id}.
    """
    query = text("""
        WITH origin AS (
            SELECT lat, lng FROM builder_aois WHERE id = :aoi_id
        )
        SELECT
            b.id, b.name, b.location, b.village, b.taluka, b.district,
            b.category, b.status,
            b.lat, b.lng, b.map_x, b.map_y,
            ST_AsGeoJSON(b.geometry) AS geometry,
            b.suitability_score, b.accessibility_score, b.water_availability_score,
            b.environmental_risk_score, b.development_potential_score,
            b.elevation, b.slope, b.roughness, b.flat_land_percent, b.readiness,
            b.flood_zone_overlap_pct, b.forest_boundary_overlap_pct,
            b.green_belt_overlap_pct, b.protected_area_overlap_pct,
            b.environmental_restriction, b.estimated_construction_area_sqm, b.summary,
            -- Great-circle distance in km using the Haversine approximation via PostGIS
            ST_Distance(
                ST_MakePoint(b.lng, b.lat)::geography,
                ST_MakePoint(o.lng,  o.lat)::geography
            ) / 1000.0 AS distance_km
        FROM builder_aois b, origin o
        WHERE b.id != :aoi_id
        ORDER BY distance_km ASC
        LIMIT :limit
    """)

    with engine.connect() as conn:
        rows = conn.execute(query, {"aoi_id": aoi_id, "limit": limit}).fetchall()

    result = []
    for r in rows:
        aoi = _row_to_aoi(r)
        aoi["distance_km"] = round(float(r.distance_km), 1)
        result.append(aoi)

    return _attach_history(result)
