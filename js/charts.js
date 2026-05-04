// charts.js — Plotly renderers for scatter, radar, torque-speed curves; HTML for spec table

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

// ---------------------------------------------------------------------------
// Scatter: weight (x) vs peak torque (y), marker size = torque density,
// color = transmission type. Click to pin.

export function renderScatter(elId, data, opts = {}) {
  const el = document.getElementById(elId);
  if (!el) return;

  const byTx = new Map();
  for (const d of data) {
    if (d.weight_kg == null || d.peak_torque_nm == null) continue;
    const key = d.transmission_type || "unspecified";
    if (!byTx.has(key)) byTx.set(key, []);
    byTx.get(key).push(d);
  }

  const allDensities = data.map((d) => d.torque_density_nm_per_kg).filter((v) => v != null);
  const dMin = allDensities.length ? Math.min(...allDensities) : 1;
  const dMax = allDensities.length ? Math.max(...allDensities) : 1;
  const sizeOf = (d) => {
    const v = d.torque_density_nm_per_kg;
    if (v == null || dMax === dMin) return 14;
    const t = (v - dMin) / (dMax - dMin);
    return 10 + t * 22; // 10–32 px
  };

  const pinned = new Set(opts.pinnedIds || []);

  const traces = [...byTx.entries()].map(([tx, items]) => ({
    type: "scattergl",
    mode: "markers",
    name: tx,
    x: items.map((d) => d.weight_kg),
    y: items.map((d) => d.peak_torque_nm),
    customdata: items.map((d) => [d.id, d.manufacturer, d.model, d.torque_density_nm_per_kg, d.max_speed_rad_s]),
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
      "Peak torque: %{y:.1f} Nm<br>" +
      "Weight: %{x:.3f} kg<br>" +
      "τ density: %{customdata[3]:.1f} Nm/kg<br>" +
      "Max speed: %{customdata[4]:.1f} rad/s" +
      "<extra></extra>",
  }));

  const layout = {
    ...COMMON_LAYOUT,
    xaxis: {
      title: { text: "Weight (kg)", font: { ...FONT, size: 13 } },
      type: "log",
      gridcolor: "#eef2f6",
      zerolinecolor: "#dde3ea",
    },
    yaxis: {
      title: { text: "Peak torque (Nm)", font: { ...FONT, size: 13 } },
      type: "log",
      gridcolor: "#eef2f6",
      zerolinecolor: "#dde3ea",
    },
    legend: {
      orientation: "h",
      y: -0.18,
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

// ---------------------------------------------------------------------------
// Radar: normalized comparison across pinned actuators.

export function renderRadar(elId, allData, pinnedIds) {
  const el = document.getElementById(elId);
  if (!el) return;

  const axes = [
    { key: "peak_torque_nm",          label: "Peak τ" },
    { key: "rated_torque_nm",         label: "Rated τ" },
    { key: "max_speed_rad_s",         label: "Max ω" },
    { key: "torque_density_nm_per_kg",label: "τ density" },
    { key: "efficiency_pct",          label: "Efficiency" },
    { key: "ratio",                   label: "Gear ratio" },
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
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-size:14px;">' +
      "Pin 2–4 actuators (click on a scatter marker, or use the table) to compare profiles." +
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
      name: `${d.manufacturer} ${d.model}`,
      line: { color: palette[i % palette.length], width: 2 },
      fillcolor: hexA(palette[i % palette.length], 0.18),
      hovertemplate: axes.map((ax) =>
        `${ax.label}: ${formatVal(d[ax.key])}`,
      ).concat("<extra>" + d.manufacturer + " " + d.model + "</extra>").join("<br>"),
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

// ---------------------------------------------------------------------------
// Torque-speed overlay (compare drawer)

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
      x: pts.map((p) => p.speed_rad_s),
      y: pts.map((p) => p.torque_nm),
      name: `${d.manufacturer} ${d.model}`,
      line: { color: palette[i % palette.length], width: 2 },
      marker: { size: 6, color: palette[i % palette.length] },
    });
    i++;
  }

  if (!traces.length) {
    Plotly.purge(el);
    el.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-size:13px;">' +
      "No torque-speed curves available for the pinned actuators." +
      "</div>";
    return;
  }

  const layout = {
    ...COMMON_LAYOUT,
    margin: { l: 60, r: 30, t: 24, b: 50 },
    title: { text: "Torque-speed curves", font: { ...FONT, size: 13, color: "#0f172a" } },
    xaxis: {
      title: { text: "Speed (rad/s)", font: { ...FONT, size: 12 } },
      gridcolor: "#eef2f6",
    },
    yaxis: {
      title: { text: "Torque (Nm)", font: { ...FONT, size: 12 } },
      gridcolor: "#eef2f6",
    },
    legend: { orientation: "h", y: -0.22, font: { ...FONT, size: 11 } },
  };

  Plotly.react(el, traces, layout, COMMON_CONFIG);
}

// ---------------------------------------------------------------------------
// Table

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
      <td><button class="pin-btn" title="Pin to compare">${pinned.has(d.id) ? "✓" : "+"}</button></td>
      <td>${escape(d.manufacturer)}</td>
      <td>${escape(d.model)}</td>
      <td class="num">${formatVal(d.peak_torque_nm)}</td>
      <td class="num">${formatVal(d.rated_torque_nm)}</td>
      <td class="num">${formatVal(d.max_speed_rad_s)}</td>
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

// ---------------------------------------------------------------------------
// Helpers

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
