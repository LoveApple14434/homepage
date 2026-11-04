/* =========================================================
 * 站点配置 —— 修改这里的配置即可更新整个首页内容
 * 无需改动 index.html / main.js
 *
 * 文案字段支持三语：{ zh: "…", en: "…", ja: "…" }
 * 渲染层用 I18N.tv(值) 取值；纯字符串原样返回。
 * ========================================================= */

window.SITE_CONFIG = {

  /* ---------- 基本信息 ---------- */
  name: { zh: "水煮鱼", en: "Boiled Fish", ja: "水煮魚" },
  nickname: "LoveApple14434",
  avatar: "https://loveapple.space/blog/img/machinist.jpg",

  /* 打字机轮播的标语 */
  taglines: [
    "LoveApple14434",
    { zh: "一条爱苹果的水煮鱼", en: "An apple-loving boiled fish", ja: "林檎好きの水煮魚" },
  ],

  /* ---------- 关键词词云 ---------- */
  keywords: [
    { zh: "射频电路", en: "RF Circuits", ja: "RF回路" },
    { zh: "南京大学", en: "Nanjing University", ja: "南京大学" },
    { zh: "业余无线电", en: "Amateur Radio", ja: "アマチュア無線" },
    { zh: "笔记本维修", en: "Laptop Repair", ja: "ノートPC修理" },
    { zh: "软路由", en: "Router Hacking", ja: "ソフトルーター" },
    "NAS",
    { zh: "博客", en: "Blog", ja: "ブログ" },
    { zh: "IT侠", en: "ITxia Volunteer", ja: "IT侠ボランティア" },
    "GitHub",
    { zh: "羽毛球", en: "Badminton", ja: "バドミントン" },
    { zh: "笔记本评测", en: "Laptop Reviews", ja: "ノートPCレビュー" },
    "League of Legends",
    { zh: "QQ飞车手游-车神1000分", en: "QQ Speed - 1000 pts", ja: "QQ飛車-車神1000点" },
    { zh: "日本語学习中", en: "Learning Japanese", ja: "日本語勉強中" },
    { zh: "扫雷爱好者", en: "Minesweeper Fan", ja: "マインスイーパ好き" },
    { zh: "嵌入式DIY爱好者", en: "Embedded DIY", ja: "組み込みDIY" },
    { zh: "雀魂麻将-雀杰", en: "Mahjong Soul - Expert", ja: "雀魂-雀傑" }
  ],

  /* ---------- 搜索 ---------- */
  search: {
    type: "localsearch",
    api: "https://loveapple.space/blog/search.json",
    base: "https://loveapple.space",
  },

  /* ---------- Wordle ---------- */
  wordle: {
    dataUrl: "https://loveapple.space/wordle-data/wordle.json",
    refreshMinutes: 5,
  },

  /* ---------- 社交链接 ---------- */
  socials: [
    { icon: "🎥", name: "Bilibili", url: "https://space.bilibili.com/190956075" },
    { icon: "🐙", name: "GitHub",   url: "https://github.com/loveapple14434" },
    { icon: "📧", name: { zh: "邮箱", en: "Email", ja: "メール" }, url: "mailto:harry.zy.su@qq.com" },
    { icon: "🌐", name: { zh: "博客", en: "Blog", ja: "ブログ" }, url: "https://loveapple.space/blog" },
  ],

  /* ---------- 站点图标 ---------- */
  favicons: {
    "loveapple.space": "https://loveapple.space/blog/img/machinist.jpg",
  },

  /* ---------- GitHub 贡献图 ---------- */
  github: {
    username: "loveapple14434",
    api: "https://github-contributions-api.jogruber.de/v4/",
  },

  /* ---------- RSS / Atom 订阅 ---------- */
  feeds: {
    title: { zh: "订阅更新", en: "Feeds", ja: "購読" },
    description: {
      zh: "欢迎通过 RSS / Atom 订阅博客，第一时间获取最新文章。",
      en: "Subscribe via RSS / Atom to get new posts as soon as they are published.",
      ja: "RSS / Atom で購読すると、新しい記事をすぐ受け取れます。",
    },
    tip: {
      zh: "把以下链接添加到任意 RSS 阅读器即可订阅。",
      en: "Add either link to any RSS reader to subscribe.",
      ja: "以下のリンクを任意の RSS リーダーに追加してください。",
    },
    items: [
      { icon: "📡", name: { zh: "RSS 订阅", en: "RSS", ja: "RSS" }, note: "rss.xml", url: "https://loveapple.space/blog/rss.xml" },
      { icon: "🛰️", name: { zh: "Atom 订阅", en: "Atom", ja: "Atom" }, note: "atom.xml", url: "https://loveapple.space/blog/atom.xml" },
    ],
  },

  /* ---------- 北洋园PT站个性条 ---------- */
  pt: {
    title: { zh: "🏴‍☠️ 北洋园PT站", en: "🏴‍☠️ Beiyangyuan PT", ja: "🏴‍☠️ 北洋園PT" },
    alt: { zh: "北洋园PT站", en: "Beiyangyuan PT", ja: "北洋園PT" },
    image: "https://tjupt.org/mybar.php?userid=140396.png",
    url: "https://tjupt.org/promotionlink.php?key=782d75eb353f43f7bb27fcc9677ecf11",
  },

  /* ---------- 友情链接（P3 独立页） ---------- */
  friends: [
    {
      class_name: { zh: "友達", en: "Friends", ja: "友達" },
      class_desc: {
        zh: "已启用随机顺序功能，排名不分先后~",
        en: "Random order enabled, no particular ranking~",
        ja: "ランダム順で表示中、順位に意味はありません~",
      },
      links: [
        { name: "AritxOnly",            link: "https://www.aritxonly.top/",   avatar: "https://www.aritxonly.top/res/bio.png" },
        { name: "YDJSIR",               link: "https://www.ydjsir.com.cn/",   avatar: "https://oss.ydjsir.com.cn/Avatar-r.png" },
        { name: "翠翠idealclover",       link: "https://idealclover.top/",     avatar: "https://cdn.idealclover.cn/Projects/homepage/icon.png" },
        { name: "little_sun",           link: "https://www.zcysky.com/",      avatar: "https://www.zcysky.com/images/avatar.png" },
        { name: "wyaaaattwho",          link: "https://www.wyaaaattwho.xyz",  avatar: "https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2Fbcc83a06-70e2-4332-93f9-b89147e2a6bd%2F8c491ea8-1469-4082-83e9-10dce4136cff%2F_.jpeg?table=collection&id=e49a506f-d4f7-4765-922b-75581ed41eff&t=e49a506f-d4f7-4765-922b-75581ed41eff&width=800&cache=v2" },
        { name: "tukwhy",               link: "https://tukwhy.top",           avatar: "https://tukwhy.top/medias/avatar.jpg" },
        { name: "茶栗栗屋",              link: "https://chariri.moe/",         avatar: "https://loveapple.space/blog/link/chariri.jpg" },
        { name: "LadderOperator",       link: "https://ladderoperator.top/",  avatar: "https://ladderoperator.top/img/avatar.jpg" },
        { name: "锦木祁杰",              link: "https://qijieya.cn",           avatar: "https://imgoss.qijieya.cn/file/hutao.png" },
        { name: "rivercloud",           link: "https://riverclouds.net/",     avatar: "https://s3.bmp.ovh/imgs/2024/02/10/02bd6754328be00d.jpg" },
        { name: "Kzzzza",               link: "https://kzzzza.github.io/",    avatar: "https://kzzzza.github.io/img/tx.jpg" },
        { name: "SoCoco",               link: "https://sococo.cn",            avatar: "https://cdn.jsdelivr.net/gh/SONGYU318/blog_img/images/Avatar.jpg" },
        { name: "Haruka",               link: "https://haruka-hua.github.io/", avatar: "https://haruka-hua.github.io/images/avatar.jpg" },
        { name: "孤筝の温暖小家",        link: "https://guzhengsvt.cn/",       avatar: "https://guzhengsvt.cn/avatar/avatar.webp" },
        { name: "土豆的记事簿",          link: "https://20080618.xyz/",        avatar: "https://20080618.xyz/assets/uploads/a0fe7f5d-a4e6-4176-8cd3-97a2a808899c.webp" },
      ],
    },
  ],

  /* ---------- 业余无线电（P6 独立页） ---------- */
  radio: {
    callsign: "BA4UHI",
    license: { zh: "B 类操作证书", en: "Class B License", ja: "B 類免許" },
    qth: { zh: "南京大学仙林校区", en: "NJU Xianlin Campus", ja: "南京大学仙林キャンパス" },
    qthDetail: { zh: "中国 · 南京市栖霞区", en: "Qixia, Nanjing, China", ja: "中国・南京市栖霞区" },
    grid: "OM92lc",
    cq: "24",
    itu: "44",
    antenna: { zh: "原装天线", en: "Stock antenna", ja: "付属アンテナ" },
    power: "1W / 5W",
    rigs: [
      { zh: "宝锋 UV-5R", en: "Baofeng UV-5R", ja: "宝鋒 UV-5R" },
      { zh: "泉盛 UV-K6", en: "Quansheng UV-K6", ja: "泉盛 UV-K6" },
    ],
    links: [
      { icon: "📒", label: { zh: "QSL 记录", en: "QSL Log", ja: "QSL ログ" }, url: "https://loveapple.space/blog/QSL-LOG/" },
      { icon: "✉️", label: { zh: "申请 QSL", en: "Request QSL", ja: "QSL 依頼" }, url: "https://table.nju.edu.cn/dtable/forms/custom/BA4UHI-QSL/" },
      { icon: "🌐", label: "QRZ", url: "https://www.qrz.com/db/BA4UHI" },
    ],
  },

  groups: [
    {
      title: { zh: "记录 & 纪录", en: "Records", ja: "記録" },
      links: [
        { icon: "🔗", name: { zh: "友情链接", en: "Friend Links", ja: "相互リンク" }, url: "https://loveapple.space/blog/link/" },
        { icon: "📻", name: { zh: "业余无线电·QSL", en: "Radio · QSL", ja: "無線 · QSL" }, url: "https://loveapple.space/blog/QSL-LOG/" },
        { icon: "💣", name: { zh: "个人扫雷纪录", en: "Minesweeper Records", ja: "マインスイーパ記録" }, url: "https://loveapple.space/blog/mine-sweeper/" },
        { icon: "⚡", name: "Human Benchmark", url: "https://humanbenchmark.com/users/5f5d9aeb41faff0001a03c5d"},
        { icon: "🀄", name: { zh: "雀魂麻将-牌谱屋", en: "Mahjong Soul Stats", ja: "雀魂 戦績" }, url: "https://amae-koromo.sapk.ch/player/24197592"},
        { icon: "🪐", name: { zh: "萌国度·异次元之旅", en: "Moe · Another World", ja: "萌え · 異次元の旅" }, url: "https://travel.moe/go"},
      ],
    },
    {
      title: { zh: "分类查看博客", en: "Browse Blog by Category", ja: "カテゴリでブログを見る" },
      links: [
        { icon: "🧑‍💻", name: { zh: "寄术", en: "Tech", ja: "技術" }, url: "https://loveapple.space/blog/categories/%E5%AF%84%E6%9C%AF/" },
        { icon: "🧳", name: { zh: "牲活", en: "Life", ja: "生活" }, url: "https://loveapple.space/blog/categories/%E7%89%B2%E6%B4%BB/" },
        { icon: "🧐", name: { zh: "鱼论", en: "Rants", ja: "雑記" }, url: "https://loveapple.space/blog/categories/%E9%B1%BC%E8%AE%BA/" },
      ],
    },
    {
      title: { zh: "一些娱乐项目~", en: "For Fun", ja: "お楽しみ" },
      links: [
        { icon: "🥇", name: { zh: "火影忍者手游竞猜平台", en: "Naruto Quiz", ja: "NARUTO 予想" }, url: "https://loveapple.space/naruto" },
        { icon: "🌸", name: { zh: "五十音练习", en: "Kana Practice", ja: "五十音練習" }, url: "https://loveapple.space/kana" },
        { icon: "🖼️", name: { zh: "随机图片 API", en: "Random Image API", ja: "ランダム画像 API" }, url: "https://loveapple.space/img-api" },
      ],
    },
  ],
};

/* ---------- 版权信息 ---------- */
window.COPYRIGHT_TEXT = "© " + new Date().getFullYear() + " LoveApple14434 · Made with DSv4-flash";
