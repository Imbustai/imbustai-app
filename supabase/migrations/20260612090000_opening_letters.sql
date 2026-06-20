-- ============================================================================
-- Opening letters + time start modes (Phase 1 refinement, approved 2026-06-12)
-- - Multiple characters may send an opening letter when a game starts.
-- - Letter bodies never embed dates: story_date is metadata, rendered by UI.
-- - stories.time_config gains start_mode (fixed | actual) — jsonb, no DDL.
-- ============================================================================

alter table public.story_characters
  add column opening_letter text not null default '',
  add column opening_letter_day_offset integer not null default 0
    check (opening_letter_day_offset >= 0);

comment on column public.story_characters.opening_letter is
  'If non-empty, this character sends an opening letter at game start. Body must NOT contain a date line — story_date is metadata.';
comment on column public.story_characters.opening_letter_day_offset is
  'In-fiction days after the story start date when this opening letter is dated.';

comment on column public.stories.first_letter is
  'LEGACY single opening letter — superseded by story_characters.opening_letter. Kept until the start-game route switches (Phase 3), then removable.';

comment on column public.stories.time_config is
  'Time model: {start_mode: "fixed"|"actual", story_start_date, visible_delay: {enabled, min_minutes, max_minutes}, date_locale}. start_mode=actual uses the real-world date the game starts as the in-fiction start.';
