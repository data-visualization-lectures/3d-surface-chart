import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ===== SECTION 0: I18N =====
const LANG = navigator.language.startsWith('ja') ? 'ja' : 'en';

const I18N = {
  title:           { ja: '3D Surface Chart', en: '3D Surface Chart' },
  mofGroup:        { ja: '財務省 過去の金利情報 (1974-)', en: 'MOF Historical Interest Rates (1974-)' },
  recent5:         { ja: '直近5年', en: 'Recent 5 Years' },
  recent10:        { ja: '直近10年', en: 'Recent 10 Years' },
  decade2020:      { ja: '2020年代', en: '2020s' },
  decade2010:      { ja: '2010年代', en: '2010s' },
  decade2000:      { ja: '2000年代', en: '2000s' },
  decade1990:      { ja: '1990年代', en: '1990s' },
  decade1980:      { ja: '1980年代', en: '1980s' },
  allPeriod:       { ja: '全期間 (1974-)', en: 'All Periods (1974-)' },
  loadCsv:         { ja: 'CSV読込', en: 'Load CSV' },
  csvFormatHelp:   { ja: 'CSV形式 ?', en: 'CSV format ?' },
  csvTooltip: {
    ja: 'CSV形式:\nlabel,col1,col2,col3,...\n2024-01-02,5.53,5.47,5.36,...\n...\n1列目: 行ラベル（日付等）\nその他の列: 数値データ',
    en: 'CSV format:\nlabel,col1,col2,col3,...\n2024-01-02,5.53,5.47,5.36,...\n...\nFirst column: row label (e.g. date)\nOther columns: numeric values',
  },
  sequential:      { ja: '連続的 (Sequential)', en: 'Sequential' },
  diverging:       { ja: '分岐的 (Diverging)', en: 'Diverging' },
  zeroBasis:       { ja: '0基準', en: 'Zero-centered' },
  dropCsv:         { ja: 'CSVファイルをここにドロップ', en: 'Drop CSV file here' },
  axisValue:       { ja: '値', en: 'Value' },
  axisCategory:    { ja: 'カテゴリ', en: 'Category' },
  axisDate:        { ja: '日付', en: 'Date' },
  dataInfo: {
    ja: (n, f, l, m, mf, ml) => `${n}行 (${f} ~ ${l}) | ${m}列 (${mf} ~ ${ml})`,
    en: (n, f, l, m, mf, ml) => `${n} rows (${f} ~ ${l}) | ${m} columns (${mf} ~ ${ml})`,
  },
  alertCsvFile:    { ja: '.csvファイルを選択してください', en: 'Please select a .csv file' },
  alertFewRows:    { ja: 'データ行が2行以上必要です', en: 'Need at least 2 data rows' },
  alertParseError: { ja: 'CSV解析エラー: ', en: 'CSV parse error: ' },
};

function t(key) { return I18N[key][LANG]; }

function applyI18n() {
  document.documentElement.lang = LANG === 'ja' ? 'ja' : 'en';
  document.title = t('title');

  // data-i18n 属性を持つ要素にテキストを適用
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  // optgroup の label 属性
  document.getElementById('mof-optgroup').label = t('mofGroup');
  document.getElementById('seq-optgroup').label = t('sequential');
  document.getElementById('div-optgroup').label = t('diverging');
}

// ===== SECTION 1: CONFIGURATION =====
const CONFIG = {
  surfaceWidth: 30,
  surfaceHeight: 12,
  surfaceDepth: 30,
  gridOpacity: 0.25,
  gridColor: 0x555555,
  bgColor: 0xffffff,
  cameraFov: 45,
  transitionFrames: 90,
  nanColor: new THREE.Color(0xbbbbbb),
};

// ===== SECTION 2: CAMERA PRESETS =====
const CAMERA_PRESETS = {
  overview: {
    position: [-20, 12, 40],
    target: [CONFIG.surfaceWidth / 2, CONFIG.surfaceHeight * 0.3, CONFIG.surfaceDepth / 2],
  },
  front: {
    position: [CONFIG.surfaceWidth / 2, CONFIG.surfaceHeight * 0.5, CONFIG.surfaceDepth + 30],
    target: [CONFIG.surfaceWidth / 2, CONFIG.surfaceHeight * 0.3, CONFIG.surfaceDepth / 2],
  },
  top: {
    position: [CONFIG.surfaceWidth / 2, 55, CONFIG.surfaceDepth / 2 + 0.1],
    target: [CONFIG.surfaceWidth / 2, 0, CONFIG.surfaceDepth / 2],
  },
  side: {
    position: [-25, CONFIG.surfaceHeight * 0.6, CONFIG.surfaceDepth / 2],
    target: [CONFIG.surfaceWidth / 2, CONFIG.surfaceHeight * 0.3, CONFIG.surfaceDepth / 2],
  },
};

// ===== SECTION 3: SAMPLE DATA (CSV) =====

// CSV file paths for sample datasets
const SAMPLE_CSV = {
  us: 'data/us-treasury.csv',
};

// Cache for fetched sample data
const sampleCache = {};

async function fetchSampleCSV(url) {
  if (sampleCache[url]) return sampleCache[url];
  const response = await fetch(url);
  const text = await response.text();
  const parsed = d3.csvParse(text.trim());
  const indexCol = parsed.columns[0];
  const maturities = parsed.columns.slice(1);
  const maturityMonths = maturities.map(parseMaturityToMonths);
  const curves = parsed.map(row => ({
    date: row[indexCol],
    yields: maturities.map(col => {
      const v = parseFloat(row[col]);
      return isNaN(v) ? NaN : v;
    }),
  }));
  const data = { maturities, maturityMonths, curves };
  sampleCache[url] = data;
  return data;
}

// --- Random Demo Generator ---
function generateRandomData() {
  const maturities = ['3M','6M','1Y','2Y','5Y','10Y','20Y','30Y'];
  const maturityMonths = [3, 6, 12, 24, 60, 120, 240, 360];
  const curves = [];
  const numDates = 60;
  let baseRate = 2.0 + Math.random() * 2;

  for (let i = 0; i < numDates; i++) {
    const d = new Date(2020, i, 1);
    const dateStr = d.toISOString().slice(0, 10);
    baseRate += (Math.random() - 0.5) * 0.3;
    baseRate = Math.max(-0.5, Math.min(7, baseRate));
    const yields = maturityMonths.map(m => {
      const spread = Math.log(m / 3 + 1) * (0.8 + Math.random() * 0.4);
      const noise = (Math.random() - 0.5) * 0.2;
      return Math.round((baseRate + spread + noise) * 100) / 100;
    });
    curves.push({ date: dateStr, yields });
  }
  return { maturities, maturityMonths, curves };
}

// ===== SECTION 3b: MOF CSV DATA =====
const MOF_CSV_FILE = 'data/jgbcm-all.csv';

let mofCurves = null; // loaded on demand
let mofMaturities = [];
let mofMaturityMonths = [];

const MOF_PERIODS = {
  'mof-recent5':  { start: new Date().getFullYear() - 5, end: 2100 },
  'mof-recent10': { start: new Date().getFullYear() - 10, end: 2100 },
  'mof-2020s':    { start: 2020, end: 2029 },
  'mof-2010s':    { start: 2010, end: 2019 },
  'mof-2000s':    { start: 2000, end: 2009 },
  'mof-1990s':    { start: 1990, end: 1999 },
  'mof-1980s':    { start: 1980, end: 1989 },
  'mof-all':      { start: 1974, end: 2100 },
};

async function fetchMOFData() {
  if (mofCurves) return; // already loaded
  const response = await fetch(MOF_CSV_FILE);
  const text = await response.text();
  const parsed = d3.csvParse(text.trim());

  mofMaturities = parsed.columns.filter(c => c.toLowerCase() !== 'date');
  mofMaturityMonths = mofMaturities.map(parseMaturityToMonths);

  mofCurves = parsed.map(row => ({
    date: row.date,
    yields: mofMaturities.map(col => {
      const v = parseFloat(row[col]);
      return isNaN(v) ? NaN : v;
    }),
  }));
}

// Sample to monthly (pick first available entry per month)
function sampleMonthly(curves) {
  const seen = new Set();
  return curves.filter(c => {
    const key = c.date.slice(0, 7); // YYYY-MM
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getMOFFilteredData(startYear, endYear) {
  const filtered = mofCurves.filter(c => {
    const y = parseInt(c.date.slice(0, 4));
    return y >= startYear && y <= endYear;
  });
  return {
    maturities: mofMaturities,
    maturityMonths: mofMaturityMonths,
    curves: sampleMonthly(filtered),
  };
}

// ===== SECTION 4: STATE =====
let renderer, camera, controls, scene;
let surfaceGroup = null;
let labelElements = [];
let currentData = null;
let yieldMin = 0, yieldMax = 6;
let xScale, yScale, zScale, colorScale;
let currentColorScheme = 'YlOrRd';
let zeroCentered = false;

// Camera animation
let animating = false;
let animStartPos, animEndPos, animStartTarget, animEndTarget;
let animFrame = 0;

// ===== SECTION 4b: COLOR SCHEME HELPERS =====
const DIVERGING_SCHEMES = new Set([
  'RdBu','RdYlBu','RdYlGn','Spectral','BrBG','PRGn','PiYG','PuOr','RdGy'
]);

function getInterpolator(name) {
  return d3['interpolate' + name] || d3.interpolateYlOrRd;
}

function isDiverging() {
  return DIVERGING_SCHEMES.has(currentColorScheme);
}

function buildColorScale() {
  const interp = getInterpolator(currentColorScheme);
  if (isDiverging() && zeroCentered) {
    const absMax = Math.max(Math.abs(yieldMin), Math.abs(yieldMax));
    return d3.scaleDiverging(interp).domain([absMax, 0, -absMax]);
  }
  if (isDiverging()) {
    return d3.scaleDiverging(interp).domain([yieldMax, (yieldMin + yieldMax) / 2, yieldMin]);
  }
  return d3.scaleSequential(interp).domain([yieldMin, yieldMax]);
}

function updateColors() {
  if (!currentData || !surfaceGroup) return;
  colorScale = buildColorScale();

  // Update surface mesh vertex colors
  surfaceGroup.traverse(obj => {
    if (obj.isMesh && obj.geometry.getAttribute('color')) {
      const { maturityMonths, curves } = currentData;
      const numX = maturityMonths.length;
      const numZ = curves.length;
      const colors = obj.geometry.getAttribute('color');
      for (let iz = 0; iz < numZ; iz++) {
        for (let ix = 0; ix < numX; ix++) {
          const idx = iz * numX + ix;
          const raw = curves[iz].yields[ix];
          const c = isNaN(raw) ? CONFIG.nanColor : new THREE.Color(colorScale(raw));
          colors.setXYZ(idx, c.r, c.g, c.b);
        }
      }
      colors.needsUpdate = true;
    }
  });

  buildLegend();
}

// ===== SECTION 5: INITIALIZATION =====
async function init() {
  applyI18n();
  const container = document.getElementById('chart-container');

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(CONFIG.bgColor);
  container.appendChild(renderer.domElement);

  // Camera
  camera = new THREE.PerspectiveCamera(CONFIG.cameraFov, 2, 0.1, 1000);
  const preset = CAMERA_PRESETS.overview;
  camera.position.set(...preset.position);

  // Scene
  scene = new THREE.Scene();

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(...preset.target);
  controls.update();

  // Resize
  onResize();
  new ResizeObserver(onResize).observe(container);
  window.addEventListener('resize', onResize);

  // Event listeners
  setupEventListeners();

  // Load default data (matches dropdown default: mof-recent5)
  const defaultPeriod = MOF_PERIODS['mof-recent5'];
  await fetchMOFData();
  loadData(getMOFFilteredData(defaultPeriod.start, defaultPeriod.end));

  // Animation loop
  animate();
}

// ===== SECTION 6: DATA LOADING =====
function loadData(data) {
  currentData = data;
  const { maturityMonths, curves } = data;

  // Compute yield range (ignore NaN)
  let allYields = curves.flatMap(c => c.yields).filter(v => !isNaN(v));
  yieldMin = Math.floor(Math.min(...allYields));
  yieldMax = Math.ceil(Math.max(...allYields));
  if (yieldMin === yieldMax) { yieldMin -= 1; yieldMax += 1; }

  // D3 scales
  xScale = d3.scaleLinear()
    .domain([d3.min(maturityMonths), d3.max(maturityMonths)])
    .range([0, CONFIG.surfaceWidth]);

  yScale = d3.scaleLinear()
    .domain([yieldMin, yieldMax])
    .range([0, CONFIG.surfaceHeight]);

  zScale = d3.scaleLinear()
    .domain([0, curves.length - 1])
    .range([0, CONFIG.surfaceDepth]);

  colorScale = buildColorScale();

  // Clear previous
  if (surfaceGroup) {
    scene.remove(surfaceGroup);
    surfaceGroup.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }
  clearLabels();

  // Build scene
  surfaceGroup = new THREE.Group();
  surfaceGroup.add(buildSurface(data));
  surfaceGroup.add(buildGridLines(data));
  surfaceGroup.add(buildBoundingBox());
  scene.add(surfaceGroup);

  // Labels & legend
  createLabels(data);
  buildLegend();
  updateDataInfo(data);
}

// ===== SECTION 7: SURFACE MESH =====
function buildSurface(data) {
  const { maturityMonths, curves } = data;
  const numX = maturityMonths.length;
  const numZ = curves.length;
  const totalVerts = numX * numZ;

  const positions = new Float32Array(totalVerts * 3);
  const colors = new Float32Array(totalVerts * 3);

  for (let iz = 0; iz < numZ; iz++) {
    for (let ix = 0; ix < numX; ix++) {
      const idx = (iz * numX + ix) * 3;
      const yieldVal = curves[iz].yields[ix];
      const val = isNaN(yieldVal) ? 0 : yieldVal;

      positions[idx]     = xScale(maturityMonths[ix]);
      positions[idx + 1] = yScale(val);
      positions[idx + 2] = zScale(iz);

      const color = isNaN(yieldVal) ? CONFIG.nanColor : new THREE.Color(colorScale(val));
      colors[idx]     = color.r;
      colors[idx + 1] = color.g;
      colors[idx + 2] = color.b;
    }
  }

  const indices = [];
  for (let iz = 0; iz < numZ - 1; iz++) {
    for (let ix = 0; ix < numX - 1; ix++) {
      const a = iz * numX + ix;
      const b = a + 1;
      const c = a + numX;
      const d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(geometry, material);
}

// ===== SECTION 8: GRID LINES =====
function buildGridLines(data) {
  const group = new THREE.Group();
  const { maturityMonths, curves } = data;
  const numX = maturityMonths.length;
  const numZ = curves.length;

  const surfaceLineMat = new THREE.LineBasicMaterial({
    color: CONFIG.gridColor,
    opacity: CONFIG.gridOpacity,
    transparent: true,
  });

  // Lines along date axis (one per maturity)
  for (let ix = 0; ix < numX; ix++) {
    const points = [];
    for (let iz = 0; iz < numZ; iz++) {
      const val = isNaN(curves[iz].yields[ix]) ? 0 : curves[iz].yields[ix];
      points.push(new THREE.Vector3(
        xScale(maturityMonths[ix]),
        yScale(val),
        zScale(iz)
      ));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    group.add(new THREE.Line(geom, surfaceLineMat));
  }

  // Lines along maturity axis (sampled dates)
  const dateStep = Math.max(1, Math.floor(numZ / 24));
  for (let iz = 0; iz < numZ; iz += dateStep) {
    const points = [];
    for (let ix = 0; ix < numX; ix++) {
      const val = isNaN(curves[iz].yields[ix]) ? 0 : curves[iz].yields[ix];
      points.push(new THREE.Vector3(
        xScale(maturityMonths[ix]),
        yScale(val),
        zScale(iz)
      ));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    group.add(new THREE.Line(geom, surfaceLineMat));
  }
  // Last date line
  {
    const iz = numZ - 1;
    const points = [];
    for (let ix = 0; ix < numX; ix++) {
      const val = isNaN(curves[iz].yields[ix]) ? 0 : curves[iz].yields[ix];
      points.push(new THREE.Vector3(
        xScale(maturityMonths[ix]),
        yScale(val),
        zScale(iz)
      ));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    group.add(new THREE.Line(geom, surfaceLineMat));
  }

  return group;
}

// ===== SECTION 9: BOUNDING BOX / FLOOR GRID =====
function buildBoundingBox() {
  const group = new THREE.Group();
  const W = CONFIG.surfaceWidth;
  const H = CONFIG.surfaceHeight;
  const D = CONFIG.surfaceDepth;

  const axisMat = new THREE.LineBasicMaterial({ color: 0x999999, opacity: 0.5, transparent: true });

  // Floor rectangle
  const floor = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(W, 0, 0),
    new THREE.Vector3(W, 0, D),
    new THREE.Vector3(0, 0, D),
    new THREE.Vector3(0, 0, 0),
  ];
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(floor), axisMat));

  // Vertical edges
  [[0, 0], [W, 0], [W, D], [0, D]].forEach(([x, z]) => {
    const pts = [new THREE.Vector3(x, 0, z), new THREE.Vector3(x, H, z)];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), axisMat));
  });

  // Top rectangle
  const top = [
    new THREE.Vector3(0, H, 0),
    new THREE.Vector3(W, H, 0),
    new THREE.Vector3(W, H, D),
    new THREE.Vector3(0, H, D),
    new THREE.Vector3(0, H, 0),
  ];
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(top), axisMat));

  // Floor grid lines (yield ticks)
  const gridMat = new THREE.LineBasicMaterial({ color: 0xcccccc, opacity: 0.3, transparent: true });
  const yTicks = d3.ticks(yieldMin, yieldMax, 6);
  yTicks.forEach(tick => {
    const y = yScale(tick);
    // Left wall
    const pts1 = [new THREE.Vector3(0, y, 0), new THREE.Vector3(0, y, D)];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts1), gridMat));
    // Back wall
    const pts2 = [new THREE.Vector3(0, y, 0), new THREE.Vector3(W, y, 0)];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), gridMat));
  });

  return group;
}

// ===== SECTION 10: AXIS LABELS =====
function clearLabels() {
  labelElements.forEach(el => el.remove());
  labelElements = [];
}

function createLabels(data) {
  const container = document.getElementById('chart-container');
  const { maturities, maturityMonths, curves } = data;

  // Yield axis labels (front-right edge, closest to camera)
  const yTicks = d3.ticks(yieldMin, yieldMax, 6);
  yTicks.forEach(tick => {
    const el = makeLabel(`${tick}`);
    el._anchor = new THREE.Vector3(CONFIG.surfaceWidth + 1.5, yScale(tick), CONFIG.surfaceDepth + 0.5);
    container.appendChild(el);
    labelElements.push(el);
  });

  // Yield axis title
  const yTitle = makeLabel(t('axisValue'), true);
  yTitle._anchor = new THREE.Vector3(CONFIG.surfaceWidth + 3, yScale((yieldMin + yieldMax) / 2), CONFIG.surfaceDepth + 1);
  container.appendChild(yTitle);
  labelElements.push(yTitle);

  // Maturity axis labels (front edge, z = surfaceDepth)
  const labelIndices = selectLabelIndices(maturities);
  labelIndices.forEach(ix => {
    const el = makeLabel(maturities[ix]);
    el._anchor = new THREE.Vector3(xScale(maturityMonths[ix]), -1, CONFIG.surfaceDepth + 1.5);
    container.appendChild(el);
    labelElements.push(el);
  });

  // Maturity axis title
  const xTitle = makeLabel(t('axisCategory'), true);
  xTitle._anchor = new THREE.Vector3(CONFIG.surfaceWidth / 2, -2.5, CONFIG.surfaceDepth + 3);
  container.appendChild(xTitle);
  labelElements.push(xTitle);

  // Date axis labels (left edge, x = 0, back side)
  // Adaptive labeling based on data span and frequency
  const firstDate = curves[0].date;
  const lastDate = curves[curves.length - 1].date;
  const spanYears = (new Date(lastDate) - new Date(firstDate)) / (365.25 * 24 * 3600 * 1000);

  // Decide label granularity: year-month for short spans, year for long spans
  const useMonthLabels = spanYears <= 3;

  if (useMonthLabels) {
    // Short span: show year-month labels, thinned to ~12
    const monthEntries = [];
    const seenMonths = new Set();
    curves.forEach((c, iz) => {
      const key = c.date.slice(0, 7); // YYYY-MM
      if (!seenMonths.has(key)) {
        seenMonths.add(key);
        monthEntries.push({ label: key, iz });
      }
    });
    const maxLabels = 12;
    const step = Math.max(1, Math.ceil(monthEntries.length / maxLabels));
    monthEntries.forEach((entry, i) => {
      if (i === 0 || i === monthEntries.length - 1 || i % step === 0) {
        const el = makeLabel(entry.label);
        el._anchor = new THREE.Vector3(-2, -1, zScale(entry.iz));
        container.appendChild(el);
        labelElements.push(el);
      }
    });
  } else {
    // Long span: show year labels using d3.ticks for nice intervals
    const yearEntries = [];
    const seenYears = new Set();
    curves.forEach((c, iz) => {
      const year = parseInt(c.date.slice(0, 4));
      if (!seenYears.has(year)) {
        seenYears.add(year);
        yearEntries.push({ year, iz });
      }
    });
    const firstYear = yearEntries[0].year;
    const lastYear = yearEntries[yearEntries.length - 1].year;
    const tickYears = new Set(d3.ticks(firstYear, lastYear, 10).map(Math.round));
    // Always include first and last
    tickYears.add(firstYear);
    tickYears.add(lastYear);
    yearEntries.forEach(entry => {
      if (tickYears.has(entry.year)) {
        const el = makeLabel(String(entry.year));
        el._anchor = new THREE.Vector3(-2, -1, zScale(entry.iz));
        container.appendChild(el);
        labelElements.push(el);
      }
    });
  }

  // Date axis title
  const zTitle = makeLabel(t('axisDate'), true);
  zTitle._anchor = new THREE.Vector3(-4, -2.5, CONFIG.surfaceDepth / 2);
  container.appendChild(zTitle);
  labelElements.push(zTitle);
}

function makeLabel(text, isTitle = false) {
  const el = document.createElement('div');
  el.className = 'axis-label' + (isTitle ? ' title' : '');
  el.textContent = text;
  return el;
}

function selectLabelIndices(maturities) {
  if (maturities.length <= 6) return maturities.map((_, i) => i);
  // Pick ~6 evenly spaced + first + last
  const indices = new Set([0, maturities.length - 1]);
  const step = (maturities.length - 1) / 5;
  for (let i = 0; i < 6; i++) indices.add(Math.round(i * step));
  return [...indices].sort((a, b) => a - b);
}

function updateLabels() {
  const container = document.getElementById('chart-container');
  const w = container.clientWidth;
  const h = container.clientHeight;

  labelElements.forEach(el => {
    if (!el._anchor) return;
    const pos = el._anchor.clone().project(camera);
    const x = (pos.x * 0.5 + 0.5) * w;
    const y = (-pos.y * 0.5 + 0.5) * h;

    if (pos.z > 1 || x < -50 || x > w + 50 || y < -50 || y > h + 50) {
      el.style.opacity = '0';
    } else {
      el.style.opacity = '1';
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.transform = 'translate(-50%, -50%)';
    }
  });
}

// ===== SECTION 11: COLOR LEGEND =====
function buildLegend() {
  const canvas = document.getElementById('legend-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  for (let i = 0; i < w; i++) {
    const t = i / (w - 1);
    const val = yieldMin + t * (yieldMax - yieldMin);
    ctx.fillStyle = colorScale(val);
    ctx.fillRect(i, 0, 1, h);
  }

  document.getElementById('legend-min').textContent = yieldMin.toFixed(1);
  document.getElementById('legend-max').textContent = yieldMax.toFixed(1);
}

// ===== SECTION 12: DATA INFO =====
function updateDataInfo(data) {
  const { maturities, curves } = data;
  const first = curves[0].date;
  const last = curves[curves.length - 1].date;
  const fmt = I18N.dataInfo[LANG];
  document.getElementById('data-info').textContent =
    fmt(curves.length, first, last, maturities.length, maturities[0], maturities[maturities.length - 1]);
}

// ===== SECTION 13: CAMERA PRESETS & ANIMATION =====
function animateToPreset(name) {
  const preset = CAMERA_PRESETS[name];
  if (!preset) return;

  animStartPos = camera.position.clone();
  animEndPos = new THREE.Vector3(...preset.position);
  animStartTarget = controls.target.clone();
  animEndTarget = new THREE.Vector3(...preset.target);
  animFrame = 0;
  animating = true;

  // Update active button
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === name);
  });
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ===== SECTION 14: CSV PARSING =====
function parseMaturityToMonths(name) {
  const s = name.trim().toUpperCase();
  const match = s.match(/^(\d+(?:\.\d+)?)\s*(M|Y|MO|YR|MONTH|YEAR|MONTHS|YEARS)$/);
  if (match) {
    const num = parseFloat(match[1]);
    const unit = match[2];
    if (unit.startsWith('Y')) return num * 12;
    return num;
  }
  // Try common patterns: "X1M" -> 1 month, "X10Y" -> 120 months
  const match2 = s.match(/^X?(\d+)(M|Y)$/);
  if (match2) {
    const num = parseFloat(match2[1]);
    return match2[2] === 'Y' ? num * 12 : num;
  }
  return null;
}

function parseCSV(text) {
  const parsed = d3.csvParse(text.trim());
  if (parsed.length === 0) throw new Error('CSV is empty');

  // 1列目をインデックス（行ラベル）、残りをデータ列とする
  const indexCol = parsed.columns[0];
  const columns = parsed.columns.slice(1);
  if (columns.length === 0) throw new Error('No data columns found (need at least 2 columns)');

  const maturities = columns;
  const maturityMonths = columns.map(parseMaturityToMonths);

  // If we can't parse maturity names, use evenly-spaced indices
  const hasValidMonths = maturityMonths.every(m => m !== null);
  const finalMonths = hasValidMonths
    ? maturityMonths
    : columns.map((_, i) => (i + 1) * 12);

  const curves = parsed.map(row => ({
    date: row[indexCol],
    yields: columns.map(col => {
      const v = parseFloat(row[col]);
      return isNaN(v) ? 0 : v;
    }),
  }));

  return {
    maturities,
    maturityMonths: finalMonths,
    curves,
  };
}

function handleCSVFile(file) {
  if (!file || !file.name.endsWith('.csv')) {
    alert(t('alertCsvFile'));
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = parseCSV(e.target.result);
      if (data.curves.length < 2) throw new Error(t('alertFewRows'));
      document.getElementById('sample-select').value = '';
      loadData(data);
    } catch (err) {
      alert(t('alertParseError') + err.message);
    }
  };
  reader.readAsText(file);
}

// ===== SECTION 15: EVENT LISTENERS =====
function setupEventListeners() {
  // Sample data selector
  document.getElementById('sample-select').addEventListener('change', async (e) => {
    const key = e.target.value;
    if (!key) return;

    // MOF CSV data
    if (key.startsWith('mof-')) {
      const period = MOF_PERIODS[key];
      if (!period) return;
      await fetchMOFData();
      loadData(getMOFFilteredData(period.start, period.end));
      return;
    }

    // Built-in sample data
    if (key === 'random') {
      loadData(generateRandomData());
      return;
    }
    const csvUrl = SAMPLE_CSV[key];
    if (csvUrl) loadData(await fetchSampleCSV(csvUrl));
  });

  // Color scheme selector
  const zeroCenterLabel = document.getElementById('zero-center-label');
  const zeroCenterCheckbox = document.getElementById('zero-center');

  document.getElementById('color-select').addEventListener('change', (e) => {
    currentColorScheme = e.target.value;
    // Show/hide "0基準" checkbox for diverging schemes
    zeroCenterLabel.style.display = isDiverging() ? '' : 'none';
    updateColors();
  });

  // "0基準" checkbox
  zeroCenterCheckbox.addEventListener('change', (e) => {
    zeroCentered = e.target.checked;
    updateColors();
  });

  // CSV upload button
  document.getElementById('csv-btn').addEventListener('click', () => {
    document.getElementById('csv-input').click();
  });
  document.getElementById('csv-input').addEventListener('change', (e) => {
    if (e.target.files[0]) handleCSVFile(e.target.files[0]);
    e.target.value = '';
  });

  // Drag & drop
  const container = document.getElementById('chart-container');
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    container.classList.add('dragover');
  });
  container.addEventListener('dragleave', () => {
    container.classList.remove('dragover');
  });
  container.addEventListener('drop', (e) => {
    e.preventDefault();
    container.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleCSVFile(file);
  });

  // Camera preset buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => animateToPreset(btn.dataset.view));
  });
}

// ===== SECTION 16: RESIZE =====
function onResize() {
  const container = document.getElementById('chart-container');
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w === 0 || h === 0) return;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

// ===== SECTION 17: ANIMATION LOOP =====
function animate() {
  requestAnimationFrame(animate);

  // Camera transition
  if (animating) {
    animFrame++;
    const t = easeInOutCubic(Math.min(animFrame / CONFIG.transitionFrames, 1));
    camera.position.lerpVectors(animStartPos, animEndPos, t);
    controls.target.lerpVectors(animStartTarget, animEndTarget, t);
    if (animFrame >= CONFIG.transitionFrames) animating = false;
  }

  controls.update();
  updateLabels();
  renderer.render(scene, camera);
}

// ===== SECTION 18: DEBUG PANEL (Tweakpane, ?debug only) =====
async function initDebugPanel() {
  if (!new URLSearchParams(location.search).has('debug')) return;

  const { Pane } = await import('https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js');
  const pane = new Pane({ title: 'Debug' });

  // Surface config
  const surfaceFolder = pane.addFolder({ title: 'Surface' });
  surfaceFolder.addBinding(CONFIG, 'surfaceWidth', { min: 10, max: 60, step: 1 });
  surfaceFolder.addBinding(CONFIG, 'surfaceHeight', { min: 5, max: 30, step: 1 });
  surfaceFolder.addBinding(CONFIG, 'surfaceDepth', { min: 10, max: 60, step: 1 });
  surfaceFolder.addBinding(CONFIG, 'gridOpacity', { min: 0, max: 1, step: 0.05 });

  // Camera monitor
  const camFolder = pane.addFolder({ title: 'Camera' });
  const camPos = { x: 0, y: 0, z: 0 };
  const camTarget = { x: 0, y: 0, z: 0 };
  camFolder.addBinding(camPos, 'x', { readonly: true, label: 'pos.x' });
  camFolder.addBinding(camPos, 'y', { readonly: true, label: 'pos.y' });
  camFolder.addBinding(camPos, 'z', { readonly: true, label: 'pos.z' });
  camFolder.addBinding(camTarget, 'x', { readonly: true, label: 'tgt.x' });
  camFolder.addBinding(camTarget, 'y', { readonly: true, label: 'tgt.y' });
  camFolder.addBinding(camTarget, 'z', { readonly: true, label: 'tgt.z' });

  // FOV
  camFolder.addBinding(CONFIG, 'cameraFov', { min: 20, max: 90, step: 1, label: 'FOV' })
    .on('change', () => {
      camera.fov = CONFIG.cameraFov;
      camera.updateProjectionMatrix();
    });

  // Rebuild button
  pane.addButton({ title: 'Rebuild Surface' }).on('click', () => {
    if (currentData) loadData(currentData);
  });

  // Refresh camera monitor periodically
  setInterval(() => {
    camPos.x = Math.round(camera.position.x * 10) / 10;
    camPos.y = Math.round(camera.position.y * 10) / 10;
    camPos.z = Math.round(camera.position.z * 10) / 10;
    camTarget.x = Math.round(controls.target.x * 10) / 10;
    camTarget.y = Math.round(controls.target.y * 10) / 10;
    camTarget.z = Math.round(controls.target.z * 10) / 10;
    pane.refresh();
  }, 200);
}

// ===== INIT =====
init().then(() => initDebugPanel());
