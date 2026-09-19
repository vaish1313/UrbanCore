import os
import urllib.request
import ssl
from loguru import logger

def download_sam(model_type="vit_h", dest_path="ml_models/sam_vit_h_4b8939.pth"):
    SAM_URLS = {
        "vit_h": "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth",
        "vit_l": "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_l_0b3195.pth",
        "vit_b": "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth"
    }
    
    url = SAM_URLS.get(model_type)
    if not url:
        logger.error(f"Unknown SAM model type: {model_type}")
        return
        
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    
    if os.path.exists(dest_path):
        logger.info(f"SAM checkpoint already exists at {dest_path}")
        return
        
    logger.info(f"Downloading SAM {model_type} checkpoint (this may take a while, ~2.4GB for vit_h)...")
    ssl._create_default_https_context = ssl._create_unverified_context
    urllib.request.urlretrieve(url, dest_path)
    logger.info(f"Successfully downloaded to {dest_path}")

if __name__ == "__main__":
    download_sam()
