import type { RuntimeState, StoryCharacter } from '../types';
import type { BatchLetter, NpcLetter } from '../schema/npcLetter';

// In-fiction time. Editor rules (per-character reply delay windows) are
// authoritative; the AI's proposed date_sent is honored only when it falls
// inside the window. Offsets are deterministic, seeded by
// (gameId, turnNumber, characterSlug), so regenerating a draft never
// shuffles dates. This replaces the prototype's TimeSimulator, whose parser
// ignored dateSent entirely (aiResponseParser.ts:87-95).

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`).getTime();
  const to = new Date(`${toIso}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86_400_000);
}

/** Deterministic [0, 1) from a string seed (FNV-1a + mulberry32). */
export function seededRandom(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let t = (h >>> 0) + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export interface ResolveStoryDateInput {
  /** In-fiction date of the player letters this reply answers. */
  turnDate: string;
  character: Pick<StoryCharacter, 'slug' | 'reply_delay_min_days' | 'reply_delay_max_days'>;
  /** The AI's proposed date_sent (may be empty/invalid). */
  proposed?: string;
  /** Deterministic seed, e.g. `${gameId}:${turnNumber}`. */
  seed: string;
}

export interface ResolvedStoryDate {
  story_date: string;
  /** True when the AI proposal was outside the window and got clamped. */
  clamped: boolean;
}

export function resolveStoryDate(input: ResolveStoryDateInput): ResolvedStoryDate {
  const { turnDate, character, proposed, seed } = input;
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
  const pick = Math.floor(seededRandom(`${seed}:${character.slug}`) * span);
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
  seed: string;
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
      seed: opts.seed,
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
