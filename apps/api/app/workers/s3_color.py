"""
S3 — CIELAB colour analysis signal worker.

Pipeline:
  1. Fetch the top-down frame (frames[0]) and, if available, the 45° frame.
  2. White-balance each frame using the ₹10 coin's neutral gray
     (coin L*≈72 acts as a grey-card reference).
  3. Run CIELAB analysis on the white-balanced image → karat probability vector.
  4. Aggregate across frames (weighted by per-frame confidence).
  5. Return the best-karat estimate, the full probability vector, and confidence.

PRD references: S3 signal, Phase 5 (§10.1 of implementation_plan.md).
"""
import time
import logging
from typing import Any

from app.models.schemas import SignalResult
from app.ml.color import analyze_color, white_balance_coin
from app.ml.image_utils import fetch_image_bytes

logger = logging.getLogger("goldeye.workers.s3_color")


async def run(session_id: str, frames: list[str]) -> SignalResult:
    """
    Args:
        session_id: for logging / tracing.
        frames: list of image URLs or base64 data-URIs (same as AssessRequest.frames).
                Only the first two (top-down + 45°) are used.
    """
    t0 = time.time()
    try:
        import cv2
        import numpy as np

        results: list[dict] = []

        # Use top-down (0) and 45-degree (1) frames; macro (3) is too zoomed for colour
        candidate_indices = [0, 1]
        for idx in candidate_indices:
            if idx >= len(frames):
                continue
            url = frames[idx]
            if not url or url.startswith("local://"):
                continue

            raw = await fetch_image_bytes(url)
            if raw is None:
                continue

            arr = np.frombuffer(raw, dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is None:
                continue

            # White-balance correction using coin as grey reference
            balanced = white_balance_coin(img)
            if balanced is None:
                balanced = img  # fallback: no correction

            analysis = analyze_color(balanced)
            if "error" not in analysis and analysis.get("color_confidence", 0) > 0.05:
                results.append(analysis)

        if not results:
            return SignalResult(
                signal_id="s3_color",
                confidence=0.0,
                payload={"reason": "no_usable_frames", "karat_probabilities": {}},
                error="no_usable_frames",
                duration_ms=int((time.time() - t0) * 1000),
                model_version="cielab-heuristic-v1",
            )

        # Weighted aggregate: weight by color_confidence
        total_weight = sum(r["color_confidence"] for r in results)
        if total_weight == 0:
            total_weight = len(results)

        # Merge karat probability vectors
        all_keys = set()
        for r in results:
            all_keys.update(r.get("karat_probabilities", {}).keys())

        merged_probs: dict[str, float] = {}
        for k in all_keys:
            merged_probs[k] = sum(
                r.get("karat_probabilities", {}).get(k, 0.0) * r["color_confidence"]
                for r in results
            ) / total_weight

        best_karat = max(merged_probs, key=lambda x: merged_probs[x]) if merged_probs else "22K"
        # Convert "22K" → 22, "plated" → 0
        from app.ml.color import KARAT_VALUES
        best_karat_int = KARAT_VALUES.get(best_karat, 18)

        mean_confidence = total_weight / len(results)
        aggregate_confidence = float(np.clip(mean_confidence, 0.0, 1.0))

        return SignalResult(
            signal_id="s3_color",
            confidence=round(aggregate_confidence, 3),
            payload={
                "best_karat": best_karat,
                "best_karat_int": best_karat_int,
                "karat_probabilities": {k: round(v, 4) for k, v in merged_probs.items()},
                "frames_analyzed": len(results),
                "mean_lab": results[0].get("mean_lab", []),
            },
            error=None,
            duration_ms=int((time.time() - t0) * 1000),
            model_version="cielab-heuristic-v1",
        )

    except Exception as exc:
        logger.exception(f"[{session_id}] S3 color analysis failed: {exc}")
        return SignalResult(
            signal_id="s3_color",
            confidence=0.0,
            payload={},
            error=str(exc),
            duration_ms=int((time.time() - t0) * 1000),
            model_version="cielab-heuristic-v1",
        )
