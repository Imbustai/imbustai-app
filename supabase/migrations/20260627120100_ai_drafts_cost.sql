-- ============================================================================
-- ai_drafts cost columns — per-batch token usage + dollar cost (admin-only).
-- usage: UsageRecord[] (one entry per model call: orchestrator + each NPC
-- letter, retries included), each carrying its own cost_usd snapshot. The
-- aggregate columns are the sum over that array. cost_usd is computed at
-- generation time from ai_model_pricing, so it reflects the price actually paid
-- (editing prices later does not rewrite history). Inherits ai_drafts' existing
-- admin-only SELECT RLS (writes are service-role only) — never public.
-- ============================================================================

alter table public.ai_drafts
  add column provider text not null default '',
  add column usage jsonb not null default '[]'::jsonb,
  add column input_tokens integer not null default 0,
  add column output_tokens integer not null default 0,
  add column cache_creation_input_tokens integer not null default 0,
  add column cache_read_input_tokens integer not null default 0,
  add column cost_usd numeric(12, 6) not null default 0;

comment on column public.ai_drafts.usage is
  'UsageRecord[]: per-call token usage + cost_usd snapshot (orchestrator + each NPC letter, retries included).';
comment on column public.ai_drafts.cost_usd is
  'Aggregate USD cost of this draft version, snapshotted at generation time from ai_model_pricing.';
