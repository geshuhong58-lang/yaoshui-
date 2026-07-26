# OpenNice 游戏站部署说明

## 关键文件

- `index.html`：英文首页，包含唯一 H1、canonical、ItemList 结构化数据和六款游戏入口。
- `catalog.html`：六款游戏的完整目录页，支持搜索与多分类筛选。
- `marvel-rivals.html`：Marvel Rivals 详情页，包含官方发行预告片、六张截图、简介、发行日期和 Steam 商店组件。
- `mr-mine.html`：Mr. Mine 独立浏览器游戏页。
- `poker-quest.html`：Poker Quest 独立浏览器游戏页。
- `grindcraft.html`：Grindcraft 独立浏览器游戏页。
- `fray-fight.html`：Fray Fight 独立浏览器游戏页。
- `world-of-eggs.html`：World of Eggs 抢先体验详情页，包含官方视频、图片滑动区、简介、发行信息与 Steam 商店组件。
- `game-player.html`：旧播放器链接的兼容跳转页，不嵌入任何第三方游戏。
- `styles.css`：全站 PC 与手机响应式样式，采用深色游戏商店式信息架构。
- `site.js`：目录搜索、多分类筛选、详情页媒体轮播和后续悬停视频预览的渐进增强脚本。
- `assets/covers/`：四款 Playsaurus 浏览器游戏的官方图片。
- `assets/marvel-rivals/`：Marvel Rivals 的 Steam 官方发行预告片、封面与六张游戏截图。
- `assets/world-of-eggs/`：World of Eggs 的 Steam 官方预告片、封面与六张游戏截图。
- `robots.txt`：允许搜索引擎抓取公开页面，并声明站点地图。
- `sitemap.xml`：首页、目录页、四个浏览器游戏页和两个 Steam 详情页的地址清单。

## Marvel Rivals 页面说明

1. 页面中的发行预告片、封面、截图、简介和发行日期来自 Marvel Rivals 的 Steam 官方页面。
2. 游戏由 NetEase Games 开发并发行，Steam 发行日期为 2024 年 12 月 5 日。
3. Steam 提供的 `widget/2767030/` 是商店组件，不是可游玩的游戏 iframe；页面已明确提示用户通过 Steam 安装和启动。
4. “Open the Steam page”按钮和商店组件都会引导用户前往官方 Steam 页面。

## World of Eggs 页面说明

1. 页面中的预告片、封面、截图与简介信息来自该游戏的 Steam 官方页面。
2. 游戏由 SQRT Games 开发并发行，站内已明确标注 Early Access、发行日期与支持平台。
3. Steam 提供的 `widget/3381130/` 是商店组件，不是可游玩的游戏 iframe，因此页面不会误导用户在站内直接开始游戏。
4. “View on Steam”按钮和商店组件都会引导用户前往官方 Steam 页面。

## Playsaurus 条款对应情况

1. 四个游戏 iframe 都直接使用官方提供的 HTTPS 地址。
2. 用户提供的 iframe 权限原样保留，其中包括 `payment`、`fullscreen`、`gamepad` 和剪贴板权限。
3. iframe 前面没有广告、视频、封面按钮或其他媒体遮挡。
4. 每个 iframe 下方紧接官方游戏链接和 Playsaurus 开发者署名。
5. 游戏链接和 Playsaurus 链接均为普通可抓取链接，没有添加 `nofollow`。
6. 署名文字使用与页面标准正文相同的 16px 字号，并使用高对比度颜色。
7. 页面明确说明 OpenNice 是独立游戏门户，不声称创建、开发或拥有这些游戏。
8. Mr. Mine 与 Poker Quest 页面已补齐条款要求的官方游戏链接。

## 上传方式

请上传项目文件夹中的全部新文件和目录，不要只上传单个 HTML：

1. 上传当前全部九个 HTML 文件。
2. 上传 `styles.css`、`site.js`、`robots.txt` 和 `sitemap.xml`。
3. 上传整个 `assets/covers/`、`assets/marvel-rivals/` 与 `assets/world-of-eggs/` 目录。
4. 用新版文件覆盖服务器上的同名旧文件。
5. 从服务器删除已下架的 `clicker-heroes.html` 和 `assets/covers/clicker-heroes.png`。
6. 如果网站接入 Cloudflare，上传后执行一次 Purge Cache。

## 上线后检查

1. 确认所有页面都通过 HTTPS 打开。
2. 分别打开四个浏览器游戏页，检查游戏是否开始加载。
3. 检查 iframe 下方是否立即显示官方游戏链接和 Playsaurus 署名。
4. 用手机竖屏和横屏各测试一次游戏页面。
5. 查看浏览器控制台，确认没有由站点自身代码产生的脚本错误。
6. 打开 `marvel-rivals.html`，检查视频、七个媒体项目、Steam 按钮和商店组件。
7. 打开 `world-of-eggs.html`，检查视频、七个媒体项目、Steam 按钮和商店组件。
8. 在 Google Search Console 重新提交 `https://opennice.online/sitemap.xml`。

## 后续添加浏览器游戏

新增浏览器游戏前，先确认 Playsaurus 官方嵌入页面提供了该游戏的 iframe 和署名代码。复制现有独立游戏页时，必须同时更新标题、canonical、结构化数据、官方游戏链接、iframe 和页面介绍，不能只更换 iframe 地址。

## 后续补充悬停视频

1. 首页和目录页的游戏卡片已经包含空的视频容器，但当前不会下载或播放任何悬停视频。
2. 将短视频上传到站内目录，例如 `assets/previews/mr-mine.mp4`。
3. 找到对应卡片的 `data-preview=""`，只填写视频地址，例如 `data-preview="assets/previews/mr-mine.mp4"`。
4. `site.js` 只会在支持鼠标悬停的电脑设备上按需加载视频；手机端始终保留正常点击，不依赖悬停。
5. 建议每段视频控制在 2–4 秒、静音、循环播放，并同时提供压缩良好的 MP4 文件。
