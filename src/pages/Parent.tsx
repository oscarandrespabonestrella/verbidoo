import { useState } from 'react'
import { go } from '../App'
import { BigButton, Card, ProgressBar } from '../components/ui'
import { CATEGORIES, type StringKey } from '../data/i18n'
import { VERBS } from '../data/verbs'
import { infinitive } from '../engine/conjugate'
import { accuracy, trickyVerbs } from '../lib/adaptive'
import { cloudConfigured, deleteAccount, resetPassword, setNewPassword, signIn, signOut, signUp, syncNow, useCloud } from '../lib/cloud'
import type { Kind } from '../lib/games'
import {
  addProfile, eraseProgress, exportAll, learnedCount, learner, liveStreak, openVerbs, profileState, removeProfile, setControls,
  t, useProfiles, useProgress, type Profile, type State,
} from '../lib/progress'
import { weekOf } from '../lib/rewards'

const KINDS: Kind[] = ['picture', 'listen', 'conjugate', 'complete', 'timetravel', 'translate', 'build', 'pronounce']
const AVATARS = ['🦊', '🐼', '🐸', '🐯', '🐙', '🦁', '🐨', '🐰']
const DAY = 86_400_000
export const nameOf = (p: Profile, i: number) => p.name || t('unnamed', { n: i + 1 })


/** Answers per day for 14 days: one series, one hue; right/total in the tooltip and the screen-reader text. */
function Activity({ s }: { s: State }) {
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() - (13 - i) * DAY).toISOString().slice(0, 10))
  const rows = days.map((d) => ({ d, ...(s.history[d] ?? { a: 0, r: 0, ms: 0 }) }))
  const max = Math.max(5, ...rows.map((r) => r.a))
  return (
    <figure>
      <figcaption className="mb-2 text-sm font-bold text-ink/60">{t('last14')} · {t('answersLbl')}</figcaption>
      <div className="flex h-28 items-end gap-0.5 border-b border-ink/20" aria-hidden>
        {rows.map((r) => (
          <div key={r.d} className="group relative flex h-full flex-1 items-end justify-center">
            <div className="w-full max-w-5 rounded-t bg-grape transition group-hover:bg-grape/70" style={{ height: `${(r.a / max) * 100}%` }} />
            <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs text-white group-hover:block">
              {r.d.slice(5)}: {r.a} {t('answersLbl')}{r.a ? ` · ${Math.round((r.r / r.a) * 100)}% ${t('accuracyLbl')}` : ''}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-ink/50" aria-hidden><span>{days[0].slice(5)}</span><span>{days[13].slice(5)}</span></div>
      <ul className="sr-only">
        {rows.map((r) => <li key={r.d}>{r.d}: {r.a} {t('answersLbl')}, {r.r} {t('accuracyLbl')}</li>)}
      </ul>
    </figure>
  )
}

function Report({ s }: { s: State }) {
  if (!s.target) return <p className="text-ink/60">{t('never')}</p>
  const L = learner(s)
  const week = weekOf()
  const minutes = (ms: number) => Math.round(ms / 60_000)
  const weekMs = Object.entries(s.history).filter(([d]) => d >= week).reduce((n, [, h]) => n + h.ms, 0)
  const all = Object.values(s.history).reduce((n, h) => ({ a: n.a + h.a, r: n.r + h.r }), { a: 0, r: 0 })
  const tiles = [
    { v: s.xp, l: 'XP' }, { v: liveStreak(s), l: t('streak') },
    { v: `${learnedCount(s)}/${VERBS.length}`, l: t('learned') }, { v: Object.keys(L.verbs).length, l: t('verbsSeen') },
    { v: L.unlocked.length, l: t('tensesOpen') }, { v: all.a ? `${Math.round((all.r / all.a) * 100)}%` : '–', l: t('accuracyLbl') },
    { v: minutes(s.history[new Date().toISOString().slice(0, 10)]?.ms ?? 0), l: t('minutesToday') }, { v: minutes(weekMs), l: t('minutesWeek') },
  ]
  const tricky = trickyVerbs(L, openVerbs(s, CATEGORIES))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tiles.map((x) => (
          <div key={x.l} className="rounded-2xl bg-ink/5 p-3 text-center">
            <div className="font-display text-2xl font-extrabold">{x.v}</div><div className="text-xs font-bold text-ink/60">{x.l}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-ink/60">{t('lastActive')}: {s.lastDay || t('never')}</p>
      <Activity s={s} />
      <div>
        <h3 className="mb-2 font-bold">{t('perGame')}</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {KINDS.map((k) => {
            const o = L.stats[`kind:${k}`], a = accuracy(o)
            return (
              <li key={k} className="text-sm">
                <div className="flex justify-between font-bold"><span>{t(`game_${k}`)}</span><span className="text-ink/60">{a === null ? '–' : `${Math.round(a * 100)}% (${o!.length})`}</span></div>
                <ProgressBar value={a ?? 0} max={1} color="bg-grape" />
              </li>
            )
          })}
        </ul>
      </div>
      {tricky.length > 0 && (
        <p className="text-sm"><b>{t('trickyVerbs')}:</b> {tricky.map(({ verb, wrongPct }) => `${verb.emoji} ${infinitive(verb, s.target!)} (${100 - wrongPct}%)`).join(' · ')}</p>
      )}
    </div>
  )
}

function Rules({ id, s }: { id: string; s: State }) {
  const c = s.controls
  const Toggle = ({ k, label, desc }: { k: 'voiceCheck' | 'recording'; label: string; desc: string }) => (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-ink/5 p-3">
      <input type="checkbox" checked={c[k]} onChange={(e) => setControls(id, { [k]: e.target.checked })} className="mt-1 h-5 w-5 accent-grape" />
      <span><b>{label}</b><span className="block text-sm text-ink/60">{desc}</span></span>
    </label>
  )
  const select = 'rounded-xl border-2 border-ink/10 bg-white px-3 py-2 font-bold'
  return (
    <div className="space-y-3">
      <Toggle k="voiceCheck" label={t('ctlVoiceCheck')} desc={t('ctlVoiceCheckDesc')} />
      <Toggle k="recording" label={t('ctlRecording')} desc={t('ctlRecordingDesc')} />
      <label className="flex items-center justify-between gap-3 font-bold">{t('ctlNewPerDay')}
        <select className={select} value={c.newPerDay} onChange={(e) => setControls(id, { newPerDay: Number(e.target.value) })}>
          {[3, 5, 8].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <label className="flex items-center justify-between gap-3 font-bold">{t('ctlMinutes')}
        <select className={select} value={c.dailyMinutes} onChange={(e) => setControls(id, { dailyMinutes: Number(e.target.value) })}>
          {[0, 15, 30, 45, 60].map((n) => <option key={n} value={n}>{n ? t('minutesN', { n }) : t('noLimit')}</option>)}
        </select>
      </label>
    </div>
  )
}

/** Notices and errors from the cloud layer, in the parent's language (Supabase's own error text is shown as is). */
const cloudMessage = (key: string | null, kind: 'n' | 'e') =>
  !key ? null : kind === 'n' ? t(`n_${key}` as StringKey) : key === 'offline' ? t('e_offline') : key

export function CloudCard() {
  const c = useCloud()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const act = async (fn: () => Promise<unknown>) => { setBusy(true); try { await fn() } finally { setBusy(false) } }
  const input = 'w-full rounded-xl border-2 border-ink/10 px-3 py-2'

  let body
  if (!cloudConfigured) body = <p className="text-ink/70">{t('cloudOff')}</p>
  else if (!c.ready) body = <p className="text-ink/60">{t('loadingCloud')}</p>
  else if (c.recovery) body = (
    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); void act(() => setNewPassword(password)) }}>
      <label className="block font-bold" htmlFor="newpw">{t('newPassword')}</label>
      <input id="newpw" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
      <BigButton className="w-full" disabled={busy}>{t('save')}</BigButton>
    </form>
  )
  else if (c.email) body = (
    <div className="space-y-3">
      <p className="font-bold">✅ {t('signedInAs', { email: c.email })}</p>
      <p className="text-sm text-ink/60">
        {c.syncing ? t('syncing') : c.lastSync ? t('lastSynced', { time: new Date(c.lastSync).toLocaleTimeString() }) : ''}
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={c.syncing} onClick={() => void syncNow()} className="rounded-2xl bg-sky px-4 py-3 font-bold text-white disabled:opacity-50">🔄 {t('syncNowBtn')}</button>
        <button type="button" disabled={busy} onClick={() => void act(signOut)} className="rounded-2xl bg-ink/10 px-4 py-3 font-bold">{t('signOutBtn')}</button>
        <button type="button" disabled={busy} onClick={() => confirm(t('confirmDeleteAccount')) && void act(deleteAccount)}
          className="rounded-2xl bg-coral px-4 py-3 font-bold text-white">🗑️ {t('deleteAccountBtn')}</button>
      </div>
      <p className="text-xs text-ink/50">{t('signOutNote')}</p>
    </div>
  )
  else body = (
    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); void act(() => (mode === 'up' ? signUp(email, password) : signIn(email, password))) }}>
      <p className="text-ink/70">{t('cloudWhy')}</p>
      <input type="email" required autoComplete="email" placeholder={t('email')} aria-label={t('email')} value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
      <input type="password" required minLength={8} autoComplete={mode === 'up' ? 'new-password' : 'current-password'} placeholder={t('password')} aria-label={t('password')}
        value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
      {mode === 'up' && (
        <label className="flex items-start gap-2 rounded-xl bg-sun/15 p-3 text-sm">
          <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 accent-grape" />
          {t('consent')}
        </label>
      )}
      <BigButton className="w-full" disabled={busy || (mode === 'up' && !consent)}>{mode === 'up' ? t('signUpBtn') : t('signInBtn')}</BigButton>
      <div className="flex flex-wrap justify-between gap-2 text-sm font-bold text-grape">
        <button type="button" onClick={() => setMode(mode === 'up' ? 'in' : 'up')}>{mode === 'up' ? t('haveAccount') : t('needAccount')}</button>
        {mode === 'in' && <button type="button" disabled={!email} onClick={() => void act(() => resetPassword(email))} className="disabled:opacity-40">{t('forgot')}</button>}
      </div>
    </form>
  )

  return (
    <Card>
      <h2 className="mb-3 font-display text-2xl font-bold">☁️ {t('cloudTitle')}</h2>
      {body}
      {c.notice && <p role="status" className="mt-3 rounded-xl bg-mint/15 p-3 font-bold">{cloudMessage(c.notice, 'n')}</p>}
      {c.error && <p role="alert" className="mt-3 rounded-xl bg-coral/15 p-3 font-bold text-coral">{cloudMessage(c.error, 'e')}</p>}
    </Card>
  )
}

function ParentArea() {
  const idx = useProfiles()
  const cloud = useCloud()
  useProgress() // re-render when the active profile's data changes
  const [sel, setSel] = useState(idx.active)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[1])
  const current = idx.list.find((p) => p.id === sel) ?? idx.list[0]
  const i = idx.list.indexOf(current)
  const s = profileState(current.id)

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportAll()], { type: 'application/json' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'verb-adventure-data.json' })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold">⚙️ {t('parentTitle')}</h1>
        <button type="button" onClick={() => go('')} className="rounded-full bg-white px-4 py-2 font-bold shadow-sm">← {t('home')}</button>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist">
        {idx.list.map((p, n) => (
          <button key={p.id} role="tab" type="button" aria-selected={p.id === current.id} onClick={() => setSel(p.id)}
            className={`rounded-full px-4 py-2 font-bold ${p.id === current.id ? 'bg-grape text-white' : 'bg-white'}`}>
            {p.avatar} {nameOf(p, n)}
          </button>
        ))}
      </div>

      {/* The account first: it is the main reason someone opens settings. */}
      <CloudCard />
      <Card><h2 className="mb-3 font-display text-2xl font-bold">📊 {t('report')} · {nameOf(current, i)}</h2><Report s={s} /></Card>
      <Card><h2 className="mb-3 font-display text-2xl font-bold">🎛️ {t('rules')}</h2><Rules id={current.id} s={s} /></Card>

      <Card>
        <h2 className="mb-3 font-display text-2xl font-bold">👤 {t('children')}</h2>
        <ul className="mb-4 space-y-2">
          {idx.list.map((p, n) => (
            <li key={p.id} className="flex items-center justify-between rounded-2xl bg-ink/5 px-3 py-2 font-bold">
              <span>{p.avatar} {nameOf(p, n)}</span>
              {idx.list.length > 1 && (
                <button type="button" className="text-sm text-coral"
                  onClick={() => confirm(t('confirmRemove', { name: nameOf(p, n) })) && (removeProfile(p.id), setSel(idx.list.find((x) => x.id !== p.id)!.id))}>
                  {t('remove')}
                </button>
              )}
            </li>
          ))}
        </ul>
        <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); setSel(addProfile(name, avatar)); setName('') }}>
          <h3 className="font-bold">{t('addChild')}</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder={t('nickname')} aria-label={t('nickname')}
            className="w-full rounded-xl border-2 border-ink/10 px-3 py-2" />
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button key={a} type="button" aria-pressed={a === avatar} onClick={() => setAvatar(a)}
                className={`rounded-xl p-2 text-3xl ${a === avatar ? 'bg-grape/20 ring-2 ring-grape' : 'bg-ink/5'}`}>{a}</button>
            ))}
          </div>
          <BigButton className="w-full">{t('add')}</BigButton>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-2xl font-bold">🔒 {t('dataPrivacy')}</h2>
        <p className="mb-3 text-ink/70">{cloud.email ? t('privacyCloud') : t('privacySummary')}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={download} className="rounded-2xl bg-sky px-4 py-3 font-bold text-white">⬇️ {t('exportData')}</button>
          <button type="button" onClick={() => confirm(t('confirmErase', { name: nameOf(current, i) })) && eraseProgress(current.id)}
            className="rounded-2xl bg-coral px-4 py-3 font-bold text-white">🗑️ {t('eraseProgress')}</button>
        </div>
        <p className="mt-4 text-xs text-ink/50">
          🎙️ {t('creditsVoice')}{' '}
          <a className="underline" href="https://datashare.is.ed.ac.uk/handle/10283/2353" target="_blank" rel="noreferrer">SIWIS</a> ·{' '}
          <a className="underline" href="https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR/siwis" target="_blank" rel="noreferrer">Piper</a> ·{' '}
          <a className="underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>
        </p>
      </Card>
    </div>
  )
}

export const Parent = ParentArea
