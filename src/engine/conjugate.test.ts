import { expect, test } from 'vitest'
import type { Variant } from '../data/i18n'
import { verbById, VERBS } from '../data/verbs'
import { conjugate, formText, say, verbKind } from './conjugate'
import { frenchNonFinite } from './french'

const table = (id: string, variant: Variant, tense: string, pron = false) => conjugate(verbById(id)!, variant, pron).find((t) => t.tense.id === tense)!
const row = (id: string, variant: Variant, tense: string, pron = false) =>
  table(id, variant, tense, pron).forms.map((f) => (f ? formText(f) : '-')).join(' ')

// Reference forms: RAE/DLE conjugation tables (es), Priberam (pt), standard grammars (en).
test.each([
  ['eat', 'en-US', 'present_simple', 'eat eat eats eat eat eat'],
  ['study', 'en-US', 'present_simple', 'study study studies study study study'],
  ['have', 'en-GB', 'present_simple', 'have have has have have have'],
  ['go', 'en-US', 'present_perfect_continuous', 'have been going have been going has been going have been going have been going have been going'],
  ['swim', 'en-US', 'past_perfect', 'had swum had swum had swum had swum had swum had swum'],
  ['eat', 'es-ES', 'pres', 'como comes come comemos coméis comen'],
  ['live', 'es-ES', 'pret', 'viví viviste vivió vivimos vivisteis vivieron'],
  ['play', 'es-ES', 'pret', 'jugué jugaste jugó jugamos jugasteis jugaron'],
  ['hug', 'es-419', 'pret', 'abracé abrazaste abrazó abrazamos abrazasteis abrazaron'],
  ['talk', 'es-ES', 'imperf', 'hablaba hablabas hablaba hablábamos hablabais hablaban'],
  ['have', 'es-ES', 'fut', 'tendré tendrás tendrá tendremos tendréis tendrán'],
  ['make', 'es-ES', 'cond', 'haría harías haría haríamos haríais harían'],
  ['write', 'es-ES', 'perf', 'he escrito has escrito ha escrito hemos escrito habéis escrito han escrito'],
  ['read', 'es-ES', 'prog', 'estoy leyendo estás leyendo está leyendo estamos leyendo estáis leyendo están leyendo'],
  ['go', 'es-ES', 'imperf', 'iba ibas iba íbamos ibais iban'],
  ['see', 'es-ES', 'fut', 'veré verás verá veremos veréis verán'],
  ['eat', 'pt-BR', 'pres', 'como comes come comemos comeis comem'],
  ['open', 'pt-BR', 'pret', 'abri abriste abriu abrimos abristes abriram'],
  ['talk', 'pt-BR', 'pret', 'falei falaste falou falamos falastes falaram'],
  ['talk', 'pt-PT', 'pret', 'falei falaste falou falámos falastes falaram'],
  ['play', 'pt-BR', 'pret', 'brinquei brincaste brincou brincamos brincastes brincaram'],
  ['dance', 'pt-BR', 'pret', 'dancei dançaste dançou dançamos dançastes dançaram'],
  ['read', 'pt-PT', 'imperf', 'lia lias lia líamos líeis liam'],
  ['go', 'pt-BR', 'imperf', 'ia ias ia íamos íeis iam'],
  ['make', 'pt-BR', 'fut', 'farei farás fará faremos fareis farão'],
  ['have', 'pt-BR', 'cond', 'teria terias teria teríamos teríeis teriam'],
  ['jump', 'pt-PT', 'pres', 'salto saltas salta saltamos saltais saltam'],
  ['jump', 'pt-BR', 'pres', 'pulo pulas pula pulamos pulais pulam'],
  ['eat', 'pt-BR', 'prog', 'estou comendo estás comendo está comendo estamos comendo estais comendo estão comendo'],
  ['eat', 'pt-PT', 'prog', 'estou a comer estás a comer está a comer estamos a comer estais a comer estão a comer'],
  ['write', 'pt-PT', 'mqp', 'tinha escrito tinhas escrito tinha escrito tínhamos escrito tínheis escrito tinham escrito'],
  ['eat', 'fr-FR', 'pres', 'mange manges mange mangeons mangez mangent'],
  ['eat', 'fr-FR', 'imp', 'mangeais mangeais mangeait mangions mangiez mangeaient'],
  ['eat', 'fr-FR', 'pc', 'ai mangé as mangé a mangé avons mangé avez mangé ont mangé'],
  ['study', 'fr-FR', 'imp', 'étudiais étudiais étudiait étudiions étudiiez étudiaient'],
  ['drink', 'fr-FR', 'imp', 'buvais buvais buvait buvions buviez buvaient'],
  ['drink', 'fr-FR', 'fut', 'boirai boiras boira boirons boirez boiront'],
  ['run', 'fr-FR', 'fut', 'courrai courras courra courrons courrez courront'],
  ['sleep', 'fr-FR', 'pc', 'ai dormi as dormi a dormi avons dormi avez dormi ont dormi'],
  ['learn', 'fr-FR', 'pres', 'apprends apprends apprend apprenons apprenez apprennent'],
  ['make', 'fr-FR', 'imp', 'faisais faisais faisait faisions faisiez faisaient'],
  ['make', 'fr-FR', 'cond', 'ferais ferais ferait ferions feriez feraient'],
  ['see', 'fr-FR', 'pc', 'ai vu as vu a vu avons vu avez vu ont vu'],
  ['want', 'fr-FR', 'pc', 'ai voulu as voulu a voulu avons voulu avez voulu ont voulu'],
  ['have', 'fr-FR', 'fut', 'aurai auras aura aurons aurez auront'],
  ['go', 'fr-FR', 'pc', 'suis allé(e) es allé(e) est allé(e) sommes allé(e)s êtes allé(e)s sont allé(e)s'],
  ['go', 'fr-FR', 'pqp', 'étais allé(e) étais allé(e) était allé(e) étions allé(e)s étiez allé(e)s étaient allé(e)s'],
  ['open', 'fr-CA', 'condp', 'aurais ouvert aurais ouvert aurait ouvert aurions ouvert auriez ouvert auraient ouvert'],
  ['listen', 'fr-FR', 'prog', "suis en train d'écouter es en train d'écouter est en train d'écouter sommes en train d'écouter êtes en train d'écouter sont en train d'écouter"],
  ['talk', 'fr-FR', 'proche', 'vais parler vas parler va parler allons parler allez parler vont parler'],
  ['eat', 'fr-FR', 'ps', 'mangeai mangeas mangea mangeâmes mangeâtes mangèrent'],
  ['eat', 'fr-FR', 'subjimp', 'mangeasse mangeasses mangeât mangeassions mangeassiez mangeassent'],
  ['drink', 'fr-FR', 'subj', 'boive boives boive buvions buviez boivent'],
  ['drink', 'fr-FR', 'ps', 'bus bus but bûmes bûtes burent'],
  ['have', 'fr-FR', 'subj', 'aie aies ait ayons ayez aient'],
  ['have', 'fr-FR', 'imper', '- aie - ayons ayez -'],
  ['go', 'fr-FR', 'imper', '- va - allons allez -'],
  ['go', 'fr-FR', 'subjp', 'sois allé(e) sois allé(e) soit allé(e) soyons allé(e)s soyez allé(e)s soient allé(e)s'],
  ['go', 'fr-FR', 'ps', 'allai allas alla allâmes allâtes allèrent'],
  ['make', 'fr-FR', 'subjimp', 'fisse fisses fît fissions fissiez fissent'],
  ['open', 'fr-FR', 'imper', '- ouvre - ouvrons ouvrez -'],
  ['open', 'fr-FR', 'impneg', "- n'ouvre pas - n'ouvrons pas n'ouvrez pas -"],
  ['see', 'fr-FR', 'subj', 'voie voies voie voyions voyiez voient'],
  ['sleep', 'fr-FR', 'ps', 'dormis dormis dormit dormîmes dormîtes dormirent'],
  ['write', 'fr-FR', 'pa', 'eus écrit eus écrit eut écrit eûmes écrit eûtes écrit eurent écrit'],
  ['want', 'fr-FR', 'imper', '- veuille - veuillons veuillez -'],
  ['want', 'fr-FR', 'subjpqp', 'eusse voulu eusses voulu eût voulu eussions voulu eussiez voulu eussent voulu'],
] as [string, Variant, string, string][])('%s %s %s', (id, variant, tense, expected) => {
  expect(row(id, variant, tense)).toBe(expected)
})

test('kinds', () => {
  expect(verbKind(verbById('cook')!, 'es-ES')).toBe('regular')
  expect(verbKind(verbById('play')!, 'pt-BR')).toBe('spelling')
  expect(verbKind(verbById('go')!, 'en-US')).toBe('irregular')
  expect(verbKind(verbById('walk')!, 'en-US')).toBe('regular')
})

test('French elision', () => {
  const pc = (id: string) => table(id, 'fr-FR', 'pc').forms[0]!
  const pres = (id: string) => table(id, 'fr-FR', 'pres').forms[0]!
  expect(say('fr', 0, pc('eat'))).toBe("j'ai mangé")
  expect(say('fr', 0, pres('live'))).toBe("j'habite")
  expect(say('fr', 0, pres('go'))).toBe('je vais')
  expect(verbKind(verbById('dance')!, 'fr-FR')).toBe('regular')
  expect(verbKind(verbById('eat')!, 'fr-FR')).toBe('spelling')
})

test('French subjunctive and imperative subjects', () => {
  expect(say('fr', 2, table('eat', 'fr-FR', 'subj').forms[2]!, table('eat', 'fr-FR', 'subj').tense)).toBe("qu'il mange")
  expect(say('fr', 0, table('have', 'fr-FR', 'subj').forms[0]!, table('have', 'fr-FR', 'subj').tense)).toBe("que j'aie")
  expect(say('fr', 1, table('eat', 'fr-FR', 'imper').forms[1]!, table('eat', 'fr-FR', 'imper').tense)).toBe('mange')
})

test('French pronominal (se laver)', () => {
  expect(row('wash', 'fr-FR', 'pres', true)).toBe('me lave te laves se lave nous lavons vous lavez se lavent')
  expect(row('wash', 'fr-FR', 'pc', true)).toBe("me suis lavé(e) t'es lavé(e) s'est lavé(e) nous sommes lavé(e)s vous êtes lavé(e)s se sont lavé(e)s")
  expect(row('wash', 'fr-FR', 'proche', true)).toBe('vais me laver vas te laver va se laver allons nous laver allez vous laver vont se laver')
  expect(row('wash', 'fr-FR', 'prog', true)).toBe('suis en train de me laver es en train de te laver est en train de se laver sommes en train de nous laver êtes en train de vous laver sont en train de se laver')
  expect(row('wash', 'fr-FR', 'imper', true)).toBe('- lave-toi - lavons-nous lavez-vous -')
  expect(row('wash', 'fr-FR', 'impneg', true)).toBe('- ne te lave pas - ne nous lavons pas ne vous lavez pas -')
  expect(row('wash', 'fr-FR', 'subjp', true)).toBe("me sois lavé(e) te sois lavé(e) se soit lavé(e) nous soyons lavé(e)s vous soyez lavé(e)s se soient lavé(e)s")
  expect(row('wash', 'fr-FR', 'pres', false)).toBe('lave laves lave lavons lavez lavent')
  // only verbs marked pronominal switch
  expect(row('eat', 'fr-FR', 'pres', true)).toBe('mange manges mange mangeons mangez mangent')
})

test('French non-finite forms', () => {
  const nf = (id: string, pron = false) => Object.values(frenchNonFinite(verbById(id)!.fr, pron)).map(formText).join(' | ')
  expect(nf('eat')).toBe('manger | avoir mangé | mangeant | mangé | en mangeant')
  expect(nf('have')).toBe('avoir | avoir eu | ayant | eu | en ayant')
  expect(nf('go')).toBe('aller | être allé(e) | allant | allé | en allant')
  expect(nf('wash', true)).toBe("se laver | s'être lavé(e) | se lavant | lavé | en se lavant")
})

test('content is well-formed', () => {
  for (const v of VERBS) {
    for (const l of [v.es, v.pt]) for (const s of Object.values(l.irr ?? {})) expect(s!.split(' ')).toHaveLength(6)
    for (const t of [...v.ex.flat(), ...v.fr.ex, ...(v.fr.exCA ?? [])]) if (t) expect(t).toMatch(/\{[^}]+\}/)
    expect(v.fr.inf).toBeTruthy()
    if (v.fr.pres) expect(v.fr.pres.split(' ')).toHaveLength(6)
  }
  expect(new Set(VERBS.map((v) => v.id)).size).toBe(VERBS.length)
  // Games tell verbs apart by picture and by French infinitive, so both must be unique.
  expect(new Set(VERBS.map((v) => v.emoji)).size).toBe(VERBS.length)
  expect(new Set(VERBS.map((v) => v.fr.inf)).size).toBe(VERBS.length)
  expect(VERBS.every((v) => v.fr)).toBe(true)
})
