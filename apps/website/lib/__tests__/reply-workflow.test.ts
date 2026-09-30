import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { AiProvider, DraftBatch, Engine, Ending, Finding, GameView } from '@imbustai/story-runtime';
import { FakeSupabase } from './fake-supabase';

// The reply workflow end to end against a fake Engine and an in-memory
// database: Enclosures from draft to the Player's inbox, and the closing
// batch from resolveEnding to a completed Game.

const hoisted = vi.hoisted(() => ({
  db: null as unknown as FakeSupabase,
  engine: null as unknown,
  provider: null as unknown as AiProvider,
}));

vi.mock('../supabase/admin', () => ({ createAdminClient: () => hoisted.db }));
vi.mock('../engines', () => ({
  engineEntryFor: () => ({ engine: hoisted.engine, loadStory: async () => ({}) }),
}));
// Every vendor is the same in-memory provider: 1,000 tokens in, 100 out per call.
vi.mock('@imbustai/story-runtime', async (original) => ({
  ...(await original<typeof import('@imbustai/story-runtime')>()),
  createProviders: () => () => hoisted.provider,
}));

const { approveDraft, generateDraft, saveDraftEdits, submitPlayerTurn } = await import('../reply-workflow');

interface State {
  turns: number;
}

/** A fake Engine: Voss replies with a certificate enclosed; the Game ends after `endAfter` Turns. */
function fakeEngine(opts: { endAfter?: number; epilogueFindings?: Finding[]; useAi?: boolean } = {}) {
  const seen = {
    applied: [] as GameView<unknown, State>[],
    epilogues: [] as Ending[],
  };
  const engine: Engine<unknown, State> = {
    id: 'engine-fake',
    schema: { data: z.unknown(), state: z.object({ turns: z.number() }) },
    maxLettersPerTurn: 3,
    async startGame() {
      return { state: { turns: 0 }, opening: [] };
    },
    cast: () => ({
      lead: { slug: 'lombardo', name: 'Giacomo Lombardo', kind: 'person' },
      correspondents: [
        { slug: 'voss', name: 'Florian Voss', kind: 'person' },
        { slug: 'tribunale', name: 'Tribunale di Roma', kind: 'office' },
      ],
    }),
    contacts: () => ['voss'],
    validateSubmission: () => [],
    async generateTurn(ctx, view) {
      if (opts.useAi) {
        await ctx.ai.text('writer', { purpose: 'reply:voss', character: 'voss', system: 's', user: 'u' });
        await ctx.ai.text('analyst', { purpose: 'check:voss', character: 'voss', system: 's', user: 'u' });
        await ctx.ai.text('analyst', { purpose: 'check:tribunale', character: 'tribunale', system: 's', user: 'u' });
      }
      return {
        letters: [
          {
            key: 'voss',
            kind: 'letter',
            from: 'voss',
            storyDate: '1987-12-10',
            body: `Commissario, risposta al turno ${view.turn}.`,
            enclosures: [
              { key: 'cert', kind: 'document', title: 'Certificato di stato di famiglia', body: 'Ferrante Aldo' },
            ],
          },
        ],
        submissionDate: '1987-12-03',
        effects: { turn: view.turn },
        adminNotes: [],
      };
    },
    async validateDraft(_ctx, _view, draft) {
      return draft.letters.some((l) => l.kind === 'epilogue') ? (opts.epilogueFindings ?? []) : [];
    },
    async applyTurn(ctx, view) {
      if (opts.useAi) await ctx.ai.text('analyst', { purpose: 'ledger', system: 's', user: 'u' });
      seen.applied.push(view);
      return { turns: view.state.turns + 1 };
    },
    resolveEnding(view) {
      return opts.endAfter !== undefined && view.state.turns >= opts.endAfter
        ? { key: 'saved_caught', detail: { score: 7 } }
        : null;
    },
    async generateEpilogue(_ctx, _view, ending) {
      seen.epilogues.push(ending);
      return {
        letters: [
          {
            key: 'sentenza',
            kind: 'epilogue',
            from: 'tribunale',
            storyDate: '1988-03-01',
            body: 'Il Tribunale di Roma, visti gli atti…',
            enclosures: [{ key: 'dispositivo', kind: 'document', title: 'Dispositivo', body: 'Condanna.' }],
          },
        ],
        effects: {},
        adminNotes: [],
      } satisfies DraftBatch;
    },
  };
  return { engine, seen };
}

const PRICES = [
  // provider, model, input, output, cache read, cache write — USD per 1M tokens
  ['anthropic', 'claude-fable-5-1', 10, 50, 0.25, 12.5],
  ['anthropic', 'claude-opus-5-5', 4, 20, 0.2, 5],
  ['anthropic', 'claude-sonnet-5-5', 2, 10, 0.2, 2.5],
  ['openai', 'gpt-6-sol', 2, 10, 0.2, 2.5],
] as const;

function seed(lifecycle: 'testing' | 'released', game: Record<string, unknown> = {}) {
  hoisted.db = new FakeSupabase();
  hoisted.provider = {
    id: 'mock',
    generateStructured: async () => {
      throw new Error('unused');
    },
    generateText: async (request) => ({
      output: 'ok',
      usage: {
        provider: 'mock',
        model: request.model,
        input_tokens: 1000,
        output_tokens: 100,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      },
    }),
  };
  for (const [provider, model, input, output, read, write] of PRICES) {
    hoisted.db.table('ai_model_pricing').push({
      provider,
      model,
      input_usd_per_mtok: input,
      output_usd_per_mtok: output,
      cache_read_usd_per_mtok: read,
      cache_write_usd_per_mtok: write,
    });
  }
  hoisted.db.table('stories').push({ id: 'story', engine: 'engine-fake', lifecycle, time_config: {}, model_profile: null });
  hoisted.db.table('games').push({
    id: 'game',
    story_id: 'story',
    status: 'in_progress',
    runtime_state: { turns: 0 },
    model_profile: null,
    completed_at: null,
    ...game,
  });
}

const rows = (table: string) => hoisted.db.table(table) as Record<string, unknown>[];
const letterTo = (to: string) => [{ recipient_slug: to, content: 'Caro Voss, mi scriva.' }];

async function playTestingTurn() {
  const { turnId } = await submitPlayerTurn('game', letterTo('voss'));
  const draft = await generateDraft(turnId);
  await approveDraft(turnId, draft.id);
  return turnId;
}

describe('Enclosures', () => {
  beforeEach(() => seed('testing'));

  it('reach the Player with their Letter, and the Engine sees them in history', async () => {
    const { engine, seen } = fakeEngine();
    hoisted.engine = engine;

    await playTestingTurn();
    await submitPlayerTurn('game', letterTo('voss'));

    const reply = rows('interactions').find((r) => r.role === 'ai');
    expect(reply).toMatchObject({
      kind: 'letter',
      enclosures: [
        { key: 'cert', kind: 'document', title: 'Certificato di stato di famiglia', body: 'Ferrante Aldo' },
      ],
    });

    const turn2 = rows('interaction_turns').find((t) => t.turn_number === 2)!;
    await generateDraft(turn2.id as string);
    const approved = rows('ai_drafts').at(-1)!;
    await approveDraft(turn2.id as string, approved.id as string);
    const history = seen.applied[1].history.filter((l) => l.direction === 'in');
    expect(history[0]).toMatchObject({
      kind: 'letter',
      enclosures: [{ key: 'cert', title: 'Certificato di stato di famiglia' }],
    });
  });

  it('can be rewritten by the admin before approval, but not invented', async () => {
    hoisted.engine = fakeEngine().engine;
    const { turnId } = await submitPlayerTurn('game', letterTo('voss'));
    const draft = await generateDraft(turnId);

    const edited = await saveDraftEdits(draft.id, {
      letters: [
        {
          key: 'voss',
          body: 'Commissario, le allego il certificato.',
          enclosures: [{ key: 'cert', title: 'Stato di famiglia', body: 'Ferrante Aldo, vedovo' }],
        },
      ],
    });
    await expect(
      saveDraftEdits(edited.id, {
        letters: [{ key: 'voss', body: 'x', enclosures: [{ key: 'foto', body: 'Una foto segnaletica' }] }],
      }),
    ).rejects.toMatchObject({ code: 'unknown_enclosure', status: 400 });

    await approveDraft(turnId, edited.id);
    expect(rows('interactions').find((r) => r.role === 'ai')!.enclosures).toEqual([
      { key: 'cert', kind: 'document', title: 'Stato di famiglia', body: 'Ferrante Aldo, vedovo' },
    ]);
  });
});

describe('The closing batch', () => {
  it('in a testing Story, waits for the admin, then completes the Game once sent', async () => {
    seed('testing');
    const { engine, seen } = fakeEngine({ endAfter: 1 });
    hoisted.engine = engine;

    await playTestingTurn();

    const closing = rows('interaction_turns').find((t) => t.turn_number === 2)!;
    expect(closing).toMatchObject({ status: 'pending_ai', ending: { key: 'saved_caught', detail: { score: 7 } } });
    expect(rows('games')[0].status).toBe('in_progress');
    await expect(submitPlayerTurn('game', letterTo('voss'))).rejects.toMatchObject({ code: 'turn_already_open' });

    const draft = await generateDraft(closing.id as string);
    expect(seen.epilogues).toEqual([{ key: 'saved_caught', detail: { score: 7 } }]);
    expect(draft.responses.map((l) => l.kind)).toEqual(['epilogue']);
    await expect(
      generateDraft(closing.id as string, { letterKey: 'sentenza', adminGuidance: 'Più breve' }),
    ).rejects.toMatchObject({ code: 'closing_batch_regenerates_whole', status: 409 });

    await approveDraft(closing.id as string, draft.id);

    expect(seen.applied).toHaveLength(1);
    expect(rows('interactions').filter((r) => r.kind === 'epilogue')).toMatchObject([
      {
        role: 'ai',
        character_slug: 'tribunale',
        enclosures: [{ key: 'dispositivo', title: 'Dispositivo' }],
      },
    ]);
    expect(rows('interaction_turns').find((t) => t.id === closing.id)!.status).toBe('sent');
    expect(rows('games')[0]).toMatchObject({ status: 'completed', completed_at: expect.any(String) });
    await expect(submitPlayerTurn('game', letterTo('voss'))).rejects.toMatchObject({ code: 'game_not_in_progress' });
  });

  it('never opens while the Engine finds no Ending', async () => {
    seed('testing');
    hoisted.engine = fakeEngine().engine;
    await playTestingTurn();
    expect(rows('interaction_turns')).toHaveLength(1);
    expect(rows('games')[0].status).toBe('in_progress');
  });
});

describe('The closing batch in a released Story', () => {
  it('is generated and sent with the last Turn, completing the Game', async () => {
    seed('released');
    hoisted.engine = fakeEngine({ endAfter: 1 }).engine;

    const result = await submitPlayerTurn('game', letterTo('voss'));

    expect(result).toMatchObject({ autoSent: true, heldForReview: false });
    expect(rows('interactions').map((r) => [r.role, r.kind ?? 'letter'])).toEqual([
      ['user', 'letter'],
      ['ai', 'letter'],
      ['ai', 'epilogue'],
    ]);
    expect(rows('games')[0].status).toBe('completed');
  });

  it('is held for the admin when the Engine finds an error in it', async () => {
    seed('released');
    hoisted.engine = fakeEngine({
      endAfter: 1,
      epilogueFindings: [{ rule: 'verdict_mismatch', severity: 'error', message: 'Wrong verdict.' }],
    }).engine;

    const result = await submitPlayerTurn('game', letterTo('voss'));

    expect(result).toMatchObject({ autoSent: true });
    const closing = rows('interaction_turns').find((t) => t.turn_number === 2)!;
    expect(closing.status).toBe('draft_ready');
    expect(rows('interactions').some((r) => r.kind === 'epilogue')).toBe(false);
    expect(rows('games')[0].status).toBe('in_progress');
  });

  it('holds a closing batch that carries an ordinary Letter', async () => {
    seed('released');
    const { engine } = fakeEngine({ endAfter: 1 });
    engine.generateEpilogue = async () => ({
      letters: [{ key: 'voss', kind: 'letter', from: 'voss', storyDate: '1988-03-01', body: 'Mi scriva ancora.', enclosures: [] }],
      effects: {},
      adminNotes: [],
    });
    hoisted.engine = engine;

    await submitPlayerTurn('game', letterTo('voss'));

    const draft = rows('ai_drafts').at(-1)!;
    expect((draft.validation_warnings as Finding[]).map((f) => f.rule)).toEqual(['closing_letter_kind']);
    expect(rows('games')[0].status).toBe('in_progress');
  });
});

describe('Model profiles and metering', () => {
  const vossProfile = {
    roles: {
      writer: { model: 'claude-fable-5-1', effort: 'medium' },
      clerk: { model: 'claude-sonnet-5-5', effort: 'low' },
      analyst: { model: 'claude-sonnet-5-5', effort: 'medium' },
      player: { model: 'claude-sonnet-5-5' },
    },
    characters: { voss: { analyst: { model: 'claude-opus-5-5', effort: 'high' } } },
  };

  it("runs every Hook on the Game's profile and records each attempt with its Hook and cost", async () => {
    seed('testing', { model_profile: vossProfile });
    hoisted.engine = fakeEngine({ useAi: true }).engine;

    const turnId = await playTestingTurn();

    const draft = rows('ai_drafts')[0];
    const calls = rows('ai_calls');
    expect(calls.map((c) => [c.hook, c.role, c.purpose, c.model, c.effort])).toEqual([
      ['generateTurn', 'writer', 'reply:voss', 'claude-fable-5-1', 'medium'],
      ['generateTurn', 'analyst', 'check:voss', 'claude-opus-5-5', 'high'],
      ['generateTurn', 'analyst', 'check:tribunale', 'claude-sonnet-5-5', 'medium'],
      ['applyTurn', 'analyst', 'ledger', 'claude-sonnet-5-5', 'medium'],
    ]);
    expect(calls.every((c) => c.game_id === 'game' && c.turn_id === turnId && c.draft_id === draft.id)).toBe(true);
    // Fable: 1,000 × $10 + 100 × $50 per 1M tokens = $0.015.
    expect(calls[0].cost_usd).toBeCloseTo(0.015, 9);
    expect(draft.cost_usd).toBeCloseTo(0.015 + 0.006 + 0.003, 9);
    expect(draft.model).toBe('claude-fable-5-1');
  });

  it('resolves a Game started before profiles from its Story default', async () => {
    seed('testing');
    rows('stories')[0].model_profile = { roles: { writer: { model: 'gpt-6-sol' } } };
    hoisted.engine = fakeEngine({ useAi: true }).engine;

    const { turnId } = await submitPlayerTurn('game', letterTo('voss'));
    await generateDraft(turnId);

    expect(rows('ai_calls')[0]).toMatchObject({ role: 'writer', model: 'gpt-6-sol' });
  });

  it('fails before any call when the profile names an unpriced model', async () => {
    seed('testing', {
      model_profile: { ...vossProfile, roles: { ...vossProfile.roles, writer: { model: 'claude-opus-4-8' } } },
    });
    hoisted.engine = fakeEngine({ useAi: true }).engine;

    const { turnId } = await submitPlayerTurn('game', letterTo('voss'));
    await expect(generateDraft(turnId)).rejects.toThrow(/claude-opus-4-8/);
    expect(rows('ai_calls')).toEqual([]);
  });
});
