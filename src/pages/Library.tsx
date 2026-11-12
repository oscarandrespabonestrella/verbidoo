import { useState } from 'react'
import { go } from '../App'
import { CAT_STYLE, Icon } from '../components/icons'
import { SpeakButton, familyLabel } from '../components/ui'
import { CATEGORIES } from '../data/i18n'
import { VERBS } from '../data/verbs'
import { infinitive, verbKind } from '../engine/conjugate'
import { stemFamily, type StemFamily } from '../engine/french'
import { learnedCount, t, useProgress, verbProgress } from '../lib/progress'

const FAMILIES: StemFamily[] = [1, 2, 3, 'special']

/** Verb library (design M05): search, filter chips, verb worlds, picture cards with mastery dots. */
export function Library({ cat }: { cat?: string }) {
  const s = useProgress()
  const target = s.target!, native = s.native!
  const [q, setQ] = useState('')
  const filter = cat || 'all'
  const unlocked = new Set(CATEGORIES.filter((c) => s.xp >= c.xp).map((c) => c.id))
  const needle = q.trim().toLowerCase()

  // "stems-2" = verbs with 2 spoken stems in the present (French).
  const fam = FAMILIES.find((f) => `stems-${f}` === filter)
  const list = VERBS.filter((v) =>
    (filter === 'all' ? unlocked.has(v.cat)
      : filter === 'irregular' ? unlocked.has(v.cat) && verbKind(v, target) === 'irregular'
      : fam ? unlocked.has(v.cat) && stemFamily(v.fr) === fam
      : v.cat === filter) &&
    (!needle || [infinitive(v, target), infinitive(v, native)].some((w) => w.toLowerCase().includes(needle))),
  )
  const pick = (id: string) => go(id === 'all' ? 'verbs' : `verbs/${id}`)

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h1 className="page-title">{t('verbs')}</h1>
          <span className="mut text-sm font-extrabold">{t('hm_learnedOf', { a: learnedCount(s), b: VERBS.length })}</span>
        </div>
        <label className="relative block">
          <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} aria-label={t('search')}
            className="h-[52px] w-full rounded-2xl border-[1.5px] border-line-strong bg-white pl-12 pr-4 text-base font-semibold text-ink outline-none placeholder:text-subtle focus:border-grape" />
        </label>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={t('all')}>
          {[{ id: 'all', label: t('all') }, { id: 'irregular', label: t('irregular') }, ...(target.startsWith('fr') ? FAMILIES.map((f) => ({ id: `stems-${f}`, label: familyLabel(f) })) : [])].map((c) => (
            <button key={c.id} type="button" onClick={() => pick(c.id)} aria-pressed={filter === c.id} className="chip shrink-0 font-extrabold">{c.label}</button>
          ))}
        </div>
      </header>

      <section className="flex flex-col gap-2.5">
        <span className="cap">{t('categories')}</span>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {CATEGORIES.map((c) => {
            const st = CAT_STYLE[c.id], locked = !unlocked.has(c.id), on = filter === c.id
            return (
              <button key={c.id} type="button" disabled={locked} onClick={() => pick(c.id)} aria-pressed={on}
                title={locked ? t('locked', { n: c.xp }) : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border-[1.5px] py-1 pl-1.5 pr-3.5 text-sm font-extrabold disabled:opacity-55 ${on ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink'}`}>
                <span className="flex size-8 items-center justify-center rounded-full" style={{ background: st.bg, color: st.fg }}>
                  <Icon name={locked ? 'lock' : st.icon} size={18} />
                </span>
                {t(`cat_${c.id}`)}
              </button>
            )
          })}
        </div>
      </section>

      {list.length === 0 ? (
        <p className="flex flex-col items-center gap-2 py-12 text-center text-lg font-bold text-muted"><Icon name="search" size={32} />{t('noResults')}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {list.map((v) => {
            const box = Math.min(3, verbProgress(s, v.id)?.box ?? 0)
            const st = CAT_STYLE[v.cat] ?? CAT_STYLE.core
            return (
              <li key={v.id} className="min-w-0">
                <div role="link" tabIndex={0} onClick={() => go(`verb/${v.id}`)} onKeyDown={(e) => e.key === 'Enter' && go(`verb/${v.id}`)}
                  className="flex h-full cursor-pointer flex-col gap-2.5 rounded-[20px] border border-line bg-white p-3 shadow-[0_4px_14px_rgba(36,48,94,0.05)] transition hover:-translate-y-0.5">
                  <div className="emoji flex h-24 items-center justify-center rounded-[14px] text-6xl" style={{ background: st.bg }} aria-hidden>{v.emoji}</div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <b className="block font-display text-[21px] font-bold leading-tight text-grape-dark" lang={target}>{infinitive(v, target)}</b>
                      <span className="mut block text-sm font-semibold">{infinitive(v, native)}</span>
                    </div>
                    <SpeakButton text={infinitive(v, target)} variant={target} className="!size-10" />
                  </div>
                  <span className={`inline-flex gap-[3px] ${box >= 2 ? 'text-mint' : 'text-[#C2410C]'}`} role="img" aria-label={`${box}/3`}>
                    {[1, 2, 3].map((i) => <i key={i} className={`size-[7px] rounded-full bg-current ${i <= box ? '' : 'opacity-25'}`} />)}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
