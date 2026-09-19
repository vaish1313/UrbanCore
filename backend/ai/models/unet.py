"""
U-Net architecture for building segmentation.
"""
import torch
import torch.nn as nn
import segmentation_models_pytorch as smp


class UNet(nn.Module):
    """
    U-Net architecture for semantic segmentation using ResNet34 backbone.
    
    Args:
        n_channels: Number of input channels (10 for UrbanCore paper representation)
        n_classes: Number of output classes
    """
    
    def __init__(self, n_channels=10, n_classes=1):
        super(UNet, self).__init__()
        self.n_channels = n_channels
        self.n_classes = n_classes
        
        # Instantiate ResNet34 U-Net from SMP
        self.model = smp.Unet(
            encoder_name="resnet34",
            encoder_weights=None,  # We are loading a pre-trained custom checkpoint
            in_channels=n_channels,
            classes=n_classes,
        )
    
    def forward(self, x):
        return self.model(x)
    
    def predict(self, x):
        """Predict with sigmoid activation."""
        logits = self.forward(x)
        probs = torch.sigmoid(logits)
        return probs


def get_unet_model(n_channels=10, n_classes=1, pretrained=False, checkpoint_path=None):
    """
    Get U-Net model.
    
    Args:
        n_channels: Number of input channels
        n_classes: Number of output classes
        pretrained: Load pretrained weights
        checkpoint_path: Path to checkpoint file
    
    Returns:
        UNet model
    """
    model = UNet(n_channels=n_channels, n_classes=n_classes)
    
    if pretrained and checkpoint_path:
        checkpoint = torch.load(checkpoint_path, map_location='cpu')
        # Handle dict wrapping if necessary
        state_dict = checkpoint.get('model_state_dict', checkpoint)
        
        # Our wrapper adds 'model.' prefix, so we check if the checkpoint lacks it
        first_key = next(iter(state_dict.keys()))
        if not first_key.startswith('model.'):
            # Add 'model.' prefix to map perfectly to self.model in the wrapper
            state_dict = {'model.' + k: v for k, v in state_dict.items()}
            
        model.load_state_dict(state_dict)
    
    return model
