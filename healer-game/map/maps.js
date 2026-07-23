(() => {
  "use strict";

  // Map layouts assembled from the tile definitions in tile.js.

  window.HEALER_TILE_MAPS = {

    // Template only. Copy this when adding a new map.

    template: {

      id: "template",

      name: "テンプレート",

      tileSize: 48,

      width: 0,

      height: 0,

      defaultTile: "grass",

      layers: [

        { id: "ground", name: "地面", tiles: [] },

        { id: "object", name: "配置物", tiles: [] },

        { id: "event", name: "イベント", tiles: [] },

      ],

      events: [],

    },



    kuraku_forest_1: {
      id: "kuraku_forest_1",
      name: "クラク森1",
      tileSize: 48,
      width: 33,
      height: 21,
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
                      "targetMap": "forest2",
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



    forest2: {
      id: "forest2",
      name: "森テスト02",
      tileSize: 48,
      width: 30,
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
                    "message": "依頼所に行こう!",
                    "messageTimer": 3,
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
                    "targetCol": 1,
                    "targetRow": 3
            }
    ],
  };
  window.HEALER_DEBUG_TILE_MAPS = [
    { id: "startTown01", label: "クラク村" },
    { id: "kuraku_forest_1", label: "クラク森1" },
    { id: "forest2", label: "森テスト02" },
    { id: "flower", label: "花マップ" },
  ];
})();
