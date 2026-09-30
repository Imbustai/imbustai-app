import type {
  Correspondent,
  DraftBatch,
  Enclosure,
  Engine,
  Finding,
  GameView,
  HookContext,
  OutgoingLetter,
} from '../contract';

// Platform rules that sit around the Hooks, whatever the Engine: senders come
// from the cast, the admin edits only Letter bodies and Enclosures, and every
// draft is re-validated after it changes. Persistence stays with the caller.

/**
 * The Player's contacts, named from the cast.
 * @category Utilities
 */
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

/**
 * A draft Letter whose sender is not in the cast is an error.
 * @category Utilities
 */
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

/**
 * The closing batch needs no reply, so it carries only Epilogues and Dispatches.
 * @category Utilities
 */
export function closingLetterKinds(draft: DraftBatch): Finding[] {
  return draft.letters
    .filter((letter) => letter.kind !== 'epilogue' && letter.kind !== 'dispatch')
    .map((letter) => ({
      rule: 'closing_letter_kind',
      severity: 'error' as const,
      message: `A closing batch carries only Epilogues and Dispatches, not a "${letter.kind}".`,
      letterKey: letter.key,
    }));
}

/**
 * Everything the admin sees beside a draft: the platform's checks, then the
 * Engine's. `closing` marks the batch `generateEpilogue` wrote.
 * @category Utilities
 */
export async function reviewDraft<Data, State>(
  engine: Engine<Data, State>,
  ctx: HookContext,
  view: GameView<Data, State>,
  draft: DraftBatch,
  opts: { closing?: boolean } = {},
): Promise<Finding[]> {
  return [
    ...unknownSenders(engine, view.story, draft),
    ...(opts.closing ? closingLetterKinds(draft) : []),
    ...(await engine.validateDraft(ctx, view, draft)),
  ];
}

/** The admin's rewrite of one Enclosure the Engine enclosed, matched by key. */
export interface EnclosureEdit {
  key: string;
  title?: string;
  body?: string;
}

/** Editable Letter body and keyed Enclosure text; senders, dates and effects stay Engine-owned. */
export interface LetterEdit {
  key: string;
  body: string;
  enclosures?: EnclosureEdit[];
}

/**
 * The admin's edits, applied to a draft: bodies and Enclosures only, matched
 * by Letter key. An Enclosure is rewritten by its key (title and body); which
 * Enclosures a Letter carries, and their kind, stay the Engine's, like
 * `effects`, senders and dates.
 * @category Utilities
 */
export function applyLetterEdits(draft: DraftBatch, edits: LetterEdit[]): DraftBatch {
  const byKey = new Map(edits.map((e) => [e.key, e]));
  return {
    ...draft,
    letters: draft.letters.map((letter) => {
      const edit = byKey.get(letter.key);
      if (!edit) return letter;
      return { ...letter, body: edit.body, enclosures: editEnclosures(letter, edit.enclosures ?? []) };
    }),
  };
}

/** An admin edit named an Enclosure its Letter does not carry. */
export class UnknownEnclosureError extends Error {
  constructor(
    readonly letterKey: string,
    readonly enclosureKey: string,
  ) {
    super(`Letter "${letterKey}" has no enclosure "${enclosureKey}".`);
  }
}

function editEnclosures(letter: OutgoingLetter, edits: EnclosureEdit[]): Enclosure[] {
  for (const edit of edits) {
    if (!letter.enclosures.some((e) => e.key === edit.key)) {
      throw new UnknownEnclosureError(letter.key, edit.key);
    }
  }
  return letter.enclosures.map((enclosure) => {
    const edit = edits.find((e) => e.key === enclosure.key);
    if (!edit) return enclosure;
    return { ...enclosure, title: edit.title ?? enclosure.title, body: edit.body ?? enclosure.body };
  });
}
