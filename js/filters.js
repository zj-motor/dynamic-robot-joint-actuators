// filters.js — sidebar filter state, rendering, and apply pipeline

import { manufacturerDisplay } from "./i18n.js";

const RANGE_FIELDS = {
  torque: { key: "peak_torque_nm",          label: "Nm",    container: "range-torque" },
  weight: { key: "weight_kg",               label: "kg",    container: "range-weight" },
  density:{ key: "torque_density_nm_per_kg",label: "Nm/kg", container: "range-density" },
};

export function createFilterState() {
  return {
    search: "",
    manufacturer: new Set(),
    transmission: new Set(),
    joint: new Set(),
    ranges: {
      torque:  { min: null, max: null, lo: null, hi: null },
      weight:  { min: null, max: null, lo: null, hi: null },
      density: { min: null, max: null, lo: null, hi: null },
    },
  };
}

export function applyFilters(data, state) {
  const q = (state.search || "").trim().toLowerCase();
  return data.filter((d) => {
    if (q) {
      const mEn = manufacturerDisplay(d.manufacturer) || "";
      const hay = `${d.manufacturer ?? ""} ${mEn} ${d.model ?? ""} ${d.transmission_type ?? ""} ${(d.used_in_robots || []).join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (state.manufacturer.size && !state.manufacturer.has(d.manufacturer)) return false;
    if (state.transmission.size && !state.transmission.has(d.transmission_type)) return false;
    if (state.joint.size) {
      const joints = d.target_joints || [];
      if (!joints.some((j) => state.joint.has(j))) return false;
    }
    for (const [name, def] of Object.entries(RANGE_FIELDS)) {
      const v = d[def.key];
      const r = state.ranges[name];
      if (r.lo != null && v != null && v < r.lo) return false;
      if (r.hi != null && v != null && v > r.hi) return false;
    }
    return true;
  });
}

export function renderFilterSidebar(data, state, onChange) {
  renderCheckboxGroup(
    "filter-manufacturer",
    countBy(data, "manufacturer"),
    state.manufacturer,
    onChange,
    manufacturerDisplay,
  );
  renderCheckboxGroup(
    "filter-transmission",
    countBy(data, "transmission_type"),
    state.transmission,
    onChange,
  );
  renderCheckboxGroup(
    "filter-joint",
    countByMulti(data, "target_joints"),
    state.joint,
    onChange,
  );

  for (const [name, def] of Object.entries(RANGE_FIELDS)) {
    const values = data.map((d) => d[def.key]).filter((v) => v != null);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 1;
    const r = state.ranges[name];
    r.min = min; r.max = max;
    if (r.lo == null) r.lo = min;
    if (r.hi == null) r.hi = max;
    renderRange(def.container, r, def.label, onChange);
  }

  document.getElementById("filters-reset").onclick = () => {
    state.search = "";
    state.manufacturer.clear();
    state.transmission.clear();
    state.joint.clear();
    for (const [name, def] of Object.entries(RANGE_FIELDS)) {
      const r = state.ranges[name];
      r.lo = r.min;
      r.hi = r.max;
    }
    const search = document.getElementById("search-input");
    if (search) search.value = "";
    renderFilterSidebar(data, state, onChange);
    onChange();
  };
}

function renderCheckboxGroup(containerId, counts, selectedSet, onChange, displayFn) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = "";
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  for (const [value, count] of entries) {
    const label = document.createElement("label");
    label.className = "checkbox";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = selectedSet.has(value);
    input.onchange = () => {
      if (input.checked) selectedSet.add(value);
      else selectedSet.delete(value);
      onChange();
    };
    const text = document.createElement("span");
    text.textContent = (displayFn ? displayFn(value) : value) || "(unspecified)";
    const c = document.createElement("span");
    c.className = "count";
    c.textContent = count;
    label.append(input, text, c);
    el.append(label);
  }
  if (!entries.length) {
    el.innerHTML = '<span class="count">No values</span>';
  }
}

function renderRange(containerId, r, unit, onChange) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const span = Math.max(r.max - r.min, 1);
  const step = span > 100 ? 1 : span > 10 ? 0.5 : span > 1 ? 0.05 : 0.01;
  el.innerHTML = `
    <div class="range__track">
      <div class="range__rail"></div>
      <div class="range__fill"></div>
      <input type="range" min="${r.min}" max="${r.max}" step="${step}" value="${r.lo}" data-handle="lo" />
      <input type="range" min="${r.min}" max="${r.max}" step="${step}" value="${r.hi}" data-handle="hi" />
    </div>
    <div class="range__values">
      <span data-display="lo">${fmt(r.lo)} ${unit}</span>
      <span data-display="hi">${fmt(r.hi)} ${unit}</span>
    </div>
  `;
  const fill = el.querySelector(".range__fill");
  const inputs = el.querySelectorAll('input[type="range"]');
  const updateFill = () => {
    const lo = Number(inputs[0].value);
    const hi = Number(inputs[1].value);
    const pctLo = ((lo - r.min) / span) * 100;
    const pctHi = ((hi - r.min) / span) * 100;
    fill.style.left = `${Math.max(0, Math.min(pctLo, pctHi))}%`;
    fill.style.right = `${100 - Math.min(100, Math.max(pctLo, pctHi))}%`;
  };
  updateFill();
  inputs.forEach((inp) => {
    inp.oninput = () => {
      let lo = Number(inputs[0].value);
      let hi = Number(inputs[1].value);
      if (lo > hi) {
        if (inp.dataset.handle === "lo") lo = hi;
        else hi = lo;
        inputs[0].value = lo;
        inputs[1].value = hi;
      }
      r.lo = lo; r.hi = hi;
      el.querySelector('[data-display="lo"]').textContent = `${fmt(lo)} ${unit}`;
      el.querySelector('[data-display="hi"]').textContent = `${fmt(hi)} ${unit}`;
      updateFill();
      onChange();
    };
  });
}

function countBy(data, key) {
  const out = {};
  for (const d of data) {
    const v = d[key];
    if (v == null || v === "") continue;
    out[v] = (out[v] || 0) + 1;
  }
  return out;
}

function countByMulti(data, key) {
  const out = {};
  for (const d of data) {
    for (const v of d[key] || []) {
      out[v] = (out[v] || 0) + 1;
    }
  }
  return out;
}

function fmt(v) {
  if (v == null || !Number.isFinite(v)) return "—";
  if (Math.abs(v) >= 100) return v.toFixed(0);
  if (Math.abs(v) >= 10)  return v.toFixed(1);
  return v.toFixed(2);
}
