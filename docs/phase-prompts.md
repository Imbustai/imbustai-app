# Phase Kickoff Prompts (copy-paste, one fresh session per phase)

Each prompt is self-contained: paste it into a new Claude Code session in `imbustai-monorepo`. Phases 1–4 run fine on Opus 4.8 or Sonnet 4.6 (implementation-heavy); Phase 5 benefits from a stronger model for the quality-judgment parts.

**Before each phase:** be on branch `feat/story-platform`, previous phase approved.
**After each phase:** the session must end with the retrospective template from `docs/draft-phases.md` and STOP.

---

## Phase 1 — Schema + story engine package

```text
You are continuing the Imbustai story platform build. Phase 0 is approved.

Read in order: CLAUDE.md, docs/story-engine-architecture.md, docs/voss-seed-plan.md,
docs/draft-phases.md (Phase 1 section), supabase/migrations/ (both files),
apps/website/lib/types/db.ts. Reference (read-only): ../imbustai-01-game/src/
(GameEngine, AIService, types, test) and apps/tryout-01 (do NOT modify).

Scope — Phase 1 ONLY, on branch feat/story-platform:
1. Re-stamp and apply the approved draft migration
   (supabase/migrations/20260611120000_story_engine_draft.sql) to the local
   Supabase stack (supabase start; ask me if it should target the linked
   project instead). Update apps/website/lib/types/db.ts with the new row types.
2. Create packages/story-engine (TS-source workspace package like
   @imbustai/i18n; add to transpilePackages). Implement per the architecture
   doc's port map: schema/ (zod-validated turn_plan + npc_letter),
   context/scopedContextBuilder, time/timeService + visibleFrom,
   validator/ (all 6 canon rules), engine/turnProcessor + batchParser,
   ai/claudeClient (@anthropic-ai/sdk, server-only, model claude-opus-4-8),
   prompts/ (story-agnostic templates only — no narrative content in TS).
3. Voss seed: packages/story-engine/seed/voss.ts + idempotent upsert runner,
   per docs/voss-seed-plan.md.
4. Tests (root vitest picks up packages/**): ported parser/schema/time tests,
   knowledge-scope test (comune context excludes voss-only facts), TimeService
   determinism, one unit test per validator rule, adapted 20-turn gameWorkflow
   sim with a mock provider.

Must pass: every checkbox in docs/draft-phases.md Phase 1. Must NOT: build any
UI, player routes, or auto-send paths; modify apps/tryout-01.

Finish with: pnpm test output, the Phase 1 retrospective (PASS/FAIL per item
with evidence), logical commits on feat/story-platform. Then STOP and wait for
"Phase 1 approved".
```

---

## Phase 2 — Admin story editor

```text
You are continuing the Imbustai story platform build. Phases 0–1 are approved:
schema is applied, packages/story-engine exists, Voss is seeded.

Read in order: CLAUDE.md, docs/story-engine-architecture.md (§2 data model),
docs/draft-phases.md (Phase 2 section), apps/website/app/admin/ (existing
pages for layout/auth patterns), apps/website/lib/{require-admin.ts,
supabase/, i18n/}, packages/story-engine/src/types.

Scope — Phase 2 ONLY, on branch feat/story-platform:
1. /admin/stories list page and /admin/stories/[id] editor: metadata + settings
   + time_config + lifecycle control (draft → testing → released; only released
   may be is_published), "Duplicate story" action (deep copy of story +
   characters + all optional-module rows, as a new draft), prominent warning
   banner when editing a story that has games in progress, first letter,
   characters CRUD (slug, name, role, personality,
   knowledge notes, hidden agenda, delays, unlock rules), and the OPTIONAL
   modules as collapsible sections: acts, facts (known_by multi-select over the
   story's character slugs), clues, endings. Per architecture §2 these are
   never required — a story with only characters + first letter must be
   publishable and playable.
2. Server actions / route handlers with requireAdmin() + service role; client
   validation + server validation (unique slugs/keys, delay min<=max, first
   letter required to publish).
3. "New story" creates an empty story shell entirely from the UI (story #2
   proof). i18n strings EN+IT for all UI chrome.
4. Tests for validation logic; manual check: edit Voss, save, reload identical;
   create a second blank story with 2 placeholder NPCs.

Must pass: docs/draft-phases.md Phase 2 checklist. Must NOT: AI generation
features, player play UI, changes to apps/tryout-01.

Finish with retrospective + commits, then STOP for "Phase 2 approved".
```

---

## Phase 3 — Admin-mediated reply workflow

```text
You are continuing the Imbustai story platform build. Phases 0–2 are approved.

Read in order: CLAUDE.md, docs/story-engine-architecture.md (§1 AI architecture,
§3 state machine, §6 validator, §7 routes), docs/draft-phases.md (Phase 3),
packages/story-engine/src/ (engine, context, validator, ai), apps/website/app/
game/[gameId]/page.tsx and components/games/admin-game-detail-client.tsx.

Scope — Phase 3 ONLY, on branch feat/story-platform:
1. API routes per architecture §7: POST /api/game/[gameId]/turns (player submit
   → pending_ai; a minimal test harness page or script is fine since Phase 4
   play UI doesn't exist yet), POST /api/admin/turns/[turnId]/generate,
   POST .../regenerate (full batch + optional ?character= single-NPC),
   PATCH /api/admin/drafts/[draftId], POST .../approve.
2. Generate runs orchestrator + scoped per-NPC Claude calls server-side
   (ANTHROPIC_API_KEY env), saves versioned ai_drafts with validator warnings.
3. Admin game page: pending-turns queue; review UI with one card per NPC letter,
   inline edit, regenerate, narratorNotes (admin-only), validation warnings,
   Approve & Send (TimeService story_date + visible_from, runtime_state update,
   status → sent) — all in one service-role transaction.
4. Auto-send for released stories (architecture §2 lifecycle): when the game's
   story.lifecycle = 'released', player submit triggers generate → validate →
   auto-approve server-side; validator ERRORS hold the turn at draft_ready in
   the admin queue. testing stories always stop for review.
5. Tests: state machine transitions (legal + illegal), no-direct-send proof
   (player submit never writes role='ai' rows itself — AI rows only via the
   (auto-)approve step), auto-send-held-on-validator-error test, scoped-context
   regression (comune draft contains no voss-only facts in a fixed scenario),
   route auth tests.

Must pass: docs/draft-phases.md Phase 3 checklist, including the manual full
admin cycle. Must NOT: polished player inbox, physical export, weaken the
admin gate, modify apps/tryout-01.

Finish with retrospective + commits, then STOP for "Phase 3 approved".
```

---

## Phase 4 — Player play UI

```text
You are continuing the Imbustai story platform build. Phases 0–3 are approved:
the full admin reply loop works.

Read in order: CLAUDE.md, docs/story-engine-architecture.md (§3, §4, §7),
docs/draft-phases.md (Phase 4), ../imbustai-01-game/src/components/
(LetterComposer, LetterInbox, ContactList, SendAllButton — port the UX),
apps/tryout-01/components/game-view.tsx (visible_from countdown pattern —
read-only reference), apps/website/app/game/[gameId]/.

Scope — Phase 4 ONLY, on branch feat/story-platform:
1. /game/[gameId]/play for the owner (admin gets read access): contact list
   with locked/unlocked NPCs (safe fields only — served server-side), composer
   for multiple recipients, draft review, Send All as one turn, inbox with
   markdown letters + in-fiction dates, "awaiting reply" state, visible_from
   countdown + reveal without full page refresh (polling GET
   /api/game/[gameId]/state; realtime is bonus).
2. Guard: playable only when game in_progress and started from a paid order;
   player can never trigger AI; one open turn at a time.
3. RLS verification tests: user cannot read ai_drafts, unapproved AI content,
   or future-visible_from letters; cannot insert AI interactions.
4. Manual playtest: 5 turns using ../imbustai-01-game/MANUAL_TESTING_LETTERS.md
   (Sequence 1), with at least 2 multi-NPC turns, through the real admin loop.
5. i18n EN+IT for all new UI strings.

Must pass: docs/draft-phases.md Phase 4 checklist. Must NOT: story #2
authoring polish, email notifications, modify apps/tryout-01.

Finish with retrospective + commits, then STOP for "Phase 4 approved".
```

---

## Phase 5 — Hardening, testing & replicability

```text
You are continuing the Imbustai story platform build. Phases 0–4 are approved:
Voss is playable end-to-end through the admin gate.

Read in order: CLAUDE.md, docs/story-engine-architecture.md (§9 test plan,
§10 risks), docs/draft-phases.md (Phase 5), packages/story-engine/src/__tests__/.

Scope — Phase 5 ONLY, on branch feat/story-platform:
1. 10-turn simulation harness (script or test) driving the real engine with the
   real Claude API against a seeded Voss game: player letters from fixtures,
   auto-generate + auto-approve in the harness only (clearly marked test-only;
   no production auto-send path). Record canon warnings; quality bar: 3
   consecutive turns zero validator errors, ≤1 minor warning across 10 turns.
2. Extend canon tests: knowledge boundary, timeline order, fact consistency;
   time tests: editor rules → expected story_date + visible_from.
3. Story #2: create via the admin editor ONLY (no TS changes), attach to shop,
   start a game, receive the first letter.
4. docs/authoring-new-story.md — step-by-step creator guide.
5. Regression: shop, checkout, admin orders, start-game, auth still work
   (pnpm build:website + existing tests + manual smoke).

Must pass: docs/draft-phases.md Phase 5 checklist (my manual 10+ turn
playthrough is the final human item — prepare everything so I can do it).
Must NOT: physical print pipeline, mobile, multi-provider AI.

Finish with retrospective + commits, then STOP for "Phase 5 approved" /
MVP sign-off.
```
