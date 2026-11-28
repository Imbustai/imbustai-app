# Francobollo di «L'ombra di Voss»

Il francobollo è la copertina della storia: chiude la busta regalo di Natale 2026, rappresenta la storia nella vetrina del sito e diventa un adesivo da collezione. È il primo di una serie: ogni storia di Imbustai avrà il suo.

## Versione attuale: `l-ombra-di-voss-600.png`

**Stato:** `scelto`, non ancora `definitivo` (28/11/2026). 1122×1402 px. Lo stile è quello della serie ordinaria «Castelli d'Italia» (1980–1987): campo grigio-verde, medaglione inciso in due inchiostri, i lumini come unico tocco di rosso. In alto a sinistra «ROMANZI EPISTOLARI / IMBUSTAI», in alto a destra il valore 600, in basso il titolo della storia **L'OMBRA DI VOSS**, e sotto «SETTEMBRE 1987» e «ROMA». Partito dalla prova GPT Image in `prove/`, con la prospettiva corretta e i testi rifatti da Paolo.

Prima della stampa la risoluzione va portata a 300 dpi per il formato finale: 1122 px bastano fino a circa 95 mm di larghezza, quindi per l'adesivo da 40 mm sono sufficienti.

## La prima scelta: «Il pianerottolo»

`il-pianerottolo.png`: 1856×2304 px, 4:5, generato con Nano Banana Pro (Gemini 3 Pro Image) su ElevenLabs Flows il 27/11/2026. Scelto da Paolo il 27/11/2026 e poi superato dalla versione in stile «Castelli d'Italia».

La scena del delitto di via Lanciani, di notte: la porta socchiusa con una lama di luce, la ringhiera di ferro battuto, l'interruttore a tempo spento, il pavimento di marmo e i tre lumini rossi dentro il triangolo di gesso. Niente persone e niente sangue.

Per stamparlo sarebbero serviti tre passaggi:
- vettorializzare il testo e il bordo oppure rifarli in vettoriale, con IMBUSTAI in League Gothic;
- ricavare il tracciato di fustella dalla dentellatura;
- portare il file a 300 dpi per il formato 40×50 mm. A 2K la risoluzione basta già: 1856 px su 40 mm sono circa 1.180 dpi.

## Le altre direzioni

- `scartati/due-rive.jpg` (GPT Image 2.6): Roma al tramonto e Lipari separate da una banda di posta aerea, con una lettera in viaggio. Contro: la cupola è riconoscibile come San Pietro, e Lombardo compare di profilo, mentre il brief chiede di non definirlo.
- `scartati/il-sigillo.jpg` (GPT Image 2.6): busta chiusa con la ceralacca e il triangolo dei lumini impresso, annullo «LIPARI 12.9.87».
- `disegni-svg/`: le stesse tre direzioni disegnate a mano in SVG da Claude prima delle generazioni. Scartate perché lo stile illustrativo è troppo piatto.

Le due direzioni scartate sono salvate in JPG qualità 92 per non appesantire il repository. Gli originali PNG sono su ElevenLabs, nel flow «Imbustai · Francobolli Voss» (id `ejL2IkR8vA74KpRqgaKV`).

## Prova di stile: la serie «Castelli d'Italia»

`prove/il-pianerottolo-stile-castelli.png` (GPT Image 2.6, 1K, qualità low, 832×1040 px): la stessa scena del pianerottolo nel linguaggio dei francobolli ordinari italiani della serie «Castelli d'Italia» (1980–1987). Campo grigio-verde, medaglione tondo inciso in due inchiostri, didascalia in alto a sinistra, valore in alto a destra e IMBUSTAI in grande in basso. Il rosso dei lumini è l'unico terzo colore. È solo una prova: la qualità bassa dipende dai crediti rimasti. Se piace, va rigenerata ad alta qualità.

## Come rifarlo

- `BRIEF.md` è il brief da artista: chi siamo, a cosa serve il francobollo, la storia completa senza spoiler, i simboli, cosa non vogliamo, le specifiche tecniche. Gli allegati citati nel brief sono i testi d'apertura della storia in `packages/engine-voss/seed/text/opening/`.
- `PROMPTS.md` contiene i prompt esatti usati per le generazioni.
- `prove/PROMPT-correzione-prospettiva.md` è il prompt per correggere la prospettiva e i testi della prova «Castelli».

## Spesa

| Immagine | Modello | Crediti ElevenLabs | Costo |
|---|---|---|---|
| Il pianerottolo | Gemini 3 Pro Image, 2K | 1.218 | 0,22 $ |
| Due rive | GPT Image 2.6 Sunburst, 2K, qualità high | 483 | 0,09 $ |
| Il sigillo | GPT Image 2.6 Sunburst, 2K, qualità high | 483 | 0,09 $ |
| Prova stile Castelli | GPT Image 2.6 Sunburst, 1K, qualità low | 132 | 0,02 $ |
| **Totale** | | **2.316** | **0,42 $** |
