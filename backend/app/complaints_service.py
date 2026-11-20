import json
import random
import io
from datetime import datetime
from uuid import UUID
from sqlalchemy import create_engine, text
from .config import settings
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

DATABASE_URL = settings.database_url
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

def generate_reference_number() -> str:
    """Generate a unique reference number like UC-2026-000123"""
    year = datetime.now().year
    rand_num = random.randint(10000, 99999)
    return f"URB-{year}-{rand_num}"

def create_complaint(
    citizen_name: str, 
    description: str, 
    location_name: str, 
    latitude: float, 
    longitude: float, 
    title: str = "Citizen Report",
    evidence_reference: str = None
) -> dict:
    reference_number = generate_reference_number()
    
    query = text("""
        INSERT INTO complaints (
            reference_number, citizen_name, title, description, 
            latitude, longitude, location_name, evidence_reference,
            geometry
        ) VALUES (
            :reference_number, :citizen_name, :title, :description, 
            :latitude, :longitude, :location_name, :evidence_reference,
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)
        ) RETURNING id, reference_number, status, created_at, latitude, longitude
    """)
    
    with engine.begin() as conn:
        result = conn.execute(query, {
            "reference_number": reference_number,
            "citizen_name": citizen_name,
            "title": title,
            "description": description,
            "latitude": latitude,
            "longitude": longitude,
            "location_name": location_name,
            "evidence_reference": evidence_reference
        }).fetchone()
        
        return {
            "id": str(result.id),
            "reference_number": result.reference_number,
            "status": result.status,
            "created_at": result.created_at.isoformat(),
            "location": {
                "latitude": result.latitude,
                "longitude": result.longitude
            }
        }

def get_complaint_by_id_or_ref(identifier: str) -> dict | None:
    # Try parsing as UUID first
    is_uuid = False
    try:
        UUID(identifier)
        is_uuid = True
    except ValueError:
        pass
        
    query_str = """
        SELECT 
            id, reference_number, citizen_name, title, description,
            status, latitude, longitude, location_name, evidence_reference,
            created_at, updated_at,
            ST_AsGeoJSON(geometry) as geometry
        FROM complaints
    """
    
    if is_uuid:
        query_str += " WHERE id = :identifier"
    else:
        query_str += " WHERE reference_number = :identifier"
        
    with engine.connect() as conn:
        row = conn.execute(text(query_str), {"identifier": identifier}).fetchone()
        if not row:
            return None
            
        return {
            "id": str(row.id),
            "reference_number": row.reference_number,
            "citizen_name": row.citizen_name,
            "title": row.title,
            "description": row.description,
            "status": row.status,
            "latitude": row.latitude,
            "longitude": row.longitude,
            "location_name": row.location_name,
            "evidence_reference": row.evidence_reference,
            "created_at": row.created_at.isoformat() if row.created_at else None,
            "updated_at": row.updated_at.isoformat() if row.updated_at else None,
            "geometry": json.loads(row.geometry) if row.geometry else None
        }

def generate_pdf_receipt(complaint: dict) -> bytes:
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Header
    p.setFont("Helvetica-Bold", 18)
    p.drawString(50, 750, "UrbanCore - Citizen Complaint Receipt")
    
    p.setFont("Helvetica", 12)
    p.drawString(50, 710, f"Reference Number: {complaint['reference_number']}")
    p.drawString(50, 690, f"Date Submitted: {complaint['created_at']}")
    p.drawString(50, 670, f"Status: {complaint['status']}")
    
    # Details
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, 630, "Complaint Details")
    
    p.setFont("Helvetica", 12)
    p.drawString(50, 600, f"Citizen Name: {complaint['citizen_name'] or 'Anonymous'}")
    p.drawString(50, 580, f"Location: {complaint['location_name']}")
    p.drawString(50, 560, f"Coordinates: {complaint['latitude']}, {complaint['longitude']}")
    
    p.drawString(50, 530, "Description:")
    
    # Wrap text for description
    textobject = p.beginText(50, 510)
    textobject.setFont("Helvetica", 11)
    
    # simple wrapping logic
    max_chars = 90
    desc = complaint['description'] or ""
    lines = [desc[i:i+max_chars] for i in range(0, len(desc), max_chars)]
    
    for line in lines:
        textobject.textLine(line)
        
    p.drawText(textobject)
    
    p.setFont("Helvetica-Oblique", 10)
    p.drawString(50, 100, "This is a system-generated receipt. Please keep the reference number for your records.")
    
    p.showPage()
    p.save()
    
    buffer.seek(0)
    return buffer.getvalue()

def get_municipal_complaints(limit: int = 50, offset: int = 0) -> list[dict]:
    query_str = """
        SELECT 
            id, reference_number, citizen_name, title, description,
            status, latitude, longitude, location_name, evidence_reference,
            created_at, updated_at
        FROM complaints
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """
    with engine.connect() as conn:
        result = conn.execute(text(query_str), {"limit": limit, "offset": offset})
        complaints = []
        for row in result:
            complaints.append({
                "id": str(row.id),
                "reference_number": row.reference_number,
                "citizen_name": row.citizen_name,
                "title": row.title,
                "description": row.description,
                "status": row.status,
                "latitude": row.latitude,
                "longitude": row.longitude,
                "location_name": row.location_name,
                "evidence_reference": row.evidence_reference,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
            })
        return complaints

def normalize_status(raw_status: str) -> str:
    """Normalize input status to standard canonical representation."""
    s = (raw_status or "").strip().lower()
    if s in ("new", "pending", "pending review"):
        return "New"
    if s in ("submitted",):
        return "SUBMITTED"
    if s in ("under review", "under_review", "reviewed"):
        return "Under Review"
    if s in ("action taken", "action_taken", "notice issued", "notice_issued"):
        return "Action Taken"
    if s in ("closed", "resolved", "completed"):
        return "Closed"
    return raw_status

def update_complaint_status(complaint_id: str, status: str) -> bool:
    normalized = normalize_status(status)
    allowed_statuses = {"New", "Under Review", "Action Taken", "Closed", "SUBMITTED"}
    if normalized not in allowed_statuses:
        raise ValueError(f"Invalid status '{status}'. Must be one of {allowed_statuses}")
        
    is_uuid = False
    try:
        UUID(complaint_id)
        is_uuid = True
    except ValueError:
        pass

    where_clause = "id = :complaint_id" if is_uuid else "reference_number = :complaint_id"
    
    query = text(f"""
        UPDATE complaints
        SET status = :status, updated_at = CURRENT_TIMESTAMP
        WHERE {where_clause}
    """)
    
    with engine.begin() as conn:
        result = conn.execute(query, {"status": normalized, "complaint_id": complaint_id})
        return result.rowcount > 0
