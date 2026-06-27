# Phase 1 — Admin migration + sticky sidebar

> Prereq: Phase 0 done (layout primitives + Table/Tooltip/Select shipped). Read
> [`README.md`](README.md) + [`../design-system/ai-context.md`](../design-system/ai-context.md).
> This is the first concrete area and the user's priority.

## Goal

The whole admin area runs on `@imbustai/ds` only — **zero `@/components/ui/*` imports, zero
Tailwind utilities** — with the **current UI preserved** (like-for-like, no redesign), plus the
**sidebar pinned to the top while content scrolls**.

## Scope

- Pages: `app/admin/**` (9 pages — `page.tsx`, `layout.tsx`, `orders/`, `order/[orderId]/`,
  `order/create/`, `games/`, `game/[gameId]/`, `stories/`, `stories/[storyId]/`).
- Components: `components/admin/**` (11 files). Heaviest:
  - `stories/story-editor-client.tsx` (774) — budget for it; mostly forms/inputs/tables.
  - `admin-dashboard-shell.tsx` (286) — the shell + sidebar (the sticky change).
  - others: `admin-breadcrumbs`, `admin-page-title`, `admin-back-link`, `client-section-title`,
    `order-status-badge`, `orders-filter` (uses `<select>` → DS `Select`), `start-game-button`,
    `free-order-form`, `stories/stories-list-client`.

## The sticky sidebar (the one behavioural change)

In `components/admin/admin-dashboard-shell.tsx` the shell is `flex min-h-screen`; the `<header>` is
already `sticky top-0 z-40`, but the `<aside>` scrolls away with the page.

Rebuild the shell with layout primitives and pin the aside:
- The aside becomes **`position: sticky; top: 0; align-self: flex-start; height: 100dvh`** with its
  own `overflow-y: auto` (so a long nav scrolls internally, the rail stays put).
- Keep the existing collapse/expand behaviour, `localStorage` persistence, tooltips (now DS
  `Tooltip`), and the sticky header.
- Express this via a layout primitive (e.g. `Box` with the sticky sprinkles) — if the sprinkles set
  from Phase 0 lacks `position: sticky` / `alignSelf` / `height: 100dvh`, **add those to the
  sprinkles config** (it's layout, in-scope) rather than reaching for `className`.

Verify by scrolling a long admin page (e.g. orders/stories list) and confirming the rail stays
pinned and the header stays on top.

## Migration recipe (per file)

Follow `ai-context.md` §migration recipe:
1. `grep -n "@/components/ui/\|className=" <file>` — inventory.
2. Replace `ui/*` imports with DS equivalents (Button/Card/Input/Label/Badge/Table/Tooltip/Select +
   Typography). Replace headings/text with `Typography`.
3. Replace every layout `className` (flex/grid/gap/padding/width) with **layout primitives**
   (`Box/Stack/Inline/Grid/Container`). No raw `className`/`style`.
4. `orders-filter.tsx` and any other `<select>` → DS `Select`.
5. Status colors (`order-status-badge.tsx`) → `Badge` variants / token tones; no hardcoded hex.
6. Remove dead imports (`cn`, `lucide` stays — icons are fine as children).

## Acceptance criteria

- [ ] No `@/components/ui/*` imports anywhere under `app/admin` / `components/admin`.
- [ ] `grep -rn "className=" app/admin components/admin` ≈ empty (only DS primitives + typed props).
- [ ] Admin visually matches today (like-for-like) in light + dark.
- [ ] **Sidebar stays pinned to the top while a long page scrolls; header stays sticky;** collapse/
      expand + persistence still work.
- [ ] `pnpm build:website` + `pnpm test` pass.

## Verification

```bash
pnpm dev:website
grep -rn "@/components/ui/\|className=" app/admin components/admin   # expect ~empty
```
`preview_start` → an admin route with a long list (e.g. `/admin/orders` or `/admin/stories`) →
`preview_screenshot`; scroll via `preview_eval` (`window.scrollTo(0, 2000)`) or interact, then
screenshot again to **prove the sidebar is still pinned**. Toggle the collapse button
(`preview_click`) and dark mode. Console clean.

## Gotchas

- Icons (`lucide-react`) are fine as children of DS Button/primitives — don't try to tokenize them.
- `admin-dashboard-shell.tsx` is a client component (`'use client'`) — keep it; layout primitives
  work in client components.
- Don't redesign. If the current look relies on a subtle Tailwind value with no token, prefer the
  nearest token; only add a token if genuinely missing (and then ask, per rule #7 — unless it's a
  layout value, which Phase 0's sprinkles should already cover).
- Keep the Tailwind bridge intact — other areas still need it.
