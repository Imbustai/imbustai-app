import type { SupabaseClient } from '@supabase/supabase-js';
import {
  isProviderId,
  modelsOf,
  type CallUsage,
  type ModelProfile,
  type ProviderId,
} from '@imbustai/story-runtime';
import type { AiModelPricingRow } from '@/lib/types/db';

// AI cost helpers. The provider APIs return token counts only — never a dollar
// figure — so the app computes cost from the admin-managed ai_model_pricing
// table, which also says which provider serves each model. An unpriced model
// is an error, never $0: a Game's profile is checked against the table before
// any call. Cost is snapshotted at call time (editing prices later never
// rewrites history). Cost data is admin-only; never surface it to players.

export type PricingMap = Map<string, AiModelPricingRow>;

export class UnpricedModelError extends Error {
  constructor(public readonly models: string[]) {
    super(`No usable ai_model_pricing row for: ${models.join(', ')}. Add the model's prices (and a known provider) in Admin → Settings.`);
  }
}

/** Load the price table keyed by model id. */
export async function loadPricingMap(admin: SupabaseClient): Promise<PricingMap> {
  const { data, error } = await admin.from('ai_model_pricing').select('*');
  if (error) throw new Error(`ai_model_pricing: ${error.message}`);
  const map: PricingMap = new Map();
  for (const row of (data ?? []) as AiModelPricingRow[]) map.set(row.model, row);
  return map;
}

/** Throws unless every model the profile can call has a price row with a known provider. */
export function assertProfilePriced(profile: ModelProfile, pricing: PricingMap): void {
  const missing = modelsOf(profile).filter((model) => {
    const row = pricing.get(model);
    return !row || !isProviderId(row.provider);
  });
  if (missing.length > 0) throw new UnpricedModelError(missing);
}

/** The vendor that serves a model, from its price row. */
export function providerOf(model: string, pricing: PricingMap): ProviderId {
  const provider = pricing.get(model)?.provider;
  if (!provider || !isProviderId(provider)) throw new UnpricedModelError([model]);
  return provider;
}

/** Dollar cost of a single model call. Throws for an unpriced model. */
export function computeCostUsd(usage: CallUsage, pricing: PricingMap): number {
  const price = pricing.get(usage.model);
  if (!price) throw new UnpricedModelError([usage.model]);
  const cost =
    usage.input_tokens * price.input_usd_per_mtok +
    usage.output_tokens * price.output_usd_per_mtok +
    usage.cache_read_input_tokens * price.cache_read_usd_per_mtok +
    usage.cache_creation_input_tokens * price.cache_write_usd_per_mtok;
  return cost / 1_000_000;
}
