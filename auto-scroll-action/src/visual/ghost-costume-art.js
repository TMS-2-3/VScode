import { paintPlayerCandyBasket, PLAYER_ARTWORK } from "./player-art.js";

const INK = "#44374d";
const TWO_PI = Math.PI * 2;

export function paintGhostCostumeArtwork(context, width, height, {
  pose = "run", frame = 0,
} = {}) {
  const sliding = pose === "duck";
  const dimensions = sliding ? PLAYER_ARTWORK.ducking : PLAYER_ARTWORK.standing;
  const phase = frame / PLAYER_ARTWORK.runFrames * TWO_PI;
  context.save();
  context.scale(width / dimensions.width, height / dimensions.height);
  context.lineCap = "round";
  context.lineJoin = "round";
  if (sliding) paintSlidingChild(context);
  else paintRunningChild(context, phase, pose);
  context.restore();
}

function paintRunningChild(context, phase, pose) {
  const running = pose === "run";
  const jumping = pose === "jump";
  const stride = running ? Math.sin(phase) : 0;
  const flutter = running ? Math.sin(phase + 0.6) * 6 : jumping ? -10 : 0;
  const backFoot = jumping
    ? { x: 115, y: 309 }
    : { x: 123 - stride * 33, y: 350 - Math.max(0, stride) * 40 };
  const frontFoot = jumping
    ? { x: 211, y: 327 }
    : { x: 184 + stride * 31, y: 350 - Math.max(0, -stride) * 39 };

  paintLeg(context, 145, 273, backFoot, true);
  paintLeg(context, 180, 278, frontFoot, false);
  context.save();
  context.translate(0, running ? -Math.abs(Math.cos(phase)) * 3 : 0);
  paintHand(context, 80 - stride * 5, 230 - stride * 7, -0.35);
  shape(context,
    `M89 198 Q74 220 64 ${255 + flutter} L56 ${281 + flutter}
     Q77 ${264 + flutter} 94 285 Q110 270 132 293 Q151 276 173 292
     Q193 273 217 284 L248 263 L239 204 Z`,
    gradient(context, 80, 215, 190, 295, ["#b3abc9", "#81799f"]),
  );
  shape(context,
    `M77 267 Q85 236 89 202 Q88 177 100 156
     C82 131 87 89 110 62 C134 26 177 22 208 34
     C241 46 259 79 254 114 Q255 139 242 157
     Q252 181 250 208 L268 255 Q252 246 241 269
     Q224 255 209 279 Q190 265 174 286 Q154 270 138 289
     Q121 269 102 281 Q91 265 77 267 Z`,
    gradient(context, 133, 47, 225, 290, ["#fffdf1", "#e8e4f4", "#b9b3d4"]),
  );
  shape(context,
    `M98 179 Q106 217 89 257 Q110 246 123 268
     Q136 237 133 211 Q128 237 119 245 Q105 228 111 197 Z`,
    "#d4cee7", 0,
  );
  shape(context, "M230 163 Q240 204 251 244 Q230 235 221 259 Q223 211 216 187 Z", "#c0bad8", 0);
  line(context, "M112 94 Q112 57 148 43 M148 39 Q166 34 181 37", "#ffffff", 6);
  line(context, "M102 173 Q108 194 101 215 M147 224 Q151 253 141 272 M190 219 Q181 251 184 270", "#a49bbd", 2.5);
  line(context, "M107 164 Q120 179 124 190 M218 49 Q235 62 240 80", "#d8d1e7", 3);
  paintFace(context, 188, 119, pose);
  paintPatch(context, 131, 226, -0.14);
  shape(context, "M238 184 Q252 184 262 196 L274 209 L260 226 Q249 212 235 211 Z", "#f9f5ec");
  line(context, "M241 198 Q251 199 261 214", "#c0b7d3", 2.5);
  paintPlayerCandyBasket(context, 274, 257, 68);
  paintHand(context, 273, 218, 0.22);
  context.restore();
}

function paintSlidingChild(context) {
  paintLeg(context, 185, 171, { x: 132, y: 206 }, true);
  paintLeg(context, 214, 178, { x: 269, y: 208 }, false);
  shape(context,
    "M212 130 Q158 115 106 141 Q77 157 56 185 Q82 174 96 194 Q119 183 139 205 Q171 188 201 198 L252 178 Z",
    gradient(context, 78, 147, 189, 204, ["#d2cbe4", "#9287b3"]),
  );
  shape(context,
    `M112 166 Q139 134 182 115 Q184 87 198 64
     C217 29 260 24 287 44 C313 63 320 98 304 127
     Q306 146 322 160 L339 182 Q315 175 308 194
     Q288 180 272 198 Q252 183 235 201 Q215 185 196 198
     Q174 180 155 193 Q137 175 112 181 Z`,
    gradient(context, 212, 45, 264, 202, ["#fffdf1", "#e8e4f4", "#b9b3d4"]),
  );
  shape(context, "M194 130 Q186 159 167 176 Q191 166 204 184 Q224 173 236 187 L225 148 Z", "#d1c9e3", 0);
  line(context, "M209 85 Q216 52 242 44 M247 42 L259 42", "#ffffff", 5.5);
  line(context, "M148 161 Q174 149 188 150 M194 166 L207 185 M288 145 Q290 162 309 175", "#a79bbd", 2.8);
  paintFace(context, 251, 91, "duck");
  paintPatch(context, 224, 157, -0.2);
  shape(context, "M285 150 Q304 151 311 163 L322 173 L311 186 Q298 174 282 176 Z", "#f9f5ec", 3.5);
  paintPlayerCandyBasket(context, 333, 180, 62);
  paintHand(context, 322, 179, 0.2);
}

function paintFace(context, x, y, pose) {
  const expression = pose === "hit" || pose === "dizzy" ? pose : "normal";
  for (const [eyeX, eyeY, radius, tilt] of [[x - 13, y, 12, -0.12], [x + 23, y - 4, 10, 0.12]]) {
    context.save();
    context.translate(eyeX, eyeY);
    context.rotate(tilt);
    ellipse(context, 0, 1, radius + 3, 21, "#bfb5d0");
    shape(context,
      `M${-radius} -14 Q0 -22 ${radius} -14
       Q${radius + 3} -2 ${radius - 1} 9 Q0 24 ${-radius + 1} 10
       Q${-radius - 4} -2 ${-radius} -14 Z`,
      "#211d2b", 0,
    );
    context.restore();
    if (expression === "hit") {
      line(context, `M${eyeX - 6} ${eyeY - 6} L${eyeX + 6} ${eyeY + 6} M${eyeX + 6} ${eyeY - 6} L${eyeX - 6} ${eyeY + 6}`, "#fff4d9", 3);
    } else if (expression === "dizzy") {
      context.beginPath();
      for (let step = 0; step <= 40; step += 1) {
        const angle = step / 40 * Math.PI * 4;
        const distance = 8 * (1 - step / 40);
        const nextX = eyeX + Math.cos(angle) * distance;
        const nextY = eyeY + Math.sin(angle) * distance;
        if (step === 0) context.moveTo(nextX, nextY);
        else context.lineTo(nextX, nextY);
      }
      context.strokeStyle = "#fff4d9";
      context.lineWidth = 2.3;
      context.stroke();
    }
  }
  if (expression === "hit") {
    ellipse(context, x + 8, y + 44, 9, 13, "#211d2b");
  } else if (expression === "dizzy") {
    line(context, `M${x - 5} ${y + 35} Q${x} ${y + 28} ${x + 7} ${y + 36} Q${x + 12} ${y + 43} ${x + 21} ${y + 34}`, INK, 3);
  } else {
    shape(context,
      `M${x - 5} ${y + 27} Q${x + 8} ${y + 21} ${x + 22} ${y + 28}
       Q${x + 31} ${y + 43} ${x + 17} ${y + 57}
       Q${x + 8} ${y + 63} ${x + 2} ${y + 55}
       Q${x - 12} ${y + 46} ${x - 5} ${y + 27} Z`,
      "#211d2b", 2.5, "#9a8aaf",
    );
  }
}

function paintPatch(context, x, y, rotation) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  shape(context, "M-17 -13 L16 -14 L19 12 L-15 15 Z", "#9ccdc6", 2.3, "#617f89");
  line(context, "M-12 -16 L-11 -9 M-3 -17 L-2 -10 M7 -17 L8 -10 M16 -9 L22 -8 M17 1 L23 2 M-12 9 L-12 18 M-2 10 L-1 17 M9 8 L10 16 M-20 -4 L-13 -3 M-19 5 L-12 6", "#f6f0db", 2.3);
  context.restore();
}

function paintHand(context, x, y, angle) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  shape(context, "M-10 -7 Q-4 -12 4 -9 Q10 -10 11 -3 Q17 -4 16 3 Q12 12 3 11 L-10 7 Z", "#ffe2c6", 3);
  line(context, "M4 -3 L8 0 M0 2 L4 5", "#d1a18b", 1.8);
  context.restore();
}

function paintLeg(context, hipX, hipY, foot, behind) {
  const angle = behind && foot.y < 340 ? -0.32 : -0.04;
  const sine = Math.sin(angle);
  const cosine = Math.cos(angle);
  const ankleX = foot.x + sine * 17;
  const ankleY = foot.y - cosine * 17;
  shape(context,
    `M${hipX - 8} ${hipY} Q${(hipX + ankleX) / 2 - 6} ${(hipY + ankleY) / 2} ${ankleX - cosine * 7} ${ankleY - sine * 7}
     L${ankleX + cosine * 7} ${ankleY + sine * 7} Q${(hipX + ankleX) / 2 + 9} ${(hipY + ankleY) / 2} ${hipX + 8} ${hipY + 2} Z`,
    behind ? "#d7bda9" : "#ffe2c6", 3,
  );
  context.save();
  context.translate(foot.x, foot.y);
  context.rotate(angle);
  shape(context, "M-8 -29 L8 -29 L8 -13 L-8 -13 Z", "#496c70", 2.7);
  line(context, "M-7 -25 L7 -25 M-7 -19 L7 -19", "#fff3d7", 2.5);
  shape(context, "M-11 -17 Q-1 -22 9 -17 L12 -11 Q29 -10 29 -1 Q29 7 15 7 L-11 5 Q-17 3 -15 -5 Z", behind ? "#b97044" : "#e99a54", 3.5);
  shape(context, "M12 -11 Q28 -10 29 -1 L14 0 Q8 -3 12 -11 Z", "#fff1d9", 2.4);
  line(context, "M-13 3 L25 4", INK, 3);
  line(context, "M0 -14 L7 -10 M-4 -9 L3 -5", "#fff5df", 2.5);
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

function ellipse(context, x, y, radiusX, radiusY, fill) {
  context.beginPath();
  context.ellipse(x, y, radiusX, radiusY, 0, 0, TWO_PI);
  context.fillStyle = fill;
  context.fill();
}

function gradient(context, x1, y1, x2, y2, colors) {
  const fill = context.createLinearGradient(x1, y1, x2, y2);
  colors.forEach((color, index) => fill.addColorStop(index / (colors.length - 1), color));
  return fill;
}
