import { useSyncExternalStore } from 'react'
import { STRINGS, TARGET_VARIANTS, langOf, uiLangOf, type StringKey, type TargetLang, type Variant } from '../data/i18n'
import { MASCOTS } from '../data/mascots'
import { TARGETS } from '../data/targets'
import { VERBS, type Verb } from '../data/verbs'
import { DAY, nextUnlock, pushOutcome, review, startTenses, type Learner, type VerbProgress } from './adaptive'
import type { Kind } from './games'
import {
  CHARACTERS, MISSION_XP, WEEKLY_XP, addActive, dailyMissions, freshDaily, freshWeekly, isDone, weekOf, weeklyChallenge,
  type Daily, type Facts, type Weekly,
} from './rewards'

export const DAILY_GOAL = 50
export type { VerbProgress }

/** Per-profile settings. Privacy-first defaults: automatic voice checking (audio leaves the device) is off. */
export interface Controls { voiceCheck: boolean; recording: boolean; newPerDay: number }
export const DEFAULT_CONTROLS: Controls = { voiceCheck: false, recording: true, newPerDay: 5 }

export interface State {
  native: Variant | null; target: Variant | null
  /** XP and badges of the current target language. Other languages wait in xpBy / badgesBy (see setLanguages). */
  xp: number; streak: number; bestStreak: number; lastDay: string; todayXp: number
  xpBy: Record<string, number>; badgesBy: Record<string, string[]>
  variantBy: Record<string, Variant>          // last variant picked per target language (fr → fr-CA)
  verbs: Record<string, VerbProgress>         // `${lang}:${verbId}`
  stats: Record<string, number[]>             // `${lang}|kind:picture`, `${lang}|tense:imp`
  unlocked: Record<string, string[]>          // lang → tense ids open in games
  newToday: { day: string; ids: string[] }    // `${lang}:${verbId}` introduced today
  badges: string[]
  daily: Daily; weekly: Weekly
  history: Record<string, { a: number; r: number; ms: number }> // per day, last 60 days, for the parent report
  missionsTotal: number; weeklyWins: number
  character: string
  controls: Controls
  updatedAt: number   // last local change (ms) — newer device wins for settings when syncing
  epoch: number       // bumped by "erase progress", so an erase is never undone by merging with an older copy
}

const today = (d = new Date()) => d.toISOString().slice(0, 10)
const fresh = (): State => ({
  native: null, target: null, xp: 0, streak: 0, bestStreak: 0, lastDay: '', todayXp: 0,
  verbs: {}, stats: {}, unlocked: {}, newToday: { day: '', ids: [] }, badges: [], xpBy: {}, badgesBy: {}, variantBy: {},
  daily: freshDaily(''), weekly: freshWeekly(''), history: {}, missionsTotal: 0, weeklyWins: 0,
  character: 'owl', controls: DEFAULT_CONTROLS, updatedAt: 0, epoch: 0,
})

// ── Profiles: several children on one device, each with their own progress. No personal data beyond a nickname. ──
export interface Profile { id: string; name: string; avatar: string }
/** `deleted`: children removed on this device, still to be removed from the cloud on the next sync. */
interface Index { active: string; list: Profile[]; deleted?: string[] }
const INDEX_KEY = 'verb-adventure:profiles'
const LEGACY_KEY = 'verb-adventure:v1'
const dataKey = (id: string) => `verb-adventure:p:${id}`
const read = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k: string, v: string | null) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v) } catch { /* private mode: memory only */ } }

/** Random ids, so children created on different devices never collide when a family syncs. */
// crypto.randomUUID only exists on https/localhost; plain http (a phone on the LAN) needs the getRandomValues fallback.
export const newId = (): string => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40 // version 4
  b[8] = (b[8] & 0x3f) | 0x80 // RFC 4122 variant
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function loadIndex(): Index {
  let i: Index | null = null
  try { i = JSON.parse(read(INDEX_KEY) ?? 'null') } catch { /* fall through */ }
  if (!i?.list?.length) {
    // First run, or a save from before profiles existed: it becomes the first child.
    const legacy = read(LEGACY_KEY)
    const id = newId()
    if (legacy) { write(dataKey(id), legacy); write(LEGACY_KEY, null) }
    i = { active: id, list: [{ id, name: '', avatar: '🦊' }] }
  }
  // Early builds used short ids ("p1"): give them UUIDs and move their data.
  for (const p of i.list.filter((x) => !UUID.test(x.id))) {
    const id = newId()
    write(dataKey(id), read(dataKey(p.id))); write(dataKey(p.id), null)
    if (i.active === p.id) i.active = id
    p.id = id
  }
  write(INDEX_KEY, JSON.stringify(i))
  return i
}
// Every child's state lives in memory; localStorage is only persistence (so nothing is lost if storage is blocked).
const cache = new Map<string, State>()
function loadState(id: string): State {
  const hit = cache.get(id)
  if (hit) return hit
  const s = parseState(id)
  cache.set(id, s)
  return s
}
const keep = (id: string, s: State) => { cache.set(id, s); write(dataKey(id), JSON.stringify(s)) }
function parseState(id: string): State {
  try {
    const base = fresh()
    const s: State = { ...base, ...JSON.parse(read(dataKey(id)) ?? '{}') }
    s.controls = { ...DEFAULT_CONTROLS, ...s.controls }
    // Saves from before French was the target language go back to setup.
    return s.target && !TARGET_VARIANTS.includes(s.target) ? { ...s, target: null } : s
  } catch { return fresh() }
}

let index = loadIndex()
let state = loadState(index.active)
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())
export const subscribe = (l: () => void) => (listeners.add(l), () => { listeners.delete(l) })
/** Counts local changes worth syncing (not profile switches, not data that just came from the cloud). */
let version = 0
export const localVersion = () => version
const changed = () => { version++; notify() }
function set(next: Partial<State>) {
  state = { ...state, ...next, updatedAt: Date.now() }
  keep(index.active, state)
  changed()
}
export const useProgress = () => useSyncExternalStore(subscribe, () => state)
export const useProfiles = () => useSyncExternalStore(subscribe, () => index)
export const activeProfileId = () => index.active
const saveIndex = (i: Index, isChange = true) => { index = i; write(INDEX_KEY, JSON.stringify(i)); if (isChange) changed(); else notify() }

export function switchProfile(id: string) {
  if (!index.list.some((p) => p.id === id)) return
  state = loadState(id)
  saveIndex({ ...index, active: id }, false)
}
export function addProfile(name: string, avatar: string) {
  const id = newId()
  keep(id, { ...fresh(), updatedAt: Date.now() })
  saveIndex({ ...index, list: [...index.list, { id, name: name.trim().slice(0, 20), avatar }] })
  return id
}
export function editProfile(id: string, name: string, avatar: string) {
  saveIndex({ ...index, list: index.list.map((p) => (p.id === id ? { ...p, name: name.trim().slice(0, 20), avatar } : p)) })
}
export function removeProfile(id: string) {
  if (index.list.length < 2) return
  write(dataKey(id), null)
  cache.delete(id)
  const list = index.list.filter((p) => p.id !== id)
  const deleted = [...(index.deleted ?? []), id]
  if (index.active === id) { state = loadState(list[0].id); saveIndex({ active: list[0].id, list, deleted }) } else saveIndex({ ...index, list, deleted })
}
/** Any child's state (the parent report reads all of them). */
export const profileState = (id: string) => (id === index.active ? state : loadState(id))
export function updateProfile(id: string, next: Partial<State>) {
  if (id === index.active) set(next)
  else { keep(id, { ...loadState(id), ...next, updatedAt: Date.now() }); changed() }
}
export const setControls = (id: string, c: Partial<Controls>) => updateProfile(id, { controls: { ...profileState(id).controls, ...c } })
/** Erase a child's learning data; keep languages, controls and character so they can carry on straight away. */
export function eraseProgress(id: string) {
  const s = profileState(id)
  updateProfile(id, { ...fresh(), native: s.native, target: s.target, controls: s.controls, epoch: s.epoch + 1 })
}

// ── Sync hooks (used by sync.ts) ──
export interface ChildDoc { profile: Profile; state: State }
export const allChildren = (): ChildDoc[] => index.list.map((profile) => ({ profile, state: profileState(profile.id) }))
export const pendingDeletes = () => index.deleted ?? []
export const clearDeletes = (ids: string[]) => saveIndex({ ...index, deleted: pendingDeletes().filter((x) => !ids.includes(x)) }, false)
/** Replace local children with the merged set from a sync. Not counted as a local change (no sync loop). */
export function applySynced(children: ChildDoc[]) {
  if (!children.length) return
  for (const c of children) keep(c.profile.id, { ...fresh(), ...c.state, controls: { ...DEFAULT_CONTROLS, ...c.state.controls } })
  const active = children.some((c) => c.profile.id === index.active) ? index.active : children[0].profile.id
  state = loadState(active)
  saveIndex({ ...index, active, list: children.map((c) => c.profile) }, false)
}
/** GDPR access / portability: everything this app stores, as one JSON document. */
export const exportAll = () => JSON.stringify({
  app: 'Verbidoo', exportedAt: new Date().toISOString(),
  profiles: index.list.map((p) => ({ profile: p, data: profileState(p.id) })),
}, null, 2)

// ── Derived values ──
const lang = (s: State) => langOf(s.target!) as TargetLang
/** Language the top-level xp/badges belong to. Saves from before Dutch existed were French. */
const xpLang = (s: State) => (s.target ? lang(s) : 'fr')
/**
 * Every language's XP and badges, with the current language's live values folded in.
 * Learning progress is separate per language; streak, missions and the time report stay per child.
 */
export function perLanguage(s: State) {
  const l = xpLang(s)
  return { xp: { ...s.xpBy, [l]: s.xp }, badges: { ...s.badgesBy, [l]: s.badges } }
}
/** XP earned in one target language. */
export const xpIn = (s: State, l: TargetLang) => perLanguage(s).xp[l] ?? 0
const vkey = (id: string) => `${lang(state)}:${id}`
export const verbProgress = (s: State, id: string): VerbProgress | undefined => s.target ? s.verbs[`${lang(s)}:${id}`] : undefined
export const isLearned = (s: State, id: string) => (verbProgress(s, id)?.box ?? 0) >= 3
export const learnedCount = (s: State) => VERBS.filter((v) => isLearned(s, v.id)).length
/** Verbs learned in one target language (the language picker shows each language's own progress). */
export const learnedIn = (s: State, l: TargetLang) => VERBS.filter((v) => (s.verbs[`${l}:${v.id}`]?.box ?? 0) >= 3).length
export const levelOf = (xp: number) => Math.floor(xp / 100) + 1
export const todayXp = (s: State) => (s.lastDay === today() ? s.todayXp : 0)
/** Streak counts only if the last active day was today or yesterday. */
export const liveStreak = (s: State) => (s.lastDay === today() || s.lastDay === today(new Date(Date.now() - DAY)) ? s.streak : 0)
export const dailyOf = (s: State) => (s.daily.day === today() ? s.daily : freshDaily(today()))
export const weeklyOf = (s: State) => (s.weekly.week === weekOf() ? s.weekly : freshWeekly(weekOf()))

/** The current target language's slice of the state, in the shape the adaptive rules read. */
export function learner(s: State): Learner {
  const l = lang(s), pre = `${l}:`, spre = `${l}|`
  const strip = <T,>(rec: Record<string, T>, p: string) =>
    Object.fromEntries(Object.entries(rec).filter(([k]) => k.startsWith(p)).map(([k, v]) => [k.slice(p.length), v]))
  return {
    verbs: strip(s.verbs, pre),
    stats: strip(s.stats, spre),
    unlocked: s.unlocked[l] ?? startTenses(TARGETS[l].tensePath),
    path: TARGETS[l].tensePath,
    newToday: s.newToday.day === today() ? s.newToday.ids.filter((k) => k.startsWith(pre)).map((k) => k.slice(pre.length)) : [],
    newPerDay: s.controls.newPerDay,
  }
}
export const facts = (s: State): Facts => ({
  xp: s.xp, bestStreak: Math.max(s.bestStreak, s.streak), learned: learnedCount(s),
  tenses: s.target ? learner(s).unlocked.length : 0, weeklyWins: s.weeklyWins, missionsTotal: s.missionsTotal,
})
/** Characters, with the first companion shown as the current language's mascot (Gaston for French, Ollie for Dutch). */
export const charactersFor = (s: State) => CHARACTERS.map((c) => {
  const m = c.id === 'owl' && s.target ? MASCOTS[TARGETS[lang(s)].mascot] : null
  return m ? { ...c, name: m.name, emoji: m.emoji } : c
})
export const unlockedCharacters = (s: State) => charactersFor(s).filter((c) => c.unlocked(facts(s)))
export const character = (s: State) => unlockedCharacters(s).find((c) => c.id === s.character) ?? charactersFor(s)[0]
export const setCharacter = (id: string) => set({ character: id })
/** Verbs in categories the child has unlocked with XP. */
export const openVerbs = (s: State, CATS: readonly { id: string; xp: number }[]) =>
  VERBS.filter((v) => s.xp >= CATS.find((c) => c.id === v.cat)!.xp)

/** Choose languages. Switching the target language swaps in that language's XP and badges (verbs, stats and tenses are already keyed by language). */
export function setLanguages(native: Variant, target: Variant) {
  const next = langOf(target)
  const variantBy = { ...state.variantBy, [next]: target }
  if (state.target && lang(state) === next) return set({ native, target, variantBy })
  const by = perLanguage(state)
  set({ native, target, variantBy, xpBy: by.xp, badgesBy: by.badges, xp: by.xp[next] ?? 0, badges: by.badges[next] ?? [] })
}

const introduced = (id: string): State['newToday'] => {
  const ids = state.newToday.day === today() ? state.newToday.ids : []
  return { day: today(), ids: ids.includes(vkey(id)) ? ids : [...ids, vkey(id)] }
}
export function markSeen(id: string) {
  if (!state.target || state.verbs[vkey(id)]) return
  set({ verbs: { ...state.verbs, [vkey(id)]: { box: 0, due: Date.now(), correct: 0, wrong: 0 } }, newToday: introduced(id) })
}

export interface AnswerResult { gained: number; unlocked: string | null; missions: string[]; weeklyWon: boolean }
/**
 * Record an answer: spaced repetition for the verb, rolling accuracy for the game and tense (only when the
 * answer was actually checked), XP/streak, daily/weekly counters, missions, and possibly a new tense.
 * `meta.spoken` = a pronunciation round; `meta.kind` is omitted for self-reported answers so they don't skew stats.
 */
export function answer(id: string, correct: boolean, meta: { kind?: Kind; tense?: string; spoken?: boolean; played?: Kind } = {}): AnswerResult {
  let gained = correct ? 10 : 2
  const d = today(), l = lang(state), now = Date.now()
  const stats = { ...state.stats }
  if (meta.kind) stats[`${l}|kind:${meta.kind}`] = pushOutcome(stats[`${l}|kind:${meta.kind}`], correct)
  if (meta.tense) stats[`${l}|tense:${meta.tense}`] = pushOutcome(stats[`${l}|tense:${meta.tense}`], correct)
  const played = meta.kind ?? meta.played

  const dly = dailyOf(state)
  const row = correct ? dly.row + 1 : 0
  const daily: Daily = {
    ...dly, answers: dly.answers + 1, right: dly.right + +correct, row, bestRow: Math.max(dly.bestRow, row),
    kindCounts: played ? { ...dly.kindCounts, [played]: (dly.kindCounts[played] ?? 0) + 1 } : dly.kindCounts,
    spoken: dly.spoken + +!!meta.spoken, activeMs: addActive(dly, now), lastAt: now,
  }
  // Missions completed by this answer pay out once.
  const completed = dailyMissions(d).filter((m) => !daily.missions.includes(m.id) && isDone(m, daily)).map((m) => m.id)
  daily.missions = [...daily.missions, ...completed]
  gained += completed.length * MISSION_XP

  const wk = weeklyOf(state)
  const weekly: Weekly = { ...wk, xp: wk.xp + gained, days: wk.days.includes(d) ? wk.days : [...wk.days, d], missions: wk.missions + completed.length }
  const weeklyWon = !weekly.done && isDone(weeklyChallenge(weekly.week), weekly)
  if (weeklyWon) { weekly.done = true; gained += WEEKLY_XP; weekly.xp += WEEKLY_XP }

  const h = state.history[d] ?? { a: 0, r: 0, ms: 0 }
  const history = Object.fromEntries(Object.entries({ ...state.history, [d]: { a: h.a + 1, r: h.r + +correct, ms: daily.activeMs } }).sort().slice(-60))
  const streak = state.lastDay === d ? state.streak : liveStreak(state) + 1
  const isNew = !state.verbs[vkey(id)]
  set({
    verbs: { ...state.verbs, [vkey(id)]: review(state.verbs[vkey(id)], correct) },
    stats, xp: state.xp + gained, todayXp: todayXp(state) + gained, lastDay: d, streak, bestStreak: Math.max(state.bestStreak, streak),
    daily, weekly, history, missionsTotal: state.missionsTotal + completed.length, weeklyWins: state.weeklyWins + +weeklyWon,
    ...(isNew ? { newToday: introduced(id) } : {}),
  })
  const unlock = nextUnlock(learner(state))
  if (unlock) set({ unlocked: { ...state.unlocked, [l]: [...learner(state).unlocked, unlock] } })
  awardBadges()
  return { gained, unlocked: unlock, missions: completed, weeklyWon }
}

const playedKinds = (s: State) => new Set(Object.keys(s.stats).map((k) => k.split('|kind:')[1]).filter(Boolean))
export const BADGES: { id: string; emoji: string; label: StringKey; test: (s: State) => boolean }[] = [
  { id: 'first', emoji: '🌱', label: 'badge_first', test: (s) => s.xp > 0 },
  { id: 'five', emoji: '🖐️', label: 'badge_five', test: (s) => learnedCount(s) >= 5 },
  { id: 'ten', emoji: '🔟', label: 'badge_ten', test: (s) => learnedCount(s) >= 10 },
  { id: 'all30', emoji: '👑', label: 'badge_all30', test: (s) => learnedCount(s) >= VERBS.length },
  { id: 'streak3', emoji: '🔥', label: 'badge_streak3', test: (s) => s.streak >= 3 },
  { id: 'streak7', emoji: '🌈', label: 'badge_streak7', test: (s) => s.streak >= 7 },
  { id: 'xp100', emoji: '💯', label: 'badge_xp100', test: (s) => s.xp >= 100 },
  { id: 'tenses5', emoji: '🧭', label: 'badge_tenses5', test: (s) => !!s.target && learner(s).unlocked.length >= 5 },
  { id: 'allGames', emoji: '🎮', label: 'badge_allGames', test: (s) => playedKinds(s).size >= 8 },
  { id: 'voice', emoji: '🎤', label: 'badge_voice', test: (s) => (s.stats[`${s.target ? lang(s) : 'fr'}|kind:pronounce`] ?? []).filter(Boolean).length >= 5 },
  { id: 'weekly', emoji: '🏅', label: 'badge_weekly', test: (s) => s.weeklyWins > 0 },
  { id: 'perfect', emoji: '🏆', label: 'badge_perfect', test: () => false }, // awarded by the game
]
export function awardBadges(extra?: string) {
  const got = BADGES.filter((b) => !state.badges.includes(b.id) && (b.test(state) || b.id === extra)).map((b) => b.id)
  if (got.length) set({ badges: [...state.badges, ...got] })
}

/** Due/weak verbs first, then new ones in frequency order (VERBS is ordered by priority). */
export function recommend(s: State, pool: Verb[] = VERBS): Verb[] {
  const now = Date.now()
  const score = (v: Verb) => {
    const p = verbProgress(s, v.id)
    if (!p) return 1000 + pool.indexOf(v) // new
    return p.due <= now ? p.box : 100 + p.box // due first, lowest box first
  }
  return [...pool].sort((a, b) => score(a) - score(b))
}

export function t(key: StringKey, vars: Record<string, string | number> = {}) {
  const ui = state.native ? uiLangOf(state.native) : 'en'
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), STRINGS[ui][key] as string)
}
export const praise = () => { const p = STRINGS[state.native ? uiLangOf(state.native) : 'en'].praise; return p[Math.floor(Math.random() * p.length)] }
