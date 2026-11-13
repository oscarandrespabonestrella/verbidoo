/**
 * Every phrase the app can say in a learning language, built with the same functions the screens and games use.
 * scripts/audio-list.test.ts writes one list per recording folder (public/audio/<dir>/phrases.json), and
 * scripts/make_audio.py records each phrase with an open-source voice. phrases.test.ts checks the games
 * never say anything that is not in the list.
 */
import { TARGET_VARIANTS, langOf, type Variant } from '../data/i18n'
import { TARGETS, targetOf } from '../data/targets'
import { VERBS } from '../data/verbs'
import { conjugate, formText, infinitive, nonFiniteForms, say, sentenceFor, syllables } from '../engine/conjugate'

export const plain = (s: string) => s.replace(/[{}]/g, '')
/** Sentence split for display: the {verb} group stays one token; spaces are kept as tokens. */
export const sentenceTokens = (text: string) => text.split(/(\{[^}]+\}|\s+)/).filter(Boolean)
  .map((tok) => ({ word: plain(tok), verb: tok.startsWith('{'), space: /^\s+$/.test(tok) }))
/** What a tapped word says aloud (punctuation dropped). */
export const tappedWord = (w: string) => w.replace(/[¡!¿?.,]/g, '')
export const hasLetter = (w: string) => /\p{L}/u.test(w)

/** cyrb53: a small 53-bit string hash — names each recording after its text, so no lookup table is needed. */
export function clipName(text: string) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

/** Recording folder → the variants it speaks for (fr → fr-FR + fr-CA, azure/fr-CA → fr-CA), for every voice. */
export const AUDIO_DIRS: Record<string, Variant[]> = {}
for (const c of Object.values(TARGETS)) for (const dirs of Object.values(c.audio))
  for (const [v, dir] of Object.entries(dirs)) (AUDIO_DIRS[dir] ??= []).push(v as Variant)

/** Every phrase said in these variants (default: every learning variant). */
export function targetPhrases(variants: Variant[] = TARGET_VARIANTS): string[] {
  const out = new Set<string>()
  const add = (s: string) => { if (hasLetter(s)) out.add(s) }
  for (const variant of variants) for (const v of VERBS) {
    const lang = langOf(variant), c = targetOf(variant)
    add(infinitive(v, variant))
    const syl = syllables(v, variant)
    syl.forEach(add); add(syl.join(''))
    for (const pron of [false, true]) {
      const tables = conjugate(v, variant, pron)
      for (const t of tables) t.forms.forEach((f, p) => f && add(say(lang, p, f, t.tense)))
      nonFiniteForms(v, variant, pron).forEach(({ form }) => add(formText(form)))
      // Time Travel reads the answer with its time word: "Hier, j'ai mangé", "Gisteren, ik heb gegeten".
      const at = (id: string, p: number) => tables.find((x) => x.tense.id === id)!.forms[p]!
      if (!pron) for (let p = 0; p < 6; p++) {
        add(`${c.cue.past}, ${say(lang, p, at(c.compare.past, p))}`)
        add(`${c.cue.now}, ${say(lang, p, at(c.compare.now, p))}`)
        add(`${c.cue.future}, ${say(lang, p, at(c.travel.near, p))}`)
        add(`${c.cue.future}, ${say(lang, p, at(c.compare.future, p))}`)
      }
    }
    for (const i of [0, 1]) {
      const s = sentenceFor(v, i, variant)
      add(plain(s))
      for (const t of sentenceTokens(s)) if (!t.space) add(tappedWord(t.word)) // tapped words on the verb page
      plain(s).split(' ').forEach(add)                                           // tiles in Build a Sentence
    }
  }
  return [...out].sort()
}
/** French phrases (fr-FR + fr-CA share one recording folder). */
export const frenchPhrases = () => targetPhrases(TARGETS.fr.variants)
