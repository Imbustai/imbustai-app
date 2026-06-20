# Voss Story — Seed Plan (Phase 0)

How `../imbustai-01-game/src/config/systemPrompt.ts` (350 lines) decomposes into story tables. Note: Voss deliberately exercises **every optional module** (facts, acts, clues, endings — see architecture §2) as the stress test; other stories may use none of them. The seed itself is written in Phase 1 (`packages/story-engine` seed script / SQL seed). Source line references are to `systemPrompt.ts`.

## What stays code vs what becomes data

| Prompt section (lines) | Destination |
|---|---|
| JSON output format rules (4–39, 259–307) | **Engine code** — replaced by tool-use structured output in `packages/story-engine/src/prompts/` + zod schemas. Story-agnostic. |
| GM role & responsibilities (63–89), critical rules (309–324) | **Engine prompt template** (story-agnostic orchestrator prompt; the story-specific parts come from DB rows injected into it) |
| Manipulation techniques (121–137), NPC letter formats (95–171) | **Engine prompt template** (generic letter-writing craft) + per-character `personality` jsonb for Voss-specific techniques |
| Plot, twist, timeline (41–61) | `story_facts` rows |
| Voss/Comune personas (73–77, 114–119, 141–147) | `story_characters` rows |
| Time rules (173–182) | `stories.time_config` + per-character delay columns |
| Clue system + dosing (184–208) | `story_clues` rows + `story_acts.reveal_rules` |
| Pattern-4 / red-herring-3 (210–225) | `story_facts` (GM-only, `known_by = {}`) |
| Act progression (227–257) | `story_acts` rows |
| Endings A–D (253–257) | `story_endings` rows |
| First letter (326–347) | `stories.first_letter` (column already exists) |

## stories (update existing Voss row)

```jsonc
settings:    { "max_letters_per_turn": 4, "max_turns": 25, "locale": "it" }
time_config: { "start_mode": "fixed", "story_start_date": "2025-08-02",
               "visible_delay": { "enabled": true, "min_minutes": 30, "max_minutes": 180 },
               "date_locale": "it-IT" }
allow_dynamic_npcs: true   // the prompt's "crea NPC dinamicamente" becomes propose-and-approve
first_letter: <LEGACY — the opening letter now lives on story_characters.opening_letter
               (voss, offset 0), WITHOUT the "[Data: ...]" header: dates are metadata,
               never letter body. Multiple characters may have opening letters.>
```

## story_characters (7 rows)

| slug | name | contactable_from_start | responsiveness / delay | key persona fields |
|---|---|---|---|---|
| `voss` | Agente Voss | ✅ | immediate, 1–2d | traits: brillante, ironico, manipolatore; speech: "Caro Mercier", occasionally ironic, fake concern; **hidden_agenda**: possible killer — steer player to false leads via framing/anchoring/confirmation-bias/false-urgency/subtle-gaslighting (lines 121–137); letter structure from lines 95–112 |
| `comune` | Ufficio Anagrafe del Comune | ✅ | slow, 5–10d | formal/bureaucratic ("In riferimento alla Sua richiesta prot. …"); facts only, no interpretation |
| `medico_legale` | Medico Legale | ❌ | expert, 3–5d | technical, precise, data not interpretations; unlock_rules: `{"trigger": "player_requests_autopsy_or_orchestrator_unlocks"}` |
| `sofia_russo` | Sofia Russo (coinquilina di Bellini) | ❌ | unreliable, 2–7d | emotional witness; some honest, some misleading details |
| `colleghi_bellini` | Colleghi di Bellini (Studio) | ❌ | slow, 4–8d | workplace angle; unlock via investigation of victim's job |
| `archivio` | Archivio di Stato | ❌ | slow, 5–10d | historical/property records; supports pattern hunting |
| *(dynamic)* | — | — | — | `allow_dynamic_npcs = true`: orchestrator may propose more witnesses; admin approves → row inserted with `created_dynamically = true` |

Only `voss` + `comune` exist in the prototype; the others are referenced in `MANUAL_TESTING_LETTERS.md` and the prompt's NPC-type taxonomy (lines 139–159) — seeding them as locked characters removes the prototype's reliance on fully-improvised NPCs.

## story_facts (~18 rows; the canon registry)

| fact_key | content (abridged) | known_by | is_public | reveal_act |
|---|---|---|---|---|
| `victim1_identity` | Marco Bellini, 34, impiegato/contabile | voss, comune, medico_legale, sofia_russo, colleghi_bellini | ✅ | 1 |
| `victim1_cause` | Trauma cranico, nessuna effrazione → conosceva il killer | voss, medico_legale | ❌ | 1 |
| `murder1_date` | 2 agosto | voss, comune, medico_legale | ✅ | 1 |
| `murder2_date` | 3 settembre | voss | ❌ | 2 |
| `murder3_date` | 4 ottobre | voss | ❌ | 3 |
| `murder4_planned` | 5 novembre — prevenibile | *(GM only — `known_by = {}`)* | ❌ | 4 |
| `pattern_four` | Il "4" camuffato: punti cardinali, elementi, stagioni, quadrato di coordinate, nomi di 4 lettere, ore 4:00, Via Rossi 4 | *(GM only)* | ❌ | — |
| `red_herring_three` | Il "3" ovvio è una falsa pista: trinità, triangoli, tre candele | *(GM only)* | ❌ | — |
| `killer_identity_open` | Il killer può essere chiunque, Voss incluso; mai rivelarlo prima dell'Atto 5 | *(GM only)* | ❌ | — |
| `victim1_appointment` | La vittima aveva un appuntamento alle 21:00 | medico_legale, sofia_russo | ❌ | 1 |
| `victim1_address` | Via Rossi 4 (pattern carrier) | comune, voss | ❌ | 1 |
| `sofia_alibi` | "Quel giorno ero da mia sorella" — verificabile | sofia_russo, comune | ❌ | 2 |
| `victims_tattoo` | Tutte le vittime avevano tatuaggi (vero ma irrilevante) | voss, medico_legale | ❌ | 2 |
| `anagrafe_records` | Registri anagrafici delle vittime (date, residenze) | comune, archivio | ❌ | 1 |
| `false_witness_gang` | "Regolamento di conti tra gang" — interpretazione falsa che Voss spinge | voss | ❌ | 2 |
| `ex_convict_redherring` | Ex detenuto che odiava le vittime ma ha un alibi | voss, colleghi_bellini | ❌ | 3 |
| `tod_window` | Decesso tra le 22:00 e le 23:30 | medico_legale | ❌ | 1 |
| `victim_jobs_link` | Collegamento professionale tra le vittime | colleghi_bellini, archivio | ❌ | 3 |

GM-only facts (`known_by = {}`) go exclusively to the orchestrator; **no NPC writer ever receives them** — Voss receives the manipulation directives via `hidden_agenda`, not the raw twist facts, except where his agenda requires (decided per-fact above). The knowledge-scope test fixture: `comune` context must exclude `victim1_cause`, `victims_tattoo`, `false_witness_gang`, `murder2_date`+.

## story_clues (~12 rows; reliability mix from lines 184–208)

Mix target: ~30% `true_useful`, ~40% `true_misleading`, ~20% `false_coherent`, ~10% `red_herring`.

| clue_key | reliability | category | act_available | source |
|---|---|---|---|---|
| `clue_appointment_21` | true_useful | testimonial | 1 | sofia_russo |
| `clue_via_rossi_4` | true_useful | documentary | 1 | comune |
| `clue_cardinal_points` | true_useful | subtle | 3 | voss |
| `clue_four_elements` | true_useful | physical | 3 | medico_legale |
| `clue_tattoos` | true_misleading | physical | 2 | medico_legale |
| `clue_victims_age` | true_misleading | documentary | 2 | comune |
| `clue_robbery_pattern` | true_misleading | testimonial | 2 | voss |
| `clue_triangle_scene` | true_misleading | physical | 1 | voss |
| `clue_gang_witness` | false_coherent | testimonial | 2 | voss |
| `clue_false_location` | false_coherent | documentary | 4 | voss |
| `clue_ex_convict` | red_herring | testimonial | 3 | colleghi_bellini |
| `clue_three_candles` | red_herring | physical | 2 | voss |

Dosing rules (lines 205–208) become `story_acts.reveal_rules`, e.g. act 1: `{"allowed_reliability": ["true_misleading", "false_coherent"], "max_clues_per_turn": 2}`.

## story_acts (5 rows, from lines 227–257)

| act | title | turns | goals (jsonb summary) |
|---|---|---|---|
| 1 | Setup | 1–4 | primo omicidio; Voss costruisce fiducia; nessun pattern chiaro |
| 2 | Complicazione | 5–8 | secondo omicidio; pattern FALSO emerge; red herrings; Voss inizia manipolazione attiva |
| 3 | Escalation | 9–15 | terzo omicidio; un sospetto sembra colpevole (innocente); primi dubbi sottili su Voss |
| 4 | Rivelazione | 16–20 | countdown al 5 novembre; ricerca della location del 4° omicidio |
| 5 | Finale | 21+ | risoluzione secondo `story_endings` |

## story_endings (4 rows, from lines 253–257)

| ending_key | conditions | narrative_guidance |
|---|---|---|
| `finale_a` | `{"victim_saved": true, "killer_identified": true}` | confronto epico con Voss |
| `finale_b` | `{"victim_saved": true, "killer_identified": false}` | Voss finge soddisfazione; killer libero |
| `finale_c` | `{"victim_saved": false, "killer_identified": true}` | tragedia + arresto |
| `finale_d` | `{"victim_saved": false, "killer_identified": false}` | Voss gloating; psicologia del giocatore esposta |

`runtime_state` gains `victim_saved` / `killer_identified` booleans set by orchestrator `gameStateUpdates` during acts 4–5.

## Seed mechanics (Phase 1)

- Seed script in `packages/story-engine/seed/voss.ts` (typed objects) + a runner that upserts via service role — keyed on `(story_id, *_key/slug)` so re-running is idempotent and the Phase 2 editor can later modify rows freely.
- Story #2 proof (Phase 5): create an empty story via the editor only — zero TypeScript changes — validating that nothing Voss-specific leaked into engine code.
