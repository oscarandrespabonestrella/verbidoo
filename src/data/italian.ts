/**
 * Italian lemma, used when Italian is the child's own language (translations and the compare panel).
 * Regular verbs need only `inf`/`syl`; the engine (engine/italian.ts) builds the rest.
 * `pres` / `imperf` = six forms (io..loro) when they break the pattern; `fut` = irregular future/conditional stem
 * (andare → andr-); `pp` / `ger` = participle / gerund when the rule is wrong; `essere` = passato prossimo with essere;
 * `isc` = -ire verb that takes -isc- (finisco). `ex` = [present sentence, past sentence], parallel to the other languages.
 * Not yet reviewed by a native speaker.
 */
export interface ItLemma {
  inf: string; syl: string
  pres?: string; imperf?: string; fut?: string; pp?: string; ger?: string
  essere?: true; isc?: true
  ex: [string, string]
}

export const ITALIAN: Record<string, ItLemma> = {
  eat: { inf: 'mangiare', syl: 'man-gia-re', ex: ['Io {mangio} una mela ogni giorno.', 'Noi {abbiamo mangiato} la pizza alla festa.'] },
  drink: {
    inf: 'bere', syl: 'be-re', pres: 'bevo bevi beve beviamo bevete bevono', imperf: 'bevevo bevevi beveva bevevamo bevevate bevevano',
    fut: 'berr', pp: 'bevuto', ger: 'bevendo', ex: ['Il gatto {beve} il latte.', 'Io {ho bevuto} un bicchiere d’acqua.'],
  },
  cook: { inf: 'cucinare', syl: 'cu-ci-na-re', ex: ['Il mio papà {cucina} il riso.', 'Loro {hanno cucinato} la zuppa insieme.'] },
  run: { inf: 'correre', syl: 'cor-re-re', pp: 'corso', ex: ['Il ragazzo {corre} nel parco.', 'Lei {ha corso} fino a scuola.'] },
  jump: { inf: 'saltare', syl: 'sal-ta-re', ex: ['La rana {salta} molto in alto.', 'I bambini {hanno saltato} sul letto.'] },
  walk: { inf: 'camminare', syl: 'cam-mi-na-re', ex: ['Io {cammino} con il nonno.', 'Loro {hanno camminato} sulla spiaggia.'] },
  swim: { inf: 'nuotare', syl: 'nuo-ta-re', ex: ['I pesci {nuotano} nel mare.', 'Io {ho nuotato} nel lago.'] },
  dance: { inf: 'ballare', syl: 'bal-la-re', ex: ['Mia sorella {balla} molto bene.', 'Io {ho ballato} alla festa.'] },
  play: { inf: 'giocare', syl: 'gio-ca-re', ex: ['I bambini {giocano} in giardino.', 'Io {ho giocato} con i miei amici.'] },
  sleep: { inf: 'dormire', syl: 'dor-mi-re', ex: ['Il neonato {dorme} molto.', 'Io {ho dormito} dieci ore.'] },
  wash: { inf: 'lavare', syl: 'la-va-re', ex: ['Io mi {lavo} le mani prima di mangiare.', 'La mamma {ha lavato} i piatti.'] },
  write: { inf: 'scrivere', syl: 'scri-ve-re', pp: 'scritto', ex: ['Io {scrivo} il mio nome.', 'Lei {ha scritto} una lettera alla nonna.'] },
  read: { inf: 'leggere', syl: 'leg-ge-re', pp: 'letto', ex: ['Io {leggo} un libro ogni sera.', 'Noi {abbiamo letto} una storia buffa.'] },
  draw: { inf: 'disegnare', syl: 'di-se-gna-re', ex: ['Lui {disegna} un grande sole.', 'Io {ho disegnato} la mia famiglia.'] },
  learn: { inf: 'imparare', syl: 'im-pa-ra-re', ex: ['Noi {impariamo} parole nuove.', 'Io {ho imparato} a nuotare.'] },
  study: { inf: 'studiare', syl: 'stu-dia-re', ex: ['Mio fratello {studia} la matematica.', 'Loro {hanno studiato} per il compito.'] },
  open: { inf: 'aprire', syl: 'a-pri-re', pp: 'aperto', ex: ['Lei {apre} la finestra.', 'Io {ho aperto} il mio regalo.'] },
  close: { inf: 'chiudere', syl: 'chiu-de-re', pp: 'chiuso', ex: ['Papà {chiude} la porta.', 'Io {ho chiuso} gli occhi.'] },
  talk: { inf: 'parlare', syl: 'par-la-re', ex: ['Il mio pappagallo {parla}!', 'Noi {abbiamo parlato} al telefono.'] },
  listen: { inf: 'ascoltare', syl: 'a-scol-ta-re', ex: ['Io {ascolto} la musica.', 'La classe {ha ascoltato} la maestra.'] },
  sing: { inf: 'cantare', syl: 'can-ta-re', ex: ['Gli uccellini {cantano} la mattina.', 'Lei {ha cantato} una canzone.'] },
  help: { inf: 'aiutare', syl: 'a-iu-ta-re', ex: ['Io {aiuto} la mamma in cucina.', 'Il mio amico mi {ha aiutato}.'] },
  climb: {
    inf: 'salire', syl: 'sa-li-re', pres: 'salgo sali sale saliamo salite salgono', essere: true,
    ex: ['Il gatto {sale} sull’albero.', 'Noi {siamo saliti} in cima alla montagna.'],
  },
  live: { inf: 'abitare', syl: 'a-bi-ta-re', ex: ['Noi {abitiamo} in una grande città.', 'I miei nonni {abitavano} in una fattoria.'] },
  have: {
    inf: 'avere', syl: 'a-ve-re', pres: 'ho hai ha abbiamo avete hanno', fut: 'avr',
    ex: ['Io {ho} una bici rossa.', 'Noi {avevamo} un gatto.'],
  },
  go: {
    inf: 'andare', syl: 'an-da-re', pres: 'vado vai va andiamo andate vanno', fut: 'andr', essere: true,
    ex: ['Io {vado} a scuola in autobus.', 'Noi {siamo andati} allo zoo.'],
  },
  make: {
    inf: 'fare', syl: 'fa-re', pres: 'faccio fai fa facciamo fate fanno', imperf: 'facevo facevi faceva facevamo facevate facevano',
    fut: 'far', pp: 'fatto', ger: 'facendo', ex: ['La nonna {fa} il pane.', 'Io {ho fatto} un aeroplano di carta.'],
  },
  see: { inf: 'vedere', syl: 've-de-re', fut: 'vedr', pp: 'visto', ex: ['Io {vedo} un arcobaleno!', 'Noi {abbiamo visto} una balena.'] },
  want: {
    inf: 'volere', syl: 'vo-le-re', pres: 'voglio vuoi vuole vogliamo volete vogliono', fut: 'vorr',
    ex: ['Io {voglio} un gelato.', 'Lei {voleva} un cagnolino.'],
  },
  hug: { inf: 'abbracciare', syl: 'ab-brac-cia-re', ex: ['Io {abbraccio} il mio orsacchiotto.', 'Lei {ha abbracciato} suo nonno.'] },
  be: {
    inf: 'essere', syl: 'es-se-re', pres: 'sono sei è siamo siete sono', imperf: 'ero eri era eravamo eravate erano',
    fut: 'sar', pp: 'stato', ger: 'essendo', essere: true, ex: ['Il mio gatto {è} nero.', 'Il film {era} divertente.'],
  },
  say: {
    inf: 'dire', syl: 'di-re', pres: 'dico dici dice diciamo dite dicono', imperf: 'dicevo dicevi diceva dicevamo dicevate dicevano',
    fut: 'dir', pp: 'detto', ger: 'dicendo', ex: ['Il nonno {dice} ciao.', 'Lei {ha detto} grazie.'],
  },
  can: {
    inf: 'potere', syl: 'po-te-re', pres: 'posso puoi può possiamo potete possono', fut: 'potr',
    ex: ['Noi {possiamo} giocare in giardino.', 'Io non {potevo} dormire.'],
  },
  know: {
    inf: 'sapere', syl: 'sa-pe-re', pres: 'so sai sa sappiamo sapete sanno', fut: 'sapr',
    ex: ['Io {so} contare fino a dieci.', 'Noi {sapevamo} la canzone.'],
  },
  come: {
    inf: 'venire', syl: 've-ni-re', pres: 'vengo vieni viene veniamo venite vengono', fut: 'verr', pp: 'venuto', essere: true,
    ex: ['Il mio amico {viene} a casa mia.', 'Il nonno {è venuto} in treno.'],
  },
  must: {
    inf: 'dovere', syl: 'do-ve-re', pres: 'devo devi deve dobbiamo dovete devono', fut: 'dovr',
    ex: ['Io {devo} lavarmi i denti.', 'I bambini {devono} dormire molto.'],
  },
  believe: { inf: 'credere', syl: 'cre-de-re', ex: ['Io {credo} alle fate.', 'Lui {ha creduto} alla mia storia.'] },
  find: { inf: 'trovare', syl: 'tro-va-re', ex: ['La bambina {trova} la palla.', 'Io {ho trovato} una chiave.'] },
  give: {
    inf: 'dare', syl: 'da-re', pres: 'do dai dà diamo date danno', fut: 'dar',
    ex: ['Io {do} un fiore alla mamma.', 'Papà mi {ha dato} un libro.'],
  },
  take: { inf: 'prendere', syl: 'pren-de-re', pp: 'preso', ex: ['Io {prendo} l’autobus.', 'Noi {abbiamo preso} il treno.'] },
  love: { inf: 'amare', syl: 'a-ma-re', ex: ['Io {amo} il mio cane.', 'Mia nonna {amava} i fiori.'] },
  put: { inf: 'mettere', syl: 'met-te-re', pp: 'messo', ex: ['Io {metto} i miei giocattoli nella scatola.', 'Lei {ha messo} il cappotto.'] },
  ask: { inf: 'chiedere', syl: 'chie-de-re', pp: 'chiesto', ex: ['Il ragazzo {chiede} dov’è il parco.', 'Lei {ha chiesto} il mio nome.'] },
  think: { inf: 'pensare', syl: 'pen-sa-re', ex: ['Io {penso} ai miei amici.', 'Noi {abbiamo pensato} che fosse facile.'] },
  hear: { inf: 'sentire', syl: 'sen-ti-re', ex: ['Io {sento} un uccellino.', 'Noi {abbiamo sentito} un grande rumore.'] },
  look: { inf: 'guardare', syl: 'guar-da-re', ex: ['Noi {guardiamo} le stelle.', 'Lei {ha guardato} fuori dalla finestra.'] },
  answer: { inf: 'rispondere', syl: 'ri-spon-de-re', pp: 'risposto', ex: ['Io {rispondo} alla domanda.', 'Lui {ha risposto} alla mia lettera.'] },
  meet: { inf: 'conoscere', syl: 'co-no-sce-re', pp: 'conosciuto', ex: ['Io {conosco} tua sorella.', 'Loro {conoscevano} bene la città.'] },
  arrive: { inf: 'arrivare', syl: 'ar-ri-va-re', essere: true, ex: ['L’autobus {arriva} alle otto.', 'Noi {siamo arrivati} in ritardo.'] },
  wait: { inf: 'aspettare', syl: 'a-spet-ta-re', ex: ['Io {aspetto} il mio amico.', 'Loro {hanno aspettato} l’autobus.'] },
  search: { inf: 'cercare', syl: 'cer-ca-re', ex: ['Io {cerco} la mia matita.', 'Noi {abbiamo cercato} il gatto.'] },
  goout: {
    inf: 'uscire', syl: 'u-sci-re', pres: 'esco esci esce usciamo uscite escono', essere: true,
    ex: ['Noi {usciamo} dopo pranzo.', 'I bambini {sono usciti} a giocare.'],
  },
  understand: { inf: 'capire', syl: 'ca-pi-re', isc: true, ex: ['Io {capisco} il francese!', 'Lei {ha capito} il gioco.'] },
  leave: { inf: 'partire', syl: 'par-ti-re', essere: true, ex: ['Il treno {parte} alle nove.', 'Loro {sono partiti} per le vacanze.'] },
  call: { inf: 'chiamare', syl: 'chia-ma-re', ex: ['La mamma mi {chiama} per cena.', 'Io {ho chiamato} la nonna.'] },
  fall: { inf: 'cadere', syl: 'ca-de-re', fut: 'cadr', essere: true, ex: ['Le foglie {cadono} in autunno.', 'Io {sono caduto} dalla bici.'] },
  start: { inf: 'cominciare', syl: 'co-min-cia-re', ex: ['La scuola {comincia} alle otto.', 'Poi {ha cominciato} a piovere.'] },
  finish: { inf: 'finire', syl: 'fi-ni-re', isc: true, ex: ['Io {finisco} il mio disegno.', 'Lei {ha finito} i compiti tardi.'] },
  work: { inf: 'lavorare', syl: 'la-vo-ra-re', ex: ['Mia mamma {lavora} in un ospedale.', 'Noi {abbiamo lavorato} in giardino.'] },
  lose: { inf: 'perdere', syl: 'per-de-re', pp: 'perso', ex: ['Mio fratello {perde} sempre le chiavi.', 'Io {ho perso} il mio palloncino.'] },
}
