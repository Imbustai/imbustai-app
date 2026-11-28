# @imbustai/letters

Prints a Story's paper: the Letters a Character writes, **by hand**, and the cards the publisher puts in the envelope, **typeset**. Everything comes out as a vector PDF at its real paper size.

The text is never written here. It is read from the Engine's seed (`packages/engine-<name>/seed/text/…`), in Letter Markdown, so the PDF and the game say the same words.

## Setup

```bash
pnpm --filter @imbustai/letters run setup   # Python venv with numpy, PenGPT weights (6 MB) into .cache/
pnpm --filter @imbustai/letters run voss    # prints/voss/00-introduzione.pdf (A5) and 01-lettera-voss.pdf (A4)
```

Needs Python 3.9+ and Google Chrome (or `CHROME=/path/to/chromium`), which prints the PDFs.

## Commands

```bash
.venv/bin/python -m letters letter <file.md> --hand voss --out prints/x.pdf [--paper A4|A5]
.venv/bin/python -m letters card <file.md> --story "L'ombra di Voss" --out prints/x.pdf [--paper A5]
.venv/bin/python -m letters audition --out hands.html --n 36 --seed 1     # many hands, one phrase, to choose from
.venv/bin/python -m letters proof <file.md> --hand voss --out proof.html   # every word under the text it should say
.venv/bin/python -m letters retake --hand voss --out retake.html word…     # seeds 1…8 of each word, side by side
```

## How a Letter is written

- **The pen** is [PenGPT](https://github.com/greydanus/pengpt) (Sam Greydanus, Apache-2.0): a 6M-parameter transformer that writes text as pen strokes in any of 1,192 hands. `vendor/pengpt/pen.py` is its numpy-only inference file, copied unchanged (see `vendor/pengpt/NOTICE`).
- **A Hand** (`hands.json`) is one PenGPT writer plus how that person sets a page: size, line spacing, margins, ink, paper colour. Writers have opaque ids; pick one with `audition`, and say in `about` why it suits the Character.
- **What the model cannot write, we draw** (`letters/hand.py`). PenGPT learned English: it writes «città» as nonsense, «l'ho» as «lHo», and often drops the full stop at the end of a word. So the model writes the bare word («citta») and the accent is drawn over the letter, as a person adds it after the word (on an *ì* the dot goes first); elisions are written as two words joined by an apostrophe; full stops, commas, colons and semicolons at the end of a word, and « », are drawn after the ink.
- **Retakes.** Greedy writing is deterministic, so a word the model gets wrong is wrong every time, and a cursive hand gets many wrong (it loses count of minims: «trasferimmmmento»). The way through:
  1. `proof` lays out every word of the Letter, as written, under the word it should be. Reading ink against its label is quick; reading a cursive page is not.
  2. `retake` writes each bad word alone with seeds 1…8 (`--seeds 24` for more). Pick the seed that reads right.
  3. Put it in the hand's `retakes` in `hands.json`: `"word,": 6`. The key is the word exactly as in the text, punctuation included, and it applies wherever that word occurs.
  4. A long word no seed gets right can be written in pieces and joined, as a hand that lifts the pen: `"soprannumero.": "sopran|numero."`.
  
  The first Voss Letter in `x4xl0` needed about 150 retakes; with the strokes cached, each new pass takes seconds.
- **The page** (`letters/page.py`): place and date on the right, salutation, indented paragraphs, signature, P.S.; baselines that drift a little, lines that tilt, sheets numbered «- 2 -» from the second. *Emphasis* is underlined.
- The model's raw strokes are cached in `.cache/strokes/` by hand and text: the first run of a long Letter takes a few minutes, every run after it (new retakes, layout, marks) about two seconds, and a Letter comes out the same every time.

## Hands

| Name | Character | Writer | Why |
|------|-----------|--------|-----|
| `voss` | Florian Voss | `x4xl0` | A small, even, slanted cursive, joined and careful: a South Tyrolean schooled in two languages, taught to write properly, who still takes the time. |
