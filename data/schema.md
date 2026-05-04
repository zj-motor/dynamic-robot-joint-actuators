# Actuator dataset schema

The dataset is split into two layers to keep the page fast even with thousands of curve-rich entries.

```
data/
  index.json                           # array of summary objects (loaded at startup)
  actuators/
    <id>.json                          # full detail per actuator (lazy-loaded on pin)
```

`<id>` must match the `id` field in the corresponding summary entry.

## Summary entry — `data/index.json`

Each element of the top-level array:

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Unique kebab-case slug; used as the detail-file name. |
| `manufacturer` | string | yes | Display name of the maker. |
| `model` | string | yes | Display model name. |
| `year` | number | no | Year released. |
| `datasheet_url` | string \| null | no | Public datasheet link. |
| `price_usd` | number \| null | no | Single-unit list price. |
| `mechanical.peak_torque_nm` | number | recommended | Peak (instantaneous) torque, Nm. |
| `mechanical.rated_torque_nm` | number | recommended | Continuous/rated torque, Nm. |
| `mechanical.max_speed_rad_s` | number | recommended | No-load speed, rad/s. |
| `mechanical.weight_kg` | number | recommended | Total mass with gearbox & driver, kg. |
| `mechanical.torque_density_nm_per_kg` | number | optional | If absent, computed as peak/weight. |
| `electrical.voltage_v` | number | no | Nominal bus voltage, V. |
| `electrical.peak_current_a` | number | no | Peak phase current, A. |
| `electrical.continuous_current_a` | number | no | Continuous phase current, A. |
| `electrical.motor_topology` | string | no | e.g. `"BLDC outrunner"`, `"axial flux"`. |
| `electrical.kv` | number | no | rpm/V. |
| `transmission.type` | string | no | `"planetary"`, `"harmonic"`, `"cycloidal"`, `"qdd"`, `"direct-drive"`, etc. |
| `transmission.ratio` | number | no | Gear reduction (e.g. `9` for 9:1). |
| `transmission.backdrivable` | boolean | no | |
| `transmission.efficiency_pct` | number | no | Mechanical efficiency, %. |
| `application.target_joints` | string[] | no | e.g. `["hip", "knee"]`. |
| `application.used_in_robots` | string[] | no | Robots that ship this actuator. |
| `application.notes` | string | no | Free-form notes. |

Use `null` (not `"-"` or `0`) for unknown numeric fields. The UI renders them as `—` and skips them in plots.

## Detail entry — `data/actuators/<id>.json`

Same structure as the summary, plus:

```json
{
  "curves": {
    "torque_speed": [
      { "speed_rad_s": 0,    "torque_nm": 22 },
      { "speed_rad_s": 38.2, "torque_nm": 0  }
    ],
    "efficiency_map": [
      { "speed_rad_s": 10, "torque_nm": 5,  "efficiency_pct": 88 },
      { "speed_rad_s": 20, "torque_nm": 10, "efficiency_pct": 92 }
    ]
  }
}
```

- `curves.torque_speed` — array of `(speed, torque)` operating-envelope points. Sorted by `speed_rad_s`. Plotly draws a connected line.
- `curves.efficiency_map` — sparse grid of `(speed, torque, efficiency)` samples. Used for future contour rendering; not required for the current UI but reserved.

Detail files are optional. If `data/actuators/<id>.json` is missing, the UI still works — the comparison drawer just shows "no curve data available" for that actuator.

## Adding a new actuator

1. Append a summary object to `data/index.json` (keep `id` unique).
2. Optionally create `data/actuators/<id>.json` with the same fields plus `curves`.
3. Open the site locally (`python3 -m http.server 8000`) and verify the entry appears.
4. Commit and open a PR.
