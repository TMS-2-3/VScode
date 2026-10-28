import { CHARACTER_ASSETS, PLAYER_COLORS, PLAYER_LIMITS, STAGES } from "./constants.js";
import { NOVA_CHARGE, NOVA_FINAL_SMASH, NOVA_RECOVERY, getMainPlatformTriangle, getMove, getNovaBackAirMotion, getNovaChargeMotion, getNovaDownSmashMotion, getNovaDownTiltMotion, getNovaFinalSmashMotion, getNovaForwardAirMotion, getNovaGrabMotion, getNovaNeutralSpecialMotion, getNovaRecoveryMotion, getScaledStageDefinition, getNovaSideSmashMotion, getNovaSideSpecialMotion, getNovaSideTiltMotion, getNovaThrowMotion, getNovaUpAirMotion, getNovaUpSmashMotion, getNovaUpTiltMotion } from "./battle-data.js";
import { createRenderCanvas, roundRect } from "./utils.js";

export const FIGHTER_POSE_FRAMES = Object.freeze({
  idle: 1,
  attack: 1,
  jab1: 5,
  jab2: 5,
  jab3: 6,
  smashCharge: 1,
  smashSide: 12,
  smashUpCharge: 1,
  smashUp: 14,
  smashDownCharge: 1,
  smashDown: 12,
  grab: 8,
  dashGrab: 10,
  pivotGrab: 10,
  grabHold: 1,
  pummel: 7,
  throwForward: 10,
  throwBack: 13,
  throwUp: 10,
  throwDown: 13,
  specialNeutral: 10,
  specialSide: 14,
  specialUp: 10,
  specialFall: 1,
  novaCharge: 12,
  finalSmash: 16,
  dashAttack: 7,
  airNeutral: 8,
  airForward: 9,
  airBack: 12,
  airUp: 14,
  side: 8,
  up: 14,
  down: 8,
  getupAttack: 8,
  downed: 4,
  run: 4,
  jumpRise: 1,
  jumpFall: 1,
  hurt: 1,
  launched: 1
});

export class AssetManager {
  constructor() {
    this.stageLayers = new Map();
    this.fighterSprites = new Map();
    this.manifests = new Set();
    this.lastManifestKey = "";
  }

  preload(manifest) {
    const normalized = this.normalizeManifest(manifest);
    const stage = getScaledStageDefinition(normalized.stage, normalized.playerCount);
    const key = `${normalized.stage}:${stage.scale}|${normalized.characters.join(",")}|${normalized.colorIndices.join(",")}`;
    if (this.manifests.has(key)) {
      this.lastManifestKey = key;
      return;
    }

    this.getStageLayer(stage, normalized.stage);
    for (const characterId of normalized.characters) {
      for (const colorIndex of normalized.colorIndices) {
        for (const [pose, frameCount] of Object.entries(FIGHTER_POSE_FRAMES)) {
          for (let frame = 0; frame < frameCount; frame += 1) {
            this.getFighterSprite(characterId, colorIndex, pose, frame);
          }
        }
      }
    }

    this.manifests.add(key);
    this.lastManifestKey = key;
  }

  normalizeManifest(manifest) {
    const source = manifest && typeof manifest === "object" ? manifest : {};
    const stage = STAGES[source.stage] ? source.stage : "battlefield";
    const characters = Array.isArray(source.characters) && source.characters.length
      ? source.characters
      : ["nova"];
    const requestedColors = Array.isArray(source.colorIndices) && source.colorIndices.length
      ? source.colorIndices
      : [0];
    const playerCount = Math.max(
      PLAYER_LIMITS.min,
      Math.min(PLAYER_LIMITS.max, Math.round(Number(source.playerCount) || PLAYER_LIMITS.min))
    );
    const colorIndices = Array.from(new Set(requestedColors.map(Number)))
      .filter(index => Number.isInteger(index) && index >= 0 && index < PLAYER_COLORS.length)
      .sort((a, b) => a - b);
    return {
      stage,
      playerCount,
      characters: Array.from(new Set(characters.map(id => CHARACTER_ASSETS[id] ? id : "nova"))).sort(),
      colorIndices: colorIndices.length ? colorIndices : [0]
    };
  }

  manifestFromSnapshot(snapshot) {
    return {
      stage: snapshot && snapshot.rules ? snapshot.rules.stage : "battlefield",
      playerCount: snapshot && Array.isArray(snapshot.fighters) ? snapshot.fighters.length : 2,
      characters: snapshot && Array.isArray(snapshot.fighters)
        ? snapshot.fighters.map(fighter => fighter.characterId || "nova")
        : ["nova"],
      colorIndices: snapshot && Array.isArray(snapshot.fighters)
        ? snapshot.fighters.map(fighter => fighter.colorIndex || 0)
        : [0]
    };
  }

  getStageLayer(stage, stageId) {
    const key = `${stageId || stage.id || "battlefield"}:${Number(stage?.scale) || 1}`;
    if (!this.stageLayers.has(key)) {
      this.stageLayers.set(key, this.createStageLayer(stage, key));
    }
    return this.stageLayers.get(key);
  }

  createStageLayer(stage, stageId) {
    const bounds = this.getStageBounds(stage);
    const canvas = createRenderCanvas(bounds.width, bounds.height);
    const ctx = canvas.getContext("2d");
    ctx.translate(-bounds.x, -bounds.y);
    this.drawStage(ctx, stage);
    return { canvas, x: bounds.x, y: bounds.y };
  }

  getStageBounds(stage) {
    const margin = 8;
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (const platform of stage.platforms) {
      const triangle = platform.type === "main" ? getMainPlatformTriangle(platform) : null;
      left = Math.min(left, platform.x);
      top = Math.min(top, platform.y);
      right = Math.max(right, platform.x + platform.w);
      bottom = Math.max(bottom, triangle ? triangle.bottom : platform.y + platform.h);
    }
    if (!Number.isFinite(left)) return { x: 0, y: 0, width: 1, height: 1 };
    return {
      x: Math.floor(left - margin),
      y: Math.floor(top - margin),
      width: Math.ceil(right - left + margin * 2),
      height: Math.ceil(bottom - top + margin * 2)
    };
  }

  drawBackground(ctx, stageId) {
    ctx.fillStyle = "#8fdcff";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  drawStage(ctx, stage) {
    for (const platform of stage.platforms) {
      if (platform.type === "main") {
        this.drawMainStageBase(ctx, platform);
        continue;
      }
      const grad = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.h);
      grad.addColorStop(0, platform.type === "main" ? "#f5b642" : "#22c7a9");
      grad.addColorStop(1, platform.type === "main" ? "#8b5a17" : "#146c65");
      ctx.fillStyle = grad;
      roundRect(ctx, platform.x, platform.y, platform.w, platform.h, 8);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(platform.x + 10, platform.y + 5, platform.w - 20, 3);
    }
  }

  drawMainStageBase(ctx, platform) {
    const triangle = getMainPlatformTriangle(platform);
    const grad = ctx.createLinearGradient(triangle.centerX, triangle.top, triangle.centerX, triangle.bottom);
    grad.addColorStop(0, "#f5b642");
    grad.addColorStop(0.18, "#a66b1d");
    grad.addColorStop(1, "#4e3518");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(triangle.left, triangle.top);
    ctx.lineTo(triangle.right, triangle.top);
    ctx.lineTo(triangle.apexX, triangle.apexY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(triangle.left, triangle.top);
    ctx.lineTo(triangle.right, triangle.top);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(triangle.left, triangle.top);
    ctx.lineTo(triangle.apexX, triangle.apexY);
    ctx.lineTo(triangle.right, triangle.top);
    ctx.stroke();
  }

  getFighterSprite(characterId, colorIndex, pose = "idle", frame = 0) {
    const safeCharacterId = CHARACTER_ASSETS[characterId] ? characterId : "nova";
    const requestedPose = typeof pose === "boolean" ? (pose ? "attack" : "idle") : pose;
    const safePose = FIGHTER_POSE_FRAMES[requestedPose] ? requestedPose : "idle";
    const frameCount = FIGHTER_POSE_FRAMES[safePose];
    const safeFrame = ((Math.floor(Number(frame) || 0) % frameCount) + frameCount) % frameCount;
    const key = `${safeCharacterId}:${colorIndex}:${safePose}:${safeFrame}`;
    if (!this.fighterSprites.has(key)) {
      this.fighterSprites.set(key, this.createFighterSprite(safeCharacterId, colorIndex, safePose, safeFrame));
    }
    return this.fighterSprites.get(key);
  }

  createFighterSprite(characterId, colorIndex, pose, frame) {
    const widePose = ["grab", "dashGrab", "pivotGrab", "grabHold", "pummel", "throwForward", "throwBack", "throwUp", "throwDown", "specialSide"].includes(pose);
    const spriteSize = widePose ? 240 : 144;
    const center = spriteSize / 2;
    const canvas = createRenderCanvas(spriteSize, spriteSize);
    const ctx = canvas.getContext("2d");
    const color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
    ctx.translate(center, center);
    if (characterId === "gojo") this.drawGojoSprite(ctx, color, pose, frame);
    else this.drawNovaSprite(ctx, color, pose, frame);
    return { canvas, cx: center, cy: center, pose, frame };
  }

  drawGojoSprite(ctx, accent, pose, frame) {
    const frameCount = FIGHTER_POSE_FRAMES[pose] || 1;
    const progress = frameCount > 1 ? frame / (frameCount - 1) : 0;
    const motion = this.getGojoPose(pose, progress, frame);
    const outfit = "#101824";
    const outfitLight = "#223044";
    const skin = "#f2d1ba";

    ctx.save();
    ctx.translate(motion.offsetX, motion.offsetY);
    ctx.rotate(motion.bodyRotation);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(0, -8, 25, 47, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    this.drawGojoLimb(ctx, -8, 8, 29, 9, motion.rearLeg, outfit, outfitLight, accent, false);
    this.drawGojoLimb(ctx, 8, 8, 29, 9, motion.frontLeg, outfit, outfitLight, accent, false);
    this.drawGojoLimb(ctx, -16, -17, 29, 8, motion.rearArm, outfit, outfitLight, accent, true, skin);

    const coatGradient = ctx.createLinearGradient(-18, -31, 18, 15);
    coatGradient.addColorStop(0, "#26364b");
    coatGradient.addColorStop(0.45, outfit);
    coatGradient.addColorStop(1, "#080d15");
    ctx.fillStyle = coatGradient;
    ctx.beginPath();
    ctx.moveTo(-14, -29);
    ctx.quadraticCurveTo(-22, -22, -18, 3);
    ctx.lineTo(-13, 15);
    ctx.quadraticCurveTo(0, 20, 13, 15);
    ctx.lineTo(18, 3);
    ctx.quadraticCurveTo(22, -22, 14, -29);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#060a10";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = accent;
    roundRect(ctx, -14, 8, 28, 4, 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    roundRect(ctx, -11, -25, 5, 31, 2);
    ctx.fill();

    this.drawGojoLimb(ctx, 16, -17, 29, 8, motion.frontArm, outfit, outfitLight, accent, true, skin);

    ctx.fillStyle = outfitLight;
    roundRect(ctx, -12, -36, 24, 14, 7);
    ctx.fill();
    ctx.strokeStyle = "#070c13";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(0, -43, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8f6e60";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#090c12";
    roundRect(ctx, -15, -48, 30, 11, 5);
    ctx.fill();
    ctx.strokeStyle = colorWithAlpha(accent, 0.82);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-12, -39);
    ctx.quadraticCurveTo(0, -35, 12, -39);
    ctx.stroke();

    ctx.fillStyle = "#f5f7fb";
    ctx.strokeStyle = "#aeb9c9";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-15, -51);
    ctx.lineTo(-20, -57);
    ctx.lineTo(-11, -56);
    ctx.lineTo(-13, -64);
    ctx.lineTo(-4, -59);
    ctx.lineTo(0, -67);
    ctx.lineTo(5, -59);
    ctx.lineTo(14, -64);
    ctx.lineTo(12, -56);
    ctx.lineTo(21, -58);
    ctx.lineTo(15, -49);
    ctx.quadraticCurveTo(0, -54, -15, -51);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (pose === "hurt" || pose === "launched") {
      ctx.strokeStyle = "rgba(255,115,115,0.9)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-8, -34);
      ctx.lineTo(-3, -31);
      ctx.moveTo(8, -34);
      ctx.lineTo(3, -31);
      ctx.stroke();
    }
    ctx.restore();
  }

  getGojoPose(pose, progress = 0, frame = 0) {
    const runSwing = pose === "run"
      ? Math.sin(frame / Math.max(1, FIGHTER_POSE_FRAMES.run) * Math.PI * 2)
      : 0;
    const base = {
      rearLeg: 0.04,
      frontLeg: -0.04,
      rearArm: -0.05,
      frontArm: 0.05,
      offsetX: 0,
      offsetY: 0,
      bodyRotation: 0
    };
    if (pose === "run") {
      return {
        rearLeg: runSwing * 0.58,
        frontLeg: -runSwing * 0.58,
        rearArm: -runSwing * 0.5,
        frontArm: runSwing * 0.5,
        offsetX: 0,
        offsetY: Math.abs(runSwing) * 1.5,
        bodyRotation: 0.07
      };
    }
    if (pose === "jumpRise") {
      return { ...base, rearLeg: 0.48, frontLeg: -0.38, rearArm: -0.62, frontArm: 0.62, offsetY: -2 };
    }
    if (pose === "jumpFall") {
      return { ...base, rearLeg: -0.2, frontLeg: 0.24, rearArm: 0.35, frontArm: -0.38, offsetY: 1 };
    }
    if (pose === "hurt") {
      return { ...base, rearLeg: 0.4, frontLeg: -0.36, rearArm: 0.72, frontArm: -0.68, bodyRotation: -0.12 };
    }
    if (pose === "launched") {
      return { ...base, rearLeg: 0.68, frontLeg: -0.62, rearArm: -0.82, frontArm: 0.78 };
    }
    if (pose === "downed") {
      const settle = 1 - progress;
      return { ...base, rearLeg: 0.12, frontLeg: -0.12, rearArm: 0.15, frontArm: -0.15, offsetY: settle * 1.5 };
    }
    return base;
  }

  drawGojoLimb(ctx, x, y, length, width, angle, color, highlight, accent, hand = false, skin = "#f2d1ba") {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    roundRect(ctx, -width / 2, 0, width, length, width / 2);
    ctx.fill();
    ctx.fillStyle = highlight;
    roundRect(ctx, -width / 2 + 1.5, 3, 2.5, Math.max(5, length - 8), 1.2);
    ctx.fill();
    ctx.fillStyle = accent;
    roundRect(ctx, -width / 2, length - 5, width, 4, 2);
    ctx.fill();
    ctx.fillStyle = hand ? skin : "#070b12";
    ctx.beginPath();
    ctx.arc(0, length, hand ? width * 0.55 : width * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawNovaSprite(ctx, accent, pose, frame) {
    const grabPose = ["grab", "dashGrab", "pivotGrab", "grabHold", "pummel"].includes(pose);
    const throwPose = ["throwForward", "throwBack", "throwUp", "throwDown"].includes(pose);
    const specialPose = ["specialNeutral", "specialSide", "specialUp", "specialFall", "novaCharge", "finalSmash"].includes(pose);
    const active = pose === "attack" || pose.startsWith("jab") || pose.startsWith("smash") || grabPose || throwPose || specialPose || pose === "dashAttack" || pose === "airNeutral" || pose === "airForward" || pose === "airBack" || pose === "airUp" || pose === "side" || pose === "up" || pose === "down" || pose === "getupAttack";
    const runSwing = pose === "run" ? Math.sin(frame / FIGHTER_POSE_FRAMES.run * Math.PI * 2) : 0;
    const poseProgress = pose.startsWith("jab") || pose.startsWith("smash") || grabPose || throwPose || specialPose || pose === "dashAttack" || pose === "airNeutral" || pose === "airForward" || pose === "airBack" || pose === "airUp" || pose === "side" || pose === "up" || pose === "down" || pose === "getupAttack" || pose === "downed"
      ? frame / Math.max(1, FIGHTER_POSE_FRAMES[pose] - 1)
      : runSwing;
    const limbPose = this.getNovaLimbPose(pose, poseProgress);
    const armor = ctx.createLinearGradient(-20, -42, 22, 34);
    armor.addColorStop(0, "#ffffff");
    armor.addColorStop(0.52, "#e8eef4");
    armor.addColorStop(1, "#aab8c5");
    const darkMetal = ctx.createLinearGradient(-20, -20, 30, 28);
    darkMetal.addColorStop(0, "#263442");
    darkMetal.addColorStop(1, "#0d141c");

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.fillStyle = active ? colorWithAlpha(accent, 0.24) : colorWithAlpha(accent, 0.11);
    ctx.beginPath();
    ctx.arc(1, -2, active ? 47 : 40, 0, Math.PI * 2);
    ctx.fill();

    // Backpack and thruster establish Nova's forward-facing silhouette.
    ctx.fillStyle = "#111a23";
    roundRect(ctx, -30, -18, 13, 35, 4);
    ctx.fill();
    ctx.fillStyle = accent;
    roundRect(ctx, -31, -11, 5, 16, 2);
    ctx.fill();
    ctx.fillStyle = active ? "rgba(112,232,255,0.95)" : "rgba(112,232,255,0.5)";
    ctx.beginPath();
    ctx.moveTo(-30, 8);
    ctx.lineTo(-39 - limbPose.thruster, 14);
    ctx.lineTo(-30, 17);
    ctx.closePath();
    ctx.fill();

    // Legs are separate cached parts so later move animations can rotate them.
    this.drawNovaLimb(ctx, -11, 14, 11, 25, limbPose.rearLeg, armor, accent);
    this.drawNovaLimb(ctx, 10, 14, 11, 25, limbPose.frontLeg, armor, accent);
    ctx.fillStyle = "#111922";
    ctx.beginPath();
    ctx.arc(-9, 15, 5, 0, Math.PI * 2);
    ctx.arc(9, 15, 5, 0, Math.PI * 2);
    ctx.fill();

    // Dark inner frame.
    ctx.fillStyle = darkMetal;
    roundRect(ctx, -20, -20, 40, 42, 12);
    ctx.fill();
    ctx.strokeStyle = "#080d13";
    ctx.lineWidth = 3;
    ctx.stroke();

    // White chest armor with a player-color core.
    ctx.fillStyle = armor;
    ctx.beginPath();
    ctx.moveTo(-17, -17);
    ctx.lineTo(15, -17);
    ctx.lineTo(20, -8);
    ctx.lineTo(14, 16);
    ctx.lineTo(-13, 16);
    ctx.lineTo(-20, -7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#778795";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(2, -12);
    ctx.lineTo(11, -4);
    ctx.lineTo(4, 8);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(3, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    roundRect(ctx, -16, 11, 28, 5, 2);
    ctx.fill();

    // Rear arm and forward transforming arm cannon.
    this.drawNovaArm(ctx, -20, limbPose.rearArmRootY ?? -13, limbPose.rearArm, armor, accent, false, {
      forwardPunch: limbPose.rearArmForward,
      backwardPunch: limbPose.rearArmBackward,
      reachScale: limbPose.rearArmReach
    });
    if (limbPose.frontArmVisible !== false) {
      this.drawNovaArm(ctx, 19, limbPose.frontArmRootY ?? -13, limbPose.frontArm, armor, accent, true, {
        reachScale: limbPose.frontArmReach
      });
    }

    // Neck and head shell.
    ctx.fillStyle = "#101820";
    roundRect(ctx, -7, -27, 14, 12, 4);
    ctx.fill();
    ctx.fillStyle = armor;
    ctx.beginPath();
    ctx.moveTo(-20, -43);
    ctx.lineTo(13, -46);
    ctx.lineTo(23, -37);
    ctx.lineTo(20, -22);
    ctx.lineTo(10, -18);
    ctx.lineTo(-15, -20);
    ctx.lineTo(-23, -29);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#778795";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#091018";
    roundRect(ctx, -17, -38, 34, 14, 5);
    ctx.fill();
    const visor = ctx.createLinearGradient(-14, -35, 15, -30);
    visor.addColorStop(0, "#163745");
    visor.addColorStop(1, "#071116");
    ctx.fillStyle = visor;
    roundRect(ctx, -14, -36, 28, 10, 4);
    ctx.fill();
    const reacting = pose === "hurt" || pose === "launched";
    ctx.fillStyle = active ? "#ffffff" : reacting ? "#ff7676" : accent;
    ctx.beginPath();
    ctx.arc(8, -31, active ? 3.8 : 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colorWithAlpha(accent, 0.75);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-11, -31);
    ctx.lineTo(2, -31);
    ctx.stroke();

    // Short antenna keeps the head readable even at the zoomed-out camera scale.
    ctx.strokeStyle = "#263442";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, -43);
    ctx.lineTo(-14, -51);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(-14, -52, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  getNovaLimbPose(pose, motion = 0) {
    const progress = Math.max(0, Math.min(1, motion));
    const punch = Math.sin(progress * Math.PI);
    if (pose === "jab1") {
      return {
        rearLeg: 0.04 + punch * 0.08,
        frontLeg: -0.04 - punch * 0.1,
        rearArm: 0.12 + punch * 0.15,
        frontArm: 1.2 - punch * 1.38,
        frontArmReach: 1 + punch * 0.08,
        thruster: punch * 3
      };
    }
    if (pose === "jab2") {
      return {
        rearLeg: 0.04 - punch * 0.08,
        frontLeg: -0.04 + punch * 0.09,
        rearArm: 0.12 - punch * 0.24,
        rearArmForward: punch > 0.08,
        rearArmReach: 1 + punch * 0.18,
        frontArm: 1.2 - punch * 0.12,
        thruster: punch * 3
      };
    }
    if (pose === "jab3") {
      return {
        rearLeg: 0.04 + punch * 0.2,
        frontLeg: -0.04 - punch * 0.28,
        rearArm: 0.12 + punch * 0.28,
        frontArm: 1.2 - punch * 1.48,
        frontArmReach: 1 + punch * 0.34,
        thruster: punch * 10
      };
    }
    if (pose === "smashCharge" || pose === "smashSide") {
      const sideSmash = getNovaSideSmashMotion(progress, pose === "smashCharge");
      return {
        rearLeg: sideSmash.rearLeg,
        frontLeg: sideSmash.frontLeg,
        rearArm: sideSmash.rearArm,
        frontArm: sideSmash.frontArm,
        frontArmReach: sideSmash.frontArmReach,
        frontArmRootY: sideSmash.frontArmRootY,
        thruster: sideSmash.force * 7
      };
    }
    if (pose === "smashUpCharge" || pose === "smashUp") {
      const upSmash = getNovaUpSmashMotion(progress, pose === "smashUpCharge");
      return {
        rearLeg: upSmash.rearLeg,
        frontLeg: upSmash.frontLeg,
        rearArm: upSmash.rearArm,
        rearArmReach: upSmash.rearArmReach,
        rearArmForward: upSmash.rearArmForward,
        rearArmRootY: upSmash.rearArmRootY,
        frontArm: upSmash.frontArm,
        frontArmReach: upSmash.frontArmReach,
        frontArmRootY: upSmash.frontArmRootY,
        thruster: upSmash.force * 5
      };
    }
    if (pose === "smashDownCharge" || pose === "smashDown") {
      const downSmash = getNovaDownSmashMotion(progress, pose === "smashDownCharge");
      return {
        rearLeg: downSmash.rearLeg,
        frontLeg: downSmash.frontLeg,
        rearArm: downSmash.rearArm,
        rearArmReach: downSmash.rearArmReach,
        rearArmForward: downSmash.rearArmForward,
        rearArmRootY: downSmash.rearArmRootY,
        frontArm: downSmash.frontArm,
        frontArmReach: downSmash.frontArmReach,
        frontArmRootY: downSmash.frontArmRootY,
        thruster: downSmash.force * 4
      };
    }
    if (["grab", "dashGrab", "pivotGrab", "grabHold", "pummel"].includes(pose)) {
      const variant = pose === "dashGrab" ? "dash" : pose === "pivotGrab" ? "pivot" : "standing";
      const holding = pose === "grabHold" || pose === "pummel";
      const grab = getNovaGrabMotion(holding ? 1 : progress, variant, holding, pose === "pummel" ? progress : 0);
      return {
        rearLeg: grab.rearLeg,
        frontLeg: grab.frontLeg,
        rearArm: grab.rearArm,
        rearArmReach: grab.rearArmReach,
        rearArmForward: grab.rearArmForward,
        rearArmRootY: grab.rearArmRootY,
        frontArm: grab.frontArm,
        frontArmReach: grab.frontArmReach,
        frontArmRootY: grab.frontArmRootY,
        thruster: grab.force * 3
      };
    }
    if (["throwForward", "throwBack", "throwUp", "throwDown"].includes(pose)) {
      const variant = pose.slice("throw".length).toLowerCase();
      const move = getNovaThrowMotion(variant, progress * getMove("nova", pose).total);
      return {
        rearLeg: move.rearLeg,
        frontLeg: move.frontLeg,
        rearArm: move.rearArm,
        rearArmReach: move.rearArmReach,
        rearArmForward: move.rearArmForward,
        rearArmRootY: move.rearArmRootY,
        frontArm: move.frontArm,
        frontArmReach: move.frontArmReach,
        frontArmRootY: move.frontArmRootY,
        thruster: move.force * 2
      };
    }
    if (pose === "specialNeutral") {
      const motion = getNovaNeutralSpecialMotion(progress * getMove("nova", pose).total);
      return { ...motion, thruster: motion.force * 2 };
    }
    if (pose === "specialSide") {
      const motion = getNovaSideSpecialMotion(progress * getMove("nova", pose).total);
      return { ...motion, thruster: motion.force * 4 };
    }
    if (pose === "specialUp" || pose === "specialFall") {
      const motion = getNovaRecoveryMotion(
        progress * NOVA_RECOVERY.thrustDuration,
        pose === "specialUp" ? "thrust" : "fall"
      );
      return { ...motion, thruster: motion.force * 10 };
    }
    if (pose === "novaCharge") {
      const motion = getNovaChargeMotion(progress);
      return { ...motion, thruster: motion.force * 2 };
    }
    if (pose === "finalSmash") {
      const motion = getNovaFinalSmashMotion(progress * NOVA_FINAL_SMASH.totalDuration);
      return { ...motion, thruster: motion.transform * 6 };
    }
    if (pose === "dashAttack") {
      const commit = progress <= 2 / 3
        ? Math.min(1, progress * 6)
        : Math.max(0, (1 - progress) * 3);
      return {
        rearLeg: 0.04 + commit * 0.62,
        frontLeg: -0.04 + commit * 0.42,
        rearArm: 0.12 - commit * 0.8,
        frontArm: 1.2 + commit * 0.72,
        thruster: commit * 14
      };
    }
    if (pose === "airNeutral") {
      const burst = progress < 0.32
        ? Math.sin(progress / 0.32 * Math.PI / 2)
        : Math.max(0, 1 - (progress - 0.32) / 0.68);
      return {
        rearLeg: 0.04 + burst * 0.56,
        frontLeg: -0.04 - burst * 0.56,
        rearArm: 0.12 - burst * 1.02,
        rearArmForward: burst > 0.08,
        rearArmReach: 1 + burst * 0.18,
        frontArm: 1.2 + burst * 0.92,
        frontArmReach: 1 + burst * 0.15,
        thruster: burst * 8
      };
    }
    if (pose === "airForward") {
      const forwardAir = getNovaForwardAirMotion(progress);
      return {
        rearLeg: 0.04 + forwardAir.force * 0.2,
        frontLeg: -0.04 - forwardAir.force * 0.18,
        rearArm: 0.12 + forwardAir.force * 0.3,
        frontArm: forwardAir.angle,
        frontArmReach: forwardAir.reach,
        frontArmRootY: -13 - forwardAir.force * 2,
        thruster: forwardAir.force * 5
      };
    }
    if (pose === "airBack") {
      const backAir = getNovaBackAirMotion(progress);
      return {
        rearLeg: backAir.rearLeg,
        frontLeg: backAir.frontLeg,
        rearArm: backAir.rearArm,
        frontArm: backAir.frontArm,
        thruster: backAir.force * 2
      };
    }
    if (pose === "airUp") {
      const upAir = getNovaUpAirMotion(progress);
      return {
        rearLeg: upAir.rearLeg,
        frontLeg: upAir.frontLeg,
        rearArm: upAir.rearArm,
        frontArm: upAir.frontArm,
        thruster: 0
      };
    }
    if (pose === "side") {
      const sideTilt = getNovaSideTiltMotion(progress);
      return {
        rearLeg: 0.04 + sideTilt.force * 0.18,
        frontLeg: -0.04 - sideTilt.force * 0.22,
        rearArm: 0.12 + sideTilt.force * 0.24,
        frontArm: sideTilt.angle,
        frontArmReach: sideTilt.reach,
        thruster: sideTilt.force * 5
      };
    }
    if (pose === "up") {
      const upTilt = getNovaUpTiltMotion(progress);
      const force = Math.max(upTilt.rightHandForce, upTilt.leftHandForce);
      return {
        rearLeg: 0.04 + force * 0.18,
        frontLeg: -0.04 - force * 0.18,
        rearArm: upTilt.rightHandAngle,
        rearArmForward: upTilt.rightHandExtended,
        rearArmReach: upTilt.rightHandReach,
        rearArmRootY: upTilt.rightShoulderY,
        frontArm: upTilt.leftHandAngle,
        frontArmReach: upTilt.leftHandReach,
        frontArmRootY: upTilt.leftShoulderY,
        thruster: force * 4
      };
    }
    if (pose === "down") {
      const downTilt = getNovaDownTiltMotion(progress);
      return {
        rearLeg: downTilt.rearLeg,
        frontLeg: downTilt.frontLeg,
        rearArm: downTilt.rearArm,
        frontArm: downTilt.frontArm,
        rearArmRootY: downTilt.armRootY,
        frontArmRootY: downTilt.armRootY,
        thruster: 0
      };
    }
    if (pose === "getupAttack") {
      const strike = Math.sin(progress * Math.PI);
      return {
        rearLeg: 0.04 + strike * 0.18,
        frontLeg: -0.04 - strike * 0.18,
        rearArm: 0.04,
        rearArmBackward: strike > 0.08,
        rearArmReach: 1 + strike * 0.62,
        frontArm: 0.04,
        frontArmReach: 1 + strike * 0.42,
        rearArmRootY: -12,
        frontArmRootY: -12,
        thruster: strike * 3
      };
    }
    if (pose === "downed") {
      const settling = 1 - progress;
      return {
        rearLeg: 0.08 + settling * 0.06,
        frontLeg: -0.08 - settling * 0.06,
        rearArm: 1.12 + settling * 0.06,
        frontArm: 1.26 - settling * 0.04,
        thruster: 0
      };
    }
    if (pose === "attack") {
      return { rearLeg: 0.13, frontLeg: -0.16, rearArm: -0.28, frontArm: -0.2, thruster: 7 };
    }
    if (pose === "run") {
      return {
        rearLeg: motion * 0.48,
        frontLeg: motion * -0.48,
        rearArm: 0.12 - motion * 0.34,
        frontArm: 1.08 + motion * 0.26,
        thruster: 4 + Math.abs(motion) * 4
      };
    }
    if (pose === "jumpRise") {
      return { rearLeg: -0.42, frontLeg: 0.42, rearArm: -0.48, frontArm: 0.5, thruster: 10 };
    }
    if (pose === "jumpFall") {
      return { rearLeg: 0.2, frontLeg: -0.2, rearArm: 0.36, frontArm: 1.38, thruster: 0 };
    }
    if (pose === "hurt") {
      return { rearLeg: 0.34, frontLeg: -0.32, rearArm: -0.62, frontArm: -0.48, thruster: 0 };
    }
    if (pose === "launched") {
      return { rearLeg: 0.62, frontLeg: -0.58, rearArm: 0.52, frontArm: -0.64, thruster: 0 };
    }
    return { rearLeg: 0.04, frontLeg: -0.04, rearArm: 0.12, frontArm: 1.2, thruster: 0 };
  }

  drawNovaLimb(ctx, x, y, width, height, angle, armor, accent) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = "#101820";
    roundRect(ctx, -width / 2 + 1, 0, width - 2, height - 4, 4);
    ctx.fill();
    ctx.fillStyle = armor;
    roundRect(ctx, -width / 2, 7, width, height - 8, 4);
    ctx.fill();
    ctx.strokeStyle = "#778795";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = accent;
    roundRect(ctx, -width / 2 - 2, height - 3, width + 8, 7, 3);
    ctx.fill();
    ctx.restore();
  }

  drawNovaArm(ctx, x, y, angle, armor, accent, cannon, options = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, 2, 8, 0, Math.PI * 2);
    ctx.fill();
    const reachScale = Math.max(0.8, Number(options.reachScale) || 1);
    if (!cannon && options.backwardPunch) {
      const armLength = 30 * reachScale;
      ctx.fillStyle = "#111a23";
      roundRect(ctx, -armLength - 2, 0, armLength, 12, 5);
      ctx.fill();
      ctx.fillStyle = armor;
      roundRect(ctx, -armLength + 1, 2, Math.max(8, armLength - 6), 8, 4);
      ctx.fill();
      ctx.strokeStyle = "#778795";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = accent;
      roundRect(ctx, -armLength - 9, -2, 12, 16, 5);
      ctx.fill();
      ctx.fillStyle = "#111a23";
      roundRect(ctx, -armLength - 7, 2, 10, 8, 4);
      ctx.fill();
      ctx.restore();
      return;
    }
    if (!cannon && options.forwardPunch) {
      const armLength = 30 * reachScale;
      ctx.fillStyle = "#111a23";
      roundRect(ctx, 2, 0, armLength, 12, 5);
      ctx.fill();
      ctx.fillStyle = armor;
      roundRect(ctx, 5, 2, Math.max(8, armLength - 6), 8, 4);
      ctx.fill();
      ctx.strokeStyle = "#778795";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = accent;
      roundRect(ctx, armLength - 3, -2, 12, 16, 5);
      ctx.fill();
      ctx.fillStyle = "#111a23";
      roundRect(ctx, armLength, 2, 10, 8, 4);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.scale(reachScale, 1);
    ctx.fillStyle = "#111a23";
    roundRect(ctx, cannon ? 2 : -8, 0, cannon ? 30 : 13, 12, 5);
    ctx.fill();
    ctx.fillStyle = armor;
    roundRect(ctx, cannon ? 5 : -6, 2, cannon ? 24 : 11, 8, 4);
    ctx.fill();
    ctx.strokeStyle = "#778795";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (cannon) {
      ctx.fillStyle = accent;
      roundRect(ctx, 22, -2, 10, 16, 4);
      ctx.fill();
      ctx.fillStyle = "#071116";
      ctx.beginPath();
      ctx.arc(31, 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(130,239,255,0.9)";
      ctx.beginPath();
      ctx.arc(31, 6, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#111a23";
      roundRect(ctx, -8, 9, 12, 8, 4);
      ctx.fill();
    }
    ctx.restore();
  }
}

function colorWithAlpha(hex, alpha) {
  const value = String(hex || "#ffffff").replace("#", "");
  const normalized = value.length === 3
    ? value.split("").map(character => character + character).join("")
    : value.padEnd(6, "f").slice(0, 6);
  const number = Number.parseInt(normalized, 16);
  const red = (number >> 16) & 255;
  const green = (number >> 8) & 255;
  const blue = number & 255;
  return `rgba(${red},${green},${blue},${alpha})`;
}
