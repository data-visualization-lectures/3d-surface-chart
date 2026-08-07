// ============================================================
// 3D Surface Chart - Routing Contracts
// ============================================================

(function () {
  'use strict';

  const DEFAULT_CHART_ID = '3d-surface-chart';

  function currentLang() {
    return (navigator.language || '').startsWith('ja') ? 'ja' : 'en';
  }

  function msg(key) {
    const lang = currentLang();
    const dict = {
      indexShareIdInEditor: {
        ja: '共有URLは `share.html?id=...` を使用してください。',
        en: 'Use `share.html?id=...` for shared chart URLs.',
      },
      unsupportedShareIdParam: {
        ja: '`shareId` URLパラメータは非対応です。`share.html?id=...` を使用してください。',
        en: 'The `shareId` URL parameter is not supported. Use `share.html?id=...` instead.',
      },
      shareMissingId: {
        ja: 'シェアIDが指定されていません。`share.html?id=...` を使用してください。',
        en: 'Missing share id. Use `share.html?id=...`.',
      },
      shareInvalidId: {
        ja: 'シェアIDの形式が不正です。',
        en: 'Invalid share id format.',
      },
      unsupportedShareRouteParam: {
        ja: 'この共有ページでは `id` 以外の読込URLパラメータは使用しません。`share.html?id=...` を使用してください。',
        en: 'This share page only accepts the `id` load parameter. Use `share.html?id=...`.',
      },
      unsupportedChartParam: {
        ja: 'このツールでは `chart` URLパラメータは使用しません。`/` または `?projectId=...` を使用してください。',
        en: 'This tool does not use the `chart` URL parameter. Use `/` or `?projectId=...`.',
      },
    };

    return dict[key]?.[lang] || dict[key]?.en || key;
  }

  function clean(value) {
    if (value == null) return '';
    return String(value).trim();
  }

  function parseIndexRoute(search) {
    const params = new URLSearchParams(search || location.search || '');

    if (params.has('shareId')) {
      return {
        ok: false,
        code: 'unsupported_share_id_param',
        message: msg('unsupportedShareIdParam'),
      };
    }

    if (params.has('id')) {
      return {
        ok: false,
        code: 'share_id_on_editor',
        message: msg('indexShareIdInEditor'),
      };
    }


    if (params.has('chart')) {
      return {
        ok: false,
        code: 'unsupported_chart_param',
        message: msg('unsupportedChartParam'),
      };
    }

    const projectId = clean(params.get('projectId'));

    if (projectId) {
      return {
        ok: true,
        mode: 'project',
        projectId,
      };
    }

    return {
      ok: true,
      mode: 'chart',
      chartId: DEFAULT_CHART_ID,
    };
  }

  function parseShareRoute(search) {
    const params = new URLSearchParams(search || location.search || '');

    if (params.has('projectId') || params.has('shareId')) {
      return {
        ok: false,
        code: 'unsupported_share_route_param',
        message: msg('unsupportedShareRouteParam'),
      };
    }

    const shareId = clean(params.get('id'));
    if (!shareId) {
      return {
        ok: false,
        code: 'missing_share_id',
        message: msg('shareMissingId'),
      };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(shareId)) {
      return {
        ok: false,
        code: 'invalid_share_id',
        message: msg('shareInvalidId'),
      };
    }

    return {
      ok: true,
      shareId,
      embed: params.get('embed') === '1',
    };
  }

  window.DVZBuilderRouting = {
    parseIndexRoute,
    parseShareRoute,
  };
})();
