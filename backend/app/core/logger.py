"""
Structured Logging Configuration for UrbanCore Backend.

Why it exists:
To provide a unified, highly configurable logging system across FastAPI, Uvicorn, Celery, and SQLAlchemy.
It outputs readable logs in development and structured JSON logs in production, enabling seamless
ingestion into centralized logging platforms (ELK, Loki) and future OpenTelemetry/Sentry integration.

Why its location was chosen:
`backend/app/core/` is for cross-cutting foundational infrastructure. Logging is required by every
layer (Domain, Service, Repository, API).

How it interacts with the rest of the project:
Applications call `configure_logging()` once at startup (e.g., in FastAPI lifespan or Celery init).
Modules retrieve loggers using `get_logger(__name__)`. The custom formatter automatically injects
the `request_id` context variable, which will be set by a future FastAPI middleware.
"""

import json
import logging
import sys
import contextvars
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from typing import Any, Dict

from app.core.config import settings

# Context variable to hold the correlation ID per request (async safe)
request_id_context: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="")

class StructuredJSONFormatter(logging.Formatter):
    """
    Custom JSON formatter adhering to standard Python logging.
    Outputs structured JSON for production environments.
    """
    def format(self, record: logging.LogRecord) -> str:
        # ISO 8601 timestamp with timezone
        timestamp = datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat()
        
        log_data: Dict[str, Any] = {
            "timestamp": timestamp,
            "level": record.levelname,
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "message": record.getMessage(),
        }

        # Inject request_id if available in context
        req_id = request_id_context.get()
        if req_id:
            log_data["request_id"] = req_id

        # Include any extra attributes passed via logging.info(..., extra={"key": "value"})
        if hasattr(record, "extra_data"):
            log_data["extra_data"] = record.extra_data
            
        # Format exception traceback if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)

class ReadableConsoleFormatter(logging.Formatter):
    """
    Readable format for local development.
    """
    def format(self, record: logging.LogRecord) -> str:
        timestamp = datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat()
        req_id = request_id_context.get()
        req_str = f" [{req_id}]" if req_id else ""
        
        log_message = f"{timestamp} | {record.levelname:^8} | {record.name}:{record.funcName}:{record.lineno}{req_str} - {record.getMessage()}"
        
        if record.exc_info:
            log_message += f"\n{self.formatException(record.exc_info)}"
            
        return log_message

def configure_logging() -> None:
    """
    Configures the root logger. Must be called once at application startup.
    Prevents duplicate handlers and sets the format based on the environment.
    """
    root_logger = logging.getLogger()
    
    # Prevent duplicate handlers if configure_logging is called multiple times
    if root_logger.hasHandlers():
        root_logger.handlers.clear()
        
    root_logger.setLevel(settings.LOG_LEVEL)

    # Determine formatter based on environment
    if settings.ENVIRONMENT == "prod":
        formatter: logging.Formatter = StructuredJSONFormatter()
    else:
        formatter = ReadableConsoleFormatter()

    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # Optional: Rotating File Handler
    # Creates a new file when size exceeds 10MB, keeping up to 5 backups.
    file_handler = RotatingFileHandler(
        filename="urbancore.log",
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)

    # Intercept Uvicorn and FastAPI default loggers to use our configuration
    for logger_name in ("uvicorn", "uvicorn.access", "uvicorn.error", "fastapi"):
        logger = logging.getLogger(logger_name)
        logger.handlers = []
        logger.propagate = True

def get_logger(name: str) -> logging.Logger:
    """
    Reusable logger getter. 
    Usage: logger = get_logger(__name__)
    """
    return logging.getLogger(name)
