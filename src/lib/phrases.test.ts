import { expect, test } from 'vitest'
import { TARGET_VARIANTS } from '../data/i18n'
import { VERBS } from '../data/verbs'
import { targetOf } from '../data/targets'
import { makeQ, type Kind } from './games'
import { clipName, frenchPhrases, hasLetter, targetPhrases } from './phrases'

const phrases = new Set(targetPhrases())
const KINDS: Kind[] = ['picture', 'listen', 'conjugate', 'complete', 'timetravel', 'translate', 'build', 'pronounce']

test('every phrase a game says aloud has a recording', () => {
  const missing = new Set<string>()
  for (const variant of TARGET_VARIANTS) for (const v of VERBS) for (const kind of KINDS) for (const level of [1, 2, 3]) {
    for (let r = 0; r < 6; r++) {
      // All tenses unlocked, so every tense a child can ever meet is covered.
      const q = makeQ(kind, v, VERBS, level, variant, 'en-US', { unlocked: targetOf(variant).tensePath })
      for (const s of [q.spoken, ...(q.kind === 'pronounce' ? [q.answer] : []), ...(q.tiles ?? []).filter(hasLetter)]) if (!phrases.has(s)) missing.add(s)
    }
  }
  expect([...missing]).toEqual([])
})

test('recording names never collide', () => {
  const names = new Set([...phrases].map(clipName))
  expect(names.size).toBe(phrases.size)
  expect(frenchPhrases().length).toBeGreaterThan(4000)
})
