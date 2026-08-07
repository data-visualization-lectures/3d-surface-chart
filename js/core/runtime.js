// ============================================================
// Chart Builder - Main Runtime
// ============================================================

(function () {
  'use strict';

  const DEFAULT_CONFIG = {
    appName: '3d-surface-chart',
    title: '3D Surface Chart',
    publicShareOrigin: 'https://3d-surface-chart.dataviz.jp',
    assetRev: '',
    defaultChartId: '3d-surface-chart',
    headerEnabled: true,
  };

  function parseCompatibleToolToken(token) {
    const value = String(token || '').trim();
    const slashIndex = value.indexOf('/');
    if (slashIndex === -1) {
      return {
        baseTool: value,
        chartKey: null,
      };
    }

    return {
      baseTool: value.slice(0, slashIndex),
      chartKey: value.slice(slashIndex + 1) || null,
    };
  }

  function pickAnnotationValue(...values) {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) return value;
    }
    for (const value of values) {
      if (typeof value === 'string') return value;
    }
    return '';
  }

  class BuilderRuntime {
    constructor(config = {}) {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.lang = (navigator.language || '').startsWith('ja') ? 'ja' : 'en';

      this.state = {
        currentChartId: null,
        currentModule: null,
        currentInstance: null,
        currentProjectId: null,
        currentProjectName: null,
        lastSavedProjectSerialized: null,
      };

      this.loadedScripts = new Set();
      this.catalogEntries = null;
      this.headerSetupPromise = null;
      this.selectRequestId = 0;

      this.adapterManager = new window.DVZRendererAdapters.AdapterManager({
        disableProjectSetup: true,
        disableEmbedCopy: true,
        sampleMode: 'guarded',
      });

      this.shareService = new window.DVZBuilderShareService.BuilderShareService({
        publicShareOrigin: this.config.publicShareOrigin,
      });

      this.headerManager = new window.DVZBuilderHeaderManager.HeaderManager({
        enabled: this.config.headerEnabled !== false,
        appName: this.config.appName,
        logoText: this.config.title,
        getWrappedProjectData: () => this.getWrappedProjectData(),
        getCurrentProjectMeta: () => ({
          id: this.state.currentProjectId,
          name: this.state.currentProjectName,
        }),
        setCurrentProjectMeta: (meta) => {
          this.state.currentProjectId = meta?.id || null;
          this.state.currentProjectName = meta?.name || null;
          this.syncProjectMetaToInstance();
        },
        getCurrentInstance: () => this.state.currentInstance,
        generateThumbnail: () => this.generateThumbnailAsync(),
        onProjectLoad: (projectData, meta) => {
          this.handleProjectLoad(projectData, meta).then(() => {
            this.normalizeEditorUrl({ replace: true, preserveProjectId: true });
          }).catch((err) => {
            console.error('Project load failed:', err);
            dvzShowToast(err.message || String(err), 'error');
          });
        },
        onProjectMetaChange: (meta, reason) => {
          this.handleProjectMetaChange(meta, reason);
        },
        getShareTitle: () => this.shareService.getCurrentEmbedTitle(this.state.currentInstance),
        publishShare: ({ projectId, title }) => this.publishShare({ projectId, title }),
        afterPublish: ({ shareId, title }) => this.shareService.uploadOgImage(shareId, title, {
          currentChartId: this.state.currentChartId,
          currentInstance: this.state.currentInstance,
          getRegistryEntry: (id) => this.getRegistryEntry(id),
        }),
        onUnavailable: (reason) => {
          console.warn('[3d-surface-chart] tool header unavailable:', reason);
        },
      });
    }

    getRegistryEntry(id) {
      return CHART_REGISTRY.find((chart) => chart.id === id);
    }

    async getCatalogEntries() {
      if (this.catalogEntries) return this.catalogEntries;

      const catalogUrl = `${window.datavizAuthUrl || 'https://app.dataviz.jp'}/catalog.json`;
      const res = await fetch(catalogUrl);
      if (!res.ok) {
        throw new Error(`Failed to load catalog: ${res.status}`);
      }

      const catalog = await res.json();
      this.catalogEntries = catalog.entries || [];
      return this.catalogEntries;
    }

    findCatalogEntryForDataUrl(entries, dataUrl) {
      return (entries || []).find((entry) => {
        if (entry.fileUrl === dataUrl || entry.fileUrlEn === dataUrl) return true;

        return (entry.variants || []).some((variant) =>
          variant.fileUrl === dataUrl || variant.fileUrlEn === dataUrl
        );
      }) || null;
    }

    async resolveChartIdFromDataUrl(dataUrl) {
      if (!dataUrl) return null;

      const entries = await this.getCatalogEntries();
      const entry = this.findCatalogEntryForDataUrl(entries, dataUrl);
      if (!entry) return null;

      const token = (entry.compatibleTools || [])
        .map(parseCompatibleToolToken)
        .find((item) => item.baseTool === this.config.appName && item.chartKey);

      return token?.chartKey || null;
    }

    routeErrorContainer() {
      return document.getElementById('chart-area') || document.getElementById('dvz-chart');
    }

    clearRouteError() {
      document.getElementById('dvz-route-error')?.remove();
    }

    syncProjectMetaToInstance() {
      const instance = this.state.currentInstance;
      if (!instance) return;
      instance._currentProjectId = this.state.currentProjectId || null;
      instance._currentProjectName = this.state.currentProjectName || null;
    }

    cloneProjectData(value) {
      if (value == null) return value;
      if (typeof structuredClone === 'function') {
        return structuredClone(value);
      }
      return JSON.parse(JSON.stringify(value));
    }

    serializeProjectPayload(payload) {
      if (!payload) return null;
      try {
        return JSON.stringify(payload);
      } catch (_error) {
        return null;
      }
    }

    clearProjectSnapshot() {
      this.state.lastSavedProjectSerialized = null;
    }

    updateProjectSnapshot(payload) {
      this.state.lastSavedProjectSerialized = this.serializeProjectPayload(payload);
    }

    normalizeAnnotationSourceUrl(rawUrl) {
      const instance = this.state.currentInstance;
      if (instance && typeof instance._normalizeSourceUrl === 'function') {
        return instance._normalizeSourceUrl(rawUrl);
      }
      return String(rawUrl || '').trim();
    }

    collectAnnotationState() {
      const title = document.getElementById('annotate-title')?.value?.trim() || '';
      const source = document.getElementById('annotate-source')?.value?.trim() || '';
      const rawSourceUrl = document.getElementById('annotate-source-url')?.value?.trim() || '';
      const legendPosition = document.getElementById('legend-position')?.value || 'top-right';
      const normalizedSourceUrl = this.normalizeAnnotationSourceUrl(rawSourceUrl);

      return {
        title,
        source,
        sourceUrl: normalizedSourceUrl || rawSourceUrl,
        legendPosition,
      };
    }

    applyAnnotationStateToChartData(chartData) {
      if (!chartData || typeof chartData !== 'object') return chartData;

      const annotationState = this.collectAnnotationState();
      chartData.annotateTitle = annotationState.title;
      chartData.annotateSource = annotationState.source;
      chartData.annotateSourceUrl = annotationState.sourceUrl;
      chartData.legendPosition = annotationState.legendPosition;

      if (chartData.settings && typeof chartData.settings === 'object') {
        chartData.settings.annotateTitle = annotationState.title;
        chartData.settings.annotateSource = annotationState.source;
        chartData.settings.annotateSourceUrl = annotationState.sourceUrl;
        chartData.settings.legendPosition = annotationState.legendPosition;
      }

      return chartData;
    }

    restoreAnnotationStateFromChartData(chartData, fallbackData = {}) {
      const settings = chartData?.settings && typeof chartData.settings === 'object' ? chartData.settings : {};
      const fallbackSettings = fallbackData?.settings && typeof fallbackData.settings === 'object' ? fallbackData.settings : {};
      const title = pickAnnotationValue(
        chartData?.annotateTitle,
        settings.annotateTitle,
        fallbackData?.annotateTitle,
        fallbackSettings.annotateTitle
      );
      const source = pickAnnotationValue(
        chartData?.annotateSource,
        settings.annotateSource,
        fallbackData?.annotateSource,
        fallbackSettings.annotateSource
      );
      const sourceUrl = pickAnnotationValue(
        chartData?.annotateSourceUrl,
        settings.annotateSourceUrl,
        fallbackData?.annotateSourceUrl,
        fallbackSettings.annotateSourceUrl
      );
      const legendPosition = pickAnnotationValue(
        chartData?.legendPosition,
        settings.legendPosition,
        fallbackData?.legendPosition,
        fallbackSettings.legendPosition
      ) || null;

      const annotateTitle = document.getElementById('annotate-title');
      const annotateSource = document.getElementById('annotate-source');
      const annotateSourceUrl = document.getElementById('annotate-source-url');
      const legendPositionInput = document.getElementById('legend-position');

      if (annotateTitle) annotateTitle.value = title || '';
      if (annotateSource) annotateSource.value = source || '';
      if (annotateSourceUrl) annotateSourceUrl.value = sourceUrl || '';
      if (legendPositionInput && legendPosition) {
        legendPositionInput.value = legendPosition;
      }

      if (typeof this.state.currentInstance?._applyAnnotation === 'function') {
        this.state.currentInstance._applyAnnotation();
      }
      if (typeof this.state.currentInstance?._renderLegend === 'function') {
        this.state.currentInstance._renderLegend();
      }
    }

    hasUnsavedProjectChanges() {
      const currentPayload = this.getWrappedProjectData();
      if (!currentPayload) return false;

      const currentSerialized = this.serializeProjectPayload(currentPayload);
      if (!currentSerialized) return true;
      if (!this.state.currentProjectId) return true;

      return currentSerialized !== this.state.lastSavedProjectSerialized;
    }

    resolveProjectSaveName() {
      const instance = this.state.currentInstance;
      const stripExt = (value) => (typeof value === 'string' ? value.replace(/\.[^./\\]+$/, '').trim() : '');
      const dataName = stripExt(instance?._dataName);
      const fallbackName = instance?.config?.title;
      return this.state.currentProjectName || dataName || fallbackName || this.config.title;
    }

    normalizeLoadedProjectMeta(meta) {
      const project = meta?.project && typeof meta.project === 'object' ? meta.project : null;
      return {
        id: meta?.id || project?.id || meta?.projectId || null,
        name: meta?.name || project?.name || null,
      };
    }

    handleProjectMetaChange(meta, reason) {
      this.state.currentProjectId = meta?.id || null;
      this.state.currentProjectName = meta?.name || null;
      this.syncProjectMetaToInstance();

      if (reason === 'delete') {
        this.clearProjectSnapshot();
        return;
      }

      if (reason === 'save') {
        this.updateProjectSnapshot(this.getWrappedProjectData());
      }
    }

    showRouteError(message) {
      const container = this.routeErrorContainer();
      if (!container) return;

      this.clearRouteError();

      const el = document.createElement('div');
      el.id = 'dvz-route-error';
      el.className = 'mb-4 w-full max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700';
      el.textContent = message;

      container.prepend(el);
      this.setViewMode('chart');
      this.headerManager.showChartControls();
      dvzShowToast(message, 'error');
    }

    async loadScript(src) {
      const resolvedSrc = this.withAssetRev(src);
      if (this.loadedScripts.has(resolvedSrc)) return;

      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = resolvedSrc;
        script.onload = () => {
          this.loadedScripts.add(resolvedSrc);
          resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load ${resolvedSrc}`));
        document.body.appendChild(script);
      });
    }

    loadCSS(href) {
      const resolvedHref = this.withAssetRev(href);
      if (document.querySelector(`link[href="${resolvedHref}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = resolvedHref;
      document.head.appendChild(link);
    }

    withAssetRev(path) {
      if (!path) return path;
      if (/^(https?:)?\/\//i.test(path)) return path;
      const rev = this.config.assetRev;
      if (!rev) return path;
      return `${path}${path.includes('?') ? '&' : '?'}v=${encodeURIComponent(rev)}`;
    }

    setViewMode(mode) {
      const normalizedMode = 'chart';
      const app = document.querySelector('.dvz-app');
      const selector = document.getElementById('chart-selector');
      const chart = document.getElementById('dvz-chart');
      const sidebar = document.getElementById('dvz-sidebar');

      const showChart = normalizedMode === 'chart';
      if (app) app.dataset.dvzView = normalizedMode;

      [
        [selector, showChart],
        [chart, !showChart],
        [sidebar, !showChart],
      ].forEach(([el, hidden]) => {
        if (!el) return;
        el.hidden = hidden;
        el.setAttribute('aria-hidden', hidden ? 'true' : 'false');
        el.style.removeProperty('display');
      });
    }

    renderSelector() {
      const grid = document.getElementById('chart-selector-grid');
      if (!grid) return;

      grid.innerHTML = '';
    }

    injectSidebarContent(meta = {}) {
      const dataPanel = document.getElementById('tab-data');
      if (dataPanel) {
        const scrollArea = dataPanel.querySelector('.flex-1.overflow-y-auto');
        if (scrollArea) scrollArea.innerHTML = meta.sidebarDataHTML || '';
      }

      const mappingPanel = document.getElementById('tab-mapping');
      if (mappingPanel) {
        mappingPanel.innerHTML = meta.sidebarMappingHTML || '';
      }

      const stylePanel = document.getElementById('tab-style');
      if (stylePanel) {
        stylePanel.innerHTML = meta.sidebarStyleHTML || '';
      }
    }

    resetElementListeners(id) {
      const el = document.getElementById(id);
      if (!el || !el.parentNode) return;
      const clone = el.cloneNode(true);
      el.parentNode.replaceChild(clone, el);
    }

    teardownChart() {
      if (this.state.currentInstance) {
        this.state.currentInstance.__dvzProjectLoadStarted = true;
        this.adapterManager.destroyInstance(this.state.currentInstance);
      }

      const container = document.getElementById('chart-container');
      if (container) {
        container.innerHTML = '';
        container.className = 'w-full';
      }

      const controls = document.getElementById('dvz-controls');
      if (controls) controls.innerHTML = '';

      const title = document.getElementById('chart-title');
      if (title) title.textContent = '';

      const typeName = document.getElementById('chart-type-name');
      if (typeName) typeName.textContent = '';

      const source = document.getElementById('chart-source');
      if (source) source.textContent = '';

      const dataPanel = document.getElementById('tab-data');
      if (dataPanel) {
        const scrollArea = dataPanel.querySelector('.flex-1.overflow-y-auto');
        if (scrollArea) scrollArea.innerHTML = '';
      }

      const mappingPanel = document.getElementById('tab-mapping');
      if (mappingPanel) mappingPanel.innerHTML = '';

      const stylePanel = document.getElementById('tab-style');
      if (stylePanel) stylePanel.innerHTML = '';

      const annotateTitle = document.getElementById('annotate-title');
      if (annotateTitle) annotateTitle.value = '';

      const annotateSource = document.getElementById('annotate-source');
      if (annotateSource) annotateSource.value = '';

      const annotateSourceUrl = document.getElementById('annotate-source-url');
      if (annotateSourceUrl) annotateSourceUrl.value = '';

      [
        'export-svg-btn',
        'export-png-btn',
        'export-csv-btn',
        'export-json-btn',
        'annotate-apply-btn',
        'legend-position',
      ].forEach((id) => this.resetElementListeners(id));

      const bumpTooltip = document.getElementById('bump-tooltip');
      if (bumpTooltip) {
        bumpTooltip.className = 'bump-tooltip';
        bumpTooltip.innerHTML = '';
      }

      document.getElementById('dvz-legend')?.remove();

      this.state.currentInstance = null;
      this.state.currentModule = null;
    }

    async loadModule(entry) {
      const templateType = entry.templateType || 'svg';

      for (const dep of entry.externalDeps || []) {
        if (dep.type === 'script') await this.loadScript(dep.src);
        if (dep.type === 'css') this.loadCSS(dep.href);
      }

      if (templateType === 'webgl') {
        const url = new URL(this.withAssetRev(entry.modulePath), location.href).href;
        await import(url);
      } else {
        await this.loadScript(entry.modulePath);
      }

      const mod = window.ChartModules && window.ChartModules[entry.id];
      if (!mod) throw new Error(`Chart module not found: ${entry.id}`);
      return mod;
    }

    normalizeEditorUrl({ replace = true, preserveProjectId = true } = {}) {
      const params = new URLSearchParams(location.search);
      const before = params.toString();

      params.delete('chart');
      params.delete('project_id');
      if (!preserveProjectId) params.delete('projectId');

      const after = params.toString();
      if (after === before) return;

      const next = `${location.pathname}${after ? `?${after}` : ''}${location.hash}`;
      const state = { dvzRoute: 'chart', chartId: this.config.defaultChartId };
      if (replace) {
        history.replaceState(state, '', next);
      } else {
        history.pushState(state, '', next);
      }
    }

    syncUrlForChart(_chartId) {
      this.normalizeEditorUrl({ replace: true, preserveProjectId: true });
    }

    syncUrlForSelector({ replace = false } = {}) {
      this.normalizeEditorUrl({ replace, preserveProjectId: true });
    }

    async selectChart(chartId, { updateUrl = true } = {}) {
      const requestId = ++this.selectRequestId;
      const isCurrentRequest = () => requestId === this.selectRequestId;
      const entry = this.getRegistryEntry(chartId);
      if (!entry) {
        this.syncUrlForSelector({ replace: true });
        this.showRouteError(this.lang === 'ja' ? `不明なチャートIDです: ${chartId}` : `Unknown chart id: ${chartId}`);
        return;
      }

      this.clearRouteError();

      let mod;
      let adapter;
      try {
        mod = await this.loadModule(entry);
        adapter = this.adapterManager.prepareModule(entry, mod);
      } catch (err) {
        if (!isCurrentRequest()) return;
        console.error('Chart template load failed:', err);
        this.syncUrlForSelector({ replace: true });
        const chartTitle = entry?.name?.[this.lang] || entry?.name?.ja || entry?.name?.en || chartId;
        const detail = err?.message || String(err);
        this.showRouteError(
          this.lang === 'ja'
            ? `${chartTitle} のテンプレート読込に失敗しました: ${detail}`
            : `Failed to load ${chartTitle} template: ${detail}`
        );
        return;
      }

      if (!isCurrentRequest()) return;
      this.headerManager.showChartControls();

      if (this.state.currentInstance) {
        this.teardownChart();
      }

      if (updateUrl) this.syncUrlForChart(chartId);

      this.state.currentChartId = chartId;

      const chartTitle = entry?.name?.[this.lang] || entry?.name?.ja || entry?.name?.en || '';
      const typeNameEl = document.getElementById('chart-type-name');
      if (typeNameEl) typeNameEl.textContent = chartTitle;

      this.setViewMode('chart');

      const container = document.getElementById('chart-container');
      adapter.applyContainer(container, mod.META || {});

      const controls = document.getElementById('dvz-controls');
      if (controls) controls.innerHTML = mod.META?.controlsHTML || '';

      this.injectSidebarContent(mod.META || {});
      initSidebarTabs();

      const instance = adapter.instantiate();
      this.state.currentModule = mod;
      this.state.currentInstance = instance;
      this.syncProjectMetaToInstance();

      await adapter.start(instance);
      if (!isCurrentRequest() && this.state.currentInstance === instance) {
        this.adapterManager.destroyInstance(instance);
        this.state.currentInstance = null;
        this.state.currentModule = null;
      }
    }

    showSelector({ updateUrl = true } = {}) {
      this.headerManager.showChartControls();
      this.setViewMode('chart');
      if (updateUrl) this.syncUrlForSelector({ replace: true });

      if (!this.state.currentInstance && this.config.defaultChartId) {
        this.selectChart(this.config.defaultChartId, { updateUrl: false }).catch((err) => {
          console.error('default chart restore failed:', err);
          dvzShowToast(err.message || String(err), 'error');
        });
      }
    }

    getWrappedProjectData() {
      if (!this.state.currentInstance || !this.state.currentChartId) return null;
      const rawChartData = this.state.currentInstance._getProjectData?.();
      if (!rawChartData) return null;
      const chartData = this.applyAnnotationStateToChartData(this.cloneProjectData(rawChartData));

      return {
        version: 1,
        toolVersion: '3d-surface-chart-1.0',
        chartType: this.state.currentChartId,
        chartData,
      };
    }

    async handleProjectLoad(projectData, meta = null) {
      if (!projectData || !projectData.chartType) {
        this.showRouteError(this.lang === 'ja' ? 'プロジェクトデータ形式が不正です。' : 'Invalid project data format.');
        return;
      }

      if (meta?.isGroupProject) {
        this.state.currentProjectId = null;
        this.state.currentProjectName = null;
      } else {
        const nextMeta = this.normalizeLoadedProjectMeta(meta);
        if (nextMeta.id) this.state.currentProjectId = nextMeta.id;
        if (nextMeta.name) this.state.currentProjectName = nextMeta.name;
      }

      const { chartType, chartData } = projectData;
      if (chartType !== this.state.currentChartId) {
        await this.selectChart(chartType, { updateUrl: false });
      }

      this.syncProjectMetaToInstance();
      if (this.state.currentInstance) {
        this.state.currentInstance.__dvzProjectLoadStarted = true;
        this.state.currentInstance._hasLoadedProject = true;
      }
      this.state.currentInstance?._loadProjectData?.(chartData);
      this.restoreAnnotationStateFromChartData(chartData, projectData);
      this.updateProjectSnapshot(projectData);
    }

    async publishShare({ projectId, title }) {
      if (typeof dvzShowProcessingToast === 'function') {
        dvzShowProcessingToast(this.lang === 'ja' ? 'シェアを作成中です' : 'Creating share...');
      }
      const result = await this.shareService.publishSavedProject(projectId, {
        fallbackTitle: title,
      });
      const shareId = result?.id || null;
      if (!shareId) {
        throw new Error('No share ID returned');
      }

      return {
        shareId,
        shareUrl: this.shareService.buildPublicSharePageUrl(shareId),
        iframeCode: this.shareService.buildIframeEmbedCode(shareId, title),
      };
    }

    async generateThumbnailAsync() {
      const instance = this.state.currentInstance;
      if (!instance) return null;

      if (typeof instance._generateThumbnail === 'function') {
        return Promise.resolve(instance._generateThumbnail());
      }

      const entry = this.state.currentChartId && this.getRegistryEntry(this.state.currentChartId);
      const templateType = entry?.templateType || 'svg';

      if (templateType === 'webgl') {
        const canvas = document.querySelector('#chart-container canvas');
        if (!canvas) return null;
        try {
          return canvas.toDataURL('image/png');
        } catch (_error) {
          return null;
        }
      }

      const svgEl = document.querySelector('#wrapper');
      if (!svgEl) return null;

      try {
        const serialized = typeof instance._serializeSVG === 'function'
          ? instance._serializeSVG(svgEl)
          : (() => {
              const clone = svgEl.cloneNode(true);
              clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
              clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
              return { svgString: new XMLSerializer().serializeToString(clone) };
            })();
        const svgData = serialized.svgString;
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        return await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = Math.min(1, 400 / img.naturalWidth);
            canvas.width = Math.round(img.naturalWidth * scale);
            canvas.height = Math.round(img.naturalHeight * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
          };
          img.src = url;
        });
      } catch (_error) {
        return null;
      }
    }

    async loadProjectFromRoute(projectId) {
      try {
        const data = await this.headerManager.loadProject(projectId);
        if (!data) {
          this.showRouteError(this.lang === 'ja' ? 'プロジェクトが見つかりません。' : 'Project not found.');
          return;
        }
        await this.handleProjectLoad(data);
        this.normalizeEditorUrl({ replace: true, preserveProjectId: true });
      } catch (err) {
        console.error('Auto project load failed:', err);
        this.showRouteError(
          this.lang === 'ja'
            ? `プロジェクト読込に失敗しました: ${err.message}`
            : `Failed to load project: ${err.message}`
        );
      }
    }

    async applyRoute(route, { updateUrl = false } = {}) {
      if (!route.ok) {
        this.showRouteError(route.message);
        return;
      }

      if (route.mode === 'project') {
        await this.loadProjectFromRoute(route.projectId);
        return;
      }

      if (route.mode === 'chart') {
        await this.selectChart(route.chartId, { updateUrl });
        return;
      }

      await this.selectChart(this.config.defaultChartId, { updateUrl });
    }

    async init() {
      this.renderSelector();

      document.getElementById('chart-back-btn')?.addEventListener('click', () => this.showSelector());

      window.addEventListener('popstate', () => {
        const route = window.DVZBuilderRouting.parseIndexRoute(location.search);
        this.applyRoute(route, { updateUrl: false }).catch((err) => {
          console.error('popstate route apply failed:', err);
        });
      });

      const route = window.DVZBuilderRouting.parseIndexRoute(location.search);

      await this.applyRoute(route, { updateUrl: true });
      this.headerSetupPromise = this.headerManager.setup();
    }
  }

  window.DVZBuilderRuntime = {
    BuilderRuntime,
  };
})();
