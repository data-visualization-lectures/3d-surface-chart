// ============================================================
// Interactive Chart Builder - Renderer Adapter Contracts
// ============================================================

(function () {
  'use strict';

  function hasFn(target, key) {
    return !!target && typeof target[key] === 'function';
  }

  function inferSampleFormat(url) {
    const ext = String(url || '').split('.').pop()?.toLowerCase();
    return (ext === 'json' || ext === 'geojson') ? 'json' : 'csv';
  }

  class AdapterManager {
    constructor(options = {}) {
      this.options = {
        disableProjectSetup: options.disableProjectSetup !== false,
        disableEmbedCopy: options.disableEmbedCopy !== false,
        skipSampleSetup: options.skipSampleSetup === true,
        sampleMode: options.sampleMode || 'guarded', // guarded | passthrough
      };
      this._patchedClasses = new WeakSet();
      this._samplePickerInitialized = false;
    }

    resetSessionState() {
      this._samplePickerInitialized = false;
    }

    _resolveTemplateType(entry) {
      const type = entry?.templateType || 'svg';
      if (type !== 'svg' && type !== 'webgl') {
        throw new Error(`Unsupported templateType: ${type}`);
      }
      return type;
    }

    _validateModuleContract(entry, mod, type) {
      if (!mod || typeof mod !== 'object') {
        throw new Error(`Chart module is invalid: ${entry?.id || 'unknown'}`);
      }
      if (typeof mod.ChartClass !== 'function') {
        throw new Error(`ChartClass is missing: ${entry?.id || 'unknown'}`);
      }
      if (type === 'webgl') {
        const proto = mod.ChartClass.prototype;
        if (!proto || typeof proto.start !== 'function') {
          throw new Error(`WebGL module must implement async start(): ${entry?.id || 'unknown'}`);
        }
      }
    }

    _patchChartClass(ChartClass) {
      if (!ChartClass || this._patchedClasses.has(ChartClass)) return;

      const proto = ChartClass.prototype;
      if (!proto) return;

      if (this.options.disableProjectSetup && hasFn(proto, '_setupProject')) {
        proto._setupProject = function () {};
      }

      if (this.options.disableEmbedCopy && hasFn(proto, '_setupEmbedCopy')) {
        proto._setupEmbedCopy = function () {};
      }

      if (this.options.skipSampleSetup) {
        if (hasFn(proto, '_setupSampleData')) {
          proto._setupSampleData = function () {};
        }
      } else if (hasFn(proto, '_setupSampleData') && this.options.sampleMode === 'guarded') {
        const manager = this;
        const original = proto._setupSampleData;
        proto._setupSampleData = function (...args) {
          if (!manager._samplePickerInitialized) {
            manager._samplePickerInitialized = true;
            return original.apply(this, args);
          }

          const params = new URLSearchParams(location.search);
          const hasProjectRoute = !!params.get('projectId');
          const dataUrl = params.get('data_url');
          if (dataUrl && !hasProjectRoute && hasFn(this, '_safeLoadSampleData')) {
            return this._safeLoadSampleData(
              dataUrl,
              inferSampleFormat(dataUrl),
              null,
              { fallbackOnError: true, background: true }
            );
          }

          if (!hasProjectRoute && hasFn(this, '_autoLoadFromCatalog')) {
            return this._autoLoadFromCatalog();
          }

          return undefined;
        };
      }

      this._patchedClasses.add(ChartClass);
    }

    prepareModule(entry, mod) {
      const type = this._resolveTemplateType(entry);
      this._validateModuleContract(entry, mod, type);
      this._patchChartClass(mod.ChartClass);

      return {
        type,
        applyContainer: (container, meta = {}) => {
          if (!container) return;
          container.className = `w-full dvz-template-${type}`;
          container.innerHTML = meta.containerHTML || '';
        },
        instantiate: () => new mod.ChartClass(),
        start: async (instance) => {
          if (type === 'webgl') {
            await instance.start();
          }
        },
      };
    }

    destroyInstance(instance) {
      if (!instance || typeof instance.destroy !== 'function') return;
      try {
        instance.destroy();
      } catch (err) {
        console.warn('Chart destroy() failed:', err);
      }
    }
  }

  window.DVZRendererAdapters = {
    AdapterManager,
  };
})();
