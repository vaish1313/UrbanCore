"""
Building detection service using U-Net model.
"""
import torch
import numpy as np
import rasterio
from typing import Dict, List, Tuple, Optional
from loguru import logger
import cv2
from skimage import measure
from shapely.geometry import Polygon, shape
from shapely.ops import unary_union
import os

from ai.models.unet import get_unet_model
from app.core.config import settings


class BuildingDetector:
    """Detect buildings from satellite imagery using U-Net."""
    
    def __init__(self, checkpoint_path: Optional[str] = None):
        """
        Initialize building detector.
        
        Args:
            checkpoint_path: Path to model checkpoint
        """
        self.device = torch.device(settings.DEVICE if torch.cuda.is_available() else 'cpu')
        self.checkpoint_path = checkpoint_path or getattr(settings, 'UNET_CHECKPOINT_PATH', None) or "ml_models/best_unet_urbancore.pth"
        
        # Load model
        self.model = get_unet_model(
            n_channels=10,
            n_classes=1,
            pretrained=True,
            checkpoint_path=self.checkpoint_path
        )
        self.model = self.model.to(self.device)
        self.model.eval()
        
        logger.info(f"Building detector initialized on {self.device} with 10 channels")
    
    def detect_buildings(
        self,
        image_path: str,
        output_mask_path: str,
        prev_year_image_path: Optional[str] = None,
        confidence_threshold: float = 0.5,
        min_area_sqm: float = 25.0
    ) -> Dict:
        """
        Detect buildings in a 10-band satellite image using sliding window and temporal pre-screening.
        """
        try:
            # Read 10-band image
            with rasterio.open(image_path) as src:
                image = src.read()
                meta = src.meta.copy()
                transform = src.transform
                crs = src.crs
            
            orig_h, orig_w = image.shape[1], image.shape[2]
            
            # 1. Temporal pre-screening mask
            # Using strict sign test as per paper: NDBI↑ & NDVI↓ & NDWI↓
            if prev_year_image_path and os.path.exists(prev_year_image_path):
                with rasterio.open(prev_year_image_path) as prev_src:
                    prev_image = prev_src.read()
                    
                    delta_ndvi = image[6] - prev_image[6]
                    delta_ndbi = image[7] - prev_image[7]
                    delta_ndwi = image[8] - prev_image[8]
                    
                    change_mask = (delta_ndbi > 0) & (delta_ndvi < 0) & (delta_ndwi < 0)
            else:
                change_mask = np.ones((orig_h, orig_w), dtype=bool)
            
            # Normalize image
            image = self._normalize_image(image)
            image_tensor = torch.from_numpy(image).float().unsqueeze(0).to(self.device)
            
            # 2. Pad to 208x208
            pad_h = max(0, 208 - orig_h)
            pad_w = max(0, 208 - orig_w)
            
            pad_left = pad_w // 2
            pad_right = pad_w - pad_left
            pad_top = pad_h // 2
            pad_bottom = pad_h - pad_top
            
            import torch.nn.functional as F
            padded_tensor = F.pad(image_tensor, (pad_left, pad_right, pad_top, pad_bottom), mode='reflect')
            
            # Pad change_mask similarly (with False so we don't predict on padded regions)
            padded_change_mask = np.pad(
                change_mask, 
                ((pad_top, pad_bottom), (pad_left, pad_right)), 
                mode='constant', 
                constant_values=False
            )
            
            # 3. Sliding window inference (64x64, stride 16)
            patch_size = 64
            stride = 16
            
            h_padded = padded_tensor.shape[2]
            w_padded = padded_tensor.shape[3]
            
            prediction_accumulator = np.zeros((h_padded, w_padded), dtype=np.float32)
            count_accumulator = np.zeros((h_padded, w_padded), dtype=np.float32)
            
            with torch.no_grad():
                for y in range(0, h_padded - patch_size + 1, stride):
                    for x in range(0, w_padded - patch_size + 1, stride):
                        # Pre-screening: Check if the patch has any valid changed pixels
                        mask_patch = padded_change_mask[y:y+patch_size, x:x+patch_size]
                        if not mask_patch.any():
                            # Skip U-Net inference completely to save computation
                            continue
                            
                        patch = padded_tensor[:, :, y:y+patch_size, x:x+patch_size]
                        output = self.model.predict(patch)
                        pred_patch = output.squeeze().cpu().numpy()
                        
                        prediction_accumulator[y:y+patch_size, x:x+patch_size] += pred_patch
                        count_accumulator[y:y+patch_size, x:x+patch_size] += 1
            
            # Average predictions
            # Avoid division by zero
            count_accumulator[count_accumulator == 0] = 1.0
            prediction_padded = prediction_accumulator / count_accumulator
            
            # 4. Crop back to original size
            prediction = prediction_padded[pad_top:pad_top+orig_h, pad_left:pad_left+orig_w]
            
            # Apply threshold
            binary_mask = (prediction > confidence_threshold).astype(np.uint8)
            
            # Post-process mask
            binary_mask = self._post_process_mask(binary_mask, min_area_sqm, transform)
            
            # Save mask
            os.makedirs(os.path.dirname(output_mask_path), exist_ok=True)
            meta.update({
                'count': 1,
                'dtype': 'uint8',
                'compress': 'lzw'
            })
            
            with rasterio.open(output_mask_path, 'w', **meta) as dst:
                dst.write(binary_mask, 1)
            
            # Extract building polygons
            buildings = self._extract_buildings(binary_mask, transform, crs)
            
            # Calculate statistics
            num_buildings = len(buildings)
            total_area = sum(b['area_sqm'] for b in buildings)
            avg_confidence = float(np.mean(prediction[binary_mask > 0])) if np.any(binary_mask > 0) else 0.0
            
            logger.info(f"Detected {num_buildings} buildings, total area: {total_area:.2f} m²")
            
            return {
                'num_buildings': num_buildings,
                'total_area_sqm': total_area,
                'buildings': buildings,
                'mask_path': output_mask_path,
                'avg_confidence': avg_confidence
            }
        
        except Exception as e:
            logger.error(f"Error detecting buildings: {e}")
            raise
    
    def _normalize_image(self, image: np.ndarray) -> np.ndarray:
        """Normalize 10-band image."""
        image = image.astype(np.float32)
        
        # Bands 0-5 are Reflectance (B2, B3, B4, B8, B11, B12)
        # Sentinel-2 L2A reflectance is usually 0-10000. 
        for i in range(6):
            image[i] = np.clip(image[i] / 10000.0, 0, 1)
            
        # Bands 6-9 are Indices (NDVI, NDBI, NDWI, BSI) which are already in [-1, 1] range.
        # We can leave them as is, or clip them just in case of outliers.
        for i in range(6, 10):
            image[i] = np.clip(image[i], -1.0, 1.0)
            
        return image
    
    def _post_process_mask(
        self,
        mask: np.ndarray,
        min_area_sqm: float,
        transform
    ) -> np.ndarray:
        """
        Post-process binary mask.
        
        Args:
            mask: Binary mask
            min_area_sqm: Minimum area threshold
            transform: Rasterio transform
        
        Returns:
            Cleaned mask
        """
        # Morphological operations
        kernel = np.ones((3, 3), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
        
        # Remove small objects
        labeled = measure.label(mask, connectivity=2)
        props = measure.regionprops(labeled)
        
        # Calculate pixel area in square meters
        pixel_size_x = abs(transform[0])
        pixel_size_y = abs(transform[4])
        pixel_area_sqm = pixel_size_x * pixel_size_y * 111320 * 111320  # Approximate conversion
        
        cleaned_mask = np.zeros_like(mask)
        for prop in props:
            area_sqm = prop.area * pixel_area_sqm
            if area_sqm >= min_area_sqm:
                cleaned_mask[labeled == prop.label] = 1
        
        return cleaned_mask
    
    def _extract_buildings(
        self,
        mask: np.ndarray,
        transform,
        crs
    ) -> List[Dict]:
        """
        Extract building polygons from mask.
        
        Args:
            mask: Binary mask
            transform: Rasterio transform
            crs: Coordinate reference system
        
        Returns:
            List of building dictionaries
        """
        buildings = []
        
        # Find contours
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            if len(contour) < 4:
                continue
            
            # Simplify contour
            epsilon = 0.01 * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)
            
            # Convert pixel coordinates to geographic coordinates
            coords = []
            for point in approx:
                x, y = point[0]
                lon, lat = transform * (x, y)
                coords.append([lon, lat])
            
            if len(coords) < 4:
                continue
            
            # Close polygon
            if coords[0] != coords[-1]:
                coords.append(coords[0])
            
            # Create polygon
            try:
                polygon = Polygon(coords)
                
                if not polygon.is_valid:
                    polygon = polygon.buffer(0)
                
                if polygon.is_valid and polygon.area > 0:
                    # Calculate area in square meters (approximate)
                    area_sqm = polygon.area * 111320 * 111320
                    
                    # Calculate centroid
                    centroid = polygon.centroid
                    
                    buildings.append({
                        'geometry': {
                            'type': 'Polygon',
                            'coordinates': [coords]
                        },
                        'area_sqm': area_sqm,
                        'centroid_lat': centroid.y,
                        'centroid_lon': centroid.x,
                        'perimeter_m': polygon.length * 111320
                    })
            except Exception as e:
                logger.warning(f"Error creating polygon: {e}")
                continue
        
        return buildings


class ChangeDetector:
    """Detect changes between multi-temporal building detections."""
    
    @staticmethod
    def detect_changes(
        buildings_t1: List[Dict],
        buildings_t2: List[Dict],
        year_t1: int,
        year_t2: int,
        iou_threshold: float = 0.3
    ) -> Dict:
        """
        Detect changes between two sets of buildings.
        
        Args:
            buildings_t1: Buildings from time 1
            buildings_t2: Buildings from time 2
            year_t1: Year of time 1
            year_t2: Year of time 2
            iou_threshold: IoU threshold for matching buildings
        
        Returns:
            Dictionary with change detection results
        """
        # Convert to shapely polygons
        polygons_t1 = [shape(b['geometry']) for b in buildings_t1]
        polygons_t2 = [shape(b['geometry']) for b in buildings_t2]
        
        matched_t1 = set()
        matched_t2 = set()
        expanded = []
        
        # Find matching and expanded buildings
        for i, poly1 in enumerate(polygons_t1):
            best_match = None
            best_iou = 0
            
            for j, poly2 in enumerate(polygons_t2):
                if j in matched_t2:
                    continue
                
                iou = ChangeDetector._calculate_iou(poly1, poly2)
                
                if iou > best_iou and iou > iou_threshold:
                    best_iou = iou
                    best_match = j
            
            if best_match is not None:
                matched_t1.add(i)
                matched_t2.add(best_match)
                
                # Check if expanded
                poly2 = polygons_t2[best_match]
                if poly2.area > poly1.area * 1.1:  # 10% increase threshold
                    area_change = (poly2.area - poly1.area) * 111320 * 111320
                    expanded.append({
                        'building_t1': buildings_t1[i],
                        'building_t2': buildings_t2[best_match],
                        'area_change_sqm': area_change,
                        'area_change_percent': ((poly2.area - poly1.area) / poly1.area) * 100
                    })
        
        # New buildings (in t2 but not in t1)
        new_buildings = [buildings_t2[j] for j in range(len(buildings_t2)) if j not in matched_t2]
        
        # Removed buildings (in t1 but not in t2)
        removed_buildings = [buildings_t1[i] for i in range(len(buildings_t1)) if i not in matched_t1]
        
        return {
            'from_year': year_t1,
            'to_year': year_t2,
            'new_buildings': new_buildings,
            'removed_buildings': removed_buildings,
            'expanded_buildings': expanded,
            'num_new': len(new_buildings),
            'num_removed': len(removed_buildings),
            'num_expanded': len(expanded),
            'total_new_area_sqm': sum(b['area_sqm'] for b in new_buildings),
            'total_removed_area_sqm': sum(b['area_sqm'] for b in removed_buildings)
        }
    
    @staticmethod
    def _calculate_iou(poly1: Polygon, poly2: Polygon) -> float:
        """Calculate Intersection over Union between two polygons."""
        try:
            intersection = poly1.intersection(poly2).area
            union = poly1.union(poly2).area
            
            if union == 0:
                return 0.0
            
            return intersection / union
        except:
            return 0.0
