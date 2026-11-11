import { describe, expect, test } from 'vitest'
import { VERBS } from '../data/verbs'
import {
  DAY, NEW_PER_DAY, START_TENSES, TENSE_PATH, buildSession, levelFor, nextUnlock, pickKind, pushOutcome,
  recommendations, review, tenseWeight, type Learner,
} from './adaptive'
import { makeQ, type Kind } from './games'

const fresh = (): Learner => ({ verbs: {}, stats: {}, unlocked: [...START_TENSES], newToday: [] })
const ok = (n: number) => Array(n).fill(1)
const NOW = 1_800_000_000_000

test('spaced repetition: right moves up a box, wrong goes back to box 1 (due tomorrow)', () => {
  const a = review(undefined, true, NOW)
  expect(a).toMatchObject({ box: 1, correct: 1, due: NOW + DAY })
  const b = review({ box: 4, due: 0, correct: 4, wrong: 0 }, false, NOW)
  expect(b).toMatchObject({ box: 1, wrong: 1, due: NOW + DAY })
  expect(review({ box: 5, due: 0, correct: 9, wrong: 0 }, true, NOW).box).toBe(5)
})

test('outcomes keep a rolling window of 10', () => {
  let o: number[] | undefined
  for (let i = 0; i < 15; i++) o = pushOutcome(o, i % 2 === 0)
  expect(o).toHaveLength(10)
})

describe('progressive tenses', () => {
  test('the next tense opens only after the latest one is mastered (≥ 6 tries, ≥ 75 %)', () => {
    const l = fresh()
    expect(nextUnlock(l)).toBeNull()
    l.stats['tense:proche'] = ok(5)
    expect(nextUnlock(l)).toBeNull() // not enough tries
    l.stats['tense:proche'] = [1, 1, 0, 1, 0, 1]
    expect(nextUnlock(l)).toBeNull() // 67 %
    l.stats['tense:proche'] = [1, 1, 0, 1, 1, 1]
    expect(nextUnlock(l)).toBe('pc')
  })

  test('simulation: a strong learner unlocks every tense in path order; a struggling one stays at the start', () => {
    const strong = fresh()
    for (let guard = 0; guard < 100; guard++) {
      const latest = strong.unlocked[strong.unlocked.length - 1]
      strong.stats[`tense:${latest}`] = ok(6)
      const next = nextUnlock(strong)
      if (!next) break
      strong.unlocked.push(next)
    }
    expect(strong.unlocked).toEqual(TENSE_PATH)

    const struggling = fresh()
    struggling.stats['tense:proche'] = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
    expect(nextUnlock(struggling)).toBeNull()
  })

  test('weak and brand-new tenses are favoured', () => {
    const l = fresh()
    l.stats['tense:pres'] = ok(10)
    l.stats['tense:proche'] = [0, 0, 1, 0, 0, 1]
    expect(tenseWeight(l, 'proche')).toBeGreaterThan(tenseWeight(l, 'pres'))
    expect(tenseWeight(l, 'pc')).toBe(3) // no data yet
  })

  test('games only quiz unlocked tenses', () => {
    const unlocked = ['pres', 'proche']
    for (const v of VERBS) for (const kind of ['conjugate', 'complete', 'timetravel'] as Kind[]) for (let r = 0; r < 5; r++) {
      const q = makeQ(kind, v, VERBS, 3, 'fr-FR', 'en-US', { unlocked })
      if (q.tense) expect(unlocked).toContain(q.tense.id)
      if (q.kind === 'timetravel') expect(q.to).not.toBe('past') // needs the passé composé
    }
  })
})

test('difficulty per game follows recent accuracy, both ways', () => {
  const l = fresh()
  expect(levelFor(l, 'conjugate')).toBe(1)
  l.stats['kind:conjugate'] = [1, 1, 0, 1]
  expect(levelFor(l, 'conjugate')).toBe(2)
  l.stats['kind:conjugate'] = ok(9)
  expect(levelFor(l, 'conjugate')).toBe(3)
  l.stats['kind:conjugate'] = [1, 1, 1, 0, 0, 0, 0, 1]
  expect(levelFor(l, 'conjugate')).toBe(1)
  expect(levelFor(l, 'picture')).toBe(1) // per game
})

describe('mixed sessions', () => {
  const MIXED: Kind[] = ['picture', 'listen', 'conjugate', 'complete', 'timetravel', 'translate', 'build', 'pronounce']

  test('a verb never answered right starts with recognition games', () => {
    const l = fresh()
    for (let i = 0; i < 50; i++) expect(['picture', 'listen', 'translate']).toContain(pickKind(l, VERBS[0], MIXED, []))
    l.verbs[VERBS[0].id] = { box: 2, due: 0, correct: 2, wrong: 0 }
    const seen = new Set(Array.from({ length: 300 }, () => pickKind(l, VERBS[0], MIXED, [])))
    expect(seen.size).toBeGreaterThan(5)
  })

  test('the same game never runs three times in a row (when there is a choice)', () => {
    const l = fresh()
    for (let i = 0; i < 50; i++) expect(pickKind(l, VERBS[0], ['picture', 'translate'], ['picture', 'picture'])).toBe('translate')
    expect(pickKind(l, VERBS[0], ['conjugate'], ['conjugate', 'conjugate'])).toBe('conjugate') // single-game mode
  })

  test('weaker games come up more often', () => {
    const l = fresh()
    l.verbs[VERBS[0].id] = { box: 3, due: 0, correct: 3, wrong: 0 }
    l.stats['kind:picture'] = ok(10)
    l.stats['kind:translate'] = Array(10).fill(0)
    let seq = 0
    const rnd = () => ((seq = (seq * 9301 + 49297) % 233280) / 233280)
    const counts = { picture: 0, translate: 0 }
    for (let i = 0; i < 2000; i++) counts[pickKind(l, VERBS[0], ['picture', 'translate'], [], rnd) as 'picture' | 'translate']++
    expect(counts.translate).toBeGreaterThan(counts.picture * 2)
  })

  test('first session: 3 new verbs, repeated to fill the rounds, never the same verb twice in a row', () => {
    const plan = buildSession(fresh(), VERBS, 10, undefined, NOW)
    expect(plan).toHaveLength(10)
    expect(new Set(plan.map((v) => v.id)).size).toBe(3)
    for (let i = 1; i < plan.length; i++) expect(plan[i].id).not.toBe(plan[i - 1].id)
  })

  test('due reviews come first, error-prone verbs next, then new ones; daily new-verb cap respected', () => {
    const l = fresh()
    const [a, b, c, d] = VERBS
    l.verbs[a.id] = { box: 3, due: NOW + DAY, correct: 3, wrong: 0 }  // fine, not due
    l.verbs[b.id] = { box: 2, due: NOW - 1, correct: 2, wrong: 0 }    // due
    l.verbs[c.id] = { box: 1, due: NOW + DAY, correct: 1, wrong: 3 }  // error-prone
    const plan = buildSession(l, VERBS, 10, undefined, NOW).map((v) => v.id)
    expect(plan[0]).toBe(b.id)
    expect(plan[1]).toBe(c.id)
    expect(plan[2]).toBe(d.id) // first new verb in frequency order

    l.newToday = VERBS.slice(10, 10 + NEW_PER_DAY).map((v) => v.id)
    const capped = buildSession(l, VERBS, 10, undefined, NOW)
    expect(capped.every((v) => l.verbs[v.id])).toBe(true) // no new verbs once the cap is reached
  })

  test('a focused verb leads the session', () => {
    expect(buildSession(fresh(), VERBS, 10, 'swim', NOW)[0].id).toBe('swim')
  })
})

test('recommendations: unlocked tense, due reviews, weak tense, weak game, new verb', () => {
  const l = fresh()
  expect(recommendations(l, VERBS, ['picture']).map((r) => r.title)).toEqual(['rec_new'])
  l.unlocked.push('pc')
  l.verbs.eat = { box: 1, due: NOW - 1, correct: 1, wrong: 0 }
  l.stats['tense:pres'] = [0, 0, 1, 0, 1]
  l.stats['kind:picture'] = [0, 0, 0, 1, 0]
  const recs = recommendations(l, VERBS, ['picture'], NOW)
  expect(recs.map((r) => r.title)).toEqual(['rec_unlocked', 'rec_review', 'rec_weakTense'])
  expect(recs[0].tense).toBe('pc')
  expect(recs[2]).toMatchObject({ tense: 'pres', vars: { p: 40 } })
})
