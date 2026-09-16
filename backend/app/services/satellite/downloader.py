"""
Satellite imagery downloader using Google Earth Engine.
"""
import ee
import os
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from loguru import logger
import numpy as np
import rasterio
from rasterio.transform import from_bounds

from app.core.config import settings


class SatelliteDownloader:
    """Download satellite imagery from Google Earth Engine."""
    
    def __init__(self):
        """Initialize Google Earth Engine."""
        try:
            # Authenticate using service account
            if settings.GEE_PRIVATE_KEY_PATH and os.path.exists(settings.GEE_PRIVATE_KEY_PATH):
                credentials = ee.ServiceAccountCredentials(
                    settings.GEE_SERVICE_ACCOUNT_EMAIL,
                    settings.GEE_PRIVATE_KEY_PATH
                )
                ee.Initialize(credentials)
            else:
                # Try default authentication
                ee.Initialize()
            
            logger.info("Google Earth Engine initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Google Earth Engine: {e}")
            raise
    
    def download_sentinel2(
        self,
        bbox: Tuple[float, float, float, float],
        year: int,
        max_cloud_cover: float = 20.0,
        output_path: str = None
    ) -> Optional[Dict]:
        """
        Download Sentinel-2 imagery for a specific year.
        
        Args:
            bbox: Bounding box (west, south, east, north) in EPSG:4326
            year: Year to download
            max_cloud_cover: Maximum cloud coverage percentage
            output_path: Path to save the image
        
        Returns:
            Dictionary with image metadata and paths
        """
        try:
            west, south, east, north = bbox
            
            # Define area of interest
            aoi = ee.Geometry.Rectangle([west, south, east, north])
            
            # Date range for the year
            start_date = f"{year}-01-01"
            end_date = f"{year}-12-31"
            
            logger.info(f"Downloading Sentinel-2 for year {year}, bbox: {bbox}")
            
            # Get Sentinel-2 collection
            collection = (
                ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                .filterBounds(aoi)
                .filterDate(start_date, end_date)
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', max_cloud_cover))
            )
            
            # Check if collection is empty
            count = collection.size().getInfo()
            if count == 0:
                logger.warning(f"No images found for year {year} with cloud cover < {max_cloud_cover}%")
                return None
            
            logger.info(f"Found {count} images for year {year}")
            
            # Create cloud-free composite using median
            composite = collection.median().clip(aoi)
            
            # Select RGB and NIR bands
            rgb_nir = composite.select(['B4', 'B3', 'B2', 'B8'])  # Red, Green, Blue, NIR
            
            # Export to numpy array (for small areas)
            try:
                # For larger areas, use ee.batch.Export
                region = aoi.getInfo()['coordinates']
                
                # Calculate scale (resolution in meters)
                scale = 10  # Sentinel-2 10m resolution
                
                # Get the image as array
                lat_lon_img = rgb_nir.sampleRectangle(region=aoi, defaultValue=0)
                
                # Extract bands
                red = np.array(lat_lon_img.get('B4').getInfo())
                green = np.array(lat_lon_img.get('B3').getInfo())
                blue = np.array(lat_lon_img.get('B2').getInfo())
                nir = np.array(lat_lon_img.get('B8').getInfo())
                
                # Stack bands
                image_array = np.stack([red, green, blue, nir], axis=0)
                
                # Save to file if output path provided
                if output_path:
                    os.makedirs(os.path.dirname(output_path), exist_ok=True)
                    
                    # Save as GeoTIFF
                    height, width = red.shape
                    transform = from_bounds(west, south, east, north, width, height)
                    
                    with rasterio.open(
                        output_path,
                        'w',
                        driver='GTiff',
                        height=height,
                        width=width,
                        count=4,
                        dtype=image_array.dtype,
                        crs='EPSG:4326',
                        transform=transform,
                        compress='lzw'
                    ) as dst:
                        dst.write(image_array)
                    
                    logger.info(f"Saved image to {output_path}")
                
                # Calculate cloud coverage for the composite
                cloud_cover = self._calculate_cloud_coverage(collection)
                
                return {
                    'year': year,
                    'bbox': bbox,
                    'image_count': count,
                    'cloud_coverage': cloud_cover,
                    'output_path': output_path,
                    'bands': ['Red', 'Green', 'Blue', 'NIR'],
                    'resolution_m': scale,
                    'shape': image_array.shape
                }
            
            except Exception as e:
                logger.error(f"Error processing image data: {e}")
                # For large areas, use batch export
                return self._export_large_area(rgb_nir, aoi, year, output_path)
        
        except Exception as e:
            logger.error(f"Error downloading Sentinel-2 imagery: {e}")
            return None
    
    def _calculate_cloud_coverage(self, collection) -> float:
        """Calculate average cloud coverage for collection."""
        try:
            cloud_cover = collection.aggregate_mean('CLOUDY_PIXEL_PERCENTAGE').getInfo()
            return float(cloud_cover) if cloud_cover else 0.0
        except:
            return 0.0
    
    def _export_large_area(
        self,
        image: ee.Image,
        aoi: ee.Geometry,
        year: int,
        output_path: str
    ) -> Dict:
        """Export large area using Google Earth Engine batch export."""
        try:
            task = ee.batch.Export.image.toDrive(
                image=image,
                description=f'urbancore_sentinel2_{year}',
                folder='UrbanCore',
                fileNamePrefix=f'sentinel2_{year}',
                region=aoi,
                scale=10,
                maxPixels=1e13,
                fileFormat='GeoTIFF'
            )
            
            task.start()
            
            logger.info(f"Started batch export task for year {year}")
            logger.info("Check Google Drive for exported files")
            
            return {
                'year': year,
                'task_id': task.id,
                'status': 'exporting',
                'message': 'Image is being exported to Google Drive'
            }
        
        except Exception as e:
            logger.error(f"Error exporting large area: {e}")
            return None
    
    def download_multi_year(
        self,
        bbox: Tuple[float, float, float, float],
        years: List[int],
        output_dir: str,
        max_cloud_cover: float = 20.0
    ) -> List[Dict]:
        """
        Download imagery for multiple years.
        
        Args:
            bbox: Bounding box
            years: List of years
            output_dir: Output directory
            max_cloud_cover: Maximum cloud coverage
        
        Returns:
            List of download results
        """
        results = []
        
        for year in years:
            output_path = os.path.join(output_dir, f"sentinel2_{year}.tif")
            result = self.download_sentinel2(bbox, year, max_cloud_cover, output_path)
            
            if result:
                results.append(result)
        
        return results
    
    def download_dem(
        self,
        bbox: Tuple[float, float, float, float],
        output_path: str = None
    ) -> Optional[Dict]:
        """
        Download SRTM Digital Elevation Model.
        
        Args:
            bbox: Bounding box (west, south, east, north)
            output_path: Path to save the DEM
        
        Returns:
            Dictionary with DEM metadata
        """
        try:
            west, south, east, north = bbox
            aoi = ee.Geometry.Rectangle([west, south, east, north])
            
            logger.info(f"Downloading SRTM DEM for bbox: {bbox}")
            
            # Get SRTM DEM (30m resolution)
            dem = ee.Image('USGS/SRTMGL1_003').clip(aoi)
            
            # Get elevation band
            elevation = dem.select('elevation')
            
            # Export to numpy array
            lat_lon_dem = elevation.sampleRectangle(region=aoi, defaultValue=0)
            elevation_array = np.array(lat_lon_dem.get('elevation').getInfo())
            
            # Save to file if output path provided
            if output_path:
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                
                height, width = elevation_array.shape
                transform = from_bounds(west, south, east, north, width, height)
                
                with rasterio.open(
                    output_path,
                    'w',
                    driver='GTiff',
                    height=height,
                    width=width,
                    count=1,
                    dtype=elevation_array.dtype,
                    crs='EPSG:4326',
                    transform=transform,
                    compress='lzw'
                ) as dst:
                    dst.write(elevation_array, 1)
                
                logger.info(f"Saved DEM to {output_path}")
            
            return {
                'bbox': bbox,
                'output_path': output_path,
                'resolution_m': 30,
                'shape': elevation_array.shape,
                'min_elevation': float(np.min(elevation_array)),
                'max_elevation': float(np.max(elevation_array)),
                'mean_elevation': float(np.mean(elevation_array))
            }
        
        except Exception as e:
            logger.error(f"Error downloading DEM: {e}")
            return None
