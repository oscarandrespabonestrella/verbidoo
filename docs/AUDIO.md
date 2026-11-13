# Learning-language audio

Every phrase the app can say in a learning language (French, Dutch) plays from a recording. There are two recorded voices, and parents pick one per child in **Grown-ups → Preferences → Voice** (a *Listen* button plays a sample):

- **Natural** (default): Microsoft Azure neural voices, one per variant, so fr-CA children hear a Québec accent and nl-BE children a Flemish one.
- **Classic**: open-source Piper voices, as before.

Recordings sound the same on every device, work offline once cached, and never depend on the device having a voice installed. English, Spanish and Portuguese (the children's own languages) use the browser's voices.

| Folder | Voice style | Variants | Voice | License |
|---|---|---|---|---|
| `public/audio/azure/fr-FR/` | natural | fr-FR | Azure `fr-FR-DeniseNeural` | Azure output, credited in Settings |
| `public/audio/azure/fr-CA/` | natural | fr-CA | Azure `fr-CA-SylvieNeural` | " |
| `public/audio/azure/nl-NL/` | natural | nl-NL | Azure `nl-NL-FennaNeural` | " |
| `public/audio/azure/nl-BE/` | natural | nl-BE | Azure `nl-BE-DenaNeural` | " |
| `public/audio/fr/` | classic | fr-FR, fr-CA | "siwis" (medium) for [Piper](https://github.com/OHF-Voice/piper1-gpl), trained on the [SIWIS French Speech Synthesis Database](https://datashare.is.ed.ac.uk/handle/10283/2353) | **CC BY 4.0**: the credit line is shown in Settings under *Data & privacy*. Keep it there. |
| `public/audio/nl-NL/` | classic | nl-NL | ["pim" (medium)](https://huggingface.co/rhasspy/piper-voices/tree/main/nl/nl_NL/pim), Netherlands Dutch, one speaker | **CC0** (public domain). Credited in Settings anyway. |
| `public/audio/nl-BE/` | classic | nl-BE | ["rdh" (medium)](https://huggingface.co/rhasspy/piper-voices/tree/main/nl/nl_BE/rdh), Belgian Dutch (Flemish), one speaker | **CC0** (public domain). Credited in Settings anyway. |

- **Folders per variant and voice** come from `audio` in `src/data/targets.ts`. The choice is stored per child in `controls.voice` and syncs like the other preferences.
- **Files:** `*.mp3`, mono, one per phrase, named after a hash of the text (`clipName` in `src/lib/phrases.ts`), so the same phrase has the same file name in every folder. Piper clips are 40 kbps, Azure clips 48 kbps (24 kHz). A device downloads only the clips it plays.
- **List:** `phrases.json` in each folder, generated from `targetPhrases()`, the single list of everything the app says in that language.
- **Guard:** `src/lib/phrases.test.ts` plays every game for every verb, level and learning variant, and fails if anything said aloud is missing from the list.
- **Fallback:** natural → classic → the browser's voice. A natural clip that isn't recorded yet plays the Piper clip instead; choosing classic never plays Azure clips. If no recording exists, the browser's voice for that language is used if the device has one; otherwise the app stays silent rather than reading with the wrong language's voice.

## After changing verbs, sentences or tenses

```bash
npm run audio:list            # rewrite every public/audio/**/phrases.json
```

Then record what's new in both voices. Each run records only what's missing and deletes clips no longer in the list.

### Classic (Piper)

```bash
python scripts/make_audio.py --voice path/to/fr_FR-siwis-medium.onnx                 # French
python scripts/make_audio.py --voice voices/nl_NL-pim-medium.onnx --dir nl-NL       # Dutch (Netherlands)
python scripts/make_audio.py --voice voices/nl_BE-rdh-medium.onnx --dir nl-BE       # Dutch (Belgium)
```

One-time setup for the Piper recorder (Python 3.10+):

```bash
python -m venv .venv-audio && .venv-audio/Scripts/pip install -r scripts/requirements-audio.txt
.venv-audio/Scripts/python -m piper.download_voices --download-dir voices fr_FR-siwis-medium nl_NL-pim-medium nl_BE-rdh-medium
```

The voice models (~60 MB each) only live on the computer that records; they are never shipped to devices.

### Natural (Azure)

Needs an Azure **Speech** resource (portal.azure.com → Create → Speech). Copy its key and region from *Keys and Endpoint*. Keep the key out of the repository: set it in the shell only.

```powershell
$env:AZURE_SPEECH_KEY = "<key>"; $env:AZURE_SPEECH_REGION = "westeurope"
python scripts/make_audio_azure.py --dir nl-BE --limit 50     # a sample to listen to first
python scripts/make_audio_azure.py --dir all                  # everything (stop and re-run any time)
```

No extra packages are needed (standard library only). To change a variant's voice, edit `VOICES` in the script (or pass `--voice`), delete that folder's `*.mp3` and re-run.

**Cost and time** for a full recording (~29,200 phrases, ~477,000 characters over the four variants):

| Tier | Price | Limit | Full run |
|---|---|---|---|
| Free (F0) | $0, 500,000 characters per month | 20 requests per minute | about 27 hours at the default `--rate 18`; only just fits the monthly allowance, so record the sample in a different month or on S0 |
| Standard (S0) | $15 per 1M characters | 30 requests per second | about $7, under an hour with `--rate 1200` |

Later content changes only record the new phrases.

## Limitations

- siwis is a **France** French voice; with the classic voice, `fr-CA` children hear France pronunciation (their sentence wording still differs). The natural voice has a Québec voice.
- Synthetic voices can stress a word wrongly; neither the Dutch Piper nor the Azure recordings have been reviewed by native listeners yet.
- Until the Azure clips are recorded and deployed, the natural voice plays Piper clips after a failed request for each phrase (a small delay).
- The read-along word highlight is estimated from playback progress, so it can be slightly early or late on long sentences.
- Single syllables ("man", "ger", "ko") are read as written, as browser voices did before.
