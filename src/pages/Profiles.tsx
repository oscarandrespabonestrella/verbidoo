import { go } from '../App'
import { Gaston, Logo, ParisScene } from '../components/gaston'
import { Icon } from '../components/icons'
import { Avatar } from '../components/ui'
import { switchProfile, t, useProfiles } from '../lib/progress'
import { nameOf } from './Parent'

const TINTS = ['#FFF1E3', '#E6EDFE', '#E3F6EE', '#E3F4FD', '#FFF4D6', '#FFEDEA']

/** "Bonjour ! Who plays?" (design V2-Welcome) — Gaston waves the flag over Paris; children pick their own avatar. Adding or removing children is in the parent area. */
export function Profiles() {
  const idx = useProfiles()
  return (
    <div className="scene relative min-h-dvh overflow-hidden">
      <ParisScene className="!h-[62%]" />
      <div className="relative mx-auto flex min-h-dvh max-w-xl flex-col items-center px-5 pb-7 pt-8">
        <Logo size={44} />
        <Gaston pose="guide" size={220} alt="Gaston" className="gaston-shadow animate-bob mt-6 sm:mt-10" />

        <section className="card mt-auto flex w-full flex-col gap-3.5 px-[18px] pb-[18px] pt-[22px]">
          <div className="text-center">
            <h1 lang="fr" className="m-0 font-display text-[28px] font-bold tracking-wide">BONJOUR !</h1>
            <p className="mut m-0 mt-0.5 text-base font-semibold">{t('whoIsPlaying')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {idx.list.map((p, i) => (
              <button key={p.id} type="button" onClick={() => { switchProfile(p.id); go('') }}
                className={`flex min-w-0 flex-col items-center gap-2 rounded-[22px] border-2 bg-gradient-to-b from-white to-[#F1F5FC] px-2 py-3.5 shadow-[0_8px_20px_rgba(20,32,94,0.12)] transition hover:-translate-y-0.5 ${p.id === idx.active ? 'border-grape' : 'border-white'}`}>
                <Avatar emoji={p.avatar} size={64} bg={TINTS[i % TINTS.length]} />
                <b className="max-w-full truncate font-display text-[19px] font-semibold">{nameOf(p, i)}</b>
              </button>
            ))}
            <a href="#/parent" className="flex min-h-[120px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-[22px] border-2 border-dashed border-[#C9D4EA] px-2 text-center text-sm font-extrabold text-muted">
              <Icon name="plus" />{t('hm_addPlayer')}
            </a>
          </div>
          <a href="#/parent" className="inline-flex min-h-11 items-center gap-1.5 self-center px-4 text-sm font-bold text-ink">
            <Icon name="lock" size={18} />{t('grownUps')}
          </a>
        </section>
      </div>
    </div>
  )
}
