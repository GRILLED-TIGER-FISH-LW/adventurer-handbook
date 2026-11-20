<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
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

const DRAFT_KEY = 'genshin_homeworld_gift_sets_editor_draft_v1'
const DATA_URL = 'data/gift-set.js'
const FILE_NAME = DATA_URL.split('/').pop()

/* 批量输入分隔符：空格 / 全角逗号 / 半角逗号 / 顿号 / 分号 */
const CHAR_SPLIT_RE = /[\s，,、;；]+/
const CHAR_SPLIT_TEST = /[\s，,、;；]/


/* ---------- 状态 ---------- */
const loading = ref(true)
const data = ref(null)
const selectedId = ref(null)
const isNew = ref(false)
const search = ref('')
const typeFilter = ref('all')
const regionFilter = ref('all')
const dirty = ref(false)
const mobilePane = ref('list')

const idInput = ref('')
const charQuery = ref('')

const charList = ref([])
const charKeySet = reactive(new Set())
const orderMap = new Map()
const avatarMap = reactive(new Map())

const fileInput = ref(null)

const reloadOpen = ref(false)
const deleteOpen = ref(false)
const renumberOpen = ref(false)
const exportOpen = ref(false)
const warnings = ref([])

/* ---------- 常量 / 工具 ---------- */
const REGION_CODE_MAP = {
  mond: '蒙德',
  liyue: '璃月',
  dq: '稻妻',
  xm: '须弥',
  fd: '枫丹',
  nt: '纳塔',
  ndkl: '挪德卡莱',
  zd: '至冬',
}

const BASE_REGIONS = ['蒙德', '璃月', '稻妻', '须弥', '枫丹', '纳塔', '挪德卡莱', '至冬']
const DEFAULT_IMAGE = {
  prefix: 'https://gi.yatta.moe/assets/UI/furnitureSuite/',
  ext: '.png',
}

const typeLabel = (t) => (t === 'exterior' ? '室外' : t === 'interior' ? '室内' : '?')
const avatarUrl = (name) => avatarMap.get(name) || ''

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/* 注意：这里转义单引号，serialize 也用单引号 —— 与旧版一致 */
const escJs = (str) =>
  String(str ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/\t/g, '\\t')

function inferType(key) {
  if (!key) return null
  if (/exterior/i.test(key)) return 'exterior'
  if (/interior/i.test(key)) return 'interior'
  return null
}

function inferRegion(key) {
  if (!key) return null
  const m = key.match(/(?:Exterior|Interior)_([A-Za-z]+)(?:_|$)/i)
  if (!m) return null
  return REGION_CODE_MAP[m[1].toLowerCase()] || null
}

function parseSetUrl(text) {
  const raw = (text || '').trim()
  if (!raw) return null
  let url
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  const last = url.pathname.split('/').filter(Boolean).pop() || ''
  if (!last) return null
  const key = last.replace(/\.[^.]+$/, '')
  if (!/^UI_[A-Za-z0-9_]+$/i.test(key)) return null
  return key
}

function defaultData() {
  return {
    config: { image: { ...DEFAULT_IMAGE } },
    meta: { total: 0, updatedAt: '', source: '' },
    regions: BASE_REGIONS.slice(),
    sets: [],
  }
}

function normalizeData(input) {
  const base = defaultData()
  const d = input && typeof input === 'object' ? input : base

  if (!d.config?.image) d.config = { image: { ...base.config.image } }
  else {
    d.config.image.prefix ||= base.config.image.prefix
    d.config.image.ext ||= base.config.image.ext
  }
  if (!d.meta) d.meta = { ...base.meta }
  if (!Array.isArray(d.sets)) d.sets = []

  /* 地区：剔掉占位值，强制保留蒙德/璃月，再按标准顺序重排 */
  const regionSet = new Set()
  for (const r of Array.isArray(d.regions) ? d.regions : []) {
    if (!r || r === '蒙德/璃月') continue
    regionSet.add(r)
  }
  regionSet.add('蒙德')
  regionSet.add('璃月')

  const ordered = []
  for (const r of BASE_REGIONS) {
    if (regionSet.has(r)) {
      ordered.push(r)
      regionSet.delete(r)
    }
  }
  for (const r of regionSet) ordered.push(r)
  d.regions = ordered.length ? ordered : BASE_REGIONS.slice()

  for (const s of d.sets) {
    if (!Array.isArray(s.preferredCharacters)) s.preferredCharacters = []
    if (s.region === '蒙德/璃月') {
      const inferred = inferRegion(s.key)
      if (inferred) s.region = inferred
    }
  }

  return d
}

function setImageUrl(set) {
  if (!set?.key || !data.value?.config?.image) return ''
  const { prefix, ext } = data.value.config.image
  return prefix + set.key + ext
}

/* ---------- 派生 ---------- */
const setCount = computed(() => data.value?.sets.length ?? 0)

const typeOptions = [
  { value: 'interior', label: '室内' },
  { value: 'exterior', label: '室外' },
]

const typeFilterOptions = [{ value: 'all', label: '全部类型' }, ...typeOptions]

const regionFilterOptions = computed(() => [
  { value: 'all', label: '全部地区' },
  ...(data.value?.regions || []).map((r) => ({ value: r, label: r })),
])

const sortedSets = computed(() => {
  if (!data.value) return []
  const kw = search.value.trim().toLowerCase()
  return data.value.sets
    .filter((s) => {
      if (typeFilter.value !== 'all' && s.type !== typeFilter.value) return false
      if (regionFilter.value !== 'all' && s.region !== regionFilter.value) return false
      if (kw) {
        const hay = `${s.name || ''} ${(s.preferredCharacters || []).join(' ')}`.toLowerCase()
        if (!hay.includes(kw)) return false
      }
      return true
    })
    .sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
})

const entry = computed(() => {
  if (!data.value || selectedId.value == null) return null
  return data.value.sets.find((x) => x.id === selectedId.value) || null
})

const idInvalid = computed(() => {
  const n = parseInt(idInput.value, 10)
  if (Number.isNaN(n)) return true
  if (!data.value) return false
  return data.value.sets.some((x) => x !== entry.value && x.id === n)
})

const sortedChars = computed(() => {
  const list = entry.value?.preferredCharacters || []
  return list.slice().sort((a, b) => (orderMap.get(a) ?? 9999) - (orderMap.get(b) ?? 9999))
})

const charSuggestions = computed(() => {
  const chosen = entry.value?.preferredCharacters || []
  return charList.value.filter((n) => !chosen.includes(n))
})

const previewSub = computed(() => {
  const e = entry.value
  if (!e) return ''
  const parts = []
  if (e.region) parts.push(e.region)
  if (e.type === 'exterior' || e.type === 'interior') parts.push(typeLabel(e.type))
  const n = (e.preferredCharacters || []).length
  if (n) parts.push(`${n} 角色`)
  parts.push(`id ${e.id ?? 0}`)
  return parts.join(' · ')
})

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
  const prev = window.HOMEWORLD_GIFT_SETS
  try {
    new Function(text)()
    const d = window.HOMEWORLD_GIFT_SETS
    if (!d || typeof d !== 'object') throw new Error('解析结果不是对象')
    return normalizeData(d)
  } catch (e) {
    throw new Error(e.message || '语法错误')
  } finally {
    window.HOMEWORLD_GIFT_SETS = prev
  }
}

function serializeData(d) {
  /* 用副本，避免「导出」顺手改动草稿 */
  const regions = d.regions.slice()
  const regionSet = new Set(regions)
  for (const s of d.sets) {
    if (s.region && s.region !== '蒙德/璃月' && !regionSet.has(s.region)) {
      regionSet.add(s.region)
      regions.push(s.region)
    }
  }

  const sorted = d.sets.slice().sort((a, b) => (a.id ?? 0) - (b.id ?? 0))

  const lines = []
  lines.push('/* ============================================================')
  lines.push(' * 尘歌壶赠礼套装 · 数据字典')
  lines.push(' * 生成时间：' + todayStr())
  lines.push(' * ------------------------------------------------------------')
  lines.push(' * · key 不含扩展名')
  lines.push(' *   图片 URL = config.image.prefix + key + config.image.ext')
  lines.push(' * · type: "exterior"（室外）| "interior"（室内）')
  lines.push(' * · preferredCharacters 存角色中文名，按图片字典 order 升序')
  lines.push(' * · sets 按 id 升序排列')
  lines.push(' * ============================================================ */')
  lines.push('')
  lines.push('window.HOMEWORLD_GIFT_SETS = {')
  lines.push('')
  lines.push('  config: {')
  lines.push('    image: {')
  lines.push(`      prefix: '${escJs(d.config.image.prefix)}',`)
  lines.push(`      ext: '${escJs(d.config.image.ext)}'`)
  lines.push('    }')
  lines.push('  },')
  lines.push('')
  lines.push('  meta: {')
  lines.push(`    total: ${d.sets.length},`)
  lines.push(`    updatedAt: '${todayStr()}',`)
  lines.push(`    source: '${escJs(d.meta.source || '')}'`)
  lines.push('  },')
  lines.push('')
  lines.push('  regions: [')
  regions.forEach((r, i) => {
    lines.push(`    '${escJs(r)}'${i === regions.length - 1 ? '' : ','}`)
  })
  lines.push('  ],')
  lines.push('')
  lines.push('  sets: [')

  sorted.forEach((s, i) => {
    const chars = (s.preferredCharacters || [])
      .slice()
      .sort((a, b) => (orderMap.get(a) ?? 9999) - (orderMap.get(b) ?? 9999))
      .map((c) => `'${escJs(c)}'`)
      .join(', ')
    lines.push(
      `    { id: ${s.id}, key: '${escJs(s.key)}', name: '${escJs(s.name)}', ` +
        `type: '${escJs(s.type)}', region: '${escJs(s.region)}', preferredCharacters: [${chars}] }${
          i === sorted.length - 1 ? '' : ','
        }`,
    )
  })

  lines.push('  ]')
  lines.push('};')
  return lines.join('\n')
}

/* ---------- 载入 ---------- */
function applyData(d) {
  data.value = d
  if (selectedId.value != null && !d.sets.some((x) => x.id === selectedId.value)) {
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

/* ---------- 列表 / 表单操作 ---------- */
function selectSet(s) {
  selectedId.value = s.id
  isNew.value = false
  idInput.value = String(s.id)
  charQuery.value = ''
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

function moveSet(delta) {
  if (!entry.value) return
  const next = (entry.value.id ?? 0) + delta
  if (next < 1) return
  const conflict = data.value.sets.find((x) => x !== entry.value && x.id === next)
  if (conflict) conflict.id = entry.value.id
  entry.value.id = next
  selectedId.value = next
  idInput.value = String(next)
  markDirty()
}

function addSet() {
  if (!data.value) {
    ElMessage.error('数据未加载')
    return
  }
  const newId = data.value.sets.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1
  data.value.sets.push({
    id: newId,
    key: '',
    name: '',
    type: '',
    region: '',
    preferredCharacters: [],
  })
  selectedId.value = newId
  isNew.value = true
  idInput.value = String(newId)
  charQuery.value = ''
  mobilePane.value = 'form'
  markDirty()
}

function confirmDelete() {
  const i = data.value.sets.indexOf(entry.value)
  if (i >= 0) data.value.sets.splice(i, 1)
  selectedId.value = null
  isNew.value = false
  mobilePane.value = 'list'
  markDirty()
  deleteOpen.value = false
  ElMessage.success('已删除')
}

function doRenumber() {
  const n = data.value.sets.length
  if (!n) {
    ElMessage.error('没有套装可重排')
    return
  }
  const sel = entry.value
  const sorted = data.value.sets.slice().sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
  sorted.forEach((s, i) => {
    s.id = i + 1
  })
  if (sel) {
    selectedId.value = sel.id
    idInput.value = String(sel.id)
  }
  markDirty()
  renumberOpen.value = false
  ElMessage.success(`已重排 ${n} 条 id`)
}

async function doReload() {
  try {
    applyData(await fetchOnline())
    selectedId.value = null
    isNew.value = false
    mobilePane.value = 'list'
    reloadOpen.value = false
    clearDirty()
    clearDraft()
    ElMessage.success(`已重载 ${setCount.value} 条`)
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
      ElMessage.success(`已导入 ${setCount.value} 条`)
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
  const regionSet = new Set(data.value.regions)
  for (const s of data.value.sets) {
    if (idSet.has(s.id)) list.push(`id ${s.id} 重复`)
    idSet.add(s.id)
    if (!s.key) list.push(`id ${s.id} 缺少 key（图片未识别）`)
    if (!s.name) list.push(`id ${s.id} 缺少名称`)
    if (!s.region) list.push(`id ${s.id} 缺少地区`)
    else if (!regionSet.has(s.region)) list.push(`id ${s.id} 地区「${s.region}」不在地区列表中`)
    if (s.type !== 'exterior' && s.type !== 'interior') list.push(`id ${s.id} 类型不是室内/室外`)
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

/* ---------- URL 识别 ---------- */
const urlInput = ref('')
const urlInvalid = ref(false)
const urlHint = ref('')

watch(entry, (e) => {
  urlInput.value = e ? setImageUrl(e) : ''
  urlInvalid.value = false
  urlHint.value = e?.key ? `key: ${e.key}` : ''
})

/* 输入新地区自动并入列表 */
function onRegionInput() {
  const r = entry.value?.region
  if (r && data.value && !data.value.regions.includes(r)) data.value.regions.push(r)
  markDirty()
}

function tryApplyUrl(text) {
  if (!entry.value) return
  const normalized = (text || '').trim()

  if (!normalized) {
    if (entry.value.key) {
      entry.value.key = ''
      urlInvalid.value = false
      urlHint.value = ''
      markDirty()
    }
    return
  }

  const key = parseSetUrl(normalized)
  if (!key) {
    urlInvalid.value = true
    urlHint.value = '无法识别该 URL，请检查链接'
    return
  }

  if (key === entry.value.key) return

  urlInvalid.value = false
  entry.value.key = key

  const t = inferType(key)
  if (t) entry.value.type = t

  const r = inferRegion(key)
  if (r) {
    entry.value.region = r
    if (!data.value.regions.includes(r)) data.value.regions.push(r)
  }

  urlHint.value = `key: ${key}`
  markDirty()
}

function onUrlBlur() {
  tryApplyUrl(urlInput.value)
}

function onUrlKeydown(e) {
  if (e.key !== 'Enter') return
  e.preventDefault()
  recognizeUrl()
}

function recognizeUrl() {
  const v = urlInput.value.trim()
  if (!v) {
    ElMessage.error('请先粘贴图片链接')
    return
  }
  const key = parseSetUrl(v)
  if (!key) {
    tryApplyUrl(v)
    return
  }
  if (key === entry.value?.key) {
    ElMessage('URL 未变化，无需重新识别')
    return
  }
  tryApplyUrl(v)
}

/* ---------- 偏好角色 ---------- */
const hasSeparator = (q) => CHAR_SPLIT_TEST.test(q || '')

function removeChar(name) {
  const list = entry.value?.preferredCharacters
  if (!list) return
  const i = list.indexOf(name)
  if (i < 0) return
  list.splice(i, 1)
  markDirty()
}

function addChar(name, { requireDict = true } = {}) {
  const trimmed = (name || '').trim()
  if (!trimmed || !entry.value) return false
  if (entry.value.preferredCharacters.includes(trimmed)) return false
  if (requireDict && !charKeySet.has(trimmed)) return false
  entry.value.preferredCharacters.push(trimmed)
  markDirty()
  return true
}

/* 单条选中（来自建议列表，允许不在字典中） */
function onCharSelect(name) {
  addChar(name, { requireDict: false })
  charQuery.value = ''
}

/* 输入里出现分隔符 → 立刻批量处理 */
function commitChars(blur) {
  const raw = charQuery.value
  if (!raw) return

  if (!CHAR_SPLIT_TEST.test(raw)) {
    if (!blur) return
    const name = raw.trim()
    if (addChar(name)) charQuery.value = ''
    return
  }

  const parts = raw.split(CHAR_SPLIT_RE)
  const lastIsSep = parts[parts.length - 1] === ''

  let remaining = ''
  let toProcess
  if (blur || lastIsSep) {
    toProcess = parts.filter(Boolean)
  } else {
    remaining = parts[parts.length - 1]
    toProcess = parts.slice(0, -1)
  }

  const bad = []
  for (const name of toProcess) {
    if (!name) continue
    if (entry.value.preferredCharacters.includes(name)) continue
    if (charKeySet.has(name)) entry.value.preferredCharacters.push(name)
    else bad.push(name)
  }

  charQuery.value = remaining
  markDirty()
  if (bad.length) ElMessage.error('字典中未找到：' + bad.join('、'))
}

watch(charQuery, (v) => {
  if (CHAR_SPLIT_TEST.test(v || '')) commitChars(false)
})

function onCharEnter() {
  if (hasSeparator(charQuery.value)) {
    commitChars(true)
    return
  }
  const name = charQuery.value.trim()
  if (name && charKeySet.has(name)) {
    addChar(name)
    charQuery.value = ''
  }
}

function onCharBlur() {
  setTimeout(() => commitChars(true), 160)
}

/* el-autocomplete 的联想源：从「尚未选中的角色」里按输入过滤 */
function fetchCharSuggestions(queryString, cb) {
  const q = (queryString || '').toLowerCase()
  const list = q
    ? charSuggestions.value.filter((n) => n.toLowerCase().includes(q))
    : charSuggestions.value
  cb(list.map((value) => ({ value })))
}

/* ---------- 图片兜底 ---------- */
function onImgError(e) {
  e.target.remove()
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
        const order = item.order ?? 9999
        tmp.push({ name: item.name, order })
        charKeySet.add(item.name)
        orderMap.set(item.name, order)

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
    if (draft?.sets) {
      applyData(normalizeData(draft))
      dirty.value = true
      ElMessage({ message: '已恢复草稿（尚未导出）', duration: 3000 })
    } else {
      try {
        applyData(await fetchOnline())
      } catch (err) {
        ElMessage.error(`数据加载失败：${err.message}，可用「导入」`)
        applyData(normalizeData(null))
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    loading.value = false
  } catch (e) {
    loading.value = false
    applyData(normalizeData(null))
    ElMessage.error('初始化失败：' + (e?.message || e))
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
  clearTimeout(draftTimer)
})
</script>

<template>
  <el-container class="ah-gift-ed ah-shell" direction="vertical">
    <!-- 工具条 -->
    <div class="flex items-center gap-2 border-b border-line bg-canvas p-2">
      <span
        v-if="dirty"
        class="size-2 shrink-0 rounded-full bg-danger"
        role="status"
        aria-label="有未导出的修改"
      ></span>
      <el-text size="small" class="ah-text-muted">{{ data ? `${setCount} 条` : '数据未加载' }}</el-text>

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

    <el-main class="grid min-h-0 grid-rows-[minmax(0,1fr)] grid-cols-1 min-[900px]:grid-cols-[20rem_minmax(0,1fr)]">
      <!-- 左：列表 -->
      <aside
        class="flex min-h-0 flex-col bg-surface-2"
        :class="[
          mobilePane === 'form' ? 'hidden min-[900px]:flex' : 'flex',
          'border-line min-[900px]:border-r',
        ]"
      >
        <div class="grid shrink-0 gap-2 border-b border-line p-2">
          <el-input
            v-model="search"
            placeholder="搜索套装名 / 偏好角色"
            aria-label="搜索套装名 / 偏好角色"
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
            <el-select v-model="typeFilter" placeholder="类型" aria-label="类型" class="w-full">
              <el-option
                v-for="o in typeFilterOptions"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </el-select>
            <el-select v-model="regionFilter" placeholder="地区" aria-label="地区" class="w-full">
              <el-option
                v-for="o in regionFilterOptions"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </el-select>
          </div>
        </div>

        <el-scrollbar class="min-h-0 flex-1">
          <div class="grid content-start gap-1 p-2">
          <el-empty v-if="!data" :image-size="56" description="数据未加载，点「重载」或「导入」" />
          <el-empty
            v-else-if="!sortedSets.length"
            :image-size="56"
            :description="setCount ? '没有匹配的套装' : '暂无套装，点下方「新增套装」'"
          />

          <div
            v-for="s in sortedSets"
            :key="s.id"
            role="button"
            tabindex="0"
            class="flex w-full items-center gap-2 rounded-ctl border p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            :class="
              s.id === selectedId
                ? 'border-accent bg-accent-soft'
                : 'border-transparent hover:bg-hover'
            "
            @click="selectSet(s)"
            @keydown.enter.prevent="selectSet(s)"
            @keydown.space.prevent="selectSet(s)"
          >
            <span
              class="grid h-9 shrink-0 place-items-center overflow-hidden rounded-ctl bg-thumb"
              style="aspect-ratio: 2 / 1"
            >
              <img
                v-if="setImageUrl(s)"
                :src="setImageUrl(s)"
                alt=""
                loading="lazy"
                class="size-full object-contain"
                @error="onImgError"
              />
            </span>
            <span class="grid min-w-0 flex-1 gap-1">
              <span class="truncate text-xs font-medium text-ink">
                {{ s.name || '(未命名套装)' }}
              </span>
              <span class="truncate text-[10px] text-muted">
                {{ s.region || '?' }} · {{ typeLabel(s.type) }} ·
                {{ (s.preferredCharacters || []).length }} 人
              </span>
            </span>
                    </div>
        </div>
        </el-scrollbar>

        <div class="grid shrink-0 grid-cols-2 gap-2 border-t border-line p-2">
          <el-button size="small" @click="addSet">
            <el-icon><Plus /></el-icon>
            <span>新增套装</span>
          </el-button>
          <el-button size="small" :disabled="!data || !setCount" @click="renumberOpen = true">
            <el-icon><Sort /></el-icon>
            <span>重排 ID</span>
          </el-button>
        </div>
      </aside>

      <!-- 右：表单 -->
      <section
        class="min-h-0"
        :class="mobilePane === 'list' ? 'hidden min-[900px]:block' : 'block'"
      >
        <el-scrollbar class="h-full">
        <div class="grid gap-3 p-3">
          <el-button
            v-if="mobilePane === 'form'"
            size="small"
            class="justify-self-start min-[900px]:hidden"
            @click="mobilePane = 'list'"
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
            从列表选择套装开始编辑，或点「新增套装」
          </el-text>

          <template v-else>
            <!-- 预览 -->
            <div class="flex items-center gap-3 rounded-panel border border-line bg-surface p-2">
              <span
                class="grid h-14 shrink-0 place-items-center overflow-hidden rounded-ctl bg-thumb"
                style="aspect-ratio: 2 / 1"
              >
                <img
                  v-if="setImageUrl(entry)"
                  :src="setImageUrl(entry)"
                  alt=""
                  class="size-full object-contain"
                  @error="onImgError"
                />
                <span v-else class="text-[10px] text-faint">未设置图</span>
              </span>
              <span class="grid min-w-0 flex-1 gap-1">
                <span class="truncate text-sm font-semibold text-ink">
                  {{ entry.name || '(未命名套装)' }}
                </span>
                <el-text size="small" class="ah-text-muted">{{ previewSub }}</el-text>
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
                <el-button class="shrink-0" @click="moveSet(-1)">
                  <el-icon><ArrowUp /></el-icon>
                  <span>上移</span>
                </el-button>
                <el-button class="shrink-0" @click="moveSet(1)">
                  <el-icon><ArrowDown /></el-icon>
                  <span>下移</span>
                </el-button>
              </div>
            </div>

            <!-- 地区 -->
            <div class="grid gap-2">
              <el-text size="small" class="ah-text-muted font-medium">地区 · 输入新值会自动加入列表</el-text>
              <el-select
                v-model="entry.region"
                filterable
                allow-create
                default-first-option
                placeholder="如 蒙德"
                aria-label="地区"
                class="w-full"
                @update:model-value="onRegionInput"
              >
                <el-option
                  v-for="r in data.regions"
                  :key="r"
                  :label="r"
                  :value="r"
                />
              </el-select>
            </div>

            <!-- 图片 URL -->
            <div class="grid gap-2">
              <el-text size="small" class="ah-text-muted font-medium">
                套装图 URL · 粘贴后自动识别 key / 类型 / 地区
              </el-text>
              <div class="flex items-center gap-2">
                <el-input
                  v-model="urlInput"
                  placeholder="粘贴图片直链…"
                  autocomplete="off"
                  spellcheck="false"
                  aria-label="套装图 URL"
                  :status="urlInvalid ? 'error' : undefined"
                  @keydown.enter="recognizeUrl"
                  @blur="onUrlBlur"
                />
                <el-button class="shrink-0" @click="recognizeUrl">识别</el-button>
              </div>
              <el-text v-if="urlHint" size="small" class="ah-text-block" :class="urlInvalid ? 'text-danger' : 'text-muted'">
                {{ urlHint }}
              </el-text>
            </div>

            <div class="grid gap-2">
              <el-text size="small" class="ah-text-muted">名称</el-text>
              <el-input
                v-model="entry.name"
                placeholder="套装名称"
                class="w-full"
                @update:model-value="markDirty"
              />
            </div>

            <!-- 室内 / 室外：只占内容宽度 -->
            <div class="grid gap-2">
              <el-text size="small" class="ah-text-muted font-medium">室内 / 室外</el-text>
              <el-segmented
                v-model="entry.type"
                :options="typeOptions"
                @update:model-value="markDirty"
              />
            </div>

            <!-- 偏好角色 -->
            <div class="grid gap-2">
              <el-text size="small" class="ah-text-muted font-medium">
                偏好角色 · 支持逗号 / 空格 / 顿号批量输入，点格子可移除
              </el-text>

              <div
                v-if="sortedChars.length"
                class="grid grid-cols-[repeat(auto-fit,minmax(48px,1fr))] gap-2 rounded-ctl border border-line-2 bg-sunken p-2"
              >
                <el-check-tag
                  v-for="name in sortedChars"
                  :key="name"
                  class="ah-ed-char"
                  :title="`移除 ${name}`"
                  :aria-label="`移除 ${name}`"
                  @change="removeChar(name)"
                >
                  <span
                    class="relative grid size-8 place-items-center overflow-hidden rounded-ctl bg-thumb text-[10px] font-semibold text-muted"
                  >
                    <span aria-hidden="true">{{ name.charAt(0) }}</span>
                    <img
                      v-if="avatarUrl(name)"
                      :src="avatarUrl(name)"
                      alt=""
                      loading="lazy"
                      class="absolute inset-0 size-full object-cover"
                      @error="onImgError"
                    />
                  </span>
                  <span class="w-full break-all text-center text-[10px] leading-tight text-muted">
                    {{ name }}
                  </span>
                </el-check-tag>
              </div>

              <el-autocomplete
                v-model="charQuery"
                :fetch-suggestions="fetchCharSuggestions"
                :trigger-on-focus="false"
                placeholder="输入角色名，多个用逗号 / 空格分隔"
                aria-label="添加偏好角色"
                @select="onCharSelect"
                @keydown.enter="onCharEnter"
                @blur="onCharBlur"
              />
            </div>
          </template>
        </div>
        </el-scrollbar>
      </section>
    </el-main>

    <!-- 底部固定危险区：只有停在表单栏（手机端点进某套后）才出现删除入口 -->
    <div
      v-if="entry && mobilePane === 'form'"
      class="border-t border-line bg-canvas p-2 safe-bottom"
    >
      <el-button type="danger" class="w-full" @click="deleteOpen = true">
        <el-icon><Delete /></el-icon>
        <span>删除此套</span>
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
      title="删除套装"
      width="min(20rem, 90vw)"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-text size="large" class="ah-text-block">
        确定删除「{{ entry?.name || '(未命名)' }}」吗？此操作不可撤销。
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
        将按当前显示顺序重新编号 1 ~ {{ setCount }}，原有 id 会被覆盖。
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
.ah-gift-ed :deep(.el-select) {
  margin: 0;
}

/* EP input 宽度默认 100%，在「id + 上移/下移」的 flex 行里会挤掉按钮 */
.ah-gift-ed :deep(.ah-id) {
  flex: 1;
  min-width: 0;
}
/* 偏好角色格：与 GiftSet 页面角色格一致（el-check-tag 竖格，点一下移除） */
.ah-ed-char {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 4px 0;
  background-color: transparent;
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
}

.ah-ed-char:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}

</style>
