"use strict";

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  CHARACTER_IDS,
  DEFAULT_RULES,
  STAGES,
  normalizeTimeLimit
} from "./js/battle-data.js";
import { RollbackManager } from "./js/rollback-manager.js";
import { BattleSimulation, normalizeBattleInput } from "./js/battle-simulation.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const TICK_RATE = 60;
const SNAPSHOT_RATE = 30;
const WORLD = { width: 1280, height: 720 };
const INPUT_HOLD_MS = 220;
const INPUT_STALE_MS = 650;
const INPUT_QUEUE_LIMIT = 180;
const ROLLBACK_HISTORY_LIMIT = 180;
const ROLLBACK_FUTURE_LIMIT = 20;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon"
};

const rooms = new Map();
const peers = new Map();
const battleSimulation = new BattleSimulation();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let requestedPath = decodeURIComponent(url.pathname);
  if (requestedPath === "/") requestedPath = "/index.html";
  const filePath = path.normalize(path.join(ROOT, requestedPath));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(data);
  });
});

server.on("upgrade", (req, socket) => {
  if (req.headers.upgrade !== "websocket") {
    socket.destroy();
    return;
  }

  const key = req.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return;
  }

  const accept = crypto
    .createHash("sha1")
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest("base64");

  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${accept}`,
      "",
      ""
    ].join("\r\n")
  );

  const peer = createPeer(socket);
  peers.set(peer.id, peer);
  send(peer, { type: "connected", id: peer.id });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Orisuma server running at http://localhost:${PORT}`);
});

setInterval(() => {
  for (const room of rooms.values()) {
    if (room.phase === "game" && room.match) {
      updateMatch(room, 1 / TICK_RATE);
    }
  }
}, 1000 / TICK_RATE);

function createPeer(socket) {
  const peer = {
    id: crypto.randomUUID(),
    socket,
    buffer: Buffer.alloc(0),
    roomCode: null,
    closed: false
  };

  socket.on("data", chunk => {
    peer.buffer = Buffer.concat([peer.buffer, chunk]);
    readFrames(peer);
  });
  socket.on("close", () => closePeer(peer));
  socket.on("error", () => closePeer(peer));
  return peer;
}

function readFrames(peer) {
  while (peer.buffer.length >= 2) {
    const first = peer.buffer[0];
    const second = peer.buffer[1];
    const opcode = first & 0x0f;
    const masked = (second & 0x80) !== 0;
    let length = second & 0x7f;
    let offset = 2;

    if (length === 126) {
      if (peer.buffer.length < offset + 2) return;
      length = peer.buffer.readUInt16BE(offset);
      offset += 2;
    } else if (length === 127) {
      if (peer.buffer.length < offset + 8) return;
      const big = peer.buffer.readBigUInt64BE(offset);
      if (big > BigInt(2 * 1024 * 1024)) {
        peer.socket.destroy();
        return;
      }
      length = Number(big);
      offset += 8;
    }

    let mask = null;
    if (masked) {
      if (peer.buffer.length < offset + 4) return;
      mask = peer.buffer.slice(offset, offset + 4);
      offset += 4;
    }

    if (peer.buffer.length < offset + length) return;

    let payload = peer.buffer.slice(offset, offset + length);
    peer.buffer = peer.buffer.slice(offset + length);

    if (mask) {
      const decoded = Buffer.alloc(payload.length);
      for (let i = 0; i < payload.length; i += 1) decoded[i] = payload[i] ^ mask[i % 4];
      payload = decoded;
    }

    if (opcode === 0x8) {
      closePeer(peer);
      return;
    }
    if (opcode === 0x9) {
      sendRawFrame(peer, payload, 0x0a);
      continue;
    }
    if (opcode !== 0x1) continue;

    try {
      handleMessage(peer, JSON.parse(payload.toString("utf8")));
    } catch (error) {
      send(peer, { type: "error", message: "メッセージを読み取れませんでした。" });
    }
  }
}

function send(peer, data) {
  if (!peer || peer.closed || peer.socket.destroyed) return;
  sendRawFrame(peer, Buffer.from(JSON.stringify(data), "utf8"), 0x1);
}

function sendRawFrame(peer, payload, opcode) {
  if (!peer || peer.closed || peer.socket.destroyed) return;

  let header;
  if (payload.length < 126) {
    header = Buffer.from([0x80 | opcode, payload.length]);
  } else if (payload.length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(payload.length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(payload.length), 2);
  }
  peer.socket.write(Buffer.concat([header, payload]));
}

function closePeer(peer) {
  if (!peer || peer.closed) return;
  peer.closed = true;
  peers.delete(peer.id);
  leaveRoom(peer, true);
  try {
    peer.socket.destroy();
  } catch (error) {
    // Socket is already gone.
  }
}

function handleMessage(peer, message) {
  if (!message || typeof message.type !== "string") return;

  if (message.type === "ping") {
    send(peer, { type: "pong", t: message.t, serverTime: Date.now() });
    return;
  }

  if (message.type === "createRoom") {
    const room = {
      code: makeRoomCode(),
      hostId: peer.id,
      phase: "lobby",
      rules: normalizeRules(message.rules),
      players: new Map(),
      logs: [],
      match: null,
      result: null
    };
    rooms.set(room.code, room);
    addPlayerToRoom(peer, room, message.name);
    addLog(room, `${playerName(room, peer.id)} が部屋を立てました。`);
    sendRoomState(room);
    return;
  }

  if (message.type === "joinRoom") {
    const code = String(message.code || "").trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      send(peer, { type: "error", message: "部屋が見つかりません。" });
      return;
    }
    if (room.players.size >= room.rules.maxPlayers) {
      send(peer, { type: "error", message: "部屋が満員です。" });
      return;
    }
    const joiningDuringGame = room.phase === "game";
    addPlayerToRoom(peer, room, message.name);
    addLog(room, joiningDuringGame
      ? `${playerName(room, peer.id)} が参加しました。次の試合から参加します。`
      : `${playerName(room, peer.id)} が参加しました。`);
    sendRoomState(room);
    return;
  }

  const room = rooms.get(peer.roomCode);
  if (!room) {
    send(peer, { type: "error", message: "先に部屋へ参加してください。" });
    return;
  }

  if (message.type === "leaveRoom") {
    leaveRoom(peer, false);
    return;
  }

  if (message.type === "updateRules") {
    if (!isHost(room, peer.id)) {
      send(peer, { type: "error", message: "ルール変更はホストだけができます。" });
      return;
    }
    const previous = room.rules;
    room.rules = normalizeRules(message.rules, room.rules, room.players.size);
    for (const player of room.players.values()) player.ready = false;
    addLog(room, `${playerName(room, peer.id)} がルールを変更しました: ${rulesSummary(room.rules, previous)}`);
    sendRoomState(room);
    return;
  }

  if (message.type === "goCharacter") {
    if (!isHost(room, peer.id)) return;
    if (room.players.size < 2) {
      send(peer, { type: "error", message: "2人以上で開始できます。" });
      return;
    }
    room.phase = "character";
    room.result = null;
    room.match = null;
    for (const player of room.players.values()) {
      player.ready = false;
      player.selected = false;
      player.characterId = null;
      player.waiting = false;
    }
    addLog(room, "キャラ選択へ移動しました。");
    sendRoomState(room);
    return;
  }

  if (message.type === "selectCharacter") {
    const player = room.players.get(peer.id);
    if (!player || room.phase !== "character") return;
    const characterId = CHARACTER_IDS.has(message.characterId) ? message.characterId : "nova";
    player.selected = true;
    player.characterId = characterId;
    player.ready = false;
    addLog(room, `${player.name} がキャラを選択しました。`);
    sendRoomState(room);
    return;
  }

  if (message.type === "ready") {
    const player = room.players.get(peer.id);
    if (!player || room.phase !== "character" || !player.selected) return;
    player.ready = Boolean(message.ready);
    addLog(room, `${player.name} がレディ${player.ready ? "しました" : "を外しました"}。`);
    sendRoomState(room);
    maybeStartMatch(room);
    return;
  }

  if (message.type === "returnToCharacter") {
    if (!isHost(room, peer.id) || room.phase !== "result") return;
    room.phase = "character";
    room.match = null;
    room.result = null;
    for (const player of room.players.values()) {
      player.ready = false;
      player.selected = false;
      player.characterId = null;
      player.waiting = false;
    }
    addLog(room, "リザルトからキャラ選択へ戻りました。");
    sendRoomState(room);
    return;
  }

  if (message.type === "input") {
    const player = room.players.get(peer.id);
    if (!player) return;
    queuePlayerInput(room, player, message);
  }
}

function addPlayerToRoom(peer, room, name) {
  leaveRoom(peer, true);
  const input = normalizeBattleInput();
  const player = {
    id: peer.id,
    peer,
    name: cleanName(name),
    slot: nextSlot(room),
    ready: false,
    selected: false,
    characterId: null,
    waiting: room.phase === "game",
    input,
    appliedInput: input,
    inputTimeline: new Map(),
    inputSeq: 0,
    appliedInputSeq: 0,
    inputClientFrame: 0,
    inputSentAt: 0,
    lastInputAt: Date.now(),
    networkStatus: "ok",
    staleFrames: 0,
    lateInputs: 0
  };
  room.players.set(peer.id, player);
  peer.roomCode = room.code;
}

function leaveRoom(peer, silent) {
  if (!peer.roomCode) return;
  const room = rooms.get(peer.roomCode);
  const wasHost = room && room.hostId === peer.id;
  const wasGame = room && room.phase === "game";
  peer.roomCode = null;
  if (!room) return;

  const player = room.players.get(peer.id);
  if (player) {
    room.players.delete(peer.id);
    if (!silent) send(peer, { type: "leftRoom" });
    addLog(room, `${player.name} が退出しました。`);
  }

  if (room.players.size === 0) {
    rooms.delete(room.code);
    return;
  }

  if (wasHost && wasGame) {
    closeRoom(room, "ホストとの接続が切れたため部屋を解散しました。");
    return;
  }

  if (wasHost) {
    room.hostId = room.players.values().next().value.id;
    addLog(room, `${playerName(room, room.hostId)} が新しいホストになりました。`);
  }

  sendRoomState(room);
}

function closeRoom(room, message) {
  addLog(room, message);
  broadcast(room, { type: "roomClosed", message });
  for (const player of room.players.values()) {
    player.peer.roomCode = null;
  }
  rooms.delete(room.code);
}

function resetPlayerInputState(player) {
  const input = normalizeBattleInput();
  player.input = { ...input };
  player.appliedInput = { ...input };
  player.inputTimeline = new Map();
  player.inputSeq = 0;
  player.appliedInputSeq = 0;
  player.inputClientFrame = 0;
  player.inputSentAt = 0;
  player.lastInputAt = Date.now();
  player.networkStatus = "ok";
  player.staleFrames = 0;
  player.lateInputs = 0;
}

function queuePlayerInput(room, player, message) {
  const input = normalizeBattleInput(message.input);
  const now = Date.now();
  const seq = Number.isFinite(Number(message.seq)) ? Math.max(0, Math.floor(Number(message.seq))) : player.inputSeq + 1;
  if (seq <= player.inputSeq) return;

  player.input = { ...input };
  player.inputSeq = seq;
  player.inputClientFrame = clampInt(message.clientFrame, 0, Number.MAX_SAFE_INTEGER, 0);
  player.inputSentAt = Number.isFinite(Number(message.sentAt)) ? Number(message.sentAt) : 0;
  player.lastInputAt = now;
  player.networkStatus = "ok";

  if (!room.match || room.phase !== "game") {
    player.appliedInput = { ...input };
    player.appliedInputSeq = seq;
    return;
  }

  const match = room.match;
  const delay = clampInt(room.match.rules.inputDelay, 0, 8, DEFAULT_RULES.inputDelay);
  const requestedFrame = Number.isFinite(Number(message.targetFrame))
    ? Math.floor(Number(message.targetFrame))
    : match.frame + delay;
  const targetFrame = clampInt(
    requestedFrame,
    Math.max(1, match.frame - ROLLBACK_HISTORY_LIMIT + 2),
    match.frame + delay + ROLLBACK_FUTURE_LIMIT,
    match.frame + delay
  );
  const packet = {
    frame: targetFrame,
    input,
    seq,
    clientFrame: player.inputClientFrame,
    sentAt: player.inputSentAt,
    receivedAt: now
  };
  const previousPacket = player.inputTimeline.get(targetFrame);
  if (!previousPacket || previousPacket.seq < seq) player.inputTimeline.set(targetFrame, packet);

  if (targetFrame <= match.frame && match.countdown <= 0) {
    const used = match.inputHistory.find(entry => entry.frame === targetFrame)?.inputs?.[player.id]?.input;
    if (!used || !inputsEqual(used, input)) {
      player.lateInputs += 1;
      match.rollback.request(targetFrame, match.frame);
    }
  }
  trimInputTimeline(player, match.frame - INPUT_QUEUE_LIMIT);
}

function resolveFighterInput(room, fighter, frame = room.match.frame) {
  const match = room.match;
  const player = room.players.get(fighter.id);
  if (!player) {
    const input = normalizeBattleInput();
    return {
      input,
      seq: fighter.inputSeq || 0,
      status: "disconnected",
      meta: { seq: fighter.inputSeq || 0, status: "disconnected", queue: 0, age: null, drift: null }
    };
  }

  const packet = findInputPacket(player, frame);
  if (packet) {
    player.appliedInput = { ...packet.input };
    player.appliedInputSeq = packet.seq;
  }

  const ageFrames = packet ? Math.max(0, frame - packet.frame) : Number.POSITIVE_INFINITY;
  const age = Number.isFinite(ageFrames) ? ageFrames * (1000 / TICK_RATE) : null;
  let status = "ok";
  let input = packet ? packet.input : normalizeBattleInput();
  if (age === null || age > INPUT_STALE_MS) {
    input = normalizeBattleInput();
    player.appliedInput = { ...input };
    status = "stale";
    player.staleFrames += 1;
  } else if (age > INPUT_HOLD_MS) {
    status = "hold";
    player.staleFrames += 1;
  } else {
    player.staleFrames = 0;
  }

  player.networkStatus = status;
  return {
    input,
    seq: player.appliedInputSeq || 0,
    status,
    meta: {
      seq: player.appliedInputSeq || 0,
      status,
      queue: Array.from(player.inputTimeline.keys()).filter(inputFrame => inputFrame > frame).length,
      age,
      drift: player.inputClientFrame ? frame - player.inputClientFrame : null,
      late: player.lateInputs
    },
    frame: packet?.frame ?? null
  };
}

function findInputPacket(player, frame) {
  let selected = null;
  for (const packet of player.inputTimeline.values()) {
    if (packet.frame <= frame && (!selected || packet.frame > selected.frame || (packet.frame === selected.frame && packet.seq > selected.seq))) {
      selected = packet;
    }
  }
  return selected;
}

function trimInputTimeline(player, beforeFrame) {
  const frames = Array.from(player.inputTimeline.keys()).sort((a, b) => a - b);
  const baseline = frames.filter(frame => frame < beforeFrame).at(-1);
  for (const frame of frames) {
    if (frame < beforeFrame && frame !== baseline) player.inputTimeline.delete(frame);
  }
}

function inputsEqual(a, b) {
  return a.moveX === b.moveX && a.moveY === b.moveY &&
    a.jump === b.jump && a.attack === b.attack && a.smash === b.smash &&
    a.special === b.special && a.shield === b.shield && a.grab === b.grab &&
    a.shortHopMode === b.shortHopMode;
}

function recordFrameHistory(match, frameInputs) {
  const hash = calculateStateHash(match);
  match.lastHash = hash;
  const entry = { frame: match.frame, inputs: frameInputs };
  const last = match.inputHistory.at(-1);
  if (!last || last.frame < entry.frame) {
    match.inputHistory.push(entry);
  } else if (last.frame === entry.frame) {
    match.inputHistory[match.inputHistory.length - 1] = entry;
  } else {
    const existing = match.inputHistory.findIndex(item => item.frame >= entry.frame);
    if (existing >= 0 && match.inputHistory[existing].frame === entry.frame) match.inputHistory[existing] = entry;
    else match.inputHistory.splice(existing < 0 ? match.inputHistory.length : existing, 0, entry);
  }
  const excess = match.inputHistory.length - ROLLBACK_HISTORY_LIMIT;
  if (excess > 0) match.inputHistory.splice(0, excess);
  match.rollback.capture(match);
}

function calculateStateHash(match) {
  let hash = 2166136261;
  const push = value => {
    const text = String(value);
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
  };

  push(match.frame);
  push(match.projectileSeq || 0);
  push(match.finalSmash?.fighterId || "-");
  push(Math.round((match.finalSmash?.remaining || 0) * 1000));
  push(Math.round((match.finalSmash?.elapsed || 0) * 1000));
  push(match.finalSmash?.punchDone ? 1 : 0);
  for (const fighter of Array.from(match.fighters.values()).sort((a, b) => a.id.localeCompare(b.id))) {
    push(fighter.id);
    push(Math.round(fighter.x * 10));
    push(Math.round(fighter.y * 10));
    push(Math.round(fighter.vx * 10));
    push(Math.round(fighter.vy * 10));
    push(Math.round(fighter.damage * 1000));
    push(Math.round(fighter.hp * 1000));
    push(fighter.stocks);
    push(fighter.alive ? 1 : 0);
    push(fighter.eliminated ? 1 : 0);
    push(fighter.action || "-");
    push(Math.round((fighter.actionTime || 0) * 1000));
    push(Math.round((fighter.actionLock || 0) * 1000));
    push(fighter.smashCharge?.moveId || "-");
    push(Math.round((fighter.smashCharge?.elapsed || 0) * 1000));
    push(Math.round((fighter.smashCharge?.ratio || 0) * 1000));
    push(Math.round((fighter.novaCharge || 0) * 1000));
    push(fighter.novaCharging ? 1 : 0);
    push(fighter.recovery?.phase || "-");
    push(Math.round((fighter.recovery?.elapsed || 0) * 1000));
    push(fighter.moveState?.contact ? 1 : 0);
    push(fighter.moveState?.spawned ? 1 : 0);
    push(fighter.throwState?.moveId || "-");
    push(Math.round((fighter.throwState?.elapsed || 0) * 1000));
    push(fighter.throwState?.nextHit || 0);
    push((fighter.hitList || []).join(","));
    push(fighter.moveState?.impulseApplied ? 1 : 0);
    push(fighter.moveState?.chainQueued ? 1 : 0);
    push(Math.round((fighter.moveState?.chainInputUntil || 0) * 1000));
    push(fighter.jabContinuation?.moveId || "-");
    push(Math.round((fighter.jabContinuation?.remaining || 0) * 1000));
    push(fighter.moveState?.staleRecorded ? 1 : 0);
    push(Math.round((fighter.lastInput?.moveX || 0) * 1000));
    push(Math.round((fighter.lastInput?.moveY || 0) * 1000));
    push(fighter.lastInput?.jump ? 1 : 0);
    push(fighter.lastInput?.shortHopMode || "both");
    push(fighter.lastInput?.attack ? 1 : 0);
    push(fighter.lastInput?.smash ? 1 : 0);
    push(fighter.lastInput?.special ? 1 : 0);
    push(fighter.lastInput?.shield ? 1 : 0);
    push(fighter.lastInput?.grab ? 1 : 0);
    push(fighter.shield ? 1 : 0);
    push(Math.round((fighter.shieldHp || 0) * 10));
    push(Math.round((fighter.dodgeInvuln || 0) * 1000));
    push(Math.round((fighter.clankLag || 0) * 1000));
    push(Math.round((fighter.finalGauge || 0) * 1000));
    push(fighter.grabbing || "-");
    push(fighter.grabbedBy || "-");
    push(fighter.crouching ? 1 : 0);
    push(fighter.tumbling ? 1 : 0);
    push(fighter.knockdown?.phase || "-");
    push(Math.round((fighter.knockdown?.elapsed || 0) * 1000));
    push(fighter.knockdownPending ? 1 : 0);
    push(fighter.jumps);
    push(fighter.jumpArcActive ? 1 : 0);
    push(fighter.groundJump?.shortHop ? 1 : 0);
    push(fighter.groundJump?.releaseWindowClosed ? 1 : 0);
    push(Math.round((fighter.groundJump?.targetY || 0) * 10));
    push(Math.round((fighter.groundJump?.gravity || 0) * 10));
    push(Math.round((fighter.groundJump?.fullJumpSpeed || 0) * 10));
    push(fighter.runTurn?.direction || 0);
    push(Math.round((fighter.runTurn?.elapsed || 0) * 1000));
    push(Math.round((fighter.runTurn?.duration || 0) * 1000));
    push(Math.round((fighter.runTurn?.startVelocity || 0) * 10));
    push(fighter.ledgeHorizontalLocked ? 1 : 0);
    push(Math.round((fighter.ledgeClimb?.elapsed || 0) * 1000));
    push(Math.round((fighter.ledgeRoll?.elapsed || 0) * 1000));
  }
  for (const projectile of (match.projectiles || []).slice().sort((a, b) => a.id.localeCompare(b.id))) {
    push(projectile.id);
    push(projectile.ownerId);
    push(projectile.kind);
    push(Math.round(projectile.x * 10));
    push(Math.round(projectile.y * 10));
    push(Math.round(projectile.vx * 10));
    push(Math.round(projectile.vy * 10));
    push(Math.round((projectile.age || 0) * 1000));
    push(Math.round((projectile.distance || 0) * 10));
  }
  return hash >>> 0;
}

function maybeStartMatch(room) {
  const players = Array.from(room.players.values()).filter(player => !player.waiting);
  if (room.phase !== "character" || players.length < 2) return;
  if (!players.every(player => player.selected && player.ready)) return;
  startMatch(room);
}

function startMatch(room) {
  const players = Array.from(room.players.values()).filter(player => !player.waiting).slice(0, room.rules.maxPlayers);
  room.phase = "game";
  room.result = null;
  room.match = battleSimulation.createMatch({
    id: crypto.randomUUID(),
    rules: room.rules,
    countdown: 3.2
  });
  const stage = room.match.stage;
  Object.assign(room.match, {
    inputHistory: [],
    rollback: new RollbackManager(ROLLBACK_HISTORY_LIMIT),
    lastHash: 0,
    lastBroadcastFrame: 0
  });

  players.forEach((player, index) => {
    resetPlayerInputState(player);
    const spawn = stage.spawn[index] || [WORLD.width / 2, 380];
    room.match.fighters.set(player.id, battleSimulation.createFighter({
      id: player.id,
      name: player.name,
      characterId: player.characterId,
      slot: player.slot,
      colorIndex: index,
      spawn,
      facing: index % 2 === 0 ? 1 : -1,
      rules: room.match.rules,
      invuln: 2
    }));
  });
  room.match.rollback.capture(room.match);

  addLog(room, "全員レディ。試合を開始します。");
  sendRoomState(room);
}

function updateMatch(room, rawDt) {
  const match = room.match;
  if (!match) return;
  performPendingRollback(room, rawDt);
  if (room.match !== match) return;
  simulateMatchFrame(room, rawDt);

  if (battleSimulation.shouldFinish(room.match)) {
    const timedOut = match.rules.timeLimit > 0 && match.elapsed >= match.rules.timeLimit;
    finishMatch(room, timedOut ? "時間切れ" : "決着");
    return;
  }

  sendSnapshotIfNeeded(room);
}

function simulateMatchFrame(room, rawDt, resimulating = false) {
  const match = room.match;
  if (!match) return;

  if (match.countdown > 0) {
    battleSimulation.step(match, new Map(), rawDt);
    recordFrameHistory(match, {});
    return;
  }

  const frameInputs = {};
  const resolvedInputs = new Map();
  const nextFrame = match.frame + 1;

  for (const fighter of match.fighters.values()) {
    const inputPacket = resolveFighterInput(room, fighter, nextFrame);
    fighter.networkStatus = inputPacket.status;
    fighter.inputSeq = inputPacket.seq;
    frameInputs[fighter.id] = { ...inputPacket.meta, input: { ...inputPacket.input } };
    resolvedInputs.set(fighter.id, inputPacket.input);
  }

  battleSimulation.step(match, resolvedInputs, rawDt);

  recordFrameHistory(match, frameInputs);
  if (resimulating && match.frame <= (match.lastBroadcastFrame || 0)) match.events = [];
}

function performPendingRollback(room, rawDt) {
  const match = room.match;
  const fromFrame = match.rollback.consumeRequest();
  if (fromFrame === null) return;
  const currentFrame = match.frame;
  const baseFrame = fromFrame - 1;
  if (!match.rollback.restore(match, baseFrame)) return;

  match.inputHistory = match.inputHistory.filter(entry => entry.frame <= baseFrame);
  match.rollback.begin();
  while (match.frame < currentFrame) simulateMatchFrame(room, rawDt, true);
  match.rollback.complete(fromFrame, currentFrame);
}

function sendSnapshotIfNeeded(room) {
  const match = room.match;
  if (!match) return;
  const interval = Math.max(1, Math.round(TICK_RATE / SNAPSHOT_RATE));
  if (match.frame % interval !== 0) return;
  const snapshot = buildSnapshot(room);
  match.events = [];
  match.lastBroadcastFrame = match.frame;
  broadcast(room, { type: "matchSnapshot", snapshot });
}

function finishMatch(room, reason) {
  const match = room.match;
  if (!match) return;
  room.phase = "result";
  room.result = battleSimulation.buildResult(match, reason);
  room.match = null;
  for (const player of room.players.values()) player.ready = false;
  addLog(room, `試合終了: ${reason}`);
  sendRoomState(room);
}

function buildSnapshot(room) {
  const match = room.match;
  return battleSimulation.snapshot(match, {
    phase: room.phase,
    serverTime: Date.now(),
    stateHash: match.lastHash || 0,
    net: {
      inputDelay: match.rules.inputDelay,
      historyStart: match.inputHistory[0]?.frame ?? match.frame,
      historyEnd: match.inputHistory.at(-1)?.frame ?? match.frame,
      rollbackRevision: match.rollback.revision,
      rollbackCount: match.rollback.rollbackCount,
      rollbackFrames: match.rollback.lastRollbackFrames
    }
  });
}

function sendRoomState(room) {
  for (const player of room.players.values()) {
    send(player.peer, { type: "roomState", room: roomView(room, player.id) });
  }
}

function roomView(room, viewerId) {
  return {
    code: room.code,
    phase: room.phase,
    hostId: room.hostId,
    selfId: viewerId,
    isHost: room.hostId === viewerId,
    rules: room.rules,
    assetManifest: buildAssetManifest(room),
    logs: room.logs.slice(-80),
    result: room.result,
    players: Array.from(room.players.values()).map(player => ({
      id: player.id,
      name: player.name,
      slot: player.slot,
      isHost: player.id === room.hostId,
      isSelf: player.id === viewerId,
      ready: player.ready,
      selected: player.selected,
      waiting: player.waiting,
      networkStatus: player.networkStatus,
      characterId: player.id === viewerId ? player.characterId : null
    }))
  };
}

function buildAssetManifest(room) {
  const characters = new Set(["nova"]);
  for (const player of room.players.values()) {
    if (player.characterId) characters.add(player.characterId);
  }
  return {
    stage: room.rules.stage,
    characters: Array.from(characters)
  };
}

function broadcast(room, data) {
  for (const player of room.players.values()) send(player.peer, data);
}

function addLog(room, text) {
  const time = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  room.logs.push({ time, text });
  if (room.logs.length > 120) room.logs.shift();
}

function cleanName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ").slice(0, 18);
  return name || `Player${Math.floor(Math.random() * 90 + 10)}`;
}

function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let code = "";
    for (let i = 0; i < 5; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
    if (!rooms.has(code)) return code;
  }
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function nextSlot(room) {
  const used = new Set(Array.from(room.players.values()).map(player => player.slot));
  for (let i = 1; i <= 4; i += 1) if (!used.has(i)) return i;
  return room.players.size + 1;
}

function normalizeRules(raw, fallback = DEFAULT_RULES, playerCount = 0) {
  const source = raw && typeof raw === "object" ? raw : {};
  const previous = fallback || DEFAULT_RULES;
  const minPlayers = Math.max(2, playerCount || 0);
  const mode = ["stock", "time", "hp"].includes(source.mode) ? source.mode : previous.mode;
  const stage = STAGES[source.stage] ? source.stage : previous.stage;
  return {
    mode,
    stocks: clampInt(source.stocks, 1, 9, previous.stocks),
    timeLimit: normalizeTimeLimit(source.timeLimit, previous.timeLimit),
    hp: clampInt(source.hp, 50, 500, previous.hp),
    maxPlayers: clampInt(source.maxPlayers, minPlayers, 4, previous.maxPlayers),
    stage,
    gameSpeed: clampNumber(Number(source.gameSpeed), 0.75, 1.25, previous.gameSpeed),
    inputDelay: clampInt(source.inputDelay, 0, 8, previous.inputDelay ?? DEFAULT_RULES.inputDelay),
    finalSmash: typeof source.finalSmash === "boolean" ? source.finalSmash : Boolean(previous.finalSmash),
    debug: Boolean(source.debug)
  };
}

function rulesSummary(rules, previous) {
  const parts = [];
  if (!previous || rules.mode !== previous.mode) parts.push(`形式=${ruleModeLabel(rules.mode)}`);
  if (!previous || rules.stage !== previous.stage) parts.push(`ステージ=${STAGES[rules.stage].name}`);
  if (!previous || rules.maxPlayers !== previous.maxPlayers) parts.push(`人数=${rules.maxPlayers}`);
  if (!previous || rules.stocks !== previous.stocks) parts.push(`ストック=${rules.stocks}`);
  if (!previous || rules.timeLimit !== previous.timeLimit) {
    parts.push(`時間=${rules.timeLimit === 0 ? "無限" : formatTime(rules.timeLimit)}`);
  }
  if (!previous || rules.hp !== previous.hp) parts.push(`体力=${rules.hp}`);
  if (!previous || rules.gameSpeed !== previous.gameSpeed) parts.push(`速度=${rules.gameSpeed}x`);
  if (!previous || rules.inputDelay !== previous.inputDelay) parts.push(`入力遅延=${rules.inputDelay}F`);
  if (!previous || rules.finalSmash !== previous.finalSmash) parts.push(`切りふだ=${rules.finalSmash ? "ON" : "OFF"}`);
  if (!previous || rules.debug !== previous.debug) parts.push(`判定表示=${rules.debug ? "ON" : "OFF"}`);
  return parts.length ? parts.join(" / ") : "変更なし";
}

function ruleModeLabel(mode) {
  return mode === "stock" ? "ストック制" : mode === "time" ? "タイム制" : "体力制";
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function playerName(room, id) {
  const player = room.players.get(id);
  return player ? player.name : "Player";
}

function isHost(room, id) {
  return room.hostId === id;
}

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

