import { z } from 'zod';
import type { AiAccess, CharacterSlug } from '../contract';
import type { ReaderNotes } from './reader';

// The Ledger: the per-Game record of every piece of Texture that reached the
// Player, and of what the Lead told each Character about himself, so later
// Letters stay consistent with it ("What rules does every Character reply
// obey?", Imbustai/imbustai-app#13). Each entry says who told it to whom:
// a Character's writer sees only what it told or was told, never what the
// Lead wrote to someone else (no knowledge bleed). The Engine keeps the
// Ledger in its per-Game state and adds to it in `applyTurn`, from the
// reader's notes and the Letters as sent.

/** One fact that reached a reader: who stated it, to whom, and in which Turn. */
export interface LedgerEntry {
  turn: number;
  /** Who stated the fact: a Character, or the Lead. */
  teller: CharacterSlug;
  /** Who read it. */
  audience: CharacterSlug;
  fact: string;
}

/** A Game's whole Ledger, oldest first; plain JSON for the Engine state. */
export type Ledger = LedgerEntry[];

/** For an Engine's state schema. */
export const ledgerSchema = z.array(
  z.object({
    turn: z.number().int().nonnegative(),
    teller: z.string().min(1),
    audience: z.string().min(1),
    fact: z.string().min(1),
  }),
) satisfies z.ZodType<Ledger, z.ZodTypeDef, unknown>;

/** What the Lead said about himself in one Letter, from the reader's notes: no model call. */
export function ledgerFromReader(
  notes: Pick<ReaderNotes, 'claimsAboutSelf'>,
  at: { turn: number; lead: CharacterSlug; character: CharacterSlug },
): LedgerEntry[] {
  return notes.claimsAboutSelf.map((fact) => ({ turn: at.turn, teller: at.lead, audience: at.character, fact }));
}

/** The entries one Character may know: those it told, and those told to it. */
export function ledgerFor(ledger: Ledger, character: CharacterSlug): Ledger {
  return ledger.filter((e) => e.teller === character || e.audience === character);
}

/** Entries as a prompt section, one line each, oldest first. */
export function renderLedger(entries: Ledger, names: Record<CharacterSlug, string>): string {
  if (entries.length === 0) return '(nothing recorded yet)';
  return entries.map((e) => `- ${names[e.teller] ?? e.teller} (Turn ${e.turn}): ${e.fact}`).join('\n');
}

const textureSchema = z.object({
  facts: z
    .array(z.string())
    .describe('Each new fact the Character states about its own life, habits, places or people, one per item'),
});

/** One sent Letter whose new Texture `recordTexture` records. */
export interface TextureInput {
  turn: number;
  character: { slug: CharacterSlug; name: string };
  /** The Lead's slug: the audience of the Character's Letter. */
  lead: CharacterSlug;
  /** The Letter as the Player reads it, admin edits included. */
  letter: string;
  /** The Ledger so far; only this Character's part is sent. */
  ledger: Ledger;
}

/** The new Texture one sent Letter adds, read on the Character's `analyst`. */
export async function recordTexture(ai: AiAccess, input: TextureInput): Promise<LedgerEntry[]> {
  const known = ledgerFor(input.ledger, input.character.slug).filter((e) => e.teller === input.character.slug);
  const { facts } = await ai.structured('analyst', {
    purpose: 'ledger',
    character: input.character.slug,
    system:
      `You keep the record of what ${input.character.name} has told about itself in an epistolary game, so its later Letters never contradict it. ` +
      'From the Letter, list each new concrete fact about its own life: people, places, habits, tastes, things it owns or did. ' +
      'Skip facts about the case being investigated, opinions, and anything already recorded. Write each fact in the language of the Letter.',
    user: `## Already recorded\n\n${known.map((e) => `- ${e.fact}`).join('\n') || '(nothing)'}\n\n## The Letter\n\n${input.letter}`,
    schema: textureSchema,
  });
  return facts.map((fact) => ({ turn: input.turn, teller: input.character.slug, audience: input.lead, fact }));
}
