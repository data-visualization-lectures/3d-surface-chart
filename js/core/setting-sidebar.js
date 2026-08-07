// ============================================================
// 3D Surface Chart - Shared setting sidebar adapter
// ============================================================

(function () {
  'use strict';

  let controller = null;

  function mount(defaultTabId = 'tab-data') {
    const root = document.getElementById('dvz-sidebar');
    if (!root || typeof window.DVZSettingSidebar?.mount !== 'function') return false;

    try {
      controller?.destroy?.();
      controller = window.DVZSettingSidebar.mount({
        root,
        defaultTabId,
        tabListLabel: 'Chart settings',
        activeClassNames: ['border-indigo-500', 'text-indigo-600'],
        inactiveClassNames: ['border-transparent', 'text-gray-500'],
        hiddenClassName: 'hidden',
      });
      return true;
    } catch (error) {
      controller = null;
      console.error('[3d-surface-chart] shared setting sidebar mount failed:', error);
      return false;
    }
  }

  function getController() {
    return controller;
  }

  window.DVZSurfaceChartSettingSidebar = Object.freeze({
    getController,
    mount,
  });
})();
