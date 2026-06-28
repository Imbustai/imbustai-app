# Sessione 02 — Modello per-ruolo (orchestrator vs writer)

> Leggi prima [context.md](./context.md). Eseguire **dopo** `01-benchmark.md`:
> il benchmark dice quale modello regge la qualità su quale ruolo.

## Obiettivo

Permettere di usare **modelli diversi per ruolo**:

- **orchestrator** → modello (potenzialmente) più economico (planning + structured
  output, protetto a valle dal validator deterministico);
- **writer NPC** → modello migliore (è la prosa che il giocatore legge).

Questo applica il **reframe** del context: *protggi i writer, economizza
l'orchestrator*. La configurazione precisa va presa dai risultati della sessione 01.

## Stato attuale (perché serve una modifica)

Oggi c'è **un solo modello** per tutta la giocata: `generateStructured` usa la `model`
fissa dell'istanza provider ([claudeProvider.ts](../../../../packages/story-engine/src/ai/claudeProvider.ts)),
e [turnProcessor.ts](../../../../packages/story-engine/src/engine/turnProcessor.ts) passa
lo stesso `provider` sia alla chiamata orchestrator (~L160-178) sia ai writer (~L197-235).
Non c'è modo di differenziare il modello per ruolo.

## Modifica mirata

Scegliere **una** delle due strade (equivalenti; preferire quella più pulita rispetto
al resto del codice):

- **A) Due provider istanziati**: `createProvider` restituisce (o si invoca due volte
  per produrre) un `orchestratorProvider` e un `writerProvider`; `turnProcessor` usa
  quello giusto per ciascuna chiamata.
- **B) Override per-chiamata**: aggiungere un campo `model?` opzionale a
  `StructuredRequest` ([provider.ts](../../../../packages/story-engine/src/ai/provider.ts));
  `ClaudeProvider.generateStructured` usa `request.model ?? this.model`; `turnProcessor`
  passa il modello per ruolo nelle due call.

**Nuove env** (in `.env.example`):

- `STORY_ENGINE_ORCHESTRATOR_MODEL`
- `STORY_ENGINE_WRITER_MODEL`

**Default = comportamento attuale**: se le env per-ruolo non sono settate, si ricade su
`STORY_ENGINE_MODEL` / `DEFAULT_MODEL` (Opus 4.8). → **zero regressioni** se non configurate.

## Tracciamento costo (verificare, non rompere)

Il `usageSink` registra già `model` per ogni chiamata e lo snapshot su `ai_drafts`
salva il modello per call (vedi context → Infrastruttura). Verificare che con modelli
**per-ruolo** il report admin rifletta correttamente i due modelli:

- `/admin/game/[id]` card "Dettaglio costi AI": orchestrator e lettere devono mostrare
  il modello effettivo usato per ciascuna chiamata;
- `/admin/games` colonna "Costo AI" + modelli: deve elencare entrambi i modelli quando
  differiscono.

Nota: oggi lo snapshot del draft espone un singolo `model`/`provider` "di testata" (il
primo della call). Decidere come rappresentare il caso multi-modello (es. lasciare il
per-call dentro `usage[]` e mostrare "N modelli" in testata, com'è già per le rigenerazioni).
**Non** introdurre regressioni nel calcolo costo (`computeCostUsd` è per-call e già
gestisce modelli diversi nello stesso draft).

## Validazione

Riusare l'**harness della sessione 01** per confrontare config per-ruolo, es.:

- writer `claude-opus-4-8` + orchestrator `claude-sonnet-4-6`;
- writer `claude-sonnet-4-6` + orchestrator `claude-haiku-4-5`;

contro la baseline tutto-Opus. Stessa rubrica qualità (focus su prosa writer +
warning validator per la parte orchestrator) e stessa tabella costo/turno.

## Riferimenti file

- [provider.ts](../../../../packages/story-engine/src/ai/provider.ts)
- [claudeProvider.ts](../../../../packages/story-engine/src/ai/claudeProvider.ts)
- [createProvider.ts](../../../../packages/story-engine/src/ai/createProvider.ts)
- [turnProcessor.ts](../../../../packages/story-engine/src/engine/turnProcessor.ts)
- `.env.example` (aggiungere le due nuove env documentate)
- report admin: `/admin/games`, `/admin/game/[id]`, pannello reply (verifica visiva)

## Criteri di "fatto"

- [ ] Modello selezionabile per ruolo via `STORY_ENGINE_ORCHESTRATOR_MODEL` /
      `STORY_ENGINE_WRITER_MODEL`; default = Opus (nessuna regressione).
- [ ] `usageSink`/snapshot registrano il modello corretto per chiamata; report admin coerente.
- [ ] Config per-ruolo confrontata con la baseline tramite l'harness della sessione 01.
- [ ] `pnpm test` verde (aggiornare/aggiungere test sul routing del modello per ruolo).
- [ ] `.env.example` aggiornato e documentato.
