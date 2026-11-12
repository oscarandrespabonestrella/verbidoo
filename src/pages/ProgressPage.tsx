import { LanguagePill } from '../components/mascot'
import { Icon } from '../components/icons'
import { Avatar, ProgressBar } from '../components/ui'
import { VERBS } from '../data/verbs'
import { conjugate } from '../engine/conjugate'
import { accuracy } from '../lib/adaptive'
import { targetOf } from '../data/targets'
import { BADGES, character, charactersFor, facts, learnedCount, learner, levelOf, liveStreak, setCharacter, t, useProfiles, useProgress } from '../lib/progress'

import { nameOf } from './Settings'

/** "Tu progreso" tab (design M04): level, tenses, characters, badges. */
export function ProgressPage() {
  const s = useProgress()
  const idx = useProfiles()
  const target = s.target!
  const L = learner(s)
  const me = character(s), f = facts(s)
  const profile = idx.list.find((p) => p.id === idx.active)
  const name = profile ? nameOf(profile, idx.list.indexOf(profile)) : me.name
  const level = levelOf(s.xp)
  const tenseLabel = (id: string) => conjugate(VERBS[0], target).find((x) => x.tense.id === id)?.tense.label ?? id
  const path = targetOf(target).tensePath
  const unlocked = path.filter((id) => L.unlocked.includes(id))
  const locked = path.filter((id) => !L.unlocked.includes(id))
  const earned = BADGES.filter((b) => s.badges.includes(b.id)).length

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">{t('yourProgress')}</h1>
        <div className="flex gap-2">
          <LanguagePill />
          <a href="#/setup" className="pill" aria-label={t('languages')} title={t('languages')}><Icon name="globe" size={18} /><span className="hidden sm:inline">{t('languages')}</span></a>
          <a href="#/settings" className="pill lg:hidden" aria-label={t('grownUps')} title={t('grownUps')}><Icon name="settings" size={18} /><span className="hidden sm:inline">{t('grownUps')}</span></a>
        </div>
      </header>

      <section className="card flex min-w-0 items-center gap-4 p-[18px]">
        <Avatar emoji={profile?.avatar ?? me.emoji} size={64} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2"><b className="font-display text-xl font-bold">{name} · {t('level')} {level}</b><span className="mut shrink-0 font-bold">→ {level + 1}</span></div>
          <ProgressBar value={s.xp % 100} max={100} color="bg-mint" />
          <span className="mut text-sm font-semibold">{s.xp} XP · {liveStreak(s)} {t('streak')} · {learnedCount(s)}/{VERBS.length} {t('verbs').toLowerCase()}</span>
        </div>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-5">
        {(
          <section className="card flex min-w-0 flex-col gap-3.5 p-[18px]">
            <div className="flex items-center justify-between gap-2"><h2 className="h2">{t('tensesTitle')}</h2><span className="cap">{t('hm_of', { a: unlocked.length, b: path.length })}</span></div>
            {unlocked.map((id) => {
              const a = accuracy(L.stats[`tense:${id}`])
              return (
                <div key={id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between gap-2 text-[15px] font-bold"><span className="min-w-0" lang={target}>{tenseLabel(id)}</span>{a !== null && <span className="mut shrink-0">{Math.round(a * 100)}%</span>}</div>
                  <ProgressBar value={a ?? 0} max={1} color={a !== null && a >= 0.75 ? 'bg-mint' : 'bg-sun'} />
                </div>
              )
            })}
            {locked.length > 0 && (
              <div className="flex flex-col gap-2 rounded-2xl bg-soft p-3">
                <span className="flex items-center gap-1.5 text-sm font-extrabold text-muted"><Icon name="lock" size={16} />{t('hm_toDiscover')}</span>
                <div className="flex flex-wrap gap-1.5" lang={target} title={t('lockedTense')}>
                  {locked.map((id) => <span key={id} className="inline-flex min-h-9 max-w-full items-center rounded-full border-[1.5px] border-line-strong bg-white px-3 text-sm font-bold text-muted">{tenseLabel(id)}</span>)}
                </div>
              </div>
            )}
          </section>
        )}

        <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
          <section className="card flex min-w-0 flex-col gap-3.5 p-[18px]">
            <h2 className="h2">{t('characters')}</h2>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-3">
              {charactersFor(s).map((c) => {
                const open = c.unlocked(f), on = me.id === c.id
                return (
                  <li key={c.id} className="min-w-0">
                    <button type="button" disabled={!open} onClick={() => setCharacter(c.id)} aria-pressed={on}
                      title={open ? c.name : t(c.hint!, { n: c.n ?? '' })}
                      className="flex w-full flex-col items-center gap-1.5 text-center text-[13px] font-extrabold disabled:cursor-not-allowed">
                      <span className={`emoji flex size-16 items-center justify-center rounded-[20px] border-2 text-4xl ${on ? 'border-grape bg-grape-soft' : open ? 'border-transparent bg-soft' : 'border-dashed border-[#D3D7E6] bg-[#F1F2F8] grayscale'}`}>
                        {open ? c.emoji : <Icon name="lock" className="text-subtle" />}
                      </span>
                      <span className={`leading-tight ${open ? '' : 'text-subtle'}`}>{open ? c.name : t(c.hint!, { n: c.n ?? '' })}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="card flex min-w-0 flex-col gap-3.5 p-[18px]">
            <div className="flex items-center justify-between gap-2"><h2 className="h2">{t('badges')}</h2><span className="cap">{t('hm_of', { a: earned, b: BADGES.length })}</span></div>
            <ul className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4">
              {BADGES.map((b) => {
                const has = s.badges.includes(b.id)
                return (
                  <li key={b.id} className={`flex flex-col items-center gap-1.5 text-center text-xs font-bold leading-tight ${has ? '' : 'text-subtle'}`}>
                    <span className={`emoji flex size-14 items-center justify-center rounded-full text-[28px] ${has ? 'bg-[#FFF4D6]' : 'border-2 border-dashed border-[#D3D7E6] bg-[#F1F2F8] opacity-60 grayscale'}`}>{b.emoji}</span>
                    {t(b.label)}
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
