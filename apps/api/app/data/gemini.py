"""
Gemini API integration for multimodal analysis.
Used for:
1. Audio analysis (S11) — gold solid vs plated detection
2. Image fallback (S3, S7, S8) — color, purity, authenticity
3. Structured decision-making — where ML models haven't been trained
"""
import os
import json
import logging
import asyncio
from typing import Optional
import aiohttp

logger = logging.getLogger("goldeye.gemini")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-2.0-flash-exp"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


async def analyze_audio_gold_detection(
    audio_base64: Optional[str] = None,
    audio_url: Optional[str] = None,
    mime_type: str = "audio/wav"
) -> dict:
    """
    Gemini audio analysis: is this solid gold or plated?
    Returns: {
        "is_solid_gold": bool,
        "confidence": 0.0–1.0,
        "acoustic_signature": str,
        "reason": str
    }
    """
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set; audio analysis skipped")
        return {
            "is_solid_gold": None,
            "confidence": 0.0,
            "acoustic_signature": "unknown",
            "reason": "gemini_api_key_missing"
        }

    if not audio_base64 and not audio_url:
        return {
            "is_solid_gold": None,
            "confidence": 0.0,
            "acoustic_signature": "no_input",
            "reason": "no_audio_provided"
        }

    prompt = """You are an expert in acoustic properties of precious metals.
Analyze this audio recording of a gold item being tapped or struck.

Determine:
1. Is this solid gold or plated gold?
2. Confidence level (0.0–1.0)
3. Acoustic signature (e.g., "clear_ring_tone", "dull_thud", "metallic_resonance")
4. Brief explanation

Solid gold characteristics:
- Clear, sustained ring tone (2–5 second decay)
- Fundamental frequency 600–1200 Hz
- Rich harmonic content
- No sudden dampening

Plated gold characteristics:
- Duller, shorter ring (< 1 second decay)
- Hollow or muted quality
- Fewer harmonics
- Quick attenuation

Return ONLY valid JSON:
{
  "is_solid_gold": boolean,
  "confidence": 0.0 to 1.0,
  "acoustic_signature": "string",
  "reason": "brief explanation"
}"""

    try:
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        },
                        {
                            "inlineData": {
                                "mimeType": mime_type,
                                "data": audio_base64
                            }
                        } if audio_base64 else {
                            "fileData": {
                                "mimeType": mime_type,
                                "fileUri": audio_url
                            }
                        }
                    ]
                }
            ]
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as resp:
                if resp.status != 200:
                    logger.error(f"Gemini audio API error: {resp.status}")
                    return {
                        "is_solid_gold": None,
                        "confidence": 0.0,
                        "acoustic_signature": "api_error",
                        "reason": f"gemini_http_{resp.status}"
                    }

                data = await resp.json()
                if "candidates" not in data or not data["candidates"]:
                    return {
                        "is_solid_gold": None,
                        "confidence": 0.0,
                        "acoustic_signature": "no_response",
                        "reason": "empty_gemini_response"
                    }

                text_response = data["candidates"][0]["content"]["parts"][0]["text"]
                # Extract JSON from response
                text_response = text_response.strip()
                if text_response.startswith("```json"):
                    text_response = text_response[7:]
                if text_response.endswith("```"):
                    text_response = text_response[:-3]

                result = json.loads(text_response.strip())
                return result

    except asyncio.TimeoutError:
        logger.warning("Gemini audio API timeout")
        return {
            "is_solid_gold": None,
            "confidence": 0.0,
            "acoustic_signature": "timeout",
            "reason": "gemini_timeout"
        }
    except Exception as e:
        logger.exception(f"Gemini audio analysis error: {e}")
        return {
            "is_solid_gold": None,
            "confidence": 0.0,
            "acoustic_signature": "error",
            "reason": str(e)
        }


async def analyze_image_fallback(
    image_base64: Optional[str] = None,
    image_url: Optional[str] = None,
    analysis_type: str = "purity"  # "purity", "plated_solid", "authenticity", "weight"
) -> dict:
    """
    Gemini image analysis fallback when ML models unavailable.
    Returns structured result matching signal worker format.
    """
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set; image fallback skipped")
        return {"error": "gemini_api_key_missing", "confidence": 0.0}

    prompts = {
        "purity": """Analyze this gold jewelry image for purity/karat.
Look for:
- Color saturation (deeper yellow = higher karat)
- Hallmark stamps visible
- Surface patina/aging indicators
- Comparison to reference colors

Return JSON:
{
  "estimated_karat": int (8–24),
  "confidence": 0.0–1.0,
  "hallmark_visible": boolean,
  "color_analysis": "string",
  "reason": "string"
}""",

        "plated_solid": """Analyze this gold jewelry to determine if solid or plated.
Look for:
- Edge wear revealing base metal
- Thickness indicators
- Surface uniformity
- Weight relative to size estimate

Return JSON:
{
  "is_solid": boolean,
  "confidence": 0.0–1.0,
  "wear_indicators": "string",
  "reason": "string"
}""",

        "authenticity": """Assess the authenticity of this gold jewelry.
Red flags for counterfeits:
- Hallmark inconsistencies
- Unusual color/patina for stated karat
- Manufacturing defects
- Weight/dimension mismatch

Return JSON:
{
  "is_authentic": boolean,
  "confidence": 0.0–1.0,
  "red_flags": [list of strings],
  "reason": "string"
}""",

        "weight": """Estimate the weight of this gold jewelry.
Based on:
- Visual size/thickness
- Density assumptions
- Item type (ring, pendant, bracelet, etc.)

Return JSON:
{
  "estimated_weight_g": float,
  "confidence": 0.0–1.0,
  "item_type": "string",
  "size_estimate": "string",
  "reason": "string"
}"""
    }

    prompt = prompts.get(analysis_type, prompts["purity"])

    try:
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inlineData": {
                                "mimeType": "image/jpeg",
                                "data": image_base64
                            }
                        } if image_base64 else {
                            "fileData": {
                                "mimeType": "image/jpeg",
                                "fileUri": image_url
                            }
                        }
                    ]
                }
            ]
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as resp:
                if resp.status != 200:
                    logger.error(f"Gemini image API error: {resp.status}")
                    return {"error": f"gemini_http_{resp.status}", "confidence": 0.0}

                data = await resp.json()
                if "candidates" not in data or not data["candidates"]:
                    return {"error": "empty_response", "confidence": 0.0}

                text_response = data["candidates"][0]["content"]["parts"][0]["text"]
                text_response = text_response.strip()
                if text_response.startswith("```json"):
                    text_response = text_response[7:]
                if text_response.endswith("```"):
                    text_response = text_response[:-3]

                result = json.loads(text_response.strip())
                result["gemini_analyzed"] = True
                return result

    except asyncio.TimeoutError:
        logger.warning(f"Gemini {analysis_type} API timeout")
        return {"error": "gemini_timeout", "confidence": 0.0}
    except Exception as e:
        logger.exception(f"Gemini {analysis_type} error: {e}")
        return {"error": str(e), "confidence": 0.0}


async def analyze_complex_decision(
    context: dict,
    question: str
) -> dict:
    """
    Use Gemini for complex decision-making when ML signals are unclear.
    E.g., "Should we RECAPTURE or REJECT given these conflicting signals?"
    """
    if not GEMINI_API_KEY:
        return {"decision": None, "reasoning": "gemini_api_key_missing"}

    prompt = f"""You are an expert gold assessment system.
Given this assessment context and question, provide a structured decision.

Context:
{json.dumps(context, indent=2)}

Question: {question}

Respond with JSON:
{{
  "recommendation": "INSTANT|AGENT|RECAPTURE|REJECT",
  "confidence": 0.0–1.0,
  "reasoning": "brief explanation",
  "risk_level": "low|medium|high"
}}"""

    try:
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ]
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as resp:
                if resp.status != 200:
                    return {"decision": None, "error": f"http_{resp.status}"}

                data = await resp.json()
                text_response = data["candidates"][0]["content"]["parts"][0]["text"]
                text_response = text_response.strip()
                if text_response.startswith("```json"):
                    text_response = text_response[7:]
                if text_response.endswith("```"):
                    text_response = text_response[:-3]

                return json.loads(text_response.strip())

    except Exception as e:
        logger.exception(f"Gemini decision error: {e}")
        return {"decision": None, "error": str(e)}


def _build_frame_prompts(gold_price_24k: float = 0.0) -> dict:
    """Build per-step evaluation prompts, optionally embedding the live gold price."""
    price_line = ""
    if gold_price_24k > 0:
        price_line = f"\nCurrent live gold price (IBJA): ₹{gold_price_24k:,.0f}/g for 24K gold.\n"

    return {
        "top": f"""You are a strict but fair gold loan assessment agent evaluating a photo taken by a customer.
This should be a TOP-DOWN (overhead) shot of gold jewelry placed flat on a surface.
A ₹10 rupee coin may or may not be present — it is OPTIONAL and its absence must NOT cause rejection.

Scoring logic (compute quality_score 0.0–1.0):
  +0.30  jewelry clearly visible and recognisable
  +0.20  image in sharp focus (not blurry)
  +0.20  good lighting (not too dark, not overexposed / washed out)
  +0.15  top-down / overhead angle (not a steep side-angle)
  +0.10  ₹10 coin present (optional scale reference — adds confidence)
  +0.05  full piece fits inside the frame
  Deduct 0.25 if jewelry is barely or not visible at all.

approved = true if quality_score >= 0.55 AND jewelry is at least partially visible.
Reject (approved=false) only if the jewelry cannot be properly assessed (blurry, too dark, not visible).

Return ONLY valid JSON (no markdown fences):
{{
  "approved": boolean,
  "quality_score": 0.0-1.0,
  "feedback": "One direct sentence. If approved, compliment and note any hallmarks/item type seen. If rejected, tell user exactly what to fix.",
  "issues": ["list only real blocking issues, omit coin absence"],
  "detected": {{
    "jewelry_visible": boolean,
    "coin_visible": boolean,
    "in_focus": boolean,
    "good_lighting": boolean,
    "top_down_angle": boolean,
    "item_type": "ring|bangle|chain|pendant|earring|bracelet|other|unknown"
  }}
}}""",

        "45deg": f"""You are a gold loan assessment agent evaluating a 45-DEGREE ANGLE photo of gold jewelry.
The goal: verify depth and thickness of the piece are clearly visible.

Scoring logic (quality_score 0.0–1.0):
  +0.30  jewelry clearly visible
  +0.25  angled view (not flat top-down, not purely side-on) showing 3D form
  +0.20  depth or thickness visible
  +0.15  in focus
  +0.10  good lighting
  Deduct 0.30 if jewelry is not visible; 0.15 if angle is wrong (flat or side).

approved = true if quality_score >= 0.55 AND jewelry visible.

Return ONLY valid JSON:
{{
  "approved": boolean,
  "quality_score": 0.0-1.0,
  "feedback": "One direct sentence.",
  "issues": [],
  "detected": {{
    "jewelry_visible": boolean,
    "angle_correct": boolean,
    "depth_visible": boolean,
    "in_focus": boolean,
    "good_lighting": boolean
  }}
}}""",

        "side": f"""You are a gold loan assessment agent evaluating a SIDE/PROFILE view of gold jewelry.
Goal: clearly show thickness and cross-section of the piece.

Scoring logic (quality_score 0.0–1.0):
  +0.30  jewelry visible
  +0.30  side profile view (not top-down, not angled)
  +0.20  thickness/cross-section clearly visible
  +0.15  in focus
  +0.05  good lighting
  Deduct 0.30 if jewelry not visible; 0.20 if angle is wrong.

approved = true if quality_score >= 0.55.

Return ONLY valid JSON:
{{
  "approved": boolean,
  "quality_score": 0.0-1.0,
  "feedback": "One direct sentence.",
  "issues": [],
  "detected": {{
    "jewelry_visible": boolean,
    "side_profile_visible": boolean,
    "thickness_visible": boolean,
    "in_focus": boolean
  }}
}}""",

        "macro": f"""You are an expert gold hallmark examiner evaluating a MACRO/CLOSE-UP photo of gold jewelry.
Goal: identify BIS hallmark, karat purity markings, HUID code, or maker's marks.
{price_line}
Hallmark knowledge:
- BIS logo looks like a triangular mark with "BIS" text
- Karat: "24K", "22K", "18K", "14K", "9K" or equivalent fineness "999", "958", "916", "750", "585", "375"
- HUID is a 6-character alphanumeric code (e.g. "AB1234")
- Maker's mark: brand or manufacturer initials

Scoring logic (quality_score 0.0–1.0):
  +0.25  any hallmark or marking visible
  +0.25  marking is sharp and in focus
  +0.20  BIS logo clearly visible
  +0.15  karat or fineness number readable
  +0.10  good lighting (no glare, no shadow on stamp)
  +0.05  HUID code visible
  Deduct 0.30 if image is so blurry nothing can be read.

approved = true if quality_score >= 0.45 (even partial visibility of a marking counts).
{"Estimated price per gram at detected karat: use price_line above multiplied by (karat/24)." if gold_price_24k > 0 else ""}

Return ONLY valid JSON:
{{
  "approved": boolean,
  "quality_score": 0.0-1.0,
  "feedback": "One sentence: state exactly what hallmark was found (e.g. '22K BIS hallmark detected — estimated ₹X,XXX/g at current rate') or what to fix.",
  "issues": [],
  "detected": {{
    "hallmark_visible": boolean,
    "karat_marking": "22K" or "18K" or "916" etc or null,
    "karat_numeric": number or null,
    "bis_logo": boolean,
    "huid_code": "string or null",
    "in_focus": boolean,
    "readable": boolean,
    "estimated_price_per_g": number or null
  }}
}}""",

        "selfie": f"""You are a gold loan assessment agent evaluating a SELFIE photo for identity + anti-fraud.
The selfie must show a person holding or wearing the same gold jewelry assessed in previous steps.

Scoring logic (quality_score 0.0–1.0):
  +0.35  human face clearly visible and in focus
  +0.25  gold jewelry visible in the same frame
  +0.20  face well-lit (not in shadow, not overexposed)
  +0.10  photo appears live (not a photo-of-a-photo, no screen glare)
  +0.10  jewelry and face both sharp
  Deduct 0.35 if no face visible; 0.20 if no jewelry visible.

approved = true if quality_score >= 0.55 AND face is visible.

Return ONLY valid JSON:
{{
  "approved": boolean,
  "quality_score": 0.0-1.0,
  "feedback": "One direct sentence.",
  "issues": [],
  "detected": {{
    "face_visible": boolean,
    "jewelry_visible": boolean,
    "in_focus": boolean,
    "good_lighting": boolean,
    "appears_live": boolean
  }}
}}""",

        "video": """{
  "approved": true,
  "quality_score": 0.8,
  "feedback": "Video received — motion analysis will run during full assessment.",
  "issues": [],
  "detected": {"jewelry_visible": true}
}""",

        "audio": """{
  "approved": true,
  "quality_score": 0.8,
  "feedback": "Audio received — acoustic resonance analysis will run during full assessment.",
  "issues": [],
  "detected": {}
}""",
    }


# Static default (no price context); overridden at request time when price is available
_FRAME_PROMPTS = _build_frame_prompts(gold_price_24k=0.0)


async def evaluate_frame(image_base64: str, frame_type: str) -> dict:
    """
    Gemini agent evaluates a captured frame for quality and correctness.
    Returns approval status + actionable feedback to show the user.
    Injects live IBJA gold price into the macro prompt for price estimation.
    """
    import re

    # video/audio: return static approved response without calling Gemini
    if frame_type in ("video", "audio"):
        static = _FRAME_PROMPTS.get(frame_type, "{}")
        try:
            return json.loads(static)
        except Exception:
            return {"approved": True, "quality_score": 0.8, "feedback": "Received", "issues": [], "detected": {}}

    if not GEMINI_API_KEY:
        return {
            "approved": True,
            "quality_score": 0.7,
            "feedback": "Image captured (offline mode — set GEMINI_API_KEY for live evaluation)",
            "issues": [],
            "detected": {},
        }

    # Build price-injected prompts for this request
    try:
        from app.decision.ibja import current_price_24k
        live_price = current_price_24k()
    except Exception:
        live_price = 0.0

    prompts = _build_frame_prompts(gold_price_24k=live_price)
    prompt = prompts.get(frame_type, prompts["top"])

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {"inlineData": {"mimeType": "image/jpeg", "data": image_base64}},
            ]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json",
        },
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30),
            ) as resp:
                if resp.status != 200:
                    body = await resp.text()
                    logger.error(f"Gemini evaluate_frame HTTP {resp.status}: {body[:300]}")
                    return {"approved": True, "quality_score": 0.6, "feedback": "Evaluation unavailable — image accepted", "issues": [], "detected": {}}

                data = await resp.json()
                if "candidates" not in data or not data["candidates"]:
                    logger.error(f"Gemini returned no candidates: {json.dumps(data)[:300]}")
                    return {"approved": True, "quality_score": 0.6, "feedback": "No evaluation returned — image accepted", "issues": [], "detected": {}}

                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                logger.info(f"Gemini raw response [{frame_type}]: {text[:200]}")

                # Strip markdown fences if present
                if text.startswith("```json"):
                    text = text[7:]
                if text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()

                # Try direct parse first
                try:
                    result = json.loads(text)
                except json.JSONDecodeError:
                    # Fallback: extract first JSON object with regex
                    match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text, re.DOTALL)
                    if match:
                        result = json.loads(match.group())
                    else:
                        logger.error(f"Could not parse Gemini response as JSON: {text[:200]}")
                        return {"approved": True, "quality_score": 0.6, "feedback": "Image accepted", "issues": [], "detected": {}}

                # Ensure all required fields exist
                result.setdefault("approved", True)
                result.setdefault("quality_score", 0.7)
                result.setdefault("feedback", "Image evaluated")
                result.setdefault("issues", [])
                result.setdefault("detected", {})

                # Clamp quality_score to [0.0, 1.0]
                result["quality_score"] = max(0.0, min(1.0, float(result["quality_score"])))

                # For macro: compute estimated price per gram if karat detected and price available
                if frame_type == "macro" and live_price > 0:
                    detected = result.get("detected", {})
                    karat_num = detected.get("karat_numeric")
                    if karat_num is None:
                        # Try parsing from karat_marking string
                        km = detected.get("karat_marking") or ""
                        import re as _re
                        m = _re.search(r"(\d{1,2})[Kk]", km)
                        if m:
                            karat_num = int(m.group(1))
                        else:
                            # fineness like "916" → 22K, "750" → 18K
                            m2 = _re.search(r"(\d{3})", km)
                            if m2:
                                fineness = int(m2.group(1))
                                karat_num = round(fineness * 24 / 1000)

                    if karat_num and 8 <= karat_num <= 24:
                        price_per_g = round(live_price * karat_num / 24, 0)
                        detected["estimated_price_per_g"] = price_per_g
                        detected["karat_numeric"] = karat_num
                        # Enrich feedback with price if hallmark was found
                        if detected.get("hallmark_visible") and "₹" not in result["feedback"]:
                            result["feedback"] += f" Estimated ₹{int(price_per_g):,}/g at current IBJA rate."

                logger.info(f"Frame eval [{frame_type}]: approved={result['approved']}, score={result['quality_score']}")
                return result

    except asyncio.TimeoutError:
        logger.warning("Gemini evaluate_frame timeout")
        return {"approved": True, "quality_score": 0.5, "feedback": "Evaluation timed out — image accepted", "issues": [], "detected": {}}
    except Exception as e:
        logger.exception(f"Gemini evaluate_frame error: {e}")
        return {"approved": True, "quality_score": 0.5, "feedback": "Could not evaluate — image accepted", "issues": [], "detected": {}}
