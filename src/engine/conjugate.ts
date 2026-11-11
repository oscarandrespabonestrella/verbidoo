import { PERSONS, langOf, type Lang, type Usage, type Variant } from '../data/i18n'
import type { EnLemma, RomLemma, Verb } from '../data/verbs'
import { formText, join, mk, six, vowelStart, withAux, type Form, type Kind, type Tense, type TenseTable, type Time } from './core'
import { conjugateFrench } from './french'

export { formText, type Form, type Kind, type Tense, type TenseTable, type Time }

/**
 * Subject shown before a form: French elides je → j' (j'ai), subjunctives add que/qu' (qu'il),
 * imperatives have none.
 */
export function pronounFor(lang: Lang, p: number, text: string, tense?: Tense) {
  if (tense?.imperative) return ''
  const pro = lang === 'fr' && p === 0 && vowelStart(text) ? "j'" : PERSONS[lang][p].label
  return tense?.que ? join(vowelStart(pro) ? "qu'" : 'que', pro) : pro
}
/** Speakable "pronoun + form", e.g. "I eat", "j'ai mangé", "qu'il mange", "mange". */
export const say = (lang: Lang, p: number, f: Form, tense?: Tense) => {
  const text = formText(f)
  return join(pronounFor(lang, p, text, tense).split('/')[0], text)
}

// ───────────── English ─────────────
const third = (b: string) => /(s|sh|ch|x|z|o)$/.test(b) ? b + 'es' : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + 'ies' : b + 's'
const BE_PRES = six('am are is are are are'), BE_PAST = six('was were was were were were'), HAVE = six('have have has have have have')

type EnPart = 'base' | 'will' | 'pres' | 'past' | 'pp' | 'ing'
function enWord(l: EnLemma, part: EnPart, p: number): Form {
  const b = l.inf
  if (part === 'base') return mk(b, b, 'regular')
  if (part === 'will') return mk(l.will ?? b, b, l.will ? 'irregular' : 'regular')
  if (part === 'pres' && l.pres) return mk(six(l.pres)[p], b, 'irregular')
  if (part === 'past' && l.pastSix) return mk(six(l.pastSix)[p], b, 'irregular')
  if (part === 'pres') return p !== 2 ? mk(b, b, 'regular') : l.third ? mk(l.third, b, 'irregular') : mk(third(b), b, third(b) === b + 's' ? 'regular' : 'spelling')
  if (part === 'ing') return mk(l.ing, b, l.ing === b + 'ing' ? 'regular' : 'spelling')
  const w = l[part]
  return mk(w, b, !w.endsWith('ed') ? 'irregular' : w === b + 'ed' ? 'regular' : 'spelling')
}

type Aux = string | string[]
const EN: [string, string, Time, 1 | 2 | 3, Aux, EnPart][] = [
  ['present_simple', 'Present Simple', 'now', 1, '', 'pres'],
  ['present_continuous', 'Present Continuous', 'now', 1, BE_PRES, 'ing'],
  ['past_simple', 'Past Simple', 'past', 1, '', 'past'],
  ['future_simple', 'Future Simple', 'future', 1, 'will', 'will'],
  ['past_continuous', 'Past Continuous', 'past', 2, BE_PAST, 'ing'],
  ['present_perfect', 'Present Perfect', 'past', 2, HAVE, 'pp'],
  ['future_continuous', 'Future Continuous', 'future', 2, 'will be', 'ing'],
  ['conditional', 'Conditional (would)', 'maybe', 2, 'would', 'will'],
  ['present_perfect_continuous', 'Present Perfect Continuous', 'past', 3, HAVE.map((h) => h + ' been'), 'ing'],
  ['past_perfect', 'Past Perfect', 'past', 3, 'had', 'pp'],
  ['past_perfect_continuous', 'Past Perfect Continuous', 'past', 3, 'had been', 'ing'],
  ['future_perfect', 'Future Perfect', 'future', 3, 'will have', 'pp'],
  ['future_perfect_continuous', 'Future Perfect Continuous', 'future', 3, 'will have been', 'ing'],
  ['conditional_perfect', 'Conditional Perfect', 'maybe', 3, 'would have', 'pp'],
]

// ───────────── Spanish / Portuguese ─────────────
type Conj = 'ar' | 'er' | 'ir'
type Simple = 'pres' | 'pret' | 'imperf'
const END: Record<'es' | 'pt', Record<Simple, Record<Conj, string>>> = {
  es: {
    pres: { ar: 'o as a amos áis an', er: 'o es e emos éis en', ir: 'o es e imos ís en' },
    pret: { ar: 'é aste ó amos asteis aron', er: 'í iste ió imos isteis ieron', ir: 'í iste ió imos isteis ieron' },
    imperf: { ar: 'aba abas aba ábamos abais aban', er: 'ía ías ía íamos íais ían', ir: 'ía ías ía íamos íais ían' },
  },
  pt: {
    pres: { ar: 'o as a amos ais am', er: 'o es e emos eis em', ir: 'o es e imos is em' },
    pret: { ar: 'ei aste ou amos astes aram', er: 'i este eu emos estes eram', ir: 'i iste iu imos istes iram' },
    imperf: { ar: 'ava avas ava ávamos áveis avam', er: 'ia ias ia íamos íeis iam', ir: 'ia ias ia íamos íeis iam' },
  },
}
const FUT = { es: six('é ás á emos éis án'), pt: six('ei ás á emos eis ão') }
const COND = { es: six('ía ías ía íamos íais ían'), pt: six('ia ias ia íamos íeis iam') }
const AUX = {
  es: {
    haberPres: six('he has ha hemos habéis han'), haberImp: six('había habías había habíamos habíais habían'),
    haberFut: six('habré habrás habrá habremos habréis habrán'), haberCond: six('habría habrías habría habríamos habríais habrían'),
    estar: six('estoy estás está estamos estáis están'), irA: six('voy vas va vamos vais van').map((x) => x + ' a'),
  },
  pt: { terImp: six('tinha tinhas tinha tínhamos tínheis tinham'), estar: six('estou estás está estamos estais estão'), ir: six('vou vais vai vamos ides vão') },
}

/** Orthographic stem changes that keep the consonant sound (jugué, abracé, dancei, brinquei, conheço, protejo). */
function ortho(lang: 'es' | 'pt', stem: string, c: Conj, end: string) {
  const last = stem.slice(-1), head = stem.slice(0, -1)
  if (c === 'ar' && /^[eéê]/.test(end)) {
    if (last === 'c') return head + 'qu'
    if (last === 'g') return head + 'gu'
    if (last === 'z' && lang === 'es') return head + 'c'
    if (last === 'ç') return head + 'c'
  }
  if (c !== 'ar' && /^[oaáó]/.test(end)) {
    if (last === 'g') return head + 'j'
    if (last === 'c') return head + (lang === 'es' ? 'z' : 'ç')
  }
  return stem
}

/** Regular prediction for a simple tense, plus whether a spelling rule fired. */
export function regular(lang: 'es' | 'pt', inf: string, t: Simple, p: number, variant?: Variant) {
  const c = conjOf(inf), stem = inf.slice(0, -2)
  // pt-PT writes the preterite 1pl of -ar verbs with an accent (falámos) to tell it from the present (falamos).
  const end = lang === 'pt' && variant === 'pt-PT' && t === 'pret' && c === 'ar' && p === 3 ? 'ámos' : six(END[lang][t][c])[p]
  const s = ortho(lang, stem, c, end)
  return { form: s + end, spelling: s !== stem }
}

/** -ar / -er / -ir, ignoring an accent on the ending (oír → ir). */
const conjOf = (inf: string) => inf.slice(-2).normalize('NFD').replace(/[\u0300-\u036f]/g, '') as Conj
const regGer = (lang: 'es' | 'pt', inf: string) => inf.slice(0, -2) + ({ ar: 'ando', er: lang === 'es' ? 'iendo' : 'endo', ir: lang === 'es' ? 'iendo' : 'indo' } as const)[conjOf(inf)]
const regPP = (inf: string) => inf.slice(0, -2) + (conjOf(inf) === 'ar' ? 'ado' : 'ido')

export function lemmaFor(v: Verb, lang: 'es' | 'pt', variant: Variant): RomLemma {
  const l = v[lang]
  return { ...l, ...l.variants?.[variant] }
}

function romSimple(lang: 'es' | 'pt', l: RomLemma, t: Simple, p: number, variant: Variant): Form {
  const base = l.inf.slice(0, -2), reg = regular(lang, l.inf, t, p, variant)
  const irr = l.irr?.[t] && six(l.irr[t]!)[p]
  if (irr && irr !== reg.form) return mk(irr, base, 'irregular')
  return mk(reg.form, base, reg.spelling ? 'spelling' : 'regular')
}
function romFut(l: RomLemma, ends: string[], p: number): Form {
  return l.fut ? mk(l.fut + ends[p], l.inf, 'irregular') : { aux: '', word: l.inf + ends[p], split: l.inf.length, kind: 'regular' }
}
const nonFinite = (lang: 'es' | 'pt', l: RomLemma) => ({
  ger: mk(l.ger ?? regGer(lang, l.inf), l.inf.slice(0, -2), l.ger ? 'irregular' : 'regular'),
  pp: mk(l.pp ?? regPP(l.inf), l.inf.slice(0, -2), l.pp ? 'irregular' : 'regular'),
  inf: { aux: '', word: l.inf, split: l.inf.length - 2, kind: 'regular' as Kind },
})

type RomBuild = (l: RomLemma, p: number, variant: Variant) => Form
const ES: [string, string, Time, 1 | 2 | 3, RomBuild][] = [
  ['pres', 'Presente de indicativo', 'now', 1, (l, p, v) => romSimple('es', l, 'pres', p, v)],
  ['prog', 'Presente progresivo (estar + gerundio)', 'now', 1, (l, p) => withAux(nonFinite('es', l).ger, AUX.es.estar[p])],
  ['pret', 'Pretérito perfecto simple', 'past', 1, (l, p, v) => romSimple('es', l, 'pret', p, v)],
  ['irA', 'Futuro próximo (ir a + infinitivo)', 'future', 1, (l, p) => withAux(nonFinite('es', l).inf, AUX.es.irA[p])],
  ['imperf', 'Pretérito imperfecto', 'past', 2, (l, p, v) => romSimple('es', l, 'imperf', p, v)],
  ['perf', 'Pretérito perfecto compuesto', 'past', 2, (l, p) => withAux(nonFinite('es', l).pp, AUX.es.haberPres[p])],
  ['fut', 'Futuro simple', 'future', 2, (l, p) => romFut(l, FUT.es, p)],
  ['cond', 'Condicional simple', 'maybe', 2, (l, p) => romFut(l, COND.es, p)],
  ['plusc', 'Pretérito pluscuamperfecto', 'past', 3, (l, p) => withAux(nonFinite('es', l).pp, AUX.es.haberImp[p])],
  ['futperf', 'Futuro compuesto', 'future', 3, (l, p) => withAux(nonFinite('es', l).pp, AUX.es.haberFut[p])],
  ['condperf', 'Condicional compuesto', 'maybe', 3, (l, p) => withAux(nonFinite('es', l).pp, AUX.es.haberCond[p])],
]
const PT: [string, string, Time, 1 | 2 | 3, RomBuild][] = [
  ['pres', 'Presente do indicativo', 'now', 1, (l, p, v) => romSimple('pt', l, 'pres', p, v)],
  // Brazil: estar + gerúndio; Portugal: estar a + infinitivo.
  ['prog', 'Presente contínuo', 'now', 1, (l, p, v) => v === 'pt-PT' ? withAux(nonFinite('pt', l).inf, AUX.pt.estar[p] + ' a') : withAux(nonFinite('pt', l).ger, AUX.pt.estar[p])],
  ['pret', 'Pretérito perfeito', 'past', 1, (l, p, v) => romSimple('pt', l, 'pret', p, v)],
  ['irA', 'Futuro com ir (ir + infinitivo)', 'future', 1, (l, p) => withAux(nonFinite('pt', l).inf, AUX.pt.ir[p])],
  ['imperf', 'Pretérito imperfeito', 'past', 2, (l, p, v) => romSimple('pt', l, 'imperf', p, v)],
  ['fut', 'Futuro do presente', 'future', 2, (l, p) => romFut(l, FUT.pt, p)],
  ['cond', 'Futuro do pretérito (condicional)', 'maybe', 2, (l, p) => romFut(l, COND.pt, p)],
  ['mqp', 'Pretérito mais-que-perfeito composto', 'past', 3, (l, p) => withAux(nonFinite('pt', l).pp, AUX.pt.terImp[p])],
]
// ponytail: Futuro do presente simple is mostly written; speech uses "ir + infinitivo". Tagged formal so the UI says so.
const USAGE: Record<string, Usage> = { 'pt.fut': 'formal' }

/** `pron` only applies to French verbs that have a pronominal use (laver → se laver). */
export function conjugate(v: Verb, variant: Variant, pron = false): TenseTable[] {
  const lang = langOf(variant)
  const range = [0, 1, 2, 3, 4, 5]
  if (lang === 'en') {
    return EN.map(([id, label, time, level, aux, part]) => ({
      tense: { id, label, time, level },
      forms: range.map((p) => withAux(enWord(v.en, part, p), typeof aux === 'string' ? aux : aux[p])),
    }))
  }
  if (lang === 'fr') {
    return conjugateFrench(v.fr, pron && !!v.fr.pronominal)
  }
  const l = lemmaFor(v, lang, variant)
  return (lang === 'es' ? ES : PT).map(([id, label, time, level, build]) => ({
    tense: { id, label, time, level, usage: USAGE[`${lang}.${id}`] },
    forms: range.map((p) => build(l, p, variant)),
  }))
}

export const infinitive = (v: Verb, variant: Variant) => {
  const lang = langOf(variant)
  return lang === 'en' ? v.en.inf : lang === 'fr' ? v.fr.inf : lemmaFor(v, lang, variant).inf
}
export const syllables = (v: Verb, variant: Variant) => {
  const lang = langOf(variant)
  return lang === 'en' ? [v.en.inf] : (lang === 'fr' ? v.fr : lemmaFor(v, lang, variant)).syl.split('-')
}
export const noteFor = (v: Verb, variant: Variant) => {
  const lang = langOf(variant)
  return lang === 'en' ? v.en.note : lang === 'fr' ? v.fr.note : lemmaFor(v, lang, variant).note
}

/** Worst kind across the core (level 1–2) tenses — drives the Regular / Spelling / Irregular badge. */
export function verbKind(v: Verb, variant: Variant): Kind {
  const kinds = conjugate(v, variant).filter((t) => t.tense.level < 3).flatMap((t) => t.forms.flatMap((f) => (f ? [f.kind] : [])))
  return kinds.includes('irregular') ? 'irregular' : kinds.includes('spelling') ? 'spelling' : 'regular'
}

/** Tenses that mean roughly the same thing across languages, for side-by-side comparison. */
export const COMPARABLE: Record<'now' | 'past' | 'future', Record<Lang, string>> = {
  now: { en: 'present_simple', es: 'pres', pt: 'pres', fr: 'pres' },
  past: { en: 'past_simple', es: 'pret', pt: 'pret', fr: 'pc' },
  future: { en: 'future_simple', es: 'fut', pt: 'fut', fr: 'fut' },
}

/** Example sentence i (0 = present, 1 = past) for a variant; regional wording falls back to the main one. */
export function sentenceFor(v: Verb, i: number, variant: Variant): string {
  const s = v.ex[i]
  return ({
    en: s[0], es: s[1], pt: variant === 'pt-PT' ? s[3] ?? s[2] : s[2],
    fr: variant === 'fr-CA' ? v.fr.exCA?.[i] ?? v.fr.ex[i] : v.fr.ex[i],
  })[langOf(variant)]
}
