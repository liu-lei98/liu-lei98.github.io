// =============================================================================
// Lei Liu — 16-bit Pixel Overworld Engine (Pure Canvas Tilemap + Sprite Engine)
// Resolution: 256 x 144 (16:9 widescreen retro game canvas)
// =============================================================================
(function () {
  var W = 256;
  var H = 144;

  // Color Palette (16-bit Fantasy Daylight)
  var PAL = {
    sky0: "#5ca0ee",
    sky1: "#70b2f6",
    sky2: "#8bc5fb",
    sky3: "#aad9fe",
    sky4: "#cbe9ff",
    sky5: "#e6f5ff",
    sunCore: "#fffbe0",
    sunMid: "#ffe478",
    sunGlow: "#ffca4b",
    cloudHi: "#ffffff",
    cloudMid: "#e3f1ff",
    cloudSh: "#bad7f5",
    mtFar: "#9abde8",
    mtFarHi: "#b4d2f5",
    mtMid: "#7ea5d8",
    mtMidHi: "#9bc0ec",
    mtNear: "#648bc2",
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
    redSh: "#9e1f2e",
    outline: "#232c4d",
    skinHi: "#ffe0c2",
    skinMid: "#f5c299",
    leafHi: "#7ed94c",
    leafMid: "#4fa82e",
    leafSh: "#2f701c"
  };

  function px(ctx, x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  }

  // Draw a dithered horizontal band between two colors
  function drawDitherBand(ctx, y, colA, colB) {
    px(ctx, 0, y, W, 2, colA);
    ctx.fillStyle = colB;
    for (var x = 0; x < W; x += 2) {
      ctx.fillRect(x, y, 1, 1);
      ctx.fillRect(x + 1, y + 1, 1, 1);
    }
  }

  // 1. Sky + Sun + Distant Birds
  function drawSky(ctx, tick, scene) {
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

    // Pixel Sun (upper right-center or upper-left depending on scene)
    var sx = scene === "home" ? 156 : 44;
    var sy = 22;
    var pulse = (tick >> 2) % 2;
    px(ctx, sx - 9 - pulse, sy - 9 - pulse, 18 + pulse * 2, 18 + pulse * 2, "rgba(255, 238, 150, 0.28)");
    px(ctx, sx - 7, sy - 5, 14, 10, PAL.sunMid);
    px(ctx, sx - 5, sy - 7, 10, 14, PAL.sunMid);
    px(ctx, sx - 5, sy - 5, 10, 10, PAL.sunCore);
    // Sun rays
    if (pulse === 0) {
      px(ctx, sx, sy - 10, 1, 2, PAL.sunCore);
      px(ctx, sx, sy + 9, 1, 2, PAL.sunCore);
      px(ctx, sx - 10, sy, 2, 1, PAL.sunCore);
      px(ctx, sx + 9, sy, 2, 1, PAL.sunCore);
    }
  }

  // Fluffy multi-layer pixel cloud
  function drawCloud(ctx, x, y, w, h) {
    var cx = ((x % (W + 60)) + (W + 60)) % (W + 60) - 30;
    // Shadow base
    px(ctx, cx + 2, y + h - 3, w - 4, 3, PAL.cloudSh);
    // Mid body
    px(ctx, cx, y + 3, w, h - 5, PAL.cloudMid);
    // Top puffs
    px(ctx, cx + 3, y + 1, w - 6, h - 4, PAL.cloudHi);
    px(ctx, cx + 6, y - 2, Math.max(6, (w * 0.45) | 0), 4, PAL.cloudHi);
    px(ctx, cx + ((w * 0.42) | 0), y - 4, Math.max(8, (w * 0.38) | 0), 6, PAL.cloudHi);
    // Crisp highlight rim
    px(ctx, cx + 1, y + 3, w - 2, 2, PAL.cloudHi);
  }

  // 2. Distant Layered Pixel Mountains + Valley Mist
  function drawMountains(ctx, tick) {
    // Far range
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
      // Snow / sunlight cap on sunlit left slopes
      if (y1 < y0 && my < 86) {
        px(ctx, x, my, 2, 6, PAL.mtFarHi);
      }
    }

    // Near mountain range
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

    // Horizon mist band
    px(ctx, 0, 112, W, 6, "rgba(235, 246, 255, 0.55)");
    px(ctx, 0, 118, W, 8, "rgba(235, 246, 255, 0.75)");

    // Drifting clouds
    var drift = (tick * 0.25) | 0;
    drawCloud(ctx, 14 + drift, 20, 36, 11);
    drawCloud(ctx, 88 + ((drift * 0.7) | 0), 32, 44, 12);
    drawCloud(ctx, 182 + drift, 18, 38, 11);
    drawCloud(ctx, 138 + ((drift * 0.5) | 0), 52, 30, 9);

    // Distant flying birds
    var bx = (210 - ((tick >> 1) % 220) + W) % W;
    var flap = (tick >> 2) % 2;
    px(ctx, bx, 36 + flap, 2, 1, PAL.outline);
    px(ctx, bx + 2, 37, 1, 1, PAL.outline);
    px(ctx, bx + 3, 36 + flap, 2, 1, PAL.outline);

    px(ctx, bx + 12, 32 + (1 - flap), 2, 1, PAL.outline);
    px(ctx, bx + 14, 33, 1, 1, PAL.outline);
    px(ctx, bx + 15, 32 + (1 - flap), 2, 1, PAL.outline);
  }

  // Pixel Oak / Pine Tree
  function drawTree(ctx, x, y, scale, tick) {
    var sway = ((tick >> 4) + x) % 2 === 0 ? 0 : 1;
    var s = scale || 1;
    // Trunk
    px(ctx, x - 2 * s, y - 7 * s, 4 * s, 7 * s, PAL.woodSh);
    px(ctx, x - 1 * s, y - 7 * s, 2 * s, 7 * s, PAL.woodMid);
    // Canopy layers
    px(ctx, x - 8 * s + sway, y - 14 * s, 16 * s, 8 * s, PAL.leafSh);
    px(ctx, x - 7 * s + sway, y - 18 * s, 14 * s, 9 * s, PAL.leafMid);
    px(ctx, x - 5 * s + sway, y - 21 * s, 10 * s, 6 * s, PAL.leafHi);
    px(ctx, x - 6 * s + sway, y - 16 * s, 5 * s, 3 * s, PAL.leafHi);
  }

  // Floating island helper
  function drawFloatingIsland(ctx, x, y, w, h, tick, hasWaterfall) {
    var bob = ((tick >> 3) + (x >> 3)) % 2;
    var iy = y + bob;
    // Rocky underside cone
    for (var row = 0; row < h; row += 2) {
      var ratio = 1 - row / h;
      var rw = Math.max(4, (w * ratio) | 0);
      var rx = x + ((w - rw) >> 1);
      px(ctx, rx, iy + 4 + row, rw, 2, row > h * 0.55 ? PAL.dirtDark : PAL.dirtSh);
      if (rw > 6) {
        px(ctx, rx + 2, iy + 4 + row, (rw * 0.45) | 0, 2, PAL.dirtMid);
      }
    }
    // Grass cap
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
      // Mist spray at bottom of waterfall
      var mist = tick % 3;
      px(ctx, wx - 3 - mist, wy + wh - 2, 13 + mist * 2, 3, PAL.cloudHi);
      px(ctx, wx - 1, wy + wh + 1, 9, 2, PAL.waterLt);
    }
  }

  // Grand Sky Castle on Floating Island (Stage 1: Home, right side)
  function drawSkyCastle(ctx, x, y, tick) {
    var bob = (tick >> 3) % 2;
    var cy = y + bob;

    // Castle Towers & Walls
    // Left tower
    px(ctx, x + 6, cy - 22, 10, 22, PAL.wallMid);
    px(ctx, x + 7, cy - 22, 5, 22, PAL.wallHi);
    // Left cone roof
    for (var r = 0; r < 8; r++) {
      px(ctx, x + 5 + r, cy - 23 - r, 12 - r * 2, 1, r < 4 ? PAL.roofMid : PAL.roofHi);
    }
    // Right tower
    px(ctx, x + 36, cy - 24, 10, 24, PAL.wallSh);
    px(ctx, x + 37, cy - 24, 5, 24, PAL.wallMid);
    for (var rr = 0; rr < 8; rr++) {
      px(ctx, x + 35 + rr, cy - 25 - rr, 12 - rr * 2, 1, PAL.roofMid);
    }

    // Center Grand Keep
    px(ctx, x + 15, cy - 34, 22, 34, PAL.wallMid);
    px(ctx, x + 16, cy - 34, 12, 34, PAL.wallHi);
    // Battlements
    for (var bx = x + 14; bx < x + 38; bx += 4) {
      px(ctx, bx, cy - 36, 2, 2, PAL.wallHi);
    }
    // Center Spire Roof
    for (var sr = 0; sr < 13; sr++) {
      px(ctx, x + 14 + sr, cy - 36 - sr, 24 - sr * 2, 1, sr % 2 === 0 ? PAL.roofHi : PAL.roofMid);
    }
    // Red fluttering flag on top of keep
    var fx = x + 25;
    var fy = cy - 53;
    px(ctx, fx, fy, 1, 6, PAL.goldMid);
    var wave = (tick >> 1) % 2;
    px(ctx, fx + 1, fy + 1, 6, 3, PAL.redMid);
    px(ctx, fx + 4, fy + 1 + wave, 3, 2, PAL.redHi);

    // Castle Gate & Windows
    px(ctx, x + 23, cy - 10, 6, 10, PAL.dirtDark);
    px(ctx, x + 24, cy - 11, 4, 2, PAL.dirtDark);
    // Glowing windows
    px(ctx, x + 21, cy - 26, 3, 5, PAL.goldMid);
    px(ctx, x + 28, cy - 26, 3, 5, PAL.goldMid);
    px(ctx, x + 10, cy - 15, 2, 4, PAL.goldMid);
    px(ctx, x + 40, cy - 16, 2, 4, PAL.goldMid);

    // Trees flanking castle
    drawTree(ctx, x + 4, cy, 1, tick);
    drawTree(ctx, x + 49, cy, 1, tick);

    // Floating Island Base + Waterfall
    drawFloatingIsland(ctx, x - 4, cy, 60, 26, tick, true);
  }

  // Foreground Terraced Grass Cliff + Stream + Wooden Bridge
  function drawForegroundTerrain(ctx, tick, scene) {
    // Base water stream in center-left (x: 84..132)
    px(ctx, 0, 126, W, 18, PAL.waterDk);
    px(ctx, 0, 126, W, 5, PAL.waterMid);
    for (var wx = 78; wx < 138; wx += 8) {
      var shimmer = (wx + (tick & 7)) % 12;
      px(ctx, wx + shimmer, 129, 5, 1, PAL.waterHi);
      px(ctx, wx + 2, 135, 6, 1, PAL.waterLt);
    }

    // Left Cliff (x: 0..92, y: 118..144)
    px(ctx, 0, 120, 90, 24, PAL.dirtMid);
    px(ctx, 0, 126, 86, 18, PAL.dirtSh);
    // Dirt blocks texture
    for (var dx = 6; dx < 82; dx += 14) {
      px(ctx, dx, 125, 6, 4, PAL.dirtHi);
      px(ctx, dx + 5, 132, 7, 4, PAL.dirtDark);
    }
    // Lush stepped grass top on left cliff
    px(ctx, 0, 116, 92, 3, PAL.grassHi);
    px(ctx, 0, 119, 91, 3, PAL.grassMid);
    for (var gx = 2; gx < 90; gx += 5) {
      px(ctx, gx, 122, 3, 2, PAL.grassSh);
    }

    // Right Cliff (x: 124..256, y: 118..144)
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

    // Wooden Arch Bridge spanning x: 88..128
    px(ctx, 88, 118, 3, 10, PAL.woodSh);
    px(ctx, 125, 118, 3, 10, PAL.woodSh);
    px(ctx, 89, 121, 38, 2, PAL.woodSh);
    for (var bp = 90; bp < 126; bp += 4) {
      var arch = (bp > 98 && bp < 118) ? -1 : 0;
      px(ctx, bp, 119 + arch, 3, 2, PAL.woodHi);
      px(ctx, bp + 1, 115 + arch, 1, 4, PAL.woodMid);
    }
    // Bridge handrail rope
    px(ctx, 89, 115, 38, 1, PAL.woodHi);

    // Left foreground trees & flowers
    drawTree(ctx, 12, 116, 1, tick);
    // Pixel wildflowers on grass
    var flowers = [[26, 114, PAL.redHi], [31, 115, PAL.goldMid], [74, 115, PAL.waterHi], [142, rY - 3, PAL.goldMid], [242, rY - 3, PAL.redHi]];
    for (var f = 0; f < flowers.length; f++) {
      px(ctx, flowers[f][0], flowers[f][1], 2, 2, flowers[f][2]);
      px(ctx, flowers[f][0], flowers[f][1] + 2, 1, 1, PAL.grassDark);
    }
  }

  // Cozy Scholar Timber Cottage (Stage 2: About Me, right cliff)
  function drawScholarCottage(ctx, x, y, tick, lampLit) {
    // Stone foundation
    px(ctx, x, y - 4, 48, 4, PAL.stoneSh);
    px(ctx, x + 2, y - 3, 44, 2, PAL.stoneMid);
    // Half-timbered walls
    px(ctx, x + 2, y - 24, 44, 20, PAL.wallHi);
    px(ctx, x + 2, y - 24, 3, 20, PAL.woodSh);
    px(ctx, x + 43, y - 24, 3, 20, PAL.woodSh);
    px(ctx, x + 22, y - 24, 3, 20, PAL.woodSh);
    px(ctx, x + 2, y - 14, 44, 2, PAL.woodSh);

    // Chimney + animated smoke puffs
    px(ctx, x + 36, y - 40, 6, 14, PAL.stoneMid);
    px(ctx, x + 35, y - 41, 8, 2, PAL.stoneHi);
    var sOffset = (tick >> 1) % 10;
    px(ctx, x + 37 + (sOffset >> 2), y - 44 - sOffset, 4, 3, PAL.cloudHi);
    px(ctx, x + 39 + (sOffset >> 1), y - 49 - sOffset, 5, 4, "rgba(255,255,255,0.75)");

    // Blue Pitched Roof
    for (var r = 0; r < 14; r++) {
      px(ctx, x - 3 + r, y - 24 - r, 54 - r * 2, 2, r % 3 === 0 ? PAL.roofHi : PAL.roofMid);
    }
    px(ctx, x - 3, y - 24, 54, 2, PAL.roofSh);

    // Door & Warm Lit Window
    px(ctx, x + 9, y - 12, 8, 12, PAL.woodMid);
    px(ctx, x + 10, y - 11, 6, 11, PAL.woodSh);
    px(ctx, x + 14, y - 6, 1, 1, PAL.goldMid);

    var winCol = lampLit !== false ? PAL.goldMid : "#5b7099";
    var winHi = lampLit !== false ? PAL.goldHi : "#7c94bf";
    px(ctx, x + 28, y - 12, 11, 8, PAL.woodSh);
    px(ctx, x + 29, y - 11, 9, 6, winCol);
    px(ctx, x + 30, y - 10, 3, 2, winHi);
    px(ctx, x + 33, y - 11, 1, 6, PAL.woodSh);
    px(ctx, x + 29, y - 8, 9, 1, PAL.woodSh);
  }

  // Treasure Chest + Bobbing Coins (Stage 4: Gallery, right cliff)
  function drawTreasureScene(ctx, x, y, tick, chestOpen) {
    // Wooden Chest
    px(ctx, x, y - 10, 16, 10, PAL.woodMid);
    px(ctx, x, y - 10, 16, 4, chestOpen ? PAL.goldHi : PAL.woodHi);
    px(ctx, x, y - 6, 16, 2, PAL.goldMid);
    px(ctx, x + 6, y - 7, 4, 4, PAL.goldHi);
    px(ctx, x - 1, y - 11, 18, 1, PAL.outline);

    // Floating Spinning Gold Coins above cliff
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

  // Cozy Campsite: Tent + Crackling Campfire + Signpost (Stage 5: Contact, right cliff)
  function drawCampsite(ctx, x, y, tick, fireBoost) {
    // Wooden A-Frame Tent
    for (var r = 0; r < 18; r++) {
      var tw = 36 - r * 2;
      var tx = x + 22 + r;
      var ty = y - 1 - r;
      px(ctx, tx, ty, tw, 1, r % 3 === 0 ? PAL.woodHi : PAL.woodMid);
    }
    // Tent dark opening
    for (var dr = 0; dr < 10; dr++) {
      px(ctx, x + 34 + dr, y - 1 - dr, Math.max(2, 12 - dr * 2), 1, PAL.dirtDark);
    }
    // Red flag on tent peak
    var wave = (tick >> 1) % 2;
    px(ctx, x + 39, y - 24, 1, 6, PAL.woodSh);
    px(ctx, x + 40, y - 24 + wave, 7, 4, PAL.redMid);
    px(ctx, x + 41, y - 23 + wave, 2, 2, PAL.cloudHi);

    // Campfire on left of tent
    var fx = x + 4;
    var fy = y;
    // Logs & stones
    px(ctx, fx - 5, fy - 2, 12, 2, PAL.woodSh);
    px(ctx, fx - 6, fy - 1, 3, 2, PAL.stoneMid);
    px(ctx, fx + 5, fy - 1, 3, 2, PAL.stoneMid);
    // Animated flames
    var fH = (fireBoost ? 11 : 7) + (tick % 3);
    px(ctx, fx - 3, fy - fH, 8, fH - 1, PAL.redHi);
    px(ctx, fx - 2, fy - fH + 2, 6, fH - 3, PAL.goldMid);
    px(ctx, fx - 1, fy - 5, 4, 3, PAL.sunCore);
    // Rising sparks
    var sparkY = fy - fH - 2 - (tick % 8);
    px(ctx, fx + ((tick >> 1) % 3) - 1, sparkY, 1, 1, PAL.goldHi);
    px(ctx, fx + 2 - (tick % 3), sparkY - 3, 1, 1, PAL.redHi);

    // Wooden Signpost on right
    var sx = x + 64;
    px(ctx, sx, y - 12, 2, 12, PAL.woodSh);
    px(ctx, sx - 6, y - 13, 14, 6, PAL.woodHi);
    px(ctx, sx - 5, y - 12, 12, 4, PAL.wallHi);
    px(ctx, sx - 4, y - 11, 9, 1, PAL.woodSh);
    px(ctx, sx - 4, y - 9, 6, 1, PAL.woodSh);
  }

  // Researcher Boy + White Cat Companion (Animated & Interactive)
  function drawHeroAndCat(ctx, state, tick) {
    var x = state.heroX | 0;
    var y = state.heroY | 0;
    var sitting = state.scene === "contact" && !state.walking && state.jumpY === 0;
    var bob = state.walking ? (tick % 2) : ((tick >> 2) % 2);
    var hy = y - (state.jumpY | 0);

    // Shadow
    px(ctx, x - 5, y - 1, 10, 2, "rgba(25, 60, 18, 0.45)");

    // Hair & Head
    px(ctx, x - 4, hy - 19 + bob, 8, 3, PAL.outline);
    px(ctx, x - 5, hy - 17 + bob, 10, 3, "#2f3b66");
    px(ctx, x - 4, hy - 14 + bob, 8, 5, PAL.skinHi);
    // Eyes (facing direction)
    var eyeX = state.dir < 0 ? x - 3 : x - 1;
    px(ctx, eyeX, hy - 13 + bob, 1, 2, PAL.outline);
    px(ctx, eyeX + 3, hy - 13 + bob, 1, 2, PAL.outline);

    // Backpack
    var packX = state.dir < 0 ? x + 3 : x - 6;
    px(ctx, packX, hy - 9 + bob, 3, 6, PAL.woodMid);
    px(ctx, packX, hy - 9 + bob, 3, 2, PAL.woodHi);

    // Blue Researcher Tunic & Yellow Scarf
    px(ctx, x - 4, hy - 9 + bob, 8, 6, PAL.roofMid);
    px(ctx, x - 4, hy - 9 + bob, 8, 2, PAL.goldMid);

    // Legs / Boots
    if (sitting) {
      px(ctx, x - 3, hy - 3, 8, 3, PAL.dirtDark);
    } else {
      var step = state.walking ? ((tick % 4) - 1) : 0;
      px(ctx, x - 3 + step, hy - 3, 2, 3, PAL.outline);
      px(ctx, x + 1 - step, hy - 3, 2, 3, PAL.outline);
    }

    // Companion White Cat (follows alongside hero)
    var cx = (state.catX | 0);
    var cy = y - ((state.jumpY * 0.6) | 0);
    var tailWag = (tick >> 1) % 2;
    px(ctx, cx - 3, cy - 1, 7, 1, "rgba(25, 60, 18, 0.4)");
    // Cat ears
    px(ctx, cx - 3, cy - 8, 2, 2, PAL.cloudHi);
    px(ctx, cx + 2, cy - 8, 2, 2, PAL.cloudHi);
    px(ctx, cx - 2, cy - 7, 1, 1, PAL.redHi);
    px(ctx, cx + 2, cy - 7, 1, 1, PAL.redHi);
    // Cat head & body
    px(ctx, cx - 3, cy - 6, 7, 6, PAL.cloudHi);
    px(ctx, cx - 3, cy - 2, 7, 2, PAL.cloudMid);
    px(ctx, cx - 2, cy - 5, 1, 1, PAL.outline);
    px(ctx, cx + 2, cy - 5, 1, 1, PAL.outline);
    px(ctx, cx, cy - 4, 1, 1, PAL.redHi);
    // Tail
    px(ctx, cx + 4, cy - 4 - tailWag, 2, 3, PAL.cloudHi);

    // Emote bubble above hero/cat (Heart in contact or when clicked)
    if (state.emoteTimer > 0 || state.scene === "contact") {
      var bx = x + 3;
      var by = hy - 28 - ((tick >> 2) % 2);
      px(ctx, bx - 4, by - 5, 9, 7, PAL.cloudHi);
      px(ctx, bx - 3, by - 6, 7, 9, PAL.cloudHi);
      px(ctx, bx - 2, by + 3, 2, 1, PAL.cloudHi);
      // Pixel heart inside bubble
      px(ctx, bx - 2, by - 4, 2, 2, PAL.redMid);
      px(ctx, bx + 1, by - 4, 2, 2, PAL.redMid);
      px(ctx, bx - 2, by - 2, 5, 2, PAL.redMid);
      px(ctx, bx - 1, by, 3, 1, PAL.redMid);
      px(ctx, bx, by + 1, 1, 1, PAL.redMid);
    }
  }

  // Scene-specific composition
  function renderScene(ctx, state, tick) {
    var scene = state.scene;
    drawSky(ctx, tick, scene);
    drawMountains(ctx, tick);

    // Distant floating islands (all scenes have subtle sky islands for world continuity)
    drawFloatingIsland(ctx, 20, 62, 26, 12, tick, false);
    drawTree(ctx, 32, 62 + ((tick >> 3) % 2), 1, tick);

    if (scene === "home") {
      drawFloatingIsland(ctx, 114, 54, 28, 12, tick, false);
      drawTree(ctx, 128, 54 + ((tick >> 3) % 2), 1, tick);
      drawSkyCastle(ctx, 182, 78, tick);
    } else if (scene === "about") {
      drawFloatingIsland(ctx, 198, 44, 32, 14, tick, true);
    } else if (scene === "research") {
      drawFloatingIsland(ctx, 206, 48, 30, 13, tick, false);
    } else if (scene === "gallery") {
      drawSkyCastle(ctx, 194, 68, tick);
    } else if (scene === "contact") {
      drawFloatingIsland(ctx, 192, 46, 30, 12, tick, false);
    }

    drawForegroundTerrain(ctx, tick, scene);

    // Left cliff wooden signpost on Home
    if (scene === "home") {
      px(ctx, 72, 105, 2, 11, PAL.woodSh);
      px(ctx, 66, 104, 14, 6, PAL.woodHi);
      px(ctx, 67, 105, 12, 4, PAL.wallHi);
      px(ctx, 69, 106, 8, 1, PAL.woodSh);
      px(ctx, 69, 108, 6, 1, PAL.woodSh);
    } else if (scene === "about") {
      drawScholarCottage(ctx, 184, 116, tick, state.lampLit);
      drawTree(ctx, 242, 116, 1, tick);
    } else if (scene === "research") {
      drawTree(ctx, 236, 116, 1, tick);
      drawTreasureScene(ctx, 198, 116, tick, state.chestOpen);
    } else if (scene === "gallery") {
      drawTreasureScene(ctx, 202, 116, tick, state.chestOpen);
      drawTree(ctx, 240, 116, 1, tick);
    } else if (scene === "contact") {
      drawCampsite(ctx, 162, 116, tick, state.fireBoost > 0);
    }

    drawHeroAndCat(ctx, state, tick);
  }

  // Interactive world state per canvas
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
      var defaultX = sc === "research" ? 96 : sc === "contact" ? 56 : 42;
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
  }

  // Allow clicking on visible ground/characters/landmarks or pressing A/D to walk & jump
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

  // Expose interactive trigger for stage switching / HUD clicks
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
    }
  };

  // Click interaction on the lower ground strip (when not clicking a card/button)
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
      // Check cottage window toggle
      if (w.scene === "about" && gx >= 180 && gx <= 236 && gy >= 85 && gy <= 120) {
        w.lampLit = !w.lampLit;
      }
      // Check treasure chest / coins
      if ((w.scene === "gallery" || w.scene === "research") && gx >= 185 && gx <= 235 && gy >= 82 && gy <= 120) {
        w.chestOpen = !w.chestOpen;
        w.emoteTimer = 20;
      }
      // Check campfire boost
      if (w.scene === "contact" && gx >= 155 && gx <= 215 && gy >= 88 && gy <= 122) {
        w.fireBoost = 24;
        w.emoteTimer = 20;
      }
      // Walk hero toward clicked X on the ground/bridge (x: 18..170)
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

      // Ground height adjusts slightly on the bridge (x: 90..126)
      var bridgeLift = (w.heroX >= 90 && w.heroX <= 126) ? 2 : 0;
      w.heroY = 116 - bridgeLift;

      // Cat smoothly trails behind hero
      var desiredCatX = w.heroX - w.dir * 12;
      w.catX += (desiredCatX - w.catX) * 0.35;

      // Jump physics
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
