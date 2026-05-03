"""
S11 — PingCoin acoustic resonance classifier.
Phase 2 (MVP): FFT heuristic on PCM WAV audio.
Phase 6: 4-layer 2D CNN on 128-mel log-spectrogram, ONNX export (~500KB).
"""
import time
import logging
from app.models.schemas import SignalResult
from app.ml.audio import classify_audio

logger = logging.getLogger("goldeye.workers.s11")


async def run(session_id: str, audio_url: str | None = None, **_) -> SignalResult:
    t0 = time.time()
    if not audio_url:
        return SignalResult(
            signal_id="s11_audio",
            confidence=0.0,
            payload={"skipped": True},
            error="No audio provided",
            duration_ms=0,
            model_version="fft-heuristic-v1",
        )
    try:
        result = await classify_audio(audio_url)
        confidence = float(result.get("confidence", 0.65))
        if result.get("error"):
            confidence = 0.0

        return SignalResult(
            signal_id="s11_audio",
            confidence=round(confidence, 3),
            payload={
                "solid_probability": result.get("solid_probability", 0.5),
                "plated_probability": result.get("plated_probability", 0.5),
                "dominant_freq_hz": result.get("dominant_freq_hz"),
                "fundamental_ratio": result.get("fundamental_ratio"),
                "decay_rate": result.get("decay_rate"),
            },
            error=result.get("error"),
            duration_ms=int((time.time() - t0) * 1000),
            model_version="fft-heuristic-v1",
        )
    except Exception as e:
        logger.warning(f"[{session_id}] s11_audio failed: {e}")
        return SignalResult(
            signal_id="s11_audio", confidence=0.0, payload={},
            error=str(e), duration_ms=int((time.time() - t0) * 1000),
            model_version="fft-heuristic-v1",
        )
