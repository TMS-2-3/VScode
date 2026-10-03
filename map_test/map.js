let show_route = false;/*ルート表示中かを判定する変数*/

for (let i = 0; i < map_array.length; i++) {
    for (let j = 0; j < map_array[i].length; j++) {/*map_arrayを一文字ずつ確認*/
        if (Number(map_array[i][j]) >= 1) {/*1以上なら*/
            const tile = document.createElement("div");/*要素divを変数tileに作る*/
            tile.className = "way-tile";/*変数tileのクラス名をway-tileにする*/
            tile.style.top = i + "px";/*変数tileのtopをi"px"にする*/
            tile.style.left = j + "px";/*変数tileのleftをj"px"にする*/
            document.getElementById("map").appendChild(tile);/*mapを取得し、変数tileを子要素として追加する*/
        } 
    }
}

function route_delete() {
    show_route = false;/*ルート表示中かを判定する変数をfalseにする*/
    const routes_old = document.querySelectorAll(".route-tile");/*route-tileを全て取得し、変数route_oldに入れる*/
        routes_old.forEach(function(route_old) {
            route_old.remove();/*変数route_oldを削除する*/
        })
}

function create_route(route_data) {
    if (show_route) {
        route_delete();/*ルート表示中なら、ルートを削除する*/
    }
    console.log("ルートデータ:", route_data);
    if (route_data != null) {
        show_route = true;/*ルート表示中かを判定する変数をtrueにする*/
        for (let i = 0; i < route_data.length; i++) {
         const route_tile = document.createElement("div");/*要素divを変数route_tileに作る*/
         route_tile.className = "route-tile";/*変数route_tileのクラス名をroute-tileにする*/
            route_tile.style.top = route_data[i].y + "px";/*変数route_tileのtopをroute_data[i].y"px"にする*/
            route_tile.style.left = route_data[i].x + "px";/*変数route_tileのleftをroute_data[i].x"px"にする*/
            document.getElementById("map").appendChild(route_tile);/*mapを取得し、変数route_tileを子要素として追加する*/
            if (i === route_data.length - 1) {
                route_goal_x = route_data[i].x;/*ルートのゴールのx座標をroute_goal_xにする*/
                route_goal_y = route_data[i].y;/*ルートのゴールのy座標をroute_goal_yにする*/
            }
        }
    }
}


