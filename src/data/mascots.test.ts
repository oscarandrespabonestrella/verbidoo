import { expect, test } from 'vitest'
import { MASCOTS, mascotImage, type Mood } from './mascots'
import { TARGETS } from './targets'

const MOODS: Mood[] = ['face', 'guide', 'celebrate', 'approve', 'sad', 'thinking', 'studying', 'love']
// Vite's glob (typed by vite/client, run by vitest): every image shipped in public/img, keyed '/public/img/x.webp'.
const IMAGES = new Set(Object.keys(import.meta.glob('/public/img/*.webp')))

test('Gaston keeps exactly the images he had before', () => {
  expect(mascotImage('gaston', 'face')).toBe('/img/gaston_face.webp')
  expect(mascotImage('gaston', 'guide')).toBe('/img/gaston_field.webp')
  expect(mascotImage('gaston', 'celebrate')).toBe('/img/gaston_conmemorating.webp')
  expect(mascotImage('gaston', 'sad')).toBe('/img/gaston_sad.webp')
  // New moods fall back to the pose Gaston already used in that place.
  expect(mascotImage('gaston', 'approve')).toBe('/img/gaston_conmemorating.webp') // right answer: celebrate
  expect(mascotImage('gaston', 'thinking')).toBe('/img/gaston_face.webp')        // question: face
  expect(mascotImage('gaston', 'studying')).toBe('/img/gaston_face.webp')
  expect(mascotImage('gaston', 'love')).toBe('/img/gaston_field.webp')
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
