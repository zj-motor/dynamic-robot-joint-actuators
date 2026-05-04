// compare.js — pin/unpin, render diff table, CSV export, lazy-load detail curves

import { loadDetail } from "./data.js";
import { renderCurves } from "./charts.js";
import { t } from "./i18n.js";

const STORAGE_KEY = "jae.pinned";
const MAX_PINS = 4;

// Row layout. Labels and section headers are translation keys; resolved at
// render time so language changes refresh without a reload.
const ROWS = [
  { section: "compare.section.identity", key: "manufacturer",  labelKey: "compare.row.manufacturer" },
  { key: "model",                                              labelKey: "compare.row.model" },
  { key: "year",                                               labelKey: "compare.row.year" },

  { section: "compare.section.mechanical", key: "peak_torque_nm",            labelKey: "compare.row.peak_torque",  num: true,  best: "max" },
  { key: "rated_torque_nm",                                                  labelKey: "compare.row.rated_torque", num: true,  best: "max" },
  { key: "max_speed_rad_s",                                                  labelKey: "compare.row.max_speed",    num: true,  best: "max" },
  { key: "weight_kg",                                                        labelKey: "compare.row.weight",       num: true,  best: "min", digits: 3 },
  { key: "torque_density_nm_per_kg",                                         labelKey: "compare.row.density",      num: true,  best: "max" },

  { section: "compare.section.electrical", key: "voltage_v",                 labelKey: "compare.row.voltage",            num: true },
  { key: "peak_current_a",                                                   labelKey: "compare.row.peak_current",       num: true },
  { key: "continuous_current_a",                                             labelKey: "compare.row.continuous_current", num: true },
  { key: "motor_topology",                                                   labelKey: "compare.row.motor_topology" },
  { key: "kv",                                                               labelKey: "compare.row.kv",                 num: true },

  { section: "compare.section.transmission", key: "transmission_type",       labelKey: "compare.row.tx_type" },
  { key: "ratio",                                                            labelKey: "compare.row.ratio",       num: true },
  { key: "backdrivable",                                                     labelKey: "compare.row.backdrivable", fmt: bool },
  { key: "efficiency_pct",                                                   labelKey: "compare.row.efficiency",  num: true,  best: "max" },

  { section: "compare.section.application", key: "target_joints",            labelKey: "compare.row.target_joints",   fmt: list },
  { key: "used_in_robots",                                                   labelKey: "compare.row.used_in_robots",  fmt: list },
  { key: "price_usd",                                                        labelKey: "compare.row.price",           num: true,  best: "min" },
  { key: "datasheet_url",                                                    labelKey: "compare.row.datasheet",       fmt: link },
];

export function createCompareController(getAllData) {
  const state = {
    pinned: loadPins(),
    detailsById: new Map(), // id -> detail (null if not yet loaded or 404)
  };
  let listeners = [];
  const drawer = document.getElementById("compare-drawer");

  // Subscribers
  function emit() {
    for (const fn of listeners) fn(getPins());
  }
  function subscribe(fn) { listeners.push(fn); }

  // Pin management
  function getPins() { return [...state.pinned]; }
  function isPinned(id) { return state.pinned.includes(id); }
  function toggle(id) {
    const i = state.pinned.indexOf(id);
    if (i >= 0) {
      state.pinned.splice(i, 1);
    } else {
      if (state.pinned.length >= MAX_PINS) state.pinned.shift();
      state.pinned.push(id);
      hydrateDetail(id);
    }
    persist();
    render();
    emit();
  }
  function clear() {
    state.pinned = [];
    persist();
    render();
    emit();
  }

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.pinned)); } catch {}
  }

  function hydrateDetail(id) {
    if (state.detailsById.has(id)) return;
    state.detailsById.set(id, null);
    loadDetail(id).then((detail) => {
      state.detailsById.set(id, detail);
      render();
    });
  }

  // Rendering
  function render() {
    const all = getAllData();
    const items = state.pinned.map((id) => all.find((d) => d.id === id)).filter(Boolean);
    document.getElementById("pin-count").textContent = items.length;

    if (!items.length) {
      drawer.hidden = true;
      return;
    }
    drawer.hidden = false;

    const table = document.getElementById("compare-table");
    table.innerHTML = buildTableHTML(items);
    // Wire remove buttons
    table.querySelectorAll(".col-remove").forEach((btn) => {
      btn.onclick = () => toggle(btn.dataset.id);
    });

    // Curves chart
    let curveEl = document.getElementById("curve-chart");
    if (!curveEl) {
      curveEl = document.createElement("div");
      curveEl.id = "curve-chart";
      table.parentNode.appendChild(curveEl);
    }
    const map = new Map();
    for (const it of items) map.set(it.id, state.detailsById.get(it.id));
    renderCurves("curve-chart", map);
  }

  function buildTableHTML(items) {
    const unpin = escape(t("compare.unpin"));
    let html = `<thead><tr><th>${escape(t("compare.spec"))}</th>`;
    for (const it of items) {
      html += `<th>${escape(it.manufacturer)} <span style="color:#64748b;font-weight:400;">${escape(it.model)}</span> <button class="col-remove" data-id="${escape(it.id)}" title="${unpin}">×</button></th>`;
    }
    html += "</tr></thead><tbody>";

    for (const row of ROWS) {
      if (row.section) {
        html += `<tr class="meta-row"><th colspan="${items.length + 1}">${escape(t(row.section))}</th></tr>`;
      }
      const values = items.map((it) => it[row.key]);
      const winners = row.num && row.best ? bestIndices(values, row.best) : new Set();
      html += `<tr><th>${escape(t(row.labelKey))}</th>`;
      values.forEach((v, i) => {
        let display;
        if (row.fmt) display = row.fmt(v);
        else if (row.num) display = formatNum(v, row.digits);
        else display = v == null || v === "" ? "—" : escape(String(v));
        const cls = winners.has(i) ? " class=\"col-best\"" : "";
        html += `<td${cls}>${display}</td>`;
      });
      html += "</tr>";
    }
    html += "</tbody>";
    return html;
  }

  function bestIndices(values, mode) {
    const nums = values.map((v) => (typeof v === "number" && Number.isFinite(v) ? v : null));
    const present = nums.filter((v) => v != null);
    if (!present.length) return new Set();
    const target = mode === "min" ? Math.min(...present) : Math.max(...present);
    const out = new Set();
    nums.forEach((v, i) => { if (v === target) out.add(i); });
    return out;
  }

  // CSV export
  function exportCSV() {
    const all = getAllData();
    const items = state.pinned.map((id) => all.find((d) => d.id === id)).filter(Boolean);
    if (!items.length) return;

    const header = [t("compare.spec"), ...items.map((it) => `${it.manufacturer} ${it.model}`)];
    const lines = [header.map(csvCell).join(",")];
    for (const row of ROWS) {
      if (row.section) continue;
      const values = items.map((it) => {
        const v = it[row.key];
        if (Array.isArray(v)) return v.join("; ");
        if (typeof v === "boolean") return v ? t("compare.bool.yes") : t("compare.bool.no");
        return v == null ? "" : String(v);
      });
      lines.push([t(row.labelKey), ...values].map(csvCell).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "actuator-comparison.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Wire drawer buttons
  document.getElementById("clear-pins").onclick = clear;
  document.getElementById("export-csv").onclick = exportCSV;
  document.getElementById("toggle-drawer").onclick = () => {
    drawer.classList.toggle("is-collapsed");
    const btn = document.getElementById("toggle-drawer");
    btn.textContent = drawer.classList.contains("is-collapsed") ? "▴" : "▾";
  };

  // Hydrate any pre-existing pins (from localStorage)
  for (const id of state.pinned) hydrateDetail(id);

  return { toggle, clear, getPins, isPinned, render, subscribe };
}

function loadPins() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX_PINS) : [];
  } catch { return []; }
}

// ---------- formatting helpers ----------
function formatNum(v, digits) {
  if (v == null || !Number.isFinite(v)) return "—";
  const d = digits ?? (Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2);
  return v.toFixed(d);
}
function bool(v) { if (v == null) return "—"; return v ? t("compare.bool.yes") : t("compare.bool.no"); }
function list(v) { return Array.isArray(v) && v.length ? v.map(escape).join(", ") : "—"; }
function link(v) {
  if (!v) return "—";
  return `<a href="${escape(v)}" target="_blank" rel="noopener">${escape(t("compare.row.datasheet_link"))}</a>`;
}
function escape(s) {
  if (s == null) return "—";
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );
}
function csvCell(s) {
  const v = String(s ?? "");
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
