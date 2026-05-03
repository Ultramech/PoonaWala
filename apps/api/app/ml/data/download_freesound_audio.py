import requests
import subprocess
from pathlib import Path
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
import numpy as np

import os
# Read from environment: export FREESOUND_API_KEY=your_key
API_KEY = os.environ.get("FREESOUND_API_KEY", "")

OUT_DIR = Path("ml/audio/samples")
TMP_DIR = Path("/tmp/goldeye_freesound")
SAMPLE_RATE = 22050

# 🎯 GOLD COIN FOCUSED QUERIES
SOLID_QUERIES = [
    "gold coin ping test",
    "coin spin sound clear",
    "coin ringing metal",
    "coin drop ringing",
    "metal ringing clear tone",
]

PLATED_QUERIES = [
    "brass coin sound",
    "steel coin drop",
    "hollow metal hit",
    "metal dull thud",
    "cheap metal knock",
]

MAX_PER_QUERY = 8


# 🔍 SEARCH
def search_sounds(query):
    url = "https://freesound.org/apiv2/search/text/"
    params = {
        "query": query,
        "token": API_KEY,
        "page_size": MAX_PER_QUERY,
        "filter": "duration:[0.2 TO 3]"
    }
    r = requests.get(url, params=params)
    r.raise_for_status()
    return r.json()["results"]


def get_preview_url(sound_id):
    url = f"https://freesound.org/apiv2/sounds/{sound_id}/"
    r = requests.get(url, params={"token": API_KEY})
    r.raise_for_status()
    return r.json()["previews"]["preview-hq-mp3"]


def download_file(url, path):
    r = requests.get(url)
    with open(path, "wb") as f:
        f.write(r.content)


def convert_to_wav(input_path, output_path):
    subprocess.run([
        "ffmpeg", "-y", "-i", str(input_path),
        "-ar", str(SAMPLE_RATE),
        "-ac", "1",
        str(output_path)
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


# 🧠 SOFT CLASSIFIER (FIXED)
def classify_gold_like(audio: AudioSegment):
    samples = np.array(audio.get_array_of_samples()).astype(np.float32) / 32768.0
    sr = audio.frame_rate

    if len(samples) < sr * 0.15:
        return "plated"

    spectrum = np.abs(np.fft.rfft(samples[:sr]))
    total_power = np.sum(spectrum**2) + 1e-9
    dominant = np.max(spectrum)**2

    fundamental_ratio = dominant / total_power

    seg1 = samples[:int(sr * 0.1)]
    seg2 = samples[int(sr * 0.1):int(sr * 0.2)]

    rms1 = np.sqrt(np.mean(seg1**2)) + 1e-9
    rms2 = np.sqrt(np.mean(seg2**2)) + 1e-9

    decay_rate = rms2 / rms1

    # 🔥 scoring (NOT strict)
    score = 0

    if fundamental_ratio > 0.05:
        score += 1
    if fundamental_ratio > 0.10:
        score += 1

    if decay_rate < 0.95:
        score += 1
    if decay_rate < 0.85:
        score += 1

    if score >= 2:
        return "solid"
    else:
        return "plated"


# ✂️ SLICE + CLASSIFY
def slice_pings(wav_path, solid_dir, plated_dir, prefix):
    audio = AudioSegment.from_wav(str(wav_path))
    segments = detect_nonsilent(audio, min_silence_len=300, silence_thresh=-40)

    solid_dir.mkdir(parents=True, exist_ok=True)
    plated_dir.mkdir(parents=True, exist_ok=True)

    saved_solid = 0
    saved_plated = 0

    for i, (start, end) in enumerate(segments):
        chunk = audio[max(0, start - 100):min(len(audio), end + 500)]

        if len(chunk) < 1500:
            chunk += AudioSegment.silent(duration=1500 - len(chunk))
        else:
            chunk = chunk[:1500]

        label = classify_gold_like(chunk)

        if label == "solid":
            out = solid_dir / f"{prefix}_{saved_solid:04d}.wav"
            chunk.export(out, format="wav")
            saved_solid += 1
        else:
            out = plated_dir / f"{prefix}_{saved_plated:04d}.wav"
            chunk.export(out, format="wav")
            saved_plated += 1

    print(f"  ✓ Solid: {saved_solid} | Plated: {saved_plated}")
    return saved_solid, saved_plated


# 🔄 PROCESS
def process_queries(queries, label):
    TMP_DIR.mkdir(exist_ok=True)

    total_solid = 0
    total_plated = 0

    for q in queries:
        print(f"\n🔍 {q}")

        try:
            results = search_sounds(q)
        except Exception as e:
            print("  ✗ Search failed:", e)
            continue

        for sound in results:
            sid = sound["id"]

            mp3 = TMP_DIR / f"{sid}.mp3"
            wav = TMP_DIR / f"{sid}.wav"

            try:
                url = get_preview_url(sid)
                download_file(url, mp3)
                convert_to_wav(mp3, wav)

                s, p = slice_pings(
                    wav,
                    OUT_DIR / "solid",
                    OUT_DIR / "plated",
                    f"{label}_{sid}"
                )

                total_solid += s
                total_plated += p

            except Exception as e:
                print(f"  ✗ Failed {sid}: {e}")

    return total_solid, total_plated


# 🚀 MAIN
def main():
    print("\n🚀 GOLD COIN DATASET BUILDER (FREESOUND)\n")

    s1, p1 = process_queries(SOLID_QUERIES, "solid")
    s2, p2 = process_queries(PLATED_QUERIES, "plated")

    total_solid = s1 + s2
    total_plated = p1 + p2

    print(f"""
====================================
DONE
solid  → {total_solid}
plated → {total_plated}
total  → {total_solid + total_plated}
====================================
""")


if __name__ == "__main__":
    main()