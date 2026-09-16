"""
Area of Interest (AOI) model.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry

from app.db.base_class import Base


class AOI(Base):
    """Area of Interest model."""
    
    __tablename__ = "aois"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String(255), nullable=False)
    
    # Geometry stored as PostGIS geometry
    geometry = Column(Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=False)
    
    # Bounding box
    bbox_west = Column(Float, nullable=False)
    bbox_south = Column(Float, nullable=False)
    bbox_east = Column(Float, nullable=False)
    bbox_north = Column(Float, nullable=False)
    
    # Area in square meters
    area_sqm = Column(Float, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="aois")
    
    def __repr__(self):
        return f"<AOI {self.name} ({self.area_sqm:.2f} m²)>"
