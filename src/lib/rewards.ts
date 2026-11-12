/** Daily missions, weekly challenges and unlockable characters — pure rules over counters kept by progress.ts. */
import type { StringKey } from '../data/i18n'

export interface Daily {
  day: string; answers: number; right: number; row: number; bestRow: number
  kindCounts: Record<string, number>; spoken: number; activeMs: number; lastAt: number; missions: string[]
}
export interface Weekly { week: string; xp: number; days: string[]; missions: number; done: boolean }
export const freshDaily = (day: string): Daily => ({ day, answers: 0, right: 0, row: 0, bestRow: 0, kindCounts: {}, spoken: 0, activeMs: 0, lastAt: 0, missions: [] })
export const freshWeekly = (week: string): Weekly => ({ week, xp: 0, days: [], missions: 0, done: false })

export const MISSION_XP = 20
export const WEEKLY_XP = 50
const CONJ = ['conjugate', 'complete', 'timetravel']

export interface Goal<T> { id: string; title: StringKey; target: number; value: (x: T) => number }
export const MISSIONS: Goal<Daily>[] = [
  { id: 'answers', title: 'm_answers', target: 10, value: (d) => d.answers },
  { id: 'right', title: 'm_right', target: 8, value: (d) => d.right },
  { id: 'row', title: 'm_row', target: 5, value: (d) => d.bestRow },
  { id: 'games', title: 'm_games', target: 3, value: (d) => Object.keys(d.kindCounts).length },
  { id: 'speak', title: 'm_speak', target: 3, value: (d) => d.spoken },
  { id: 'conj', title: 'm_conj', target: 5, value: (d) => CONJ.reduce((n, k) => n + (d.kindCounts[k] ?? 0), 0) },
]
export const WEEKLY: Goal<Weekly>[] = [
  { id: 'xp', title: 'w_xp', target: 300, value: (w) => w.xp },
  { id: 'days', title: 'w_days', target: 4, value: (w) => w.days.length },
  { id: 'missions', title: 'w_missions', target: 6, value: (w) => w.missions },
]

/** Stable small hash so everyone gets the same missions on the same day, and they change daily. */
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
/** Three missions for the day, always including one "answer" mission so every day is reachable. */
export function dailyMissions(day: string): Goal<Daily>[] {
  const rest = MISSIONS.slice(1)
  const h = hash(day), a = h % rest.length, b = (a + 1 + (h >> 4) % (rest.length - 1)) % rest.length
  return [MISSIONS[0], rest[a], rest[b]]
}
export const weeklyChallenge = (week: string) => WEEKLY[hash(week) % WEEKLY.length]
export const isDone = <T,>(g: Goal<T>, x: T) => g.value(x) >= g.target

/** Monday (UTC) of the week containing `d`, as YYYY-MM-DD. */
export function weekOf(d = new Date()) {
  const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7)))
  return m.toISOString().slice(0, 10)
}

/** Time actually spent answering: gaps between answers count, long pauses count as a short think. */
export const addActive = (d: Daily, now: number) => d.activeMs + (d.lastAt && now - d.lastAt < 120_000 ? now - d.lastAt : 15_000)

// ── Characters ──
export interface Facts { xp: number; bestStreak: number; learned: number; tenses: number; weeklyWins: number; missionsTotal: number }
export interface Character { id: string; emoji: string; name: string; hint?: StringKey; n?: number; unlocked: (f: Facts) => boolean }
export const levelFromXp = (xp: number) => Math.floor(xp / 100) + 1
export const CHARACTERS: Character[] = [
  // The language's mascot (Gaston / Ollie — progress.charactersFor fills in the name). The id stays 'owl' so saved profiles keep their companion.
  { id: 'owl', emoji: '🦕', name: 'Gaston', unlocked: () => true },
  { id: 'fox', emoji: '🦊', name: 'Roxy', hint: 'char_level', n: 3, unlocked: (f) => levelFromXp(f.xp) >= 3 },
  { id: 'cat', emoji: '🐱', name: 'Mimi', hint: 'char_streak', n: 3, unlocked: (f) => f.bestStreak >= 3 },
  { id: 'panda', emoji: '🐼', name: 'Bao', hint: 'char_learned', n: 10, unlocked: (f) => f.learned >= 10 },
  { id: 'robot', emoji: '🤖', name: 'Bip', hint: 'char_missions', n: 10, unlocked: (f) => f.missionsTotal >= 10 },
  { id: 'dragon', emoji: '🐉', name: 'Draco', hint: 'char_tenses', n: 6, unlocked: (f) => f.tenses >= 6 },
  { id: 'unicorn', emoji: '🦄', name: 'Luna', hint: 'char_weekly', unlocked: (f) => f.weeklyWins >= 1 },
]
export const characterById = (id: string) => CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0]
