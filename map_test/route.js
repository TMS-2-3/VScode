function search_route(goal_x, goal_y, callback) {
    let start_x;
    let start_y;

    /*スタート地点検索*/
    if (map_array[position_y][position_x] === 0) {/*現在地が通行不可の場合*/
        way_check_for : 
        for (let i = 0; i < Math.max(map_array[position_y].length - position_x - 1, position_x, map_array.length - position_y - 1, position_y); i++) {
            /*半径iの距離の通行可をチェック */
            if (map_array[position_y].length > position_x + i && map_array[position_y][position_x + i] === 1) {
                /*右方向の通行可をチェック*/
                start_x = position_x + i;
                start_y = position_y;
                break;
            }else if (position_x - i >= 0 && map_array[position_y][position_x - i] === 1) {
                /*左方向の通行可をチェック*/
                start_x = position_x - i;
                start_y = position_y;
                break;
            }else if (position_y + i < map_array.length && map_array[position_y + i][position_x] === 1) {
                /*下方向の通行可をチェック*/
                start_x = position_x;
                start_y = position_y + i;
                break;
            }else if (position_y - i >= 0 && map_array[position_y - i][position_x] === 1) {
                /*上方向の通行可をチェック*/
                start_x = position_x;
                start_y = position_y - i;
                break;
            }else {
                for (let j = 1; j <= i; j++) {
                    if (position_y - i >= 0 && position_x - j >= 0 && map_array[position_y - i][position_x - j] === 1) {
                        /*上左方向の通行可をチェック*/
                        start_x = position_x - j;
                        start_y = position_y - i;
                        break way_check_for;
                    }else if (position_y - i >= 0 && map_array[position_y - i].length > position_x + j && map_array[position_y - i][position_x + j] === 1) {
                        /*上右方向の通行可をチェック*/
                        start_x = position_x + j;
                        start_y = position_y - i;
                        break way_check_for;
                    }else if (position_y - j >= 0 && map_array[position_y - j].length > position_x + i && map_array[position_y - j][position_x + i] === 1) {
                        /*右上方向の通行可をチェック*/
                        start_x = position_x + i;
                        start_y = position_y - j;
                        break way_check_for;
                    }else if (position_y + j < map_array.length && map_array[position_y + j].length > position_x + i && map_array[position_y + j][position_x + i] === 1) {
                        /*右下方向の通行可をチェック*/
                        start_x = position_x + i;
                        start_y = position_y + j;
                        break way_check_for;
                    }else if (position_y + i < map_array.length && map_array[position_y + i].length > position_x + j && map_array[position_y + i][position_x + j] === 1) {
                        /*下右方向の通行可をチェック*/
                        start_x = position_x + j;
                        start_y = position_y + i;
                        break way_check_for;
                    }else if (position_y + i < map_array.length && position_x - j >= 0 && map_array[position_y + i][position_x - j] === 1) {
                        /*下左方向の通行可をチェック*/
                        start_x = position_x - j;
                        start_y = position_y + i;
                        break way_check_for;
                    }else if (position_y + j < map_array.length && position_x - i >= 0 && map_array[position_y + j][position_x - i] === 1) {
                        /*左下方向の通行可をチェック*/
                        start_x = position_x - i;
                        start_y = position_y + j;
                        break way_check_for;
                    }else if (position_y - j >= 0 && position_x - i >= 0 && map_array[position_y - j][position_x - i] === 1) {
                        /*左上方向の通行可をチェック*/
                        start_x = position_x - i;
                        start_y = position_y - j;
                        break way_check_for;
                    }
                }
            }
        } 
    }else {
        start_x = position_x;
        start_y = position_y;
    }

    
    const easy_star = new EasyStar.js();/*EasyStar.jsのインスタンスを作る*/
    easy_star.setGrid(map_array);/*map_arrayをEasyStar.jsにセットする*/
    easy_star.disableDiagonals();/*斜め移動を禁止する*/
    easy_star.setAcceptableTiles([1]);/*通行可能なタイルをセットする*/
    easy_star.findPath(start_x, start_y, goal_x, goal_y, function(path) {
        if (path === null) {
            console.log("ルートが見つかりませんでした");
        }else {
            console.log("ルートが見つかりました");
        }
        callback(path);
    });
    easy_star.calculate();

}