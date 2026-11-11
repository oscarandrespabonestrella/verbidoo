import type { CSSProperties, ReactNode } from 'react'

/** Stroke icons from the Verb Adventure 2.0 design system (24×24, 2px round stroke, currentColor). */
const P: Record<string, ReactNode> = {
  speaker: <><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M16.5 9a4 4 0 0 1 0 6" /></>,
  speakerLoud: <><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11" /></>,
  star: <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  book: <path d="M4 19V6a3 3 0 0 1 3-3h13v14H7a3 3 0 0 0-3 3 2 2 0 0 0 2 2h14" />,
  gamepad: <><rect x="2" y="7" width="20" height="11" rx="5" /><path d="M7 11v3M5.5 12.5h3M16 11.5h.01M18 13.5h.01" /></>,
  trophy: <><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4v1a4 4 0 0 0 4 4M17 6h3v1a4 4 0 0 1-4 4" /><path d="M12 14v4M8 21h8" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  unlock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></>,
  chevron: <path d="m9 6 6 6-6 6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  gauge: <><path d="M3.5 18a9 9 0 1 1 17 0" /><path d="M12 14 8.5 10.5" /></>,
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-6h4v6" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  flame: <path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 2 1.5 3 2.5 3-1-3 0-6 0-8z" />,
  pencil: <><path d="M4 20l1-4L16 5l3 3L8 19z" /><path d="M14 7l3 3" /></>,
  picture: <><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></>,
  repeat: <><path d="M17 2l3 3-3 3" /><path d="M4 11V9a4 4 0 0 1 4-4h12" /><path d="M7 22l-3-3 3-3" /><path d="M20 13v2a4 4 0 0 1-4 4H4" /></>,
  puzzle: <path d="M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v4h-4v-2a2 2 0 1 0-4 0v2H6v-4h2a2 2 0 1 0 0-4H6V6h4z" />,
  blocks: <><rect x="3" y="4" width="8" height="6" rx="1.5" /><rect x="13" y="4" width="8" height="6" rx="1.5" /><rect x="7" y="14" width="10" height="6" rx="1.5" /></>,
  bulb: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></>,
  ear: <><path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0" /><path d="M10 9a2 2 0 0 1 4 0" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  hand: <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 4 15.5L5 13a1.5 1.5 0 0 1 3 0" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  shuffle: <path d="M3 7h3c5 0 7 10 12 10h3M18 14l3 3-3 3M3 17h3c1.5 0 2.7-.8 3.7-2M14.3 9c1-1.2 2.2-2 3.7-2h3M18 4l3 3-3 3" />,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></>,
  undo: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  play: <path d="M7 5v14l11-7z" />,
  cloud: <path d="M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 1.5A3.75 3.75 0 0 1 17.5 18z" />,
  backspace: <><path d="M21 5H9l-6 7 6 7h12z" /><path d="m17 9-6 6M11 9l6 6" /></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  sprout: <path d="M12 21v-9M12 12c0-4 3-6 7-6 0 4-3 6-7 6zM12 14c0-3-2-5-6-5 0 3 2 5 6 5z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" /></>,
  ball: <><circle cx="12" cy="12" r="9" /><path d="m12 7 4 3-1.5 5h-5L8 10z" /></>,
  apple: <path d="M12 7c-2-2-7-2-7 4 0 5 4 9 7 9s7-4 7-9c0-6-5-6-7-4zM12 7c0-2 1-3 3-4" />,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  house: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /></>,
  turtle: <><path d="M4 15c0-4 3.5-7 8-7s8 3 8 7z" /><path d="M20 13h1.5a1.5 1.5 0 0 0 0-3H19M7 15l-1 3M17 15l1 3M9 11l3 4 3-4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
}
export type IconName = keyof typeof P

export function Icon({ name, size = 22, className = '', style, strokeWidth }: {
  name: IconName; size?: number; className?: string; style?: CSSProperties; strokeWidth?: number
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false"
      className={`shrink-0 ${className}`} style={style}
      fill="none" stroke="currentColor" strokeWidth={strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round">
      {P[name]}
    </svg>
  )
}

/** Filled flame / star used in the streak + XP pills. */
export const Flame = ({ size = 18 }: { size?: number }) => <Icon name="flame" size={size} style={{ fill: '#FF6B3D', stroke: '#FF6B3D' }} />
export const Star = ({ size = 18 }: { size?: number }) => <Icon name="star" size={size} style={{ fill: '#FDBE3C', stroke: '#E09600' }} />

/** Category id → icon + tint, as in the "Mundos de verbos" chips. */
export const CAT_STYLE: Record<string, { icon: IconName; bg: string; fg: string }> = {
  core: { icon: 'star', bg: '#ECEEFE', fg: '#5865F2' },
  daily: { icon: 'sun', bg: '#FFF4D6', fg: '#B07A00' },
  movement: { icon: 'ball', bg: '#E3F4FD', fg: '#0C76B8' },
  food: { icon: 'apple', bg: '#FFEDEA', fg: '#D93A3A' },
  school: { icon: 'book', bg: '#ECEEFE', fg: '#5865F2' },
  communication: { icon: 'chat', bg: '#E3F6EE', fg: '#0A875C' },
  family: { icon: 'house', bg: '#FFEEDD', fg: '#C2410C' },
}
