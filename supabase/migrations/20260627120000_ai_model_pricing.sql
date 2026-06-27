-- ============================================================================
-- ai_model_pricing — per-model token prices (USD per 1M tokens), admin-managed.
-- The AI APIs return token counts but NOT a dollar cost, so the app multiplies
-- usage by these prices. Editable from the admin Settings UI (no hardcoded
-- prices in code). Admin-only: contains operational cost data, never public.
--
-- Seed values reflect published list prices last aligned 2026-06 (Claude via
-- the claude-api reference 2026-06-04; OpenAI and DeepSeek list prices 2026-06).
-- Cache columns: cache_read ≈ 0.1x input, cache_write ≈ 1.25x input (Claude);
-- 0 where the provider has no separate cache tier. Admins should re-check
-- against each provider's dashboard periodically.
-- ============================================================================

create table public.ai_model_pricing (
  id uuid primary key default gen_random_uuid (),
  provider text not null,
  model text not null unique,
  input_usd_per_mtok numeric(12, 6) not null default 0,
  output_usd_per_mtok numeric(12, 6) not null default 0,
  cache_read_usd_per_mtok numeric(12, 6) not null default 0,
  cache_write_usd_per_mtok numeric(12, 6) not null default 0,
  currency text not null default 'USD',
  notes text not null default '',
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

create trigger ai_model_pricing_set_updated_at
  before update on public.ai_model_pricing
  for each row
  execute function public.set_updated_at ();

alter table public.ai_model_pricing enable row level security;

-- Admin-only: read + write. Service-role writes (API routes) bypass RLS anyway.
create policy ai_model_pricing_admin_all on public.ai_model_pricing
  for all
  using (public.is_admin ())
  with check (public.is_admin ());

insert into public.ai_model_pricing
  (provider, model, input_usd_per_mtok, output_usd_per_mtok, cache_read_usd_per_mtok, cache_write_usd_per_mtok, notes)
values
  ('anthropic', 'claude-opus-4-8',   5.000000, 25.000000, 0.500000, 6.250000, 'List price 2026-06'),
  ('anthropic', 'claude-sonnet-4-6', 3.000000, 15.000000, 0.300000, 3.750000, 'List price 2026-06'),
  ('anthropic', 'claude-haiku-4-5',  1.000000,  5.000000, 0.100000, 1.250000, 'List price 2026-06'),
  ('anthropic', 'claude-fable-5',   10.000000, 50.000000, 1.000000, 12.500000, 'List price 2026-06'),
  ('openai',    'gpt-5.5',           5.000000, 30.000000, 0.500000, 0.000000, 'List price 2026-06'),
  ('openai',    'gpt-5.4',           2.500000, 15.000000, 0.250000, 0.000000, 'List price 2026-06'),
  ('openai',    'gpt-5.4-mini',      0.750000,  4.500000, 0.000000, 0.000000, 'List price 2026-06'),
  ('deepseek',  'deepseek-v4-flash', 0.140000,  0.280000, 0.002800, 0.000000, 'List price 2026-06 (deepseek-chat alias)'),
  ('deepseek',  'deepseek-v4-pro',   1.740000,  3.480000, 0.014500, 0.000000, 'List price 2026-06 (deepseek-reasoner alias)');
