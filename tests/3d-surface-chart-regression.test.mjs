import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('editor loads the shared setting sidebar assets before tool adapters', () => {
  const html = read('index.html');
  const sharedCss = 'https://id.data-viz-lectures.com/lib/dvz-setting-sidebar.v1.css';
  const localCss = 'css/style.css?v=20260807-setting-sidebar';
  const sharedJs = 'https://id.data-viz-lectures.com/lib/dvz-setting-sidebar.v1.js';
  const adapterJs = 'js/core/setting-sidebar.js';
  const commonJs = 'js/dvz-common.js';

  assert.ok(html.indexOf(sharedCss) < html.indexOf(localCss));
  assert.ok(html.indexOf(sharedJs) < html.indexOf(adapterJs));
  assert.ok(html.indexOf(adapterJs) < html.indexOf(commonJs));
});

test('existing five-tab DOM declares the shared sidebar contract', () => {
  const html = read('index.html');

  assert.match(html, /<aside id="dvz-sidebar" data-dvz-setting-sidebar class="dvz-sidebar dvz-setting-sidebar"/);
  assert.match(html, /data-dvz-setting-tab-select/);
  assert.match(html, /data-dvz-setting-tabs class="dvz-setting-sidebar__tabs"/);
  assert.match(html, /data-dvz-setting-panels class="dvz-setting-sidebar__panels [^"]*"/);
  assert.equal((html.match(/data-dvz-setting-tab data-tab=/g) || []).length, 5);
  assert.equal((html.match(/data-dvz-setting-panel class="dvz-setting-sidebar__panel/g) || []).length, 5);
});

test('legacy entry point delegates to the shared sidebar adapter first', () => {
  const common = read('js/dvz-common.js');
  const adapter = read('js/core/setting-sidebar.js');

  assert.match(common, /DVZSurfaceChartSettingSidebar\?\.mount\?\.\(defaultTabId\)/);
  assert.match(adapter, /window\.DVZSettingSidebar\?\.mount/);
  assert.match(adapter, /activeClassNames:\s*\['border-indigo-500', 'text-indigo-600'\]/);
  assert.match(adapter, /inactiveClassNames:\s*\['border-transparent', 'text-gray-500'\]/);
  assert.match(adapter, /hiddenClassName:\s*'hidden'/);
});

test('editor stacks the WebGL chart and sidebar below the shared two-pane breakpoint', () => {
  const css = read('css/style.css');
  const moduleSource = read('js/modules/3d-surface-chart.js');

  assert.match(css, /@media\s*\(max-width:\s*1099px\)/);
  assert.match(css, /\.dvz-app\s*\{[^}]*flex-direction:\s*column/s);
  assert.match(css, /#dvz-sidebar\s*\{[^}]*width:\s*100%[^}]*max-height:\s*min\(48dvh,\s*460px\)/s);
  assert.match(moduleSource, /resizeObserver\s*=\s*new ResizeObserver\(\(\)\s*=>\s*onResize\(\)\)/);
});

test('3D settings persistence and share/embed contracts remain intact', () => {
  const moduleSource = read('js/modules/3d-surface-chart.js');
  const shareRuntime = read('js/share-runtime.js');
  const shareHtml = read('share.html');

  assert.match(moduleSource, /const SETTINGS_SPEC\s*=\s*{/);
  assert.match(moduleSource, /chartType:\s*'3d-surface-chart'/);
  assert.match(moduleSource, /DVZSettingsCompat\.build\(SETTINGS_SPEC,/);
  assert.match(moduleSource, /DVZSettingsCompat\.normalize\(project, SETTINGS_SPEC\)/);
  assert.match(shareRuntime, /ensureSidebarProxy\(/);
  assert.match(shareRuntime, /initEmbedMode\(IS_EMBED\)/);
  assert.match(shareHtml, /js\/share-runtime\.js/);
});
