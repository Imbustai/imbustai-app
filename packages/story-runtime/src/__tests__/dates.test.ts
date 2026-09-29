import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, seededRandom } from '../time/dates';
import { computeVisibleFrom } from '../time/visibleFrom';

describe('date math', () => {
  it('adds days across month boundaries', () => {
    expect(addDays('2025-08-30', 3)).toBe('2025-09-02');
    expect(daysBetween('2025-08-02', '2025-08-04')).toBe(2);
  });
});

describe('seededRandom', () => {
  it('seededRandom is stable and in [0,1)', () => {
    expect(seededRandom('abc')).toBe(seededRandom('abc'));
    const r = seededRandom('anything');
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(1);
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
