# Sessione 01 — Benchmark qualità/costo

> Leggi prima [context.md](./context.md). Questa è la **prima** sessione del filone:
> serve a decidere la strategia modelli **con i dati**, non a intuito.

## Obiettivo

Costruire un **harness di confronto** che, dato uno script fisso di turni-giocatore
(golden play-through della storia Voss), esegue `generateTurnBatch` con **diverse
configurazioni di modello** e raccoglie, per ciascuna:

1. le **lettere generate** (output writer) + il `turn_plan` (output orchestrator);
2. il **costo reale** per chiamata e per turno (riusando l'infrastruttura esistente);
3. i **warning del validator** deterministico.

Output finale: una **tabella costo/turno** affiancata a un **ranking qualità**, per
scegliere la config più economica che **tiene la qualità degli scritti**.

## Vincolo di questa sessione

**Nessuna modifica al codice di produzione.** Le config si ottengono solo via env
`STORY_ENGINE_MODEL` (già supportata). L'harness è codice di test/script isolato
(es. in `packages/story-engine/` sotto una cartella di benchmark, o uno script
eseguibile a parte). La modifica per modelli **per-ruolo** è la sessione successiva.

## Configurazioni da confrontare (baseline globali)

Tutte con un singolo modello globale (un solo `STORY_ENGINE_MODEL`):

- **A — baseline**: `claude-opus-4-8` (stato attuale, riferimento qualità).
- **B**: `claude-sonnet-4-6`.
- **C**: `claude-haiku-4-5`.

(Le combinazioni per-ruolo si misurano nella sessione 02, riusando questo stesso harness.)

## Cosa riusare (vedi context.md → Infrastruttura)

- `generateTurnBatch` in [turnProcessor.ts](../../../../packages/story-engine/src/engine/turnProcessor.ts):
  accetta già un `usageSink` opzionale — passalo e raccogli i token per chiamata
  (`call_type` = `orchestrator` | `npc_letter`, `character_slug`, `model`, token).
- `computeCostUsd` in [ai-pricing.ts](../../lib/ai-pricing.ts) + tabella
  `ai_model_pricing` per convertire token → USD (così il costo del benchmark usa gli
  stessi prezzi del report admin).
- Seed/dati della storia **Voss** per avere uno scenario realistico e replicabile.
- Pattern di test esistenti: `packages/story-engine/src/__tests__/turnProcessor.test.ts`
  (mostra come invocare `generateTurnBatch` con `story`, `state`, `history`,
  `playerLetters`, `provider`, `seed`, `usageSink`).

## Golden play-through (input deterministico)

Definire uno **script fisso** di N turni (consiglio: 8–10, in linea con l'intento
"Phase 5: 10-turn sim" del [CLAUDE.md](../../../../CLAUDE.md)). Per ogni turno: le
lettere del giocatore ai vari NPC. Lo stesso script va eseguito identico su A/B/C
(stesso `seed`) così che le differenze siano attribuibili al modello, non all'input.

Punti da coprire nello script per stressare la qualità:
- domande dirette a più NPC nello stesso turno (multi-lettera);
- una domanda che spinge un NPC verso un fatto **fuori dal suo knowledge-scope**
  (per testare il rispetto dei confini di conoscenza / knowledge bleed);
- un punto in cui dovrebbe avvenire un rilascio di clue/avanzamento d'atto.

## Misura della qualità

Automatica + spot-check umano:

1. **Giudice LLM** (usare un modello forte, es. `claude-opus-4-8` o `claude-fable-5`,
   indipendente dalla config sotto esame) in **confronto cieco a coppie**
   (A vs B, A vs C) sulle lettere generate per gli stessi turni. Rubrica:
   - **Qualità della prosa** (naturalezza, stile epistolare);
   - **Voce in-character** (coerenza con la persona dell'NPC);
   - **Rispetto knowledge-boundary** (l'NPC non cita fatti che non dovrebbe sapere);
   - **Coerenza di trama** (continuità con la corrispondenza precedente).
   Il giudizio deve essere cieco rispetto a quale modello ha prodotto quale lettera.
2. **Warning del validator**: contare/loggare i warning deterministici per config
   (un orchestrator più debole tende a produrne di più). È un segnale di qualità *gratis*.
3. **Spot-check umano**: lettura diretta di un campione di lettere per config, per
   validare che il giudice LLM non stia premiando artefatti.

> Nota sul giudice LLM: anche il giudice ha un costo. È un costo **una tantum di
> valutazione**, non di produzione — tienilo separato dalla tabella costo/turno.

## Output atteso

- **Tabella costo/turno** per config (media sui turni dello script): orchestrator,
  writer, totale; + costo dell'intera giocata simulata.
- **Ranking qualità** per config dalle rubrica del giudice + conteggio warning validator.
- **Raccomandazione**: la config globale più economica che non perde qualità visibile,
  e l'indicazione se conviene passare alla **sessione 02** (modelli per-ruolo) — tipico
  esito atteso: writer non scendono sotto una certa soglia, orchestrator sì.
- Salvare i risultati (es. JSON/markdown) nella cartella del benchmark per replicabilità.

## Criteri di "fatto"

- [ ] Script golden deterministico (≥8 turni) eseguibile su A/B/C con stesso seed.
- [ ] Costo per chiamata/turno raccolto via `usageSink` + `computeCostUsd` per ogni config.
- [ ] Giudizio qualità cieco a coppie + conteggio warning validator per config.
- [ ] Tabella costo/turno + ranking qualità + raccomandazione documentati e salvati.
- [ ] Nessuna modifica al codice di produzione (solo harness/script + env).
