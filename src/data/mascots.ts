import type { TargetLang } from './i18n'

/**
 * Learning companions, one per target language. A new mascot = one entry here + its images in public/img.
 * Moods: face = talks (logo, bubbles) · guide = home and welcome · celebrate = session end, big wins ·
 * approve = right answer · sad = wrong answer · thinking = a question · studying = lessons · love = encouragement.
 * A mood a mascot has no image for falls back along FALLBACK, then to its default image.
 */
export type Mood = 'face' | 'guide' | 'celebrate' | 'approve' | 'sad' | 'thinking' | 'studying' | 'love'
export type MascotId = 'gaston' | 'ollie'

export interface MascotConfig {
  id: MascotId; name: string; emoji: string; lang: TargetLang
  default: string
  images: Partial<Record<Mood, string>>
}

const img = (f: string) => `/img/${f}.webp`

export const MASCOTS: Record<MascotId, MascotConfig> = {
  gaston: {
    id: 'gaston', name: 'Gaston', emoji: '🦕', lang: 'fr', default: img('gaston_face'),
    images: {
      face: img('gaston_face'), guide: img('gaston_field'), celebrate: img('gaston_conmemorating'), approve: img('gaston_approves'),
      sad: img('gaston_sad'), thinking: img('gaston_doubt'), studying: img('gaston_studying'), love: img('gaston_love'),
    },
  },
  ollie: {
    // ponytail: no face-only Ollie yet, so `face` uses the flag pose; add images.face when the asset exists.
    id: 'ollie', name: 'Ollie', emoji: '🦎', lang: 'nl', default: img('ollie'),
    images: {
      face: img('ollie'), guide: img('ollie'), celebrate: img('ollie_conmemorating'), approve: img('ollie_approves'),
      sad: img('ollie_sad'), thinking: img('ollie_doubt'), studying: img('ollie_studying'), love: img('ollie_love'),
    },
  },
}

/** Where a missing mood looks next (e.g. a mascot with no "approve" image shows celebrating on a right answer). */
export const FALLBACK: Partial<Record<Mood, Mood>> = {
  approve: 'celebrate', thinking: 'face', studying: 'face', love: 'guide', guide: 'face', celebrate: 'face', sad: 'face',
}

export function mascotImage(id: MascotId, mood: Mood): string {
  const m = MASCOTS[id] ?? MASCOTS.gaston
  for (let k: Mood | undefined = mood; k; k = FALLBACK[k]) if (m.images[k]) return m.images[k]!
  return m.default
}
