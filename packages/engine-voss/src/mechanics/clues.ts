import type { VossStory } from '../schema';
import type { ClueReading } from './signals';
import type { VossState } from './state';

// Clues and their re-approach (§3.1, Paolo's notes in #5). After each Turn
// every clue the Player has received is ignored, misread or understood.
// Ignored and misread clues come back from another side, at most
// `voss.maxReapproaches` times and never after their last window; an
// understood clue stays understood.

type Clue = VossStory['clues'][number];

/**
 * The Player's Letters of Turn N judge every clue received by batch N−1:
 * understood beats misread, and a received clue no Letter uses is ignored.
 * A misread's wrong lead is kept until the clue is understood.
 * Clues not yet received are left alone, whatever the reader says.
 */
export function judgeClues(s: VossState, readings: ClueReading[]): void {
  for (const [key, c] of Object.entries(s.clues)) {
    if (c.deliveredIn === null || c.status === 'understood') continue;
    const mine = readings.filter((r) => r.key === key);
    const understood = mine.find((r) => r.status === 'understood');
    const misread = mine.find((r) => r.status === 'misread');
    if (understood) {
      c.status = 'understood';
      c.wrongLead = null;
    } else if (misread) {
      c.status = 'misread';
      c.wrongLead = misread.wrongLead || null;
    } else {
      c.status = 'ignored';
    }
  }
}

/** The batch a clue first comes on its own: its first batch, or its first scheduled window (K10). */
export function firstAppearance(clue: Clue): number | null {
  if (clue.firstBatch !== null) return clue.firstBatch;
  return clue.reapproach.find((r) => r.batch !== null)?.batch ?? null;
}

/** Marks a clue received in `batch`, if it was not already. */
export function deliver(s: VossState, key: string, batch: number): void {
  const c = s.clues[key];
  if (!c || c.deliveredIn !== null) return;
  c.deliveredIn = batch;
  c.status = 'ignored';
}

/**
 * The clues due for the first time in batch N from `who`, who writes in it:
 * scheduled (or overdue) and from that Character.
 */
export function newCluesFor(story: VossStory, s: VossState, who: string, batch: number): Clue[] {
  return story.clues.filter((clue) => {
    const first = firstAppearance(clue);
    return (
      s.clues[clue.key]?.deliveredIn === null && clue.from.includes(who) && first !== null && first <= batch
    );
  });
}

export interface Reapproach {
  key: string;
  /** Who brings it back. */
  from: string;
  how: string;
  /** The last wrong lead the Player read into it, to take apart with a true reason; kept until it is understood. */
  wrongLead: string | null;
}

/**
 * The clues that come back in batch N: ignored or misread, under the cap,
 * with a window open after the batch it arrived in (so K10's first window,
 * which brought it, is not a re-approach) — the latest unused window at or
 * before N; earlier ones are passed. Never after the clue's last window, and
 * only through one of its sources who writes in batch N. Records the use.
 */
export function reapproaches(story: VossStory, s: VossState, batch: number, writing: Set<string>): Reapproach[] {
  const out: Reapproach[] = [];
  for (const clue of story.clues) {
    const c = s.clues[clue.key];
    if (!c || c.deliveredIn === null || c.deliveredIn >= batch) continue;
    if (c.status === 'understood' || c.status === 'unseen') continue;
    if (c.reapproaches >= story.voss.maxReapproaches) continue;
    const from = clue.from.find((f) => writing.has(f));
    if (!from) continue;
    const delivered = c.deliveredIn;
    const open = clue.reapproach
      .filter((r): r is { batch: number; how: string } => r.batch !== null)
      .filter((r) => r.batch > delivered && r.batch <= batch && !c.usedWindows.includes(r.batch));
    const chosen = open.at(-1);
    if (!chosen) continue;
    for (const r of open) c.usedWindows.push(r.batch);
    c.reapproaches += 1;
    out.push({ key: clue.key, from, how: chosen.how, wrongLead: c.wrongLead });
  }
  return out;
}
