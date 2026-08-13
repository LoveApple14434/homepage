/* =========================================================
 * 个人首页 交互逻辑
 * ========================================================= */
(function () {
  "use strict";

  const cfg = window.SITE_CONFIG;

  /* ==================== 主题切换 ==================== */
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = themeToggle.querySelector(".theme-icon");
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);

  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("theme", next);
  });

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  /* ==================== 个人简介 ==================== */
  const $ = (id) => document.getElementById(id);
  $("avatar").src = cfg.avatar || "";
  $("avatar").onerror = function () {
    this.src = "data:image/svg+xml," + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>
         <rect width='120' height='120' fill='#ffc0cb'/>
         <text x='60' y='72' font-size='56' text-anchor='middle'>🌸</text>
       </svg>`);
  };
  $("name").textContent = cfg.name;

  /* -------- 关键词词云（简介） -------- */
  const wc = $("wordcloud");
  if (wc) {
    const wcColors = [
      "var(--primary-deep)", "var(--primary-dark)",
      "var(--text)", "var(--primary-deep)", "var(--text-soft)",
    ];
    (cfg.keywords || []).forEach((k, i) => {
      const span = document.createElement("span");
      span.className = "wc-item";
      const text = (k && typeof k === "object") ? k.text : k;
      // 每次渲染随机权重（1~5），形成自然的词云层次
      const weight = 1 + Math.floor(Math.random() * 5);
      span.textContent = text;
      span.style.fontSize = (0.85 + weight * 0.18) + "rem";
      span.style.color = wcColors[i % wcColors.length];
      span.style.animationDelay = (i * 0.04) + "s";
      wc.appendChild(span);
    });
  }

  /* -------- 打字机标语 -------- */
  const typedEl = $("typed");
  let tagIndex = 0, charIndex = 0, deleting = false;
  const taglines = cfg.taglines && cfg.taglines.length ? cfg.taglines : [""];

  function typeTick() {
    const text = taglines[tagIndex];
    if (!deleting) {
      charIndex++;
      typedEl.textContent = text.slice(0, charIndex);
      if (charIndex === text.length) {
        deleting = true;
        setTimeout(typeTick, 1600);   // 停留
        return;
      }
      setTimeout(typeTick, 90);
    } else {
      charIndex--;
      typedEl.textContent = text.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        tagIndex = (tagIndex + 1) % taglines.length;
        setTimeout(typeTick, 300);
        return;
      }
      setTimeout(typeTick, 40);
    }
  }
  setTimeout(typeTick, 500);

  /* ==================== 社交链接 ==================== */
  const socialsEl = $("socials");
  (cfg.socials || []).forEach((s) => {
    const a = document.createElement("a");
    a.href = s.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.innerHTML = `<span>${s.icon || "🔗"}</span>${s.name || ""}`;
    socialsEl.appendChild(a);
  });

  /* ==================== 时钟 & 问候 ==================== */
  const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

  function tickClock() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    $("clock").textContent =
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    $("date").textContent =
      `${now.getFullYear()}年${pad(now.getMonth() + 1)}月${pad(now.getDate())}日 星期${WEEK[now.getDay()]}`;
    $("greeting").textContent = greetingOf(now.getHours());
  }

  function greetingOf(h) {
    if (h < 5) return "夜深了，注意休息 🌙";
    if (h < 9) return "早上好，新的一天 ☀️";
    if (h < 12) return "上午好，元气满满 ✨";
    if (h < 14) return "中午好，记得吃饭 🍚";
    if (h < 18) return "下午好，继续加油 ⚡";
    if (h < 22) return "晚上好，辛苦啦 🌆";
    return "夜深了，早点休息 🌙";
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ==================== LocalSearch 搜索 ==================== */
  const searchInput = $("search-input");
  const searchBtn = $("search-btn");
  const resultsBox = $("search-results");
  const ls = cfg.search && cfg.search.type === "localsearch" ? cfg.search : null;

  let indexPromise = null;   // 搜索索引（懒加载一次，失败可重试）
  let lastQuery = "";

  function decodeEntities(s) {
    const t = document.createElement("textarea");
    t.innerHTML = s;
    return t.value;
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function stripHtml(s) {
    const t = document.createElement("div");
    t.innerHTML = s;
    return t.textContent || "";
  }

  /* 加载 search.json（hexo-generator-search 输出为数组） */
  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch(ls.api)
        .then((r) => {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        })
        .then((data) => {
          const list = Array.isArray(data) ? data : data.data || [];
          return list.map((item) => ({
            title: String(item.title || "无标题"),
            url: ls.base + (item.url || ""),
            content: decodeEntities(String(item.content || "")),
            tags: item.tags || [],
            categories: item.categories || [],
          }));
        })
        .catch((err) => {
          indexPromise = null; // 失败后允许下次重试
          throw err;
        });
    }
    return indexPromise;
  }

  /* 给匹配关键词加 <mark> 高亮 */
  function highlight(text, query) {
    const kws = query.trim().split(/\s+/).filter(Boolean);
    let out = escapeHtml(text);
    kws.forEach((k) => {
      const e = escapeHtml(k);
      if (!e) return;
      const re = new RegExp("(" + e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
      out = out.replace(re, "<mark>$1</mark>");
    });
    return out;
  }

  /* 生成摘要：取第一个关键词附近的一段文字 */
  function makeSnippet(content, query, len = 90) {
    const text = stripHtml(content).replace(/\s+/g, " ").trim();
    const first = query.trim().split(/\s+/)[0];
    const idx = first ? text.toLowerCase().indexOf(first.toLowerCase()) : -1;
    const start = idx > -1 ? Math.max(0, idx - 20) : 0;
    const seg = text.slice(start, start + len);
    return (start > 0 ? "… " : "") + seg + (start + len < text.length ? " …" : "");
  }

  function showStatus(html) {
    resultsBox.hidden = false;
    resultsBox.innerHTML = `<div class="result-status">${html}</div>`;
  }

  function renderResults(items, query) {
    resultsBox.hidden = false;
    resultsBox.innerHTML = "";
    if (!items.length) {
      resultsBox.innerHTML = `<div class="result-status">未找到与 “${escapeHtml(query)}” 相关的文章</div>`;
      return;
    }
    const meta = document.createElement("div");
    meta.className = "result-meta";
    meta.textContent = `共找到 ${items.length} 篇相关文章`;
    resultsBox.appendChild(meta);

    const frag = document.createDocumentFragment();
    items.slice(0, 10).forEach((item) => {
      const a = document.createElement("a");
      a.className = "result-item";
      a.href = item.url;
      a.target = "_blank";
      a.rel = "noopener";

      const t = document.createElement("div");
      t.className = "result-title";
      t.innerHTML = highlight(item.title, query);
      const s = document.createElement("div");
      s.className = "result-snippet";
      s.innerHTML = highlight(makeSnippet(item.content, query), query);

      a.appendChild(t);
      a.appendChild(s);
      frag.appendChild(a);
    });
    resultsBox.appendChild(frag);
  }

  async function doSearch(q) {
    if (!q || !ls) return;
    showStatus("正在加载搜索索引…");
    try {
      const index = await loadIndex();
      if (q !== searchInput.value.trim()) return; // 输入已变化，丢弃过期结果
      const kws = q.toLowerCase().split(/\s+/).filter(Boolean);
      const items = index.filter((item) => {
        const hay = (item.title + " " + item.content + " " +
          (item.tags || []).join(" ") + " " + (item.categories || []).join(" ")).toLowerCase();
        return kws.every((k) => hay.includes(k));
      });
      renderResults(items, q);
    } catch (err) {
      if (q !== searchInput.value.trim()) return;
      showStatus(`⚠️ 搜索数据加载失败：${escapeHtml(err.message)}`);
    }
  }

  /* 输入防抖搜索 */
  let searchTimer = null;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    lastQuery = searchInput.value.trim();
    if (!lastQuery) {
      resultsBox.hidden = true;
      resultsBox.innerHTML = "";
      return;
    }
    searchTimer = setTimeout(() => doSearch(lastQuery), 200);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const first = resultsBox.querySelector(".result-item");
      if (first) { first.click(); return; }
      if (lastQuery) doSearch(lastQuery);
    }
    if (e.key === "Escape") {
      resultsBox.hidden = true;
      searchInput.blur();
    }
  });

  searchBtn.addEventListener("click", () => { if (lastQuery) doSearch(lastQuery); });

  /* 点击搜索框外部时关闭结果面板 */
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search")) resultsBox.hidden = true;
  });

  /* 按 / 快速聚焦搜索框 */
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  /* ==================== 快捷链接 ==================== */
  const groupsEl = $("groups");

  /* 站点 favicon：优先取配置的固定图标，其次 Google 服务，最后回退站点自带 favicon.ico */
  function faviconUrl(url) {
    try {
      const u = new URL(url);
      const fixed = cfg.favicons && cfg.favicons[u.hostname];
      if (fixed) return fixed;
      return "https://www.google.com/s2/favicons?domain=" + u.hostname + "&sz=64";
    } catch (e) {
      return "";
    }
  }
  function siteIconUrl(url) {
    try {
      return new URL(url).origin + "/favicon.ico";
    } catch (e) {
      return "";
    }
  }

  (cfg.groups || []).forEach((group, i) => {
    const sec = document.createElement("section");
    sec.className = "group";
    sec.style.animationDelay = (0.15 + i * 0.08) + "s";

    const title = document.createElement("h2");
    title.className = "group-title";
    title.textContent = group.title;
    sec.appendChild(title);

    const links = document.createElement("div");
    links.className = "links";
    (group.links || []).forEach((l) => {
      const a = document.createElement("a");
      a.className = "link-card";
      a.href = l.url;
      a.target = "_blank";
      a.rel = "noopener";

      // 图标优先级：1) 显式图片 URL → 图片图标；2) 显式 emoji/文本 → 文本图标；3) 都没有 → 站点 favicon
      const iconText = (l.icon && String(l.icon).trim()) || "";
      const isImgIcon = !!iconText && (
        /^(https?:)?\/\//i.test(iconText) ||
        /^data:image\//i.test(iconText) ||
        /\.(png|jpe?g|gif|svg|webp|ico|bmp)(\?|#|$)/i.test(iconText)
      );

      if (isImgIcon) {
        const img = document.createElement("img");
        img.className = "icon-img";
        img.alt = "";
        img.loading = "lazy";
        img.onerror = () => img.remove();
        a.appendChild(img);
        img.src = iconText;
      } else if (iconText) {
        const iconSpan = document.createElement("span");
        iconSpan.className = "icon";
        iconSpan.textContent = iconText;
        a.appendChild(iconSpan);
      } else {
        const img = document.createElement("img");
        img.className = "favicon";
        img.alt = "";
        img.style.opacity = "0"; // 加载完成后再显示，避免破图闪烁
        img.onload = () => { img.style.opacity = "1"; };
        img.onerror = () => {
          const fallback = siteIconUrl(l.url);
          if (fallback && img.dataset.stage !== "site") {
            img.dataset.stage = "site";
            img.src = fallback;
          } else {
            img.remove();
          }
        };
        a.appendChild(img);
        img.src = faviconUrl(l.url) || "";
      }

      const nameSpan = document.createElement("span");
      nameSpan.className = "name";
      nameSpan.textContent = l.name || "";
      a.appendChild(nameSpan);

      links.appendChild(a);
    });
    sec.appendChild(links);
    groupsEl.appendChild(sec);
  });

  /* ==================== GitHub 贡献图 ==================== */
  (function renderGitHub() {
    const gh = cfg.github;
    const panel = $("github-panel");
    const link = $("github-link");
    const grid = $("github-chart");
    const totalEl = $("gh-total");
    if (!gh || !gh.username || !panel || !grid) return;
    const user = gh.username;
    link.href = "https://github.com/" + user;
    const apiBase = gh.api || "https://github-contributions-api.jogruber.de/v4/";
    const MARGIN = 2; // 每个格子左右 margin 合计

    const toDate = (iso) => new Date(iso + "T00:00:00");
    const iso = (d) => d.toISOString().slice(0, 10);

    /* 把每日贡献按“周(列) × 7(行)”组织，周日起始，与 GitHub 一致 */
    function buildWeeks(list) {
      const byDate = {};
      list.forEach((c) => { byDate[c.date] = c; });
      const dates = list.map((c) => c.date).sort();
      const start = toDate(dates[0]);
      start.setDate(start.getDate() - start.getDay());
      const end = toDate(dates[dates.length - 1]);
      end.setDate(end.getDate() + (6 - end.getDay()));
      const weeks = [];
      const cur = new Date(start);
      while (cur <= end) {
        const week = [];
        for (let i = 0; i < 7; i++) {
          week.push(byDate[iso(cur)] || null);
          cur.setDate(cur.getDate() + 1);
        }
        weeks.push(week);
      }
      return weeks;
    }

    function render(weeks, total) {
      const avail = grid.clientWidth || 600;
      const colW = Math.max(8, Math.min(13, Math.floor((avail - (weeks.length - 1) * MARGIN) / weeks.length)));
      const cellSz = colW - MARGIN;

      grid.innerHTML = "";
      weeks.forEach((week) => {
        // 贡献列
        const col = document.createElement("div");
        col.className = "gh-col";
        col.style.flex = "0 0 " + colW + "px";
        week.forEach((c) => {
          const d = document.createElement("div");
          d.className = "gh-cell" + (c ? " gh-lv" + Math.min(c.level || 0, 4) : " gh-lv0");
          d.style.width = cellSz + "px";
          d.style.height = cellSz + "px";
          if (c) d.title = c.date + " · " + c.count + " 次提交";
          col.appendChild(d);
        });
        grid.appendChild(col);
      });

      if (totalEl) totalEl.textContent = "近一年共 " + total + " 次提交";
    }

    panel.hidden = false;
    fetch(apiBase + user + "?y=last")
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then((data) => {
        const list = data.contributions || [];
        if (!list.length) throw new Error("数据为空");
        render(buildWeeks(list), data.total && data.total.lastYear);
      })
      .catch((err) => {
        grid.innerHTML = `<div class="gh-error">贡献数据加载失败：${escapeHtml(err.message)}</div>`;
      });
  })();

  /* ==================== RSS / Atom 订阅 ==================== */
  (function renderFeeds() {
    const feeds = cfg.feeds;
    const panel = $("feed-panel");
    if (!feeds || !panel) return;

    const items = feeds.items && feeds.items.length ? feeds.items : [];
    if (!items.length) return;

    $("feed-title").textContent = feeds.title || "订阅更新";
    $("feed-desc").textContent = feeds.description || "";
    $("feed-tip").textContent = feeds.tip || "";

    const box = $("feed-links");
    items.forEach((f) => {
      const a = document.createElement("a");
      a.className = "feed-card";
      a.href = f.url;
      a.target = "_blank";
      a.rel = "noopener";

      const icon = document.createElement("span");
      icon.className = "feed-icon";
      icon.textContent = f.icon || "📡";

      const info = document.createElement("span");
      info.className = "feed-info";

      const name = document.createElement("span");
      name.className = "feed-name";
      name.textContent = f.name || "";

      const note = document.createElement("span");
      note.className = "feed-note";
      note.textContent = f.note || "";

      info.appendChild(name);
      info.appendChild(note);
      a.appendChild(icon);
      a.appendChild(info);
      box.appendChild(a);
    });

    panel.hidden = false;
  })();

  /* ==================== 页脚 ==================== */
  $("copyright").textContent = window.COPYRIGHT_TEXT || "";

  /* ==================== 樱花飘落动画 ==================== */
  const canvas = document.getElementById("sakura");
  const ctx = canvas.getContext("2d");
  let petals = [];
  let rafId = null;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  function initPetals() {
    const count = Math.min(45, Math.floor(window.innerWidth / 24));
    petals = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 4 + Math.random() * 7,
      speedY: 0.6 + Math.random() * 1.2,        // 下落速度
      speedX: 0.4 + Math.random() * 0.8,        // 横向漂移
      sway: Math.random() * Math.PI * 2,        // 摇摆相位
      swaySpeed: 0.01 + Math.random() * 0.02,
      opacity: 0.5 + Math.random() * 0.4,
      angle: Math.random() * Math.PI * 2,       // 旋转角度
      rotSpeed: 0.005 + Math.random() * 0.015,
    }));
  }
  initPetals();

  function drawPetals() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of petals) {
      p.sway += p.swaySpeed;
      p.x += p.speedX + Math.sin(p.sway) * 0.5;
      p.y += p.speedY;
      p.angle += p.rotSpeed;

      // 超出屏幕则从顶部重新落下
      if (p.y > canvas.height + 15) {
        p.y = -15;
        p.x = Math.random() * canvas.width;
      }
      if (p.x > canvas.width + 15) p.x = -15;
      if (p.x < -15) p.x = canvas.width + 15;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = "#ffc0cb";
      // 画一片花瓣：两个圆弧
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    rafId = requestAnimationFrame(drawPetals);
  }
  drawPetals();

  /* 减少运动时暂停动画（无障碍友好） */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    cancelAnimationFrame(rafId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
})();
