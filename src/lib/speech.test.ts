import { expect, test } from 'vitest'
import { TARGET_VARIANTS } from '../data/i18n'
import { clipDirs } from './speech'

test('natural voice tries the cloud recording first, then falls back to Piper', () => {
  expect(clipDirs('fr-CA', 'natural')).toEqual(['natural/fr-CA', 'fr'])
  expect(clipDirs('nl-BE', 'natural')).toEqual(['natural/nl-BE', 'nl-BE'])
})

test('classic voice only plays Piper', () => {
  expect(clipDirs('fr-FR', 'classic')).toEqual(['fr'])
  for (const v of TARGET_VARIANTS) expect(clipDirs(v, 'classic')).toHaveLength(1)
})

test('children’s own languages have no recordings', () => {
  expect(clipDirs('en-US', 'natural')).toEqual([])
})
