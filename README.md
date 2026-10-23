<div align="center">

# 提瓦特冒险之证

> 《原神》游逸旅闻与尘歌壶赠礼查询及进度记录工具 · 纯前端 · 本地记录 · 不收集数据

[![在线访问](https://img.shields.io/badge/在线访问-打开网站-9E6C47?style=flat-square&logo=googlechrome&logoColor=white)](https://grilled-tiger-fish-lw.github.io/adventurer-handbook/)
[![最后更新](https://img.shields.io/github/last-commit/GRILLED-TIGER-FISH-LW/adventurer-handbook?style=flat-square&label=最后更新&color=9E6C47&logo=github&logoColor=white)](https://github.com/GRILLED-TIGER-FISH-LW/adventurer-handbook/commits)
[![Tech Stack](https://img.shields.io/badge/Tech-Vanilla%20JS%20%7C%20HTML5-F4F1EA?style=flat-square)]()

[入口](#start) · [功能](#features) · [数据说明](#data) · [存档说明](#save) · [文件结构](#structure) · [外部依赖](#deps) · [更新记录](./CHANGELOG.md)

</div>

---

> [!NOTE]
> 本仓库复用主仓库 [genshin-guide](https://github.com/GRILLED-TIGER-FISH-LW/genshin-guide) 的设计系统与图标体系。
> **动手改代码之前，先看 [CHANGELOG](./CHANGELOG.md) 里的「技术约定」** —— 跨仓库路径、加载骨架、类名规范都记在那里。

<a id="start" name="start"></a>
## 🚀 入口

主页为 Bento 网格 Dashboard。查询页通过 `iframe` 嵌入外壳，编辑器为独立工具页，不嵌入外壳。

| 工具 | 访问链接 | 类型 |
|---|---|---|
| 主站首页 | [打开首页](https://grilled-tiger-fish-lw.github.io/adventurer-handbook/) | 外壳 |
| **游逸旅闻** | [`#tales`](https://grilled-tiger-fish-lw.github.io/adventurer-handbook/#tales) | 嵌入 |
| **尘歌壶赠礼套装** | [`#gift-set`](https://grilled-tiger-fish-lw.github.io/adventurer-handbook/#gift-set) | 嵌入 |
| 游逸旅闻编辑器 | [`tools/tales-editor/`](https://grilled-tiger-fish-lw.github.io/adventurer-handbook/tools/tales-editor/) | 独立页 |
| 尘歌壶赠礼套装编辑器 | [`tools/gift-set-editor/`](https://grilled-tiger-fish-lw.github.io/adventurer-handbook/tools/gift-set-editor/) | 独立页 |

> 两个编辑器只供维护数据用，不在外壳里，也不对外暴露入口。

---

<a id="features" name="features"></a>
## ✨ 功能

### 1. 游逸旅闻

- **搜索与筛选**：按角色名 / 旅闻名模糊搜索；按版本、状态、是否隐藏三个下拉筛选。
- **完成记录**：点卡片切换状态，右上角实时显示「已完成 X / 156」，自动存 `localStorage`。
- **存档导入导出**：可选填 UID，导出 JSON 存档；兼容旧版单段 / 双段式数据格式导入。
- **布局**：顶栏三行（搜索 / 筛选 / UID+导入导出）常驻固定，右侧滚动条只作用于下方列表；列表可一键收起，页尾有「清空全部记录」。

### 2. 游逸旅闻编辑器

- **双栏编辑**：左侧列表（头像 + 标题 + 角色·版本），右侧表单实时编辑。
- **头像自动匹配**：读 `window.ICON_DICT`，按 `prefix + key + ext` 或 `item.url` 拼装。
- **联想输入**：版本 / 角色名支持打字筛选，输入新值即新建条目。
- **id 管理**：手动改（重复实时标红）、上下移动（± 1，冲突时交换）、一键按显示顺序重排。
- **导出前校验**：缺角色 / 缺版本 / 缺标题 / id 重复 / 版本不在 `versions` 列表。
- **草稿自动恢复**：`localStorage` 400ms debounce，刷新不丢；导出成功后自动清空。

### 3. 尘歌壶赠礼套装

- **我的角色**：54px 卡片 / 40px 头像网格，按 `order` 倒序（最新实装在前），排除旅行者。已拥有按星级色背景，未拥有灰化。选完角色后自动收起。
- **推荐套装**：按「已有但未完成角色数」降序 → 「owned/total 比例」降序 → `id` 升序，取前 5 个。**点卡片就地展开**，与「全部套装」的展开状态双向同步。
- **全部套装**：单列手风琴。每张卡显示 2:1 缩略图 + 名称 + 地区·类型 + 进度（`3 / 5` / `未拥有角色` / `已完成` / `已送完`）。展开后显示偏好角色格，点击切换完成状态；点未拥有的角色会提示去上方勾选。
- **完成判定**：拥有且完成所有**已拥有**的角色即算达成；如果套装里的角色一个都没拥有，视为「未拥有角色」。
- **搜索与筛选**：搜索套装名 / 角色名；按地区、室内外下拉筛选。「未完成」只包含「有角色但没送完」的套装。
- **布局**：顶栏固定，滚动条只作用于内容区；顶栏的「重置全部数据」放在页尾固定区，不与日常操作挨着。

### 4. 尘歌壶赠礼套装编辑器

- **URL 智能识别**：粘贴任意域名的套装图直链，自动截取文件名作为 `key`（忽略查询参数、去扩展名）。
- **类型 / 地区自动推断**：`Exterior` → 室外、`Interior` → 室内；`Mond` / `Liyue` / `Dq` / `Xm` / `Fd` / `Nt` / `Ndkl` / `Zd` → 对应地区。只在 key 变化时推断，手动改的不被覆盖。
- **偏好角色批量输入**：chips 展示 + 联想追加 + × 删除；支持逗号 / 空格 / 顿号 / 分号分隔的批量粘贴。
- **id 管理**：同旅闻编辑器。
- **导出前校验**：id 重复 / 缺 key / 缺名称 / 缺地区 / 类型非法。
- **草稿自动恢复**：同上。

---

<a id="data" name="data"></a>
## 📊 数据说明

### 游逸旅闻 · `tools/tales/data.js`

数据挂载在 `window.TRAVELERS_TALES`：

```js
{
  meta: { version, total, updatedAt, source },
  versions: ["5.4", "5.7", ...],
  entries: [
    {
      id: 1,
      character: "迪卢克",
      version: "5.4",
      title: "定价",
      hidden: false,
      location: "蒙德-晨曦酒庄",
      trigger: "",
      prerequisite: "",
      description: "..."
    }
  ]
}
```

### 尘歌壶赠礼套装 · `tools/gift-set/data.js`

数据挂载在 `window.HOMEWORLD_GIFT_SETS`：

```js
{
  config: {
    image: {
      prefix: "https://gi.yatta.moe/assets/UI/furnitureSuite/",
      ext: ".png"
    }
  },
  meta: { total, updatedAt, source },
  regions: ["蒙德", "璃月", "稻妻", "须弥", "枫丹", "纳塔", "挪德卡莱", "至冬"],
  sets: [
    {
      id: 1,
      key: "UI_Home_Suite_Exterior_Mond_xxx",
      name: "甜蜜小憩",
      type: "exterior",
      region: "蒙德",
      preferredCharacters: ["琴", "迪卢克"]
    }
  ]
}
```

- **key 不含扩展名**，图片 URL = `prefix + key + ext`
- **type**：`"exterior"`（室外）/ `"interior"`（室内）
- **preferredCharacters**：存角色中文名，对应 `icon-dict.js` 的 `item.name`

---

<a id="save" name="save"></a>
## 💾 存档说明

### 游逸旅闻

导出文件：`游逸旅闻存档记录-[UID]-YYYYMMDD.json`

```json
{
  "schema": "genshin-travelers-tales",
  "version": "7.1",
  "exportedAt": "20250111",
  "total": 156,
  "completed": ["迪卢克·5.4·定价", "克洛琳德·月之五·桌上剧团"]
}
```

- 记录格式统一为**三段式 key**：`角色名·版本·旅闻名`
- 本地持久化 key：`genshin_travelers_tales_completed_v2`

### 尘歌壶赠礼套装

导出文件：`赠礼套装存档记录-[UID]-YYYYMMDD.json`

```json
{
  "schema": "genshin-homeworld-gift-sets",
  "uid": "123456789",
  "exportedAt": "2026-10-20",
  "owned": ["琴", "迪卢克", "香菱"],
  "completed": {
    "UI_Home_Suite_Exterior_Mond_xxx": ["琴", "迪卢克"]
  }
}
```

- `owned`：拥有的角色名数组（自动过滤旅行者）
- `completed`：`{ setKey: [角色名] }`，**按 `set.key` 索引而不是 `set.id`**，因为 id 在编辑器里会变动
- 本地持久化 key：`genshin_homeworld_gift_sets_owned_v1` / `..._completed_v1` / `..._uid_v1`

### 编辑器草稿

| 编辑器 | 本地草稿 key |
|---|---|
| 游逸旅闻编辑器 | `genshin_travelers_tales_editor_draft_v1` |
| 赠礼套装编辑器 | `genshin_homeworld_gift_sets_editor_draft_v1` |

> [!WARNING]
> 清除浏览器数据会丢失本地记录，建议定期导出存档备份。

---

<a id="structure" name="structure"></a>
## 📁 文件结构

```text
adventurer-handbook/
├── index.html              主站外壳（Bento 网格 / hash 路由 / iframe / 主题同步，逻辑全部内联）
├── favicon.ico
├── README.md
├── CHANGELOG.md            ★ 技术约定 + 更新日志
│
└── tools/
    ├── tales/              游逸旅闻（嵌入外壳）
    ├── tales-editor/       游逸旅闻编辑器（独立页）
    ├── gift-set/           尘歌壶赠礼套装（嵌入外壳）
    └── gift-set-editor/    尘歌壶赠礼套装编辑器（独立页）
```

> 根目录只有 4 个文件。曾经的 `style.css` / `app.js` / `icons.js` 已全部合并或删除：
> 外壳逻辑内联进 `index.html`，样式由主仓库的 `home.css` 完全覆盖，四个业务图标进了 `ui-icons.js` 的 `handbook` 段。

---

<a id="deps" name="deps"></a>
## 🔗 跨仓库共享架构

本仓库不维护自己的设计系统，全部复用主仓库 [genshin-guide](https://github.com/GRILLED-TIGER-FISH-LW/genshin-guide)，通过 GitHub Pages **绝对路径**加载：

| 文件 | 来源路径 | 提供 |
|---|---|---|
| `theme.css` | `shared/css/theme.css` | 令牌 + 重置 + 应用外壳 + 排版网兜 |
| `theme-init.js` | `shared/css/theme-init.js` | 主题持久化 + 首帧防闪（**`<head>` 同步加载、无参数**） |
| `dropdown.js` | `shared/css/dropdown.js` | 下拉引擎（`window.Dropdown`，派发 `dropdown:select`） |
| `ui-icons.js` | `shared/ui-icons.js` | UI 图标（`window.ICONS`，Fluent UI 七段结构） |
| `icon-dict.js` | `shared/gi-icons/icon-dict.js` | 角色头像字典（`window.ICON_DICT`） |
| `icon-loader.js` | `shared/gi-icons/icon-loader.js` | 图标渲染器（`window.ICON_LIB`，提供 `load()` / `starColors`，仅编辑器使用） |

**为什么全部用绝对 URL**：两个仓库挂在同一个 GitHub Pages 域名下但路径不同，相对路径会因为「谁引用谁」而退错层级（历史上曾因少写一层 `/css` 导致整站白屏）。

**图标分工**：
- 界面上的按钮 / 箭头 / 关闭等 → `window.ICONS`（主仓库 `ui-icons.js`）
- 角色头像 → `window.ICON_DICT`（拼 URL）或 `window.ICON_LIB.load()`（烘成带星级渐变底的 dataURL）

> [!IMPORTANT]
> 所有外链资源必须走**带时间戳的动态加载**（`?t=Date.now()`），`theme-init.js` 是唯一例外（必须最早同步执行，不能带参数）。

---

<div align="center">

*数据来源于游戏内文本，仅供查询与记录。*

</div>
