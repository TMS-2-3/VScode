import { PLAYER_COLORS } from "./constants.js";
import { FIGHTER_POSE_FRAMES } from "./asset-manager.js";
import { FINAL_SMASH, NOVA_CHARGE, NOVA_DOWN_SMASH_EXPLOSION, SHIELD, SMASH_CHARGE, getKnockdownBodyPose, getMainPlatformTriangle, getMove, getNovaBackAirFlame, getNovaBackAirMotion, getNovaBackAirPoseProgress, getNovaDownAirFlame, getNovaDownSmashMotion, getNovaDownSmashPoseProgress, getNovaDownTiltMotion, getNovaForwardAirMotion, getNovaSideSmashMotion, getNovaUpAirJet, getNovaUpAirMotion, getNovaUpAirPoseProgress, getNovaUpSmashMotion, getNovaUpSmashPoseProgress, getNovaUpTiltMotion } from "./battle-data.js";
import { formatTime, roundRect } from "./utils.js";

const SCREEN_CENTER_X = 640;
const SCREEN_CENTER_Y = 330;
const CAMERA_MIN_SCALE = 0.5;
const CAMERA_MAX_SCALE = 0.88;
const RUN_ANIMATION_FRAME_MS = 90;

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
    this.lastAnimationTimeMs = 0;
  }

  attach(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext("2d") : null;
  }

  draw(snapshot, extrapolationSeconds = 0) {
    if (!this.ctx || !snapshot) return;
    const ctx = this.ctx;
    const animationTimeMs = this.getAnimationTimeMs(snapshot, extrapolationSeconds);
    const animationClockReset = snapshot.id !== this.presentationMatchId || animationTimeMs < this.lastAnimationTimeMs;
    if (animationClockReset) {
      this.effects.length = 0;
      this.seenEventIds.clear();
    }
    this.lastAnimationTimeMs = animationTimeMs;
    const fighters = this.presentFighters(snapshot, extrapolationSeconds);

    this.updateCamera(fighters);
    this.assets.drawBackground(ctx, snapshot.rules.stage);
    const stageLayer = this.assets.getStageLayer(snapshot.stage, snapshot.rules.stage);
    this.collectEffects(snapshot, animationTimeMs);
    ctx.save();
    this.applyCamera(ctx);
    ctx.drawImage(stageLayer.canvas, stageLayer.x, stageLayer.y);
    if (snapshot.rules.debug) this.drawStageDebug(ctx, snapshot.stage);

    this.drawProjectiles(ctx, snapshot.projectiles || []);
    for (const fighter of fighters) this.drawFighter(ctx, fighter, snapshot.rules, animationTimeMs);
    if (snapshot.rules.debug && snapshot.finalSmash?.hitbox) {
      this.drawFinalSmashDebugHitbox(ctx, snapshot.finalSmash.hitbox);
    }
    this.drawWorldEffects(ctx, animationTimeMs);
    ctx.restore();
    this.drawScreenEffects(ctx, animationTimeMs);
    this.drawOffscreenMarkers(fighters);
    this.drawHud(ctx, snapshot);
  }

  getAnimationTimeMs(snapshot, extrapolationSeconds = 0) {
    const elapsed = Math.max(0, Number(snapshot?.elapsed) || 0);
    const extrapolation = this.clamp(Number(extrapolationSeconds) || 0, 0, 0.05);
    const gameSpeed = Math.max(0, Number(snapshot?.rules?.gameSpeed) || 1);
    return (elapsed + extrapolation * gameSpeed) * 1000;
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

  collectEffects(snapshot, animationTimeMs) {
    const now = animationTimeMs;
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

  drawFighter(ctx, fighter, rules, animationTimeMs) {
    if (!fighter.alive) {
      if (fighter.respawn > 0) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "700 18px Segoe UI, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${this.fighterLabel(fighter)} 復帰中`, 640, 105 + fighter.slot * 24);
        ctx.textAlign = "left";
      }
      return;
    }

    if (fighter.respawnPlatform > 0) this.drawRespawnPlatform(ctx, fighter);

    const visual = this.fighterVisualState(fighter, animationTimeMs);
    ctx.save();
    ctx.translate(fighter.x, fighter.y);
    if (fighter.crouching) ctx.translate(0, fighter.h * 0.15);
    ctx.scale(fighter.facing, fighter.crouching ? 0.7 : 1);
    ctx.translate(visual.offsetX || 0, visual.offsetY);
    ctx.rotate(visual.rotation);

    if (fighter.invuln > 0 && Math.floor(fighter.invuln * 12) % 2 === 0) ctx.globalAlpha = 0.55;
    if (fighter.dodge) {
      ctx.strokeStyle = "rgba(255,255,255,0.72)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(0, 2, fighter.dodge === "airDodge" ? 44 : 38, 30, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    this.drawNovaMoveEffect(ctx, fighter, animationTimeMs);
    if (fighter.smashCharge) this.drawSmashCharge(ctx, fighter, animationTimeMs);
    const sprite = this.assets.getFighterSprite(
      fighter.characterId || "nova",
      fighter.colorIndex,
      visual.pose,
      visual.frame
    );
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
        const pulse = 8 + Math.sin(animationTimeMs * 0.04) * 4;
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 2, radius + pulse, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();

    if (fighter.ledge && fighter.action !== "ledgeAttack") this.drawLedgeGrip(ctx, fighter);
    if (fighter.grabbedBy) this.drawGrabbedStatus(ctx, fighter);

    const label = this.fighterLabel(fighter);
    ctx.font = "700 13px Segoe UI, sans-serif";
    const labelWidth = Math.min(180, Math.max(54, ctx.measureText(label).width + 18));
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    roundRect(ctx, fighter.x - labelWidth / 2, fighter.y - fighter.h / 2 - 28, labelWidth, 20, 8);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(label, fighter.x, fighter.y - fighter.h / 2 - 13, labelWidth - 12);
    ctx.textAlign = "left";

    if (rules.debug) this.drawDebugFighter(ctx, fighter);
  }

  fighterLabel(fighter) {
    const name = String(fighter?.name || "").trim();
    return name || `P${fighter?.slot || "?"}`;
  }

  fighterVisualState(fighter, now = 0) {
    if (!fighter.shield && (fighter.hitstun || 0) > 0) {
      if ((fighter.hitlag || 0) > 0) {
        const impactDirection = Math.sign(fighter.vx || fighter.facing || 1);
        return {
          pose: "hurt",
          frame: 0,
          offsetY: -1,
          rotation: -impactDirection * (fighter.facing || 1) * 0.18
        };
      }
      const speed = Math.hypot(fighter.vx || 0, fighter.vy || 0);
      const flightAngle = speed > 20
        ? this.normalizeAngle(Math.atan2(fighter.vy || 0, fighter.vx || 0) + Math.PI / 2)
        : 0;
      const tumbleRock = fighter.tumbling ? Math.sin(Math.max(0, now) / 110) * 0.12 : 0;
      return {
        pose: "launched",
        frame: 0,
        offsetY: 0,
        rotation: (flightAngle + tumbleRock) * (fighter.facing || 1)
      };
    }
    if (["jab1", "jab2", "jab3"].includes(fighter.action)) {
      const total = getMove(fighter.characterId || "nova", fighter.action)?.total || 1;
      const progress = this.clamp((fighter.actionTime || 0) / total, 0, 1);
      const punch = Math.sin(progress * Math.PI);
      const frameCount = FIGHTER_POSE_FRAMES[fighter.action];
      return {
        pose: fighter.action,
        frame: Math.min(frameCount - 1, Math.floor(progress * frameCount)),
        offsetX: fighter.action === "jab3" ? punch * 7 : 0,
        offsetY: fighter.action === "jab3" ? punch * 1.5 : 0,
        rotation: fighter.action === "jab1"
          ? punch * 0.025
          : fighter.action === "jab2"
            ? punch * -0.035
            : punch * 0.09
      };
    }
    if (fighter.action === "smashCharge" && fighter.smashCharge?.moveId === "smashSide") {
      const motion = getNovaSideSmashMotion(0, true);
      return {
        pose: "smashCharge",
        frame: 0,
        offsetX: motion.offsetX,
        offsetY: motion.offsetY,
        rotation: motion.rotation
      };
    }
    if (fighter.action === "smashSide") {
      const move = fighter.move || getMove(fighter.characterId || "nova", "smashSide");
      const progress = this.clamp((fighter.actionTime || 0) / Math.max(1 / 60, move?.total || 1), 0, 1);
      const motion = getNovaSideSmashMotion(progress);
      const frameCount = FIGHTER_POSE_FRAMES.smashSide;
      return {
        pose: "smashSide",
        frame: Math.min(frameCount - 1, Math.floor(progress * frameCount)),
        offsetX: motion.offsetX,
        offsetY: motion.offsetY,
        rotation: motion.rotation
      };
    }
    if (fighter.action === "smashCharge" && fighter.smashCharge?.moveId === "smashUp") {
      const motion = getNovaUpSmashMotion(0, true);
      return {
        pose: "smashUpCharge",
        frame: 0,
        offsetX: motion.offsetX,
        offsetY: motion.offsetY,
        rotation: motion.rotation
      };
    }
    if (fighter.action === "smashUp") {
      const progress = getNovaUpSmashPoseProgress(fighter);
      const motion = getNovaUpSmashMotion(progress);
      const frameCount = FIGHTER_POSE_FRAMES.smashUp;
      return {
        pose: "smashUp",
        frame: Math.min(frameCount - 1, Math.floor(progress * frameCount)),
        offsetX: motion.offsetX,
        offsetY: motion.offsetY,
        rotation: motion.rotation
      };
    }
    if (fighter.action === "smashCharge" && fighter.smashCharge?.moveId === "smashDown") {
      const motion = getNovaDownSmashMotion(0, true);
      return {
        pose: "smashDownCharge",
        frame: 0,
        offsetX: motion.offsetX,
        offsetY: motion.offsetY,
        rotation: motion.rotation
      };
    }
    if (fighter.action === "smashDown") {
      const progress = getNovaDownSmashPoseProgress(fighter);
      const motion = getNovaDownSmashMotion(progress);
      const frameCount = FIGHTER_POSE_FRAMES.smashDown;
      return {
        pose: "smashDown",
        frame: Math.min(frameCount - 1, Math.floor(progress * frameCount)),
        offsetX: motion.offsetX,
        offsetY: motion.offsetY,
        rotation: motion.rotation
      };
    }
    if (fighter.action === "downed") {
      const bodyPose = getKnockdownBodyPose(fighter);
      const frameCount = FIGHTER_POSE_FRAMES.downed;
      const progress = this.clamp((fighter.actionTime || 0) / 0.18, 0, 1);
      return {
        pose: "downed",
        frame: Math.min(frameCount - 1, Math.floor(progress * frameCount)),
        offsetX: 0,
        offsetY: 0,
        rotation: bodyPose.rotation
      };
    }
    if (fighter.action === "getup") {
      const bodyPose = getKnockdownBodyPose(fighter);
      return {
        pose: "idle",
        frame: 0,
        offsetX: 0,
        offsetY: 0,
        rotation: bodyPose.rotation
      };
    }
    if (fighter.action === "getupAttack") {
      const total = getMove(fighter.characterId || "nova", "getupAttack")?.total || 1;
      const progress = this.clamp((fighter.actionTime || 0) / total, 0, 1);
      const bodyPose = getKnockdownBodyPose(fighter);
      const frameCount = FIGHTER_POSE_FRAMES.getupAttack;
      return {
        pose: "getupAttack",
        frame: Math.min(frameCount - 1, Math.floor(progress * frameCount)),
        offsetX: 0,
        offsetY: 0,
        rotation: bodyPose.rotation
      };
    }
    if (fighter.action === "dashAttack") {
      const move = getMove(fighter.characterId || "nova", "dashAttack");
      const time = fighter.actionTime || 0;
      const hit = move?.hits?.[0] || {};
      const launchStart = move?.motion?.start || 0;
      const activeStart = hit.start || launchStart;
      const activeEnd = activeStart + (hit.duration || 0);
      const motionEnd = launchStart + (move?.motion?.duration || 0);
      const total = move?.total || 1;
      const startupLean = this.clamp(time / Math.max(activeStart, 1 / 60), 0, 1);
      const recoveryLean = time <= motionEnd
        ? 1
        : 1 - this.clamp((time - motionEnd) / Math.max(1 / 60, total - motionEnd), 0, 1);
      const lean = startupLean * recoveryLean;
      let frame = 0;
      if (time >= launchStart && time < activeStart) frame = 1;
      else if (time >= activeStart && time < activeEnd) frame = 2;
      else if (time >= activeEnd && time < motionEnd) {
        const rushProgress = this.clamp((time - activeEnd) / Math.max(1 / 60, motionEnd - activeEnd), 0, 1);
        frame = 3 + Math.min(1, Math.floor(rushProgress * 2));
      } else if (time >= motionEnd) {
        const recoveryProgress = this.clamp((time - motionEnd) / Math.max(1 / 60, total - motionEnd), 0, 1);
        frame = 5 + Math.min(1, Math.floor(recoveryProgress * 2));
      }
      return {
        pose: "dashAttack",
        frame,
        offsetX: lean * 5,
        offsetY: lean * 2,
        rotation: lean * 0.3
      };
    }
    if (fighter.action === "airNeutral") {
      const total = getMove(fighter.characterId || "nova", "airNeutral")?.total || 1;
      const progress = this.clamp((fighter.actionTime || 0) / total, 0, 1);
      const burst = progress < 0.32
        ? Math.sin(progress / 0.32 * Math.PI / 2)
        : Math.max(0, 1 - (progress - 0.32) / 0.68);
      const frameCount = FIGHTER_POSE_FRAMES.airNeutral;
      return {
        pose: "airNeutral",
        frame: Math.min(frameCount - 1, Math.floor(progress * frameCount)),
        offsetX: 0,
        offsetY: -burst * 2,
        rotation: Math.sin(progress * Math.PI * 2) * burst * 0.08
      };
    }
    if (fighter.action === "airForward") {
      const total = getMove(fighter.characterId || "nova", "airForward")?.total || 1;
      const progress = this.clamp((fighter.actionTime || 0) / total, 0, 1);
      const motion = getNovaForwardAirMotion(progress);
      const frameCount = FIGHTER_POSE_FRAMES.airForward;
      return {
        pose: "airForward",
        frame: Math.min(frameCount - 1, Math.floor(progress * frameCount)),
        offsetX: motion.force * 2,
        offsetY: -motion.force,
        rotation: -motion.force * 0.06
      };
    }
    if (fighter.action === "airBack") {
      const poseProgress = getNovaBackAirPoseProgress(
        fighter.actionTime || 0,
        Boolean(fighter.moveContact)
      );
      const motion = getNovaBackAirMotion(poseProgress);
      const frameCount = FIGHTER_POSE_FRAMES.airBack;
      return {
        pose: "airBack",
        frame: Math.min(frameCount - 1, Math.floor(poseProgress * frameCount)),
        offsetX: motion.offsetX,
        offsetY: motion.offsetY,
        rotation: motion.bodyLean
      };
    }
    if (fighter.action === "airUp") {
      const poseProgress = getNovaUpAirPoseProgress(fighter.actionTime || 0);
      const motion = getNovaUpAirMotion(poseProgress);
      const frameCount = FIGHTER_POSE_FRAMES.airUp;
      return {
        pose: "airUp",
        frame: Math.min(frameCount - 1, Math.floor(poseProgress * frameCount)),
        offsetX: 0,
        offsetY: motion.offsetY,
        rotation: 0
      };
    }
    if (fighter.action === "airDown") {
      return { pose: "idle", frame: 0, offsetX: 0, offsetY: 0, rotation: 0 };
    }
    if (fighter.action === "side") {
      const total = getMove(fighter.characterId || "nova", "side")?.total || 1;
      const progress = this.clamp((fighter.actionTime || 0) / total, 0, 1);
      const frameCount = FIGHTER_POSE_FRAMES.side;
      return {
        pose: "side",
        frame: Math.min(frameCount - 1, Math.floor(progress * frameCount)),
        offsetX: Math.sin(progress * Math.PI) * 2,
        offsetY: 0,
        rotation: Math.sin(progress * Math.PI) * 0.035
      };
    }
    if (fighter.action === "up") {
      const total = getMove(fighter.characterId || "nova", "up")?.total || 1;
      const progress = this.clamp((fighter.actionTime || 0) / total, 0, 1);
      const motion = getNovaUpTiltMotion(progress);
      const frameCount = FIGHTER_POSE_FRAMES.up;
      return {
        pose: "up",
        frame: Math.min(frameCount - 1, Math.floor(progress * frameCount)),
        offsetX: 0,
        offsetY: -Math.max(motion.rightHandForce, motion.leftHandForce) * 2,
        rotation: (motion.rightHandForce - motion.leftHandForce) * 0.045
      };
    }
    if (fighter.action === "down") {
      const total = getMove(fighter.characterId || "nova", "down")?.total || 1;
      const progress = this.clamp((fighter.actionTime || 0) / total, 0, 1);
      const frameCount = FIGHTER_POSE_FRAMES.down;
      return {
        pose: "down",
        frame: Math.min(frameCount - 1, Math.floor(progress * frameCount)),
        offsetX: 0,
        offsetY: 0,
        rotation: 0
      };
    }
    if (fighter.action) return { pose: "attack", frame: 0, offsetY: 0, rotation: 0 };
    if ((fighter.respawnPlatform || 0) > 0) return { pose: "idle", frame: 0, offsetY: 0, rotation: 0 };
    if (!fighter.onGround) {
      return {
        pose: fighter.vy < 0 ? "jumpRise" : "jumpFall",
        frame: 0,
        offsetY: fighter.vy < 0 ? -2 : 1,
        rotation: fighter.vy < 0 ? -0.04 : 0.03
      };
    }
    if (!fighter.crouching && !fighter.shield && Math.abs(fighter.vx) > 24) {
      const frame = Math.floor(Math.max(0, now) / RUN_ANIMATION_FRAME_MS) % 4;
      const cycle = Math.sin(frame / 4 * Math.PI * 2);
      if (fighter.runTurn) {
        const turnProgress = this.clamp(
          (fighter.runTurn.elapsed || 0) / Math.max(1 / 60, fighter.runTurn.duration || 0),
          0,
          1
        );
        return {
          pose: "run",
          frame,
          offsetY: 2,
          rotation: (1 - turnProgress) * -0.13
        };
      }
      return {
        pose: "run",
        frame,
        offsetY: Math.abs(cycle) * 2,
        rotation: cycle * 0.035
      };
    }
    return { pose: "idle", frame: 0, offsetY: 0, rotation: 0 };
  }

  normalizeAngle(angle) {
    let normalized = angle;
    while (normalized > Math.PI) normalized -= Math.PI * 2;
    while (normalized < -Math.PI) normalized += Math.PI * 2;
    return normalized;
  }

  drawNovaMoveEffect(ctx, fighter, animationTimeMs) {
    const action = fighter.action || "";
    const time = fighter.actionTime || 0;
    if (!action || fighter.characterId !== "nova") return;
    ctx.save();
    ctx.lineCap = "round";

    if (["jab1", "jab2", "jab3", "ledgeAttack"].includes(action)) {
      const reach = action === "jab3" ? 68 : action === "ledgeAttack" ? 82 : 54;
      const jabProgress = action.startsWith("jab")
        ? this.clamp(time / (getMove("nova", action)?.total || 1), 0, 1)
        : 0.5;
      const jabIntensity = action.startsWith("jab") ? Math.sin(jabProgress * Math.PI) : 1;
      const previousAlpha = ctx.globalAlpha;
      ctx.strokeStyle = action.startsWith("smash") ? "rgba(255,216,77,0.88)" : "rgba(115,239,255,0.72)";
      ctx.globalAlpha = previousAlpha * (0.25 + jabIntensity * 0.75);
      ctx.lineWidth = action.startsWith("smash") ? 13 : action === "jab3" ? 11 : 8;
      ctx.beginPath();
      ctx.moveTo(action === "jab2" ? -15 : 18, action === "jab2" ? -25 : -28);
      ctx.quadraticCurveTo(reach * 0.55, action === "jab2" ? -12 : -55 - Math.sin(time * 24) * 8, reach, -30);
      ctx.stroke();
      ctx.globalAlpha = previousAlpha;
    }
    if (action === "airNeutral") {
      const move = getMove("nova", "airNeutral");
      const hit = move?.hits?.[0] || {};
      const start = hit.start || 0;
      const effectDuration = (hit.duration || 0) + 0.08;
      if (time >= start && time <= start + effectDuration) {
        const previousAlpha = ctx.globalAlpha;
        const progress = this.clamp((time - start) / Math.max(1 / 60, effectDuration), 0, 1);
        const fade = Math.sin(progress * Math.PI);
        const radius = Number(hit.radius) || 46;
        const travel = 16 + (radius - 16) * (1 - (1 - progress) ** 2);
        ctx.globalAlpha = previousAlpha * fade;
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = "rgba(139,244,255,0.94)";
        ctx.beginPath();
        for (let index = 0; index < 12; index += 1) {
          const angle = index / 12 * Math.PI * 2 + progress * 0.16;
          const stagger = (index % 3) * 2.2;
          const innerRadius = Math.max(8, travel - 10 - stagger);
          const outerRadius = Math.min(radius, travel + 2 + stagger);
          ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
          ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
        }
        ctx.stroke();
        ctx.globalAlpha = previousAlpha;
      }
    }
    if (action === "down") {
      const move = getMove("nova", "down");
      const progress = this.clamp(time / Math.max(1 / 60, move?.total || 1), 0, 1);
      const motion = getNovaDownTiltMotion(progress);
      const previousAlpha = ctx.globalAlpha;
      const flicker = 0.92 + Math.sin(time * 86) * 0.08;

      if (motion.flame > 0) {
        ctx.globalAlpha = previousAlpha * motion.flame;
        const floorFlame = ctx.createRadialGradient(0, 34, 4, 0, 34, 78);
        floorFlame.addColorStop(0, "rgba(255,247,190,0.96)");
        floorFlame.addColorStop(0.28, "rgba(255,152,48,0.88)");
        floorFlame.addColorStop(0.7, "rgba(255,76,28,0.62)");
        floorFlame.addColorStop(1, "rgba(255,52,24,0)");
        ctx.fillStyle = floorFlame;
        ctx.beginPath();
        ctx.ellipse(0, 34, 76 * flicker, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        for (const [index, footX] of [-11, 10].entries()) {
          const sway = Math.sin(time * 94 + index * 1.7) * 4;
          const length = (31 + index * 3) * flicker;
          const jet = ctx.createLinearGradient(footX, 24, footX + sway, 24 + length);
          jet.addColorStop(0, "rgba(236,253,255,0.98)");
          jet.addColorStop(0.25, "rgba(92,226,255,0.95)");
          jet.addColorStop(0.58, "rgba(255,175,55,0.9)");
          jet.addColorStop(1, "rgba(255,63,26,0)");
          ctx.fillStyle = jet;
          ctx.beginPath();
          ctx.moveTo(footX - 6, 24);
          ctx.quadraticCurveTo(footX - 8 + sway * 0.3, 38, footX + sway, 24 + length);
          ctx.quadraticCurveTo(footX + 8 + sway * 0.3, 38, footX + 6, 24);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.globalAlpha = previousAlpha;
    }
    if (action === "getupAttack") {
      const move = getMove("nova", "getupAttack");
      const hit = move?.hits?.[0] || {};
      const activeEnd = (hit.start || 0) + (hit.duration || 0);
      if (time >= (hit.start || 0) && time <= activeEnd) {
        const previousAlpha = ctx.globalAlpha;
        const activeProgress = this.clamp((time - (hit.start || 0)) / Math.max(1 / 60, hit.duration || 0), 0, 1);
        ctx.globalAlpha = previousAlpha * Math.sin(activeProgress * Math.PI);
        ctx.strokeStyle = "rgba(127,239,255,0.82)";
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(-18, -12);
        ctx.lineTo(-76, -12);
        ctx.moveTo(18, -12);
        ctx.lineTo(76, -12);
        ctx.stroke();
        ctx.globalAlpha = previousAlpha;
      }
    }
    if (action === "airBack") {
      const flame = getNovaBackAirFlame(time, Boolean(fighter.moveContact));
      if (flame) {
        const previousAlpha = ctx.globalAlpha;
        const flicker = 0.94 + Math.sin(time * 137) * 0.06;
        const halfThickness = flame.thickness * flicker / 2;
        ctx.save();
        ctx.translate(flame.originX, flame.originY);
        ctx.globalAlpha = previousAlpha * (flame.large ? 1 : 0.9);

        const plume = ctx.createLinearGradient(2, 0, -flame.length, 0);
        plume.addColorStop(0, "rgba(231,252,255,0.98)");
        plume.addColorStop(0.2, "rgba(90,226,255,0.96)");
        plume.addColorStop(0.52, "rgba(255,184,62,0.92)");
        plume.addColorStop(1, "rgba(255,58,24,0)");
        ctx.fillStyle = plume;
        ctx.beginPath();
        ctx.moveTo(3, -halfThickness * 0.38);
        ctx.quadraticCurveTo(-flame.length * 0.48, -halfThickness, -flame.length, 0);
        ctx.quadraticCurveTo(-flame.length * 0.48, halfThickness, 3, halfThickness * 0.38);
        ctx.closePath();
        ctx.fill();

        const coreLength = flame.length * (flame.large ? 0.8 : 0.72);
        const core = ctx.createLinearGradient(0, 0, -coreLength, 0);
        core.addColorStop(0, "rgba(255,255,255,1)");
        core.addColorStop(0.42, "rgba(151,242,255,0.94)");
        core.addColorStop(1, "rgba(255,204,87,0)");
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.moveTo(2, -halfThickness * 0.2);
        ctx.quadraticCurveTo(-coreLength * 0.56, -halfThickness * 0.42, -coreLength, 0);
        ctx.quadraticCurveTo(-coreLength * 0.56, halfThickness * 0.42, 2, halfThickness * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = previousAlpha;
      }
    }
    if (action === "airDown") {
      const flame = getNovaDownAirFlame(time);
      if (flame) {
        const previousAlpha = ctx.globalAlpha;
        const flicker = 0.94 + Math.sin(time * 119) * 0.06;
        const halfWidth = flame.width * flicker / 2;
        const bottomY = flame.originY + flame.height;
        ctx.globalAlpha = previousAlpha * (0.88 + Math.sin(flame.progress * Math.PI) * 0.12);
        const plume = ctx.createLinearGradient(0, flame.originY, 0, bottomY);
        plume.addColorStop(0, "rgba(237,253,255,1)");
        plume.addColorStop(0.24, "rgba(91,228,255,0.96)");
        plume.addColorStop(0.62, "rgba(255,174,50,0.9)");
        plume.addColorStop(1, "rgba(255,59,25,0)");
        ctx.fillStyle = plume;
        ctx.beginPath();
        ctx.moveTo(-halfWidth * 0.58, flame.originY);
        ctx.quadraticCurveTo(-halfWidth, flame.originY + flame.height * 0.48, 0, bottomY);
        ctx.quadraticCurveTo(halfWidth, flame.originY + flame.height * 0.48, halfWidth * 0.58, flame.originY);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = previousAlpha;
      }
    }
    if (action === "smashDown") {
      const move = getMove("nova", "smashDown");
      const hit = move?.hits?.[0] || {};
      const start = hit.start || 0;
      const effectDuration = (hit.duration || 0) + 0.12;
      if (time >= start && time <= start + effectDuration) {
        const previousAlpha = ctx.globalAlpha;
        const progress = this.clamp((time - start) / Math.max(1 / 60, effectDuration), 0, 1);
        const attackProgress = this.clamp((time - start) / Math.max(1 / 60, hit.duration || 0), 0, 1);
        const spread = 0.58 + (1 - (1 - progress) ** 3) * 0.42;
        const fade = Math.sin(Math.min(1, progress * 1.15) * Math.PI / 2) * (1 - progress);
        const halfWidth = NOVA_DOWN_SMASH_EXPLOSION.width / 2;
        const halfHeight = NOVA_DOWN_SMASH_EXPLOSION.height / 2;
        const centerY = NOVA_DOWN_SMASH_EXPLOSION.centerY;

        ctx.globalAlpha = previousAlpha * Math.max(0, fade * 1.6);
        const blast = ctx.createRadialGradient(0, centerY, 3, 0, centerY, halfWidth);
        blast.addColorStop(0, "rgba(255,255,232,1)");
        blast.addColorStop(0.2, "rgba(255,225,92,0.98)");
        blast.addColorStop(0.55, "rgba(255,118,35,0.9)");
        blast.addColorStop(1, "rgba(255,52,24,0)");
        ctx.fillStyle = blast;
        ctx.beginPath();
        ctx.ellipse(0, centerY, halfWidth * spread, halfHeight * (0.72 + attackProgress * 0.28), 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = previousAlpha * Math.max(0, fade * 1.35);
        ctx.fillStyle = "rgba(255,218,76,0.9)";
        for (let index = -3; index <= 3; index += 1) {
          const normalized = index / 3;
          const x = normalized * halfWidth * spread * 0.82;
          const plumeHeight = (22 + (3 - Math.abs(index)) * 5) * (1 - progress * 0.45);
          const plumeWidth = 10 + (3 - Math.abs(index)) * 2;
          ctx.beginPath();
          ctx.moveTo(x - plumeWidth, centerY + 5);
          ctx.quadraticCurveTo(x - plumeWidth * 0.45, centerY - plumeHeight * 0.58, x, centerY - plumeHeight);
          ctx.quadraticCurveTo(x + plumeWidth * 0.45, centerY - plumeHeight * 0.58, x + plumeWidth, centerY + 5);
          ctx.closePath();
          ctx.fill();
        }

        ctx.globalAlpha = previousAlpha * Math.max(0, (1 - progress) * 0.9);
        ctx.strokeStyle = "rgba(255,244,175,0.96)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-halfWidth * spread, centerY + halfHeight * 0.42);
        ctx.lineTo(halfWidth * spread, centerY + halfHeight * 0.42);
        ctx.stroke();
        ctx.globalAlpha = previousAlpha;
      }
    }
    if (action === "throwDown") {
      const x = 0;
      const y = 18;
      const flame = ctx.createRadialGradient(x, y, 2, x, y, 42);
      flame.addColorStop(0, "rgba(255,246,170,0.95)");
      flame.addColorStop(0.45, "rgba(255,119,45,0.82)");
      flame.addColorStop(1, "rgba(255,65,30,0)");
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.ellipse(x, y, 58, 30, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (action === "dashAttack") {
      const move = getMove("nova", "dashAttack");
      const hit = move?.hits?.[0] || {};
      const motionStart = move?.motion?.start || 0;
      const motionEnd = motionStart + (move?.motion?.duration || 0);
      const previousAlpha = ctx.globalAlpha;
      if (time >= motionStart && time <= motionEnd) {
        const thrustProgress = this.clamp((time - motionStart) / Math.max(1 / 60, motionEnd - motionStart), 0, 1);
        ctx.globalAlpha = previousAlpha * Math.min(1, thrustProgress * 5, (1 - thrustProgress) * 8);
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
      const activeEnd = (hit.start || 0) + (hit.duration || 0);
      if (time >= (hit.start || 0) && time <= activeEnd) {
        ctx.globalAlpha = previousAlpha * 0.82;
        ctx.strokeStyle = "rgba(155,247,255,0.88)";
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(13, -12, 47, -1.15, 1.08);
        ctx.stroke();
      }
      ctx.globalAlpha = previousAlpha;
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
    if (action === "airUp") {
      const jet = getNovaUpAirJet(time);
      if (jet) {
        const previousAlpha = ctx.globalAlpha;
        const flicker = 0.9 + Math.sin(time * 151) * 0.1;
        ctx.globalAlpha = previousAlpha * (0.88 + Math.sin(jet.progress * Math.PI) * 0.12);
        for (const [index, x] of [jet.leftX, jet.rightX].entries()) {
          const sway = Math.sin(time * 123 + index * 1.8) * 2;
          const length = jet.length * flicker;
          const flame = ctx.createLinearGradient(x, jet.originY, x + sway, jet.originY + length);
          flame.addColorStop(0, "rgba(239,254,255,1)");
          flame.addColorStop(0.28, "rgba(91,228,255,0.96)");
          flame.addColorStop(0.64, "rgba(255,177,53,0.88)");
          flame.addColorStop(1, "rgba(255,62,26,0)");
          ctx.fillStyle = flame;
          ctx.beginPath();
          ctx.moveTo(x - jet.width / 2, jet.originY);
          ctx.quadraticCurveTo(x - jet.width * 0.45 + sway, jet.originY + length * 0.58, x + sway, jet.originY + length);
          ctx.quadraticCurveTo(x + jet.width * 0.45 + sway, jet.originY + length * 0.58, x + jet.width / 2, jet.originY);
          ctx.closePath();
          ctx.fill();
        }
        ctx.globalAlpha = previousAlpha;
      }
    }
    if (action === "specialUp" || action === "specialFall") {
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
      ctx.arc(0, -4, 38 + Math.sin(animationTimeMs * 0.016) * 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.05, ratio));
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

  drawSmashCharge(ctx, fighter, animationTimeMs) {
    const ratio = this.clamp(
      fighter.smashCharge.ratio ?? fighter.smashCharge.elapsed / SMASH_CHARGE.maxDuration,
      0,
      1
    );
    const pulse = 1 + Math.sin(animationTimeMs * 0.012) * 0.06;
    const radius = 42 * pulse;
    const playerColor = PLAYER_COLORS[(fighter.colorIndex || 0) % PLAYER_COLORS.length];
    const inheritedAlpha = ctx.globalAlpha;

    ctx.save();
    ctx.scale(fighter.facing, 1);
    const streakCount = 14;
    const inwardPhase = (Math.max(0, animationTimeMs) % 700) / 700;
    ctx.lineCap = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffd84d";
    ctx.shadowColor = "rgba(255,216,77,0.9)";
    ctx.shadowBlur = 5;
    for (let index = 0; index < streakCount; index += 1) {
      const phase = (inwardPhase + index / streakCount) % 1;
      const angle = index / streakCount * Math.PI * 2 + (index % 2 ? 0.12 : -0.08);
      const innerDistance = 84 - phase * 43;
      const outerDistance = innerDistance + 6 + ratio * 2;
      const visibility = Math.sin(phase * Math.PI);
      ctx.globalAlpha = inheritedAlpha * (0.5 + visibility * 0.5) * (0.78 + ratio * 0.18);
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * outerDistance, Math.sin(angle) * outerDistance);
      ctx.lineTo(Math.cos(angle) * innerDistance, Math.sin(angle) * innerDistance);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = inheritedAlpha * 0.9;
    ctx.strokeStyle = ratio >= 1 ? "#fff2a6" : playerColor;
    ctx.lineWidth = ratio >= 1 ? 7 : 5;
    ctx.beginPath();
    ctx.arc(0, 1, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.04, ratio));
    ctx.stroke();

    ctx.globalAlpha = inheritedAlpha * 0.9 * (0.45 + ratio * 0.35);
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
    const fallbackHurtbox = fighter.hurtbox || {
      x: fighter.x - fighter.w / 2,
      y: fighter.y - fighter.h / 2,
      w: fighter.w,
      h: fighter.h
    };
    for (const hurtbox of fighter.hurtboxes || [fallbackHurtbox]) {
      ctx.strokeRect(hurtbox.x, hurtbox.y, hurtbox.w, hurtbox.h);
    }
    if (fighter.hitbox) {
      ctx.strokeStyle = "rgba(255,95,95,0.95)";
      for (const hitbox of fighter.hitboxes || [fighter.hitbox]) {
        if (hitbox.shape === "circle") {
          ctx.beginPath();
          ctx.arc(hitbox.cx, hitbox.cy, hitbox.radius, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.strokeRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
        }
      }
    }
    ctx.strokeStyle = "rgba(245,182,66,0.9)";
    ctx.beginPath();
    ctx.moveTo(fighter.x, fighter.y);
    ctx.lineTo(fighter.x + fighter.vx * 0.12, fighter.y + fighter.vy * 0.12);
    ctx.stroke();
  }

  drawFinalSmashDebugHitbox(ctx, hitbox) {
    ctx.save();
    ctx.fillStyle = "rgba(255,95,95,0.16)";
    ctx.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
    ctx.strokeStyle = "rgba(255,95,95,0.98)";
    ctx.lineWidth = 3;
    ctx.strokeRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
    ctx.restore();
  }

  drawWorldEffects(ctx, animationTimeMs) {
    const now = animationTimeMs;
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

  drawScreenEffects(ctx, animationTimeMs) {
    const now = animationTimeMs;
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

    const timer = snapshot.rules.mode === "practice"
      ? formatTime(Math.floor(snapshot.elapsed))
      : snapshot.remainingTime === null
      ? "∞"
      : formatTime(Math.ceil(snapshot.remainingTime));
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
