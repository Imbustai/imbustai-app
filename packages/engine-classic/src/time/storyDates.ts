import { addDays, daysBetween } from '@imbustai/story-runtime';
import type { RuntimeState, StoryCharacter } from '../types';
import type { BatchLetter, NpcLetter } from '../schema/npcLetter';

// In-fiction time. Editor rules (per-character reply delay windows) are
// authoritative; the AI's proposed date_sent is honored only when it falls
// inside the window. Offsets are deterministic — the hook context's
// random(characterSlug) is seeded by (gameId, turnNumber) — so regenerating a
// draft never shuffles dates. This replaces the prototype's TimeSimulator,
// whose parser ignored dateSent entirely (aiResponseParser.ts:87-95).

/** Deterministic [0, 1) per label, e.g. the hook context's `random`. */
export type LabelledRandom = (label: string) => number;

export interface ResolveStoryDateInput {
  /** In-fiction date of the player letters this reply answers. */
  turnDate: string;
  character: Pick<StoryCharacter, 'slug' | 'reply_delay_min_days' | 'reply_delay_max_days'>;
  /** The AI's proposed date_sent (may be empty/invalid). */
  proposed?: string;
  /** Called with the character's slug. */
  random: LabelledRandom;
}

export interface ResolvedStoryDate {
  story_date: string;
  /** True when the AI proposal was outside the window and got clamped. */
  clamped: boolean;
}

export function resolveStoryDate(input: ResolveStoryDateInput): ResolvedStoryDate {
  const { turnDate, character, proposed, random } = input;
  const min = character.reply_delay_min_days;
  const max = character.reply_delay_max_days;
  const earliest = addDays(turnDate, min);
  const latest = addDays(turnDate, max);

  if (proposed && /^\d{4}-\d{2}-\d{2}$/.test(proposed)) {
    const offset = daysBetween(turnDate, proposed);
    if (offset >= min && offset <= max) {
      return { story_date: proposed, clamped: false };
    }
  }

  const span = max - min + 1;
  const pick = Math.floor(random(character.slug) * span);
  const fallback = addDays(turnDate, min + pick);
  // Defensive: keep inside [earliest, latest] even if inputs are odd.
  const story_date = fallback < earliest ? earliest : fallback > latest ? latest : fallback;
  return { story_date, clamped: true };
}

/** Resolve every letter in a batch; returns letters with authoritative dates. */
export function resolveBatchDates(opts: {
  letters: NpcLetter[];
  charactersBySlug: Map<string, StoryCharacter>;
  turnDate: string;
  random: LabelledRandom;
}): { letters: BatchLetter[]; clampedSlugs: string[] } {
  const clampedSlugs: string[] = [];
  const letters = opts.letters.map((letter) => {
    const character = opts.charactersBySlug.get(letter.character_slug);
    if (!character) {
      // Unknown slug — validator will flag it; keep the proposed date.
      return { ...letter, story_date: letter.date_sent };
    }
    const resolved = resolveStoryDate({
      turnDate: opts.turnDate,
      character,
      proposed: letter.date_sent,
      random: opts.random,
    });
    if (resolved.clamped) clampedSlugs.push(letter.character_slug);
    return { ...letter, story_date: resolved.story_date };
  });
  return { letters, clampedSlugs };
}

/** After approve: the game's in-fiction clock advances to the latest letter. */
export function advanceStoryDate(state: RuntimeState, letters: Array<{ story_date: string }>): string {
  return letters.reduce(
    (latest, l) => (l.story_date > latest ? l.story_date : latest),
    state.story_date,
  );
}
