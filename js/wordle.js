/* =========================================================
 * Wordle 结果卡片 —— 只读取远程成绩并展示
 * 数据由油猴脚本同步到 VPS，前端不提供导入/导出。
 * 只展示颜色状态，不保存或显示猜测的字母。
 * ========================================================= */
(function () {
  "use strict";

  const DEFAULT_DATA_URL = "https://loveapple.space/wordle-data/wordle.json";
  const DEFAULT_REFRESH_MINUTES = 5;
  const COLS = 5;
  const MAX_ROWS = 6;
  const VALID_STATES = new Set(["correct", "present", "absent"]);

  let els = null;
  let results = [];
  let refreshTimer = null;
  let lastLoadedAt = 0;
  let loadState = "loading";
  let selectedPuzzle = null;
  let loading = false;

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function todayString() {
    const d = new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function isValidDateString(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parts = value.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.getFullYear() === parts[0] &&
      d.getMonth() === parts[1] - 1 &&
      d.getDate() === parts[2];
  }

  function dateFromPuzzle(puzzle) {
    const epoch = Date.UTC(2021, 5, 20);
    return new Date(epoch + (puzzle - 1) * 86400000).toISOString().slice(0, 10);
  }

  function scoreLabel(score) {
    return score === null ? "X/6" : score + "/6";
  }

  function sortResults(list) {
    return list.slice().sort(function (a, b) {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.puzzle - a.puzzle;
    });
  }

  function normalizeResult(item) {
    if (!item || typeof item !== "object") return null;

    const puzzle = Number(item.puzzle);
    if (!Number.isInteger(puzzle) || puzzle <= 0) return null;

    if (!Array.isArray(item.grid) || !item.grid.length || item.grid.length > MAX_ROWS) {
      return null;
    }

    const grid = [];
    for (let i = 0; i < item.grid.length; i++) {
      const row = item.grid[i];
      if (!Array.isArray(row) || row.length !== COLS) return null;
      const cells = row.map(function (state) {
        return VALID_STATES.has(state) ? state : null;
      });
      if (cells.some(function (state) { return !state; })) return null;
      grid.push(cells);
    }

    const score = item.score === null || item.score === "X" ? null : Number(item.score);
    if (score !== null && (!Number.isInteger(score) || score < 1 || score > 6)) return null;
    if (score !== null && grid.length !== score) return null;
    if (score === null && grid.length !== MAX_ROWS) return null;

    const date = isValidDateString(item.date) ? item.date : dateFromPuzzle(puzzle);
    return {
      puzzle: puzzle,
      date: date,
      score: score,
      hardMode: Boolean(item.hardMode),
      grid: grid
    };
  }

  function sanitizeResults(list) {
    if (!Array.isArray(list)) return [];
    const map = new Map();
    list.forEach(function (item) {
      const result = normalizeResult(item);
      if (result) map.set(result.puzzle, result);
    });
    return sortResults(Array.from(map.values()));
  }

  function puzzleFromDate(date) {
    const parts = String(date || "").split("-").map(Number);
    if (parts.length !== 3 || parts.some(function (n) { return !Number.isFinite(n); })) return 0;
    const t = Date.UTC(parts[0], parts[1] - 1, parts[2]);
    return Math.round((t - Date.UTC(2021, 5, 20)) / 86400000) + 1;
  }

  function buildMaps(list, lostDays) {
    const byPuzzle = new Map();
    list.forEach(function (item) { byPuzzle.set(item.puzzle, item); });
    const lost = new Set((lostDays || []).filter(isValidDateString));
    let latest = 0;
    byPuzzle.forEach(function (_v, k) { if (k > latest) latest = k; });
    lost.forEach(function (d) {
      const p = puzzleFromDate(d);
      if (p > latest) latest = p;
    });
    return { byPuzzle: byPuzzle, lost: lost, latest: latest };
  }

  function dayOf(puzzle, maps) {
    const rec = maps.byPuzzle.get(puzzle) || null;
    const date = (rec && rec.date) || dateFromPuzzle(puzzle);
    if (rec && rec.score !== null) return { puzzle: puzzle, date: date, result: rec, lost: false };
    if (maps.lost.has(date)) return { puzzle: puzzle, date: date, result: null, lost: true };
    return { puzzle: puzzle, date: date, result: rec, lost: false };
  }

  function calcStreak(list, lostDays) {
    const maps = buildMaps(list, lostDays);
    if (!maps.latest) return 0;
    let streak = 0;
    for (let p = maps.latest; p > 0; p--) {
      const day = dayOf(p, maps);
      if (day.lost) { streak += 1; continue; }
      if (day.result && day.result.score !== null) { streak += 1; continue; }
      break;
    }
    return streak;
  }

  function getConfig() {
    const raw = (typeof window !== "undefined" && window.SITE_CONFIG && window.SITE_CONFIG.wordle) || {};
    const minutes = Number(raw.refreshMinutes);
    const days = Number(raw.historyDays);
    return {
      dataUrl: typeof raw.dataUrl === "string" && raw.dataUrl ? raw.dataUrl : DEFAULT_DATA_URL,
      refreshMinutes: Number.isFinite(minutes) && minutes >= 1 ? minutes : DEFAULT_REFRESH_MINUTES,
      lostDays: Array.isArray(raw.lostDays) ? raw.lostDays : [],
      historyDays: Number.isFinite(days) && days >= 5 ? Math.floor(days) : 14
    };
  }

  function buildDataUrl(dataUrl) {
    const separator = dataUrl.indexOf("?") === -1 ? "?" : "&";
    return dataUrl + separator + "t=" + Date.now();
  }

  function renderGrid(result) {
    els.grid.replaceChildren();
    result.grid.forEach(function (row) {
      row.forEach(function (state) {
        const cell = document.createElement("span");
        cell.className = "wordle-tile wordle-tile--" + state;
        cell.setAttribute("aria-hidden", "true");
        els.grid.appendChild(cell);
      });
    });

    const rowDescription = result.grid.map(function (row) {
      return row.map(function (state) {
        if (state === "correct") return I18N.t("wordle.green");
        if (state === "present") return I18N.t("wordle.yellow");
        return I18N.t("wordle.gray");
      }).join("");
    }).join("；");

    els.grid.setAttribute(
      "aria-label",
      I18N.t("wordle.puzzle", { n: result.puzzle.toLocaleString() }) + "，" +
        scoreLabel(result.score) + "，" + rowDescription
    );
  }

  function renderEmpty(message, isError) {
    els.empty.hidden = false;
    els.empty.textContent = message;
    els.empty.classList.toggle("is-error", Boolean(isError));
    els.body.hidden = true;
    els.puzzle.textContent = "";
    els.meta.textContent = "";
    els.score.textContent = "--";
    els.streak.textContent = "";
    els.streak.hidden = true;
    els.grid.replaceChildren();
  }

  function renderHistory(cfg, maps, current) {
    if (!els.history) return;
    els.history.replaceChildren();
    if (!maps.latest) return;

    const width = cfg.historyDays || 14;
    const first = Math.max(1, maps.latest - width + 1);

    for (let p = first; p <= maps.latest; p++) {
      const day = dayOf(p, maps);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wordle-day";
      btn.dataset.puzzle = String(p);

      let label;
      if (day.lost) {
        label = "?/6";
        btn.classList.add("is-lost");
      } else if (day.result && day.result.score !== null) {
        label = scoreLabel(day.result.score);
        if (day.result.score === null) btn.classList.add("is-failed");
      } else if (day.result && day.result.score === null) {
        label = "X/6";
        btn.classList.add("is-failed");
      } else {
        label = "—";
        btn.classList.add("is-empty");
      }
      if (p === current) btn.classList.add("is-selected");

      const date = document.createElement("span");
      date.className = "wordle-day-date";
      date.textContent = day.date.slice(5).replace("-", "/");

      const score = document.createElement("span");
      score.className = "wordle-day-score";
      score.textContent = label;

      btn.appendChild(date);
      btn.appendChild(score);
      btn.setAttribute("aria-label", day.date + " " + label);
      els.history.appendChild(btn);
    }

    els.history.scrollLeft = els.history.scrollWidth;
  }

  function render() {
    if (!els) return;

    const cfg = getConfig();
    const maps = buildMaps(results, cfg.lostDays);

    if (!maps.latest) {
      if (loadState === "error") {
        renderEmpty(I18N.t("wordle.error"), true);
      } else if (loadState === "loading") {
        renderEmpty(I18N.t("wordle.loading"), false);
      } else {
        renderEmpty(I18N.t("wordle.empty"), false);
      }
      return;
    }

    let puzzle = selectedPuzzle;
    if (!puzzle || puzzle < 1 || puzzle > maps.latest) puzzle = maps.latest;
    const day = dayOf(puzzle, maps);

    els.empty.hidden = true;
    els.empty.classList.remove("is-error");
    els.body.hidden = false;
    els.puzzle.textContent = "#" + puzzle.toLocaleString("en-US");

    const isToday = day.date === todayString();
    const dateText = day.date + (isToday ? " · " + I18N.t("wordle.today") : "");

    if (day.lost) {
      els.meta.textContent = [dateText, I18N.t("wordle.lost")].join(" · ");
      els.score.textContent = "?/6";
      els.score.classList.remove("is-failed");
      els.grid.replaceChildren();
      els.grid.setAttribute("aria-label", I18N.t("wordle.lost"));
    } else if (!day.result) {
      els.meta.textContent = [dateText, I18N.t("wordle.noRecord")].join(" · ");
      els.score.textContent = "--";
      els.score.classList.remove("is-failed");
      els.grid.replaceChildren();
      els.grid.setAttribute("aria-label", I18N.t("wordle.noRecord"));
    } else {
      const result = day.result;
      const meta = [dateText, scoreLabel(result.score)];
      if (result.hardMode) meta.push(I18N.t("wordle.hard"));
      els.meta.textContent = meta.join(" · ");
      els.score.textContent = scoreLabel(result.score);
      els.score.classList.toggle("is-failed", result.score === null);
      renderGrid(result);
    }

    const streak = calcStreak(results, cfg.lostDays);
    const showStreak = streak >= 2;
    els.streak.hidden = !showStreak;
    els.streak.textContent = showStreak ? I18N.t("wordle.streak", { n: streak }) : "";

    renderHistory(cfg, maps, puzzle);
  }

  async function loadResults() {
    if (loading) return;
    loading = true;
    if (!results.length) {
      loadState = "loading";
      render();
    }

    try {
      const response = await fetch(buildDataUrl(getConfig().dataUrl), {
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("HTTP " + response.status);

      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : data && Array.isArray(data.results)
          ? data.results
          : data && data.puzzle
            ? [data]
            : [];

      results = sanitizeResults(list);
      loadState = "ready";
      lastLoadedAt = Date.now();
      render();
    } catch (error) {
      if (!results.length) {
        loadState = "error";
        render();
      }
      console.warn("[Wordle] 成绩加载失败：", error);
    } finally {
      loading = false;
    }
  }

  function scheduleRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    const minutes = getConfig().refreshMinutes;
    refreshTimer = setInterval(function () {
      if (document.visibilityState === "visible") loadResults();
    }, minutes * 60000);
  }

  function handleVisibilityChange() {
    if (document.visibilityState !== "visible") return;
    const interval = getConfig().refreshMinutes * 60000;
    if (Date.now() - lastLoadedAt >= interval) loadResults();
  }

  function init() {
    const panel = document.getElementById("wordle-panel");
    if (!panel) return;

    els = {
      panel: panel,
      puzzle: document.getElementById("wordle-puzzle"),
      meta: document.getElementById("wordle-meta"),
      body: document.getElementById("wordle-body"),
      empty: document.getElementById("wordle-empty"),
      grid: document.getElementById("wordle-grid"),
      score: document.getElementById("wordle-score"),
      streak: document.getElementById("wordle-streak"),
      history: document.getElementById("wordle-history")
    };

    if (els.history) {
      els.history.addEventListener("click", function (e) {
        const btn = e.target.closest(".wordle-day");
        if (!btn || !btn.dataset.puzzle) return;
        selectedPuzzle = Number(btn.dataset.puzzle);
        render();
      });
    }

    panel.setAttribute("aria-busy", "true");
    loadResults().finally(function () {
      panel.setAttribute("aria-busy", "false");
    });
    scheduleRefresh();
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      normalizeResult: normalizeResult,
      sanitizeResults: sanitizeResults,
      calcStreak: calcStreak,
      dateFromPuzzle: dateFromPuzzle
    };
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }
})();
