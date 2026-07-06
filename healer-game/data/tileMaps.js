(() => {
  "use strict";

  // Tile images are optional for now. When assets are ready, set image to a path
  // such as "img/tiles/forest/grass.png".
  window.HEALER_TILE_DEFS = {
    grass: {
      id: "grass",
      name: "草地",
      image: null,
      passable: true,
      tags: ["ground"],
    },
    road: {
      id: "road",
      name: "道",
      image: null,
      passable: true,
      tags: ["ground", "road"],
    },
    wall: {
      id: "wall",
      name: "壁",
      image: null,
      passable: false,
      tags: ["block"],
    },
    water: {
      id: "water",
      name: "水辺",
      image: null,
      passable: false,
      tags: ["water", "block"],
    },
  };

  window.HEALER_TILE_MAPS = {
    // Template only. The current hand-drawn town map is still used.
    template: {
      id: "template",
      name: "タイルマップ雛形",
      tileSize: 48,
      width: 0,
      height: 0,
      defaultTile: "grass",
      layers: [
        { id: "ground", name: "地面", tiles: [] },
        { id: "object", name: "配置物", tiles: [] },
      ],
      events: [],
    },
  };
})();
