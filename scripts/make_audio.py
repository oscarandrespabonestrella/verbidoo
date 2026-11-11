"""Record every French phrase in public/audio/fr/phrases.json with an open-source Piper voice.

Only missing clips are recorded, so re-running after a content change is quick. Clips no longer in the list
are deleted. Usage (see docs/AUDIO.md):

    python scripts/make_audio.py --voice path/to/fr_FR-siwis-medium.onnx
"""
import argparse
import json
import time
from pathlib import Path

import lameenc
from piper import PiperVoice

OUT = Path(__file__).resolve().parent.parent / "public" / "audio" / "fr"
BITRATE = 40  # kbps, mono: clear speech at about 5 KB per second


def mp3(pcm: bytes, rate: int) -> bytes:
    enc = lameenc.Encoder()
    enc.set_bit_rate(BITRATE)
    enc.set_in_sample_rate(rate)
    enc.set_channels(1)
    enc.set_quality(2)  # 2 = high quality, slower encode
    return enc.encode(pcm) + enc.flush()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", required=True, help="Piper .onnx voice file (its .onnx.json must sit next to it)")
    args = ap.parse_args()

    phrases = json.loads((OUT / "phrases.json").read_text(encoding="utf-8"))
    wanted = {p["f"] for p in phrases}
    stale = [f for f in OUT.glob("*.mp3") if f.name not in wanted]
    for f in stale:
        f.unlink()

    todo = [p for p in phrases if not (OUT / p["f"]).exists()]
    print(f"{len(phrases)} phrases, {len(todo)} to record, {len(stale)} stale clips removed")
    if not todo:
        return

    voice = PiperVoice.load(args.voice)
    rate = voice.config.sample_rate
    pad = b"\x00\x00" * int(rate * 0.05)  # 50 ms of silence so playback never clips the first sound
    t0 = time.time()
    for n, p in enumerate(todo, 1):
        pcm = b"".join(chunk.audio_int16_bytes for chunk in voice.synthesize(p["t"]))
        (OUT / p["f"]).write_bytes(mp3(pad + pcm + pad, rate))
        if n % 500 == 0 or n == len(todo):
            print(f"  {n}/{len(todo)} ({time.time() - t0:.0f}s)")
    size = sum(f.stat().st_size for f in OUT.glob("*.mp3"))
    print(f"done: {len(wanted)} clips, {size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
