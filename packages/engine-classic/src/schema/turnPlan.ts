import { z } from 'zod';

// Orchestrator (Game Master) output: a plan for the turn. It never writes
// letters — only briefs. Replaces the prototype's single mega-response. The
// descriptions travel to the model inside the structured-output JSON schema.

export const turnPlanReplySchema = z.object({
  character_slug: z.string().min(1).describe('Exact character slug.'),
  brief: z
    .string()
    .min(1)
    .describe(
      'Instructions for this character letter: what to say, what to withhold, how to spin it. Reference facts/clues by key.',
    ),
  facts_to_use: z
    .array(z.string())
    .default([])
    .describe('Fact keys this letter may draw on (must be within the character knowledge scope).'),
  clues_to_release: z.array(z.string()).default([]).describe('Clue keys this letter reveals.'),
  tone: z.string().optional(),
});

export const dynamicNpcProposalSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  role: z.string().default(''),
  personality_notes: z.string().default(''),
  reason: z.string().default(''),
});

/** One observation about the player; applied to the game's psych profile by trait. */
export const psychProfileUpdateSchema = z.object({
  trait: z.string().min(1),
  note: z.string(),
});

export const gameStateUpdatesSchema = z.object({
  clues_found: z.array(z.string()).default([]),
  npcs_to_unlock: z.array(z.string()).default([]),
  act_progression: z.number().int().positive().optional(),
  psych_profile_updates: z.array(psychProfileUpdateSchema).optional(),
  victim_saved: z.boolean().optional(),
  killer_identified: z.boolean().optional(),
  dynamic_npc_proposals: z.array(dynamicNpcProposalSchema).default([]),
});

export const turnPlanSchema = z.object({
  replies: z.array(turnPlanReplySchema).min(1).describe('One entry per character that replies this turn.'),
  game_state_updates: gameStateUpdatesSchema.default({}),
  narrator_notes: z
    .string()
    .default('')
    .describe('Internal Game Master notes for the human reviewer. Never shown to the player.'),
});

export type TurnPlanReply = z.infer<typeof turnPlanReplySchema>;
export type GameStateUpdates = z.infer<typeof gameStateUpdatesSchema>;
export type TurnPlan = z.infer<typeof turnPlanSchema>;
