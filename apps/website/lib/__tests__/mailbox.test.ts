import { describe, expect, it } from 'vitest';
import { buildMailbox, threadOf, type MailCorrespondent } from '@/lib/mailbox';
import type { InteractionRow } from '@/lib/types/db';

const cast: MailCorrespondent[] = [
  { slug: 'voss', name: 'Florian Voss', role: 'Agente di P.S.', kind: 'person' },
  { slug: 'anagrafe', name: 'Ufficio Anagrafe', role: 'Ufficio pubblico', kind: 'office' },
  { slug: 'adelaide', name: 'Adelaide Bellucci', role: 'Vicina', kind: 'person' },
  { slug: 'messaggero', name: 'Il Messaggero', role: 'Quotidiano', kind: 'newspaper' },
];

let n = 0;
function row(partial: Partial<InteractionRow> & { character_slug: string }): InteractionRow {
  n += 1;
  return {
    id: `l${n}`,
    game_id: 'g1',
    role: 'ai',
    content: 'testo',
    kind: 'letter',
    enclosures: [],
    letter_number: n,
    visible_from: null,
    story_date: '1987-09-05',
    turn_id: null,
    created_at: '2026-11-10T00:00:00Z',
    ...partial,
  };
}

const turnNumbers = { t1: 1, t2: 2 };

describe('the Tester mailbox', () => {
  it('lists a sender with the Turn and date of the last Letter received from them', () => {
    const letters = [
      row({ character_slug: 'voss', story_date: '1987-09-05' }),
      row({ character_slug: 'voss', role: 'user', turn_id: 't1', story_date: '1987-09-14' }),
      row({ character_slug: 'voss', turn_id: 't1', story_date: '1987-09-21' }),
      row({ character_slug: 'voss', role: 'user', turn_id: 't2', story_date: '1987-09-28' }),
    ];
    const { senders } = buildMailbox({ letters, turnNumbers, contacts: ['voss'], correspondents: cast });
    expect(senders).toHaveLength(1);
    expect(senders[0]).toMatchObject({
      slug: 'voss',
      name: 'Florian Voss',
      canWrite: true,
      lastReceived: { id: letters[2].id, turn: 1, storyDate: '1987-09-21' },
    });
  });

  it('gives the opening envelope Turn 0', () => {
    const letters = [row({ character_slug: 'voss' })];
    const { senders } = buildMailbox({ letters, turnNumbers, contacts: ['voss'], correspondents: cast });
    expect(senders[0].lastReceived?.turn).toBe(0);
  });

  it('orders senders by their latest Letter in either direction, then contacts never written to', () => {
    const letters = [
      row({ character_slug: 'voss' }),
      row({ character_slug: 'messaggero', kind: 'dispatch', turn_id: 't1' }),
      row({ character_slug: 'anagrafe', role: 'user', turn_id: 't2' }),
    ];
    const { senders } = buildMailbox({
      letters,
      turnNumbers,
      contacts: ['voss', 'adelaide', 'anagrafe'],
      correspondents: cast,
    });
    expect(senders.map((s) => s.slug)).toEqual(['anagrafe', 'messaggero', 'voss', 'adelaide']);
    expect(senders[0].lastReceived).toBeNull();
    // A newspaper sends clippings; the Player cannot write back.
    expect(senders[1].canWrite).toBe(false);
  });

  it('leaves out correspondents the Player has neither heard from nor may write to', () => {
    const { senders } = buildMailbox({
      letters: [row({ character_slug: 'voss' })],
      turnNumbers,
      contacts: ['voss'],
      correspondents: cast,
    });
    expect(senders.map((s) => s.slug)).toEqual(['voss']);
  });

  it('gives each person their own hand, in cast order, and offices and newspapers none', () => {
    const { senders } = buildMailbox({
      letters: [],
      turnNumbers,
      contacts: ['voss', 'anagrafe', 'adelaide'],
      correspondents: cast,
    });
    const hand = Object.fromEntries(senders.map((s) => [s.slug, s.hand]));
    expect(hand).toEqual({ voss: 0, anagrafe: null, adelaide: 1 });
  });

  it('keeps a timeline of every Letter, newest first, each with its Turn', () => {
    const letters = [
      row({ character_slug: 'voss' }),
      row({ character_slug: 'voss', role: 'user', turn_id: 't1' }),
      row({ character_slug: 'messaggero', kind: 'dispatch', turn_id: 't1' }),
    ];
    const { timeline } = buildMailbox({ letters, turnNumbers, contacts: ['voss'], correspondents: cast });
    expect(timeline.map((l) => [l.id, l.slug, l.mine, l.turn])).toEqual([
      [letters[2].id, 'messaggero', false, 1],
      [letters[1].id, 'voss', true, 1],
      [letters[0].id, 'voss', false, 0],
    ]);
  });
});

describe('a sender thread', () => {
  it('shows the last Letter received, with what came before folded away and what the Player wrote since', () => {
    const letters = [
      row({ character_slug: 'voss' }),
      row({ character_slug: 'voss', role: 'user', turn_id: 't1' }),
      row({ character_slug: 'voss', turn_id: 't1' }),
      row({ character_slug: 'voss', role: 'user', turn_id: 't2' }),
    ];
    const { senders } = buildMailbox({ letters, turnNumbers, contacts: ['voss'], correspondents: cast });
    const thread = threadOf(senders[0]);
    expect(thread.earlier.map((l) => l.id)).toEqual([letters[0].id, letters[1].id]);
    expect(thread.current?.id).toBe(letters[2].id);
    expect(thread.since.map((l) => l.id)).toEqual([letters[3].id]);
  });

  it('has no current Letter for an office that has not answered yet', () => {
    const letters = [row({ character_slug: 'anagrafe', role: 'user', turn_id: 't1' })];
    const { senders } = buildMailbox({ letters, turnNumbers, contacts: ['anagrafe'], correspondents: cast });
    const thread = threadOf(senders[0]);
    expect(thread.current).toBeNull();
    expect(thread.earlier).toEqual([]);
    expect(thread.since.map((l) => l.id)).toEqual([letters[0].id]);
  });
});
