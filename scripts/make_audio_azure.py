"""Record every phrase in public/audio/azure/<variant>/phrases.json with a Microsoft Azure neural voice.

These are the app's "natural" voice; the Piper clips (scripts/make_audio.py) stay as the "classic" voice.
Only missing clips are recorded, so the script can be stopped and re-run at any time; clips no longer in the
list are deleted. Standard library only, no extra packages. See docs/AUDIO.md.

    set AZURE_SPEECH_KEY=...          (PowerShell: $env:AZURE_SPEECH_KEY = "...")
    set AZURE_SPEECH_REGION=westeurope
    python scripts/make_audio_azure.py --dir fr-CA                  # one variant
    python scripts/make_audio_azure.py --dir all                    # every variant
    python scripts/make_audio_azure.py --dir nl-BE --limit 50       # a small sample to listen to first
    python scripts/make_audio_azure.py --dir fr-FR --voice fr-FR-HenriNeural

Free (F0) resources allow 20 requests per minute, so the script paces itself to that unless --rate is raised
(a Standard S0 resource allows 30 per second: --rate 1200 is a safe choice there).
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from xml.sax.saxutils import escape

AUDIO = Path(__file__).resolve().parent.parent / "public" / "audio" / "azure"
# 24 kHz mono MP3 at 48 kbps: Azure's smallest 24 kHz MP3, close to the Piper clips' 40 kbps.
FORMAT = "audio-24khz-48kbitrate-mono-mp3"
VOICES = {  # one voice per variant; change here (or with --voice) and delete the folder's clips to re-record
    "fr-FR": "fr-FR-DeniseNeural",
    "fr-CA": "fr-CA-SylvieNeural",
    "nl-NL": "nl-NL-FennaNeural",
    "nl-BE": "nl-BE-DenaNeural",
}


def ssml(text: str, voice: str, lang: str) -> bytes:
    return (
        f"<speak version='1.0' xml:lang='{lang}'><voice name='{voice}'>{escape(text)}</voice></speak>"
    ).encode("utf-8")


def synthesize(url: str, key: str, body: bytes) -> bytes:
    """One request, retried on throttling (429) and server errors with backoff."""
    for attempt in range(8):
        req = urllib.request.Request(url, data=body, method="POST", headers={
            "Ocp-Apim-Subscription-Key": key,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": FORMAT,
            "User-Agent": "verb-adventure-audio",
        })
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                return res.read()
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                sys.exit(f"Azure refused the key ({e.code}). Check AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.")
            if e.code not in (429, 500, 502, 503, 504):
                raise
            wait = float(e.headers.get("Retry-After") or 0) or min(60, 2 ** attempt)
        except (urllib.error.URLError, TimeoutError):
            wait = min(60, 2 ** attempt)
        print(f"    busy, retrying in {wait:.0f}s")
        time.sleep(wait)
    raise RuntimeError("Azure kept refusing; try again later")


def record(variant: str, voice: str, url: str, key: str, per_minute: float, limit: int | None) -> None:
    out = AUDIO / variant
    phrases = json.loads((out / "phrases.json").read_text(encoding="utf-8"))
    wanted = {p["f"] for p in phrases}
    stale = [f for f in out.glob("*.mp3") if f.name not in wanted]
    for f in stale:
        f.unlink()
    todo = [p for p in phrases if not (out / p["f"]).exists()]
    if limit is not None:
        todo = todo[:limit]
    chars = sum(len(p["t"]) for p in todo)
    eta = len(todo) / per_minute
    print(f"{variant} ({voice}): {len(phrases)} phrases, {len(todo)} to record ({chars:,} characters, "
          f"about {eta:.0f} min at {per_minute:g}/min), {len(stale)} stale clips removed")
    gap = 60 / per_minute
    t0 = time.time()
    for n, p in enumerate(todo, 1):
        started = time.time()
        audio = synthesize(url, key, ssml(p["t"], voice, variant))
        tmp = out / (p["f"] + ".part")  # write then rename: a stopped run never leaves a broken clip behind
        tmp.write_bytes(audio)
        tmp.replace(out / p["f"])
        if n % 100 == 0 or n == len(todo):
            print(f"  {n}/{len(todo)} ({time.time() - t0:.0f}s)")
        time.sleep(max(0.0, gap - (time.time() - started)))
    size = sum(f.stat().st_size for f in out.glob("*.mp3"))
    print(f"done: {len(list(out.glob('*.mp3')))}/{len(wanted)} clips, {size / 1e6:.1f} MB")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True, help="variant folder under public/audio/azure (fr-FR, fr-CA, nl-NL, nl-BE) or 'all'")
    ap.add_argument("--voice", help="Azure voice name, overriding the default for the variant")
    ap.add_argument("--rate", type=float, default=18, help="requests per minute (default 18: under the free tier's 20)")
    ap.add_argument("--limit", type=int, help="record at most this many new clips (for a sample)")
    args = ap.parse_args()

    key, region = os.environ.get("AZURE_SPEECH_KEY"), os.environ.get("AZURE_SPEECH_REGION")
    if not key or not region:
        sys.exit("Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (from the Speech resource's Keys and Endpoint page).")
    url = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"

    variants = list(VOICES) if args.dir == "all" else [args.dir]
    for v in variants:
        if v not in VOICES:
            sys.exit(f"Unknown variant {v!r}; expected one of {', '.join(VOICES)} or 'all'.")
        record(v, args.voice or VOICES[v], url, key, args.rate, args.limit)


if __name__ == "__main__":
    main()
