
const map = document.getElementById("map");/*mapを取得する*/
let x_size = map.clientWidth;/*mapの横幅を取得する*/
let y_size = map.clientHeight;/*mapの縦幅を取得する*/
let dis = 5;/*10pxごとに線を表示*/

for (let i = dis * 2; i < y_size; i += dis) {
    const x = document.createElement("div");/*要素divを変数xに作る*/
    x.className = "x-line";/*変数xのクラス名をx-lineにする*/
    x.style.top = i + "px";/*変数xのtopをi"px"にする*/
    document.getElementById("grid").appendChild(x);/*gridを取得し、変数xを子要素として追加する*/

}

for (let i = dis * 2; i < x_size; i += dis) {
    const y = document.createElement("div");/*要素divを変数yに作る*/
    y.className = "y-line";/*変数yのクラス名をy-lineにする*/
    y.style.left = i + "px";/*変数yのleftをi"px"にする*/
    document.getElementById("grid").appendChild(y);/*gridを取得し、変数yを子要素として追加する*/
}