# 原神 · 游逸旅闻

《原神》游逸旅闻查询与进度记录工具。

支持搜索、版本筛选、完成状态筛选、勾选记录、导出 / 导入存档。

🔗 在线访问：https://grilled-tiger-fish-lw.github.io/genshin-travelers-tales/

📦 仓库地址：https://github.com/GRILLED-TIGER-FISH-LW/genshin-travelers-tales

> 若在线访问打不开，请到仓库 Settings → Pages 开启 Pages，Source 选 `main` 分支根目录。

---

## 文件结构

```
genshin-travelers-tales/
├── index.html          主页面
├── index.css
├── index.js
├── data.js             数据字典
├── README.md
└── editor/             编辑器（规划中）
    ├── index.html
    ├── index.css
    └── index.js
```

---

## 快速开始

**在线使用**：直接访问 https://grilled-tiger-fish-lw.github.io/genshin-travelers-tales/

**本地使用**：克隆或下载仓库后，双击 `index.html` 即可。

```bash
git clone https://github.com/GRILLED-TIGER-FISH-LW/genshin-travelers-tales.git
```

依赖 `shared/theme.css` 和 `shared/gi-icons/icon-dict.js`，来自另一个仓库，默认走 jsDelivr：

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/GRILLED-TIGER-FISH-LW/genshin-guide@main/shared/theme.css">
<script src="https://cdn.jsdelivr.net/gh/GRILLED-TIGER-FISH-LW/genshin-guide@main/shared/gi-icons/icon-dict.js"></script>
```

---

## 功能

- 搜索：角色名 / 旅闻名模糊匹配
- 筛选：版本、完成状态
- 计数：右上角「已完成 X / 156」
- 勾选：点击卡片切换完成状态，自动存 localStorage
- 导出：`游逸旅闻存档记录-YYYYMMDD.json`（仅 id 数组）
- 导入：读取 JSON 恢复勾选
- 深色模式：跟随系统 / 手动切换
- 响应式：桌面 + 移动端

隐藏条目：旅闻名红色 + 红点（判定依据为「触发条件」字段非空）。

---

## 数据说明

数据在 `data.js`，挂载到 `window.TRAVELERS_TALES`。

```js
{
  meta: { version, total, updatedAt, source },
  versions: ["5.4", "5.7", "月之一", ...],   // 筛选下拉顺序
  entries: [
    {
      id: 1,
      character: "迪卢克",   // 主角色，用于匹配头像
      version: "5.4",
      title: "定价",         // 旅闻名
      hidden: false,
      location: "蒙德-晨曦酒庄",
      trigger: "",           // 触发条件，非空即隐藏
      prerequisite: "",      // 前置 / 说明
      extra: "",             // 额外出场角色（前端不展示）
      description: "..."
    }
  ]
}
```

空字段不渲染。新增版本时记得同步 `versions` 数组和 `meta.total`。

---

## 存档

**导出**：`游逸旅闻存档记录-YYYYMMDD.json`

```json
{
  "schema": "genshin-travelers-tales",
  "version": "7.1",
  "exportedAt": "20261011",
  "total": 156,
  "completed": [1, 3, 4, 5]
}
```

**导入**：兼容纯数组 `[1,3,4]` 和对象 `{completed:[...]}`。越界 id 忽略，导入覆盖本地记录。

> 清除浏览器数据会丢失本地记录，请及时导出。

---

## 编辑器（规划中）

独立页面 `editor/`，用于维护 `data.js`。

**流程**：导入 `data.js` → 在线编辑 → 导出新 `data.js` → 手动上传覆盖仓库。

**计划功能**：条目列表 / 表单编辑 / 新增删除 / 校验 / 导入导出。

---

## 维护笔记

更新数据时：

1. 追加条目到 `entries`，`id` 递增
2. 同步 `meta.total`
3. 新版本号加入 `versions`
4. 更新 `meta.updatedAt`

新角色若字典缺头像，会显示角色名首字占位，需到 `icon-dict.js` 补充。

---

## 许可

数据来源：原神游逸旅闻社区整理。仅供学习与个人进度记录使用。
