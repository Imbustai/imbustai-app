# Moodboard

Qui vivono tutti gli asset grafici di Imbustai: riferimenti, foto, generazioni AI, bozze, versioni scelte e definitive, e gli script che le rigenerano. Le regole stanno nell'[ADR 0004](../docs/adr/0004-design-assets-live-in-moodboard.md); in breve:

- ogni cartella di asset ha un `README.md` che dice cos'è, in che **stato** è (`riferimento`, `bozza`, `scelto`, `definitivo`), da dove viene ogni file e cosa va ancora sistemato;
- le generazioni AI tengono accanto il prompt esatto (`PROMPTS.md`) e la spesa;
- i nomi sono in italiano, minuscolo, con i trattini;
- **il repository è pubblico**: le immagini di terzi restano riferimenti, e i marchi veri (giornali, ATAC, Poste) si correggono prima di stampare o pubblicare;
- il sito non legge da qui: quando serve un'immagine se ne copia una versione ottimizzata nell'app.

## Mappa

```
moodboard/
├── imbustai/                         il marchio, per tutte le storie
│   ├── foto-reali/                   foto di Paolo: cassette e insegne postali
│   └── campioni-chatgpt-giugno-2026/ palette, icone, poster e landing di riferimento
└── storie/
    └── voss/                         «L'ombra di Voss», Roma 1987
        ├── francobollo/              la copertina-francobollo della storia
        └── busta-a4/                 il regalo di Natale 2026: tutto quello che c'è nella busta
            ├── mappa-roma-1987/      la pianta della città, A3
            └── riferimenti/          documenti d'epoca usati come modello
```
