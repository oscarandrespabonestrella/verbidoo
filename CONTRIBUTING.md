# Contributing to Verbidoo

Thanks for wanting to help children learn verbs! Contributions of every size are welcome: a typo, a wrong conjugation, a better example sentence, a new game, a new language.

By contributing you agree that your code is released under the [MIT license](LICENSE) and your artwork, sentences and other content under [CC BY-SA 4.0](LICENSE-CONTENT.md). Please also follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to help

| You are… | You can… |
|---|---|
| A **native speaker** of French (France or Québec), Dutch (Netherlands or Flanders), English, Spanish, Portuguese or Italian | Review irregular forms, example sentences, translations and the French spoken stems. None of these have been native-reviewed yet, so this is the most valuable help of all. Open a **Content correction** issue or a PR. |
| A **teacher or parent** | Tell us what works and what confuses children. Open an **Idea** issue. |
| A **developer** | Fix a bug, add a game, improve accessibility or performance. Look for issues labelled `good first issue`. |
| A **designer / illustrator** | New mascot moods, scenes, icons. |

## Getting started

Requirements: **Node 24** and npm. Python 3.10+ only if you record audio.

```bash
git clone https://github.com/oscarandrespabonestrella/verbidoo.git
cd verbidoo
npm install
npm run dev        # http://localhost:5173, also reachable from phones on your network
```

No accounts or keys are needed: the app runs fully local. Cloud sync is optional (see [docs/CLOUD.md](docs/CLOUD.md)).

Before opening a pull request:

```bash
npm test           # unit tests: engine, games, sync, phrase coverage
npm run build      # type check (tsc --noEmit) + production build
npm run check:fr   # only if you touched conjugations: compares every form with Wiktionary
```

## How the code is organised

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) first. In short:

- Layers depend only downward: `pages → components → lib/engine → data`. The engine never imports UI.
- A verb is a **concept** (`eat`) with a lemma per language. Only **irregular** data is written by hand (`src/data/french.ts`, `dutch.ts`); regular forms come from the engine (`src/engine/`).
- Everything that differs per learning language lives in `src/data/targets.ts`, not in `if (lang === …)` branches.
- UI strings are in `src/data/i18n*.ts`. A new string needs a translation in every interface language.

## Rules that keep the app correct

1. **Conjugations must be right.** A form ships only if `npm test` and `npm run check:fr` pass. When you fix a form, add or update a test in `src/engine/conjugate.test.ts`, and cite a source (Wiktionary, Bescherelle, Van Dale, Larousse…) in the PR.
2. **Audio stays in sync.** If you change verbs, sentences or tenses, run `npm run audio:list`. `src/lib/phrases.test.ts` fails if a game can say a phrase that has no entry in the list. You don't need cloud keys: commit the updated `phrases.json` files and a maintainer records the new clips (see [docs/AUDIO.md](docs/AUDIO.md)). Never commit API keys.
3. **Privacy first, this is for children.** No analytics, ads, trackers, third-party embeds, uploads, or new data sent to the cloud. Only nickname, avatar and progress may ever sync. PRs that add tracking will be declined.
4. **Don't hand-edit** the `/*VERSION*/` and `/*PRECACHE*/` markers in `public/sw.js`; the build fills them.
5. Mark deliberate shortcuts with a `// ponytail:` comment explaining when to revisit them.

## Pull requests

- Fork the repository, branch from `main`, and keep each PR focused on one thing.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for titles: `feat:`, `fix:`, `docs:`, `perf:`, `chore:`…
- Describe what changed and why; add a screenshot or short clip for visible changes, ideally on a phone-sized screen.
- CI runs the tests and the build on every PR. A maintainer reviews it, usually within a week.

## Adding a learning language

It's a bigger project but well defined: a `data/<lang>.ts`, an `engine/<lang>.ts`, a `TARGETS` entry, a mascot, a scene and recordings. The table in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ("Adding a learning language") lists every piece. Please open an issue first so we can plan it together.
