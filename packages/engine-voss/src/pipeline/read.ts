import { z } from 'zod';
import { readPlayerLetter, type GameView, type HookContext, type ReaderNotes } from '@imbustai/story-runtime';
import {
  adelaideSignalsSchema,
  authoritySignalsSchema,
  clueReadingSchema,
  ladderArgumentSchema,
  otherSignalsSchema,
  signalsKindFor,
  vossSignalsSchema,
  type ReadLetter,
} from '../mechanics/signals';
import type { VossState } from '../mechanics/state';
import type { VossStory } from '../schema';
import { correspondent } from './prompts';

// The reader's side of the pipeline: one `analyst` call per Letter of the
// Lead, on the addressee's model, reporting the runtime's notes (questions to
// answer, what he says of himself) and the mechanics' signals. The signals
// schemas come from the mechanics; here they get the Story's own lists (the
// clues the Player holds, the request keys, the evidence, the ladder steps),
// so the reader knows what each key means. The reader is an analyst: it may
// see keys a writer never does.

/** The reader's notes per addressee, kept in the draft's `effects` for a regeneration. */
export type ReaderBySlug = Record<string, ReaderNotes>;

const list = (items: string[]) => items.map((i) => `\n- ${i}`).join('');

/** The signals schema for a Letter to `kind`, with the Story's keys spelled out for the reader. */
export function signalsFor(story: VossStory, state: VossState, kind: ReadLetter['kind']): z.AnyZodObject {
  const held = [
    ...story.clues.filter((c) => state.clues[c.key]?.deliveredIn !== null && state.clues[c.key] !== undefined),
    ...story.panorama.clues.filter((c) => state.panoramaClues[c.key] !== undefined).map((c) => ({ ...c, understoodWhen: '' })),
  ];
  const clues = z
    .array(clueReadingSchema)
    .describe(
      'Only clues the Letter actually uses; a clue it never mentions is left out. The clues the Lead has received so far:' +
        list(held.map((c) => `${c.key}: ${c.clue}${c.understoodWhen ? ` Understood when: ${c.understoodWhen}` : ''}`)),
    );

  switch (kind) {
    case 'voss':
      return vossSignalsSchema.extend({
        clues,
        ladderArguments: z.array(ladderArgumentSchema).describe(
          "Arguments meant to move one of Voss's three doubts. Each ladder, where Voss stands and what the next step requires:" +
            list(
              story.voss.ladders.map((l) => {
                const at = state.ladders[l.key];
                const next = l.steps[at + 1];
                return `${l.key} (${l.name}): at step ${at}. ${next ? `Step ${at + 1} requires: ${next.requires}` : 'At the top.'}`;
              }),
            ),
        ),
      });
    case 'adelaide':
      return adelaideSignalsSchema.extend({ clues });
    case 'authority':
      return authoritySignalsSchema.extend({
        clues,
        requestKeys: z
          .array(z.string())
          .describe("The Story's request keys the Letter contains, by key:" + list(story.requestKeys.map((r) => `${r.key}: ${r.means}`))),
        citesEvidence: z
          .array(z.string().regex(/^P\d+$/))
          .describe('The evidence the Letter cites, by key:' + list(story.evidence.map((e) => `${e.key}: ${e.name}`))),
      });
    case 'other':
      return otherSignalsSchema.extend({ clues });
  }
}

export interface ReadSubmission {
  /** One per Letter of the Lead, in order: what `playTurn` takes. */
  letters: ReadLetter[];
  /** The notes per addressee; two Letters to the same Character are merged. */
  notes: ReaderBySlug;
}

/** Reads every Letter of the Turn, each on its addressee's `analyst`. */
export async function readSubmission(ctx: HookContext, view: GameView<VossStory, VossState>): Promise<ReadSubmission> {
  const { story, state, history, submission } = view;
  const requestKeys = new Set(story.requestKeys.map((r) => r.key));

  const read = await Promise.all(
    submission.map(async (letter) => {
      const c = correspondent(story, letter.to);
      const kind = signalsKindFor(letter.to, c.kind === 'office');
      const previous = history.filter((l) => l.direction === 'in' && l.from === letter.to && l.kind !== 'dispatch').at(-1);
      const result = await readPlayerLetter(ctx.ai, {
        character: { slug: c.slug, name: c.name },
        lead: story.lead.name,
        previousLetter: previous?.body,
        playerLetter: letter.body,
        signals: signalsFor(story, state, kind),
      });
      const { signals, ...notes } = result as ReaderNotes & { signals: Record<string, unknown> };
      // A key the Story does not define finds nothing: drop it rather than guess.
      if (Array.isArray(signals.requestKeys)) {
        signals.requestKeys = signals.requestKeys.filter((k) => requestKeys.has(k as string));
      }
      return { read: { to: letter.to, kind, signals } as ReadLetter, notes };
    }),
  );

  const notes: ReaderBySlug = {};
  for (const r of read) {
    const before = notes[r.read.to];
    notes[r.read.to] = before ? mergeNotes(before, r.notes) : r.notes;
  }
  return { letters: read.map((r) => r.read), notes };
}

function mergeNotes(a: ReaderNotes, b: ReaderNotes): ReaderNotes {
  return {
    questions: [...a.questions, ...b.questions],
    claimsAboutSelf: [...a.claimsAboutSelf, ...b.claimsAboutSelf],
    actions: [...a.actions, ...b.actions],
    hypotheses: [...a.hypotheses, ...b.hypotheses],
    requests: [...a.requests, ...b.requests],
    answersToCharacterQuestions: [...a.answersToCharacterQuestions, ...b.answersToCharacterQuestions],
    tone: `${a.tone} ${b.tone}`.trim(),
  };
}
