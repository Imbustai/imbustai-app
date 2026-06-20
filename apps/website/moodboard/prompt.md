# Imbustai @apps/website — redesign completo della landing page esistente

## Obiettivo
Refattorizza **solo la grafica e il tema visivo** della landing page esistente di **Imbustai**.

La pagina esiste già e contiene:
- contenuti testuali
- struttura delle sezioni
- CTA
- qualche effetto grafico / animazione / decorazione

### Cosa devi fare
1. **Mantieni il contenuto esistente**: copy, sezioni, CTA, gerarchia informativa e logica generale della pagina.
2. **Rimuovi tutti gli effetti grafici attuali** che non sono coerenti con la nuova direzione:
   - glow
   - blur gratuiti
   - ombre decorative pesanti
   - pattern non coerenti
   - illustrazioni attuali
   - sfondi 
- immagini d'arte
   - effetti 3D
   - microanimazioni decorative superflue
3. **Ricostruisci completamente il tema visivo** usando la moodboard e gli asset allegati.
4. Il risultato deve sembrare una landing page editoriale / brand page ispirata a:
   - Poste Italiane anni ’50/’60
   - Olivetti
   - grafica postale italiana modernista
   - affrancature, timbri, segnaletica, buste, moduli postali
5. Il brand **non** parla di velocità. Parla di:
   - lentezza intenzionale
   - attesa
   - corrispondenza fisica
   - esperienza narrativa
   - partecipazione attiva
   - incontro tra carta e digitale

## Contesto brand
Imbustai è un’esperienza narrativa epistolare che unisce intelligenza artificiale e mondo fisico.
Le persone ricevono lettere reali a casa e partecipano attivamente allo sviluppo della storia.

Problema:
oggi la comunicazione è veloce, superficiale e digitale.

Soluzione:
Imbustai riporta lentezza e profondità attraverso storie epistolari fisiche, personalizzate tramite AI, come alternativa attiva ai social.

## Direzione visuale
Use la cartella @apps/website/moodboard/inspirations Per ispirazione e falla funzionare con le indicazioni che ti ho fornito qui sotto

### Tono
- grafico
- pulito
- deciso
- editoriale
- analogico ma non nostalgico
- contemporaneo nella UX, retro-moderno nel visual design

### Riferimenti
Usa come riferimenti visivi:
- la moodboard allegata dentro a @apps/website/moodboard/inspirations 
- i poster Poste Italiane
- i pattern “posta aerea”
- le cassette postali rosse
- il timbro postale
- la cornice francobollo / QR
- gli elementi postali realistici

### Cose da evitare
- look startup generico
- look “AI tool” standard
- gradienti gratuiti
- glassmorphism
- effetti wow superflui
- illustrazioni casuali non postali
- azzurri chiari non coerenti
- palette seppia / kraft / nostalgica
- estetica romantica da cartoleria vintage

## Palette ufficiale
Usa questa palette come sistema principale:

- Blu Poste: `#0057B8`
- Rosso Segnaletica: `#E53B2C`
- Giallo Accento: `#F6C500`
- Bianco caldo / Carta: `#FAF7F0`
- Nero: `#111111`

Crea un tema ed usa quello con questi colori principali

Genera una version dark mode tenendo sempre gli stessi colori 

### Regole di utilizzo
- background principale: `#FAF7F0`
- heading: soprattutto `#111111` o `#0057B8`
- CTA primarie: fondo `#0057B8` con testo chiaro
- CTA secondarie / accenti: `#E53B2C`
- highlights / dettagli / microaccenti: `#F6C500`
- non introdurre altri blu / azzurri

## Tipografia
### Heading
Usa **Futura PT Condensed Bold** oppure **Futura Sans Condensed** per:
- hero heading
- section titles
- label principali
- callout editoriali
- numerazioni / step
- headings delle card

Se il font non è disponibile nel progetto, prepara il sistema in modo che sia facile sostituirlo. Usa fallback ragionevoli. Futura Sans è installato nel mio computer quindi. va bene 

### Body
Per il testo di corpo usa un sans pulito, neutro e leggibile.
Se GT America non è disponibile, usa un fallback come:
- Inter
- system-ui
- Arial / Helvetica Neue

### Gerarchia tipografica
- Hero molto forte e condensata
- Sottotitoli asciutti
- Body copy arioso ma non “luxury”
- Labels e microtesti con tono editoriale / segnaletico

## Sistema grafico
### Layout
- griglia molto ordinata
- forte disciplina compositiva
- blocchi rettangolari, moduli, separatori
- alternanza di aree chiare e campiture colore
- uso controllato dello spazio bianco
- look da sistema editoriale, non da template

### Elementi grafici da usare
Usa dove opportuno gli asset allegati nella cartella @apps/website/moodboard/assets_for_website 
- cassetta postale rossa
- timbro postale
- cornice QR / francobollo (meetici qualcosa dentro magari=
- pattern posta aerea
- angolo / fascia posta aerea
- busta
- etichetta “Espresso”
- etichetta “Raccomandata”
- segni grafici postali

### Regole d’uso degli asset
- non usare gli asset come sticker casuali
- devono comportarsi come parti di un sistema coerente
- usa pochi elementi per sezione, con intenzione
- il pattern posta aerea va usato come bordo, fascia, dettaglio o sfondo secondario
- il timbro postale può funzionare come accento o watermark
- la cassetta postale può essere usata nella hero o in sezioni storytelling
- la cornice QR può contenere il QR reale oppure funzionare come elemento badge / card

## UX / UI
### Mantieni
- contenuti attuali
- struttura attuale
- CTA
- responsività
- semantica del layout

### Migliora
- gerarchia visiva
- coerenza delle CTA
- qualità dei section wrapper
- card system
- leggibilità
- spaziature
- contrasto

### Animazioni
Riduci drasticamente le animazioni:
- solo microinterazioni essenziali
- hover sobri
- transizioni leggere
- rispetto di `prefers-reduced-motion`

## Applicazione alle sezioni
Applica il tema a tutta la landing esistente, in particolare:
- Hero
- Come funziona
- Perché Imbustai / value proposition
- eventuali sezioni prodotto / storytelling / feature
- CTA finali
- Footer

3. Mantieni il contenuto esistente.
4. Non cambiare il tono del copy, salvo micro-fix tipografici o di leggibilità.
5. La landing finale deve sembrare:
   - più distintiva
   - più italiana
   - più editoriale
   - meno template
   - meno startup generica
   - più coerente con il concept: corrispondenza fisica + narrativa + AI



## Output atteso
Voglio un redesign completo della landing page esistente, mantenendo il contenuto ma sostituendo totalmente il linguaggio visivo con un sistema coerente con la moodboard e gli asset allegati.xx