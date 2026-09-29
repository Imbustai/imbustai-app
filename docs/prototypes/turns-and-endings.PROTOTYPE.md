# Gli otto Turni e i Finali (PROTOTIPO)

> **PROTOTIPO, da buttare.** Bozza per [The eight Turns and the Endings](https://github.com/Imbustai/imbustai-app/issues/26), sulla mappa [Il quarto nome](https://github.com/Imbustai/imbustai-app/issues/9). Serve a far reagire Paolo e non è ancora seed. Quando è approvata, diventa la parte "meccanica" di `engine-voss`: il calendario, lo stato di Voss, la ripresa degli indizi, la scelta del Finale e i testi-àncora dei Finali.
>
> **Fonti** (tutte approvate):
> - il [fascicolo del caso](https://github.com/Imbustai/imbustai-app/blob/prototype/il-quarto-nome-case-file/docs/prototypes/il-quarto-nome-case-file.PROTOTYPE.md) ("fascicolo §n");
> - il [dossier di Voss](https://github.com/Imbustai/imbustai-app/blob/prototype/voss-dossier/docs/prototypes/voss-dossier.PROTOTYPE.md) ("dossier §n");
> - il [Subplot di Adelaide](https://github.com/Imbustai/imbustai-app/blob/prototype/adelaide-panorama-subplot/docs/prototypes/adelaide-panorama-subplot.PROTOTYPE.md) ("Adelaide §n");
> - [Lombardo e la busta iniziale](https://github.com/Imbustai/imbustai-app/blob/prototype/lombardo-opening-envelope/docs/prototypes/lombardo-opening-envelope.PROTOTYPE.md) ("busta §n");
> - la [scheda Roma 1987](https://github.com/Imbustai/imbustai-app/blob/research/rome-1987-period-facts/docs/research/rome-1987-period-facts.md) ("scheda §n.n");
> - le note di Paolo in [Improvements della storia di voss](https://github.com/Imbustai/imbustai-app/issues/5) (la ripresa degli indizi).
>
> Termini: glossario in `packages/story-engine/CONTEXT.md`. Qui *Ending* si dice **Finale**, come nel prototipo di Adelaide.
>
> Segni: **[PK]** = Plot key · **[T]** = Texture · **[?]** = scelta da confermare · **[non verificato]** = plausibile ma non controllato.
>
> **Revisione linguistica ([#37](https://github.com/Imbustai/imbustai-app/issues/37)):** i testi italiani della §10 hanno avuto il passaggio del redattore, con lo stesso metodo approvato dalla maestra sulla busta iniziale: riferimenti chiari, fatti nell'ordine in cui sono vissuti, connettivi veri, niente calchi, tono coerente, congiuntivi, virgolette «». Non li ha ancora letti la maestra.

---

## 0. Le scelte su cui reagire per prime

| # | Scelta | Proposta | Alternativa |
|---|---|---|---|
| A | **Come si contano i Turni** | **"Turno N" = le Lettere del Giocatore del Turno N più il batch che ne nasce ("batch N")**, che il Giocatore legge quando scrive il Turno N+1 (§1). È la convenzione del dossier di Voss. Il prototipo di Adelaide contava invece il Turno *in cui si legge* la Lettera: la sua "prima Lettera del Turno 3" sta nel batch 2. Rinumerata così, salta fuori un errore: la sua reazione al delitto 3 era in una Lettera spedita prima del 22 ottobre. Si sposta nel batch 4 (§3.4). | Contare per lettura: allora la Lettera di Voss "del Turno 2" diventa "del Turno 3", e vanno riletti dossier e fascicolo. |
| B | **"Avvisa la Benvenuti" al Turno 1** | **Il delitto 3 resta un Plot key, ma diventa inevitabile per carattere, non solo per calendario.** Se il Giocatore chiede a Voss di avvisarla, Voss ci va (batch 1). Lei lo riconosce, gli offre un caffè e gli racconta che l'anno scorso ha scritto alla madre di Luca per chiederle perdono. Quando Voss le dice che Rosa è morta, lei risponde che la lettera non le è mai tornata indietro. Sulla porta aggiunge: «Se un giorno qualcuno di quella famiglia bussasse, io aprirei.» Il 22 ottobre apre al "marito di Rosa" per questo: cerca il perdono, non è ingenua. Se invece il Giocatore scrive alla Mobile o alla Procura, la risposta arriva nel batch 2, fredda e con la citazione dell'appunto del 4 settembre, e la Procura "se ne ricorda" (§5). | Lei lo riconosce e chiude la porta senza parlare della lettera: meno indizi, meno dolore. |
| C | **Il fermo di Lattanzi** (fascicolo §4) | **Resta.** È il Dispatch di mar 10 novembre nel batch 5. Ogni scala di Voss ferma al gradino 1 torna al gradino 0; il gradino 2 non torna indietro. Lattanzi viene scarcerato a fine gennaio, ed è il Dispatch di chiusura dei Finali in cui l'assassino resta ignoto. | Toglierlo: le scale non tornano mai indietro, e il Turno 5 perde il suo inciampo. |
| D | **Gli indizi di Aldo nelle Lettere di Voss** | **Un indizio nuovo per Lettera al massimo**, salvo le risposte a domande dirette: b1 il mestiere e "nessuno al mondo" · b2 la disdetta di giugno (la schiena) · b3 la disdetta del 3 settembre (il Verano) · b4 il nipote · b5 il *Rigoletto* a Caracalla · b6 l'"anniversario" · b7 l'invito per il 17, che arriva dopo i fatti (§3.2). La frase dell'anniversario **non dipende dalla fiducia**: è l'unica data che viene da Voss. La frase del barista, "dopo le feste non ci sarò più", **si toglie**, perché arriverebbe comunque dopo il 17. | Il *Rigoletto* nel b3 e il 3 settembre nel b5: la coppia con Adelaide si forma prima, ma lo schema dei giovedì si vede dopo. |
| E | **La fiducia in numeri** | Una scala da 0 a 10 che **parte da 2**. **+1** se Lombardo risponde a una domanda personale di Voss o racconta qualcosa di sé; **+1** se prende sul serio la sua paura; al massimo +2 per Turno. **−3 e un Turno freddo** se lo accusa prima della confessione. **−1** al secondo Turno di fila senza Lettere a Voss. **Media = 4, alta = 7** (§4.1). | Solo tre stati (freddo, tiepido, caldo): più semplice da leggere, ma il Giocatore non sente la differenza tra una Lettera calda e due. |
| F | **Le scale del dubbio in soglie** | Le soglie sono in §4.3: che cosa serve per ogni gradino e da quale batch si può salire. Il gradino 2 non torna mai indietro. | — |
| G | **Come si salva Voss** | **Quattro strade**, verificate in quest'ordine (§7): una perquisizione prima del 17 (Lettera alla Procura entro il Turno 6); un appostamento con la data (entro il Turno 7); Voss convinto che sia Aldo (scala dell'assassino al gradino 2), che il 17 chiama Palumbo; Voss convinto di essere il quarto e che sa la data, e quindi dorme da Mario. | Solo le prime due: salva Voss solo chi scrive agli uffici, e Voss resta passivo fino alla fine. |
| H | **Sei Finali, non cinque** | Ai cinque di [#12](https://github.com/Imbustai/imbustai-app/issues/12) si aggiunge **"Voss salvo, assassino noto ma fuggito"**, perché la meccanica lo produce: Voss si salva da solo, e Aldo parte il 18 con il nome già in mano alla Procura (§8). | Far confluire quel caso in "salvo, ignoto": più semplice, ma il Giocatore che ha trovato il nome non lo vede riconosciuto. |
| I | **Aldo brucia le carte il pomeriggio del 17 [PK nuovo]** | Prima di andare agli scacchi Aldo brucia nella stufa la lettera della maestra e la risposta della Procura del 1985. **La lettera della maestra (P5) si trova solo con una perquisizione prima del 17.** Se uccide Voss, la chiave finisce nel Tevere prima del treno. | Le carte restano nella stanza: ogni arresto porta a P5, e il verdetto diventa uguale in tutti i Finali "preso". |
| J | **Il verdetto** | Il punteggio **non decide se Aldo esce, ma quanta verità dice il dispositivo** (§9). Le soglie del fascicolo restano (≥ 10 / 6–9 / < 6), ma valgono solo per i tre omicidi del 1987. Quando Aldo è preso il 17 o dopo, l'omicidio o il tentato omicidio di Voss è sempre provato. **La lampadina svitata** vale 0 punti: porta la premeditazione nel capo d'imputazione Ferri. **L'uomo col cappello** entra in P9 senza punti in più. | L'assoluzione piena del fascicolo (< 6, "Aldo esce"): con la regola I, però, non si raggiunge mai. |
| K | **Il vino nei Finali** | Lo showpiece arriva **solo se Voss è vivo e l'assassino è noto** (Finali 5 e 6), con una variante per "fuggito". In "salvo, ignoto" la bottiglia resta chiusa: «questa storia non è chiusa, ha solo smesso di succedere». Nei Finali in cui Voss muore la bottiglia compare nel verbale, aperta, con due bicchieri e uno pieno, come le due tazzine della maestra. Nessuna metafora. | Lo showpiece in ogni Finale in cui Voss è vivo, anche "ignoto". |
| L | **La confessione dopo il 17** | Se Voss è vivo, l'assassino è noto e lo strato 4 non è mai arrivato, **Voss confessa nella Lettera dopo il 17**: la verità verrà fuori comunque, e preferisce che Lombardo la sappia da lui. Nel Finale "salvo, ignoto" tace. | Voss confessa solo a Lombardo nel corso del gioco, mai dopo. |
| M | **Niente telegrammi (Paolo)** | Nessun Personaggio telegrafa, mai. L'esito del 17 arriva al Giocatore **solo se è pubblico**, con un ritaglio di giornale nel batch 7: la morte di Voss (Finali 1–3) o l'arresto di Aldo (Finale 6). Nei Finali 4 e 5 il 17 non succede niente che finisca sui giornali, e il Giocatore scrive il Turno 8 **senza sapere se Voss è vivo**. Glielo dice la Lettera di Voss nel batch 8. | — |
| N | **La data dell'Epilogo** | Con l'istruzione sommaria (Aldo confessa, oppure è preso in flagranza; scheda §7.5) il dispositivo è di **ven 18 marzo 1988**. Con l'istruzione formale è di **ven 12 maggio 1989**, sempre prima del codice nuovo. La data stessa dice al Giocatore quanto ha aiutato. | Sempre marzo 1988. |
| O | **Il Turno 8 e il PM** | Il Giocatore decide con la sua ultima Lettera se dire al PM ciò che Voss gli ha confessato. La Lettera del PM ne tiene conto (§10.7). Il PM **non nomina mai il Questore**: scrive una riga sulle "circostanze" in cui Lombardo ha lasciato Roma e chiede che la lettera entri nel suo fascicolo personale. Sull'appunto archiviato dalla Mobile scrive una riga asciutta. | Il PM tace su tutto quello che non riguarda il processo. |

---

## 1. Il calendario dei Turni

### 1.1 La regola

- **Turno N** = le Lettere del Giocatore datate D<sub>N</sub>, più tutto quello che nasce da loro o arriva nel frattempo (**batch N**). Il Giocatore legge il batch N quando scrive il Turno N+1.
- Una Lettera dall'isola arriva a Roma in **7 giorni**, e ne impiega altri 7 per tornare (fascicolo §7). Un Personaggio che risponde subito data la sua Lettera D<sub>N</sub> + 8–10.
- **Gli uffici:** tempo totale = 7 + tempo dell'ufficio + 7. Con i Turni ogni 14 giorni:

| Tempo dell'ufficio | Una Lettera del Turno N ha risposta nel batch… |
|---|---|
| trasmissione per competenza (ufficio sbagliato) | N (lo stesso Turno) |
| 2 settimane (Stato Civile, Procura, Mobile) | N+1 |
| 3 settimane (Anagrafe, Regina Coeli, Scientifica, FS) | N+2 |
| 4 settimane (Archivio del Tribunale) | N+2 |

  Tre e quattro settimane costano lo stesso numero di Turni. La carta delle regole dice "2 o 3 turni", e torna.
- Una risposta entra nel primo batch che il Giocatore legge dopo il suo arrivo sull'isola.

### 1.2 La tabella

| Turno | Il Giocatore scrive | Arriva a Roma | Batch datato ≈ | Il Giocatore legge | Eventi fissi nel frattempo |
|---|---|---|---|---|---|
| 0 | — | — | sab 5 set (busta) | sab 12 set | gio 18 giu delitto 1 · gio 3 set delitto 2 · ven 4 appunto di Palumbo · sab 5 risposta della Mobile |
| 1 | lun 14 set | lun 21 set | mer 23 set | lun 28 set | — |
| 2 | lun 28 set | lun 5 ott | mar 6 ott | lun 12 ott | — |
| 3 | lun 12 ott | lun 19 ott | mar 20 ott | lun 26 ott | **gio 22 ott delitto 3**, dopo il batch 3 e prima che il Giocatore lo legga · ven 23 Dispatch "la trinità è completa" |
| 4 | lun 26 ott | lun 2 nov | mer 4 nov | lun 9 nov | ven 30 ott arriva la bottiglia |
| 5 | lun 9 nov | lun 16 nov | mar 17 nov | lun 23 nov | **mar 10 nov fermo di Lattanzi** (Dispatch) |
| 6 | lun 23 nov | lun 30 nov | mar 1 dic | lun 7 dic | gio 26 nov la frase dell'"anniversario"; Adelaide si apposta |
| 7 | lun 7 dic | lun 14 dic | mar 15 dic | lun 21 dic | gio 10 dic Aldo chiede la bottiglia · **gio 17 dic** · ven 18 il treno di Aldo · ritaglio del 19, se l'esito è pubblico |
| 8 | lun 21 dic | lun 28 dic | sab 26 – mar 29 dic, poi l'Epilogo | fine | gio 24 dic il *Panorama* arriva ad Adelaide per prima · Epilogo: marzo 1988 o maggio 1989 |

**Scadenze che il Giocatore non vede, ma l'Engine sì:**
- **Turno 6:** l'ultima Lettera alla Procura che può portare a una perquisizione prima del 17 (arriva il 30 novembre, e la Procura ha bisogno di almeno una settimana). È anche l'ultimo Turno utile per dedurre l'Operazione Panorama.
- **Turno 7:** l'ultima Lettera che arriva a Roma prima del 17 (il 14 dicembre). Può ancora portare a un appostamento, e può ancora spostare Voss di un gradino.
- **Turno 8:** non salva più nessuno. Decide solo se l'assassino resta ignoto o viene nominato (§8).

---

## 2. Turno per Turno: che cosa può succedere

Ogni riga dice che cosa porta il batch **al più tardi**. Una domanda diretta del Giocatore anticipa sempre la risposta: le finestre valgono per ciò che il Personaggio dice di sua iniziativa.

| Batch | Voss | Adelaide | Uffici (le risposte più rapide possibili) | Dispatch |
|---|---|---|---|---|
| **1** (23 set) | Risponde e racconta. **Strato 1** se il Giocatore chiede del 1977. **Aldo:** l'ex capotreno, vedovo, "nessuno al mondo" (K2). **Se gli è stato chiesto**, va dalla Benvenuti (§5.1). Se il Giocatore non ha scritto a nessun ufficio, gli ricorda la porta del fascicolo del processo. | — | Nessuna, salvo le trasmissioni per competenza. | — |
| **2** (6 ott) | La schiena, con la **disdetta di giugno** (K3; dossier §7.1). Porta: i verbali di sopralluogo alla Procura. | **Prima Lettera** (Adelaide §7.1): la vanteria di Ferri, il fischio senza titolo, Armando al buio, I1, I2. | Stato Civile, Procura e Mobile rispondono alle Lettere del Turno 1 (la Mobile come in §10.1). | — |
| **3** (20 ott) | **La disdetta del 3 settembre**, "al Verano, da sua moglie" (K4). La paura per la Benvenuti: è l'ultima Lettera in cui lei è viva. | I3, I4. Se le è stato chiesto: l'aria, l'uomo col cappello. **Del delitto 3 non sa ancora niente.** | Anagrafe, Regina Coeli, FS e Archivio rispondono al Turno 1; i tempi di 2 settimane al Turno 2. | **ven 23 ott**: il delitto 3, "la trinità è completa" (lo si legge insieme al batch 3). |
| **4** (4 nov) | Dossier §7.2: la maestra, "erano tre, è finita" (**scala del bersaglio al gradino 0**), Pierangeli, la bottiglia, **il nipote** (K5). Porta: il registro dei colloqui di Regina Coeli. **Strato 3** possibile. | **Il sollievo**: «allora è finita, e al palazzo non torna» (spostato qui dal suo vecchio "Turno 4"). I5, I6, I7. **L'aria**, se non l'ha ancora nominata: la radio della Iole. | — | — |
| **5** (17 nov) | Il sollievo per Lattanzi, e le scale ferme al gradino 1 tornano a 0. **Il *Rigoletto* a Caracalla** (K6). Le riprese (§3.3). **Strato 4** possibile per la prima volta. Porta: l'Anagrafe. | «L'hanno preso, adesso si dorme.» I8, il pezzetto di calendario. | — | **mar 10 nov**: il fermo di Lattanzi. |
| **6** (1 dic) | **"A dicembre ho un anniversario, poi forse parto"** (K7; dossier §7.3). Strato 4 se la porta si apre; la schiena nella variante pesante se la fiducia è alta. | **Il reveal**: dedotto (Adelaide §4.1) o scoperto da lei il 26 novembre (§4.2), con il calendario come Allegato, Armando scagionato e la **lampadina svitata** in un P.S. | Una perquisizione chiesta nel Turno 4 o 5 è già avvenuta: la Procura risponde. | — |
| **7** (15 dic) | Giovedì 10 **Aldo gli ha chiesto di aprire la bottiglia il 17**. Voss accetta o rifiuta secondo il suo stato (§7). Se muore, è la sua ultima Lettera (§10.6). | La Lettera calda dopo il reveal; il geranio di Ernesto se il reveal è arrivato presto. | La perquisizione del Turno 6 (7–9 dicembre) e i suoi risultati. **19 dic**: il ritaglio dell'esito, se è pubblico (§10.2). Nei Finali 4 e 5, nessuno. |
| **8** (26–29 dic) | **La Lettera dopo il 17**, se è vivo (§10.3–§10.5). | **Il congedo** (§10.8): il *Panorama* di giovedì 24 letto per prima, e il Finale visto dal palazzo. | La Procura risponde solo se il Turno 8 nomina Aldo (Finali 2 e 5). Le altre risposte in sospeso cadono. | Il Dispatch di chiusura, oppure l'**Epilogo** (Finali 3 e 6). |

---

## 3. Gli indizi: finestre e ripresa

### 3.1 La regola della ripresa ([#5](https://github.com/Imbustai/imbustai-app/issues/5))

Ogni indizio ha tre stati, che il reader stabilisce dalle Lettere del Giocatore dopo ogni batch:

- **ignorato:** il Giocatore non ne parla;
- **frainteso:** ne parla, ma lo usa per una pista sbagliata (Armando, Lattanzi, Colasanti come vendicatore, la setta);
- **capito:** supera il test della colonna "capito quando" (§3.2).

**Ignorato o frainteso → ripresa.** Il Personaggio ci torna **da un altro lato**: un'altra scena, un'altra fonte, un'altra parola. Non ripete mai la frase di prima e non segnala mai l'indizio come indizio. Ha sempre un ponte (dossier §4, regola 9). Al massimo **due riprese** per indizio, e mai oltre la sua ultima finestra. Un indizio frainteso ha in più una risposta vera che smonta la pista sbagliata: Voss dissente, e dice il perché; Adelaide difende Armando "a metà". **Nessuna pista sbagliata è un vicolo cieco:** porta sempre un fatto in più (Adelaide §3.3, §5.2).

**Capito → avanza.** Il Personaggio smette di riproporlo e ci risponde nel merito, e l'Engine registra quello che l'indizio sblocca (ultima colonna). Non si sblocca mai un Finale: si sblocca un argomento, una porta o una prova.

### 3.2 La tabella degli indizi

| K | Indizio | Chi | Prima volta | Ripresa (se ignorato o frainteso) | Capito quando il Giocatore… | Che cosa sblocca |
|---|---|---|---|---|---|---|
| K1 | "La famiglia è tutta morta" (vero sulla carta sbagliata) | Voss, Mobile | busta | b2 Voss: Rosa che grida da sola nel corridoio · b4 il registro dei colloqui ("chi andava a trovare Luca") · b5 la porta dell'Anagrafe | chiede se Rosa si era risposata, chi viveva con Luca, oppure chiede atti di famiglia a un ufficio | La scala dell'assassino può salire al gradino 1 (§4.3) |
| K2 | Aldo ex capotreno, vedovo, "nessuno al mondo" | Voss | b1 | a richiesta | collega "capotreno" al Ferrante Aldo di un atto (P3, l'attestazione dell'Anagrafe) | Il legame di P3 con l'Aldo degli scacchi; la metà di K5 |
| K3 | Disdetta di giovedì 18 giugno: "la schiena" | Voss | b2 | b4, accanto al nipote: "è la seconda volta che mi dà buca per un motivo di famiglia" | nota che le disdette cadono nelle sere dei delitti | Voss elenca le tre date quando gli vengono chieste: **P8** |
| K4 | Disdetta di giovedì 3 settembre: "al Verano, da sua moglie" | Voss | b3 (b1 se gli chiedono dov'era quella sera) | b5 | come K3 | come K3 |
| K5 | Disdetta di giovedì 22 ottobre: "il nipote" | Voss | b4 | b5 o b6: Natale, "Aldo lo passa da solo, non ha nessuno" | nota la contraddizione con K2 | Voss ammette che "un po' gli è rimasta in gola", ma non si sposta senza una prova |
| K6 | Il *Rigoletto* a Caracalla, "per la quarta volta" | Voss | b5 | solo a richiesta | collega l'aria di Adelaide ad Aldo | **P9** (se lo scrive alla Procura), prova valida per il gradino 2 dell'assassino |
| K7 | "A dicembre ho un anniversario, poi forse parto" | Voss | b6 | nessuna (non c'è più tempo) | lo lega al 17 dicembre, morte di Luca | La data: gradino 2 del bersaglio, appostamento |
| K8 | La vanteria di Ferri ("in mezzo a quattro") | Adelaide | b2 | b3, se le chiede di Ferri | chiede il fascicolo del processo o collega via Lanciani al 1977 | — (è un ponte, non una prova) |
| K9 | Un uomo che scende fischiettando un'opera | Adelaide | b2 (senza titolo) | il titolo se glielo chiedono, altrimenti nel b4 con la radio della Iole | chiede quale opera, o la lega ad Aldo | La metà di P9 |
| K10 | "Un uomo non giovane, cappotto e cappello"; "non era nessuno del palazzo" | Adelaide | a richiesta, oppure b3 come paura | b4 | lo usa contro il "vendicatore giovane" di Voss | Un argomento a sostegno del gradino 1 dell'assassino (non basta da solo) |
| K11 | La lampadina svitata | Adelaide | al reveal (b ≤ 6) | — | la passa alla Procura | La premeditazione nel capo Ferri (§9) |
| K12 | La data di morte di Luca, 17/12/1979 | Stato Civile, fascicolo, Voss (strato 2: il pugno "il giorno dopo", il 18/12/1979) | a richiesta | — | la scrive in una Lettera | Serve per dedurre il 17 dicembre |
| K13 | I delitti cadono di giovedì, le sere degli scacchi | le date nei Dispatch + la busta | busta | b4: "giovedì 22" nella Lettera di Voss | lo scrive | Con K3–K5: lo schema delle disdette |

### 3.3 Il filo di Aldo nelle Lettere di Voss

Un indizio nuovo per Lettera al massimo, sempre dentro una chiacchiera, sempre con un ponte (§0 D). Accanto, un ponte possibile: è solo un suggerimento per chi scrive.

| Batch | Indizio | Un ponte possibile |
|---|---|---|
| busta | Aldo esiste: un pensionato, gli scacchi del giovedì | (già scritto, busta §7.3) |
| b1 | Ex capotreno, vedovo, "nessuno al mondo" (K2) | La posta: quanto ci mette una lettera per le isole; Aldo, che ha fatto il capotreno per trent'anni, dice che la lettera di Lombardo ha fatto Roma–Reggio in cuccetta. |
| b2 | Giugno, "la schiena" (K3) | Il medico della mutua (dossier §7.1, già scritto). |
| b3 | 3 settembre, "al Verano, da sua moglie" (K4) | La sera del delitto 2: dov'era Voss. Era a casa da solo, perché Aldo gli aveva dato buca. |
| b4 | 22 ottobre, "il nipote" (K5) | Il bar, e Voss più solo del solito (dossier §7.2, già scritto). |
| b5 | Il *Rigoletto* a Caracalla, per la quarta volta (K6) | Una partita: Voss vince con un sacrificio, e Aldo lo chiama "un sacrificio da *Rigoletto*", poi gli racconta di nuovo Caracalla "mossa per mossa". Mai la parola "fischiare". |
| b6 | "A dicembre ho un anniversario, poi forse parto" (K7) | Lo scacco matto in trentuno mosse (dossier §7.3, già scritto). |
| b7 | Aldo chiede di aprire la bottiglia il 17 | La bottiglia sopra l'armadio, di cui Voss gli aveva parlato a novembre. Arriva dopo i fatti: è un indizio solo per chi rilegge. |

**Voss non guarda mai Aldo con sospetto di sua iniziativa [PK]** (dossier §2). Riferisce tutto questo come vita, e se il Giocatore gli fa notare una stranezza, la spiega con buon senso ("sarà il nipote della moglie"), finché una prova e un argomento non lo spostano (§4.3).

### 3.4 Adelaide, rinumerata

Con la convenzione di §0 A. Le finestre degli indizi I1–I9 restano quelle di Adelaide §3.2, con un Turno in meno:

| Batch (datata ≈) | Prima si chiamava | Che cosa cambia |
|---|---|---|
| 2 (5 ott) | "Turno 3" | niente |
| 3 (19 ott) | "Turno 4" | **niente sul delitto 3**, che non è ancora avvenuto. I3, I4; "non era nessuno del palazzo" come paura del delitto 2. |
| 4 (3 nov) | "Turno 5" | **qui arriva il sollievo**, "allora è finita". I5, I6, I7, e l'aria se non è ancora stata nominata. |
| 5 (17 nov) | "Turno 6" | niente (Lattanzi; I8) |
| 6 (27 nov – 1 dic) | "Turno 7" | niente: il reveal, dedotto o scoperto da lei |
| 7 (12 dic) | "Turno 8" | La Lettera calda. **Il Finale non ci può ancora essere**: una Lettera del 12 dicembre non sa del 17. |
| 8 (sab 26 dic) | (nuova) | **Il congedo**, con le varianti del Finale (Adelaide §6.1, aggiornate in §10.8). |

**La deduzione del Panorama come effetto dell'Engine** (Adelaide §3.3):
- il reader controlla ogni Lettera di Lombardo ad Adelaide dei Turni 2–6: dice che il *Panorama* **gira nel palazzo** (lo leggono a turno) oppure che **Armando lo prende e lo passa agli altri**? Se sì, `panorama.dedottoAlTurno = N`;
- il reveal arriva nel batch N (variante "me l'ha scritto un commissario");
- se dopo il Turno 6 non c'è nessuna deduzione, il reveal arriva nel batch 6 nella variante "l'ho visto io" (giovedì 26 novembre);
- un'accusa a un solo inquilino dà un indizio in più nel batch dopo, e non conta come deduzione.

---

## 4. Voss: fiducia, strati, scale

### 4.1 La fiducia

- **Scala 0–10. Parte da 2**: Voss ha già scelto Lombardo, ma non gli ha ancora dato niente.
- Il reader legge **ogni Lettera di Lombardo a Voss** e risponde a quattro domande:

| Domanda | Effetto |
|---|---|
| Risponde ad almeno una domanda personale di Voss, oppure racconta qualcosa di sé (l'isola, il Questore, la sua vita)? | **+1** |
| Prende sul serio la paura di Voss, senza liquidarla e senza deriderla? | **+1** |
| **Accusa** Voss di nascondere qualcosa, di mentire o di essere colpevole, prima dello strato 4? | **−3** e **un Turno freddo** |
| (Nessuna Lettera a Voss per il secondo Turno di fila) | **−1** |

- **Domandare non è accusare.** «Che cosa successe prima del 3 giugno?» è una domanda (anzi, la chiave dello strato 4). «Tu hai fatto qualcosa ai testimoni» è un'accusa. Dopo lo strato 4 le accuse non tolgono più niente: Voss è d'accordo.
- **Il Turno freddo:** la Lettera dopo è corta e formale, firmata "Voss". Risponde a ogni domanda (regola 2 delle risposte), ma non fa domande personali, non porta Texture, non concede uno strato e non sale di un gradino.
- **Media = 4. Alta = 7.**

Tre andamenti tipici:

| Giocatore | b1 | b2 | b3 | b4 | b5 | b6 | Confessione possibile |
|---|---|---|---|---|---|---|---|
| Caldo (+2 a Turno) | 4 | 6 | 8 | 10 | 10 | 10 | dal b5 |
| Normale (+1 a Turno) | 3 | 4 | 5 | 6 | 7 | 8 | dal b5 se la fiducia c'è; di solito b6 |
| Freddo (gli scrive solo per avere informazioni) | 2 | 2 | 2 | 2 | 2 | 2 | mai |
| Normale, con un'accusa nel Turno 2 | 3 | 1 (freddo) | 2 | 3 | 4 | 5 | mai |

### 4.2 Gli strati (dossier §5.2, con i numeri)

| Strato | Serve | Prima possibile |
|---|---|---|
| 0 | — | busta |
| 1 | una domanda sul 1977 (l'arresto, il processo, Rosa) | b1 |
| 2 | fiducia ≥ 4 **e** una domanda sulla sua carriera, sul grado, su perché ha tanta paura o su perché non torna alla Mobile. Dice il pugno a Taddei "la mattina dopo che Luca si era impiccato": è una fonte di K12. | b1 |
| 3 | fiducia ≥ 4, **dopo il delitto 3**, con lo strato 2 già detto | b4 |
| 4 | fiducia ≥ 7, **e** il Giocatore mette in dubbio le ricognizioni (chiede che cosa successe prima del 3 giugno, oppure cita la perizia del 1985), **e** lo strato 3 detto in un batch precedente | b5 |

**Uno strato per batch al massimo.** Se la porta dello strato 4 è aperta ma la fiducia non basta, Voss gira intorno allo strato 3 con altre parole ("non ancora, Giacomo").

### 4.3 Le scale del dubbio (dossier §6, con le soglie)

Regole comuni: **al massimo un gradino per scala per batch**, solo con un argomento (una ragione o un documento). A un'affermazione nuda Voss risponde "perché?" e resta dov'è. Nel Turno freddo non si sale. Gli eventi possono solo far scendere, e l'unico evento che lo fa è **Lattanzi** (b5): ogni scala al gradino 1 torna a 0. **Il gradino 2 non torna mai indietro.** Voss legge la Lettera del Turno 5 il 16 novembre, quando sa già del fermo: prima si applica Lattanzi, poi l'argomento del Giocatore, che può riportarlo subito al gradino 1.

| Scala | Dove parte | → Gradino 1 | → Gradino 2 |
|---|---|---|---|
| **Il bersaglio** | Prima del delitto 3 è spenta: Voss ha paura per la Benvenuti, non per sé («io davanti al giudice non c'ero»). **Si accende nel b4** al gradino 0: «erano tre, è finita». | L'argomento: l'assassino non conta i testimoni, conta chi ha mandato via Luca. **Dal b4.** | Pierangeli smontato (l'assassino conta chi era nella stanza, e questo richiede lo strato 4), **oppure** la data argomentata: i delitti cadono sulle date di Luca e di giovedì, e il 17 dicembre è un giovedì, la sera degli scacchi. **Dal b5.** |
| **L'assassino** | «Un giovane, un amico di Luca.» | Qualcuno nella casa di Rosa, argomentato con un fatto: l'atto di matrimonio, l'attestazione dell'Anagrafe, il registro dei colloqui, il certificato negli atti, oppure la lettera della maestra mai tornata indietro (§5.1). L'uomo col cappello (K10) aiuta, ma da solo non basta. **Dal b2.** | Una prova su Aldo (P1, P2, P3 o P9) **e** un argomento che la leghi all'Aldo degli scacchi. **Dal b4.** |
| **Luca** | «Era colpevole; quello che ho fatto io ha solo aiutato.» | La perizia del 1985, oppure il ragionamento sui tre "No" delle ricognizioni. **Dal b3.** | Coincide con lo strato 4. **Dal b5.** |

**Che cosa fa Voss in cima alle scale:**
- **Assassino al gradino 2:** ha paura e chiede a Lombardo che cosa fare. Da quel momento non resta mai solo con Aldo. Se Lombardo gli dice di parlarne con Palumbo, lo fa: alla Mobile non ci va, ma al suo dirigente sì. In ogni caso, se il 17 Aldo bussa, Voss chiama i colleghi (§7, strada 3).
- **Bersaglio al gradino 2, con la data:** il 17 non sale in casa con nessuno e dorme da Mario (§7, strada 4).
- **Bersaglio al gradino 2, senza la data:** sta attento agli sconosciuti, non ad Aldo. Nel b7 lo scrive: «non apro a nessuno, tranne ad Aldo».

### 4.4 Le porte (Voss spinge Lombardo a lavorare)

Quando il Giocatore, in un Turno, non scrive a nessun ufficio, la Lettera seguente di Voss indica **una porta** che il Giocatore non ha ancora aperto, in quest'ordine: il fascicolo del processo (busta) → i verbali di sopralluogo alla Procura (b2) → il registro dei colloqui di Regina Coeli (b4) → le schede di famiglia all'Anagrafe, che lui non può consultare (b5). Indica la porta, mai quello che c'è dietro (dossier §4, regola 10).

---

## 5. La Benvenuti al Turno 1

### 5.1 Se il Giocatore chiede a Voss di avvisarla

- Voss riceve la Lettera lunedì 21 settembre e ci va il pomeriggio dopo, uscito dall'ufficio. Il racconto arriva nel batch 1 (brano in §10.1 b).
- **Che cosa porta:**
  - **K1 da un lato nuovo**: una lettera spedita a una donna morta non è mai tornata indietro, quindi qualcuno l'ha ritirata in via dei Sabelli;
  - una crepa verso lo strato 4: lei chiede perdono «di aver guardato», e Voss sa che cosa vuol dire. Non lo spiega;
  - il presagio: «Se un giorno qualcuno di quella famiglia bussasse, io aprirei.»
- **Che cosa non cambia [PK]:** il 22 ottobre la Benvenuti apre al marito di Rosa, anche se nel frattempo Voss torna ad avvisarla. Qualunque indirizzo o atto il Giocatore chieda dopo il batch 1 arriva dopo il 22 ottobre (§1.1). Il verbale di sopralluogo avrà le due tazzine, e il Giocatore si ricorderà del caffè offerto a Voss.
- **Se il Giocatore non glielo chiede:** Voss passa sotto casa sua due volte e non suona (dossier §7.1).

### 5.2 Se il Giocatore scrive alla Mobile o alla Procura

- **Mobile:** risponde nel batch 2, fredda, citando l'appunto del 4 settembre e la "sensibilizzazione" (testo in §10.1 a). Non è mai la strada giusta, ma non è una strada chiusa (fascicolo §7).
- **Procura:** risponde nel batch 2 in due righe: la segnalazione "è stata acquisita agli atti". Dopo il delitto 3 **se ne ricorda**, e l'Engine registra `benvenutiSegnalataAllaProcura`:
  - la prima risposta della Procura dopo il 22 ottobre lo dice (§10.1 c);
  - **per una perquisizione alla Procura basta una prova, invece di due** (fascicolo §7);
  - il PM lo cita nell'Epilogo.
- Una Lettera alla Garbatella, al commissariato di zona, viene trasmessa per competenza alla Mobile nello stesso Turno.

---

## 6. Tre Giocatori tipo (per le Run)

Tre stili di gioco, e dove li portano le regole di questo documento. Servono alle Run con i personaggi-giocatore ([#14](https://github.com/Imbustai/imbustai-app/issues/14)) come controllo: se uno di questi finisce altrove, una regola è sbagliata.

| Giocatore | Come gioca | Che cosa ottiene | Finale probabile |
|---|---|---|---|
| **L'archivista** | Dal Turno 1 scrive agli uffici (Stato Civile, Archivio, Procura). A Voss scrive poco, e solo per chiedere. | La data di morte di Luca e la nota del 1985 (P4) nel b2; il fascicolo del processo nel b3 (P3). L'Anagrafe, chiesta nel Turno 3 con i nomi delle vittime, risponde nel b5 (P1). Una Lettera alla Procura nel Turno 6, con P1, P3 e P4. La fiducia resta bassa, e lo strato 4 non arriva. | **6 (A)**. Voss confessa solo nella Lettera dopo il 17 (§0 L). |
| **L'amico** | Scrive soprattutto a Voss, racconta di sé, gli chiede del 1977. Agli uffici scrive quando Voss gli indica una porta. | Fiducia alta dal b3, confessione nel b5 o nel b6, bersaglio al gradino 2 nel b6. Legge l'"anniversario" nel b6, e nel Turno 7 dice a Voss la data. | **4**, oppure **5** se nel Turno 7 o nell'8 scrive il nome di Aldo alla Procura. |
| **Il distratto** | Una Lettera per Turno. Segue la setta, poi Armando, poi Lattanzi. | Le porte di Voss, gli indizi ripresi due volte, il reveal di Adelaide che arriva comunque. Nessuna scala oltre il gradino 1. | **1**. Oppure **2**, se l'ultima Lettera di Voss (§10.6) gli fa capire tutto e nel Turno 8 scrive alla Procura. |

---

## 7. Il 17 dicembre: come si decide

Dopo il batch 7, l'Engine valuta **in quest'ordine** e si ferma alla prima condizione vera:

```
1. PERQUISIZIONE          una Lettera alla Procura (o alla Mobile, che la trasmette) arrivata entro il 10/12
                          (Turno ≤ 6) che nomina Aldo Ferrante (o lo rende trovabile) e cita almeno 2 prove
                          della §9 già in mano al Giocatore (1 prova se benvenutiSegnalataAllaProcura)
                          → perquisizione in via Carini tra il 7 e il 9/12, Aldo arrestato      → Finale 6 (A)

2. APPOSTAMENTO           una Lettera alla Procura o alla Mobile arrivata entro il 14/12 (Turno ≤ 7) con
                          la data (il 17/12, o "il giovedì dell'anniversario") + Voss come bersaglio
                          + almeno un fatto a sostegno (una prova, o il ragionamento sul calendario)
                          → due agenti sulle scale, Aldo preso in flagranza                    → Finale 6 (B)

3. VOSS SA CHE È ALDO     la scala dell'assassino è al gradino 2 dopo il batch 7
                          → il 17 Voss chiama Palumbo, Aldo preso sul pianerottolo            → Finale 6 (B)

4. VOSS SI NASCONDE       la scala del bersaglio è al gradino 2 e Voss sa la data (con un perché),
                          da una Lettera arrivata entro il 14/12
                          → dorme da Mario; Aldo parte il 18
                          → Finale 5 se Aldo è nominato alla Procura o alla Mobile entro il Turno 8
                            (o se il Turno 8 porta Voss al gradino 2 dell'assassino), altrimenti Finale 4

5. ALTRIMENTI             Voss sale con Aldo e muore
                          → Finale 3 se Aldo è nominato alla Procura o alla Mobile in una Lettera
                            arrivata entro il 17/12 (Turno ≤ 7): fermato il 18, prima del treno
                          → Finale 2 se è nominato solo nel Turno 8
                          → Finale 1 se non è nominato mai
```

**"Nominato"** vuol dire che una Lettera di Lombardo a un'autorità permette di trovarlo: nome e cognome, oppure "l'Aldo che gioca a scacchi con l'agente Voss il giovedì al bar di via Fratelli Bonnet". Dirlo solo a Voss non basta, salvo quando porta Voss al gradino 2 (strade 3 e 4).

---

## 8. I sei Finali

| # | Finale | Che cosa sa il Giocatore il 21 dicembre | Batch 8 | Epilogo |
|---|---|---|---|---|
| **1** | Voss morto, assassino ignoto | Ritaglio: «il quarto lumino» | L'ultima Lettera di Voss c'è già stata (b7). Congedo di Adelaide (variante 1). | Nessuno. Dispatch di chiusura: Lattanzi scarcerato, **«la setta resta senza volto»** (quattro delitti). |
| **2** | Voss morto, assassino noto ma fuggito | Lo stesso ritaglio | Congedo di Adelaide (variante 2). La Procura risponde al Turno 8: mandato di cattura; Aldo si è imbarcato a Brindisi per Patrasso il 19. | Nessun processo. |
| **3** | Voss morto, assassino preso | Ritaglio, poi un secondo: «fermato a Termini un ex capotreno» | Congedo di Adelaide (variante 3). | **Il PM** con il dispositivo: marzo 1988 se Aldo confessa, maggio 1989 se tace. Il verdetto sui tre omicidi del 1987 dipende dal punteggio (§9). |
| **4** | Voss salvo, assassino ignoto | Niente: nessun ritaglio, nessuna notizia. Scrive il Turno 8 senza sapere se Voss è vivo. | **La Lettera di Voss dopo il 17** (§10.5): bottiglia chiusa, Aldo partito "per il suo anniversario". Congedo di Adelaide (variante 4). | Nessuno. Dispatch di chiusura: Lattanzi scarcerato (tre delitti). |
| **5** | Voss salvo, assassino noto ma fuggito | Niente, come nel 4. | **La Lettera di Voss** (§10.4): la stanza vuota, la stufa piena di cenere, lo showpiece nella variante "Grecia", la confessione se non c'è ancora stata. Congedo (variante 5). | Nessun processo. La Procura risponde al Turno 8, se il Turno 8 le ha scritto. |
| **6** | Voss salvo, assassino preso | (A) ritaglio del 10 dicembre sulla perquisizione, più la risposta della Procura · (B) ritaglio del 19: «preso l'uomo dei lumini» | **La Lettera di Voss** (§10.3): il pianerottolo o la perquisizione, il Verano, lo showpiece, la confessione se non c'è ancora stata. Congedo (variante 6, testo intero). | **Il PM** con il dispositivo, marzo 1988 (§10.7). Sempre ergastolo per tutti e tre. |

**Il batch 8 è la chiusura**, e si rivede come ogni altro batch (contratto dell'Engine, [#20](https://github.com/Imbustai/imbustai-app/issues/20)). Le Lettere del Giocatore del Turno 8 contano per tre cose sole: la Lettera di Voss, se è vivo, risponde a quello che il Giocatore gli ha scritto; il nome di Aldo può arrivare alla Procura (Finali 2 e 5); e il PM può sapere o non sapere della confessione di Voss (§0 O).

---

## 9. Le prove e il verdetto

### 9.1 La tabella (fascicolo §8, aggiornata)

| # | Prova | Peso | Lega Aldo a… | Note |
|---|---|---|---|---|
| P1 | Registro delle richieste all'Anagrafe con il documento di Ferrante | 3 | tutti | |
| P2 | Residenza a 150 m da Voss | 1 | — | |
| P3 | Aldo patrigno di Luca | 2 | — (movente) | Vale anche **l'atto di matrimonio Ferrante–Pace** dello Stato Civile [?]. |
| P4 | Istanza del 1985 e diniego | 1 | — (movente) | |
| P5 | Lettera della maestra | 2 | Benvenuti | **Solo con la perquisizione prima del 17** (§0 I). |
| P6 | Chiave quadra, sangue A e B | 3 | Cortesi, Benvenuti | Nel Finale 3 non c'è: la chiave è nel Tevere. |
| P7 | Impronta sul lumino (12 punti) | 1 | Ferri | Dopo ogni arresto il confronto è automatico: Aldo ormai ha un cartellino. |
| P8 | Voss: le tre disdette e il nipote | 2 (1 se Voss è morto) | — | Conta se il Giocatore l'ha riferito a un'autorità. |
| P9 | L'aria sulle scale, l'uomo col cappello, il *Rigoletto* di Aldo | 1 | Ferri | Servono le due metà, e il Giocatore deve averle unite in una Lettera a un'autorità. |
| P10 | Flagranza del 17 (chiave e quattro lumini in tasca) | 4 | Voss (tentato) | |
| P11 | Confessione | 3 | tutti | Aldo confessa se è arrestato **e** chi lo interroga sa di Luca: P3, oppure una Lettera di Lombardo che lega i delitti al processo Moretti, oppure P5 trovata nella perquisizione. |
| P12 | Il biglietto del treno del 18 | 1 | — | |
| — | **La lampadina svitata** | 0 | Ferri | Porta la premeditazione nel capo Ferri, e il PM la accredita, se il Giocatore l'ha passata alla Procura. |
| — | **La testimonianza di Mario** | 0 | Voss (omicidio) | Solo nel Finale 3: li ha visti salire insieme alle 23. Rende sempre provato l'omicidio di Voss. |

### 9.2 Che cosa si trova, secondo l'arresto

| Arresto | Si trova | P11 |
|---|---|---|
| **A**, perquisizione prima del 17 | P5, P6, P12, quattro lumini nuovi, P7 | Sì: P5 nomina Rosa Moretti, e da lì si arriva a Luca |
| **B**, flagranza del 17 | P10, P6 (la chiave è in tasca), P12, P7; nella stufa, cenere di carta | Se Luca è noto agli inquirenti |
| **C**, fermo del 18 dopo l'omicidio di Voss | P12, P7, la testimonianza di Mario; nella stufa, cenere di carta | Se Luca è noto agli inquirenti |

### 9.3 Il dispositivo

- **Voss:** con l'arresto B il tentato omicidio è sempre provato (P10); con l'arresto C l'omicidio è sempre provato (Mario, i quattro lumini).
- **I tre omicidi del 1987**, con il punteggio totale:
  - **≥ 10:** colpevole di tutti e tre;
  - **6–9:** colpevole solo di quelli che hanno una prova propria (colonna "lega Aldo a…"); assolto per insufficienza di prove dagli altri;
  - **< 6:** assolto da tutti e tre per insufficienza di prove.
- **Pena:** ergastolo in ogni caso, perché c'è sempre almeno un omicidio premeditato (con l'isolamento diurno se sono più d'uno) *[non verificato: art. 577 e 72 c.p.; la misura dell'isolamento]*.
- **Che cosa vuol dire, in pratica:**
  - nei Finali 6 (A e B) il punteggio supera sempre 10, perché per arrivarci servono già delle prove, e l'arresto ne aggiunge sei o più;
  - **il Finale 3 è quello in cui conta la carta del Giocatore.** Un nome fatto al buio porta a «colpevole dell'omicidio Voss, assolto dagli altri tre»: per i giornali, la trinità resta della setta. Con P1, P3 e la confessione, il dispositivo dice tutta la verità.
- **Il giudizio su Luca** (fascicolo §8): il PM scrive che la condanna è «quantomeno dubbia» solo se il Giocatore ha scoperto la perizia del 1985 o le ricognizioni.

---

## 10. I testi

### 10.1 Il Turno 1 e la Benvenuti

**a) La risposta della Mobile** (batch 2), a una Lettera del Turno 1 che chiede di proteggere la Benvenuti e segnala il legame con il processo.

> QUESTURA DI ROMA
> Squadra Mobile
>
> Roma, 5 ottobre 1987
>
> Al Commissario dott. Giacomo Lombardo
> Commissariato di P.S. di Lipari
>
> Oggetto: omicidi Cortesi e Ferri. Sua nota del 14 settembre 1987.
>
> In riferimento alla nota in oggetto, si comunica che l'ipotesi di un collegamento tra le vittime e il procedimento penale a carico di Moretti Luca (Corte d'Assise di Roma, 1978) è già stata valutata da questo Ufficio, a seguito dell'appunto del Commissariato di P.S. Monteverde del 4 settembre u.s.
>
> Gli accertamenti svolti hanno escluso che l'imputato, deceduto nel 1979, abbia congiunti in vita. Non sono pertanto emersi elementi che rendano attuale tale ipotesi, e le indagini proseguono nella direzione già nota.
>
> Quanto alla sig.ra Clara Benvenuti, si precisa che la stessa è stata debitamente sensibilizzata dal Commissariato di zona in data 7 settembre u.s.
>
> Si ricorda infine che le richieste di atti relativi al procedimento in corso vanno indirizzate alla Procura della Repubblica presso il Tribunale di Roma, titolare delle indagini. Si confida che la S.V. vorrà tenerne conto.
>
> p. IL DIRIGENTE DELLA SQUADRA MOBILE
> (dott. R. Rinaldi)

*Che cosa fa:* dice «la famiglia è tutta morta» nella lingua di un ufficio ("congiunti in vita"). Cita l'appunto del 4 settembre, rimanda alla Procura e chiude con una riga più fredda del necessario: conoscono il nome di Lombardo (busta §5). Circa 170 parole.

**b) Voss dalla maestra** (batch 1, brano della sua Lettera di mercoledì 23 settembre), se il Giocatore gli ha chiesto di avvisarla.

> Ieri pomeriggio, appena uscito dall'ufficio, sono andato dalla maestra, come mi chiedevi. Ho suonato alle sei, perché a quell'ora una donna sola apre più volentieri che alle dieci di sera. Ha aperto con la catenella. Le ho detto chi ero e le ho fatto vedere il tesserino. Lei ha guardato il tesserino, poi ha guardato me, e ha tolto la catenella. «Io mi ricordo di lei», mi ha detto. Non le ho chiesto da dove. Mi ha fatto entrare in cucina e mi ha offerto un caffè, e io ho detto di sì perché non sapevo come dire di no.
>
> Le ho spiegato quello che potevo: due testimoni di quel processo sono morti, e lei deve stare attenta. Mi ha lasciato finire. Poi mi ha detto che la polizia era già passata e che lei agli sconosciuti non apre. E poi, guardando la tazzina e non me, mi ha detto una cosa che non mi aspettavo. L'anno scorso, il giorno dei morti, ha scritto alla madre di Luca per chiederle perdono. Le ho chiesto: «Perdono di che cosa?» E lei: «Di aver guardato.» Quando le ho detto che Rosa è morta da un paio d'anni, è diventata bianca. «Ma la lettera non mi è mai tornata indietro», ha detto.
>
> Sulla porta, mentre me ne andavo, ha aggiunto: «Se un giorno qualcuno di quella famiglia bussasse, io aprirei. Lo capisce, vero?» Le ho detto di sì. Non l'ho capito, Giacomo. O forse l'ho capito troppo bene.

*Che cosa fa:* K1 da un lato nuovo (una lettera per una morta che nessuno rimanda indietro); il caffè, che tornerà nelle due tazzine; una crepa che Voss non spiega («di aver guardato»); il presagio. Voss non mente: riferisce, e tace. Circa 280 parole.

**c) La Procura dopo il delitto 3** (prima riga della sua prima risposta dopo il 22 ottobre), se il Giocatore l'aveva avvisata.

> La Sua nota del 14 settembre, che questo Ufficio si era limitato ad acquisire agli atti, si è purtroppo rivelata fondata. Ne terrò conto.

### 10.2 I Dispatch dell'esito e della chiusura

**Voss morto (Finali 1, 2, 3)**, ritaglio del *Messaggero*, sabato 19 dicembre 1987:

> **MONTEVERDE, UCCISO IN CASA UN AGENTE DI POLIZIA**
> **Accanto al corpo quattro lumini: la «trinità» non era completa**
>
> Florian Voss, 33 anni, in servizio al commissariato di Monteverde, è stato trovato morto ieri mattina nel suo appartamento di via Fratelli Bonnet. Sul tavolo della cucina c'erano una bottiglia di vino aperta e due bicchieri, uno dei quali ancora pieno. Accanto al corpo, quattro lumini rossi: tre disposti a triangolo, il quarto al centro. Il gestore del bar sotto casa ha riferito che l'agente, come ogni giovedì, aveva passato la serata a giocare a scacchi. Gli inquirenti non escludono un collegamento con i tre delitti della cosiddetta setta della trinità, per i quali la Squadra Mobile aveva fermato a novembre Enzo Lattanzi.

**Finale 3**, secondo ritaglio, lunedì 21 dicembre 1987:

> **TERMINI, FERMATO UN EX CAPOTRENO: «È L'UOMO DEI LUMINI»**
> Aveva in tasca un biglietto per il notturno di Brindisi. Gli inquirenti: «Nessun legame con le sette».

**Finale 6 (B)**, ritaglio del *Messaggero*, sabato 19 dicembre 1987:

> **MONTEVERDE, PRESO SULLE SCALE L'UOMO DEI LUMINI**
> **Aveva in tasca quattro candele rosse. L'agente che doveva essere la quarta vittima è illeso**
>
> Giovedì sera, poco dopo le undici, due agenti in borghese hanno arrestato sulle scale di un palazzo di via Fratelli Bonnet un pensionato di 61 anni, ex capotreno delle Ferrovie dello Stato. L'uomo stava salendo nell'appartamento di un agente del commissariato di Monteverde, con cui da mesi giocava a scacchi. Addosso gli sono stati trovati un pesante attrezzo di ferro e quattro lumini rossi, identici a quelli lasciati accanto alle tre vittime della cosiddetta setta della trinità. Gli inquirenti mantengono il massimo riserbo.

**Finale 6 (A)**, ritaglio del *Messaggero*, giovedì 10 dicembre 1987 (letto con il batch 7, insieme alla risposta della Procura):

> **DELITTI DELLA TRINITÀ, ARRESTATO UN EX CAPOTRENO**
> Nella sua stanza a Monteverde la polizia ha trovato una chiave di ferro e quattro lumini nuovi. «Nessun legame con le sette», dicono in Procura.

**Finali 4 e 5:** nessun ritaglio. Il 17 dicembre, per i giornali, non è successo niente.

**Chiusura dei Finali 1 e 4**, ritaglio di *Paese Sera*, venerdì 29 gennaio 1988:

> **SCARCERATO LATTANZI. LA SETTA DELLA TRINITÀ RESTA SENZA VOLTO**
> Cadono i sospetti sui delitti della trinità. In carcere era rimasto solo per la droga.

**Chiusura dei Finali 2 e 5**, dalla risposta della Procura al Turno 8 (lunedì 11 gennaio 1988):

> … è stato emesso mandato di cattura nei confronti di Ferrante Aldo. Dagli accertamenti risulta che il medesimo si è imbarcato a Brindisi il 19 dicembre u.s. sul traghetto per Patrasso. È stata avviata la procedura per l'estradizione *[non verificato: i tempi e la formula]*.

### 10.3 Voss dopo il 17: salvo, Aldo preso (Finale 6 B)

> Roma, martedì 29 dicembre 1987
>
> Caro Giacomo,
>
> la tua lettera è arrivata ieri, e l'ho aperta in piedi nell'ingresso, come quelle di settembre. Solo che stavolta non avevo paura di quello che c'era dentro. Mi chiedi come sto. Sto come uno che ha dormito dodici ore di fila per la prima volta da giugno e si è svegliato con l'impressione di aver lasciato qualcosa sul fuoco. Il medico direbbe che è la schiena. Io credo che sia tutto il resto.
>
> Ti racconto giovedì con ordine, perché finora l'ho raccontato solo a verbale, e a verbale le cose sembrano successe a un altro.
>
> Alle nove sono sceso al bar, come ogni giovedì. I due in borghese erano già sulle scale, uno al primo piano e uno sul pianerottolo sopra il mio. Me li aveva presentati Palumbo nel pomeriggio, e il più giovane mi aveva chiesto se il vino era buono, perché ormai del vino lo sapevano tutti. Abbiamo giocato fino alle undici. Ho perso tutte e due le partite, e stavolta credo di averlo fatto apposta io. Poi Aldo ha rimesso i pezzi nella scatola e mi ha detto: «L'ultima la giochiamo da te, con quel vino tuo.» Gli ho detto di sì. È stata la parola più difficile che abbia detto in vita mia, e quest'anno ne ho dette di difficili, anche a te.
>
> Siamo saliti, io davanti e lui dietro. Sentivo il suo passo sulle scale, quel passo senza fretta che conosco da nove mesi. Sul pianerottolo del secondo piano, mentre cercavo le chiavi, si è fermato e ha messo la mano nella tasca del cappotto. In quel momento i due sono scesi. Non ha fatto resistenza e non ha detto niente. Non ha nemmeno tolto la mano dalla tasca, finché non gliel'hanno tolta loro: stringeva una chiave di ferro lunga una spanna, a sezione quadrata. Nell'altra tasca aveva un sacchetto con quattro lumini rossi. Mentre lo portavano giù si è voltato una volta sola e mi ha detto: «Peccato per il vino.»
>
> Quella notte, in Questura, ha parlato fino all'alba. Me l'ha raccontato Palumbo, che c'era. Non hanno dovuto chiedergli quasi niente: gli hanno fatto il nome di Luca, e lui ha cominciato. Luca era il figlio di sua moglie, e lui lo aveva cresciuto da quando il ragazzo aveva undici anni. La mattina dell'arresto, lui era in servizio sul treno per Reggio Calabria. Ha detto che non ha niente da chiedere a nessuno, perché a Luca ha già dato quello che la legge non poteva dargli. Del quarto lumino ha detto soltanto: «Era per lui.» Per me, cioè.
>
> Venerdì mattina, invece di dormire, sono andato al Verano. Non c'ero mai stato. Luca e Rosa sono nella stessa tomba, vicino al muro che dà su via Tiburtina, e sulla lapide c'è una foto di Luca che non è quella segnaletica: è una foto da ragazzo, con la camicia bianca, e sorride. Al chiosco davanti al cancello ho comprato un lumino. Era rosso: la signora mi ha detto che di altri colori non ne tengono. L'ho acceso lo stesso. Non ho saputo che cosa dire, e allora non ho detto niente.
>
> Quella sera, a casa, sono rimasto a lungo a guardare l'armadio. Alla fine, la sera di Natale, l'ho aperta, la bottiglia di mia madre. L'ho aperta da solo, perché delle due persone con cui dovevo berla una è in una cella e l'altra è su un'isola. Il Traminer aromatico è un vino che ti imbroglia. Al naso ti promette rose e miele, e ti aspetti una cosa dolce, da signora; in bocca invece è secco, quasi amaro, e ti resta addosso. Mio padre diceva che è il vino più onesto che ci sia, perché prima ti racconta una bugia e poi te la confessa. L'ho bevuto pensando a te, e anche a me, e a quanti anni ci ho messo io per arrivare alla seconda parte.
>
> A marzo, al processo, il dottor Anselmi mi sentirà come testimone. Gli racconterò anche della stanza e della foto: gliel'ho già scritto, e Palumbo dice che sono stato un idiota a farlo prima di parlare con un avvocato. Probabilmente ha ragione. Ma per dieci anni ho aspettato il momento giusto, e ho visto dove porta.
>
> Adesso tocca a te. Che cosa farai, lì? Ti lasceranno tornare? E se non ti lasciano, posso venire io, a primavera? Di isole non so niente, ma so guidare, e porto una bottiglia. Una qualunque, stavolta.
>
> Florian

**Varianti:**
- **Se lo strato 4 non è mai arrivato** (§0 L), prima del paragrafo del Verano:
  > Adesso però c'è una cosa che devi sapere da me, prima di leggerla negli atti, perché negli atti ci sarà. Aldo sapeva di me da una lettera che la maestra aveva scritto a Rosa l'anno scorso, e che ha aperto lui. Parlava di una guardia giovane, alta, biondiccia, con un cognome tedesco. Ero io. La sera dopo la rapina ho messo i tre testimoni nella stessa stanza e ho fatto vedere loro la foto segnaletica di Luca. Poi ho detto di non parlarne con nessuno. Davanti al giudice, tutti e tre hanno giurato di non aver visto fotografie. Non te l'ho scritto prima perché non ci riuscivo, e adesso non ho più la scusa di non riuscirci.

  E nell'ultimo paragrafo sul processo, «gliel'ho già scritto» diventa «glielo scriverò domani».
- **Se l'appostamento l'ha chiesto il Giocatore** (strada 2): «Me li aveva presentati Palumbo» diventa «Li aveva mandati la Mobile, dopo la tua lettera».
- **Finale 6 (A), perquisizione prima del 17:** niente scena sul pianerottolo. Aldo è in carcere dal 9 dicembre (la Lettera del 15 ne ha già parlato). Giovedì 17 Voss va al Verano **quel giorno stesso**, l'anniversario, con il lumino rosso. Aldo ha chiesto di vederlo, e lui non ci è andato. Lo showpiece e la chiusa restano uguali.

### 10.4 Voss dopo il 17: salvo, Aldo fuggito (Finale 5)

> Roma, martedì 29 dicembre 1987
>
> Caro Giacomo,
>
> la tua lettera è arrivata ieri, e dentro c'era la domanda a cui i giornali non potevano risponderti: sì, sono vivo. Scusami se hai dovuto aspettare fino a oggi per saperlo. Il resto te lo racconto adesso, anche se è la parte peggiore.
>
> Giovedì ho fatto come mi avevi scritto. Sono sceso al bar, ho giocato le mie due partite e poi ho dormito da Mario, sul divano del retro. Quando Aldo mi ha proposto l'ultima partita da me, «con quel vino tuo», gli ho detto che non era serata. Mi ha stretto la mano, cosa che non aveva mai fatto, e mi ha augurato buon Natale. Io non sapevo ancora niente. A quella mano ci ho pensato dopo, e ci penso ancora.
>
> Lunedì Palumbo mi ha chiamato in ufficio e ha chiuso la porta. La Procura aveva la tua lettera con il nome di Aldo. Quando sono andati a cercarlo in via Carini, la stanza era vuota: il letto rifatto, e la stufa piena di cenere di carta. Venerdì sera aveva preso il notturno per Brindisi, e sabato si è imbarcato per Patrasso. Adesso c'è un mandato di cattura, e dicono che in Grecia lo cercano. Io credo che lo cerchino come si cerca un ombrello dimenticato sul tram.
>
> Palumbo mi ha detto anche un'altra cosa, che tu forse sapevi già: Aldo era il patrigno di Luca. Aveva sposato Rosa nel '68. Nel '77 non l'ho mai visto, Giacomo, nemmeno una volta. Per me la famiglia di Luca era Rosa che gridava nel corridoio. Invece lui c'era, e da febbraio abitava a centocinquanta metri da casa mia, e il giovedì mi lasciava vincere.
>
> La notte di Santo Stefano l'ho aperta, la bottiglia di mia madre. L'ho aperta da solo, perché delle due persone con cui dovevo berla una è su un traghetto per la Grecia e l'altra è su un'isola. Il Traminer aromatico è un vino che ti imbroglia. Al naso ti promette rose e miele, e ti aspetti una cosa dolce, da signora; in bocca invece è secco, quasi amaro, e ti resta addosso. Mio padre diceva che è il vino più onesto che ci sia, perché prima ti racconta una bugia e poi te la confessa. L'ho bevuto pensando a te, e anche a me, e a quanti anni ci ho messo io per arrivare alla seconda parte.
>
> Palumbo dice che nessuno processa un uomo che non c'è, e che per i giornali la setta resterà la setta ancora per un po'. A me basta sapere chi era. O forse non mi basta affatto: te lo dirò fra qualche mese.
>
> E tu? Hai passato il Natale da solo? Scrivimi che cosa hai mangiato, e con chi, anche se era soltanto il pesce della mensa.
>
> Florian

**Varianti:**
- **Se lo strato 4 non è mai arrivato:** prima del paragrafo del vino entra la confessione di §10.3, con un altro attacco: «Adesso la Procura mi chiederà perché Aldo cercava proprio me, e voglio che tu lo sappia prima di loro.»
- **Se Aldo è stato nominato solo nel Turno 8:** Palumbo non ha ancora niente. È la Lettera di Lombardo a dire il nome, e Voss risponde a quella: «Domattina vado da Palumbo.» Il paragrafo della stanza vuota diventa un'ipotesi: «Mario dice che venerdì è partito.»

### 10.5 Voss dopo il 17: salvo, assassino ignoto (Finale 4)

> Roma, martedì 29 dicembre 1987
>
> Caro Giacomo,
>
> la tua lettera è arrivata ieri. Mi chiedi se sono ancora vivo, e lo sono. Scusami se hai dovuto aspettare fino a oggi per saperlo: di una cosa che non è successa i giornali non scrivono. Sto bene, anche se non so a chi lo devo. Ti scrivo dalla cucina, con la finestra aperta, e per adesso mi basta.
>
> Giovedì sono sceso al bar alle nove, come sempre, perché stare chiuso in casa mi sembrava peggio. A Mario avevo già detto che quella notte avrei dormito da lui, sul divano del retro, e lui non ha fatto domande: ha soltanto tirato fuori una coperta in più. Abbiamo giocato fino alle undici. Aldo era di buon umore, più del solito. Ha vinto la prima partita, poi mi ha lasciato vincere la seconda, e non ha nemmeno fatto finta di niente. Mentre rimetteva i pezzi nella scatola mi ha detto: «L'ultima la giochiamo da te, con quel vino tuo.» Gli ho risposto che non era serata, che la schiena mi faceva male e che dormivo da Mario. Mi ha guardato un momento più del necessario. Poi mi ha stretto la mano, cosa che in nove mesi non aveva mai fatto, e mi ha detto: «Allora buon Natale, Florian.» È uscito senza fretta, col cappello in testa, come esce sempre.
>
> Non è successo niente. Nessuno ha bussato alla mia porta, nessuno ha acceso lumini sul mio pianerottolo. La mattina dopo sono salito a casa e c'erano soltanto i gerani da annaffiare.
>
> Aldo, invece, non l'ho più visto. Mario dice che venerdì è passato a pagare il conto del mese ed è partito per quel suo anniversario. Giovedì prossimo giocherò da solo, o contro Mario, che il cavallo non lo sa ancora muovere. Pensa un po': mi manca. Mi manca l'uomo che mi batteva a scacchi e poi mi lasciava vincere per educazione.
>
> Della setta, qui, non parla più nessuno. Lattanzi è ancora dentro, e i giornali hanno altro da scrivere. Forse avevi ragione tu, e il diciassette era il giorno giusto. Forse avevo ragione io a novembre, quando ti scrivevo che era finita. Non lo sapremo, e dovrò imparare a vivere con questo.
>
> La bottiglia di mia madre è ancora sopra l'armadio. Avevo detto che l'avrei aperta quando questa storia fosse chiusa, e questa storia non è chiusa: ha solo smesso di succedere.
>
> E tu, a Natale, che cosa hai mangiato? Eri con qualcuno, o hai fatto come me, che ho mangiato lo Speck in piedi davanti alla finestra? Scrivimi. Adesso che non ho più paura, ho ancora voglia di leggerti.
>
> Florian

*Che cosa fa:* non spiega niente e non conclude niente. Ma dà al Giocatore, per l'ultima volta, tutto quello che serve: la stretta di mano, il cappello, l'"anniversario", la partenza. Chi capisce adesso può ancora nominare Aldo nel Turno 8, e il Finale diventa il 5. Se lo strato 4 c'è stato, «dovrò imparare a vivere con questo» vale anche per la stanza, e Voss non aggiunge altro.

### 10.6 L'ultima Lettera di Voss (Finali 1, 2, 3)

Non è una Lettera del Finale: è la sua Lettera del batch 7, scritta il 15 dicembre, che il Giocatore legge dopo il ritaglio del 19. Il brano sull'invito è fisso; il resto lo scrive lo stato del Turno.

> Giovedì scorso Aldo, mentre rimettevamo a posto i pezzi, mi ha chiesto della bottiglia. Gliene avevo parlato a novembre, e se n'è ricordato. Dice che il 17 per lui è un giorno speciale, e che un giorno speciale vuole un vino speciale. Gli ho detto di sì. Non era la sera che avevo in mente, ma forse, a trentatré anni, le sere speciali bisogna prenderle quando qualcuno te le offre. Sarai il primo a cui racconterò com'era.

### 10.7 L'Epilogo: la Lettera del PM e il dispositivo (Finale 6 B)

> PROCURA DELLA REPUBBLICA
> presso il Tribunale di Roma
>
> Roma, 21 marzo 1988
>
> Al Commissario dott. Giacomo Lombardo
> Commissariato di P.S. di Lipari
>
> Oggetto: proc. pen. n. 3172/87 R.G. a carico di Ferrante Aldo.
>
> Egregio dottore,
>
> venerdì 18 marzo la Corte d'Assise di Roma ha pronunciato la sentenza nel procedimento in oggetto. Le allego copia del dispositivo, così come è stato letto in udienza. La motivazione sarà depositata nei termini di legge, e gliela farò avere.
>
> Le scrivo anche per un'altra ragione. Nella requisitoria ho dovuto ricostruire come si è arrivati all'arresto dell'imputato, e ogni volta che risalivo a un atto trovavo, all'origine, una Sua lettera. La nota del 14 settembre, con cui chiedeva che la signora Benvenuti fosse protetta, e che questo Ufficio si limitò ad acquisire agli atti. La richiesta all'Ufficio Anagrafe del 12 ottobre, da cui risulta che nel gennaio 1987 l'imputato aveva chiesto i certificati di residenza di tutte e quattro le vittime designate, mostrando il proprio documento. La lettera del 7 dicembre, che indicava il giorno e il luogo, e senza la quale la sera del 17, sulle scale di via Fratelli Bonnet, non ci sarebbe stato nessuno.
>
> Agli atti risulta anche l'appunto del Commissariato di Monteverde del 4 settembre, archiviato dopo un accertamento telefonico. Ne ho chiesto conto a chi di dovere.
>
> L'imputato ha confessato la notte stessa dell'arresto e non ha mai ritrattato. In aula ha chiesto di leggere una dichiarazione su Luca Moretti, e la Corte gliel'ha concesso. Non ha valore di prova, e non ne avrà. Tuttavia, alla luce della perizia balistica del 1985 e di quanto l'agente Voss ha riferito in aula sulle ricognizioni del giugno 1977, la condanna di Luca Moretti mi appare quantomeno dubbia. Riabilitarlo non è in mio potere, perché il reato è estinto. Scriverlo sì.
>
> L'agente Voss ha deposto come testimone, e ha riferito spontaneamente i fatti del maggio 1977 che lo riguardano. Quei fatti sono estinti per prescrizione *[non verificato]*; il resto non spetta a questo Ufficio.
>
> Non ignoro in quali circostanze Lei abbia lasciato Roma, e non spetta a me commentarle. Ho chiesto che copia di questa lettera sia inserita nel Suo fascicolo personale. Non so se servirà; so che era dovuto.
>
> Distinti saluti.
>
> Il Sostituto Procuratore della Repubblica
> (dott. Corrado Anselmi)
>
> *All.: dispositivo della sentenza della Corte d'Assise di Roma del 18 marzo 1988.*

**L'Allegato** *[non verificato: articoli, formula e pene accessorie nel codice del 1930]*:

```
REPUBBLICA ITALIANA
IN NOME DEL POPOLO ITALIANO

LA CORTE D'ASSISE DI ROMA

all'udienza pubblica del 18 marzo 1988, nel procedimento penale contro

FERRANTE Aldo, nato a Roma il 12 agosto 1926, detenuto,

IMPUTATO
a) dell'omicidio aggravato di Cortesi Silvano (artt. 575, 577 n. 3 c.p.), in Roma, il 18 giugno 1987;
b) dell'omicidio aggravato di Ferri Ottavio (artt. 575, 577 n. 3 c.p.), in Roma, il 3 settembre 1987;
c) dell'omicidio aggravato di Benvenuti Clara (artt. 575, 577 n. 3 c.p.), in Roma, il 22 ottobre 1987;
d) del tentato omicidio aggravato di Voss Florian (artt. 56, 575, 577 n. 3 c.p.), in Roma, il 17 dicembre 1987;

ha pronunciato la seguente

SENTENZA

P.Q.M.

visti gli artt. 483 e 488 c.p.p.,
dichiara FERRANTE Aldo colpevole dei reati a lui ascritti e lo condanna alla pena dell'ergastolo,
con l'isolamento diurno per la durata di anni due;
lo dichiara interdetto in perpetuo dai pubblici uffici;
lo condanna al pagamento delle spese processuali e di quelle della custodia preventiva;
ordina la confisca di quanto in sequestro.

Così deciso in Roma, il 18 marzo 1988.

IL PRESIDENTE                                    IL GIUDICE ESTENSORE
```

**Le varianti che l'Engine compone dai fatti (il testo lo scrive il writer del PM, dentro questi confini):**

| Paragrafo | Quando c'è | Che cosa dice |
|---|---|---|
| Gli atti di Lombardo | sempre | Solo le Lettere che hanno davvero portato a qualcosa, con la data. Nessuna lode generica. |
| La Benvenuti | se `benvenutiSegnalataAllaProcura` | La nota di settembre "acquisita agli atti". |
| L'appunto del 4 settembre | sempre | Una riga, sempre la stessa. |
| La lampadina | se passata alla Procura | Il capo Ferri porta la premeditazione "grazie a un dettaglio riferito da una condomina". |
| Luca | se il Giocatore ha scoperto la perizia o le ricognizioni | «Quantomeno dubbia.» Altrimenti niente. |
| Voss, vivo | Finale 6 | Ha deposto e ha riferito il 1977 (se ha confessato, a Lombardo o nella Lettera dopo il 17). |
| Voss, morto, e il Turno 8 ha riferito la sua confessione | Finale 3 | «Lei mi scrive che l'agente Voss Le aveva confidato… Ne prendo atto, e lo riferisco alla Corte.» |
| Voss, morto, senza la sua confessione | Finale 3 | «L'imputato attribuisce all'agente Voss un comportamento scorretto nel 1977. Non ho modo di verificarlo, e l'agente Voss non può più rispondere.» |
| La scena di via Fratelli Bonnet | Finale 3 | La bottiglia aperta, i due bicchieri, uno pieno. |
| Il trasferimento | sempre | Le "circostanze", il fascicolo personale. |
| Il dispositivo | Finale 3 | Capo d) diventa **omicidio**; i capi a)–c) come da §9.3. **Con 6–9**, per esempio: «dichiara FERRANTE Aldo colpevole dei reati di cui ai capi b) e d) … lo assolve dai reati di cui ai capi a) e c) per insufficienza di prove». **Con meno di 6:** «colpevole del reato di cui al capo d) … lo assolve dai reati di cui ai capi a), b) e c) per insufficienza di prove». |
| La data | Finale 3 senza confessione | Istruzione formale: dispositivo di ven 12 maggio 1989, Lettera di lun 15 maggio 1989. |
| Finale 6 (A) | perquisizione | «La perquisizione del 9 dicembre in via Giacinto Carini»: la lettera della maestra, la chiave. Nessun capo d). |

### 10.8 Il congedo di Adelaide (batch 8)

Il testo intero è quello del **Finale 6**. Per gli altri Finali cambia solo il secondo paragrafo (sotto).

> Roma, sabato 26 dicembre 1987
>
> Egregio Commissario,
>
> giovedì il *Panorama* l'ho letto io per prima. Me l'ha portato Armando alle undici, ancora col cellophane, e me l'ha dato con tutte e due le mani, come se fosse una reliquia. Era la vigilia di Natale. Me lo sono letto tutto sotto le coperte, con il caffè, compresi gli articoli sulla Borsa, che non capisco, e alla fine l'ho portato io alla Iole, al primo piano, perché adesso il giro lo decido io. La Iole mi ha detto grazie, e le si è sbavato il trucco. Non le ho chiesto perché.
>
> Lei vorrà sapere se qui si è saputo del poliziotto di Monteverde. Si è saputo, eccome. Il *Messaggero* di sabato scorso aveva la fotografia dell'uomo che hanno preso sulle scale: un signore distinto, col cappello, di quelli che ti cedono il posto sull'autobus. Uno che non diresti mai. L'ho guardata a lungo, e mi ha fatto impressione, non so perché. Poi ho letto il nome del poliziotto, e mi sono dovuta sedere: era il signor Voss, quello che mi ha scritto il suo indirizzo su un foglietto del bar. Grazie a Dio sta bene, dice il giornale. Io gli avevo chiesto se mangiava, e mi sembra ancora la domanda giusta.
>
> Il geranio rosso di Ernesto, quest'anno, ha fatto un fiore a dicembre, e non era mai successo. Sta sul davanzale della cucina, dentro, al caldo. Ernesto me lo regalò nel '58, il primo inverno in questa casa, e da allora io ci parlo. Lo so che lei sorride. Gli dico le cose che a lei non posso scrivere. Stamattina, per esempio, gli ho detto che scriverle mi mancherà. Il geranio non ha detto niente, ma il fiore l'ha tenuto.
>
> Non so perché lei stia su quell'isola, e non glielo chiedo. Però, quando tornerà a Roma (perché ci tornerà, ne sono sicura), da me alle dieci il caffè è sempre pronto, e il *Panorama* del giovedì, se arriva di giovedì, lo leggiamo insieme.
>
> Con affetto,
> Adelaide Bellucci
>
> P.S. Il colonnello mi ha fatto gli auguri e mi ha regalato un vasetto di miele. Stamattina sui gerani non è caduta una goccia. Non so se è Natale o se gli si è rotto l'annaffiatoio.
>
> P.P.S. Armando la saluta. Dice che, se un giorno lei passa di qui, la lampadina del quarto piano adesso la controlla tutte le sere.

*Che cosa fa:* chiude il Subplot (il *Panorama* letto per prima, il giro deciso da lei) e guarda il Finale solo attraverso il giornale. «Col cappello» e «uno che non diresti mai» li collega il Giocatore, non lei. Il paragrafo del geranio c'è solo se il momento clou non è già stato usato nel batch 7. Circa 480 parole.

**Il secondo paragrafo negli altri Finali** (Adelaide §6.1, aggiornata):
- **1, Voss morto, ignoto:** «Sul *Messaggero* ho letto del poliziotto di Monteverde. Era il signor Voss. Quel poliziotto stanco: gli avevo chiesto se mangiava.» Niente candele: l'ironia la vede il Giocatore, non lei.
- **2, Voss morto, fuggito:** come l'1, più: «Adesso dicono che l'assassino è partito col treno. Ho pensato ai treni per la Grecia che prendeva mia sorella, e a quanto erano lenti.»
- **3, Voss morto, preso:** la fotografia dell'arrestato, «col cappello, uno che non diresti mai», e il nome del signor Voss nello stesso articolo. Si deve sedere, e non va oltre.
- **4, Voss salvo, ignoto:** i giornali non dicono più niente della setta, Lattanzi è ancora dentro, e il signor Voss non si è più visto. Si lamenta che nessuno le racconta niente. (Nel vecchio §6.1 c'era "un'aggressione a un agente": qui non c'è nessuna aggressione.)
- **5, Voss salvo, fuggito:** «Dicono che l'uomo dei lumini era un pensionato di Monteverde, e che è partito col treno.» Poi la sorella e la Grecia, come nel 2, ma con il sollievo: il signor Voss sta bene.

---

## 11. Per l'Engine (in breve)

```
calendario       Turno N: Lettere D_N = 14/9 + 14(N−1) giorni; batch N letto al Turno N+1; posta 7 gg per tratta
uffici           2 sett → batch N+1 · 3–4 sett → batch N+2 · ufficio sbagliato → batch N (per competenza)
eventi fissi     gio 22/10 delitto 3 (dopo il batch 3) · mar 10/11 Lattanzi (batch 5) · gio 17/12 (dopo il batch 7)
fiducia          0–10, parte da 2; +1 condivide, +1 prende sul serio la paura (max +2/Turno);
                 accusa prima dello strato 4 → −3 e Turno freddo; secondo Turno senza Lettere a Voss → −1
                 media ≥ 4 · alta ≥ 7
strati           1: domanda sul 1977 · 2: media + domanda su carriera/paura · 3: dal b4, media, dopo il 2 ·
                 4: alta + dubbio sulle ricognizioni, dopo il 3; uno per batch
scale            bersaglio (dal b4), assassino, Luca: 0–2; un gradino per scala per batch, solo con argomenti;
                 Lattanzi: gradino 1 → 0; il gradino 2 resta; soglie in §4.3
indizi           K1–K13: stato (ignorato | frainteso | capito), riprese ≤ 2, finestre in §3.2
Aldo in Voss     un indizio nuovo per Lettera: b1 mestiere · b2 giugno · b3 3/9 · b4 nipote · b5 Rigoletto ·
                 b6 anniversario · b7 invito
Panorama         dedotto al Turno N ≤ 6 → reveal nel batch N; altrimenti reveal nel batch 6 ("l'ho visto io")
Benvenuti        Voss la visita se richiesto (b1); benvenutiSegnalataAllaProcura → perquisizione con 1 prova
17 dicembre      §7: perquisizione (T≤6) → appostamento (T≤7) → Voss su Aldo → Voss si nasconde → morte
Finali           1–6 (§8); Epilogo solo nei Finali 3 e 6; data: sommaria 18/3/1988, formale 12/5/1989
verdetto         §9: soglie 10/6 sui tre omicidi del 1987; Voss sempre provato se preso il 17 o dopo; ergastolo
Aldo il 17       [PK nuovo] brucia la lettera della maestra e la risposta del 1985; dopo un omicidio la chiave va nel Tevere
```

**Che cosa deve dire il reader per ogni Lettera del Giocatore** (per [#25](https://github.com/Imbustai/imbustai-app/issues/25) e per il build):
- verso Voss: `condivide`, `prendeSulSerioLaPaura`, `accusa`, `domandaSul1977`, `domandaSullaCarriera`, `dubitaDelleRicognizioni`; e gli argomenti per scala, ciascuno con la sua base (quale fatto o documento);
- verso Adelaide: `deduzionePanorama`, `accusaUnInquilino`, `chiedeLAria`, `chiedeDellUomo`;
- verso le autorità: `nominaAldo`, `dataDel17`, `vossBersaglio`, `proveCitate[]`, `legameConLuca`, `segnalaBenvenuti`, `riferisceLaConfessioneDiVoss` (Turno 8);
- per ogni indizio K: `capito` o `frainteso`, e con quale pista sbagliata.

---

## 12. Passaggi ad altri ticket

- **[One real Voss Turn, end to end](https://github.com/Imbustai/imbustai-app/issues/25):** il reader deve produrre i campi della §11, e un Turno di prova può verificarne due: `condivide` e `accusa`. La regola "un indizio nuovo di Aldo per Lettera" va nel prompt di Voss. Il Turno di prova, se è il Turno 1, è il posto giusto per il caso Benvenuti (§5).
- **Fascicolo del caso ([#19](https://github.com/Imbustai/imbustai-app/issues/19)), da aggiornare quando si fa il seed:**
  - §6: la tabella dei Turni usa la convenzione della §1 di qui;
  - §8: soglie confermate, ma sui tre omicidi del 1987 (§9.3); P9 diventa "l'aria + l'uomo col cappello + il *Rigoletto*"; P3 comprende l'atto di matrimonio [?];
  - §4: Lattanzi resta;
  - §3.2 e §5: **Aldo brucia le carte il pomeriggio del 17 [PK nuovo]**, e Mario li vede salire insieme.
- **Dossier di Voss ([#22](https://github.com/Imbustai/imbustai-app/issues/22)):** i numeri di §4 qui sostituiscono le parole "media" e "alta" della §5.2 di là; la visita alla Benvenuti (§5.1) è un comportamento nuovo, solo se richiesto.
- **Adelaide ([#23](https://github.com/Imbustai/imbustai-app/issues/23)):** la §6 di là si rinumera come in §3.4 qui; il sollievo per il delitto 3 si sposta nel batch 4; il congedo del batch 8 prende il posto della vecchia §6.1.
- **Nebbia "Building `engine-voss`":** questo documento è la specifica della meccanica: calendario, stato, ripresa, Finali, verdetto.
- **Nebbia "Player UI":** come appaiono un ritaglio di giornale (§10.2) e il dispositivo come Allegato (§10.7).
- **[The Italian editing pass](https://github.com/Imbustai/imbustai-app/issues/37):** fatto sui testi della §10. Se Paolo vuole, la maestra può leggere §10.3 e §10.8, che sono i più lunghi.

**Spesa:** $0 (nessuna chiamata a modelli).
