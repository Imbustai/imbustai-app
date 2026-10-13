import { addDays } from '@imbustai/story-runtime';
import type { VossStory } from '../schema';

// The Turn calendar (§1): the Engine dates every Letter. Turn N's Letters
// bear D_N, reach Rome a week later, and are answered in batch N, which the
// Player reads when he writes Turn N+1.

export type TurnRow = VossStory['calendar']['turns'][number];

export function turnRow(story: VossStory, turn: number): TurnRow {
  const row = story.calendar.turns.find((t) => t.turn === turn);
  if (!row) throw new Error(`engine-voss: no Turn ${turn} in the calendar`);
  return row;
}

/**
 * The first batch the Player reads on or after `date`: where a Letter that
 * reaches the island that day, or a newspaper of that day, goes. Null when no
 * batch is read after it (batch 8 is never "read" before the Game ends), so
 * the Letter is dropped.
 */
export function batchReadOnOrAfter(story: VossStory, date: string): number | null {
  for (const row of story.calendar.turns) {
    if (row.readDate !== null && row.readDate >= date) return row.turn;
  }
  return null;
}

/**
 * The date a Character who answers at once puts on a reply to Turn N:
 * D_N + min…max days. `roll` is the hook context's seeded random, in [0, 1).
 */
export function promptReplyDate(story: VossStory, turn: number, roll: number): string {
  const { minDays, maxDays } = story.calendar.prompt;
  const days = minDays + Math.min(maxDays - minDays, Math.floor(roll * (maxDays - minDays + 1)));
  return addDays(turnRow(story, turn).playerDate, days);
}

/**
 * When an office answers a Letter of Turn N, and in which batch the answer
 * reaches the Player. Office time 0 (a request forwarded «per competenza»)
 * answers in the same batch. Otherwise the answer leaves Rome after the
 * office's weeks and enters the first batch read after it reaches the island
 * (2 weeks → N+1, 3–4 weeks → N+2); null batch = it falls after the Game.
 */
export function officeAnswer(
  story: VossStory,
  turn: number,
  replyWeeks: number,
): { date: string; batch: number | null } {
  const row = turnRow(story, turn);
  if (replyWeeks === 0) return { date: addDays(row.arrivesRome, 1), batch: turn };
  const date = addDays(row.arrivesRome, 7 * replyWeeks);
  const batch = batchReadOnOrAfter(story, addDays(date, story.calendar.mailDays));
  return { date, batch: batch !== null && batch >= turn ? batch : null };
}

/** The fixed events that happen before Voss reads the Letters of Turn N. */
export function eventsBefore(story: VossStory, turn: number): Set<string> {
  const arrives = turnRow(story, turn).arrivesRome;
  return new Set(story.calendar.events.filter((e) => e.date < arrives).map((e) => e.key));
}

/** The fixed events between the Letters of Turn N−1 and those of Turn N reaching Rome. */
export function eventsNewIn(story: VossStory, turn: number): Set<string> {
  const now = eventsBefore(story, turn);
  if (turn === 1) return now;
  const before = eventsBefore(story, turn - 1);
  return new Set([...now].filter((k) => !before.has(k)));
}
