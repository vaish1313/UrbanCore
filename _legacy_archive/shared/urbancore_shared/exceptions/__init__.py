"""
UrbanCore Exception Hierarchy

All custom exceptions inherit from UrbanCoreError.
This hierarchy allows callers to catch at any level of specificity.

Design: Each exception carries a human-readable message AND a machine-
readable code for API error responses. This prevents catch-and-re-wrap
patterns that lose context.
"""

from __future__ import annotations

from http import HTTPStatus


class UrbanCoreError(Exception):
    """
    Root exception for all UrbanCore domain errors.

    Usage:
        raise UrbanCoreError("Something went wrong", code="ERR_GENERIC")
    """
    http_status: int = HTTPStatus.INTERNAL_SERVER_ERROR

    def __init__(self, message: str, code: str = "ERR_INTERNAL") -> None:
        super().__init__(message)
        self.message = message
        self.code = code

    def to_dict(self) -> dict[str, str]:
        return {"error": self.code, "message": self.message}


# ─── Domain Errors ───────────────────────────────────────────

class ValidationError(UrbanCoreError):
    """Input validation failed (invalid geometry, missing epoch, etc.)."""
    http_status = HTTPStatus.UNPROCESSABLE_ENTITY

    def __init__(self, message: str, field: str | None = None) -> None:
        super().__init__(message, code="ERR_VALIDATION")
        self.field = field


class NotFoundError(UrbanCoreError):
    """Requested resource does not exist."""
    http_status = HTTPStatus.NOT_FOUND

    def __init__(self, resource: str, resource_id: str) -> None:
        super().__init__(
            f"{resource} with id '{resource_id}' not found.",
            code="ERR_NOT_FOUND",
        )
        self.resource = resource
        self.resource_id = resource_id


class AuthorizationError(UrbanCoreError):
    """User does not have permission to perform this action."""
    http_status = HTTPStatus.FORBIDDEN

    def __init__(self, action: str, required_role: str) -> None:
        super().__init__(
            f"Action '{action}' requires role '{required_role}'.",
            code="ERR_FORBIDDEN",
        )


class ConflictError(UrbanCoreError):
    """Resource already exists or state conflict."""
    http_status = HTTPStatus.CONFLICT

    def __init__(self, message: str) -> None:
        super().__init__(message, code="ERR_CONFLICT")


# ─── Infrastructure Errors ───────────────────────────────────

class InferenceError(UrbanCoreError):
    """AI model inference failed."""
    http_status = HTTPStatus.SERVICE_UNAVAILABLE

    def __init__(self, model: str, reason: str) -> None:
        super().__init__(
            f"Model '{model}' inference failed: {reason}",
            code="ERR_INFERENCE",
        )
        self.model = model
        self.reason = reason


class StorageError(UrbanCoreError):
    """Object storage (MinIO/S3) operation failed."""
    http_status = HTTPStatus.SERVICE_UNAVAILABLE

    def __init__(self, operation: str, bucket: str, key: str) -> None:
        super().__init__(
            f"Storage operation '{operation}' failed for {bucket}/{key}",
            code="ERR_STORAGE",
        )


class ImageryError(UrbanCoreError):
    """Satellite imagery fetch or processing failed."""
    http_status = HTTPStatus.BAD_GATEWAY

    def __init__(self, message: str) -> None:
        super().__init__(message, code="ERR_IMAGERY")


class GISProcessingError(UrbanCoreError):
    """GDAL/OGR or PostGIS spatial processing failed."""
    http_status = HTTPStatus.INTERNAL_SERVER_ERROR

    def __init__(self, operation: str, reason: str) -> None:
        super().__init__(
            f"GIS operation '{operation}' failed: {reason}",
            code="ERR_GIS_PROCESSING",
        )


class ComplianceCheckError(UrbanCoreError):
    """Compliance check could not be completed."""
    http_status = HTTPStatus.INTERNAL_SERVER_ERROR

    def __init__(self, reason: str) -> None:
        super().__init__(
            f"Compliance check failed: {reason}",
            code="ERR_COMPLIANCE_CHECK",
        )


class LLMError(UrbanCoreError):
    """LLM provider call failed."""
    http_status = HTTPStatus.SERVICE_UNAVAILABLE

    def __init__(self, provider: str, reason: str) -> None:
        super().__init__(
            f"LLM provider '{provider}' failed: {reason}",
            code="ERR_LLM",
        )
        self.provider = provider
