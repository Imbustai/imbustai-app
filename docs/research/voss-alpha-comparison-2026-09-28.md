# Voss: alpha and current engine comparison

Date: 2026-09-28. Research findings, not an approved redesign.

The strongest source-supported explanation for the regression is **restricting invention without supplying a sufficiently concrete story**. The alpha let one model invent the case while writing every character. The current engine splits planning from writing, supplies a short fact registry to each writer, and explicitly instructs writers to remain vague when information is missing. This explains a credible mechanism for the reported lack of detail. It does **not** prove that an older model writes better, or that separate writer calls are inherently worse. [Current writer rules][current-writer], [alpha responsibilities][alpha-responsibilities].

## Sources and limits

- Alpha source: `Imbustai/imbustai-01-alpha`, cloned read-only to `/tmp/imbustai-alpha-research-20260928`, commit [`70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b`](https://github.com/Imbustai/imbustai-01-alpha/commit/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b). That commit is dated **2026-09-28**, message `first commit`. It is the source the user identifies as last year's version; its import date cannot independently establish which code/model actually served a 2025 playthrough.
- Current source: `Imbustai/imbustai-app`, commit [`7faf45ed6bf43bdb92e9b82649da63b3c6daaf58`](https://github.com/Imbustai/imbustai-app/commit/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58), particularly `packages/story-engine/` and the website integration. This report compares **the committed seed**, not an assumption that the live database still equals that seed. The cited game and its database story need a separate reading.
- The referenced sibling checkout `../imbustai-01-game` is absent on this machine. The available repository reference note is `docs/reference-repo.md` (singular), which points to an old macOS location. The user-supplied alpha repository supplied the prototype source for this comparison. [Reference note][reference-note].
- No paid AI calls, application writes, or changes to reference/production code were made for this research. Tracked test fixtures are examples, **not verified transcripts of old player sessions**. Alpha response logging records model and raw response in browser localStorage, retaining only ten logs; such an export would be the strongest retrospective evidence if one already exists. [Alpha logging][alpha-logging].

## What the alpha actually contained

| Aspect | Source evidence |
|---|---|
| Models | Claude requests `claude-sonnet-4-20250514`; the OpenAI path requests `gpt-4-turbo-preview`. Runtime can use either as primary and fall back to the other depending on settings, availability, and errors. Therefore “Sonnet 4 was configured” is proven; “every old play used Sonnet 4” is not. [Claude][alpha-claude], [OpenAI][alpha-openai], [selection/fallback][alpha-flow]. |
| Call shape | A single `game_response` call writes all NPC letters plus state updates. The full master prompt and every sent/received letter are included. The nominal summarization and sliding modes also use full history. [Context manager][alpha-context], [full history][alpha-history], [turn execution][alpha-flow]. |
| Protagonist | Inspector **Léon Mercier**, the player, paired with Agent Voss through written correspondence because of an inter-jurisdictional investigation. [Premise][alpha-premise], [opening][alpha-opening]. |
| Cast implemented at start | Voss and **Ufficio Anagrafe del Comune**, both contactable immediately. Dynamic NPC creation exists as a helper, but the parser rejects replies from unknown NPC IDs and its unlock path only unlocks already-existing NPCs. The prompt promises broader dynamic NPCs more freely than the execution path implements them. [Initial NPCs][alpha-npcs], [parser][alpha-parser]. |
| Case | First victim: **Marco Bellini**, 34, employee, dead in his apartment from head trauma without a forced entry. Dates: **2 August, 3 September, 4 October, 5 November**. Three deaths are the apparent pattern; a fourth is preventable if the player infers it. [Opening][alpha-opening], [premise and dates][alpha-premise]. |
| Clues | Four is hidden through cardinal directions, elements, seasons, square coordinates, four-letter names, 4:00, and Via Rossi 4. Three is advertised through religious imagery, triangles, and candles. The prompt suggests a distribution of 30% useful truths, 40% misleading truths, 20% coherent falsehoods, 10% red herrings. These are **motifs/examples**, not a solved case with exact evidence for each victim. [Clue guidance][alpha-clues]. |
| Progression | Five acts: turns 1–4 setup, 5–8 second murder, 9–15 third murder, 16–20 fourth-murder countdown, 21+ finale. Act progression is taken from model output. This structure is incompatible with the user's new **6–8 exchange** requirement unless rewritten. [Acts/endings][alpha-acts], [state parsing][alpha-parser]. |
| Ending rules | Four prose outcomes: save victim/identify Voss; save victim/killer free; fail rescue/identify Voss and arrest; total failure with Voss exposing the player's psychology. The prose says the killer “can be anyone,” but several finals and a critical rule assume Voss is the killer. No separately modeled arrest, escape, evidentiary sufficiency, or tribunal verdict is specified here. [Open killer premise][alpha-premise], [endings][alpha-acts], [critical rules][alpha-critical]. |
| Relationship treatment | Voss is charming, clever, colloquial, ironic, superficially concerned; the opening invites an opinion about letter writing. The engine tracks a psychological profile, but its context builder sends counts/state plus history, not that profile object. Its aim is adapting manipulation and a final psychological reveal. It is not a developed shared personal life or explicit relationship arc. [Voice/manipulation][alpha-voice], [opening][alpha-opening], [profile initialization][alpha-store], [context construction][alpha-context]. |
| Multi-letter turns | The UI saves drafts per recipient and submits all drafts as one turn; initial contacts include both Voss and Comune. This requirement was real functionality. [NPCs][alpha-npcs], [drafts][alpha-store], [send all][alpha-send]. |

The alpha source is not a complete story bible waiting to be restored. Beyond the first victim and numerical pattern, much of its narrative is delegated to the model. A specifically tailored prompt gave it expressive freedom, but also contained contradictions and encouraged misleading the player. [Alpha master prompt][alpha-master].

## Letter examples: specificity was possible, not guaranteed

The detailed Voss fixture answers several concrete questions: a suspiciously cleaned bronze statue, a death window of 22:00–23:30, Sofia Russo returning at 23:45, a conference with 50 alibi witnesses, a threatening letter, and Bellini's accounting job at a law practice. It still withholds the actual threat and starts with generic praise. [Detailed fixture][alpha-detailed-fixture].

Other tracked fixtures exhibit the exact weakness now reported: the first Voss response says interesting details are emerging without stating them; Comune claims to attach records but supplies no substantive record data. These examples prevent a blanket claim that the old implementation solved genericness. They are useful positive/negative samples for evaluation, with fixture status preserved. [Generic Voss fixture][alpha-generic-fixture], [Comune fixture][alpha-comune-fixture].

The detailed fixture's Sofia alibi also differs from the current seed, which places her at her sister's. This is evidence that the sources contain different case material, not a basis for mixing the two accounts into one canon. [Detailed fixture][alpha-detailed-fixture], [current alibi][current-facts].

## Why the current design can lose specificity and agency

### 1. The instruction to be vague is literal

The NPC writer is told its listed facts and correspondence are its complete knowledge, forbidden to add names/dates/places/events, and told to “stay vague or defer instead” when those details are absent. Elsewhere it is told to answer requests immediately. When the registry has no answer, these instructions conflict at precisely the point the player needs progress. [Writer prompt, lines 221–240][current-writer].

The committed seed contains **18 facts** for an intended 25-turn case. Several are placeholders rather than playable answers: an unnamed former prisoner dislikes the victims; records contain useful dates/residences without supplying them; a subtle professional connection exists without specifying it. Victims two through four have no authored identities in this seed. Knowledge isolation can protect facts already written; it cannot make absent evidence concrete. [Seed facts][current-facts], [seed duration][current-seed-opening].

**Inference, strong:** the alpha could fill these blanks through improvisation; the current writer is explicitly prohibited from doing so. A model swap alone cannot resolve missing case answers while honoring these rules.

### 2. The familiar reply template is inherited

The alpha prescribed personal opening → information → guiding suggestion → friendly closing. The current Voss `personality.letter_format` preserves that structure, including flattery and manipulation techniques. The current prompt also asks for a new investigative element every batch, but has no equally explicit requirement that the new element follow causally from what the player asked or decided. [Alpha letter/voice rules][alpha-voice], [current Voss persona][current-persona], [current GM responsibilities][current-responsibilities].

**Inference:** combine an obligatory acknowledgement, too little usable information, and an obligation to push the plot, and “praise/paraphrase → unrelated event” becomes an easy compliant output. The template is not newly introduced; the restriction on filling in substantive answers plausibly makes its weakness more visible.

### 3. A contactability concept has acquired conflicting meanings

The seed uses `contactable_from_start: false` plus `unlock_rules` for later contacts: forensic doctor Ferri, witness Sofia Russo, Bellini's colleagues, and the archive. The GM prompt nevertheless labels **every** false-valued character it includes an automatic sender whom the player cannot contact. The state endpoint also excludes these characters from the locked-contact count. [Seed cast][current-cast], [GM character rendering, lines 47–68][current-character-rendering], [state endpoint][current-contacts].

There is still functioning multi-contact machinery: contacts come from `unlocked_npcs`, submitted recipients must be in that set, and state updates can add NPC slugs. Therefore this is not proof that the whole multi-letter system must be replaced. It is evidence that **initially locked contact** and **sender that cannot receive replies** have been conflated, and that live story configuration needs inspection. [State endpoint][current-contacts], [submission validation][current-submit], [unlock state][current-state].

### 4. The planner/writer boundary introduces information loss

The GM sees the whole story/history, then sends each writer a brief of only a few sentences; writers see only their own correspondence and scoped facts. That is a meaningful change from one model writing all letters with the complete history. It protects compartmentalization but makes the quality/completeness of the handoff critical. [GM responsibilities][current-responsibilities], [scoped context][current-context], [alpha full history][alpha-history].

Two specific implementation discrepancies merit separate regression tests before trusting this boundary:

- `generateTurnBatch` computes a sanitized `plan`, but chooses writer targets from the earlier unsanitized `replies` array. Thus sanitization of replies/fact/clue assignments is not what the writer receives. [Turn processor, lines 237–275][current-generation].
- Writers receive `effectiveState` based on scheduled/current act, not the potentially later act accepted in the plan. A GM's permitted advancement can therefore assign facts that its writer's context still excludes. [Sanitization][current-sanitize], [writer context construction][current-generation], [fact filtering][current-context].

These are source-level findings, not claims that they caused a particular sentence in the reported game. A full causal trace needs its saved plan, story data, letters, and model metadata.

### 5. Neither version has the requested bonding material

The committed Voss persona is primarily a manipulation strategy and a one-sentence work biography. It does not specify personal tastes, ordinary life, important relationships, recurring private concerns, or how mutual trust changes what he shares. The current psychological profile is fed back to the GM, improving on the alpha's unused profile context, but is still an arbitrary object rather than an authored relationship progression. [Current persona][current-persona], [profile prompt][current-profile], [profile update][current-state], [alpha context][alpha-context].

**Inference:** warm adjectives and an “opening personal comment” slot are insufficient to sustain bonding across eight exchanges. The story needs actual personal material and consequences for how Mercier responds; whether to encode those as explicit state is a design decision still to make.

## What the existing simulations prove

The current 22-turn Vitest simulation exercises engine mechanics with `MockProvider`. Its letters are placeholders; its success flags are scripted. It verifies date/state/validation behavior, not engaging prose, fair deductions, or player agency. [Simulation test][current-simulation-test].

The live script `scripts/simulate-voss.ts` uses real NPC calls but **hardcoded player letters**, capped at ten. Its player declares the fourth-murder theory and suspicion of Voss according to the script, regardless of what the NPCs actually revealed. It keeps history only in memory, omits opening letters from that history, does not pass `turnNumber` for scheduled progression, and has no full transcript export or spend ceiling. Its pass/fail checks concern canon-validator errors and a clean streak. It is not yet the requested AI-player full-story execution. [Live harness][current-live-harness], [scheduled act behavior][current-generation].

The validator checks metadata keys, scope, dates, clue act, basic state, and a two-boolean ending match. It does not test specificity, answer completeness, repetitive praise, causal relevance, relationship development, or evidence supporting a conviction. Passing it therefore says little about the user's five gameplay objections. [Validator][current-validator].

## What to test before blaming the model or replacing the engine

These are research proposals, not approved implementation decisions:

1. **Author one concrete test packet first.** Give a player request a real answer, one admissible clue, one intentional uncertainty with a reason, and a personal detail with continuity. Compare output with and without the missing information. This isolates story material from model capability.
2. **Compare generation shapes on the same material and letters.** Hold the story constant while comparing one writer and scoped writers. Judge direct answers, specificity, continuity, knowledge boundaries, causal consequences, and voice blind to model/architecture labels. A single impressive sample is insufficient.
3. **Then compare models on that same packet.** Alpha source identifies the requested model, not a controlled advantage. Preserve exact model ID, prompt/story revision, token usage, retries, and the resulting letters for every comparison.
4. **Make the AI player see only the player view.** No culprit, hidden facts, intended clue solution, GM briefs, or outcome rubric in its context. Its next letters must follow from delivered correspondence; test cooperative, skeptical, distracted, and personally engaged play. Include both successful and failed outcomes.
5. **Bound cost before calling models.** Count player, planner, writers, optional judges, and retries. Reserve each call's worst permitted output cost against a run allowance below $5 and stop before exceeding it; maintain remaining-turn reservations if a finished run must be guaranteed. A budget stop is not a completed story. Current generation allows up to three schema attempts for each planner/writer call, so a nominal per-turn estimate is insufficient. [Retry loop][current-retries].

The six-to-eight exchange target requires a newly designed clue/decision/relationship progression. The old 21+ turn outline should not simply be compressed by changing `max_turns`: its early turns explicitly withhold useful clues, and its later acts contain the rescue opportunity. Likewise, arrest and conviction would need evidence and outcome rules beyond the existing `victim_saved`/`killer_identified` pair. [Old clue timing][alpha-clues], [old acts][alpha-acts], [current ending flags][current-state], [ending validator][current-validator].

[alpha-master]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/config/systemPrompt.ts
[alpha-premise]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/config/systemPrompt.ts#L41-L61
[alpha-responsibilities]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/config/systemPrompt.ts#L63-L89
[alpha-voice]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/config/systemPrompt.ts#L93-L159
[alpha-clues]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/config/systemPrompt.ts#L184-L225
[alpha-acts]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/config/systemPrompt.ts#L227-L257
[alpha-critical]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/config/systemPrompt.ts#L309-L324
[alpha-opening]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/config/systemPrompt.ts#L326-L347
[alpha-claude]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/services/AIService/providers/ClaudeProvider.ts#L25-L54
[alpha-openai]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/services/AIService/providers/OpenAIProvider.ts#L24-L59
[alpha-flow]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/services/GameEngine/gameFlow.ts#L38-L125
[alpha-context]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/services/AIService/contextManager.ts#L11-L60
[alpha-history]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/services/AIService/strategies/FullContextStrategy.ts#L7-L56
[alpha-npcs]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/services/GameEngine/npcManager.ts#L5-L60
[alpha-parser]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/services/GameEngine/aiResponseParser.ts#L65-L150
[alpha-store]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/store/gameStore.ts#L28-L195
[alpha-send]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/components/SendAllButton/SendAllButton.tsx#L31-L73
[alpha-logging]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/services/AIService/responseLogger.ts#L29-L142
[alpha-detailed-fixture]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/test/fixtures/aiResponses/turn4-voss-detailed.json
[alpha-generic-fixture]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/test/fixtures/aiResponses/turn1-voss-response.json
[alpha-comune-fixture]: https://github.com/Imbustai/imbustai-01-alpha/blob/70b4c6336705fd5e5f8253ee348e8d5a6edc2f5b/src/test/fixtures/aiResponses/turn2-comune-response.json
[reference-note]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/docs/reference-repo.md
[current-writer]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/packages/story-engine/src/prompts/templates.ts#L194-L243
[current-responsibilities]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/packages/story-engine/src/prompts/templates.ts#L22-L43
[current-character-rendering]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/packages/story-engine/src/prompts/templates.ts#L47-L68
[current-profile]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/packages/story-engine/src/prompts/templates.ts#L167-L173
[current-seed-opening]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/packages/story-engine/seed/voss.ts#L8-L35
[current-persona]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/packages/story-engine/seed/voss.ts#L37-L69
[current-cast]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/packages/story-engine/seed/voss.ts#L71-L175
[current-facts]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/packages/story-engine/seed/voss.ts#L178-L328
[current-context]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/packages/story-engine/src/context/scopedContext.ts#L18-L88
[current-contacts]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/apps/website/app/api/game/%5BgameId%5D/state/route.ts#L49-L65
[current-submit]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/apps/website/lib/reply-workflow.ts#L363-L379
[current-state]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/packages/story-engine/src/engine/turnProcessor.ts#L335-L369
[current-generation]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/packages/story-engine/src/engine/turnProcessor.ts#L208-L287
[current-sanitize]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/packages/story-engine/src/engine/turnProcessor.ts#L145-L205
[current-retries]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/packages/story-engine/src/engine/turnProcessor.ts#L27-L48
[current-simulation-test]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/packages/story-engine/src/__tests__/simulation.test.ts#L8-L130
[current-live-harness]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/scripts/simulate-voss.ts#L69-L167
[current-validator]: https://github.com/Imbustai/imbustai-app/blob/7faf45ed6bf43bdb92e9b82649da63b3c6daaf58/packages/story-engine/src/validator/index.ts#L22-L264
