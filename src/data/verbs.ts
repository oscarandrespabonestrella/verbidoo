import { DUTCH, type NlLemma } from './dutch'
import { FRENCH, type FrLemma } from './french'
import { MORE_VERBS } from './verbs-more'
import type { Category, UiLang, Variant } from './i18n'

type Text3 = Record<UiLang, string>

/** English principal parts. `third` only when it breaks the -s/-es/-ies rule. */
/**
 * English principal parts. `third` only when it breaks the -s/-es/-ies rule (has, looks for).
 * `pres` / `pastSix` = six forms when the verb changes by person (am/are/is, was/were).
 * `will` = what follows will/would when the infinitive can't (can → will be able to).
 */
export interface EnLemma { inf: string; past: string; pp: string; ing: string; third?: string; pres?: string; pastSix?: string; will?: string; note?: Text3 }

/**
 * Spanish/Portuguese lemma. Regular forms come from the engine.
 * `irr` lists ONLY the tenses that deviate, as six space-separated forms (1sg..3pl).
 * `fut` = irregular future/conditional stem. Every form here was checked against RAE/DLE (es) and Priberam (pt).
 */
export interface RomLemma {
  inf: string; syl: string
  irr?: Partial<Record<'pres' | 'pret' | 'imperf', string>>
  fut?: string; ger?: string; pp?: string
  note?: Text3
  variants?: Partial<Record<Variant, Partial<Omit<RomLemma, 'variants'>>>>
}

/** [en, es, pt-BR, pt-PT?] — conjugated verb wrapped in {braces}. pt-PT falls back to pt-BR. */
export type Sentence = [string, string, string, string?]

export interface Verb {
  id: string; emoji: string; cat: Category
  en: EnLemma; es: RomLemma; pt: RomLemma; fr: FrLemma; nl: NlLemma
  mean: Text3
  ex: [Sentence, Sentence] // [easy present, past]
}

const BASE: Omit<Verb, 'fr' | 'nl'>[] = [
  {
    id: 'eat', emoji: '🍎', cat: 'food',
    en: { inf: 'eat', past: 'ate', pp: 'eaten', ing: 'eating' },
    es: { inf: 'comer', syl: 'co-mer' }, pt: { inf: 'comer', syl: 'co-mer' },
    mean: { en: 'To put food in your mouth, chew it and swallow it.', es: 'Poner comida en la boca, masticarla y tragarla.', pt: 'Pôr comida na boca, mastigar e engolir.' },
    ex: [
      ['I {eat} an apple every day.', 'Yo {como} una manzana todos los días.', 'Eu {como} uma maçã todos os dias.'],
      ['We {ate} pizza at the party.', 'Nosotros {comimos} pizza en la fiesta.', 'Nós {comemos} pizza na festa.'],
    ],
  },
  {
    id: 'drink', emoji: '🥛', cat: 'food',
    en: { inf: 'drink', past: 'drank', pp: 'drunk', ing: 'drinking' },
    es: { inf: 'beber', syl: 'be-ber' }, pt: { inf: 'beber', syl: 'be-ber' },
    mean: { en: 'To take a liquid, like water or milk, into your mouth and swallow it.', es: 'Tomar un líquido, como agua o leche, por la boca.', pt: 'Pôr um líquido, como água ou leite, na boca e engolir.' },
    ex: [
      ['The cat {drinks} milk.', 'El gato {bebe} leche.', 'O gato {bebe} leite.'],
      ['I {drank} a glass of water.', 'Yo {bebí} un vaso de agua.', 'Eu {bebi} um copo de água.'],
    ],
  },
  {
    id: 'cook', emoji: '🍳', cat: 'food',
    en: { inf: 'cook', past: 'cooked', pp: 'cooked', ing: 'cooking' },
    es: { inf: 'cocinar', syl: 'co-ci-nar' }, pt: { inf: 'cozinhar', syl: 'co-zi-nhar' },
    mean: { en: 'To make food ready to eat, using heat.', es: 'Preparar la comida usando calor.', pt: 'Preparar a comida usando calor.' },
    ex: [
      ['My dad {cooks} rice.', 'Mi papá {cocina} arroz.', 'Meu pai {cozinha} arroz.', 'O meu pai {cozinha} arroz.'],
      ['They {cooked} soup together.', 'Ellos {cocinaron} sopa juntos.', 'Eles {cozinharam} sopa juntos.'],
    ],
  },
  {
    id: 'run', emoji: '🏃', cat: 'movement',
    en: { inf: 'run', past: 'ran', pp: 'run', ing: 'running' },
    es: { inf: 'correr', syl: 'co-rrer' }, pt: { inf: 'correr', syl: 'cor-rer' },
    mean: { en: 'To move your legs very fast, faster than walking.', es: 'Mover las piernas muy rápido, más rápido que al caminar.', pt: 'Mover as pernas muito depressa, mais do que a andar.' },
    ex: [
      ['The boy {runs} in the park.', 'El niño {corre} en el parque.', 'O menino {corre} no parque.'],
      ['She {ran} to school.', 'Ella {corrió} a la escuela.', 'Ela {correu} para a escola.'],
    ],
  },
  {
    id: 'jump', emoji: '🐸', cat: 'movement',
    en: { inf: 'jump', past: 'jumped', pp: 'jumped', ing: 'jumping' },
    es: { inf: 'saltar', syl: 'sal-tar' },
    pt: {
      inf: 'pular', syl: 'pu-lar', variants: { 'pt-PT': { inf: 'saltar', syl: 'sal-tar' } },
      note: { en: 'In Portugal people say "saltar"; in Brazil "pular" is most common.', es: 'En Portugal se dice «saltar»; en Brasil, «pular» es lo más común.', pt: 'Em Portugal diz-se «saltar»; no Brasil, «pular» é o mais comum.' },
    },
    mean: { en: 'To push yourself up into the air with your legs.', es: 'Impulsarse hacia arriba con las piernas.', pt: 'Dar um impulso com as pernas para subir no ar.' },
    ex: [
      ['The frog {jumps} very high.', 'La rana {salta} muy alto.', 'O sapo {pula} muito alto.', 'O sapo {salta} muito alto.'],
      ['The kids {jumped} on the bed.', 'Los niños {saltaron} en la cama.', 'As crianças {pularam} na cama.', 'As crianças {saltaram} na cama.'],
    ],
  },
  {
    id: 'walk', emoji: '🚶', cat: 'movement',
    en: { inf: 'walk', past: 'walked', pp: 'walked', ing: 'walking' },
    es: { inf: 'caminar', syl: 'ca-mi-nar' }, pt: { inf: 'caminhar', syl: 'ca-mi-nhar' },
    mean: { en: 'To move by putting one foot in front of the other.', es: 'Moverse poniendo un pie delante del otro.', pt: 'Mover-se pondo um pé à frente do outro.' },
    ex: [
      ['I {walk} with my grandpa.', 'Yo {camino} con mi abuelo.', 'Eu {caminho} com o meu avô.'],
      ['They {walked} on the beach.', 'Ellas {caminaron} por la playa.', 'Elas {caminharam} na praia.'],
    ],
  },
  {
    id: 'swim', emoji: '🏊', cat: 'movement',
    en: { inf: 'swim', past: 'swam', pp: 'swum', ing: 'swimming' },
    es: { inf: 'nadar', syl: 'na-dar' }, pt: { inf: 'nadar', syl: 'na-dar' },
    mean: { en: 'To move through water using your arms and legs.', es: 'Moverse en el agua con los brazos y las piernas.', pt: 'Mover-se na água com os braços e as pernas.' },
    ex: [
      ['Fish {swim} in the sea.', 'Los peces {nadan} en el mar.', 'Os peixes {nadam} no mar.'],
      ['I {swam} in the lake.', 'Yo {nadé} en el lago.', 'Eu {nadei} no lago.'],
    ],
  },
  {
    id: 'dance', emoji: '💃', cat: 'movement',
    en: { inf: 'dance', past: 'danced', pp: 'danced', ing: 'dancing' },
    es: { inf: 'bailar', syl: 'bai-lar' }, pt: { inf: 'dançar', syl: 'dan-çar' },
    mean: { en: 'To move your body to music.', es: 'Mover el cuerpo al ritmo de la música.', pt: 'Mexer o corpo ao ritmo da música.' },
    ex: [
      ['My sister {dances} very well.', 'Mi hermana {baila} muy bien.', 'Minha irmã {dança} muito bem.', 'A minha irmã {dança} muito bem.'],
      ['I {danced} at the party.', 'Yo {bailé} en la fiesta.', 'Eu {dancei} na festa.'],
    ],
  },
  {
    id: 'play', emoji: '🧸', cat: 'daily',
    en: { inf: 'play', past: 'played', pp: 'played', ing: 'playing' },
    es: { inf: 'jugar', syl: 'ju-gar', irr: { pres: 'juego juegas juega jugamos jugáis juegan' } },
    pt: {
      inf: 'brincar', syl: 'brin-car',
      note: { en: '"Brincar" is playing for fun; for sports and games with rules, use "jogar".', es: '«Brincar» es jugar por diversión; para deportes y juegos con reglas se usa «jogar».', pt: '«Brincar» é para diversão; para jogos com regras e desporto usa-se «jogar».' },
    },
    mean: { en: 'To have fun with toys or games.', es: 'Divertirse con juguetes o juegos.', pt: 'Divertir-se com brinquedos ou jogos.' },
    ex: [
      ['The children {play} in the garden.', 'Los niños {juegan} en el jardín.', 'As crianças {brincam} no jardim.'],
      ['I {played} with my friends.', 'Yo {jugué} con mis amigos.', 'Eu {brinquei} com os meus amigos.'],
    ],
  },
  {
    id: 'sleep', emoji: '😴', cat: 'daily',
    en: { inf: 'sleep', past: 'slept', pp: 'slept', ing: 'sleeping' },
    es: {
      inf: 'dormir', syl: 'dor-mir', ger: 'durmiendo',
      irr: { pres: 'duermo duermes duerme dormimos dormís duermen', pret: 'dormí dormiste durmió dormimos dormisteis durmieron' },
    },
    pt: { inf: 'dormir', syl: 'dor-mir', irr: { pres: 'durmo dormes dorme dormimos dormis dormem' } },
    mean: { en: 'To rest with your eyes closed, usually at night.', es: 'Descansar con los ojos cerrados, normalmente por la noche.', pt: 'Descansar de olhos fechados, normalmente à noite.' },
    ex: [
      ['The baby {sleeps} a lot.', 'El bebé {duerme} mucho.', 'O bebê {dorme} muito.', 'O bebé {dorme} muito.'],
      ['I {slept} ten hours.', 'Yo {dormí} diez horas.', 'Eu {dormi} dez horas.'],
    ],
  },
  {
    id: 'wash', emoji: '🧼', cat: 'daily',
    en: { inf: 'wash', past: 'washed', pp: 'washed', ing: 'washing' },
    es: { inf: 'lavar', syl: 'la-var' }, pt: { inf: 'lavar', syl: 'la-var' },
    mean: { en: 'To clean something with water and soap.', es: 'Limpiar algo con agua y jabón.', pt: 'Limpar algo com água e sabão.' },
    ex: [
      ['I {wash} my hands before eating.', 'Yo me {lavo} las manos antes de comer.', 'Eu {lavo} as mãos antes de comer.'],
      ['Mom {washed} the dishes.', 'Mamá {lavó} los platos.', 'A mãe {lavou} os pratos.'],
    ],
  },
  {
    id: 'write', emoji: '✏️', cat: 'school',
    en: { inf: 'write', past: 'wrote', pp: 'written', ing: 'writing' },
    es: { inf: 'escribir', syl: 'es-cri-bir', pp: 'escrito' }, pt: { inf: 'escrever', syl: 'es-cre-ver', pp: 'escrito' },
    mean: { en: 'To put letters and words on paper.', es: 'Poner letras y palabras en un papel.', pt: 'Pôr letras e palavras no papel.' },
    ex: [
      ['I {write} my name.', 'Yo {escribo} mi nombre.', 'Eu {escrevo} o meu nome.'],
      ['She {wrote} a letter to grandma.', 'Ella {escribió} una carta a la abuela.', 'Ela {escreveu} uma carta para a avó.'],
    ],
  },
  {
    id: 'read', emoji: '📖', cat: 'school',
    en: {
      inf: 'read', past: 'read', pp: 'read', ing: 'reading',
      note: { en: 'The past "read" is written the same but sounds like "red".', es: 'El pasado «read» se escribe igual pero suena como «red».', pt: 'O passado «read» escreve-se igual, mas soa como «red».' },
    },
    es: { inf: 'leer', syl: 'le-er', ger: 'leyendo', pp: 'leído', irr: { pret: 'leí leíste leyó leímos leísteis leyeron' } },
    pt: { inf: 'ler', syl: 'ler', irr: { pres: 'leio lês lê lemos ledes leem' } },
    mean: { en: 'To look at written words and understand them.', es: 'Mirar palabras escritas y entenderlas.', pt: 'Olhar para palavras escritas e entendê-las.' },
    ex: [
      ['I {read} a book every night.', 'Yo {leo} un libro cada noche.', 'Eu {leio} um livro todas as noites.'],
      ['We {read} a funny story.', 'Nosotros {leímos} un cuento divertido.', 'Nós {lemos} uma história engraçada.'],
    ],
  },
  {
    id: 'draw', emoji: '🖍️', cat: 'school',
    en: { inf: 'draw', past: 'drew', pp: 'drawn', ing: 'drawing' },
    es: { inf: 'dibujar', syl: 'di-bu-jar' }, pt: { inf: 'desenhar', syl: 'de-se-nhar' },
    mean: { en: 'To make a picture with a pencil or crayons.', es: 'Hacer una imagen con un lápiz o con colores.', pt: 'Fazer uma imagem com lápis ou lápis de cor.' },
    ex: [
      ['He {draws} a big sun.', 'Él {dibuja} un sol grande.', 'Ele {desenha} um sol grande.'],
      ['I {drew} my family.', 'Yo {dibujé} a mi familia.', 'Eu {desenhei} a minha família.'],
    ],
  },
  {
    id: 'learn', emoji: '🧠', cat: 'school',
    en: {
      inf: 'learn', past: 'learned', pp: 'learned', ing: 'learning',
      note: { en: 'In British English "learnt" is also common.', es: 'En inglés británico también es común «learnt».', pt: 'No inglês britânico também é comum «learnt».' },
    },
    es: { inf: 'aprender', syl: 'a-pren-der' }, pt: { inf: 'aprender', syl: 'a-pren-der' },
    mean: { en: 'To start knowing something new.', es: 'Empezar a saber algo nuevo.', pt: 'Começar a saber algo novo.' },
    ex: [
      ['We {learn} new words.', 'Nosotros {aprendemos} palabras nuevas.', 'Nós {aprendemos} palavras novas.'],
      ['I {learned} to swim.', 'Yo {aprendí} a nadar.', 'Eu {aprendi} a nadar.'],
    ],
  },
  {
    id: 'study', emoji: '📚', cat: 'school',
    en: { inf: 'study', past: 'studied', pp: 'studied', ing: 'studying' },
    es: { inf: 'estudiar', syl: 'es-tu-diar' }, pt: { inf: 'estudar', syl: 'es-tu-dar' },
    mean: { en: 'To spend time learning something.', es: 'Dedicar tiempo a aprender algo.', pt: 'Dedicar tempo a aprender algo.' },
    ex: [
      ['My brother {studies} math.', 'Mi hermano {estudia} matemáticas.', 'Meu irmão {estuda} matemática.', 'O meu irmão {estuda} matemática.'],
      ['They {studied} for the test.', 'Ellos {estudiaron} para el examen.', 'Eles {estudaram} para a prova.', 'Eles {estudaram} para o teste.'],
    ],
  },
  {
    id: 'open', emoji: '🎁', cat: 'family',
    en: { inf: 'open', past: 'opened', pp: 'opened', ing: 'opening' },
    es: { inf: 'abrir', syl: 'a-brir', pp: 'abierto' }, pt: { inf: 'abrir', syl: 'a-brir', pp: 'aberto' },
    mean: { en: 'To move something so you can go in or see inside.', es: 'Mover algo para poder entrar o ver lo que hay dentro.', pt: 'Mexer em algo para poder entrar ou ver o que está dentro.' },
    ex: [
      ['She {opens} the window.', 'Ella {abre} la ventana.', 'Ela {abre} a janela.'],
      ['I {opened} my present.', 'Yo {abrí} mi regalo.', 'Eu {abri} o meu presente.'],
    ],
  },
  {
    id: 'close', emoji: '🚪', cat: 'family',
    en: { inf: 'close', past: 'closed', pp: 'closed', ing: 'closing' },
    es: { inf: 'cerrar', syl: 'ce-rrar', irr: { pres: 'cierro cierras cierra cerramos cerráis cierran' } },
    pt: { inf: 'fechar', syl: 'fe-char' },
    mean: { en: 'To move something so it is not open anymore.', es: 'Mover algo para que ya no esté abierto.', pt: 'Mexer em algo para que deixe de estar aberto.' },
    ex: [
      ['Dad {closes} the door.', 'Papá {cierra} la puerta.', 'O pai {fecha} a porta.'],
      ['I {closed} my eyes.', 'Yo {cerré} los ojos.', 'Eu {fechei} os olhos.'],
    ],
  },
  {
    id: 'talk', emoji: '🗣️', cat: 'communication',
    en: { inf: 'talk', past: 'talked', pp: 'talked', ing: 'talking' },
    es: { inf: 'hablar', syl: 'ha-blar' }, pt: { inf: 'falar', syl: 'fa-lar' },
    mean: { en: 'To say words to someone.', es: 'Decir palabras a alguien.', pt: 'Dizer palavras a alguém.' },
    ex: [
      ['My parrot {talks}!', '¡Mi loro {habla}!', 'Meu papagaio {fala}!', 'O meu papagaio {fala}!'],
      ['We {talked} on the phone.', 'Nosotros {hablamos} por teléfono.', 'Nós {falamos} por telefone.', 'Nós {falámos} ao telefone.'],
    ],
  },
  {
    id: 'listen', emoji: '👂', cat: 'communication',
    en: { inf: 'listen', past: 'listened', pp: 'listened', ing: 'listening' },
    es: { inf: 'escuchar', syl: 'es-cu-char' },
    // escutar = listen (on purpose); ouvir = hear (see "hear" below).
    pt: { inf: 'escutar', syl: 'es-cu-tar' },
    mean: { en: 'To pay attention to sounds with your ears.', es: 'Prestar atención a los sonidos con los oídos.', pt: 'Prestar atenção aos sons com os ouvidos.' },
    ex: [
      ['I {listen} to music.', 'Yo {escucho} música.', 'Eu {escuto} música.'],
      ['The class {listened} to the teacher.', 'La clase {escuchó} a la maestra.', 'A turma {escutou} a professora.'],
    ],
  },
  {
    id: 'sing', emoji: '🎤', cat: 'communication',
    en: { inf: 'sing', past: 'sang', pp: 'sung', ing: 'singing' },
    es: { inf: 'cantar', syl: 'can-tar' }, pt: { inf: 'cantar', syl: 'can-tar' },
    mean: { en: 'To make music with your voice.', es: 'Hacer música con la voz.', pt: 'Fazer música com a voz.' },
    ex: [
      ['The birds {sing} in the morning.', 'Los pájaros {cantan} por la mañana.', 'Os pássaros {cantam} de manhã.'],
      ['She {sang} a song.', 'Ella {cantó} una canción.', 'Ela {cantou} uma canção.'],
    ],
  },
  {
    id: 'help', emoji: '🤝', cat: 'family',
    en: { inf: 'help', past: 'helped', pp: 'helped', ing: 'helping' },
    es: { inf: 'ayudar', syl: 'a-yu-dar' }, pt: { inf: 'ajudar', syl: 'a-ju-dar' },
    mean: { en: 'To make things easier for someone.', es: 'Hacer las cosas más fáciles para alguien.', pt: 'Tornar as coisas mais fáceis para alguém.' },
    ex: [
      ['I {help} my mom in the kitchen.', 'Yo {ayudo} a mi mamá en la cocina.', 'Eu {ajudo} a minha mãe na cozinha.'],
      ['My friend {helped} me.', 'Mi amigo me {ayudó}.', 'Meu amigo me {ajudou}.', 'O meu amigo {ajudou}-me.'],
    ],
  },
  {
    id: 'climb', emoji: '🧗', cat: 'movement',
    en: { inf: 'climb', past: 'climbed', pp: 'climbed', ing: 'climbing' },
    es: { inf: 'subir', syl: 'su-bir' },
    pt: { inf: 'subir', syl: 'su-bir', irr: { pres: 'subo sobes sobe subimos subis sobem' } },
    mean: { en: 'To go up something, often using your hands and feet.', es: 'Ir hacia arriba, a veces con las manos y los pies.', pt: 'Ir para cima, às vezes com as mãos e os pés.' },
    ex: [
      ['The cat {climbs} the tree.', 'El gato {sube} al árbol.', 'O gato {sobe} na árvore.', 'O gato {sobe} à árvore.'],
      ['We {climbed} the mountain.', 'Nosotros {subimos} la montaña.', 'Nós {subimos} a montanha.'],
    ],
  },
  {
    id: 'live', emoji: '🏠', cat: 'family',
    en: { inf: 'live', past: 'lived', pp: 'lived', ing: 'living' },
    es: { inf: 'vivir', syl: 'vi-vir' }, pt: { inf: 'viver', syl: 'vi-ver' },
    mean: { en: 'To have your home in a place.', es: 'Tener tu casa en un lugar.', pt: 'Ter a casa num lugar.' },
    ex: [
      ['We {live} in a big city.', 'Nosotros {vivimos} en una ciudad grande.', 'Nós {vivemos} numa cidade grande.'],
      ['My grandparents {lived} on a farm.', 'Mis abuelos {vivieron} en una granja.', 'Meus avós {viveram} numa fazenda.', 'Os meus avós {viveram} numa quinta.'],
    ],
  },
  {
    id: 'have', emoji: '🎒', cat: 'daily',
    en: { inf: 'have', past: 'had', pp: 'had', ing: 'having', third: 'has' },
    es: {
      inf: 'tener', syl: 'te-ner', fut: 'tendr',
      irr: { pres: 'tengo tienes tiene tenemos tenéis tienen', pret: 'tuve tuviste tuvo tuvimos tuvisteis tuvieron' },
    },
    pt: {
      inf: 'ter', syl: 'ter',
      irr: { pres: 'tenho tens tem temos tendes têm', pret: 'tive tiveste teve tivemos tivestes tiveram', imperf: 'tinha tinhas tinha tínhamos tínheis tinham' },
    },
    mean: { en: 'To own something.', es: 'Ser dueño de algo.', pt: 'Ser dono de algo.' },
    ex: [
      ['I {have} a red bike.', 'Yo {tengo} una bicicleta roja.', 'Eu {tenho} uma bicicleta vermelha.'],
      ['We {had} a cat.', 'Nosotros {tuvimos} un gato.', 'Nós {tivemos} um gato.'],
    ],
  },
  {
    id: 'go', emoji: '🚌', cat: 'movement',
    en: { inf: 'go', past: 'went', pp: 'gone', ing: 'going' },
    es: {
      inf: 'ir', syl: 'ir', ger: 'yendo',
      irr: { pres: 'voy vas va vamos vais van', pret: 'fui fuiste fue fuimos fuisteis fueron', imperf: 'iba ibas iba íbamos ibais iban' },
    },
    pt: { inf: 'ir', syl: 'ir', irr: { pres: 'vou vais vai vamos ides vão', pret: 'fui foste foi fomos fostes foram' } },
    mean: { en: 'To move from one place to another.', es: 'Moverse de un lugar a otro.', pt: 'Mover-se de um lugar para outro.' },
    ex: [
      ['I {go} to school by bus.', 'Yo {voy} a la escuela en autobús.', 'Eu {vou} para a escola de ônibus.', 'Eu {vou} para a escola de autocarro.'],
      ['We {went} to the zoo.', 'Nosotros {fuimos} al zoológico.', 'Nós {fomos} ao zoológico.', 'Nós {fomos} ao jardim zoológico.'],
    ],
  },
  {
    id: 'make', emoji: '🛠️', cat: 'daily',
    en: { inf: 'make', past: 'made', pp: 'made', ing: 'making' },
    es: {
      inf: 'hacer', syl: 'ha-cer', fut: 'har', pp: 'hecho',
      irr: { pres: 'hago haces hace hacemos hacéis hacen', pret: 'hice hiciste hizo hicimos hicisteis hicieron' },
      note: { en: '"Hacer" means both "make" and "do".', es: 'En inglés, «hacer» puede ser «make» o «do».', pt: 'Em inglês, «hacer» pode ser «make» ou «do».' },
    },
    pt: {
      inf: 'fazer', syl: 'fa-zer', fut: 'far', pp: 'feito',
      irr: { pres: 'faço fazes faz fazemos fazeis fazem', pret: 'fiz fizeste fez fizemos fizestes fizeram' },
      note: { en: '"Fazer" means both "make" and "do".', es: 'En inglés, «fazer» puede ser «make» o «do».', pt: 'Em inglês, «fazer» pode ser «make» ou «do».' },
    },
    mean: { en: 'To create or build something.', es: 'Crear o construir algo.', pt: 'Criar ou construir algo.' },
    ex: [
      ['Grandma {makes} bread.', 'La abuela {hace} pan.', 'A avó {faz} pão.'],
      ['I {made} a paper plane.', 'Yo {hice} un avión de papel.', 'Eu {fiz} um avião de papel.'],
    ],
  },
  {
    id: 'see', emoji: '👀', cat: 'daily',
    en: { inf: 'see', past: 'saw', pp: 'seen', ing: 'seeing' },
    es: {
      inf: 'ver', syl: 'ver', pp: 'visto',
      irr: { pres: 'veo ves ve vemos veis ven', pret: 'vi viste vio vimos visteis vieron', imperf: 'veía veías veía veíamos veíais veían' },
    },
    pt: { inf: 'ver', syl: 'ver', pp: 'visto', irr: { pres: 'vejo vês vê vemos vedes veem', pret: 'vi viste viu vimos vistes viram' } },
    mean: { en: 'To notice things with your eyes.', es: 'Notar las cosas con los ojos.', pt: 'Perceber as coisas com os olhos.' },
    ex: [
      ['I {see} a rainbow!', '¡Yo {veo} un arcoíris!', 'Eu {vejo} um arco-íris!'],
      ['We {saw} a whale.', 'Nosotros {vimos} una ballena.', 'Nós {vimos} uma baleia.'],
    ],
  },
  {
    id: 'want', emoji: '🍦', cat: 'communication',
    en: { inf: 'want', past: 'wanted', pp: 'wanted', ing: 'wanting' },
    es: {
      inf: 'querer', syl: 'que-rer', fut: 'querr',
      irr: { pres: 'quiero quieres quiere queremos queréis quieren', pret: 'quise quisiste quiso quisimos quisisteis quisieron' },
    },
    pt: { inf: 'querer', syl: 'que-rer', irr: { pres: 'quero queres quer queremos quereis querem', pret: 'quis quiseste quis quisemos quisestes quiseram' } },
    mean: { en: 'To wish to have or do something.', es: 'Desear tener o hacer algo.', pt: 'Desejar ter ou fazer algo.' },
    ex: [
      ['I {want} an ice cream.', 'Yo {quiero} un helado.', 'Eu {quero} um sorvete.', 'Eu {quero} um gelado.'],
      ['She {wanted} a puppy.', 'Ella {quería} un perrito.', 'Ela {queria} um cachorrinho.', 'Ela {queria} um cãozinho.'],
    ],
  },
  {
    id: 'hug', emoji: '🤗', cat: 'family',
    en: { inf: 'hug', past: 'hugged', pp: 'hugged', ing: 'hugging' },
    es: { inf: 'abrazar', syl: 'a-bra-zar' }, pt: { inf: 'abraçar', syl: 'a-bra-çar' },
    mean: { en: 'To put your arms around someone you love.', es: 'Rodear con los brazos a alguien que quieres.', pt: 'Envolver alguém com os braços, com carinho.' },
    ex: [
      ['I {hug} my teddy bear.', 'Yo {abrazo} a mi osito.', 'Eu {abraço} o meu ursinho.'],
      ['She {hugged} her grandpa.', 'Ella {abrazó} a su abuelo.', 'Ela {abraçou} o avô.'],
    ],
  },
]

/** French and Dutch are the languages being learned; en/es/pt are the languages the child already speaks. */
export const VERBS: Verb[] = [...BASE, ...MORE_VERBS].map((v) => ({ ...v, fr: FRENCH[v.id], nl: DUTCH[v.id] }))

export const verbById = (id: string) => VERBS.find((v) => v.id === id)
