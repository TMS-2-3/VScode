(() => {
  "use strict";

  // Map layouts assembled from the tile definitions in tile.js.

  window.HEALER_TILE_MAPS = {
    otoru_village: {
      id: "otoru_village",
      name: "オトール村",
      tileSize: 48,
      width: 38,
      height: 22,
      defaultTile: "grass",
      marginTiles: {
        ground: "test_grass",
        terrain: null,
        object: "tree",
        event: null,
      },
      layers: [
        {
          id: "ground",
          name: "地面",
          tiles: [
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "villageTile04", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "villageTile04", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "villageTile04", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "villageTile04", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "villageTile04", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "villageTile04", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "villageTile04", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "grassBase", "grassBase", "grassBase", "grassBase", "villageTile04", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "grassBase", "grassBase", "test_grass", "test_grass", "villageTile04", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "villageTile04", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "villageTile04", "villageTile04", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "villageTile04", "villageTile04", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "villageTile04", "villageTile04", "villageTile04", "grassBase", "grassBase", "villageTile04", "villageTile04", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "villageTile04", "villageTile04", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassFlower", "test_grass", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "villageTile04", "test_grass", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass", "test_grass", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "villageTile04", "test_grass", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "villageTile04", "test_grass", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "villageTile04", "test_grass", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "villageTile04", "test_grass", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
            "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "villageTile04", "test_grass", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "grassBase", "test_grass", "test_grass", "test_grass",
          ],
        },
        {
          id: "terrain",
          name: "地形",
          tiles: [
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          ],
        },
        {
          id: "object",
          name: "配置物",
          tiles: [
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, "decorSideLeft01CottageThatch", null, null, null, null, null, "weaponShopFront", null, null, "armorShopFront", null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, "innFront", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, "decorSideLeft14StoneWorkshop", null, null, "requestOfficeFront", null, null, "itemShopFront", null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          ],
        },
        {
          id: "event",
          name: "イベント",
          tiles: [
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          ],
        }
      ],
      events: [
        {
          id: "otoru_village_weapon_shop_area",
          name: "武器屋エリア",
          type: "buildingArea",
          x: 21,
          y: 6,
          width: 3,
          height: 2,
          tileId: "weaponShopFront",
        },
        {
          id: "otoru_village_armor_shop_area",
          name: "防具屋エリア",
          type: "buildingArea",
          x: 24,
          y: 6,
          width: 3,
          height: 2,
          tileId: "armorShopFront",
        },
        {
          id: "otoru_village_inn_area",
          name: "宿屋エリア",
          type: "buildingArea",
          x: 10,
          y: 10,
          width: 3,
          height: 2,
          tileId: "innFront",
        },
        {
          id: "otoru_village_request_office_area",
          name: "依頼所エリア",
          type: "buildingArea",
          x: 20,
          y: 11,
          width: 3,
          height: 2,
          tileId: "requestOfficeFront",
        },
        {
          id: "otoru_village_item_shop_area",
          name: "アイテム屋エリア",
          type: "buildingArea",
          x: 23,
          y: 11,
          width: 3,
          height: 2,
          tileId: "itemShopFront",
        },
        {
          id: "otoru_village_weapon_shop_interaction",
          name: "weapon shop interaction",
          type: "facilityInteraction",
          trigger: "interact",
          x: 21,
          y: 8,
          width: 3,
          height: 1,
          facilityId: "weapon",
          facing: "up",
        },
        {
          id: "otoru_village_armor_shop_interaction",
          name: "armor shop interaction",
          type: "facilityInteraction",
          trigger: "interact",
          x: 24,
          y: 8,
          width: 3,
          height: 1,
          facilityId: "armor",
          facing: "up",
        },
        {
          id: "otoru_village_inn_interaction",
          name: "inn interaction",
          type: "facilityInteraction",
          trigger: "interact",
          x: 10,
          y: 12,
          width: 3,
          height: 1,
          facilityId: "inn",
          facing: "up",
        },
        {
          id: "otoru_village_request_office_interaction",
          name: "request office interaction",
          type: "facilityInteraction",
          trigger: "interact",
          x: 20,
          y: 13,
          width: 3,
          height: 1,
          facilityId: "guild",
          facing: "up",
        },
        {
          id: "otoru_village_item_shop_interaction",
          name: "item shop interaction",
          type: "facilityInteraction",
          trigger: "interact",
          x: 23,
          y: 13,
          width: 3,
          height: 1,
          facilityId: "item",
          facing: "up",
        },
        {
          id: "otoru_village_to_north_forest",
          name: "北クラク森へ",
          type: "mapTransfer",
          trigger: "step",
          x: 19,
          y: 18,
          width: 1,
          height: 1,
          targetMap: "kuraku_forest_4",
          targetCol: 17,
          targetRow: 0,
        },
      ],
    },


    kuraku_forest_1: {
      id: "kuraku_forest_1",
      name: "西クラク森",
      tileSize: 48,
      width: 33,
      height: 21,
      defaultTile: "grass",
      marginTiles: {
        ground: "test_grass",
        terrain: null,
        object: "tree",
        event: null,
      },
      layers: [
        {
          id: "ground",
          name: "地面",
          tiles: [
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          ],
        },
        {
          id: "terrain",
          name: "地形",
          tiles: [
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          ],
        },
        {
          id: "object",
          name: "配置物",
          tiles: [
            "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            "tree", "tree", null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, "tree", "tree", "tree", null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          ],
        },
        {
          id: "event",
          name: "イベント",
          tiles: [
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          ],
        }
      ],
      symbolEncounters: [
        {
          id: "wild_horn_rabbit",
          name: "ツノウサギ",
          symbolLabel: "兎",
          color: "#d2b16a",
          enemyId: "horn_rabbit",
          enemyCountMin: 2,
          enemyCountMax: 4,
          maxSymbols: 3,
          objective: "ツノウサギを討伐する",
          reward: "魔物ドロップ",
          requiresQuestCompleted: "story_horn_rabbit_competition_001",
        },
        {
          id: "wild_bud_alraune",
          name: "つぼみのアルラウネ",
          symbolLabel: "蕾",
          color: "#76a96a",
          enemyId: "bud_alraune",
          enemyCountMin: 2,
          enemyCountMax: 4,
          maxSymbols: 3,
          objective: "つぼみのアルラウネを討伐する",
          reward: "魔物ドロップ",
          requiresQuestCompleted: "story_horn_rabbit_competition_001",
        },
      ],
      events: [
              {
                      "id": "forest_to_start_town",
                      "name": "始まりの町へ",
                      "type": "mapTransfer",
                      "trigger": "step",
                      "x": 2,
                      "y": 0,
                      "width": 1,
                      "height": 1,
                      "targetMap": "startTown01",
                      "targetCol": 19,
                      "targetRow": 17
              },
              {
                      "id": "forest1_to_forest2",
                      "name": "クラク森2へ",
                      "type": "mapTransfer",
                      "trigger": "step",
                      "x": 32,
                      "y": 6,
                      "width": 1,
                      "height": 2,
                      "targetMap": "kuraku_forest_2",
                      "targetCol": 1,
                      "targetRow": 6
              },
              {
                      "id": "forest_sign",
                      "name": "森の看板",
                      "type": "inspect",
                      "x": 9,
                      "y": 6,
                      "text": "森の奥に注意。"
              }
      ],
    },



    kuraku_forest_2: {
      id: "kuraku_forest_2",
      name: "南クラク森",
      tileSize: 48,
      width: 30,
      height: 20,
      defaultTile: "grass",
      marginTiles: {
        ground: "test_grass",
        terrain: null,
        object: "tree",
        event: null,
      },
      layers: [
        {
          id: "ground",
          name: "地面",
          tiles: [
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
            "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          ],
        },
        {
          id: "terrain",
          name: "地形",
          tiles: [
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          ],
        },
        {
          id: "object",
          name: "配置物",
          tiles: [
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree",
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree",
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
            "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          ],
        },
        {
          id: "event",
          name: "イベント",
          tiles: [
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          ],
        }
      ],
      symbolEncounters: [
        {
          id: "wild_bud_alraune",
          name: "つぼみのアルラウネ",
          symbolLabel: "蕾",
          color: "#76a96a",
          enemyId: "bud_alraune",
          enemyCountMin: 2,
          enemyCountMax: 4,
          maxSymbols: 3,
          objective: "つぼみのアルラウネを討伐する",
          reward: "魔物ドロップ",
          requiresQuestCompleted: "story_horn_rabbit_competition_001",
        },
        {
          id: "wild_shadow_wolf",
          name: "シャドウウルフ",
          symbolLabel: "狼",
          color: "#59617d",
          enemyId: "shadow_wolf",
          enemyCountMin: 2,
          enemyCountMax: 4,
          maxSymbols: 3,
          objective: "シャドウウルフを討伐する",
          reward: "魔物ドロップ",
          requiresQuestCompleted: "story_horn_rabbit_competition_001",
        },
      ],
      events: [
              {
                      "id": "forest2_to_forest1",
                      "name": "クラク森1へ",
                      "type": "mapTransfer",
                      "trigger": "step",
                      "x": 0,
                      "y": 6,
                      "width": 1,
                      "height": 2,
                      "targetMap": "kuraku_forest_1",
                      "targetCol": 31,
                      "targetRow": 6
              },
              {
                      "id": "forest2_to_forest3",
                      "name": "クラク森3へ",
                      "type": "mapTransfer",
                      "trigger": "step",
                      "x": 24,
                      "y": 0,
                      "width": 1,
                      "height": 1,
                      "targetMap": "kuraku_forest_3",
                      "targetCol": 11,
                      "targetRow": 18
              }
      ],
    },



  };



  const TEXT_GROUND_SYMBOLS = {

    G: "grass",

    g: "grassPlain2",

    A: "grassBase",

    D: "grassDeep",

    R: "road",

    r: "dirtPathCenter",

    d: "dirtPathDetail",

    S: "soil",

    W: "water",

    w: "waterDeep",

    K: "stonePlain",

    C: "cobblestonePath",

    M: "mudGround",

    ".": "grass",

    " ": "grass",

  };



  const TEXT_LAYER_SYMBOLS = {

    F: "forestWallLeaf",

    P: "forestWallPine",

    C: "wall",

    T: "tree",

    p: "pineTree",

    B: "shrubCluster",

    O: "rock",

    f: "flowerPatchObject",

    s: "sign",

    L: "fallenLog",

    w: "well",

    l: "lampPost",

    h: "villageShrubCluster",

    H: "townHouseFront",

    ".": null,

    " ": null,

  };



  function getMaxTextWidth(rowGroups) {

    let width = 0;

    rowGroups.forEach((rows) => {

      (rows || []).forEach((row) => {

        width = Math.max(width, String(row).length);

      });

    });

    return width;

  }



  function getMaxTextHeight(rowGroups) {

    return rowGroups.reduce((height, rows) => Math.max(height, (rows || []).length), 0);

  }



  function rowsToTiles(rows, symbols, width, height, fallbackTile) {

    const tiles = [];



    for (let y = 0; y < height; y += 1) {

      const row = String((rows || [])[y] || "");



      for (let x = 0; x < width; x += 1) {

        const mark = row[x] || " ";

        const hasSymbol = Object.prototype.hasOwnProperty.call(symbols, mark);

        tiles.push(hasSymbol ? symbols[mark] : fallbackTile);

      }

    }



    return tiles;

  }



  function createTextLayoutMap(spec) {

    const groundRows = spec.groundRows || [];

    const terrainRows = spec.terrainRows || [];

    const objectRows = spec.objectRows || [];

    const rowGroups = [groundRows, terrainRows, objectRows];

    const width = spec.width || getMaxTextWidth(rowGroups);

    const height = spec.height || getMaxTextHeight(rowGroups);

    const defaultTile = spec.defaultTile || "grass";

    const groundSymbols = Object.assign({}, TEXT_GROUND_SYMBOLS, spec.groundSymbols || {});

    const layerSymbols = Object.assign({}, TEXT_LAYER_SYMBOLS, spec.layerSymbols || {});



    return {

      id: spec.id,

      name: spec.name,

      tileSize: spec.tileSize || 48,

      width,

      height,

      defaultTile,

      layers: [

        {

          id: "ground",

          name: "Ground",

          tiles: rowsToTiles(groundRows, groundSymbols, width, height, defaultTile),

        },

        {

          id: "terrain",

          name: "Terrain",

          tiles: rowsToTiles(terrainRows, layerSymbols, width, height, null),

        },

        {

          id: "object",

          name: "Object",

          tiles: rowsToTiles(objectRows, layerSymbols, width, height, null),

        },

      ],

      events: spec.events || [],

    };

  }



  window.HEALER_TEXT_TILE_SYMBOLS = {

    ground: TEXT_GROUND_SYMBOLS,

    layer: TEXT_LAYER_SYMBOLS,

  };

  window.HEALER_CREATE_TEXT_LAYOUT_MAP = createTextLayoutMap;

  function createCaveMap(spec) {
    const width = spec.width;
    const height = spec.height;
    const cellCount = width * height;
    const groundTiles = Array(cellCount).fill("caveFloor01");
    const terrainTiles = Array(cellCount).fill(null);
    const objectTiles = Array(cellCount).fill(null);
    const eventTiles = Array(cellCount).fill(null);
    const indexOf = (x, y) => y * width + x;
    const inBounds = (x, y) => x >= 0 && y >= 0 && x < width && y < height;
    const setTile = (tiles, x, y, tileId) => {
      if (inBounds(x, y)) tiles[indexOf(x, y)] = tileId;
    };

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const variation = (x * 37 + y * 53 + spec.seed * 97) % 31;
        if (variation === 0) setTile(groundTiles, x, y, "caveFloorCracked01");
        else if (variation <= 4) setTile(groundTiles, x, y, "caveFloor02");
      }
    }

    (spec.groundPatches || []).forEach((patch) => {
      const radiusX = Math.max(1, patch.radiusX);
      const radiusY = Math.max(1, patch.radiusY);
      for (let y = patch.centerY - radiusY; y <= patch.centerY + radiusY; y += 1) {
        for (let x = patch.centerX - radiusX; x <= patch.centerX + radiusX; x += 1) {
          const distance = ((x - patch.centerX) / radiusX) ** 2 + ((y - patch.centerY) / radiusY) ** 2;
          const edgeBreak = (x * 11 + y * 7 + spec.seed) % 6 === 0;
          if (distance <= 1 && !(distance > 0.7 && edgeBreak)) {
            setTile(groundTiles, x, y, patch.tileId);
          }
        }
      }
    });

    for (let x = 0; x < width; x += 1) {
      setTile(terrainTiles, x, 0, "caveWallHorizontalV2");
      setTile(terrainTiles, x, height - 1, "caveWallHorizontalV2");
    }
    for (let y = 0; y < height; y += 1) {
      setTile(terrainTiles, 0, y, "caveWallVerticalV2");
      setTile(terrainTiles, width - 1, y, "caveWallVerticalV2");
    }

    (spec.horizontalWalls || []).forEach((wall) => {
      const gaps = new Set(wall.gaps || []);
      for (let x = wall.startX; x <= wall.endX; x += 1) {
        if (!gaps.has(x)) setTile(terrainTiles, x, wall.y, "caveWallHorizontalV2");
      }
    });
    (spec.verticalWalls || []).forEach((wall) => {
      const gaps = new Set(wall.gaps || []);
      for (let y = wall.startY; y <= wall.endY; y += 1) {
        if (!gaps.has(y)) setTile(terrainTiles, wall.x, y, "caveWallVerticalV2");
      }
    });
    (spec.wallBlocks || []).forEach(([x, y]) => setTile(terrainTiles, x, y, "caveWallPillarV2"));
    (spec.openings || []).forEach(([x, y]) => setTile(terrainTiles, x, y, null));
    (spec.objects || []).forEach(([tileId, x, y]) => setTile(objectTiles, x, y, tileId));

    return {
      id: spec.id,
      name: spec.name,
      tileSize: 48,
      width,
      height,
      defaultTile: "caveFloor01",
      marginTiles: {
        ground: "caveFloor01",
        terrain: "caveWallPillarV2",
        object: null,
        event: null,
      },
      layers: [
        { id: "ground", name: "地面", tiles: groundTiles },
        { id: "terrain", name: "地形", tiles: terrainTiles },
        { id: "object", name: "配置物", tiles: objectTiles },
        { id: "event", name: "イベント", tiles: eventTiles },
      ],
      events: spec.events || [],
    };
  }



  window.HEALER_TILE_MAPS.startTown01 = {
    id: "startTown01",
    name: "クラク村",
    tileSize: 48,
    width: 35,
    height: 19,
    defaultTile: "grass",
    marginTiles: {
      ground: "test_grass",
      terrain: null,
      object: "tree",
      event: null,
    },
    layers: [
      {
        id: "ground",
        name: "地面",
        tiles: [
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "villageTile04", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
        ],
      },
      {
        id: "terrain",
        name: "地形",
        tiles: [
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        ],
      },
      {
        id: "object",
        name: "配置物",
        tiles: [
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "fallenLog", null, null, "weaponShopFront", null, null, null, "armorShopFront", null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, "shrubCluster", null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, "well", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, "innFront", null, null, "requestOfficeFront", null, null, "itemShopFront", null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, "fallenLog", null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
        ],
      },
      {
        id: "event",
        name: "イベント",
        tiles: [
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        ],
      }
    ],
    events: [
            {
                    "id": "start_town_armor_shop_area",
                    "name": "防具屋エリア",
                    "type": "buildingArea",
                    "x": 20,
                    "y": 3,
                    "width": 3,
                    "height": 2,
                    "tileId": "armorShopFront"
            },
            {
                    "id": "start_town_weapon_shop_area",
                    "name": "武器屋エリア",
                    "type": "buildingArea",
                    "x": 16,
                    "y": 3,
                    "width": 3,
                    "height": 2,
                    "tileId": "weaponShopFront"
            },
            {
                    "id": "start_town_inn_area",
                    "name": "宿屋エリア",
                    "type": "buildingArea",
                    "x": 15,
                    "y": 7,
                    "width": 3,
                    "height": 2,
                    "tileId": "innFront"
            },
            {
                    "id": "start_town_request_office_area",
                    "name": "依頼所エリア",
                    "type": "buildingArea",
                    "x": 18,
                    "y": 7,
                    "width": 3,
                    "height": 2,
                    "tileId": "requestOfficeFront"
            },
            {
                    "id": "start_town_item_shop_area",
                    "name": "アイテム屋エリア",
                    "type": "buildingArea",
                    "x": 21,
                    "y": 7,
                    "width": 3,
                    "height": 2,
                    "tileId": "itemShopFront"
            },
            {
                    "id": "start_town_intro_gate_prompt",
                    "name": "依頼所案内",
                    "type": "guidedStep",
                    "trigger": "step",
                    "x": 19,
                    "y": 17,
                    "width": 1,
                    "height": 1,
                    "dialogue": [
                            {
                                    "text": "依頼所に向かおう"
                            }
                    ],
                    "facing": "up",
                    "moveX": 0,
                    "moveY": -1,
                    "disabledWhenMeetingDone": true
            },
            {
                    "id": "start_town_intro_ulpes",
                    "name": "ウルペス",
                    "type": "partyJoinNpc",
                    "trigger": "interact",
                    "x": 18,
                    "y": 9,
                    "width": 1,
                    "height": 1,
                    "npcId": "ulpes",
                    "facing": "right",
                    "blocking": true,
                    "disabledWhenMeetingDone": true
            },
            {
                    "id": "start_town_intro_rihas",
                    "name": "リハス",
                    "type": "partyJoinNpc",
                    "trigger": "interact",
                    "x": 19,
                    "y": 10,
                    "width": 1,
                    "height": 1,
                    "npcId": "rihas",
                    "facing": "up",
                    "blocking": true,
                    "disabledWhenMeetingDone": true
            },
            {
                    "id": "start_town_intro_sushia",
                    "name": "スシア",
                    "type": "partyJoinNpc",
                    "trigger": "interact",
                    "x": 20,
                    "y": 9,
                    "width": 1,
                    "height": 1,
                    "npcId": "sushia",
                    "facing": "left",
                    "blocking": true,
                    "disabledWhenMeetingDone": true
            },
            {
                    "id": "start_town_weapon_shop_interaction",
                    "name": "weapon shop interaction",
                    "type": "facilityInteraction",
                    "trigger": "interact",
                    "x": 16,
                    "y": 5,
                    "width": 3,
                    "height": 1,
                    "facilityId": "weapon",
                    "facing": "up"
            },
            {
                    "id": "start_town_armor_shop_interaction",
                    "name": "armor shop interaction",
                    "type": "facilityInteraction",
                    "trigger": "interact",
                    "x": 20,
                    "y": 5,
                    "width": 3,
                    "height": 1,
                    "facilityId": "armor",
                    "facing": "up"
            },
            {
                    "id": "start_town_inn_interaction",
                    "name": "inn interaction",
                    "type": "facilityInteraction",
                    "trigger": "interact",
                    "x": 15,
                    "y": 9,
                    "width": 3,
                    "height": 1,
                    "facilityId": "inn",
                    "facing": "up"
            },
            {
                    "id": "start_town_request_office_interaction",
                    "name": "request office interaction",
                    "type": "facilityInteraction",
                    "trigger": "interact",
                    "x": 18,
                    "y": 9,
                    "width": 3,
                    "height": 1,
                    "facilityId": "guild",
                    "facing": "up"
            },
            {
                    "id": "start_town_item_shop_interaction",
                    "name": "item shop interaction",
                    "type": "facilityInteraction",
                    "trigger": "interact",
                    "x": 21,
                    "y": 9,
                    "width": 3,
                    "height": 1,
                    "facilityId": "item",
                    "facing": "up"
            },
            {
                    "id": "start_town_to_forest_test01",
                    "name": "森テスト01へ",
                    "type": "mapTransfer",
                    "trigger": "step",
                    "x": 19,
                    "y": 17,
                    "width": 1,
                    "height": 2,
                    "targetMap": "kuraku_forest_1",
                    "targetCol": 2,
                    "targetRow": 1
            }
    ],
  };
  window.HEALER_TILE_MAPS.kuraku_forest_3 = {
    id: "kuraku_forest_3",
    name: "花畑",
    tileSize: 48,
    width: 25,
    height: 20,
    defaultTile: "grass",
    marginTiles: {
      ground: "grass",
      terrain: null,
      object: null,
      event: null,
    },
    layers: [
      {
        id: "ground",
        name: "地面",
        tiles: [
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "flowerMeadow", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
        ],
      },
      {
        id: "terrain",
        name: "地形",
        tiles: [
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        ],
      },
      {
        id: "object",
        name: "配置物",
        tiles: [
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree",
          "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree",
          "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree",
          "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree",
          "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree",
          "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree",
          "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
        ],
      },
      {
        id: "event",
        name: "イベント",
        tiles: [
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        ],
      }
    ],
    events: [
            {
                    "id": "forest3_to_forest2",
                    "name": "クラク森2へ",
                    "type": "mapTransfer",
                    "trigger": "step",
                    "x": 11,
                    "y": 19,
                    "width": 1,
                    "height": 1,
                    "targetMap": "kuraku_forest_2",
                    "targetCol": 24,
                    "targetRow": 1
            },
            {
                    "id": "flower_to_north_forest",
                    "name": "北クラク森へ",
                    "type": "mapTransfer",
                    "trigger": "step",
                    "x": 12,
                    "y": 0,
                    "width": 1,
                    "height": 1,
                    "targetMap": "kuraku_forest_4",
                    "targetCol": 17,
                    "targetRow": 24
            }
    ],
  };
  window.HEALER_TILE_MAPS.kuraku_forest_4 = {
    id: "kuraku_forest_4",
    name: "北クラク森",
    tileSize: 48,
    width: 35,
    height: 25,
    defaultTile: "grass",
    marginTiles: {
      ground: "grass",
      terrain: null,
      object: null,
      event: null,
    },
    layers: [
      {
        id: "ground",
        name: "地面",
        tiles: [
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "flowerMeadow", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "flowerMeadow", "flowerMeadow", "flowerMeadow", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "flowerMeadow", "flowerMeadow", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "flowerMeadow", "flowerMeadow", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "flowerMeadow", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "flowerMeadow", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
          "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass", "test_grass",
        ],
      },
      {
        id: "terrain",
        name: "地形",
        tiles: [
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        ],
      },
      {
        id: "object",
        name: "配置物",
        tiles: [
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, "fallenLog", null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, null, null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
          "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", null, "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree", "tree",
        ],
      },
      {
        id: "event",
        name: "イベント",
        tiles: [
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        ],
      }
    ],
    events: [
            {
                    "id": "north_forest_to_flower",
                    "name": "花畑へ",
                    "type": "mapTransfer",
                    "trigger": "step",
                    "x": 17,
                    "y": 24,
                    "width": 1,
                    "height": 1,
                    "targetMap": "kuraku_forest_3",
                    "targetCol": 12,
                    "targetRow": 0
            },
            {
                    "id": "north_forest_to_otoru_village",
                    "name": "オトール村へ",
                    "type": "mapTransfer",
                    "trigger": "step",
                    "x": 17,
                    "y": 0,
                    "width": 1,
                    "height": 1,
                    "targetMap": "otoru_village",
                    "targetCol": 19,
                    "targetRow": 18
            }
    ],
  };
  window.HEALER_TILE_MAPS.cave01 = {
    ...createCaveMap({
      id: "cave01",
      name: "洞窟1",
      width: 40,
      height: 22,
      seed: 1,
      openings: [[0, 18], [39, 3]],
      groundPatches: [
        { tileId: "caveFloorWet01", centerX: 12, centerY: 18, radiusX: 4, radiusY: 2 },
        { tileId: "caveFloorCracked01", centerX: 33, centerY: 5, radiusX: 4, radiusY: 3 },
      ],
      horizontalWalls: [
        { y: 5, startX: 14, endX: 26, gaps: [21, 22] },
        { y: 11, startX: 26, endX: 38, gaps: [32, 33] },
        { y: 15, startX: 8, endX: 25, gaps: [17, 18] },
      ],
      verticalWalls: [
        { x: 8, startY: 1, endY: 14, gaps: [11, 12] },
        { x: 26, startY: 6, endY: 20, gaps: [9, 10] },
      ],
      wallBlocks: [[8, 1], [8, 14], [8, 15], [14, 5], [25, 15], [26, 5], [26, 11], [26, 20], [38, 11]],
      objects: [
        ["caveTorch01", 2, 17],
        ["caveTorch01", 6, 19],
        ["caveCrystalBlue", 3, 3],
        ["caveStalagmite01", 5, 12],
        ["caveTorch01", 10, 10],
        ["caveCrystalBlue", 12, 18],
        ["caveStalagmite01", 18, 12],
        ["caveTorch01", 20, 14],
        ["caveCrystalBlue", 23, 7],
        ["caveStalagmite01", 29, 18],
        ["caveTorch01", 31, 9],
        ["caveCrystalBlue", 35, 5],
        ["caveStalagmite01", 36, 14],
      ],
      events: [
        {
          id: "cave01_to_cave02",
          name: "洞窟2へ",
          type: "mapTransfer",
          trigger: "step",
          x: 39,
          y: 3,
          width: 1,
          height: 1,
          targetMap: "cave02",
          targetCol: 1,
          targetRow: 18,
        },
      ],
    }),
  };

  window.HEALER_TILE_MAPS.cave02 = {
    id: "cave02",
    name: "洞窟2",
    tileSize: 48,
    width: 40,
    height: 21,
    defaultTile: "caveFloor01",
    marginTiles: {
      ground: "caveFloor01",
      terrain: "caveWallPillarV2",
      object: null,
      event: null,
    },
    layers: [
      {
        id: "ground",
        name: "地面",
        tiles: [
          "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloorWet01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02",
          "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02",
          "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01",
        ],
      },
      {
        id: "terrain",
        name: "地形",
        tiles: [
          "caveWallVerticalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", null, null, null, "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, "caveWallPillarV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallPillarV2", null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          "caveWallVerticalV2", null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallPillarV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", null, null, "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallPillarV2", "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, "caveWallPillarV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallVerticalV2", null, "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallPillarV2", "caveWallPillarV2", null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, "caveWallPillarV2", null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, "caveWallVerticalV2", "caveWallPillarV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", null, null, "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallPillarV2", "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, "caveWallPillarV2", null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallPillarV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallVerticalV2",
        ],
      },
      {
        id: "object",
        name: "配置物",
        tiles: [
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveBossDoorClosed", null, null, null, null, null, null, null, null, null, null, { tileId: "caveBossDoorOpen", rotate: 90 }, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveTorch01", null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveCrystalBlue", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, "caveCrystalBlue", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, "caveTorch01", null, null, null, null, null, null, null, null, null, "caveTorch01", null, null, null, null, null, null, null, null, null, null, null, null, null, "caveCrystalBlue", null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, "caveCrystalBlue", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveStalagmite01", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveStalagmite01", null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveTorch01", null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, "caveTorch01", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, "caveStalagmite01", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveStalagmite01", null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        ],
      },
      {
        id: "event",
        name: "イベント",
        tiles: [
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        ],
      }
    ],
    events: [
            {
                    "id": "cave02_to_cave01",
                    "name": "洞窟1へ戻る",
                    "type": "mapTransfer",
                    "trigger": "step",
                    "x": 0,
                    "y": 18,
                    "width": 1,
                    "height": 1,
                    "targetMap": "cave01",
                    "targetCol": 38,
                    "targetRow": 3
            },
            {
                    "id": "cave02_to_boss_room",
                    "name": "ボス部屋へ",
                    "type": "mapTransfer",
                    "trigger": "step",
                    "x": 39,
                    "y": 2,
                    "width": 1,
                    "height": 1,
                    "targetMap": "caveBossRoom",
                    "targetCol": 20,
                    "targetRow": 18
            }
    ],
  };

  window.HEALER_TILE_MAPS.caveBossRoom = {
    id: "caveBossRoom",
    name: "洞窟ボス部屋",
    tileSize: 48,
    width: 40,
    height: 20,
    defaultTile: "caveFloor01",
    marginTiles: {
      ground: "caveFloor01",
      terrain: "caveWallPillarV2",
      object: null,
      event: null,
    },
    layers: [
      {
        id: "ground",
        name: "地面",
        tiles: [
          "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02",
          "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloor01", "caveFloorCracked01", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor01", "caveFloor01",
          "caveFloor02", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor02", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor02",
          "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor02", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloorWet01", "caveFloorWet01", "caveFloorWet01", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorWet01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloorCracked01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloorWet01", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01",
          "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01",
          "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01",
          "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloorCracked01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor01", "caveFloor02", "caveFloor01", "caveFloor01",
        ],
      },
      {
        id: "terrain",
        name: "地形",
        tiles: [
          "caveWallVerticalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, "caveWallPillarV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", null, null, null, null, null, "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallPillarV2", null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, "caveWallPillarV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallPillarV2", null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, "caveWallPillarV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallPillarV2", null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2", null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, "caveWallPillarV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", null, null, null, null, null, "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallPillarV2", null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveWallVerticalV2",
          "caveWallVerticalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", null, null, null, null, "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallHorizontalV2", "caveWallVerticalV2",
        ],
      },
      {
        id: "object",
        name: "配置物",
        tiles: [
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveCrystalBlue", null, "caveTorch01", null, null, "caveTorch01", null, "caveCrystalBlue", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, "caveCrystalBlue", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveCrystalBlue", null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, "caveTorch01", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveTorch01", null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveTorch01", null, null, null, null, null, null, "caveTorch01", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, "caveStalagmite01", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveStalagmite01", null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "caveBossDoorOpen", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        ],
      },
      {
        id: "event",
        name: "イベント",
        tiles: [
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
          null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        ],
      }
    ],
    events: [
            {
                    "id": "boss_room_to_cave02",
                    "name": "洞窟2へ戻る",
                    "type": "mapTransfer",
                    "trigger": "step",
                    "x": 20,
                    "y": 19,
                    "width": 1,
                    "height": 1,
                    "targetMap": "cave02",
                    "targetCol": 38,
                    "targetRow": 2
            }
    ],
  };

  function placeCaveBossDoor(mapId, x, y, rotate = 0) {
    const map = window.HEALER_TILE_MAPS[mapId];
    const objectLayer = map && map.layers.find((layer) => layer.id === "object");
    if (!objectLayer || x < 0 || y < 0 || x >= map.width || y >= map.height) return;
    objectLayer.tiles[y * map.width + x] = rotate
      ? { tileId: "caveBossDoorOpen", rotate }
      : "caveBossDoorOpen";
  }

  placeCaveBossDoor("cave02", 38, 0, 90);
  placeCaveBossDoor("caveBossRoom", 19, 18);

  window.HEALER_DEBUG_TILE_MAPS = [
    { id: "startTown01", label: "クラク村" },
    { id: "kuraku_forest_1", label: "西クラク森" },
    { id: "kuraku_forest_2", label: "南クラク森" },
    { id: "kuraku_forest_3", label: "花畑" },
    { id: "kuraku_forest_4", label: "北クラク森" },
    { id: "otoru_village", label: "オトール村" },
    { id: "cave01", label: "洞窟1" },
    { id: "cave02", label: "洞窟2" },
    { id: "caveBossRoom", label: "洞窟ボス部屋" },
];
})();
