import { describe, expect, it } from 'vitest';
import { openingLetters, resolveStartDate } from '../engine/gameStart';
import { initialRuntimeState } from '../engine/turnProcessor';
import type { StoryConfig } from '../types';
import { VOSS_STORY } from '../../seed/voss';

describe('resolveStartDate', () => {
  it('fixed mode uses the configured story start date', () => {
    expect(resolveStartDate(VOSS_STORY, '2026-06-12')).toBe('2025-08-02');
  });

  it('actual mode uses the real game-start date', () => {
    const actual: StoryConfig = {
      ...VOSS_STORY,
      time_config: { ...VOSS_STORY.time_config, start_mode: 'actual' },
    };
    expect(resolveStartDate(actual, '2026-06-12')).toBe('2026-06-12');
    expect(initialRuntimeState(actual, '2026-06-12').story_date).toBe('2026-06-12');
  });
});

describe('openingLetters', () => {
  it('Voss has exactly one opening letter, dated at start, with NO date in the body', () => {
    const letters = openingLetters(VOSS_STORY, resolveStartDate(VOSS_STORY));
    expect(letters).toHaveLength(1);
    expect(letters[0].character_slug).toBe('voss');
    expect(letters[0].story_date).toBe('2025-08-02');
    expect(letters[0].content).not.toContain('[Data');
    expect(letters[0].content.startsWith('Caro Ispettore Mercier')).toBe(true);
  });

  it('supports multiple opening letters with day offsets, ordered by sort_order', () => {
    const story: StoryConfig = {
      ...VOSS_STORY,
      characters: VOSS_STORY.characters.map((c) =>
        c.slug === 'comune'
          ? { ...c, opening_letter: 'Comunicazione di servizio.', opening_letter_day_offset: 3 }
          : c,
      ),
    };
    const letters = openingLetters(story, '2025-08-02');
    expect(letters.map((l) => l.character_slug)).toEqual(['voss', 'comune']);
    expect(letters[1].story_date).toBe('2025-08-05');
  });

  it('a story with no opening letters yields an empty set (legacy first_letter fallback is the caller’s job)', () => {
    const story: StoryConfig = {
      ...VOSS_STORY,
      characters: VOSS_STORY.characters.map((c) => ({ ...c, opening_letter: '' })),
    };
    expect(openingLetters(story, '2025-08-02')).toEqual([]);
  });
});
