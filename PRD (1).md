# Product Requirements Document — GoldEye

> AI-powered gold-loan pre-qualification from a phone camera.
> Companion to `plan.md` (which covers *how* to build).
> This doc covers *what* we are building, *for whom*, *why*, and *against what success bar*.

---

## 0. Document Control

| Field | Value |
|---|---|
| Product | GoldEye |
| Document | Product Requirements Document |
| Version | 1.0 (Draft for review) |
| Date | May 2026 |
| Owner | Founding team |
| Audience | Engineers, hackathon judges, NBFC pilot partners |
| Companion | `plan.md` — implementation plan |

---

## 1. Executive Summary

GoldEye is a **mobile web application** that produces an **instant, calibrated, fraud-aware pre-qualification loan band** for a customer's gold jewelry, using a guided photo + short video + optional audio session captured on the customer's own phone.

The system fuses **twelve independent signals** (hallmark OCR + BIS HUID lookup, visual karat indicators, item type and dimensions via segmentation + reference-coin geometry, monocular depth → volume → weight prior, plated-vs-solid classifier, holistic VLM reasoning, reverse-catalog fraud check, EXIF/device telemetry, optional acoustic "PingCoin" test, cross-application graph signal) into a single calibrated output: a purity band, weight band, value band, loan band, and a confidence score with a 90% statistical coverage guarantee.

**Framing — non-negotiable:** GoldEye does NOT replace XRF assay. It does **upstream triage** for NBFC gold-loan funnels — deciding which applicants get instant pre-approval, which need an agent dispatched, which need a recapture, and which are likely fraud. The economic value is acquisition-cost reduction (60–70%) and reach extension into towns no NBFC branch serves, not displacement of physical assay.

The system is built on open-weight models with zero per-call API cost, RBI-2025 compliant by design, and explainable at four layers (visual heatmaps, feature attributions, customer-facing reasoning text, counterfactuals).

---

## 2. Problem & Opportunity

### 2.1 Customer pain
- India holds 25,000+ tonnes of privately-owned gold, most of it as household jewelry.
- Gold loans are a critical short-term credit product for semi-urban and rural India.
- Every gold loan today requires a **physical XRF assay** — meaning either an agent dispatched to the customer or the customer travelling to a branch.
- Acquisition cost: ₹300–800 per applicant just to get an agent to the door.
- Drop-off: ~60% of applicants abandon between application and assay.
- Reach: NBFC branches don't exist in tier-3/4 towns and most villages; addressable customers there are effectively unserved.

### 2.2 Lender pain
- High customer-acquisition cost on a thin-margin product.
- Long time-to-disbursal hurts conversion to competing lenders.
- No upstream signal to triage applicants before agent dispatch — every application costs the same to evaluate, regardless of likelihood it converts.
- Fraud surfaces (plated jewelry, stock photos, identity reuse, ring fraud) are hard to detect at scale with manual workflows.

### 2.3 Why now
- Open-weight VLMs (Qwen2.5-VL, SAM 2, Grounding DINO, Depth Anything V2) reached the accuracy + cost point where multimodal reasoning is feasible without per-call API fees.
- BIS HUID hallmarking is mandatory on most post-2023 jewelry, giving us an authoritative purity oracle for ~70% of cases.
- Smartphone penetration in tier-3/4 India is now sufficient for capture-from-home.
- RBI's 2025/2026 directions on gold loans codify exactly the structured, auditable, calibrated outputs GoldEye produces.

### 2.4 Market sizing
- ₹3.38 lakh crore organized Indian gold-loan market.
- Even 1% acquisition-cost reduction at sector level is hundreds of crores recurring.

---

## 3. Vision, Mission, Non-Goals

### 3.1 Vision
The future of gold lending is at the customer's doorstep — through their phone.

### 3.2 Mission
Give every Indian household instant, honest, calibrated visibility into the credit value of the gold they already own — and route the right next step (instant approval, agent visit, recapture, or polite decline) without anyone having to leave home.

### 3.3 Non-goals (explicit)
- **We do not replace XRF.** Final disbursal at high ticket sizes always involves physical assay.
- **We do not claim point-estimate certainty.** Every output is a band with a coverage guarantee.
- **We are not an underwriting bureau.** The lender owns the underwriting decision; we provide the structured input.
- **We are not building a goldsmith app or a price comparison app.** Single use case: pre-qualification for credit.
- **We do not collect biometric KYC ourselves** in v1 — we accept handoff from the lender's existing KYC layer.

---

## 4. Goals & Success Metrics

Three tiers, each with explicit numerical targets.

### 4.1 Model-level targets
| Metric | Target |
|---|---|
| Hallmark OCR character accuracy | > 97% |
| Item-type classification F1 | > 0.92 |
| Purity-band conformal coverage probability | 90% (within ±2% empirical) |
| Weight estimation MAPE vs. ground truth | within ±15% |
| Plated-vs-solid AUC | > 0.95 |
| Fraud detection: precision @ recall 0.80 | > 0.99 |
| PingCoin audio classifier AUC | > 0.85 |
| Calibration error (ECE) | < 0.05 |

### 4.2 System-level targets
| Metric | Target |
|---|---|
| End-to-end latency p50 | 4 s |
| End-to-end latency p95 | 8 s |
| End-to-end latency p99 | 15 s |
| Session completion rate | > 75% |
| Recapture-request rate | < 20% |
| API uptime | 99.9% |

### 4.3 Business-level targets (NBFC pilot)
| Metric | Target / direction |
|---|---|
| Pre-qualification → final disbursal conversion | Track + improve monthly |
| Acquisition cost per disbursed loan | 60–70% lower than baseline doorstep flow |
| Agent visit avoidance rate | Baseline at pilot start, improve over time |
| Fraud loss rate on disbursed value | < 0.3% |
| NPS / capture-flow drop-off | Baseline + improve |

### 4.4 Hackathon judging targets
- **Innovation:** 12-signal stack, conformal calibration, PingCoin audio test
- **Technical depth:** SAM 2 + Qwen2.5-VL + LightGBM + conformal, demonstrably composed
- **Real-world impact:** ₹3.38L crore market, 60–70% acquisition cost reduction
- **Explainability:** 4-layer XAI (Grad-CAM, SHAP, customer text, counterfactuals)
- **Compliance:** RBI 2025 ready, DPDP compliant — checklist in the deck

---

## 5. User Personas

### 5.1 Primary — Lakshmi, the borrower
- **Profile:** 52, Solapur (tier-3 town), small kirana-shop family, daughter's wedding next year. Owns ~80g of inherited and accumulated gold jewelry.
- **Smartphone:** 3-year-old budget Android, mid-range camera, 4G connection that's flaky in monsoon.
- **Literacy:** Basic; reads Marathi comfortably, English uncomfortably.
- **Today's experience:** Travels 45 min to the nearest Muthoot/Manappuram branch or waits a day for an agent. She does it because microfinance and moneylenders are worse.
- **Job to be done:** Find out, *before committing to a branch trip*, roughly how much credit her bangles are worth and whether it's enough.
- **Critical UX needs:** Voice prompts in Marathi/Hindi, large tap targets, no English-only screens, works on slow connection, no app install.

### 5.2 Secondary — the NBFC risk officer
- **Profile:** Mid-level credit risk analyst at an NBFC. Reviews flagged or borderline pre-qualifications.
- **Job to be done:** In 30 seconds per case, decide whether to dispatch an agent, request recapture, or auto-approve. Defend every decision in a future RBI audit.
- **Critical needs:** Per-session breakdown showing every signal's contribution (Grad-CAM, SHAP), full audit trail, immutable reasoning log, RBI-compliant output schema.

### 5.3 Tertiary — the field agent
- **Profile:** Existing NBFC employee with XRF kit, dispatched only for confirmed-worthwhile cases.
- **Job to be done:** Confirm or correct the pre-qualification on site; close the loan.
- **Critical needs:** A screen showing the customer's pre-qual band, the riskier signals to verify first, and a one-tap path to record the actual XRF result back into the system as ground truth.

### 5.4 Tertiary — the hackathon evaluator
- **Profile:** Judge with technical or business background, ~90 seconds of attention per project.
- **Job to be done:** Understand the wedge and verify it works on their own phone.
- **Critical needs:** QR code → instant PWA load → guided 90-sec demo → visible honest failure on a deliberate plated-brass case.

---

## 6. User Journeys

### 6.1 Primary flow — borrower (happy path, ~90 seconds)

1. **Entry:** User scans QR code from a partner NBFC poster, NBFC app, or WhatsApp link. PWA loads full-screen, no install required.
2. **Welcome & language picker:** 12 Indian languages via i18next; selection stored locally.
3. **DPDP consent screen:** single explicit consent, logged to backend with timestamp.
4. **Phone OTP** via MSG91 / Fast2SMS.
5. **Setup screen:** "Place jewelry on a plain surface next to a ₹10 coin." Voice prompt in chosen language.
6. **Guided capture (7 steps):**
   - Photo 1: top-down, full piece + reference coin
   - Photo 2: 45-degree angle
   - Photo 3: side view
   - Photo 4: hallmark macro (zoom guide overlay)
   - Video: 5-second pan around the piece
   - Audio: optional 3-second PingCoin drop test
   - Selfie holding the jewelry (anti-fraud, stored separately)
   - On-device OpenCV.js quality checks gate each capture (sharpness, exposure, framing, coin detected)
7. **Manual weight entry:** kitchen scale value, cross-checked against volume × density estimate.
8. **Processing screen:** 4–8 second wait with progress signals, voice prompt.
9. **Result screen:** purity band, weight band, value band, loan band, confidence score, 4-layer XAI, customer-friendly reasoning text, next steps.

Example output state: *"22K · 8.2g · ₹X market value · ₹Y eligible loan (85% LTV, under ₹2.5L tier) · Confidence 92%"* + reasoning trace + "next steps: digital sign, doorstep agent visits in 2 hours."

### 6.2 Honest-failure flow — borrower (deliberate fail case)

The system must visibly fail gracefully on plated/counterfeit items. Example:
- Same capture flow runs.
- Result screen: *"Confidence 38% — visual hallmark missing, acoustic signature inconsistent. We recommend in-branch verification before approval."*
- Customer is offered: schedule branch visit / try a different piece / contact support.

This honest-refusal flow is a non-negotiable product requirement, not an exception path. It is what distinguishes GoldEye from naive "AI valuator" apps.

### 6.3 Risk officer flow

1. Officer logs into NBFC dashboard (own auth).
2. Queue of borderline / flagged pre-qualifications (confidence band 0.6–0.85, or any fraud signal triggered).
3. Per-session view: original captures, segmentation overlay, Grad-CAM heatmap, SHAP feature attribution bar chart, full audit log.
4. Three actions: approve agent dispatch / request recapture (with reason) / decline.
5. Every action is logged immutably for RBI audit.

### 6.4 Field agent flow

1. Agent receives a dispatch with the customer's pre-qual band.
2. On-site, captures XRF reading.
3. Enters XRF result + actual scale weight + final loan amount.
4. Data flows back as labeled ground truth into the active-learning pipeline.

### 6.5 Edge cases the product must handle
- Coin not detected → on-device prompt to reposition before allowing capture.
- Lighting too poor → recapture prompt before upload, never silent fail.
- Hallmark missing or unreadable → fall back to other 11 signals; widen confidence band; route to agent.
- HUID present but mismatch with claimed item → flag as fraud signal.
- Network drop mid-upload → IndexedDB queue + resume on reconnect.
- Customer abandons mid-session → session expires gracefully; no partial decisions persisted.
- Same HUID seen twice across applicants → fraud-graph signal triggers manual review.

---

## 7. Product Scope by Release

### 7.1 Hackathon MVP (4 weeks) — IN SCOPE
- React PWA with full capture flow (4 photos + macro + 5 s video + 3 s audio).
- FastAPI backend, session model, async worker queue.
- On-device OpenCV.js quality checks; Hough-circle reference-coin detection.
- Voice prompts in English + Hindi.
- Signals implemented: S1 + S2 (hallmark OCR via Qwen2.5-VL, claimed text only, no live BIS portal lookup), S5 + S6 (SAM 2 + Grounding DINO + Depth V2, zero-shot), S7 (zero-shot Qwen2.5-VL classifier), S8 (Qwen2.5-VL JSON reasoner), S10 (basic EXIF + timestamp), S11 (PingCoin CNN trained on ~200 self-recorded samples).
- LightGBM fusion trained on synthetic data (BlenderProc 10k images).
- MAPIE conformal wrapper.
- Grad-CAM++ heatmaps + SHAP bar chart.
- Customer-text template explanation.
- "Try it" QR code, demo flow rehearsed.
- Backup pre-recorded video demo for wifi failures.

### 7.2 Hackathon MVP — OUT OF SCOPE (explicit cuts)
- Signals S3 (CIELAB color analysis), S4 (specular reflectance), S9 (reverse-catalog FAISS), S12 (cross-application graph).
- Live BIS portal HUID lookup (use claimed text instead).
- VLM fine-tuning (use zero-shot prompting).
- WhatsApp surface.
- 12-language coverage (English + Hindi only).
- User accounts / persistent auth (session ID in URL is fine).
- Database admin panel.
- Live video verification.
- Federated learning, blockchain, marketplace bidding, insurance quotes — every "wild idea" stays in the deck, not the build.

### 7.3 Pilot release (12 weeks) — adds to MVP
- All 12 signals fully implemented.
- BIS HUID portal live integration (or carefully scoped fallback).
- ConvNeXt-V2 fine-tuned plated/solid head.
- Full BlenderProc synthetic pipeline + adversarial set + pilot ground truth + active learning loop.
- All 12 Indian languages.
- DPDP-compliant consent + deletion SLA.
- Decision engine with full RBI 2025 rule set.
- NBFC dashboard for risk officers.
- Field-agent ground-truth flow.
- Drift monitoring (Evidently AI).

### 7.4 Phase 2 (3–6 months post-pilot)
- WhatsApp Business API surface (same backend).
- Pre-approved gold credit line product.
- Family / SHG joint-pledge flow.

### 7.5 Phase 3 (6–12 months)
- Multi-NBFC marketplace bidding for pre-qualified leads.
- Federated active learning across NBFC partners.
- Public continual-eval dashboard (honesty as marketing).

---

## 8. Functional Requirements

### 8.1 Capture subsystem
- **FR-CAP-01:** PWA must work on Android Chrome and iOS Safari without app install.
- **FR-CAP-02:** Camera access via `getUserMedia` with `facingMode: "environment"`, `playsInline` on video element, served over HTTPS.
- **FR-CAP-03:** Capture wizard must enforce ordered completion of all required steps; user cannot skip required captures.
- **FR-CAP-04:** Each capture must pass on-device quality gates (Laplacian-variance sharpness, histogram exposure, reference-coin Hough detection, jewelry occupies > 15% of frame) before being accepted.
- **FR-CAP-05:** On-device quality feedback must be real-time visual (green / red border) and announced via voice in chosen language.
- **FR-CAP-06:** Optional captures (audio PingCoin) must be skippable without breaking the session.
- **FR-CAP-07:** Capture must work on slow connections (chunked upload, IndexedDB offline queue, resume on reconnect).
- **FR-CAP-08:** EXIF + gyroscope motion log captured and attached to every asset.

### 8.2 Assessment subsystem
- **FR-ASS-01:** Each session triggers parallel signal workers; no signal can block another.
- **FR-ASS-02:** Each signal produces a structured output with its own confidence; missing signals degrade gracefully (system never hard-fails on missing signal).
- **FR-ASS-03:** Fusion model combines all available signals into purity / weight / value / loan bands.
- **FR-ASS-04:** Conformal wrapper produces statistically valid 90% coverage bands; empirical coverage tracked and alerted on drift.
- **FR-ASS-05:** Final output JSON schema is stable, versioned, and shared by PWA and (later) WhatsApp surfaces.

### 8.3 Decision engine
- **FR-DEC-01:** Decision engine applies hard-rule layer first (RBI compliance — LTV cap, 22K benchmark, stone weight excluded, max 1 kg per applicant, lower of 30-day-avg or yesterday's IBJA close).
- **FR-DEC-02:** ML routing layer on top of rules with four buckets:
  - **INSTANT:** confidence > 0.85 AND fraud_score < 0.05 AND loan_amount < ₹50k AND HUID verified
  - **AGENT:** confidence 0.6–0.85 OR loan_amount > ₹50k OR HUID missing-but-otherwise-clean
  - **RECAPTURE:** any signal returns "low quality" with recoverable cause
  - **REJECT:** fraud_score > 0.7 OR multiple fraud signals OR catalog match
- **FR-DEC-03:** Live IBJA price feed, hourly fetch, with last-known-good fallback.
- **FR-DEC-04:** Pre-qualified credit-line offer surfaced for INSTANT-bucket cases.

### 8.4 Output & explainability
- **FR-OUT-01:** Customer result screen shows purity band, weight band, value band, loan band, confidence, and customer-friendly reasoning text in chosen language.
- **FR-OUT-02:** Lender-facing per-session view shows all four XAI layers: Grad-CAM++ heatmap, SHAP feature attribution, customer reasoning text, counterfactual ("if {signal} had been clearer, band would tighten by ₹X").
- **FR-OUT-03:** Result must be accessible via signed URL valid for a configurable retention window (DPDP-compliant deletion).

### 8.5 Audit & compliance
- **FR-AUD-01:** Every API call logged to immutable Postgres audit table.
- **FR-AUD-02:** Every model decision logged with model version, input asset hashes, and full output JSON.
- **FR-AUD-03:** Object storage uses WORM (write-once-read-many) policy for compliance.
- **FR-AUD-04:** Customer data deletion request triggers cascade delete with confirmation log.
- **FR-AUD-05:** All processing happens within India-resident infra (R2 / Hetzner / Runpod India region).

### 8.6 Anti-fraud subsystem
- **FR-FRD-01:** Reverse-catalog FAISS check against scraped Tanishq/Kalyan/Malabar/Bluestone catalogs (pilot release).
- **FR-FRD-02:** EXIF anomaly check (creation timestamp vs. session timestamp, camera fingerprint match).
- **FR-FRD-03:** Same HUID seen across distinct applicants → graph signal.
- **FR-FRD-04:** Selfie-with-jewelry liveness check (anti-photo-of-photo).
- **FR-FRD-05:** Decision engine treats fraud_score as both a routing signal and a hard veto above threshold.

---

## 9. Non-Functional Requirements

### 9.1 Performance
- p50 / p95 / p99 latency targets per §4.2.
- Mobile web app initial load < 2 s on 4G.
- All captures usable on a 3-year-old budget Android.

### 9.2 Reliability
- 99.9% API uptime.
- Graceful degradation: any single signal worker can fail without blocking the session; fusion model handles missing inputs.
- Offline capture queue + resumable upload.

### 9.3 Privacy & security
- DPDP-compliant by design — single explicit consent, India-resident storage, configurable retention, deletion SLA.
- Jewelry images and selfies stored in separate buckets; selfies have stricter retention.
- All transit over TLS, all storage encrypted at rest.
- No third-party analytics, no marketing trackers in v1.

### 9.4 Accessibility & localization
- 12 Indian languages at pilot release (English + Hindi at MVP).
- Voice prompts via Web Speech API (TTS) in chosen language.
- Large tap targets, high-contrast UI.
- "Voice-only mode" feasible for low-literacy users (post-MVP).

### 9.5 Cost ceilings
- MVP infra: ₹20–30k / month for first 5k sessions.
- Pilot infra: ₹50–80k / month for 10k sessions.
- Open-weight models throughout — no per-call API cost; all serving on Runpod / Hetzner / Cloudflare.

### 9.6 Auditability
- Every decision reproducible from stored inputs + model version.
- Per-decision SHAP and Grad-CAM artifacts retained per retention policy.
- Decision log queryable by NBFC for RBI inspection.

---

## 10. System Architecture (High-Level)

```
                    ┌─────────────────────────────────┐
                    │   React PWA (mobile web)        │
                    │   - Capture wizard              │
                    │   - OpenCV.js quality gate      │
                    │   - i18n + voice prompts        │
                    │   - IndexedDB offline queue     │
                    └────────────────┬────────────────┘
                                     │ HTTPS, chunked upload
                                     ▼
                    ┌─────────────────────────────────┐
                    │   FastAPI Ingestion API         │
                    │   /session/init                 │
                    │   /session/upload               │
                    │   /session/finalize             │
                    └────────────────┬────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │   Celery + Redis                │
                    │   Async fan-out to workers      │
                    └────────────────┬────────────────┘
                                     │
        ┌────────┬────────┬──────────┼──────────┬────────┬────────┐
        ▼        ▼        ▼          ▼          ▼        ▼        ▼
       S1+S2   S3+S4    S5+S6      S7         S8       S9-S12   S11
       HUID    Color    Item +     Plated/    VLM       Fraud   Audio
       OCR     +Refl    Weight     Solid      JSON      stack   PingCoin
        │        │        │          │          │         │        │
        └────────┴────────┴──────────┴──────────┴─────────┴────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │   LightGBM Fusion Model         │
                    │   ~50 features → 4 heads        │
                    └────────────────┬────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │   MAPIE Conformal Wrapper       │
                    │   90% coverage bands            │
                    └────────────────┬────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │   Decision Engine               │
                    │   RBI rules + ML routing        │
                    │   {INSTANT, AGENT, RECAPTURE,   │
                    │    REJECT}                      │
                    └────────────────┬────────────────┘
                                     │
                ┌────────────────────┴────────────────────┐
                ▼                                         ▼
   ┌────────────────────────┐              ┌────────────────────────┐
   │  Customer Result View  │              │  NBFC Risk Dashboard   │
   │  Bands + reasoning +   │              │  Per-session XAI:      │
   │  4-layer XAI            │              │  Grad-CAM, SHAP, CFs   │
   └────────────────────────┘              └────────────────────────┘
                                                       │
                                                       ▼
                                          ┌────────────────────────┐
                                          │  Field Agent Feedback  │
                                          │  XRF ground truth →    │
                                          │  Active learning loop  │
                                          └────────────────────────┘

   Storage layer (parallel to all of the above):
   • PostgreSQL — sessions, decisions, audit (immutable)
   • Cloudflare R2 / MinIO — images, video, audio (WORM)
   • Qdrant — reverse-catalog vector index
   • Redis — task queue + ephemeral state
```

**Key architectural decisions (confirmed):**

1. **Stateless assessment API.** Backend exposes `POST /api/assess` taking `{session_id, frames[], audio?, weight_g, reference_object, lang}` and returning `{purity, confidence, value_inr, loan_offer, reasoning, trace_id}`. The PWA is one client; WhatsApp will be another later. This decoupling is a non-negotiable architectural rule.

2. **Graceful degradation.** Each signal is independent. Missing HUID → 11 other signals. Missing reference coin → 10 other signals. The system never hard-fails.

3. **Open-weight first.** Every model in the stack is open-weight (Apache 2.0 / MIT / BSD). Zero per-call API cost, fully fine-tunable, auditable, no vendor lock-in.

4. **Audit by construction.** Every API call, every model decision, every input asset is logged immutably. RBI inspection readiness is a property of the architecture, not a feature added later.

---

## 11. Tech Stack & Open-Source Foundations

### 11.1 Mobile web app
| Layer | Choice | Reason |
|---|---|---|
| Framework | React 18 + Vite | PWA, installable, works offline |
| Styling | TailwindCSS + shadcn/ui | Fast clean UI |
| Camera | `getUserMedia` + MediaRecorder API | Native browser, no plugin |
| On-device CV | OpenCV.js | Sharpness, framing, Hough circle for coin |
| i18n | i18next | 12-language support |
| Voice | Web Speech API (TTS) | Voice-guided capture |
| Offline | IndexedDB | Capture queueing |
| Optional | Capacitor wrapper | If native APIs become required |

### 11.2 Backend
| Layer | Choice |
|---|---|
| API | FastAPI (Python 3.11) |
| Async queue | Celery + Redis |
| Database | PostgreSQL 15 |
| Vector DB | Qdrant |
| Object storage | Cloudflare R2 (or MinIO) |
| Reverse proxy | Caddy (auto-HTTPS) |

### 11.3 ML serving
| Layer | Choice |
|---|---|
| VLM serving | vLLM with FP8 quantization |
| Specialist heads | ONNX Runtime + Triton Inference Server |
| Fine-tuning | HuggingFace Transformers / PEFT |
| GPU | Runpod / Lambda Labs / GCP spot |

### 11.4 Models (all open-weight)
| Role | Model | License |
|---|---|---|
| VLM reasoner (S8, S1+S2 OCR backup) | Qwen2.5-VL-7B-Instruct | Apache 2.0 |
| Segmentation (S5) | SAM 2 (Hiera-Tiny) | Apache 2.0 |
| Detection (S2 hallmark, coin) | Grounding DINO 1.5 Edge | Apache 2.0 |
| Depth (S6 volume) | Depth Anything V2 Small | MIT |
| Plated/solid classifier (S7) | ConvNeXt-V2-Base, fine-tuned | MIT |
| Embeddings (S9 reverse catalog) | EVA-02-Large | MIT |
| OCR fallback (S1) | PaddleOCR / Tesseract | Apache 2.0 / Apache 2.0 |
| Fusion | LightGBM | MIT |
| Calibration | MAPIE (split conformal) | BSD |
| XAI (visual) | Grad-CAM++ via `pytorch-grad-cam` | MIT |
| XAI (tabular) | SHAP | MIT |

### 11.5 Synthetic data + MLOps
| Layer | Choice |
|---|---|
| Synthetic generation | BlenderProc on Blender 4.x with Cycles |
| Data versioning | DVC |
| Experiment tracking + registry | MLflow |
| Annotation | Label Studio |
| Drift monitoring | Evidently AI |
| CI/CD | GitHub Actions |

### 11.6 Deployment (cost-optimized)
| Layer | Choice |
|---|---|
| Frontend hosting | Cloudflare Pages (free) |
| CPU services | Hetzner / DigitalOcean |
| GPU inference | Runpod spot RTX 4090 / L4 |
| Total MVP infra | ₹20–30k / month for first 5k sessions |

### 11.7 GitHub references (consulted in earlier discussions, scoped to this project)
- `google-gemini/live-api-web-console` — fork base for camera + voice agent
- `heiko-hotz/gemini-multimodal-live-dev-guide` — multimodal live API protocol study
- `ViaAnthroposBenevolentia/gemini-2-live-api-demo` — vanilla JS reference for debugging
- `AnelMusic/google-gemini-live-api-multimodal-demo` — 16 kHz / 24 kHz AudioContext fix pattern
- `cameronking4/openai-realtime-api-nextjs` and `cameronking4/openai-realtime-blocks` — voice UI components
- `yiyd1004/nextjs_face_object_detection` — MediaPipe + Next.js framing overlay pattern
- `ysaidcan/counterfeit_gold_detection` — image + sound classifier prior art
- `QwenLM/Qwen3-VL` — official VLM serving repo
- `princesegzy01/Jewellery-Classification`, `Pushpalal/Enhancing_Jewelry_Recognition`, `jewelryling/jewelry_linguistics`, `AlexFJ498/detection-of-jewellery-accessories-with-Image-Captioning` — jewelry CV starters
- `facebookresearch/sam2` — segmentation
- `apple/ml-depth-pro` — alternative metric depth

### 11.8 HuggingFace / open dataset references
- `sidd707/jewelry-design-dataset` (~6,100 images, MIT-licensed) — bootstrap dataset
- OrnAsia (1,088 South-Asian ornaments, fine-grained classes — 2025 paper) — fine-grained classes
- `facebook/convnextv2-base-22k-224` — base weights for plated/solid classifier
- Tanishq / Kalyan / Malabar / Bluestone catalog scraping — labelled purity + weight + price (used for the reverse-catalog FAISS index and weak labels)

### 11.9 Government / external integrations
- BIS Care app + HUID portal — authoritative purity oracle for ~70% of post-2023 jewelry
- IBJA price feed — daily gold price for valuation math
- DigiLocker / Aadhaar eKYC — handed off from NBFC layer (we do not own KYC)
- MSG91 / Fast2SMS — phone OTP

---

## 12. Data Strategy

A defensible dataset is the long-term moat. The build sequence:

1. **Public + scraped bootstrap (Week 1–2):** HuggingFace `sidd707/jewelry-design-dataset`, OrnAsia, scraped Tanishq/Kalyan/Malabar/Bluestone catalogs (each catalog row gives weakly-labelled purity + weight + price).
2. **BlenderProc synthetic pipeline (Week 3–5):** parametric jewelry models (rings, bangles, chains, earrings) × karat-dependent BRDFs × stone configurations × HDRI lighting × camera poses. Target ~1M synthetic images at 224 / 384 px.
3. **Adversarial set (Week 4–6):** ₹500 of imitation jewelry from local market + ₹500/hour from a friendly jeweler to record real solids. ~1k hard-negative cases for plated-vs-solid head.
4. **PingCoin audio (Week 4):** ~200 self-recorded acoustic samples — solid pieces and plated pieces dropped on the same hard surface — for the bootstrap CNN.
5. **Pilot ground truth (Week 8 onward):** every NBFC pilot session with field-agent XRF result becomes gold-standard label.
6. **Active learning loop (ongoing):** conformal-band-width is the uncertainty signal. Wide-band cases auto-flagged for human relabel via Label Studio. Re-train monthly.

After 6 months of pilot operation: 50k+ professionally-labeled real-world examples nobody else has — this is the data moat.

**Data cost ceiling for MVP:** under ₹2,000 (imitation jewelry + jeweler time). Tiny absolute spend, unlocks the most valuable parts of the dataset.

---

## 13. Compliance & Risk Posture

### 13.1 RBI 2025 / 2026 gold-loan rules — codified in the decision engine
- **LTV cap:** 75% (or 85% for loans under ₹2.5L per April 2026 rules).
- **Valuation benchmark:** 22K reference; lower karat scaled proportionally.
- **Price reference:** lower of 30-day average or yesterday's IBJA close.
- **Stone weight excluded** from gold weight calculation.
- **Maximum jewelry per applicant:** 1 kg.
- **Audit trail:** every decision logged with model version + input asset hashes + full output JSON.

### 13.2 DPDP compliance
- Single explicit consent screen at session start, logged with timestamp.
- India-resident data storage (Cloudflare R2 India / Hetzner / Runpod India region).
- Configurable retention with cascade delete on customer request, confirmation logged.
- Selfies stored separately from jewelry images, with stricter retention.
- No third-party analytics or marketing trackers.
- Right-to-explanation supported via the customer reasoning text + access to per-session XAI.

### 13.3 Anti-fraud surfaces (defended)
- **Plated jewelry with real hallmark:** caught by combination of plated/solid classifier + acoustic test + density estimate from volume × weight.
- **Stock-photo submission:** caught by reverse-catalog FAISS check.
- **Photo-of-photo / replay:** caught by EXIF anomaly detection + selfie-with-jewelry liveness.
- **Identity reuse / ring fraud:** caught by cross-application graph signal (HUID seen before, photos reused).
- **Appraisal-doc spoofing:** mitigated by the structural rule — we only accept jewelry captures, never appraisal documents as input.
- **Tungsten-core counterfeits:** flagged as low-confidence (density and acoustics both close to gold; system routes to physical assay rather than approving). The product is honest about this; we never pretend to detect what we cannot.

---

## 14. Risks & Mitigations

| # | Risk | Mitigation |
|---|---|---|
| R1 | Model fooled by good plating | Multi-modal physics + structural rule that we never claim certainty; bands + routing |
| R2 | Privacy of jewelry photos (financial + heirloom sensitivity) | On-device pre-processing, encrypted storage, deletion SLA, India residency |
| R3 | Adverse selection (only fraudsters using photo-only path) | Credit-line stickiness + pre-approval bonuses for honest customers |
| R4 | Regulatory exposure from over-promising | Legal review of every marketing claim against RBI 2025 directions |
| R5 | iOS Safari `getUserMedia` quirks burning days of dev | Phase-0 day-1 task: prove camera path on iOS Safari + Android Chrome before any other work |
| R6 | Hackathon demo wifi failure | Phone hotspot, backup pre-recorded video, cached last-good demo response |
| R7 | VLM API rate limit during demo | Pre-cached demo response, second API key on backup account, Groq fallback for non-multimodal turns |
| R8 | "RL on VLM" overclaim by team in pitch | Frame as RL-ready / contextual bandit / active learning loop, not online RL on the VLM |
| R9 | Tungsten-core counterfeits | Honest low-confidence routing — we do not pretend to solve what we cannot |
| R10 | Conformal coverage drift in production | Empirical coverage tracked; PSI > 0.2 triggers retrain |

---

## 15. Release Roadmap

### Phase 0 — Hackathon MVP (4 weeks)
- Week 1: capture flow + skeleton backend
- Week 2: core ML signals (zero-shot first)
- Week 3: fusion + XAI
- Week 4: polish + demo rehearsal

### Phase 1 — Full v1 / Pilot prep (12 weeks)
- All 11 phases of `plan.md`: setup, capture, all 12 signals, data pipeline, model training, backend API, mobile polish, decision engine, XAI, fraud hardening, deployment, evaluation.

### Phase 2 — Pilot (3–6 months)
- Single NBFC partner pilot.
- Active learning loop in production.
- WhatsApp surface added (same backend).
- Pre-approved gold credit-line product.
- Family / SHG joint-pledge flow.

### Phase 3 — Scale (6–12 months)
- Multi-NBFC marketplace bidding.
- Federated active learning.
- Public continual-eval dashboard.

---

## 16. Out-of-the-Box Innovations (the differentiators)

These are committed product features, not roadmap fluff. Each has been validated as realistic and implementable.

1. **PingCoin audio test** — first system to use phone-mic acoustic resonance as a gold purity signal. Cheap, hard to spoof, surprising-and-delightful demo moment.
2. **Reference-coin geometry trick** — ₹10 coin (27 mm exact) doubles as scale anchor + white-balance reference + fraud check. Single object solves three problems.
3. **Conformal prediction for regulator-grade trust** — every loan band has a mathematical 90% coverage guarantee. Credibility lever for risk teams.
4. **HUID oracle lane** — ~70% of post-2023 jewelry has authoritative purity from BIS HUID. We sidestep "AI guesses karat" entirely on those cases.
5. **Reverse-catalog FAISS defense** — unique fraud defense; catches anyone submitting Tanishq stock photos (the most common gold-loan fraud pattern).
6. **Pre-approved gold credit line (Phase 2)** — once pre-qualified, customer gets a standing line they draw against monthly. Way stickier than transactional loans.
7. **WhatsApp-first onboarding (Phase 2)** — same backend, no app install. 5–10× funnel multiplier in tier-3/4 towns.

---

## 17. Dependencies & Assumptions

### 17.1 Dependencies
- Open-weight VLM accuracy at 7B-parameter scale remains sufficient for hallmark OCR and item-type reasoning (Qwen2.5-VL-7B benchmarked).
- Cloudflare R2 / Hetzner / Runpod India regions remain available and within cost ceiling.
- BIS HUID portal remains queryable (or scrape-friendly) — fallback is claimed-text OCR.
- IBJA daily price feed remains accessible.
- Partner NBFC provides pilot funnel access for ground-truth feedback.

### 17.2 Assumptions
- Customer can place a ₹10 coin next to jewelry (validated with persona research).
- Customer has a kitchen scale or willingness to acquire one (~₹200 one-time).
- Customer's phone has a working rear camera and microphone (low bar).
- 4G data available for upload (works on EDGE with chunked + offline queue).
- NBFC partner has existing KYC layer we can hand off to.

---

## 18. Open Questions

- **PingCoin friction:** How many users will actually drop their jewelry? (Made optional in UX; track skip rate; consider gentler "tap with a coin" alternative.)
- **Live BIS portal lookup** vs. claimed-text OCR — what's the rate-limit tolerance? Test in pilot.
- **Field agent ground-truth flow** UX — will agents reliably enter XRF results? Incentive structure with NBFC?
- **Counterfactual generation** computational cost — is per-session counterfactual generation feasible at p95 latency target, or batch on demand?
- **Multi-NBFC marketplace** — does any single pilot NBFC accept this, or does it require a neutral entity?
- **WhatsApp surface** — n8n self-hosted vs. direct Cloud API webhook — decide before Phase 2 starts.

---

## Appendix A — Glossary

| Term | Definition |
|---|---|
| BIS | Bureau of Indian Standards — issuer of HUID hallmarks |
| HUID | Hallmark Unique Identification — 6-character code on hallmarked jewelry |
| LTV | Loan-to-Value — % of valuation that can be lent |
| IBJA | India Bullion and Jewellers Association — daily gold price reference |
| NBFC | Non-Banking Financial Company — gold-loan lenders (Muthoot, Manappuram, IIFL, etc.) |
| XRF | X-Ray Fluorescence — physical assay technique used at branches |
| DPDP | Digital Personal Data Protection Act (India) |
| PWA | Progressive Web App |
| VLM | Vision-Language Model |
| ECE | Expected Calibration Error |
| MAPE | Mean Absolute Percentage Error |
| PSI | Population Stability Index — drift metric |
| WORM | Write Once Read Many — immutable storage policy |
| Conformal prediction | Distribution-free wrapper that produces statistically valid coverage bands |
| BRDF | Bidirectional Reflectance Distribution Function — how a surface reflects light |
| Grad-CAM++ | Gradient-weighted Class Activation Mapping for visual explainability |
| SHAP | SHapley Additive exPlanations for tabular feature attribution |

---

## Appendix B — Output JSON Schema (versioned)

```json
{
  "schema_version": "1.0",
  "session_id": "uuid",
  "timestamp_utc": "ISO-8601",
  "model_versions": {
    "vlm": "qwen2.5-vl-7b-v1",
    "segmentation": "sam2-hiera-tiny-v1",
    "plated_solid": "convnextv2-base-finetuned-v3",
    "fusion": "lgbm-v7",
    "conformal": "mapie-v1-alpha-0.1"
  },
  "purity": {
    "band_low_karat": 18,
    "band_high_karat": 22,
    "point_estimate_karat": 20,
    "huid_verified": true
  },
  "weight": {
    "manual_entry_g": 8.2,
    "estimated_g": 7.9,
    "band_low_g": 7.5,
    "band_high_g": 8.5,
    "method": "depth_volume_x_density"
  },
  "value_inr": {
    "band_low": 48000,
    "band_high": 62000,
    "ibja_reference_date": "ISO-8601",
    "stone_weight_excluded_g": 0.4
  },
  "loan_offer": {
    "band_low_inr": 36000,
    "band_high_inr": 47000,
    "ltv_applied_pct": 75,
    "tier": "under_2_5L"
  },
  "confidence": {
    "score": 0.92,
    "coverage_guarantee_pct": 90,
    "calibration_method": "split_conformal"
  },
  "fraud_signals": {
    "score": 0.04,
    "triggers": []
  },
  "routing": "INSTANT",
  "reasoning_text": {
    "lang": "hi",
    "text": "..."
  },
  "xai": {
    "gradcam_url": "signed-url",
    "shap_top_features": [
      {"feature": "huid_verified", "contribution": 0.31},
      {"feature": "plated_solid_score", "contribution": 0.22}
    ],
    "counterfactual": "..."
  },
  "audit": {
    "trace_id": "uuid",
    "input_asset_hashes": ["sha256:..."]
  }
}
```

---

**End of PRD.**

This document and `plan.md` together form the complete specification: PRD answers *what* and *why*; plan.md answers *how*. Any change to scope or success metrics goes here first, then propagates to plan.md.
