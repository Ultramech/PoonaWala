# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

### Backend (FastAPI)
```bash
cd apps/api
source .venv/bin/activate          # activate venv (Python 3.14)
uvicorn app.main:app --reload       # dev server on :8000
pytest tests/ -v --tb=short         # run all tests (82 tests across 5 files)
pytest tests/test_phase3.py -v      # Phase 3 tests only
python -c "from app.main import app; print('OK')"  # smoke test
```

### Frontend (React PWA)
```bash
cd apps/web
npm run dev      # Vite dev server on :5173 (proxies /api → :8000)
npm run build    # production build → dist/
npm run preview  # preview production build
```

### ML Training
```bash
cd ml/training
python train_lgbm_fusion.py --out_dir ml/models         # fusion model + MAPIE
python train_audio_cnn.py --export --out_dir ml/models  # audio CNN → ONNX
# BlenderProc synthetic data (run inside blenderproc runtime):
blenderproc run ml/synthetic/blenderproc_pipeline.py --n_images 10000
```

---

## Architecture

### Monorepo layout
```
goldeye/
├── apps/web/          React 18 + Vite + TailwindCSS PWA
├── apps/api/          FastAPI + asyncio (no Celery yet — direct asyncio.gather)
├── ml/
│   ├── training/      train_lgbm_fusion.py, train_audio_cnn.py
│   ├── synthetic/     blenderproc_pipeline.py (10k image renderer)
│   └── models/        fusion_lgbm.pkl, fusion_mapie.pkl, audio_cnn.onnx (git-ignored)
├── infra/docker/      docker-compose.yml (Postgres, Redis, Qdrant, MinIO)
└── .github/workflows/ ci.yml (frontend build + backend pytest)
```

### API — stateless assessment contract
`POST /api/assess` is the core endpoint. It is client-agnostic by design (PRD §10): PWA today, WhatsApp later. Never embed client-specific logic here. Request carries frames as URLs (or base64 data URIs for photo captures), response is a fully typed `AssessmentResult`.

Signal workers fan out in parallel via `asyncio.gather`. Two mini-pipelines run sequentially within the parallel gather:
- **S1 → S2**: hallmark OCR result feeds the visual integrity check
- **S5 → S6**: coin-detection scale anchor feeds weight estimation

Every worker returns `SignalResult` and catches its own exceptions — never raises. Missing signals degrade confidence, never hard-fail the request.

### Backend module map
```
app/
├── main.py                FastAPI app, middleware (trace-id, response-time headers)
│                          GET /api/health/models — loaded state of all ONNX/ML models
├── routes/
│   ├── assess.py          POST /api/assess — all 12 signals, XAI, DB audit write
│   ├── session.py         POST /session/init|consent|finalize; DELETE /session/dpdp/delete
│   └── dashboard.py       GET /api/dashboard/sessions[/{id}]; POST agent ground-truth
├── workers/
│   ├── s1_huid.py         OpenCV BIS stamp detector (huid_detector.py); VLM only if non-localhost
│   ├── s2_hallmark.py     Visual integrity (stamp_appearance → quality_score)
│   ├── s3_color.py        CIELAB color analysis → karat probability vector
│   ├── s4_specular.py     Specular reflectance → metal_score (0–1)
│   ├── s5_segmentation.py OpenCV Hough coin detection → px_per_mm scale
│   ├── s6_dimensions.py   bbox + scale → weight estimate; fuses with manual entry
│   ├── s7_plated_solid.py ConvNeXt ONNX primary; CIELAB color heuristic fallback; NO VLM
│   ├── s8_vlm.py          CIELAB + shape heuristic locally; VLM only if non-localhost
│   ├── s9_reverse_catalog.py pHash vs catalog_phashes.npy (10k hashes)
│   ├── s10_telemetry.py   EXIF timestamp + gyroscope anti-replay
│   ├── s11_audio.py       Audio CNN ONNX (70%) + FFT heuristic (30%) blend
│   ├── s12_graph.py       SQLAlchemy persistent HUID+pHash fraud graph
│   └── fusion.py          LightGBM 19-feature + MAPIE split_conformal; heuristic fallback
├── ml/
│   ├── vlm.py             OpenAI-compatible async VLM client (vLLM/Groq/Ollama)
│   ├── image_utils.py     fetch_image_bytes, detect_coin_hough, estimate_weight_from_bbox
│   ├── audio.py           Audio CNN ONNX + FFT heuristic + mel spectrogram (pure NumPy)
│   ├── convnext.py        ConvNeXt-V2 ONNX wrapper + score_cam_lite (7×7 perturbation)
│   ├── huid_detector.py   OpenCV BIS hallmark detector (no VLM, no tesseract)
│   ├── color.py           CIELAB ΔE karat centroid analysis
│   └── color_utils.py / image_utils.py  shared helpers
├── xai/
│   ├── shap_explainer.py  Layer 2: TreeExplainer when model loaded, else heuristic
│   ├── text_generator.py  Layer 3+4: reasoning text + counterfactual (en + hi)
│   └── gradcam.py         Layer 1: Score-CAM-lite via convnext.score_cam_lite (~100ms)
├── decision/
│   ├── ibja.py            Yahoo Finance (GC=F + USDINR=X); 1-hour cache; primed at startup
│   ├── rules.py           apply_rbi_rules() — 1kg cap, 85%/75% LTV tiers
│   └── routing.py         route_session() — INSTANT/AGENT/RECAPTURE/REJECT
└── models/schemas.py      Pydantic contracts — AssessmentResult (+ conformal_width_karat), SignalResult
```

### Frontend module map
```
apps/web/src/
├── pages/
│   ├── Welcome.tsx        Language picker → localStorage
│   ├── Consent.tsx        DPDP consent → POST /session/init + /session/consent
│   ├── OTP.tsx            Phone verification (skippable for hackathon)
│   ├── Setup.tsx          Instructions screen
│   ├── CaptureFlow.tsx    7-step capture wizard router
│   ├── Processing.tsx     Calls POST /api/assess; sends real dataUrls for photos
│   ├── Result.tsx         Assessment result display + XAI view
│   └── WeightEntry.tsx    Manual weight entry (0.5–500g)
├── components/
│   └── Camera.tsx         getUserMedia wrapper, EXIF on capture, gyro during video,
│                          visibilitychange restart for iOS Safari
├── lib/
│   ├── api.ts             Typed fetch client (initSessionAPI, assessAPI)
│   └── session.ts         (alias — session store lives in store/)
└── store/
    └── session.ts         Hand-rolled singleton store (no Zustand/Redux)
```

---

## Environment variables

### Backend (`apps/api/.env`)
| Variable | Default | Purpose |
|---|---|---|
| `VLM_API_URL` | `http://localhost:11434/v1` | vLLM / Groq / Ollama endpoint |
| `VLM_MODEL` | `qwen2.5vl` | Model name passed to endpoint |
| `VLM_TIMEOUT_S` | `30` | Request timeout in seconds |
| `VLM_API_KEY` | `none` | Bearer token (set for Groq/RunPod) |

### Frontend (`apps/web/.env`)
| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `` (empty) | API base URL; empty = use Vite proxy in dev |

Dev proxy in `vite.config.ts` forwards `/api`, `/session`, `/health` → `http://localhost:8000`.

---

## Key architectural constraints (do not violate)

1. **Stateless assessment endpoint.** `POST /api/assess` never reads from a database mid-request. Frames come in as URLs/data-URIs; the response is fully self-contained.
2. **Workers never raise.** Every worker catches exceptions and returns `SignalResult(error=str(e))`. The orchestrator in `assess.py` handles missing signals via confidence degradation.
3. **Schema is a contract.** `AssessmentResult` in `schemas.py` is pinned. Bump `schema_version` before any breaking field changes.
4. **S1 → S2 dependency.** S2 needs S1's `stamp_appearance` to compute `hallmark_quality_score`. They run as a mini-pipeline inside the outer parallel gather, not fully independently.
5. **S5 → S6 dependency.** S6 needs S5's `px_per_mm` scale anchor for accurate weight. Same pattern.
6. **Fusion falls back.** `fusion.py` loads `ml/models/fusion_lgbm.pkl` at startup if present; falls back to heuristic formulas if not. Both paths produce valid `AssessmentResult`.
7. **Frontend sends real dataUrls.** `Processing.tsx` sends photo captures as base64 `dataUrl` strings (not `local://` stubs) so VLM workers can process actual images.

---

## Phases completed

### Phase 0 — Camera Path Proof ✅
- `getUserMedia` on iOS Safari + Android Chrome
- `<video playsInline muted>` + user-gesture start
- PWA manifest + service worker via vite-plugin-pwa

### Phase 1 — Capture Flow with Mocks ✅
- 7-step capture wizard: Welcome → Consent → OTP → Setup → CaptureFlow (4 photos + video + audio + selfie) → WeightEntry → Processing → Result
- DPDP consent wired to `POST /session/init` + `/session/consent`
- Session store (hand-rolled singleton, no Zustand)
- `Camera.tsx`: EXIF on capture, gyroscope during video, visibilitychange restart
- i18next with English + Hindi
- `_redirects` for Cloudflare Pages SPA routing
- 9 integration tests passing

### Phase 2 — Core ML Signals ✅
- **`app/ml/vlm.py`**: OpenAI-compatible async VLM client; handles data URIs, http URLs, `local://` dev stubs with 1×1 PNG fallback; strips ```json fences from output
- **`app/ml/image_utils.py`**: `fetch_image_bytes`, OpenCV Hough circle coin detection (₹10 = 27mm), bbox area → weight via density
- **`app/ml/audio.py`**: `fft_heuristic` (fundamental ratio + decay rate + noise floor → solid probability), `classify_audio`
- All 8 workers updated with real ML logic (VLM prompts, OpenCV, FFT)
- S1→S2 and S5→S6 mini-pipelines in `assess.py`
- `Processing.tsx` sends real base64 dataUrls for photo frames
- Training scaffolds: `train_audio_cnn.py` (4-layer 2D CNN → ONNX), `train_lgbm_fusion.py` (LightGBM + MAPIE)
- scipy added to requirements

### Phase 4 — Decision Engine, Polish & Demo ✅
- **`app/decision/ibja.py`**: IBJA live price feed with 1-hour in-memory cache, async refresh, fallback to ₹7,200/g mock. `price_for_karat(karat)` used in assess.py to replace hardcoded gold price
- **`app/decision/rules.py`**: `apply_rbi_rules()` extracted to dedicated module (1kg cap, 85%/75% LTV tiers)
- **`app/decision/routing.py`**: `route_session()` extracted, now accepts `rbi_reject_reason` for hard REJECT override
- **`GET /api/price`**: exposes current IBJA price, source, and cache age
- **`GET /health`**: now includes IBJA price metadata
- **`Processing.tsx`**: last successful API result cached to `localStorage` as demo-day fallback (served transparently when API is unreachable)
- **`components/DemoQR.tsx`**: QR overlay shown when `?demo=1` in URL — for poster/projector demo setup
- **`Welcome.tsx`**: imports DemoQR

### Phase 3 — Fusion, Calibration & XAI ✅
- **`app/workers/fusion.py`**: extracts 13-column feature vector from all signals; loads LightGBM + MAPIE if `ml/models/` populated → `calibration_method: "split_conformal"`; heuristic fallback → `"none"`
- **`app/xai/shap_explainer.py`**: Layer 2 — `TreeExplainer` when model present, heuristic contributions otherwise
- **`app/xai/text_generator.py`**: Layer 3+4 — template reasoning text + counterfactual in en + hi
- **`app/xai/gradcam.py`**: Layer 1 — Grad-CAM++ stub (Phase 6)
- `assess.py` refactored to use all three XAI modules and `fusion.fuse()`
- `ml/synthetic/blenderproc_pipeline.py`: parametric renderer (4 item types, 7 karats, 5 HDRIs, 4 poses)
- 15 new Phase 3 tests; 24/24 total passing

### Phase 5 — Cut Signals S3, S4, S9, S12 ✅
- **`app/workers/s3_color.py`**: CIELAB color analysis — white-balance via ₹10 coin, Lab → karat probability vector, weighted multi-frame aggregate
- **`app/workers/s4_specular.py`**: Specular reflectance — warm highlight hue + brightness analysis across frames, metal_score (0–1)
- **`app/workers/s9_reverse_catalog.py`**: Reverse-catalog defense — pHash of customer frames vs. in-memory catalog hash set; loads `ml/models/catalog_phashes.npy` at startup
- **`app/workers/s12_graph.py`**: Cross-application fraud graph — in-memory HUID+pHash dedup, detects ring fraud and photo reuse
- **`app/workers/fusion.py`**: Extended from 13 → 19-column feature vector; heuristic fuse now blends VLM+color karat, widens band on low specular score
- **`app/routes/assess.py`**: All 12 signals wired; S12 runs sequentially after S1 to receive HUID code; fraud scoring upgraded with catalog_match + graph_anomaly + specular triggers
- 23 new Phase 5 tests; 47/47 total passing

### Phase 6 — Model Training ⚠️ Partial
- **LightGBM Fusion:** `ml/training/train_lgbm_fusion.py` trains 19-feature vector + MAPIE conformal wrapper → `ml/models/fusion_lgbm.pkl` + `fusion_mapie.pkl`. Optuna HPO support (`--optuna_trials N`). MAPIE bug fixed (`confidence_level=0.90`). Empirical coverage 90.2%, MAE 0.875 karat.
- **Audio CNN:** `ml/training/train_audio_cnn.py` → `ml/models/audio_cnn.onnx`. Blended 70/30 with FFT heuristic in `audio.py`. Pure-NumPy mel spectrogram (no librosa).
- **ConvNeXt-V2:** `ml/training/train_convnext.py` scaffold + `ml/models/convnext_plated_solid.onnx` generated. `app/ml/convnext.py` wraps it with Score-CAM-lite.
- **NOT YET DONE (per plan §11):** Fine-tuning on 1M synthetic + real catalog data; verified AUC > 0.95 (ConvNeXt) / > 0.85 (audio) on real-world samples; LoRA fine-tune on Qwen2.5-VL; MLflow model registry.

### Phase 7 — Data Pipeline ⚠️ Partial
- **S9 Catalog:** `ml/models/catalog_phashes.npy` with 10,000 deterministic 64-bit hashes + 200 real synthetic pHashes.
- **S12 Persistent Graph:** `app/workers/s12_graph.py` uses SQLAlchemy async (`HuidNode`, `PhashNode` DB models). Fully persistent cross-session fraud detection.
- **Synthetic data:** `ml/synthetic/generate_jewelry.py` — 400 images (200 solid + 200 plated, 4 item types) + 200 WAV audio files via pure OpenCV/NumPy/scipy.
- **NOT YET DONE (per plan §12):** Scraping Tanishq/Kalyan/Malabar catalogs; BlenderProc 10k→1M expansion; adversarial set of ~50 real imitation pieces; Label Studio active-learning loop.

### Phase 8 — Backend Hardening & Standard API ✅
- **Rate Limiting:** `slowapi` enforces per-session and per-endpoint limits (`/api/assess`, `/session/init`).
- **Validation:** Strict Pydantic `Field` bounds on `AssessRequest` (`min_length`, `gt=0`).
- **Idempotency & Finalization:** `/session/finalize` with Postgres-backed idempotency.
- **Audit Logging & DPDP:** SQLAlchemy `Session` + `AuditLog` (WORM). `/session/dpdp/delete/{phone}` cascades PII scrub + logs deletion proof.
- **Metrics:** `prometheus_fastapi_instrumentator` exposes SLO metrics at `/metrics`.
- **No-fallback hardening:** S1/S7/S8 detect stub frames and return valid low-confidence results without VLM calls. Zero "connection refused" warnings at startup.

### Phase 9 — NBFC Dashboard & Field Agent Flow ✅
- **Risk Officer Dashboard:** `apps/web/src/pages/Dashboard.tsx` + `DashboardDetail.tsx`. Backend: `GET /api/dashboard/sessions[/{id}]` resolves Session + AuditLog WORM trails. Actions: Approve / Request Recapture / Decline — all immutably logged.
- **Field Agent Flow:** `apps/web/src/pages/FieldAgent.tsx` — captures on-site XRF karat, scale weight, final loan. `POST /api/dashboard/agent/{id}/ground-truth` feeds active-learning pipeline.
- **Routing:** `App.tsx` + `lib/api.ts` updated for new lender-side surfaces.

### Phase 10 — Fraud Hardening Sprint ❌ Not started
Per plan §15: selfie-with-jewelry liveness (MediaPipe face + hand-on-jewelry pose), adversarial pen-test every release, full fraud surface matrix coverage.

### Phase 11 — Deploy, Eval & Iterate ❌ Not started
Per plan §16: production infra (Hetzner CX22 + Runpod RTX 4090), Evidently AI drift monitoring, evaluation harness for all PRD §4 metrics, NBFC pilot live.

---

## Current state (as of 2026-05-03, Phases 0–9 done)

- **Tests:** 82/82 passing (test_api, test_phase3, test_phase5, test_phase6, test_phase7_8, test_phase8)
- **Frontend build:** clean; `@/components/ui/*` components present (card, badge, button, textarea, input, label)
- **IBJA price:** Live Yahoo Finance (`GC=F` + `USDINR=X`); primed via `lifespan`; fallback ₹12,500/g
- **S1 hallmark:** OpenCV BIS logo + CIELAB purity mark detection; no VLM dependency
- **S7 plated/solid:** ConvNeXt-V2 ONNX on real frames; CIELAB color heuristic secondary; NO VLM
- **S8 VLM:** CIELAB + shape heuristic locally; VLM only if `VLM_API_URL` is non-localhost
- **S11 audio:** Audio CNN ONNX (mel `[1,1,128,64]`) 70% + FFT 30%; confidence 0.82
- **Grad-CAM:** Score-CAM-lite (7×7 perturbation, ~100ms) → base64 JPEG overlay
- **Fusion:** LightGBM 19-feature + MAPIE split_conformal; 90.2% empirical coverage
- **Dashboard:** `assess.py` writes `AuditLog` after every request; `/api/dashboard/sessions` shows real data
- **ML models on disk:** `fusion_lgbm.pkl`, `fusion_mapie.pkl`, `convnext_plated_solid.onnx`, `audio_cnn.onnx`, `catalog_phashes.npy` (10,200 hashes)
- **`conformal_width_karat`** field in `AssessmentResult` — active-learning uncertainty signal

### Training commands
```bash
# Retrain fusion:
cd goldeye && python ml/training/train_lgbm_fusion.py --out_dir ml/models
# With Optuna HPO (100 trials):
python ml/training/train_lgbm_fusion.py --out_dir ml/models --optuna_trials 100
# Retrain audio CNN:
python ml/training/train_audio_cnn.py --export --out_dir ml/models
# Retrain ConvNeXt S7:
python ml/training/train_convnext.py --data_dir ml/synthetic/images --out_dir ml/models
# Generate synthetic training data (images + audio):
python ml/synthetic/generate_jewelry.py
```

## Next: Phase 10 — Fraud Hardening Sprint
Per `implementation_plan.md §15`:
- Selfie-with-jewelry liveness (MediaPipe face + hand-on-jewelry pose detection)
- Adversarial pen-test: have a teammate try to game the system; every successful spoof → hard negative in training
- Full fraud surface matrix: plated+real-hallmark, stock-photo, photo-of-photo replay, identity reuse/ring fraud
