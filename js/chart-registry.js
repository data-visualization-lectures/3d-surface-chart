// ============================================================
// Chart Registry - 3D Surface Chart
// ============================================================
//
// templateType:
//   'webgl' - WebGL/canvas-based chart. Loaded as ES module via dynamic import().

const CHART_REGISTRY = [
  {
    id: '3d-surface-chart',
    name: { ja: '3Dサーフェス・チャート', en: '3D Surface Chart' },
    description: { ja: '3次元の曲面でデータを表現', en: '3D surface visualization with interactive camera' },
    category: 'spatial',
    templateType: 'webgl',
    modulePath: 'js/modules/3d-surface-chart.js',
    externalDeps: [],
  },
];
