import { useState } from 'react'
import { go } from '../App'
import { Icon } from '../components/icons'
import { Logo, MascotSays } from '../components/mascot'
import { SpeakButton } from '../components/ui'
import { NATIVE_VARIANTS, STRINGS, uiLangOf, type Variant } from '../data/i18n'
import { setLanguages, useProgress } from '../lib/progress'
import { LanguageCards, Picker } from './Learn'

/** Language setup (design M02). */
export function Setup() {
  const s = useProgress()
  const [native, setNative] = useState<Variant | null>(s.native)
  const [target, setTarget] = useState<Variant>(s.target ?? 'fr-FR')
  const nl = native ? uiLangOf(native) : null
  const str = STRINGS[nl ?? 'en']

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-5 px-4 pb-7 pt-6">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" aria-hidden>
          <span className="h-2 flex-1 rounded-full bg-grape" /><span className={`h-2 flex-1 rounded-full ${native ? 'bg-grape' : 'bg-line'}`} />
        </div>
        <span className="cap">{str.hm_step.replace('{a}', native ? '2' : '1').replace('{b}', '2')}</span>
      </div>

      <Logo size={32} className="self-center" />
      <MascotSays size={96}>{nl ? str.hm_setupHello : 'Bonjour ! Hallo! · Hi! · ¡Hola! · Olá!'}</MascotSays>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="min-w-0 font-display text-2xl font-bold">{nl ? str.iSpeak : 'I speak… · Yo hablo… · Eu falo…'}</h1>
          {native && <SpeakButton text={str.iSpeak} variant={native} />}
        </div>
        <Picker value={native} onPick={setNative} options={NATIVE_VARIANTS} label={str.iSpeak} />
      </section>

      {native && (
        <section className="animate-pop flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="min-w-0 font-display text-2xl font-bold">{str.iLearn}</h2>
            <SpeakButton text={str.iLearn} variant={native} />
          </div>
          <LanguageCards value={target} onPick={setTarget} ui={nl!} />
        </section>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-2">
        <button type="button" className="btn btn-primary w-full !min-h-14 !text-lg" disabled={!native}
          onClick={() => { setLanguages(native!, target); go('') }}>{str.start}<Icon name="arrowRight" /></button>
        {nl && <p className="mut m-0 text-center text-sm">{str.hm_changeLater}</p>}
        <a href="#/settings" className="mx-auto inline-flex min-h-12 items-center gap-2 rounded-full border border-line-strong bg-white px-5 text-[15px] font-extrabold text-ink">
          <Icon name="settings" size={18} />{str.grownUps}
        </a>
      </div>
    </div>
  )
}
