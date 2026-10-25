# 更新记录

按日期倒序排列（最新在最上）。

> **文件定位**：给 AI 助手「恢复记忆」用。
> 只记**关键里程碑**（让 AI 知道什么已经做完，不要重复做）和**待办**（让 AI 知道可能的下一个方向）。
> 不记流水账。细节看代码本身。

---
## 2026-10-24 · 图标档位统一 + 旅闻清空按钮固定底部

- **纯图标按钮统一 18px**：`tales` / `gift-set` 顶栏导出导入、`tales` 列表折叠按钮、`gift-set` 三个区块折叠开关、两处 ID 行上下移按钮，全部从手写 14px 改为跟随共享 `--icon`。规则：带文字 14px、纯图标 18px。
- **改用共享 `.btn-collapse`**（该类的定义在主仓库 `buttons.css`）：四个页面的顶栏按钮换用并删除各自本地规则。
- **`tales` 结构调整**：「清空全部记录」从内容流末尾改为固定页面底部；删除列表折叠功能（顶栏三角按钮 + `is-list-collapsed` + 对应脚本）。
- **附带**：`gift-set` 顶栏收图标的断点从 480px 变为 640px（共享类断点）。

---

## 2026-10-23 · 全仓库迁移至统一设计系统

- **根目录三文件合并**：`style.css` 内容被主仓库 `home.css` 完全覆盖、`app.js` 外壳逻辑内联、`icons.js` 四个图标早已并入 `ui-icons.js` 的 `handbook` 段，三者全部删除，根目录只剩 4 个文件。
- **四个页面迁移**：自建搜索框 / 下拉 / 计数徽标 / 空态 / 图标容器 → 全部改用共享组件；两个编辑器删掉 `tab-sheet` 抽屉，筛选改走共享 `.dropdown`。
- **动线调整**：`tales` 顶栏改实色固定、清空按钮移到页尾；`gift-set` 三区块统一折叠机制、推荐卡片改就地展开并与全部套装双向同步、主题按钮整个删除（由父页面控制）；两个编辑器「重排 ID」移到列表底部。
- **跨仓库路径统一**：全部改为绝对 URL，并修正为 `shared/css/theme.css`（此前少写一层 `/css` 曾导致整站白屏）。

**备忘**：本轮修的都是「看着能用、实际是坏的」问题（`.show` / `.active` 类名不匹配导致 Toast 与弹窗完全不显示、`--ctl-h` 等变量不存在、`shared/theme.css` 缺 `/css`）。通用坑位见主仓库 `CHANGELOG.md`。

---

## 2026-10-20 · 尘歌壶赠礼套装上线 + 图标系统重构

- **尘歌壶赠礼套装上线**：`tools/gift-set/` 三件套 + 空骨架 `data.js`。角色栏（星级色区分、排除旅行者、order 倒序）、推荐套装（pending 优先）、全部套装（单列手风琴、四档状态）、搜索筛选、导入导出、重置。完成判定为「拥有且完成所有已拥有角色」。
- **图标系统从外链图片改为内联 SVG**：弃用 `wsrv.nl` 代理与 Canvas 裁切，直接内联 `viewBox="0 0 256 256"` + `fill="currentColor"`，同步删除父页面约 65 行裁切死代码。
  > 本轮的 `icons.js` 方案**已于 2026-10-23 废弃** —— 四个图标并入主仓库 `ui-icons.js` 的 `handbook` 段，改为 Fluent UI 风格，本仓库不再有 `icons.js`。
- **两个编辑器的 id 上下移重构**：从「与相邻项交换 id」改为「± 1，冲突时交换」，解决不连续 id 下的跳跃问题。
- **偏好角色排序统一**：编辑器 chips 与导出均按 `icon-dict.js` 的 order 升序重排，与用户页一致。
- **两页 UI 规范统一**：顶栏 padding、UID 尺寸、按钮高度、图标尺寸、下拉面板结构全部对齐；批量 UX 修复（下拉面板位置、装饰性勾选移除、搜索框内边距、星级色背景、推荐角标层级、折叠箭头方向、id 输入聚焦等）。

---

## 2026-10-19 · 外壳重构与架构升级

- **品牌与外壳重构**：项目更名「提瓦特冒险之证」。主页升级为 Bento 网格 Dashboard，子工具全部通过 iframe 动态懒加载。
- **目录层级大迁移**：游逸旅闻从根目录剥离，完整迁移至 `tools/tales/`，变为内部子应用。
- **全动态加载**：所有 JS / CSS 摒弃静态引入，改为带时间戳的动态加载 + Promise 链防死锁。

---

## 2026-10-13

- **持久化重构**：localStorage 改用三段式 key `角色名·版本·旅闻名`，解决同名旅闻冲突。
- **主站 UI 规范化**：图标统一到 `window.ICONS`，不再手写 SVG；启动期防闪屏。
- **存档系统**：可选 UID，`游逸旅闻存档记录-[UID]-YYYYMMDD.json`。

---

## 2026-10-11

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

> 通用样式坑位（特异性陷阱、滚动条冲突、主题图标双显、`.field` 不拉伸、`.icon-slot` 尺寸、图标档位 14/18 等）见主仓库 `CHANGELOG.md`，此处只记本仓库特有的。

- **滚动容器**：`body` 必须写 `height: 100dvh; overflow: hidden`（**`min-height` 不够**），否则顶栏会跟着内容滚走，滚动条也会包住整页。
- **固定底栏**：`tales` 的「清空」和 `gift-set` 的「重置」都固定在页面底部 —— 放在 `body` 末尾、`flex-shrink: 0`，不要塞进滚动容器内部靠 `padding` 顶到底。
- **`tales` 的「隐藏旅闻」**：业务标记必须用 `.is-biz-hidden`，不能用 `.hidden`（会被全局硬隐藏规则吃掉）。
- **两仓库类名同步**：`.show` / `.active` / `.warn` 这类旧类名一律不存在于共享 CSS 里，看到就是 bug。
- **编辑器数据格式**：`completed` 按 `set.key` 索引而不是 `set.id`，因为 id 在编辑器里会变动。

---

## 🚧 待办事项

- **暂无**。两个查询页 + 两个编辑器均已迁移至统一设计系统，根目录三个冗余文件已清除。

> 后续如果有新增工具，按 `tools/<name>/` + `tools/<name>-editor/` 的双目录模式建，直接复用主仓库组件，不要自造轮子。
