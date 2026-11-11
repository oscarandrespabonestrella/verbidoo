import { useSyncExternalStore } from 'react'
import { VARIANTS, langOf, type Variant } from '../data/i18n'
import { clipName } from './phrases'

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

export interface SpeakOpts { rate?: number; onWord?: (charIndex: number) => void; onEnd?: () => void }
let last: { parts: string[]; variant: Variant; opts: SpeakOpts } | null = null

// ── Recorded French (open-source Piper "siwis" voice, CC BY 4.0 — see docs/AUDIO.md) ──
const CLIP_BASE = `${import.meta.env.BASE_URL}audio/fr/`
/** French has studio-quality recordings of every phrase the app says, so it never depends on the device's voices. */
export const hasRecordings = (variant: Variant) => langOf(variant) === 'fr'
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
function playClip(text: string, rate: number, onWord?: (i: number) => void) {
  return new Promise<boolean>((resolve) => {
    const a = new Audio(CLIP_BASE + clipName(text) + '.mp3')
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
  for (let i = 0; i < parts.length; i++) {
    const ok = await playClip(parts[i], rate, opts.onWord)
    if (my !== token) return opts.onEnd?.() // interrupted by a newer speak()
    if (!ok) return synthesize(parts.slice(i), variant, opts) // missing clip: browser voice, if it has French
  }
  opts.onEnd?.()
}

/** Browser voices (Web Speech API): English, Spanish, Portuguese, and the fallback for French. */
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
export const speakSyllables = (syl: string[], variant: Variant) => speak([...syl, syl.join('')], variant, { rate: SLOW })
