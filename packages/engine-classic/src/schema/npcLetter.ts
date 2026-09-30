import { z } from 'zod';

// Per-NPC writer output: exactly one letter, written strictly from that
// character's scoped context plus the orchestrator's brief. The descriptions
// travel to the model inside the structured-output JSON schema.

export const npcLetterSchema = z.object({
  character_slug: z.string().min(1).describe('Your exact character slug.'),
  /**
   * Proposed in-fiction date (YYYY-MM-DD). Deliberately lenient: TimeService
   * has final say and deterministically replaces missing/invalid/out-of-window
   * proposals — a sloppy model date must never crash generation.
   */
  date_sent: z
    .string()
    .default('')
    .describe('In-fiction date you write the letter, YYYY-MM-DD, within your allowed reply window.'),
  content: z
    .string()
    .min(1)
    .describe(
      'The full letter: salutation, body, signature. Do NOT include a date line — the platform renders the date separately. Markdown allowed.',
    ),
  metadata: z
    .object({
      emotional_tone: z.string().optional(),
      clues_revealed: z.array(z.string()).default([]),
      facts_referenced: z
        .array(z.string())
        .default([])
        .describe('Keys of every story fact this letter draws on. Be exhaustive.'),
    })
    .default({}),
});

export type NpcLetter = z.infer<typeof npcLetterSchema>;

/** A letter in the final reviewable batch, with the authoritative date. */
export interface BatchLetter extends NpcLetter {
  /** Resolved by TimeService (authoritative, editor-rule-driven). */
  story_date: string;
}
