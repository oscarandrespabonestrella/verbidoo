import { expect, test } from 'vitest'
import { MASCOTS, mascotImage, type Mood } from './mascots'
import { TARGETS } from './targets'

const MOODS: Mood[] = ['face', 'guide', 'celebrate', 'approve', 'sad', 'thinking', 'studying', 'love']
// Vite's glob (typed by vite/client, run by vitest): every image shipped in public/img, keyed '/public/img/x.webp'.
const IMAGES = new Set(Object.keys(import.meta.glob('/public/img/*.webp')))

test('Gaston uses an image of his own for every mood', () => {
  expect(MOODS.map((m) => mascotImage('gaston', m))).toEqual([
    '/img/gaston_face.webp', '/img/gaston_field.webp', '/img/gaston_conmemorating.webp', '/img/gaston_approves.webp',
    '/img/gaston_sad.webp', '/img/gaston_doubt.webp', '/img/gaston_studying.webp', '/img/gaston_love.webp',
  ])
})

test('a mood without an image falls back along FALLBACK', () => {
  const saved = MASCOTS.gaston.images
  MASCOTS.gaston.images = { face: saved.face, guide: saved.guide, celebrate: saved.celebrate, sad: saved.sad }
  try {
    expect(mascotImage('gaston', 'approve')).toBe('/img/gaston_conmemorating.webp')
    expect(mascotImage('gaston', 'thinking')).toBe('/img/gaston_face.webp')
    expect(mascotImage('gaston', 'love')).toBe('/img/gaston_field.webp')
  } finally { MASCOTS.gaston.images = saved }
})

test('Ollie uses every one of his images', () => {
  expect(MOODS.map((m) => mascotImage('ollie', m))).toEqual([
    '/img/ollie.webp', '/img/ollie.webp', '/img/ollie_conmemorating.webp', '/img/ollie_approves.webp',
    '/img/ollie_sad.webp', '/img/ollie_doubt.webp', '/img/ollie_studying.webp', '/img/ollie_love.webp',
  ])
})

test('every mood of every mascot resolves to an existing file', () => {
  for (const m of Object.values(MASCOTS)) for (const mood of MOODS) expect(IMAGES.has(`/public${mascotImage(m.id, mood)}`), `${m.id} ${mood}`).toBe(true)
})

test('each learning language has its own mascot, and the mascot belongs to it', () => {
  expect(TARGETS.fr.mascot).toBe('gaston')
  expect(TARGETS.nl.mascot).toBe('ollie')
  for (const c of Object.values(TARGETS)) expect(MASCOTS[c.mascot].lang).toBe(c.lang)
  expect(new Set(Object.values(TARGETS).map((c) => c.mascot)).size).toBe(Object.keys(TARGETS).length)
})
