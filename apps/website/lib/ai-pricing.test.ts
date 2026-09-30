import { describe, expect, it } from 'vitest';
import { DEFAULT_MODEL_PROFILE, mergeModelProfile, type CallUsage } from '@imbustai/story-runtime';
import {
  UnpricedModelError,
  assertProfilePriced,
  computeCostUsd,
  providerOf,
  type PricingMap,
} from './ai-pricing';
import type { AiModelPricingRow } from './types/db';

const row = (provider: string, model: string, prices: [number, number, number, number]): AiModelPricingRow => ({
  id: model,
  provider,
  model,
  input_usd_per_mtok: prices[0],
  output_usd_per_mtok: prices[1],
  cache_read_usd_per_mtok: prices[2],
  cache_write_usd_per_mtok: prices[3],
  currency: 'USD',
  notes: '',
  created_at: '',
  updated_at: '',
});

const pricing: PricingMap = new Map(
  [
    row('anthropic', 'claude-fable-5-1', [10, 50, 0.25, 12.5]),
    row('anthropic', 'claude-sonnet-5-5', [2, 10, 0.2, 2.5]),
    row('openai', 'gpt-6-sol', [2, 10, 0.2, 2.5]),
    row('deepseek', 'deepseek-v4-pro', [1.74, 3.48, 0.0145, 0]),
  ].map((r) => [r.model, r]),
);

const usage: CallUsage = {
  provider: 'anthropic',
  model: 'claude-fable-5-1',
  input_tokens: 1_000_000,
  output_tokens: 100_000,
  cache_read_input_tokens: 2_000_000,
  cache_creation_input_tokens: 100_000,
};

describe('computeCostUsd', () => {
  it('prices each token bucket from the model price row', () => {
    // 1M input * $10 + 0.1M output * $50 + 2M cache-read * $0.25 + 0.1M cache-write * $12.5
    expect(computeCostUsd(usage, pricing)).toBeCloseTo(10 + 5 + 0.5 + 1.25, 6);
  });

  it('refuses an unpriced model instead of recording $0', () => {
    expect(() => computeCostUsd({ ...usage, model: 'claude-opus-4-8' }, pricing)).toThrow(UnpricedModelError);
  });
});

describe('a profile against the price table', () => {
  it('passes when every model it can call is priced', () => {
    expect(() => assertProfilePriced(DEFAULT_MODEL_PROFILE, pricing)).not.toThrow();
  });

  it('names every unpriced model, per-Character overrides included', () => {
    const profile = mergeModelProfile(DEFAULT_MODEL_PROFILE, {
      characters: { voss: { analyst: { model: 'claude-opus-5-5' } } },
    });
    expect(() => assertProfilePriced(profile, pricing)).toThrow(/claude-opus-5-5/);
  });

  it('refuses a model whose provider the platform cannot call', () => {
    const profile = mergeModelProfile(DEFAULT_MODEL_PROFILE, { roles: { clerk: { model: 'deepseek-v4-pro' } } });
    expect(() => assertProfilePriced(profile, pricing)).toThrow(/deepseek-v4-pro/);
  });

  it('routes each model to its provider', () => {
    expect(providerOf('gpt-6-sol', pricing)).toBe('openai');
    expect(providerOf('claude-sonnet-5-5', pricing)).toBe('anthropic');
  });
});
