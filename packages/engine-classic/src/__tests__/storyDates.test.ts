import { describe, expect, it } from 'vitest';
import { resolveStoryDate, resolveBatchDates, advanceStoryDate } from '../time/storyDates';
import { seeded } from './helpers';
import { VOSS_STORY } from '../../seed/voss';

const voss = VOSS_STORY.characters.find((c) => c.slug === 'voss')!;
const comune = VOSS_STORY.characters.find((c) => c.slug === 'comune')!;

describe('resolveStoryDate (the dateSent fix)', () => {
  it('honors the AI proposed date when inside the character window', () => {
    const result = resolveStoryDate({
      turnDate: '2025-08-02',
      character: voss,
      proposed: '2025-08-03', // voss window: +1..+2 days
      random: seeded('game1:1'),
    });
    expect(result).toEqual({ story_date: '2025-08-03', clamped: false });
  });

  it('clamps an out-of-window proposal into the editor-configured window', () => {
    const result = resolveStoryDate({
      turnDate: '2025-08-02',
      character: comune, // window: +5..+10 days
      proposed: '2025-08-03', // too fast for a bureaucracy
      random: seeded('game1:1'),
    });
    expect(result.clamped).toBe(true);
    expect(result.story_date >= '2025-08-07').toBe(true);
    expect(result.story_date <= '2025-08-12').toBe(true);
  });

  it('is deterministic for the same (seed, character) — regenerate keeps dates', () => {
    const a = resolveStoryDate({ turnDate: '2025-08-02', character: comune, random: seeded('game1:3') });
    const b = resolveStoryDate({ turnDate: '2025-08-02', character: comune, random: seeded('game1:3') });
    expect(a.story_date).toBe(b.story_date);
    const other = resolveStoryDate({ turnDate: '2025-08-02', character: comune, random: seeded('game2:3') });
    // Different seed may differ (not guaranteed) but must stay in window.
    expect(other.story_date >= '2025-08-07' && other.story_date <= '2025-08-12').toBe(true);
  });

});

describe('resolveBatchDates + advanceStoryDate', () => {
  it('dates every letter and advances the game clock to the latest', () => {
    const { letters } = resolveBatchDates({
      letters: [
        { character_slug: 'voss', date_sent: '2025-08-03', content: 'x', metadata: { clues_revealed: [], facts_referenced: [] } },
        { character_slug: 'comune', date_sent: '2025-08-03', content: 'y', metadata: { clues_revealed: [], facts_referenced: [] } },
      ],
      charactersBySlug: new Map(VOSS_STORY.characters.map((c) => [c.slug, c])),
      turnDate: '2025-08-02',
      random: seeded('game1:1'),
    });
    const state = {
      current_turn: 1,
      current_act: 1,
      story_date: '2025-08-02',
      unlocked_npcs: ['voss', 'comune'],
      clues_found: [],
    };
    const advanced = advanceStoryDate(state, letters);
    expect(advanced).toBe(letters.map((l) => l.story_date).sort().at(-1));
    expect(advanced > '2025-08-02').toBe(true);
  });
});
