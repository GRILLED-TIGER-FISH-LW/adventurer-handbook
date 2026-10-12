# 原神 · 游逸旅闻

《原神》游逸旅闻查询与进度记录工具。

- 🔗 **主站**：https://grilled-tiger-fish-lw.github.io/genshin-travelers-tales/
- 🛠️ **编辑器**：https://grilled-tiger-fish-lw.github.io/genshin-travelers-tales/editor/（规划中）
- 📦 **仓库**：https://github.com/GRILLED-TIGER-FISH-LW/genshin-travelers-tales

---

## 文件结构

```
genshin-travelers-tales/
├── index.html          主站
├── index.css
├── index.js
├── data.js             数据字典（156 条）
├── README.md
├── CHANGELOG.md
└── editor/             编辑器（规划中）
    ├── index.html
    ├── index.css
    └── index.js
```

---

## 快速开始

**在线使用**

- 主站：https://grilled-tiger-fish-lw.github.io/genshin-travelers-tales/
- 编辑器：https://grilled-tiger-fish-lw.github.io/genshin-travelers-tales/editor/（规划中）

**本地使用**：克隆或下载仓库后，双击 `index.html` 打开。

跨仓库依赖 `shared/theme.css`、`shared/ui-icons.js`、`shared/gi-icons/icon-dict.js`（来自 `GRILLED-TIGER-FISH-LW/genshin-guide`），通过 GitHub Pages 外链加载，需联网。

---

## 功能

### 主站

- **搜索**：按「角色名」或「旅闻名」模糊匹配
- **筛选**：版本 / 完成状态 / 显示类型（正常 / 隐藏）
- **完成计数**：右上角显示「已完成 X / 156」
- **勾选记录**：点击卡片切换完成状态，自动存 localStorage
- **UID 输入**：可选，用于存档文件名
- **导出存档**：`游逸旅闻存档记录-[UID-]YYYYMMDD.json`
- **导入存档**：恢复勾选，兼容旧格式
- **清空记录**：一键清空所有完成标记（二次确认，提示先备份）
- **主题**：跟随系统 / 手动切换，浅色 / 深色
- **响应式**：桌面 + 移动端

隐藏旅闻：旅闻名红色加粗（判定依据为「触发条件」字段非空）。

### 编辑器（规划中）

- 独立页面 `editor/`，用于维护 `data.js`
- 计划支持：导入 / 导出 `data.js`、条目增删改、角色名 / 版本联想、一键重排 ID

---

## 数据说明

数据在 `data.js`，挂载到 `window.TRAVELERS_TALES`。

```js
{
  meta: { version, total, updatedAt, source },
  versions: ["5.4", "5.7", "月之一", ...],
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

**排序**：字典物理顺序为「先版本、后角色（按 `icon-dict` order 升序）」；主站显示顺序为「先角色、后版本」（运行时排序）。

**空字段不渲染。** 新增版本时需同步 `versions` 数组和 `meta.total`。

### 头像

主站运行时从 `window.ICON_DICT` 反查角色头像 URL，只匹配**主角色**。

---

## 存档说明

**导出文件**：`游逸旅闻存档记录-[UID-]YYYYMMDD.json`

```json
{
  "schema": "genshin-travelers-tales",
  "version": "7.1",
  "exportedAt": "20261011",
  "total": 156,
  "completed": ["迪卢克·5.4·定价", "克洛琳德·月之五·桌上剧团"]
}
```

- 记录格式：`角色名·版本·旅闻名`（三段式 key）
- 不含头像、不含文本
- 无 UID 时文件名为 `游逸旅闻存档记录-YYYYMMDD.json`

**导入兼容**：
- 三段式字符串 → 直接匹配
- 两段式字符串（旧版）→ 匹配所有同名条目
- 数字（更旧版）→ 按 id 反查

**本地持久化**：key 为 `genshin_travelers_tales_completed_v2`，值为字符串数组。每次勾选自动保存。

> 清除浏览器数据会丢失本地记录，建议定期导出存档备份。

---

## 外部依赖

| 文件 | 来源 | 用途 |
|---|---|---|
| `theme.css` | `genshin-guide/shared/` | 主题变量 + 通用控件 |
| `ui-icons.js` | `genshin-guide/shared/` | 通用图标库（`window.ICONS`） |
| `icon-dict.js` | `genshin-guide/shared/gi-icons/` | 角色头像字典（`window.ICON_DICT`） |

加载方式：`index.html` 内联启动器，**6 个资源并行下载，全部带时间戳**。
