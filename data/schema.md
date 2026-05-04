# Actuator dataset schema

The dataset uses **family-based inheritance**: a base "fundamental model" carries shared specs, and descendant **variants** override only what differs. Curves can live at either level — anything common to the family lives in the family detail file, anything variant-specific overrides it.

```
data/
  index.json                                  # manifest: lists family files
  families/
    <family_id>.json                          # { family_id, shared, variants[] } — startup-loaded summaries
    ...
  curves/
    families/
      <family_id>.json                        # family-level detail (curves shared by all variants) — lazy-loaded
    <variant_id>.json                         # variant-level detail (curves overriding family) — lazy-loaded
```

## 1. Manifest — `data/index.json`

```json
{ "families": ["cubemars-ak80.json", "mit-mini-cheetah.json"] }
```

Each entry is the filename of a family inside `data/families/`. Add a new family file → add it here.

## 2. Family file — `data/families/<family_id>.json`

```json
{
  "family_id": "cubemars-ak80",
  "family_name": "CubeMars AK80",

  "shared": {
    "manufacturer": "CubeMars",
    "electrical": {
      "voltage_v": 24,
      "motor_topology": "BLDC outrunner",
      "peak_current_a": 30,
      "continuous_current_a": 12
    },
    "transmission": { "type": "planetary", "efficiency_pct": 92 },
    "application": { "target_joints": ["hip", "knee"] }
  },

  "variants": [
    {
      "id": "cubemars-ak80-9-v3",
      "model": "AK80-9 V3.0",
      "transmission": { "ratio": 9, "backdrivable": true },
      "mechanical": { "peak_torque_nm": 22, "weight_kg": 0.485, ... },
      "electrical": { "kv": 100 }
    },
    {
      "id": "cubemars-ak80-64",
      "model": "AK80-64",
      "transmission": { "ratio": 64, "backdrivable": false, "efficiency_pct": 85 },
      "mechanical": { "peak_torque_nm": 120, "weight_kg": 1.42, ... },
      "electrical": { "kv": 80 }
    }
  ]
}
```

### Inheritance rules

The loader produces one flat summary per variant by **deep-merging `shared` ← `variant`**:

- **Objects:** recursive merge. Variant adds keys missing in shared, overrides keys it redefines.
- **Arrays:** the variant **replaces** the family array wholesale (no element merging). Restate the full list when overriding.
- **Scalars:** variant value wins.
- **`null`:** treated as an explicit value — a variant can use `"backdrivable": null` to mean "unknown" overriding a shared `true`.

In the example above:
- `cubemars-ak80-9-v3` inherits manufacturer, voltage, motor topology, currents, transmission type, efficiency_pct (92), and target_joints from `shared`. It adds ratio 9 and `backdrivable: true`.
- `cubemars-ak80-64` inherits the same family fields but **overrides** `efficiency_pct` (85) and `backdrivable` (false) because higher-ratio planetaries differ.

### Required fields per variant

| Field | Required |
|---|---|
| `id` | yes — globally unique kebab-case slug (also names the variant detail file) |
| `model` | yes |

Everything else is optional. Move whatever you can up to `shared` to keep variants minimal.

### Spec field reference

These can appear in `shared` or in any variant.

| Field | Type | Notes |
|---|---|---|
| `manufacturer` | string | |
| `year` | number | |
| `datasheet_url` | string \| null | |
| `price_usd` | number \| null | |
| `mechanical.peak_torque_nm` | number | |
| `mechanical.rated_torque_nm` | number | |
| `mechanical.max_speed_rad_s` | number | |
| `mechanical.weight_kg` | number | |
| `mechanical.torque_density_nm_per_kg` | number | computed if absent |
| `electrical.voltage_v` | number | |
| `electrical.peak_current_a` | number | |
| `electrical.continuous_current_a` | number | |
| `electrical.motor_topology` | string | e.g. `"BLDC outrunner"`, `"axial flux"` |
| `electrical.kv` | number | rpm/V |
| `transmission.type` | string | `"planetary"`, `"harmonic"`, `"cycloidal"`, `"direct-drive"`, … |
| `transmission.ratio` | number | |
| `transmission.backdrivable` | boolean | |
| `transmission.efficiency_pct` | number | |
| `application.target_joints` | string[] | |
| `application.used_in_robots` | string[] | |
| `application.notes` | string | |

## 3. Detail layer — curves & extras

Two optional files per variant, both lazy-loaded only when an actuator is pinned:

### Family-level — `data/curves/families/<family_id>.json`

Curves shared by every variant in the family. The motor (rotor-side) torque-speed curve is a good fit, since variants in a family typically share the same stator.

```json
{
  "family_id": "cubemars-ak80",
  "curves": {
    "motor_torque_speed": [
      { "speed_rad_s": 0,   "torque_nm": 2.5 },
      { "speed_rad_s": 460, "torque_nm": 0.0 }
    ],
    "efficiency_map": [
      { "speed_rad_s": 200, "torque_nm": 1.5, "efficiency_pct": 92 }
    ]
  }
}
```

### Variant-level — `data/curves/<variant_id>.json`

Curves that differ per variant. The output torque-speed curve depends on gear ratio, so it lives here.

```json
{
  "id": "cubemars-ak80-9-v3",
  "curves": {
    "torque_speed": [
      { "speed_rad_s": 0,    "torque_nm": 22.0 },
      { "speed_rad_s": 38.2, "torque_nm": 0.0 }
    ]
  }
}
```

The loader fetches both in parallel and **deep-merges family ← variant**. For curves specifically, an array on the variant fully replaces the family array. So:
- `motor_torque_speed` only at family level → shared.
- `torque_speed` only at variant level → variant-specific (no family default to override).
- If a variant defines its own `motor_torque_speed`, it replaces the family's for that variant alone.

Both files are optional. If neither exists, the curve panel shows "no curve data available" for that pin — the rest of the UI works fine.

## Adding a new actuator

1. Pick or create a family in `data/families/`. If new, add the filename to `data/index.json`.
2. Move shared specs into `shared`; put only what differs in the `variants[]` entry.
3. (Optional) Add `data/curves/families/<family_id>.json` for family-shared curves.
4. (Optional) Add `data/curves/<variant_id>.json` for variant-specific curves.
5. Reload locally (`python3 -m http.server 8000`) and verify.
6. Open a pull request.
