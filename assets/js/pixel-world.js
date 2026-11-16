// =============================================================================
// Lei Liu — 16-bit Pixel Overworld Engine (Pure Canvas Tilemap + Sprite Engine)
// Resolution: 256 x 144 (16:9 widescreen retro game canvas)
// Features:
//   - Auto Day/Night cycle from local clock (06:00-17:59 Sun / 18:00-05:59 Moon)
//   - Distinct pixel character outfit, headwear & prop per stage
//   - Interactive walking (A/D or click ground), jumping (W), and landmarks
// =============================================================================
(function () {
  var W = 256;
  var H = 144;
  var timeOverride = null; // null = auto from local clock, or "day" / "night"

  var DAY_PAL = {
    sky0: "#5ca0ee",
    sky1: "#70b2f6",
    sky2: "#8bc5fb",
    sky3: "#aad9fe",
    sky4: "#cbe9ff",
    sky5: "#e6f5ff",
    sunCore: "#fffbe0",
    sunMid: "#ffe478",
    cloudHi: "#ffffff",
    cloudMid: "#e3f1ff",
    cloudSh: "#bad7f5",
    mtFar: "#9abde8",
    mtFarHi: "#b4d2f5",
    mtMid: "#7ea5d8",
    mtMidHi: "#9bc0ec",
    mist: "rgba(235, 246, 255, 0.65)",
    grassHi: "#92e252",
    grassMid: "#62be38",
    grassSh: "#3e8d25",
    grassDark: "#296418",
    dirtHi: "#c78652",
    dirtMid: "#9c6238",
    dirtSh: "#6e4223",
    dirtDark: "#4a2a15",
    stoneHi: "#d4dce8",
    stoneMid: "#9aa6ba",
    stoneSh: "#677287",
    woodHi: "#d89c60",
    woodMid: "#a66d3b",
    woodSh: "#704523",
    roofHi: "#5c96eb",
    roofMid: "#3b6fd4",
    roofSh: "#244794",
    wallHi: "#fff9eb",
    wallMid: "#ead8b8",
    wallSh: "#c7b08b",
    waterHi: "#ffffff",
    waterLt: "#9beaff",
    waterMid: "#4ec9ff",
    waterDk: "#268fd9",
    goldHi: "#fff7a6",
    goldMid: "#ffd24a",
    goldSh: "#d48d1b",
    redHi: "#ff6b7a",
    redMid: "#e0384b",
    outline: "#232c4d",
    skinHi: "#ffe0c2",
    leafHi: "#7ed94c",
    leafMid: "#4fa82e",
    leafSh: "#2f701c"
  };

  var NIGHT_PAL = {
    sky0: "#0f1733",
    sky1: "#162147",
    sky2: "#1d2b59",
    sky3: "#25376e",
    sky4: "#2f4480",
    sky5: "#3b5291",
    sunCore: "#fff8d6",
    sunMid: "#ffe082",
    cloudHi: "#5268a1",
    cloudMid: "#3d5185",
    cloudSh: "#2b3b66",
    mtFar: "#273869",
    mtFarHi: "#374d87",
    mtMid: "#1e2c54",
    mtMidHi: "#2d4073",
    mist: "rgba(45, 65, 118, 0.55)",
    grassHi: "#488f4a",
    grassMid: "#2e6b38",
    grassSh: "#1d4a28",
    grassDark: "#12301b",
    dirtHi: "#7d553a",
    dirtMid: "#5c3c27",
    dirtSh: "#3d2618",
    dirtDark: "#26160d",
    stoneHi: "#7c88a6",
    stoneMid: "#57627d",
    stoneSh: "#394259",
    woodHi: "#946842",
    woodMid: "#6b472b",
    woodSh: "#472c18",
    roofHi: "#36569c",
    roofMid: "#253e78",
    roofSh: "#182954",
    wallHi: "#bfc8db",
    wallMid: "#949fb8",
    wallSh: "#6c7791",
    waterHi: "#b8e6ff",
    waterLt: "#579fd6",
    waterMid: "#2c6ca3",
    waterDk: "#19436e",
    goldHi: "#fff7a6",
    goldMid: "#ffd24a",
    goldSh: "#d48d1b",
    redHi: "#ff6b7a",
    redMid: "#e0384b",
    outline: "#11162b",
    skinHi: "#f2cba8",
    leafHi: "#397a46",
    leafMid: "#245733",
    leafSh: "#163822"
  };

  function isNightTime() {
    if (timeOverride === "night") return true;
    if (timeOverride === "day") return false;
    var h = new Date().getHours();
    return h >= 18 || h < 6;
  }

  function getPal() {
    return isNightTime() ? NIGHT_PAL : DAY_PAL;
  }

  function syncBodyNightClass(night) {
    if (document.body) {
      document.body.classList.toggle("is-night", !!night);
    }
  }

  function px(ctx, x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  }

  function drawDitherBand(ctx, y, colA, colB) {
    px(ctx, 0, y, W, 2, colA);
    ctx.fillStyle = colB;
    for (var x = 0; x < W; x += 2) {
      ctx.fillRect(x, y, 1, 1);
      ctx.fillRect(x + 1, y + 1, 1, 1);
    }
  }

  var STARS = [
    [14, 12], [28, 28], [48, 10], [66, 22], [84, 14], [104, 30], [122, 8],
    [144, 18], [168, 11], [192, 26], [214, 14], [238, 22], [36, 44], [96, 46],
    [156, 38], [202, 44], [244, 42], [56, 36], [134, 24], [178, 34]
  ];

  // 1. Sky + Sun/Moon + Stars
  function drawSky(ctx, tick, scene, PAL, night) {
    var bands = [
      [0, 18, PAL.sky0],
      [18, 22, PAL.sky1],
      [40, 24, PAL.sky2],
      [64, 24, PAL.sky3],
      [88, 24, PAL.sky4],
      [112, 32, PAL.sky5]
    ];
    for (var i = 0; i < bands.length; i++) {
      px(ctx, 0, bands[i][0], W, bands[i][1], bands[i][2]);
    }
    drawDitherBand(ctx, 17, PAL.sky0, PAL.sky1);
    drawDitherBand(ctx, 39, PAL.sky1, PAL.sky2);
    drawDitherBand(ctx, 63, PAL.sky2, PAL.sky3);
    drawDitherBand(ctx, 87, PAL.sky3, PAL.sky4);
    drawDitherBand(ctx, 111, PAL.sky4, PAL.sky5);

    var sx = scene === "home" ? 156 : 44;
    var sy = 22;
    var pulse = (tick >> 2) % 2;

    if (night) {
      // Twinkling Stars
      for (var s = 0; s < STARS.length; s++) {
        var st = STARS[s];
        var twinkle = ((tick >> 2) + s) % 5;
        if (twinkle === 0) {
          px(ctx, st[0], st[1], 1, 1, "#9ab6f5");
        } else {
          px(ctx, st[0], st[1], 1, 1, "#fffbe0");
          if (s % 4 === 0 && twinkle === 2) {
            px(ctx, st[0] - 1, st[1], 3, 1, "rgba(255,251,224,0.45)");
            px(ctx, st[0], st[1] - 1, 1, 3, "rgba(255,251,224,0.45)");
          }
        }
      }
      // Glowing Pixel Crescent Moon (drawn directly without rectangular sky cutout)
      px(ctx, sx - 8 - pulse, sy - 8 - pulse, 16 + pulse * 2, 16 + pulse * 2, "rgba(190, 215, 255, 0.14)");
      px(ctx, sx - 4, sy - 6, 7, 2, PAL.sunMid);
      px(ctx, sx - 6, sy - 4, 5, 2, PAL.sunMid);
      px(ctx, sx - 7, sy - 2, 4, 4, PAL.sunMid);
      px(ctx, sx - 6, sy + 2, 5, 2, PAL.sunMid);
      px(ctx, sx - 4, sy + 4, 7, 2, PAL.sunMid);
      // Inner bright core of crescent
      px(ctx, sx - 3, sy - 5, 5, 1, PAL.sunCore);
      px(ctx, sx - 5, sy - 4, 3, 2, PAL.sunCore);
      px(ctx, sx - 6, sy - 2, 3, 4, PAL.sunCore);
      px(ctx, sx - 5, sy + 2, 3, 2, PAL.sunCore);
      px(ctx, sx - 3, sy + 4, 5, 1, PAL.sunCore);
    } else {
      // Glowing Pixel Sun
      px(ctx, sx - 9 - pulse, sy - 9 - pulse, 18 + pulse * 2, 18 + pulse * 2, "rgba(255, 238, 150, 0.28)");
      px(ctx, sx - 7, sy - 5, 14, 10, PAL.sunMid);
      px(ctx, sx - 5, sy - 7, 10, 14, PAL.sunMid);
      px(ctx, sx - 5, sy - 5, 10, 10, PAL.sunCore);
      if (pulse === 0) {
        px(ctx, sx, sy - 10, 1, 2, PAL.sunCore);
        px(ctx, sx, sy + 9, 1, 2, PAL.sunCore);
        px(ctx, sx - 10, sy, 2, 1, PAL.sunCore);
        px(ctx, sx + 9, sy, 2, 1, PAL.sunCore);
      }
    }
  }

  function drawCloud(ctx, x, y, w, h, PAL) {
    var cx = ((x % (W + 60)) + (W + 60)) % (W + 60) - 30;
    px(ctx, cx + 2, y + h - 3, w - 4, 3, PAL.cloudSh);
    px(ctx, cx, y + 3, w, h - 5, PAL.cloudMid);
    px(ctx, cx + 3, y + 1, w - 6, h - 4, PAL.cloudHi);
    px(ctx, cx + 6, y - 2, Math.max(6, (w * 0.45) | 0), 4, PAL.cloudHi);
    px(ctx, cx + ((w * 0.42) | 0), y - 4, Math.max(8, (w * 0.38) | 0), 6, PAL.cloudHi);
    px(ctx, cx + 1, y + 3, w - 2, 2, PAL.cloudHi);
  }

  // 2. Distant Layered Pixel Mountains
  function drawMountains(ctx, tick, PAL, night) {
    var farPeaks = [
      [0, 102], [22, 82], [46, 98], [76, 70], [108, 95],
      [138, 74], [170, 94], [204, 68], [236, 88], [256, 98]
    ];
    for (var x = 0; x < W; x += 2) {
      var seg = 0;
      while (seg < farPeaks.length - 2 && x > farPeaks[seg + 1][0]) seg++;
      var x0 = farPeaks[seg][0], y0 = farPeaks[seg][1];
      var x1 = farPeaks[seg + 1][0], y1 = farPeaks[seg + 1][1];
      var t = (x - x0) / Math.max(1, x1 - x0);
      var my = ((y0 + (y1 - y0) * t) / 2 | 0) * 2;
      px(ctx, x, my, 2, 128 - my, PAL.mtFar);
      if (y1 < y0 && my < 86) {
        px(ctx, x, my, 2, 6, PAL.mtFarHi);
      }
    }

    var nearPeaks = [
      [0, 110], [32, 88], [62, 106], [96, 84], [128, 108],
      [162, 86], [194, 106], [224, 90], [256, 106]
    ];
    for (var nx = 0; nx < W; nx += 2) {
      var nseg = 0;
      while (nseg < nearPeaks.length - 2 && nx > nearPeaks[nseg + 1][0]) nseg++;
      var nx0 = nearPeaks[nseg][0], ny0 = nearPeaks[nseg][1];
      var nx1 = nearPeaks[nseg + 1][0], ny1 = nearPeaks[nseg + 1][1];
      var nt = (nx - nx0) / Math.max(1, nx1 - nx0);
      var nmy = ((ny0 + (ny1 - ny0) * nt) / 2 | 0) * 2;
      px(ctx, nx, nmy, 2, 132 - nmy, PAL.mtMid);
      if (ny1 < ny0) {
        px(ctx, nx, nmy, 2, 4, PAL.mtMidHi);
      }
    }

    px(ctx, 0, 112, W, 6, PAL.mist);
    px(ctx, 0, 118, W, 8, PAL.mist);

    var drift = (tick * 0.25) | 0;
    drawCloud(ctx, 14 + drift, 20, 36, 11, PAL);
    drawCloud(ctx, 88 + ((drift * 0.7) | 0), 32, 44, 12, PAL);
    drawCloud(ctx, 182 + drift, 18, 38, 11, PAL);
    drawCloud(ctx, 138 + ((drift * 0.5) | 0), 52, 30, 9, PAL);

    if (!night) {
      var bx = (210 - ((tick >> 1) % 220) + W) % W;
      var flap = (tick >> 2) % 2;
      px(ctx, bx, 36 + flap, 2, 1, PAL.outline);
      px(ctx, bx + 2, 37, 1, 1, PAL.outline);
      px(ctx, bx + 3, 36 + flap, 2, 1, PAL.outline);

      px(ctx, bx + 12, 32 + (1 - flap), 2, 1, PAL.outline);
      px(ctx, bx + 14, 33, 1, 1, PAL.outline);
      px(ctx, bx + 15, 32 + (1 - flap), 2, 1, PAL.outline);
    }
  }

  function drawTree(ctx, x, y, scale, tick, PAL) {
    var sway = ((tick >> 4) + x) % 2 === 0 ? 0 : 1;
    var s = scale || 1;
    px(ctx, x - 2 * s, y - 7 * s, 4 * s, 7 * s, PAL.woodSh);
    px(ctx, x - 1 * s, y - 7 * s, 2 * s, 7 * s, PAL.woodMid);
    px(ctx, x - 8 * s + sway, y - 14 * s, 16 * s, 8 * s, PAL.leafSh);
    px(ctx, x - 7 * s + sway, y - 18 * s, 14 * s, 9 * s, PAL.leafMid);
    px(ctx, x - 5 * s + sway, y - 21 * s, 10 * s, 6 * s, PAL.leafHi);
    px(ctx, x - 6 * s + sway, y - 16 * s, 5 * s, 3 * s, PAL.leafHi);
  }

  function drawFloatingIsland(ctx, x, y, w, h, tick, hasWaterfall, PAL) {
    var bob = ((tick >> 3) + (x >> 3)) % 2;
    var iy = y + bob;
    for (var row = 0; row < h; row += 2) {
      var ratio = 1 - row / h;
      var rw = Math.max(4, (w * ratio) | 0);
      var rx = x + ((w - rw) >> 1);
      px(ctx, rx, iy + 4 + row, rw, 2, row > h * 0.55 ? PAL.dirtDark : PAL.dirtSh);
      if (rw > 6) {
        px(ctx, rx + 2, iy + 4 + row, (rw * 0.45) | 0, 2, PAL.dirtMid);
      }
    }
    px(ctx, x - 1, iy, w + 2, 3, PAL.grassHi);
    px(ctx, x, iy + 2, w, 3, PAL.grassMid);
    for (var gx = x + 1; gx < x + w - 1; gx += 4) {
      px(ctx, gx, iy + 4, 2, 2, PAL.grassSh);
    }

    if (hasWaterfall) {
      var wx = x + ((w * 0.55) | 0);
      var wy = iy + 3;
      var wh = 44;
      px(ctx, wx, wy, 7, wh, PAL.waterMid);
      px(ctx, wx + 1, wy, 2, wh, PAL.waterLt);
      for (var fy = 0; fy < wh; fy += 4) {
        var dy = (fy + (tick & 3)) % wh;
        px(ctx, wx + 1, wy + dy, 4, 2, PAL.waterHi);
      }
      var mist = tick % 3;
      px(ctx, wx - 3 - mist, wy + wh - 2, 13 + mist * 2, 3, PAL.cloudHi);
      px(ctx, wx - 1, wy + wh + 1, 9, 2, PAL.waterLt);
    }
  }

  function drawSkyCastle(ctx, x, y, tick, PAL) {
    var bob = (tick >> 3) % 2;
    var cy = y + bob;

    px(ctx, x + 6, cy - 22, 10, 22, PAL.wallMid);
    px(ctx, x + 7, cy - 22, 5, 22, PAL.wallHi);
    for (var r = 0; r < 8; r++) {
      px(ctx, x + 5 + r, cy - 23 - r, 12 - r * 2, 1, r < 4 ? PAL.roofMid : PAL.roofHi);
    }
    px(ctx, x + 36, cy - 24, 10, 24, PAL.wallSh);
    px(ctx, x + 37, cy - 24, 5, 24, PAL.wallMid);
    for (var rr = 0; rr < 8; rr++) {
      px(ctx, x + 35 + rr, cy - 25 - rr, 12 - rr * 2, 1, PAL.roofMid);
    }

    px(ctx, x + 15, cy - 34, 22, 34, PAL.wallMid);
    px(ctx, x + 16, cy - 34, 12, 34, PAL.wallHi);
    for (var bx = x + 14; bx < x + 38; bx += 4) {
      px(ctx, bx, cy - 36, 2, 2, PAL.wallHi);
    }
    for (var sr = 0; sr < 13; sr++) {
      px(ctx, x + 14 + sr, cy - 36 - sr, 24 - sr * 2, 1, sr % 2 === 0 ? PAL.roofHi : PAL.roofMid);
    }
    var fx = x + 25;
    var fy = cy - 53;
    px(ctx, fx, fy, 1, 6, PAL.goldMid);
    var wave = (tick >> 1) % 2;
    px(ctx, fx + 1, fy + 1, 6, 3, PAL.redMid);
    px(ctx, fx + 4, fy + 1 + wave, 3, 2, PAL.redHi);

    px(ctx, x + 23, cy - 10, 6, 10, PAL.dirtDark);
    px(ctx, x + 24, cy - 11, 4, 2, PAL.dirtDark);
    px(ctx, x + 21, cy - 26, 3, 5, PAL.goldMid);
    px(ctx, x + 28, cy - 26, 3, 5, PAL.goldMid);
    px(ctx, x + 10, cy - 15, 2, 4, PAL.goldMid);
    px(ctx, x + 40, cy - 16, 2, 4, PAL.goldMid);

    drawTree(ctx, x + 4, cy, 1, tick, PAL);
    drawTree(ctx, x + 49, cy, 1, tick, PAL);
    drawFloatingIsland(ctx, x - 4, cy, 60, 26, tick, true, PAL);
  }

  function drawForegroundTerrain(ctx, tick, scene, PAL, night) {
    px(ctx, 0, 126, W, 18, PAL.waterDk);
    px(ctx, 0, 126, W, 5, PAL.waterMid);
    for (var wx = 78; wx < 138; wx += 8) {
      var shimmer = (wx + (tick & 7)) % 12;
      px(ctx, wx + shimmer, 129, 5, 1, PAL.waterHi);
      px(ctx, wx + 2, 135, 6, 1, PAL.waterLt);
    }

    px(ctx, 0, 120, 90, 24, PAL.dirtMid);
    px(ctx, 0, 126, 86, 18, PAL.dirtSh);
    for (var dx = 6; dx < 82; dx += 14) {
      px(ctx, dx, 125, 6, 4, PAL.dirtHi);
      px(ctx, dx + 5, 132, 7, 4, PAL.dirtDark);
    }
    px(ctx, 0, 116, 92, 3, PAL.grassHi);
    px(ctx, 0, 119, 91, 3, PAL.grassMid);
    for (var gx = 2; gx < 90; gx += 5) {
      px(ctx, gx, 122, 3, 2, PAL.grassSh);
    }

    var rY = scene === "home" ? 120 : 116;
    px(ctx, 126, rY + 2, 130, 144 - rY, PAL.dirtMid);
    px(ctx, 130, rY + 8, 126, 144 - rY - 8, PAL.dirtSh);
    for (var rdx = 134; rdx < 248; rdx += 16) {
      px(ctx, rdx, rY + 6, 7, 4, PAL.dirtHi);
      px(ctx, rdx + 6, rY + 13, 8, 4, PAL.dirtDark);
    }
    px(ctx, 124, rY - 2, 132, 3, PAL.grassHi);
    px(ctx, 125, rY + 1, 131, 3, PAL.grassMid);
    for (var rgx = 126; rgx < 254; rgx += 5) {
      px(ctx, rgx, rY + 4, 3, 2, PAL.grassSh);
    }

    px(ctx, 88, 118, 3, 10, PAL.woodSh);
    px(ctx, 125, 118, 3, 10, PAL.woodSh);
    px(ctx, 89, 121, 38, 2, PAL.woodSh);
    for (var bp = 90; bp < 126; bp += 4) {
      var arch = (bp > 98 && bp < 118) ? -1 : 0;
      px(ctx, bp, 119 + arch, 3, 2, PAL.woodHi);
      px(ctx, bp + 1, 115 + arch, 1, 4, PAL.woodMid);
    }
    px(ctx, 89, 115, 38, 1, PAL.woodHi);

    drawTree(ctx, 12, 116, 1, tick, PAL);
    var flowers = [[26, 114, PAL.redHi], [31, 115, PAL.goldMid], [74, 115, PAL.waterHi], [142, rY - 3, PAL.goldMid], [242, rY - 3, PAL.redHi]];
    for (var f = 0; f < flowers.length; f++) {
      px(ctx, flowers[f][0], flowers[f][1], 2, 2, flowers[f][2]);
      px(ctx, flowers[f][0], flowers[f][1] + 2, 1, 1, PAL.grassDark);
    }

    // Night fireflies drifting above meadow & bridge
    if (night) {
      var flies = [[34, 106], [68, 100], [108, 108], [148, 104], [218, 102]];
      for (var fl = 0; fl < flies.length; fl++) {
        var fx = flies[fl][0] + (((tick >> 2) + fl * 3) % 5) - 2;
        var fy = flies[fl][1] + (((tick >> 1) + fl) % 4) - 2;
        if (((tick >> 1) + fl) % 3 !== 0) {
          px(ctx, fx, fy, 2, 2, "rgba(255, 240, 120, 0.35)");
          px(ctx, fx, fy, 1, 1, "#fff7a6");
        }
      }
    }
  }

  function drawScholarCottage(ctx, x, y, tick, lampLit, PAL, night) {
    px(ctx, x, y - 4, 48, 4, PAL.stoneSh);
    px(ctx, x + 2, y - 3, 44, 2, PAL.stoneMid);
    px(ctx, x + 2, y - 24, 44, 20, PAL.wallHi);
    px(ctx, x + 2, y - 24, 3, 20, PAL.woodSh);
    px(ctx, x + 43, y - 24, 3, 20, PAL.woodSh);
    px(ctx, x + 22, y - 24, 3, 20, PAL.woodSh);
    px(ctx, x + 2, y - 14, 44, 2, PAL.woodSh);

    px(ctx, x + 36, y - 40, 6, 14, PAL.stoneMid);
    px(ctx, x + 35, y - 41, 8, 2, PAL.stoneHi);
    var sOffset = (tick >> 1) % 10;
    px(ctx, x + 37 + (sOffset >> 2), y - 44 - sOffset, 4, 3, PAL.cloudHi);
    px(ctx, x + 39 + (sOffset >> 1), y - 49 - sOffset, 5, 4, night ? "rgba(180,200,240,0.45)" : "rgba(255,255,255,0.75)");

    for (var r = 0; r < 14; r++) {
      px(ctx, x - 3 + r, y - 24 - r, 54 - r * 2, 2, r % 3 === 0 ? PAL.roofHi : PAL.roofMid);
    }
    px(ctx, x - 3, y - 24, 54, 2, PAL.roofSh);

    px(ctx, x + 9, y - 12, 8, 12, PAL.woodMid);
    px(ctx, x + 10, y - 11, 6, 11, PAL.woodSh);
    px(ctx, x + 14, y - 6, 1, 1, PAL.goldMid);

    var lit = lampLit !== false;
    var winCol = lit ? PAL.goldMid : "#5b7099";
    var winHi = lit ? PAL.goldHi : "#7c94bf";
    if (night && lit) {
      px(ctx, x + 26, y - 14, 15, 12, "rgba(255, 210, 74, 0.25)");
    }
    px(ctx, x + 28, y - 12, 11, 8, PAL.woodSh);
    px(ctx, x + 29, y - 11, 9, 6, winCol);
    px(ctx, x + 30, y - 10, 3, 2, winHi);
    px(ctx, x + 33, y - 11, 1, 6, PAL.woodSh);
    px(ctx, x + 29, y - 8, 9, 1, PAL.woodSh);
  }

  function drawTreasureScene(ctx, x, y, tick, chestOpen, PAL) {
    px(ctx, x, y - 10, 16, 10, PAL.woodMid);
    px(ctx, x, y - 10, 16, 4, chestOpen ? PAL.goldHi : PAL.woodHi);
    px(ctx, x, y - 6, 16, 2, PAL.goldMid);
    px(ctx, x + 6, y - 7, 4, 4, PAL.goldHi);
    px(ctx, x - 1, y - 11, 18, 1, PAL.outline);

    var coins = [[x - 14, y - 22], [x + 4, y - 28], [x + 22, y - 20]];
    for (var i = 0; i < coins.length; i++) {
      var cx = coins[i][0];
      var cy = coins[i][1] + (((tick >> 1) + i) % 3) - 1;
      var wide = ((tick >> 1) + i) % 2 === 0;
      if (wide) {
        px(ctx, cx, cy, 6, 6, PAL.goldMid);
        px(ctx, cx + 1, cy + 1, 2, 4, PAL.goldHi);
      } else {
        px(ctx, cx + 2, cy, 2, 6, PAL.goldHi);
      }
    }
  }

  function drawCampsite(ctx, x, y, tick, fireBoost, PAL, night) {
    for (var r = 0; r < 18; r++) {
      var tw = 36 - r * 2;
      var tx = x + 22 + r;
      var ty = y - 1 - r;
      px(ctx, tx, ty, tw, 1, r % 3 === 0 ? PAL.woodHi : PAL.woodMid);
    }
    for (var dr = 0; dr < 10; dr++) {
      px(ctx, x + 34 + dr, y - 1 - dr, Math.max(2, 12 - dr * 2), 1, PAL.dirtDark);
    }
    var wave = (tick >> 1) % 2;
    px(ctx, x + 39, y - 24, 1, 6, PAL.woodSh);
    px(ctx, x + 40, y - 24 + wave, 7, 4, PAL.redMid);
    px(ctx, x + 41, y - 23 + wave, 2, 2, PAL.cloudHi);

    var fx = x + 4;
    var fy = y;
    if (night) {
      px(ctx, fx - 12, fy - 14, 26, 16, "rgba(255, 170, 60, 0.22)");
    }
    px(ctx, fx - 5, fy - 2, 12, 2, PAL.woodSh);
    px(ctx, fx - 6, fy - 1, 3, 2, PAL.stoneMid);
    px(ctx, fx + 5, fy - 1, 3, 2, PAL.stoneMid);
    var fH = (fireBoost ? 11 : 7) + (tick % 3);
    px(ctx, fx - 3, fy - fH, 8, fH - 1, PAL.redHi);
    px(ctx, fx - 2, fy - fH + 2, 6, fH - 3, PAL.goldMid);
    px(ctx, fx - 1, fy - 5, 4, 3, PAL.sunCore);
    var sparkY = fy - fH - 2 - (tick % 8);
    px(ctx, fx + ((tick >> 1) % 3) - 1, sparkY, 1, 1, PAL.goldHi);
    px(ctx, fx + 2 - (tick % 3), sparkY - 3, 1, 1, PAL.redHi);

    var sx = x + 64;
    px(ctx, sx, y - 12, 2, 12, PAL.woodSh);
    px(ctx, sx - 6, y - 13, 14, 6, PAL.woodHi);
    px(ctx, sx - 5, y - 12, 12, 4, PAL.wallHi);
    px(ctx, sx - 4, y - 11, 9, 1, PAL.woodSh);
    px(ctx, sx - 4, y - 9, 6, 1, PAL.woodSh);
  }

  // Distinct Character Outfits & Props per Stage
  function drawHeroAndCat(ctx, state, tick, PAL) {
    var x = state.heroX | 0;
    var y = state.heroY | 0;
    var sc = state.scene;
    var sitting = sc === "contact" && !state.walking && state.jumpY === 0;
    var bob = state.walking ? (tick % 2) : ((tick >> 2) % 2);
    var hy = y - (state.jumpY | 0);
    var dir = state.dir;

    // Ground shadow
    px(ctx, x - 5, y - 1, 10, 2, "rgba(25, 60, 18, 0.45)");

    // Hair & Head
    px(ctx, x - 4, hy - 19 + bob, 8, 3, PAL.outline);
    px(ctx, x - 5, hy - 17 + bob, 10, 3, "#2f3b66");
    px(ctx, x - 4, hy - 14 + bob, 8, 5, PAL.skinHi);

    // Eyes
    var eyeX = dir < 0 ? x - 3 : x - 1;
    px(ctx, eyeX, hy - 13 + bob, 1, 2, PAL.outline);
    px(ctx, eyeX + 3, hy - 13 + bob, 1, 2, PAL.outline);

    // Stage-specific Headwear / Glasses / Goggles
    if (sc === "about") {
      // Square Scholar Mortarboard Cap + Gold Tassel + Glasses
      px(ctx, x - 6, hy - 21 + bob, 12, 2, "#1c2442");
      px(ctx, x - 4, hy - 22 + bob, 8, 1, "#2f3e73");
      px(ctx, x + 5, hy - 19 + bob, 1, 4, PAL.goldMid);
      px(ctx, eyeX - 1, hy - 13 + bob, 2, 2, "#4ec9ff");
      px(ctx, eyeX + 2, hy - 13 + bob, 2, 2, "#4ec9ff");
      px(ctx, eyeX + 1, hy - 13 + bob, 1, 1, PAL.goldMid);
    } else if (sc === "research") {
      // Glowing Cyan Optical Goggles on forehead
      px(ctx, x - 5, hy - 17 + bob, 10, 2, "#394870");
      px(ctx, x - 3, hy - 17 + bob, 3, 2, "#7ce4ff");
      px(ctx, x + 1, hy - 17 + bob, 3, 2, "#7ce4ff");
    } else if (sc === "gallery") {
      // Photographer Beret Cap
      px(ctx, x - 5, hy - 20 + bob, 10, 3, "#c93b4b");
      px(ctx, x - 3, hy - 21 + bob, 6, 1, "#ff6b7a");
    } else if (sc === "contact") {
      // Cozy knit beanie
      px(ctx, x - 5, hy - 20 + bob, 10, 3, "#e88835");
      px(ctx, x - 2, hy - 22 + bob, 4, 2, "#ffd24a");
    }

    // Stage-specific Outfit & Held Prop
    var frontX = dir < 0 ? x - 6 : x + 4;
    if (sc === "about") {
      // Indigo Scholar Robe + Gold Sash + Held Scroll
      px(ctx, x - 4, hy - 9 + bob, 8, 7, "#2a3c7a");
      px(ctx, x - 3, hy - 9 + bob, 6, 2, PAL.goldMid);
      px(ctx, x - 1, hy - 7 + bob, 2, 5, PAL.goldHi);
      // Scroll in hand
      px(ctx, frontX, hy - 8 + bob, 3, 4, "#fff6e0");
      px(ctx, frontX, hy - 9 + bob, 3, 1, PAL.goldSh);
    } else if (sc === "research") {
      // White Lab Coat + Teal Shirt + Glowing Cyan Spectral Flask
      px(ctx, x - 4, hy - 9 + bob, 8, 7, "#f0f5ff");
      px(ctx, x - 2, hy - 9 + bob, 4, 6, "#2c99b8");
      // Glowing flask
      px(ctx, frontX, hy - 8 + bob, 3, 4, "#4ec9ff");
      px(ctx, frontX + 1, hy - 10 + bob, 1, 2, "#ffffff");
      if ((tick >> 1) % 2 === 0) {
        px(ctx, frontX + 1, hy - 12 + bob, 1, 1, "#9beaff");
      }
    } else if (sc === "gallery") {
      // Forest-Green Explorer Jacket + Camera with flash
      px(ctx, x - 4, hy - 9 + bob, 8, 6, "#3a8f4d");
      px(ctx, x - 3, hy - 9 + bob, 2, 6, "#d48d1b");
      // Pixel Camera
      px(ctx, frontX, hy - 8 + bob, 4, 3, "#232c4d");
      px(ctx, frontX + 1, hy - 7 + bob, 2, 2, "#7ce4ff");
      if (tick % 16 === 0) {
        px(ctx, frontX, hy - 10 + bob, 3, 2, "#ffffff");
      }
    } else if (sc === "contact") {
      // Warm Amber Camp Sweater + Steaming Mug
      px(ctx, x - 4, hy - 9 + bob, 8, 6, "#d97538");
      px(ctx, x - 4, hy - 9 + bob, 8, 2, "#ffd24a");
      // Mug
      px(ctx, frontX, hy - 7 + bob, 3, 3, "#fff6e0");
      px(ctx, frontX + 1, hy - 9 - (tick % 3), 1, 2, "rgba(255,255,255,0.7)");
    } else {
      // Stage 1 Home: Explorer Blue Tunic + Yellow Scarf + Backpack + Compass
      var packX = dir < 0 ? x + 3 : x - 6;
      px(ctx, packX, hy - 9 + bob, 3, 6, PAL.woodMid);
      px(ctx, packX, hy - 9 + bob, 3, 2, PAL.woodHi);
      px(ctx, x - 4, hy - 9 + bob, 8, 6, PAL.roofMid);
      px(ctx, x - 4, hy - 9 + bob, 8, 2, PAL.goldMid);
      px(ctx, frontX, hy - 7 + bob, 3, 3, PAL.goldHi);
    }

    // Legs / Boots
    if (sitting) {
      px(ctx, x - 3, hy - 3, 8, 3, PAL.dirtDark);
    } else {
      var step = state.walking ? ((tick % 4) - 1) : 0;
      px(ctx, x - 3 + step, hy - 3, 2, 3, PAL.outline);
      px(ctx, x + 1 - step, hy - 3, 2, 3, PAL.outline);
    }

    // Companion White Cat (with stage-themed collar/accessory)
    var cx = state.catX | 0;
    var cy = y - ((state.jumpY * 0.6) | 0);
    var tailWag = (tick >> 1) % 2;
    px(ctx, cx - 3, cy - 1, 7, 1, "rgba(25, 60, 18, 0.4)");
    px(ctx, cx - 3, cy - 8, 2, 2, PAL.cloudHi);
    px(ctx, cx + 2, cy - 8, 2, 2, PAL.cloudHi);
    px(ctx, cx - 2, cy - 7, 1, 1, PAL.redHi);
    px(ctx, cx + 2, cy - 7, 1, 1, PAL.redHi);
    px(ctx, cx - 3, cy - 6, 7, 6, PAL.cloudHi);
    px(ctx, cx - 3, cy - 2, 7, 2, PAL.cloudMid);
    // Collar color changes by stage
    var collarCol = sc === "about" ? "#3b6fd4" : sc === "research" ? "#4ec9ff" : sc === "gallery" ? "#ffd24a" : "#ff6b7a";
    px(ctx, cx - 2, cy - 3, 5, 1, collarCol);
    px(ctx, cx - 2, cy - 5, 1, 1, PAL.outline);
    px(ctx, cx + 2, cy - 5, 1, 1, PAL.outline);
    px(ctx, cx, cy - 4, 1, 1, PAL.redHi);
    px(ctx, cx + 4, cy - 4 - tailWag, 2, 3, PAL.cloudHi);

    // Emote bubble above hero/cat
    if (state.emoteTimer > 0 || sc === "contact") {
      var bx = x + 3;
      var by = hy - 28 - ((tick >> 2) % 2);
      px(ctx, bx - 4, by - 5, 9, 7, "#ffffff");
      px(ctx, bx - 3, by - 6, 7, 9, "#ffffff");
      px(ctx, bx - 2, by + 3, 2, 1, "#ffffff");
      px(ctx, bx - 2, by - 4, 2, 2, PAL.redMid);
      px(ctx, bx + 1, by - 4, 2, 2, PAL.redMid);
      px(ctx, bx - 2, by - 2, 5, 2, PAL.redMid);
      px(ctx, bx - 1, by, 3, 1, PAL.redMid);
      px(ctx, bx, by + 1, 1, 1, PAL.redMid);
    }
  }

  function renderScene(ctx, state, tick) {
    var scene = state.scene;
    var night = isNightTime();
    var PAL = getPal();

    drawSky(ctx, tick, scene, PAL, night);
    drawMountains(ctx, tick, PAL, night);

    drawFloatingIsland(ctx, 20, 62, 26, 12, tick, false, PAL);
    drawTree(ctx, 32, 62 + ((tick >> 3) % 2), 1, tick, PAL);

    if (scene === "home") {
      drawFloatingIsland(ctx, 114, 54, 28, 12, tick, false, PAL);
      drawTree(ctx, 128, 54 + ((tick >> 3) % 2), 1, tick, PAL);
      drawSkyCastle(ctx, 182, 78, tick, PAL);
    } else if (scene === "about") {
      drawFloatingIsland(ctx, 198, 44, 32, 14, tick, true, PAL);
    } else if (scene === "research") {
      drawFloatingIsland(ctx, 206, 48, 30, 13, tick, false, PAL);
    } else if (scene === "gallery") {
      drawSkyCastle(ctx, 194, 68, tick, PAL);
    } else if (scene === "contact") {
      drawFloatingIsland(ctx, 192, 46, 30, 12, tick, false, PAL);
    }

    drawForegroundTerrain(ctx, tick, scene, PAL, night);

    if (scene === "home") {
      px(ctx, 72, 105, 2, 11, PAL.woodSh);
      px(ctx, 66, 104, 14, 6, PAL.woodHi);
      px(ctx, 67, 105, 12, 4, PAL.wallHi);
      px(ctx, 69, 106, 8, 1, PAL.woodSh);
      px(ctx, 69, 108, 6, 1, PAL.woodSh);
    } else if (scene === "about") {
      drawScholarCottage(ctx, 184, 116, tick, state.lampLit, PAL, night);
      drawTree(ctx, 242, 116, 1, tick, PAL);
    } else if (scene === "research") {
      drawTree(ctx, 236, 116, 1, tick, PAL);
      drawTreasureScene(ctx, 198, 116, tick, state.chestOpen, PAL);
    } else if (scene === "gallery") {
      drawTreasureScene(ctx, 202, 116, tick, state.chestOpen, PAL);
      drawTree(ctx, 240, 116, 1, tick, PAL);
    } else if (scene === "contact") {
      drawCampsite(ctx, 162, 116, tick, state.fireBoost > 0, PAL, night);
    }

    drawHeroAndCat(ctx, state, tick, PAL);
  }

  var worlds = [];
  var keys = { left: false, right: false };

  function initCanvases() {
    var nodes = document.querySelectorAll("canvas.px-world-canvas");
    worlds = [];
    for (var i = 0; i < nodes.length; i++) {
      var c = nodes[i];
      c.width = W;
      c.height = H;
      var sc = c.getAttribute("data-scene") || "home";
      var defaultX = sc === "about" ? 148 : sc === "research" ? 54 : sc === "contact" ? 56 : 42;
      worlds.push({
        canvas: c,
        ctx: c.getContext("2d"),
        scene: sc,
        heroX: defaultX,
        heroY: 116,
        targetX: defaultX,
        catX: defaultX + 13,
        dir: 1,
        walking: false,
        jumpY: 0,
        jumpV: 0,
        emoteTimer: 0,
        lampLit: true,
        chestOpen: false,
        fireBoost: 0
      });
    }
    syncBodyNightClass(isNightTime());
  }

  window.addEventListener("keydown", function (ev) {
    var tag = (ev.target && ev.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (ev.key === "a" || ev.key === "A" || ev.key === "ArrowLeft") keys.left = true;
    if (ev.key === "d" || ev.key === "D" || ev.key === "ArrowRight") keys.right = true;
    if (ev.key === "w" || ev.key === "W") {
      for (var i = 0; i < worlds.length; i++) {
        if (worlds[i].jumpY === 0) worlds[i].jumpV = 5;
      }
    }
  });

  window.addEventListener("keyup", function (ev) {
    if (ev.key === "a" || ev.key === "A" || ev.key === "ArrowLeft") keys.left = false;
    if (ev.key === "d" || ev.key === "D" || ev.key === "ArrowRight") keys.right = false;
  });

  window.LEI_WORLD = {
    celebrate: function () {
      for (var i = 0; i < worlds.length; i++) {
        worlds[i].jumpV = 5;
        worlds[i].emoteTimer = 18;
      }
    },
    stepStage: function () {
      for (var i = 0; i < worlds.length; i++) {
        worlds[i].jumpV = 3;
        worlds[i].emoteTimer = 10;
      }
    },
    setTimeMode: function (mode) {
      timeOverride = mode === "day" || mode === "night" ? mode : null;
      syncBodyNightClass(isNightTime());
    },
    isNight: function () {
      return isNightTime();
    }
  };

  document.addEventListener("click", function (ev) {
    if (ev.target.closest("a, button, input, textarea, .parchment-card, .research-pavilion, .codex-card, .connect-parchment-panel, .quest-dialog, .bar-header")) {
      return;
    }
    var vw = Math.max(1, window.innerWidth);
    var vh = Math.max(1, window.innerHeight);
    var gx = ((ev.clientX / vw) * W) | 0;
    var gy = ((ev.clientY / vh) * H) | 0;

    for (var i = 0; i < worlds.length; i++) {
      var w = worlds[i];
      if (w.scene === "about" && gx >= 180 && gx <= 236 && gy >= 85 && gy <= 120) {
        w.lampLit = !w.lampLit;
      }
      if ((w.scene === "gallery" || w.scene === "research") && gx >= 185 && gx <= 235 && gy >= 82 && gy <= 120) {
        w.chestOpen = !w.chestOpen;
        w.emoteTimer = 20;
      }
      if (w.scene === "contact" && gx >= 155 && gx <= 215 && gy >= 88 && gy <= 122) {
        w.fireBoost = 24;
        w.emoteTimer = 20;
      }
      if (gy >= 78) {
        w.targetX = Math.max(20, Math.min(168, gx));
        w.emoteTimer = 16;
        if (Math.abs(gx - w.heroX) < 16 && w.jumpY === 0) {
          w.jumpV = 4;
        }
      }
    }
  });

  var tick = 0;
  function step() {
    tick++;
    if (tick % 300 === 0) {
      syncBodyNightClass(isNightTime());
    }
    for (var i = 0; i < worlds.length; i++) {
      var w = worlds[i];
      if (!w.ctx) continue;

      if (keys.left) {
        w.targetX = Math.max(20, w.heroX - 4);
      } else if (keys.right) {
        w.targetX = Math.min(168, w.heroX + 4);
      }

      var dx = w.targetX - w.heroX;
      if (Math.abs(dx) > 1.5) {
        w.walking = true;
        w.dir = dx > 0 ? 1 : -1;
        w.heroX += w.dir * 2;
      } else {
        w.walking = false;
      }

      var bridgeLift = (w.heroX >= 90 && w.heroX <= 126) ? 2 : 0;
      w.heroY = 116 - bridgeLift;

      var desiredCatX = w.heroX - w.dir * 12;
      w.catX += (desiredCatX - w.catX) * 0.35;

      if (w.jumpY > 0 || w.jumpV > 0) {
        w.jumpY += w.jumpV;
        w.jumpV -= 1.2;
        if (w.jumpY <= 0) {
          w.jumpY = 0;
          w.jumpV = 0;
        }
      }

      if (w.emoteTimer > 0) w.emoteTimer--;
      if (w.fireBoost > 0) w.fireBoost--;

      renderScene(w.ctx, w, tick);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initCanvases();
      step();
      setInterval(step, 90);
    });
  } else {
    initCanvases();
    step();
    setInterval(step, 90);
  }
})();
