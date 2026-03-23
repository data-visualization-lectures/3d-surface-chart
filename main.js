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
  labelHorizontal: { ja: '横書き', en: 'Horizontal' },
  labelVertical:   { ja: '縦書き', en: 'Vertical' },
  shareChart:      { ja: 'シェア', en: 'Share' },
  shareTitle:      { ja: 'シェアするチャートのタイトルを入力:', en: 'Enter a title for the shared chart:' },
  shareFailed:     { ja: 'シェアに失敗: ', en: 'Share failed: ' },
  shareNoData:     { ja: 'データがありません', en: 'No data loaded' },
  shareCopyUrl:    { ja: 'URLをコピー', en: 'Copy URL' },
  shareCopied:     { ja: 'コピーしました!', en: 'Copied!' },
  shareOnX:        { ja: 'Xでシェア', en: 'Share on X' },
  shareClose:      { ja: '閉じる', en: 'Close' },
  shareModalTitle: { ja: 'シェアURLが作成されました', en: 'Share URL created' },
  saveProject:     { ja: 'プロジェクトの保存', en: 'Save Project' },
  loadProject:     { ja: 'プロジェクトの読込', en: 'Load Project' },
  exportPng:       { ja: 'エクスポート', en: 'Export' },
  viewOverview:    { ja: '全体', en: 'Overview' },
  viewFront:       { ja: '正面', en: 'Front' },
  viewTop:         { ja: '上面', en: 'Top' },
  viewSide:        { ja: '側面', en: 'Side' },
  shareHint:       { ja: 'シェアボタンは画面下部にあります', en: 'Share button is at the bottom of the page' },
  usTreasury:      { ja: '米国債 (2019-2024)', en: 'US Treasury (2019-2024)' },
  numberOfBirths:  { ja: '出生数 都道府県別 (2011-2022)', en: 'Number of Births by Prefecture (2011-2022)' },
  alertCsvFile:    { ja: '.csvファイルを選択してください', en: 'Please select a .csv file' },
  alertFewRows:    { ja: 'データ行が2行以上必要です', en: 'Need at least 2 data rows' },
  alertParseError: { ja: 'CSV解析エラー: ', en: 'CSV parse error: ' },
};

function t(key) {
  const entry = I18N[key];
  if (!entry) return key;
  return entry[LANG] ?? entry['en'] ?? key;
}

function applyI18n() {
  document.documentElement.lang = LANG === 'ja' ? 'ja' : 'en';
  document.title = t('title');

  // data-i18n 属性を持つ要素にテキストを適用
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = t(el.dataset.i18n);
    if (typeof val === 'string') el.textContent = val;
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
  births: 'data/number-of-births.csv',
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
  const rawMonths = maturities.map(parseMaturityToMonths);
  const hasValidMonths = rawMonths.every(m => m !== null);
  const maturityMonths = hasValidMonths
    ? rawMonths
    : maturities.map((_, i) => (i + 1) * 12);
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
let currentDataName = '';
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

  // ツールヘッダー設定
  const toolHeader = document.querySelector('dataviz-tool-header');
  if (toolHeader) {
    toolHeader.setConfig({
      logo: { type: 'text', text: t('title') },
      buttons: [
        { label: t('saveProject'), action: () => saveToCloud(), align: 'right' },
        { label: t('loadProject'), action: () => loadFromCloud(), align: 'right' },
        { label: t('exportPng'), action: () => exportPng(), align: 'right' },
      ],
    });
  }

  const container = document.getElementById('chart-container');

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
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
  currentDataName = t('recent5');
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
    el.classList.add('category-label');
    if (document.getElementById('label-orient').value === 'vertical') {
      el.classList.add('vertical');
    }
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
  // Show all labels
  return maturities.map((_, i) => i);
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

  // Hide category labels in side view
  const hideCat = name === 'side';
  document.querySelectorAll('.category-label').forEach(el => {
    el.style.display = hideCat ? 'none' : '';
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
      currentDataName = file.name.replace(/\.csv$/i, '');
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
    currentDataName = e.target.selectedOptions[0]?.textContent || '';

    // MOF CSV data
    if (key.startsWith('mof-')) {
      const period = MOF_PERIODS[key];
      if (!period) return;
      await fetchMOFData();
      loadData(getMOFFilteredData(period.start, period.end));
      return;
    }

    // Built-in sample data (CSV)
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

  // Label orientation selector
  document.getElementById('label-orient').addEventListener('change', (e) => {
    const isVertical = e.target.value === 'vertical';
    document.querySelectorAll('.category-label').forEach(el => {
      el.classList.toggle('vertical', isVertical);
    });
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

  // Share button
  document.getElementById('share-btn').addEventListener('click', () => shareToWeb());
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

// ===== SECTION 18a: SHARE TO WEB =====
const SUPABASE_URL = 'https://vebhoeiltxspsurqoxvl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYmhvZWlsdHhzcHN1cnFveHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNTY4MjMsImV4cCI6MjA4MDYzMjgyM30.5uf-D07Hb0JxL39X9yQ20P-5gFc1CRMdKWhDySrNZ0E';

let shareSupabase = null;
function getShareSupabase() {
  if (!shareSupabase && window.supabase) {
    shareSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return shareSupabase;
}

function generateOgImage(title, callback) {
  const container = document.getElementById('chart-container');
  const origWidth = container.clientWidth;
  const origHeight = container.clientHeight;

  const OG_W = 1200, OG_H = 630;
  renderer.setSize(OG_W, OG_H);
  camera.aspect = OG_W / OG_H;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);

  const ogCanvas = document.createElement('canvas');
  ogCanvas.width = OG_W;
  ogCanvas.height = OG_H;
  const ctx = ogCanvas.getContext('2d');
  ctx.drawImage(renderer.domElement, 0, 0, OG_W, OG_H);

  // Title overlay at bottom
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, OG_H - 60, OG_W, 60);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, OG_W / 2, OG_H - 30);

  // Restore original size
  renderer.setSize(origWidth, origHeight);
  camera.aspect = origWidth / origHeight;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);

  ogCanvas.toBlob(blob => callback(blob), 'image/png');
}

async function shareToWeb() {
  if (!currentData) {
    showToast(t('shareNoData'), 'error');
    return;
  }

  const sb = getShareSupabase();
  if (!sb) {
    showToast(t('shareFailed') + 'Supabase not loaded', 'error');
    return;
  }

  const title = prompt(t('shareTitle'), currentDataName);
  if (!title) return;

  try {
    const chartConfig = getProjectData();
    const { data: share, error } = await sb
      .from('surface_3d_shares')
      .insert({ title, chart_config: chartConfig })
      .select('id')
      .single();

    if (error) throw error;

    // Upload OG image in background
    generateOgImage(title, async (pngBlob) => {
      await sb.storage
        .from('surface-3d-og-images')
        .upload(`${share.id}.png`, pngBlob, {
          contentType: 'image/png',
          upsert: true,
        });
    });

    const ogShareUrl = `${SUPABASE_URL}/functions/v1/og-surface-3d-share?id=${share.id}`;
    showShareModal(ogShareUrl, title);

  } catch (err) {
    showToast(t('shareFailed') + err.message, 'error');
  }
}

function showShareModal(shareUrl, title) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';

  const modal = document.createElement('div');
  modal.style.cssText = 'background:#fff;border-radius:12px;padding:24px;max-width:500px;width:90%;text-align:center;';

  const h3 = document.createElement('h3');
  h3.textContent = t('shareModalTitle');
  h3.style.cssText = 'margin:0 0 16px;font-size:1.1rem;';
  modal.appendChild(h3);

  const urlBox = document.createElement('input');
  urlBox.type = 'text';
  urlBox.readOnly = true;
  urlBox.value = shareUrl;
  urlBox.style.cssText = 'width:100%;padding:8px 12px;font-size:0.85rem;border:1px solid #ccc;border-radius:6px;margin-bottom:12px;';
  modal.appendChild(urlBox);

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap;';

  const copyBtn = document.createElement('button');
  copyBtn.textContent = t('shareCopyUrl');
  copyBtn.style.cssText = 'padding:8px 20px;border:1px solid #ccc;border-radius:6px;background:#e8f4e8;cursor:pointer;font-size:0.9rem;';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(shareUrl);
    copyBtn.textContent = t('shareCopied');
    setTimeout(() => copyBtn.textContent = t('shareCopyUrl'), 2000);
  });
  btnRow.appendChild(copyBtn);

  const xBtn = document.createElement('button');
  xBtn.textContent = t('shareOnX');
  xBtn.style.cssText = 'padding:8px 20px;border:1px solid #333;border-radius:6px;background:#333;color:#fff;cursor:pointer;font-size:0.9rem;';
  xBtn.addEventListener('click', () => {
    const text = encodeURIComponent(title);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  });
  btnRow.appendChild(xBtn);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = t('shareClose');
  closeBtn.style.cssText = 'padding:8px 20px;border:1px solid #ccc;border-radius:6px;background:#fff;cursor:pointer;font-size:0.9rem;';
  closeBtn.addEventListener('click', () => overlay.remove());
  btnRow.appendChild(closeBtn);

  modal.appendChild(btnRow);
  overlay.appendChild(modal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// ===== SECTION 18b: PROJECT SAVE/LOAD =====
const API_BASE = 'https://api.dataviz.jp';
const APP_NAME = '3d-surface-chart';

async function getAccessToken() {
  if (!window.datavizSupabase) return null;
  const { data: { session } } = await window.datavizSupabase.auth.getSession();
  return session ? session.access_token : null;
}

function showToast(msg, type) {
  const th = document.querySelector('dataviz-tool-header');
  if (th && th.showMessage) th.showMessage(msg, type || 'success');
}

function getProjectData() {
  return {
    version: 1,
    data: currentData,
    settings: {
      colorScheme: currentColorScheme,
      zeroCentered: zeroCentered,
      labelOrient: document.getElementById('label-orient').value,
      cameraPosition: [camera.position.x, camera.position.y, camera.position.z],
      cameraTarget: [controls.target.x, controls.target.y, controls.target.z],
    },
  };
}

function restoreProject(project) {
  const { data, settings } = project;
  if (!data || !data.curves || data.curves.length < 2) {
    showToast(t('alertParseError') + 'Invalid project data', 'error');
    return;
  }

  // Restore data
  document.getElementById('sample-select').value = '';
  loadData(data);

  // Restore settings
  if (settings) {
    if (settings.colorScheme) {
      currentColorScheme = settings.colorScheme;
      document.getElementById('color-select').value = settings.colorScheme;
      const zeroCenterLabel = document.getElementById('zero-center-label');
      zeroCenterLabel.style.display = isDiverging() ? '' : 'none';
    }
    if (settings.zeroCentered !== undefined) {
      zeroCentered = settings.zeroCentered;
      document.getElementById('zero-center').checked = zeroCentered;
    }
    if (settings.labelOrient) {
      document.getElementById('label-orient').value = settings.labelOrient;
      const isVertical = settings.labelOrient === 'vertical';
      document.querySelectorAll('.category-label').forEach(el => {
        el.classList.toggle('vertical', isVertical);
      });
    }
    if (settings.cameraPosition) {
      camera.position.set(...settings.cameraPosition);
    }
    if (settings.cameraTarget) {
      controls.target.set(...settings.cameraTarget);
      controls.update();
    }
    updateColors();
  }
}

function exportPng() {
  renderer.render(scene, camera);
  const glCanvas = renderer.domElement;
  const w = glCanvas.width;
  const h = glCanvas.height;

  // Composite canvas: WebGL + labels
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = w;
  exportCanvas.height = h;
  const ctx = exportCanvas.getContext('2d');

  // Draw WebGL scene
  ctx.drawImage(glCanvas, 0, 0);

  // Draw labels on top
  const container = document.getElementById('chart-container');
  const cw = container.clientWidth;
  const scaleX = w / cw;

  labelElements.forEach(el => {
    if (!el._anchor || el.style.opacity === '0' || el.style.display === 'none') return;
    const pos = el._anchor.clone().project(camera);
    const x = (pos.x * 0.5 + 0.5) * w;
    const y = (-pos.y * 0.5 + 0.5) * h;
    if (pos.z > 1) return;

    const isTitle = el.classList.contains('title');
    const isVertical = el.classList.contains('vertical');
    const fontSize = isTitle ? 13 * scaleX : 10 * scaleX;
    ctx.font = (isTitle ? 'bold ' : '') + fontSize + 'px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = isTitle ? '#444' : '#666';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isVertical) {
      // Draw each character vertically (matching CSS writing-mode: vertical-rl)
      const chars = [...el.textContent];
      const charH = fontSize * 1.1;
      const totalH = chars.length * charH;
      const startY = y - totalH / 2 + charH / 2;
      ctx.textAlign = 'center';
      chars.forEach((ch, i) => {
        ctx.fillText(ch, x, startY + i * charH);
      });
    } else {
      ctx.fillText(el.textContent, x, y);
    }
  });

  // Download
  const a = document.createElement('a');
  a.href = exportCanvas.toDataURL('image/png');
  a.download = (currentDataName || '3d-surface-chart') + '.png';
  a.click();
}

function generateThumbnail(callback) {
  // Render one frame to ensure canvas is up-to-date
  renderer.render(scene, camera);
  const canvas = renderer.domElement;

  // Create thumbnail (max 400px wide)
  const scale = Math.min(1, 400 / canvas.width);
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = Math.round(canvas.width * scale);
  thumbCanvas.height = Math.round(canvas.height * scale);
  const ctx = thumbCanvas.getContext('2d');
  ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);

  callback(thumbCanvas.toDataURL('image/png'));
}

async function saveToCloud() {
  const token = await getAccessToken();
  if (!token) {
    showToast(LANG === 'ja' ? 'ログインが必要です' : 'Login required', 'error');
    return;
  }
  if (!currentData) {
    showToast(LANG === 'ja' ? 'データがありません' : 'No data loaded', 'error');
    return;
  }

  const name = prompt(LANG === 'ja' ? 'プロジェクト名を入力:' : 'Enter project name:', currentDataName);
  if (!name) return;

  generateThumbnail(async (thumbnailDataUrl) => {
    try {
      const body = {
        name: name,
        app_name: APP_NAME,
        data: getProjectData(),
        thumbnail: thumbnailDataUrl,
      };

      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(LANG === 'ja' ? '保存しました' : 'Saved successfully', 'success');
    } catch (err) {
      showToast((LANG === 'ja' ? '保存に失敗: ' : 'Save failed: ') + err.message, 'error');
    }
  });
}

async function loadFromCloud() {
  const token = await getAccessToken();
  if (!token) {
    showToast(LANG === 'ja' ? 'ログインが必要です' : 'Login required', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/projects?app=${APP_NAME}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const projects = await res.json();

    if (!projects.length) {
      showToast(LANG === 'ja' ? '保存済みプロジェクトがありません' : 'No saved projects', 'info');
      return;
    }

    // Build modal
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';

    const modal = document.createElement('div');
    modal.style.cssText = 'background:#fff;border-radius:12px;padding:24px;max-width:600px;width:90%;max-height:70vh;overflow-y:auto;';

    const title = document.createElement('h3');
    title.textContent = LANG === 'ja' ? 'プロジェクトを選択' : 'Select Project';
    title.style.cssText = 'margin:0 0 16px;font-size:1.1rem;';
    modal.appendChild(title);

    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

    projects.forEach(p => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px;border:1px solid #ddd;border-radius:8px;cursor:pointer;transition:background 0.15s;';
      row.onmouseenter = () => row.style.background = '#f5f5f5';
      row.onmouseleave = () => row.style.background = '';

      if (p.thumbnail_path) {
        const img = document.createElement('img');
        img.src = `${API_BASE}/api/projects/${p.id}/thumbnail`;
        img.style.cssText = 'width:80px;height:50px;object-fit:cover;border-radius:4px;border:1px solid #eee;';
        img.onerror = () => img.style.display = 'none';
        row.appendChild(img);
      }

      const info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0;';
      const nameEl = document.createElement('div');
      nameEl.textContent = p.name;
      nameEl.style.cssText = 'font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      info.appendChild(nameEl);
      const dateEl = document.createElement('div');
      dateEl.textContent = new Date(p.updated_at || p.created_at).toLocaleDateString();
      dateEl.style.cssText = 'font-size:0.8rem;color:#888;';
      info.appendChild(dateEl);
      row.appendChild(info);

      row.addEventListener('click', async () => {
        overlay.remove();
        await loadProjectById(p.id);
      });
      list.appendChild(row);
    });

    modal.appendChild(list);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = LANG === 'ja' ? '閉じる' : 'Close';
    closeBtn.style.cssText = 'margin-top:16px;padding:8px 20px;border:1px solid #ccc;border-radius:6px;background:#fff;cursor:pointer;font-size:0.9rem;';
    closeBtn.addEventListener('click', () => overlay.remove());
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  } catch (err) {
    showToast((LANG === 'ja' ? '読込に失敗: ' : 'Load failed: ') + err.message, 'error');
  }
}

async function loadProjectById(projectId) {
  try {
    const token = await getAccessToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/projects/${projectId}`, {
      headers,
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const project = await res.json();

    if (project.data) {
      restoreProject(project.data);
      showToast(LANG === 'ja' ? '読込みました' : 'Loaded successfully', 'success');
    }
  } catch (err) {
    showToast((LANG === 'ja' ? '読込に失敗: ' : 'Load failed: ') + err.message, 'error');
  }
}

// ===== INIT =====
init().then(() => {
  initDebugPanel();

  // Check URL for project_id parameter
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('project_id');
  if (projectId) loadProjectById(projectId);
});
