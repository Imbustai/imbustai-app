# Imbustai Story Platform — Phases & Success Criteria

Master checklist for building the interactive letter-story platform in `imbustai-monorepo`.

**Related docs:** `CLAUDE.md`, `docs/fable-story-platform-brief.md`, `docs/reference-repos.md`

**Branch:** `feat/story-platform`

**Rule:** Do not start Phase N+1 until every item in Phase N **Must pass** is checked and you reply **"Phase N approved"**.

---

## Overview

| Phase | Name | One-line success |
|-------|------|------------------|
| **0** | Discovery & architecture | Approved architecture + draft schema; no implementation |
| **1** | Schema + story engine | Migrations + `packages/story-engine` + Voss seed; scoped context & time tests pass |
| **2** | Admin story editor | Admin can CRUD full story; story #2 shell without code |
| **3** | Admin reply workflow | Generate → edit → regenerate → approve; no auto-send |
| **4** | Player play UI | Multi-letter play + wait + delayed reveal; full browser loop |
| **5** | Hardening & replicability | 10-turn sim stable; story #2 from editor; docs + human sign-off |
| **6** | Physical letters & ops *(later)* | Print/export + fulfillment workflow |

---

## Cross-phase rules (every phase)

| Rule | Criterion |
|------|-----------|
| **tryout-01** | Do not modify `apps/tryout-01` unless explicitly revoked |
| **Admin gate** | For stories in `testing`: never weaken — no path that auto-sends. Stories in `released` auto-send by design **after canon validation** (approved change 2026-06-11, see architecture §2); validator errors always hold the turn for review. No path may insert AI interactions on player submit alone. |
| **Story as data** | No new 350-line hardcoded system prompts in production TypeScript |
| **Secrets** | AI keys server-side only; never in client bundle or git |
| **Tests** | New logic has tests; phase completion report lists what ran |
| **i18n** | User-facing strings in EN + IT |
| **Commits** | Logical commits per phase on `feat/story-platform` |

---

## Phase 0 — Discovery & architecture

### Goal

Agree on schema, AI pattern, time model, and admin workflow **before** production code.

### Deliverables

1. `docs/story-engine-architecture.md`
2. Draft SQL migration(s) in `supabase/migrations/` *(draft only — not applied until approved)*
3. Voss story decomposition plan (`systemPrompt.ts` → story tables/seed)
4. Test plan (automated + manual from `MANUAL_TESTING_LETTERS.md`)
5. Risk register + open questions

### Must pass

- [ ] **Architecture doc** exists and covers:
  - [ ] AI architecture choice with rationale (orchestrator + scoped NPC calls **or** single call + validator)
  - [ ] Full ER diagram / table list
  - [ ] Turn state machine: `pending_ai` → `draft_ready` → `approved` → `sent`
  - [ ] Unified time model (`story_date` in-fiction vs `visible_from` real-world)
  - [ ] Per-NPC knowledge scoping rules
  - [ ] Canon validation approach
  - [ ] API route list (admin generate, approve, player submit turn, etc.)
  - [ ] File port map from `../imbustai-01-game` → monorepo
- [ ] **Draft migrations** written for review (not applied)
- [ ] **Voss seed plan** documents how murder-mystery content decomposes into structured data
- [ ] **Test plan** documented
- [ ] **Risk register** with open questions needing human decision
- [ ] `pnpm test` run; baseline green/red reported
- [ ] **Human sign-off** — you explicitly approve schema + AI pattern

### Must not (out of scope)

- No production play UI
- No live AI in user-facing routes
- No changes to `apps/tryout-01`
- No migrations applied without approval

### Gate to Phase 1

Architecture approved; no unresolved blocker on schema or admin-approval workflow.

---

## Phase 1 — Schema + story engine package

### Goal

Database supports multi-story engine; Voss story loads from data; core logic lives in `packages/story-engine`.

### Deliverables

1. Applied Supabase migrations (after Phase 0 approval)
2. `packages/story-engine` with ported/refactored engine logic
3. Voss story seed data
4. Unit tests for schema, time, context scoping, canon validator

### Must pass

#### Database

- [ ] Approved migrations applied (local or linked Supabase)
- [ ] Story extension tables exist (minimum):
  - [ ] Story characters (with knowledge scope, responsiveness, unlock rules)
  - [ ] Story facts/clues/acts (or equivalent normalized structure)
  - [ ] Game runtime state (`runtime_state` jsonb or equivalent)
  - [ ] Interaction turns (workflow grouping)
  - [ ] AI drafts (pre-approval storage)
- [ ] `interactions` extended: character slug, `story_date`, turn linkage
- [ ] **RLS:**
  - [ ] Users cannot insert AI interactions
  - [ ] AI drafts admin-only
  - [ ] Runtime state scoped to game owner + admin

#### Package (`packages/story-engine`)

- [ ] Package created and importable from `apps/website`
- [ ] Ported/refactored (not blind copy):
  - [ ] Structured response schema + validation
  - [ ] Turn processing skeleton
  - [ ] Scoped context builder *(replaces monolithic full-thread approach)*
  - [ ] `TimeService` driven by editor config *(fixes prototype `dateSent` ignore bug)*
  - [ ] Canon validator (warnings/errors on drafts)
- [ ] Voss story seeded from decomposed `systemPrompt.ts`
- [ ] `nx test story-engine` (or equivalent) passes
- [ ] Ported prototype tests pass (parser, schema, time at minimum)

#### Integration smoke (automated)

- [ ] Load Voss config → build context for NPC A → context **excludes** NPC B's private facts
- [ ] Given editor time rules → `TimeService` produces consistent `story_date` (no random override without rules)

### Must not (out of scope)

- No admin story editor UI (beyond existing website admin)
- No player compose UI
- No end-to-end browser play flow

### Gate to Phase 2

Engine tests green; Voss readable from DB; knowledge scoping + time proven in automated tests.

---

## Phase 2 — Admin story editor

### Goal

Creators define and edit stories without touching TypeScript.

### Deliverables

1. Admin routes under `/admin/stories`
2. CRUD UI for story bible, characters, time config, settings
3. i18n strings (EN + IT)

### Must pass

#### CRUD (admin-only)

- [ ] `/admin/stories` — list stories
- [ ] `/admin/stories/[id]` — edit:
  - [ ] Metadata (title, slug, price, published)
  - [ ] First letter
  - [ ] Characters: slug, name, role, voice, knowledge scope, responsiveness, unlock rules
  - [ ] Acts / timeline / facts / clues *(or documented minimal MVP subset)*
  - [ ] Time config: start date, per-character delays, default real-world delay
  - [ ] Settings: `allow_dynamic_npcs`, max turns, etc.
- [ ] Create new empty story template (story #2 shell) **without code changes**
- [ ] Non-admin cannot access editor routes

#### Data integrity

- [ ] Save → reload shows identical data
- [ ] Character slugs unique per story
- [ ] Validation blocks invalid config (missing first letter, duplicate slug, etc.)

#### Manual verification

- [ ] Edit Voss story in UI; changes persist in DB
- [ ] Create second blank story with 2 placeholder NPCs

### Must not (out of scope)

- AI generation in editor *(optional preview/simulate is bonus)*
- Player play UI

### Gate to Phase 3

Voss fully editable in admin; story #2 creatable from UI; no TS edits for new story shell.

---

## Phase 3 — Admin-mediated reply workflow

### Goal

Player turn waits for admin; AI batch is generated, reviewed, edited, regenerated, and approved before the player sees anything.

### Deliverables

1. Pending turns queue on admin game page
2. Generate / edit / regenerate / approve API routes
3. Admin review UI for multi-NPC draft batches
4. State machine tests

### Must pass

#### Workflow

- [ ] Player turn submission → `interaction_turns.status = pending_ai`
  - *(Temporary test harness OK if Phase 4 play UI not ready yet)*
- [ ] Admin game page shows **pending turns** for that game
- [ ] **Generate AI reply:**
  - [ ] Server-side Claude call
  - [ ] **One batch** with **all NPC replies** for the turn
  - [ ] Saved to `ai_drafts` with version history
- [ ] **Review UI:**
  - [ ] One section per NPC letter
  - [ ] Inline edit
  - [ ] **Regenerate** (full batch minimum; per-NPC regenerate is bonus)
  - [ ] `narratorNotes` visible to admin only
  - [ ] Canon validator warnings shown before approve
- [ ] **Approve & Send:**
  - [ ] AI rows written to `interactions` via service role
  - [ ] `story_date` set per letter via `TimeService`
  - [ ] `visible_from` set per delay rules
  - [ ] Game `runtime_state` updated (turn, act, clues, unlocked NPCs)
  - [ ] Turn status → `sent`
- [ ] **No auto-send path** — verify no route inserts AI interactions on player submit alone

#### Quality

- [ ] Canon validator runs on every draft; contradictions flagged
- [ ] Scoped context test: Comune draft does not reference Voss-only facts (fixed scenario)

#### API / security

- [ ] Generate + approve routes require admin
- [ ] API keys never exposed to client
- [ ] Automated tests for transitions: `pending_ai` → `draft_ready` → `approved` → `sent`

#### Manual verification

- [ ] Full admin cycle on test game: generate → edit one letter → approve → DB rows correct

### Must not (out of scope)

- Polished player inbox *(DB + admin proof sufficient)*
- Physical letter export

### Gate to Phase 4

Admin loop works on real game; zero auto-send paths; canon warnings visible in UI.

---

## Phase 4 — Player play UI on website

### Goal

Authenticated player plays like the prototype: multi-letter turns, waiting state, delayed reveal.

### Deliverables

1. `/game/[gameId]/play` (or equivalent)
2. Composer, contact list, inbox, send-all flow
3. Waiting + `visible_from` reveal UX
4. Full browser loop with admin approval

### Must pass

#### Routes & auth

- [ ] Play route for game owner
- [ ] Admin can view game (read/play mode)
- [ ] Only playable when game `in_progress` and properly started from paid order

#### Player UX (prototype parity)

- [ ] Contact list with locked/unlocked NPCs
- [ ] Compose letters to multiple NPCs
- [ ] Draft review → **Send all** as one turn
- [ ] After send: drafts cleared; user letters saved; **"awaiting reply"** shown *(not instant AI)*
- [ ] Inbox with received letters (markdown)
- [ ] In-fiction date visible where appropriate
- [ ] Letters hidden until `visible_from`; transit/waiting state shown
- [ ] Approved letters appear without full page refresh (poll or realtime)

#### Integration with Phase 3

- [ ] Player submit creates turn + user interactions only
- [ ] Player never calls Claude directly
- [ ] Full browser loop: player send → admin generate/approve → player receives

#### RLS

- [ ] User reads own game + visible interactions only
- [ ] User cannot read `ai_drafts` or unapproved AI content
- [ ] User cannot insert AI interactions

#### Manual playtest (minimum)

- [ ] **5 turns** using letters from `MANUAL_TESTING_LETTERS.md` (Scenario 1 or 3)
- [ ] At least **2 turns** with letters to **different NPCs in same turn**
- [ ] Waiting + delayed reveal behave correctly

### Must not (out of scope)

- Story #2 full authoring polish
- Email notifications *(tryout pattern is bonus)*

### Gate to Phase 5

You can play Voss on website through admin-approved replies; multi-letter turns work; no instant AI.

---

## Phase 5 — Hardening, testing & replicability

### Goal

Voss stable under repeated simulation; story #2 provable without code changes; platform ready for internal beta.

### Deliverables

1. Extended automated test suite
2. 10-turn simulation harness
3. `docs/authoring-new-story.md`
4. Regression verification on existing shop/admin flows

### Must pass

#### Automated

- [ ] Ported e2e from prototype (`gameWorkflow.test.ts` or equivalent) passes
- [ ] **10-turn simulation** passes without canon violations
- [ ] Canon tests: knowledge boundary, timeline order, fact consistency
- [ ] Time tests: editor rules → expected `story_date` + `visible_from`
- [ ] `pnpm test` green for story-engine + relevant website tests

#### Quality bar (Voss)

- [ ] **3 consecutive simulated turns** with zero canon validator errors
- [ ] **10-turn simulation** with ≤ 1 minor warning total *(document accepted warnings)*
- [ ] No NPC knowledge bleed in scripted scenarios (Comune/Voss cross-knowledge cases pass)

#### Replicability

- [ ] Story #2 created **only via admin editor** (no new TS prompt files)
- [ ] Story #2 attachable to shop + startable as game with first letter
- [ ] `docs/authoring-new-story.md` — step-by-step for creators

#### Regression

- [ ] Shop, checkout, admin order, start game still work
- [ ] Auth / admin gate unchanged

#### Human sign-off

- [ ] You play **10+ turns** of Voss (mix Voss + Comune letters)
- [ ] In-fiction dates feel coherent
- [ ] No obvious plot holes in your playthrough *(or logged as known limitations)*

### Must not (out of scope)

- Physical print pipeline
- Mobile app
- Multi-model AI providers

### Gate to MVP complete

All Phase 5 checks pass + your manual 10-turn sign-off. Platform ready for internal beta.

---

## Phase 6 — Physical letters & ops *(later, optional)*

### Goal

Bridge online game to real-world letter fulfillment.

### Deliverables

1. Print-ready export (PDF/HTML) per approved interaction
2. Admin fulfillment view
3. Audit trail for physical sends

### Must pass

- [ ] Export approved interactions as print-ready letter assets
- [ ] Admin fulfillment view: order → game → letters to print/mail
- [ ] Audit trail: which interaction was physically sent and when
- [ ] Online test area remains available for QA without shipping

### Gate

Operational workflow documented; at least one test order fulfilled end-to-end on paper.

---

## Phase retrospective template (for Fable / Claude Code)

After each phase, run this and **stop** until human approval:

```text
Phase N retrospective

1. Open docs/story-platform-phases.md — Phase N section
2. For each "Must pass" item: PASS / FAIL + evidence (test output, file path, screenshot)
3. List anything deferred with reason
4. List blockers for Phase N+1
5. Do NOT start Phase N+1 until I reply "Phase N approved"