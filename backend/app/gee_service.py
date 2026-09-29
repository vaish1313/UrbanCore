"""Google Earth Engine service for satellite imagery export."""
import os
from datetime import datetime
from pathlib import Path
import ee
from .config import settings


class EarthEngineService:
    """Handles Google Earth Engine operations for satellite imagery."""

    def __init__(self):
        self.initialized = False
        self._initialize()

    def _initialize(self):
        """Initialize Google Earth Engine with service account credentials."""
        if self.initialized:
            return

        if not settings.gee_service_account_email or not settings.gee_private_key_path:
            print("Warning: Google Earth Engine credentials are not configured")
            return

        key_path = Path(settings.gee_private_key_path)
        if not key_path.exists():
            print(f"Warning: GEE private key not found at: {settings.gee_private_key_path}")
            print("Google Earth Engine features will be disabled until credentials are configured.")
            return

        try:
            credentials = ee.ServiceAccountCredentials(
                settings.gee_service_account_email,
                str(key_path)
            )
            ee.Initialize(credentials)
            self.initialized = True
            # Keep startup logs ASCII-safe on Windows consoles using the
            # legacy charmap encoding.
            print("Google Earth Engine initialized successfully")
        except Exception as e:
            print(f"Warning: Could not initialize Google Earth Engine: {e}")
            print("GEE features will be disabled.")

    def export_imagery_to_drive(
        self,
        latitude: float,
        longitude: float,
        radius_m: int,
        start_year: int,
        end_year: int,
        analysis_id: str
    ) -> list[dict]:
        """
        Export Sentinel-2 imagery to Google Cloud Storage for multiple years.
        
        Service accounts cannot export to Drive, so we use GCS instead.
        
        Args:
            latitude: Center point latitude
            longitude: Center point longitude
            radius_m: Radius in meters (max 2000m = 2km)
            start_year: Starting year (inclusive)
            end_year: Ending year (inclusive)
            analysis_id: Unique analysis identifier
            
        Returns:
            List of export task information dictionaries
        """
        if not self.initialized:
            self._initialize()
            
        if not self.initialized:
            raise RuntimeError("Google Earth Engine is not initialized. Please configure GEE credentials.")

        # Create geometry centered on coordinates with specified radius
        point = ee.Geometry.Point([longitude, latitude])
        region = point.buffer(radius_m).bounds()

        exports = []
        bucket_name = settings.gcs_bucket_name

        # Export one image per year to GCS
        for year in range(start_year, end_year + 1):
            # Filter Sentinel-2 Surface Reflectance collection
            # Using harmonized dataset for consistency across years
            collection = (
                ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                .filterBounds(point)
                .filterDate(f"{year}-01-01", f"{year + 1}-01-01")
                .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
            )

            # Calculate median composite to reduce clouds
            # Select all required bands for U-Net model
            median = collection.median().clip(region)
            
            # Extract spectral bands
            B2 = median.select("B2")    # Blue
            B3 = median.select("B3")    # Green
            B4 = median.select("B4")    # Red
            B8 = median.select("B8")    # NIR
            B11 = median.select("B11")  # SWIR1
            B12 = median.select("B12")  # SWIR2
            
            # Calculate spectral indices
            # NDVI (Normalized Difference Vegetation Index)
            NDVI = B8.subtract(B4).divide(B8.add(B4)).rename("NDVI")
            
            # NDBI (Normalized Difference Built-up Index)
            NDBI = B11.subtract(B8).divide(B11.add(B8)).rename("NDBI")
            
            # NDWI (Normalized Difference Water Index)
            NDWI = B3.subtract(B8).divide(B3.add(B8)).rename("NDWI")
            
            # BSI (Bare Soil Index)
            BSI = (B11.add(B4)).subtract(B8.add(B2)).divide(
                (B11.add(B4)).add(B8.add(B2))
            ).rename("BSI")
            
            # Combine all bands and indices (10 channels total)
            image = B2.addBands([B3, B4, B8, B11, B12, NDVI, NDBI, NDWI, BSI])

            # Generate unique filename
            filename = f"urbancore_{analysis_id}_{year}"
            gcs_path = f"analyses/{analysis_id}/{filename}"

            # Create export task to Google Cloud Storage
            task = ee.batch.Export.image.toCloudStorage(
                image=image,
                description=filename,
                bucket=bucket_name,
                fileNamePrefix=gcs_path,
                region=region.coordinates().getInfo(),
                scale=10,  # 10m resolution for Sentinel-2
                maxPixels=1e9,
                fileFormat="GeoTIFF",
                formatOptions={"cloudOptimized": True}
            )

            # Start the export task
            task.start()

            exports.append({
                "year": year,
                "filename": f"{filename}.tif",
                "gee_task_id": task.id,
                "status": "submitted",
                "gcs_bucket": bucket_name,
                "gcs_path": f"{gcs_path}.tif"
            })

        return exports

    def check_task_status(self, task_id: str) -> dict:
        """
        Check the status of a Google Earth Engine export task.
        
        Args:
            task_id: The GEE task identifier
            
        Returns:
            Task status information
        """
        if not self.initialized:
            self._initialize()
            
        if not self.initialized:
            raise RuntimeError("Google Earth Engine is not initialized. Please configure GEE credentials.")

        tasks = ee.batch.Task.list()
        for task in tasks:
            if task.id == task_id:
                return {
                    "task_id": task.id,
                    "state": task.state,
                    "description": task.config.get("description", ""),
                    "progress": task.status().get("progress", 0)
                }

        return {"task_id": task_id, "state": "NOT_FOUND"}

    def check_all_tasks(self, task_ids: list[str]) -> dict:
        """
        Check status of multiple tasks at once.
        
        Args:
            task_ids: List of GEE task identifiers
            
        Returns:
            Dictionary mapping task_id to status info
        """
        if not self.initialized:
            self._initialize()
            
        if not self.initialized:
            raise RuntimeError("Google Earth Engine is not initialized. Please configure GEE credentials.")

        tasks = ee.batch.Task.list()
        task_map = {task.id: task for task in tasks}

        results = {}
        for task_id in task_ids:
            if task_id in task_map:
                task = task_map[task_id]
                results[task_id] = {
                    "state": task.state,
                    "description": task.config.get("description", ""),
                    "progress": task.status().get("progress", 0)
                }
            else:
                results[task_id] = {"state": "NOT_FOUND"}

        return results

# Singleton instance
gee_service = EarthEngineService()
