from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user
from backend.app.core.logger import get_logger
from backend.app.db.models.aoi import AOI, AOICategory
from backend.app.db.models.user import User
from backend.app.db.session import get_db
from backend.app.schemas.aoi import (
    AOIDetailResponse,
    AOIListResponse,
    ChangeResponse,
    ClassificationResponse,
    HotspotItem,
)

logger = get_logger(__name__)

router = APIRouter()
hotspots_router = APIRouter()


@router.get("", response_model=List[AOIListResponse])
async def list_aois(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> List[AOIListResponse]:
    """
    GET /api/v1/aois
    Public endpoint to list AOIs. Optionally filter by category.
    """
    stmt = select(AOI)
    
    if category:
        try:
            cat_enum = AOICategory(category.lower())
            stmt = stmt.where(AOI.category == cat_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid category '{category}'"
            )
            
    result = await db.execute(stmt)
    aois = result.scalars().all()
    
    return [
        AOIListResponse(
            id=aoi.id,
            aoi_id_code=aoi.aoi_id_code,
            name=aoi.name,
            category=aoi.category.value,
            min_lat=aoi.min_lat,
            min_lon=aoi.min_lon,
            max_lat=aoi.max_lat,
            max_lon=aoi.max_lon,
            latest_change_pct=None
        )
        for aoi in aois
    ]


@router.get("/{aoi_id_code}", response_model=AOIDetailResponse)
async def get_aoi(
    aoi_id_code: str,
    db: AsyncSession = Depends(get_db),
) -> AOIDetailResponse:
    """
    GET /api/v1/aois/{aoi_id_code}
    Public endpoint to get details of a specific AOI.
    """
    result = await db.execute(select(AOI).where(AOI.aoi_id_code == aoi_id_code))
    aoi = result.scalar_one_or_none()
    
    if not aoi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AOI with code '{aoi_id_code}' not found."
        )
        
    return AOIDetailResponse(
        id=aoi.id,
        aoi_id_code=aoi.aoi_id_code,
        name=aoi.name,
        category=aoi.category.value,
        min_lat=aoi.min_lat,
        min_lon=aoi.min_lon,
        max_lat=aoi.max_lat,
        max_lon=aoi.max_lon,
        latest_change_pct=None,
        years_available=[2021, 2022, 2023, 2024, 2025]
    )


@router.get("/{aoi_id_code}/classification", response_model=ClassificationResponse)
async def get_aoi_classification(
    aoi_id_code: str,
    year: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ClassificationResponse:
    """
    GET /api/v1/aois/{aoi_id_code}/classification
    Requires authentication. Returns mock response for U-Net inference.
    """
    result = await db.execute(select(AOI).where(AOI.aoi_id_code == aoi_id_code))
    aoi = result.scalar_one_or_none()
    
    if not aoi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AOI with code '{aoi_id_code}' not found."
        )
        
    return ClassificationResponse(
        aoi_id=aoi_id_code,
        year=year,
        mask_url=None,
        built_up_pct=None,
        status="pending_inference"
    )


@router.get("/{aoi_id_code}/change", response_model=ChangeResponse)
async def get_aoi_change(
    aoi_id_code: str,
    year_before: int = Query(...),
    year_after: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChangeResponse:
    """
    GET /api/v1/aois/{aoi_id_code}/change
    Requires authentication. Returns mock response for change detection.
    """
    result = await db.execute(select(AOI).where(AOI.aoi_id_code == aoi_id_code))
    aoi = result.scalar_one_or_none()
    
    if not aoi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AOI with code '{aoi_id_code}' not found."
        )
        
    return ChangeResponse(
        aoi_id=aoi_id_code,
        year_before=year_before,
        year_after=year_after,
        change_mask_url=None,
        change_pct=None,
        new_construction_area_sqm=None,
        status="pending_inference"
    )


@hotspots_router.get("", response_model=List[HotspotItem])
async def get_hotspots(
    year_before: int = Query(2021),
    year_after: int = Query(2025),
    limit: int = Query(10, ge=1),
    db: AsyncSession = Depends(get_db),
) -> List[HotspotItem]:
    """
    GET /api/v1/hotspots
    Public endpoint to return mock hotspots (top N AOIs by name).
    """
    stmt = select(AOI).order_by(AOI.name).limit(limit)
    result = await db.execute(stmt)
    aois = result.scalars().all()
    
    return [
        HotspotItem(
            aoi_id=aoi.aoi_id_code,
            name=aoi.name,
            change_pct=None
        )
        for aoi in aois
    ]
