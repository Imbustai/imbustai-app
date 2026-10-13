import { z } from 'zod';

// What the reader reports about each of the Lead's Letters, beyond the
// runtime's own notes: the fields §11 of "the eight Turns and the Endings"
// lists (Imbustai/imbustai-app#26). The mechanics read nothing else of a
// Player Letter. The writing pipeline (#41) passes the schema for the
// addressee's kind as `signals` to `readPlayerLetter`; each field's
// `.describe()` is what the model is told to report. Every schema is a closed
// object, as structured output requires.

const evidenceKey = z.string().regex(/^P\d+$/);
const clueKey = z.string().regex(/^[KI]\d+$/);

/** How the Lead used a clue he has already received, in this Letter. */
export const clueReadingSchema = z.object({
  key: clueKey.describe('The clue, e.g. "K3"'),
  status: z
    .enum(['understood', 'misread'])
    .describe("understood: the Letter passes the clue's «capito quando» test; misread: it uses the clue for a wrong lead"),
  wrongLead: z.string().describe('For misread: the wrong lead (Armando, Lattanzi, Colasanti, the sect); empty otherwise'),
});
export type ClueReading = z.infer<typeof clueReadingSchema>;

const clues = z
  .array(clueReadingSchema)
  .describe('Only clues the Letter actually uses; a clue it never mentions is left out (the Engine counts it as ignored)');

export const ladderArgumentSchema = z.object({
  ladder: z.enum(['target', 'killer', 'luca']),
  toStep: z.number().int().min(1).max(2).describe("The ladder step whose requirement the argument meets"),
  basis: z
    .string()
    .describe('The reason or document the Lead offers; empty when he only asserts, and then Voss asks «perché?» and stays'),
});
export type LadderArgument = z.infer<typeof ladderArgumentSchema>;

/** A Letter to Voss. */
export const vossSignalsSchema = z.object({
  shares: z
    .boolean()
    .describe('Answers at least one of Voss\'s personal questions, or tells something of himself (the island, the Questore, his life)'),
  takesFearSeriously: z.boolean().describe("Takes Voss's fear seriously, without dismissing or mocking it"),
  accuses: z
    .boolean()
    .describe('Accuses Voss of hiding something, of lying or of being guilty. Asking is not accusing'),
  asksAbout1977: z.boolean().describe('Asks about 1977: the arrest, the trial, Rosa'),
  asksAboutCareer: z
    .boolean()
    .describe('Asks about his career, his rank, why he is so afraid, or why he does not go back to the Mobile'),
  doubtsLineups: z
    .boolean()
    .describe('Questions the line-ups: asks what happened before 3 June 1977, or cites the 1985 ballistics report'),
  asksToWarnBenvenuti: z.boolean().describe('Asks Voss to warn or visit the teacher, Clara Benvenuti'),
  tellsTheDate: z
    .boolean()
    .describe('Tells Voss the killer will strike on Thursday 17 December (or «the anniversary Thursday») and says why'),
  ladderArguments: z.array(ladderArgumentSchema).describe("Arguments meant to move one of Voss's three doubts"),
  clues,
});
export type VossSignals = z.infer<typeof vossSignalsSchema>;

/** A Letter to Adelaide. */
export const adelaideSignalsSchema = z.object({
  deducesPanorama: z
    .boolean()
    .describe('Says, in any form, that the Panorama goes round the building (tenants read it in turn) or that Armando takes it and passes it on'),
  accusesOneTenant: z.boolean().describe('Accuses one single tenant of taking the Panorama'),
  asksAboutTheAria: z.boolean().describe('Asks which tune the man was whistling'),
  asksAboutTheMan: z.boolean().describe('Asks about the man on the stairs'),
  clues,
});
export type AdelaideSignals = z.infer<typeof adelaideSignalsSchema>;

/** A Letter to an office (the Procura, the Mobile, the Anagrafe…). */
export const authoritySignalsSchema = z.object({
  requestKeys: z
    .array(z.string())
    .describe("The Story's request keys the Letter contains (e.g. luca_name), so an office can find a document"),
  namesAldo: z
    .boolean()
    .describe('Lets the office find Aldo: name and surname, or «the Aldo who plays chess with agent Voss on Thursdays at the bar in via Fratelli Bonnet»'),
  statesDate: z.boolean().describe('Gives the date of the next attack: 17 December, or «the anniversary Thursday»'),
  vossAsTarget: z.boolean().describe('Says Voss is the next target'),
  calendarReasoning: z
    .boolean()
    .describe('Reasons on the calendar: the murders fall on Luca\'s dates and on Thursdays, the chess nights'),
  citesEvidence: z.array(evidenceKey).describe('The evidence (P1–P12) the Letter cites'),
  linksToLuca: z.boolean().describe('Links the 1987 murders to the 1977 Moretti trial'),
  reportsBenvenuti: z.boolean().describe('Warns that Clara Benvenuti is in danger'),
  reportsCancellations: z.boolean().describe("Reports Aldo's cancelled chess nights on the nights of the murders"),
  joinsAriaAndRigoletto: z
    .boolean()
    .describe("Joins the aria whistled on the stairs (Adelaide) to Aldo's Rigoletto (Voss)"),
  passesTheBulb: z.boolean().describe('Reports that the fourth-floor bulb was unscrewed, not burnt out'),
  reportsVossConfession: z.boolean().describe('Reports what Voss confessed about the 1977 line-ups'),
  clues,
});
export type AuthoritySignals = z.infer<typeof authoritySignalsSchema>;

/** A Letter to anyone else (Armando): only the clues. */
export const otherSignalsSchema = z.object({ clues });
export type OtherSignals = z.infer<typeof otherSignalsSchema>;

/** One Player Letter as the mechanics see it. */
export type ReadLetter =
  | { to: string; kind: 'voss'; signals: VossSignals }
  | { to: string; kind: 'adelaide'; signals: AdelaideSignals }
  | { to: string; kind: 'authority'; signals: AuthoritySignals }
  | { to: string; kind: 'other'; signals: OtherSignals };

/** Which signals schema the reader uses for a Letter to `to`. */
export function signalsKindFor(to: string, isOffice: boolean): ReadLetter['kind'] {
  if (to === 'voss') return 'voss';
  if (to === 'adelaide') return 'adelaide';
  return isOffice ? 'authority' : 'other';
}

export const signalsSchemas = {
  voss: vossSignalsSchema,
  adelaide: adelaideSignalsSchema,
  authority: authoritySignalsSchema,
  other: otherSignalsSchema,
} as const;
