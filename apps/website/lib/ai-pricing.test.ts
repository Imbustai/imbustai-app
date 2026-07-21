import { describe, expect, it } from 'vitest';
import { computeCostUsd } from './ai-pricing';
import type { CallUsage } from '@imbustai/story-engine';
import type { AiModelPricingRow } from './types/db';

const price: AiModelPricingRow = {
  id: 'p1',
  provider: 'anthropic',
  model: 'claude-opus-4-8',
  input_usd_per_mtok: 5,
  output_usd_per_mtok: 25,
  cache_read_usd_per_mtok: 0.5,
  cache_write_usd_per_mtok: 6.25,
  currency: 'USD',
  notes: '',
  created_at: '',
  updated_at: '',
};

const usage: CallUsage = {
  provider: 'anthropic',
  model: 'claude-opus-4-8',
  input_tokens: 1_000_000,
  output_tokens: 100_000,
  cache_read_input_tokens: 200_000,
  cache_creation_input_tokens: 0,
};

describe('computeCostUsd', () => {
  it('prices each token bucket from the model price row', () => {
    // 1M input * $5 + 0.1M output * $25 + 0.2M cache-read * $0.5 = 5 + 2.5 + 0.1
    expect(computeCostUsd(usage, price)).toBeCloseTo(7.6, 6);
  });

  it('returns 0 for an unpriced model', () => {
    expect(computeCostUsd(usage, undefined)).toBe(0);
  });
});
