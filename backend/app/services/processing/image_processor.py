"""
Image processing service for satellite imagery.
Calculates NDVI, NDBI, NDWI, normalization, alignment, etc.
"""
import numpy as np
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling
from rasterio.mask import mask
from typing import Tuple, Optional, Dict
import cv2
from loguru import logger
from shapely.geometry import shape
import os


class ImageProcessor:
    """Process satellite imagery for analysis."""
    
    @staticmethod
    def calculate_ndvi(red: np.ndarray, nir: np.ndarray) -> np.ndarray:
        """
        Calculate Normalized Difference Vegetation Index (NDVI).
        
        NDVI = (NIR - Red) / (NIR + Red)
        
        Args:
            red: Red band array
            nir: Near-infrared band array
        
        Returns:
            NDVI array
        """
        # Avoid division by zero
        denominator = nir.astype(float) + red.astype(float)
        denominator[denominator == 0] = 0.0001
        
        ndvi = (nir.astype(float) - red.astype(float)) / denominator
        
        # Clip to valid range [-1, 1]
        ndvi = np.clip(ndvi, -1, 1)
        
        return ndvi
    
    @staticmethod
    def calculate_ndbi(swir: np.ndarray, nir: np.ndarray) -> np.ndarray:
        """
        Calculate Normalized Difference Built-up Index (NDBI).
        
        NDBI = (SWIR - NIR) / (SWIR + NIR)
        
        Args:
            swir: Short-wave infrared band array
            nir: Near-infrared band array
        
        Returns:
            NDBI array
        """
        denominator = swir.astype(float) + nir.astype(float)
        denominator[denominator == 0] = 0.0001
        
        ndbi = (swir.astype(float) - nir.astype(float)) / denominator
        
        ndbi = np.clip(ndbi, -1, 1)
        
        return ndbi
    
    @staticmethod
    def calculate_ndwi(green: np.ndarray, nir: np.ndarray) -> np.ndarray:
        """
        Calculate Normalized Difference Water Index (NDWI).
        
        NDWI = (Green - NIR) / (Green + NIR)
        
        Args:
            green: Green band array
            nir: Near-infrared band array
        
        Returns:
            NDWI array
        """
        denominator = green.astype(float) + nir.astype(float)
        denominator[denominator == 0] = 0.0001
        
        ndwi = (green.astype(float) - nir.astype(float)) / denominator
        
        ndwi = np.clip(ndwi, -1, 1)
        
        return ndwi
    
    @staticmethod
    def normalize_image(image: np.ndarray, method: str = 'minmax') -> np.ndarray:
        """
        Normalize image to [0, 1] range.
        
        Args:
            image: Input image array
            method: Normalization method ('minmax' or 'zscore')
        
        Returns:
            Normalized image
        """
        if method == 'minmax':
            min_val = np.min(image)
            max_val = np.max(image)
            
            if max_val - min_val == 0:
                return np.zeros_like(image, dtype=np.float32)
            
            normalized = (image.astype(float) - min_val) / (max_val - min_val)
        
        elif method == 'zscore':
            mean = np.mean(image)
            std = np.std(image)
            
            if std == 0:
                return np.zeros_like(image, dtype=np.float32)
            
            normalized = (image.astype(float) - mean) / std
            # Scale to [0, 1]
            normalized = (normalized - np.min(normalized)) / (np.max(normalized) - np.min(normalized))
        
        else:
            raise ValueError(f"Unknown normalization method: {method}")
        
        return normalized.astype(np.float32)
    
    @staticmethod
    def clip_to_aoi(
        input_path: str,
        geojson_geometry: dict,
        output_path: str
    ) -> Dict:
        """
        Clip raster to Area of Interest.
        
        Args:
            input_path: Path to input raster
            geojson_geometry: GeoJSON geometry dict
            output_path: Path to output raster
        
        Returns:
            Dictionary with clipped image metadata
        """
        try:
            with rasterio.open(input_path) as src:
                # Convert GeoJSON to shapely geometry
                geom = shape(geojson_geometry)
                
                # Clip image
                out_image, out_transform = mask(src, [geom], crop=True, all_touched=True)
                
                # Update metadata
                out_meta = src.meta.copy()
                out_meta.update({
                    "driver": "GTiff",
                    "height": out_image.shape[1],
                    "width": out_image.shape[2],
                    "transform": out_transform,
                    "compress": "lzw"
                })
                
                # Write clipped image
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                with rasterio.open(output_path, "w", **out_meta) as dest:
                    dest.write(out_image)
                
                logger.info(f"Clipped image saved to {output_path}")
                
                return {
                    'output_path': output_path,
                    'shape': out_image.shape,
                    'bounds': geom.bounds,
                    'area_sqm': geom.area
                }
        
        except Exception as e:
            logger.error(f"Error clipping image: {e}")
            raise
    
    @staticmethod
    def reproject_raster(
        input_path: str,
        output_path: str,
        dst_crs: str = 'EPSG:4326'
    ) -> Dict:
        """
        Reproject raster to different CRS.
        
        Args:
            input_path: Path to input raster
            output_path: Path to output raster
            dst_crs: Destination CRS
        
        Returns:
            Dictionary with reprojection metadata
        """
        try:
            with rasterio.open(input_path) as src:
                transform, width, height = calculate_default_transform(
                    src.crs, dst_crs, src.width, src.height, *src.bounds
                )
                
                kwargs = src.meta.copy()
                kwargs.update({
                    'crs': dst_crs,
                    'transform': transform,
                    'width': width,
                    'height': height,
                    'compress': 'lzw'
                })
                
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                with rasterio.open(output_path, 'w', **kwargs) as dst:
                    for i in range(1, src.count + 1):
                        reproject(
                            source=rasterio.band(src, i),
                            destination=rasterio.band(dst, i),
                            src_transform=src.transform,
                            src_crs=src.crs,
                            dst_transform=transform,
                            dst_crs=dst_crs,
                            resampling=Resampling.bilinear
                        )
                
                logger.info(f"Reprojected image saved to {output_path}")
                
                return {
                    'output_path': output_path,
                    'src_crs': str(src.crs),
                    'dst_crs': dst_crs,
                    'shape': (height, width, src.count)
                }
        
        except Exception as e:
            logger.error(f"Error reprojecting raster: {e}")
            raise
    
    @staticmethod
    def align_images(
        reference_path: str,
        target_path: str,
        output_path: str
    ) -> Dict:
        """
        Align target image to reference image using feature matching.
        
        Args:
            reference_path: Path to reference image
            target_path: Path to target image to be aligned
            output_path: Path to save aligned image
        
        Returns:
            Dictionary with alignment metadata
        """
        try:
            # Read images
            with rasterio.open(reference_path) as ref_src:
                ref_img = ref_src.read([1, 2, 3]).transpose(1, 2, 0)  # RGB
                ref_meta = ref_src.meta.copy()
            
            with rasterio.open(target_path) as tgt_src:
                tgt_img = tgt_src.read([1, 2, 3]).transpose(1, 2, 0)  # RGB
            
            # Convert to grayscale for feature detection
            ref_gray = cv2.cvtColor((ref_img * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
            tgt_gray = cv2.cvtColor((tgt_img * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
            
            # Detect ORB features
            orb = cv2.ORB_create(5000)
            kp1, des1 = orb.detectAndCompute(ref_gray, None)
            kp2, des2 = orb.detectAndCompute(tgt_gray, None)
            
            # Match features
            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
            matches = bf.match(des1, des2)
            matches = sorted(matches, key=lambda x: x.distance)
            
            # Use top matches to compute homography
            if len(matches) < 4:
                logger.warning("Not enough matches found for alignment")
                return None
            
            src_pts = np.float32([kp2[m.trainIdx].pt for m in matches[:100]]).reshape(-1, 1, 2)
            dst_pts = np.float32([kp1[m.queryIdx].pt for m in matches[:100]]).reshape(-1, 1, 2)
            
            # Compute homography
            H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
            
            # Warp target image
            h, w = ref_gray.shape
            aligned = cv2.warpPerspective(tgt_img, H, (w, h))
            
            # Save aligned image
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with rasterio.open(output_path, 'w', **ref_meta) as dst:
                for i in range(3):
                    dst.write(aligned[:, :, i], i + 1)
            
            logger.info(f"Aligned image saved to {output_path}")
            
            return {
                'output_path': output_path,
                'num_matches': len(matches),
                'inliers': int(np.sum(mask)),
                'homography': H.tolist()
            }
        
        except Exception as e:
            logger.error(f"Error aligning images: {e}")
            raise
    
    @staticmethod
    def generate_patches(
        image_path: str,
        patch_size: int = 256,
        overlap: int = 32,
        output_dir: str = None
    ) -> list:
        """
        Generate patches from large image for training/inference.
        
        Args:
            image_path: Path to input image
            patch_size: Size of patches (square)
            overlap: Overlap between patches
            output_dir: Directory to save patches
        
        Returns:
            List of patch metadata
        """
        try:
            with rasterio.open(image_path) as src:
                img = src.read()
                height, width = img.shape[1], img.shape[2]
                
                patches = []
                stride = patch_size - overlap
                
                for y in range(0, height - patch_size + 1, stride):
                    for x in range(0, width - patch_size + 1, stride):
                        patch = img[:, y:y+patch_size, x:x+patch_size]
                        
                        patch_info = {
                            'x': x,
                            'y': y,
                            'width': patch_size,
                            'height': patch_size,
                            'patch': patch
                        }
                        
                        # Save patch if output_dir provided
                        if output_dir:
                            os.makedirs(output_dir, exist_ok=True)
                            patch_path = os.path.join(output_dir, f"patch_{y}_{x}.tif")
                            
                            patch_meta = src.meta.copy()
                            patch_meta.update({
                                'height': patch_size,
                                'width': patch_size
                            })
                            
                            with rasterio.open(patch_path, 'w', **patch_meta) as dst:
                                dst.write(patch)
                            
                            patch_info['path'] = patch_path
                        
                        patches.append(patch_info)
                
                logger.info(f"Generated {len(patches)} patches")
                return patches
        
        except Exception as e:
            logger.error(f"Error generating patches: {e}")
            raise
