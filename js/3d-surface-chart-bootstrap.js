// ============================================================
// 3D Surface Chart - Bootstrap
// ============================================================

(function () {
  'use strict';

  window.__DVZ_DISABLE_MODULE_HEADER = true;
  window.__DVZ_DISABLE_MODULE_ROUTING = true;

  const runtime = new window.DVZBuilderRuntime.BuilderRuntime({
    appName: '3d-surface-chart',
    title: '3D Surface Chart',
    publicShareOrigin: 'https://3d-surface-chart.dataviz.jp',
    defaultChartId: '3d-surface-chart',
    headerEnabled: new URLSearchParams(location.search).get('embed') !== '1',
  });

  const isEmbedMode = new URLSearchParams(location.search).get('embed') === '1';

  function getAuthHeaderBottom() {
    const authHeader = document.querySelector('dataviz-header');
    const bottom = Math.round(authHeader?.getBoundingClientRect?.().bottom || 0);
    return bottom || (isEmbedMode ? 0 : 48);
  }

  function isToolHeaderVisible(header) {
    if (!header || header.hidden) return false;
    const style = window.getComputedStyle?.(header);
    return style?.display !== 'none';
  }

  function getShellOffsetBottom() {
    const header = document.querySelector('dataviz-tool-header');
    if (isEmbedMode) return 0;
    if (isToolHeaderVisible(header)) {
      const toolHeaderBottom = Math.round(header.getBoundingClientRect().bottom || 0);
      if (toolHeaderBottom > 0) return toolHeaderBottom;
    }
    return getAuthHeaderBottom();
  }

  function adjustAppOffset() {
    const app = document.querySelector('.dvz-app');
    if (!app) return;
    const bottom = getShellOffsetBottom();
    const viewportHeight = Math.round(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 0);
    app.style.top = `${bottom}px`;
    if (viewportHeight > bottom) {
      app.style.height = `${viewportHeight - bottom}px`;
    }
  }

  function setToolHeaderVisible(visible) {
    const header = document.querySelector('dataviz-tool-header');
    if (header) header.hidden = !visible;
    document.body.dataset.dvzToolHeader = visible ? 'visible' : 'hidden';
    requestAnimationFrame(adjustAppOffset);
  }

  function mountEditorShell() {
    if (window.DVZEditorShell && typeof window.DVZEditorShell.mount === 'function') {
      window.DVZEditorShell.mount({
        appSelector: '.dvz-app',
        headerSelector: 'dataviz-tool-header',
      });
    }

    adjustAppOffset();
    requestAnimationFrame(adjustAppOffset);

    const resizeTargets = new Set();
    const observeResize = (observer, target) => {
      if (!target || resizeTargets.has(target)) return;
      resizeTargets.add(target);
      observer.observe(target);
    };

    let resizeObserver = null;
    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(adjustAppOffset);
      observeResize(resizeObserver, document.querySelector('dataviz-header'));
      observeResize(resizeObserver, document.querySelector('dataviz-tool-header'));
      observeResize(resizeObserver, document.body);
    }

    if (typeof MutationObserver === 'function') {
      const headerObserver = new MutationObserver(() => requestAnimationFrame(adjustAppOffset));
      const observedHeaders = new Set();
      const observeHeader = (header) => {
        if (!header || observedHeaders.has(header)) return;
        observedHeaders.add(header);
        headerObserver.observe(header, {
          attributes: true,
          attributeFilter: ['hidden', 'style', 'class'],
        });
        if (resizeObserver) observeResize(resizeObserver, header);
      };

      observeHeader(document.querySelector('dataviz-header'));
      observeHeader(document.querySelector('dataviz-tool-header'));

      const shellObserver = new MutationObserver(() => {
        observeHeader(document.querySelector('dataviz-header'));
        observeHeader(document.querySelector('dataviz-tool-header'));
        requestAnimationFrame(adjustAppOffset);
      });
      shellObserver.observe(document.body, {
        childList: true,
      });
    }

    window.addEventListener('resize', adjustAppOffset);
    window.visualViewport?.addEventListener('resize', adjustAppOffset);
  }

  window.DVZToolHeaderVisibility = {
    setVisible: setToolHeaderVisible,
    adjust: adjustAppOffset,
  };

  document.addEventListener('DOMContentLoaded', () => {
    const initialRoute = window.DVZBuilderRouting?.parseIndexRoute?.(location.search);
    setToolHeaderVisible(Boolean(initialRoute?.ok && !isEmbedMode));
    mountEditorShell();

    runtime.init().catch((err) => {
      console.error('Builder initialization failed:', err);
      dvzShowToast(err.message || String(err), 'error');
    });
  });
})();
