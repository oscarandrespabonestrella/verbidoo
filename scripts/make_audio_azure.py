"""Record the "natural" voice with Microsoft Azure neural voices into public/audio/natural/<variant>/.

The Piper clips (scripts/make_audio.py) stay as the "classic" voice. scripts/make_audio_google.py fills the same
folders with Google voices instead; use one service per folder. Standard library only. See docs/AUDIO.md.

    $env:AZURE_SPEECH_KEY = "..."; $env:AZURE_SPEECH_REGION = "westeurope"
    python scripts/make_audio_azure.py --dir nl-BE --limit 50     # a sample to listen to first
    python scripts/make_audio_azure.py --dir all                  # everything; stop and re-run any time
    python scripts/make_audio_azure.py --dir fr-FR --voice fr-FR-HenriNeural

Free (F0) resources allow 20 requests per minute (about 27 hours for everything), so that is the default pace.
On a Standard (S0) resource (30 per second) use: --rate 1500 --workers 16
"""
import argparse
import os
import sys
import urllib.request
from xml.sax.saxutils import escape

from natural_audio import VARIANTS, record, retrying

FORMAT = "audio-24khz-48kbitrate-mono-mp3"  # Azure's smallest 24 kHz MP3, close to the Piper clips' 40 kbps
VOICES = {
    "fr-FR": "fr-FR-DeniseNeural",
    "fr-CA": "fr-CA-SylvieNeural",
    "nl-NL": "nl-NL-FennaNeural",
    "nl-BE": "nl-BE-DenaNeural",
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True, help=f"{', '.join(VARIANTS)} or 'all'")
    ap.add_argument("--voice", help="Azure voice name, overriding the default for the variant")
    ap.add_argument("--rate", type=float, default=18, help="requests per minute (default 18: under the free tier's 20)")
    ap.add_argument("--workers", type=int, default=1, help="requests in flight (default 1; 16 on S0)")
    ap.add_argument("--limit", type=int, help="record at most this many new clips (for a sample)")
    ap.add_argument("--redo", help="comma-separated phrases to record again, e.g. \"dire,pouvoir\" (exact text)")
    args = ap.parse_args()

    key, region = os.environ.get("AZURE_SPEECH_KEY"), os.environ.get("AZURE_SPEECH_REGION")
    if not key or not region:
        sys.exit("Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (from the Speech resource's Keys and Endpoint page).")
    url = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
    fatal = lambda code: f"Azure refused the key ({code}). Check AZURE_SPEECH_KEY and AZURE_SPEECH_REGION." \
        if code in (401, 403) else None

    for variant in VARIANTS if args.dir == "all" else [args.dir]:
        if variant not in VOICES:
            sys.exit(f"Unknown variant {variant!r}; expected one of {', '.join(VARIANTS)} or 'all'.")
        voice = args.voice or VOICES[variant]

        def synth(text: str, voice=voice, variant=variant) -> bytes:
            body = f"<speak version='1.0' xml:lang='{variant}'><voice name='{voice}'>{escape(text)}</voice></speak>"
            req = urllib.request.Request(url, data=body.encode("utf-8"), method="POST", headers={
                "Ocp-Apim-Subscription-Key": key,
                "Content-Type": "application/ssml+xml",
                "X-Microsoft-OutputFormat": FORMAT,
                "User-Agent": "verb-adventure-audio",
            })

            def call() -> bytes:
                with urllib.request.urlopen(req, timeout=30) as res:
                    return res.read()
            return retrying(call, fatal)

        record(variant, "azure", voice, synth, args.rate, args.workers, args.limit,
               [t.strip() for t in args.redo.split(",")] if args.redo else None)


if __name__ == "__main__":
    main()
