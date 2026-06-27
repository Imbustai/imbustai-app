# Phase 0 — Foundations: layout primitives + missing components

> Prereq: read [`README.md`](README.md) + the DS contract
> [`../design-system/ai-context.md`](../design-system/ai-context.md). This phase is the hard
> prerequisite for every migration: without layout primitives there is no way to remove Tailwind.

## Goal

Give `@imbustai/ds` a **typed, token-bound layout system** (sprinkles + primitives) and the three
components the app still needs from shadcn (**Table, Tooltip, Select**). After this phase, any page
can be rebuilt with **zero `className`**.

## Part A — sprinkles config

- Add `@vanilla-extract/sprinkles` to `packages/ds` deps.
- `packages/ds/src/layout/sprinkles.css.ts` — `defineProperties` + `createSprinkles`, **all values
  bound to existing tokens** (read the real token names from `packages/ds/src/theme/contract.css.ts`
  — use `vars.space`, `vars.radius`, etc.; do **not** invent values).
  - Non-responsive or responsive (your call) properties:
    `display` (`none|block|flex|grid|inline-flex`), `flexDirection`, `flexWrap`, `alignItems`,
    `justifyContent`, `gap` → `vars.space`, `padding`/`paddingX/Y/Top/...` → `vars.space`,
    `margin*` → `vars.space` (+ `auto`), `position`, `width`/`maxWidth` (a small preset set incl.
    `100%` and a `container` max), `borderRadius` → `vars.radius`.
  - **Responsive conditions:** a *small* set only — `mobile` (default), `tablet`, `desktop` — with
    token-based breakpoints. Do not reproduce Tailwind's full scale.
- Export a typed `Sprinkles` type for primitives to consume.

## Part B — layout primitives

`packages/ds/src/components/layout/` — each is a thin component exposing **sprinkles props only**
(+ `as`), never raw `className`:

- **Box** — generic; all sprinkles props + polymorphic `as`.
- **Stack** — vertical flow; `gap` prop (→ space token), `align`/`justify` passthrough.
- **Inline** (a.k.a. Cluster) — horizontal, wraps; `gap`, `align`.
- **Grid** — `columns` (preset counts) + `gap`.
- **Container** — centered max-width wrapper (`maxWidth` preset, `marginX: auto`, responsive padding).
- **Spacer** — flexible/space gap. **Divider** — token-styled rule (border color from `vars.color.border`).

Mirror the lock-down pattern already used by `Typography`/`Button` (read their `.tsx` for the
allowlist approach). Props are the typed sprinkles subset each primitive needs — passing an
arbitrary `className`/`style` must be a **type error**.

## Part C — missing components

Port to `packages/ds/src/components/`, token-styled, locked-down API (no `className`):

- **Table** — compound (`Table, TableHeader, TableBody, TableRow, TableHead, TableCell`); port
  `apps/website/components/ui/table.tsx` to vanilla-extract using `vars` (borders, muted, text via
  Typography tokens). Keep the horizontal-scroll wrapper.
- **Tooltip** — wrap `@radix-ui/react-tooltip` (already a dep). Export
  `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` (or a simplified single-component API
  — match how the admin shell uses it: trigger + content + provider). Needs `'use client'`.
- **Select** — styled **native `<select>`** wrapper (minimal, accessible): props = native select
  allowlist + `invalid?`. Token-styled border/ring/background like `Input`. (Note in `ai-context.md`
  that `@radix-ui/react-select` is the future upgrade only if custom option rendering is needed.)

## Part D — wire up + document

- Export everything from `packages/ds/src/index.ts` (primitives + Table/Tooltip/Select + `Sprinkles`
  type + a `sprinkles` fn if primitives don't fully cover a case).
- Add a **Layout** section + the three components to the `/design-system` showcase
  (`apps/website/app/design-system/page.tsx`).
- Update **`../design-system/ai-context.md`**: new components, layout primitives, sprinkles prop
  tables, and Do/Don't (e.g. ❌ `<div className="flex gap-4">` → ✅ `<Inline gap="4">`).

## Acceptance criteria

- [ ] `@vanilla-extract/sprinkles` installed; sprinkles config bound only to tokens (no arbitrary values).
- [ ] Box/Stack/Inline/Grid/Container/Spacer/Divider exist, exported, `className`/`style`-free APIs.
- [ ] Table, Tooltip, Select exist, token-styled, locked-down, exported.
- [ ] All render on `/design-system`; `ai-context.md` updated with their prop tables + Do/Don't.
- [ ] `pnpm build:website` + `pnpm test` pass; `/design-system` console clean (light + dark).

## Verification

```bash
pnpm install
pnpm build:website && pnpm dev:website
```
`preview_start` → `/design-system` → `preview_screenshot` (light + dark). Confirm a Tooltip opens
(`preview_click`/hover), a Select works, and the layout primitives render the showcase grids.

## Gotchas

- Sprinkles generates atomic CSS at build via the VE plugin — it's already wired; no config change.
- Don't over-scope sprinkles: layout/spacing/sizing only. **Text and color stay on Typography /
  component variants** (sprinkles must NOT expose `color`/`fontSize` — those are owned elsewhere,
  consistent with `dsStyle`'s blocked-property list).
- Keep primitives dumb: no business logic, just layout. Composition happens in the pages.
