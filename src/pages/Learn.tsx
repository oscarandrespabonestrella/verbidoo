import { useState } from 'react'
import { go } from '../App'
import { Icon } from '../components/icons'
import { Logo, Mascot } from '../components/mascot'
import { STRINGS, VARIANTS, langOf, type StringKey, type TargetLang, type UiLang, type Variant } from '../data/i18n'
import { MASCOTS } from '../data/mascots'
import { TARGETS, TARGET_LANGS } from '../data/targets'
import { learnedIn, setLanguages, t, useProgress, xpIn } from '../lib/progress'

/** "Español (Latinoamérica)" → ["Español", "Latinoamérica"], so the region sits on its own line and never overflows. */
const split = (name: string) => { const m = name.match(/^(.*?)\s*\((.*)\)$/); return m ? [m[1], m[2]] : [name, ''] }
const code = (v: Variant) => v === 'es-419' ? 'LA' : v.slice(3)

/** Radio grid of language variants (flag + name + region). */
export function Picker({ value, onPick, options, label }: { value: Variant | null; onPick: (v: Variant) => void; options: Variant[]; label: string }) {
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

const TINT: Record<TargetLang, string> = { fr: 'from-[#EEF3FF] to-[#DCE6FD]', nl: 'from-[#FFF4E8] to-[#FFE2C6]' }

/**
 * One big card per learning language (its mascot, flag, name and this child's progress in it),
 * then the regional variants of the chosen one. The last variant used per language is remembered.
 */
export function LanguageCards({ value, onPick, ui }: { value: Variant; onPick: (v: Variant) => void; ui?: UiLang }) {
  const s = useProgress()
  // During setup the child's language is picked but not saved yet: `ui` shows the cards in it straight away.
  const tr = (k: StringKey, vars: Record<string, string> = {}) =>
    ui ? Object.entries(vars).reduce((x, [a, b]) => x.replace(`{${a}}`, b), STRINGS[ui][k] as string) : t(k, vars)
  const chosen = langOf(value) as TargetLang
  const pickLang = (l: TargetLang) => onPick(s.variantBy?.[l] ?? TARGETS[l].variants[0])
  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label={tr('learnTitle')} className="grid grid-cols-2 gap-3">
        {TARGET_LANGS.map((l) => {
          const c = TARGETS[l], m = MASCOTS[c.mascot], on = chosen === l
          const xp = xpIn(s, l), learned = learnedIn(s, l)
          return (
            <button key={l} type="button" role="radio" aria-checked={on} onClick={() => pickLang(l)}
              className={`relative flex min-w-0 flex-col items-center gap-1 overflow-hidden rounded-[26px] border-[3px] bg-gradient-to-b px-2 pb-3.5 pt-2 text-center shadow-[0_10px_24px_rgba(20,32,94,0.12)] transition hover:-translate-y-0.5 ${TINT[l]} ${on ? 'border-grape' : 'border-white'}`}>
              {on && <span className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-grape text-white"><Icon name="check" size={18} strokeWidth={3} /></span>}
              <Mascot mascot={c.mascot} mood={on ? 'love' : 'guide'} size={132} className={on ? 'animate-pop' : ''} />
              <span className="flex items-center gap-1.5 font-display text-[22px] font-bold leading-tight">
                <span className="flag text-2xl leading-none" aria-hidden>{c.flag}</span>{tr(`lang_${l}`)}
              </span>
              <span className="mut text-sm font-bold">{tr('learnWith', { name: m.name })}</span>
              {(xp > 0 || learned > 0) && <span className="mt-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-extrabold text-ink">{xp} XP · {learned} {tr('learned')}</span>}
            </button>
          )
        })}
      </div>
      <Picker value={value} onPick={onPick} options={TARGETS[chosen].variants} label={tr(`lang_${chosen}`)} />
    </div>
  )
}

/** Learning-language picker (#/learn): switch between French and Dutch at any time. */
export function Learn() {
  const s = useProgress()
  const [target, setTarget] = useState<Variant>(s.target!)
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-5 px-4 pb-7 pt-6">
      <div className="flex items-center justify-between gap-3">
        <a href="#/" aria-label={t('backHome')} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-ink hover:bg-white"><Icon name="close" /></a>
        <Logo size={28} />
        <span className="size-11" aria-hidden />
      </div>
      <header>
        <h1 className="m-0 font-display text-[26px] font-bold leading-tight">{t('learnTitle')}</h1>
        <p className="mut m-0 mt-1 text-sm font-semibold">{t('learnHint')}</p>
      </header>
      <LanguageCards value={target} onPick={setTarget} />
      <button type="button" className="btn btn-primary mt-auto w-full !min-h-14 !text-lg"
        onClick={() => { setLanguages(s.native!, target); go('') }}>{t('start')}<Icon name="arrowRight" /></button>
    </div>
  )
}
