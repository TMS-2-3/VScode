# ダンジョン自動生成基盤

このフォルダーは、`rot.js`を使ってダンジョンの構造を生成・検査する独立モジュールです。
現時点では`index.html`、`maps.js`、ゲーム中のマップ移動処理には接続していません。

## ファイル

- `dungeonProfiles.js`: ダンジョンごとの生成設定
- `dungeonGenerator.js`: 生成、経路解析、役割・設置候補の割り当て、検査、再試行
- `dungeonGenerator.test.js`: Node.jsで実行できる基盤テスト

## 現在できること

- `ROT.Map.Digger`による部屋と通路の生成
- 数値または文字列シードによる再現
- 入口と出口に最も遠い部屋の組を採用
- 入口から出口までの主経路と、主経路外の部屋を解析
- 部屋へ入口、出口、分岐、宝物、任意の休憩、イベントの役割を割り当て
- 敵、罠、装飾の配置候補を重複なしで生成
- 入口周辺の安全距離を確保
- 必須イベントの占有範囲と調査位置候補を確保
- 部屋数、主経路長、枝部屋数、床面積率、必須配置数を検査
- 不合格時に別の派生シードで再生成し、通常は合格するまで続ける
- 開発時だけ明示的な試行上限を設定できる
- 開発確認用のASCIIプレビューを生成

生成処理中は`ROT.RNG`を一時的に使用しますが、処理終了後に元のシードと内部状態を復元します。

## 標準設定

- サイズ: `60 x 40`
- 部屋: `6～12室`
- 部屋サイズ: `4～9 x 4～7`
- 通路長: `2～8`
- 主経路: `30マス以上`
- 主経路外の部屋: `2室以上`
- 宝物候補: `1～3`
- 敵候補: `4～8`
- 罠候補: `0～3`
- 再試行上限: なし（成功するまで再生成）
- 入口から敵・罠までの最低距離: `8マス`
- 休憩地点: `0`

標準の`dugPercentage`は`0.20`です。`60 x 40`で`0.28～0.35`を指定すると、現在の部屋サイズでは部屋数が13室以上になりやすいため、実測に合わせています。

休憩地点は場所だけを表す汎用枠です。回復効果はこの生成基盤では決めません。標準では生成されず、個別ダンジョンで`restCount`を設定した場合だけ候補が作られます。

## Node.jsでの使用例

```js
const ROT = require("../../rot.js-master/dist/rot.js");
const DungeonGenerator = require("./dungeonGenerator.js");
const DungeonProfiles = require("./dungeonProfiles.js");

const generator = DungeonGenerator.create(ROT);
const result = generator.generate(DungeonProfiles.standard, { seed: "sample-seed" });

console.log(result.metrics);
console.log(DungeonGenerator.toAscii(result));
```

テストはプロジェクト直下から次のコマンドで実行します。

```powershell
node map/dungeon/dungeonGenerator.test.js
```

## ブラウザで後から接続する場合

次の順番で読み込むと、それぞれ`ROT`、`HEALER_DUNGEON_PROFILES`、`HEALER_DUNGEON_GENERATOR`として利用できます。

1. `rot.js-master/dist/rot.js`
2. `map/dungeon/dungeonProfiles.js`
3. `map/dungeon/dungeonGenerator.js`

現時点ではゲーム本体からこの読み込みを行っていません。

## 生成結果の主要項目

- `cells`: 行優先の一次元配列。`0=床`、`1=壁`、`2=扉`
- `rooms`: 部屋の範囲、中心、扉、役割、入口からの距離
- `corridors`: 通路の始点、終点、長さ
- `entrance`、`exit`: 入口と出口の座標
- `mainPath`: 入口から出口までの4方向経路
- `branchRoomIds`: 主経路外の部屋ID
- `placements`: イベント、宝物、休憩、敵、罠、装飾の候補
- `reservations`: 重要物が使用している予約マス
- `metrics`: 部屋数、経路長、床面積率、配置数など
- `validation`: 採用可否、エラー、警告
- `attempts`: 採用までに試した各シードの結果

生成結果は画像タイルIDを持たない中立データです。現在の`HEALER_TILE_MAPS`形式への変換は、実際にゲームへ接続するときにテーマ別の変換処理として追加します。

## 必須イベントの例

```js
const profile = {
  ...HEALER_DUNGEON_PROFILES.standard,
  id: "forest_ruins_1f",
  mandatoryEvents: [
    {
      id: "stone_monument",
      type: "story",
      required: true,
      preferBranch: true,
      minEntranceDistance: 15,
      footprint: { width: 2, height: 2 },
      data: { storyId: "forest_ruins_monument" },
    },
  ],
};
```

イベントが条件を満たす部屋へ置けなかった場合、その生成結果は不採用になります。

通常は成功するまで再生成します。設定値の検証中だけ停止させたい場合は、プロファイルの`retryLimit`または生成時の`maxAttempts`へ正の整数を指定できます。上限に達した場合も固定テンプレートは要求せず、`ok: false`と`reason: "attempt_limit_exhausted"`を返します。
