-- ============================================================================
-- story_engine_data — the Story document of an Engine that keeps it whole.
--
-- ADR 0001: engine data is one versioned JSON document per Story, validated
-- by the Engine's zod schema, authored as a seed file in the Engine package
-- and synced by a script. engine-voss is the first Engine to use it
-- (Imbustai/imbustai-app#39); engine-classic keeps its relational tables.
--
-- A table of its own, not a column on stories: published stories are
-- readable by anyone (the shop), and this document holds the solution.
-- Admin-only, like story_facts and story_clues; the game host reads it with
-- the service role.
-- ============================================================================

create table public.story_engine_data (
  story_id uuid primary key references public.stories (id) on delete cascade,
  /** The Engine that wrote it; must match stories.engine when loaded. */
  engine text not null,
  /** The document's own schemaVersion, for migrations of the document. */
  schema_version integer not null,
  data jsonb not null,
  updated_at timestamptz not null default now ()
);

comment on table public.story_engine_data is
  'One Engine Story document per Story (engine-voss: VossStory), validated by the Engine schema on every load. Admin-only: it holds the solution.';

create trigger story_engine_data_set_updated_at
  before update on public.story_engine_data
  for each row
  execute function public.set_updated_at ();

alter table public.story_engine_data enable row level security;

create policy story_engine_data_admin_all on public.story_engine_data
  for all
  using (public.is_admin ())
  with check (public.is_admin ());
