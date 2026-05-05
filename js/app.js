// app.js — bootstrap

import { loadIndex } from "./data.js";
import {
  createFilterState,
  applyFilters,
  renderFilterSidebar,
} from "./filters.js";
import {
  renderScatter,
  renderRadar,
  renderTable,
  bindTableSort,
} from "./charts.js";
import { createCompareController } from "./compare.js";
import { applyToDOM, mountToggle, onLangChange, t } from "./i18n.js";

const state = {
  data: [],
  filtered: [],
  filters: createFilterState(),
  view: "scatter",
  sort: { key: "manufacturer", dir: "asc" },
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
function writeHash() {
  const f = state.filters;
  const parts = [];
  if (f.search) parts.push(`q=${encodeURIComponent(f.search)}`);
  if (f.manufacturer.size) parts.push(`mfr=${[...f.manufacturer].map(encodeURIComponent).join(",")}`);
  if (f.transmission.size) parts.push(`tx=${[...f.transmission].map(encodeURIComponent).join(",")}`);
  if (f.joint.size)        parts.push(`jt=${[...f.joint].map(encodeURIComponent).join(",")}`);
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
    if (k === "q") state.filters.search = value;
    if (k === "mfr") value.split(",").forEach((x) => state.filters.manufacturer.add(decodeURIComponent(x)));
    if (k === "tx")  value.split(",").forEach((x) => state.filters.transmission.add(decodeURIComponent(x)));
    if (k === "jt")  value.split(",").forEach((x) => state.filters.joint.add(decodeURIComponent(x)));
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
  "voltage",
  "peak_current",
  "continuous_current",
  "rated_speed",
  "half_torque_speed",
  "max_speed",
  "rated_torque",
  "avg_load_torque",
  "start_stop_torque",
  "instantaneous_max_torque",
  "torque_at_max_speed",
  "rated_input_power",
  "peak_power",
  "encoder",
  "torque_constant",
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
