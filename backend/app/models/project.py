"""
Project model for managing analysis projects.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.db.base_class import Base


class ProjectStatus(str, enum.Enum):
    """Project status."""
    CREATED = "created"
    DOWNLOADING = "downloading"
    PROCESSING = "processing"
    DETECTING = "detecting"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"


class Project(Base):
    """Project model."""
    
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.CREATED, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Analysis parameters
    start_year = Column(Integer, nullable=True)
    end_year = Column(Integer, nullable=True)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    
    # Relationships

    owner = relationship("User", back_populates="projects")
    aois = relationship("AOI", back_populates="project", cascade="all, delete-orphan")
    images = relationship("SatelliteImage", back_populates="project", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="project", cascade="all, delete-orphan")
    buildings = relationship("Building", back_populates="project", cascade="all, delete-orphan")
    violations = relationship("Violation", back_populates="project", cascade="all, delete-orphan")
    terrain_analyses = relationship("TerrainAnalysis", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")
    job_logs = relationship("JobLog", back_populates="project", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Project {self.name} ({self.status})>"
