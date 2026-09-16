"""
Building and building change detection models.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
import enum

from app.db.base_class import Base


class BuildingStatus(str, enum.Enum):
    """Building status."""
    NEW = "new"
    EXISTING = "existing"
    REMOVED = "removed"
    EXPANDED = "expanded"


class Building(Base):
    """Detected building."""
    
    __tablename__ = "buildings"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Geometry
    geometry = Column(Geometry(geometry_type="POLYGON", srid=4326), nullable=False)
    centroid_lat = Column(Float, nullable=False)
    centroid_lon = Column(Float, nullable=False)
    
    # Building properties
    area_sqm = Column(Float, nullable=False)
    perimeter_m = Column(Float, nullable=True)
    
    # Detection information
    detected_year = Column(Integer, nullable=False)
    confidence = Column(Float, nullable=True)
    status = Column(SQLEnum(BuildingStatus), default=BuildingStatus.NEW, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="buildings")
    violations = relationship("Violation", back_populates="building", cascade="all, delete-orphan")
    changes = relationship("BuildingChange", back_populates="building", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Building {self.id} - {self.area_sqm:.2f} m² ({self.status})>"


class BuildingChange(Base):
    """Building change detection result."""
    
    __tablename__ = "building_changes"
    
    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=False)
    
    # Comparison years
    from_year = Column(Integer, nullable=False)
    to_year = Column(Integer, nullable=False)
    
    # Change type
    change_type = Column(String(50), nullable=False)  # 'new', 'removed', 'expanded', 'unchanged'
    
    # Change metrics
    area_change_sqm = Column(Float, nullable=True)
    area_change_percent = Column(Float, nullable=True)
    
    # Change geometry (for expansions)
    change_geometry = Column(Geometry(geometry_type="POLYGON", srid=4326), nullable=True)
    
    # Metadata
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    building = relationship("Building", back_populates="changes")
    
    def __repr__(self):
        return f"<BuildingChange {self.change_type} ({self.from_year}-{self.to_year})>"
