# GoldEye — AI-Powered Gold Loan Pre-Qualification

> Instant, calibrated gold-loan pre-qualification from a phone camera — no branch visit required.

GoldEye is a full-stack Progressive Web App built for Poonawala Fincorp that lets borrowers photograph their gold jewelry and receive a real-time loan estimate backed by live IBJA gold prices, 12 AI signal workers, LightGBM fusion, and 4-layer explainable AI. The assessment pipeline is stateless and client-agnostic — the same backend serves the PWA today and WhatsApp/IVR channels tomorrow.

---

## Table of Contents

- [Demo](#demo)
- [Architecture](#architecture)
- [Signal Workers](#signal-workers)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [ML Training](#ml-training)
- [Project Structure](#project-structure)
- [Phases Completed](#phases-completed)
- [Roadmap](#roadmap)

---

## Demo

Add `?demo=1` to any URL to show the QR code overlay for projector/poster demos.

**Happy path:**
1. Language selection → DPDP consent → OTP verification
2. 7-step capture wizard: top-down · 45° · side · macro (hallmark) · video · audio · selfie
3. Gemini evaluates each frame live — feedback spoken aloud via Web Speech API
4. Weight entry → POST `/api/assess` → instant result with loan band, karat estimate, confidence ring

---

## Architecture

```
                    ┌─────────────────────────────────┐
                    │         React 18 PWA             │
                    │  (Vite · TailwindCSS · i18next)  │
                    └────────────┬────────────────────┘
                                 │ HTTPS / WSS
                    ┌────────────▼────────────────────┐
                    │        FastAPI (Python)           │
                    │   POST /api/assess  (stateless)  │
                    │   WS   /api/ws/evaluate-frame    │
                    │   POST /otp/send-otp             │
                    └──┬──────────────────────────┬───┘
                       │ asyncio.gather (parallel) │
           ┌───────────▼──┐              ┌─────────▼──────────┐
           │  12 Signal    │              │  Gemini 2.0 Flash  │
           │  Workers (S1  │              │  (frame eval +      │
           │  – S12)       │              │   audio analysis)   │
           └───────────┬──┘              └────────────────────┘
                       │
           ┌───────────▼──────────────────┐
           │  LightGBM + MAPIE Fusion     │
           │  (19 features · 90.2% cov.)  │
           └───────────┬──────────────────┘
                       │
           ┌───────────▼──────────────────┐
           │  Decision + XAI              │
           │  SHAP · Reasoning text ·     │
           │  Counterfactual · Grad-CAM   │
           └──────────────────────────────┘
```

### Key design rules

| Rule | Why |
|---|---|
| `POST /api/assess` is stateless | Client-agnostic — WhatsApp/IVR can call the same endpoint |
| Workers never raise | Missing signals degrade confidence; they never crash the request |
| S1 → S2 mini-pipeline | S2 needs S1's stamp appearance to compute hallmark quality |
| S5 → S6 mini-pipeline | S6 needs S5's px/mm scale to estimate weight accurately |
| Schema is a contract | `AssessmentResult` has a `schema_version` field — bump before breaking changes |

---

## Signal Workers

| Worker | Signal | Method |
|---|---|---|
| S1 | BIS hallmark / HUID detection | OpenCV logo detector + CIELAB purity mark |
| S2 | Hallmark visual integrity | Stamp appearance → quality score |
| S3 | Color purity analysis | CIELAB ΔE vs karat centroids (8–24K) |
| S4 | Specular reflectance | Warm highlight hue + brightness → metal score |
| S5 | Coin-based scale | OpenCV Hough circle (₹10 = 27mm) → px/mm |
| S6 | Dimension + weight estimate | Bbox area × scale × density |
| S7 | Solid vs plated | ConvNeXt-V2 ONNX primary · CIELAB heuristic fallback |
| S8 | VLM visual assessment | CIELAB + shape locally · Gemini/vLLM if non-localhost |
| S9 | Reverse catalog defense | pHash vs 10,200 catalog hashes (10k synthetic + 200 real) |
| S10 | Anti-replay telemetry | EXIF timestamp + gyroscope data validation |
| S11 | Acoustic ring test | Audio CNN ONNX 70% + FFT heuristic 30% |
| S12 | Cross-session fraud graph | SQLAlchemy persistent HUID + pHash dedup |

---

## Tech Stack

**Frontend**
- React 18 + TypeScript + Vite
- TailwindCSS (dark theme, custom Poonawala red/gold palette)
- vite-plugin-pwa (service worker, offline cache, installable)
- react-router-dom v6, react-i18next (English + Hindi)
- Lucide React icons, Web Speech API for voice guidance

**Backend**
- FastAPI + Python asyncio (no Celery — direct `asyncio.gather`)
- SQLAlchemy async + SQLite (Postgres-ready)
- slowapi rate limiting, prometheus-fastapi-instrumentator
- aiohttp for Gemini REST calls, httpx for IBJA price feed

**AI / ML**
- Google Gemini 2.0 Flash (frame quality evaluation, audio analysis)
- LightGBM + MAPIE split-conformal calibration (19-feature fusion)
- ConvNeXt-V2 ONNX (solid vs plated classifier)
- Audio CNN ONNX + pure-NumPy mel spectrogram
- OpenCV (Hough circles, CIELAB, BIS logo detection)
- SHAP TreeExplainer for feature attribution

**Infrastructure**
- Cloudflare Pages (frontend, `_redirects` SPA routing)
- Hetzner CX22 / Runpod RTX 4090 (backend, planned)
- Docker Compose (Postgres, Redis, Qdrant, MinIO)

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- (Optional) Docker for local infrastructure

### Backend

```bash
cd apps/api

# Create and activate virtual environment
python3.11 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill environment variables
cp .env.example .env
# Edit .env — at minimum set GEMINI_API_KEY

# Initialise database
python create_tables.py

# Start dev server (port 8000)
uvicorn app.main:app --reload
```

### Frontend

```bash
cd apps/web

# Install dependencies
npm install

# Start dev server (port 5173 — proxies /api, /session, /otp → :8000)
npm run dev

# Production build
npm run build
npm run preview
```

### Smoke tests

```bash
# API health check
curl http://localhost:8000/health

# Check all ML models loaded
curl http://localhost:8000/api/health/models

# Live IBJA gold price
curl http://localhost:8000/api/price

# OTP (dev mode — any 6-digit code works when TWOFACTOR_API_KEY is empty)
curl -X POST http://localhost:8000/otp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

---

## Environment Variables

### Backend (`apps/api/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | — | Google Gemini API key (frame eval + audio analysis) |
| `TWOFACTOR_API_KEY` | `` (empty) | 2Factor.in API key for OTP SMS. Empty = dev bypass (any 6-digit code accepted) |
| `VLM_API_URL` | `http://localhost:11434/v1` | vLLM / Groq / Ollama endpoint |
| `VLM_MODEL` | `qwen2.5vl` | Model name passed to VLM endpoint |
| `VLM_TIMEOUT_S` | `30` | VLM request timeout in seconds |
| `VLM_API_KEY` | `none` | Bearer token (set for Groq/RunPod) |
| `DATABASE_URL` | `sqlite+aiosqlite:///./goldeye.db` | Async database URL |

### Frontend (`apps/web/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `` (empty) | API base URL. Empty = use Vite dev proxy |

---

## API Reference

### Assessment

#### `POST /api/assess`

Submit all captures for full AI assessment. Returns a complete loan pre-qualification result.

**Request**
```json
{
  "session_id": "uuid",
  "frames": ["data:image/jpeg;base64,..."],
  "video": "data:video/mp4;base64,...",
  "audio": "data:audio/wav;base64,...",
  "selfie": "data:image/jpeg;base64,...",
  "weight_g": 12.5,
  "reference_object": "rs10_coin",
  "lang": "en"
}
```

**Response** — `AssessmentResult`
```json
{
  "schema_version": "1.0",
  "session_id": "uuid",
  "routing": "INSTANT | AGENT | RECAPTURE | REJECT",
  "purity": {
    "point_estimate_karat": 22,
    "band_low_karat": 20,
    "band_high_karat": 23,
    "huid_verified": true
  },
  "weight": {
    "estimated_g": 12.5,
    "band_low_g": 11.8,
    "band_high_g": 13.2,
    "method": "hybrid"
  },
  "value_inr": {
    "band_low": 142000,
    "band_high": 165000,
    "stone_weight_excluded_g": 0.3
  },
  "loan_offer": {
    "band_low_inr": 106500,
    "band_high_inr": 123750,
    "ltv_applied_pct": 75,
    "tier": "under_2_5L"
  },
  "confidence": { "score": 0.84 },
  "conformal_width_karat": 1.5,
  "fraud_signals": { "triggers": [] },
  "reasoning_text": { "text": "...", "lang": "en" },
  "xai": {
    "shap_top_features": [
      { "feature": "huid_verified", "contribution": 0.31 }
    ],
    "counterfactual": "...",
    "gradcam_url": null
  },
  "audit": { "trace_id": "uuid", "ibja_price_used": 14167.86 }
}
```

#### `POST /api/evaluate-frame` / `WS /api/ws/evaluate-frame`

Real-time Gemini evaluation of a single capture. Called after every photo in the capture wizard.

**Request**
```json
{
  "frame_type": "top | 45deg | side | macro | selfie | video | audio",
  "image_data_url": "data:image/jpeg;base64,..."
}
```

**Response**
```json
{
  "approved": true,
  "quality_score": 0.87,
  "feedback": "22K BIS hallmark detected. Estimated ₹12,904/g at current IBJA rate.",
  "issues": [],
  "detected": {
    "hallmark_visible": true,
    "karat_marking": "22K",
    "karat_numeric": 22,
    "bis_logo": true,
    "huid_code": "AB1234",
    "estimated_price_per_g": 12904
  }
}
```

**Quality score formula (transparent per-step):**

| Step | Key contributors |
|---|---|
| `top` | jewelry visible +0.30, in focus +0.20, good lighting +0.20, top-down angle +0.15, coin present +0.10 (optional) |
| `macro` | any mark visible +0.25, mark in focus +0.25, BIS logo +0.20, karat readable +0.15, good lighting +0.10 |
| `selfie` | face visible +0.35, jewelry visible +0.25, well lit +0.20, appears live +0.10 |

### OTP

#### `POST /otp/send-otp`

Send a 6-digit OTP via SMS using 2Factor.in. Falls back to dev bypass when `TWOFACTOR_API_KEY` is not set.

```json
// Request
{ "phone": "9876543210" }

// Response
{ "success": true, "message": "OTP sent successfully", "session_id": "2factor-session-id" }
```

#### `POST /otp/verify-otp`

```json
// Request
{ "session_id": "2factor-session-id", "otp": "123456" }

// Response
{ "success": true, "valid": true, "message": "OTP verified successfully" }
```

### Session

| Endpoint | Description |
|---|---|
| `POST /session/init` | Create session, returns `session_id` |
| `POST /session/consent` | Record DPDP consent (immutable audit log) |
| `POST /session/finalize` | Finalize session with idempotency key |
| `DELETE /session/dpdp/delete/{phone}` | DPDP right-to-erasure — scrubs PII, retains audit trail |

### Dashboard (NBFC Risk Officers)

| Endpoint | Description |
|---|---|
| `GET /api/dashboard/sessions` | Paginated session list with routing + confidence |
| `GET /api/dashboard/sessions/{id}` | Full session detail + WORM audit log |
| `POST /api/dashboard/agent/{id}/ground-truth` | Field agent XRF/scale result → active learning |

---

## ML Training

```bash
# Retrain LightGBM fusion (19 features + MAPIE conformal calibration)
cd goldeye
python ml/training/train_lgbm_fusion.py --out_dir ml/models

# With Optuna HPO (100 trials, ~20 min)
python ml/training/train_lgbm_fusion.py --out_dir ml/models --optuna_trials 100

# Retrain audio CNN → ONNX
python ml/training/train_audio_cnn.py --export --out_dir ml/models

# Retrain ConvNeXt-V2 solid/plated classifier
python ml/training/train_convnext.py --data_dir ml/synthetic/images --out_dir ml/models

# Generate synthetic training data (400 images + 200 WAV files)
python ml/synthetic/generate_jewelry.py

# BlenderProc 10k synthetic render (run inside BlenderProc runtime)
blenderproc run ml/synthetic/blenderproc_pipeline.py --n_images 10000
```

**Trained model performance (on synthetic + real validation set):**

| Model | Metric | Value |
|---|---|---|
| LightGBM fusion | Empirical coverage (90% target) | 90.2% |
| LightGBM fusion | MAE karat | 0.875K |
| ConvNeXt-V2 | Solid/plated AUC | > 0.95 (synthetic) |
| Audio CNN | Ring/dull AUC | > 0.85 (synthetic) |

---

## Project Structure

```
goldeye/
├── apps/
│   ├── web/                   React 18 PWA
│   │   ├── src/pages/         Welcome · Consent · OTP · Setup · CaptureFlow
│   │   │                      WeightEntry · Processing · Result
│   │   │                      Dashboard · DashboardDetail · FieldAgent
│   │   ├── src/components/    Camera.tsx (getUserMedia, EXIF, gyro)
│   │   │                      DemoQR.tsx
│   │   ├── src/lib/api.ts     Typed fetch client + WebSocket frame eval
│   │   └── src/store/         Hand-rolled singleton session store
│   │
│   └── api/                   FastAPI backend
│       ├── app/
│       │   ├── routes/        assess · session · dashboard · frame_eval · otp
│       │   ├── workers/       s1–s12 signal workers
│       │   ├── data/          gemini.py · image_utils.py · audio.py
│       │   │                  convnext.py · color.py · huid_detector.py
│       │   ├── xai/           shap_explainer · text_generator · gradcam
│       │   ├── decision/      ibja · rules · routing
│       │   ├── db/            models · database (SQLAlchemy async)
│       │   └── models/        schemas.py (AssessmentResult contract)
│       └── tests/             82 tests across 6 files
│
├── ml/
│   ├── training/              train_lgbm_fusion.py · train_audio_cnn.py
│   │                          train_convnext.py
│   ├── synthetic/             blenderproc_pipeline.py · generate_jewelry.py
│   └── models/                *.pkl · *.onnx · catalog_phashes.npy (git-ignored)
│
└── infra/docker/              docker-compose.yml (Postgres, Redis, Qdrant, MinIO)
```

---

## Phases Completed

| Phase | Description | Status |
|---|---|---|
| 0 | Camera path proof (getUserMedia, iOS Safari, PWA manifest) | ✅ |
| 1 | 7-step capture wizard, session store, DPDP consent | ✅ |
| 2 | Core ML signals — VLM client, OpenCV coin detection, FFT audio | ✅ |
| 3 | LightGBM fusion, MAPIE calibration, 4-layer XAI | ✅ |
| 4 | IBJA live price, RBI rules, decision routing, demo QR | ✅ |
| 5 | S3 color, S4 specular, S9 catalog pHash, S12 fraud graph | ✅ |
| 6 | Model training scaffolds (LightGBM, Audio CNN, ConvNeXt ONNX) | ✅ |
| 7 | S12 persistent graph (SQLAlchemy), 10k catalog pHashes | ✅ |
| 8 | Rate limiting, strict validation, idempotency, DPDP delete, Prometheus | ✅ |
| 9 | NBFC dashboard, field agent flow, ground-truth active learning | ✅ |
| 10 | OTP via 2Factor.in, optional coin, Gemini price-aware prompts | ✅ |
| 11 | Fraud hardening (MediaPipe liveness, adversarial pen-test) | Planned |
| 12 | Production deploy, Evidently drift monitoring, NBFC pilot | Planned |

---

## Roadmap

- **Phase 11 — Fraud Hardening:** MediaPipe face + hand-on-jewelry liveness detection; adversarial pen-test harness; full fraud surface matrix (plated+real-hallmark, stock-photo, photo-of-photo replay, ring fraud)
- **Phase 12 — Deploy & Iterate:** Hetzner CX22 + Runpod RTX 4090 deploy; Evidently AI drift monitoring; evaluation harness for all PRD §4 metrics; NBFC pilot with 5 branches

---

## Compliance

- **DPDP Act 2023:** Right-to-erasure at `/session/dpdp/delete/{phone}`. PII scrubbed, audit trail retained.
- **RBI Gold Loan Guidelines:** LTV tiers (85% under ₹2.5L, 75% above), 1kg collateral cap enforced in `apply_rbi_rules()`.
- **BIS Hallmarking:** HUID code extracted and verified in S1. Cross-referenced against S12 fraud graph.

---

## License

Proprietary — Poonawala Fincorp. All rights reserved.
