# Learning-language audio

Every phrase the app can say in a learning language (French, Dutch) plays from a recording. There are two recorded voices, and parents pick one per child in **Grown-ups → Preferences → Voice** (a *Listen* button plays a sample):

- **Natural** (default): cloud neural voices (Google Cloud Text-to-Speech or Microsoft Azure), one per variant, so fr-CA children hear a Québec accent and nl-BE children a Flemish one.
- **Classic**: open-source Piper voices, as before.

Recordings sound the same on every device, work offline once cached, and never depend on the device having a voice installed. English, Spanish and Portuguese (the children's own languages) use the browser's voices.

| Folder | Voice style | Variants | Voice | License |
|---|---|---|---|---|
| `public/audio/natural/<variant>/` (fr-FR, fr-CA, nl-NL, nl-BE) | natural | one each | Google Chirp 3 HD (French: `<variant>-Chirp3-HD-Sadachbia`, male; Dutch: `<variant>-Chirp3-HD-Aoede`, female) or Azure (`fr-FR-DeniseNeural`, `fr-CA-SylvieNeural`, `nl-NL-FennaNeural`, `nl-BE-DenaNeural`); each folder's `voice.json` says which | Output of the service, credited in Settings (`NATURAL_SERVICE` in `src/data/targets.ts` picks the credit) |
| `public/audio/fr/` | classic | fr-FR, fr-CA | "siwis" (medium) for [Piper](https://github.com/OHF-Voice/piper1-gpl), trained on the [SIWIS French Speech Synthesis Database](https://datashare.is.ed.ac.uk/handle/10283/2353) | **CC BY 4.0**: the credit line is shown in Settings under *Data & privacy*. Keep it there. |
| `public/audio/nl-NL/` | classic | nl-NL | ["pim" (medium)](https://huggingface.co/rhasspy/piper-voices/tree/main/nl/nl_NL/pim), Netherlands Dutch, one speaker | **CC0** (public domain). Credited in Settings anyway. |
| `public/audio/nl-BE/` | classic | nl-BE | ["rdh" (medium)](https://huggingface.co/rhasspy/piper-voices/tree/main/nl/nl_BE/rdh), Belgian Dutch (Flemish), one speaker | **CC0** (public domain). Credited in Settings anyway. |

- **Folders per variant and voice** come from `audio` in `src/data/targets.ts`. The choice is stored per child in `controls.voice` and syncs like the other preferences.
- **Files:** `*.mp3`, mono, one per phrase, named after a hash of the text (`clipName` in `src/lib/phrases.ts`), so the same phrase has the same file name in every folder. Piper clips are 40 kbps, natural clips 48 kbps (24 kHz). A device downloads only the clips it plays.
- **List:** `phrases.json` in each folder, generated from `targetPhrases()`, the single list of everything the app says in that language.
- **Guard:** `src/lib/phrases.test.ts` plays every game for every verb, level and learning variant, and fails if anything said aloud is missing from the list.
- **Fallback:** natural → classic → the browser's voice. A natural clip that isn't recorded yet plays the Piper clip instead; choosing classic never plays natural clips. If no recording exists, the browser's voice for that language is used if the device has one; otherwise the app stays silent rather than reading with the wrong language's voice.

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

### Natural (Google or Azure)

Both recorders fill the same `public/audio/natural/<variant>/` folders, so the app doesn't change. Use one service per folder (the recorder warns if a folder already has clips from another voice), and set `NATURAL_SERVICE` in `src/data/targets.ts` to the service you used so the Settings credit is right. Keys stay in the shell, never in the repository. Each run records only what's missing, several requests at a time, and can be stopped and re-run.

**Google Cloud Text-to-Speech** (needs `lameenc`: `pip install -r scripts/requirements-audio.txt`). In the Google Cloud console: create a project, link a billing account, enable the *Cloud Text-to-Speech API*, then *APIs & Services → Credentials → Create API key* and restrict it to that API.

```powershell
$env:GOOGLE_TTS_API_KEY = "<key>"
python scripts/make_audio_google.py --list-voices nl-BE       # voices Google offers for a variant
python scripts/make_audio_google.py --dir nl-BE --limit 50    # a sample to listen to first
python scripts/make_audio_google.py --dir all                 # everything
```

**Microsoft Azure** (standard library only). In the Azure portal: create a *Speech* resource and copy its key and region from *Keys and Endpoint*.

```powershell
$env:AZURE_SPEECH_KEY = "<key>"; $env:AZURE_SPEECH_REGION = "westeurope"
python scripts/make_audio_azure.py --dir nl-BE --limit 50
python scripts/make_audio_azure.py --dir all                          # free F0 tier: slow, see below
python scripts/make_audio_azure.py --dir all --rate 1500 --workers 16 # Standard S0 tier
```

To re-record clips that came out wrong, name them with `--redo` (exact phrase text, comma-separated), for example `python scripts/make_audio_google.py --dir fr-FR --redo "dire,pouvoir,devoir"`. Listen and repeat if needed; each run gives a slightly different take. The Google recorder sends single words with a closing period, because Chirp 3 HD can clip or garble a bare word.

Change a variant's voice with `--voice` (or `VOICES` in the script), after deleting that folder's `*.mp3`.

**Cost and time** for a full recording (~29,200 phrases, ~477,000 characters over the four variants):

| Service | Price | Limit | Full run |
|---|---|---|---|
| Google, Chirp 3 HD (default) | free up to 1M characters a month, then $30 per 1M | 200 requests per minute | about 2.5 hours |
| Google, Neural2 / WaveNet (`--voice`) | free up to 1M characters a month, then $16 per 1M | 1,000 requests per minute | about 30 minutes |
| Azure free (F0) | $0, 500,000 characters a month | 20 requests per minute | about 27 hours |
| Azure Standard (S0) | $15 per 1M characters | 30 requests per second | about 20–30 minutes, about $7 |

Check the free allowances on the providers' pricing pages before a full run. Later content changes only record the new phrases.

## Limitations

- siwis is a **France** French voice; with the classic voice, `fr-CA` children hear France pronunciation (their sentence wording still differs). The natural voice has a Québec voice.
- Synthetic voices can stress a word wrongly; neither the Dutch Piper nor the natural recordings have been reviewed by native listeners yet.
- Until the natural clips are recorded and deployed, the natural voice plays Piper clips after a failed request for each phrase (a small delay).
- The read-along word highlight is estimated from playback progress, so it can be slightly early or late on long sentences.
- Single syllables ("man", "ger", "ko") are read as written, as browser voices did before.
