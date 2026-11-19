import type { UiLang } from './i18n'

/**
 * French and Italian versions of the verb notes in french.ts / dutch.ts, keyed by the English text
 * (a test checks that every note has an entry). Not yet native-reviewed.
 * Where an English note explains a Spanish/Portuguese difference, the French one says something useful to a French speaker instead.
 */
export const NOTES_EXTRA: Record<string, Partial<Record<UiLang, string>>> = {
  // French lemmas
  '"nous mangeons" keeps the e so the g stays soft.': {
    fr: '« nous mangeons » garde le e pour que le g reste doux.',
    it: '«nous mangeons» conserva la e perché la g resti dolce.',
  },
  '"Habiter" means to live somewhere. "Vivre" means to live in general.': {
    fr: '« Habiter », c’est avoir sa maison quelque part. « Vivre », c’est vivre en général.',
    it: '«Habiter» è abitare in un posto. «Vivre» è vivere in generale.',
  },
  'In the passé composé, "aller" uses "être": je suis allé(e).': {
    fr: 'Au passé composé, « aller » se conjugue avec « être » : je suis allé(e).',
    it: 'Nel passé composé «aller» usa «être»: je suis allé(e).',
  },
  '"Faire" means both "make" and "do".': {
    fr: '« Faire » s’utilise pour beaucoup de choses : faire du pain, faire du sport, faire un dessin.',
    it: '«Faire» si usa per tantissime cose: faire du pain, faire un dessin, faire du sport.',
  },
  'Kids often say "faire un câlin" (to give a hug).': {
    fr: 'Les enfants disent souvent « faire un câlin » pour serrer quelqu’un dans leurs bras.',
    it: 'I bambini dicono spesso «faire un câlin» (fare una coccola, abbracciare).',
  },
  '"Être" means "to be". In Spanish and Portuguese it can be "ser" or "estar".': {
    fr: '« Être » sert aussi d’auxiliaire pour certains verbes au passé composé : je suis allé, elle est venue.',
    it: '«Être» vuol dire «essere». In francese non esiste una differenza come quella tra «essere» e «stare».',
  },
  '"Pouvoir" has no imperative: you can\'t order someone to "be able".': {
    fr: '« Pouvoir » n’a pas d’impératif : on ne peut pas ordonner à quelqu’un de « pouvoir ».',
    it: '«Pouvoir» non ha l’imperativo: non puoi ordinare a qualcuno di «potere».',
  },
  '"Savoir" is knowing facts or how to do something; "connaître" is knowing people and places.': {
    fr: '« Savoir », c’est connaître des faits ou savoir comment faire quelque chose ; « connaître », c’est connaître des personnes et des lieux.',
    it: '«Savoir» è sapere dei fatti o sapere come fare qualcosa; «connaître» è conoscere persone e luoghi.',
  },
  '"Aimer" is "love" and also "like": "J\'aime les pommes" = I like apples.': {
    fr: '« Aimer » veut dire « adorer » et aussi « apprécier » : « J’aime les pommes ».',
    it: '«Aimer» è «amare» e anche «piacere»: «J’aime les pommes» = mi piacciono le mele.',
  },
  '"Connaître" is knowing people and places; "savoir" is knowing facts.': {
    fr: '« Connaître », c’est connaître des personnes et des lieux ; « savoir », c’est connaître des faits.',
    it: '«Connaître» è conoscere persone e luoghi; «savoir» è sapere dei fatti.',
  },
  'In Canada, lunch is "le dîner" (in France it is "le déjeuner").': {
    fr: 'Au Canada, le repas de midi s’appelle « le dîner » (en France, « le déjeuner »).',
    it: 'In Canada il pranzo si chiama «le dîner» (in Francia «le déjeuner»).',
  },
  '"Appeler" doubles the L before a silent E: j\'appelle, nous appelons.': {
    fr: '« Appeler » double le L devant un E muet : j’appelle, nous appelons.',
    it: '«Appeler» raddoppia la L davanti a una E muta: j’appelle, nous appelons.',
  },
  // Dutch lemmas
  'With a destination the perfect uses "zijn" (ik ben naar huis gerend); without one, "hebben".': {
    fr: 'Avec une destination, le passé composé utilise « zijn » (ik ben naar huis gerend) ; sans destination, « hebben ».',
    it: 'Con una destinazione il passato prossimo usa «zijn» (ik ben naar huis gerend); senza, «hebben».',
  },
  'In Belgium, "lopen" is the everyday word for "to run"; in the Netherlands "lopen" usually means "to walk".': {
    fr: 'En Belgique, « lopen » est le mot courant pour « courir » ; aux Pays-Bas, « lopen » veut plutôt dire « marcher ».',
    it: 'In Belgio «lopen» è la parola di tutti i giorni per «correre»; nei Paesi Bassi «lopen» di solito vuol dire «camminare».',
  },
  'Mixed verb: weak past (waste) but strong participle (gewassen).': {
    fr: 'Verbe mixte : passé faible (waste) mais participe fort (gewassen).',
    it: 'Verbo misto: passato debole (waste) ma participio forte (gewassen).',
  },
  '"Leren" is both "to learn" and "to teach".': {
    fr: '« Leren » veut dire à la fois « apprendre » et « enseigner ».',
    it: '«Leren» vuol dire sia «imparare» sia «insegnare».',
  },
  'In Belgium the zoo is usually "de zoo"; in the Netherlands, "de dierentuin".': {
    fr: 'En Belgique, le zoo se dit souvent « de zoo » ; aux Pays-Bas, « de dierentuin ».',
    it: 'In Belgio lo zoo di solito è «de zoo»; nei Paesi Bassi, «de dierentuin».',
  },
  '"Hij wil" has no -t. In speech the past is often "wou".': {
    fr: '« Hij wil » n’a pas de -t. À l’oral, le passé est souvent « wou ».',
    it: '«Hij wil» non ha la -t. Parlando, il passato è spesso «wou».',
  },
  'In Flemish speech you may hear "gij zijt" (you are).': {
    fr: 'Dans le parler flamand, on peut entendre « gij zijt » (tu es).',
    it: 'Nel parlato fiammingo si può sentire «gij zijt» (tu sei).',
  },
  '"Jij kunt" and "jij kan" are both correct.': {
    fr: '« Jij kunt » et « jij kan » sont tous les deux corrects.',
    it: '«Jij kunt» e «jij kan» sono entrambi corretti.',
  },
  '"Weten" is knowing facts; "kennen" is knowing people and places.': {
    fr: '« Weten », c’est savoir des faits ; « kennen », c’est connaître des personnes et des lieux.',
    it: '«Weten» è sapere dei fatti; «kennen» è conoscere persone e luoghi.',
  },
  '"Houden van" = to love. "Ik houd" is also correct, but "ik hou" is what people say.': {
    fr: '« Houden van » = aimer. « Ik houd » est aussi correct, mais on dit « ik hou ».',
    it: '«Houden van» = amare, voler bene. «Ik houd» è corretto, ma si dice «ik hou».',
  },
  '"Doen" means "to do", and in everyday speech also "to put".': {
    fr: '« Doen » veut dire « faire » et, dans la langue de tous les jours, aussi « mettre ».',
    it: '«Doen» vuol dire «fare» e, nel parlare di tutti i giorni, anche «mettere».',
  },
  '"Kennen" is knowing people and places; "weten" is knowing facts.': {
    fr: '« Kennen », c’est connaître des personnes et des lieux ; « weten », c’est savoir des faits.',
    it: '«Kennen» è conoscere persone e luoghi; «weten» è sapere dei fatti.',
  },
  '"Naar buiten" (outside) moves to the end, like a separable verb: ik ga naar buiten.': {
    fr: '« Naar buiten » (dehors) passe à la fin, comme un verbe séparable : ik ga naar buiten.',
    it: '«Naar buiten» (fuori) va alla fine, come un verbo separabile: ik ga naar buiten.',
  },
  '"De film is geëindigd" (it ended) uses zijn; "ik heb mijn tekening geëindigd" (I ended it) uses hebben.': {
    fr: '« De film is geëindigd » (il s’est terminé) utilise zijn ; « ik heb mijn tekening geëindigd » (je l’ai terminé) utilise hebben.',
    it: '«De film is geëindigd» (è finito) usa zijn; «ik heb mijn tekening geëindigd» (l’ho finito) usa hebben.',
  },
  'Losing a thing often takes "zijn" (ik ben mijn sleutels verloren); losing a game takes "hebben".': {
    fr: 'Perdre un objet se dit souvent avec « zijn » (ik ben mijn sleutels verloren) ; perdre un match, avec « hebben ».',
    it: 'Perdere un oggetto spesso vuole «zijn» (ik ben mijn sleutels verloren); perdere una partita vuole «hebben».',
  },
}
