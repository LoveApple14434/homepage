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

  function calcStreak(list) {
    if (!list.length) return 0;
    const latest = list[0];
    if (!latest || latest.score === null) return 0;

    const map = new Map(list.map(function (item) {
      return [item.puzzle, item];
    }));
    let streak = 0;
    let puzzle = latest.puzzle;
    while (map.has(puzzle)) {
      const item = map.get(puzzle);
      if (item.score === null) break;
      streak += 1;
      puzzle -= 1;
    }
    return streak;
  }

  function getConfig() {
    const raw = (typeof window !== "undefined" && window.SITE_CONFIG && window.SITE_CONFIG.wordle) || {};
    const minutes = Number(raw.refreshMinutes);
    return {
      dataUrl: typeof raw.dataUrl === "string" && raw.dataUrl ? raw.dataUrl : DEFAULT_DATA_URL,
      refreshMinutes: Number.isFinite(minutes) && minutes >= 1 ? minutes : DEFAULT_REFRESH_MINUTES
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
        if (state === "correct") return "绿";
        if (state === "present") return "黄";
        return "灰";
      }).join("");
    }).join("；");

    els.grid.setAttribute(
      "aria-label",
      "Wordle 第 " + result.puzzle.toLocaleString("en-US") + " 期，" +
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

  function render() {
    if (!els) return;

    const latest = results[0];
    if (!latest) {
      if (loadState === "error") {
        renderEmpty("成绩加载失败，请稍后刷新。", true);
      } else if (loadState === "loading") {
        renderEmpty("正在加载成绩…", false);
      } else {
        renderEmpty("还没有同步成绩。", false);
      }
      return;
    }

    const isToday = latest.date === todayString();
    const dateText = latest.date + (isToday ? " · 今日" : "");
    const meta = [dateText, scoreLabel(latest.score)];
    if (latest.hardMode) meta.push("困难模式");

    els.empty.hidden = true;
    els.empty.classList.remove("is-error");
    els.body.hidden = false;
    els.puzzle.textContent = "#" + latest.puzzle.toLocaleString("en-US");
    els.meta.textContent = meta.join(" · ");
    els.score.textContent = scoreLabel(latest.score);
    els.score.classList.toggle("is-failed", latest.score === null);

    const streak = calcStreak(results);
    const showStreak = latest.score !== null && streak >= 2;
    els.streak.hidden = !showStreak;
    els.streak.textContent = showStreak ? "连续 " + streak + " 天" : "";

    renderGrid(latest);
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
      streak: document.getElementById("wordle-streak")
    };

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
