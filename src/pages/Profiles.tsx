import { useState } from 'react'
import { go } from '../App'
import { Logo, Mascot, Scene, useTarget } from '../components/mascot'
import { Icon } from '../components/icons'
import { ProfileForm, freeAvatar } from '../components/ProfileForm'
import { Avatar, SyncButton } from '../components/ui'
import { addProfile, editProfile, nameOf, switchProfile, t, useProfiles } from '../lib/progress'

const TINTS = ['#FFF1E3', '#E6EDFE', '#E3F6EE', '#E3F4FD', '#FFF4D6', '#FFEDEA']
const tint = (i: number) => TINTS[i % TINTS.length]
const NEW = 'new' // `editing` value while adding a child

/** "Bonjour ! Who plays?" (design V2-Welcome) — the active child's mascot waves its flag; children pick their own avatar.
 *  Children are added and edited (nickname + avatar) right here; removing a child is in settings. */
export function Profiles() {
  const idx = useProfiles()
  const c = useTarget()
  const [editing, setEditing] = useState<string | null>(null) // profile id, NEW, or null = the picker
  const done = () => setEditing(null)
  const editIdx = idx.list.findIndex((p) => p.id === editing)
  const edited = idx.list[editIdx]

  let body
  if (editing === NEW) body = (
    <ProfileForm title={t('addChild')} adding preview={tint(idx.list.length)} initial={{ name: '', avatar: freeAvatar(idx.list) }}
      onSubmit={(name, avatar) => { addProfile(name, avatar); done() }} onCancel={done} />
  )
  else if (edited) body = (
    <ProfileForm key={edited.id} title={`${t('edit')} · ${nameOf(edited, editIdx)}`} preview={tint(editIdx)} initial={edited}
      onSubmit={(name, avatar) => { editProfile(edited.id, name, avatar); done() }} onCancel={done} />
  )
  else body = <>
    <div className="text-center">
      <h1 lang={c.lang} className="m-0 font-display text-[28px] font-bold tracking-wide">{c.words.hello}</h1>
      <p className="mut m-0 mt-0.5 text-base font-semibold">{t('whoIsPlaying')}</p>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {idx.list.map((p, i) => (
        <div key={p.id} className="relative min-w-0">
          <button type="button" onClick={() => { switchProfile(p.id); go('') }}
            className={`flex w-full min-w-0 flex-col items-center gap-2 rounded-[22px] border-2 bg-gradient-to-b from-white to-[#F1F5FC] px-2 py-3.5 shadow-[0_8px_20px_rgba(20,32,94,0.12)] transition hover:-translate-y-0.5 ${p.id === idx.active ? 'border-grape' : 'border-white'}`}>
            <Avatar emoji={p.avatar} size={64} bg={tint(i)} />
            <b className="max-w-full truncate font-display text-[19px] font-semibold">{nameOf(p, i)}</b>
          </button>
          <button type="button" aria-label={`${t('edit')} · ${nameOf(p, i)}`} title={t('edit')} onClick={() => setEditing(p.id)}
            className="absolute right-1 top-1 flex size-11 items-center justify-center rounded-full text-grape hover:bg-white/80">
            <Icon name="pencil" size={18} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => setEditing(NEW)}
        className="flex min-h-[120px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-[22px] border-2 border-dashed border-[#C9D4EA] px-2 text-center text-sm font-extrabold text-muted">
        <Icon name="plus" />{t('hm_addPlayer')}
      </button>
    </div>
    <div className="flex flex-wrap items-center justify-center">
      <a href="#/settings" className="inline-flex min-h-11 items-center gap-1.5 px-4 text-sm font-bold text-ink">
        <Icon name="settings" size={18} />{t('grownUps')}
      </a>
      <SyncButton compact />
    </div>
  </>

  return (
    <div className="scene relative min-h-dvh overflow-hidden">
      <Scene className="!h-[62%]" />
      <div className="relative mx-auto flex min-h-dvh max-w-xl flex-col items-center px-5 pb-7 pt-8">
        <Logo size={44} />
        <Mascot mood="guide" size={220} alt className="gaston-shadow animate-bob mt-6 sm:mt-10" />
        <section className="card mt-auto flex w-full flex-col gap-3.5 px-[18px] pb-[18px] pt-[22px]">{body}</section>
      </div>
    </div>
  )
}
