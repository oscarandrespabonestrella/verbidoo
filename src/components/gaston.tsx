import type { ReactNode } from 'react'

/**
 * Gaston, Verbi's mascot — one gesture per moment (design "Marca · Verbi + Gaston"):
 * face = talks (logo, tips, bubbles) · guide = home and welcome · celebrate = right answer, session end · sad = wrong answer.
 */
export type Pose = 'face' | 'guide' | 'celebrate' | 'sad'
const SRC: Record<Pose, string> = {
  face: '/img/gaston_face.webp',
  guide: '/img/gaston_field.webp',
  celebrate: '/img/gaston_conmemorating.webp',
  sad: '/img/gaston_sad.webp',
}

export function Gaston({ pose = 'face', size = 120, alt = '', className = '' }: { pose?: Pose; size?: number; alt?: string; className?: string }) {
  return (
    <img src={SRC[pose]} alt={alt} aria-hidden={alt ? undefined : true} width={size} height={size} draggable={false}
      className={`shrink-0 select-none object-contain ${className}`} style={{ width: size, height: size }} />
  )
}

/** Gaston + speech bubble (flat corner points at him). */
export function GastonSays({ children, pose = 'face', size = 84, className = '' }: { children: ReactNode; pose?: Pose; size?: number; className?: string }) {
  return (
    <div className={`flex min-w-0 items-end gap-1.5 ${className}`}>
      <Gaston pose={pose} size={size} />
      <div className="bubble mb-3 min-w-0 rounded-bl-md">{children}</div>
    </div>
  )
}

/**
 * Wordmark: gaston_face + "Verbi" (red dot on the i, blue/red swoosh underneath).
 * Placeholder until the vector logo exists — swap this component for the SVG then.
 */
export function Logo({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-ink ${className}`}>
      <Gaston pose="face" size={size * 1.3} />
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
