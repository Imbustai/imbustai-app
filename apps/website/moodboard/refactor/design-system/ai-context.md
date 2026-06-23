# `@imbustai/ds` — AI Context

> **Read this before touching any website UI.** This is the contract for all UI
> work after the design-system refactor. It is authored during Phase 4 and kept
> in sync whenever the DS surface changes. Sections marked _(fill in Phase N)_
> are completed as the package is built — until then, treat the **rules** below
> as binding and the values as forthcoming.

---

## 0. Hard rules (non-negotiable)

1. **All website UI uses `@imbustai/ds`.** Do not add or restore shadcn components in `apps/website/components/ui/*`. Do not install new component libraries.
2. **Never pass `className` or `style` to a DS component.** They don't accept them by design. Compose layout with wrapper elements, not by styling primitives.
3. **Never hardcode colors, font sizes, spacing, or radii.** Use a token (`vars.*` inside `.css.ts`, or the matching Tailwind token in legacy pages). If a value is missing, **add a token to the contract + bridge** (and update this doc) — never inline it.
4. **Text is always `Typography`.** No raw `text-{size}` / `font-heading` classes anywhere new.
5. **One import path:** `import { Button, Typography, ... } from '@imbustai/ds'`. No deep imports.
6. **Tokens are an API.** Renaming a `--ds-*` variable means editing the DS theme **and** `apps/website/app/global.css` (the Tailwind bridge) **and** this doc.
7. **Never modify the DS without asking.** When building UI, first check: can existing components and tokens cover what's needed? If yes, use them. If not, **stop and ask the user** before touching the DS. Present what you need: a new component, a new prop/variant on an existing component, a new token, or a token alias change. Explain why the current surface doesn't cover the case. Only proceed after explicit approval.

---

## 1. Architecture (one-paragraph)

`@imbustai/ds` is a source-only workspace package (no build step) styled with **vanilla-extract** (typed tokens + zero-runtime CSS + recipes). Tokens are the single source of truth, emitted as `--ds-*` CSS custom properties. The website still uses **Tailwind** for not-yet-migrated pages; its `@theme inline` in `global.css` is **bridged** onto the same `--ds-*` variables, so both systems read one token set. Fonts are loaded by the host (`app/layout.tsx`, `next/font/local`) and referenced by DS tokens. Themes: `imbustai` (light/dark) + `default` (shadcn neutral, light/dark).

---

## 2. Import surface

```ts
// Tokens & utilities
import { dsVars, dsStyle } from '@imbustai/ds';
// dsVars.color.*, dsVars.space.*, dsVars.radius.*, dsVars.shadow.*

// Typography
import { Typography, TYPOGRAPHY_SCALE } from '@imbustai/ds';
import type { TypographyProps, TypographyVariant } from '@imbustai/ds';

// Primitives
import { Button } from '@imbustai/ds';
import type { ButtonProps } from '@imbustai/ds';

import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@imbustai/ds';
import type { CardProps } from '@imbustai/ds';

import { Input } from '@imbustai/ds';
import type { InputProps } from '@imbustai/ds';

import { Label } from '@imbustai/ds';
import type { LabelProps } from '@imbustai/ds';

import { Badge } from '@imbustai/ds';
import type { BadgeProps } from '@imbustai/ds';
```

---

## 3. Token reference

### Color (semantic)

All accessed via `dsVars.color.*` or CSS var `--ds-color-*`.

| Token | Imbustai light | Purpose |
|---|---|---|
| `brand` | `#0057B8` | Raw brand blue (Poste) |
| `signal` | `#E53B2C` | Raw signal red |
| `highlight` | `#F6C500` | Raw accent yellow |
| `surface` | `#FAF7F0` | Raw paper color |
| `contrast` | `#111111` | Raw ink color |
| `background` | `#FAF7F0` | Page background |
| `foreground` | `#111111` | Default text |
| `card` / `cardForeground` | `#FFFFFF` / `#111111` | Card surface |
| `muted` / `mutedForeground` | `#F0EDE4` / `#555555` | Muted backgrounds & text |
| `border` | `color-mix(#111 15%)` | Borders |
| `input` | `color-mix(#111 20%)` | Input borders |
| `ring` | `#0057B8` | Focus ring |
| `primary` / `primaryForeground` | `#0057B8` / `#FFFFFF` | Primary actions |
| `secondary` / `secondaryForeground` | `#E53B2C` / `#FFFFFF` | Secondary actions |
| `accent` / `accentForeground` | `#F6C500` / `#111111` | Accent / highlight |
| `destructive` / `destructiveForeground` | `#E53B2C` / `#FFFFFF` | Destructive actions |
| `popover` / `popoverForeground` | `#FFFFFF` / `#111111` | Popover surfaces |

### Type
`font.heading` (Futura condensed, via `--font-futura-condensed`), `font.body` (Archivo, via `--font-archivo`).
`fontSize`: `display, h1, h2, h3, h4, body, caption, overline`. `lineHeight`: `tight, snug, normal, relaxed`.
`fontWeight`: `regular, medium, semibold, bold`. `letterSpacing`: `tight, normal, wide, widest`.

### Layout
`space`: `0,1,2,3,4,5,6,8,10,12,16,20,24`. `radius`: `none (0 — imbustai default), sm, md, lg, full`. `shadow`: `none, sm, md` (minimal — decorative shadows are off-brand).

### Bridge mapping (`--ds-*` ↔ Tailwind) — authoritative

_(keep in sync with Phase 1)_

| DS token | CSS var | Tailwind token |
|---|---|---|
| color.background | `--ds-color-background` | `--color-background` |
| color.foreground | `--ds-color-foreground` | `--color-foreground` |
| color.primary(+fg) | `--ds-color-primary(-foreground)` | `--color-primary(-foreground)` |
| color.secondary(+fg) | `--ds-color-secondary(-foreground)` | `--color-secondary(-foreground)` |
| color.accent(+fg) | `--ds-color-accent(-foreground)` | `--color-accent(-foreground)` |
| color.muted(+fg) | `--ds-color-muted(-foreground)` | `--color-muted(-foreground)` |
| color.border/input/ring | `--ds-color-border/input/ring` | matching |
| color.destructive(+fg) | `--ds-color-destructive(-foreground)` | matching |
| color.card(+fg) | `--ds-color-card(-foreground)` | matching |
| font.heading/body | `--ds-font-heading/body` | `--font-heading` / `--font-sans` |

---

## 4. Component reference

### Typography

`<Typography variant tone? align? as? id?>` — **the only text component.** No `className`.

| Prop | Type | Default | Values |
|---|---|---|---|
| `variant` | `TypographyVariant` | `'body'` | `display \| h1 \| h2 \| h3 \| h4 \| body \| caption \| overline` |
| `tone` | `string` | `'default'` | `default \| muted \| primary \| onAccent` |
| `align` | `string` | — | `left \| center \| right` |
| `as` | `AllowedTag` | auto from variant | `h1 \| h2 \| h3 \| h4 \| p \| span \| label \| div` |

Default tags: `display→h1`, `h1–h4→matching`, `body→p`, `caption/overline→span`.

Heading variants (`display–h3`) use `font-heading` (Futura Condensed), uppercase, tracked. `h4` uses heading font without uppercase. Body variants use `font-body` (Archivo).

### Button

`<Button variant? size? asChild? fullWidth? disabled? onClick? type? id?>`

| Prop | Type | Default | Values |
|---|---|---|---|
| `variant` | `string` | `'primary'` | `primary \| secondary \| accent \| outline \| ghost \| link \| destructive` |
| `size` | `string` | `'md'` | `sm \| md \| lg \| icon` |
| `fullWidth` | `boolean` | — | `true` for 100% width |
| `asChild` | `boolean` | — | Renders children via Radix `Slot` (for `next/link`) |

Sharp corners (imbustai radius=0). Accepts `disabled`, `type`, standard mouse/keyboard/focus events, and `aria-*` props.

### Card

Compound component: `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription`.

| Component | Props | Notes |
|---|---|---|
| `Card` | `tone?: 'default' \| 'muted'`, `bordered?: boolean` | Default: `tone='default'`, `bordered=true` |
| `CardTitle` | `children`, `id?`, `aria-*` | Renders `Typography variant="h3"` |
| `CardDescription` | `children`, `id?`, `aria-*` | Renders `Typography variant="caption" tone="muted"` |
| `CardHeader/Content/Footer` | `children`, `id?`, `aria-*` | Layout containers |

### Input

`<Input invalid? id? type? name? placeholder? disabled? ...nativeProps>`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `invalid` | `boolean` | — | Adds destructive border + `aria-invalid` |

Accepts all standard `<input>` props (value, defaultValue, onChange, onFocus, onBlur, etc.) and `aria-*`.

### Label

`<Label htmlFor? id? children>`

Renders as `<label>` styled with `Typography caption`. Always pair with an `Input` via `htmlFor`.

### Badge

`<Badge variant? id? children>`

| Prop | Type | Default | Values |
|---|---|---|---|
| `variant` | `string` | `'default'` | `default \| primary \| secondary \| accent \| outline \| destructive` |

---

## 5. Typography decision guide

| Use | Variant |
|---|---|
| Hero headline | `display` |
| Page / major section title | `h1` / `h2` |
| Subsection title | `h3` / `h4` |
| Card title | (handled by `CardTitle`) |
| Default body copy | `body` |
| Fine print, metadata | `caption` |
| Eyebrow / kicker / step label | `overline` |

---

## 6. Do / Don't

```tsx
// ❌ DON'T
<button className="bg-primary px-4 py-2 rounded-md text-sm">Buy</button>
<h2 className="font-heading text-3xl sm:text-4xl">How it works</h2>
<Button className="mt-4 w-full">Send</Button>
<div style={{ color: '#0057B8' }}>...</div>

// ✅ DO
<Button variant="primary" size="md">Buy</Button>
<Typography variant="h2">How it works</Typography>
<div className="mt-4"><Button variant="primary" fullWidth>Send</Button></div>  // spacing on wrapper
<Typography variant="body" tone="primary">...</Typography>
```

- Layout/spacing belongs on **wrapper elements** (Tailwind in legacy pages, or layout primitives), never on DS components.
- Need a style the variants don't cover? Add a **token/variant to the DS** and update this doc — don't escape-hatch.

---

## 7. Migration recipe (for deferred surfaces: shop, admin, auth, play, games)

Run **one surface per session**:

1. `grep -rn "@/components/ui/\|font-heading\|text-[0-9x]\|landing-" <surface-dir>` — inventory.
2. Replace `@/components/ui/*` imports with `@imbustai/ds` equivalents.
3. Replace every heading/paragraph with `Typography` (use §5).
4. Replace CTAs/cards/inputs with DS primitives; move spacing/layout classes to wrappers.
5. Delete now-dead `--landing-*` / bespoke tokens **after** grep shows zero references (repo-wide, not just this surface).
6. Verify: `pnpm build:website`, preview the route (light + dark + palette), console clean, `pnpm test`.

When all surfaces are migrated: retire `apps/website/components/ui/*` and, finally, the Tailwind bridge (dedicated cleanup session).

---

## 8. Maintenance

- This file is the brief every future UI/AI session reads first. **Update it in the same change** that alters tokens, adds a component, or changes a variant. If it drifts, downstream work drifts.
- Mirror its rules into the project root `CLAUDE.md` (a short "UI = @imbustai/ds, see ai-context.md" pointer) when the DS is adopted, so sessions are routed here.
