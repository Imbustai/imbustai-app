-- ai_drafts.plan: the orchestrator's turn plan (briefs per NPC). Stored so a
-- single-NPC regenerate can reuse the same briefs, and edits can be
-- re-validated against the original plan. Admin-only via existing RLS.
alter table public.ai_drafts
  add column plan jsonb not null default '{}'::jsonb;
