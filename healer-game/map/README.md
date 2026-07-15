# Map Folder

## 概要

このフォルダーは、マップ担当用の作業場所です。  
通常のマップ制作では、この `map` フォルダー内だけを触ってください。

- マップデータの正式な管理先: `map/tileMaps.js`
- タイル画像の正式な管理先: `map/img_tile/`
- エディター: `map/map-editor.html`

`Desktop\map` や `Downloads` にある一時ファイルは、正式データとしては扱いません。  
また、通常のマップ制作では `world/tileMapSystem.js` を編集しないでください。そこは共通の仕組み側です。

## 共同制作者向けルール

- 作業は基本的に `map` フォルダー内で完結させる
- マップ定義の最終反映先は `map/tileMaps.js`
- タイル画像は `map/img_tile/...` に置く
- 共有メモや README は、文字化けが不安なときは英語でもよい
- 日本語の表示名を使う場合は、保存後に文字化けしていないか確認する

## 現在の作業フロー

1. `map-editor.html` で配置や下書きを作る
2. 必要に応じてブラウザ側の一時保存や作業記録保存を使う
3. 最終的な内容はエディターから書き出して `map/tileMaps.js` に反映する
4. `tileMaps.js` 更新後に、エディターやプレビューを再読込して確認する

ブラウザ側の保存は下書き用です。  
正式データは必ず `tileMaps.js` に反映してください。

## エディターの使い方

### 基本

- `新規作成`: 新しいマップの下書きを作る
- `反映`: 幅、高さ、タイルサイズなどの入力内容を現在のマップに反映する
- `作業記録JSON保存`: 作業記録を JSON で保存する
- `作業記録JSON読込`: 保存した作業記録を読み込む
- `JS書き出し`: `tileMaps.js` に入れるためのマップ定義を書き出す
- `tileMaps再読込`: `tileMaps.js` を再読み込みして、反映後の状態を確認する

### 補足

- エディター上の `新規作成` は、ブラウザ上の未登録マップを作るだけです
- `新規作成` しただけでは `tileMaps.js` には保存されません
- 画面内の状態表示で、現在のマップが `tileMaps.js` の既存マップか、未登録の新規マップかを確認できます

## マップ定義の基本

`window.HEALER_TILE_MAPS` に各マップを定義します。

```js
exampleMap: {
  id: "exampleMap",
  name: "サンプルマップ",
  tileSize: 48,
  width: 15,
  height: 8,
  defaultTile: "grass",
  layers: [
    { id: "ground", name: "地面", tiles: [] },
    { id: "terrain", name: "地形", tiles: [] },
    { id: "object", name: "配置物", tiles: [] },
    { id: "event", name: "イベント", tiles: [] },
  ],
  events: [],
}
```

### レイヤーの役割

- `ground`: 草、土、道、水、石などの地面
- `terrain`: 崖、森の壁、通行不可地形など
- `object`: 木、岩、建物、看板、飾りなど
- `event`: イベント用の配置情報

## タイル定義の基本

`window.HEALER_TILE_DEFS` に各タイルを定義します。

```js
grass: {
  id: "grass",
  name: "草地",
  image: "map/img_tile/base_seamless/grass_plain_01.png",
  passable: true,
  tags: ["ground"],
}
```

### 主な項目

- `id`: タイルID
- `name`: 表示名
- `image`: 画像パス
- `passable`: 通行可能かどうか
- `tags`: 用途分類

## タイル方針

- 標準タイルサイズは `48`
- 草、土、道、水、石などの繰り返し地形は、できるだけ低コントラストのシームレスタイルを使う
- 花、濃い草、ひび割れ石、かぶせ用タイルなどの強い見た目は、変化用・強調用として使う
- 建物や配置物は `object` レイヤーへ置く
- 森の壁や崖のような通行不可地形は `terrain` レイヤーへ置く

## 建物オブジェクトについて

町の正面建物アセットは、現在 `144x96` の透過 PNG を使っています。  
`tileMaps.js` では `3x2` の object タイルとして扱います。

現在使っている主な建物ID:

- `armorShopFront`
- `weaponShopFront`
- `innFront`
- `requestOfficeFront`
- `itemShopFront`

## 現在共有されているマップ

- `startTown01`: 始まりの町の正式マップ
- `forestTest01`: 更新済みの森テストマップ
- `forest2`: 追加された森マップ
- `flower`: 花エリア用マップ

## startTown01 について

- サイズは `width: 15`, `height: 8`
- エディター書き出し版をベースに `tileMaps.js` へ反映済み
- 建物配置は以下の通り
  - 防具屋: `(4, 0)`
  - 武器屋: `(8, 0)`
  - 宿屋: `(3, 3)`
  - 依頼所: `(6, 3)`
  - アイテム屋: `(9, 3)`

各建物には対応する `buildingArea` イベントも設定済みです。

## メモ

- 文字化けが起きやすい共有文は、無理に日本語へ統一せず英語を使っても大丈夫です
- マップ担当以外が読むことを考えて、ID・ファイル名・レイヤー名はなるべく一貫させてください
