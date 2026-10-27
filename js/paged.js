/* =========================================================
 * Paged View —— 全屏分页 + 友達头像漂浮
 *   桌面：鼠标快速划过 → 驱散；慢速靠近/hover → 锁定可点
 *   移动：陀螺仪视差倾斜
 * 依赖：js/config.js、js/main.js（先加载）
 * ========================================================= */
(function () {
  "use strict";

  const cfg = window.SITE_CONFIG || {};
  const reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 物理/交互参数 ---------- */
  const VEL_THRESHOLD = 0.55;  // px/ms：超过才算"快速划过"
  const SPRING = 0.018;        // 回位弹簧
  const DAMP = 0.9;            // 阻尼
  const MAXOFF_K = 1.25;       // 最大位移 = base * 此系数
  const REACH_K = 1.9;         // 斥力半径 = base * 此系数
  /* 漂浮动画的最大摆幅（--dx ≤10、--dy×1.6 ≤19）留出的安全边距 */
  const SAFE_X = 14;
  const SAFE_Y = 24;

  const state = {
    field: null,
    items: [],
    base: 54,
    W: 0,
    H: 0,
    raf: 0,
    lastT: 0,
    visible: false,
    pointer: { x: 0, y: 0, active: false, speed: 0, lastX: 0, lastY: 0, lastT: 0 },
    gyro: { tx: 0, ty: 0, cx: 0, cy: 0, baseB: null, baseG: null, live: false }
  };

  function initialOf(name) {
    const s = String(name || "").trim();
    return s ? s.charAt(0).toUpperCase() : "·";
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  /* ==================== 构建节点 ==================== */
  function makeFallbackAvatar(name) {
    const el = document.createElement("span");
    el.className = "balloon-avatar balloon-avatar--fallback";
    el.textContent = initialOf(name);
    return el;
  }

  function makeAvatar(link) {
    if (link.avatar) {
      const img = document.createElement("img");
      img.className = "balloon-avatar";
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.addEventListener("error", function () {
        img.replaceWith(makeFallbackAvatar(link.name));
      });
      img.src = link.avatar;
      return img;
    }
    return makeFallbackAvatar(link.name);
  }

  /* slot(坐标) > offset(位移) > balloon(漂浮动画) */
  function makeSlot(link) {
    const slot = document.createElement("a");
    slot.className = "balloon-slot";
    slot.href = link.link || "#";
    slot.rel = "noopener";
    slot.title = link.name || link.link || "";
    if (!/^mailto:/i.test(link.link || "")) slot.target = "_blank";

    const offset = document.createElement("span");
    offset.className = "balloon-offset";

    const balloon = document.createElement("span");
    balloon.className = "balloon";

    if (!reduceMotion) {
      balloon.style.setProperty("--dur", (4.4 + Math.random() * 3.6).toFixed(2) + "s");
      balloon.style.setProperty("--delay", (Math.random() * 4).toFixed(2) + "s");
      balloon.style.setProperty("--tilt", (Math.random() * 8 - 4).toFixed(1) + "deg");
      balloon.style.setProperty("--dx", (4 + Math.random() * 6).toFixed(1) + "px");
      balloon.style.setProperty("--dy", (6 + Math.random() * 6).toFixed(1) + "px");
    }

    balloon.appendChild(makeAvatar(link));

    const string = document.createElement("span");
    string.className = "balloon-string";
    balloon.appendChild(string);

    const name = document.createElement("span");
    name.className = "balloon-name";
    name.textContent = link.name || link.link || "";
    balloon.appendChild(name);

    offset.appendChild(balloon);
    slot.appendChild(offset);

    slot.style.setProperty("--avk", (0.92 + Math.random() * 0.18).toFixed(3));
    slot.__offset = offset;

    return slot;
  }

  /* ==================== 散布（best-candidate） ==================== */
  function layoutBalloons() {
    const field = state.field;
    const items = state.items;
    const n = items.length;
    if (!field || !n) return;

    const W = field.clientWidth;
    const H = field.clientHeight;
    if (W < 40 || H < 40) return;

    const base = Math.max(32, Math.min(66, Math.min(W, H) / 8.4));
    state.base = base;
    state.W = W;
    state.H = H;
    field.style.setProperty("--avb", base.toFixed(1) + "px");

    items.forEach(function (it) {
      it.hx = (it.slot.offsetWidth || 112) / 2 + 6;
      it.hy = (it.slot.offsetHeight || 86) / 2 + 6;
    });

    const avgW = items.reduce(function (a, b) { return a + b.hx * 2; }, 0) / n;
    const avgH = items.reduce(function (a, b) { return a + b.hy * 2; }, 0) / n;

    let minDist = Math.sqrt((W * H) / n) * 0.8;
    minDist = Math.max(Math.max(avgW, avgH) * 0.85, Math.min(minDist, W * 0.4));

    const placed = [];
    const order = shuffle(items.map(function (_, i) { return i; }));
    const ATTEMPTS = 160;

    order.forEach(function (i) {
      const it = items[i];
      const spanX = Math.max(10, W - it.hx * 2);
      const spanY = Math.max(10, H - it.hy * 2);

      let best = null;
      let bestScore = -1;

      for (let a = 0; a < ATTEMPTS; a++) {
        const x = it.hx + Math.random() * spanX;
        const y = it.hy + Math.random() * spanY;

        let dmin = Infinity;
        for (let k = 0; k < placed.length; k++) {
          const dx = placed[k].x - x;
          const dy = placed[k].y - y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < dmin) dmin = d;
        }

        if (dmin > bestScore) {
          bestScore = dmin;
          best = { x: x, y: y };
        }
        if (dmin >= minDist) break;
      }

      placed.push(best);
      it.x0 = best.x;
      it.y0 = best.y;
      it.ox = it.oy = it.vx = it.vy = 0;
      it.lx = it.ly = 0;
      it.slot.style.left = best.x.toFixed(1) + "px";
      it.slot.style.top = best.y.toFixed(1) + "px";
    });
  }

  /* ==================== 物理循环 ==================== */
  function tick(now) {
    const dtMs = Math.min(48, now - (state.lastT || now));
    state.lastT = now;
    const dt = dtMs / 16.667;

    const p = state.pointer;
    p.speed *= Math.pow(0.86, dt);   // 不动时速度自然衰减

    const g = state.gyro;
    if (g.live) {
      g.cx += (g.tx - g.cx) * Math.min(1, 0.14 * dt);
      g.cy += (g.ty - g.cy) * Math.min(1, 0.14 * dt);
    }

    const base = state.base;
    const R = base * REACH_K;
    const MAXOFF = base * MAXOFF_K;

    for (let i = 0; i < state.items.length; i++) {
      const it = state.items[i];

      /* 指针斥力：仅鼠标 + 快速 + 未被 hover 锁定 */
      if (p.active && !it.locked && p.speed > VEL_THRESHOLD) {
        const dx = it.x0 + it.ox - p.x;
        const dy = it.y0 + it.oy - p.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.001;
        if (d < R) {
          const f = (1 - d / R) * 2.6 * dt;
          it.vx += (dx / d) * f;
          it.vy += (dy / d) * f;
        }
      }

      /* 弹簧回位 + 阻尼 */
      it.vx += -it.ox * SPRING * dt;
      it.vy += -it.oy * SPRING * dt;
      const damp = Math.pow(DAMP, dt);
      it.vx *= damp;
      it.vy *= damp;
      it.ox += it.vx * dt;
      it.oy += it.vy * dt;

      const od = Math.sqrt(it.ox * it.ox + it.oy * it.oy);
      if (od > MAXOFF) {
        it.ox = (it.ox / od) * MAXOFF;
        it.oy = (it.oy / od) * MAXOFF;
      }

      /* 陀螺仪视差：按 depth 分层 */
      const gx = g.live ? g.cx * it.depth : 0;
      const gy = g.live ? g.cy * it.depth : 0;

      let fx = it.ox + gx;
      let fy = it.oy + gy;

      /* 硬约束：含漂浮摆幅余量，保证整块元素不出画布 */
      const minX = it.hx + SAFE_X - it.x0;
      const maxX = state.W - it.hx - SAFE_X - it.x0;
      const minY = it.hy + SAFE_Y - it.y0;
      const maxY = state.H - it.hy - SAFE_Y - it.y0;

      if (minX <= maxX) {
        if (fx < minX) {
          fx = minX;
          if (it.ox < minX) it.ox = minX;
          if (it.vx < 0) it.vx *= 0.25;
        } else if (fx > maxX) {
          fx = maxX;
          if (it.ox > maxX) it.ox = maxX;
          if (it.vx > 0) it.vx *= 0.25;
        }
      } else {
        fx = state.W / 2 - it.x0;
        it.ox = fx;
        it.vx = 0;
      }

      if (minY <= maxY) {
        if (fy < minY) {
          fy = minY;
          if (it.oy < minY) it.oy = minY;
          if (it.vy < 0) it.vy *= 0.25;
        } else if (fy > maxY) {
          fy = maxY;
          if (it.oy > maxY) it.oy = maxY;
          if (it.vy > 0) it.vy *= 0.25;
        }
      } else {
        fy = state.H / 2 - it.y0;
        it.oy = fy;
        it.vy = 0;
      }

      if (Math.abs(fx - it.lx) > 0.15 || Math.abs(fy - it.ly) > 0.15) {
        it.el.style.setProperty("--ox", fx.toFixed(1) + "px");
        it.el.style.setProperty("--oy", fy.toFixed(1) + "px");
        it.lx = fx;
        it.ly = fy;
      }
    }

    state.raf = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (reduceMotion || state.raf) return;
    state.lastT = 0;
    state.raf = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
  }

  /* ==================== 指针交互 ==================== */
  function bindPointer(field) {
    field.addEventListener(
      "pointermove",
      function (e) {
        if (e.pointerType !== "mouse") return;   // 触摸不驱散
        const rect = field.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const p = state.pointer;
        const now = performance.now();

        if (p.lastT) {
          const dt = Math.max(8, now - p.lastT);
          const dist = Math.sqrt((x - p.lastX) * (x - p.lastX) + (y - p.lastY) * (y - p.lastY));
          p.speed = p.speed * 0.55 + (dist / dt) * 0.45;
        }

        p.x = x;
        p.y = y;
        p.active = true;
        p.lastX = x;
        p.lastY = y;
        p.lastT = now;
      },
      { passive: true }
    );

    field.addEventListener("pointerleave", function () {
      state.pointer.active = false;
      state.pointer.speed = 0;
      state.pointer.lastT = 0;
    });

    state.items.forEach(function (it) {
      it.slot.addEventListener("pointerenter", function (e) {
        if (e.pointerType !== "mouse") return;
        it.locked = true;
        it.ox = it.oy = it.vx = it.vy = 0;
        it.el.style.setProperty("--ox", "0px");
        it.el.style.setProperty("--oy", "0px");
        it.lx = it.ly = 0;
      });
      it.slot.addEventListener("pointerleave", function (e) {
        if (e.pointerType !== "mouse") return;
        it.locked = false;
      });
    });
  }

  /* ==================== 陀螺仪视差 ==================== */
  function onOrient(e) {
    if (e.beta == null && e.gamma == null) return;
    const g = state.gyro;
    if (g.baseB === null) {
      g.baseB = e.beta || 0;
      g.baseG = e.gamma || 0;
    }
    let db = (e.beta || 0) - g.baseB;
    let dg = (e.gamma || 0) - g.baseG;
    db = Math.max(-32, Math.min(32, db)) / 32;
    dg = Math.max(-32, Math.min(32, dg)) / 32;

    const MAXP = state.base * 0.55;
    g.tx = dg * MAXP;
    g.ty = db * MAXP * 0.7;
    g.live = true;
  }

  function attachGyro() {
    window.addEventListener("deviceorientation", onOrient, { passive: true });
  }

  function setupGyro() {
    if (typeof window.DeviceOrientationEvent === "undefined") return;

    const needPerm = typeof window.DeviceOrientationEvent.requestPermission === "function";

    if (!needPerm) {
      attachGyro();   // Android：直接挂，是否真能触发取决于是否 https
      return;
    }

    /* iOS 13+：必须用户手势里请求权限 */
    const titleEl = document.querySelector(".page--float .page-title");
    if (!titleEl) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gyro-btn";
    btn.textContent = "开启体感";

    btn.addEventListener("click", function () {
      Promise.resolve(window.DeviceOrientationEvent.requestPermission())
        .then(function (res) {
          if (res === "granted") {
            attachGyro();
            btn.hidden = true;
          } else {
            btn.textContent = "体感被拒绝";
          }
        })
        .catch(function () {
          btn.textContent = "体感不可用";
        });
    });

    titleEl.appendChild(btn);
  }

  /* ==================== 渲染入口 ==================== */
  function renderFriends() {
    const field = document.getElementById("friends-body");
    if (!field || !Array.isArray(cfg.friends)) return;

    const links = [];
    cfg.friends.forEach(function (grp) {
      (grp.links || []).forEach(function (l) {
        links.push(l);
      });
    });
    if (!links.length) return;

    state.field = field;

    const frag = document.createDocumentFragment();
    links.forEach(function (l) {
      frag.appendChild(makeSlot(l));
    });
    field.appendChild(frag);

    // 建立条目状态
    const slots = Array.prototype.slice.call(field.querySelectorAll(".balloon-slot"));
    state.items = slots.map(function (slot) {
      return {
        slot: slot,
        el: slot.__offset,
        x0: 0,
        y0: 0,
        ox: 0,
        oy: 0,
        vx: 0,
        vy: 0,
        lx: 0,
        ly: 0,
        locked: false,
        depth: 0.55 + Math.random() * 0.9,   // 视差分层
        hx: 60,
        hy: 45
      };
    });

    layoutBalloons();

    if (!reduceMotion) {
      bindPointer(field);
      setupGyro();

      /* 只在 P3 可见时跑 rAF */
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(
          function (entries) {
            entries.forEach(function (en) {
              state.visible = en.isIntersecting;
              if (state.visible) startLoop();
              else stopLoop();
            });
          },
          { threshold: 0.25 }
        ).observe(field);
      } else {
        startLoop();
      }
    }

    let timer = null;
    window.addEventListener("resize", function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(layoutBalloons, 160);
    });
  }

  /* ==================== 分页导航 ==================== */
  function initPager() {
    const pager = document.getElementById("pager");
    const dotsNav = document.getElementById("pager-dots");
    if (!pager || !dotsNav) return;

    const pages = Array.prototype.slice.call(pager.querySelectorAll(".page"));
    if (!pages.length) return;

    let active = -1;
    const dots = [];

    pages.forEach(function (pg, i) {
      const label = pg.getAttribute("data-title") || "第 " + (i + 1) + " 页";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pager-dot";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("data-label", label);
      btn.addEventListener("click", function () {
        goTo(i);
      });
      dotsNav.appendChild(btn);
      dots.push(btn);
    });

    function goTo(i) {
      const idx = Math.max(0, Math.min(pages.length - 1, i));
      pages[idx].scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start"
      });
    }

    function setActive(i) {
      if (i < 0 || i >= pages.length || i === active) return;
      active = i;
      dots.forEach(function (d, k) {
        d.classList.toggle("active", k === i);
      });
      if (window.history && history.replaceState) {
        history.replaceState(null, "", "#p" + (i + 1));
      }
    }

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting && en.intersectionRatio >= 0.55) {
              setActive(pages.indexOf(en.target));
            }
          });
        },
        { root: pager, threshold: [0.55, 0.75, 0.95] }
      );
      pages.forEach(function (p) {
        io.observe(p);
      });
    }

    window.addEventListener(
      "keydown",
      function (e) {
        const t = e.target;
        if (t && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(t.tagName)) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;

        const cur = active < 0 ? 0 : active;
        let next = null;

        if (e.key === "ArrowDown" || e.key === "PageDown") next = cur + 1;
        else if (e.key === "ArrowUp" || e.key === "PageUp") next = cur - 1;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = pages.length - 1;

        if (next !== null) {
          e.preventDefault();
          goTo(next);
        }
      },
      { passive: false }
    );

    const m = /^#p(\d+)$/.exec(window.location.hash || "");
    if (m) {
      const idx = parseInt(m[1], 10) - 1;
      if (idx >= 0 && idx < pages.length) {
        setActive(idx);
        requestAnimationFrame(function () {
          pages[idx].scrollIntoView({ behavior: "auto", block: "start" });
        });
        return;
      }
    }
    setActive(0);
  }

  renderFriends();
  initPager();
})();
