// app.js — bootstrap

import { loadIndex } from "./data.js";
import {
  createFilterState,
  applyFilters,
  renderFilterSidebar,
  renderCheckboxGroup,
  countBy,
} from "./filters.js";
import {
  renderScatter,
  renderRadar,
  renderTable,
  bindTableSort,
} from "./charts.js";
import { createCompareController } from "./compare.js";
import { applyToDOM, manufacturerDisplay, mountToggle, onLangChange, t } from "./i18n.js";

// Highlight defaults / persistence.
// Selected manufacturers (Chinese canonical names) drive which actuators get
// the orange "highlighted" treatment in every view. We persist the selected
// set so refresh keeps the user's choice, and seed first-time visitors with
// "蓝门开物" so the BDI actuator stands out by default.
const HIGHLIGHT_STORAGE_KEY = "jae.highlight_manufacturers";
const DEFAULT_HIGHLIGHT_MANUFACTURERS = ["蓝门开物"];

const state = {
  data: [],
  filtered: [],
  filters: createFilterState(),
  view: "scatter",
  sort: { key: "manufacturer", dir: "asc" },
  highlightManufacturers: loadHighlightManufacturers(),
};

let compare;

async function init() {
  document.getElementById("year").textContent = new Date().getFullYear();

  // i18n: mount the toggle, apply translations to static markup, render the
  // glossary, and re-render dynamic content on every language change.
  const toggleSlot = document.getElementById("lang-toggle-slot");
  if (toggleSlot) mountToggle(toggleSlot);
  applyToDOM();
  renderGlossary();
  onLangChange(() => {
    applyToDOM();
    renderGlossary();
    // Re-render the dynamic sidebar lists too — checkbox labels for
    // manufacturer (highlight), transmission, motor topology, etc. are
    // built from data and need fresh display() calls in the new language.
    if (state.data.length) {
      renderFilterSidebar(state.data, state.filters, () => {
        rerender();
        writeHash();
      });
      renderHighlightSidebar();
    }
    rerender();
    if (compare) compare.render();
  });

  try {
    state.data = await loadIndex();
  } catch (err) {
    console.error(err);
    showLoadError(err.message);
    return;
  }

  if (!state.data.length) {
    showLoadError(t("load.empty"));
    return;
  }

  compare = createCompareController(() => state.data);
  compare.subscribe(() => rerender());

  renderHeroStats();
  parseHashIntoState();

  renderFilterSidebar(state.data, state.filters, () => {
    rerender();
    writeHash();
  });

  renderHighlightSidebar();
  bindHighlightClear();
  applyHighlight(); // seed compare with whichever manufacturers are selected

  bindSearch();
  bindTabs();
  bindTableSort("spec-table", (key) => {
    if (state.sort.key === key) {
      state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
    } else {
      state.sort.key = key;
      state.sort.dir = "asc";
    }
    rerender();
  });

  rerender();
  compare.render();
}

// ---------- Highlight by manufacturer ----------
//
// The sidebar shows a checkbox per manufacturer (same UI as the old filter,
// but it never removes anyone from the chart — it only marks rows for the
// orange "highlight" treatment). Selecting nothing means no highlights;
// selecting one or more means every variant from those manufacturers gets
// added to compare.setHighlightIds(), which the renderers consume to draw
// the top-layer trace in scatter and emphasize rows in radar / table /
// compare drawer.

function loadHighlightManufacturers() {
  try {
    const raw = localStorage.getItem(HIGHLIGHT_STORAGE_KEY);
    if (raw == null) return new Set(DEFAULT_HIGHLIGHT_MANUFACTURERS);
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);
  } catch {
    return new Set(DEFAULT_HIGHLIGHT_MANUFACTURERS);
  }
}
function persistHighlightManufacturers() {
  try {
    localStorage.setItem(HIGHLIGHT_STORAGE_KEY, JSON.stringify([...state.highlightManufacturers]));
  } catch { /* storage full or disabled; not fatal */ }
}

function renderHighlightSidebar() {
  const counts = countBy(state.data, "manufacturer");
  // Drop selections that no longer match any manufacturer in the data (the
  // dataset can shift between releases). Avoids stale ids leaking into the
  // highlight set and confusing the UI.
  for (const m of [...state.highlightManufacturers]) {
    if (!(m in counts)) state.highlightManufacturers.delete(m);
  }
  renderCheckboxGroup(
    "filter-highlight-manufacturer",
    counts,
    state.highlightManufacturers,
    () => {
      persistHighlightManufacturers();
      applyHighlight();
    },
    manufacturerDisplay,
  );
}

function bindHighlightClear() {
  const btn = document.getElementById("highlight-clear");
  if (!btn) return;
  btn.addEventListener("click", () => {
    state.highlightManufacturers.clear();
    persistHighlightManufacturers();
    renderHighlightSidebar();
    applyHighlight();
  });
}

function applyHighlight() {
  const sel = state.highlightManufacturers;
  const ids = sel.size
    ? state.data.filter((d) => sel.has(d.manufacturer)).map((d) => d.id)
    : [];
  compare.setHighlightIds(ids); // triggers compare's emit -> rerender()
}

function rerender() {
  state.filtered = applyFilters(state.data, state.filters);
  document.getElementById("result-count").textContent = state.filtered.length;

  const pinnedIds = compare ? compare.getPins() : [];
  if (state.view === "scatter") {
    const onPick = (id) => compare.toggle(id);
    renderScatter("chart-rated", state.filtered, {
      pinnedIds, onPick,
      yField: "rated_torque_nm",
      yLabelKey: "chart.rated_torque",
    });
    renderScatter("chart-peak", state.filtered, {
      pinnedIds, onPick,
      yField: "peak_torque_nm",
      yLabelKey: "chart.peak_torque",
    });
  } else if (state.view === "radar") {
    renderRadar("chart-radar", state.data, pinnedIds);
  } else if (state.view === "table") {
    renderTable("spec-table", state.filtered, {
      pinnedIds,
      sortKey: state.sort.key,
      sortDir: state.sort.dir,
      onPick: (id) => compare.toggle(id),
    });
  }
}

function renderHeroStats() {
  const data = state.data;
  document.getElementById("stat-actuators").textContent = data.length;
  const mfrs = new Set(data.map((d) => d.manufacturer).filter(Boolean));
  document.getElementById("stat-manufacturers").textContent = mfrs.size;
  const peakMax = Math.max(...data.map((d) => d.peak_torque_nm).filter((v) => v != null), 0);
  document.getElementById("stat-max-torque").textContent = peakMax ? peakMax.toFixed(0) : "—";
  const dMax = Math.max(...data.map((d) => d.torque_density_nm_per_kg).filter((v) => v != null), 0);
  document.getElementById("stat-max-density").textContent = dMax ? dMax.toFixed(1) : "—";
}

function bindSearch() {
  const input = document.getElementById("search-input");
  let t = null;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.filters.search = input.value;
      rerender();
      writeHash();
    }, 120);
  });
  if (state.filters.search) input.value = state.filters.search;
}

function bindTabs() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".tab").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const v = btn.dataset.view;
      state.view = v;
      document.querySelectorAll(".view").forEach((el) => {
        el.classList.toggle("is-active", el.dataset.view === v);
      });
      rerender();
    };
  });
}

// ---------- URL hash sync ----------
// `mfr=` was removed when the manufacturer filter was repurposed into the
// (sidebar-driven, localStorage-persisted) highlight selection. Hash keeps
// only the actual filter state.
function writeHash() {
  const f = state.filters;
  const parts = [];
  if (f.search)            parts.push(`q=${encodeURIComponent(f.search)}`);
  if (f.transmission.size) parts.push(`tx=${[...f.transmission].map(encodeURIComponent).join(",")}`);
  if (f.motorType.size)    parts.push(`mot=${[...f.motorType].map(encodeURIComponent).join(",")}`);
  if (f.busType.size)      parts.push(`bus=${[...f.busType].map(encodeURIComponent).join(",")}`);
  if (f.voltage.size)      parts.push(`v=${[...f.voltage].join(",")}`);
  if (f.brake)             parts.push("brk=1");
  if (f.dualEncoder)       parts.push("de=1");
  if (f.forceSensor)       parts.push("fs=1");
  const hash = parts.join("&");
  if (hash) history.replaceState(null, "", `#${hash}`);
  else if (location.hash) history.replaceState(null, "", location.pathname + location.search);
}

function parseHashIntoState() {
  const h = location.hash.replace(/^#/, "");
  if (!h) return;
  for (const part of h.split("&")) {
    const [k, v] = part.split("=");
    if (!k || !v) continue;
    const value = decodeURIComponent(v);
    if (k === "q")   state.filters.search = value;
    if (k === "tx")  value.split(",").forEach((x) => state.filters.transmission.add(decodeURIComponent(x)));
    if (k === "mot") value.split(",").forEach((x) => state.filters.motorType.add(decodeURIComponent(x)));
    if (k === "bus") value.split(",").forEach((x) => state.filters.busType.add(decodeURIComponent(x)));
    if (k === "v")   value.split(",").forEach((x) => { if (Number.isFinite(Number(x))) state.filters.voltage.add(x); });
    if (k === "brk") state.filters.brake = (value === "1");
    if (k === "de")  state.filters.dualEncoder = (value === "1");
    if (k === "fs")  state.filters.forceSensor = (value === "1");
  }
}

function showLoadError(msg) {
  const el = document.querySelector(".viz__body");
  if (!el) return;
  el.innerHTML =
    `<div style="padding:48px;text-align:center;color:#64748b;">` +
    `<p style="font-size:15px;margin:0 0 8px;">${t("load.error")}</p>` +
    `<code style="font-size:12px;">${msg}</code></div>`;
}

// ---------- Glossary ----------
//
// Driven from a list of i18n key prefixes; each prefix has matching
// `${prefix}.term` and `${prefix}.desc` strings in both languages.
const GLOSSARY_KEYS = [
  "rated_torque",
  "avg_load_torque",
  "start_stop_torque",
  "instantaneous_max_torque",
  "voltage",
  "peak_current",
  "continuous_current",
  "rated_speed",
  "rated_input_power",
  "peak_input_power",
  "peak_output_power",
  "max_speed",
  "encoder",
  "half_torque_speed",
];

function renderGlossary() {
  const el = document.getElementById("glossary-grid");
  if (!el) return;
  el.innerHTML = GLOSSARY_KEYS.map((key) => {
    const term = escapeHtml(t(`glossary.${key}.term`));
    const desc = escapeHtml(t(`glossary.${key}.desc`));
    return `<div class="glossary__item">
      <dt class="glossary__term">${term}</dt>
      <dd class="glossary__desc">${desc}</dd>
    </div>`;
  }).join("");
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );
}

// Kick everything off after every const/function above is initialized.
// Called from the bottom so the synchronous portion of init() can read
// module-scope consts (e.g. GLOSSARY_KEYS) without a temporal-dead-zone error.
init();
