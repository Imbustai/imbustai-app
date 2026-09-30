import { z } from 'zod';
import type { AiAccess, Correspondent } from '../contract';
import { findPlotKeyCollisions, type ReservedTerm } from './plotKeys';
import { renderReaderNotes, type ReaderNotes } from './reader';

// The reply-rule checker: the rules of "What rules does every Character reply
// obey?" (Imbustai/imbustai-app#13) as rewritten after the one-Turn prototype
// (v2, "One real Voss Turn, end to end", #25). v1 flagged lived memory as plot
// invention and would have brought back the vague letters of July, so v2
// separates Texture from Plot keys, reports at most 8 points and sends only
// `must` points to the one rewrite. The deterministic Plot-key collision
// check runs first; the model checks the rest on the Character's `analyst`
// (Voss's runs on a stronger model through the model profile).

/** How many points the model may report; its most important come first. */
export const MAX_CHECK_ISSUES = 8;

/** The rule a deterministic Plot-key collision breaks. */
export const COLLISION_RULE = 'plot_key_collision';

/** The doors rule (#25): shared by the checker and every writer prompt. */
export const DOORS_RULE =
  'A Character may point the Lead at a door: which office to write to and which document to ask for. ' +
  'He may name the office and the document, never the field to read in it, and never the conclusion it leads to.';

const issueSchema = z.object({
  rule: z.string().describe('The rule name, e.g. no_echo, answer, lead'),
  severity: z.enum(['must', 'should']),
  quote: z.string().describe('The exact words of the Letter that break the rule'),
  problem: z.string(),
  fix: z.string().describe('How the rewrite should fix it, without writing the new text'),
});

const answeredSchema = z.object({
  question: z.string(),
  answered: z.enum(['full', 'partial_true', 'deferred_with_reason', 'no']),
  how: z.string(),
});

const reportSchema = z.object({
  issues: z.array(issueSchema).describe(`At most ${MAX_CHECK_ISSUES}, the most important first`),
  questionsAnswered: z.array(answeredSchema).describe("One entry per question in the reader's list"),
});

/** One rule break: the exact quote, the problem, and how the rewrite should fix it. */
export type CheckIssue = z.infer<typeof issueSchema>;
/** How the Letter answered one of the reader's questions. */
export type QuestionAnswered = z.infer<typeof answeredSchema>;

/** The checker's report on one Letter. */
export interface LetterCheck {
  /** Plot-key collisions first, then the model's points. */
  issues: CheckIssue[];
  questionsAnswered: QuestionAnswered[];
  /** The `must` issues: the one rewrite happens only when this is not empty. */
  mustFix: CheckIssue[];
}

/** Everything `checkLetter` checks one Letter against. */
export interface CheckInput {
  character: Pick<Correspondent, 'slug' | 'name' | 'kind'>;
  /** The Lead's name, e.g. "Giacomo Lombardo". */
  lead: string;
  /** The whole truth of the Story, author only: the checker knows it, the Character does not. Cached. */
  caseFile: string;
  /**
   * The Story's own rules, numbered after the generic ones: pacing, what may
   * not exist in its period, a Character's fixed opening. Cached.
   */
  storyRules?: string;
  /** What the Character is and knows: its writer view. */
  characterSheet: string;
  /** What the Engine allows this Turn (confidence layers, Signatures). */
  turnState?: string;
  playerLetter?: string;
  readerNotes?: ReaderNotes;
  letter: string;
  /** The deterministic collision check, run before the model. */
  plotKeys?: { reserved: ReservedTerm[]; knownText?: string[] };
}

/** Checks one Letter: deterministic collisions, then the model on the Character's `analyst`. */
export async function checkLetter(ai: AiAccess, input: CheckInput): Promise<LetterCheck> {
  const collisions = input.plotKeys
    ? findPlotKeyCollisions(input.letter, { character: input.character.slug, ...input.plotKeys })
    : [];
  const collisionIssues: CheckIssue[] = collisions.map((c) => ({
    rule: COLLISION_RULE,
    severity: 'must',
    quote: c.quote,
    problem: `"${c.term}" is a Plot key of the Story${c.note ? ` (${c.note})` : ''} that this Character does not know: it plants a false clue.`,
    fix: `Replace "${c.term}" with a name or place that has no role in the Story.`,
  }));

  const report = await ai.structured('analyst', {
    purpose: 'checker',
    character: input.character.slug,
    cachedPrefix: checkerPrefix(input),
    system: `Check the Letter below, written by ${input.character.name}. Report rule breaks only; never rewrite the Letter.`,
    user: checkerUser(input),
    schema: reportSchema,
  });

  // The model often spots the same collision: the rewrite needs it once.
  const repeats = (i: CheckIssue) => collisionIssues.some((c) => c.quote.includes(i.quote) || i.quote.includes(c.quote));
  const modelIssues = report.issues.filter((i) => !repeats(i)).slice(0, MAX_CHECK_ISSUES);
  const issues = [...collisionIssues, ...modelIssues];
  return {
    issues,
    questionsAnswered: report.questionsAnswered,
    mustFix: issues.filter((i) => i.severity === 'must'),
  };
}

function checkerPrefix(input: CheckInput): string {
  const story = input.storyRules ? `\n\n## The Story's own rules\n\n${input.storyRules}` : '';
  return `${replyRules(input.lead)}${story}\n\n# The case file (the whole truth, author only)\n\n${input.caseFile}`;
}

function checkerUser(input: CheckInput): string {
  const kind = input.character.kind === 'person' ? 'a person' : `an ${input.character.kind === 'office' ? 'office' : 'newspaper'}`;
  const parts = [`# The Character: ${input.character.name} (${kind})\n\n${input.characterSheet}`];
  if (input.turnState) parts.push(`# This Turn\n\n${input.turnState}`);
  if (input.playerLetter) parts.push(`# ${input.lead}'s Letter\n\n${input.playerLetter}`);
  if (input.readerNotes) parts.push(`# The reader's notes\n\n${renderReaderNotes(input.readerNotes)}`);
  parts.push(`# The Letter to check\n\n${input.letter}`);
  return parts.join('\n\n');
}

/** The generic rules (v2), for any Story: the Story adds its own after them. */
function replyRules(lead: string): string {
  return `# Reply-rule checker

You check one Letter written by a Character of an epistolary game. The Player writes as ${lead}, the Lead. You know the whole truth of the story (the case file below); the Character does not. Find rule breaks, quote them exactly, and say how to fix them.

## Rules

1. **no_echo**: the Letter must not restate or summarise the Lead's reasoning before answering it. React (agree or push back, with a reason) and add something. Quoting a few of his words to anchor a reply is fine; paraphrasing his argument back is not.
2. **answer**: every question the Lead asked (see the reader's notes) gets a concrete answer: a fact, a name, a date, or a concrete reason plus when the answer will come. A **partial but true** answer is concrete and must NOT be flagged; never demand that the Character reveal more.
3. **new**: the Letter brings something new: a fact, a doubt, a step, a piece of the Character's life. Every Letter has a narrative purpose.
4. **no_plot_invention**: the Character may invent Texture (small facts of its own life) but never facts about the case: no new evidence, witnesses, dates, documents or events that the case file does not contain or that contradict it.
5. **knowledge**: the Character only says what it can know (its sheet and the case file). Flag anything that leaks what only the author knows (the culprit, the method, future events), or anything the Character learns without a source.
6. **lead**: the Character does not attribute to ${lead} thoughts, habits, facts or feelings that are not in his sheet or his own Letters. It never comments on his handwriting, paper or stamps.
7. **bridges**: every new topic grows out of what comes before it, or out of a fact of the week told first. Flag a topic, a clue or a Signature moment that appears pasted in.
8. **voice**: a person writes letters, not reports: no lists, no headers; never "someone" in place of a name the Character knows, no promise to "let you know", no "you are right", no flattery of the Lead's ideas. An office writes short, formal replies and lists documents instead of copying them.
9. **push**: when useful, the Character points ${lead} at a door without doing the work or giving the answer. ${DOORS_RULE}

## Texture is not a Plot key

A Character who lived a scene remembers it: how a person looked and dressed, the room, the street, its own nights. Such lived detail is Texture and must NOT be flagged, even when it touches a case event, as long as it adds no new evidence, no new person with a role in the case, no new document, date or event that would change what the Player can learn, and contradicts nothing in the case file. General knowledge the Character's job gives it (streets, offices and their addresses, procedure) is not a leak. What this Turn allows the Character to confide is allowed.

## Collisions

Flag as **must** any invented Texture that reuses a name, street, place or object that is a Plot key in the case file (the street where a suspect lives, a surname from the case): it plants a false clue the Character cannot mean.

## Doors

Pointing ${lead} at an office or a document is the Character's job (rule 9). Flag it only if the Character names the field to read or a conclusion it cannot know, or if the door leads straight to a Plot key the Player has shown no sign of looking for.

## Severity

**must**: breaks a rule in a way the Player would notice or that damages the story (a leak, an invented Plot key, an unanswered question, an echo paragraph, a banned phrase). **should**: a weaker point. Don't flag matters of taste. Don't flag the language: a separate editing pass handles it.

Report at most ${MAX_CHECK_ISSUES} issues, the most important first. Only **must** issues go to the rewrite, so be sure of each one: a false **must** costs the Letter more than a missed **should**.`;
}
