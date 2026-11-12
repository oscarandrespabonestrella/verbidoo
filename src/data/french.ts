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
/**
 * Spoken stems ("bases", Dubois 1967): what you hear change, since most endings are silent.
 * Each entry is `written:ipa`. `pres` lists the present-tense stems; `map` gives the stem per person
 * (default by count: 1 → 000000, 2 → 000111 dor/dorm, 3 → 000112 peu/pouv/peuv). The other fields
 * are only needed when the engine can't derive the stem (irregular futur, subjonctif, passé simple, participle).
 * Plain -er verbs need nothing. Not yet reviewed by a native speaker.
 */
export interface Stems { pres: string; map?: string; imp?: string; fut?: string; subj?: string; ps?: string; pp?: string }

export interface FrLemma {
  inf: string; syl: string
  ipa: string          // broad IPA of the infinitive, without slashes (manger → mɑ̃ʒe)
  pres?: string; fut?: string; pp?: string; etre?: true
  imp?: string         // imparfait stem when it isn't the nous-present stem (être → ét-)
  noImper?: true       // the verb has no imperative (pouvoir)
  ps?: string; subj?: string; imper?: string; ppres?: string; pronominal?: true
  stems?: Stems

  note?: Record<UiLang, string>
  ex: [string, string]; exCA?: [string?, string?]
}

export const FRENCH: Record<string, FrLemma> = {
  eat: {
    inf: 'manger', ipa: 'mɑ̃ʒe', syl: 'man-ger', ex: ['Je {mange} une pomme tous les jours.', 'Nous {avons mangé} de la pizza à la fête.'],
    note: { en: '"nous mangeons" keeps the e so the g stays soft.', es: '«nous mangeons» conserva la e para que la g suene suave.', pt: '«nous mangeons» mantém o e para o g soar suave.' },
  },
  drink: { inf: 'boire', stems: { pres: 'boi:bwa buv:byv boiv:bwav', ps: 'bu:by', pp: 'bu:by' }, ipa: 'bwaʁ', syl: 'boire', pres: 'bois bois boit buvons buvez boivent', pp: 'bu', ps: 'bu', ex: ['Le chat {boit} du lait.', "J'{ai bu} un verre d'eau."] },
  cook: { inf: 'cuisiner', ipa: 'kɥizine', syl: 'cui-si-ner', ex: ['Mon papa {cuisine} du riz.', 'Ils {ont cuisiné} de la soupe ensemble.'] },
  run: { inf: 'courir', stems: { pres: 'cour:kuʁ', fut: 'courr:kuʁʁ', ps: 'couru:kuʁy', pp: 'couru:kuʁy' }, ipa: 'kuʁiʁ', syl: 'cou-rir', pres: 'cours cours court courons courez courent', fut: 'courr', pp: 'couru', ps: 'couru', ex: ['Le garçon {court} dans le parc.', "Elle {a couru} jusqu'à l'école."] },
  jump: { inf: 'sauter', ipa: 'sote', syl: 'sau-ter', ex: ['La grenouille {saute} très haut.', 'Les enfants {ont sauté} sur le lit.'] },
  walk: { inf: 'marcher', ipa: 'maʁʃe', syl: 'mar-cher', ex: ['Je {marche} avec mon grand-père.', 'Elles {ont marché} sur la plage.'] },
  swim: { inf: 'nager', ipa: 'naʒe', syl: 'na-ger', ex: ['Les poissons {nagent} dans la mer.', "J'{ai nagé} dans le lac."] },
  dance: { inf: 'danser', ipa: 'dɑ̃se', syl: 'dan-ser', ex: ['Ma sœur {danse} très bien.', "J'{ai dansé} à la fête."] },
  play: { inf: 'jouer', stems: { pres: 'jou:ʒu', fut: 'jouer:ʒuʁ' }, ipa: 'ʒwe', syl: 'jouer', ex: ['Les enfants {jouent} dans le jardin.', "J'{ai joué} avec mes amis."] },
  sleep: { inf: 'dormir', stems: { pres: 'dor:dɔʁ dorm:dɔʁm' }, ipa: 'dɔʁmiʁ', syl: 'dor-mir', pres: 'dors dors dort dormons dormez dorment', ex: ['Le bébé {dort} beaucoup.', "J'{ai dormi} dix heures."] },
  wash: { inf: 'laver', ipa: 'lave', syl: 'la-ver', pronominal: true, ex: ['Je me {lave} les mains avant de manger.', 'Maman {a lavé} les assiettes.'] },
  write: { inf: 'écrire', stems: { pres: 'écri:ekʁi écriv:ekʁiv', ps: 'écrivi:ekʁivi', pp: 'écrit:ekʁi' }, ipa: 'ekʁiʁ', syl: 'é-crire', pres: 'écris écris écrit écrivons écrivez écrivent', pp: 'écrit', ps: 'écrivi', ex: ["J'{écris} mon nom.", 'Elle {a écrit} une lettre à sa grand-mère.'] },
  read: { inf: 'lire', stems: { pres: 'li:li lis:liz', ps: 'lu:ly', pp: 'lu:ly' }, ipa: 'liʁ', syl: 'lire', pres: 'lis lis lit lisons lisez lisent', pp: 'lu', ps: 'lu', ex: ['Je {lis} un livre tous les soirs.', 'Nous {avons lu} une histoire drôle.'] },
  draw: { inf: 'dessiner', ipa: 'desine', syl: 'des-si-ner', ex: ['Il {dessine} un grand soleil.', "J'{ai dessiné} ma famille."] },
  learn: { inf: 'apprendre', stems: { pres: 'appren:apʁɑ̃ appren:apʁən apprenn:apʁɛn', ps: 'appri:apʁi', pp: 'appris:apʁi' }, ipa: 'apʁɑ̃dʁ', syl: 'ap-prendre', pres: 'apprends apprends apprend apprenons apprenez apprennent', pp: 'appris', ps: 'appri', ex: ['Nous {apprenons} de nouveaux mots.', "J'{ai appris} à nager."] },
  study: { inf: 'étudier', stems: { pres: 'étudi:etydi', fut: 'étudier:etydiʁ' }, ipa: 'etydje', syl: 'é-tu-dier', ex: ['Mon frère {étudie} les maths.', 'Ils {ont étudié} pour le contrôle.'], exCA: [undefined, "Ils {ont étudié} pour l'examen."] },
  open: { inf: 'ouvrir', stems: { pres: 'ouvr:uvʁ', pp: 'ouvert:uvɛʁ' }, ipa: 'uvʁiʁ', syl: 'ou-vrir', pres: 'ouvre ouvres ouvre ouvrons ouvrez ouvrent', pp: 'ouvert', ex: ['Elle {ouvre} la fenêtre.', "J'{ai ouvert} mon cadeau."] },
  close: { inf: 'fermer', ipa: 'fɛʁme', syl: 'fer-mer', ex: ['Papa {ferme} la porte.', "J'{ai fermé} les yeux."] },
  talk: { inf: 'parler', ipa: 'paʁle', syl: 'par-ler', ex: ['Mon perroquet {parle} !', 'Nous {avons parlé} au téléphone.'] },
  listen: { inf: 'écouter', ipa: 'ekute', syl: 'é-cou-ter', ex: ["J'{écoute} de la musique.", 'La classe {a écouté} la maîtresse.'] },
  sing: { inf: 'chanter', ipa: 'ʃɑ̃te', syl: 'chan-ter', ex: ['Les oiseaux {chantent} le matin.', 'Elle {a chanté} une chanson.'] },
  help: { inf: 'aider', stems: { pres: 'aid:ɛd' }, ipa: 'ede', syl: 'ai-der', ex: ["J'{aide} ma maman dans la cuisine.", "Mon ami m'{a aidé}."] },
  climb: { inf: 'grimper', ipa: 'ɡʁɛ̃pe', syl: 'grim-per', ex: ["Le chat {grimpe} à l'arbre.", "Nous {avons grimpé} jusqu'en haut de la colline."] },
  live: {
    inf: 'habiter', ipa: 'abite', syl: 'ha-bi-ter', ex: ['Nous {habitons} dans une grande ville.', 'Mes grands-parents {habitaient} dans une ferme.'],
    note: { en: '"Habiter" means to live somewhere. "Vivre" means to live in general.', es: '«Habiter» es vivir en un lugar. «Vivre» es vivir en general.', pt: '«Habiter» é morar num lugar. «Vivre» é viver em geral.' },
  },
  have: { inf: 'avoir', stems: { pres: 'ai:e a:a av:av on:ɔ̃', map: '011223', fut: 'aur:oʁ', subj: 'ai:ɛ ay:ɛj', ps: 'eu:y', pp: 'eu:y' }, ipa: 'avwaʁ', syl: 'a-voir', pres: 'ai as a avons avez ont', fut: 'aur', pp: 'eu', ps: 'eu',
    subj: 'aie aies ait ayons ayez aient', imper: 'aie ayons ayez', ppres: 'ayant',
    ex: ["J'{ai} un vélo rouge.", 'Nous {avions} un chat.'] },
  go: {
    inf: 'aller', stems: { pres: 'vai:vɛ va:va all:al von:vɔ̃', map: '011223', fut: 'ir:iʁ', subj: 'aill:aj' }, ipa: 'ale', syl: 'al-ler', pres: 'vais vas va allons allez vont', fut: 'ir', etre: true,
    subj: 'aille ailles aille allions alliez aillent', imper: 'va allons allez',
    ex: ["Je {vais} à l'école en bus.", 'Nous {sommes allés} au zoo.'], exCA: ["Je {vais} à l'école en autobus."],
    note: { en: 'In the passé composé, "aller" uses "être": je suis allé(e).', es: 'En el passé composé, «aller» usa «être»: je suis allé(e).', pt: 'No passé composé, «aller» usa «être»: je suis allé(e).' },
  },
  make: {
    inf: 'faire', stems: { pres: 'fai:fɛ fais:fəz fait:fɛt fon:fɔ̃', map: '000123', fut: 'fer:fəʁ', subj: 'fass:fas', ps: 'fi:fi', pp: 'fait:fɛ' }, ipa: 'fɛʁ', syl: 'faire', pres: 'fais fais fait faisons faites font', fut: 'fer', pp: 'fait', ps: 'fi',
    subj: 'fasse fasses fasse fassions fassiez fassent', ex: ['Grand-mère {fait} du pain.', "J'{ai fait} un avion en papier."],
    note: { en: '"Faire" means both "make" and "do".', es: '«Faire» significa «hacer» en los dos sentidos.', pt: '«Faire» significa «fazer» nos dois sentidos.' },
  },
  see: { inf: 'voir', stems: { pres: 'voi:vwa voy:vwaj', map: '000110', fut: 'verr:vɛʁ', ps: 'vi:vi', pp: 'vu:vy' }, ipa: 'vwaʁ', syl: 'voir', pres: 'vois vois voit voyons voyez voient', fut: 'verr', ps: 'vi', ex: ['Je {vois} un arc-en-ciel !', 'Nous {avons vu} une baleine.'] },
  want: {
    inf: 'vouloir', stems: { pres: 'veu:vø voul:vul veul:vœl', fut: 'voudr:vudʁ', subj: 'veuill:vœj', ps: 'voulu:vuly', pp: 'voulu:vuly' }, ipa: 'vulwaʁ', syl: 'vou-loir', pres: 'veux veux veut voulons voulez veulent', fut: 'voudr', ps: 'voulu',
    subj: 'veuille veuilles veuille voulions vouliez veuillent', imper: 'veuille veuillons veuillez',
    ex: ['Je {veux} une glace.', 'Elle {voulait} un chiot.'], exCA: ['Je {veux} une crème glacée.'],
  },
  hug: {
    inf: 'câliner', ipa: 'kaline', syl: 'câ-li-ner', ex: ['Je {câline} mon nounours.', 'Elle {a câliné} son grand-père.'],
    note: { en: 'Kids often say "faire un câlin" (to give a hug).', es: 'Los niños suelen decir «faire un câlin» (dar un abrazo).', pt: 'As crianças costumam dizer «faire un câlin» (dar um abraço).' },
  },
  // ── The next 30 most frequent verbs (see verbs-more.ts) ──
  be: {
    inf: 'être', stems: { pres: 'sui:sɥi e:ɛ somm:sɔm êt:ɛt son:sɔ̃', map: '011234', imp: 'ét:et', fut: 'ser:səʁ', subj: 'soi:swa soy:swaj', ps: 'fu:fy', pp: 'été:ete' }, ipa: 'ɛtʁ', syl: 'ê-tre', pres: 'suis es est sommes êtes sont', imp: 'ét', fut: 'ser', pp: 'été', ps: 'fu',
    subj: 'sois sois soit soyons soyez soient', imper: 'sois soyons soyez', ppres: 'étant',
    ex: ['Mon chat {est} noir.', 'Le film {était} drôle.'],
    note: { en: '"Être" means "to be". In Spanish and Portuguese it can be "ser" or "estar".', es: '«Être» es «ser» y también «estar».', pt: '«Être» é «ser» e também «estar».' },
  },
  say: { inf: 'dire', stems: { pres: 'di:di dis:diz dit:dit', map: '000121', ps: 'di:di', pp: 'dit:di' }, ipa: 'diʁ', syl: 'dire', pres: 'dis dis dit disons dites disent', pp: 'dit', ps: 'di', ex: ['Grand-père {dit} bonjour.', 'Elle {a dit} merci.'] },
  can: {
    inf: 'pouvoir', stems: { pres: 'peu:pø pouv:puv peuv:pœv', fut: 'pourr:puʁ', subj: 'puiss:pɥis', ps: 'pu:py', pp: 'pu:py' }, ipa: 'puvwaʁ', syl: 'pou-voir', pres: 'peux peux peut pouvons pouvez peuvent', fut: 'pourr', pp: 'pu', ps: 'pu',
    subj: 'puisse puisses puisse puissions puissiez puissent', noImper: true,
    ex: ['Nous {pouvons} jouer dans le jardin.', 'Je ne {pouvais} pas dormir.'],
    note: { en: '"Pouvoir" has no imperative: you can\'t order someone to "be able".', es: '«Pouvoir» no tiene imperativo.', pt: '«Pouvoir» não tem imperativo.' },
  },
  know: {
    inf: 'savoir', stems: { pres: 'sai:sɛ sav:sav', fut: 'saur:soʁ', subj: 'sach:saʃ', ps: 'su:sy', pp: 'su:sy' }, ipa: 'savwaʁ', syl: 'sa-voir', pres: 'sais sais sait savons savez savent', fut: 'saur', pp: 'su', ps: 'su',
    subj: 'sache saches sache sachions sachiez sachent', imper: 'sache sachons sachez', ppres: 'sachant',
    ex: ["Je {sais} compter jusqu'à dix.", 'Nous {savions} la chanson.'],
    note: { en: '"Savoir" is knowing facts or how to do something; "connaître" is knowing people and places.', es: '«Savoir» es saber datos o cómo hacer algo; «connaître» es conocer personas y lugares.', pt: '«Savoir» é saber coisas ou como fazer algo; «connaître» é conhecer pessoas e lugares.' },
  },
  come: {
    inf: 'venir', stems: { pres: 'vien:vjɛ̃ ven:vən vienn:vjɛn', fut: 'viendr:vjɛ̃dʁ', ps: 'vin:vɛ̃', pp: 'venu:vəny' }, ipa: 'vəniʁ', syl: 've-nir', pres: 'viens viens vient venons venez viennent', fut: 'viendr', pp: 'venu', ps: 'vin', etre: true,
    ex: ['Mon ami {vient} chez moi.', 'Grand-mère {est venue} en train.'],
  },
  must: {
    inf: 'devoir', stems: { pres: 'doi:dwa dev:dəv doiv:dwav', fut: 'devr:dəvʁ', ps: 'du:dy', pp: 'dû:dy' }, ipa: 'dəvwaʁ', syl: 'de-voir', pres: 'dois dois doit devons devez doivent', fut: 'devr', pp: 'dû', ps: 'du',
    ex: ['Je {dois} me brosser les dents.', 'Les enfants {doivent} beaucoup dormir.'],
  },
  believe: { inf: 'croire', stems: { pres: 'croi:kʁwa croy:kʁwaj', map: '000110', ps: 'cru:kʁy', pp: 'cru:kʁy' }, ipa: 'kʁwaʁ', syl: 'croire', pres: 'crois crois croit croyons croyez croient', pp: 'cru', ps: 'cru', ex: ['Je {crois} aux fées.', 'Il {a cru} mon histoire.'] },
  find: { inf: 'trouver', ipa: 'tʁuve', syl: 'trou-ver', ex: ['La petite fille {trouve} la balle.', "J'{ai trouvé} une clé."] },
  give: { inf: 'donner', ipa: 'dɔne', syl: 'don-ner', ex: ['Je {donne} une fleur à ma maman.', "Papa m'{a donné} un livre."] },
  take: {
    inf: 'prendre', stems: { pres: 'pren:pʁɑ̃ pren:pʁən prenn:pʁɛn', ps: 'pri:pʁi', pp: 'pris:pʁi' }, ipa: 'pʁɑ̃dʁ', syl: 'prendre', pres: 'prends prends prend prenons prenez prennent', pp: 'pris', ps: 'pri',
    ex: ['Je {prends} le bus.', 'Nous {avons pris} le train.'], exCA: ["Je {prends} l'autobus."],
  },
  love: {
    inf: 'aimer', stems: { pres: 'aim:ɛm' }, ipa: 'eme', syl: 'ai-mer', ex: ["J'{aime} mon chien.", 'Ma grand-mère {aimait} les fleurs.'],
    note: { en: '"Aimer" is "love" and also "like": "J\'aime les pommes" = I like apples.', es: '«Aimer» es «amar» y también «gustar»: «J\'aime les pommes» = me gustan las manzanas.', pt: '«Aimer» é «amar» e também «gostar»: «J\'aime les pommes» = gosto de maçãs.' },
  },
  put: { inf: 'mettre', stems: { pres: 'met:mɛ mett:mɛt', ps: 'mi:mi', pp: 'mis:mi' }, ipa: 'mɛtʁ', syl: 'mettre', pres: 'mets mets met mettons mettez mettent', pp: 'mis', ps: 'mi', ex: ['Je {mets} mes jouets dans la boîte.', 'Elle {a mis} son manteau.'] },
  ask: { inf: 'demander', ipa: 'dəmɑ̃de', syl: 'de-man-der', ex: ['Le garçon {demande} où est le parc.', 'Elle {a demandé} mon nom.'] },
  think: { inf: 'penser', ipa: 'pɑ̃se', syl: 'pen-ser', ex: ['Je {pense} à mes amis.', "Nous {avons pensé} que c'était facile."] },
  hear: { inf: 'entendre', stems: { pres: 'enten:ɑ̃tɑ̃ entend:ɑ̃tɑ̃d', ps: 'entendi:ɑ̃tɑ̃di' }, ipa: 'ɑ̃tɑ̃dʁ', syl: 'en-tendre', pres: 'entends entends entend entendons entendez entendent', ps: 'entendi', ex: ["J'{entends} un oiseau.", 'Nous {avons entendu} un grand bruit.'] },
  look: { inf: 'regarder', ipa: 'ʁəɡaʁde', syl: 're-gar-der', ex: ['Nous {regardons} les étoiles.', 'Elle {a regardé} par la fenêtre.'] },
  answer: { inf: 'répondre', stems: { pres: 'répon:ʁepɔ̃ répond:ʁepɔ̃d', ps: 'répondi:ʁepɔ̃di' }, ipa: 'ʁepɔ̃dʁ', syl: 'ré-pondre', pres: 'réponds réponds répond répondons répondez répondent', ps: 'répondi', ex: ['Je {réponds} à la question.', 'Il {a répondu} à ma lettre.'] },
  meet: {
    inf: 'connaître', stems: { pres: 'connai:kɔnɛ connaiss:kɔnɛs', ps: 'connu:kɔny', pp: 'connu:kɔny' }, ipa: 'kɔnɛtʁ', syl: 'con-naître', pres: 'connais connais connaît connaissons connaissez connaissent', pp: 'connu', ps: 'connu',
    ex: ['Je {connais} ta sœur.', 'Ils {connaissaient} bien la ville.'],
    note: { en: '"Connaître" is knowing people and places; "savoir" is knowing facts.', es: '«Connaître» es conocer personas y lugares; «savoir» es saber datos.', pt: '«Connaître» é conhecer pessoas e lugares; «savoir» é saber coisas.' },
  },
  arrive: {
    inf: 'arriver', ipa: 'aʁive', syl: 'ar-ri-ver', etre: true,
    ex: ['Le bus {arrive} à huit heures.', 'Nous {sommes arrivés} en retard.'], exCA: ["L'autobus {arrive} à huit heures."],
  },
  wait: {
    inf: 'attendre', stems: { pres: 'atten:atɑ̃ attend:atɑ̃d', ps: 'attendi:atɑ̃di' }, ipa: 'atɑ̃dʁ', syl: 'at-tendre', pres: 'attends attends attend attendons attendez attendent', ps: 'attendi',
    ex: ["J'{attends} mon ami.", 'Ils {ont attendu} le bus.'], exCA: [undefined, "Ils {ont attendu} l'autobus."],
  },
  search: { inf: 'chercher', ipa: 'ʃɛʁʃe', syl: 'cher-cher', ex: ['Je {cherche} mon crayon.', 'Nous {avons cherché} le chat.'] },
  goout: {
    inf: 'sortir', stems: { pres: 'sor:sɔʁ sort:sɔʁt' }, ipa: 'sɔʁtiʁ', syl: 'sor-tir', pres: 'sors sors sort sortons sortez sortent', etre: true,
    ex: ['Nous {sortons} après le déjeuner.', 'Les enfants {sont sortis} jouer.'], exCA: ['Nous {sortons} après le dîner.'],
    note: { en: 'In Canada, lunch is "le dîner" (in France it is "le déjeuner").', es: 'En Canadá, el almuerzo se llama «le dîner» (en Francia, «le déjeuner»).', pt: 'No Canadá, o almoço chama-se «le dîner» (em França, «le déjeuner»).' },
  },
  understand: {
    inf: 'comprendre', stems: { pres: 'compren:kɔ̃pʁɑ̃ compren:kɔ̃pʁən comprenn:kɔ̃pʁɛn', ps: 'compri:kɔ̃pʁi', pp: 'compris:kɔ̃pʁi' }, ipa: 'kɔ̃pʁɑ̃dʁ', syl: 'com-prendre', pres: 'comprends comprends comprend comprenons comprenez comprennent', pp: 'compris', ps: 'compri',
    ex: ['Je {comprends} le français !', 'Elle {a compris} le jeu.'],
  },
  leave: { inf: 'partir', stems: { pres: 'par:paʁ part:paʁt' }, ipa: 'paʁtiʁ', syl: 'par-tir', pres: 'pars pars part partons partez partent', etre: true, ex: ['Le train {part} à neuf heures.', 'Ils {sont partis} en vacances.'] },
  call: {
    inf: 'appeler', stems: { pres: 'appell:apɛl appel:apəl', map: '000110', fut: 'appeller:apɛlʁ' }, ipa: 'apəle', syl: 'ap-pe-ler', pres: 'appelle appelles appelle appelons appelez appellent', fut: 'appeller',
    ex: ["Maman m'{appelle} pour le dîner.", "J'{ai appelé} ma grand-mère."], exCA: ["Maman m'{appelle} pour le souper."],
    note: { en: '"Appeler" doubles the L before a silent E: j\'appelle, nous appelons.', es: '«Appeler» duplica la L delante de una E muda: j\'appelle, nous appelons.', pt: '«Appeler» dobra o L antes de um E mudo: j\'appelle, nous appelons.' },
  },
  fall: { inf: 'tomber', ipa: 'tɔ̃be', syl: 'tom-ber', etre: true, ex: ['Les feuilles {tombent} en automne.', 'Je {suis tombé} de mon vélo.'] },
  start: { inf: 'commencer', ipa: 'kɔmɑ̃se', syl: 'com-men-cer', ex: ["L'école {commence} à huit heures.", 'Il {a commencé} à pleuvoir.'] },
  finish: { inf: 'finir', stems: { pres: 'fini:fini finiss:finis' }, ipa: 'finiʁ', syl: 'fi-nir', pres: 'finis finis finit finissons finissez finissent', ex: ['Je {finis} mon dessin.', 'Le film {a fini} tard.'] },
  work: { inf: 'travailler', ipa: 'tʁavaje', syl: 'tra-vail-ler', ex: ['Ma maman {travaille} dans un hôpital.', 'Nous {avons travaillé} dans le jardin.'] },
  lose: { inf: 'perdre', stems: { pres: 'per:pɛʁ perd:pɛʁd', ps: 'perdi:pɛʁdi' }, ipa: 'pɛʁdʁ', syl: 'perdre', pres: 'perds perds perd perdons perdez perdent', ps: 'perdi', ex: ['Mon frère {perd} toujours ses clés.', "J'{ai perdu} mon ballon."] },
}
