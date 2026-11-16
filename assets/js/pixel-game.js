(function () {
  var SFX_KEY = "lei_pixel_sfx";
  var COIN_KEY = "lei_pixel_coins";
  var sfxOn = true;
  var audioCtx = null;

  try {
    var savedSfx = sessionStorage.getItem(SFX_KEY);
    if (savedSfx === "0") sfxOn = false;
  } catch (e) {}

  var coins = 0;
  try {
    coins = parseInt(sessionStorage.getItem(COIN_KEY) || "0", 10) || 0;
  } catch (e) {}

  var LANG_KEY = "lei_lang";
  var lang = "zh";
  try {
    if (localStorage.getItem(LANG_KEY) === "en") lang = "en";
  } catch (e) {}

  var DICT = {
    zh: {
      "menu.home": "首页",
      "menu.about": "关于",
      "menu.research": "研究",
      "menu.notes": "随笔",
      "menu.contact": "联系",
      "npc.guide": "向导",
      "npc.scholar": "学者",
      "npc.scroll": "书记",
      "npc.lens": "记录者",
      "hero.kicker": "Computational Imaging Researcher · 计算成像研究者",
      "hero.hello": "你好，我是 Lei Liu!",
      "hero.line0": "专注计算成像、光谱重建与深度学习。探索光学感知的边界。",
      "hero.line1": "近期发表见 Pattern Recognition (2026)、IEEE TMM (2024) 与 IEEE TGRS (2023)。",
      "hero.line2": "常用科研工具：Python、PyTorch、MATLAB、LaTeX、Overleaf、Docker。",
      "hero.line3": "信念：熟能生巧，持续学习，每天成长 (Practice Makes Perfect)。",
      "hero.start": "开始冒险",
      "hero.papers": "学术发表 →",
      "hero.next": "下一句 ▼",
      "hero.cue": "▼ 下滑切换场景 · 点击地面或按 A / D 漫步",
      "stage2.title": "关于我 · About Me",
      "stage3.title": "学术发表 · Research",
      "stage3.sub": "探索计算光谱成像与深度展开网络的前沿 · 自动同步 ORCID",
      "stage4.title": "日常随笔 · Notes & Gallery",
      "stage4.sub": "科研之外的日常记录、校园瞬间与影像图鉴。",
      "stage5.title": "Let's Connect! · 联系与交流",
      "stage5.sub": "欢迎学术合作、论文探讨，或者随时发封邮件聊聊！",
      "sheet.kicker": "地球人 · 还在活着 · 专注计算成像、快照压缩光谱重建与深度展开网络。",
      "about.profileTitle": "学者档案 · Scholar Profile",
      "about.interestsTitle": "研究方向 · Research Interests",
      "about.interestsSub": "点击方向卡片查看研究内容",
      "interest.ci": "计算成像与光学编码建模",
      "interest.sr": "快照压缩光谱成像 (CASSI)",
      "interest.du": "退化感知深度展开与傅里叶网络",
      "fact.focus": "主攻",
      "fact.focus.v": "计算成像 · 光谱重建 · 深度学习",
      "fact.motto": "信念",
      "fact.motto.v": "熟能生巧 · 持续学习 · 每天成长",
      "inv.title": "科研工具箱 · Tech Stack",
      "inv.hint": "点击图标查看说明",
      "chest.open": "BibTeX ▾",
      "chest.close": "收起 BibTeX ▴",
      "chest.copy": "复制 BibTeX",
      "codex.read": "阅读全文 →",
      "connect.board": "✉ 在线留言板",
      "guild.tag": "频道 · Bilibili 与 GitHub",
      "guild.line": "记录科研之外的日常与映像 · UID 3213366",
      "guild.bili": "Bilibili 频道",
      "guild.gh": "GitHub 主页",
      "guild.mail": "邮件联系",
      "save.flag": "⚑ 存档点",
      "save.motto": "熟能生巧 · 持续学习 · 每天成长",
      "save.about": "完整档案",
      "save.mail": "送信",
      "nav.11": "1-1 起点",
      "nav.12": "1-2 档案",
      "nav.13": "1-3 论文",
      "nav.14": "1-4 日志",
      "quest.bar": "★ 任务简报",
      "quest.back": "← 返回 1-4 日志",
      "quest.backHome": "← 返回主世界",
      "contact.boardTitle": "信使驿站 · Talk to Me",
      "contact.boardSub": "在羊皮纸上写下你的学术探讨、合作意向或日常问候，信使白猫会第一时间送达！",
      "contact.nameLabel": "署名 · Your Name",
      "contact.emailLabel": "回信地址 · Your Email",
      "contact.msgLabel": "信件内容 · Message",
      "quest.status": "任务进行中",
      "quest.reward": "奖励 +2 金币 · 经验",
      "quest.complete": "✓ 完成阅读 (+2 金币)",
      "quest.done": "★ 已领取奖励",
      "quest.top": "↑ 回到顶部",
      "toast.save": "⚑ 已抵达 1-4 存档点",
      "toast.copy": "BibTeX 已复制",
      "toast.copyfail": "请手动选中 BibTeX 复制",
      "toast.quest": "★ 任务完成",
      "orcid.loading": "正在读取 ORCID",
      "orcid.ready": "已同步 ORCID",
      "orcid.fail": "ORCID 暂不可用，显示本地列表"
    },
    en: {
      "menu.home": "Home",
      "menu.about": "About",
      "menu.research": "Research",
      "menu.notes": "Notes",
      "menu.contact": "Contact",
      "npc.guide": "Guide",
      "npc.scholar": "Scholar",
      "npc.scroll": "Scribe",
      "npc.lens": "Recorder",
      "hero.kicker": "Computational Imaging Researcher",
      "hero.hello": "Hi, I'm Lei Liu!",
      "hero.line0": "Exploring computational imaging, spectral reconstruction, and deep learning.",
      "hero.line1": "Recent papers in Pattern Recognition (2026), IEEE TMM (2024), and IEEE TGRS (2023).",
      "hero.line2": "Tech stack: Python, PyTorch, MATLAB, LaTeX, Overleaf, Docker.",
      "hero.line3": "Motto: Practice Makes Perfect · Keep Learning · Grow Every Day.",
      "hero.start": "Start Adventure",
      "hero.papers": "Research →",
      "hero.next": "Next ▼",
      "hero.cue": "▼ Scroll to explore · Click ground or press A / D to walk",
      "stage2.title": "About Me",
      "stage3.title": "Research & Publications",
      "stage3.sub": "Exploring the frontiers of computational spectral imaging · Synced with ORCID",
      "stage4.title": "Notes & Gallery",
      "stage4.sub": "A collection of life moments, campus memories, and notes.",
      "stage5.title": "Let's Connect!",
      "stage5.sub": "Feel free to reach out for collaboration, discussion, or just a chat!",
      "sheet.kicker": "Earthling · Still Alive · Focusing on computational imaging, CASSI & deep unfolding.",
      "about.profileTitle": "Scholar Profile",
      "about.interestsTitle": "Research Interests",
      "about.interestsSub": "Click a topic to inspect details",
      "interest.ci": "Optical coding & computational sensing",
      "interest.sr": "Snapshot compressive spectral imaging (CASSI)",
      "interest.du": "Degradation-aware deep unfolding & Fourier nets",
      "fact.focus": "Focus",
      "fact.focus.v": "Computational imaging · spectral reconstruction · deep learning",
      "fact.motto": "Motto",
      "fact.motto.v": "Practice makes perfect · keep learning · grow every day",
      "inv.title": "Tech Stack & Tools",
      "inv.hint": "Click an icon for details",
      "chest.open": "BibTeX ▾",
      "chest.close": "Hide BibTeX ▴",
      "chest.copy": "Copy BibTeX",
      "codex.read": "Read Note →",
      "connect.board": "✉ Message Board",
      "guild.tag": "Channel · Bilibili & GitHub",
      "guild.line": "Days and images beyond the papers · UID 3213366",
      "guild.bili": "Bilibili",
      "guild.gh": "GitHub",
      "guild.mail": "Email",
      "save.flag": "⚑ Save point",
      "save.motto": "Practice makes perfect · keep learning · grow every day",
      "save.about": "Full archive",
      "save.mail": "Contact",
      "nav.11": "1-1 Start",
      "nav.12": "1-2 File",
      "nav.13": "1-3 Papers",
      "nav.14": "1-4 Notes",
      "quest.bar": "★ Quest briefing",
      "quest.back": "← Back to 1-4",
      "quest.backHome": "← Back to Overworld",
      "contact.boardTitle": "Messenger Post · Talk to Me",
      "contact.boardSub": "Write your academic inquiry, collaboration idea, or greeting on the parchment below!",
      "contact.nameLabel": "Your Name",
      "contact.emailLabel": "Your Email",
      "contact.msgLabel": "Your Message",
      "quest.status": "Quest in progress",
      "quest.reward": "Reward +2 coins · EXP",
      "quest.complete": "✓ Finish reading (+2 coins)",
      "quest.done": "★ Reward claimed",
      "quest.top": "↑ Top",
      "toast.save": "⚑ Save point 1-4",
      "toast.copy": "BibTeX copied",
      "toast.copyfail": "Select the BibTeX and copy it",
      "toast.quest": "★ Quest complete",
      "orcid.loading": "Reading ORCID",
      "orcid.ready": "Synced from ORCID",
      "orcid.fail": "ORCID unavailable, showing the saved list"
    }
  };

  function t(key) {
    var pack = DICT[lang] || DICT.zh;
    return pack[key] || DICT.zh[key] || key;
  }

  function refreshDynamicCopy() {
    var active = document.querySelector(".interest-card.is-active");
    var interestDesc = document.getElementById("interest-desc");
    if (active && interestDesc) {
      var desc = lang === "en" ? active.getAttribute("data-desc-en") : active.getAttribute("data-desc");
      interestDesc.innerHTML = (desc || "") + '<i class="caret" aria-hidden="true"></i>';
    }
    var selected = document.querySelector(".inv-slot.is-selected");
    var invRole = document.getElementById("inv-role");
    if (selected && invRole) {
      invRole.textContent = (lang === "en" ? selected.getAttribute("data-role-en") : selected.getAttribute("data-role")) || "";
    }
    var dialogLine = document.getElementById("hero-dialog-line");
    if (dialogLine) {
      var idx = parseInt(dialogLine.getAttribute("data-line") || "0", 10) || 0;
      dialogLine.textContent = t("hero.line" + idx);
    }
    document.querySelectorAll("[data-toggle-bib]").forEach(function (btn) {
      var card = btn.closest("[data-chest]");
      var open = card && card.classList.contains("is-open");
      btn.textContent = open ? t("chest.close") : t("chest.open");
    });
    document.querySelectorAll("[data-copy-bib]").forEach(function (btn) {
      btn.textContent = t("chest.copy");
    });
    var sync = document.getElementById("orcid-sync");
    if (sync) {
      var state = sync.getAttribute("data-orcid-state");
      if (state === "loading") sync.textContent = t("orcid.loading");
      else if (state === "ready") sync.textContent = t("orcid.ready") + " · " + (sync.getAttribute("data-orcid-count") || "");
      else if (state === "fail") sync.textContent = t("orcid.fail");
    }
    document.querySelectorAll("[data-quest-complete]").forEach(function (btn) {
      btn.textContent = btn.classList.contains("is-done") ? t("quest.done") : t("quest.complete");
    });
    var langBtn = document.getElementById("lang-toggle");
    if (langBtn) {
      langBtn.textContent = lang === "en" ? "中文" : "EN";
      langBtn.setAttribute("aria-label", lang === "en" ? "Switch to Chinese" : "切换到英文");
    }
  }

  function applyLang() {
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      if (el.hasAttribute("data-toggle-bib") || el.hasAttribute("data-quest-complete")) return;
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    refreshDynamicCopy();
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  }

  function ensureAudio() {
    if (!sfxOn) return null;
    if (!audioCtx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(function () {});
    }
    return audioCtx;
  }

  function playTone(notes) {
    var ctx = ensureAudio();
    if (!ctx) return;
    var t = ctx.currentTime;
    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = n.type || "square";
      osc.frequency.setValueAtTime(n.f, t);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + n.d);
      t += n.d * 0.85;
    }
  }

  var sfx = {
    coin: function () {
      playTone([{ f: 988, d: 0.07 }, { f: 1319, d: 0.16 }]);
    },
    step: function () {
      playTone([{ f: 523, d: 0.045 }, { f: 659, d: 0.055 }]);
    },
    jump: function () {
      playTone([{ f: 392, d: 0.05, type: "square" }, { f: 587, d: 0.06, type: "square" }, { f: 784, d: 0.08, type: "square" }]);
    },
    chest: function () {
      playTone([
        { f: 523, d: 0.08 },
        { f: 659, d: 0.08 },
        { f: 784, d: 0.08 },
        { f: 1046, d: 0.2 }
      ]);
    },
    heart: function () {
      playTone([{ f: 659, d: 0.07 }, { f: 784, d: 0.07 }, { f: 988, d: 0.12 }]);
    },
    pipe: function () {
      playTone([{ f: 440, d: 0.06 }, { f: 330, d: 0.06 }, { f: 220, d: 0.1 }]);
    },
    stage: function () {
      playTone([{ f: 440, d: 0.05 }, { f: 587, d: 0.08 }]);
    }
  };
  window.LEI_SFX = sfx;

  var toastLayer = document.getElementById("pixel-toast-layer");
  function showToast(text) {
    if (!toastLayer) return;
    var el = document.createElement("div");
    el.className = "pixel-toast";
    el.textContent = text;
    toastLayer.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1800);
  }

  var coinEl = document.getElementById("hud-coins");
  var expEl = document.getElementById("hud-exp");
  var sheetExpEl = document.getElementById("sheet-exp");

  function renderCoins() {
    if (coinEl) {
      coinEl.textContent = coins < 10 ? "0" + coins : String(coins);
    }
    var bonus = Math.min(95, 18 + coins * 6);
    if (sheetExpEl) sheetExpEl.style.width = bonus + "%";
  }

  function addCoins(n, msg) {
    coins += n;
    try {
      sessionStorage.setItem(COIN_KEY, String(coins));
    } catch (e) {}
    renderCoins();
    sfx.coin();
    if (msg) showToast(msg);
  }

  renderCoins();

  // 8-bit SFX toggle
  var sfxBtn = document.getElementById("hud-sfx");
  function updateSfxBtn() {
    if (!sfxBtn) return;
    sfxBtn.textContent = sfxOn ? "♪ ON" : "♪ OFF";
    sfxBtn.setAttribute("aria-pressed", sfxOn ? "true" : "false");
    sfxBtn.classList.toggle("is-on", sfxOn);
  }
  updateSfxBtn();
  if (sfxBtn) {
    sfxBtn.addEventListener("click", function () {
      sfxOn = !sfxOn;
      try {
        sessionStorage.setItem(SFX_KEY, sfxOn ? "1" : "0");
      } catch (e) {}
      updateSfxBtn();
      if (sfxOn) {
        sfx.coin();
        showToast("♪ 8-BIT 音效已开启");
      } else {
        showToast("♪ 8-BIT 音效已静音");
      }
    });
  }

  // Hearts interaction
  var heartsBtn = document.getElementById("hud-hearts");
  if (heartsBtn) {
    heartsBtn.addEventListener("click", function () {
      heartsBtn.classList.remove("is-heal");
      void heartsBtn.offsetWidth;
      heartsBtn.classList.add("is-heal");
      if (window.LEI_WORLD && window.LEI_WORLD.celebrate) window.LEI_WORLD.celebrate();
      sfx.heart();
      showToast("♥ HP FULL · 元气满满！");
    });
  }

  // Mario Question Blocks with flying pixel coin
  var qBlocks = document.querySelectorAll(".q-block");
  for (var i = 0; i < qBlocks.length; i++) {
    qBlocks[i].addEventListener("click", function () {
      var btn = this;
      btn.classList.remove("is-bumping");
      void btn.offsetWidth;
      btn.classList.add("is-bumping");

      var popCoin = document.createElement("i");
      popCoin.className = "pop-coin";
      btn.appendChild(popCoin);
      setTimeout(function () {
        if (popCoin.parentNode) popCoin.parentNode.removeChild(popCoin);
      }, 650);

      var reward = parseInt(btn.getAttribute("data-coin-reward") || "1", 10);
      var tip = btn.getAttribute("data-tip") || "+1 COIN!";
      addCoins(reward, tip);
    });
  }

  // Zelda Hero Dialogue switcher
  var dialogLine = document.getElementById("hero-dialog-line");
  var nextLineBtn = document.getElementById("hero-next-line");
  var lineCount = 4;
  if (dialogLine && nextLineBtn) {
    nextLineBtn.addEventListener("click", function () {
      var lineIdx = (parseInt(dialogLine.getAttribute("data-line") || "0", 10) || 0) + 1;
      if (lineIdx >= lineCount) lineIdx = 0;
      dialogLine.setAttribute("data-line", String(lineIdx));
      dialogLine.textContent = t("hero.line" + lineIdx);
      sfx.step();
    });
  }

  // Research interests cards
  var interestCards = document.querySelectorAll(".interest-card");
  var interestDesc = document.getElementById("interest-desc");
  for (var j = 0; j < interestCards.length; j++) {
    interestCards[j].addEventListener("click", function () {
      for (var k = 0; k < interestCards.length; k++) {
        interestCards[k].classList.remove("is-active");
      }
      this.classList.add("is-active");
      if (interestDesc) {
        var text = (lang === "en" ? this.getAttribute("data-desc-en") : this.getAttribute("data-desc")) || "";
        interestDesc.innerHTML = text + '<i class="caret" aria-hidden="true"></i>';
      }
      sfx.step();
    });
  }

  // Zelda Inventory slots
  var invSlots = document.querySelectorAll(".inv-slot");
  var invName = document.getElementById("inv-name");
  var invRole = document.getElementById("inv-role");
  for (var m = 0; m < invSlots.length; m++) {
    invSlots[m].addEventListener("click", function () {
      for (var n = 0; n < invSlots.length; n++) {
        invSlots[n].classList.remove("is-selected");
      }
      this.classList.add("is-selected");
      if (invName) {
        invName.textContent =
          (this.getAttribute("data-name") || "") +
          " [" +
          (this.getAttribute("data-lv") || "LV.1") +
          "]";
      }
      if (invRole) {
        invRole.textContent = (lang === "en" ? this.getAttribute("data-role-en") : this.getAttribute("data-role")) || "";
      }
      sfx.step();
    });
  }

  // Papers: ORCID list, with the saved cards as fallback, plus OpenAlex cites
  var chestGrid = document.getElementById("chest-grid");
  var totalCitesEl = document.getElementById("total-cites-num");
  var orcidSyncEl = document.getElementById("orcid-sync");
  var citeGen = 0;
  var PAPER_SVGS = [
    '<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">' +
      '<rect x="1" y="1" width="22" height="22" fill="#d9ecff"/>' +
      '<polygon points="12,4 20,18 4,18" fill="#3b70c4"/>' +
      '<polygon points="12,6 18,17 6,17" fill="#7ce4ff"/>' +
      '<rect x="15" y="9" width="7" height="2" fill="#ff5d73"/>' +
      '<rect x="16" y="11" width="6" height="2" fill="#ffd24a"/>' +
      '<rect x="17" y="13" width="5" height="2" fill="#5dae3a"/>' +
      '<rect x="3" y="11" width="6" height="2" fill="#ffffff"/>' +
    "</svg>",
    '<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">' +
      '<rect x="1" y="1" width="22" height="22" fill="#e2f2ff"/>' +
      '<polygon points="12,3 20,7 20,16 12,21 4,16 4,7" fill="#2b3354"/>' +
      '<polygon points="12,4 19,8 12,12 5,8" fill="#5fd9ff"/>' +
      '<polygon points="5,9 11,13 11,19 5,15" fill="#3b70c4"/>' +
      '<polygon points="19,9 19,15 13,19 13,13" fill="#f0b429"/>' +
      '<rect x="10" y="7" width="4" height="2" fill="#ffffff"/>' +
    "</svg>",
    '<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">' +
      '<rect x="1" y="1" width="22" height="22" fill="#e4f7e6"/>' +
      '<rect x="3" y="15" width="18" height="6" fill="#5dae3a"/>' +
      '<polygon points="4,15 10,10 15,15" fill="#3c7827"/>' +
      '<rect x="9" y="5" width="6" height="5" fill="#3b70c4"/>' +
      '<rect x="4" y="6" width="4" height="3" fill="#ffd24a"/>' +
      '<rect x="16" y="6" width="4" height="3" fill="#ffd24a"/>' +
      '<rect x="11" y="10" width="2" height="4" fill="#5fd9ff"/>' +
    "</svg>"
  ];

  function orcidText(node, fallback) {
    if (!node) return fallback || "";
    if (typeof node === "string") return node;
    if (node.value) return node.value;
    return fallback || "";
  }

  function bibEscape(value) {
    return String(value || "").replace(/[{}\\]/g, "");
  }

  function makeBib(work) {
    var authors = work.authors.length ? work.authors.join(" and ") : "Lei Liu";
    var first = (work.authors[0] || "Liu").split(" ").pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "liu";
    var word = (work.title || "paper").split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "paper";
    var key = first + (work.year || "") + word;
    var kind = work.type === "conference-paper" ? "inproceedings" : "article";
    var lines = ["@" + kind + "{" + key + ","];
    lines.push("  title={" + bibEscape(work.title) + "},");
    lines.push("  author={" + bibEscape(authors) + "},");
    if (work.journal) lines.push("  journal={" + bibEscape(work.journal) + "},");
    if (work.year) lines.push("  year={" + work.year + "},");
    if (work.month) lines.push("  month={" + work.month + "},");
    if (work.doi) lines.push("  doi={" + bibEscape(work.doi) + "}");
    lines.push("}");
    return lines.join("\n");
  }

  function renderOrcidWorks(works) {
    if (!chestGrid) return;
    chestGrid.textContent = "";
    for (var i = 0; i < works.length; i++) {
      var work = works[i];
      var card = document.createElement("article");
      card.className = "chest-card";
      card.setAttribute("data-chest", "");
      if (work.doi) card.setAttribute("data-doi", work.doi);
      card.setAttribute("data-fallback-cites", "0");

      var body = document.createElement("div");
      body.className = "chest-body";
      var icon = document.createElement("div");
      icon.className = "chest-icon";
      icon.innerHTML = PAPER_SVGS[i % PAPER_SVGS.length];

      var info = document.createElement("div");
      info.className = "chest-info";

      var metaTop = document.createElement("div");
      metaTop.className = "chest-meta-top";
      var venuePill = document.createElement("span");
      venuePill.className = "chest-venue-pill";
      var venueBits = [];
      if (work.journal) venueBits.push(work.journal);
      if (work.year) venueBits.push(work.month ? work.year + "-" + work.month : work.year);
      venuePill.textContent = venueBits.join(" · ") || "Publication";

      var badge = document.createElement("span");
      badge.className = "cite-badge";
      badge.appendChild(document.createTextNode("★ Cites: "));
      var count = document.createElement("b");
      count.setAttribute("data-cite-count", "");
      count.textContent = "–";
      badge.appendChild(count);
      metaTop.appendChild(venuePill);
      metaTop.appendChild(badge);

      var h3 = document.createElement("h3");
      h3.textContent = work.title;
      var authors = document.createElement("p");
      authors.className = "chest-authors";
      authors.textContent = work.authors.join(", ");

      var actions = document.createElement("div");
      actions.className = "chest-actions";
      var tagsLeft = document.createElement("div");
      tagsLeft.className = "chest-tags-left";
      var tagPill = document.createElement("span");
      tagPill.className = "paper-tag";
      tagPill.textContent = work.type === "conference-paper" ? "Conference" : "Journal";
      tagsLeft.appendChild(tagPill);

      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "px-btn px-btn-chest";
      toggle.setAttribute("data-toggle-bib", "");
      toggle.textContent = t("chest.open");
      tagsLeft.appendChild(toggle);
      actions.appendChild(tagsLeft);

      if (work.doi || work.url) {
        var viewLink = document.createElement("a");
        viewLink.className = "view-more-link";
        viewLink.href = work.doi ? "https://doi.org/" + work.doi : work.url;
        viewLink.target = "_blank";
        viewLink.rel = "noopener";
        viewLink.textContent = "View Paper →";
        actions.appendChild(viewLink);
      }

      var loot = document.createElement("div");
      loot.className = "chest-loot";
      loot.hidden = true;
      var pre = document.createElement("pre");
      pre.textContent = makeBib(work);
      var copy = document.createElement("button");
      copy.type = "button";
      copy.className = "px-btn px-btn-copy";
      copy.setAttribute("data-copy-bib", "");
      copy.textContent = t("chest.copy");
      loot.appendChild(pre);
      loot.appendChild(copy);

      info.appendChild(metaTop);
      info.appendChild(h3);
      info.appendChild(authors);
      info.appendChild(actions);
      info.appendChild(loot);
      body.appendChild(icon);
      body.appendChild(info);
      card.appendChild(body);
      chestGrid.appendChild(card);
    }
  }

  function loadCitations() {
    if (!chestGrid || !window.fetch) return;
    var gen = ++citeGen;
    var cards = chestGrid.querySelectorAll("[data-chest]");
    var counts = [];
    for (var i = 0; i < cards.length; i++) {
      counts.push(parseInt(cards[i].getAttribute("data-fallback-cites") || "0", 10) || 0);
    }
    function updateTotal() {
      if (gen !== citeGen || !totalCitesEl) return;
      var sum = 0;
      for (var s = 0; s < counts.length; s++) sum += counts[s];
      totalCitesEl.textContent = String(sum);
    }
    updateTotal();
    for (var idx = 0; idx < cards.length; idx++) {
      (function (card, index) {
        var doi = card.getAttribute("data-doi");
        var out = card.querySelector("[data-cite-count]");
        if (!doi || !out) return;
        fetch("https://api.openalex.org/works/https://doi.org/" + encodeURIComponent(doi))
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (data) {
            if (gen !== citeGen) return;
            if (data && typeof data.cited_by_count === "number") {
              counts[index] = data.cited_by_count;
              out.textContent = String(data.cited_by_count);
              updateTotal();
            }
          })
          .catch(function () {});
      })(cards[idx], idx);
    }
  }

  if (chestGrid) {
    chestGrid.addEventListener("click", function (ev) {
      var toggle = ev.target.closest("[data-toggle-bib]");
      if (toggle && chestGrid.contains(toggle)) {
        var card = toggle.closest("[data-chest]");
        if (!card) return;
        var loot = card.querySelector(".chest-loot");
        var isOpen = card.classList.toggle("is-open");
        if (loot) loot.hidden = !isOpen;
        toggle.textContent = isOpen ? t("chest.close") : t("chest.open");
        if (isOpen) {
          sfx.chest();
          if (!card.getAttribute("data-looted")) {
            card.setAttribute("data-looted", "1");
            addCoins(2, "+2 COINS");
          }
        } else {
          sfx.step();
        }
        return;
      }
      var copyBtn = ev.target.closest("[data-copy-bib]");
      if (!copyBtn || !chestGrid.contains(copyBtn)) return;
      var box = copyBtn.closest(".chest-loot");
      var pre = box ? box.querySelector("pre") : null;
      if (!pre) return;
      var text = pre.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          sfx.coin();
          showToast(t("toast.copy"));
        });
      } else {
        showToast(t("toast.copyfail"));
      }
    });

    loadCitations();

    var orcid = chestGrid.getAttribute("data-orcid");
    if (orcid && window.fetch) {
      if (orcidSyncEl) {
        orcidSyncEl.setAttribute("data-orcid-state", "loading");
        orcidSyncEl.textContent = t("orcid.loading");
      }
      fetch("https://pub.orcid.org/v3.0/" + orcid + "/works", {
        headers: { Accept: "application/json" }
      })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          var groups = (data && data.group) || [];
          var jobs = [];
          for (var g = 0; g < groups.length && jobs.length < 24; g++) {
            var summary = (groups[g]["work-summary"] || [])[0];
            if (!summary || !summary["put-code"]) continue;
            var kind = summary.type || "";
            if (kind && kind !== "journal-article" && kind !== "conference-paper" && kind !== "book-chapter" && kind !== "dissertation" && kind !== "preprint" && kind !== "working-paper" && kind !== "report" && kind !== "book") {
              continue;
            }
            jobs.push(summary["put-code"]);
          }
          if (!jobs.length) throw new Error("empty");
          return Promise.all(jobs.map(function (code) {
            return fetch("https://pub.orcid.org/v3.0/" + orcid + "/work/" + code, {
              headers: { Accept: "application/json" }
            }).then(function (r) { return r.ok ? r.json() : null; });
          }));
        })
        .then(function (records) {
          var works = [];
          for (var i = 0; i < records.length; i++) {
            var rec = records[i];
            if (!rec) continue;
            var title = orcidText(rec.title && rec.title.title);
            if (!title) continue;
            var people = ((rec.contributors || {}).contributor) || [];
            var authors = [];
            for (var p = 0; p < people.length; p++) {
              var name = orcidText(people[p]["credit-name"]);
              if (name) authors.push(name);
            }
            var ids = ((rec["external-ids"] || {})["external-id"]) || [];
            var doi = "";
            for (var e = 0; e < ids.length; e++) {
              if (ids[e]["external-id-type"] === "doi" && ids[e]["external-id-value"]) {
                doi = ids[e]["external-id-value"];
                break;
              }
            }
            var date = rec["publication-date"] || {};
            var year = orcidText(date.year);
            var month = orcidText(date.month);
            if (month && month.length === 1) month = "0" + month;
            works.push({
              title: title,
              authors: authors,
              journal: orcidText(rec["journal-title"]),
              year: year,
              month: month,
              doi: doi,
              url: orcidText(rec.url),
              type: rec.type || ""
            });
          }
          works.sort(function (a, b) {
            var ay = (parseInt(a.year, 10) || 0) * 100 + (parseInt(a.month, 10) || 0);
            var by = (parseInt(b.year, 10) || 0) * 100 + (parseInt(b.month, 10) || 0);
            return by - ay;
          });
          if (!works.length) throw new Error("empty");
          renderOrcidWorks(works);
          loadCitations();
          if (orcidSyncEl) {
            orcidSyncEl.setAttribute("data-orcid-state", "ready");
            orcidSyncEl.setAttribute("data-orcid-count", String(works.length));
            orcidSyncEl.textContent = t("orcid.ready") + " · " + works.length;
          }
        })
        .catch(function () {
          if (orcidSyncEl) {
            orcidSyncEl.setAttribute("data-orcid-state", "fail");
            orcidSyncEl.textContent = t("orcid.fail");
          }
        });
    }
  }

  // =========================================================================
  // Full-Page World Pager (1-slide per wheel/swipe/key) vs Normal Scroll
  // =========================================================================
  var pager = document.getElementById("world-pager");
  var track = document.getElementById("world-track");
  var slides = track ? track.querySelectorAll(".world-slide") : [];
  var runnerHero = document.getElementById("runner-hero");
  var runnerGoal = document.getElementById("runner-goal");
  var hudWorld = document.getElementById("hud-world");
  var navLinks = document.querySelectorAll(".world-menu a[data-jump], .runner-nav a[data-jump]");
  var stageDots = document.querySelectorAll("#stage-dots button[data-go-stage]");
  var runTimer = null;

  function moveRunner(pct, isBack) {
    if (runnerHero) {
      var leftPct = 5 + pct * 88;
      runnerHero.style.left = leftPct.toFixed(2) + "%";
      runnerHero.classList.add("is-running");
      runnerHero.classList.toggle("is-back", !!isBack);
      clearTimeout(runTimer);
      runTimer = setTimeout(function () {
        if (runnerHero) runnerHero.classList.remove("is-running");
      }, 360);
    }
    if (expEl) {
      expEl.style.width = Math.max(15, Math.round(pct * 100)) + "%";
    }
    if (runnerGoal) {
      runnerGoal.classList.toggle("is-reached", pct >= 0.96);
    }
  }

  if (pager && track && slides.length > 0) {
    var currentStage = 0;
    var lockUntil = 0;
    var stagePositions = [0, 0.25, 0.5, 0.75, 1.0];

    function stagePx() {
      var vv = window.visualViewport;
      var h = vv && vv.height ? vv.height : window.innerHeight;
      return Math.max(1, Math.round(h));
    }

    function layoutStage(animate) {
      var h = stagePx();
      var hpx = h + "px";
      document.documentElement.style.setProperty("--stage-h", hpx);
      document.body.style.height = hpx;
      pager.style.height = hpx;
      for (var i = 0; i < slides.length; i++) {
        slides[i].style.height = hpx;
      }
      if (!animate) track.style.transition = "none";
      track.style.transform = "translate3d(0, -" + currentStage * h + "px, 0)";
      if (!animate) {
        void track.offsetWidth;
        track.style.transition = "";
      }
    }

    function goToStage(nextIdx, silent) {
      if (nextIdx < 0) nextIdx = 0;
      if (nextIdx >= slides.length) nextIdx = slides.length - 1;
      if (nextIdx === currentStage && track.style.transform) return;

      var isBack = nextIdx < currentStage;
      currentStage = nextIdx;
      layoutStage(true);
      slides[currentStage].scrollTop = 0;

      var worldCode = slides[currentStage].getAttribute("data-world") || "1-1";
      if (hudWorld) hudWorld.textContent = worldCode;
      var slideId = slides[currentStage].id;
      if (slideId && window.history && window.history.replaceState) {
        try {
          window.history.replaceState(null, "", "#" + slideId);
        } catch (e) {}
      }

      for (var a = 0; a < navLinks.length; a++) {
        navLinks[a].classList.toggle(
          "is-active",
          navLinks[a].getAttribute("data-jump") === worldCode
        );
      }
      for (var d = 0; d < stageDots.length; d++) {
        stageDots[d].classList.toggle("is-active", d === currentStage);
      }

      var pct = stagePositions[currentStage] != null ? stagePositions[currentStage] : currentStage / Math.max(1, slides.length - 1);
      moveRunner(pct, isBack);
      if (window.LEI_WORLD && window.LEI_WORLD.stepStage) window.LEI_WORLD.stepStage();

      if (!silent) {
        sfx.stage();
        if (currentStage === slides.length - 1) {
          showToast(t("toast.save"));
        }
      }
    }

    // Bind buttons / nav / dots with data-go-stage
    var stageTriggers = document.querySelectorAll("[data-go-stage]");
    for (var st = 0; st < stageTriggers.length; st++) {
      stageTriggers[st].addEventListener("click", function (ev) {
        var idx = parseInt(this.getAttribute("data-go-stage"), 10);
        if (!isNaN(idx)) {
          ev.preventDefault();
          lockUntil = Date.now() + 550;
          goToStage(idx);
        }
      });
    }

    var warpTop = document.getElementById("warp-top");
    if (warpTop) {
      warpTop.addEventListener("click", function () {
        sfx.pipe();
        lockUntil = Date.now() + 550;
        goToStage(0, true);
      });
    }

    function canScrollInnerTarget(target, boundary, deltaY) {
      var el = target;
      while (el && el !== document.body && el !== document.documentElement) {
        if (el.scrollHeight > el.clientHeight + 4) {
          var style = window.getComputedStyle(el);
          var oy = style ? style.overflowY : "";
          if (oy === "auto" || oy === "scroll" || el === boundary) {
            var atTop = el.scrollTop <= 2;
            var atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
            if ((deltaY > 0 && !atBottom) || (deltaY < 0 && !atTop)) {
              return true;
            }
          }
        }
        if (el === boundary) break;
        el = el.parentElement;
      }
      return false;
    }

    // Wheel -> 1 page per swipe (respects inner scrollable notice boards first)
    window.addEventListener(
      "wheel",
      function (ev) {
        if (document.body.classList.contains("search-overlay")) return;
        var dy = ev.deltaY;
        if (Math.abs(dy) < 12) return;

        var activeSlide = slides[currentStage];
        if (canScrollInnerTarget(ev.target, activeSlide, dy)) {
          return; // allow scrolling inside the notice board first
        }

        ev.preventDefault();
        var now = Date.now();
        if (now < lockUntil) return;
        lockUntil = now + 620;

        if (dy > 0) {
          goToStage(currentStage + 1);
        } else {
          goToStage(currentStage - 1);
        }
      },
      { passive: false }
    );

    // Touch swipe -> 1 page per swipe (respects inner scrollable notice boards first)
    var touchStartY = 0;
    var touchStartTarget = null;
    window.addEventListener(
      "touchstart",
      function (ev) {
        if (ev.touches && ev.touches.length === 1) {
          touchStartY = ev.touches[0].clientY;
          touchStartTarget = ev.target;
        }
      },
      { passive: true }
    );

    window.addEventListener(
      "touchend",
      function (ev) {
        if (!ev.changedTouches || ev.changedTouches.length === 0) return;
        var diff = touchStartY - ev.changedTouches[0].clientY;
        if (Math.abs(diff) < 48) return;

        var activeSlide = slides[currentStage];
        if (canScrollInnerTarget(touchStartTarget || ev.target, activeSlide, diff)) {
          return;
        }

        var now = Date.now();
        if (now < lockUntil) return;
        lockUntil = now + 620;
        goToStage(diff > 0 ? currentStage + 1 : currentStage - 1);
      },
      { passive: true }
    );

    // Keyboard navigation
    window.addEventListener("keydown", function (ev) {
      var tag = (ev.target && ev.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (ev.key === "ArrowDown" || ev.key === "PageDown" || ev.key === " ") {
        ev.preventDefault();
        goToStage(currentStage + 1);
      } else if (ev.key === "ArrowUp" || ev.key === "PageUp") {
        ev.preventDefault();
        goToStage(currentStage - 1);
      } else if (ev.key >= "1" && ev.key <= String(slides.length)) {
        goToStage(parseInt(ev.key, 10) - 1);
      }
    });

    window.addEventListener("resize", function () {
      layoutStage(false);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", function () {
        layoutStage(false);
      });
    }
    window.addEventListener("orientationchange", function () {
      setTimeout(function () {
        layoutStage(false);
      }, 250);
    });

    var hashMap = {
      "#world-start": 0,
      "#1-1": 0,
      "#world-profile": 1,
      "#1-2": 1,
      "#world-papers": 2,
      "#1-3": 2,
      "#world-quests": 3,
      "#1-4": 3,
      "#world-contact": 4,
      "#1-5": 4,
      "#contact": 4
    };
    var initStage = hashMap.hasOwnProperty(window.location.hash) ? hashMap[window.location.hash] : 0;
    goToStage(initStage, true);
  } else {
    // Fallback for regular pages (About / Posts / Contact / Tags)
    if (hudWorld) {
      var p = window.location.pathname || "";
      if (p.indexOf("/about") === 0) hudWorld.textContent = "ARCHIVE";
      else if (p.indexOf("/contact") === 0) hudWorld.textContent = "GUILD";
      else if (p.indexOf("/tags") === 0) hudWorld.textContent = "TAGS";
      else if (p.indexOf("/category") === 0) hudWorld.textContent = "BOARD";
      else hudWorld.textContent = "QUEST";
    }
    var warpTopFallback = document.getElementById("warp-top");
    if (warpTopFallback) {
      warpTopFallback.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    var lastScrollY = window.pageYOffset || 0;
    var ticking = false;
    function updateFallback() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var pct = Math.min(1, Math.max(0, y / maxScroll));
      moveRunner(pct, y < lastScrollY - 2);
      lastScrollY = y;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(updateFallback);
        }
      },
      { passive: true }
    );
    updateFallback();
  }

  // Quest completion reward button on secondary post pages
  var completeBtn = document.querySelector("[data-quest-complete]");
  if (completeBtn) {
    var qKey = "lei_quest_done_" + window.location.pathname;
    if (sessionStorage.getItem(qKey) === "1") {
      completeBtn.classList.add("is-done");
      completeBtn.classList.add("is-done");
    }
    completeBtn.addEventListener("click", function () {
      if (this.classList.contains("is-done")) return;
      var reward = parseInt(this.getAttribute("data-coin-reward") || "2", 10);
      addCoins(reward);
      sfx.coin();
      this.classList.add("is-done");
      this.textContent = t("quest.done");
      sessionStorage.setItem(qKey, "1");
      showToast(t("toast.quest") + " +" + reward);
    });
  }

  var langBtn = document.getElementById("lang-toggle");
  if (langBtn) {
    langBtn.addEventListener("click", function () {
      lang = lang === "en" ? "zh" : "en";
      applyLang();
      sfx.step();
    });
  }
  applyLang();

  // Smooth pixel curtain transition between primary & secondary pages
  var curtain = document.getElementById("pixel-curtain");
  window.addEventListener("pageshow", function () {
    if (curtain) curtain.classList.remove("is-active");
  });

  if (curtain) {
    document.addEventListener("click", function (ev) {
      if (ev.defaultPrevented || ev.button !== 0) return;
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      var a = ev.target && ev.target.closest ? ev.target.closest("a") : null;
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || href.indexOf("mailto:") === 0 || href.indexOf("javascript:") === 0) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      if (pager && a.hasAttribute("data-go-stage")) return;
      try {
        var url = new URL(a.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.hash) return;
        ev.preventDefault();
        curtain.classList.add("is-active");
        setTimeout(function () {
          window.location.href = url.href;
        }, 160);
      } catch (e) {}
    });
  }
})();
