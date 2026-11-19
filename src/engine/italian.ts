import type { ItLemma } from '../data/italian'
import { mk, six, type Form, type Kind, type TenseTable, type Time } from './core'

// Italian is only a base language here (comparison panel, translations), so it covers the everyday tenses.
// ponytail: no passato remoto, congiuntivo or imperativo; add them if Italian ever becomes a language to learn.

type Conj = 'are' | 'ere' | 'ire'
const AVERE = six('ho hai ha abbiamo avete hanno'), ESSERE = six('sono sei è siamo siete sono')
const AVERE_IMP = six('avevo avevi aveva avevamo avevate avevano'), ESSERE_IMP = six('ero eri era eravamo eravate erano')
const STARE = six('sto stai sta stiamo state stanno')
const PRES: Record<Conj, string[]> = { are: six('o i a iamo ate ano'), ere: six('o i e iamo ete ono'), ire: six('o i e iamo ite ono') }
const IMPERF: Record<Conj, string[]> = { are: six('avo avi ava avamo avate avano'), ere: six('evo evi eva evamo evate evano'), ire: six('ivo ivi iva ivamo ivate ivano') }
const FUT = six('ò ai à emo ete anno'), COND = six('ei esti ebbe emmo este ebbero')

const conjOf = (l: ItLemma) => l.inf.slice(-3) as Conj
const stemOf = (l: ItLemma) => l.inf.slice(0, -3)
const kindOf = (word: string, regular: string, spelling: boolean): Kind => word !== regular ? 'irregular' : spelling ? 'spelling' : 'regular'

/** Regular present: stem + ending, with the spelling rules (giochi, mangi, finisco). */
function regularPres(l: ItLemma, p: number) {
  const stem = stemOf(l), c = conjOf(l)
  let end = PRES[c][p], root = stem, spelling = false
  if (l.isc && [0, 1, 2, 5].includes(p)) root += 'isc'
  if (c === 'are' && /[cg]$/.test(root) && end.startsWith('i')) { root += 'h'; spelling = true } // giocare → giochi, giochiamo
  if (/i$/.test(root) && end.startsWith('i')) { end = end.slice(1); spelling = true }             // mangiare → mangi, mangiamo
  return { word: root + end, spelling }
}

function presForm(l: ItLemma, p: number): Form {
  const reg = regularPres(l, p), word = l.pres ? six(l.pres)[p] : reg.word
  return mk(word, stemOf(l), kindOf(word, reg.word, reg.spelling))
}

function imperfForm(l: ItLemma, p: number): Form {
  const regular = stemOf(l) + IMPERF[conjOf(l)][p], word = l.imperf ? six(l.imperf)[p] : regular
  return mk(word, stemOf(l), word !== regular ? 'irregular' : 'regular')
}

/** Future / conditional stem: andare → andr- (irregular); regular -are → -er- (cercare → cercher-, mangiare → manger-). */
function futureStem(l: ItLemma) {
  if (l.fut) return { stem: l.fut, kind: 'irregular' as Kind }
  const c = conjOf(l)
  let s = stemOf(l)
  if (c !== 'are') return { stem: s + (c === 'ere' ? 'er' : 'ir'), kind: 'regular' as Kind }
  let spelling = false
  if (/[cg]i$/.test(s)) { s = s.slice(0, -1); spelling = true }
  else if (/[cg]$/.test(s)) { s += 'h'; spelling = true }
  return { stem: s + 'er', kind: (spelling ? 'spelling' : 'regular') as Kind }
}
function futForm(l: ItLemma, ends: string[], p: number): Form {
  const { stem, kind } = futureStem(l)
  return mk(stem + ends[p], stemOf(l), kind)
}

const participle = (l: ItLemma): { word: string; kind: Kind } =>
  l.pp ? { word: l.pp, kind: 'irregular' } : { word: stemOf(l) + ({ are: 'ato', ere: 'uto', ire: 'ito' } as const)[conjOf(l)], kind: 'regular' }
const gerund = (l: ItLemma): { word: string; kind: Kind } =>
  l.ger ? { word: l.ger, kind: 'irregular' } : { word: stemOf(l) + (conjOf(l) === 'are' ? 'ando' : 'endo'), kind: 'regular' }

/** Compound tense: avere/essere + participle (agreeing with a masculine subject: sono andato, siamo andati). */
function compound(l: ItLemma, p: number, aux: { avere: string[]; essere: string[] }): Form {
  const pp = participle(l)
  const word = l.essere && p >= 3 ? pp.word.replace(/o$/, 'i') : pp.word
  return { ...mk(word, stemOf(l), pp.kind), aux: (l.essere ? aux.essere : aux.avere)[p] }
}

type Build = (l: ItLemma, p: number) => Form
const TENSES: [string, string, Time, 1 | 2 | 3, Build][] = [
  ['pres', 'Presente', 'now', 1, presForm],
  ['prog', 'Presente progressivo (stare + gerundio)', 'now', 1, (l, p) => { const g = gerund(l); return { ...mk(g.word, stemOf(l), g.kind), aux: STARE[p] } }],
  ['pc', 'Passato prossimo', 'past', 1, (l, p) => compound(l, p, { avere: AVERE, essere: ESSERE })],
  ['imperf', 'Imperfetto', 'past', 2, imperfForm],
  ['fut', 'Futuro semplice', 'future', 2, (l, p) => futForm(l, FUT, p)],
  ['cond', 'Condizionale presente', 'maybe', 2, (l, p) => futForm(l, COND, p)],
  ['trap', 'Trapassato prossimo', 'past', 3, (l, p) => compound(l, p, { avere: AVERE_IMP, essere: ESSERE_IMP })],
]

export function conjugateItalian(l: ItLemma): TenseTable[] {
  return TENSES.map(([id, label, time, level, build]) => ({
    tense: { id, label, time, level },
    forms: [0, 1, 2, 3, 4, 5].map((p) => build(l, p)),
  }))
}
