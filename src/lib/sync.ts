/**
 * Device ↔ cloud sync for children's progress. The merge is pure and conflict-safe:
 * progress a child earned on any device survives, an explicit "erase" wins, and settings follow the newest device.
 */
import { TENSE_PATH } from './adaptive'
import { allChildren, applySynced, clearDeletes, pendingDeletes, type ChildDoc, type State } from './progress'

/** What the cloud stores per child. */
export interface RemoteChild { id: string; name: string; avatar: string; data: State }
/** The cloud table. cloud.ts implements it with Supabase; tests use an in-memory one. */
export interface Remote {
  list(): Promise<RemoteChild[]>
  upsert(rows: RemoteChild[]): Promise<void>
  remove(ids: string[]): Promise<void>
}

const union = (a: string[] = [], b: string[] = []) => [...new Set([...a, ...b])]
function mergeRecord<T>(a: Record<string, T> = {}, b: Record<string, T> = {}, pick: (x: T, y: T) => T) {
  const out: Record<string, T> = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = k in out ? pick(out[k], v) : v
  return out
}

/**
 * Merge two copies of one child's progress.
 * - Different `epoch` → one side was erased since: the higher epoch wins outright.
 * - Learning data is merged so nothing earned is lost: per verb, the copy with more answers; badges and
 *   unlocked tenses are unions; history per day keeps the busier copy; totals take the maximum.
 * - Everything else (languages, controls, character, today's counters) comes from the most recently changed copy.
 * ponytail: maximum (not sum) for XP — two devices playing offline the same day can lose a little XP, but a
 * shared starting total is never counted twice. Per-device XP deltas would fix it if it matters.
 */
export function mergeStates(a: State | undefined, b: State | undefined): State {
  if (!a) return b!
  if (!b) return a
  if ((a.epoch ?? 0) !== (b.epoch ?? 0)) return (a.epoch ?? 0) > (b.epoch ?? 0) ? a : b
  const [newer, older] = (a.updatedAt ?? 0) >= (b.updatedAt ?? 0) ? [a, b] : [b, a]
  const answers = (p: { correct: number; wrong: number }) => p.correct + p.wrong
  return {
    ...newer,
    xp: Math.max(a.xp, b.xp),
    bestStreak: Math.max(a.bestStreak ?? 0, b.bestStreak ?? 0),
    missionsTotal: Math.max(a.missionsTotal ?? 0, b.missionsTotal ?? 0),
    weeklyWins: Math.max(a.weeklyWins ?? 0, b.weeklyWins ?? 0),
    badges: union(newer.badges, older.badges),
    verbs: mergeRecord(newer.verbs, older.verbs, (x, y) => (answers(x) >= answers(y) ? x : y)),
    stats: mergeRecord(newer.stats, older.stats, (x) => x),
    history: mergeRecord(newer.history, older.history, (x, y) => (x.a >= y.a ? x : y)),
    unlocked: mergeRecord(newer.unlocked, older.unlocked, (x, y) => {
      const all = union(x, y)
      return [...TENSE_PATH.filter((t) => all.includes(t)), ...all.filter((t) => !TENSE_PATH.includes(t))]
    }),
    updatedAt: Math.max(a.updatedAt ?? 0, b.updatedAt ?? 0),
  }
}

/**
 * One full sync: push deletions, pull, merge every child present on either side, save locally, push the result.
 * Children only on this device are uploaded; children only in the cloud are downloaded.
 */
export async function syncOnce(remote: Remote): Promise<{ children: number }> {
  const deletes = pendingDeletes()
  if (deletes.length) { await remote.remove(deletes); clearDeletes(deletes) }

  const rows = (await remote.list()).filter((r) => !deletes.includes(r.id))
  // A new device starts with one empty child; when the family already has children in the cloud, drop it.
  const untouched = (c: ChildDoc) => !c.profile.name && !c.state.target && !c.state.xp && !Object.keys(c.state.verbs).length
  const local = allChildren().filter((c) => !(rows.length && untouched(c)))
  const byId = new Map(rows.map((r) => [r.id, r]))
  const merged: ChildDoc[] = local.map(({ profile, state }) => {
    const r = byId.get(profile.id)
    byId.delete(profile.id)
    if (!r) return { profile, state }
    const s = mergeStates(state, r.data)
    // Nickname/avatar follow the copy whose progress was changed most recently.
    const meta = s === r.data || (r.data.updatedAt ?? 0) > (state.updatedAt ?? 0) ? { ...profile, name: r.name, avatar: r.avatar } : profile
    return { profile: meta, state: s }
  })
  for (const r of byId.values()) merged.push({ profile: { id: r.id, name: r.name, avatar: r.avatar }, state: r.data })

  applySynced(merged)
  await remote.upsert(merged.map(({ profile, state }) => ({ id: profile.id, name: profile.name, avatar: profile.avatar, data: state })))
  return { children: merged.length }
}
