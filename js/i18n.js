// i18n.js — translation dictionary + DOM application + change-event bus

const STORAGE_KEY = "jae.lang";
const SUPPORTED = ["en", "zh"];

const TRANSLATIONS = {
  en: {
    "lang.toggle.aria": "Language",
    "lang.en": "EN",
    "lang.zh": "中",

    "nav.explorer": "Explorer",
    "nav.about": "About",
    "nav.github": "Data on GitHub",

    "brand": "Dynamic Robot Joint Actuator Comparison",

    "hero.eyebrow": "Open dataset",
    "hero.title.lead": "Compare dynamic robot joint actuators by ",
    "hero.title.accent": "torque, weight, and speed",
    "hero.title.tail": ".",
    "hero.sub": "A curated, continuously maintained database of quasi-direct-drive, harmonic, cycloidal, and planetary actuators powering today's quadrupeds, humanoids, manipulators, and exoskeletons. Filter, plot, and pin candidates side-by-side.",
    "hero.search.placeholder": "Search manufacturer or model… (e.g. AK80, Unitree, harmonic)",

    "stat.actuators": "Actuators",
    "stat.manufacturers": "Manufacturers",
    "stat.peak_torque": "Peak torque, max (Nm)",
    "stat.density": "Torque density, max (Nm/kg)",

    "filters.title": "Filters",
    "filters.reset": "Reset",
    "filters.manufacturer": "Manufacturer",
    "filters.transmission": "Transmission",
    "filters.joint": "Target joint",
    "filters.peak_torque": "Peak torque (Nm)",
    "filters.weight": "Weight (kg)",
    "filters.density": "Torque density (Nm/kg)",

    "tabs.scatter": "Scatter",
    "tabs.radar": "Radar",
    "tabs.table": "Table",

    "viz.results_suffix": "actuators",
    "viz.scatter_note": "Click a marker to pin an actuator into the comparison drawer. Marker size ∝ torque density.",
    "viz.radar_note": "Showing pinned actuators. Pin 2–4 from the scatter or table to compare normalized profiles.",
    "viz.radar_empty": "Pin 2–4 actuators (click on a scatter marker, or use the table) to compare profiles.",

    "table.manufacturer": "Manufacturer",
    "table.model": "Model",
    "table.peak_torque": "Peak τ (Nm)",
    "table.rated_torque": "Rated τ (Nm)",
    "table.max_speed": "Max ω (rad/s)",
    "table.weight": "Weight (kg)",
    "table.density": "τ density (Nm/kg)",
    "table.transmission": "Transmission",
    "table.ratio": "Ratio",
    "table.pin_tooltip": "Pin to compare",

    "compare.title": "Compare",
    "compare.pinned_suffix": "of 4 pinned",
    "compare.export": "Export CSV",
    "compare.clear": "Clear",
    "compare.collapse": "Collapse",
    "compare.spec": "Spec",
    "compare.unpin": "Unpin",
    "compare.section.identity": "Identity",
    "compare.section.mechanical": "Mechanical",
    "compare.section.electrical": "Electrical",
    "compare.section.transmission": "Transmission",
    "compare.section.application": "Application",
    "compare.row.manufacturer": "Manufacturer",
    "compare.row.model": "Model",
    "compare.row.year": "Year",
    "compare.row.peak_torque": "Peak torque (Nm)",
    "compare.row.rated_torque": "Rated torque (Nm)",
    "compare.row.max_speed": "Max speed (rad/s)",
    "compare.row.weight": "Weight (kg)",
    "compare.row.density": "Torque density (Nm/kg)",
    "compare.row.voltage": "Voltage (V)",
    "compare.row.peak_current": "Peak current (A)",
    "compare.row.continuous_current": "Continuous current (A)",
    "compare.row.motor_topology": "Motor topology",
    "compare.row.kv": "Kv (rpm/V)",
    "compare.row.tx_type": "Type",
    "compare.row.ratio": "Gear ratio",
    "compare.row.backdrivable": "Backdrivable",
    "compare.row.efficiency": "Efficiency (%)",
    "compare.row.target_joints": "Target joints",
    "compare.row.used_in_robots": "Used in robots",
    "compare.row.price": "Price (USD)",
    "compare.row.datasheet": "Datasheet",
    "compare.row.datasheet_link": "link",
    "compare.curves_title": "Torque-speed curves",
    "compare.no_curves": "No torque-speed curves available for the pinned actuators.",
    "compare.bool.yes": "yes",
    "compare.bool.no": "no",
    "compare.dash": "—",

    "chart.weight": "Weight (kg)",
    "chart.peak_torque": "Peak torque (Nm)",
    "chart.speed": "Speed (rad/s)",
    "chart.torque": "Torque (Nm)",

    "about.title": "About this dataset",
    "about.body_pre": "The Dynamic Robot Joint Actuator Comparison Site is an open, continuously maintained collection of specifications for actuators used in dynamic robots — quadrupeds, bipeds, humanoids, manipulators, and exoskeletons. Entries are sourced from manufacturer datasheets and published research. Contributions are welcome on GitHub: add a family file under ",
    "about.body_mid": " following the schema in ",
    "about.body_post": " and open a pull request.",

    "footer.opendata": "Open data",
    "footer.inspired": "Inspired by the",
    "footer.batemo": "Batemo Cell Explorer",

    "load.error": "Couldn't load actuator data.",
    "load.empty": "Dataset is empty. Add entries under data/families/.",
  },

  zh: {
    "lang.toggle.aria": "语言",
    "lang.en": "EN",
    "lang.zh": "中",

    "nav.explorer": "浏览",
    "nav.about": "关于",
    "nav.github": "GitHub 数据",

    "brand": "动态机器人关节执行器对比",

    "hero.eyebrow": "开放数据集",
    "hero.title.lead": "按",
    "hero.title.accent": "扭矩、重量、转速",
    "hero.title.tail": "对比动态机器人关节执行器。",
    "hero.sub": "持续维护的关节执行器数据库，涵盖准直驱、谐波、摆线、行星等多种类型，广泛用于四足、人形、机械臂和外骨骼机器人。可筛选、绘图，并将候选执行器并排固定对比。",
    "hero.search.placeholder": "搜索制造商或型号（如 AK80、Unitree、harmonic）…",

    "stat.actuators": "执行器数",
    "stat.manufacturers": "制造商数",
    "stat.peak_torque": "最大峰值扭矩 (Nm)",
    "stat.density": "最大扭矩密度 (Nm/kg)",

    "filters.title": "筛选",
    "filters.reset": "重置",
    "filters.manufacturer": "制造商",
    "filters.transmission": "传动方式",
    "filters.joint": "目标关节",
    "filters.peak_torque": "峰值扭矩 (Nm)",
    "filters.weight": "重量 (kg)",
    "filters.density": "扭矩密度 (Nm/kg)",

    "tabs.scatter": "散点图",
    "tabs.radar": "雷达图",
    "tabs.table": "表格",

    "viz.results_suffix": "个执行器",
    "viz.scatter_note": "点击标记可将执行器加入对比抽屉。标记大小 ∝ 扭矩密度。",
    "viz.radar_note": "显示已固定的执行器。从散点图或表格中固定 2–4 个进行归一化对比。",
    "viz.radar_empty": "请固定 2–4 个执行器（点击散点标记或在表格中选择）以对比性能曲线。",

    "table.manufacturer": "制造商",
    "table.model": "型号",
    "table.peak_torque": "峰值 τ (Nm)",
    "table.rated_torque": "额定 τ (Nm)",
    "table.max_speed": "最大 ω (rad/s)",
    "table.weight": "重量 (kg)",
    "table.density": "τ 密度 (Nm/kg)",
    "table.transmission": "传动",
    "table.ratio": "减速比",
    "table.pin_tooltip": "固定以对比",

    "compare.title": "对比",
    "compare.pinned_suffix": "/ 4 已固定",
    "compare.export": "导出 CSV",
    "compare.clear": "清空",
    "compare.collapse": "收起",
    "compare.spec": "规格",
    "compare.unpin": "取消固定",
    "compare.section.identity": "标识",
    "compare.section.mechanical": "机械",
    "compare.section.electrical": "电气",
    "compare.section.transmission": "传动",
    "compare.section.application": "应用",
    "compare.row.manufacturer": "制造商",
    "compare.row.model": "型号",
    "compare.row.year": "年份",
    "compare.row.peak_torque": "峰值扭矩 (Nm)",
    "compare.row.rated_torque": "额定扭矩 (Nm)",
    "compare.row.max_speed": "最大转速 (rad/s)",
    "compare.row.weight": "重量 (kg)",
    "compare.row.density": "扭矩密度 (Nm/kg)",
    "compare.row.voltage": "电压 (V)",
    "compare.row.peak_current": "峰值电流 (A)",
    "compare.row.continuous_current": "持续电流 (A)",
    "compare.row.motor_topology": "电机结构",
    "compare.row.kv": "Kv (rpm/V)",
    "compare.row.tx_type": "类型",
    "compare.row.ratio": "减速比",
    "compare.row.backdrivable": "可反驱",
    "compare.row.efficiency": "效率 (%)",
    "compare.row.target_joints": "目标关节",
    "compare.row.used_in_robots": "应用机器人",
    "compare.row.price": "价格 (USD)",
    "compare.row.datasheet": "数据手册",
    "compare.row.datasheet_link": "链接",
    "compare.curves_title": "扭矩-转速曲线",
    "compare.no_curves": "已固定执行器无扭矩-转速曲线数据。",
    "compare.bool.yes": "是",
    "compare.bool.no": "否",
    "compare.dash": "—",

    "chart.weight": "重量 (kg)",
    "chart.peak_torque": "峰值扭矩 (Nm)",
    "chart.speed": "转速 (rad/s)",
    "chart.torque": "扭矩 (Nm)",

    "about.title": "关于本数据集",
    "about.body_pre": "动态机器人关节执行器对比是一个开放的、持续维护的执行器规格集合，涵盖动态机器人 — 四足、双足、人形、机械臂和外骨骼。条目来源于制造商数据手册和已发表研究。欢迎在 GitHub 上贡献：在 ",
    "about.body_mid": " 下添加家族文件，遵循 ",
    "about.body_post": " 中的模式，然后提交 pull request。",

    "footer.opendata": "开放数据",
    "footer.inspired": "灵感来自",
    "footer.batemo": "Batemo Cell Explorer",

    "load.error": "无法加载执行器数据。",
    "load.empty": "数据集为空。请在 data/families/ 下添加条目。",
  },
};

// ---------- state ----------

let currentLang = readPreference();
const listeners = new Set();

function readPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch {}
  const browser = (navigator.language || "en").toLowerCase();
  if (browser.startsWith("zh")) return "zh";
  return "en";
}

export function getLang() { return currentLang; }

export function t(key) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  return dict[key] ?? TRANSLATIONS.en[key] ?? key;
}

export function setLang(lang) {
  if (!SUPPORTED.includes(lang) || lang === currentLang) return;
  currentLang = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  applyToDOM();
  for (const fn of listeners) fn(lang);
}

export function onLangChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// ---------- DOM application ----------

export function applyToDOM(root = document) {
  // textContent
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  // attributes — `data-i18n-attr="placeholder:hero.search.placeholder,title:foo"`
  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    for (const pair of el.dataset.i18nAttr.split(",")) {
      const [attr, key] = pair.split(":").map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    }
  });
}

// ---------- toggle UI ----------

export function mountToggle(container) {
  const wrap = document.createElement("div");
  wrap.className = "lang-toggle";
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", t("lang.toggle.aria"));
  for (const lang of SUPPORTED) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.lang = lang;
    btn.textContent = t(`lang.${lang}`);
    btn.classList.toggle("is-active", lang === currentLang);
    btn.onclick = () => setLang(lang);
    wrap.append(btn);
  }
  container.append(wrap);

  // Keep button highlight in sync
  onLangChange(() => {
    wrap.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.lang === currentLang);
    });
    wrap.setAttribute("aria-label", t("lang.toggle.aria"));
  });
}

// Initialize the html lang attribute on first load
document.documentElement.lang = currentLang === "zh" ? "zh-CN" : "en";
