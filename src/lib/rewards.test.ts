import { describe, expect, test } from 'vitest'
import { wordMatches } from './games'
import {
  activeProfileId, addProfile, answer, dailyOf, eraseProgress, exportAll, learner, profileState, removeProfile,
  setControls, setLanguages, switchProfile,
} from './progress'
import { CHARACTERS, MISSIONS, addActive, dailyMissions, freshDaily, weekOf, weeklyChallenge, type Facts } from './rewards'

const base: Facts = { xp: 0, bestStreak: 0, learned: 0, tenses: 2, weeklyWins: 0, missionsTotal: 0 }

describe('missions and challenges', () => {
  test('three different missions per day, always including "answer 10", stable for the day', () => {
    for (let i = 0; i < 60; i++) {
      const day = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10)
      const m = dailyMissions(day)
      expect(new Set(m.map((x) => x.id)).size).toBe(3)
      expect(m[0].id).toBe('answers')
      expect(dailyMissions(day)).toEqual(m)
    }
    const variety = new Set(Array.from({ length: 30 }, (_, i) => dailyMissions(`2026-02-${String(i % 28 + 1).padStart(2, '0')}`).map((m) => m.id).join()))
    expect(variety.size).toBeGreaterThan(3)
    expect(MISSIONS.length).toBe(6)
  })

  test('weeks start on Monday and pick one challenge', () => {
    expect(weekOf(new Date('2026-11-11T12:00:00Z'))).toBe('2026-11-09') // Wednesday → Monday
    expect(weekOf(new Date('2026-11-09T00:00:00Z'))).toBe('2026-11-09')
    expect(weekOf(new Date('2026-11-15T23:00:00Z'))).toBe('2026-11-09') // Sunday
    expect(weeklyChallenge('2026-11-09')).toBe(weeklyChallenge('2026-11-09'))
  })

  test('active time counts real gaps and caps long pauses', () => {
    const d = { ...freshDaily('x'), lastAt: 1_000_000, activeMs: 0 }
    expect(addActive(d, 1_030_000)).toBe(30_000)
    expect(addActive(d, 1_000_000 + 10 * 60_000)).toBe(15_000) // came back after 10 min: counts as a short think
  })

  test('characters unlock from progress', () => {
    const open = (f: Facts) => CHARACTERS.filter((c) => c.unlocked(f)).map((c) => c.id)
    expect(open(base)).toEqual(['owl'])
    expect(open({ ...base, xp: 250, bestStreak: 3, learned: 10, missionsTotal: 10, tenses: 6, weeklyWins: 1 })).toHaveLength(CHARACTERS.length)
  })
})

test('word-by-word pronunciation feedback', () => {
  expect(wordMatches("J'écris mon nom.", 'je cris mon nom')).toEqual([
    { word: "J'écris", ok: false }, { word: 'mon', ok: true }, { word: 'nom.', ok: true },
  ])
  expect(wordMatches('Je mange', 'je mange').every((m) => m.ok)).toBe(true)
})

describe('progress store (in memory: no localStorage under test)', () => {
  test('missions pay out once; self-reported answers stay out of accuracy stats', () => {
    setLanguages('es-ES', 'fr-FR')
    const missions = dailyMissions(new Date().toISOString().slice(0, 10))
    let paid: string[] = []
    for (let i = 0; i < 12; i++) paid = paid.concat(answer('eat', true, { kind: 'picture' }).missions)
    expect(paid).toContain('answers')
    expect(new Set(paid).size).toBe(paid.length) // never twice
    const before = learner(profileState(activeProfileId())).stats['kind:pronounce']
    answer('eat', true, { played: 'pronounce', spoken: true })
    expect(learner(profileState(activeProfileId())).stats['kind:pronounce']).toEqual(before)
    expect(dailyOf(profileState(activeProfileId())).spoken).toBe(1)
    expect(missions.length).toBe(3)
  })

  test('profiles are separate; erase keeps languages and controls; export includes every child', () => {
    const first = activeProfileId()
    const second = addProfile('  Lulu the explorer with a long name ', '🐼')
    expect(profileState(second).xp).toBe(0)
    switchProfile(second)
    setLanguages('pt-BR', 'fr-FR')
    answer('run', true, { kind: 'picture' })
    expect(profileState(second).xp).toBeGreaterThan(0)
    expect(profileState(first).xp).toBeGreaterThan(profileState(second).xp)

    setControls(second, { newPerDay: 3 })
    eraseProgress(second)
    const erased = profileState(second)
    expect(erased.xp).toBe(0)
    expect(erased.target).toBe('fr-FR')
    expect(erased.controls.newPerDay).toBe(3)

    const dump = JSON.parse(exportAll())
    expect(dump.profiles).toHaveLength(2)
    expect(dump.profiles[1].profile.name.length).toBeLessThanOrEqual(20)

    removeProfile(second)
    expect(activeProfileId()).toBe(first)
    expect(JSON.parse(exportAll()).profiles).toHaveLength(1)
  })
})
