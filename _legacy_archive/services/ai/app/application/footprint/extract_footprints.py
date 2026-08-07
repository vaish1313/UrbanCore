"""
Use Case: Extract Building Footprints

Orchestrates the AI inference pipeline for a single imagery epoch:
1. Load preprocessed imagery from object storage
2. Run U-Net inference to generate binary mask
3. Vectorize mask to individual polygon footprints
4. Persist footprints to PostGIS

This is the Application Layer — it knows WHAT to do,
but delegates HOW to infrastructure adapters (injected as repositories).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from uuid import UUID

from app.domain.entities import Footprint
from app.domain.repositories import IFootprintRepository, IAnalysisJobRepository
from urbancore_shared.exceptions import InferenceError

logger = logging.getLogger(__name__)


@dataclass
class ExtractFootprintsInput:
    job_id: UUID
    epoch: str
    imagery_storage_key: str
    imagery_bucket: str
    model_version: str


@dataclass
class ExtractFootprintsOutput:
    footprints: list[Footprint]
    epoch: str
    total_detected: int
    confidence_mean: float


class ExtractFootprintsUseCase:
    """
    Orchestrates U-Net inference + vectorization for one imagery epoch.

    Dependencies are injected — this class has NO knowledge of
    PyTorch, PostGIS, or MinIO. It only knows about abstractions.
    """

    def __init__(
        self,
        job_repo: IAnalysisJobRepository,
        footprint_repo: IFootprintRepository,
        model_runner: "IModelRunner",    # Injected inference adapter
        storage: "IObjectStorage",       # Injected storage adapter
        event_publisher: "IEventPublisher",
    ) -> None:
        self._job_repo = job_repo
        self._footprint_repo = footprint_repo
        self._model_runner = model_runner
        self._storage = storage
        self._event_publisher = event_publisher

    async def execute(self, input_: ExtractFootprintsInput) -> ExtractFootprintsOutput:
        """
        Run U-Net inference and store footprints.

        Raises:
            InferenceError: If the model fails to run
            StorageError: If imagery cannot be loaded
        """
        logger.info(
            "Starting footprint extraction",
            extra={"job_id": str(input_.job_id), "epoch": input_.epoch},
        )

        # Update job progress
        await self._job_repo.update_status(
            input_.job_id, status="processing", progress=30,
        )

        # Load imagery from object storage
        imagery_array = await self._storage.load_numpy_array(
            bucket=input_.imagery_bucket,
            key=input_.imagery_storage_key,
        )

        # Run U-Net inference — returns list of (polygon_geojson, confidence)
        try:
            raw_predictions = await self._model_runner.run_unet(
                imagery=imagery_array,
                model_version=input_.model_version,
            )
        except Exception as e:
            raise InferenceError(model="UNet-ResNet34", reason=str(e)) from e

        logger.info(
            f"U-Net produced {len(raw_predictions)} raw predictions",
            extra={"job_id": str(input_.job_id)},
        )

        # Build domain Footprint entities
        footprints = [
            Footprint(
                job_id=input_.job_id,
                geometry=pred["geometry"],
                confidence=pred["confidence"],
                source_epoch=input_.epoch,
                model_version=input_.model_version,
                refined_by_sam=False,
            )
            for pred in raw_predictions
        ]

        # Persist to PostGIS
        saved = await self._footprint_repo.save_batch(footprints)

        # Compute summary statistics
        confidence_mean = (
            sum(f.confidence for f in saved) / len(saved) if saved else 0.0
        )

        await self._job_repo.update_status(
            input_.job_id, status="processing", progress=50,
        )

        return ExtractFootprintsOutput(
            footprints=saved,
            epoch=input_.epoch,
            total_detected=len(saved),
            confidence_mean=confidence_mean,
        )
