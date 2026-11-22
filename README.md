# Knee Osteoarthritis Severity Grading with EfficientNetV2-S + MSCCM

Deep-learning system that grades knee osteoarthritis (OA) severity from X-ray images on the five-level Kellgren–Lawrence (KL) scale, packaged as a full clinical-style application: a Flask inference API, a Next.js web dashboard for doctors, patients and administrators, an Expo React Native mobile app, and a Gemini-based assistant that explains results.

Paper: *Automated Osteoarthritis Detection and Severity Grading from Knee X-rays Using Deep Learning* (A. S. D. S. Rao, T. C. Raj, Dr. T. Illakiya), presented at IconDeepCom 2026.

## Results

| Version | Test accuracy (5 KL grades) |
|---|---|
| Published model (`new-efficientnetv2-s-msscm.ipynb`) | 79.35 % |
| Refined model after publication | 80.15 % |

Neighbouring KL grades (for example 1 "doubtful" vs 2 "minimal") look almost identical on X-rays, which makes this one of the hardest parts of the task. Several additions that looked promising on paper — a gated fusion unit, a two-stage attention module and MixUp augmentation — all lowered accuracy and were removed.

## Model

- **Backbone:** EfficientNetV2-S pretrained on ImageNet (torchvision).
- **MSCCM (Multi-Scale Convolution + Channel attention Module):** inserted once after the 160-channel stage. Parallel 1×1, 3×3 and 5×5 convolutions are summed, then a squeeze-and-excitation style channel-attention block reweights the feature maps.
- **Head:** global average pooling → linear layer with 5 outputs (KL grades 0–4).

## Training

| Setting | Value |
|---|---|
| Dataset | Knee Osteoarthritis Dataset with class balance (Kaggle), 8,000 train / 2,000 test images |
| Pre-processing | grayscale → 3 channels, resize to 224×224, ImageNet normalisation |
| Augmentation | random horizontal flip, random rotation (±7°) |
| Loss | cross-entropy with label smoothing 0.05 |
| Optimiser | AdamW, learning rate 3e-4, weight decay 1e-4 |
| Scheduler | ReduceLROnPlateau on validation accuracy (factor 0.5, patience 2) |
| Epochs / batch size | 25 / 16 |
| Hardware | NVIDIA Tesla T4 (Kaggle) |

## Application

```
backend/    Flask REST API: JWT authentication, role-based routes (admin, doctor, patient),
            scan upload and inference, SQLite database via SQLAlchemy, Gemini chatbot
frontend/   Next.js + TypeScript + Tailwind dashboard with separate admin, doctor and patient views,
            image upload, prediction results and PDF report export
mobile/     Expo React Native app: login, dashboard, patients, scans, scan details and chatbot
```

Main API endpoints: `POST /predict`, `POST /api/scans/upload`, `GET /api/scans`, `GET /api/scans/export`, `POST /api/chat`, `POST /api/auth/login`, `GET /api/admin/stats`.

## Running locally

1. **Model weights:** place `best_effnetv2s_msccm.pth` in the repository root (weights are not included because of their size).
2. **Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   # optional, for the chatbot:  export GEMINI_API_KEY=your_key
   python app.py            # http://localhost:5000
   ```
3. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev              # http://localhost:3000
   ```
4. **Mobile app**
   ```bash
   cd mobile
   npm install
   npx expo start           # scan the QR code with Expo Go
   ```

## Tech stack

PyTorch · torchvision · scikit-learn · Flask · SQLAlchemy · JWT · Google Gemini · Next.js · React · TypeScript · Tailwind CSS · React Native (Expo)

## Disclaimer

This is a research prototype and not a medical device. Predictions must not be used for diagnosis without review by a qualified clinician.

## License

MIT © Chatush Raj
