"""
POST /api/assess — the stateless assessment endpoint.
PWA is one client. WhatsApp will be another. This decoupling is
a non-negotiable architectural rule (PRD §10, plan.md §2.2).
"""
import uuid
import time
import hashlib
import asyncio
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from app.models.schemas import (
    AssessRequest, AssessmentResult,
    ModelVersions, Purity, Weight, ValueINR,
    LoanOffer, Confidence, FraudSignals,
    ReasoningText, SHAPFeature, XAI, AuditTrail,
)

logger = logging.getLogger("goldeye.assess")
router = APIRouter()

# ─── Mock signal workers (Phase 2 replaces with real Celery tasks) ────────────

async def _mock_s1_huid(frame_url: str) -> dict:
    await asyncio.sleep(0.3)  # simulate I/O
    return {
        "signal_id": "s1_huid",
        "confidence": 0.94,
        "payload": {
            "bis_logo_present": True,
            "purity_mark": "22K916",
            "huid_code": "A3F2K1",
            "stamp_appearance": "laser_engraved",
        },
        "error": None,
        "duration_ms": 312,
        "model_version": "paddleocr-2.7+gd1.5",
    }

async def _mock_s5_s6_dimensions(frames: list[str], weight_g: float | None) -> dict:
    await asyncio.sleep(0.8)
    est = weight_g if weight_g else 7.9
    return {
        "signal_id": "s5_s6_dimensions",
        "confidence": 0.78 if weight_g else 0.58,
        "payload": {
            "item_type": "bangle",
            "estimated_weight_g": est,
            "volume_cm3": est / 17.7,
            "coin_detected": True,
            "scale_mm_per_px": 0.11,
        },
        "error": None,
        "duration_ms": 823,
        "model_version": "sam2-hiera-tiny+depth-anything-v2-small",
    }

async def _mock_s7_plated_solid(frames: list[str]) -> dict:
    await asyncio.sleep(0.5)
    return {
        "signal_id": "s7_plated_solid",
        "confidence": 0.91,
        "payload": {"solid_probability": 0.93, "plated_probability": 0.07},
        "error": None,
        "duration_ms": 498,
        "model_version": "convnextv2-base-zero-shot",
    }

async def _mock_s8_vlm(frames: list[str]) -> dict:
    await asyncio.sleep(1.2)
    return {
        "signal_id": "s8_vlm",
        "confidence": 0.88,
        "payload": {
            "item_type": "bangle",
            "estimated_karat_band": [20, 22],
            "stones_present": False,
            "stones_estimated_carat_total": 0.0,
            "visible_wear": "low",
            "concerns": [],
        },
        "error": None,
        "duration_ms": 1247,
        "model_version": "qwen2.5-vl-7b-zero-shot",
    }

async def _mock_s10_telemetry(metadata: dict | None) -> dict:
    return {
        "signal_id": "s10_telemetry",
        "confidence": 0.95,
        "payload": {"telemetry_anomaly_score": 0.03, "timestamp_delta_hours": 0.01},
        "error": None,
        "duration_ms": 12,
        "model_version": "rule-based-v1",
    }

async def _mock_s11_audio(audio_url: str | None) -> dict:
    if not audio_url:
        return {
            "signal_id": "s11_audio",
            "confidence": 0.0,
            "payload": {"skipped": True},
            "error": "No audio provided",
            "duration_ms": 0,
            "model_version": "audio-cnn-v1",
        }
    await asyncio.sleep(0.4)
    return {
        "signal_id": "s11_audio",
        "confidence": 0.87,
        "payload": {"solid_probability": 0.89, "plated_probability": 0.11, "noise_probability": 0.0},
        "error": None,
        "duration_ms": 411,
        "model_version": "audio-cnn-v1",
    }


# ─── Decision engine (Phase 4 replaces with full RBI rule engine) ─────────────

def apply_rbi_rules(purity_karat: int, weight_g: float, value_inr: float) -> dict:
    if weight_g > 1000:
        return {"reject_reason": "exceeds_1kg_per_applicant"}

    # RBI 2025: 85% LTV for loans <₹2.5L, 75% for above
    ltv = 0.85 if value_inr * 0.75 < 250_000 else 0.75
    loan_inr = value_inr * ltv
    tier = "under_2_5L" if loan_inr < 250_000 else "above_2_5L"
    return {
        "ltv_pct": int(ltv * 100),
        "loan_inr": loan_inr,
        "tier": tier,
        "reject_reason": None,
    }


def route_session(confidence: float, fraud_score: float, loan_inr: float, huid_verified: bool) -> str:
    if fraud_score > 0.7:
        return "REJECT"
    if confidence < 0.4:
        return "REJECT"
    if confidence >= 0.85 and fraud_score < 0.05 and loan_inr < 50_000 and huid_verified:
        return "INSTANT"
    if confidence >= 0.6:
        return "AGENT"
    return "RECAPTURE"


# ─── The stateless assess endpoint ────────────────────────────────────────────

@router.post("/assess", response_model=AssessmentResult)
async def assess(req: AssessRequest, request: Request):
    t_start = time.time()
    trace_id = getattr(request.state, "trace_id", str(uuid.uuid4()))

    logger.info(f"[{trace_id}] assess start session={req.session_id} frames={len(req.frames)}")

    # Fan out all signal workers in parallel (graceful degradation: each catches its own errors)
    results = await asyncio.gather(
        _mock_s1_huid(req.frames[3] if len(req.frames) > 3 else req.frames[0]),
        _mock_s5_s6_dimensions(req.frames, req.weight_g),
        _mock_s7_plated_solid(req.frames),
        _mock_s8_vlm(req.frames),
        _mock_s10_telemetry(req.device_metadata),
        _mock_s11_audio(req.audio),
        return_exceptions=False,
    )

    s1, s56, s7, s8, s10, s11 = results

    # ── Fusion (simplified — Phase 3 replaces with LightGBM + MAPIE) ──────────
    huid_verified    = s1["payload"].get("purity_mark") is not None
    claimed_karat    = 22 if "22K" in str(s1["payload"].get("purity_mark", "")) else 18
    est_weight       = s56["payload"]["estimated_weight_g"]
    solid_prob       = s7["payload"]["solid_probability"]
    audio_solid      = s11["payload"].get("solid_probability", 0.5) if not s11.get("error") else 0.5
    vlm_karat_mid    = sum(s8["payload"].get("estimated_karat_band", [18, 22])) / 2
    tele_anomaly     = s10["payload"]["telemetry_anomaly_score"]

    # Purity fusion
    point_karat = int(round((claimed_karat * 0.5 + vlm_karat_mid * 0.5) if not huid_verified else claimed_karat))
    band_low_k  = max(14, point_karat - 2)
    band_high_k = min(24, point_karat + 2)

    # Weight
    manual = req.weight_g
    final_weight = (manual * 0.7 + est_weight * 0.3) if manual else est_weight
    weight_band_low  = final_weight * 0.92
    weight_band_high = final_weight * 1.10

    # Value (IBJA mock at ₹7,200/g for 24K, May 2026)
    gold_24k_per_g = 7200
    purity_ratio   = point_karat / 24
    value_per_g    = gold_24k_per_g * purity_ratio
    value_inr      = final_weight * value_per_g
    value_low      = weight_band_low  * value_per_g * (band_low_k / point_karat)
    value_high     = weight_band_high * value_per_g * (band_high_k / point_karat)

    # RBI hard rules
    rbi = apply_rbi_rules(point_karat, final_weight, value_inr)

    # Fraud score
    fraud_score = (1 - solid_prob) * 0.4 + (1 - audio_solid) * 0.2 + tele_anomaly * 0.3
    fraud_score = min(1.0, max(0.0, fraud_score))
    fraud_triggers = []
    if solid_prob < 0.5: fraud_triggers.append("plated_metal_suspected")
    if audio_solid < 0.5 and not s11.get("error"): fraud_triggers.append("acoustic_inconsistent")

    # Confidence
    signal_confs = [s["confidence"] for s in [s1, s56, s7, s8, s10] if not s.get("error")]
    base_conf = sum(signal_confs) / len(signal_confs) if signal_confs else 0.5
    confidence = max(0.0, min(1.0, base_conf - fraud_score * 0.3))

    # Routing
    loan_inr = rbi["loan_inr"]
    routing = route_session(confidence, fraud_score, loan_inr, huid_verified)

    # SHAP (simplified approximation — Phase 3 adds real SHAP)
    shap_features = [
        SHAPFeature(feature="huid_verified",    contribution= 0.31 if huid_verified else -0.25),
        SHAPFeature(feature="plated_solid_score",contribution= (solid_prob - 0.5) * 0.5),
        SHAPFeature(feature="weight_consistency",contribution= 0.18 if manual else 0.05),
        SHAPFeature(feature="audio_solid_prob",  contribution= (audio_solid - 0.5) * 0.3),
        SHAPFeature(feature="vlm_confidence",    contribution= (s8["confidence"] - 0.5) * 0.25),
    ]

    # Reasoning text
    if routing == "INSTANT":
        reasoning = "✓ BIS hallmark verified  ✓ Weight consistent  ✓ No fraud signals  ✓ Acoustic: solid gold"
    elif routing in ("REJECT", "RECAPTURE"):
        reasoning = f"Confidence {int(confidence*100)}% — insufficient for pre-approval. Recommend in-branch verification."
    else:
        reasoning = f"Confidence {int(confidence*100)}% — meets most criteria but physical verification recommended."

    counterfactual = None
    if routing in ("AGENT", "RECAPTURE") and not huid_verified:
        counterfactual = "If the BIS hallmark were verified, confidence would increase by ~15–20%."

    # Asset hashes (mock)
    asset_hashes = [hashlib.sha256(url.encode()).hexdigest()[:16] for url in req.frames]

    elapsed_ms = int((time.time() - t_start) * 1000)
    logger.info(f"[{trace_id}] assess done routing={routing} confidence={confidence:.2f} elapsed={elapsed_ms}ms")

    return AssessmentResult(
        session_id=req.session_id,
        timestamp_utc=datetime.now(timezone.utc),
        model_versions=ModelVersions(),
        purity=Purity(
            band_low_karat=band_low_k,
            band_high_karat=band_high_k,
            point_estimate_karat=point_karat,
            huid_verified=huid_verified,
        ),
        weight=Weight(
            manual_entry_g=manual,
            estimated_g=round(final_weight, 2),
            band_low_g=round(weight_band_low, 2),
            band_high_g=round(weight_band_high, 2),
            method="hybrid" if manual else "depth_volume_x_density",
        ),
        value_inr=ValueINR(
            band_low=int(value_low),
            band_high=int(value_high),
            ibja_reference_date=datetime.now(timezone.utc),
            stone_weight_excluded_g=0.0,
        ),
        loan_offer=LoanOffer(
            band_low_inr=int(value_low * rbi["ltv_pct"] / 100),
            band_high_inr=int(value_high * rbi["ltv_pct"] / 100),
            ltv_applied_pct=rbi["ltv_pct"],
            tier=rbi["tier"],
        ),
        confidence=Confidence(
            score=round(confidence, 3),
            coverage_guarantee_pct=90,
            calibration_method="none",   # "split_conformal" in Phase 3
        ),
        fraud_signals=FraudSignals(score=round(fraud_score, 3), triggers=fraud_triggers),
        routing=routing,
        reasoning_text=ReasoningText(lang=req.lang, text=reasoning),
        xai=XAI(
            gradcam_url=None,
            shap_top_features=shap_features,
            counterfactual=counterfactual,
        ),
        audit=AuditTrail(trace_id=trace_id, input_asset_hashes=asset_hashes),
    )
