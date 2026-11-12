import type { NlLemma } from '../data/dutch'
import { join, mk, six, type Form, type Kind, type Tense, type TenseTable } from './core'

/**
 * Dutch conjugation (ANS / Taalunie tense names). Regular ("weak") verbs follow 't kofschip:
 * a root ending in t k f s ch p x takes -te/-t (werkte, gewerkt), any other -de/-d (speelde, gespeeld; leven → leefde).
 * Strong and irregular verbs give their past and participle in the data.
 */
const AUX = {
  hebben: { pres: six('heb hebt heeft hebben hebben hebben'), past: six('had had had hadden hadden hadden') },
  zijn: { pres: six('ben bent is zijn zijn zijn'), past: six('was was was waren waren waren') },
}
const ZAL = six('zal zult zal zullen zullen zullen')
const ZOU = six('zou zou zou zouden zouden zouden')
const GA = six('ga gaat gaat gaan gaan gaan')
const REFL = six('me je zich ons je zich')

/** The verb without its separable particle (aankomen → komen, naar buiten gaan → gaan). */
const core = (l: NlLemma) => (l.sep ? l.inf.slice(l.sep.length).trim() : l.inf)
/** Infinitive minus -en / -n: the root the 't kofschip rule looks at (leven → lev, so leefde, not leefte). */
const root = (l: NlLemma) => { const c = core(l); return c.endsWith('en') ? c.slice(0, -2) : c.slice(0, -1) }
const stem = (l: NlLemma) => l.stem ?? root(l)
const voiceless = (l: NlLemma) => /(t|k|f|s|ch|p|x)$/.test(root(l))
/** Spelling change between root and stem (mak → maak, gev → geef, renn → ren). */
const stemKind = (l: NlLemma): Kind => (stem(l) === root(l) ? 'regular' : 'spelling')
/** Separable particle written before the participle: aan|gekomen, open|gemaakt; "naar buiten" stays a separate word. */
const withSep = (l: NlLemma, w: string) => (!l.sep ? w : l.sep.includes(' ') ? `${l.sep} ${w}` : l.sep + w)
/** Words after the verb: separable particle, then a fixed preposition (kom aan, hou van). */
const tail = (l: NlLemma, extra = '') => join(join(extra, l.sep ?? ''), l.prep ?? '')
const withTail = (f: Form, after: string): Form => (after ? { ...f, after } : f)

// ── Simple forms ──
function pres(l: NlLemma, p: number): Form {
  const s = stem(l)
  if (l.pres) return mk(six(l.pres)[p], s, 'irregular')
  if (p >= 3) return mk(core(l), s, stemKind(l))
  const w = p === 0 || s.endsWith('t') ? s : s + 't'
  return mk(w, s, stemKind(l))
}
function past(l: NlLemma, p: number): Form {
  const s = stem(l)
  if (l.past) { const [sg, pl] = l.past.split(' '); return mk(p < 3 ? sg : pl, s, 'irregular') }
  const end = (voiceless(l) ? 'te' : 'de') + (p < 3 ? '' : 'n')
  return mk(s + end, s, stemKind(l))
}
/** ge + stem + t/d; ge- becomes geë/geï/geü before e, i, u (geëindigd); no ge- after an unstressed prefix. */
function participle(l: NlLemma): Form {
  if (l.pp) return mk(withSep(l, l.pp), withSep(l, l.pp), 'irregular')
  const s = stem(l)
  const ge = l.noGe ? '' : /^[eiu]/.test(s) ? `ge${{ e: 'ë', i: 'ï', u: 'ü' }[s[0]]}` : 'ge'
  const body = /^[eiu]/.test(s) && !l.noGe ? s.slice(1) : s
  const word = withSep(l, ge + body + (/[td]$/.test(s) ? '' : voiceless(l) ? 't' : 'd'))
  return mk(word, withSep(l, ge + body), stemKind(l))
}
const infForm = (l: NlLemma): Form => ({ aux: '', word: l.inf, split: l.inf.length, kind: 'regular' })

const auxOf = (l: NlLemma) => AUX[l.aux === 'zijn' ? 'zijn' : 'hebben']
const r = (pron: boolean, p: number) => (pron ? REFL[p] : '')

type Build = (l: NlLemma, p: number, pron: boolean) => Form | null
/** ik eet, ik was me, ik kom aan, ik hou van. */
const simple = (fn: (l: NlLemma, p: number) => Form): Build => (l, p, pron) => withTail(fn(l, p), tail(l, r(pron, p)))
/** ik heb gegeten, ik heb me gewassen, ik ben aangekomen, ik heb gehouden van. */
const perfect = (t: 'pres' | 'past'): Build => (l, p, pron) =>
  withTail({ ...participle(l), aux: join(auxOf(l)[t][p], r(pron, p)) }, l.prep ?? '')
/** ik zal gegeten hebben, ik zou gekomen zijn: the participle comes before the infinitive of the auxiliary. */
const futPerfect = (head: string[]): Build => (l, p, pron) =>
  withTail({ ...participle(l), aux: join(head[p], r(pron, p)) }, join(l.aux === 'zijn' ? 'zijn' : 'hebben', l.prep ?? ''))
/** ik ga eten, ik zal me wassen, ik ben aan het eten. */
const periphrasis = (head: (p: number) => string, mid = ''): Build => (l, p, pron) =>
  withTail({ ...infForm(l), aux: join(join(head(p), r(pron, p)), mid) }, l.prep ?? '')
/** Imperative: one form, said to "jij" (eet!, kom aan!, was je!). */
const imperative: Build = (l, p, pron) => {
  if (p !== 1 || l.noImper) return null
  const f = l.imper ? mk(l.imper, stem(l), 'irregular') : mk(stem(l), stem(l), stemKind(l))
  return withTail(f, tail(l, pron ? 'je' : ''))
}
/** Archaic subjunctive (leve de koning, men neme): singular = infinitive minus -n, plural = infinitive. */
const subjunctive: Build = (l, p) => {
  const c = core(l), sg = l.subj ?? (c.endsWith('en') ? c.slice(0, -1) : c)
  return withTail(mk(p < 3 ? sg : c, stem(l), 'regular'), tail(l))
}

const LIT = 'literary' as const
const TENSES: [Tense, Build][] = [
  [{ id: 'ott', label: 'Onvoltooid tegenwoordige tijd (presens)', time: 'now', level: 1 }, simple(pres)],
  [{ id: 'prog', label: 'Aan het + infinitief (bezig zijn)', time: 'now', level: 1 }, periphrasis((p) => AUX.zijn.pres[p], 'aan het')],
  [{ id: 'vtt', label: 'Voltooid tegenwoordige tijd (perfectum)', time: 'past', level: 1 }, perfect('pres')],
  [{ id: 'gaan', label: 'Gaan + infinitief (nabije toekomst)', time: 'future', level: 1 }, periphrasis((p) => GA[p])],
  [{ id: 'imper', label: 'Gebiedende wijs (imperatief)', time: 'order', level: 1, imperative: true }, imperative],
  [{ id: 'ovt', label: 'Onvoltooid verleden tijd (imperfectum)', time: 'past', level: 2 }, simple(past)],
  [{ id: 'ottt', label: 'Onvoltooid tegenwoordige toekomende tijd (zullen)', time: 'future', level: 2 }, periphrasis((p) => ZAL[p])],
  [{ id: 'ovtt', label: 'Onvoltooid verleden toekomende tijd (zou, conditionalis)', time: 'maybe', level: 2 }, periphrasis((p) => ZOU[p])],
  [{ id: 'vvt', label: 'Voltooid verleden tijd (plusquamperfectum)', time: 'past', level: 3 }, perfect('past')],
  [{ id: 'vttt', label: 'Voltooid tegenwoordige toekomende tijd', time: 'future', level: 3 }, futPerfect(ZAL)],
  [{ id: 'vvtt', label: 'Voltooid verleden toekomende tijd', time: 'maybe', level: 3 }, futPerfect(ZOU)],
  [{ id: 'subj', label: 'Aanvoegende wijs (conjunctief)', time: 'wish', level: 3, usage: LIT }, subjunctive],
]

/** `pron` = reflexive use (zich wassen: ik was me, ik heb me gewassen). */
export function conjugateDutch(l: NlLemma, pron = false): TenseTable[] {
  return TENSES.map(([tense, build]) => ({ tense, forms: [0, 1, 2, 3, 4, 5].map((p) => build(l, p, pron && tense.id !== 'subj')) }))
}

/** Infinitive, te-infinitive and participles — the forms with no person. */
export function dutchNonFinite(l: NlLemma, pron = false) {
  const z = pron ? 'zich' : ''
  const inf = withTail({ ...infForm(l), aux: z }, l.prep ?? '')
  const ppres = withSep(l, core(l) + 'd')
  return {
    inf,
    // te goes between a separable particle and the verb: aan te komen.
    te: withTail(l.sep ? { ...infForm(l), word: core(l), aux: join(z, `${l.sep} te`) } : { ...infForm(l), aux: join(z, 'te') }, l.prep ?? ''),
    ppres: withTail(mk(ppres, stem(l), 'regular'), l.prep ?? ''),
    pp: participle(l),
  }
}
