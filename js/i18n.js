// i18n.js — translation dictionary + DOM application + change-event bus
//
// Includes:
//   - UI string translations (en / zh)
//   - MANUFACTURERS map (Chinese canonical -> English brand name) with a
//     manufacturerDisplay() helper used by every component that renders a
//     manufacturer name. The underlying data field stays Chinese so filter
//     keys, hash-sync, and CSV export keep a stable identifier.
//   - GLOSSARY strings for the performance-parameter definitions section.

const STORAGE_KEY = "jae.lang";
const SUPPORTED = ["en", "zh"];

// ---------- manufacturer name map ----------
//
// Chinese name (as stored in data/families/*.json) -> English brand name.
// Sources verified via official manufacturer sites where available; for
// makers without an established English brand presence, the entry is a
// transliteration or descriptive name and contributors are welcome to
// refine it via PR.
const MANUFACTURERS = {
  "脉塔":       "MyActuator",
  "钛虎":       "Tihu Robotics",
  "高擎":       "High Torque Robotics",
  "伟达立":     "Weidali Robotics",
  "达妙":       "DAMIAO",
  "雷赛":       "Leadshine",
  "同川精密":   "Tongchuan Precision",
  "埃斯顿酷卓": "Estun Codroid",
  "智动力":     "Zhidongli",
  "曦诺未来":   "Xinuo Future",
  "泉智博":     "Quanzhibo Robotics",
  "泰科":       "Taike",
  "禾川":       "HCFA",
  "中大力德":   "Zhongda Lide",
  "动易":       "Dongyi",
  "因克斯":     "INX Robotics",
  "巨蟹智能":   "Juxie Intelligent",
  "意优":       "Eyou Robotics",
  "清能德创":   "Tsino Dynatron",
  "灵足时代":   "Robstride Dynamics",
  "珞石":       "Rokae",
  "璇玑动力":   "Astralldynamics",
};

export function manufacturerDisplay(name) {
  if (!name) return name;
  if (currentLang === "zh") return name;
  return MANUFACTURERS[name] || name;
}

// ---------- main translation dictionary ----------

const TRANSLATIONS = {
  en: {
    "lang.toggle.aria": "Language",
    "lang.en": "EN",
    "lang.zh": "中",

    "nav.explorer": "Explorer",
    "nav.about": "About",
    "nav.glossary": "Parameter glossary",
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
    "about.contact_title": "Contribute or contact",
    "about.contact_body": "Spotted incorrect specs or have an updated datasheet? Three ways to help:",
    "about.contact_pr": "Open a pull request on the GitHub repository to fix or extend the data — see the contribution guide in the repo README.",
    "about.contact_issue": "File an issue on GitHub if you can point at the source but don't want to edit the JSON yourself.",
    "about.contact_email_pre": "Email the maintainer directly at ",
    "about.contact_email_post": " — datasheets, scans, or measured curves all welcome.",

    "glossary.title": "Performance parameter definitions",
    "glossary.intro": "Quick reference for every spec column in the dataset, with the conventions used here. Where a manufacturer's datasheet uses a different definition, the entry's notes field calls it out.",
    "glossary.voltage.term": "Voltage",
    "glossary.voltage.desc": "DC bus voltage on the input side.",
    "glossary.peak_current.term": "Peak current",
    "glossary.peak_current.desc": "Peak phase current on the AC side, also the current limit set in the controller firmware. Typically corresponds to peak start/stop torque ÷ gear ratio.",
    "glossary.continuous_current.term": "Continuous current",
    "glossary.continuous_current.desc": "Maximum continuous AC-side current — the motor's rated current — corresponding to rated torque ÷ gear ratio. The motor reaches thermal equilibrium at this current at rated speed × gear ratio, but manufacturers rarely publish the resulting temperature rise.",
    "glossary.rated_speed.term": "Rated speed",
    "glossary.rated_speed.desc": "Maximum joint output speed at rated DC voltage and rated current (or rated torque). This is the speed at the rated-torque operating point — the true \"rated working point\". Motor-side rated speed = output rated speed × gear ratio.",
    "glossary.half_torque_speed.term": "Max speed at ½ rated torque",
    "glossary.half_torque_speed.desc": "Some manufacturers redefine \"rated speed\" as the maximum speed under half rated torque, which moves the value away from the true rated operating point. This column records that value separately. If a datasheet explicitly says \"with ½ rated torque\" or similar, put it here; the rated-speed column then corresponds to the true rated-torque condition (or unknown if not given).",
    "glossary.max_speed.term": "Maximum speed",
    "glossary.max_speed.desc": "The highest speed the joint can reach under mechanical or electrical limits, also the speed limit enforced by the controller firmware.",
    "glossary.rated_torque.term": "Rated torque",
    "glossary.rated_torque.desc": "Allowable continuous load torque around the rated speed (some manufacturers cite this at 2000 rpm).",
    "glossary.avg_load_torque.term": "Average load max torque",
    "glossary.avg_load_torque.desc": "Average load torque under varying torque/speed conditions. Larger than rated torque.",
    "glossary.start_stop_torque.term": "Start/stop peak torque",
    "glossary.start_stop_torque.desc": "Maximum torque allowed during start and stop transients due to load inertia. Larger than the average-load max torque.",
    "glossary.instantaneous_max_torque.term": "Instantaneous permissible max torque",
    "glossary.instantaneous_max_torque.desc": "External instantaneous shock torque tolerated under any condition. Exceeding it can permanently damage the gearbox. Larger than start/stop peak torque.",
    "glossary.torque_at_max_speed.term": "Output torque at maximum speed",
    "glossary.torque_at_max_speed.desc": "Output torque the joint can sustain at its maximum speed.",
    "glossary.rated_input_power.term": "Rated input power",
    "glossary.rated_input_power.desc": "DC-side input electrical power as published in the datasheet. Typically larger than rated output power (= rated torque × rated speed × 2π/60); the gap is motor + gearbox loss.",
    "glossary.peak_power.term": "Peak power",
    "glossary.peak_power.desc": "Manufacturer-supplied; usually the maximum output power along the cold-state torque-speed envelope, treated as a transient capability indicator. Cannot be derived from peak torque alone since the speed at peak torque is unknown.",
    "glossary.encoder.term": "Motor-side encoder",
    "glossary.encoder.desc": "If incremental rather than single-turn absolute, the resolution is converted to bit-precision as log₂(lines × 4) — hence the fractional values you may see.",
    "glossary.torque_constant.term": "Torque constant",
    "glossary.torque_constant.desc": "Motor rated torque divided by RMS continuous current (not the peak current; not the peak torque, since the motor may saturate; not the module-level rated torque, because of gearbox loss).",

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
    "nav.glossary": "参数定义",
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
    "about.contact_title": "贡献或联系",
    "about.contact_body": "发现规格错误或有更新的数据手册？三种方式可以帮助：",
    "about.contact_pr": "在 GitHub 仓库提交 pull request 修订或扩充数据 — 详见仓库 README 中的贡献说明。",
    "about.contact_issue": "如果你能指出来源但不想直接编辑 JSON，可以在 GitHub 提交 issue。",
    "about.contact_email_pre": "也可以直接发邮件给维护者：",
    "about.contact_email_post": " — 欢迎提交数据手册、扫描件或实测曲线。",

    "glossary.title": "性能参数定义",
    "glossary.intro": "数据集中各项规格字段的快速参考，以及本站采用的口径约定。当某厂家数据手册采用不同定义时，会在该条目的 notes 字段中注明。",
    "glossary.voltage.term": "电压",
    "glossary.voltage.desc": "直流侧的 DC 电压。",
    "glossary.peak_current.term": "最大电流",
    "glossary.peak_current.desc": "交流侧的电机电流峰值，也是电控软件的电流限值，通常与（启停峰值转矩 / 减速比）对应。",
    "glossary.continuous_current.term": "连续电流",
    "glossary.continuous_current.desc": "交流侧的电机可以连续运行的电流峰值，即电机的额定电流，与（额定转矩 / 减速比）对应。通常在（额定转速 × 减速比）下电机在此电流下可达到热平衡，但电机温升厂家通常不会给出。",
    "glossary.rated_speed.term": "额定转速",
    "glossary.rated_speed.desc": "在直流电压和额定电流（或额定转矩）条件下，关节模组能够达到的最大转速；该转速应为额定转矩工况下的转速（即真正的「额定工作点」）。电机侧的额定转速为（输出端额定转速 × 减速比）。",
    "glossary.half_torque_speed.term": "1/2 额定转矩对应的最大转速",
    "glossary.half_torque_speed.desc": "部分厂家将关节模组的「额定转速」定义为负载转矩为 1/2 额定转矩时的最大转速，使该值偏离真正的额定工作点。本表用此列单独记录该口径下的转速。若厂家 datasheet 明示「带 1/2 额定扭矩」或类似表述，应将其值放入本列；原「额定转速」列对应额定转矩工况，若厂家未给出，则置为 unknown。",
    "glossary.max_speed.term": "最高转速",
    "glossary.max_speed.desc": "在机械约束或电气约束下，关节所能达到的最高转速，电控软件的转速限值。",
    "glossary.rated_torque.term": "额定转矩",
    "glossary.rated_torque.desc": "表示输入转速为额定转速附近以内（或有的厂家标注 2000 r/min）的容许连续负载转矩。",
    "glossary.avg_load_torque.term": "平均负载最大转矩",
    "glossary.avg_load_torque.desc": "转矩转速变化时，计算的负载转矩平均值，大于额定转矩。",
    "glossary.start_stop_torque.term": "启停峰值转矩",
    "glossary.start_stop_torque.desc": "起动停止时，由于负载转动惯量作用，允许发生的最大转矩，大于平均负载最大转矩。",
    "glossary.instantaneous_max_torque.term": "瞬间容许最大转矩",
    "glossary.instantaneous_max_torque.desc": "任何情况下的外部瞬间冲击转矩，可能导致减速机永久损伤，大于启停峰值转矩。",
    "glossary.torque_at_max_speed.term": "最高转速下输出转矩",
    "glossary.torque_at_max_speed.desc": "关节在最高转速下的输出转矩。",
    "glossary.rated_input_power.term": "额定输入功率",
    "glossary.rated_input_power.desc": "直流侧的 DC 输入电功率，由厂家 datasheet 给出。其值通常大于额定输出功率（额定输出功率 = 额定转矩 × 额定转速 × 2π/60），差额为电机和减速器的损耗。",
    "glossary.peak_power.term": "峰值功率",
    "glossary.peak_power.desc": "由厂家给出，通常是冷态下关节转矩转速外特性曲线下输出功率的最大值，仅作为瞬时输出能力的指标。由于不知道峰值转矩对应的转速，因此无法计算得出。",
    "glossary.encoder.term": "电机端编码器",
    "glossary.encoder.desc": "如果不是单圈绝对值，而是增量式编码器，则按 log₂(线数 × 4) 转换为位数精度，因此会看到小数。",
    "glossary.torque_constant.term": "扭矩常数",
    "glossary.torque_constant.desc": "电机的额定转矩除以连续电流的 RMS 值，注意这里不是电流幅值，而是 RMS 值。这里不用电机的峰值转矩和最大电流，因为电机有可能电磁饱和。这里也不能使用模组的额定转矩和连续电流计算，因为有减速机损耗。",

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
