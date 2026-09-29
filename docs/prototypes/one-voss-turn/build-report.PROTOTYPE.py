# PROTOTYPE — assembles ../one-voss-turn.PROTOTYPE.md (the report posted on #25) from out/.
# Run from this folder: python3 build-report.PROTOTYPE.py
import json

o = lambda p: open("out/" + p).read().strip()
ba = open("out/editing-before-after.md").read().split("## Passaggio separato su Sonnet")[0].split("| Prima | Dopo |", 1)[1].strip()
spend = sum(json.loads(l)["usd"] for l in open("out/costs.jsonl") if l.strip())
calls = sum(1 for l in open("out/costs.jsonl") if l.strip())

report = f"""# One real Voss Turn, end to end (PROTOTYPE)

> **PROTOTYPE, throwaway.** For [One real Voss Turn, end to end](https://github.com/Imbustai/imbustai-app/issues/25) and part 2 of [The Italian editing pass](https://github.com/Imbustai/imbustai-app/issues/37), on the map [Il quarto nome](https://github.com/Imbustai/imbustai-app/issues/9). Branch `prototype/one-voss-turn`, folder `docs/prototypes/one-voss-turn/`: the script `run-turn.PROTOTYPE.mts`, the prompts in `prefix/`, the Player's Letters in `player/`, every output and the per-call costs in `out/`.

**Spend: ${spend:.2f}** of the $5 budget ({calls} calls; per-call usage in `out/costs.jsonl`). Writer `claude-fable-5-1` at medium effort. Reader, checker, offices and one editor variant ran on `claude-sonnet-5-5`, the `clerk`/`analyst` role from [#14](https://github.com/Imbustai/imbustai-app/issues/14).

## What ran

The Player's Turn 1 is three Letters dated Mon 14 Sept 1987, approved by Paolo (`player/`). The pipeline:

1. **Reader:** what Lombardo asked, claimed and shared.
2. **Voss draft, twice:** the example letters in the prefix whole, and with the Aldo clues stripped.
3. **Checker:** v1, then v2.
4. **One rewrite, in two shapes:** A fixes the checker's points only; B fixes them and does the Italian editing in the same call.
5. **Editing pass** on rewrite A, once on Fable and once on Sonnet.
6. **The two office replies**, each checked and edited.

Voss's prefix is a **writer view** (`prefix/voss.md`, `prefix/lombardo-per-voss.md`): only what Voss knows. The dossier as written can't be the prefix, because it names the answer:
- the last rung of the "who is the killer" ladder is «Aldo»;
- «non sa: il nome del patrigno» tells the writer there is a stepfather;
- the *Rigoletto* and «ex ferroviere» are scheduled for later Turns.

## The Letters

### Voss, martedì 22 settembre 1987 (1,431 words)

The final version: draft, then rewrite A, then the editing pass on Fable.

{o('5-voss-edit-voss-writer.md')}

### Squadra Mobile, lunedì 5 ottobre 1987 (reaches Lipari in Turn 3)

{o('6-office-mobile.edited.md')}

### Cancelleria della Corte d'Assise, lunedì 19 ottobre 1987 (reaches Lipari in Turn 4)

{o('6-office-cancelleria.edited.md')}

Every other version is in `out/`: the two drafts (`2-voss-draft-whole.md`, `2-voss-draft-stripped.md`), the two rewrites (`4-voss-rewrite-A.md`, `4-voss-rewrite-B-with-editing.md`), the Sonnet edit (`5-voss-edit-voss-analyst.md`) and the checker reports (`3-check-*.json`).

## What the Turn showed

1. **The Letters are alive.** Both drafts answer every question in order with facts: the arrest at eight in the morning, the blue overalls, the cinema Palazzo alibi repeated word for word, Rosa's coat «che a maggio non si spiegava».
   - Both push back on the cellmate theory with a reason: «per ammazzare tre persone così bisogna aver amato quel ragazzo, non averlo ascoltato».
   - Both give layer 1 when asked («quel caso non mi è mai piaciuto») and keep the photo silent.
   - Both point at a door, the Regina Coeli register, without doing the work.
   - Both ask about the dog in the boat and the colour of the sea, and pick up the sister in Cremona as a Ledger fact.
   - Neither leaks anything about Aldo, who stays one line of chess.
2. **No length cap: about 1,500 words, both times.** Each draft produces about 5,400 output tokens, roughly half of them thinking: **$0.27 of output per Voss Letter**. At 800 words it would be about $0.15. So lifting the cap costs about $0.12 per Letter, or about $1 per 8-Turn Run.
3. **Example letters whole or stripped: no difference in Turn 1.** Neither draft repeated a stripped clue. Both borrowed doors and people from the examples: the Regina Coeli register, Proietti, Pierangeli, the boys at the garage. Clue repetition can only show in later Turns, so I'd keep the examples **stripped**: it costs nothing and lowers the risk.
4. **Texture can collide with a Plot key.** Both drafts invented a lady from **via Carini** at Voss's counter, and via Giacomo Carini is Aldo's street. The writer can't know that. The checker flagged it once, only as *should*, and missed it the other time. **This needs a deterministic check in code**: a list of the Story's Plot-key names and streets, string-matched against every Letter, with a rewrite on a hit.
5. **The checker as first written would bring back the July vagueness.** v1 (Sonnet 5.5) raised 18–21 points per Letter. Most of them flagged lived memory as «plot invention» (Luca's overalls, the cashier, the boys at the garage), or flagged the layer-1 content this Turn allows.
   - **v2** (`prefix/checker.md`) defines Texture vs. Plot key, collisions and doors, caps the report at 8 points, and sends only the *must* points to the rewrite.
   - v2 still produced **3 false *must* points out of 7** on the whole draft. The worst one deleted the boys at the garage, which are Voss's own authored wrong lead.
   - v2 did catch the real problems: «hai ragione» twice; facts attributed to Lombardo («capivi tutto a pagina dieci e non mangiavi mai», «non superare i novanta sulla Colombo»); and «a Luca in cella nessuno voleva bene, lo dicono i giornali».
6. **The rewrite is surgical.** Rewrite A changed only what the checker listed (21 word-level deletions). It fixed the attributions and the source for the father's death. It also lost the boys at the garage (the false *must*) and kept via Carini (the missed collision).
7. **Voss's doors can come very close to the answer.** Lombardo asked who was around Luca besides his mother, so both drafts send him to Rosa's death record. The stripped draft adds «chi ha dichiarato la morte», which is one step from the stepfather. That is rule 10 working, but where the limit sits is a design choice (choice C below).
8. **Office sheets must not list what an office doesn't hold.** My Cancelleria sheet did, and the clerk copied it into the Letter: «il registro dei colloqui di Regina Coeli», a door to the stepfather that the Player never asked for. The checker flagged it as *should*. The office voices are right: formal and short, and the Mobile is cold, cites «le procedure di rito» and sends any request for records to the Procura.
9. **The reader's output works as it is** (`out/1-reader.json`). It lists the questions, Lombardo's facts about himself (the Ledger), his actions, his hypotheses **with the reason given** (what the doubt ladders need), and which of Voss's questions he answered.

## The Italian editing pass (#37, part 2)

**Before and after** on rewrite A, with the separate pass on Fable 5.1. The Sonnet version is in `out/editing-before-after.md`.

| Prima | Dopo |
{ba}

- **The touch is light, as intended.** Fable changed 10 sentences out of about 120 and Sonnet changed 9. Both office Letters came back from the pass **unchanged** («una buona revisione di una buona lettera cambia poco»).
- **Fable fixes what the teacher found.**
  - Who is being talked about: «lui» → «Luca», «a casa sua» → «a casa di Luca».
  - Events in the order they were lived: first Mario handing over the letter, then the postman's habit.
  - Commas that fix the meaning: «la mattina, dopo l'arresto, … la sera, dopo Rosa».
  - It changed the meaning once, slightly: «fin lì non ti seguo» → «non ti seguo».
- **Sonnet mostly smooths.** It misses the «lui»/«Luca» ambiguity, and it changes «la Corte l'ha detto con ventiquattro anni» to «la Corte gli ha dato ventiquattro anni», which flattens a turn of phrase that is Voss's own.
- **Folding the pass into the rewrite (B)** cost $0.32, against $0.48 for rewrite A plus a separate editor call. Its drawbacks:
  - it made 39 changes against A's 21, mixing rule fixes with language fixes, so neither can be audited;
  - it only happens when the checker asks for a rewrite, while the pass must run on every Letter.

**Proposed shape:** a separate call, after the checker and the rewrite (if any) and before review. It runs on every Italian Letter:
- the cached prefix holds the editor method (`prefix/editor.md`), the Character's voice section and the approved example letters;
- the input is the Letter, and the output is the edited Letter as plain text;
- offices run at low effort on the clerk model.

**Cost per Turn.** These costs were measured with cold caches, because the steps ran minutes apart. In the Engine the rewrite reads the cached prefix, as rewrite B shows.

| | Voss Letter | each office Letter |
|---|---|---|
| write | $0.51 | $0.01 |
| reader + checker | $0.07–0.12 | $0.02 |
| one rewrite (only on a *must*) | $0.30–0.48 | — |
| **editing pass** | **Fable, medium effort: $0.47 · Sonnet 5.5: $0.06** | **$0.01** |
| **Turn total** | **with Fable editing: about $1.4–1.6 · with Sonnet: about $1.0–1.1** | about $0.04 |

Over 8 Turns, Voss alone comes to about $8–13. That is close to the first Run's $12 cap before Adelaide and the Epilogue are counted, so the editor's model and effort matter. **Not tested yet: Fable at low effort** for the pass. Most of its $0.47 is thinking (6,500 output tokens for a 1,430-word Letter), so low effort is the obvious next measurement.

## Open choices for Paolo

- **A. Is a 1,500-word Voss right?** Read the Letter above.
  - My take: it earns its length, because every paragraph answers something or moves something.
  - But three Letters this long every Turn would be a lot for the Player.
- **B. Which model does the editing pass?**
  - Fable catches the ambiguities the teacher cared about: about $0.47 per Letter at medium effort, probably much less at low.
  - Sonnet 5.5 costs $0.06 but smooths more than it fixes.
  - My recommendation: **Fable at low effort**, measured in the next Turn, with the teacher judging this Turn's before and after.
- **C. How close may Voss's doors get?** When the Player asks about the family, is «chiedi l'atto di morte di Rosa» fair, and is «chi ha dichiarato la morte» too much?
  - My recommendation: Voss may name the office and the document, never the field to look at.
- **D. Stronger checker model, or rely on review in testing?** Even v2 on Sonnet makes 3 false *must* points in 7, and the automatic rewrite then removes good material for each one.
  - Option 1: run the Voss checker on Fable or Opus 5.5, about $0.2–0.4 more per Letter.
  - Option 2: keep Sonnet and rely on the admin review in testing mode until the checker's precision is measured over a Run.
  - My recommendation: the stronger model, for the Voss checker only.
- **E. A deterministic check for Plot-key collisions** (the via Carini case). I'd add it to the checker utility in [#30](https://github.com/Imbustai/imbustai-app/issues/30).
- **F. The prefix: stripped examples and a writer view.**
  - Keep the example letters stripped of clues in the cached prefix.
  - Turn the dossier into a **writer view** without the answer; `prefix/voss.md` is the proposal.
  - A small dossier fix: Rosa's coat «in piena estate» on 23 May. One draft copied it.
- **G. Can the teacher read this Turn?** The Voss Letter and both office Letters, before and after. #37 closes on that verdict.
"""
open("../one-voss-turn.PROTOTYPE.md", "w").write(report)
