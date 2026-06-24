// ============================================================
// Interactive Chart Builder - Routing Contracts
// ============================================================

(function () {
  'use strict';

  function currentLang() {
    return (navigator.language || '').startsWith('ja') ? 'ja' : 'en';
  }

  function msg(key) {
    const lang = currentLang();
    const dict = {
      indexLegacyProjectId: {
        ja: '旧URLパラメータ `project_id` は非対応です。`?projectId=` を使用してください。',
        en: 'Legacy URL parameter `project_id` is not supported. Use `?projectId=` instead.',
      },
      indexShareIdInEditor: {
        ja: '共有URLは `share.html?id=...` を使用してください。',
        en: 'Use `share.html?id=...` for shared chart URLs.',
      },
      indexLegacyShareId: {
        ja: '旧URLパラメータ `shareId` は非対応です。`share.html?id=...` を使用してください。',
        en: 'Legacy URL parameter `shareId` is not supported. Use `share.html?id=...` instead.',
      },
      shareMissingId: {
        ja: 'シェアIDが指定されていません。`share.html?id=...` を使用してください。',
        en: 'Missing share id. Use `share.html?id=...`.',
      },
      shareInvalidId: {
        ja: 'シェアIDの形式が不正です。',
        en: 'Invalid share id format.',
      },
      shareLegacyProjectId: {
        ja: '旧URL形式は非対応です。`share.html?id=...` を使用してください。',
        en: 'Legacy URL format is not supported. Use `share.html?id=...`.',
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
        code: 'legacy_share_id',
        message: msg('indexLegacyShareId'),
      };
    }

    if (params.has('id')) {
      return {
        ok: false,
        code: 'share_id_on_editor',
        message: msg('indexShareIdInEditor'),
      };
    }

    if (params.has('project_id')) {
      return {
        ok: false,
        code: 'legacy_project_id',
        message: msg('indexLegacyProjectId'),
      };
    }

    const projectId = clean(params.get('projectId'));
    const chartId = clean(params.get('chart'));

    if (projectId) {
      return {
        ok: true,
        mode: 'project',
        projectId,
      };
    }

    if (chartId) {
      return {
        ok: true,
        mode: 'chart',
        chartId,
      };
    }

    return {
      ok: true,
      mode: 'selector',
    };
  }

  function parseShareRoute(search) {
    const params = new URLSearchParams(search || location.search || '');

    if (params.has('project_id') || params.has('projectId') || params.has('shareId')) {
      return {
        ok: false,
        code: 'legacy_share_route',
        message: msg('shareLegacyProjectId'),
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
