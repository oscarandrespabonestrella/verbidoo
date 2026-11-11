import { useState, type ReactNode } from 'react'
import { go } from '../App'
import { Icon, type IconName } from '../components/icons'
import { Avatar, Card, ProgressBar } from '../components/ui'
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

const H2 = ({ icon, children, extra }: { icon?: IconName; children: ReactNode; extra?: ReactNode }) => (
  <div className="flex min-w-0 flex-wrap items-center gap-2.5">
    {icon && <Icon name={icon} className="text-grape" />}
    <h2 className="h2 min-w-0">{children}</h2>
    {extra && <span className="ml-auto">{extra}</span>}
  </div>
)
const inputCls = 'h-[52px] w-full min-w-0 rounded-[14px] border-[1.5px] border-line-strong bg-white px-4 text-base font-semibold text-ink'
const btnDanger = 'btn w-full !bg-white !text-[#A12424] border-[1.5px] !border-[#F2C4C4] !shadow-none'

/** Answers per day for 14 days: one series, one hue; right/total in the tooltip and the screen-reader text. */
function Activity({ s }: { s: State }) {
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() - (13 - i) * DAY).toISOString().slice(0, 10))
  const rows = days.map((d) => ({ d, ...(s.history[d] ?? { a: 0, r: 0, ms: 0 }) }))
  const max = Math.max(5, ...rows.map((r) => r.a))
  return (
    <figure className="m-0 flex flex-col gap-3">
      <div><h2 className="h2">{t('answersLbl')}</h2><span className="mut text-[13px] font-bold">{t('last14')}</span></div>
      <div className="flex h-32 items-end gap-1 border-b border-line-strong" aria-hidden>
        {rows.map((r) => (
          <div key={r.d} className="group relative flex h-full min-w-0 flex-1 items-end justify-center">
            <div className={`w-full rounded-t-md transition ${r.a ? 'bg-grape group-hover:bg-grape-dark' : 'bg-[#D3D7E6]'}`}
              style={{ height: r.a ? `${(r.a / max) * 100}%` : '2px' }} />
            <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs text-white group-hover:block">
              {r.d.slice(5)}: {r.a} {t('answersLbl')}{r.a ? ` · ${Math.round((r.r / r.a) * 100)}% ${t('accuracyLbl')}` : ''}
            </div>
          </div>
        ))}
      </div>
      <div className="mut flex justify-between text-xs font-bold" aria-hidden><span>{days[0].slice(5)}</span><span>{t('pa_today')}</span></div>
      <ul className="sr-only">
        {rows.map((r) => <li key={r.d}>{r.d}: {r.a} {t('answersLbl')}, {r.r} {t('accuracyLbl')}</li>)}
      </ul>
    </figure>
  )
}

function Report({ s }: { s: State }) {
  if (!s.target) return <Card><p className="mut m-0">{t('never')}</p></Card>
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
    <div className="flex flex-col gap-3.5">
      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h2 className="h2">{t('pa_summary')}</h2>
          <span className="mut text-[13px] font-bold">{t('lastActive')}: {s.lastDay || t('never')}</span>
        </div>
        <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2 sm:grid-cols-[repeat(4,minmax(0,1fr))]">
          {tiles.map((x) => (
            <div key={x.l} className="flex min-w-0 flex-col gap-0.5 rounded-[14px] bg-soft p-3">
              <b className="font-display text-[22px] font-bold leading-tight">{x.v}</b>
              <span className="mut text-[13px] font-semibold leading-snug">{x.l}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card><Activity s={s} /></Card>
      <Card className="flex flex-col gap-3">
        <h2 className="h2">{t('perGame')}</h2>
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-[repeat(2,minmax(0,1fr))] sm:gap-x-6">
          {KINDS.map((k) => {
            const o = L.stats[`kind:${k}`], a = accuracy(o)
            const low = a !== null && a < 0.6
            return (
              <li key={k} className="flex min-w-0 flex-col gap-1.5">
                <div className="flex justify-between gap-2 text-[15px] font-bold">
                  <span className="min-w-0">{t(`game_${k}`)}</span>
                  <span className={`shrink-0 ${low ? 'text-[#A12424]' : ''}`}>
                    {a === null ? '–' : `${Math.round(a * 100)}%`}{a !== null && <span className="mut"> ({o!.length})</span>}
                  </span>
                </div>
                <ProgressBar value={a ?? 0} max={1} color={low ? 'bg-[#D93A3A]' : 'bg-grape'} />
              </li>
            )
          })}
        </ul>
        <p className="mut m-0 text-[13px]">{t('pa_lowNote')}</p>
      </Card>
      {tricky.length > 0 && (
        <Card className="flex flex-col gap-2.5">
          <h2 className="h2">{t('trickyVerbs')}</h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[15px] font-bold" lang={s.target}>
            {tricky.map(({ verb, wrongPct }) => {
              const pct = 100 - wrongPct
              return (
                <li key={verb.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0"><span className="emoji mr-1.5">{verb.emoji}</span>{infinitive(verb, s.target!)}</span>
                  <span className={pct < 60 ? 'text-[#A12424]' : 'text-[#C2410C]'}>{pct}%</span>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}

function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors ${on ? 'bg-mint' : 'bg-[#CDD1E2]'}`}>
      <span className={`absolute top-[3px] size-[26px] rounded-full bg-white shadow transition-all ${on ? 'left-[23px]' : 'left-[3px]'}`} />
    </button>
  )
}

function Rules({ id, s }: { id: string; s: State }) {
  const c = s.controls
  const Toggle = ({ k, label, desc }: { k: 'voiceCheck' | 'recording'; label: string; desc: string }) => (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1"><b className="text-[15px]">{label}</b><p className="mut m-0 mt-1 text-sm leading-relaxed">{desc}</p></div>
      <Switch on={c[k]} label={label} onChange={(v) => setControls(id, { [k]: v })} />
    </div>
  )
  const steps = [3, 5, 8]
  const at = Math.max(0, steps.indexOf(c.newPerDay))
  const mins = [0, 15, 30, 45, 60]
  return (
    <Card className="flex flex-col gap-4">
      <H2>{t('rules')}</H2>
      <div className="flex flex-col gap-2">
        <span className="text-[15px] font-extrabold">{t('ctlMinutes')}</span>
        <div role="radiogroup" aria-label={t('ctlMinutes')} className="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-1 rounded-[14px] bg-[#E9EBF4] p-1">
          {mins.map((n) => (
            <button key={n} type="button" role="radio" aria-checked={c.dailyMinutes === n} onClick={() => setControls(id, { dailyMinutes: n })}
              className={`min-h-11 min-w-0 rounded-[10px] px-1 text-[13px] font-extrabold leading-tight ${c.dailyMinutes === n ? 'bg-white text-ink shadow-[0_1px_3px_rgba(36,48,94,.12)]' : 'text-muted'}`}>
              {n ? t('minutesN', { n }) : t('noLimit')}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="min-w-0 text-[15px] font-extrabold">{t('ctlNewPerDay')}</span>
        <div className="flex items-center gap-1 rounded-[14px] bg-soft p-1">
          <button type="button" aria-label={t('pa_less')} disabled={at === 0} onClick={() => setControls(id, { newPerDay: steps[at - 1] })}
            className="size-11 rounded-[10px] bg-white text-xl font-extrabold disabled:opacity-40">−</button>
          <b className="w-9 text-center text-lg" aria-live="polite">{c.newPerDay}</b>
          <button type="button" aria-label={t('pa_more')} disabled={at === steps.length - 1} onClick={() => setControls(id, { newPerDay: steps[at + 1] })}
            className="size-11 rounded-[10px] bg-white text-xl font-extrabold disabled:opacity-40">+</button>
        </div>
      </div>
      <div className="h-px bg-line" />
      <Toggle k="recording" label={t('ctlRecording')} desc={t('ctlRecordingDesc')} />
      <Toggle k="voiceCheck" label={t('ctlVoiceCheck')} desc={t('ctlVoiceCheckDesc')} />
    </Card>
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
  const label = 'flex flex-col gap-1.5 text-sm font-extrabold'

  let body
  if (!cloudConfigured) body = <p className="mut m-0 text-sm leading-relaxed">{t('cloudOff')}</p>
  else if (!c.ready) body = <p className="mut m-0">{t('loadingCloud')}</p>
  else if (c.recovery) body = (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); void act(() => setNewPassword(password)) }}>
      <label className={label}>{t('newPassword')}
        <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
      </label>
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>{t('save')}</button>
    </form>
  )
  else if (c.email) body = (
    <div className="flex flex-col gap-3">
      <p className="m-0 flex min-w-0 items-center gap-2 font-bold"><Icon name="check" className="text-mint" strokeWidth={3} /><span className="min-w-0">{t('signedInAs', { email: c.email })}</span></p>
      <p className="mut m-0 text-sm">
        {c.syncing ? t('syncing') : c.lastSync ? t('lastSynced', { time: new Date(c.lastSync).toLocaleTimeString() }) : ''}
      </p>
      <button type="button" disabled={c.syncing} onClick={() => void syncNow()} className="btn btn-primary w-full"><Icon name="repeat" />{t('syncNowBtn')}</button>
      <button type="button" disabled={busy} onClick={() => void act(signOut)} className="btn btn-ghost w-full"><Icon name="logout" />{t('signOutBtn')}</button>
      <button type="button" disabled={busy} onClick={() => confirm(t('confirmDeleteAccount')) && void act(deleteAccount)} className={btnDanger}>
        <Icon name="trash" />{t('deleteAccountBtn')}</button>
      <p className="mut m-0 text-xs">{t('signOutNote')}</p>
    </div>
  )
  else body = (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); void act(() => (mode === 'up' ? signUp(email, password) : signIn(email, password))) }}>
      <p className="mut m-0 text-sm leading-relaxed">{t('cloudWhy')}</p>
      <label className={label}>{t('email')}
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
      </label>
      <label className={label}>{t('password')}
        <input type="password" required minLength={8} autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
          value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
      </label>
      {mode === 'up' && (
        <label className="flex items-start gap-2 rounded-[14px] bg-[#FFF4D6] p-3 text-sm">
          <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-grape" />
          <span className="min-w-0">{t('consent')}</span>
        </label>
      )}
      <button type="submit" className="btn btn-primary w-full" disabled={busy || (mode === 'up' && !consent)}>{mode === 'up' ? t('signUpBtn') : t('signInBtn')}</button>
      <div className="flex flex-wrap justify-between gap-x-3 text-sm font-extrabold text-grape">
        <button type="button" className="min-h-11" onClick={() => setMode(mode === 'up' ? 'in' : 'up')}>{mode === 'up' ? t('haveAccount') : t('needAccount')}</button>
        {mode === 'in' && <button type="button" disabled={!email} onClick={() => void act(() => resetPassword(email))} className="min-h-11 disabled:opacity-40">{t('forgot')}</button>}
      </div>
    </form>
  )

  return (
    <Card className="flex flex-col gap-3">
      <H2 icon="cloud" extra={<span className="rounded-full bg-soft px-2 py-1 text-xs font-extrabold text-muted">{t('pa_optional')}</span>}>{t('cloudTitle')}</H2>
      {body}
      {c.notice && <p role="status" className="m-0 rounded-[14px] bg-mint-soft p-3 font-bold text-mint-dark">{cloudMessage(c.notice, 'n')}</p>}
      {c.error && <p role="alert" className="m-0 rounded-[14px] bg-coral/15 p-3 font-bold text-coral">{cloudMessage(c.error, 'e')}</p>}
    </Card>
  )
}

type Section = 'report' | 'settings' | 'account'

function ParentArea() {
  const idx = useProfiles()
  const cloud = useCloud()
  useProgress() // re-render when the active profile's data changes
  const [sel, setSel] = useState(idx.active)
  // A password-recovery link lands here: open the account section so the new-password form is visible.
  const [tab, setTab] = useState<Section>(cloud.recovery ? 'account' : 'report')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[1])
  const current = idx.list.find((p) => p.id === sel) ?? idx.list[0]
  const i = idx.list.indexOf(current)
  const s = profileState(current.id)
  const section = cloud.recovery ? 'account' : tab

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportAll()], { type: 'application/json' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'verb-adventure-data.json' })
    a.click()
    URL.revokeObjectURL(url)
  }
  const sections: { id: Section; label: string }[] = [
    { id: 'report', label: t('report') }, { id: 'settings', label: t('pa_settings') }, { id: 'account', label: t('pa_account') },
  ]

  return (
    <div className="flex flex-col gap-3.5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="page-title min-w-0 !text-[26px]">{t('pa_title')}</h1>
        <button type="button" onClick={() => go('')}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-extrabold text-ink">
          {t('pa_exit')}<Icon name="logout" size={18} />
        </button>
      </header>

      {/* Which child: segmented control (design P02). */}
      {idx.list.length > 1 && (
        <div role="tablist" aria-label={t('children')} className="flex gap-1 overflow-x-auto rounded-2xl bg-[#E9EBF4] p-1">
          {idx.list.map((p, n) => (
            <button key={p.id} role="tab" type="button" aria-selected={p.id === current.id} onClick={() => setSel(p.id)}
              className={`flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-[15px] font-extrabold ${p.id === current.id ? 'bg-white text-ink shadow-[0_1px_3px_rgba(36,48,94,.12)]' : 'text-muted'}`}>
              <Avatar emoji={p.avatar} size={26} /><span className="truncate">{nameOf(p, n)}</span>
            </button>
          ))}
        </div>
      )}

      <nav aria-label={t('pa_title')} className="flex gap-5 overflow-x-auto border-b border-line-strong">
        {sections.map((x) => (
          <button key={x.id} type="button" aria-current={section === x.id ? 'page' : undefined} onClick={() => setTab(x.id)}
            className={`-mb-px flex min-h-11 shrink-0 items-center border-b-[3px] text-[15px] font-extrabold ${section === x.id ? 'border-grape text-ink' : 'border-transparent text-subtle'}`}>
            {x.label}
          </button>
        ))}
      </nav>

      {section === 'report' && <Report s={s} />}

      {section === 'settings' && <>
        <Rules id={current.id} s={s} />
        <Card className="flex flex-col gap-3">
          <H2>{t('children')}</H2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {idx.list.map((p, n) => (
              <li key={p.id} className="flex min-h-14 items-center gap-3 rounded-[14px] bg-soft py-1.5 pl-3 pr-1.5">
                <Avatar emoji={p.avatar} size={36} />
                <b className="min-w-0 flex-1 truncate text-base">{nameOf(p, n)}</b>
                {idx.list.length > 1 && (
                  <button type="button" aria-label={`${t('remove')} · ${nameOf(p, n)}`} title={t('remove')}
                    className="flex size-11 items-center justify-center rounded-[10px] text-[#A12424] hover:bg-white"
                    onClick={() => confirm(t('confirmRemove', { name: nameOf(p, n) })) && (removeProfile(p.id), setSel(idx.list.find((x) => x.id !== p.id)!.id))}>
                    <Icon name="trash" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <form className="flex flex-col gap-2.5 border-t border-dashed border-line-strong pt-3.5"
            onSubmit={(e) => { e.preventDefault(); setSel(addProfile(name, avatar)); setName('') }}>
            <label className="flex flex-col gap-1.5 text-[15px] font-extrabold">{t('addChild')}
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder={t('nickname')} className={inputCls} />
            </label>
            <div role="radiogroup" aria-label={t('characters')} className="grid grid-cols-[repeat(4,minmax(0,1fr))] gap-2">
              {AVATARS.map((a) => (
                <button key={a} type="button" role="radio" aria-checked={a === avatar} onClick={() => setAvatar(a)}
                  className={`emoji flex h-14 items-center justify-center rounded-[14px] border-2 text-3xl ${a === avatar ? 'border-grape bg-grape-soft' : 'border-transparent bg-soft'}`}>{a}</button>
              ))}
            </div>
            <button type="submit" className="btn btn-primary w-full"><Icon name="plus" />{t('add')}</button>
          </form>
        </Card>
      </>}

      {section === 'account' && <>
        <CloudCard />
        <Card className="flex flex-col gap-3">
          <H2 icon="shield">{t('dataPrivacy')}</H2>
          <p className="m-0 text-sm leading-relaxed">{cloud.email ? t('privacyCloud') : t('privacySummary')}</p>
          <button type="button" onClick={download} className="btn btn-ghost w-full"><Icon name="download" />{t('exportData')}</button>
          <button type="button" onClick={() => confirm(t('confirmErase', { name: nameOf(current, i) })) && eraseProgress(current.id)} className={btnDanger}>
            <Icon name="trash" />{t('eraseProgress')}</button>
          <p className="mut m-0 text-xs leading-relaxed">
            {t('creditsVoice')}{' '}
            <a className="underline" href="https://datashare.is.ed.ac.uk/handle/10283/2353" target="_blank" rel="noreferrer">SIWIS</a> ·{' '}
            <a className="underline" href="https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR/siwis" target="_blank" rel="noreferrer">Piper</a> ·{' '}
            <a className="underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>
          </p>
        </Card>
      </>}
    </div>
  )
}

export const Parent = ParentArea
