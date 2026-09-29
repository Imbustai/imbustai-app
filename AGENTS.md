# Imbustai Monorepo — Agent Instructions

## Mission

A platform for interactive epistolary Stories: the Player writes Letters, Characters reply. Stories are sold via `apps/website` (shop + orders). Every Story is bound to one **Engine**, a package that owns the Story's data schema and the algorithm that plays it, plugged into the platform's turn lifecycle through **Hooks** ([ADR 0001](docs/adr/0001-engines-as-plug-in-packages.md)).

The current effort is the new Voss story (Rome 1987) on its own Engine, `engine-voss`. Its plan is the [Voss story's wayfinder map](https://github.com/Imbustai/imbustai-app/issues/9): read it before picking up any work, and take the next step from its open tickets.

Speak the glossary: `CONTEXT-MAP.md` → `packages/story-runtime/CONTEXT.md` (Story, Engine, Hook, Game, Turn, Letter, Character, Run…).

## Repos

| Repo | Path | Role |
|------|------|------|
| **This repo** | `.` | Implement everything here |
| **Game prototype (read-only)** | `../imbustai-01-game` | Original Voss prototype, historical reference |
| **tryout-01 (read-only)** | `apps/tryout-01` | Reply API + delayed `visible_from` patterns — **do not modify** |

## Read order (every new session)

1. `AGENTS.md` (this file)
2. The map above, then the ticket you are working
3. `CONTEXT-MAP.md` and the `CONTEXT.md` of each context you touch
4. `docs/adr/`
5. `supabase/migrations/` and `apps/website/lib/types/db.ts` when touching data

## Non-negotiables

- **Review gate by lifecycle**: the platform owns it, Engines never bypass it. Stories in `testing` — Player submits a Turn → admin generates the AI draft → edit/regenerate → approve → only then insert AI `interactions`. Stories in `released` — same pipeline, approve runs automatically when the Engine's draft validation passes; validation errors hold the Turn for admin review. Runs auto-approve. AI `interactions` are always inserted by the (auto-)approve step via service role, never on Player submit.
- **One reviewable batch per Turn**: every Character reply and Dispatch the Turn triggers.
- **Story as data**: story content lives in the Engine's data document (one validated JSON document per Story), never in prompt strings in code.
- **Per-Character knowledge boundaries**: a Character knows only what its own dossier and Letters give it.
- **Endings are decided by Engine code** from what the Player did, never by a model.
- **Model profile per Game**: Engines ask for AI by role (`writer`, `clerk`, `analyst`, `player`); each Game maps roles to Claude or OpenAI models; every call is metered and priced, and an unknown model's price is an error ([ADR 0002](docs/adr/0002-per-game-model-profile.md)).
- **Do not modify** `apps/tryout-01`.
- Run tests before closing a ticket.

## Where to build

| Area | Location |
|------|----------|
| Story runtime (Hook contract, hook context, providers, pricing, Runs) | `packages/story-runtime/` (`@imbustai/story-runtime`) |
| Turn lifecycle and persistence (calls the Hooks) | `apps/website/lib/game-host.ts`, `apps/website/lib/reply-workflow.ts`; Engines registered in `apps/website/lib/engines/` |
| Engines | `packages/engine-<name>/` (`engine-classic`, `engine-voss`) |
| Website app | `apps/website/` |
| Developer docs app | `apps/developer/` |
| DB migrations | `supabase/migrations/` |
| Shared i18n | `packages/i18n/` |

## Commands

```bash
pnpm install
pnpm dev:website          # Next.js website
pnpm build:website
pnpm test                 # Vitest (root)
pnpm typecheck            # tsc for the runtime, the Engines and the website
pnpm lint                 # ESLint for the website
supabase db push          # Apply migrations (when configured)
```

## Design System — Hard Rules

These rules bind the player- and customer-facing apps (`apps/website`). Internal tools (`apps/developer`) are exempt and may use their own framework's theming.

- **`@vanilla-extract/css`, `@vanilla-extract/recipes`, and `@vanilla-extract/sprinkles` must NEVER be imported outside `packages/ds/`.**  
  All `style()`, `styleVariants()`, `recipe()`, and sprinkles usage belongs exclusively inside the DS package. Consuming apps (e.g. `apps/website`) use DS components and CSS modules (`.module.css`) for app-specific styles — never vanilla-extract directly.
- **Do not create component-like abstractions (pills, badges, nav links, etc.) outside the DS.** If a reusable visual pattern is needed, create it as a proper DS component in `packages/ds/src/components/`.
- **Regola #7**: Before extending the DS (new component, new token, new sprinkle), STOP and ask the user for approval.
- **ESLint enforcement**: `apps/website/eslint.config.mjs` blocks all `@vanilla-extract/*` imports. This rule must not be removed or weakened.

## Security

- AI keys (Anthropic, OpenAI) server-side only (Route Handlers / Server Actions / CLI)
- AI interactions inserted via service role by the approve step
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues for `Imbustai/imbustai-app`. See `docs/agents/issue-tracker.md`.

### Triage labels

The canonical triage roles use their default GitHub label names. See `docs/agents/triage-labels.md`.

### Domain docs

This is a multi-context monorepo; use `CONTEXT-MAP.md` to locate relevant context documentation. See `docs/agents/domain.md`.
