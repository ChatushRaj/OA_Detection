import torch  # pyre-ignore
import torchvision.transforms as transforms  # pyre-ignore
from PIL import Image  # pyre-ignore

# Class labels — 5 severity grades (Kellgren-Lawrence scale)
CLASS_LABELS = {
    0: "Grade 0 – Normal",
    1: "Grade 1 – Doubtful",
    2: "Grade 2 – Mild",
    3: "Grade 3 – Moderate",
    4: "Grade 4 – Severe",
}

# AI-powered clinical suggestions for each grade
GRADE_SUGGESTIONS = {
    0: {
        "summary": "No signs of osteoarthritis detected.",
        "recommendations": [
            "Continue regular physical activity and maintain a healthy weight.",
            "No immediate medical intervention required.",
            "Routine check-ups are recommended every 1–2 years if over 50.",
        ],
        "lifestyle": "Engage in low-impact exercises such as walking, swimming, or cycling to maintain joint health.",
        "urgency": "Low",
    },
    1: {
        "summary": "Minor joint space changes detected. Early or doubtful OA signs.",
        "recommendations": [
            "Monitor the joint periodically with follow-up X-rays in 6–12 months.",
            "Begin preventive exercises like quadriceps strengthening.",
            "Maintain a balanced diet rich in omega-3 fatty acids and calcium.",
        ],
        "lifestyle": "Avoid prolonged standing or high-impact activities. Consider yoga or stretching routines.",
        "urgency": "Low – Monitor",
    },
    2: {
        "summary": "Mild narrowing of joint space with possible osteophyte formation.",
        "recommendations": [
            "Consult an orthopedic specialist for a thorough evaluation.",
            "Start physical therapy focusing on range-of-motion exercises.",
            "Over-the-counter NSAIDs may help manage occasional pain (consult doctor).",
            "Consider using a knee brace during physical activities.",
        ],
        "lifestyle": "Reduce high-impact activities. Swimming and stationary cycling are excellent alternatives.",
        "urgency": "Moderate",
    },
    3: {
        "summary": "Moderate joint space narrowing with definite osteophytes. Functional impairment likely.",
        "recommendations": [
            "Seek orthopedic consultation promptly.",
            "Prescription medications or intra-articular injections (e.g., corticosteroids, hyaluronic acid) may be considered.",
            "Structured physical therapy program is strongly recommended.",
            "Weight management is critical to reduce joint stress.",
            "Assistive devices (cane, walker) may improve mobility.",
        ],
        "lifestyle": "Avoid stairs and prolonged standing. Use ice/heat therapy for pain management.",
        "urgency": "High",
    },
    4: {
        "summary": "Severe joint space loss with large osteophytes, sclerosis, and possible deformity.",
        "recommendations": [
            "Immediate orthopedic evaluation is strongly advised.",
            "Surgical intervention such as Total Knee Replacement (TKR) may be necessary.",
            "Pain management through prescription medication under medical supervision.",
            "Pre-surgical rehabilitation to strengthen surrounding muscles.",
            "Discuss treatment options including partial vs total knee arthroplasty.",
        ],
        "lifestyle": "Minimize weight-bearing activities. Use assistive devices for mobility. Prioritize pain management and quality of life.",
        "urgency": "Critical – Immediate Attention",
    },
}

# Preprocessing pipeline — matches training notebook exactly
# The training used Grayscale(3ch) → Resize(224) → ToTensor → Normalize(ImageNet)
preprocess = transforms.Compose([
    transforms.Grayscale(num_output_channels=3),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


def predict_image(image_file, model, device):
    """
    Preprocess an uploaded image and run EfficientNetV2 inference.

    Args:
        image_file: File-like object (from Flask request.files).
        model: Loaded PyTorch model in eval mode.
        device: torch.device (cuda or cpu).

    Returns:
        Tuple of (predicted_class_label: str, confidence: float, grade_index: int).
        Returns (None, 0.0, -1) on error.
    """
    try:
        # ── Step 1: Load image with PIL ──
        image = Image.open(image_file)

        # ── Step 2: Preprocess (Grayscale→RGB, Resize, Tensor, Normalize) ──
        img_tensor = preprocess(image).unsqueeze(0).to(device)

        # ── Step 3: Model inference ──
        with torch.no_grad():
            outputs = model(img_tensor)

            # Apply softmax to convert logits → probabilities
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)

            # Get all class probabilities
            all_probs = {CLASS_LABELS[i]: float(f"{probabilities[i].item():.4f}") for i in range(5)}

            # Identify predicted class via argmax
            confidence, predicted_idx = torch.max(probabilities, 0)

            idx = predicted_idx.item()
            conf = confidence.item()

            label = CLASS_LABELS.get(idx, "Unknown")
            suggestions = GRADE_SUGGESTIONS.get(idx, {})

            return label, conf, idx, all_probs, suggestions

    except Exception as e:
        print(f"Error during inference: {e}")
        return None, 0.0, -1, {}, {}
