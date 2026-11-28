"""Print HTML pages to PDF with headless Chrome: exact page sizes, real vectors."""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile

CHROME = [
    os.environ.get("CHROME", ""),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    shutil.which("google-chrome") or "",
    shutil.which("chromium") or "",
]


def chrome() -> str:
    for c in CHROME:
        if c and os.path.exists(c):
            return c
    raise SystemExit("Chrome not found: set CHROME to a Chrome or Chromium binary")


def print_pdf(html: str, out: str, keep_html: bool = True) -> str:
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    src = os.path.splitext(out)[0] + ".html" if keep_html else tempfile.mktemp(suffix=".html")
    with open(src, "w") as f:
        f.write(html)
    subprocess.run([chrome(), "--headless", "--disable-gpu", "--no-pdf-header-footer", "--allow-file-access-from-files",
                    f"--print-to-pdf={os.path.abspath(out)}", "file://" + os.path.abspath(src)],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if not keep_html:
        os.remove(src)
    return out


def paper_css(size: tuple[float, float], colour: str = "#f6f1e4") -> str:
    """One sheet per .sheet, writing paper with a faint grain."""
    grain = (
        "data:image/svg+xml;utf8,"
        "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>"
        "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/>"
        "<feColorMatrix values='0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0.07 0'/></filter>"
        "<rect width='300' height='300' filter='url(%23n)'/></svg>"
    )
    return f"""
@page {{ size: {size[0]}mm {size[1]}mm; margin: 0; }}
* {{ box-sizing: border-box; }}
html, body {{ margin: 0; padding: 0; background: {colour}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
.sheet {{ position: relative; width: {size[0]}mm; height: {size[1]}mm; overflow: hidden; page-break-after: always; break-after: page;
  background-color: {colour}; background-image: url("{grain}"); }}
.sheet:last-child {{ page-break-after: auto; break-after: auto; }}
.sheet > svg {{ position: absolute; inset: 0; width: 100%; height: 100%; }}
"""
