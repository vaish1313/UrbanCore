from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.security import get_current_user, require_municipal
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintStatus
from app.schemas.complaint import ComplaintResponse, ComplaintUpdateStatus

router = APIRouter(tags=["Municipal"])

@router.get("/complaints", response_model=list[ComplaintResponse])
def get_all_complaints(
    status: str = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_municipal),
    db: Session = Depends(get_db)
):
    """Get all complaints. Only accessible by MUNICIPAL_CORP."""
    query = db.query(Complaint)
    if status:
        query = query.filter(Complaint.status == status)
    
    return query.order_by(Complaint.created_at.desc()).offset(offset).limit(limit).all()

@router.patch("/complaints/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: str,
    update_in: ComplaintUpdateStatus,
    current_user: User = Depends(require_municipal),
    db: Session = Depends(get_db)
):
    """Update complaint status. Only accessible by MUNICIPAL_CORP."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    old_status = complaint.status
    new_status = update_in.status
    
    # Validate transition
    valid_transitions = {
        ComplaintStatus.SUBMITTED: [ComplaintStatus.ACKNOWLEDGED],
        ComplaintStatus.ACKNOWLEDGED: [ComplaintStatus.UNDER_REVIEW],
        ComplaintStatus.UNDER_REVIEW: [ComplaintStatus.RESOLVED],
        ComplaintStatus.RESOLVED: []
    }
    
    if new_status not in valid_transitions.get(old_status, []):
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid transition from {old_status} to {new_status}"
        )
        
    complaint.status = new_status
    if update_in.notes:
        complaint.municipal_notes = update_in.notes
        
    if new_status == ComplaintStatus.ACKNOWLEDGED:
        complaint.acknowledged_at = datetime.utcnow()
    elif new_status == ComplaintStatus.RESOLVED:
        complaint.resolved_at = datetime.utcnow()
        
    db.commit()
    db.refresh(complaint)
    
    return complaint
