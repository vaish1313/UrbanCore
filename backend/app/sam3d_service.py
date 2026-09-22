"""SAM-3D service for semantic segmentation and visualization."""
import json
from pathlib import Path
import numpy as np
import torch
import rasterio
from PIL import Image
from .config import settings


class SAM3DService:
    """
    Handles SAM-3D-based semantic segmentation for creating detailed visualizations.
    
    This service uses the binary construction mask from UNet and applies
    SAM-3D to identify specific features (buildings, roads, rivers, ground)
    for detailed blueprint visualization.
    """

    def __init__(self):
        self.model = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.initialized = False

        if settings.enable_sam and settings.hf_token:
            self._initialize()

    def _initialize(self):
        """Initialize SAM-3D model from Hugging Face."""
        try:
            # This is a placeholder for SAM-3D initialization
            # The actual implementation would require the specific SAM-3D library
            # from transformers import AutoModel
            
            # For now, we'll create a mock implementation that demonstrates the concept
            print(f"SAM-3D initialization requested with model: {settings.sam_3d_model}")
            print(f"Using device: {self.device}")
            
            # In production, you would:
            # self.model = AutoModel.from_pretrained(
            #     settings.sam_3d_model,
            #     token=settings.hf_token
            # )
            # self.model.to(self.device)
            # self.model.eval()
            
            self.initialized = True
            print("SAM-3D service initialized (mock mode)")
        except Exception as e:
            print(f"Warning: Could not initialize SAM-3D: {e}")
            self.initialized = False

    def classify_pixels(
        self,
        image: np.ndarray,
        construction_mask: np.ndarray
    ) -> dict[str, np.ndarray]:
        """
        Classify pixels into semantic categories using SAM-3D.
        
        Args:
            image: RGB/multispectral image array (H, W, C)
            construction_mask: Binary mask from UNet (H, W)
            
        Returns:
            Dictionary of masks for each category:
            - building: Buildings/structures
            - road: Roads and paved surfaces  
            - ground: Open ground/soil
            - vegetation: Trees and vegetation
            - water: Rivers and water bodies
        """
        if not self.initialized:
            # Return simplified heuristic-based classification
            return self._heuristic_classification(image, construction_mask)

        # TODO: Implement actual SAM-3D inference
        # This would involve:
        # 1. Preprocess image for SAM-3D
        # 2. Run SAM-3D inference
        # 3. Extract semantic masks
        
        return self._heuristic_classification(image, construction_mask)

    def _heuristic_classification(
        self,
        image: np.ndarray,
        construction_mask: np.ndarray
    ) -> dict[str, np.ndarray]:
        """
        Fallback heuristic-based classification using spectral indices.
        
        This provides a reasonable approximation when SAM-3D is not available.
        """
        height, width = construction_mask.shape
        
        # Initialize masks
        masks = {
            "building": np.zeros((height, width), dtype=np.uint8),
            "road": np.zeros((height, width), dtype=np.uint8),
            "ground": np.zeros((height, width), dtype=np.uint8),
            "vegetation": np.zeros((height, width), dtype=np.uint8),
            "water": np.zeros((height, width), dtype=np.uint8)
        }

        # Ensure image is in correct format (H, W, C)
        if len(image.shape) == 3 and image.shape[0] < image.shape[-1]:
            image = np.transpose(image, (1, 2, 0))

        # Normalize if needed
        if image.max() > 1.0:
            image = image.astype(np.float32) / 10000.0

        # Extract bands (assuming B2, B3, B4, B8 = Blue, Green, Red, NIR)
        if image.shape[-1] >= 4:
            blue = image[:, :, 0]
            green = image[:, :, 1]
            red = image[:, :, 2]
            nir = image[:, :, 3]

            # Calculate vegetation index (NDVI)
            with np.errstate(divide='ignore', invalid='ignore'):
                ndvi = (nir - red) / (nir + red + 1e-8)
                ndvi = np.nan_to_num(ndvi)

            # Calculate water index (NDWI)
            with np.errstate(divide='ignore', invalid='ignore'):
                ndwi = (green - nir) / (green + nir + 1e-8)
                ndwi = np.nan_to_num(ndwi)

            # Classify based on indices and construction mask
            # Water: High NDWI
            masks["water"] = (ndwi > 0.3).astype(np.uint8)

            # Vegetation: High NDVI, not construction
            masks["vegetation"] = ((ndvi > 0.3) & (construction_mask == 0)).astype(np.uint8)

            # Buildings: Construction areas with higher reflectance
            brightness = (red + green + blue) / 3
            masks["building"] = (
                (construction_mask == 1) & (brightness > 0.15)
            ).astype(np.uint8)

            # Roads: Construction areas with moderate reflectance
            masks["road"] = (
                (construction_mask == 1) & (brightness <= 0.15)
            ).astype(np.uint8)

            # Ground: Everything else
            masks["ground"] = (
                (construction_mask == 0) &
                (masks["vegetation"] == 0) &
                (masks["water"] == 0)
            ).astype(np.uint8)

        return masks

    def create_visualization_geojson(
        self,
        masks: dict[str, np.ndarray],
        transform,
        crs: str = None
    ) -> dict:
        """
        Convert semantic masks to GeoJSON with proper categorization.
        
        Args:
            masks: Dictionary of category masks
            transform: Rasterio affine transform
            crs: Coordinate reference system
            
        Returns:
            GeoJSON FeatureCollection with semantic features
        """
        from rasterio.features import shapes

        features = []

        # Color scheme for visualization
        colors = {
            "building": "#FF6B6B",      # Red
            "road": "#4ECDC4",          # Teal
            "ground": "#F4A460",        # Sandy brown
            "vegetation": "#95E1D3",    # Light green
            "water": "#4A90E2"          # Blue
        }

        for category, mask in masks.items():
            # Extract polygon shapes from mask
            for geom, value in shapes(mask, transform=transform):
                if value == 1:  # Feature present
                    features.append({
                        "type": "Feature",
                        "geometry": geom,
                        "properties": {
                            "category": category,
                            "color": colors.get(category, "#CCCCCC"),
                            "value": int(value)
                        }
                    })

        geojson = {
            "type": "FeatureCollection",
            "crs": {"type": "name", "properties": {"name": crs}} if crs else None,
            "features": features
        }

        return geojson

    def process_for_visualization(
        self,
        tif_path: Path,
        construction_mask: np.ndarray,
        metadata: dict,
        output_dir: Path
    ) -> dict:
        """
        Complete pipeline for creating detailed visualization data.
        
        Args:
            tif_path: Path to original GeoTIFF
            construction_mask: Binary construction mask from UNet
            metadata: Spatial metadata
            output_dir: Output directory
            
        Returns:
            Dictionary with visualization outputs
        """
        output_dir.mkdir(parents=True, exist_ok=True)

        # Read original image
        with rasterio.open(tif_path) as src:
            image = src.read()

        # Classify pixels into semantic categories
        masks = self.classify_pixels(image, construction_mask)

        # Create GeoJSON for visualization
        geojson = self.create_visualization_geojson(
            masks,
            metadata.get("transform"),
            metadata.get("crs")
        )

        # Save visualization GeoJSON
        geojson_path = output_dir / f"{tif_path.stem}_visualization.geojson"
        with open(geojson_path, "w") as f:
            json.dump(geojson, f)

        # Calculate statistics for each category
        stats = {}
        total_pixels = construction_mask.size
        
        for category, mask in masks.items():
            count = np.sum(mask)
            stats[category] = {
                "pixel_count": int(count),
                "percentage": float((count / total_pixels) * 100)
            }

        return {
            "geojson_path": str(geojson_path),
            "categories": list(masks.keys()),
            "statistics": stats
        }


# Singleton instance
try:
    sam3d_service = SAM3DService()
except Exception as e:
    print(f"Warning: Could not initialize SAM-3D service: {e}")
    sam3d_service = None
