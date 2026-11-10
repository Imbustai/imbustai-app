import { describe, expect, it } from 'vitest';
import { createAiAccess } from '../ai/access';
import { DEFAULT_MODEL_PROFILE, mergeModelProfile } from '../ai/profile';
import { MockProvider, type AiProvider, type StructuredRequest } from '../ai/provider';
import type { Finding, PlayerLetter } from '../contract';
import { RunBudget, budgetedProvider, type ModelPrice } from '../runs/budget';
import { PERSONAS, type VisibleLetter } from '../runs/player';
import { estimateRun, scoreRun } from '../runs/report';
import { playRun, playRunTurn, type RunGame, type RunGameView } from '../runs/run';

// The Run loop against an in-memory Game: Voss answers every Letter, and the
// Game ends after `endAfter` Turns when the test says so.

const VOSS = { slug: 'voss', name: 'Florian Voss', kind: 'person' as const };
const ADELAIDE = { slug: 'adelaide', name: 'Adelaide Ferri', kind: 'person' as const };

function fakeGame(opts: { endAfter?: number; reject?: (letters: PlayerLetter[]) => Finding[] } = {}) {
  const letters: VisibleLetter[] = [
    {
      direction: 'in',
      turn: 0,
      correspondent: VOSS.name,
      kind: 'letter',
      storyDate: '1987-11-02',
      body: 'Commissario, le scrivo da Roma.',
      enclosures: [],
    },
  ];
  const state = { turnsPlayed: 0, pending: null as PlayerLetter[] | null, completed: false, resolved: 0 };
  const submitted: PlayerLetter[][] = [];
  const game: RunGame = {
    async view(): Promise<RunGameView> {
      return {
        lead: { slug: 'lombardo', name: 'Giacomo Lombardo', kind: 'person' },
        contacts: [VOSS, ADELAIDE],
        letters: [...letters],
        turn: state.turnsPlayed + 1,
        maxLettersPerTurn: 2,
        turnsPlayed: state.turnsPlayed,
        awaitingReplies: state.pending !== null,
        completed: state.completed,
        ending: state.completed ? { key: 'saved_caught', detail: {} } : null,
      };
    },
    async submit(batch) {
      const findings = opts.reject?.(batch) ?? [];
      if (findings.some((f) => f.severity === 'error')) return findings;
      submitted.push(batch);
      state.pending = batch;
      return findings;
    },
    async resolve() {
      state.resolved++;
      if (!state.pending) return;
      const turn = state.turnsPlayed + 1;
      for (const l of state.pending) {
        letters.push({
          direction: 'out',
          turn,
          correspondent: l.to === 'voss' ? VOSS.name : ADELAIDE.name,
          kind: 'letter',
          storyDate: '1987-11-05',
          body: l.body,
          enclosures: [],
        });
      }
      letters.push({
        direction: 'in',
        turn,
        correspondent: VOSS.name,
        kind: 'letter',
        storyDate: '1987-11-09',
        body: `Risposta al turno ${turn}.`,
        enclosures: [],
      });
      state.pending = null;
      state.turnsPlayed = turn;
      if (opts.endAfter && turn >= opts.endAfter) state.completed = true;
    },
  };
  return { game, state, submitted };
}

/** AI whose player model always writes `reply`; requests are kept for inspection. */
function playerAi(reply: (request: StructuredRequest) => unknown, wrap: (p: AiProvider) => AiProvider = (p) => p) {
  const provider = new MockProvider(reply);
  const ai = createAiAccess({
    profile: mergeModelProfile(DEFAULT_MODEL_PROFILE, { roles: { player: { model: 'player-model' } } }),
    providerFor: () => wrap(provider),
    turn: 0,
  });
  return { ai, provider };
}

const toVoss = () => ({ letters: [{ to: 'voss', body: 'Caro Voss, chi era il testimone?' }] });

describe('a Run', () => {
  it('plays Turn after Turn until the Engine resolves an Ending', async () => {
    const { game, submitted } = fakeGame({ endAfter: 3 });
    const { ai } = playerAi(toVoss);
    const result = await playRun({ game, ai, persona: PERSONAS.methodical, maxTurns: 8 });
    expect(result).toMatchObject({
      outcome: 'ending',
      failed: false,
      turnsPlayed: 3,
      ending: { key: 'saved_caught' },
    });
    expect(submitted).toHaveLength(3);
  });

  it('stops at its Turn limit when the Engine resolves no Ending', async () => {
    const { game, submitted } = fakeGame();
    const { ai } = playerAi(toVoss);
    const result = await playRun({ game, ai, persona: PERSONAS.methodical, maxTurns: 2 });
    expect(result).toMatchObject({ outcome: 'turn_limit', failed: false, turnsPlayed: 2, ending: null });
    expect(submitted).toHaveLength(2);
  });

  it('writes on the player role, from the delivered Letters, the Contacts and the persona only', async () => {
    const { game } = fakeGame();
    const { ai, provider } = playerAi(toVoss);
    await playRunTurn({ game, ai, persona: PERSONAS.impulsive, maxTurns: 8 });
    const [request] = provider.requests;
    expect(request.model).toBe('player-model');
    expect(request.system).toContain('Giacomo Lombardo');
    expect(request.system).toContain(PERSONAS.impulsive.brief);
    expect(request.user).toContain('Commissario, le scrivo da Roma.');
    expect(request.user).toContain('voss: Florian Voss');
    expect(request.user).toContain('adelaide: Adelaide Ferri');
  });

  it('posts only Letters to current Contacts, one each, up to the Turn limit of Letters', async () => {
    const { game, submitted } = fakeGame();
    const { ai } = playerAi(() => ({
      letters: [
        { to: 'tribunale', body: 'Spettabile Tribunale' },
        { to: 'voss', body: 'Primo' },
        { to: 'voss', body: 'Secondo allo stesso' },
        { to: 'adelaide', body: 'Cara Adelaide' },
      ],
    }));
    await playRunTurn({ game, ai, persona: PERSONAS.warm, maxTurns: 8 });
    expect(submitted[0]).toEqual([
      { to: 'voss', body: 'Primo' },
      { to: 'adelaide', body: 'Cara Adelaide' },
    ]);
  });

  it('lets the player rewrite a rejected Turn once, telling it why', async () => {
    let attempts = 0;
    const { game, submitted } = fakeGame({
      reject: () =>
        ++attempts === 1 ? [{ rule: 'invalid_letter', severity: 'error', message: 'Empty or too long.' }] : [],
    });
    const { ai, provider } = playerAi(toVoss);
    const step = await playRunTurn({ game, ai, persona: PERSONAS.methodical, maxTurns: 8 });
    expect(step).toEqual({ done: false, turnsPlayed: 1 });
    expect(provider.requests).toHaveLength(2);
    expect(provider.requests[1].user).toContain('Empty or too long.');
    expect(submitted).toHaveLength(1);
  });

  it('fails when the Engine rejects the player twice', async () => {
    const { game } = fakeGame({
      reject: () => [{ rule: 'recipient_locked', severity: 'error', message: 'Not yet.' }],
    });
    const { ai } = playerAi(toVoss);
    const result = await playRun({ game, ai, persona: PERSONAS.methodical, maxTurns: 8 });
    expect(result).toMatchObject({ outcome: 'error', failed: true, turnsPlayed: 0 });
    expect(result.error).toContain('Not yet.');
  });

  it('fails when the player writes to nobody it can reach', async () => {
    const { game, submitted } = fakeGame();
    const { ai } = playerAi(() => ({ letters: [{ to: 'questura', body: 'Buongiorno' }] }));
    const result = await playRun({ game, ai, persona: PERSONAS.methodical, maxTurns: 8 });
    expect(result).toMatchObject({ outcome: 'error', failed: true });
    expect(submitted).toHaveLength(0);
  });

  it('resumes at the batch when Letters were submitted but not answered', async () => {
    const { game, state } = fakeGame();
    await game.submit([{ to: 'voss', body: 'Già spedita' }]);
    const { ai, provider } = playerAi(toVoss);
    const step = await playRunTurn({ game, ai, persona: PERSONAS.methodical, maxTurns: 8 });
    expect(step).toEqual({ done: false, turnsPlayed: 1 });
    expect(provider.requests).toHaveLength(0);
    expect(state.resolved).toBe(1);
  });

  it('is a failed Run when the cost cap refuses a call, and the refused Turn is never submitted', async () => {
    // $2/$10 per million; each player call reserves well above $0.08, so the cap covers no call at all.
    const price: ModelPrice = { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 };
    const budget = new RunBudget({ capUsd: 0.05 });
    const { game, submitted, state } = fakeGame();
    const { ai, provider } = playerAi(toVoss, (p) => budgetedProvider(p, budget, () => price));
    const result = await playRun({ game, ai, persona: PERSONAS.methodical, maxTurns: 8 });
    expect(result).toMatchObject({ outcome: 'cap', failed: true, turnsPlayed: 0 });
    expect(result.error).toContain('cost cap');
    expect(provider.requests).toHaveLength(0);
    expect(submitted).toHaveLength(0);
    expect(state.resolved).toBe(0);
    expect(budget.spentUsd).toBe(0);
  });
});

describe('the Run report', () => {
  it('scores every complaint once, from the correspondence, on the analyst', async () => {
    const { game } = fakeGame();
    const { ai, provider } = playerAi(() => ({
      scores: [
        { complaint: 'bond', score: 2, evidence: 'Voss never speaks of himself.' },
        { complaint: 'vague', score: 4, evidence: 'Names and dates in Turn 1.' },
        { complaint: 'echo', score: 5, evidence: 'No praise.' },
        { complaint: 'scripted', score: 3, evidence: 'Turn 2 ignores the question.' },
        { complaint: 'contacts', score: 1, evidence: 'The Comune never answers.' },
      ],
    }));
    const scores = await scoreRun(ai, await game.view());
    expect(scores.map((s) => [s.complaint, s.score])).toEqual([
      ['vague', 4],
      ['echo', 5],
      ['scripted', 3],
      ['contacts', 1],
      ['bond', 2],
    ]);
    expect(provider.requests[0].model).toBe(DEFAULT_MODEL_PROFILE.roles.analyst.model);
    expect(provider.requests[0].user).toContain('Commissario, le scrivo da Roma.');
  });

  it('estimates a Run from the Engine\'s calls per Turn, the player\'s and the judge\'s', () => {
    const prices: Record<string, ModelPrice> = {
      writer: { input: 10, output: 50, cacheRead: 0.25, cacheWrite: 12.5 },
      cheap: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
    };
    const estimate = estimateRun({
      profile: {
        roles: {
          writer: { model: 'writer' },
          clerk: { model: 'cheap' },
          analyst: { model: 'cheap' },
          player: { model: 'cheap' },
        },
      },
      priceOf: (model) => prices[model],
      turns: 8,
      turnShape: [{ role: 'writer', purpose: 'npc_letter', callsPerTurn: 2, inputTokens: 10_000, outputTokens: 2_000 }],
    });
    // writer: 16 × (10k × $10 + 2k × $50)/M = $3.20
    // player: 8 × (15k × $2 + 4k × $10)/M = $0.56
    // judge:  1 × (40k × $2 + 4k × $10)/M = $0.12
    expect(estimate.lines.map((l) => [l.purpose, l.calls, Number(l.usd.toFixed(2))])).toEqual([
      ['npc_letter', 16, 3.2],
      ['run:player', 8, 0.56],
      ['run:judge', 1, 0.12],
    ]);
    expect(estimate.totalUsd).toBeCloseTo(3.88, 6);
  });

  it('refuses to estimate a Run on a model without a price', () => {
    expect(() =>
      estimateRun({
        profile: DEFAULT_MODEL_PROFILE,
        priceOf: (model) => {
          throw new Error(`no price for ${model}`);
        },
        turns: 8,
        turnShape: [],
      }),
    ).toThrow('no price');
  });
});
