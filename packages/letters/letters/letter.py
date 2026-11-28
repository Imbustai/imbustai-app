"""Read a Letter in Letter Markdown and turn it into blocks a Hand writes.

The shape is the one every Character Letter has in the seed: a first line with
place and date, a salutation, paragraphs, a signature, then any postscripts.
*Emphasis* is underlined, as a hand would; **bold** is just written.
"""

from __future__ import annotations

import re

from .page import Block

DATE = re.compile(r"^[A-ZÀ-Ý][\w' ]+, (lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica|\d)", re.I)


def words_with_emphasis(text: str) -> tuple[str, set[int]]:
    """Plain text, and which of its words were in *emphasis*."""
    out, under, inside = [], set(), False
    for raw in text.replace("**", "").split():
        starts, ends = raw.startswith("*"), raw.rstrip(".,;:!?»").endswith("*")
        if starts:
            inside = True
        if inside:
            under.add(len(out))
        out.append(raw.replace("*", ""))
        if ends:
            inside = False
    return " ".join(out), under


def blocks(markdown: str) -> list[Block]:
    paras = [p.strip() for p in re.split(r"\n\s*\n", markdown.strip()) if p.strip()]
    out: list[Block] = []
    signed = False
    for i, p in enumerate(paras):
        p = " ".join(p.split())
        text, under = words_with_emphasis(p)
        if i == 0 and DATE.match(text):
            out.append(Block(text, align="right", underline=under))
        elif i <= 1 and text.endswith(",") and len(text) < 40:
            out.append(Block(text, gap_before=1.2 if out else 0, underline=under))
        elif not signed and len(text.split()) <= 2 and not text.endswith((".", "?", "!", ",")):
            out.append(Block(text, align="signature", gap_before=0.9, underline=under))
            signed = True
        elif re.match(r"^P\.?\s?P?\.?\s?S\.", text):
            out.append(Block(text, gap_before=1.6 if signed else 0.4, underline=under))
        else:
            out.append(Block(text, indent=True, gap_before=0.25, underline=under))
    return out
