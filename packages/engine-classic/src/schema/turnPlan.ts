import { z } from 'zod';

// Orchestrator (Game Master) output: a plan for the turn. It never writes
// letters — only briefs. Replaces the prototype's single mega-response.

export const turnPlanReplySchema = z.object({
  character_slug: z.string().min(1),
  brief: z.string().min(1),
  facts_to_use: z.array(z.string()).default([]),
  clues_to_release: z.array(z.string()).default([]),
  tone: z.string().optional(),
});

export const dynamicNpcProposalSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  role: z.string().default(''),
  personality_notes: z.string().default(''),
  reason: z.string().default(''),
});

export const gameStateUpdatesSchema = z.object({
  clues_found: z.array(z.string()).default([]),
  npcs_to_unlock: z.array(z.string()).default([]),
  act_progression: z.number().int().positive().optional(),
  psych_profile_updates: z.record(z.unknown()).optional(),
  victim_saved: z.boolean().optional(),
  killer_identified: z.boolean().optional(),
  dynamic_npc_proposals: z.array(dynamicNpcProposalSchema).default([]),
});

export const turnPlanSchema = z.object({
  replies: z.array(turnPlanReplySchema).min(1),
  game_state_updates: gameStateUpdatesSchema.default({}),
  narrator_notes: z.string().default(''),
});

export type TurnPlanReply = z.infer<typeof turnPlanReplySchema>;
export type GameStateUpdates = z.infer<typeof gameStateUpdatesSchema>;
export type TurnPlan = z.infer<typeof turnPlanSchema>;

/** Claude tool definition forcing structured TurnPlan output. */
export const TURN_PLAN_TOOL = {
  name: 'turn_plan',
  description:
    'Submit the Game Master plan for this turn: which characters reply, a writing brief for each, and game state updates. Do NOT write the letters themselves.',
  input_schema: {
    type: 'object' as const,
    properties: {
      replies: {
        type: 'array',
        description: 'One entry per character that replies this turn.',
        items: {
          type: 'object',
          properties: {
            character_slug: { type: 'string', description: 'Exact character slug.' },
            brief: {
              type: 'string',
              description:
                'Instructions for this character letter: what to say, what to withhold, how to spin it. Reference facts/clues by key.',
            },
            facts_to_use: {
              type: 'array',
              items: { type: 'string' },
              description: 'Fact keys this letter may draw on (must be within the character knowledge scope).',
            },
            clues_to_release: {
              type: 'array',
              items: { type: 'string' },
              description: 'Clue keys this letter reveals.',
            },
            tone: { type: 'string' },
          },
          required: ['character_slug', 'brief'],
        },
      },
      game_state_updates: {
        type: 'object',
        properties: {
          clues_found: { type: 'array', items: { type: 'string' } },
          npcs_to_unlock: { type: 'array', items: { type: 'string' } },
          act_progression: { type: 'integer' },
          psych_profile_updates: { type: 'object' },
          victim_saved: { type: 'boolean' },
          killer_identified: { type: 'boolean' },
          dynamic_npc_proposals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                slug: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                personality_notes: { type: 'string' },
                reason: { type: 'string' },
              },
              required: ['slug', 'name'],
            },
          },
        },
      },
      narrator_notes: {
        type: 'string',
        description: 'Internal Game Master notes for the human reviewer. Never shown to the player.',
      },
    },
    required: ['replies'],
  },
};
