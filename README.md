<div align="center">

# 提瓦特冒险之证

> 《原神》游逸旅闻与尘歌壶赠礼查询及进度记录工具 · 纯前端 · 本地记录 · 不收集数据

[![在线访问](https://img.shields.io/badge/在线访问-打开网站-9E6C47?style=flat-square&logo=googlechrome&logoColor=white)](https://grilled-tiger-fish-lw.github.io/adventurer-handbook/)
[![最后更新](https://img.shields.io/github/last-commit/GRILLED-TIGER-FISH-LW/adventurer-handbook?style=flat-square&label=最后更新&color=9E6C47&logo=github&logoColor=white)](https://github.com/GRILLED-TIGER-FISH-LW/adventurer-handbook/commits)
[![Tech Stack](https://img.shields.io/badge/Tech-Vanilla%20JS%20%7C%20HTML5-F4F1EA?style=flat-square)]()

[快速开始](#start) · [功能](#features) · [数据说明](#data) · [存档说明](#save) · [文件结构](#structure) · [外部依赖](#deps)

</div>

---

<a id="start" name="start"></a>
## 🚀 快速开始

> 主页为 **Bento 网格 Dashboard**。所有子工具通过 `iframe` 动态加载，实现外壳与业务的彻底解耦。编辑器为独立工具页，不嵌入外壳。

| 入口 | 访问链接 | 状态 |
|---|---|---|
| 主站（冒险之证） | [打开首页](https://grilled-tiger-fish-lw.github.io/adventurer-handbook/) | ✅ |
| 游逸旅闻 | [#tales](https://grilled-tiger-fish-lw.github.io/adventurer-handbook/#tales) | ✅ |
| 游逸旅闻编辑器 | [#tales-editor](https://grilled-tiger-fish-lw.github.io/adventurer-handbook/tools/tales-editor/) | ✅ |
| 尘歌壶赠礼套装 | [#gift-set](https://grilled-tiger-fish-lw.github.io/adventurer-handbook/#gift-set) | ✅ |
| 尘歌壶赠礼套装编辑器 | [#gift-set-editor](https://grilled-tiger-fish-lw.github.io/adventurer-handbook/tools/gift-set-editor/) | ✅ |

**本地使用**：克隆或下载仓库后，必须启动本地静态服务器（如 `python -m http.server 8080`），双击直接打开会有 CORS 跨域限制。

---

<a id="features" name="features"></a>
## ✨ 功能

### 1. 游逸旅闻
- **搜索与筛选**：按角色名 / 旅闻名模糊搜索，按版本、状态、是否隐藏进行下拉筛选。
- **完成记录**：点击卡片切换状态，右上角实时显示「已完成 X / 156」，自动存 `localStorage`。
- **存档导入导出**：可选 UID，支持导出 JSON 存档，并兼容旧版单/双段式数据格式的导入。
- **暗黑模式适配**：完全跟随主站主题，使用主仓库 `theme.css` 变量。

### 2. 游逸旅闻编辑器
> 独立工具页：[#tales-editor](https://grilled-tiger-fish-lw.github.io/adventurer-handbook/tools/tales-editor/)

- **双栏编辑**：左侧列表（头像 + 标题 + 角色·版本），右侧表单实时编辑。
- **头像自动匹配**：读 `window.ICON_DICT`，按 `prefix + key + ext` 或 `item.url` 拼装，无需手动填图。
- **Combobox 联想**：版本 / 角色名支持打字筛选，输入新值即新建条目，无需先维护列表。
- **id 管理**：手动改（实时检测重复标红）、上下移动（± 1，冲突时交换）、一键按显示顺序重排。
- **导出前校验**：缺角色 / 缺版本 / 缺标题 / id 重复 / 版本不在 `versions` 列表，共 5 类问题提示。
- **草稿自动恢复**：`localStorage` 400ms debounce 保存，刷新不丢；导出成功后自动清空草稿。
- **导出格式**：与主站 `tools/tales/data.js` 完全兼容，先版本分组、再按角色 order 排序。

### 3. 尘歌壶赠礼套装
> 子页面：[#gift-set](https://grilled-tiger-fish-lw.github.io/adventurer-handbook/#gift-set)

- **我的角色**：54px 卡片 / 40px 头像的网格，手机一行 6 个。已拥有角色按星级色背景（4 星紫 / 5 星金），未拥有灰化 35%。按 `order` 倒序排列（最新实装角色在前），排除旅行者。可折叠，默认在有 owned 数据时折叠。
- **推荐套装**：按「已有但未完成角色数（pending）」降序 → 「owned/total 比例」降序 → `id` 升序，截取前 5 个。点击卡片自动清空筛选并滚动定位到全部套装对应卡片。
- **全部套装**：单列手风琴。每个卡片显示 2:1 缩略图（56×28）+ 名称 + 地区·类型 + 进度（`已完成 X/Y` / `未拥有角色` / `已完成`）。展开后显示偏好角色格（40px 头像 + 星级色背景），点击切换完成状态。
- **完成判定**：方案 B（拥有且完成所有拥有角色）。套装中一个角色都没拥有时视为「未完成」。
- **搜索与筛选**：搜索套装名 / 角色名，筛选按地区、室内外下拉（对齐 tales 的下拉面板样式）。
- **存档**：可选 UID，`赠礼套装存档记录-[UID]-YYYYMMDD.json`，包含 `owned` 和 `completed` 两份数据。兼容旧版（自动过滤旅行者、清理孤儿套装）。
- **暗黑模式适配**：跟随主站主题，iframe 场景下自身主题按钮自动隐藏，通过 `postMessage` 同步。

### 4. 尘歌壶赠礼套装编辑器
> 独立工具页：[#gift-set-editor](https://grilled-tiger-fish-lw.github.io/adventurer-handbook/tools/gift-set-editor/)

- **URL 智能识别**：粘贴任意域名下的套装图直链，自动截取文件名作为 `key`（忽略查询参数、去掉扩展名）。
- **类型 / 地区自动推断**：识别 key 时，`Exterior` → 室外、`Interior` → 室内；`Mond` / `Liyue` / `Dq` / `Xm` / `Fd` / `Nt` / `Ndkl` / `Zd` → 对应地区。key 变化才推断，用户手动改动不被覆盖。
- **偏好角色批量输入**：chips 展示 + combobox 追加 + × 删除。支持逗号 / 空格 / 顿号 / 分号分隔的批量粘贴。
- **id 管理**：手动改（实时检测重复标红）、上下移动（± 1，冲突时交换）、一键按显示顺序重排。
- **导出前校验**：id 重复 / 缺 key / 缺名称 / 缺地区 / 类型非法，共 5 类问题提示。
- **草稿自动恢复**：`localStorage` 400ms debounce 保存，刷新不丢；导出成功后自动清空草稿。

---

<a id="data" name="data"></a>
## 📊 数据与图标系统

### 游逸旅闻 (`tools/tales/data.js`)

数据全量挂载在 `window.TRAVELERS_TALES`：
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

### 尘歌壶赠礼套装 (`tools/gift-set/data.js`)

数据全量挂载在 `window.HOMEWORLD_GIFT_SETS`：
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

- **key 不含扩展名**：图片 URL = `config.image.prefix + key + config.image.ext`
- **type**：`"exterior"`（室外）/ `"interior"`（室内）
- **preferredCharacters**：存角色中文名，对应 `icon-dict.js` 的 `name`

### 图标系统（三套并存）

| 用途 | 来源 | 加载方式 |
|---|---|---|
| **业务图标**（按钮 / 系统 UI） | `genshin-guide/shared/ui-icons.js` → `window.ICONS` | Phosphor 图标库，`viewBox="0 0 256 256"`，`fill="currentColor"` 跟随主题 |
| **角色头像字典** | `genshin-guide/shared/gi-icons/icon-dict.js` → `window.ICON_DICT` | `config.characters.prefix` = `https://api.lunaris.moe/data/assets/avataricon/`，前端按 `prefix + key + ext` 或 `item.url` 拼装 |
| **本地业务图标** | 本仓库 `icons.js` → `window.LOCAL_ICONS` | `tales` / `talesBold` / `gift-set` / `gift-setBold`，全部内联 Phosphor SVG |
| **图标渲染器** | `genshin-guide/shared/gi-icons/icon-loader.js` → `window.ICON_LIB` | 提供 `getPath()`、`load()`、`starColors`（1~5 星颜色映射）。**仅编辑器使用**，用户页直接读 `icon-dict.js` 头像 URL，不调用 Canvas |

**编辑器兜底图标**：`ui-icons.js` 中缺失的 `reload` / `reorder` / `back` / `file`，在两个编辑器的 `app.js` 顶部 `FALLBACK_ICONS` 内嵌，通过 `resolveIcon(key)` 按 `ICONS[key] ?? FALLBACK_ICONS[key]` 兜底。

**星级色**（gift-set 用户页头像背景）：来自 `icon-loader.js` 的 `STAR_COLORS`，4 星 `#9174A9`（紫）/ 5 星 `#DCA454`（金）。

---

<a id="save" name="save"></a>
## 💾 存档说明

### 游逸旅闻

**导出文件**：`游逸旅闻存档记录-[UID]-YYYYMMDD.json`

```json
{
  "schema": "genshin-travelers-tales",
  "version": "7.1",
  "exportedAt": "20250111",
  "total": 156,
  "completed": ["迪卢克·5.4·定价", "克洛琳德·月之五·桌上剧团"]
}
```

- 记录格式统一为**三段式 key**：`角色名·版本·旅闻名`。
- 本地持久化 key 为 `genshin_travelers_tales_completed_v2`。

### 尘歌壶赠礼套装

**导出文件**：`赠礼套装存档记录-[UID]-YYYYMMDD.json`

```json
{
  "schema": "genshin-homeworld-gift-sets",
  "uid": "123456789",
  "exportedAt": "2026-10-20",
  "owned": ["琴", "迪卢克", "香菱"],
  "completed": {
    "UI_Home_Suite_Exterior_Mond_xxx": ["琴", "迪卢克"],
    "UI_Home_Suite_Exterior_Liyue_yyy": ["琴"]
  }
}
```

- `owned`：拥有的角色名数组（自动过滤旅行者）。
- `completed`：`{ setKey: [角色名] }`，按 `set.key` 索引（不用 `set.id`，因为 id 在编辑器里可能变动）。
- 本地持久化 key 为 `genshin_homeworld_gift_sets_owned_v1` / `genshin_homeworld_gift_sets_completed_v1` / `genshin_homeworld_gift_sets_uid_v1`。

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
├── index.html              主站外壳 (提瓦特冒险之证)
├── style.css               外壳样式
├── app.js                  外壳逻辑 (路由 / iframe / 主题)
├── icons.js                本地业务图标字典 (内联 Phosphor SVG)
├── data.js
├── README.md
├── CHANGELOG.md
└── tools/                  所有子应用
    ├── tales/              游逸旅闻
    │   ├── index.html
    │   ├── style.css
    │   ├── app.js
    │   └── data.js
    ├── tales-editor/       游逸旅闻编辑器（独立工具页）
    │   ├── index.html
    │   ├── style.css
    │   └── app.js
    ├── gift-set/           尘歌壶赠礼套装
    │   ├── index.html
    │   ├── style.css
    │   ├── app.js
    │   └── data.js
    └── gift-set-editor/    尘歌壶赠礼套装编辑器（独立工具页）
        ├── index.html
        ├── style.css
        └── app.js
```

---

<a id="deps" name="deps"></a>
## 🔗 跨仓库共享架构

本仓库复用主仓库 [genshin-guide](https://github.com/GRILLED-TIGER-FISH-LW/genshin-guide) 的底层 UI 体系，通过 GitHub Pages 绝对路径加载：

| 文件 | 来源 | 用途 |
|---|---|---|
| `theme.css` | `genshin-guide/shared/` | 2026 现代主题变量 + 通用控件 |
| `ui-icons.js` | `genshin-guide/shared/` | 通用系统图标库（`window.ICONS`，Phosphor） |
| `icon-dict.js` | `genshin-guide/shared/gi-icons/` | 角色头像字典（`window.ICON_DICT`） |
| `icon-loader.js` | `genshin-guide/shared/gi-icons/` | 图标渲染器（`window.ICON_LIB`，仅编辑器使用） |

> [!IMPORTANT]
> 所有资源必须通过带时间戳的动态加载器加载（`?t=Date.now()`），彻底杜绝浏览器缓存，并防止 Promise 死锁。两个编辑器、tales 子页、gift-set 子页共用同一套 `loadStyle` / `loadScript` 写法。

---

<div align="center">

*数据来源于游戏内文本，仅供查询与记录。*

</div>
