import torch
import os
import rasterio
import numpy as np

def validate_checkpoint():
    checkpoint_path = 'ml_models/best_unet_urbancore.pth'
    checkpoint = torch.load(checkpoint_path, map_location='cpu')
    state_dict = checkpoint.get('model_state_dict', checkpoint)
    
    # 1. Architecture Programmatic Check
    layer4_keys = [k for k in state_dict.keys() if 'layer4' in k and 'weight' in k]
    is_resnet34 = len(layer4_keys) == 14  # 3 basic blocks
    
    # 2. Check missing/unexpected keys against UNet model
    import sys
    sys.path.append(os.path.abspath('.'))
    from ai.models.unet import get_unet_model
    import segmentation_models_pytorch as smp
    
    # The checkpoint keys map exactly to the raw SMP model
    raw_model = smp.Unet(encoder_name="resnet34", encoder_weights=None, in_channels=10, classes=1)
    model_state = raw_model.state_dict()
    
    missing_keys = set(model_state.keys()) - set(state_dict.keys())
    unexpected_keys = set(state_dict.keys()) - set(model_state.keys())
    
    # 3. Confirm 10 channels input
    conv1_key = next((k for k in state_dict.keys() if 'conv1.weight' in k), None)
    in_channels = state_dict[conv1_key].shape[1] if conv1_key else None
    
    print(f"--- Checkpoint Validation ---")
    print(f"Is ResNet34? {is_resnet34}")
    print(f"Missing keys: {len(missing_keys)} (should be 0)")
    print(f"Unexpected keys: {len(unexpected_keys)} (should be 0)")
    print(f"Input channels: {in_channels} (should be 10)")

if __name__ == '__main__':
    validate_checkpoint()
