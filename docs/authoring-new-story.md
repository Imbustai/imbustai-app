# Authoring a new story

A practical guide for creators. **No coding required** — every story lives in the
database and is built entirely from the admin editor at `/admin/stories`. The
engine reads your story at runtime, so a brand-new story (any genre) needs zero
TypeScript changes. Story #2 (`Lettere dal Faro`, a cozy pen-pal story with no
mystery mechanics) was created this way as proof.

> Prerequisite: an admin account. Open `/admin/stories`.

---

## 1. The mental model

A story is **characters who exchange letters with the player over time**. That is
the only required part. Everything that makes a *mystery* — facts, acts, clues,
endings — is an **optional module** you can ignore for a slice-of-life story and
lean on heavily for a detective plot.

| Piece | Required? | What it is |
|---|---|---|
| Story metadata | ✅ | Title, description, price, language |
| Time config | ✅ | When the story starts and how fast letters travel |
| **Characters** | ✅ (≥1) | The people the player writes to |
| **Opening letter** | ✅ (≥1 character) | What lands in the player's inbox at game start |
| Facts | optional | The canon registry — who knows what (prevents knowledge bleed) |
| Acts | optional | Narrative phases tied to turn ranges |
| Clues | optional | Discoverable hints with reliability levels |
| Endings | optional | Win/lose conditions for the finale |

---

## 2. Create the story shell

1. `/admin/stories` → **New story**. Enter a **slug** (lowercase letters,
   numbers, underscores — e.g. `summer_letters`) and a working title → **Create**.
2. You land in the editor. Fill the **Story & lifecycle** card: titles and
   descriptions (EN + IT), price, and leave **Lifecycle = Draft** while you write.

### Lifecycle — the most important setting

| Stage | Who can play | AI replies |
|---|---|---|
| **Draft** | nobody | — (you're still writing) |
| **Testing** | you/admins | **every reply waits for your review** (generate → edit → approve) |
| **Released** | buyers (when published) | **auto-sent** after canon validation; only problems stop for review |

Write in Draft → move to **Testing** to playtest with the review gate → move to
**Released** (and tick **Published**) to sell it. A story can only be published
when it's Released **and** has at least one contactable character with an opening
letter.

---

## 3. Time & settings

In the **Time & settings** card:

- **Start mode**:
  - *Fixed date* — every playthrough starts on the date you set (good for a
    period piece, e.g. a 1925 mystery).
  - *Actual date* — the story starts the day the player begins (good for a
    "happening now" pen-pal story).
- **Story start date** — the in-fiction day letter #1 is dated (fixed mode).
- **Delay letter delivery** — real-world wait before a reply appears in the
  player's inbox, as a random window (e.g. 30–180 minutes), clamped to waking
  hours. Turn it **off** for instant replies while testing.
- **Max letters per turn** (default 4), **max turns**, **story language**.

---

## 4. Characters

Add each character (**Characters** section → **Add**):

- **Slug** — stable id (`voss`, `nonna_alba`). Lowercase/underscores.
- **Name / Role** — shown to the player.
- **Responsiveness + reply delay (min/max story-days)** — how long, *in fiction*,
  this character takes to answer. A bureaucracy might be 5–10 days; a close
  friend 1–2. This drives the in-fiction dates automatically.
- **Contactable from start** — can the player write to them immediately? (At
  least one character must be.)
- **Opening letter** — if filled, this character writes to the player at game
  start. Multiple characters can each have one. **Never put a date inside the
  letter body** — the platform stamps and displays the date for you.
- **Opening letter day offset** — in-fiction days after the start date for that
  opening letter (0 = day one).
- **Personality (JSON)** — free-form voice notes the AI uses: `traits`,
  `speech_pattern`, `letter_format`, etc.
- **Hidden agenda** — a secret the character (and the AI Game Master) act on but
  the player must never be told directly. Leave empty for honest characters.
- **Unlock rules (JSON)** — for characters that appear later; describe in plain
  words when they should become contactable (the Game Master unlocks them).

A wholesome story can stop here: two contactable characters, one opening letter,
publish. That's a complete, playable story.

---

## 5. Optional modules (for richer / mystery stories)

Expand these collapsible sections only if you want them.

- **Facts** — the **canon registry**, and the engine's anti-knowledge-bleed
  mechanism. Each fact has content, a **Known by** multi-select (which characters
  know it), and **Public** (everyone knows). A fact known by nobody and not
  public is a **Game-Master-only secret** (e.g. the twist) — the AI plotting
  brain sees it, but no character writer ever does, so they can't leak it.
  Optionally gate a fact behind a **reveal act**.
- **Acts** — number, title, turn range, and goals. Lets the story escalate in
  phases.
- **Clues** — discoverable hints with a **reliability** (`true_useful`,
  `true_misleading`, `false_coherent`, `red_herring`), a category, and the act
  they become available. Great for detective stories; ignore for others.
- **Endings** — a key, a **conditions** JSON (e.g. `{"victim_saved": true}`),
  and narrative guidance for the finale.

The canon validator automatically runs **only** the rules for the modules you
use: a story with no facts/clues/acts/endings is checked only for timeline order
and basic sanity.

---

## 6. Playtest

1. Set lifecycle to **Testing** and save.
2. Create a free order for a test user: `/admin/order/create` → pick the user and
   your story → start the game from the order.
3. As the player (a non-admin account), open `/games` → the game → write letters
   → **Send all**.
4. As admin, `/admin` → **Games waiting for review** → open the game → **Generate
   AI reply** → review each NPC letter, edit or regenerate, check the canon
   warnings and narrator notes → **Approve & Send**.
5. Iterate on personalities/facts until the voices and pacing feel right. Tip: if
   you change a story that has games in progress, the editor warns you —
   **Duplicate** the story and edit the copy instead.

---

## 7. Release

1. Lifecycle → **Released**, tick **Published**, save. (The editor blocks
   publishing if there's no contactable character or no opening letter.)
2. The story now appears in the shop and can be purchased. On release, AI replies
   auto-send after canon validation passes; any validation **error** still holds
   that turn in your review queue, so you stay in control of quality.

---

## Quick recipes

- **Cozy / slice-of-life**: 2–3 contactable characters, 1–2 opening letters,
  `start_mode: actual`, no facts/acts/clues/endings. Done.
- **Detective mystery**: full cast (some locked), a rich fact registry with
  GM-only secrets, 5 acts, a clue catalog with mixed reliability, 3–4 endings.
  See the Voss story (`/admin/stories` → *Il Caso Voss*) as a worked example.
- **Period piece**: `start_mode: fixed` with the historical start date; tune
  per-character reply delays to match the era's postal speed.
