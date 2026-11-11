import { go } from '../App'
import { switchProfile, t, useProfiles } from '../lib/progress'
import { nameOf } from './Parent'

/** "Who is playing?" — children pick their own avatar. Adding or removing children is in the parent area. */
export function Profiles() {
  const idx = useProfiles()
  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8 text-center">
      <h1 className="font-display text-4xl font-bold text-ink">{t('whoIsPlaying')}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {idx.list.map((p, i) => (
          <button key={p.id} type="button" onClick={() => { switchProfile(p.id); go('') }}
            className={`rounded-3xl border-2 bg-white p-5 shadow-[0_4px_14px_rgba(36,48,94,0.08)] transition hover:-translate-y-1 ${p.id === idx.active ? 'border-grape' : 'border-[#E9EBF5]'}`}>
            <div className="text-6xl">{p.avatar}</div>
            <div className="mt-2 font-display text-xl font-bold">{nameOf(p, i)}</div>
          </button>
        ))}
      </div>
      <button type="button" onClick={() => go('parent')} className="rounded-full border border-[#E1E4F0] bg-white px-5 py-3 font-extrabold text-ink">⚙️ {t('grownUps')}</button>
    </div>
  )
}
