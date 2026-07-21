# Phase 5 — Play migration

> Prereq: Phase 0 done. Read [`README.md`](README.md) +
> [`../design-system/ai-context.md`](../design-system/ai-context.md) §migration recipe.

## Goal

The player-facing play area runs on `@imbustai/ds` only — no `@/components/ui/*`, no Tailwind
utilities — UI preserved like-for-like.

## Scope

- Pages: `app/game/[gameId]/**` (the play surface).
- Components: `components/play/play-client.tsx` (419 — the multi-letter turn UI + delayed reveal).

## Migration recipe

Per `ai-context.md`: letters/cards → `Card*`; turn actions → `Button`; inputs/compose → `Input`/
DS form primitives; status/labels → `Badge`/`Typography`; layout → `Box/Stack/Inline/Container`.
Replace all layout `className` with layout primitives. Any `<select>` → DS `Select`.

## Acceptance criteria

- [ ] No `@/components/ui/*` imports under `components/play` + `app/game`.
- [ ] `grep -rn "className=" components/play app/game` ≈ empty.
- [ ] Play UI matches today in light + dark; multi-letter turn + delayed-reveal behaviour intact.
- [ ] `pnpm build:website` + `pnpm test` pass.

## Verification

```bash
pnpm dev:website
grep -rn "@/components/ui/\|className=" components/play app/game
```
Preview the play route for an existing game; `preview_screenshot` (light + dark); confirm letters
render and the compose/submit controls work (`preview_click`/`preview_fill`); console clean.

## Gotchas

- `play-client.tsx` holds turn state + `visible_from` delayed-reveal logic — migrate
  **markup/styling only**, leave timing/state untouched.
- This is player-facing — be extra careful that interactive controls keep working after the swap.
