// data.js
//
// Loading model:
//   1. data/index.json is a manifest listing family files.
//   2. Each data/families/<file> has { family_id, shared, variants[] }.
//      The loader deep-merges `shared` into each variant to produce flat
//      summary entries — each entry knows its `family_id`.
//   3. Detail (curves + extras) lives in two optional layers:
//        data/actuators/families/<family_id>.json   — shared by variants
//        data/actuators/<id>.json                   — variant-specific
//      loadDetail() fetches both, deep-merges family ← variant (variant wins),
//      then merges with the already-loaded summary so the result is complete.
//
// Deep-merge semantics:
//   - objects: recurse
//   - arrays:  whole-replace (the override wins) — explicit and predictable
//   - scalars: replace
//
// This way: a variant can override any field the family declared, including
// curves; a family can carry shared curves and variants extend or replace them.

const MANIFEST_URL = "data/index.json";

const detailCache = new Map();
const detailPending = new Map();
const familyDetailCache = new Map();
const familyDetailPending = new Map();
const entriesById = new Map();

export async function loadIndex() {
  const manifestRes = await fetch(MANIFEST_URL, { cache: "no-store" });
  if (!manifestRes.ok) throw new Error(`Failed to fetch ${MANIFEST_URL}: ${manifestRes.status}`);
  const manifest = await manifestRes.json();
  const files = manifest.families || [];

  const families = await Promise.all(
    files.map(async (f) => {
      const url = `data/families/${f}`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status}`);
      return r.json();
    }),
  );

  const flat = [];
  for (const fam of families) {
    if (!fam.family_id) {
      console.warn("Family file missing family_id; skipping", fam);
      continue;
    }
    for (const variant of fam.variants || []) {
      const merged = deepMerge(fam.shared || {}, variant);
      merged.family_id = fam.family_id;
      flat.push(merged);
    }
  }

  const normalized = flat.map(normalize);
  entriesById.clear();
  for (const e of normalized) entriesById.set(e.id, e);
  return normalized;
}

export function loadDetail(id) {
  if (detailCache.has(id)) return Promise.resolve(detailCache.get(id));
  if (detailPending.has(id)) return detailPending.get(id);

  const entry = entriesById.get(id) || null;
  const variantP = fetchOrNull(`data/actuators/${encodeURIComponent(id)}.json`);
  const familyP = entry && entry.family_id
    ? loadFamilyDetail(entry.family_id)
    : Promise.resolve(null);

  const p = Promise.all([variantP, familyP]).then(([variant, family]) => {
    if (!variant && !family) {
      detailCache.set(id, null);
      detailPending.delete(id);
      return null;
    }
    // family ← variant (variant overrides family for any overlapping keys)
    const overlay = deepMerge(family || {}, variant || {});
    // summary ← overlay (curves & detail-only extras add on top of summary)
    const merged = deepMerge(entry || {}, overlay);
    const result = normalize(merged);
    detailCache.set(id, result);
    detailPending.delete(id);
    return result;
  });
  detailPending.set(id, p);
  return p;
}

function loadFamilyDetail(familyId) {
  if (familyDetailCache.has(familyId)) return Promise.resolve(familyDetailCache.get(familyId));
  if (familyDetailPending.has(familyId)) return familyDetailPending.get(familyId);
  const p = fetchOrNull(`data/actuators/families/${encodeURIComponent(familyId)}.json`)
    .then((d) => { familyDetailCache.set(familyId, d); familyDetailPending.delete(familyId); return d; });
  familyDetailPending.set(familyId, p);
  return p;
}

function fetchOrNull(url) {
  return fetch(url)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
}

// Flattens nested groups into top-level keys for convenient access in the UI.
// Recomputes torque density if missing. Leaves originals nested too.
export function normalize(entry) {
  const m = entry.mechanical || {};
  const e = entry.electrical || {};
  const t = entry.transmission || {};
  const a = entry.application || {};

  const peak = num(m.peak_torque_nm);
  const weight = num(m.weight_kg);
  const density =
    num(m.torque_density_nm_per_kg) ??
    (peak != null && weight != null && weight > 0 ? peak / weight : null);

  return {
    ...entry,
    peak_torque_nm: peak,
    rated_torque_nm: num(m.rated_torque_nm),
    max_speed_rad_s: num(m.max_speed_rad_s),
    weight_kg: weight,
    torque_density_nm_per_kg: density,

    voltage_v: num(e.voltage_v),
    peak_current_a: num(e.peak_current_a),
    continuous_current_a: num(e.continuous_current_a),
    motor_topology: e.motor_topology ?? null,
    kv: num(e.kv),

    transmission_type: t.type ?? null,
    ratio: num(t.ratio),
    backdrivable: t.backdrivable ?? null,
    efficiency_pct: num(t.efficiency_pct),

    target_joints: a.target_joints ?? [],
    used_in_robots: a.used_in_robots ?? [],
    notes: a.notes ?? null,
  };
}

function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ---------- deep-merge ----------
function deepMerge(a, b) {
  if (b === undefined) return clone(a);
  if (a === undefined) return clone(b);
  if (b === null) return null;
  if (a === null) return clone(b);
  if (Array.isArray(b)) return clone(b);                  // arrays: replace
  if (typeof b !== "object") return b;                    // scalars: replace
  if (Array.isArray(a) || typeof a !== "object") return clone(b);

  const out = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (k in b) out[k] = deepMerge(a[k], b[k]);
    else out[k] = clone(a[k]);
  }
  return out;
}

function clone(v) {
  if (v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(clone);
  const out = {};
  for (const k of Object.keys(v)) out[k] = clone(v[k]);
  return out;
}
