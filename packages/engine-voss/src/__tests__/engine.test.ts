import { describe, expect, it } from 'vitest';
import type { AiAccess, GameView } from '@imbustai/story-runtime';
import { createHookContext } from '@imbustai/story-runtime';
import { buildVossStory } from '../../seed/story';
import { vossEngine, type VossState } from '../engine';
import type { VossStory } from '../schema';

const story = vossEngine.schema.data.parse(buildVossStory());

const noAi = {
  structured: () => Promise.reject(new Error('no AI in this test')),
  text: () => Promise.reject(new Error('no AI in this test')),
} as AiAccess;
const ctx = createHookContext({ ai: noAi, gameId: 'g1', turn: 0, locale: 'it-IT' });

describe('engine-voss', () => {
  it('is registered as engine-voss and lets the Player send three Letters a Turn', () => {
    expect(vossEngine.id).toBe('engine-voss');
    expect(vossEngine.maxLettersPerTurn).toBe(3);
  });

  it('casts Lombardo as the Lead, and Voss, Adelaide and every office as correspondents', () => {
    const cast = vossEngine.cast(story);
    expect(cast.lead).toEqual({
      slug: 'lombardo',
      name: 'Giacomo Lombardo',
      role: 'Commissario di P.S., Lipari',
      address: 'Commissariato di P.S., 98055 Lipari (ME)',
      kind: 'person',
    });
    const bySlug = Object.fromEntries(cast.correspondents.map((c) => [c.slug, c.kind]));
    expect(bySlug).toMatchObject({
      voss: 'person',
      adelaide: 'person',
      armando: 'person',
      anagrafe: 'office',
      stato_civile: 'office',
      cancelleria: 'office',
      procura: 'office',
      mobile: 'office',
      scientifica: 'office',
      regina_coeli: 'office',
      ferrovie: 'office',
      garbatella: 'office',
      messaggero: 'newspaper',
      paese_sera: 'newspaper',
    });
  });

  it('opens with Voss\'s letter of Saturday 5 September 1987, delivered as authored', async () => {
    const { state, opening } = await vossEngine.startGame(ctx, { gameId: 'g1', story, realStartDate: '2026-09-30' });
    expect(opening).toHaveLength(1);
    expect(opening[0]).toMatchObject({ kind: 'letter', from: 'voss', storyDate: '1987-09-05', enclosures: [] });
    expect(opening[0].body.startsWith('Roma, sabato 5 settembre 1987')).toBe(true);
    expect(opening[0].body.trimEnd().endsWith('lì la posta la apre il piantone, e il piantone è Cerroni.')).toBe(true);
    expect(vossEngine.schema.state.parse(state)).toEqual(state);
  });

  it('lets the Player write, at the start, to Voss and to every office, not to Adelaide', () => {
    const view: GameView<VossStory, VossState> = {
      gameId: 'g1',
      story,
      state: vossEngine.schema.state.parse({}),
      turn: 1,
      history: [],
      submission: [],
    };
    const contacts = vossEngine.contacts(view);
    expect(contacts).toContain('voss');
    expect(contacts).toContain('procura');
    expect(contacts).toContain('garbatella');
    expect(contacts).not.toContain('adelaide');
    expect(contacts).not.toContain('messaggero');
  });
});
