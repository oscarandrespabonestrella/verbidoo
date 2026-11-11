import type { UiLang } from './i18n'

/**
 * French lemma. Regular -er verbs need only `inf`/`syl`; the engine builds the rest.
 * `pres` = six present forms when they break the -er pattern (3rd-group and irregular verbs).
 * The imparfait is always built from the `nous` present form (buvons → buvais), so it needs no data.
 * `fut` = irregular future/conditional stem, `pp` = participle when the default (-é / -i / -u) is wrong,
 * `etre` = passé composé with être. `ps` = passé simple theme (bu → bus, bûmes), `subj` = six subjonctif forms,
 * `imper` = tu/nous/vous imperative, `ppres` = participe présent — each only when the rule gets it wrong.
 * `pronominal` = the verb also has a se-form (laver → se laver).
 * Checked by scripts/wiktionary.test.ts against Wiktionary (kaikki.org) tables.
 * `ex` = [present sentence, past sentence], parallel to the en/es/pt sentences; `exCA` = Canadian wording.
 */
export interface FrLemma {
  inf: string; syl: string
  pres?: string; fut?: string; pp?: string; etre?: true
  imp?: string         // imparfait stem when it isn't the nous-present stem (être → ét-)
  noImper?: true       // the verb has no imperative (pouvoir)
  ps?: string; subj?: string; imper?: string; ppres?: string; pronominal?: true
  note?: Record<UiLang, string>
  ex: [string, string]; exCA?: [string?, string?]
}

export const FRENCH: Record<string, FrLemma> = {
  eat: {
    inf: 'manger', syl: 'man-ger', ex: ['Je {mange} une pomme tous les jours.', 'Nous {avons mangé} de la pizza à la fête.'],
    note: { en: '"nous mangeons" keeps the e so the g stays soft.', es: '«nous mangeons» conserva la e para que la g suene suave.', pt: '«nous mangeons» mantém o e para o g soar suave.' },
  },
  drink: { inf: 'boire', syl: 'boire', pres: 'bois bois boit buvons buvez boivent', pp: 'bu', ps: 'bu', ex: ['Le chat {boit} du lait.', "J'{ai bu} un verre d'eau."] },
  cook: { inf: 'cuisiner', syl: 'cui-si-ner', ex: ['Mon papa {cuisine} du riz.', 'Ils {ont cuisiné} de la soupe ensemble.'] },
  run: { inf: 'courir', syl: 'cou-rir', pres: 'cours cours court courons courez courent', fut: 'courr', pp: 'couru', ps: 'couru', ex: ['Le garçon {court} dans le parc.', "Elle {a couru} jusqu'à l'école."] },
  jump: { inf: 'sauter', syl: 'sau-ter', ex: ['La grenouille {saute} très haut.', 'Les enfants {ont sauté} sur le lit.'] },
  walk: { inf: 'marcher', syl: 'mar-cher', ex: ['Je {marche} avec mon grand-père.', 'Elles {ont marché} sur la plage.'] },
  swim: { inf: 'nager', syl: 'na-ger', ex: ['Les poissons {nagent} dans la mer.', "J'{ai nagé} dans le lac."] },
  dance: { inf: 'danser', syl: 'dan-ser', ex: ['Ma sœur {danse} très bien.', "J'{ai dansé} à la fête."] },
  play: { inf: 'jouer', syl: 'jouer', ex: ['Les enfants {jouent} dans le jardin.', "J'{ai joué} avec mes amis."] },
  sleep: { inf: 'dormir', syl: 'dor-mir', pres: 'dors dors dort dormons dormez dorment', ex: ['Le bébé {dort} beaucoup.', "J'{ai dormi} dix heures."] },
  wash: { inf: 'laver', syl: 'la-ver', pronominal: true, ex: ['Je me {lave} les mains avant de manger.', 'Maman {a lavé} les assiettes.'] },
  write: { inf: 'écrire', syl: 'é-crire', pres: 'écris écris écrit écrivons écrivez écrivent', pp: 'écrit', ps: 'écrivi', ex: ["J'{écris} mon nom.", 'Elle {a écrit} une lettre à sa grand-mère.'] },
  read: { inf: 'lire', syl: 'lire', pres: 'lis lis lit lisons lisez lisent', pp: 'lu', ps: 'lu', ex: ['Je {lis} un livre tous les soirs.', 'Nous {avons lu} une histoire drôle.'] },
  draw: { inf: 'dessiner', syl: 'des-si-ner', ex: ['Il {dessine} un grand soleil.', "J'{ai dessiné} ma famille."] },
  learn: { inf: 'apprendre', syl: 'ap-prendre', pres: 'apprends apprends apprend apprenons apprenez apprennent', pp: 'appris', ps: 'appri', ex: ['Nous {apprenons} de nouveaux mots.', "J'{ai appris} à nager."] },
  study: { inf: 'étudier', syl: 'é-tu-dier', ex: ['Mon frère {étudie} les maths.', 'Ils {ont étudié} pour le contrôle.'], exCA: [undefined, "Ils {ont étudié} pour l'examen."] },
  open: { inf: 'ouvrir', syl: 'ou-vrir', pres: 'ouvre ouvres ouvre ouvrons ouvrez ouvrent', pp: 'ouvert', ex: ['Elle {ouvre} la fenêtre.', "J'{ai ouvert} mon cadeau."] },
  close: { inf: 'fermer', syl: 'fer-mer', ex: ['Papa {ferme} la porte.', "J'{ai fermé} les yeux."] },
  talk: { inf: 'parler', syl: 'par-ler', ex: ['Mon perroquet {parle} !', 'Nous {avons parlé} au téléphone.'] },
  listen: { inf: 'écouter', syl: 'é-cou-ter', ex: ["J'{écoute} de la musique.", 'La classe {a écouté} la maîtresse.'] },
  sing: { inf: 'chanter', syl: 'chan-ter', ex: ['Les oiseaux {chantent} le matin.', 'Elle {a chanté} une chanson.'] },
  help: { inf: 'aider', syl: 'ai-der', ex: ["J'{aide} ma maman dans la cuisine.", "Mon ami m'{a aidé}."] },
  climb: { inf: 'grimper', syl: 'grim-per', ex: ["Le chat {grimpe} à l'arbre.", "Nous {avons grimpé} jusqu'en haut de la colline."] },
  live: {
    inf: 'habiter', syl: 'ha-bi-ter', ex: ['Nous {habitons} dans une grande ville.', 'Mes grands-parents {habitaient} dans une ferme.'],
    note: { en: '"Habiter" means to live somewhere. "Vivre" means to live in general.', es: '«Habiter» es vivir en un lugar. «Vivre» es vivir en general.', pt: '«Habiter» é morar num lugar. «Vivre» é viver em geral.' },
  },
  have: { inf: 'avoir', syl: 'a-voir', pres: 'ai as a avons avez ont', fut: 'aur', pp: 'eu', ps: 'eu',
    subj: 'aie aies ait ayons ayez aient', imper: 'aie ayons ayez', ppres: 'ayant',
    ex: ["J'{ai} un vélo rouge.", 'Nous {avions} un chat.'] },
  go: {
    inf: 'aller', syl: 'al-ler', pres: 'vais vas va allons allez vont', fut: 'ir', etre: true,
    subj: 'aille ailles aille allions alliez aillent', imper: 'va allons allez',
    ex: ["Je {vais} à l'école en bus.", 'Nous {sommes allés} au zoo.'], exCA: ["Je {vais} à l'école en autobus."],
    note: { en: 'In the passé composé, "aller" uses "être": je suis allé(e).', es: 'En el passé composé, «aller» usa «être»: je suis allé(e).', pt: 'No passé composé, «aller» usa «être»: je suis allé(e).' },
  },
  make: {
    inf: 'faire', syl: 'faire', pres: 'fais fais fait faisons faites font', fut: 'fer', pp: 'fait', ps: 'fi',
    subj: 'fasse fasses fasse fassions fassiez fassent', ex: ['Grand-mère {fait} du pain.', "J'{ai fait} un avion en papier."],
    note: { en: '"Faire" means both "make" and "do".', es: '«Faire» significa «hacer» en los dos sentidos.', pt: '«Faire» significa «fazer» nos dois sentidos.' },
  },
  see: { inf: 'voir', syl: 'voir', pres: 'vois vois voit voyons voyez voient', fut: 'verr', ps: 'vi', ex: ['Je {vois} un arc-en-ciel !', 'Nous {avons vu} une baleine.'] },
  want: {
    inf: 'vouloir', syl: 'vou-loir', pres: 'veux veux veut voulons voulez veulent', fut: 'voudr', ps: 'voulu',
    subj: 'veuille veuilles veuille voulions vouliez veuillent', imper: 'veuille veuillons veuillez',
    ex: ['Je {veux} une glace.', 'Elle {voulait} un chiot.'], exCA: ['Je {veux} une crème glacée.'],
  },
  hug: {
    inf: 'câliner', syl: 'câ-li-ner', ex: ['Je {câline} mon nounours.', 'Elle {a câliné} son grand-père.'],
    note: { en: 'Kids often say "faire un câlin" (to give a hug).', es: 'Los niños suelen decir «faire un câlin» (dar un abrazo).', pt: 'As crianças costumam dizer «faire un câlin» (dar um abraço).' },
  },
  // ── The next 30 most frequent verbs (see verbs-more.ts) ──
  be: {
    inf: 'être', syl: 'ê-tre', pres: 'suis es est sommes êtes sont', imp: 'ét', fut: 'ser', pp: 'été', ps: 'fu',
    subj: 'sois sois soit soyons soyez soient', imper: 'sois soyons soyez', ppres: 'étant',
    ex: ['Mon chat {est} noir.', 'Le film {était} drôle.'],
    note: { en: '"Être" means "to be". In Spanish and Portuguese it can be "ser" or "estar".', es: '«Être» es «ser» y también «estar».', pt: '«Être» é «ser» e também «estar».' },
  },
  say: { inf: 'dire', syl: 'dire', pres: 'dis dis dit disons dites disent', pp: 'dit', ps: 'di', ex: ['Grand-père {dit} bonjour.', 'Elle {a dit} merci.'] },
  can: {
    inf: 'pouvoir', syl: 'pou-voir', pres: 'peux peux peut pouvons pouvez peuvent', fut: 'pourr', pp: 'pu', ps: 'pu',
    subj: 'puisse puisses puisse puissions puissiez puissent', noImper: true,
    ex: ['Nous {pouvons} jouer dans le jardin.', 'Je ne {pouvais} pas dormir.'],
    note: { en: '"Pouvoir" has no imperative: you can\'t order someone to "be able".', es: '«Pouvoir» no tiene imperativo.', pt: '«Pouvoir» não tem imperativo.' },
  },
  know: {
    inf: 'savoir', syl: 'sa-voir', pres: 'sais sais sait savons savez savent', fut: 'saur', pp: 'su', ps: 'su',
    subj: 'sache saches sache sachions sachiez sachent', imper: 'sache sachons sachez', ppres: 'sachant',
    ex: ["Je {sais} compter jusqu'à dix.", 'Nous {savions} la chanson.'],
    note: { en: '"Savoir" is knowing facts or how to do something; "connaître" is knowing people and places.', es: '«Savoir» es saber datos o cómo hacer algo; «connaître» es conocer personas y lugares.', pt: '«Savoir» é saber coisas ou como fazer algo; «connaître» é conhecer pessoas e lugares.' },
  },
  come: {
    inf: 'venir', syl: 've-nir', pres: 'viens viens vient venons venez viennent', fut: 'viendr', pp: 'venu', ps: 'vin', etre: true,
    ex: ['Mon ami {vient} chez moi.', 'Grand-mère {est venue} en train.'],
  },
  must: {
    inf: 'devoir', syl: 'de-voir', pres: 'dois dois doit devons devez doivent', fut: 'devr', pp: 'dû', ps: 'du',
    ex: ['Je {dois} me brosser les dents.', 'Les enfants {doivent} beaucoup dormir.'],
  },
  believe: { inf: 'croire', syl: 'croire', pres: 'crois crois croit croyons croyez croient', pp: 'cru', ps: 'cru', ex: ['Je {crois} aux fées.', 'Il {a cru} mon histoire.'] },
  find: { inf: 'trouver', syl: 'trou-ver', ex: ['La petite fille {trouve} la balle.', "J'{ai trouvé} une clé."] },
  give: { inf: 'donner', syl: 'don-ner', ex: ['Je {donne} une fleur à ma maman.', "Papa m'{a donné} un livre."] },
  take: {
    inf: 'prendre', syl: 'prendre', pres: 'prends prends prend prenons prenez prennent', pp: 'pris', ps: 'pri',
    ex: ['Je {prends} le bus.', 'Nous {avons pris} le train.'], exCA: ["Je {prends} l'autobus."],
  },
  love: {
    inf: 'aimer', syl: 'ai-mer', ex: ["J'{aime} mon chien.", 'Ma grand-mère {aimait} les fleurs.'],
    note: { en: '"Aimer" is "love" and also "like": "J\'aime les pommes" = I like apples.', es: '«Aimer» es «amar» y también «gustar»: «J\'aime les pommes» = me gustan las manzanas.', pt: '«Aimer» é «amar» e também «gostar»: «J\'aime les pommes» = gosto de maçãs.' },
  },
  put: { inf: 'mettre', syl: 'mettre', pres: 'mets mets met mettons mettez mettent', pp: 'mis', ps: 'mi', ex: ['Je {mets} mes jouets dans la boîte.', 'Elle {a mis} son manteau.'] },
  ask: { inf: 'demander', syl: 'de-man-der', ex: ['Le garçon {demande} où est le parc.', 'Elle {a demandé} mon nom.'] },
  think: { inf: 'penser', syl: 'pen-ser', ex: ['Je {pense} à mes amis.', "Nous {avons pensé} que c'était facile."] },
  hear: { inf: 'entendre', syl: 'en-tendre', pres: 'entends entends entend entendons entendez entendent', ps: 'entendi', ex: ["J'{entends} un oiseau.", 'Nous {avons entendu} un grand bruit.'] },
  look: { inf: 'regarder', syl: 're-gar-der', ex: ['Nous {regardons} les étoiles.', 'Elle {a regardé} par la fenêtre.'] },
  answer: { inf: 'répondre', syl: 'ré-pondre', pres: 'réponds réponds répond répondons répondez répondent', ps: 'répondi', ex: ['Je {réponds} à la question.', 'Il {a répondu} à ma lettre.'] },
  meet: {
    inf: 'connaître', syl: 'con-naître', pres: 'connais connais connaît connaissons connaissez connaissent', pp: 'connu', ps: 'connu',
    ex: ['Je {connais} ta sœur.', 'Ils {connaissaient} bien la ville.'],
    note: { en: '"Connaître" is knowing people and places; "savoir" is knowing facts.', es: '«Connaître» es conocer personas y lugares; «savoir» es saber datos.', pt: '«Connaître» é conhecer pessoas e lugares; «savoir» é saber coisas.' },
  },
  arrive: {
    inf: 'arriver', syl: 'ar-ri-ver', etre: true,
    ex: ['Le bus {arrive} à huit heures.', 'Nous {sommes arrivés} en retard.'], exCA: ["L'autobus {arrive} à huit heures."],
  },
  wait: {
    inf: 'attendre', syl: 'at-tendre', pres: 'attends attends attend attendons attendez attendent', ps: 'attendi',
    ex: ["J'{attends} mon ami.", 'Ils {ont attendu} le bus.'], exCA: [undefined, "Ils {ont attendu} l'autobus."],
  },
  search: { inf: 'chercher', syl: 'cher-cher', ex: ['Je {cherche} mon crayon.', 'Nous {avons cherché} le chat.'] },
  goout: {
    inf: 'sortir', syl: 'sor-tir', pres: 'sors sors sort sortons sortez sortent', etre: true,
    ex: ['Nous {sortons} après le déjeuner.', 'Les enfants {sont sortis} jouer.'], exCA: ['Nous {sortons} après le dîner.'],
    note: { en: 'In Canada, lunch is "le dîner" (in France it is "le déjeuner").', es: 'En Canadá, el almuerzo se llama «le dîner» (en Francia, «le déjeuner»).', pt: 'No Canadá, o almoço chama-se «le dîner» (em França, «le déjeuner»).' },
  },
  understand: {
    inf: 'comprendre', syl: 'com-prendre', pres: 'comprends comprends comprend comprenons comprenez comprennent', pp: 'compris', ps: 'compri',
    ex: ['Je {comprends} le français !', 'Elle {a compris} le jeu.'],
  },
  leave: { inf: 'partir', syl: 'par-tir', pres: 'pars pars part partons partez partent', etre: true, ex: ['Le train {part} à neuf heures.', 'Ils {sont partis} en vacances.'] },
  call: {
    inf: 'appeler', syl: 'ap-pe-ler', pres: 'appelle appelles appelle appelons appelez appellent', fut: 'appeller',
    ex: ["Maman m'{appelle} pour le dîner.", "J'{ai appelé} ma grand-mère."], exCA: ["Maman m'{appelle} pour le souper."],
    note: { en: '"Appeler" doubles the L before a silent E: j\'appelle, nous appelons.', es: '«Appeler» duplica la L delante de una E muda: j\'appelle, nous appelons.', pt: '«Appeler» dobra o L antes de um E mudo: j\'appelle, nous appelons.' },
  },
  fall: { inf: 'tomber', syl: 'tom-ber', etre: true, ex: ['Les feuilles {tombent} en automne.', 'Je {suis tombé} de mon vélo.'] },
  start: { inf: 'commencer', syl: 'com-men-cer', ex: ["L'école {commence} à huit heures.", 'Il {a commencé} à pleuvoir.'] },
  finish: { inf: 'finir', syl: 'fi-nir', pres: 'finis finis finit finissons finissez finissent', ex: ['Je {finis} mon dessin.', 'Le film {a fini} tard.'] },
  work: { inf: 'travailler', syl: 'tra-vail-ler', ex: ['Ma maman {travaille} dans un hôpital.', 'Nous {avons travaillé} dans le jardin.'] },
  lose: { inf: 'perdre', syl: 'perdre', pres: 'perds perds perd perdons perdez perdent', ps: 'perdi', ex: ['Mon frère {perd} toujours ses clés.', "J'{ai perdu} mon ballon."] },
}
