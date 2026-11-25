/* ==========================================================================
   Lei Liu — 2.5D pixel homepage (HD-2D pixel-art engine)
   ========================================================================== */
(function () {
  if (!document.getElementById("world-3d-root")) return;

  var rootEl = document.getElementById("world-3d-root");
  var canvasHost = document.getElementById("world-3d-canvas");
  var titleOverlay = document.getElementById("title-screen");
  var hudLayer = document.getElementById("world-hud");
  var zoneTitleEl = document.getElementById("hud-zone-title");
  var zoneSubEl = document.getElementById("hud-zone-sub");
  var clockTimeEl = document.getElementById("hud-clock-time");
  var clockPhaseEl = document.getElementById("hud-clock-phase");
  var clockIconEl = document.getElementById("hud-clock-icon");
  var clockBarEl = document.getElementById("hud-clock-bar");
  var promptEl = document.getElementById("interact-prompt");
  var promptTextEl = document.getElementById("interact-prompt-text");
  var minimapCanvas = document.getElementById("hud-minimap");
  var controlsBox = document.getElementById("hud-controls");
  var modalBackdrop = document.getElementById("world-modal-backdrop");
  var modalTitleEl = document.getElementById("world-modal-title");
  var modalSubEl = document.getElementById("world-modal-sub");
  var modalCloseBtn = document.getElementById("world-modal-close");

  function getLang() {
    try { return localStorage.getItem("lei_lang") === "en" ? "en" : "zh"; } catch (e) { return "zh"; }
  }
  function playSfx(name) {
    if (window.LEI_SFX && typeof window.LEI_SFX.play === "function") window.LEI_SFX.play(name);
  }
  function addCoin(n) {
    if (window.LEI_GAME && typeof window.LEI_GAME.addCoin === "function") window.LEI_GAME.addCoin(n || 1);
  }

  // ---------- Elevation Model for Multi-Tier Terraced Isle ----------
  // North Observatory Terrace (z <= -10.5): y = 2.4
  // North Grand Stairs (-10.5 < z < -6.5, |x| < 3.6): smooth ramp 1.0 -> 2.4
  // Mid Main Island (-10.5 < z < 7.5): y = 1.0
  // South Stairs (7.5 <= z <= 9.8, |x| < 3.0): smooth ramp 1.0 -> 0.0
  // South Campfire Terrace (z > 9.8): y = 0.0
  function getGroundY(x, z) {
    if (z <= -10.5) return 2.4;
    if (z < -6.5 && Math.abs(x) <= 3.8) {
      var tN = (-6.5 - z) / 4.0;
      return 1.0 + tN * 1.4;
    }
    if (z >= 9.8) return 0.0;
    if (z > 7.4 && Math.abs(x) <= 3.2) {
      var tS = (z - 7.4) / 2.4;
      return 1.0 - tS * 1.0;
    }
    // Bridge arch over creek (x in [5.4, 9.6], z in [-3.4, 0.2])
    if (x >= 5.2 && x <= 9.8 && z >= -3.6 && z <= 0.4) {
      var u = (x - 7.5) / 2.3;
      return 1.0 + Math.max(0, (1 - u * u)) * 0.55;
    }
    return 1.0;
  }

  // ---------- Zones & Landmarks ----------
  var ZONES = [
    {
      id: "home",
      stageIndex: 0,
      x: 0, z: 0, radius: 5.5,
      spawnX: 0, spawnZ: 2.2,
      interactX: 0, interactZ: -1.4,
      color: "#ffd86b",
      zh: { title: "首页", sub: "Lei Liu · 计算成像", prompt: "打开首页" },
      en: { title: "HOME", sub: "Lei Liu · Computational Imaging", prompt: "Open home" }
    },
    {
      id: "about",
      stageIndex: 1,
      x: -14.2, z: -1.8, radius: 6.5,
      spawnX: -9.6, spawnZ: -1.2,
      interactX: -11.8, interactZ: -1.2,
      color: "#7dd3fc",
      zh: { title: "关于", sub: "个人档案与研究方向", prompt: "打开关于" },
      en: { title: "ABOUT", sub: "Profile & Research Interests", prompt: "Open about" }
    },
    {
      id: "research",
      stageIndex: 2,
      x: 0, z: -16.8, radius: 8.0,
      spawnX: 0, spawnZ: -11.4,
      interactX: 0, interactZ: -13.0,
      color: "#c084fc",
      zh: { title: "研究", sub: "学术发表 · ORCID", prompt: "打开研究 · 浏览论文" },
      en: { title: "RESEARCH", sub: "Publications · ORCID", prompt: "Open research" }
    },
    {
      id: "gallery",
      stageIndex: 3,
      x: 14.5, z: -1.8, radius: 6.5,
      spawnX: 10.6, spawnZ: -1.6,
      interactX: 12.6, interactZ: -1.6,
      color: "#6ee7b7",
      zh: { title: "随笔", sub: "日常记录", prompt: "打开随笔" },
      en: { title: "NOTES", sub: "Notes & Moments", prompt: "Open notes" }
    },
    {
      id: "contact",
      stageIndex: 4,
      x: 0, z: 13.0, radius: 6.5,
      spawnX: 0, spawnZ: 10.6,
      interactX: 0, interactZ: 11.6,
      color: "#fb923c",
      zh: { title: "联系", sub: "邮箱与学术主页", prompt: "打开联系" },
      en: { title: "CONTACT", sub: "Email & Profiles", prompt: "Open contact" }
    }
  ];
  var zoneMap = {};
  ZONES.forEach(function (z) { zoneMap[z.id] = z; });

  // ---------- Modal Manager ----------
  var activeModalId = null;
  function syncHeaderActive(stageIndex) {
    var links = document.querySelectorAll(".world-menu a[data-go-stage]");
    for (var i = 0; i < links.length; i++) {
      var idx = parseInt(links[i].getAttribute("data-go-stage"), 10);
      links[i].classList.toggle("is-active", idx === stageIndex);
    }
    var chip = document.getElementById("hud-world");
    if (chip) {
      var labels = getLang() === "en"
        ? ["Home", "About", "Research", "Notes", "Contact"]
        : ["首页", "关于", "研究", "随笔", "联系"];
      chip.textContent = labels[stageIndex] || labels[0];
    }
  }

  function openZoneModal(zoneId) {
    var z = zoneMap[zoneId];
    if (!z || !modalBackdrop) return;
    var panels = modalBackdrop.querySelectorAll(".world-modal-panel");
    for (var i = 0; i < panels.length; i++) {
      panels[i].hidden = panels[i].getAttribute("data-panel") !== zoneId;
    }
    var l = getLang();
    if (modalTitleEl) modalTitleEl.textContent = z[l].title;
    if (modalSubEl) modalSubEl.textContent = z[l].sub;
    modalBackdrop.classList.add("is-open");
    modalBackdrop.setAttribute("aria-hidden", "false");
    activeModalId = zoneId;
    playSfx("open");
    addCoin(1);
    syncHeaderActive(z.stageIndex);
  }

  function closeZoneModal() {
    if (!modalBackdrop || !activeModalId) return;
    modalBackdrop.classList.remove("is-open");
    modalBackdrop.setAttribute("aria-hidden", "true");
    activeModalId = null;
    playSfx("close");
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeZoneModal);
  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", function (e) {
      if (e.target === modalBackdrop) closeZoneModal();
    });
  }

  if (typeof window.THREE === "undefined") {
    rootEl.classList.add("is-fallback");
    if (titleOverlay) titleOverlay.style.display = "none";
    if (hudLayer) hudLayer.classList.add("is-visible");
    openZoneModal("home");
    window.SPECTRAL_WORLD = {
      teleport: function (id, openPanel) { if (openPanel !== false) openZoneModal(id); },
      openPanel: openZoneModal,
      closePanel: closeZoneModal,
      jumpHero: function () {}
    };
    return;
  }

  var THREE = window.THREE;

  // ---------- High-Detail Pixel Texture Factory (64x64 HD-2D) ----------
  function makePixelTex(w, h, drawFn, repeatX, repeatY) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    var g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    drawFn(g, w, h);
    var tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    else if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    if (repeatX || repeatY) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatX || 1, repeatY || 1);
    }
    return tex;
  }

  // Soft Radial Glow Texture (for HD-2D Bloom Halos, Sun, Lanterns, Fireflies)
  function makeGlowTex(innerCol, midCol, outerCol) {
    var c = document.createElement("canvas");
    c.width = 64; c.height = 64;
    var g = c.getContext("2d");
    var grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    grad.addColorStop(0, innerCol);
    grad.addColorStop(0.35, midCol);
    grad.addColorStop(1, outerCol);
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    var tex = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    else if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  var texGlowWarm = makeGlowTex("rgba(255,248,210,1)", "rgba(255,188,82,0.55)", "rgba(255,140,40,0)");
  var texGlowCyan = makeGlowTex("rgba(240,253,255,1)", "rgba(125,211,252,0.5)", "rgba(99,102,241,0)");
  var texGlowGold = makeGlowTex("rgba(255,252,225,1)", "rgba(253,224,71,0.45)", "rgba(234,179,8,0)");
  var texMist = makeGlowTex("rgba(255,255,255,0.85)", "rgba(220,240,255,0.42)", "rgba(200,230,255,0)");

  // Lush Grass Meadow (64x64 pixel art with clover tufts & blossoms)
  var texGrass = makePixelTex(64, 64, function (g, w, h) {
    g.fillStyle = "#528c45";
    g.fillRect(0, 0, w, h);
    var greens = ["#467d3b", "#5e9c4e", "#6baa58", "#3f7035", "#76b860"];
    for (var i = 0; i < 340; i++) {
      g.fillStyle = greens[i % greens.length];
      var px = (i * 23 + (i % 7) * 5) % w;
      var py = (i * 17 + (i % 5) * 3) % h;
      g.fillRect(px, py, 2, (i % 3 === 0) ? 3 : 2);
    }
    // Delicate meadow flowers
    var flowers = [
      [10, 14, "#fff2a6"], [12, 16, "#ffffff"], [38, 12, "#fbcfe8"],
      [50, 42, "#fde68a"], [22, 48, "#ffffff"], [44, 28, "#bae6fd"]
    ];
    flowers.forEach(function (f) {
      g.fillStyle = "#365f2e"; g.fillRect(f[0], f[1] + 2, 2, 2);
      g.fillStyle = f[2]; g.fillRect(f[0], f[1], 2, 2);
    });
  }, 14, 14);

  // Ornate Limestone Plaza Tiles (64x64 with beveled borders & gold inlay)
  var texPlaza = makePixelTex(64, 64, function (g, w, h) {
    g.fillStyle = "#ddd3be";
    g.fillRect(0, 0, w, h);
    var tiles = [[0, 0, "#e7dfd0"], [32, 0, "#d4c8b2"], [0, 32, "#d4c8b2"], [32, 32, "#e7dfd0"]];
    tiles.forEach(function (t) {
      g.fillStyle = t[2];
      g.fillRect(t[0] + 2, t[1] + 2, 28, 28);
      g.fillStyle = "#f4efe4";
      g.fillRect(t[0] + 2, t[1] + 2, 28, 2);
      g.fillRect(t[0] + 2, t[1] + 2, 2, 28);
      g.fillStyle = "#a89a82";
      g.fillRect(t[0] + 2, t[1] + 29, 28, 2);
      g.fillRect(t[0] + 29, t[1] + 2, 2, 28);
      // Subtle grain
      g.fillStyle = "#c9bca5";
      g.fillRect(t[0] + 10, t[1] + 12, 3, 2);
      g.fillRect(t[0] + 20, t[1] + 22, 2, 2);
    });
    g.fillStyle = "#8a7d68";
    g.fillRect(0, 0, 64, 2); g.fillRect(0, 31, 64, 2);
    g.fillRect(0, 0, 2, 64); g.fillRect(31, 0, 2, 64);
  }, 5, 5);

  // Carved Ashlar Stone Wall (64x64 with mortar depth & moss hints)
  var texStoneWall = makePixelTex(64, 64, function (g, w, h) {
    g.fillStyle = "#c6c0b4";
    g.fillRect(0, 0, w, h);
    var shades = ["#dbd5c9", "#cfc8ba", "#e5dfd4", "#bfb7a8"];
    for (var y = 0; y < 64; y += 16) {
      var off = (y / 16) % 2 === 0 ? 0 : 16;
      for (var x = -16; x < 64; x += 32) {
        g.fillStyle = shades[((x + y) / 16 + 16) % shades.length];
        g.fillRect(x + off + 2, y + 2, 29, 13);
        g.fillStyle = "#f3eee4";
        g.fillRect(x + off + 2, y + 2, 29, 2);
        g.fillStyle = "#948c7e";
        g.fillRect(x + off + 2, y + 14, 29, 2);
      }
      g.fillStyle = "#7a7366";
      g.fillRect(0, y, 64, 2);
    }
    // Gold filigree accent line
    g.fillStyle = "#d9b45b";
    g.fillRect(0, 30, 64, 2);
  }, 2, 3);

  // Layered Cliff Rock with Hanging Grass & Vines (64x64)
  var texCliff = makePixelTex(64, 64, function (g, w, h) {
    g.fillStyle = "#5c534c";
    g.fillRect(0, 0, w, h);
    for (var y = 8; y < 64; y += 8) {
      for (var x = 0; x < 64; x += 12) {
        var tone = ((x + y) % 24 === 0) ? "#73685f" : ((x + y) % 16 === 0 ? "#4a423c" : "#645a52");
        g.fillStyle = tone;
        g.fillRect(x + (y % 4), y, 11, 7);
        g.fillStyle = "#3b342f";
        g.fillRect(x + (y % 4), y + 7, 11, 1);
      }
    }
    // Overhanging grass lip
    g.fillStyle = "#4d8841";
    g.fillRect(0, 0, 64, 8);
    g.fillStyle = "#62a351";
    g.fillRect(0, 0, 64, 4);
    for (var vx = 2; vx < 64; vx += 6) {
      g.fillStyle = "#3c6f33";
      g.fillRect(vx, 8, 3, (vx % 12 === 2) ? 6 : 3);
    }
  }, 12, 1);

  // Warm Timber Planks (64x64 with nail heads)
  var texWood = makePixelTex(64, 64, function (g, w, h) {
    g.fillStyle = "#8f5d38";
    g.fillRect(0, 0, w, h);
    for (var y = 0; y < 64; y += 16) {
      g.fillStyle = (y % 32 === 0) ? "#9f6a41" : "#835431";
      g.fillRect(0, y + 1, 64, 14);
      g.fillStyle = "#b88255";
      g.fillRect(0, y + 1, 64, 2);
      g.fillStyle = "#523018";
      g.fillRect(0, y + 15, 64, 1);
      // Wood grain & nails
      g.fillStyle = "#6b4122";
      g.fillRect(10, y + 6, 18, 1);
      g.fillRect(36, y + 10, 20, 1);
      g.fillStyle = "#3c2618";
      g.fillRect(4, y + 7, 2, 2);
      g.fillRect(58, y + 7, 2, 2);
    }
  }, 2, 2);

  // Half-Timbered Cottage Wall (64x64 cream plaster + dark oak beams)
  var texCottageWall = makePixelTex(64, 64, function (g, w, h) {
    g.fillStyle = "#f4e8ce";
    g.fillRect(0, 0, w, h);
    for (var i = 0; i < 120; i++) {
      g.fillStyle = i % 2 === 0 ? "#eadab8" : "#fbf4e4";
      g.fillRect((i * 19) % 62, (i * 11) % 62, 2, 2);
    }
    // Timber framing
    g.fillStyle = "#5b371e";
    g.fillRect(0, 0, 64, 5);
    g.fillRect(0, 59, 64, 5);
    g.fillRect(0, 0, 5, 64);
    g.fillRect(59, 0, 5, 64);
    g.fillRect(30, 0, 4, 64);
    g.fillRect(0, 30, 64, 4);
    // Diagonal brace
    for (var d = 0; d < 24; d++) {
      g.fillRect(6 + d, 6 + d, 3, 3);
      g.fillRect(55 - d, 6 + d, 3, 3);
    }
  }, 1, 1);

  // Terracotta Roof Tiles (64x64 scalloped shingles)
  var texRoofRed = makePixelTex(64, 64, function (g, w, h) {
    g.fillStyle = "#a84434";
    g.fillRect(0, 0, w, h);
    for (var y = 0; y < 64; y += 8) {
      var off = (y / 8) % 2 === 0 ? 0 : 6;
      for (var x = -8; x < 64; x += 12) {
        g.fillStyle = ((x + y) % 24 === 0) ? "#c25542" : "#9c3c2e";
        g.fillRect(x + off, y, 10, 6);
        g.fillStyle = "#d9755f";
        g.fillRect(x + off + 1, y, 8, 1);
        g.fillStyle = "#6a2219";
        g.fillRect(x + off, y + 6, 11, 2);
      }
    }
  }, 3, 3);

  // Royal Indigo & Gold Slate Roof (Observatory Spires)
  var texRoofIndigo = makePixelTex(64, 64, function (g, w, h) {
    g.fillStyle = "#2b3e6e";
    g.fillRect(0, 0, w, h);
    for (var y = 0; y < 64; y += 8) {
      var off = (y / 8) % 2 === 0 ? 0 : 6;
      for (var x = -8; x < 64; x += 12) {
        g.fillStyle = ((x + y) % 24 === 0) ? "#3b5491" : "#24355e";
        g.fillRect(x + off, y, 10, 6);
        g.fillStyle = "#182442";
        g.fillRect(x + off, y + 6, 11, 2);
      }
    }
    g.fillStyle = "#ecc562";
    g.fillRect(0, 56, 64, 5);
    g.fillStyle = "#fff1b8";
    g.fillRect(0, 56, 64, 2);
  }, 2, 2);

  // Stained Spectral Rose Window Texture (64x64)
  var texRoseWindow = makePixelTex(64, 64, function (g) {
    g.fillStyle = "#1c2541";
    g.fillRect(0, 0, 64, 64);
    var cols = ["#f472b6", "#fb923c", "#facc15", "#4ade80", "#38bdf8", "#818cf8", "#c084fc"];
    for (var i = 0; i < 14; i++) {
      var a1 = (i / 14) * Math.PI * 2;
      var a2 = ((i + 1) / 14) * Math.PI * 2;
      g.beginPath();
      g.moveTo(32, 32);
      g.arc(32, 32, 27, a1, a2);
      g.closePath();
      g.fillStyle = cols[i % cols.length];
      g.fill();
    }
    g.strokeStyle = "#f4d378";
    g.lineWidth = 4;
    g.beginPath(); g.arc(32, 32, 27, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(32, 32, 11, 0, Math.PI * 2); g.fillStyle = "#fff8d6"; g.fill(); g.stroke();
  });

  // Sparkling Pixel Water & Waterfall
  var texWater = makePixelTex(64, 64, function (g, w, h) {
    g.fillStyle = "#3489c7";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#4aa4df";
    for (var i = 0; i < 22; i++) {
      g.fillRect((i * 17) % 52, (i * 11) % 60, 12, 2);
    }
    g.fillStyle = "#b8ecff";
    g.fillRect(8, 12, 8, 2);
    g.fillRect(36, 30, 10, 2);
    g.fillRect(18, 50, 9, 2);
  }, 3, 10);

  var texWaterfall = makePixelTex(32, 64, function (g) {
    g.fillStyle = "#5cb4ea";
    g.fillRect(0, 0, 32, 64);
    for (var x = 2; x < 30; x += 4) {
      g.fillStyle = (x % 8 === 2) ? "#a7e3ff" : "#80cdf7";
      g.fillRect(x, 0, 2, 64);
    }
    g.fillStyle = "#ffffff";
    for (var i = 0; i < 16; i++) {
      g.fillRect((i * 7) % 28, (i * 13) % 58, 3, 6);
    }
  }, 1, 2);

  // ---------- High-Detail 24x32 Outlined 16-bit Pixel Sprites ----------
  function makeHeroSpriteTex(palette, stepFrame, facing) {
    return makePixelTex(24, 32, function (g) {
      g.clearRect(0, 0, 24, 32);
      var bob = stepFrame === 1 ? -1 : 0;
      var O = "#1b1d2e"; // Crisp dark outline
      function r(x, y, w, h, col) {
        g.fillStyle = col;
        g.fillRect(x, y + bob, w, h);
      }

      // Shadowed Outline Silhouette for Head
      r(7, 2, 10, 1, O);
      r(6, 3, 12, 10, O);
      // Hair Base & Highlight
      r(7, 3, 10, 5, palette.hair);
      r(8, 3, 6, 2, palette.hairHi || palette.hair);
      if (palette.hat) {
        r(4, 3, 16, 2, O);
        r(5, 3, 14, 2, palette.hat);
        r(7, 1, 10, 2, palette.hat);
        r(8, 1, 8, 1, palette.accent);
      }

      // Face
      if (facing === "back") {
        r(7, 6, 10, 6, palette.hair);
        r(8, 7, 8, 2, palette.hairHi || palette.hair);
      } else {
        var es = facing === "right" ? 1 : (facing === "left" ? -1 : 0);
        r(7, 6, 10, 6, palette.skin);
        r(7, 11, 10, 1, "#e2b289"); // Chin shade
        // Eyes
        r(8 + es, 8, 2, 2, "#191f36");
        r(14 + es, 8, 2, 2, "#191f36");
        r(8 + es, 8, 1, 1, "#ffffff"); // Eye glint
        r(14 + es, 8, 1, 1, "#ffffff");
        // Glasses
        if (palette.glasses) {
          r(7 + es, 7, 4, 1, "#334155");
          r(13 + es, 7, 4, 1, "#334155");
          r(11 + es, 8, 2, 1, "#334155");
          r(8 + es, 8, 2, 2, "rgba(125,211,252,0.35)");
          r(14 + es, 8, 2, 2, "rgba(125,211,252,0.35)");
        }
      }

      // Torso & Scholar Cloak Outline
      r(5, 13, 14, 11, O);
      // Scarf / Collar
      r(6, 13, 12, 2, palette.accent);
      r(14, 14, 3, 4, palette.accent); // Scarf tail
      // Coat + Inner Shirt + Gold Trim
      r(6, 15, 12, 8, palette.coat);
      r(9, 15, 6, 8, palette.shirt);
      r(11, 15, 2, 8, palette.coatHi || palette.accent);
      // Cloak hem shade
      r(6, 22, 12, 1, palette.coatDark || O);

      // Arms swinging
      var aL = stepFrame === 1 ? 16 : (stepFrame === 2 ? 14 : 15);
      var aR = stepFrame === 2 ? 16 : (stepFrame === 1 ? 14 : 15);
      r(4, aL, 2, 6, O); r(5, aL + 1, 1, 4, palette.coat);
      r(18, aR, 2, 6, O); r(18, aR + 1, 1, 4, palette.coat);

      // Legs & Boots
      var lL = stepFrame === 1 ? 23 : 24;
      var lR = stepFrame === 2 ? 23 : 24;
      r(7, lL, 4, 5, O); r(8, lL, 2, 3, palette.pants); r(8, lL + 3, 2, 2, "#3b281c");
      r(13, lR, 4, 5, O); r(14, lR, 2, 3, palette.pants); r(14, lR + 3, 2, 2, "#3b281c");
    });
  }

  function makeCatSpriteTex(frame) {
    return makePixelTex(18, 16, function (g) {
      g.clearRect(0, 0, 18, 16);
      var b = frame % 2 === 1 ? -1 : 0;
      var O = "#1e2235";
      function r(x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y + b, w, h); }
      // Outline
      r(3, 2, 3, 3, O); r(8, 2, 3, 3, O);
      r(3, 4, 8, 6, O); r(6, 6, 9, 6, O);
      // White Fur
      r(4, 3, 2, 2, "#ffffff"); r(9, 3, 2, 2, "#ffffff");
      r(4, 4, 1, 1, "#f9a8d4"); r(9, 4, 1, 1, "#f9a8d4");
      r(4, 5, 6, 4, "#ffffff");
      r(6, 7, 8, 4, "#f8fafc");
      r(6, 10, 8, 1, "#cbd5e1");
      // Eyes & Red Collar
      r(5, 6, 1, 2, "#1e293b"); r(8, 6, 1, 2, "#1e293b");
      r(5, 9, 5, 1, "#ef4444"); r(7, 10, 1, 1, "#facc15");
      // Tail wag
      r(14, frame % 2 === 0 ? 4 : 5, 2, 4, O);
      r(14, frame % 2 === 0 ? 5 : 6, 1, 3, "#ffffff");
      // Paws
      r(5, 12, 2, 2, "#e2e8f0"); r(11, 12, 2, 2, "#e2e8f0");
    });
  }

  // ---------- Scene, Renderer, Camera (HD-2D Telephoto Framing) ----------
  var scene = new THREE.Scene();
  var fog = new THREE.FogExp2(0x9dc7e8, 0.0085);
  scene.fog = fog;

  var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
  else if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  canvasHost.appendChild(renderer.domElement);

  // 34 deg FOV gives the iconic Octopath / Aurelis miniature HD-2D look!
  var camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.5, 280);
  camera.position.set(0, 22, 42);

  // ---------- Gradient Sky Dome Shader ----------
  var skyUniforms = {
    topColor: { value: new THREE.Color(0x2a69b5) },
    midColor: { value: new THREE.Color(0x75b7ea) },
    bottomColor: { value: new THREE.Color(0xdbeeff) }
  };
  var skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: "varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: [
      "uniform vec3 topColor; uniform vec3 midColor; uniform vec3 bottomColor; varying vec3 vPos;",
      "void main(){",
      "  float h = normalize(vPos).y;",
      "  vec3 col = h > 0.0 ? mix(midColor, topColor, pow(clamp(h, 0.0, 1.0), 0.65)) : mix(midColor, bottomColor, pow(clamp(-h * 2.5, 0.0, 1.0), 0.6));",
      "  gl_FragColor = vec4(col, 1.0);",
      "}"
    ].join("\n")
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(160, 28, 20), skyMat));

  // Celestial Sun / Moon Glow Sprite in Sky
  var celestialMat = new THREE.SpriteMaterial({ map: texGlowGold, transparent: true, blending: THREE.AdditiveBlending, fog: false });
  var celestialSprite = new THREE.Sprite(celestialMat);
  celestialSprite.scale.set(22, 22, 1);
  scene.add(celestialSprite);

  // Stars
  var starCount = 340;
  var starPos = new Float32Array(starCount * 3);
  for (var si = 0; si < starCount; si++) {
    var th = Math.random() * Math.PI * 2;
    var ph = Math.random() * Math.PI * 0.44;
    var sr = 128 + Math.random() * 14;
    starPos[si * 3] = sr * Math.sin(ph) * Math.cos(th);
    starPos[si * 3 + 1] = sr * Math.cos(ph) + 6;
    starPos[si * 3 + 2] = sr * Math.sin(ph) * Math.sin(th);
  }
  var starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  var starMat = new THREE.PointsMaterial({ color: 0xfff8dc, size: 1.25, transparent: true, opacity: 0, fog: false });
  scene.add(new THREE.Points(starGeo, starMat));

  // ---------- Lights ----------
  var hemiLight = new THREE.HemisphereLight(0xd2ebff, 0x4f6d43, 0.88);
  scene.add(hemiLight);

  var sunLight = new THREE.DirectionalLight(0xfff4d6, 1.5);
  sunLight.position.set(22, 32, 18);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 4;
  sunLight.shadow.camera.far = 110;
  sunLight.shadow.camera.left = -32;
  sunLight.shadow.camera.right = 32;
  sunLight.shadow.camera.top = 32;
  sunLight.shadow.camera.bottom = -32;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  var warmPointLights = [];
  var glowSprites = [];
  var lampBulbs = [];

  // ---------- Materials ----------
  var matGrass = new THREE.MeshStandardMaterial({ map: texGrass, roughness: 0.92 });
  var matCliff = new THREE.MeshStandardMaterial({ map: texCliff, roughness: 0.95 });
  var matPlaza = new THREE.MeshStandardMaterial({ map: texPlaza, roughness: 0.82 });
  var matStone = new THREE.MeshStandardMaterial({ map: texStoneWall, roughness: 0.84 });
  var matWood = new THREE.MeshStandardMaterial({ map: texWood, roughness: 0.86 });
  var matCottage = new THREE.MeshStandardMaterial({ map: texCottageWall, roughness: 0.84 });
  var matRoofRed = new THREE.MeshStandardMaterial({ map: texRoofRed, roughness: 0.8 });
  var matRoofIndigo = new THREE.MeshStandardMaterial({ map: texRoofIndigo, roughness: 0.5, metalness: 0.22 });
  var matGold = new THREE.MeshStandardMaterial({ color: 0xf4c756, roughness: 0.32, metalness: 0.62 });
  var matIvory = new THREE.MeshStandardMaterial({ color: 0xf0e9db, roughness: 0.78 });
  var matDarkWood = new THREE.MeshStandardMaterial({ color: 0x56341d, roughness: 0.9 });
  var matWater = new THREE.MeshStandardMaterial({ map: texWater, roughness: 0.14, metalness: 0.18, transparent: true, opacity: 0.88 });
  var matWaterfall = new THREE.MeshBasicMaterial({ map: texWaterfall, transparent: true, opacity: 0.82 });

  var worldGroup = new THREE.Group();
  scene.add(worldGroup);
  var clickableLandmarks = [];
  var groundMeshes = [];

  function addMesh(geo, mat, x, y, z, cast, recv, parent) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = cast !== false;
    m.receiveShadow = recv !== false;
    (parent || worldGroup).add(m);
    return m;
  }
  function addBox(w, h, d, mat, x, y, z, cast, recv, parent) {
    return addMesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, cast, recv, parent);
  }

  // Ornamental Stone Balustrade helper
  function addBalustrade(x1, z1, x2, z2, baseY) {
    var dx = x2 - x1, dz = z2 - z1;
    var len = Math.hypot(dx, dz);
    var angle = Math.atan2(dx, dz);
    var g = new THREE.Group();
    g.position.set((x1 + x2) / 2, baseY, (z1 + z2) / 2);
    g.rotation.y = angle;
    // Top rail & bottom curb
    addBox(0.24, 0.12, len, matIvory, 0, 0.78, 0, true, true, g);
    addBox(0.28, 0.16, len, matStone, 0, 0.08, 0, true, true, g);
    // Balusters
    var count = Math.max(2, Math.floor(len / 0.95));
    for (var i = 0; i <= count; i++) {
      var pz = -len / 2 + (i / count) * len;
      var isEnd = i === 0 || i === count;
      addBox(isEnd ? 0.34 : 0.14, isEnd ? 0.92 : 0.65, isEnd ? 0.34 : 0.14, matIvory, 0, isEnd ? 0.46 : 0.42, pz, true, true, g);
      if (isEnd) {
        addMesh(new THREE.SphereGeometry(0.18, 6, 6), matGold, 0, 1.02, pz, true, false, g);
      }
    }
    worldGroup.add(g);
  }

  // Ornate Lantern Post with Additive Glow Halo
  function addLanternPost(x, z) {
    var by = getGroundY(x, z);
    addBox(0.22, 2.5, 0.22, matDarkWood, x, by + 1.25, z);
    addBox(0.42, 0.2, 0.42, matStone, x, by + 0.1, z);
    addBox(0.62, 0.12, 0.62, matDarkWood, x, by + 2.55, z);
    addMesh(new THREE.ConeGeometry(0.45, 0.32, 4), matRoofIndigo, x, by + 2.75, z, true, false).rotation.y = Math.PI / 4;
    var bMat = new THREE.MeshStandardMaterial({ color: 0xfff0b8, emissive: 0xffb347, emissiveIntensity: 0.7, roughness: 0.15 });
    lampBulbs.push(bMat);
    addBox(0.34, 0.42, 0.34, bMat, x, by + 2.28, z, false, false);
    var haloMat = new THREE.SpriteMaterial({ map: texGlowWarm, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.35, depthWrite: false });
    var halo = new THREE.Sprite(haloMat);
    halo.position.set(x, by + 2.28, z);
    halo.scale.set(2.4, 2.4, 1);
    worldGroup.add(halo);
    glowSprites.push({ mat: haloMat, minOp: 0.15, maxOp: 0.85 });

    var pl = new THREE.PointLight(0xffb554, 0, 10.5, 1.5);
    pl.position.set(x, by + 2.3, z);
    worldGroup.add(pl);
    warmPointLights.push({ light: pl, maxIntensity: 3.4 });
  }

  // Glowing Interactive Rune Ring
  var runeRings = [];
  function addRuneCircle(x, z, colorHex, zoneId) {
    var by = getGroundY(x, z);
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.32, 28),
      new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.82 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, by + 0.08, z);
    ring.userData.zoneId = zoneId;
    worldGroup.add(ring);
    runeRings.push(ring);
    clickableLandmarks.push(ring);
  }

  // ==========================================================================
  // 1. MULTI-TIER FLOATING ISLAND BASE, WATERFALLS, DISTANT MOUNTAINS & CLOUDS
  // ==========================================================================
  // Mid Main Island Platform (y = 1.0 top)
  var midGround = addBox(40, 1.4, 22, matGrass, 0, 0.3, -1.5, false, true);
  groundMeshes.push(midGround);
  addBox(39, 3.6, 21.2, matCliff, 0, -2.2, -1.5, false, true);
  addBox(31, 4.2, 17, matCliff, 0, -6.0, -1.5, false, false);
  addBox(20, 4.6, 12, matCliff, 0, -10.2, -1.5, false, false);

  // North Upper Observatory Terrace (y = 2.4 top)
  var northGround = addBox(28, 2.8, 12, matPlaza, 0, 1.0, -16.5, true, true);
  groundMeshes.push(northGround);
  addBox(27, 4.0, 11.4, matCliff, 0, -2.4, -16.5, false, true);
  addBox(20, 4.2, 8.8, matCliff, 0, -6.5, -16.5, false, false);

  // Grand North Stone Staircase (connecting y=1.0 -> y=2.4)
  for (var ns = 0; ns < 7; ns++) {
    var sy = 1.0 + (ns + 1) * 0.2;
    var sz = -6.7 - ns * 0.58;
    var step = addBox(6.8, 0.22, 0.65, matIvory, 0, sy - 0.1, sz, true, true);
    groundMeshes.push(step);
  }
  addBalustrade(-3.5, -6.5, -3.5, -10.5, 1.5);
  addBalustrade(3.5, -6.5, 3.5, -10.5, 1.5);
  addBalustrade(-13.8, -10.6, -3.8, -10.6, 2.4);
  addBalustrade(3.8, -10.6, 13.8, -10.6, 2.4);

  // Twin Cascades pouring from North Terrace into the Creek & Cloud Sea!
  var waterfalls = [];
  [-7.8, 7.5].forEach(function (wx) {
    var wf1 = addMesh(new THREE.PlaneGeometry(2.6, 10.5), matWaterfall, wx, -2.2, -10.45, false, false);
    waterfalls.push(wf1);
    // Water pool crest at top
    addBox(3.0, 0.16, 1.6, matWater, wx, 2.42, -11.1, false, true);
    // Mist puffs at bottom
    var mist = new THREE.Sprite(new THREE.SpriteMaterial({ map: texMist, transparent: true, opacity: 0.65, depthWrite: false }));
    mist.position.set(wx, -6.2, -10.2);
    mist.scale.set(5.2, 3.2, 1);
    worldGroup.add(mist);
  });

  // South Lower Campfire Overlook Terrace (y = 0.0 top)
  var southGround = addBox(16, 1.4, 9.2, matGrass, 0, -0.7, 13.6, false, true);
  groundMeshes.push(southGround);
  addBox(15, 3.2, 8.6, matCliff, 0, -3.0, 13.6, false, true);
  addBox(10, 3.6, 6.2, matCliff, 0, -6.4, 13.6, false, false);
  // South Steps (y=1.0 -> y=0.0)
  for (var ss = 0; ss < 5; ss++) {
    var sStep = addBox(5.2, 0.22, 0.56, matIvory, 0, 0.9 - ss * 0.2, 7.7 + ss * 0.52, true, true);
    groundMeshes.push(sStep);
  }
  addBalustrade(-7.8, 18.0, 7.8, 18.0, 0.0);
  addBalustrade(-7.8, 9.8, -7.8, 18.0, 0.0);
  addBalustrade(7.8, 9.8, 7.8, 18.0, 0.0);

  // Creek & Ornamental Stone Arch Bridge on East Side (x = 7.5)
  addBox(3.6, 0.16, 22, matWater, 7.5, 0.96, -1.5, false, true);
  addBox(0.45, 0.3, 22, matStone, 5.55, 1.08, -1.5, true, true);
  addBox(0.45, 0.3, 22, matStone, 9.45, 1.08, -1.5, true, true);
  // South creek waterfall off the cliff edge!
  var wfSouth = addMesh(new THREE.PlaneGeometry(3.4, 12), matWaterfall, 7.5, -5.0, 9.55, false, false);
  waterfalls.push(wfSouth);

  // Arched Stone & Timber Bridge
  for (var bi = -4; bi <= 4; bi++) {
    var bx = 7.5 + bi * 0.52;
    var bu = bi / 4.2;
    var by = 1.02 + (1 - bu * bu) * 0.55;
    var bDeck = addBox(0.56, 0.24, 3.4, matWood, bx, by, -1.6, true, true);
    groundMeshes.push(bDeck);
    // Arched side parapet posts
    if (bi % 2 === 0) {
      addBox(0.22, 0.78, 0.22, matIvory, bx, by + 0.45, -3.2, true, true);
      addBox(0.22, 0.78, 0.22, matIvory, bx, by + 0.45, 0.0, true, true);
    }
  }
  addBox(4.8, 0.12, 0.22, matIvory, 7.5, 2.1, -3.2, true, true);
  addBox(4.8, 0.12, 0.22, matIvory, 7.5, 2.1, 0.0, true, true);

  // Central Plaza & Ornate Connecting Paths
  var plazaFloor = addBox(9.4, 0.16, 9.4, matPlaza, 0, 1.02, 0, false, true);
  groundMeshes.push(plazaFloor);
  groundMeshes.push(addBox(3.8, 0.14, 7.0, matPlaza, 0, 1.01, -6.5, false, true));
  groundMeshes.push(addBox(3.4, 0.14, 6.5, matPlaza, 0, 1.01, 6.2, false, true));
  groundMeshes.push(addBox(10.5, 0.14, 3.0, matPlaza, -8.5, 1.01, -1.4, false, true));
  groundMeshes.push(addBox(4.6, 0.14, 3.0, matPlaza, 11.8, 1.01, -1.6, false, true));

  // Decorative Golden Star Compass Inlay on Central Plaza
  var starRing = new THREE.Mesh(new THREE.RingGeometry(2.8, 3.08, 32), new THREE.MeshBasicMaterial({ color: 0xe6c166, side: THREE.DoubleSide }));
  starRing.rotation.x = -Math.PI / 2;
  starRing.position.set(0, 1.12, 0);
  worldGroup.add(starRing);

  // ==========================================================================
  // 2. LANDMARK 1 — CENTRAL ARRIVAL PLAZA (HOME)
  // ==========================================================================
  addRuneCircle(0, -1.4, 0xffd86b, "home");
  var steleBase = addBox(2.0, 0.45, 1.1, matStone, 0, 1.25, -2.9);
  var stele = addBox(1.5, 2.2, 0.55, matIvory, 0, 2.5, -2.9);
  stele.userData.zoneId = "home";
  clickableLandmarks.push(stele, steleBase);
  addBox(1.7, 0.2, 0.72, matGold, 0, 3.65, -2.9);
  var steleGem = addMesh(
    new THREE.OctahedronGeometry(0.42, 0),
    new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x38bdf8, emissiveIntensity: 0.95, roughness: 0.15 }),
    0, 4.35, -2.9, false, false
  );
  steleGem.userData.zoneId = "home";
  clickableLandmarks.push(steleGem);

  addLanternPost(-4.3, -4.3);
  addLanternPost(4.3, -4.3);
  addLanternPost(-4.3, 4.3);
  addLanternPost(4.3, 4.3);

  // ==========================================================================
  // 3. LANDMARK 2 — WEST SCHOLAR COTTAGE & COURTYARD (ABOUT)
  // ==========================================================================
  addRuneCircle(-11.8, -1.2, 0x7dd3fc, "about");
  var cotG = new THREE.Group();
  cotG.position.set(-15.2, 1.0, -2.0);
  // Stone foundation
  addBox(6.8, 0.7, 5.8, matStone, 0, 0.35, 0, true, true, cotG);
  // Half-timbered ground & upper floors
  var cotBody = addBox(6.2, 3.4, 5.2, matCottage, 0, 2.35, 0, true, true, cotG);
  cotBody.userData.zoneId = "about";
  clickableLandmarks.push(cotBody);
  // Overhanging gabled attic
  var cotUpper = addBox(6.6, 1.6, 5.6, matCottage, 0, 4.4, 0, true, true, cotG);
  cotUpper.userData.zoneId = "about";
  clickableLandmarks.push(cotUpper);
  // Pitched Terracotta Roof + Ridge Beam
  var cotRoof = addMesh(new THREE.ConeGeometry(5.3, 3.2, 4), matRoofRed, 0, 6.65, 0, true, true, cotG);
  cotRoof.rotation.y = Math.PI / 4;
  cotRoof.scale.set(1.08, 1, 0.94);
  cotRoof.userData.zoneId = "about";
  clickableLandmarks.push(cotRoof);
  // Stone Chimney + Rising Smoke Puffs
  addBox(1.0, 3.6, 1.0, matStone, -1.9, 6.2, -1.2, true, true, cotG);
  addBox(1.2, 0.25, 1.2, matIvory, -1.9, 8.05, -1.2, true, true, cotG);
  // Timber Porch Awning & Door
  addBox(1.4, 2.2, 0.24, matDarkWood, 3.12, 1.8, 0.4, true, true, cotG);
  addBox(1.6, 0.22, 2.4, matRoofRed, 3.7, 3.1, 0.4, true, true, cotG);
  addBox(0.18, 2.4, 0.18, matDarkWood, 4.3, 1.8, -0.65, true, true, cotG);
  addBox(0.18, 2.4, 0.18, matDarkWood, 4.3, 1.8, 1.45, true, true, cotG);
  // Warm Glowing Paned Windows
  var winMat = new THREE.MeshStandardMaterial({ color: 0xfff2be, emissive: 0xffb347, emissiveIntensity: 0.95, roughness: 0.15 });
  lampBulbs.push(winMat);
  [[3.14, 2.3, -1.3, 0.18, 1.1, 1.1], [3.14, 4.4, 0.0, 0.18, 0.95, 1.2], [0.8, 2.3, 2.64, 1.2, 1.1, 0.18]].forEach(function (w) {
    addBox(w[3], w[4], w[5], winMat, w[0], w[1], w[2], false, false, cotG);
  });
  var cotGlow = new THREE.PointLight(0xffb55a, 0, 12, 1.5);
  cotGlow.position.set(-11.2, 3.4, -2.0);
  worldGroup.add(cotGlow);
  warmPointLights.push({ light: cotGlow, maxIntensity: 3.8 });
  worldGroup.add(cotG);
  addLanternPost(-10.5, 0.9);

  // Chimney Smoke Particles
  var smokePuffs = [];
  for (var sm = 0; sm < 6; sm++) {
    var puff = new THREE.Sprite(new THREE.SpriteMaterial({ map: texMist, transparent: true, opacity: 0.45, depthWrite: false }));
    puff.scale.set(1.1, 1.1, 1);
    worldGroup.add(puff);
    smokePuffs.push({ sprite: puff, phase: sm / 6 });
  }

  // ==========================================================================
  // 4. LANDMARK 3 — NORTH GOTHIC SPECTRAL OBSERVATORY (RESEARCH)
  // ==========================================================================
  addRuneCircle(0, -13.0, 0xc084fc, "research");
  var towG = new THREE.Group();
  towG.position.set(0, 2.4, -17.5);

  // Grand Podium & Twin Stair Pedestals
  addBox(14.0, 1.0, 8.8, matIvory, 0, 0.5, 0, true, true, towG);

  // Central Cathedral Hall + Octagonal Observatory Spire
  var mainHall = addBox(8.6, 6.2, 6.2, matStone, 0, 4.1, 0, true, true, towG);
  mainHall.userData.zoneId = "research";
  clickableLandmarks.push(mainHall);

  // Glowing Spectral Rose Window on Facade!
  var roseWin = addMesh(
    new THREE.CircleGeometry(1.45, 24),
    new THREE.MeshBasicMaterial({ map: texRoseWindow }),
    0, 5.1, 3.16, false, false, towG
  );
  roseWin.userData.zoneId = "research";
  clickableLandmarks.push(roseWin);

  // Grand Arched Entrance & Golden Pediment
  addBox(2.4, 3.0, 0.45, matDarkWood, 0, 2.4, 3.08, true, true, towG);
  addBox(3.0, 0.28, 0.65, matGold, 0, 3.95, 3.15, true, true, towG);

  // Royal Blue & Gold Banners flanking entrance
  [-2.8, 2.8].forEach(function (bx) {
    addBox(0.85, 2.9, 0.12, new THREE.MeshStandardMaterial({ color: 0x1e3f8a, roughness: 0.65 }), bx, 3.5, 3.22, true, true, towG);
    addBox(0.95, 0.22, 0.16, matGold, bx, 4.95, 3.22, true, true, towG);
  });

  // Central Tall Multi-Tier Observatory Spire
  var spireBase = addMesh(new THREE.CylinderGeometry(2.6, 2.9, 4.6, 8), matIvory, 0, 9.2, 0, true, true, towG);
  spireBase.userData.zoneId = "research";
  clickableLandmarks.push(spireBase);
  addMesh(new THREE.CylinderGeometry(3.0, 2.8, 0.5, 8), matGold, 0, 11.6, 0, true, true, towG);
  var spireDome = addMesh(new THREE.ConeGeometry(2.85, 5.8, 8), matRoofIndigo, 0, 14.7, 0, true, true, towG);
  spireDome.userData.zoneId = "research";
  clickableLandmarks.push(spireDome);

  // 4 Flanking Gothic Needle Spires (Aurelis-inspired silhouette!)
  [[-5.2, 1.4, 6.2, 4.4], [5.2, 1.4, 6.2, 4.4], [-3.8, -2.0, 8.2, 5.0], [3.8, -2.0, 8.2, 5.0]].forEach(function (sp) {
    var col = addMesh(new THREE.CylinderGeometry(1.05, 1.25, sp[2], 8), matStone, sp[0], 1.0 + sp[2] / 2, sp[1], true, true, towG);
    col.userData.zoneId = "research";
    clickableLandmarks.push(col);
    addMesh(new THREE.CylinderGeometry(1.25, 1.15, 0.35, 8), matGold, sp[0], 1.0 + sp[2], sp[1], true, true, towG);
    addMesh(new THREE.ConeGeometry(1.3, sp[3], 8), matRoofIndigo, sp[0], 1.0 + sp[2] + sp[3] / 2, sp[1], true, true, towG);
    addMesh(new THREE.SphereGeometry(0.24, 6, 6), matGold, sp[0], 1.0 + sp[2] + sp[3] + 0.15, sp[1], false, false, towG);
  });

  // Floating Spectral Prism, Dual Golden Armillary Rings & Sky Beam
  var prismMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0x7dd3fc, emissiveIntensity: 1.4, roughness: 0.1 });
  var spectralPrism = addMesh(new THREE.OctahedronGeometry(0.9, 0), prismMat, 0, 19.2, 0, false, false, towG);
  var haloRing1 = addMesh(new THREE.TorusGeometry(2.1, 0.09, 8, 32), new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.9 }), 0, 19.2, 0, false, false, towG);
  haloRing1.rotation.x = Math.PI / 2.6;
  var haloRing2 = addMesh(new THREE.TorusGeometry(1.45, 0.06, 8, 28), new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.85 }), 0, 19.2, 0, false, false, towG);
  haloRing2.rotation.y = Math.PI / 3;

  var prismHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texGlowCyan, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.85, depthWrite: false }));
  prismHalo.position.set(0, 19.2, 0);
  prismHalo.scale.set(7.5, 7.5, 1);
  towG.add(prismHalo);

  var skyBeam = addMesh(
    new THREE.CylinderGeometry(0.22, 0.85, 48, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }),
    0, 42, 0, false, false, towG
  );
  worldGroup.add(towG);
  addLanternPost(-4.2, -12.0);
  addLanternPost(4.2, -12.0);

  // ==========================================================================
  // 5. LANDMARK 4 — EAST STARLIGHT PAVILION (NOTES & GALLERY)
  // ==========================================================================
  addRuneCircle(12.6, -1.6, 0x6ee7b7, "gallery");
  var galG = new THREE.Group();
  galG.position.set(15.2, 1.0, -1.8);
  var galBase = addMesh(new THREE.CylinderGeometry(3.4, 3.7, 0.55, 8), matIvory, 0, 0.28, 0, true, true, galG);
  galBase.userData.zoneId = "gallery";
  clickableLandmarks.push(galBase);

  for (var gi = 0; gi < 6; gi++) {
    var ga = (gi / 6) * Math.PI * 2;
    var gx = Math.cos(ga) * 2.75, gz = Math.sin(ga) * 2.75;
    var gCol = addMesh(new THREE.CylinderGeometry(0.2, 0.24, 3.4, 8), matIvory, gx, 2.2, gz, true, true, galG);
    gCol.userData.zoneId = "gallery";
    clickableLandmarks.push(gCol);
    addBox(0.5, 0.22, 0.5, matGold, gx, 3.9, gz, true, true, galG);
  }
  addMesh(new THREE.CylinderGeometry(3.2, 3.2, 0.35, 8), matIvory, 0, 4.1, 0, true, true, galG);
  var galDome = addMesh(new THREE.SphereGeometry(2.9, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), matGold, 0, 4.2, 0, true, true, galG);
  galDome.userData.zoneId = "gallery";
  clickableLandmarks.push(galDome);
  addMesh(new THREE.ConeGeometry(0.28, 1.1, 6), matGold, 0, 7.5, 0, false, false, galG);

  // Painting Easel & Warm Lantern inside Pavilion
  var easel = addBox(1.8, 1.5, 0.16, matWood, 0, 1.75, 0, true, true, galG);
  easel.rotation.y = -Math.PI / 5;
  easel.userData.zoneId = "gallery";
  clickableLandmarks.push(easel);
  var art = addBox(1.5, 1.15, 0.2, new THREE.MeshStandardMaterial({ map: texRoseWindow, emissive: 0x38bdf8, emissiveIntensity: 0.25 }), 0, 1.75, 0, false, false, galG);
  art.rotation.y = -Math.PI / 5;
  worldGroup.add(galG);
  addLanternPost(11.4, 0.9);

  // ==========================================================================
  // 6. LANDMARK 5 — SOUTH CAMPFIRE OVERLOOK TERRACE (CONTACT)
  // ==========================================================================
  addRuneCircle(0, 11.6, 0xfb923c, "contact");
  var deck = addBox(8.6, 0.24, 6.0, matWood, 0, 0.12, 14.0, true, true);
  groundMeshes.push(deck);
  for (var fi = 0; fi < 10; fi++) {
    var fa = (fi / 10) * Math.PI * 2;
    addBox(0.42, 0.34, 0.42, matStone, Math.cos(fa) * 1.0, 0.36, 14.2 + Math.sin(fa) * 1.0);
  }
  var flameCore = addMesh(new THREE.ConeGeometry(0.45, 1.25, 5), new THREE.MeshBasicMaterial({ color: 0xfff3b0 }), 0, 0.9, 14.2, false, false);
  flameCore.userData.zoneId = "contact";
  clickableLandmarks.push(flameCore);
  var flameOuter = addMesh(new THREE.ConeGeometry(0.68, 1.48, 5), new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.78 }), 0, 0.95, 14.2, false, false);
  var fireHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texGlowWarm, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.78, depthWrite: false }));
  fireHalo.position.set(0, 1.25, 14.2);
  fireHalo.scale.set(4.6, 4.6, 1);
  worldGroup.add(fireHalo);
  var campLight = new THREE.PointLight(0xff7d29, 2.8, 15, 1.4);
  campLight.position.set(0, 1.8, 14.2);
  worldGroup.add(campLight);

  addBox(2.4, 0.44, 0.68, matDarkWood, -2.7, 0.44, 14.2);
  addBox(2.4, 0.44, 0.68, matDarkWood, 2.7, 0.44, 14.2);
  var mailbox = addBox(0.65, 0.55, 0.85, new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 }), 3.2, 1.22, 11.4);
  mailbox.userData.zoneId = "contact";
  clickableLandmarks.push(mailbox);
  addBox(0.2, 1.0, 0.2, matDarkWood, 3.2, 0.55, 11.4);

  // ==========================================================================
  // 7. FOLIAGE (CYPRESSES, BLOSSOM TREES) + DISTANT FLOATING ISLETS & MOUNTAINS
  // ==========================================================================
  var matCypress1 = new THREE.MeshStandardMaterial({ color: 0x2a6136, roughness: 0.9 });
  var matCypress2 = new THREE.MeshStandardMaterial({ color: 0x397843, roughness: 0.9 });
  var matBlossom = new THREE.MeshStandardMaterial({ color: 0xf9b4cb, roughness: 0.85 });

  function addCypress(x, z, scale) {
    var by = getGroundY(x, z), s = scale || 1;
    var g = new THREE.Group();
    g.position.set(x, by, z);
    addBox(0.36 * s, 1.2 * s, 0.36 * s, matDarkWood, 0, 0.6 * s, 0, true, true, g);
    addMesh(new THREE.ConeGeometry(1.25 * s, 2.3 * s, 6), matCypress1, 0, 2.0 * s, 0, true, true, g);
    addMesh(new THREE.ConeGeometry(0.95 * s, 2.1 * s, 6), matCypress2, 0, 3.2 * s, 0, true, true, g);
    addMesh(new THREE.ConeGeometry(0.62 * s, 1.6 * s, 6), matCypress1, 0, 4.3 * s, 0, true, true, g);
    worldGroup.add(g);
  }

  function addBlossomTree(x, z, scale) {
    var by = getGroundY(x, z), s = scale || 1;
    var g = new THREE.Group();
    g.position.set(x, by, z);
    addBox(0.42 * s, 1.7 * s, 0.42 * s, matDarkWood, 0, 0.85 * s, 0, true, true, g);
    addMesh(new THREE.DodecahedronGeometry(1.45 * s, 0), matBlossom, 0, 2.4 * s, 0, true, true, g);
    addMesh(new THREE.DodecahedronGeometry(1.0 * s, 0), matBlossom, 0.9 * s, 2.0 * s, 0.4 * s, true, true, g);
    addMesh(new THREE.DodecahedronGeometry(0.95 * s, 0), matBlossom, -0.85 * s, 2.1 * s, -0.3 * s, true, true, g);
    worldGroup.add(g);
  }

  [
    [-18, -9, 1.2], [-15, -10.5, 1.05], [-10.5, -9, 0.95],
    [11.5, -9.5, 1.1], [16, -9, 1.25], [18, -5, 1.0],
    [-17, 6.5, 1.15], [-12.5, 7.5, 1.05], [-7.5, 7.2, 0.9],
    [12, 6.5, 1.1], [16.5, 7.2, 1.2], [-6.2, 15.5, 1.05], [6.2, 15.5, 1.1]
  ].forEach(function (t) { addCypress(t[0], t[1], t[2]); });

  [[-10.2, -5.8, 1.0], [11.2, 4.2, 0.95], [-17.2, 2.6, 1.05], [18.2, 1.8, 1.0]].forEach(function (t) {
    addBlossomTree(t[0], t[1], t[2]);
  });

  // Distant Floating Sanctuary Islets (with mini golden temples!)
  var floatingIslets = [];
  function addDistantIslet(x, y, z, s) {
    var g = new THREE.Group();
    g.position.set(x, y, z);
    addBox(s, s * 0.24, s, matGrass, 0, 0, 0, false, false, g);
    var rock = addMesh(new THREE.ConeGeometry(s * 0.68, s * 1.45, 5), matCliff, 0, -s * 0.82, 0, false, false, g);
    rock.rotation.y = Math.PI / 5;
    // Mini spire shrine on islet
    addMesh(new THREE.CylinderGeometry(s * 0.16, s * 0.2, s * 0.65, 6), matIvory, 0, s * 0.42, 0, false, false, g);
    addMesh(new THREE.ConeGeometry(s * 0.22, s * 0.55, 6), matGold, 0, s * 0.98, 0, false, false, g);
    worldGroup.add(g);
    floatingIslets.push({ mesh: g, baseY: y, phase: Math.random() * 6.28 });
  }
  addDistantIslet(-32, 9, -28, 7.5);
  addDistantIslet(33, 12, -30, 8.5);
  addDistantIslet(-24, 15, -42, 6.5);
  addDistantIslet(26, 16, -45, 7.0);
  addDistantIslet(-36, 2, 8, 6.0);
  addDistantIslet(36, 4, 10, 6.5);

  // Distant Silhouette Snow Peaks
  var matPeak = new THREE.MeshStandardMaterial({ color: 0x7b93b8, roughness: 0.95 });
  var matSnow = new THREE.MeshStandardMaterial({ color: 0xeef5fc, roughness: 0.85 });
  [[-42, -72, 34, 46], [40, -76, 38, 52], [-10, -86, 42, 58], [68, -58, 28, 38], [-68, -54, 28, 36]].forEach(function (pk) {
    addMesh(new THREE.ConeGeometry(pk[2] * 0.55, pk[3], 5), matPeak, pk[0], pk[3] * 0.35 - 12, pk[1], false, false);
    addMesh(new THREE.ConeGeometry(pk[2] * 0.22, pk[3] * 0.36, 5), matSnow, pk[0], pk[3] * 0.68 - 12, pk[1], false, false);
  });

  // Cloud Sea below & Drifting Sky Clouds
  var clouds = [];
  var matCloud = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72 });
  for (var ci = 0; ci < 24; ci++) {
    var cg = new THREE.Group();
    var isSea = ci < 12;
    var w1 = isSea ? (12 + Math.random() * 14) : (5 + Math.random() * 6);
    addBox(w1, isSea ? 2.2 : 1.1, isSea ? 8 : 2.8, matCloud, 0, 0, 0, false, false, cg);
    addBox(w1 * 0.65, isSea ? 1.8 : 0.9, isSea ? 6 : 2.2, matCloud, 0.8, isSea ? 1.2 : 0.75, 0.4, false, false, cg);
    cg.position.set(
      (Math.random() - 0.5) * 120,
      isSea ? (-13 - Math.random() * 5) : (21 + Math.random() * 12),
      (Math.random() - 0.5) * 100 - 10
    );
    scene.add(cg);
    clouds.push({ mesh: cg, speed: (isSea ? 0.22 : 0.48) + Math.random() * 0.3 });
  }

  // Fireflies & Golden Atmospheric Motes
  var ffCount = 95;
  var ffPositions = new Float32Array(ffCount * 3);
  var ffSeeds = [];
  for (var ffi = 0; ffi < ffCount; ffi++) {
    var fx = (Math.random() - 0.5) * 38;
    var fy = 1.6 + Math.random() * 6.5;
    var fz = (Math.random() - 0.5) * 34;
    ffPositions[ffi * 3] = fx; ffPositions[ffi * 3 + 1] = fy; ffPositions[ffi * 3 + 2] = fz;
    ffSeeds.push({ x: fx, y: fy, z: fz, phase: Math.random() * 6.28 });
  }
  var ffGeo = new THREE.BufferGeometry();
  ffGeo.setAttribute("position", new THREE.BufferAttribute(ffPositions, 3));
  var ffMat = new THREE.PointsMaterial({ map: texGlowGold, color: 0xffe885, size: 0.78, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.45 });
  worldGroup.add(new THREE.Points(ffGeo, ffMat));

  // ==========================================================================
  // 8. HERO (LEI LIU 24x32), WHITE CAT & 4 SCHOLAR NPCs
  // ==========================================================================
  var heroPal = { hair: "#212942", hairHi: "#3d4d7a", skin: "#f7cfa6", coat: "#3262b5", coatHi: "#60a5fa", coatDark: "#1e3a6e", shirt: "#f8fafc", accent: "#facc15", pants: "#1f2937", glasses: true };
  var heroTex = {
    front: [makeHeroSpriteTex(heroPal, 0, "front"), makeHeroSpriteTex(heroPal, 1, "front"), makeHeroSpriteTex(heroPal, 2, "front")],
    back:  [makeHeroSpriteTex(heroPal, 0, "back"),  makeHeroSpriteTex(heroPal, 1, "back"),  makeHeroSpriteTex(heroPal, 2, "back")],
    left:  [makeHeroSpriteTex(heroPal, 0, "left"),  makeHeroSpriteTex(heroPal, 1, "left"),  makeHeroSpriteTex(heroPal, 2, "left")],
    right: [makeHeroSpriteTex(heroPal, 0, "right"), makeHeroSpriteTex(heroPal, 1, "right"), makeHeroSpriteTex(heroPal, 2, "right")]
  };
  var heroMat = new THREE.SpriteMaterial({ map: heroTex.front[0], transparent: true });
  var heroSprite = new THREE.Sprite(heroMat);
  heroSprite.scale.set(1.68, 2.24, 1);
  worldGroup.add(heroSprite);

  var heroShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.58, 18),
    new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.36 })
  );
  heroShadow.rotation.x = -Math.PI / 2;
  worldGroup.add(heroShadow);

  var catFrames = [makeCatSpriteTex(0), makeCatSpriteTex(1)];
  var catMat = new THREE.SpriteMaterial({ map: catFrames[0], transparent: true });
  var catSprite = new THREE.Sprite(catMat);
  catSprite.scale.set(1.02, 0.9, 1);
  worldGroup.add(catSprite);

  // NPCs around the island
  var npcSprites = [];
  [
    { zoneId: "about", x: -11.4, z: -2.4, pal: { hair: "#6b4423", hairHi: "#9a6638", skin: "#f4cca3", coat: "#8c4a2e", shirt: "#fef3c7", accent: "#38bdf8", pants: "#3b2f2f" } },
    { zoneId: "research", x: 2.3, z: -13.0, pal: { hair: "#e2e8f0", hairHi: "#ffffff", skin: "#f4cca3", coat: "#3730a3", shirt: "#e0e7ff", accent: "#fbbf24", pants: "#1e1b4b", hat: "#312e81" } },
    { zoneId: "gallery", x: 12.8, z: -2.7, pal: { hair: "#7c2d12", hairHi: "#b45309", skin: "#f4cca3", coat: "#15803d", shirt: "#dcfce7", accent: "#f472b6", pants: "#1f2937" } },
    { zoneId: "contact", x: -2.2, z: 12.4, pal: { hair: "#334155", hairHi: "#64748b", skin: "#f4cca3", coat: "#b45309", shirt: "#fef3c7", accent: "#f97316", pants: "#292524" } }
  ].forEach(function (n) {
    var by = getGroundY(n.x, n.z);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeHeroSpriteTex(n.pal, 0, "front"), transparent: true }));
    sp.scale.set(1.62, 2.16, 1);
    sp.position.set(n.x, by + 1.12, n.z);
    sp.userData.zoneId = n.zoneId;
    worldGroup.add(sp);
    clickableLandmarks.push(sp);
    npcSprites.push({ sprite: sp, baseY: by + 1.12, phase: Math.random() * 6.28 });
    var sh = new THREE.Mesh(new THREE.CircleGeometry(0.52, 14), new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.3 }));
    sh.rotation.x = -Math.PI / 2;
    sh.position.set(n.x, by + 0.08, n.z);
    worldGroup.add(sh);
  });

  var destMarker = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.52, 18),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide, transparent: true, opacity: 0 })
  );
  destMarker.rotation.x = -Math.PI / 2;
  worldGroup.add(destMarker);

  // ==========================================================================
  // 9. 4-PHASE ATMOSPHERIC DAY / NIGHT SYSTEM
  // ==========================================================================
  var TIME_PHASES = [
    {
      id: "morning", hour: "09:30", zh: "清晨", en: "Morning", icon: "☀", bar: 28,
      skyTop: 0x3b82c4, skyMid: 0x8ec8f2, skyBot: 0xfde8c8,
      fog: 0xb7d9f2, sunColor: 0xfff1cc, sunInt: 1.48, sunPos: [26, 22, 16],
      hemiSky: 0xdff1ff, hemiGround: 0x5c7a49, hemiInt: 0.9,
      lampFactor: 0.12, starOp: 0, ffOp: 0.22, isNight: false
    },
    {
      id: "day", hour: "14:00", zh: "晴昼", en: "Day", icon: "☀", bar: 52,
      skyTop: 0x1d64b8, skyMid: 0x6cb7f0, skyBot: 0xd9f0ff,
      fog: 0x99ccf2, sunColor: 0xffffff, sunInt: 1.62, sunPos: [14, 34, 18],
      hemiSky: 0xe6f4ff, hemiGround: 0x5b8047, hemiInt: 0.95,
      lampFactor: 0.0, starOp: 0, ffOp: 0.14, isNight: false
    },
    {
      id: "sunset", hour: "18:15", zh: "暮光", en: "Sunset", icon: "🌇", bar: 76,
      skyTop: 0x2c2857, skyMid: 0xc2616b, skyBot: 0xf7b277,
      fog: 0xd4856e, sunColor: 0xff9a52, sunInt: 1.38, sunPos: [-28, 12, 12],
      hemiSky: 0xffcca3, hemiGround: 0x4b3b54, hemiInt: 0.76,
      lampFactor: 0.85, starOp: 0.42, ffOp: 0.78, isNight: false
    },
    {
      id: "night", hour: "21:30", zh: "星夜", en: "Night", icon: "☾", bar: 92,
      skyTop: 0x090f24, skyMid: 0x182852, skyBot: 0x293b6b,
      fog: 0x162347, sunColor: 0x9cb8ff, sunInt: 0.72, sunPos: [-18, 28, -14],
      hemiSky: 0x4862a3, hemiGround: 0x1b243b, hemiInt: 0.58,
      lampFactor: 1.2, starOp: 0.95, ffOp: 1.0, isNight: true
    }
  ];

  function detectInitialPhaseIndex() {
    var h = new Date().getHours();
    if (h >= 6 && h < 11) return 0;
    if (h >= 11 && h < 17) return 1;
    if (h >= 17 && h < 19) return 2;
    return 3;
  }

  var phaseIndex = detectInitialPhaseIndex();
  var manualTimeOverride = false;

  function updateClockHUD() {
    var p = TIME_PHASES[phaseIndex];
    var l = getLang();
    if (clockTimeEl) {
      if (!manualTimeOverride) {
        var now = new Date();
        clockTimeEl.textContent = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
      } else {
        clockTimeEl.textContent = p.hour;
      }
    }
    if (clockPhaseEl) clockPhaseEl.textContent = p[l];
    if (clockIconEl) clockIconEl.textContent = p.icon;
    if (clockBarEl) clockBarEl.style.width = p.bar + "%";
  }

  function applyTimePhase(idx) {
    phaseIndex = (idx + TIME_PHASES.length) % TIME_PHASES.length;
    var p = TIME_PHASES[phaseIndex];
    skyUniforms.topColor.value.setHex(p.skyTop);
    skyUniforms.midColor.value.setHex(p.skyMid);
    skyUniforms.bottomColor.value.setHex(p.skyBot);
    fog.color.setHex(p.fog);
    sunLight.color.setHex(p.sunColor);
    sunLight.intensity = p.sunInt;
    sunLight.position.set(p.sunPos[0], p.sunPos[1], p.sunPos[2]);
    celestialSprite.position.set(p.sunPos[0] * 3.6, p.sunPos[1] * 2.8, p.sunPos[2] * 3.6 - 25);
    celestialMat.map = p.isNight ? texGlowCyan : texGlowGold;
    hemiLight.color.setHex(p.hemiSky);
    hemiLight.groundColor.setHex(p.hemiGround);
    hemiLight.intensity = p.hemiInt;
    starMat.opacity = p.starOp;
    ffMat.opacity = p.ffOp;

    for (var i = 0; i < warmPointLights.length; i++) {
      warmPointLights[i].light.intensity = warmPointLights[i].maxIntensity * p.lampFactor;
    }
    for (var j = 0; j < lampBulbs.length; j++) {
      lampBulbs[j].emissiveIntensity = 0.3 + p.lampFactor * 1.15;
    }
    for (var k = 0; k < glowSprites.length; k++) {
      glowSprites[k].mat.opacity = glowSprites[k].minOp + (glowSprites[k].maxOp - glowSprites[k].minOp) * Math.min(1, p.lampFactor);
    }

    document.body.classList.toggle("is-night", p.isNight);
    updateClockHUD();
  }

  var clockBtn = document.getElementById("hud-clock-card");
  if (clockBtn) {
    clockBtn.addEventListener("click", function () {
      manualTimeOverride = true;
      applyTimePhase(phaseIndex + 1);
      playSfx("step");
    });
  }

  // ==========================================================================
  // 10. CONTROLS, RAYCASTING, MINIMAP & TELEPHOTO CAMERA LOOP
  // ==========================================================================
  var enteredWorld = false;
  var titleTransition = 0;
  var heroPos = { x: 0, z: 2.2, jumpY: 0, vy: 0 };
  var heroFacing = "front";
  var heroWalkTime = 0;
  var catPos = { x: 1.3, z: 2.8 };
  var walkTarget = null;
  var pendingOpenZone = null;
  var currentZone = ZONES[0];
  var nearInteractZone = null;

  // Scenic low-angle telephoto HD-2D camera!
  var camYaw = 0;
  var camDist = 21.5;
  var camPitch = 0.42;
  var keys = {};

  function enterWorld() {
    if (enteredWorld) return;
    enteredWorld = true;
    playSfx("coin");
    if (titleOverlay) {
      titleOverlay.classList.add("is-exiting");
      setTimeout(function () { titleOverlay.style.display = "none"; }, 650);
    }
    if (hudLayer) hudLayer.classList.add("is-visible");
    document.body.classList.add("is-world-entered");
  }

  if (titleOverlay) {
    titleOverlay.addEventListener("click", function (e) {
      if (e.target.closest("[data-title-lang]")) return;
      enterWorld();
    });
  }

  var titleLangBtns = document.querySelectorAll("[data-title-lang]");
  function refreshTitleLangButtons() {
    var l = getLang();
    for (var i = 0; i < titleLangBtns.length; i++) {
      titleLangBtns[i].classList.toggle("is-active", titleLangBtns[i].getAttribute("data-title-lang") === l);
    }
  }
  for (var tl = 0; tl < titleLangBtns.length; tl++) {
    titleLangBtns[tl].addEventListener("click", function (e) {
      e.stopPropagation();
      var targetLang = this.getAttribute("data-title-lang");
      if (window.LEI_GAME && typeof window.LEI_GAME.setLang === "function") window.LEI_GAME.setLang(targetLang);
      refreshTitleLangButtons();
      updateZoneHUD(currentZone);
      updateClockHUD();
    });
  }
  refreshTitleLangButtons();

  window.addEventListener("keydown", function (e) {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (!enteredWorld) {
      if (e.key !== "F5" && e.key !== "F12") enterWorld();
      return;
    }
    var k = e.key.toLowerCase();
    if (k === "escape") { closeZoneModal(); return; }
    if (activeModalId) return;
    keys[k] = true;

    if (k === " " || k === "enter") {
      if (nearInteractZone) {
        e.preventDefault();
        openZoneModal(nearInteractZone.id);
      } else if (heroPos.jumpY <= 0.01) {
        heroPos.vy = 6.5;
        playSfx("jump");
      }
    } else if (k === "t") {
      manualTimeOverride = true;
      applyTimePhase(phaseIndex + 1);
      playSfx("step");
    } else if (k === "m") {
      var sfxBtn = document.getElementById("hud-sfx");
      if (sfxBtn) sfxBtn.click();
    } else if (k === "h") {
      if (controlsBox) controlsBox.classList.toggle("is-collapsed");
      playSfx("step");
    }
  });
  window.addEventListener("keyup", function (e) { keys[e.key.toLowerCase()] = false; });

  renderer.domElement.addEventListener("wheel", function (e) {
    if (!enteredWorld || activeModalId) return;
    camDist = Math.max(12, Math.min(34, camDist + e.deltaY * 0.012));
  }, { passive: true });

  var isDraggingCam = false, dragStartX = 0;
  renderer.domElement.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  renderer.domElement.addEventListener("pointerdown", function (e) {
    if (!enteredWorld || activeModalId) return;
    if (e.button === 2) { isDraggingCam = true; dragStartX = e.clientX; }
  });
  window.addEventListener("pointermove", function (e) {
    if (!isDraggingCam) return;
    camYaw -= (e.clientX - dragStartX) * 0.007;
    dragStartX = e.clientX;
  });
  window.addEventListener("pointerup", function () { isDraggingCam = false; });

  var raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  renderer.domElement.addEventListener("click", function (e) {
    if (!enteredWorld || activeModalId) return;
    var rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    var hitMarks = raycaster.intersectObjects(clickableLandmarks, false);
    if (hitMarks.length > 0 && hitMarks[0].object.userData.zoneId) {
      var zid = hitMarks[0].object.userData.zoneId;
      var z = zoneMap[zid];
      if (z) {
        if (Math.hypot(heroPos.x - z.interactX, heroPos.z - z.interactZ) < 4.8) {
          openZoneModal(zid);
        } else {
          walkTarget = { x: z.interactX, z: z.interactZ };
          pendingOpenZone = zid;
          destMarker.position.set(z.interactX, getGroundY(z.interactX, z.interactZ) + 0.1, z.interactZ);
          destMarker.material.opacity = 0.9;
          playSfx("step");
        }
        return;
      }
    }

    var hitGround = raycaster.intersectObjects(groundMeshes, false);
    if (hitGround.length > 0) {
      var pt = hitGround[0].point;
      var tx = Math.max(-18.5, Math.min(18.5, pt.x));
      var tz = Math.max(-14.5, Math.min(16.8, pt.z));
      walkTarget = { x: tx, z: tz };
      pendingOpenZone = null;
      destMarker.position.set(tx, getGroundY(tx, tz) + 0.1, tz);
      destMarker.material.opacity = 0.85;
      playSfx("step");
    }
  });

  if (promptEl) promptEl.addEventListener("click", function () { if (nearInteractZone) openZoneModal(nearInteractZone.id); });
  var controlsToggleBtn = document.getElementById("hud-controls-toggle");
  if (controlsToggleBtn && controlsBox) {
    controlsToggleBtn.addEventListener("click", function () {
      controlsBox.classList.toggle("is-collapsed");
      playSfx("step");
    });
  }

  function updateZoneHUD(z) {
    currentZone = z;
    var l = getLang();
    if (zoneTitleEl) zoneTitleEl.textContent = z[l].title;
    if (zoneSubEl) zoneSubEl.textContent = z[l].sub;
    syncHeaderActive(z.stageIndex);
  }

  function teleportToZone(zoneId, openPanel) {
    var z = zoneMap[zoneId];
    if (!z) return;
    if (!enteredWorld) enterWorld();
    heroPos.x = z.spawnX; heroPos.z = z.spawnZ;
    catPos.x = z.spawnX + 1.2; catPos.z = z.spawnZ + 0.7;
    walkTarget = null; pendingOpenZone = null;
    updateZoneHUD(z);
    syncHeaderActive(z.stageIndex);
    playSfx("stage");
    if (openPanel) openZoneModal(zoneId);
    else closeZoneModal();
  }

  if (minimapCanvas) {
    minimapCanvas.addEventListener("click", function (e) {
      var rect = minimapCanvas.getBoundingClientRect();
      var wx = ((e.clientX - rect.left) / rect.width - 0.5) * 42;
      var wz = ((e.clientY - rect.top) / rect.height - 0.5) * 40 - 1;
      var best = null, bestD = 6.0;
      for (var i = 0; i < ZONES.length; i++) {
        var d = Math.hypot(wx - ZONES[i].x, wz - ZONES[i].z);
        if (d < bestD) { bestD = d; best = ZONES[i]; }
      }
      if (best) teleportToZone(best.id, true);
    });
  }

  var warpBtns = document.querySelectorAll("[data-warp-zone]");
  for (var wb = 0; wb < warpBtns.length; wb++) {
    warpBtns[wb].addEventListener("click", function () {
      teleportToZone(this.getAttribute("data-warp-zone"), true);
    });
  }

  var mmCtx = minimapCanvas ? minimapCanvas.getContext("2d") : null;
  function drawMinimap() {
    if (!mmCtx) return;
    var w = minimapCanvas.width, h = minimapCanvas.height;
    mmCtx.imageSmoothingEnabled = false;
    mmCtx.fillStyle = "#101729";
    mmCtx.fillRect(0, 0, w, h);
    // Upper North Terrace
    mmCtx.fillStyle = "#c9bfa8";
    mmCtx.fillRect(24, 8, w - 48, 30);
    // Mid Main Isle
    mmCtx.fillStyle = "#3f743b";
    mmCtx.fillRect(10, 38, w - 20, 56);
    // South Terrace
    mmCtx.fillStyle = "#488042";
    mmCtx.fillRect(40, 94, w - 80, 26);
    // Creek
    mmCtx.fillStyle = "#3b92d4";
    mmCtx.fillRect(82, 38, 8, 56);
    // Paths
    mmCtx.fillStyle = "#ddd2bc";
    mmCtx.fillRect(59, 26, 10, 80);
    mmCtx.fillRect(20, 61, 88, 8);
    // Landmarks
    for (var i = 0; i < ZONES.length; i++) {
      var z = ZONES[i];
      var lx = Math.round(((z.x + 21) / 42) * (w - 16) + 8);
      var ly = Math.round(((z.z + 21) / 40) * (h - 16) + 8);
      mmCtx.fillStyle = z.color;
      mmCtx.fillRect(lx - 3, ly - 3, 7, 7);
      mmCtx.fillStyle = "#101729";
      mmCtx.fillRect(lx - 1, ly - 1, 3, 3);
    }
    var hx = Math.round(((heroPos.x + 21) / 42) * (w - 16) + 8);
    var hy = Math.round(((heroPos.z + 21) / 40) * (h - 16) + 8);
    mmCtx.fillStyle = "#ffffff";
    mmCtx.fillRect(hx - 3, hy - 3, 6, 6);
    mmCtx.fillStyle = "#ef4444";
    mmCtx.fillRect(hx - 1, hy - 1, 2, 2);
  }

  var clock = new THREE.Clock();
  applyTimePhase(phaseIndex);
  updateZoneHUD(ZONES[0]);

  var hashMap = { "#world-start": "home", "#world-profile": "about", "#world-papers": "research", "#world-quests": "gallery", "#world-contact": "contact" };
  if (window.location.hash && hashMap[window.location.hash]) {
    setTimeout(function () { teleportToZone(hashMap[window.location.hash], true); }, 150);
  }

  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;

    // Ambient animations
    spectralPrism.rotation.y = t * 1.1;
    spectralPrism.position.y = 19.2 + Math.sin(t * 2.0) * 0.35;
    haloRing1.rotation.z = t * 0.65;
    haloRing2.rotation.x = -t * 0.85;
    steleGem.rotation.y = t * 1.4;
    steleGem.position.y = 4.35 + Math.sin(t * 2.8) * 0.14;

    var flk = 0.88 + Math.sin(t * 15) * 0.14;
    flameCore.scale.set(flk, 0.92 + Math.cos(t * 12) * 0.18, flk);
    flameOuter.scale.set(1 / flk, 0.95 + Math.sin(t * 10) * 0.15, 1 / flk);
    campLight.intensity = 2.5 + Math.sin(t * 14) * 0.5;

    // Chimney smoke rising
    for (var sm = 0; sm < smokePuffs.length; sm++) {
      var sp = smokePuffs[sm];
      var prog = (t * 0.24 + sp.phase) % 1;
      sp.sprite.position.set(-17.1 + Math.sin(t + sm) * 0.35 + prog * 0.8, 9.2 + prog * 3.8, -3.2);
      var sc = 0.65 + prog * 1.4;
      sp.sprite.scale.set(sc, sc, 1);
      sp.sprite.material.opacity = (1 - prog) * 0.42;
    }

    // Floating islets, clouds, waterfalls
    for (var ii = 0; ii < floatingIslets.length; ii++) {
      floatingIslets[ii].mesh.position.y = floatingIslets[ii].baseY + Math.sin(t * 0.8 + floatingIslets[ii].phase) * 0.55;
    }
    for (var ci = 0; ci < clouds.length; ci++) {
      clouds[ci].mesh.position.x += clouds[ci].speed * dt;
      if (clouds[ci].mesh.position.x > 65) clouds[ci].mesh.position.x = -65;
    }
    texWater.offset.y = -(t * 0.2) % 1;
    texWaterfall.offset.y = (t * 0.85) % 1;

    for (var ri = 0; ri < runeRings.length; ri++) {
      var rs = 1 + Math.sin(t * 2.8 + ri) * 0.08;
      runeRings[ri].scale.set(rs, rs, 1);
    }

    // Gentle NPC breathing
    for (var ni = 0; ni < npcSprites.length; ni++) {
      npcSprites[ni].sprite.position.y = npcSprites[ni].baseY + Math.sin(t * 2.4 + npcSprites[ni].phase) * 0.05;
    }

    // Fireflies
    var posAttr = ffGeo.attributes.position;
    for (var fi = 0; fi < ffCount; fi++) {
      var sd = ffSeeds[fi];
      posAttr.setXYZ(fi, sd.x + Math.sin(t * 0.65 + sd.phase) * 1.4, sd.y + Math.sin(t * 1.3 + sd.phase) * 0.6, sd.z + Math.cos(t * 0.6 + sd.phase) * 1.4);
    }
    posAttr.needsUpdate = true;

    // Hero Movement
    var moving = false;
    if (enteredWorld && !activeModalId) {
      if (keys["q"]) camYaw += 1.45 * dt;
      if (keys["e"]) camYaw -= 1.45 * dt;

      var moveX = 0, moveZ = 0;
      if (keys["w"] || keys["arrowup"]) moveZ -= 1;
      if (keys["s"] || keys["arrowdown"]) moveZ += 1;
      if (keys["a"] || keys["arrowleft"]) moveX -= 1;
      if (keys["d"] || keys["arrowright"]) moveX += 1;

      var speed = keys["shift"] ? 9.8 : 6.0;
      if (moveX !== 0 || moveZ !== 0) {
        walkTarget = null; pendingOpenZone = null;
        var len = Math.hypot(moveX, moveZ);
        moveX /= len; moveZ /= len;
        var cosY = Math.cos(camYaw), sinY = Math.sin(camYaw);
        heroPos.x += (moveX * cosY + moveZ * sinY) * speed * dt;
        heroPos.z += (-moveX * sinY + moveZ * cosY) * speed * dt;
        moving = true;
        heroFacing = Math.abs(moveX) > Math.abs(moveZ) ? (moveX > 0 ? "right" : "left") : (moveZ < 0 ? "back" : "front");
      } else if (walkTarget) {
        var dx = walkTarget.x - heroPos.x, dz = walkTarget.z - heroPos.z;
        var d = Math.hypot(dx, dz);
        if (d > 0.3) {
          var step = Math.min(d, speed * dt);
          heroPos.x += (dx / d) * step; heroPos.z += (dz / d) * step;
          moving = true;
          heroFacing = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? "right" : "left") : (dz < 0 ? "back" : "front");
        } else {
          walkTarget = null;
          if (pendingOpenZone) { var toOpen = pendingOpenZone; pendingOpenZone = null; openZoneModal(toOpen); }
        }
      }

      // Keep inside terraced island footprint
      heroPos.x = Math.max(-18.5, Math.min(18.5, heroPos.x));
      heroPos.z = Math.max(-14.2, Math.min(16.8, heroPos.z));
      if (heroPos.z > 9.0) heroPos.x = Math.max(-7.0, Math.min(7.0, heroPos.x));
      if (heroPos.z < -10.2) heroPos.x = Math.max(-12.8, Math.min(12.8, heroPos.x));
      // Creek check outside bridge
      if (heroPos.x > 5.7 && heroPos.x < 9.3 && heroPos.z > -10.4 && heroPos.z < 9.2 && (heroPos.z < -3.4 || heroPos.z > 0.2)) {
        heroPos.x = heroPos.x < 7.5 ? 5.65 : 9.35;
      }

      if (heroPos.jumpY > 0 || heroPos.vy !== 0) {
        heroPos.jumpY += heroPos.vy * dt;
        heroPos.vy -= 18.5 * dt;
        if (heroPos.jumpY <= 0) { heroPos.jumpY = 0; heroPos.vy = 0; }
      }
    }

    if (destMarker.material.opacity > 0) destMarker.material.opacity = Math.max(0, destMarker.material.opacity - dt * 1.4);

    // Update Hero & Cat vertical elevation seamlessly across stairs & bridge
    var heroGroundY = getGroundY(heroPos.x, heroPos.z);
    if (moving) {
      heroWalkTime += dt * (keys["shift"] ? 12 : 8.5);
      heroMat.map = heroTex[heroFacing][Math.floor(heroWalkTime) % 2 === 0 ? 1 : 2];
    } else {
      heroMat.map = heroTex[heroFacing][0];
    }
    heroSprite.position.set(heroPos.x, heroGroundY + 1.15 + heroPos.jumpY, heroPos.z);
    heroShadow.position.set(heroPos.x, heroGroundY + 0.08, heroPos.z);
    var shS = Math.max(0.55, 1 - heroPos.jumpY * 0.22);
    heroShadow.scale.set(shS, shS, 1);

    var cdx = (heroPos.x + 1.25) - catPos.x, cdz = (heroPos.z + 0.85) - catPos.z;
    if (Math.hypot(cdx, cdz) > 0.7) {
      catPos.x += cdx * Math.min(1, dt * 3.8);
      catPos.z += cdz * Math.min(1, dt * 3.8);
      catMat.map = catFrames[Math.floor(t * 7) % 2];
    } else {
      catMat.map = catFrames[0];
    }
    var catGroundY = getGroundY(catPos.x, catPos.z);
    catSprite.position.set(catPos.x, catGroundY + 0.48 + Math.abs(Math.sin(t * 3.2)) * 0.05, catPos.z);

    // Zone & Interactable Detection
    var nearestZone = ZONES[0], nearestDist = Infinity, interactZone = null;
    for (var zi = 0; zi < ZONES.length; zi++) {
      var z = ZONES[zi];
      var dc = Math.hypot(heroPos.x - z.x, heroPos.z - z.z);
      if (dc < nearestDist) { nearestDist = dc; nearestZone = z; }
      if (Math.hypot(heroPos.x - z.interactX, heroPos.z - z.interactZ) < 2.8) interactZone = z;
    }
    if (nearestZone.id !== currentZone.id && nearestDist < nearestZone.radius + 1.8) updateZoneHUD(nearestZone);
    nearInteractZone = interactZone;
    if (promptEl) {
      if (enteredWorld && !activeModalId && nearInteractZone) {
        promptEl.classList.add("is-show");
        if (promptTextEl) promptTextEl.textContent = nearInteractZone[getLang()].prompt;
      } else {
        promptEl.classList.remove("is-show");
      }
    }

    // Scenic Title Vista (low majestic angle showing Cathedral Spires, Waterfalls, Cloud Sea)
    var orbit = Math.sin(t * 0.16) * 0.28;
    var titleCamX = Math.sin(orbit) * 34;
    var titleCamY = 14.5 + Math.sin(t * 0.25) * 0.8;
    var titleCamZ = Math.cos(orbit) * 34 + 6;

    var playCamX = heroPos.x + Math.sin(camYaw) * Math.cos(camPitch) * camDist;
    var playCamY = heroGroundY + 2.2 + Math.sin(camPitch) * camDist;
    var playCamZ = heroPos.z + Math.cos(camYaw) * Math.cos(camPitch) * camDist;

    if (enteredWorld) titleTransition = Math.min(1, titleTransition + dt * 1.35);
    var ease = 1 - Math.pow(1 - titleTransition, 3);

    camera.position.x += ((titleCamX + (playCamX - titleCamX) * ease) - camera.position.x) * Math.min(1, dt * 6);
    camera.position.y += ((titleCamY + (playCamY - titleCamY) * ease) - camera.position.y) * Math.min(1, dt * 6);
    camera.position.z += ((titleCamZ + (playCamZ - titleCamZ) * ease) - camera.position.z) * Math.min(1, dt * 6);

    var lx = heroPos.x * ease;
    var ly = 6.2 + (heroGroundY + 2.4 - 6.2) * ease;
    var lz = -8.0 + (heroPos.z - 2.2 - (-8.0)) * ease;
    camera.lookAt(lx, ly, lz);

    renderer.render(scene, camera);
    drawMinimap();
  }

  animate();

  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.SPECTRAL_WORLD = {
    enter: enterWorld,
    teleport: teleportToZone,
    openPanel: openZoneModal,
    closePanel: closeZoneModal,
    cycleTime: function () { manualTimeOverride = true; applyTimePhase(phaseIndex + 1); },
    jumpHero: function () { if (heroPos.jumpY <= 0.01) { heroPos.vy = 6.5; playSfx("jump"); } },
    refreshLang: function () {
      refreshTitleLangButtons();
      updateZoneHUD(currentZone);
      updateClockHUD();
      if (currentZone) syncHeaderActive(currentZone.stageIndex);
    }
  };
})();
