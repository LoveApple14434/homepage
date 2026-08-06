# 🌸 个人首页（Homepage）

一个简约、淡粉色（`#ffc0cb`）主题的个人首页，支持**个人简介**、**可配置跳转链接**、搜索、时钟、樱花动画与暗色模式。

## ✨ 功能

- 👤 个人简介：头像、姓名、打字机标语、自我介绍、社交链接
- 🔗 快捷链接：按分组展示，全部可在配置中增删改
- 🔍 搜索框：LocalSearch 站内搜索，数据源为 `https://loveapple.space/blog/search.json`
- 🕐 实时时钟 + 分时段问候语
- 🌸 樱花飘落动画（跟随粉色主题）
- 📊 GitHub 贡献图（明暗主题自适应）
- 🌙/☀️ 明暗主题切换（自动记住偏好）
- ⌨️ 按 `/` 快速聚焦搜索框

## 📁 目录结构

```
homepage/
├── index.html      # 页面结构
├── css/
│   └── style.css   # 淡粉色主题样式
├── js/
│   ├── config.js   # ★ 站点配置（改这里即可）
│   └── main.js     # 交互逻辑
└── README.md
```

## 🚀 使用

1. 直接用浏览器打开 `index.html` 即可（纯静态，无需构建）。
2. 编辑 `js/config.js` 修改：
   - 姓名 / 头像 / 简介 / 标语
   - 社交链接
   - 快捷链接分组（新增或删除链接）
   - 搜索数据源地址（`search.api` 与 `search.base`）
   - GitHub 贡献图（`github.username` 与 `github.api`）

## 🖼️ 效果预览

| 说明 | 效果 |
| ---- | ---- |
| 明色模式 | 白色卡片 + 淡粉渐变背景 |
| 暗色模式 | 深色卡片 + 粉调点缀 |
| 动画 | 樱花飘落、打字机、卡片入场 |

## 🔍 LocalSearch 说明

- 搜索内容来自博客的 `search.json`（Hexo `hexo-generator-search` 生成）。
- 结果匹配标题 / 正文 / 标签 / 分类，关键词高亮显示，`Enter` 打开第一条，`Esc` 关闭。
- 建议将首页与博客部署在同一域名下（如同源），避免跨域限制。

## 🧩 自定义主题色

主题色在 `css/style.css` 顶部的 `:root` 中定义，修改 `--primary` 等变量即可整体换色：

```css
--primary: #ffc0cb;      /* 主题淡粉色 */
--primary-dark: #e89cae; /* 强调色 */
--primary-deep: #d4788f; /* 深色文字/描边 */
```

## 📄 License

MIT License
