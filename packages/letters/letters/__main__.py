"""python -m letters: write Letters by hand, set cards, audition hands.

  letter <file.md> --hand voss --out out/x.pdf     a handwritten Letter
  card <file.md> --out out/x.pdf                   a printed card (A5)
  audition --out out/hands.html [--n 36] [--seed 1] [--text ...]
"""

from __future__ import annotations

import argparse
import html
import json
import os
import sys

import numpy as np

from .card import card_html
from .hand import ROOT, Hand
from .letter import blocks
from .page import PAPER, Block, Style, page_svg, set_letter
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
    args = p.parse_args()
    if args.cmd == "letter":
        print(*letter_pdf(open(args.source).read(), args.hand, args.out, args.paper))
    elif args.cmd == "card":
        print_pdf(card_html(open(args.source).read(), args.story, COLLANA, PAPER[args.paper]), args.out)
        print(f"card {args.paper} -> {args.out}")
    else:
        audition(args.out, args.n, args.seed, args.text)
        print(f"-> {args.out}")


if __name__ == "__main__":
    main()
