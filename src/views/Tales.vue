<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Delete, Download, Refresh, Search, Upload } from '@element-plus/icons-vue'
import { useToast } from '../composables/useToast.js'
import { loadGlobalScript, loadTalesData } from '../composables/useData.js'

const STORAGE_KEY = 'genshin_travelers_tales_completed_v2'
const LEGACY_KEY = 'genshin_travelers_tales_completed_v1'
const UID_KEY = 'genshin_travelers_tales_uid_v1'

const IMAGE_DICT_URL =
  'https://grilled-tiger-fish-lw.github.io/genshin-guide/shared/image-dict.js'

const toast = useToast()

const loading = ref(true)
const errorMsg = ref('')
const total = ref(0)

const display = ref([])
const versions = ref([])
const meta = ref({})
let entries = []
let orderMap = new Map()
let versionIndex = new Map()
const avatarCache = new Map()

const search = ref('')
const version = ref('all')
const status = ref('all')
const visibility = ref('all')
const uid = ref('')
const done = reactive(new Set())

const entryKey = (e) => `${e.character || ''}·${e.version || ''}·${e.title || ''}`
const cleanText = (s) => String(s ?? '').replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim()

function buildAvatarCache(dict) {
  const cfg = dict?.config?.characters
  if (!dict?.characters || !cfg) return
  for (const key in dict.characters) {
    const item = dict.characters[key]
    if (!item?.name || item.order === 1) continue
    avatarCache.set(
      item.name,
      item.url
        ? item.url
        : key.endsWith('.webp')
          ? cfg.prefix + key
          : cfg.prefix + key + cfg.ext,
    )
  }
}

function buildOrderMap(dict) {
  const m = new Map()
  if (dict?.characters) {
    for (const key in dict.characters) {
      const item = dict.characters[key]
      if (item?.name && item.order !== 1) m.set(item.name, typeof item.order === 'number' ? item.order : 9999)
    }
  }
  return m
}

function loadDone() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr)
      ? arr.filter((s) => typeof s === 'string' && s.split('·').length === 3)
      : []
  } catch {
    return []
  }
}

function saveDone() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]))
  } catch {}
}

const versionOptions = computed(() => [
  { value: 'all', label: '全部版本' },
  ...versions.value.map((v) => ({ value: v, label: v })),
])
const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'done', label: '已完成' },
  { value: 'undone', label: '未完成' },
]
const visibilityOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'normal', label: '正常' },
  { value: 'hidden', label: '隐藏' },
]

const rows = computed(() => {
  const kw = search.value.trim().toLowerCase()
  const out = []

  for (const e of display.value) {
    if (version.value !== 'all' && e.version !== version.value) continue

    const key = entryKey(e)
    const isDone = done.has(key)

    if (status.value === 'done' && !isDone) continue
    if (status.value === 'undone' && isDone) continue
    if (visibility.value === 'normal' && e.hidden) continue
    if (visibility.value === 'hidden' && !e.hidden) continue
    if (
      kw &&
      !(e.character || '').toLowerCase().includes(kw) &&
      !(e.title || '').toLowerCase().includes(kw)
    )
      continue

    const metas = []
    if (e.location && e.location.trim())
      metas.push({ id: 'loc', label: '地点', value: cleanText(e.location) })
    if (e.trigger && e.trigger.trim())
      metas.push({ id: 'trig', label: '触发条件', value: cleanText(e.trigger) })
    if (e.prerequisite && e.prerequisite.trim())
      metas.push({ id: 'prereq', label: '前置旅闻', value: cleanText(e.prerequisite) })

    out.push({
      e,
      key,
      isDone,
      metas,
      avatar: avatarCache.get(e.character) || '',
      initial: (e.character || '?').charAt(0),
      desc: e.description && e.description.trim() ? e.description : '',
    })
  }
  return out
})

function toggle(row) {
  if (row.isDone) done.delete(row.key)
  else done.add(row.key)
  saveDone()
}

function exportArchive() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate(),
  ).padStart(2, '0')}`
  const payload = {
    schema: 'genshin-travelers-tales',
    version: meta.value.version || '',
    exportedAt: ymd,
    total: total.value,
    completed: [...done].sort(),
  }
  const filename = uid.value
    ? `游逸旅闻存档记录-${uid.value}-${ymd}.json`
    : `游逸旅闻存档记录-${ymd}.json`

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  toast.success(`已导出 ${done.size} 条记录`)
}

const fileInput = ref(null)

function onImportFile(ev) {
  const file = ev.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const json = JSON.parse(reader.result)
      const list = Array.isArray(json) ? json : json.completed || []

      const idToKey = new Map()
      const twoPart = new Map()
      entries.forEach((e) => {
        const k3 = entryKey(e)
        idToKey.set(e.id, k3)
        const k2 = `${e.character || ''}·${e.title || ''}`
        if (!twoPart.has(k2)) twoPart.set(k2, [])
        twoPart.get(k2).push(k3)
      })

      const next = new Set()
      list.forEach((item) => {
        if (typeof item === 'string') {
          const parts = item.split('·')
          if (parts.length === 3) next.add(item)
          else if (parts.length === 2) twoPart.get(item)?.forEach((k) => next.add(k))
        } else if (typeof item === 'number') {
          const k = idToKey.get(item)
          if (k) next.add(k)
        }
      })

      done.clear()
      next.forEach((k) => done.add(k))
      saveDone()
      toast.success('存档导入成功')
    } catch {
      toast.error('导入失败：文件格式不正确')
    }
    ev.target.value = ''
  }
  reader.readAsText(file)
}

const listRef = ref(null)

function clearFilters() {
  search.value = ''
  version.value = 'all'
  status.value = 'all'
  visibility.value = 'all'
}

/* 120 行不能每行都占一个 Tab 位：容器是唯一 Tab 停靠点，方向键在行间移动 */
function moveRow(delta) {
  const list = [...(listRef.value?.querySelectorAll('.ah-tales__row-body') || [])]
  if (!list.length) return
  /* 焦点可能在行内的 checkbox 上，先往上找到行容器 */
  const current = document.activeElement?.closest?.('.ah-tales__row-body')
  const from = list.indexOf(current) < 0
    ? (delta > 0 ? -1 : list.length)
    : list.indexOf(current)
  const next = Math.max(0, Math.min(list.length - 1, from + delta))
  ;(list[next] || listRef.value).focus()
}

function confirmClear() {
  if (done.size === 0) {
    toast.show('暂无已完成的旅闻')
    return
  }
  ElMessageBox.confirm(
    `确定清空所有完成标记吗？共 ${done.size} 条。建议先导出存档备份进度，清空后无法恢复。`,
    '清空完成记录',
    {
      confirmButtonText: '确认清空',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
      type: 'warning',
    },
  )
    .then(doClear)
    .catch(() => {})
}

function doClear() {
  done.clear()
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_KEY)
  } catch {}
  toast.success('已清空完成记录')
}

function onUidInput(val) {
  const cleaned = val.replace(/\D/g, '').slice(0, 15)
  uid.value = cleaned
  try {
    if (cleaned) localStorage.setItem(UID_KEY, cleaned)
    else localStorage.removeItem(UID_KEY)
  } catch {}
}

onMounted(async () => {
  try {
    const data = await loadTalesData()
    const dict = await loadGlobalScript(IMAGE_DICT_URL, 'IMAGE_DICT').catch(() => null)

    if (!data || !Array.isArray(data.entries)) throw new Error('data.js 内容无效')

    entries = data.entries
    meta.value = data.meta || {}
    versions.value = Array.isArray(data.versions) ? data.versions : []
    total.value = meta.value.total || entries.length

    orderMap = buildOrderMap(dict)
    versions.value.forEach((v, i) => versionIndex.set(v, i))

    display.value = entries.slice().sort((a, b) => {
      const oa = orderMap.has(a.character) ? orderMap.get(a.character) : 9999
      const ob = orderMap.has(b.character) ? orderMap.get(b.character) : 9999
      if (oa !== ob) return oa - ob
      const va = versionIndex.has(a.version) ? versionIndex.get(a.version) : 9999
      const vb = versionIndex.has(b.version) ? versionIndex.get(b.version) : 9999
      if (va !== vb) return va - vb
      return (a.id || 0) - (b.id || 0)
    })

    if (dict) buildAvatarCache(dict)

    loadDone().forEach((k) => done.add(k))

    const valid = new Set(entries.map(entryKey))
    let dirty = false
    ;[...done].forEach((k) => {
      if (!valid.has(k)) {
        done.delete(k)
        dirty = true
      }
    })
    if (dirty) saveDone()

    try {
      uid.value = localStorage.getItem(UID_KEY) || ''
    } catch {
      uid.value = ''
    }

    loading.value = false
  } catch (e) {
    errorMsg.value = e?.message || '未知错误'
    loading.value = false
  }
})
</script>

<template>
  <div class="grid h-full grid-rows-[auto_minmax(0,1fr)_auto]">
    <header class="grid gap-2 border-b border-line bg-canvas p-2">
      <div class="flex items-center gap-2">
        <el-input
          v-model="search"
          aria-label="搜索角色名或旅闻名"
          placeholder="搜索角色名 / 旅闻名"
          clearable
          class="min-w-0 ah-tales__search"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-tag class="ah-tales__summary">
          <span>已完成&nbsp;</span>
          <span class="tabular-nums">{{ done.size }}</span>
          <span aria-hidden="true">/</span>
          <span class="tabular-nums">{{ total }}</span>
        </el-tag>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <el-select v-model="version" placeholder="版本" class="w-full">
          <el-option v-for="o in versionOptions" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-select v-model="status" placeholder="状态" class="w-full">
          <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-select v-model="visibility" placeholder="类型" class="w-full">
          <el-option v-for="o in visibilityOptions" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
      </div>

      <div class="flex items-center gap-2">
        <el-input
          v-model="uid"
          aria-label="UID"
          placeholder="UID"
          class="ah-tales__uid shrink-0"
          @input="onUidInput"
        />
        <div class="flex flex-1 justify-end gap-2">
          <el-button size="small" @click="exportArchive">
            <el-icon><Download /></el-icon>
            <span>导出</span>
          </el-button>
          <el-button size="small" @click="fileInput?.click()">
            <el-icon><Upload /></el-icon>
            <span>导入</span>
          </el-button>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept=".json,application/json"
          class="hidden"
          @change="onImportFile"
        />
      </div>
    </header>

    <div class="min-h-0 overflow-y-auto p-2">
      <div v-if="loading" class="p-3 text-sm text-muted">正在加载旅闻数据…</div>

      <div v-else-if="errorMsg" class="grid justify-items-center gap-3 p-8 text-center">
        <p class="text-sm font-semibold text-danger">数据加载失败</p>
        <p class="text-xs text-muted">{{ errorMsg }}</p>
        <el-button size="small" @click="() => location.reload()">
          <el-icon><Refresh /></el-icon>
          <span>重新加载</span>
        </el-button>
      </div>

      <el-empty v-else-if="!rows.length" description="没有找到匹配的旅闻">
        <el-button size="small" @click="clearFilters">清除筛选条件</el-button>
      </el-empty>

      <div
        v-else
        ref="listRef"
        tabindex="0"
        class="grid gap-2"
        @keydown.down.prevent="moveRow(1)"
        @keydown.up.prevent="moveRow(-1)"
      >
        <el-card v-for="row in rows" :key="row.key" shadow="never" class="ah-tales__row">
          <div
            class="ah-tales__row-body grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1"
            tabindex="-1"
            role="button"
            :aria-pressed="row.isDone"
            :aria-label="`${row.e.character} ${row.e.version} ${row.e.title}`"
            :class="row.isDone ? 'opacity-70' : ''"
            @keydown.enter.prevent="toggle(row)"
            @keydown.space.prevent="toggle(row)"
          >
          <div
            class="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-ctl bg-thumb text-sm font-semibold text-muted"
          >
            <span aria-hidden="true">{{ row.initial }}</span>
            <img
              v-if="row.avatar"
              :src="row.avatar"
              alt=""
              loading="lazy"
              class="absolute inset-0 size-full object-cover"
              @error="(ev) => ev.target.remove()"
            />
          </div>

          <div class="flex min-w-0 items-center gap-2">
            <span class="shrink-0 text-sm font-medium text-ink">{{ row.e.character }}</span>
            <el-tag v-if="row.e.hidden" type="danger" size="small" effect="plain">隐藏</el-tag>
            <el-tag class="ah-tales__version" size="small" effect="plain" type="primary">
              {{ row.e.version }}
            </el-tag>
            <span
              class="min-w-0 truncate text-sm"
              :class="row.e.hidden ? 'text-danger' : 'text-body'"
            >
              {{ row.e.title }}
            </span>
          </div>

          <el-checkbox
            class="ah-tales__row-check"
            :model-value="row.isDone"
            @change="toggle(row)"
            aria-hidden="true"
          />

          <div v-if="row.metas.length" class="col-span-3 grid gap-1">
            <div
              v-for="m in row.metas"
              :key="m.id"
              class="flex min-w-0 items-center gap-2 text-caption"
            >
              <span class="shrink-0 text-muted">{{ m.label }}</span>
              <span class="min-w-0 text-gold">{{ m.value }}</span>
            </div>
          </div>

          <div v-if="row.desc" class="col-span-3 text-body-sm text-muted">
            {{ row.desc }}
          </div>
        </div>
        </el-card>
      </div>
    </div>

    <div class="border-t border-line bg-canvas p-2 safe-bottom">
      <el-button type="danger" class="w-full" size="small" @click="confirmClear">
        <el-icon><Delete /></el-icon>
        <span>清空全部记录</span>
      </el-button>
    </div>

  </div>
</template>

<style scoped>
/* 卡片体不要内边距：按钮自己撑满整张卡 */
.ah-tales__row {
  --el-card-padding: 0;
}

.ah-tales__row-body {
  padding: 12px;
}

/* 整列只有容器一个 Tab 位：checkbox 是装饰，不单独占 Tab、也不进无障碍树 */
.ah-tales__row-check :deep(input) {
  tab-index: -1;
}

.ah-tales__row-body:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.ah-tales__version {
  margin-right: 4px;
}

.ah-tales__summary {
  --el-tag-bg-color: var(--color-accent-soft);
  --el-tag-border-color: transparent;
  --el-tag-text-color: var(--color-accent-strong);
  flex: none;
  margin-left: auto;
  height: var(--el-input-height, 32px);
  padding: 0 8px;
  white-space: nowrap;
}

/* 搜索框右边缘对齐第二个下拉框的右边缘 = 2 个下拉框宽 + 中间那条 8px 缝
   一个下拉框 = (100% - 16px) / 3（下面那行 3 个 el-select 是 grid-cols-3 gap-2，两条缝各 8px）
   注意：不能写 Tailwind 的 w-* —— EP 的 CSS 不带 @layer，非分层会盖掉 @layer utilities */
.ah-tales__search {
  flex: 1 1 0;
  min-width: 0;
  max-width: calc((100% - 16px) / 3 * 2 + 8px);
}

.ah-tales__uid {
  width: calc((100% - 16px) / 3);
  flex: none;
}
</style>
