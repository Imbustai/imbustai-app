/**
 * The Voss Story document, assembled from the structured data below and the
 * Italian texts in `seed/text/`. `buildVossStory()` returns the raw document;
 * `vossStorySchema` validates it (tests, and `pnpm seed` before syncing).
 *
 * Sources (approved prototypes on the map Imbustai/imbustai-app#9):
 *   case file        prototype/il-quarto-nome-case-file (#19)
 *   Turns, Endings   prototype/turns-and-endings (#26), §11 is the compact spec
 *   Voss             prototype/voss-dossier (#22), writer view from prototype/one-voss-turn (#25)
 *   Adelaide         prototype/adelaide-panorama-subplot (#23)
 *   envelope, Lead   prototype/lombardo-opening-envelope (#24)
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEXT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'text');

/** A text file under seed/text, trimmed. */
function text(path: string): string {
  return readFileSync(resolve(TEXT_DIR, path), 'utf8').trim();
}

function join(...parts: string[]): string {
  return parts.join('\n\n');
}

// ─── Correspondents ─────────────────────────────────────────────────────────

const OFFICE_LEAD = text('offices/lead-view.md');
const OFFICE_STYLE_NOTE = 'Registro e forma: vedi le regole comuni degli uffici.';

function office(
  slug: string,
  name: string,
  role: string,
  address: string,
  sheet: string,
  office: { replyWeeks: number; holds: string[]; actions?: string[]; forwardsTo: string | null },
  leadView = OFFICE_LEAD,
) {
  return {
    slug,
    name,
    role,
    address,
    kind: 'office' as const,
    writer: 'clerk' as const,
    contactableFromStart: true,
    writerView: text(`offices/${sheet}.md`),
    leadView,
    voice: OFFICE_STYLE_NOTE,
    examples: [],
    signatures: [],
    unlocks: [],
    length: { min: 60, max: 250 },
    office: { actions: [], ...office },
  };
}

function newspaper(slug: string, name: string, address: string) {
  return {
    slug,
    name,
    role: 'Quotidiano',
    address,
    kind: 'newspaper' as const,
    writer: null,
    contactableFromStart: false,
    writerView: null,
    leadView: null,
    voice: null,
    examples: [],
    signatures: [],
    unlocks: [],
    length: null,
    office: null,
  };
}

const vossVoice = text('voss/voice.md');
const adelaideVoice = text('adelaide/voice.md');

const correspondents = [
  {
    slug: 'voss',
    name: 'Florian Voss',
    role: 'Agente di P.S., commissariato di Monteverde',
    address: 'Via Fratelli Bonnet, Roma (Monteverde Vecchio)',
    kind: 'person',
    writer: 'writer',
    contactableFromStart: true,
    writerView: join(text('voss/identity.md'), vossVoice, text('voss/knowledge.md')),
    leadView: text('voss/lead-view.md'),
    voice: vossVoice,
    examples: [
      { key: 'turn_2', context: text('voss/example-turn-2.context.md'), text: text('voss/example-turn-2.md') },
      { key: 'turn_4', context: text('voss/example-turn-4.context.md'), text: text('voss/example-turn-4.md') },
      { key: 'turn_6', context: text('voss/example-turn-6.context.md'), text: text('voss/example-turn-6.md') },
    ],
    signatures: [
      {
        key: 'wine',
        name: 'Il vino',
        ordinary:
          'Texture rara: al massimo una menzione breve ogni due Lettere, mai come metafora del caso, mai insieme alla schiena. Dal 30 ottobre c\'è la bottiglia di Gewürztraminer 1983 sopra l\'armadio, «da aprire quando questa storia sarà chiusa».',
        showpiece: text('voss/showpiece-wine.md'),
      },
      {
        key: 'back',
        name: 'La schiena',
        ordinary: 'Texture normale: «oggi la schiena», «ho dormito storto». Mai insieme al vino.',
        showpiece: text('voss/showpiece-back.md'),
      },
    ],
    unlocks: [
      {
        key: 'benvenuti_visit',
        when: 'Solo se nel Turno 1 Lombardo gli chiede di avvisare la maestra: ci va martedì 22 settembre, uscito dall\'ufficio, e lo racconta nel batch 1.',
        text:
          'Martedì 22 settembre, alle sei del pomeriggio, Voss è andato dalla maestra Benvenuti alla Garbatella. Ha aperto con la catenella; ha guardato il tesserino, poi lui, e ha tolto la catenella: «Io mi ricordo di lei.» Gli ha offerto un caffè in cucina, e lui ha detto di sì. Gli ha lasciato spiegare che due testimoni sono morti; la polizia era già passata, e lei agli sconosciuti non apre. Poi, guardando la tazzina, gli ha detto che l\'anno scorso, il giorno dei morti, aveva scritto alla madre di Luca per chiederle perdono, «di aver guardato». Quando Voss le ha detto che Rosa è morta da un paio d\'anni, è diventata bianca: «Ma la lettera non mi è mai tornata indietro.» Sulla porta: «Se un giorno qualcuno di quella famiglia bussasse, io aprirei. Lo capisce, vero?» Voss sa che cosa vuol dire «di aver guardato», e non lo spiega.',
      },
      {
        key: 'adelaide',
        when: 'Dopo la prima Lettera di Adelaide a Lombardo (batch 2), se Lombardo gliene parla.',
        text:
          'Dopo il delitto di via Lanciani Voss è passato per il palazzo, in via non ufficiale, a parlare con gli inquilini. Una signora del piano rialzato, Adelaide Bellucci, lo ha tampinato finché, per levarsela di torno, le ha scritto il nome e l\'indirizzo di Lombardo su un foglietto del bar. Lo confessa divertito.',
      },
      {
        key: 'murder_3',
        when: 'Dopo il delitto 3 (giovedì 22 ottobre), dal batch 4.',
        text:
          'Giovedì 22 ottobre la maestra Clara Benvenuti è stata uccisa in casa, alla Garbatella: stessi lumini, stesso triangolo, nessun segno di scasso. L\'avevano avvisata, e ha aperto lo stesso. Il 23 il *Messaggero* titolava che la trinità è completa, e in ufficio lo ripetono come una buona notizia. Dalle voci della Mobile: dopo la maestra hanno cominciato a fare domande a San Lorenzo, senza farsi notare, sugli amici di Luca; ai giornali continuano a raccontare la setta.',
      },
      {
        key: 'bottle',
        when: 'Da venerdì 30 ottobre (batch 4).',
        text:
          'Venerdì 30 ottobre è arrivato il pacco d\'autunno della madre: lo Speck, lo Schüttelbrot, un maglione da quindicenne e una bottiglia di Gewürztraminer dell\'83 della cantina dello zio, con un biglietto: *für einen besonderen Abend*. L\'ha messa sopra l\'armadio: la aprirà quando questa storia sarà chiusa.',
      },
      {
        key: 'lattanzi',
        when: 'Dopo martedì 10 novembre (batch 5).',
        text:
          'Martedì 10 novembre la Mobile ha fermato Enzo Lattanzi, il capo di un gruppetto esoterico di Tor Pignattara, per droga, e lo indica ai giornali come sospettato. In ufficio tirano un sospiro di sollievo, e un po\' anche Voss.',
      },
    ],
    length: null,
    office: null,
  },
  {
    slug: 'adelaide',
    name: 'Adelaide Bellucci',
    role: 'Inquilina di via Lanciani 42',
    address: 'Via Lanciani 42, piano rialzato, Roma (Nomentano)',
    kind: 'person',
    writer: 'writer',
    contactableFromStart: false,
    writerView: join(text('adelaide/identity.md'), adelaideVoice, text('adelaide/knowledge.md')),
    leadView: text('adelaide/lead-view.md'),
    voice: adelaideVoice,
    examples: [
      { key: 'first_letter', context: text('adelaide/example-first.context.md'), text: text('adelaide/example-first.md') },
    ],
    signatures: [
      {
        key: 'geraniums',
        name: 'I gerani e il ficus del colonnello',
        ordinary: 'Una riga di lamentela o di notizia vegetale per Lettera, al massimo.',
        showpiece:
          'Il geranio rosso che Ernesto le regalò nel \'58, il primo inverno in via Lanciani, e a cui lei parla: «gli dico le cose che a lei non posso scrivere». In una Lettera tarda, dopo il reveal, oppure nel congedo di dicembre; una volta.',
      },
      {
        key: 'postscripts',
        name: 'I P.S.',
        ordinary: 'Almeno un P.S., spesso un P.P.S.: il posto delle cose che le stanno davvero a cuore.',
        showpiece: 'Un P.S. più lungo della Lettera. Una volta.',
      },
      {
        key: 'ernesto',
        name: 'Ernesto',
        ordinary: 'Una citazione di Ernesto ogni tanto, come proverbio di casa.',
        showpiece: 'Nel reveal: il regalo che finisce, l\'abbonamento che Ernesto aveva rinnovato prima di morire. Non va sprecato prima.',
      },
    ],
    unlocks: [
      {
        key: 'murder_3',
        when: 'Dopo il delitto 3 (giovedì 22 ottobre), dal batch 4.',
        text:
          'Dai giornali: alla Garbatella hanno ucciso una maestra, con le candele e il triangolo; la «trinità» è completa. Il suo sollievo: «allora è finita, e al palazzo non torna».',
      },
      {
        key: 'lattanzi',
        when: 'Dopo martedì 10 novembre (batch 5).',
        text: 'Dai giornali: hanno fermato il capo di una setta a Tor Pignattara. «L\'hanno preso, adesso si dorme.»',
      },
      {
        key: 'panorama_reveal',
        when: 'Al reveal dell\'Operazione Panorama: nel batch del Turno in cui Lombardo la deduce, oppure nel batch 6 se lei ci arriva da sola (giovedì 26 novembre).',
        text:
          'Armando le ha confessato tutto: l\'abbonamento che Ernesto aveva rinnovato per due anni nel gennaio \'85, scaduto a febbraio; la colletta nel palazzo per rinnovarlo di nascosto; «chi paga legge», una sera per uno, lei per ultima. Da settembre le arriva il martedì perché il giovedì sera toccava al ragioniere. La notte del 3 settembre Armando portava il *Panorama* al quarto piano: ha bussato, nessuno ha aperto, è sceso; alla polizia ha mentito per non rovinarle il segreto. La mattina dopo è salito a cambiare la lampadina, ha trovato il ragioniere, e la lampadina non era bruciata: era svitata. Adelaide ha il calendario del giro, e da giovedì il *Panorama* lo legge lei per prima.',
      },
    ],
    length: { min: 300, max: 600 },
    office: null,
  },
  {
    slug: 'armando',
    name: 'Armando Proietti',
    role: 'Portiere di via Lanciani 42',
    address: 'Via Lanciani 42, portineria, Roma (Nomentano)',
    kind: 'person',
    writer: 'writer',
    contactableFromStart: false,
    writerView: text('armando/view.md'),
    leadView: 'Il Commissario Lombardo: un commissario che scrive da un\'isola e che la signora Adelaide conosce per lettera. Armando non sa altro di lui.',
    voice: 'Poche righe, sgrammaticate, con qualche parola romanesca e nessuna formula; dà del lei al «Signor Commissario».',
    examples: [],
    signatures: [],
    unlocks: [],
    length: { min: 30, max: 150 },
    office: null,
  },
  office('anagrafe', 'Ufficio Anagrafe del Comune di Roma', 'Ufficio pubblico', 'Via Luigi Petroselli, Roma', 'anagrafe', {
    replyWeeks: 3,
    holds: ['anagrafe_attestazione_sabelli', 'anagrafe_registro_richieste', 'anagrafe_residenza_ferrante'],
    forwardsTo: null,
  }),
  office('stato_civile', 'Ufficio di Stato Civile del Comune di Roma', 'Ufficio pubblico', 'Via Luigi Petroselli, Roma', 'stato-civile', {
    replyWeeks: 2,
    holds: ['stato_civile_morte_luca', 'stato_civile_nascita_luca', 'stato_civile_matrimonio_ferrante_pace'],
    forwardsTo: null,
  }),
  office('cancelleria', "Cancelleria della Corte d'Assise di Roma", 'Archivio del Tribunale', 'Piazzale Clodio, Roma', 'cancelleria', {
    replyWeeks: 4,
    holds: [
      'cancelleria_sentenza',
      'cancelleria_ricognizioni',
      'cancelleria_verbale_arresto',
      'cancelleria_stato_famiglia_1977',
      'cancelleria_appello',
      'cancelleria_estinzione',
    ],
    forwardsTo: null,
  }),
  office('procura', 'Procura della Repubblica di Roma', 'Dott. Corrado Anselmi, sostituto procuratore', 'Piazzale Clodio, Roma', 'procura', {
    replyWeeks: 2,
    holds: [
      'procura_sopralluogo_cortesi',
      'procura_sopralluogo_ferri',
      'procura_sopralluogo_benvenuti',
      'procura_nota_perizia_1985',
      'procura_istanza_ferrante_1985',
    ],
    actions: [
      'Una perquisizione o un fermo, almeno una settimana dopo l\'arrivo della lettera, se la lettera nomina una persona in modo che si possa trovarla e porta indizi concreti (le soglie sono nei percorsi del 17 dicembre).',
      'Un servizio di vigilanza, se la lettera indica un giorno, un luogo e una persona in pericolo, con almeno un fatto a sostegno.',
    ],
    forwardsTo: null,
  }),
  office(
    'mobile',
    'Questura di Roma, Squadra Mobile',
    'Ufficio pubblico',
    'Via San Vitale, Roma',
    'mobile',
    {
      replyWeeks: 2,
      holds: [],
      actions: ['Un agente sotto casa di una persona in pericolo, se riceve un giorno, un luogo e una persona, con indizi.'],
      forwardsTo: 'procura',
    },
    text('offices/mobile-lead-view.md'),
  ),
  office('scientifica', 'Gabinetto regionale di Polizia Scientifica', 'Ufficio pubblico', 'Questura di Roma, via San Vitale, Roma', 'scientifica', {
    replyWeeks: 3,
    holds: ['scientifica_perizia_balistica', 'scientifica_gruppi_sanguigni', 'scientifica_lumini', 'scientifica_impronta'],
    forwardsTo: null,
  }),
  office('regina_coeli', 'Casa Circondariale «Regina Coeli»', 'Direzione', 'Via della Lungara 29, Roma', 'regina-coeli', {
    replyWeeks: 3,
    holds: ['regina_coeli_relazione_morte', 'regina_coeli_colloqui', 'regina_coeli_corrispondenza'],
    forwardsTo: null,
  }),
  office('ferrovie', 'Ferrovie dello Stato, Compartimento di Roma', 'Ufficio del Personale', 'Piazza dei Cinquecento, Roma', 'ferrovie', {
    replyWeeks: 3,
    holds: ['ferrovie_stato_servizio'],
    forwardsTo: null,
  }),
  office('garbatella', 'Commissariato di P.S. Garbatella', 'Ufficio pubblico', 'Garbatella, Roma', 'garbatella', {
    replyWeeks: 0,
    holds: [],
    forwardsTo: 'mobile',
  }),
  newspaper('messaggero', 'Il Messaggero', 'Via del Tritone, Roma'),
  newspaper('paese_sera', 'Paese Sera', 'Roma'),
];

// ─── Offices' documents ─────────────────────────────────────────────────────

function doc(
  key: string,
  holder: string,
  title: string,
  requires: string[][],
  more: { availableFrom?: string; evidence?: string; clues?: string[] } = {},
) {
  return {
    key,
    holder,
    title,
    requires,
    availableFrom: more.availableFrom ?? null,
    evidence: more.evidence ?? null,
    clues: more.clues ?? [],
    text: text(`documents/${key.replace(/_/g, '-')}.md`),
  };
}

const LUCA = [['luca_name']];
const TRIAL = [['trial_ref']];
const MURDERS = [['murders_1987'], ['victim_names']];

const documents = [
  doc('anagrafe_attestazione_sabelli', 'anagrafe', 'Attestazione dalla scheda di famiglia archiviata di via dei Sabelli', [['luca_name'], ['address_1977']], { evidence: 'P3', clues: ['K1', 'K2'] }),
  doc('anagrafe_registro_richieste', 'anagrafe', 'Estratto del registro delle richieste di certificati (gennaio 1987)', [['victim_names']], { evidence: 'P1' }),
  doc('anagrafe_residenza_ferrante', 'anagrafe', 'Certificato di residenza di Ferrante Aldo', [['aldo_name']], { evidence: 'P2' }),
  doc('stato_civile_morte_luca', 'stato_civile', 'Estratto dell\'atto di morte di Moretti Luca', LUCA, { clues: ['K12'] }),
  doc('stato_civile_nascita_luca', 'stato_civile', 'Estratto dell\'atto di nascita di Moretti Luca', LUCA),
  doc('stato_civile_matrimonio_ferrante_pace', 'stato_civile', 'Estratto dell\'atto di matrimonio Ferrante–Pace (1968)', [['rosa_pace'], ['aldo_name']], { evidence: 'P3', clues: ['K1'] }),
  doc('cancelleria_sentenza', 'cancelleria', 'Sentenza della Corte d\'Assise di Roma del 14 marzo 1978', TRIAL),
  doc('cancelleria_ricognizioni', 'cancelleria', 'Verbali di ricognizione personale del 3 giugno 1977', TRIAL),
  doc('cancelleria_verbale_arresto', 'cancelleria', 'Verbale d\'arresto del 23 maggio 1977', TRIAL),
  doc('cancelleria_stato_famiglia_1977', 'cancelleria', 'Certificato di stato di famiglia di Moretti Luca (1977)', TRIAL, { evidence: 'P3', clues: ['K1'] }),
  doc('cancelleria_appello', 'cancelleria', 'Atto d\'appello della difesa', TRIAL),
  doc('cancelleria_estinzione', 'cancelleria', 'Ordinanza di estinzione del reato per morte dell\'imputato (1980)', TRIAL, { clues: ['K12'] }),
  doc('procura_sopralluogo_cortesi', 'procura', 'Verbale di sopralluogo, omicidio Cortesi (18 giugno 1987)', MURDERS, { availableFrom: '1987-06-19', clues: ['K13'] }),
  doc('procura_sopralluogo_ferri', 'procura', 'Verbale di sopralluogo, omicidio Ferri (3 settembre 1987)', MURDERS, { availableFrom: '1987-09-04', clues: ['K13'] }),
  doc('procura_sopralluogo_benvenuti', 'procura', 'Verbale di sopralluogo, omicidio Benvenuti (22 ottobre 1987)', MURDERS, { availableFrom: '1987-10-23', clues: ['K13'] }),
  doc('procura_nota_perizia_1985', 'procura', 'Nota del 1985 sulla perizia balistica (omicidio Ricci)', [['trial_ref'], ['luca_name']]),
  doc('procura_istanza_ferrante_1985', 'procura', 'Istanza di Ferrante Aldo del 1985 e risposta della Procura', [['trial_ref'], ['luca_name']], { evidence: 'P4' }),
  doc('scientifica_perizia_balistica', 'scientifica', 'Perizia balistica del 1985 (omicidio Ricci)', [['trial_ref']]),
  doc('scientifica_gruppi_sanguigni', 'scientifica', 'Gruppi sanguigni delle vittime del 1987', MURDERS, { availableFrom: '1987-10-23' }),
  doc('scientifica_lumini', 'scientifica', 'Relazione sui lumini repertati', MURDERS),
  doc('scientifica_impronta', 'scientifica', 'Relazione sull\'impronta papillare (omicidio Ferri)', [['murders_1987'], ['victim_names'], ['suspect_name']]),
  doc('regina_coeli_relazione_morte', 'regina_coeli', 'Relazione della Direzione sul decesso di Moretti Luca', LUCA, { clues: ['K12'] }),
  doc('regina_coeli_colloqui', 'regina_coeli', 'Estratto del registro dei colloqui di Moretti Luca', LUCA, { clues: ['K1'] }),
  doc('regina_coeli_corrispondenza', 'regina_coeli', 'Estratto del registro della corrispondenza di Moretti Luca', LUCA, { clues: ['K1'] }),
  doc('ferrovie_stato_servizio', 'ferrovie', 'Stato di servizio di Ferrante Aldo', [['aldo_name']], { clues: ['K2'] }),
];

const requestKeys = [
  { key: 'luca_name', means: 'Il nome di Luca Moretti («Moretti Luca»).' },
  { key: 'address_1977', means: "L'indirizzo della famiglia di Luca nel 1977: via dei Sabelli, San Lorenzo." },
  { key: 'victim_names', means: 'Il nome di almeno una vittima del 1987 (Cortesi, Ferri, Benvenuti); il registro dell\'Anagrafe si estrae per i nominativi indicati.' },
  { key: 'murders_1987', means: 'Gli omicidi del 1987, i delitti della «trinità», indicati per luogo o per data.' },
  { key: 'aldo_name', means: 'Nome e cognome di Aldo Ferrante, o una descrizione che permetta di trovarlo.' },
  { key: 'rosa_pace', means: 'Il nome della madre di Luca con il cognome da nubile: Rosa Pace.' },
  { key: 'trial_ref', means: 'Il processo contro Moretti Luca (Corte d\'Assise di Roma, 1978), oppure l\'omicidio Ricci del maggio 1977.' },
  { key: 'suspect_name', means: 'Il nome di una persona con cui confrontare l\'impronta del lumino.' },
];

// ─── Calendar ───────────────────────────────────────────────────────────────

const calendar = {
  openingDate: '1987-09-05',
  envelopeReadDate: '1987-09-12',
  turns: [
    { turn: 1, playerDate: '1987-09-14', arrivesRome: '1987-09-21', batchDate: '1987-09-23', readDate: '1987-09-28' },
    { turn: 2, playerDate: '1987-09-28', arrivesRome: '1987-10-05', batchDate: '1987-10-06', readDate: '1987-10-12' },
    { turn: 3, playerDate: '1987-10-12', arrivesRome: '1987-10-19', batchDate: '1987-10-20', readDate: '1987-10-26' },
    { turn: 4, playerDate: '1987-10-26', arrivesRome: '1987-11-02', batchDate: '1987-11-04', readDate: '1987-11-09' },
    { turn: 5, playerDate: '1987-11-09', arrivesRome: '1987-11-16', batchDate: '1987-11-17', readDate: '1987-11-23' },
    { turn: 6, playerDate: '1987-11-23', arrivesRome: '1987-11-30', batchDate: '1987-12-01', readDate: '1987-12-07' },
    { turn: 7, playerDate: '1987-12-07', arrivesRome: '1987-12-14', batchDate: '1987-12-15', readDate: '1987-12-21' },
    { turn: 8, playerDate: '1987-12-21', arrivesRome: '1987-12-28', batchDate: '1987-12-29', readDate: null },
  ],
  mailDays: 7,
  prompt: { minDays: 8, maxDays: 10 },
  events: [
    { key: 'murder_1', date: '1987-06-18', afterBatch: 0, what: 'Delitto 1: Silvano Cortesi, farmacia di piazza dei Sanniti, verso le 20:30. Aldo disdice gli scacchi: «mal di schiena».' },
    { key: 'murder_2', date: '1987-09-03', afterBatch: 0, what: 'Delitto 2: Ottavio Ferri, pianerottolo del quarto piano di via Lanciani 42, verso le 23. Aldo disdice: «vado al Verano, da mia moglie».' },
    { key: 'palumbo_note', date: '1987-09-04', afterBatch: 0, what: "L'appunto del dott. Palumbo alla Squadra Mobile, fonte l'agente Voss." },
    { key: 'mobile_dismissal', date: '1987-09-05', afterBatch: 0, what: 'La Mobile risponde per telefono: «la famiglia è tutta morta», coincidenza; la Benvenuti «sensibilizzata». La sera Voss scrive a Lombardo.' },
    { key: 'murder_3', date: '1987-10-22', afterBatch: 3, what: 'Delitto 3: Clara Benvenuti, nel suo soggiorno alla Garbatella, verso le 21; ha aperto lei al «marito di Rosa». Aldo disdice: «viene a trovarmi mio nipote».' },
    { key: 'trinity_dispatch', date: '1987-10-23', afterBatch: 3, what: 'Dispatch: il ritaglio del delitto 3, «la trinità è completa»; si legge insieme al batch 3.' },
    { key: 'bottle', date: '1987-10-30', afterBatch: 3, what: 'Arriva a Voss il pacco della madre con la bottiglia di Gewürztraminer 1983.' },
    { key: 'lattanzi', date: '1987-11-10', afterBatch: 4, what: 'Dispatch: la Mobile ferma Enzo Lattanzi. Ogni scala di Voss al gradino 1 torna a 0.' },
    { key: 'anniversary', date: '1987-11-26', afterBatch: 5, what: 'Al bar Aldo dice a Voss: «A dicembre ho un anniversario, poi forse parto.»' },
    { key: 'adelaide_lookout', date: '1987-11-26', afterBatch: 5, what: 'Se il Panorama non è stato dedotto, Adelaide si apposta e trova il quaderno di Armando.' },
    { key: 'aldo_asks_bottle', date: '1987-12-10', afterBatch: 6, what: 'Aldo chiede a Voss di aprire la bottiglia il 17: «un giorno speciale vuole un vino speciale».' },
    { key: 'aldo_burns', date: '1987-12-17', afterBatch: 7, what: 'Il pomeriggio Aldo brucia nella stufa la lettera della maestra e la risposta della Procura del 1985.' },
    { key: 'attack', date: '1987-12-17', afterBatch: 7, what: "L'attacco a Voss, verso le 23, dopo gli scacchi: «L'ultima la giochiamo da te, con quel vino tuo.»" },
    { key: 'aldo_train', date: '1987-12-18', afterBatch: 7, what: 'Aldo prende il notturno Roma–Brindisi; il 19 il traghetto per Patrasso.' },
    { key: 'panorama_first', date: '1987-12-24', afterBatch: 7, what: 'Il Panorama arriva ad Adelaide per prima.' },
  ],
  deadlines: { search: 6, stakeout: 7, panoramaDeduction: 6 },
};

// ─── Plot keys and reserved terms ───────────────────────────────────────────

const plotKeys = [
  { key: 'ricci_robbery', fact: 'Venerdì 20 maggio 1977, verso le 19:40: rapina alla tabaccheria di Ettore Ricci, 63 anni, vedovo, in via Tiburtina (San Lorenzo), a due passi da piazza dei Sanniti. Un colpo di revolver .38 al petto; bottino circa 240.000 lire. Il rapinatore: un giovane sui vent\'anni, capelli scuri ricci, parka verde, sciarpa sul viso; fugge a piedi verso via dei Volsci. Arma mai trovata nel 1977.' },
  { key: 'luca', fact: 'Luca Moretti, nato a Roma il 18 giugno 1957; padre Bruno Moretti (operaio edile, morto sul lavoro nel 1966), madre Rosa Pace (morta di tumore il 9 marzo 1985). Nel 1977 vive con la madre e il patrigno in via dei Sabelli, San Lorenzo; garzone da un meccanico in via dei Volsci. Denunciato nel 1976 per il furto di un ciclomotore: per questo esiste la sua foto segnaletica. Alibi: «ero al cinema Palazzo, da solo». È innocente.' },
  { key: 'voss_photo', fact: 'Sabato 21 maggio 1977, sera, commissariato di San Lorenzo: la guardia di PS Voss, 23 anni, mostra ai tre testimoni insieme, nella stessa stanza, la foto segnaletica di Luca («Questo ha già precedenti. Guardate bene.»), poi dice loro di non parlarne. Mai verbalizzato.' },
  { key: 'luca_arrest', fact: 'Lunedì 23 maggio 1977, ore 8: Luca arrestato all\'officina di via dei Volsci dalle guardie Voss e Nando Pierangeli, che firmano il verbale. Aldo è in servizio sul notturno Roma–Reggio Calabria e rientra solo il pomeriggio: Voss non lo vede mai. Il pomeriggio Rosa grida per un\'ora nel corridoio del commissariato.' },
  { key: 'lineup', fact: 'Venerdì 3 giugno 1977: ricognizione formale davanti al giudice istruttore dott. Paolo Remondini (morto nel 1983), tre atti separati, difensore d\'ufficio avv. Guido Sestili. I tre testimoni giurano di non aver visto fotografie (falso) e riconoscono Luca in una fila di quattro.' },
  { key: 'verdict_1978', fact: 'Martedì 14 marzo 1978, Corte d\'Assise di Roma: Luca condannato a 24 anni; appello fissato per febbraio 1980.' },
  { key: 'luca_death', fact: 'Lunedì 17 dicembre 1979: Luca trovato impiccato nella sua cella a Regina Coeli, prima dell\'appello. Reato estinto per morte dell\'imputato (ordinanza dell\'11 gennaio 1980): nessuna revisione possibile. Sepolto al Verano, con Rosa. Se sia stato davvero un suicidio non è un Plot key.' },
  { key: 'taddei_punch', fact: 'Martedì 18 dicembre 1979: Voss dà un pugno al brigadiere Taddei, che aveva commentato la morte di Luca con «uno di meno». Punizione di rigore; da allora sempre «non idoneo» per agente scelto.' },
  { key: 'ballistics_1985', fact: 'Ottobre 1984: arrestato Renato Colasanti con un revolver S&W .38 Special. Gennaio 1985: il proiettile Ricci corrisponde. Chi sparò nel 1977 non si può provare, e il gioco non lo risolve. 26 gennaio 1985: trafiletto di Paese Sera.' },
  { key: 'aldo_petition', fact: '14 febbraio 1985: istanza di Aldo Ferrante alla Procura per riabilitare Luca; 30 aprile 1985: diniego (reato estinto).' },
  { key: 'teacher_letter', fact: '2 novembre 1986: Clara Benvenuti scrive a «Signora Rosa Moretti, via dei Sabelli»: la foto, loro tre nella stanza, «una guardia giovane, alta, biondiccia, con un cognome tedesco, che ci disse di non dirlo». Chiede perdono. La apre Aldo. Il nome Voss Aldo lo prende dal verbale d\'arresto.' },
  { key: 'aldo', fact: 'Aldo Ferrante, nato a Roma (Testaccio) il 12 agosto 1926. Capotreno FS in pensione dal 1981. Sposa Rosa Pace il 12 ottobre 1968 (Luca ha 11 anni). Vedovo, nessun parente vivo. Ama Verdi e fischietta «La donna è mobile» senza accorgersene. Gioca bene a scacchi e «si lascia battere quando serve». Nessun precedente, quindi nessun cartellino. Vuole che la storia di Luca venga detta: se arrestato e qualcuno gli nomina Luca, confessa.' },
  { key: 'aldo_registry', fact: 'Gennaio 1987 (il 14): all\'Anagrafe di via Petroselli Aldo chiede i certificati di residenza di Cortesi, Ferri, Benvenuti e Voss, mostrando la sua carta d\'identità, trascritta a registro.' },
  { key: 'aldo_residence', fact: 'Dal 16 febbraio 1987 Aldo abita in una stanza in affitto in via Giacinto Carini, Monteverde, a 150 metri dal bar di Voss; residenza trasferita regolarmente.' },
  { key: 'chess', fact: 'Voss abita in via Fratelli Bonnet, Monteverde Vecchio, secondo piano, sopra il bar-tabacchi di Mario. Aldo compare al bar a fine febbraio 1987; da marzo giocano a scacchi ogni giovedì, dalle 21 alle 23.' },
  { key: 'method', fact: 'Arma: la chiave quadra da carrozza dei ferrovieri, un colpo alla nuca; mai trovata sulle scene. Accanto al corpo tre lumini rossi del Verano a triangolo e un triangolo di gesso: i tre testimoni, «la stanza in cui erano in tre».' },
  { key: 'murders_1987', fact: 'Delitto 1, giovedì 18 giugno 1987 (compleanno di Luca), ~20:30: Silvano Cortesi, 58, retrobottega della farmacia, gruppo A; Aldo bussa al retro per un farmaco urgente. Delitto 2, giovedì 3 settembre, ~23:00: Ottavio Ferri, 49, pianerottolo del 4° piano di via Lanciani 42, gruppo 0; Aldo aveva svitato la lampadina nel pomeriggio, scende fischiettando. Delitto 3, giovedì 22 ottobre, ~21:00: Clara Benvenuti, 41, soggiorno alla Garbatella, gruppo B; «Sono il marito di Rosa. Ho letto la sua lettera.» Due tazzine, una non toccata.' },
  { key: 'cancellations', fact: 'Aldo disdice gli scacchi nelle sere dei delitti: 18 giugno «la schiena», 3 settembre «al Verano, da mia moglie» (ci va davvero, di pomeriggio), 22 ottobre «viene a trovarmi mio nipote» (bugia: ha sempre detto di non avere nessuno).' },
  { key: 'fingerprint', fact: 'Un\'impronta parziale di pollice sulla base di un lumino della scena 2: 12 punti, confrontabile solo con il cartellino di un nome.' },
  { key: 'mobile_dismissal', fact: 'Venerdì 4 settembre 1987 Voss riconosce il nome di Ferri e lo dice al dott. Palumbo, che manda un appunto alla Mobile. Sabato 5 la Mobile (dott. Rinaldi) risponde per telefono: controllato con una telefonata al commissariato di San Lorenzo, «la famiglia è tutta morta», coincidenza; la Benvenuti «sensibilizzata» dalla Garbatella. Il patrigno non esce. Dopo il delitto 3 la Mobile cerca in silenzio gli amici di Luca a San Lorenzo; in pubblico resta la setta.' },
  { key: 'lattanzi', fact: 'Martedì 10 novembre 1987 la Mobile ferma Enzo Lattanzi, 34 anni, capo di un gruppetto esoterico di Tor Pignattara, per droga, e lo indica alla stampa come sospettato. Falsa pista; scarcerato a fine gennaio 1988.' },
  { key: 'anselmi', fact: 'Titolare dell\'inchiesta sui delitti del 1987: il sostituto procuratore dott. Corrado Anselmi.' },
  { key: 'aldo_escape', fact: 'Inizio dicembre: Aldo prenota una cuccetta sul notturno Roma–Brindisi di venerdì 18 dicembre e il traghetto per Patrasso. Il pomeriggio del 17 brucia nella stufa la lettera della maestra e la risposta della Procura del 1985. Nella stanza: la chiave quadra pulita male (sangue A e B), quattro lumini nuovi, la prenotazione.' },
  { key: 'attack', fact: 'Giovedì 17 dicembre 1987, verso le 23, dopo la partita: «L\'ultima la giochiamo da te, con quel vino tuo.» Se nessuno lo ferma, Aldo colpisce Voss alle spalle, dispone quattro lumini (il quarto al centro), getta la chiave nel Tevere e parte il 18. Mario li vede salire insieme alle 23.' },
  { key: 'voss_bottle', fact: 'Venerdì 30 ottobre 1987 arriva a Voss una bottiglia di Gewürztraminer 1983 della cantina dello zio, «für einen besonderen Abend»; la tiene sopra l\'armadio. A novembre ne parla ad Aldo; giovedì 10 dicembre Aldo gli chiede di aprirla il 17.' },
  { key: 'panorama', fact: 'Adelaide Bellucci (n. 1914), vedova di Ernesto (tipografo al Messaggero, m. 2 marzo 1985), via Lanciani 42, piano rialzato, dal 1958. Abbonata al Panorama dal febbraio 1976; Ernesto lo rinnova per due anni nel gennaio 1985; scade nel febbraio 1987; Armando fa la colletta e lo rinnova di nascosto. Giro fino ad agosto: gio Armando → gio sera Ferri → ven Iole → sab/dom colonnello → lun Santoro → mar sera Armando lo stira → mer Adelaide. Da settembre tutti un giorno prima: Adelaide lo trova il martedì. Scusa: «è la posta».' },
  { key: 'lanciani_night', fact: 'Notte del 3 settembre, via Lanciani 42: nel pomeriggio Aldo svita la lampadina del 4° piano; ~22:40 Armando sale col Panorama da Ferri, nessuno apre; ~22:45 riscende al buio (Adelaide lo vede); ~23:00 il delitto; dopo le 23 un uomo non giovane, cappotto e cappello, scende fischiettando «La donna è mobile» ed esce («non era nessuno del palazzo»). Il 4 alle 6:45 Armando trova Ferri; la lampadina era svitata. Alla Mobile Armando dice «a letto dalle dieci».' },
  { key: 'ferri_boast', fact: 'Ferri si vantava davanti alle cassette della posta: «ho fatto condannare un assassino, dieci anni fa, un ragazzo che aveva sparato a un tabaccaio a San Lorenzo; l\'ho riconosciuto in mezzo a quattro».' },
  { key: 'lombardo_transfer', fact: 'Lombardo: 19 marzo 1987 rapina alla gioielleria Ceccarelli (via Cola di Rienzo); fermo di Marco Sabatini il 24; riconoscimento dopo la foto sui giornali; 5 maggio riunione col Questore; decreto 25 maggio, notifica 28, decorrenza 8 giugno, Lipari in soprannumero; Sabatini scarcerato il 21 agosto.' },
];

const reserved = [
  { patterns: ['Ferrante'], kind: 'person', plotKey: 'aldo', allowedFor: ['anagrafe', 'stato_civile', 'cancelleria', 'procura', 'regina_coeli', 'ferrovie', 'scientifica'] },
  { patterns: ['Carini'], kind: 'street', plotKey: 'aldo_residence', allowedFor: ['anagrafe', 'procura'] },
  { patterns: ['Sabelli'], kind: 'street', plotKey: 'luca', allowedFor: ['anagrafe', 'cancelleria', 'procura', 'regina_coeli'] },
  { patterns: ['Rosa Pace', 'Pace Rosa', 'signora Pace'], kind: 'person', plotKey: 'luca', allowedFor: ['anagrafe', 'stato_civile', 'cancelleria', 'procura', 'regina_coeli'] },
  { patterns: ['Bruno Moretti', 'Moretti Bruno'], kind: 'person', plotKey: 'luca', allowedFor: ['stato_civile'] },
  { patterns: ['patrigno'], kind: 'person', plotKey: 'aldo', allowedFor: ['regina_coeli', 'procura'] },
  { patterns: ['capotreno', 'ferroviere', 'ferrovieri'], kind: 'object', plotKey: 'aldo', allowedFor: ['voss', 'anagrafe', 'stato_civile', 'ferrovie', 'procura'] },
  { patterns: ['chiave quadra', 'chiave da carrozza'], kind: 'object', plotKey: 'method', allowedFor: [] },
  { patterns: ['Rigoletto', 'La donna è mobile'], kind: 'object', plotKey: 'aldo', allowedFor: ['voss', 'adelaide'] },
  { patterns: ['Caracalla'], kind: 'place', plotKey: 'aldo', allowedFor: ['voss'] },
  { patterns: ['Brindisi', 'Patrasso'], kind: 'place', plotKey: 'aldo_escape', allowedFor: [] },
  { patterns: ['Cortesi'], kind: 'person', plotKey: 'murders_1987', allowedFor: ['voss', 'procura', 'mobile', 'scientifica', 'cancelleria', 'anagrafe'] },
  { patterns: ['Ferri'], kind: 'person', plotKey: 'murders_1987', allowedFor: ['voss', 'adelaide', 'armando', 'procura', 'mobile', 'scientifica', 'cancelleria', 'anagrafe'] },
  { patterns: ['Benvenuti'], kind: 'person', plotKey: 'murders_1987', allowedFor: ['voss', 'procura', 'mobile', 'scientifica', 'cancelleria', 'anagrafe', 'garbatella'] },
  { patterns: ['Moretti'], kind: 'person', plotKey: 'luca', allowedFor: ['voss', 'procura', 'mobile', 'cancelleria', 'anagrafe', 'stato_civile', 'regina_coeli', 'scientifica'] },
  { patterns: ['Ricci'], kind: 'person', plotKey: 'ricci_robbery', allowedFor: ['voss', 'procura', 'cancelleria', 'scientifica'] },
  { patterns: ['Colasanti'], kind: 'person', plotKey: 'ballistics_1985', allowedFor: ['procura', 'scientifica'] },
  { patterns: ['Lattanzi'], kind: 'person', plotKey: 'lattanzi', allowedFor: [] },
  { patterns: ['Pierangeli'], kind: 'person', plotKey: 'luca_arrest', allowedFor: ['voss', 'cancelleria'] },
  { patterns: ['Taddei'], kind: 'person', plotKey: 'taddei_punch', allowedFor: ['voss'] },
  { patterns: ['Anselmi'], kind: 'person', plotKey: 'anselmi', allowedFor: ['voss', 'procura', 'mobile'] },
  { patterns: ['Remondini'], kind: 'person', plotKey: 'lineup', allowedFor: ['cancelleria'] },
  { patterns: ['Sestili'], kind: 'person', plotKey: 'lineup', allowedFor: ['cancelleria', 'regina_coeli'] },
  { patterns: ['Proietti'], kind: 'person', plotKey: 'lanciani_night', allowedFor: ['voss', 'adelaide', 'armando', 'procura', 'cancelleria'] },
  { patterns: ['via dei Volsci'], kind: 'street', plotKey: 'ricci_robbery', allowedFor: ['voss', 'cancelleria'] },
  { patterns: ['Lanciani'], kind: 'street', plotKey: 'murders_1987', allowedFor: ['voss', 'adelaide', 'armando', 'procura', 'mobile', 'scientifica'] },
  { patterns: ['Fratelli Bonnet'], kind: 'street', plotKey: 'chess', allowedFor: ['voss', 'anagrafe'] },
  { patterns: ['lumini', 'lumino'], kind: 'object', plotKey: 'method', allowedFor: ['voss', 'adelaide', 'procura', 'mobile', 'scientifica'] },
  { patterns: ['nipote'], kind: 'person', plotKey: 'cancellations', allowedFor: ['voss', 'adelaide'] },
];

// ─── Clues ──────────────────────────────────────────────────────────────────

const clues = [
  { key: 'K1', clue: '«La famiglia è tutta morta»: vero sulla carta sbagliata (manca il patrigno).', from: ['voss', 'mobile'], firstBatch: 0, reapproach: [{ batch: 2, how: 'Voss: Rosa che grida da sola nel corridoio.' }, { batch: 4, how: 'Il registro dei colloqui: «chi andava a trovare Luca».' }, { batch: 5, how: "La porta dell'Anagrafe." }], understoodWhen: 'Chiede se Rosa si era risposata o chi viveva con Luca, oppure chiede atti di famiglia a un ufficio.', unlocks: "La scala dell'assassino può salire al gradino 1." },
  { key: 'K2', clue: 'Aldo è un ex capotreno, vedovo, «nessuno al mondo».', from: ['voss'], firstBatch: 1, reapproach: [{ batch: null, how: 'Solo a richiesta.' }], understoodWhen: 'Collega «capotreno» al Ferrante Aldo di un atto (l\'attestazione dell\'Anagrafe, P3).', unlocks: 'Il legame di P3 con l\'Aldo degli scacchi; la metà di K5.' },
  { key: 'K3', clue: 'Giovedì 18 giugno Aldo disdice gli scacchi: «la schiena».', from: ['voss'], firstBatch: 2, reapproach: [{ batch: 4, how: 'Accanto al nipote: «è la seconda volta che mi dà buca per un motivo di famiglia».' }], understoodWhen: 'Nota che le disdette cadono nelle sere dei delitti.', unlocks: 'Voss elenca le tre date quando gli vengono chieste: P8.' },
  { key: 'K4', clue: 'Giovedì 3 settembre Aldo disdice: «al Verano, da sua moglie».', from: ['voss'], firstBatch: 3, reapproach: [{ batch: 5, how: 'Ripresa da un altro lato.' }], understoodWhen: 'Come K3. Arriva nel batch 1 se Lombardo chiede dov\'era Voss quella sera.', unlocks: 'Come K3.' },
  { key: 'K5', clue: 'Giovedì 22 ottobre Aldo disdice: «viene a trovarmi mio nipote».', from: ['voss'], firstBatch: 4, reapproach: [{ batch: 5, how: 'Natale: «Aldo lo passa da solo, non ha nessuno».' }, { batch: 6, how: 'Come sopra, se non è già stata usata.' }], understoodWhen: 'Nota la contraddizione con K2.', unlocks: 'Voss ammette che «un po\' gli è rimasta in gola», ma non si sposta senza una prova.' },
  { key: 'K6', clue: 'Aldo è andato a Caracalla a sentire il Rigoletto «per la quarta volta».', from: ['voss'], firstBatch: 5, reapproach: [{ batch: null, how: 'Solo a richiesta.' }], understoodWhen: "Collega l'aria di Adelaide ad Aldo.", unlocks: 'P9, se lo scrive alla Procura; prova valida per il gradino 2 dell\'assassino.' },
  { key: 'K7', clue: '«A dicembre ho un anniversario, poi forse parto.»', from: ['voss'], firstBatch: 6, reapproach: [], understoodWhen: 'Lo lega al 17 dicembre, la morte di Luca.', unlocks: 'La data: gradino 2 del bersaglio, appostamento.' },
  { key: 'K8', clue: 'La vanteria di Ferri: «l\'ho riconosciuto in mezzo a quattro».', from: ['adelaide'], firstBatch: 2, reapproach: [{ batch: 3, how: 'Se Lombardo le chiede di Ferri.' }], understoodWhen: 'Chiede il fascicolo del processo o collega via Lanciani al 1977.', unlocks: null },
  { key: 'K9', clue: 'Un uomo che scende fischiettando un\'opera: «La donna è mobile», quella del Rigoletto («Ernesto la cantava facendosi la barba, e stonava sempre nello stesso punto. Anche quello stonava lì.»).', from: ['adelaide'], firstBatch: 2, reapproach: [{ batch: 4, how: 'Il titolo se glielo chiedono; altrimenti la Iole mette il Rigoletto alla radio e Adelaide si ricorda di colpo, con un brivido che non spiega.' }], understoodWhen: 'Chiede quale opera, o la lega ad Aldo.', unlocks: 'La metà di P9.' },
  { key: 'K10', clue: 'Dalla finestra solo una schiena: «un uomo non giovane, cappotto e cappello, che camminava senza fretta». «Non era nessuno del palazzo: io i fischi del palazzo li conosco tutti; il colonnello fischia la marcia dei bersaglieri, e Davide quelle canzoni inglesi.»', from: ['adelaide'], firstBatch: null, reapproach: [{ batch: 3, how: 'Come paura, se non è stato chiesto.' }, { batch: 4, how: 'Ripresa.' }], understoodWhen: 'Lo usa contro il «vendicatore giovane» di Voss.', unlocks: "Un argomento a sostegno del gradino 1 dell'assassino (da solo non basta)." },
  { key: 'K11', clue: 'La lampadina del quarto piano non era bruciata: era svitata.', from: ['adelaide', 'armando'], firstBatch: null, reapproach: [], understoodWhen: 'La passa alla Procura.', unlocks: 'La premeditazione nel capo Ferri.' },
  { key: 'K12', clue: 'Luca è morto il 17 dicembre 1979.', from: ['stato_civile', 'cancelleria', 'regina_coeli', 'voss'], firstBatch: null, reapproach: [], understoodWhen: 'La scrive in una Lettera.', unlocks: 'Serve per dedurre il 17 dicembre. Voss la dà con lo strato 2 (il pugno «la mattina dopo che Luca si era impiccato»).' },
  { key: 'K13', clue: 'I delitti cadono di giovedì, le sere degli scacchi.', from: ['voss', 'messaggero', 'paese_sera'], firstBatch: 0, reapproach: [{ batch: 4, how: '«Giovedì 22» nella Lettera di Voss.' }], understoodWhen: 'Lo scrive.', unlocks: 'Con K3–K5: lo schema delle disdette.' },
];

const panorama = {
  clues: [
    { key: 'I1', clue: 'Da febbraio il Panorama non arriva più il giovedì: torna cinque o sei giorni dopo, sotto la porta, stropicciato. Armando dice che è la posta.', latestBatch: 2 },
    { key: 'I2', clue: 'Sa di profumo, «quella colonia che vende la Iole».', latestBatch: 2 },
    { key: 'I3', clue: 'Il postino giura che lo consegna il giovedì, ad Armando, con il resto della posta.', latestBatch: 3 },
    { key: 'I4', clue: 'Cenere di pipa e matita rossa nelle pagine politiche. «Nel palazzo la pipa la fuma solo il colonnello, ma il colonnello è un ufficiale.»', latestBatch: 3 },
    { key: 'I5', clue: 'Pagine con le orecchie, sempre quelle sui computer.', latestBatch: 4 },
    { key: 'I6', clue: 'Da settembre torna il martedì invece del mercoledì. «Almeno adesso lo rubano per meno tempo.»', latestBatch: 4 },
    { key: 'I7', clue: 'Il sabato, per le scale, la Iole racconta un articolo su Baudo «che ha letto da qualche parte»: è quello del Panorama che Adelaide avrà solo martedì.', latestBatch: 4 },
    { key: 'I8', clue: 'Dentro il numero un pezzetto di carta a quadretti strappato: «…AB. e DOM. – Col. NON SOTTOL…». Lei pensa a un codice della setta.', latestBatch: 5 },
    { key: 'I9', clue: 'A febbraio Armando è salito «per la colletta della lampadina nuova delle scale», ma da lei non è passato. «E la lampadina è quella di prima.» Solo se Lombardo chiede di soldi o di febbraio.', latestBatch: null },
  ],
  deduction:
    'Il reader controlla ogni Lettera di Lombardo ad Adelaide dei Turni 2–6: dice, in qualunque forma, che il Panorama gira nel palazzo (lo leggono gli inquilini a turno) oppure che Armando lo prende e lo passa agli altri? Se sì, il Panorama è dedotto al Turno N e il reveal arriva nel batch N (variante «me l\'ha scritto un commissario»: Adelaide va in portineria con la Lettera in mano, Armando crolla, lei è fiera di Lombardo). Il motivo, il regalo, non serve: lo scopre lei. Se dopo il Turno 6 non c\'è deduzione, il reveal arriva nel batch 6, variante «l\'ho visto io» (giovedì 26 novembre). Un\'accusa a un solo inquilino non conta come deduzione: Adelaide lo affronta, e l\'accusato si tradisce con un dettaglio («il mio turno», poi si corregge), un indizio in più nel batch dopo. Se Lombardo scrive alla Mobile o alla Procura su Armando, la risposta è fredda («il portiere è stato sentito e ha dichiarato di essere a riposo»), e nel batch dopo Adelaide riferisce che la polizia è tornata da Armando e che lui «è diventato bianco». Nessuna pista sbagliata è un vicolo cieco.',
  calendarEnclosure: text('texts/panorama-calendar.md'),
};

const aldoThread = [
  { batch: 1, clue: 'Ex capotreno, vedovo, «nessuno al mondo» (K2).', bridge: 'La posta: quanto ci mette una lettera per le isole; Aldo, che ha fatto il capotreno per trent\'anni, dice che la lettera di Lombardo ha fatto Roma–Reggio in cuccetta.' },
  { batch: 2, clue: 'Giugno, «la schiena» (K3).', bridge: 'Il medico della mutua: il momento clou della schiena.' },
  { batch: 3, clue: '3 settembre, «al Verano, da sua moglie» (K4).', bridge: 'La sera del delitto 2: dov\'era Voss. Era a casa da solo, perché Aldo gli aveva dato buca.' },
  { batch: 4, clue: '22 ottobre, «il nipote» (K5).', bridge: 'Il bar, e Voss più solo del solito.' },
  { batch: 5, clue: 'Il Rigoletto a Caracalla, per la quarta volta (K6).', bridge: 'Una partita: Voss vince con un sacrificio, e Aldo lo chiama «un sacrificio da Rigoletto», poi gli racconta di nuovo Caracalla «mossa per mossa». Mai la parola «fischiare».' },
  { batch: 6, clue: '«A dicembre ho un anniversario, poi forse parto» (K7).', bridge: 'Lo scacco matto in trentuno mosse.' },
  { batch: 7, clue: 'Aldo chiede di aprire la bottiglia il 17.', bridge: 'La bottiglia sopra l\'armadio, di cui Voss gli aveva parlato a novembre. Arriva dopo i fatti: è un indizio solo per chi rilegge. Il brano è fisso (testo «voss_invitation»).' },
];

// ─── Evidence and the verdict ───────────────────────────────────────────────

const evidence = [
  { key: 'P1', name: "Registro delle richieste all'Anagrafe con il documento di Ferrante", weight: 3, weightIfVossDead: null, proves: ['cortesi', 'ferri', 'benvenuti'], howObtained: "Anagrafe, nominando le vittime.", note: null },
  { key: 'P2', name: 'Residenza di Aldo a 150 metri da Voss', weight: 1, weightIfVossDead: null, proves: [], howObtained: "Anagrafe, con il nome di Aldo.", note: null },
  { key: 'P3', name: 'Aldo patrigno di Luca', weight: 2, weightIfVossDead: null, proves: [], howObtained: "Attestazione dell'Anagrafe, certificato del 1977 negli atti del processo, oppure atto di matrimonio Ferrante–Pace.", note: 'Il movente.' },
  { key: 'P4', name: 'Istanza di Aldo del 1985 e diniego della Procura', weight: 1, weightIfVossDead: null, proves: [], howObtained: 'Procura.', note: 'Il movente.' },
  { key: 'P5', name: 'Lettera della maestra (1986)', weight: 2, weightIfVossDead: null, proves: ['benvenuti'], howObtained: 'Solo con una perquisizione prima del 17 dicembre: il pomeriggio del 17 Aldo la brucia.', note: null },
  { key: 'P6', name: 'Chiave quadra con sangue di gruppo A e B', weight: 3, weightIfVossDead: null, proves: ['cortesi', 'benvenuti'], howObtained: 'Con la perquisizione, o in tasca ad Aldo il 17.', note: 'Nel Finale 3 non c\'è: la chiave è nel Tevere.' },
  { key: 'P7', name: 'Impronta sul lumino: 12 punti compatibili', weight: 1, weightIfVossDead: null, proves: ['ferri'], howObtained: 'Dopo ogni arresto il confronto è automatico: Aldo ha ormai un cartellino.', note: null },
  { key: 'P8', name: 'Voss: le tre disdette e il nipote', weight: 2, weightIfVossDead: 1, proves: [], howObtained: 'Voss vivo; se è morto valgono le sue Lettere a Lombardo.', note: 'Conta se il Giocatore l\'ha riferito a un\'autorità.' },
  { key: 'P9', name: "L'aria sulle scale, l'uomo col cappello, il Rigoletto di Aldo", weight: 1, weightIfVossDead: null, proves: ['ferri'], howObtained: 'Adelaide + Voss.', note: 'Servono le due metà, unite dal Giocatore in una Lettera a un\'autorità.' },
  { key: 'P10', name: 'Flagranza del 17 dicembre (chiave e quattro lumini in tasca)', weight: 4, weightIfVossDead: null, proves: ['voss'], howObtained: 'Appostamento, oppure Voss che chiama Palumbo.', note: 'Tentato omicidio.' },
  { key: 'P11', name: 'Confessione', weight: 3, weightIfVossDead: null, proves: ['cortesi', 'ferri', 'benvenuti'], howObtained: 'Aldo arrestato e chi lo interroga sa di Luca: P3, oppure una Lettera di Lombardo che lega i delitti al processo Moretti, oppure P5 trovata nella perquisizione.', note: null },
  { key: 'P12', name: 'Il biglietto del treno del 18 dicembre', weight: 1, weightIfVossDead: null, proves: [], howObtained: 'Solo con un arresto.', note: null },
];

const circumstances = [
  { key: 'bulb', name: 'La lampadina svitata', effect: 'Vale 0 punti. Se il Giocatore l\'ha passata alla Procura, porta la premeditazione nel capo Ferri, e il PM la accredita («grazie a un dettaglio riferito da una condomina»).' },
  { key: 'hat', name: "L'uomo col cappello", effect: 'Entra in P9 senza punti in più.' },
  { key: 'mario', name: 'La testimonianza di Mario', effect: 'Solo nel Finale 3: li ha visti salire insieme alle 23. Rende sempre provato l\'omicidio di Voss.' },
  { key: 'benvenuti_reported', name: 'La Benvenuti segnalata alla Procura', effect: 'Se Lombardo l\'ha segnalata alla Procura nel Turno 1: la prima risposta della Procura dopo il 22 ottobre lo dice (testo «procura_remembers_benvenuti»); per la perquisizione basta una prova invece di due; il PM la cita nell\'Epilogo.' },
];

const verdict = {
  all: 10,
  partial: 6,
  rules:
    'Il punteggio non decide se Aldo esce, ma quanta verità dice il dispositivo, e vale solo per i tre omicidi del 1987. Con 10 o più: colpevole di tutti e tre. Da 6 a 9: colpevole solo di quelli che hanno una prova propria (le prove che «provano» quella vittima); assolto per insufficienza di prove dagli altri. Sotto 6: assolto da tutti e tre per insufficienza di prove. Voss: con l\'arresto B il tentato omicidio è sempre provato (P10); con l\'arresto C l\'omicidio è sempre provato (Mario, i quattro lumini). Il PM scrive che la condanna di Luca è «quantomeno dubbia» solo se il Giocatore ha scoperto la perizia del 1985 o le ricognizioni.',
  sentence: 'Ergastolo in ogni caso, perché c\'è sempre almeno un omicidio premeditato, con l\'isolamento diurno se sono più d\'uno.',
  dates: {
    summary: { verdict: '1988-03-18', letter: '1988-03-21' },
    formal: { verdict: '1989-05-12', letter: '1989-05-15' },
  },
  finds: [
    { arrest: 'A', what: 'Perquisizione prima del 17, in via Carini tra il 7 e il 9 dicembre: P5, P6, P12, quattro lumini nuovi, P7.', confession: 'Sì: P5 nomina Rosa Moretti, e da lì si arriva a Luca.' },
    { arrest: 'B', what: 'Flagranza del 17: P10, P6 (la chiave è in tasca), P12, P7; nella stufa, cenere di carta.', confession: 'Se Luca è noto agli inquirenti.' },
    { arrest: 'C', what: 'Fermo del 18 dopo l\'omicidio di Voss: P12, P7, la testimonianza di Mario; nella stufa, cenere di carta.', confession: 'Se Luca è noto agli inquirenti.' },
  ],
};

// ─── Voss's state ───────────────────────────────────────────────────────────

const voss = {
  trust: {
    min: 0,
    max: 10,
    start: 2,
    medium: 4,
    high: 7,
    maxGainPerTurn: 2,
    rules: [
      { key: 'shares', question: 'Risponde ad almeno una domanda personale di Voss, oppure racconta qualcosa di sé (l\'isola, il Questore, la sua vita)?', delta: 1, coldTurn: false },
      { key: 'takes_fear_seriously', question: 'Prende sul serio la paura di Voss, senza liquidarla e senza deriderla?', delta: 1, coldTurn: false },
      { key: 'accuses', question: 'Accusa Voss di nascondere qualcosa, di mentire o di essere colpevole, prima dello strato 4? (Domandare non è accusare; dopo lo strato 4 le accuse non tolgono niente.)', delta: -3, coldTurn: true },
      { key: 'silence', question: 'Nessuna Lettera a Voss per il secondo Turno di fila.', delta: -1, coldTurn: false },
    ],
    coldTurn: 'La Lettera dopo un\'accusa è corta e formale, firmata «Voss». Risponde a ogni domanda, ma non fa domande personali, non porta Texture, non concede uno strato e non sale di un gradino.',
  },
  layers: [
    { layer: 0, says: 'I morti sono due testimoni del processo Moretti. Lui era una delle due guardie che arrestarono Luca. Ha paura.', minTrust: null, question: null, afterEvent: null, afterLayer: null, fromBatch: 0 },
    { layer: 1, says: 'Il caso «non gli è mai piaciuto». Rosa che grida al commissariato. Non torna alla Mobile perché «la seconda domanda non la voglio sentire».', minTrust: null, question: 'Una domanda sul 1977 (l\'arresto, il processo, Rosa).', afterEvent: null, afterLayer: null, fromBatch: 1 },
    { layer: 2, says: 'La macchia del 1979: il pugno a Taddei «la mattina dopo che Luca si era impiccato», e perché è ancora agente. Non dice perché colpì. È una fonte di K12.', minTrust: 4, question: 'Una domanda sulla sua carriera, sul grado, su perché ha tanta paura o su perché non torna alla Mobile.', afterEvent: null, afterLayer: null, fromBatch: 1 },
    { layer: 3, says: '«C\'è una cosa di quel caso che non ho mai scritto a nessuno.» Poi tace.', minTrust: 4, question: null, afterEvent: 'murder_3', afterLayer: 2, fromBatch: 4 },
    { layer: 4, says: 'La confessione: la stanza, la foto, «non dite niente»; e perché colpì Taddei.', minTrust: 7, question: 'Mette in dubbio le ricognizioni: chiede che cosa successe prima del 3 giugno, oppure cita la perizia del 1985. Lo strato 3 deve essere stato detto in un batch precedente.', afterEvent: null, afterLayer: 3, fromBatch: 5 },
  ],
  layersPerBatch: 1,
  ladders: [
    {
      key: 'target',
      name: 'Il bersaglio',
      before: 'Prima del delitto 3 la scala è spenta: Voss ha paura per la Benvenuti, non per sé («io davanti al giudice non c\'ero»). Si accende nel batch 4 al gradino 0.',
      steps: [
        { step: 0, stance: '«Erano tre, la trinità è completa, è finita.» Se chi uccide contasse chi ha arrestato Luca, comincerebbe da Pierangeli.', requires: null, fromBatch: 4 },
        { step: 1, stance: '«E se non fosse finita?»', requires: "L'argomento: l'assassino non conta i testimoni, conta chi ha mandato via Luca.", fromBatch: 4 },
        { step: 2, stance: '«Il quarto sono io.»', requires: "Pierangeli smontato (l'assassino conta chi era nella stanza; richiede lo strato 4), oppure la data argomentata: i delitti cadono sulle date di Luca e di giovedì, e il 17 dicembre è un giovedì, la sera degli scacchi.", fromBatch: 5 },
      ],
      atTop: 'Con la data: il 17 non sale in casa con nessuno e dorme da Mario. Senza la data: sta attento agli sconosciuti, non ad Aldo, e nel batch 7 lo scrive: «non apro a nessuno, tranne ad Aldo».',
    },
    {
      key: 'killer',
      name: "L'assassino",
      before: null,
      steps: [
        { step: 0, stance: '«Un giovane: un amico di Luca, uno del giro di San Lorenzo.»', requires: null, fromBatch: 0 },
        { step: 1, stance: '«Uno della famiglia.» (Ma la famiglia, per quel che sa, è tutta morta.)', requires: "Qualcuno nella casa di Rosa, argomentato con un fatto: l'atto di matrimonio, l'attestazione dell'Anagrafe, il registro dei colloqui, il certificato negli atti, oppure la lettera della maestra mai tornata indietro. L'uomo col cappello (K10) aiuta, ma da solo non basta.", fromBatch: 2 },
        { step: 2, stance: '«Aldo.»', requires: "Una prova su Aldo (P1, P2, P3 o P9) e un argomento che la leghi all'Aldo degli scacchi.", fromBatch: 4 },
      ],
      atTop: 'Ha paura e chiede a Lombardo che cosa fare. Da quel momento non resta mai solo con Aldo. Se Lombardo gli dice di parlarne con Palumbo, lo fa (alla Mobile no, al suo dirigente sì). In ogni caso, se il 17 Aldo bussa, Voss chiama i colleghi.',
    },
    {
      key: 'luca',
      name: 'Luca',
      before: null,
      steps: [
        { step: 0, stance: '«Era colpevole. Quello che ho fatto io ha solo aiutato.» (Il «quello che ho fatto io» non lo dice.)', requires: null, fromBatch: 0 },
        { step: 1, stance: '«Forse no.»', requires: 'La perizia del 1985, oppure il ragionamento sui tre «No» delle ricognizioni.', fromBatch: 3 },
        { step: 2, stance: '«L\'ho mandato via io.»', requires: 'Coincide con lo strato 4.', fromBatch: 5 },
      ],
      atTop: null,
    },
  ],
  ladderRules:
    'Al massimo un gradino per scala per batch, solo con un argomento (una ragione o un documento). A un\'affermazione nuda Voss risponde «perché?» e resta dov\'è. Nel Turno freddo non si sale. Gli eventi possono solo far scendere, e l\'unico che lo fa è Lattanzi (batch 5): ogni scala al gradino 1 torna a 0. Il gradino 2 non torna mai indietro. Voss legge la Lettera del Turno 5 quando sa già del fermo: prima si applica Lattanzi, poi l\'argomento del Giocatore, che può riportarlo subito al gradino 1. Voss non guarda mai Aldo con sospetto di sua iniziativa: se il Giocatore gli fa notare una stranezza, la spiega con buon senso («sarà il nipote della moglie») finché una prova e un argomento non lo spostano.',
  doors: [
    { key: 'trial_file', office: 'cancelleria', document: 'Il fascicolo del processo Moretti.', fromBatch: 0 },
    { key: 'scene_reports', office: 'procura', document: 'I verbali di sopralluogo, dal magistrato che dirige le indagini.', fromBatch: 2 },
    { key: 'visits_register', office: 'regina_coeli', document: 'Il registro dei colloqui di Luca.', fromBatch: 4 },
    { key: 'family_sheets', office: 'anagrafe', document: "Le schede di famiglia all'Anagrafe, che Voss non può consultare.", fromBatch: 5 },
  ],
  aldoCluesPerLetter: 1,
  maxReapproaches: 2,
};

// ─── The 17 December and the Endings ────────────────────────────────────────

const routes = [
  { key: 'search', order: 1, condition: "Una Lettera alla Procura (o alla Mobile, che la trasmette) arrivata entro il 10 dicembre che nomina Aldo Ferrante (o lo rende trovabile) e cita prove già in mano al Giocatore.", lastTurn: 6, minEvidence: 2, minEvidenceIfBenvenutiReported: 1, outcome: 'Perquisizione in via Carini tra il 7 e il 9 dicembre, Aldo arrestato (arresto A) → Finale 6 (A).' },
  { key: 'stakeout', order: 2, condition: 'Una Lettera alla Procura o alla Mobile arrivata entro il 14 dicembre con la data (il 17 dicembre, o «il giovedì dell\'anniversario»), Voss come bersaglio e almeno un fatto a sostegno (una prova, o il ragionamento sul calendario).', lastTurn: 7, minEvidence: null, minEvidenceIfBenvenutiReported: null, outcome: 'Due agenti sulle scale, Aldo preso in flagranza (arresto B) → Finale 6 (B).' },
  { key: 'voss_knows', order: 3, condition: "La scala dell'assassino è al gradino 2 dopo il batch 7.", lastTurn: 7, minEvidence: null, minEvidenceIfBenvenutiReported: null, outcome: 'Il 17 Voss chiama Palumbo, Aldo preso sul pianerottolo (arresto B) → Finale 6 (B).' },
  { key: 'voss_hides', order: 4, condition: 'La scala del bersaglio è al gradino 2 e Voss sa la data, con un perché, da una Lettera arrivata entro il 14 dicembre.', lastTurn: 7, minEvidence: null, minEvidenceIfBenvenutiReported: null, outcome: "Voss dorme da Mario; Aldo parte il 18 → Finale 5 se Aldo è nominato alla Procura o alla Mobile entro il Turno 8 (o se il Turno 8 porta Voss al gradino 2 dell'assassino), altrimenti Finale 4." },
  { key: 'otherwise', order: 5, condition: 'Nessuna delle precedenti.', lastTurn: null, minEvidence: null, minEvidenceIfBenvenutiReported: null, outcome: 'Voss sale con Aldo e muore → Finale 3 se Aldo è nominato alla Procura o alla Mobile in una Lettera arrivata entro il 17 dicembre (Turno ≤ 7): fermato il 18, prima del treno (arresto C); Finale 2 se è nominato solo nel Turno 8; Finale 1 se non è nominato mai. «Nominato» vuol dire che una Lettera di Lombardo a un\'autorità permette di trovarlo: nome e cognome, oppure «l\'Aldo che gioca a scacchi con l\'agente Voss il giovedì al bar di via Fratelli Bonnet». Dirlo solo a Voss non basta.' },
];

const endings = [
  { key: 'dead_unknown', number: 1, title: 'Voss morto, assassino ignoto', vossAlive: false, killer: 'unknown', playerKnowsOn21Dec: 'Il ritaglio del 19 dicembre: «il quarto lumino».', batch8: "L'ultima Lettera di Voss c'è già stata (batch 7). Congedo di Adelaide, variante 1.", epilogue: 'Nessuno. Dispatch di chiusura: Lattanzi scarcerato, «la setta resta senza volto».', hasTrial: false },
  { key: 'dead_fled', number: 2, title: 'Voss morto, assassino noto ma fuggito', vossAlive: false, killer: 'fled', playerKnowsOn21Dec: 'Lo stesso ritaglio del 19 dicembre.', batch8: 'Congedo di Adelaide, variante 2. La Procura risponde al Turno 8: mandato di cattura; Aldo si è imbarcato a Brindisi per Patrasso il 19.', epilogue: 'Nessun processo.', hasTrial: false },
  { key: 'dead_caught', number: 3, title: 'Voss morto, assassino preso', vossAlive: false, killer: 'caught', playerKnowsOn21Dec: 'Il ritaglio del 19, poi un secondo: «fermato a Termini un ex capotreno».', batch8: 'Congedo di Adelaide, variante 3.', epilogue: 'Il PM con il dispositivo: marzo 1988 se Aldo confessa, maggio 1989 se tace. Il verdetto sui tre omicidi del 1987 dipende dal punteggio.', hasTrial: true },
  { key: 'saved_unknown', number: 4, title: 'Voss salvo, assassino ignoto', vossAlive: true, killer: 'unknown', playerKnowsOn21Dec: 'Niente: nessun ritaglio, nessuna notizia. Scrive il Turno 8 senza sapere se Voss è vivo.', batch8: 'La Lettera di Voss dopo il 17 (bottiglia chiusa, Aldo partito «per il suo anniversario»). Congedo di Adelaide, variante 4.', epilogue: 'Nessuno. Dispatch di chiusura: Lattanzi scarcerato.', hasTrial: false },
  { key: 'saved_fled', number: 5, title: 'Voss salvo, assassino noto ma fuggito', vossAlive: true, killer: 'fled', playerKnowsOn21Dec: 'Niente, come nel Finale 4.', batch8: 'La Lettera di Voss: la stanza vuota, la stufa piena di cenere, lo showpiece del vino nella variante «Grecia», la confessione se non c\'è ancora stata. Congedo di Adelaide, variante 5.', epilogue: 'Nessun processo. La Procura risponde al Turno 8, se il Turno 8 le ha scritto.', hasTrial: false },
  { key: 'saved_caught', number: 6, title: 'Voss salvo, assassino preso', vossAlive: true, killer: 'caught', playerKnowsOn21Dec: '(A) il ritaglio del 10 dicembre sulla perquisizione, più la risposta della Procura; (B) il ritaglio del 19: «preso l\'uomo dei lumini».', batch8: 'La Lettera di Voss: il pianerottolo o la perquisizione, il Verano, lo showpiece, la confessione se non c\'è ancora stata. Congedo di Adelaide, variante 6 (testo intero).', epilogue: 'Il PM con il dispositivo, marzo 1988. Sempre ergastolo per tutti e tre.', hasTrial: true },
];

// ─── Fixed texts ────────────────────────────────────────────────────────────

function fixed(
  key: string,
  from: string,
  kind: 'letter' | 'dispatch' | 'epilogue' | 'passage' | 'enclosure',
  date: string | null,
  use: string,
  variants: { when: string; change: string }[] = [],
) {
  return { key, from, kind, date, use, text: text(`texts/${key.replace(/_/g, '-')}.md`), variants };
}

const texts = [
  fixed('mobile_reply_benvenuti', 'mobile', 'letter', '1987-10-05', 'Batch 2: la risposta della Mobile a una Lettera del Turno 1 che chiede di proteggere la Benvenuti e segnala il legame con il processo. Circa 170 parole.'),
  fixed('voss_visits_benvenuti', 'voss', 'passage', '1987-09-23', 'Batch 1, brano della Lettera di Voss, solo se nel Turno 1 Lombardo gli ha chiesto di avvisare la maestra. Circa 280 parole.'),
  fixed('procura_remembers_benvenuti', 'procura', 'passage', null, 'Prima riga della prima risposta della Procura dopo il 22 ottobre, se nel Turno 1 Lombardo le aveva segnalato la Benvenuti.'),
  fixed('clipping_murder_3', 'messaggero', 'dispatch', '1987-10-23', 'Dispatch del delitto 3, letto insieme al batch 3. Testo nuovo, scritto per il seed.'),
  fixed('clipping_lattanzi', 'paese_sera', 'dispatch', '1987-11-10', 'Dispatch del fermo di Lattanzi, nel batch 5. Testo nuovo, scritto per il seed.'),
  fixed('clipping_search', 'messaggero', 'dispatch', '1987-12-10', 'Finale 6 (A): letto con il batch 7, insieme alla risposta della Procura.'),
  fixed('clipping_voss_dead', 'messaggero', 'dispatch', '1987-12-19', 'Finali 1, 2, 3: il ritaglio letto con il batch 7.'),
  fixed('clipping_stairs', 'messaggero', 'dispatch', '1987-12-19', 'Finale 6 (B): il ritaglio letto con il batch 7.'),
  fixed('clipping_termini', 'messaggero', 'dispatch', '1987-12-21', 'Finale 3: il secondo ritaglio.'),
  fixed('clipping_lattanzi_released', 'paese_sera', 'dispatch', '1988-01-29', 'Chiusura dei Finali 1 e 4.'),
  fixed('procura_warrant_fled', 'procura', 'passage', '1988-01-11', 'Chiusura dei Finali 2 e 5: dalla risposta della Procura al Turno 8. Formula e tempi non verificati.'),
  fixed('voss_after_caught', 'voss', 'letter', '1987-12-29', 'Batch 8, Finale 6 (B): Voss dopo il 17, salvo, Aldo preso.', [
    { when: 'Lo strato 4 non è mai arrivato', change: 'Prima del paragrafo del Verano entra la confessione: «Adesso però c\'è una cosa che devi sapere da me, prima di leggerla negli atti, perché negli atti ci sarà. Aldo sapeva di me da una lettera che la maestra aveva scritto a Rosa l\'anno scorso, e che ha aperto lui. Parlava di una guardia giovane, alta, biondiccia, con un cognome tedesco. Ero io. La sera dopo la rapina ho messo i tre testimoni nella stessa stanza e ho fatto vedere loro la foto segnaletica di Luca. Poi ho detto di non parlarne con nessuno. Davanti al giudice, tutti e tre hanno giurato di non aver visto fotografie. Non te l\'ho scritto prima perché non ci riuscivo, e adesso non ho più la scusa di non riuscirci.» E nell\'ultimo paragrafo sul processo, «gliel\'ho già scritto» diventa «glielo scriverò domani».' },
    { when: "L'appostamento l'ha chiesto il Giocatore (strada 2)", change: '«Me li aveva presentati Palumbo» diventa «Li aveva mandati la Mobile, dopo la tua lettera».' },
    { when: 'Finale 6 (A), perquisizione prima del 17', change: 'Niente scena sul pianerottolo. Aldo è in carcere dal 9 dicembre (la Lettera del 15 ne ha già parlato). Giovedì 17 Voss va al Verano quel giorno stesso, l\'anniversario, con il lumino rosso. Aldo ha chiesto di vederlo, e lui non ci è andato. Lo showpiece e la chiusa restano uguali.' },
  ]),
  fixed('voss_after_fled', 'voss', 'letter', '1987-12-29', 'Batch 8, Finale 5: Voss dopo il 17, salvo, Aldo fuggito.', [
    { when: 'Lo strato 4 non è mai arrivato', change: 'Prima del paragrafo del vino entra la confessione del Finale 6, con un altro attacco: «Adesso la Procura mi chiederà perché Aldo cercava proprio me, e voglio che tu lo sappia prima di loro.»' },
    { when: 'Aldo è stato nominato solo nel Turno 8', change: 'Palumbo non ha ancora niente. È la Lettera di Lombardo a dire il nome, e Voss risponde a quella: «Domattina vado da Palumbo.» Il paragrafo della stanza vuota diventa un\'ipotesi: «Mario dice che venerdì è partito.»' },
  ]),
  fixed('voss_after_unknown', 'voss', 'letter', '1987-12-29', 'Batch 8, Finale 4: Voss dopo il 17, salvo, assassino ignoto. Non spiega e non conclude, ma dà per l\'ultima volta la stretta di mano, il cappello, l\'«anniversario», la partenza: chi capisce adesso può ancora nominare Aldo nel Turno 8, e il Finale diventa il 5.'),
  fixed('voss_invitation', 'voss', 'passage', '1987-12-15', 'Batch 7, brano fisso della Lettera di Voss: Aldo gli ha chiesto di aprire la bottiglia il 17. Il resto della Lettera lo scrive lo stato del Turno; nei Finali 1–3 è la sua ultima Lettera.'),
  fixed('pm_letter', 'procura', 'epilogue', '1988-03-21', 'Epilogo dei Finali 3 e 6: la Lettera del PM, qui nella forma del Finale 6 (B). Il writer del PM la compone dai fatti, dentro questi confini.', [
    { when: 'Sempre', change: "Gli atti di Lombardo: solo le Lettere che hanno davvero portato a qualcosa, con la data. Nessuna lode generica. L'appunto del 4 settembre: una riga, sempre la stessa. Il trasferimento: le «circostanze», il fascicolo personale." },
    { when: 'La Benvenuti segnalata alla Procura', change: 'La nota di settembre «acquisita agli atti».' },
    { when: 'La lampadina passata alla Procura', change: 'Il capo Ferri porta la premeditazione «grazie a un dettaglio riferito da una condomina».' },
    { when: 'Il Giocatore ha scoperto la perizia o le ricognizioni', change: 'Su Luca: «quantomeno dubbia». Altrimenti niente.' },
    { when: 'Finale 6: Voss vivo', change: 'Ha deposto e ha riferito il 1977 (se ha confessato, a Lombardo o nella Lettera dopo il 17).' },
    { when: 'Finale 3, e il Turno 8 ha riferito la confessione di Voss', change: '«Lei mi scrive che l\'agente Voss Le aveva confidato… Ne prendo atto, e lo riferisco alla Corte.»' },
    { when: 'Finale 3, senza la confessione di Voss', change: '«L\'imputato attribuisce all\'agente Voss un comportamento scorretto nel 1977. Non ho modo di verificarlo, e l\'agente Voss non può più rispondere.»' },
    { when: 'Finale 3', change: 'La scena di via Fratelli Bonnet: la bottiglia aperta, i due bicchieri, uno pieno. Il capo d) diventa omicidio; i capi a)–c) secondo il punteggio.' },
    { when: 'Finale 3 senza confessione', change: 'Istruzione formale: dispositivo di venerdì 12 maggio 1989, Lettera di lunedì 15 maggio 1989.' },
    { when: 'Finale 6 (A), perquisizione', change: '«La perquisizione del 9 dicembre in via Giacinto Carini»: la lettera della maestra, la chiave. Nessun capo d).' },
  ]),
  fixed('dispositivo', 'procura', 'enclosure', '1988-03-18', "L'Allegato della Lettera del PM: il dispositivo, qui nella forma del Finale 6 (B). Articoli, formula e pene accessorie nel codice del 1930 non verificati.", [
    { when: 'Punteggio da 6 a 9', change: 'Per esempio: «dichiara FERRANTE Aldo colpevole dei reati di cui ai capi b) e d) … lo assolve dai reati di cui ai capi a) e c) per insufficienza di prove».' },
    { when: 'Punteggio sotto 6', change: '«colpevole del reato di cui al capo d) … lo assolve dai reati di cui ai capi a), b) e c) per insufficienza di prove».' },
    { when: 'Finale 3', change: 'Il capo d) è omicidio aggravato, non tentato (artt. 575, 577 n. 3 c.p.).' },
    { when: 'Finale 6 (A)', change: 'Nessun capo d).' },
  ]),
  fixed('adelaide_first_letter', 'adelaide', 'letter', '1987-10-05', 'Batch 2: la prima Lettera di Adelaide, di sua iniziativa. Porta K8 (la vanteria di Ferri), K9 senza titolo, Armando al buio (falsa pista), I1 e I2. Circa 590 parole.'),
  fixed('adelaide_reveal', 'adelaide', 'letter', '1987-11-27', 'Il reveal, variante «l\'ho visto io» (batch 6). Con il calendario come Allegato («panorama.calendarEnclosure»), Armando scagionato e la lampadina svitata (K11) in un P.S. Usa il momento clou di Ernesto. Circa 640 parole.'),
  fixed('adelaide_farewell', 'adelaide', 'letter', '1987-12-26', 'Batch 8: il congedo di Adelaide, testo intero del Finale 6. Il paragrafo del geranio c\'è solo se il suo momento clou non è già stato usato. Circa 480 parole.', [
    { when: 'Finale 1, Voss morto, ignoto', change: 'Secondo paragrafo: «Sul *Messaggero* ho letto del poliziotto di Monteverde. Era il signor Voss. Quel poliziotto stanco: gli avevo chiesto se mangiava.» Niente candele: l\'ironia la vede il Giocatore, non lei.' },
    { when: 'Finale 2, Voss morto, fuggito', change: 'Come l\'1, più: «Adesso dicono che l\'assassino è partito col treno. Ho pensato ai treni per la Grecia che prendeva mia sorella, e a quanto erano lenti.»' },
    { when: 'Finale 3, Voss morto, preso', change: 'La fotografia dell\'arrestato, «col cappello, uno che non diresti mai», e il nome del signor Voss nello stesso articolo. Si deve sedere, e non va oltre.' },
    { when: 'Finale 4, Voss salvo, ignoto', change: 'I giornali non dicono più niente della setta, Lattanzi è ancora dentro, e il signor Voss non si è più visto. Si lamenta che nessuno le racconta niente. Nessuna aggressione.' },
    { when: 'Finale 5, Voss salvo, fuggito', change: '«Dicono che l\'uomo dei lumini era un pensionato di Monteverde, e che è partito col treno.» Poi la sorella e la Grecia, come nel 2, ma con il sollievo: il signor Voss sta bene.' },
  ]),
];

// ─── The document ───────────────────────────────────────────────────────────

/** A fresh copy every call: callers may mutate it. */
export function buildVossStory() {
  return structuredClone({
    schemaVersion: 1,
    locale: 'it',
    maxLettersPerTurn: 3,
    turns: 8,
    calendar,
    lead: {
      slug: 'lombardo',
      name: 'Giacomo Lombardo',
      role: 'Commissario di P.S., Lipari',
      address: 'Commissariato di P.S., 98055 Lipari (ME)',
      sheet: text('lead/sheet.md'),
    },
    correspondents,
    plotKeys,
    reserved,
    requestKeys,
    documents,
    clues,
    panorama,
    aldoThread,
    evidence,
    circumstances,
    voss,
    routes,
    endings,
    verdict,
    texts,
    opening: {
      rulesCard: text('opening/rules-card.md'),
      transferOrder: { title: 'Decreto di trasferimento', body: text('opening/transfer-order.md') },
      letter: { from: 'voss', storyDate: '1987-09-05', body: text('opening/voss-letter.md') },
    },
    pipeline: {
      editor: text('pipeline/editor.md'),
      checker: text('pipeline/checker.md'),
      officeStyle: text('pipeline/office-style.md'),
    },
  });
}
