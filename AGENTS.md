# Imbustai Monorepo — Codex Instructions

## Mission

Build a **story-agnostic interactive letter platform** in this monorepo. Stories are sold via `apps/website` (shop + orders). Players exchange letters with multiple NPCs per turn. AI reply batches go through a review workflow whose strictness depends on the story lifecycle (`draft → testing → released`): in **testing**, every batch is admin-reviewed before the player sees it; in **released**, batches auto-send after canon validation passes (validator errors hold the turn for admin review). See `docs/story-engine-architecture.md` §2. *(Amended 2026-06-11 — supersedes "every batch is admin-reviewed".)*

Story #1 (proof): port the Voss detective mystery from the reference game prototype.

## Repos

| Repo | Path | Role |
|------|------|------|
| **This repo (target)** | `.` | Implement everything here |
| **Game prototype (read-only)** | `../imbustai-01-game` | Engine, UI patterns, tests, system prompt |
| **tryout-01 (read-only)** | `apps/tryout-01` | Reply API + delayed `visible_from` patterns — **do not modify** |

## Read order (every new session)

1. `AGENTS.md` (this file)
2. `docs/fable-story-platform-brief.md`
3. `docs/reference-repos.md`
4. Latest `docs/story-engine-architecture.md` (if it exists)
5. `supabase/migrations/`
6. `apps/website/lib/types/db.ts`
7. Reference: `../imbustai-01-game/src/services/GameEngine/`
8. Reference: `apps/tryout-01/app/api/game/reply/route.ts`

## Non-negotiables

- **Review gate by lifecycle**: stories in `testing` — player submits turn → admin generates AI draft → edit/regenerate → approve → only then insert AI `interactions`. Stories in `released` — same pipeline, the approve step runs automatically when canon validation passes; validator errors hold the turn for admin review. AI `interactions` are always inserted by the (auto-)approve step via service role — never directly on player submit.
- **One AI batch per player turn**: includes **all NPC replies** for that turn (not one API call per NPC visible to player separately).
- **Story as data**: no 350-line hardcoded `MASTER_SYSTEM_PROMPT` in production code. Story content lives in DB/editor.
- **Per-NPC knowledge boundaries**: fix knowledge bleed (NPCs must not know facts only other characters know).
- **Unified time model**: creator configures timing in story editor; fix prototype bug where AI `dateSent` is ignored by parser.
- **Do not modify** `apps/tryout-01`.
- **Single AI provider** (Codex) is fine — no multi-model requirement.
- Run tests before claiming a phase is done.

## Where to build

| Area | Location |
|------|----------|
| Story engine (logic) | `packages/story-engine/` (create) |
| Website app | `apps/website/` |
| DB migrations | `supabase/migrations/` |
| Shared i18n | `packages/i18n/` (existing) |

## Commands

```bash
pnpm install
pnpm dev:website          # Next.js website
pnpm build:website
pnpm test                 # Vitest (root)
supabase db push          # Apply migrations (when configured)



Phases (stop at gates)
Phase	Deliverable	Done when
0
docs/story-engine-architecture.md + draft SQL
Human approves schema
1
Migrations + packages/story-engine + Voss seed
Tests pass; story loads from data
2
Admin story editor
CRUD characters, acts, time rules
3
Admin reply workflow
Generate/edit/regenerate/approve works
4
Player play UI
Multi-letter turn + delayed reveal
5
Test harness + replicability
10-turn sim; story #2 without TS changes
Do not skip Phase 0. Do not start Phase 1 until schema is approved.

Known pain points (must fix)
Knowledge bleed — monolithic GM + full conversation thread in prototype
Plot holes — no canon/fact registry or validation
Broken time — AI picks dates but parser recalculates randomly; no editor control
## Design System — Hard Rules

- **`@vanilla-extract/css`, `@vanilla-extract/recipes`, and `@vanilla-extract/sprinkles` must NEVER be imported outside `packages/ds/`.**  
  All `style()`, `styleVariants()`, `recipe()`, and sprinkles usage belongs exclusively inside the DS package. Consuming apps (e.g. `apps/website`) use DS components and CSS modules (`.module.css`) for app-specific styles — never vanilla-extract directly.
- **Do not create component-like abstractions (pills, badges, nav links, etc.) outside the DS.** If a reusable visual pattern is needed, create it as a proper DS component in `packages/ds/src/components/`.
- **Regola #7**: Before extending the DS (new component, new token, new sprinkle), STOP and ask the user for approval.
- **ESLint enforcement**: `apps/website/eslint.config.mjs` blocks all `@vanilla-extract/*` imports. This rule must not be removed or weakened.

Security
AI keys server-side only (Route Handlers / Server Actions)
AI interactions inserted via service role after admin approve
Never expose SUPABASE_SERVICE_ROLE_KEY to client