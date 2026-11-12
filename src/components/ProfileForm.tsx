import { useState, type ReactNode } from 'react'
import { t, type Profile } from '../lib/progress'
import { Icon } from './icons'
import { Avatar } from './ui'

export const AVATARS = ['🦊', '🐼', '🐸', '🐯', '🐙', '🦁', '🐨', '🐰']

/** First character nobody uses yet, so a new child starts with an avatar of their own. */
export const freeAvatar = (list: Profile[]) => AVATARS.find((a) => !list.some((p) => p.avatar === a)) ?? AVATARS[0]

/**
 * Nickname + avatar form, used both to add a child and to edit one (profile picker and settings).
 * It only collects the values: the caller decides what saving means through `onSubmit`.
 * After a submit the fields go back to `initial`, so an "add" form is ready for the next child.
 */
export function ProfileForm({ title, initial, adding, preview, onSubmit, onCancel, className = '' }: {
  title: ReactNode
  initial: { name: string; avatar: string }
  adding?: boolean          // "Add" button with a plus; otherwise "Save" with a check
  preview?: string          // background of a large avatar preview above the fields; none when omitted
  onSubmit: (name: string, avatar: string) => void
  onCancel?: () => void     // shows a Cancel button
  className?: string
}) {
  const [name, setName] = useState(initial.name)
  const [avatar, setAvatar] = useState(initial.avatar)
  return (
    <form className={`flex flex-col gap-2.5 ${className}`}
      onSubmit={(e) => { e.preventDefault(); onSubmit(name, avatar); setName(initial.name); setAvatar(initial.avatar) }}>
      {preview && <span className="self-center"><Avatar emoji={avatar} size={64} bg={preview} /></span>}
      <label className="flex flex-col gap-1.5 text-[15px] font-extrabold">{title}
        <input autoFocus={!!preview} value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder={t('nickname')}
          className="h-[52px] w-full min-w-0 rounded-[14px] border-[1.5px] border-line-strong bg-white px-4 text-base font-semibold text-ink" />
      </label>
      <div role="radiogroup" aria-label={t('characters')} className="grid grid-cols-[repeat(4,minmax(0,1fr))] gap-2">
        {AVATARS.map((a) => (
          <button key={a} type="button" role="radio" aria-checked={a === avatar} onClick={() => setAvatar(a)}
            className={`emoji flex h-14 items-center justify-center rounded-[14px] border-2 text-3xl ${a === avatar ? 'border-grape bg-grape-soft' : 'border-transparent bg-soft'}`}>{a}</button>
        ))}
      </div>
      <div className={onCancel ? 'grid grid-cols-2 gap-2.5' : 'flex'}>
        {onCancel && <button type="button" className="btn btn-ghost w-full" onClick={onCancel}>{t('cancel')}</button>}
        <button type="submit" className="btn btn-primary w-full"><Icon name={adding ? 'plus' : 'check'} />{adding ? t('add') : t('save')}</button>
      </div>
    </form>
  )
}
