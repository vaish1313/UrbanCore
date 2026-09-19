import os
import time
from loguru import logger
from typing import Optional

from app.db.session import SessionLocal
from app.services.cache_service import update_cache_entry, mark_failed
from app.services.satellite.downloader import SatelliteDownloader
from app.services.detection.building_detector import BuildingDetector
from app.services.detection.sam_detector import SAMRefiner
from app.services.detection.geojson_utils import format_as_geojson_feature_collection
from app.core.config import settings

def run_real_pipeline(
    cache_entry_id: str,
    min_lat: float, min_lon: float, 
    max_lat: float, max_lon: float,
    year: int
):
    """
    Run the full UrbanCore pipeline in the background.
    """
    db = SessionLocal()
    try:
        logger.info(f"Starting background pipeline for Cache Entry {cache_entry_id}, Year {year}")
        
        # 1. Download Satellite Imagery (10-band GEE stack)
        bbox = (min_lon, min_lat, max_lon, max_lat) # GEE uses (west, south, east, north)
        downloader = SatelliteDownloader()
        
        temp_dir = os.path.join(settings.TEMP_DIR, f"pipeline_{cache_entry_id}")
        os.makedirs(temp_dir, exist_ok=True)
        
        image_path = os.path.join(temp_dir, f"sentinel2_{year}.tif")
        prev_image_path = os.path.join(temp_dir, f"sentinel2_{year-1}.tif")
        
        # Download year T
        img_meta = downloader.download_sentinel2(bbox, year, output_path=image_path)
        if not img_meta:
            raise ValueError(f"Failed to download imagery for year {year}")
            
        # Download year T-1 for temporal pre-screening (if year > 2021)
        if year > 2021:
            downloader.download_sentinel2(bbox, year-1, output_path=prev_image_path)
        else:
            prev_image_path = None
            
        # 2. Run U-Net Detection with Temporal Pre-screening
        detector = BuildingDetector()
        mask_path = os.path.join(temp_dir, f"mask_{year}.tif")
        
        detection_results = detector.detect_buildings(
            image_path=image_path,
            output_mask_path=mask_path,
            prev_year_image_path=prev_image_path,
            confidence_threshold=0.5,
            min_area_sqm=25.0
        )
        
        # 3. Refine with SAM (if enabled)
        if settings.ENABLE_SAM:
            logger.info("SAM enabled: running refinement...")
            sam = SAMRefiner()
            if sam.is_initialized:
                final_buildings = sam.refine_buildings(image_path, detection_results['buildings'])
                refinement_type = "sam_refined"
            else:
                logger.warning("SAM enabled but failed to initialize. Falling back to U-Net only.")
                final_buildings = detection_results['buildings']
                refinement_type = "unet_only"
        else:
            logger.info("SAM disabled: returning U-Net only results.")
            final_buildings = detection_results['buildings']
            refinement_type = "unet_only"
        
        # Format to GeoJSON
        geojson_features = format_as_geojson_feature_collection(final_buildings, year)
        # Add metadata flag to distinguish between unet_only and sam_refined
        geojson_features["properties"] = geojson_features.get("properties", {})
        geojson_features["properties"]["refinement_type"] = refinement_type
        
        # Calculate statistics
        import numpy as np
        import rasterio
        
        with rasterio.open(image_path) as src:
            image_data = src.read()
            # 6=NDVI, 7=NDBI, 8=NDWI
            ndvi_mean = float(np.mean(image_data[6]))
            ndbi_mean = float(np.mean(image_data[7]))
            ndwi_mean = float(np.mean(image_data[8]))
            
        built_up_pct = min(100.0, (detection_results['total_area_sqm'] / (2000 * 2000)) * 100)
        
        results = {
            "ndvi_mean": ndvi_mean,
            "ndbi_mean": ndbi_mean,
            "ndwi_mean": ndwi_mean,
            "built_up_pct": built_up_pct,
            "construction_detected": built_up_pct > 0.1,  # Simple heuristic for now
            "is_river_buffer": False,
            "is_forest_boundary": False,
            "is_crz_zone": False,
            "is_green_belt": False,
            "zone_overlap_pct": 0.0,
            "geojson_features": geojson_features
        }
        
        # Update Cache Entry
        update_cache_entry(db, cache_entry_id, results)
        logger.info(f"Pipeline completed successfully for {cache_entry_id}")
        
    except Exception as exc:
        logger.error(f"Pipeline failed for {cache_entry_id}: {exc}")
        mark_failed(db, cache_entry_id, str(exc))
    finally:
        db.close()
