"""
Admin endpoints for RBAC testing.
"""
from fastapi import APIRouter, Depends
from backend.app.api.deps import require_role
from backend.app.db.models.user import User

router = APIRouter()

@router.get("/ping")
async def admin_ping(
    current_user: User = Depends(require_role("municipal_corp"))
):
    """
    GET /api/v1/admin/ping
    Requires municipal_corp role.
    """
    return {"message": "admin access confirmed", "user": current_user.email}
