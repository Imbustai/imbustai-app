# Phase 3 — Auth migration

> Prereq: Phase 0 done. Read [`README.md`](README.md) +
> [`../design-system/ai-context.md`](../design-system/ai-context.md) §migration recipe.

## Goal

The auth area runs on `@imbustai/ds` only — no `@/components/ui/*`, no Tailwind utilities — UI
preserved like-for-like.

## Scope

- Pages: `app/login`, `app/register`, `app/forgot-password`, `app/reset-password`,
  `app/auth/callback`.
- Components: `components/auth/**`
  - `auth-layout.tsx` (32 — the centered card shell wrapping every form),
  - `login-form.tsx` (100), `register-form.tsx` (105), `reset-password-form.tsx` (92),
    `forgot-password-form.tsx` (80).

## Migration recipe

Per `ai-context.md`: forms use DS `Input`/`Label`/`Button`; field layout via `Stack`; the centered
shell (`auth-layout.tsx`) via `Container`/`Box` + `Card`; errors/help text via `Typography`
(`caption`/`bodySm`, `tone="muted"` or destructive). No raw `className`/`style`.

## Acceptance criteria

- [ ] No `@/components/ui/*` imports under the auth pages/components.
- [ ] `grep -rn "className=" components/auth app/login app/register app/forgot-password app/reset-password` ≈ empty.
- [ ] All four forms match today in light + dark; validation/error display intact.
- [ ] `pnpm build:website` + `pnpm test` pass.

## Verification

```bash
pnpm dev:website
grep -rn "@/components/ui/\|className=" components/auth app/login app/register
```
Preview `/login` and `/register`; `preview_fill` a field + `preview_screenshot` (light + dark);
confirm focus rings + error states render via DS; console clean. Don't submit real credentials.

## Gotchas

- Auth forms hold submit/validation logic + Supabase calls — migrate **markup/styling only**.
- `auth-layout.tsx` wraps all forms — get it right once and the forms fall into place.
