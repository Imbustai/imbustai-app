import type { Enclosure, OutgoingKind } from '@imbustai/story-runtime';
import type { InteractionRow } from '@/lib/types/db';

// The Tester's mailbox: a Game's Letters arranged by sender, and as a timeline.
// Pure — the play page feeds it what the Player may see and renders the result.

export interface MailCorrespondent {
  slug: string;
  name: string;
  role: string;
  kind: 'person' | 'office' | 'newspaper';
}

export interface MailLetter {
  id: string;
  /** Written by the Player. */
  mine: boolean;
  /** The other party: who sent it, or who the Player wrote to. */
  slug: string;
  kind: OutgoingKind;
  storyDate: string | null;
  /** The Turn it belongs to; 0 is the opening envelope. */
  turn: number;
  body: string;
  enclosures: Enclosure[];
}

export interface MailSender extends MailCorrespondent {
  /** The Player may write to them now. */
  canWrite: boolean;
  /** Which handwriting a person's Letters are set in; null for offices and newspapers. */
  hand: number | null;
  lastReceived: { id: string; turn: number; storyDate: string | null } | null;
  /** Every Letter exchanged with them, oldest first. */
  letters: MailLetter[];
}

export interface Mailbox {
  /** Latest correspondence first, then contacts never written to. */
  senders: MailSender[];
  /** Every Letter, newest first. */
  timeline: MailLetter[];
}

export function buildMailbox(input: {
  /** Oldest first, as the Player may see them. */
  letters: InteractionRow[];
  /** interaction_turns.id → turn_number. */
  turnNumbers: Record<string, number>;
  /** Slugs the Player may write to now. */
  contacts: string[];
  correspondents: MailCorrespondent[];
}): Mailbox {
  const all: MailLetter[] = input.letters
    .filter((row) => row.character_slug)
    .map((row) => ({
      id: row.id,
      mine: row.role === 'user',
      slug: row.character_slug as string,
      kind: row.kind ?? 'letter',
      storyDate: row.story_date,
      turn: row.turn_id ? (input.turnNumbers[row.turn_id] ?? 0) : 0,
      body: row.content,
      enclosures: row.enclosures ?? [],
    }));

  const people = input.correspondents.filter((c) => c.kind === 'person');
  const contacts = new Set(input.contacts);
  const position = new Map(all.map((letter, index) => [letter.id, index]));

  const senders: MailSender[] = [];
  for (const c of input.correspondents) {
    const letters = all.filter((l) => l.slug === c.slug);
    if (letters.length === 0 && !contacts.has(c.slug)) continue;
    const received = letters.filter((l) => !l.mine).at(-1);
    senders.push({
      ...c,
      canWrite: contacts.has(c.slug),
      hand: c.kind === 'person' ? people.indexOf(c) : null,
      lastReceived: received
        ? { id: received.id, turn: received.turn, storyDate: received.storyDate }
        : null,
      letters,
    });
  }

  const latest = (s: MailSender) => {
    const last = s.letters.at(-1);
    return last ? (position.get(last.id) ?? -1) : -1;
  };
  // Array.prototype.sort is stable: senders without Letters keep cast order.
  senders.sort((a, b) => latest(b) - latest(a));

  return { senders, timeline: [...all].reverse() };
}

export interface Thread {
  /** Folded away above the current Letter. */
  earlier: MailLetter[];
  /** The last Letter received from this sender. */
  current: MailLetter | null;
  /** What the Player wrote after it. */
  since: MailLetter[];
}

export function threadOf(sender: MailSender): Thread {
  const at = sender.letters.findLastIndex((l) => !l.mine);
  if (at === -1) return { earlier: [], current: null, since: sender.letters };
  return {
    earlier: sender.letters.slice(0, at),
    current: sender.letters[at],
    since: sender.letters.slice(at + 1),
  };
}
