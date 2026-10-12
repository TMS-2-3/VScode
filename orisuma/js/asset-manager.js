import { CHARACTER_ASSETS, PLAYER_COLORS, STAGES } from "./constants.js";
import { getMainPlatformTriangle } from "./battle-data.js";
import { createRenderCanvas, roundRect } from "./utils.js";

export class AssetManager {
  constructor() {
    this.stageLayers = new Map();
    this.fighterSprites = new Map();
    this.manifests = new Set();
    this.lastManifestKey = "";
  }

  preload(manifest) {
    const normalized = this.normalizeManifest(manifest);
    const key = `${normalized.stage}|${normalized.characters.join(",")}`;
    if (this.manifests.has(key)) {
      this.lastManifestKey = key;
      return;
    }

    this.getStageLayer(STAGES[normalized.stage], normalized.stage);
    for (const characterId of normalized.characters) {
      for (let colorIndex = 0; colorIndex < PLAYER_COLORS.length; colorIndex += 1) {
        this.getFighterSprite(characterId, colorIndex, false);
        this.getFighterSprite(characterId, colorIndex, true);
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
    return {
      stage,
      characters: Array.from(new Set(characters.map(id => CHARACTER_ASSETS[id] ? id : "nova"))).sort()
    };
  }

  manifestFromSnapshot(snapshot) {
    return {
      stage: snapshot && snapshot.rules ? snapshot.rules.stage : "battlefield",
      characters: snapshot && Array.isArray(snapshot.fighters)
        ? snapshot.fighters.map(fighter => fighter.characterId || "nova")
        : ["nova"]
    };
  }

  getStageLayer(stage, stageId) {
    const key = stageId || stage.id || "battlefield";
    if (!this.stageLayers.has(key)) {
      this.stageLayers.set(key, this.createStageLayer(stage, key));
    }
    return this.stageLayers.get(key);
  }

  createStageLayer(stage, stageId) {
    const stageBottom = stage.platforms
      .filter(platform => platform.type === "main")
      .reduce((bottom, platform) => Math.max(bottom, getMainPlatformTriangle(platform).bottom), 720);
    const canvas = createRenderCanvas(1280, Math.ceil(stageBottom + 24));
    const ctx = canvas.getContext("2d");
    this.drawBackground(ctx, stageId);
    this.drawStage(ctx, stage);
    return canvas;
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

  getFighterSprite(characterId, colorIndex, active) {
    const safeCharacterId = CHARACTER_ASSETS[characterId] ? characterId : "nova";
    const key = `${safeCharacterId}:${colorIndex}:${active ? "active" : "idle"}`;
    if (!this.fighterSprites.has(key)) {
      this.fighterSprites.set(key, this.createFighterSprite(safeCharacterId, colorIndex, active));
    }
    return this.fighterSprites.get(key);
  }

  createFighterSprite(characterId, colorIndex, active) {
    const canvas = createRenderCanvas(128, 144);
    const ctx = canvas.getContext("2d");
    const color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
    ctx.translate(64, 72);
    this.drawNovaSprite(ctx, color, active);
    return { canvas, cx: 64, cy: 72 };
  }

  drawNovaSprite(ctx, accent, active) {
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
    ctx.lineTo(-39 - (active ? 7 : 0), 14);
    ctx.lineTo(-30, 17);
    ctx.closePath();
    ctx.fill();

    // Legs are separate cached parts so later move animations can rotate them.
    this.drawNovaLimb(ctx, -11, 14, 11, 25, active ? 0.13 : 0.04, armor, accent);
    this.drawNovaLimb(ctx, 10, 14, 11, 25, active ? -0.16 : -0.04, armor, accent);
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
    this.drawNovaArm(ctx, -20, -13, active ? -0.28 : 0.1, armor, accent, false);
    this.drawNovaArm(ctx, 19, -13, active ? -0.2 : 0.05, armor, accent, true);

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
    ctx.fillStyle = active ? "#ffffff" : accent;
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

  drawNovaArm(ctx, x, y, angle, armor, accent, cannon) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, 2, 8, 0, Math.PI * 2);
    ctx.fill();
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
