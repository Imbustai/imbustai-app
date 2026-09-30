-- ============================================================================
-- Model profiles, per-attempt usage and a refreshed price table.
-- Decided in Imbustai/imbustai-app#14 (ADR 0002); prices researched in #17;
-- built in #29.
--
-- stories.model_profile — the Story's default, as a patch over the platform
--   default (ModelProfilePatch: { roles?, characters? }), e.g. Voss's analyst
--   on a stronger model. Null = the platform default.
-- games.model_profile — the full profile the Game runs on, snapshotted at
--   start (Story default + the admin's or a Run's override). Null only for
--   Games started before this migration: they resolve from their Story.
-- ai_calls — one row per model attempt (retries and failed attempts
--   included), priced at call time, whichever Hook made it.
-- ============================================================================

alter table public.stories
  add column model_profile jsonb;

alter table public.games
  add column model_profile jsonb;

comment on column public.stories.model_profile is
  'ModelProfilePatch over the platform default: { roles?: {writer|clerk|analyst|player: {model, effort?}}, characters?: {<slug>: {<role>: {model, effort?}}} }. Null = platform default.';
comment on column public.games.model_profile is
  'The full ModelProfile this Game runs on, snapshotted at start. Null for Games started before model profiles.';

create table public.ai_calls (
  id uuid primary key default gen_random_uuid (),
  game_id uuid not null references public.games (id) on delete cascade,
  turn_id uuid references public.interaction_turns (id) on delete set null,
  /** The draft this call produced, when it was part of a generation. */
  draft_id uuid references public.ai_drafts (id) on delete set null,
  /** The Hook that made the call: startGame | generateTurn | generateEpilogue | validateDraft | applyTurn. */
  hook text not null,
  turn_number integer not null,
  role text not null,
  purpose text not null,
  character_slug text,
  attempt integer not null,
  outcome text not null check (outcome in ('ok', 'invalid', 'incomplete')),
  provider text not null,
  model text not null,
  effort text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_creation_input_tokens integer not null default 0,
  cache_read_input_tokens integer not null default 0,
  cost_usd numeric(12, 6) not null,
  created_at timestamptz not null default now ()
);

create index ai_calls_game_id_idx on public.ai_calls (game_id, created_at);
create index ai_calls_turn_id_idx on public.ai_calls (turn_id);

alter table public.ai_calls enable row level security;

-- Admin-only read; writes are service-role only (they bypass RLS).
create policy ai_calls_admin_select on public.ai_calls
  for select
  using (public.is_admin ());

-- ─── Price table ────────────────────────────────────────────────────────────
-- List prices read 2026-09-29 (#17). USD per 1M tokens, Standard tier, short
-- context. Claude cache_write = the 5-minute TTL, the only one the providers
-- use. GPT-5.5 and earlier bill no write surcharge, so their write column
-- holds the input rate.

insert into public.ai_model_pricing
  (provider, model, input_usd_per_mtok, output_usd_per_mtok, cache_read_usd_per_mtok, cache_write_usd_per_mtok, notes)
values
  ('anthropic', 'claude-fable-5-1', 10.00, 50.00, 0.250, 12.500, 'List 2026-09-29, platform.claude.com/docs/en/about-claude/pricing. Write = 5m TTL (1h: 20). Read 0.025x input.'),
  ('anthropic', 'claude-opus-5-5',   4.00, 20.00, 0.200,  5.000, 'List 2026-09-29, platform.claude.com pricing. Write = 5m TTL (1h: 8). Read 0.05x input.'),
  ('anthropic', 'claude-opus-5',     5.00, 25.00, 0.500,  6.250, 'List 2026-09-29, platform.claude.com pricing. Write = 5m TTL (1h: 10). Legacy.'),
  ('anthropic', 'claude-sonnet-5-5', 2.00, 10.00, 0.200,  2.500, 'List 2026-09-29, platform.claude.com pricing. Write = 5m TTL (1h: 4).'),
  ('anthropic', 'claude-sonnet-5',   2.00, 10.00, 0.200,  2.500, 'List 2026-09-29, platform.claude.com pricing. Write = 5m TTL (1h: 4). 2/10 is standard, not introductory. Legacy.'),
  ('anthropic', 'claude-haiku-4-5',  1.00,  5.00, 0.100,  1.250, 'List 2026-09-29, platform.claude.com pricing. Write = 5m TTL (1h: 2). Alias of claude-haiku-4-5-20251001. No effort parameter.'),
  ('openai',    'gpt-6-astra',      10.00, 50.00, 1.000, 12.500, 'List 2026-09-29, developers.openai.com/api/docs/pricing. Standard, <=272K input. Write 1.25x input.'),
  ('openai',    'gpt-6-sol',         2.00, 10.00, 0.200,  2.500, 'List 2026-09-29, developers.openai.com pricing. Standard, <=272K input. Write 1.25x input.'),
  ('openai',    'gpt-6-luna',        0.10,  0.50, 0.010,  0.125, 'List 2026-09-29, developers.openai.com pricing. Standard, <=272K input. Write 1.25x input.'),
  ('openai',    'gpt-5.6-sol',       4.00, 20.00, 0.400,  5.000, 'List 2026-09-29, developers.openai.com pricing. Promo price at least through 2026-11-21. Standard, <=272K.'),
  ('openai',    'gpt-5.6-terra',     2.00, 12.00, 0.200,  2.500, 'List 2026-09-29, developers.openai.com pricing. Standard, <=272K input. Write 1.25x input.'),
  ('openai',    'gpt-5.6-luna',      0.20,  1.20, 0.020,  0.250, 'List 2026-09-29, developers.openai.com pricing. Standard, <=272K input. Write 1.25x input.'),
  ('openai',    'gpt-5.5',           5.00, 30.00, 0.500,  5.000, 'List 2026-09-29, developers.openai.com pricing. Standard, <272K. No write surcharge: write = input.'),
  ('openai',    'gpt-5.4',           2.50, 15.00, 0.250,  2.500, 'List 2026-09-29, developers.openai.com pricing. Standard, <272K. No write surcharge: write = input.'),
  ('openai',    'gpt-5.4-mini',      0.75,  4.50, 0.075,  0.750, 'List 2026-09-29, developers.openai.com pricing. Standard. No write surcharge: write = input.'),
  ('openai',    'gpt-5.4-nano',      0.20,  1.25, 0.020,  0.200, 'List 2026-09-29, developers.openai.com pricing. Standard. No write surcharge: write = input.')
on conflict (model) do update set
  provider = excluded.provider,
  input_usd_per_mtok = excluded.input_usd_per_mtok,
  output_usd_per_mtok = excluded.output_usd_per_mtok,
  cache_read_usd_per_mtok = excluded.cache_read_usd_per_mtok,
  cache_write_usd_per_mtok = excluded.cache_write_usd_per_mtok,
  notes = excluded.notes;

-- Stale rows: no longer candidates (#17), and DeepSeek was dropped (#14).
-- Past drafts keep their cost snapshots; an unpriced model is now an error.
delete from public.ai_model_pricing
where model in ('claude-opus-4-8', 'claude-sonnet-4-6', 'claude-fable-5', 'deepseek-v4-flash', 'deepseek-v4-pro');
