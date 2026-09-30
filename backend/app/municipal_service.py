import json
from uuid import UUID
from sqlalchemy import create_engine, text
from .config import settings
import httpx
from shapely.geometry import shape

# Reusing the existing engine from the main app or setting one up if needed.
# Typically we would use a SQLAlchemy session, but since we are modifying service.py which uses raw SQLAlchemy, let's keep it simple.
DATABASE_URL = settings.database_url
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

def persist_municipal_cases(analysis_id: str, year: int, compliance_results: list[dict]) -> None:
    """
    Persist compliance results into municipal_cases.
    Only called for positive potential_violation results.
    """
    if not compliance_results:
        return
        
    query = text("""
        INSERT INTO municipal_cases (
            analysis_id, 
            year, 
            polygon_index, 
            geometry, 
            latitude, 
            longitude, 
            compliance_summary, 
            intersection_details
        ) VALUES (
            :analysis_id,
            :year,
            :polygon_index,
            ST_GeomFromGeoJSON(:geometry),
            :latitude,
            :longitude,
            :compliance_summary,
            :intersection_details
        )
        ON CONFLICT (analysis_id, year, polygon_index) 
        DO UPDATE SET
            geometry = EXCLUDED.geometry,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            compliance_summary = EXCLUDED.compliance_summary,
            intersection_details = EXCLUDED.intersection_details,
            updated_at = CURRENT_TIMESTAMP
    """)
    
    with engine.begin() as conn:
        for comp in compliance_results:
            if not comp.get("potential_violation"):
                continue
                
            geom = comp.get("geometry")
            # Calculate centroid for lat/lon
            lat, lon = None, None
            if geom:
                try:
                    s = shape(geom)
                    centroid = s.centroid
                    lon, lat = centroid.x, centroid.y
                except Exception:
                    pass
            
            conn.execute(query, {
                "analysis_id": analysis_id,
                "year": year,
                "polygon_index": comp["polygon_index"],
                "geometry": json.dumps(geom) if geom else None,
                "latitude": lat,
                "longitude": lon,
                "compliance_summary": json.dumps(comp.get("summary", {})),
                "intersection_details": json.dumps(comp.get("intersections", []))
            })

def get_municipal_cases(status: str = None, year: int = None, limit: int = 50, offset: int = 0) -> list[dict]:
    query_str = """
        SELECT 
            id, analysis_id, year, polygon_index, status, 
            latitude, longitude, compliance_summary, intersection_details, 
            created_at, updated_at
        FROM municipal_cases
        WHERE 1=1
    """
    params = {"limit": limit, "offset": offset}
    
    if status:
        query_str += " AND status = :status"
        params["status"] = status
    if year:
        query_str += " AND year = :year"
        params["year"] = year
        
    query_str += " ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
    
    with engine.connect() as conn:
        result = conn.execute(text(query_str), params)
        cases = []
        for row in result:
            cases.append({
                "id": str(row.id),
                "analysis_id": row.analysis_id,
                "year": row.year,
                "polygon_index": row.polygon_index,
                "status": row.status,
                "latitude": row.latitude,
                "longitude": row.longitude,
                "compliance_summary": row.compliance_summary,
                "intersection_details": row.intersection_details,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None
            })
        return cases

def get_municipal_case_by_id(case_id: str) -> dict | None:
    query = text("""
        SELECT 
            id, analysis_id, year, polygon_index, status, 
            ST_AsGeoJSON(geometry) as geometry,
            latitude, longitude, compliance_summary, intersection_details, 
            created_at, updated_at
        FROM municipal_cases
        WHERE id = :case_id
    """)
    
    with engine.connect() as conn:
        result = conn.execute(query, {"case_id": case_id}).fetchone()
        if not result:
            return None
            
        return {
            "id": str(result.id),
            "analysis_id": result.analysis_id,
            "year": result.year,
            "polygon_index": result.polygon_index,
            "status": result.status,
            "geometry": json.loads(result.geometry) if result.geometry else None,
            "latitude": result.latitude,
            "longitude": result.longitude,
            "compliance_summary": result.compliance_summary,
            "intersection_details": result.intersection_details,
            "created_at": result.created_at.isoformat() if result.created_at else None,
            "updated_at": result.updated_at.isoformat() if result.updated_at else None
        }

def update_municipal_case_status(case_id: str, status: str) -> bool:
    allowed_statuses = {"NEEDS_REVIEW", "REVIEWED", "NOTICE_ISSUED", "RESOLVED"}
    if status not in allowed_statuses:
        raise ValueError(f"Invalid status. Must be one of {allowed_statuses}")
        
    query = text("""
        UPDATE municipal_cases
        SET status = :status, updated_at = CURRENT_TIMESTAMP
        WHERE id = :case_id
    """)
    
    with engine.begin() as conn:
        result = conn.execute(query, {"status": status, "case_id": case_id})
        return result.rowcount > 0
