import { z } from 'zod';

// Per-NPC writer output: exactly one letter, written strictly from that
// character's scoped context plus the orchestrator's brief.

export const npcLetterSchema = z.object({
  character_slug: z.string().min(1),
  /**
   * Proposed in-fiction date (YYYY-MM-DD). Deliberately lenient: TimeService
   * has final say and deterministically replaces missing/invalid/out-of-window
   * proposals — a sloppy model date must never crash generation.
   */
  date_sent: z.string().default(''),
  content: z.string().min(1),
  metadata: z
    .object({
      emotional_tone: z.string().optional(),
      clues_revealed: z.array(z.string()).default([]),
      facts_referenced: z.array(z.string()).default([]),
    })
    .default({}),
});

export type NpcLetter = z.infer<typeof npcLetterSchema>;

/** A letter in the final reviewable batch, with the authoritative date. */
export interface BatchLetter extends NpcLetter {
  /** Resolved by TimeService (authoritative, editor-rule-driven). */
  story_date: string;
}

export const NPC_LETTER_TOOL = {
  name: 'npc_letter',
  description: 'Submit the complete letter this character writes to the player.',
  input_schema: {
    type: 'object' as const,
    properties: {
      character_slug: { type: 'string', description: 'Your exact character slug.' },
      date_sent: {
        type: 'string',
        description: 'In-fiction date you write the letter, YYYY-MM-DD, within your allowed reply window.',
      },
      content: {
        type: 'string',
        description: 'The full letter: date line, salutation, body, signature. Markdown allowed.',
      },
      metadata: {
        type: 'object',
        properties: {
          emotional_tone: { type: 'string' },
          clues_revealed: { type: 'array', items: { type: 'string' } },
          facts_referenced: {
            type: 'array',
            items: { type: 'string' },
            description: 'Keys of every story fact this letter draws on. Be exhaustive.',
          },
        },
      },
    },
    required: ['character_slug', 'date_sent', 'content'],
  },
};
