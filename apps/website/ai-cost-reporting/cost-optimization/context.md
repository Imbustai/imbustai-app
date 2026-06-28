# Cost Optimization — Contesto condiviso

Documento di contesto per il filone **ottimizzazione costi AI** dei giochi in
`apps/website`. Da leggere **all'inizio di ogni sessione** (`01-benchmark.md`,
`02-modello-per-ruolo.md`, `03-prompt-caching.md`). Prerequisito: il tracciamento
costi è già implementato — vedi [first-development.md](../first-development.md).

## Problema & vincolo

Oggi ogni turno gira su **`claude-opus-4-8`** e costa circa **$0.20–0.45/turno**
(cresce con il numero di NPC). A questi prezzi il business non è sostenibile,
soprattutto con più NPC per turno.

**Vincolo non negoziabile**: la qualità *visibile* degli scritti (le lettere che
il giocatore legge) **non deve calare**. Ottimizziamo il costo, non la prosa.

## Mappa delle chiamate AI (per turno)

L'architettura **è già un "subagent split"**: non c'è una sola maxi-chiamata, ma
un orchestrator + un writer per ogni NPC che risponde.

| # | Chiamata | System prompt | User prompt | Output | Modello oggi |
|---|----------|---------------|-------------|--------|--------------|
| 1 | **Orchestrator** | bibbia storia (~10–15K tok) | tutta la corrispondenza + lettere del turno | `turn_plan` (brief per NPC, update stato) | Opus 4.8 |
| 2..N | **Writer NPC** (1 per NPC che risponde) | persona del singolo NPC + fatti in scope (~2–4K) | corrispondenza di quell'NPC + brief | `npc_letter` (la lettera) | Opus 4.8 |

Flusso in [turnProcessor.ts](../../../../packages/story-engine/src/engine/turnProcessor.ts):
orchestrator ~L160-178 → sanitize plan → writer in `Promise.all` ~L197-235 →
risoluzione date deterministica → **validator deterministico** ~L245-248.

Turno tipico = 2–3 NPC → **3–4 chiamate** (1 orchestrator + 2–3 writer).
Retry (fino a 2-3 tentativi per chiamata) **contano come spesa reale**.

## Ripartizione costo & reframe strategico

Su un turno a 3 NPC con Opus: **orchestrator ~45%**, **writer ~55%** del costo.

**Reframe chiave** (cambia la strategia rispetto all'idea iniziale):

- La **prosa che il giocatore legge vive nelle chiamate writer**.
- L'**orchestrator** produce solo **brief interni** + structured output
  (`TURN_PLAN_TOOL`); non scrive prosa user-facing. Inoltre c'è un **validator
  deterministico** (non-LLM) che intercetta le violazioni di canon
  (knowledge-boundary, timeline, atti, ending) — quindi gli errori di un
  orchestrator più debole vengono in parte catturati a valle.

➡️ **Conseguenza**: l'ipotesi "orchestrator costoso + lettere economiche" è
**invertita** rispetto al rischio-qualità. Per proteggere gli scritti conviene
tenere il **modello migliore sui writer** ed **economizzare sull'orchestrator**.
Questa tesi va però **validata col benchmark**, non assunta.

## Infrastruttura esistente da riusare

- **Seam provider** (solo Claude implementato; OpenAI/DeepSeek sono stub):
  [createProvider.ts](../../../../packages/story-engine/src/ai/createProvider.ts)
  legge `STORY_ENGINE_PROVIDER` / `STORY_ENGINE_MODEL`.
- **Interfaccia provider** con usage in token:
  [provider.ts](../../../../packages/story-engine/src/ai/provider.ts) (`CallUsage`,
  con `cache_creation_input_tokens` / `cache_read_input_tokens` **già tipizzati ma
  mai usati**).
- **Provider Claude**: [claudeProvider.ts](../../../../packages/story-engine/src/ai/claudeProvider.ts)
  (`DEFAULT_MODEL = 'claude-opus-4-8'`, una sola `model` per istanza provider).
- **System prompt** (stabili per storia): orchestrator (bibbia) e writer (persona)
  in [templates.ts](../../../../packages/story-engine/src/prompts/templates.ts)
  (~L15-168 e ~L170-222). La storia volatile (history) sta nello `user`.
- **Tracciamento costo per chiamata**: `usageSink` raccoglie i token per ogni
  chiamata (orchestrator + writer, retry inclusi) in
  [turnProcessor.ts](../../../../packages/story-engine/src/engine/turnProcessor.ts);
  snapshot su `ai_drafts` via [reply-workflow.ts](../../lib/reply-workflow.ts);
  costo calcolato da `computeCostUsd` in [ai-pricing.ts](../../lib/ai-pricing.ts).
- **Tabella prezzi** `ai_model_pricing` (DB, editabile da `/admin/settings`): ha già
  le colonne `cache_read_usd_per_mtok` / `cache_write_usd_per_mtok`.

**Questo è il fondamento per misurare prima/dopo**: ogni esperimento di costo è già
osservabile in `/admin/games`, `/admin/game/[id]` (card "Dettaglio costi AI") e nel
pannello reply, per chiamata e per modello.

## Tabella prezzi di riferimento (USD per 1M token)

Da [first-development.md](../first-development.md) (riallineare con le dashboard):

| provider | model | input | output | cache_read | cache_write |
|----------|-------|------:|-------:|-----------:|------------:|
| anthropic | claude-opus-4-8 | 5.00 | 25.00 | 0.50 | 6.25 |
| anthropic | claude-sonnet-4-6 | 3.00 | 15.00 | 0.30 | 3.75 |
| anthropic | claude-haiku-4-5 | 1.00 | 5.00 | 0.10 | 1.25 |
| openai | gpt-5.4 | 2.50 | 15.00 | 0.25 | 0 |
| deepseek | deepseek-v4-flash | 0.14 | 0.28 | 0.0028 | 0 |

Ordine di grandezza: Sonnet ≈ 0.6× Opus in input, 0.6× in output. Haiku ≈ 0.2×.

## Vincoli di progetto (rispettare in ogni sessione)

- **Non modificare** `apps/tryout-01` (read-only).
- **Gate Design System**: non toccare la DS senza chiedere prima; verificare la
  superficie esistente, poi richiedere approvazione.
- **Review-gate per lifecycle**: in `testing` ogni batch è revisionato dall'admin; in
  `released` auto-send dopo validazione canon (errori validator tengono il turno in
  review). Le interaction AI sono inserite via **service role** dopo l'approve.
- **Chiavi AI solo server-side** (Route Handler / Server Action); mai
  `SUPABASE_SERVICE_ROLE_KEY` lato client.
- **Niente costi lato giocatore**: costo/token vivono solo in `ai_drafts` (RLS
  admin-only) e `ai_model_pricing`. Non far filtrare costi in `interactions` o props client.

## Caveat caching (TTL)

I turni sono **asincroni** (review admin, `visible_from` ritardato): tra un turno e
l'altro possono passare ore/giorni. Il TTL del prompt cache (5min, o 1h) **non
sopravvive** tra turni distanti. Il caching conviene soprattutto su:

- **retry** (stesso system+user rigenerato entro secondi);
- **rigenerazioni** nella stessa sessione di review admin (minuti).

Non aspettarsi risparmi dal caching *tra* turni di giocate diverse. Dettagli in
`03-prompt-caching.md`.

## Leve future (fuori scope ora)

Citate per completezza, **non** coperte da una sessione in questo filone:

- **Riduzione/summary della storia nell'orchestrator**: lo `user` dell'orchestrator
  contiene **tutta** la corrispondenza e cresce ad ogni turno → è la leva dominante
  sul costo nei giochi lunghi. Trimming o summary a finestra mobile va valutato a parte.
- **Provider alternativi** (OpenAI/DeepSeek) dietro il seam già pronto: asse diverso,
  lift maggiore; affrontare solo se il tuning intra-Claude non basta.

## Ordine consigliato delle sessioni

1. **`01-benchmark.md`** — costruire l'harness qualità/costo. Zero modifiche al
   codice di produzione (solo swap di `STORY_ENGINE_MODEL` via env + giudice LLM).
   Serve a **decidere con i dati**, non a intuito.
2. **`02-modello-per-ruolo.md`** — abilitare modelli diversi per orchestrator e
   writer, per applicare il reframe (modello migliore sui writer, economico
   sull'orchestrator) confermato dal benchmark.
3. **`03-prompt-caching.md`** — win ortogonale a basso rischio/zero impatto qualità.

Ogni sessione misura il prima/dopo con il costo **già tracciato** (`usageSink` →
`ai_drafts` → report admin).
