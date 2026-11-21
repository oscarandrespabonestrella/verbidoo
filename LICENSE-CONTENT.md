# Content, artwork and audio licenses

The **source code** of Verbidoo is MIT licensed (see [`LICENSE`](LICENSE)). Everything below is not code and has its own terms.

## Artwork and learning content: CC BY-SA 4.0

Copyright © 2026 Oscar Andrés Pabón Estrella and Verbidoo contributors, licensed under
[Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).

This covers:

- the mascots **Gaston** and **Ollie**, the Verbidoo logo, icons and the Open Graph image (`public/img/`, `public/icons/`, `public/og-image.png`, `design/`)
- the screenshots in `screenshots/`
- the learning content: example sentences, translations, meanings, notes and irregular-form tables in `src/data/`

You may share and adapt them, also commercially, as long as you **credit Verbidoo** (with a link to this repository) and release your adaptations under the same license.

**Trademark note:** the license lets you reuse the art, but please don't present a fork as the official Verbidoo app. If you publish your own version, give it a different name.

## Recorded audio (`public/audio/`)

| Folder | Source | License |
|---|---|---|
| `public/audio/fr/` | Piper voice "siwis", trained on the [SIWIS French Speech Synthesis Database](https://datashare.is.ed.ac.uk/handle/10283/2353) | **CC BY 4.0**, credit must stay visible (the app shows it in Settings → Data & privacy) |
| `public/audio/nl-NL/` | Piper voice ["pim"](https://huggingface.co/rhasspy/piper-voices/tree/main/nl/nl_NL/pim) | CC0 |
| `public/audio/nl-BE/` | Piper voice ["rdh"](https://huggingface.co/rhasspy/piper-voices/tree/main/nl/nl_BE/rdh) | CC0 |
| `public/audio/natural/` | Generated with Google Cloud Text-to-Speech (Chirp 3 HD) or Microsoft Azure Speech | Output of the service, used under the provider's terms of service; redistributed here as part of the app |

Piper itself is used only as an offline recording tool (`scripts/make_audio.py`); its code is not part of the app.

## Third-party code and fonts

npm dependencies keep their own licenses (see `package-lock.json`). Bundled fonts Fredoka and Red Hat Text are under the SIL Open Font License 1.1. `.claude/skills/` and `.agents/skills/` contain a design skill from [anthropics/skills](https://github.com/anthropics/skills) under the Apache License 2.0 (its `LICENSE.txt` is next to it).
