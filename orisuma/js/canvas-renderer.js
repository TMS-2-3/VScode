import { PLAYER_COLORS } from "./constants.js";
import { FINAL_SMASH, NOVA_CHARGE, SHIELD, SMASH_CHARGE, getMainPlatformTriangle } from "./battle-data.js";
import { formatTime, roundRect } from "./utils.js";

const SCREEN_CENTER_X = 640;
const SCREEN_CENTER_Y = 330;
const CAMERA_MIN_SCALE = 0.5;
const CAMERA_MAX_SCALE = 0.88;

export class CanvasRenderer {
  constructor(assetManager) {
    this.assets = assetManager;
    this.canvas = null;
    this.ctx = null;
    this.effects = [];
    this.seenEventIds = new Set();
    this.camera = { x: 640, y: 390, scale: 0.72 };
    this.presentationMatchId = null;
    this.presentationFighters = new Map();
    this.presentationList = [];
  }

  attach(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext("2d") : null;
  }

  draw(snapshot, extrapolationSeconds = 0) {
    if (!this.ctx || !snapshot) return;
    const ctx = this.ctx;
    const fighters = this.presentFighters(snapshot, extrapolationSeconds);

    this.updateCamera(fighters);
    this.assets.drawBackground(ctx, snapshot.rules.stage);
    const stageLayer = this.assets.getStageLayer(snapshot.stage, snapshot.rules.stage);
    this.collectEffects(snapshot);
    ctx.save();
    this.applyCamera(ctx);
    ctx.drawImage(stageLayer, 0, 0);
    if (snapshot.rules.debug) this.drawStageDebug(ctx, snapshot.stage);

    this.drawProjectiles(ctx, snapshot.projectiles || []);
    for (const fighter of fighters) this.drawFighter(ctx, fighter, snapshot.rules);
    this.drawWorldEffects(ctx);
    ctx.restore();
    this.drawScreenEffects(ctx);
    this.drawOffscreenMarkers(fighters);
    this.drawHud(ctx, snapshot);
  }

  presentFighters(snapshot, extrapolationSeconds) {
    if (snapshot.id !== this.presentationMatchId) {
      this.presentationMatchId = snapshot.id;
      this.presentationFighters.clear();
    }

    const seconds = this.clamp(Number(extrapolationSeconds) || 0, 0, 0.05);
    this.presentationList.length = 0;
    for (const fighter of snapshot.fighters) {
      let presented = this.presentationFighters.get(fighter.id);
      if (!presented) {
        presented = {};
        this.presentationFighters.set(fighter.id, presented);
      }
      Object.assign(presented, fighter);
      if (fighter.alive && !fighter.ledge && (fighter.respawnPlatform || 0) <= 0) {
        presented.x = fighter.x + fighter.vx * seconds;
        presented.y = fighter.y + fighter.vy * seconds;
      }
      this.presentationList.push(presented);
    }
    return this.presentationList;
  }

  collectEffects(snapshot) {
    const now = performance.now();
    for (const event of snapshot.events || []) {
      if (!["ko", "clank", "finalSmash"].includes(event.kind) || this.seenEventIds.has(event.id)) continue;
      this.seenEventIds.add(event.id);
      const fighter = snapshot.fighters.find(item => item.id === event.targetId);
      const worldX = Number.isFinite(event.x) ? event.x : fighter ? fighter.x : 640;
      const worldY = Number.isFinite(event.y) ? event.y : fighter ? fighter.y : 360;
      if (event.kind !== "ko") {
        this.effects.push({
          id: event.id,
          kind: event.kind,
          x: worldX,
          y: worldY,
          startedAt: now,
          duration: event.kind === "finalSmash" ? 900 : event.kind === "clank" ? 280 : 340
        });
        continue;
      }
      const path = this.koBlastPath(worldX, worldY, snapshot.stage);
      this.effects.push({
        id: event.id,
        kind: "ko",
        x: worldX,
        y: worldY,
        targetWorldX: path.targetWorldX,
        targetWorldY: path.targetWorldY,
        originX: path.originX,
        originY: path.originY,
        targetX: path.targetX,
        targetY: path.targetY,
        dirX: path.dirX,
        dirY: path.dirY,
        distance: path.distance,
        startedAt: now,
        duration: 920
      });
    }
    if (this.seenEventIds.size > 120) this.seenEventIds.clear();
    this.effects = this.effects.filter(effect => now - effect.startedAt < effect.duration);
  }

  applyCamera(ctx) {
    ctx.translate(SCREEN_CENTER_X, SCREEN_CENTER_Y);
    ctx.scale(this.camera.scale, this.camera.scale);
    ctx.translate(-this.camera.x, -this.camera.y);
  }

  worldToScreen(x, y) {
    return {
      x: SCREEN_CENTER_X + (x - this.camera.x) * this.camera.scale,
      y: SCREEN_CENTER_Y + (y - this.camera.y) * this.camera.scale
    };
  }

  updateCamera(presentedFighters) {
    let count = 0;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const fighter of presentedFighters) {
      if (!fighter.alive || fighter.eliminated) continue;
      count += 1;
      minX = Math.min(minX, fighter.x);
      maxX = Math.max(maxX, fighter.x);
      minY = Math.min(minY, fighter.y);
      maxY = Math.max(maxY, fighter.y);
    }
    if (count === 0) return;
    const spanX = Math.max(360, maxX - minX + 360);
    const spanY = Math.max(300, maxY - minY + 260);
    const targetScale = this.clamp(Math.min(1080 / spanX, 520 / spanY), CAMERA_MIN_SCALE, CAMERA_MAX_SCALE);
    const targetX = this.clamp((minX + maxX) / 2, 360, 920);
    const targetY = this.clamp((minY + maxY) / 2 + 35, 245, 500);
    const positionEase = 0.085;
    const zoomEase = 0.065;
    this.camera.x += (targetX - this.camera.x) * positionEase;
    this.camera.y += (targetY - this.camera.y) * positionEase;
    this.camera.scale += (targetScale - this.camera.scale) * zoomEase;
  }

  koBlastPath(worldX, worldY, stage) {
    const mainPlatform = stage?.platforms?.find(platform => platform.type === "main") || stage?.platforms?.[0];
    const targetWorldX = mainPlatform ? mainPlatform.x + mainPlatform.w / 2 : 640;
    const targetWorldY = mainPlatform ? mainPlatform.y - 90 : 360;
    const deathScreen = this.worldToScreen(worldX, worldY);
    const targetScreen = this.worldToScreen(targetWorldX, targetWorldY);
    const originX = this.clamp(deathScreen.x, 0, 1280);
    const originY = this.clamp(deathScreen.y, 0, 720);
    const dx = targetScreen.x - originX;
    const dy = targetScreen.y - originY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    return {
      targetWorldX,
      targetWorldY,
      originX,
      originY,
      targetX: targetScreen.x,
      targetY: targetScreen.y,
      dirX: dx / distance,
      dirY: dy / distance,
      distance
    };
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  drawStageDebug(ctx, stage) {
    ctx.strokeStyle = "rgba(255,95,95,0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(stage.blast.left, stage.blast.top, stage.blast.right - stage.blast.left, stage.blast.bottom - stage.blast.top);
    for (const platform of stage.platforms) {
      if (platform.type !== "main") {
        ctx.strokeRect(platform.x, platform.y, platform.w, platform.h);
        continue;
      }
      const triangle = getMainPlatformTriangle(platform);
      ctx.beginPath();
      ctx.moveTo(triangle.left, triangle.top);
      ctx.lineTo(triangle.right, triangle.top);
      ctx.lineTo(triangle.apexX, triangle.apexY);
      ctx.closePath();
      ctx.stroke();
    }
  }

  drawFighter(ctx, fighter, rules) {
    if (!fighter.alive) {
      if (fighter.respawn > 0) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "700 18px Segoe UI, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${fighter.name} 復帰中`, 640, 105 + fighter.slot * 24);
        ctx.textAlign = "left";
      }
      return;
    }

    if (fighter.respawnPlatform > 0) this.drawRespawnPlatform(ctx, fighter);

    ctx.save();
    ctx.translate(fighter.x, fighter.y);
    if (fighter.crouching) ctx.translate(0, fighter.h * 0.15);
    ctx.scale(fighter.facing, fighter.crouching ? 0.7 : 1);

    if (fighter.invuln > 0 && Math.floor(fighter.invuln * 12) % 2 === 0) ctx.globalAlpha = 0.55;
    if (fighter.dodge) {
      ctx.strokeStyle = "rgba(255,255,255,0.72)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(0, 2, fighter.dodge === "airDodge" ? 44 : 38, 30, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    this.drawNovaMoveEffect(ctx, fighter);
    if (fighter.smashCharge) this.drawSmashCharge(ctx, fighter);
    const sprite = this.assets.getFighterSprite(fighter.characterId || "nova", fighter.colorIndex, Boolean(fighter.action));
    ctx.drawImage(sprite.canvas, -sprite.cx, -sprite.cy);

    if (fighter.shield || fighter.justGuard) {
      const shieldRatio = fighter.shieldMax ? fighter.shieldHp / fighter.shieldMax : 1;
      const radius = SHIELD.radius;
      ctx.strokeStyle = fighter.justGuard ? "rgba(255,225,102,1)" : this.shieldColor(shieldRatio);
      ctx.lineWidth = fighter.justGuard ? 8 : 5;
      ctx.beginPath();
      ctx.arc(0, 2, radius, 0, Math.PI * 2);
      ctx.stroke();
      if (fighter.justGuard) {
        const pulse = 8 + Math.sin(performance.now() * 0.04) * 4;
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 2, radius + pulse, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();

    if (fighter.ledge) this.drawLedgeGrip(ctx, fighter);
    if (fighter.grabbedBy) this.drawGrabbedStatus(ctx, fighter);

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    roundRect(ctx, fighter.x - 40, fighter.y - fighter.h / 2 - 28, 80, 20, 8);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 13px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`P${fighter.slot}`, fighter.x, fighter.y - fighter.h / 2 - 13);
    ctx.textAlign = "left";

    if (rules.debug) this.drawDebugFighter(ctx, fighter);
  }

  drawNovaMoveEffect(ctx, fighter) {
    const action = fighter.action || "";
    const time = fighter.actionTime || 0;
    if (!action || fighter.characterId !== "nova") return;
    ctx.save();
    ctx.lineCap = "round";

    if (["jab1", "jab2", "jab3", "side", "airForward", "smashSide", "smashUp"].includes(action)) {
      const reach = action === "side" ? 74 : action === "smashSide" ? 94 : 54;
      ctx.strokeStyle = action.startsWith("smash") ? "rgba(255,216,77,0.88)" : "rgba(115,239,255,0.72)";
      ctx.lineWidth = action.startsWith("smash") ? 13 : 8;
      ctx.beginPath();
      ctx.moveTo(18, -28);
      ctx.quadraticCurveTo(reach * 0.55, -55 - Math.sin(time * 24) * 8, reach, -30);
      ctx.stroke();
    }
    if (["up", "airNeutral"].includes(action)) {
      ctx.strokeStyle = "rgba(115,239,255,0.7)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(0, -24, action === "airNeutral" ? 45 : 58, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    }
    if (["down", "smashDown", "airBack", "airDown", "throwDown"].includes(action)) {
      const rear = action === "airBack";
      const downward = action === "airDown";
      const x = rear ? -48 : 0;
      const y = downward ? 35 : 18;
      const flame = ctx.createRadialGradient(x, y, 2, x, y, downward ? 54 : 42);
      flame.addColorStop(0, "rgba(255,246,170,0.95)");
      flame.addColorStop(0.45, "rgba(255,119,45,0.82)");
      flame.addColorStop(1, "rgba(255,65,30,0)");
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.ellipse(x, y, downward ? 48 : 58, downward ? 58 : 30, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (action === "dashAttack") {
      const flame = ctx.createRadialGradient(-25, -12, 3, -25, -12, 58);
      flame.addColorStop(0, "rgba(235,252,255,0.98)");
      flame.addColorStop(0.32, "rgba(80,224,255,0.9)");
      flame.addColorStop(0.7, "rgba(255,119,45,0.7)");
      flame.addColorStop(1, "rgba(255,65,30,0)");
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.ellipse(-38, -10, 65, 27, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (action === "throwBack") {
      ctx.strokeStyle = "rgba(115,239,255,0.84)";
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(-15, -27);
      ctx.lineTo(-104, -34);
      ctx.stroke();
    }
    if (action === "specialNeutral") {
      ctx.fillStyle = "rgba(145,244,255,0.9)";
      ctx.beginPath();
      ctx.arc(13, -31, 6 + Math.sin(time * 28) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (action === "specialSide") {
      ctx.strokeStyle = "rgba(255,216,77,0.76)";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(18, -29);
      ctx.lineTo(66, -29);
      ctx.stroke();
    }
    if (action === "airUp" || action === "specialUp" || action === "specialFall") {
      ctx.fillStyle = "rgba(91,226,255,0.82)";
      ctx.beginPath();
      ctx.moveTo(-16, 24);
      ctx.lineTo(-5, 24);
      ctx.lineTo(-11, 74 + Math.sin(time * 34) * 8);
      ctx.moveTo(6, 24);
      ctx.lineTo(17, 24);
      ctx.lineTo(12, 74 + Math.sin(time * 31) * 8);
      ctx.fill();
    }
    if (action === "novaCharge") {
      const ratio = this.clamp(fighter.novaChargeRatio || 0, 0, 1);
      ctx.strokeStyle = ratio >= 1 ? "#ffffff" : "rgba(68,232,206,0.9)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, -4, 38 + Math.sin(performance.now() * 0.016) * 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.05, ratio));
      ctx.stroke();
    }
    ctx.restore();
  }

  drawProjectiles(ctx, projectiles) {
    for (const projectile of projectiles) {
      ctx.save();
      ctx.translate(projectile.x, projectile.y);
      ctx.rotate(Math.atan2(projectile.vy, projectile.vx));
      if (projectile.kind === "novaBeam") {
        const beam = ctx.createLinearGradient(-projectile.w / 2, 0, projectile.w / 2, 0);
        beam.addColorStop(0, "rgba(105,235,255,0.15)");
        beam.addColorStop(0.18, "rgba(105,235,255,0.95)");
        beam.addColorStop(0.82, "rgba(255,255,255,0.95)");
        beam.addColorStop(1, "rgba(105,235,255,0.1)");
        ctx.fillStyle = beam;
        roundRect(ctx, -projectile.w / 2, -projectile.h / 2, projectile.w, projectile.h, 4);
        ctx.fill();
      } else {
        ctx.fillStyle = "#edf4f8";
        roundRect(ctx, -projectile.w / 2, -projectile.h / 2, projectile.w * 0.72, projectile.h, 6);
        ctx.fill();
        ctx.fillStyle = "#253340";
        roundRect(ctx, projectile.w * 0.08, -projectile.h * 0.36, projectile.w * 0.35, projectile.h * 0.72, 5);
        ctx.fill();
        ctx.fillStyle = "rgba(255,112,42,0.88)";
        ctx.beginPath();
        ctx.moveTo(-projectile.w / 2, -projectile.h * 0.28);
        ctx.lineTo(-projectile.w * 0.86, 0);
        ctx.lineTo(-projectile.w / 2, projectile.h * 0.28);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawSmashCharge(ctx, fighter) {
    const ratio = this.clamp(
      fighter.smashCharge.ratio ?? fighter.smashCharge.elapsed / SMASH_CHARGE.maxDuration,
      0,
      1
    );
    const pulse = 1 + Math.sin(performance.now() * 0.012) * 0.06;
    const radius = 42 * pulse;
    const playerColor = PLAYER_COLORS[(fighter.colorIndex || 0) % PLAYER_COLORS.length];

    ctx.save();
    ctx.scale(fighter.facing, 1);
    ctx.globalAlpha *= 0.9;
    ctx.strokeStyle = ratio >= 1 ? "#fff2a6" : playerColor;
    ctx.lineWidth = ratio >= 1 ? 7 : 5;
    ctx.beginPath();
    ctx.arc(0, 1, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.04, ratio));
    ctx.stroke();

    ctx.globalAlpha *= 0.45 + ratio * 0.35;
    ctx.fillStyle = ratio >= 1 ? "#ffd84d" : playerColor;
    ctx.beginPath();
    ctx.arc(0, 1, 25 + ratio * 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  shieldColor(ratio) {
    const value = this.clamp(ratio, 0, 1);
    if (value >= 0.5) return this.mixColor([255, 205, 74], [72, 211, 205], (value - 0.5) * 2);
    return this.mixColor([255, 82, 82], [255, 205, 74], value * 2);
  }

  mixColor(from, to, amount) {
    const values = from.map((value, index) => Math.round(value + (to[index] - value) * amount));
    return `rgba(${values[0]},${values[1]},${values[2]},0.92)`;
  }

  drawGrabbedStatus(ctx, fighter) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,214,92,0.9)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(fighter.x, fighter.y - 8, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawRespawnPlatform(ctx, fighter) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 3;
    roundRect(ctx, fighter.x - 58, fighter.y + fighter.h / 2 + 8, 116, 14, 7);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawLedgeGrip(ctx, fighter) {
    const ledge = fighter.ledge;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(ledge.x, ledge.y);
    ctx.lineTo(fighter.x - ledge.side * 10, fighter.y - 24);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ledge.x, ledge.y + 2, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(16,20,25,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  drawDebugFighter(ctx, fighter) {
    ctx.strokeStyle = "rgba(34,199,169,0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(fighter.x - fighter.w / 2, fighter.y - fighter.h / 2, fighter.w, fighter.h);
    if (fighter.hitbox) {
      ctx.strokeStyle = "rgba(255,95,95,0.95)";
      for (const hitbox of fighter.hitboxes || [fighter.hitbox]) {
        ctx.strokeRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
      }
    }
    ctx.strokeStyle = "rgba(245,182,66,0.9)";
    ctx.beginPath();
    ctx.moveTo(fighter.x, fighter.y);
    ctx.lineTo(fighter.x + fighter.vx * 0.12, fighter.y + fighter.vy * 0.12);
    ctx.stroke();
  }

  drawWorldEffects(ctx) {
    const now = performance.now();
    for (const effect of this.effects) {
      const t = Math.max(0, Math.min(1, (now - effect.startedAt) / effect.duration));
      if (effect.kind === "ko") this.drawKoEffect(ctx, effect, t);
      if (effect.kind === "clank") this.drawCollisionEffect(ctx, effect, t);
      if (effect.kind === "finalSmash") this.drawFinalSmashEffect(ctx, effect, t);
    }
  }

  drawFinalSmashEffect(ctx, effect, t) {
    const alpha = 1 - t;
    const pulse = 36 + t * 130;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#ffdc66";
    ctx.lineWidth = 10 - t * 7;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5 - t * 3;
    for (let index = 0; index < 12; index += 1) {
      const angle = (Math.PI * 2 * index) / 12;
      const inner = 24 + t * 45;
      const outer = 90 + t * 150;
      ctx.beginPath();
      ctx.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner);
      ctx.lineTo(effect.x + Math.cos(angle) * outer, effect.y + Math.sin(angle) * outer);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawCollisionEffect(ctx, effect, t) {
    const alpha = 1 - t;
    const radius = 12 + t * 50;
    const rays = 8;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 6 - t * 4;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    for (let index = 0; index < rays; index += 1) {
      const angle = (Math.PI * 2 * index) / rays;
      const inner = radius + 5;
      const outer = radius + 24 + t * 22;
      ctx.beginPath();
      ctx.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner);
      ctx.lineTo(effect.x + Math.cos(angle) * outer, effect.y + Math.sin(angle) * outer);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawKoEffect(ctx, effect, t) {
    const alpha = 1 - t;
    const radius = 30 + t * 120;
    const travelEase = 1 - Math.pow(1 - t, 3);
    const targetWorldX = effect.targetWorldX ?? 640;
    const targetWorldY = effect.targetWorldY ?? 360;
    const towardX = targetWorldX - effect.x;
    const towardY = targetWorldY - effect.y;
    const towardDistance = Math.max(1, Math.hypot(towardX, towardY));
    const beamDistance = Math.min(towardDistance, 520) * travelEase;
    const beamHeadX = effect.x + (towardX / towardDistance) * beamDistance;
    const beamHeadY = effect.y + (towardY / towardDistance) * beamDistance;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 8 * (1 - t) + 2;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    const beam = ctx.createLinearGradient(effect.x, effect.y, beamHeadX, beamHeadY);
    beam.addColorStop(0, "rgba(255,255,255,0)");
    beam.addColorStop(0.35, "rgba(255,255,255,0.9)");
    beam.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = beam;
    ctx.lineCap = "round";
    ctx.lineWidth = 38 - t * 22;
    ctx.beginPath();
    ctx.moveTo(effect.x, effect.y);
    ctx.lineTo(beamHeadX, beamHeadY);
    ctx.stroke();

    ctx.strokeStyle = "#ffef8a";
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      const inner = 18 + t * 35;
      const outer = 70 + t * 130;
      ctx.beginPath();
      ctx.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner);
      ctx.lineTo(effect.x + Math.cos(angle) * outer, effect.y + Math.sin(angle) * outer);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawScreenEffects(ctx) {
    const now = performance.now();
    for (const effect of this.effects) {
      if (effect.kind !== "ko") continue;
      const t = Math.max(0, Math.min(1, (now - effect.startedAt) / effect.duration));
      this.drawKoBlastLine(ctx, effect, t);
    }
  }

  drawOffscreenMarkers(fighters) {
    const bounds = { left: 38, right: 1242, top: 38, bottom: 604 };
    for (const fighter of fighters) {
      if (!fighter.alive || fighter.eliminated) continue;
      const screen = this.worldToScreen(fighter.x, fighter.y);
      const outside = screen.x < bounds.left || screen.x > bounds.right || screen.y < bounds.top || screen.y > bounds.bottom;
      if (!outside) continue;
      const markerX = this.clamp(screen.x, bounds.left, bounds.right);
      const markerY = this.clamp(screen.y, bounds.top, bounds.bottom);
      const angle = Math.atan2(screen.y - markerY, screen.x - markerX);
      const color = PLAYER_COLORS[fighter.colorIndex % PLAYER_COLORS.length];

      this.ctx.save();
      this.ctx.translate(markerX, markerY);
      this.ctx.rotate(angle);
      this.ctx.fillStyle = color;
      this.ctx.strokeStyle = "rgba(0,0,0,0.65)";
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(15, 0);
      this.ctx.lineTo(-11, -10);
      this.ctx.lineTo(-11, 10);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();

      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "800 13px Segoe UI, sans-serif";
      this.ctx.textAlign = "center";
      const labelY = markerY > 545 ? markerY - 20 : markerY + 25;
      this.ctx.fillText(`P${fighter.slot}`, markerX, this.clamp(labelY, 18, 610));
      this.ctx.textAlign = "left";
    }
  }

  drawKoBlastLine(ctx, effect, t) {
    const headProgress = 1 - Math.pow(1 - t, 3);
    const tailTime = this.clamp((t - 0.24) / 0.76, 0, 1);
    const tailProgress = 1 - Math.pow(1 - tailTime, 2);
    const alpha = Math.max(0, 1 - t);
    const headX = effect.originX + effect.dirX * effect.distance * headProgress;
    const headY = effect.originY + effect.dirY * effect.distance * headProgress;
    const tailX = effect.originX + effect.dirX * effect.distance * tailProgress;
    const tailY = effect.originY + effect.dirY * effect.distance * tailProgress;
    const perpX = -effect.dirY;
    const perpY = effect.dirX;

    ctx.save();
    ctx.globalAlpha = alpha;

    const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.28, "rgba(255,255,255,0.92)");
    grad.addColorStop(1, "rgba(255,238,135,0.95)");
    ctx.strokeStyle = grad;
    ctx.lineCap = "round";
    ctx.lineWidth = 20 - t * 12;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(headX, headY);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.72)";
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i += 1) {
      const offset = i * 28;
      const startX = tailX + perpX * offset;
      const startY = tailY + perpY * offset;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(headX + perpX * offset * 0.3, headY + perpY * offset * 0.3);
      ctx.stroke();
    }

    ctx.fillStyle = "#fff7a6";
    ctx.beginPath();
    ctx.arc(headX, headY, 22 - t * 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(effect.originX, effect.originY, 36 + t * 80, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawHud(ctx, snapshot) {
    const panelY = 616;
    const textTop = panelY + 33;
    const textBottom = panelY + 56;

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    roundRect(ctx, 24, panelY, 1232, 92, 8);
    ctx.fill();

    const fighters = snapshot.fighters;
    const boxW = 1180 / Math.max(2, fighters.length);
    fighters.forEach((fighter, index) => {
      const x = 44 + index * boxW;
      const color = PLAYER_COLORS[fighter.colorIndex % PLAYER_COLORS.length];
      ctx.fillStyle = color;
      roundRect(ctx, x, panelY + 16, 12, 42, 5);
      ctx.fill();
      ctx.fillStyle = "#f4f7fb";
      ctx.font = "800 16px Segoe UI, sans-serif";
      ctx.fillText(`P${fighter.slot} ${fighter.name}`, x + 20, textTop);
      ctx.font = "700 18px Segoe UI, sans-serif";
      const stat = snapshot.rules.mode === "practice"
        ? `${fighter.damage}%`
        : snapshot.rules.mode === "hp"
        ? `${fighter.hp} HP`
        : `${fighter.damage}% / ${snapshot.rules.mode === "stock" ? `${fighter.stocks} ST` : `${fighter.kills - fighter.falls} SCORE`}`;
      ctx.fillText(stat, x + 20, textBottom);

      if (fighter.characterId === "nova") {
        const ratio = this.clamp(fighter.novaCharge || 0, 0, NOVA_CHARGE.maxDuration) / NOVA_CHARGE.maxDuration;
        const gaugeX = x + 20;
        const gaugeY = panelY + 6;
        const gaugeW = Math.max(74, boxW - 42);
        ctx.fillStyle = "rgba(5,8,12,0.76)";
        roundRect(ctx, gaugeX, gaugeY, gaugeW, 7, 3);
        ctx.fill();
        if (ratio > 0) {
          ctx.fillStyle = ratio >= 1 ? "#ffffff" : "#44e8ce";
          roundRect(ctx, gaugeX, gaugeY, gaugeW * ratio, 7, 3);
          ctx.fill();
        }
      }

      if (snapshot.rules.finalSmash) {
        const gauge = this.clamp(fighter.finalGauge || 0, 0, FINAL_SMASH.maxGauge);
        const ratio = gauge / FINAL_SMASH.maxGauge;
        const gaugeX = x + 20;
        const gaugeY = panelY + 67;
        const gaugeW = Math.max(74, boxW - 42);
        const gaugeH = 13;
        ctx.fillStyle = "rgba(5,8,12,0.82)";
        roundRect(ctx, gaugeX, gaugeY, gaugeW, gaugeH, 5);
        ctx.fill();
        if (ratio > 0) {
          ctx.fillStyle = ratio >= 1 ? "#fff2a8" : "#f5b642";
          roundRect(ctx, gaugeX, gaugeY, gaugeW * ratio, gaugeH, 5);
          ctx.fill();
        }
        ctx.strokeStyle = snapshot.finalSmash?.fighterId === fighter.id ? "#ffffff" : "rgba(255,255,255,0.38)";
        ctx.lineWidth = snapshot.finalSmash?.fighterId === fighter.id ? 3 : 1;
        roundRect(ctx, gaugeX, gaugeY, gaugeW, gaugeH, 5);
        ctx.stroke();
        ctx.fillStyle = ratio >= 0.58 ? "#17130a" : "#ffffff";
        ctx.font = "800 10px Segoe UI, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`FS ${Math.floor(gauge * 10) / 10}%`, gaugeX + gaugeW / 2, gaugeY + 10);
        ctx.textAlign = "left";
      }
    });

    const timer = snapshot.rules.mode === "time" ? formatTime(Math.ceil(snapshot.remainingTime)) : formatTime(Math.floor(snapshot.elapsed));
    const timerX = 1130;
    const timerY = 20;
    const timerW = 126;
    const timerH = 46;
    ctx.fillStyle = "rgba(0,0,0,0.58)";
    roundRect(ctx, timerX, timerY, timerW, timerH, 7);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 26px Segoe UI, sans-serif";
    ctx.fillText(timer, timerX + timerW / 2, timerY + 32);
    ctx.textAlign = "left";

    if (snapshot.countdown > 0) {
      const value = snapshot.countdown > 1 ? Math.ceil(snapshot.countdown - 0.2) : "GO";
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, 1280, 720);
      ctx.textAlign = "center";
      ctx.fillStyle = "#f5b642";
      ctx.font = "900 118px Segoe UI, sans-serif";
      ctx.fillText(value, 640, 365);
      ctx.textAlign = "left";
    }
  }
}
