# 🌸 个人主页（Homepage）

一个简约、淡粉色（`#ffc0cb`）主题的个人主页，使用原生 HTML / CSS / JavaScript 实现，**无需构建、无运行时依赖**。

当前版本采用 **6 页全屏分页布局**：滚动或方向键翻页，右侧圆点导航，移动端自动切换为底部圆点。

## ✨ 功能

- 🗂️ **全屏分页**：6 个页面纵向 scroll-snap，支持滚轮、方向键、`Home` / `End` 和圆点导航
- 👤 **个人简介（P1）**：头像、姓名、打字机标语、随机字号关键词词云、社交链接
- 🕐 **时钟与搜索（P2）**：实时时钟、日期、分时段问候语；LocalSearch 博客搜索
- 🟩 **Wordle 成绩（P2）**：展示最新成绩与连续天数；由油猴脚本在 Wordle 页面自动同步，访客只读
- 🎈 **友達（P3）**：友链头像随机漂浮，鼠标快速划过可驱散，悬停锁定；移动端支持陀螺仪视差
- 📊 **PT 与贡献（P4）**：北洋园 PT 个性横幅、GitHub 近一年贡献热力图
- 📡 **订阅（P5）**：RSS / Atom 订阅入口
- 🔗 **快捷链接（P6）**：按分组展示站点链接，支持 emoji / 图片 / 自动 favicon
- 🌙 **明暗主题**：自动记住偏好，GitHub 贡献图配色同步切换
- 🌸 **樱花动画**：Canvas 绘制的淡粉色花瓣飘落
- ♿ **减少动效**：尊重 `prefers-reduced-motion`，关闭漂浮、樱花与平滑滚动
- 📱 **响应式**：窄屏下调整分页内边距、贡献图尺寸和导航位置

## 📁 目录结构

```text
homepage/
├── index.html                  # 页面结构（6 个 .page）
├── index.md                    # 博客“关于我”页面源文件（不由首页加载）
├── css/
│   ├── style.css               # 主题变量、组件与动画
│   └── paged.css               # 全屏分页、固定页脚、圆点导航、P3 浮层
├── js/
│   ├── config.js               # ★ 站点配置（内容、链接、API）
│   ├── main.js                 # 主题、时钟、搜索、卡片、樱花等
│   ├── paged.js                # 分页导航、P3 布局/物理/陀螺仪
│   └── wordle.js               # Wordle 远程成绩读取与渲染
├── userscripts/
│   └── wordle-sync.user.js     # 油猴脚本：Wordle 分享文本 → VPS
├── .github/
│   └── workflows/
│       └── deploy.yml          # push 到 main 后 SSH 部署
├── LICENSE                     # MIT License
└── README.md
```

脚本加载顺序固定为：`config.js` → `main.js` → `paged.js` → `wordle.js`。

## 🚀 本地预览

由于搜索和 GitHub 贡献图通过 `fetch` 请求跨域接口，建议使用本地 HTTP 服务，而不是直接双击 `index.html`：

```bash
python -m http.server 8000
```

然后访问 <http://localhost:8000>。

## ⚙️ 配置

绝大多数内容都在 [`js/config.js`](js/config.js) 的 `window.SITE_CONFIG` 中维护：

| 配置项 | 说明 |
| --- | --- |
| `name` / `nickname` / `avatar` | 显示名称、昵称、头像地址 |
| `taglines` | 打字机循环展示的标语 |
| `keywords` | P1 关键词词云，每次刷新随机字号 |
| `search` | LocalSearch 数据源 `api` 与文章链接前缀 `base` |
| `wordle` | 公开成绩 JSON 地址与刷新间隔（分钟） |
| `socials` | 社交链接（图标 + 名称 + URL） |
| `favicons` | 为指定域名固定 favicon |
| `github` | GitHub 用户名与贡献数据 API |
| `feeds` | P5 的 RSS / Atom 卡片 |
| `pt` | P4 的北洋园 PT 横幅；删除整个配置块即可隐藏 |
| `friends` | P3 友链头像，按分组配置 |
| `groups` | P6 快捷链接分组 |

页脚版权文本在同文件末尾的 `window.COPYRIGHT_TEXT` 中设置。

### Wordle 成绩

P2 的 Wordle 卡片只读取公开 JSON，不提供导入/导出，也不会在浏览器 `localStorage` 保存成绩。

数据链路：

1. 在 NYT Wordle 页面点击 **Share**，页面把分享文本写入剪贴板；
2. [`userscripts/wordle-sync.user.js`](userscripts/wordle-sync.user.js) 拦截这次复制，解析期数、分数和方块颜色；
3. 脚本读取公开地址，按期数 upsert 后，用 Basic Auth `PUT` 到 VPS；
4. 首页从 [`js/config.js`](js/config.js) 的 `wordle.dataUrl` 读取并展示，默认每 5 分钟刷新一次。

安装同步脚本：

- 浏览器安装 Tampermonkey（或兼容的用户脚本管理器）；
- 新建脚本，粘贴 [`userscripts/wordle-sync.user.js`](userscripts/wordle-sync.user.js) 的内容并保存；
- 第一次在 Wordle 点击 Share 时，按提示输入同步密码。密码只保存在 Tampermonkey 存储中，不会写进仓库；
- 脚本菜单可重设密码、重新同步上次分享文本。

支持 `3/6`、`X/6` 和困难模式 `3/6*`。只同步方块颜色、期数、日期和是否困难模式，不保存猜测的字母或答案；连续天数按相邻期数计算，遇到失败或缺失期数即中断。

VPS 端数据与接口：

- 数据文件：`/var/www/wordle-data/wordle.json`（放在仓库外，避免 git 冲突）；
- 公开读取：`https://loveapple.space/wordle-data/wordle.json`（带 CORS，禁止缓存）；
- 写入：`https://loveapple.space/wordle-api/wordle.json`（Basic Auth，仅允许 `PUT`）。

### 搜索数据

`search.api` 指向 Hexo `hexo-generator-search` 生成的 `search.json`，需支持 CORS。搜索结果会匹配标题、正文、标签和分类，文章链接由 `search.base + item.url` 拼接。

### 更新静态资源后

`index.html` 通过查询参数给 CSS / JS 加版本号，例如：

```html
<link rel="stylesheet" href="css/style.css?v=20261029c" />
<script src="js/config.js?v=20261029c"></script>
```

修改 `css/` 或 `js/` 后，请同步更新这些版本号，避免浏览器继续使用旧缓存。

## 🚢 部署

推送到 `main` 后，[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 会通过 SSH 登录服务器并执行：

```bash
cd $APP_DIR
git pull origin main
```

需要在 GitHub 仓库中配置以下 Secrets：

| Secret | 用途 |
| --- | --- |
| `SERVER_IP` | 服务器地址 |
| `SERVER_USER` | SSH 用户名 |
| `SSH_PRIVATE_KEY` | SSH 私钥 |
| `APP_DIR` | 服务器上的项目目录 |

项目是纯静态站点，服务器直接托管仓库文件即可，不需要构建步骤。

## 🎨 主题与定制

主题色在 [`css/style.css`](css/style.css) 顶部的 `:root` 中定义：

```css
--primary: #ffc0cb;      /* 主题淡粉色 */
--primary-dark: #e89cae; /* 强调色 */
--primary-deep: #d4788f; /* 深色文字/描边 */
```

暗色模式通过 `[data-theme="dark"]` 覆盖同一组变量。全屏分页的高度、页脚留白、圆点导航等规则在 [`css/paged.css`](css/paged.css) 中。

## 📝 说明

- `index.md` 是博客“关于我”页面的源文件，不属于首页运行链路。
- 首页依赖若干第三方资源：博客 `search.json`、GitHub 贡献 API、PT 横幅、Google favicon 和友链头像；接口不可用或图片被防盗链时，对应模块会显示错误或自动降级。
- 建议使用支持 `100dvh`、`IntersectionObserver` 和 CSS scroll-snap 的现代浏览器。

## 📄 License

本项目采用 [MIT License](LICENSE)。
