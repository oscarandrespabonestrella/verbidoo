/**
 * Writes public/audio/fr/phrases.json: every French phrase the app can say, with its recording's file name.
 * Run `npm run audio:list`, then scripts/make_audio.py records whatever is missing (see docs/AUDIO.md).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { test } from 'vitest'
import { clipName, frenchPhrases } from '../src/lib/phrases'

test('write French phrase list', () => {
  const dir = new URL('../public/audio/fr/', import.meta.url)
  mkdirSync(dir, { recursive: true })
  const list = frenchPhrases().map((t) => ({ t, f: `${clipName(t)}.mp3` }))
  writeFileSync(new URL('phrases.json', dir), JSON.stringify(list, null, 0))
  console.log(`wrote ${list.length} phrases`)
})
