# Story Engine — Architecture (Phase 0)

Status: **DRAFT — awaiting human approval (Phase 0 gate)**
Related: `CLAUDE.md`, `docs/fable-story-platform-brief.md`, `docs/draft-phases.md`, `docs/voss-seed-plan.md`, draft migration `supabase/migrations/20260611120000_story_engine_draft.sql`

---

## 1. AI architecture — Option A: orchestrator + scoped per-NPC calls

### Decision

**One admin-triggered "generate" produces one reviewable batch, built internally from N+1 scoped Claude calls:**

```
Admin clicks "Generate AI reply" on a pending turn
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│ Call 1 — ORCHESTRATOR (Game Master)                      │
│ Sees: full story bible + full game state + player letters │
│ Outputs (structured JSON, no letters):                    │
│   - which NPCs reply this turn (and who stays silent)     │
│   - per-NPC brief: what to say / withhold / how to spin   │
│   - clues to release, facts to reference (by key)         │
│   - gameStateUpdates (act, unlocks, clues, psych)         │
│   - narratorNotes (admin-only)                            │
└──────────────────────────────────────────────────────────┘
        │ one brief per replying NPC
        ▼
┌──────────────────────────────────────────────────────────┐
│ Calls 2..N — one per replying NPC (parallel)              │
│ Each sees ONLY:                                           │
│   - that NPC's persona/voice/hidden agenda                │
│   - facts where slug ∈ known_by (or public)               │
│   - letters to/from that NPC only                         │
│   - the orchestrator's brief for that NPC                 │
│ Outputs: that NPC's letter (structured)                   │
└──────────────────────────────────────────────────────────┘
        │ merge
        ▼
   ai_drafts row (version N): responses[] + gameStateUpdates
   + narratorNotes + canon-validator warnings
        │
        ▼
   Admin reviews / edits / regenerates → Approve & Send
```

### Rationale (vs Option B: single call + validator)

| | A: orchestrator + scoped calls | B: single call + validator |
|---|---|---|
| Knowledge bleed | **Structurally impossible** — NPC writer's context window literally does not contain other NPCs' private facts or letters | Only mitigated by prompting; validator can flag but not prevent — this is the prototype's root-cause bug |
| Batch coherence | Orchestrator plans all replies together (no contradictions between letters) | Native (one context) |
| Cost/latency | N+1 calls, ~$0.25–0.45/turn on Opus 4.8 | 1 call, ~$0.10–0.20/turn |
| Per-NPC regenerate | Natural (re-run one NPC call with same brief) | Requires full-batch regenerate |
| Complexity | Higher (brief schema, merge step) | Lower |

The cost difference is cents, generation is admin-triggered and asynchronous (latency invisible to the player), and knowledge bleed is the #1 playtesting pain point. **Option A wins.** Per-NPC regenerate comes nearly for free, which the brief lists as a bonus.

### Model & call shape

- Model: `claude-opus-4-8` (default; configurable via env). Single provider — Claude only.
- Structured output enforced via the tool-use pattern ported from the prototype's `CLAUDE_GAME_RESPONSE_TOOL` (`tool_choice: {type: "tool"}`), split into two tools: `turn_plan` (orchestrator) and `npc_letter` (per-NPC).
- All calls server-side in the Next.js Route Handler (`/api/admin/turns/[turnId]/generate`), key in `ANTHROPIC_API_KEY` env, never in client bundle.
- The generic engine prompts (response format, GM mechanics, letter-writing craft) are small story-agnostic templates in `packages/story-engine/src/prompts/`. **All narrative content comes from DB rows** — no per-story prompt files (see `docs/voss-seed-plan.md`).

### Cost estimate (runtime, per player turn)

Orchestrator ~10–15K in / 1–2K out; each NPC call ~3–6K in / 1–2K out; typical 2–3 NPCs:
- Opus 4.8 ($5/$25 per Mtok): **~$0.25–0.45 per turn** → a full 20-turn Voss game ≈ $5–9.
- Sonnet 4.6 ($3/$15): ~$0.15–0.25 per turn (fallback option if quality holds in Phase 5 sims).

---

## 2. Data model

### Core vs optional story modules

The platform is **genre-agnostic**: not every story is a mystery. The only thing a story *must* have to be playable is metadata, a first letter, at least one contactable character, and time config. Everything else is an optional module — separate tables that may simply have zero rows. The engine, prompts, validator and editor all degrade gracefully when a module is unused.

| Module | Tables | Required? | If absent |
|---|---|---|---|
| **Core** | `stories` (+ settings/time_config), `story_characters` | ✅ yes | — (a story can't run without characters and a first letter) |
| Canon facts | `story_facts` | optional | Knowledge scoping falls back to correspondence isolation only (NPC sees just its own letters + persona); `knowledge_scope` validator rule is skipped |
| Acts / structure | `story_acts` | optional | No act tracking; orchestrator paces freely; act-related validator rules skipped |
| Clues | `story_clues` | optional | `cluesRevealed` metadata and clue dosing simply unused; clue validator rules skipped |
| Endings | `story_endings` | optional | Story ends at `settings.max_turns` or when the admin marks the game completed |

The Phase 2 editor presents optional modules as collapsible "add if you want" sections — a creator writing a slice-of-life epistolary story fills in characters + first letter + delays and publishes. Voss happens to exercise every module (it's the stress test), but nothing in engine code assumes mystery mechanics: clue reliability types, act dosing, ending conditions are all *data interpreted only when present*.

### ER overview

```
stories ─┬─< story_characters      (slug unique per story; persona, delays, unlock rules)
         ├─< story_acts            (act_number, turn range, goals)
         ├─< story_facts           (fact_key, known_by[] character slugs, is_public)
         ├─< story_clues           (clue_key, reliability, act_available)
         ├─< story_endings         (ending_key, conditions jsonb)
         │   + new columns: settings, time_config, allow_dynamic_npcs
         │
orders ──< games ──< interaction_turns ──< ai_drafts (versioned)
         │   + new column: runtime_state jsonb        │
         │                                            │
         └─────────< interactions ────────────────────┘
                      + new columns: character_slug, story_date, turn_id
```

### Table list

**Extended: `stories`**
| column | type | notes |
|---|---|---|
| `settings` | jsonb default `{}` | `{max_letters_per_turn: 4, max_turns, locale}` |
| `time_config` | jsonb default `{}` | see §4 (Time model) for shape |
| `allow_dynamic_npcs` | boolean default false | creator opt-in: orchestrator may *propose* new NPCs (admin approves via review UI before they exist) |
| `lifecycle` | text default `'draft'` | `draft → testing → released` — see "Story lifecycle" below |

**Story lifecycle (decision R6, 2026-06-11):**

| lifecycle | playable? | AI reply flow |
|---|---|---|
| `draft` | no (writer still authoring) | — |
| `testing` | writer/admin test games | **review gate**: generate → review/edit/regenerate → approve (the Phase 3 workflow) |
| `released` | sold via shop (`is_published` controls listing; only released stories may be published) | **auto-send**: on player submit the server runs generate → canon-validate → auto-approve in one flow. Safety valve: if the validator reports *errors* (not mere warnings), the turn holds at `draft_ready` and appears in the admin queue instead of auto-sending. |

The pipeline is identical in both modes — auto-send is just the approve step invoked programmatically. The review gate is therefore an authoring/QA tool, not a permanent production bottleneck. (This supersedes the original "every batch is admin-reviewed" non-negotiable; CLAUDE.md updated accordingly.)

**New: `story_characters`** — slug, name, role, `personality` jsonb (traits, speech_pattern, voice notes), `backstory`, `hidden_agenda` (player must NEVER see), `knowledge_notes` (prose scope description for the prompt; the authoritative fact mapping is `story_facts.known_by`), `responsiveness` label + `reply_delay_min_days`/`reply_delay_max_days` (editor-driven, used by TimeService), `contactable_from_start`, `unlock_rules` jsonb, `sort_order`. Unique `(story_id, slug)`.

**New: `story_acts`** — `act_number`, `title`, `goals` jsonb, `turn_min`/`turn_max`, `reveal_rules` jsonb. Unique `(story_id, act_number)`.

**New: `story_facts`** — `fact_key`, `content`, `category`, `known_by text[]` (character slugs), `is_public` boolean (known to everyone incl. player-world), `reveal_act` (earliest act it may surface). Unique `(story_id, fact_key)`. This is the **canon registry**: who knows what, when.

**New: `story_clues`** — `clue_key`, `description`, `reliability` (`true_useful | true_misleading | false_coherent | red_herring`), `category` (`physical | testimonial | documentary | subtle`), `act_available`, `source_character_slug` (who can plausibly reveal it). Unique `(story_id, clue_key)`.

**New: `story_endings`** — `ending_key`, `title`, `conditions` jsonb (e.g. `{"victim_saved": true, "killer_identified": true}`), `narrative_guidance` text. Unique `(story_id, ending_key)`.

**Extended: `games`** — `runtime_state` jsonb default `{}`:
```json
{
  "current_turn": 3,
  "current_act": 1,
  "story_date": "2025-08-14",
  "unlocked_npcs": ["voss", "comune"],
  "clues_found": ["clue_appointment_21"],
  "psych_profile": { "...optional v1..." : 0 }
}
```
Updated only server-side (service role) at game start and at turn approve.

**New: `interaction_turns`** — `game_id`, `turn_number`, `status` (`pending_ai | draft_ready | approved | sent`), `user_submitted_at`, `approved_at`, `sent_at`. Unique `(game_id, turn_number)`.

**New: `ai_drafts`** — `turn_id`, `version` (unique per turn), `responses` jsonb (the batch: array of `{character_slug, story_date_proposed, content, metadata}`), `game_state_updates` jsonb, `narrator_notes` text, `validation_warnings` jsonb default `[]`, `source` (`generated | regenerated | edited`), `model` text. Full version history preserved; "current" = highest version.

**Extended: `interactions`** — `character_slug` (null for user letters addressed via `recipient_slug`… see note), `story_date` date, `turn_id` uuid. Note: for user letters `character_slug` = the **recipient** NPC; for AI letters it's the **sender** NPC. The existing `role` column disambiguates direction.

### RLS (full DDL in the draft migration)

- **All `story_*` tables: admin-only** (select + write). Hidden agendas, facts, clues, endings are spoilers; players must never read these tables. The player-facing contact list (slug, name, role of *unlocked* NPCs only) is served by a server component/route using the service-role client with explicit column selection.
- **`interaction_turns`**: select via owning game or admin; no authenticated insert/update (server routes use service role after verifying ownership) — same pattern as `games`/`interactions` today.
- **`ai_drafts`**: admin select only; service-role writes. Players can never read unapproved AI content.
- **`interactions` policy tightened** (replaces the current select policy): owner sees own game's interactions only where `role = 'user'` OR `visible_from` is null OR `visible_from <= now()`; admin sees all. Today the owner could read future-`visible_from` letters; the draft migration fixes this.
- **No path lets an authenticated user insert AI interactions** — there is still no insert policy on `interactions` at all; only service role writes, and the only code path that writes `role='ai'` rows is the approve route behind `requireAdmin()`.

---

## 3. Turn state machine

```
                      player submits turn (1+ letters)
                                 │ (service role: create turn + user interactions; NO AI call)
                                 ▼
                           ┌──────────┐
        ┌─ regenerate ──── │pending_ai│
        │  (new draft       └────┬─────┘
        │   version)             │ admin: POST generate  → orchestrator + NPC calls → ai_drafts v1 + validation
        ▼                        ▼
   ┌───────────┐  edit (new draft version, source='edited')
   │draft_ready│ ◄──────────────┐
   └────┬──────┘ ───────────────┘
        │ admin: POST approve (picks a draft version)
        ▼
   ┌──────────┐   same transaction: TimeService dates → insert AI interactions
   │ approved │   (service role) → update runtime_state → stamp sent_at
   └────┬─────┘
        ▼
   ┌──────────┐   letters reach player when visible_from allows
   │   sent   │
   └──────────┘
```

| Transition | Actor | Route | Effects |
|---|---|---|---|
| (create) → `pending_ai` | player (owner) | `POST /api/game/[gameId]/turns` | insert turn + user `interactions` rows (service role after SSR ownership check). **No AI involved.** |
| `pending_ai` → `draft_ready` | admin | `POST /api/admin/turns/[turnId]/generate` | server-side Claude calls → `ai_drafts` v1 + canon warnings |
| `draft_ready` → `draft_ready` | admin | `POST .../regenerate` (full batch or `?character=slug`), `PATCH /api/admin/drafts/[draftId]` (edit) | new `ai_drafts` version (`regenerated` / `edited`); history kept |
| `draft_ready` → `approved` → `sent` | admin | `POST /api/admin/turns/[turnId]/approve` | one service-role transaction: insert AI `interactions` with `story_date` + `visible_from`, apply `game_state_updates` to `runtime_state`, set `approved_at`/`sent_at`. `approved` and `sent` are split states so Phase 6 (physical letters) can put fulfillment between them; online play collapses them in one transaction. |

Invariants (enforced + tested): a turn can never skip `draft_ready`; AI `interactions` rows exist only for turns in `sent`; exactly one turn per game may be in a non-`sent` state at a time (player can't submit a new turn while one is pending).

---

## 4. Unified time model

Two clocks, both stored per letter, never conflated:

| | `interactions.story_date` (in-fiction) | `interactions.visible_from` (real world) |
|---|---|---|
| Meaning | The date written on the letter inside the story | When the player's UI may reveal the letter |
| Source | `TimeService` from story `time_config` + per-character delays | story `time_config.visible_delay` at approve time |
| Player letters | = game's current `runtime_state.story_date` | null (own letters always visible) |
| AI letters | = player turn's story_date + deterministic delay in `[reply_delay_min_days, reply_delay_max_days]` for that character | `now() + random(min,max minutes)` clamped to 08:00–23:00 (tryout-01 `computeVisibleFrom` pattern), or null if disabled |

`stories.time_config` shape:
```json
{
  "story_start_date": "2025-08-02",
  "visible_delay": { "enabled": true, "min_minutes": 30, "max_minutes": 180 },
  "date_locale": "it-IT"
}
```
Per-character delays live on `story_characters` (editable in the Phase 2 editor), not in a prompt.

**Fix for the prototype bug** (`aiResponseParser.ts:87-95` ignored the AI's `dateSent` and recomputed from `timeInGame` + a fresh random delay): editor rules are authoritative. The NPC call still proposes `dateSent` (the AI may want dramatic timing); `TimeService.resolveStoryDate()` accepts it **iff** it falls inside the allowed window `[turn_date + min, turn_date + max]`, otherwise clamps to the window using a **deterministic** offset seeded by `(game_id, turn_number, character_slug)` — so regenerating a draft does not shuffle dates, and tests are reproducible. After approve, `runtime_state.story_date = max(story_date of all letters in the turn)`.

---

## 5. Per-NPC knowledge scoping

Context builder rule — for character `X` replying in game `G`:

```
context(X) =
    persona(X)                       # story_characters row: voice, traits, backstory, hidden_agenda
  + facts where X ∈ known_by         # story_facts
  + facts where is_public            # filtered by reveal_act <= current act
  + correspondence(G, X) only        # interactions where character_slug = X (both directions)
  + orchestrator brief for X         # what to say/withhold THIS turn, clue keys to weave in
```

Explicitly **excluded**: other NPCs' letters, facts whose `known_by` doesn't include X, narratorNotes from past turns, the story's endings/twist (unless X's hidden_agenda requires it — e.g. Voss-as-possible-killer knows what Voss knows).

The orchestrator sees everything (it's the GM), but it **does not write letters** — it can only influence an NPC through the brief, and the brief is itself validated: a brief that instructs X to reveal a fact outside X's scope is flagged before the NPC call runs (warning surfaces to admin; generation proceeds — admin has final say).

This replaces the prototype's `FullContextStrategy` (all letters from all NPCs in one thread), which is the root cause of the Comune-knows-Voss-facts bleed.

**Without the facts module** (story has zero `story_facts` rows), scoping still holds at the correspondence level: each NPC sees only its own letters and persona, which already prevents the cross-NPC bleed. The fact registry adds *finer-grained* secrets control for stories that want it — it is not required.

---

## 6. Canon validation

Deterministic, rule-based checks run on every draft (and re-run on edited versions) in `packages/story-engine/src/validator/`. Results stored in `ai_drafts.validation_warnings` and rendered in the admin review UI. **Warnings never block** — the admin has final say.

**Rules are conditional on the modules the story uses**: a story with no facts/clues/acts/endings rows gets only `timeline_order` and `state_sanity` (which apply to every story). No rule ever *requires* a creator to author mystery-style data.

| Rule | Check |
|---|---|
| `knowledge_scope` | Each letter's `cluesRevealed`/fact references (orchestrator must cite fact/clue **keys** in the brief and letter metadata) ⊆ sender's scope. Plus a heuristic text scan for distinctive strings of out-of-scope facts (names, dates, addresses from the fact registry). |
| `timeline_order` | `story_date`s in window; no letter dated before the letter it answers; no date regression vs `runtime_state.story_date`. |
| `clue_act` | Released clues have `act_available <= current act` (after applying any `actProgression` in this batch). |
| `fact_consistency` | Letter metadata facts don't contradict the registry (key-level: a fact marked false-coherent can't be presented by a character that knows the true fact, etc.). |
| `state_sanity` | `newNPCsUnlocked` exist in `story_characters` (or `allow_dynamic_npcs` is on → rendered as a *proposal* card for the admin); `actProgression` never decreases; clue keys exist. |
| `ending_conditions` | If act = final, batch is consistent with exactly one ending's conditions. |

LLM-based consistency checking (a cheap Haiku pass over draft + canon) is a Phase 5 candidate, not v1.

---

## 7. API routes

All under `apps/website/app/`. Conventions: `requireAdmin()` from `lib/require-admin.ts`; SSR client for auth; `createAdminClient()` (service role) for writes; same shapes as `app/api/admin/orders/[orderId]/start-game/route.ts`.

| Route | Method | Auth | Client | Purpose |
|---|---|---|---|---|
| `/api/game/[gameId]/turns` | POST | owner (SSR) | service role | Submit turn: validate game `in_progress`, no open turn, recipients unlocked, letter lengths; insert `interaction_turns` (pending_ai) + user `interactions`. |
| `/api/game/[gameId]/state` | GET | owner or admin | service role (column-filtered) | Contact list (safe fields of unlocked NPCs), current in-fiction date, turn/act number, open-turn status. |
| `/api/admin/turns/[turnId]/generate` | POST | `requireAdmin()` | service role + Claude | Orchestrator + scoped NPC calls → `ai_drafts` v1 → `draft_ready`. |
| `/api/admin/turns/[turnId]/regenerate` | POST | `requireAdmin()` | service role + Claude | New draft version. Body may include `{character_slug}` (single-NPC regen) and `{admin_guidance}` (free-text steer). |
| `/api/admin/drafts/[draftId]` | PATCH | `requireAdmin()` | service role | Save admin edits → new version with `source='edited'`. |
| `/api/admin/turns/[turnId]/approve` | POST | `requireAdmin()` | service role (transaction) | Body `{draft_id}`. TimeService dates → insert AI `interactions` → apply state updates → `sent`. |

Player reveal updates (Phase 4): polling `GET /api/game/[gameId]/state` (tryout pattern) first; Supabase Realtime is a bonus.

---

## 8. File port map (prototype → monorepo)

| Source (`../imbustai-01-game/src/`) | Target | Mode |
|---|---|---|
| `types/aiResponseSchema.ts` | `packages/story-engine/src/schema/` (split: `turnPlan.ts`, `npcLetter.ts`, zod validation) | **port + extend** |
| `types/game.ts` (Letter, NPC, Clue, GameState) | `packages/story-engine/src/types/` (DB-row-aligned) | **port + rework** |
| `services/GameEngine/gameFlow.ts` | `packages/story-engine/src/engine/turnProcessor.ts` | **port skeleton** (build context → call → parse → validate → return draft; no auto-send, no state write) |
| `services/GameEngine/aiResponseParser.ts` | `packages/story-engine/src/engine/batchParser.ts` | **port + fix** (dateSent honored via TimeService window; keep NPC-id normalization) |
| `services/GameEngine/timeSimulator.ts` | `packages/story-engine/src/time/timeService.ts` | **replace** (editor-config-driven, deterministic seed) |
| `services/AIService/contextManager.ts` + `strategies/FullContextStrategy.ts` | `packages/story-engine/src/context/scopedContextBuilder.ts` | **replace** (anti-pattern reference only) |
| `services/AIService/providers/ClaudeProvider.ts` | `packages/story-engine/src/ai/claudeClient.ts` (official `@anthropic-ai/sdk`, server-only) | **rewrite** (prototype used raw fetch + browser key) |
| `config/systemPrompt.ts` | DB seed (`docs/voss-seed-plan.md`) + small generic prompts in `packages/story-engine/src/prompts/` | **decompose** |
| `services/GameEngine/npcManager.ts` | `packages/story-engine/src/engine/npcRegistry.ts` (DB-backed) | **rework** |
| `test/e2e/gameWorkflow.test.ts`, fixtures, `mocks/mockAIProvider.ts` | `packages/story-engine/src/__tests__/` | **port + adapt** |
| `components/LetterComposer`, `LetterInbox`, `ContactList`, `SendAllButton` | `apps/website/components/play/` (Phase 4) | **port UI patterns** |
| `store/gameStore.ts` | not ported (server state in DB; client state minimal) | **reference only** |
| `apps/tryout-01/app/api/game/reply/route.ts` (`computeVisibleFrom`) | `packages/story-engine/src/time/visibleFrom.ts` | **port pattern** (do not touch tryout-01) |
| `apps/tryout-01/components/game-view.tsx` (countdown/reveal UX) | Phase 4 play UI | **reference only** |

`packages/story-engine` is a TS-source workspace package like `@imbustai/i18n` (no build step, `transpilePackages` entry in `next.config.js`); root vitest already includes `packages/**/*.test.ts`.

---

## 9. Test plan

### Ported from prototype (Phase 1)
- Response schema validation (valid/invalid/edge fixtures from `test/fixtures/aiResponses/`).
- Batch parser tests incl. NPC-id normalization and **dateSent honored when in window / clamped when out** (regression test for the prototype bug).
- `gameWorkflow` e2e adapted: 20-turn simulation through 5 acts using `mockAIProvider` keyed by turn/act, against the engine package (no React/localStorage layer).

### New (Phase 1 gate requirements)
- **Knowledge scoping**: load Voss seed → `scopedContextBuilder('comune')` excludes every fact whose `known_by = ['voss']` and contains zero Voss-letter content; symmetric check for `voss`.
- **TimeService**: deterministic dates from `(game, turn, slug)` seed; editor config drives windows; regenerate doesn't change dates; `visible_from` business-hours clamp.
- **Canon validator**: one unit test per rule in §6 (fixture drafts that violate each rule).
- **State machine** (Phase 3): every legal transition + every illegal one rejected; "no auto-send" test — player submit path provably never writes `role='ai'` rows.
- **RLS** (Phase 1/3, against local Supabase): authenticated user cannot insert into `interactions`, cannot select `ai_drafts`, cannot select `story_facts`/`hidden_agenda`, cannot read letters with future `visible_from`.

### Manual (Phases 3–4, from `MANUAL_TESTING_LETTERS.md`)
- Phase 3: full admin cycle with Scenario "First Contact (A)" + "First Contact Comune" in one turn → generate → verify Comune draft has no Voss-only facts → edit one letter → approve → DB rows correct.
- Phase 4: 5-turn playthrough (Sequence 1 "Trusting Detective"), ≥2 turns with letters to both NPCs in the same turn, waiting + delayed reveal verified in browser.
- Phase 5: 10-turn sim, ≤1 minor warning; 3 consecutive turns zero canon errors (per draft-phases quality bar).

---

## 10. Risk register & open questions

| # | Risk / question | Impact | Mitigation / decision |
|---|---|---|---|
| R1 | **Cross-letter coherence in Option A**: scoped NPC calls could drift from the orchestrator's plan | Medium | Briefs are specific (facts by key, tone, what to withhold); validator checks letters against brief; admin review is the backstop. Re-evaluate in Phase 5 sims. |
| R2 | **Heuristic fact-leak detection is imperfect** (paraphrased leaks won't string-match) | Medium | Structural scoping prevents most; heuristic + admin review catch the rest; optional Haiku-based check in Phase 5. |
| R3 | **Editing a story with games in progress** | Medium | **DECIDED**: freely editable when no games in progress; with active games editing stays possible but the editor shows prominent warnings. Add **story duplication** ("duplicate as new draft") in the Phase 2 editor so writers iterate on a copy instead. |
| R4 | **Psych profile in v1?** | Low | **DECIDED** (maximize quality): keep `psych_profile` in `runtime_state`; the orchestrator both *updates it* and *receives it back* each turn, closing the personalization loop the prototype left open. |
| R5 | **Story content language** | Low | **DECIDED**: single locale per story (`settings.locale`) for now, but everything (prompts, TimeService date formatting, editor fields) flows the locale through so multi-language variants later are additive — likely via AI-translated story copies (translate first letter + bible, then play entirely in the target language). No bilingual narrative columns. |
| R6 | **Story lifecycle / admin review longevity** | High | **DECIDED**: `stories.lifecycle = draft → testing → released`. Review gate only in `testing`; `released` auto-sends after canon validation (validator errors hold the turn for review). See §2 "Story lifecycle". |
| R7 | **Letters per turn / open-turn lock** | Low | **DECIDED**: `max_letters_per_turn = 4` default; one open turn at a time; the player composes replies as drafts in the UI and sends all at once (epistolary rhythm). |
| R8 | **Supabase environment** | Medium | **DECIDED**: use the linked project already configured in `apps/website/.env`. Migrations applied there (CLI link or dashboard SQL editor — no local stack). |
| R9 | Draft migration filename has a future-ish timestamp; if other migrations land before approval, re-stamp before applying | Low | Re-check ordering at Phase 1 start. |
| R10 | **Claude API key provisioning** for the website backend (which org/key, spend cap) | Low | Needed before Phase 3. Per-turn cost ~$0.25–0.45 (Opus 4.8). |
| R11 | **Turn-number race**: concurrent submits creating duplicate turn numbers | Low | Unique `(game_id, turn_number)` + open-turn check in route; DB constraint is the backstop. |

Open questions are marked **OK? / Decide** above — answers can come with the "Phase 0 approved" reply.
