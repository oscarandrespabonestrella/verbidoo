import type { BaseVerb } from './verbs'

/**
 * The 30 most frequent French verbs beyond the first 30, in frequency order.
 * Same rules as verbs.ts: only forms that break the patterns are written out. Every Spanish/Portuguese
 * form is checked against Wiktionary by scripts/wiktionary.test.ts.
 */
export const MORE_VERBS: BaseVerb[] = [
  {
    id: 'be', emoji: '✨', cat: 'core',
    en: { inf: 'be', past: 'was', pastSix: 'was were was were were were', pp: 'been', ing: 'being', pres: 'am are is are are are' },
    es: { inf: 'ser', syl: 'ser', irr: { pres: 'soy eres es somos sois son', pret: 'fui fuiste fue fuimos fuisteis fueron', imperf: 'era eras era éramos erais eran' } },
    pt: { inf: 'ser', syl: 'ser', irr: { pres: 'sou és é somos sois são', pret: 'fui foste foi fomos fostes foram', imperf: 'era eras era éramos éreis eram' } },
    mean: { en: 'To exist, or to say what someone or something is like.', es: 'Existir, o decir cómo es alguien o algo.', pt: 'Existir, ou dizer como é alguém ou alguma coisa.' },
    ex: [
      ['My cat {is} black.', 'Mi gato {es} negro.', 'Meu gato {é} preto.', 'O meu gato {é} preto.'],
      ['The film {was} funny.', 'La película {fue} divertida.', 'O filme {foi} engraçado.'],
    ],
  },
  {
    id: 'say', emoji: '💬', cat: 'core',
    en: { inf: 'say', past: 'said', pp: 'said', ing: 'saying' },
    es: { inf: 'decir', syl: 'de-cir', fut: 'dir', ger: 'diciendo', pp: 'dicho', irr: { pres: 'digo dices dice decimos decís dicen', pret: 'dije dijiste dijo dijimos dijisteis dijeron' } },
    pt: { inf: 'dizer', syl: 'di-zer', fut: 'dir', pp: 'dito', irr: { pres: 'digo dizes diz dizemos dizeis dizem', pret: 'disse disseste disse dissemos dissestes disseram' } },
    mean: { en: 'To use words to tell something.', es: 'Usar palabras para expresar algo.', pt: 'Usar palavras para expressar algo.' },
    ex: [
      ['Grandpa {says} hello.', 'El abuelo {dice} hola.', 'O avô {diz} olá.'],
      ['She {said} thank you.', 'Ella {dijo} gracias.', 'Ela {disse} obrigada.'],
    ],
  },
  {
    id: 'can', emoji: '💪', cat: 'core',
    en: { inf: 'can', third: 'can', past: 'could', pp: 'been able to', ing: 'being able to', will: 'be able to' },
    es: { inf: 'poder', syl: 'po-der', fut: 'podr', ger: 'pudiendo', irr: { pres: 'puedo puedes puede podemos podéis pueden', pret: 'pude pudiste pudo pudimos pudisteis pudieron' } },
    pt: { inf: 'poder', syl: 'po-der', irr: { pres: 'posso podes pode podemos podeis podem', pret: 'pude pudeste pôde pudemos pudestes puderam' } },
    mean: { en: 'To be able to do something.', es: 'Ser capaz de hacer algo.', pt: 'Ser capaz de fazer algo.' },
    ex: [
      ['We {can} play in the garden.', 'Nosotros {podemos} jugar en el jardín.', 'Nós {podemos} brincar no jardim.'],
      ['I {could} not sleep.', 'Yo no {podía} dormir.', 'Eu não {podia} dormir.'],
    ],
  },
  {
    id: 'know', emoji: '💡', cat: 'core',
    en: { inf: 'know', past: 'knew', pp: 'known', ing: 'knowing' },
    es: { inf: 'saber', syl: 'sa-ber', fut: 'sabr', irr: { pres: 'sé sabes sabe sabemos sabéis saben', pret: 'supe supiste supo supimos supisteis supieron' } },
    pt: { inf: 'saber', syl: 'sa-ber', irr: { pres: 'sei sabes sabe sabemos sabeis sabem', pret: 'soube soubeste soube soubemos soubestes souberam' } },
    mean: { en: 'To have information or a skill in your head.', es: 'Tener información o una habilidad en la cabeza.', pt: 'Ter informação ou uma habilidade na cabeça.' },
    ex: [
      ['I {know} how to count to ten.', 'Yo {sé} contar hasta diez.', 'Eu {sei} contar até dez.'],
      ['We {knew} the song.', 'Nosotros {sabíamos} la canción.', 'Nós {sabíamos} a canção.'],
    ],
  },
  {
    id: 'come', emoji: '👋', cat: 'core',
    en: { inf: 'come', past: 'came', pp: 'come', ing: 'coming' },
    es: { inf: 'venir', syl: 've-nir', fut: 'vendr', ger: 'viniendo', irr: { pres: 'vengo vienes viene venimos venís vienen', pret: 'vine viniste vino vinimos vinisteis vinieron' } },
    pt: {
      inf: 'vir', syl: 'vir', pp: 'vindo',
      irr: { pres: 'venho vens vem vimos vindes vêm', pret: 'vim vieste veio viemos viestes vieram', imperf: 'vinha vinhas vinha vínhamos vínheis vinham' },
    },
    mean: { en: 'To move towards the place where someone is.', es: 'Moverse hacia el lugar donde está alguien.', pt: 'Mover-se para o lugar onde alguém está.' },
    ex: [
      ['My friend {comes} to my house.', 'Mi amigo {viene} a mi casa.', 'Meu amigo {vem} à minha casa.', 'O meu amigo {vem} à minha casa.'],
      ['Grandma {came} by train.', 'La abuela {vino} en tren.', 'A avó {veio} de trem.', 'A avó {veio} de comboio.'],
    ],
  },
  {
    id: 'must', emoji: '📝', cat: 'core',
    en: { inf: 'have to', third: 'has to', past: 'had to', pp: 'had to', ing: 'having to' },
    es: { inf: 'deber', syl: 'de-ber' },
    pt: { inf: 'dever', syl: 'de-ver' },
    mean: { en: 'To need to do something because it is a rule or important.', es: 'Tener que hacer algo porque es una regla o es importante.', pt: 'Ter de fazer algo porque é uma regra ou é importante.' },
    ex: [
      ['I {have to} brush my teeth.', 'Yo {debo} cepillarme los dientes.', 'Eu {devo} escovar os dentes.'],
      ['Children {have to} sleep a lot.', 'Los niños {deben} dormir mucho.', 'As crianças {devem} dormir muito.'],
    ],
  },
  {
    id: 'believe', emoji: '🧚', cat: 'school',
    en: { inf: 'believe', past: 'believed', pp: 'believed', ing: 'believing' },
    es: { inf: 'creer', syl: 'cre-er', ger: 'creyendo', pp: 'creído', irr: { pret: 'creí creíste creyó creímos creísteis creyeron' } },
    pt: { inf: 'acreditar', syl: 'a-cre-di-tar' },
    mean: { en: 'To think that something is true.', es: 'Pensar que algo es verdad.', pt: 'Pensar que algo é verdade.' },
    ex: [
      ['I {believe} in fairies.', 'Yo {creo} en las hadas.', 'Eu {acredito} em fadas.'],
      ['He {believed} my story.', 'Él {creyó} mi historia.', 'Ele {acreditou} na minha história.'],
    ],
  },
  {
    id: 'find', emoji: '🗝️', cat: 'core',
    en: { inf: 'find', past: 'found', pp: 'found', ing: 'finding' },
    es: { inf: 'encontrar', syl: 'en-con-trar', irr: { pres: 'encuentro encuentras encuentra encontramos encontráis encuentran' } },
    pt: { inf: 'encontrar', syl: 'en-con-trar' },
    mean: { en: 'To see something you were looking for.', es: 'Ver algo que estabas buscando.', pt: 'Descobrir onde está algo que se procurava.' },
    ex: [
      ['The girl {finds} the ball.', 'La niña {encuentra} la pelota.', 'A menina {encontra} a bola.'],
      ['I {found} a key.', 'Yo {encontré} una llave.', 'Eu {encontrei} uma chave.'],
    ],
  },
  {
    id: 'give', emoji: '🫴', cat: 'core',
    en: { inf: 'give', past: 'gave', pp: 'given', ing: 'giving' },
    es: { inf: 'dar', syl: 'dar', irr: { pres: 'doy das da damos dais dan', pret: 'di diste dio dimos disteis dieron' } },
    pt: { inf: 'dar', syl: 'dar', irr: { pres: 'dou dás dá damos dais dão', pret: 'dei deste deu demos destes deram' } },
    mean: { en: 'To let someone have something.', es: 'Hacer que alguien tenga algo.', pt: 'Fazer com que alguém tenha algo.' },
    ex: [
      ['I {give} a flower to my mom.', 'Yo le {doy} una flor a mi mamá.', 'Eu {dou} uma flor à minha mãe.'],
      ['Dad {gave} me a book.', 'Papá me {dio} un libro.', 'O pai me {deu} um livro.', 'O pai {deu}-me um livro.'],
    ],
  },
  {
    id: 'take', emoji: '🤲', cat: 'core',
    en: { inf: 'take', past: 'took', pp: 'taken', ing: 'taking' },
    es: { inf: 'tomar', syl: 'to-mar' },
    pt: {
      inf: 'pegar', syl: 'pe-gar', variants: { 'pt-PT': { inf: 'apanhar', syl: 'a-pa-nhar' } },
      note: { en: 'For buses and trains, Brazil says "pegar" and Portugal "apanhar".', es: 'Para autobuses y trenes, en Brasil se dice «pegar» y en Portugal «apanhar».', pt: 'Para autocarros e comboios, no Brasil diz-se «pegar» e em Portugal «apanhar».' },
    },
    mean: { en: 'To get hold of something, or to travel on a bus or train.', es: 'Agarrar algo, o viajar en autobús o tren.', pt: 'Segurar algo, ou viajar de ônibus ou de trem.' },
    ex: [
      ['I {take} the bus.', 'Yo {tomo} el autobús.', 'Eu {pego} o ônibus.', 'Eu {apanho} o autocarro.'],
      ['We {took} the train.', 'Nosotros {tomamos} el tren.', 'Nós {pegamos} o trem.', 'Nós {apanhámos} o comboio.'],
    ],
  },
  {
    id: 'love', emoji: '❤️', cat: 'family',
    en: { inf: 'love', past: 'loved', pp: 'loved', ing: 'loving' },
    es: { inf: 'amar', syl: 'a-mar' },
    pt: { inf: 'amar', syl: 'a-mar' },
    mean: { en: 'To care about someone or something very much.', es: 'Querer mucho a alguien o algo.', pt: 'Gostar muito de alguém ou de algo.' },
    ex: [
      ['I {love} my dog.', 'Yo {amo} a mi perro.', 'Eu {amo} o meu cachorro.', 'Eu {amo} o meu cão.'],
      ['My grandma {loved} flowers.', 'Mi abuela {amaba} las flores.', 'Minha avó {amava} flores.', 'A minha avó {amava} flores.'],
    ],
  },
  {
    id: 'put', emoji: '📥', cat: 'core',
    en: { inf: 'put', past: 'put', pp: 'put', ing: 'putting' },
    es: { inf: 'poner', syl: 'po-ner', fut: 'pondr', pp: 'puesto', irr: { pres: 'pongo pones pone ponemos ponéis ponen', pret: 'puse pusiste puso pusimos pusisteis pusieron' } },
    pt: { inf: 'colocar', syl: 'co-lo-car' },
    mean: { en: 'To move something to a place.', es: 'Llevar algo a un lugar.', pt: 'Levar algo para um lugar.' },
    ex: [
      ['I {put} my toys in the box.', 'Yo {pongo} mis juguetes en la caja.', 'Eu {coloco} os meus brinquedos na caixa.'],
      ['She {put} on her coat.', 'Ella se {puso} el abrigo.', 'Ela {colocou} o casaco.'],
    ],
  },
  {
    id: 'ask', emoji: '🙋', cat: 'communication',
    en: { inf: 'ask', past: 'asked', pp: 'asked', ing: 'asking' },
    es: { inf: 'preguntar', syl: 'pre-gun-tar' },
    pt: { inf: 'perguntar', syl: 'per-gun-tar' },
    mean: { en: 'To say a question to get an answer.', es: 'Hacer una pregunta para recibir una respuesta.', pt: 'Fazer uma pergunta para receber uma resposta.' },
    ex: [
      ['The boy {asks} where the park is.', 'El niño {pregunta} dónde está el parque.', 'O menino {pergunta} onde fica o parque.'],
      ['She {asked} my name.', 'Ella {preguntó} mi nombre.', 'Ela {perguntou} o meu nome.'],
    ],
  },
  {
    id: 'think', emoji: '🤔', cat: 'school',
    en: { inf: 'think', past: 'thought', pp: 'thought', ing: 'thinking' },
    es: { inf: 'pensar', syl: 'pen-sar', irr: { pres: 'pienso piensas piensa pensamos pensáis piensan' } },
    pt: { inf: 'pensar', syl: 'pen-sar' },
    mean: { en: 'To use your mind to have ideas.', es: 'Usar la mente para tener ideas.', pt: 'Usar a mente para ter ideias.' },
    ex: [
      ['I {think} about my friends.', 'Yo {pienso} en mis amigos.', 'Eu {penso} nos meus amigos.'],
      ['We {thought} it was easy.', 'Nosotros {pensamos} que era fácil.', 'Nós {pensamos} que era fácil.', 'Nós {pensámos} que era fácil.'],
    ],
  },
  {
    id: 'hear', emoji: '🔔', cat: 'communication',
    en: { inf: 'hear', past: 'heard', pp: 'heard', ing: 'hearing' },
    es: {
      inf: 'oír', syl: 'o-ír', fut: 'oir', ger: 'oyendo', pp: 'oído',
      irr: { pres: 'oigo oyes oye oímos oís oyen', pret: 'oí oíste oyó oímos oísteis oyeron', imperf: 'oía oías oía oíamos oíais oían' },
    },
    pt: {
      inf: 'ouvir', syl: 'ou-vir', irr: { pres: 'ouço ouves ouve ouvimos ouvis ouvem' },
      note: { en: 'In Portugal "oiço" is also used for "ouço".', es: 'En Portugal también se usa «oiço» en vez de «ouço».', pt: 'Em Portugal também se usa «oiço» em vez de «ouço».' },
    },
    mean: { en: 'To notice sounds with your ears.', es: 'Notar los sonidos con los oídos.', pt: 'Perceber os sons com os ouvidos.' },
    ex: [
      ['I {hear} a bird.', 'Yo {oigo} un pájaro.', 'Eu {ouço} um passarinho.', 'Eu {ouço} um pássaro.'],
      ['We {heard} a loud noise.', 'Nosotros {oímos} un ruido fuerte.', 'Nós {ouvimos} um barulho forte.'],
    ],
  },
  {
    id: 'look', emoji: '🔭', cat: 'daily',
    en: { inf: 'look', past: 'looked', pp: 'looked', ing: 'looking' },
    es: { inf: 'mirar', syl: 'mi-rar' },
    pt: { inf: 'olhar', syl: 'o-lhar' },
    mean: { en: 'To turn your eyes towards something.', es: 'Dirigir los ojos hacia algo.', pt: 'Virar os olhos para algo.' },
    ex: [
      ['We {look} at the stars.', 'Nosotros {miramos} las estrellas.', 'Nós {olhamos} para as estrelas.'],
      ['She {looked} out of the window.', 'Ella {miró} por la ventana.', 'Ela {olhou} pela janela.'],
    ],
  },
  {
    id: 'answer', emoji: '🗨️', cat: 'communication',
    en: { inf: 'answer', past: 'answered', pp: 'answered', ing: 'answering' },
    es: { inf: 'responder', syl: 'res-pon-der' },
    pt: { inf: 'responder', syl: 'res-pon-der' },
    mean: { en: 'To say something back when someone asks you.', es: 'Decir algo cuando alguien te pregunta.', pt: 'Dizer algo quando alguém faz uma pergunta.' },
    ex: [
      ['I {answer} the question.', 'Yo {respondo} la pregunta.', 'Eu {respondo} à pergunta.'],
      ['He {answered} my letter.', 'Él {respondió} mi carta.', 'Ele {respondeu} à minha carta.'],
    ],
  },
  {
    id: 'meet', emoji: '👫', cat: 'family',
    en: { inf: 'know', past: 'knew', pp: 'known', ing: 'knowing' },
    es: { inf: 'conocer', syl: 'co-no-cer', irr: { pres: 'conozco conoces conoce conocemos conocéis conocen' } },
    pt: { inf: 'conhecer', syl: 'co-nhe-cer' },
    mean: { en: 'To have met someone, or to have been somewhere before.', es: 'Haber visto a alguien o haber estado en un lugar antes.', pt: 'Já ter visto alguém ou já ter estado num lugar.' },
    ex: [
      ['I {know} your sister.', 'Yo {conozco} a tu hermana.', 'Eu {conheço} a sua irmã.', 'Eu {conheço} a tua irmã.'],
      ['They {knew} the city well.', 'Ellos {conocían} bien la ciudad.', 'Eles {conheciam} bem a cidade.'],
    ],
  },
  {
    id: 'arrive', emoji: '🛬', cat: 'movement',
    en: { inf: 'arrive', past: 'arrived', pp: 'arrived', ing: 'arriving' },
    es: { inf: 'llegar', syl: 'lle-gar' },
    pt: { inf: 'chegar', syl: 'che-gar' },
    mean: { en: 'To get to the place you were going to.', es: 'Estar por fin en el lugar adonde ibas.', pt: 'Estar finalmente no lugar para onde se ia.' },
    ex: [
      ['The bus {arrives} at eight.', 'El autobús {llega} a las ocho.', 'O ônibus {chega} às oito.', 'O autocarro {chega} às oito.'],
      ['We {arrived} late.', 'Nosotros {llegamos} tarde.', 'Nós {chegamos} tarde.', 'Nós {chegámos} tarde.'],
    ],
  },
  {
    id: 'wait', emoji: '⏳', cat: 'daily',
    en: { inf: 'wait', past: 'waited', pp: 'waited', ing: 'waiting' },
    es: { inf: 'esperar', syl: 'es-pe-rar' },
    pt: { inf: 'esperar', syl: 'es-pe-rar' },
    mean: { en: 'To stay until something happens.', es: 'Quedarse hasta que algo pase.', pt: 'Ficar até que algo aconteça.' },
    ex: [
      ['I {wait} for my friend.', 'Yo {espero} a mi amigo.', 'Eu {espero} o meu amigo.'],
      ['They {waited} for the bus.', 'Ellos {esperaron} el autobús.', 'Eles {esperaram} o ônibus.', 'Eles {esperaram} pelo autocarro.'],
    ],
  },
  {
    id: 'search', emoji: '🔎', cat: 'daily',
    en: { inf: 'look for', third: 'looks for', past: 'looked for', pp: 'looked for', ing: 'looking for' },
    es: { inf: 'buscar', syl: 'bus-car' },
    pt: { inf: 'procurar', syl: 'pro-cu-rar' },
    mean: { en: 'To try to find something.', es: 'Intentar encontrar algo.', pt: 'Tentar encontrar algo.' },
    ex: [
      ['I {look for} my pencil.', 'Yo {busco} mi lápiz.', 'Eu {procuro} o meu lápis.'],
      ['We {looked for} the cat.', 'Nosotros {buscamos} al gato.', 'Nós {procuramos} o gato.', 'Nós {procurámos} o gato.'],
    ],
  },
  {
    id: 'goout', emoji: '🌳', cat: 'movement',
    en: { inf: 'go out', third: 'goes out', past: 'went out', pp: 'gone out', ing: 'going out' },
    es: { inf: 'salir', syl: 'sa-lir', fut: 'saldr', irr: { pres: 'salgo sales sale salimos salís salen' } },
    pt: {
      inf: 'sair', syl: 'sa-ir', pp: 'saído',
      irr: { pres: 'saio sais sai saímos saís saem', pret: 'saí saíste saiu saímos saístes saíram', imperf: 'saía saías saía saíamos saíeis saíam' },
    },
    mean: { en: 'To leave a place and go outside.', es: 'Dejar un lugar e ir afuera.', pt: 'Deixar um lugar e ir para fora.' },
    ex: [
      ['We {go out} after lunch.', 'Nosotros {salimos} después de comer.', 'Nós {saímos} depois do almoço.'],
      ['The kids {went out} to play.', 'Los niños {salieron} a jugar.', 'As crianças {saíram} para brincar.'],
    ],
  },
  {
    id: 'understand', emoji: '👌', cat: 'school',
    en: { inf: 'understand', past: 'understood', pp: 'understood', ing: 'understanding' },
    es: { inf: 'entender', syl: 'en-ten-der', irr: { pres: 'entiendo entiendes entiende entendemos entendéis entienden' } },
    pt: { inf: 'entender', syl: 'en-ten-der' },
    mean: { en: 'To know what something means.', es: 'Saber qué significa algo.', pt: 'Saber o que algo significa.' },
    ex: [
      ['I {understand} French!', '¡Yo {entiendo} francés!', 'Eu {entendo} francês!'],
      ['She {understood} the game.', 'Ella {entendió} el juego.', 'Ela {entendeu} o jogo.'],
    ],
  },
  {
    id: 'leave', emoji: '🧳', cat: 'movement',
    en: { inf: 'leave', past: 'left', pp: 'left', ing: 'leaving' },
    es: { inf: 'partir', syl: 'par-tir' },
    pt: { inf: 'partir', syl: 'par-tir' },
    mean: { en: 'To go away from a place.', es: 'Irse de un lugar.', pt: 'Ir embora de um lugar.' },
    ex: [
      ['The train {leaves} at nine.', 'El tren {parte} a las nueve.', 'O trem {parte} às nove.', 'O comboio {parte} às nove.'],
      ['They {left} for the holidays.', 'Ellos {partieron} de vacaciones.', 'Eles {partiram} de férias.'],
    ],
  },
  {
    id: 'call', emoji: '📞', cat: 'communication',
    en: { inf: 'call', past: 'called', pp: 'called', ing: 'calling' },
    es: { inf: 'llamar', syl: 'lla-mar' },
    pt: { inf: 'chamar', syl: 'cha-mar' },
    mean: { en: "To say someone's name loudly, or to phone them.", es: 'Decir el nombre de alguien en voz alta, o hablarle por teléfono.', pt: 'Dizer o nome de alguém em voz alta para que venha.' },
    ex: [
      ['Mom {calls} me for dinner.', 'Mamá me {llama} para cenar.', 'A mãe me {chama} para jantar.', 'A mãe {chama}-me para jantar.'],
      ['I {called} my grandma.', 'Yo {llamé} a mi abuela.', 'Eu {chamei} a minha avó.'],
    ],
  },
  {
    id: 'fall', emoji: '🍂', cat: 'movement',
    en: { inf: 'fall', past: 'fell', pp: 'fallen', ing: 'falling' },
    es: {
      inf: 'caer', syl: 'ca-er', ger: 'cayendo', pp: 'caído',
      irr: { pres: 'caigo caes cae caemos caéis caen', pret: 'caí caíste cayó caímos caísteis cayeron' },
    },
    pt: {
      inf: 'cair', syl: 'ca-ir', pp: 'caído',
      irr: { pres: 'caio cais cai caímos caís caem', pret: 'caí caíste caiu caímos caístes caíram', imperf: 'caía caías caía caíamos caíeis caíam' },
    },
    mean: { en: 'To go down to the ground without wanting to.', es: 'Ir hacia el suelo sin querer.', pt: 'Ir para o chão sem querer.' },
    ex: [
      ['The leaves {fall} in autumn.', 'Las hojas {caen} en otoño.', 'As folhas {caem} no outono.'],
      ['I {fell} off my bike.', 'Yo me {caí} de la bici.', 'Eu {caí} da bicicleta.'],
    ],
  },
  {
    id: 'start', emoji: '🚦', cat: 'school',
    en: { inf: 'start', past: 'started', pp: 'started', ing: 'starting' },
    es: { inf: 'empezar', syl: 'em-pe-zar', irr: { pres: 'empiezo empiezas empieza empezamos empezáis empiezan' } },
    pt: { inf: 'começar', syl: 'co-me-çar' },
    mean: { en: 'To do the first part of something.', es: 'Hacer la primera parte de algo.', pt: 'Fazer a primeira parte de algo.' },
    ex: [
      ['School {starts} at eight.', 'La escuela {empieza} a las ocho.', 'A escola {começa} às oito.'],
      ['It {started} to rain.', '{Empezó} a llover.', '{Começou} a chover.'],
    ],
  },
  {
    id: 'finish', emoji: '🏁', cat: 'school',
    en: { inf: 'finish', past: 'finished', pp: 'finished', ing: 'finishing' },
    es: { inf: 'terminar', syl: 'ter-mi-nar' },
    pt: { inf: 'terminar', syl: 'ter-mi-nar' },
    mean: { en: 'To do the last part of something.', es: 'Hacer la última parte de algo.', pt: 'Fazer a última parte de algo.' },
    ex: [
      ['I {finish} my drawing.', 'Yo {termino} mi dibujo.', 'Eu {termino} o meu desenho.'],
      ['The film {finished} late.', 'La película {terminó} tarde.', 'O filme {terminou} tarde.'],
    ],
  },
  {
    id: 'work', emoji: '👷', cat: 'family',
    en: { inf: 'work', past: 'worked', pp: 'worked', ing: 'working' },
    es: { inf: 'trabajar', syl: 'tra-ba-jar' },
    pt: { inf: 'trabalhar', syl: 'tra-ba-lhar' },
    mean: { en: 'To do a job.', es: 'Hacer un trabajo.', pt: 'Fazer um trabalho.' },
    ex: [
      ['My mom {works} in a hospital.', 'Mi mamá {trabaja} en un hospital.', 'Minha mãe {trabalha} num hospital.', 'A minha mãe {trabalha} num hospital.'],
      ['We {worked} in the garden.', 'Nosotros {trabajamos} en el jardín.', 'Nós {trabalhamos} no jardim.', 'Nós {trabalhámos} no jardim.'],
    ],
  },
  {
    id: 'lose', emoji: '🎈', cat: 'daily',
    en: { inf: 'lose', past: 'lost', pp: 'lost', ing: 'losing' },
    es: { inf: 'perder', syl: 'per-der', irr: { pres: 'pierdo pierdes pierde perdemos perdéis pierden' } },
    pt: { inf: 'perder', syl: 'per-der', irr: { pres: 'perco perdes perde perdemos perdeis perdem' } },
    mean: { en: "To not have something anymore because you can't find it.", es: 'Ya no tener algo porque no lo encuentras.', pt: 'Deixar de ter algo porque não se encontra.' },
    ex: [
      ['My brother always {loses} his keys.', 'Mi hermano siempre {pierde} sus llaves.', 'Meu irmão sempre {perde} as chaves.', 'O meu irmão {perde} sempre as chaves.'],
      ['I {lost} my balloon.', 'Yo {perdí} mi globo.', 'Eu {perdi} o meu balão.'],
    ],
  },
]
