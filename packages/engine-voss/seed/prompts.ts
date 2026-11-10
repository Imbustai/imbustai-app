/**
 * Every sentence the writing pipeline says to a model, as Story data
 * (`pipeline.prompts`, keys in `PROMPT_KEYS`). The Engine fills the `{name}`
 * placeholders from the Turn plan; none of this lives in code.
 *
 * Nothing here may tell a writer what its Character does not know: the plan
 * says what may enter a Letter, never why.
 */
import type { PromptKey } from '../src/schema';

export function buildPrompts(text: (path: string) => string): Record<PromptKey, string> {
  return {
    // ─── Writers ────────────────────────────────────────────────────────────
    writer_person: text('pipeline/writer-person.md'),
    writer_office:
      'Scrivi la risposta di un ufficio pubblico di Roma, nel 1987, a una lettera del commissario {lead}: {name}. Le regole comuni degli uffici e la scheda di questo ufficio sono nei documenti che precedono. Scrivi soltanto la lettera, in testo semplice, dall\'intestazione alla firma. Nessun commento prima o dopo.',
    writer_fixed:
      'Questa Lettera di {name} è un testo fisso della Storia. Riscrivila identica, parola per parola, applicando soltanto le modifiche indicate, e ritoccando il minimo necessario perché il testo intorno regga. Scrivi soltanto la Lettera.\n\n## Modifiche\n\n{changes}\n\n## Il testo\n\n{text}',
    ask_person: 'Scrivi la Lettera di {name} a {lead}, datata {date}. Comincia dalla riga del luogo e della data.',
    ask_office: 'Scrivi la risposta di {name}, datata {date}.',
    examples: '# Lettere di esempio della voce di {name}\n\nSono esempi di voce e di passo, non di contenuto: non riprenderne i fatti come se fossero di questa settimana.',
    example: '## Esempio\n\n*{context}*\n\n{text}',

    // ─── The correspondence and the Turn ────────────────────────────────────
    correspondence: '# La corrispondenza finora',
    letter_heading: '## {from} a {to} ({date})',
    no_letter: 'In questo Turno {lead} non ha scritto a {name}: {name} scrive di sua iniziativa.',
    reader_notes: '# Che cosa c\'è nella Lettera di {lead} (note del lettore)',
    knowledge: '# Che cosa {name} sa in più, a oggi\n\nFatti accaduti o saputi dopo la sua scheda. Li può raccontare, quando serve.',
    turn_state: '# Lo stato del Turno',
    date: '- {name} scrive **{date}**, da Roma. La Lettera di {lead}, datata {playerDate}, è arrivata a Roma {arrivesRome}.',
    date_unprompted: '- {name} scrive **{date}**, da Roma.',
    direct_answers:
      '- A una domanda diretta di {lead} si risponde sempre con ciò che {name} sa, in concreto, anche se non era previsto per questa Lettera.',
    ledger:
      '# Che cosa vi siete già detti di voi\n\nNon contraddirlo, e non ripresentarlo come una novità.',
    admin_notes: '# Note della redazione per questa Lettera',
    length: '- Lunghezza: tra {min} e {max} parole.',
    passage: '- Questo brano entra nella Lettera così com\'è, nel punto in cui viene naturale:\n\n{text}',

    // ─── Voss ───────────────────────────────────────────────────────────────
    trust_low: '- Fiducia: bassa. Voss è cortese e guardingo: risponde, ma di sé dà poco.',
    trust_medium: '- Fiducia: media. Voss si fida abbastanza da raccontare di sé, e fa a {lead} domande personali.',
    trust_high: '- Fiducia: alta. Voss scrive a {lead} come all\'unica persona a cui può dire le cose.',
    cold: '- **Turno freddo:** {text}',
    layer_granted:
      '- Strati: in questa Lettera Voss arriva allo strato {layer}, se la Lettera di {lead} gliene dà l\'occasione: {says}',
    layer_none: '- Strati: nessuno strato nuovo in questa Lettera.',
    layers_told:
      '- Strati già detti: {told}. Su quelli può tornare. Gli altri non si dicono, nemmeno per allusione.',
    layer_circling:
      '- {lead} ha fatto la domanda giusta, ma è presto: Voss gira intorno alla cosa che non ha mai scritto a nessuno («non ancora, Giacomo») e non la dice.',
    ladder: '- {name}: {stance}',
    target_unlit:
      '- {name}: Voss ha paura per la maestra Benvenuti, non per sé («io davanti al giudice non c\'ero»). Che qualcuno possa cercare lui non gli passa per la testa.',
    ladder_move:
      '- {name}: in questa Lettera Voss fa un passo, convinto da questo argomento di {lead}: «{basis}». Adesso dice: {stance}',
    ladder_bare: '- {name}: {lead} lo afferma senza dare una ragione. Voss gli chiede «perché?» e resta dov\'è.',
    aldo_clue:
      '- Aldo, il compagno di scacchi: in questa Lettera entra di lui un solo dettaglio nuovo, detto di passaggio e senza peso: {clue} Un ponte possibile, solo un suggerimento: {bridge}',
    aldo_none: '- Aldo: solo come compagno di scacchi del giovedì, in una riga, senza dettagli nuovi sulla sua vita.',
    on_request:
      '- Solo se {lead} lo chiede direttamente (dov\'era Voss quella sera, che cosa ha fatto quel giovedì), Voss risponde con questo fatto, in una riga e senza dargli peso; altrimenti non lo nomina: {clue}',
    reapproach: '- Torna da un altro lato una cosa già detta, che {lead} non ha raccolto: {how}',
    wrong_lead: ' {lead} ci ha letto una pista verso {wrongLead}: smontala con una ragione vera, senza dargli la risposta.',
    door:
      '- Una porta: {lead} in questo Turno non ha scritto a nessun ufficio. Se viene naturale, Voss lo spinge a scrivere a un ufficio ({office}) e a chiedere questo: {document} Nomina l\'ufficio e il documento; mai il campo da leggere, mai la conclusione a cui porta.',
    signature_ordinary: '- {name}: {ordinary}',
    signature_showpiece:
      '- {name}: in questa Lettera può avere il suo momento clou, una volta sola in tutta la Storia: {showpiece}',
    signature_off: '- {name}: in questa Lettera no.',
    exclusive: '- Mai nella stessa Lettera: {names}.',
    invitation_accepts: '- Dell\'invito Voss è contento, e ha detto di sì.',
    invitation_wary:
      '- Dell\'invito Voss ha paura. Ha detto di sì per non insospettirlo, e scrive a {lead} che cosa farà quella sera.',
    invitation_hides: '- Voss ha preso tempo: quella sera non sarà in casa, e scrive a {lead} dove dormirà.',

    // ─── Adelaide ───────────────────────────────────────────────────────────
    panorama_clue:
      '- Il *Panorama*: un dettaglio nuovo, sepolto tra le lamentele, che Adelaide non collega a niente: {clue}',
    new_clue: '- Un fatto nuovo, detto di passaggio, di cui chi scrive non capisce il peso: {clue}',
    reveal_deduced:
      '- {lead} ha capito il giro del *Panorama*. Adelaide è andata in portineria con la sua Lettera in mano, Armando è crollato, e lei è fiera del suo Commissario. Racconta tutto ciò che adesso sa, e allega il calendario che ha ricopiato.',
    accused_slips:
      '- {lead} aveva accusato un solo inquilino: Adelaide lo ha affrontato, e quello si è tradito con un dettaglio («il mio turno», poi si è corretto). Lei lo riferisce senza capirlo.',

    // ─── Offices ────────────────────────────────────────────────────────────
    office_letter: '# La lettera del commissario {lead}, datata {playerDate}, arrivata a Roma {arrivesRome}',
    office_forwarded_from: '- La richiesta è arrivata a questo ufficio per competenza, trasmessa da: {office}.',
    office_documents:
      '- Atti che l\'ufficio trasmette in copia. Elencali come allegati, con questi titoli, senza copiarne né riassumerne il contenuto:\n{titles}',
    office_no_documents: '- Con questa risposta l\'ufficio non trasmette atti.',
    office_partial:
      '- Con i dati ricevuti l\'ufficio non trova niente di ciò che detiene: lo dice, e indica in una riga che cosa potrebbe dare con un nome o una data.',
    office_forward:
      '- La richiesta non spetta a questo ufficio: lo dice in una riga e la trasmette per competenza a {offices}, che risponderà direttamente.',
    office_search: '- L\'ufficio comunica l\'esito dell\'attività disposta dopo la lettera: {what}',

    // ─── The Ledger's report ────────────────────────────────────────────────
    ledger_report:
      'You keep the record of an epistolary game. Below is a Letter that {name} sent to {lead}, as the Player will read it. Report which of the listed items the Letter actually contains: a showpiece only if its moment is really played out in the Letter, not merely touched; a clue only if the Letter states its fact, in any wording. Report nothing that is not in the lists.',
    ledger_showpieces: '## Showpieces that were allowed in this Letter',
    ledger_clues: '## Clues {name} had not given yet',
  };
}
