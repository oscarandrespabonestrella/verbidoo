import type { ReactNode } from 'react'
import { VARIANTS, type TargetLang } from '../data/i18n'
import { MASCOTS, mascotImage, type MascotId, type Mood } from '../data/mascots'
import { TARGETS, targetOf, type TargetConfig } from '../data/targets'
import { t, useProgress } from '../lib/progress'

/** The current learning language's config (French before a language is picked, as the app always started). */
export function useTarget(): TargetConfig {
  const s = useProgress()
  return s.target ? targetOf(s.target) : TARGETS.fr
}

/**
 * The learning companion: the mascot always follows the language being learned (Gaston for French, Ollie for Dutch),
 * never the child's own language. `mascot` forces one (the language picker shows each language's own).
 * `alt` = true names the mascot for screen readers; otherwise it is decorative.
 */
export function Mascot({ mood = 'face', size = 120, alt, mascot, className = '' }: { mood?: Mood; size?: number; alt?: string | true; mascot?: MascotId; className?: string }) {
  const current = useTarget().mascot
  const id = mascot ?? current
  const label = alt === true ? MASCOTS[id].name : alt
  return (
    <img src={mascotImage(id, mood)} alt={label ?? ''} aria-hidden={label ? undefined : true} width={size} height={size} draggable={false}
      className={`shrink-0 select-none object-contain ${className}`} style={{ width: size, height: size }} />
  )
}

/** Mascot + speech bubble (flat corner points at it). */
export function MascotSays({ children, mood = 'face', size = 84, mascot, className = '' }: { children: ReactNode; mood?: Mood; size?: number; mascot?: MascotId; className?: string }) {
  return (
    <div className={`flex min-w-0 items-end gap-1.5 ${className}`}>
      <Mascot mood={mood} size={size} mascot={mascot} />
      <div className="bubble mb-3 min-w-0 rounded-bl-md">{children}</div>
    </div>
  )
}

/**
 * Wordmark: the mascot's face + "Verbi" (red dot on the i, blue/red swoosh underneath).
 * Placeholder until the vector logo exists — swap this component for the SVG then.
 */
export function Logo({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-ink ${className}`}>
      <Mascot mood="face" size={size * 1.3} />
      <span aria-hidden className="flex flex-col">
        <span className="font-display font-bold leading-[.9]" style={{ fontSize: size }}>
          Verb<span className="relative">ı<span aria-hidden className="absolute left-1/2 top-[.02em] size-[.24em] -translate-x-1/2 rounded-full bg-rouge" /></span>
        </span>
        <svg viewBox="0 0 200 16" width={size * 2.9} height={size * 0.25} aria-hidden>
          <path d="M3 13 Q90 0 140 6" stroke="#2B5CE6" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M92 14 Q160 3 197 6" stroke="#EF3340" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      </span>
      <span className="sr-only">Verbi</span>
    </span>
  )
}

/** Soft Paris morning: sky, sun glow, Eiffel tower, trees and a path. Purely decorative. */
export function ParisScene({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 390 300" preserveAspectRatio="xMidYMax slice" aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}>
      <defs><radialGradient id="paris-sun"><stop offset="0" stopColor="#FFF4D2" /><stop offset="1" stopColor="#FFF4D2" stopOpacity="0" /></radialGradient></defs>
      <circle cx="270" cy="170" r="130" fill="url(#paris-sun)" />
      <ellipse cx="70" cy="40" rx="46" ry="14" fill="#fff" opacity=".7" /><ellipse cx="330" cy="30" rx="36" ry="11" fill="#fff" opacity=".6" />
      <path d="M270 40 L273 85 L278 140 L288 200 L310 270 L296 270 Q270 225 244 270 L230 270 L252 200 L262 140 L267 85 Z" fill="#B7A3C4" opacity=".75" />
      <rect x="254" y="136" width="32" height="6" rx="2" fill="#A792B5" opacity=".8" /><rect x="244" y="196" width="52" height="7" rx="2" fill="#A792B5" opacity=".8" />
      <circle cx="10" cy="255" r="60" fill="#8CC07A" /><circle cx="60" cy="280" r="46" fill="#79B36A" /><circle cx="385" cy="255" r="54" fill="#8CC07A" />
      <path d="M0 275 H390 V300 H0 Z" fill="#9CCB86" /><path d="M185 275 H215 L280 300 H120 Z" fill="#F1DFC4" />
    </svg>
  )
}

/** Dutch morning, same style: windmill, tulip rows, a canal. Purely decorative. */
export function DutchScene({ className = '' }: { className?: string }) {
  const tulips = [20, 44, 68, 92, 300, 324, 348, 372]
  return (
    <svg viewBox="0 0 390 300" preserveAspectRatio="xMidYMax slice" aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}>
      <defs><radialGradient id="dutch-sun"><stop offset="0" stopColor="#FFF4D2" /><stop offset="1" stopColor="#FFF4D2" stopOpacity="0" /></radialGradient></defs>
      <circle cx="270" cy="170" r="130" fill="url(#dutch-sun)" />
      <ellipse cx="70" cy="40" rx="46" ry="14" fill="#fff" opacity=".7" /><ellipse cx="330" cy="30" rx="36" ry="11" fill="#fff" opacity=".6" />
      {/* Windmill: tower, cap, four sails. */}
      <path d="M256 268 L262 150 L286 150 L292 268 Z" fill="#B7A3C4" opacity=".8" />
      <path d="M258 152 Q274 128 290 152 Z" fill="#A792B5" opacity=".85" />
      <g transform="translate(274 146)" opacity=".8" fill="#A792B5">
        {[20, 110, 200, 290].map((a) => <rect key={a} x="-5" y="-78" width="10" height="74" rx="2" transform={`rotate(${a})`} />)}
        <circle r="6" fill="#8F7AA0" />
      </g>
      <rect x="268" y="236" width="12" height="32" rx="6" fill="#8F7AA0" opacity=".7" />
      <circle cx="10" cy="258" r="56" fill="#8CC07A" /><circle cx="385" cy="258" r="50" fill="#8CC07A" />
      <path d="M0 275 H390 V300 H0 Z" fill="#9CCB86" />
      {tulips.map((x, i) => (
        <g key={x}><rect x={x - 1} y="262" width="2" height="12" fill="#5E9E4F" /><ellipse cx={x} cy="261" rx="5" ry="6" fill={['#EF3340', '#FDBE3C', '#F27BA5', '#FF8A3D'][i % 4]} /></g>
      ))}
      <path d="M160 275 H230 L260 300 H130 Z" fill="#9FD3EC" /><path d="M172 284 H218" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".7" />
    </svg>
  )
}

const SCENES: Record<TargetLang, (p: { className?: string }) => ReactNode> = { fr: ParisScene, nl: DutchScene }
/** The backdrop of the learning language's home (Paris for French, a Dutch landscape for Dutch). */
export function Scene({ className = '' }: { className?: string }) {
  const S = SCENES[useTarget().lang]
  return <S className={className} />
}

/** Current learning language (flag + mascot); opens the language picker. */
export function LanguagePill({ className = '' }: { className?: string }) {
  const s = useProgress(), c = useTarget()
  return (
    <a href="#/learn" className={`pill !pl-1 ${className}`} aria-label={t('switchLanguage')} title={t('switchLanguage')}>
      <Mascot mood="face" size={34} /><span className="flag text-lg leading-none" aria-hidden>{s.target ? VARIANTS[s.target].flag : c.flag}</span>
    </a>
  )
}
