"""
End-to-End Connectivity Test: Backend -> Service Account -> GEE -> Sentinel-2 -> Google Drive -> Local GeoTIFF
"""
import os
import sys
import time
import rasterio
from loguru import logger
from dotenv import load_dotenv

# Load env before importing settings
load_dotenv()

from app.core.config import settings
from app.services.satellite.downloader import SatelliteDownloader
from app.services.satellite.drive_manager import DriveManager
from app.services.detection.grid_utils import get_canonical_bbox

def run_connectivity_test():
    logger.info("Starting End-to-End Connectivity Test")
    
    # 1. Verify Configuration
    if not settings.GEE_PRIVATE_KEY_PATH or not os.path.exists(settings.GEE_PRIVATE_KEY_PATH):
        logger.error(f"CRITICAL: Service account JSON key not found at {settings.GEE_PRIVATE_KEY_PATH}")
        logger.error("Please provide the credentials file before running this test.")
        sys.exit(1)
        
    logger.info("Configuration verified.")
    
    # 2. Initialize Earth Engine and Drive Manager
    try:
        downloader = SatelliteDownloader()
        drive_manager = DriveManager()
        if drive_manager.service is None:
            logger.error("Drive Manager failed to initialize. Check credentials.")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Initialization failed: {e}")
        sys.exit(1)
        
    # 3. Use canonical 2 km x 2 km bbox (e.g. for a point in Nashik)
    test_lat, test_lon = 20.0059, 73.7912
    canonical_bbox = get_canonical_bbox(test_lat, test_lon)
    logger.info(f"Canonical 2km UTM Grid BBox: {canonical_bbox}")
    
    # 4. Run small Sentinel-2 test query (just one year to keep it fast)
    year = 2024
    
    # We will trigger the batch export manually here to test the exact pipeline flow
    import ee
    aoi = ee.Geometry.Rectangle(list(canonical_bbox))
    start_date = f"{year}-01-01"
    end_date = f"{year}-12-31"
    
    collection = (
        ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
        .filterBounds(aoi)
        .filterDate(start_date, end_date)
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20.0))
    )
    
    count = collection.size().getInfo()
    logger.info(f"Found {count} images in test query.")
    if count == 0:
        logger.error("No images found, cannot proceed with export.")
        sys.exit(1)
        
    composite = collection.median().clip(aoi)
    rgb_nir = composite.select(['B4', 'B3', 'B2', 'B8'])
    
    # 5. Export using GEE folder name
    file_prefix = f'test_sentinel2_{year}_{int(time.time())}'
    
    try:
        task = ee.batch.Export.image.toDrive(
            image=rgb_nir,
            description=file_prefix,
            folder=settings.GOOGLE_DRIVE_FOLDER_NAME,
            fileNamePrefix=file_prefix,
            region=aoi,
            scale=10,
            maxPixels=1e13,
            fileFormat='GeoTIFF'
        )
        task.start()
        logger.info(f"GEE Export Task started. Task ID: {task.id}")
    except Exception as e:
        logger.error(f"Failed to start GEE export: {e}")
        sys.exit(1)
        
    # 6. Monitor Earth Engine task
    while task.active():
        status = task.status()
        state = status.get('state')
        logger.info(f"GEE Task Status: {state}")
        time.sleep(10)
        
    final_status = task.status()
    final_state = final_status.get('state')
    logger.info(f"GEE Task reached terminal state: {final_state}")
    
    if final_state == 'FAILED':
        logger.error(f"Task failed with error: {final_status.get('error_message')}")
        sys.exit(1)
    elif final_state != 'COMPLETED':
        logger.error(f"Task did not complete. State: {final_state}")
        sys.exit(1)
        
    # 7. Use Drive API to locate exported file
    target_filename = f"{file_prefix}.tif"
    logger.info(f"Searching Drive API for {target_filename}...")
    
    # We will wait up to 5 minutes (Drive sync can take a moment)
    file_meta = drive_manager.wait_for_file(target_filename, timeout_seconds=300, poll_interval=10)
    
    if not file_meta:
        logger.error("File never appeared in Google Drive. Test failed.")
        sys.exit(1)
        
    # 8. Download file to local temporary directory
    local_temp_path = os.path.join(settings.TEMP_DIR, target_filename)
    success = drive_manager.download_file(file_meta['id'], local_temp_path)
    
    if not success:
        logger.error("Failed to download file from Drive.")
        sys.exit(1)
        
    # 9. Verify GeoTIFF with rasterio
    logger.info("Verifying downloaded GeoTIFF...")
    try:
        with rasterio.open(local_temp_path) as src:
            bands = src.count
            width, height = src.width, src.height
            logger.info(f"GeoTIFF Verified: {bands} bands, {width}x{height} dimensions.")
            assert bands == 4, f"Expected 4 bands (RGB + NIR), got {bands}"
            assert width > 0 and height > 0, "Image has invalid dimensions"
    except Exception as e:
        logger.error(f"GeoTIFF verification failed: {e}")
        # Clean up anyway before exiting
        drive_manager.delete_file(file_meta['id'])
        os.remove(local_temp_path)
        sys.exit(1)
        
    # 10. Delete temporary Drive file and local file
    logger.info("Cleaning up temporary files...")
    drive_manager.delete_file(file_meta['id'])
    os.remove(local_temp_path)
    logger.info("Cleanup successful.")
    
    logger.info("End-to-End Connectivity Test SUCCESSFUL!")

if __name__ == "__main__":
    run_connectivity_test()
