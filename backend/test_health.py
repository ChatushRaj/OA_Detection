import sys
import os
import torch
from database import init_db, SessionLocal, User
from model_loader import load_model

def test_health():
    print("=" * 60)
    print("  OA Detection System — Backend Health Check")
    print("=" * 60)

    # 1. Check Database
    print("\n[1/3] Checking Database...")
    try:
        init_db()
        session = SessionLocal()
        user_count = session.query(User).count()
        print(f"✅ Database connected. Found {user_count} users.")
        session.close()
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

    # 2. Check Model
    print("\n[2/3] Checking AI Model...")
    try:
        model, device = load_model()
        if model is not None:
            print(f"✅ Model loaded successfully on {device}.")
        else:
            print("⚠️ Model created with random weights (fallback mode).")
    except Exception as e:
        print(f"❌ Model loading failed: {e}")
        return False

    # 3. Check Torch/CUDA
    print("\n[3/3] Checking Compute Environment...")
    print(f"• PyTorch Version: {torch.__version__}")
    print(f"• CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"• GPU Device: {torch.cuda.get_device_name(0)}")

    print("\n" + "=" * 60)
    print("  HEALTH CHECK COMPLETE: System is stable.")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = test_health()
    sys.exit(0 if success else 1)
