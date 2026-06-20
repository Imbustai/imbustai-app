import { describe, expect, it } from 'vitest';
import { turnPlanSchema } from '../schema/turnPlan';
import { npcLetterSchema } from '../schema/npcLetter';

describe('turnPlanSchema', () => {
  it('parses a minimal valid plan and fills defaults', () => {
    const plan = turnPlanSchema.parse({
      replies: [{ character_slug: 'voss', brief: 'Reply warmly.' }],
    });
    expect(plan.replies[0].facts_to_use).toEqual([]);
    expect(plan.game_state_updates.clues_found).toEqual([]);
    expect(plan.narrator_notes).toBe('');
  });

  it('rejects a plan with no replies', () => {
    expect(() => turnPlanSchema.parse({ replies: [] })).toThrow();
  });

  it('rejects malformed dynamic NPC proposals', () => {
    expect(() =>
      turnPlanSchema.parse({
        replies: [{ character_slug: 'voss', brief: 'x' }],
        game_state_updates: { dynamic_npc_proposals: [{ name: 'No Slug' }] },
      }),
    ).toThrow();
  });
});

describe('npcLetterSchema', () => {
  it('parses a valid letter and defaults metadata arrays', () => {
    const letter = npcLetterSchema.parse({
      character_slug: 'comune',
      date_sent: '2025-08-09',
      content: 'In riferimento alla Sua richiesta...',
    });
    expect(letter.metadata.clues_revealed).toEqual([]);
    expect(letter.metadata.facts_referenced).toEqual([]);
  });

  it('tolerates non-ISO dates (TimeService replaces them deterministically)', () => {
    const letter = npcLetterSchema.parse({
      character_slug: 'voss',
      date_sent: '9 agosto',
      content: 'x',
    });
    expect(letter.date_sent).toBe('9 agosto'); // resolveStoryDate will clamp it
  });

  it('rejects empty content', () => {
    expect(() =>
      npcLetterSchema.parse({ character_slug: 'voss', date_sent: '2025-08-03', content: '' }),
    ).toThrow();
  });
});
