<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import Btn from '../components/Btn.vue'
import Dropdown from '../components/Dropdown.vue'
import Field from '../components/Field.vue'
import Seg from '../components/Seg.vue'
import Combobox from '../components/Combobox.vue'
import Modal from '../components/Modal.vue'
import Icon from '../components/Icon.vue'
import { useToast } from '../composables/useToast.js'
import { loadGlobalScript } from '../composables/useData.js'
import '../icons/editor-icons.js'

const DRAFT_KEY = 'genshin_homeworld_gift_sets_editor_draft_v1'
const DATA_URL = 'data/gift-set.js'
const FILE_NAME = DATA_URL.split('/').pop()
const IMAGE_DICT_URL =
  'https://grilled-tiger-fish-lw.github.io/genshin-guide/shared/image-dict.js'

/* 批量输入分隔符：空格 / 全角逗号 / 半角逗号 / 顿号 / 分号 */
const CHAR_SPLIT_RE = /[\s，,、;；]+/
const CHAR_SPLIT_TEST = /[\s，,、;；]/

const toast = useToast()

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
    toast.error('数据未加载')
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
  toast.success('已删除')
}

function doRenumber() {
  const n = data.value.sets.length
  if (!n) {
    toast.error('没有套装可重排')
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
  toast.success(`已重排 ${n} 条 id`)
}

async function doReload() {
  try {
    applyData(await fetchOnline())
    selectedId.value = null
    isNew.value = false
    mobilePane.value = 'list'
    clearDirty()
    clearDraft()
    toast.success(`已重载 ${setCount.value} 条`)
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
      toast.success(`已导入 ${setCount.value} 条`)
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

  clearDirty()
  clearDraft()
  toast.success(`已导出 ${FILE_NAME}`)
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
    toast.error('请先粘贴图片链接')
    return
  }
  const key = parseSetUrl(v)
  if (!key) {
    tryApplyUrl(v)
    return
  }
  if (key === entry.value?.key) {
    toast.show('URL 未变化，无需重新识别')
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
  if (bad.length) toast.error('字典中未找到：' + bad.join('、'))
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
      toast.show('已恢复草稿（尚未导出）', { duration: 3000 })
    } else {
      try {
        applyData(await fetchOnline())
      } catch (err) {
        toast.error(`数据加载失败：${err.message}，可用「导入」`)
        applyData(normalizeData(null))
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    loading.value = false
  } catch (e) {
    loading.value = false
    applyData(normalizeData(null))
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
      <span class="text-xs text-muted">{{ data ? `${setCount} 条` : '数据未加载' }}</span>

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
        :class="[
          mobilePane === 'form' ? 'hidden min-[900px]:flex' : 'flex',
          'border-line min-[900px]:border-r',
        ]"
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
              placeholder="搜索套装名 / 偏好角色"
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
            <Dropdown v-model="typeFilter" :options="typeFilterOptions" label="类型" />
            <Dropdown v-model="regionFilter" :options="regionFilterOptions" label="地区" />
          </div>
        </div>

        <div class="grid min-h-0 flex-1 content-start gap-1 overflow-y-auto p-2">
          <p v-if="!data" class="p-3 text-xs text-muted">数据未加载，点「重载」或「导入」</p>
          <p v-else-if="!sortedSets.length" class="p-3 text-xs text-muted">
            {{ setCount ? '没有匹配的套装' : '暂无套装，点下方「新增套装」' }}
          </p>

          <button
            v-for="s in sortedSets"
            :key="s.id"
            type="button"
            class="flex w-full items-center gap-2 rounded-ctl border p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            :class="
              s.id === selectedId
                ? 'border-accent bg-accent-soft'
                : 'border-transparent hover:bg-hover'
            "
            @click="selectSet(s)"
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
          </button>
        </div>

        <div class="grid shrink-0 grid-cols-2 gap-2 border-t border-line p-2">
          <Btn size="sm" @click="addSet">
            <template #icon><Icon name="ui.plus" size="sm" /></template>
            新增套装
          </Btn>
          <Btn size="sm" :disabled="!data || !setCount" @click="renumberOpen = true">
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
          <Btn
            v-if="mobilePane === 'form'"
            size="sm"
            class="justify-self-start min-[900px]:hidden"
            @click="mobilePane = 'list'"
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
            从列表选择套装开始编辑，或点「新增套装」
          </p>

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
                <span class="text-xs text-muted">{{ previewSub }}</span>
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
                <Btn class="shrink-0" @click="moveSet(-1)">
                  <template #icon><Icon name="ui.arrowUp" size="sm" /></template>
                  上移
                </Btn>
                <Btn class="shrink-0" @click="moveSet(1)">
                  <template #icon><Icon name="ui.arrowDown" size="sm" /></template>
                  下移
                </Btn>
              </div>
            </div>

            <!-- 地区 -->
            <div class="grid gap-2">
              <span class="text-xs font-medium text-muted">地区 · 输入新值会自动加入列表</span>
              <Combobox
                v-model="entry.region"
                :items="data.regions"
                allow-custom
                :custom-label="(r) => '＋ 新增地区：' + r"
                aria-label="地区"
                placeholder="如 蒙德"
                @update:model-value="onRegionInput"
              />
            </div>

            <!-- 图片 URL -->
            <div class="grid gap-2">
              <span class="text-xs font-medium text-muted">
                套装图 URL · 粘贴后自动识别 key / 类型 / 地区
              </span>
              <div class="flex items-center gap-2">
                <input
                  v-model="urlInput"
                  type="text"
                  placeholder="粘贴图片直链…"
                  autocomplete="off"
                  spellcheck="false"
                  aria-label="套装图 URL"
                  class="h-control w-full min-w-0 rounded-md border bg-surface px-input-x text-body-md text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1"
                  :class="
                    urlInvalid
                      ? 'border-danger focus-visible:outline-danger'
                      : 'border-line-2 focus-visible:outline-accent'
                  "
                  @blur="onUrlBlur"
                  @keydown="onUrlKeydown"
                />
                <Btn class="shrink-0" @click="recognizeUrl">识别</Btn>
              </div>
              <p v-if="urlHint" class="text-xs" :class="urlInvalid ? 'text-danger' : 'text-muted'">
                {{ urlHint }}
              </p>
            </div>

            <Field
              v-model="entry.name"
              label="名称"
              placeholder="套装名称"
              @update:model-value="markDirty"
            />

            <!-- 室内 / 室外：只占内容宽度 -->
            <div class="grid gap-2">
              <span class="text-xs font-medium text-muted">室内 / 室外</span>
              <Seg
                v-model="entry.type"
                :options="typeOptions"
                class="justify-self-start"
                @update:model-value="markDirty"
              />
            </div>

            <!-- 偏好角色 -->
            <div class="grid gap-2">
              <span class="text-xs font-medium text-muted">
                偏好角色 · 支持逗号 / 空格 / 顿号批量输入，点格子可移除
              </span>

              <div
                v-if="sortedChars.length"
                class="grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-2 rounded-ctl border border-line-2 bg-sunken p-2"
              >
                <button
                  v-for="name in sortedChars"
                  :key="name"
                  type="button"
                  class="grid cursor-pointer justify-items-center gap-1 rounded-ctl border border-line bg-surface p-1 hover:border-danger focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                  :title="`移除 ${name}`"
                  :aria-label="`移除 ${name}`"
                  @click="removeChar(name)"
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
                  <span class="w-full truncate text-center text-[10px] text-muted">
                    {{ name }}
                  </span>
                </button>
              </div>

              <Combobox
                v-model="charQuery"
                :items="charSuggestions"
                allow-custom
                :custom-label="(n) => '＋ 添加角色：' + n"
                :suppress-when="hasSeparator"
                aria-label="添加偏好角色"
                placeholder="输入角色名，多个用逗号 / 空格分隔"
                @select="onCharSelect"
                @keydown.enter="onCharEnter"
                @blur="onCharBlur"
              />
            </div>
          </template>
        </div>
      </section>
    </main>

    <!-- 底部固定危险区 -->
    <div v-if="entry" class="border-t border-line bg-canvas p-2">
      <Btn variant="danger" class="w-full" @click="deleteOpen = true">
        <template #icon><Icon name="ui.trash" size="sm" /></template>
        删除此套
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
      title="删除套装"
      :message="`确定删除「${entry?.name || '(未命名)'}」吗？此操作不可撤销。`"
      confirm-text="删除"
      danger
      persistent
      @confirm="confirmDelete"
    />

    <!-- 确认：重排 -->
    <Modal
      v-model="renumberOpen"
      title="重排 id"
      :message="`将按当前显示顺序重新编号 1 ~ ${setCount}，原有 id 会被覆盖。`"
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
