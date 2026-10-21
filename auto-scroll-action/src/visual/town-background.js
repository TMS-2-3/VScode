const ART_WIDTH = 1680;
const ART_HEIGHT = 720;
const BAY_WIDTH = 240;
export const TOWN_BACKGROUND_ASPECT_RATIO = ART_WIDTH / ART_HEIGHT;

const fraction = (value) => value - Math.floor(value);
const noise = (x, y, seed = 0) =>
  fraction(Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453);

function verticalGradient(context, top, bottom, stops) {
  const gradient = context.createLinearGradient(0, top, 0, bottom);
  for (const [position, color] of stops) {
    gradient.addColorStop(position, color);
  }
  return gradient;
}

function polygon(context, points, fill, stroke = null, lineWidth = 1) {
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) {
    context.lineTo(points[index][0], points[index][1]);
  }
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.stroke();
  }
}

function ellipse(context, x, y, rx, ry, color) {
  context.beginPath();
  context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
}

function glow(context, x, y, radius, innerColor, outerColor = "rgba(255, 138, 53, 0)") {
  const gradient = context.createRadialGradient(x, y, 2, x, y, radius);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(1, outerColor);
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function repeatAtEdges(callback, x) {
  for (const offset of [-ART_WIDTH, 0, ART_WIDTH]) {
    callback(x + offset);
  }
}

function paintSky(context) {
  context.fillStyle = verticalGradient(context, 0, 255, [
    [0, "#121b57"],
    [0.5, "#343482"],
    [1, "#5a5199"],
  ]);
  context.fillRect(0, 0, ART_WIDTH, 255);

  for (let index = 0; index < 70; index += 1) {
    const x = noise(index, 3) * ART_WIDTH;
    const y = 12 + noise(index, 4) * 170;
    const size = noise(index, 5) > 0.82 ? 1.7 : 0.8;
    ellipse(context, x, y, size, size, "rgba(193, 196, 255, 0.42)");
  }

  const clouds = [
    [130, 72, 0.9], [405, 40, 0.65], [725, 95, 0.8],
    [1080, 45, 1], [1430, 76, 0.8], [1640, 33, 0.7],
  ];
  for (const [x, y, scale] of clouds) {
    repeatAtEdges((cloudX) => paintCloud(context, cloudX, y, scale), x);
  }

  context.fillStyle = verticalGradient(context, 150, 255, [
    [0, "rgba(105, 97, 165, 0)"],
    [1, "rgba(91, 85, 152, 0.64)"],
  ]);
  context.fillRect(0, 150, ART_WIDTH, 105);
}

function paintCloud(context, x, y, scale) {
  const parts = [
    [-75, 10, 48, 17], [-42, -5, 44, 25], [0, -17, 54, 32],
    [44, -5, 50, 24], [82, 13, 45, 16],
  ];
  for (const [dx, dy, rx, ry] of parts) {
    ellipse(
      context,
      x + dx * scale,
      y + dy * scale,
      rx * scale,
      ry * scale,
      "rgba(105, 105, 191, 0.24)",
    );
  }
  ellipse(context, x, y + 18 * scale, 114 * scale, 14 * scale, "rgba(42, 52, 127, 0.18)");
}

function paintDistantTown(context) {
  const buildings = [
    [85, 180, 78, 90], [250, 206, 90, 65], [415, 177, 65, 115],
    [595, 196, 110, 75], [790, 165, 74, 125], [970, 201, 110, 70],
    [1160, 181, 82, 105], [1355, 194, 100, 75], [1560, 174, 68, 118],
  ];

  for (const [x, bottom, width, roofHeight] of buildings) {
    repeatAtEdges(
      (buildingX) => paintDistantBuilding(context, buildingX, bottom, width, roofHeight),
      x,
    );
  }

  const haze = verticalGradient(context, 175, 255, [
    [0, "rgba(95, 91, 165, 0)"],
    [1, "rgba(98, 95, 160, 0.42)"],
  ]);
  context.fillStyle = haze;
  context.fillRect(0, 175, ART_WIDTH, 80);
}

function paintDistantBuilding(context, x, bottom, width, roofHeight) {
  const center = x + width / 2;
  const wallTop = bottom - roofHeight * 0.58;
  context.fillStyle = "#323665";
  context.fillRect(x + 9, wallTop, width - 18, 255 - wallTop);
  polygon(context, [
    [x - 7, wallTop + 5], [center, bottom - roofHeight],
    [x + width + 7, wallTop + 5],
  ], "#222c5d", "#5061a2", 2);
  context.fillStyle = "#1e2a58";
  context.fillRect(center - 2, bottom - roofHeight - 15, 4, 19);
  context.fillRect(center - 9, bottom - roofHeight - 8, 18, 2);
  glow(context, center, wallTop + 23, 27, "rgba(255, 137, 61, 0.35)");
  context.fillStyle = "#ffad5e";
  context.fillRect(center - 3, wallTop + 14, 6, 16);
  context.fillStyle = "#513a60";
  context.fillRect(center - 1, wallTop + 14, 2, 16);
}

function roofOutline(context, x, peakY) {
  context.beginPath();
  context.moveTo(x, 250);
  context.lineTo(x + 24, 222);
  context.lineTo(x + 128, peakY);
  context.lineTo(x + 242, 247);
  context.lineTo(x + 420, 247);
  context.lineTo(x + 420, 252);
  context.closePath();
}

function paintNearRoofs(context) {
  context.fillStyle = "#182654";
  context.fillRect(0, 221, ART_WIDTH, 38);

  for (let block = 0; block < 4; block += 1) {
    const x = block * 420;
    const peakY = [153, 179, 163, 174][block];

    roofOutline(context, x, peakY);
    context.fillStyle = verticalGradient(context, peakY, 252, [
      [0, "#243b75"], [0.55, "#18315f"], [1, "#0d234e"],
    ]);
    context.fill();
    context.strokeStyle = "#6e85b7";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(x + 22, 223);
    context.lineTo(x + 128, peakY);
    context.lineTo(x + 242, 247);
    context.stroke();

    context.save();
    roofOutline(context, x, peakY);
    context.clip();
    for (let row = 0; row < 9; row += 1) {
      const y = 172 + row * 11;
      context.strokeStyle = row % 2 ? "rgba(7, 22, 52, 0.56)" : "rgba(96, 131, 180, 0.36)";
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 420, y);
      context.stroke();
      for (let shingle = 0; shingle < 20; shingle += 1) {
        const shingleX = x + shingle * 23 + (row % 2) * 11;
        context.strokeStyle = "rgba(9, 24, 58, 0.34)";
        context.beginPath();
        context.moveTo(shingleX, y);
        context.lineTo(shingleX - 2, y + 10);
        context.stroke();
      }
    }
    context.restore();

    paintChimney(context, x + 347, 119 + (block % 2) * 15);
    if (block % 2 === 0) {
      paintRoofFence(context, x + 253, x + 337);
    }
  }

  paintEave(context, 246, 18);
}

function paintChimney(context, x, top) {
  context.fillStyle = "#171e46";
  context.fillRect(x - 21, top + 20, 43, 109);
  context.fillStyle = verticalGradient(context, top, top + 129, [
    [0, "#55466b"], [1, "#30294f"],
  ]);
  context.fillRect(x - 17, top + 19, 34, 105);
  context.strokeStyle = "rgba(22, 20, 49, 0.45)";
  for (let row = 0; row < 6; row += 1) {
    const y = top + 31 + row * 17;
    context.beginPath();
    context.moveTo(x - 17, y);
    context.lineTo(x + 17, y);
    context.stroke();
  }
  context.fillStyle = "#1a1e45";
  context.fillRect(x - 23, top + 13, 46, 8);
  context.fillRect(x - 16, top - 2, 32, 17);
  glow(context, x, top + 7, 24, "rgba(255, 129, 45, 0.7)");
  polygon(context, [
    [x - 5, top + 15], [x - 2, top + 4], [x + 1, top - 3],
    [x + 6, top + 14],
  ], "#ff8e37");
  polygon(context, [
    [x - 2, top + 14], [x, top + 5], [x + 2, top + 14],
  ], "#fff0a6");
}

function paintRoofFence(context, startX, endX) {
  context.strokeStyle = "#131c42";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(startX, 218);
  context.lineTo(endX, 218);
  context.stroke();
  for (let x = startX + 5; x < endX; x += 17) {
    polygon(context, [[x - 3, 219], [x, 203], [x + 3, 219]], "#101a40");
  }
}

function paintEave(context, y, height) {
  context.fillStyle = "#121b3f";
  context.fillRect(0, y + height - 1, ART_WIDTH, 9);
  context.fillStyle = verticalGradient(context, y, y + height, [
    [0, "#73b4d0"], [0.25, "#287a9a"],
    [0.6, "#205274"], [1, "#142e53"],
  ]);
  context.fillRect(0, y, ART_WIDTH, height);
  context.strokeStyle = "rgba(8, 39, 73, 0.72)";
  context.lineWidth = 1.5;
  for (let row = 0; row < 2; row += 1) {
    for (let index = 0; index < 70; index += 1) {
      const x = index * 24 + (row % 2) * 12;
      const tileY = y + 2 + row * 8;
      context.strokeRect(x, tileY, 23, 7);
      context.fillStyle = noise(index, row, 14) > 0.7
        ? "rgba(255, 183, 108, 0.22)"
        : "rgba(137, 205, 226, 0.18)";
      context.fillRect(x + 2, tileY + 1, 13, 2);
    }
  }
  context.fillStyle = "rgba(138, 214, 226, 0.48)";
  context.fillRect(0, y, ART_WIDTH, 2);
}

function paintPlaster(context, top, bottom, upperFloor) {
  for (let bay = 0; bay < 7; bay += 1) {
    const x = bay * BAY_WIDTH;
    const warm = bay % 3 === 1;
    context.fillStyle = verticalGradient(context, top, bottom, upperFloor
      ? [[0, warm ? "#ae7e8d" : "#9c7486"], [1, "#765a78"]]
      : [[0, warm ? "#a77885" : "#936c78"], [1, "#6c576b"]]);
    context.fillRect(x, top, BAY_WIDTH, bottom - top);
    context.fillStyle = "rgba(32, 30, 63, 0.16)";
    context.fillRect(x + 8, top, 14, bottom - top);
    context.fillStyle = "rgba(239, 170, 161, 0.1)";
    context.fillRect(x + 37, top + 12, BAY_WIDTH - 75, bottom - top - 20);

    for (let mark = 0; mark < 50; mark += 1) {
      const px = x + 17 + noise(bay, mark, 1) * (BAY_WIDTH - 34);
      const py = top + 10 + noise(bay, mark, 2) * (bottom - top - 20);
      const size = 2 + noise(bay, mark, 3) * 7;
      context.fillStyle = noise(bay, mark, 4) > 0.5
        ? "rgba(56, 42, 73, 0.13)"
        : "rgba(239, 180, 170, 0.12)";
      context.fillRect(px, py, size, 1 + noise(bay, mark, 5) * 2);
    }

    // Small worn patches add texture without occupying space reserved for objects.
    for (let patch = 0; patch < 3; patch += 1) {
      const px = x + 35 + noise(bay, patch, upperFloor ? 11 : 12) * 160;
      const py = top + 25 + noise(bay, patch, upperFloor ? 13 : 14) * (bottom - top - 50);
      context.fillStyle = "rgba(49, 42, 69, 0.17)";
      context.fillRect(px, py, 12, 3);
      context.fillRect(px + 2, py + 4, 5, 3);
    }
  }
}

function paintPillar(context, x, top, bottom) {
  context.fillStyle = "#302a4b";
  context.fillRect(x - 12, top, 24, bottom - top);
  context.fillStyle = verticalGradient(context, top, bottom, [
    [0, "#57435e"], [0.6, "#503a57"], [1, "#382e4e"],
  ]);
  context.fillRect(x - 8, top, 16, bottom - top);
  context.fillStyle = "rgba(177, 131, 128, 0.25)";
  context.fillRect(x - 7, top + 2, 3, bottom - top - 4);
  context.fillStyle = "#262540";
  context.fillRect(x - 16, bottom - 7, 32, 8);
  polygon(context, [[x - 12, top + 18], [x - 36, top], [x - 32, top], [x - 8, top + 10]], "#332b4a");
  polygon(context, [[x + 12, top + 18], [x + 36, top], [x + 32, top], [x + 8, top + 10]], "#332b4a");
}

function paintVines(context, x, top, bottom, seed) {
  context.strokeStyle = "#4a3442";
  context.lineWidth = 2.3;
  context.beginPath();
  context.moveTo(x + 5, bottom);
  for (let step = 0; step <= 15; step += 1) {
    const y = bottom - (bottom - top) * step / 15;
    context.lineTo(x + 5 + Math.sin(step * 0.9 + seed) * 11, y);
  }
  context.stroke();

  for (let leaf = 0; leaf < 24; leaf += 1) {
    const y = bottom - (bottom - top) * (leaf + 0.5) / 24;
    const side = leaf % 2 ? 1 : -1;
    const px = x + 6 + Math.sin(leaf * 0.55 + seed) * 11 + side * 8;
    const leafSize = 3 + noise(seed, leaf, 20) * 3;
    ellipse(context, px, y, leafSize, leafSize * 0.6,
      ["#9c4b25", "#c46a29", "#e1842a", "#6e3e35"][leaf % 4]);
  }
}

function paintUpperFacade(context) {
  paintPlaster(context, 264, 422, true);
  context.fillStyle = "#342b4b";
  context.fillRect(0, 266, ART_WIDTH, 13);
  context.fillStyle = "rgba(184, 132, 125, 0.36)";
  context.fillRect(0, 281, ART_WIDTH, 2);

  for (let column = 0; column <= 7; column += 1) {
    const x = column * BAY_WIDTH;
    paintPillar(context, x, 269, 421);
    paintVines(context, x + 4, 299, 417, column % 7);
  }

  paintEave(context, 420, 20);
}

function paintLantern(context, x, y) {
  glow(context, x, y + 10, 74, "rgba(255, 149, 49, 0.44)");
  context.strokeStyle = "#26233e";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(x, 440);
  context.lineTo(x, y - 15);
  context.stroke();
  polygon(context, [[x - 11, y - 9], [x + 11, y - 9], [x + 8, y + 13], [x, y + 19], [x - 8, y + 13]],
    "#392c42", "#1b203b", 2);
  polygon(context, [[x - 7, y - 5], [x + 7, y - 5], [x + 5, y + 10], [x, y + 15], [x - 5, y + 10]],
    "#ff983b");
  ellipse(context, x, y + 2, 3, 7, "#ffe5a2");
  context.fillStyle = "#26233e";
  context.fillRect(x - 2, y - 10, 4, 27);
  context.fillRect(x - 13, y - 11, 26, 4);
}

function paintLowerFacade(context) {
  paintPlaster(context, 440, 604, false);
  context.fillStyle = "rgba(20, 28, 56, 0.58)";
  context.fillRect(0, 441, ART_WIDTH, 12);

  for (let column = 0; column <= 7; column += 1) {
    const x = column * BAY_WIDTH;
    paintPillar(context, x, 443, 603);
    paintVines(context, x + 5, 497, 594, column % 7 + 9);
    paintLantern(context, x, 477);
  }

  context.fillStyle = "#2e2b45";
  context.fillRect(0, 598, ART_WIDTH, 9);
  context.fillStyle = "#6f667d";
  context.fillRect(0, 605, ART_WIDTH, 6);
  context.fillStyle = "rgba(185, 153, 151, 0.55)";
  context.fillRect(0, 605, ART_WIDTH, 2);
}

function paintRoad(context) {
  context.fillStyle = verticalGradient(context, 610, 720, [
    [0, "#55516c"], [1, "#393752"],
  ]);
  context.fillRect(0, 610, ART_WIDTH, 110);

  for (let row = 0; row < 5; row += 1) {
    const y = 612 + row * 23;
    const shift = row % 2 ? 35 : 0;
    for (let column = -1; column <= 24; column += 1) {
      const wrapped = (column + 24) % 24;
      const x = column * 70 + shift;
      const inset = 2 + noise(wrapped, row, 21) * 2;
      const brightness = noise(wrapped, row, 22);
      const colors = ["#67647e", "#77718a", "#55546f", "#8b7e93", "#5f5c79"];
      polygon(context, [
        [x + inset, y + 3], [x + 64, y + 1],
        [x + 68, y + 17], [x + 60, y + 22],
        [x + 5, y + 21], [x, y + 17],
      ], colors[Math.floor(brightness * colors.length)], "#34334e", 1.4);
      context.strokeStyle = "rgba(187, 178, 196, 0.21)";
      context.beginPath();
      context.moveTo(x + inset + 3, y + 5);
      context.lineTo(x + 59, y + 4);
      context.stroke();
    }
  }

  for (let column = 0; column <= 7; column += 1) {
    const x = column * BAY_WIDTH;
    const reflection = context.createRadialGradient(x, 623, 2, x, 623, 90);
    reflection.addColorStop(0, "rgba(255, 171, 75, 0.46)");
    reflection.addColorStop(0.45, "rgba(255, 141, 56, 0.2)");
    reflection.addColorStop(1, "rgba(255, 141, 56, 0)");
    context.fillStyle = reflection;
    context.fillRect(x - 90, 610, 180, 110);
    for (let streak = 0; streak < 8; streak += 1) {
      const y = 621 + streak * 13;
      const span = 10 + (8 - streak) * 3;
      context.fillStyle = `rgba(255, 176, 91, ${0.15 - streak * 0.01})`;
      context.fillRect(x - span / 2 + (streak % 2) * 5, y, span, 2);
    }
  }
}

export function paintTownBackground(context, tileWidth, height) {
  context.save();
  context.scale(tileWidth / ART_WIDTH, height / ART_HEIGHT);
  context.beginPath();
  context.rect(0, 0, ART_WIDTH, ART_HEIGHT);
  context.clip();
  paintSky(context);
  paintDistantTown(context);
  paintNearRoofs(context);
  paintUpperFacade(context);
  paintLowerFacade(context);
  paintRoad(context);
  context.restore();
}
