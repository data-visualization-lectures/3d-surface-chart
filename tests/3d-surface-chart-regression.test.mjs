import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function loadRouting() {
  const sandbox = {
    navigator: { language: 'ja-JP' },
    URLSearchParams,
    location: { search: '' },
    window: {},
  };
  sandbox.window = sandbox;
  vm.runInNewContext(read('js/core/routing.js'), sandbox, { filename: 'js/core/routing.js' });
  return sandbox.window.DVZBuilderRouting;
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

test('local entry point delegates to the shared sidebar adapter first', () => {
  const common = read('js/dvz-common.js');
  const adapter = read('js/core/setting-sidebar.js');

  assert.match(common, /DVZSurfaceChartSettingSidebar\?\.mount\?\.\(defaultTabId\)/);
  assert.match(adapter, /window\.DVZSettingSidebar\?\.mount/);
  assert.match(adapter, /activeClassNames:\s*\['border-indigo-500', 'text-indigo-600'\]/);
  assert.match(adapter, /inactiveClassNames:\s*\['border-transparent', 'text-gray-500'\]/);
  assert.match(adapter, /hiddenClassName:\s*'hidden'/);
});

test('single-chart editor does not ship selector UI', () => {
  const html = read('index.html');
  const css = read('css/style.css');
  const bootstrap = read('js/3d-surface-chart-bootstrap.js');
  const runtime = read('js/core/runtime.js');

  assert.doesNotMatch(html, /chart-selector|chart-switcher|chart-back-btn|dvz-catalog/);
  assert.doesNotMatch(css, /chart-selector|chart-switcher|chart-back-btn|dvz-catalog|data-dvz-view="selector"/);
  assert.doesNotMatch(bootstrap, /mode !== 'selector'|showSelector/);
  assert.doesNotMatch(runtime, /showSelector|renderSelector|syncUrlForSelector/);
});

test('editor route accepts root and projectId only for loading', () => {
  const routing = loadRouting();

  const rootRoute = routing.parseIndexRoute('');
  assert.equal(rootRoute.ok, true);
  assert.equal(rootRoute.mode, 'chart');
  assert.equal(rootRoute.chartId, '3d-surface-chart');

  const projectRoute = routing.parseIndexRoute('?projectId=abc-123');
  assert.equal(projectRoute.ok, true);
  assert.equal(projectRoute.mode, 'project');
  assert.equal(projectRoute.projectId, 'abc-123');

  const chartRoute = routing.parseIndexRoute('?chart=3d-surface-chart');
  assert.equal(chartRoute.ok, false);
  assert.equal(chartRoute.code, 'unsupported_chart_param');
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
  const runtime = read('js/core/runtime.js');
  const headerManager = read('js/core/header-manager.js');
  const common = read('js/dvz-common.js');
  const shareService = read('js/core/share-service.js');
  const shareRuntime = read('js/share-runtime.js');
  const shareHtml = read('share.html');
  const publishFunction = read('supabase/functions/publish-surface-3d-share/index.ts');
  const ogFunction = read('supabase/functions/og-surface-3d-share/index.ts');

  assert.match(moduleSource, /const SETTINGS_SPEC\s*=\s*{/);
  assert.match(moduleSource, /chartType:\s*'3d-surface-chart'/);
  assert.match(moduleSource, /shareTable:\s*'surface_3d_shares'/);
  assert.match(moduleSource, /DVZSettingsCompat\.build\(SETTINGS_SPEC,/);
  assert.match(moduleSource, /DVZSettingsCompat\.normalize\(project, SETTINGS_SPEC\)/);
  assert.match(runtime, /getProjectData\(\)\s*{/);
  assert.match(runtime, /_loadProjectData\?\.\(projectData\)/);
  assert.doesNotMatch(runtime, /chartData|getWrappedProjectData/);
  assert.match(headerManager, /getProjectData/);
  assert.doesNotMatch(headerManager, /getWrappedProjectData/);
  assert.match(common, /functions\/v1\/publish-surface-3d-share/);
  assert.match(shareService, /og-surface-3d-share/);
  assert.match(shareService, /surface-3d-og-images/);
  assert.match(shareRuntime, /const SHARE_TABLE = 'surface_3d_shares'/);
  assert.match(shareRuntime, /surface-3d-og-images/);
  assert.match(shareRuntime, /ensureSidebarProxy\(/);
  assert.match(shareRuntime, /initEmbedMode\(IS_EMBED\)/);
  assert.match(shareHtml, /js\/share-runtime\.js/);
  assert.match(publishFunction, /const SHARE_TABLE = "surface_3d_shares"/);
  assert.match(publishFunction, /projectData\.chartType !== CHART_TYPE/);
  assert.doesNotMatch(publishFunction, /chartData|source_project_id|interactive_chart_builder/);
  assert.match(ogFunction, /const SHARE_TABLE = "surface_3d_shares"/);
  assert.match(ogFunction, /const OG_IMAGE_BUCKET = "surface-3d-og-images"/);
});
