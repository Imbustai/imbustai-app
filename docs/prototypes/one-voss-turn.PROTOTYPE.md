# One real Voss Turn, end to end (PROTOTYPE)

> **PROTOTYPE, throwaway.** For [One real Voss Turn, end to end](https://github.com/Imbustai/imbustai-app/issues/25) and part 2 of [The Italian editing pass](https://github.com/Imbustai/imbustai-app/issues/37), on the map [Il quarto nome](https://github.com/Imbustai/imbustai-app/issues/9). Branch `prototype/one-voss-turn`, folder `docs/prototypes/one-voss-turn/`: the script `run-turn.PROTOTYPE.mts`, the prompts in `prefix/`, the Player's Letters in `player/`, every output and the per-call costs in `out/`.

**Spend: $2.78** of the $5 budget (17 calls; per-call usage in `out/costs.jsonl`). Writer `claude-fable-5-1` at medium effort. Reader, checker, offices and one editor variant ran on `claude-sonnet-5-5`, the `clerk`/`analyst` role from [#14](https://github.com/Imbustai/imbustai-app/issues/14).

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

Roma, martedì 22 settembre 1987

Caro Giacomo,

la tua lettera è arrivata sabato, a casa, come ti avevo chiesto. Me l'ha consegnata Mario, con una faccia solenne, come se sapesse che cosa c'era dentro: il postino la lascia al bar quando io sono in ufficio. L'ho letta sulle scale, poi in cucina, poi domenica un'altra volta. Sapere che hai scritto in cancelleria e alla Mobile, e che ci hai messo il tuo nome, mi ha tolto un peso che portavo da due settimane. Te lo dico subito, perché il resto della lettera è meno leggero.

Mi chiedi com'era Luca quando l'abbiamo preso. Era lunedì 23 maggio, le otto del mattino, e l'officina di via dei Volsci aveva appena aperto la saracinesca. Io e Pierangeli siamo entrati in divisa, e Luca era in fondo, con una tuta blu troppo grande e le mani già sporche. Non è scappato. Non ha nemmeno chiesto perché. Ha guardato il meccanico, Proietti, poi ha guardato noi, e ha allungato le mani come se sapesse già come si fa. Sapeva come si fa, per via del motorino dell'anno prima. Per quello avevamo la sua foto segnaletica al commissariato, e per quello il suo nome era venuto fuori prima degli altri. Un ragazzo di diciannove anni, coi capelli ricci scuri e un parka verde appeso a un chiodo, come ne aveva mezza San Lorenzo. Mi è rimasta in mente una cosa sola: era più basso di me, e mi sembrava impossibile che uno così basso avesse sparato a un uomo.

Che cosa ha detto, me lo chiedi. Nell'officina niente. In macchina niente. Al commissariato, davanti al brigadiere, ha detto che venerdì sera era al cinema Palazzo, da solo. Solo questo, e l'ha ripetuto uguale ogni volta che glielo chiedevano, senza alzare la voce, senza aggiungere un dettaglio: è la cosa che ci ha convinti tutti che fosse una bugia. Nessuno l'ha confermato, e un biglietto in tasca non l'aveva. Un ragazzo da solo al cinema il venerdì sera, a San Lorenzo, nel maggio del '77, con la città che bruciava per la Masi. Il brigadiere rideva. Io no, ma non perché gli credessi. È finito in custodia preventiva, e da lì non è più uscito.

Poi il pomeriggio è venuta Rosa. Di lei ti ho già scritto quello che ricordo, e non è poco: piccola, con un cappotto marrone che a maggio non si spiegava, in piedi nel corridoio del commissariato per un'ora a gridare che suo figlio era innocente. Non piangeva. Gridava, e nessuno riusciva a farla sedere. Del padre so soltanto quello che la Mobile ha detto a Palumbo a settembre: morto quando Luca era bambino. Nel '77 nessuno me ne ha parlato, e io non l'ho chiesto. Oltre a Rosa, a casa di Luca non ho mai visto nessuno, e nessuno è mai venuto a chiedere di lui al commissariato: né fratelli, né zii, né una fidanzata. Intorno a lui, per quello che ho visto io, c'era l'officina, e basta: Proietti, il meccanico, che ci ha guardato uscire senza dire una parola. Alle udienze non sono mai andato, come testimone non mi hanno mai chiamato, e quindi chi sedesse nel pubblico non lo so. È tutto quello che ho, e sono ricordi di una guardia di ventitré anni. Fidati fino a un certo punto.

C'è però una cosa che la Mobile non ha detto a Palumbo, o che Palumbo non ha detto a me. Rosa è morta «un paio d'anni fa», e quella telefonata non diceva di che cosa, né dove, né chi l'ha seppellita. Una donna che grida un'ora in un corridoio per il figlio non muore in silenzio, e se in questi anni ha parlato con qualcuno, quel qualcuno oggi è vivo. Io all'Anagrafe non posso chiedere niente senza che Cerroni lo sappia prima di sera. Tu un atto di morte lo puoi chiedere al Comune con una riga, e nessuno ti chiede perché.

Sulla tua idea del compagno di cella, adesso. Non ti dico che sbagli, ma non ti seguo, e ti spiego perché. Uno che ha ascoltato la storia di Luca per due anni e mezzo esce, e la prima cosa che fa è cercare tre testimoni di un processo non suo, con i lumini e il gesso, e a mente fredda. Per ammazzare tre persone così bisogna aver amato quel ragazzo, non averlo ascoltato. E chi esce di galera ha di solito conti propri da chiudere, prima di quelli degli altri. Io continuo a pensare a uno del quartiere: uno del giro di via dei Volsci, che nel '77 era poco più che un bambino e ha avuto dieci anni per farsi le ossa e per farsi il sangue amaro. Detto questo, la tua idea si controlla, e la mia no. Regina Coeli tiene la matricola: con chi ha diviso la cella Luca dal '77 al '79, e quando quelli sono usciti, è scritto da qualche parte. Io quel registro non lo vedrò mai. Tu, se lo chiedi al direttore con la carta intestata, sì. Chiedilo, così almeno una delle due idee la chiudiamo.

Mi chiedi come sto, e poi mi chiedi della notte, e rispondo a entrambe. Di giorno sto bene, o quello che qui passa per bene: lo sportello, i portafogli, una signora di via Carini che da tre settimane viene a denunciare lo stesso cane. Di notte è un'altra cosa. Dormo poco, e quando dormo mi sveglio alle quattro con la sensazione di aver lasciato una porta aperta. Mi alzo, controllo la porta, ed è chiusa. Poi resto in cucina finché non passa il primo tram. Domenica ho pure dormito storto sul divano, e lunedì allo sportello stavo di traverso come un impiegato del catasto. Non è la paura per me, Giacomo, questo te lo devo dire con onestà: nessuno viene a cercare l'autista. È la maestra, e ancora prima è quel caso, che non mi è mai piaciuto. Non so dirtelo meglio. Era colpevole, io lo credevo allora e lo credo adesso, e la Corte l'ha detto con ventiquattro anni. Eppure la mattina, dopo l'arresto, ero contento, e la sera, dopo Rosa, non lo ero più, e la differenza tra le due cose non me la sono mai spiegata fino in fondo. Forse è solo che quando arresti uno di diciannove anni e poi quello muore in cella, il tuo nome sul verbale non lo cancella più nessuno.

Dalla maestra non sono andato, e non ci vado senza avertelo scritto prima, come mi hai chiesto. Il suo numero è ancora sul foglietto accanto al telefono, e lì resta.

Al bar, invece, la vita continua come se in via Lanciani non fosse successo niente, ed è la cosa che mi tiene in piedi. Giovedì 10 e giovedì 17 ho giocato con Aldo, e ho perso quattro partite su cinque, che per me è quasi un miglioramento. Nel frattempo ho finito un Maigret, come ogni settimana: ne compro uno il lunedì all'edicola di piazza Rosolino Pilo e lo finisco per il sabato. Maigret è il mio commissario ideale, te l'ho mai detto? Non capisce niente fino all'ultima pagina, e intanto mangia bene. E a proposito di mangiare: tua sorella che ti scrive da Cremona per chiedertelo mi ha fatto pensare alla mia. Ne ho una a Caldaro, Martha, con due bambini che non mi riconoscono da un Natale all'altro. Lei non mi chiede se mangio, perché mia madre le ha già riferito che sotto casa ho un bar. Tra le donne della mia famiglia il bar di Mario è considerato una mensa, e forse hanno ragione loro.

Al tuo dirigente che ti saluta come un ospite non ho niente da dire, se non che i miei superiori, prima di te, mi salutavano anche peggio. Ma dimmi del cane della barca di Canneto: che ne avete fatto? Non dirmi che l'avete portato al canile, perché non ci credo. E il muro della chiesa dalla finestra, va bene, ma il pezzo di mare che colore ha la mattina? Qui a Roma, dalla mia finestra, vedo la finestra di fronte, e la signora che stende. Come diciamo da noi, *es wird schon*: in qualche modo si va avanti, anche con la vista che si ha.

Scrivimi quando la cancelleria ti risponde, o anche prima, se ti viene in mente un'altra domanda. Le tue domande mi fanno dormire male, ma mi fanno pensare, ed è meglio che stare in cucina ad aspettare il tram.

Florian

P.S. Se la Mobile ti risponde sulla maestra, dimmi che parole usano. Da come uno risponde si capisce se ha letto la lettera o soltanto la firma.

### Squadra Mobile, lunedì 5 ottobre 1987 (reaches Lipari in Turn 3)

QUESTURA DI ROMA
SQUADRA MOBILE
Prot. n. 4127/Gab. — Cat. A.12

Roma, 5 ottobre 1987

Al Commissario dott. Giacomo Lombardo
Commissariato di P.S.
98055 Lipari (ME)

Oggetto: Omicidi Cortesi e Ferri – tutela della signora Clara Benvenuti. Riscontro alla nota della S.V. del 14 settembre 1987.

In riferimento alla nota indicata in oggetto, si comunica quanto segue.

Le indagini sui due omicidi sono dirette dalla Procura della Repubblica di Roma (sostituto procuratore dott. Corrado Anselmi); questo Ufficio procede in qualità di polizia giudiziaria. Il collegamento con il procedimento del 1978 è stato valutato ed è stato ritenuto non significativo allo stato degli atti. Gli accertamenti sui familiari del Moretti Luca hanno dato esito negativo: i genitori risultano deceduti e non risultano fratelli.

Quanto alla signora Benvenuti, la stessa è stata opportunamente sensibilizzata a cura del competente Commissariato della Garbatella. Allo stato non sussistono elementi per disporre una vigilanza fissa.

Per le modalità degli accertamenti eseguiti, si precisa che gli stessi sono stati svolti secondo le procedure di rito. Non si ritiene di dover fornire ulteriori indicazioni in merito.

Qualora la S.V. intenda acquisire atti del procedimento, la relativa richiesta, che esula dalla competenza di questo Ufficio, va indirizzata alla Procura della Repubblica di Roma.

Distinti saluti.

p. IL DIRIGENTE
Il Commissario Capo
(Rinaldi)

### Cancelleria della Corte d'Assise, lunedì 19 ottobre 1987 (reaches Lipari in Turn 4)

CORTE D'ASSISE DI ROMA
CANCELLERIA – ARCHIVIO
Piazzale Clodio, Roma

Prot. n. 2318/87 Arch.

Roma, 19 ottobre 1987

Al Commissario dott. Giacomo Lombardo
Commissariato di P.S.
98055 Lipari (ME)

Oggetto: Vostra richiesta del 14 settembre 1987 – Procedimento penale contro Moretti Luca (omicidio Ricci Ettore, Roma, maggio 1977) – Trasmissione di copie.

In riferimento alla nota della S.V. del 14 settembre 1987, pervenuta il 21 settembre, si comunica che il fascicolo, depositato presso l'archivio, è stato reperito il 15 ottobre 1987.

Si trasmettono in copia conforme:

1. sentenza della Corte d'Assise di Roma del 14 marzo 1978;
2. verbali di ricognizione personale del 3 giugno 1977, davanti al giudice istruttore (tre atti separati);
3. verbale d'arresto del 23 maggio 1977, redatto dal Commissariato di P.S. di San Lorenzo;
4. certificato di stato di famiglia di Moretti Luca, rilasciato nel 1977 dall'Ufficio Anagrafe e allegato agli atti del giudizio;
5. atto d'appello della difesa (avv. Guido Sestili, d'ufficio);
6. ordinanza che dichiara estinto il reato per morte dell'imputato (1980).

Si precisa che questa Cancelleria non dispone degli atti delle indagini in corso, di competenza della Procura della Repubblica, né dei fascicoli di polizia, né del registro dei colloqui della Casa Circondariale di Regina Coeli, né di atti di stato civile, di competenza del Comune.

Distinti saluti.

Il Cancelliere Dirigente
dott. Ugo Ferracuti

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
|---|---|
| Mario me l'ha consegnata lui, perché il postino la lascia al bar quando io sono in ufficio, e me l'ha data con una faccia solenne, come se sapesse che cosa c'era dentro. | Me l'ha consegnata Mario, con una faccia solenne, come se sapesse che cosa c'era dentro: il postino la lascia al bar quando io sono in ufficio. |
| Io e Pierangeli siamo entrati in divisa, e lui era in fondo, con una tuta blu troppo grande, e le mani già sporche. | Io e Pierangeli siamo entrati in divisa, e Luca era in fondo, con una tuta blu troppo grande e le mani già sporche. |
| Ha guardato il meccanico, Proietti, e poi ha guardato noi, e ha allungato le mani come se sapesse già come si fa. | Ha guardato il meccanico, Proietti, poi ha guardato noi, e ha allungato le mani come se sapesse già come si fa. |
| Un ragazzo di diciannove anni, coi capelli ricci scuri e un parka verde appeso a un chiodo, come ne avevano mezza San Lorenzo. | Un ragazzo di diciannove anni, coi capelli ricci scuri e un parka verde appeso a un chiodo, come ne aveva mezza San Lorenzo. |
| Solo questo, e l'ha ripetuto uguale ogni volta che glielo chiedevano, senza alzare la voce, senza aggiungere un dettaglio, che è la cosa che ci ha convinti tutti che fosse una bugia. | Solo questo, e l'ha ripetuto uguale ogni volta che glielo chiedevano, senza alzare la voce, senza aggiungere un dettaglio: è la cosa che ci ha convinti tutti che fosse una bugia. |
| Oltre a Rosa, a casa sua non ho mai visto nessuno, e nessuno è mai venuto a chiedere di Luca al commissariato: né fratelli, né zii, né una fidanzata. | Oltre a Rosa, a casa di Luca non ho mai visto nessuno, e nessuno è mai venuto a chiedere di lui al commissariato: né fratelli, né zii, né una fidanzata. |
| Ti dico però una cosa che la Mobile non ha detto a Palumbo, o che Palumbo non ha detto a me. Rosa è morta «un paio d'anni fa». Di che cosa, dove, e chi l'ha seppellita, quella telefonata non lo diceva. | C'è però una cosa che la Mobile non ha detto a Palumbo, o che Palumbo non ha detto a me. Rosa è morta «un paio d'anni fa», e quella telefonata non diceva di che cosa, né dove, né chi l'ha seppellita. |
| Non ti dico che sbagli, ma fin lì non ti seguo, e ti spiego perché. | Non ti dico che sbagli, ma non ti seguo, e ti spiego perché. |
| Eppure la mattina dopo l'arresto ero contento, e la sera dopo Rosa non lo ero più, e la differenza tra le due cose non me la sono mai spiegata fino in fondo. | Eppure la mattina, dopo l'arresto, ero contento, e la sera, dopo Rosa, non lo ero più, e la differenza tra le due cose non me la sono mai spiegata fino in fondo. |
| E il muro della chiesa dalla finestra, va bene, ma il pezzo di mare che colore ha alla mattina? | E il muro della chiesa dalla finestra, va bene, ma il pezzo di mare che colore ha la mattina? |

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
