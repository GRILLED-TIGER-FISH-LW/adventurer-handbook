# 给 AI 助手的维护手册

> 读完本文件，简单确认即可，**等我下指令**。不要主动给方案或改代码。
> 只记方法：协作流程、诊断套路、实现约定。具体实现看代码本身。

---

## 一、环境约束

| 约束 | 后果 |
|---|---|
| 我**只用手机**操作 GitHub 网页端 | 方案不能依赖命令行或本地环境 |
| 我**看不到 Console** | 出错只能靠页面现象、UI 反馈、导出结果判断 |
| 我**没有本地构建环境** | 构建靠 GitHub Actions，改完必须等部署 |
| 排查靠**截图 + 粘贴文本** | 报错必须能被「看到」，否则无法定位 |

**推论**：所有方案要满足「手机上能贴、出错能看见、失败能回退」。

---

## 二、协作流程

1. **先给方案，我确认后再给代码。**
2. **一次给 3 到 4 个完整文件**，不要一个一个发。
3. 每个文件**必须完整**，4 个反引号包裹，可直接整段替换。
4. 改动前说清：动的是**共享层还是单个页面**，影响范围多大。
5. **不记流水账**：只说做完了什么，不写过程。
6. 涉及数据改动（字典格式、存档格式）时，**先说明会不会影响我已有数据**。

### 定位改动位置

**不要让我去搜索某段代码** —— 搜不到的原因很多（空格、缩进、版本不一致），白费一轮对话。

| 改动规模 | 怎么给 |
|---|---|
| 1 处、1 行以内 | 说清**哪个文件** + 给出**完整一整行** + 注明共几处 |
| 2 处以上，或涉及一个块 | **直接给全文** |

### 三份文档怎么分工

| 文件 | 给谁看 |
|---|---|
| `README.md` | 使用者：怎么用、数据存哪、常见问题 |
| `CHANGELOG.md` | 里程碑（起因 → 经过 → 结果，当前月份按天一条） |
| `AGENTS.md` | 本文件：AI 的维护手册（流程 / 约定 / 诊断） |

### 批量机械改动（临时 Action）

挪文件、全站同一个字符串替换、删几个文件，**不要一个个文件去改** —— 照抄主仓库的 `.github/workflows/reorg.yml`（清单式：`MOVES` / `EDITS` / `DELETES` / `CHECKS` 四段写在文件顶部 `env` 里），在本仓库默认分支上建出来、直接 Run workflow（从 `main` 跑，清单名会变成分支名 `reorg-<名字>`）。

- 工序固定：`MOVES` → `EDITS` → `DELETES` → `CHECKS` → 构建 → 才提交推送；**只推 `reorg-<名字>` 分支，永远不碰 main**；找不到原文、自检没过、构建失败都不推。
- `EDITS` 里的文件名要写**搬完之后的路径**；`CHECKS` 查「实际行为」而不是名字 —— 新文注释里顺手写个被检查的字符串，会把自己卡住（栽过）。
- 验收：`https://github.com/GRILLED-TIGER-FISH-LW/adventurer-handbook/compare/main...reorg-<名字>` → 开 PR → Merge → 删分支。手机上看不到分支横幅，直接用这条链接。
- 只适合机械改动；要重写的东西（搬页面、改交互）不适用。
- 用完就删（2026-11 那次改名就是这么干完顺手自删的），下次要用再抄一份。

---

## 三、当前架构

单一 Vue 单页应用。**没有 iframe，没有多页构建。**

```
├── .github/workflows/     构建检查 + 部署
├── public/data/           游戏数据 · 运行时加载，不参与编译
└── src/
    ├── components/        可复用控件
    ├── composables/       主题 / 通知队列 / 数据加载
    ├── icons/             UI 图标（Fluent）
    ├── styles/            设计令牌 + 全局基线
    └── views/             页面
```

### 路由

| 路径 | 页面 | 进导航 |
|---|---|---|
| `/` | 首页 | — |
| `/tales` | 游逸旅闻 | ✅ |
| `/gift-set` | 尘歌壶赠礼套装 | ✅ |
| `/tales-editor` | 游逸旅闻编辑器 | ❌ 内部页 |
| `/gift-set-editor` | 尘歌壶赠礼套装编辑器 | ❌ 内部页 |

`meta` 规则：有 `label` → 进导航；只有 `title` → 仅做顶栏标题；`internal: true` → 顶栏不显示菜单按钮。

### 跨仓库依赖

**只剩 1 个**：

```
https://grilled-tiger-fish-lw.github.io/genshin-guide/shared/image-dict.js
```

图片字典（头像 / 名片 / 立绘，约 75KB，跨仓库共用所以不本地化）。读它用 `loadGlobalScript(URL, 'IMAGE_DICT')`，拿到的是整个字典对象（`dict.characters[代号].name` 这样取）。**不要再引入**主仓库的 `theme.css` / `ui-icons.js` / `dropdown.js` / `image-loader.js`。
**读它的地方有 4 个**：`src/views/{GiftSet,GiftSetEditor,Tales,TalesEditor}.vue`，
每个文件两处（URL 常量 + `loadGlobalScript` 的全局名），都带 `.catch(() => null)` —— 断了只是没图标、不白屏。
**主仓库 2026-11 给字典改过名**（现在叫 `image-dict.js`、全局 `IMAGE_DICT`，见它自己的 CHANGELOG）；
跟着改的就是这 8 处；那边以后再动，这边要一起改。

---

## 四、实现约定

### 令牌

- 颜色、圆角、阴影、缓动都在 `src/styles/tokens.css` 的 `@theme` 块里，**改颜色只改这一个文件**。
- Tailwind 默认刻度**已等于** Notion 刻度（间距 4/8/12/16/24/32，控件高 `h-9`/`h-10`），**不需要自定义间距与高度 token**。
- 深色模式**靠变量覆盖**，不用 `dark:` 前缀。
- 图像衬底用 `--color-thumb`（深色下比卡片**亮**）；`--color-sunken` 只用于凹陷（分段轨道、已完成底色）。

### 控件高度

| 场景 | 高度 |
|---|---|
| 顶部工具栏 / 筛选条 | `h-9`（窄屏 `h-10`） |
| 页内表单 / 弹窗内 | `h-10` |

### 禁用清单

| 禁 | 原因 |
|---|---|
| `backdrop-filter` | 破坏 fixed 包含块 + Android 掉帧。用 `color-mix()` 或实色 |
| 颜色属性的 `transition` | 主题切换会渐变。只允许 `transform` / `opacity` / `box-shadow` |
| 裸 `1fr` | 用 `minmax(0, 1fr)` 或 Tailwind 的 `grid-cols-*` |
| 单独用 `outline-none` | 杀掉焦点环，必须有 `focus:ring` 之类替代 |
| 布局用 `margin` | 用 `gap`；居中用 `align-self` / `justify-self` |

### 状态与文案

- 状态类：`.is-active` / `.is-open` / `.is-visible` / `.hidden`。
- **业务状态不要用 `.hidden`**（撞全局硬隐藏），用 `.is-biz-hidden` 这类独立名字。
- **UI 文案不写具体数字**，除非它来自数据。

### 页面骨架与数据

- 页面容器用 `grid h-full grid-rows-[auto_minmax(0,1fr)_auto]`；最外层 `h-dvh overflow-hidden`（**`min-height` 不够**，顶栏会跟着内容滚走）。
- 图片要有**首字兜底**：首字常驻，图片绝对定位盖在上面，加载失败即露出首字（不要 `remove()` 了事）。
- **导出 / 序列化必须只读**：用数据副本，不改动编辑中的对象。
- 表单输入**输入即生效**，不要「必须选中某项才落值」，否则界面显示值与真实值会不一致。

### 焦点样式（全站统一，只有一种）
所有可聚焦控件一律：`focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent`
- 唯一例外：容器会裁剪 outline 的（如 `Tabs` 的 `overflow-x-auto`）用 `focus-visible:-outline-offset-2` 画成内描边
- 错误态换色：`focus-visible:outline-danger`（配 `border-danger`）
- 程序化聚焦的对话框容器（`Modal` 面板、`AppDrawer` 抽屉）用 `focus:outline-none`，故意不画环
- 不再使用 `focus:ring-*` / `ring-accent-soft`（12% 透明环在实心底上看不见）

---

## 五、诊断套路

### 白屏

按顺序查，不要跳步：

1. **`Settings → Pages → Source` 是不是 `GitHub Actions`**。若是 `Deploy from a branch`，Pages 会直接拿仓库源码当网站 —— 源码 `index.html` 引用 `/src/main.js`，浏览器解析不了 `.vue`，必然白屏，**加 `?t=` 也没用**。
2. **`vite.config.js` 里 `base: '/adventurer-handbook/'` 在不在**。丢了则产物引用 `/assets/…`，少仓库前缀，全部 404。
3. **缓存**：GitHub Pages 的 HTML 缓存约 10 分钟，加 `?t=1` 绕过。

> `index.html` 里有内联守卫脚本：4 秒内没渲染出内容，会把实际引用的脚本路径打在屏幕上。**让它先说话。**

| 屏幕显示的路径 | 结论 |
|---|---|
| 带 `/adventurer-handbook/assets/` | base 对，产物没部署上去 |
| 只有 `/assets/…` | base 配错 |
| 是 `/src/main.js` | Pages 源没切成 GitHub Actions |

### 「改了但没效果」

**先确认文件真的更新了**，不要假设：

1. 搜文件里的独特标记（如版本注释），搜不到 = 没替换成功
2. 不带 `?t=` 打开可能是旧缓存
3. 只有部分改动生效 → 文件里有**两个同类样式**在互相覆盖

### 样式没生效 / 时好时坏

- 同一元素上**两个同属性 utility**（如 `bg-surface` 和 `bg-sunken/50`），谁赢取决于 Tailwind 生成 CSS 的顺序，**不是模板里的顺序**。修法：让它们互斥，写进同一个条件。
- 手写 CSS 里直接写 `var(--color-x)`，而没有 utility 用到它 → Tailwind **不会输出这个变量**。手写 CSS 取令牌要用 `@apply`。

### 图标不显示 / 缺几条线

- **线条路径在 `fill` 模式下会消失**（零面积）。字典必须是**填充路径**。
- 确认字典版本（文件顶部有版本注释）。
- key 是**驼峰**（`ui.chevronDown`），不是连字符。
- 箭头类箭头用 `bold`（实心），其他按钮用默认线框。

### 手机上卡住

窄屏是**分栏切换**（列表 ↔ 表单）。任何「清空选中项」的操作都必须同时把当前栏切回列表；**返回按钮要放在最外层**，保证任何状态都能回列表。

### 部署失败怎么读日志

`Actions` → 红的 workflow → 点 **`build`** 方框 → 点红的步骤 → **拉到最底**（错误在最后十几行，前面全是 npm 噪音）。

| 报错关键词 | 原因 |
|---|---|
| `No matching version found for @tailwindcss/…` | 上游发布异常。**依赖锁精确版本**，不要用 `^` |
| `Could not resolve "../composables/x.js"` | 文件放错目录，或名字大小写不对 |
| `Cannot use import statement outside a module` | `package.json` 少了 `"type": "module"` |
| `Get Pages site failed` | Pages 源不是 `GitHub Actions` |

### 页面能开但内容空

运行时数据文件路径不对：检查 `public/data/` 是否就位；`loadGlobalScript` 拼路径时**绝对 URL 必须原样使用**，不能再前缀 `BASE_URL`（会拼成 `/adventurer-handbook/https://…`）。

---

## 六、待办 / 下一步

**无必须做的事。** 四个页面 + 两个编辑器都在新架构上运行。

可选优化（都不紧急）：

- `public/favicon.ico` 不存在，标签页没有图标
- `Field` 组件没有前后缀插槽，搜索框是内联写的，将来可抽成共用
- 两个编辑器目前只能靠浏览器后退离开，可加一个「返回工具页」按钮
