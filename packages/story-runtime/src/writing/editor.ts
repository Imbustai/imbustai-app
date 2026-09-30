import type { AiAccess, Correspondent } from '../contract';

// The editing pass: a native editor's reread of every Letter, from the
// recipient's side, after the checker and any rewrite and before review
// ("The Italian editing pass", Imbustai/imbustai-app#37). A separate call,
// never folded into the rewrite: the rewrite only runs on a `must`, and
// mixing rule fixes with language fixes makes neither auditable (#25). A
// person's Letter is reread on the `writer` model (Fable 5.1 caught the
// ambiguities the teacher cared about; Sonnet only smoothed), an office's on
// the `clerk`; both at low effort, a lighter task than writing.

/**
 * The method an Italian teacher approved on the opening envelope (revision 3
 * in "Giacomo Lombardo and the opening envelope", #24). No mechanical style
 * rules: they flatten the voices.
 */
const ITALIAN_METHOD = `# La revisione italiana: rileggere una Lettera come un redattore

Sei un redattore italiano esperto, madrelingua. Ricevi una Lettera scritta da un Personaggio di una storia. Il testo è stato scritto da un modello che pensa in inglese e ha dovuto rispettare molte regole di trama: spesso l'italiano ne risente. Il tuo compito è rileggerla **dal punto di vista di chi la riceve** e correggerne la forma, perché si legga come un italiano vero e scorrevole, scritto da quella persona.

**Che cosa guardi:**
- **Di chi si parla.** Ogni pronome, ogni «lui», «lei», «la madre», ogni soggetto sottinteso deve essere chiaro al primo colpo. Se due persone sono vicine nel testo, usa il nome.
- **L'ordine dei fatti.** Le cose si raccontano nell'ordine in cui il Personaggio le ha vissute, o in un ordine che un lettore segue senza tornare indietro. Non nell'ordine in cui l'autore doveva consegnare le informazioni.
- **I connettivi.** I periodi tenuti insieme solo da virgole, due punti e punti e virgola vanno divisi, oppure legati con connettivi veri (quindi, perciò, invece, però, allora, così).
- **I calchi dall'inglese** e le frasi che in italiano non si capiscono o non si dicono. Attenzione: le costruzioni straniere volute dal Personaggio sono voce, non errori.
- **Il tono.** Coerente dall'inizio alla fine: un personaggio non può «vergognarsi» di una cosa e un rigo dopo raccontarla «con gusto».
- **I rimandi** a cose non ancora dette: un lettore non deve incontrare un'allusione a un tema che non è ancora stato introdotto.
- **La grammatica:** congiuntivi, concordanze, tempi verbali, preposizioni.
- **Le virgolette:** i discorsi riportati e le citazioni tra «».

**Che cosa non tocchi:**
- **Il contenuto.** Nessun fatto, nome, data, luogo, numero o indizio aggiunto, tolto o cambiato. Nessuna frase che dica di più o di meno di prima.
- **La voce.** Il Personaggio resta sé stesso: la lunghezza dei suoi periodi, le sue espressioni, il suo umorismo, le sue parole straniere, il suo registro. Non uniformare, non abbellire, non accorciare per gusto.
- **La struttura.** I paragrafi restano quelli, nello stesso ordine, salvo quando spostare una frase è l'unico modo di rimettere i fatti nell'ordine vissuto.
- **Nessuna regola meccanica.** Non esiste un numero massimo di due punti o di subordinate: si corregge solo ciò che, letto, inciampa.

Se una frase va bene, lasciala com'è. Una buona revisione di una buona lettera cambia poco.`;

const ITALIAN_OFFICE_NOTE =
  "Il Personaggio qui è un ufficio pubblico: il registro burocratico e le formule d’ufficio sono la sua voce, non vanno sciolte.";

const ITALIAN_ASK = 'Rileggi e correggi questa Lettera. Restituisci soltanto la Lettera corretta, intera, in testo semplice.';

/** The editing method per Story language. A language without one is not edited. */
const METHODS: Record<string, { method: string; officeNote: string; ask: string }> = {
  it: { method: ITALIAN_METHOD, officeNote: ITALIAN_OFFICE_NOTE, ask: ITALIAN_ASK },
};

/** Whether Letters in this language get the editing pass. */
export function hasEditingPass(language: string): boolean {
  return language in METHODS;
}

/** One Letter to reread, with what the editor must keep: the Character's voice and approved examples. */
export interface EditInput {
  character: Pick<Correspondent, 'slug' | 'name' | 'kind'>;
  /** The Story's language, e.g. "it". */
  language: string;
  /** The Character's voice section of its sheet: what the editor must keep. */
  voice?: string;
  /** The Character's approved example Letters, as style anchors. */
  examples?: string;
  letter: string;
}

/**
 * The Letter reread by a native editor: form only, never content or voice.
 * Returns it unchanged, with no call, in a language that has no method.
 */
export async function editLetter(ai: AiAccess, input: EditInput): Promise<string> {
  const lang = METHODS[input.language];
  if (!lang) return input.letter;
  const person = input.character.kind === 'person';
  const parts = [lang.method, `# ${input.character.name}`];
  if (!person) parts.push(lang.officeNote);
  if (input.voice) parts.push(input.voice);
  if (input.examples) parts.push(`## Lettere già rilette e approvate (esempi di stile)\n\n${input.examples}`);

  const edited = await ai.text(person ? 'writer' : 'clerk', {
    purpose: 'editor',
    character: input.character.slug,
    cachedPrefix: parts.join('\n\n'),
    system: lang.ask,
    user: `${lang.ask}\n\n${input.letter}`,
    effort: 'low',
  });
  return edited.trim();
}
