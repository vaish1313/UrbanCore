from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel
from typing import Optional
from .complaints_service import (
    create_complaint, 
    get_municipal_complaints, 
    get_complaint_by_id_or_ref, 
    update_complaint_status,
    generate_pdf_receipt
)

router = APIRouter(tags=["Citizen Complaints"])
municipal_router = APIRouter(tags=["Municipal Complaints"])

class ComplaintCreate(BaseModel):
    citizen_name: str
    description: str
    location_name: str
    latitude: float
    longitude: float
    title: Optional[str] = "Citizen Report"
    evidence_reference: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str

# Citizen API
@router.post("")
async def submit_complaint(complaint: ComplaintCreate):
    """Submit a new complaint as a citizen."""
    result = create_complaint(
        citizen_name=complaint.citizen_name,
        description=complaint.description,
        location_name=complaint.location_name,
        latitude=complaint.latitude,
        longitude=complaint.longitude,
        title=complaint.title,
        evidence_reference=complaint.evidence_reference
    )
    return result

@router.get("/{identifier}/receipt")
async def download_receipt(identifier: str):
    """Download a PDF receipt for a submitted complaint."""
    complaint = get_complaint_by_id_or_ref(identifier)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    pdf_bytes = generate_pdf_receipt(complaint)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="receipt_{complaint["reference_number"]}.pdf"'
        }
    )

# Municipal APIs
@municipal_router.get("")
async def list_complaints(limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0)):
    """List citizen complaints for the municipal dashboard."""
    complaints = get_municipal_complaints(limit=limit, offset=offset)
    return {"complaints": complaints, "count": len(complaints)}

@municipal_router.get("/{identifier}")
async def get_complaint_detail(identifier: str):
    """Get complaint details including GeoJSON geometry."""
    complaint = get_complaint_by_id_or_ref(identifier)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint

@municipal_router.patch("/{identifier}/status")
async def update_status(identifier: str, update: StatusUpdate):
    """Update complaint status from the municipal dashboard."""
    try:
        success = update_complaint_status(identifier, update.status)
        if not success:
            raise HTTPException(status_code=404, detail="Complaint not found")
        return {"message": "Status updated successfully", "status": update.status}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
