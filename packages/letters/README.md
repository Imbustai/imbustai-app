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
```

## How a Letter is written

- **The pen** is [PenGPT](https://github.com/greydanus/pengpt) (Sam Greydanus, Apache-2.0): a 6M-parameter transformer that writes text as pen strokes in any of 1,192 hands. `vendor/pengpt/pen.py` is its numpy-only inference file, copied unchanged (see `vendor/pengpt/NOTICE`).
- **A Hand** (`hands.json`) is one PenGPT writer plus how that person sets a page: size, line spacing, margins, ink, paper colour. Writers have opaque ids; pick one with `audition`, and say in `about` why it suits the Character.
- **What the model cannot write, we draw** (`letters/hand.py`). PenGPT learned English: it writes «città» as nonsense, «l'ho» as «lHo», and often drops the full stop at the end of a word. So the model writes the bare word («citta») and the accent is drawn over the letter, as a person adds it after the word (on an *ì* the dot goes first); elisions are written as two words joined by an apostrophe; full stops, commas, colons and semicolons at the end of a word, and « », are drawn after the ink.
- **Retakes.** Greedy writing is deterministic, so a word the model gets wrong is wrong every time. Add it to the hand's `retakes` (`"word": seed`) and it is written again alone, sampled with that seed. Check every sheet before printing.
- **The page** (`letters/page.py`): place and date on the right, salutation, indented paragraphs, signature, P.S.; baselines that drift a little, lines that tilt, sheets numbered «- 2 -» from the second. *Emphasis* is underlined.
- The model's raw strokes are cached in `.cache/strokes/` by hand and text: the first run of a long Letter takes a few minutes, every run after it (new retakes, layout, marks) about two seconds, and a Letter comes out the same every time.

## Hands

| Name | Character | Writer | Why |
|------|-----------|--------|-----|
| `voss` | Florian Voss | `rymy8` | Upright, a little angular, tidy, half printed: a South Tyrolean policeman who writes as he files a report, and wants to be read. |
