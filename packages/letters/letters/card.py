"""A printed card: the Story's introduction, typeset, not handwritten.

It is the publisher's sheet in the envelope, so it speaks in the collana's
voice: League Gothic for titles, Archivo for the text (the website's fonts,
both OFL, read from apps/website/app/fonts).
"""

from __future__ import annotations

import base64
import html
import os
import re

from .hand import ROOT
from .pdf import paper_css

FONTS = os.path.join(ROOT, "..", "..", "apps", "website", "app", "fonts")


def font(name: str, file: str) -> str:
    data = base64.b64encode(open(os.path.join(FONTS, file), "rb").read()).decode()
    return f"@font-face {{ font-family: '{name}'; src: url(data:font/ttf;base64,{data}) format('truetype'); }}"


def inline(text: str) -> str:
    text = html.escape(re.sub(r"(\w)'(\w)", "\\1’\\2", text), quote=False)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    return re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)


def body(markdown: str) -> tuple[str, str]:
    """(title, html) from Letter Markdown: a lone **line** is a heading."""
    out, items, title = [], [], ""
    for block in re.split(r"\n\s*\n", markdown.strip()):
        lines = [l.strip() for l in block.strip().splitlines()]
        heading = re.fullmatch(r"\*\*(.+)\*\*", lines[0])
        if heading and not title and not out:
            title = heading.group(1)
            lines = lines[1:]
        elif heading:
            out.append(f"<h2>{inline(heading.group(1))}</h2>")
            lines = lines[1:]
        items = [l[2:] for l in lines if l.startswith("- ")]
        rest = [l for l in lines if not l.startswith("- ")]
        if rest:
            out.append(f"<p>{inline(' '.join(rest))}</p>")
        if items:
            out.append("<ul>" + "".join(f"<li>{inline(i)}</li>" for i in items) + "</ul>")
    # The card's last paragraph is its motto.
    if out and out[-1].startswith("<p>"):
        out[-1] = out[-1].replace("<p>", '<p class="motto">', 1)
    return title, "\n".join(out)


def card_html(markdown: str, story: str, collana: str, size=(148.0, 210.0)) -> str:
    title, content = body(markdown)
    return f"""<!doctype html><html lang="it"><head><meta charset="utf-8"><title>{html.escape(title)}</title><style>
{font('League Gothic', 'LeagueGothic-Variable.ttf')}
{font('Archivo', 'Archivo-Regular.ttf')}
{paper_css(size, '#f3ecdc')}
:root {{ --ink: #1f1c18; --red: #9c3b2a; --blue: #2c4a6b; --rule: #1f1c1833; }}
.sheet {{ padding: 11mm 12mm 10mm; color: var(--ink); font: 9.1pt/1.45 Archivo, sans-serif; display: flex; flex-direction: column; }}
.frame {{ position: absolute; inset: 5mm; border: 0.35mm solid var(--ink); outline: 0.2mm solid var(--ink); outline-offset: -1.2mm; pointer-events: none; }}
header {{ text-align: center; margin-bottom: 4.2mm; }}
.collana {{ font: 7.2pt/1 'League Gothic'; letter-spacing: 0.22em; text-transform: uppercase; color: var(--red); }}
.story {{ font: 11pt/1.1 'League Gothic'; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 1.2mm; color: var(--blue); }}
h1 {{ font: 25pt/0.95 'League Gothic'; letter-spacing: 0.04em; text-transform: uppercase; margin: 2.2mm 0 0; }}
header::after {{ content: ""; display: block; margin: 3mm auto 0; width: 28mm; border-top: 0.35mm solid var(--red); }}
h2 {{ font: 12.5pt/1 'League Gothic'; letter-spacing: 0.08em; text-transform: uppercase; color: var(--red); margin: 3.6mm 0 1.4mm;
  display: flex; gap: 2mm; align-items: center; }}
h2::after {{ content: ""; flex: 1; border-top: 0.2mm solid var(--rule); }}
p {{ margin: 0 0 1.6mm; }}
ul {{ margin: 0; padding: 0; list-style: none; }}
li {{ position: relative; padding-left: 4mm; margin-bottom: 1.15mm; }}
li::before {{ content: ""; position: absolute; left: 0.6mm; top: 1.45mm; width: 1.3mm; height: 1.3mm; background: var(--red); transform: rotate(45deg); }}
strong {{ font-weight: normal; font-family: 'League Gothic'; font-size: 1.22em; letter-spacing: 0.03em; line-height: 1; }}
em {{ font-style: italic; }}
.motto {{ margin-top: auto; padding-top: 3mm; text-align: center; font: 13pt/1.15 'League Gothic'; letter-spacing: 0.05em; text-transform: uppercase; color: var(--blue); }}
</style></head><body>
<section class="sheet"><div class="frame"></div>
<header><div class="collana">{html.escape(collana)}</div><div class="story">{html.escape(story)}</div><h1>{inline(title)}</h1></header>
{content}
</section></body></html>"""
