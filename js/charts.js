// charts.js — Plotly renderers for scatter, radar, torque-speed curves; HTML for spec table

import { t, manufacturerDisplay } from "./i18n.js";

const TX_COLORS = {
  planetary:  "#0e7490",
  harmonic:   "#7c3aed",
  cycloidal:  "#059669",
  qdd:        "#0891b2",
  "quasi-direct-drive": "#0891b2",
  "direct-drive": "#0284c7",
  "spur": "#0d9488",
  "belt": "#db2777",
  null: "#94a3b8",
};

const FONT = {
  family: "Inter, system-ui, sans-serif",
  size: 12,
  color: "#475569",
};

const COMMON_LAYOUT = {
  font: FONT,
  paper_bgcolor: "white",
  plot_bgcolor: "white",
  margin: { l: 60, r: 30, t: 30, b: 50 },
  hoverlabel: {
    bgcolor: "white",
    bordercolor: "#dde3ea",
    font: { family: "Inter, sans-serif", size: 12, color: "#0f172a" },
  },
};

const COMMON_CONFIG = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ["lasso2d", "select2d", "autoScale2d"],
};

function colorFor(tx) {
  if (!tx) return TX_COLORS.null;
  return TX_COLORS[String(tx).toLowerCase()] || "#0e7490";
}

export function renderScatter(elId, data, opts = {}) {
  const el = document.getElementById(elId);
  if (!el) return;

  // The y-axis field is configurable so the page can show rated and peak
  // side-by-side. `peak_torque_nm` in the dataset is the start/stop peak
  // torque (启停峰值转矩) — NOT instantaneous-permissible torque.
  const yField    = opts.yField    || "peak_torque_nm";
  const yLabelKey = opts.yLabelKey || "chart.peak_torque";
  const yLabel    = t(yLabelKey);

  const byTx = new Map();
  for (const d of data) {
    if (d.weight_kg == null || d[yField] == null) continue;
    const key = d.transmission_type || "unspecified";
    if (!byTx.has(key)) byTx.set(key, []);
    byTx.get(key).push(d);
  }

  const allDensities = data.map((d) => d.torque_density_nm_per_kg).filter((v) => v != null);
  const dMin = allDensities.length ? Math.min(...allDensities) : 1;
  const dMax = allDensities.length ? Math.max(...allDensities) : 1;
  const sizeOf = (d) => {
    const v = d.torque_density_nm_per_kg;
    if (v == null || dMax === dMin) return 12;
    const tNorm = (v - dMin) / (dMax - dMin);
    return 8 + tNorm * 18; // smaller range than before since two charts share the row
  };

  const pinned = new Set(opts.pinnedIds || []);

  const traces = [...byTx.entries()].map(([tx, items]) => ({
    type: "scattergl",
    mode: "markers",
    name: tx,
    x: items.map((d) => d.weight_kg),
    y: items.map((d) => d[yField]),
    customdata: items.map((d) => [d.id, manufacturerDisplay(d.manufacturer), d.model, d.torque_density_nm_per_kg, d.max_speed_rpm]),
    marker: {
      size: items.map(sizeOf),
      color: items.map((d) => (pinned.has(d.id) ? "#ea580c" : colorFor(tx))),
      line: {
        color: items.map((d) => (pinned.has(d.id) ? "#9a3412" : "#ffffff")),
        width: items.map((d) => (pinned.has(d.id) ? 2 : 1)),
      },
      opacity: 0.85,
    },
    hovertemplate:
      "<b>%{customdata[1]} %{customdata[2]}</b><br>" +
      yLabel + ": %{y:.1f} Nm<br>" +
      "Weight: %{x:.3f} kg<br>" +
      "τ density: %{customdata[3]:.1f} Nm/kg<br>" +
      "Max speed: %{customdata[4]:.0f} rpm" +
      "<extra></extra>",
  }));

  const layout = {
    ...COMMON_LAYOUT,
    margin: { l: 56, r: 18, t: 18, b: 70 },
    xaxis: {
      title: { text: t("chart.weight"), font: { ...FONT, size: 12 } },
      type: "log",
      gridcolor: "#eef2f6",
      zerolinecolor: "#dde3ea",
    },
    yaxis: {
      title: { text: yLabel, font: { ...FONT, size: 12 } },
      type: "log",
      gridcolor: "#eef2f6",
      zerolinecolor: "#dde3ea",
    },
    legend: {
      orientation: "h",
      y: -0.22,
      font: { ...FONT, size: 11 },
    },
    showlegend: true,
  };

  Plotly.react(el, traces, layout, COMMON_CONFIG);

  if (opts.onPick) {
    el.removeAllListeners?.("plotly_click");
    el.on("plotly_click", (ev) => {
      const pt = ev.points && ev.points[0];
      if (pt && pt.customdata) opts.onPick(pt.customdata[0]);
    });
  }
}

export function renderRadar(elId, allData, pinnedIds) {
  const el = document.getElementById(elId);
  if (!el) return;

  const axes = [
    { key: "peak_torque_nm",          label: t("table.peak_torque") },
    { key: "rated_torque_nm",         label: t("table.rated_torque") },
    { key: "max_speed_rpm",           label: t("table.max_speed") },
    { key: "torque_density_nm_per_kg",label: t("table.density") },
    { key: "efficiency_pct",          label: t("compare.row.efficiency") },
    { key: "ratio",                   label: t("compare.row.ratio") },
  ];

  const maxes = {};
  for (const ax of axes) {
    const vals = allData.map((d) => d[ax.key]).filter((v) => v != null);
    maxes[ax.key] = vals.length ? Math.max(...vals) : 1;
  }

  const items = pinnedIds
    .map((id) => allData.find((d) => d.id === id))
    .filter(Boolean);

  if (!items.length) {
    Plotly.purge(el);
    el.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-size:14px;text-align:center;padding:0 32px;">' +
      escape(t("viz.radar_empty")) +
      "</div>";
    return;
  }

  const palette = ["#0e7490", "#ea580c", "#7c3aed", "#059669"];
  const traces = items.map((d, i) => {
    const r = axes.map((ax) => {
      const v = d[ax.key];
      const m = maxes[ax.key];
      return v != null && m > 0 ? (v / m) * 100 : 0;
    });
    return {
      type: "scatterpolar",
      r: [...r, r[0]],
      theta: [...axes.map((a) => a.label), axes[0].label],
      fill: "toself",
      name: `${manufacturerDisplay(d.manufacturer)} ${d.model}`,
      line: { color: palette[i % palette.length], width: 2 },
      fillcolor: hexA(palette[i % palette.length], 0.18),
      hovertemplate: axes.map((ax) =>
        `${ax.label}: ${formatVal(d[ax.key])}`,
      ).concat("<extra>" + manufacturerDisplay(d.manufacturer) + " " + d.model + "</extra>").join("<br>"),
    };
  });

  const layout = {
    ...COMMON_LAYOUT,
    polar: {
      bgcolor: "#f5f7fa",
      radialaxis: {
        visible: true,
        range: [0, 100],
        tickfont: { ...FONT, size: 10 },
        gridcolor: "#dde3ea",
      },
      angularaxis: {
        tickfont: { ...FONT, size: 12, color: "#0f172a" },
        gridcolor: "#dde3ea",
      },
    },
    legend: { orientation: "h", y: -0.1, font: { ...FONT, size: 11 } },
    showlegend: true,
  };

  Plotly.react(el, traces, layout, COMMON_CONFIG);
}

export function renderCurves(elId, detailsById) {
  const el = document.getElementById(elId);
  if (!el) return;

  const palette = ["#0e7490", "#ea580c", "#7c3aed", "#059669"];
  const traces = [];
  let i = 0;
  for (const [, d] of detailsById) {
    if (!d || !d.curves || !Array.isArray(d.curves.torque_speed)) { i++; continue; }
    const pts = d.curves.torque_speed;
    traces.push({
      type: "scatter",
      mode: "lines+markers",
      x: pts.map((p) => p.speed_rpm),
      y: pts.map((p) => p.torque_nm),
      name: `${manufacturerDisplay(d.manufacturer)} ${d.model}`,
      line: { color: palette[i % palette.length], width: 2 },
      marker: { size: 6, color: palette[i % palette.length] },
    });
    i++;
  }

  if (!traces.length) {
    Plotly.purge(el);
    el.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-size:13px;text-align:center;padding:0 32px;">' +
      escape(t("compare.no_curves")) +
      "</div>";
    return;
  }

  const layout = {
    ...COMMON_LAYOUT,
    margin: { l: 60, r: 30, t: 24, b: 50 },
    title: { text: t("compare.curves_title"), font: { ...FONT, size: 13, color: "#0f172a" } },
    xaxis: {
      title: { text: t("chart.speed"), font: { ...FONT, size: 12 } },
      gridcolor: "#eef2f6",
    },
    yaxis: {
      title: { text: t("chart.torque"), font: { ...FONT, size: 12 } },
      gridcolor: "#eef2f6",
    },
    legend: { orientation: "h", y: -0.22, font: { ...FONT, size: 11 } },
  };

  Plotly.react(el, traces, layout, COMMON_CONFIG);
}

export function renderTable(tableId, data, opts = {}) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  tbody.innerHTML = "";

  const pinned = new Set(opts.pinnedIds || []);
  const sortKey = opts.sortKey || "manufacturer";
  const sortDir = opts.sortDir || "asc";

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") {
      return sortDir === "asc" ? av - bv : bv - av;
    }
    return sortDir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  for (const d of sorted) {
    const tr = document.createElement("tr");
    if (pinned.has(d.id)) tr.classList.add("is-pinned");
    tr.innerHTML = `
      <td><button class="pin-btn" title="${escape(t("table.pin_tooltip"))}">${pinned.has(d.id) ? "✓" : "+"}</button></td>
      <td>${escape(manufacturerDisplay(d.manufacturer))}</td>
      <td>${escape(d.model)}</td>
      <td class="num">${formatVal(d.peak_torque_nm)}</td>
      <td class="num">${formatVal(d.rated_torque_nm)}</td>
      <td class="num">${formatVal(d.max_speed_rpm)}</td>
      <td class="num">${formatVal(d.weight_kg, 3)}</td>
      <td class="num">${formatVal(d.torque_density_nm_per_kg)}</td>
      <td>${escape(d.transmission_type)}</td>
      <td class="num">${formatVal(d.ratio)}</td>
    `;
    tr.querySelector(".pin-btn").onclick = () => opts.onPick && opts.onPick(d.id);
    tbody.append(tr);
  }
}

export function bindTableSort(tableId, onSort) {
  const ths = document.querySelectorAll(`#${tableId} thead th[data-sort]`);
  ths.forEach((th) => {
    th.onclick = () => onSort(th.dataset.sort);
  });
}

function formatVal(v, digits) {
  if (v == null || !Number.isFinite(v)) return "—";
  const d = digits ?? (Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2);
  return v.toFixed(d);
}

function escape(s) {
  if (s == null) return "—";
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );
}

function hexA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
