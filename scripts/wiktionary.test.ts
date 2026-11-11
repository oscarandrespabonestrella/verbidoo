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
