# Pianta di Roma 1987

**Stato:** `scelto` (28/11/2026): nella busta va la versione **con i segni a penna**, `mappa-roma-1987-segni.pdf`. Foglio A3 orizzontale (420×297 mm) da piegare in 8: una pianta della città come quelle che si compravano in edicola negli anni '80, con la zona del caso.

- **Zona:** Nomentano, San Lorenzo, Esquilino, Castro Pretorio. Ci sono via Rodolfo Lanciani (Ferri), piazza dei Sanniti (Cortesi), via dei Volsci (l'officina dell'arresto), via Tiburtina (la tabaccheria Ricci), via di San Vitale (la Questura), Termini e il Verano. Garbatella, Monteverde e Regina Coeli sono fuori dal foglio.
- **Impaginazione:** il titolo «PIANTA DELLA CITTÀ DI ROMA» sta nella fascia in alto della cornice; la mappa occupa tutto il resto del foglio; il riquadro «Segni convenzionali», con la scala, è appoggiato sulla mappa in alto a sinistra, sopra Salario e Pinciano, dove non c'è niente della storia. Niente indice delle vie (tolto da Paolo il 28/11/2026).
- **Scala** 1:12.500, la classica del Touring, con reticolo A–H × 1–5.
- **Stile** delle piante editoriali anni '80 (Touring, Lozzi, FMB): carta avorio, abitato rosa salmone, strade gialle e bianche filettate, ferrovia a scacchi, Mura Aureliane dentellate, parchi a puntini, cimitero a crocette, metropolitana linea A (l'unica nel 1987 in questa zona). Scala a scacchi come nel riferimento di Paolo. Editore inventato, sotto la cornice: «Edizioni Cartografiche Capitoline», agosto 1987, L. 3.500.
- **Caratteri:** PT Serif per titoli e legenda, PT Sans Narrow per le vie, Caveat per la penna. Sono Google Fonts gratuiti: per aprire gli SVG in Affinity vanno installati; i PDF li hanno già incorporati.

## File

| File | Uso |
|---|---|
| `mappa-roma-1987.pdf` | Per la stampa: vettoriale, A3, font incorporati |
| `mappa-roma-1987.svg` | Per modificarla in Affinity: livelli separati (cornice, isolati, aree, strade, ferrovie, mura, nomi, legenda) |
| `mappa-roma-1987.png` | 4963×3509 px (300 dpi), per il sito e i mockup |
| `mappa-roma-1987-segni.*` | La stessa con i segni a penna rossa: i luoghi del caso cerchiati e annotati, e una freccia verso la Garbatella «la maestra». Il livello è `segni-a-penna` |
| `sorgente/mappa.py` | Lo script che la disegna: `python3 mappa.py osm-2026-11-28.json.gz OUT_DIR` |
| `sorgente/osm-2026-11-28.json.gz` | I dati OpenStreetMap scaricati il 28/11/2026 |

## Da sapere

- **Le vie sono quelle vere**, prese da OpenStreetMap. La licenza ODbL chiede di citarlo: la riga «Dati stradali © OpenStreetMap contributors» sotto la cornice va lasciata.
- **Anacronismi:** i dati sono di oggi. Ho tolto Largo Federico Fellini (intitolato dopo il 1993), i nomi moderni della Sapienza e le stazioni della metro B, aperte nel 1990. Qualche largo o giardino intitolato dopo il 1987 può essere rimasto.
- **La penna** è decisa da Paolo: la versione con i segni dice al giocatore dove sono avvenuti i fatti che già conosce dalla lettera di Voss, senza aggiungere niente.
