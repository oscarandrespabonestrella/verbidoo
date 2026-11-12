/**
 * Adaptive learning rules — pure functions over a Learner snapshot, so every decision is unit-testable.
 * progress.ts owns storage; games.ts and the pages ask this module what to do next.
 */
import type { StringKey } from '../data/i18n'
import { TARGETS } from '../data/targets'
import type { Verb } from '../data/verbs'
import type { Kind } from './games'

/** Leitner box 0 (new) … 5 (mastered); learned at box ≥ 3. */
export interface VerbProgress { box: number; due: number; correct: number; wrong: number }
export interface Learner {
  verbs: Record<string, VerbProgress> // by verb id, current target language only
  stats: Record<string, number[]>     // 'kind:picture' / 'tense:imp' → recent outcomes, 1 = right, newest last
  unlocked: string[]                  // tense ids open in games
  newToday: string[]                  // verb ids introduced today
  newPerDay?: number                  // parent setting; defaults to NEW_PER_DAY
  path?: string[]                     // the target language's tense path; defaults to French
}

export const DAY = 86_400_000
export const INTERVALS = [0, 1, 2, 4, 7, 14] // days until a verb in box n is due again
export const WINDOW = 10                     // outcomes remembered per skill
export const NEW_PER_DAY = 5                 // new verbs introduced per day, so children are never flooded

export const pushOutcome = (o: number[] | undefined, ok: boolean) => [...(o ?? []), ok ? 1 : 0].slice(-WINDOW)
export const accuracy = (o: number[] | undefined) => (o?.length ? o.reduce((a, b) => a + b, 0) / o.length : null)
const errRate = (p?: VerbProgress) => (p && p.correct + p.wrong >= 2 ? p.wrong / (p.correct + p.wrong) : 0)

/** Spaced repetition: right → next box, wrong → box 1 (due tomorrow, never back to "new"). */
export function review(p: VerbProgress | undefined, ok: boolean, now = Date.now()): VerbProgress {
  const cur = p ?? { box: 0, due: now, correct: 0, wrong: 0 }
  const box = ok ? Math.min(5, cur.box + 1) : 1
  return { box, due: now + INTERVALS[box] * DAY, correct: cur.correct + +ok, wrong: cur.wrong + +!ok }
}

// ── Progressive tenses ──
/** Order tenses open up in games (per language, in data/targets.ts). The reference table always shows all of them. */
export const TENSE_PATH = TARGETS.fr.tensePath
/** The first two tenses of a path are open from the start. */
export const startTenses = (path: string[]) => path.slice(0, 2)
export const START_TENSES = startTenses(TENSE_PATH)
export const UNLOCK_AFTER = { tries: 6, accuracy: 0.75 }

/** Next tense to open, once the most recently opened one is mastered (≥ 6 tries, ≥ 75 % right). */
export function nextUnlock(l: Learner): string | null {
  const path = l.path ?? TENSE_PATH
  const latest = [...path].reverse().find((id) => l.unlocked.includes(id))
  const o = latest ? l.stats[`tense:${latest}`] : undefined
  if (!o || o.length < UNLOCK_AFTER.tries || accuracy(o)! < UNLOCK_AFTER.accuracy) return null
  return path.find((id) => !l.unlocked.includes(id)) ?? null
}
/** Weak and brand-new tenses come up more often. */
export function tenseWeight(l: Learner, id: string) {
  const o = l.stats[`tense:${id}`]
  return !o || o.length < 3 ? 3 : 1 + 3 * (1 - accuracy(o)!)
}

// ── Difficulty ──
/** Per-game difficulty from recent accuracy in that game; persists across sessions and moves both ways. */
export function levelFor(l: Learner, kind: Kind): 1 | 2 | 3 {
  const o = l.stats[`kind:${kind}`] ?? [], a = accuracy(o) ?? 0
  return o.length >= 6 && a >= 0.85 ? 3 : o.length >= 3 && a >= 0.65 ? 2 : 1
}

export function weightedPick<T>(items: T[], weight: (t: T) => number, rnd = Math.random): T {
  const w = items.map(weight), total = w.reduce((a, b) => a + b, 0)
  let r = rnd() * total
  for (let i = 0; i < items.length; i++) if ((r -= w[i]) < 0) return items[i]
  return items[items.length - 1]
}

// ── Mixed sessions ──
export const VOCAB_KINDS: Kind[] = ['picture', 'listen', 'translate']
/**
 * Game for this verb: a verb not yet answered right starts with recognition (picture/listen/translate),
 * weaker games come up more, and the same game never runs three times in a row.
 */
export function pickKind(l: Learner, verb: Verb, allowed: Kind[], recent: Kind[], rnd = Math.random): Kind {
  let pool = (l.verbs[verb.id]?.box ?? 0) < 1 ? allowed.filter((k) => VOCAB_KINDS.includes(k)) : allowed
  if (!pool.length) pool = allowed
  const last2 = recent.slice(-2)
  const varied = pool.filter((k) => !(last2.length === 2 && last2.every((r) => r === k)))
  if (varied.length) pool = varied
  return weightedPick(pool, (k) => 1 + 2 * (1 - (accuracy(l.stats[`kind:${k}`]) ?? 0.5)), rnd)
}

/**
 * A session plan: due reviews first (spaced repetition), then error-prone verbs, then up to 3 new ones
 * (capped per day), then the least-known rest. Short plans repeat verbs — with different games — to fill the rounds.
 */
export function buildSession(l: Learner, open: Verb[], rounds: number, focus?: string, now = Date.now()): Verb[] {
  const seen = open.filter((v) => l.verbs[v.id])
  const due = seen.filter((v) => l.verbs[v.id].due <= now).sort((a, b) => l.verbs[a.id].box - l.verbs[b.id].box)
  const weak = seen.filter((v) => !due.includes(v) && errRate(l.verbs[v.id]) > 0.34).sort((a, b) => errRate(l.verbs[b.id]) - errRate(l.verbs[a.id]))
  const fresh = open.filter((v) => !l.verbs[v.id]).slice(0, Math.min(3, Math.max(0, (l.newPerDay ?? NEW_PER_DAY) - l.newToday.length)))
  const rest = seen.filter((v) => !due.includes(v) && !weak.includes(v)).sort((a, b) => l.verbs[a.id].box - l.verbs[b.id].box)
  const focused = open.filter((v) => v.id === focus)
  const base = [...new Set([...focused, ...due.slice(0, 5), ...weak.slice(0, 2), ...fresh, ...due.slice(5), ...weak.slice(2), ...rest])]
  const pool = base.length ? base : open.slice(0, 3)
  return Array.from({ length: rounds }, (_, i) => pool[i % pool.length])
}

export const dueCount = (l: Learner, open: Verb[], now = Date.now()) => open.filter((v) => l.verbs[v.id] && l.verbs[v.id].due <= now).length
/** Verbs with the highest error rate (at least 2 answers, more than 30 % wrong). */
export const trickyVerbs = (l: Learner, open: Verb[], n = 5) =>
  open.filter((v) => errRate(l.verbs[v.id]) > 0.3).sort((a, b) => errRate(l.verbs[b.id]) - errRate(l.verbs[a.id])).slice(0, n)
    .map((v) => ({ verb: v, wrongPct: Math.round(errRate(l.verbs[v.id]) * 100) }))

// ── Recommendations ──
export interface Rec { icon: string; title: StringKey; vars: Record<string, string | number>; path: string; tense?: string; kind?: Kind; verb?: Verb }
/** Up to three next steps, most useful first. `tense` / `kind` / `verb` are filled into the text by the UI. */
export function recommendations(l: Learner, open: Verb[], allowedKinds: Kind[], now = Date.now()): Rec[] {
  const recs: Rec[] = []
  const path = l.path ?? TENSE_PATH
  const latest = [...path].reverse().find((id) => l.unlocked.includes(id))
  if (latest && !startTenses(path).includes(latest) && (l.stats[`tense:${latest}`]?.length ?? 0) < 3) {
    recs.push({ icon: '🔓', title: 'rec_unlocked', vars: {}, tense: latest, path: 'play/conjugate' })
  }
  const due = dueCount(l, open, now)
  if (due) recs.push({ icon: '🔁', title: 'rec_review', vars: { n: due }, path: 'play/mixed' })
  const weakTense = l.unlocked.map((id) => ({ id, o: l.stats[`tense:${id}`] }))
    .filter(({ o }) => o && o.length >= 4 && accuracy(o)! < 0.7).sort((a, b) => accuracy(a.o)! - accuracy(b.o)!)[0]
  if (weakTense) recs.push({ icon: '🎯', title: 'rec_weakTense', vars: { p: Math.round(accuracy(weakTense.o)! * 100) }, tense: weakTense.id, path: 'play/conjugate' })
  const weakKind = allowedKinds.map((k) => ({ k, o: l.stats[`kind:${k}`] }))
    .filter(({ o }) => o && o.length >= 5 && accuracy(o)! < 0.6).sort((a, b) => accuracy(a.o)! - accuracy(b.o)!)[0]
  if (weakKind) recs.push({ icon: '💪', title: 'rec_weakSkill', vars: { p: Math.round(accuracy(weakKind.o)! * 100) }, kind: weakKind.k, path: `play/${weakKind.k}` })
  const next = open.find((v) => !l.verbs[v.id])
  if (next && l.newToday.length < (l.newPerDay ?? NEW_PER_DAY)) recs.push({ icon: '🌟', title: 'rec_new', vars: {}, verb: next, path: `verb/${next.id}` })
  if (!recs.length) recs.push({ icon: '🗺️', title: 'rec_adventure', vars: {}, path: 'play/mixed' })
  return recs.slice(0, 3)
}
