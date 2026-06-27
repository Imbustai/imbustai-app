# Phase 4 — Games migration

> Prereq: Phase 0 done. Read [`README.md`](README.md) +
> [`../design-system/ai-context.md`](../design-system/ai-context.md) §migration recipe.

## Goal

The games area runs on `@imbustai/ds` only — no `@/components/ui/*`, no Tailwind utilities — UI
preserved like-for-like.

## Scope

- Pages: `app/games/**` and admin game detail under `app/admin/game/[gameId]` if not already done in
  Phase 1 (check; the admin shell pages were Phase 1, but the games *feature components* live here).
- Components: `components/games/**`
  - `reply-workflow-panel.tsx` (394 — heaviest; the admin reply review workflow: generate/edit/
    regenerate/approve, tables, badges, status),
  - `games-list.tsx` (115), `admin-game-detail-client.tsx` (144), `game-detail.tsx` (83).

## Migration recipe

Per `ai-context.md`: lists/tables → DS `Table`; status chips → `Badge`; actions → `Button`;
panels/sections → `Card*` + `Stack`/`Box`; text → `Typography`. Replace all layout `className` with
layout primitives. Any `<select>` → DS `Select`.

## Acceptance criteria

- [ ] No `@/components/ui/*` imports under `components/games` (+ games pages).
- [ ] `grep -rn "className=" components/games app/games` ≈ empty.
- [ ] Reply workflow + game lists match today in light + dark; all actions still wired.
- [ ] `pnpm build:website` + `pnpm test` pass.

## Verification

```bash
pnpm dev:website
grep -rn "@/components/ui/\|className=" components/games app/games
```
Preview a games list and the reply-workflow panel (needs a game in `testing` state, or use a
screenshot of the rendered panel); `preview_screenshot` (light + dark); confirm tables/badges/
buttons render; console clean.

## Gotchas

- `reply-workflow-panel.tsx` is logic-heavy (the AI batch review per CLAUDE.md). Migrate
  **markup/styling only** — do not touch generate/edit/regenerate/approve logic or the service-role
  insert path.
- Confirm whether `app/admin/game/[gameId]/page.tsx` was already migrated in Phase 1; avoid
  double-work, but ensure its feature components here are covered.
