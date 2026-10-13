# engine-voss

The Engine that plays the Voss story (Rome, 1987). It speaks the Story runtime's language (Story, Lead, Character, Turn, Plot key, Texture, Signature…) and adds the terms below. Its data is one Story document, `VossStory` (`src/schema.ts`), seeded from `seed/`.

## Language

**Story document**:
The one validated JSON document holding everything narrative this Engine plays; stored in `story_engine_data`, admin-only, because it holds the solution.

**Writer view**:
What one Character knows, as the cached prefix of every Letter it writes: no ladder answers, nothing scheduled for later Turns.
_Avoid_: dossier (the dossier is the author's, and names the answer)

**Office**:
A Roman public office the Lead writes to; it answers after a fixed number of weeks, sends only the documents it holds, and forwards a request that is not its own «per competenza».

**Request key**:
What a Lead's Letter must contain for an office to find a document, such as Luca's name.

**Door**:
An office and a document Voss points the Lead at, never the field to read.

**Trust**:
Voss's 0–10 regard for the Lead, moved by what the Lead's Letters do; it gates the layers.

**Layer**:
One of Voss's five confidences (0–4), told at most one per batch, once its gates are met.

**Ladder**:
One of Voss's three doubts (the target, the killer, Luca), climbed one step at a time and only by the Lead's arguments.

**Clue**:
A fact the Player can understand, ignore or misread; ignored and misread clues come back from another side, at most twice. `K` clues belong to the case, `I` clues to the Panorama Subplot.

**Evidence**:
One of P1–P12, weighted; the verdict scores what the Player obtained.

**Route**:
One of the five ways the 17 December resolves, tried in order.

**Reserved term**:
A Plot-key name, street or object that a sender may not write unless it knows it; a hit is a collision.
