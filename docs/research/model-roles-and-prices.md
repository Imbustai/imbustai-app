# Model roles and prices: Claude and OpenAI

Research for [#17](https://github.com/Imbustai/imbustai-app/issues/17) on the map [#9](https://github.com/Imbustai/imbustai-app/issues/9), feeding [#29](https://github.com/Imbustai/imbustai-app/issues/29).

- **Research date:** 2026-09-29.
- **Sources:** every fact comes from the official Markdown exports of platform.claude.com and developers.openai.com, read that day (see [Sources](#sources)).
- **Spend:** no paid model calls.
- **Price convention:** USD per 1M tokens (MTok), standard tier, global or short-context processing, before tax.
- **Roles** are the model-profile roles decided in [#14](https://github.com/Imbustai/imbustai-app/issues/14): `writer`, `clerk`, `analyst`, `player`.

## Answer in brief

**What changed since #14.** Two Claude models are new: Claude Opus 5.5 (`claude-opus-5-5`, released 2026-09-22) and Claude Sonnet 5.5 (`claude-sonnet-5-5`, released 2026-09-28, same price as Sonnet 5). Claude Opus 5 and Claude Sonnet 5 are now "legacy": still available, not deprecated ([models overview][c-models], [deprecations][c-deprecations]). OpenAI's flagship is now GPT-6 Astra at $10/$50, the same list price as Fable 5.1. OpenAI also offers GPT-6 Sol and Luna and the GPT-5.6 Sol, Terra and Luna family ([OpenAI models][o-models]).

**Prices.** The [price table](#a-price-table-for-ai_model_pricing) below is ready to upsert. The current seed is missing every model released since June, prices `gpt-5.4-mini` cache reads at 0 instead of $0.075, and sets 0 in the OpenAI cache-write column.

**Candidates per role:**

| Role | Claude | OpenAI |
|---|---|---|
| `writer` | `claude-fable-5-1` (testing, per #14); `claude-opus-5-5`; `claude-sonnet-5-5` (budget) | `gpt-6-astra`; `gpt-5.6-sol`; `gpt-6-sol` (budget) |
| `clerk` | `claude-haiku-4-5`; `claude-sonnet-5-5` if the register is weak | `gpt-6-luna`; `gpt-5.6-luna` or `gpt-5.6-terra` as a step-up |
| `analyst` | `claude-sonnet-5-5`; `claude-haiku-4-5` for plain reading | `gpt-6-sol`; `gpt-5.6-terra`; `gpt-6-luna` for plain reading |
| `player` | `claude-sonnet-5-5`; `claude-haiku-4-5` | `gpt-6-sol`; `gpt-6-luna` |

**Provider shape.** Both providers should ask for native JSON-schema output, not a forced tool call: Claude `output_config.format`, OpenAI Responses `text.format` with `strict: true`. Claude Fable 5.1, Opus 5.5 and Sonnet 5.5 reject forced `tool_choice` with HTTP 400. On OpenAI, Chat Completions does not support tool calling with reasoning from GPT-5.4 on, so the OpenAI provider must use the Responses API.

**Usage accounting.** OpenAI's `input_tokens` includes both cached tokens and cache-write tokens. Subtract both before filling the app's Claude-shaped `input_tokens` bucket. On both providers, `output_tokens` already includes reasoning tokens.

**Run cost.** On the local notes' measured token profile (16 letters per 8-Turn Run):

- A Fable 5.1 writer costs **$5.4–8.6 per Run**, and the whole Run **$7.3–10.5**. It passes $10 with heavy thinking or retries.
- GPT-6 Astra has the same list price, so switching to it saves nothing.
- GPT-5.6 Sol or Opus 5.5 bring the writer down to about $2.1–3.4.
- GPT-6 Sol or Sonnet 5.5 bring it down to about $1.1–1.7.

## Code this affects

- [`claudeProvider.ts`](../../packages/story-engine/src/ai/claudeProvider.ts) forces `tool_choice: { type: 'tool' }`, defaults to `claude-opus-4-8`, and defaults `max_tokens` to 4,096.
- [`provider.ts`](../../packages/story-engine/src/ai/provider.ts) passes a `tool` definition as the schema carrier.
- [`ai-pricing.ts`](../../apps/website/lib/ai-pricing.ts) prices four Claude-style buckets. Input excludes cache reads and writes.
- [`20260627120000_ai_model_pricing.sql`](../../supabase/migrations/20260627120000_ai_model_pricing.sql) holds one cache-write column per model.
- The earlier local notes, `docs/research/voss-simulation-costs-2026-09-28.md`, are uncommitted. The token profile taken from them is restated in [(e)](#e-rough-per-run-cost-check).

## (a) Price table for `ai_model_pricing`

How to fill the cache columns:

- **Claude.** `cache_write` holds the **5-minute** write rate, which is the default TTL. The 1-hour rate goes in the notes because the table has a single write column. Writes cost 1.25x input for 5 minutes and 2x input for 1 hour. Reads cost 0.1x input, except **0.025x on Fable 5.1** and **0.05x on Opus 5.5** ([pricing][c-pricing]).
- **OpenAI GPT-5.6 and later, GPT-6 included.** Writes cost 1.25x input and reads 0.1x input ([prompt caching][o-caching]).
- **OpenAI GPT-5.5 and earlier.** There is "no additional cache-write charge" ([prompt caching][o-caching]). Put the **input rate** in the write column, not 0. The provider subtracts `cache_write_tokens` from input, so any reported writes then cost exactly what OpenAI bills.

| provider | model | input | output | cache read | cache write | notes | source |
|---|---|---:|---:|---:|---:|---|---|
| anthropic | `claude-fable-5-1` | 10.00 | 50.00 | 0.25 | 12.50 | 1h write $20. Read = 0.025x input. Released 2026-09-01. | [pricing][c-pricing], [model][c-fable51] |
| anthropic | `claude-opus-5-5` | 4.00 | 20.00 | 0.20 | 5.00 | 1h write $8. Read = 0.05x input. Released 2026-09-22. | [pricing][c-pricing], [model][c-opus55] |
| anthropic | `claude-opus-5` | 5.00 | 25.00 | 0.50 | 6.25 | 1h write $10. Legacy since Opus 5.5. | [pricing][c-pricing], [model][c-opus5] |
| anthropic | `claude-sonnet-5-5` | 2.00 | 10.00 | 0.20 | 2.50 | 1h write $4. Released 2026-09-28. | [pricing][c-pricing], [model][c-sonnet55] |
| anthropic | `claude-sonnet-5` | 2.00 | 10.00 | 0.20 | 2.50 | 1h write $4. $2/$10 is now the standard price; the planned 2026-09-01 rise to $3/$15 "will not occur". Legacy since Sonnet 5.5. | [pricing][c-pricing], [model][c-sonnet5] |
| anthropic | `claude-haiku-4-5` | 1.00 | 5.00 | 0.10 | 1.25 | 1h write $2. Alias of `claude-haiku-4-5-20251001`. | [pricing][c-pricing], [model][c-haiku45] |
| openai | `gpt-6-astra` | 10.00 | 50.00 | 1.00 | 12.50 | Up to 272K input. Above that: 2x input and cache rates, 1.5x output for the whole request. | [pricing][o-pricing], [model][o-gpt-6-astra] |
| openai | `gpt-6-sol` | 2.00 | 10.00 | 0.20 | 2.50 | Same 272K rule. | [pricing][o-pricing], [model][o-gpt-6-sol] |
| openai | `gpt-6-luna` | 0.10 | 0.50 | 0.01 | 0.125 | Same 272K rule. | [pricing][o-pricing], [model][o-gpt-6-luna] |
| openai | `gpt-5.6-sol` | 4.00 | 20.00 | 0.40 | 5.00 | Promotional price, "available at least through November 21, 2026". The `gpt-5.6` alias routes here. Same 272K rule. | [pricing][o-pricing], [model][o-gpt-5.6-sol] |
| openai | `gpt-5.6-terra` | 2.00 | 12.00 | 0.20 | 2.50 | Same 272K rule. | [pricing][o-pricing], [model][o-gpt-5.6-terra] |
| openai | `gpt-5.6-luna` | 0.20 | 1.20 | 0.02 | 0.25 | Same 272K rule. | [pricing][o-pricing], [model][o-gpt-5.6-luna] |
| openai | `gpt-5.5` | 5.00 | 30.00 | 0.50 | 5.00 | No write surcharge, so write = input rate. Above 272K: 2x input, 1.5x output. | [pricing][o-pricing], [model][o-gpt-5.5] |
| openai | `gpt-5.4` | 2.50 | 15.00 | 0.25 | 2.50 | No write surcharge. Same 272K rule as `gpt-5.5`. | [pricing][o-pricing], [model][o-gpt-5.4] |
| openai | `gpt-5.4-mini` | 0.75 | 4.50 | 0.075 | 0.75 | No write surcharge. Max input 272K. | [pricing][o-pricing], [model][o-gpt-5.4-mini] |
| openai | `gpt-5.4-nano` | 0.20 | 1.25 | 0.02 | 0.20 | No write surcharge. Max input 272K. | [pricing][o-pricing], [model][o-gpt-5.4-nano] |

Ready-to-use upsert. `model` is unique in the table, so `on conflict (model)` works. The notes carry the source and date.

```sql
insert into public.ai_model_pricing
  (provider, model, input_usd_per_mtok, output_usd_per_mtok, cache_read_usd_per_mtok, cache_write_usd_per_mtok, notes)
values
  ('anthropic', 'claude-fable-5-1', 10.00, 50.00, 0.250, 12.500, 'List 2026-09-29, platform.claude.com/docs/en/about-claude/pricing. Write = 5m TTL (1h: 20). Read 0.025x input.'),
  ('anthropic', 'claude-opus-5-5',   4.00, 20.00, 0.200,  5.000, 'List 2026-09-29, platform.claude.com pricing. Write = 5m TTL (1h: 8). Read 0.05x input.'),
  ('anthropic', 'claude-opus-5',     5.00, 25.00, 0.500,  6.250, 'List 2026-09-29, platform.claude.com pricing. Write = 5m TTL (1h: 10). Legacy.'),
  ('anthropic', 'claude-sonnet-5-5', 2.00, 10.00, 0.200,  2.500, 'List 2026-09-29, platform.claude.com pricing. Write = 5m TTL (1h: 4).'),
  ('anthropic', 'claude-sonnet-5',   2.00, 10.00, 0.200,  2.500, 'List 2026-09-29, platform.claude.com pricing. Write = 5m TTL (1h: 4). 2/10 is standard, not introductory. Legacy.'),
  ('anthropic', 'claude-haiku-4-5',  1.00,  5.00, 0.100,  1.250, 'List 2026-09-29, platform.claude.com pricing. Write = 5m TTL (1h: 2). Alias of claude-haiku-4-5-20251001.'),
  ('openai',    'gpt-6-astra',      10.00, 50.00, 1.000, 12.500, 'List 2026-09-29, developers.openai.com/api/docs/pricing. Standard, <=272K input. Write 1.25x input.'),
  ('openai',    'gpt-6-sol',         2.00, 10.00, 0.200,  2.500, 'List 2026-09-29, developers.openai.com pricing. Standard, <=272K input. Write 1.25x input.'),
  ('openai',    'gpt-6-luna',        0.10,  0.50, 0.010,  0.125, 'List 2026-09-29, developers.openai.com pricing. Standard, <=272K input. Write 1.25x input.'),
  ('openai',    'gpt-5.6-sol',       4.00, 20.00, 0.400,  5.000, 'List 2026-09-29, developers.openai.com pricing. Promo price at least through 2026-11-21. Standard, <=272K.'),
  ('openai',    'gpt-5.6-terra',     2.00, 12.00, 0.200,  2.500, 'List 2026-09-29, developers.openai.com pricing. Standard, <=272K input. Write 1.25x input.'),
  ('openai',    'gpt-5.6-luna',      0.20,  1.20, 0.020,  0.250, 'List 2026-09-29, developers.openai.com pricing. Standard, <=272K input. Write 1.25x input.'),
  ('openai',    'gpt-5.5',           5.00, 30.00, 0.500,  5.000, 'List 2026-09-29, developers.openai.com pricing. Standard, <272K. No write surcharge: write = input.'),
  ('openai',    'gpt-5.4',           2.50, 15.00, 0.250,  2.500, 'List 2026-09-29, developers.openai.com pricing. Standard, <272K. No write surcharge: write = input.'),
  ('openai',    'gpt-5.4-mini',      0.75,  4.50, 0.075,  0.750, 'List 2026-09-29, developers.openai.com pricing. Standard. No write surcharge: write = input.'),
  ('openai',    'gpt-5.4-nano',      0.20,  1.25, 0.020,  0.200, 'List 2026-09-29, developers.openai.com pricing. Standard. No write surcharge: write = input.')
on conflict (model) do update set
  provider = excluded.provider,
  input_usd_per_mtok = excluded.input_usd_per_mtok,
  output_usd_per_mtok = excluded.output_usd_per_mtok,
  cache_read_usd_per_mtok = excluded.cache_read_usd_per_mtok,
  cache_write_usd_per_mtok = excluded.cache_write_usd_per_mtok,
  notes = excluded.notes;
```

**Existing seed rows:**

- `claude-opus-4-8` ($5/$25/$0.50/$6.25), `claude-sonnet-4-6` ($3/$15/$0.30/$3.75) and `claude-fable-5` ($10/$50/$1/$12.50) still match list prices ([pricing][c-pricing]). They are no longer candidates.
- `ClaudeProvider.DEFAULT_MODEL` is still `claude-opus-4-8`. #14 makes an unknown model an error, so drop that row only after nothing requests it.
- `gpt-5.5` and `gpt-5.4` have the right prices, but their write column should be the input rate. The upsert above fixes that and the `gpt-5.4-mini` cache read.
- The DeepSeek rows were dropped by #14 and were not re-researched.

**Excluded OpenAI models:**

- `gpt-5.5-pro` and `gpt-5.4-pro`: $30/$180 with no cached-input discount ([pricing][o-pricing]).
- `chat-latest`: $5/$0.50/$30, and it points at a snapshot that is "regularly updated". OpenAI recommends GPT-6 Astra for production API use ([chat-latest][o-chat-latest]).
- Codex and Cyber variants, audio and realtime models: not relevant to these roles.
- Older GPT-5.x, GPT-4.x and o-series models: superseded. Several have scheduled shutdowns ([deprecations][o-deprecations]). No candidate above has a shutdown scheduled.

**What the table cannot express yet (for #29):**

1. **Claude 1-hour cache writes.** Usage splits writes into `cache_creation.ephemeral_5m_input_tokens` and `ephemeral_1h_input_tokens` ([prompt caching][c-caching]), but the table has one write rate. Either add a column or use only the 5-minute TTL.
2. **OpenAI long-context pricing.** Above 272K input, input and cache rates double and output rises 1.5x ([pricing][o-pricing]). Reject such requests in preflight or model the multiplier.
3. **Processing tiers:**
   - OpenAI Batch and Flex bill at 50% of Standard, and Fast mode at 2x ([pricing][o-pricing]).
   - Claude Batch bills at 50%.
   - Claude `inference_geo: "us"` adds 1.1x.
   - Claude Opus 5.5 fast mode costs $8/$40 ([pricing][c-pricing]).

   OpenAI responses report the tier actually used in `service_tier` ([Responses reference][o-ref-create]).
4. **Aliases.** The app prices by the requested model string. `gpt-5.6` resolves to `gpt-5.6-sol`, and `claude-haiku-4-5` to `claude-haiku-4-5-20251001`. If pricing ever keys on the model name in the response, add rows for the resolved IDs.

## (b) Candidate models per role

No official source ranks any model on Italian epistolary prose, voice or bonding. The writer choice stays with the blind comparison planned in #14. Both vendors say to set effort explicitly and sweep it on your own examples rather than carry settings over ([Claude effort][c-effort], [Using GPT-5.6][o-using-gpt56]).

### `writer`: Italian literary letters of up to 800 words (Voss, Adelaide, Epilogues)

- **`claude-fable-5-1`** is the testing writer decided in #14.
  - Anthropic positions it "for demanding reasoning and long-horizon agentic work" ([models overview][c-models]). Thinking is always on.
  - Its $0.25 cache reads make a cached Character prefix almost free. See the sensitivity in (e).
  - It costs $10/$50 and rejects forced tool use ([Fable 5.1][c-fable51-new]).
- **`claude-opus-5-5`** is the likely production contender.
  - Anthropic's models overview now says "start with Claude Opus 5.5 for most workloads" ([models overview][c-models]).
  - $4/$20. Its default effort is `medium`, not `high`.
- **`claude-opus-5`** is still callable but legacy, and dearer than Opus 5.5. The #14 blind comparison could replace it with Opus 5.5. That is a suggestion, not a decision.
- **`gpt-6-astra`** is OpenAI's flagship and "the best GPT" for the comparison.
  - OpenAI notes it "tends to use lists, tables and Markdown" and "may use recurring phrases across sessions", so the writer prompt must fix plain-prose style ([Using GPT-6][o-using-gpt6]).
  - It has no `none` effort, and tool calling requires the Responses API.
- **`gpt-5.6-sol`** matches Opus 5.5's price while its promotion lasts. OpenAI calls it the "flagship model for complex professional work" ([model][o-gpt-5.6-sol]).
- **Budget contenders:** **`gpt-6-sol`** and **`claude-sonnet-5-5`**, both $2/$10. OpenAI's selection guide maps "focused writing and editing" to Sol at low effort ([model selection][o-model-selection]).
- Not recommended: `gpt-5.5`. It costs more than GPT-5.6 Sol at promotional pricing. Its guide also notes a "more concise and direct" default style, so conversational uses "may need explicit personality, warmth" ([Using GPT-5.5][o-using-gpt55]).

### `clerk`: short bureaucratic documents

- **`claude-haiku-4-5`**: $1/$5, thinking off by default, and it still accepts forced tool use ([thinking][c-thinking]).
  - Caveats: its minimum cacheable prompt is 4,096 tokens, and it does not support the effort parameter ([prompt caching][c-caching], [effort][c-effort]).
  - It is "Active", with retirement "not sooner than October 15, 2026" and at least 60 days' notice before retirement ([deprecations][c-deprecations]).
  - Step up to **`claude-sonnet-5-5`** if the bureaucratic Italian register is weak.
- **`gpt-6-luna`**: $0.10/$0.50, "our most efficient model for focused, high-volume tasks" ([model][o-gpt-6-luna]). It supports effort `none`.
  - Alternatives: **`gpt-5.6-luna`** ($0.20/$1.20), or **`gpt-5.6-terra`** ($2/$12) as the step-up.

### `analyst`: reads the Player's letters into structured data and checks reply rules

- **`claude-sonnet-5-5`**: $2/$10, with structured outputs and adaptive thinking; default effort `high`, recalibrated against Sonnet 5 ([effort][c-effort]).
  - For plain reading, `thinking: {"type": "between_tools"}` turns off up-front thinking. Without tools, "the response contains only text" ([Sonnet 5.5][c-sonnet55-new]).
- **`claude-sonnet-5`** is legacy at the same price, and still accepts the current forced-tool adapter unchanged ([thinking][c-thinking]).
- **`claude-haiku-4-5`** can serve as the reader if extraction quality holds.
- **`gpt-6-sol`**: $2/$10, effort `none` to `max`, default `medium` ([model][o-gpt-6-sol]).
  - Alternatives: **`gpt-5.6-terra`** ($2/$12), and **`gpt-6-luna`** for plain reading.

### `player`: the AI Lead in QA Runs

- **`claude-sonnet-5-5`** or **`gpt-6-sol`**. The cheaper options are `claude-haiku-4-5` or `gpt-6-luna`.
- The player writes believable Italian letters under a persona from what a Player sees. Its cost is mostly input, up to about 28K tokens per call (see (e)).
- Runs are not latency-critical. OpenAI's **Flex** tier (`service_tier: "flex"`) bills at Batch rates, half of Standard, "in exchange for slower response times and occasional resource unavailability". It is in beta ([Flex][o-flex], [pricing][o-pricing]).

## (c) OpenAI provider implementation notes

### Responses API, not Chat Completions

- OpenAI: "While Chat Completions remains supported, Responses is recommended for all new projects". It adds that reasoning models give "improved model intelligence and performance" on Responses ([migration][o-migrate], [reasoning][o-reasoning]).
- The blocking reason: "Starting with GPT-5.4, Chat Completions does not support tool calling with `reasoning_effort` values other than `none`" ([migration][o-migrate]).
  - GPT-6 Astra: "Chat Completions does not support function calling with GPT-6 Astra" ([reasoning][o-reasoning]).
  - GPT-6 Sol and Luna: Chat Completions function calling works only with `reasoning_effort: "none"` ([model][o-gpt-6-sol], [Using GPT-6][o-using-gpt6]).
- Responses are stored by default. Set `store: false`. In stateless mode, reasoning items carry `encrypted_content`, which single-shot calls can ignore ([migration][o-migrate], [reasoning][o-reasoning]).
- For preflight estimates, `POST /v1/responses/input_tokens` returns the exact input count, formatting tokens included ([token counting][o-tokens]).

### Structured outputs vs function calling

- OpenAI's guidance: use function calling to connect the model to tools, and `text.format` "when you want to structure the model's output when it responds to the user" ([structured outputs][o-so]).
  - Our calls only want JSON back, so use `text: { format: { type: "json_schema", name, schema, strict: true } }`. This mirrors Claude's `output_config.format`.
- Function calling works too. In Responses, `tool_choice` accepts `auto`, `required`, a named function, or `allowed_tools`.
  - Responses normalizes a function schema to strict mode when `strict` is omitted. Chat Completions stays non-strict ([function calling][o-fc]).
- **Strict-schema rules** ([structured outputs][o-so]):
  - Every property must be in `required`; model an optional field as a union with `null`.
  - Every object needs `additionalProperties: false`, and the root must be an object, not `anyOf`.
  - Limits: 5,000 properties, 10 nesting levels, 1,000 enum values.
  - Not supported: `allOf`, `not`, `if`/`then`/`else`, `dependentRequired`, `dependentSchemas`.
  - Supported: `pattern`, `format`, numeric `minimum`/`maximum`, `minItems`/`maxItems`.
  - An unsupported schema with `strict: true` returns an error.
- **Claude's subset differs** ([Claude structured outputs][c-so]):
  - Optional properties are allowed, up to 24 per request.
  - `minItems` accepts only 0 or 1.
  - No numeric or string-length constraints, and no recursive schemas.
  - `additionalProperties: false` is required too.
  - Required properties are emitted first.
- **A schema that works on both:** every property required (nullable where optional), `additionalProperties: false` everywhere, no numeric, length or array-size constraints (enforce those with zod after parsing), and no recursion.
- **Edge cases.** The output may not match the schema when:
  - the response has `status: "incomplete"` with `incomplete_details.reason: "max_output_tokens"`, or
  - it carries a `refusal` content item ([structured outputs][o-so]).
- The seam: `StructuredRequest.tool` should become a named JSON schema for both providers.

### Reasoning settings

| Model | `reasoning.effort` values | Default |
|---|---|---|
| `gpt-6-astra` | `low`, `medium`, `high`, `xhigh`, `max`; `none` returns HTTP 400 | Not stated |
| `gpt-6-sol`, `gpt-6-luna` | `none` to `max` | `medium` |
| `gpt-5.6-sol`, `-terra`, `-luna` | `none` to `max` | `medium` |
| `gpt-5.5` | `none` to `xhigh` | `medium` |
| `gpt-5.4`, `-mini`, `-nano` | `none` to `xhigh` | `none` |

Sources: the model pages, [reasoning][o-reasoning] and [Using GPT-6][o-using-gpt6].

- When effort is not `none`, remove `temperature`, `top_p` and `top_logprobs` ([Using GPT-6][o-using-gpt6]).
- Leave `reasoning.mode` at `standard`. `pro` (GPT-5.6 and GPT-6) "performs more model work … increasing token usage and cost" ([reasoning][o-reasoning]).
- `text.verbosity` (`low`, `medium` or `high`; default `medium`) steers length alongside the prompt ([Using GPT-5.5][o-using-gpt55]).
- Changing `reasoning.effort` changes the cached prefix. Inside a conversation, GPT-6 can switch effort with a `configuration_update` item instead ([prompt caching][o-caching]). Single-shot calls don't need it.

### Output limits, reasoning included

- `max_output_tokens` is "an upper bound for the number of tokens that can be generated for a response, including visible output tokens and reasoning tokens" ([Responses reference][o-ref-create]).
- Hitting the cap returns `status: "incomplete"`, possibly "before any visible output tokens are produced". You still pay for input and reasoning.
- OpenAI suggests "reserving at least 25,000 tokens for reasoning and outputs" when you start experimenting ([reasoning][o-reasoning]).
- **Limits by model:**
  - Every candidate: 128,000 max output tokens.
  - GPT-6 and GPT-5.6: 1,050,000 context, 922,000 max input.
  - GPT-5.5 and GPT-5.4: 1,050,000 context.
  - GPT-5.4 mini and nano: 400,000 context, 272,000 max input.

  Sources: model pages.
- For a spend reservation, assume the worst case: `max_output_tokens` × output price, plus input × 1.25 × input price on GPT-5.6 and GPT-6, where every input token could be written to cache.

### Prompt caching and usage accounting

- Caching "is enabled by default for supported OpenAI models" ([prompt caching][o-caching]).
- **GPT-5.6 and later, GPT-6 included:**
  - Writes cost 1.25x input and reads 0.1x input.
  - `prompt_cache_options.ttl` has one value, `"30m"`, which is also the default.
  - The minimum prefix is 1,024 visible input tokens, and a request makes at most four cache writes.
  - In the default **implicit** mode, "OpenAI places a breakpoint at the end of the latest eligible message".
  - In **explicit** mode, "Content after the last selected breakpoint is processed at the uncached input-token rate without a cache-write charge". With no breakpoints, nothing is cached or written.
  - Use explicit mode with one `prompt_cache_breakpoint` after the stable prefix. Implicit mode would otherwise write prompts that are never reused, at the 1.25x rate.
- **GPT-5.5 and earlier:**
  - Implicit caching only, with no write surcharge.
  - `prompt_cache_retention`: `24h` only on GPT-5.5; `in_memory` or `24h` on the others.
  - A stable `prompt_cache_key` helps routing ([prompt caching][o-caching]).
- **Usage fields:**
  - Responses: `usage.input_tokens` and `usage.input_tokens_details.{cached_tokens, cache_write_tokens}`; `usage.output_tokens` and `usage.output_tokens_details.reasoning_tokens` ([Responses reference][o-ref-create]).
  - Chat Completions: `prompt_tokens_details.{cached_tokens, cache_write_tokens}` and `completion_tokens_details.reasoning_tokens` ([Chat Completions reference][o-ref-chat]).
  - Output counts include every generated token, including reasoning and formatting tokens ([token counting][o-tokens]).
- **OpenAI's own input-cost formula** ([prompt caching][o-caching]):

  ```
  ordinary_input_tokens = input_tokens - cached_tokens - cache_write_tokens
  input cost = ordinary × input rate + cached × read rate + cache_write × write rate
  ```

- **Mapping to `CallUsage`**, so that `computeCostUsd` works unchanged and nothing is counted twice:
  - `input_tokens` = `usage.input_tokens - cached_tokens - cache_write_tokens`
  - `cache_read_input_tokens` = `cached_tokens`
  - `cache_creation_input_tokens` = `cache_write_tokens`
  - `output_tokens` = `usage.output_tokens`. Never add `reasoning_tokens`; they are already included.

### Rejections similar to Claude's forced `tool_choice` restriction

- Chat Completions with function tools and reasoning is unsupported on GPT-5.4 and later. Only `reasoning_effort: "none"` works, and GPT-6 Astra has no Chat Completions function calling at all ([migration][o-migrate], [reasoning][o-reasoning]).
- `reasoning.effort: "none"` on GPT-6 Astra "returns HTTP 400" ([reasoning][o-reasoning]).
- `strict: true` with an unsupported JSON Schema returns an error ([structured outputs][o-so]).
- In the Responses API, forced `tool_choice` (`required` or a named function) is documented with no model exceptions ([function calling][o-fc], [Responses reference][o-ref-create]). The recommended `text.format` design avoids `tool_choice` altogether.

### Other settings

- GPT-5.6 runs cyber and biology classifiers that can block a request or pause it mid-stream. OpenAI recommends a stable, privacy-preserving `safety_identifier` for each end user ([Using GPT-5.6][o-using-gpt56]).

## (d) Claude API notes that affect the provider

| Model | Forced `tool_choice` (`any` or `tool`) | Thinking when omitted | Turning thinking off | Effort levels (default) | Non-default `temperature`/`top_p`/`top_k` | Max output | Min cacheable prompt |
|---|---|---|---|---|---|---|---|
| `claude-fable-5-1` | **400** | Adaptive, always on | Impossible: `disabled` and `enabled` both return 400 | low to max (`high`) | 400 | 128K | 512 |
| `claude-opus-5-5` | **400** | Adaptive, always on | Impossible, at every effort level | low to max (**`medium`**) | 400 | 128K | 512 |
| `claude-opus-5` | Accepted | Adaptive | `disabled` only at effort `high` or below | low to max (`high`) | 400 | 128K | 512 |
| `claude-sonnet-5-5` | **400** | Adaptive | `disabled` returns 400; `between_tools` turns off up-front thinking at `high` or below | low to max (`high`, recalibrated) | 400 | 128K | 512 |
| `claude-sonnet-5` | Accepted | Adaptive | `disabled` accepted | low to max (`high`) | 400 | 128K | 1,024 |
| `claude-haiku-4-5` | Accepted, except with manual extended thinking | Off | Already off; `adaptive` returns 400, extended thinking needs `budget_tokens` | Not supported | Allowed; limited only while thinking | 64K | 4,096 |

Sources: [thinking][c-thinking] (per-model table, the forced-tool section and the sampling rules), [effort][c-effort], [prompt caching][c-caching], and the what's-new pages for [Fable 5.1][c-fable51-new], [Opus 5.5][c-opus55-new] and [Sonnet 5.5][c-sonnet55-new].

What this means for `ClaudeProvider`:

1. **Replace the forced tool call.**
   - `tool_choice: { type: 'tool' }` returns `400 tool_choice: type "tool" and "any" are not supported for this model.` on Fable 5.1 (the testing writer), Opus 5.5 and Sonnet 5.5. The token-counting endpoint rejects it the same way.
   - Use `output_config: { format: { type: "json_schema", schema } }`. It is GA, needs no beta header, and lists all six Claude models above. The JSON arrives in a `text` block ([structured outputs][c-so]).
   - The alternative, `tool_choice: auto` with `strict: true` and a prompt instruction, guarantees schema-valid arguments but not that the tool gets called ([strict tool use][c-strict]).
2. **Select blocks by `type`.**
   - Responses can begin with `thinking` blocks.
   - `display` defaults to `"omitted"` on all 5.x models, so those blocks have empty text ([thinking][c-thinking]).
3. **Size `max_tokens` for thinking.**
   - `max_tokens` is a hard cap on thinking and text combined. Thinking is billed as output.
   - `usage.output_tokens` is the "inclusive, authoritative total". `output_tokens_details.thinking_tokens` is a breakdown only ([thinking cost][c-thinking-cost]).
   - The adapter's 4,096 default leaves little room for an 800-word letter once always-on thinking starts. This is an inference, to verify on the first test call.
   - The SDKs require streaming above 21,333 `max_tokens` ([thinking][c-thinking]).
4. **Set `output_config.effort` explicitly per role.** Opus 5.5 defaults to `medium`, the others to `high`. Changing effort or the thinking setting starts a new cache prefix ([thinking][c-thinking]).
5. **Structured-output limits** ([structured outputs][c-so]):
   - At most 20 strict tools, 24 optional parameters and 16 union-typed parameters per request.
   - The first use of a schema compiles a grammar, which is then cached for 24 hours.
   - Changing the format invalidates the prompt cache.
   - Incompatible with citations and with prefill.
   - A `refusal` or a hit `max_tokens` can yield output that doesn't match the schema.
   - Enum casing isn't guaranteed; compare enum values case-insensitively.
6. **Usage buckets.**
   - `input_tokens` excludes cache reads and writes: `total = cache_read + cache_creation + input_tokens`.
   - `cache_creation` splits 5-minute and 1-hour writes ([prompt caching][c-caching]).
   - The current `computeCostUsd` matches this shape.
7. **Refusals.**
   - Fable 5.1, Opus 5.5 and Sonnet 5.5 run safety classifiers. A decline is HTTP 200 with `stop_reason: "refusal"` and `stop_details`.
   - Server-side `fallbacks` (beta) can retry on another model ([Opus 5.5][c-opus55-new], [Sonnet 5.5][c-sonnet55-new]).
8. **Preserved thinking doesn't affect today's calls.**
   - On Fable 5.1, Opus 5.5 and Sonnet 5.5, thinking blocks are bound to the conversation prefix. Accounts created on or after 2026-08-31 get a 400 when history is edited ([Fable 5.1][c-fable51-new]).
   - The current provider sends one system and one user message and never replays thinking, so it is unaffected.
   - Any future multi-turn harness must stay append-only.
9. **Tokenizer.** "Claude 4.7 and later models" use a newer tokenizer that "produces approximately 30% more tokens for the same text"; Claude Sonnet 4.6 and earlier use the previous one ([pricing][c-pricing]). That covers every candidate except Haiku 4.5. Per-token prices therefore compare only approximately across tokenizers and providers.

## (e) Rough per-Run cost check

The token profile comes from the local notes (`voss-simulation-costs-2026-09-28.md`):

- **Measured game.** Game `3a998c2b`: four Turns, all calls on `claude-opus-4-8`, which ran without thinking.
  - Voss input grew 4,649 → 7,544 → 10,217 → 12,450 tokens, with 1,569–1,920 output tokens.
  - Planner input grew 15,229 → 25,766, with 2,047–2,830 output tokens.
  - Non-Voss letters averaged about 2.8K in and 0.9K out.
- **Caps.** The notes' per-call caps (envelopes B/C): player 28K/1K, planner 35K/4K, writer 20K/2.5K, evaluator 70K/3K. They also assume at most **16 generated letters per story**.

The "measured" profile extrapolates the growth linearly to eight Turns (Voss about +2.6K per Turn, planner about +3.5K). The "caps" profile uses the caps and is an upper bound. The planner maps to the analyst's reader call. The reply-rule checker (one per Character reply), the reasoning allowances and the letter counts are assumptions.

| Role | Calls per Run | Measured: in / out per call | Caps: in / out per call |
|---|---:|---|---|
| `writer` | 16 | 14K / 1.9K + thinking | 20K / 2K + thinking |
| `analyst`, reader | 8 | 27.6K / 2.4K | 35K / 4K |
| `analyst`, rule checker | 24 | 8K / 1K | 8K / 1K |
| `clerk` | 8 | 2.9K / 0.9K | 4K / 1K |
| `player` | 8 | 22K / 2K (incl. 1K reasoning) | 28K / 2K |
| final evaluator (`analyst`) | 1 | 40K / 2K | 70K / 3K |

- **Writer thinking.** Unmeasured, so bracketed at 2K ("light") and 6K ("heavy") tokens per letter.
- **Other roles.** They stay fixed while the writer changes:
  - Claude side: Sonnet 5.5, with Haiku 4.5 as clerk. $1.93 per Run (measured) or $2.35 (caps).
  - GPT side: GPT-6 Sol, with GPT-6 Luna as clerk. $1.88 or $2.29.
- **Pricing basis.** Uncached, Standard tier, the same token counts on both providers.

**Results, measured profile:**

| Writer | Writer per Run (light–heavy) | Run total (light–heavy) | Heavy + 25% retries | Heavy × 2 (every call retried once) |
|---|---|---|---:|---:|
| `claude-fable-5-1` | $5.36–8.56 | **$7.29–10.49** | $13.11 | $20.98 |
| `gpt-6-astra` | $5.36–8.56 | $7.24–10.44 | $13.04 | $20.87 |
| `gpt-5.5` | $2.99–4.91 | $4.87–6.79 | $8.48 | $13.58 |
| `claude-opus-5` | $2.68–4.28 | $4.61–6.21 | $7.76 | $12.42 |
| `claude-opus-5-5` | $2.14–3.42 | $4.07–5.35 | $6.69 | $10.71 |
| `gpt-5.6-sol` | $2.14–3.42 | $4.02–5.30 | $6.62 | $10.60 |
| `gpt-6-sol` | $1.07–1.71 | $2.95–3.59 | $4.48 | $7.18 |
| `claude-sonnet-5-5` | $1.07–1.71 | $3.00–3.64 | $4.55 | $7.28 |

On the caps profile, a Fable 5.1 writer costs $6.40–9.60 and the Run $8.75–11.95. The arithmetic is a local script with no API calls; per letter it is `(input × input rate + (visible output + thinking) × output rate) / 1M`.

**Reading the results:**

- **The writer dominates the Run's cost.** With Fable 5.1, the thinking volume decides whether a Run fits under $10.
  - It fits with light thinking (about 2K tokens per letter) and few retries.
  - Heavy thinking, or a 25% retry allowance, pushes it over.
  - The "roughly $6–7 per Run" estimate in #14 matches the light end.
- **A GPT writer only saves money below the flagship tier.**
  - GPT-6 Astra has the same list price as Fable 5.1.
  - GPT-5.6 Sol (promotional price) and Opus 5.5 roughly halve the Run.
  - GPT-6 Sol and Sonnet 5.5 bring it to about $3–4.
- **Levers for a Fable 5.1 writer:**
  - Measure `output_tokens_details.thinking_tokens` per letter.
  - Set effort explicitly, and lower it where quality holds.
  - Cap `max_tokens`. At 8K, one attempt reserves about 20K × $10 + 8K × $50 = $0.60.
  - Cache a stable Character prefix. With an 8K prefix per Character (Voss, Adelaide), written once per Run with the 1-hour TTL and then read, 16 letters pay $0.35 instead of $1.28, **saving about $0.93 per Run**. This requires append-only prompts; the notes found that current prompts embed game state in the system text.
- **Not modelled:**
  - OpenAI Flex, which would halve the GPT-side figures.
  - Tokenizer differences between providers.
  - Implicit cache writes on GPT-5.6 and GPT-6, which could add up to 25% to input.
  - Data-residency uplifts.

## Unverified or open

1. **Thinking and reasoning tokens** per 800-word Italian letter at each effort level are unmeasured. The cost check brackets them.
2. **Italian literary quality** has no official benchmark on either side. It is for the blind comparison.
3. **GPT-6 Astra's default reasoning effort** is not stated on its model page or in the guides read. Set it explicitly.
4. **GPT-5.6 Sol's price after its promotion** is not published. The page's "20% reduction in input pricing and a 33% reduction in output pricing" implies $5/$30 before the promotion, but that is an inference.
5. **Implicit-mode write charges.** That implicit caching on GPT-5.6 and later charges 1.25x on prompts that are never reused is inferred from the caching guide. Check `cache_write_tokens` on the first test call.
6. **Error shapes.** For sampling parameters sent to GPT-6 with reasoning on, and for `prompt_cache_options` sent to pre-5.6 models, the docs say "remove" and "Supported for gpt-5.6 and later" without stating the error.
7. **Forced tool use on OpenAI.** No documented rejection of forced `tool_choice` in the Responses API was found, and it was not live-tested. The `text.format` design sidesteps the question.
8. **Italian token counts.** About 2K tokens per 800-word letter on Claude's current tokenizer is estimated from the measured outputs, not counted. OpenAI's tokenizer may produce a different count for the same text.
9. **Response model names.** Which model string each API returns for an alias (the alias or the dated snapshot) was not checked. It matters only if pricing keys on the response's model field.
10. **Stale skill data.** The bundled claude-api skill's model table (cached 2026-06-24) predates the Opus 5.5 launch and Sonnet 5.5. This note uses the live docs.

## Sources

All sources were read on 2026-09-29.

### Anthropic

- [Pricing][c-pricing]
- [Models overview][c-models]
- [Model deprecations][c-deprecations]
- Model pages: [Claude Fable 5.1][c-fable51], [Claude Opus 5.5][c-opus55], [Claude Opus 5][c-opus5], [Claude Sonnet 5.5][c-sonnet55], [Claude Sonnet 5][c-sonnet5], [Claude Haiku 4.5][c-haiku45]
- What's new: [Claude Fable 5.1][c-fable51-new], [Claude Opus 5.5][c-opus55-new], [Claude Sonnet 5.5][c-sonnet55-new]
- [Thinking][c-thinking]
- [Steering thinking and cost][c-thinking-cost]
- [Effort][c-effort]
- [Structured outputs][c-so]
- [Strict tool use][c-strict]
- [Prompt caching][c-caching]

### OpenAI

- [Pricing][o-pricing]
- [Models][o-models]
- [Deprecations][o-deprecations]
- [Model selection][o-model-selection]
- Model pages: [GPT-6 Astra][o-gpt-6-astra], [GPT-6 Sol][o-gpt-6-sol], [GPT-6 Luna][o-gpt-6-luna], [GPT-5.6 Sol][o-gpt-5.6-sol], [GPT-5.6 Terra][o-gpt-5.6-terra], [GPT-5.6 Luna][o-gpt-5.6-luna], [GPT-5.5][o-gpt-5.5], [GPT-5.4][o-gpt-5.4], [GPT-5.4 mini][o-gpt-5.4-mini], [GPT-5.4 nano][o-gpt-5.4-nano], [Chat Latest][o-chat-latest]
- Guides: [Using GPT-6][o-using-gpt6], [Using GPT-5.6][o-using-gpt56], [Using GPT-5.5][o-using-gpt55]
- [Prompt caching][o-caching]
- [Reasoning models][o-reasoning]
- [Structured outputs][o-so]
- [Function calling][o-fc]
- [Migrate to the Responses API][o-migrate]
- [Counting tokens][o-tokens]
- [Flex processing][o-flex]
- [Responses create reference][o-ref-create]
- [Chat Completions reference][o-ref-chat]

[c-pricing]: https://platform.claude.com/docs/en/about-claude/pricing
[c-models]: https://platform.claude.com/docs/en/models/overview
[c-deprecations]: https://platform.claude.com/docs/en/about-claude/model-deprecations
[c-fable51]: https://platform.claude.com/docs/en/models/fable-5-1/overview
[c-fable51-new]: https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1
[c-opus55]: https://platform.claude.com/docs/en/models/opus-5-5/overview
[c-opus55-new]: https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5
[c-opus5]: https://platform.claude.com/docs/en/models/opus-5/overview
[c-sonnet55]: https://platform.claude.com/docs/en/models/sonnet-5-5/overview
[c-sonnet55-new]: https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5
[c-sonnet5]: https://platform.claude.com/docs/en/models/sonnet-5/overview
[c-haiku45]: https://platform.claude.com/docs/en/models/haiku-4-5/overview
[c-thinking]: https://platform.claude.com/docs/en/build-with-claude/thinking
[c-thinking-cost]: https://platform.claude.com/docs/en/build-with-claude/thinking-steering-and-cost
[c-effort]: https://platform.claude.com/docs/en/build-with-claude/effort
[c-so]: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
[c-strict]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use
[c-caching]: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
[o-pricing]: https://developers.openai.com/api/docs/pricing
[o-models]: https://developers.openai.com/api/docs/models
[o-deprecations]: https://developers.openai.com/api/docs/deprecations
[o-model-selection]: https://developers.openai.com/api/docs/guides/model-selection
[o-gpt-6-astra]: https://developers.openai.com/api/docs/models/gpt-6-astra
[o-gpt-6-sol]: https://developers.openai.com/api/docs/models/gpt-6-sol
[o-gpt-6-luna]: https://developers.openai.com/api/docs/models/gpt-6-luna
[o-gpt-5.6-sol]: https://developers.openai.com/api/docs/models/gpt-5.6-sol
[o-gpt-5.6-terra]: https://developers.openai.com/api/docs/models/gpt-5.6-terra
[o-gpt-5.6-luna]: https://developers.openai.com/api/docs/models/gpt-5.6-luna
[o-gpt-5.5]: https://developers.openai.com/api/docs/models/gpt-5.5
[o-gpt-5.4]: https://developers.openai.com/api/docs/models/gpt-5.4
[o-gpt-5.4-mini]: https://developers.openai.com/api/docs/models/gpt-5.4-mini
[o-gpt-5.4-nano]: https://developers.openai.com/api/docs/models/gpt-5.4-nano
[o-chat-latest]: https://developers.openai.com/api/docs/models/chat-latest
[o-using-gpt6]: https://developers.openai.com/api/docs/guides/latest-model/gpt-6-astra
[o-using-gpt56]: https://developers.openai.com/api/docs/guides/latest-model/gpt-5.6
[o-using-gpt55]: https://developers.openai.com/api/docs/guides/latest-model/gpt-5.5
[o-caching]: https://developers.openai.com/api/docs/guides/prompt-caching
[o-reasoning]: https://developers.openai.com/api/docs/guides/reasoning
[o-so]: https://developers.openai.com/api/docs/guides/structured-outputs
[o-fc]: https://developers.openai.com/api/docs/guides/function-calling
[o-migrate]: https://developers.openai.com/api/docs/guides/migrate-to-responses
[o-tokens]: https://developers.openai.com/api/docs/guides/token-counting
[o-flex]: https://developers.openai.com/api/docs/guides/flex-processing
[o-ref-create]: https://developers.openai.com/api/reference/resources/responses/methods/create
[o-ref-chat]: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/retrieve
