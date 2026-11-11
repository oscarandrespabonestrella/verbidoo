import { useState } from 'react'
import { go } from '../App'
import { BigButton, Card, SpeakButton } from '../components/ui'
import { NATIVE_VARIANTS, STRINGS, TARGET_VARIANTS, VARIANTS, uiLangOf, type Variant } from '../data/i18n'
import { setLanguages, useProgress } from '../lib/progress'

function Picker({ value, onPick, options }: { value: Variant | null; onPick: (v: Variant) => void; options: Variant[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((v) => (
        <button key={v} type="button" onClick={() => onPick(v)} aria-pressed={value === v}
          className={`flex items-center gap-3 min-h-16 rounded-2xl border-2 p-3 text-left font-bold transition ${value === v ? 'border-grape bg-[#ECEEFE]' : 'border-[#E9EBF5] bg-white'}`}>
          <span className="text-4xl"><span className="flag">{VARIANTS[v].flag}</span></span>{VARIANTS[v].name}
        </button>
      ))}
    </div>
  )
}

export function Setup() {
  const s = useProgress()
  const [native, setNative] = useState<Variant | null>(s.native)
  const [target, setTarget] = useState<Variant>(s.target ?? 'fr-FR')
  const nl = native ? uiLangOf(native) : null
  const str = STRINGS[nl ?? 'en']

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-6">
      <h1 className="text-center font-display text-4xl font-bold text-grape"><span className="animate-bob inline-block">🦉</span> Verb Adventure</h1>
      <Card>
        <div className="mb-3 flex items-center gap-3">
          <h2 className="font-display text-2xl font-bold">{nl ? str.iSpeak : 'I speak… · Yo hablo… · Eu falo…'}</h2>
          {native && <SpeakButton text={str.iSpeak} variant={native} />}
        </div>
        <Picker value={native} onPick={setNative} options={NATIVE_VARIANTS} />
      </Card>
      {native && (
        <Card className="animate-pop">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="font-display text-2xl font-bold">{str.iLearn}</h2>
            <SpeakButton text={str.iLearn} variant={native} />
          </div>
          <Picker value={target} onPick={setTarget} options={TARGET_VARIANTS} />
        </Card>
      )}
      <BigButton className="w-full" disabled={!native}
        onClick={() => { setLanguages(native!, target); go('') }}>{str.start}</BigButton>
      <p className="text-center">
        <a href="#/parent" className="inline-block rounded-full border border-[#E1E4F0] bg-white px-5 py-3 font-extrabold text-ink">⚙️ {str.grownUps}</a>
      </p>
    </div>
  )
}
