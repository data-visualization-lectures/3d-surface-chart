// ============================================================
// 3D Surface Chart - Share Page Runtime
// ============================================================

(function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────
  const SUPABASE_URL = 'https://vebhoeiltxspsurqoxvl.supabase.co';
  const SUPABASE_ANON_KEY = DVZ_SUPABASE_ANON_KEY; // from dvz-common.js
  const SHARE_TABLE = 'surface_3d_shares';
  const TIMEOUT_MS = 30000;
  const SHARE_FETCH_TIMEOUT_MS = 8000;
  const CLIENT_FETCH_TIMEOUT_MS = 10000;
  const ASSET_REV = '';

  const shareShell = window.DVZShareShell;
  if (!shareShell) throw new Error('DVZShareShell is required');

  const LANG = shareShell.resolveLang();
  const parsedRoute = shareShell.parseShareRoute({ lang: LANG });
  const IS_EMBED = !!parsedRoute.ok && !!parsedRoute.embed;
  shareShell.initEmbedMode(IS_EMBED);
  shareShell.patchDvzAppForShare();

  const { loadScript, loadCSS, withAssetRev } = shareShell.createAssetLoader({
    assetRev: ASSET_REV,
  });
  const fetchShareData = shareShell.createShareDataFetcher({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    shareTable: SHARE_TABLE,
    restTimeoutMs: SHARE_FETCH_TIMEOUT_MS,
    clientTimeoutMs: CLIENT_FETCH_TIMEOUT_MS,
    logPrefix: '[3d-surface-chart share]',
  });
  const { showLoading, showError, showContent } = shareShell.createUi({
    lang: LANG,
    contentDisplay: 'flex',
  });

  function pickAnnotationValue(...values) {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) return value;
    }
    for (const value of values) {
      if (typeof value === 'string') return value;
    }
    return null;
  }

  function ensureShareSidebarProxy(meta) {
    shareShell.ensureSidebarProxy({
      meta,
      panels: [
        { id: 'tab-data', metaKey: 'sidebarDataHTML', wrapperClass: 'overflow-y-auto' },
        { id: 'tab-mapping', metaKey: 'sidebarMappingHTML' },
      ],
    });
  }

  function ensureLegendPositionProxy(config) {
    const allowed = new Set(['none', 'top-right', 'bottom-right']);
    const candidate = [
      config?.legendPosition,
      config?.settings?.legendPosition,
      config?.annotateLegendPosition,
    ].find((value) => allowed.has(value));
    const legendPosition = candidate || 'top-right';

    let select = document.getElementById('legend-position');
    if (!select) {
      const proxy = document.getElementById('dvz-share-sidebar-proxy') || document.body;
      select = document.createElement('select');
      select.id = 'legend-position';
      select.style.display = 'none';
      select.setAttribute('aria-hidden', 'true');
      proxy.appendChild(select);
    }

    if (!select.querySelector('option[value="none"]')) {
      const opt = document.createElement('option');
      opt.value = 'none';
      opt.textContent = 'none';
      select.appendChild(opt);
    }
    if (!select.querySelector('option[value="top-right"]')) {
      const opt = document.createElement('option');
      opt.value = 'top-right';
      opt.textContent = 'top-right';
      select.appendChild(opt);
    }
    if (!select.querySelector('option[value="bottom-right"]')) {
      const opt = document.createElement('option');
      opt.value = 'bottom-right';
      opt.textContent = 'bottom-right';
      select.appendChild(opt);
    }

    select.value = legendPosition;
  }

  function normalizeExternalUrl(value) {
    if (!value) return null;
    try {
      const url = new URL(String(value), window.location.href);
      return (url.protocol === 'https:' || url.protocol === 'http:') ? url.href : null;
    } catch (_error) {
      return null;
    }
  }

  function renderSource(sourceEl, config) {
    const source = String(pickAnnotationValue(config?.annotateSource, config?.settings?.annotateSource) || '').trim();
    if (!source) return;

    const prefix = LANG === 'ja' ? '出典: ' : 'Source: ';
    const sourceUrl = normalizeExternalUrl(
      pickAnnotationValue(config?.annotateSourceUrl, config?.settings?.annotateSourceUrl)
    );
    sourceEl.textContent = '';
    sourceEl.appendChild(document.createTextNode(prefix));

    if (!sourceUrl) {
      sourceEl.appendChild(document.createTextNode(source));
      return;
    }

    const link = document.createElement('a');
    link.href = sourceUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    link.style.color = '#888';
    link.style.textDecoration = 'underline';
    link.textContent = source;
    sourceEl.appendChild(link);
  }

  // ── Main ────────────────────────────────────────────────
  async function main() {
    if (!parsedRoute.ok) {
      showError(parsedRoute.message || (LANG === 'ja' ? 'URLが不正です' : 'Invalid URL'));
      return;
    }

    const shareId = parsedRoute.shareId;
    showLoading();

    let loadStage = 'init';
    const stageLabel = () => {
      if (loadStage === 'share-fetch') return LANG === 'ja' ? 'シェアデータ取得' : 'share fetch';
      if (loadStage === 'module-load') return LANG === 'ja' ? 'モジュール読込' : 'module load';
      if (loadStage === 'chart-init') return LANG === 'ja' ? 'チャート初期化' : 'chart init';
      return LANG === 'ja' ? '初期化' : 'initialization';
    };

    const timeoutId = setTimeout(() => {
      showError(LANG === 'ja'
        ? `読み込みがタイムアウトしました（${stageLabel()}）。ページを再読み込みしてください。`
        : `Loading timed out during ${stageLabel()}. Please reload the page.`);
    }, TIMEOUT_MS);

    try {
      loadStage = 'share-fetch';
      const share = await fetchShareData(shareId);
      if (!share) throw new Error(LANG === 'ja' ? 'シェアデータが見つかりません' : 'Shared chart not found');

      const config = shareShell.normalizeSharedConfig(share.chart_config);
      if (!config || !config.chartType) {
        throw new Error(LANG === 'ja' ? 'チャートデータが不正です' : 'Invalid chart data');
      }

      const chartType = config.chartType;
      const entry = CHART_REGISTRY.find((chart) => chart.id === chartType);
      if (!entry) throw new Error(LANG === 'ja' ? '不明なチャートタイプです' : 'Unknown chart type');

      const annotateTitle = pickAnnotationValue(config?.annotateTitle, config?.settings?.annotateTitle);
      const hasStoredTitle = typeof share.title === 'string';
      let pageTitleText;
      if (annotateTitle !== null) {
        pageTitleText = annotateTitle;
      } else if (hasStoredTitle) {
        pageTitleText = share.title;
      } else {
        pageTitleText = entry.name[LANG] || 'Chart';
      }
      const docTitleText = (pageTitleText && pageTitleText.trim())
        ? pageTitleText
        : '3D Surface Chart';
      document.title = docTitleText;
      document.getElementById('chart-title').textContent = pageTitleText;
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', docTitleText);
      document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', docTitleText);

      const sourceEl = document.getElementById('chart-source');
      if (sourceEl) renderSource(sourceEl, config);

      const ogImageUrl = `${SUPABASE_URL}/storage/v1/object/public/surface-3d-og-images/${shareId}.png`;
      document.querySelector('meta[property="og:image"]')?.setAttribute('content', ogImageUrl);
      document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', ogImageUrl);

      for (const dep of entry.externalDeps || []) {
        if (dep.type === 'script') await loadScript(withAssetRev(dep.src));
        if (dep.type === 'css') loadCSS(withAssetRev(dep.href));
      }

      loadStage = 'module-load';
      if ((entry.templateType || 'svg') === 'webgl') {
        const url = new URL(withAssetRev(entry.modulePath), location.href).href;
        await import(url);
      } else {
        await loadScript(withAssetRev(entry.modulePath));
      }

      const mod = window.ChartModules && window.ChartModules[chartType];
      if (!mod) throw new Error('Chart module not found: ' + chartType);

      const adapterManager = new window.DVZRendererAdapters.AdapterManager({
        disableProjectSetup: true,
        disableEmbedCopy: true,
        skipSampleSetup: true,
      });
      const adapter = adapterManager.prepareModule(entry, mod);

      if (mod.META?.controlsHTML) {
        document.getElementById('dvz-controls').innerHTML = mod.META.controlsHTML;
      }

      const container = document.getElementById('chart-container');
      adapter.applyContainer(container, mod.META || {});

      ensureShareSidebarProxy(mod.META || {});
      ensureLegendPositionProxy(config);

      showContent();
      await shareShell.nextFrame();

      loadStage = 'chart-init';
      const instance = adapter.instantiate();
      await adapter.start(instance);

      if (instance._loadProjectData) {
        instance._loadProjectData(config);
      }

      clearTimeout(timeoutId);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Share load failed:', err);
      showError(err.message || (LANG === 'ja' ? '読み込みに失敗しました' : 'Failed to load chart'));
    }
  }

  main();
})();
