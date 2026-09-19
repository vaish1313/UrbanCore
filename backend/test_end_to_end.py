import os
import torch
import numpy as np
import rasterio
from loguru import logger

def end_to_end_test():
    logger.info("=== 3. End-to-End Smoke Test (Direct Execution) ===")
    
    from app.services.satellite.downloader import SatelliteDownloader
    from app.services.detection.building_detector import BuildingDetector
    from app.services.detection.sam_detector import SAMRefiner
    
    # Tiny bbox in Nashik
    min_lat, max_lat = 19.990, 19.992
    min_lon, max_lon = 73.780, 73.782
    bbox = (min_lon, min_lat, max_lon, max_lat)
    years = [2022, 2023]
    
    temp_dir = "temp_smoke_test"
    os.makedirs(temp_dir, exist_ok=True)
    
    try:
        # 1. Download GEE
        logger.info("--- Downloading Imagery ---")
        downloader = SatelliteDownloader()
        results = downloader.download_multi_year(bbox, years, temp_dir)
        
        if not results or len(results) < 2:
            logger.error("Failed to download imagery for 2 years.")
            return
            
        path_2022 = results[0]['output_path']
        path_2023 = results[1]['output_path']
        
        with rasterio.open(path_2023) as src:
            img = src.read()
            bands, h, w = img.shape
            logger.info(f"Downloaded 2023 image dimensions: {h}x{w}")
            logger.info(f"Band count: {bands}")
            logger.info(f"Bands: {results[1]['bands']}")
            
        # 2. U-Net and Pre-screening
        logger.info("--- Running Building Detector ---")
        detector = BuildingDetector()
        mask_path = os.path.join(temp_dir, "mask_2023.tif")
        
        det_results = detector.detect_buildings(
            image_path=path_2023,
            output_mask_path=mask_path,
            prev_year_image_path=path_2022,
            confidence_threshold=0.5
        )
        
        num_buildings = det_results['num_buildings']
        logger.info(f"U-Net Extracted Buildings (GeoJSON features): {num_buildings}")
        
        # 3. SAM Refinement
        logger.info("--- Running SAM Refinement ---")
        sam_path = "ml_models/sam_vit_b_01ec64.pth"
        refiner = SAMRefiner(checkpoint_path=sam_path, model_type="vit_b")
        logger.info(f"SAM Load Status: {refiner.is_initialized}")
        
        if refiner.is_initialized and num_buildings > 0:
            refined = refiner.refine_buildings(path_2023, det_results['buildings'])
            logger.info(f"Refined features count: {len(refined)}")
        else:
            logger.info("Skipped SAM refinement due to zero buildings or missing checkpoint.")
            
    except Exception as e:
        logger.error(f"Smoke test failed: {e}")

if __name__ == '__main__':
    end_to_end_test()
