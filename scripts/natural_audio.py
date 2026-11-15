"""Shared loop for the "natural" voice recorders (make_audio_azure.py, make_audio_google.py).

Reads public/audio/natural/<variant>/phrases.json, deletes clips no longer listed, and records the missing ones
with several requests in flight, paced under the service's per-minute limit. Each clip is written to a .part file
and renamed, so a run can be stopped at any moment and simply re-run. voice.json records which service and voice
made the folder (the app does not read it).
"""
import json
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Callable

NATURAL = Path(__file__).resolve().parent.parent / "public" / "audio" / "natural"
VARIANTS = ["fr-FR", "fr-CA", "nl-NL", "nl-BE"]


class Pace:
    """Lets at most `per_minute` calls start per minute, across all threads."""

    def __init__(self, per_minute: float):
        self.gap, self.next, self.lock = 60 / per_minute, time.monotonic(), threading.Lock()

    def wait(self) -> None:
        with self.lock:
            now = time.monotonic()
            slot = max(now, self.next)
            self.next = slot + self.gap
        time.sleep(max(0.0, slot - now))


def record(variant: str, service: str, voice: str, synth: Callable[[str], bytes],
           per_minute: float, workers: int, limit: int | None, redo: list[str] | None = None) -> None:
    out = NATURAL / variant
    phrases = json.loads((out / "phrases.json").read_text(encoding="utf-8"))
    wanted = {p["f"] for p in phrases}
    if redo:  # delete these phrases' clips so they are recorded again below
        texts = {p["t"]: p["f"] for p in phrases}
        unknown = [t for t in redo if t not in texts]
        if unknown:
            raise SystemExit(f"{variant}: not in phrases.json: {', '.join(unknown)} (use the exact text)")
        for t in redo:
            (out / texts[t]).unlink(missing_ok=True)
    stale = [f for f in out.glob("*.mp3") if f.name not in wanted]
    for f in stale:
        f.unlink()

    meta = out / "voice.json"
    previous = json.loads(meta.read_text(encoding="utf-8")) if meta.exists() else None
    current = {"service": service, "voice": voice}
    if previous and previous != current and any(out.glob("*.mp3")):
        print(f"  note: {variant} already has clips from {previous['service']} {previous['voice']}; new clips will "
              f"mix voices. Delete public/audio/natural/{variant}/*.mp3 first to re-record the whole folder.")
    meta.write_text(json.dumps(current) + "\n", encoding="utf-8")

    todo = [p for p in phrases if not (out / p["f"]).exists()]
    if limit is not None:
        todo = todo[:limit]
    chars = sum(len(p["t"]) for p in todo)
    print(f"{variant} ({service} {voice}): {len(phrases)} phrases, {len(todo)} to record ({chars:,} characters, "
          f"at least {len(todo) / per_minute:.0f} min at {per_minute:g}/min), {len(stale)} stale clips removed")
    if not todo:
        return

    pace = Pace(per_minute)

    skipped: list[str] = []

    def one(p: dict) -> None:
        pace.wait()
        try:
            audio = synth(p["t"])
        except NoAudio:
            skipped.append(p["t"])  # left unrecorded: the app plays the classic clip instead
            return
        tmp = out / (p["f"] + ".part")
        tmp.write_bytes(audio)
        tmp.replace(out / p["f"])

    t0, done = time.time(), 0
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(one, p) for p in todo]
        try:
            for f in as_completed(futures):
                f.result()  # re-raises a failed request; finished clips are already saved
                done += 1
                if done % 200 == 0 or done == len(todo):
                    print(f"  {done}/{len(todo)} ({time.time() - t0:.0f}s)")
        except BaseException:
            for f in futures:
                f.cancel()
            raise
    size = sum(f.stat().st_size for f in out.glob("*.mp3"))
    print(f"done: {len(list(out.glob('*.mp3')))}/{len(wanted)} clips, {size / 1e6:.1f} MB")
    if skipped:
        print(f"  no voice from the service for {len(skipped)} (the classic voice plays these): "
              f"{', '.join(sorted(skipped))}")


class NoAudio(Exception):
    """The service only returned silence for a phrase; it is skipped rather than saved as a mute clip."""


def retrying(call: Callable[[], bytes], fatal: Callable[[int], str | None]) -> bytes:
    """Runs one HTTP call, retrying throttling (429) and server errors with backoff. `fatal` names codes to stop on."""
    import sys
    import urllib.error

    for attempt in range(8):
        try:
            return call()
        except urllib.error.HTTPError as e:
            msg = fatal(e.code)
            if msg:
                sys.exit(msg)
            if e.code not in (429, 500, 502, 503, 504):
                raise RuntimeError(f"HTTP {e.code}: {e.read()[:500].decode('utf-8', 'replace')}") from None
            wait = float(e.headers.get("Retry-After") or 0) or min(60, 2 ** attempt)
        except (urllib.error.URLError, TimeoutError):
            wait = min(60, 2 ** attempt)
        print(f"    busy, retrying in {wait:.0f}s")
        time.sleep(wait)
    raise RuntimeError("the service kept refusing; try again later")
