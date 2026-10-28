import { OBSTACLE_TYPE } from "../shared/contracts.js";
import {
  normalizeObstacleAppearance,
  OBSTACLE_APPEARANCE as A,
} from "../shared/obstacle-appearances.js";

const INK = "#302438";
const TAU = Math.PI * 2;
const LAYOUTS = Object.freeze({
  [OBSTACLE_TYPE.JUMP]: { width: 120, height: 174, widthScale: 1 },
  [OBSTACLE_TYPE.DUCK]: { width: 120, height: 238, widthScale: 1 },
  [OBSTACLE_TYPE.LANE_BLOCKER]: { width: 120, height: 330, widthScale: 1 },
});
// A sideways barrel overhangs the collision core, like the player's cape and hat.
const FALLEN_BARREL_LAYOUT = { width: 216, height: 174, widthScale: 1.8 };
// The ghost's trailing wisps extend behind its collision core, not toward the player.
const FLOATING_GHOST_LAYOUT = { width: 252, height: 238, widthScale: 2.1 };
const FLYING_WITCH_LAYOUT = { width: 276, height: 238, widthScale: 2.3 };
const FLYING_BAT_LAYOUT = {
  width: 300, height: 238, widthScale: 2.5, frames: 8, frameDuration: 0.075,
};
const SAW_LAYOUTS = Object.freeze({
  [OBSTACLE_TYPE.JUMP]: {
    width: 174, height: 174, widthScale: 1.45,
    blades: [{ x: 87, y: 87, diameter: 168 }],
  },
  [OBSTACLE_TYPE.DUCK]: {
    ...LAYOUTS[OBSTACLE_TYPE.DUCK],
    blades: [{ x: 60, y: 60, diameter: 112 }, { x: 60, y: 178, diameter: 112 }],
  },
  [OBSTACLE_TYPE.LANE_BLOCKER]: {
    ...LAYOUTS[OBSTACLE_TYPE.LANE_BLOCKER],
    blades: [
      { x: 60, y: 56, diameter: 106 },
      { x: 60, y: 165, diameter: 106 },
      { x: 60, y: 274, diameter: 106 },
    ],
  },
});

export function getObstacleArtworkLayout(type, appearance) {
  if (appearance === A.SAW_BLADE) {
    return SAW_LAYOUTS[type];
  }

  if (type === OBSTACLE_TYPE.DUCK && appearance === A.FLOATING_GHOST) {
    return FLOATING_GHOST_LAYOUT;
  }

  if (type === OBSTACLE_TYPE.DUCK && appearance === A.FLYING_WITCH) {
    return FLYING_WITCH_LAYOUT;
  }

  if (type === OBSTACLE_TYPE.DUCK && appearance === A.FLYING_BAT) {
    return FLYING_BAT_LAYOUT;
  }

  return type === OBSTACLE_TYPE.JUMP && appearance === A.FALLEN_BARREL
    ? FALLEN_BARREL_LAYOUT
    : LAYOUTS[type];
}

export function paintObstacleArtwork(context, type, appearance, width, height, isHit = false, frame = 0) {
  const variant = normalizeObstacleAppearance(type, appearance);
  const layout = getObstacleArtworkLayout(type, variant);
  context.save();
  context.scale(width / layout.width, height / layout.height);
  context.lineCap = "round";
  context.lineJoin = "round";
  PAINTERS[variant](context, type, frame);

  if (isHit) {
    context.globalCompositeOperation = "source-atop";
    context.fillStyle = "rgba(255, 204, 107, 0.38)";
    context.fillRect(0, 0, layout.width, layout.height);
  }

  context.restore();
}

function paintPumpkinLantern(c) {
  line(c, "M28 73 C8 22 39 4 65 7 C102 8 114 39 94 73", "#3c3040", 8);
  line(c, "M28 69 C13 24 39 10 64 13 C96 14 104 39 93 66", "#a88b58", 2.5);
  pumpkin(c, 60, 111, 55, 58);
}

function pumpkin(c, x, y, rx, ry, grin = true) {
  c.save();
  c.translate(x, y);
  c.scale(rx / 53, ry / 53);
  shape(c, "M-5 -46 Q-18 -62 -7 -69 Q3 -72 8 -58 L7 -44 Z", "#698342", 3);
  shape(c,
    "M0 -47 C-22 -61 -49 -40 -50 -15 C-62 9 -46 44 -23 46 Q0 59 24 46 C50 47 62 12 51 -13 C52 -40 27 -60 5 -47 Z",
    gradient(c, -37, -42, 33, 43, ["#ffd16d", "#f99834", "#d85a26"]), 4,
  );
  line(c, "M-14 -44 Q-32 -1 -17 44 M13 -44 Q32 -4 19 43", "#ca6027", 3);
  line(c, "M-35 -30 Q-45 -13 -42 1 M-9 -36 Q-13 -25 -12 -17", "#ffe09a", 4);
  if (grin) {
    shape(c, "M-32 -13 L-11 -20 L-14 -1 L-33 -3 Z M12 -20 L33 -13 L32 -3 L14 -1 Z", "#412537", 2);
    shape(c, "M0 -9 L-7 5 L7 5 Z", "#55303a", 1.5);
    shape(c, "M-33 11 L-19 17 L-14 10 L-7 22 L5 22 L13 11 L18 16 L35 6 Q28 38 3 39 Q-20 39 -33 11 Z", "#442632", 2);
    line(c, "M-28 -6 L-17 -10 M18 -10 L29 -7 M-19 27 Q2 42 24 23", "#ffb541", 2.4);
  }
  c.restore();
}

function paintGravestone(c) {
  shape(c, "M14 160 L15 51 Q11 11 55 6 Q101 4 105 44 L104 157 Z", gradient(c, 20, 7, 108, 163, ["#b7b9cb", "#777b98", "#505a76"]), 4);
  shape(c, "M23 151 L24 52 Q21 21 56 17 Q90 13 96 47 L94 151 Z", "#8e95ac", 2, "#59647f");
  line(c, "M29 52 Q27 24 55 23", "#d5d8e1", 3);
  shape(c, "M53 37 L67 37 L67 54 L81 54 L81 67 L67 67 L67 92 L53 92 L53 67 L39 67 L39 54 L53 54 Z", "#59647d", 2);
  line(c, "M56 40 L56 57 L42 57 M70 57 L78 57", "#d1d1dc", 2);
  line(c, "M84 16 L75 30 L85 37 L76 48 M19 115 L35 107 L44 119 L53 113 M83 106 L73 124 L82 135 L73 154", "#515670", 3);
  shape(c, "M7 157 L26 149 L100 151 L114 160 L112 172 L6 172 Z", gradient(c, 10, 152, 103, 174, ["#a7a9ba", "#676e89"]), 3);
  line(c, "M15 163 L104 163", "#c2c4cc", 2);
  line(c, "M32 161 Q25 147 31 133 M27 150 L17 143 M29 146 L38 138", "#608255", 3);
  for (let i = 0; i < 5; i += 1) {
    ellipse(c, 31 + Math.cos(i * TAU / 5) * 6, 131 + Math.sin(i * TAU / 5) * 6, 5, 5, "#e6a44c", 1);
  }
  ellipse(c, 31, 131, 4, 4, "#8a542e", 1);
}

function ghost(c, height, floating) {
  c.save();
  c.scale(1, height / 174);
  shape(c,
    "M16 104 Q-1 83 8 70 Q16 60 25 71 L24 46 Q26 12 58 10 Q97 8 100 48 L99 70 Q115 56 117 72 Q120 89 104 105 L108 137 Q115 163 100 164 L84 150 Q81 172 68 164 L54 151 Q42 177 30 161 L16 168 Q6 168 14 145 Z",
    gradient(c, 15, 18, 106, 161, floating ? ["#b4a3eb", "#8779ce", "#59518b"] : ["#c39bdf", "#976ab7", "#64447e"]), 4,
  );
  line(c, "M34 34 Q39 21 53 22 M20 119 Q17 137 24 143 M93 114 L97 136", "#dccdf4", 3);
  shape(c, "M31 59 L51 67 L47 84 Q28 89 29 73 Z M68 67 L91 57 L92 74 Q86 89 72 83 Z", "#392b52", 2);
  ellipse(c, 41, 73, 4, 7, "#ffeaa4", 0);
  ellipse(c, 81, 71, 4, 7, "#ffeaa4", 0);
  shape(c, "M38 101 Q59 113 83 98 Q82 130 62 132 Q41 131 38 101 Z", "#3e2b50", 2.5);
  shape(c, "M44 107 L51 111 L47 120 Z M69 111 L78 105 L74 119 Z", "#f5e7cf", 0);
  line(c, "M27 91 L33 94 M88 90 L95 86", "#ecbad6", 3);
  line(c, "M27 149 Q24 159 20 162 M62 145 Q58 158 54 160 M94 143 L101 155", "#c7ace4", 2);
  c.restore();
}

function paintFloatingGhost(c) {
  line(c, "M205 40 Q224 35 242 38 M219 108 L247 102 M215 215 Q229 218 241 214", "#c2c7f0", 3);
  shape(c,
    "M72 124 C62 105 65 66 84 43 C105 16 142 13 164 34 C179 47 181 67 191 82 C207 101 226 91 243 78 C237 103 222 120 202 123 C217 138 232 136 246 127 C237 151 218 165 196 162 C207 179 225 185 241 178 C225 203 203 207 181 197 C178 213 190 221 203 223 C179 236 157 229 145 214 C127 236 100 237 84 218 C68 200 69 177 72 163 C60 156 61 139 72 124 Z",
    gradient(c, 83, 42, 220, 222, ["#fbfcff", "#dce7fa", "#9d9cd8", "#7773b7"]), 4,
  );
  shape(c,
    "M157 71 C169 119 163 164 145 198 Q163 207 181 197 Q180 212 190 221 Q163 216 151 203 Q133 229 106 226 C132 210 139 187 141 165 C160 144 167 108 157 71 Z",
    "#b4b5e6", 0,
  );
  shape(c, "M182 105 Q210 121 232 99 Q219 123 199 130 L183 123 Z M179 150 Q203 172 228 157 Q213 177 190 166 Z", "#c7c9ee", 0);
  line(c, "M80 77 C84 48 106 30 127 32 M77 93 L76 103", "#ffffff", 5);
  line(c, "M94 182 Q91 207 108 217 M166 186 Q182 197 198 194", "#e9e9ff", 3);

  // A single large eye and a leading cheek make the left-facing profile readable.
  shape(c, "M79 83 Q90 73 103 81 Q113 94 103 108 Q91 114 80 101 Z", "#443958", 2.5);
  ellipse(c, 90, 94, 7, 10, "#f9f4df", 0);
  ellipse(c, 86, 95, 3.2, 6, "#332d48", 0);
  ellipse(c, 85, 91, 1.4, 2, "#ffffff", 0);
  line(c, "M78 72 Q90 66 103 73", "#6b608b", 3);
  shape(c, "M76 124 Q93 136 115 117 Q111 148 93 147 Q80 143 76 124 Z", "#473754", 2.5);
  shape(c, "M84 132 L90 135 L86 140 Z", "#fff9ec", 0);
  line(c, "M96 139 Q102 137 106 132", "#d59dc2", 3);
  ellipse(c, 115, 112, 9, 5, "#d3b6dc", 0);
  line(c, "M117 108 L122 106 M119 116 L124 114", "#eee0ef", 1.6);

  shape(c, "M115 137 Q126 126 139 132 Q145 137 140 142 L131 141 L139 148 Q139 155 132 154 L122 148 Q125 162 117 164 Q109 163 106 150 Z", "#edf2fc", 2.5, "#7f7ba8");
  line(c, "M112 142 Q119 136 127 136", "#ffffff", 2);
  line(c, "M173 93 Q191 104 209 100 M180 143 Q194 152 206 151 M141 199 Q133 215 122 219", "#8c8fc4", 2.5);
}

function paintFallenBarrel(c) {
  shape(c, "M38 17 Q21 18 13 43 Q-2 83 13 132 Q21 157 41 159 L164 165 Q207 158 210 91 Q209 27 169 14 Z", gradient(c, 15, 14, 31, 162, ["#c69561", "#a57349", "#72503c"]), 4);
  for (const y of [35, 61, 91, 121, 146]) {
    line(c, `M24 ${y} Q89 ${y - 6} 166 ${y + 2}`, "#614435", 2.5);
    line(c, `M28 ${y + 4} Q89 ${y} 157 ${y + 5}`, "#d9aa72", 1.5);
  }
  for (const x of [37, 126]) {
    shape(c, `M${x} 18 L${x + 14} 17 Q${x + 3} 90 ${x + 16} 160 L${x + 2} 159 Q${x - 11} 88 ${x} 18 Z`, gradient(c, x - 5, 50, x + 18, 60, ["#515a6a", "#acb7bb", "#4c5260"]), 2.5);
    for (const y of [37, 86, 138]) ellipse(c, x + 5, y, 2.8, 3.5, "#d6d2bf", 1);
  }
  ellipse(c, 172, 90, 38, 74, "#4e3c35", 3);
  ellipse(c, 172, 90, 30, 64, gradient(c, 145, 30, 193, 146, ["#d0a36b", "#8e603f"]), 2);
  for (const x of [160, 173, 186]) line(c, `M${x} 37 Q${x - 5} 90 ${x} 143`, "#785037", 2);
  line(c, "M155 69 Q168 60 177 70 M166 111 Q175 120 184 113", "#e0b67e", 2);
  ellipse(c, 172, 91, 6, 9, "#6c4836", 2);
}

function paintZombieHand(c) {
  const fingers = [
    [35, 28, 38, 91], [59, 11, 59, 84], [82, 24, 78, 90], [102, 48, 93, 106],
  ];
  for (const [x, y, endX, endY] of fingers) {
    const path = `M${endX} ${endY} Q${x - 5} ${y + 28} ${x} ${y}`;
    line(c, path, INK, 17);
    line(c, path, "#84b66e", 12);
    line(c, `M${x - 2} ${y + 6} L${x - 1} ${y + 13}`, "#d2c18d", 6);
    line(c, `M${x - 4} ${y + 30} L${x + 3} ${y + 29}`, "#486f52", 2);
  }
  shape(c,
    "M38 151 L35 123 Q23 115 17 101 Q8 88 17 82 Q24 78 34 92 L40 99 L40 84 Q66 74 91 91 Q102 105 89 132 L86 156 Z",
    gradient(c, 32, 85, 91, 153, ["#9ac477", "#6f9e65", "#486d55"]), 3.5,
  );
  line(c, "M46 110 Q58 101 72 109 M52 118 Q65 113 77 119 M68 126 L64 145 M31 102 L36 110", "#4e7656", 2.5);
  line(c, "M49 135 L76 140 M52 131 L50 140 M62 133 L60 142 M72 136 L70 145", "#5b3a55", 2);
  shape(c, "M29 146 L46 150 L53 144 L64 151 L77 145 L93 151 L97 169 L28 169 Z", "#55506b", 3);
  line(c, "M39 155 L37 166 M82 157 L86 167", "#92869a", 2);
  shape(c, "M8 171 L15 162 L30 166 L41 163 L55 168 L91 162 L111 169 L115 173 Z", "#7d6a65", 2);
}

function paintSpikedBall(c) {
  for (let index = 0; index < 7; index += 1) {
    const y = 5 + index * 15;
    ellipse(c, 60 + index % 2 * 2, y + 8, index % 2 ? 5 : 8, 11, "#454352", 3);
    ellipse(c, 60 + index % 2 * 2, y + 8, index % 2 ? 1.5 : 4.5, 6, "#b1b3b9", 0);
  }
  for (let index = 0; index < 10; index += 1) {
    const a = index * TAU / 10;
    const x = 60 + Math.cos(a) * 41;
    const y = 176 + Math.sin(a) * 41;
    shape(c, `M${x + Math.sin(a) * 8} ${y - Math.cos(a) * 8} L${60 + Math.cos(a) * 58} ${176 + Math.sin(a) * 59} L${x - Math.sin(a) * 8} ${y + Math.cos(a) * 8} Z`, "#8792a4", 3);
  }
  ellipse(c, 60, 176, 43, 46, gradient(c, 30, 137, 89, 212, ["#aebbc9", "#737d93", "#444d65"]), 4);
  line(c, "M31 159 Q32 145 46 142 M26 175 Q24 183 29 192", "#dae1e3", 4);
  line(c, "M77 143 Q101 176 76 211", "#454c62", 2.5);
  for (const [x, y] of [[49, 155], [79, 172], [48, 196]]) {
    ellipse(c, x, y, 6, 6, "#50596c", 1.8);
    ellipse(c, x - 1, y - 2, 2, 2, "#c6ccd1", 0);
  }
}

function paintHangingBat(c) {
  line(c, "M18 8 L103 8", "#77646b", 7);
  line(c, "M48 12 L45 44 M71 12 L76 44", "#54415b", 6);
  line(c, "M43 6 L39 15 M48 4 L47 16 M69 5 L67 16 M76 5 L77 15", "#d0a784", 3);
  shape(c, "M45 37 Q59 26 76 38 L91 122 Q101 171 85 202 L34 201 Q18 158 31 112 Z", gradient(c, 35, 45, 89, 189, ["#6b577c", "#30283f"]), 4);
  shape(c, "M42 45 Q15 62 4 97 L11 126 L4 151 L16 179 L12 208 Q33 211 56 181 Q40 150 42 45 Z", gradient(c, 8, 65, 57, 195, ["#806688", "#48334f", "#6c4965"]), 3.5);
  shape(c, "M77 45 Q105 65 117 97 L108 125 L116 152 L104 177 L110 207 Q85 211 66 181 Q83 144 77 45 Z", gradient(c, 74, 65, 113, 194, ["#806688", "#48334f", "#6c4965"]), 3.5);
  line(c, "M42 55 L13 121 M42 65 L13 150 M42 83 L23 179 M77 55 L108 120 M77 68 L106 149 M77 87 L96 179", "#a28096", 2);
  shape(c, "M33 179 L24 219 L43 211 Q57 235 77 211 L97 221 L88 177 Q58 160 33 179 Z", "#4c3c5e", 3.5);
  shape(c, "M31 191 L31 208 L42 204 Z M83 189 L89 210 L77 204 Z", "#b77d98", 2);
  ellipse(c, 49, 196, 8, 10, "#f4c16b", 1.5);
  ellipse(c, 75, 196, 8, 10, "#f4c16b", 1.5);
  ellipse(c, 50, 197, 3, 6, "#302438", 0);
  ellipse(c, 74, 197, 3, 6, "#302438", 0);
  shape(c, "M54 210 Q61 205 68 211 L62 218 Z", "#d193a3", 2);
  shape(c, "M47 215 L52 229 L57 216 M67 216 L72 228 L77 214", "#f4e5cf", 1.5);
}

function paintWebSpider(c) {
  const cx = 60;
  const cy = 73;
  for (let index = 0; index < 10; index += 1) {
    const a = -Math.PI / 2 + index * TAU / 10;
    line(c, `M${cx} ${cy} L${cx + Math.cos(a) * 55} ${cy + Math.sin(a) * 68}`, "#d8d2e5", 2.2);
  }
  for (let ring = 1; ring <= 4; ring += 1) {
    const r = ring / 4;
    let path = "";
    for (let index = 0; index <= 10; index += 1) {
      const a = -Math.PI / 2 + index * TAU / 10;
      const x = cx + Math.cos(a) * 55 * r;
      const y = cy + Math.sin(a) * 68 * r;
      if (!index) path = `M${x} ${y}`;
      else {
        const mid = a - TAU / 20;
        path += ` Q${cx + Math.cos(mid) * 46 * r} ${cy + Math.sin(mid) * 56 * r} ${x} ${y}`;
      }
    }
    line(c, path, "#c8c4df", 1.8);
  }
  line(c, "M60 74 L60 164", "#e4ddef", 2.5);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i += 1) {
      const path = `M${60 + side * 17} ${175 + i * 8} L${60 + side * (39 + i * 2)} ${151 + i * 20} L${60 + side * (54 - i * 4)} ${168 + i * 22}`;
      line(c, path, INK, 7);
      line(c, path, "#6b477a", 3.5);
    }
  }
  ellipse(c, 60, 169, 25, 29, gradient(c, 41, 145, 80, 191, ["#a06caa", "#52375e"]), 3);
  shape(c, "M51 151 L60 160 L70 151 L64 172 L55 172 Z", "#e69a4d", 1.5);
  ellipse(c, 60, 201, 25, 23, "#684775", 3);
  ellipse(c, 50, 197, 7, 9, "#ffd584", 1.5);
  ellipse(c, 70, 197, 7, 9, "#ffd584", 1.5);
  ellipse(c, 51, 199, 2.5, 5, INK, 0);
  ellipse(c, 69, 199, 2.5, 5, INK, 0);
  shape(c, "M49 213 L54 228 L59 214 M63 214 L68 228 L73 212", "#f1dfc5", 1.5);
}

function paintZombie(c) {
  shape(c, "M31 215 L60 213 L57 320 L25 323 L25 311 L31 271 Z M65 214 L94 211 L97 311 L107 320 L103 327 L68 325 L67 272 Z", "#4d5376", 3.5);
  line(c, "M43 230 L40 272 L35 306 M80 235 L85 278 L82 307", "#8290a0", 2.5);
  shape(c, "M24 306 L51 306 L55 321 L48 327 L16 327 Q9 321 24 315 Z M75 309 L96 307 L104 316 Q119 325 105 328 L71 327 Z", "#4d3c37", 3);
  shape(c, "M28 92 L12 114 L8 175 L21 184 L32 161 L39 129 L86 128 L91 157 L102 184 L115 175 L109 112 L91 92 Z", "#698177", 3.5);
  shape(c, "M7 171 L19 169 L25 182 L22 202 L15 211 L9 205 L6 212 L2 203 L4 186 Z M101 171 L114 168 L118 194 L114 211 L107 209 L102 213 L99 198 Z", "#91af70", 2.5);
  shape(c, "M31 93 L89 93 L98 193 L91 217 L76 210 L65 224 L50 214 L34 220 L23 198 Z", gradient(c, 28, 102, 88, 219, ["#6b8b7f", "#3c5e5b"]), 4);
  shape(c, "M47 94 L62 112 L77 93 L76 135 L62 147 L45 132 Z", "#d7c2a1", 2.5);
  shape(c, "M60 114 L68 114 L71 168 L60 176 L55 162 Z", "#9d5863", 2);
  shape(c, "M29 162 L46 157 L53 181 L34 185 Z", "#9c7669", 2);
  line(c, "M34 165 L45 178 M46 161 L38 181 M78 186 L86 185 M80 182 L81 190", "#d3b98b", 2);
  shape(c, "M20 41 Q15 10 51 6 Q89 0 103 26 L103 73 Q99 100 69 108 Q33 109 21 82 Z", gradient(c, 27, 17, 96, 99, ["#bed18a", "#86a56c", "#658263"]), 4);
  shape(c, "M18 43 L15 23 L26 14 L36 16 L43 6 L68 5 L77 12 L91 9 L105 24 L105 43 L95 33 L86 41 L76 29 L64 36 L49 27 L37 40 L29 32 Z", "#4c454b", 3);
  ellipse(c, 18, 64, 9, 13, "#8ca971", 2);
  ellipse(c, 102, 62, 8, 12, "#8ca971", 2);
  ellipse(c, 43, 60, 13, 14, "#e4d6b5", 2);
  ellipse(c, 79, 56, 11, 12, "#e4d6b5", 2);
  ellipse(c, 39, 62, 4, 6, "#4e3c4c", 0);
  ellipse(c, 75, 58, 4, 5, "#4e3c4c", 0);
  line(c, "M35 39 L51 43 M70 40 L87 35", "#53634d", 4);
  shape(c, "M45 83 L81 78 L83 92 L51 97 Z", "#4c3b46", 2);
  shape(c, "M52 83 L61 82 L62 90 L53 91 Z M73 84 L80 83 L79 90 L73 91 Z", "#ded0b2", 0);
  line(c, "M29 78 L34 88 M26 83 L36 80 M86 21 L89 35 M81 26 L95 29", "#5b4e53", 2);
}

function paintPumpkinStack(c) {
  pumpkin(c, 60, 274, 55, 50);
  pumpkin(c, 55, 174, 50, 48);
  pumpkin(c, 64, 73, 48, 47);
  line(c, "M13 324 L108 324", "#6d493c", 3);
}

function crate(c, x, y, width, height) {
  c.save();
  c.translate(x, y);
  c.scale(width / 100, height / 100);
  shape(c, "M2 2 L98 2 L98 98 L2 98 Z", gradient(c, 4, 6, 94, 98, ["#bc8b5d", "#8c5c41"]), 3.5);
  for (const xx of [24, 49, 75]) {
    line(c, `M${xx} 10 L${xx} 91`, "#704c3d", 2);
    line(c, `M${xx + 4} 20 Q${xx + 8} 46 ${xx + 4} 73`, "#d0a174", 1.6);
  }
  shape(c, "M2 3 L13 3 L98 87 L98 98 L87 98 L2 14 Z", "#d1a171", 2.5);
  shape(c, "M2 87 L86 3 L98 3 L98 15 L14 98 L2 98 Z", "#bd8b5c", 2.5);
  shape(c, "M3 3 L97 3 L97 13 L3 13 Z M3 87 L97 87 L97 97 L3 97 Z", "#c99b6a", 2.5);
  for (const [xx, yy] of [[9, 8], [90, 8], [9, 92], [90, 92], [49, 49]]) {
    ellipse(c, xx, yy, 2.7, 2.7, "#555460", 1);
    line(c, `M${xx - 1} ${yy - 1} L${xx + 1} ${yy - 1}`, "#c2b8ab", 1);
  }
  c.restore();
}

function paintCrateStack(c) {
  crate(c, 10, 222, 106, 104);
  crate(c, 3, 112, 108, 108);
  crate(c, 13, 6, 100, 104);
  line(c, "M8 119 L8 212 M17 13 L17 101", "#e3bb81", 2);
  line(c, "M94 11 L111 39 M95 12 L98 30 L110 38 M99 16 L109 29", "#d9cad0", 1.6);
  shape(c, "M78 177 L84 167 L91 175 L99 166 L106 178 L94 183 Z", "#655166", 1.5);
}

function barrel(c, x, y, width, height) {
  c.save();
  c.translate(x, y);
  c.scale(width / 100, height / 100);
  const body = new Path2D("M17 13 Q50 0 83 13 Q98 50 84 91 Q51 104 17 91 Q3 52 17 13 Z");
  c.fillStyle = gradient(c, 10, 20, 90, 80, ["#c79762", "#a87548", "#805139"]);
  c.fill(body);
  c.strokeStyle = INK;
  c.lineWidth = 3;
  c.stroke(body);
  c.save();
  c.clip(body);
  for (const xx of [22, 40, 59, 78]) {
    line(c, `M${xx} 10 Q${xx - 8} 50 ${xx} 95`, "#694734", 2);
    line(c, `M${xx + 4} 18 Q${xx - 3} 50 ${xx + 4} 88`, "#dfb37b", 1.5);
  }
  line(c, "M30 42 Q24 48 29 56 M70 50 Q76 56 69 63", "#e0b47c", 1.5);
  for (const yy of [22, 71]) {
    shape(c, `M4 ${yy} Q50 ${yy + 10} 96 ${yy} L96 ${yy + 11} Q50 ${yy + 22} 4 ${yy + 11} Z`, gradient(c, 8, yy, 92, yy + 10, ["#626773", "#b4b8b5", "#555b68"]), 2);
    for (const xx of [20, 50, 80]) ellipse(c, xx, yy + 10, 2, 2.5, "#e0d7bb", 0.8);
  }
  c.restore();
  ellipse(c, 50, 12, 33, 10, "#68606a", 2.5);
  ellipse(c, 50, 11, 27, 6.5, "#bc9466", 1.5);
  line(c, "M29 10 L72 13 M38 6 L64 8", "#74513d", 1.3);
  ellipse(c, 49, 53, 7, 8, "#76503a", 1.5);
  line(c, "M46 50 L51 55", "#d7ad76", 1.5);
  c.restore();
}

function paintBarrelStack(c) {
  barrel(c, 6, 222, 110, 108);
  barrel(c, 2, 113, 108, 114);
  barrel(c, 10, 3, 104, 116);
}

function paintScarecrow(c) {
  line(c, "M60 213 L60 324", "#554239", 15);
  line(c, "M57 216 L57 321", "#bc9562", 4);
  line(c, "M5 121 L114 117", "#74533d", 12);
  shape(c, "M31 98 L14 109 L6 142 L26 155 L37 134 L83 134 L94 154 L115 141 L103 107 L88 98 Z", "#966c55", 3);
  shape(c, "M29 97 L89 96 L95 188 L83 220 L65 214 L48 224 L27 211 L21 184 Z", gradient(c, 28, 103, 92, 212, ["#93966c", "#526c5a"]), 4);
  shape(c, "M31 216 L56 214 L52 279 L30 278 L36 257 Z M66 215 L87 212 L91 279 L69 284 L67 253 Z", "#8b7562", 3);
  for (const [x, y] of [[13, 143], [106, 142], [40, 277], [80, 280]]) {
    line(c, `M${x} ${y - 2} L${x - 7} ${y + 18} M${x} ${y} L${x + 1} ${y + 24} M${x + 2} ${y} L${x + 9} ${y + 18}`, "#d9b36c", 3);
  }
  line(c, "M32 173 L88 173", "#c0a06b", 5);
  shape(c, "M70 137 L87 140 L83 163 L66 160 Z", "#b97563", 2);
  line(c, "M70 145 L84 153 M74 139 L73 163", "#e2c48f", 2);
  ellipse(c, 56, 133, 3.5, 4, "#e7c887", 1.5);
  ellipse(c, 57, 153, 3.5, 4, "#e7c887", 1.5);
  pumpkin(c, 60, 67, 46, 40);
  shape(c, "M20 39 L32 7 L77 5 L98 40 Z", "#624b47", 3.5);
  shape(c, "M27 24 L88 24 L94 38 L22 39 Z", "#b77a46", 2.5);
  shape(c, "M9 38 Q60 30 110 38 L108 48 Q56 56 9 47 Z", "#72574c", 3);
  line(c, "M40 14 L34 24 M76 12 L83 24", "#a48365", 2);
  shape(c, "M43 107 L61 118 L80 105 L82 123 L65 132 L48 125 Z", "#cb8a43", 2.5);
}

function paintMummy(c) {
  shape(c, "M29 108 Q10 109 10 145 L8 202 L20 212 L33 196 L41 148 L81 147 L91 194 L106 207 L117 195 L108 132 Q106 107 87 104 Z", "#aaa9a5", 3.5);
  line(c, "M14 142 L31 148 M12 161 L26 167 M10 180 L23 186 M90 139 L109 133 M94 159 L113 155 M98 181 L115 177", "#eee2c9", 8);
  const body = new Path2D("M37 88 L82 88 Q100 120 93 186 L85 221 L93 302 L106 318 L101 326 L69 325 L62 257 L53 324 L20 325 L16 317 L28 303 L30 224 Q20 184 24 144 Z");
  c.fillStyle = gradient(c, 26, 99, 92, 322, ["#e3d9bf", "#b3b3ad", "#e6dbc2"]);
  c.fill(body);
  c.strokeStyle = INK;
  c.lineWidth = 4;
  c.stroke(body);
  c.save();
  c.clip(body);
  for (let y = 102; y < 330; y += 18) {
    shape(c, `M10 ${y} L110 ${y - 12} L110 ${y + 1} L10 ${y + 14} Z`, y % 36 < 18 ? "#e9dfc7" : "#d3cfbd", 1.8, "#8b9091");
    line(c, `M30 ${y + 3} L48 ${y + 1}`, "#f6ead0", 2);
  }
  c.restore();
  shape(c, "M25 44 Q21 8 58 6 Q100 5 101 43 L96 80 Q88 107 58 105 Q25 101 25 73 Z", gradient(c, 30, 12, 94, 99, ["#eae2cd", "#b6b8ad"]), 4);
  line(c, "M29 28 L94 38 M27 42 L97 51 M30 73 L93 84 M37 90 L80 96 M40 12 L42 29 M71 9 L65 33", "#8b9293", 2);
  shape(c, "M29 48 L96 51 L94 71 L29 67 Z", "#42404a", 2);
  ellipse(c, 45, 59, 7, 6, "#f5c875", 1);
  ellipse(c, 78, 61, 7, 6, "#f5c875", 1);
  ellipse(c, 43, 60, 2.5, 4, "#463544", 0);
  ellipse(c, 76, 62, 2.5, 4, "#463544", 0);
  shape(c, "M29 77 Q8 75 11 103 Q13 128 3 144 L15 150 Q29 128 23 107 Q19 88 36 89 Z", "#dfd6bd", 2.5);
  line(c, "M18 93 Q9 121 10 134", "#929895", 1.5);
  shape(c, "M87 198 Q112 205 105 236 Q95 259 116 272 L111 283 Q84 266 93 239 Q100 217 81 212 Z", "#e0d9c3", 2.5);
  line(c, "M99 218 Q108 242 100 249", "#9da09a", 1.5);
}

function paintSkeleton(c) {
  const bone = (path, width = 7) => {
    line(c, path, INK, width + 4);
    line(c, path, "#ddd9c4", width);
    line(c, path, "#fff4db", Math.max(1.5, width * 0.3));
  };

  bone("M44 228 Q40 247 38 267 M76 228 Q81 247 83 267", 9);
  for (const x of [38, 83]) ellipse(c, x, 269, 7, 7, "#e2ddc6", 2.5);
  bone("M34 278 L29 307 M43 278 L38 309 M78 278 L79 308 M87 277 L92 307", 4.5);
  shape(c, "M27 305 Q36 301 41 308 L43 316 L50 321 L48 326 L18 326 Q11 321 20 317 Z M77 307 Q83 302 93 306 L96 315 L106 320 Q111 326 102 327 L74 326 L72 320 Z", "#e3ddc6", 3);
  line(c, "M23 319 L23 324 M31 318 L31 324 M39 320 L39 325 M84 320 L84 325 M92 319 L92 325 M100 321 L100 325", "#928c8f", 1.5);

  bone("M29 118 L15 162 M92 118 L108 162", 8);
  ellipse(c, 15, 164, 6, 6, "#e8dfc8", 2);
  ellipse(c, 108, 164, 6, 6, "#e8dfc8", 2);
  bone("M12 172 Q17 189 23 201 M20 173 L29 200 M103 172 L94 202 M111 172 Q106 192 101 203", 4);
  for (const [x, direction] of [[25, -1], [97, 1]]) {
    ellipse(c, x, 210, 8, 10, "#e3dec8", 2.5);
    for (let finger = 0; finger < 3; finger += 1) {
      const startX = x - 5 + finger * 5;
      bone(`M${startX} 215 L${startX + direction * 2} ${226 + finger % 2 * 3}`, 2.4);
    }
    bone(`M${x + direction * 7} 207 L${x + direction * 13} 216`, 3);
  }

  for (let y = 104; y < 205; y += 11) {
    ellipse(c, 60, y, 5, 6, "#e2dcc5", 1.8);
  }
  bone("M29 114 Q43 101 57 112 M64 112 Q78 102 93 114", 7);
  for (let row = 0; row < 4; row += 1) {
    const y = 126 + row * 16;
    bone(`M55 ${y} Q36 ${y - 7} 28 ${y + 5} Q30 ${y + 17} 51 ${y + 13}`, 5.5);
    bone(`M65 ${y} Q85 ${y - 7} 93 ${y + 5} Q91 ${y + 17} 69 ${y + 13}`, 5.5);
  }
  bone("M60 118 L60 188", 6);
  shape(c, "M38 194 Q60 205 82 194 L87 211 Q83 229 68 230 L60 220 L52 231 Q35 230 32 211 Z", gradient(c, 36, 196, 81, 228, ["#f3ead1", "#c7c6b8"]), 3);
  ellipse(c, 45, 212, 7, 8, "#69616d", 1.8);
  ellipse(c, 75, 212, 7, 8, "#69616d", 1.8);
  shape(c, "M53 204 L67 204 L64 216 L57 216 Z", "#eee5cc", 1.5);

  shape(c, "M18 40 Q13 11 48 6 Q87 0 101 27 L102 60 Q101 77 85 81 L83 94 Q60 103 36 94 L34 81 Q17 76 18 54 Z", gradient(c, 28, 15, 93, 92, ["#fff4da", "#dedccb", "#b2b6b0"]), 4);
  line(c, "M27 33 Q28 17 45 17 M30 68 L34 73 M87 67 L92 62", "#fff9e9", 3);
  shape(c, "M27 39 Q39 28 53 40 L53 57 Q40 68 29 57 Z M68 38 Q82 28 94 37 L94 55 Q82 66 69 56 Z", "#494252", 2.5);
  ellipse(c, 38, 48, 4.5, 7, "#eac785", 0);
  ellipse(c, 79, 47, 4, 6, "#eac785", 0);
  ellipse(c, 37, 49, 1.8, 4, "#554051", 0);
  ellipse(c, 78, 48, 1.6, 3, "#554051", 0);
  shape(c, "M55 64 Q60 57 65 64 L69 73 L54 73 Z", "#69606a", 1.5);
  shape(c, "M37 79 Q59 86 83 78 L81 93 Q60 101 38 92 Z", "#f0e8d2", 2);
  line(c, "M39 86 Q60 92 81 85 M47 83 L47 94 M58 85 L58 95 M69 84 L69 95 M77 82 L77 92", "#77717b", 1.8);
  line(c, "M74 9 L69 21 L78 27 L72 34 M25 61 L30 65", "#8e8a91", 1.8);
  shape(c, "M45 101 L59 106 L74 100 L74 111 L60 108 L46 113 Z", "#b46c70", 2);
  ellipse(c, 60, 107, 4, 4, "#e6b368", 1.5);
}

function paintFlyingBat(c, frame) {
  const flap = Math.cos(frame * TAU / FLYING_BAT_LAYOUT.frames);
  const tipY = 113 - flap * 92;
  const scallop1 = tipY * 0.72 + 57;
  const scallop2 = tipY * 0.42 + 105;
  const scallop3 = tipY * 0.17 + 143;

  const paintWing = (isFar) => {
    c.save();
    if (isFar) {
      c.translate(24, 9);
      c.scale(0.8, 0.82);
    }
    shape(c,
      `M140 139 C171 110 210 ${tipY + 6} 294 ${tipY} L278 ${tipY + 23} Q263 ${scallop1 - 18} 244 ${scallop1} Q231 ${scallop2 - 14} 213 ${scallop2} Q194 ${scallop3 - 11} 178 ${scallop3} L148 166 Z`,
      gradient(c, 151, 126, 278, tipY, isFar
        ? ["#55415e", "#80617c", "#976e8a"]
        : ["#533d60", "#946989", "#c396ad"]), 3.5,
    );
    line(c, `M147 137 Q213 ${tipY + 25} 287 ${tipY + 4}`, "#e1b9cb", 3);
    line(c, `M149 141 Q204 ${scallop1 - 26} 244 ${scallop1} M149 147 Q190 ${scallop2 - 21} 213 ${scallop2} M150 153 L178 ${scallop3}`, "#493249", 3);
    line(c, `M155 142 Q203 ${scallop1 - 16} 238 ${scallop1 - 2} M155 150 L207 ${scallop2 - 4}`, "#bd91aa", 1.7);
    c.restore();
  };

  paintWing(true);
  shape(c, "M172 157 L224 177 L238 199 L215 194 L203 218 L187 185 Z", "#73526e", 3);
  line(c, "M177 172 L194 202 M166 174 L182 197", INK, 6);
  line(c, "M188 208 L196 202 L203 205 M176 203 L184 197 L192 200", "#d7b7a5", 3);
  shape(c, "M111 124 Q139 109 166 123 Q185 133 190 151 L181 171 Q152 192 123 174 L104 156 Z", gradient(c, 114, 123, 186, 177, ["#90758f", "#5a4868", "#363047"]), 3.5);
  shape(c, "M112 144 Q123 146 135 138 L143 150 L156 157 L143 161 L140 174 L128 164 L115 163 Z", "#cdbcc1", 2);
  line(c, "M120 150 L132 157 M127 159 L137 166", "#f2e3d7", 1.8);
  paintWing(false);

  shape(c, "M80 115 L85 67 L104 96 Q118 89 130 96 L144 67 L150 89 L146 123 Q153 142 135 156 Q119 167 99 158 L87 151 L73 151 Q61 151 64 140 L72 133 Q68 122 80 115 Z", gradient(c, 81, 99, 143, 151, ["#a087a1", "#725b7d", "#493b58"]), 3.5);
  shape(c, "M88 83 L88 108 L99 100 Z M142 81 L134 109 L144 104 Z", "#ce9db5", 2);
  line(c, "M108 103 L117 99 L121 106 L130 105", "#b79ab4", 2);
  shape(c, "M77 119 Q85 108 97 115 Q106 125 97 136 Q86 143 77 134 Z", "#f7db9b", 2);
  ellipse(c, 85, 126, 3.5, 7, "#3b3047", 0);
  ellipse(c, 84, 122, 1.4, 2, "#fff8e0", 0);
  line(c, "M77 108 Q86 103 97 108", "#43324d", 3);
  shape(c, "M73 136 Q64 132 61 139 Q59 145 69 146 L78 142 Z", "#c78ca6", 2);
  shape(c, "M75 150 Q88 158 106 143 Q102 165 87 166 Q78 163 75 150 Z", "#382e46", 2);
  shape(c, "M80 153 L84 162 L88 155 M98 151 L100 158 L103 146", "#fff0d3", 1);
  line(c, "M91 160 L97 156 M111 141 L116 137", "#d7adc2", 2.5);
}

function paintPumpkinPerson(c) {
  shape(c, "M31 216 L57 216 L56 269 L49 312 L23 312 L28 265 Z M64 216 L89 216 L95 266 L99 312 L73 314 L65 266 Z", gradient(c, 29, 224, 88, 307, ["#78966c", "#405f58", "#2e464c"]), 3.5);
  line(c, "M36 230 L35 266 L31 301 M77 230 L83 265 L85 301", "#a8b87e", 2.5);
  shape(c, "M23 303 L48 304 L54 316 Q53 327 38 327 L10 327 Q4 319 18 314 Z M74 305 L96 303 L102 313 Q120 319 111 327 L82 327 Q70 327 70 319 Z", gradient(c, 18, 307, 99, 327, ["#705349", "#40343d"]), 3);
  line(c, "M14 323 L43 323 M81 323 L108 323 M28 310 L40 311 M80 311 L92 310", "#bd9978", 2);

  shape(c, "M31 112 Q15 117 10 142 L7 180 L22 188 L33 162 L39 134 L83 135 L90 164 L101 188 L115 179 L109 139 Q104 115 87 111 Z", gradient(c, 16, 121, 106, 185, ["#ad6377", "#73445e", "#4c394f"]), 3.5);
  shape(c, "M8 173 L24 177 L25 190 L6 188 Z M97 177 L113 173 L117 188 L97 192 Z", "#9ab479", 2.5);
  shape(c, "M8 187 Q18 182 24 191 L23 204 L17 212 L11 205 L7 212 L3 205 L4 194 Z M100 190 Q109 182 115 190 L118 204 L114 213 L108 206 L103 214 L98 205 Z", "#829f67", 2.5);
  line(c, "M10 193 L10 201 M17 194 L17 202 M105 195 L105 203 M112 194 L112 202", "#c0ce91", 1.7);

  shape(c, "M31 112 Q59 101 88 113 L97 166 L91 209 L78 222 L62 215 L46 224 L28 211 L22 169 Z", gradient(c, 28, 123, 89, 215, ["#a85f72", "#70445f", "#49374f"]), 4);
  shape(c, "M39 120 L59 133 L79 118 L81 182 Q62 194 40 183 Z", gradient(c, 44, 132, 78, 181, ["#e8ad65", "#bd7046"]), 2.5);
  line(c, "M49 139 Q44 160 48 176 M67 138 Q74 160 68 179", "#9b573e", 2);
  shape(c, "M27 186 Q62 197 94 185 L92 199 Q62 209 29 199 Z", "#3d3d4a", 2.5);
  shape(c, "M52 190 L71 190 L71 204 L52 204 Z", "#d9b16d", 2);
  shape(c, "M57 194 L66 194 L66 200 L57 200 Z", "#534152", 0);
  ellipse(c, 60, 146, 3.2, 3.5, "#f6d08b", 1.2);
  ellipse(c, 60, 166, 3.2, 3.5, "#f6d08b", 1.2);
  line(c, "M35 211 L45 212 M39 206 L38 217 M77 209 L86 208 M81 204 L82 215", "#c18a87", 1.8);
  shape(c, "M28 109 L44 111 L50 101 L61 113 L74 102 L79 112 L94 108 L89 122 L98 129 L78 131 L69 141 L60 131 L48 141 L40 128 L25 127 L32 119 Z", gradient(c, 34, 106, 87, 136, ["#acc581", "#64895f", "#3f6455"]), 2.5);
  line(c, "M46 117 L53 130 M75 117 L68 130", "#c6d391", 1.7);
  pumpkin(c, 60, 67, 49, 43);
}

function paintJackInTheBox(c) {
  shape(c, "M12 112 L6 90 L45 76 L57 98 Z", gradient(c, 11, 85, 48, 110, ["#b68da7", "#765071", "#47384f"]), 3);
  line(c, "M14 96 L43 85 L48 96 L18 106 Z", "#e4bc78", 2);
  shape(c, "M15 111 L99 108 L112 119 L99 129 L20 129 Z", "#42334f", 3);
  line(c, "M22 116 L95 114", "#bd9ab5", 2);
  const spring = "M60 81 C88 82 90 92 61 95 C34 97 33 103 61 106 C87 108 87 116 60 119";
  line(c, spring, INK, 8);
  line(c, spring, "#a7b6c3", 5);
  line(c, "M63 84 Q84 85 78 89 M42 100 Q36 102 48 104 M69 111 Q85 113 72 116", "#f0e8dc", 1.8);
  line(c, "M44 76 Q33 73 27 82 M79 76 Q91 74 95 83", "#657b8a", 6);
  for (const x of [23, 98]) {
    ellipse(c, x, 81, 9, 8, "#fff0da", 2.5);
    line(c, `M${x - 3} 77 L${x - 2} 81 M${x + 2} 77 L${x + 2} 81`, "#c6a9a6", 1.3);
  }
  shape(c, "M40 74 L49 72 L60 79 L73 73 L83 77 L75 87 L65 84 L56 91 L45 85 Z", "#70a39a", 2.5);
  ellipse(c, 60, 53, 27, 26, gradient(c, 40, 34, 82, 75, ["#fff5d7", "#ead7bc", "#ccb7b3"]), 3);
  shape(c, "M35 39 Q25 18 46 24 Q53 8 63 19 Q82 9 88 25 L83 41 Z", "#b76583", 2.8);
  shape(c, "M46 24 Q53 11 60 17 L61 38 L40 39 Z M65 21 Q78 13 84 22 L78 39 L63 38 Z", "#659990", 2);
  for (const [x, y] of [[29, 19], [59, 10], [89, 21]]) ellipse(c, x, y, 4, 4, "#eac37e", 1.5);
  shape(c, "M34 37 Q60 31 85 37 L84 44 Q60 40 34 44 Z", "#e3b775", 2);
  ellipse(c, 50, 54, 4, 6, "#4d3c51", 0);
  ellipse(c, 70, 54, 4, 6, "#4d3c51", 0);
  ellipse(c, 49, 52, 1.4, 1.8, "#fff8e3", 0);
  ellipse(c, 69, 52, 1.4, 1.8, "#fff8e3", 0);
  ellipse(c, 60, 62, 6, 5, "#d37b77", 1.5);
  ellipse(c, 40, 62, 4, 3, "#dfa2a2", 0);
  ellipse(c, 80, 62, 4, 3, "#dfa2a2", 0);
  line(c, "M49 70 Q60 81 72 69 M45 46 L53 44 M67 44 L75 46", "#795363", 2);

  shape(c, "M98 118 L113 112 L115 164 L99 171 Z", gradient(c, 101, 118, 115, 166, ["#737f91", "#4b4c68"]), 3);
  shape(c, "M15 119 L99 119 L99 171 L15 171 Z", gradient(c, 21, 123, 93, 168, ["#9f7799", "#785a84", "#534261"]), 3);
  for (const x of [27, 64]) shape(c, `M${x} 124 L${x + 10} 124 L${x + 10} 164 L${x} 164 Z`, "#b78ba6", 0);
  shape(c, "M15 119 L99 119 L99 127 L15 127 Z M15 163 L99 163 L99 171 L15 171 Z", "#dfb471", 2);
  shape(c, "M57 130 L62 140 L74 142 L65 150 L67 161 L57 156 L47 161 L49 150 L40 142 L52 140 Z", "#f5d793", 2);
  line(c, "M58 135 L60 143 L68 144", "#fff0c2", 1.5);
  line(c, "M109 147 L115 142 L114 133", INK, 4);
  ellipse(c, 114, 131, 4, 5, "#d88c84", 1.8);
  for (const [x, y] of [[20, 123], [94, 123], [20, 167], [94, 167]]) ellipse(c, x, y, 1.7, 1.7, "#705454", 0);
}

function paintCauldron(c) {
  line(c, "M28 162 L23 171 M90 160 L96 171", INK, 9);
  line(c, "M28 161 L25 167 M90 160 L94 167", "#6b8491", 3);
  for (const x of [13, 107]) {
    ellipse(c, x, 91, 9, 16, "#303d4d", 3);
    ellipse(c, x, 91, 4, 9, "#a5b8b8", 1.5);
  }
  shape(c, "M12 66 Q6 102 20 143 Q31 165 61 165 Q96 165 107 139 Q119 100 108 66 Z", gradient(c, 19, 73, 107, 155, ["#7d9f9e", "#3a5863", "#202e43"]), 4);
  line(c, "M23 88 Q18 121 34 142 M29 153 Q58 170 87 153", "#9cb8b6", 3);
  ellipse(c, 60, 67, 54, 16, "#273747", 4);
  ellipse(c, 60, 64, 47, 10, gradient(c, 19, 57, 99, 69, ["#e9c3fc", "#bc7cdd", "#8c4ab8"]), 2);
  shape(c, "M28 65 Q35 58 42 65 L43 87 Q42 94 36 92 L35 73 Q28 80 28 65 Z M76 63 Q84 56 91 64 L88 102 Q84 109 80 101 L82 75 Q73 77 76 63 Z", "#d699ef", 2, "#9d65bd");
  line(c, "M20 70 Q23 83 23 95 M101 73 L101 86", "#d3e0db", 2.5);
  ellipse(c, 60, 126, 19, 20, "#d09b51", 2.5);
  ellipse(c, 60, 126, 14, 15, "#503f56", 1.5);
  shape(c, "M59 115 L62 122 L70 123 L64 129 L66 137 L59 133 L52 137 L54 129 L48 124 L56 122 Z", "#f0cd79", 0);
  for (const [x, y, r] of [[31, 40, 7], [77, 29, 9], [52, 15, 5], [95, 47, 5]]) {
    ellipse(c, x, y, r, r, "#d5a6ee", 1.8);
    ellipse(c, x - r * 0.25, y - r * 0.3, r * 0.3, r * 0.23, "#fbecff", 0);
  }
  line(c, "M48 53 Q57 45 52 38 M65 48 Q60 38 65 31", "#e8c6f5", 2.5);
  line(c, "M13 66 Q18 57 30 55 M86 54 L102 58", "#d2e0d5", 2);
}

function paintCoffin(c) {
  shape(c, "M34 5 L87 5 L113 64 L99 326 L22 326 L6 65 Z", gradient(c, 15, 19, 109, 318, ["#a17963", "#67505c", "#403648"]), 4);
  shape(c, "M82 15 L102 67 L90 313 L67 313 L76 70 Z", "#252536", 2);
  ellipse(c, 86, 119, 5, 8, "#f6cf77", 0);
  ellipse(c, 96, 117, 4, 7, "#f6cf77", 0);
  line(c, "M84 114 L87 123 M95 113 L95 121", "#ad643e", 2);
  shape(c, "M34 14 L77 14 L94 68 L79 313 L27 313 L16 68 Z", gradient(c, 25, 20, 88, 302, ["#9c6f62", "#694d5a", "#493d50"]), 3.5);
  line(c, "M37 23 L73 23 L84 70 L70 302 L35 302 L25 71 Z", "#c49870", 2.5);
  line(c, "M46 29 L44 83 L47 133 M62 29 L60 85 L63 132 M39 193 L43 292 M62 200 L59 292", "#433448", 2);
  line(c, "M49 39 L49 73 M35 99 Q40 110 36 126 M63 231 Q57 249 62 263 M71 83 L69 103", "#ba8770", 1.7);
  shape(c, "M51 140 L63 140 L62 157 L75 158 L74 169 L62 169 L60 196 L48 195 L50 168 L37 168 L37 157 L50 157 Z", gradient(c, 38, 140, 68, 195, ["#e9c280", "#ac7d50"]), 2);
  line(c, "M54 144 L53 160 L41 160 M54 172 L53 190", "#fae2a9", 1.5);
  for (const y of [77, 253]) {
    shape(c, `M12 ${y} L26 ${y + 1} L27 ${y + 15} L13 ${y + 14} Z`, "#b6a078", 2);
    ellipse(c, 18, y + 7, 2, 2, "#e9d3a2", 0);
  }
  shape(c, "M78 201 L92 201 L91 224 L77 224 Z", "#aa8d64", 2);
  ellipse(c, 84, 209, 3, 3, "#3d3344", 0);
  line(c, "M84 211 L83 217", "#3d3344", 2);
  for (const [x, y] of [[34, 20], [76, 20], [23, 69], [31, 305], [75, 305]]) {
    ellipse(c, x, y, 2, 2, "#e4bf86", 1);
  }
  line(c, "M26 321 L94 321", "#b08b72", 2);
}

function paintFlyingWitch(c) {
  line(c, "M229 72 L268 67 M238 112 L271 108 M235 155 L264 160", "#bbb8d9", 2.5);
  shape(c, "M114 117 Q154 109 172 135 Q190 149 220 147 L204 167 L228 176 Q198 192 169 181 L152 199 L111 181 Z", gradient(c, 123, 120, 207, 183, ["#709d91", "#3f726d", "#304956"]), 3.5);
  line(c, "M151 131 Q167 160 198 165 M153 151 L165 176", "#a1c4ac", 2.5);
  shape(c, "M118 176 L147 178 L144 203 L123 211 L109 203 Z M139 180 L162 184 L160 210 L145 219 L130 213 Z", "#5b4564", 3);
  line(c, "M124 188 L139 190 M141 198 L155 201", "#ce9b89", 6);
  shape(c, "M109 201 L124 205 L126 215 Q112 229 91 224 L90 216 L109 211 Z M143 210 L158 211 L162 223 Q152 235 133 232 L125 226 Z", "#423443", 3);
  line(c, "M96 220 L112 221 M134 228 L148 228", "#c5a080", 2);
  line(c, "M20 211 Q126 198 237 209", INK, 9);
  line(c, "M20 210 Q126 198 237 208", "#b68952", 4);
  shape(c, "M214 196 Q241 188 269 199 L259 207 L272 214 L259 219 L265 230 Q239 237 211 220 Z", gradient(c, 215, 195, 265, 229, ["#e6bf76", "#ba844b", "#8c5e3d"]), 3);
  for (const y of [201, 209, 218, 225]) line(c, `M224 ${y} Q244 ${y - 3} 259 ${y + 2}`, "#946637", 1.6);
  shape(c, "M211 198 L222 197 L223 222 L212 220 Z", "#9a5363", 2);
  line(c, "M215 200 L217 220", "#e1aa7d", 2);
  shape(c, "M106 116 Q130 111 144 134 L155 178 Q133 193 108 178 L98 149 Z", "#42666a", 3.5);
  shape(c, "M102 124 Q94 124 89 141 L82 175 L96 179 L112 145 Z", "#54857f", 3);
  shape(c, "M80 169 Q70 167 68 176 Q67 185 78 187 L91 182 L92 174 Z", "#d9d4b4", 2.5);
  line(c, "M75 178 L83 180", "#ae927f", 1.5);
  shape(c, "M88 68 Q110 53 133 74 L138 108 L149 128 L128 130 L121 145 L107 132 L91 134 L93 117 L80 100 Z", "#8d798c", 3);
  shape(c, "M91 72 Q117 65 122 88 L119 111 Q112 126 93 126 L80 118 L69 119 Q61 118 69 110 L76 101 Q72 86 91 72 Z", gradient(c, 78, 76, 117, 121, ["#f0dfbd", "#d6caa7", "#b4b393"]), 3);
  shape(c, "M91 77 Q101 91 91 103 L101 102 L108 90 L112 111 L122 108 L128 86 L116 72 Z", "#8d798c", 2);
  ellipse(c, 85, 100, 5, 7, "#fff4d9", 1.4);
  ellipse(c, 83, 101, 2.2, 4, INK, 0);
  line(c, "M79 90 L91 88 M77 114 Q86 119 94 113", "#54404d", 2.5);
  ellipse(c, 102, 111, 5, 3, "#d39d98", 0);
  shape(c, "M77 66 L99 30 Q119 8 154 8 L139 22 L129 28 L141 71 Z", gradient(c, 90, 25, 146, 70, ["#67536c", "#3e354e", "#302d40"]), 3.5);
  shape(c, "M83 53 L132 49 L139 66 L76 72 Z", "#aa6075", 2);
  shape(c, "M96 54 L112 53 L114 66 L98 67 Z", "#dcaf68", 2);
  shape(c, "M101 57 L108 57 L109 63 L102 63 Z", "#65465e", 0);
  shape(c, "M49 70 Q97 57 158 68 Q171 73 152 80 Q97 87 52 80 Q38 77 49 70 Z", "#41354f", 3.5);
  line(c, "M58 73 Q105 63 144 72", "#8a6b84", 2);
  shape(c, "M104 126 L117 133 L131 125 L133 138 L119 145 L107 138 Z", "#cc9e60", 2);
  ellipse(c, 121, 156, 3, 3, "#e5c186", 1);
}

export function paintSawBladeArtwork(c, width, height, isHit = false) {
  c.save();
  c.scale(width / 120, height / 120);
  c.translate(60, 60);
  c.lineCap = "round";
  c.lineJoin = "round";
  const teeth = new Path2D();
  for (let index = 0; index < 20; index += 1) {
    for (const [offset, radius] of [[0, 46], [0.38, 56], [0.62, 53], [0.95, 46]]) {
      const angle = (index + offset) * TAU / 20;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0 && offset === 0) teeth.moveTo(x, y);
      else teeth.lineTo(x, y);
    }
  }
  teeth.closePath();
  c.fillStyle = gradient(c, -36, -42, 38, 46, ["#fff2b4", "#d6b56a", "#a1844c"]);
  c.fill(teeth);
  c.strokeStyle = INK;
  c.lineWidth = 2.4;
  c.stroke(teeth);
  ellipse(c, 0, 0, 44, 44, gradient(c, -31, -35, 34, 35, ["#93b3a8", "#50777a", "#2d4958"]), 2);
  c.strokeStyle = "#b9cbc0";
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(0, 0, 40, -Math.PI * 0.95, -Math.PI * 0.2);
  c.stroke();
  for (let index = 0; index < 6; index += 1) {
    c.save();
    c.rotate(index * TAU / 6);
    line(c, "M20 -25 Q31 -21 34 -10", "#263d4d", 2.5);
    line(c, "M22 -28 Q34 -22 36 -12", "#9eb7ab", 1.1);
    ellipse(c, 27, 4, 2, 2, "#d5c998", 1);
    c.restore();
  }
  ellipse(c, 0, 0, 22, 22, "#dfb873", 2.2);
  ellipse(c, 0, 0, 18, 18, gradient(c, -13, -14, 14, 16, ["#ffb077", "#d9564e", "#913f51"]), 1.8);
  line(c, "M-11 -9 Q-6 -15 2 -13", "#ffd8ac", 2.5);
  ellipse(c, 0, 1, 8, 8, "#394454", 2);
  line(c, "M-4 -1 L4 3", "#e0bd78", 3.5);

  if (isHit) {
    c.globalCompositeOperation = "source-atop";
    c.fillStyle = "rgba(255, 204, 107, 0.38)";
    c.fillRect(-60, -60, 120, 120);
  }
  c.restore();
}

function paintSawObstacle(c, type) {
  const artwork = SAW_LAYOUTS[type];
  artwork.blades.forEach((blade) => {
    c.save();
    c.translate(blade.x - blade.diameter / 2, blade.y - blade.diameter / 2);
    paintSawBladeArtwork(c, blade.diameter, blade.diameter);
    c.restore();
  });
}

function shape(c, data, fill, width = 3, stroke = INK) {
  const path = new Path2D(data);
  c.fillStyle = fill;
  c.fill(path);
  if (width > 0) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke(path);
  }
}

function line(c, data, color, width) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke(new Path2D(data));
}

function ellipse(c, x, y, rx, ry, fill, width = 2) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, TAU);
  c.fillStyle = fill;
  c.fill();
  if (width > 0) {
    c.strokeStyle = INK;
    c.lineWidth = width;
    c.stroke();
  }
}

function gradient(c, x1, y1, x2, y2, colors) {
  const fill = c.createLinearGradient(x1, y1, x2, y2);
  colors.forEach((color, index) => fill.addColorStop(index / (colors.length - 1), color));
  return fill;
}

const PAINTERS = {
  [A.PUMPKIN_LANTERN]: paintPumpkinLantern,
  [A.GRAVESTONE]: paintGravestone,
  [A.LOW_GHOST]: (c) => ghost(c, 174, false),
  [A.FALLEN_BARREL]: paintFallenBarrel,
  [A.ZOMBIE_HAND]: paintZombieHand,
  [A.CAULDRON]: paintCauldron,
  [A.JACK_IN_THE_BOX]: paintJackInTheBox,
  [A.FLOATING_GHOST]: paintFloatingGhost,
  [A.SPIKED_BALL]: paintSpikedBall,
  [A.HANGING_BAT]: paintHangingBat,
  [A.WEB_SPIDER]: paintWebSpider,
  [A.FLYING_WITCH]: paintFlyingWitch,
  [A.FLYING_BAT]: (c, type, frame) => paintFlyingBat(c, frame),
  [A.ZOMBIE]: paintZombie,
  [A.PUMPKIN_STACK]: paintPumpkinStack,
  [A.CRATE_STACK]: paintCrateStack,
  [A.BARREL]: paintBarrelStack,
  [A.SCARECROW]: paintScarecrow,
  [A.MUMMY]: paintMummy,
  [A.COFFIN]: paintCoffin,
  [A.SKELETON]: paintSkeleton,
  [A.PUMPKIN_PERSON]: paintPumpkinPerson,
  [A.SAW_BLADE]: paintSawObstacle,
};
