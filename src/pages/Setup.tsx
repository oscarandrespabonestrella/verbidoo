import { GastonSays, Logo } from '../components/gaston'
import { useState } from 'react'
import { go } from '../App'
import { Icon } from '../components/icons'
import { SpeakButton } from '../components/ui'
import { NATIVE_VARIANTS, STRINGS, TARGET_VARIANTS, VARIANTS, uiLangOf, type Variant } from '../data/i18n'
import { setLanguages, useProgress } from '../lib/progress'

/** "Español (Latinoamérica)" → ["Español", "Latinoamérica"], so the region sits on its own line and never overflows. */
const split = (name: string) => { const m = name.match(/^(.*?)\s*\((.*)\)$/); return m ? [m[1], m[2]] : [name, ''] }
const code = (v: Variant) => v === 'es-419' ? 'LA' : v.slice(3)

function Picker({ value, onPick, options, label }: { value: Variant | null; onPick: (v: Variant) => void; options: Variant[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-2.5">
      {options.map((v) => {
        const [lang, region] = split(VARIANTS[v].name), on = value === v
        return (
          <button key={v} type="button" role="radio" aria-checked={on} onClick={() => onPick(v)}
            className={`flex min-h-16 min-w-0 items-center gap-2 rounded-2xl border-2 px-2.5 py-2.5 text-left transition ${on ? 'border-grape bg-grape-soft' : 'border-line bg-white'}`}>
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${on ? 'bg-grape text-white' : 'bg-[#F1F2F8] text-[#3B4468]'}`}>
              <span className="flag text-xl leading-none" aria-hidden>{VARIANTS[v].flag}</span><span className="sr-only">{code(v)}</span>
            </span>
            <span className="min-w-0 text-[15px] font-bold leading-tight">{lang}{region && <small className="mut block text-[13px] font-semibold">{region}</small>}</span>
          </button>
        )
      })}
    </div>
  )
}

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
      <GastonSays size={96}>{nl ? str.hm_setupHello : 'Bonjour ! Hi! · ¡Hola! · Olá!'}</GastonSays>

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
          <Picker value={target} onPick={setTarget} options={TARGET_VARIANTS} label={str.iLearn} />
        </section>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-2">
        <button type="button" className="btn btn-primary w-full !min-h-14 !text-lg" disabled={!native}
          onClick={() => { setLanguages(native!, target); go('') }}>{str.start}<Icon name="arrowRight" /></button>
        {nl && <p className="mut m-0 text-center text-sm">{str.hm_changeLater}</p>}
        <a href="#/parent" className="mx-auto inline-flex min-h-12 items-center gap-2 rounded-full border border-line-strong bg-white px-5 text-[15px] font-extrabold text-ink">
          <Icon name="lock" size={18} />{str.grownUps}
        </a>
      </div>
    </div>
  )
}
