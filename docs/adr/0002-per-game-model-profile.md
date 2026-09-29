# 0002 — Per-Game model profile across Claude and OpenAI

- Status: accepted (2026-09-29)
- Decided in: [How are AI models chosen, costed and exercised by Runs?](https://github.com/Imbustai/imbustai-app/issues/14), amended after [Which OpenAI models and API settings fit each model role, and what does every candidate model cost?](https://github.com/Imbustai/imbustai-app/issues/17)
- Supersedes: AGENTS.md "single runtime AI provider is sufficient"

## Context

Writing quality decides whether a Story is fun, and the best writer model is an open question to settle by blind comparison. Runs (AI-played QA Games) must also stay under a cost cap. A single hardwired provider and model blocks both.

## Decision

- Engines ask for AI by **role**, never by model name: `writer` (Characters' Letters, Epilogues), `clerk` (offices, documents), `analyst` (reader, reply-rule checker), `player` (Runs only).
- Each **Game carries a model profile** mapping roles to models. The Story sets a default, the admin can override it when starting a Game, and a Run takes it as a parameter.
- Providers: **Claude and OpenAI**, switchable per Game; both use JSON-schema structured outputs (OpenAI via the Responses API), since `claude-fable-5-1` and `claude-opus-5-5` reject forced `tool_choice`.
- Every call is metered against `ai_model_pricing`; an unknown model is an error, never $0; usage is recorded per attempt; Runs reserve budget per call and fail when the cap is hit.
- Testing default: `writer` = `claude-fable-5-1` at medium effort, Character prefix cached, at most one rewrite per Turn; `clerk`/`analyst` = `claude-sonnet-5-5`, Haiku 4.5 for the cheapest calls. The production default is picked later by blind comparison.

## Consequences

- Both `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` are server-side secrets.
- The price table must be kept current when models are added; a stale row fails loudly.
