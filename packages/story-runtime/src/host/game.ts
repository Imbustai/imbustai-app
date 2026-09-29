import type {
  Correspondent,
  DraftBatch,
  Engine,
  Finding,
  GameView,
  HookContext,
} from '../contract';

// Platform rules that sit around the Hooks, whatever the Engine: senders come
// from the cast, the admin edits only Letter bodies and Enclosures, and every
// draft is re-validated after it changes. Persistence stays with the caller.

/** The Player's contacts, named from the cast. */
export function contactsOf<Data, State>(
  engine: Engine<Data, State>,
  view: GameView<Data, State>,
): Correspondent[] {
  const { correspondents } = engine.cast(view.story);
  return engine.contacts(view).map((slug) => {
    const found = correspondents.find((c) => c.slug === slug);
    if (!found) throw new Error(`${engine.id}: contact "${slug}" is not in the cast`);
    return found;
  });
}

/** A draft Letter whose sender is not in the cast is an error. */
export function unknownSenders<Data, State>(
  engine: Engine<Data, State>,
  story: Data,
  draft: DraftBatch,
): Finding[] {
  const known = new Set(engine.cast(story).correspondents.map((c) => c.slug));
  return draft.letters
    .filter((letter) => !known.has(letter.from))
    .map((letter) => ({
      rule: 'unknown_sender',
      severity: 'error' as const,
      message: `"${letter.from}" is not in the cast.`,
      letterKey: letter.key,
    }));
}

/** Everything the admin sees beside a draft: the platform's checks, then the Engine's. */
export async function reviewDraft<Data, State>(
  engine: Engine<Data, State>,
  ctx: HookContext,
  view: GameView<Data, State>,
  draft: DraftBatch,
): Promise<Finding[]> {
  return [...unknownSenders(engine, view.story, draft), ...(await engine.validateDraft(ctx, view, draft))];
}

export interface LetterEdit {
  key: string;
  body: string;
  enclosures?: DraftBatch['letters'][number]['enclosures'];
}

/**
 * The admin's edits, applied to a draft: bodies and Enclosures only, matched
 * by Letter key. `effects`, senders and dates stay the Engine's.
 */
export function applyLetterEdits(draft: DraftBatch, edits: LetterEdit[]): DraftBatch {
  const byKey = new Map(edits.map((e) => [e.key, e]));
  return {
    ...draft,
    letters: draft.letters.map((letter) => {
      const edit = byKey.get(letter.key);
      if (!edit) return letter;
      return { ...letter, body: edit.body, enclosures: edit.enclosures ?? letter.enclosures };
    }),
  };
}
