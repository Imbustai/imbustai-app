# Phase 6 — Shared chrome + landing layout

> Prereq: Phases 1–5 done (all feature areas migrated). Read [`README.md`](README.md) +
> [`../design-system/ai-context.md`](../design-system/ai-context.md).

## Goal

Remove Tailwind from the **last two holdouts**: the app-wide chrome and the landing's **layout**
(its components are already DS; only layout utilities remain). After this phase, the repo is
Tailwind-free in source — clearing the way for Phase 7's teardown.

## Scope

- **Shared chrome (app-wide):** `components/site-chrome.tsx`, `components/site-chrome-client.tsx`,
  `components/site-header.tsx`, `components/theme-toggle.tsx`, `components/language-switcher.tsx`,
  `components/i18n-layout-shell.tsx`, `components/theme-provider.tsx` (logic only — likely no
  styling). Also `app/layout.tsx` if it carries Tailwind utility classes.
- **Landing layout:** `components/home-landing/**` — replace the remaining ~68 Tailwind layout
  utilities (flex/grid/gap/padding/max-w) with layout primitives. The SCSS modules
  (`*.module.scss`) and the timeline SVG encode real layout/logic — keep them; only remove Tailwind
  utility `className`s on the TSX.

## Migration recipe

Same as the area phases: layout `className` → `Box/Stack/Inline/Grid/Container`; any remaining
`ui/*` → DS; text → `Typography`. The header/nav becomes `Inline`/`Container`; `theme-toggle` and
`language-switcher` are small interactive controls — wrap with DS `Button` (`variant="ghost"
size="icon"`) where they were shadcn buttons.

> **Decide on the `.module.scss` files:** they predate the DS. If a module only does layout that a
> primitive now covers, fold it in; if it encodes genuine bespoke visuals (timeline geometry),
> leave it but ensure its values reference tokens where reasonable. Don't force a rewrite of the SVG
> timeline.

## Acceptance criteria

- [ ] No `@/components/ui/*` imports in shared chrome or landing.
- [ ] `grep -rn "className=\"[^\"]*\(flex\|grid\|gap-\|p[xy]-\|m[xy]-\|w-\|max-w-\)" components` — no
      Tailwind layout utilities remain anywhere (chrome + landing were the last).
- [ ] **Repo-wide:** `grep -rn "@/components/ui/" app components` is empty.
- [ ] Header, theme toggle, language switcher, and landing all match today in light + dark.
- [ ] `pnpm build:website` + `pnpm test` pass.

## Verification

```bash
pnpm dev:website
grep -rn "@/components/ui/" app components            # expect EMPTY (whole app migrated)
grep -rnE "className=\"[^\"]*(flex|grid|gap-|p[xytrbl]?-[0-9]|m[xytrbl]?-[0-9]|max-w-|w-[0-9])" app components
```
Preview `/` (landing) + navigate the header across a couple routes; toggle theme + language;
`preview_screenshot` desktop + mobile (`preview_resize`), light + dark; console clean.

## Gotchas

- This is the **gate** for Phase 7: Phase 7 must not start until both greps above are empty.
- `theme-provider.tsx` / `i18n-layout-shell.tsx` are likely pure logic — check before "migrating";
  don't add primitives where there's no markup.
- Watch the SCSS modules: they may still pull Tailwind `@apply`? Grep them too
  (`grep -rn "@apply" components`) and convert any to plain CSS/tokens.
