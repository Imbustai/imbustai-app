import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { Engine, OutgoingLetter } from '@imbustai/story-runtime';
import { openingRows, playerStatus, type GameHost } from '../game-host';
import type { InteractionTurnRow } from '../types/db';

describe('the opening envelope', () => {
  it('is stored with each Letter\'s kind and Enclosures, numbered in order', () => {
    const opening: OutgoingLetter[] = [
      {
        key: 'opening:voss',
        kind: 'letter',
        from: 'voss',
        storyDate: '1987-09-05',
        body: 'Caro commissario',
        enclosures: [{ key: 'transfer_order', kind: 'document', title: 'Decreto', body: 'MINISTERO' }],
      },
      { key: 'clip', kind: 'dispatch', from: 'messaggero', storyDate: '1987-09-06', body: 'Titolo', enclosures: [] },
    ];
    expect(openingRows('g1', opening)).toEqual([
      {
        game_id: 'g1',
        role: 'ai',
        content: 'Caro commissario',
        kind: 'letter',
        enclosures: [{ key: 'transfer_order', kind: 'document', title: 'Decreto', body: 'MINISTERO' }],
        letter_number: 1,
        character_slug: 'voss',
        story_date: '1987-09-05',
      },
      {
        game_id: 'g1',
        role: 'ai',
        content: 'Titolo',
        kind: 'dispatch',
        enclosures: [],
        letter_number: 2,
        character_slug: 'messaggero',
        story_date: '1987-09-06',
      },
    ]);
  });
});

describe('what the Player UI is told', () => {
  const engine: Engine<unknown, unknown> = {
    id: 'engine-fake',
    schema: { data: z.unknown(), state: z.unknown() },
    maxLettersPerTurn: 3,
    cast: () => ({
      lead: { slug: 'lombardo', name: 'Giacomo Lombardo', kind: 'person' },
      correspondents: [
        { slug: 'voss', name: 'Florian Voss', role: 'Agente', kind: 'person' },
        { slug: 'messaggero', name: 'Il Messaggero', kind: 'newspaper' },
      ],
    }),
    contacts: () => ['voss'],
  } as unknown as Engine<unknown, unknown>;

  const turn = (id: string, turn_number: number, status: string) =>
    ({ id, turn_number, status }) as InteractionTurnRow;

  const host = (rulesCard: string | null) =>
    ({
      engine,
      rulesCard,
      story: {},
      state: {},
      game: { id: 'g1' },
      interactions: [],
      turns: [turn('t1', 1, 'sent'), turn('t2', 2, 'awaiting_ai')],
    }) as unknown as GameHost;

  it('names every sender with its kind, so each can be given its own look', () => {
    expect(playerStatus(host(null)).correspondents).toEqual([
      { slug: 'voss', name: 'Florian Voss', role: 'Agente', kind: 'person' },
      { slug: 'messaggero', name: 'Il Messaggero', role: '', kind: 'newspaper' },
    ]);
  });

  it('numbers the Game\'s Turns, open one included', () => {
    expect(playerStatus(host(null)).turnNumbers).toEqual({ t1: 1, t2: 2 });
  });

  it('carries the Story\'s rules card when its Engine has one', () => {
    expect(playerStatus(host('**Prima di cominciare**')).rulesCard).toBe('**Prima di cominciare**');
    expect(playerStatus(host(null)).rulesCard).toBeNull();
  });
});
