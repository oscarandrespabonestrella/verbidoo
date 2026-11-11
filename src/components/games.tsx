import { useEffect, useRef, useState } from 'react'
import { VARIANTS, type Variant } from '../data/i18n'
import { PASS_SCORE, pronunciationScore, wordMatches } from '../lib/games'
import { hasLetter } from '../lib/phrases'
import { t } from '../lib/progress'
import { speak } from '../lib/speech'
import { BigButton, SpeakButton } from './ui'

const TILE = 'rounded-xl bg-white px-3 py-2 font-display text-xl font-bold shadow-[0_4px_14px_rgba(36,48,94,0.08)] transition active:translate-y-0.5'

/**
 * Build a Sentence. Words move by dragging (pointer events: the same code path for mouse, touch and pen —
 * HTML5 drag-and-drop is unreliable on phones and tablets) or by tapping, which is also the keyboard path.
 */
export function SentenceBuilder({ tiles, answer, variant, locked, onDone }: {
  tiles: string[]; answer: string; variant: Variant; locked: boolean; onDone: (ok: boolean, given: string) => void
}) {
  const [placed, setPlaced] = useState<number[]>([])
  const [drag, setDrag] = useState<{ i: number; x: number; y: number; dx: number; dy: number; moved: boolean } | null>(null)
  const bank = tiles.map((_, i) => i).filter((i) => !placed.includes(i))

  const place = (i: number, before?: number) => setPlaced((cur) => {
    const rest = cur.filter((x) => x !== i)
    const at = before === undefined ? rest.length : rest.indexOf(before)
    return at < 0 ? [...rest, i] : [...rest.slice(0, at), i, ...rest.slice(at)]
  })
  const unplace = (i: number) => setPlaced((cur) => cur.filter((x) => x !== i))
  // Punctuation tiles ("!") are placed silently — only words are spoken.
  const tap = (i: number) => (placed.includes(i) ? unplace(i) : (hasLetter(tiles[i]) && speak(tiles[i], variant), place(i)))

  // Drop target = element under the finger: a placed tile (insert before it), the answer line, or the word bank.
  const dropAt = (i: number, x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop]')
    const where = el?.dataset.drop
    if (where === 'answer') place(i)
    else if (where === 'bank') unplace(i)
    else if (where?.startsWith('before:')) { const j = Number(where.slice(7)); if (j !== i) place(i, j) }
  }
  // The ref drives the logic (a quick tap can end before React re-renders); the state only drives the visual.
  const live = useRef<typeof drag>(null)
  const update = (d: typeof drag) => { live.current = d; setDrag(d) }
  const handlers = (i: number) => locked ? {} : {
    onPointerDown: (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      update({ i, x: e.clientX, y: e.clientY, dx: 0, dy: 0, moved: false })
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = live.current
      if (d?.i !== i) return
      update({ ...d, dx: e.clientX - d.x, dy: e.clientY - d.y, moved: d.moved || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8 })
    },
    onPointerUp: (e: React.PointerEvent) => {
      const d = live.current
      if (d?.i === i) { if (d.moved) dropAt(i, e.clientX, e.clientY); else tap(i) }
      update(null)
    },
    onPointerCancel: () => update(null),
    onKeyDown: (e: React.KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), tap(i)),
  }
  const tile = (i: number, extra = '') => {
    const lifted = drag?.i === i && drag.moved
    return (
      <button key={i} type="button" {...handlers(i)} data-drop={placed.includes(i) ? `before:${i}` : undefined}
        style={lifted ? { transform: `translate(${drag.dx}px, ${drag.dy}px) scale(1.08)`, pointerEvents: 'none', zIndex: 30, position: 'relative' } : undefined}
        className={`${TILE} touch-none select-none ${lifted ? 'shadow-xl' : ''} ${extra}`}>
        {tiles[i]}
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <div data-drop="answer" aria-label="answer"
        className="flex min-h-20 flex-wrap items-center gap-2 rounded-2xl border-4 border-dashed border-grape/40 bg-grape/5 p-3">
        {placed.map((i) => tile(i, 'bg-grape/15'))}
      </div>
      <div data-drop="bank" className="flex min-h-16 flex-wrap justify-center gap-2">
        {bank.map((i) => tile(i))}
      </div>
      {!locked && (
        <BigButton className="w-full" disabled={bank.length > 0}
          onClick={() => { const given = placed.map((i) => tiles[i]).join(' '); onDone(given === answer, given) }}>
          ✅ {t('check')}
        </BigButton>
      )}
    </div>
  )
}

// Minimal typing for the (still prefixed in Chrome/Safari) Web Speech recognition API.
interface Recognition {
  lang: string; maxAlternatives: number; interimResults: boolean
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void; abort(): void
}
const Recognizer = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition })
const SR = Recognizer.SpeechRecognition ?? Recognizer.webkitSpeechRecognition
const canRecord = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

/**
 * Pronunciation Challenge. Three layers, each working without the next:
 * 1. listen + repeat aloud + "I said it!"  (always available)
 * 2. record and play back your own voice next to the model (on-device only, never uploaded or stored)
 * 3. automatic check with the browser's speech recognition — only if a parent turned it on, since the browser may
 *    send the audio to its vendor
 * `verified` tells the caller whether the answer was actually checked (self-reports don't count towards accuracy).
 */
export function PronounceChallenge({ phrase, variant, locked, allowRecord, allowCheck, onDone }: {
  phrase: string; variant: Variant; locked: boolean; allowRecord: boolean; allowCheck: boolean
  onDone: (ok: boolean, heard: string, verified: boolean) => void
}) {
  const recognizer = allowCheck ? SR : undefined
  const [heard, setHeard] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [recording, setRecording] = useState(false)
  const [mine, setMine] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)

  useEffect(() => { speak(phrase, variant) }, [phrase, variant])
  useEffect(() => () => { if (mine) URL.revokeObjectURL(mine) }, [mine])

  const check = () => {
    if (!recognizer) return
    const r = new recognizer()
    r.lang = VARIANTS[variant].voices[0]
    r.maxAlternatives = 3
    r.interimResults = false
    r.onresult = (e) => {
      const alts = Array.from(e.results[0]).map((a) => a.transcript)
      const best = alts.reduce((a, b) => (pronunciationScore(phrase, b) > pronunciationScore(phrase, a) ? b : a))
      setHeard(best)
      if (pronunciationScore(phrase, best) >= PASS_SCORE) onDone(true, best, true)
    }
    r.onerror = (e) => setError(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? t('noMic') : t('notHeard'))
    r.onend = () => setListening(false)
    setError(null); setHeard(null); setListening(true)
    r.start()
  }

  const record = async () => {
    if (recording) { recorder.current?.stop(); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream), chunks: Blob[] = []
      rec.ondataavailable = (e) => chunks.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop())
        setRecording(false)
        setMine(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })))
      }
      recorder.current = rec
      rec.start()
      setRecording(true)
      setTimeout(() => rec.state === 'recording' && rec.stop(), 6000) // kids forget to stop
    } catch {
      setError(t('noMic'))
    }
  }

  return (
    <div className="space-y-4 text-center">
      <p className="font-display text-3xl font-bold text-grape">{phrase}</p>
      <div className="flex justify-center gap-3">
        <SpeakButton big text={phrase} variant={variant} />
        <SpeakButton big slow text={phrase} variant={variant} />
      </div>
      {!locked && (
        <div className="flex flex-wrap justify-center gap-3">
          {canRecord && allowRecord && (
            <button type="button" onClick={record}
              className={`rounded-full px-5 py-3 font-bold text-white ${recording ? 'animate-pulse bg-coral' : 'bg-grape'}`}>
              {recording ? `⏹️ ${t('stop')}` : `🎙️ ${t('record')}`}
            </button>
          )}
          {mine && <button type="button" onClick={() => new Audio(mine).play()} className="rounded-full bg-sky px-5 py-3 font-bold text-white">🎙️ {t('playMine')}</button>}
          {mine && (
            <button type="button" onClick={() => speak(phrase, variant, { onEnd: () => void new Audio(mine).play() })}
              className="rounded-full bg-sun px-5 py-3 font-bold">🔊↔🎙️ {t('compareVoice')}</button>
          )}
          {recognizer && (
            <button type="button" onClick={check} disabled={listening}
              className={`rounded-full px-5 py-3 font-bold text-white ${listening ? 'animate-pulse bg-coral' : 'bg-mint'}`}>
              {listening ? `👂 ${t('listening')}` : `✨ ${t('checkVoice')}`}
            </button>
          )}
        </div>
      )}
      {heard !== null && (
        <div>
          <p className="text-lg">{t('youSaid', { s: heard || '…' })}</p>
          {/* Which words came through: green heard, red missed — tells the child exactly what to repeat. */}
          <p className="mt-1 flex flex-wrap justify-center gap-1 font-display text-2xl font-bold">
            {wordMatches(phrase, heard).map((m, i) => (
              <span key={i} className={`rounded-lg px-1.5 ${m.ok ? 'bg-mint/20 text-mint' : 'bg-coral/15 text-coral underline decoration-wavy'}`}>{m.word}</span>
            ))}
          </p>
        </div>
      )}
      {error && <p className="rounded-xl bg-sun/25 p-2 font-bold">{error}</p>}
      {!locked && <BigButton color="bg-mint shadow-[0_8px_20px_rgba(36,48,94,0.16)]" className="w-full" onClick={() => onDone(true, '', false)}>{t('selfOk')}</BigButton>}
      {recognizer && !locked && <p className="text-xs text-ink/50">{t('recogNote')}</p>}
    </div>
  )
}
