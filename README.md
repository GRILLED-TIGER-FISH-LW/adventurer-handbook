<div align="center">

# 提瓦特冒险之证

> 《原神》游逸旅闻与尘歌壶赠礼查询及进度记录工具 · 纯前端 · 本地记录 · 不收集数据

[![在线访问](https://img.shields.io/badge/在线访问-打开网站-9E6C47?style=flat-square\&logo=googlechrome\&logoColor=white)](https://grilled-tiger-fish-lw.github.io/genshin-travelers-tales/)
[![最后更新](https://img.shields.io/github/last-commit/GRILLED-TIGER-FISH-LW/genshin-travelers-tales?style=flat-square\&label=最后更新\&color=9E6C47\&logo=github\&logoColor=white)](https://github.com/GRILLED-TIGER-FISH-LW/genshin-travelers-tales/commits)
[![Tech Stack](https://img.shields.io/badge/Tech-Vanilla%20JS%20%7C%20HTML5-F4F1EA?style=flat-square)]()

[快速开始](#start) · [功能](#features) · [数据说明](#data) · [存档说明](#save) · [文件结构](#structure) · [外部依赖](#deps)

</div>

---

<a id="start" name="start"></a>
## 🚀 快速开始

> 主页现已升级为 **Bento 网格 Dashboard**。所有子工具通过 `iframe` 动态加载，实现外壳与业务的彻底解耦。

| 入口 | 地址 | 状态 |
|---|---|---|
| 主站 (冒险之证) | [genshin-travelers-tales](https://grilled-tiger-fish-lw.github.io/genshin-travelers-tales/) | ✅ |
| 游逸旅闻 | 主站首页点击进入 `#tales` | ✅ |
| 尘歌壶赠礼 | 主站首页点击进入 `#gift-set` | 🚧 规划中 |

**本地使用**：克隆或下载仓库后，必须启动本地静态服务器（如 `python -m http.server 8080`），双击直接打开会有 CORS 跨域限制。

---

<a id="features" name="features"></a>
## ✨ 功能

### 1. 游逸旅闻
- **搜索与筛选**：按角色名 / 旅闻名模糊搜索，按版本、状态、是否隐藏进行下拉筛选。
- **完成记录**：点击卡片切换状态，右上角实时显示「已完成 X / 156」，自动存 `localStorage`。
- **存档导入导出**：可选 UID，支持导出 JSON 存档，并兼容旧版单/双段式数据格式的导入。
- **暗黑模式适配**：完全跟随主站主题，使用主仓库 `theme.css` 变量。

### 2. 尘歌壶赠礼套装（规划中）
> [!NOTE]
> 预计包含室内外套装分类，支持多角色多套装的复杂多对多进度记录。

---

<a id="data" name="data"></a>
## 📊 数据与图标系统

### 数据结构 (`tools/tales/data.js`)
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
      trigger: "",           // 触发条件
      prerequisite: "",      // 前置旅闻
      description: "..."
    }
  ]
}
```

### 图标智能处理 (`icons.js`)
- **外链代理**：使用 `wsrv.nl` 代理加载 Fandom Wiki 官方原图，绕过防盗链。
- **像素级裁切**：前端利用 Canvas 自动扫描透明像素并裁切，确保图标在容器中最大化显示，无多余白边。
- **比例精调**：首页/侧边栏与子页面顶栏采用独立的 CSS 比例适配。

---

<a id="save" name="save"></a>
## 💾 存档说明

**导出文件**：`游逸旅闻存档记录-[UID]-YYYYMMDD.json`

```json
{
  "schema": "genshin-travelers-tales",
  "version": "7.1",
  "exportedAt": "20261011",
  "total": 156,
  "completed": ["迪卢克·5.4·定价", "克洛琳德·月之五·桌上剧团"]
}
```

- 记录格式统一为**三段式 key**：`角色名·版本·旅闻名`。
- 本地持久化 key 为 `genshin_travelers_tales_completed_v2`。

> [!WARNING]
> 清除浏览器数据会丢失本地记录，建议定期导出存档备份。

---

<a id="structure" name="structure"></a>
## 📁 文件结构

```text
genshin-travelers-tales/
├── index.html          主站外壳 (提瓦特冒险之证)
├── style.css           外壳样式
├── app.js              外壳逻辑 (路由 / iframe / 主题)
├── icons.js            本地业务图标字典
├── data.js
├── README.md
├── CHANGELOG.md
└── tools/              所有子应用
    ├── tales/          游逸旅闻
    │   ├── index.html
    │   ├── style.css
    │   ├── app.js
    │   └── data.js
    └── gift-set/       尘歌壶赠礼 (规划中)
```

---

<a id="deps" name="deps"></a>
## 🔗 跨仓库共享架构

本仓库复用主仓库 [genshin-guide](https://github.com/GRILLED-TIGER-FISH-LW/genshin-guide) 的底层 UI 体系，通过 GitHub Pages 绝对路径加载：

| 文件 | 来源 | 用途 |
|---|---|---|
| `theme.css` | `genshin-guide/shared/` | 2026 现代主题变量 + 控件 |
| `ui-icons.js` | `genshin-guide/shared/` | 通用系统图标库 (`window.ICONS`) |
| `icon-dict.js` | `genshin-guide/shared/gi-icons/` | 角色头像字典 (`window.ICON_DICT`) |

> [!IMPORTANT]
> 所有资源必须通过带时间戳的动态加载器加载，彻底杜绝浏览器缓存，并防止 Promise 死锁。

---

<div align="center">

*数据来源于游戏内文本，仅供查询与记录。*

</div>
