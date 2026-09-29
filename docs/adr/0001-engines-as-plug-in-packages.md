# 0001 — Engines as plug-in packages

- Status: accepted (2026-09-29)
- Decided in: [How are Stories bound to Engines, and what do Engines plug into?](https://github.com/Imbustai/imbustai-app/issues/11)
- Supersedes: the single story-agnostic engine and the phase plan in `docs/story-engine-architecture.md`, `docs/draft-phases.md`, `docs/phase-prompts.md`

## Context

The July Voss playthrough felt generic and scripted ([diagnosis](https://github.com/Imbustai/imbustai-app/issues/10)): one engine tried to play every Story from data alone, so it avoided contradicting canon by having Characters say as little as possible. A great Story needs mechanics of its own (clocks, suspicion, evidence, Endings) that a generic planner→writer loop cannot express as data.

## Decision

Every Story is bound to exactly one **Engine**: a monorepo package holding the Story's data schema and the algorithm that plays it, plugged into the platform's turn lifecycle through **Hooks**. `stories.engine` selects it.

- **Packages**: `packages/story-engine` becomes the host `@imbustai/story-runtime` (turn lifecycle, Hook contract, Claude and OpenAI providers, pricing/usage/budget, dates, the Run harness, shared writing tools: reader, reply-rule checker, Ledger). `packages/engine-classic` is today's planner→writer engine moved as-is; the old Voss story stays on it, archived. `packages/engine-voss` plays the new Voss story.
- **Hook contract**: `schema`, `startGame`, `contacts`, `validateSubmission`, `generateTurn` (including regenerating one Letter with admin guidance), `validateDraft`, `applyTurn`, `resolveEnding`, `generateEpilogue`. Letters can carry Enclosures.
- **The platform keeps** the turn state machine, the review/auto-send policy, persistence, providers, pricing and Runs. Engines reach AI only through the Hook context (see [0002](0002-per-game-model-profile.md)).
- **Engine data**: one versioned JSON document per Story, validated by the Engine's zod schema, authored as a seed file in the Engine package and synced by a script. Per-Game Engine state lives in `games.runtime_state`, validated too.
- **Split inside an Engine**: code holds the mechanics (clock, doubt, reply-rule checks, Endings, verdict scoring); data holds everything narrative (cast, dossiers, Signatures, case file, evidence, schedule, style anchors).

## Consequences

- "Story as data" still holds, but the data's shape is per Engine; a new kind of Story may need a new Engine package (TypeScript changes), which the old phase-5 goal ("story #2 without TS changes") ruled out.
- A schema-driven admin editor for Engine fields is deferred to a later effort.
- Hooks and runtime utilities are documented by the developer docs app (`apps/developer`), generated from source.
