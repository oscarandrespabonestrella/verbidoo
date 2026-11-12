# Learning-language audio

Every phrase the app can say in a learning language (French, Dutch) plays from a recording made with an open-source voice. It sounds the same on every device, works offline once cached, and never depends on the device having the voice installed. English, Spanish and Portuguese (the children's own languages) use the browser's voices.

| Folder | Variants | Voice | License |
|---|---|---|---|
| `public/audio/fr/` | fr-FR, fr-CA | "siwis" (medium) for [Piper](https://github.com/OHF-Voice/piper1-gpl), trained on the [SIWIS French Speech Synthesis Database](https://datashare.is.ed.ac.uk/handle/10283/2353) | **CC BY 4.0**: the credit line is shown in Settings under *Data & privacy*. Keep it there. |
| `public/audio/nl-NL/` | nl-NL | ["pim" (medium)](https://huggingface.co/rhasspy/piper-voices/tree/main/nl/nl_NL/pim), Netherlands Dutch, one speaker | **CC0** (public domain). Credited in Settings anyway. |
| `public/audio/nl-BE/` | nl-BE | ["rdh" (medium)](https://huggingface.co/rhasspy/piper-voices/tree/main/nl/nl_BE/rdh), Belgian Dutch (Flemish), one speaker | **CC0** (public domain). Credited in Settings anyway. |

- **Folders per variant** come from `audio` in `src/data/targets.ts`. French uses one folder for both variants; Dutch has one per variant, so Belgian children hear a Flemish voice.
- **Files:** `*.mp3`, mono 40 kbps, one per phrase, named after a hash of the text (`clipName` in `src/lib/phrases.ts`). A device downloads only the clips it plays.
- **List:** `phrases.json` in each folder, generated from `targetPhrases()`, the single list of everything the app says in that language.
- **Guard:** `src/lib/phrases.test.ts` plays every game for every verb, level and learning variant, and fails if anything said aloud is missing from the list.
- **Fallback:** if a clip is missing, the browser's voice for that language is used, if the device has one; otherwise the app stays silent rather than reading with the wrong language's voice.

## After changing verbs, sentences or tenses

```bash
npm run audio:list            # rewrite every public/audio/<dir>/phrases.json
python scripts/make_audio.py --voice path/to/fr_FR-siwis-medium.onnx                 # French
python scripts/make_audio.py --voice voices/nl_NL-pim-medium.onnx --dir nl-NL       # Dutch (Netherlands)
python scripts/make_audio.py --voice voices/nl_BE-rdh-medium.onnx --dir nl-BE       # Dutch (Belgium)
```

Each run records only what's new and deletes clips no longer in the list.

One-time setup for the recorder (Python 3.10+):

```bash
python -m venv .venv-audio && .venv-audio/Scripts/pip install -r scripts/requirements-audio.txt
.venv-audio/Scripts/python -m piper.download_voices --download-dir voices fr_FR-siwis-medium nl_NL-pim-medium nl_BE-rdh-medium
```

The voice models (~60 MB each) only live on the computer that records; they are never shipped to devices.

## Limitations

- siwis is a **France** French voice; `fr-CA` children hear France pronunciation (their sentence wording still differs).
- Synthetic voices can stress a word wrongly; the Dutch recordings have not been reviewed by native listeners yet.
- The read-along word highlight is estimated from playback progress, so it can be slightly early or late on long sentences.
- Single syllables ("man", "ger", "ko") are read as written, as browser voices did before.
