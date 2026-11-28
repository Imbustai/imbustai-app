"""Lay handwritten words on sheets of paper and draw them as SVG.

Everything here is in millimetres. A Letter is a list of blocks (place and
date, salutation, paragraphs, signature, postscript); each block is written by
the Hand and set line by line, with the small irregularities a person's lines
have: a baseline that drifts, a left margin that wanders, lines that tilt.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

import numpy as np

from .hand import X_HEIGHT, Hand, flanked, pengpt

PAPER = {"A4": (210.0, 297.0), "A5": (148.0, 210.0)}


@dataclass
class Style:
    """How a person sets a page: sizes in mm."""

    paper: str = "A4"
    x_height: float = 2.6          # mm: the size of the hand
    line: float = 9.0              # mm between baselines
    margin: tuple[float, float, float, float] = (24.0, 20.0, 22.0, 24.0)  # top, right, bottom, left
    indent: float = 12.0           # first line of a paragraph
    space: float = 0.17            # between words, in model units
    paragraph_gap: float = 0.35    # extra space between paragraphs, in lines
    ink: str = "#1c2a5c"           # blue-black ballpoint
    width: float = 0.42            # mm stroke width
    slant: float = 0.0             # extra shear, positive leans right
    drift: float = 0.6             # mm of baseline wander along a line
    tilt: float = 0.5              # degrees a line may tilt
    seed: int = 7

    @property
    def scale(self) -> float:
        return self.x_height / X_HEIGHT  # mm per model unit


@dataclass
class Block:
    """One piece of a Letter. `align` is left, right or signature."""

    text: str
    align: str = "left"
    indent: bool = False
    gap_before: float = 0.0   # in lines
    underline: set[int] = field(default_factory=set)  # word indices to underline
    dashes: bool = False  # a page number: «- 2 -»


@dataclass
class Line:
    words: list[np.ndarray]
    page: int
    y: float      # baseline, mm
    x: float      # left, mm
    underline: list[tuple[float, float]] = field(default_factory=list)


def set_letter(blocks: list[Block], hand: Hand, style: Style) -> list[list[Line]]:
    """Write and set every block; returns the lines of each page."""
    rng = np.random.default_rng(style.seed)
    W, H = PAPER[style.paper]
    top, right, bottom, left = style.margin
    k = style.scale
    pages: list[list[Line]] = [[]]
    first_y = top + style.line * 0.6
    y = first_y

    def advance(lines_down: float):
        nonlocal y
        if not pages[-1]:
            return
        y += lines_down * style.line
        if y > H - bottom:
            pages.append([])
            y = first_y

    for b in blocks:
        words = hand.write(b.text)
        if b.dashes:
            words = [flanked(p) for p in words]
        widths = [(p[:, 0].max() - p[:, 0].min()) * k if len(p) else 0 for p in words]
        avail = W - left - right
        # Greedy fill, the way a hand fills a line.
        lines, cur, cur_w = [], [], 0.0
        first = True
        for i, (p, w) in enumerate(zip(words, widths)):
            start = style.indent if (first and b.indent) else 0.0
            add = w + (style.space * k if cur else 0)
            if cur and start + cur_w + add > avail:
                lines.append((cur, start))
                cur, cur_w, first = [], 0.0, False
                start = 0.0
                add = w
            cur.append(i)
            cur_w += add
        if cur:
            lines.append((cur, style.indent if (first and b.indent) else 0.0))
        for n, (idx, start) in enumerate(lines):
            advance(1 + (b.gap_before if n == 0 else 0))
            line_w = sum(widths[i] for i in idx) + style.space * k * (len(idx) - 1)
            if b.align == "right":
                x = W - right - line_w - rng.uniform(0, 3)
            elif b.align == "signature":
                x = W - right - line_w - avail * 0.12 + rng.uniform(-2, 2)
            else:
                x = left + start + rng.normal(0, 0.6)
            placed, under, cx = [], [], 0.0
            for i in idx:
                p = words[i]
                if not len(p):
                    continue
                q = p.copy()
                q[:, 0] -= p[:, 0].min()
                q[:, :2] *= k
                q[:, 0] += cx
                if i in b.underline:
                    under.append((cx, cx + widths[i]))
                placed.append(q)
                cx += widths[i] + style.space * k
            pages[-1].append(Line(placed, len(pages) - 1, y, x, under))
    return [p for p in pages if p]


def ink_path(points: np.ndarray, transform) -> list[str]:
    out = []
    for a, b in pengpt.strokes(points):
        xy = transform(points[a:b, :2])
        if b - a == 1:
            xy = np.concatenate([xy, xy + 0.05])
        out.append("M" + " L".join(f"{u:.2f} {v:.2f}" for u, v in xy))
    return out


def page_svg(lines: list[Line], style: Style, number: int | None = None) -> str:
    W, H = PAPER[style.paper]
    rng = np.random.default_rng(style.seed + 101 * (number or 0))
    paths = []
    for ln in lines:
        angle = math.radians(rng.normal(0, style.tilt / 2))
        span = max((w[:, 0].max() for w in ln.words if len(w)), default=1.0)
        phase, amp = rng.uniform(0, 2 * np.pi), rng.uniform(0, style.drift)

        def transform(xy, ln=ln, angle=angle, span=span, phase=phase, amp=amp):
            x, y = xy[:, 0], xy[:, 1]
            x = x - style.slant * y
            y = y + amp * np.sin(phase + 2.2 * x / max(span, 1.0))
            c, s = math.cos(angle), math.sin(angle)
            return np.stack([ln.x + c * x - s * y, ln.y + s * x + c * y], 1)

        for w in ln.words:
            paths += ink_path(w, transform)
        for a, b in ln.underline:
            xs = np.linspace(a - 0.5, b + 0.5, 8)
            ys = np.full_like(xs, style.x_height * 0.55) + np.linspace(0, rng.uniform(-0.4, 0.4), 8)
            paths.append("M" + " L".join(f"{u:.2f} {v:.2f}" for u, v in transform(np.stack([xs, ys], 1))))
    body = "".join(f'<path d="{d}"/>' for d in paths)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}">'
        f'<g fill="none" stroke="{style.ink}" stroke-width="{style.width}" stroke-linecap="round" '
        f'stroke-linejoin="round" opacity="0.93">{body}</g></svg>'
    )
