import { expect, test } from 'vitest'
import type { Variant } from '../data/i18n'
import { targetOf } from '../data/targets'
import { VERBS } from '../data/verbs'
import { conjugate, formText } from '../engine/conjugate'
import { makeQ, pronunciationScore, type Kind } from './games'

const KINDS: Kind[] = ['picture', 'listen', 'conjugate', 'complete', 'timetravel', 'translate', 'build', 'pronounce']

// Randomised generators: run each game many times for every verb and level and check the invariants.
const TARGETS_UNDER_TEST: [Variant, Variant][] = [['fr-FR', 'es-419'], ['nl-NL', 'pt-BR'], ['nl-BE', 'en-GB'], ['fr-CA', 'it-IT'], ['nl-NL', 'fr-FR'], ['fr-FR', 'fr-CA']]
test.each(KINDS.flatMap((k) => TARGETS_UNDER_TEST.map(([t, n]) => [k, t, n] as const)))('%s questions are well-formed for every verb and level (%s)', (kind, target, native) => {
  for (const verb of VERBS) for (const level of [1, 2, 3]) for (let r = 0; r < 8; r++) {
    const q = makeQ(kind, verb, VERBS, level, target, native)
    expect(q.spoken).toBeTruthy()
    if (q.options.length) {
      expect(q.options).toContain(q.answer)
      expect(new Set(q.options).size).toBe(q.options.length)
      expect(q.options.length).toBeGreaterThanOrEqual(2)
    }
    if (q.kind === 'complete') expect(q.stem! + q.answer).toBe(q.form!.word)
    if (q.kind === 'conjugate' || q.kind === 'timetravel') expect(formText(q.form!)).toBe(q.answer)
    if (q.tense) expect(q.tense.usage).toBeUndefined() // literary tenses are never quizzed
    if (q.kind === 'build') {
      expect([...q.tiles!].sort()).toEqual(q.answer.split(' ').sort())
      expect(q.translation).toBeTruthy()
    }
    if (q.kind === 'timetravel') {
      // No distractor may be another correct way to say it (Hier → imparfait, Demain → the other future…).
      const also = targetOf(target).travel.also[q.to!]
      const tables = conjugate(verb, target)
      const otherRight = tables.filter((x) => also.includes(x.tense.id) && x.tense.id !== q.tense!.id).map((x) => formText(x.forms[q.person!]!))
      for (const o of q.options) if (o !== q.answer) expect(otherRight).not.toContain(o)
    }
  }
})

test('complete-the-verb teaches spelling changes (nous mangeons)', () => {
  const eat = VERBS.find((v) => v.id === 'eat')!
  const seen = new Set<string>()
  for (let r = 0; r < 400; r++) { const q = makeQ('complete', eat, VERBS, 1, 'fr-FR', 'en-US'); seen.add(q.stem + '|' + q.answer) }
  expect(seen).toContain('mang|eons')
})

test('pronunciation score ignores case, accents and punctuation', () => {
  expect(pronunciationScore("J'écris mon nom.", 'j ecris mon nom')).toBe(1)
  expect(pronunciationScore('je mange', 'Je mange')).toBe(1)
  expect(pronunciationScore('je mange', 'je bois')).toBe(0.5)
  expect(pronunciationScore('manger', '')).toBe(0)
})
