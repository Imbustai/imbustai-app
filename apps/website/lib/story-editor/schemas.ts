import { z } from 'zod';

// Server-side validation for the admin story editor (Phase 2).
// Mirrors DB constraints; DB unique constraints remain the backstop.

export const SLUG_RE = /^[a-z0-9_]+$/;

const jsonObject = z.record(z.unknown());

export const storyPatchSchema = z
  .object({
    title_en: z.string().min(1),
    title_it: z.string().min(1),
    description_en: z.string(),
    description_it: z.string(),
    slug: z.string().regex(SLUG_RE),
    price_cents: z.number().int().min(0),
    is_published: z.boolean(),
    lifecycle: z.enum(['draft', 'testing', 'released']),
    first_letter: z.string(),
    allow_dynamic_npcs: z.boolean(),
    settings: z
      .object({
        max_letters_per_turn: z.number().int().min(1).max(10).optional(),
        max_turns: z.number().int().min(1).optional(),
        locale: z.string().min(2).max(10).optional(),
      })
      .optional(),
    time_config: z
      .object({
        start_mode: z.enum(['fixed', 'actual']).optional(),
        story_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        visible_delay: z
          .object({
            enabled: z.boolean(),
            min_minutes: z.number().int().min(0),
            max_minutes: z.number().int().min(0),
          })
          .optional(),
        date_locale: z.string().optional(),
      })
      .optional(),
  })
  .partial();

export const characterSchema = z.object({
  slug: z.string().regex(SLUG_RE),
  name: z.string().min(1),
  role: z.string().default(''),
  personality: jsonObject.default({}),
  backstory: z.string().default(''),
  hidden_agenda: z.string().default(''),
  knowledge_notes: z.string().default(''),
  responsiveness: z.enum(['immediate', 'slow', 'unreliable', 'expert']).default('slow'),
  reply_delay_min_days: z.number().int().min(0).default(1),
  reply_delay_max_days: z.number().int().min(0).default(3),
  contactable_from_start: z.boolean().default(false),
  unlock_rules: jsonObject.default({}),
  opening_letter: z.string().default(''),
  opening_letter_day_offset: z.number().int().min(0).default(0),
  sort_order: z.number().int().default(0),
});

export const factSchema = z.object({
  fact_key: z.string().regex(SLUG_RE),
  content: z.string().min(1),
  category: z.string().default('general'),
  known_by: z.array(z.string()).default([]),
  is_public: z.boolean().default(false),
  reveal_act: z.number().int().min(1).nullable().default(null),
});

export const actSchema = z.object({
  act_number: z.number().int().min(1),
  title: z.string().default(''),
  goals: jsonObject.default({}),
  turn_min: z.number().int().min(1),
  turn_max: z.number().int().min(1).nullable().default(null),
  reveal_rules: jsonObject.default({}),
});

export const clueSchema = z.object({
  clue_key: z.string().regex(SLUG_RE),
  description: z.string().min(1),
  reliability: z.enum(['true_useful', 'true_misleading', 'false_coherent', 'red_herring']),
  category: z.enum(['physical', 'testimonial', 'documentary', 'subtle']).default('subtle'),
  act_available: z.number().int().min(1).default(1),
  source_character_slug: z.string().nullable().default(null),
});

export const endingSchema = z.object({
  ending_key: z.string().regex(SLUG_RE),
  title: z.string().default(''),
  conditions: jsonObject.default({}),
  narrative_guidance: z.string().default(''),
});

export const STORY_RESOURCES = {
  characters: { table: 'story_characters', schema: characterSchema },
  facts: { table: 'story_facts', schema: factSchema },
  acts: { table: 'story_acts', schema: actSchema },
  clues: { table: 'story_clues', schema: clueSchema },
  endings: { table: 'story_endings', schema: endingSchema },
} as const;

export type StoryResource = keyof typeof STORY_RESOURCES;

export function isStoryResource(value: string): value is StoryResource {
  return value in STORY_RESOURCES;
}

/** Cross-field checks that zod alone doesn't cover. Returns error keys. */
export function validateCharacterRow(row: z.infer<typeof characterSchema>): string[] {
  const errors: string[] = [];
  if (row.reply_delay_max_days < row.reply_delay_min_days) {
    errors.push('delay_max_lt_min');
  }
  return errors;
}
