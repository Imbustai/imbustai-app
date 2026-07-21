# Design System Refactor — `@imbustai/ds`

> **Read this file first, every session.** It is the map. Each phase has its own
> self-contained brief (`01-…` → `06-…`). A Sonnet session opens **this README +
> the one phase doc** assigned to it — nothing else is required to start.

---

## 1. Why we're doing this

The website UI grew without a system and is hard to keep "elastic". Concrete evidence in the current codebase:

- **No typography component.** ~**208** scattered `text-{size}` utility occurrences across `app/` + `components/`. `font-heading` is applied ad-hoc in **20** files. `SectionHeading` is redefined *inline* in `components/home-landing/home-landing.tsx`. Typographic hierarchy is the #1 pain point.
- **Token sprawl** — the real cause of "not elastic". `apps/website/app/global.css` defines **~40 bespoke single-use `--landing-*` variables** (`--landing-band-olive-accent`, `--landing-mock-caption`, `--landing-compare-weak-border`, …) plus a `!important` border-radius hack. This is shadcn *misused*: per-section tokens instead of a small semantic scale.
- **No component boundary.** The shadcn primitives in `components/ui/*` accept arbitrary `className`, so the "interface" can be overridden anywhere → impossible to evolve globally.

**Verdict on Tailwind:** the problem was never Tailwind itself — it was the lack of a token scale and a component boundary. We are nonetheless moving the **DS package to vanilla-extract** (typed tokens + zero-runtime CSS + recipes) because that *enforces* the discipline we were missing: tokens become typed objects (no arbitrary values), variants are the only API, and there is no free `className` to leak through. Tailwind stays in the website for legacy pages during the transition.

---

## 2. Decisions (locked)

1. **DS styling engine = [vanilla-extract](https://vanilla-extract.style/)** — typed token objects, zero-runtime CSS, `recipes` for variants (replaces `cva`). Integrated through `@vanilla-extract/next-plugin`. **Build tooling note (verified in Phase 0):** Next 16 uses **Turbopack for dev** and **webpack for production build**. The plugin is wired with `createVanillaExtractPlugin({ unstable_turbopack: { mode: 'auto' } })` so `.css.ts` compile in **both** modes. Do not remove that option — without it, styles silently fail in dev. (The `website-vercel-deploy` memory refers to the production build only, which is webpack.)
2. **Tokens live in `@imbustai/ds`** — single source of truth, portable theme.
3. **Tailwind stays in the website** for not-yet-migrated pages. **Bridge via CSS variables:** the DS ships a `theme.css` of custom properties; the website's `global.css` maps its Tailwind `@theme inline` onto the *same* variable names. One token set, two consumers, no duplication.
4. **Scope of this effort:** foundation + primitives + Typography + **landing migration** (end-to-end proof) + a precise **AI context doc**. Admin / shop / auth / play / games migrations are **deferred** (Phase 6+, documented but not executed).
5. **`/design-system` route:** a **static** page listing Foundations then each component with its variants. No interactive playground yet.

---

## 3. Target architecture

```
packages/ds/                      ← new, source-only (no build step)
  package.json                    ← name @imbustai/ds, main → ./src/index.ts
  tsconfig.json
  src/
    index.ts                      ← public surface (the ONLY import path consumers use)
    theme/
      contract.css.ts             ← createThemeContract: the token shape (the API)
      imbustai-light.css.ts       ← createTheme(...)  → class + theme.css vars
      imbustai-dark.css.ts
      default-light.css.ts        ← shadcn-neutral, kept as secondary theme
      default-dark.css.ts
      tokens.ts                   ← re-export `vars` (typed token accessor)
    components/
      Typography/                 ← Typography.tsx + Typography.css.ts (recipe)
      Button/                     ← Button.tsx + Button.css.ts
      Card/ Input/ Label/ Badge/  ← one folder each: .tsx + .css.ts
    utils/
      cx.ts                       ← tiny class joiner (clsx) — internal only

apps/website/
  next.config.js                  ← + vanilla-extract plugin, + '@imbustai/ds'
  app/global.css                  ← Tailwind @theme bridged onto DS variable names
  app/layout.tsx                  ← keeps next/font, applies the DS theme class
  app/design-system/page.tsx      ← static showcase
  components/**                    ← legacy (Tailwind) until later phases; landing migrated in Phase 5
```

### Theme application
- `layout.tsx` keeps `next/font/local` (ClashGrotesk, Archivo, FuturaCondensed) and exposes `--font-heading` / `--font-sans` CSS variables. **The DS does not load fonts** — it *references* those CSS vars in its tokens. This keeps font loading in the host (Next optimizes it) while the DS stays portable.
- The active theme is applied by adding the vanilla-extract theme **class** (returned by `createTheme`) to `<html>`, alongside the existing `data-palette` / `.dark` mechanism. The phase docs specify exactly how the two reconcile (Phase 1).

### The bridge is an API contract
Because Tailwind utility classes in legacy pages resolve through `global.css` `@theme inline`, the **DS variable names are a public contract**. Renaming a token means editing both the DS theme and the `global.css` mapping. Phase 1 ships a **mapping table**; keep it current.

---

## 4. Monorepo facts (so you don't re-discover them)

- pnpm + Nx 22, `workspace:*` deps, pnpm **catalog** for shared versions. Packages are **source-only**: `main`/`types` → `./src/index.ts`, **no build step**, consumed directly. Template to copy: `packages/i18n/`.
- The website (Next 16 / React 19) consumes packages via `transpilePackages` in `next.config.js` (currently `['@imbustai/i18n', '@imbustai/story-engine']`) — **`@imbustai/ds` must be added there**.
- `tsconfig.base.json` `paths` is empty `{}`; resolution is by pnpm symlink, not aliases. Nothing to add there.
- `next.config.js` shape: `module.exports = composePlugins(...plugins)(nextConfig)` from `@nx/next`. The VE plugin is a `(config) => config` function and slots into `plugins`.
- Tailwind v4 (CSS-based `@theme inline`), shadcn "new-york". PostCSS only runs `@tailwindcss/postcss` — VE does **not** use PostCSS, so they don't conflict.
- Existing palettes: `data-palette="imbustai"` (hardcoded in `layout.tsx`) and `data-palette="default"`. Dark mode via `next-themes` `.dark` class. Imbustai palette = `#0057B8` (blu Poste) / `#E53B2C` (rosso) / `#F6C500` (giallo) / `#FAF7F0` (carta) / `#111111` (nero). Sharp corners (radius 0).
- The repo already uses CSS Modules SCSS (`*.module.scss`, `sass` dep) — proof that co-located CSS compiles fine here.

---

## 5. Phase index

| Phase | Doc | Outcome |
|-------|-----|---------|
| 0 | [`01-phase-0-scaffold.md`](01-phase-0-scaffold.md) | `@imbustai/ds` package + vanilla-extract wired; smoke component renders. |
| 1 | [`02-phase-1-foundations.md`](02-phase-1-foundations.md) | Typed token contract, imbustai + default themes, Tailwind bridge, fonts contract. |
| 2 | [`03-phase-2-typography.md`](03-phase-2-typography.md) | `Typography` component — the hierarchy fix. |
| 3 | [`04-phase-3-primitives.md`](04-phase-3-primitives.md) | Locked-down Button, Card, Input, Label, Badge (+ Table/Tooltip if time). |
| 4 | [`05-phase-4-showcase-aicontext.md`](05-phase-4-showcase-aicontext.md) | Static `/design-system` page + `ai-context.md`. |
| 5 | [`06-phase-5-landing.md`](06-phase-5-landing.md) | Landing migrated to DS — end-to-end proof. |
| 6+ | *(deferred)* | Migrate shop · admin · auth · play · games, guided by `ai-context.md`. |

**Run phases in order.** Each phase's "Acceptance criteria" is the entry gate for the next.

---

## 6. Global conventions (apply in every phase)

- **One import path:** consumers import only from `@imbustai/ds`. Never deep-import (`@imbustai/ds/components/Button`).
- **Variants, not classes:** components expose constrained props (`variant`, `size`, `tone`, …). **No arbitrary `className` passthrough** on DS components. If an escape hatch is unavoidable, it must be a *named, documented* prop — never raw styles.
- **Tokens, not values:** inside `.css.ts`, always use `vars.*`. Never hardcode a hex/px that a token covers. If a value is missing, add a token to the contract (and the bridge), don't inline it.
- **Polymorphism via `as` / `asChild`:** use `@radix-ui/react-slot` for `asChild` (already a website dep) so a `<Button asChild><Link/></Button>` works.
- **Server-component friendly:** components must render without `'use client'` unless they genuinely need interactivity. The showcase page is a server component.
- **Accessibility + motion:** respect `prefers-reduced-motion`; keep motion minimal (the moodboard explicitly wants restraint).
- **Keep the build green:** `pnpm build:website` and `pnpm test` must pass at the end of every phase.

---

## 7. Verification (every phase)

```bash
pnpm install            # after any dependency change
pnpm build:website      # must pass
pnpm dev:website        # then preview the affected route
pnpm test               # guards shared-package regressions
```

Preview checklist: load the affected route (`/` landing, `/design-system` showcase), toggle **dark mode** and **palette**, confirm the **console is clean**. Use the `preview_*` tools — never ask a human to check manually.

---

## 8. Open considerations (kept honest)

- **VE + source-only package:** `.css.ts` files in a workspace package only compile if the package is in `transpilePackages` **and** the VE next-plugin is active. Both are set in Phase 0 — if styles silently don't apply, check these first.
- **Bridge drift:** the `global.css` ↔ DS token mapping is the most fragile seam. Keep the mapping table in Phase 1's doc authoritative; review it whenever a token name changes.
- **`default` palette:** kept as a secondary theme via `createTheme` (recommended) so we don't lose the neutral shadcn look. Phase 1 implements it; if it becomes dead weight later, drop it deliberately, not by accident.
- **`tw-animate-css`:** currently imported in `global.css`. Audit during Phase 5 — likely removable once decorative animations are gone.
