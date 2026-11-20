<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  ArrowDown,
  ArrowUp,
  Back,
  Delete,
  Download,
  Plus,
  Refresh,
  Search,
  Sort,
  Upload,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { loadGlobalScript } from '../composables/useData.js'
import { IMAGE_DICT_URL } from '../config.js'

const DRAFT_KEY = 'genshin_travelers_tales_editor_draft_v1'
const DATA_URL = 'data/tales.js'
const FILE_NAME = DATA_URL.split('/').pop()


/* ---------- 状态 ---------- */
const loading = ref(true)
const data = ref(null)
const selectedId = ref(null)
const isNew = ref(false)
const search = ref('')
const versionFilter = ref('all')
const visibilityFilter = ref('all')
const dirty = ref(false)
/* 窄屏当前显示哪一栏：'list' | 'form' */
const mobilePane = ref('list')

const idInput = ref('')
const charList = ref([])
const avatarMap = reactive(new Map())
const orderMap = new Map()

const fileInput = ref(null)

const reloadOpen = ref(false)
const deleteOpen = ref(false)
const renumberOpen = ref(false)
const exportOpen = ref(false)
const warnings = ref([])

/* ---------- 工具 ---------- */
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

const escJs = (str) =>
  String(str ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/\t/g, '\\t')

const avatarUrl = (name) => avatarMap.get(name) || ''

/* ---------- 派生 ---------- */
const entryCount = computed(() => data.value?.entries.length ?? 0)

const versionOptions = computed(() => [
  { value: 'all', label: '全部版本' },
  ...(data.value?.versions || []).map((v) => ({ value: v, label: v })),
])

const visibilityOptions = [
  { value: 'all', label: '全部' },
  { value: 'normal', label: '正常' },
  { value: 'hidden', label: '隐藏' },
]

function versionIndexOf() {
  const m = new Map()
  ;(data.value?.versions || []).forEach((v, i) => m.set(v, i))
  return m
}

function compareBy(a, b, vi) {
  const oa = orderMap.get(a.character) ?? 9999
  const ob = orderMap.get(b.character) ?? 9999
  if (oa !== ob) return oa - ob
  const va = vi.get(a.version) ?? 9999
  const vb = vi.get(b.version) ?? 9999
  if (va !== vb) return va - vb
  return (a.id ?? 0) - (b.id ?? 0)
}

const sortedAll = computed(() => {
  if (!data.value) return []
  const vi = versionIndexOf()
  return data.value.entries.slice().sort((a, b) => compareBy(a, b, vi))
})

const filteredEntries = computed(() => {
  if (!data.value) return []
  const kw = search.value.trim().toLowerCase()
  const vi = versionIndexOf()
  return data.value.entries
    .filter((e) => {
      if (versionFilter.value !== 'all' && e.version !== versionFilter.value) return false
      if (visibilityFilter.value === 'normal' && e.hidden) return false
      if (visibilityFilter.value === 'hidden' && !e.hidden) return false
      if (kw) {
        const hay = `${e.character || ''} ${e.title || ''}`.toLowerCase()
        if (!hay.includes(kw)) return false
      }
      return true
    })
    .sort((a, b) => compareBy(a, b, vi))
})

const entry = computed(() => {
  if (!data.value || selectedId.value == null) return null
  return data.value.entries.find((x) => x.id === selectedId.value) || null
})

const idInvalid = computed(() => {
  const n = parseInt(idInput.value, 10)
  if (Number.isNaN(n)) return true
  if (!data.value) return false
  return data.value.entries.some((x) => x !== entry.value && x.id === n)
})

const headingSub = computed(() => {
  if (!entry.value) return ''
  const kind = entry.value.hidden ? '隐藏旅闻' : '正常旅闻'
  return isNew.value ? `新建条目 · id ${entry.value.id}` : `${kind} · id ${entry.value.id}`
})

const showCharWarn = computed(
  () => Boolean(entry.value?.character) && !avatarUrl(entry.value.character),
)

/* ---------- 草稿 ---------- */
let draftTimer = null

function saveDraft() {
  if (!data.value) return
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data.value))
  } catch {}
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {}
}

function markDirty() {
  dirty.value = true
  clearTimeout(draftTimer)
  draftTimer = setTimeout(saveDraft, 400)
}

function clearDirty() {
  dirty.value = false
  clearTimeout(draftTimer)
}

/* ---------- 解析 / 序列化 ---------- */
function parseDataJs(text) {
  const prev = window.TRAVELERS_TALES
  try {
    new Function(text)()
    const d = window.TRAVELERS_TALES
    if (!d || typeof d !== 'object') throw new Error('解析结果不是对象')
    if (!Array.isArray(d.entries)) throw new Error('缺少 entries 数组')
    if (!Array.isArray(d.versions)) d.versions = []
    if (!d.meta) d.meta = {}
    return d
  } catch (e) {
    throw new Error(e.message || '语法错误')
  } finally {
    window.TRAVELERS_TALES = prev
  }
}

function serializeData(d) {
  /* 用副本，避免「导出」顺手改动草稿 */
  const versions = d.versions.slice()
  const versionSet = new Set(versions)
  for (const e of d.entries) {
    if (e.version && !versionSet.has(e.version)) {
      versionSet.add(e.version)
      versions.push(e.version)
    }
  }

  const grouped = new Map()
  versions.forEach((v) => grouped.set(v, []))
  for (const e of d.entries) {
    if (!grouped.has(e.version)) grouped.set(e.version, [])
    grouped.get(e.version).push(e)
  }

  for (const list of grouped.values()) {
    list.sort((a, b) => {
      const oa = orderMap.get(a.character) ?? 9999
      const ob = orderMap.get(b.character) ?? 9999
      if (oa !== ob) return oa - ob
      return (a.id ?? 0) - (b.id ?? 0)
    })
  }

  const lines = []
  lines.push('/* ============================================================')
  lines.push(' * 原神 · 游逸旅闻 数据字典')
  lines.push(' * 生成时间：' + todayStr())
  lines.push(' * ============================================================ */')
  lines.push('')
  lines.push('window.TRAVELERS_TALES = {')
  lines.push('  meta: {')
  lines.push('    version: "' + escJs(d.meta.version || '') + '",')
  lines.push('    total: ' + d.entries.length + ',')
  lines.push('    updatedAt: "' + todayStr() + '",')
  lines.push('    source: "' + escJs(d.meta.source || '') + '"')
  lines.push('  },')
  lines.push('')
  lines.push('  versions: [' + versions.map((v) => '"' + escJs(v) + '"').join(', ') + '],')
  lines.push('')
  lines.push('  entries: [')

  let first = true
  for (const [v, list] of grouped) {
    if (!list.length) continue
    if (!first) lines.push('')
    lines.push('    /* ==================== ' + v + ' ==================== */')
    for (const e of list) {
      lines.push(
        '    { id: ' +
          (e.id || 0) +
          ', character: "' +
          escJs(e.character) +
          '"' +
          ', version: "' +
          escJs(e.version) +
          '"' +
          ', title: "' +
          escJs(e.title) +
          '"' +
          ', hidden: ' +
          (e.hidden ? 'true' : 'false') +
          ',',
      )
      lines.push(
        '      location: "' +
          escJs(e.location) +
          '"' +
          ', trigger: "' +
          escJs(e.trigger) +
          '"' +
          ', prerequisite: "' +
          escJs(e.prerequisite) +
          '",',
      )
      lines.push('      description: "' + escJs(e.description) + '" },')
      lines.push('')
    }
    first = false
  }
  while (lines.length && lines[lines.length - 1] === '') lines.pop()

  lines.push('  ]')
  lines.push('};')
  return lines.join('\n')
}

/* ---------- 载入 ---------- */
function applyData(d) {
  data.value = d
  data.value.versions ||= []
  data.value.meta ||= {}
  /* 选中项失效就清空，并把窄屏切回列表，避免停在空表单 */
  if (selectedId.value != null && !d.entries.some((x) => x.id === selectedId.value)) {
    selectedId.value = null
    isNew.value = false
    mobilePane.value = 'list'
  }
}

async function fetchOnline() {
  const url = `${import.meta.env.BASE_URL}${DATA_URL}?t=${Date.now()}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return parseDataJs(await res.text())
}

function backToList() {
  mobilePane.value = 'list'
}

/* ---------- 操作 ---------- */
function selectEntry(e) {
  selectedId.value = e.id
  isNew.value = false
  idInput.value = String(e.id)
  mobilePane.value = 'form'
}

function commitId() {
  if (!entry.value) return
  const n = parseInt(idInput.value, 10)
  if (Number.isNaN(n)) return
  entry.value.id = n
  selectedId.value = n
  markDirty()
}

function moveEntry(delta) {
  if (!entry.value) return
  const next = (entry.value.id ?? 0) + delta
  if (next < 1) return
  const conflict = data.value.entries.find((x) => x !== entry.value && x.id === next)
  if (conflict) conflict.id = entry.value.id
  entry.value.id = next
  selectedId.value = next
  idInput.value = String(next)
  markDirty()
}

function addEntry() {
  if (!data.value) {
    ElMessage.error('数据未加载，请先「重载」或「导入」')
    return
  }
  const newId = data.value.entries.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1
  data.value.entries.push({
    id: newId,
    character: '',
    version: '',
    title: '',
    hidden: false,
    location: '',
    trigger: '',
    prerequisite: '',
    description: '',
  })
  selectedId.value = newId
  isNew.value = true
  idInput.value = String(newId)
  mobilePane.value = 'form'
  markDirty()
}

function confirmDelete() {
  const i = data.value.entries.indexOf(entry.value)
  if (i >= 0) data.value.entries.splice(i, 1)
  deleteOpen.value = false
  selectedId.value = null
  isNew.value = false
  mobilePane.value = 'list'
  markDirty()
  ElMessage.success('已删除')
}

function doRenumber() {
  const sorted = sortedAll.value
  const sel = entry.value
  sorted.forEach((e, i) => {
    e.id = i + 1
  })
  if (sel) {
    selectedId.value = sel.id
    idInput.value = String(sel.id)
  }
  renumberOpen.value = false
  markDirty()
  ElMessage.success(`已重排 ${sorted.length} 条 id`)
}

async function doReload() {
  try {
    applyData(await fetchOnline())
    reloadOpen.value = false
    selectedId.value = null
    isNew.value = false
    mobilePane.value = 'list'
    clearDirty()
    clearDraft()
    ElMessage.success(`已重载 ${entryCount.value} 条`)
  } catch (err) {
    ElMessage.error('重载失败：' + err.message)
  }
}

function onImportFile(ev) {
  const file = ev.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      applyData(parseDataJs(reader.result))
      selectedId.value = null
      isNew.value = false
      mobilePane.value = 'list'
      clearDirty()
      saveDraft()
      ElMessage.success(`已导入 ${entryCount.value} 条`)
    } catch (err) {
      ElMessage.error('导入失败：' + err.message)
    }
    ev.target.value = ''
  }
  reader.readAsText(file)
}

function startExport() {
  if (!data.value) {
    ElMessage.error('数据未加载')
    return
  }
  const list = []
  const idSet = new Set()
  for (const e of data.value.entries) {
    if (!e.character) list.push(`id ${e.id} 缺少角色名`)
    if (!e.version) list.push(`id ${e.id} 缺少版本`)
    if (!e.title) list.push(`id ${e.id} 缺少旅闻名`)
    if (idSet.has(e.id)) list.push(`id ${e.id} 重复`)
    idSet.add(e.id)
    if (e.version && !data.value.versions.includes(e.version)) {
      list.push(`id ${e.id} 的版本「${e.version}」不在 versions 列表`)
    }
  }
  warnings.value = list
  if (list.length) exportOpen.value = true
  else runExport()
}

function runExport() {
  const text = serializeData(data.value)
  const blob = new Blob([text], { type: 'text/javascript;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = FILE_NAME
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)

  exportOpen.value = false
  clearDirty()
  clearDraft()
  ElMessage.success(`已导出 ${FILE_NAME}`)
}

/* 输入新版本自动并入列表 */
function onVersionInput() {
  const v = entry.value?.version
  if (v && data.value && !data.value.versions.includes(v)) data.value.versions.push(v)
  markDirty()
}

function onBeforeUnload(e) {
  if (!dirty.value) return
  e.preventDefault()
  e.returnValue = ''
}

/* ---------- 启动 ---------- */
onMounted(async () => {
  try {
    const dict = await loadGlobalScript(IMAGE_DICT_URL, 'IMAGE_DICT').catch(() => null)

    if (dict?.characters) {
      const cfg = dict.config?.characters
      const tmp = []
      for (const [key, item] of Object.entries(dict.characters)) {
        if (!item?.name || item.order === 1) continue
        tmp.push({ name: item.name, order: item.order ?? 9999 })
        orderMap.set(item.name, item.order ?? 9999)

        let url = ''
        if (item.url) url = item.url
        else if (cfg) {
          url = /\.(webp|png|jpe?g)$/i.test(key) ? cfg.prefix + key : cfg.prefix + key + cfg.ext
        }
        if (url) avatarMap.set(item.name, url)
      }
      charList.value = tmp.sort((a, b) => a.order - b.order).map((x) => x.name)
    }

    const draft = loadDraft()
    if (draft?.entries) {
      applyData(draft)
      dirty.value = true
      ElMessage({ message: '已恢复草稿（尚未导出）', duration: 3000 })
    } else {
      try {
        applyData(await fetchOnline())
      } catch (err) {
        ElMessage.error(`数据加载失败：${err.message}，可用「导入」`)
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    loading.value = false
  } catch (e) {
    loading.value = false
    ElMessage.error('初始化失败：' + (e?.message || e))
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
  clearTimeout(draftTimer)
})
</script>

<template>
  <el-container class="ah-tales ah-shell ah-shell--split" direction="vertical">
    <!-- 工具条 -->
    <div class="flex items-center gap-2 border-b border-line bg-canvas p-2">
      <span
        v-if="dirty"
        class="size-2 shrink-0 rounded-full bg-danger"
        role="status"
        aria-label="有未导出的修改"
      ></span>
      <el-text size="small" class="ah-text-muted">
        {{ data ? `${entryCount} 条` : '数据未加载' }}
      </el-text>

      <div class="min-w-0 flex-1"></div>

      <el-button size="small" @click="reloadOpen = true">
        <el-icon><Refresh /></el-icon>
        <span>重载</span>
      </el-button>
      <el-button size="small" @click="fileInput?.click()">
        <el-icon><Upload /></el-icon>
        <span>导入</span>
      </el-button>
      <el-button size="small" @click="startExport">
        <el-icon><Download /></el-icon>
        <span>导出</span>
      </el-button>
      <input
        ref="fileInput"
        type="file"
        accept=".js,.txt,text/javascript,application/javascript"
        class="hidden"
        aria-hidden="true"
        tabindex="-1"
        @change="onImportFile"
      />
    </div>

    <el-main>
      <!-- 左：列表 -->
      <aside
        class="flex min-h-0 flex-col bg-surface-2"
        :class="[mobilePane === 'form' ? 'hidden min-[900px]:flex' : 'flex', 'border-line min-[900px]:border-r']"
      >
        <div class="grid shrink-0 gap-2 border-b border-line p-2">
          <el-input
            v-model="search"
            placeholder="搜索角色名 / 旅闻名"
            aria-label="搜索角色名 / 旅闻名"
            clearable
            class="w-full min-w-0"
            autocomplete="off"
            spellcheck="false"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <div class="grid grid-cols-2 gap-2">
            <el-select v-model="versionFilter" placeholder="版本" aria-label="版本" class="w-full">
              <el-option
                v-for="o in versionOptions"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </el-select>
            <el-select v-model="visibilityFilter" placeholder="类型" aria-label="类型" class="w-full">
              <el-option
                v-for="o in visibilityOptions"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </el-select>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <div class="grid content-start gap-1 p-2">
          <el-empty v-if="!data" :image-size="56" description="数据未加载，点「重载」或「导入」" />
          <el-empty
            v-else-if="!filteredEntries.length"
            :image-size="56"
            description="没有匹配的条目"
          />

          <div
            v-for="e in filteredEntries"
            :key="e.id"
            role="button"
            tabindex="0"
            class="flex w-full items-center gap-2 rounded-ctl border p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            :class="
              e.id === selectedId
                ? 'border-accent bg-accent-soft'
                : 'border-transparent hover:bg-hover'
            "
            @click="selectEntry(e)"
            @keydown.enter.prevent="selectEntry(e)"
            @keydown.space.prevent="selectEntry(e)"
          >
            <span
              class="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-ctl bg-thumb text-xs font-semibold text-muted"
            >
              <span aria-hidden="true">{{ (e.character || '?').charAt(0) }}</span>
              <img
                v-if="avatarUrl(e.character)"
                :src="avatarUrl(e.character)"
                alt=""
                loading="lazy"
                class="absolute inset-0 size-full object-cover"
                @error="(ev) => ev.target.remove()"
              />
            </span>
            <span class="grid min-w-0 flex-1 gap-1">
              <span
                class="truncate text-xs font-medium"
                :class="e.hidden ? 'text-danger' : 'text-ink'"
              >
                {{ e.title || '(无标题)' }}
              </span>
              <span class="truncate text-[10px] text-muted">
                {{ e.character || '?' }} · {{ e.version || '?' }}
              </span>
            </span>
          </div>
        </div>
        </div>

        <div class="grid shrink-0 grid-cols-2 gap-2 border-t border-line p-2">
          <el-button size="small" @click="addEntry">
            <el-icon><Plus /></el-icon>
            <span>新增</span>
          </el-button>
          <el-button size="small" :disabled="!data" @click="renumberOpen = true">
            <el-icon><Sort /></el-icon>
            <span>重排 ID</span>
          </el-button>
        </div>
      </aside>

      <!-- 右：表单 -->
      <section
        class="min-h-0 overflow-y-auto"
        :class="mobilePane === 'list' ? 'hidden min-[900px]:block' : 'block'"
      >
        <div class="grid gap-3 p-3">
          <!-- 返回按钮常驻，任何状态都能回列表 -->
          <el-button
            v-if="mobilePane === 'form'"
            size="small"
            class="justify-self-start min-[900px]:hidden"
            @click="backToList"
          >
            <el-icon><Back /></el-icon>
            <span>返回列表</span>
          </el-button>

          <el-skeleton v-if="loading" :rows="4" animated />

          <el-empty
            v-else-if="!data"
            :image-size="80"
            description="数据未加载，请点右上角「重载」或「导入」"
          />

          <el-text v-else-if="!entry" class="ah-text-muted ah-text-block">
            从列表选择条目开始编辑，或点「新增」
          </el-text>

          <template v-else>
            <!-- 标题区 -->
            <div class="flex items-center gap-2 border-b border-line pb-2">
              <span
                class="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-ctl bg-thumb text-sm font-semibold text-muted"
              >
                <span aria-hidden="true">{{ (entry.character || '?').charAt(0) }}</span>
                <img
                  v-if="avatarUrl(entry.character)"
                  :src="avatarUrl(entry.character)"
                  alt=""
                  class="absolute inset-0 size-full object-cover"
                  @error="(ev) => ev.target.remove()"
                />
              </span>
              <span class="grid min-w-0 flex-1">
                <span class="truncate text-sm font-semibold text-ink">
                  {{ entry.character || '(未命名角色)' }} · {{ entry.title || '(无标题)' }}
                </span>
                <el-text size="small" class="ah-text-muted">{{ headingSub }}</el-text>
              </span>
            </div>

            <!-- id -->
            <div class="grid gap-2">
              <el-text size="small" class="ah-text-muted font-medium">id · 可手动改，需唯一</el-text>
              <div class="flex items-center gap-2">
                <el-input
                  v-model="idInput"
                  inputmode="numeric"
                  autocomplete="off"
                  aria-label="id"
                  :status="idInvalid ? 'error' : undefined"
                  class="ah-id"
                  @update:model-value="commitId"
                />
                <el-button class="shrink-0" @click="moveEntry(-1)">
                  <el-icon><ArrowUp /></el-icon>
                  <span>上移</span>
                </el-button>
                <el-button class="shrink-0" @click="moveEntry(1)">
                  <el-icon><ArrowDown /></el-icon>
                  <span>下移</span>
                </el-button>
              </div>
            </div>

            <!-- 版本 -->
            <div class="grid gap-2">
              <el-text size="small" class="ah-text-muted font-medium">版本 · 输入新值会自动加入列表</el-text>
              <el-select
                v-model="entry.version"
                filterable
                allow-create
                default-first-option
                placeholder="如 5.4"
                aria-label="版本"
                class="w-full"
                @update:model-value="onVersionInput"
              >
                <el-option
                  v-for="v in data.versions"
                  :key="v"
                  :label="v"
                  :value="v"
                />
              </el-select>
            </div>

            <!-- 角色 -->
            <div class="grid gap-2">
              <el-text size="small" class="ah-text-muted font-medium">角色名 · 从字典联想，可自定义</el-text>
              <div class="flex items-center gap-2">
                <span
                  class="relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-ctl border border-line bg-surface text-[10px] font-semibold text-muted"
                >
                  <span aria-hidden="true">{{ (entry.character || '?').charAt(0) }}</span>
                  <img
                    v-if="avatarUrl(entry.character)"
                    :src="avatarUrl(entry.character)"
                    alt=""
                    class="absolute inset-0 size-full object-cover"
                    @error="(ev) => ev.target.remove()"
                  />
                </span>
                <el-select
                  v-model="entry.character"
                  filterable
                  allow-create
                  default-first-option
                  placeholder="输入角色名"
                  aria-label="角色名"
                  class="min-w-0"
                  @update:model-value="markDirty"
                >
                  <el-option
                    v-for="c in charList"
                    :key="c"
                    :label="c"
                    :value="c"
                  />
                </el-select>
              </div>
              <el-text v-if="showCharWarn" size="small" class="ah-text-danger ah-text-block">
                字典中无此角色，主界面将显示首字占位
              </el-text>
            </div>

            <div class="grid gap-2">
              <el-text size="small" class="ah-text-muted">旅闻名</el-text>
              <el-input
                v-model="entry.title"
                placeholder="旅闻标题"
                class="w-full"
                @update:model-value="markDirty"
              />
            </div>

            <div
              class="flex h-[44px] w-fit cursor-pointer items-center gap-2 rounded-md border border-line-2 bg-sunken px-3"
            >
              <el-checkbox v-model="entry.hidden" @change="markDirty" />
              <el-text size="small" class="ah-text-ink">标记为隐藏旅闻（主界面红色）</el-text>
            </div>

            <div class="grid gap-2">
              <el-text size="small" class="ah-text-muted">地点</el-text>
              <el-input
                v-model="entry.location"
                placeholder="如 蒙德-晨曦酒庄"
                class="w-full"
                @update:model-value="markDirty"
              />
            </div>

            <div class="grid gap-2">
              <el-text size="small" class="ah-text-muted">触发条件</el-text>
              <el-input
                v-model="entry.trigger"
                placeholder="留空则不显示"
                class="w-full"
                @update:model-value="markDirty"
              />
            </div>

            <div class="grid gap-2">
              <el-text size="small" class="ah-text-muted">前置旅闻 · 只填旅闻名</el-text>
              <el-input
                v-model="entry.prerequisite"
                placeholder="留空则不显示"
                class="w-full"
                @update:model-value="markDirty"
              />
            </div>

            <div class="grid gap-2">
              <el-text size="small" class="ah-text-muted">描述 · 支持换行</el-text>
              <el-input
                v-model="entry.description"
                type="textarea"
                :rows="6"
                class="w-full"
                @update:model-value="markDirty"
              />
            </div>
          </template>
        </div>
      </section>
    </el-main>

    <!-- 底部固定危险区：只有停在表单栏（手机端点进某条后）才出现删除入口 -->
    <div
      v-if="entry && mobilePane === 'form'"
      class="border-t border-line bg-canvas p-2 safe-bottom"
    >
      <el-button type="danger" class="w-full" @click="deleteOpen = true">
        <el-icon><Delete /></el-icon>
        <span>删除此条</span>
      </el-button>
    </div>

    <!-- 确认：重载 -->
    <el-dialog
      v-model="reloadOpen"
      :title="dirty ? '放弃修改' : '重载线上数据'"
      width="min(20rem, 90vw)"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-text size="large" class="ah-text-block">
        {{
          dirty
            ? '当前有未导出的修改，重载会丢弃这些改动。'
            : `将从线上重新拉取 ${FILE_NAME}，覆盖当前编辑内容。`
        }}
      </el-text>
      <template #footer>
        <el-button @click="reloadOpen = false">取消</el-button>
        <el-button type="danger" @click="doReload">重载</el-button>
      </template>
    </el-dialog>

    <!-- 确认：删除 -->
    <el-dialog
      v-model="deleteOpen"
      title="删除条目"
      width="min(20rem, 90vw)"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-text size="large" class="ah-text-block">
        确定删除「{{ entry?.character || '?' }} · {{ entry?.title || '?' }}」吗？此操作不可撤销。
      </el-text>
      <template #footer>
        <el-button @click="deleteOpen = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">删除</el-button>
      </template>
    </el-dialog>

    <!-- 确认：重排 -->
    <el-dialog
      v-model="renumberOpen"
      title="重排 id"
      width="min(20rem, 90vw)"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-text size="large" class="ah-text-block">
        将按当前显示顺序重新编号 1 ~ {{ entryCount }}，原有 id 会被覆盖。
      </el-text>
      <template #footer>
        <el-button @click="renumberOpen = false">取消</el-button>
        <el-button type="danger" @click="doRenumber">重排</el-button>
      </template>
    </el-dialog>

    <!-- 导出前检查 -->
    <el-dialog v-model="exportOpen" title="导出前检查" width="min(24rem, 92vw)">
      <el-text size="large" class="ah-text-block">发现 {{ warnings.length }} 项问题：</el-text>
      <ul class="grid max-h-60 list-disc gap-1 overflow-y-auto pl-5 text-xs text-muted">
        <li v-for="(w, i) in warnings.slice(0, 30)" :key="i">{{ w }}</li>
      </ul>
      <p v-if="warnings.length > 30" class="text-xs text-muted">
        还有 {{ warnings.length - 30 }} 项未列出
      </p>
      <el-text size="large" class="ah-text-block">是否继续导出？</el-text>
      <template #footer>
        <el-button @click="exportOpen = false">取消</el-button>
        <el-button type="primary" @click="runExport">继续导出</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<style scoped>
/* EP 给 .el-select 带了 margin-right:8px（input-group 那条还带 margin:0 -20px），
   在 grid-cols-2 里会把下拉框推出格子，弹窗跟着偏 */
.ah-tales :deep(.el-select) {
  margin: 0;
}

/* EP input 宽度默认 100%，在「id + 上移/下移」的 flex 行里会挤掉按钮 */
.ah-tales :deep(.ah-id) {
  flex: 1;
  min-width: 0;
}

/* 隐藏标记用 el-checkbox 拿语义（空格切换 / aria-checked），
   外框仍按内容色表达状态，行高对齐控件高度 */
.ah-tales :deep(.el-checkbox) {
  margin-right: 8px;
}

.ah-tales :deep(.el-checkbox__label) {
  padding-left: 2px;
  font-size: 12px;
}
</style>
