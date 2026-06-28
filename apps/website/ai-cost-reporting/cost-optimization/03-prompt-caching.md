# Sessione 03 — Prompt caching dei system prompt stabili

> Leggi prima [context.md](./context.md). Win **ortogonale**, a basso rischio e
> **zero impatto sulla qualità**. Può essere fatta indipendentemente da 01/02.

## Obiettivo

Aggiungere `cache_control` ai **system prompt stabili** così che, su chiamate ripetute
ravvicinate, la parte stabile sia servita da cache (~0.1× del prezzo input) invece che
riprocessata a prezzo pieno.

## Dove (i system prompt sono già stabili)

- **Orchestrator**: la "bibbia" della storia (~10–15K token), identica ad ogni turno
  della stessa storia — [templates.ts](../../../../packages/story-engine/src/prompts/templates.ts) ~L15-168.
- **Writer**: la persona del singolo NPC + fatti in scope, identica per quell'NPC —
  [templates.ts](../../../../packages/story-engine/src/prompts/templates.ts) ~L170-222.

La parte **volatile** (tutta la corrispondenza, le lettere del turno) sta nello `user`:
va **dopo** il breakpoint di cache, quindi non invalida la cache del system. Bene così,
non spostarla nel system.

## Come

Passare `cache_control: { type: 'ephemeral' }` sull'ultimo blocco del system prompt in
[claudeProvider.ts](../../../../packages/story-engine/src/ai/claudeProvider.ts)
(oggi `system` è passato come stringa: convertirlo in blocco/i con `cache_control`, o
usare il caching automatico top-level dell'SDK). Mantenere lo `user` come messaggio
separato e volatile.

Valutare il **TTL 1h** (`{ type: 'ephemeral', ttl: '1h' }`) dato che le rigenerazioni in
una review possono distare più di 5 minuti — ma il write a 1h costa di più (≈2× vs ≈1.25×):
conviene solo se ci sono ≥3 letture nella finestra. Default 5min è il punto di partenza.

## Caveat TTL (vedi context.md)

I turni sono **asincroni**: il TTL non sopravvive tra turni di giocate distanti. Il
beneficio reale è su:

- **retry** della stessa chiamata (stesso system+user, entro secondi) — `generateValidated`
  ritenta fino a 2-3 volte;
- **rigenerazioni** nella stessa sessione di review admin (minuti).

**Non** promettere risparmi dal caching tra turni diversi.

## Verifica

- Su un retry o una rigenerazione ravvicinata, controllare
  `usage.cache_read_input_tokens > 0` (i campi sono già in `CallUsage` —
  [provider.ts](../../../../packages/story-engine/src/ai/provider.ts) — oggi tracciati ma
  a zero perché non si invia `cache_control`).
- Il costo cache è **già** calcolato da `computeCostUsd`
  ([ai-pricing.ts](../../lib/ai-pricing.ts)) usando le colonne
  `cache_read_usd_per_mtok` / `cache_write_usd_per_mtok` di `ai_model_pricing`: nessuna
  modifica al calcolo costo necessaria.
- Confermare che il report admin mostri il risparmio sui token cache (il `usage[]` dei
  draft già contiene i token cache per chiamata).

## Note

- Rischio minimo: il caching non cambia l'output del modello, solo il prezzo del prefix.
- Attenzione ai **silent invalidator**: il system prompt deve essere **byte-identico** tra
  chiamate per fare cache hit. Verificare che la costruzione della bibbia in `templates.ts`
  non includa timestamp, ordini non deterministici o ID variabili nel prefix.
- Compatibile con la sessione 02: con modelli per-ruolo, la cache è per-modello (cambiare
  modello su un ruolo scrive una cache nuova per quel ruolo).

## Criteri di "fatto"

- [ ] `cache_control` sui system prompt orchestrator e writer; `user` resta volatile dopo il breakpoint.
- [ ] `cache_read_input_tokens > 0` osservato su un retry/rigenerazione ravvicinata.
- [ ] Prefix del system verificato byte-stabile (nessun silent invalidator).
- [ ] Report admin coerente; nessuna modifica necessaria a `computeCostUsd`.
- [ ] `pnpm test` verde.
