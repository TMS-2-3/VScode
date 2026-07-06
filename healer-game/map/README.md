# Map Folder

マップ担当者が基本的に作業する場所です。

- `tileMaps.js`: タイル定義とマップ定義を書くファイル
- `img_tile/`: 将来的にマップ用タイル画像を置く場所

原則として、マップ追加やタイル設定の変更はこの `map` フォルダ内で行います。
通行判定や描画の仕組みを変える必要がある場合だけ、プログラム担当に相談して `world/tileMapSystem.js` 側を変更します。

## 他AI・共同開発者向け共有

- マップ設定の基本データはこの `map` フォルダに集約しています。
- タイル定義とマップ定義は `map/tileMaps.js` に書きます。
- タイル画像は `map/img_tile/` に置き、画像パスも `map/img_tile/...` で指定します。
- `world/tileMapSystem.js` はタイルマップを処理する仕組み側です。マップデータを増やすだけなら基本的に触りません。
- 旧 `data/tileMaps.js` は使いません。`index.html` は `map/tileMaps.js` を読み込む形です。
- 現在の手描き町マップ描画・当たり判定には、まだこのタイルマップ基盤を接続していません。今は将来のマップ制作用のデータ基盤です。
- キャラクター画像は最近 `img/char/` 配下に整理されています。マップ用タイル画像とは置き場所を分けています。

## タイル定義

`window.HEALER_TILE_DEFS` にタイルを追加します。

```js
grass: {
  id: "grass",
  name: "草地",
  image: "map/img_tile/grass.png",
  passable: true,
  tags: ["ground"],
}
```

## マップ定義

`window.HEALER_TILE_MAPS` にマップを追加します。

```js
forest01: {
  id: "forest01",
  name: "森01",
  tileSize: 48,
  width: 30,
  height: 20,
  defaultTile: "grass",
  layers: [
    { id: "ground", name: "地面", tiles: [] },
    { id: "object", name: "配置物", tiles: [] },
  ],
  events: [],
}
```
