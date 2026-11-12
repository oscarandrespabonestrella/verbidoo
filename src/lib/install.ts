import { useSyncExternalStore } from 'react'

// Gentle "install the app" invitation: never on a first visit, only after a few visits AND a finished
// session, never inside a game (the banner lives on Home only), with growing cooldowns after "Maybe later".

export interface InstallState { visits: number; achieved: boolean; dismissals: number; snoozeUntil: number; installed: boolean }
export const MIN_VISITS = 3
export const COOLDOWN_DAYS = [14, 30, 90] // after the 1st, 2nd, 3rd "Maybe later"; a 4th stops asking for good
const DAY = 86_400_000
const KEY = 'verbidoo-install'

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

const fresh: InstallState = { visits: 0, achieved: false, dismissals: 0, snoozeUntil: 0, installed: false }
const load = (): InstallState => { try { return { ...fresh, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return fresh } }
let state = load()
let deferred: PromptEvent | null = null
const listeners = new Set<() => void>()
let snap = { state, canPrompt: false }
const save = (next: Partial<InstallState>) => {
  state = { ...state, ...next }
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* private mode: memory only */ }
  emit()
}
const emit = () => { snap = { state, canPrompt: !!deferred }; listeners.forEach((l) => l()) }

/** Pure: should the banner show right now? */
export function shouldShow(s: InstallState, now: number, canPrompt: boolean, ios: boolean, standalone: boolean) {
  if (s.installed || standalone || !(canPrompt || ios)) return false
  return s.visits >= MIN_VISITS && s.achieved && s.dismissals <= COOLDOWN_DAYS.length && now >= s.snoozeUntil
}
/** Pure: state after a "Maybe later". */
export const snoozed = (s: InstallState, now: number): Partial<InstallState> => {
  const n = s.dismissals + 1
  return { dismissals: n, snoozeUntil: now + COOLDOWN_DAYS[Math.min(n, COOLDOWN_DAYS.length) - 1] * DAY } // past the list, shouldShow says no
}

const isStandalone = () => typeof window !== 'undefined' &&
  (matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true)
// iPadOS reports itself as a Mac; touch points tell them apart. Only Safari can add to the Home Screen.
export const isIOS = typeof navigator !== 'undefined' &&
  (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

if (typeof window !== 'undefined') {
  // One visit per browser tab session, so reloads don't count.
  try { if (!sessionStorage.getItem(KEY)) { sessionStorage.setItem(KEY, '1'); save({ visits: state.visits + 1 }) } } catch { /* storage blocked */ }
  if (isStandalone() && !state.installed) save({ installed: true })
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as PromptEvent; emit() }) // keep it for an explicit click
  addEventListener('appinstalled', () => { deferred = null; save({ installed: true }) })
}

export const markAchievement = () => { if (!state.achieved) save({ achieved: true }) }
export const dismissInstall = () => save(snoozed(state, Date.now()))
export async function installApp() {
  if (!deferred) return
  const e = deferred
  deferred = null // the event can only be used once
  await e.prompt()
  const { outcome } = await e.userChoice
  if (outcome === 'accepted') save({ installed: true })
  else dismissInstall() // a "no" in the browser's own dialog counts as "Maybe later"
}

export function useInstallBanner() {
  const { state: s, canPrompt } = useSyncExternalStore((l) => (listeners.add(l), () => { listeners.delete(l) }), () => snap)
  return { show: shouldShow(s, Date.now(), canPrompt, isIOS, isStandalone()), canPrompt }
}
