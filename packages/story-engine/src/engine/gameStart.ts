import type { StoryConfig } from '../types';
import { addDays } from '../time/timeService';

// Game-start helpers. The start-game route (Phase 3) uses these to create
// the initial interactions: one letter per character with a non-empty
// opening_letter, dated story-start + per-letter offset. Letter bodies never
// embed dates — story_date is metadata rendered by the UI.

/**
 * The in-fiction start date for a new game.
 * - start_mode 'fixed' (default): the story's configured start date.
 * - start_mode 'actual': the real-world date the game starts.
 */
export function resolveStartDate(story: StoryConfig, actualStartDate?: string): string {
  if (story.time_config.start_mode === 'actual') {
    return actualStartDate ?? new Date().toISOString().slice(0, 10);
  }
  return story.time_config.story_start_date;
}

export interface OpeningLetter {
  character_slug: string;
  content: string;
  /** In-fiction date: start date + the character's opening_letter_day_offset. */
  story_date: string;
}

export function openingLetters(story: StoryConfig, startDate: string): OpeningLetter[] {
  return story.characters
    .filter((c) => c.opening_letter.trim() !== '')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({
      character_slug: c.slug,
      content: c.opening_letter,
      story_date: addDays(startDate, c.opening_letter_day_offset),
    }));
}
