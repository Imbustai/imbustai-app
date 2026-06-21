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

---

## 1. Architecture (one-paragraph)

`@imbustai/ds` is a source-only workspace package (no build step) styled with **vanilla-extract** (typed tokens + zero-runtime CSS + recipes). Tokens are the single source of truth, emitted as `--ds-*` CSS custom properties. The website still uses **Tailwind** for not-yet-migrated pages; its `@theme inline` in `global.css` is **bridged** onto the same `--ds-*` variables, so both systems read one token set. Fonts are loaded by the host (`app/layout.tsx`, `next/font/local`) and referenced by DS tokens. Themes: `imbustai` (light/dark) + `default` (shadcn neutral, light/dark).

---

## 2. Import surface

_(fill in Phase 3/4 — copy verbatim from `packages/ds/src/index.ts`)_

```ts
// expected, keep current:
export { Typography } from '@imbustai/ds';
export { Button, Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@imbustai/ds';
export { Input, Label, Badge } from '@imbustai/ds';
// + Table/Tooltip if shipped
export { vars, imbustaiLight, imbustaiDark, defaultLight, defaultDark } from '@imbustai/ds';
```

---

## 3. Token reference

_(fill in Phase 1 with final values)_

### Color (semantic)
`background, foreground, card(+Foreground), muted(+Foreground), border, input, ring, primary(+Foreground), secondary(+Foreground), accent(+Foreground), destructive(+Foreground)`
Raw brand: `postBlue #0057B8`, `signalRed #E53B2C`, `accentYellow #F6C500`, `paper #FAF7F0`, `ink #111111`.

### Type
`font.heading` (Futura condensed, via `--font-futura-condensed`), `font.body` (Archivo, via `--font-archivo`).
`fontSize` / `lineHeight`: `display, h1–h6, lead, bodyLg, body, bodySm, caption, overline`.
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

_(fill prop tables in Phase 3; structure below is the template)_

### Typography
`<Typography variant tone? align? as?>` — **the only text component.** No `className`.
- `variant`: `display | h1 | h2 | h3 | h4 | h5 | h6 | lead | bodyLg | body | bodySm | caption | overline`
- `tone`: `default | muted | primary | onAccent`
- `align`: `left | center | right`
- `as`: semantic element override (`h1–h6 | p | span | label | div`)

### Button
`<Button variant size? asChild? fullWidth? disabled onClick>`
- `variant`: `primary | secondary | accent | outline | ghost | link | destructive`
- `size`: `sm | md | lg | icon` · sharp corners · `asChild` for `next/link`.

### Card
`Card`, `CardHeader`, `CardTitle` (→Typography h3), `CardDescription` (→Typography bodySm muted), `CardContent`, `CardFooter`. Props: `tone? (default|muted)`, `bordered?`.

### Input / Label / Badge
- `Input`: native props + `invalid?`. `Label`: `htmlFor`, text via Typography. `Badge`: `variant: default|primary|secondary|accent|outline|destructive`.

---

## 5. Typography decision guide

| Use | Variant |
|---|---|
| Hero headline | `display` |
| Page / major section title | `h1` / `h2` |
| Subsection title | `h3` / `h4` |
| Card title | (handled by `CardTitle`) |
| Intro paragraph under a heading | `lead` |
| Default body copy | `body` (or `bodyLg` for emphasis) |
| Fine print, metadata | `bodySm` / `caption` |
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
