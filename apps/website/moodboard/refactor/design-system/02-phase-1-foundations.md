# Phase 1 — Foundations: typed tokens, themes, Tailwind bridge

> Prereq: Phase 0 done (package renders styled). This phase defines **the token
> contract** (the API everything else depends on), implements the imbustai +
> default themes, and bridges Tailwind so legacy pages keep working unchanged.

## Goal

A single, small, **semantic** token scale — typed in TS, autocompleted, with no arbitrary values — replacing the ~40 one-off `--landing-*` variables. Light/dark + imbustai/default themes switch correctly, and the existing landing still renders through the bridge.

## The token contract (`src/theme/contract.css.ts`)

Use `createThemeContract`. Keep it **small** — this is a scale, not a per-section dump. Proposed shape:

```ts
import { createThemeContract } from '@vanilla-extract/css';

export const vars = createThemeContract({
  color: {
    // raw brand (rarely used directly; prefer semantic below)
    postBlue: null,
    signalRed: null,
    accentYellow: null,
    paper: null,
    ink: null,
    // semantic surfaces
    background: null,
    foreground: null,
    card: null,
    cardForeground: null,
    muted: null,
    mutedForeground: null,
    border: null,
    input: null,
    ring: null,
    // intents (bg + matching foreground)
    primary: null,
    primaryForeground: null,
    secondary: null,
    secondaryForeground: null,
    accent: null,
    accentForeground: null,
    destructive: null,
    destructiveForeground: null,
  },
  font: {
    heading: null,   // → references --font-heading (host-provided)
    body: null,      // → references --font-sans (host-provided)
  },
  fontSize: {
    // value + lineHeight pairs live in the typography scale (Phase 2 reads these)
    display: null, h1: null, h2: null, h3: null, h4: null, h5: null, h6: null,
    lead: null, bodyLg: null, body: null, bodySm: null, caption: null, overline: null,
  },
  lineHeight: {
    display: null, h1: null, h2: null, h3: null, h4: null, h5: null, h6: null,
    lead: null, bodyLg: null, body: null, bodySm: null, caption: null, overline: null,
  },
  fontWeight: { regular: null, medium: null, semibold: null, bold: null },
  letterSpacing: { tight: null, normal: null, wide: null, widest: null },
  space: { '0': null, '1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '8': null, '10': null, '12': null, '16': null, '20': null, '24': null },
  radius: { none: null, sm: null, md: null, lg: null, full: null },
  shadow: { none: null, sm: null, md: null }, // keep minimal — moodboard removes decorative shadows
});
```

> The exact size values are decided in **Phase 2** (typography) — but define the *keys* here so the contract is stable. Use placeholder values now (e.g. clamp-based scale) and let Phase 2 tune them, OR define the full scale here and have Phase 2 only build the component. Recommended: **define the full numeric scale here** (one source of truth) so Phase 2 is pure component work. See the proposed scale in [`03-phase-2-typography.md`](03-phase-2-typography.md) §"Scale".

## Themes (`src/theme/*.css.ts`)

`createTheme(vars, {...})` per theme. **Reuse the hex values already in `app/global.css`** (both light and dark imbustai blocks are fully specified there — lines ~258–370).

- `imbustai-light.css.ts` → `imbustaiLight` (class)
- `imbustai-dark.css.ts` → `imbustaiDark`
- `default-light.css.ts` → `defaultLight` (shadcn neutral oklch, from `global.css` lines ~76–162)
- `default-dark.css.ts` → `defaultDark`

Fonts: `font.heading` → `'var(--font-futura-condensed), Futura, ui-sans-serif, system-ui, sans-serif'`, `font.body` → `'var(--font-archivo), ui-sans-serif, system-ui, sans-serif'`. These `--font-*` vars are provided by `layout.tsx` via `next/font/local` (already wired). **DS never imports fonts.**

Export from `src/theme/tokens.ts` (re-export `vars`) and from `src/index.ts`:
```ts
export { vars } from './theme/tokens';
export { imbustaiLight, imbustaiDark, defaultLight, defaultDark } from './theme/...';
```

## Apply the theme in the website

In `app/layout.tsx`, add the active theme class to `<html>` alongside the existing attributes:
```tsx
import { imbustaiLight } from '@imbustai/ds';
// ...
<html lang="it" data-palette="imbustai" className={`${imbustaiLight} ${fontVars}`} ...>
```
> **Dark mode reconciliation:** the website uses `next-themes` `.dark`. Two valid approaches — pick one and document it:
> 1. **Single class + nested dark vars:** define dark overrides inside the same theme file scoped under `.dark` using VE's `globalStyle`/selector. Simpler markup.
> 2. **Swap the class:** a small client wrapper swaps `imbustaiLight`↔`imbustaiDark` based on `next-themes`. More explicit, costs a client boundary at the root.
>
> Recommended: **approach 1** (keep dark as scoped overrides) to avoid a root client boundary and stay aligned with the existing `.dark` mechanism.

## The Tailwind bridge (critical)

Legacy pages still use Tailwind utilities resolved through `global.css` `@theme inline`. Make Tailwind read the **same** variables the DS theme writes.

1. `createTheme` emits CSS custom properties with **generated** names. To make them stable/bridgeable, either:
   - use `createGlobalTheme` with **explicit** custom-property names (recommended for the bridge — you control the names), **or**
   - keep `createTheme` but map its generated vars in `global.css` (brittle).
   > Recommended: **`createGlobalThemeContract` + `createGlobalTheme`** with explicit names like `--ds-color-primary`, `--ds-font-heading`, so both VE and Tailwind reference `--ds-*`.
2. Rewrite `global.css` `@theme inline` so each Tailwind token points at a `--ds-*` var:
   ```css
   @theme inline {
     --color-background: var(--ds-color-background);
     --color-foreground: var(--ds-color-foreground);
     --color-primary: var(--ds-color-primary);
     /* …one line per bridged token… */
     --font-sans: var(--ds-font-body);
     --font-heading: var(--ds-font-heading);
   }
   ```
3. **Delete superseded `--landing-*` variables** only where nothing still references them. Grep first: `grep -rn "landing-" apps/website` — the landing components still use many (`bg-landing-hero`, etc.). **Do not break the landing here** — it's migrated in Phase 5. Remove a `--landing-*` var only after confirming zero usages. Most will survive until Phase 5; that's expected.

### Mapping table (keep authoritative — this is the bridge API)

| DS token (`vars.color.*`) | CSS var | Tailwind token |
|---|---|---|
| `background` | `--ds-color-background` | `--color-background` |
| `foreground` | `--ds-color-foreground` | `--color-foreground` |
| `primary` | `--ds-color-primary` | `--color-primary` |
| `primaryForeground` | `--ds-color-primary-foreground` | `--color-primary-foreground` |
| `secondary` | `--ds-color-secondary` | `--color-secondary` |
| `secondaryForeground` | `--ds-color-secondary-foreground` | `--color-secondary-foreground` |
| `accent` | `--ds-color-accent` | `--color-accent` |
| `accentForeground` | `--ds-color-accent-foreground` | `--color-accent-foreground` |
| `muted` | `--ds-color-muted` | `--color-muted` |
| `mutedForeground` | `--ds-color-muted-foreground` | `--color-muted-foreground` |
| `border` | `--ds-color-border` | `--color-border` |
| `input` | `--ds-color-input` | `--color-input` |
| `ring` | `--ds-color-ring` | `--color-ring` |
| `destructive` | `--ds-color-destructive` | `--color-destructive` |
| `destructiveForeground` | `--ds-color-destructive-foreground` | `--color-destructive-foreground` |
| `card` | `--ds-color-card` | `--color-card` |
| `cardForeground` | `--ds-color-card-foreground` | `--color-card-foreground` |
| `popover` | `--ds-color-popover` | `--color-popover` |
| `popoverForeground` | `--ds-color-popover-foreground` | `--color-popover-foreground` |
| `typography.fontFamily.heading` | `--ds-typography-font-family-heading` | `--font-heading` |
| `typography.fontFamily.body` | `--ds-typography-font-family-body` | `--font-sans` |
| `radius.sm` | `--ds-radius-sm` | `--radius-sm` |
| `radius.md` | `--ds-radius-md` | `--radius` / `--radius-md` |
| `radius.lg` | `--ds-radius-lg` | `--radius-lg` / `--radius-xl` |

> Extend this table as tokens are added. **Renaming a `--ds-*` var = editing both the theme file and `global.css`.**

## Acceptance criteria

- [ ] `vars.*` autocompletes in TS; using a non-existent token is a type error.
- [ ] imbustai light + dark + default themes defined via `createGlobalTheme` (or `createTheme`) with explicit `--ds-*` names.
- [ ] `global.css` `@theme inline` bridges Tailwind tokens onto `--ds-*`.
- [ ] **The existing landing still renders identically** (palette + dark toggle work) — bridge proven.
- [ ] No new arbitrary hex values introduced outside the theme files.
- [ ] `pnpm build:website` + `pnpm test` pass.

## Verification

```bash
pnpm build:website && pnpm dev:website
grep -rn "landing-" apps/website   # inventory what still depends on legacy vars
```
Preview `/`, toggle dark mode and `data-palette`, confirm unchanged appearance + clean console.

## Gotchas

- Prefer `createGlobalTheme`/`createGlobalThemeContract` for **stable, bridgeable** var names. Plain `createTheme` generates hashed names that are painful to bridge.
- Don't delete `--landing-*` vars the landing still uses — Phase 5 owns that cleanup.
- Keep `default` theme: it's the fallback and proves the contract isn't imbustai-specific.
