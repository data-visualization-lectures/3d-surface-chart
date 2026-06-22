// ============================================================
// 3D Surface Chart - Share Service
// ============================================================

(function () {
  'use strict';

  function escapeHtmlAttr(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function inlineSvgComputedStyles(srcEl, cloneEl) {
    if (!srcEl || !cloneEl || typeof window.getComputedStyle !== 'function') return;
    const computed = window.getComputedStyle(srcEl);
    const props = [
      'fill', 'stroke', 'stroke-width', 'stroke-dasharray',
      'stroke-linecap', 'stroke-linejoin', 'opacity',
      'fill-opacity', 'stroke-opacity', 'font-family',
      'font-size', 'font-weight', 'text-anchor', 'display',
      'visibility', 'dominant-baseline', 'text-decoration',
      'pointer-events', 'paint-order', 'stroke-miterlimit',
    ];
    props.forEach((prop) => {
      const value = computed.getPropertyValue(prop);
      if (value) cloneEl.style.setProperty(prop, value);
    });
    for (let i = 0; i < srcEl.children.length; i += 1) {
      if (cloneEl.children[i]) inlineSvgComputedStyles(srcEl.children[i], cloneEl.children[i]);
    }
  }

  class BuilderShareService {
    constructor(options = {}) {
      this.publicShareOrigin = options.publicShareOrigin || 'https://3d-surface-chart.dataviz.jp';
      this.defaultEmbedAspectRatio = options.defaultEmbedAspectRatio || '16/10';
      this.embedTitleFallback = options.embedTitleFallback || '3D Surface Chart';
      this.embedViewportGutterPx = Number(options.embedViewportGutterPx || 24);
    }

    buildPublicSharePageUrl(shareId) {
      return `${this.publicShareOrigin}/share.html?id=${encodeURIComponent(shareId)}`;
    }

    buildEmbedSrc(shareId) {
      return `${this.buildPublicSharePageUrl(shareId)}&embed=1`;
    }

    resolveEmbedTitle(rawTitle) {
      const base = String(rawTitle || '').trim();
      return base ? `${base} - ${this.embedTitleFallback}` : this.embedTitleFallback;
    }

    buildIframeEmbedCode(shareId, rawTitle) {
      const src = this.buildEmbedSrc(shareId);
      const title = escapeHtmlAttr(this.resolveEmbedTitle(rawTitle));
      const style = [
        'display:block',
        'width:100%',
        'max-width:100%',
        'height:auto',
        `aspect-ratio:${this.defaultEmbedAspectRatio}`,
        'border:0',
        'margin:0 auto',
        'padding:0',
        'overflow:hidden',
        `max-height:calc(100vh - ${this.embedViewportGutterPx}px)`,
        `max-height:calc(100dvh - ${this.embedViewportGutterPx}px)`,
      ].join(';');

      return `<iframe title="${title}" src="${src}" frameborder="0" scrolling="auto" allow="fullscreen; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" loading="lazy" allowfullscreen="true" style="${style}"></iframe>`;
    }

    getCurrentEmbedTitle(currentInstance) {
      const annotateTitle = document.getElementById('annotate-title')?.value?.trim();
      const chartHeading = document.getElementById('chart-title')?.textContent?.trim();
      const instanceTitle = currentInstance?.config?.title;
      return annotateTitle || chartHeading || instanceTitle || this.embedTitleFallback;
    }

    async uploadOgImage(shareId, title, context = {}) {
      try {
        const sb = dvzGetShareSupabase?.();
        if (!sb) return false;

        const entry = context.currentChartId && context.getRegistryEntry?.(context.currentChartId);
        const templateType = entry?.templateType || 'svg';
        let pngBlob = null;

        if (templateType === 'webgl') {
          const canvas = document.querySelector('#chart-container canvas');
          if (!canvas) return false;

          const ogCanvas = document.createElement('canvas');
          const OG_W = 1200;
          const OG_H = 630;
          ogCanvas.width = OG_W;
          ogCanvas.height = OG_H;

          const ctx = ogCanvas.getContext('2d');
          ctx.drawImage(canvas, 0, 0, OG_W, OG_H);
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(0, OG_H - 60, OG_W, 60);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(title, OG_W / 2, OG_H - 30);

          pngBlob = await new Promise((resolve) => ogCanvas.toBlob(resolve, 'image/png'));
        } else {
          const svgEl = document.querySelector('#wrapper');
          if (!svgEl) return false;

          if (document.fonts?.ready) {
            try {
              await document.fonts.ready;
            } catch (_error) {
              // Continue with currently available fonts.
            }
          }

          const serialized = typeof context.currentInstance?._serializeSVG === 'function'
            ? context.currentInstance._serializeSVG(svgEl)
            : (() => {
                const clone = svgEl.cloneNode(true);
                clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
                inlineSvgComputedStyles(svgEl, clone);
                return { svgString: new XMLSerializer().serializeToString(clone) };
              })();
          const svgData = serialized.svgString;
          const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);

          const img = await new Promise((resolve, reject) => {
            const candidate = new Image();
            candidate.onload = () => resolve(candidate);
            candidate.onerror = reject;
            candidate.src = url;
          });
          URL.revokeObjectURL(url);

          const OG_W = 1200;
          const OG_H = 630;
          const ogCanvas = document.createElement('canvas');
          ogCanvas.width = OG_W;
          ogCanvas.height = OG_H;

          const ctx = ogCanvas.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, OG_W, OG_H);

          const scale = Math.min(OG_W / img.naturalWidth, (OG_H - 60) / img.naturalHeight);
          const dx = (OG_W - img.naturalWidth * scale) / 2;
          const dy = (OG_H - 60 - img.naturalHeight * scale) / 2;
          ctx.drawImage(img, dx, dy, img.naturalWidth * scale, img.naturalHeight * scale);

          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(0, OG_H - 60, OG_W, 60);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(title, OG_W / 2, OG_H - 30);

          pngBlob = await new Promise((resolve) => ogCanvas.toBlob(resolve, 'image/png'));
        }

        if (!pngBlob) return false;

        const { error } = await sb.storage
          .from('interactive-chart-builder-og-images')
          .upload(`${shareId}.png`, pngBlob, { contentType: 'image/png', upsert: true });

        if (error) throw error;
        return true;
      } catch (error) {
        console.warn('[3d-surface-chart] og image upload failed; the share URL remains valid.', {
          shareId,
          error: error?.message || String(error),
        });
        return false;
      }
    }

    async publishSavedProject(projectId, options = {}) {
      if (typeof dvzPublishShareFromProject !== 'function') {
        throw new Error('Share publish API is unavailable');
      }

      const result = await dvzPublishShareFromProject({
        projectId,
        fallbackTitle: options.fallbackTitle || '',
      });
      return {
        id: result?.shareId || result?.id || null,
        title: result?.title || options.fallbackTitle || '',
      };
    }
  }

  window.DVZBuilderShareService = {
    BuilderShareService,
  };
})();
