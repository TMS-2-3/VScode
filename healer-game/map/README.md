# Map Folder

マップ担当者が基本的に作業する場所です。

- `tileMaps.js`: タイル定義とマップ定義を書くファイル
- `img_tile/`: 将来的にマップ用タイル画像を置く場所

原則として、マップ追加やタイル設定の変更はこの `map` フォルダ内で行います。
通行判定や描画の仕組みを変える必要がある場合だけ、プログラム担当に相談して `world/tileMapSystem.js` 側を変更します。

## 共同開発者向け共有

- マップ設定の基本データはこの `map` フォルダに集約します。
- タイル定義とマップ定義は `map/tileMaps.js` に書きます。
- タイル画像は `map/img_tile/` に置き、画像パスも `map/img_tile/...` で指定します。
- 旧 `data/tileMaps.js` がある場合は使わず、`map/tileMaps.js` を正とします。
- 現在のゲーム本体へタイルマップが未接続の場合でも、マップ制作用データは先にここへ増やして構いません。

## タイル定義の書き方

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

主な項目:

- `id`: プログラムで使う識別名。半角英数字と `_` 推奨。
- `name`: 画面表示や確認用の日本語名。
- `image`: 画像パス。画像未作成なら `null` で仮置き。
- `passable`: キャラクターが通れるなら `true`、通れないなら `false`。
- `tags`: タイルの分類。例: `ground`, `road`, `water`, `block`, `decoration`, `event`。

## マップ定義の書き方

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

レイヤーの目安:

- `ground`: 草地、土、道、床などの地面。
- `object`: 木、岩、壁、建物、水辺など、通行や見た目に影響するもの。
- `event`: 出入口、会話、採取ポイントなど、後でイベントにしたい場所。


## 境界キャッシュ方針

今後の基本方針は、マップ担当が境界用タイルを手で大量配置するのではなく、プログラム側で隣接タイルを見て境界を自動合成し、合成済み画像をキャッシュして描画する方式です。

- マップデータは `grass`, `road`, `soil`, `water`, `tree` などのシンプルなタイル配置を優先します。
- 草と土、草と水、森と草地などの境界は、読み込み時またはマップ更新時に自動判定します。
- 判定結果は一時キャンバス、または将来的にはチャンク単位のキャンバスに描いてキャッシュします。
- ゲーム中はキャッシュ済みの見た目を描くだけにして、毎フレームの境界合成を避けます。
- 通行判定やイベント判定は、キャッシュ画像ではなく元のタイルデータを見ます。

仮素材として `grassOverSoilPatch` や `grassEdgeTop` などの重ね用タイルも残していますが、最終的には手置き用ではなく、境界キャッシュを作るための合成素材として使う想定です。

## 現在のRPG風タイル素材

参考画像のような村・森マップに寄せた初期素材を `img_tile/rpg_village/` に置いています。

- `rpg_terrain_atlas.png`: 生成元の4x4タイルシート
- `grass_base_01.png`: 草地
- `grass_flower_01.png`: 花つき草地
- `grass_deep_01.png`: 濃い草地
- `dirt_path_center_01.png`: 土道
- `dirt_grass_blend_01.png`: 草土なじみ
- `forest_wall_leaf_01.png`: 森の壁
- `forest_wall_pine_01.png`: 針葉樹の森
- `water_deep_01.png`: 水面
- `water_shore_01.png`: 水際
- `stone_path_01.png`: 石道
- `flower_meadow_01.png`: 花畑草地


## 追加タイル素材

`img_tile/rpg_village_extra/` には、地面・地形系の追加タイルを置いています。

- 草地の濃淡、野花、苔草、踏まれた草
- 丸石道、ひび割れ石道、木床、畑
- 砂地、ぬかるみ、浅瀬、湿地
- 崖上、崖壁、森影、広場土

`img_tile/rpg_objects/` には、地面の上に置く配置物を置いています。こちらは透明PNGです。

- 単体の木、針葉樹、低木、花
- 岩、切り株、倒木、草飾り
- 看板、柵、木箱、樽
- 井戸、街灯、石碑、木橋

整理方針:

- `ground`: キャラが立つ地面です。
- `terrainBlock`: 森の壁、崖、壁など、地形として通れないものです。
- `object`: 木箱、看板、井戸など、あとから置いた配置物です。
