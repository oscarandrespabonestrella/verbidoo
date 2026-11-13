# Verb Adventure — Architecture & Roadmap

Run: `npm install`, `npm run dev` (http://localhost:5173), `npm test` (engine checks), `npm run check:fr` (every French and Dutch form, plus Spanish/Portuguese simple tenses, vs Wiktionary; `npm run check:nl` for Dutch only), `npm run build`.

**Not yet validated by native speakers:** every irregular form in `src/data/french.ts`, `src/data/dutch.ts` and `src/data/verbs.ts`, every example sentence, and the spoken stems (`stems`: written stem + IPA, family 1/2/3/special) in `src/data/french.ts`. The engine tests are checked against reference tables, but have a native reviewer for each variant look at the content before real children use it.

## 0. Product scope

Children learn **French** (France `fr-FR` or Canada `fr-CA`) or **Dutch** (Netherlands `nl-NL` or Belgium `nl-BE`), chosen on the language screen (`#/learn`) and switchable at any time. Their own language (English, Spanish or Portuguese, each with regional variants) is the interface language and the source of all translations, meanings and explanations. The en/es/pt conjugations stay in the engine for the cross-language comparison panel.

### Adding a learning language
Everything that changes with the language being learned is configuration, not conditions in components:

| Piece | Where |
|---|---|
| Name, flag, variants, mascot, exclamations (BRAVO / GOED ZO), Time-Travel cue words, tense unlock path, comparable tenses, recording folders | `src/data/targets.ts` (`TARGETS`) |
| Mascot: name, default image, image per mood (face, guide, celebrate, approve, sad, thinking, studying, love); missing moods fall back along `FALLBACK` | `src/data/mascots.ts` — rendered by `<Mascot mood>` in `src/components/mascot.tsx`, which always follows the *learning* language |
| Lemmas (only irregular data), example sentences, regional wording | `src/data/<lang>.ts`, joined to the shared concepts in `src/data/verbs.ts` |
| Conjugation | `src/engine/<lang>.ts`, dispatched from `src/engine/conjugate.ts` |
| Home backdrop | a scene component in `src/components/mascot.tsx` (`SCENES`) |
| Audio | `npm run audio:list` + `scripts/make_audio.py --dir` (Piper, "classic") / `scripts/make_audio_azure.py --dir` (Azure, "natural") (docs/AUDIO.md) |

Progress is kept per learning language: verbs, stats and unlocked tenses are keyed by language; XP and badges of the other languages wait in `xpBy` / `badgesBy` and are swapped in by `setLanguages`. Streak, missions and the parent report stay per child.

## 1. Requirements analysis (what actually drives the design)

| Driver | Consequence |
|---|---|
| Accuracy > quantity | Conjugations come from a small rule engine **plus explicit per-verb irregular data**, checked by tests against reference forms. No bulk-generated content. |
| Cross-language comparison | Content is modelled by **concept** (`eat`) with one lemma per language, not per-language word lists. Parallel example sentences give translations for free. |
| Regional variants | A *variant* (`en-US`, `en-GB`, `es-ES`, `es-419`, `pt-BR`, `pt-PT`) controls voice, lemma overrides (pt-PT *saltar* vs pt-BR *pular*), person sets (vosotros only in Spain; *tu*/*vós* marked regional/literary in Brazil) and endings (pt-PT *falámos*). |
| Children & privacy | No account needed. Progress lives on-device (localStorage). No ads, trackers, chat or uploads. |
| Add languages without rebuild (long-term) | Content and engine rules are data, not UI. Phase 2 moves content to Postgres (schema below) so new languages are rows, not deploys. |

## 2. Application architecture

```
src/
  data/        content: verbs.ts (concepts, lemmas, irregular forms, sentences), i18n.ts (UI strings, languages, variants, persons)
  engine/      core.ts (Form/Tense types, joining, elision), french.ts, dutch.ts (learning-language engines), conjugate.ts (en/es/pt + entry point). Pure, no React
scripts/       wiktionary.test.ts — cross-checks the French, Spanish and Portuguese engines against kaikki.org (Wiktionary) data
  lib/         speech.ts (TTS wrapper), progress.ts (store + spaced repetition)
  pages/       Dashboard, Library, VerbPage, Practice, Setup, Learn (learning-language picker)
  components/  ui.tsx — shared SpeakButton, Mascot, Card, etc.
```

Layers only depend downward: `pages → components → lib/engine → data`. The engine never imports UI; content never imports engine.

## 3. Database structure (Phase 2 target — Supabase/Postgres)

See `supabase/schema.sql`. Core tables:

- `language` (code, name) → `language_variant` (code `pt-BR`, language, tts_locale)
- `verb_concept` (id, emoji/image, category, frequency_rank)
- `lemma` (concept, language, variant NULL=all, infinitive, syllables, ipa, verb_class, meaning per UI language in `lemma_meaning`)
- `tense` (language, code, mood, label, level, usage: `common|formal|literary|regional|rare`)
- `conjugation` (lemma, tense, person, variant NULL=all, form, is_irregular, source) — **stored, validated forms**; the engine produces candidates, a reviewer approves them into this table.
- `example_sentence` (concept, level) → `sentence_text` (sentence, language, variant, text with `{verb}` markup, audio_url)
- `media` (concept, kind, url, license, author)
- Progress (Phase 4/5, only with parental consent): `profile` (anonymous id, parent account), `verb_progress` (profile, lemma, box, due_at, correct, wrong), `achievement`, `profile_achievement`.

In the MVP the same shapes live as typed TypeScript in `src/data/` so the move to Postgres is a loader swap.

## 4. Linguistic data sources & conjugation

| Option | Verdict |
|---|---|
| Own rule engine + explicit irregular tables (chosen for MVP) | Small, transparent, testable; every irregular form is visible in data and reviewable. |
| **Wiktionary / Kaikki.org extracts** (CC BY-SA) | Best open source of full conjugation tables for es/pt/en. Use in Phase 2 to **cross-check** every stored form automatically. |
| **Real Academia Española / DLE**, **Priberam / Infopédia** (pt-PT), **Michaelis** (pt-BR) | Authoritative references for human validation; not bulk-licensable. |
| npm libs (`compromise` for English, various es/pt conjugators) | Quality uneven for es/pt; not used for ground truth. |

Rule: a form ships only if engine output == Wiktionary extract == reviewer sign-off. Forms that are rare/literary (e.g. *vós*, *pretérito anterior*, *futuro de subjuntivo*) carry a usage tag the UI displays.

## 5. Text-to-speech

| Option | Use |
|---|---|
| **Web Speech API** (`speechSynthesis`) — MVP | Free, offline-capable, per-locale voices, rate control, word-boundary events for highlighting. Quality and voice availability depend on the device. |
| Azure Neural TTS / Google Cloud TTS / Amazon Polly — Phase 2+ | Natural voices for all six locales incl. pt-PT and es-419; pre-generate MP3s per form and cache on a CDN (no child data sent). |
| Speech recognition (Web Speech `SpeechRecognition`, Azure Pronunciation Assessment) — Phase 5 | Pronunciation scoring. Recordings stay on device unless a parent opts in. |

## 6. Images

- MVP: large emoji per concept (clearly a placeholder, but meaningful and accessible everywhere).
- Phase 2: commissioned or licensed flat illustrations (one style, one child character doing each action), stored in Supabase Storage / CDN as SVG/WebP, referenced from the `media` table with license metadata. Open sets worth evaluating: OpenMoji (CC BY-SA), Open Peeps, unDraw (check per-asset license).

## 7. Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 MVP | Language + native language + variant selection, dashboard, library, verb pages, audio (normal/slow/repeat/syllables/highlight), core tense tables with irregular highlighting, cross-language compare, 3 games, progress, streak, XP, badges, spaced repetition | **Built** |
| 2 Conjugation engine | French: 18 tenses in 6 groups (subjonctif ×4, impératif +/−, passé simple and passé antérieur tagged literary), infinitive/participles/gérondif, pronominal verbs (se laver), être agreement, elision (j', qu', t', n', d'). Wiktionary cross-check: 1440 forms, 0 mismatches | **Built** |
| 2c 60 verbs | The 30 next most frequent French verbs (être, dire, pouvoir, savoir, venir, devoir…) in `src/data/verbs-more.ts` + `french.ts`, new "Most used" category. Wiktionary check now covers 2,880 French + 1,920 Spanish + 1,920 Portuguese forms, 0 mismatches (3 reviewed auxiliary exceptions documented in the test) | **Built** |
| 2d Spoken stems | French verbs grouped by how many stems you **hear** in the present (Dubois' *bases*): 1 (parler), 2 (dor-/dorm-, appell-/appel-), 3 (peu-/pouv-/peuv-), special (être, avoir, aller, faire). Every tense table colours the stem (same colour = same stem across tenses) and fades silent letters (`silentTail`); verb page has a stems card with IPA; Library filters by family. Engine: `frenchStems` / `stemFamily` in `src/engine/french.ts` | **Built** |
| 2b Remaining | Passive voice, modal constructions (pouvoir/devoir + inf.), impératif passé, IPA (Wiktionary data already has it), Postgres content | Next |
| 3 Games | All 8 games + mixed: Build a Sentence (pointer-event drag & tap), Complete the Verb, Time Travel (no second correct answer among options), Translation Challenge (both directions), Pronunciation Challenge (listen → record & play back on-device → optional browser speech check). Generators in `src/lib/games.ts`, invariants tested for every verb × level | **Built** |
| 4 Adaptive | `src/lib/adaptive.ts` (pure, tested): Leitner spaced repetition per verb; rolling accuracy per game and per tense; persistent per-game difficulty; 14-step tense path unlocked by mastery (≥ 6 tries, ≥ 75 %); sessions = due → error-prone → ≤ 3 new verbs (≤ 5 new/day); recognition games first for new verbs; weak games/tenses weighted up; dashboard recommendations, tricky verbs, tense map | **Built** |
| 5 Advanced | Settings area at `#/settings` (report with 14-day chart, per-game accuracy, minutes; preferences: voice checking off by default, recording, new verbs/day; add/edit/remove profiles; JSON export + erase). Several children per device (nickname + avatar only). Daily missions, weekly challenge, 7 unlockable characters, 12 badges. Pronunciation: word-by-word feedback, model-vs-me compare; self-checks excluded from stats. `src/lib/rewards.ts` + store tests | **Built** |
| 5b Cloud accounts | Parent-owned Supabase accounts (email + password, consent at sign-up, password reset, delete account). Conflict-safe merge sync per child (`src/lib/sync.ts`), auto-sync on change / start / reconnect. Library loaded only when configured. Setup: [docs/CLOUD.md](CLOUD.md) | **Built** — not yet run against a live project |
| 6 Dutch | Dutch (nl-NL / nl-BE) as a second learning language: 60 verbs (weak, strong, mixed, irregular, separable *aankomen / openmaken / dichtdoen / naar buiten gaan*, reflexive *zich wassen*, prepositional *houden van*), 12 tenses (OTT, aan het + inf, VTT, gaan + inf, imperative, OVT, OTTT, OVTT, VVT, VTTT, VVTT, archaic subjunctive) + non-finite forms; Wiktionary check 1,320 forms, 0 mismatches (1 reviewed auxiliary exception). Language screen, config-driven mascots (Gaston / Ollie), per-language XP and badges, Piper recordings per variant | **Built** — content not yet reviewed by a native speaker |
