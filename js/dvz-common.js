// ============================================================
// dataviz.jp — Common template utilities
// ============================================================

// ----------------------------------------------------------
// Google Analytics (loaded dynamically from TOOL_CONFIG.gaId)
// ----------------------------------------------------------
function dvzInitGA(gaId) {
  if (!gaId) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', gaId);
}

// ----------------------------------------------------------
// Utility: debounce
// ----------------------------------------------------------
function dvzDebounce(fn, ms = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ----------------------------------------------------------
// Utility: deep merge config with defaults
// ----------------------------------------------------------
function dvzMergeConfig(defaults, overrides) {
  const result = { ...defaults, ...overrides };
  for (const key of Object.keys(defaults)) {
    if (defaults[key] && typeof defaults[key] === 'object' && !Array.isArray(defaults[key])
        && overrides && overrides[key] && typeof overrides[key] === 'object') {
      result[key] = { ...defaults[key], ...overrides[key] };
    }
  }
  return result;
}

function dvzParseCompatibleToolToken(token) {
  const value = String(token || '').trim();
  const slashIndex = value.indexOf('/');
  if (slashIndex === -1) {
    return {
      token: value,
      baseTool: value,
      chartKey: null,
    };
  }

  return {
    token: value,
    baseTool: value.slice(0, slashIndex),
    chartKey: value.slice(slashIndex + 1) || null,
  };
}

function dvzResolveCatalogEntriesForTool(entries, toolId, chartKey) {
  const matchedBare = [];
  const matchedQualified = [];

  (entries || []).forEach((entry) => {
    const tokens = (entry.compatibleTools || []).map(dvzParseCompatibleToolToken);
    const qualifiedHit = chartKey && tokens.some((token) =>
      token.baseTool === toolId && token.chartKey === chartKey
    );
    if (qualifiedHit) {
      matchedQualified.push(entry);
      return;
    }

    const bareHit = tokens.some((token) =>
      token.baseTool === toolId && !token.chartKey
    );
    if (bareHit) matchedBare.push(entry);
  });

  return matchedQualified.length > 0 ? matchedQualified : matchedBare;
}

function dvzNormalizeSampleFormat(format, url = '') {
  const normalized = String(format || '').trim().toLowerCase();
  if (normalized) {
    if (normalized === 'geojson' || normalized === 'topojson') return 'json';
    return normalized;
  }

  const ext = String(url || '').split('.').pop()?.toLowerCase();
  if (ext === 'tsv') return 'tsv';
  if (ext === 'json' || ext === 'geojson' || ext === 'topojson') return 'json';
  return 'csv';
}

function dvzParseSampleDataText(text, format, url = '') {
  const normalized = dvzNormalizeSampleFormat(format, url);
  if (normalized === 'json') return JSON.parse(text);
  if (normalized === 'tsv') return d3.tsvParse(text);
  return d3.csvParse(text);
}

// ----------------------------------------------------------
// Locale setup (d3-format / d3-time-format default locales)
//
// Installs a Japanese locale for any downstream call to
// d3.format() or d3.timeFormat(). Modules that need a
// different currency (e.g. USD charts) must construct their
// own formatter explicitly instead of relying on the default
// currency specifier.
// ----------------------------------------------------------
(function dvzInitD3Locale() {
  if (typeof d3 === 'undefined') return;
  if (typeof d3.formatDefaultLocale === 'function') {
    d3.formatDefaultLocale({
      decimal: '.',
      thousands: ',',
      grouping: [3],
      currency: ['¥', ''],
    });
  }
  if (typeof d3.timeFormatDefaultLocale === 'function') {
    d3.timeFormatDefaultLocale({
      dateTime: '%Y年%-m月%-d日 %H時%M分%S秒',
      date: '%Y/%m/%d',
      time: '%H:%M:%S',
      periods: ['AM', 'PM'],
      days: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
      shortDays: ['日', '月', '火', '水', '木', '金', '土'],
      months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      shortMonths: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    });
  }
})();

// ----------------------------------------------------------
// Axis helpers (shared across D3 charts)
// ----------------------------------------------------------

// Compute a responsive tick count based on available pixel width.
// Uses a target of roughly `pxPerTick` pixels between ticks, with
// floors/ceilings to avoid extreme values on very narrow or wide axes.
function dvzTickCount(innerSize, { pxPerTick = 80, min = 3, max = 10 } = {}) {
  if (!isFinite(innerSize) || innerSize <= 0) return min;
  const n = Math.floor(innerSize / pxPerTick);
  return Math.max(min, Math.min(max, n));
}

function dvzAxisTickCountX(innerSize) {
  return dvzTickCount(innerSize, { pxPerTick: 72, min: 3, max: 8 });
}

function dvzAxisTickCountY(innerSize) {
  return dvzTickCount(innerSize, { pxPerTick: 56, min: 3, max: 8 });
}

function dvzEvenlySample(values, maxCount) {
  const list = Array.isArray(values) ? values : [];
  if (!list.length) return [];
  if (list.length === 1) return [...list];

  const requested = Number.isFinite(maxCount) ? Math.floor(maxCount) : list.length;
  const target = Math.max(2, Math.min(list.length, requested || list.length));
  if (list.length <= target) return [...list];

  const picked = new Set([0, list.length - 1]);
  for (let step = 1; step < target - 1; step += 1) {
    const index = Math.round((step * (list.length - 1)) / (target - 1));
    picked.add(index);
  }

  if (picked.size < target) {
    for (let index = 1; index < list.length - 1 && picked.size < target; index += 1) {
      picked.add(index);
    }
  }

  return [...picked]
    .sort((a, b) => a - b)
    .map((index) => list[index]);
}

function dvzSetSvgTitle(node, text) {
  if (!node) return;
  const existing = node.querySelector('title');
  if (existing) existing.remove();
  if (text === null || text === undefined || String(text) === '') return;
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
  title.textContent = String(text);
  node.appendChild(title);
}

function dvzGetResponsiveTimeTickSpec(domain, axisSize) {
  const targetTicks = dvzAxisTickCountX(axisSize);
  const values = Array.isArray(domain) ? domain : [];
  const startValue = values[0] instanceof Date ? +values[0] : +new Date(values[0]);
  const endValue = values[1] instanceof Date ? +values[1] : +new Date(values[1]);
  const fallback = {
    interval: d3.timeYear.every(1),
    formatter: d3.timeFormat('%Y'),
    targetTicks,
    unit: 'year',
  };
  if (!Number.isFinite(startValue) || !Number.isFinite(endValue)) return fallback;

  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;
  const monthMs = 30.4375 * dayMs;
  const yearMs = 365.25 * dayMs;
  const spanMs = Math.max(0, Math.abs(endValue - startValue));

  if (spanMs >= 8 * yearMs) {
    const intervalCount = Math.max(1, Math.ceil((spanMs / yearMs) / targetTicks));
    return {
      interval: d3.timeYear.every(intervalCount),
      formatter: d3.timeFormat('%Y'),
      targetTicks,
      unit: 'year',
    };
  }

  if (spanMs >= 18 * monthMs) {
    const intervalCount = Math.max(1, Math.ceil((spanMs / monthMs) / targetTicks));
    return {
      interval: d3.timeMonth.every(intervalCount),
      formatter: d3.timeFormat('%Y/%-m'),
      targetTicks,
      unit: 'month',
    };
  }

  if (spanMs >= 60 * dayMs) {
    const intervalCount = Math.max(1, Math.ceil((spanMs / weekMs) / targetTicks));
    return {
      interval: d3.timeWeek.every(intervalCount),
      formatter: d3.timeFormat('%-m/%-d'),
      targetTicks,
      unit: 'week',
    };
  }

  const intervalCount = Math.max(1, Math.ceil((Math.max(spanMs, dayMs) / dayMs) / targetTicks));
  return {
    interval: d3.timeDay.every(intervalCount),
    formatter: d3.timeFormat('%-m/%-d'),
    targetTicks,
    unit: 'day',
  };
}

function dvzBuildResponsiveTimeAxis(scale, domain, axisSize, options = {}) {
  const spec = dvzGetResponsiveTimeTickSpec(domain, axisSize);
  const orientation = options.orientation || 'bottom';
  const factories = {
    top: d3.axisTop,
    right: d3.axisRight,
    left: d3.axisLeft,
    bottom: d3.axisBottom,
  };
  const axisFactory = factories[orientation] || d3.axisBottom;
  const axis = axisFactory(scale)
    .ticks(spec.interval)
    .tickFormat(spec.formatter)
    .tickSizeOuter(0);
  axis.__dvzTimeSpec = spec;
  return axis;
}

// Truncate an SVG <text> node's contents with an ellipsis so that it
// fits within `maxWidth` pixels. Uses getComputedTextLength() and a
// binary search, which handles mixed CJK / ASCII widths correctly.
// Returns true if truncation occurred, false otherwise.
function dvzTruncateTextNode(node, maxWidth) {
  if (!node || typeof node.getComputedTextLength !== 'function') return false;
  if (node.getComputedTextLength() <= maxWidth) return false;
  const full = node.textContent;
  let lo = 0;
  let hi = full.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    node.textContent = full.slice(0, mid) + '…';
    if (node.getComputedTextLength() <= maxWidth) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  node.textContent = full.slice(0, Math.max(1, lo)) + '…';
  return true;
}

function dvzAxisLabelsOverlap(nodes, axis = 'bottom') {
  const labels = (nodes || []).filter((node) => node && String(node.textContent || '').trim() !== '');
  if (labels.length < 2) return false;
  for (let index = 1; index < labels.length; index += 1) {
    const prev = labels[index - 1].getBoundingClientRect();
    const curr = labels[index].getBoundingClientRect();
    if (axis === 'left' || axis === 'right') {
      if (curr.top < prev.bottom - 1) return true;
      continue;
    }
    if (curr.left < prev.right - 1) return true;
  }
  return false;
}

function dvzPostProcessAxisLabels(axisG, options = {}) {
  if (!axisG) return;
  const selection = typeof axisG.selectAll === 'function' ? axisG : d3.select(axisG);
  const labels = selection.selectAll('.tick text').nodes();
  if (!labels.length) return;

  const axis = options.axis || 'bottom';
  const labelType = options.labelType || 'number';
  const maxWidthRatio = Number.isFinite(options.maxWidthRatio) ? options.maxWidthRatio : 0.9;
  const slotWidth = Number.isFinite(options.slotWidth) && options.slotWidth > 0 ? options.slotWidth : null;
  const maxWidth = slotWidth ? Math.max(12, slotWidth * maxWidthRatio) : null;
  const defaultAnchor = options.defaultTextAnchor || ((axis === 'left' || axis === 'right') ? 'end' : 'middle');
  const defaultDx = Object.prototype.hasOwnProperty.call(options, 'defaultDx') ? options.defaultDx : null;
  const defaultDy = Object.prototype.hasOwnProperty.call(options, 'defaultDy') ? options.defaultDy : null;

  labels.forEach((node) => {
    const fullLabel = node.getAttribute('data-dvz-full-label') || node.textContent || '';
    node.setAttribute('data-dvz-full-label', fullLabel);
    node.textContent = fullLabel;
    node.removeAttribute('transform');
    if (defaultDx === null) node.removeAttribute('dx');
    else node.setAttribute('dx', defaultDx);
    if (defaultDy === null) node.removeAttribute('dy');
    else node.setAttribute('dy', defaultDy);
    node.style.textAnchor = defaultAnchor;

    if (labelType === 'string' && maxWidth) {
      const truncated = dvzTruncateTextNode(node, maxWidth);
      if (truncated) dvzSetSvgTitle(node, fullLabel);
    }
  });

  if (axis !== 'bottom' || options.rotateOnOverlap === false || !dvzAxisLabelsOverlap(labels, axis)) return;

  labels.forEach((node) => {
    const fullLabel = node.getAttribute('data-dvz-full-label') || node.textContent || '';
    node.textContent = fullLabel;
    if (labelType === 'string' && maxWidth) {
      const truncated = dvzTruncateTextNode(node, maxWidth);
      if (truncated) dvzSetSvgTitle(node, fullLabel);
    }
    node.setAttribute('transform', 'rotate(-40)');
    node.setAttribute('dx', '-0.45em');
    node.setAttribute('dy', '0.55em');
    node.style.textAnchor = 'end';
  });
}

// ----------------------------------------------------------
// Utility: save / restore form state
// ----------------------------------------------------------
function dvzSaveFormState(formId) {
  const container = document.getElementById(formId);
  if (!container) return {};
  const state = {};
  container.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.id) state[el.id] = el.type === 'checkbox' ? el.checked : el.value;
  });
  return state;
}

function dvzRestoreFormState(formId, state) {
  if (!state) return;
  const container = document.getElementById(formId);
  if (!container) return;
  for (const [id, val] of Object.entries(state)) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.type === 'checkbox') el.checked = val;
    else el.value = val;
  }
}

// ----------------------------------------------------------
// i18n
// ----------------------------------------------------------
const DVZ_LANG = navigator.language.startsWith('ja') ? 'ja' : 'en';
let DVZ_I18N = {
  ja: {
    // Tabs
    tabData: 'データ', tabMapping: 'マッピング', tabStyle: 'スタイル', tabAnnotate: '注釈', tabExport: '出力',
    // Upload
    upload: 'アップロード', dropHere: 'CSV / JSON をドロップ', orClick: 'またはクリックして選択',
    // Annotate
    annotateTitle: 'タイトル', annotateTitlePlaceholder: 'チャートタイトル',
    annotateSource: '出典', annotateSourcePlaceholder: 'データソース名',
    annotateSourceUrl: '出典URL', annotateLegend: '凡例',
    legendNone: 'なし', legendTopRight: '右上', legendBottomRight: '右下',
    apply: '適用',
    // Export
    exportImage: '画像', exportData: 'データ', embedHeading: '埋め込み', embedCopy: 'コピー', embedCopied: 'コピーしました!',
    embedIframeHeading: 'iframe埋め込みコード', embedCopyIframe: 'iframeをコピー', embedUnavailable: '先にシェアしてください',
    shareHeading: 'シェア',
    // Share modal
    shareModalHeading: 'シェアURL',
    shareModalDesc: '以下のURLを共有すると、誰でも閲覧できます。再シェア時も同じURLが維持されます。OGP画像の反映には少し時間がかかる場合があります。',
    shareCopyUrl: 'URLをコピー', shareClose: '閉じる',
    shareCopied: 'コピーしました!',
    shareSuccess: 'シェアURLを保存しました', shareNoData: 'データがありません', shareFailed: 'シェアに失敗: ',
    shareRequiresSavedProject: 'シェアする前にプロジェクトを保存してください',
    processingGeneric: '処理中です',
    processingProjectList: 'プロジェクト一覧を読み込み中です',
    processingProjectLoad: 'プロジェクトを読み込み中です',
    processingProjectSave: 'プロジェクトを保存中です',
    processingSavePrep: '保存準備中です',
    processingShare: 'シェアを作成中です',
    processingFile: 'ファイルを読み込み中です',
    processingSample: 'サンプルデータを読み込み中です',
    processingExport: '書き出し中です',
    // Data panel
    loadedData: '読込済みデータ', dataSourceSample: 'サンプル', dataSourceUpload: 'アップロード',
    noDataLoaded: 'データ未読込',
    dataPreviewTitle: 'データプレビュー（先頭5行）',
    dataPreviewEmpty: 'プレビューできるデータがありません',
    metaRows: '行', metaCols: '列', metaColumns: 'カラム',
  },
  en: {
    tabData: 'Data', tabMapping: 'Mapping', tabStyle: 'Style', tabAnnotate: 'Annotate', tabExport: 'Export',
    upload: 'Upload', dropHere: 'Drop CSV / JSON here', orClick: 'or click to select',
    annotateTitle: 'Title', annotateTitlePlaceholder: 'Chart title',
    annotateSource: 'Source', annotateSourcePlaceholder: 'Data source name',
    annotateSourceUrl: 'Source URL', annotateLegend: 'Legend',
    legendNone: 'None', legendTopRight: 'Top Right', legendBottomRight: 'Bottom Right',
    apply: 'Apply',
    exportImage: 'Image', exportData: 'Data', embedHeading: 'Embed', embedCopy: 'Copy', embedCopied: 'Copied!',
    embedIframeHeading: 'Iframe Embed Code', embedCopyIframe: 'Copy iframe', embedUnavailable: 'Share first',
    shareHeading: 'Share',
    shareModalHeading: 'Share URL',
    shareModalDesc: 'Anyone with this URL can view it. Re-sharing keeps the same URL. OGP image updates may take a short time to appear.',
    shareCopyUrl: 'Copy URL', shareClose: 'Close',
    shareCopied: 'Copied!',
    shareSuccess: 'Share URL saved', shareNoData: 'No data loaded', shareFailed: 'Share failed: ',
    shareRequiresSavedProject: 'Save the project before sharing.',
    processingGeneric: 'Processing...',
    processingProjectList: 'Loading project list...',
    processingProjectLoad: 'Loading project...',
    processingProjectSave: 'Saving project...',
    processingSavePrep: 'Preparing save...',
    processingShare: 'Creating share...',
    processingFile: 'Reading file...',
    processingSample: 'Loading sample data...',
    processingExport: 'Exporting...',
    // Data panel
    dataSource: 'Data Source', sampleData: 'Sample Data', loadSample: 'Load Sample',
    loadedData: 'Loaded Data', dataSourceSample: 'Sample', dataSourceUpload: 'Upload',
    noDataLoaded: 'No data loaded',
    dataPreviewTitle: 'Data Preview (First 5 Rows)',
    dataPreviewEmpty: 'No previewable data',
    metaRows: 'rows', metaCols: 'cols', metaColumns: 'Columns',
  },
};

function dvzSetI18n(dict) {
  DVZ_I18N = dict;
}

function t(key) {
  return (DVZ_I18N[DVZ_LANG] && DVZ_I18N[DVZ_LANG][key]) || key;
}

function dvzApplyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = text;
    } else {
      el.textContent = text;
    }
  });
}

// ----------------------------------------------------------
// Sidebar tab controller
// ----------------------------------------------------------
function initSidebarTabs(defaultTabId = 'tab-data') {
  const tabs = document.querySelectorAll('.sidebar-tab');
  const panels = document.querySelectorAll('.sidebar-panel');
  const select = document.getElementById('sidebar-tab-select');

  function activate(tabId) {
    tabs.forEach(t => {
      const active = t.dataset.tab === tabId;
      t.classList.toggle('border-indigo-500', active);
      t.classList.toggle('text-indigo-600', active);
      t.classList.toggle('border-transparent', !active);
      t.classList.toggle('text-gray-500', !active);
    });
    panels.forEach(p => {
      p.classList.toggle('hidden', p.id !== tabId);
    });
    if (select) select.value = tabId;
  }

  tabs.forEach(t => {
    t.onclick = () => activate(t.dataset.tab);
  });
  if (select) {
    select.onchange = () => activate(select.value);
  }

  const initialTabId = Array.from(panels).some(p => p.id === defaultTabId)
    ? defaultTabId
    : (panels[0]?.id || 'tab-data');
  activate(initialTabId);
}

// ----------------------------------------------------------
// Supabase client (shared across all tools)
// ----------------------------------------------------------
const DVZ_SUPABASE_URL = 'https://vebhoeiltxspsurqoxvl.supabase.co';
const DVZ_SUPABASE_ANON_KEY = 'sb_publishable_sAjwbAhC0jnIRjNa34QuTA_CcksMYQG';

let _dvzShareSupabase = null;

function dvzGetShareSupabase() {
  if (!_dvzShareSupabase && window.supabase) {
    _dvzShareSupabase = window.supabase.createClient(DVZ_SUPABASE_URL, DVZ_SUPABASE_ANON_KEY);
  }
  return _dvzShareSupabase;
}

function dvzNormalizeSavedProjectMeta(meta) {
  const project = meta?.project && typeof meta.project === 'object' ? meta.project : null;
  return {
    id: meta?.id || project?.id || null,
    name: meta?.name || project?.name || null,
  };
}

async function dvzGetDatavizAccessToken() {
  const sb = window.datavizSupabase;
  if (!sb || !sb.auth) return null;
  const { data } = await sb.auth.getSession();
  return data?.session?.access_token || null;
}

async function dvzPublishShareFromProject(options = {}) {
  const projectId = String(options.projectId || '').trim();
  if (!projectId) {
    throw new Error(t('shareRequiresSavedProject') || 'Save the project before sharing.');
  }

  const accessToken = await dvzGetDatavizAccessToken();
  if (!accessToken) {
    throw new Error('Login required');
  }

  const response = await fetch(`${DVZ_SUPABASE_URL}/functions/v1/publish-interactive-chart-builder-share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dataviz-Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      projectId,
      fallbackTitle: String(options.fallbackTitle || '').trim() || null,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `Share publish failed (${response.status})`);
  }
  return payload || {};
}

async function dvzFindShareByProjectId(table, projectId) {
  const normalizedProjectId = String(projectId || '').trim();
  if (!normalizedProjectId) return null;

  const sb = dvzGetShareSupabase();
  if (!sb) throw new Error('Supabase not loaded');

  const { data, error } = await sb
    .from(table)
    .select('id, title, source_project_id')
    .eq('source_project_id', normalizedProjectId)
    .limit(1);

  if (error) {
    const detail = [
      error?.message || '',
      error?.details || '',
      error?.hint || '',
    ].join(' ').toLowerCase();
    if (detail.includes('source_project_id')) {
      throw new Error('interactive_chart_builder_shares.source_project_id is required. Run the 20260429 share migration.');
    }
    throw error;
  }

  return Array.isArray(data) && data.length ? data[0] : null;
}

// ----------------------------------------------------------
// Modal utilities
// ----------------------------------------------------------
function dvzShowModal(id) {
  document.getElementById(id)?.classList.add('active');
}

function dvzHideModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

function dvzShowToast(msg, type) {
  const th = document.querySelector('dataviz-tool-header');
  if (th && th.showMessage) th.showMessage(msg, type || 'success');
}

function dvzShowProcessingToast(msg, duration = 5000) {
  const th = document.querySelector('dataviz-tool-header');
  if (th && typeof th.showMessage === 'function') {
    th.showMessage(msg || t('processingGeneric'), 'info', duration);
  }
}

function dvzInstallHeaderProcessingToasts(header, messages = {}) {
  if (!header || header.__dvzNativeProjectProcessingToasts === '1' || header.__dvzProcessingToastsInstalled === '1') return;
  const defaults = {
    projectList: t('processingProjectList'),
    projectLoad: t('processingProjectLoad'),
    projectSave: t('processingProjectSave'),
  };
  const text = { ...defaults, ...messages };

  if (typeof header.showLoadModal === 'function') {
    const originalShowLoadModal = header.showLoadModal.bind(header);
    header.showLoadModal = function (...args) {
      dvzShowProcessingToast(text.projectList);
      return originalShowLoadModal(...args);
    };
  }

  if (typeof header.loadProject === 'function') {
    const originalLoadProject = header.loadProject.bind(header);
    header.loadProject = function (...args) {
      dvzShowProcessingToast(text.projectLoad);
      return originalLoadProject(...args);
    };
  }

  if (typeof header.saveProject === 'function') {
    const originalSaveProject = header.saveProject.bind(header);
    header.saveProject = function (...args) {
      dvzShowProcessingToast(text.projectSave);
      return originalSaveProject(...args);
    };
  }

  header.__dvzProcessingToastsInstalled = '1';
}

function dvzInitShareModal() {
  const closeBtn = document.getElementById('dvz-share-close');
  const copyBtn = document.getElementById('dvz-share-copy');

  if (closeBtn) closeBtn.addEventListener('click', () => dvzHideModal('dvz-share-modal'));
  if (copyBtn) copyBtn.addEventListener('click', () => {
    const url = document.getElementById('dvz-share-url')?.value;
    if (url) navigator.clipboard.writeText(url);
  });
}

// ----------------------------------------------------------
// File upload + drag-and-drop + parse
// ----------------------------------------------------------
function dvzInitFileUpload(onFileLoaded) {
  const dropzone = document.getElementById('dvz-dropzone');
  const fileInput = document.getElementById('dvz-file-input');
  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) dvzHandleFile(fileInput.files[0], onFileLoaded);
  });

  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) dvzHandleFile(file, onFileLoaded);
  });
}

function dvzHandleFile(file, onFileLoaded) {
  dvzShowProcessingToast(t('processingFile'));
  const reader = new FileReader();
  reader.onload = () => {
    const text = reader.result;
    let parsed;
    if (file.name.endsWith('.json')) {
      parsed = { type: 'json', data: JSON.parse(text), raw: text };
    } else {
      parsed = { type: 'csv', data: d3.csvParse(text), raw: text };
    }
    parsed.filename = file.name;
    if (onFileLoaded) onFileLoaded(parsed);
  };
  reader.readAsText(file);
}

// ----------------------------------------------------------
// DvzApp — Base class for all dataviz.jp tools
// Subclasses override _getLegendItems() and tool-specific methods
// ----------------------------------------------------------
class DvzApp {
  /**
   * @param {Object} config - Tool-specific configuration
   * @param {string} config.appName    - Tool identifier (e.g. 'venn-euler-diagram')
   * @param {string} config.title      - Display title  (e.g. 'Venn / Euler Diagram')
   * @param {string} config.gaId       - Google Analytics measurement ID
   * @param {string} config.exportName - Base filename for exports (e.g. 'venn-diagram')
   * @param {string} config.shareTable - Supabase table for shares (e.g. 'venn_euler_shares')
   * @param {string} [config.sampleToolId] - Optional sample picker tool id override
   * @param {string} [config.chartKey] - Optional chart key for qualified sample matching
   */
  constructor(config = {}) {
    this.config = {
      appName:    config.appName    || 'dvz-tool',
      title:      config.title      || '',
      gaId:       config.gaId       || '',
      exportName: config.exportName || 'chart',
      shareTable: config.shareTable || '',
      sampleToolId: config.sampleToolId || config.appName || 'dvz-tool',
      chartKey: config.chartKey || null,
    };
    this._dataSource = null; // 'sample' | 'upload'
    this._dataName = null;
    this.container = null;
    this.wrapper = null;
    this.dimensions = {};
    this._currentProjectId = null;
    this._currentProjectName = null;
    this._hasLoadedProject = false;
    this.__dvzProjectLoadStarted = false;
    this._legendResizeObserver = null;
    this._legendResizeTarget = null;
    this._responsiveResize = null;
    this._legendRelayout = dvzDebounce(() => this._renderLegend(), 120);
    window.addEventListener('resize', this._legendRelayout);

    // Auto-init infrastructure
    dvzInitGA(this.config.gaId);
    dvzApplyI18n();
    this._setupDataExport();
  }

  // ----------------------------------------------------------
  // Annotate
  // ----------------------------------------------------------
  _setupAnnotate() {
    document.getElementById('annotate-apply-btn').addEventListener('click', () => {
      this._applyAnnotation();
    });
  }

  _hasProjectRouteParam() {
    const params = new URLSearchParams(location.search);
    return !!(params.get('projectId') || params.get('project_id'));
  }

  _shouldSkipAutoSampleLoad() {
    return this._hasProjectRouteParam() || !!this._hasLoadedProject || !!this.__dvzProjectLoadStarted;
  }

  _normalizeSourceUrl(rawUrl) {
    const value = String(rawUrl || '').trim();
    if (!value) return '';
    if (/\s/.test(value)) return '';

    const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value);
    let withScheme = value;
    if (!hasScheme) {
      const bare = value.replace(/^\/\//, '');
      const host = bare.split(/[/?#]/, 1)[0] || '';
      const looksLikeDomain = host.includes('.');
      const isLocalhost = /^localhost(?::\d+)?$/i.test(host);
      const isIPv4 = /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?$/.test(host);
      const isIPv6 = /^\[[0-9a-fA-F:]+\](?::\d+)?$/.test(host);
      if (!(looksLikeDomain || isLocalhost || isIPv4 || isIPv6)) return '';
      withScheme = `https://${bare}`;
    }

    try {
      const parsed = new URL(withScheme);
      if (!['http:', 'https:'].includes(parsed.protocol)) return '';
      if (!parsed.hostname) return '';
      return parsed.href;
    } catch (_) {
      return '';
    }
  }

  _applyAnnotation() {
    const title = document.getElementById('annotate-title').value.trim();
    const source = document.getElementById('annotate-source').value.trim();
    const sourceUrlInput = document.getElementById('annotate-source-url');
    const rawUrl = sourceUrlInput.value.trim();
    const normalizedUrl = this._normalizeSourceUrl(rawUrl);

    const titleEl = document.getElementById('chart-title');
    const sourceEl = document.getElementById('chart-source');

    titleEl.textContent = title;
    sourceEl.textContent = '';

    if (rawUrl && normalizedUrl) {
      sourceUrlInput.value = normalizedUrl;
    }

    if (source && normalizedUrl) {
      sourceEl.append('Source: ');
      const link = document.createElement('a');
      link.href = normalizedUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      link.className = 'underline hover:text-gray-600';
      link.textContent = source;
      sourceEl.appendChild(link);
    } else if (source) {
      sourceEl.textContent = `Source: ${source}`;
    }
  }

  // ----------------------------------------------------------
  // Legend
  // Subclass should override _getLegendItems() to return
  // [{ name: string, color: string }, ...]
  // ----------------------------------------------------------
  _setupLegend() {
    document.getElementById('legend-position').addEventListener('change', () => {
      this._renderLegend();
    });
  }

  _getLegendItems() {
    return [];
  }

  _getLegendContainer() {
    return document.getElementById('chart-container')
      || document.getElementById('chartBlock')
      || document.getElementById('chart-area')
      || null;
  }

  _ensureLegendResizeObserver() {
    if (typeof ResizeObserver === 'undefined') return;
    const target = this._getLegendContainer();
    if (!target) return;
    if (this._legendResizeObserver && this._legendResizeTarget === target) return;
    if (this._legendResizeObserver) this._legendResizeObserver.disconnect();
    this._legendResizeTarget = target;
    this._legendResizeObserver = new ResizeObserver(() => this._legendRelayout());
    this._legendResizeObserver.observe(target);
  }

  _removeLegacyLegendNodes() {
    const container = this._getLegendContainer();
    const wrapper = document.getElementById('wrapper');
    const targets = [container, wrapper].filter(Boolean);
    targets.forEach((root) => {
      root.querySelectorAll('.legend-group, .legendblock').forEach((node) => node.remove());
    });
  }

  _layoutSvgLegend(svg, legendG, position) {
    const svgNode = svg.node();
    if (!svgNode) return;
    const vb = svg.attr('viewBox')?.trim().split(/\s+/).map(Number);
    const viewW = (vb && vb.length === 4 && Number.isFinite(vb[2])) ? vb[2] : (svgNode.clientWidth || 800);
    const viewH = (vb && vb.length === 4 && Number.isFinite(vb[3])) ? vb[3] : (svgNode.clientHeight || 600);
    const bbox = legendG.node()?.getBBox();
    if (!bbox) return;

    const pad = 12;
    const availableW = Math.max(40, viewW - pad * 2);
    const scale = bbox.width > availableW ? Math.max(0.6, availableW / bbox.width) : 1;

    let tx = viewW - pad - (bbox.x + bbox.width) * scale;
    const minTx = pad - bbox.x * scale;
    if (tx < minTx) tx = minTx;

    let ty;
    if (position === 'bottom-right') {
      ty = viewH - pad - (bbox.y + bbox.height) * scale;
    } else {
      ty = pad - bbox.y * scale;
    }
    const minTy = pad - bbox.y * scale;
    if (ty < minTy) ty = minTy;

    legendG.attr('transform', scale === 1
      ? `translate(${tx}, ${ty})`
      : `translate(${tx}, ${ty}) scale(${scale})`);
  }

  _layoutDomLegend(domLegend, container, position) {
    const pad = 12;
    const cRect = container.getBoundingClientRect();
    const wrapperEl = container.querySelector('#wrapper') || container.querySelector('svg');
    let anchor = {
      x: 0,
      y: 0,
      width: container.clientWidth || 0,
      height: container.clientHeight || 0,
    };
    if (wrapperEl) {
      const wRect = wrapperEl.getBoundingClientRect();
      if (wRect.width > 0 && wRect.height > 0) {
        anchor = {
          x: Math.max(0, wRect.left - cRect.left),
          y: Math.max(0, wRect.top - cRect.top),
          width: wRect.width,
          height: wRect.height,
        };
      }
    }

    const availableW = Math.max(80, anchor.width - pad * 2);
    const naturalW = Math.ceil(domLegend.scrollWidth || 0);
    const overflow = naturalW > availableW;
    const effectiveW = overflow ? availableW : naturalW;

    domLegend.style.position = 'absolute';
    const left = Math.max(
      pad,
      Math.min(
        (container.clientWidth || 0) - effectiveW - pad,
        anchor.x + anchor.width - effectiveW - pad
      )
    );
    const top = position === 'bottom-right'
      ? Math.max(pad, anchor.y + anchor.height - (domLegend.offsetHeight || 0) - pad)
      : Math.max(pad, anchor.y + pad);

    domLegend.style.left = `${left}px`;
    domLegend.style.right = 'auto';
    domLegend.style.top = `${top}px`;
    domLegend.style.bottom = 'auto';
    domLegend.style.maxWidth = overflow ? `${availableW}px` : 'none';

    domLegend.querySelectorAll('.dvz-legend-label').forEach((el) => {
      el.style.whiteSpace = overflow ? 'normal' : 'nowrap';
      el.style.wordBreak = overflow ? 'break-word' : 'normal';
    });
  }

  _resolveResponsiveResizeTarget() {
    return document.getElementById('chart-container')
      || document.getElementById('chartBlock')
      || this._getLegendContainer()
      || null;
  }

  _bindResponsiveResize(onResize, options = {}) {
    if (typeof onResize !== 'function') return;
    this._unbindResponsiveResize();

    const debounceMs = Number.isFinite(options.debounceMs) ? options.debounceMs : 140;
    const minDeltaPx = Number.isFinite(options.minDeltaPx) ? options.minDeltaPx : 1;
    const triggerInitial = options.triggerInitial !== false;

    let prevWidth = null;
    let prevHeight = null;

    const measureAndInvoke = () => {
      const target = this._resolveResponsiveResizeTarget();
      if (!target) return;

      const rect = target.getBoundingClientRect ? target.getBoundingClientRect() : null;
      const width = Math.round(target.clientWidth || rect?.width || 0);
      const height = Math.round(target.clientHeight || rect?.height || 0);
      if (width <= 0 && height <= 0) return;

      const changed = prevWidth === null
        || Math.abs(width - prevWidth) >= minDeltaPx
        || Math.abs(height - prevHeight) >= minDeltaPx;
      if (!changed) return;

      const initial = prevWidth === null;
      prevWidth = width;
      prevHeight = height;

      onResize({ width, height, target, initial });
    };

    const debounced = dvzDebounce(measureAndInvoke, debounceMs);
    const onWindowResize = () => debounced();
    window.addEventListener('resize', onWindowResize);

    const observeTarget = this._resolveResponsiveResizeTarget();
    let observer = null;
    if (typeof ResizeObserver !== 'undefined' && observeTarget) {
      observer = new ResizeObserver(() => debounced());
      observer.observe(observeTarget);
    }

    this._responsiveResize = {
      observer,
      onWindowResize,
    };

    if (triggerInitial) {
      measureAndInvoke();
    }
  }

  _unbindResponsiveResize() {
    if (!this._responsiveResize) return;
    if (this._responsiveResize.observer) {
      this._responsiveResize.observer.disconnect();
    }
    if (this._responsiveResize.onWindowResize) {
      window.removeEventListener('resize', this._responsiveResize.onWindowResize);
    }
    this._responsiveResize = null;
  }

  _destroyTemplateInfrastructure() {
    this._unbindResponsiveResize();

    if (this._legendResizeObserver) {
      this._legendResizeObserver.disconnect();
      this._legendResizeObserver = null;
      this._legendResizeTarget = null;
    }

    if (this._legendRelayout) {
      window.removeEventListener('resize', this._legendRelayout);
    }

    document.getElementById('dvz-legend')?.remove();
    const wrapper = document.getElementById('wrapper');
    if (wrapper) {
      wrapper.querySelector('#legend')?.remove();
      wrapper.querySelectorAll('.legend-group, .legendblock').forEach((node) => node.remove());
    }
  }

  _renderLegend() {
    const position = document.getElementById('legend-position')?.value || 'none';
    const items = this._getLegendItems();
    this._ensureLegendResizeObserver();
    this._removeLegacyLegendNodes();

    // Clear existing legends
    const svg = d3.select('#wrapper');
    let legendG = null;
    if (!svg.empty()) {
      legendG = svg.select('#legend');
      if (legendG.empty()) {
        legendG = svg.append('g').attr('id', 'legend');
      }
    }
    if (legendG && !legendG.empty()) {
      legendG.selectAll('*').remove();
      legendG.attr('transform', null);
    }
    // Remove any existing DOM legend
    document.getElementById('dvz-legend')?.remove();

    if (position === 'none' || !items.length) return;

    // SVG legend: if <g id="legend"> exists inside #wrapper
    if (legendG && !legendG.empty()) {
      const itemH = 18;
      const swatchSize = 10;

      items.forEach((s, i) => {
        const row = legendG.append('g')
          .attr('transform', `translate(0, ${i * itemH})`);
        row.append('rect')
          .attr('width', swatchSize)
          .attr('height', swatchSize)
          .attr('rx', 2)
          .attr('fill', s.color);
        row.append('text')
          .attr('x', swatchSize + 6)
          .attr('y', swatchSize / 2)
          .attr('dominant-baseline', 'central')
          .attr('font-size', '11px')
          .attr('fill', '#555')
          .text(s.name);
      });
      this._layoutSvgLegend(svg, legendG, position);
      return;
    }

    // DOM legend: dynamically created inside chart container
    const container = this._getLegendContainer();
    if (container) {
      const domLegend = document.createElement('div');
      domLegend.id = 'dvz-legend';
      domLegend.className = position;
      items.forEach(s => {
        const item = document.createElement('div');
        item.className = 'dvz-legend-item';
        const swatch = document.createElement('span');
        swatch.className = 'dvz-legend-swatch';
        swatch.style.background = s.color;
        const label = document.createElement('span');
        label.className = 'dvz-legend-label';
        label.textContent = s.name;
        item.appendChild(swatch);
        item.appendChild(label);
        domLegend.appendChild(item);
      });
      container.appendChild(domLegend);
      this._layoutDomLegend(domLegend, container, position);
    }
  }

  // ----------------------------------------------------------
  // SVG serialization for export
  // ----------------------------------------------------------
  _getSvgExportDimensions(svgEl) {
    const rect = svgEl?.getBoundingClientRect?.() || { width: 0, height: 0 };
    let width = rect.width || parseFloat(svgEl?.getAttribute?.('width')) || 0;
    let height = rect.height || parseFloat(svgEl?.getAttribute?.('height')) || 0;

    if ((!width || !height) && svgEl?.hasAttribute?.('viewBox')) {
      const parts = svgEl.getAttribute('viewBox').trim().split(/\s+/).map(Number);
      if (parts.length === 4) {
        width = parts[2];
        height = parts[3];
      }
    }

    return {
      width: Math.max(1, Math.round(width || 800)),
      height: Math.max(1, Math.round(height || 600)),
    };
  }

  _serializeSVG(svgEl, { includeXmlDeclaration = true } = {}) {
    const clone = svgEl.cloneNode(true);
    const { width, height } = this._getSvgExportDimensions(svgEl);
    const viewBox = svgEl.getAttribute('viewBox');

    clone.setAttribute('width', width);
    clone.setAttribute('height', height);
    if (!viewBox) clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    this._inlineStyles(svgEl, clone);

    const style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.textContent = ''
      + '.dvz-outlined-text-stroke{fill:none;stroke:#ffffff;stroke-linejoin:round;pointer-events:none;}'
      + '.dvz-outlined-text-fill{stroke:none;pointer-events:none;}';
    clone.insertBefore(style, clone.firstChild);

    const serializer = new XMLSerializer();
    const svgMarkup = serializer.serializeToString(clone);
    return {
      width,
      height,
      svgString: includeXmlDeclaration ? `<?xml version="1.0" encoding="UTF-8"?>${svgMarkup}` : svgMarkup,
    };
  }

  // ----------------------------------------------------------
  // Export SVG
  // ----------------------------------------------------------
  _exportSVG(filename) {
    filename = filename || `${this.config.exportName}.svg`;
    const svgEl = d3.select('#wrapper').node();
    if (!svgEl) return;
    dvzShowProcessingToast(t('processingExport'));

    const { svgString } = this._serializeSVG(svgEl);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ----------------------------------------------------------
  // Export PNG
  // ----------------------------------------------------------
  async _exportPNG(filename) {
    filename = filename || `${this.config.exportName}.png`;
    const svgEl = d3.select('#wrapper').node();
    if (!svgEl) return;
    dvzShowProcessingToast(t('processingExport'));

    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch (_error) {
        // Continue with currently available fonts.
      }
    }

    const { svgString, width, height } = this._serializeSVG(svgEl);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      }, 'image/png');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  // ----------------------------------------------------------
  // Export CSV
  // Subclass should override _getExportData() to return
  // { columns: [string], rows: [[value, ...]] }
  // ----------------------------------------------------------
  _serializeCSVCell(value) {
    const text = value == null ? '' : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  _exportCSV(filename) {
    filename = filename || `${this.config.exportName}.csv`;
    const data = this._getExportData();
    if (!data) return;
    dvzShowProcessingToast(t('processingExport'));
    const lines = [data.columns.map(v => this._serializeCSVCell(v)).join(',')];
    for (const row of data.rows) {
      lines.push(row.map(v => this._serializeCSVCell(v)).join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ----------------------------------------------------------
  // Export JSON
  // ----------------------------------------------------------
  _exportJSON(filename) {
    filename = filename || `${this.config.exportName}.json`;
    const data = this._getExportData();
    if (!data) return;
    dvzShowProcessingToast(t('processingExport'));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  _setupDataExport() {
    const csvBtn = document.getElementById('export-csv-btn');
    if (csvBtn) csvBtn.onclick = () => this._exportCSV();

    const jsonBtn = document.getElementById('export-json-btn');
    if (jsonBtn) jsonBtn.onclick = () => this._exportJSON();
  }

  _getExportData() {
    const rows = Array.isArray(this.rawData)
      ? this.rawData
      : (Array.isArray(this.rawRows) ? this.rawRows : null);
    if (!rows || rows.length === 0) return null;

    const firstRow = rows[0];
    if (!firstRow || typeof firstRow !== 'object') return null;

    const columns = (Array.isArray(rows.columns) && rows.columns.length)
      ? [...rows.columns]
      : Object.keys(firstRow);
    if (!columns.length) return null;

    return {
      columns,
      rows: rows.map((row) => columns.map((key) => row[key] ?? '')),
    };
  }

  // ----------------------------------------------------------
  // Style inlining for export
  // ----------------------------------------------------------
  _inlineStyles(srcEl, cloneEl) {
    const computed = window.getComputedStyle(srcEl);
    const props = [
      'fill', 'stroke', 'stroke-width', 'stroke-dasharray',
      'stroke-linecap', 'stroke-linejoin', 'opacity',
      'fill-opacity', 'stroke-opacity', 'font-family',
      'font-size', 'font-weight', 'text-anchor', 'display',
      'visibility', 'dominant-baseline', 'text-decoration',
      'pointer-events', 'paint-order', 'stroke-miterlimit',
    ];
    for (const prop of props) {
      const val = computed.getPropertyValue(prop);
      if (val) cloneEl.style.setProperty(prop, val);
    }
    for (let i = 0; i < srcEl.children.length; i++) {
      if (cloneEl.children[i]) {
        this._inlineStyles(srcEl.children[i], cloneEl.children[i]);
      }
    }
  }

  // ----------------------------------------------------------
  // Project save/load (via dataviz-tool-header)
  // Uses this.config.appName for tool identification.
  // Subclass should override:
  //   _getProjectData()      → object to serialize
  //   _loadProjectData(data) → restore state from saved data
  // ----------------------------------------------------------
  _setupProject() {
    const header = document.querySelector('dataviz-tool-header');
    if (!header || !header.setProjectConfig) return;
    dvzInstallHeaderProcessingToasts(header);

    header.setProjectConfig({
      appName: this.config.appName,
      onProjectLoad: (data) => this._loadProjectData(data),
      onProjectSave: (meta) => {
        const normalizedMeta = dvzNormalizeSavedProjectMeta(meta);
        this._currentProjectId = normalizedMeta.id;
        this._currentProjectName = normalizedMeta.name;
      },
    });

    // Auto-load from URL param
    const params = new URLSearchParams(location.search);
    const projectId = params.get('projectId') || params.get('project_id');
    if (projectId && header.loadProject) {
      header.loadProject(projectId);
    }
  }

  _getProjectData() { return null; }
  _loadProjectData(_data) {}

  // ----------------------------------------------------------
  // Sample data (via header event, ?data_url= param, or catalog auto-load)
  // Subclass should override:
  //   _onSampleDataLoaded(url, format, name) → fetch & load
  // ----------------------------------------------------------
  _setupSampleData() {
    const header = document.querySelector('dataviz-tool-header');

    if (header) {
      // Enable sample data button on toolbar
      if (header.setSampleConfig) {
        header.setSampleConfig({
          toolId: this.config.sampleToolId,
          chartKey: this.config.chartKey,
          onSampleSelect: async (detail) => {
            const { url, format, name } = detail || {};
            if (url) await this._safeLoadSampleData(url, format, name);
          },
        });
      }

      // Fallback: listen for event (older header versions)
      header.addEventListener('sample-data-selected', (e) => {
        const { url, format, name } = e.detail || {};
        if (url) void this._safeLoadSampleData(url, format, name);
      });
    }

    // ?data_url= parameter (portal → tool flow)
    const dataUrl = new URLSearchParams(location.search).get('data_url');
    if (dataUrl) {
      const format = dvzNormalizeSampleFormat('', dataUrl);
      if (!this._hasProjectRouteParam()) {
        void this._safeLoadSampleData(dataUrl, format, null, { fallbackOnError: true, background: true });
      }
    } else if (!this._hasProjectRouteParam()) {
      // Auto-load first compatible sample from catalog (unless loading a project)
      this._autoLoadFromCatalog();
    }
  }

  async _autoLoadFromCatalog() {
    if (this._shouldSkipAutoSampleLoad()) return;

    try {
      const catalogUrl = (window.datavizAuthUrl || 'https://app.dataviz.jp') + '/catalog.json';
      const res = await fetch(catalogUrl);
      if (this._shouldSkipAutoSampleLoad()) return;
      if (!res.ok) { this._onCatalogEmpty(); return; }
      const catalog = await res.json();
      if (this._shouldSkipAutoSampleLoad()) return;
      const entries = dvzResolveCatalogEntriesForTool(
        catalog.entries || [],
        this.config.sampleToolId,
        this.config.chartKey
      );
      if (entries.length === 0) { this._onCatalogEmpty(); return; }
      const selected = entries[Math.floor(Math.random() * entries.length)];
      const url = (DVZ_LANG === 'ja' ? selected.fileUrl : (selected.fileUrlEn || selected.fileUrl));
      const name = (DVZ_LANG === 'ja' ? selected.name : (selected.nameEn || selected.name));
      if (this._shouldSkipAutoSampleLoad()) return;
      if (url) await this._safeLoadSampleData(url, selected.format || 'csv', name, { fallbackOnError: true, background: true });
      else this._onCatalogEmpty();
    } catch (_) {
      this._onCatalogEmpty();
    }
  }

  async _safeLoadSampleData(url, format, name, options = {}) {
    const fallbackOnError = !!options.fallbackOnError;
    if (options.background && this._shouldSkipAutoSampleLoad()) return false;
    if (!options.background) dvzShowProcessingToast(t('processingSample'));
    try {
      await Promise.resolve(this._onSampleDataLoaded(url, format, name, options));
      return true;
    } catch (err) {
      console.error(`[${this.config.appName}] sample load failed:`, err);
      if (fallbackOnError) {
        try {
          this._onCatalogEmpty();
        } catch (fallbackErr) {
          console.error(`[${this.config.appName}] fallback load failed:`, fallbackErr);
        }
      }
      return false;
    }
  }

  /** Override in subclass: fallback when catalog has no compatible entries */
  _onCatalogEmpty() {}

  _onSampleDataLoaded(_url, _format, _name) {}

  // ----------------------------------------------------------
  // End-user controls area (#dvz-controls)
  // Public, share-safe controls belong here. Author-only UI belongs in
  // #dvz-sidebar. Do not expose the same setting in both places.
  // Standard helper: inject tool controls with common row wrapper.
  // ----------------------------------------------------------
  _setControlsMarkup(markup, rowClass = 'dvz-controls-row') {
    const controls = document.getElementById('dvz-controls');
    if (!controls) return null;

    controls.innerHTML = '';
    const row = document.createElement('div');
    if (rowClass) row.className = rowClass;
    row.innerHTML = markup || '';
    controls.appendChild(row);
    return row;
  }

  // ----------------------------------------------------------
  // Data Panel (standardized Data tab UI)
  // Generates: Data Source section + Loaded Data metadata section
  // Subclass can override:
  //   _onLoadSampleClick()       → button型サンプル読込
  //   _onSampleSelected(value)   → dropdown型サンプル選択
  // ----------------------------------------------------------
  _setupDataPanel() {
    const scrollContainer = document.querySelector('#tab-data .overflow-y-auto')
      || document.querySelector('#tab-data');
    if (!scrollContainer || document.getElementById('dvz-data-source')) return;

    // Collect existing tool-specific sections (skip upload/sample elements)
    const toolSections = [];
    [...scrollContainer.children].forEach(el => {
      const hasUpload = el.querySelector('#dvz-dropzone, #dvz-file-input, #load-sample, #sample-select');
      const isUploadSection = el.id === 'dvz-dropzone' || (el.querySelector?.('[data-i18n="upload"]') && hasUpload);
      if (hasUpload || isUploadSection) {
        el.remove();
      } else {
        toolSections.push(el);
      }
    });

    // Remove collected tool sections from container temporarily
    toolSections.forEach(el => el.remove());

    // Build and insert standard sections
    const sourceSection = this._buildDataSourceSection();
    const metaSection = this._buildDataMetaSection();
    const previewSection = this._buildDataPreviewSection();

    scrollContainer.appendChild(sourceSection);
    scrollContainer.appendChild(metaSection);
    scrollContainer.appendChild(previewSection);

    // Re-append tool-specific sections
    toolSections.forEach(el => scrollContainer.appendChild(el));

    // Wire events
    this._wireDataPanelEvents();
  }

  _buildDataSourceSection() {
    const section = document.createElement('section');
    section.id = 'dvz-data-source';
    section.className = 'border-b border-gray-100 px-5 py-4';

    const heading = document.createElement('h3');
    heading.className = 'mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-400';
    heading.textContent = t('upload');
    section.appendChild(heading);

    // Upload dropzone
    const dropzone = document.createElement('div');
    dropzone.id = 'dvz-dropzone';
    dropzone.className = 'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-400 transition hover:border-gray-400 hover:text-gray-500';
    dropzone.innerHTML = `<svg class="mb-2 h-8 w-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg><span>${t('dropHere')}</span><span class="mt-1 text-xs">${t('orClick')}</span>`;
    section.appendChild(dropzone);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'dvz-file-input';
    fileInput.accept = '.csv,.tsv,.txt,.json';
    fileInput.className = 'hidden';
    section.appendChild(fileInput);

    return section;
  }

  _buildDataMetaSection() {
    const section = document.createElement('section');
    section.id = 'dvz-data-meta';
    section.className = 'border-b border-gray-100 px-5 py-4';

    const heading = document.createElement('h3');
    heading.className = 'mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400';
    heading.textContent = t('loadedData');
    section.appendChild(heading);

    const content = document.createElement('div');
    content.id = 'dvz-meta-content';
    content.className = 'text-sm text-gray-500';
    content.innerHTML = `<span class="text-gray-400">${t('noDataLoaded')}</span>`;
    section.appendChild(content);

    return section;
  }

  _buildDataPreviewSection() {
    const section = document.createElement('section');
    section.id = 'dvz-data-preview';
    section.className = 'border-b border-gray-100 px-5 py-4';

    const heading = document.createElement('h3');
    heading.id = 'dvz-data-preview-heading';
    heading.className = 'mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400';
    heading.textContent = t('dataPreviewTitle');
    section.appendChild(heading);

    const content = document.createElement('div');
    content.id = 'dvz-data-preview-content';
    content.className = 'text-sm text-gray-500';
    content.innerHTML = `<span class="text-gray-400">${t('dataPreviewEmpty')}</span>`;
    section.appendChild(content);

    return section;
  }

  /**
   * Update the metadata section after data is loaded.
   * @param {Object} info
   * @param {'sample'|'upload'} info.source
   * @param {string} info.name - dataset name or filename
   * @param {number} info.rowCount
   * @param {string[]} info.columns
   * @param {Array<Object>} [info.previewRows]
   * @param {string[]} [info.previewColumns]
   * @param {number} [info.previewLimit=5]
   */
  _updateDataMeta(info) {
    this._dataSource = info.source;
    this._dataName = info.name;

    const container = document.getElementById('dvz-meta-content');
    if (!container) return;

    const badgeColor = info.source === 'sample'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-green-100 text-green-700';
    const badgeText = info.source === 'sample' ? t('dataSourceSample') : t('dataSourceUpload');

    const colsPreview = (info.columns || []).slice(0, 5).join(', ');
    const colsMore = (info.columns || []).length > 5 ? ` +${info.columns.length - 5}` : '';

    const header = document.createElement('div');
    header.className = 'flex items-center gap-2 mb-1';

    const badge = document.createElement('span');
    badge.className = `inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeColor}`;
    badge.textContent = badgeText;
    header.appendChild(badge);

    const name = document.createElement('span');
    name.className = 'truncate font-medium text-gray-700';
    name.textContent = info.name || '';
    header.appendChild(name);

    const summary = document.createElement('div');
    summary.className = 'text-xs text-gray-400';
    summary.textContent =
      `${info.rowCount != null ? `${Number(info.rowCount).toLocaleString()} ${t('metaRows')}` : ''}` +
      `${info.columns ? ` / ${info.columns.length} ${t('metaCols')}` : ''}`;

    const nodes = [header, summary];
    if (info.columns) {
      const columns = document.createElement('div');
      columns.className = 'mt-1 text-xs text-gray-400 truncate';
      columns.title = (info.columns || []).join(', ');
      columns.textContent = `${t('metaColumns')}: ${colsPreview}${colsMore}`;
      nodes.push(columns);
    }

    container.replaceChildren(...nodes);

    this._updateDataPreview(info);
  }

  _resolvePreviewColumns(info, rows) {
    if (Array.isArray(info.previewColumns) && info.previewColumns.length) return info.previewColumns;
    if (Array.isArray(info.columns) && info.columns.length) return info.columns;
    if (rows.length && rows[0] && typeof rows[0] === 'object') return Object.keys(rows[0]);
    return [];
  }

  _normalizePreviewCell(value) {
    if (value == null) return '';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (_) {
        return String(value);
      }
    }
    return String(value);
  }

  _updateDataPreview(info = {}) {
    if (!Array.isArray(info.previewRows) && !Array.isArray(info.previewColumns)) return;

    const content = document.getElementById('dvz-data-preview-content');
    const heading = document.getElementById('dvz-data-preview-heading');
    if (heading) heading.textContent = t('dataPreviewTitle');
    if (!content) return;

    const rows = Array.isArray(info.previewRows) ? info.previewRows : [];
    const columns = this._resolvePreviewColumns(info, rows);
    const limit = Number.isFinite(info.previewLimit) ? Math.max(1, Math.floor(info.previewLimit)) : 5;

    content.innerHTML = '';

    if (!rows.length || !columns.length) {
      const empty = document.createElement('p');
      empty.className = 'text-xs text-gray-400';
      empty.textContent = t('dataPreviewEmpty');
      content.appendChild(empty);
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'overflow-x-auto rounded border border-gray-200';

    const table = document.createElement('table');
    table.className = 'min-w-max w-full border-collapse text-xs text-gray-600';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    columns.forEach((col) => {
      const th = document.createElement('th');
      th.className = 'bg-gray-50 px-2 py-1 text-left font-semibold text-gray-500 border-b border-gray-200 border-r border-gray-100';
      th.textContent = String(col);
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.slice(0, limit).forEach((row) => {
      const tr = document.createElement('tr');
      columns.forEach((col, idx) => {
        const td = document.createElement('td');
        td.className = 'px-2 py-1 border-b border-gray-100 border-r border-gray-100';
        let rawValue = '';
        if (Array.isArray(row)) rawValue = row[idx];
        else if (row && typeof row === 'object') rawValue = row[col];
        else rawValue = row;
        td.textContent = this._normalizePreviewCell(rawValue);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrapper.appendChild(table);
    content.appendChild(wrapper);
  }

  _wireDataPanelEvents() {
    // File upload: subclass init() calls dvzInitFileUpload() after _setupDataPanel(),
    // which wires #dvz-dropzone and #dvz-file-input events.
  }

  // ----------------------------------------------------------
  // Share
  // Flow: Annotateタブのタイトル取得 → Supabase保存 → URL生成 → モーダル表示
  // Uses config.shareTable for the Supabase table name.
  // Subclass can override _getShareUrl(shareId) for tool-specific public routes.
  // ----------------------------------------------------------
  async shareProject() {
    const titleInput = document.getElementById('annotate-title');
    const title = (typeof titleInput?.value === 'string') ? titleInput.value.trim() : (this.config.title || '');
    const config = this._getProjectData();
    if (!config) {
      dvzShowToast(t('shareNoData') || 'No data', 'error');
      return;
    }

    if (config && typeof config === 'object') {
      config.annotateTitle = title;
      if (config.settings && typeof config.settings === 'object') {
        config.settings.annotateTitle = title;
      }
    }

    try {
      dvzShowProcessingToast(t('processingShare'));
      const result = await this._shareToSupabase(title, config);
      if (!result?.id) throw new Error('No share ID returned');

      const shareUrl = this._getShareUrl(result.id);
      dvzShowToast(t('shareSuccess') || 'Published', 'success');

      document.getElementById('dvz-share-url').value = shareUrl;
      dvzShowModal('dvz-share-modal');
    } catch (err) {
      dvzShowToast((t('shareFailed') || 'Share failed: ') + err.message, 'error');
    }
  }

  async _shareToSupabase(title, chartConfig, options = {}) {
    const projectId = String(options.projectId || this._currentProjectId || '').trim();
    const result = await dvzPublishShareFromProject({
      projectId,
      fallbackTitle: title,
      chartConfig,
    });
    return {
      id: result?.shareId || result?.id || null,
    };
  }

  _getShareUrl(shareId) {
    const url = new URL('share.html', location.href);
    url.searchParams.set('id', shareId);
    return url.toString();
  }

  async saveProject() {
    const header = document.querySelector('dataviz-tool-header');
    if (!header || !header.showSaveModal) return;

    dvzInstallHeaderProcessingToasts(header);
    dvzShowProcessingToast(t('processingSavePrep'));
    const thumbnail = await this._generateThumbnail();
    header.showSaveModal({
      name: this._currentProjectName || '',
      data: this._getProjectData(),
      thumbnailDataUri: thumbnail,
      existingProjectId: this._currentProjectId || null,
    });
  }

  // ----------------------------------------------------------
  // Thumbnail generation
  // ----------------------------------------------------------
  async _generateThumbnail() {
    const svgEl = d3.select('#wrapper').node();
    if (!svgEl) return null;

    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch (_error) {
        // Continue with currently available fonts.
      }
    }

    const { svgString, width, height } = this._serializeSVG(svgEl);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  // ----------------------------------------------------------
  // Embed support
  // ----------------------------------------------------------
  _setupEmbed() {
    const IS_EMBED = new URLSearchParams(location.search).get('embed') === '1';
    if (!IS_EMBED) return;

    document.documentElement.classList.add('dvz-embed');

    const postHeight = () => {
      window.parent.postMessage(
        { type: 'dvz-resize', height: document.documentElement.scrollHeight },
        '*'
      );
    };
    new ResizeObserver(postHeight).observe(document.body);
    window.addEventListener('load', postHeight);

    document.querySelectorAll('a[href]').forEach(a => {
      if (!a.href.startsWith('javascript:')) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
    });
  }

  _setupEmbedCopy() {
    const input = document.getElementById('embed-url');
    const btn = document.getElementById('embed-copy-btn');
    if (!input || !btn) return;

    const url = new URL(location.href);
    url.searchParams.set('embed', '1');
    input.value = url.toString();

    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(input.value);
      btn.textContent = t('embedCopied');
      setTimeout(() => { btn.textContent = t('embedCopy'); }, 1500);
    });
  }
}
