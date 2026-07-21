# Phase 2 — Typography component (the hierarchy fix)

> Prereq: Phase 1 tokens exist. This phase builds the single component that owns
> all text styling, killing the ~208 scattered `text-{size}` usages and the 20
> ad-hoc `font-heading` applications.

## Goal

One `Typography` component whose `variant` prop is the **only** way to set text style. No consumer ever writes a font-size class again. The full hierarchy is reachable, named, and editable in one place.

## Why this is the priority

Today: headings are `<h2 className="font-heading text-3xl sm:text-4xl ...">` repeated inconsistently; `SectionHeading` is redefined inline in the landing. There is no scale — sizes drift per page. This component makes the scale a closed set.

## Scale (define values here or in Phase 1's contract — keep ONE source)

Editorial / postal-modernist hierarchy per `moodboard/prompt.md`: strong condensed headings (Futura), airy neutral body (Archivo). Suggested starting scale (tune in the showcase):

| variant | element default | font | size (clamp) | weight | transform / tracking |
|---|---|---|---|---|---|
| `display` | `h1` | heading | `clamp(2.5rem, 6vw, 5rem)` | bold | uppercase, widest |
| `h1` | `h1` | heading | `clamp(2rem, 4vw, 3.25rem)` | bold | uppercase, wide |
| `h2` | `h2` | heading | `clamp(1.6rem, 3vw, 2.25rem)` | bold | uppercase, wide |
| `h3` | `h3` | heading | `1.5rem` | semibold | uppercase, normal |
| `h4` | `h4` | heading | `1.25rem` | semibold | normal |
| `h5` | `h5` | heading | `1.05rem` | semibold | normal |
| `h6` | `h6` | heading | `0.95rem` | semibold | uppercase, wide |
| `lead` | `p` | body | `1.25rem` | regular | normal |
| `bodyLg` | `p` | body | `1.125rem` | regular | normal |
| `body` | `p` | body | `1rem` | regular | normal |
| `bodySm` | `p` | body | `0.875rem` | regular | normal |
| `caption` | `span` | body | `0.8125rem` | regular | normal |
| `overline` | `span` | body | `0.75rem` | medium | uppercase, widest |

> These are starting points — verify legibility and rhythm on the showcase page, then lock. Bind every value to a `vars.fontSize.*` / `vars.lineHeight.*` / `vars.fontWeight.*` / `vars.letterSpacing.*` token. **No raw values in the component.**

## Files

- `packages/ds/src/components/Typography/Typography.css.ts` — a vanilla-extract `recipe`:
  ```ts
  import { recipe } from '@vanilla-extract/recipes';
  import { vars } from '../../theme/tokens';

  export const typography = recipe({
    base: { margin: 0, color: vars.color.foreground },
    variants: {
      variant: {
        display: { fontFamily: vars.font.heading, fontSize: vars.fontSize.display, lineHeight: vars.lineHeight.display, fontWeight: vars.fontWeight.bold, textTransform: 'uppercase', letterSpacing: vars.letterSpacing.widest },
        // …one entry per variant from the table…
      },
      tone: {
        default: { color: vars.color.foreground },
        muted: { color: vars.color.mutedForeground },
        primary: { color: vars.color.primary },
        onAccent: { color: vars.color.accentForeground },
      },
      align: { left: { textAlign: 'left' }, center: { textAlign: 'center' }, right: { textAlign: 'right' } },
    },
    defaultVariants: { variant: 'body', tone: 'default' },
  });
  ```
- `packages/ds/src/components/Typography/Typography.tsx` — polymorphic, recipe-driven:
  ```tsx
  import { createElement } from 'react';
  import { typography } from './Typography.css';
  import type { RecipeVariants } from '@vanilla-extract/recipes';

  type Variants = NonNullable<RecipeVariants<typeof typography>>;
  const defaultTag: Record<string, string> = {
    display: 'h1', h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6',
    lead: 'p', bodyLg: 'p', body: 'p', bodySm: 'p', caption: 'span', overline: 'span',
  };

  export type TypographyProps = Variants & {
    as?: keyof JSX.IntrinsicElements;
    children: React.ReactNode;
    id?: string;
  };

  export function Typography({ variant = 'body', tone, align, as, children, ...rest }: TypographyProps) {
    const Tag = as ?? defaultTag[variant!] ?? 'p';
    return createElement(Tag, { className: typography({ variant, tone, align }), ...rest }, children);
  }
  ```
  > **Lock-down:** `TypographyProps` deliberately omits `className` and `style`. Only `as`, the recipe variants, and a small safe allowlist (`id`, ARIA props) are forwarded. This is the boundary the project needs.

- Export from `src/index.ts`: `export { Typography } from './components/Typography/Typography'; export type { TypographyProps } from '...';`

## Optional convenience exports

If ergonomics demand it, add thin wrappers (`Heading`, `Text`) that pin `variant` ranges — but the canonical API is `Typography variant="…"`. Don't fragment the surface; keep wrappers minimal.

## Acceptance criteria

- [ ] Every variant in the table renders with the correct size/weight/transform, all from tokens.
- [ ] `Typography` accepts **no** `className`/`style` (TS error if passed).
- [ ] `as` allows semantic override (e.g. `variant="h1" as="h2"`).
- [ ] `tone` and `align` work.
- [ ] Renders in a server component (no `'use client'`).
- [ ] `pnpm build:website` passes. (Showcase wiring is Phase 4 — a temporary render is fine to verify, then remove.)

## Verification

Temporarily render a column of all variants in the landing or a scratch route; `preview_screenshot` to eyeball the hierarchy in light + dark; confirm clean console. Remove the scratch usage before finishing (the permanent showcase is Phase 4).

## Gotchas

- `JSX.IntrinsicElements` typing for `as` can get verbose — constrain to a sensible union (`'h1'|'h2'|'h3'|'h4'|'h5'|'h6'|'p'|'span'|'label'|'div'`) rather than all elements.
- Don't leak `fontFamily` literals — always `vars.font.heading`/`vars.font.body`.
- This component supersedes the inline `SectionHeading` in `home-landing.tsx`; that removal happens in Phase 5.
