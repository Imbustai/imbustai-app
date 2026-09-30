import { z } from 'zod';
import type { AiAccess, CharacterSlug } from '../contract';

// The reader: one `analyst` call per Player Letter, before any reply is
// written. It lists what the Character must answer (the checker's `answer`
// rule counts on it), what the Lead said about himself (it feeds the Ledger),
// what he did, and his hypotheses with the reason he gave (what doubt
// ladders move on). Shape from `out/1-reader.json` in "One real Voss Turn,
// end to end" (Imbustai/imbustai-app#25). An Engine adds its own fields —
// did the Player share, accuse, deduce — as `signals`.

const hypothesisSchema = z.object({
  hypothesis: z.string(),
  reason: z.string().describe('The argument or document he offers for it, or empty if he just asserts it'),
});

const notesShape = {
  questions: z
    .array(z.string())
    .describe('Every question the Lead asks the Character, explicit or implicit, in order'),
  claimsAboutSelf: z
    .array(z.string())
    .describe('New facts the Lead states about himself or his own life, one per item'),
  actions: z.array(z.string()).describe('What the Lead says he has done: letters sent, requests made'),
  hypotheses: z.array(hypothesisSchema).describe('What the Lead thinks about the case'),
  requests: z.array(z.string()).describe('What the Lead asks the Character to do or not to do'),
  answersToCharacterQuestions: z
    .array(z.string())
    .describe("Which of the questions in the Character's previous Letter the Lead answered, and how; also what he left unanswered"),
  tone: z.string().describe("The Letter's tone, in one or two sentences"),
};

const baseSchema = z.object(notesShape);

/** What one Player Letter holds for the Character who receives it. */
export type ReaderNotes = z.infer<typeof baseSchema>;

/** The notes, with the Engine's `signals` when it asked for some. */
export type ReaderResult<S extends z.AnyZodObject | undefined> = ReaderNotes &
  (S extends z.AnyZodObject ? { signals: z.infer<S> } : unknown);

/** What `readPlayerLetter` reads: one Player Letter and the Letter it replies to. */
export interface ReadInput<S extends z.AnyZodObject | undefined> {
  /** The Character the Letter is addressed to. */
  character: { slug: CharacterSlug; name: string };
  /** The Lead's name, e.g. "Giacomo Lombardo". */
  lead: string;
  /** The Character's last Letter to the Lead, whose questions the Lead may have answered. */
  previousLetter?: string;
  playerLetter: string;
  /**
   * The Engine's own reader fields, described with `.describe()` on each
   * field so the model knows what to report (e.g. Voss's `condivide`).
   */
  signals?: S;
}

/** Reads one Player Letter on the addressee's `analyst` model (its per-Character override applies). */
export async function readPlayerLetter<S extends z.AnyZodObject | undefined = undefined>(
  ai: AiAccess,
  input: ReadInput<S>,
): Promise<ReaderResult<S>> {
  const schema = input.signals ? baseSchema.extend({ signals: input.signals }) : baseSchema;
  const previous = input.previousLetter
    ? `## ${input.character.name}'s previous Letter to ${input.lead}\n\n${input.previousLetter}\n\n`
    : '';
  const notes = await ai.structured('analyst', {
    purpose: 'reader',
    character: input.character.slug,
    system:
      `You read a Letter that ${input.lead}, the Player's character in an epistolary game, wrote to ${input.character.name}, ` +
      `and list what ${input.character.name} needs in order to reply. Be exhaustive on questions: every one must get an answer. ` +
      'Report only what the Letter says; never guess. Write every item in the language of the Letter.',
    user: `${previous}## ${input.lead}'s Letter to ${input.character.name}\n\n${input.playerLetter}`,
    schema,
  });
  return notes as ReaderResult<S>;
}

/** The notes as a prompt section, for the writer and the checker. */
export function renderReaderNotes(notes: ReaderNotes): string {
  const list = (items: string[]) => (items.length ? items.map((item, i) => `${i + 1}. ${item}`).join('\n') : '(none)');
  const hypotheses = notes.hypotheses.map(
    (h) => `${h.hypothesis} (${h.reason ? `reason given: ${h.reason}` : 'no reason given'})`,
  );
  return [
    `### Questions to answer\n${list(notes.questions)}`,
    `### What he says about himself\n${list(notes.claimsAboutSelf)}`,
    `### What he has done\n${list(notes.actions)}`,
    `### His hypotheses\n${list(hypotheses)}`,
    `### What he asks\n${list(notes.requests)}`,
    `### What he answered of the last Letter\n${list(notes.answersToCharacterQuestions)}`,
    `### Tone\n${notes.tone}`,
  ].join('\n\n');
}
