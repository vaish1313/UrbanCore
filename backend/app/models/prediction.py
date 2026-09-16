"""
Model prediction results.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class Prediction(Base):
    """AI model prediction result."""
    
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    image_id = Column(Integer, ForeignKey("satellite_images.id"), nullable=False)
    
    # Model information
    model_name = Column(String(100), nullable=False)  # e.g., "UNet"
    model_version = Column(String(50), nullable=False)
    
    # Prediction outputs
    prediction_mask_path = Column(String(512), nullable=False)
    confidence_map_path = Column(String(512), nullable=True)
    refined_mask_path = Column(String(512), nullable=True)  # After SAM refinement
    
    # Metrics
    confidence_score = Column(Float, nullable=True)
    num_buildings_detected = Column(Integer, nullable=False, default=0)
    total_building_area_sqm = Column(Float, nullable=True)
    
    # Processing time
    inference_time_seconds = Column(Float, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="predictions")
    image = relationship("SatelliteImage", back_populates="predictions")
    
    def __repr__(self):
        return f"<Prediction {self.model_name} - {self.num_buildings_detected} buildings>"
