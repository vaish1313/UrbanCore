"""
Celery Tasks — AI Service

Each task maps to one step in the AI analysis pipeline.
Tasks are intentionally small and single-responsibility.

Task chain for a full analysis job:
  fetch_imagery → preprocess_imagery → run_unet_inference
  → refine_with_sam → detect_changes → [trigger GIS service]

Why task chains instead of one mega-task?
- Each step is independently retryable
- Progress can be reported at each step via Redis pub/sub
- Failed steps don't force re-running successful expensive steps
"""

from __future__ import annotations

import logging
from uuid import UUID

from celery import current_task
from celery.exceptions import SoftTimeLimitExceeded

from app.workers.celery_app import celery_app
from app.core.config import get_config
from app.core.dependencies import get_dependencies  # DI container

logger = logging.getLogger(__name__)
config = get_config()


@celery_app.task(
    name="app.workers.tasks.start_analysis_pipeline",
    bind=True,
    max_retries=0,  # Orchestrator task — don't retry, sub-tasks handle retries
    queue="ai",
)
def start_analysis_pipeline(
    self,
    job_id: str,
    user_id: str,
    user_role: str,
    aoi: dict,
    epochs: list[str],
    generate_report: bool = True,
) -> dict:
    """
    Entry point for the full analysis pipeline.
    Orchestrates sub-tasks in a chain.
    """
    import asyncio
    from app.workers.pipeline import run_full_pipeline

    try:
        result = asyncio.run(
            run_full_pipeline(
                job_id=UUID(job_id),
                user_id=UUID(user_id),
                user_role=user_role,
                aoi=aoi,
                epochs=epochs,
                generate_report=generate_report,
            )
        )
        return result
    except SoftTimeLimitExceeded:
        logger.error(f"Pipeline soft time limit exceeded for job {job_id}")
        raise
    except Exception as exc:
        logger.exception(f"Pipeline failed for job {job_id}: {exc}")
        raise


@celery_app.task(
    name="app.workers.tasks.run_unet_inference",
    bind=True,
    max_retries=2,
    retry_backoff=True,
    queue="ai",
)
def run_unet_inference(self, job_id: str, epoch: str, storage_key: str) -> dict:
    """
    Run U-Net segmentation inference for a single epoch's imagery.
    Returns storage key of the output mask.
    """
    import asyncio
    from app.workers.inference_tasks import _run_unet_inference_async

    try:
        return asyncio.run(
            _run_unet_inference_async(
                job_id=UUID(job_id),
                epoch=epoch,
                storage_key=storage_key,
            )
        )
    except Exception as exc:
        logger.error(f"U-Net inference failed for job {job_id}, epoch {epoch}: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    name="app.workers.tasks.refine_with_sam",
    bind=True,
    max_retries=2,
    retry_backoff=True,
    queue="ai",
)
def refine_with_sam(self, job_id: str, epoch: str) -> dict:
    """
    Refine detected footprint boundaries using SAM (Segment Anything Model).
    Reads footprints from PostGIS, refines, writes back.
    """
    import asyncio
    from app.workers.inference_tasks import _refine_with_sam_async

    try:
        return asyncio.run(
            _refine_with_sam_async(job_id=UUID(job_id), epoch=epoch)
        )
    except Exception as exc:
        logger.error(f"SAM refinement failed for job {job_id}: {exc}")
        raise self.retry(exc=exc)
