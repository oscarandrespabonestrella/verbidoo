import { useState, type ReactNode } from 'react'
import { VARIANTS, type Variant } from '../data/i18n'
import type { Form } from '../engine/conjugate'
import { t } from '../lib/progress'
import { SLOW, canSpeak, hasRecordings, speak, speechSupported, useVoices, voiceFor } from '../lib/speech'

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`rounded-3xl bg-white p-5 shadow-[0_12px_32px_rgba(36,48,94,0.06)] ring-1 ring-[#E9EBF5] ${className}`}>{children}</section>
)

export function SpeakButton({ text, variant, slow, label, className = '', big }: {
  text: string | string[]; variant: Variant; slow?: boolean; label?: string; className?: string; big?: boolean
}) {
  const [on, setOn] = useState(false)
  const play = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOn(true)
    speak(text, variant, { rate: slow ? SLOW : undefined, onEnd: () => setOn(false) })
  }
  return (
    <button
      type="button" onClick={play} disabled={!canSpeak(variant)}
      aria-label={label ?? (slow ? t('slow') : t('normal'))} title={label ?? (slow ? t('slow') : t('normal'))}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-sky text-white shadow-[0_8px_20px_rgba(36,48,94,0.16)] transition active:translate-y-1 disabled:opacity-40 ${big ? 'h-16 w-16 text-3xl' : 'h-11 w-11 text-xl'} ${on ? 'animate-pulse' : ''} ${className}`}
    >
      {slow ? '🐢' : '🔊'}
    </button>
  )
}

export function BigButton({ children, onClick, color = 'bg-grape shadow-[0_8px_20px_rgba(36,48,94,0.16)]', className = '', disabled }: {
  children: ReactNode; onClick?: () => void; color?: string; className?: string; disabled?: boolean
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`rounded-full px-7 py-4 font-display text-xl font-bold text-white transition active:translate-y-1 disabled:opacity-50 ${color} ${className}`}>
      {children}
    </button>
  )
}

export function Mascot({ message, variant, emoji = '🦉' }: { message: string; variant?: Variant; emoji?: string }) {
  return (
    <div className="flex items-end gap-3">
      <button type="button" aria-label={message} onClick={() => variant && speak(message, variant)}
        className="animate-bob select-none text-7xl drop-shadow-md">{emoji}</button>
      <div className="relative mb-6 rounded-2xl rounded-bl-none bg-white px-4 py-3 font-bold shadow ring-1 ring-[#E9EBF5]">{message}</div>
    </div>
  )
}

const KIND_COLOR = { regular: 'text-grape', spelling: 'text-sky', irregular: 'text-coral' }
/** Conjugated form with the ending / irregular part colored. */
export function FormView({ form }: { form: Form }) {
  return (
    <span>
      {form.aux && <span className="text-ink/60">{form.aux.endsWith("'") ? form.aux : `${form.aux} `}</span>}
      <span>{form.word.slice(0, form.split)}</span>
      <span className={`font-extrabold ${KIND_COLOR[form.kind]}`}>{form.word.slice(form.split)}</span>
      {form.after && <span className="text-ink/60">{form.after.startsWith('-') ? form.after : ` ${form.after}`}</span>}
    </span>
  )
}
export function Legend() {
  return (
    <p className="flex flex-wrap gap-3 text-sm font-bold">
      <span className="text-grape">● {t('legendEnding')}</span>
      <span className="text-sky">● {t('legendSpelling')}</span>
      <span className="text-coral">● {t('legendIrregular')}</span>
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
  if (!voice || !voices.length) return <p role="alert" className="rounded-2xl bg-coral/15 p-3 text-sm font-bold text-coral">🔇 {t('noVoiceLang', { v: VARIANTS[variant].name })}</p>
  return <p className="rounded-2xl bg-sun/25 p-3 text-sm font-bold">{t('noVoice', { v: VARIANTS[variant].name })}</p>
}

export function Confetti() {
  const bits = ['⭐', '🎉', '✨', '🌟', '🎊']
  return <>{Array.from({ length: 18 }, (_, i) => (
    <span key={i} aria-hidden className="confetti" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.08}s` }}>{bits[i % bits.length]}</span>
  ))}</>
}

export const ProgressBar = ({ value, max, color = 'bg-mint' }: { value: number; max: number; color?: string }) => (
  <div className="h-3 overflow-hidden rounded-full bg-[#E9EBF5]" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
    <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
  </div>
)
