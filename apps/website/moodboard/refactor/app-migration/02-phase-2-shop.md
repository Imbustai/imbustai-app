# Phase 2 — Shop migration

> Prereq: Phase 0 (foundations) done. Read [`README.md`](README.md) +
> [`../design-system/ai-context.md`](../design-system/ai-context.md) §migration recipe.

## Goal

The shop area runs on `@imbustai/ds` only — no `@/components/ui/*`, no Tailwind utilities — UI
preserved like-for-like.

## Scope

- Pages: `app/shop/**` (`shop/`, `shop/[slug]/`, `shop/[slug]/checkout/`) + `app/checkout/**`
  (`checkout/`, `checkout/success/`).
- Components: `components/shop/**`
  - `checkout-client.tsx` (273 — heaviest; forms, summary, Stripe redirect),
  - `story-grid.tsx` (60), `story-detail-client.tsx` (36), `checkout-success-client.tsx` (56),
    `shop-page-header.tsx` (15).

## Migration recipe

Per `ai-context.md`: swap `ui/*` → DS primitives; headings/text → `Typography`; layout `className`
→ layout primitives (`Box/Stack/Inline/Grid/Container`); any `<select>` → DS `Select`; cards →
`Card*`; CTAs → `Button` (`asChild` + `next/link`). Remove dead `cn` imports.

## Acceptance criteria

- [ ] No `@/components/ui/*` imports under `app/shop`, `app/checkout`, `components/shop`.
- [ ] `grep -rn "className=" app/shop app/checkout components/shop` ≈ empty.
- [ ] Shop + checkout match today in light + dark; product grid layout intact.
- [ ] `pnpm build:website` + `pnpm test` pass.

## Verification

```bash
pnpm dev:website
grep -rn "@/components/ui/\|className=" app/shop app/checkout components/shop
```
Preview `/shop` and a `/shop/[slug]` detail; `preview_screenshot` (light + dark); confirm the grid
and CTA buttons render; console clean. Don't trigger real Stripe checkout — verify up to the CTA.

## Gotchas

- `checkout-client.tsx` may hold form state + Stripe calls — migrate **markup/styling only**, leave
  the logic untouched.
- Keep the Tailwind bridge intact (other areas still unmigrated).
