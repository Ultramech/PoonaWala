"""
S7 — Plated vs. solid classifier.

Phase 8: Local-first approach — ConvNeXt ONNX when available,
CIELAB color heuristic as fallback. NO VLM fallback (eliminates connection errors).
- Stub frames → default to solid=0.5 with low confidence, no error
- Real frames → ConvNeXt ONNX prediction (if loaded) or color analysis
"""
import time
import logging
import numpy as np

from app.models.schemas import SignalResult
from app.ml.image_utils import fetch_image_bytes
from app.ml.convnext import predict as convnext_predict

logger = logging.getLogger("goldeye.workers.s7")


def _is_stub(url: str) -> bool:
    return not url or url.startswith("local://")


def _color_solid_prob(img_bgr: np.ndarray) -> float:
    """
    CIELAB-based heuristic for solid vs plated.
    Solid gold has higher L*, more saturated b* channel.
    """
    try:
        from app.ml.color import analyze_color
        result = analyze_color(img_bgr)
        best_karat = result.get("best_karat", "plated")
        color_conf = result.get("color_confidence", 0.3)

        if best_karat == "plated":
            # Low solid probability weighted by confidence
            return max(0.1, 0.3 * (1 - color_conf))
        else:
            # Non-plated → solid, weighted by confidence
            return min(0.9, 0.5 + color_conf * 0.4)
    except Exception:
        return 0.5


async def run(session_id: str, frames: list[str], **_) -> SignalResult:
    t0 = time.time()

    real_frames = [f for f in frames if not _is_stub(f)]

    # ── All stub frames → default, no error ──────────────────────────────────
    if not real_frames:
        return SignalResult(
            signal_id="s7_plated_solid",
            confidence=0.2,
            payload={
                "solid_probability": 0.5,
                "plated_probability": 0.5,
                "visual_cues": [],
                "model": "stub_default",
                "frames_scored": 0,
            },
            error=None,
            duration_ms=int((time.time() - t0) * 1000),
            model_version="convnext-v2-solid-v1",
        )

    # ── Real frames → ConvNeXt ONNX first, color fallback ────────────────────
    try:
        import cv2

        solid_probs: list[float] = []
        color_probs: list[float] = []

        for url in real_frames[:4]:
            raw = await fetch_image_bytes(url)
            if raw is None:
                continue
            arr = np.frombuffer(raw, dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is None:
                continue

            # Try ConvNeXt ONNX
            p = convnext_predict(img)
            if p is not None:
                solid_probs.append(p)
            else:
                # Color heuristic fallback
                color_probs.append(_color_solid_prob(img))

        if solid_probs:
            solid_p = float(np.mean(solid_probs))
            confidence = min(0.95, 0.70 + 0.05 * len(solid_probs))
            model_used = "convnext_v2_onnx"
        elif color_probs:
            solid_p = float(np.mean(color_probs))
            confidence = 0.45
            model_used = "cielab_heuristic"
        else:
            solid_p = 0.5
            confidence = 0.2
            model_used = "default"

        return SignalResult(
            signal_id="s7_plated_solid",
            confidence=round(confidence, 3),
            payload={
                "solid_probability": round(solid_p, 3),
                "plated_probability": round(1.0 - solid_p, 3),
                "visual_cues": [],
                "model": model_used,
                "frames_scored": len(solid_probs) + len(color_probs),
            },
            error=None,
            duration_ms=int((time.time() - t0) * 1000),
            model_version="convnext-v2-solid-v1",
        )

    except Exception as e:
        logger.debug(f"[{session_id}] s7_plated_solid exception (non-fatal): {e}")
        return SignalResult(
            signal_id="s7_plated_solid",
            confidence=0.2,
            payload={
                "solid_probability": 0.5,
                "plated_probability": 0.5,
                "visual_cues": [],
                "model": "error_fallback",
                "frames_scored": 0,
            },
            error=None,
            duration_ms=int((time.time() - t0) * 1000),
            model_version="convnext-v2-solid-v1",
        )
