# Phase 4 — `/design-system` showcase + AI context

> Prereq: Phases 1–3 (tokens, Typography, primitives) done. This phase makes the
> DS visible and documented: a static showcase route + the canonical machine-
> readable reference future AI sessions consume.

## Goal

1. A static `/design-system` page that lists **Foundations** then **every component** with all its variants — the human reference.
2. `ai-context.md` — the precise, self-contained DS brief future AI sessions read **before touching any UI**.

## Part A — `/design-system` route

**File:** `apps/website/app/design-system/page.tsx` (server component, no `'use client'`, no playground).

Structure (top to bottom):

1. **Page heading** (`Typography variant="display"`).
2. **Foundations**
   - **Palette** — swatches for each semantic color token (background, foreground, primary, secondary, accent, muted, border, destructive + foregrounds). Show the resolved color + token name. Render small boxes using the `--ds-*` vars.
   - **Typography scale** — render every `Typography` variant with its name, so the hierarchy is visible at a glance. This doubles as the visual spec.
   - **Spacing** — bars for each `space` token.
   - **Radius** — boxes for each `radius` token.
3. **Components** — one section per component, each showing all variants/sizes/states:
   - Button: every `variant` × key `size`s, plus `disabled`, `asChild` link, `fullWidth`.
   - Badge: every variant.
   - Card: default + muted, with title/description/content/footer.
   - Input: default, focus (note), invalid, disabled.
   - Label: with an input.
   - Table/Tooltip if shipped.

Keep the page itself built **only** from `@imbustai/ds` components (Typography for all labels/headings) — it's also a dogfooding test. Light/dark must both look correct (the page inherits the theme from `layout.tsx`).

> Optional: add a link to `/design-system` in the site header **only** behind a dev/admin check, or leave it unlinked (reachable by URL). Decide and note it; don't expose it in primary nav for end users.

## Part B — `ai-context.md`

**File:** `apps/website/moodboard/refactor/design-system/ai-context.md`.

This is the **contract document** for future AI work (the deferred Phase 6+ migrations and all subsequent UI work). It must be self-contained and current. Required sections:

1. **Purpose & rules** — "All website UI uses `@imbustai/ds`. Never add a new shadcn component. Never pass `className` to a DS component. Never hardcode colors/sizes — use tokens or add one to the contract."
2. **Import surface** — exact exports from `@imbustai/ds` (copy from `src/index.ts`).
3. **Token reference** — every token group with names and current values; the `--ds-*` ↔ Tailwind bridge mapping table (copy from Phase 1, keep in sync).
4. **Component reference** — for each component: a props/variants table (variant names, sizes, tones, named escape hatches), the default element, and a minimal usage example.
5. **Typography decision guide** — which `variant` to use when (so AI picks `h2` vs `lead` vs `body` correctly).
6. **Do / Don't** — concrete examples of correct vs forbidden usage (e.g. ❌ `<Button className="mt-4">` → ✅ wrap in a layout element; ❌ `text-3xl` → ✅ `<Typography variant="h2">`).
7. **Migration recipe** — the step-by-step a Phase 6+ session follows to convert one legacy page: find `components/ui/*` + raw `text-*`/`font-heading` usages, replace with DS equivalents, remove dead `--landing-*`/Tailwind classes, verify.

> Keep `ai-context.md` regenerated/updated whenever the DS surface changes. It is the single brief; if it drifts, future sessions drift.

## Acceptance criteria

- [ ] `/design-system` renders in dev, server component, built only from `@imbustai/ds`.
- [ ] Foundations (palette, type scale, spacing, radius) and all shipped components shown with their variants.
- [ ] Correct in light **and** dark.
- [ ] `ai-context.md` complete: covers every shipped token + component with prop tables and do/don'ts.
- [ ] `pnpm build:website` passes; `/design-system` console clean.

## Verification

```bash
pnpm dev:website
```
`preview_start` → navigate to `/design-system` → `preview_screenshot` (light + dark via `preview_resize`/theme toggle) → `preview_console_logs` clean. Skim `ai-context.md` against `src/index.ts` to confirm nothing is missing.
