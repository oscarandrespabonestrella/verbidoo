import { describe, expect, it } from 'vitest'
import { shouldShow, snoozed, type InstallState } from './install'

const DAY = 86_400_000
const base: InstallState = { visits: 3, achieved: true, dismissals: 0, snoozeUntil: 0, installed: false }

describe('install invitation', () => {
  it('waits for visits and an achievement, and needs a way to install', () => {
    expect(shouldShow(base, 0, true, false, false)).toBe(true)
    expect(shouldShow(base, 0, false, true, false)).toBe(true) // iOS: instructions instead of a prompt
    expect(shouldShow(base, 0, false, false, false)).toBe(false)
    expect(shouldShow({ ...base, visits: 2 }, 0, true, false, false)).toBe(false)
    expect(shouldShow({ ...base, achieved: false }, 0, true, false, false)).toBe(false)
    expect(shouldShow({ ...base, installed: true }, 0, true, false, false)).toBe(false)
    expect(shouldShow(base, 0, true, false, true)).toBe(false) // already running installed
  })

  it('backs off 14, 30, 90 days, then stops for good', () => {
    let s = base
    for (const days of [14, 30, 90]) {
      s = { ...s, ...snoozed(s, 0) }
      expect(shouldShow(s, days * DAY - 1, true, false, false)).toBe(false)
      expect(shouldShow(s, days * DAY, true, false, false)).toBe(true)
    }
    s = { ...s, ...snoozed(s, 0) }
    expect(shouldShow(s, 10_000 * DAY, true, false, false)).toBe(false)
  })
})
