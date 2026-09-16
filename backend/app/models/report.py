"""
Report generation model.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.db.base_class import Base


class ReportStatus(str, enum.Enum):
    """Report generation status."""
    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class ReportType(str, enum.Enum):
    """Report types."""
    DETECTION = "detection"
    VIOLATION = "violation"
    TERRAIN = "terrain"
    COMPREHENSIVE = "comprehensive"


class Report(Base):
    """Generated report."""
    
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Report details
    title = Column(String(255), nullable=False)
    report_type = Column(SQLEnum(ReportType), nullable=False)
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.PENDING, nullable=False)
    
    # Report content
    summary = Column(Text, nullable=True)
    
    # File paths
    pdf_path = Column(String(512), nullable=True)
    
    # Charts and maps
    chart_paths = Column(Text, nullable=True)  # JSON array of paths
    map_paths = Column(Text, nullable=True)  # JSON array of paths
    
    # Statistics (stored as JSON)
    statistics = Column(Text, nullable=True)
    
    # Generation time
    generation_time_seconds = Column(Integer, nullable=True)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="reports")
    created_by_user = relationship("User", back_populates="reports")
    
    def __repr__(self):
        return f"<Report {self.title} ({self.report_type}) - {self.status}>"
