import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { go } from '../App'
import { PronounceChallenge, SentenceBuilder } from '../components/games'
import { Gaston } from '../components/gaston'
import { Icon, Star, type IconName } from '../components/icons'
import { Confetti, FormView, SpeakButton, StreakPill, VoiceWarning, XpPill } from '../components/ui'
import { CATEGORIES, PERSONS, VARIANTS, langOf, type Variant } from '../data/i18n'
import { VERBS, type Verb } from '../data/verbs'
import { conjugate, formText, infinitive, pronounFor, type Form, type Tense } from '../engine/conjugate'
import { buildSession, levelFor, pickKind, tenseWeight, type Learner } from '../lib/adaptive'
import { CUE_WORD, makeQ, verbLabel, type Kind, type Q, type TimeCue } from '../lib/games'
import { answer, awardBadges, learner, liveStreak, openVerbs, overLimit, praise, t, useProgress, type AnswerResult, type State } from '../lib/progress'
import { MISSIONS, MISSION_XP, WEEKLY_XP } from '../lib/rewards'
import { canSpeak, speak } from '../lib/speech'

/** Game cards (design M08): solid color, white icon tile, tag colors for the in-game chip. */
const GAMES: { id: Kind | 'mixed'; icon: IconName; color: string; tagBg: string; tagFg: string }[] = [
  { id: 'picture', icon: 'picture', color: '#2B5CE6', tagBg: '#E6EDFE', tagFg: '#1E46C4' },
  { id: 'listen', icon: 'ear', color: '#0C76B8', tagBg: '#E3F4FD', tagFg: '#0C5F94' },
  { id: 'conjugate', icon: 'puzzle', color: '#C2255C', tagBg: '#FCE7EF', tagFg: '#A61E4D' },
  { id: 'complete', icon: 'pencil', color: '#C2410C', tagBg: '#FFEEDD', tagFg: '#9A3412' },
  { id: 'timetravel', icon: 'history', color: '#0B7285', tagBg: '#E0F4F7', tagFg: '#08515F' },
  { id: 'translate', icon: 'globe', color: '#0A875C', tagBg: '#E3F6EE', tagFg: '#06603F' },
  { id: 'build', icon: 'blocks', color: '#7B2FBE', tagBg: '#F3E8FC', tagFg: '#5E1F96' },
  { id: 'pronounce', icon: 'mic', color: '#3B4BC8', tagBg: '#E8EAFB', tagFg: '#2A3699' },
  { id: 'mixed', icon: 'shuffle', color: '#14205E', tagBg: '#E6EDFE', tagFg: '#14205E' },
]
const ROUNDS = 10
const NEEDS_VOICE: string[] = ['listen'] // pronounce still works without TTS: read, record, self-check
const CUE_NATIVE = { past: 'yesterday', now: 'now', future: 'tomorrow' } as const
const CUES: TimeCue[] = ['past', 'now', 'future']

const Stars = ({ n, size = 14, off = 'rgba(255,255,255,.35)' }: { n: number; size?: number; off?: string }) => (
  <span className="flex gap-0.5" role="img" aria-label={`${n}/3 ${t('levelStars')}`}>
    {[1, 2, 3].map((i) => (
      <svg key={i} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill={i <= n ? '#FDBE3C' : off}>
        <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" />
      </svg>
    ))}
  </span>
)

function Picker() {
  const s = useProgress()
  const target = s.target!
  const L = learner(s)
  const mixed = GAMES.find((g) => g.id === 'mixed')!
  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-2 py-1">
        <h1 className="page-title">{t('chooseGame')}</h1>
        <div className="flex gap-2">
          <StreakPill n={liveStreak(s)} label={t('streak')} />
          <XpPill n={s.xp} label={t('xp')} />
        </div>
      </header>
      {!canSpeak(target) && <VoiceWarning variant={target} />}

      <button type="button" onClick={() => go('play/mixed')}
        className="flex min-w-0 items-center gap-3.5 rounded-3xl p-[18px] text-left text-white shadow-[0_8px_20px_rgba(36,48,94,0.16)] transition hover:-translate-y-0.5"
        style={{ background: mixed.color }}>
        <span className="flex size-[60px] shrink-0 items-center justify-center rounded-[18px] bg-sun text-[#3D2800]"><Icon name="shuffle" size={30} /></span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="cap !text-[#FFD27A]">{t('gm_recommended')}</span>
          <b className="font-display text-[22px] font-bold leading-tight">{t('game_mixed')}</b>
          <span className="text-sm opacity-90">{t('dailyChallengeDesc')}</span>
        </span>
        <Icon name="chevron" />
      </button>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {GAMES.filter((g) => g.id !== 'mixed').map((g) => (
          <button key={g.id} type="button" disabled={NEEDS_VOICE.includes(g.id) && !canSpeak(target)} onClick={() => go(`play/${g.id}`)}
            className="flex min-h-[156px] min-w-0 flex-col gap-1.5 rounded-[20px] p-3.5 text-left text-white shadow-[0_8px_20px_rgba(36,48,94,0.16)] transition hover:-translate-y-0.5 disabled:opacity-40"
            style={{ background: g.color }}>
            <span className="flex size-11 items-center justify-center rounded-xl bg-white/20"><Icon name={g.icon} /></span>
            <b className="mt-auto font-display text-lg font-semibold leading-tight">{t(`game_${g.id}`)}</b>
            <small className="text-[13px] font-semibold leading-snug opacity-95">{t(`game_${g.id as Kind}_desc`)}</small>
            <Stars n={levelFor(L, g.id as Kind)} />
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

/** Answer button: white card, green when right, red when picked wrong, dimmed otherwise. */
const OPT = 'flex min-h-[62px] w-full min-w-0 items-center justify-center gap-2.5 rounded-[28px] border-2 px-4 py-3 text-center font-display text-[20px] font-semibold leading-snug shadow-[0_8px_20px_rgba(20,32,94,0.12),inset_0_-3px_0_#DEE6F3] transition'
const optState = (given: string | null, opt: string, answer: string) =>
  given === null ? 'border-white bg-gradient-to-b from-white to-[#F2F6FC] text-ink hover:border-grape'
    : opt === answer ? 'animate-pop border-mint bg-mint-soft text-mint-dark'
    : opt === given ? 'animate-shake border-[#D93A3A] bg-[#FDECEC] text-[#A12424]'
    : 'border-white bg-white text-ink opacity-45'

const Banner = ({ icon, className, children }: { icon: IconName; className: string; children: ReactNode }) => (
  <p className={`flex items-center gap-2 rounded-2xl px-3.5 py-2.5 font-display text-base font-bold ${className}`}><Icon name={icon} size={20} /><span className="min-w-0">{children}</span></p>
)

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
  const [gain, setGain] = useState(0) // XP of the last answer, for the feedback panel
  const [marks, setMarks] = useState<boolean[]>([]) // right/wrong per answered question, for the segmented progress bar
  const [mistakes, setMistakes] = useState(0)
  const [round, setRound] = useState(0) // remount key for the interactive widgets, one per question

  useEffect(() => { if (q?.kind === 'listen') speak(q.spoken, target) }, [q, target])

  if (!valid) return <Picker />
  const fullScreen = 'flex min-h-[calc(100dvh-3rem)] flex-col'
  // Parent's daily limit: finish the current feedback, then a friendly stop (progress is already saved).
  if (overLimit(s) && given === null) {
    return (
      <div className={`${fullScreen} animate-pop items-center gap-5 overflow-hidden rounded-[28px] bg-[#14205E] px-5 pb-7 pt-12 text-center text-white`}>
        <Gaston pose="face" size={150} className="gaston-shadow" />
        <div className="flex flex-col items-center gap-2">
          <h1 className="m-0 font-display text-[34px] font-bold leading-tight">{t('breakTitle')}</h1>
          <p className="m-0 max-w-[300px] text-lg leading-relaxed text-[#DDE1FF]">{t('breakDesc')}</p>
        </div>
        <div className="mt-2 grid w-full max-w-md grid-cols-2 gap-2.5 text-left">
          <div className="flex min-w-0 flex-col gap-0.5 rounded-[18px] bg-[#2F3A73] p-4"><b className="font-display text-[26px] font-bold text-[#FFD27A]">{s.xp} XP</b><span className="text-sm font-bold text-[#DDE1FF]">{t('gm_total')}</span></div>
          <div className="flex min-w-0 flex-col gap-0.5 rounded-[18px] bg-[#2F3A73] p-4"><b className="font-display text-[26px] font-bold text-[#FFB199]">{liveStreak(s)}</b><span className="text-sm font-bold text-[#DDE1FF]">{t('streak')}</span></div>
        </div>
        <button type="button" onClick={() => go('')} className="btn btn-ghost mt-auto w-full max-w-md">{t('backHome')}</button>
      </div>
    )
  }
  if (!q) {
    const stars = Math.max(1, Math.round((right / Math.max(1, done)) * 3))
    return (
      <div className={`${fullScreen} animate-pop gap-5 pt-2`}>
        <Confetti />
        <div className="mt-4 flex flex-col items-center gap-2.5">
          <Gaston pose="celebrate" size={230} alt="Gaston" className="gaston-shadow animate-pop" />
          <h1 lang="fr" className="m-0 text-center font-display text-[36px] font-bold leading-none tracking-wide">BRAVO !</h1>
          <p className="m-0 text-center font-display text-[22px] font-semibold">{t('sessionDone')}</p>
          <Stars n={stars} size={44} off="#E1E4F0" />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { v: `+${xp}`, l: 'XP', c: '#8A6514' },
            { v: `${right}/${done}`, l: t('gm_correct'), c: '#06603F' },
            { v: liveStreak(s), l: t('streak'), c: '#D42733' },
          ].map((x) => (
            <div key={x.l} className="flex min-w-0 flex-col items-center gap-0.5 rounded-[18px] bg-white px-2 py-3.5 text-center shadow-[0_8px_20px_rgba(20,32,94,0.1)]">
              <b className="font-display text-2xl font-bold" style={{ color: x.c }}>{x.v}</b>
              <span className="mut text-[13px] font-bold leading-tight">{x.l}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button type="button" className="btn btn-primary sm:min-w-56" onClick={() => go(`play/${game}/${Date.now()}`)}>{t('playAgain')}</button>
          <button type="button" className="btn btn-ghost sm:min-w-56" onClick={() => go('')}>{t('backHome')}</button>
        </div>
      </div>
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
    setGain(gained)
    setMarks((m) => [...m, correct])
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
  const meta = GAMES.find((g) => g.id === q.kind)!
  const level = levelFor(learner(s), q.kind)
  let inARow = 0
  for (let i = marks.length - 1; i >= 0 && marks[i]; i--) inARow++
  const blank = (text: string) => <span className="inline-block min-w-16 border-b-[3px] border-dashed border-grape text-mint-dark">{text || ' '}</span>
  const choiceKinds: Kind[] = ['picture', 'listen', 'conjugate', 'complete', 'timetravel', 'translate']
  const heading: Record<Kind, string> = {
    picture: t('whichVerb'), listen: t('whatDidYouHear'), conjugate: t('chooseForm'), complete: t('game_complete_desc'),
    timetravel: t('game_timetravel_desc'), translate: t('translateTo'), build: t('game_build_desc'), pronounce: t('game_pronounce_desc'),
  }

  const optionLabel = (opt: string) => {
    if (q.kind === 'listen') return <span className="emoji text-5xl leading-none">{VERBS.find((v) => v.id === opt)!.emoji}</span>
    if (q.kind === 'picture') return verbLabel(opt, target)
    if (q.kind === 'translate') return verbLabel(opt, q.reverse ? native : target)
    if (q.kind === 'complete') return `…${opt}`
    return opt
  }
  const optGrid = q.kind === 'listen' || q.kind === 'picture' ? 'grid-cols-2'
    : q.kind === 'conjugate' ? 'grid-cols-1 sm:grid-cols-2'
    : 'grid-cols-[repeat(auto-fit,minmax(min(140px,100%),1fr))]'
  const tenseCap = q.tense && <span className="mut text-[13px] font-extrabold">{t(q.tense.time)} · {q.tense.label}</span>

  return (
    <div className={`${fullScreen} gap-4`}>
      {/* Top bar: leave, one segment per question (green right / red wrong), difficulty stars. */}
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={() => go('play')} aria-label={t('gm_quit')} title={t('gm_quit')}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-ink hover:bg-white"><Icon name="close" /></button>
        <div className="flex min-w-0 flex-1 gap-1" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={Math.max(1, total)}>
          {Array.from({ length: Math.max(1, total) }, (_, i) => (
            <span key={i} className="h-2.5 min-w-0 flex-1 rounded-full" style={{ background: i < marks.length ? (marks[i] ? '#3FAE6A' : '#EF3340') : i === marks.length ? '#2B5CE6' : 'rgba(255,255,255,.75)' }} />
          ))}
        </div>
        <span className="flex shrink-0 items-center gap-1 text-[15px] font-extrabold" aria-label={`${level} ${t('levelStars')}`}><Star size={20} />{level}</span>
      </div>

      {/* Gaston asks (design V2-Question). */}
      <div className="flex min-w-0 items-end gap-1.5">
        <Gaston pose="face" size={84} />
        <div className="bubble mb-3 flex min-w-0 flex-col items-start gap-1 rounded-bl-md">
          <span className="inline-flex h-6 items-center rounded-full px-2.5 text-xs font-extrabold" style={{ background: meta.tagBg, color: meta.tagFg }}>{t(`game_${q.kind}`)}</span>
          <h1 className="m-0 font-display text-[22px] font-bold leading-tight sm:text-2xl">{heading[q.kind]}</h1>
        </div>
      </div>

      {q.kind === 'picture' && (
        <div className="card flex h-[220px] items-center justify-center !rounded-[28px] !border-[#CDEBFB] !bg-sky-soft">
          <span className="emoji animate-pop text-[8rem] leading-none" aria-hidden>{q.verb.emoji}</span>
        </div>
      )}
      {q.kind === 'listen' && (
        <div className="card flex flex-col items-center gap-3 !rounded-[28px] p-6">
          <SpeakButton big text={q.spoken} variant={target} label={t('hearAgain')} />
          <span className="mut text-sm font-bold">{t('hearAgain')}</span>
        </div>
      )}
      {(q.kind === 'conjugate' || q.kind === 'complete') && (
        <div className="card flex flex-col items-center gap-2 !rounded-[28px] p-4 text-center">
          <span className="emoji text-5xl leading-none" aria-hidden>{q.verb.emoji}</span>
          {tenseCap}
          <p lang="fr" className="m-0 text-2xl font-bold leading-snug">
            {q.kind === 'conjugate'
              ? <>{subject(target, q.person!, '-', q.tense)} {blank(given !== null ? q.answer : '')}</>
              : <>{subject(target, q.person!, q.form!.aux || q.stem!, q.tense)} {q.form!.aux && `${q.form!.aux} `}<span className="text-grape-dark">{q.stem}</span>{blank(given !== null ? q.answer : '')}</>}
            <span className="mut text-lg font-semibold"> ({infinitive(q.verb, target)})</span>
          </p>
        </div>
      )}
      {q.kind === 'timetravel' && (
        <div className="card flex flex-col gap-3.5 !rounded-[28px] px-4 py-[18px]">
          <div className="relative flex" aria-hidden>
            <span className="absolute inset-x-[16%] top-[7px] h-1 rounded-full bg-line-strong" />
            {CUES.map((c) => {
              const on = c === q.to, from = c === q.from!.cue
              return (
                <span key={c} className={`relative flex flex-1 flex-col items-center gap-1.5 text-xs font-extrabold ${on ? 'text-[#08515F]' : 'text-subtle'}`}>
                  <i className="size-[18px] rounded-full border-[3px] border-white" style={{ background: on ? '#0B7285' : from ? '#fff' : '#E1E4F0', boxShadow: on || from ? '0 0 0 2px #0B7285' : undefined }} />
                  {t(CUE_NATIVE[c])}
                </span>
              )
            })}
          </div>
          <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-soft px-3.5 py-3">
            <div className="min-w-0 flex-1">
              <span className="cap !text-muted">{t(CUE_NATIVE[q.from!.cue])} · {CUE_WORD[q.from!.cue].toLowerCase()}</span>
              <p lang="fr" className="m-0 mt-0.5 text-[22px] font-bold leading-snug">{q.from!.text}</p>
            </div>
            <SpeakButton text={q.from!.text} variant={target} />
          </div>
          <div className="flex justify-center text-[#0B7285]" aria-hidden><Icon name="arrowDown" /></div>
          <div className="rounded-2xl border-2 border-dashed border-[#0B7285] bg-[#E0F4F7] px-3.5 py-3">
            <span className="cap !text-[#08515F]">{t(CUE_NATIVE[q.to!])} · {CUE_WORD[q.to!].toLowerCase()}</span>
            <p lang="fr" className="m-0 mt-0.5 text-[22px] font-bold leading-snug">{subject(target, q.person!, '-', q.tense)} {blank(given !== null ? q.answer : '')}</p>
          </div>
        </div>
      )}
      {q.kind === 'translate' && (
        <div className="card flex flex-col items-center gap-3 !rounded-[28px] p-5 text-center">
          <p className="m-0 flex flex-wrap items-center justify-center gap-3 font-display text-4xl font-bold text-grape-dark">
            <span className="flag text-3xl">{VARIANTS[q.reverse ? target : native].flag}</span>
            {infinitive(q.verb, q.reverse ? target : native)}
            <SpeakButton text={infinitive(q.verb, q.reverse ? target : native)} variant={q.reverse ? target : native} />
          </p>
          <p className="mut m-0 flex items-center gap-2 text-xl font-bold" aria-hidden><Icon name="arrowDown" /><span className="flag">{VARIANTS[q.reverse ? native : target].flag}</span> ?</p>
        </div>
      )}
      {q.kind === 'build' && (<>
        <div className="card flex min-w-0 items-center gap-3 p-4">
          <span className="emoji shrink-0 text-4xl leading-none" aria-hidden>{q.verb.emoji}</span>
          <span className="flex h-7 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF4D6] text-[13px] font-extrabold uppercase text-[#8A6514]">{native.slice(0, 2)}</span>
          <p className="m-0 min-w-0 flex-1 text-[19px] font-bold leading-snug">{q.translation}</p>
          <SpeakButton text={q.answer} variant={target} />
        </div>
        <SentenceBuilder key={round} tiles={q.tiles!} answer={q.answer} variant={target} locked={given !== null} onDone={grade} />
        <p className="mut m-0 text-center text-sm font-bold">{t('buildHint')}</p>
      </>)}
      {q.kind === 'pronounce' && (
        <PronounceChallenge key={round} phrase={q.answer} variant={target} locked={given !== null}
          allowRecord={s.controls.recording} allowCheck={s.controls.voiceCheck} onDone={grade} />
      )}

      {choiceKinds.includes(q.kind) && (
        <div lang={q.kind === 'translate' && q.reverse ? undefined : 'fr'} className={`grid gap-2.5 ${optGrid}`}>
          {q.options.map((opt) => (
            <button key={opt} type="button" onClick={() => grade(opt === q.answer, opt)} disabled={given !== null}
              className={`${OPT} ${optState(given, opt, q.answer)}`}>
              {given !== null && opt === q.answer && <Icon name="check" strokeWidth={3} />}
              {given !== null && opt === given && opt !== q.answer && <Icon name="close" strokeWidth={3} />}
              <span className="min-w-0">{optionLabel(opt)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Feedback sheet, anchored to the bottom like the design's G02 / G05. */}
      {given !== null && (
        <section role="status" className={`animate-rise sticky bottom-0 z-30 -mx-4 -mb-8 mt-auto flex flex-col gap-3 rounded-t-[28px] border-[3px] px-4 pb-[max(28px,env(safe-area-inset-bottom))] pt-4 shadow-[0_-8px_32px_rgba(20,32,94,0.14)] sm:mx-0 sm:mb-0 sm:rounded-b-[28px] ${ok ? 'border-[#F4CF6A] bg-gradient-to-b from-[#FFFDF4] to-[#FFF1C9]' : 'border-white bg-gradient-to-b from-[#F4F6FA] to-[#E2E7F0]'}`}>
          {(ok || newTense || rewards.missions.length > 0) && <Confetti />}
          {rewards.missions.map((id) => {
            const m = MISSIONS.find((x) => x.id === id)!
            return <Banner key={id} icon="target" className="bg-sun text-[#3D2800]">{t('missionDone', { n: MISSION_XP })} {t(m.title, { n: m.target })}</Banner>
          })}
          {rewards.weeklyWon && <Banner icon="trophy" className="bg-mint text-white">{t('weeklyDone', { n: WEEKLY_XP })}</Banner>}
          {newTense && (
            <Banner icon="unlock" className="bg-grape text-white">{t('unlockedNow')} {conjugate(VERBS[0], target).find((x) => x.tense.id === newTense)?.tense.label}</Banner>
          )}
          {ok ? (<>
            {/* Gaston celebrates (design V2-Correct): French headline, praise in the child's language. */}
            <div className="flex min-w-0 items-center gap-2">
              <Gaston pose="celebrate" size={112} alt="Gaston" className="-my-2 animate-pop" />
              <div className="min-w-0 flex-1">
                <b lang="fr" className="block font-display text-[30px] font-bold leading-none tracking-wide">EXCELLENT !</b>
                <span className="font-display text-xl font-semibold">{praise()}</span>
              </div>
            </div>
            <div className="flex min-w-0 items-center justify-center gap-2.5 text-base font-semibold">
              <b lang="fr">{infinitive(q.verb, target)}</b><span aria-hidden>=</span><span>{infinitive(q.verb, native)}</span>
              <SpeakButton text={q.spoken} variant={target} className="!size-10" />
            </div>
            <span className="self-center rounded-full bg-white px-3 py-1.5 text-sm font-bold text-[#7A5200]">
              +{gain} XP{inARow > 1 ? ` · ${t('gm_inARow', { n: inARow })}` : ''}
            </span>
            <button type="button" className="btn btn-primary w-full" onClick={next}>{t('next')}<Icon name="arrowRight" /></button>
          </>) : (<>
            {/* Gaston under the rain (design V2-Wrong): encouragement, then the right answer. */}
            <div className="flex min-w-0 items-center gap-2">
              <Gaston pose="sad" size={112} alt="Gaston" className="-my-2" />
              <div className="min-w-0 flex-1">
                <b lang="fr" className="block font-display text-[30px] font-bold leading-none tracking-wide">DOMMAGE…</b>
                <span className="font-display text-xl font-semibold">{t('almost')}</span>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-3 rounded-[18px] bg-white py-3 pl-4 pr-3">
              <div className="min-w-0 flex-1">
                <span className="cap !text-muted">{q.kind === 'build' ? t('correctOrder') : t('answerWas')}</span>
                <p lang="fr" className="m-0 text-[19px] font-bold leading-snug">
                  {q.form ? <Said target={target} q={q} form={q.form} /> : q.kind === 'build' ? q.answer : <><span className="emoji">{q.verb.emoji}</span> {infinitive(q.verb, target)}</>}
                </p>
                <span className="mut text-sm font-semibold">= {infinitive(q.verb, native)}</span>
              </div>
              <SpeakButton text={q.spoken} variant={target} />
            </div>
            {q.form?.kind === 'irregular' && <p className="m-0 text-sm font-semibold text-[#7A2020]">{t('irregularHint')}</p>}
            <button type="button" className="btn btn-primary w-full" onClick={next}>{t('next')}<Icon name="arrowRight" /></button>
          </>)}
        </section>
      )}
    </div>
  )
}
