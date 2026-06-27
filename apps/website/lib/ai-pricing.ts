import type { SupabaseClient } from '@supabase/supabase-js';
import type { CallUsage } from '@imbustai/story-engine';
import type { AiModelPricingRow } from '@/lib/types/db';

// AI cost helpers. The provider APIs return token counts only — never a dollar
// figure — so the app computes cost from the admin-managed ai_model_pricing
// table. Cost is snapshotted onto ai_drafts at generation time (editing prices
// later never rewrites history). Cost data is admin-only; never surface it in
// player-facing responses.

export type PricingMap = Map<string, AiModelPricingRow>;

/** Load the price table keyed by model id. */
export async function loadPricingMap(admin: SupabaseClient): Promise<PricingMap> {
  const { data } = await admin.from('ai_model_pricing').select('*');
  const map: PricingMap = new Map();
  for (const row of (data ?? []) as AiModelPricingRow[]) map.set(row.model, row);
  return map;
}

/** Dollar cost of a single model call. Returns 0 (and warns) for an unpriced model. */
export function computeCostUsd(usage: CallUsage, price?: AiModelPricingRow): number {
  if (!price) {
    console.warn(`[ai-pricing] no price row for model "${usage.model}" — cost recorded as 0.`);
    return 0;
  }
  const cost =
    usage.input_tokens * price.input_usd_per_mtok +
    usage.output_tokens * price.output_usd_per_mtok +
    usage.cache_read_input_tokens * price.cache_read_usd_per_mtok +
    usage.cache_creation_input_tokens * price.cache_write_usd_per_mtok;
  return cost / 1_000_000;
}
