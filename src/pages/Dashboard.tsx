import { go } from '../App'
import { BigButton, Card, Mascot, ProgressBar, VoiceWarning } from '../components/ui'
import { CATEGORIES, VARIANTS } from '../data/i18n'
import { VERBS } from '../data/verbs'
import { conjugate, infinitive } from '../engine/conjugate'
import { TENSE_PATH, accuracy, recommendations, trickyVerbs, type Rec } from '../lib/adaptive'
import type { Kind } from '../lib/games'
import { BADGES, DAILY_GOAL, character, dailyOf, facts, learnedCount, learner, levelOf, liveStreak, openVerbs, recommend, setCharacter, t, todayXp, useProgress, weeklyOf } from '../lib/progress'
import { CHARACTERS, MISSION_XP, WEEKLY_XP, dailyMissions, isDone, weeklyChallenge } from '../lib/rewards'

const ALL_KINDS: Kind[] = ['picture', 'listen', 'conjugate', 'complete', 'timetravel', 'translate', 'build', 'pronounce']

export function Dashboard() {
  const s = useProgress()
  const target = s.target!, native = s.native!
  const open = openVerbs(s, CATEGORIES)
  const next = recommend(s, open)[0]
  const L = learner(s)
  const tenseLabel = (id: string) => conjugate(VERBS[0], target).find((x) => x.tense.id === id)?.tense.label ?? id
  const recText = (r: Rec) => t(r.title, {
    ...r.vars,
    ...(r.tense ? { tense: tenseLabel(r.tense) } : {}),
    ...(r.kind ? { game: t(`game_${r.kind}`) } : {}),
    ...(r.verb ? { verb: infinitive(r.verb, target) } : {}),
  })
  const tricky = trickyVerbs(L, open)
  const me = character(s), f = facts(s)
  const daily = dailyOf(s), weekly = weeklyOf(s), challenge = weeklyChallenge(weekly.week)
  const xpToday = todayXp(s)
  const stats = [
    { icon: '🔥', value: liveStreak(s), label: t('streak') },
    { icon: '📚', value: `${learnedCount(s)}/${VERBS.length}`, label: t('learned') },
    { icon: '🏅', value: levelOf(s.xp), label: t('level') },
  ]

  return (
    <div className="space-y-5">
      <Mascot message={t('hello', { name: me.name })} variant={native} emoji={me.emoji} />
      <VoiceWarning variant={target} />

      <div className="grid grid-cols-3 gap-3">
        {stats.map((x) => (
          <Card key={x.label} className="!p-3 text-center">
            <div className="text-3xl">{x.icon}</div>
            <div className="font-display text-2xl font-extrabold">{x.value}</div>
            <div className="text-xs font-bold text-ink/60">{x.label}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-2 flex justify-between font-bold"><span>🎯 {t('todayGoal')}</span><span>{Math.min(xpToday, DAILY_GOAL)}/{DAILY_GOAL} XP</span></div>
        <ProgressBar value={xpToday} max={DAILY_GOAL} />
        <p className="mt-1 text-sm text-ink/60">{t('level')} {levelOf(s.xp)} → {levelOf(s.xp) + 1}</p>
        <ProgressBar value={s.xp % 100} max={100} color="bg-sun" />
      </Card>

      <BigButton className="flex w-full items-center justify-center gap-3" onClick={() => go(`verb/${next.id}`)}>
        <span className="text-4xl">{next.emoji}</span> {t('continue')}: {infinitive(next, target)}
      </BigButton>

      <button type="button" onClick={() => go('play/mixed')}
        className="flex w-full items-center gap-4 rounded-3xl border-[1.5px] border-[#FFE3A3] bg-[#FFF4D6] p-5 text-left text-ink">
        <span className="text-5xl">🏆</span>
        <span><span className="block font-display text-2xl font-extrabold">{t('dailyChallenge')}</span>{t('dailyChallengeDesc')}</span>
      </button>

      <Card>
        <h2 className="mb-3 font-display text-2xl font-bold">🎯 {t('missions')}</h2>
        <ul className="space-y-3">
          {dailyMissions(daily.day).map((m) => {
            const done = daily.missions.includes(m.id) || isDone(m, daily)
            return (
              <li key={m.id}>
                <div className="mb-1 flex justify-between font-bold">
                  <span>{done ? '✅' : '⬜'} {t(m.title, { n: m.target })}</span>
                  <span className="text-sm text-ink/60">{Math.min(m.value(daily), m.target)}/{m.target} · +{MISSION_XP} XP</span>
                </div>
                <ProgressBar value={m.value(daily)} max={m.target} color={done ? 'bg-mint' : 'bg-sun'} />
              </li>
            )
          })}
        </ul>
        <div className="mt-4 rounded-2xl bg-grape/10 p-3">
          <div className="mb-1 flex justify-between font-bold">
            <span>{weekly.done ? '🏅' : '📅'} {t('weeklyTitle')}: {t(challenge.title, { n: challenge.target })}</span>
            <span className="text-sm text-ink/60">+{WEEKLY_XP} XP</span>
          </div>
          <ProgressBar value={challenge.value(weekly)} max={challenge.target} color={weekly.done ? 'bg-mint' : 'bg-grape'} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-2xl font-bold">✨ {t('forYou')}</h2>
        <ul className="space-y-2">
          {recommendations(L, open, ALL_KINDS).map((r) => (
            <li key={r.title + (r.tense ?? r.kind ?? r.verb?.id ?? '')}>
              <button type="button" onClick={() => go(r.path)}
                className="flex w-full items-center gap-3 rounded-2xl bg-ink/5 p-3 text-left font-bold transition hover:bg-grape/10">
                <span className="text-3xl">{r.verb?.emoji ?? r.icon}</span>{recText(r)}<span className="ml-auto text-grape">→</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {tricky.length > 0 && (
        <Card>
          <h2 className="mb-3 font-display text-2xl font-bold">🧗 {t('trickyVerbs')}</h2>
          <div className="flex flex-wrap gap-2">
            {tricky.map(({ verb, wrongPct }) => (
              <button key={verb.id} type="button" onClick={() => go(`verb/${verb.id}`)}
                className="flex items-center gap-2 rounded-full bg-coral/10 px-3 py-2 font-bold">
                <span className="text-2xl">{verb.emoji}</span>{infinitive(verb, target)}
                <span className="text-xs text-coral">{100 - wrongPct}%</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {target.startsWith('fr') && (
        <Card>
          <h2 className="mb-3 font-display text-2xl font-bold">🧭 {t('tensesTitle')}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {TENSE_PATH.map((id) => {
              const open = L.unlocked.includes(id), a = accuracy(L.stats[`tense:${id}`])
              return (
                <li key={id} className={`rounded-xl p-2 ${open ? 'bg-ink/5' : 'opacity-50'}`} title={open ? undefined : t('lockedTense')}>
                  <div className="flex justify-between text-sm font-bold">
                    <span>{open ? '' : '🔒 '}{tenseLabel(id)}</span>
                    {open && a !== null && <span className="text-ink/60">{Math.round(a * 100)}%</span>}
                  </div>
                  {open && <ProgressBar value={a ?? 0} max={1} color={a !== null && a >= 0.75 ? 'bg-mint' : 'bg-sun'} />}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <section>
        <h2 className="mb-3 font-display text-2xl font-bold"><span className="flag">{VARIANTS[target].flag}</span> {t('categories')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORIES.map((c) => {
            const locked = s.xp < c.xp
            return (
              <button key={c.id} type="button" disabled={locked} onClick={() => go(`verbs/${c.id}`)}
                className="rounded-3xl bg-white p-4 text-center shadow-[0_12px_32px_rgba(36,48,94,0.06)] ring-1 ring-[#E9EBF5] transition hover:-translate-y-1 disabled:opacity-60 disabled:hover:translate-y-0">
                <div className="text-4xl">{locked ? '🔒' : c.emoji}</div>
                <div className="font-bold">{t(`cat_${c.id}`)}</div>
                {locked && <div className="text-xs text-ink/60">{t('locked', { n: c.xp })}</div>}
              </button>
            )
          })}
        </div>
      </section>

      <Card>
        <h2 className="mb-3 font-display text-2xl font-bold">{t('characters')}</h2>
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {CHARACTERS.map((c) => {
            const open = c.unlocked(f)
            return (
              <li key={c.id}>
                <button type="button" disabled={!open} onClick={() => setCharacter(c.id)} aria-pressed={me.id === c.id}
                  title={open ? c.name : t(c.hint!, { n: c.n ?? '' })}
                  className={`w-full rounded-2xl p-2 text-center ${me.id === c.id ? 'bg-grape/20 ring-2 ring-grape' : 'bg-ink/5'} ${open ? '' : 'opacity-40 grayscale'}`}>
                  <div className="text-4xl">{open ? c.emoji : '🔒'}</div>
                  <div className="text-xs font-bold">{open ? c.name : t(c.hint!, { n: c.n ?? '' })}</div>
                </button>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-2xl font-bold">{t('badges')}</h2>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {BADGES.map((b) => {
            const has = s.badges.includes(b.id)
            return (
              <li key={b.id} className={`text-center ${has ? '' : 'opacity-30 grayscale'}`}>
                <div className="text-4xl">{b.emoji}</div>
                <div className="text-xs font-bold">{t(b.label)}</div>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
