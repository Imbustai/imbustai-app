import { describe, expect, it } from 'vitest';
import { IncompleteOutputError, type AiProvider, type CallUsage, type TextRequest } from '../ai/provider';
import { RunBudget, RunCapError, budgetedProvider, costOf, worstCaseCost, type ModelPrice } from '../runs/budget';

// $2 in / $10 out per million tokens, like claude-sonnet-5-5.
const PRICE: ModelPrice = { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 };
const priceOf = () => PRICE;

function usage(input: number, output: number): CallUsage {
  return {
    provider: 'mock',
    model: 'm',
    input_tokens: input,
    output_tokens: output,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
  };
}

/** A provider that bills a fixed usage per call and counts the calls it served. */
function meteredProvider(perCall: CallUsage, fail?: () => Error) {
  const served = { calls: 0 };
  const provider: AiProvider = {
    id: 'mock',
    async generateStructured() {
      served.calls++;
      if (fail) throw fail();
      return { output: {}, usage: perCall };
    },
    async generateText() {
      served.calls++;
      if (fail) throw fail();
      return { output: 'ok', usage: perCall, transcript: [] };
    },
  };
  return { provider, served };
}

const request: TextRequest = { model: 'm', system: 'x'.repeat(1000), user: 'y'.repeat(1000), maxTokens: 1000 };

describe('pricing a call', () => {
  it('prices the four token buckets from the per-million rates', () => {
    const cost = costOf(
      { ...usage(1_000_000, 100_000), cache_read_input_tokens: 500_000, cache_creation_input_tokens: 200_000 },
      PRICE,
    );
    // 2.00 input + 1.00 output + 0.10 cache read + 0.50 cache write
    expect(cost).toBeCloseTo(3.6, 6);
  });

  it('reserves the worst case: every input char-pair a token at the dearest input rate, the whole output allowance', () => {
    // 2,000 chars → 1,000 tokens at the cache-write rate ($2.50) + 1,000 output tokens at $10.
    expect(worstCaseCost(request, PRICE)).toBeCloseTo(0.0025 + 0.01, 6);
  });
});

describe('a Run budget', () => {
  it('lets calls through while the cap covers their worst case, and counts what they really cost', async () => {
    const budget = new RunBudget({ capUsd: 1 });
    const { provider } = meteredProvider(usage(800, 500));
    await budgetedProvider(provider, budget, priceOf).generateText(request);
    // 800 × $2/M + 500 × $10/M
    expect(budget.spentUsd).toBeCloseTo(0.0066, 6);
    expect(budget.reservedUsd).toBe(0);
  });

  it('refuses a call before it is made when its worst case would pass the cap', async () => {
    const budget = new RunBudget({ capUsd: 0.02, spentUsd: 0.015 });
    const { provider, served } = meteredProvider(usage(800, 500));
    await expect(budgetedProvider(provider, budget, priceOf).generateText(request)).rejects.toBeInstanceOf(RunCapError);
    expect(served.calls).toBe(0);
    expect(budget.spentUsd).toBeCloseTo(0.015, 6);
    expect(budget.capError).toBeInstanceOf(RunCapError);
  });

  it('counts calls still in flight, so parallel siblings cannot overshoot together', async () => {
    // Each call reserves $0.0125; the cap covers two, not three.
    const budget = new RunBudget({ capUsd: 0.03 });
    const { provider, served } = meteredProvider(usage(800, 500));
    const guarded = budgetedProvider(provider, budget, priceOf);
    const results = await Promise.allSettled([
      guarded.generateText(request),
      guarded.generateText(request),
      guarded.generateText(request),
    ]);
    expect(results.map((r) => r.status)).toEqual(['fulfilled', 'fulfilled', 'rejected']);
    expect(served.calls).toBe(2);
    expect(budget.spentUsd).toBeLessThanOrEqual(0.03);
  });

  it('charges a billed call that returned nothing usable', async () => {
    const budget = new RunBudget({ capUsd: 1 });
    const { provider } = meteredProvider(usage(0, 0), () => new IncompleteOutputError('max_tokens', usage(800, 1000)));
    await expect(budgetedProvider(provider, budget, priceOf).generateText(request)).rejects.toBeInstanceOf(
      IncompleteOutputError,
    );
    expect(budget.spentUsd).toBeCloseTo(0.0116, 6);
    expect(budget.reservedUsd).toBe(0);
  });

  it('keeps the reservation of a call whose billing is unknown', async () => {
    const budget = new RunBudget({ capUsd: 1 });
    const { provider } = meteredProvider(usage(0, 0), () => new Error('socket hang up'));
    await expect(budgetedProvider(provider, budget, priceOf).generateText(request)).rejects.toThrow('socket hang up');
    expect(budget.spentUsd).toBe(0);
    expect(budget.reservedUsd).toBeCloseTo(0.0125, 6);
    expect(budget.committedUsd).toBeCloseTo(0.0125, 6);
  });

  it('never lets the metered spend pass the cap, however many calls are tried', async () => {
    const budget = new RunBudget({ capUsd: 0.05 });
    const { provider } = meteredProvider(usage(900, 900));
    const guarded = budgetedProvider(provider, budget, priceOf);
    let refused = 0;
    for (let i = 0; i < 20; i++) {
      await guarded.generateText(request).catch((err) => {
        if (err instanceof RunCapError) refused++;
        else throw err;
      });
    }
    expect(refused).toBeGreaterThan(0);
    expect(budget.spentUsd).toBeLessThanOrEqual(0.05);
  });
});
