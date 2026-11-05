(function initSavedDungeonProfiles(root) {
  "use strict";

  const data = /* DUNGEON_PROFILES_DATA_START */
{
  "format": "healer-dungeon-profiles",
  "version": 1,
  "profiles": [
    {
      "id": "dungeon_1",
      "name": "新規作成1",
      "config": {
        "schemaVersion": 1,
        "id": "dungeon_1",
        "name": "新規作成1",
        "theme": "generic_dungeon",
        "scale": 2,
        "danger": 3,
        "width": 60,
        "height": 40,
        "retryLimit": null,
        "generator": {
          "type": "digger",
          "roomWidth": [
            4,
            9
          ],
          "roomHeight": [
            4,
            7
          ],
          "corridorLength": [
            2,
            8
          ],
          "dugPercentage": 0.2,
          "timeLimit": 1000,
          "roomShape": {
            "roundingChance": 0.55,
            "maxCornerRadius": 3
          },
          "corridorShape": {
            "enabled": true,
            "minWidth": 1,
            "maxWidth": 5,
            "bulgeChance": 0.65,
            "roundingChance": 0.55
          }
        },
        "entranceApproach": {
          "enabled": true,
          "startDirections": [
            "down",
            "left",
            "up",
            "right"
          ],
          "minLength": 3,
          "maxLength": 18,
          "maxTurns": 2,
          "turnChance": 0.45
        },
        "exitApproach": {
          "enabled": true,
          "endDirections": [
            "up",
            "right",
            "down",
            "left"
          ],
          "minLength": 3,
          "maxLength": 18,
          "maxTurns": 2,
          "turnChance": 0.45
        },
        "validation": {
          "minRooms": 6,
          "maxRooms": 12,
          "minMainPathLength": 30,
          "minBranchRooms": 2,
          "minFloorRatio": 0.12,
          "maxFloorRatio": 0.36
        },
        "roomRoles": {
          "treasureCount": [
            0,
            0
          ],
          "treasureCornerBias": 0.85,
          "restCount": [
            0,
            0
          ],
          "restPathRange": [
            0.6,
            0.85
          ]
        },
        "branchContents": {
          "enabled": true,
          "minPathLength": 3,
          "outcomes": {
            "empty": 0.31,
            "trap": 0.31,
            "treasure": 0.31,
            "both": 0.07
          }
        },
        "tiles": {
          "floorTileId": "test_grass",
          "wallTileId": "test_grass",
          "path": [
            "test_grass"
          ],
          "room": [
            "test_grass"
          ],
          "wall": [
            "test_grass",
            "tree"
          ],
          "pathWall": [
            "test_grass",
            "tree"
          ],
          "roomWall": [
            "test_grass",
            "tree"
          ],
          "wallHeight": 0,
          "margin": [
            "test_grass",
            "tree"
          ]
        },
        "treasureTable": {
          "rolls": [
            1,
            1
          ],
          "entries": [
            {
              "type": "item",
              "id": "wound_medicine",
              "name": "傷薬",
              "weight": 1,
              "minCount": 1,
              "maxCount": 3
            }
          ]
        },
        "enemyPool": [
          {
            "id": "horn_rabbit",
            "name": "兎",
            "weight": 1
          },
          {
            "id": "bud_alraune",
            "name": "蕾",
            "weight": 1
          },
          {
            "id": "shadow_wolf",
            "name": "狼",
            "weight": 1
          }
        ],
        "placements": {
          "enemyCount": [
            4,
            8
          ],
          "trapCount": [
            0,
            0
          ],
          "decorationCount": [
            0,
            0
          ],
          "minEnemySpacing": 2,
          "minTrapSpacing": 2
        },
        "safety": {
          "entranceClearance": 8,
          "exitClearance": 2
        },
        "mandatoryEvents": []
      },
      "preview": {
        "seed": "88wk45-3elujp",
        "viewOptions": {
          "path": true,
          "rooms": true,
          "placements": true,
          "grid": false
        }
      }
    },
    {
      "id": "dungeon_2",
      "name": "新規作成2",
      "config": {
        "schemaVersion": 1,
        "id": "dungeon_2",
        "name": "新規作成2",
        "theme": "generic_dungeon",
        "scale": 3,
        "danger": 3,
        "width": 60,
        "height": 40,
        "retryLimit": null,
        "generator": {
          "type": "digger",
          "roomWidth": [
            4,
            9
          ],
          "roomHeight": [
            4,
            7
          ],
          "corridorLength": [
            2,
            8
          ],
          "dugPercentage": 0.2,
          "timeLimit": 1000,
          "roomShape": {
            "roundingChance": 0.55,
            "maxCornerRadius": 3
          },
          "corridorShape": {
            "enabled": true,
            "minWidth": 1,
            "maxWidth": 5,
            "bulgeChance": 0.65,
            "roundingChance": 0.55
          }
        },
        "entranceApproach": {
          "enabled": true,
          "startDirections": [
            "down",
            "left",
            "up",
            "right"
          ],
          "minLength": 3,
          "maxLength": 18,
          "maxTurns": 2,
          "turnChance": 0.45
        },
        "exitApproach": {
          "enabled": true,
          "endDirections": [
            "up",
            "right",
            "down",
            "left"
          ],
          "minLength": 3,
          "maxLength": 18,
          "maxTurns": 2,
          "turnChance": 0.45
        },
        "validation": {
          "minRooms": 6,
          "maxRooms": 12,
          "minMainPathLength": 30,
          "minBranchRooms": 2,
          "minFloorRatio": 0.12,
          "maxFloorRatio": 0.36
        },
        "roomRoles": {
          "treasureCount": [
            1,
            1
          ],
          "treasureCornerBias": 0.85,
          "restCount": [
            0,
            0
          ],
          "restPathRange": [
            0.6,
            0.85
          ]
        },
        "branchContents": {
          "enabled": true,
          "minPathLength": 3,
          "outcomes": {
            "empty": 0.31,
            "trap": 0.31,
            "treasure": 0.31,
            "both": 0.07
          }
        },
        "tiles": {
          "floorTileId": "caveFloor01",
          "wallTileId": "caveWallHorizontalV2",
          "path": [
            "caveFloor01"
          ],
          "room": [
            "caveFloor01"
          ],
          "wall": [
            "caveWallHorizontalV2"
          ],
          "pathWall": [
            "caveWallHorizontalV2"
          ],
          "roomWall": [
            "caveWallHorizontalV2"
          ],
          "wallHeight": 2,
          "margin": [
            "caveWallPillarV2"
          ]
        },
        "treasureTable": {
          "rolls": [
            1,
            1
          ],
          "entries": [
            {
              "type": "item",
              "id": "wound_medicine",
              "name": "傷薬",
              "weight": 1,
              "minCount": 1,
              "maxCount": 1
            }
          ]
        },
        "enemyPool": [
          {
            "id": "scopics",
            "name": "スコーピックス",
            "weight": 1
          },
          {
            "id": "vibat",
            "name": "ヴィバット",
            "weight": 1
          },
          {
            "id": "speat",
            "name": "スピート",
            "weight": 1
          },
          {
            "id": "stokage",
            "name": "ストカゲ",
            "weight": 1
          },
          {
            "id": "hedumol",
            "name": "ヘデュモル",
            "weight": 1
          },
          {
            "id": "clime",
            "name": "クライム",
            "weight": 1
          }
        ],
        "placements": {
          "enemyCount": [
            4,
            8
          ],
          "trapCount": [
            0,
            0
          ],
          "decorationCount": [
            0,
            0
          ],
          "minEnemySpacing": 2,
          "minTrapSpacing": 2
        },
        "safety": {
          "entranceClearance": 8,
          "exitClearance": 2
        },
        "mandatoryEvents": []
      },
      "preview": {
        "seed": "1iy2yre-1qzks9b",
        "viewOptions": {
          "path": true,
          "rooms": true,
          "placements": true,
          "grid": false
        }
      }
    }
  ]
}
/* DUNGEON_PROFILES_DATA_END */;

  if (typeof module === "object" && module.exports) module.exports = data;
  if (root) root.HEALER_DUNGEON_SAVED_PROFILES = data;
})(typeof globalThis !== "undefined" ? globalThis : this);
