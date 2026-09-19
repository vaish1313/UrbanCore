"""
Segment Anything Model (SAM) integration for refining building boundaries.
"""
import torch
import numpy as np
import rasterio
import cv2
from typing import Dict, List, Optional
from loguru import logger
import os

from shapely.geometry import Polygon, shape
from segment_anything import sam_model_registry, SamPredictor

from app.core.config import settings

class SAMRefiner:
    """Refine U-Net building polygons using Segment Anything Model."""
    
    def __init__(self, checkpoint_path: Optional[str] = None, model_type: str = "vit_h"):
        """
        Initialize SAM predictor.
        
        Args:
            checkpoint_path: Path to SAM checkpoint
            model_type: SAM model type (vit_h, vit_l, vit_b)
        """
        self.device = torch.device(settings.DEVICE if torch.cuda.is_available() else 'cpu')
        self.checkpoint_path = checkpoint_path or settings.SAM_CHECKPOINT_PATH
        
        try:
            if os.path.exists(self.checkpoint_path):
                self.sam = sam_model_registry[model_type](checkpoint=self.checkpoint_path)
                self.sam.to(device=self.device)
                self.predictor = SamPredictor(self.sam)
                self.is_initialized = True
                logger.info(f"SAM Refiner initialized on {self.device}")
            else:
                self.is_initialized = False
                logger.warning(f"SAM checkpoint not found at {self.checkpoint_path}. SAM refinement will be skipped. Run download_sam.py to fetch it.")
        except Exception as e:
            self.is_initialized = False
            logger.error(f"Failed to initialize SAM: {e}")
            
    def refine_buildings(self, image_path: str, unet_buildings: List[Dict]) -> List[Dict]:
        """
        Refine building polygons using SAM.
        
        Args:
            image_path: Path to the 10-band image (we use bands 1,2,3 for RGB)
            unet_buildings: List of building dictionaries from U-Net detector
            
        Returns:
            Refined list of building dictionaries
        """
        if not self.is_initialized or not unet_buildings:
            return unet_buildings
            
        try:
            # Read RGB bands from the 10-band image
            # In our 10-band setup: B2, B3, B4 are indices 0, 1, 2
            # B4=Red(2), B3=Green(1), B2=Blue(0)
            with rasterio.open(image_path) as src:
                # Read as B4, B3, B2 for RGB
                r = src.read(3)
                g = src.read(2)
                b = src.read(1)
                
                transform = src.transform
                crs = src.crs
                
            # Create RGB image
            rgb_image = np.stack([r, g, b], axis=-1)
            
            # Normalize to 0-255 uint8 for SAM
            rgb_image = self._normalize_to_uint8(rgb_image)
            
            self.predictor.set_image(rgb_image)
            refined_buildings = []
            
            for bldg in unet_buildings:
                poly = shape(bldg['geometry'])
                if not poly.is_valid or poly.is_empty:
                    refined_buildings.append(bldg)
                    continue
                    
                # Get bounding box in geographic coordinates
                minx, miny, maxx, maxy = poly.bounds
                
                # Convert geographic bbox to pixel coordinates
                # row = ~y, col = ~x
                # Inverse transform
                inv_transform = ~transform
                col_min, row_max = inv_transform * (minx, miny)
                col_max, row_min = inv_transform * (maxx, maxy)
                
                # Format for SAM: [x0, y0, x1, y1] (pixel coordinates)
                input_box = np.array([
                    min(col_min, col_max), 
                    min(row_min, row_max), 
                    max(col_min, col_max), 
                    max(row_min, row_max)
                ])
                
                # Expand box slightly to give SAM context
                box_w = input_box[2] - input_box[0]
                box_h = input_box[3] - input_box[1]
                margin = max(2, int(max(box_w, box_h) * 0.1))
                
                input_box = np.array([
                    max(0, input_box[0] - margin),
                    max(0, input_box[1] - margin),
                    min(rgb_image.shape[1] - 1, input_box[2] + margin),
                    min(rgb_image.shape[0] - 1, input_box[3] + margin)
                ])
                
                masks, _, _ = self.predictor.predict(
                    point_coords=None,
                    point_labels=None,
                    box=input_box[None, :],
                    multimask_output=False,
                )
                
                if len(masks) > 0:
                    sam_mask = masks[0].astype(np.uint8)
                    # Convert mask to polygon
                    refined_poly = self._mask_to_polygon(sam_mask, transform, input_box)
                    if refined_poly:
                        refined_bldg = bldg.copy()
                        refined_bldg['geometry'] = {
                            'type': 'Polygon',
                            'coordinates': [list(refined_poly.exterior.coords)]
                        }
                        refined_bldg['area_sqm'] = refined_poly.area * 111320 * 111320
                        refined_buildings.append(refined_bldg)
                    else:
                        refined_buildings.append(bldg)
                else:
                    refined_buildings.append(bldg)
                    
            return refined_buildings
            
        except Exception as e:
            logger.error(f"Error during SAM refinement: {e}")
            return unet_buildings
            
    def _normalize_to_uint8(self, image: np.ndarray) -> np.ndarray:
        """Normalize raster image to 8-bit for SAM."""
        image = image.astype(np.float32)
        for i in range(3):
            # Same normalization logic as unet, but scaled to 255
            band = image[..., i]
            min_val = np.percentile(band, 2)
            max_val = np.percentile(band, 98)
            image[..., i] = np.clip((band - min_val) / (max_val - min_val + 1e-8) * 255.0, 0, 255)
        return image.astype(np.uint8)
        
    def _mask_to_polygon(self, mask: np.ndarray, transform, box) -> Optional[Polygon]:
        """Convert a boolean SAM mask back to a geographic polygon."""
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return None
            
        # Get the largest contour (likely the building)
        largest_contour = max(contours, key=cv2.contourArea)
        
        if len(largest_contour) < 4:
            return None
            
        epsilon = 0.01 * cv2.arcLength(largest_contour, True)
        approx = cv2.approxPolyDP(largest_contour, epsilon, True)
        
        coords = []
        for point in approx:
            x, y = point[0]
            # Convert pixel back to geo
            lon, lat = transform * (x, y)
            coords.append((lon, lat))
            
        if len(coords) < 4:
            return None
            
        if coords[0] != coords[-1]:
            coords.append(coords[0])
            
        try:
            poly = Polygon(coords)
            if not poly.is_valid:
                poly = poly.buffer(0)
            return poly if poly.is_valid and poly.area > 0 else None
        except:
            return None
