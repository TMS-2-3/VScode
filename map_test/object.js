for (let i = 0; i < object_array.length; i++) {
    const object = document.createElement("div");/*要素divを変数objectに作る*/
    object.className = "object";/*変数objectのクラス名をobjectにする*/
    object.style.top = object_array[i].y + "px";/*変数objectのtopをobject_array[i].y"px"にする*/
    object.style.left = object_array[i].x + "px";/*変数objectのleftをobject_array[i].x"px"にする*/
    object.style.width = object_array[i].size_x + "px";/*変数objectのwidthをobject_array[i].size_x"px"にする*/
    object.style.height = object_array[i].size_y + "px";/*変数objectのheightをobject_array[i].size_y"px"にする*/
    
    const object_name_panel = document.createElement("div");/*要素divを変数object_name_panelに作る*/
    object_name_panel.className = "object-name-panel";/*クラス名をobject-name-panelにする*/
    object_name_panel.textContent = object_array[i].name;/*表示する文字をobjectの名前にする*/
    object.appendChild(object_name_panel);/*objectにobject_name_panelを追加する*/
    
    object.addEventListener("click", function() {/*クリックされたときの処理*/
         console.log("click " + object_array[i].name);
         if (position_x !== undefined || position_y !== undefined) {/*現在地取得済み*/
            search_route(object_array[i].goal_x, object_array[i].goal_y, function(route_data) {/*search_route関数を呼び出す*/
                create_route(route_data);/*ルートを表示する*/
            });
        }else {/*現在地未取得*/
            console.log("現在地未習得")
        }
    });
    document.getElementById("map").appendChild(object);/*mapを取得し、変数objectを子要素として追加する*/
}