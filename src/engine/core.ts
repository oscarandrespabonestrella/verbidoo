import type { Usage } from '../data/i18n'

export type Kind = 'regular' | 'spelling' | 'irregular'
/** `aux` + `word` + `after` ("ne mange pas", "lave-toi"); `word.slice(split)` is the part to highlight. */
export interface Form {
  aux: string; word: string; split: number; kind: Kind; after?: string
  stem?: number   // French only: index into frenchStems(l).list — the spoken stem this form is built on
  stemLen?: number // French only: letters of `word` drawn in the stem colour
  silent?: number // French only: trailing letters of `word` that are not pronounced
}
/** Groups shown in the UI. `wish` = subjunctive, `order` = imperative. */
export type Time = 'now' | 'past' | 'future' | 'maybe' | 'wish' | 'order'
export interface Tense {
  id: string; label: string; time: Time; level: 1 | 2 | 3; usage?: Usage
  que?: boolean       // subjunctive: shown as "que je…"
  imperative?: boolean // no subject pronoun; only tu / nous / vous exist
}
/** `null` = this person does not exist in this tense (imperative je/il/ils). */
export interface TenseTable { tense: Tense; forms: (Form | null)[] }

export const six = (s: string) => s.split(' ')
export const prefixLen = (a: string, b: string) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return i }
export const mk = (word: string, base: string, kind: Kind, aux = ''): Form => ({ aux, word, split: prefixLen(word, base), kind })
export const withAux = (f: Form, aux: string): Form => ({ ...f, aux })
/** Join two chunks; a chunk ending in an apostrophe (j', d', t') attaches without a space. */
export const join = (a: string, b: string) => (!a ? b : !b ? a : a.endsWith("'") ? a + b : `${a} ${b}`)
export const formText = (f: Form) => join(join(f.aux, f.word), f.after ?? '').replace(/ -/, '-')

// ponytail: treats every h as mute (habiter); add an h-aspiré list when a verb like "hurler" arrives.
export const vowelStart = (s: string) => /^[aeiouyhâàéèêëîïôûœ]/i.test(s)
