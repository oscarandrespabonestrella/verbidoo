import { PERSONS, langOf, type Variant } from '../data/i18n'
import { TARGETS, isTarget, targetOf } from '../data/targets'
import { VERBS, type Verb } from '../data/verbs'
import { conjugate, formText, infinitive, say, sentenceFor, type Form, type Tense, type TenseTable } from '../engine/conjugate'
import { weightedPick } from './adaptive'

/** Adaptive inputs: which tenses are open in games, and how strongly to favour each (weak/new tenses higher). */
export interface QOpts { unlocked?: string[]; weight?: (tenseId: string) => number }

export type Kind = 'picture' | 'listen' | 'conjugate' | 'complete' | 'timetravel' | 'translate' | 'build' | 'pronounce'
export type TimeCue = 'now' | 'past' | 'future'

export interface Q {
  kind: Kind; verb: Verb
  options: string[]; answer: string
  /** What to read aloud after the answer ("j'ai mangé", "Hier, j'ai mangé"). */
  spoken: string
  tense?: Tense; person?: number; form?: Form
  stem?: string                                  // complete: shown part of the verb
  from?: { cue: TimeCue; text: string }; to?: TimeCue // timetravel
  reverse?: boolean                              // translate: target language → native
  tiles?: string[]; translation?: string         // build
}

export const shuffle = <T,>(a: T[]) => a.map((x) => [Math.random(), x] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1])
export const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const uniq = (a: string[]) => [...new Set(a)]

/**
 * Quizzable tenses: the unlocked ones when the learner has a tense path, otherwise up to the level.
 * Literary tenses (passé simple…) stay reference-only; tenses a verb lacks (pouvoir has no imperative) are skipped.
 */
const quizTables = (verb: Verb, target: Variant, level: number, o: QOpts) =>
  conjugate(verb, target).filter((x) => !x.tense.usage && x.forms.some(Boolean) && (o.unlocked ? o.unlocked.includes(x.tense.id) : x.tense.level <= level))
const pickTable = (tables: TenseTable[], o: QOpts) => (o.weight ? weightedPick(tables, (x) => o.weight!(x.tense.id)) : pick(tables))
/** Persons that exist in this tense and are in everyday use for the variant. */
const quizPersons = (table: TenseTable, target: Variant) =>
  PERSONS[langOf(target)].map((d, i) => ({ d, i }))
    .filter(({ d, i }) => (!d.only || d.only.includes(target)) && !d.usage?.[target] && table.forms[i]).map(({ i }) => i)

/** Time words used as cues in Time Travel, in the language being learned (Hier / Gisteren…). */
export const cueWord = (target: Variant, cue: TimeCue) => targetOf(target).cue[cue]

export function makeQ(kind: Kind, verb: Verb, pool: Verb[], level: number, target: Variant, native: Variant, o: QOpts = {}): Q {
  const n = level === 1 ? 3 : 4
  // Distractors must look different from the answer in every way a game shows them: picture, French, own language.
  const same = (v: Verb) => v.id === verb.id || v.emoji === verb.emoji
    || infinitive(v, target) === infinitive(verb, target) || infinitive(v, native) === infinitive(verb, native)
  const others: Verb[] = []
  for (const v of shuffle(pool)) {
    if (others.length === n - 1) break
    if (!same(v) && !others.some((o) => infinitive(o, native) === infinitive(v, native) || o.emoji === v.emoji)) others.push(v)
  }
  const lang = langOf(target)

  if (kind === 'picture' || kind === 'listen') {
    return { kind, verb, options: shuffle([verb, ...others]).map((v) => v.id), answer: verb.id, spoken: infinitive(verb, target) }
  }

  if (kind === 'translate') {
    // Alternate direction: native → French (recognise) and French → native (understand).
    const reverse = Math.random() < 0.5
    return { kind, verb, reverse, options: shuffle([verb, ...others]).map((v) => v.id), answer: verb.id, spoken: infinitive(verb, target) }
  }

  if (kind === 'build') {
    // Easy level: present sentence; later: either sentence.
    const i = level === 1 ? 0 : pick([0, 1])
    const sentence = sentenceFor(verb, i, target).replace(/[{}]/g, '')
    const words = sentence.split(' ')
    let tiles = shuffle(words)
    for (let k = 0; k < 5 && tiles.join(' ') === sentence; k++) tiles = shuffle(words) // never start solved
    return { kind, verb, options: [], answer: sentence, spoken: sentence, tiles, translation: sentenceFor(verb, i, native).replace(/[{}]/g, '') }
  }

  if (kind === 'pronounce') {
    // Level 1: the infinitive; 2: "je mange"; 3: a whole sentence.
    const pres = conjugate(verb, target).find((x) => x.tense.id === COMPARE_NOW[lang])!
    const p = pick(quizPersons(pres, target))
    const phrase = level === 1 ? infinitive(verb, target)
      : level === 2 ? say(lang, p, pres.forms[p]!, pres.tense)
      : sentenceFor(verb, 0, target).replace(/[{}]/g, '')
    return { kind, verb, options: [], answer: phrase, spoken: phrase }
  }

  const tables = quizTables(verb, target, level, o)

  if (kind === 'complete') {
    const q = completeQ(verb, tables, target, n, o)
    if (q) return q
    kind = 'conjugate' // every form irregular (avoir, aller): fall back to picking the whole form
  }

  if (kind === 'timetravel' && isTarget(lang)) {
    const q = timeTravelQ(verb, target, level, n, o)
    if (q) return q
  }

  const table = pickTable(tables, o)
  const person = pick(quizPersons(table, target)), form = table.forms[person]!
  const right = formText(form)
  // Distractors: same verb, other persons/tenses — tests the conjugation, not vocabulary.
  const wrong = shuffle(uniq(tables.flatMap((x) => x.forms.flatMap((f) => (f ? [formText(f)] : [])))).filter((f) => f !== right)).slice(0, n - 1)
  return { kind: 'conjugate', verb, options: shuffle([right, ...wrong]), answer: right, tense: table.tense, person, form, spoken: say(lang, person, form, table.tense) }
}
const COMPARE_NOW: Record<string, string> = { es: 'pres', pt: 'pres', en: 'present_simple', ...Object.fromEntries(Object.values(TARGETS).map((c) => [c.lang, c.compare.now])) }

/** "nous mang___" → pick the ending. Only regular / spelling-change forms, so the stem is meaningful. */
function completeQ(verb: Verb, tables: TenseTable[], target: Variant, n: number, o: QOpts): Q | null {
  const lang = langOf(target)
  const usable = (table: TenseTable) => quizPersons(table, target).map((p) => ({ table, p, f: table.forms[p]! }))
    .filter(({ f }) => f.kind !== 'irregular' && !f.after && !f.word.includes('(') && f.split >= 2 && f.split < f.word.length)
  const withForms = tables.filter((x) => usable(x).length)
  if (!withForms.length) return null
  const { table, p, f } = pick(usable(pickTable(withForms, o)))
  const stem = f.word.slice(0, f.split), right = f.word.slice(f.split)
  // Distractors: other endings this same stem takes elsewhere (mangeons, mangions, manger, mangez…).
  const endings = uniq([...tables.flatMap((x) => x.forms), ...conjugate(verb, target).flatMap((x) => x.forms)]
    .flatMap((g) => (g && g.word.startsWith(stem) && !g.word.includes('(') ? [g.word.slice(stem.length)] : []))
    .concat(infinitive(verb, target).startsWith(stem) ? [infinitive(verb, target).slice(stem.length)] : []))
    .filter((e) => e && e !== right)
  if (endings.length < 2) return null
  return {
    kind: 'complete', verb, stem, tense: table.tense, person: p, form: f,
    options: shuffle([right, ...shuffle(endings).slice(0, n - 1)]), answer: right, spoken: say(lang, p, f, table.tense),
  }
}

/**
 * Time Travel: "Maintenant : je mange → Hier : je ___". Options never include a second correct answer
 * (imparfait for Hier, the other future for Demain, the progressive for Maintenant).
 */
function timeTravelQ(verb: Verb, target: Variant, level: number, n: number, o: QOpts): Q | null {
  // Tense ids per language come from data/targets.ts (French: pres / pc / proche / fut).
  const c = targetOf(target), lang = c.lang
  const { now, past, future: fut } = c.compare, near = c.travel.near
  const all = Object.fromEntries(conjugate(verb, target).map((x) => [x.tense.id, x]))
  const open = (id: string) => !o.unlocked || o.unlocked.includes(id)
  const futureId = open(fut) && (level >= 2 || !open(near)) ? fut : open(near) ? near : null
  // Only travel to and from tenses the child has unlocked.
  const routes = ([
    ['past', now, past], ['future', now, futureId], ['now', past, now], ['now', near, now],
  ] as [TimeCue, string, string | null][]).filter(([, from, ans]) => ans && open(from) && open(ans))
  if (!routes.length) return null
  const [to, fromId, answerId] = pick(routes) as [TimeCue, string, string]
  const alsoRight = c.travel.also[to]
  const person = pick(quizPersons(all[now], target))
  const right = all[answerId].forms[person]!
  const wrongIds = c.travel.wrong.filter((id) => id !== answerId && !alsoRight.includes(id))
  const wrong = uniq(shuffle(wrongIds).map((id) => formText(all[id].forms[person]!))).filter((w) => w !== formText(right)).slice(0, n - 1)
  const fromCue: TimeCue = fromId === now ? 'now' : fromId === past ? 'past' : 'future'
  return {
    kind: 'timetravel', verb, person, form: right, tense: all[answerId].tense, to,
    from: { cue: fromCue, text: say(lang, person, all[fromId].forms[person]!) },
    options: shuffle([formText(right), ...wrong]), answer: formText(right),
    spoken: `${c.cue[to]}, ${say(lang, person, right)}`,
  }
}

const norm = (w: string) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const words = (s: string) => norm(s).split(' ').filter(Boolean)

/**
 * Word-by-word pronunciation feedback: each word of the model phrase (as written, so the child sees
 * "J'écris") marked heard or missed. Accents, case and punctuation are ignored when matching.
 */
export function wordMatches(expected: string, heard: string): { word: string; ok: boolean }[] {
  const got = words(heard)
  return expected.split(/\s+/).filter((w) => norm(w)).map((word) => {
    const parts = words(word) // "J'écris" → ["j", "ecris"]: every part must be heard
    const ok = parts.every((p) => { const i = got.indexOf(p); if (i < 0) return false; got.splice(i, 1); return true })
    return { word, ok }
  })
}
/** Share of the model phrase's words that were heard. */
export function pronunciationScore(expected: string, heard: string) {
  const m = wordMatches(expected, heard)
  return m.length ? m.filter((x) => x.ok).length / m.length : 0
}
export const PASS_SCORE = 0.7

export const verbLabel = (id: string, v: Variant) => infinitive(VERBS.find((x) => x.id === id)!, v)
