import { useState } from 'react'
import { go } from '../App'
import { SpeakButton } from '../components/ui'
import { CATEGORIES } from '../data/i18n'
import { VERBS } from '../data/verbs'
import { infinitive, verbKind } from '../engine/conjugate'
import { isLearned, t, useProgress, verbProgress } from '../lib/progress'

export function Library({ cat }: { cat?: string }) {
  const s = useProgress()
  const target = s.target!, native = s.native!
  const [q, setQ] = useState('')
  const filter = cat || 'all'
  const unlocked = new Set(CATEGORIES.filter((c) => s.xp >= c.xp).map((c) => c.id))
  const needle = q.trim().toLowerCase()

  const list = VERBS.filter((v) =>
    (filter === 'all' ? unlocked.has(v.cat) : filter === 'irregular' ? unlocked.has(v.cat) && verbKind(v, target) === 'irregular' : v.cat === filter) &&
    (!needle || [infinitive(v, target), infinitive(v, native)].some((w) => w.toLowerCase().includes(needle))),
  )
  const chips = [{ id: 'all', label: t('all'), emoji: '✨' }, { id: 'irregular', label: t('irregular'), emoji: '🌀' },
    ...CATEGORIES.filter((c) => unlocked.has(c.id)).map((c) => ({ id: c.id, label: t(`cat_${c.id}`), emoji: c.emoji }))]

  return (
    <div className="space-y-4">
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} aria-label={t('search')}
        className="w-full rounded-2xl border-4 border-transparent bg-white px-4 py-3 text-lg font-bold shadow-sm outline-none focus:border-grape" />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {chips.map((c) => (
          <button key={c.id} type="button" onClick={() => go(c.id === 'all' ? 'verbs' : `verbs/${c.id}`)} aria-pressed={filter === c.id}
            className={`shrink-0 rounded-full px-4 py-2 font-bold ${filter === c.id ? 'bg-grape text-white' : 'bg-white'}`}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="py-12 text-center text-xl font-bold text-ink/60">🔍 {t('noResults')}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {list.map((v) => (
            <li key={v.id}>
              <div role="link" tabIndex={0} onClick={() => go(`verb/${v.id}`)} onKeyDown={(e) => e.key === 'Enter' && go(`verb/${v.id}`)}
                className="relative cursor-pointer rounded-3xl bg-white p-4 text-center shadow-[0_12px_32px_rgba(36,48,94,0.06)] ring-1 ring-[#E9EBF5] transition hover:-translate-y-1">
                <span className="absolute left-3 top-3 text-sm">{isLearned(s, v.id) ? '⭐' : verbProgress(s, v.id) ? '' : '🆕'}</span>
                <div className="text-6xl">{v.emoji}</div>
                <div className="font-display text-2xl font-extrabold text-grape">{infinitive(v, target)}</div>
                <div className="mb-2 text-sm font-bold text-ink/60">{infinitive(v, native)}</div>
                <SpeakButton text={infinitive(v, target)} variant={target} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
