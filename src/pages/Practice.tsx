import { useEffect, useMemo, useState } from 'react'
import { go } from '../App'
import { PronounceChallenge, SentenceBuilder } from '../components/games'
import { BigButton, Card, Confetti, FormView, SpeakButton, VoiceWarning } from '../components/ui'
import { CATEGORIES, PERSONS, VARIANTS, langOf, type Variant } from '../data/i18n'
import { VERBS, type Verb } from '../data/verbs'
import { conjugate, formText, infinitive, pronounFor, type Form, type Tense } from '../engine/conjugate'
import { buildSession, levelFor, pickKind, tenseWeight, type Learner } from '../lib/adaptive'
import { CUE_WORD, makeQ, verbLabel, type Kind, type Q, type TimeCue } from '../lib/games'
import { answer, awardBadges, learner, openVerbs, overLimit, praise, t, useProgress, type AnswerResult, type State } from '../lib/progress'
import { MISSIONS, MISSION_XP, WEEKLY_XP } from '../lib/rewards'
import { canSpeak, speak } from '../lib/speech'

const GAMES = [
  { id: 'picture', emoji: '🖼️', color: 'from-sky to-grape' },
  { id: 'listen', emoji: '👂', color: 'from-mint to-sky' },
  { id: 'conjugate', emoji: '🧩', color: 'from-grape to-coral' },
  { id: 'complete', emoji: '✏️', color: 'from-sun to-coral' },
  { id: 'timetravel', emoji: '⏳', color: 'from-sky to-mint' },
  { id: 'translate', emoji: '🌍', color: 'from-grape to-sky' },
  { id: 'build', emoji: '🧱', color: 'from-coral to-grape' },
  { id: 'pronounce', emoji: '🎙️', color: 'from-mint to-grape' },
  { id: 'mixed', emoji: '🗺️', color: 'from-coral to-sun' },
] as const
const ROUNDS = 10
const NEEDS_VOICE: string[] = ['listen'] // pronounce still works without TTS: read, record, self-check
const CUE_ICON: Record<TimeCue, string> = { past: '⏪', now: '⏺️', future: '⏩' }
const CUE_NATIVE = { past: 'yesterday', now: 'now', future: 'tomorrow' } as const

function Picker() {
  const target = useProgress().target!
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold">{t('chooseGame')}</h1>
      {!canSpeak(target) && <VoiceWarning variant={target} />}
      <div className="grid gap-4 sm:grid-cols-2">
        {GAMES.map((g) => (
          <button key={g.id} type="button" disabled={NEEDS_VOICE.includes(g.id) && !canSpeak(target)} onClick={() => go(`play/${g.id}`)}
            className={`rounded-3xl bg-gradient-to-br ${g.color} p-5 text-left text-white shadow-lg transition hover:-translate-y-1 disabled:opacity-40 ${g.id === 'mixed' ? 'sm:col-span-2' : ''}`}>
            <div className="text-5xl">{g.emoji}</div>
            <div className="font-display text-2xl font-extrabold">{t(`game_${g.id}`)}</div>
            <div className="font-bold opacity-90">{g.id === 'mixed' ? t('dailyChallengeDesc') : t(`game_${g.id}_desc`)}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

/** "je", "que j'", "(tu)" — the subject shown before a blank or a form. */
const subject = (target: Variant, p: number, text: string, tense?: Tense) =>
  tense?.imperative ? `(${PERSONS[langOf(target)][p].label})` : pronounFor(langOf(target), p, text, tense)
const Said = ({ target, q, form }: { target: Variant; q: Q; form: Form }) => {
  const sub = subject(target, q.person!, formText(form), q.tense)
  return <>{sub}{sub.endsWith("'") ? '' : ' '}<FormView form={form} /></>
}

export function Practice({ game, focus }: { game?: string; focus?: string }) {
  const s = useProgress()
  const target = s.target!, native = s.native!
  const valid = GAMES.some((g) => g.id === game)

  // Session plan, fixed at start: due reviews → tricky verbs → a few new ones (see adaptive.buildSession).
  const open = useMemo(() => openVerbs(s, CATEGORIES), []) // snapshot at session start
  const kinds: Kind[] = game === 'mixed'
    ? (['picture', 'listen', 'conjugate', 'complete', 'timetravel', 'translate', 'build', 'pronounce'] as Kind[]).filter((k) => canSpeak(target) || !NEEDS_VOICE.includes(k))
    : [game as Kind]

  /** Next question for a verb: game picked for the learner, difficulty from that game's history, tenses from the unlock path. */
  const nextQ = (verb: Verb, st: State, recent: Kind[]): Q => {
    const L: Learner = learner(st)
    const kind = pickKind(L, verb, kinds, recent)
    return makeQ(kind, verb, open, levelFor(L, kind), target, native,
      langOf(target) === 'fr' ? { unlocked: L.unlocked, weight: (id) => tenseWeight(L, id) } : {})
  }
  const [queue, setQueue] = useState(() => buildSession(learner(s), open, ROUNDS, focus))
  const [recent, setRecent] = useState<Kind[]>([])
  const [q, setQ] = useState<Q | null>(() => valid && queue.length ? nextQ(queue[0], s, []) : null)
  const [newTense, setNewTense] = useState<string | null>(null)
  const [rewards, setRewards] = useState<Pick<AnswerResult, 'missions' | 'weeklyWon'>>({ missions: [], weeklyWon: false })
  const [given, setGiven] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [done, setDone] = useState(0)
  const [right, setRight] = useState(0)
  const [xp, setXp] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [round, setRound] = useState(0) // remount key for the interactive widgets, one per question

  useEffect(() => { if (q?.kind === 'listen') speak(q.spoken, target) }, [q, target])

  if (!valid) return <Picker />
  // Parent's daily limit: finish the current feedback, then a friendly stop (progress is already saved).
  if (overLimit(s) && given === null) {
    return (
      <Card className="animate-pop text-center">
        <div className="text-7xl">🌙</div>
        <h1 className="font-display text-3xl font-extrabold text-grape">{t('breakTitle')}</h1>
        <p className="my-3 text-lg">{t('breakDesc')}</p>
        <BigButton color="bg-mint shadow-[0_8px_20px_rgba(36,48,94,0.16)]" onClick={() => go('')}>{t('backHome')}</BigButton>
      </Card>
    )
  }
  if (!q) {
    const perfect = mistakes === 0 && done > 0
    return (
      <Card className="animate-pop text-center">
        <Confetti />
        <div className="text-7xl">{perfect ? '🏆' : '🎉'}</div>
        <h1 className="font-display text-4xl font-extrabold text-grape">{t('sessionDone')}</h1>
        <p className="my-2 text-4xl">{'⭐'.repeat(Math.max(1, Math.round((right / Math.max(1, done)) * 3)))}</p>
        <p className="mb-6 text-xl font-bold">{t('earned', { n: xp })}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <BigButton onClick={() => go(`play/${game}/${Date.now()}`)}>{t('playAgain')}</BigButton>
          <BigButton color="bg-mint shadow-[0_8px_20px_rgba(36,48,94,0.16)]" onClick={() => go('')}>{t('backHome')}</BigButton>
        </div>
      </Card>
    )
  }

  /** `verified` = false for self-reported pronunciation: it earns XP but stays out of the accuracy statistics. */
  const grade = (correct: boolean, text: string, verified = true) => {
    if (given !== null) return
    setGiven(text)
    setOk(correct)
    const spoken = q.kind === 'pronounce'
    // Side effect: keep it out of state updaters (StrictMode runs those twice).
    const { gained, unlocked, missions, weeklyWon } = answer(q.verb.id, correct,
      verified ? { kind: q.kind, tense: q.tense?.id, spoken } : { played: q.kind, spoken })
    setRewards({ missions, weeklyWon })
    setXp((x) => x + gained)
    setDone((d) => d + 1)
    setNewTense(unlocked)
    if (correct) {
      setRight((r) => r + 1)
      speak(q.spoken, target)
    } else {
      setMistakes((m) => m + 1)
      setQueue((qq) => [...qq, q.verb]) // gentle retry at the end, no penalty
    }
  }
  const next = () => {
    const rest = queue.slice(1)
    setQueue(rest)
    setGiven(null)
    setRound((r) => r + 1)
    if (!rest.length) {
      if (mistakes === 0) awardBadges('perfect')
      setQ(null)
      return
    }
    const r = [...recent, q.kind]
    setRecent(r)
    setQ(nextQ(rest[0], s, r))
  }
  const total = done + queue.length - (given !== null ? 1 : 0)
  const blank = (text: string) => <span className="inline-block min-w-16 border-b-4 border-dashed border-grape">{text || ' '}</span>
  const choiceKinds: Kind[] = ['picture', 'listen', 'conjugate', 'complete', 'timetravel', 'translate']

  const optionLabel = (opt: string) => {
    if (q.kind === 'listen') return <span className="text-6xl">{VERBS.find((v) => v.id === opt)!.emoji}</span>
    if (q.kind === 'picture') return verbLabel(opt, target)
    if (q.kind === 'translate') return verbLabel(opt, q.reverse ? native : target)
    if (q.kind === 'complete') return `…${opt}`
    return opt
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => go('play')} aria-label="✕" className="text-2xl font-bold text-ink/50">✕</button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full rounded-full bg-mint transition-all" style={{ width: `${(done / Math.max(1, total)) * 100}%` }} />
        </div>
        <span className="font-bold" aria-label={t('levelStars')}>{'★'.repeat(levelFor(learner(s), q.kind))}</span>
      </div>

      <Card className="text-center">
        {q.kind === 'picture' && (<>
          <h1 className="font-display text-2xl font-bold">{t('whichVerb')}</h1>
          <div className="animate-pop my-4 text-[7rem] leading-none" aria-hidden>{q.verb.emoji}</div>
        </>)}
        {q.kind === 'listen' && (<>
          <h1 className="font-display text-2xl font-bold">{t('whatDidYouHear')}</h1>
          <div className="my-4 flex justify-center"><SpeakButton big text={q.spoken} variant={target} label={t('hearAgain')} /></div>
        </>)}
        {q.kind === 'conjugate' && (<>
          <h1 className="font-display text-2xl font-bold">{t('chooseForm')}</h1>
          <div className="my-3 text-6xl" aria-hidden>{q.verb.emoji}</div>
          <p className="text-sm font-bold text-grape">{q.tense!.label} · {t(q.tense!.time)}</p>
          <p className="my-2 text-3xl font-bold">
            {subject(target, q.person!, '-', q.tense)} {blank(given !== null ? q.answer : '')}
            <span className="text-xl text-ink/50"> ({infinitive(q.verb, target)})</span>
          </p>
        </>)}
        {q.kind === 'complete' && (<>
          <h1 className="font-display text-2xl font-bold">{t('game_complete')}</h1>
          <div className="my-3 text-6xl" aria-hidden>{q.verb.emoji}</div>
          <p className="text-sm font-bold text-grape">{q.tense!.label} · {t(q.tense!.time)}</p>
          <p className="my-2 text-3xl font-bold">
            {subject(target, q.person!, q.form!.aux || q.stem!, q.tense)} {q.form!.aux && `${q.form!.aux} `}
            <span className="text-grape">{q.stem}</span>{blank(given !== null ? q.answer : '')}
            <span className="text-xl text-ink/50"> ({infinitive(q.verb, target)})</span>
          </p>
        </>)}
        {q.kind === 'timetravel' && (<>
          <h1 className="font-display text-2xl font-bold">{t('game_timetravel')}</h1>
          <div className="my-3 text-6xl" aria-hidden>{q.verb.emoji}</div>
          <div className="mx-auto max-w-sm space-y-2 text-left text-2xl">
            <p className="rounded-2xl bg-ink/5 p-3">
              <span className="block text-sm font-bold text-ink/50">{CUE_ICON[q.from!.cue]} {CUE_WORD[q.from!.cue]} · {t(CUE_NATIVE[q.from!.cue])}</span>
              <b>{q.from!.text}</b> <SpeakButton className="ml-1 align-middle" text={q.from!.text} variant={target} />
            </p>
            <p className="rounded-2xl bg-grape/10 p-3">
              <span className="block text-sm font-bold text-grape">{CUE_ICON[q.to!]} {CUE_WORD[q.to!]} · {t(CUE_NATIVE[q.to!])}</span>
              <b>{subject(target, q.person!, '-', q.tense)} {blank(given !== null ? q.answer : '')}</b>
            </p>
          </div>
        </>)}
        {q.kind === 'translate' && (<>
          <h1 className="font-display text-2xl font-bold">{t('translateTo')}</h1>
          <p className="my-4 flex items-center justify-center gap-3 font-display text-4xl font-extrabold text-grape">
            <span className="flag text-3xl">{VARIANTS[q.reverse ? target : native].flag}</span>
            {infinitive(q.verb, q.reverse ? target : native)}
            <SpeakButton text={infinitive(q.verb, q.reverse ? target : native)} variant={q.reverse ? target : native} />
          </p>
          <p className="text-2xl" aria-hidden>→ <span className="flag">{VARIANTS[q.reverse ? native : target].flag}</span> ?</p>
        </>)}
        {q.kind === 'build' && (<>
          <h1 className="font-display text-2xl font-bold">{t('game_build')}</h1>
          <p className="text-sm text-ink/60">{t('buildHint')}</p>
          <p className="my-3 flex items-center justify-center gap-2 text-lg">
            <span className="text-4xl" aria-hidden>{q.verb.emoji}</span>
            <span><span className="flag">{VARIANTS[native].flag}</span> {q.translation}</span>
            <SpeakButton text={q.answer} variant={target} />
          </p>
          <SentenceBuilder key={round} tiles={q.tiles!} answer={q.answer} variant={target} locked={given !== null} onDone={grade} />
        </>)}
        {q.kind === 'pronounce' && (<>
          <h1 className="font-display text-2xl font-bold">{t('game_pronounce_desc')}</h1>
          <div className="my-2 text-6xl" aria-hidden>{q.verb.emoji}</div>
          <PronounceChallenge key={round} phrase={q.answer} variant={target} locked={given !== null}
            allowRecord={s.controls.recording} allowCheck={s.controls.voiceCheck} onDone={grade} />
        </>)}
      </Card>

      {choiceKinds.includes(q.kind) && (
        <div className={`grid gap-3 ${q.kind === 'listen' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {q.options.map((opt) => {
            const state = given === null ? 'bg-white' : opt === q.answer ? 'bg-mint text-white animate-pop' : opt === given ? 'bg-coral text-white animate-shake' : 'bg-white opacity-50'
            return (
              <button key={opt} type="button" onClick={() => grade(opt === q.answer, opt)} disabled={given !== null}
                className={`rounded-2xl p-4 font-display text-2xl font-bold shadow-[0_4px_14px_rgba(36,48,94,0.08)] transition ${state}`}>
                {optionLabel(opt)}
              </button>
            )
          })}
        </div>
      )}

      {given !== null && (
        <Card className={`animate-pop ${ok ? 'bg-mint/15' : 'bg-sun/20'}`}>
          {(ok || newTense || rewards.missions.length > 0) && <Confetti />}
          {rewards.missions.map((id) => (
            <p key={id} className="mb-2 rounded-2xl bg-sun px-4 py-2 font-display text-lg font-extrabold">
              🎯 {t('missionDone', { n: MISSION_XP })} {t(MISSIONS.find((m) => m.id === id)!.title, { n: MISSIONS.find((m) => m.id === id)!.target })}
            </p>
          ))}
          {rewards.weeklyWon && <p className="mb-2 rounded-2xl bg-mint px-4 py-2 font-display text-lg font-extrabold text-white">🏅 {t('weeklyDone', { n: WEEKLY_XP })}</p>}
          {newTense && (
            <p className="mb-3 rounded-2xl bg-grape px-4 py-3 font-display text-xl font-extrabold text-white">
              🔓 {t('unlockedNow')} {conjugate(VERBS[0], target).find((x) => x.tense.id === newTense)?.tense.label}
            </p>
          )}
          <p className="font-display text-2xl font-extrabold">{ok ? `🎉 ${praise()}` : `🤗 ${q.kind === 'build' ? t('correctOrder') : t('tryAgain')}:`}</p>
          {!ok && (
            <div className="mt-2 space-y-1 text-xl">
              <p className="flex flex-wrap items-center gap-2">
                <b>{q.form ? <Said target={target} q={q} form={q.form} /> : q.kind === 'build' ? q.answer : <>{q.verb.emoji} {infinitive(q.verb, target)}</>}</b>
                <SpeakButton text={q.spoken} variant={target} />
              </p>
              <p className="text-base text-ink/70">= {infinitive(q.verb, native)}</p>
              {q.form?.kind === 'irregular' && <p className="text-base">🌀 {t('irregularHint')}</p>}
            </div>
          )}
          <BigButton className="mt-4 w-full" onClick={next}>{t('next')} →</BigButton>
        </Card>
      )}
    </div>
  )
}
