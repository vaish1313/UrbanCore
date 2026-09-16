"""
Satellite image model.
"""
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Date
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class SatelliteImage(Base):
    """Satellite image model."""
    
    __tablename__ = "satellite_images"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Image metadata
    satellite = Column(String(50), nullable=False)  # e.g., "Sentinel-2"
    acquisition_date = Column(Date, nullable=False)
    year = Column(Integer, nullable=False)
    
    # Cloud coverage percentage
    cloud_coverage = Column(Float, nullable=True)
    
    # File paths in S3
    raw_image_path = Column(String(512), nullable=False)
    processed_image_path = Column(String(512), nullable=True)
    
    # Index images
    ndvi_path = Column(String(512), nullable=True)
    ndbi_path = Column(String(512), nullable=True)
    ndwi_path = Column(String(512), nullable=True)
    
    # Processing status
    is_processed = Column(Integer, default=0, nullable=False)  # Boolean as integer
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="images")
    predictions = relationship("Prediction", back_populates="image", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<SatelliteImage {self.satellite} {self.acquisition_date} (Year {self.year})>"
