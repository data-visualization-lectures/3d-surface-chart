# 3D Surface Chart

Three.js + D3.js による3Dサーフェスチャート。イールドカーブなどの2次元グリッドデータを3D曲面として可視化します。

## 機能

- サンプルデータ: US Treasury、Japan JGB、財務省 過去の金利情報（1974年～）
- CSV読み込み: ファイル選択またはドラッグ＆ドロップ
- カラースキーム: 連続的 / 分岐的（0基準オプション）
- カメラプリセット: Overview / Front / Top / Side
- データ未存在箇所はグレー表示

## デバッグ

URLに `?debug` を付けるとTweakpaneパネルが表示されます。

- Surface設定（幅・高さ・奥行き・グリッド透明度）
- カメラ座標モニター / FOV調整
- Rebuildボタン

## ビルド

```bash
bash build.sh
```

`/docs` にGitHub Pages用のファイルが生成されます。
