# Phase 5 — Migrate the landing to `@imbustai/ds` (end-to-end proof)

> Prereq: Phases 1–4 done (tokens, Typography, primitives, showcase, ai-context).
> This phase proves the whole system on a real surface: the landing page is
> rebuilt on `@imbustai/ds` only, and the legacy token sprawl it depended on is
> removed.

## Goal

`components/home-landing/**` uses `@imbustai/ds` (Typography, Button, Card) for all primitives and text — **zero** scattered heading `text-*`, **zero** inline `SectionHeading`, and the dead `--landing-*` variables are deleted. The page matches the moodboard direction (editorial postal-modernist, restrained motion).

## Scope of files

```
apps/website/components/home-landing/
  home-landing.tsx                              ← remove inline SectionHeading; use Typography
  index.ts
  components/section-heading-grid-bg.tsx
  components/how-it-works/how-it-works-section.tsx (+ .module.scss)
  components/letter-history/letter-history-section.tsx (+ .module.scss)
  components/letter-history/timeline/*           ← SVG timeline; restyle via tokens, keep logic
```

Plus:
- `apps/website/app/global.css` — delete `--landing-*` vars no longer referenced.
- `apps/website/app/layout.tsx` — confirm theme class application (from Phase 1).

## Steps

1. **Inventory** current usage:
   ```bash
   grep -rn "font-heading\|text-[0-9x]\|SectionHeading\|bg-landing\|text-landing" apps/website/components/home-landing
   grep -rn "landing-" apps/website/app/global.css
   ```
2. **Replace text** — every heading/paragraph → `Typography` with the right `variant` (use the decision guide in `ai-context.md`). Delete the inline `SectionHeading` function in `home-landing.tsx`.
3. **Replace primitives** — CTAs → `Button` (`asChild` + `next/link`); cards → `Card`/`CardTitle`/`CardDescription`. Remove `@/components/ui/*` imports from the landing.
4. **Replace landing colors** — swap `bg-landing-hero`, `text-landing-surface-warm-fg`, etc. for semantic tokens. Where a landing section genuinely needs a distinct surface (e.g. a colored band), express it with **existing semantic tokens** (`primary`, `accent`, `card`, `muted`) — do **not** reintroduce per-section variables. If a real new semantic need exists, add **one** token to the contract + bridge, documented.
5. **Reduce decoration** per `moodboard/prompt.md`: remove gratuitous glow/blur/heavy shadows/superfluous micro-animations; keep only essential hover/transitions; honor `prefers-reduced-motion`. The SCSS modules and timeline SVG can stay where they encode genuine layout, but strip decorative effects.
6. **Delete dead `--landing-*` vars** from `global.css` once grep shows zero references. Re-run the grep until clean.
7. **Audit `tw-animate-css`** import in `global.css` — remove if no longer used after decoration cleanup.

## Acceptance criteria

- [ ] Landing imports primitives/typography **only** from `@imbustai/ds` (no `@/components/ui/*`, no inline `SectionHeading`).
- [ ] No heading uses raw `text-{size}` / `font-heading` classes — all via `Typography`.
- [ ] `--landing-*` variables that the landing used are deleted (grep clean); none left dangling.
- [ ] Visual result aligns with moodboard direction; decorative effects reduced; reduced-motion respected.
- [ ] Light + dark + imbustai palette all correct.
- [ ] `pnpm build:website` + `pnpm test` pass.

## Verification

```bash
pnpm dev:website
grep -rn "landing-\|font-heading\|text-[0-9]" apps/website/components/home-landing  # expect ~none
```
`preview_start` → `/` → `preview_screenshot` (light + dark, desktop + mobile via `preview_resize`) → `preview_console_logs` clean. Compare against the moodboard intent.

## After this phase

The DS is proven end-to-end. Remaining surfaces (shop, admin, auth, play, games) migrate in **Phase 6+** using the **migration recipe in `ai-context.md`** — one surface per session. Each removes its `@/components/ui/*` + Tailwind text usages, deletes any remaining legacy tokens, and verifies. Once all surfaces are migrated, `components/ui/*` and the Tailwind bridge can be retired (final cleanup session).

## Gotchas

- Don't migrate other surfaces here — keep this phase to the landing so it stays reviewable.
- If removing a `--landing-*` var breaks a *non-landing* page, that page still depends on it → leave the var, note it for Phase 6+. Only delete truly dead vars.
- The timeline SVG (`letter-history/timeline/*`) carries real logic — restyle, don't rewrite.
