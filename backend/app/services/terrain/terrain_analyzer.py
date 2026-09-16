"""
Terrain analysis service using DEM data.
"""
import numpy as np
import rasterio
from scipy import ndimage
from typing import Dict, Tuple
from loguru import logger
from shapely.geometry import shape


class TerrainAnalyzer:
    """Analyze terrain characteristics from DEM data."""
    
    @staticmethod
    def analyze_terrain(
        dem_path: str,
        aoi_geometry: Dict
    ) -> Dict:
        """
        Perform comprehensive terrain analysis.
        
        Args:
            dem_path: Path to DEM file
            aoi_geometry: Area of interest geometry (GeoJSON)
        
        Returns:
            Dictionary with terrain analysis results
        """
        try:
            with rasterio.open(dem_path) as src:
                # Read elevation data
                elevation = src.read(1)
                transform = src.transform
                nodata = src.nodata
                
                # Mask nodata values
                if nodata is not None:
                    elevation = np.where(elevation == nodata, np.nan, elevation)
                
                # Calculate pixel size in meters
                pixel_size_x = abs(transform[0]) * 111320  # Approximate conversion to meters
                pixel_size_y = abs(transform[4]) * 111320
            
            # Calculate slope and aspect
            slope, aspect = TerrainAnalyzer._calculate_slope_aspect(
                elevation, pixel_size_x, pixel_size_y
            )
            
            # Calculate terrain ruggedness index
            tri = TerrainAnalyzer._calculate_tri(elevation)
            
            # Calculate elevation statistics
            elevation_stats = TerrainAnalyzer._calculate_statistics(elevation)
            
            # Calculate slope statistics
            slope_stats = TerrainAnalyzer._calculate_statistics(slope)
            
            # Calculate dominant aspect
            dominant_aspect = TerrainAnalyzer._calculate_dominant_aspect(aspect)
            
            # Calculate site difficulty score
            site_difficulty = TerrainAnalyzer._calculate_site_difficulty(
                elevation_stats, slope_stats, tri
            )
            
            return {
                'elevation': elevation_stats,
                'slope': slope_stats,
                'aspect': {
                    'dominant_deg': dominant_aspect,
                    'variability': float(np.nanstd(aspect))
                },
                'tri': float(np.nanmean(tri)),
                'site_difficulty_score': site_difficulty
            }
        
        except Exception as e:
            logger.error(f"Error analyzing terrain: {e}")
            raise
    
    @staticmethod
    def _calculate_slope_aspect(
        elevation: np.ndarray,
        pixel_size_x: float,
        pixel_size_y: float
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Calculate slope and aspect from elevation data.
        
        Args:
            elevation: Elevation array
            pixel_size_x: Pixel size in X direction (meters)
            pixel_size_y: Pixel size in Y direction (meters)
        
        Returns:
            Tuple of (slope in degrees, aspect in degrees)
        """
        # Calculate gradients
        dy, dx = np.gradient(elevation, pixel_size_y, pixel_size_x)
        
        # Calculate slope (in degrees)
        slope = np.arctan(np.sqrt(dx**2 + dy**2)) * 180 / np.pi
        
        # Calculate aspect (in degrees, 0-360)
        aspect = np.arctan2(-dx, dy) * 180 / np.pi
        aspect = np.where(aspect < 0, aspect + 360, aspect)
        
        return slope, aspect
    
    @staticmethod
    def _calculate_tri(elevation: np.ndarray) -> np.ndarray:
        """
        Calculate Terrain Ruggedness Index.
        
        Args:
            elevation: Elevation array
        
        Returns:
            TRI array
        """
        # Create 3x3 kernel for neighborhood calculation
        kernel = np.ones((3, 3))
        kernel[1, 1] = 0
        
        # Calculate sum of absolute differences with neighbors
        tri = np.zeros_like(elevation)
        
        for i in range(-1, 2):
            for j in range(-1, 2):
                if i == 0 and j == 0:
                    continue
                
                shifted = np.roll(np.roll(elevation, i, axis=0), j, axis=1)
                tri += np.abs(elevation - shifted)
        
        return tri
    
    @staticmethod
    def _calculate_statistics(data: np.ndarray) -> Dict:
        """
        Calculate statistics for data array.
        
        Args:
            data: Input array
        
        Returns:
            Dictionary with statistics
        """
        return {
            'min': float(np.nanmin(data)),
            'max': float(np.nanmax(data)),
            'mean': float(np.nanmean(data)),
            'std': float(np.nanstd(data)),
            'median': float(np.nanmedian(data)),
            'percentile_25': float(np.nanpercentile(data, 25)),
            'percentile_75': float(np.nanpercentile(data, 75))
        }
    
    @staticmethod
    def _calculate_dominant_aspect(aspect: np.ndarray) -> float:
        """
        Calculate dominant aspect direction.
        
        Args:
            aspect: Aspect array in degrees
        
        Returns:
            Dominant aspect in degrees
        """
        # Convert to radians
        aspect_rad = aspect * np.pi / 180
        
        # Calculate mean direction using circular statistics
        sin_sum = np.nansum(np.sin(aspect_rad))
        cos_sum = np.nansum(np.cos(aspect_rad))
        
        mean_aspect_rad = np.arctan2(sin_sum, cos_sum)
        mean_aspect_deg = mean_aspect_rad * 180 / np.pi
        
        if mean_aspect_deg < 0:
            mean_aspect_deg += 360
        
        return float(mean_aspect_deg)
    
    @staticmethod
    def _calculate_site_difficulty(
        elevation_stats: Dict,
        slope_stats: Dict,
        tri: float
    ) -> float:
        """
        Calculate site difficulty score (0-100, higher = more difficult).
        
        Args:
            elevation_stats: Elevation statistics
            slope_stats: Slope statistics
            tri: Terrain ruggedness index
        
        Returns:
            Site difficulty score
        """
        # Normalize components to 0-100 scale
        
        # Elevation variability (0-100)
        elev_range = elevation_stats['max'] - elevation_stats['min']
        elev_score = min(100, (elev_range / 500) * 100)  # 500m = max score
        
        # Slope difficulty (0-100)
        mean_slope = slope_stats['mean']
        slope_score = min(100, (mean_slope / 30) * 100)  # 30° = max score
        
        # Terrain ruggedness (0-100)
        tri_score = min(100, (tri / 100) * 100)  # 100 = max score
        
        # Weighted average
        difficulty = (
            elev_score * 0.3 +
            slope_score * 0.5 +
            tri_score * 0.2
        )
        
        return float(difficulty)
    
    @staticmethod
    def calculate_land_suitability(
        terrain_analysis: Dict,
        distance_to_road_m: float,
        distance_to_water_m: float,
        is_in_flood_zone: bool,
        is_in_protected_area: bool,
        distance_to_forest_m: float
    ) -> Dict:
        """
        Calculate land suitability score (0-100, higher = more suitable).
        
        Args:
            terrain_analysis: Terrain analysis results
            distance_to_road_m: Distance to nearest road
            distance_to_water_m: Distance to nearest water source
            is_in_flood_zone: Whether location is in flood zone
            is_in_protected_area: Whether location is in protected area
            distance_to_forest_m: Distance to nearest forest
        
        Returns:
            Dictionary with suitability score and breakdown
        """
        # Terrain suitability (inverse of difficulty)
        terrain_score = 100 - terrain_analysis['site_difficulty_score']
        
        # Accessibility score (based on road distance)
        if distance_to_road_m < 100:
            accessibility_score = 100
        elif distance_to_road_m < 500:
            accessibility_score = 80
        elif distance_to_road_m < 1000:
            accessibility_score = 60
        elif distance_to_road_m < 2000:
            accessibility_score = 40
        else:
            accessibility_score = 20
        
        # Water access score
        if distance_to_water_m < 500:
            water_score = 100
        elif distance_to_water_m < 1000:
            water_score = 80
        elif distance_to_water_m < 2000:
            water_score = 60
        else:
            water_score = 40
        
        # Environmental constraints
        env_score = 100
        if is_in_flood_zone:
            env_score -= 50
        if is_in_protected_area:
            env_score -= 50
        if distance_to_forest_m < 100:
            env_score -= 20
        env_score = max(0, env_score)
        
        # Slope constraint
        mean_slope = terrain_analysis['slope']['mean']
        if mean_slope > 20:
            slope_penalty = (mean_slope - 20) * 2
            slope_score = max(0, 100 - slope_penalty)
        else:
            slope_score = 100
        
        # Weighted final score
        final_score = (
            terrain_score * 0.25 +
            accessibility_score * 0.20 +
            water_score * 0.15 +
            env_score * 0.25 +
            slope_score * 0.15
        )
        
        return {
            'overall_score': float(final_score),
            'breakdown': {
                'terrain_suitability': float(terrain_score),
                'accessibility': float(accessibility_score),
                'water_access': float(water_score),
                'environmental_constraints': float(env_score),
                'slope_suitability': float(slope_score)
            },
            'rating': TerrainAnalyzer._get_suitability_rating(final_score)
        }
    
    @staticmethod
    def _get_suitability_rating(score: float) -> str:
        """Get textual rating for suitability score."""
        if score >= 80:
            return 'Excellent'
        elif score >= 60:
            return 'Good'
        elif score >= 40:
            return 'Moderate'
        elif score >= 20:
            return 'Poor'
        else:
            return 'Unsuitable'
