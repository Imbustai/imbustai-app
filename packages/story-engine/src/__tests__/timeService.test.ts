import { describe, expect, it } from 'vitest';
import {
  addDays,
  daysBetween,
  resolveStoryDate,
  resolveBatchDates,
  advanceStoryDate,
  seededRandom,
} from '../time/timeService';
import { computeVisibleFrom } from '../time/visibleFrom';
import { VOSS_STORY } from '../../seed/voss';

const voss = VOSS_STORY.characters.find((c) => c.slug === 'voss')!;
const comune = VOSS_STORY.characters.find((c) => c.slug === 'comune')!;

describe('date math', () => {
  it('adds days across month boundaries', () => {
    expect(addDays('2025-08-30', 3)).toBe('2025-09-02');
    expect(daysBetween('2025-08-02', '2025-08-04')).toBe(2);
  });
});

describe('resolveStoryDate (the dateSent fix)', () => {
  it('honors the AI proposed date when inside the character window', () => {
    const result = resolveStoryDate({
      turnDate: '2025-08-02',
      character: voss,
      proposed: '2025-08-03', // voss window: +1..+2 days
      seed: 'game1:1',
    });
    expect(result).toEqual({ story_date: '2025-08-03', clamped: false });
  });

  it('clamps an out-of-window proposal into the editor-configured window', () => {
    const result = resolveStoryDate({
      turnDate: '2025-08-02',
      character: comune, // window: +5..+10 days
      proposed: '2025-08-03', // too fast for a bureaucracy
      seed: 'game1:1',
    });
    expect(result.clamped).toBe(true);
    expect(result.story_date >= '2025-08-07').toBe(true);
    expect(result.story_date <= '2025-08-12').toBe(true);
  });

  it('is deterministic for the same (seed, character) — regenerate keeps dates', () => {
    const a = resolveStoryDate({ turnDate: '2025-08-02', character: comune, seed: 'game1:3' });
    const b = resolveStoryDate({ turnDate: '2025-08-02', character: comune, seed: 'game1:3' });
    expect(a.story_date).toBe(b.story_date);
    const other = resolveStoryDate({ turnDate: '2025-08-02', character: comune, seed: 'game2:3' });
    // Different seed may differ (not guaranteed) but must stay in window.
    expect(other.story_date >= '2025-08-07' && other.story_date <= '2025-08-12').toBe(true);
  });

  it('seededRandom is stable and in [0,1)', () => {
    expect(seededRandom('abc')).toBe(seededRandom('abc'));
    const r = seededRandom('anything');
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(1);
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
      seed: 'game1:1',
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

describe('computeVisibleFrom (real-world reveal)', () => {
  it('returns null when disabled or unset', () => {
    expect(computeVisibleFrom(undefined)).toBeNull();
    expect(computeVisibleFrom({ enabled: false, min_minutes: 1, max_minutes: 2 })).toBeNull();
  });

  it('applies a delay inside the window', () => {
    const now = new Date('2026-06-11T10:00:00');
    const iso = computeVisibleFrom({ enabled: true, min_minutes: 30, max_minutes: 60 }, now, () => 0.5)!;
    const delta = (new Date(iso).getTime() - now.getTime()) / 60_000;
    expect(delta).toBeGreaterThanOrEqual(30);
    expect(delta).toBeLessThanOrEqual(60);
  });

  it('wraps late-night deliveries to next morning', () => {
    const now = new Date('2026-06-11T22:50:00');
    const iso = computeVisibleFrom({ enabled: true, min_minutes: 60, max_minutes: 60 }, now, () => 0)!;
    const target = new Date(iso);
    expect(target.getDate()).toBe(12);
    expect(target.getHours()).toBe(8);
  });
});
