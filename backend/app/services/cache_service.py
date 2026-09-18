"""
Cache service — shared area result cache for the UrbanCore pipeline.

Design:
  - Cache key = (bbox_key, year) — unique per 2km x 2km cell per year
  - First request: creates a PENDING entry, runs pipeline, marks COMPLETED
  - All subsequent requests: cache hit — results returned instantly from DB
  - request_count is incremented on every hit for popularity tracking

Uses synchronous SQLAlchemy Session to match the rest of the codebase.
"""
from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.area_cache import AreaCache, CacheStatus


# ── Key generation ────────────────────────────────────────────────────────

def make_bbox_key(min_lat: float, min_lon: float, max_lat: float, max_lon: float) -> str:
    """
    Create a consistent, human-readable cache key from bounding box coordinates.

    Rounded to 4 decimal places (~11 m precision) so that minor floating-point
    differences don't produce phantom cache misses.

    Example: "19.9920_73.7730_20.0100_73.7920"
    """
    return (
        f"{min_lat:.4f}_{min_lon:.4f}_{max_lat:.4f}_{max_lon:.4f}"
    )


# ── Read ──────────────────────────────────────────────────────────────────

def get_cached_result(db: Session, bbox_key: str, year: int) -> AreaCache | None:
    """
    Look up a completed cache entry for the given area + year.

    Increments request_count on every cache hit so popular areas can be
    identified and pre-warmed in the future.

    Returns:
        AreaCache entry if status is COMPLETED, else None.
    """
    cached = (
        db.query(AreaCache)
        .filter(
            AreaCache.bbox_key == bbox_key,
            AreaCache.year == year,
            AreaCache.status == CacheStatus.COMPLETED,
        )
        .first()
    )

    if cached:
        cached.request_count += 1
        db.commit()
        db.refresh(cached)

    return cached


# ── Get-or-create ─────────────────────────────────────────────────────────

def get_or_create_cache_entry(
    db: Session,
    min_lat: float,
    min_lon: float,
    max_lat: float,
    max_lon: float,
    year: int,
) -> tuple[AreaCache, bool]:
    """
    Atomic get-or-create for a cache entry.

    Returns:
        (cache_entry, is_new)

        is_new = True  → entry was just created; caller MUST run the pipeline
                         and call update_cache_entry() with results.
        is_new = False → COMPLETED entry already exists; return it immediately.

    Note: Also checks for entries that are still PROCESSING (another worker
    is running the pipeline) and returns them with is_new=False so callers
    can return a "processing" status without double-running the pipeline.
    """
    bbox_key = make_bbox_key(min_lat, min_lon, max_lat, max_lon)

    # 1. Try to get a completed result first (fast path)
    completed = get_cached_result(db, bbox_key, year)
    if completed:
        return completed, False

    # 2. Check if another worker is already processing this area
    in_progress = (
        db.query(AreaCache)
        .filter(
            AreaCache.bbox_key == bbox_key,
            AreaCache.year == year,
            AreaCache.status.in_([CacheStatus.PENDING, CacheStatus.PROCESSING]),
        )
        .first()
    )
    if in_progress:
        return in_progress, False

    # 3. Create a new PENDING entry — this worker will run the pipeline
    new_entry = AreaCache(
        bbox_key=bbox_key,
        year=year,
        min_lat=min_lat,
        min_lon=min_lon,
        max_lat=max_lat,
        max_lon=max_lon,
        status=CacheStatus.PENDING,
        request_count=1,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry, True


# ── Write ─────────────────────────────────────────────────────────────────

def mark_processing(db: Session, cache_id: UUID) -> AreaCache:
    """
    Mark a cache entry as PROCESSING (pipeline has started).
    Call this immediately after get_or_create returns is_new=True.
    """
    entry = db.get(AreaCache, cache_id)
    if entry:
        entry.status = CacheStatus.PROCESSING
        db.commit()
        db.refresh(entry)
    return entry


def update_cache_entry(db: Session, cache_id: UUID, results: dict) -> AreaCache:
    """
    Write pipeline results into the cache entry and mark it COMPLETED.

    Args:
        db:        Sync DB session
        cache_id:  UUID primary key of the AreaCache row
        results:   Dict of field_name → value. Only keys that exist as
                   columns on AreaCache are applied (unknown keys silently ignored).

    Returns:
        Updated AreaCache entry.
    """
    entry = db.get(AreaCache, cache_id)
    if not entry:
        raise ValueError(f"AreaCache entry {cache_id} not found")

    for key, value in results.items():
        if hasattr(entry, key):
            setattr(entry, key, value)

    entry.status = CacheStatus.COMPLETED
    entry.processed_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)
    return entry


def mark_failed(db: Session, cache_id: UUID, error: str) -> AreaCache:
    """
    Mark a cache entry as FAILED with an error message.
    Call this in the exception handler of the pipeline.
    """
    entry = db.get(AreaCache, cache_id)
    if entry:
        entry.status = CacheStatus.FAILED
        entry.error_message = error
        db.commit()
        db.refresh(entry)
    return entry


# ── Stats helper ──────────────────────────────────────────────────────────

def get_cache_stats(db: Session) -> dict:
    """Return a summary of cache health for the admin dashboard."""
    total = db.query(AreaCache).count()
    completed = db.query(AreaCache).filter(AreaCache.status == CacheStatus.COMPLETED).count()
    pending = db.query(AreaCache).filter(AreaCache.status == CacheStatus.PENDING).count()
    processing = db.query(AreaCache).filter(AreaCache.status == CacheStatus.PROCESSING).count()
    failed = db.query(AreaCache).filter(AreaCache.status == CacheStatus.FAILED).count()

    return {
        "total_entries": total,
        "completed": completed,
        "pending": pending,
        "processing": processing,
        "failed": failed,
        "hit_rate_pct": round((completed / total * 100) if total > 0 else 0, 1),
    }
