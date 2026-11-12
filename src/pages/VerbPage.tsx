import { useEffect, useMemo, useState } from 'react'
import { go } from '../App'
import { CAT_STYLE, Icon } from '../components/icons'
import { BigButton, Card, FormView, Legend, SpeakButton, VoiceWarning, familyLabel, stemColor } from '../components/ui'
import { PERSONS, VARIANTS, langOf, uiLangOf, type Lang, type Variant } from '../data/i18n'
import { verbById, type Verb } from '../data/verbs'
import { COMPOUND, frenchNonFinite, frenchStems, stemFamily } from '../engine/french'
import { COMPARABLE, conjugate, formText, infinitive, noteFor, pronounFor, say, sentenceFor, syllables, verbKind, type Time } from '../engine/conjugate'
import { TENSE_PATH } from '../lib/adaptive'
import { hasLetter, plain, sentenceTokens, tappedWord } from '../lib/phrases'
import { learner, markSeen, t, useProgress } from '../lib/progress'
import { SLOW, repeatLast, speak, speakSyllables } from '../lib/speech'

const TIMES: Time[] = ['now', 'past', 'future', 'maybe', 'order', 'wish']
const NON_FINITE = { inf: 'Infinitif', infPast: 'Infinitif passé', ppres: 'Participe présent', pp: 'Participe passé', gerund: 'Gérondif' }
const KIND_BADGE = { regular: 'bg-[#E3F6EE] text-[#06603F]', spelling: 'bg-[#E3F4FD] text-[#13579F]', irregular: 'bg-[#FDECEC] text-[#A12424]' }
const FAMILY_BADGE = { 1: KIND_BADGE.regular, 2: KIND_BADGE.spelling, 3: KIND_BADGE.irregular, special: KIND_BADGE.irregular }
type Tab = 'summary' | 'conj' | 'compare'
/** On phones only the picked section shows; from lg up every section shows side by side. */
const show = (on: boolean) => (on ? '' : 'hidden lg:block')

/** Sentence with clickable words, highlighted verb and karaoke highlight while it is read aloud. */
function Sentence({ text, variant, translation }: { text: string; variant: Variant; translation: string }) {
  const [at, setAt] = useState(-1)
  const spoken = plain(text)
  // Same split as the recorded phrase list (lib/phrases); char offsets drive the read-along highlight.
  let offset = 0
  const tokens = sentenceTokens(text).map((tok) => { const start = offset; offset += tok.word.length; return { ...tok, start } })
  const read = (rate?: number) => speak(spoken, variant, { rate, onWord: setAt, onEnd: () => setAt(-1) })
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-soft p-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-[19px] leading-normal" lang={langOf(variant)}>
          {tokens.map((k, i) => k.space || !hasLetter(k.word) ? k.word : (
            <button key={i} type="button" onClick={() => speak(tappedWord(k.word), variant)}
              className={`rounded-md px-0.5 transition hover:bg-sun/40 ${k.verb ? 'font-extrabold text-grape-dark underline decoration-sun decoration-[3px] underline-offset-4' : ''} ${at >= k.start && at < k.start + k.word.length ? 'bg-sun' : ''}`}>
              {k.word}
            </button>
          ))}
        </p>
        <p className="mut mt-1.5 text-sm">{translation.split(/(\{[^}]+\})/).map((p, i) => p.startsWith('{') ? <b key={i} className="text-ink">{plain(p)}</b> : p)}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        <button type="button" onClick={() => read()} aria-label={t('normal')} title={t('normal')} className="ib"><Icon name="speaker" size={20} /></button>
        <button type="button" onClick={() => read(0.55)} aria-label={t('slow')} title={t('slow')} className="ib ib-soft"><Icon name="turtle" size={20} /></button>
      </div>
    </li>
  )
}

/** French only: each spoken stem, its sound, and where it is used. Tapping plays the forms that share it. */
function StemsCard({ verb, target }: { verb: Verb; target: Variant }) {
  const tables = useMemo(() => conjugate(verb, target), [verb, target])
  const st = frenchStems(verb.fr), fam = stemFamily(verb.fr)
  const pres = tables[0]
  const rows = st.list.map((s, i) => {
    const persons = pres.forms.flatMap((f, p) => (f?.stem === i ? [p] : []))
    const uses = tables.filter((tb) => tb !== pres && !COMPOUND.includes(tb.tense.id) && tb.forms.some((f) => f?.stem === i))
    const labels = [...uses.map((tb) => tb.tense.label), ...(st.pp === i ? [`Participe passé (${tables.find((tb) => tb.tense.id === 'pc')!.tense.label}…)`] : [])]
    const src = persons.length ? pres : uses[0] ?? tables.find((tb) => tb.tense.id === 'pc')!
    const sample = (persons.length ? persons : [0, 1, 2, 3, 4, 5].filter((p) => src.forms[p]?.stem === i).slice(0, 3))
      .map((p) => say('fr', p, src.forms[p]!, src.tense))
    return { s, i, persons, labels, sample }
  })
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="h2">{t('stems')}</h2>
        <span className={`inline-flex min-h-8 items-center rounded-full px-3 text-[13px] font-extrabold ${FAMILY_BADGE[fam]}`}>{familyLabel(fam)}</span>
      </div>
      <p className="mut m-0 text-[15px] leading-snug">{t('stemsHint')}</p>
      <ul className="flex flex-col gap-2" lang="fr">
        {rows.map(({ s, i, persons, labels, sample }) => (
          <li key={i} className="flex items-center gap-3 rounded-[14px] bg-soft py-2 pl-3.5 pr-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <b className="font-display text-[22px] font-bold" style={{ color: stemColor(i) }}>{s.w}-</b>
                <span lang="fr-fonipa" className="mut text-[15px]">/{s.ipa}/</span>
                {persons.length > 0 && <span className="text-sm font-bold">{persons.map((p) => PERSONS.fr[p].label).join(' · ')}</span>}
              </div>
              {labels.length > 0 && <p className="mut m-0 text-[13px] leading-snug"><span className="sr-only">{t('stemUsedIn')} </span>{labels.join(', ')}</p>}
            </div>
            {sample.length > 0 && <SpeakButton text={sample} variant={target} className="!size-10" />}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Conjugation({ verb, target, native, tab }: { verb: Verb; target: Variant; native: Variant; tab: Tab }) {
  const tl = langOf(target)
  const canPron = tl === 'fr' && !!verb.fr.pronominal
  const unlocked = learner(useProgress()).unlocked
  // Reference stays complete; the lock only says the tense is not in games yet.
  const inGamesLater = (id: string) => tl === 'fr' && TENSE_PATH.includes(id) && !unlocked.includes(id)
  const [pron, setPron] = useState(false)
  const tables = useMemo(() => conjugate(verb, target, pron), [verb, target, pron])
  const [tenseId, setTenseId] = useState(tables[0].tense.id)
  const [picked, setP] = useState(0)
  const table = tables.find((x) => x.tense.id === tenseId) ?? tables[0]
  const [time, setTime] = useState<Time>(table.tense.time)
  // Imperatives have no je/il/ils rows; regional rows (vosotros) only show in their variant.
  const persons = PERSONS[tl].map((d, i) => ({ ...d, i })).filter((d) => (!d.only || d.only.includes(target)) && table.forms[d.i])
  const p = table.forms[picked] ? picked : persons[0].i
  const line = (i: number) => say(tl, i, table.forms[i]!, table.tense)
  const rowLabel = (i: number) => (table.tense.imperative ? `(${PERSONS[tl][i].label})` : pronounFor(tl, i, formText(table.forms[i]!), table.tense))
  const nonFinite = tl === 'fr' ? frenchNonFinite(verb.fr, pron) : null
  // Reuse an example sentence only if it contains exactly this pronoun + form ("j'ai mangé"); else show pronoun + form.
  const match = [0, 1].map((i) => plain(sentenceFor(verb, i, target))).find((s) => s.toLowerCase().includes(line(p).toLowerCase()))
  const times = TIMES.filter((x) => tables.some((tb) => tb.tense.time === x))
  const group = tables.filter((x) => x.tense.time === time)
  const pickTime = (x: Time) => { setTime(x); const first = tables.find((tb) => tb.tense.time === x); if (first) setTenseId(first.tense.id) }

  // Compare: French next to English, Spanish and Portuguese (the child's own variant for their language).
  const others: Variant[] = [target, ...(['en', 'es', 'pt'] as Lang[]).map((l) =>
    l === langOf(native) ? native : ({ en: 'en-US', es: 'es-ES', pt: 'pt-BR' } as Record<string, Variant>)[l])]

  return (
    <>
      <div className={`space-y-3.5 ${show(tab === 'conj')}`}>
        <Card className="flex flex-col gap-3 !pt-3.5">
          <h2 className="h2 hidden lg:block">{t('conjugation')}</h2>
          {canPron && (
            <div className="flex flex-wrap gap-2" role="group">
              {[false, true].map((v) => (
                <button key={String(v)} type="button" onClick={() => setPron(v)} aria-pressed={pron === v} lang={tl}
                  className={`chip !min-h-10 font-display !font-bold ${pron === v ? '!border-sky !bg-sky !text-white' : ''}`}>
                  {v ? formText(frenchNonFinite(verb.fr, true).inf) : verb.fr.inf}
                </button>
              ))}
            </div>
          )}
          <div role="tablist" aria-label={t('conjugation')} className="-mx-1 flex gap-[18px] overflow-x-auto border-b border-line px-1">
            {times.map((x) => (
              <button key={x} type="button" role="tab" aria-selected={x === time} onClick={() => pickTime(x)}
                className={`min-h-10 shrink-0 whitespace-nowrap border-b-[3px] px-1 text-[15px] font-extrabold ${x === time ? 'border-grape text-ink' : 'border-transparent text-subtle'}`}>
                {t(x)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {group.map((x) => {
              const on = x.tense.id === tenseId, later = inGamesLater(x.tense.id)
              return (
                <button key={x.tense.id} type="button" onClick={() => setTenseId(x.tense.id)} aria-pressed={on}
                  title={later ? t('notInGames') : undefined}
                  className={`inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-left text-sm font-bold ${on ? 'border-grape bg-grape text-white' : later ? 'border-dashed border-line-strong bg-soft text-muted' : 'border-line-strong bg-white text-[#3B4468]'}`}>
                  {later && <span aria-label={t('notInGames')}><Icon name="lock" size={14} /></span>}
                  <span className="min-w-0" lang={tl}>{x.tense.label}</span>
                  <span className="inline-flex gap-[3px]" aria-label={`${t('levelStars')} ${x.tense.level}`}>
                    {[1, 2, 3].map((n) => <i key={n} className={`size-1.5 rounded-full bg-current ${n <= x.tense.level ? '' : 'opacity-30'}`} />)}
                  </span>
                </button>
              )
            })}
          </div>
          {table.tense.usage && <p className="flex gap-2 rounded-xl bg-[#FFF4D6] px-3 py-2 text-sm font-bold"><Icon name="bulb" size={18} className="text-[#8A6514]" />{t(table.tense.usage)}</p>}
        </Card>

        <Card className="!p-2.5">
          <ul className="flex flex-col gap-0.5" lang={tl}>
            {persons.map((d) => (
              <li key={d.i} onClick={() => { setP(d.i); speak(line(d.i), target) }}
                className={`grid min-h-14 cursor-pointer grid-cols-[minmax(64px,auto)_minmax(0,1fr)_auto] items-center gap-2 rounded-[14px] py-1.5 pl-3.5 pr-2 ${p === d.i ? 'bg-[#FFF4D6]' : 'hover:bg-soft'}`}>
                <span className="mut text-base font-bold">
                  {rowLabel(d.i)}
                  {d.usage?.[target] && <span className="ml-1 rounded bg-ink/10 px-1 text-xs">{t(d.usage[target]!)}</span>}
                </span>
                <span className="min-w-0 text-[19px]"><FormView form={table.forms[d.i]!} /></span>
                <SpeakButton text={line(d.i)} variant={target} className="!size-10" />
              </li>
            ))}
          </ul>
          <div className="px-3.5 pb-1 pt-2.5"><Legend stems={tl === 'fr'} /></div>
          <button type="button" onClick={() => speak(persons.map((d) => line(d.i)), target)}
            className="mx-1 mb-1 mt-2 flex min-h-12 w-[calc(100%-8px)] items-center justify-center gap-2 rounded-[14px] bg-sky-soft px-3 text-[15px] font-extrabold text-[#13579F]">
            <Icon name="speakerLoud" size={20} />{t('hearAll')}
          </button>
          <div className="m-1 mt-2 flex items-center gap-2 rounded-[14px] bg-grape-soft p-3">
            <p className="min-w-0 flex-1"><span className="cap block">{t('exampleWith')}</span><span className="font-bold" lang={tl}>{match ?? `${line(p)}.`}</span></p>
            <SpeakButton text={match ?? line(p)} variant={target} className="!size-10" />
          </div>
        </Card>

        {nonFinite && (
          <Card className="flex flex-col gap-2.5">
            <h2 className="h2">{t('noPerson')}</h2>
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-2" lang={tl}>
              {(Object.keys(NON_FINITE) as (keyof typeof NON_FINITE)[]).map((k) => (
                <li key={k} className="flex items-center justify-between gap-2 rounded-[14px] bg-soft py-2.5 pl-3.5 pr-2">
                  <span className="min-w-0"><span className="cap block !text-[11px]">{NON_FINITE[k]}</span><span className="text-[17px]"><FormView form={nonFinite[k]} /></span></span>
                  <SpeakButton text={formText(nonFinite[k])} variant={target} className="!size-10" />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Card className={`flex-col gap-3 ${tab === 'compare' ? 'flex' : 'hidden lg:flex'}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="h2">{t('compare')}</h2>
          <span className="cap">{PERSONS[tl][p].label}</span>
        </div>
        <div className="grid grid-cols-[minmax(52px,auto)_repeat(4,minmax(0,1fr))] gap-1.5 text-[13px] leading-snug sm:text-sm">
          <span />
          {others.map((v) => <span key={v} className="p-0.5 text-center text-xs font-extrabold text-subtle" title={VARIANTS[v].name}>{v.slice(0, 2).toUpperCase()}</span>)}
          {(['now', 'past', 'future'] as const).map((tm) => (
            <div key={tm} className="contents">
              <span className="mut flex items-center text-[13px] font-extrabold">{t(tm)}</span>
              {others.map((v) => {
                const l = langOf(v)
                const f = conjugate(verb, v).find((x) => x.tense.id === COMPARABLE[tm][l])!.forms[p]!
                const said = say(l, p, f)
                return (
                  <button key={v} type="button" onClick={() => speak(said, v)} lang={l}
                    className={`min-w-0 rounded-[10px] px-1 py-2 text-center ${v === target ? 'bg-grape-soft font-extrabold text-grape-dark' : 'bg-soft'}`}>
                    <span className="block text-[11px] font-bold text-subtle">{pronounFor(l, p, f.aux || f.word).split('/')[0]}</span><FormView form={f} />
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

export function VerbPage({ id }: { id: string }) {
  const s = useProgress()
  const target = s.target!, native = s.native!
  const verb = verbById(id)
  const [tab, setTab] = useState<Tab>('summary')
  useEffect(() => { if (verb) markSeen(verb.id) }, [verb])

  if (!verb) {
    return (
      <Card className="flex flex-col items-center gap-4 text-center">
        <Icon name="search" size={48} className="text-subtle" />
        <p className="text-xl font-bold">{t('notFound')}</p>
        <BigButton onClick={() => go('verbs')}>{t('verbs')}</BigButton>
      </Card>
    )
  }
  const inf = infinitive(verb, target), syl = syllables(verb, target), kind = verbKind(verb, target), note = noteFor(verb, target)
  const nl = uiLangOf(native), tl = langOf(target)
  const cat = CAT_STYLE[verb.cat] ?? CAT_STYLE.core
  const tabs: [Tab, string][] = [['summary', t('vp_summary')], ['conj', t('conjugation')], ['compare', t('compareVoice')]]
  const actions = [
    { label: t('normal'), icon: 'speakerLoud' as const, cls: 'bg-sky text-white', run: () => speak(inf, target) },
    { label: t('slow'), icon: 'turtle' as const, cls: 'bg-sky-soft text-[#0C76B8]', run: () => speak(inf, target, { rate: SLOW }) },
    { label: t('syllables'), icon: 'hand' as const, cls: 'bg-sun text-[#4A3000]', run: () => speakSyllables(syl, target) },
    { label: t('repeat'), icon: 'repeat' as const, cls: 'bg-grape text-white', run: repeatLast },
  ]

  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      <header className="flex min-w-0 items-center gap-2">
        <button type="button" onClick={() => go('verbs')} aria-label={t('verbs')} title={t('verbs')}
          className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-white"><Icon name="arrowLeft" /></button>
        <b className="min-w-0 flex-1 truncate font-display text-2xl font-bold text-grape-dark lg:hidden" lang={tl}>{inf}</b>
        <span className="mut min-w-0 truncate text-[15px] font-bold lg:hidden">{infinitive(verb, native)}</span>
      </header>

      <nav aria-label={inf} className="grid grid-cols-3 gap-1 rounded-2xl bg-[#ECEEF6] p-1 lg:hidden">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" onClick={() => setTab(k)} aria-current={tab === k ? 'page' : undefined}
            className={`min-h-11 min-w-0 rounded-xl px-1 text-[15px] font-extrabold leading-tight ${tab === k ? 'bg-white text-ink shadow-[0_1px_3px_rgba(36,48,94,0.12)]' : 'text-muted'}`}>
            {label}
          </button>
        ))}
      </nav>

      <VoiceWarning variant={target} />

      <div className="grid min-w-0 gap-3.5 lg:grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] lg:items-start lg:gap-5">
        <div className={`min-w-0 space-y-3.5 ${show(tab === 'summary')}`}>
          <Card className="flex flex-col items-center gap-3.5 text-center lg:flex-row lg:flex-wrap lg:text-left">
            <div className="emoji flex size-[148px] shrink-0 animate-pop items-center justify-center rounded-full text-[88px] leading-none"
              style={{ background: cat.bg }} role="img" aria-label={infinitive(verb, 'en-US')}>{verb.emoji}</div>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-3 lg:items-start">
              <div>
                <h1 className="m-0 font-display text-[44px] font-bold leading-none text-grape-dark lg:text-[52px]" lang={tl}>{inf}</h1>
                {(syl.length > 1 || tl === 'fr') && (
                  <p className="mut mt-1 text-[17px] font-bold tracking-[.12em]" lang={tl}>
                    {syl.length > 1 && syl.join(' · ')}
                    {tl === 'fr' && <span lang="fr-fonipa" className="ml-2 font-sans font-medium tracking-normal">/{verb.fr.ipa}/</span>}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 lg:justify-start">
                {tl === 'fr'
                  ? <span className={`inline-flex min-h-8 items-center rounded-full px-3 text-[13px] font-extrabold ${FAMILY_BADGE[stemFamily(verb.fr)]}`}>{familyLabel(stemFamily(verb.fr))}</span>
                  : <span className={`inline-flex min-h-8 items-center rounded-full px-3 text-[13px] font-extrabold ${KIND_BADGE[kind]}`}>{t(kind === 'regular' ? 'regular' : kind === 'spelling' ? 'spelling' : 'irregularV')}</span>}
                <span className="inline-flex min-h-8 items-center gap-1 rounded-full px-3 text-[13px] font-extrabold" style={{ background: cat.bg, color: cat.fg }}><Icon name={cat.icon} size={14} />{t(`cat_${verb.cat}`)}</span>
              </div>
            </div>
            <div className="grid w-full grid-cols-4 gap-2">
              {actions.map((a) => (
                <button key={a.label} type="button" onClick={a.run} title={a.label}
                  className="flex min-w-0 flex-col items-center gap-1.5 text-[13px] font-extrabold leading-tight text-[#3B4468]">
                  <span className={`flex size-[60px] max-w-full items-center justify-center rounded-full shadow-[0_8px_20px_rgba(36,48,94,0.16)] transition active:translate-y-0.5 ${a.cls}`}><Icon name={a.icon} size={26} /></span>
                  <span className="max-w-full">{a.label}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF4D6] text-[13px] font-extrabold text-[#8A6514]">{nl.toUpperCase()}</span>
              <div className="min-w-0 flex-1"><span className="cap">{t('translation')}</span><div className="font-display text-2xl font-bold">{infinitive(verb, native)}</div></div>
              <SpeakButton text={infinitive(verb, native)} variant={native} />
            </div>
            <div className="flex items-start gap-3">
              <p className="m-0 min-w-0 flex-1 text-base leading-normal">{verb.mean[nl]}</p>
              <SpeakButton text={verb.mean[nl]} variant={native} label={t('meaning')} className="ib-soft !size-10" />
            </div>
            {note && (
              <div className="flex gap-2.5 rounded-[14px] bg-grape-soft p-3">
                <Icon name="bulb" className="text-grape" />
                <p className="m-0 min-w-0 text-[15px] leading-snug">{note[nl]}</p>
              </div>
            )}
          </Card>

          {tl === 'fr' && <StemsCard verb={verb} target={target} />}

          <Card className="flex flex-col gap-3">
            <div><h2 className="h2">{t('examples')}</h2><span className="mut text-sm">{t('tapWord')}</span></div>
            <ul className="flex flex-col gap-3">
              {[0, 1].map((i) => (
                <Sentence key={i} text={sentenceFor(verb, i, target)} variant={target} translation={sentenceFor(verb, i, native)} />
              ))}
            </ul>
          </Card>
        </div>

        <div className="min-w-0 space-y-3.5 lg:space-y-5">
          <Conjugation key={`${verb.id}-${target}`} verb={verb} target={target} native={native} tab={tab} />
        </div>
      </div>

      <BigButton className="w-full lg:w-auto lg:self-start" onClick={() => go(`play/mixed/${verb.id}`)}>
        <Icon name="gamepad" />{t('practiceThis')}
      </BigButton>
    </div>
  )
}
