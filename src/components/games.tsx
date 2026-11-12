import { useEffect, useRef, useState } from 'react'
import { VARIANTS, type Variant } from '../data/i18n'
import { PASS_SCORE, pronunciationScore, wordMatches } from '../lib/games'
import { hasLetter } from '../lib/phrases'
import { t } from '../lib/progress'
import { speak } from '../lib/speech'
import { Icon } from './icons'
import { SpeakButton } from './ui'

const TILE = 'min-h-11 max-w-full rounded-xl border-2 border-line-strong bg-white px-3.5 py-1.5 text-lg font-bold text-ink shadow-[0_4px_14px_rgba(36,48,94,0.08)] transition active:translate-y-0.5'

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
      <div data-drop="answer" aria-label="answer" lang={variant}
        className="flex min-h-[132px] flex-wrap content-start items-start gap-2.5 rounded-[20px] border-2 border-dashed border-[#C7CCFB] bg-white p-3.5">
        {placed.map((i) => tile(i, '!border-[#C7CCFB] !bg-grape-soft !text-grape-dark'))}
      </div>
      <div data-drop="bank" lang={variant} className="flex min-h-14 flex-wrap justify-center gap-2.5">
        {bank.map((i) => tile(i))}
      </div>
      {!locked && (
        <button type="button" className="btn btn-primary w-full" disabled={bank.length > 0}
          onClick={() => { const given = placed.map((i) => tiles[i]).join(' '); onDone(given === answer, given) }}>
          {bank.length > 0 ? t('gm_wordsLeft', { n: bank.length }) : <><Icon name="check" strokeWidth={3} />{t('check')}</>}
        </button>
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
    <div className="flex flex-col gap-4">
      <div className="card flex flex-col items-center gap-3.5 !rounded-[28px] px-[18px] py-[22px] text-center">
        <b lang={variant} className="font-display text-[clamp(28px,9vw,44px)] font-bold leading-tight text-grape-dark">{phrase}</b>
        <div className="flex gap-3.5">
          <SpeakButton big text={phrase} variant={variant} />
          <SpeakButton big slow text={phrase} variant={variant} />
        </div>
      </div>
      {!locked && canRecord && allowRecord && (
        <div className="flex flex-col items-center gap-3 py-2">
          <button type="button" onClick={record} aria-label={recording ? t('stop') : t('record')}
            className={`flex size-[104px] items-center justify-center rounded-full text-white shadow-[0_8px_20px_rgba(36,48,94,0.16),0_0_0_12px_#ECEEFE,0_0_0_24px_#F5F6FF] ${recording ? 'animate-pulse bg-coral' : 'bg-grape'}`}>
            {recording ? <span className="size-8 rounded-lg bg-white" /> : <Icon name="mic" size={44} />}
          </button>
          <span className="mt-3 text-[15px] font-extrabold text-grape-dark">{recording ? t('stop') : t('record')}</span>
        </div>
      )}
      {!locked && (mine || recognizer) && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(160px,100%),1fr))] gap-2.5">
          {mine && <button type="button" onClick={() => new Audio(mine).play()} className="btn btn-ghost"><Icon name="play" />{t('playMine')}</button>}
          {mine && (
            <button type="button" onClick={() => speak(phrase, variant, { onEnd: () => void new Audio(mine).play() })}
              className="btn btn-ghost"><Icon name="repeat" />{t('compareVoice')}</button>
          )}
          {recognizer && (
            <button type="button" onClick={check} disabled={listening}
              className={`btn text-white ${listening ? 'animate-pulse bg-coral' : 'bg-sky'}`}>
              <Icon name="ear" />{listening ? t('listening') : t('checkVoice')}
            </button>
          )}
        </div>
      )}
      {heard !== null && (
        <div className="card p-4 text-center">
          <p className="m-0 text-lg">{t('youSaid', { s: heard || '…' })}</p>
          {/* Which words came through: green heard, red missed — tells the child exactly what to repeat. */}
          <p lang={variant} className="m-0 mt-1 flex flex-wrap justify-center gap-1 font-display text-2xl font-bold">
            {wordMatches(phrase, heard).map((m, i) => (
              <span key={i} className={`rounded-lg px-1.5 ${m.ok ? 'bg-mint-soft text-mint-dark' : 'bg-[#FDECEC] text-[#A12424] underline decoration-wavy'}`}>{m.word}</span>
            ))}
          </p>
        </div>
      )}
      {error && <p role="alert" className="m-0 rounded-2xl bg-sun/25 p-3 font-bold">{error}</p>}
      {!locked && <button type="button" className="btn btn-mint w-full" onClick={() => onDone(true, '', false)}><Icon name="check" strokeWidth={3} />{t('selfOk')}</button>}
      {recognizer && !locked && <p className="mut m-0 text-center text-xs">{t('recogNote')}</p>}
    </div>
  )
}
