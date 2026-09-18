"""
Citizen-facing analyze endpoint.

POST /api/v1/citizen/analyze
  - Accepts a 2km x 2km bounding box + list of years
  - Checks the area_cache table first (shared across all users)
  - On cache miss: runs the full pipeline (satellite → indices → AI → zones)
  - On cache hit:  returns stored results immediately
  - Response includes per-year timeline + zone check + summary

The `from_cache` flag in each year entry tells the frontend whether the
result was computed fresh (false) or served from the shared cache (true).
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator, model_validator
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.area_cache import CacheStatus
from app.models.complaint import Complaint, ComplaintStatus
from app.schemas.complaint import ComplaintCreate, ComplaintResponse
from app.services.cache_service import (
    get_or_create_cache_entry,
    update_cache_entry,
    mark_processing,
    mark_failed,
)

router = APIRouter(prefix="/citizen", tags=["Citizen"])


# ── Request / Response schemas ────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    """Bounding box + year range for area analysis."""

    min_lat: float
    min_lon: float
    max_lat: float
    max_lon: float
    years: list[int] = [2021, 2022, 2023, 2024, 2025]

    @field_validator("years")
    @classmethod
    def validate_years(cls, v: list[int]) -> list[int]:
        for year in v:
            if year < 2021 or year > 2025:
                raise ValueError("Each year must be between 2021 and 2025")
        if len(v) == 0:
            raise ValueError("At least one year must be specified")
        return sorted(set(v))  # deduplicate and sort

    @model_validator(mode="after")
    def validate_bbox_size(self) -> "AnalyzeRequest":
        """
        Enforce approximately 2km x 2km bounding box.
          1° latitude  ≈ 111 km  →  2 km ≈ 0.018°
          Allowed range: 0.015° – 0.025° in both dimensions
        """
        lat_diff = self.max_lat - self.min_lat
        lon_diff = self.max_lon - self.min_lon

        if self.max_lat <= self.min_lat:
            raise ValueError("max_lat must be greater than min_lat")
        if self.max_lon <= self.min_lon:
            raise ValueError("max_lon must be greater than min_lon")

        if not (0.015 <= lat_diff <= 0.025):
            raise ValueError(
                f"Area height must be approximately 2km "
                f"(0.015–0.025 degrees latitude). Got {lat_diff:.4f}°"
            )
        if not (0.015 <= lon_diff <= 0.025):
            raise ValueError(
                f"Area width must be approximately 2km "
                f"(0.015–0.025 degrees longitude). Got {lon_diff:.4f}°"
            )
        return self


class YearResult(BaseModel):
    """Analysis result for a single year."""
    year: int
    built_up_pct: Optional[float]
    ndvi_mean: Optional[float]
    ndbi_mean: Optional[float]
    ndwi_mean: Optional[float]
    change_pct_from_prev_year: Optional[float]
    construction_detected: Optional[bool]
    mask_png_url: Optional[str]
    rgb_png_url: Optional[str]
    from_cache: bool
    status: str


class ZoneCheck(BaseModel):
    is_river_buffer: bool
    is_forest_boundary: bool
    is_crz_zone: bool
    is_green_belt: bool


class AnalysisSummary(BaseModel):
    total_change_2021_to_2025: Optional[float]
    any_violations: bool


class AnalyzeResponse(BaseModel):
    bbox: dict
    timeline: list[YearResult]
    zone_check: ZoneCheck
    summary: AnalysisSummary


# ── Mock pipeline (replace with real service calls) ───────────────────────

def _run_mock_pipeline(
    min_lat: float, min_lon: float,
    max_lat: float, max_lon: float,
    year: int,
) -> dict:
    """
    Placeholder pipeline — returns deterministic mock results.

    TODO: Replace with real service calls in this order:
      1. SatelliteDownloader.download(bbox, year)
      2. ImageProcessor.compute_indices(image)
      3. BuildingDetector.detect(image)         ← U-Net inference
      4. ViolationChecker.check_zones(bbox)
    """
    import hashlib

    # Produce stable-but-varied values per bbox+year (not random so tests are repeatable)
    seed = hashlib.md5(f"{min_lat}{min_lon}{year}".encode()).hexdigest()
    seed_int = int(seed[:8], 16)

    ndvi = round(0.20 + (seed_int % 40) / 100, 3)
    ndbi = round(0.05 + (seed_int % 25) / 100, 3)
    ndwi = round(-0.40 + (seed_int % 30) / 100, 3)
    built = round(30.0 + (seed_int % 50), 1)

    return {
        "ndvi_mean": ndvi,
        "ndbi_mean": ndbi,
        "ndwi_mean": ndwi,
        "built_up_pct": built,
        "construction_detected": built > 55.0,
        "is_river_buffer": False,
        "is_forest_boundary": False,
        "is_crz_zone": False,
        "is_green_belt": False,
        "zone_overlap_pct": 0.0,
    }


# ── Endpoint ──────────────────────────────────────────────────────────────

@router.post("/analyze", response_model=AnalyzeResponse, status_code=status.HTTP_200_OK)
def analyze_area(
    request: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Analyze a 2km x 2km area across one or more years.

    Cache behaviour:
      - `from_cache: false` → result was computed now (first ever request for this area+year)
      - `from_cache: true`  → result served from shared cache (instant, no pipeline cost)

    The cache is shared across ALL users — if another user already analyzed the
    same area+year, you get the result immediately regardless of who you are.
    """
    timeline: list[dict] = []
    last_entry = None

    for year in request.years:
        # ── Cache lookup ─────────────────────────────────────────────────
        cache_entry, is_new = get_or_create_cache_entry(
            db,
            request.min_lat, request.min_lon,
            request.max_lat, request.max_lon,
            year,
        )

        if is_new:
            # ── Cache MISS: run the full pipeline ─────────────────────────
            mark_processing(db, cache_entry.id)

            try:
                results = _run_mock_pipeline(
                    request.min_lat, request.min_lon,
                    request.max_lat, request.max_lon,
                    year,
                )
                cache_entry = update_cache_entry(db, cache_entry.id, results)

            except Exception as exc:
                mark_failed(db, cache_entry.id, str(exc))
                # Refresh the failed entry so we can report it in timeline
                db.refresh(cache_entry)

        last_entry = cache_entry

        timeline.append(
            YearResult(
                year=year,
                built_up_pct=cache_entry.built_up_pct,
                ndvi_mean=cache_entry.ndvi_mean,
                ndbi_mean=cache_entry.ndbi_mean,
                ndwi_mean=cache_entry.ndwi_mean,
                change_pct_from_prev_year=cache_entry.change_pct_from_prev_year,
                construction_detected=cache_entry.construction_detected,
                mask_png_url=cache_entry.mask_png_path,   # URL served separately via storage
                rgb_png_url=cache_entry.rgb_png_path,
                from_cache=not is_new,
                status=cache_entry.status.value if cache_entry.status else "UNKNOWN",
            )
        )

    # ── Build zone check from most recent year's entry ───────────────────
    zone = ZoneCheck(
        is_river_buffer=last_entry.is_river_buffer if last_entry else False,
        is_forest_boundary=last_entry.is_forest_boundary if last_entry else False,
        is_crz_zone=last_entry.is_crz_zone if last_entry else False,
        is_green_belt=last_entry.is_green_belt if last_entry else False,
    )

    any_violations = any([
        zone.is_river_buffer,
        zone.is_forest_boundary,
        zone.is_crz_zone,
        zone.is_green_belt,
    ])

    # ── Total change 2021→2025 (if both endpoints present in timeline) ───
    first_built = next(
        (t.built_up_pct for t in timeline if t.year == min(request.years) and t.built_up_pct is not None),
        None,
    )
    last_built = next(
        (t.built_up_pct for t in timeline if t.year == max(request.years) and t.built_up_pct is not None),
        None,
    )
    total_change = (
        round(last_built - first_built, 2)
        if first_built is not None and last_built is not None
        else None
    )

    return AnalyzeResponse(
        bbox={
            "min_lat": request.min_lat,
            "min_lon": request.min_lon,
            "max_lat": request.max_lat,
            "max_lon": request.max_lon,
        },
        timeline=timeline,
        zone_check=zone,
        summary=AnalysisSummary(
            total_change_2021_to_2025=total_change,
            any_violations=any_violations,
        ),
    )


# ── Cache status check endpoint ───────────────────────────────────────────

@router.get("/analyze/status", tags=["Citizen"])
def get_cache_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return cache hit stats (visible to any authenticated user)."""
    from app.services.cache_service import get_cache_stats
    return get_cache_stats(db)


# ── Citizen Complaints ────────────────────────────────────────────────────

@router.post("/complaint", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(
    complaint_in: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a citizen complaint."""
    complaint = Complaint(
        **complaint_in.model_dump(),
        submitted_by_id=current_user.id,
        status=ComplaintStatus.SUBMITTED
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint

@router.get("/my-complaints", response_model=list[ComplaintResponse])
def get_my_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all complaints submitted by the current user."""
    return db.query(Complaint).filter(Complaint.submitted_by_id == current_user.id).all()

@router.get("/complaint/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific complaint."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    if complaint.submitted_by_id != current_user.id and current_user.role != UserRole.MUNICIPAL_CORP:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    return complaint
