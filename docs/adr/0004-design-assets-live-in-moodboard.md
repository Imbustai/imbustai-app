# Design assets live in `moodboard/`

Every graphic asset we produce or collect (references, photos, AI generations, drafts, chosen and final art, and the sources that generate them) lives in one top-level folder, `moodboard/`, rather than scattered across apps and packages. Assets are many, they are made by Paolo, by Claude sessions and by image models, and they outlive the code that first used them; one tree with one set of rules keeps them findable and keeps their provenance.

## Layout

- `moodboard/imbustai/`: brand-wide material (real photos, palette and style samples).
- `moodboard/storie/<story>/<asset>/`: one folder per asset of a Story (for Voss: `francobollo/`, `busta-a4/` and its items, such as `mappa-roma-1987/`).
- Inside an asset folder, optional subfolders by state: `scartati/` (discarded options), `prove/` (style tests), `riferimenti/` (third-party references), `sorgente/` (scripts and data that regenerate the asset).

## Rules

- **README per asset folder.** It records what the asset is, its state (`riferimento`, `bozza`, `scelto`, `definitivo`), where every file came from (author, or model and date), what is still wrong with it, and any spend. AI generations keep their exact prompt next to them (`PROMPTS.md`).
- **Names** are lowercase Italian kebab-case describing the content (`decreto-di-trasferimento.png`), never a tool's hash or timestamp.
- **Weight.** The chosen and final versions stay lossless (PNG, SVG, PDF). Discarded options and large references are stored as JPG at quality 85–92, at most 2400 px. Data that regenerates an asset is committed compressed (`.json.gz`).
- **This repository is public.** A third-party image (a scan, a web find) stays a `riferimento` and is never used as-is on the site or in print. Real brands and logos (newspapers, ATAC, Poste Italiane) are allowed only in references and drafts; anything `definitivo` uses invented ones.
- **The apps never read `moodboard/` at runtime.** When an app needs an asset, an optimised copy goes into that app (for example `apps/website/public/`), and the asset's README says where it was exported.

## Consequences

The graphics that lived in `apps/website/moodboard/` and `packages/engine-voss/art/` moved here. The website's design notes (`apps/website/moodboard/*.md`, `refactor/`) are development documents, not graphics, and stay with the app. Adding an asset now costs a README entry, which is the price of knowing later what each file is and whether it can be printed.
