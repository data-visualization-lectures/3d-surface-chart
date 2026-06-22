// ============================================================
// Interactive Chart Builder - Tool Header Manager
// ============================================================

(function () {
  'use strict';

  function getLang() {
    return (navigator.language || '').startsWith('ja') ? 'ja' : 'en';
  }

  function normalizeSavedProjectMeta(meta) {
    const project = meta?.project && typeof meta.project === 'object' ? meta.project : null;
    return {
      id: meta?.id || project?.id || null,
      name: meta?.name || project?.name || null,
    };
  }

  function normalizeLoadedProjectMeta(meta, fallbackId = null) {
    const normalized = normalizeSavedProjectMeta(meta);
    return {
      id: normalized.id || meta?.projectId || fallbackId || null,
      name: normalized.name || null,
    };
  }

  class HeaderManager {
    constructor(options = {}) {
      this.options = options;
      this.lang = getLang();
      this.header = null;
      this._buildSavePayload = null;
      this.status = options.enabled === false ? 'disabled' : 'idle';
      this.lastControlsMode = 'selector';
      this.setupPromise = null;
      this.readyPromise = null;
      this._resolveReady = null;
      this._rejectReady = null;
    }

    _wrapLoadProject(header, setCurrentProjectMeta) {
      if (!header || typeof header.loadProject !== 'function' || header.__dvzLoadProjectWrapped === '1') {
        return;
      }

      const originalLoadProject = header.loadProject.bind(header);
      header.loadProject = async (projectId, ...args) => {
        const data = await originalLoadProject(projectId, ...args);
        const normalizedProjectId = typeof projectId === 'string' ? projectId.trim() : '';
        if (data && normalizedProjectId) {
          const meta = normalizeLoadedProjectMeta(data, normalizedProjectId);
          setCurrentProjectMeta?.(meta);
        }
        return data;
      };
      header.__dvzLoadProjectWrapped = '1';
    }

    _ensureReadyPromise() {
      if (this.readyPromise) return this.readyPromise;
      this.readyPromise = new Promise((resolve, reject) => {
        this._resolveReady = resolve;
        this._rejectReady = reject;
      });
      return this.readyPromise;
    }

    _markUnavailable(reason) {
      if (this.status === 'ready' || this.status === 'disabled') return;
      this.status = 'failed';
      this.options.onUnavailable?.(reason);
      if (this._rejectReady) {
        this._rejectReady(new Error(reason || 'Tool header is unavailable.'));
        this._resolveReady = null;
        this._rejectReady = null;
      }
    }

    _applyLastControlsMode() {
      if (this.lastControlsMode === 'chart') {
        this.showChartControls();
      } else {
        this.showSelectorControls();
      }
    }

    async _waitUntilReady() {
      if (this.options.enabled === false) {
        this.status = 'disabled';
        return null;
      }

      const header = document.querySelector('dataviz-tool-header');
      if (!header) {
        this._markUnavailable('Tool header element was not found.');
        return null;
      }

      if (typeof header.setConfig === 'function') return header;

      if (window.customElements && typeof window.customElements.whenDefined === 'function') {
        const definedPromise = window.customElements.whenDefined('dataviz-tool-header').then(() => {
          const lateHeader = document.querySelector('dataviz-tool-header');
          if (lateHeader && typeof lateHeader.setConfig === 'function') {
            this._connectHeader(lateHeader);
          }
          return lateHeader;
        });

        const result = await Promise.race([
          definedPromise,
          new Promise((resolve) => setTimeout(() => resolve(null), 2500)),
        ]);

        if (result && typeof result.setConfig === 'function') return result;
      }

      const readyHeader = document.querySelector('dataviz-tool-header');
      if (typeof readyHeader?.setConfig === 'function') return readyHeader;
      this._markUnavailable('Tool header API did not become ready.');
      return null;
    }

    _loadLabel() {
      return this.lang === 'ja' ? 'プロジェクトの読込' : 'Load Project';
    }

    _saveLabel() {
      return this.lang === 'ja' ? 'プロジェクトの保存' : 'Save Project';
    }

    _shareLabel() {
      return this.lang === 'ja' ? 'シェア' : 'Share';
    }

    _noDataMessage() {
      return this.lang === 'ja' ? 'データがありません' : 'No data to save';
    }

    _connectHeader(header) {
      if (!header || typeof header.setConfig !== 'function') return null;
      if (this.header === header && this.status === 'ready') return header;
      if (typeof dvzInstallHeaderProcessingToasts === 'function') {
        dvzInstallHeaderProcessingToasts(header);
      }

      this.header = header;
      const {
        appName,
        logoText,
        getWrappedProjectData,
        getCurrentProjectMeta,
        setCurrentProjectMeta,
        generateThumbnail,
        onProjectLoad,
        onProjectMetaChange,
        getShareTitle,
        publishShare,
        afterPublish,
      } = this.options;

      this._buildSavePayload = async () => {
        const data = getWrappedProjectData?.();
        if (!data) return null;

        const projectMeta = getCurrentProjectMeta?.() || {};
        const currentInstance = this.options.getCurrentInstance?.();
        const stripExt = (s) => (typeof s === 'string' ? s.replace(/\.[^./\\]+$/, '').trim() : '');
        const dataName = stripExt(currentInstance?._dataName);
        const fallbackName = currentInstance?.config?.title || '';
        const thumbnail = await Promise.resolve(generateThumbnail?.());

        return {
          name: projectMeta.name || dataName || fallbackName,
          data,
          thumbnailDataUri: thumbnail || null,
          existingProjectId: projectMeta.id || null,
        };
      };

      if (typeof header.setProjectConfig === 'function') {
        header.setProjectConfig({
          appName,
          onProjectLoad: (projectData, meta) => {
            const nextMeta = meta?.isGroupProject
              ? { id: null, name: null }
              : normalizeLoadedProjectMeta(meta);
            setCurrentProjectMeta?.(nextMeta);
            onProjectLoad?.(projectData, meta || null);
          },
          onProjectSave: (meta) => {
            const nextMeta = normalizeSavedProjectMeta(meta);
            setCurrentProjectMeta?.(nextMeta);
            onProjectMetaChange?.(nextMeta, 'save');
          },
          onProjectDelete: (deletedId) => {
            const current = getCurrentProjectMeta?.() || {};
            if (deletedId && current.id === deletedId) {
              const nextMeta = { id: null, name: null };
              setCurrentProjectMeta?.(nextMeta);
              onProjectMetaChange?.(nextMeta, 'delete');
            }
          },
        });
      }

      if (typeof header.setShareConfig === 'function') {
        header.setShareConfig({
          getSavePayload: () => this._buildSavePayload?.(),
          getShareTitle: () => getShareTitle?.(),
          publishShare: (args) => publishShare?.(args),
          afterPublish: (args) => afterPublish?.(args),
        });
      }

      this._wrapLoadProject(header, setCurrentProjectMeta);

      this.status = 'ready';
      this._applyLastControlsMode();
      this.options.onReady?.();
      if (this._resolveReady) {
        this._resolveReady(header);
        this._resolveReady = null;
        this._rejectReady = null;
      }

      return header;
    }

    async setup() {
      if (this.status === 'disabled') return null;
      if (this.status === 'ready') return this.header;
      if (this.setupPromise) return this.setupPromise;

      this.status = 'pending';
      this.setupPromise = this._waitUntilReady().then((header) => {
        if (!header || typeof header.setConfig !== 'function') return null;
        return this._connectHeader(header);
      }).catch((err) => {
        this._markUnavailable(err?.message || 'Tool header setup failed.');
        return null;
      });

      return this.setupPromise;
    }

    _logoConfig() {
      return {
        logo: { type: 'text', text: this.options.logoText || 'Interactive Chart Builder' },
      };
    }

    showSelectorControls() {
      this.lastControlsMode = 'selector';
      window.DVZToolHeaderVisibility?.setVisible?.(false);
      const header = this.header;
      if (!header || typeof header.setConfig !== 'function') return;

      header.setConfig({
        ...this._logoConfig(),
        buttons: [],
      });
    }

    showChartControls() {
      this.lastControlsMode = 'chart';
      window.DVZToolHeaderVisibility?.setVisible?.(true);
      const header = this.header;
      if (!header || typeof header.setConfig !== 'function') return;

      header.setConfig({
        ...this._logoConfig(),
        buttons: [
          {
            label: this._loadLabel(),
            action: () => header.showLoadModal(),
            align: 'right',
          },
          {
            label: this._saveLabel(),
            action: async () => {
              if (typeof dvzShowProcessingToast === 'function') {
                dvzShowProcessingToast(this.lang === 'ja' ? '保存準備中です' : 'Preparing save...');
              }
              const payload = await this._buildSavePayload?.();
              if (!payload?.data) {
                header.showMessage?.(this._noDataMessage(), 'error');
                return;
              }
              header.showSaveModal(payload);
            },
            align: 'right',
          },
          {
            label: this._shareLabel(),
            action: () => header.shareProject?.(),
            align: 'right',
          },
        ],
      });
    }

    async whenReady() {
      if (this.status === 'ready' && this.header) return this.header;
      if (this.status === 'disabled') throw new Error('Tool header is disabled.');
      if (this.status === 'failed') throw new Error('Tool header is unavailable.');
      this.setup();
      return this._ensureReadyPromise();
    }

    async loadProject(projectId) {
      const header = await this.whenReady();
      if (!header || typeof header.loadProject !== 'function') return null;
      return header.loadProject(projectId);
    }

    async saveProject(payload) {
      const header = await this.whenReady();
      if (!header || typeof header.saveProject !== 'function') {
        throw new Error('Project save API is unavailable.');
      }
      return header.saveProject(payload);
    }
  }

  window.DVZBuilderHeaderManager = {
    HeaderManager,
  };
})();
