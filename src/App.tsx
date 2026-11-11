import { useEffect, useSyncExternalStore } from 'react'
import { initCloud, useCloud } from './lib/cloud'
import { liveStreak, t, useProfiles, useProgress } from './lib/progress'
import { Dashboard } from './pages/Dashboard'
import { Library } from './pages/Library'
import { Parent } from './pages/Parent'
import { Practice } from './pages/Practice'
import { Profiles } from './pages/Profiles'
import { Setup } from './pages/Setup'
import { VerbPage } from './pages/VerbPage'

// ponytail: 5 routes, hash-based — no router dependency. Add react-router if routes need loaders/nesting.
const subscribe = (l: () => void) => (addEventListener('hashchange', l), () => removeEventListener('hashchange', l))
const useHash = () => useSyncExternalStore(subscribe, () => location.hash.slice(2))
export const go = (path: string) => { location.hash = `/${path}` }

export default function App() {
  const s = useProgress()
  const idx = useProfiles()
  const cloud = useCloud()
  useEffect(() => { void initCloud() }, [])
  useEffect(() => { if (cloud.recovery) go('parent') }, [cloud.recovery])
  const [page, arg, extra] = useHash().split('/')
  useEffect(() => { scrollTo(0, 0) }, [page, arg])
  useEffect(() => { if (s.native) document.documentElement.lang = s.native }, [s.native])

  // These two work before a child has picked languages: a new child, or a parent setting things up.
  if (page === 'profiles') return <Profiles />
  if (page === 'parent') return <div className="mx-auto max-w-3xl px-4 py-6"><Parent /></div>
  if (!s.native || !s.target || page === 'setup') return <Setup />

  const nav = [
    { path: '', icon: '🏠', label: t('home') },
    { path: 'verbs', icon: '📚', label: t('verbs') },
    { path: 'play', icon: '🎮', label: t('play') },
  ]
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 pb-28 pt-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <a href="#/" className="font-display text-2xl font-bold text-grape">Verb Adventure</a>
        <div className="flex flex-wrap items-center gap-1.5 font-bold">
          <span className="inline-flex h-10 items-center rounded-full border border-[#E9EBF5] bg-white px-3 font-extrabold" title={t('streak')}>🔥 {liveStreak(s)}</span>
          <span className="inline-flex h-10 items-center rounded-full border border-[#E9EBF5] bg-white px-3 font-extrabold" title={t('xp')}>⭐ {s.xp}</span>
          <a href="#/setup" className="inline-flex h-10 items-center rounded-full border border-[#E9EBF5] bg-white px-3 font-extrabold" aria-label={t('languages')}>🌍</a>
          <a href="#/profiles" className="inline-flex h-10 items-center rounded-full border border-[#E9EBF5] bg-white px-3 font-extrabold" aria-label={t('switchPlayer')}>{idx.list.find((p) => p.id === idx.active)?.avatar}</a>
          <a href="#/parent" className="inline-flex h-10 items-center rounded-full border border-[#E9EBF5] bg-white px-3 font-extrabold" aria-label={t('grownUps')} title={t('grownUps')}>⚙️</a>
        </div>
      </header>
      <main>
        {page === 'verb' ? <VerbPage id={arg} /> : page === 'verbs' ? <Library cat={arg} /> : page === 'play' ? <Practice key={arg + extra} game={arg} focus={extra} /> : <Dashboard />}
      </main>
      <nav className="fixed inset-x-0 bottom-4 z-40 px-3">
        <ul className="mx-auto grid max-w-3xl grid-cols-3 gap-1 rounded-[28px] border border-[#E9EBF5] bg-white/90 p-2 shadow-[0_12px_32px_rgba(36,48,94,0.12)] backdrop-blur">
          {nav.map((n) => {
            const active = (page ?? '') === n.path || (n.path === 'verbs' && page === 'verb')
            return (
              <li key={n.path}>
                <a href={`#/${n.path}`} aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center gap-1 rounded-2xl py-1 text-xs font-extrabold ${active ? 'text-grape' : 'text-[#697293]'}`}>
                  <span className={`flex h-8 w-14 items-center justify-center rounded-full text-xl ${active ? 'bg-grape shadow-[0_6px_14px_rgba(88,101,242,0.35)]' : ''}`}>{n.icon}</span>{n.label}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
