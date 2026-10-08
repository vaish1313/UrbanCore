from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from .builder_service import get_builder_aois, get_builder_aoi_by_id, get_aois_near
from .terrain_service import get_builder_aoi_terrain
from .suitability_service import calculate_builder_aoi_suitability

router = APIRouter(tags=["Builder AOIs"])


@router.get("/aois")
async def list_builder_aois(
    search:   Optional[str] = Query(None, description="Search by name, village, or id (case-insensitive)"),
    category: Optional[str] = Query(None, description="Filter by category: residential|commercial|industrial|protected|highway|dam"),
    status:   Optional[str] = Query(None, description="Filter by status: green|yellow|red"),
    limit:    int           = Query(100, ge=1, le=100, description="Maximum AOIs to return"),
    offset:   int           = Query(0, ge=0, description="Pagination offset"),
):
    """
    List all Builder Dashboard AOIs stored in PostGIS.

    Supports optional filtering by search query, category, and status.
    Each AOI includes full geometry (GeoJSON Polygon), terrain metrics,
    constraint overlaps, scoring, and 5-year construction history.
    """
    aois = get_builder_aois(
        search=search,
        category=category,
        status=status,
        limit=limit,
        offset=offset,
    )
    return {"aois": aois, "count": len(aois)}


@router.get("/aois/{aoi_id}/terrain")
async def get_builder_aoi_terrain_endpoint(aoi_id: str):
    """Return DEM-derived terrain metrics for an existing Builder AOI."""
    terrain = get_builder_aoi_terrain(aoi_id)
    if terrain is None:
        # Preserve the distinction between an unknown AOI and an AOI that has
        # not yet been processed, without changing the existing AOI endpoint.
        if get_builder_aoi_by_id(aoi_id) is None:
            raise HTTPException(status_code=404, detail=f"AOI '{aoi_id}' not found")
        raise HTTPException(status_code=404, detail=f"Terrain metrics for AOI '{aoi_id}' not found")
    return terrain


@router.get("/aois/{aoi_id}/suitability")
async def get_builder_aoi_suitability_endpoint(aoi_id: str):
    """Return deterministic V1 GIS-based site screening suitability."""
    try:
        suitability = calculate_builder_aoi_suitability(aoi_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if suitability is None:
        raise HTTPException(status_code=404, detail=f"AOI '{aoi_id}' not found")
    return suitability


@router.get("/aois/{aoi_id}")
async def get_builder_aoi(aoi_id: str):
    """
    Get a single Builder AOI by its slug identifier.

    Returns the full AOI object including PostGIS geometry, all scoring
    metrics, environmental constraints, and construction history.
    """
    aoi = get_builder_aoi_by_id(aoi_id)
    if not aoi:
        raise HTTPException(status_code=404, detail=f"AOI '{aoi_id}' not found")
    return aoi


@router.get("/aois/compare/{aoi_id}")
async def compare_aoi_neighbourhood(
    aoi_id: str,
    limit: int = Query(4, ge=1, le=10, description="Number of spatial neighbours to return"),
):
    """
    Spatial neighbourhood comparison for an AOI.

    Returns the selected AOI and its `limit` nearest spatial neighbours
    ranked by PostGIS great-circle distance, with comparison metrics
    (suitability, flood zone, 5-year growth, slope) used by the
    AreaComparison component.

    Called by: frontend/src/components/urbancore/builder/AreaComparison.tsx
    URL: GET /api/v1/aois/compare/{aoi_id}
    """
    selected = get_builder_aoi_by_id(aoi_id)
    if not selected:
        raise HTTPException(status_code=404, detail=f"AOI '{aoi_id}' not found")

    neighbours = get_aois_near(aoi_id, limit=limit)

    # Derive comparison metrics from each AOI
    def to_comparison_item(aoi: dict, distance_km: float = 0.0, is_selected: bool = False) -> dict:
        history = aoi.get("constructionHistory", [])
        growth = history[-1]["builtUpChangePercent"] if history else 0.0
        return {
            "id":                         aoi["id"],
            "name":                       aoi["name"],
            "distance_km":                distance_km,
            "suitability_score":          aoi["suitabilityScore"],
            "flood_zone_percent":         aoi["constraints"]["floodZoneOverlapPercent"],
            "construction_growth_percent": round(growth, 1),
            "avg_slope":                  aoi["terrain"]["slope"],
            "elevation":                  aoi["terrain"]["elevation"],
            "is_selected":                is_selected,
        }

    selected_item = to_comparison_item(selected, distance_km=0.0, is_selected=True)
    nearest_items = [
        to_comparison_item(n, distance_km=n.get("distance_km", 0.0), is_selected=False)
        for n in neighbours
    ]

    # Generate factual observations
    all_items = [selected_item] + nearest_items
    flood_vals = [s["flood_zone_percent"] for s in all_items]
    growth_vals = [s["construction_growth_percent"] for s in all_items]

    observations = [
        f"Selected site ({selected['name']}) has a suitability score of {selected['suitabilityScore']}/100.",
        (f"Nearest spatial neighbour is {nearest_items[0]['name']} located "
         f"{nearest_items[0]['distance_km']} km away.") if nearest_items else "No nearby AOIs found.",
        (f"Flood zone overlap across the {len(all_items)} comparison sites ranges from "
         f"{min(flood_vals)}% to {max(flood_vals)}%."),
        (f"5-Year construction growth in this micro-region averages "
         f"{round(sum(growth_vals) / len(growth_vals))}%."),
    ]

    return {
        "selected_aoi": selected_item,
        "nearest_aois": nearest_items,
        "observations": observations,
    }
