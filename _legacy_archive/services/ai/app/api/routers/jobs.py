"""
AI Service — Internal Job API Router

Accepts job dispatch requests from the Gateway.
Enqueues Celery tasks and returns immediately (async by design).
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.workers.tasks import start_analysis_pipeline

router = APIRouter()


class StartJobRequest(BaseModel):
    jobId: str = Field(description="UUID of the job created by Gateway")
    userId: str
    userRole: str
    aoi: dict = Field(description="GeoJSON Polygon")
    epochs: list[str] = Field(min_length=1, max_length=5)
    generateReport: bool = True


class StartJobResponse(BaseModel):
    jobId: str
    taskId: str
    message: str


@router.post("/start", response_model=StartJobResponse, status_code=202)
async def start_job(request: StartJobRequest) -> StartJobResponse:
    """
    Dispatch an analysis pipeline Celery task.
    Returns immediately — job progress is communicated via Redis pub/sub → WebSocket.
    """
    # Dispatch to Celery — non-blocking
    task = start_analysis_pipeline.apply_async(
        kwargs={
            "job_id": request.jobId,
            "user_id": request.userId,
            "user_role": request.userRole,
            "aoi": request.aoi,
            "epochs": request.epochs,
            "generate_report": request.generateReport,
        },
        queue="ai",
    )

    return StartJobResponse(
        jobId=request.jobId,
        taskId=task.id,
        message="Analysis pipeline dispatched successfully",
    )
