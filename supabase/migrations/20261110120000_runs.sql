-- ============================================================================
-- Runs: a QA Game an AI player plays under a cost cap.
-- Decided in Imbustai/imbustai-app#14 (ADR 0002); built in #31.
--
-- runs — one row per Run, keyed by its Game. A Game with a row here is a Run:
--   its Turns are approved automatically, its Letters are visible at once, and
--   every model call it makes is refused once the cap cannot cover it. The
--   spend itself is not stored here: it is the sum of the Game's ai_calls.
-- ============================================================================

create table public.runs (
  game_id uuid primary key references public.games (id) on delete cascade,
  /** The AI player's style: methodical | warm | impulsive. */
  persona text not null,
  /** The Run stops before its metered spend can pass this. */
  cap_usd numeric(12, 6) not null check (cap_usd > 0),
  /** The Run stops after this many Turns if the Engine resolved no Ending. */
  max_turns integer not null check (max_turns > 0),
  /** The preflight estimate the Run was started on. */
  estimate_usd numeric(12, 6) not null,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  /** How it stopped: an Ending, the Turn limit, or — failed — the cap or an error. */
  outcome text check (outcome in ('ending', 'turn_limit', 'cap', 'error')),
  /** RunReport: the Ending, per-complaint scores, spend by role (see apps/website/lib/runs.ts). */
  report jsonb,
  created_at timestamptz not null default now (),
  finished_at timestamptz
);

alter table public.runs enable row level security;

-- Admin-only read; writes are service-role only (they bypass RLS).
create policy runs_admin_select on public.runs
  for select
  using (public.is_admin ());
