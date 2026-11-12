import { langOf, type Lang, type TargetLang, type Variant } from './i18n'
import type { MascotId } from './mascots'

/**
 * Everything that changes with the language being learned. Adding a language = an entry here,
 * its lemmas in data/<lang>.ts, an engine section, its mascot in data/mascots.ts and its recordings.
 */
export interface TargetConfig {
  lang: TargetLang; flag: string; variants: Variant[]; mascot: MascotId
  /** Short exclamations shown in the target language, whatever the child's own language is. */
  words: { hello: string; helloName: string; bravo: string; excellent: string; pity: string }
  /** Time words read before the answer in Time Travel ("Hier, j'ai mangé"). */
  cue: { past: string; now: string; future: string }
  /** Order tenses open up in games (first two open from the start). Literary tenses are never here. */
  tensePath: string[]
  /** Tense ids that mean roughly now / past / future, for comparisons and Time Travel. */
  compare: { now: string; past: string; future: string }
  /** Time Travel: the near future, other right answers per cue (never offered as distractors), and the distractor pool. */
  travel: { near: string; also: { past: string[]; future: string[]; now: string[] }; wrong: string[] }
  /** Folder under public/audio with recordings for each variant. */
  audio: Partial<Record<Variant, string>>
}

export const TARGETS: Record<TargetLang, TargetConfig> = {
  fr: {
    lang: 'fr', flag: '🇫🇷', variants: ['fr-FR', 'fr-CA'], mascot: 'gaston',
    words: { hello: 'BONJOUR !', helloName: 'Bonjour {name} !', bravo: 'BRAVO !', excellent: 'EXCELLENT !', pity: 'DOMMAGE…' },
    cue: { past: 'Hier', now: 'Maintenant', future: 'Demain' },
    tensePath: ['pres', 'proche', 'pc', 'imper', 'prog', 'imp', 'fut', 'impneg', 'cond', 'subj', 'pqp', 'futant', 'condp', 'subjp'],
    compare: { now: 'pres', past: 'pc', future: 'fut' },
    travel: { near: 'proche', also: { past: ['imp', 'pqp'], future: ['proche', 'fut', 'futant'], now: ['prog'] }, wrong: ['pres', 'pc', 'proche', 'fut', 'imp', 'cond'] },
    audio: { 'fr-FR': 'fr', 'fr-CA': 'fr' },
  },
  nl: {
    lang: 'nl', flag: '🇳🇱', variants: ['nl-NL', 'nl-BE'], mascot: 'ollie',
    words: { hello: 'HALLO!', helloName: 'Hallo {name}!', bravo: 'GOED ZO!', excellent: 'SUPER!', pity: 'JAMMER…' },
    cue: { past: 'Gisteren', now: 'Nu', future: 'Morgen' },
    tensePath: ['ott', 'gaan', 'vtt', 'imper', 'prog', 'ovt', 'ottt', 'ovtt', 'vvt', 'vttt', 'vvtt'],
    compare: { now: 'ott', past: 'vtt', future: 'ottt' },
    travel: { near: 'gaan', also: { past: ['ovt', 'vvt'], future: ['gaan', 'ottt', 'vttt'], now: ['prog'] }, wrong: ['ott', 'vtt', 'gaan', 'ottt', 'ovt', 'ovtt'] },
    audio: { 'nl-NL': 'nl-NL', 'nl-BE': 'nl-BE' },
  },
}
export const TARGET_LANGS = Object.keys(TARGETS) as TargetLang[]
export const isTarget = (l: Lang): l is TargetLang => l in TARGETS
/** Config for a target variant (fr-CA → French). */
export const targetOf = (v: Variant) => TARGETS[langOf(v) as TargetLang]
