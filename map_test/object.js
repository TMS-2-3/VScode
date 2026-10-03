for (let i = 0; i < object_array.length; i++) {
    const object = document.createElement("div");/*要素divを変数objectに作る*/
    object.className = "object";/*変数objectのクラス名をobjectにする*/
    object.style.top = object_array[i].y + "px";/*変数objectのtopをobject_array[i].y"px"にする*/
    object.style.left = object_array[i].x + "px";/*変数objectのleftをobject_array[i].x"px"にする*/
    object.addEventListener("click", function() {/*クリックされたときの処理*/
        console.log("click test");
        search_route(object_array[i].goal_x, object_array[i].goal_y, function(route_data) {/*search_route関数を呼び出す*/
            create_route(route_data);/*ルートを表示する*/
        });
    });
    document.getElementById("map").appendChild(object);/*mapを取得し、変数objectを子要素として追加する*/
}