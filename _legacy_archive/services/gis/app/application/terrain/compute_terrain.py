"""
Use Case: DEM-Based Terrain Analysis

Computes slope, elevation statistics, roughness (TRI), and land suitability
from a Digital Elevation Model (SRTM/Copernicus) for a given AOI.

Algorithm:
1. Load DEM raster clipped to AOI bounding box (Rasterio)
2. Compute slope using GDAL DEMProcessing
3. Compute Terrain Ruggedness Index (TRI)
4. Derive elevation statistics
5. Score land suitability based on configurable slope thresholds
6. Store raster outputs in MinIO, stats in PostGIS

Suitability scoring:
- slope < suitable_deg AND roughness < threshold → highly_suitable
- slope < marginal_deg → suitable
- slope < unsuitable_deg → marginal
- slope >= unsuitable_deg → unsuitable
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from uuid import UUID

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class ComputeTerrainInput:
    job_id: UUID
    aoi: dict            # GeoJSON Polygon
    dem_source: str = "SRTM-30m"


@dataclass
class TerrainStats:
    elev_min_m: float
    elev_max_m: float
    elev_mean_m: float
    elev_std_m: float
    slope_min_deg: float
    slope_max_deg: float
    slope_mean_deg: float
    slope_std_deg: float
    roughness_mean: float
    roughness_max: float
    suitability_score: float
    suitability_class: str
    slope_raster_url: str | None = None
    hillshade_raster_url: str | None = None


@dataclass
class ComputeTerrainOutput:
    job_id: UUID
    terrain_stats: TerrainStats


class ComputeTerrainUseCase:
    """
    Orchestrates DEM processing and terrain suitability scoring.
    """

    def __init__(
        self,
        dem_loader: "IDEMLoader",
        terrain_processor: "ITerrainProcessor",
        storage: "IObjectStorage",
        terrain_repo: "ITerrainProfileRepository",
        slope_thresholds: dict[str, float],
    ) -> None:
        self._dem_loader = dem_loader
        self._terrain_processor = terrain_processor
        self._storage = storage
        self._terrain_repo = terrain_repo
        self._slope_thresholds = slope_thresholds

    async def execute(self, input_: ComputeTerrainInput) -> ComputeTerrainOutput:
        logger.info(
            "Starting terrain analysis",
            extra={"job_id": str(input_.job_id)},
        )

        # Load DEM raster for AOI
        dem_array, transform, crs = await self._dem_loader.load(
            aoi=input_.aoi,
            source=input_.dem_source,
        )

        # Compute derivatives
        slope_array = await self._terrain_processor.compute_slope(dem_array, transform)
        hillshade_array = await self._terrain_processor.compute_hillshade(dem_array, transform)
        roughness_array = await self._terrain_processor.compute_tri(dem_array)  # Terrain Ruggedness Index

        # Store rasters in MinIO
        slope_key = f"terrain/{input_.job_id}/slope.tif"
        hillshade_key = f"terrain/{input_.job_id}/hillshade.tif"

        slope_url = await self._storage.save_raster(slope_array, transform, crs, slope_key)
        hillshade_url = await self._storage.save_raster(hillshade_array, transform, crs, hillshade_key)

        # Compute statistics (ignoring nodata pixels)
        valid_elev = dem_array[dem_array != -9999]
        valid_slope = slope_array[slope_array >= 0]
        valid_rough = roughness_array[roughness_array >= 0]

        slope_mean = float(np.mean(valid_slope)) if len(valid_slope) > 0 else 0.0
        roughness_mean = float(np.mean(valid_rough)) if len(valid_rough) > 0 else 0.0

        suitability_score, suitability_class = self._score_suitability(
            slope_mean=slope_mean,
            roughness_mean=roughness_mean,
        )

        stats = TerrainStats(
            elev_min_m=float(np.min(valid_elev)) if len(valid_elev) > 0 else 0.0,
            elev_max_m=float(np.max(valid_elev)) if len(valid_elev) > 0 else 0.0,
            elev_mean_m=float(np.mean(valid_elev)) if len(valid_elev) > 0 else 0.0,
            elev_std_m=float(np.std(valid_elev)) if len(valid_elev) > 0 else 0.0,
            slope_min_deg=float(np.min(valid_slope)) if len(valid_slope) > 0 else 0.0,
            slope_max_deg=float(np.max(valid_slope)) if len(valid_slope) > 0 else 0.0,
            slope_mean_deg=slope_mean,
            slope_std_deg=float(np.std(valid_slope)) if len(valid_slope) > 0 else 0.0,
            roughness_mean=roughness_mean,
            roughness_max=float(np.max(valid_rough)) if len(valid_rough) > 0 else 0.0,
            suitability_score=suitability_score,
            suitability_class=suitability_class,
            slope_raster_url=slope_url,
            hillshade_raster_url=hillshade_url,
        )

        await self._terrain_repo.save(input_.job_id, input_.aoi, input_.dem_source, stats)

        logger.info(
            f"Terrain analysis complete: suitability={suitability_class} ({suitability_score:.2f})",
            extra={"job_id": str(input_.job_id)},
        )

        return ComputeTerrainOutput(job_id=input_.job_id, terrain_stats=stats)

    def _score_suitability(
        self, slope_mean: float, roughness_mean: float
    ) -> tuple[float, str]:
        """
        Score land suitability based on slope and roughness.

        Returns (score: float [0,1], class: str)
        """
        unsuitable = self._slope_thresholds.get("unsuitable", 30.0)
        marginal = self._slope_thresholds.get("marginal", 15.0)
        suitable = self._slope_thresholds.get("suitable", 8.0)

        if slope_mean >= unsuitable:
            return 0.1, "unsuitable"
        elif slope_mean >= marginal:
            return 0.4, "marginal"
        elif slope_mean >= suitable:
            return 0.7, "suitable"
        else:
            # Below 'suitable' threshold — scale score by roughness
            roughness_penalty = min(roughness_mean / 10.0, 0.2)
            return max(0.95 - roughness_penalty, 0.8), "highly_suitable"
