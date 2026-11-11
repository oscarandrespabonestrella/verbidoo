import { useEffect, useMemo, useState } from 'react'
import { go } from '../App'
import { BigButton, Card, FormView, Legend, SpeakButton, VoiceWarning } from '../components/ui'
import { PERSONS, VARIANTS, langOf, uiLangOf, type Lang, type Variant } from '../data/i18n'
import { verbById, type Verb } from '../data/verbs'
import { frenchNonFinite } from '../engine/french'
import { COMPARABLE, conjugate, formText, infinitive, noteFor, pronounFor, say, sentenceFor, syllables, verbKind, type Time } from '../engine/conjugate'
import { TENSE_PATH } from '../lib/adaptive'
import { hasLetter, plain, sentenceTokens, tappedWord } from '../lib/phrases'
import { learner, markSeen, t, useProgress } from '../lib/progress'
import { repeatLast, speak, speakSyllables } from '../lib/speech'

const TIMES: Time[] = ['now', 'past', 'future', 'maybe', 'order', 'wish']
const NON_FINITE = { inf: 'Infinitif', infPast: 'Infinitif passé', ppres: 'Participe présent', pp: 'Participe passé', gerund: 'Gérondif' }
const KIND_BADGE = { regular: 'bg-mint/20 text-mint', spelling: 'bg-sky/20 text-sky', irregular: 'bg-coral/20 text-coral' }

/** Sentence with clickable words, highlighted verb and karaoke highlight while it is read aloud. */
function Sentence({ text, variant, native, translation }: { text: string; variant: Variant; native: Variant; translation: string }) {
  const [at, setAt] = useState(-1)
  const spoken = plain(text)
  // Same split as the recorded phrase list (lib/phrases); char offsets drive the read-along highlight.
  let offset = 0
  const tokens = sentenceTokens(text).map((tok) => { const start = offset; offset += tok.word.length; return { ...tok, start } })
  const read = (rate?: number) => speak(spoken, variant, { rate, onWord: setAt, onEnd: () => setAt(-1) })
  return (
    <li className="rounded-2xl bg-ink/5 p-4">
      <p className="text-xl leading-relaxed">
        {tokens.map((k, i) => k.space || !hasLetter(k.word) ? k.word : (
          <button key={i} type="button" onClick={() => speak(tappedWord(k.word), variant)}
            className={`rounded-lg px-0.5 transition hover:bg-sun/40 ${k.verb ? 'font-extrabold text-grape underline decoration-4 decoration-sun underline-offset-4' : ''} ${at >= k.start && at < k.start + k.word.length ? 'bg-sun' : ''}`}>
            {k.word}
          </button>
        ))}
      </p>
      <p className="mt-1 text-ink/60"><span className="flag">{VARIANTS[native].flag}</span> {translation.split(/(\{[^}]+\})/).map((p, i) => p.startsWith('{') ? <b key={i}>{plain(p)}</b> : p)}</p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => read()} aria-label={t('normal')} className="h-11 w-11 rounded-full bg-sky text-xl text-white">🔊</button>
        <button type="button" onClick={() => read(0.55)} aria-label={t('slow')} className="h-11 w-11 rounded-full bg-sky text-xl text-white">🐢</button>
      </div>
    </li>
  )
}

function Conjugation({ verb, target, native }: { verb: Verb; target: Variant; native: Variant }) {
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
  // Imperatives have no je/il/ils rows; regional rows (vosotros) only show in their variant.
  const persons = PERSONS[tl].map((d, i) => ({ ...d, i })).filter((d) => (!d.only || d.only.includes(target)) && table.forms[d.i])
  const p = table.forms[picked] ? picked : persons[0].i
  const line = (i: number) => say(tl, i, table.forms[i]!, table.tense)
  const rowLabel = (i: number) => (table.tense.imperative ? `(${PERSONS[tl][i].label})` : pronounFor(tl, i, formText(table.forms[i]!), table.tense))
  const nonFinite = tl === 'fr' ? frenchNonFinite(verb.fr, pron) : null
  // Reuse an example sentence only if it contains exactly this pronoun + form ("j'ai mangé"); else show pronoun + form.
  const match = [0, 1].map((i) => plain(sentenceFor(verb, i, target))).find((s) => s.toLowerCase().includes(line(p).toLowerCase()))

  // Compare: French next to English, Spanish and Portuguese (the child's own variant for their language).
  const others: Variant[] = [target, ...(['en', 'es', 'pt'] as Lang[]).map((l) =>
    l === langOf(native) ? native : ({ en: 'en-US', es: 'es-ES', pt: 'pt-BR' } as Record<string, Variant>)[l])]

  return (
    <>
      <Card>
        <h2 className="mb-3 font-display text-2xl font-bold">🧩 {t('conjugation')}</h2>
        {canPron && (
          <div className="mb-3 flex gap-2" role="group">
            {[false, true].map((v) => (
              <button key={String(v)} type="button" onClick={() => setPron(v)} aria-pressed={pron === v}
                className={`rounded-full px-4 py-2 font-display text-lg font-bold ${pron === v ? 'bg-sky text-white' : 'bg-ink/5'}`}>
                {v ? formText(frenchNonFinite(verb.fr, true).inf) : verb.fr.inf}
              </button>
            ))}
          </div>
        )}
        {TIMES.map((time) => {
          const group = tables.filter((x) => x.tense.time === time)
          return group.length > 0 && (
            <div key={time} className="mb-2">
              <div className="mb-1 text-sm font-bold uppercase text-ink/50">{t(time)}</div>
              <div className="flex flex-wrap gap-2">
                {group.map((x) => (
                  <button key={x.tense.id} type="button" onClick={() => setTenseId(x.tense.id)} aria-pressed={x.tense.id === tenseId}
                    title={inGamesLater(x.tense.id) ? t('notInGames') : undefined}
                    className={`rounded-full px-3 py-1.5 text-sm font-bold ${x.tense.id === tenseId ? 'bg-grape text-white' : 'bg-ink/5'}`}>
                    {inGamesLater(x.tense.id) && <span aria-label={t('notInGames')}>🔒 </span>}{x.tense.label} <span aria-label={`${t('levelStars')} ${x.tense.level}`}>{'★'.repeat(x.tense.level)}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
        {table.tense.usage && <p className="mt-2 rounded-xl bg-sun/25 px-3 py-2 text-sm font-bold">ℹ️ {t(table.tense.usage)}</p>}

        <table className="mt-4 w-full">
          <tbody>
            {persons.map((d) => (
              <tr key={d.i} onClick={() => { setP(d.i); speak(line(d.i), target) }}
                className={`cursor-pointer border-b border-ink/5 text-lg ${p === d.i ? 'bg-sun/30' : 'hover:bg-ink/5'}`}>
                <td className="py-2 pl-2 font-bold text-ink/60">
                  {rowLabel(d.i)}
                  {d.usage?.[target] && <span className="ml-1 rounded bg-ink/10 px-1 text-xs">{t(d.usage[target]!)}</span>}
                </td>
                <td className="py-2"><FormView form={table.forms[d.i]!} /></td>
                <td className="w-12 py-1 text-right"><SpeakButton text={line(d.i)} variant={target} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Legend />
          <button type="button" onClick={() => speak(persons.map((d) => line(d.i)), target)}
            className="rounded-full bg-mint px-4 py-2 font-bold text-white">🎶 {t('hearAll')}</button>
        </div>
        <div className="mt-4 rounded-2xl bg-grape/10 p-3">
          <span className="text-sm font-bold text-ink/60">{t('exampleWith')}: </span>
          <span className="font-bold">{match ?? `${line(p)}.`}</span>
          <SpeakButton className="ml-2 align-middle" text={match ?? line(p)} variant={target} />
        </div>
        {nonFinite && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-bold uppercase text-ink/50">{t('noPerson')}</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(NON_FINITE) as (keyof typeof NON_FINITE)[]).map((k) => (
                <li key={k} className="flex items-center justify-between gap-2 rounded-xl bg-ink/5 px-3 py-2">
                  <span><span className="block text-xs font-bold text-ink/50">{NON_FINITE[k]}</span><FormView form={nonFinite[k]} /></span>
                  <SpeakButton text={formText(nonFinite[k])} variant={target} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-2xl font-bold">🌍 {t('compare')} · <span className="text-grape">{PERSONS[tl][p].label}</span></h2>
        <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-2 text-sm sm:text-base">
          <span />
          {others.map((v) => <span key={v} className="text-center text-2xl"><span className="flag">{VARIANTS[v].flag}</span></span>)}
          {(['now', 'past', 'future'] as const).map((time) => (
            <div key={time} className="contents">
              <span className="self-center font-bold text-ink/60">{t(time)}</span>
              {others.map((v) => {
                const l = langOf(v)
                const f = conjugate(verb, v).find((x) => x.tense.id === COMPARABLE[time][l])!.forms[p]!
                const said = say(l, p, f)
                return (
                  <button key={v} type="button" onClick={() => speak(said, v)}
                    className={`rounded-xl p-2 text-center ${v === target ? 'bg-grape/10' : 'bg-ink/5'}`}>
                    <span className="block text-xs text-ink/50">{pronounFor(l, p, f.aux || f.word).split('/')[0]}</span><FormView form={f} />
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
  useEffect(() => { if (verb) markSeen(verb.id) }, [verb])

  if (!verb) {
    return (
      <Card className="text-center">
        <div className="text-6xl">🙈</div>
        <p className="my-4 text-xl font-bold">{t('notFound')}</p>
        <BigButton onClick={() => go('verbs')}>{t('verbs')}</BigButton>
      </Card>
    )
  }
  const inf = infinitive(verb, target), syl = syllables(verb, target), kind = verbKind(verb, target), note = noteFor(verb, target)
  const nl = uiLangOf(native)

  return (
    <div className="space-y-5">
      <VoiceWarning variant={target} />
      <Card className="text-center">
        <div className="animate-pop text-[8rem] leading-none" role="img" aria-label={infinitive(verb, 'en-US')}>{verb.emoji}</div>
        <h1 className="mt-2 font-display text-5xl font-extrabold text-grape">{inf}</h1>
        {syl.length > 1 && <p className="mt-1 text-lg font-bold tracking-widest text-ink/50">{syl.join(' · ')}</p>}
        <div className="my-4 flex flex-wrap items-center justify-center gap-3">
          <SpeakButton big text={inf} variant={target} label={t('normal')} />
          <SpeakButton big slow text={inf} variant={target} label={t('slow')} />
          <button type="button" onClick={() => speakSyllables(syl, target)} aria-label={t('syllables')} title={t('syllables')}
            className="h-16 w-16 rounded-full bg-sun text-3xl shadow-[0_8px_20px_rgba(36,48,94,0.16)] active:translate-y-1">👏</button>
          <button type="button" onClick={repeatLast} aria-label={t('repeat')} title={t('repeat')}
            className="h-16 w-16 rounded-full bg-mint text-3xl shadow-[0_8px_20px_rgba(36,48,94,0.16)] active:translate-y-1">🔁</button>
        </div>
        <p className="text-xl"><span className="text-ink/60"><span className="flag">{VARIANTS[native].flag}</span> {t('translation')}:</span> <b>{infinitive(verb, native)}</b>
          <SpeakButton className="ml-2 align-middle" text={infinitive(verb, native)} variant={native} />
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm font-bold">
          <span className={`rounded-full px-3 py-1 ${KIND_BADGE[kind]}`}>{t(kind === 'regular' ? 'regular' : kind === 'spelling' ? 'spelling' : 'irregularV')}</span>
          <span className="rounded-full bg-ink/5 px-3 py-1">{t(`cat_${verb.cat}`)}</span>
        </div>
        {note && <p className="mt-3 rounded-2xl bg-sky/10 p-3 font-bold">💡 {note[nl]}</p>}
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-bold">🤔 {t('meaning')}</h2>
          <SpeakButton text={verb.mean[nl]} variant={native} />
        </div>
        <p className="mt-2 text-xl">{verb.mean[nl]}</p>
      </Card>

      <Card>
        <h2 className="font-display text-2xl font-bold">💬 {t('examples')}</h2>
        <p className="mb-3 text-sm text-ink/60">{t('tapWord')}</p>
        <ul className="space-y-3">
          {[0, 1].map((i) => (
            <Sentence key={i} text={sentenceFor(verb, i, target)} variant={target} native={native} translation={sentenceFor(verb, i, native)} />
          ))}
        </ul>
      </Card>

      <Conjugation key={`${verb.id}-${target}`} verb={verb} target={target} native={native} />

      <BigButton className="w-full" color="bg-coral shadow-[0_8px_20px_rgba(36,48,94,0.16)]" onClick={() => go(`play/mixed/${verb.id}`)}>🎮 {t('practiceThis')}</BigButton>
    </div>
  )
}
