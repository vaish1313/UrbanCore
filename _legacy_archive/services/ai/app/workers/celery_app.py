"""
Celery Application Configuration — AI Service

Why Celery?
- GPU model inference can take 30-120 seconds
- A failed inference should NOT crash the API server
- Jobs need independent retries, dead-letter queues, and concurrency limits
- Workers can be scaled independently on GPU machines

Queue design:
- 'ai' queue: U-Net inference, SAM refinement (GPU-bound)
- All tasks use explicit queues to avoid routing conflicts with GIS/Intel workers
"""

from __future__ import annotations

import logging
from celery import Celery
from celery.signals import worker_ready, worker_shutdown
from app.core.config import get_config

logger = logging.getLogger(__name__)
config = get_config()

# ─── Celery App ──────────────────────────────────────────────
celery_app = Celery(
    "urbancore-ai",
    broker=config.celery_broker_url,
    backend=config.celery_result_backend,
)

celery_app.conf.update(
    # ─── Serialization ─────────────────────────────────────
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    # ─── Task Routing ──────────────────────────────────────
    task_routes={
        "app.workers.tasks.*": {"queue": "ai"},
    },
    task_default_queue="ai",

    # ─── Reliability ───────────────────────────────────────
    task_acks_late=True,          # Ack after completion (not before)
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1, # One task at a time per worker (GPU jobs are expensive)

    # ─── Timeouts ──────────────────────────────────────────
    task_soft_time_limit=600,     # 10 minutes soft limit (raises exception)
    task_time_limit=720,          # 12 minutes hard limit (kills worker)

    # ─── Results ───────────────────────────────────────────
    result_expires=86400,         # Keep results for 24h
    task_track_started=True,

    # ─── Retry defaults ────────────────────────────────────
    task_max_retries=3,
    task_default_retry_delay=60,  # 1 minute between retries
)


@worker_ready.connect
def on_worker_ready(**kwargs):  # type: ignore
    logger.info("🤖 UrbanCore AI Worker is ready")


@worker_shutdown.connect
def on_worker_shutdown(**kwargs):  # type: ignore
    logger.info("AI Worker shutting down")
