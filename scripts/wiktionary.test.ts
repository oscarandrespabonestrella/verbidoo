/**
 * Cross-checks the conjugation engines against Wiktionary's tables (machine-readable extracts from
 * kaikki.org, CC BY-SA): every French form, and the Spanish and Portuguese simple tenses shown in the
 * comparison panel. Run: `npm run check:fr`. Downloads are cached in scripts/.cache (works offline after).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { VERBS } from '../src/data/verbs'
import { conjugate } from '../src/engine/conjugate'
import { formText } from '../src/engine/core'
import { conjugateDutch, dutchNonFinite } from '../src/engine/dutch'
import { conjugateFrench, frenchNonFinite } from '../src/engine/french'

const CACHE = new URL('./.cache/', import.meta.url)

type Dict = 'French' | 'Spanish' | 'Portuguese'
async function wiktionary(word: string, dict: Dict = 'French'): Promise<{ form: string; tags: string[] }[]> {
  mkdirSync(CACHE, { recursive: true })
  const prefix = dict === 'French' ? '' : `${dict.slice(0, 2).toLowerCase()}-`
  const file = new URL(`${prefix}${encodeURIComponent(word)}.jsonl`, CACHE)
  if (!existsSync(file)) {
    const e = encodeURIComponent
    const res = await fetch(`https://kaikki.org/dictionary/${dict}/meaning/${e(word[0])}/${e(word.slice(0, 2))}/${e(word)}.jsonl`, {
      headers: { 'User-Agent': 'verb-adventure-conjugation-check' },
    })
    if (!res.ok) throw new Error(`kaikki.org ${res.status} for ${word}`)
    writeFileSync(file, await res.text())
  }
  const entries = readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
  const verb = entries.find((d) => d.pos === 'verb' && d.forms?.length > 20)
  if (!verb) throw new Error(`no verb conjugation for ${word}`)
  return verb.forms
}

/**
 * Known, reviewed exceptions — not a way to silence failures. For these verbs the extracted Wiktionary table
 * shows only "avoir", which belongs to another sense: transitive "sortir/tomber quelque chose", or the old
 * "partir" = to divide. The senses the app teaches (go out, fall, leave) take "être" in standard grammar:
 * je suis sorti, je suis tombé, je suis parti. Add a verb here only with the same kind of reason.
 */
const AUX_ETRE_SENSE: Record<string, string> = {
  sortir: 'go out (intransitive)', tomber: 'fall (intransitive)', partir: 'leave (not "divide")',
}
const FRENCH_WORD =/^[a-zàâäçéèêëîïôöùûüÿœæ'-]+$/i // drops IPA rows that share the same tags
function slot(tags: string[]): string | null {
  const has = (t: string) => tags.includes(t)
  if (has('multiword-construction')) return null
  if (has('subjunctive')) return has('present') ? 'subj' : has('imperfect') ? 'subjimp' : null
  if (has('imperative')) return 'imper'
  if (has('conditional')) return 'cond'
  if (has('indicative')) return has('historic') ? 'ps' : has('present') ? 'pres' : has('imperfect') ? 'imp' : has('future') ? 'fut' : null
  return null
}
const person = (tags: string[]) =>
  (tags.includes('first-person') ? 0 : tags.includes('second-person') ? 1 : 2) + (tags.includes('plural') ? 3 : 0)

test('French engine matches Wiktionary for every verb', { timeout: 120_000 }, async () => {
  const problems: string[] = []
  let checked = 0
  for (const v of VERBS) {
    const forms = await wiktionary(v.fr.inf)
    const want = new Map<string, Set<string>>()
    const add = (k: string, f: string) => want.set(k, (want.get(k) ?? new Set()).add(f))
    for (const { form, tags } of forms) {
      if (form.includes(' of être')) add('aux', 'être')
      else if (form.includes(' of avoir')) add('aux', 'avoir')
      if (!FRENCH_WORD.test(form)) continue
      if (tags.includes('participle')) add(tags.includes('past') ? 'pp' : 'ppres', form)
      const s = slot(tags)
      if (s) add(`${s}:${person(tags)}`, form)
    }

    const got = new Map<string, string>()
    for (const t of conjugateFrench(v.fr)) t.forms.forEach((f, p) => f && got.set(`${t.tense.id}:${p}`, formText(f)))
    const nf = frenchNonFinite(v.fr)
    got.set('pp', formText(nf.pp)).set('ppres', formText(nf.ppres)).set('aux', v.fr.etre ? 'être' : 'avoir')

    for (const [k, options] of want) {
      checked++
      const mine = got.get(k)
      if (!mine && options.has('-')) continue // Wiktionary "-" = the form doesn't exist (pouvoir has no imperative)
      if (k === 'aux' && AUX_ETRE_SENSE[v.fr.inf] && mine === 'être') continue
      if (!mine || !options.has(mine)) problems.push(`${v.fr.inf} ${k}: engine "${mine}" ≠ Wiktionary "${[...options].join(' / ')}"`)
    }
  }
  console.log(`checked ${checked} French forms against Wiktionary; ${problems.length} mismatches`)
  expect(problems).toEqual([])
})

// ── Spanish and Portuguese (the children's own languages, shown side by side with French) ──
const ROMANCE_WORD = /^[a-záéíóúâêôãõàçüñ'-]+$/i
function romanceSlot(tags: string[]): string | null {
  const has = (t: string) => tags.includes(t)
  if (['combined-form', 'subjunctive', 'imperative', 'negative', 'multiword-construction', 'pluperfect', 'personal', 'infinitive'].some(has)) return null
  if (has('gerund')) return 'ger'
  if (has('participle')) return has('past') && !has('feminine') && !has('plural') ? 'pp' : null
  if (has('conditional')) return 'cond'
  if (has('preterite')) return 'pret'
  if (has('imperfect')) return 'imperf'
  if (has('future')) return 'fut'
  if (has('present')) return 'pres'
  return null
}

for (const [dict, variant, lang] of [['Spanish', 'es-ES', 'es'], ['Portuguese', 'pt-BR', 'pt']] as const) {
  test(`${dict} engine matches Wiktionary for every verb`, { timeout: 180_000 }, async () => {
    const problems: string[] = []
    let checked = 0
    for (const v of VERBS) {
      const tables = conjugate(v, variant)
      const inf = v[lang].inf
      const want = new Map<string, Set<string>>()
      for (const { form, tags } of await wiktionary(inf, dict)) {
        if (!ROMANCE_WORD.test(form)) continue
        const s = romanceSlot(tags)
        if (!s) continue
        const k = s === 'ger' || s === 'pp' ? s : `${s}:${person(tags)}`
        want.set(k, (want.get(k) ?? new Set()).add(form))
      }
      const got = new Map<string, string>()
      for (const t of tables) if (['pres', 'pret', 'imperf', 'fut', 'cond'].includes(t.tense.id)) t.forms.forEach((f, p) => f && got.set(`${t.tense.id}:${p}`, formText(f)))
      // Gerund and participle come from the compound tenses (estar + gerund, haber/ter + participle).
      got.set('ger', tables.find((t) => t.tense.id === 'prog')!.forms[0]!.word)
      got.set('pp', tables.find((t) => t.tense.id === (lang === 'es' ? 'perf' : 'mqp'))!.forms[0]!.word)
      for (const [k, options] of want) {
        if (k === 'ger' && lang === 'pt' && variant !== 'pt-BR') continue
        checked++
        const mine = got.get(k)
        if (!mine || !options.has(mine)) problems.push(`${inf} ${k}: engine "${mine}" ≠ Wiktionary "${[...options].join(' / ')}"`)
      }
    }
    console.log(`checked ${checked} ${dict} forms against Wiktionary; ${problems.length} mismatches`)
    expect(problems).toEqual([])
  })
}

// ── Dutch (a learning language: every main-clause form, participles, imperative, archaic subjunctive, auxiliary) ──
/**
 * Reviewed exceptions, same rule as AUX_ETRE_SENSE: the Wiktionary template gives no auxiliary (so it defaults to
 * "hebben"), but the sense taught takes "zijn" in standard Dutch (ANS): de trein is vertrokken.
 */
const AUX_ZIJN_SENSE: Record<string, string> = { vertrekken: 'leave (intransitive)' }
const DUTCH_WORD = /^[a-zàâäçéèêëîïôöùûüÿ' -]+$/i
const SKIP_NL = ['subordinate-clause', 'Flanders', 'formal', 'colloquial', 'majestic', 'dialectal', 'obsolete', 'alternative']
function dutchSlots(tags: string[]): string[] {
  const has = (t: string) => tags.includes(t)
  if (SKIP_NL.some(has)) return []
  if (has('participle')) return [has('past') ? 'pp' : 'ppres']
  if (has('subjunctive')) return has('present') ? (has('plural') ? ['subj:3', 'subj:4', 'subj:5'] : ['subj:0', 'subj:1', 'subj:2']) : []
  if (has('archaic')) return []
  if (has('imperative')) return has('singular') ? ['imper:1'] : []
  const t = has('past') ? 'ovt' : has('present') ? 'ott' : null
  if (!t) return []
  if (has('plural')) return [`${t}:3`, `${t}:4`, `${t}:5`]
  return [`${t}:${tags.includes('first-person') ? 0 : tags.includes('second-person') ? 1 : 2}`]
}

test('Dutch engine matches Wiktionary for every verb', { timeout: 180_000 }, async () => {
  const problems: string[] = []
  let checked = 0
  for (const v of VERBS) {
    // "naar buiten gaan" has no entry: check its core verb. A fixed preposition (houden van) is not part of the table.
    const multi = v.nl.sep?.includes(' ')
    const l = { ...v.nl, prep: undefined, ...(multi ? { sep: undefined, inf: v.nl.inf.slice(v.nl.sep!.length + 1) } : {}) }
    const file = new URL(`nl-${encodeURIComponent(l.inf)}.jsonl`, CACHE)
    if (!existsSync(file)) {
      const e = encodeURIComponent
      const res = await fetch(`https://kaikki.org/dictionary/Dutch/meaning/${e(l.inf[0])}/${e(l.inf.slice(0, 2))}/${e(l.inf)}.jsonl`, { headers: { 'User-Agent': 'verb-adventure-conjugation-check' } })
      if (!res.ok) throw new Error(`kaikki.org ${res.status} for ${l.inf}`)
      writeFileSync(file, await res.text())
    }
    const entry = readFileSync(file, 'utf8').split('\n').filter(Boolean).map((x) => JSON.parse(x)).find((d) => d.pos === 'verb' && d.forms?.length > 10)
    const want = new Map<string, Set<string>>()
    for (const { form, tags = [] } of entry.forms as { form: string; tags?: string[] }[]) {
      if (!DUTCH_WORD.test(form)) continue
      for (const k of dutchSlots(tags)) want.set(k, (want.get(k) ?? new Set()).add(form))
    }
    const args = entry.inflection_templates?.[0]?.args ?? {}
    want.set('aux', new Set(args.aux ? String(args.aux).split(/[,/ ]+/) : args.trans === 'unacc' ? ['zijn'] : ['hebben']))

    const got = new Map<string, string>()
    for (const t of conjugateDutch(l)) t.forms.forEach((f, p) => f && got.set(`${t.tense.id}:${p}`, formText(f)))
    const nf = dutchNonFinite(l)
    got.set('pp', formText(nf.pp)).set('ppres', formText(nf.ppres)).set('aux', l.aux ?? 'hebben')

    for (const [k, options] of want) {
      checked++
      const mine = got.get(k)
      if (!mine && k.startsWith('imper') && l.noImper) continue // modal verbs: no imperative taught
      if (k === 'aux' && AUX_ZIJN_SENSE[l.inf] && mine === 'zijn') continue
      if (!mine || !options.has(mine)) problems.push(`${l.inf} ${k}: engine "${mine}" ≠ Wiktionary "${[...options].join(' / ')}"`)
    }
  }
  console.log(`checked ${checked} Dutch forms against Wiktionary; ${problems.length} mismatches`)
  expect(problems).toEqual([])
})
