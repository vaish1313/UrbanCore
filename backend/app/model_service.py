"""Model inference service for construction detection."""
import json
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
from torchvision import models
import segmentation_models_pytorch as smp
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


def create_urbancore_model():
    """Create the new UrbanCore V1 model using segmentation_models_pytorch."""
    return smp.Unet(
        encoder_name="resnet18",
        encoder_weights=None,
        in_channels=10,
        classes=1,
        activation=None  # Raw logits, no activation
    )


class ModelInferenceService:
    """Handles model loading and inference for construction detection."""

    def __init__(self):
        self.model = None
        self.band_stats = None
        self.device = torch.device(settings.device if torch.cuda.is_available() else "cpu")
        self._load_band_stats()
        self._load_model()

    def _load_band_stats(self):
        """Load the preprocessing statistics from training."""
        # Try multiple possible paths
        possible_paths = [
            Path(settings.band_stats_path),
            Path("outputs/band_stats.json"),
            Path("backend/outputs/band_stats.json"),
        ]
        
        stats_path = None
        for path in possible_paths:
            if path.exists():
                stats_path = path
                break
        
        if stats_path is None:
            print(f"Warning: Band statistics not found. Tried:")
            for path in possible_paths:
                print(f"  - {path}")
            print("Using fallback per-image standardization.")
            return
            
        try:
            with open(stats_path, 'r') as f:
                self.band_stats = json.load(f)
            print(f"Loaded band statistics from {stats_path}")
            print(f"Band order: {self.band_stats['band_names']}")
        except Exception as e:
            print(f"Warning: Could not load band statistics: {e}")
            print("Using fallback per-image standardization.")

    def _load_model(self):
        """Load the trained UNet model."""
        # Try multiple possible paths for checkpoint
        possible_paths = [
            Path(settings.unet_checkpoint_path),
            Path("outputs/urbancore_unet_v1.pth"),
            Path("backend/outputs/urbancore_unet_v1.pth"),
        ]
        
        model_path = None
        for path in possible_paths:
            if path.exists():
                model_path = path
                break
        
        if model_path is None:
            print(f"Warning: Model checkpoint not found. Tried:")
            for path in possible_paths:
                print(f"  - {path}")
            print("Model inference will be disabled until checkpoint is available.")
            return

        try:
            # Initialize new UrbanCore V1 model architecture
            self.model = create_urbancore_model()

            # Load weights
            checkpoint = torch.load(model_path, map_location=self.device)

            # Handle different checkpoint formats
            if isinstance(checkpoint, dict):
                if "model_state_dict" in checkpoint:
                    state_dict = checkpoint["model_state_dict"]
                elif "state_dict" in checkpoint:
                    state_dict = checkpoint["state_dict"]
                else:
                    state_dict = checkpoint
            else:
                state_dict = checkpoint
            
            # Load state dict with strict=True (checkpoint is fully compatible)
            self.model.load_state_dict(state_dict, strict=True)

            self.model.to(self.device)
            self.model.eval()

            print(f"UrbanCore V1 model loaded successfully on device: {self.device}")
            print(f"Model architecture: segmentation_models_pytorch Unet with ResNet18 encoder")
        except Exception as e:
            print(f"Warning: Could not load model: {e}")
            print("Model inference will be disabled.")
            self.model = None

    def preprocess_image(self, image: np.ndarray) -> torch.Tensor:
        """
        Preprocess satellite image for inference using fixed training statistics.
        
        CRITICAL: The new UrbanCore V1 model was trained with FIXED Z-SCORE normalization
        using training set statistics from band_stats.json.
        
        The model expects 10 channels in this exact order:
        [B2, B3, B4, B8, B11, B12, NDVI, NDBI, NDWI, BSI]
        
        Args:
            image: numpy array of shape (C, H, W) or (H, W, C)
            
        Returns:
            Preprocessed tensor ready for model input (10 channels)
        """
        # Ensure channel-first format (C, H, W)
        if image.ndim == 3 and image.shape[-1] in [4, 6, 10]:  # (H, W, C)
            image = np.transpose(image, (2, 0, 1))

        image = image.astype(np.float32)
        
        # Handle 10-channel input (6 reflectance bands + 4 indices)
        if image.shape[0] == 10:
            # All 10 channels are present
            pass  # Continue to normalization below
        
        # Handle 6-channel input (reflectance bands only - need to compute indices)
        elif image.shape[0] == 6:
            # Extract bands (raw values, not yet normalized)
            B2 = image[0]
            B3 = image[1]
            B4 = image[2]
            B8 = image[3]
            B11 = image[4]
            B12 = image[5]
            
            # Calculate spectral indices from RAW reflectance values
            # Add small epsilon to avoid division by zero
            eps = 1e-10
            NDVI = (B8 - B4) / (B8 + B4 + eps)
            NDBI = (B11 - B8) / (B11 + B8 + eps)
            NDWI = (B3 - B8) / (B3 + B8 + eps)
            BSI = ((B11 + B4) - (B8 + B2)) / ((B11 + B4) + (B8 + B2) + eps)
            
            # Clip indices to valid range
            NDVI = np.clip(NDVI, -1, 1)
            NDBI = np.clip(NDBI, -1, 1)
            NDWI = np.clip(NDWI, -1, 1)
            BSI = np.clip(BSI, -1, 1)
            
            # Stack into 10 channels: [B2, B3, B4, B8, B11, B12, NDVI, NDBI, NDWI, BSI]
            image = np.stack([B2, B3, B4, B8, B11, B12, NDVI, NDBI, NDWI, BSI], axis=0)
        
        # Handle 4-channel input (legacy - pad with zeros)
        elif image.shape[0] == 4:
            padded = np.zeros((10, image.shape[1], image.shape[2]), dtype=np.float32)
            padded[:4] = image
            image = padded
        
        else:
            raise ValueError(f"Unexpected number of channels: {image.shape[0]}. Expected 4, 6, or 10.")

        # Apply normalization using training statistics
        if self.band_stats is not None:
            # Use fixed training set statistics for z-score normalization
            means = np.array(self.band_stats['mean'], dtype=np.float32)
            stds = np.array(self.band_stats['std'], dtype=np.float32)
            
            # Apply: normalized_channel = (channel - train_mean) / train_std
            for i in range(image.shape[0]):
                image[i] = (image[i] - means[i]) / stds[i]
        else:
            # Fallback to per-image standardization if stats not available
            print("Warning: Using per-image standardization as fallback")
            for i in range(image.shape[0]):
                channel = image[i]
                ch_mean = channel.mean()
                ch_std = channel.std()
                
                # Avoid division by zero for constant channels
                if ch_std > 1e-10:
                    image[i] = (channel - ch_mean) / ch_std
                else:
                    image[i] = channel - ch_mean

        # Convert to tensor and add batch dimension
        tensor = torch.from_numpy(image).float().unsqueeze(0)

        return tensor.to(self.device)

    def infer(self, tif_path: Path) -> tuple[np.ndarray, dict]:
        """
        Run inference on a GeoTIFF file using sliding-window patch processing.
        
        This reproduces the training inference procedure:
        - Extract 64×64 patches with stride 16
        - Run model on each patch
        - Apply sigmoid to raw logits
        - Accumulate and average overlapping probabilities
        - Threshold at 0.5 for binary mask
        
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
            raw_image = src.read()  # Shape: (bands, height, width)
            metadata = {
                "crs": src.crs.to_string() if src.crs else None,
                "transform": src.transform,
                "bounds": src.bounds,
                "width": src.width,
                "height": src.height
            }

        # Preprocess the full image (computes spectral indices from full domain)
        preprocessed_image = self._preprocess_image_to_numpy(raw_image)
        
        # Run sliding-window inference
        binary_mask = self._sliding_window_inference(preprocessed_image)
        
        # Log statistics
        construction_pixels = binary_mask.sum()
        total_pixels = binary_mask.size
        construction_pct = (construction_pixels / total_pixels) * 100
        print(f"    Construction: {construction_pixels}/{total_pixels} pixels ({construction_pct:.2f}%)")

        return binary_mask, metadata

    def _preprocess_image_to_numpy(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess satellite image and return as numpy array (not tensor).
        
        Used internally for sliding-window inference.
        
        Args:
            image: numpy array of shape (C, H, W) or (H, W, C)
            
        Returns:
            Preprocessed numpy array of shape (10, H, W)
        """
        # Ensure channel-first format (C, H, W)
        if image.ndim == 3 and image.shape[-1] in [4, 6, 10]:  # (H, W, C)
            image = np.transpose(image, (2, 0, 1))

        image = image.astype(np.float32)
        
        # Handle 10-channel input (6 reflectance bands + 4 indices)
        if image.shape[0] == 10:
            # All 10 channels are present
            pass  # Continue to normalization below
        
        # Handle 6-channel input (reflectance bands only - need to compute indices)
        elif image.shape[0] == 6:
            # Extract bands (raw values, not yet normalized)
            B2 = image[0]
            B3 = image[1]
            B4 = image[2]
            B8 = image[3]
            B11 = image[4]
            B12 = image[5]
            
            # Calculate spectral indices from RAW reflectance values
            eps = 1e-10
            NDVI = (B8 - B4) / (B8 + B4 + eps)
            NDBI = (B11 - B8) / (B11 + B8 + eps)
            NDWI = (B3 - B8) / (B3 + B8 + eps)
            BSI = ((B11 + B4) - (B8 + B2)) / ((B11 + B4) + (B8 + B2) + eps)
            
            # Clip indices to valid range
            NDVI = np.clip(NDVI, -1, 1)
            NDBI = np.clip(NDBI, -1, 1)
            NDWI = np.clip(NDWI, -1, 1)
            BSI = np.clip(BSI, -1, 1)
            
            # Stack into 10 channels: [B2, B3, B4, B8, B11, B12, NDVI, NDBI, NDWI, BSI]
            image = np.stack([B2, B3, B4, B8, B11, B12, NDVI, NDBI, NDWI, BSI], axis=0)
        
        # Handle 4-channel input (legacy - pad with zeros)
        elif image.shape[0] == 4:
            padded = np.zeros((10, image.shape[1], image.shape[2]), dtype=np.float32)
            padded[:4] = image
            image = padded
        
        else:
            raise ValueError(f"Unexpected number of channels: {image.shape[0]}. Expected 4, 6, or 10.")

        # Apply normalization using training statistics
        if self.band_stats is not None:
            # Use fixed training set statistics for z-score normalization
            means = np.array(self.band_stats['mean'], dtype=np.float32)
            stds = np.array(self.band_stats['std'], dtype=np.float32)
            
            # Apply: normalized_channel = (channel - train_mean) / train_std
            for i in range(image.shape[0]):
                image[i] = (image[i] - means[i]) / stds[i]
        else:
            # Fallback to per-image standardization if stats not available
            print("Warning: Using per-image standardization as fallback")
            for i in range(image.shape[0]):
                channel = image[i]
                ch_mean = channel.mean()
                ch_std = channel.std()
                
                # Avoid division by zero for constant channels
                if ch_std > 1e-10:
                    image[i] = (channel - ch_mean) / ch_std
                else:
                    image[i] = channel - ch_mean

        return image

    def _sliding_window_inference(
        self,
        preprocessed_image: np.ndarray,
        patch_size: int = 64,
        stride: int = 16
    ) -> np.ndarray:
        """
        Run inference using sliding-window patch processing.
        
        Matches the training/evaluation inference procedure:
        - Extract overlapping 64×64 patches
        - Run model on each patch
        - Apply sigmoid to raw logits
        - Accumulate probabilities with overlap averaging
        - Threshold at 0.5
        
        Args:
            preprocessed_image: Preprocessed image of shape (10, H, W)
            patch_size: Size of each patch (64×64)
            stride: Stride between patches (16)
            
        Returns:
            Binary mask of shape (H, W) with 0s and 1s
        """
        C, H, W = preprocessed_image.shape
        
        # Initialize accumulation maps
        prob_accumulator = np.zeros((H, W), dtype=np.float32)
        count_accumulator = np.zeros((H, W), dtype=np.float32)
        
        # Extract and process patches
        patch_positions = []
        patch_count = 0
        
        # Generate patch positions: ensure complete coverage including bottom/right edges
        y_positions = list(range(0, H - patch_size + 1, stride))
        # Add final position if needed to reach bottom edge
        if y_positions[-1] + patch_size < H:
            y_positions.append(H - patch_size)
        
        x_positions = list(range(0, W - patch_size + 1, stride))
        # Add final position if needed to reach right edge
        if x_positions[-1] + patch_size < W:
            x_positions.append(W - patch_size)
        
        # Process each patch
        with torch.inference_mode():
            for y in y_positions:
                for x in x_positions:
                    # Extract patch from preprocessed image
                    patch = preprocessed_image[:, y:y+patch_size, x:x+patch_size]
                    
                    # Convert to tensor [1, 10, 64, 64]
                    tensor = torch.from_numpy(patch).float().unsqueeze(0).to(self.device)
                    
                    # Run model inference
                    raw_output = self.model(tensor)
                    
                    # Apply sigmoid to convert raw logits to probabilities
                    prob_output = torch.sigmoid(raw_output)
                    
                    # Extract probability map and convert to numpy
                    patch_probs = prob_output.squeeze(0).squeeze(0).cpu().numpy()
                    
                    # Accumulate into full probability map
                    prob_accumulator[y:y+patch_size, x:x+patch_size] += patch_probs
                    count_accumulator[y:y+patch_size, x:x+patch_size] += 1
                    
                    patch_positions.append((y, x))
                    patch_count += 1
        
        # Average overlapping probabilities
        # Avoid division by zero for pixels not covered (should not happen with proper coverage)
        count_accumulator[count_accumulator == 0] = 1
        final_probabilities = prob_accumulator / count_accumulator
        
        # Threshold at 0.5 to create binary mask
        binary_mask = (final_probabilities > 0.5).astype(np.uint8)
        
        # Log statistics
        pred_min, pred_max, pred_mean = final_probabilities.min(), final_probabilities.max(), final_probabilities.mean()
        print(f"    Sliding-window inference: {patch_count} patches")
        print(f"    Probability stats: min={pred_min:.4f}, max={pred_max:.4f}, mean={pred_mean:.4f}")
        
        # Verify coverage
        uncovered = (count_accumulator == 0).sum()
        if uncovered > 0:
            print(f"    Warning: {uncovered} pixels not covered by patches")
        
        return binary_mask

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
