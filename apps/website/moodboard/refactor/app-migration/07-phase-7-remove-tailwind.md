# Phase 7 — Remove Tailwind, the bridge, and shadcn

> Prereq: Phases 0–6 done. Read [`README.md`](README.md). **Do not start until the Phase 6 gate
> greps are empty** (no `@/components/ui/*` imports, no Tailwind utility classes anywhere).

## Goal

Delete Tailwind, the `@theme inline` bridge, and the shadcn `ui/*` layer from the repo. The DS
theme already applies globally via the theme class on `<html>`, so nothing visual should change.

## Precondition checks (run first — abort if any is non-empty)

```bash
grep -rn "@/components/ui/" app components
grep -rnE "className=\"[^\"]*(flex|grid|gap-|p[xytrbl]?-[0-9]|m[xytrbl]?-[0-9]|max-w-|w-[0-9]|text-[0-9a-z]|bg-|border-|rounded)" app components
grep -rn "@apply" app components
```
All three must be empty. If not, the corresponding area isn't fully migrated — go back, don't force.

## Teardown steps

1. **`app/global.css`** — remove `@import "tailwindcss";`, `@import "tw-animate-css";`, the
   `@theme inline { … }` bridge block, `@custom-variant dark`, and any `@layer base { @apply … }`.
   Keep: the DS theme application, genuinely-global CSS (e.g. the `icon-swap` keyframes if still
   used — grep first), font-face/`--font-*` wiring. The page should still look identical because the
   DS `--ds-*` variables now drive everything directly.
2. **Delete `components/ui/*`** (button, card, input, label, badge, table, tooltip, icon-swapper —
   confirm each has zero importers first) and **`components.json`** (shadcn config).
3. **`postcss.config.mjs`** — remove the `@tailwindcss/postcss` plugin; if nothing else remains,
   delete the file (Next tolerates no postcss config).
4. **Dependencies** (`apps/website/package.json`) — remove `tailwindcss`, `@tailwindcss/postcss`,
   `tw-animate-css`. Remove `tailwind-merge` and `clsx` **only if** `lib/utils.ts` `cn()` and all
   usages are gone (grep `cn(` and `clsx` / `twMerge` repo-wide first). Delete `lib/utils.ts` if it
   only held `cn`.
5. `pnpm install` to update the lockfile.

## Acceptance criteria

- [ ] No `tailwindcss` / `@tailwindcss/postcss` / `tw-animate-css` in `package.json`; lockfile updated.
- [ ] `components/ui/` and `components.json` deleted; no dangling imports.
- [ ] `global.css` has no Tailwind directives/bridge; DS theme drives all styling.
- [ ] `cn`/`clsx`/`tailwind-merge` removed if unused (or explicitly justified if still referenced).
- [ ] `pnpm build:website` + `pnpm test` pass.
- [ ] **Visual parity** in preview across admin, shop, auth, games, play, landing — light + dark.

## Verification

```bash
pnpm install
pnpm build:website && pnpm dev:website
grep -rniE "tailwind|@apply|tw-animate" apps/website   # expect empty (besides this doc folder)
```
`preview_start` and walk every area (`/`, `/shop`, `/login`, `/admin`, a game, a play route);
`preview_screenshot` light + dark; compare against pre-teardown screenshots; console clean.

## After this phase

- Tailwind is gone from the repo. The DS (`@imbustai/ds`) is the single styling system: tokens +
  Typography + components + layout primitives.
- Update the DS `ai-context.md` and (optionally) the project root `CLAUDE.md` to drop any
  "Tailwind for legacy pages" language — the bridge no longer exists; **all UI is DS, no exceptions.**

## Gotchas

- This phase is irreversible-ish — keep the teardown in **one commit** so it can be reverted wholesale
  if a regression surfaces.
- The `default` (shadcn-neutral) theme in the DS can stay as a secondary theme — it's independent of
  Tailwind. Don't delete it unless the user asks.
- Double-check `proxy.ts`, scripts, and any non-`app`/`components` file for stray Tailwind usage
  before declaring victory.
