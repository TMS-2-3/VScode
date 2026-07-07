# Tile Images

マップ用タイル画像を置く場所です。

例:

- `map/img_tile/grass.png`
- `map/img_tile/road.png`
- `map/img_tile/wall.png`
- `map/img_tile/water.png`

画像がまだ無いタイルは、`map/tileMaps.js` 側の `image` を `null` にして仮登録できます。


## rpg_village

参考画像のような村・森マップ向けのRPG風タイル素材です。

- `rpg_village/rpg_terrain_atlas.png`: 生成元の4x4タイルシート
- `rpg_village/grass_base_01.png`: 草地
- `rpg_village/dirt_path_center_01.png`: 土道
- `rpg_village/forest_wall_leaf_01.png`: 森の壁
- `rpg_village/water_deep_01.png`: 水面

このフォルダーの画像は、`tileMaps.js` の基本タイルに登録済みです。

## rpg_village_extra

地面・地形系の追加タイルです。48pxの通常タイルとして使います。

## rpg_objects

配置物用の透明PNGです。96pxで切り出してあり、`tileMaps.js` 側の `drawWidth/drawHeight/drawOffset` で48pxマスに対して少し大きく表示します。
