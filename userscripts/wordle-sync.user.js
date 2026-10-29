// ==UserScript==
// @name         Wordle 成绩同步到 LoveApple 首页
// @namespace    https://loveapple.space/
// @version      1.0.0
// @description  在 NYT Wordle 点击 Share 时，自动把本局成绩同步到 loveapple.space 首页
// @author       LoveApple14434
// @match        https://www.nytimes.com/games/wordle/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      loveapple.space
// @noframes
// ==/UserScript==

(function () {
  "use strict";

  const PUBLIC_URL = "https://loveapple.space/wordle-data/wordle.json";
  const WRITE_URL = "https://loveapple.space/wordle-api/wordle.json";
  const SYNC_USER = "wordle";
  const COLS = 5;
  const MAX_ROWS = 6;
  const VALID_STATES = new Set(["correct", "present", "absent"]);
  const SHARE_RE = /^Wordle\s+[\d,]+\s+(?:X|\d)\/6\*?/m;

  let badge = null;
  let badgeTimer = null;
  let lastAttemptHash = "";
  let lastAttemptAt = 0;

  function pageWindow() {
    return typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function dateFromPuzzle(puzzle) {
    const epoch = Date.UTC(2021, 5, 20);
    return new Date(epoch + (puzzle - 1) * 86400000).toISOString().slice(0, 10);
  }

  function isValidDateString(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parts = value.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.getFullYear() === parts[0] &&
      d.getMonth() === parts[1] - 1 &&
      d.getDate() === parts[2];
  }

  function scoreLabel(score) {
    return score === null ? "X/6" : score + "/6";
  }

  function parseShareText(raw) {
    const lines = String(raw || "")
      .replace(/\r/g, "")
      .split("\n")
      .map(function (line) { return line.trim(); })
      .filter(Boolean);

    if (!lines.length) return null;

    const header = lines[0].match(/^Wordle\s+([\d,]+)\s+(X|\d)\/6(\*?)$/i);
    if (!header) return null;

    const puzzle = Number(header[1].replace(/,/g, ""));
    if (!Number.isInteger(puzzle) || puzzle <= 0) return null;

    const score = header[2].toUpperCase() === "X" ? null : Number(header[2]);
    if (score !== null && (score < 1 || score > 6)) return null;

    const grid = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = Array.from(lines[i]);
      if (cells.length !== COLS) return null;

      const row = [];
      for (let j = 0; j < cells.length; j++) {
        const ch = cells[j];
        if (ch === "🟩") row.push("correct");
        else if (ch === "🟨") row.push("present");
        else if (ch === "⬛" || ch === "⬜") row.push("absent");
        else return null;
      }
      grid.push(row);
    }

    if (grid.length < 1 || grid.length > MAX_ROWS) return null;
    if (score === null && grid.length !== MAX_ROWS) return null;
    if (score !== null && grid.length !== score) return null;

    return {
      puzzle: puzzle,
      date: dateFromPuzzle(puzzle),
      score: score,
      hardMode: Boolean(header[3]),
      grid: grid
    };
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

    return {
      puzzle: puzzle,
      date: isValidDateString(item.date) ? item.date : dateFromPuzzle(puzzle),
      score: score,
      hardMode: Boolean(item.hardMode),
      grid: grid
    };
  }

  function sortResults(list) {
    return list.slice().sort(function (a, b) {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.puzzle - a.puzzle;
    });
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

  function fingerprint(result) {
    return [
      result.puzzle,
      result.score === null ? "X" : result.score,
      result.hardMode ? "1" : "0",
      result.grid.map(function (row) { return row.join(""); }).join("|")
    ].join(":");
  }

  function getPassword(forcePrompt) {
    let password = GM_getValue("wordlePassword", "");
    if (password && !forcePrompt) return password;

    const w = pageWindow();
    password = w.prompt(
      "首次同步需要输入 Wordle 同步密码。\n密码只保存在 Tampermonkey 存储中。",
      ""
    );
    if (!password) return "";
    GM_setValue("wordlePassword", password);
    return password;
  }

  function basicAuth(user, password) {
    const bytes = new TextEncoder().encode(user + ":" + password);
    let binary = "";
    bytes.forEach(function (byte) {
      binary += String.fromCharCode(byte);
    });
    return "Basic " + btoa(binary);
  }

  function gmRequest(options) {
    return new Promise(function (resolve, reject) {
      GM_xmlhttpRequest(Object.assign({ timeout: 20000 }, options, {
        onload: resolve,
        onerror: function () { reject(new Error("网络请求失败")); },
        ontimeout: function () { reject(new Error("网络请求超时")); },
        onabort: function () { reject(new Error("网络请求已取消")); }
      }));
    });
  }

  async function loadExisting(password) {
    const response = await gmRequest({
      method: "GET",
      url: PUBLIC_URL + "?t=" + Date.now(),
      headers: {
        "Accept": "application/json",
        "Authorization": basicAuth(SYNC_USER, password)
      }
    });

    if (response.status === 404) return [];
    if (response.status < 200 || response.status >= 300) {
      throw new Error("读取远端成绩失败（HTTP " + response.status + "）");
    }

    let data;
    try {
      data = JSON.parse(response.responseText || "{}");
    } catch (error) {
      throw new Error("远端成绩不是有效 JSON");
    }

    const list = Array.isArray(data)
      ? data
      : data && Array.isArray(data.results)
        ? data.results
        : data && data.puzzle
          ? [data]
          : [];

    return sanitizeResults(list);
  }

  async function putResults(results, password) {
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      results: sortResults(results)
    };

    const response = await gmRequest({
      method: "PUT",
      url: WRITE_URL,
      headers: {
        "Content-Type": "application/json",
        "Authorization": basicAuth(SYNC_USER, password)
      },
      data: JSON.stringify(payload, null, 2)
    });

    if (response.status === 401) throw new Error("同步密码错误");
    if (response.status === 403) throw new Error("服务器拒绝写入（403）");
    if (response.status < 200 || response.status >= 300) {
      throw new Error("写入远端成绩失败（HTTP " + response.status + "）");
    }
  }

  async function syncResult(result, password) {
    const existing = await loadExisting(password);
    const merged = existing.filter(function (item) {
      return item.puzzle !== result.puzzle;
    });
    merged.push(result);
    await putResults(merged, password);
  }

  function showStatus(message, isError, duration) {
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "wordle-sync-status";
      badge.style.cssText = [
        "position:fixed",
        "right:20px",
        "bottom:20px",
        "z-index:2147483647",
        "max-width:min(360px,calc(100vw - 40px))",
        "padding:10px 16px",
        "border-radius:12px",
        "background:#2a1c22",
        "color:#fff5f8",
        "font:13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        "box-shadow:0 8px 30px rgba(0,0,0,.28)",
        "opacity:0",
        "transform:translateY(8px)",
        "transition:opacity .2s ease,transform .2s ease",
        "pointer-events:none"
      ].join(";");
      (document.body || document.documentElement).appendChild(badge);
    }

    badge.textContent = message;
    badge.style.background = isError ? "#8b2942" : "#2a1c22";
    badge.style.opacity = "1";
    badge.style.transform = "translateY(0)";

    if (badgeTimer) clearTimeout(badgeTimer);
    if (duration !== 0) {
      badgeTimer = setTimeout(function () {
        badge.style.opacity = "0";
        badge.style.transform = "translateY(8px)";
      }, duration || 4000);
    }
  }

  async function handleShareText(text, force) {
    if (!SHARE_RE.test(String(text || ""))) return;

    GM_setValue("lastShareText", text);
    const result = parseShareText(text);
    if (!result) {
      showStatus("分享文本无法解析，未同步", true, 6000);
      return;
    }

    const hash = fingerprint(result);
    if (!force && hash === lastAttemptHash && Date.now() - lastAttemptAt < 30000) {
      return;
    }
    lastAttemptHash = hash;
    lastAttemptAt = Date.now();

    const password = getPassword(false);
    if (!password) {
      showStatus("未配置同步密码：点油猴菜单设置", true, 6000);
      return;
    }

    showStatus("正在同步 Wordle " + scoreLabel(result.score) + "…", false, 0);
    try {
      await syncResult(result, password);
      showStatus("Wordle " + scoreLabel(result.score) + " 已同步到主页", false, 3500);
    } catch (error) {
      console.error("[Wordle Sync]", error);
      showStatus(error && error.message ? error.message : "同步失败", true, 6000);
    }
  }

  function hookClipboard() {
    const w = pageWindow();
    if (!w || w.__wordleSyncHooked) return true;

    const nav = w.navigator;
    if (!nav || !nav.clipboard) return false;

    const clipboard = nav.clipboard;
    const original = clipboard.writeText;
    if (typeof original !== "function") return false;

    const patched = function () {
      const text = arguments[0];
      const result = original.apply(this, arguments);

      if (SHARE_RE.test(String(text || ""))) {
        if (result && typeof result.then === "function") {
          result.then(
            function () { handleShareText(text, false); },
            function () { handleShareText(text, false); }
          );
        } else {
          handleShareText(text, false);
        }
      }

      return result;
    };

    try {
      Object.defineProperty(clipboard, "writeText", {
        configurable: true,
        writable: true,
        value: patched
      });
    } catch (error) {
      try {
        clipboard.writeText = patched;
      } catch (error2) {
        return false;
      }
    }

    w.__wordleSyncHooked = true;
    return true;
  }

  let hookAttempts = 0;
  function installClipboardHook() {
    if (hookClipboard()) return;
    if (hookAttempts++ < 40) {
      setTimeout(installClipboardHook, 250);
    } else {
      console.warn("[Wordle Sync] 没有找到 navigator.clipboard，无法自动同步。");
    }
  }

  function initMenu() {
    GM_registerMenuCommand("设置 Wordle 同步密码", function () {
      const password = getPassword(true);
      if (password) showStatus("同步密码已保存", false, 2500);
    });

    GM_registerMenuCommand("重新同步上次分享文本", function () {
      const text = GM_getValue("lastShareText", "");
      if (!text) {
        showStatus("还没有捕获到 Wordle 分享文本", true, 3500);
        return;
      }
      handleShareText(text, true);
    });

    GM_registerMenuCommand("清除 Wordle 同步密码", function () {
      GM_setValue("wordlePassword", "");
      showStatus("同步密码已清除", false, 2500);
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      parseShareText: parseShareText,
      normalizeResult: normalizeResult,
      dateFromPuzzle: dateFromPuzzle
    };
  }

  if (typeof document !== "undefined") {
    installClipboardHook();
    initMenu();
  }
})();

