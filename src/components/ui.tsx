import { useState, type ReactNode } from 'react'
import { VARIANTS, type Variant } from '../data/i18n'
import type { Form } from '../engine/conjugate'
import type { StemFamily } from '../engine/french'
import { cloudConfigured, syncNow, useCloud } from '../lib/cloud'
import { dismissInstall, installApp, useInstallBanner } from '../lib/install'
import { t } from '../lib/progress'
import { SLOW, canSpeak, hasRecordings, speak, speechSupported, useVoices, voiceFor } from '../lib/speech'
import { Flame, Icon, Star } from './icons'

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`card min-w-0 p-[18px] sm:p-5 ${className}`}>{children}</section>
)

/** Sky-blue round "listen" button (turtle icon for the slow version). */
export function SpeakButton({ text, variant, slow, label, className = '', big }: {
  text: string | string[]; variant: Variant; slow?: boolean; label?: string; className?: string; big?: boolean
}) {
  const [on, setOn] = useState(false)
  const play = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOn(true)
    speak(text, variant, { rate: slow ? SLOW : undefined, onEnd: () => setOn(false) })
  }
  const name = label ?? (slow ? t('slow') : t('normal'))
  return (
    <button
      type="button" onClick={play} disabled={!canSpeak(variant)} aria-label={name} title={name}
      className={`ib transition active:translate-y-0.5 ${slow ? 'ib-soft' : ''} ${big ? '!h-16 !w-16' : ''} ${on ? 'animate-pulse' : ''} ${className}`}
    >
      <Icon name={slow ? 'turtle' : big ? 'speakerLoud' : 'speaker'} size={big ? 30 : 22} />
    </button>
  )
}

/** Pill button. `color` is a class: btn-primary (default), btn-mint, btn-coral, btn-ghost. */
export function BigButton({ children, onClick, color = 'btn-primary', className = '', disabled }: {
  children: ReactNode; onClick?: () => void; color?: string; className?: string; disabled?: boolean
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`btn ${color} ${className}`}>
      {children}
    </button>
  )
}

/** Emoji avatar inside a tinted circle. */
export const Avatar = ({ emoji, size = 44, bg = '#FFF1E3' }: { emoji?: string; size?: number; bg?: string }) => (
  <span aria-hidden className="emoji inline-flex shrink-0 items-center justify-center rounded-full leading-none"
    style={{ width: size, height: size, background: bg, fontSize: size * 0.58 }}>{emoji}</span>
)

export const StreakPill = ({ n, label }: { n: number | string; label?: string }) => (
  <span className="pill" aria-label={label} title={label}><Flame />{n}</span>
)
export const XpPill = ({ n, label }: { n: number | string; label?: string }) => (
  <span className="pill" aria-label={label} title={label}><Star />{n}</span>
)

const KIND_COLOR = { regular: 'text-grape', spelling: 'text-sky', irregular: 'text-rouge-dark' }
/** Conjugated form with the ending / irregular part colored. */
/** One colour per spoken stem (French), AA contrast on white and on the highlighted row. Same index = same stem in every tense. */
export const STEM_COLORS = ['#1E46C4', '#B3245C', '#0E7A4E', '#A84B00', '#7B2BA8', '#0A6A8A', '#5C6B00', '#8A3B12']
export const stemColor = (i: number) => STEM_COLORS[i % STEM_COLORS.length]
export const familyLabel = (f: StemFamily) => (f === 'special' ? t('stemSpecial') : f === 1 ? t('stemOne') : t('stemMany', { n: f }))

export function FormView({ form }: { form: Form }) {
  const w = form.word
  const end = w.length - (form.silent ?? 0)
  return (
    <span>
      {form.aux && <span className="text-ink/60">{form.aux.endsWith("'") ? form.aux : `${form.aux} `}</span>}
      {form.silent === undefined ? (
        <>
          <span>{w.slice(0, form.split)}</span>
          <span className={`font-extrabold ${KIND_COLOR[form.kind]}`}>{w.slice(form.split)}</span>
        </>
      ) : (
        // French: spoken stem in its colour, audible ending plain, silent letters faded.
        <>
          {form.stem !== undefined && <span className="font-extrabold" style={{ color: stemColor(form.stem) }}>{w.slice(0, form.stemLen)}</span>}
          <span>{w.slice(form.stemLen ?? 0, end)}</span>
          <span className="text-ink/45">{w.slice(end)}</span>
        </>
      )}
      {form.after && <span className="text-ink/60">{form.after.startsWith('-') ? form.after : ` ${form.after}`}</span>}
    </span>
  )
}
export function Legend({ stems }: { stems?: boolean }) {
  if (stems) {
    return (
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex gap-0.5">{STEM_COLORS.slice(0, 3).map((c) => <i key={c} className="size-2.5 rounded-full" style={{ background: c }} />)}</span>
          {t('legendStem')}
        </span>
        <span className="inline-flex items-center gap-1.5 text-ink/45"><i className="size-2.5 rounded-full bg-ink/25" />{t('silentLetters')}</span>
      </p>
    )
  }
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
      <span className="inline-flex items-center gap-1.5 text-grape"><i className="size-2.5 rounded-full bg-grape" />{t('legendEnding')}</span>
      <span className="inline-flex items-center gap-1.5 text-sky"><i className="size-2.5 rounded-full bg-sky" />{t('legendSpelling')}</span>
      <span className="inline-flex items-center gap-1.5 text-rouge-dark"><i className="size-2.5 rounded-full bg-rouge-dark" />{t('legendIrregular')}</span>
    </p>
  )
}

export function VoiceWarning({ variant }: { variant: Variant }) {
  const voices = useVoices()
  if (hasRecordings(variant)) return null // French plays from recordings on every device
  if (!speechSupported) return <p role="alert" className="rounded-2xl bg-coral/15 p-3 font-bold text-coral">{t('noSpeech')}</p>
  const { voice, exact } = voiceFor(variant)
  if (exact) return null
  // No voice in this language at all: audio is off for it (see speech.ts), so say why and how to fix it.
  if (!voice || !voices.length) return <p role="alert" className="rounded-2xl bg-coral/15 p-3 text-sm font-bold text-coral">{t('noVoiceLang', { v: VARIANTS[variant].name })}</p>
  return <p className="rounded-2xl bg-sun/25 p-3 text-sm font-bold">{t('noVoice', { v: VARIANTS[variant].name })}</p>
}

export function Confetti() {
  const colors = ['#2B5CE6', '#FFFFFF', '#EF3340', '#FDBE3C', '#6B8FF5'] // tricolore + or
  return <>{Array.from({ length: 22 }, (_, i) => (
    <span key={i} aria-hidden className="confetti" style={{
      left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.08}s`,
      width: 10, height: 14, borderRadius: 3, background: colors[i % colors.length],
    }} />
  ))}</>
}

/** Quiet, dismissible "install the app" card for Home (see lib/install.ts for when it may appear). */
export function InstallBanner() {
  const { show, canPrompt } = useInstallBanner()
  const [howTo, setHowTo] = useState(false)
  if (!show) return null
  const small = 'inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-extrabold'
  return (
    // Home only (Dashboard), so it never interrupts a lesson or game.
    <aside aria-labelledby="install-title" className="card flex animate-pop flex-wrap items-center gap-x-3 gap-y-2 !p-3.5 sm:flex-nowrap">
      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-grape-soft text-grape"><Icon name="download" size={18} /></span>
      <div className="min-w-0 flex-1 basis-[calc(100%-48px)] sm:basis-auto">
        <p id="install-title" className="m-0 text-sm font-bold leading-snug">{t('in_title')}</p>
        {howTo && <p role="status" className="mut m-0 mt-1 text-sm font-bold">{t('in_ios')}</p>}
      </div>
      <div className="ml-auto flex shrink-0 gap-1">
        {!howTo && (
          <button type="button" className={`${small} bg-grape text-white`} onClick={() => (canPrompt ? void installApp() : setHowTo(true))}>
            {t('in_install')}
          </button>
        )}
        <button type="button" className={`${small} text-muted hover:bg-white`} onClick={dismissInstall}>{t('in_later')}</button>
      </div>
    </aside>
  )
}

/** "Sync now" with the last-sync status. Renders nothing unless a parent is signed in to the cloud.
 *  `compact`: a small inline button with the status beside it (profile picker); otherwise a full-width primary button (settings). */
export function SyncButton({ compact }: { compact?: boolean }) {
  const c = useCloud()
  if (!cloudConfigured || !c.email) return null
  const status = c.syncing ? t('syncing') : c.lastSync ? t('lastSynced', { time: new Date(c.lastSync).toLocaleTimeString() }) : ''
  const button = (
    <button type="button" disabled={c.syncing} onClick={() => void syncNow()}
      className={compact ? 'inline-flex min-h-11 items-center gap-1.5 px-4 text-sm font-bold text-ink disabled:opacity-60' : 'btn btn-primary w-full'}>
      <Icon name="repeat" size={compact ? 18 : undefined} className={c.syncing ? 'animate-spin' : ''} />{t('syncNowBtn')}
    </button>
  )
  if (compact) return <span className="inline-flex items-center" title={status || undefined}>{button}<span role="status" className="sr-only">{status}</span></span>
  return <><p role="status" className="mut m-0 text-sm">{status}</p>{button}</>
}

/** 8px rounded bar. `color` is a Tailwind bg class. */
export const ProgressBar = ({ value, max, color = 'bg-grape', className = '' }: { value: number; max: number; color?: string; className?: string }) => (
  <div className={`bar ${className}`} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max}>
    <i className={color} style={{ width: `${Math.min(100, Math.max(0, (value / max) * 100))}%` }} />
  </div>
)
