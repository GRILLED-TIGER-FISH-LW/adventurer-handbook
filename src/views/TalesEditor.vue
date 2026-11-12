<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import Btn from '../components/Btn.vue'
import Dropdown from '../components/Dropdown.vue'
import Field from '../components/Field.vue'
import Combobox from '../components/Combobox.vue'
import Modal from '../components/Modal.vue'
import Icon from '../components/Icon.vue'
import { useToast } from '../composables/useToast.js'
import { loadGlobalScript } from '../composables/useData.js'
import '../icons/editor-icons.js'

const DRAFT_KEY = 'genshin_travelers_tales_editor_draft_v1'
const DATA_URL = 'data/tales.js'
const FILE_NAME = DATA_URL.split('/').pop()
const IMAGE_DICT_URL =
  'https://grilled-tiger-fish-lw.github.io/genshin-guide/shared/image-dict.js'

const toast = useToast()

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
    toast.error('数据未加载，请先「重载」或「导入」')
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
  selectedId.value = null
  isNew.value = false
  mobilePane.value = 'list'
  markDirty()
  toast.success('已删除')
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
  markDirty()
  toast.success(`已重排 ${sorted.length} 条 id`)
}

async function doReload() {
  try {
    applyData(await fetchOnline())
    selectedId.value = null
    isNew.value = false
    mobilePane.value = 'list'
    clearDirty()
    clearDraft()
    toast.success(`已重载 ${entryCount.value} 条`)
  } catch (err) {
    toast.error('重载失败：' + err.message)
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
      toast.success(`已导入 ${entryCount.value} 条`)
    } catch (err) {
      toast.error('导入失败：' + err.message)
    }
    ev.target.value = ''
  }
  reader.readAsText(file)
}

function startExport() {
  if (!data.value) {
    toast.error('数据未加载')
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

  clearDirty()
  clearDraft()
  toast.success(`已导出 ${FILE_NAME}`)
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
      toast.show('已恢复草稿（尚未导出）', { duration: 3000 })
    } else {
      try {
        applyData(await fetchOnline())
      } catch (err) {
        toast.error(`数据加载失败：${err.message}，可用「导入」`)
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    loading.value = false
  } catch (e) {
    loading.value = false
    toast.error('初始化失败：' + (e?.message || e))
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
  clearTimeout(draftTimer)
})
</script>

<template>
  <div class="grid h-full grid-rows-[auto_minmax(0,1fr)_auto]">
    <!-- 工具条 -->
    <div class="flex items-center gap-2 border-b border-line bg-canvas p-2">
      <span
        v-if="dirty"
        class="size-2 shrink-0 rounded-full bg-danger"
        role="status"
        aria-label="有未导出的修改"
      ></span>
      <span class="text-xs text-muted">
        {{ data ? `${entryCount} 条` : '数据未加载' }}
      </span>

      <div class="min-w-0 flex-1"></div>

      <Btn size="sm" @click="reloadOpen = true">
        <template #icon><Icon name="ui.reload" size="sm" /></template>
        重载
      </Btn>
      <Btn size="sm" @click="fileInput?.click()">
        <template #icon><Icon name="ui.import" size="sm" /></template>
        导入
      </Btn>
      <Btn size="sm" @click="startExport">
        <template #icon><Icon name="ui.export" size="sm" /></template>
        导出
      </Btn>
      <input
        ref="fileInput"
        type="file"
        accept=".js,.txt,text/javascript,application/javascript"
        class="hidden"
        @change="onImportFile"
      />
    </div>

    <main class="grid min-h-0 grid-cols-1 min-[900px]:grid-cols-[20rem_minmax(0,1fr)]">
      <!-- 左：列表 -->
      <aside
        class="flex min-h-0 flex-col bg-surface-2"
        :class="[mobilePane === 'form' ? 'hidden min-[900px]:flex' : 'flex', 'border-line min-[900px]:border-r']"
      >
        <div class="grid shrink-0 gap-2 border-b border-line p-2">
          <div class="relative flex items-center">
            <Icon
              name="ui.search"
              size="sm"
              class="pointer-events-none absolute left-3 text-muted"
            />
            <input
              v-model="search"
              type="text"
              class="h-control w-full min-w-0 rounded-md border border-line-2 bg-surface pl-10 pr-10 text-body-md text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              placeholder="搜索角色名 / 旅闻名"
              autocomplete="off"
              spellcheck="false"
            />
            <button
              v-if="search"
              type="button"
              class="absolute right-2 grid size-6 place-items-center rounded-full text-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              aria-label="清除搜索"
              @click="search = ''"
            >
              <Icon name="ui.close" size="sm" />
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <Dropdown v-model="versionFilter" :options="versionOptions" label="版本" />
            <Dropdown v-model="visibilityFilter" :options="visibilityOptions" label="类型" />
          </div>
        </div>

        <div class="grid min-h-0 flex-1 content-start gap-1 overflow-y-auto p-2">
          <p v-if="!data" class="p-3 text-xs text-muted">数据未加载，点「重载」或「导入」</p>
          <p v-else-if="!filteredEntries.length" class="p-3 text-xs text-muted">
            没有匹配的条目
          </p>

          <button
            v-for="e in filteredEntries"
            :key="e.id"
            type="button"
            class="flex w-full items-center gap-2 rounded-ctl border p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            :class="
              e.id === selectedId
                ? 'border-accent bg-accent-soft'
                : 'border-transparent hover:bg-hover'
            "
            @click="selectEntry(e)"
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
          </button>
        </div>

        <div class="grid shrink-0 grid-cols-2 gap-2 border-t border-line p-2">
          <Btn size="sm" @click="addEntry">
            <template #icon><Icon name="ui.plus" size="sm" /></template>
            新增
          </Btn>
          <Btn size="sm" :disabled="!data" @click="renumberOpen = true">
            <template #icon><Icon name="ui.reorder" size="sm" /></template>
            重排 ID
          </Btn>
        </div>
      </aside>

      <!-- 右：表单 -->
      <section
        class="min-h-0 overflow-y-auto p-3"
        :class="mobilePane === 'list' ? 'hidden min-[900px]:block' : 'block'"
      >
        <div class="grid gap-3">
          <!-- 返回按钮常驻，任何状态都能回列表 -->
          <Btn
            v-if="mobilePane === 'form'"
            size="sm"
            class="justify-self-start min-[900px]:hidden"
            @click="backToList"
          >
            <template #icon><Icon name="ui.back" size="sm" /></template>
            返回列表
          </Btn>

          <p v-if="loading" class="text-sm text-muted">正在载入…</p>

          <div v-else-if="!data" class="grid justify-items-center gap-3 p-8 text-center">
            <Icon name="ui.file" size="lg" class="text-faint" />
            <p class="text-sm text-muted">数据未加载，请点右上角「重载」或「导入」</p>
          </div>

          <p v-else-if="!entry" class="text-sm text-muted">
            从列表选择条目开始编辑，或点「新增」
          </p>

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
                <span class="text-xs text-muted">{{ headingSub }}</span>
              </span>
            </div>

            <!-- id -->
            <div class="grid gap-2">
              <span class="text-xs font-medium text-muted">id · 可手动改，需唯一</span>
              <div class="flex items-center gap-2">
                <input
                  v-model="idInput"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  aria-label="id"
                  class="h-control w-full min-w-0 rounded-md border bg-surface px-input-x text-body-md text-ink focus-visible:outline-2 focus-visible:outline-offset-1"
                  :class="
                    idInvalid
                      ? 'border-danger focus-visible:outline-danger'
                      : 'border-line-2 focus-visible:outline-accent'
                  "
                  @input="commitId"
                />
                <Btn class="shrink-0" @click="moveEntry(-1)">
                  <template #icon><Icon name="ui.arrowUp" size="sm" /></template>
                  上移
                </Btn>
                <Btn class="shrink-0" @click="moveEntry(1)">
                  <template #icon><Icon name="ui.arrowDown" size="sm" /></template>
                  下移
                </Btn>
              </div>
            </div>

            <!-- 版本 -->
            <div class="grid gap-2">
              <span class="text-xs font-medium text-muted">版本 · 输入新值会自动加入列表</span>
              <Combobox
                v-model="entry.version"
                :items="data.versions"
                aria-label="版本"
                placeholder="如 5.4"
                @update:model-value="onVersionInput"
              />
            </div>

            <!-- 角色 -->
            <div class="grid gap-2">
              <span class="text-xs font-medium text-muted">角色名 · 从字典联想，可自定义</span>
              <Combobox
                v-model="entry.character"
                :items="charList"
                aria-label="角色名"
                placeholder="输入角色名"
                @update:model-value="markDirty"
              >
                <template #prefix>
                  <span
                    class="pointer-events-none absolute left-1.5 grid size-7 place-items-center overflow-hidden rounded-ctl border border-line bg-surface text-[10px] font-semibold text-muted"
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
                </template>
              </Combobox>
              <p v-if="showCharWarn" class="text-xs text-danger">
                字典中无此角色，主界面将显示首字占位
              </p>
            </div>

            <Field
              v-model="entry.title"
              label="旅闻名"
              placeholder="旅闻标题"
              @update:model-value="markDirty"
            />

            <label
              class="flex h-control w-fit cursor-pointer items-center gap-2 rounded-md border border-line-2 bg-sunken px-3"
            >
              <input
                v-model="entry.hidden"
                type="checkbox"
                class="size-4 shrink-0 accent-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                @change="markDirty"
              />
              <span class="text-xs text-ink">标记为隐藏旅闻（主界面红色）</span>
            </label>

            <Field
              v-model="entry.location"
              label="地点"
              placeholder="如 蒙德-晨曦酒庄"
              @update:model-value="markDirty"
            />

            <Field
              v-model="entry.trigger"
              label="触发条件"
              placeholder="留空则不显示"
              @update:model-value="markDirty"
            />

            <Field
              v-model="entry.prerequisite"
              label="前置旅闻 · 只填旅闻名"
              placeholder="留空则不显示"
              @update:model-value="markDirty"
            />

            <Field
              v-model="entry.description"
              type="textarea"
              label="描述 · 支持换行"
              :rows="6"
              @update:model-value="markDirty"
            />
          </template>
        </div>
      </section>
    </main>

    <!-- 底部固定危险区 -->
    <div v-if="entry" class="border-t border-line bg-canvas p-2 safe-bottom">
      <Btn variant="danger" class="w-full" @click="deleteOpen = true">
        <template #icon><Icon name="ui.trash" size="sm" /></template>
        删除此条
      </Btn>
    </div>

    <!-- 确认：重载 -->
    <Modal
      v-model="reloadOpen"
      :title="dirty ? '放弃修改' : '重载线上数据'"
      :message="
        dirty
          ? '当前有未导出的修改，重载会丢弃这些改动。'
          : `将从线上重新拉取 ${FILE_NAME}，覆盖当前编辑内容。`
      "
      confirm-text="重载"
      :danger="dirty"
      :persistent="dirty"
      @confirm="doReload"
    />

    <!-- 确认：删除 -->
    <Modal
      v-model="deleteOpen"
      title="删除条目"
      :message="`确定删除「${entry?.character || '?'} · ${entry?.title || '?'}」吗？此操作不可撤销。`"
      confirm-text="删除"
      danger
      persistent
      @confirm="confirmDelete"
    />

    <!-- 确认：重排 -->
    <Modal
      v-model="renumberOpen"
      title="重排 id"
      :message="`将按当前显示顺序重新编号 1 ~ ${entryCount}，原有 id 会被覆盖。`"
      confirm-text="重排"
      danger
      persistent
      @confirm="doRenumber"
    />

    <!-- 导出前检查 -->
    <Modal v-model="exportOpen" title="导出前检查" confirm-text="继续导出" @confirm="runExport">
      <p class="text-sm text-body">发现 {{ warnings.length }} 项问题：</p>
      <ul class="grid max-h-60 list-disc gap-1 overflow-y-auto pl-5 text-xs text-muted">
        <li v-for="(w, i) in warnings.slice(0, 30)" :key="i">{{ w }}</li>
      </ul>
      <p v-if="warnings.length > 30" class="text-xs text-muted">
        还有 {{ warnings.length - 30 }} 项未列出
      </p>
      <p class="text-xs text-body">是否继续导出？</p>
    </Modal>
  </div>
</template>
