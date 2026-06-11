-- ============================================================================
-- DRAFT — DO NOT APPLY until Phase 0 is approved (see docs/draft-phases.md)
-- Story engine: story content tables, turn workflow, AI drafts, time columns.
-- Design rationale: docs/story-engine-architecture.md
--
-- Module optionality (architecture §2): only stories + story_characters are
-- required for a playable story. story_facts, story_acts, story_clues and
-- story_endings are OPTIONAL modules — zero rows is a valid, fully supported
-- configuration (engine/validator skip the corresponding behavior).
-- ============================================================================

-- -----------------------------------------------------------------------------
-- stories — story-level engine config
-- -----------------------------------------------------------------------------
alter table public.stories
  add column settings jsonb not null default '{}'::jsonb,
  add column time_config jsonb not null default '{}'::jsonb,
  add column allow_dynamic_npcs boolean not null default false;

comment on column public.stories.settings is
  'Engine settings: {max_letters_per_turn, max_turns, locale}';
comment on column public.stories.time_config is
  'Time model: {story_start_date, visible_delay: {enabled, min_minutes, max_minutes}, date_locale}';

-- -----------------------------------------------------------------------------
-- story_characters
-- -----------------------------------------------------------------------------
create table public.story_characters (
  id uuid primary key default gen_random_uuid (),
  story_id uuid not null references public.stories (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9_]+$'),
  name text not null,
  role text not null default '',
  personality jsonb not null default '{}'::jsonb,
  backstory text not null default '',
  hidden_agenda text not null default '',
  knowledge_notes text not null default '',
  responsiveness text not null default 'slow' check (
    responsiveness in ('immediate', 'slow', 'unreliable', 'expert')
  ),
  reply_delay_min_days integer not null default 1 check (reply_delay_min_days >= 0),
  reply_delay_max_days integer not null default 3 check (reply_delay_max_days >= reply_delay_min_days),
  contactable_from_start boolean not null default false,
  unlock_rules jsonb not null default '{}'::jsonb,
  created_dynamically boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  unique (story_id, slug)
);

create index story_characters_story_id_idx on public.story_characters (story_id);

create trigger story_characters_set_updated_at
  before update on public.story_characters
  for each row
  execute function public.set_updated_at ();

-- -----------------------------------------------------------------------------
-- story_acts
-- -----------------------------------------------------------------------------
create table public.story_acts (
  id uuid primary key default gen_random_uuid (),
  story_id uuid not null references public.stories (id) on delete cascade,
  act_number integer not null check (act_number > 0),
  title text not null default '',
  goals jsonb not null default '{}'::jsonb,
  turn_min integer not null check (turn_min > 0),
  turn_max integer check (turn_max is null or turn_max >= turn_min),
  reveal_rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  unique (story_id, act_number)
);

create index story_acts_story_id_idx on public.story_acts (story_id);

create trigger story_acts_set_updated_at
  before update on public.story_acts
  for each row
  execute function public.set_updated_at ();

-- -----------------------------------------------------------------------------
-- story_facts — canon registry: who knows what, from when
-- -----------------------------------------------------------------------------
create table public.story_facts (
  id uuid primary key default gen_random_uuid (),
  story_id uuid not null references public.stories (id) on delete cascade,
  fact_key text not null check (fact_key ~ '^[a-z0-9_]+$'),
  content text not null,
  category text not null default 'general',
  known_by text[] not null default '{}',
  is_public boolean not null default false,
  reveal_act integer check (reveal_act is null or reveal_act > 0),
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  unique (story_id, fact_key)
);

create index story_facts_story_id_idx on public.story_facts (story_id);

create trigger story_facts_set_updated_at
  before update on public.story_facts
  for each row
  execute function public.set_updated_at ();

-- -----------------------------------------------------------------------------
-- story_clues
-- -----------------------------------------------------------------------------
create table public.story_clues (
  id uuid primary key default gen_random_uuid (),
  story_id uuid not null references public.stories (id) on delete cascade,
  clue_key text not null check (clue_key ~ '^[a-z0-9_]+$'),
  description text not null,
  reliability text not null check (
    reliability in ('true_useful', 'true_misleading', 'false_coherent', 'red_herring')
  ),
  category text not null default 'subtle' check (
    category in ('physical', 'testimonial', 'documentary', 'subtle')
  ),
  act_available integer not null default 1 check (act_available > 0),
  source_character_slug text,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  unique (story_id, clue_key)
);

create index story_clues_story_id_idx on public.story_clues (story_id);

create trigger story_clues_set_updated_at
  before update on public.story_clues
  for each row
  execute function public.set_updated_at ();

-- -----------------------------------------------------------------------------
-- story_endings
-- -----------------------------------------------------------------------------
create table public.story_endings (
  id uuid primary key default gen_random_uuid (),
  story_id uuid not null references public.stories (id) on delete cascade,
  ending_key text not null check (ending_key ~ '^[a-z0-9_]+$'),
  title text not null default '',
  conditions jsonb not null default '{}'::jsonb,
  narrative_guidance text not null default '',
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  unique (story_id, ending_key)
);

create index story_endings_story_id_idx on public.story_endings (story_id);

create trigger story_endings_set_updated_at
  before update on public.story_endings
  for each row
  execute function public.set_updated_at ();

-- -----------------------------------------------------------------------------
-- games — runtime state (turn, act, in-fiction date, unlocks, clues)
-- -----------------------------------------------------------------------------
alter table public.games
  add column runtime_state jsonb not null default '{}'::jsonb;

comment on column public.games.runtime_state is
  'Server-managed: {current_turn, current_act, story_date, unlocked_npcs, clues_found, psych_profile}';

-- -----------------------------------------------------------------------------
-- interaction_turns — admin-gated reply workflow
-- -----------------------------------------------------------------------------
create table public.interaction_turns (
  id uuid primary key default gen_random_uuid (),
  game_id uuid not null references public.games (id) on delete cascade,
  turn_number integer not null check (turn_number > 0),
  status text not null default 'pending_ai' check (
    status in ('pending_ai', 'draft_ready', 'approved', 'sent')
  ),
  user_submitted_at timestamptz not null default now (),
  approved_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  unique (game_id, turn_number)
);

create index interaction_turns_game_id_idx on public.interaction_turns (game_id);
create index interaction_turns_status_idx on public.interaction_turns (status)
  where status <> 'sent';

create trigger interaction_turns_set_updated_at
  before update on public.interaction_turns
  for each row
  execute function public.set_updated_at ();

-- -----------------------------------------------------------------------------
-- ai_drafts — pre-approval AI batches, versioned (admin-only)
-- -----------------------------------------------------------------------------
create table public.ai_drafts (
  id uuid primary key default gen_random_uuid (),
  turn_id uuid not null references public.interaction_turns (id) on delete cascade,
  version integer not null check (version > 0),
  responses jsonb not null default '[]'::jsonb,
  game_state_updates jsonb not null default '{}'::jsonb,
  narrator_notes text not null default '',
  validation_warnings jsonb not null default '[]'::jsonb,
  source text not null default 'generated' check (
    source in ('generated', 'regenerated', 'edited')
  ),
  model text not null default '',
  created_at timestamptz not null default now (),
  unique (turn_id, version)
);

create index ai_drafts_turn_id_idx on public.ai_drafts (turn_id);

-- -----------------------------------------------------------------------------
-- interactions — character, in-fiction date, turn linkage
-- -----------------------------------------------------------------------------
alter table public.interactions
  add column character_slug text,
  add column story_date date,
  add column turn_id uuid references public.interaction_turns (id) on delete set null;

comment on column public.interactions.character_slug is
  'role=ai: sending NPC slug. role=user: recipient NPC slug.';

create index interactions_turn_id_idx on public.interactions (turn_id);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.story_characters enable row level security;
alter table public.story_acts enable row level security;
alter table public.story_facts enable row level security;
alter table public.story_clues enable row level security;
alter table public.story_endings enable row level security;
alter table public.interaction_turns enable row level security;
alter table public.ai_drafts enable row level security;

-- story content tables: ADMIN ONLY. Hidden agendas, facts, clues and endings
-- are spoilers; the player-facing contact list is served server-side via the
-- service role with explicit column selection.
create policy story_characters_admin_all on public.story_characters
  for all
  using (public.is_admin ())
  with check (public.is_admin ());

create policy story_acts_admin_all on public.story_acts
  for all
  using (public.is_admin ())
  with check (public.is_admin ());

create policy story_facts_admin_all on public.story_facts
  for all
  using (public.is_admin ())
  with check (public.is_admin ());

create policy story_clues_admin_all on public.story_clues
  for all
  using (public.is_admin ())
  with check (public.is_admin ());

create policy story_endings_admin_all on public.story_endings
  for all
  using (public.is_admin ())
  with check (public.is_admin ());

-- interaction_turns: owner/admin read; writes via service role only (no policy)
create policy interaction_turns_select_via_game on public.interaction_turns
  for select using (
    exists (
      select 1
      from public.games g
      where g.id = interaction_turns.game_id
        and (g.user_id = auth.uid () or public.is_admin ())
    )
  );

-- ai_drafts: admin read only; writes via service role only (no insert/update policy)
create policy ai_drafts_select_admin on public.ai_drafts
  for select using (public.is_admin ());

-- interactions: tighten the select policy — owners must not see AI letters
-- before visible_from. (Previously owners could read future-dated letters.)
drop policy interactions_select_via_game on public.interactions;

create policy interactions_select_via_game on public.interactions
  for select using (
    exists (
      select 1
      from public.games g
      where g.id = interactions.game_id
        and (
          public.is_admin ()
          or (
            g.user_id = auth.uid ()
            and (
              interactions.role = 'user'
              or interactions.visible_from is null
              or interactions.visible_from <= now ()
            )
          )
        )
    )
  );

-- Note: there is still NO insert policy on interactions, interaction_turns or
-- ai_drafts for authenticated users. All writes go through Route Handlers with
-- the service role after ownership/admin checks. AI interactions are inserted
-- exclusively by the admin approve route.
