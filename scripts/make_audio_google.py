"""Record the "natural" voice with Google Cloud Text-to-Speech into public/audio/natural/<variant>/.

Same folders as scripts/make_audio_azure.py, so the app and the voice switch don't change; use one service per
folder. Google returns plain PCM, which is encoded here to the same mono MP3 as the other clips (needs lameenc,
already in scripts/requirements-audio.txt, so run it with the .venv-audio Python). See docs/AUDIO.md.

    $env:GOOGLE_TTS_API_KEY = "..."
    python scripts/make_audio_google.py --list-voices nl-BE        # what Google offers for a variant
    python scripts/make_audio_google.py --dir nl-BE --limit 50     # a sample to listen to first
    python scripts/make_audio_google.py --dir all                  # everything; stop and re-run any time
    python scripts/make_audio_google.py --dir fr-CA --voice fr-CA-Chirp3-HD-Charon

Default pace follows Google's per-project quotas: 200 requests per minute for Chirp 3 HD voices (about 2.5 hours
for everything), 1,000 for the others such as Neural2 and WaveNet (about 30 minutes).
"""
import argparse
import base64
import io
import json
import os
import sys
import urllib.request
import wave

from natural_audio import VARIANTS, record, retrying

API = "https://texttospeech.googleapis.com/v1"
BITRATE = 48  # kbps mono, like the Azure clips
RATE_HZ = 24000
VOICES = {  # Chirp 3 HD has no child voices; --list-voices shows the alternatives
    # French: a lively male voice that sounds young (chosen after listening; Puck and Fenrir were the alternatives).
    "fr-FR": "fr-FR-Chirp3-HD-Sadachbia",
    "fr-CA": "fr-CA-Chirp3-HD-Sadachbia",
    # Dutch: a female voice.
    "nl-NL": "nl-NL-Chirp3-HD-Aoede",
    "nl-BE": "nl-BE-Chirp3-HD-Aoede",
}


def request(key: str, path: str, body: dict | None = None) -> dict:
    req = urllib.request.Request(f"{API}/{path}", method="POST" if body else "GET",
                                 data=json.dumps(body).encode("utf-8") if body else None,
                                 headers={"X-Goog-Api-Key": key, "Content-Type": "application/json; charset=utf-8"})
    fatal = lambda code: ("Google refused the key (%d). Check GOOGLE_TTS_API_KEY, that the Cloud Text-to-Speech API "
                          "is enabled for its project, and that billing is set up." % code) if code in (401, 403) else None

    def call() -> bytes:
        with urllib.request.urlopen(req, timeout=30) as res:
            return res.read()
    return json.loads(retrying(call, fatal))


def voices(key: str, variant: str) -> list[str]:
    return sorted(v["name"] for v in request(key, f"voices?languageCode={variant}").get("voices", [])
                  if variant in v.get("languageCodes", []))


def to_mp3(wav_bytes: bytes) -> bytes:
    with wave.open(io.BytesIO(wav_bytes)) as w:
        rate, pcm = w.getframerate(), w.readframes(w.getnframes())
    enc = lameenc.Encoder()
    enc.set_bit_rate(BITRATE)
    enc.set_in_sample_rate(rate)
    enc.set_channels(1)
    enc.set_quality(2)
    return enc.encode(pcm) + enc.flush()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", help=f"{', '.join(VARIANTS)} or 'all'")
    ap.add_argument("--voice", help="Google voice name, overriding the default for the variant")
    ap.add_argument("--rate", type=float, help="requests per minute (default: 180 for Chirp 3 HD, 900 otherwise)")
    ap.add_argument("--workers", type=int, default=8, help="requests in flight (default 8)")
    ap.add_argument("--limit", type=int, help="record at most this many new clips (for a sample)")
    ap.add_argument("--list-voices", metavar="VARIANT", help="print Google's voices for a variant and stop")
    args = ap.parse_args()

    key = os.environ.get("GOOGLE_TTS_API_KEY")
    if not key:
        sys.exit("Set GOOGLE_TTS_API_KEY (Google Cloud console > APIs & Services > Credentials > API key, "
                 "restricted to the Cloud Text-to-Speech API).")
    if args.list_voices:
        print("\n".join(voices(key, args.list_voices)) or f"no voices for {args.list_voices}")
        return
    if not args.dir:
        ap.error("--dir is required")
    try:
        global lameenc
        import lameenc  # only recording needs it, so --list-voices works without it
    except ModuleNotFoundError:
        sys.exit("Recording needs the MP3 encoder: python -m pip install lameenc")

    for variant in VARIANTS if args.dir == "all" else [args.dir]:
        if variant not in VOICES:
            sys.exit(f"Unknown variant {variant!r}; expected one of {', '.join(VARIANTS)} or 'all'.")
        voice = args.voice or VOICES[variant]
        if voice not in voices(key, variant):
            sys.exit(f"Google has no voice {voice!r} for {variant}. See: --list-voices {variant}")
        rate = args.rate or (180 if "Chirp3-HD" in voice else 900)

        def synth(text: str, voice=voice, variant=variant) -> bytes:
            res = request(key, "text:synthesize", {
                "input": {"text": text},
                "voice": {"languageCode": variant, "name": voice},
                "audioConfig": {"audioEncoding": "LINEAR16", "sampleRateHertz": RATE_HZ},
            })
            return to_mp3(base64.b64decode(res["audioContent"]))

        record(variant, "google", voice, synth, rate, args.workers, args.limit)


if __name__ == "__main__":
    main()
