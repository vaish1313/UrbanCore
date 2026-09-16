"""
Violation detection models.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.db.base_class import Base


class ViolationSeverity(str, enum.Enum):
    """Violation severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ViolationType(Base):
    """Types of violations."""
    
    __tablename__ = "violation_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(50), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    severity = Column(SQLEnum(ViolationSeverity), default=ViolationSeverity.MEDIUM, nullable=False)
    
    # Buffer distance in meters (for spatial checks)
    buffer_distance_m = Column(Float, nullable=True)
    
    # Penalty information
    penalty_description = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    violations = relationship("Violation", back_populates="violation_type", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ViolationType {self.code}: {self.name}>"


class Violation(Base):
    """Detected violation."""
    
    __tablename__ = "violations"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=False)
    violation_type_id = Column(Integer, ForeignKey("violation_types.id"), nullable=False)
    
    # Violation details
    description = Column(Text, nullable=False)
    severity = Column(SQLEnum(ViolationSeverity), nullable=False)
    
    # Distance to violation zone (if applicable)
    distance_to_zone_m = Column(Float, nullable=True)
    
    # Overlap area with restricted zone
    overlap_area_sqm = Column(Float, nullable=True)
    overlap_percentage = Column(Float, nullable=True)
    
    # Evidence
    evidence_image_path = Column(String(512), nullable=True)
    evidence_map_path = Column(String(512), nullable=True)
    
    # Status
    is_confirmed = Column(Integer, default=0, nullable=False)  # Boolean as integer
    is_resolved = Column(Integer, default=0, nullable=False)  # Boolean as integer
    
    # Metadata
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    confirmed_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="violations")
    building = relationship("Building", back_populates="violations")
    violation_type = relationship("ViolationType", back_populates="violations")
    
    def __repr__(self):
        return f"<Violation {self.violation_type.code} - {self.severity}>"
