import type { FrLemma } from '../data/french'
import { join, mk, six, vowelStart, withAux, type Form, type Tense, type TenseTable } from './core'

const AUXS = {
  avoir: {
    pres: six('ai as a avons avez ont'), imp: six('avais avais avait avions aviez avaient'),
    fut: six('aurai auras aura aurons aurez auront'), cond: six('aurais aurais aurait aurions auriez auraient'),
    ps: six('eus eus eut eûmes eûtes eurent'), subj: six('aie aies ait ayons ayez aient'),
    subjImp: six('eusse eusses eût eussions eussiez eussent'),
  },
  etre: {
    pres: six('suis es est sommes êtes sont'), imp: six('étais étais était étions étiez étaient'),
    fut: six('serai seras sera serons serez seront'), cond: six('serais serais serait serions seriez seraient'),
    ps: six('fus fus fut fûmes fûtes furent'), subj: six('sois sois soit soyons soyez soient'),
    subjImp: six('fusse fusses fût fussions fussiez fussent'),
  },
}
type AuxTense = keyof typeof AUXS.avoir
const END = {
  er: six('e es e ons ez ent'), imp: six('ais ais ait ions iez aient'), fut: six('ai as a ons ez ont'),
  psEr: six('ai as a âmes âtes èrent'),
}
const ALLER = six('vais vas va allons allez vont')
const REFL = six('me te se nous vous se')
const IMPER_PERSONS = [1, 3, 4] // tu, nous, vous
const HAT: Record<string, string> = { a: 'â', i: 'î', u: 'û' }
/** Circumflex on the theme's last vowel: bu → bû(mes), fi → fî(mes), vin → vîn(mes). */
const hatOf = (th: string) => th.replace(/([aiu])(n?)$/, (_, v: string, n: string) => HAT[v] + n)

const base = (inf: string) => inf.replace(/(oir|er|ir|re)$/, '')
const isEr = (l: FrLemma) => l.inf.endsWith('er')
/** manger → mangeons / mangeâmes, commencer → commençons: keep g/c soft before a or o. */
const soft = (stem: string, end: string) =>
  /^[aâoô]/.test(end) ? (stem.endsWith('g') ? stem + 'e' : stem.endsWith('c') ? stem.slice(0, -1) + 'ç' : stem) : stem
/** Reflexive pronoun for person p, elided before a vowel (m'habille, t'es). */
const refl = (p: number, next: string) => (p !== 3 && p !== 4 && vowelStart(next) ? REFL[p][0] + "'" : REFL[p])
const addRefl = (f: Form, p: number): Form => ({ ...f, aux: join(refl(p, f.aux || f.word), f.aux) })

// ── Simple tenses ──
const presWords = (l: FrLemma) => (l.pres ? six(l.pres) : END.er.map((e) => soft(base(l.inf), e) + e))
function pres(l: FrLemma, p: number): Form {
  const b = base(l.inf)
  if (l.pres) return mk(six(l.pres)[p], b, 'irregular')
  const s = soft(b, END.er[p])
  return mk(s + END.er[p], b, s !== b ? 'spelling' : 'regular')
}
/** Stem of "nous" in the present (buvons → buv, mangeons → mange): source of imparfait, subjonctif nous/vous, participe présent. */
const nousStem = (l: FrLemma) => presWords(l)[3].slice(0, -3)
function imp(l: FrLemma, p: number): Form {
  const end = END.imp[p]
  const root = l.imp ?? nousStem(l)
  const stem = end.startsWith('i') ? root.replace(/ge$/, 'g').replace(/ç$/, 'c') : root // mangions, commencions
  return { aux: '', word: stem + end, split: stem.length, kind: l.pres || stem === base(l.inf) ? 'regular' : 'spelling' }
}
function fut(l: FrLemma, ends: string[], p: number): Form {
  const stem = l.fut ?? (l.inf.endsWith('re') ? l.inf.slice(0, -1) : l.inf)
  return { aux: '', word: stem + ends[p], split: stem.length, kind: l.fut ? 'irregular' : 'regular' }
}
/** Passé simple theme vowel: -er → a (manges → mangea), others i or u (dormi, bu). */
const psTheme = (l: FrLemma) => l.ps ?? (isEr(l) ? soft(base(l.inf), 'a') + 'a' : base(l.inf) + 'i')
function passeSimple(l: FrLemma, p: number): Form {
  const b = base(l.inf)
  if (isEr(l) && !l.ps) {
    const s = soft(b, END.psEr[p])
    return mk(s + END.psEr[p], b, s !== b ? 'spelling' : 'regular')
  }
  const th = psTheme(l), hat = hatOf(th)
  return mk([th + 's', th + 's', th + 't', hat + 'mes', hat + 'tes', th + 'rent'][p], b, l.ps ? 'irregular' : 'regular')
}
function subj(l: FrLemma, p: number): Form {
  const b = base(l.inf)
  if (l.subj) return mk(six(l.subj)[p], b, 'irregular')
  // je/tu/il/ils from the ils-present stem (boivent → boive); nous/vous = imparfait (buvions).
  if (p === 3 || p === 4) return imp(l, p)
  const stem = presWords(l)[5].slice(0, -3)
  return { aux: '', word: stem + ['e', 'es', 'e', '', '', 'ent'][p], split: stem.length, kind: 'regular' }
}
function subjImp(l: FrLemma, p: number): Form {
  const th = psTheme(l), hat = hatOf(th)
  const word = [th + 'sse', th + 'sses', hat + 't', th + 'ssions', th + 'ssiez', th + 'ssent'][p]
  return mk(word, base(l.inf), l.ps ? 'irregular' : 'regular')
}
/** Imperative: tu drops the -s of -es verbs (tu manges → mange, tu ouvres → ouvre). */
function imper(l: FrLemma, p: number): Form | null {
  if (l.noImper || !IMPER_PERSONS.includes(p)) return null
  const b = base(l.inf)
  if (l.imper) return mk(six(l.imper)[IMPER_PERSONS.indexOf(p)], b, 'irregular')
  const f = pres(l, p)
  return p === 1 && f.word.endsWith('es') ? { ...f, word: f.word.slice(0, -1) } : f
}

// ── Non-finite and compound ──
function pp(l: FrLemma, p: number, agree: boolean): Form {
  const b = base(l.inf)
  const w = l.pp ?? b + (isEr(l) ? 'é' : l.inf.endsWith('ir') && !l.inf.endsWith('oir') ? 'i' : 'u')
  // With être the participle agrees with the subject: allé(e) / allé(e)s.
  return mk(agree ? w + (p < 3 ? '(e)' : '(e)s') : w, b, l.pp ? 'irregular' : 'regular')
}
const ppres = (l: FrLemma): Form => (l.ppres ? mk(l.ppres, base(l.inf), 'irregular') : mk(nousStem(l) + 'ant', base(l.inf), 'regular'))
const inf = (l: FrLemma): Form => ({ aux: '', word: l.inf, split: base(l.inf).length, kind: 'regular' })

/** Infinitive, participles and gerund — the forms with no person. */
export function frenchNonFinite(l: FrLemma, pron = false) {
  const etre = pron || !!l.etre
  const se = (f: Form) => (pron ? { ...f, aux: join(refl(2, f.aux || f.word), f.aux) } : f)
  return {
    inf: se(inf(l)),
    infPast: se(withAux(pp(l, 0, etre), etre ? 'être' : 'avoir')),
    ppres: se(ppres(l)),
    pp: pp(l, 0, false),
    gerund: (() => { const f = se(ppres(l)); return { ...f, aux: join('en', f.aux) } })(),
  }
}

type Build = (l: FrLemma, p: number, pron: boolean) => Form | null
const simple = (fn: (l: FrLemma, p: number) => Form): Build => (l, p, pron) => (pron ? addRefl(fn(l, p), p) : fn(l, p))
const compound = (t: AuxTense): Build => (l, p, pron) => {
  const etre = pron || !!l.etre
  const f = withAux(pp(l, p, etre), (etre ? AUXS.etre : AUXS.avoir)[t][p])
  return pron ? addRefl(f, p) : f
}
/** "vais manger", "suis en train de me laver": the reflexive goes right before the infinitive. */
const periphrasis = (head: (p: number) => string, withDe: boolean): Build => (l, p, pron) => {
  const r = pron ? refl(p, l.inf) : ''
  const de = withDe ? (vowelStart(r || l.inf) ? "d'" : 'de') : ''
  return withAux(inf(l), join(join(head(p), de), r))
}
const IMPER_PRON = ['', 'toi', '', 'nous', 'vous', '']
const imperative: Build = (l, p, pron) => {
  const f = imper(l, p)
  return f && pron ? { ...f, after: '-' + IMPER_PRON[p] } : f
}
const imperativeNeg: Build = (l, p, pron) => {
  const f = imper(l, p)
  if (!f) return null
  const r = pron ? refl(p, f.word) : ''
  return { ...f, aux: join(vowelStart(r || f.word) ? "n'" : 'ne', r), after: 'pas' }
}

const LIT = 'literary' as const
const TENSES: [Tense, Build][] = [
  [{ id: 'pres', label: 'Présent', time: 'now', level: 1 }, simple(pres)],
  [{ id: 'prog', label: 'Présent progressif (être en train de)', time: 'now', level: 1 }, periphrasis((p) => `${AUXS.etre.pres[p]} en train`, true)],
  [{ id: 'pc', label: 'Passé composé', time: 'past', level: 1 }, compound('pres')],
  [{ id: 'proche', label: 'Futur proche (aller + infinitif)', time: 'future', level: 1 }, periphrasis((p) => ALLER[p], false)],
  [{ id: 'imper', label: 'Impératif', time: 'order', level: 1, imperative: true }, imperative],
  [{ id: 'imp', label: 'Imparfait', time: 'past', level: 2 }, simple(imp)],
  [{ id: 'fut', label: 'Futur simple', time: 'future', level: 2 }, simple((l, p) => fut(l, END.fut, p))],
  [{ id: 'cond', label: 'Conditionnel présent', time: 'maybe', level: 2 }, simple((l, p) => fut(l, END.imp, p))],
  [{ id: 'impneg', label: 'Impératif négatif', time: 'order', level: 2, imperative: true }, imperativeNeg],
  [{ id: 'subj', label: 'Subjonctif présent', time: 'wish', level: 2, que: true }, simple(subj)],
  [{ id: 'pqp', label: 'Plus-que-parfait', time: 'past', level: 3 }, compound('imp')],
  [{ id: 'futant', label: 'Futur antérieur', time: 'future', level: 3 }, compound('fut')],
  [{ id: 'condp', label: 'Conditionnel passé', time: 'maybe', level: 3 }, compound('cond')],
  [{ id: 'subjp', label: 'Subjonctif passé', time: 'wish', level: 3, que: true }, compound('subj')],
  [{ id: 'ps', label: 'Passé simple', time: 'past', level: 3, usage: LIT }, simple(passeSimple)],
  [{ id: 'pa', label: 'Passé antérieur', time: 'past', level: 3, usage: LIT }, compound('ps')],
  [{ id: 'subjimp', label: 'Subjonctif imparfait', time: 'wish', level: 3, que: true, usage: LIT }, simple(subjImp)],
  [{ id: 'subjpqp', label: 'Subjonctif plus-que-parfait', time: 'wish', level: 3, que: true, usage: LIT }, compound('subjImp')],
]
// ponytail: impératif passé ("aie mangé") left out — almost never taught to children; add a TENSES row if needed.

/** `pron` = pronominal conjugation (se laver: je me lave, je me suis lavé(e), lave-toi). */
export function conjugateFrench(l: FrLemma, pron = false): TenseTable[] {
  return TENSES.map(([tense, build]) => ({ tense, forms: [0, 1, 2, 3, 4, 5].map((p) => build(l, p, pron)) }))
}
