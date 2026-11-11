/**
 * Optional cloud accounts (Supabase). The account belongs to a parent; children never sign in.
 * Configured with VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (see docs/CLOUD.md). Without them the app is
 * fully local and the Supabase library is never even downloaded (dynamic import).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'
import { localVersion, subscribe } from './progress'
import { syncOnce, type Remote, type RemoteChild } from './sync'

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const cloudConfigured = !!(URL && KEY)

/** `recovery`: the parent opened a password-reset link and must choose a new password. */
export interface CloudStatus { ready: boolean; email: string | null; syncing: boolean; lastSync: number | null; error: string | null; notice: string | null; recovery: boolean }
let status: CloudStatus = { ready: !cloudConfigured, email: null, syncing: false, lastSync: null, error: null, notice: null, recovery: false }
const listeners = new Set<() => void>()
const setStatus = (s: Partial<CloudStatus>) => { status = { ...status, ...s }; listeners.forEach((l) => l()) }
export const useCloud = () => useSyncExternalStore((l) => (listeners.add(l), () => { listeners.delete(l) }), () => status)

let clientP: Promise<SupabaseClient> | null = null
// PKCE: email links come back as ?code=…, which doesn't collide with the app's #/ routes.
const client = () => (clientP ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(URL!, KEY!, { auth: { flowType: 'pkce' } })))

const TABLE = 'child_profile'
const remoteFor = (c: SupabaseClient): Remote => ({
  async list() {
    const { data, error } = await c.from(TABLE).select('id, name, avatar, data')
    if (error) throw error
    return data as RemoteChild[]
  },
  async upsert(rows) {
    if (!rows.length) return
    // `parent` defaults to auth.uid() on the server; row-level security rejects anything else.
    const { error } = await c.from(TABLE).upsert(rows.map((r) => ({ ...r, updated_at: new Date().toISOString() })), { onConflict: 'parent,id' })
    if (error) throw error
  },
  async remove(ids) {
    const { error } = await c.from(TABLE).delete().in('id', ids)
    if (error) throw error
  },
})

let syncedVersion = -1
let timer: ReturnType<typeof setTimeout> | undefined
/** Pull + merge + push. Safe to call any time; concurrent calls are skipped. */
export async function syncNow() {
  if (!cloudConfigured || !status.email || status.syncing) return
  if (!navigator.onLine) return setStatus({ error: 'offline' })
  const v = localVersion()
  setStatus({ syncing: true, error: null })
  try {
    await syncOnce(remoteFor(await client()))
    syncedVersion = v
    setStatus({ syncing: false, lastSync: Date.now() })
  } catch (e) {
    setStatus({ syncing: false, error: e instanceof Error ? e.message : String(e) })
  }
  if (localVersion() !== syncedVersion) schedule() // changes made while syncing
}
/** Debounced auto-sync after local changes (a burst of answers becomes one upload). */
const schedule = () => { clearTimeout(timer); timer = setTimeout(syncNow, 5000) }

let started = false
/** Called once at app start: restore the parent's session, sync, and keep syncing on changes / reconnect. */
export async function initCloud() {
  if (!cloudConfigured || started) return
  started = true
  try {
    const c = await client()
    const { data } = await c.auth.getSession()
    setStatus({ ready: true, email: data.session?.user.email ?? null })
    c.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setStatus({ recovery: true })
      const email = session?.user.email ?? null
      if (email !== status.email) { setStatus({ email }); if (email) void syncNow() }
    })
    subscribe(() => { if (status.email && !status.syncing && localVersion() !== syncedVersion) schedule() })
    addEventListener('online', () => void syncNow())
    if (data.session) void syncNow()
  } catch (e) {
    setStatus({ ready: true, error: e instanceof Error ? e.message : String(e) })
  }
}

const run = async (fn: (c: SupabaseClient) => PromiseLike<{ error: { message: string } | null }>, notice?: string) => {
  setStatus({ error: null, notice: null })
  const { error } = await fn(await client())
  setStatus(error ? { error: error.message } : { notice: notice ?? null })
  return !error
}
export const signUp = (email: string, password: string) =>
  run((c) => c.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } }), 'checkEmail')
export const signIn = (email: string, password: string) => run((c) => c.auth.signInWithPassword({ email, password }))
export const resetPassword = (email: string) =>
  run((c) => c.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }), 'resetSent')
export async function setNewPassword(password: string) {
  const ok = await run((c) => c.auth.updateUser({ password }), 'passwordChanged')
  if (ok) setStatus({ recovery: false })
  return ok
}
/** Sign out keeps everything on this device; it only stops syncing. */
export const signOut = () => run((c) => c.auth.signOut())
/** GDPR erasure: deletes the parent's account and every child row in the cloud. Local data stays on the device. */
export async function deleteAccount() {
  const ok = await run((c) => c.rpc('delete_my_account'))
  if (ok) await run((c) => c.auth.signOut(), 'accountDeleted')
  return ok
}
