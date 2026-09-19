import torch

def inspect_checkpoint(checkpoint_path):
    checkpoint = torch.load(checkpoint_path, map_location='cpu')
    
    state_dict = checkpoint.get('model_state_dict', checkpoint)
    
    print(f"Total keys in state_dict: {len(state_dict)}")
    
    # Check for layer4 (ResNet18 has layer1, 2, 3, 4)
    # ResNet18 layer4 has 2 basic blocks
    # ResNet34 layer4 has 3 basic blocks
    layer4_keys = [k for k in state_dict.keys() if 'layer4' in k and 'weight' in k]
    print(f"\nLayer 4 keys: {len(layer4_keys)}")
    for k in sorted(layer4_keys):
        if 'conv' in k or 'downsample' in k:
            print(f"  {k}: {state_dict[k].shape}")
            
    # Count total parameters
    total_params = sum(p.numel() for p in state_dict.values())
    print(f"\nTotal parameters: {total_params:,}")
    
    # Check conv1
    conv1_key = next((k for k in state_dict.keys() if 'conv1.weight' in k), None)
    if conv1_key:
        print(f"\nConv1 shape ({conv1_key}): {state_dict[conv1_key].shape}")

if __name__ == '__main__':
    inspect_checkpoint('ml_models/best_unet_urbancore.pth')
