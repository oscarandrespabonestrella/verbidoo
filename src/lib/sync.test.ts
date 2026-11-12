import { describe, expect, test } from 'vitest'
import {
  activeProfileId, addProfile, allChildren, answer, eraseProgress, profileState, removeProfile, setLanguages, type State,
} from './progress'
import { mergeStates, syncOnce, type Remote, type RemoteChild } from './sync'

/** In-memory stand-in for the Supabase table (same contract as cloud.ts). */
function memoryRemote(rows: RemoteChild[] = []) {
  const table = new Map(rows.map((r) => [r.id, structuredClone(r)]))
  const remote: Remote = {
    list: async () => [...table.values()].map((r) => structuredClone(r)),
    upsert: async (rs) => { for (const r of rs) table.set(r.id, structuredClone(r)) },
    remove: async (ids) => { for (const id of ids) table.delete(id) },
  }
  return { remote, table }
}
const vp = (correct: number, wrong = 0) => ({ box: Math.min(5, correct), due: 0, correct, wrong })
const doc = (s: Partial<State>): State => ({
  native: 'es-ES', target: 'fr-FR', xp: 0, streak: 0, bestStreak: 0, lastDay: '', todayXp: 0, verbs: {}, stats: {}, unlocked: {},
  newToday: { day: '', ids: [] }, badges: [], xpBy: {}, badgesBy: {}, variantBy: {}, daily: { day: '', answers: 0, right: 0, row: 0, bestRow: 0, kindCounts: {}, spoken: 0, activeMs: 0, lastAt: 0, missions: [] },
  weekly: { week: '', xp: 0, days: [], missions: 0, done: false }, history: {}, missionsTotal: 0, weeklyWins: 0, character: 'owl',
  controls: { voiceCheck: false, recording: true, newPerDay: 5 }, updatedAt: 0, epoch: 0, ...s,
})

describe('mergeStates', () => {
  test('nothing earned on either device is lost', () => {
    const tablet = doc({ xp: 120, updatedAt: 1, badges: ['first'], verbs: { 'fr:eat': vp(5), 'fr:run': vp(1) }, unlocked: { fr: ['pres', 'proche', 'pc'] } })
    const phone = doc({ xp: 90, updatedAt: 2, badges: ['xp100'], verbs: { 'fr:run': vp(4, 1), 'fr:swim': vp(2) }, unlocked: { fr: ['pres', 'proche'] } })
    const m = mergeStates(tablet, phone)
    expect(m.xp).toBe(120)
    expect(m.badges.sort()).toEqual(['first', 'xp100'])
    expect(m.verbs['fr:eat'].correct).toBe(5)
    expect(m.verbs['fr:run'].correct).toBe(4) // the copy with more answers
    expect(m.verbs['fr:swim'].correct).toBe(2)
    expect(m.unlocked.fr).toEqual(['pres', 'proche', 'pc'])
  })

  test('settings and languages follow the most recently changed device', () => {
    const old = doc({ updatedAt: 1, controls: { voiceCheck: false, recording: true, newPerDay: 5 }, character: 'owl' })
    const recent = doc({ updatedAt: 9, controls: { voiceCheck: false, recording: false, newPerDay: 3 }, character: 'fox' })
    for (const m of [mergeStates(old, recent), mergeStates(recent, old)]) {
      expect(m.controls.newPerDay).toBe(3)
      expect(m.character).toBe('fox')
      expect(m.updatedAt).toBe(9)
    }
  })

  test('an erase wins over an older copy with more progress', () => {
    const before = doc({ xp: 500, epoch: 0, updatedAt: 50, verbs: { 'fr:eat': vp(5) } })
    const erased = doc({ xp: 0, epoch: 1, updatedAt: 10 })
    expect(mergeStates(before, erased).xp).toBe(0)
    expect(mergeStates(erased, before).verbs).toEqual({})
  })
})

describe('syncOnce against an in-memory cloud', () => {
  test('first sign-in on a new device: the empty starter child is dropped and the family is downloaded', async () => {
    const lulu: RemoteChild = { id: crypto.randomUUID(), name: 'Lulu', avatar: '🐼', data: doc({ xp: 40, updatedAt: 5 }) }
    const { remote } = memoryRemote([lulu])
    await syncOnce(remote)
    expect(allChildren().map((c) => c.profile.name)).toEqual(['Lulu'])
    expect(profileState(activeProfileId()).xp).toBe(40)
  })

  test('progress from both devices is merged and pushed back; deletions reach the cloud', async () => {
    const id = activeProfileId()
    setLanguages('es-ES', 'fr-FR')
    answer('eat', true, { kind: 'picture' }) // played here
    const otherDevice = { ...profileState(id), verbs: { 'fr:run': vp(3) }, updatedAt: 1 }
    const { remote, table } = memoryRemote([{ id, name: 'Lulu', avatar: '🐼', data: otherDevice }])
    await syncOnce(remote)
    const local = profileState(id)
    expect(Object.keys(local.verbs).sort()).toEqual(['fr:eat', 'fr:run'])
    expect(Object.keys(table.get(id)!.data.verbs).sort()).toEqual(['fr:eat', 'fr:run'])

    const temp = addProfile('Temp', '🐸')
    await syncOnce(remote)
    expect(table.has(temp)).toBe(true) // new local child uploaded
    removeProfile(temp)
    await syncOnce(remote)
    expect(table.has(temp)).toBe(false) // removed in the cloud too
    expect(allChildren().some((c) => c.profile.id === temp)).toBe(false)
  })

  test('erasing on this device clears the cloud copy instead of being undone by it', async () => {
    const id = activeProfileId()
    const { remote, table } = memoryRemote([{ id, name: 'Lulu', avatar: '🐼', data: { ...profileState(id), xp: 999 } }])
    eraseProgress(id)
    await syncOnce(remote)
    expect(profileState(id).xp).toBe(0)
    expect(table.get(id)!.data.xp).toBe(0)
    expect(table.get(id)!.data.target).toBe('fr-FR') // languages kept
  })
})

test('merge keeps XP and badges per learning language, and reads saves from before Dutch', () => {
  // An old French-only save (no xpBy) on one device; the other device switched to Dutch later.
  const old = doc({ xp: 300, badges: ['first', 'xp100'], updatedAt: 1, target: 'fr-FR' })
  const dutch = doc({ xp: 40, badges: ['first'], xpBy: { fr: 120 }, badgesBy: { fr: ['first'] }, updatedAt: 2, target: 'nl-NL' })
  const m = mergeStates(old, dutch)
  expect(m.target).toBe('nl-NL')
  expect(m.xp).toBe(40)
  expect(m.badges).toEqual(['first'])
  expect(m.xpBy).toEqual({ fr: 300, nl: 40 })
  expect([...m.badgesBy.fr].sort()).toEqual(['first', 'xp100'])
  expect(mergeStates({ ...old, xpBy: undefined as never }, old).xp).toBe(300)
})
