"""A Hand: one PenGPT writer, with what the model cannot write added by us.

PenGPT reads text as UTF-8 bytes and learned English words, so Italian trips
it in four places, and a Hand takes each away from it:

- accented letters («città» comes out as garbage): the model writes the bare
  letter and we draw the accent over it, as a person adds it after the word;
- elisions («l'ho» comes out as «lHo»): the model writes «l» and «ho» as two
  words, and we join them with an apostrophe;
- the full stop, comma, colon and semicolon at the end of a word, which it often drops:
  we write the word without them and put them after the ink;
- guillemets « », which it never saw: we draw them.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import unicodedata
from dataclasses import dataclass, field

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "vendor", "pengpt"))
import pen as pengpt  # noqa: E402

MODEL = os.path.join(ROOT, ".cache", "hand.npz")
STROKES = os.path.join(ROOT, ".cache", "strokes")
VERSION = 1  # bump when the model or the way it is called changes, to drop the cache

# Model units: baseline at y = 0, y points down, x-height about 0.123.
X_HEIGHT = 0.123

FOLD = {"“": '"', "”": '"', "„": '"', "‘": "'", "’": "'", "—": "-", "–": "-", "…": "..."}
GRAVE, ACUTE, UMLAUT = "̀", "́", "̈"
OPEN, CLOSE, DOT, COMMA, COLON, SEMI = "«", "»", ".", ",", ":", ";"
TRAILING = {"»": CLOSE, ".": DOT, ",": COMMA, ":": COLON, ";": SEMI}
ELISION = re.compile(r"(?<=[^\W\d_])['’](?=[^\W\d_])")


@dataclass(frozen=True)
class Mark:
    index: int  # letter position in the bare word; trailing marks sit at len(word)
    kind: str   # GRAVE, ACUTE, UMLAUT, OPEN, CLOSE, DOT, COMMA, COLON or SEMI


def bare(word: str) -> tuple[str, list[Mark]]:
    """The word the model can write, and the marks it must not try to."""
    core = word.rstrip("».,:;")
    if not core.strip("«"):  # a word that is only punctuation: let the model write it
        core = word
    out, marks = "", []
    for ch in core:
        if ch in (OPEN, CLOSE):
            marks.append(Mark(len(out), ch))
            continue
        parts = unicodedata.normalize("NFD", FOLD.get(ch, ch))
        for a in parts[1:]:
            if a in (GRAVE, ACUTE, UMLAUT):
                marks.append(Mark(len(out), a))
        out += parts[:1] if parts[:1].isascii() else ""
    marks += [Mark(len(out), TRAILING[ch]) for ch in word[len(core):]]
    return out, marks


@dataclass
class Hand:
    """One writer of the PenGPT model and how it holds the pen."""

    writer: str
    temperature: float = 0.0
    top_k: int | None = None
    seed: int = 0
    # Words the model gets wrong in context, written again alone, sampled with this seed.
    # A long word whose minims the model loses count of can instead be written in
    # pieces, joined as a hand does when it lifts the pen: "soprannumero.": "sopran|numero.".
    retakes: dict[str, int | str] = field(default_factory=dict)

    _pen = None

    @classmethod
    def pen(cls):
        if cls._pen is None:
            cls._pen = pengpt.Pen(MODEL)
        return cls._pen

    def ink(self, units: list[str], temperature: float, top_k: int | None, seed: int) -> list[np.ndarray]:
        """The model's own strokes for each unit, cached on disk: the slow part."""
        key = hashlib.sha1(json.dumps([VERSION, self.writer, temperature, top_k, seed, units]).encode()).hexdigest()
        path = os.path.join(STROKES, key + ".npz")
        if os.path.exists(path):
            z = np.load(path)
            return [z[f"w{i}"] for i in range(len(units))]
        out = self.pen().write(" ".join(u or "." for u in units), self.writer, temperature, top_k, seed)
        os.makedirs(STROKES, exist_ok=True)
        np.savez_compressed(path, **{f"w{i}": p for i, p in enumerate(out)})
        return out

    def write(self, text: str) -> list[np.ndarray]:
        """One (n, 3) array of x, y, pen-down per word of `text`."""
        words = text.split()
        # Each word is one or more units: «nell'officina» is «nell» and «officina».
        groups = [[bare(p) for p in ELISION.split(w)] for w in words]
        written = self.ink([b for g in groups for b, _ in g], self.temperature, self.top_k, self.seed)
        out, at = [], 0
        for w, g in zip(words, groups):
            ink, retake, lift = written[at:at + len(g)], self.retakes.get(w), False
            if isinstance(retake, int):  # written again alone, sampled with this seed
                ink = self.ink([b for b, _ in g], 0.4, 5, retake)
            elif isinstance(retake, str):  # written in pieces, «sopran|numero.», and joined
                g = [bare(p) for p in retake.split("|")]
                ink, lift = self.ink([b for b, _ in g], self.temperature, self.top_k, self.seed), True
            out.append(elide([marked(p, b, m) for p, (b, m) in zip(ink, g)], lift))
            at += len(ELISION.split(w))
        return out


def ink_x(points: np.ndarray) -> tuple[float, float]:
    ink = points[points[:, 2] == 1] if (points[:, 2] == 1).any() else points
    return ink[:, 0].min(), ink[:, 0].max()


def letter_box(points: np.ndarray, word: str, index: int) -> tuple[float, float]:
    """Where letter `index` of `word` probably sits along x: (centre, width).

    The pen does not say which ink is which letter, so the word's width is
    shared out by letter, with narrow letters counting less. Accents in Italian
    sit almost always on the last letter, where the guess is good.
    """
    lo, hi = ink_x(points)
    weight = [0.45 if c in "iljtrf.,;:'!" else 1.3 if c in "mwMW" else 1.0 for c in word]
    total = sum(weight) or 1.0
    start = lo + (hi - lo) * sum(weight[:index]) / total
    width = (hi - lo) * weight[index] / total
    if index == len(word) - 1:  # a last letter ends in an exit stroke: pull back a little
        start -= width * 0.1
    return start + width / 2, width


def stroke(*pts) -> np.ndarray:
    """A pen-down stroke through `pts`, with a pen-up before and after."""
    pts = np.asarray(pts, float)
    return np.concatenate([[[*pts[0], 0]], np.c_[pts, np.ones(len(pts))], [[*pts[-1], 0]]])


def tittle(points: np.ndarray, cx: float, w: float):
    """The dot of an i near x = cx: a tiny stroke above the x-height."""
    best = None
    for a, b in pengpt.strokes(points):
        xy = points[a:b, :2]
        size = np.ptp(xy, 0).max() if b - a > 1 else 0.0
        x = xy[:, 0].mean()
        if xy[:, 1].max() < -X_HEIGHT * 1.05 and size < 0.06 and abs(x - cx) < 1.6 * w + 0.03:
            if best is None or abs(x - cx) < best[0]:
                best = (abs(x - cx), (a, b))
    return best and best[1]


def guillemet(anchor: float, kind: str) -> np.ndarray:
    """Two small chevrons at mid x-height, opening before `anchor` or closing after it."""
    h, d, gap, mid = X_HEIGHT * 0.32, X_HEIGHT * 0.28, X_HEIGHT * 0.3, -X_HEIGHT * 0.5
    sign = -1 if kind == OPEN else 1
    out = []
    for k in range(2):
        tip = anchor + sign * (gap + d + k * d * 0.95)
        out.append(stroke((tip - sign * d, mid - h), (tip, mid), (tip - sign * d, mid + h)))
    return np.concatenate(out)


def dot(x: float) -> np.ndarray:
    r = X_HEIGHT * 0.05
    return stroke((x, -r), (x + r, 0), (x, r * 0.6), (x - r * 0.6, 0), (x, -r))


def comma(x: float) -> np.ndarray:
    return stroke((x + 0.004, -0.004), (x + 0.008, 0.01), (x + 0.004, 0.028), (x - 0.012, 0.05))


def apostrophe(x: float) -> np.ndarray:
    top = -X_HEIGHT * 1.75
    return stroke((x + 0.006, top), (x + 0.008, top + 0.012), (x + 0.004, top + 0.03), (x - 0.008, top + 0.048))


def elide(parts: list[np.ndarray], lift: bool = False) -> np.ndarray:
    """Join the units of an elided word with an apostrophe (l + ho -> l'ho),
    or, when the pen was only lifted, with a hair of space (sopran + numero)."""
    parts = [p for p in parts if len(p)]
    if not parts:
        return np.zeros((0, 3))
    out = parts[0]
    for p in parts[1:]:
        q = p.copy()
        if lift:
            q[:, 0] += ink_x(out)[1] + 0.012 - ink_x(p)[0]
            out = np.concatenate([out, q])
            continue
        x = ink_x(out)[1] + 0.03
        q[:, 0] += x + 0.035 - ink_x(p)[0]
        out = np.concatenate([out, apostrophe(x), q])
    return out


def marked(points: np.ndarray, word: str, marks: list[Mark]) -> np.ndarray:
    """The model's ink for `word`, with the marks it was not asked to write."""
    if not marks or not len(points):
        return points
    strokes = [points]
    for m in marks:
        if m.kind in TRAILING.values() and m.index >= len(word):
            # Trailing marks follow each other after everything inked so far.
            right = ink_x(np.concatenate(strokes))[1]
            gap = X_HEIGHT * (0.22 if m.kind == CLOSE else 0.28)
            high = [0, -X_HEIGHT * 0.75, 0]  # the upper dot of : and ;
            strokes.append({CLOSE: lambda x: guillemet(x - X_HEIGHT * 0.3, CLOSE), DOT: dot, COMMA: comma,
                            COLON: lambda x: np.concatenate([dot(x) + high, dot(x)]),
                            SEMI: lambda x: np.concatenate([dot(x + 0.004) + high, comma(x)])}[m.kind](right + gap))
            continue
        if m.kind == OPEN:
            strokes.append(guillemet(ink_x(points)[0], OPEN))
            continue
        if m.kind == CLOSE:  # inside a word: after the letter before it
            cx, w = letter_box(points, word, max(m.index - 1, 0))
            strokes.append(guillemet(cx + w / 2, CLOSE))
            continue
        if m.index >= len(word):
            continue
        cx, w = letter_box(points, word, m.index)
        if word[m.index] in "ij":
            # An accented i has no dot: take the dot away, and put the accent where it was.
            found = tittle(points, cx, w)
            if found is not None:
                a, b = found
                cx = points[a:b, 0].mean()
                points = points.copy()
                points[a:b, 2] = 0
                strokes[0] = points
        top = -X_HEIGHT * (2.35 if word[m.index].isupper() else 1.45)
        if m.kind == UMLAUT:
            strokes += [dot(cx + dx).__add__([0, top, 0]) for dx in (-0.25 * w, 0.25 * w)]
            continue
        length = X_HEIGHT * 0.55
        slant = 0.55 * length
        if m.kind == GRAVE:   # from high left down to the right
            a, b = (cx - slant / 2, top - length / 2), (cx + slant / 2, top + length / 2)
        else:                 # acute: from low left up to the right
            a, b = (cx - slant / 2, top + length / 2), (cx + slant / 2, top - length / 2)
        strokes.append(stroke(*np.linspace(a, b, 6)))
    return np.concatenate(strokes)


def flanked(points: np.ndarray) -> np.ndarray:
    """A page number between two dashes: «- 2 -»."""
    lo, hi = ink_x(points)
    y, d, gap = -X_HEIGHT * 0.5, X_HEIGHT * 0.7, X_HEIGHT * 0.6
    return np.concatenate([stroke((lo - gap - d, y + 0.004), (lo - gap, y)), points, stroke((hi + gap, y), (hi + gap + d, y - 0.004))])
