-- Engines as plug-in packages (docs/adr/0001-engines-as-plug-in-packages.md).
--
-- stories.engine picks the Engine package that plays a Story. Every existing
-- Story stays on engine-classic, the July planner→writer engine.
--
-- ai_drafts now stores the Engine contract's DraftBatch:
--   responses           → the batch's Letters ({key, kind, from, storyDate, body, enclosures})
--   effects             → Engine-owned, opaque to the platform; handed back on approve
--   submission_date     → the in-fiction date the Engine gives the Player's Letters
--   narrator_notes      → the batch's adminNotes, joined
--   validation_warnings → Findings ({rule, severity, message, letterKey?})
-- plan and game_state_updates are no longer written; existing drafts are
-- converted below so open turns can still be edited and approved.

alter table public.stories
  add column engine text not null default 'engine-classic';

comment on column public.stories.engine is
  'The Engine package that plays this Story, e.g. engine-classic.';

alter table public.ai_drafts
  add column effects jsonb,
  add column submission_date date;

comment on column public.ai_drafts.effects is
  'Engine-owned effects of this batch (DraftBatch.effects), applied on approve. Opaque to the platform.';
comment on column public.ai_drafts.submission_date is
  'In-fiction date of the Player''s Letters of this Turn, set by the Engine (DraftBatch.submissionDate).';

-- Existing drafts are engine-classic drafts: move plan, state updates and
-- per-letter metadata into effects, and reshape letters and warnings.
update public.ai_drafts d
set
  effects = jsonb_build_object(
    'plan', d.plan,
    'game_state_updates', d.game_state_updates,
    'letters', coalesce(
      (
        select jsonb_object_agg(
          r ->> 'character_slug',
          jsonb_build_object(
            'date_sent', coalesce(r ->> 'date_sent', ''),
            'metadata', coalesce(r -> 'metadata', '{}'::jsonb)
          )
        )
        from jsonb_array_elements(d.responses) r
      ),
      '{}'::jsonb
    ),
    'plan_findings', '[]'::jsonb
  ),
  responses = coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'key', r ->> 'character_slug',
          'kind', 'letter',
          'from', r ->> 'character_slug',
          'storyDate', r ->> 'story_date',
          'body', r ->> 'content',
          'enclosures', '[]'::jsonb
        )
        order by t.ord
      )
      from jsonb_array_elements(d.responses) with ordinality as t (r, ord)
    ),
    '[]'::jsonb
  ),
  validation_warnings = coalesce(
    (
      select jsonb_agg(
        (w - 'character_slug')
          || case
            when w ? 'character_slug' then jsonb_build_object('letterKey', w -> 'character_slug')
            else '{}'::jsonb
          end
        order by t.ord
      )
      from jsonb_array_elements(d.validation_warnings) with ordinality as t (w, ord)
    ),
    '[]'::jsonb
  ),
  submission_date = (
    select min(i.story_date)
    from public.interactions i
    where i.turn_id = d.turn_id and i.role = 'user'
  )
where d.effects is null;

alter table public.ai_drafts
  alter column effects set default '{}'::jsonb,
  alter column effects set not null;
