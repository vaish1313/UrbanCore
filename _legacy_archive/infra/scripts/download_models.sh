#!/usr/bin/env bash
# ============================================================
# UrbanCore — Download Model Weights
# Downloads U-Net ResNet-34 and SAM model weights.
# Edit MODEL_BASE_URL to point to your storage location.
# ============================================================

set -euo pipefail

MODELS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../models" && pwd)"
MODEL_BASE_URL="${MODEL_BASE_URL:-}"  # Set in .env or pass as env var

echo "📦 UrbanCore Model Weight Downloader"
echo "======================================"
echo "Models directory: $MODELS_DIR"

mkdir -p "$MODELS_DIR"

# ─── U-Net ResNet-34 ─────────────────────────────────────────
UNET_FILENAME="unet_resnet34_v1.0.0.pth"
UNET_PATH="$MODELS_DIR/$UNET_FILENAME"

if [ -f "$UNET_PATH" ]; then
    echo "✅ U-Net weights already exist: $UNET_PATH"
else
    if [ -z "$MODEL_BASE_URL" ]; then
        echo ""
        echo "⚠️  U-Net model weights not found."
        echo "   Set MODEL_BASE_URL in your .env file pointing to your storage,"
        echo "   or manually place the weights at:"
        echo "   $UNET_PATH"
        echo ""
        echo "   The model is trained by the UrbanCore AI team and should be"
        echo "   shared separately via HuggingFace Hub or a private S3 bucket."
    else
        echo "⬇️  Downloading U-Net weights..."
        curl -L --progress-bar \
            "${MODEL_BASE_URL}/${UNET_FILENAME}" \
            -o "$UNET_PATH"
        echo "✅ U-Net weights downloaded."
    fi
fi

# ─── Segment Anything Model (SAM) ────────────────────────────
SAM_FILENAME="sam_vit_h_4b8939.pth"
SAM_PATH="$MODELS_DIR/sam_vit_h.pth"
SAM_URL="https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth"
SAM_MD5="4b8939a88964f0f4ff5f5b2642c598a6"

if [ -f "$SAM_PATH" ]; then
    echo "✅ SAM weights already exist: $SAM_PATH"
else
    echo "⬇️  Downloading SAM ViT-H weights (~2.5 GB) from Meta AI..."
    curl -L --progress-bar "$SAM_URL" -o "$SAM_PATH"

    # Verify checksum
    if command -v md5sum &> /dev/null; then
        ACTUAL_MD5=$(md5sum "$SAM_PATH" | cut -d' ' -f1)
        if [ "$ACTUAL_MD5" = "$SAM_MD5" ]; then
            echo "✅ SAM weights verified (MD5 OK)."
        else
            echo "❌ SAM weights MD5 mismatch! File may be corrupted."
            rm "$SAM_PATH"
            exit 1
        fi
    fi
    echo "✅ SAM weights downloaded."
fi

echo ""
echo "✨ Model weight setup complete."
echo "   Place weights in: $MODELS_DIR"
echo "   Then run: make dev"
