/**
 * Writes public/audio/<dir>/phrases.json for every recording folder (fr, nl-NL, nl-BE): every phrase the app can
 * say in that language, with its recording's file name. Then scripts/make_audio.py records whatever is missing (docs/AUDIO.md).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { test } from 'vitest'
import { AUDIO_DIRS, clipName, targetPhrases } from '../src/lib/phrases'

test('write phrase lists', () => {
  for (const [dir, variants] of Object.entries(AUDIO_DIRS)) {
    const out = new URL(`../public/audio/${dir}/`, import.meta.url)
    mkdirSync(out, { recursive: true })
    const list = targetPhrases(variants).map((t) => ({ t, f: `${clipName(t)}.mp3` }))
    writeFileSync(new URL('phrases.json', out), JSON.stringify(list, null, 0))
    console.log(`${dir}: wrote ${list.length} phrases`)
  }
})
