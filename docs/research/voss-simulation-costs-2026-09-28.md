# Voss: completed AI-player runs and the $5 ceiling

Research date: 2026-09-28. Status: findings and candidate experiments; **no model, story architecture, or schema decision is approved by this note**. No paid model calls, database writes, or runtime changes were made for this research.

## Finding

An eight-exchange story with an AI player appears economically feasible below **$5 total model spend**, including planning, NPC letters, evaluation, and bounded retries. The present implementation cannot enforce that limit or establish that a run produced a finished story. Model price does not establish Italian letter-writing quality; the winning configuration must be tested against the actual failures reported by Paolo.

The user now prioritizes shipping a good Voss/Mercier story over story replicability, with 6–8 exchanges. The older 10/20/22-turn simulation plans are historical context, not the acceptance target for this work.

## Evidence from the reported game

The read-only snapshot of [game 3a998c2b-2053-486e-8a35-fd006a4026ce](http://192.168.1.225:4200/admin/game/3a998c2b-2053-486e-8a35-fd006a4026ce), captured on 2026-09-28, contains four turns, four draft versions, and 12 recorded calls, all `claude-opus-4-8`. Its stored price estimate totals **$1.143480**, using 128,506 input and 20,038 output tokens, with no cache tokens. This is an application estimate, not an Anthropic invoice reconciliation.

| Turn | NPC replies | Planner input / output | Voss input / output | Stored turn cost |
|---|---:|---:|---:|---:|
| 1 | 3 | 15,229 / 2,086 | 4,649 / 1,569 | $0.256055 |
| 2 | 1 | 19,350 / 2,555 | 7,544 / 1,920 | $0.246345 |
| 3 | 3 | 21,907 / 2,830 | 10,217 / 1,821 | $0.355625 |
| 4 | 1 | 25,766 / 2,047 | 12,450 / 1,728 | $0.285455 |

The planner accounts for $0.649210 (56.8%); the eight NPC calls account for $0.494270. Context grows substantially even with only four turns. Doubling the four-turn total would ignore that growth. The snapshot's current story allows eight turns and three player letters per turn; its current story rows are **not** a historical version of the bible used for each draft.

Source: the game's `interaction_turns`, `ai_drafts.usage`, `ai_drafts.cost_usd`, and current `stories.settings`, captured in `/tmp/voss-game-20260928.json` by the parent investigation. The temporary snapshot is not a durable project artifact; the aggregate evidence above is retained here. The [draft persistence code](../../apps/website/lib/reply-workflow.ts) explains the estimate's provenance.

## What is implemented

| Area | Observed behavior | Consequence |
|---|---|---|
| [Live harness](../../scripts/simulate-voss.ts) | Up to ten fixed player turns against real Claude; mutable in-memory history/state | A useful engine smoke test, not an adaptive AI player |
| Harness context | Starts with empty history, omitting opening letters; inserts the current player letters into history and also passes them as new letters | Different context from production, which excludes the open turn from history |
| Harness pacing | Does not pass `turnNumber`; loops by CLI count, not story completion or `max_turns` | Does not use production's scheduled-act path or prove a finale |
| Harness output | Prints response senders, dates, warnings, and aggregate state, not full letters or a persisted transcript | Does not deliver the requested finished story |
| Harness verdict | Counts deterministic validator results; warning overflow does not affect exit status | Does not evaluate specificity, agency, repetition, or bonding |
| [Mock simulation](../../packages/story-engine/src/__tests__/simulation.test.ts) | 22 scripted turns with canned planner/writer output | Tests state mechanics, not live narrative quality |
| [Provider factory](../../packages/story-engine/src/ai/createProvider.ts) | Claude implemented; OpenAI and DeepSeek throw as explicit stubs | Price rows are not implemented provider support |
| [Claude adapter](../../packages/story-engine/src/ai/claudeProvider.ts) | One model for every role, default Opus 4.8; forced tool call; no explicit cache configuration | Per-role selection and caching still require work |
| [Engine](../../packages/story-engine/src/engine/turnProcessor.ts) | Planner then parallel NPC writers; 8,000/6,000 output-token limits; up to three parse attempts per logical call | Those limits are much larger than the measured successful outputs |
| [Plan schema](../../packages/story-engine/src/schema/turnPlan.ts) | Replies array has a minimum but no maximum | Player letter count is not a bound on generated NPC calls |
| [Completion](../../apps/website/lib/reply-workflow.ts) | Approval updates runtime state and marks the turn sent; no game-completion transition here | Reaching a turn count or flags is not a terminal game outcome |

The existing [cost optimization documents](../../apps/website/ai-cost-reporting/cost-optimization/context.md) describe proposed benchmarks, per-role routing, and caching. They are useful prior work, but those proposals are not present in the inspected provider/harness. Their statement that system prompts are stable also needs revisiting: [prompt construction](../../packages/story-engine/src/prompts/templates.ts) embeds current state and writer reply windows in system text, so whole-system cache reuse cannot simply be assumed.

No `STORY_ENGINE_MODEL` or `STORY_ENGINE_PROVIDER` override appeared in the inspected `apps/website/.env` file. This does not establish the environment of every running process; the recorded game model is stronger evidence for this game.

## Cost accounting gaps

1. **Unknown price becomes zero.** [loadPricingMap/computeCostUsd](../../apps/website/lib/ai-pricing.ts) ignores the query error and returns zero for a missing model. The [current unit test](../../apps/website/lib/ai-pricing.test.ts) explicitly expects that behavior. A budgeted runner must fail before spending when pricing is missing, invalid, or unavailable.
2. **Recording happens after the whole batch succeeds.** [generateDraft](../../apps/website/lib/reply-workflow.ts) prices the usage sink only after generation and stores it with the resulting draft. If a writer fails, parsing exhausts its attempts, or persistence fails, completed paid calls can be absent from the database. Parallel siblings may finish after another call rejects.
3. **Some provider failures lose usage earlier.** [ClaudeProvider](../../packages/story-engine/src/ai/claudeProvider.ts) extracts usage but throws when the expected tool block is missing, before returning usage to the sink. Timeouts can also leave billing uncertain. Unknown usage must never mean free.
4. **There are two retry layers.** The engine retries malformed outputs twice. The installed Anthropic SDK also defaults to `maxRetries = 2` ([SDK source](../../node_modules/@anthropic-ai/sdk/src/client.ts)); the adapter does not override it. The application has no reservation around those hidden transport retries.
5. **No run budget exists.** Current types price only `orchestrator` and `npc_letter` calls. There is no AI-player/evaluator call kind, run ledger, preflight estimate, input cap, reservation, or remaining-cost check. Current cost columns are accounting after the event.
6. **Price provenance is incomplete.** Per-call dollar estimates are stored, but the exact rate row/version, service tier, geography, provider response model, request ID, and terminal billing uncertainty are not. `model` is the requested adapter model, not `response.model`. Historic estimates should remain distinguishable from later reconciled billing.

## Rates checked against official sources

USD per million text tokens, standard direct API pricing. These are rates, not recommendations. Confirm account access and the exact endpoint/configuration before an experiment.

### Anthropic

| Model | Input | Output | Cache read | 5-minute write | 1-hour write |
|---|---:|---:|---:|---:|---:|
| `claude-opus-4-8` | $5 | $25 | $0.50 | $6.25 | $10 |
| `claude-sonnet-4-6` | $3 | $15 | $0.30 | $3.75 | $6 |
| `claude-haiku-4-5` | $1 | $5 | $0.10 | $1.25 | $2 |
| `claude-fable-5` | $10 | $50 | $1 | $12.50 | $20 |

The four existing Claude rows still match these rates for their represented cache duration. Source: [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing).

Two newer candidates absent from the table are `claude-sonnet-5` at $2 input/$10 output, $0.20 cache read, $2.50/$4 writes; and `claude-opus-5-5` at $4/$20, $0.20 cache read, $5/$8 writes. Sources: [Sonnet 5 specifications](https://platform.claude.com/docs/en/models/sonnet-5/overview), [Opus 5.5 specifications](https://platform.claude.com/docs/en/models/opus-5-5/overview).

**An environment-only model swap is unsafe for compatibility:** Opus 5.5 rejects forced `tool_choice` with HTTP 400; this adapter always forces it. Sonnet 5 supports adaptive thinking and enables it by default. Thinking, output shape, and token limits require explicit testing. Sources: [forced-tool restrictions](https://platform.claude.com/docs/en/build-with-claude/thinking), [Sonnet 5 migration](https://platform.claude.com/docs/en/models/sonnet-5/migration-guide).

### OpenAI

| Model | Input | Output | Cache read | Cache write |
|---|---:|---:|---:|---:|
| `gpt-5.5` | $5 | $30 | $0.50 | No separate write tier |
| `gpt-5.4` | $2.50 | $15 | $0.25 | No separate write tier |
| `gpt-5.4-mini` | $0.75 | $4.50 | **$0.075** | No separate write tier |
| `gpt-6-sol` | $2 | $10 | $0.20 | $2.50 |
| `gpt-6-luna` | $0.10 | $0.50 | $0.01 | $0.125 |

The stored Mini cache-read price is zero and needs correction before using it. The GPT-6 rows are missing. Sources: official model pages for [5.5](https://developers.openai.com/api/docs/models/gpt-5.5), [5.4](https://developers.openai.com/api/docs/models/gpt-5.4), [5.4 Mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini), [6 Sol](https://developers.openai.com/api/docs/models/gpt-6-sol), and [6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna). Older-model cache-write treatment: [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching).

The GPT-6 figures above are for short-context Standard processing. Sol/Luna Chat Completions function calling requires reasoning set to `none`; Responses supports it with reasoning. This matters for adapting the current tool-based interface. Source: [GPT-6 Sol API specifications](https://developers.openai.com/api/docs/models/gpt-6-sol).

### DeepSeek

The existing rows are stale. Current `deepseek-flash` is V4.1 Flash; the legacy `deepseek-v4-flash` name routes to that replacement. Current input-miss/output/read rates are $0.30/$1.20/$0.006 at peak and $0.15/$0.60/$0.003 off-peak. V4 Pro is $1.32/$3.96/$0.044 at peak and $0.66/$1.98/$0.022 off-peak. A single unqualified row cannot represent both tariffs. Reserve at peak rates if this provider is explored. Source: [DeepSeek model and pricing documentation](https://api-docs.deepseek.com/quick_start/pricing/).

### Usage normalization matters

- **Claude:** `input_tokens` excludes cache reads and writes; the three input buckets add to total input. The current formula matches this convention. One write bucket cannot distinguish five-minute and one-hour charges. Source: [Claude cache usage](https://platform.claude.com/docs/en/build-with-claude/prompt-caching).
- **OpenAI:** `input_tokens` includes its cache-read and cache-write subsets; subtract them before multiplying the ordinary input rate. Copying total input into this app's Claude-shaped bucket would double-count. GPT-5.6 and later can incur 1.25× cache writes. Source: [OpenAI cache accounting formula](https://developers.openai.com/api/docs/guides/prompt-caching).
- **Reasoning:** billed output includes hidden thinking/reasoning, not just the returned letter. Do not add the breakdown again to the output total or estimate from visible prose. Output ceilings must include reasoning. Sources: [Claude thinking cost](https://platform.claude.com/docs/en/build-with-claude/thinking-steering-and-cost), [OpenAI reasoning limits](https://developers.openai.com/api/docs/guides/reasoning).
- **Input forecasts:** Anthropic's token counter is free but described as an estimate. It must count the complete request, including tools, against the selected model; tokenizers differ. Use headroom and reconcile actual usage. A preflight token estimate is not proof of an exact invoice ceiling. Source: [Anthropic token counting](https://platform.claude.com/docs/en/build-with-claude/token-counting).

## Candidate budget envelopes

These are **arithmetic feasibility examples, not measured quality results or selected architecture**. All assume eight player calls, eight planner calls, at most 16 generated NPC letters across the story, one final evaluation, direct global Standard pricing, no paid server tools, and no cache writes or discounts. Sixteen total NPC letters is an experimental scope assumption, not an approved contact restriction; an extra tribunal letter must use one of those slots or be budgeted separately. Per-call input caps cover the entire rendered request and output caps cover JSON plus all reasoning.

| Candidate | Player | Planner | NPC writer | Final evaluator | Base total | Repair policy | Total with repairs |
|---|---|---|---|---|---:|---|---:|
| A: retain Opus writers with smaller contexts | Haiku 4.5, 16k in/0.8k out | Sonnet 4.6, 18k/2k | Opus 4.8, 8k/1.5k | Opus 4.8, 40k/2k | $2.322 | One additional attempt for every call | **$4.644** |
| B: existing Sonnet generation, larger contexts | Haiku 4.5, 28k/1k | Sonnet 4.6, 35k/4k | Sonnet 4.6, 20k/2.5k | Opus 4.8, 70k/3k | $3.569 | Pool: 2 planner, 4 writer, 1 player, 1 evaluator repairs | **$4.747** |
| C: newer Sonnet candidate, larger contexts | Haiku 4.5, 28k/1k | Sonnet 5, 35k/4k | Sonnet 5, 20k/2.5k | Sonnet 5, 70k/3k | $2.354 | One additional attempt for every call | **$4.708** |

Calculation: sum `calls × (input_cap × input_rate + output_cap × output_rate) / 1,000,000`, then add the specified repairs. For example A's base is $0.160 player + $0.672 planner + $1.240 writers + $0.250 evaluator. Arithmetic was recomputed locally without API calls.

**A already exceeds its proposed context/output limits in the observed game.** It needs a materially smaller prompt/brief design and possibly shorter letters; do not sell it as a configuration-only improvement. B/C have more room, but later turns still need measurement against their caps. C's thinking must fit inside its output allowance, and its evaluator needs human calibration. Three NPC letters on every turn would exceed these 16-letter assumptions; price that scenario separately before adopting it.

These envelopes include their stated evaluations and repairs. Any additional LLM critic, summary, ending generation, experiment comparison, or regeneration must consume the same run budget. The figures refer to model API charges before taxes/currency conversion, not amortized hosting or human authoring costs. If the business constraint includes those items, deduct them from the available AI allowance first.

There is no economic evidence here that switching provider or supporting several engines is necessary. Conversely, these numbers do not establish that a cheaper planner will preserve causality: the planner's brief determines what the writer can accomplish. Compare complete configurations against the same quality criteria.

## Requirements for an honest budget guarantee

Proposed behavior, to be chosen and implemented after the interview:

1. **Validate the whole run before generation.** Freeze story, prompt, player persona, model/effort settings, pricing provenance, turn/letter limits, and repair allowance. Reject missing rates, unsupported configuration, or a complete-run upper estimate above an internal ceiling such as $4.75. Keep the remaining margin below the user's strict $5 threshold.
2. **Reserve before every paid attempt.** Reserve the worst permitted request cost, including possible cache-write rate and output ceiling. Reserve all NPC siblings atomically before launching parallel calls. Protect a minimum remaining budget for unfinished turns and final evaluation; checking only money already spent cannot do that.
3. **Count each physical attempt.** Disable hidden SDK retries or instrument and reserve them explicitly. Every retry consumes both an attempt allowance and money. A timeout keeps its reservation until billing is resolved; cancellation does not refund completed work. Retries across process restarts must not reset the budget.
4. **Persist usage independently of draft success.** Store per-attempt request ID, role, model, exact tariff, usage buckets, amount/reservation, and outcome even if parsing, a sibling, validation, or draft storage fails. Fail closed if this durable accounting cannot be written.
5. **Stop before the next unsafe call.** Unknown billing stays conservatively charged at its reservation. Unknown tariff, unexpected usage shape, exhausted repairs, or inadequate remaining budget yields an explicit incomplete run, never $0 or a fabricated ending.
6. **Separate limits from success.** A cap can ensure the application stops spending; it cannot guarantee valid model output or literary completion under arbitrary provider failures. A passing run must reach a valid terminal outcome within 6–8 exchanges, emit its ending letters, satisfy validators, provide the complete transcript, and have accounted total below $5. A budget-aborted run is a failed run.

The $4.75 suggestion is headroom, not a claim that provider invoice overruns are mathematically impossible. Actual input counts can differ from estimates; endpoint/tariff and billing uncertainties must be resolved conservatively before claiming the stronger guarantee. Provider billing reconciliation is distinct from app-side list-price estimates.

## What the requested trigger should produce

The minimal useful capability is one admin-triggered, resumable run with a player that sees **only player-visible letters, available contacts, and its own knowledge**. It must not receive the solution, future victims, private NPC facts, planner notes, or future ending conditions. It should choose recipients and write from what it actually received, including simultaneous letters when useful. Preserve production context assembly, time/progression rules, and validation; use an isolated simulation execution context rather than changing a real testing game's approval policy.

The durable result should contain the opening correspondence, each player turn and NPC batch, final outcome and any tribunal epilogue, plus a separate developer report with state transitions, validation failures, model/prompt/story snapshots, all attempt costs, and termination reason. Rendering that already-generated correspondence needs no additional model call. The deliverable is the actual completed playthrough, not an LLM summary claiming it happened.

For quality, evaluate the five reported problems directly: concrete usable details; answers/actions caused by the player's actual letter; multiple reachable correspondents; no generic affirmation-and-summary template; and personal continuity that creates attachment. Pair an adaptive player run with small deterministic regression scenarios covering a direct factual question, a surprising theory, personal conversation, multi-recipient evidence gathering, and an unsuccessful investigation. Use blind comparisons and human reading to calibrate any LLM judge. No public vendor benchmark establishes which model is best for this story.

## Recommended next experiment, not an architectural decision

First fix the simulation's fidelity and accounting, then run one capped eight-exchange baseline that records every letter and an explicit terminal result. Use that artifact to separate failures of story facts, pacing, planning, writing, and player behavior. Only then compare a small number of model configurations or a Voss-specific engine design. The existing code provides reusable building blocks, but today's harness and price display are not sufficient evidence that the requested feature already exists.
