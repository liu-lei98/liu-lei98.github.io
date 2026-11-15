(function () {
  var SFX_KEY = "lei_pixel_sfx";
  var COIN_KEY = "lei_pixel_coins";
  var sfxOn = false;
  var audioCtx = null;

  try {
    sfxOn = sessionStorage.getItem(SFX_KEY) === "1";
  } catch (e) {}

  var coins = 0;
  try {
    coins = parseInt(sessionStorage.getItem(COIN_KEY) || "0", 10) || 0;
  } catch (e) {}

  function ensureAudio() {
    if (!sfxOn) return null;
    if (!audioCtx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
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
      gain.gain.setValueAtTime(0.055, t);
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
      playTone([{ f: 523, d: 0.05 }, { f: 659, d: 0.06 }]);
    },
    chest: function () {
      playTone([
        { f: 523, d: 0.08 },
        { f: 659, d: 0.08 },
        { f: 784, d: 0.08 },
        { f: 1046, d: 0.22 }
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
        showToast("8-BIT 音效已开启 ♪");
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
  var lines = [
    "专注计算成像 (Computational Imaging)、光谱重建与深度学习应用。下滑或按 ↓ 键，直接切换至下一关卡！",
    "近期研究发表于 Pattern Recognition (2026)、IEEE TMM (2024) 与 IEEE TGRS (2023)，前往 1-3 关可查看引用量与 BibTeX。",
    "常用装备：Python · PyTorch · MATLAB · LaTeX · Overleaf · Docker。",
    "座右铭：Practice Makes Perfect | Keep Learning | Grow Every Day。"
  ];
  var lineIdx = 0;
  if (dialogLine && nextLineBtn) {
    nextLineBtn.addEventListener("click", function () {
      lineIdx = (lineIdx + 1) % lines.length;
      dialogLine.textContent = lines[lineIdx];
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
        var text = this.getAttribute("data-desc") || "";
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
        invRole.textContent = this.getAttribute("data-role") || "";
      }
      sfx.step();
    });
  }

  // IEEE Paper Treasure Chests
  var bibButtons = document.querySelectorAll("[data-toggle-bib]");
  for (var b = 0; b < bibButtons.length; b++) {
    bibButtons[b].addEventListener("click", function () {
      var card = this.closest("[data-chest]");
      if (!card) return;
      var loot = card.querySelector(".chest-loot");
      var isOpen = card.classList.toggle("is-open");
      if (loot) loot.hidden = !isOpen;
      this.textContent = isOpen ? "收起卷轴" : "开启宝箱 · BibTeX";
      if (isOpen) {
        sfx.chest();
        if (!card.getAttribute("data-looted")) {
          card.setAttribute("data-looted", "1");
          addCoins(2, "GET! 开启论文宝箱 +2 COINS");
        }
      } else {
        sfx.step();
      }
    });
  }

  var copyButtons = document.querySelectorAll("[data-copy-bib]");
  for (var c = 0; c < copyButtons.length; c++) {
    copyButtons[c].addEventListener("click", function () {
      var loot = this.closest(".chest-loot");
      var pre = loot ? loot.querySelector("pre") : null;
      if (!pre) return;
      var text = pre.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          sfx.coin();
          showToast("BibTeX 已复制到剪贴板！");
        });
      } else {
        showToast("请手动选中 BibTeX 复制");
      }
    });
  }

  // Live citation counts via OpenAlex API (with fallback values)
  var chestCards = document.querySelectorAll("[data-doi]");
  var totalCitesEl = document.getElementById("total-cites-num");
  if (chestCards.length && window.fetch) {
    var counts = [];
    for (var ci = 0; ci < chestCards.length; ci++) {
      counts.push(parseInt(chestCards[ci].getAttribute("data-fallback-cites") || "0", 10) || 0);
    }

    function updateTotalCites() {
      if (!totalCitesEl) return;
      var sum = 0;
      for (var s = 0; s < counts.length; s++) sum += counts[s];
      totalCitesEl.textContent = String(sum);
    }

    for (var idx = 0; idx < chestCards.length; idx++) {
      (function (card, index) {
        var doi = card.getAttribute("data-doi");
        var out = card.querySelector("[data-cite-count]");
        if (!doi || !out) return;
        fetch("https://api.openalex.org/works/https://doi.org/" + encodeURIComponent(doi))
          .then(function (r) {
            return r.ok ? r.json() : null;
          })
          .then(function (data) {
            if (data && typeof data.cited_by_count === "number") {
              counts[index] = data.cited_by_count;
              out.textContent = String(data.cited_by_count);
              updateTotalCites();
            }
          })
          .catch(function () {});
      })(chestCards[idx], idx);
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
  var navLinks = document.querySelectorAll(".runner-nav a[data-jump]");
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
    var stagePositions = [0, 0.34, 0.68, 1.0];

    function goToStage(nextIdx, silent) {
      if (nextIdx < 0) nextIdx = 0;
      if (nextIdx >= slides.length) nextIdx = slides.length - 1;
      if (nextIdx === currentStage && track.style.transform) return;

      var isBack = nextIdx < currentStage;
      currentStage = nextIdx;
      track.style.transform = "translate3d(0, -" + currentStage * 100 + "vh, 0)";
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

      if (!silent) {
        sfx.stage();
        if (currentStage === slides.length - 1) {
          showToast("⚑ SAVE POINT · 已抵达 1-4 存档点！");
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

    // Wheel -> 1 page per swipe (respects inner overflow if a slide is taller than viewport)
    window.addEventListener(
      "wheel",
      function (ev) {
        if (document.body.classList.contains("search-overlay")) return;
        var dy = ev.deltaY;
        if (Math.abs(dy) < 12) return;

        var activeSlide = slides[currentStage];
        var canScrollInner = activeSlide.scrollHeight > activeSlide.clientHeight + 4;
        if (canScrollInner) {
          var atTop = activeSlide.scrollTop <= 2;
          var atBottom = activeSlide.scrollTop + activeSlide.clientHeight >= activeSlide.scrollHeight - 2;
          if ((dy > 0 && !atBottom) || (dy < 0 && !atTop)) {
            return; // allow internal scroll first
          }
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

    // Touch swipe -> 1 page per swipe
    var touchStartY = 0;
    window.addEventListener(
      "touchstart",
      function (ev) {
        if (ev.touches && ev.touches.length === 1) {
          touchStartY = ev.touches[0].clientY;
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
        var canScrollInner = activeSlide.scrollHeight > activeSlide.clientHeight + 4;
        if (canScrollInner) {
          var atTop = activeSlide.scrollTop <= 2;
          var atBottom = activeSlide.scrollTop + activeSlide.clientHeight >= activeSlide.scrollHeight - 2;
          if ((diff > 0 && !atBottom) || (diff < 0 && !atTop)) return;
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

    var hashMap = {
      "#world-start": 0,
      "#1-1": 0,
      "#world-profile": 1,
      "#1-2": 1,
      "#world-papers": 2,
      "#1-3": 2,
      "#world-quests": 3,
      "#1-4": 3
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
        sfx.pipe();
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
      completeBtn.textContent = "★ 已领取任务奖励";
    }
    completeBtn.addEventListener("click", function () {
      if (this.classList.contains("is-done")) return;
      var reward = parseInt(this.getAttribute("data-coin-reward") || "2", 10);
      addCoins(reward);
      sfx.coin();
      this.classList.add("is-done");
      this.textContent = "★ 已领取任务奖励";
      sessionStorage.setItem(qKey, "1");
      showToast("★ 任务完成！获得 +" + reward + " COIN");
    });
  }

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
