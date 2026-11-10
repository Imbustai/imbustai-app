import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { AiProvider, CallUsage, DraftBatch, Engine } from '@imbustai/story-runtime';
import { FakeSupabase } from './fake-supabase';

// Runs end to end against a fake Engine, an in-memory database and a metered
// in-memory provider: from the preflight estimate to the stored report.

const hoisted = vi.hoisted(() => ({
  db: null as unknown as FakeSupabase,
  engine: null as unknown,
  provider: null as unknown as AiProvider,
}));

vi.mock('../supabase/admin', () => ({ createAdminClient: () => hoisted.db }));
vi.mock('../engines', () => ({
  engineEntryFor: () => ({ engine: hoisted.engine, loadStory: async () => ({}) }),
}));
vi.mock('@imbustai/story-runtime', async (original) => ({
  ...(await original<typeof import('@imbustai/story-runtime')>()),
  createProviders: () => () => hoisted.provider,
}));

const { RunPreflightError, playRunToEnd, startRun } = await import('../runs');

interface State {
  turns: number;
}

/** Voss answers every Turn with one writer call and one analyst call; the Game ends after `endAfter` Turns. */
function fakeEngine(opts: { endAfter?: number; writerMaxTokens?: number } = {}): Engine<unknown, State> {
  return {
    id: 'engine-fake',
    schema: { data: z.unknown(), state: z.object({ turns: z.number() }) },
    maxLettersPerTurn: 3,
    async startGame() {
      return {
        state: { turns: 0 },
        opening: [
          { key: 'opening', kind: 'letter', from: 'voss', storyDate: '1987-11-02', body: 'Commissario, le scrivo da Roma.', enclosures: [] },
        ],
      };
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
      await ctx.ai.text('writer', { purpose: 'reply:voss', character: 'voss', system: 's', user: 'u', maxTokens: opts.writerMaxTokens ?? 4000 });
      await ctx.ai.text('analyst', { purpose: 'check:voss', character: 'voss', system: 's', user: 'u', maxTokens: 2000 });
      return {
        letters: [
          { key: 'voss', kind: 'letter', from: 'voss', storyDate: '1987-12-10', body: `Risposta al turno ${view.turn}.`, enclosures: [] },
        ],
        submissionDate: '1987-12-03',
        effects: {},
        adminNotes: [],
      };
    },
    async validateDraft() {
      return [];
    },
    async applyTurn(_ctx, view) {
      return { turns: view.state.turns + 1 };
    },
    resolveEnding(view) {
      return opts.endAfter !== undefined && view.state.turns >= opts.endAfter
        ? { key: 'saved_caught', detail: {} }
        : null;
    },
    async generateEpilogue() {
      return {
        letters: [
          { key: 'sentenza', kind: 'epilogue', from: 'tribunale', storyDate: '1988-03-01', body: 'Il Tribunale di Roma…', enclosures: [] },
        ],
        effects: {},
        adminNotes: [],
      } satisfies DraftBatch;
    },
  };
}

const PRICES = [
  ['anthropic', 'claude-fable-5-1', 10, 50, 0.25, 12.5],
  ['anthropic', 'claude-sonnet-5-5', 2, 10, 0.2, 2.5],
] as const;

/** Every call bills 1,000 tokens in and 100 out: $0.003 on Sonnet 5.5, $0.015 on Fable 5.1. */
const usageOf = (model: string): CallUsage => ({
  provider: 'mock',
  model,
  input_tokens: 1000,
  output_tokens: 100,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
});

const SCORES = ['vague', 'echo', 'scripted', 'contacts', 'bond'].map((complaint) => ({
  complaint,
  score: 4,
  evidence: 'Turn 1.',
}));

function seed(story: Record<string, unknown> = {}) {
  hoisted.db = new FakeSupabase();
  hoisted.provider = {
    id: 'mock',
    generateStructured: async (request) => ({
      output:
        request.format.name === 'run_judge'
          ? { scores: SCORES }
          : { letters: [{ to: 'voss', body: 'Caro Voss, chi era il testimone?' }] },
      usage: usageOf(request.model),
    }),
    generateText: async (request) => ({ output: 'ok', usage: usageOf(request.model), transcript: [] }),
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
  hoisted.db.table('stories').push({
    id: 'story',
    engine: 'engine-fake',
    lifecycle: 'released',
    currency: 'EUR',
    settings: { max_turns: 8, max_letters_per_turn: 3 },
    // A Player would wait for the post; a Run does not.
    time_config: { visible_delay: { enabled: true, min_minutes: 5, max_minutes: 10 } },
    model_profile: null,
    ...story,
  });
}

const rows = (table: string) => hoisted.db.table(table) as Record<string, unknown>[];
const spent = () => rows('ai_calls').reduce((sum, c) => sum + Number(c.cost_usd), 0);
const SONNET = { model: 'claude-sonnet-5-5' };
const ALL_SONNET = { roles: { writer: SONNET, clerk: SONNET, analyst: SONNET, player: SONNET } };

describe('starting a Run', () => {
  beforeEach(() => seed());

  it('opens a flagged Game on a free order of the admin, with the opening envelope and the Run\'s models', async () => {
    hoisted.engine = fakeEngine();
    const { gameId, estimate } = await startRun(hoisted.db as never, {
      storyId: 'story',
      userId: 'admin',
      persona: 'methodical',
      maxTurns: 2,
      modelProfile: ALL_SONNET,
    });

    expect(rows('orders')[0]).toMatchObject({ user_id: 'admin', status: 'paid', source: 'admin', amount_cents: 0 });
    expect(rows('games')[0]).toMatchObject({ id: gameId, user_id: 'admin', status: 'in_progress' });
    expect((rows('games')[0].model_profile as typeof ALL_SONNET).roles.writer).toEqual(SONNET);
    expect(rows('interactions')).toHaveLength(1);
    expect(rows('runs')[0]).toMatchObject({
      game_id: gameId,
      persona: 'methodical',
      cap_usd: 12,
      max_turns: 2,
      status: 'running',
    });
    expect(rows('runs')[0].estimate_usd).toBeCloseTo(estimate.totalUsd, 6);
    expect(spent()).toBe(0);
  });

  it('refuses a Run whose estimate does not fit under the cap, before anything is created', async () => {
    hoisted.engine = fakeEngine();
    await expect(
      startRun(hoisted.db as never, { storyId: 'story', userId: 'admin', persona: 'warm', capUsd: 1 }),
    ).rejects.toBeInstanceOf(RunPreflightError);
    expect(rows('orders')).toHaveLength(0);
    expect(rows('games')).toHaveLength(0);
    expect(rows('runs')).toHaveLength(0);
  });

  it('refuses a Run on a model without a price', async () => {
    hoisted.engine = fakeEngine();
    await expect(
      startRun(hoisted.db as never, {
        storyId: 'story',
        userId: 'admin',
        persona: 'warm',
        modelProfile: { roles: { player: { model: 'claude-haiku-5-5' } } },
      }),
    ).rejects.toThrow('claude-haiku-5-5');
    expect(rows('games')).toHaveLength(0);
  });
});

describe('playing a Run', () => {
  beforeEach(() => seed());

  it('plays to the Ending with every batch approved automatically and visible at once', async () => {
    hoisted.engine = fakeEngine({ endAfter: 2 });
    const { gameId } = await startRun(hoisted.db as never, {
      storyId: 'story',
      userId: 'admin',
      persona: 'methodical',
      modelProfile: ALL_SONNET,
    });
    const run = await playRunToEnd(gameId);

    expect(run).toMatchObject({ status: 'completed', outcome: 'ending' });
    expect(run.report).toMatchObject({
      outcome: 'ending',
      ending: { key: 'saved_caught' },
      turns_played: 2,
      draft_errors: 0,
    });
    expect(rows('games')[0]).toMatchObject({ status: 'completed' });
    expect(rows('interaction_turns').map((t) => t.status)).toEqual(['sent', 'sent', 'sent']);
    // Opening, two Turns of one Letter each way, the Epilogue.
    expect(rows('interactions').map((i) => [i.role, i.kind ?? 'letter'])).toEqual([
      ['ai', 'letter'],
      ['user', 'letter'],
      ['ai', 'letter'],
      ['user', 'letter'],
      ['ai', 'letter'],
      ['ai', 'epilogue'],
    ]);
    expect(rows('interactions').filter((i) => i.role === 'ai' && i.visible_from).length).toBe(0);
  });

  it('reports a score per complaint and the metered spend, the player\'s and the judge\'s calls included', async () => {
    hoisted.engine = fakeEngine({ endAfter: 2 });
    const { gameId } = await startRun(hoisted.db as never, {
      storyId: 'story',
      userId: 'admin',
      persona: 'impulsive',
      modelProfile: ALL_SONNET,
    });
    const run = await playRunToEnd(gameId);

    expect(run.report?.scores?.map((s) => s.complaint)).toEqual(['vague', 'echo', 'scripted', 'contacts', 'bond']);
    // 2 player + 2 writer + 2 analyst + 1 judge calls at $0.003 each.
    expect(rows('ai_calls')).toHaveLength(7);
    expect(run.report?.spent_usd).toBeCloseTo(0.021, 6);
    expect(run.report?.spent_usd).toBeCloseTo(spent(), 9);
    expect(run.report?.spend.find((l) => l.role === 'player')).toMatchObject({ calls: 2, model: SONNET.model });
    expect(rows('ai_calls').filter((c) => c.hook === 'run').map((c) => c.purpose)).toEqual([
      'run:player',
      'run:player',
      'run:judge',
    ]);
  });

  it('stops at the Turn limit when the Engine resolves no Ending', async () => {
    hoisted.engine = fakeEngine();
    const { gameId } = await startRun(hoisted.db as never, {
      storyId: 'story',
      userId: 'admin',
      persona: 'warm',
      maxTurns: 2,
      modelProfile: ALL_SONNET,
    });
    const run = await playRunToEnd(gameId);
    expect(run).toMatchObject({ status: 'completed', outcome: 'turn_limit' });
    expect(run.report).toMatchObject({ turns_played: 2, ending: null });
    expect(rows('games')[0]).toMatchObject({ status: 'in_progress' });
  });

  it('fails at the cap before passing it, and leaves the refused Turn unsent', async () => {
    hoisted.engine = fakeEngine();
    const { gameId } = await startRun(hoisted.db as never, {
      storyId: 'story',
      userId: 'admin',
      persona: 'methodical',
      maxTurns: 8,
      modelProfile: ALL_SONNET,
    });
    // Lowered after the preflight: the player's call (≤ $0.09 reserved) fits once, a second Turn's does not.
    rows('runs')[0].cap_usd = 0.1;
    const run = await playRunToEnd(gameId);

    expect(run).toMatchObject({ status: 'failed', outcome: 'cap' });
    expect(run.report?.error).toContain('cost cap');
    expect(run.report?.scores).toBeNull();
    expect(spent()).toBeGreaterThan(0);
    expect(spent()).toBeLessThanOrEqual(0.1);
    expect(run.report?.spent_usd).toBeCloseTo(spent(), 9);
    expect(rows('interaction_turns').some((t) => t.status !== 'sent')).toBe(false);
    expect(rows('games')[0]).toMatchObject({ status: 'in_progress' });
  });

  it('holds a batch whose generation the cap refused: no reply is sent', async () => {
    hoisted.engine = fakeEngine({ writerMaxTokens: 20_000 });
    const { gameId } = await startRun(hoisted.db as never, {
      storyId: 'story',
      userId: 'admin',
      persona: 'methodical',
      modelProfile: ALL_SONNET,
    });
    // The player's call fits (under $0.09 reserved); the writer's 20,000-token allowance ($0.20) does not.
    rows('runs')[0].cap_usd = 0.1;
    const run = await playRunToEnd(gameId);

    expect(run).toMatchObject({ status: 'failed', outcome: 'cap' });
    expect(rows('interaction_turns').map((t) => t.status)).toEqual(['pending_ai']);
    expect(rows('interactions').filter((i) => i.role === 'ai')).toHaveLength(1);
    expect(rows('ai_calls').map((c) => c.purpose)).toEqual(['run:player']);
    expect(spent()).toBeLessThanOrEqual(0.1);
  });

  it('leaves a finished Run as it is', async () => {
    hoisted.engine = fakeEngine({ endAfter: 1 });
    const { gameId } = await startRun(hoisted.db as never, {
      storyId: 'story',
      userId: 'admin',
      persona: 'methodical',
      modelProfile: ALL_SONNET,
    });
    await playRunToEnd(gameId);
    const calls = rows('ai_calls').length;
    const again = await playRunToEnd(gameId);
    expect(again.status).toBe('completed');
    expect(rows('ai_calls')).toHaveLength(calls);
  });
});
