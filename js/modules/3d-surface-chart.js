import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ===== SECTION 0: I18N =====
const LANG = navigator.language.startsWith('ja') ? 'ja' : 'en';

// ===== TOOL_CONFIG (template integration) =====
const TOOL_CONFIG = {
  appName:    '3d-surface-chart',
  sampleToolId: '3d-surface-chart',
  title:      LANG === 'ja' ? '3Dサーフェス・チャート' : '3D Surface Chart',
  gaId:       'G-XXXXXXXXXX',
  exportName: '3d-surface-chart',
  shareTable: 'interactive_chart_builder_shares',
};

const I18N = {
  title:           { ja: '3Dサーフェス・チャート', en: '3D Surface Chart' },
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
  alertFewColumns: { ja: '数値列が2列以上必要です', en: 'Need at least 2 numeric columns' },
  alertParseError: { ja: 'CSV解析エラー: ', en: 'CSV parse error: ' },
  invalidDataFormat: { ja: 'データ形式が不正です', en: 'Invalid data format' },
  alertInvalidProjectData: { ja: '不正なプロジェクトデータです', en: 'Invalid project data' },
  svgExportUnsupported: {
    ja: '3DチャートではSVGエクスポートは利用できません',
    en: 'SVG export is not available for 3D charts',
  },
  styleDataVariables: { ja: 'データ変数', en: 'Data Variables' },
  styleVisualEncoding: { ja: 'ビジュアル表現', en: 'Visual Encoding' },
  styleXAxis: { ja: 'X軸', en: 'X Axis' },
  styleYAxis: { ja: 'Y軸', en: 'Y Axis' },
  styleZAxis: { ja: 'Z軸', en: 'Z Axis' },
  styleColor: { ja: '色', en: 'Color' },
  rowVariable: { ja: '行変数', en: 'Row Variable' },
  columnVariable: { ja: '列変数', en: 'Column Variable' },
  valueVariable: { ja: '値変数', en: 'Value Variable' },
  styleControlsHint: {
    ja: 'カラースキーム、ラベルの向き、カメラはチャート下部のコントロールで操作できます。',
    en: 'Color scheme, label orientation, and camera controls are available below the chart.',
  },
  styleAxisTitles: { ja: '軸タイトル', en: 'Axis Titles' },
  styleXAxisTitle: { ja: 'X軸タイトル', en: 'X Axis Title' },
  styleYAxisTitle: { ja: 'Y軸タイトル', en: 'Y Axis Title' },
  styleZAxisTitle: { ja: 'Z軸タイトル', en: 'Z Axis Title' },
  styleLabelOrientation: { ja: 'ラベルの向き', en: 'Label Orientation' },
  styleAxisTitleAutoPlaceholder: {
    ja: '未入力時は自動（変数名）',
    en: 'Auto (variable name)',
  },
  dataPreviewTitle: {
    ja: 'データプレビュー（先頭5行）',
    en: 'Data Preview (First 5 Rows)',
  },
  dataPreviewEmpty: {
    ja: '表示可能なデータがありません',
    en: 'No previewable data',
  },
  encodingInvalidSameAxis: {
    ja: 'X軸とZ軸に同じ変数は指定できません。前の設定に戻します。',
    en: 'X and Z axes cannot use the same variable. Reverted to the previous valid setting.',
  },
  encodingSummary: {
    ja: (x, y, z, c) => `X軸=${x} / Y軸=${y} / Z軸=${z} / 色=${c}`,
    en: (x, y, z, c) => `X=${x} / Y=${y} / Z=${z} / Color=${c}`,
  },
  publishTitleHeading: { ja: 'シェアするチャートのタイトルを入力', en: 'Enter a title for the shared chart' },
  publishTitleCancel: { ja: 'キャンセル', en: 'Cancel' },
  shareModalHeading: { ja: 'シェアURLが作成されました', en: 'Share URL created' },
  shareModalDesc: { ja: '以下のURLを共有すると、誰でも閲覧できます。', en: 'Anyone with this URL can view it.' },
  shareSuccess: { ja: '公開しました', en: 'Published successfully' },
  processingGeneric: { ja: '処理中です', en: 'Processing...' },
  processingSavePrep: { ja: '保存準備中です', en: 'Preparing save...' },
  processingExport: { ja: '書き出し中です', en: 'Exporting...' },
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
  const mofOg = document.getElementById('mof-optgroup');
  if (mofOg) mofOg.label = t('mofGroup');
  const seqOg = document.getElementById('seq-optgroup');
  if (seqOg) seqOg.label = t('sequential');
  const divOg = document.getElementById('div-optgroup');
  if (divOg) divOg.label = t('diverging');

  updateEncodingUITexts();
  const previewHeading = document.getElementById('dvz-data-preview-heading');
  if (previewHeading) previewHeading.textContent = t('dataPreviewTitle');
  updateEncodingSummary();
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
  us: 'data/3d-surface-chart/us-treasury.csv',
  births: 'data/3d-surface-chart/number-of-births.csv',
};

// Schema-driven settings persistence (see js/core/settings-compat.js)
const SETTINGS_SPEC = {
  version: 1,
  chartType: '3d-surface-chart',
  fields: {
    colorScheme:   { type: 'enum', default: 'YlOrRd', values: [
      'YlOrRd', 'YlGnBu', 'Viridis', 'Inferno', 'Plasma', 'Cividis', 'Turbo',
      'Blues', 'Greens', 'Oranges', 'Reds', 'Purples',
      'RdBu', 'RdYlBu', 'RdYlGn', 'Spectral', 'BrBG', 'PRGn', 'PiYG', 'PuOr', 'RdGy',
    ]},
    zeroCentered:  { type: 'boolean', default: false },
    labelOrient:   { type: 'enum', default: 'horizontal', values: ['horizontal', 'vertical'] },
    encoding:      { type: 'object', default: { x: 'column', y: 'value', z: 'row', color: 'value' }, fields: {
      x:     { type: 'enum', default: 'column', values: ['row', 'column', 'value'] },
      y:     { type: 'enum', default: 'value',  values: ['row', 'column', 'value'] },
      z:     { type: 'enum', default: 'row',    values: ['row', 'column', 'value'] },
      color: { type: 'enum', default: 'value',  values: ['row', 'column', 'value'] },
    }},
    axisTitles:    { type: 'object', default: { x: '', y: '', z: '' }, fields: {
      x: { type: 'string', default: '' },
      y: { type: 'string', default: '' },
      z: { type: 'string', default: '' },
    }},
    sampleSelect:    { type: 'string', default: '' },
    cameraPosition:  { type: 'array', itemType: 'number', default: null, minLength: 3 },
    cameraTarget:    { type: 'array', itemType: 'number', default: null, minLength: 3 },
  },
  migrations: [],
};

// Cache for fetched sample data
const sampleCache = {};

function isEmbedMode() {
  return new URLSearchParams(window.location.search).get('embed') === '1';
}

async function waitForToolHeaderReady(timeoutMs = 4000) {
  if (isEmbedMode()) return null;
  const header = document.querySelector('dataviz-tool-header');
  if (!header) return null;
  if (typeof header.setConfig === 'function') return header;

  if (window.customElements && typeof window.customElements.whenDefined === 'function') {
    await Promise.race([
      window.customElements.whenDefined('dataviz-tool-header'),
      new Promise(resolve => setTimeout(resolve, timeoutMs)),
    ]);
  }

  return typeof header.setConfig === 'function' ? header : null;
}

function parseNumericValue(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim();
  if (s === '' || s === '-') return NaN;
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : NaN;
}

function createSurfaceData(indexColName, columns, rows, meta = {}) {
  const columnPositionsRaw = columns.map(parseMaturityToMonths);
  const hasParsedColumnPositions = columnPositionsRaw.every(v => v !== null);
  const columnPositions = hasParsedColumnPositions
    ? columnPositionsRaw
    : columns.map((_, i) => i);

  const rowLabels = rows.map(r => String(r.label ?? ''));
  const rowPositions = rowLabels.map((_, i) => i);
  const matrixValues = rows.map(r => columns.map((_, i) => parseNumericValue(r.values[i])));

  return {
    rowLabelName: indexColName || 'row',
    columnLabelName: pickLocalizedLabel(meta.columnLabelName || meta.columnVariableName || meta.columnName),
    valueLabelName: resolveValueLabelMetadata(meta),
    rowLabels,
    rowPositions,
    columnLabels: columns.slice(),
    columnPositions,
    matrixValues,
    // Backward-compatible fields
    maturities: columns.slice(),
    maturityMonths: columnPositions.slice(),
    curves: rows.map((r, i) => ({ date: rowLabels[i], yields: matrixValues[i].slice() })),
  };
}

function normalizeLoadedData(data) {
  if (!data || typeof data !== 'object') return null;

  if (Array.isArray(data.rowLabels) && Array.isArray(data.columnLabels) && Array.isArray(data.matrixValues)) {
    const normalizedRows = data.rowLabels.map((label, i) => ({
      label,
      values: Array.isArray(data.matrixValues[i]) ? data.matrixValues[i] : [],
    }));
    return createSurfaceData(data.rowLabelName || 'row', data.columnLabels, normalizedRows, data);
  }

  if (Array.isArray(data.curves) && Array.isArray(data.maturities)) {
    const rows = data.curves.map(c => ({
      label: c.date,
      values: Array.isArray(c.yields) ? c.yields : [],
    }));
    return createSurfaceData(data.rowLabelName || 'date', data.maturities, rows, data);
  }

  return null;
}

function pickLocalizedLabel(label) {
  if (!label) return '';
  if (typeof label === 'string') return label.trim();
  if (typeof label === 'object') {
    return String(label[LANG] ?? label.en ?? label.ja ?? '').trim();
  }
  return '';
}

function inferValueLabelFromSource(sourceName) {
  const source = String(sourceName || '').toLowerCase();
  if (source.includes('number-of-births')) {
    return LANG === 'ja' ? '出生数' : 'Number of Births';
  }
  if (source.includes('us-treasury')) {
    return LANG === 'ja' ? '利回り' : 'Yield';
  }
  if (source.includes('jgbcm') || source.includes('mof')) {
    return LANG === 'ja' ? '金利' : 'Interest Rate';
  }
  return '';
}

function resolveValueLabelMetadata(meta = {}) {
  const sourceHints = [
    meta.sourceName,
    meta.filename,
    meta.name,
    meta.url,
  ].filter(Boolean).join(' ');
  return pickLocalizedLabel(
    meta.valueLabelName
    || meta.valueVariableName
    || meta.valueName
    || meta.measureName
    || meta.yLabelName
    || inferValueLabelFromSource(sourceHints)
  );
}

async function fetchSampleCSV(url) {
  if (sampleCache[url]) return sampleCache[url];
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch sample CSV (${response.status})`);
  const text = await response.text();
  const data = parseCSV(text, { sourceName: url });
  sampleCache[url] = data;
  return data;
}

// ===== SECTION 3b: MOF CSV DATA =====
const MOF_CSV_FILE = 'data/3d-surface-chart/jgbcm-all.csv';

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

const SURFACE_SAMPLE_SOURCES = {
  mof: {
    source: { ja: '財務省 国債金利情報', en: 'Ministry of Finance Japan, Interest Rate Information' },
    sourceUrl: 'https://www.mof.go.jp/jgbs/reference/interest_rate/index.htm',
  },
  us: {
    source: { ja: 'U.S. Department of the Treasury', en: 'U.S. Department of the Treasury' },
    sourceUrl: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve',
  },
  births: {
    source: { ja: '', en: '' },
    sourceUrl: '',
  },
};

function applySurfaceSampleAnnotation(key, title) {
  const sourceKey = key && key.startsWith('mof-') ? 'mof' : key;
  const source = SURFACE_SAMPLE_SOURCES[sourceKey] || {};
  window._surfaceApp?._applySampleAnnotation?.({
    title: title || '',
    source: source.source ? (source.source[LANG] || source.source.en || '') : '',
    sourceUrl: source.sourceUrl || '',
  });
}

async function fetchMOFData() {
  if (mofCurves) return; // already loaded
  const response = await fetch(MOF_CSV_FILE);
  if (!response.ok) throw new Error(`Failed to fetch MOF data (${response.status})`);
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
  const monthly = sampleMonthly(filtered);
  return createSurfaceData(
    'date',
    mofMaturities,
    monthly.map(c => ({ label: c.date, values: c.yields })),
    {
      sourceName: MOF_CSV_FILE,
      valueLabelName: { ja: '金利', en: 'Interest Rate' },
    }
  );
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
let axisTitleOverrides = { x: '', y: '', z: '' };
let currentLabelOrient = 'horizontal';
let currentProjectId = null;
let currentProjectName = null;
let zeroCentered = false;
let currentEncoding = { x: 'column', y: 'value', z: 'row', color: 'value' };
let lastValidEncoding = { ...currentEncoding };
let currentMapped = null;

// Camera animation
let animating = false;
let animStartPos, animEndPos, animStartTarget, animEndTarget;
let animFrame = 0;
let resizeObserver = null;
let resizeWindowHandler = null;
let animationHandle = null;
let animationRunning = false;
let debugPane = null;
let debugPaneRefreshTimer = null;
let debugPanelGeneration = 0;

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

function isValueColorEncoding() {
  return currentEncoding.color === 'value';
}

function getMappedData(data = currentData) {
  if (!data) return null;

  const rowLabels = data.rowLabels || [];
  const columnLabels = data.columnLabels || [];
  const rowPositions = (data.rowPositions && data.rowPositions.length === rowLabels.length)
    ? data.rowPositions
    : rowLabels.map((_, i) => i);
  const columnPositions = (data.columnPositions && data.columnPositions.length === columnLabels.length)
    ? data.columnPositions
    : columnLabels.map((_, i) => i);
  const matrix = data.matrixValues || [];

  const xDim = currentEncoding.x;
  const zDim = currentEncoding.z;

  const xLabels = xDim === 'row' ? rowLabels : columnLabels;
  const zLabels = zDim === 'row' ? rowLabels : columnLabels;
  const xPositions = xDim === 'row' ? rowPositions : columnPositions;
  const zPositions = zDim === 'row' ? rowPositions : columnPositions;

  return {
    xDim,
    zDim,
    xLabels,
    zLabels,
    xPositions,
    zPositions,
    matrix,
    rowLabels,
    columnLabels,
  };
}

function getMappedCell(mapped, ix, iz) {
  const rowIdx = mapped.xDim === 'row' ? ix : iz;
  const colIdx = mapped.xDim === 'column' ? ix : iz;
  const row = mapped.matrix[rowIdx] || [];
  const value = row[colIdx];
  return { rowIdx, colIdx, value };
}

function getColorValueFromCell(cell) {
  if (currentEncoding.color === 'row') return cell.rowIdx;
  if (currentEncoding.color === 'column') return cell.colIdx;
  return cell.value;
}

function syncZeroCenterControl() {
  const zeroCenterLabel = document.getElementById('zero-center-label');
  if (!zeroCenterLabel) return;
  zeroCenterLabel.style.display = isValueColorEncoding() && isDiverging() ? '' : 'none';
}

function normalizeLabelOrient(value) {
  return value === 'vertical' ? 'vertical' : 'horizontal';
}

function setLabelOrient(value) {
  currentLabelOrient = normalizeLabelOrient(value);
  const input = document.getElementById('label-orient');
  if (input) input.value = currentLabelOrient;
  document.querySelectorAll('.category-label').forEach(el => {
    el.classList.toggle('vertical', currentLabelOrient === 'vertical');
  });
}

function buildColorScale() {
  const interp = getInterpolator(currentColorScheme);
  if (!isValueColorEncoding()) {
    const maxIndex = currentEncoding.color === 'row'
      ? Math.max((currentData?.rowLabels?.length || 1) - 1, 1)
      : Math.max((currentData?.columnLabels?.length || 1) - 1, 1);
    return d3.scaleSequential(interp).domain([0, maxIndex]);
  }
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
  if (!currentData || !surfaceGroup || !currentMapped) return;
  colorScale = buildColorScale();

  // Update surface mesh vertex colors
  surfaceGroup.traverse(obj => {
    if (obj.isMesh && obj.geometry.getAttribute('color')) {
      const numX = currentMapped.xLabels.length;
      const numZ = currentMapped.zLabels.length;
      const colors = obj.geometry.getAttribute('color');
      for (let iz = 0; iz < numZ; iz++) {
        for (let ix = 0; ix < numX; ix++) {
          const idx = iz * numX + ix;
          const cell = getMappedCell(currentMapped, ix, iz);
          const colorVal = getColorValueFromCell(cell);
          const c = isNaN(cell.value) ? CONFIG.nanColor : new THREE.Color(colorScale(colorVal));
          colors.setXYZ(idx, c.r, c.g, c.b);
        }
      }
      colors.needsUpdate = true;
    }
  });

  buildLegend();
}

function getVariableLabel(varType) {
  if (varType === 'row') {
    const rowName = currentData?.rowLabelName ? ` (${currentData.rowLabelName})` : '';
    return t('rowVariable') + rowName;
  }
  if (varType === 'column') {
    const columnName = currentData?.columnLabelName ? ` (${currentData.columnLabelName})` : '';
    return t('columnVariable') + columnName;
  }
  const valueName = getValueVariableName();
  return valueName || t('valueVariable');
}

function getValueVariableName() {
  const yTitle = (axisTitleOverrides?.y || '').trim();
  return yTitle || currentData?.valueLabelName || '';
}

function updateEncodingUITexts() {
  const xSelect = document.getElementById('encoding-x-select');
  const ySelect = document.getElementById('encoding-y-select');
  const zSelect = document.getElementById('encoding-z-select');
  const colorSelect = document.getElementById('encoding-color-select');
  if (!xSelect || !ySelect || !zSelect || !colorSelect) return;

  const setOptionText = (select, value, label) => {
    const option = [...select.options].find(o => o.value === value);
    if (option) option.textContent = label;
  };

  setOptionText(xSelect, 'row', getVariableLabel('row'));
  setOptionText(xSelect, 'column', getVariableLabel('column'));
  setOptionText(ySelect, 'value', getVariableLabel('value'));
  setOptionText(zSelect, 'row', getVariableLabel('row'));
  setOptionText(zSelect, 'column', getVariableLabel('column'));
  setOptionText(colorSelect, 'value', getVariableLabel('value'));
  setOptionText(colorSelect, 'row', getVariableLabel('row'));
  setOptionText(colorSelect, 'column', getVariableLabel('column'));
}

function updateEncodingSummary() {
  const target = document.getElementById('encoding-expression');
  if (!target) return;
  const fmt = I18N.encodingSummary[LANG];
  target.textContent = fmt(
    getVariableLabel(currentEncoding.x),
    getVariableLabel(currentEncoding.y),
    getVariableLabel(currentEncoding.z),
    getVariableLabel(currentEncoding.color)
  );
}

function applyEncodingToUI() {
  const xSelect = document.getElementById('encoding-x-select');
  const ySelect = document.getElementById('encoding-y-select');
  const zSelect = document.getElementById('encoding-z-select');
  const colorSelect = document.getElementById('encoding-color-select');
  if (xSelect) xSelect.value = currentEncoding.x;
  if (ySelect) ySelect.value = 'value';
  if (zSelect) zSelect.value = currentEncoding.z;
  if (colorSelect) colorSelect.value = currentEncoding.color;
  updateEncodingSummary();
}

function clearEncodingWarning() {
  const warning = document.getElementById('encoding-warning');
  if (!warning) return;
  warning.textContent = '';
  warning.classList.add('hidden');
}

function showEncodingWarning(message) {
  const warning = document.getElementById('encoding-warning');
  if (!warning) return;
  warning.textContent = message;
  warning.classList.remove('hidden');
}

function validateEncoding(encoding) {
  if (encoding.y !== 'value') return false;
  if (!['row', 'column'].includes(encoding.x)) return false;
  if (!['row', 'column'].includes(encoding.z)) return false;
  if (!['value', 'row', 'column'].includes(encoding.color)) return false;
  if (encoding.x === encoding.z) return false;
  return true;
}

function rebuildScene() {
  if (!currentData) return;

  currentMapped = getMappedData(currentData);
  if (!currentMapped || currentMapped.xLabels.length < 2 || currentMapped.zLabels.length < 2) return;

  const xMin = d3.min(currentMapped.xPositions);
  const xMax = d3.max(currentMapped.xPositions);
  const zMin = d3.min(currentMapped.zPositions);
  const zMax = d3.max(currentMapped.zPositions);

  xScale = d3.scaleLinear()
    .domain([xMin, xMax])
    .range([0, CONFIG.surfaceWidth]);

  yScale = d3.scaleLinear()
    .domain([yieldMin, yieldMax])
    .range([0, CONFIG.surfaceHeight]);

  zScale = d3.scaleLinear()
    .domain([zMin, zMax])
    .range([0, CONFIG.surfaceDepth]);

  colorScale = buildColorScale();

  if (surfaceGroup) {
    scene.remove(surfaceGroup);
    surfaceGroup.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }
  clearLabels();

  surfaceGroup = new THREE.Group();
  surfaceGroup.add(buildSurface(currentData));
  surfaceGroup.add(buildGridLines(currentData));
  surfaceGroup.add(buildBoundingBox());
  scene.add(surfaceGroup);

  createLabels(currentData);
  buildLegend();
  updateDataInfo(currentData);
}

function refreshAxisLabelsOnly() {
  if (!currentData || !xScale || !yScale || !zScale) return;
  clearLabels();
  createLabels(currentData);
  updateLabels();
}

function applyEncoding(nextEncoding) {
  if (!validateEncoding(nextEncoding)) {
    showEncodingWarning(t('encodingInvalidSameAxis'));
    currentEncoding = { ...lastValidEncoding };
    applyEncodingToUI();
    syncZeroCenterControl();
    return;
  }

  clearEncodingWarning();
  currentEncoding = { ...nextEncoding };
  lastValidEncoding = { ...nextEncoding };
  syncZeroCenterControl();
  updateEncodingSummary();
  rebuildScene();
}

function ensureDataPreviewSection() {
  const scrollContainer = document.querySelector('#tab-data .overflow-y-auto')
    || document.querySelector('#tab-data');
  if (!scrollContainer) return null;

  let section = document.getElementById('dvz-data-preview');
  if (!section) {
    section = document.createElement('section');
    section.id = 'dvz-data-preview';
    section.className = 'border-b border-gray-100 px-5 py-4';
    section.innerHTML = `
      <h3 id="dvz-data-preview-heading" class="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400"></h3>
      <div id="dvz-data-preview-content"></div>
    `;
    const metaSection = document.getElementById('dvz-data-meta');
    if (metaSection && metaSection.parentElement === scrollContainer) {
      scrollContainer.insertBefore(section, metaSection.nextSibling);
    } else {
      scrollContainer.appendChild(section);
    }
  }

  const heading = document.getElementById('dvz-data-preview-heading');
  if (heading) heading.textContent = t('dataPreviewTitle');
  return document.getElementById('dvz-data-preview-content');
}

function formatPreviewCell(v) {
  if (!Number.isFinite(v)) return '-';
  if (Math.abs(v) >= 1000) return String(Math.round(v));
  return String(v);
}

function updateDataPreview(data) {
  const content = ensureDataPreviewSection();
  if (!content) return;
  content.innerHTML = '';

  if (!data || !Array.isArray(data.rowLabels) || !Array.isArray(data.columnLabels) || !Array.isArray(data.matrixValues)) {
    const empty = document.createElement('p');
    empty.className = 'text-xs text-gray-400';
    empty.textContent = t('dataPreviewEmpty');
    content.appendChild(empty);
    return;
  }

  const rowCount = data.rowLabels.length;
  const colCount = data.columnLabels.length;
  if (rowCount === 0 || colCount === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-xs text-gray-400';
    empty.textContent = t('dataPreviewEmpty');
    content.appendChild(empty);
    return;
  }

  const maxRows = Math.min(5, rowCount);
  const wrapper = document.createElement('div');
  wrapper.className = 'overflow-x-auto rounded border border-gray-200';

  const table = document.createElement('table');
  table.className = 'min-w-max w-full border-collapse text-xs text-gray-600';

  const thead = document.createElement('thead');
  const hr = document.createElement('tr');

  const firstHeader = document.createElement('th');
  firstHeader.className = 'sticky left-0 bg-gray-50 px-2 py-1 text-left font-semibold text-gray-500 border-b border-gray-200 border-r border-gray-100';
  firstHeader.textContent = data.rowLabelName || 'row';
  hr.appendChild(firstHeader);

  data.columnLabels.forEach(label => {
    const th = document.createElement('th');
    th.className = 'bg-gray-50 px-2 py-1 text-left font-semibold text-gray-500 border-b border-gray-200 border-r border-gray-100';
    th.textContent = label;
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (let r = 0; r < maxRows; r++) {
    const tr = document.createElement('tr');

    const rowHead = document.createElement('td');
    rowHead.className = 'sticky left-0 bg-white px-2 py-1 border-b border-gray-100 border-r border-gray-100 text-gray-500';
    rowHead.textContent = String(data.rowLabels[r] ?? '');
    tr.appendChild(rowHead);

    for (let c = 0; c < colCount; c++) {
      const td = document.createElement('td');
      td.className = 'px-2 py-1 border-b border-gray-100 border-r border-gray-100 tabular-nums';
      td.textContent = formatPreviewCell(data.matrixValues[r]?.[c]);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  wrapper.appendChild(table);
  content.appendChild(wrapper);
}

// ===== SECTION 5: INITIALIZATION =====
async function init() {
  teardownSurfaceRuntime();
  applyI18n();

  // ツールヘッダー設定
  const enableModuleHeader = window.__DVZ_DISABLE_MODULE_HEADER !== true;
  const toolHeader = enableModuleHeader ? await waitForToolHeaderReady() : null;
  if (enableModuleHeader && toolHeader && typeof toolHeader.setConfig === 'function') {
    if (typeof dvzInstallHeaderProcessingToasts === 'function') {
      dvzInstallHeaderProcessingToasts(toolHeader);
    }
    toolHeader.setConfig({
      logo: { type: 'text', text: t('title') },
      buttons: [
        { label: t('saveProject'), action: () => {
          showToast(t('processingSavePrep'), 'info', 5000);
          toolHeader.showSaveModal({
            name: currentProjectName || currentDataName,
            data: getProjectData(),
            thumbnailDataUri: generateThumbnail(),
            existingProjectId: currentProjectId,
          });
        }, align: 'right' },
        { label: t('loadProject'), action: () => toolHeader.showLoadModal(), align: 'right' },
        { label: t('exportPng'), action: () => exportPng(), align: 'right' },
      ],
    });

    if (typeof toolHeader.setProjectConfig === 'function') {
      toolHeader.setProjectConfig({
        appName: '3d-surface-chart',
        apiBaseUrl: 'https://api.dataviz.jp',
        onProjectLoad: (projectData) => {
          restoreProject(projectData);
        },
        onProjectSave: (meta) => {
          const normalizedMeta = (typeof dvzNormalizeSavedProjectMeta === 'function')
            ? dvzNormalizeSavedProjectMeta(meta)
            : {
                id: meta?.id || meta?.project?.id || null,
                name: meta?.name || meta?.project?.name || null,
              };
          currentProjectId = normalizedMeta.id;
          currentProjectName = normalizedMeta.name;
        },
      });
    }

    // Sample data picker integration
    if (typeof toolHeader.setSampleConfig === 'function') {
      toolHeader.setSampleConfig({
        toolId: '3d-surface-chart',
        onSampleSelect: async (detail) => {
          try {
            // MOF period filter (extra.mofPeriod in catalog entry)
            const mofPeriodKey = detail.extra?.mofPeriod;
            if (mofPeriodKey && MOF_PERIODS[mofPeriodKey]) {
              const period = MOF_PERIODS[mofPeriodKey];
              await fetchMOFData();
              currentDataName = detail.name || '';
              updateDataNameDisplay();
              const data = getMOFFilteredData(period.start, period.end);
              loadData(data);
              window._surfaceApp?._updateDataMeta?.({
                source: 'sample',
                name: currentDataName,
                rowCount: data.rowLabels.length,
                columns: data.columnLabels,
              });
              const annotation = await window._surfaceApp?._resolveSampleAnnotation?.(detail, currentDataName, detail.url);
              window._surfaceApp?._applySampleAnnotation?.(annotation);
              return;
            }
            // Normal CSV
            const res = await fetch(detail.url);
            if (!res.ok) throw new Error(`Sample fetch failed (${res.status})`);
            const text = await res.text();
            const data = parseCSV(text, {
              name: detail.name,
              url: detail.url,
              sourceName: detail.name || detail.url,
            });
            currentDataName = detail.name || '';
            updateDataNameDisplay();
            loadData(data);
            window._surfaceApp?._updateDataMeta?.({
              source: 'sample',
              name: currentDataName,
              rowCount: data.rowLabels.length,
              columns: data.columnLabels,
            });
            const annotation = await window._surfaceApp?._resolveSampleAnnotation?.(detail, currentDataName, detail.url);
            window._surfaceApp?._applySampleAnnotation?.(annotation);
          } catch (err) {
            console.error('Sample data load failed:', err);
          }
        },
      });
    }
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
  resizeObserver = new ResizeObserver(() => onResize());
  resizeObserver.observe(container);
  resizeWindowHandler = () => onResize();
  window.addEventListener('resize', resizeWindowHandler);

  // Event listeners
  setupEventListeners();

  // Load default data (matches dropdown default: mof-recent5)
  try {
    const defaultPeriod = MOF_PERIODS['mof-recent5'];
    await fetchMOFData();
    currentDataName = `${t('mofGroup')} ${t('recent5')}`;
    updateDataNameDisplay();
    loadData(getMOFFilteredData(defaultPeriod.start, defaultPeriod.end));
    applySurfaceSampleAnnotation('mof-recent5', currentDataName);
  } catch (err) {
    console.error('Default MOF load failed, falling back to US sample:', err);
    try {
      const fallbackData = await fetchSampleCSV(SAMPLE_CSV.us);
      currentDataName = t('usTreasury');
      updateDataNameDisplay();
      loadData(fallbackData);
      applySurfaceSampleAnnotation('us', currentDataName);
    } catch (fallbackErr) {
      console.error('Fallback sample load failed:', fallbackErr);
      throw fallbackErr;
    }
  }

  // Animation loop
  animationRunning = true;
  animate();
}

function updateDataNameDisplay() {
  const el = document.getElementById('data-name');
  if (el) el.textContent = currentDataName || '';
}

// ===== SECTION 6: DATA LOADING =====
function loadData(data) {
  const normalized = normalizeLoadedData(data);
  if (!normalized) throw new Error(t('invalidDataFormat'));
  if (normalized.rowLabels.length < 2) throw new Error(t('alertFewRows'));
  if (normalized.columnLabels.length < 2) throw new Error(t('alertFewColumns'));

  currentData = normalized;

  let minY = Infinity;
  let maxY = -Infinity;
  for (const row of currentData.matrixValues) {
    for (const v of row) {
      if (!isNaN(v)) {
        if (v < minY) minY = v;
        if (v > maxY) maxY = v;
      }
    }
  }
  if (!Number.isFinite(minY) || !Number.isFinite(maxY)) {
    minY = 0;
    maxY = 1;
  }
  yieldMin = Math.floor(minY);
  yieldMax = Math.ceil(maxY);
  if (yieldMin === yieldMax) {
    yieldMin -= 1;
    yieldMax += 1;
  }

  updateEncodingUITexts();
  applyEncodingToUI();
  syncZeroCenterControl();
  updateDataPreview(currentData);
  rebuildScene();
}

// ===== SECTION 7: SURFACE MESH =====
function buildSurface(data) {
  const mapped = getMappedData(data);
  const numX = mapped.xLabels.length;
  const numZ = mapped.zLabels.length;
  const totalVerts = numX * numZ;

  const positions = new Float32Array(totalVerts * 3);
  const colors = new Float32Array(totalVerts * 3);

  for (let iz = 0; iz < numZ; iz++) {
    for (let ix = 0; ix < numX; ix++) {
      const idx = (iz * numX + ix) * 3;
      const cell = getMappedCell(mapped, ix, iz);
      const yieldVal = cell.value;
      const val = isNaN(yieldVal) ? 0 : yieldVal;
      const colorVal = getColorValueFromCell(cell);

      positions[idx]     = xScale(mapped.xPositions[ix]);
      positions[idx + 1] = yScale(val);
      positions[idx + 2] = zScale(mapped.zPositions[iz]);

      const color = isNaN(yieldVal) ? CONFIG.nanColor : new THREE.Color(colorScale(colorVal));
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
  const mapped = getMappedData(data);
  const numX = mapped.xLabels.length;
  const numZ = mapped.zLabels.length;

  const surfaceLineMat = new THREE.LineBasicMaterial({
    color: CONFIG.gridColor,
    opacity: CONFIG.gridOpacity,
    transparent: true,
  });

  // Lines along date axis (one per maturity)
  for (let ix = 0; ix < numX; ix++) {
    const points = [];
    for (let iz = 0; iz < numZ; iz++) {
      const cell = getMappedCell(mapped, ix, iz);
      const val = isNaN(cell.value) ? 0 : cell.value;
      points.push(new THREE.Vector3(
        xScale(mapped.xPositions[ix]),
        yScale(val),
        zScale(mapped.zPositions[iz])
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
      const cell = getMappedCell(mapped, ix, iz);
      const val = isNaN(cell.value) ? 0 : cell.value;
      points.push(new THREE.Vector3(
        xScale(mapped.xPositions[ix]),
        yScale(val),
        zScale(mapped.zPositions[iz])
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
      const cell = getMappedCell(mapped, ix, iz);
      const val = isNaN(cell.value) ? 0 : cell.value;
      points.push(new THREE.Vector3(
        xScale(mapped.xPositions[ix]),
        yScale(val),
        zScale(mapped.zPositions[iz])
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
    // Right wall
    const pts3 = [new THREE.Vector3(W, y, 0), new THREE.Vector3(W, y, D)];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts3), gridMat));
    // Front wall
    const pts4 = [new THREE.Vector3(0, y, D), new THREE.Vector3(W, y, D)];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts4), gridMat));
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
  const mapped = getMappedData(data);
  if (!mapped) return;

  // Yield axis labels on multiple faces (3D-specific)
  const yTicks = d3.ticks(yieldMin, yieldMax, 6);
  const yAxisFaces = [
    {
      tickAnchor: [CONFIG.surfaceWidth + 1.5, CONFIG.surfaceDepth + 0.5], // front-right
      titleAnchor: [CONFIG.surfaceWidth + 3, CONFIG.surfaceDepth + 1],
    },
    {
      tickAnchor: [-1.5, -0.5], // back-left
      titleAnchor: [-3, -1],
    },
  ];
  yAxisFaces.forEach((face) => {
    yTicks.forEach(tick => {
      const el = makeLabel(`${tick}`);
      el._anchor = new THREE.Vector3(face.tickAnchor[0], yScale(tick), face.tickAnchor[1]);
      container.appendChild(el);
      labelElements.push(el);
    });

    const yTitle = makeLabel(resolveAxisTitle('y', 'value', data), true);
    yTitle._anchor = new THREE.Vector3(face.titleAnchor[0], yScale((yieldMin + yieldMax) / 2), face.titleAnchor[1]);
    container.appendChild(yTitle);
    labelElements.push(yTitle);
  });

  // X axis labels (front edge)
  const xLabelIndices = selectLabelIndices(mapped.xLabels, mapped.xDim === 'column' ? 18 : 12);
  xLabelIndices.forEach(ix => {
    const el = makeLabel(mapped.xLabels[ix]);
    el.classList.add('category-label');
    if (currentLabelOrient === 'vertical') {
      el.classList.add('vertical');
    }
    el._anchor = new THREE.Vector3(xScale(mapped.xPositions[ix]), -1, CONFIG.surfaceDepth + 1.5);
    container.appendChild(el);
    labelElements.push(el);
  });

  // X axis title
  const xTitle = makeLabel(resolveAxisTitle('x', mapped.xDim, data), true);
  xTitle._anchor = new THREE.Vector3(CONFIG.surfaceWidth / 2, -2.5, CONFIG.surfaceDepth + 3);
  container.appendChild(xTitle);
  labelElements.push(xTitle);

  // Z axis labels (left edge)
  const zLabelIndices = selectLabelIndices(mapped.zLabels, mapped.zDim === 'row' ? 12 : 18);
  zLabelIndices.forEach(iz => {
    const el = makeLabel(mapped.zLabels[iz]);
    el._anchor = new THREE.Vector3(-2, -1, zScale(mapped.zPositions[iz]));
    container.appendChild(el);
    labelElements.push(el);
  });

  // Z axis title
  const zTitle = makeLabel(resolveAxisTitle('z', mapped.zDim, data), true);
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

function selectLabelIndices(labels, maxLabels = 12) {
  const count = labels.length;
  if (count <= maxLabels) return labels.map((_, i) => i);
  const step = Math.max(1, Math.ceil((count - 1) / (maxLabels - 1)));
  const out = [0];
  for (let i = step; i < count - 1; i += step) out.push(i);
  if (out[out.length - 1] !== count - 1) out.push(count - 1);
  return out;
}

function getAxisTitle(dim, data) {
  if (dim === 'row') return data?.rowLabelName || t('rowVariable');
  if (dim === 'column') return data?.columnLabelName || t('columnVariable');
  return getValueVariableName() || data?.valueLabelName || t('valueVariable');
}

function resolveAxisTitle(axisKey, dim, data) {
  const override = (axisTitleOverrides?.[axisKey] || '').trim();
  if (override) return override;
  return getAxisTitle(dim, data);
}

function readAxisTitleInputs() {
  const xInput = document.getElementById('axis-title-x');
  const yInput = document.getElementById('axis-title-y');
  const zInput = document.getElementById('axis-title-z');
  axisTitleOverrides = {
    x: (xInput?.value || '').trim(),
    y: (yInput?.value || '').trim(),
    z: (zInput?.value || '').trim(),
  };
}

function writeAxisTitleInputs() {
  const xInput = document.getElementById('axis-title-x');
  const yInput = document.getElementById('axis-title-y');
  const zInput = document.getElementById('axis-title-z');
  if (xInput) xInput.value = axisTitleOverrides.x || '';
  if (yInput) yInput.value = axisTitleOverrides.y || '';
  if (zInput) zInput.value = axisTitleOverrides.z || '';
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
  // Legacy buildLegend — now handled by SurfaceChartApp._renderLegend()
  // Trigger the DvzApp legend if app instance exists
  if (window._surfaceApp) window._surfaceApp._renderLegend();
}

// ===== SECTION 12: DATA INFO =====
function updateDataInfo(data) {
  const el = document.getElementById('data-info');
  if (!el) return;
  const rows = data.rowLabels || [];
  const cols = data.columnLabels || [];
  if (!rows.length || !cols.length) {
    el.textContent = '';
    return;
  }
  const first = rows[0];
  const last = rows[rows.length - 1];
  const fmt = I18N.dataInfo[LANG];
  el.textContent =
    fmt(rows.length, first, last, cols.length, cols[0], cols[cols.length - 1]);
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

function parseCSV(text, meta = {}) {
  const parsed = d3.csvParse(text.trim());
  if (parsed.length === 0) throw new Error('CSV is empty');

  // 1列目をインデックス（行ラベル）、残りをデータ列とする
  const indexCol = parsed.columns[0];
  const columns = parsed.columns.slice(1);
  if (columns.length === 0) throw new Error('No data columns found (need at least 2 columns)');

  return createSurfaceData(
    indexCol,
    columns,
    parsed.map(row => ({
      label: row[indexCol],
      values: columns.map(col => row[col]),
    })),
    meta
  );
}

function handleCSVFile(file) {
  if (!file || !file.name.endsWith('.csv')) {
    alert(t('alertCsvFile'));
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = parseCSV(e.target.result, { filename: file.name });
      if (data.rowLabels.length < 2) throw new Error(t('alertFewRows'));
      const sampleSel = document.getElementById('sample-select');
      if (sampleSel) sampleSel.value = '';
      currentDataName = file.name.replace(/\.csv$/i, '');
      updateDataNameDisplay();
      loadData(data);
    } catch (err) {
      alert(t('alertParseError') + err.message);
    }
  };
  reader.readAsText(file);
}

// ===== SECTION 15: EVENT LISTENERS =====
function setupEventListeners() {
  // Sample data selector (if present in DOM)
  const sampleSelectEl = document.getElementById('sample-select');
  if (sampleSelectEl) {
    sampleSelectEl.addEventListener('change', async (e) => {
      const key = e.target.value;
      if (!key) return;
      const selectedOption = e.target.selectedOptions[0];
      const groupLabel = selectedOption?.closest('optgroup')?.label || '';
      const optionText = selectedOption?.textContent || '';
      currentDataName = groupLabel ? `${groupLabel} ${optionText}` : optionText;

      // MOF CSV data
      if (key.startsWith('mof-')) {
        const period = MOF_PERIODS[key];
        if (!period) return;
        await fetchMOFData();
        loadData(getMOFFilteredData(period.start, period.end));
        applySurfaceSampleAnnotation(key, currentDataName);
        return;
      }

      // Built-in sample data (CSV)
      const csvUrl = SAMPLE_CSV[key];
      if (csvUrl) {
        loadData(await fetchSampleCSV(csvUrl));
        applySurfaceSampleAnnotation(key, currentDataName);
      }
    });
  }

  // Color scheme selector
  const zeroCenterCheckbox = document.getElementById('zero-center');

  document.getElementById('color-select').addEventListener('change', (e) => {
    currentColorScheme = e.target.value;
    syncZeroCenterControl();
    updateColors();
  });

  // "0基準" checkbox
  zeroCenterCheckbox.addEventListener('change', (e) => {
    zeroCentered = e.target.checked;
    updateColors();
  });

  // Encoding selectors in Style tab
  const xSelect = document.getElementById('encoding-x-select');
  const ySelect = document.getElementById('encoding-y-select');
  const zSelect = document.getElementById('encoding-z-select');
  const colorSelect = document.getElementById('encoding-color-select');
  const onEncodingChange = (event) => {
    const next = {
      x: xSelect?.value || 'column',
      y: ySelect?.value || 'value',
      z: zSelect?.value || 'row',
      color: colorSelect?.value || 'value',
    };
    if (event?.target?.id === 'encoding-x-select') {
      next.z = next.x === 'row' ? 'column' : 'row';
    } else if (event?.target?.id === 'encoding-z-select') {
      next.x = next.z === 'row' ? 'column' : 'row';
    }
    applyEncoding(next);
  };
  xSelect?.addEventListener('change', onEncodingChange);
  ySelect?.addEventListener('change', onEncodingChange);
  zSelect?.addEventListener('change', onEncodingChange);
  colorSelect?.addEventListener('change', onEncodingChange);
  applyEncodingToUI();
  syncZeroCenterControl();

  ['x', 'y', 'z'].forEach((axis) => {
    const input = document.getElementById(`axis-title-${axis}`);
    if (!input) return;
    input.addEventListener('input', () => {
      readAxisTitleInputs();
      updateEncodingUITexts();
      updateEncodingSummary();
      buildLegend();
      refreshAxisLabelsOnly();
    });
  });

  // Label orientation selector (editor-only; shared pages restore this from state)
  const labelOrientSelect = document.getElementById('label-orient');
  if (labelOrientSelect) {
    labelOrientSelect.value = currentLabelOrient;
    labelOrientSelect.addEventListener('change', (e) => {
      setLabelOrient(e.target.value);
    });
  }

  // CSV upload — handled by template dropzone (dvzInitFileUpload) in SurfaceChartApp.start()
  // Legacy CSV button support (if elements exist)
  document.getElementById('csv-btn')?.addEventListener('click', () => {
    document.getElementById('csv-input')?.click();
  });
  document.getElementById('csv-input')?.addEventListener('change', (e) => {
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

  // Clear active preset when user manually drags the camera
  controls?.addEventListener('start', () => {
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
  });

  // Share button — handled by the orchestrator (interactive-chart-builder.js)
}

// ===== SECTION 16: RESIZE =====
function onResize() {
  if (!camera || !renderer) return;
  const container = document.getElementById('chart-container');
  if (!container) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w === 0 || h === 0) return;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

// ===== SECTION 17: ANIMATION LOOP =====
function animate() {
  if (!animationRunning) return;
  animationHandle = requestAnimationFrame(animate);
  if (!camera || !controls || !scene || !renderer) return;

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

function teardownSurfaceRuntime() {
  debugPanelGeneration += 1;
  if (debugPaneRefreshTimer !== null) {
    clearInterval(debugPaneRefreshTimer);
    debugPaneRefreshTimer = null;
  }
  if (debugPane && typeof debugPane.dispose === 'function') {
    debugPane.dispose();
  }
  debugPane = null;

  animationRunning = false;
  if (animationHandle !== null) {
    cancelAnimationFrame(animationHandle);
    animationHandle = null;
  }

  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (resizeWindowHandler) {
    window.removeEventListener('resize', resizeWindowHandler);
    resizeWindowHandler = null;
  }

  clearLabels();

  if (surfaceGroup && scene) {
    scene.remove(surfaceGroup);
    surfaceGroup.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat) => mat?.dispose?.());
        } else if (typeof obj.material.dispose === 'function') {
          obj.material.dispose();
        }
      }
    });
    surfaceGroup = null;
  }

  if (controls && typeof controls.dispose === 'function') {
    controls.dispose();
  }
  controls = null;

  if (renderer) {
    if (typeof renderer.dispose === 'function') renderer.dispose();
    if (typeof renderer.forceContextLoss === 'function') renderer.forceContextLoss();
    renderer.domElement?.remove();
  }
  renderer = null;
  camera = null;
  scene = null;
  animating = false;
  animFrame = 0;
}

// ===== SECTION 18: DEBUG PANEL (Tweakpane, ?debug only) =====
async function initDebugPanel() {
  if (!new URLSearchParams(location.search).has('debug')) return;

  const generation = debugPanelGeneration;
  const { Pane } = await import('https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js');
  if (generation !== debugPanelGeneration || !renderer || !camera || !controls) return;

  const pane = new Pane({ title: 'Debug' });
  debugPane = pane;

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
  debugPaneRefreshTimer = setInterval(() => {
    if (!camera || !controls) return;
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
const SUPABASE_ANON_KEY = 'sb_publishable_sAjwbAhC0jnIRjNa34QuTA_CcksMYQG';

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

// shareToWeb / showShareModal removed — share is managed by the orchestrator
// via DvzApp.prototype.shareProject() override

// ===== SECTION 18b: PROJECT HELPERS =====
function showToast(msg, type, duration) {
  const th = document.querySelector('dataviz-tool-header');
  const text = typeof msg === 'string' && I18N[msg] ? t(msg) : msg;
  if (th && th.showMessage) th.showMessage(text, type || 'success', duration);
}

function getProjectData() {
  readAxisTitleInputs();
  return DVZSettingsCompat.build(SETTINGS_SPEC, {
    data: currentData,
    settings: {
      colorScheme: currentColorScheme,
      zeroCentered: zeroCentered,
      labelOrient: currentLabelOrient,
      encoding: { ...currentEncoding },
      axisTitles: { ...axisTitleOverrides },
      sampleSelect: document.getElementById('sample-select')?.value || '',
      cameraPosition: [camera.position.x, camera.position.y, camera.position.z],
      cameraTarget: [controls.target.x, controls.target.y, controls.target.z],
    },
  });
}

function restoreProject(project) {
  const normalized = DVZSettingsCompat.normalize(project, SETTINGS_SPEC);
  const { data, settings } = normalized;
  const parsedData = normalizeLoadedData(data);
  if (!parsedData || parsedData.rowLabels.length < 2) {
    showToast(t('alertParseError') + t('alertInvalidProjectData'), 'error');
    return;
  }

  // Restore data & data name
  const select = document.getElementById('sample-select');
  if (select) {
    select.value = settings.sampleSelect;
    const selectedOption = select.selectedOptions[0];
    if (selectedOption && selectedOption.value) {
      const groupLabel = selectedOption.closest('optgroup')?.label || '';
      const optionText = selectedOption.textContent || '';
      currentDataName = groupLabel ? `${groupLabel} ${optionText}` : optionText;
    }
  }
  if (!currentDataName) {
    currentDataName = '';
  }

  axisTitleOverrides = {
    x: settings.axisTitles.x.trim(),
    y: settings.axisTitles.y.trim(),
    z: settings.axisTitles.z.trim(),
  };
  setLabelOrient(settings.labelOrient);
  writeAxisTitleInputs();

  loadData(parsedData);

  // Restore settings
  const nextEncoding = {
    x: settings.encoding.x,
    y: 'value',
    z: settings.encoding.z,
    color: settings.encoding.color,
  };
  if (validateEncoding(nextEncoding)) {
    currentEncoding = { ...nextEncoding };
    lastValidEncoding = { ...nextEncoding };
    applyEncodingToUI();
    clearEncodingWarning();
    rebuildScene();
  }

  currentColorScheme = settings.colorScheme;
  document.getElementById('color-select').value = settings.colorScheme;

  zeroCentered = settings.zeroCentered;
  document.getElementById('zero-center').checked = zeroCentered;

  if (Array.isArray(settings.cameraPosition) && settings.cameraPosition.length >= 3) {
    camera.position.set(...settings.cameraPosition.slice(0, 3));
  }
  if (Array.isArray(settings.cameraTarget) && settings.cameraTarget.length >= 3) {
    controls.target.set(...settings.cameraTarget.slice(0, 3));
    controls.update();
  }

  syncZeroCenterControl();
  updateColors();
  refreshAxisLabelsOnly();
}

function exportPng() {
  showToast(t('processingExport'), 'info', 5000);
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

function generateThumbnail() {
  renderer.render(scene, camera);
  const canvas = renderer.domElement;
  const scale = Math.min(1, 400 / canvas.width);
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = Math.round(canvas.width * scale);
  thumbCanvas.height = Math.round(canvas.height * scale);
  const ctx = thumbCanvas.getContext('2d');
  ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
  return thumbCanvas.toDataURL('image/png');
}

// ===== TEMPLATE INTEGRATION =====
// Wrap as DvzApp subclass using globals from dvz-common.js
class SurfaceChartApp extends DvzApp {
  constructor() {
    super(TOOL_CONFIG);
    // Expose instance for module-level functions (buildLegend, _updateDataMeta)
    window._surfaceApp = this;
    // Merge tool-specific i18n into template i18n
    const toolJa = {};
    const toolEn = {};
    for (const [key, val] of Object.entries(I18N)) {
      if (val.ja) toolJa[key] = typeof val.ja === 'function' ? val.ja : val.ja;
      if (val.en) toolEn[key] = typeof val.en === 'function' ? val.en : val.en;
    }
    dvzSetI18n({
      ja: { ...DVZ_I18N.ja, ...toolJa },
      en: { ...DVZ_I18N.en, ...toolEn },
    });
  }

  async start() {
    // Template infrastructure
    this._setupDataPanel();
    this._setupAnnotate();
    this._setupLegend();
    this._setupEmbed();

    // Init the 3D chart (existing logic) — must complete before data loading
    await init();
    initDebugPanel();

    // Setup sidebar tabs
    initSidebarTabs();

    // Sample data (after 3D scene is ready)
    this._setupSampleData();

    // Standalone mode only: URL param handling (project restore)
    const enableModuleRouting = window.__DVZ_DISABLE_MODULE_ROUTING !== true;
    if (enableModuleRouting) {
      const params = new URLSearchParams(window.location.search);
      const projectId = params.get('projectId');
      if (projectId) {
        const header = document.querySelector('dataviz-tool-header');
        if (header) {
          header.loadProject(projectId).then((projectData) => {
            if (projectData) {
              restoreProject(projectData);
              currentProjectId = projectId;
            }
          });
        }
      }
    }

    // Template dropzone for CSV upload
    dvzInitFileUpload((parsed) => {
      if (parsed.type === 'csv' || parsed.filename?.endsWith('.csv')) {
        const data = parseCSV(parsed.raw, {
          filename: parsed.filename,
          sourceName: parsed.filename,
        });
        currentDataName = parsed.filename?.replace(/\.[^.]+$/, '') || 'Custom';
        updateDataNameDisplay();
        loadData(data);
        this._updateDataMeta({
          source: 'upload',
          name: currentDataName,
          rowCount: data.rowLabels.length,
          columns: data.columnLabels,
        });
      }
    });

    // Export buttons (template sidebar)
    document.getElementById('export-png-btn')?.addEventListener('click', () => exportPng());
    this._setupEmbedCopy();

    dvzApplyI18n();
  }

  _onCatalogEmpty() {
    if (this._shouldSkipAutoSampleLoad()) return;
    // Fallback: load default MOF recent 5 years
    fetchMOFData()
      .then(() => {
        if (this._shouldSkipAutoSampleLoad()) return;
        const period = MOF_PERIODS['mof-recent5'];
        const data = getMOFFilteredData(period.start, period.end);
        loadData(data);
        this._updateDataMeta({
          source: 'sample',
          name: t('mofGroup') + ' ' + t('recent5'),
          rowCount: data.rowLabels.length,
          columns: data.columnLabels,
        });
        this._applySampleAnnotation(this._sampleAnnotationFromDetail({
          name: t('mofGroup') + ' ' + t('recent5'),
          source: SURFACE_SAMPLE_SOURCES.mof.source[LANG],
          sourceUrl: SURFACE_SAMPLE_SOURCES.mof.sourceUrl,
        }));
      })
      .catch(async (err) => {
        console.error('Catalog fallback (MOF) failed:', err);
        try {
          const data = await fetchSampleCSV(SAMPLE_CSV.us);
          if (this._shouldSkipAutoSampleLoad()) return;
          loadData(data);
          this._updateDataMeta({
            source: 'sample',
            name: t('usTreasury'),
            rowCount: data.rowLabels.length,
            columns: data.columnLabels,
          });
          this._applySampleAnnotation(this._sampleAnnotationFromDetail({
            name: t('usTreasury'),
            source: SURFACE_SAMPLE_SOURCES.us.source[LANG],
            sourceUrl: SURFACE_SAMPLE_SOURCES.us.sourceUrl,
          }));
        } catch (fallbackErr) {
          console.error('Catalog fallback (US sample) failed:', fallbackErr);
        }
      });
  }

  async _onSampleDataLoaded(url, format, name, options = {}) {
    if (options.background && this._shouldSkipAutoSampleLoad()) return;
    try {
      const res = await fetch(url);
      const text = await res.text();
      const data = parseCSV(text, {
        name,
        url,
        sourceName: name || url,
      });
      if (options.background && this._shouldSkipAutoSampleLoad()) return;
      currentDataName = name || url.split('/').pop().replace(/\.[^.]+$/, '');
      updateDataNameDisplay();
      loadData(data);
      this._updateDataMeta({
        source: 'sample',
        name: currentDataName,
        rowCount: data.rowLabels.length,
        columns: data.columnLabels,
      });
    } catch (err) {
      console.error('Sample data load failed:', err);
    }
  }

  // Override SVG-based methods for WebGL
  _exportSVG() {
    dvzShowToast(t('svgExportUnsupported'), 'error');
  }

  _exportPNG() {
    exportPng();
  }

  async _generateThumbnail() {
    return generateThumbnail();
  }

  _getExportData() {
    if (!currentData || !Array.isArray(currentData.rowLabels) || !Array.isArray(currentData.columnLabels)) {
      return null;
    }
    if (!currentData.rowLabels.length || !currentData.columnLabels.length) return null;

    const rowLabelName = currentData.rowLabelName || 'row';
    const columns = [rowLabelName, ...currentData.columnLabels];
    const rows = currentData.rowLabels.map((label, rowIndex) => {
      const values = Array.isArray(currentData.matrixValues?.[rowIndex])
        ? currentData.matrixValues[rowIndex]
        : [];
      return [label, ...currentData.columnLabels.map((_, colIndex) => values[colIndex] ?? '')];
    });

    return { columns, rows };
  }

  _getProjectData() {
    return getProjectData();
  }

  _loadProjectData(data) {
    restoreProject(data);
  }

  destroy() {
    this._destroyTemplateInfrastructure();
    teardownSurfaceRuntime();
    window._surfaceApp = null;
  }

  // _getShareUrl is managed by the orchestrator (DvzApp.prototype override)

  // Override: gradient legend for 3D chart (not category swatches)
  _renderLegend() {
    // Remove any existing DOM legend
    document.getElementById('dvz-legend')?.remove();

    const position = document.getElementById('legend-position')?.value || 'none';
    if (position === 'none' || !colorScale || !currentData) return;

    const container = document.getElementById('chart-container');
    if (!container) return;

    const legend = document.createElement('div');
    legend.id = 'dvz-legend';
    legend.className = position;
    legend.style.display = 'flex';
    legend.style.flexDirection = 'column';
    legend.style.alignItems = 'center';
    legend.style.gap = '4px';
    legend.style.background = 'rgba(255,255,255,0.85)';
    legend.style.padding = '8px';
    legend.style.borderRadius = '6px';

    let domainMin = yieldMin;
    let domainMax = yieldMax;
    let topLabelText = yieldMax?.toFixed(1) ?? '';
    let bottomLabelText = yieldMin?.toFixed(1) ?? '';

    if (currentEncoding.color === 'row') {
      domainMin = 0;
      domainMax = Math.max(currentData.rowLabels.length - 1, 1);
      topLabelText = currentData.rowLabels[currentData.rowLabels.length - 1] || '';
      bottomLabelText = currentData.rowLabels[0] || '';
    } else if (currentEncoding.color === 'column') {
      domainMin = 0;
      domainMax = Math.max(currentData.columnLabels.length - 1, 1);
      topLabelText = currentData.columnLabels[currentData.columnLabels.length - 1] || '';
      bottomLabelText = currentData.columnLabels[0] || '';
    }

    const titleLabel = document.createElement('span');
    titleLabel.style.fontSize = '10px';
    titleLabel.style.fontWeight = '600';
    titleLabel.style.color = '#555';
    titleLabel.textContent = getVariableLabel(currentEncoding.color);
    legend.appendChild(titleLabel);

    const topLabel = document.createElement('span');
    topLabel.style.fontSize = '10px';
    topLabel.style.color = '#666';
    topLabel.textContent = topLabelText;
    legend.appendChild(topLabel);

    // Canvas gradient (vertical)
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 120;
    canvas.style.borderRadius = '3px';
    canvas.style.border = '1px solid #ddd';
    const ctx = canvas.getContext('2d');
    for (let i = 0; i < 120; i++) {
      const t = i / 119;
      const sampled = domainMax - t * (domainMax - domainMin);
      const color = colorScale(sampled);
      ctx.fillStyle = typeof color === 'string' ? color : `rgb(${Math.round(color.r*255)},${Math.round(color.g*255)},${Math.round(color.b*255)})`;
      ctx.fillRect(0, i, 16, 1);
    }
    legend.appendChild(canvas);

    const bottomLabel = document.createElement('span');
    bottomLabel.style.fontSize = '10px';
    bottomLabel.style.color = '#666';
    bottomLabel.textContent = bottomLabelText;
    legend.appendChild(bottomLabel);

    container.appendChild(legend);
  }
}

// ===== Module registration for Interactive Chart Builder =====
window.ChartModules = window.ChartModules || {};
window.ChartModules['3d-surface-chart'] = {
  ChartClass: SurfaceChartApp,
  isAsync: true, // start() is async
  META: {
    sidebarDataHTML: ``,
    sidebarMappingHTML: `
      <section class="px-5 py-4">
        <div class="space-y-3">
          <div>
            <label for="encoding-x-select" class="mb-1 block text-xs text-gray-500">${t('styleXAxis')}</label>
            <select id="encoding-x-select" class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none">
              <option value="column"></option>
              <option value="row"></option>
            </select>
          </div>
          <div>
            <label for="encoding-y-select" class="mb-1 block text-xs text-gray-500">${t('styleYAxis')}</label>
            <select id="encoding-y-select" class="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 focus:outline-none" disabled>
              <option value="value"></option>
            </select>
          </div>
          <div>
            <label for="encoding-z-select" class="mb-1 block text-xs text-gray-500">${t('styleZAxis')}</label>
            <select id="encoding-z-select" class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none">
              <option value="row"></option>
              <option value="column"></option>
            </select>
          </div>
          <div>
            <label for="encoding-color-select" class="mb-1 block text-xs text-gray-500">${t('styleColor')}</label>
            <select id="encoding-color-select" class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none">
              <option value="value"></option>
              <option value="row"></option>
              <option value="column"></option>
            </select>
          </div>
        </div>
        <p id="encoding-warning" class="mt-3 text-xs text-red-500 hidden"></p>
      </section>
    `,
    sidebarStyleHTML: `
      <section class="px-5 py-4">
        <h3 class="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">${t('styleAxisTitles')}</h3>
        <div class="space-y-3">
          <div>
            <label for="axis-title-x" class="mb-1 block text-xs text-gray-500">${t('styleXAxisTitle')}</label>
            <input type="text" id="axis-title-x" class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none" placeholder="${t('styleAxisTitleAutoPlaceholder')}">
          </div>
          <div>
            <label for="axis-title-y" class="mb-1 block text-xs text-gray-500">${t('styleYAxisTitle')}</label>
            <input type="text" id="axis-title-y" class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none" placeholder="${t('styleAxisTitleAutoPlaceholder')}">
          </div>
          <div>
            <label for="axis-title-z" class="mb-1 block text-xs text-gray-500">${t('styleZAxisTitle')}</label>
            <input type="text" id="axis-title-z" class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none" placeholder="${t('styleAxisTitleAutoPlaceholder')}">
          </div>
        </div>
      </section>
      <section class="border-t border-gray-100 px-5 py-4">
        <label for="label-orient" class="mb-1 block text-xs text-gray-500">${t('styleLabelOrientation')}</label>
        <select id="label-orient" class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none">
          <option value="horizontal">${t('labelHorizontal')}</option>
          <option value="vertical">${t('labelVertical')}</option>
        </select>
      </section>
    `,
    controlsHTML: `
      <select id="color-select" class="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs focus:border-gray-500 focus:outline-none">
        <optgroup label="${t('sequential')}">
          <option value="YlOrRd" selected>YlOrRd</option>
          <option value="YlGnBu">YlGnBu</option>
          <option value="Viridis">Viridis</option>
          <option value="Inferno">Inferno</option>
          <option value="Plasma">Plasma</option>
          <option value="Cividis">Cividis</option>
          <option value="Turbo">Turbo</option>
          <option value="Blues">Blues</option>
          <option value="Greens">Greens</option>
          <option value="Oranges">Oranges</option>
          <option value="Reds">Reds</option>
          <option value="Purples">Purples</option>
        </optgroup>
        <optgroup label="${t('diverging')}">
          <option value="RdBu">RdBu</option>
          <option value="RdYlBu">RdYlBu</option>
          <option value="RdYlGn">RdYlGn</option>
          <option value="Spectral">Spectral</option>
          <option value="BrBG">BrBG</option>
          <option value="PRGn">PRGn</option>
          <option value="PiYG">PiYG</option>
          <option value="PuOr">PuOr</option>
          <option value="RdGy">RdGy</option>
        </optgroup>
      </select>
      <label id="zero-center-label" class="flex items-center gap-1 text-xs" style="display:none;">
        <input type="checkbox" id="zero-center"> <span>${t('zeroBasis')}</span>
      </label>
      <div class="flex gap-1">
        <button class="view-btn rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50 active" data-view="overview">${t('viewOverview')}</button>
        <button class="view-btn rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50" data-view="front">${t('viewFront')}</button>
        <button class="view-btn rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50" data-view="top">${t('viewTop')}</button>
        <button class="view-btn rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50" data-view="side">${t('viewSide')}</button>
      </div>
    `,
  },
};
