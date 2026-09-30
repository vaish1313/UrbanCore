from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from .municipal_service import get_municipal_cases, get_municipal_case_by_id, update_municipal_case_status

router = APIRouter(tags=["Municipal Compliance"])

class CaseStatusUpdate(BaseModel):
    status: str

@router.get("/cases")
async def list_cases(
    status: Optional[str] = Query(None, description="Filter by case status"),
    year: Optional[int] = Query(None, description="Filter by year detected"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List municipal compliance cases with pagination and filters."""
    cases = get_municipal_cases(status=status, year=year, limit=limit, offset=offset)
    return {"cases": cases, "count": len(cases)}

@router.get("/cases/{case_id}")
async def get_case(case_id: str):
    """Get detailed information about a specific municipal case."""
    case = get_municipal_case_by_id(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.patch("/cases/{case_id}/status")
async def update_case_status(case_id: str, update: CaseStatusUpdate):
    """Update the status of a municipal case."""
    try:
        success = update_municipal_case_status(case_id, update.status)
        if not success:
            raise HTTPException(status_code=404, detail="Case not found")
        return {"message": "Status updated successfully", "status": update.status}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
