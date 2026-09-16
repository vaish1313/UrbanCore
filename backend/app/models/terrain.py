"""
Terrain analysis model.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry

from app.db.base_class import Base


class TerrainAnalysis(Base):
    """Terrain analysis results."""
    
    __tablename__ = "terrain_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Location
    geometry = Column(Geometry(geometry_type="POLYGON", srid=4326), nullable=False)
    centroid_lat = Column(Float, nullable=False)
    centroid_lon = Column(Float, nullable=False)
    
    # Elevation data
    min_elevation_m = Column(Float, nullable=False)
    max_elevation_m = Column(Float, nullable=False)
    mean_elevation_m = Column(Float, nullable=False)
    elevation_std_m = Column(Float, nullable=True)
    
    # Slope data (in degrees)
    min_slope_deg = Column(Float, nullable=False)
    max_slope_deg = Column(Float, nullable=False)
    mean_slope_deg = Column(Float, nullable=False)
    slope_std_deg = Column(Float, nullable=True)
    
    # Aspect data (in degrees, 0-360)
    dominant_aspect_deg = Column(Float, nullable=True)
    aspect_variability = Column(Float, nullable=True)
    
    # Terrain ruggedness index
    tri = Column(Float, nullable=True)
    
    # Site difficulty score (0-100, higher = more difficult)
    site_difficulty_score = Column(Float, nullable=True)
    
    # Land suitability score (0-100, higher = more suitable)
    land_suitability_score = Column(Float, nullable=True)
    
    # Distance to features (in meters)
    distance_to_road_m = Column(Float, nullable=True)
    distance_to_water_m = Column(Float, nullable=True)
    distance_to_forest_m = Column(Float, nullable=True)
    
    # Flood risk
    is_in_flood_zone = Column(Integer, default=0, nullable=False)  # Boolean as integer
    flood_risk_level = Column(String(20), nullable=True)  # 'low', 'medium', 'high'
    
    # Environmental restrictions
    is_in_protected_area = Column(Integer, default=0, nullable=False)
    is_in_crz = Column(Integer, default=0, nullable=False)  # Coastal Regulation Zone
    is_in_green_belt = Column(Integer, default=0, nullable=False)
    is_near_forest = Column(Integer, default=0, nullable=False)
    
    # DEM file path
    dem_path = Column(String(512), nullable=True)
    slope_map_path = Column(String(512), nullable=True)
    aspect_map_path = Column(String(512), nullable=True)
    
    # Suitability map
    suitability_map_path = Column(String(512), nullable=True)
    
    # Analysis notes
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="terrain_analyses")
    
    def __repr__(self):
        return f"<TerrainAnalysis elevation={self.mean_elevation_m:.1f}m, suitability={self.land_suitability_score:.1f}>"
