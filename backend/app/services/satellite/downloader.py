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
                ee.Initialize(credentials, project='final-year-project-501711')
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
        Download 10-band Sentinel-2 imagery for a specific year directly to a GeoTIFF.
        
        Args:
            bbox: Bounding box (west, south, east, north) in EPSG:4326
            year: Year to download
            max_cloud_cover: Maximum cloud coverage percentage
            output_path: Path to save the image
        
        Returns:
            Dictionary with image metadata and paths
        """
        import requests
        import zipfile
        import io

        try:
            west, south, east, north = bbox
            aoi = ee.Geometry.Rectangle([west, south, east, north])
            start_date = f"{year}-01-01"
            end_date = f"{year}-12-31"
            
            logger.info(f"Downloading 10-band Sentinel-2 for year {year}, bbox: {bbox}")
            
            collection = (
                ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                .filterBounds(aoi)
                .filterDate(start_date, end_date)
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', max_cloud_cover))
            )
            
            count = collection.size().getInfo()
            if count == 0:
                logger.warning(f"No images found for year {year} with cloud cover < {max_cloud_cover}%")
                return None
                
            logger.info(f"Found {count} images for year {year}")
            composite = collection.median().clip(aoi)
            
            # Select 6 base reflectance bands
            # Note: B2 (Blue), B3 (Green), B4 (Red), B8 (NIR), B11 (SWIR1), B12 (SWIR2)
            base_bands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12']
            base_img = composite.select(base_bands)
            
            # Calculate Spectral Indices
            ndvi = composite.normalizedDifference(['B8', 'B4']).rename('NDVI')
            ndbi = composite.normalizedDifference(['B11', 'B8']).rename('NDBI')
            ndwi = composite.normalizedDifference(['B3', 'B8']).rename('NDWI')
            
            # BSI: ((B11 + B4) - (B8 + B2)) / ((B11 + B4) + (B8 + B2))
            bsi = composite.expression(
                '((B11 + B4) - (B8 + B2)) / ((B11 + B4) + (B8 + B2))',
                {
                    'B11': composite.select('B11'),
                    'B4': composite.select('B4'),
                    'B8': composite.select('B8'),
                    'B2': composite.select('B2')
                }
            ).rename('BSI')
            
            # Combine into 10-band image and cast to float to prevent type mixing in TIFF export
            final_img = base_img.addBands([ndvi, ndbi, ndwi, bsi]).toFloat()
            
            if output_path:
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                
                # Use getDownloadURL for synchronous direct download (bypasses Google Drive)
                url = final_img.getDownloadURL({
                    'scale': 10,
                    'crs': 'EPSG:4326',
                    'region': aoi,
                    'format': 'GEO_TIFF'
                })
                
                logger.info(f"Downloading GeoTIFF from {url}")
                response = requests.get(url, timeout=120)
                response.raise_for_status()
                
                # Check if GEE returned a ZIP (default behavior for GEO_TIFF format in python API)
                if response.content[:4] == b'PK\x03\x04':
                    with zipfile.ZipFile(io.BytesIO(response.content)) as z:
                        # Extract the first .tif file found in the archive
                        tif_name = next(n for n in z.namelist() if n.endswith('.tif'))
                        with open(output_path, 'wb') as f:
                            f.write(z.read(tif_name))
                else:
                    # It's a direct TIFF
                    with open(output_path, 'wb') as f:
                        f.write(response.content)
                        
                logger.info(f"Saved 10-band image to {output_path}")

            cloud_cover = self._calculate_cloud_coverage(collection)
            
            return {
                'year': year,
                'bbox': bbox,
                'image_count': count,
                'cloud_coverage': cloud_cover,
                'output_path': output_path,
                'bands': base_bands + ['NDVI', 'NDBI', 'NDWI', 'BSI'],
                'resolution_m': 10
            }
            
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
        """
        try:
            west, south, east, north = bbox
            aoi = ee.Geometry.Rectangle([west, south, east, north])
            
            logger.info(f"Downloading SRTM DEM for bbox: {bbox}")
            
            dem = ee.Image('USGS/SRTMGL1_003').clip(aoi)
            elevation = dem.select('elevation')
            
            if output_path:
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                
                url = elevation.getDownloadURL({
                    'scale': 30,
                    'crs': 'EPSG:4326',
                    'region': aoi,
                    'format': 'GEO_TIFF'
                })
                
                import requests
                import zipfile
                import io
                
                response = requests.get(url, timeout=120)
                response.raise_for_status()
                
                if response.content[:4] == b'PK\x03\x04':
                    with zipfile.ZipFile(io.BytesIO(response.content)) as z:
                        tif_name = next(n for n in z.namelist() if n.endswith('.tif'))
                        with open(output_path, 'wb') as f:
                            f.write(z.read(tif_name))
                else:
                    with open(output_path, 'wb') as f:
                        f.write(response.content)
                        
                logger.info(f"Saved DEM to {output_path}")
            
            # Since getDownloadURL doesn't easily expose the min/max unless we do a reducer,
            # we can run a quick reduceRegion for metadata if needed.
            stats = elevation.reduceRegion(
                reducer=ee.Reducer.minMax().combine(ee.Reducer.mean(), sharedInputs=True),
                geometry=aoi,
                scale=30
            ).getInfo()
            
            return {
                'bbox': bbox,
                'output_path': output_path,
                'resolution_m': 30,
                'min_elevation': stats.get('elevation_min', 0.0),
                'max_elevation': stats.get('elevation_max', 0.0),
                'mean_elevation': stats.get('elevation_mean', 0.0)
            }
        
        except Exception as e:
            logger.error(f"Error downloading DEM: {e}")
            return None
