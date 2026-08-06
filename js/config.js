/* =========================================================
 * 站点配置 —— 修改这里的配置即可更新整个首页内容
 * 无需改动 index.html / main.js
 * ========================================================= */

window.SITE_CONFIG = {

  /* ---------- 基本信息 ---------- */
  name: "水煮鱼",                          // 显示名称
  nickname: "LoveApple14434",              // 昵称 / 网名（显示在简介里）
  avatar: "https://loveapple.space/blog/img/machinist.jpg", // 头像图片地址

  /* 打字机轮播的标语（会依次循环打字显示） */
  taglines: [
    "LoveApple14434",
    "一条爱苹果的水煮鱼",
  ],

  /* ---------- 关键词词云（替代简介段落） ----------
   * 每次刷新会随机分配字号大小，形成自然词云效果
   * ------------------------------------------------ */
  keywords: [
    "射频电路", "南京大学", "业余无线电", "笔记本维修", "软路由", "NAS", "博客",
    "IT侠", "GitHub", "羽毛球", "笔记本评测", "LOL", "QQ飞车手游", "日本語学习中"
  ],

  /* ---------- 搜索 ---------- */
  /* LocalSearch：搜索博客文章，数据源为 Hexo 的 search.json（仅限该地址） */
  search: {
    type: "localsearch",                            // 固定为 localsearch
    api: "https://loveapple.space/blog/search.json", // 数据源地址
    base: "https://loveapple.space",                // 文章完整链接 = base + 文章 url
  },

  /* ---------- 社交链接 ---------- */
  socials: [
    { icon: "🎥", name: "Bilibili", url: "https://space.bilibili.com/190956075" },
    { icon: "🐙", name: "GitHub",   url: "https://github.com/loveapple14434" },
    { icon: "📧", name: "邮箱",      url: "mailto:harry.zy.su@qq.com" },
    { icon: "🌐", name: "博客",      url: "https://loveapple.space/blog" },
  ],

  /* ---------- 站点图标（favicon） ----------
   * 快捷链接卡片默认显示网站 favicon（Google 服务）；
   * 可在此为特定域名指定固定图标，找不到时回退到站点 /favicon.ico。
   * ------------------------------------------------ */
  favicons: {
    "loveapple.space": "https://loveapple.space/blog/img/machinist.jpg",
  },

  /* ---------- GitHub 贡献图 ----------
   * 在首页展示 GitHub 贡献热力图；
   * 颜色随明暗主题自适应（见 style.css 中 --gh-level0~4 变量），
   * api 为返回 JSON 的贡献数据接口（需支持 CORS）。
   * ------------------------------------------------ */
  github: {
    username: "loveapple14434",
    api: "https://github-contributions-api.jogruber.de/v4/",
  },

  /* ---------- 快捷链接分组 ----------
   * icon 可以是 emoji 或任意文本；
   * 想要新增/修改链接，直接在此数组里增删即可。
   * ------------------------------------------------ */
  groups: [
    {
        title: "分类查看博客",
        links: [
            {icon: "🧑‍💻", name: "寄术", url: "https://loveapple.space/blog/categories/%E5%AF%84%E6%9C%AF/"},
            {icon: "🧳", name: "牲活", url: "https://loveapple.space/blog/categories/%E7%89%B2%E6%B4%BB/"},
            {icon: "🧐", name: "鱼论", url: "https://loveapple.space/blog/categories/%E9%B1%BC%E8%AE%BA/"}
        ]
    },
    {
      title: "一些娱乐项目~",
      links: [
        { icon: "🥇", name: "火影忍者手游竞猜平台",   url: "https://loveapple.space/naruto" },
        { icon: "🌸", name: "五十音练习",   url: "https://loveapple.space/kana" },
        { icon: "🖼️", name: "随机图片 API",   url: "https://loveapple.space/img-api" },
      ],
    },
    {
      title: "记录 & 纪录",
      links: [
        { icon: "📻", name: "业余无线电·QSL", url: "https://loveapple.space/blog/QSL-LOG/" },
        { icon: "💣", name: "个人扫雷纪录",      url: "https://loveapple.space/blog/mine-sweeper/" },
        { icon: "🛜", name: "链接",  url: "https://loveapple.space/blog/link/" },
      ],
    },
  ],
};

/* ---------- 版权信息 ---------- */
window.COPYRIGHT_TEXT = "© " + new Date().getFullYear() + " LoveApple14434 · Made with DSv4-flash";
