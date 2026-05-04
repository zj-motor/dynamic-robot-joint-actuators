// data.js — fetches the index summary and lazy-loads detail files

const INDEX_URL = "data/index.json";
const detailCache = new Map();
const detailPending = new Map();

export async function loadIndex() {
  const res = await fetch(INDEX_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${INDEX_URL}: ${res.status}`);
  const raw = await res.json();
  return raw.map(normalize);
}

export function loadDetail(id) {
  if (detailCache.has(id)) return Promise.resolve(detailCache.get(id));
  if (detailPending.has(id)) return detailPending.get(id);

  const url = `data/actuators/${encodeURIComponent(id)}.json`;
  const p = fetch(url)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      const detail = d ? normalize(d) : null;
      detailCache.set(id, detail);
      detailPending.delete(id);
      return detail;
    })
    .catch(() => {
      detailCache.set(id, null);
      detailPending.delete(id);
      return null;
    });

  detailPending.set(id, p);
  return p;
}

// Flattens nested groups into top-level keys for convenient access in the UI.
// Recomputes torque density if missing. Leaves originals available too.
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
    // Flat aliases
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
