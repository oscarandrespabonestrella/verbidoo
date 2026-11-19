import type { Text3 } from './i18n'

/**
 * Dutch lemma. Weak verbs need only `inf`/`syl`/`ipa` (+ `stem` when it isn't the infinitive minus -en);
 * the engine builds the rest with the 't kofschip rule (-te/-de, -t/-d).
 * `stem` = present stem (maken → maak, geven → geef), `pres` = six present forms when the stem rule breaks (zijn, hebben).
 * `past` = "sg pl" simple past of strong and irregular verbs (at aten), `pp` = past participle when it isn't ge+stem+t/d.
 * `aux: 'zijn'` = perfect with zijn (ik ben gegaan). `sep` = separable particle (aankomen → ik kom aan, aangekomen):
 * every other field then describes the core verb (komen). `prep` = fixed preposition after the verb (houden van).
 * `noGe` = no ge- in the participle (geloven → geloofd). `refl` = also used reflexively (zich wassen).
 * `noImper` = no imperative (modal verbs). `subj` = archaic subjunctive when it isn't the infinitive minus -n.
 * Checked by scripts/wiktionary.test.ts against Wiktionary (kaikki.org); not yet reviewed by a native speaker.
 * `ex` = [present sentence, past sentence], parallel to the en/es/pt sentences; `exBE` = Belgian (Flemish) wording.
 */
export interface NlLemma {
  inf: string; syl: string
  ipa: string
  stem?: string; pres?: string; past?: string; pp?: string
  aux?: 'zijn'; sep?: string; prep?: string; noGe?: true; refl?: true; noImper?: true; imper?: string; subj?: string
  note?: Text3
  ex: [string, string]; exBE?: [string?, string?]
}

const MOTION = {
  en: 'With a destination the perfect uses "zijn" (ik ben naar huis gerend); without one, "hebben".',
  es: 'Con un destino, el perfecto usa «zijn» (ik ben naar huis gerend); sin destino, «hebben».',
  pt: 'Com um destino, o perfeito usa «zijn» (ik ben naar huis gerend); sem destino, «hebben».',
}

export const DUTCH: Record<string, NlLemma> = {
  eat: { inf: 'eten', syl: 'e-ten', ipa: 'ˈeːtə(n)', stem: 'eet', past: 'at aten', pp: 'gegeten', ex: ['Ik {eet} elke dag een appel.', 'Wij {hebben} pizza {gegeten} op het feest.'] },
  drink: { inf: 'drinken', syl: 'drin-ken', ipa: 'ˈdrɪŋkə(n)', past: 'dronk dronken', pp: 'gedronken', ex: ['De kat {drinkt} melk.', 'Ik {heb} een glas water {gedronken}.'] },
  cook: { inf: 'koken', syl: 'ko-ken', ipa: 'ˈkoːkə(n)', stem: 'kook', ex: ['Mijn papa {kookt} rijst.', 'Zij {hebben} samen soep {gekookt}.'] },
  run: {
    inf: 'rennen', syl: 'ren-nen', ipa: 'ˈrɛnə(n)', stem: 'ren', ex: ['De jongen {rent} in het park.', 'Ze {rende} naar school.'],
    note: {
      en: 'In Belgium, "lopen" is the everyday word for "to run"; in the Netherlands "lopen" usually means "to walk".',
      es: 'En Bélgica, «lopen» es la palabra habitual para «correr»; en los Países Bajos, «lopen» suele ser «caminar».',
      pt: 'Na Bélgica, «lopen» é a palavra habitual para «correr»; nos Países Baixos, «lopen» costuma ser «andar».',
    },
  },
  jump: { inf: 'springen', syl: 'sprin-gen', ipa: 'ˈsprɪŋə(n)', past: 'sprong sprongen', pp: 'gesprongen', note: MOTION, ex: ['De kikker {springt} heel hoog.', 'De kinderen {sprongen} op het bed.'] },
  walk: { inf: 'wandelen', syl: 'wan-de-len', ipa: 'ˈʋɑndələ(n)', stem: 'wandel', ex: ['Ik {wandel} met mijn opa.', 'Zij {wandelden} op het strand.'] },
  swim: { inf: 'zwemmen', syl: 'zwem-men', ipa: 'ˈzʋɛmə(n)', stem: 'zwem', past: 'zwom zwommen', pp: 'gezwommen', note: MOTION, ex: ['Vissen {zwemmen} in de zee.', 'Ik {heb} in het meer {gezwommen}.'] },
  dance: { inf: 'dansen', syl: 'dan-sen', ipa: 'ˈdɑnsə(n)', ex: ['Mijn zus {danst} heel goed.', 'Ik {heb} op het feest {gedanst}.'] },
  play: { inf: 'spelen', syl: 'spe-len', ipa: 'ˈspeːlə(n)', stem: 'speel', ex: ['De kinderen {spelen} in de tuin.', 'Ik {speelde} met mijn vrienden.'] },
  sleep: { inf: 'slapen', syl: 'sla-pen', ipa: 'ˈslaːpə(n)', stem: 'slaap', past: 'sliep sliepen', pp: 'geslapen', ex: ['De baby {slaapt} veel.', 'Ik {heb} tien uur {geslapen}.'] },
  wash: {
    inf: 'wassen', syl: 'was-sen', ipa: 'ˈʋɑsə(n)', stem: 'was', pp: 'gewassen', refl: true, ex: ['Ik {was} mijn handen voor het eten.', 'Mama {heeft} de borden {gewassen}.'],
    note: { en: 'Mixed verb: weak past (waste) but strong participle (gewassen).', es: 'Verbo mixto: pasado débil (waste) pero participio fuerte (gewassen).', pt: 'Verbo misto: passado fraco (waste) mas particípio forte (gewassen).' },
  },
  write: { inf: 'schrijven', syl: 'schrij-ven', ipa: 'ˈsxrɛi̯və(n)', stem: 'schrijf', past: 'schreef schreven', pp: 'geschreven', ex: ['Ik {schrijf} mijn naam.', 'Ze {schreef} een brief aan oma.'] },
  read: { inf: 'lezen', syl: 'le-zen', ipa: 'ˈleːzə(n)', stem: 'lees', past: 'las lazen', pp: 'gelezen', ex: ['Ik {lees} elke avond een boek.', 'Wij {hebben} een grappig verhaal {gelezen}.'] },
  draw: { inf: 'tekenen', syl: 'te-ke-nen', ipa: 'ˈteːkənə(n)', stem: 'teken', ex: ['Hij {tekent} een grote zon.', 'Ik {heb} mijn familie {getekend}.'] },
  learn: {
    inf: 'leren', syl: 'le-ren', ipa: 'ˈleːrə(n)', stem: 'leer', ex: ['Wij {leren} nieuwe woorden.', 'Ik {leerde} zwemmen.'],
    note: { en: '"Leren" is both "to learn" and "to teach".', es: '«Leren» es «aprender» y también «enseñar».', pt: '«Leren» é «aprender» e também «ensinar».' },
  },
  study: { inf: 'studeren', syl: 'stu-de-ren', ipa: 'styˈdeːrə(n)', stem: 'studeer', ex: ['Mijn broer {studeert} wiskunde.', 'Zij {hebben} voor de toets {gestudeerd}.'] },
  open: { inf: 'openmaken', syl: 'o-pen-ma-ken', ipa: 'ˈoːpə(n)ˌmaːkə(n)', sep: 'open', stem: 'maak', ex: ['Ze {maakt} het raam {open}.', 'Ik {heb} mijn cadeau {opengemaakt}.'] },
  close: { inf: 'dichtdoen', syl: 'dicht-doen', ipa: 'ˈdɪxtdun', sep: 'dicht', stem: 'doe', past: 'deed deden', pp: 'gedaan', ex: ['Papa {doet} de deur {dicht}.', 'Ik {deed} mijn ogen {dicht}.'] },
  talk: { inf: 'praten', syl: 'pra-ten', ipa: 'ˈpraːtə(n)', stem: 'praat', ex: ['Mijn papegaai {praat}!', 'Wij {praatten} aan de telefoon.'] },
  listen: { inf: 'luisteren', syl: 'luis-te-ren', ipa: 'ˈlœy̯stərə(n)', stem: 'luister', ex: ['Ik {luister} naar muziek.', 'De klas {luisterde} naar de juf.'] },
  sing: { inf: 'zingen', syl: 'zin-gen', ipa: 'ˈzɪŋə(n)', past: 'zong zongen', pp: 'gezongen', ex: ["De vogels {zingen} 's ochtends.", 'Ze {zong} een liedje.'] },
  help: { inf: 'helpen', syl: 'hel-pen', ipa: 'ˈɦɛlpə(n)', past: 'hielp hielpen', pp: 'geholpen', ex: ['Ik {help} mijn mama in de keuken.', 'Mijn vriend {heeft} me {geholpen}.'] },
  climb: { inf: 'klimmen', syl: 'klim-men', ipa: 'ˈklɪmə(n)', stem: 'klim', past: 'klom klommen', pp: 'geklommen', note: MOTION, ex: ['De kat {klimt} in de boom.', 'Wij {klommen} op de berg.'] },
  live: { inf: 'wonen', syl: 'wo-nen', ipa: 'ˈʋoːnə(n)', stem: 'woon', ex: ['Wij {wonen} in een grote stad.', 'Mijn opa en oma {woonden} op een boerderij.'] },
  have: {
    inf: 'hebben', syl: 'heb-ben', ipa: 'ˈɦɛbə(n)', pres: 'heb hebt heeft hebben hebben hebben', past: 'had hadden', pp: 'gehad', imper: 'heb',
    ex: ['Ik {heb} een rode fiets.', 'Wij {hadden} een kat.'],
  },
  go: {
    inf: 'gaan', syl: 'gaan', ipa: 'ɣaːn', stem: 'ga', pres: 'ga gaat gaat gaan gaan gaan', past: 'ging gingen', pp: 'gegaan', aux: 'zijn', subj: 'ga',
    ex: ['Ik {ga} met de bus naar school.', 'Wij {zijn} naar de dierentuin {gegaan}.'], exBE: [undefined, 'Wij {zijn} naar de zoo {gegaan}.'],
    note: { en: 'In Belgium the zoo is usually "de zoo"; in the Netherlands, "de dierentuin".', es: 'En Bélgica el zoológico suele ser «de zoo»; en los Países Bajos, «de dierentuin».', pt: 'Na Bélgica o jardim zoológico costuma ser «de zoo»; nos Países Baixos, «de dierentuin».' },
  },
  make: { inf: 'maken', syl: 'ma-ken', ipa: 'ˈmaːkə(n)', stem: 'maak', ex: ['Oma {maakt} zelf brood.', 'Ik {heb} een papieren vliegtuigje {gemaakt}.'] },
  see: { inf: 'zien', syl: 'zien', ipa: 'zin', stem: 'zie', past: 'zag zagen', pp: 'gezien', subj: 'zie', ex: ['Ik {zie} een regenboog!', 'Wij {zagen} een walvis.'] },
  want: {
    inf: 'willen', syl: 'wil-len', ipa: 'ˈʋɪlə(n)', pres: 'wil wilt wil willen willen willen', past: 'wilde wilden', pp: 'gewild', noImper: true,
    ex: ['Ik {wil} een ijsje.', 'Ze {wilde} een puppy.'],
    note: { en: '"Hij wil" has no -t. In speech the past is often "wou".', es: '«Hij wil» no lleva -t. Al hablar, el pasado suele ser «wou».', pt: '«Hij wil» não leva -t. Na fala, o passado é muitas vezes «wou».' },
  },
  hug: { inf: 'knuffelen', syl: 'knuf-fe-len', ipa: 'ˈknʏfələ(n)', stem: 'knuffel', ex: ['Ik {knuffel} mijn teddybeer.', 'Ze {knuffelde} haar opa.'] },
  // ── The next 30 most frequent verbs (see verbs-more.ts) ──
  be: {
    inf: 'zijn', syl: 'zijn', ipa: 'zɛi̯n', pres: 'ben bent is zijn zijn zijn', past: 'was waren', pp: 'geweest', aux: 'zijn', imper: 'wees', subj: 'zij',
    ex: ['Mijn kat {is} zwart.', 'De film {was} grappig.'],
    note: { en: 'In Flemish speech you may hear "gij zijt" (you are).', es: 'En el habla flamenca se oye «gij zijt» (tú eres).', pt: 'Na fala flamenga ouve-se «gij zijt» (tu és).' },
  },
  say: { inf: 'zeggen', syl: 'zeg-gen', ipa: 'ˈzɛɣə(n)', stem: 'zeg', past: 'zei zeiden', pp: 'gezegd', ex: ['Opa {zegt} hallo.', 'Ze {zei} dankjewel.'] },
  can: {
    inf: 'kunnen', syl: 'kun-nen', ipa: 'ˈkʏnə(n)', pres: 'kan kunt kan kunnen kunnen kunnen', past: 'kon konden', pp: 'gekund', noImper: true,
    ex: ['Wij {kunnen} in de tuin spelen.', 'Ik {kon} niet slapen.'],
    note: { en: '"Jij kunt" and "jij kan" are both correct.', es: '«Jij kunt» y «jij kan» son correctos.', pt: '«Jij kunt» e «jij kan» estão ambos corretos.' },
  },
  know: { inf: 'weten', syl: 'we-ten', ipa: 'ˈʋeːtə(n)', stem: 'weet', past: 'wist wisten', pp: 'geweten', ex: ['Ik {weet} hoe je tot tien telt.', 'Wij {wisten} hoe het liedje ging.'],
    note: { en: '"Weten" is knowing facts; "kennen" is knowing people and places.', es: '«Weten» es saber datos; «kennen» es conocer personas y lugares.', pt: '«Weten» é saber coisas; «kennen» é conhecer pessoas e lugares.' } },
  come: { inf: 'komen', syl: 'ko-men', ipa: 'ˈkoːmə(n)', stem: 'kom', past: 'kwam kwamen', pp: 'gekomen', aux: 'zijn', ex: ['Mijn vriend {komt} naar mijn huis.', 'Oma {is} met de trein {gekomen}.'] },
  must: { inf: 'moeten', syl: 'moe-ten', ipa: 'ˈmutə(n)', stem: 'moet', past: 'moest moesten', pp: 'gemoeten', noImper: true, ex: ['Ik {moet} mijn tanden poetsen.', 'Kinderen {moeten} veel slapen.'] },
  believe: { inf: 'geloven', syl: 'ge-lo-ven', ipa: 'ɣəˈloːvə(n)', stem: 'geloof', noGe: true, ex: ['Ik {geloof} in feeën.', 'Hij {geloofde} mijn verhaal.'] },
  find: { inf: 'vinden', syl: 'vin-den', ipa: 'ˈvɪndə(n)', past: 'vond vonden', pp: 'gevonden', ex: ['Het meisje {vindt} de bal.', 'Ik {heb} een sleutel {gevonden}.'] },
  give: { inf: 'geven', syl: 'ge-ven', ipa: 'ˈɣeːvə(n)', stem: 'geef', past: 'gaf gaven', pp: 'gegeven', ex: ['Ik {geef} een bloem aan mijn mama.', 'Papa {gaf} me een boek.'] },
  take: { inf: 'nemen', syl: 'ne-men', ipa: 'ˈneːmə(n)', stem: 'neem', past: 'nam namen', pp: 'genomen', ex: ['Ik {neem} de bus.', 'Wij {namen} de trein.'] },
  love: {
    inf: 'houden', prep: 'van', syl: 'hou-den', ipa: 'ˈɦɑu̯də(n)', pres: 'hou houdt houdt houden houden houden', imper: 'hou', past: 'hield hielden', pp: 'gehouden',
    ex: ['Ik {hou van} mijn hond.', 'Mijn oma {hield van} bloemen.'],
    note: { en: '"Houden van" = to love. "Ik houd" is also correct, but "ik hou" is what people say.', es: '«Houden van» = querer, amar. «Ik houd» también es correcto, pero se dice «ik hou».', pt: '«Houden van» = amar, gostar muito. «Ik houd» também está correto, mas diz-se «ik hou».' },
  },
  put: {
    inf: 'doen', syl: 'doen', ipa: 'dun', stem: 'doe', past: 'deed deden', pp: 'gedaan', subj: 'doe',
    ex: ['Ik {doe} mijn speelgoed in de doos.', 'Ze {deed} haar jas aan.'],
    note: { en: '"Doen" means "to do", and in everyday speech also "to put".', es: '«Doen» significa «hacer», y en el habla diaria también «poner».', pt: '«Doen» significa «fazer» e, no dia a dia, também «pôr».' },
  },
  ask: { inf: 'vragen', syl: 'vra-gen', ipa: 'ˈvraːɣə(n)', stem: 'vraag', past: 'vroeg vroegen', pp: 'gevraagd', ex: ['De jongen {vraagt} waar het park is.', 'Ze {vroeg} mijn naam.'] },
  think: { inf: 'denken', syl: 'den-ken', ipa: 'ˈdɛŋkə(n)', past: 'dacht dachten', pp: 'gedacht', ex: ['Ik {denk} aan mijn vrienden.', 'Wij {dachten} dat het makkelijk was.'] },
  hear: { inf: 'horen', syl: 'ho-ren', ipa: 'ˈɦoːrə(n)', stem: 'hoor', ex: ['Ik {hoor} een vogel.', 'Wij {hoorden} een hard geluid.'] },
  look: { inf: 'kijken', syl: 'kij-ken', ipa: 'ˈkɛi̯kə(n)', past: 'keek keken', pp: 'gekeken', ex: ['Wij {kijken} naar de sterren.', 'Ze {keek} uit het raam.'] },
  answer: { inf: 'antwoorden', syl: 'ant-woor-den', ipa: 'ˈɑntʋoːrdə(n)', ex: ['Ik {antwoord} op de vraag.', 'Hij {heeft} op mijn brief {geantwoord}.'] },
  meet: {
    inf: 'kennen', syl: 'ken-nen', ipa: 'ˈkɛnə(n)', stem: 'ken', ex: ['Ik {ken} je zus.', 'Zij {kenden} de stad goed.'],
    note: { en: '"Kennen" is knowing people and places; "weten" is knowing facts.', es: '«Kennen» es conocer personas y lugares; «weten» es saber datos.', pt: '«Kennen» é conhecer pessoas e lugares; «weten» é saber coisas.' },
  },
  arrive: { inf: 'aankomen', syl: 'aan-ko-men', ipa: 'ˈaːŋkoːmə(n)', sep: 'aan', stem: 'kom', past: 'kwam kwamen', pp: 'gekomen', aux: 'zijn', ex: ['De bus {komt} om acht uur {aan}.', 'Wij {kwamen} te laat {aan}.'] },
  wait: { inf: 'wachten', syl: 'wach-ten', ipa: 'ˈʋɑxtə(n)', ex: ['Ik {wacht} op mijn vriend.', 'Zij {wachtten} op de bus.'] },
  search: { inf: 'zoeken', syl: 'zoe-ken', ipa: 'ˈzukə(n)', past: 'zocht zochten', pp: 'gezocht', ex: ['Ik {zoek} mijn potlood.', 'Wij {zochten} de kat.'] },
  goout: {
    inf: 'naar buiten gaan', syl: 'naar-bui-ten-gaan', ipa: 'naːr ˈbœy̯tə(n) ɣaːn', sep: 'naar buiten', stem: 'ga', pres: 'ga gaat gaat gaan gaan gaan', past: 'ging gingen', pp: 'gegaan', aux: 'zijn', subj: 'ga',
    ex: ['Wij {gaan} na de lunch {naar buiten}.', 'De kinderen {gingen} {naar buiten} om te spelen.'],
    note: { en: '"Naar buiten" (outside) moves to the end, like a separable verb: ik ga naar buiten.', es: '«Naar buiten» (afuera) va al final, como un verbo separable: ik ga naar buiten.', pt: '«Naar buiten» (para fora) vai para o fim, como um verbo separável: ik ga naar buiten.' },
  },
  understand: { inf: 'begrijpen', syl: 'be-grij-pen', ipa: 'bəˈɣrɛi̯pə(n)', past: 'begreep begrepen', pp: 'begrepen', ex: ['Ik {begrijp} Frans!', 'Ze {begreep} het spel.'] },
  leave: { inf: 'vertrekken', syl: 'ver-trek-ken', ipa: 'vərˈtrɛkə(n)', stem: 'vertrek', past: 'vertrok vertrokken', pp: 'vertrokken', aux: 'zijn', ex: ['De trein {vertrekt} om negen uur.', 'Zij {zijn} op vakantie {vertrokken}.'] },
  call: { inf: 'roepen', syl: 'roe-pen', ipa: 'ˈrupə(n)', past: 'riep riepen', pp: 'geroepen', ex: ['Mama {roept} me voor het eten.', 'Ik {heb} mijn oma {geroepen}.'] },
  fall: { inf: 'vallen', syl: 'val-len', ipa: 'ˈvɑlə(n)', stem: 'val', past: 'viel vielen', pp: 'gevallen', aux: 'zijn', ex: ['De bladeren {vallen} in de herfst.', 'Ik {ben} van mijn fiets {gevallen}.'] },
  start: { inf: 'beginnen', syl: 'be-gin-nen', ipa: 'bəˈɣɪnə(n)', stem: 'begin', past: 'begon begonnen', pp: 'begonnen', aux: 'zijn', ex: ['De school {begint} om acht uur.', 'Het {begon} te regenen.'] },
  finish: {
    inf: 'eindigen', syl: 'ein-di-gen', ipa: 'ˈɛi̯ndəɣə(n)', stem: 'eindig', aux: 'zijn', ex: ['Ik {eindig} mijn tekening.', 'De film {eindigde} laat.'],
    note: { en: '"De film is geëindigd" (it ended) uses zijn; "ik heb mijn tekening geëindigd" (I ended it) uses hebben.', es: '«De film is geëindigd» (terminó) usa zijn; «ik heb mijn tekening geëindigd» (la terminé) usa hebben.', pt: '«De film is geëindigd» (acabou) usa zijn; «ik heb mijn tekening geëindigd» (acabei-o) usa hebben.' },
  },
  work: { inf: 'werken', syl: 'wer-ken', ipa: 'ˈʋɛrkə(n)', ex: ['Mijn mama {werkt} in een ziekenhuis.', 'Wij {hebben} in de tuin {gewerkt}.'] },
  lose: {
    inf: 'verliezen', syl: 'ver-lie-zen', ipa: 'vərˈlizə(n)', stem: 'verlies', past: 'verloor verloren', pp: 'verloren', ex: ['Mijn broer {verliest} altijd zijn sleutels.', 'Ik {verloor} mijn ballon.'],
    note: { en: 'Losing a thing often takes "zijn" (ik ben mijn sleutels verloren); losing a game takes "hebben".', es: 'Perder una cosa suele llevar «zijn» (ik ben mijn sleutels verloren); perder un partido, «hebben».', pt: 'Perder uma coisa costuma levar «zijn» (ik ben mijn sleutels verloren); perder um jogo, «hebben».' },
  },
}
