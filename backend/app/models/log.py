"""
System and job logging models.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.db.base_class import Base


class LogLevel(str, enum.Enum):
    """Log levels."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class JobStatus(str, enum.Enum):
    """Job execution status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class SystemLog(Base):
    """System-wide logs."""
    
    __tablename__ = "system_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Log details
    level = Column(SQLEnum(LogLevel), default=LogLevel.INFO, nullable=False)
    logger_name = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    
    # Context
    module = Column(String(100), nullable=True)
    function = Column(String(100), nullable=True)
    line_number = Column(Integer, nullable=True)
    
    # Additional data (JSON)
    extra_data = Column(Text, nullable=True)
    
    # Exception info
    exception_type = Column(String(100), nullable=True)
    exception_message = Column(Text, nullable=True)
    traceback = Column(Text, nullable=True)
    
    # Request context
    request_id = Column(String(100), nullable=True)
    user_id = Column(Integer, nullable=True)
    ip_address = Column(String(50), nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def __repr__(self):
        return f"<SystemLog {self.level}: {self.message[:50]}>"


class JobLog(Base):
    """Background job execution logs."""
    
    __tablename__ = "job_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    
    # Job identification
    job_id = Column(String(100), unique=True, nullable=False, index=True)
    job_name = Column(String(100), nullable=False)
    job_type = Column(String(50), nullable=False)  # 'satellite_download', 'detection', 'report', etc.
    
    # Status
    status = Column(SQLEnum(JobStatus), default=JobStatus.PENDING, nullable=False)
    
    # Progress tracking
    progress_percentage = Column(Integer, default=0, nullable=False)
    current_step = Column(String(255), nullable=True)
    total_steps = Column(Integer, nullable=True)
    
    # Result
    result = Column(Text, nullable=True)  # JSON result data
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    error_traceback = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    
    # Timing
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    
    # Worker info
    worker_name = Column(String(100), nullable=True)
    worker_pid = Column(Integer, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="job_logs")
    
    def __repr__(self):
        return f"<JobLog {self.job_name} ({self.job_type}) - {self.status}>"
