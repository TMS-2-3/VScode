const user = document.createElement("div");/*要素divを変数userに作る*/
user.id = "user";/*変数userのidをuserにする*/
document.getElementById("map").appendChild(user);/*mapを取得し、変数userを子要素として追加する*/
let position_x;
let position_y;
let route_goal_x;
let route_goal_y;


navigator.geolocation.watchPosition(function(position) {
    console.log("緯度:" + position.coords.latitude + "\n経度:"
         + position.coords.longitude + "\n精度:" + position.coords.accuracy);
    
    const latitude = position.coords.latitude;/*緯度*/
    const longitude = position.coords.longitude;/*経度*/
    const accuracy = position.coords.accuracy;/*精度*/
    
    position_x = Math.round(map.clientWidth *   ((longitude - map_left_position) / (map_right_position - map_left_position)));/*経度からx座標を計算*/
    position_y = Math.round(map.clientHeight * ((map_top_position - latitude) / (map_top_position - map_bottom_position)));/*緯度からy座標を計算*/

    user.style.left = position_x + "px";/*変数userのleftをposition_x"px"にする*/
    user.style.top = position_y + "px";/*変数userのtopをposition_y"px"にする*/

    console.log("現在経度:", longitude);
console.log("左端経度:", map_left_position);
console.log("右端経度:", map_right_position);

console.log("現在緯度:", latitude);
console.log("上端緯度:", map_top_position);
console.log("下端緯度:", map_bottom_position);

if (show_route && position_x === route_goal_x && position_y === route_goal_y) {
    route_delete();
}
});