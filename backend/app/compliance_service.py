import json
from sqlalchemy import create_engine, text
from fastapi import HTTPException
from .config import settings

def get_engine():
    if not settings.database_url:
        raise HTTPException(503, "Database URL is not configured.")
    url = settings.database_url
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return create_engine(url)

def check_compliance(construction_geojson: dict) -> dict:
    """
    Check if a given GeoJSON polygon intersects with any restricted zones.
    Returns intersection summary and list of potential violations.
    """
    if not construction_geojson:
        raise HTTPException(400, "No geometry provided.")
        
    # Extract the geometry from the GeoJSON Feature or Polygon
    if construction_geojson.get("type") == "Feature":
        geometry = construction_geojson.get("geometry")
    elif construction_geojson.get("type") in ["Polygon", "MultiPolygon", "Point", "LineString"]:
        geometry = construction_geojson
    else:
        raise HTTPException(400, f"Unsupported geometry type: {construction_geojson.get('type')}")
        
    geom_json = json.dumps(geometry)
    
    engine = get_engine()
    
    # We use ST_Intersects to find overlapping zones.
    # We also calculate the approximate intersection area in square meters using geography cast.
    query = text("""
        WITH input_geom AS (
            SELECT ST_SetSRID(ST_GeomFromGeoJSON(:geom_json), 4326) as geom
        )
        SELECT 
            rz.zone_type,
            rz.source_dataset,
            rz.source_feature_id,
            ST_Area(ST_Intersection(rz.geometry, input_geom.geom)::geography) as intersection_area_sqm
        FROM 
            restricted_zones rz, input_geom
        WHERE 
            ST_Intersects(rz.geometry, input_geom.geom)
    """)
    
    try:
        with engine.connect() as conn:
            result = conn.execute(query, {"geom_json": geom_json})
            rows = result.fetchall()
    except Exception as e:
        raise HTTPException(500, f"Database query failed: {str(e)}")
        
    violations = []
    summary = {
        "FOREST": 0,
        "RIVER": 0,
        "LAKE": 0,
        "WATERBODY": 0,
        "HIGHWAY": 0
    }
    
    for row in rows:
        zone_type = row[0]
        violations.append({
            "zone_type": zone_type,
            "source_dataset": row[1],
            "source_feature_id": row[2],
            "intersection_area_sqm": round(row[3], 2)
        })
        if zone_type in summary:
            summary[zone_type] += 1
            
    return {
        "potential_violation": len(violations) > 0,
        "restricted_zone_intersection": len(violations) > 0,
        "summary": summary,
        "intersections": violations
    }
