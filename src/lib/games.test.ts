import { expect, test } from 'vitest'
import { VERBS } from '../data/verbs'
import { conjugate, formText } from '../engine/conjugate'
import { makeQ, pronunciationScore, type Kind } from './games'

const KINDS: Kind[] = ['picture', 'listen', 'conjugate', 'complete', 'timetravel', 'translate', 'build', 'pronounce']

// Randomised generators: run each game many times for every verb and level and check the invariants.
test.each(KINDS)('%s questions are well-formed for every verb and level', (kind) => {
  for (const verb of VERBS) for (const level of [1, 2, 3]) for (let r = 0; r < 8; r++) {
    const q = makeQ(kind, verb, VERBS, level, 'fr-FR', 'es-419')
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
      const also = { past: ['imp', 'pqp'], future: ['proche', 'fut', 'futant'], now: ['prog'] }[q.to!]
      const tables = conjugate(verb, 'fr-FR')
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
