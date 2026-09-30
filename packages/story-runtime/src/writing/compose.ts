import type { AiAccess, Correspondent } from '../contract';
import { checkLetter, type CheckInput, type CheckIssue, type LetterCheck } from './checker';
import { editLetter } from './editor';
import { findPlotKeyCollisions } from './plotKeys';

// One Character's Letter, the way "One real Voss Turn, end to end"
// (Imbustai/imbustai-app#25) settled it: the draft, the reply-rule checker,
// at most one rewrite (only for `must` points, continuing the writer's own
// conversation so its cached prefix and thinking stay valid), then the
// editing pass (#37), all before the admin's review. Engines build the
// prompts; this runs the sequence and meters every call through `ai`.

/** The Engine's prompts and check material for one Character's Letter. */
export interface ComposeInput {
  character: Pick<Correspondent, 'slug' | 'name' | 'kind'>;
  /** The Lead's name, e.g. "Giacomo Lombardo". */
  lead: string;
  /** The Story's language, e.g. "it": it decides whether the editing pass runs. */
  language: string;
  /**
   * The Engine's writer prompt: the Character's writer view as the cached
   * prefix, and this Turn's correspondence and state as `user`. A person is
   * written on the `writer` role, an office or a newspaper on the `clerk`.
   */
  writer: { cachedPrefix?: string; system: string; user: string; maxTokens?: number };
  check: Omit<CheckInput, 'character' | 'lead' | 'letter'>;
  edit?: { voice?: string; examples?: string };
}

/** One Letter ready for review, with every stage kept for the admin. */
export interface ComposedLetter {
  /** What goes into the draft batch for review. */
  body: string;
  draft: string;
  check: LetterCheck;
  /** Present only if the checker found a `must` point. */
  rewrite?: string;
  /** For the draft batch's `adminNotes`. */
  adminNotes: string[];
}

/**
 * Writes one Character's Letter: draft, reply-rule check, at most one
 * rewrite on `must` points in the writer's own conversation, then the
 * editing pass. Every call is metered through `ai`.
 */
export async function composeLetter(ai: AiAccess, input: ComposeInput): Promise<ComposedLetter> {
  const { character } = input;
  const role = character.kind === 'person' ? 'writer' : 'clerk';
  const request = { ...input.writer, character: character.slug };

  const first = await ai.converse(role, { ...request, purpose: 'reply' });
  const draft = first.text.trim();
  const check = await checkLetter(ai, { ...input.check, character, lead: input.lead, letter: draft });
  const adminNotes = [checkNote(character.slug, check)];

  let letter = draft;
  let rewrite: string | undefined;
  if (check.mustFix.length > 0) {
    const second = await ai.converse(role, { ...request, purpose: 'rewrite', user: rewriteAsk(check.mustFix) }, first.conversation);
    rewrite = second.text.trim();
    letter = rewrite;
    const kept = input.check.plotKeys
      ? findPlotKeyCollisions(rewrite, { character: character.slug, ...input.check.plotKeys })
      : [];
    for (const c of kept) adminNotes.push(`${character.slug}: "${c.term}" is still in the Letter after the rewrite: «${c.quote}»`);
  }

  const body = await editLetter(ai, { character, language: input.language, ...input.edit, letter });
  return { body, draft, check, ...(rewrite !== undefined ? { rewrite } : {}), adminNotes };
}

function rewriteAsk(points: CheckIssue[]): string {
  const list = points.map((p, n) => `${n + 1}. «${p.quote}» (${p.rule}): ${p.problem} Fix: ${p.fix}`).join('\n');
  return (
    `The rule check found these points in your Letter:\n${list}\n\n` +
    'Rewrite the whole Letter fixing these points only. Everything else stays as it is. Write only the Letter.'
  );
}

function checkNote(slug: string, check: LetterCheck): string {
  const should = check.issues.length - check.mustFix.length;
  const unanswered = check.questionsAnswered.filter((q) => q.answered === 'no').length;
  const verdict = check.mustFix.length > 0 ? 'rewritten once' : 'no rewrite';
  return `${slug}: checker found ${check.mustFix.length} must and ${should} should (${verdict}); ${unanswered} question(s) unanswered`;
}
