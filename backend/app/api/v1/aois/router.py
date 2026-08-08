"""
AOIs Router Stub.
"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def aois_root():
    return {"message": "coming soon"}
