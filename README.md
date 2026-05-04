# Joint Actuator Explorer

Open, interactive comparison of legged-robot joint actuators — quadrupeds, bipeds, and humanoids. Filter by manufacturer, transmission type, target joint, and performance ranges; pin actuators side by side; export comparisons as CSV.

Inspired by the visual style of the [Batemo Cell Explorer](https://www.batemo.com/products/batemo-cell-explorer).

## Quick start

No build step. Serve the repo root with any static file server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or with Node:

```bash
npx serve .
```

## Stack

- Static HTML / CSS / vanilla ES modules
- [Plotly.js](https://plotly.com/javascript/) (CDN) for the scatter, radar, and torque-speed curve charts
- [Inter](https://fonts.google.com/specimen/Inter) and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) via Google Fonts

## File layout

```
index.html                          hero, nav, explorer, compare drawer
css/styles.css                      design tokens & layout
js/app.js                           bootstrap (fetch data, wire UI)
js/data.js                          manifest + family loader, lazy-load detail
js/filters.js                       sidebar filter state and apply pipeline
js/charts.js                        Plotly renderers: scatter, radar, curves, table
js/compare.js                       pin/unpin, diff table, CSV export
data/index.json                     manifest of family files
data/families/<family>.json         family { shared, variants[] } — startup-loaded
data/curves/families/<f>.json       family-level detail (curves) — lazy-loaded
data/curves/<variant>.json          variant-level detail (curves) — lazy-loaded
data/schema.md                      dataset schema reference
```

## Inheritance model

The dataset uses **family-based inheritance**: a family file declares `shared` specs once; each `variant` inside overrides only what differs (gear ratio, peak torque, weight, kv, …). Curves can live at either layer:

- **Family-level** for things common to every descendant — e.g., motor (rotor-side) torque-speed curves shared across an entire product line.
- **Variant-level** for things that depend on the variant — e.g., output torque-speed curves that change with gear ratio.

At load time the loader deep-merges `shared` ← `variant` for the summary, and family-detail ← variant-detail for curves. See [`data/schema.md`](data/schema.md) for the full specification.

## Adding an actuator

1. Pick or create a family file in [`data/families/`](data/families/). If creating a new one, add its filename to [`data/index.json`](data/index.json).
2. Put manufacturer-wide specs (motor topology, voltage, transmission type) in `shared`; put only what differs (ratio, peak torque, weight) in the `variants[]` entry.
3. (Optional) Add `data/curves/families/<family_id>.json` with curves shared by every variant in the family.
4. (Optional) Add `data/curves/<variant_id>.json` with curves specific to that variant.
5. Reload the site and verify the new entry appears in the scatter / table.
6. Open a pull request.

## Deploying to GitHub Pages

This is a pure static site — push to `main` (or any branch) and enable GitHub Pages in the repo settings, pointing at the branch root. No build, no toolchain.

## License

- **Code** (HTML/CSS/JS, docs, configuration): [MIT](LICENSE).
- **Dataset** (`data/`): [CC BY 4.0](LICENSE-DATA). Manufacturer / source attribution belongs in each entry's `notes` and `datasheet_url` fields.
