# AI Cost Reporting

Tracciamento e monitoraggio del costo AI delle storie in `apps/website`. Per ogni
**lettera** e per ogni chiamata **orchestrator** registriamo token, modello e
costo; in admin mostriamo il **costo totale della giocata (spesa reale)**. I dati
di costo non sono **mai** pubblici. Predisposto lo switch **Claude / DeepSeek /
ChatGPT** (per ora solo il seam). Stato: **implementato**.

## Come funziona

Tutte le chiamate AI passano da un unico chokepoint, `AiProvider.generateStructured()`
([claudeProvider.ts](../../../packages/story-engine/src/ai/claudeProvider.ts)),
che ora ritorna anche l'**usage in token** (`CallUsage`). Le API dei provider
restituiscono i conteggi token ma **non** un costo in dollari, quindi:

- L'engine raccoglie i token per ogni chiamata (orchestrator + una per lettera
  NPC, **retry inclusi**) in un `usageSink` ([turnProcessor.ts](../../../packages/story-engine/src/engine/turnProcessor.ts)).
- Il website calcola i dollari leggendo i prezzi dalla tabella DB
  `ai_model_pricing` ([ai-pricing.ts](../lib/ai-pricing.ts)) e salva uno
  **snapshot** del costo su `ai_drafts` ([reply-workflow.ts](../lib/reply-workflow.ts)).
  Modificare i prezzi dopo non riscrive lo storico — riflette la spesa reale.

### Non-public by construction

Costi e token vivono solo in `ai_drafts` (RLS admin-only, scrittura service role)
e in `ai_model_pricing` (admin-only). Niente costo entra nelle `interactions`
(lato giocatore) o nei props client.

## Dove vederlo (admin)

- **`/admin/games`** — colonna **Costo AI** = spesa reale della giocata (somma di
  tutte le versioni di `ai_drafts`, rigenerazioni incluse) + modello/i.
- **`/admin/game/[id]`** — card **Dettaglio costi AI**: per ogni bozza, costo
  orchestrator + costo per lettera (con personaggio e token), totale giocata.
- **Pannello reply** — costo + modello della bozza corrente prima dell'approvazione.
- **`/admin/settings`** — modello/provider attivo (da env, read-only) + tabella
  prezzi editabile (create/update/delete).

## Tabella prezzi (`ai_model_pricing`)

Prezzi in DB, **non hardcoded**. Editabili da `/admin/settings`. Seed iniziale
(USD per 1M token, ultimo allineamento 2026-06 — ricontrollare nelle dashboard):

| provider | model | input | output | cache_read | cache_write |
|----------|-------|------:|-------:|-----------:|------------:|
| anthropic | claude-opus-4-8 | 5.00 | 25.00 | 0.50 | 6.25 |
| anthropic | claude-sonnet-4-6 | 3.00 | 15.00 | 0.30 | 3.75 |
| anthropic | claude-haiku-4-5 | 1.00 | 5.00 | 0.10 | 1.25 |
| anthropic | claude-fable-5 | 10.00 | 50.00 | 1.00 | 12.50 |
| openai | gpt-5.5 | 5.00 | 30.00 | 0.50 | 0 |
| openai | gpt-5.4 | 2.50 | 15.00 | 0.25 | 0 |
| openai | gpt-5.4-mini | 0.75 | 4.50 | 0 | 0 |
| deepseek | deepseek-v4-flash | 0.14 | 0.28 | 0.0028 | 0 |
| deepseek | deepseek-v4-pro | 1.74 | 3.48 | 0.0145 | 0 |

Fonti: Claude (riferimento claude-api 2026-06-04); OpenAI e DeepSeek listini
ufficiali 2026-06.

## Switch provider (seam)

`createProvider()` ([createProvider.ts](../../../packages/story-engine/src/ai/createProvider.ts))
seleziona il provider da `STORY_ENGINE_PROVIDER` (`claude` default | `openai` |
`deepseek`). Oggi è implementato solo Claude; OpenAI/DeepSeek sono stub espliciti
— l'interfaccia `AiProvider` (con usage) e i prezzi in DB sono già pronti.
Env in [.env.example](../.env.example): `STORY_ENGINE_PROVIDER`,
`STORY_ENGINE_MODEL`, `ANTHROPIC_API_KEY`, (futuro) `OPENAI_API_KEY`,
`DEEPSEEK_API_KEY`.

## Altri usi AI

Non ci sono altri call-site AI (il validator è deterministico). Essendo il
tracciamento nel chokepoint del provider, ogni futura chiamata eredita
automaticamente costo + modello.

## Migration

- `supabase/migrations/20260627120000_ai_model_pricing.sql` — tabella prezzi + RLS + seed.
- `supabase/migrations/20260627120100_ai_drafts_cost.sql` — colonne costo su `ai_drafts`.

Applicare con `supabase db push` (o MCP) sul progetto Supabase del website.

## Verifica

- `pnpm test` — include il test `usageSink` (engine) e `computeCostUsd` (website).
- Dopo le migration: `pnpm dev:website`, login admin, controllare
  `/admin/settings`, `/admin/games`, dettaglio game e pannello reply.
