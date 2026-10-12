import { ACTIONS, CHARACTER_ASSETS, DEFAULT_RULES, MODE_LABELS, STAGE_LABELS } from "./constants.js";
import { bindingLabel, escapeAttr, escapeHtml, formatTime, padBindingLabel } from "./utils.js";

export class ViewRenderer {
  constructor(app) {
    this.app = app;
  }

  render() {
    const { state } = this.app;
    const immersive = state.screen === "game" || state.screen === "practiceGame";
    this.app.root.innerHTML = `
      ${immersive ? "" : this.topbar()}
      ${state.screen === "home" ? this.homeScreen() : ""}
      ${state.screen === "settings" ? this.settingsScreen() : ""}
      ${state.screen === "create" ? this.createScreen() : ""}
      ${state.screen === "practiceSetup" ? this.practiceSetupScreen() : ""}
      ${state.screen === "practiceGame" ? this.practiceGameScreen() : ""}
      ${state.screen === "lobby" ? this.lobbyScreen() : ""}
      ${state.screen === "character" ? this.characterScreen() : ""}
      ${state.screen === "game" ? this.gameScreen() : ""}
      ${state.screen === "result" ? this.resultScreen() : ""}
      ${state.toast ? `<div class="toast">${escapeHtml(state.toast)}</div>` : ""}
    `;
    this.app.renderer.attach(document.querySelector("#gameCanvas"));
    this.drawCharacterPreviews();
  }

  topbar() {
    const { state, network } = this.app;
    const roomText = this.app.practice.active ? "練習" : state.room ? `部屋 ${state.room.code}` : "未入室";
    const showSettings = state.screen !== "game" && state.screen !== "practiceGame";
    return `
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark">O</span>
          <span>Orisuma</span>
        </div>
        <div class="status">
          <span class="dot ${network.connected ? "ok" : ""}"></span>
          <span>${network.connected ? "接続中" : "未接続"}</span>
          <span class="pill">${escapeHtml(roomText)}</span>
          <span class="pill">${escapeHtml(state.name)}</span>
          ${state.ping === null ? "" : `<span class="pill">${state.ping}ms</span>`}
          ${showSettings ? `<button class="icon-button" data-action="openSettings" title="設定" aria-label="設定">⚙</button>` : ""}
        </div>
      </header>
    `;
  }

  homeScreen() {
    const { state } = this.app;
    return `
      <main class="screen">
        <div class="screen-title">
          <div>
            <h1>モード選択</h1>
            <p class="muted">操作や音は右上の設定から変更できます。</p>
          </div>
          ${state.room ? `<button class="button-primary" data-action="screen" data-screen="${this.app.screenForPhase(state.room.phase)}">部屋に戻る</button>` : ""}
        </div>
        <div class="grid">
          <section class="panel stack">
            <div class="panel-head">
              <h2>プロフィール</h2>
              <button data-action="toggleSound">${this.app.audio.enabled ? "音 ON" : "音 OFF"}</button>
            </div>
            <div class="field">
              <label for="playerName">プレイヤー名</label>
              <input id="playerName" maxlength="18" value="${escapeAttr(state.name)}">
            </div>
            <div class="row">
              <button class="button-primary" data-action="saveProfile">保存</button>
              <button data-action="openSettings">設定を開く</button>
            </div>
          </section>
          <section class="panel stack">
            <div class="panel-head">
              <h2>モード選択</h2>
              <span class="pill">2〜4人</span>
            </div>
            <button class="mode-button button-primary" data-action="screen" data-screen="create">ローカル通信対戦</button>
            <button class="mode-button button-primary" data-action="screen" data-screen="practiceSetup">練習</button>
            <button class="mode-button" disabled>CPU戦 準備中</button>
            <p class="muted">同じWi-Fi内では、ホストPCのURLと部屋コードで参加できます。</p>
            ${this.app.serverHint()}
          </section>
        </div>
      </main>
    `;
  }

  settingsScreen() {
    return `
      <main class="screen">
        <div class="screen-title">
          <div>
            <h1>設定</h1>
            <p class="muted">ボタン配置、ゲームパッド割り当て、音を変更できます。</p>
          </div>
          <button data-action="backFromSettings">戻る</button>
        </div>
        <div class="grid">
          <section class="panel stack">
            <div class="panel-head">
              <h2>操作設定</h2>
              <span class="pill">${this.app.input.hasGamepad() ? "パッド接続" : "パッド未検出"}</span>
            </div>
            ${this.controlsMarkup(true)}
            <button data-action="resetControls">操作初期化</button>
          </section>
          <section class="panel stack">
            <div class="panel-head">
              <h2>サウンド</h2>
              <button data-action="toggleSound">${this.app.audio.enabled ? "音 ON" : "音 OFF"}</button>
            </div>
            <p class="muted">簡易SEだけを鳴らします。音楽は使いません。</p>
          </section>
        </div>
      </main>
    `;
  }

  createScreen() {
    return `
      <main class="screen">
        <div class="screen-title">
          <div>
            <h1>部屋作成 / 参加</h1>
            <p class="muted">ホストは部屋を立てた後でもルールを変えられます。</p>
          </div>
          <button data-action="screen" data-screen="home">戻る</button>
        </div>
        <div class="grid">
          <section class="panel stack">
            <div class="panel-head">
              <h2>ルール設定</h2>
              <span class="pill">ホスト用</span>
            </div>
            ${this.rulesForm()}
            <button class="button-primary" data-action="createRoom" ${this.app.network.connected ? "" : "disabled"}>部屋を立てる</button>
          </section>
          <section class="panel stack">
            <div class="panel-head">
              <h2>参加</h2>
              <span class="pill">部屋コード</span>
            </div>
            <div class="field">
              <label for="joinCode">部屋コード</label>
              <input id="joinCode" value="${escapeAttr(this.app.state.joinCode)}" maxlength="12" autocomplete="off">
            </div>
            <button class="button-primary" data-action="joinRoom" ${this.app.network.connected ? "" : "disabled"}>参加する</button>
            ${this.app.serverHint()}
          </section>
        </div>
      </main>
    `;
  }

  practiceSetupScreen() {
    const stage = localStorage.getItem("orisuma.practiceStage") || "battlefield";
    const debug = localStorage.getItem("orisuma.practiceDebug") === "on";
    const finalSmash = localStorage.getItem("orisuma.practiceFinalSmash") === "on";
    const playerCharacter = localStorage.getItem("orisuma.practicePlayer") || "nova";
    const enemyCharacter = localStorage.getItem("orisuma.practiceEnemy") || "nova";
    return `
      <main class="screen">
        <div class="screen-title">
          <div>
            <h1>練習</h1>
            <p class="muted">1人用の的当てモードです。敵は動かず、退出するまで続きます。</p>
          </div>
          <button data-action="screen" data-screen="home">戻る</button>
        </div>
        <div class="grid">
          <section class="panel stack">
            <div class="panel-head">
              <h2>練習設定</h2>
              <span class="pill">1人用</span>
            </div>
            <div class="field-grid">
              <div class="field">
                <label for="practiceStage">ステージ</label>
                <select id="practiceStage">
                  ${this.stageOptions(stage)}
                </select>
              </div>
              <div class="field">
                <label for="practiceDebug">デバッグ表示</label>
                <select id="practiceDebug">
                  <option value="off" ${debug ? "" : "selected"}>OFF</option>
                  <option value="on" ${debug ? "selected" : ""}>ON</option>
                </select>
              </div>
              <div class="field">
                <label for="practiceFinalSmash">切りふだゲージ</label>
                <label class="toggle-control">
                  <input id="practiceFinalSmash" type="checkbox" ${finalSmash ? "checked" : ""}>
                  <span class="toggle-track" aria-hidden="true"></span>
                  <span>使用する</span>
                </label>
              </div>
            </div>
            <div class="practice-character-pickers">
              <div class="field">
                <label>自キャラ</label>
                ${this.practiceCharacterRoster("practicePlayer", playerCharacter)}
              </div>
              <div class="field">
                <label>敵キャラ</label>
                ${this.practiceCharacterRoster("practiceEnemy", enemyCharacter)}
              </div>
            </div>
            <button class="button-primary" data-action="startPractice">開始</button>
          </section>
          <section class="panel stack">
            <div class="panel-head">
              <h2>操作</h2>
              <button data-action="openSettings">設定を開く</button>
            </div>
            ${this.controlHelpMarkup()}
          </section>
        </div>
      </main>
    `;
  }

  practiceGameScreen() {
    return `
      <main class="play-screen">
        <section class="canvas-shell play-canvas">
          <canvas id="gameCanvas" width="1280" height="720"></canvas>
        </section>
        <button class="floating-exit button-danger" data-action="exitPractice">退出</button>
      </main>
    `;
  }

  lobbyScreen() {
    const room = this.app.state.room;
    if (!room) return this.createScreen();
    return `
      <main class="screen wide">
        <div class="screen-title">
          <div>
            <h1>部屋 ${escapeHtml(room.code)}</h1>
            <p class="muted">ルール確認、招待、ログをここで見られます。</p>
          </div>
          <div class="row wrap">
            <button data-action="copyInvite">招待URLをコピー</button>
            <button class="button-danger" data-action="leaveRoom">退出</button>
          </div>
        </div>
        <div class="grid">
          <section class="panel stack">
            <div class="panel-head">
              <h2>参加者</h2>
              <span class="pill">${room.players.length}/${room.rules.maxPlayers}</span>
            </div>
            ${this.playersMarkup(room)}
            <div class="field">
              <label>招待URL</label>
              <textarea readonly>${escapeHtml(this.app.inviteUrl())}</textarea>
            </div>
            <button class="button-primary" data-action="goCharacter" ${room.isHost && room.players.length >= 2 ? "" : "disabled"}>キャラ選択へ</button>
          </section>
          <section class="panel stack">
            <div class="panel-head">
              <h2>現在のルール</h2>
              ${room.isHost ? `<button data-action="applyRules">変更を反映</button>` : ""}
            </div>
            ${room.isHost ? this.rulesForm(room.rules) : this.ruleSummaryMarkup(room.rules)}
          </section>
          <section class="panel stack">
            <div class="panel-head">
              <h2>ログ</h2>
              <span class="pill">${room.logs.length}</span>
            </div>
            ${this.logsMarkup(room)}
          </section>
        </div>
      </main>
    `;
  }

  characterScreen() {
    const room = this.app.state.room;
    if (!room) return this.createScreen();
    const self = this.app.selfPlayer();
    return `
      <main class="screen wide">
        <div class="screen-title">
          <div>
            <h1>キャラ選択</h1>
            <p class="muted">他の人には選択キャラ名を伏せて、選択済みだけ表示します。</p>
          </div>
          <div class="row wrap">
            <button data-action="openSettings">設定</button>
            <button class="button-danger" data-action="leaveRoom">退出</button>
          </div>
        </div>
        <div class="grid">
          <section class="panel stack">
            <div class="panel-head">
              <h2>ファイター</h2>
              <button class="button-warn" data-action="toggleReady" ${self && self.selected ? "" : "disabled"}>
                ${self && self.ready ? "レディを外す" : "レディ"}
              </button>
            </div>
            ${this.characterSelectMarkup(self)}
            <div class="rule-summary">${room.players.map(player => this.playerStatusPill(player)).join("")}</div>
          </section>
          <section class="panel stack">
            <div class="panel-head">
              <h2>ルール / ログ</h2>
              ${room.isHost ? `<button data-action="applyRules">変更を反映</button>` : ""}
            </div>
            ${room.isHost ? this.rulesForm(room.rules) : this.ruleSummaryMarkup(room.rules)}
            ${this.logsMarkup(room)}
          </section>
        </div>
      </main>
    `;
  }

  gameScreen() {
    return `
      <main class="play-screen">
        <section class="canvas-shell play-canvas">
          <canvas id="gameCanvas" width="1280" height="720"></canvas>
        </section>
      </main>
    `;
  }

  resultScreen() {
    const room = this.app.state.room;
    const result = room && room.result;
    return `
      <main class="screen">
        <div class="screen-title">
          <div>
            <h1>リザルト</h1>
            <p class="muted">${result ? escapeHtml(result.reason) : ""}</p>
          </div>
          ${room && room.isHost ? `<button class="button-primary" data-action="returnToCharacter">キャラ選択へ戻る</button>` : `<span class="pill">ホスト待ち</span>`}
        </div>
        <section class="panel stack">
          <div class="result-table">
            ${(result ? result.rows : []).map(row => `
              <div class="result-row">
                <strong>${row.rank}位</strong>
                <span>${escapeHtml(row.name)}</span>
                <span>${row.kills} KO</span>
                <span>${row.falls} 落下</span>
                <span>${row.stocks} ST</span>
                <span>${row.hp} HP</span>
              </div>
            `).join("")}
          </div>
        </section>
      </main>
    `;
  }

  characterSelectMarkup(self) {
    const selectedId = self && self.characterId;
    const colorIndex = Math.max(0, Number(self?.slot || 1) - 1);
    return `
      <div class="character-select">
        <div class="character-roster">
          ${Object.values(CHARACTER_ASSETS).map(character => `
            <button
              class="character-icon ${selectedId === character.id ? "is-selected" : ""}"
              data-action="selectCharacter"
              data-character-id="${escapeAttr(character.id)}"
              aria-pressed="${selectedId === character.id ? "true" : "false"}"
            >
              ${this.characterPortraitMarkup(character.id, colorIndex)}
              <span class="character-icon-name">${escapeHtml(character.name)}</span>
              <span class="character-icon-status">${selectedId === character.id ? "選択中" : character.weightLabel}</span>
            </button>
          `).join("")}
        </div>
        <div class="character-selected">
          <div class="fighter-preview" aria-hidden="true">
            ${selectedId ? this.characterPortraitMarkup(selectedId, colorIndex, true) : ""}
          </div>
          <div class="stack">
            <h2>${selectedId ? `${escapeHtml(CHARACTER_ASSETS[selectedId]?.name || "ノヴァ")} を選択中` : "キャラを選択してください"}</h2>
            ${selectedId ? `<span class="pill">重量: ${escapeHtml(CHARACTER_ASSETS[selectedId]?.weightLabel || "中量")}</span>` : ""}
            <p class="muted">キャラアイコンをクリックして選択します。選択後にレディできます。</p>
          </div>
        </div>
      </div>
    `;
  }

  practiceCharacterRoster(target, selectedId) {
    const colorIndex = target === "practiceEnemy" ? 1 : 0;
    return `
      <input type="hidden" id="${target}" value="${escapeAttr(selectedId)}">
      <div class="character-roster compact">
        ${Object.values(CHARACTER_ASSETS).map(character => `
          <button
            class="character-icon ${selectedId === character.id ? "is-selected" : ""}"
            data-action="setPracticeCharacter"
            data-target="${target}"
            data-character-id="${escapeAttr(character.id)}"
            aria-pressed="${selectedId === character.id ? "true" : "false"}"
          >
            ${this.characterPortraitMarkup(character.id, colorIndex)}
            <span class="character-icon-name">${escapeHtml(character.name)}</span>
            <span class="character-icon-status">${selectedId === character.id ? "選択中" : character.weightLabel}</span>
          </button>
        `).join("")}
      </div>
    `;
  }

  characterPortraitMarkup(characterId, colorIndex = 0, large = false) {
    return `
      <canvas
        class="character-icon-portrait${large ? " character-icon-portrait-large" : ""}"
        width="128"
        height="144"
        data-character-preview="${escapeAttr(characterId)}"
        data-color-index="${Number(colorIndex) || 0}"
        aria-hidden="true"
      ></canvas>
    `;
  }

  drawCharacterPreviews() {
    const canvases = this.app.root.querySelectorAll("canvas[data-character-preview]");
    for (const canvas of canvases) {
      const characterId = canvas.dataset.characterPreview || "nova";
      const colorIndex = Math.max(0, Number(canvas.dataset.colorIndex) || 0);
      const sprite = this.app.assets.getFighterSprite(characterId, colorIndex, false);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(sprite.canvas, 0, 0, canvas.width, canvas.height);
    }
  }

  controlsMarkup(compact = false) {
    const input = this.app.input;
    return `
      <div class="stack">
        <div class="panel-head">
          <h2>${compact ? "割り当て" : "操作設定"}</h2>
          <span class="pill">${input.hasGamepad() ? "パッド接続" : "パッド未検出"}</span>
        </div>
        <div class="key-list">
          ${ACTIONS.map(([key, label]) => `
            <div class="key-row">
              <strong>${label}</strong>
              <span class="key-chip">${bindingLabel(input.controls.keyboard[key])}</span>
              <button data-action="captureKey" data-key="${key}">
                ${input.captureKeyboard === key ? "キー入力中" : "キー変更"}
              </button>
              <button data-action="capturePad" data-key="${key}">
                ${input.captureGamepadAction === key ? "パッド入力中" : padBindingLabel(input.controls.gamepad[key])}
              </button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  rulesForm(rules = DEFAULT_RULES) {
    return `
      <div class="rule-grid">
        <div class="field">
          <label for="ruleMode">形式</label>
          <select id="ruleMode">
            <option value="stock" ${rules.mode === "stock" ? "selected" : ""}>ストック制</option>
            <option value="time" ${rules.mode === "time" ? "selected" : ""}>タイム制</option>
            <option value="hp" ${rules.mode === "hp" ? "selected" : ""}>体力制</option>
          </select>
        </div>
        <div class="field">
          <label for="stage">ステージ</label>
          <select id="stage">${this.stageOptions(rules.stage)}</select>
        </div>
        <div class="field">
          <label for="maxPlayers">人数</label>
          <select id="maxPlayers">
            <option value="2" ${rules.maxPlayers === 2 ? "selected" : ""}>2人</option>
            <option value="3" ${rules.maxPlayers === 3 ? "selected" : ""}>3人</option>
            <option value="4" ${rules.maxPlayers === 4 ? "selected" : ""}>4人</option>
          </select>
        </div>
        <div class="field">
          <label for="stocks">ストック</label>
          <input id="stocks" type="number" min="1" max="9" value="${rules.stocks}">
        </div>
        <div class="field">
          <label for="timeLimit">制限時間 秒</label>
          <input id="timeLimit" type="number" min="60" max="900" step="30" value="${rules.timeLimit}">
        </div>
        <div class="field">
          <label for="hp">体力</label>
          <input id="hp" type="number" min="50" max="500" step="10" value="${rules.hp}">
        </div>
        <div class="field">
          <label for="gameSpeed">ゲーム速度</label>
          <select id="gameSpeed">
            <option value="0.75" ${rules.gameSpeed === 0.75 ? "selected" : ""}>0.75x</option>
            <option value="1" ${rules.gameSpeed === 1 ? "selected" : ""}>1.0x</option>
            <option value="1.15" ${rules.gameSpeed === 1.15 ? "selected" : ""}>1.15x</option>
            <option value="1.25" ${rules.gameSpeed === 1.25 ? "selected" : ""}>1.25x</option>
          </select>
        </div>
        <div class="field">
          <label for="inputDelay">入力遅延</label>
          <select id="inputDelay">
            ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(frame => (
              `<option value="${frame}" ${(rules.inputDelay ?? DEFAULT_RULES.inputDelay) === frame ? "selected" : ""}>${frame}F</option>`
            )).join("")}
          </select>
        </div>
        <div class="field">
          <label for="finalSmash">切りふだゲージ</label>
          <label class="toggle-control">
            <input id="finalSmash" type="checkbox" ${(rules.finalSmash ?? DEFAULT_RULES.finalSmash) ? "checked" : ""}>
            <span class="toggle-track" aria-hidden="true"></span>
            <span>使用する</span>
          </label>
        </div>
        <div class="field">
          <label for="debug">デバッグ表示</label>
          <select id="debug">
            <option value="off" ${rules.debug ? "" : "selected"}>OFF</option>
            <option value="on" ${rules.debug ? "selected" : ""}>ON</option>
          </select>
        </div>
      </div>
    `;
  }

  ruleSummaryMarkup(rules) {
    return `
      <div class="rule-summary">
        <span class="pill">${MODE_LABELS[rules.mode]}</span>
        <span class="pill">${STAGE_LABELS[rules.stage]}</span>
        <span class="pill">${rules.maxPlayers}人</span>
        <span class="pill">${rules.stocks}ストック</span>
        <span class="pill">${formatTime(rules.timeLimit)}</span>
        <span class="pill">${rules.hp}HP</span>
        <span class="pill">${rules.gameSpeed}x</span>
        <span class="pill">遅延${rules.inputDelay ?? DEFAULT_RULES.inputDelay}F</span>
        <span class="pill">切りふだ${(rules.finalSmash ?? DEFAULT_RULES.finalSmash) ? "ON" : "OFF"}</span>
        <span class="pill">判定${rules.debug ? "ON" : "OFF"}</span>
      </div>
    `;
  }

  stageOptions(selected) {
    return Object.entries(STAGE_LABELS).map(([id, label]) => (
      `<option value="${id}" ${selected === id ? "selected" : ""}>${label}</option>`
    )).join("");
  }

  characterSelect(id) {
    return `
      <select id="${id}">
        ${Object.values(CHARACTER_ASSETS).map(character => (
          `<option value="${character.id}">${escapeHtml(character.name)}</option>`
        )).join("")}
      </select>
    `;
  }

  playersMarkup(room) {
    return `
      <div class="players">
        ${room.players.map(player => `
          <div class="player-row">
            <span class="slot">P${player.slot}</span>
            <div>
              <strong>${escapeHtml(player.name)}</strong>
              <div class="muted">${player.isHost ? "ホスト" : "参加者"}${player.isSelf ? " / 自分" : ""}${player.waiting ? " / 次の試合から" : ""}</div>
            </div>
            <span class="pill">${player.waiting ? "次戦待ち" : player.ready ? "Ready" : "待機"}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  playerStatusPill(player) {
    if (player.waiting) return `<span class="pill">P${player.slot} ${escapeHtml(player.name)} / 次の試合から</span>`;
    const selected = player.selected ? "選択済み" : "未選択";
    const ready = player.ready ? "Ready" : "未Ready";
    return `<span class="pill">P${player.slot} ${escapeHtml(player.name)} / ${selected} / ${ready}</span>`;
  }

  logsMarkup(room) {
    return `
      <div class="log">
        ${room.logs.length ? room.logs.map(log => `
          <div class="log-line">
            <span>${escapeHtml(log.time)}</span>
            <span>${escapeHtml(log.text)}</span>
          </div>
        `).join("") : `<p class="muted">まだログはありません。</p>`}
      </div>
    `;
  }

  practiceSummaryMarkup() {
    const practice = this.app.practice.data;
    if (!practice) return "";
    const dummy = practice.fighters.find(fighter => fighter.id === "practice-dummy");
    return `
      <div class="rule-summary">
        <span class="pill">${STAGE_LABELS[practice.rules.stage]}</span>
        <span class="pill">自キャラ: ノヴァ</span>
        <span class="pill">敵: ノヴァ</span>
        <span class="pill">的ダメージ ${Math.round(dummy ? dummy.damage : 0)}%</span>
        <span class="pill">判定${practice.rules.debug ? "ON" : "OFF"}</span>
      </div>
    `;
  }

  controlHelpMarkup() {
    const keyboard = this.app.input.controls.keyboard;
    return `
      <div class="mini-help">
        <span>移動: ${bindingLabel(keyboard.left)} / ${bindingLabel(keyboard.right)}</span>
        <span>ジャンプ: ${bindingLabel(keyboard.jump)}</span>
        <span>攻撃: ${bindingLabel(keyboard.attack)} / スマッシュ: ${bindingLabel(keyboard.smash)}</span>
        <span>必殺: ${bindingLabel(keyboard.special)}</span>
        <span>シールド: ${bindingLabel(keyboard.shield)} / つかみ: ${bindingLabel(keyboard.grab)}</span>
      </div>
    `;
  }
}
