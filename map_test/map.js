for (let i = 0; i < map_array.length; i++) {
    for (let j = 0; j < map_array[i].length; j++) {/*map_arrayを一文字ずつ確認*/
        if (Number(map_array[i].charAt(j)) >= 1) {/*1以上なら*/
            const tile = document.createElement("div");/*要素divを変数tileに作る*/
            tile.className = "way-tile";/*変数tileのクラス名をway-tileにする*/
            tile.style.top = i + "px";/*変数tileのtopをi"px"にする*/
            tile.style.left = j + "px";/*変数tileのleftをj"px"にする*/
            document.getElementById("map").appendChild(tile);/*mapを取得し、変数tileを子要素として追加する*/
        } 
    }
}