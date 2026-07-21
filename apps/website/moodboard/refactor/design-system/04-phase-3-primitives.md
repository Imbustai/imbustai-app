# Phase 3 — Core primitives (locked-down)

> Prereq: Phase 2 (Typography) done. This phase ports the foundational UI
> primitives into `@imbustai/ds` as vanilla-extract recipes with a **constrained
> API** — the "solid, globally-editable interface" requirement.

## Goal

Production-ready Button, Card, Input, Label, Badge in `@imbustai/ds`, each styled only from tokens, each exposing a closed set of variant props and **no arbitrary `className`**. Table + Tooltip if time remains.

## Source to port (current shadcn versions)

| Component | Current file | Usage count |
|---|---|---|
| Button | `apps/website/components/ui/button.tsx` | 22 imports |
| Badge | `apps/website/components/ui/badge.tsx` | 10 |
| Card | `apps/website/components/ui/card.tsx` | 9 |
| Input | `apps/website/components/ui/input.tsx` | 7 |
| Label | `apps/website/components/ui/label.tsx` | 6 |
| Table | `apps/website/components/ui/table.tsx` | 4 *(defer if time)* |
| Tooltip | `apps/website/components/ui/tooltip.tsx` | 1 *(defer if time)* |

Read each to preserve behavior (e.g. Button's `asChild` via Radix `Slot`, `data-slot` attributes, icon sizing).

## Lock-down policy (apply to all)

- Expose **only** named variant props. Drop `className` and `style` from the public type. If an unavoidable escape hatch exists, it must be a *named, documented* prop (e.g. `fullWidth`), never raw styles.
- Forward only safe pass-through: native handlers (`onClick`, `type`, `disabled`, `name`, `value`, `aria-*`, `id`, `ref`). Strip everything else.
- All visual values come from `vars.*`. No inline hex/px.

## Per-component spec

### Button (`components/Button/`)
Recipe variants (preserve current intents, map to tokens):
- `variant`: `primary` (bg primary / primaryForeground), `secondary` (signal red), `accent` (yellow / ink), `outline` (border + transparent bg), `ghost` (transparent, hover muted), `link` (primary, underline on hover), `destructive`.
- `size`: `sm`, `md` (default), `lg`, `icon`.
- **Sharp corners** (`radius.none`) — imbustai brand. Remove the `!important` border-radius hack from `global.css` once Button owns this.
- `asChild?: boolean` via `@radix-ui/react-slot` (so `<Button asChild><Link/></Button>` works — heavily used).
- `fullWidth?: boolean` (named escape hatch).
- Hover: subtle, no decorative shadow (`shadow.none`/`sm`). Respect `prefers-reduced-motion`.

### Card (`components/Card/`)
- `Card`, `CardHeader`, `CardContent`, `CardFooter`, plus `CardTitle`/`CardDescription` that **render via `Typography`** (`h3`/`bodySm muted`) — don't reinvent text styling.
- `tone?`: `default` (card bg) | `muted`. Optional `bordered?` (default true). No decorative shadow by default.

### Input (`components/Input/`)
- Single recipe; states: default, focus (ring), invalid (`aria-invalid`), disabled. Tokens: `input` border, `ring`, `background`/`foreground`.
- Props: native input props allowlist + `invalid?: boolean`.

### Label (`components/Label/`)
- Built on `Typography` (`overline` or `bodySm medium`). Associates via `htmlFor`.

### Badge (`components/Badge/`)
- `variant`: `default`, `primary`, `secondary`, `accent`, `outline`, `destructive`. Small, uppercase (`overline`-like). Sharp corners.

### Table / Tooltip (if time)
- Table: thin recipe wrappers (`Table`, `THead`, `TBody`, `Tr`, `Th`, `Td`) using border/muted tokens.
- Tooltip: wrap `@radix-ui/react-tooltip` (already a dep) with token styling. This one needs `'use client'`.

## Public surface (`src/index.ts`)

```ts
export { Typography } from './components/Typography/Typography';
export { Button } from './components/Button/Button';
export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from './components/Card/Card';
export { Input } from './components/Input/Input';
export { Label } from './components/Label/Label';
export { Badge } from './components/Badge/Badge';
// + Table/Tooltip if done
// + types
```

## Acceptance criteria

- [ ] All five core primitives ported, styled only from tokens, sharp corners where brand-appropriate.
- [ ] No DS component accepts arbitrary `className`/`style` (TS errors if passed).
- [ ] `Button asChild` works with `next/link`.
- [ ] `CardTitle`/`CardDescription` render through `Typography`.
- [ ] All exported from `@imbustai/ds`; deep imports unnecessary.
- [ ] `!important` border-radius hack removed from `global.css` (Button owns corners now) — **only if** no legacy page regresses (grep button usage; legacy Tailwind buttons may still rely on it → if so, leave the hack until Phase 5/6 and note it).
- [ ] `pnpm build:website` + `pnpm test` pass.

## Verification

Render each component with all variants on a scratch route (or wait for Phase 4 showcase). `preview_screenshot` light + dark; test a Button click and an Input focus with `preview_click`/`preview_fill`; clean console.

## Gotchas

- The current Button relies on Tailwind classes like `focus-visible:ring-[3px]` — reproduce focus rings with token-based box-shadow in VE.
- Removing `className` will break any *current* call site that passes one — **but DS components aren't used by the app yet** (only `components/ui/*` are). Call sites migrate in Phase 5+. So this is safe now.
- Keep `data-slot` attributes if any tooling/analytics relies on them (check before dropping).
