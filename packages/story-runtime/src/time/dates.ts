import type { DateTools, IsoDate } from '../contract';

// Pure in-fiction date helpers, shared by every Engine through the hook
// context. Dates are ISO strings (YYYY-MM-DD) computed in UTC so they never
// shift with the server's timezone.

/**
 * Shift a YYYY-MM-DD date by a signed number of calendar days using UTC.
 * @category Utilities
 */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Signed day difference between two YYYY-MM-DD dates, independent of server timezone.
 * @category Utilities
 */
export function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`).getTime();
  const to = new Date(`${toIso}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86_400_000);
}

/**
 * Deterministic [0, 1) from a string seed (FNV-1a + mulberry32).
 * @category Utilities
 */
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

/**
 * "12 marzo 1987" — for prose, never for storage.
 * @category Utilities
 */
export function formatStoryDate(date: IsoDate, locale = 'it-IT'): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Bind date formatting to a locale (Italian by default), alongside the UTC arithmetic helpers.
 * @category Utilities
 */
export function dateTools(locale = 'it-IT'): DateTools {
  return { addDays, daysBetween, format: (date) => formatStoryDate(date, locale) };
}
