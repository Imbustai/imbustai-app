import { z } from 'zod';
import type { RuntimeState, StoryConfig } from './types';

// The zod side of types.ts: what the platform validates before any Hook runs.
// Deliberately as loose as the DB it mirrors — this engine is archived, and its
// schemas exist to satisfy the Engine contract, not to tighten old data.

const record = z.record(z.unknown());

const characterSchema = z.object({
  slug: z.string().min(1),
  name: z.string(),
  role: z.string(),
  personality: record,
  backstory: z.string(),
  hidden_agenda: z.string(),
  knowledge_notes: z.string(),
  responsiveness: z.enum(['immediate', 'slow', 'unreliable', 'expert']),
  reply_delay_min_days: z.number(),
  reply_delay_max_days: z.number(),
  contactable_from_start: z.boolean(),
  unlock_rules: record,
  opening_letter: z.string(),
  opening_letter_day_offset: z.number(),
  sort_order: z.number(),
});

export const storyConfigSchema: z.ZodType<StoryConfig, z.ZodTypeDef, unknown> = z.object({
  slug: z.string(),
  title: z.string(),
  first_letter: z.string(),
  settings: z.object({
    max_letters_per_turn: z.number().optional(),
    max_turns: z.number().optional(),
    locale: z.string().optional(),
  }),
  time_config: z.object({
    start_mode: z.enum(['fixed', 'actual']).optional(),
    story_start_date: z.string(),
    visible_delay: z
      .object({ enabled: z.boolean(), min_minutes: z.number(), max_minutes: z.number() })
      .optional(),
    date_locale: z.string().optional(),
  }),
  allow_dynamic_npcs: z.boolean(),
  lifecycle: z.enum(['draft', 'testing', 'released']),
  characters: z.array(characterSchema),
  facts: z.array(
    z.object({
      fact_key: z.string(),
      content: z.string(),
      category: z.string(),
      known_by: z.array(z.string()),
      is_public: z.boolean(),
      reveal_act: z.number().nullable(),
    }),
  ),
  acts: z.array(
    z.object({
      act_number: z.number(),
      title: z.string(),
      goals: z.union([record, z.array(z.unknown())]),
      turn_min: z.number(),
      turn_max: z.number().nullable(),
      reveal_rules: record,
    }),
  ),
  clues: z.array(
    z.object({
      clue_key: z.string(),
      description: z.string(),
      reliability: z.enum(['true_useful', 'true_misleading', 'false_coherent', 'red_herring']),
      category: z.enum(['physical', 'testimonial', 'documentary', 'subtle']),
      act_available: z.number(),
      source_character_slug: z.string().nullable(),
    }),
  ),
  endings: z.array(
    z.object({
      ending_key: z.string(),
      title: z.string(),
      conditions: record,
      narrative_guidance: z.string(),
    }),
  ),
});

/** Passthrough: keys this engine no longer reads survive a save. */
export const runtimeStateSchema: z.ZodType<RuntimeState, z.ZodTypeDef, unknown> = z
  .object({
    current_turn: z.number(),
    current_act: z.number(),
    story_date: z.string(),
    unlocked_npcs: z.array(z.string()),
    clues_found: z.array(z.string()),
    psych_profile: record.optional(),
    victim_saved: z.boolean().optional(),
    killer_identified: z.boolean().optional(),
  })
  .passthrough();
