import { AssetManager } from "./js/asset-manager.js";
import { AudioManager } from "./js/audio-manager.js";
import { CanvasRenderer } from "./js/canvas-renderer.js";
import { DEFAULT_RULES } from "./js/constants.js";
import { InputManager } from "./js/input-manager.js";
import { NetworkClient } from "./js/network-client.js";
import { PracticeMode } from "./js/practice-mode.js";
import { ViewRenderer } from "./js/view-renderer.js";

const MAX_PRESENTATION_EXTRAPOLATION = 0.05;

class OrisumaApp {
  constructor(root) {
    this.root = root;
    this.state = {
      myId: null,
      screen: "home",
      previousScreen: "home",
      room: null,
      match: null,
      lastPhase: null,
      toast: "",
      toastTimer: 0,
      name: localStorage.getItem("orisuma.name") || `Player${Math.floor(Math.random() * 90 + 10)}`,
      joinCode: new URLSearchParams(location.search).get("room") || "",
      lastEventIds: new Set(),
      inputSeq: 0,
      lastSnapshotFrame: -1,
      lastSnapshotMatchId: null,
      lastSnapshotAt: 0,
      nextInputFrame: 0,
      ping: null
    };

    this.audio = new AudioManager();
    this.assets = new AssetManager();
    this.input = new InputManager(() => this.render());
    this.renderer = new CanvasRenderer(this.assets);
    this.practice = new PracticeMode({
      inputManager: this.input,
      audioManager: this.audio,
      assetManager: this.assets,
      playerNameProvider: () => this.state.name
    });
    this.view = new ViewRenderer(this);
    this.network = new NetworkClient({
      onUnavailable: message => this.toast(message),
      onOpen: () => this.render(),
      onClose: () => {
        this.state.ping = null;
        this.toast("サーバーとの接続が切れました。");
        this.render();
      },
      onMessage: message => this.handleNetworkMessage(message)
    });
  }

  start() {
    this.input.bind();
    this.network.connect();
    this.bindDomEvents();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
    setInterval(() => this.sendInput(), 1000 / 60);
  }

  bindDomEvents() {
    document.addEventListener("click", event => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      this.handleAction(button.dataset.action, button.dataset);
    });

    document.addEventListener("input", event => {
      if (event.target.id === "joinCode") {
        this.state.joinCode = event.target.value.toUpperCase();
      }
    });
  }

  handleAction(action, data) {
    if (action === "screen") {
      this.state.screen = data.screen;
      this.render();
      return;
    }
    if (action === "openSettings") {
      this.state.previousScreen = this.state.screen === "settings" ? this.state.previousScreen : this.state.screen;
      this.state.screen = "settings";
      this.render();
      return;
    }
    if (action === "backFromSettings") {
      this.state.screen = this.state.previousScreen || "home";
      this.render();
      return;
    }
    if (action === "saveProfile") {
      const input = document.querySelector("#playerName");
      this.state.name = (input.value || this.state.name).trim().slice(0, 18) || this.state.name;
      localStorage.setItem("orisuma.name", this.state.name);
      this.toast("名前を保存しました。");
      return;
    }
    if (action === "toggleSound") {
      this.audio.toggle();
      this.render();
      return;
    }
    if (action === "captureKey") {
      this.input.startKeyboardCapture(data.key);
      return;
    }
    if (action === "capturePad") {
      this.input.startGamepadCapture(data.key);
      return;
    }
    if (action === "resetControls") {
      this.input.resetControls();
      return;
    }
    if (action === "setPracticeCharacter") {
      localStorage.setItem(`orisuma.${data.target}`, data.characterId || "nova");
      this.render();
      return;
    }
    if (action === "startPractice") {
      if (this.state.room) this.network.send({ type: "leaveRoom" });
      this.practice.start(this.readPracticeSetup());
      this.state.room = null;
      this.state.match = null;
      this.state.screen = "practiceGame";
      this.audio.play("ui");
      this.render();
      return;
    }
    if (action === "exitPractice") {
      this.practice.exit();
      this.state.match = null;
      this.state.screen = "home";
      this.audio.play("ui");
      this.render();
      return;
    }
    if (action === "createRoom") {
      this.sendOrToast({ type: "createRoom", name: this.state.name, rules: this.readRules() });
      this.audio.play("ui");
      return;
    }
    if (action === "joinRoom") {
      const code = (document.querySelector("#joinCode")?.value || "").trim().toUpperCase();
      if (!code) {
        this.toast("部屋コードを入力してください。");
        return;
      }
      this.state.joinCode = code;
      this.sendOrToast({ type: "joinRoom", name: this.state.name, code });
      this.audio.play("ui");
      return;
    }
    if (action === "applyRules") {
      this.sendOrToast({ type: "updateRules", rules: this.readRules() });
      this.audio.play("ui");
      return;
    }
    if (action === "goCharacter") {
      this.sendOrToast({ type: "goCharacter" });
      this.audio.play("ui");
      return;
    }
    if (action === "copyInvite") {
      this.copyText(this.inviteUrl());
      return;
    }
    if (action === "leaveRoom") {
      this.network.send({ type: "leaveRoom" });
      this.state.room = null;
      this.state.match = null;
      this.state.screen = "home";
      this.render();
      return;
    }
    if (action === "selectCharacter") {
      this.selectCharacter(data.characterId || "nova");
      return;
    }
    if (action === "toggleReady") {
      const self = this.selfPlayer();
      this.sendOrToast({ type: "ready", ready: !(self && self.ready) });
      this.audio.play("ui");
      return;
    }
    if (action === "returnToCharacter") {
      this.sendOrToast({ type: "returnToCharacter" });
      this.audio.play("ui");
    }
  }

  handleNetworkMessage(message) {
    if (message.type === "connected") {
      this.state.myId = message.id;
      this.render();
      return;
    }
    if (message.type === "pong") {
      if (Number.isFinite(Number(message.t))) {
        this.state.ping = Math.max(0, Math.round(performance.now() - Number(message.t)));
        if (this.state.screen !== "game" && this.state.screen !== "practiceGame") this.render();
      }
      return;
    }
    if (message.type === "error") {
      this.toast(message.message || "エラーが発生しました。");
      return;
    }
    if (message.type === "leftRoom") {
      this.state.room = null;
      this.state.match = null;
      this.state.lastSnapshotFrame = -1;
      this.state.lastSnapshotMatchId = null;
      this.state.lastSnapshotAt = 0;
      this.state.nextInputFrame = 0;
      this.state.screen = "home";
      this.render();
      return;
    }
    if (message.type === "roomClosed") {
      this.state.room = null;
      this.state.match = null;
      this.state.lastPhase = null;
      this.state.lastSnapshotFrame = -1;
      this.state.lastSnapshotMatchId = null;
      this.state.lastSnapshotAt = 0;
      this.state.nextInputFrame = 0;
      this.state.screen = "home";
      this.toast(message.message || "部屋が解散されました。");
      return;
    }
    if (message.type === "roomState") {
      this.state.room = message.room;
      this.assets.preload(message.room.assetManifest);
      const phaseScreen = this.screenForPhase(message.room.phase);
      const changed = this.state.screen !== phaseScreen || this.state.lastPhase !== message.room.phase;
      this.state.screen = phaseScreen;
      this.state.lastPhase = message.room.phase;
      if (message.room.phase !== "game") {
        this.state.match = null;
        this.state.lastSnapshotFrame = -1;
        this.state.lastSnapshotMatchId = null;
        this.state.lastSnapshotAt = 0;
        this.state.nextInputFrame = 0;
      }
      if (changed || message.room.phase !== "game") this.render();
      return;
    }
    if (message.type === "matchSnapshot") {
      const snapshot = message.snapshot;
      if (!snapshot) return;
      const isNewMatch = snapshot.id !== this.state.lastSnapshotMatchId;
      if (isNewMatch) {
        this.state.lastSnapshotMatchId = snapshot.id;
        this.state.lastSnapshotFrame = -1;
        this.state.lastSnapshotAt = performance.now();
        this.state.nextInputFrame = 0;
        this.state.lastEventIds.clear();
        this.assets.preload(this.assets.manifestFromSnapshot(snapshot));
      }
      if (snapshot.frame <= this.state.lastSnapshotFrame) return;
      this.state.lastSnapshotFrame = snapshot.frame;
      this.state.lastSnapshotAt = performance.now();
      this.state.match = snapshot;
      this.playSnapshotEvents(snapshot.events || []);
      if (this.state.screen !== "game") {
        this.state.screen = "game";
        this.render();
      }
    }
  }

  sendInput() {
    if (!this.state.room || this.state.room.phase !== "game") return;
    const now = performance.now();
    const elapsedFrames = this.state.lastSnapshotAt
      ? Math.max(0, Math.floor((now - this.state.lastSnapshotAt) / (1000 / 60)))
      : 0;
    const estimatedServerFrame = Math.max(0, this.state.lastSnapshotFrame) + elapsedFrames;
    const inputDelay = Number(this.state.room.rules?.inputDelay ?? DEFAULT_RULES.inputDelay);
    const desiredFrame = estimatedServerFrame + inputDelay;
    const targetFrame = Math.max(desiredFrame, Math.min(this.state.nextInputFrame || desiredFrame, desiredFrame + 2));
    this.state.nextInputFrame = targetFrame + 1;
    this.state.inputSeq += 1;
    this.network.send({
      type: "input",
      seq: this.state.inputSeq,
      clientFrame: estimatedServerFrame,
      targetFrame,
      sentAt: now,
      input: this.input.readInput()
    });
  }

  sendOrToast(data) {
    if (!this.network.send(data)) this.toast("サーバーに接続できていません。");
  }

  gameLoop() {
    if (this.practice.active && this.state.screen === "practiceGame") {
      this.practice.update();
      this.renderer.draw(this.practice.snapshot());
    } else if (this.state.match) {
      const snapshotAge = this.state.lastSnapshotAt
        ? Math.min(MAX_PRESENTATION_EXTRAPOLATION, (performance.now() - this.state.lastSnapshotAt) / 1000)
        : 0;
      this.renderer.draw(this.state.match, snapshotAge);
    }
    requestAnimationFrame(() => this.gameLoop());
  }

  render() {
    this.view.render();
  }

  selectCharacter(characterId) {
    this.sendOrToast({ type: "selectCharacter", characterId });
    this.audio.play("ui");
  }

  readRules() {
    return {
      mode: document.querySelector("#ruleMode")?.value || DEFAULT_RULES.mode,
      stage: document.querySelector("#stage")?.value || DEFAULT_RULES.stage,
      maxPlayers: Number(document.querySelector("#maxPlayers")?.value || DEFAULT_RULES.maxPlayers),
      stocks: Number(document.querySelector("#stocks")?.value || DEFAULT_RULES.stocks),
      timeLimit: Number(document.querySelector("#timeLimit")?.value || DEFAULT_RULES.timeLimit),
      hp: Number(document.querySelector("#hp")?.value || DEFAULT_RULES.hp),
      gameSpeed: Number(document.querySelector("#gameSpeed")?.value || DEFAULT_RULES.gameSpeed),
      inputDelay: Number(document.querySelector("#inputDelay")?.value || DEFAULT_RULES.inputDelay),
      finalSmash: document.querySelector("#finalSmash")?.checked ?? DEFAULT_RULES.finalSmash,
      debug: document.querySelector("#debug")?.value === "on"
    };
  }

  readPracticeSetup() {
    const setup = {
      stage: document.querySelector("#practiceStage")?.value || "battlefield",
      debug: document.querySelector("#practiceDebug")?.value === "on",
      finalSmash: document.querySelector("#practiceFinalSmash")?.checked ?? false,
      player: document.querySelector("#practicePlayer")?.value || localStorage.getItem("orisuma.practicePlayer") || "nova",
      enemy: document.querySelector("#practiceEnemy")?.value || localStorage.getItem("orisuma.practiceEnemy") || "nova"
    };
    localStorage.setItem("orisuma.practiceStage", setup.stage);
    localStorage.setItem("orisuma.practiceDebug", setup.debug ? "on" : "off");
    localStorage.setItem("orisuma.practiceFinalSmash", setup.finalSmash ? "on" : "off");
    return setup;
  }

  playSnapshotEvents(events) {
    for (const event of events) {
      if (this.state.lastEventIds.has(event.id)) continue;
      this.state.lastEventIds.add(event.id);
      if (this.state.lastEventIds.size > 80) this.state.lastEventIds.clear();
      this.audio.play(event.kind);
    }
  }

  screenForPhase(phase) {
    if (phase === "lobby") return "lobby";
    if (phase === "character") return "character";
    if (phase === "game") return "game";
    if (phase === "result") return "result";
    return "home";
  }

  selfPlayer() {
    return this.state.room ? this.state.room.players.find(player => player.id === this.state.room.selfId) : null;
  }

  inviteUrl() {
    if (!this.state.room) return location.href;
    const url = new URL(location.href);
    url.searchParams.set("room", this.state.room.code);
    return url.toString();
  }

  copyText(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => this.toast("コピーしました。"))
        .catch(() => this.toast(text));
    } else {
      this.toast(text);
    }
  }

  serverHint() {
    if (this.network.connected) {
      return `<p class="muted">サーバー接続OK。別端末はホストPCのIPアドレスで開きます。</p>`;
    }
    return `<p class="muted">未接続です。ターミナルで <code>node server.js</code> を起動して、表示されたURLを開いてください。</p>`;
  }

  toast(message) {
    this.state.toast = message;
    clearTimeout(this.state.toastTimer);
    this.state.toastTimer = setTimeout(() => {
      this.state.toast = "";
      this.render();
    }, 2800);
    this.render();
  }
}

new OrisumaApp(document.querySelector("#app")).start();
