# French audio

Every French phrase the app can say plays from a recording made with an open-source voice. It sounds the same on every device, works offline once cached, and never depends on the device having a French voice installed. English, Spanish and Portuguese (the children's own languages) use the browser's voices.

- **Voice:** "siwis" (medium) for [Piper](https://github.com/OHF-Voice/piper1-gpl), trained on the [SIWIS French Speech Synthesis Database](https://datashare.is.ed.ac.uk/handle/10283/2353). License **CC BY 4.0**: the credit line is shown in the parent area under *Data & privacy*. Keep it there.
- **Files:** `public/audio/fr/*.mp3`, mono 40 kbps, one per phrase, named after a hash of the text (`clipName` in `src/lib/phrases.ts`). A device downloads only the clips it plays.
- **List:** `public/audio/fr/phrases.json`, generated from `frenchPhrases()`, the single list of everything the app says in French.
- **Guard:** `src/lib/phrases.test.ts` plays every game for every verb, level and French variant, and fails if anything said aloud is missing from the list.
- **Fallback:** if a clip is missing, the browser's French voice is used, if the device has one; otherwise the app stays silent rather than reading French with an English voice.

## After changing verbs, sentences or tenses

```bash
npm run audio:list            # rewrite public/audio/fr/phrases.json
python scripts/make_audio.py --voice path/to/fr_FR-siwis-medium.onnx   # record only what's new; delete unused clips
```

One-time setup for the recorder (Python 3.10+):

```bash
python -m venv .venv-audio && .venv-audio/Scripts/pip install -r scripts/requirements-audio.txt
.venv-audio/Scripts/python -m piper.download_voices --download-dir voices fr_FR-siwis-medium
```

The voice model (~60 MB) only lives on the computer that records; it is never shipped to devices.

## Limitations

- siwis is a **France** French voice; `fr-CA` children hear France pronunciation (their sentence wording still differs).
- The read-along word highlight is estimated from playback progress, so it can be slightly early or late on long sentences.
- Single syllables ("man", "ger") are read as written, as browser voices did before.
