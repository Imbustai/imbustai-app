"""python -m letters: write Letters by hand, set cards, audition hands.

  letter <file.md> --hand voss --out out/x.pdf     a handwritten Letter
  card <file.md> --out out/x.pdf                   a printed card (A5)
  audition --out out/hands.html [--n 36] [--seed 1] [--text ...]
  proof <file.md> --hand voss --out out/proof.html  every word under the text it should say
  retake --hand voss --out out/retake.html word…    seeds 1…8 of each word, for hands.json
"""

from __future__ import annotations

import argparse
import html
import json
import os
import sys

import numpy as np

from .card import card_html
from .hand import ROOT, Hand, bare
from .letter import blocks
from .page import PAPER, Block, Line, Style, page_svg, set_letter
from .pdf import paper_css, print_pdf

HANDS = os.path.join(ROOT, "hands.json")
COLLANA = "Romanzi Epistolari Imbustai"


def load_hand(name: str) -> tuple[Hand, Style, dict]:
    spec = json.load(open(HANDS))[name]
    hand = Hand(spec["writer"], spec.get("temperature", 0.0), spec.get("top_k"), spec.get("seed", 0), spec.get("retakes", {}))
    style = Style(**{k: tuple(v) if k == "margin" else v for k, v in spec.get("style", {}).items()})
    return hand, style, spec


def letter_pdf(markdown: str, hand_name: str, out: str, paper: str | None = None) -> list[str]:
    hand, style, spec = load_hand(hand_name)
    if paper:
        style.paper = paper
    pages = set_letter(blocks(markdown), hand, style)
    sheets = []
    for n, lines in enumerate(pages):
        if n:  # a person numbers the sheets after the first
            num = set_letter([Block(str(n + 1), align="right", dashes=True)], hand, Style(**{**style.__dict__, "margin": (9.0, style.margin[1] + 2, 0.0, 0.0)}))[0]
            lines = num + lines
        sheets.append(f'<section class="sheet">{page_svg(lines, style, n)}</section>')
    title = html.escape(os.path.splitext(os.path.basename(out))[0])
    doc = (f'<!doctype html><html lang="it"><head><meta charset="utf-8"><title>{title}</title>'
           f'<style>{paper_css(PAPER[style.paper], spec.get("paper", "#f6f1e4"))}</style></head><body>{"".join(sheets)}</body></html>')
    print_pdf(doc, out)
    return [f"{len(pages)} sheets {style.paper} -> {out}"]


def audition(out: str, n: int, seed: int, text: str) -> None:
    names = Hand.pen().writers[1:]
    pick = np.random.default_rng(seed).choice(names, min(n, len(names)), replace=False)
    cells = []
    for w in pick:
        st = Style(paper="A5", margin=(4, 4, 4, 4))
        lines = set_letter([Block(text)], Hand(str(w)), st)[0]
        svg = page_svg(lines, st).replace(' height="210.0mm"', ' height="32mm"').replace("0 0 148.0 210.0", "0 0 148.0 32.0")
        cells.append(f"<figure><figcaption>{w}</figcaption>{svg}</figure>")
        print(w, file=sys.stderr)
    open(out, "w").write('<!doctype html><meta charset="utf-8"><style>body{margin:0;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;'
                         'font:11px sans-serif}figure{margin:0}</style>' + "".join(cells))


def word_svg(points: np.ndarray, style: Style, width: float = 52.0, height: float = 12.0) -> str:
    """One word, alone, at its real size: for proof and retake sheets. Long words widen the cell."""
    if len(points):
        width = max(width, float(np.ptp(points[:, 0])) * style.scale + 6)
    q = points.copy()
    q[:, 0] -= q[:, 0].min() if len(q) else 0
    q[:, :2] *= style.scale
    lines = [Line([q], 0, height * 0.62, 2.0)] if len(q) else []
    W, H = PAPER[style.paper]
    return (page_svg(lines, style).replace(f' width="{W}mm"', f' width="{width}mm"').replace(f' height="{H}mm"', f' height="{height}mm"')
            .replace(f"0 0 {W} {H}", f"0 0 {width} {height}"))


SHEET = ('<!doctype html><meta charset="utf-8"><style>body{{margin:0;background:#f5f0e3;font:12px sans-serif}}'
         '.grid{{display:grid;grid-template-columns:repeat({cols},max-content);gap:2px 10px;padding:6px}}'
         'figure{{margin:0}}figcaption{{color:#a33;white-space:nowrap}}</style><div class="grid">{cells}</div>')


def proof(markdown: str, hand_name: str, out: str, per_sheet: int = 160) -> list[str]:
    """Every word of a Letter (three letters or more) as the Hand wrote it, under the text it should say.

    Reading a cursive page is slow and easy to get wrong; checking ink against
    the word above it is not. Sheets are numbered: out-1.html, out-2.html, …
    """
    hand, style, _ = load_hand(hand_name)
    cells = []
    for b in blocks(markdown):
        for token, points in zip(b.text.split(), hand.write(b.text)):
            if len(bare(token.strip("«».,;:!?"))[0]) >= 3:
                cells.append(f"<figure><figcaption>{len(cells) + 1} {html.escape(token)}</figcaption>{word_svg(points, style)}</figure>")
    stem, outs = os.path.splitext(out)[0], []
    for k in range(0, len(cells), per_sheet):
        outs.append(f"{stem}-{k // per_sheet + 1}.html")
        open(outs[-1], "w").write(SHEET.format(cols=8, cells="".join(cells[k:k + per_sheet])))
    return outs


def retake_sheet(hand_name: str, words: list[str], out: str, seeds: int = 8) -> str:
    """Each word written alone with seeds 1…n, to pick one for the hand's retakes."""
    hand, style, _ = load_hand(hand_name)
    cells = []
    for w in words:
        cells.append(f"<figure><figcaption><b>{html.escape(w)}</b></figcaption>{word_svg(hand.write(w)[0], style, 44)}</figure>")
        for s in range(1, seeds + 1):
            h = Hand(hand.writer, hand.temperature, hand.top_k, hand.seed, {w: s})
            cells.append(f"<figure><figcaption>{s}</figcaption>{word_svg(h.write(w)[0], style, 44)}</figure>")
    open(out, "w").write(SHEET.format(cols=seeds + 1, cells="".join(cells)))
    return out


def main() -> None:
    p = argparse.ArgumentParser(prog="letters")
    sub = p.add_subparsers(dest="cmd", required=True)
    l = sub.add_parser("letter")
    l.add_argument("source")
    l.add_argument("--hand", required=True, help="a name in hands.json")
    l.add_argument("--paper", choices=list(PAPER))
    l.add_argument("--out", required=True)
    c = sub.add_parser("card")
    c.add_argument("source")
    c.add_argument("--story", default="")
    c.add_argument("--paper", choices=list(PAPER), default="A5")
    c.add_argument("--out", required=True)
    a = sub.add_parser("audition")
    a.add_argument("--out", required=True)
    a.add_argument("--n", type=int, default=36)
    a.add_argument("--seed", type=int, default=1)
    a.add_argument("--text", default="Caro Giacomo, ti devo una lettera da giugno. Perché è così? Roma, 1987")
    pr = sub.add_parser("proof")
    pr.add_argument("source")
    pr.add_argument("--hand", required=True)
    pr.add_argument("--out", required=True)
    r = sub.add_parser("retake")
    r.add_argument("words", nargs="+")
    r.add_argument("--hand", required=True)
    r.add_argument("--seeds", type=int, default=8)
    r.add_argument("--out", required=True)
    args = p.parse_args()
    if args.cmd == "letter":
        print(*letter_pdf(open(args.source).read(), args.hand, args.out, args.paper))
    elif args.cmd == "card":
        print_pdf(card_html(open(args.source).read(), args.story, COLLANA, PAPER[args.paper]), args.out)
        print(f"card {args.paper} -> {args.out}")
    elif args.cmd == "proof":
        print(*proof(open(args.source).read(), args.hand, args.out), sep="\n")
    elif args.cmd == "retake":
        print(retake_sheet(args.hand, args.words, args.out, args.seeds))
    else:
        audition(args.out, args.n, args.seed, args.text)
        print(f"-> {args.out}")


if __name__ == "__main__":
    main()
