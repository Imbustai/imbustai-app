-- Enclosures and the closing batch (Imbustai/imbustai-app#28), per the Engine
-- contract (#20).
--
-- interactions.kind / .enclosures carry OutgoingLetter.kind and .enclosures
-- once a batch is approved, so the Player sees what was enclosed and Engines
-- get it back in history. The Player's Letters stay kind 'letter' with no
-- Enclosures: the Player never encloses anything.
--
-- interaction_turns.ending marks the closing turn: after an applied Turn the
-- Engine's resolveEnding returned this Ending, and generateEpilogue writes the
-- turn's batch (no Player letters). Sending it completes the Game.

alter table public.interactions
  add column kind text not null default 'letter'
    check (kind in ('letter', 'dispatch', 'epilogue')),
  add column enclosures jsonb not null default '[]'::jsonb;

comment on column public.interactions.kind is
  'OutgoingLetter.kind: letter, dispatch or epilogue. Player Letters are always letter.';
comment on column public.interactions.enclosures is
  'OutgoingLetter.enclosures ({key, kind, title, body}), text only. Always [] for Player Letters.';

alter table public.interaction_turns
  add column ending jsonb;

comment on column public.interaction_turns.ending is
  'Set only on the closing turn: the Ending ({key, detail}) resolveEnding returned. Its batch comes from generateEpilogue.';
