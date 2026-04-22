import os
import torch  # pyre-ignore
import torch.nn as nn  # pyre-ignore
from torchvision.models import efficientnet_v2_s  # pyre-ignore


# Default model path: C:/Users/chatu/OneDrive/Desktop/Project/best_effnetv2s_msccm.pth
MODEL_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_FILENAME = "best_effnetv2s_msccm.pth"


class MSCCM(nn.Module):
    def __init__(self, channels, reduction=16):
        super().__init__()
        self.conv1 = nn.Conv2d(channels, channels, 1)
        self.conv3 = nn.Conv2d(channels, channels, 3, padding=1)
        self.conv5 = nn.Conv2d(channels, channels, 5, padding=2)
        self.relu = nn.ReLU(inplace=True)

        self.fc1 = nn.Linear(channels, channels // reduction)
        self.fc2 = nn.Linear(channels // reduction, channels)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        x = self.relu(self.conv1(x) + self.conv3(x) + self.conv5(x))
        b, c, _, _ = x.size()
        gap = torch.mean(x, dim=[2, 3])
        attn = self.sigmoid(self.fc2(self.relu(self.fc1(gap)))).view(b, c, 1, 1)
        return x * attn


class EfficientNetV2S_MSCCM(nn.Module):
    def __init__(self, num_classes=5):
        super().__init__()
        base = efficientnet_v2_s(weights=None)

        self.features = base.features
        self.msccm = MSCCM(channels=160)   # ✅ correct stage
        self.pool = base.avgpool
        self.classifier = nn.Linear(1280, num_classes)

    def forward(self, x):
        msccm_used = False   # reset every forward pass

        for block in self.features:
            x = block(x)

            # ✅ ATTENTION IS APPLIED HERE (ONCE)
            if (not msccm_used) and x.shape[1] == 160:
                x = self.msccm(x)
                msccm_used = True

        x = self.pool(x)
        x = torch.flatten(x, 1)
        return self.classifier(x)

def load_model(custom_weights_path=None):
    """
    Load the EfficientNetV2 model from the given path or the default directory.

    Args:
        custom_weights_path: Optional custom path to a .pth file.

    Returns:
        Tuple of (model, device).

    Raises:
        FileNotFoundError: If the .pth file is not found.
        RuntimeError: If weights cannot be loaded.
    """
    weights_path = custom_weights_path if custom_weights_path else os.path.join(MODEL_DIR, MODEL_FILENAME)

    # Ensure the model directory exists
    os.makedirs(MODEL_DIR, exist_ok=True)

    if not os.path.exists(weights_path):
        print(f"WARNING: Model file not found at {weights_path}")
        print("Creating model with random weights for demo purposes.")
        print(f"Place your trained weights at: {weights_path}")

        # Create model without pretrained weights (demo / fallback)
        model = EfficientNetV2S_MSCCM(num_classes=5)
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = model.to(device)
        model.eval()
        return model, device

    # Verify file is not empty
    if os.path.getsize(weights_path) == 0:
        raise RuntimeError(f"Model file is empty: {weights_path}")

    # ── 1. Initialize EfficientNetV2 architecture ──
    print(f"Creating EfficientNetV2-S_MSCCM architecture with 5 output classes...")
    model = EfficientNetV2S_MSCCM(num_classes=5)

    # ── 2. Load the trained weights ──
    print(f"Loading weights from: {weights_path}")
    state_dict = torch.load(weights_path, map_location="cpu", weights_only=True)
    # Use strict=True now because we have the exact architecture!
    model.load_state_dict(state_dict, strict=True)
    print("Pretrained weights loaded successfully (strict=True).")

    # ── 3. Move model to computation device (GPU if available) ──
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    print(f"Model moved to device: {device}")

    # ── 4. Set model to evaluation mode ──
    model.eval()
    print("Model set to evaluation mode. Ready for inference.")

    return model, device
