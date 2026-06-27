# App migration off Tailwind → `@imbustai/ds`

> **Read this first, every session.** It is the map. Each phase has its own
> self-contained brief (`00-…` → `07-…`). A Sonnet session opens **this README +
> its phase doc + the DS contract** (`../design-system/ai-context.md`) — nothing
> else is required to start.

---

## 1. Where we are

The design-system package `@imbustai/ds` exists (vanilla-extract, typed tokens, locked-down
components) and the **landing** is migrated to it. But that migration only replaced
**components / typography / color** — every surface, **including the landing**, still uses
**Tailwind for layout** (flex/grid/gap/padding). The rest of the app (admin, shop, auth, games,
play) is still on shadcn `@/components/ui/*` + Tailwind.

## 2. Goal of this program

1. **Refactor admin** to `@imbustai/ds`, keeping the current admin UI (like-for-like, no
   redesign) + one new behaviour: the **sidebar sticky to the top** on scroll.
2. **Remove Tailwind from the entire repo.** Every surface on DS + DS layout primitives, then the
   Tailwind bridge, deps, and shadcn `ui/*` are deleted.

## 3. The core problem & the decision

Measured: ~**752** layout-utility occurrences across **54** files. DS has **no** layout
primitives and its components **forbid `className`**. So Tailwind can't just be deleted — layout
needs a home first.

**Decision (with user):** layout becomes **DS layout primitives built on
[`@vanilla-extract/sprinkles`](https://vanilla-extract.style/documentation/packages/sprinkles/)** —
typed, token-bound layout props, no arbitrary values, no raw `className`. "Owned Tailwind",
consistent with the locked-down DS. Plus three net-new components the DS lacks today: **Table,
Tooltip, Select**.

> These DS additions are net-new surface. **This program is the explicit approval** for them
> (satisfies `ai-context.md` rule #7). Anything *beyond* this list still requires asking.

## 4. Sequencing principle

Tailwind, the `@theme inline` bridge, and `components/ui/*` stay **intact until the final phase**.
Until then, unmigrated areas must keep rendering through the bridge. Each area is migrated in its
own phase, then the whole thing is torn down once `grep` proves zero Tailwind usage repo-wide.

```
Phase 0  Foundations: layout primitives (sprinkles) + Table/Tooltip/Select
Phase 1  Admin  (+ sticky sidebar)        ← first concrete area, user priority
Phase 2  Shop
Phase 3  Auth
Phase 4  Games
Phase 5  Play
Phase 6  Shared chrome + landing layout
Phase 7  Remove Tailwind + bridge + shadcn ui/*
```

## 5. Reference facts (from exploration — so you don't re-derive)

- **Admin:** 9 pages `app/admin/**`, 11 components `components/admin/**`. Heaviest:
  `components/admin/stories/story-editor-client.tsx` (774 lines), `admin-dashboard-shell.tsx`
  (286 — the sidebar lives here).
- **Sidebar:** `admin-dashboard-shell.tsx` outer shell is `flex min-h-screen`; the `<header>` is
  already `sticky top-0`, but the `<aside>` is a plain flex child and scrolls away. Fix = pin the
  `<aside>`: `position: sticky; top: 0; align-self: flex-start; height: 100dvh` with its own
  overflow, while `main` scrolls.
- **Other areas:** shop ~430 lines (`checkout-client.tsx` 273), auth ~440 (`register-form.tsx`
  105), games ~736 (`reply-workflow-panel.tsx` 394), play (`play-client.tsx` 419).
- **Shared chrome (app-wide):** `components/site-chrome*.tsx`, `site-header.tsx`,
  `theme-toggle.tsx`, `language-switcher.tsx`, `i18n-layout-shell.tsx`.
- **DS gaps:** Table (4 `ui/table` imports), Tooltip (admin shell), Select (7 native `<select>`).
  No Dialog/dropdown/recharts in components → low complexity.
- **DS surface today** (`packages/ds/src/index.ts`): `dsVars`, `dsStyle`, `Typography`, `Button`,
  `Card*`, `Input`, `Label`, `Badge`. Lock-down: no `className`/`style`.
- **Monorepo:** pnpm + Nx 22, source-only packages, Next 16 (Turbopack dev / webpack build).
  vanilla-extract wired with `unstable_turbopack: { mode: 'auto' }` — don't touch `next.config.js`.

## 6. Phase index

| Phase | Doc | Outcome |
|-------|-----|---------|
| 0 | [`00-phase-0-foundations.md`](00-phase-0-foundations.md) | Layout primitives + Table/Tooltip/Select; showcase + ai-context updated. |
| 1 | [`01-phase-1-admin.md`](01-phase-1-admin.md) | Admin on DS; sidebar pinned on scroll. |
| 2 | [`02-phase-2-shop.md`](02-phase-2-shop.md) | Shop on DS. |
| 3 | [`03-phase-3-auth.md`](03-phase-3-auth.md) | Auth on DS. |
| 4 | [`04-phase-4-games.md`](04-phase-4-games.md) | Games on DS. |
| 5 | [`05-phase-5-play.md`](05-phase-5-play.md) | Play on DS. |
| 6 | [`06-phase-6-chrome-landing.md`](06-phase-6-chrome-landing.md) | Shared chrome + landing layout off Tailwind. |
| 7 | [`07-phase-7-remove-tailwind.md`](07-phase-7-remove-tailwind.md) | Tailwind + bridge + shadcn deleted. |

**Run in order.** Each phase's acceptance criteria is the entry gate for the next. Phase 0 is a
hard prerequisite for everything (no layout primitives = no migration).

## 7. Global conventions (every phase)

- Obey the DS contract (`../design-system/ai-context.md`): **one import path**, **no
  `className`/`style` on DS components**, **tokens not values**, **ask before extending the DS**
  beyond what this program already approved (layout primitives + Table/Tooltip/Select).
- **Layout = layout primitives only.** `Box/Stack/Inline/Grid/Container/Spacer/Divider` expose
  typed sprinkles props — that's the only layout escape hatch. No raw `className`, no inline style.
- **Keep the bridge alive** until Phase 7. Don't remove Tailwind tokens an unmigrated area still
  uses (grep repo-wide before deleting any token).
- Like-for-like: preserve current behaviour/copy/structure; this program is a re-platforming, not
  a redesign (admin explicitly so).
- Build green every phase: `pnpm build:website` + `pnpm test`.

## 8. Verification (every phase)

```bash
pnpm build:website && pnpm dev:website     # preview affected routes, toggle dark mode
pnpm test
grep -rn "className=" <migrated-dir>        # ~empty after a phase (layout-primitive props are typed, not className)
```
Use `preview_*` tools for screenshots + interaction (e.g. confirm the admin sidebar stays pinned
while content scrolls). Never ask the user to verify manually.

## 9. Open considerations

- **Sprinkles responsive conditions:** define a *small* breakpoint set (mobile/tablet/desktop)
  bound to tokens — don't reproduce Tailwind's full scale. Minimal and intentional.
- **Select:** styled native `<select>` now; revisit `@radix-ui/react-select` only if a design
  needs custom option rendering.
- **`cn` / `clsx` / `tailwind-merge`:** dead once `ui/*` and Tailwind classes are gone — remove in
  Phase 7, not before (legacy areas still use them mid-migration).
- **DS `ai-context.md` is the live contract** — update it in Phase 0 (new components/primitives)
  and whenever the surface changes.
