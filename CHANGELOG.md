# 更新记录

按日期倒序排列（最新在最上）。

> **文件定位**：给 AI 助手「恢复记忆」用。
> 只记**关键里程碑**（让 AI 知道什么已经做完，不要重复做）和**待办**（让 AI 知道可能的下一个方向）。
> 不记流水账。细节看代码本身。

---

## 2026-10-23 · 全仓库迁移至统一设计系统

**里程碑**

- **根目录三文件合并**：`style.css` + `app.js` + `icons.js` 全部并入 `index.html`。
  - `style.css`：内容 100% 被主仓库 `home.css` 覆盖，直接删除。
  - `app.js`：外壳逻辑（Bento 网格 / hash 路由 / iframe 管理 / 主题同步）改为内联 `<script>`。
  - `icons.js`：四个业务图标早已并入主仓库 `ui-icons.js` 的 `handbook` 段，直接删除。
  - 根目录现在只有 4 个文件：`index.html` / `favicon.ico` / `README.md` / `CHANGELOG.md`。
- **`tales` 页迁移 + 动线重排**：
  - 自建搜索框 / 下拉 / 计数徽标 / 空态 / 图标容器 → 全部改用共享 `.search` / `.dropdown` / `.count-badge` / `.empty-state` / `.icon-slot`。
  - 顶栏从 `position: sticky` + 玻璃半透明改为**实色 + 固定不滚**，`body` 锁 `100dvh`，右侧滚动条只作用于列表。
  - 「清空全部记录」从顶栏移到页尾（内容流内），顶部加「收起列表」开关，收起后清空按钮直接顶到顶栏下方。
- **`gift-set` 页迁移 + 动线重排**：
  - 三个区块（我的角色 / 推荐套装 / 全部套装）统一改为 `.collapsed` 折叠机制。
  - 推荐卡片从「点击跳转 + 清空筛选」改为**就地展开**，与「全部套装」的展开状态共享一个 `expandedKeys` Set，双向同步。
  - 「未完成」筛选只保留「有角色但没送完」的套装，不再混入「未拥有角色」。
  - 点未拥有的角色会弹 Toast 提示去上方勾选。
  - 「已达成」文案改为「已送完」。
  - **主题按钮整个删除**（本页始终作为外壳 iframe 使用，主题由父页面控制）。
- **`tales-editor` / `gift-set-editor` 迁移**：
  - 删除 `tab-sheet` 底部抽屉一整套，筛选改用共享 `.dropdown` + `dropdown:select` 事件。
  - 自建 combobox → 共享 `.combobox`，`.ed-group` / `.ed-label` / `.ed-row-2` → 共享 `.field` / `.field-label` / `.field-row`。
  - 删除 `FALLBACK_ICONS`（`ui.reload` / `ui.reorder` / `ui.back` / `ui.file` 在 `ui-icons.js` 里都有）。
  - 主题从本地 `applyTheme` 改为 `theme-init.js` 的 `Theme.toggle()`。
  - 「重排 ID」从顶栏移到列表底部，与「新增」并排。
- **跨仓库路径统一**：全部改为绝对 URL，且修正为 `shared/css/theme.css`（此前少写一层 `/css` 曾导致整站白屏）；新增 `theme-init.js` 与 `dropdown.js` 两个共享脚本。

**备忘**

- 本轮修掉的全是「**看着能用、实际是坏的**」的问题：`.show` / `.active` 类名与共享体系不匹配导致 Toast 和弹窗完全不显示、`--ctl-h` 等变量不存在导致圆角为 0、`shared/theme.css` 缺 `/css` 导致整站无样式。
- 通用样式坑位（特异性、滚动条、主题图标双显、`.field` 不拉伸等）见主仓库 `CHANGELOG.md` 的「关键坑位备忘」，不在此重复。

---

## 2026-10-20 · 尘歌壶赠礼套装上线 + 图标系统重构

**里程碑**

- **尘歌壶赠礼套装上线**：`tools/gift-set/` 三件套 + 空骨架 `data.js`。实现角色栏（按星级色区分、排除旅行者、order 倒序）、推荐套装（pending 优先排序）、全部套装（单列手风琴、四档状态筛选）、搜索筛选、导入导出、重置。完成判定采用「拥有且完成所有拥有角色」。
- **图标系统从外链图片改为内联 SVG**：`icons.js` 不再使用 `wsrv.nl` 代理和 Canvas 自动裁切，直接内联 `viewBox="0 0 256 256"` + `fill="currentColor"` 的 SVG。同步删除父页面 `app.js` 里的 `autoCropImages` / `processCrop` 约 65 行死代码，和 `style.css` 里针对 `<img alt="...">` 的死规则。
  > 注意：本轮的 `icons.js` 方案**已于 2026-10-23 废弃** —— 四个图标并入主仓库 `ui-icons.js` 的 `handbook` 段，改为 Fluent UI 风格，本仓库不再有 `icons.js`。
- **两个编辑器的 id 上下移逻辑重构**：从「与相邻项交换 id」改为「± 1，冲突时交换」。解决不连续 id 场景下的跳跃问题。
- **赠礼套装编辑器偏好角色排序统一**：编辑器 chips 显示和导出时均按 `icon-dict.js` 的 order 升序重排，与用户页展示一致。
- **tales / gift-set 的 UI 规范统一**：顶栏 padding、UID 尺寸、按钮高度、图标尺寸、下拉面板结构全部对齐。批量 UX 修复一并完成（下拉面板位置、装饰性勾选移除、搜索框内边距、星级色背景、推荐角标层级、折叠箭头方向、id 输入聚焦等）。

**待办**

- 无

---

## 2026-10-19 · 外壳重构与架构升级

**里程碑**

- **品牌与外壳重构**：项目更名「提瓦特冒险之证」。主页升级为 Bento 网格 Dashboard 架构，子工具全部通过 iframe 动态懒加载。
- **目录层级大迁移**：游逸旅闻从根目录剥离，完整迁移至 `tools/tales/`，彻底变为内部子应用。
- **全动态加载**：所有 JS / CSS 摒弃静态引入，改为带时间戳的动态加载 + Promise 链防死锁。

**待办**

- `tools/gift-set/` 尘歌壶赠礼套装开发（已在上条完成）。

---

## 2026-10-13

**里程碑**

- **持久化重构**：localStorage 改用三段式 key `角色名·版本·旅闻名`（解决同名旅闻冲突）。
- **主站 UI 规范化**：图标统一到 `window.ICONS`，不再手写 SVG；启动期防闪屏。
- **存档系统**：可选 UID，`游逸旅闻存档记录-[UID]-YYYYMMDD.json`。

---

## 2026-10-11

**里程碑**

- **主站上线**：`https://grilled-tiger-fish-lw.github.io/adventurer-handbook/`
- **游逸旅闻完整版**：7.1 版本 156 条数据、搜索筛选、完成记录、主题切换。

---

## 📌 命名规范

- **文件夹 / 文件名**：英文小写，多词用短横线。
- **工具结构**：`tools/<name>/{index.html, style.css, app.js}`；`style.css` **只写布局**。
- **查询页 / 编辑器**：查询页用 `tools/<name>/`，对应编辑器用 `tools/<name>-editor/`，两者平级。
- **跨仓库引用**：一律用**绝对 URL**，不能写相对路径（本仓库不维护自己的共享资源）。
  ```
  https://grilled-tiger-fish-lw.github.io/genshin-guide/shared/css/…
  https://grilled-tiger-fish-lw.github.io/genshin-guide/shared/ui-icons.js
  https://grilled-tiger-fish-lw.github.io/genshin-guide/shared/gi-icons/…
  ```
- **状态类名**：`.is-active`（选中）/ `.is-open`（展开）/ `.is-visible`（显示）/ `.hidden`（硬隐藏）。
- **业务标记**：不要用 `.hidden` 表示「这条数据被隐藏」这种业务状态，会撞全局类。用 `.is-biz-hidden` 之类的独立名字（`tales` 的「隐藏旅闻」就踩过这个坑）。

---

## 🗺️ 关键路径速查

| 内容 | 路径 |
|---|---|
| 主站外壳（路由 / iframe / 主题同步） | `index.html` |
| 游逸旅闻 | `tools/tales/` |
| 游逸旅闻编辑器 | `tools/tales-editor/` |
| 尘歌壶赠礼套装 | `tools/gift-set/` |
| 尘歌壶赠礼套装编辑器 | `tools/gift-set-editor/` |
| 主仓库设计系统入口 | `genshin-guide/shared/css/theme.css` |
| 主题持久化 + 防闪白 | `genshin-guide/shared/css/theme-init.js` |
| 下拉引擎 | `genshin-guide/shared/css/dropdown.js` |
| 共享 UI 图标 | `genshin-guide/shared/ui-icons.js` |
| 角色头像字典 | `genshin-guide/shared/gi-icons/icon-dict.js` |
| 图标渲染器（仅编辑器） | `genshin-guide/shared/gi-icons/icon-loader.js` |

---

## 🤖 给 AI 的备忘

> [!IMPORTANT]
> **记忆恢复**：读完 README 和 CHANGELOG 后，简单确认即可，**等我下指令**。不要主动给方案或改代码。

### 修改流程
1. **先给方案，我确认后再给代码**。
2. 我发齐文件后，你**一次发回一个完整文件**。代码必须完整，用 4 个反引号包裹。
3. 我**只用手机**操作，看不到 Console。改动要保证语法无误，或告诉我怎么快速回退。
4. **别记流水账**：里程碑只写"做完了什么"，不写过程。
5. 改动前先说清楚**动的是共享层还是工具本地文件**，以及影响范围。
6. 本仓库所有代码必须与主仓库 `genshin-guide` 保持风格一致。**每次动手前，先确认主仓库对应模块的最新规范。**

### 环境约束
- 我**只能用手机**操作 GitHub 网页端。
- 我**看不到 Console**，诊断只能看现象 / UI 反馈 / 导出结果。
- 改完没效果 → 先关浏览器重开或换无痕测试。

### 跨仓库约定

- **绝对 URL**：本仓库不维护自己的设计系统，所有共享资源从主仓库 GitHub Pages 绝对路径加载。
- **路径必须精确**：`shared/css/theme.css`、`shared/css/theme-init.js`、`shared/css/dropdown.js`、`shared/ui-icons.js`、`shared/gi-icons/*`。**曾因少写一层 `/css` 导致整站永久白屏。**
- **`theme-init.js` 例外**：唯一不带时间戳的引用，且必须在 `<head>` 里**同步阻塞**加载（不能 `defer` / `async`），否则首帧闪白。
- **icon-loader.js 只有编辑器用**：查询页直接拼 `icon-dict.js` 的头像 URL，不调 Canvas 烘焙。
- **iframe 主题同步**：父页面点主题时，先 `contentDocument.documentElement.setAttribute('data-theme', t)` **再** `postMessage`，两路都要做——只靠 `postMessage` 会慢半拍。

### 关键坑位备忘

> 通用样式坑位（特异性陷阱、滚动条冲突、主题图标双显、`.field` 不拉伸、`.icon-slot` 尺寸等）见主仓库 `CHANGELOG.md`，此处只记本仓库特有的。

- **滚动容器**：`body` 必须写 `height: 100dvh; overflow: hidden`（**`min-height` 不够**），否则顶栏会跟着内容滚走，滚动条也会包住整页。
- **固定底部 vs 内容流**：`gift-set` 的「重置」固定在底部，`tales` 的「清空」在内容末尾（靠顶栏的折叠按钮快速抵达）。两者行为不同是有意的，不要强行统一。
- **`tales` 的「隐藏旅闻」**：业务标记必须用 `.is-biz-hidden`，不能用 `.hidden`（会被全局硬隐藏规则吃掉）。
- **两仓库类名同步**：`.show` / `.active` / `.warn` 这类旧类名一律不存在于共享 CSS 里，看到就是 bug。
- **编辑器数据格式**：`completed` 按 `set.key` 索引而不是 `set.id`，因为 id 在编辑器里会变动。

---

## 🚧 待办事项

- **暂无**。两个查询页 + 两个编辑器均已迁移至统一设计系统，根目录三个冗余文件已清除。

> 后续如果有新增工具，按 `tools/<name>/` + `tools/<name>-editor/` 的双目录模式建，直接复用主仓库组件，不要自造轮子。
