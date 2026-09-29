# Lombardo e la busta iniziale (PROTOTIPO)

> **PROTOTIPO — da buttare.** Bozza per [Giacomo Lombardo and the opening envelope](https://github.com/Imbustai/imbustai-app/issues/24), sulla mappa [Il quarto nome](https://github.com/Imbustai/imbustai-app/issues/9). Serve a far reagire Paolo, non è ancora seed. Quando è approvata, la §1–§5 diventa la scheda del Lead che ogni Personaggio legge, e la §7 diventa la busta iniziale di `engine-voss`.
>
> Fonti: il [fascicolo del caso](https://github.com/Imbustai/imbustai-app/blob/prototype/il-quarto-nome-case-file/docs/prototypes/il-quarto-nome-case-file.PROTOTYPE.md) ("fascicolo §n"), il [dossier di Voss](https://github.com/Imbustai/imbustai-app/blob/prototype/voss-dossier/docs/prototypes/voss-dossier.PROTOTYPE.md) ("dossier §n"), il [prototipo di Adelaide](https://github.com/Imbustai/imbustai-app/blob/prototype/adelaide-panorama-subplot/docs/prototypes/adelaide-panorama-subplot.PROTOTYPE.md) e la [scheda Roma 1987](https://github.com/Imbustai/imbustai-app/blob/research/rome-1987-period-facts/docs/research/rome-1987-period-facts.md) ("scheda §n.n"). Termini: glossario in `packages/story-engine/CONTEXT.md`.
>
> Segni: **[PK]** = Plot key · **[T]** = Texture · **[?]** = scelta da confermare · **[non verificato]**.
>
> **Revisione 2 (dopo la prima reazione di Paolo, [commento](https://github.com/Imbustai/imbustai-app/issues/24#issuecomment-5894517982)):** Voss segnala il collegamento e la Mobile lo archivia perché "la famiglia è tutta morta" (§0 J, nuova §4.1); la paura di Voss è per la Benvenuti, non per sé; Aldo nella prima lettera è una sola riga (§0 H); il Verdi di Voss diventa il Rigoletto a Caracalla, più avanti (§0 K); Voss non ricorda più nessun ferroviere nella famiglia di Luca (§9). La lettera (§7.3) è riscritta.
>
> **Revisione 3 (revisione linguistica, dopo la lettura di una maestra d'italiano):** i tre testi della §7 sono stati riletti e corretti come farebbe un redattore italiano, dal punto di vista di chi li riceve, senza toccare contenuti e decisioni. Che cosa è stato corretto: i riferimenti ambigui ("la madre" dopo "la maestra" diventa "Rosa"); l'ordine delle informazioni, ora quello in cui Voss le ha vissute (prima il 1977, poi il fastidio di giugno, capito adesso); i periodi lunghi tenuti insieme solo da virgole e due punti, divisi o legati con connettivi veri (quindi, perciò, invece); i calchi e le frasi che non si capiscono ("a certe domande una madre non deve arrivare"); un rimando a un tema non ancora introdotto ("non per la schiena"); un'incoerenza di tono (Cerroni che "se ne vergogna" e poi parla "con gusto"); il congiuntivo mancante ("ritenuto che… nuoccia"); le virgolette, ora «» in tutte le lettere. La maestra rilegge questa versione: se passa, lo stesso passaggio di revisione diventa obbligatorio per ogni Lettera generata in italiano; se no, si apre un ticket per la qualità dell'italiano, da lavorare dopo la prima Run.

---

## 0. Le scelte su cui reagire per prime

| # | Scelta | Proposta | Alternativa |
|---|---|---|---|
| A | **L'isola** | **Lipari**, isole Eolie, provincia di Messina. Oggi ha un commissariato di PS, e la scheda chiedeva un'isola dove fosse plausibile (scheda "Could not verify") *[non verificato: che il commissariato esistesse già nel 1987]*. Porta con sé due ironie che non serve spiegare: sotto il fascismo era un'isola di **confino** (la fuga di Rosselli, Lussu e Nitti nel 1929), e negli anni '70 le Eolie ricevevano i mafiosi al **soggiorno obbligato**. La posta arriva col treno fino a Milazzo e poi con la nave: col mare grosso non arriva [T]. | Un'isola inventata ("l'isola di Santa Venera"): niente da verificare, ma perde il confino e la geografia vera. |
| B | **Perché l'hanno mandato via** | **Un riconoscimento sbagliato, lo specchio di quello di Voss.** Marzo 1987: rapina con omicidio in una gioielleria di Prati. La Questura dà ai giornali la foto del fermato, **Marco Sabatini**, 20 anni, di Primavalle, tossicodipendente; *dopo*, una commessa lo riconosce. Lombardo, che guida le indagini, dice che quel riconoscimento non vale niente. Il 5 maggio, in riunione, lo dice al Questore davanti a tre funzionari. Il 25 maggio è trasferito. Ad agosto Sabatini viene scarcerato, e nessun giornale lo scrive. **Che cosa disse esattamente al Questore lo decide il Giocatore** (dossier §7.3). Perché conta: Voss scrive proprio all'unico uomo che ha pagato per essersi opposto a ciò che lui ha fatto nel 1977. Lo sa, e non lo dice. | Lasciare il motivo tutto al Giocatore ("uno scontro col Questore"). Più libertà, ma i Personaggi possono solo alludere, e si perde lo specchio. |
| C | **Che cosa fa sull'isola** | **È in soprannumero** (scheda §1.9: "anche in soprannumero"). Il commissariato ha già un dirigente; Lombardo non comanda niente e ha solo pratiche di porto d'armi, qualche furto di barche, i turisti d'estate. Per questo ha tempo per Voss, e resta però **commissario e ufficiale di polizia giudiziaria**: può scrivere agli uffici su carta intestata. | Dirige il commissariato: avrebbe casi dell'isola da raccontare, ma meno tempo e un motivo in meno per sentirsi punito. |
| D | **Quanto è definito** | **Poco, di proposito.** Il Lead è il Giocatore. La scheda fissa solo quello che serve ai Personaggi per rivolgersi a lui in modo coerente (§1–§2); tutto il resto (carattere, famiglia oltre il "vive solo", che cosa pensa, che cosa disse al Questore) lo scrive il Giocatore, e diventa Ledger (§5). | Un Lombardo pieno, con abitudini e passato: più colore nelle risposte, ma i Personaggi gli attribuirebbero cose che il Giocatore non ha scritto. |
| E | **Voss autista e il tu** (dossier §0 D, da confermare qui) | **Confermato.** Voss gli ha fatto da autista alla Mobile, 1984–86. Nel 1977 Lombardo era a **Milano**: il processo Moretti non l'ha mai sentito nominare. Così il caso gli arriva nuovo, come al Giocatore. | Lombardo a Roma già nel 1977: saprebbe del processo, e il Giocatore partirebbe in svantaggio sul suo stesso personaggio. |
| F | **Perché niente telefono, niente telegrammi, niente viaggi** (lasciato aperto dal fascicolo §9) | **"L'isola ascolta."** Il telefono del commissariato passa dal centralino, e a luglio, quando Voss ha chiamato per salutarlo, l'appuntato gli ha chiesto nome e grado e li ha scritti. Il telegrafo è all'ufficio postale, e l'impiegata legge tutto. A Roma non può andare: un commissario in soprannumero non ottiene licenze, e se lo vedono in via San Vitale è finita. Lo dice Voss nella prima lettera; la carta delle regole lo dice senza finzione. | Solo la regola del gioco, senza ragione nella storia. |
| G | **Il terzo testimone nella prima lettera** | **Voss la nomina: Clara Benvenuti, maestra, viva.** Tacere un nome che sa sarebbe una bugia per omissione senza motivo (dossier §4, regola 12: mai "qualcuno" al posto di un nome). La Mobile, dopo la segnalazione (§0 J), l'ha "sensibilizzata". Il Giocatore può insistere dal Turno 1, e il delitto 3 resta comunque inevitabile: lei apre la porta a un signore gentile che dice "Sono il marito di Rosa" (§4.1, §9). | Voss la tace e aspetta che Lombardo chieda. |
| H | **Aldo nella prima lettera** | **Una riga banale e nient'altro:** il giovedì Voss gioca a scacchi al bar con un pensionato del quartiere, Aldo. Nessuna disdetta, niente Verdi, nessun mestiere. Serve solo a mettere Aldo nello sfondo della vita di Voss prima che conti. | Nessun Aldo: ma allora, quando arriva, arriva già sotto i riflettori. |
| J | **Perché Voss scrive a Lombardo, se ha già capito il collegamento** (revisione di Paolo) | **Voss lo segnala, e la Mobile lo archivia perché "la famiglia è tutta morta".** Venerdì 4 settembre lo dice al suo dirigente, che manda un appunto alla Mobile. Sabato mattina la Mobile risponde per telefono: hanno controllato, il padre di Luca è morto quando era bambino, la madre due anni fa, fratelli non ce ne sono: nessuno vendica un ragazzo morto da otto anni; è una coincidenza, resta la setta. Il controllo è stato una telefonata al commissariato di San Lorenzo, non una ricerca d'archivio, e il patrigno, che ha un altro cognome e nel 1977 non si è mai visto, non ci compare (§4.1). Voss non ci crede, ma non ha il grado per insistere, e insistere vorrebbe dire domande sul 1977. Scrive all'unico che ha avuto ragione contro il Questore: serve qualcuno col grado, con le carte in mano e non con la memoria di un agente. | Una telefonata anonima da una cabina, persa tra le segnalazioni sulla setta. Scartata: la polizia la ignora per un motivo debole, e Voss sembra un vigliacco dalla prima pagina. |
| K | **Il Verdi di Aldo** (revisione di Paolo) | **Le due metà si separano, e nessuna delle due è "fischiare".** La metà di Adelaide resta com'è ([#23](https://github.com/Imbustai/imbustai-app/issues/23): un uomo che scende fischiettando un'opera; il titolo solo se glielo chiedono). La metà di Voss diventa indiretta e arriva più avanti, non nella prima lettera: *"Aldo è andato a Caracalla a sentire il Rigoletto per la quarta volta, e me l'ha raccontato mossa per mossa."* Per collegarle servono due passi: l'aria → il *Rigoletto* → l'uomo che al *Rigoletto* torna sempre. *[non verificato: il Rigoletto nel cartellone di Caracalla dell'estate 1987]* | Voss dice che Aldo "canticchia l'opera": più vago, ma è ancora un'abitudine della voce, e si aggancia troppo al fischio. |
| I | **Che cosa c'è nella busta, e in che forma** | Tre pezzi, in quest'ordine: (1) la **carta delle regole**, fuori dalla finzione, mostrata dalla UI prima di tutto; (2) il **decreto di trasferimento**, il documento di Lombardo stesso, notificato il 28 maggio; (3) la **prima lettera di Voss**, sabato 5 settembre. Nel contratto dell'Engine solo la (3) è una Lettera (`opening`); la (1) e la (2) sono dati fissi della Storia, e li mostra la UI del Giocatore (vedi §9). | Il decreto come Allegato della lettera di Voss: ma Voss non avrebbe motivo di spedirglielo. |

---

## 1. Chi è **[PK salvo dove segnato]**

- **Giacomo Lombardo**, nato a **Cremona il 14 marzo 1949**. 38 anni nel 1987. Alla Mobile lo chiamavano "il lombardo", e lui non ha mai riso [T].
- **Studi:** laurea in giurisprudenza a Pavia, 1973 (scheda §1.7: i commissari erano laureati, quindi "dottor Lombardo").
- **Carriera:**
  - **1975:** vince il concorso per vice commissario, a 26 anni.
  - **1975–1981:** Questura di **Milano**. Gli anni di piombo, visti da un ufficio [T].
  - **1981–1987:** Questura di **Roma, Squadra Mobile**, sezione omicidi, al secondo piano di via San Vitale (scheda §1.12). Commissario.
  - **1984–1986:** ha **Voss come autista** (§0 E). Notti di appostamento in macchina, due anni di chiacchiere. Si danno del tu fuori servizio.
  - **Dall'8 giugno 1987:** Commissariato di PS di **Lipari**, in soprannumero (§0 A, C; decreto in §7.2).
- **Vita:** **vive solo.** A Roma aveva un appartamento in affitto; sull'isola ha una stanza in affitto vicino a Marina Corta [T]. Oltre a questo, la famiglia, gli amori e le abitudini li scrive il Giocatore.
- **Posta:** tutta la sua posta, privata e d'ufficio, va a **"Dott. Giacomo Lombardo, Commissariato di P.S., 98055 Lipari (ME)"** *[non verificato: il CAP]*. Voss aggiunge "PERSONALE" sulla busta.
- **Che cosa non fa:** non telefona per il caso, non telegrafa, non lascia l'isola (§0 F).

## 2. Il trasferimento **[PK]**

| Data | Fatto |
|---|---|
| gio 19 marzo 1987 | Rapina alla **gioielleria Ceccarelli** in via Cola di Rienzo, Prati. Il titolare, Sergio Ceccarelli, 58 anni, è ucciso con un colpo di pistola. |
| 24 marzo | Fermato **Marco Sabatini**, 20 anni, di Primavalle, con precedenti per droga. La Questura dà la sua foto ai giornali. |
| inizio aprile | Una commessa della gioielleria, che il giorno della rapina aveva detto di non aver visto il viso, "lo riconosce" dopo aver visto la foto sul *Messaggero*. |
| mar 5 maggio | Riunione in Questura. Lombardo dice al Questore, davanti a tre funzionari, che il riconoscimento non vale niente e che il fermo regge solo per i giornali. **Le parole esatte le scrive il Giocatore.** |
| lun 25 maggio | Decreto di trasferimento d'ufficio, "anche in soprannumero" (§7.2). |
| gio 28 maggio | Notificato a Lombardo. |
| lun 8 giugno | Decorrenza: prende servizio a Lipari. **Lascia Roma prima del delitto 1** (18 giugno): i delitti li conosce solo dai giornali, che sull'isola arrivano in ritardo. |
| ven 21 agosto | Sabatini è scarcerato per insufficienza di indizi. Nessun giornale lo scrive. Voss lo sa dalle voci della Mobile. |

- Il trasferimento **non è una sanzione disciplinare** (scheda §1.10): è una misura amministrativa "per il prestigio dell'Amministrazione". Sulla carta, Lombardo non ha fatto niente di male. Per questo non può nemmeno ricorrere [T].
- **Chi sa che cosa:** alla Mobile la storia gira "in dieci versioni" (Voss). Voss sa della riunione e di Sabatini, **non** sa le parole dette. Adelaide non sa niente, e immagina un'isola col sole. Gli uffici non sanno niente: per loro è un commissario che scrive da Lipari. Il PM dell'Epilogo sa del trasferimento e non ne parla, o ne parla con una riga [?, per [#26](https://github.com/Imbustai/imbustai-app/issues/26)].
- **Lo specchio (§0 B):** nessun Personaggio lo dice mai ad alta voce. Voss ci arriva da solo solo nella confessione (dossier §7.3, "è una punizione onesta").

## 3. Lipari **[T, salvo dove segnato]**

- **Il commissariato:** un dirigente (commissario capo), qualche ispettore e sovrintendente, una decina di agenti *[non verificato: l'organico]*. Lombardo ha una scrivania nella stanza del protocollo.
- **Che cosa succede:** porti d'armi, licenze, barche rubate e ritrovate, risse al porto d'estate. A settembre i turisti se ne vanno e l'isola resta ai suoi.
- **La posta:** arriva con la nave da Milazzo. Col mare grosso (scirocco o maestrale) la nave non parte e la posta aspetta. **Non cambia i tempi del gioco** (una settimana per tratta, fascicolo §7): è solo una cosa di cui si può parlare.
- **Il vento, la pomice di Canneto, Vulcano che fuma di fronte, Stromboli la notte**: materia per le domande di Voss (dossier §4, regola 5), e per le risposte del Giocatore.
- **Il confino e il soggiorno obbligato** (§0 A): Lombardo può scherzarci, i Personaggi no. Voss al massimo una volta, e con tatto.

## 4. Che cosa sa all'inizio (confini della conoscenza) **[PK]**

- **Sa:** tutto il suo passato (§1–§2); chi è Voss e com'era in macchina; i due delitti, **come li hanno raccontati i giornali** (la "setta della trinità", i lumini, il triangolo); la procedura: che cosa chiedere, a chi, su carta intestata.
- **Non sa:** niente del processo Moretti fino alla lettera di Voss; niente di Aldo e di Adelaide; niente della foto del 1977.
- **Può:** scrivere a qualunque ufficio pubblico di Roma come commissario e ufficiale di PG, gratis (scheda §4.7), e scrivere a chi gli ha scritto.
- **Non può:** telefonare, telegrafare, andare a Roma (§0 F); fare perquisizioni o fermi da Lipari (li chiede alla Procura, fascicolo §7).

### 4.1 La segnalazione di Voss e il controllo della Mobile **[PK nuovo, da portare nel fascicolo §4]**

| Quando | Che cosa |
|---|---|
| ven 4 settembre, mattina | Voss sente del delitto 2 allo sportello e riconosce il nome di Ferri. A mezzogiorno lo dice al suo dirigente, il **dott. Palumbo**, commissario capo a Monteverde [T]: i due morti sono testimoni del processo Moretti del 1978, e la terza, Clara Benvenuti, è viva. |
| ven 4, pomeriggio | Palumbo manda un **appunto** alla Squadra Mobile, con il nome di Voss come fonte ("l'agente Voss, che partecipò all'arresto, riferisce che…"). |
| sab 5, mattina | Un funzionario della Mobile, il **dott. Rinaldi** [?], telefona a Palumbo, e Palumbo riferisce a Voss: *"Controllato. Il ragazzo è morto nel '79, il padre quando era bambino, la madre un paio d'anni fa. Fratelli niente. Non c'è nessuno che lo possa vendicare. Coincidenza. La signora Benvenuti la facciamo sensibilizzare dalla Garbatella."* |
| sab 5, sera | Voss scrive a Lombardo (§7.3). |

- **Com'è stato fatto il controllo:** una telefonata al commissariato di San Lorenzo, dove un assistente anziano si ricorda della madre ("quella che gridava nel corridoio") e sa che è morta di tumore. Nessuno ha chiesto un documento all'Anagrafe. Il patrigno non esce perché ha un altro cognome, nel 1977 non si è mai visto (era sul treno, fascicolo §1.3) e non compare nell'atto di morte di Luca (fascicolo §3.6). **La Mobile sbaglia per lo stesso motivo per cui sbaglia Voss: per tutti, la famiglia di Luca era Rosa.** Chi chiede le carte giuste (l'attestazione dell'Anagrafe o il certificato del 1977 negli atti, fascicolo §7) batte la Mobile con i suoi stessi strumenti.
- **Perché la Mobile si accontenta:** ha la setta, i giornali la raccontano, e dopo il trasferimento di Lombardo in Questura nessuno ha voglia di contraddire la linea del Questore. Un collegamento con un processo chiuso, con l'imputato morto e senza famiglia, portato da un agente dello sportello denunce, finisce agli atti.
- **Che cosa vuol dire "sensibilizzare":** il commissariato della Garbatella manda un agente dalla Benvenuti a dirle di non aprire agli sconosciuti. Lei lo ringrazia. Il 22 ottobre apre a un signore anziano e gentile che dice *"Sono il marito di Rosa. Ho letto la sua lettera."* Per lei non è uno sconosciuto (fascicolo §2).
- **Da adesso, nei dati:** l'appunto del 4 settembre è negli atti della Mobile. Le risposte della Mobile a Lombardo lo citano ("la segnalazione del commissariato di Monteverde del 4 settembre è già stata valutata"). Dopo il delitto 3 la Mobile prende sul serio il processo Moretti, ma **in silenzio**, e cerca gli amici di Luca a San Lorenzo: la stessa pista sbagliata di Voss (dossier §6, "un giovane"). In pubblico resta la setta. Il fermo di Lattanzi [?] è la faccia pubblica di questa confusione.
- **Voss sa** della morte di Rosa da sabato 5 settembre, e solo questo: niente date, niente cause oltre "un paio d'anni fa".

## 5. Come i Personaggi gli si rivolgono

**Regola generale: il Lead è il Giocatore.** Nessun Personaggio gli attribuisce pensieri, abitudini, fatti o sentimenti che non siano in §1–§2 o nelle sue Lettere. Quello che il Giocatore scrive di sé diventa un fatto del Ledger, e i Personaggi lo ricordano. Se il Giocatore scrive di sé qualcosa che contraddice un Plot key (per esempio "nel '77 ero a Roma"), chi non può saperlo lo accetta, e Voss, che lo sa, lo corregge con garbo una volta sola [?]. Nessun Personaggio commenta la calligrafia, la carta o i francobolli delle sue Lettere, perché il Giocatore non li sceglie.

| Chi | Come apre | Registro | Che cosa sa di lui |
|---|---|---|---|
| **Voss** | "Caro Giacomo," | tu | §1–§2 tranne le parole dette al Questore |
| **Adelaide** | "Egregio Commissario Lombardo," poi "Commissario" | lei | Il nome, il grado, l'isola. Nient'altro. |
| **Uffici di Roma** | "Al Commissario dott. Giacomo Lombardo — Commissariato di P.S. di Lipari", con "Oggetto:" e il riferimento alla sua lettera | lei, burocratico | Che è un commissario e scrive da Lipari |
| **Squadra Mobile** | Come gli uffici, più fredda di un grado: conoscono il suo nome, e si sente | lei | Il trasferimento, senza nominarlo mai |
| **PM (Epilogo)** | "Egregio dottore," (scheda §7.4) | lei | Il suo lavoro, dagli atti |

## 6. Lo spazio del Giocatore

Quello che la scheda lascia vuoto, di proposito: che cosa disse al Questore; se ha una famiglia da qualche parte; se gli manca Roma; che cosa pensa di Voss; come vive l'isola; se ha paura. Voss gli fa domande proprio su questo (dossier §4, regola 5), e la fiducia sale quando il Giocatore risponde (dossier §5.2). Il Giocatore può anche non rispondere mai: la storia regge lo stesso, Voss si confida solo di meno.

---

## 7. La busta iniziale

Il Giocatore la apre sabato 12 settembre 1987 (fascicolo §6). Scrive le sue prime Lettere datate lunedì 14 settembre (Turno 1).

### 7.1 La carta delle regole (fuori dalla finzione)

Mostrata dalla UI prima di tutto, su un foglio che non sembra una lettera. È il posto dove il gioco parla al Giocatore, l'unico.

> **Prima di cominciare**
>
> Sei il commissario **Giacomo Lombardo**. È il settembre del 1987. Da giugno lavori su un'isola, lontano da Roma, e non per tua scelta. Nella busta trovi il tuo decreto di trasferimento e la lettera di un vecchio collega.
>
> **Come si gioca**
> - Giochi **scrivendo lettere**, e soltanto lettere. In questa storia non si telefona, non si mandano telegrammi e non si lascia l'isola.
> - A ogni turno puoi spedire **fino a 3 lettere**, ciascuna a un solo destinatario.
> - La storia dura **8 turni**, e ogni turno copre circa due settimane. Dopo l'ottavo la storia finisce, comunque vada.
> - A Roma il tempo passa anche se tu non scrivi.
>
> **A chi puoi scrivere**
> - A chiunque ti abbia scritto.
> - A **qualunque ufficio pubblico di Roma**. Sei un commissario, e gli uffici sono tenuti a risponderti. Se sbagli ufficio, la tua lettera viene inoltrata a quello giusto, senza perdere tempo.
> - La risposta di un ufficio arriva dopo **2 o 3 turni**. La posta impiega una settimana all'andata e una al ritorno, e in mezzo ogni ufficio ha i suoi tempi, che ti comunica quando risponde.
> - Chiedi cose precise: nomi, date, un processo, un indirizzo. A una richiesta vaga, un ufficio risponde solo in parte.
>
> **Il 1987**
> - Non esistono cellulari, computer da consultare o fax.
> - Non esiste il DNA. Le impronte digitali si confrontano a mano, e soltanto con quelle di una persona che hai già nominato.
> - Un vecchio documento si trova solo se sai in quale archivio cercarlo.
>
> Non esistono mosse sbagliate. Esistono solo mosse fatte troppo tardi.

### 7.2 Il decreto di trasferimento **[PK: date, formula, destinazione]**

Il documento è di Lombardo: "l'hai in tasca da giugno". Dice al Giocatore chi è, senza dire perché. *[non verificato: intestazione, numero di protocollo e formula esatta di un decreto di trasferimento del 1987.]*

> MINISTERO DELL'INTERNO
> DIPARTIMENTO DELLA PUBBLICA SICUREZZA
> Direzione Centrale del Personale
>
> N. 333-D/14.872
>
> **IL CAPO DELLA POLIZIA**
> **DIRETTORE GENERALE DELLA PUBBLICA SICUREZZA**
>
> VISTA la legge 1° aprile 1981, n. 121;
> VISTO il D.P.R. 24 aprile 1982, n. 335, e in particolare l'articolo 55;
> RITENUTO che la permanenza del funzionario sottoindicato nell'attuale sede nuoccia al prestigio dell'Amministrazione;
>
> **DECRETA**
>
> Il commissario dott. **Giacomo LOMBARDO**, nato a Cremona il 14 marzo 1949, in servizio presso la Squadra Mobile della Questura di Roma, è trasferito d'ufficio, anche in soprannumero, al **Commissariato di P.S. di Lipari** (Questura di Messina), con decorrenza dall'8 giugno 1987.
>
> Roma, 25 maggio 1987
>
> p. IL CAPO DELLA POLIZIA
> *(firma illeggibile)*
>
> ---
> *Timbro:* QUESTURA DI ROMA — Notificato all'interessato il 28 maggio 1987.
> *Per ricevuta:* G. Lombardo

### 7.3 La prima lettera di Voss (strato 0)

Obblighi da [#22](https://github.com/Imbustai/imbustai-app/issues/22): strato 0 soltanto (i morti sono due testimoni del processo Moretti, Voss era una delle due guardie che arrestarono Luca, ha paura); la foto resta segreta; ogni argomento ha un ponte; spinge Lombardo a scrivere agli uffici, perché un commissario può e un agente no; nessun limite di lunghezza; firma "Florian". Voss indica la porta (le carte del processo), non la risposta. Dalla revisione 2: Voss ha già fatto la cosa giusta, e non è bastata (§4.1).

> Roma, sabato 5 settembre 1987
>
> Caro Giacomo,
>
> ti devo una lettera da giugno. Quando ho saputo del trasferimento l'ho cominciata tre volte, e tre volte l'ho strappata. Sembravano tutte lettere di condoglianze, e tu non sei morto: sei soltanto finito su un'isola. Mi dispiace che questa non sia quella lettera. Ti scrivo perché ho bisogno di te, e non so dirlo meglio di così.
>
> Ieri mattina Cerroni si è fermato al mio sportello con la faccia di chi porta una brutta notizia e un po' se la gode. Giovedì sera, al Nomentano, in via Lanciani, hanno ucciso un ragioniere sul pianerottolo di casa sua, al quarto piano. La luce delle scale era spenta. Accanto al corpo hanno trovato tre lumini rossi disposti a triangolo e un triangolo tracciato col gesso sul pavimento, come nella farmacia di piazza dei Sanniti a giugno. Alla Mobile dicono che è una setta, e oggi lo scrivono anche i giornali. Cerroni lo ripeteva con gusto, come chi finalmente ha qualcosa da raccontare a cena.
>
> Il ragioniere si chiamava Ottavio Ferri. Quando Cerroni ha detto il nome, ho smesso di ascoltarlo. Io quel nome lo conosco da dieci anni.
>
> Nel maggio del '77, a San Lorenzo, hanno rapinato la tabaccheria di Ettore Ricci, in via Tiburtina. Il rapinatore gli ha sparato al petto e se n'è andato con duecentoquarantamila lire. Tre persone lo hanno visto scappare: il farmacista di fronte, Silvano Cortesi; un contabile che aspettava l'autobus, Ottavio Ferri; e una maestra che tornava a casa a piedi, Clara Benvenuti. Tutti e tre hanno riconosciuto un ragazzo del quartiere, Luca Moretti, che aveva diciannove anni. Nel marzo del '78 la Corte d'Assise lo ha condannato a ventiquattro anni, e nel dicembre del '79 è morto a Regina Coeli, prima dell'appello.
>
> A giugno il nome del farmacista mi aveva dato un fastidio che non riuscivo a spiegarmi. Avevo pensato a qualcuno passato allo sportello per una denuncia, e non ci avevo più pensato. Adesso so chi era. Dei tre testimoni, due sono morti. La terza, la maestra, è ancora viva.
>
> Io c'ero, Giacomo. Ero guardia al commissariato di San Lorenzo e avevo ventitré anni. La mattina del 23 maggio ho arrestato io Luca Moretti, insieme a un collega, Pierangeli, nell'officina di via dei Volsci dove lavorava come garzone. Sul verbale d'arresto c'è la mia firma. Per questo ricordo quei nomi: ho seguito il processo sui giornali fino alla fine, e la fine non è stata buona per nessuno.
>
> Ieri a mezzogiorno sono andato dal mio dirigente, il dottor Palumbo, e gli ho raccontato tutto, con i nomi e le date. Palumbo non ama le complicazioni, ma è una persona onesta. Davanti a me ha scritto un appunto per la Mobile, ci ha messo il mio nome e l'ha mandato subito. Stamattina dalla Mobile gli hanno telefonato, e lui mi ha chiamato in ufficio per riferirmi la risposta, con la faccia di chi ti restituisce un compito pieno di segni rossi. Hanno controllato la famiglia di Luca. Il padre è morto quando lui era bambino, la madre, Rosa, un paio d'anni fa, e fratelli non ne aveva. Secondo la Mobile nessuno ha motivo di vendicare un ragazzo morto otto anni fa, quindi si tratta di una coincidenza, e la pista resta quella della setta. Quanto alla maestra, mi ha detto Palumbo, il commissariato della Garbatella manderà qualcuno a «sensibilizzarla». Credo che voglia dire un agente sulla porta per dieci minuti e un «signora, stia attenta».
>
> Rosa è morta, e io non lo sapevo.
>
> Alla coincidenza non credo. Due testimoni su tre non sono una coincidenza, e una setta che sceglie le vittime tra i testimoni di un processo di dieci anni fa non è una setta. È qualcuno che ha letto gli atti. Ma chi sono io per ripeterlo alla Mobile? Sono l'agente dello sportello denunce di Monteverde, quello dei portafogli smarriti e dei cani che abbaiano. La prima volta mi hanno risposto per riguardo verso Palumbo. Se ci tornassi, mi chiederebbero perché ci tengo tanto e che cosa ricordo di quel processo, e io adesso in via San Vitale non voglio andare a raccontare niente. Non a loro. E poi quest'anno ho visto che fine fa, in Questura, chi dice che la linea è sbagliata. Basta guardare dove sei tu.
>
> Ieri sera ho cercato la maestra sull'elenco del telefono. C'è: Benvenuti Clara, alla Garbatella. Ha cambiato casa, ma dev'essere lei. Ho composto il numero fino alla penultima cifra, poi ho riattaccato, perché non sapevo che cosa dirle. Che cosa si dice a una donna sola, alle dieci di sera? Che forse qualcuno vuole ucciderla per una cosa che ha fatto dieci anni fa, per senso del dovere? È questa la mia paura, adesso, e ha un nome e un indirizzo. Ho paura per lei. E ho paura di aver già fatto tutto quello che potevo, e che non basti.
>
> Per questo scrivo a te, e te lo dico chiaramente, come con te ho sempre potuto fare. Serve qualcuno con un grado, che insista con le carte in mano e non con la memoria di un agente. Tu le carte puoi chiederle, io no. Se vado io in cancelleria a chiedere un fascicolo del '77, mi fanno riempire un modulo in carta bollata, mi chiedono chi mi manda, e il giorno dopo lo sa tutta la Questura. Tu invece sei un commissario, anche se stai su un'isola e sei in soprannumero. Una tua lettera su carta intestata viene protocollata, e qualcuno è tenuto a risponderti. Il processo è quello contro Moretti Luca, Corte d'Assise di Roma, 1978. Da qualche parte c'è un fascicolo con i nomi, i verbali e le date. Non so che cosa ci troverai. So soltanto che la Mobile non l'ha aperto, perché per rispondere a Palumbo le è bastata una telefonata. E se scrivi a qualcuno per la maestra, firma col tuo nome: vale più del mio.
>
> Non ti chiedo di venire. So che non puoi, e so che se ti vedessero in via San Vitale sarebbe finita davvero. E non ti telefono. Ci ho provato a luglio, per salutarti. Al commissariato mi ha risposto un appuntato, mi ha chiesto nome, grado e motivo della telefonata, e ho sentito la penna che scriveva. Ho detto che avevo sbagliato numero e ho riattaccato come un ladro. Un telegramma sarebbe anche peggio: immagino che all'ufficio postale dell'isola lo leggano prima ancora di timbrarlo. Perciò ti scrivo, e aspetto. Mario, quello del bar sotto casa, dice che una lettera per le isole ci mette una settimana, due se tira vento. Una volta lui ha spedito una cartolina a Ponza, ed è arrivata dopo di lui.
>
> Mario è trasteverino, mi chiama «Floria'» e sostiene che la carbonara di Monteverde andrebbe denunciata. In questi giorni il suo bar è l'unico posto dove sto bene. Il giovedì sera ci gioco a scacchi con un pensionato del quartiere, Aldo, che mi batte più spesso di quanto sarebbe educato. Mario dice che gioco come guidavo: con tutte e due le mani sul volante e nessuna fretta di arrivare.
>
> Tu lo sai, come guidavo. Di quelle notti in macchina ricordo più cose di quanto immagini: il caffè del termos che sapeva di termos, tu che leggevi i verbali con la pila tra i denti, io che ti parlavo di Termeno e tu che facevi finta di sapere dov'è. È lì che abbiamo cominciato a darci del tu, e non l'ho dimenticato. In tredici anni di servizio sei stato l'unico superiore che mi abbia trattato da persona. Per questo, quando alla Mobile raccontano la tua storia col Questore, e ne raccontano dieci versioni, io sto zitto e non ne credo a nessuna. Non ti chiedo quale sia quella vera. Ti dico solo una cosa che forse lì non ti è arrivata: il 21 agosto hanno scarcerato Sabatini, il ragazzo di Primavalle, per insufficienza di indizi. Nessun giornale l'ha scritto. Avevi ragione tu, e ti è costata un'isola. A quella riunione ho pensato spesso, più di quanto dovrebbe fare uno che non c'era.
>
> Adesso tocca a te. Com'è, lì? Che cosa fa tutto il giorno un commissario in soprannumero? Dalla finestra dell'ufficio vedi il mare, o soltanto un muro? A Roma è ancora estate, una di quelle estati che non se ne vogliono andare. Mia madre mi telefona la domenica e mi chiede soltanto se annaffio i gerani. Le rispondo di sì, e di tutto il resto non le dico niente. *Na ja*: certe cose una madre è meglio che non le sappia.
>
> Scrivimi appena puoi, anche solo per dirmi che sbaglio. E scrivi anche a chi è tenuto a risponderti, perché io da qui posso solo leggere i giornali e aspettare.
>
> Florian
>
> P.S. Scrivimi a casa, in via Fratelli Bonnet, e non al commissariato: lì la posta la apre il piantone, e il piantone è Cerroni.

**Controllo rispetto a [#22](https://github.com/Imbustai/imbustai-app/issues/22) e alla revisione 2:**
- **Strato 0 e basta:** i due morti sono testimoni del processo Moretti; Voss era una delle due guardie dell'arresto; ha paura. Nessuna foto, nessuna stanza, niente sulla ricognizione. "Che cosa ricordo di quel processo… non ci voglio andare a raccontare niente" è una porta chiusa, non lo strato 1 (la "seconda domanda" resta per i Turni 1–2).
- **Nessun silenzio di comodo:** Voss ha segnalato tutto, col suo nome, il giorno dopo (§4.1). Scrive a Lombardo perché la segnalazione è stata archiviata, non al posto di farla.
- **La paura è per la Benvenuti**, con un nome, un indirizzo e un gesto (il numero non finito). Nessuna paura per sé: quella arriva dopo il delitto 3 (dossier §6).
- **Nessuna bugia su un Plot key:** "quel caso l'ho seguito dai giornali" è vero; il resto è silenzio.
- **Ponti:** la notizia → il nome → il 1977 → giugno, capito adesso → la sua parte → la segnalazione → la risposta della Mobile → Rosa → perché non insiste → la maestra → le carte → il telefono → Mario → gli scacchi e la guida → le notti in macchina → il Questore → l'isola → la madre.
- **Spinta al lavoro:** "tu puoi chiedere le carte, io no", con il perché, e una porta sola: il fascicolo del processo. In più: "la Mobile non l'ha aperto", che dice al Giocatore che le carte battono la telefonata.
- **Aldo:** una riga, "un pensionato del quartiere" che gioca a scacchi il giovedì. Nessun mestiere, nessun Verdi, nessuna disdetta. Il giovedì 3 settembre non è mai nominato come serata di scacchi.
- **L'indizio di struttura:** "la famiglia è tutta morta" è falso sulla carta giusta e vero su quella sbagliata. Chi si chiede se la madre si era risposata è sulla strada; chi non se lo chiede non perde niente.
- **Voce:** "Caro Giacomo," e "Florian"; un'espressione tedesca; domande personali; nessun elenco; frasi lunghe chiuse da una corta ("Rosa è morta, e io non lo sapevo."). Circa 1.500 parole.

---

## 8. Per il seed (in breve)

```
Lombardo               Giacomo Lombardo, n. Cremona 14/03/1949; laurea giurisprudenza Pavia 1973; vive solo
carriera               vice commissario 1975; Questura di Milano 1975–81; Roma, Squadra Mobile (omicidi) 1981–87; commissario
Voss                   suo autista 1984–86; tu fuori servizio
caso Sabatini          gio 19/03/1987 gioielleria Ceccarelli (via Cola di Rienzo); fermo di Marco Sabatini 24/03; riconoscimento dopo la foto sui giornali
Questore               mar 05/05/1987 riunione, tre funzionari presenti; parole: del Giocatore
trasferimento          decreto 25/05/1987 (art. 55 DPR 335/1982, "anche in soprannumero"); notifica 28/05; decorrenza 08/06/1987
sede                   Commissariato di P.S. di Lipari (Questura di Messina), in soprannumero; posta: Commissariato di P.S., 98055 Lipari (ME)
Sabatini scarcerato    ven 21/08/1987, insufficienza di indizi; nessun giornale
non sa all'inizio      il processo Moretti, Aldo, Adelaide, la foto del 1977; i delitti solo dai giornali
non può                telefonare, telegrafare, lasciare l'isola, perquisire da Lipari
segnalazione di Voss   ven 04/09/1987 al dott. Palumbo (Monteverde) → appunto alla Mobile; sab 05/09 risposta per telefono: "famiglia tutta morta", coincidenza, la Benvenuti "sensibilizzata"
controllo della Mobile una telefonata al commissariato di San Lorenzo, nessun documento; il patrigno non esce
busta                  carta delle regole (UI) · decreto (dato fisso) · lettera di Voss sab 05/09/1987 (Lettera, strato 0)
```

## 9. Passaggi ad altri ticket

- **[#19](https://github.com/Imbustai/imbustai-app/issues/19), fascicolo del caso §4 (modifica approvata da Paolo):** la Mobile ha il collegamento col processo Moretti dal 4 settembre, e lo archivia dopo un controllo per telefono (§4.1). Dopo il delitto 3 lo lavora in silenzio, cercando gli amici di Luca; in pubblico resta la setta. La frase "nessuno collega un processo di dieci anni prima" diventa "la Mobile lo collega, e lo liquida". Il fermo di Lattanzi resta possibile come facciata pubblica. Aggiungere al §7 che le risposte della Mobile citano l'appunto del 4 settembre, e al §9 la domanda "perché la polizia non ha protetto la maestra?", con la risposta: l'ha "sensibilizzata", e lei ha aperto al marito di Rosa.
- **[#22](https://github.com/Imbustai/imbustai-app/issues/22), dossier di Voss:**
  - **§5.1:** togliere "il padre di Luca faceva il ferroviere, forse". Della famiglia Voss conosce solo Rosa. Spostare "che Rosa è morta nel 1985" da "non sa" a "sa dal 5 settembre, senza data né causa".
  - **§1.7 e §6 non cambiano:** Voss continua a cercare "un giovane", e ora la Mobile gli dà ragione.
  - **§7.1 (Turno 2):** "Aldo fischiava il Rigoletto" diventa il Rigoletto a Caracalla (§0 K), e non nel Turno 2 ma più avanti. La lettera ripete la prima (la Benvenuti, la Corte d'Assise): va riscritta con un'altra porta, oppure resta solo come ancora di stile. Commenta anche la calligrafia di Lombardo ("in stampatello"): contro la regola della §5.
  - **§7.2 (Turno 4):** togliere "mi pare di aver sentito che faceva il ferroviere" e "oggi, se è viva, avrà una sessantina d'anni" (ora Voss sa che è morta).
  - Cerroni, il collega del cugino dinamitardo (dossier §7.2), qui è anche il piantone che apre la posta: va bene se Paolo lo vuole.
- **[#23](https://github.com/Imbustai/imbustai-app/issues/23), Adelaide:** la sua metà non cambia; nota solo che Voss non dirà mai che Aldo "fischia" (§0 K).
- **[#26](https://github.com/Imbustai/imbustai-app/issues/26), i Turni e gli Endings:**
  - Se nel Turno 1 il Giocatore scrive alla Mobile o alla Procura per proteggere la Benvenuti: la Mobile risponde fredda al Turno 3 citando l'appunto del 4 settembre ("già valutata, la signora è stata sensibilizzata"); la Procura lo annota. Il delitto 3 avviene comunque (§4.1), e dopo quella lettera pesa: la Procura se ne ricorda.
  - Quando Voss cita di nuovo Aldo, e con quali indizi: la prima lettera ne ha usato solo la presenza (§0 H). La disdetta del 3 settembre, il Rigoletto e l'"ex ferroviere" vanno distribuiti nei Turni, non concentrati.
  - La riga del PM sul trasferimento (§2), e sull'appunto archiviato dalla Mobile.
- **[#25](https://github.com/Imbustai/imbustai-app/issues/25), il Turno di prova:** il checker deve segnalare un Personaggio che attribuisce a Lombardo un fatto non scritto (§5). Il Turno di prova può usare questa lettera come la busta vera.
- **"Player UI" (nebbia sulla mappa):** la carta delle regole e il decreto non sono Lettere. Il contratto dell'Engine ([#20](https://github.com/Imbustai/imbustai-app/issues/20)) ha solo `opening: OutgoingLetter[]`, e un mittente deve stare nel `cast`. Proposta: la Storia ha un campo fisso per i documenti del Lead (qui il decreto) e uno per la carta delle regole; la UI li mostra prima della prima Lettera.
- **Fascicolo §9:** la domanda sul telefono ha una risposta (§0 F).
