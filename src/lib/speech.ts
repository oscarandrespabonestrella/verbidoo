import { useSyncExternalStore } from 'react'
import { VARIANTS, langOf, type TargetLang, type Variant } from '../data/i18n'
import { TARGETS, type VoiceStyle } from '../data/targets'
import { clipName } from './phrases'
import { activeVoice } from './progress'

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

let voices: SpeechSynthesisVoice[] = []
const listeners = new Set<() => void>()
if (speechSupported) {
  const load = () => { voices = speechSynthesis.getVoices(); listeners.forEach((l) => l()) }
  load()
  speechSynthesis.addEventListener('voiceschanged', load)
}
export const useVoices = () => useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), () => voices)

const norm = (s: string) => s.replace('_', '-').toLowerCase()
export function voiceFor(variant: Variant) {
  for (const code of VARIANTS[variant].voices) {
    const v = voices.find((x) => norm(x.lang) === code.toLowerCase())
    if (v) return { voice: v, exact: true }
  }
  const v = voices.find((x) => norm(x.lang).startsWith(variant.slice(0, 2)))
  return { voice: v, exact: false }
}

/** `voice`: play this recorded voice instead of the active child's choice (the "Listen" button in settings). */
export interface SpeakOpts { rate?: number; voice?: VoiceStyle; onWord?: (charIndex: number) => void; onEnd?: () => void }
let last: { parts: string[]; variant: Variant; opts: SpeakOpts } | null = null

// ── Recorded learning languages: Azure neural ("natural") or open-source Piper ("classic") — see docs/AUDIO.md ──
const audioOf = (variant: Variant) => TARGETS[langOf(variant) as TargetLang]?.audio
/**
 * Recording folders to try for a variant, best first: the chosen voice, then Piper. A natural clip that is missing
 * (not recorded yet) falls back to the classic one; classic never falls forward, so choosing it is a firm choice.
 */
export function clipDirs(variant: Variant, voice: VoiceStyle = activeVoice()): string[] {
  const a = audioOf(variant)
  if (!a) return []
  return [...new Set([a[voice]?.[variant], a.classic[variant]].filter((d): d is string => !!d))]
}
/** Learning languages have recordings of every phrase the app says, so they never depend on the device's voices. */
export const hasRecordings = (variant: Variant) => clipDirs(variant, 'classic').length > 0
export const canSpeak = (variant: Variant) => hasRecordings(variant) || speechSupported

let token = 0                              // bumped by every new speak() — older playback stops itself
let current: HTMLAudioElement | null = null
let interrupt: (() => void) | null = null
function stopAll() {
  token++
  current?.pause(); current = null
  interrupt?.(); interrupt = null
  if (speechSupported) speechSynthesis.cancel()
}

/** Plays one recording; resolves false if it is missing or can't play (the caller then falls back). */
function playClip(text: string, dir: string, rate: number, onWord?: (i: number) => void) {
  return new Promise<boolean>((resolve) => {
    const a = new Audio(`${import.meta.env.BASE_URL}audio/${dir}/${clipName(text)}.mp3`)
    a.playbackRate = rate
    a.preservesPitch = true // slow mode keeps the natural pitch
    let raf = 0
    const done = (ok: boolean) => { cancelAnimationFrame(raf); a.onended = a.onerror = null; interrupt = null; resolve(ok) }
    // Recordings have no word events: estimate the spoken position from playback progress for the read-along highlight.
    const tick = () => { if (a.duration) onWord!(Math.floor((a.currentTime / a.duration) * text.length)); raf = requestAnimationFrame(tick) }
    a.onended = () => done(true)
    a.onerror = () => done(false)
    current = a
    interrupt = () => done(true)
    a.play().then(() => { if (onWord) raf = requestAnimationFrame(tick) }, () => done(false))
  })
}
async function playRecorded(parts: string[], variant: Variant, opts: SpeakOpts, my: number) {
  const rate = (opts.rate ?? 0.9) / 0.9 // browser-voice rates are tuned around 0.9; recordings play at 1
  const dirs = clipDirs(variant, opts.voice)
  for (let i = 0; i < parts.length; i++) {
    let ok = false
    for (const dir of dirs) {
      ok = await playClip(parts[i], dir, rate, opts.onWord)
      if (my !== token) return opts.onEnd?.() // interrupted by a newer speak()
      if (ok) break // otherwise: not recorded in this voice, try the next folder
    }
    if (!ok) return synthesize(parts.slice(i), variant, opts) // no recording at all: browser voice, if the device has one
  }
  opts.onEnd?.()
}

/** Browser voices (Web Speech API): English, Spanish, Portuguese, and the fallback for the learning languages. */
function synthesize(parts: string[], variant: Variant, opts: SpeakOpts) {
  if (!speechSupported) return opts.onEnd?.()
  voices = speechSynthesis.getVoices() // may have loaded since the last voiceschanged
  const { voice } = voiceFor(variant)
  // No voice for this language: stay silent rather than let the browser read French with its default
  // (often English) voice — wrong pronunciation is worse than none in a language app. VoiceWarning explains why.
  if (!voice) return opts.onEnd?.()
  parts.forEach((t, i) => {
    const u = new SpeechSynthesisUtterance(t)
    u.lang = voice.lang
    u.voice = voice
    u.rate = opts.rate ?? 0.9
    if (opts.onWord) u.onboundary = (e) => e.name === 'word' && opts.onWord!(e.charIndex)
    if (i === parts.length - 1) { u.onend = () => opts.onEnd?.(); u.onerror = () => opts.onEnd?.() }
    speechSynthesis.speak(u)
  })
}

/** Speak one or more texts in sequence. Cancels anything already playing. */
export function speak(text: string | string[], variant: Variant, opts: SpeakOpts = {}) {
  const parts = Array.isArray(text) ? text : [text]
  last = { parts, variant, opts }
  stopAll()
  if (hasRecordings(variant)) void playRecorded(parts, variant, opts, token)
  else synthesize(parts, variant, opts)
}
export const SLOW = 0.55
export const repeatLast = () => last && speak(last.parts, last.variant, last.opts)
/** Each syllable slowly, then the whole word (`whole` for multi-word verbs like "naar buiten gaan"). */
export const speakSyllables = (syl: string[], variant: Variant, whole = syl.join('')) => speak([...syl, whole], variant, { rate: SLOW })
