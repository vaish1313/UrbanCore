"""Model inference service for construction detection."""
import json
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
from torchvision import models
import rasterio
from rasterio.features import shapes
from .config import settings


class ResNetUNet(nn.Module):
    """ResNet-based U-Net architecture for binary segmentation."""

    def __init__(self, in_channels=10, out_channels=1):
        super(ResNetUNet, self).__init__()
        
        # Use ResNet34 as encoder backbone
        resnet = models.resnet34(weights=None)
        
        # Modify first conv layer to accept 10 channels (your model uses 10, not 4)
        self.encoder = nn.ModuleDict({
            'conv1': nn.Conv2d(in_channels, 64, kernel_size=7, stride=2, padding=3, bias=False),
            'bn1': resnet.bn1,
            'relu': resnet.relu,
            'maxpool': resnet.maxpool,
            'layer1': resnet.layer1,  # 64 channels
            'layer2': resnet.layer2,  # 128 channels
            'layer3': resnet.layer3,  # 256 channels
            'layer4': resnet.layer4,  # 512 channels
        })
        
        # Decoder blocks with skip connections (concatenation doubles channels)
        # Block 0: 512 (layer4) + 256 (layer3) = 768 input → 256 output
        # Block 1: 256 (block0) + 128 (layer2) = 384 input → 128 output  
        # Block 2: 128 (block1) + 64 (layer1) = 192 input → 64 output
        # Block 3: 64 (block2) + 64 (conv1) = 128 input → 32 output
        # Block 4: 32 (block3) → 16 output
        self.decoder = nn.ModuleDict({
            'blocks': nn.ModuleList([
                self._decoder_block(768, 256),   # Block 0: with skip from layer3
                self._decoder_block(384, 128),   # Block 1: with skip from layer2
                self._decoder_block(192, 64),    # Block 2: with skip from layer1
                self._decoder_block(128, 32),    # Block 3: with skip from conv1
                self._decoder_block(32, 16),     # Block 4: no skip
            ])
        })
        
        # Segmentation head with 3x3 conv (not 1x1)
        self.segmentation_head = nn.Sequential(
            nn.Conv2d(16, out_channels, kernel_size=3, padding=1),
            nn.Sigmoid()
        )
    
    def _decoder_block(self, in_channels, out_channels):
        """Create a decoder block with two conv layers (NO bias in conv, bias in BN)."""
        return nn.ModuleDict({
            'conv1': nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
                nn.BatchNorm2d(out_channels),
                nn.ReLU(inplace=True)
            ),
            'conv2': nn.Sequential(
                nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
                nn.BatchNorm2d(out_channels),
                nn.ReLU(inplace=True)
            )
        })
    
    def forward(self, x):
        # Encoder
        x = self.encoder['conv1'](x)
        x = self.encoder['bn1'](x)
        x = self.encoder['relu'](x)
        enc1 = x  # 64 channels, H/2, W/2
        
        x = self.encoder['maxpool'](x)
        enc2 = self.encoder['layer1'](x)   # 64 channels, H/4, W/4
        enc3 = self.encoder['layer2'](enc2)  # 128 channels, H/8, W/8
        enc4 = self.encoder['layer3'](enc3)  # 256 channels, H/16, W/16
        enc5 = self.encoder['layer4'](enc4)  # 512 channels, H/32, W/32
        
        # Decoder with upsampling and skip connections
        # Block 0: Upsample enc5 and concatenate with enc4
        x = nn.functional.interpolate(enc5, size=enc4.shape[-2:], mode='bilinear', align_corners=True)
        x = torch.cat([x, enc4], dim=1)  # 512 + 256 = 768 channels
        x = self.decoder['blocks'][0]['conv1'](x)
        x = self.decoder['blocks'][0]['conv2'](x)  # 256 channels
        
        # Block 1: Upsample and concatenate with enc3
        x = nn.functional.interpolate(x, size=enc3.shape[-2:], mode='bilinear', align_corners=True)
        x = torch.cat([x, enc3], dim=1)  # 256 + 128 = 384 channels
        x = self.decoder['blocks'][1]['conv1'](x)
        x = self.decoder['blocks'][1]['conv2'](x)  # 128 channels
        
        # Block 2: Upsample and concatenate with enc2
        x = nn.functional.interpolate(x, size=enc2.shape[-2:], mode='bilinear', align_corners=True)
        x = torch.cat([x, enc2], dim=1)  # 128 + 64 = 192 channels
        x = self.decoder['blocks'][2]['conv1'](x)
        x = self.decoder['blocks'][2]['conv2'](x)  # 64 channels
        
        # Block 3: Upsample and concatenate with enc1
        x = nn.functional.interpolate(x, size=enc1.shape[-2:], mode='bilinear', align_corners=True)
        x = torch.cat([x, enc1], dim=1)  # 64 + 64 = 128 channels
        x = self.decoder['blocks'][3]['conv1'](x)
        x = self.decoder['blocks'][3]['conv2'](x)  # 32 channels
        
        # Block 4: Final upsample (no skip connection)
        x = nn.functional.interpolate(x, scale_factor=2, mode='bilinear', align_corners=True)
        x = self.decoder['blocks'][4]['conv1'](x)
        x = self.decoder['blocks'][4]['conv2'](x)  # 16 channels
        
        # Segmentation head
        x = self.segmentation_head(x)
        
        return x


class ModelInferenceService:
    """Handles model loading and inference for construction detection."""

    def __init__(self):
        self.model = None
        self.device = torch.device(settings.device if torch.cuda.is_available() else "cpu")
        self._load_model()

    def _load_model(self):
        """Load the trained UNet model."""
        model_path = Path(settings.unet_checkpoint_path)

        if not model_path.exists():
            print(f"Warning: Model checkpoint not found at {model_path}")
            print("Model inference will be disabled until checkpoint is available.")
            return

        try:
            # Initialize model architecture (ResNet-UNet with 10 input channels)
            self.model = ResNetUNet(in_channels=10, out_channels=1)

            # Load weights
            checkpoint = torch.load(model_path, map_location=self.device)

            # Handle different checkpoint formats
            if isinstance(checkpoint, dict):
                if "model_state_dict" in checkpoint:
                    self.model.load_state_dict(checkpoint["model_state_dict"])
                elif "state_dict" in checkpoint:
                    self.model.load_state_dict(checkpoint["state_dict"])
                else:
                    self.model.load_state_dict(checkpoint)
            else:
                self.model.load_state_dict(checkpoint)

            self.model.to(self.device)
            self.model.eval()

            print(f"✓ UNet model loaded successfully on device: {self.device}")
        except Exception as e:
            print(f"Warning: Could not load model: {e}")
            print("Model inference will be disabled.")
            self.model = None

    def preprocess_image(self, image: np.ndarray) -> torch.Tensor:
        """
        Preprocess satellite image for inference.
        
        Args:
            image: numpy array of shape (C, H, W) or (H, W, C)
            
        Returns:
            Preprocessed tensor ready for model input (10 channels)
        """
        # Ensure channel-first format (C, H, W)
        if image.ndim == 3 and image.shape[-1] in [4, 10]:  # (H, W, C)
            image = np.transpose(image, (2, 0, 1))

        # Normalize to [0, 1] if needed
        if image.max() > 1.0:
            image = image.astype(np.float32) / 10000.0  # Sentinel-2 reflectance scale

        # Clip to valid range
        image = np.clip(image, 0, 1)
        
        # If input has only 4 bands, pad to 10 channels with zeros
        # Your model expects 10 channels (probably includes additional indices/bands)
        if image.shape[0] == 4:
            # Create 10-channel array
            padded = np.zeros((10, image.shape[1], image.shape[2]), dtype=np.float32)
            padded[:4] = image  # Copy the 4 bands
            # Additional channels could be indices like NDVI, NDWI, etc.
            # For now, leaving them as zeros
            image = padded

        # Convert to tensor and add batch dimension
        tensor = torch.from_numpy(image).float().unsqueeze(0)

        return tensor.to(self.device)

    def infer(self, tif_path: Path) -> tuple[np.ndarray, dict]:
        """
        Run inference on a GeoTIFF file.
        
        Args:
            tif_path: Path to the GeoTIFF file
            
        Returns:
            Tuple of (binary_mask, metadata)
            - binary_mask: numpy array with 0 (no construction) and 1 (construction)
            - metadata: dictionary with spatial reference info
        """
        if self.model is None:
            raise RuntimeError("Model is not loaded. Please ensure the model checkpoint exists.")
            
        # Read GeoTIFF
        with rasterio.open(tif_path) as src:
            image = src.read()  # Shape: (bands, height, width)
            metadata = {
                "crs": src.crs.to_string() if src.crs else None,
                "transform": src.transform,
                "bounds": src.bounds,
                "width": src.width,
                "height": src.height
            }

        # Preprocess
        input_tensor = self.preprocess_image(image)

        # Inference
        with torch.no_grad():
            output = self.model(input_tensor)

        # Post-process: convert to binary mask
        prediction = output.squeeze().cpu().numpy()
        binary_mask = (prediction > 0.5).astype(np.uint8)

        return binary_mask, metadata

    def mask_to_geojson(
        self,
        mask: np.ndarray,
        transform,
        crs: str = None
    ) -> dict:
        """
        Convert binary mask to GeoJSON polygons.
        
        Args:
            mask: Binary mask array
            transform: Rasterio affine transform
            crs: Coordinate reference system
            
        Returns:
            GeoJSON FeatureCollection
        """
        features = []

        # Extract shapes (polygons) from mask
        for geom, value in shapes(mask, transform=transform):
            if value == 1:  # Construction detected
                features.append({
                    "type": "Feature",
                    "geometry": geom,
                    "properties": {
                        "class": "construction",
                        "value": int(value)
                    }
                })

        geojson = {
            "type": "FeatureCollection",
            "crs": {"type": "name", "properties": {"name": crs}} if crs else None,
            "features": features
        }

        return geojson

    def process_tif(self, tif_path: Path, output_dir: Path) -> dict:
        """
        Complete processing pipeline for a single GeoTIFF.
        
        Args:
            tif_path: Path to input GeoTIFF
            output_dir: Directory to save outputs
            
        Returns:
            Dictionary with processing results
        """
        if self.model is None:
            raise RuntimeError("Model is not loaded. Please ensure the model checkpoint exists.")
            
        output_dir.mkdir(parents=True, exist_ok=True)

        # Run inference
        binary_mask, metadata = self.infer(tif_path)

        # Save binary mask as GeoTIFF
        mask_path = output_dir / f"{tif_path.stem}_mask.tif"
        with rasterio.open(
            mask_path, "w",
            driver="GTiff",
            height=binary_mask.shape[0],
            width=binary_mask.shape[1],
            count=1,
            dtype=binary_mask.dtype,
            crs=metadata.get("crs"),
            transform=metadata.get("transform")
        ) as dst:
            dst.write(binary_mask, 1)

        # Convert to GeoJSON
        geojson = self.mask_to_geojson(
            binary_mask,
            metadata.get("transform"),
            metadata.get("crs")
        )

        # Save GeoJSON
        geojson_path = output_dir / f"{tif_path.stem}_construction.geojson"
        with open(geojson_path, "w") as f:
            json.dump(geojson, f)

        # Calculate statistics
        total_pixels = binary_mask.size
        construction_pixels = np.sum(binary_mask)
        construction_percentage = (construction_pixels / total_pixels) * 100

        return {
            "mask_path": str(mask_path),
            "geojson_path": str(geojson_path),
            "total_pixels": int(total_pixels),
            "construction_pixels": int(construction_pixels),
            "construction_percentage": float(construction_percentage),
            "metadata": metadata
        }


# Singleton instance
try:
    model_service = ModelInferenceService()
except Exception as e:
    print(f"Warning: Could not initialize model service: {e}")
    model_service = None
