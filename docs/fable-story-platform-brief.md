# Imbustai Story Platform — Master Brief

## Product vision

Imbustai commercializes **interactive epistolary stories** shipped as **real physical letters**. For now, an **online test/play area** on the website validates the experience before print/fulfillment.

Each **story** is a product in the shop. A paid order becomes a **game** (one game per order). The player writes letters; NPCs reply over time.

## Business flow (target)

1. User buys story on `/shop/[slug]` → Stripe → order `paid`
2. Admin starts game → first letter (from story definition)
3. Player plays at `/game/[id]/play` — compose one or more letters to different NPCs, send as one **turn**
4. Turn enters **pending** state — player sees "letters sent, awaiting reply"
5. Admin opens `/admin/game/[id]` → **Generate AI reply** (all NPCs in one batch)
6. Admin **reviews**, **edits**, or **regenerates** → **Approve & Send**
7. AI interactions saved with `visible_from` (real-world delay) + in-fiction story date
8. Player sees letters when rules allow
9. Repeat until story ending

## What exists today

### `apps/website` (target app) — Phase 1 ecommerce DONE

- Supabase auth, shop, Stripe, orders, admin start-game
- `stories` table: slug, titles, price, `first_letter` only — **not enough for full stories**
- `games` + `interactions` tables exist; `visible_from` column exists but unused
- User/admin game pages are **read-only** letter lists — **no play UI, no reply flow**

### `../imbustai-01-game` (reference prototype)

Rich client-side game:
- Multi-NPC, multi-letter per turn (composer + inbox)
- Structured JSON AI response (`responses[]`, `gameStateUpdates`, `narratorNotes`)
- `GameFlow`, `AIContextManager`, `FullContextStrategy`, `TimeSimulator`, `AIResponseParser`
- Hardcoded Voss murder mystery in `src/config/systemPrompt.ts`
- **Auto-sends AI immediately** on player submit — wrong for production
- Runs in browser with proxy; not integrated with Supabase

### `apps/tryout-01` (reference, do not edit)

- Simpler single-thread letter game
- `/api/game/reply` — immediate AI on submit
- Delayed responses via `visible_from` + admin settings
- Patterns to **port**, not copy wholesale

## Pain points from playtesting (MUST FIX)

### 1. NPC knowledge bleed

**Symptom:** Comune (or other NPC) references facts only Voss should know.

**Root cause:**
- Single Game Master prompt sees entire conversation
- `FullContextStrategy` puts ALL letters in one thread
- No per-character knowledge scope

**Required fix:**
- Per-NPC context: each character only sees what they sent/received + facts in their `knowledge_scope`
- Orchestrator plans which NPCs reply; optional separate LLM call per NPC with scoped context
- Canon registry: who knows what, when

### 2. Plot holes

**Symptom:** Contradictions, forgotten facts, inconsistent timeline.

**Root cause:**
- Story exists only as prose in system prompt
- Clues stored as bare IDs without validation
- No post-generation consistency check

**Required fix:**
- Structured story bible: facts, timeline, acts, clues (true/misleading/false), endings
- Validator runs on AI draft before admin sees it (flag contradictions)
- Admin still has final say

### 3. Time management broken

**Symptom:** Letter dates don't make narrative sense; timing feels random.

**Root cause:**
- Prompt tells AI to set `dateSent` strategically
- `AIResponseParser` **ignores** `dateSent` for delivery and uses `timeInGame` + random NPC delay
- `timeInGame` doesn't advance coherently
- Confusion between in-fiction dates and real `visible_from`

**Required fix:**
- Story editor: start date, per-character response delays (min/max days), act deadlines
- Single `TimeService`: computes in-fiction `story_date` from editor rules
- `visible_from` = optional real-world delay for online test (separate from story date)
- Store both on interactions

## Functional requirements

### Player experience (like prototype, on website)

- Contact list of NPCs (locked/unlocked)
- Compose letters to multiple recipients per turn
- Review all drafts → send all as one turn
- Inbox with received letters (markdown)
- "Waiting for reply" state between turn submit and admin approval + delay
- Game state: act, in-fiction date, turn number

### Admin experience

- Dashboard: games needing reply (pending turns queue)
- Game detail: full interaction history
- **Reply workflow:**
  - See pending user turn (1+ user letters grouped)
  - Button: **Generate AI reply**
  - Show structured multi-NPC draft (one card per NPC letter)
  - **Edit** text inline
  - **Regenerate** (full or per-NPC if architecture supports)
  - **Approve & Send** → writes AI interactions, sets dates/delays
- Story editor (admin):
  - Story metadata (already in shop)
  - Characters: id, name, role, voice, knowledge_scope, responsiveness, hidden agenda, unlock rules
  - Acts, timeline events, clues, endings
  - Time configuration
  - First letter content
  - Optional: `allow_dynamic_npcs` — AI may propose new NPCs for creator approval

### AI requirements

- Single provider (Claude) with structured JSON output
- One generation produces **all NPC replies for the turn**
- Include internal `narratorNotes` for admin (not shown to player)
- `gameStateUpdates`: clues found, NPCs unlocked, act progression, psych profile (optional v1)

### Multi-story / replicability

- Creating story #2 must not require editing TypeScript prompts
- Story definition = database + editor UI
- Engine reads story config at runtime

## Proposed data model (draft — refine in Phase 0)

### Extend / add tables

**`stories`** — add: `settings jsonb`, `time_config jsonb`, `allow_dynamic_npcs boolean`

**`story_characters`** — story_id, slug, name, role, voice, knowledge_scope jsonb, responsiveness, hidden_agenda, contactable, sort_order

**`story_acts`** — story_id, act_number, title, goals jsonb, reveal_rules jsonb

**`story_facts`** — story_id, fact_id, content, category, known_by character slugs[], revealed_after_turn

**`story_clues`** — story_id, clue_id, description, reliability, act_available

**`story_endings`** — story_id, ending_id, conditions jsonb, description

**`games`** — add: `runtime_state jsonb` (act, story_date, unlocked_npcs, clues_found, current_turn)

**`interaction_turns`** — game_id, turn_number, status (`pending_ai` | `draft_ready` | `approved` | `sent`), user_submitted_at

**`ai_drafts`** — turn_id, version, responses jsonb, narrator_notes, validation_warnings jsonb, created_at

**`interactions`** — add: `character_slug text`, `story_date date`, `turn_id uuid`; keep `visible_from`

Link user letters to `turn_id` when submitted.

## Architecture sketch



Story Editor (admin) → story tables ↓ Player Turn → interaction_turns (pending_ai) ↓ Admin Generate → story-engine → Claude → ai_drafts ↓ Canon Validator → warnings on draft ↓ Admin Approve → interactions (service role) + update runtime_state ↓ Player sees letters (visible_from + story_date rules)



## AI architecture options (pick in Phase 0)

**Option A (recommended):** Orchestrator + per-NPC scoped calls → merge into one batch

**Option B:** Single call + strict JSON schema + post-validation

Either way: admin approval is the production safety net.

## Port map (from prototype)

| Source | Target |
|--------|--------|
| `GameFlow`, `AIResponseParser`, response schema | `packages/story-engine` |
| `TimeSimulator` | Replace with `TimeService` driven by editor config |
| `FullContextStrategy` | Replace with scoped context builder |
| `MASTER_SYSTEM_PROMPT` | Decompose into story seed data + small engine prompts |
| Composer, Inbox, ContactList, SendAll | `apps/website` play UI |
| Vitest e2e + fixtures | `packages/story-engine` tests |
| tryout reply route | Pattern for API routes — but **admin gate**, not auto-send |

## Testing requirements

- Port and extend `../imbustai-01-game/src/test/e2e/`
- Manual scenarios: `../imbustai-01-game/MANUAL_TESTING_LETTERS.md`
- Automated canon consistency tests
- Phase 0 success: 3 consecutive simulated turns with zero canon violations

## Out of scope (later)

- Physical letter print/export pipeline
- Mobile app
- Multi-model provider switching
- Changes to `apps/tryout-01`
- Analytics dashboard (tryout has patterns)

## Original plans (context)

- Website ecommerce: `.cursor/plans/website_supabase_ecommerce_c5ff080e.plan.md` — explicitly deferred "full interaction reply flow"
- tryout game: `.cursor/plans/tryout-01_letter_game_c4f09dfc.plan.md`
- Delayed responses: `.cursor/plans/delayed_responses_feature_d4042f76.plan.md`

## Phase 0 deliverables (first session)

1. `docs/story-engine-architecture.md` — final schema, AI pattern, time model, workflow states
2. Draft SQL migration(s) in `supabase/migrations/`
3. File port list with dependencies
4. Risk register
5. **Stop for human approval before implementing**