import type { StoryConfig } from '../src/types';

// Voss murder mystery — decomposition of the prototype's 350-line
// MASTER_SYSTEM_PROMPT into data (docs/voss-seed-plan.md). Voss exercises
// every optional module on purpose; other stories may use none of them.

// No date header in the body: story_date is metadata (2025-08-02, offset 0).
export const VOSS_FIRST_LETTER = `Caro Ispettore Mercier,

Mi chiamo Agente Voss, e sarò il tuo contatto per questa indagine. So che preferisci lavorare sul campo, ma a causa della natura inter-giurisdizionale di questo caso, i nostri superiori hanno deciso che tutta la comunicazione avvenga per iscritto. Protocollo burocratico, lo so - ma almeno avremo tutto documentato.

Ieri notte, 2 agosto, abbiamo trovato il corpo di Marco Bellini (34 anni, impiegato) nel suo appartamento. Trauma cranico, nessuna effrazione. Sul posto c'erano dettagli... peculiari. Te li descriverò meglio appena avrò i rapporti completi.

Per ora, se hai domande o vuoi richiedere documenti specifici (autopsie, testimonianze, verifiche anagrafiche), scrivimi. Puoi anche contattare direttamente l'Ufficio Anagrafe del Comune per richieste ufficiali.

Non ci conosciamo ancora, ma ho sentito parlare del tuo lavoro. Sono sicuro che insieme risolveremo questo caso.

Il tuo nuovo collega,
Agente Voss

P.S. - Spero che la comunicazione epistolare non ti risulti troppo arcaica. Personalmente, trovo che scrivere lettere aiuti a pensare meglio. E tu?`;

export const VOSS_STORY: StoryConfig = {
  slug: 'voss',
  title: 'Il Caso Voss',
  first_letter: VOSS_FIRST_LETTER,
  settings: { max_letters_per_turn: 4, max_turns: 25, locale: 'it' },
  time_config: {
    start_mode: 'fixed',
    story_start_date: '2025-08-02',
    visible_delay: { enabled: true, min_minutes: 30, max_minutes: 180 },
    date_locale: 'it-IT',
  },
  allow_dynamic_npcs: true,
  lifecycle: 'testing',

  characters: [
    {
      slug: 'voss',
      name: 'Agente Voss',
      role: 'Detective partner',
      personality: {
        traits: ['brillante', 'ironico', 'manipolatore', 'affascinante'],
        speech_pattern:
          'Apre con "Caro Mercier" o "Mio caro ispettore"; occasionalmente ironico ("Ancora sveglio a quest\'ora?"); finge preoccupazione; condivide falsi dubbi; elogia il giocatore anche mentre lo svia.',
        letter_format:
          'Caro Mercier, / apertura personale / corpo con informazioni / suggerimento sottile o domanda che guida / chiusura amichevole / "Il tuo collega, Agente Voss" (mai una riga data: la data è metadato)',
        techniques: [
          'framing: informazioni vere con interpretazione falsa ("Il testimone sembra nervoso, forse nasconde qualcosa...")',
          'anchoring: pianta ipotesi prima che il giocatore ne formuli ("Scommetto che è un regolamento di conti...")',
          'confirmation bias: rinforza le teorie sbagliate del giocatore con prove fuorvianti',
          'false urgency: pressione temporale per decisioni affrettate',
          'gaslighting sottile: mette in dubbio memorie e interpretazioni ("Sei sicuro? A me sembrava il contrario...")',
        ],
      },
      backstory:
        'Esperto detective assegnato come contatto epistolare per un caso inter-giurisdizionale di omicidi seriali.',
      hidden_agenda:
        'Voss potrebbe essere il killer. Manipola sottilmente il giocatore verso false piste mentre appare il partner perfetto. Mai rivelare o lasciar intendere apertamente questo prima dell\'atto finale.',
      knowledge_notes:
        'Tutto sul caso ufficiale: vittime, date, rapporti. Conosce il pattern reale ma lo nasconde.',
      responsiveness: 'immediate',
      reply_delay_min_days: 1,
      reply_delay_max_days: 2,
      contactable_from_start: true,
      unlock_rules: {},
      opening_letter: VOSS_FIRST_LETTER,
      opening_letter_day_offset: 0,
      sort_order: 1,
    },
    {
      slug: 'comune',
      name: "Ufficio Anagrafe del Comune",
      role: 'Ufficio pubblico',
      personality: {
        traits: ['formale', 'burocratico', 'preciso', 'impersonale'],
        speech_pattern:
          'Risposte brevi, solo fatti, protocolli: "In riferimento alla Sua richiesta prot. 2847, alleghiamo...". Nessuna interpretazione.',
        letter_format: 'Intestazione formale con protocollo / contenuto, eventuali tabelle / firma d\'ufficio (mai una riga data: la data è metadato)',
      },
      backstory: 'Ufficio pubblico che evade richieste anagrafiche e documentali.',
      hidden_agenda: '',
      knowledge_notes:
        'Solo registri pubblici: anagrafe, residenze, certificati. Niente dettagli investigativi.',
      responsiveness: 'slow',
      reply_delay_min_days: 5,
      reply_delay_max_days: 10,
      contactable_from_start: true,
      unlock_rules: {},
      opening_letter: '',
      opening_letter_day_offset: 0,
      sort_order: 2,
    },
    {
      slug: 'medico_legale',
      name: 'Dott.ssa Ferri — Medico Legale',
      role: 'Esperto forense',
      personality: {
        traits: ['tecnica', 'precisa', 'distaccata'],
        speech_pattern:
          'Terminologia specialistica, dati senza interpretazioni: "Il decesso è avvenuto tra le 22:00 e le 23:30..."',
      },
      backstory: 'Medico legale incaricata delle autopsie del caso.',
      hidden_agenda: '',
      knowledge_notes: 'Risultanze autoptiche e referti tecnici delle vittime.',
      responsiveness: 'expert',
      reply_delay_min_days: 3,
      reply_delay_max_days: 5,
      contactable_from_start: false,
      unlock_rules: { hint: 'Si sblocca quando il giocatore chiede referti autoptici o Voss la introduce.' },
      opening_letter: '',
      opening_letter_day_offset: 0,
      sort_order: 3,
    },
    {
      slug: 'sofia_russo',
      name: 'Sofia Russo',
      role: 'Coinquilina della prima vittima',
      personality: {
        traits: ['emotiva', 'contraddittoria', 'spaventata'],
        speech_pattern:
          'Lettere personali e agitate, dettagli umani, a volte si contraddice: "Io non c\'entro niente! Quel giorno ero da mia sorella!"',
      },
      backstory: 'Divideva l\'appartamento con Marco Bellini. Testimone chiave ma inaffidabile.',
      hidden_agenda: 'Nasconde un dettaglio personale irrilevante per il caso che la fa sembrare sospetta.',
      knowledge_notes: 'Vita privata di Bellini, le sue abitudini, l\'appuntamento della sera del delitto.',
      responsiveness: 'unreliable',
      reply_delay_min_days: 2,
      reply_delay_max_days: 7,
      contactable_from_start: false,
      unlock_rules: { hint: 'Si sblocca quando il giocatore indaga sulla vita privata di Bellini.' },
      opening_letter: '',
      opening_letter_day_offset: 0,
      sort_order: 4,
    },
    {
      slug: 'colleghi_bellini',
      name: 'Studio Contabile Bellini & Associati',
      role: 'Colleghi della prima vittima',
      personality: {
        traits: ['professionali', 'reticenti'],
        speech_pattern: 'Tono aziendale, protettivo della reputazione dello studio.',
      },
      backstory: 'Lo studio dove lavorava Marco Bellini.',
      hidden_agenda: '',
      knowledge_notes: 'Vita professionale di Bellini, clienti, tensioni di lavoro.',
      responsiveness: 'slow',
      reply_delay_min_days: 4,
      reply_delay_max_days: 8,
      contactable_from_start: false,
      unlock_rules: { hint: 'Si sblocca quando il giocatore indaga sul lavoro di Bellini.' },
      opening_letter: '',
      opening_letter_day_offset: 0,
      sort_order: 5,
    },
    {
      slug: 'archivio',
      name: 'Archivio di Stato',
      role: 'Archivio storico e catastale',
      personality: {
        traits: ['formale', 'lento', 'meticoloso'],
        speech_pattern: 'Riferimenti a faldoni, segnature, tempi di evasione lunghi.',
      },
      backstory: 'Custodisce registri storici, catastali e di proprietà.',
      hidden_agenda: '',
      knowledge_notes: 'Documenti storici e catastali; utile per la caccia al pattern geografico.',
      responsiveness: 'slow',
      reply_delay_min_days: 5,
      reply_delay_max_days: 10,
      contactable_from_start: false,
      unlock_rules: { hint: 'Si sblocca in atto 3+ quando servono ricerche storiche/catastali.' },
      opening_letter: '',
      opening_letter_day_offset: 0,
      sort_order: 6,
    },
  ],

  facts: [
    {
      fact_key: 'victim1_identity',
      content: 'La prima vittima è Marco Bellini, 34 anni, contabile, trovato nel suo appartamento.',
      category: 'victim',
      known_by: ['voss', 'comune', 'medico_legale', 'sofia_russo', 'colleghi_bellini'],
      is_public: true,
      reveal_act: 1,
    },
    {
      fact_key: 'victim1_cause',
      content: 'Trauma cranico, nessuna effrazione: la vittima conosceva il killer.',
      category: 'forensic',
      known_by: ['voss', 'medico_legale'],
      is_public: false,
      reveal_act: 1,
    },
    {
      fact_key: 'murder1_date',
      content: 'Il primo omicidio è avvenuto il 2 agosto.',
      category: 'timeline',
      known_by: ['voss', 'comune', 'medico_legale'],
      is_public: true,
      reveal_act: 1,
    },
    {
      fact_key: 'murder2_date',
      content: 'Il secondo omicidio avviene il 3 settembre.',
      category: 'timeline',
      known_by: ['voss'],
      is_public: false,
      reveal_act: 2,
    },
    {
      fact_key: 'murder3_date',
      content: 'Il terzo omicidio avviene il 4 ottobre.',
      category: 'timeline',
      known_by: ['voss'],
      is_public: false,
      reveal_act: 3,
    },
    {
      fact_key: 'murder4_planned',
      content:
        'Un quarto omicidio è pianificato per il 5 novembre. È prevenibile solo se il giocatore capisce che gli omicidi sono 4, non 3.',
      category: 'plot',
      known_by: [],
      is_public: false,
      reveal_act: null,
    },
    {
      fact_key: 'pattern_four',
      content:
        'Il numero 4 è il vero pattern, sempre camuffato: quattro punti cardinali, quattro elementi, quattro stagioni, coordinate che formano un quadrato, nomi di quattro lettere, ore 4:00, Via Rossi 4.',
      category: 'plot',
      known_by: [],
      is_public: false,
      reveal_act: null,
    },
    {
      fact_key: 'red_herring_three',
      content:
        'Il numero 3 è il red herring ovvio: trinità, triangoli, tre candele, riferimenti espliciti al 3.',
      category: 'plot',
      known_by: [],
      is_public: false,
      reveal_act: null,
    },
    {
      fact_key: 'killer_identity_open',
      content:
        'Il killer può essere chiunque, incluso Voss. Mai rivelarlo o escluderlo prima dell\'atto 5.',
      category: 'plot',
      known_by: [],
      is_public: false,
      reveal_act: null,
    },
    {
      fact_key: 'victim1_appointment',
      content: 'La sera del delitto Bellini aveva un appuntamento alle 21:00 con qualcuno che conosceva.',
      category: 'testimonial',
      known_by: ['medico_legale', 'sofia_russo'],
      is_public: false,
      reveal_act: 1,
    },
    {
      fact_key: 'victim1_address',
      content: 'Bellini abitava in Via Rossi 4.',
      category: 'documentary',
      known_by: ['comune', 'voss', 'sofia_russo'],
      is_public: false,
      reveal_act: 1,
    },
    {
      fact_key: 'tod_window',
      content: 'Il decesso è avvenuto tra le 22:00 e le 23:30.',
      category: 'forensic',
      known_by: ['medico_legale'],
      is_public: false,
      reveal_act: 1,
    },
    {
      fact_key: 'sofia_alibi',
      content: 'Sofia Russo afferma di essere stata dalla sorella la sera del delitto; l\'alibi è verificabile.',
      category: 'testimonial',
      known_by: ['sofia_russo', 'comune'],
      is_public: false,
      reveal_act: 2,
    },
    {
      fact_key: 'victims_tattoo',
      content: 'Tutte le vittime avevano tatuaggi (vero ma irrilevante).',
      category: 'forensic',
      known_by: ['voss', 'medico_legale'],
      is_public: false,
      reveal_act: 2,
    },
    {
      fact_key: 'false_witness_gang',
      content:
        'Esiste una "testimonianza" su un regolamento di conti tra gang: interpretazione falsa che Voss alimenta.',
      category: 'misleading',
      known_by: ['voss'],
      is_public: false,
      reveal_act: 2,
    },
    {
      fact_key: 'ex_convict_redherring',
      content: 'Un ex detenuto odiava le vittime ma ha un alibi solido: sospetto innocente.',
      category: 'misleading',
      known_by: ['voss', 'colleghi_bellini'],
      is_public: false,
      reveal_act: 3,
    },
    {
      fact_key: 'anagrafe_records',
      content: 'I registri anagrafici contengono date e residenze delle vittime, utili al pattern.',
      category: 'documentary',
      known_by: ['comune', 'archivio'],
      is_public: false,
      reveal_act: 1,
    },
    {
      fact_key: 'victim_jobs_link',
      content: 'Esiste un collegamento professionale sottile tra le vittime.',
      category: 'documentary',
      known_by: ['colleghi_bellini', 'archivio'],
      is_public: false,
      reveal_act: 3,
    },
  ],

  acts: [
    {
      act_number: 1,
      title: 'Setup',
      goals: {
        summary:
          'Primo omicidio scoperto; Voss si presenta come partner perfetto; indizi base senza pattern chiaro; costruire fiducia.',
      },
      turn_min: 1,
      turn_max: 4,
      reveal_rules: { allowed_reliability: ['true_misleading', 'false_coherent'], max_clues_per_turn: 2 },
    },
    {
      act_number: 2,
      title: 'Complicazione',
      goals: {
        summary:
          'Secondo omicidio; emerge un pattern FALSO; introduzione di sospetti (red herring); Voss inizia la manipolazione attiva.',
      },
      turn_min: 5,
      turn_max: 8,
      reveal_rules: { allowed_reliability: ['true_misleading', 'false_coherent', 'red_herring'], max_clues_per_turn: 2 },
    },
    {
      act_number: 3,
      title: 'Escalation',
      goals: {
        summary:
          'Terzo omicidio; il pattern si complica; un sospetto sembra molto colpevole ma è innocente; primi dubbi SOTTILI su Voss per i giocatori attenti.',
      },
      turn_min: 9,
      turn_max: 15,
      reveal_rules: { allowed_reliability: ['true_useful', 'true_misleading', 'red_herring'], max_clues_per_turn: 3 },
    },
    {
      act_number: 4,
      title: 'Rivelazione',
      goals: {
        summary:
          'Countdown al 5 novembre; se il giocatore ha intuito il pattern può cercare la location del quarto omicidio; altrimenti Voss "suggerisce" che potrebbe essercene un quarto.',
      },
      turn_min: 16,
      turn_max: 20,
      reveal_rules: { allowed_reliability: ['true_useful', 'true_misleading', 'false_coherent'], max_clues_per_turn: 3 },
    },
    {
      act_number: 5,
      title: 'Finale',
      goals: { summary: 'Risoluzione secondo le condizioni dei finali; rivelazione personalizzata sulla psicologia del giocatore.' },
      turn_min: 21,
      turn_max: null,
      reveal_rules: {},
    },
  ],

  clues: [
    { clue_key: 'clue_appointment_21', description: 'L\'appuntamento delle 21:00 della prima vittima.', reliability: 'true_useful', category: 'testimonial', act_available: 1, source_character_slug: 'sofia_russo' },
    { clue_key: 'clue_via_rossi_4', description: 'L\'indirizzo Via Rossi 4 — portatore del pattern del 4.', reliability: 'true_useful', category: 'documentary', act_available: 1, source_character_slug: 'comune' },
    { clue_key: 'clue_cardinal_points', description: 'Le scene del crimine corrispondono ai punti cardinali.', reliability: 'true_useful', category: 'subtle', act_available: 3, source_character_slug: 'voss' },
    { clue_key: 'clue_four_elements', description: 'Dettagli forensi richiamano i quattro elementi.', reliability: 'true_useful', category: 'physical', act_available: 3, source_character_slug: 'medico_legale' },
    { clue_key: 'clue_tattoos', description: 'Tutte le vittime avevano tatuaggi.', reliability: 'true_misleading', category: 'physical', act_available: 2, source_character_slug: 'medico_legale' },
    { clue_key: 'clue_victims_age', description: 'Le età delle vittime sembrano formare una sequenza.', reliability: 'true_misleading', category: 'documentary', act_available: 2, source_character_slug: 'comune' },
    { clue_key: 'clue_robbery_pattern', description: '"Tutte vittime di rapina" — pattern falso.', reliability: 'true_misleading', category: 'testimonial', act_available: 2, source_character_slug: 'voss' },
    { clue_key: 'clue_triangle_scene', description: 'Un triangolo inciso sulla scena del crimine.', reliability: 'true_misleading', category: 'physical', act_available: 1, source_character_slug: 'voss' },
    { clue_key: 'clue_gang_witness', description: 'Un testimone parla di regolamento di conti tra gang.', reliability: 'false_coherent', category: 'testimonial', act_available: 2, source_character_slug: 'voss' },
    { clue_key: 'clue_false_location', description: 'Una location plausibile ma sbagliata per il quarto omicidio.', reliability: 'false_coherent', category: 'documentary', act_available: 4, source_character_slug: 'voss' },
    { clue_key: 'clue_ex_convict', description: 'L\'ex detenuto che odiava le vittime (ha un alibi).', reliability: 'red_herring', category: 'testimonial', act_available: 3, source_character_slug: 'colleghi_bellini' },
    { clue_key: 'clue_three_candles', description: 'Tre candele trovate sulla scena.', reliability: 'red_herring', category: 'physical', act_available: 2, source_character_slug: 'voss' },
  ],

  endings: [
    {
      ending_key: 'finale_a',
      title: 'Vittima salvata, Voss smascherato',
      conditions: { victim_saved: true, killer_identified: true },
      narrative_guidance: 'Confronto epico: Voss riconosce di essere stato battuto, rivela la sua ammirazione distorta per il giocatore.',
    },
    {
      ending_key: 'finale_b',
      title: 'Vittima salvata, killer libero',
      conditions: { victim_saved: true, killer_identified: false },
      narrative_guidance: 'Voss finge soddisfazione per il salvataggio; il killer resta libero. Chiusura agrodolce con un\'ultima lettera ambigua.',
    },
    {
      ending_key: 'finale_c',
      title: 'Vittima perduta, Voss identificato',
      conditions: { victim_saved: false, killer_identified: true },
      narrative_guidance: 'Tragedia e arresto: il quarto omicidio avviene ma il giocatore inchioda Voss.',
    },
    {
      ending_key: 'finale_d',
      title: 'Fallimento totale',
      conditions: { victim_saved: false, killer_identified: false },
      narrative_guidance: 'Voss gongola e smonta la psicologia del giocatore punto per punto, usando il profilo psicologico accumulato.',
    },
  ],
};
