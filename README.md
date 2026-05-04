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
index.html              hero, nav, explorer, compare drawer
css/styles.css          design tokens & layout
js/app.js               bootstrap (fetch data, wire UI)
js/data.js              load index + lazy-load detail files
js/filters.js           sidebar filter state and apply pipeline
js/charts.js            Plotly renderers: scatter, radar, curves, table
js/compare.js           pin/unpin, diff table, CSV export
data/index.json         summary entries (loaded at startup)
data/actuators/*.json   detail entries with curves (lazy-loaded)
data/schema.md          dataset schema reference
```

## Adding an actuator

1. Append a summary object to [`data/index.json`](data/index.json) following the schema in [`data/schema.md`](data/schema.md).
2. Optionally create `data/actuators/<id>.json` with the same fields plus a `curves` block (torque-speed points, efficiency map). The detail file enables the curve chart in the compare drawer.
3. Reload the site and verify the new entry shows up in the scatter / table.
4. Open a pull request.

## Deploying to GitHub Pages

This is a pure static site — push to `main` (or any branch) and enable GitHub Pages in the repo settings, pointing at the branch root. No build, no toolchain.

## License

Code: MIT. Dataset: CC BY 4.0 — manufacturer/source attribution belongs in the entry's `notes` and `datasheet_url` fields.
