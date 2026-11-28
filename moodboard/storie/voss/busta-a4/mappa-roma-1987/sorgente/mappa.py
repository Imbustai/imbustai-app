"""Pianta di Roma 1987 (Nomentano · San Lorenzo · Esquilino), A3 orizzontale, scala 1:12.500, stile anni '80.

Uso:  python3 mappa.py osm.json OUT_DIR
Produce: mappa-roma-1987.svg (pulita) e mappa-roma-1987-segni.svg (con i segni a penna).
Dati stradali: © OpenStreetMap contributors (ODbL).
"""
import json, math, sys, os, re, html
from collections import defaultdict

OSM, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

# ------------------------------------------------------------------ geometry
SCALE = 12500
MM_PER_M = 1000 / SCALE
PAGE_W, PAGE_H = 420, 297
BAND = 5.0                                # lettered grid band around the map
FX0, FY0, FX1, FY1 = 10.0, 8.0, 410.0, 283.0   # outer frame; the title sits in its top band
TITLE_H = 22.0
MX, MY = FX0 + BAND, FY0 + TITLE_H + BAND        # map origin on the page (mm)
MW, MH = FX1 - BAND - MX, FY1 - BAND - MY
LAT1, LON_C = 41.9235, 12.5095
KY = 111132 * MM_PER_M
KX = 111320 * math.cos(math.radians(LAT1 - MH / KY / 2)) * MM_PER_M
LON0, LON1 = LON_C - MW / KX / 2, LON_C + MW / KX / 2
LAT0 = LAT1 - MH / KY
COLS, ROWS = 8, 5
# the legend box sits on the map, top-left, over Salario and Pinciano (no place of the story there)
LGX, LGY, LGW, LGH = MX + 4, MY + 4, 132.0, 92.0


def P(lon, lat):
    return (MX + (lon - LON0) * KX, MY + (LAT1 - lat) * KY)


# ------------------------------------------------------------------ palette (offset 1987, faded)
C = dict(
    paper="#F2EAD6", block="#ECCDB4", block_line="#C99F86", rail_yard="#DCD5C3",
    green="#BCD199", green_dark="#5E7A3A", cemetery="#CDD2B6", inst="#E3B9A0",
    road_case="#6B5646", primary="#E9A73B", secondary="#F3D163", tertiary="#FBF1C9",
    minor="#FFFBF0", ped="#F6EEDC", rail="#1E1E1E", walls="#6B3426", church="#8E2E2A",
    station="#5B5B5B", ink="#1F1B17", grey="#6E6257", district="#9A6E58",
    red_pen="#B4231B", metro="#C8341F", blue="#1F4E8C",
)
F_SERIF = "'PT Serif', 'Times New Roman', serif"
F_SANS = "'PT Sans Narrow', 'Arial Narrow', sans-serif"
F_PEN = "'Caveat', 'Bradley Hand', cursive"

# ------------------------------------------------------------------ load OSM
import gzip
d = json.load(gzip.open(OSM, "rt") if OSM.endswith(".gz") else open(OSM))
nodes, ways, rels = {}, [], []
for e in d["elements"]:
    if e["type"] == "node":
        nodes[e["id"]] = (e["lon"], e["lat"])
        if e.get("tags"):
            ways.append(dict(id=e["id"], node=True, tags=e["tags"], pt=(e["lon"], e["lat"])))
    elif e["type"] == "way":
        ways.append(dict(id=e["id"], tags=e.get("tags", {}), refs=e.get("nodes", [])))
    elif e["type"] == "relation":
        rels.append(e)
way_by_id = {w["id"]: w for w in ways if not w.get("node")}


def coords(w):
    return [nodes[r] for r in w["refs"] if r in nodes]


def proj(pts):
    return [P(*p) for p in pts]


def path_d(pp, close=False):
    if not pp:
        return ""
    s = "M" + " L".join(f"{x:.2f},{y:.2f}" for x, y in pp)
    return s + (" Z" if close else "")


def area(pp):
    a = 0
    for i in range(len(pp)):
        x1, y1 = pp[i]; x2, y2 = pp[(i + 1) % len(pp)]
        a += x1 * y2 - x2 * y1
    return abs(a) / 2


def centroid(pp):
    a = cx = cy = 0
    for i in range(len(pp)):
        x1, y1 = pp[i]; x2, y2 = pp[(i + 1) % len(pp)]
        f = x1 * y2 - x2 * y1
        a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f
    if abs(a) < 1e-9:
        return (sum(p[0] for p in pp) / len(pp), sum(p[1] for p in pp) / len(pp))
    return (cx / (3 * a), cy / (3 * a))


def stitch(seqs):
    """Join node-ref sequences sharing endpoints into chains (rings or lines)."""
    seqs = [list(s) for s in seqs if len(s) > 1]
    out = []
    while seqs:
        cur = seqs.pop(0)
        changed = True
        while changed and cur[0] != cur[-1]:
            changed = False
            for i, s in enumerate(seqs):
                if s[0] == cur[-1]:
                    cur += s[1:]
                elif s[-1] == cur[-1]:
                    cur += s[::-1][1:]
                elif s[-1] == cur[0]:
                    cur = s[:-1] + cur
                elif s[0] == cur[0]:
                    cur = s[::-1][:-1] + cur
                else:
                    continue
                seqs.pop(i); changed = True
                break
        out.append(cur)
    return out


def rel_rings(r):
    outers = [way_by_id[m["ref"]]["refs"] for m in r.get("members", [])
              if m["type"] == "way" and m.get("role") in ("outer", "") and m["ref"] in way_by_id]
    return [proj([nodes[n] for n in ring if n in nodes]) for ring in stitch(outers)]


# ------------------------------------------------------------------ classify features
def tag(w, k):
    return w["tags"].get(k)


polys = defaultdict(list)          # kind -> list of (pp, tags)
for w in ways:
    if w.get("node") or not w.get("refs") or w["refs"][0] != w["refs"][-1]:
        continue
    t = w["tags"]; pp = proj(coords(w))
    if len(pp) < 4:
        continue
    if t.get("landuse") == "railway":
        polys["rail_yard"].append((pp, t))
    elif t.get("landuse") == "cemetery":
        polys["cemetery"].append((pp, t))
    elif t.get("leisure") in ("park", "garden") or t.get("landuse") == "grass":
        polys["green"].append((pp, t))
    elif t.get("leisure") in ("pitch", "playground"):
        polys["green_small"].append((pp, t))
    elif t.get("amenity") in ("university", "hospital", "college"):
        polys["inst"].append((pp, t))
    elif t.get("amenity") == "place_of_worship" and t.get("building"):
        polys["church"].append((pp, t))
    elif t.get("building") == "train_station" or (t.get("railway") == "station" and t.get("building")):
        polys["station"].append((pp, t))
for r in rels:
    t = r.get("tags", {})
    kind = None
    if t.get("leisure") in ("park", "garden"):
        kind = "green"
    elif t.get("amenity") in ("university", "hospital"):
        kind = "inst"
    if kind:
        for pp in rel_rings(r):
            if len(pp) > 3:
                polys[kind].append((pp, t))

ROAD_CLASS = {"motorway": 0, "trunk": 0, "primary": 1, "secondary": 2, "tertiary": 3,
              "unclassified": 4, "residential": 4, "living_street": 4, "pedestrian": 5, "service": 6}
ROAD_W = {0: 2.5, 1: 2.25, 2: 1.95, 3: 1.6, 4: 1.25, 5: 1.1, 6: 0.7}
ROAD_FILL = {0: C["primary"], 1: C["primary"], 2: C["secondary"], 3: C["tertiary"],
             4: C["minor"], 5: C["ped"], 6: C["minor"]}
roads = []
for w in ways:
    if w.get("node"):
        continue
    t = w["tags"]; hw = t.get("highway")
    if hw not in ROAD_CLASS:
        continue
    if hw == "service" and not t.get("name"):
        continue
    if t.get("tunnel") in ("yes", "building_passage") or t.get("area") == "yes":
        continue
    roads.append((ROAD_CLASS[hw], proj(coords(w)), t, w))

rails_main, rails_yard = [], []
for w in ways:
    if w.get("node"):
        continue
    t = w["tags"]
    if t.get("railway") == "rail" and t.get("tunnel") != "yes":
        (rails_yard if t.get("service") else rails_main).append(proj(coords(w)))
walls = [proj(coords(w)) for w in ways if not w.get("node")
         and (w["tags"].get("historic") == "citywalls" or w["tags"].get("barrier") == "city_wall")]

# ------------------------------------------------------------------ label collision index
occ = defaultdict(list)
CELL = 4.0


def _cells(x, y, r):
    for gx in range(int((x - r) // CELL), int((x + r) // CELL) + 1):
        for gy in range(int((y - r) // CELL), int((y + r) // CELL) + 1):
            yield gx, gy


def free(circles):
    for x, y, r in circles:
        if not (MX + 1 < x < MX + MW - 1 and MY + 1 < y < MY + MH - 1):
            return False
        for c in _cells(x, y, r):
            for (ox, oy, orr) in occ[c]:
                if (x - ox) ** 2 + (y - oy) ** 2 < (r + orr) ** 2:
                    return False
    return True


def take(circles):
    for x, y, r in circles:
        for c in _cells(x, y, r):
            occ[c].append((x, y, r))


def box_circles(cx, cy, w, h):
    n = max(1, int(w / h) + 1)
    return [(cx - w / 2 + (i + 0.5) * w / n, cy, max(h, w / n) * 0.55) for i in range(n)]


# ------------------------------------------------------------------ name abbreviations
TYPES = [("Circonvallazione", "Circ.ne"), ("Piazzale", "P.le"), ("Piazza", "P.za"), ("Viale", "V.le"),
         ("Largo", "L.go"), ("Vicolo", "Vic."), ("Via", "V."), ("Galleria", "Gall.")]
CHAR_W = 0.43   # em, PT Sans Narrow average


def text_w(s, fs):
    caps = sum(1 for ch in s if ch.isupper())
    return fs * (CHAR_W * len(s) + 0.12 * caps)


def variants(name):
    yield name
    words = name.split()
    typ = next((a for a, _ in TYPES if words and words[0] == a), None)
    if len(words) >= 4 and typ:
        mid = [w[0] + "." if w[0].isupper() and w not in ("dei", "del", "della", "di", "delle", "degli") else w
               for w in words[1:-1]]
        yield " ".join([words[0]] + mid + [words[-1]])
    for a, b in TYPES:
        if name.startswith(a + " "):
            short = b + name[len(a):]
            yield short
            w2 = short.split()
            if len(w2) >= 4:
                mid = [w[0] + "." if w[0].isupper() and w not in ("dei", "del", "della", "di") else w for w in w2[1:-1]]
                yield " ".join([w2[0]] + mid + [w2[-1]])
            break


# ------------------------------------------------------------------ street label placement
def cumlen(pp):
    L = [0.0]
    for i in range(1, len(pp)):
        L.append(L[-1] + math.dist(pp[i - 1], pp[i]))
    return L


def at(pp, L, s):
    for i in range(1, len(pp)):
        if L[i] >= s:
            t = (s - L[i - 1]) / max(L[i] - L[i - 1], 1e-9)
            return (pp[i - 1][0] + t * (pp[i][0] - pp[i - 1][0]), pp[i - 1][1] + t * (pp[i][1] - pp[i - 1][1]))
    return pp[-1]


def sub(pp, L, a, b, step=0.6):
    out, s = [], a
    while s < b:
        out.append(at(pp, L, s)); s += step
    out.append(at(pp, L, b))
    return out


def bend(seg):
    if len(seg) < 3:
        return 0
    tot = 0
    for i in range(1, len(seg) - 1):
        a1 = math.atan2(seg[i][1] - seg[i - 1][1], seg[i][0] - seg[i - 1][0])
        a2 = math.atan2(seg[i + 1][1] - seg[i][1], seg[i + 1][0] - seg[i][0])
        da = abs((a2 - a1 + math.pi) % (2 * math.pi) - math.pi)
        tot = max(tot, da)
    return tot


# Names that did not exist in 1987, and modern names put back as they were then.
SKIP = {"Largo Federico Fellini", "Piazza Vittorio Emanuele Secondo"}
RENAME = {"Roma Termini": "Stazione Termini", "Sapienza Università di Roma": "Città Universitaria",
          "Cimitero monumentale di Campo Verano": "Cimitero del Verano"}
STORY = ["Via Rodolfo Lanciani", "Piazza dei Sanniti", "Via dei Volsci", "Via Tiburtina", "Via di San Vitale"]


def name87(nm):
    if not nm or nm in SKIP or "Facoltà" in nm or " - " in nm:
        return None
    return RENAME.get(nm, nm)


chains = defaultdict(list)   # name -> list of (cls, node-ref seq)
for cls, pp, t, w in roads:
    if name87(t.get("name")):
        chains[t["name"]].append((cls, w["refs"]))

FS = {0: 1.95, 1: 1.9, 2: 1.75, 3: 1.6, 4: 1.42, 5: 1.35, 6: 1.25}
labels_svg, defs_paths = [], []
pid = [0]
index_entries = {}


def grid_ref(x, y):
    col = int((x - MX) / (MW / COLS)); row = int((y - MY) / (MH / ROWS))
    col = min(max(col, 0), COLS - 1); row = min(max(row, 0), ROWS - 1)
    return f"{'ABCDEFGH'[col]} {row + 1}"


def reserve_legend():
    """Keep labels out from under the legend box."""
    y = LGY + 2
    while y < LGY + LGH:
        x = LGX + 2
        while x < LGX + LGW:
            take([(x, y, 2.6)])
            x += 3
        y += 3


def place_on_line(name, cls, pp):
    L = cumlen(pp); tot = L[-1]
    fs = FS[cls]
    placed = 0
    for text in variants(name):
        tw = text_w(text, fs) * 1.08
        if tw > tot * 0.95:
            continue
        cands = []
        step = max(1.5, tw / 4)
        s = 0.2
        while s + tw <= tot - 0.2:
            seg = sub(pp, L, s, s + tw)
            b = bend(seg)
            if b < 0.45:
                mid = s + tw / 2
                cands.append((b * 3 + abs(mid - tot / 2) / max(tot, 1) * 0.6, s, seg))
            s += step
        cands.sort(key=lambda c: c[0])
        used = []
        for score, s, seg in cands:
            if any(abs(s - u) < tw + 70 for u in used):
                continue
            circles = [(x, y, fs * 0.62) for x, y in seg[::max(1, int(fs / 0.6))]]
            if not free(circles):
                continue
            take(circles)
            used.append(s)
            if seg[-1][0] < seg[0][0]:
                seg = seg[::-1]
            pid[0] += 1
            defs_paths.append(f'<path id="lp{pid[0]}" d="{path_d(seg)}"/>')
            weight = "700" if cls <= 1 else "400"
            labels_svg.append(
                f'<text font-family="{F_SANS}" font-size="{fs:.2f}" font-weight="{weight}" fill="{C["ink"]}" '
                f'letter-spacing="0.02"><textPath href="#lp{pid[0]}" startOffset="50%" text-anchor="middle" '
                f'dominant-baseline="central">{html.escape(text)}</textPath></text>')
            index_entries.setdefault(name, grid_ref(*seg[len(seg) // 2]))
            placed += 1
            if tot < 3 * tw + 70 or placed >= 3:
                return placed
        if placed:
            return placed
    return placed


def place_horizontal(text, x, y, fs, family=F_SANS, weight="400", style="normal", fill=None, spacing=0.0,
                     anchor_name=None, force=False):
    tw = text_w(text, fs) + spacing * len(text)
    circles = box_circles(x, y, tw, fs)
    if not force and not free(circles):
        return False
    take(circles)
    labels_svg.append(
        f'<text x="{x:.2f}" y="{y:.2f}" text-anchor="middle" dominant-baseline="central" font-family="{family}" '
        f'font-size="{fs:.2f}" font-weight="{weight}" font-style="{style}" letter-spacing="{spacing}" '
        f'fill="{fill or C["ink"]}">{html.escape(text)}</text>')
    if anchor_name:
        index_entries.setdefault(anchor_name, grid_ref(x, y))
    return True


# ------------------------------------------------------------------ points of interest (1987)
METRO_A = [("Termini", 12.5008, 41.9010), ("Repubblica", 12.4953, 41.9024), ("Vittorio Emanuele", 12.5057, 41.8946)]
QUESTURA = (12.4934, 41.8996)        # via di San Vitale 15
DISTRICTS = [("NOMENTANO", 12.5225, 41.9152), ("SAN LORENZO", 12.5190, 41.8968), ("ESQUILINO", 12.5045, 41.8955),
             ("CASTRO PRETORIO", 12.5045, 41.9055), ("SALLUSTIANO", 12.4925, 41.9080), ("TRIESTE", 12.5085, 41.9205),
             ("TIBURTINO", 12.5290, 41.9025)]


# ------------------------------------------------------------------ SVG building
def svg_map(with_pen):
    occ.clear(); labels_svg.clear(); defs_paths.clear(); index_entries.clear(); pid[0] = 0
    reserve_legend()
    g = []
    clip = f'<clipPath id="mapclip"><rect x="{MX}" y="{MY}" width="{MW:.2f}" height="{MH:.2f}"/></clipPath>'
    pats = (
        f'<pattern id="cem" width="3.2" height="3.2" patternUnits="userSpaceOnUse">'
        f'<rect width="3.2" height="3.2" fill="{C["cemetery"]}"/>'
        f'<path d="M1.6,0.7 V2.5 M1.0,1.3 H2.2" stroke="{C["green_dark"]}" stroke-width="0.18"/></pattern>'
        f'<pattern id="park" width="2.6" height="2.6" patternUnits="userSpaceOnUse">'
        f'<rect width="2.6" height="2.6" fill="{C["green"]}"/><circle cx="1.3" cy="1.3" r="0.28" fill="{C["green_dark"]}" opacity=".45"/></pattern>'
        f'<pattern id="yard" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
        f'<rect width="1.6" height="1.6" fill="{C["rail_yard"]}"/><line x1="0" y1="0" x2="0" y2="1.6" stroke="#B9B09C" stroke-width="0.25"/></pattern>'
    )
    # ---- base: built-up blocks
    g.append(f'<g id="isolati"><rect x="{MX}" y="{MY}" width="{MW:.2f}" height="{MH:.2f}" fill="{C["block"]}"/></g>')
    # ---- areas
    # Solid fills per polygon; each texture is laid once over the union of its polygons (a clip path),
    # so the PDF carries one pattern per texture instead of one per polygon.
    a = ['<g id="aree">']
    clips = []
    for kind, fill, tex in (("rail_yard", C["rail_yard"], "yard"), ("green", C["green"], "park"),
                            ("cemetery", C["cemetery"], "cem")):
        ds = [path_d(pp, True) for pp, t in polys[kind]]
        if kind == "cemetery":
            a += [f'<path d="{dd}" fill="{fill}" stroke="{C["green_dark"]}" stroke-width="0.25"/>' for dd in ds]
        else:
            a += [f'<path d="{dd}" fill="{fill}"/>' for dd in ds]
        clips.append(f'<clipPath id="clip-{tex}"><path d="{" ".join(ds)}"/></clipPath>')
        a.append(f'<rect x="{MX}" y="{MY}" width="{MW:.2f}" height="{MH:.2f}" fill="url(#{tex}-tex)" clip-path="url(#clip-{tex})"/>')
    for pp, t in polys["inst"]:
        a.append(f'<path d="{path_d(pp, True)}" fill="{C["inst"]}" stroke="{C["block_line"]}" stroke-width="0.2"/>')
    for pp, t in polys["green_small"]:
        a.append(f'<path d="{path_d(pp, True)}" fill="{C["green"]}"/>')
    a.append('</g>')
    g += a
    pats += "".join(clips) + (
        f'<pattern id="park-tex" width="2.6" height="2.6" patternUnits="userSpaceOnUse">'
        f'<circle cx="1.3" cy="1.3" r="0.28" fill="{C["green_dark"]}" opacity=".45"/></pattern>'
        f'<pattern id="cem-tex" width="3.2" height="3.2" patternUnits="userSpaceOnUse">'
        f'<path d="M1.6,0.7 V2.5 M1.0,1.3 H2.2" stroke="{C["green_dark"]}" stroke-width="0.18"/></pattern>'
        f'<pattern id="yard-tex" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
        f'<line x1="0" y1="0" x2="0" y2="1.6" stroke="#B9B09C" stroke-width="0.25"/></pattern>')
    # ---- roads: casings then fills, by class (minor first)
    r = ['<g id="strade" stroke-linecap="round" stroke-linejoin="round" fill="none">']
    for cls in sorted(ROAD_W, reverse=True):
        for c2, pp, t, w in roads:
            if c2 == cls:
                r.append(f'<path d="{path_d(pp)}" stroke="{C["road_case"]}" stroke-width="{ROAD_W[cls] + 0.32:.2f}"/>')
    for cls in sorted(ROAD_W, reverse=True):
        for c2, pp, t, w in roads:
            if c2 == cls:
                r.append(f'<path d="{path_d(pp)}" stroke="{ROAD_FILL[cls]}" stroke-width="{ROAD_W[cls]:.2f}"/>')
    r.append('</g>')
    g += r
    # ---- buildings of note
    b = ['<g id="edifici">']
    for pp, t in polys["church"]:
        b.append(f'<path d="{path_d(pp, True)}" fill="{C["church"]}"/>')
    for pp, t in polys["station"]:
        b.append(f'<path d="{path_d(pp, True)}" fill="{C["station"]}"/>')
    b.append('</g>')
    g += b
    # ---- railways
    rl = ['<g id="ferrovie" fill="none" stroke-linecap="butt">']
    for pp in rails_yard:
        rl.append(f'<path d="{path_d(pp)}" stroke="#7D7466" stroke-width="0.22"/>')
    for pp in rails_main:
        rl.append(f'<path d="{path_d(pp)}" stroke="{C["rail"]}" stroke-width="0.95"/>')
    for pp in rails_main:
        rl.append(f'<path d="{path_d(pp)}" stroke="#F7F2E4" stroke-width="0.45" stroke-dasharray="1.6 1.6"/>')
    rl.append('</g>')
    g += rl
    # ---- city walls (Mura Aureliane)
    wl = ['<g id="mura" fill="none" stroke-linejoin="round">']
    for pp in walls:
        wl.append(f'<path d="{path_d(pp)}" stroke="{C["walls"]}" stroke-width="0.9"/>')
        wl.append(f'<path d="{path_d(pp)}" stroke="{C["walls"]}" stroke-width="1.9" stroke-dasharray="0.35 1.1"/>')
    wl.append('</g>')
    g += wl

    # ---- symbols first (they reserve space)
    sym = ['<g id="simboli">']
    for nm, lo, la in METRO_A:
        x, y = P(lo, la)
        take([(x, y, 1.9)])
        sym.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="1.45" fill="{C["metro"]}" stroke="#fff" stroke-width="0.3"/>'
                   f'<text x="{x:.2f}" y="{y + 0.05:.2f}" text-anchor="middle" dominant-baseline="central" font-family="{F_SANS}" '
                   f'font-size="1.9" font-weight="700" fill="#fff">M</text>')
    qx, qy = P(*QUESTURA)
    take([(qx, qy, 2.0)])
    sym.append(f'<rect x="{qx - 1.4:.2f}" y="{qy - 1.4:.2f}" width="2.8" height="2.8" fill="{C["blue"]}"/>'
               f'<text x="{qx:.2f}" y="{qy + 0.05:.2f}" text-anchor="middle" dominant-baseline="central" font-family="{F_SERIF}" '
               f'font-size="2.1" font-weight="700" fill="#fff">Q</text>')
    sym.append('</g>')

    # ---- area labels (institutions, parks, cemetery, stations)
    def area_label(kind, min_area, fs, style, fill, weight="400", upper=False):
        seen = set()
        items = sorted(polys[kind], key=lambda it: -area(it[0]))
        for pp, t in items:
            nm = name87(t.get("name"))
            if not nm or nm in seen or area(pp) < min_area:
                continue
            seen.add(nm)
            x, y = centroid(pp)
            txt = nm.upper() if upper else nm
            if text_w(txt, fs) > 2.2 * math.sqrt(area(pp)) + 25:
                continue
            place_horizontal(txt, x, y, fs, family=F_SERIF, style=style, fill=fill, weight=weight)

    area_label("cemetery", 50, 2.3, "italic", C["green_dark"], "700")
    area_label("inst", 120, 1.9, "italic", C["church"], "700")
    area_label("green", 60, 1.9, "italic", C["green_dark"], "700")
    for pp, t in polys["station"]:
        nm = name87(t.get("name"))
        if nm and area(pp) > 8:
            x, y = centroid(pp)
            place_horizontal(nm.upper(), x, y - 3.2, 1.8, family=F_SANS, weight="700", fill=C["ink"])

    # ---- street labels: big classes first, piazze as horizontal labels
    order = sorted(chains.items(), key=lambda kv: (kv[0] not in STORY, min(c for c, _ in kv[1]),
                                                   -sum(len(r) for _, r in kv[1])))
    for name, items in order:
        cls = min(c for c, _ in items)
        is_square = re.match(r"^(Piazza|Piazzale|Largo)\b", name)
        for seq in stitch([refs for _, refs in items]):
            pp = proj([nodes[n] for n in seq if n in nodes])
            if len(pp) < 2:
                continue
            pp_in = [p for p in pp if MX < p[0] < MX + MW and MY < p[1] < MY + MH]
            if len(pp_in) < 2:
                continue
            if is_square and (seq[0] == seq[-1] or cumlen(pp)[-1] < 60):
                x, y = centroid(pp) if seq[0] == seq[-1] else pp[len(pp) // 2]
                for txt in variants(name):
                    if place_horizontal(txt, x, y, FS[min(cls, 3)] + 0.1, weight="700" if cls <= 1 else "400",
                                        anchor_name=name):
                        break
                break
            if place_on_line(name, cls, pp):
                break
        if name in STORY and name not in index_entries:
            # the streets of the case must be named: fall back to a horizontal label on the longest piece
            seqs = [proj([nodes[n] for n in s if n in nodes]) for s in stitch([r for _, r in items])]
            pp = max(seqs, key=lambda q: cumlen(q)[-1])
            L = cumlen(pp)
            x, y = at(pp, L, L[-1] / 2)
            short = list(variants(name))[-1]
            place_horizontal(short, x, y - 1.6, FS[min(cls, 3)], weight="700", anchor_name=name, force=True)

    # ---- district names: big, spaced, behind everything else in the label layer
    dist = []
    for nm, lo, la in DISTRICTS:
        x, y = P(lo, la)
        dist.append(f'<text x="{x:.2f}" y="{y:.2f}" text-anchor="middle" dominant-baseline="central" '
                    f'font-family="{F_SERIF}" font-size="5.2" font-style="italic" letter-spacing="2.2" '
                    f'fill="{C["district"]}" opacity="0.55">{nm}</text>')

    # ---- grid lines
    grid = ['<g id="reticolo" stroke="#8C6E5C" stroke-width="0.15" opacity="0.6">']
    for i in range(1, COLS):
        x = MX + i * MW / COLS
        grid.append(f'<line x1="{x:.2f}" y1="{MY}" x2="{x:.2f}" y2="{MY + MH:.2f}"/>')
    for j in range(1, ROWS):
        y = MY + j * MH / ROWS
        grid.append(f'<line x1="{MX}" y1="{y:.2f}" x2="{MX + MW:.2f}" y2="{y:.2f}"/>')
    grid.append('</g>')

    mapbody = (f'<g clip-path="url(#mapclip)">{"".join(g)}<g id="quartieri">{"".join(dist)}</g>{"".join(grid)}'
               f'{"".join(sym)}<g id="nomi">{"".join(labels_svg)}</g></g>')

    # ---- frame: outer border, title band on top, lettered grid band around the map
    fr = ['<g id="cornice">']
    fr.append(f'<rect x="{FX0}" y="{FY0}" width="{FX1 - FX0}" height="{FY1 - FY0}" fill="{C["paper"]}" stroke="{C["ink"]}" stroke-width="0.6"/>')
    fr.append(f'<rect x="{FX0 + 1.2}" y="{FY0 + 1.2}" width="{FX1 - FX0 - 2.4}" height="{TITLE_H - 2.4}" fill="none" stroke="{C["ink"]}" stroke-width="0.2"/>')
    fr.append(f'<line x1="{FX0}" y1="{FY0 + TITLE_H}" x2="{FX1}" y2="{FY0 + TITLE_H}" stroke="{C["ink"]}" stroke-width="0.5"/>')
    tcx = (FX0 + FX1) / 2
    fr.append(f'<text x="{tcx}" y="{FY0 + 12.2}" text-anchor="middle" font-family="{F_SERIF}" font-size="10.5" font-weight="700" '
              f'letter-spacing="1.6" fill="{C["ink"]}">PIANTA DELLA CITTÀ DI ROMA</text>')
    fr.append(f'<text x="{tcx}" y="{FY0 + 18.4}" text-anchor="middle" font-family="{F_SERIF}" font-size="4.0" fill="{C["ink"]}">'
              f'Nomentano · San Lorenzo · Esquilino — Scala 1 : 12.500 — Edizione 1987</text>')
    fr.append(f'<rect x="{MX}" y="{MY}" width="{MW:.2f}" height="{MH:.2f}" fill="none" stroke="{C["ink"]}" stroke-width="0.35"/>')
    for i in range(COLS):
        x = MX + (i + 0.5) * MW / COLS
        for y in (MY - BAND / 2, MY + MH + BAND / 2):
            fr.append(f'<text x="{x:.2f}" y="{y:.2f}" text-anchor="middle" dominant-baseline="central" font-family="{F_SERIF}" '
                      f'font-size="3.0" font-weight="700" fill="{C["ink"]}">{"ABCDEFGH"[i]}</text>')
        xb = MX + i * MW / COLS
        if i:
            fr.append(f'<line x1="{xb:.2f}" y1="{MY - BAND:.2f}" x2="{xb:.2f}" y2="{MY:.2f}" stroke="{C["ink"]}" stroke-width="0.25"/>'
                      f'<line x1="{xb:.2f}" y1="{MY + MH:.2f}" x2="{xb:.2f}" y2="{MY + MH + BAND:.2f}" stroke="{C["ink"]}" stroke-width="0.25"/>')
    for j in range(ROWS):
        y = MY + (j + 0.5) * MH / ROWS
        for x in (MX - BAND / 2, MX + MW + BAND / 2):
            fr.append(f'<text x="{x:.2f}" y="{y:.2f}" text-anchor="middle" dominant-baseline="central" font-family="{F_SERIF}" '
                      f'font-size="3.0" font-weight="700" fill="{C["ink"]}">{j + 1}</text>')
        yb = MY + j * MH / ROWS
        if j:
            fr.append(f'<line x1="{MX - BAND:.2f}" y1="{yb:.2f}" x2="{MX:.2f}" y2="{yb:.2f}" stroke="{C["ink"]}" stroke-width="0.25"/>'
                      f'<line x1="{MX + MW:.2f}" y1="{yb:.2f}" x2="{MX + MW + BAND:.2f}" y2="{yb:.2f}" stroke="{C["ink"]}" stroke-width="0.25"/>')
    fr.append('</g>')

    # ---- imprint and data attribution (ODbL), under the frame
    attr = (f'<text x="{FX0}" y="{FY1 + 5}" font-family="{F_SERIF}" font-size="2.7" font-weight="700" letter-spacing="0.5" fill="{C["ink"]}">'
            f'EDIZIONI CARTOGRAFICHE CAPITOLINE — ROMA'
            f'<tspan font-family="{F_SANS}" font-weight="400" letter-spacing="0" fill="{C["grey"]}">'
            f'   ·   Proprietà letteraria riservata · Stampato in Italia · Agosto 1987 · L. 3.500</tspan></text>'
            f'<text x="{FX1}" y="{FY1 + 5}" text-anchor="end" font-family="{F_SANS}" font-size="2.2" fill="{C["grey"]}">'
            f'Dati stradali © OpenStreetMap contributors (ODbL), ridisegnati come nel 1987</text>')

    # ---- north arrow (inside the map, top-right corner)
    nx, ny = MX + MW - 11, MY + 12
    north = (f'<g id="nord"><circle cx="{nx}" cy="{ny}" r="7" fill="{C["paper"]}" stroke="{C["ink"]}" stroke-width="0.35"/>'
             f'<path d="M{nx},{ny - 6} L{nx + 2.2},{ny + 1.8} L{nx},{ny + 0.5} L{nx - 2.2},{ny + 1.8} Z" fill="{C["ink"]}"/>'
             f'<path d="M{nx},{ny - 6} L{nx + 2.2},{ny + 1.8} L{nx},{ny + 0.5} Z" fill="{C["paper"]}" stroke="{C["ink"]}" stroke-width="0.2"/>'
             f'<text x="{nx}" y="{ny + 5}" text-anchor="middle" font-family="{F_SERIF}" font-size="3" font-weight="700" fill="{C["ink"]}">N</text></g>')

    # ---- legend box on the map: «Segni convenzionali» and the scale
    pn = ['<g id="legenda">']
    pn.append(f'<rect x="{LGX + 1.2}" y="{LGY + 1.4}" width="{LGW}" height="{LGH}" fill="#000" opacity="0.18"/>')
    pn.append(f'<rect x="{LGX}" y="{LGY}" width="{LGW}" height="{LGH}" fill="{C["paper"]}" stroke="{C["ink"]}" stroke-width="0.45"/>')
    pn.append(f'<rect x="{LGX + 1.3}" y="{LGY + 1.3}" width="{LGW - 2.6}" height="{LGH - 2.6}" fill="none" stroke="{C["ink"]}" stroke-width="0.2"/>')
    cx = LGX + LGW / 2
    pn.append(f'<text x="{cx}" y="{LGY + 9}" text-anchor="middle" font-family="{F_SERIF}" font-size="4.8" font-weight="700" letter-spacing="1.0" fill="{C["ink"]}">SEGNI CONVENZIONALI</text>')
    items = [
        ("road", C["primary"], 2.6, "Strada di grande comunicazione"),
        ("road", C["secondary"], 2.2, "Strada principale"),
        ("road", C["tertiary"], 1.9, "Strada secondaria"),
        ("road", C["minor"], 1.5, "Altre strade"),
        ("road", C["ped"], 1.3, "Zona pedonale"),
        ("rail", None, 0, "Ferrovia"),
        ("yard", None, 0, "Scalo ferroviario"),
        ("walls", None, 0, "Mura Aureliane"),
        ("area", "url(#park)", 0, "Parchi e giardini"),
        ("area", "url(#cem)", 0, "Cimitero"),
        ("area", C["inst"], 0, "Università, ospedali"),
        ("area", C["block"], 0, "Abitato"),
        ("area", C["church"], 0, "Chiese"),
        ("metro", None, 0, "Metropolitana, linea A"),
        ("questura", None, 0, "Questura"),
    ]
    col_x = [LGX + 6, LGX + 6 + (LGW - 12) / 2 + 3]
    rows_per_col = 8
    LFS = 3.4
    for k, (kind, col, w, lab) in enumerate(items):
        x1 = col_x[k // rows_per_col]
        yy = LGY + 16.5 + (k % rows_per_col) * 7.6
        x2 = x1 + 11
        if kind == "road":
            pn.append(f'<line x1="{x1}" y1="{yy}" x2="{x2}" y2="{yy}" stroke="{C["road_case"]}" stroke-width="{w + 0.36}"/>'
                      f'<line x1="{x1}" y1="{yy}" x2="{x2}" y2="{yy}" stroke="{col}" stroke-width="{w}"/>')
        elif kind == "rail":
            pn.append(f'<line x1="{x1}" y1="{yy}" x2="{x2}" y2="{yy}" stroke="{C["rail"]}" stroke-width="1.1"/>'
                      f'<line x1="{x1}" y1="{yy}" x2="{x2}" y2="{yy}" stroke="#F7F2E4" stroke-width="0.5" stroke-dasharray="1.8 1.8"/>')
        elif kind == "yard":
            pn.append(f'<rect x="{x1}" y="{yy - 2.4}" width="11" height="4.8" fill="url(#yard)" stroke="{C["block_line"]}" stroke-width="0.15"/>')
        elif kind == "walls":
            pn.append(f'<line x1="{x1}" y1="{yy}" x2="{x2}" y2="{yy}" stroke="{C["walls"]}" stroke-width="1.0"/>'
                      f'<line x1="{x1}" y1="{yy}" x2="{x2}" y2="{yy}" stroke="{C["walls"]}" stroke-width="2.1" stroke-dasharray="0.4 1.2"/>')
        elif kind == "area":
            pn.append(f'<rect x="{x1}" y="{yy - 2.4}" width="11" height="4.8" fill="{col}" stroke="{C["block_line"]}" stroke-width="0.15"/>')
        elif kind == "metro":
            pn.append(f'<circle cx="{x1 + 5.5}" cy="{yy}" r="1.9" fill="{C["metro"]}"/><text x="{x1 + 5.5}" y="{yy + 0.05}" text-anchor="middle" '
                      f'dominant-baseline="central" font-family="{F_SANS}" font-size="2.5" font-weight="700" fill="#fff">M</text>')
        elif kind == "questura":
            pn.append(f'<rect x="{x1 + 3.7}" y="{yy - 1.8}" width="3.6" height="3.6" fill="{C["blue"]}"/><text x="{x1 + 5.5}" y="{yy + 0.05}" '
                      f'text-anchor="middle" dominant-baseline="central" font-family="{F_SERIF}" font-size="2.7" font-weight="700" fill="#fff">Q</text>')
        pn.append(f'<text x="{x2 + 2.6}" y="{yy}" dominant-baseline="central" font-family="{F_SANS}" font-size="{LFS}" fill="{C["ink"]}">{html.escape(lab)}</text>')
    # scale bar, checkered like the reference: 0–1000 m in 250 m steps
    sy = LGY + LGH - 10.5
    seg = 250 * MM_PER_M
    sx0 = cx - seg * 2
    for i in range(4):
        fill = C["ink"] if i % 2 == 0 else C["paper"]
        pn.append(f'<rect x="{sx0 + i * seg:.2f}" y="{sy}" width="{seg:.2f}" height="1.6" fill="{fill}" stroke="{C["ink"]}" stroke-width="0.2"/>')
    for i, lab in enumerate(["0", "250", "500", "750", "1000 m"]):
        pn.append(f'<text x="{sx0 + i * seg:.2f}" y="{sy - 1.6}" text-anchor="middle" font-family="{F_SANS}" font-size="2.9" fill="{C["ink"]}">{lab}</text>')
    pn.append(f'<text x="{cx}" y="{sy + 6.2}" text-anchor="middle" font-family="{F_SERIF}" font-size="3.2" font-style="italic" fill="{C["ink"]}">Scala 1 : 12.500 — 1 cm = 125 m</text>')
    pn.append('</g>')
    entries = []

    # ---- pen marks (optional layer)
    pen = []
    if with_pen:
        def ring(lon, lat, rx, ry, rot, note, dx, dy, anchor="start"):
            x, y = P(lon, lat)
            p = [f'<g transform="translate({x:.2f} {y:.2f}) rotate({rot})">']
            p.append(f'<ellipse rx="{rx}" ry="{ry}" fill="none" stroke="{C["red_pen"]}" stroke-width="0.42" opacity="0.9"/>')
            p.append(f'<ellipse rx="{rx + 0.7}" ry="{ry - 0.3}" transform="rotate(7)" fill="none" stroke="{C["red_pen"]}" stroke-width="0.3" opacity="0.75"/>')
            p.append('</g>')
            p.append(f'<text x="{x + dx:.2f}" y="{y + dy:.2f}" text-anchor="{anchor}" font-family="{F_PEN}" font-size="4.6" fill="{C["red_pen"]}" '
                     f'transform="rotate(-4 {x + dx:.2f} {y + dy:.2f})">{html.escape(note)}</text>')
            return "".join(p)
        pen.append('<g id="segni-a-penna">')
        pen.append(ring(12.5222, 41.9209, 7.5, 3.6, -3, "Ferri — giovedì 3", -9, -6.5, "end"))
        pen.append(ring(12.5167, 41.8987, 4.2, 3.4, 10, "Cortesi, giugno", 1, 9.5, "middle"))
        pen.append(ring(12.5180, 41.8996, 3.2, 2.6, -15, "officina — arresto '77", 5, -5))
        pen.append(ring(12.5137, 41.8981, 3.6, 2.8, 5, "tabaccheria Ricci '77", -6, 1.5, "end"))
        # arrow to the Garbatella, off-map to the south-west
        gx, gy = MX + 14, MY + MH - 6
        pen.append(f'<path d="M{gx + 18},{gy - 9} C{gx + 10},{gy - 6} {gx + 4},{gy - 2} {gx - 2},{gy + 3}" fill="none" stroke="{C["red_pen"]}" stroke-width="0.42"/>'
                   f'<path d="M{gx - 2},{gy + 3} l2.6,-0.6 M{gx - 2},{gy + 3} l0.3,-2.6" stroke="{C["red_pen"]}" stroke-width="0.42" fill="none"/>'
                   f'<text x="{gx + 19}" y="{gy - 10}" font-family="{F_PEN}" font-size="4.6" fill="{C["red_pen"]}" transform="rotate(-6 {gx + 19} {gy - 10})">Garbatella — la maestra</text>')
        pen.append('</g>')

    fonts = ('<style>@import url("https://fonts.googleapis.com/css2?family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700'
             '&amp;family=PT+Sans+Narrow:wght@400;700&amp;family=Caveat:wght@500&amp;display=swap");</style>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{PAGE_W}mm" height="{PAGE_H}mm" viewBox="0 0 {PAGE_W} {PAGE_H}">'
           f'<title>Pianta di Roma 1987 — Nomentano, San Lorenzo, Esquilino</title>{fonts}'
           f'<defs>{clip}{pats}{"".join(defs_paths)}</defs>'
           f'<rect width="{PAGE_W}" height="{PAGE_H}" fill="{C["paper"]}"/>'
           f'{"".join(fr)}{mapbody}{north}{"".join(pn)}{attr}{"".join(pen)}</svg>')
    return svg, entries


for with_pen, fname in [(False, "mappa-roma-1987.svg"), (True, "mappa-roma-1987-segni.svg")]:
    svg, entries = svg_map(with_pen)
    open(os.path.join(OUT, fname), "w").write(svg)
print("labels:", len(labels_svg), "map mm:", round(MW, 1), round(MH, 1), "lon", round(LON0, 4), round(LON1, 4), "lat", round(LAT0, 4), round(LAT1, 4))
print("story streets not labelled:", sorted(set(STORY) - set(index_entries)))
