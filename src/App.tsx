import { useEffect, useSyncExternalStore } from 'react'
import { Logo } from './components/gaston'
import { Avatar } from './components/ui'
import { Icon, type IconName } from './components/icons'
import { initCloud, useCloud } from './lib/cloud'
import { levelOf, t, useProfiles, useProgress } from './lib/progress'
import { Dashboard } from './pages/Dashboard'
import { Library } from './pages/Library'
import { Settings, nameOf } from './pages/Settings'
import { Practice } from './pages/Practice'
import { Profiles } from './pages/Profiles'
import { ProgressPage } from './pages/ProgressPage'
import { Setup } from './pages/Setup'
import { VerbPage } from './pages/VerbPage'

// ponytail: a handful of routes, hash-based — no router dependency. Add react-router if routes need loaders/nesting.
const subscribe = (l: () => void) => (addEventListener('hashchange', l), () => removeEventListener('hashchange', l))
const useHash = () => useSyncExternalStore(subscribe, () => location.hash.slice(2))
export const go = (path: string) => { location.hash = `/${path}` }

const NAV: { path: string; icon: IconName; label: 'home' | 'verbs' | 'play' | 'progress'; match: string[] }[] = [
  { path: '', icon: 'home', label: 'home', match: [''] },
  { path: 'verbs', icon: 'book', label: 'verbs', match: ['verbs', 'verb'] },
  { path: 'play', icon: 'gamepad', label: 'play', match: ['play'] },
  { path: 'progress', icon: 'trophy', label: 'progress', match: ['progress'] },
]

export default function App() {
  const s = useProgress()
  const idx = useProfiles()
  const cloud = useCloud()
  useEffect(() => { void initCloud() }, [])
  useEffect(() => { if (cloud.recovery) go('settings') }, [cloud.recovery])
  const [page = '', arg, extra] = useHash().split('/')
  useEffect(() => { scrollTo(0, 0) }, [page, arg])
  useEffect(() => { if (s.native) document.documentElement.lang = s.native }, [s.native])

  // These two work before a child has picked languages: a new child, or someone opening settings.
  if (page === 'profiles') return <Profiles />
  if (page === 'settings') return <div className="mx-auto max-w-3xl px-4 py-6"><Settings /></div>
  if (!s.native || !s.target || page === 'setup') return <Setup />

  // A running game is full-screen (no tabs), like the design's game screens.
  const inGame = page === 'play' && !!arg
  const me = idx.list.find((p) => p.id === idx.active)
  const meIndex = idx.list.findIndex((p) => p.id === idx.active)
  const isOn = (m: string[]) => m.includes(page)

  return (
    <div className="min-h-dvh lg:flex">
      {/* Laptop sidebar (design L01–L04). */}
      {!inGame && (
        <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-white bg-white/70 px-4 py-6 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-dvh">
          <a href="#/" aria-label="Verbi" className="flex items-center px-1"><Logo size={30} /></a>
          <nav aria-label={t('home')} className="flex flex-col gap-1">
            {NAV.map((n) => (
              <a key={n.path} href={`#/${n.path}`} aria-current={isOn(n.match) ? 'page' : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-full px-4 font-display text-base font-semibold ${isOn(n.match) ? 'bg-grape text-white shadow-[0_8px_18px_rgba(43,92,230,0.3)]' : 'text-ink hover:bg-white'}`}>
                <Icon name={n.icon} />{t(n.label)}
              </a>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-2">
            <a href="#/setup" className="flex min-h-11 items-center gap-3 rounded-[14px] px-3.5 text-sm font-extrabold text-muted hover:bg-white"><Icon name="globe" />{t('languages')}</a>
            <a href="#/settings" className="flex min-h-11 items-center gap-3 rounded-[14px] px-3.5 text-sm font-extrabold text-muted hover:bg-white"><Icon name="settings" />{t('grownUps')}</a>
            <div className="flex items-center gap-2.5 rounded-[18px] bg-white/80 p-2.5 shadow-[0_4px_12px_rgba(20,32,94,0.08)]">
              <Avatar emoji={me?.avatar} size={40} />
              <div className="min-w-0 flex-1"><b className="block truncate text-[15px]">{me ? nameOf(me, meIndex) : ''}</b><span className="mut text-[13px] font-bold">{t('level')} {levelOf(s.xp)}</span></div>
              <a href="#/profiles" className="text-[13px] font-extrabold text-grape">{t('switchShort')}</a>
            </div>
          </div>
        </aside>
      )}

      <main className={`mx-auto w-full min-w-0 ${inGame ? 'max-w-2xl px-4 pb-8 pt-4' : 'max-w-[1120px] px-4 pb-32 pt-3 sm:px-6 lg:px-12 lg:pb-12 lg:pt-8'}`}>
        {page === 'verb' ? <VerbPage id={arg} />
          : page === 'verbs' ? <Library cat={arg} />
          : page === 'play' ? <Practice key={arg + extra} game={arg} focus={extra} />
          : page === 'progress' ? <ProgressPage />
          : <Dashboard />}
      </main>

      {/* Phone/tablet floating tab bar (design M03–M08). */}
      {!inGame && (
        <nav aria-label={t('home')} className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
          <ul className="mx-auto grid max-w-lg grid-cols-4 rounded-[28px] border-[1.5px] border-white bg-white/85 p-2 shadow-[0_16px_40px_rgba(20,32,94,0.16)] backdrop-blur-xl">
            {NAV.map((n) => {
              const on = isOn(n.match)
              return (
                <li key={n.path} className="min-w-0">
                  <a href={`#/${n.path}`} aria-current={on ? 'page' : undefined}
                    className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[14px] font-display text-xs font-semibold tracking-wide ${on ? 'text-grape-dark' : 'text-subtle'}`}>
                    <span className={`flex h-[30px] w-14 max-w-full items-center justify-center rounded-full ${on ? 'bg-grape text-white shadow-[0_6px_14px_rgba(43,92,230,0.35)]' : ''}`}><Icon name={n.icon} /></span>
                    <span className="max-w-full truncate">{t(n.label)}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </div>
  )
}
