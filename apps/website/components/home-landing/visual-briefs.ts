/**
 * Briefs for the photographs and films still to be produced or retouched. Each
 * drawing or raw photo on the homepage stands in for one of them and shows its
 * brief underneath, so whoever makes the visual knows what belongs in that slot.
 * The untouched source photos live in `moodboard/photos/`.
 *
 * These are production notes, not site copy: when the final visual is in its
 * slot, delete its brief here. When the last one goes, delete this file and
 * the `VisualSlot` caption.
 */
export const VISUAL_BRIEFS = {
  hero: 'Partire dalla foto della cassetta (moodboard/photos/cassetta-poste-frontale.jpg). Ritocco: una busta bianca con bordo posta aerea rosso e blu, francobollo blu e timbro, infilata a metà nella feritoia «Per tutte le altre destinazioni». Sulla busta, scritto a mano: il nome di chi guarda. La busta deve avere la stessa luce e la stessa grana della foto.',
  stepChoose:
    'Tre copertine di storie affiancate come francobolli grandi: titolo, luogo e anno, un solo oggetto simbolo per ciascuna.',
  stepReceive:
    'Mano che estrae una busta Imbustai da una cassetta delle lettere condominiale, tra bollette e volantini. Solo la busta è a colori pieni.',
  stepReply:
    'Telefono in mano, schermata di scrittura di Imbustai con una risposta a metà. Sul tavolo accanto, la lettera aperta.',
  stepNext:
    'La stessa cassetta della foto 2, con una seconda busta che spunta. Stessa inquadratura, luce di un’altra ora del giorno.',
  receive:
    'Foto dall’alto, formato orizzontale. Su un tavolo di cucina vero: busta aperta con bordo posta aerea, lettera di due fogli scritta a macchina con firma a penna, un telegramma giallo, un ritaglio di giornale, una tazzina di caffè al bordo. Deve far venire voglia di toccare la carta. In alternativa: video di 10 secondi di mani che aprono la busta.',
} as const;
