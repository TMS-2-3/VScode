const INK = "#35202b";
const TWO_PI = Math.PI * 2;

export const PLAYER_CHARACTER = Object.freeze({ GIRL: "girl", BOY: "boy" });

export function normalizePlayerCharacter(value) {
  return value === PLAYER_CHARACTER.BOY ? PLAYER_CHARACTER.BOY : PLAYER_CHARACTER.GIRL;
}

export const PLAYER_ARTWORK = Object.freeze({
  runFrames: 8,
  standing: { width: 320, height: 360, anchorX: 164 },
  ducking: { width: 380, height: 220, anchorX: 223 },
});

export function paintPlayerArtwork(context, width, height, {
  pose = "run", frame = 0, character = PLAYER_CHARACTER.GIRL,
} = {}) {
  const boy = normalizePlayerCharacter(character) === PLAYER_CHARACTER.BOY;
  const ducking = pose === "duck";
  const dimensions = ducking ? PLAYER_ARTWORK.ducking : PLAYER_ARTWORK.standing;
  const phase = frame / PLAYER_ARTWORK.runFrames * TWO_PI;
  context.save();
  context.scale(width / dimensions.width, height / dimensions.height);
  context.lineCap = "round";
  context.lineJoin = "round";

  if (ducking) {
    paintSlidingWitch(context, boy);
  } else {
    paintRunningWitch(context, phase, pose, boy);
  }

  context.restore();
}

function paintRunningWitch(context, phase, pose, boy) {
  const running = pose === "run";
  const stride = running ? Math.sin(phase) : 0;
  const bob = running ? -Math.abs(Math.cos(phase)) * 3 : 0;
  const jumping = pose === "jump";
  const hit = pose === "hit";
  const dizzy = pose === "dizzy";
  const backFoot = jumping
    ? { x: 116, y: 305 }
    : { x: 120 - stride * 32, y: 350 - Math.max(0, stride) * 42 };
  const frontFoot = jumping
    ? { x: 207, y: 327 }
    : { x: 183 + stride * 30, y: 350 - Math.max(0, -stride) * 40 };

  paintLeg(context, 154, 275, backFoot.x, backFoot.y, "#edd0b5", true);
  context.save();
  context.translate(0, bob);
  const flap = running ? Math.sin(phase + 0.7) * 7 : jumping ? -11 : 1;
  shape(context,
    `M174 225 C131 212 96 ${207 + flap} 62 ${222 + flap}
     C38 ${229 + flap} 26 240 24 253 Q41 247 51 271
     Q73 258 91 282 Q112 299 146 291 L201 264 Z`,
    gradient(context, 20, 220, 170, 295, ["#ffb547", "#ee712d"]),
  );
  shape(context,
    `M174 224 C135 212 96 ${212 + flap} 65 ${224 + flap}
     Q38 ${233 + flap} 29 246 Q49 238 62 258
     Q86 254 104 274 Q124 288 155 282 L198 255 Z`,
    gradient(context, 60, 217, 143, 288, boy ? ["#45685f", "#263e3d"] : ["#594054", "#302237"]),
  );
  line(context, "M43 241 Q70 231 96 239 Q112 244 125 253", boy ? "#729184" : "#806079", 2.3);
  paintLeg(context, 177, 279, frontFoot.x, frontFoot.y, "#ffe6ce", false);
  if (boy) {
    shape(context,
      "M158 228 Q180 219 198 234 L205 265 Q185 279 151 268 L140 254 Z",
      gradient(context, 153, 231, 200, 272, ["#53786a", "#294740"]),
    );
    shape(context,
      "M151 267 Q177 275 200 265 L206 287 L181 291 L176 278 L171 293 L148 288 Z",
      "#3b303d", 3.5,
    );
    line(context, "M183 245 L179 269 M157 283 L168 286 M187 284 L198 281", "#8d8178", 2);
    ellipse(context, 186, 251, 2, 2.3, "#ffd07c", 0);
    ellipse(context, 183, 262, 2, 2.3, "#ffd07c", 0);
  } else {
    shape(context,
      "M161 227 Q183 218 200 235 Q205 254 217 280 Q193 303 153 290 L136 271 Z",
      gradient(context, 158, 225, 205, 291, ["#51334e", "#302138"]),
    );
    line(context, "M170 254 Q165 273 156 283 M188 253 Q190 272 201 283", "#76516c", 2.3);
  }
  shape(context, "M160 225 Q180 217 195 227 L208 237 L185 247 L158 238 Z", "#f58835", 3);
  shape(context,
    "M134 258 Q140 264 146 271 L139 280 Q128 283 122 276 L125 268 Z",
    "#ffedd9", 3,
  );
  line(context, "M128 274 L132 276 M134 272 L138 275", "#d5a68d", 1.4);
  paintHattedHead(context, hit ? "hit" : dizzy ? "dizzy" : "normal", false, boy);
  paintNeckwear(context, 183, 238, boy);
  const bagSwing = running ? Math.sin(phase + 0.8) * 4 : jumping ? -6 : 0;
  paintPumpkin(context, 251 + bagSwing, 281 + Math.abs(bagSwing) * 0.5, 71, true);
  shape(context,
    `M200 238 Q208 236 216 242 L228 231 Q235 228 239 235 Q242 240 236 245
     Q232 252 221 257 L204 255 L195 248 Z`,
    "#ffecd6", 3.5,
  );
  shape(context, "M196 237 Q208 238 213 246 L207 256 L190 249 Z", boy ? "#36574c" : "#493044", 3);
  line(context, "M230 235 L235 239 M226 239 L231 244", "#d4a58e", 1.4);
  context.restore();
}

function paintSlidingWitch(context, boy) {
  shape(context,
    `M228 144 Q182 123 133 126 Q70 121 28 155 Q52 151 67 179
     Q92 169 115 192 Q157 208 211 192 L250 167 Z`,
    gradient(context, 40, 138, 180, 202, ["#ffb849", "#ed762f"]),
  );
  shape(context,
    `M224 142 Q174 127 129 133 Q76 128 39 150 Q60 146 75 166
     Q99 161 119 182 Q160 198 210 181 L244 163 Z`,
    gradient(context, 75, 130, 171, 192, boy ? ["#45685f", "#263e3d"] : ["#594054", "#302237"]),
  );
  paintLeg(context, 186, 178, 129, 207, "#edd0b5", true);
  paintLeg(context, 210, 181, 264, 211, "#ffe6ce", false);
  shape(context,
    "M179 156 Q203 144 230 157 L253 177 Q237 195 202 196 L166 184 Z",
    gradient(context, 188, 154, 219, 198, boy ? ["#53786a", "#294740"] : ["#54364e", "#312237"]),
  );
  if (boy) {
    shape(context, "M177 178 L219 180 L231 192 L208 197 L200 189 L186 197 L167 188 Z", "#3b303d", 3);
  }
  shape(context, "M218 151 L237 154 L246 167 L227 176 L209 166 Z", "#ef8739", 3);
  context.save();
  context.translate(65, -68);
  paintHattedHead(context, "normal", true, boy);
  context.restore();
  paintNeckwear(context, 225, 170, boy);
  paintPumpkin(context, 331, 183, 71, true);
  shape(context,
    `M238 178 Q252 170 268 178 L294 176 Q306 171 311 179 Q314 186 307 191
     L270 194 Q250 198 240 189 Z`,
    "#ffecd6", 3.3,
  );
  shape(context, "M238 173 Q252 172 258 185 L252 195 L231 186 Z", boy ? "#36574c" : "#493044", 3);
}

function paintLeg(context, hipX, hipY, footX, soleY, skin, behind) {
  const bootAngle = behind && soleY < 340 ? -0.45 : -0.02;
  const cosine = Math.cos(bootAngle);
  const sine = Math.sin(bootAngle);
  // Connect the leg to the rotated boot cuff, not its unrotated position.
  const ankleX = footX + sine * 27;
  const ankleY = soleY - cosine * 27;
  const cuffX = cosine * 8;
  const cuffY = sine * 8;
  const kneeX = (hipX + ankleX) * 0.5 + (behind ? -7 : 11);
  const kneeY = (hipY + ankleY) * 0.5 + 7;
  shape(context,
    `M${hipX - 10} ${hipY} Q${kneeX - 8} ${kneeY} ${ankleX - cuffX} ${ankleY - cuffY}
     L${ankleX + cuffX} ${ankleY + cuffY} Q${kneeX + 10} ${kneeY} ${hipX + 11} ${hipY + 2} Z`,
    skin, 3.5,
  );
  context.save();
  context.translate(footX, soleY);
  context.rotate(bootAngle);
  shape(context,
    `M-12 -30 Q-2 -35 10 -29 L11 -15 Q21 -15 27 -9 Q33 -2 25 2
     Q13 9 -10 5 Q-17 5 -17 -5 Z`,
    gradient(context, -10, -30, 12, 5, ["#654333", "#34251f"]),
    3.7,
  );
  line(context, "M-13 -23 Q-3 -26 8 -22", "#a3754b", 3);
  line(context, "M-10 0 Q9 4 24 -2", "#211b20", 2.3);
  shape(context, "M-3 -25 L4 -25 L4 -19 L-3 -19 Z", "#e0aa56", 1.7);
  context.restore();
}

function paintHattedHead(context, expression, foldedHat = false, boy = false) {
  paintHead(context, 133, 135, expression, boy);
  context.save();

  if (expression === "hit") {
    context.translate(169, 130);
    context.rotate(-0.12);
    context.translate(-169, -130);
  }

  paintHat(context, foldedHat);
  context.restore();
}

function paintHead(context, x, y, expression, boy) {
  context.save();
  context.translate(x, y);
  const hair = gradient(context, 20, -30, 65, 98, boy ? ["#b78255", "#805238"] : ["#ae7256", "#784931"]);
  shape(context,
    boy
      ? `M-12 21 Q-12 -21 28 -33 Q77 -46 110 -17 Q125 2 120 32
         L114 52 L120 65 L107 62 L108 79 L92 74 L79 82 L67 73
         L42 79 L23 69 Q1 79 -8 60 L-23 56 L-16 42 Z`
      : `M-12 21 Q-12 -21 28 -33 Q77 -46 110 -17 Q125 2 120 32
         Q130 56 115 72 Q118 84 106 87 Q102 99 86 91 Q75 108 58 96
         Q43 111 28 98 Q7 111 -3 93 Q-23 100 -24 79 Q-42 78 -29 56 Z`,
    hair,
  );
  shape(context,
    `M9 19 Q35 -2 79 8 Q112 14 115 46 Q122 78 98 94
     Q76 110 41 98 Q11 93 3 69 Q-6 43 9 19 Z`,
    gradient(context, 30, 24, 95, 96, ["#fff3df", "#ffdec6"]),
    3.5,
  );
  ellipse(context, 10, 65, 11, 15, "#ffe6cf", 3);
  line(context, "M8 59 Q0 63 8 70", "#d99c87", 2.5);
  shape(context,
    boy
      ? `M-17 25 Q-12 -13 22 -32 Q64 -48 104 -22 Q122 -6 120 19
         L113 34 L105 25 L100 42 L91 34 L84 45 L78 28 L64 46
         L60 32 L44 49 L40 35 L26 45 L18 37 L11 59 Q0 65 -4 49
         L-14 54 L-11 38 L-23 43 Z`
      : `M-17 25 Q-15 -14 20 -32 Q66 -51 105 -21 Q122 -7 120 20
         L113 42 Q106 49 109 23 Q104 43 96 43 L98 20 Q91 44 81 43
         L84 14 Q76 44 63 47 Q58 48 64 28 Q51 52 40 46
         Q29 54 21 50 L15 68 Q4 75 3 57 Q-6 66 -12 58 Q-24 58 -20 44 Z`,
    hair,
  );
  line(context, "M26 -13 Q19 4 17 22 M54 -21 Q48 -2 46 14 M82 -15 Q81 -1 77 13", "#c78b69", 2.8);
  ellipse(context, 60, 80, 10, 5, "rgba(240, 139, 128, 0.5)", 0);
  ellipse(context, 108, 73, 6, 4, "rgba(240, 139, 128, 0.38)", 0);

  if (expression === "hit") {
    line(context, "M65 56 L77 67 M77 54 L65 67 M97 50 L107 60 M107 49 L97 61", INK, 3.5);
    ellipse(context, 88, 83, 7, 8, "#b75851", 2);
  } else if (expression === "dizzy") {
    paintSpiralEye(context, 72, 62, 8.5);
    paintSpiralEye(context, 104, 56, 7.5);
    line(context, "M79 85 Q84 80 88 86 Q93 91 98 84", "#9d5750", 2.8);
  } else {
    ellipse(context, 73, 62, 4.2, 11, "#382326", 0, 0.12);
    ellipse(context, 103, 56, 3.5, 9, "#382326", 0, 0.12);
    ellipse(context, 74, 58, 1.15, 2.5, "#fff8e7", 0);
    ellipse(context, 104, 53, 0.9, 2, "#fff8e7", 0);
    line(context, "M80 82 Q88 91 97 80", "#9d5750", 2.8);
  }

  context.restore();
}

function paintSpiralEye(context, x, y, radius) {
  context.beginPath();

  for (let step = 0; step <= 48; step += 1) {
    const progress = step / 48;
    const angle = progress * Math.PI * 4.5;
    const distance = radius * (1 - progress);
    const nextX = x + Math.cos(angle) * distance;
    const nextY = y + Math.sin(angle) * distance;

    if (step === 0) {
      context.moveTo(nextX, nextY);
    } else {
      context.lineTo(nextX, nextY);
    }
  }

  context.strokeStyle = INK;
  context.lineWidth = 2.5;
  context.stroke();
}

function paintHat(context, folded = false) {
  shape(context,
    // Fold the tip backward when sliding without scaling down the head or brim.
    folded
      ? `M74 130 Q85 112 99 101 Q74 98 56 113 Q39 126 30 116
         Q21 105 38 95 Q78 72 123 78 Q184 73 222 99
         L237 124 Q170 154 74 154 Z`
      : `M74 130 Q83 99 96 65 Q74 72 59 87 Q42 94 39 83
         Q41 74 58 56 Q81 25 103 13 Q117 4 134 11
         Q194 30 222 84 L237 124 Q170 154 74 154 Z`,
    gradient(context, 101, 20, 175, 150, ["#54374b", "#2d2235"]),
  );
  line(context, folded ? "M66 94 Q89 85 112 87" : "M106 26 Q96 39 89 53", "#735167", 2.7);
  shape(context,
    "M81 121 Q145 103 212 82 L229 103 Q153 126 73 148 Z",
    gradient(context, 114, 115, 200, 97, ["#ffad50", "#f27c30"]),
    3.3,
  );
  line(context, "M91 123 Q150 107 210 88", "#ffc36e", 2.5);
  shape(context,
    `M28 163 Q69 136 139 112 Q222 81 274 77 Q297 76 283 96
     Q263 119 218 138 Q140 174 67 182 Q27 188 22 178 Q19 173 28 163 Z`,
    gradient(context, 129, 115, 161, 178, ["#4d3348", "#302035"]),
    4.2,
  );
  line(context, "M35 173 Q81 180 159 151", "#79556b", 2.2);
  context.save();
  context.translate(143, 111);
  context.rotate(-0.22);
  paintPumpkin(context, 0, 0, 49, false);
  context.restore();
}

function paintNeckwear(context, x, y, boy) {
  context.save();
  context.translate(x, y);

  if (boy) {
    shape(context, "M-12 -7 L0 -2 L14 -9 L11 5 L0 10 L-10 3 Z", "#fff1d6", 2.5);
    shape(context, "M-3 3 L5 2 L9 23 L1 28 L-6 21 Z", "#f39236", 2.5);
    shape(context, "M-4 0 L3 -3 L8 2 L3 8 L-4 7 Z", "#ffb34f", 2.5);
    line(context, "M0 13 L3 21", "#ffd17b", 2);
  } else {
    shape(context, "M0 0 Q-24 -14 -21 -2 Q-18 12 0 3 Q9 -17 17 -12 Q26 -2 3 4", "#714329", 2.8, "#ff9d3d");
    line(context, "M-1 5 Q-5 22 -19 32 M3 5 Q10 20 8 30", "#ffa348", 3.6);
    line(context, "M-19 32 L-23 32 M8 30 L11 33", "#ffd17b", 2.4);
    ellipse(context, 0, 3, 4, 4.5, "#ffb34f", 2);
  }
  context.restore();
}

export function paintPlayerCandyBasket(context, x, y, size) {
  paintPumpkin(context, x, y, size, true);
}

function paintPumpkin(context, x, y, size, bag) {
  context.save();
  context.translate(x, y);
  context.scale(size / 84, size / 84);

  if (bag) {
    line(context, "M-24 -18 Q-35 -58 -2 -62 Q29 -64 31 -20", "#3c2723", 7);
    line(context, "M-24 -18 Q-35 -58 -2 -62 Q29 -64 31 -20", "#bc7135", 2.5);
  }

  shape(context, "M-4 -27 L-7 -40 Q0 -44 5 -37 L7 -26 Z", "#9a622c", 2.5);
  shape(context,
    `M-1 -27 Q-18 -35 -30 -20 Q-43 -8 -35 13 Q-29 31 -10 29
     Q0 35 13 28 Q31 30 38 12 Q47 -8 32 -20 Q18 -34 5 -27 Z`,
    gradient(context, -19, -24, 21, 29, ["#ffb14b", "#fb7524"]),
    3.4,
  );
  line(context, "M-11 -24 Q-24 -6 -14 23 M11 -24 Q27 -6 17 23", "#e75f1c", 2.5);
  line(context, "M-27 -12 Q-31 -3 -29 4", "#ffd17b", 3.5);
  shape(context, "M-22 -7 Q-18 -15 -11 -9 Q-8 -2 -15 0 Q-22 0 -22 -7 Z", INK, 0);
  shape(context, "M13 -11 Q21 -17 24 -9 Q27 -2 20 -1 Q12 -2 13 -11 Z", INK, 0);
  shape(context, "M-2 -3 L-7 5 L4 4 Z", INK, 0);
  shape(context,
    `M-21 8 Q-11 13 -5 10 L-3 16 L5 15 L8 9 Q17 10 26 3
     Q22 23 5 25 Q-12 29 -21 8 Z`,
    INK, 0,
  );
  context.restore();
}

function shape(context, data, fill, lineWidth = 4, stroke = INK) {
  const path = new Path2D(data);
  context.fillStyle = fill;
  context.fill(path);

  if (lineWidth > 0) {
    context.lineWidth = lineWidth;
    context.strokeStyle = stroke;
    context.stroke(path);
  }
}

function line(context, data, color, lineWidth) {
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.stroke(new Path2D(data));
}

function ellipse(context, x, y, radiusX, radiusY, fill, lineWidth = 0, rotation = 0) {
  context.beginPath();
  context.ellipse(x, y, radiusX, radiusY, rotation, 0, TWO_PI);
  context.fillStyle = fill;
  context.fill();

  if (lineWidth > 0) {
    context.lineWidth = lineWidth;
    context.strokeStyle = INK;
    context.stroke();
  }
}

function gradient(context, x1, y1, x2, y2, colors) {
  const fill = context.createLinearGradient(x1, y1, x2, y2);
  colors.forEach((color, index) => fill.addColorStop(index / (colors.length - 1), color));
  return fill;
}
