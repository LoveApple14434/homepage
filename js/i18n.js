/* =========================================================
 * i18next 初始化 · 语言检测 · 静态文案替换 · 切换按钮
 * 依赖：assets/vendor/i18next.min.js
 *       assets/vendor/i18next-browser-languagedetector.min.js
 *       js/i18n/{zh-CN,en,ja}.js
 * ========================================================= */
(function () {
  "use strict";

  const LANGS = ["zh-CN", "en", "ja"];
  const LABEL = { "zh-CN": "中", en: "EN", ja: "日" };
  const listeners = [];

  if (!window.i18next) {
    console.warn("[i18n] i18next 未加载，跳过初始化");
    return;
  }

  /* 记录当前所在页，刷新后由 paged.js 按 #pN 瞬时定位 */
  function saveCurrentPage() {
    const pager = document.getElementById("pager");
    if (!pager) return;
    const pages = pager.querySelectorAll(".page");
    if (!pages.length) return;
    const base = pager.getBoundingClientRect().top;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < pages.length; i++) {
      const d = Math.abs(pages[i].getBoundingClientRect().top - base);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    if (window.history && history.replaceState) {
      history.replaceState(null, "", "#p" + (best + 1));
    }
  }

  /* ---------- 静态文案：扫描 [data-i18n] / [data-i18n-attr] ---------- */
  function applyStatic(root) {
    root = root || document;

    root.querySelectorAll("[data-i18n]").forEach(function (el) {
      const v = i18next.t(el.getAttribute("data-i18n"));
      if (v) el.textContent = v;
    });

    /* data-i18n-attr="title:key,aria-label:key2" */
    root.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
        const kv = pair.split(":");
        if (kv.length !== 2) return;
        const v = i18next.t(kv[1].trim());
        if (v) el.setAttribute(kv[0].trim(), v);
      });
    });
  }

  /* ---------- 全局量：html lang / document.title / 按钮 ---------- */
  function applyGlobals() {
    document.documentElement.lang = i18next.language;
    document.title = i18next.t("common.siteTitle");

    const btn = document.getElementById("lang-toggle");
    if (btn) {
      btn.textContent = LABEL[i18next.language] || "中";
      btn.title = i18next.t("common.langToggle");
      btn.setAttribute("aria-label", i18next.t("common.langToggle"));
    }
  }

  function refresh() {
    applyStatic();
    applyGlobals();
    listeners.forEach(function (fn) {
      try {
        fn(i18next.language);
      } catch (e) {
        console.error("[i18n] onChange 回调出错", e);
      }
    });
  }

  /* ---------- 初始化 ---------- */
  const opts = {
    resources: window.__I18N__ || {},
    supportedLngs: LANGS,
    fallbackLng: "zh-CN",
    load: "currentOnly",
    interpolation: { escapeValue: false },
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      lookupQuerystring: "lang",
      lookupLocalStorage: "homepage.lang",
      caches: ["localStorage"]
    }
  };

  const detector = window.i18nextBrowserLanguageDetector;
  if (detector) i18next.use(detector);

  i18next.init(opts, function (err) {
    if (err) console.error("[i18n] init 失败", err);

    refresh();

    /* 语言按钮：循环 中 → EN → 日 */
    const btn = document.getElementById("lang-toggle");
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        const i = LANGS.indexOf(i18next.language);
        const next = LANGS[(i + 1) % LANGS.length];
        i18next.changeLanguage(next, function () {
          refresh();
          saveCurrentPage();
          /* 动态内容重渲染链路复杂，直接刷新页面保证一致 */
          location.reload();
        });
      });
    }

    document.dispatchEvent(new CustomEvent("i18n:ready", { detail: i18next.language }));
  });

  /* ---------- 对外 API ---------- */
  window.I18N = {
    t: function (key, options) {
      return i18next.t(key, options);
    },

    /* 内容数据就地三语：tv({ zh: "…", en: "…", ja: "…" }) */
    tv: function (obj) {
      if (obj == null) return "";
      if (typeof obj === "string") return obj;
      const l = i18next.language;
      return obj[l] || obj[i18next.resolvedLanguage] || obj.zh || obj["zh-CN"] || "";
    },

    setLang: function (lang) {
      i18next.changeLanguage(lang, refresh);
    },

    getLang: function () {
      return i18next.language;
    },

    applyStatic: applyStatic,
    refresh: refresh,

    onChange: function (fn) {
      listeners.push(fn);
    }
  };
})();
