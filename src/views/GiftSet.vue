<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ArrowDown, ArrowUp, Delete, Download, Search, Upload } from '@element-plus/icons-vue'
import { useToast } from '../composables/useToast.js'
import { loadGlobalScript, loadGiftSetData } from '../composables/useData.js'

const KEY_OWNED = 'genshin_homeworld_gift_sets_owned_v1'
const KEY_COMPLETED = 'genshin_homeworld_gift_sets_completed_v1'
const KEY_UID = 'genshin_homeworld_gift_sets_uid_v1'

const IMAGE_DICT_URL =
  'https://grilled-tiger-fish-lw.github.io/genshin-guide/shared/image-dict.js'

/* 旅行者一家（本体 + 冰 / 火 / 雷 …各元素变体）不进这个页面。
   字典里 order === 1 的就是它们（见下方枚举 dict.characters 那行），
   这里按名字前缀兜底 —— 存档里可能还留着旧的「旅行者·冰」，得一并滤掉。 */
const EXCLUDED = /^旅行者/
const toast = useToast()

const loading = ref(true)
const errorMsg = ref('')
const sets = ref([])
const regions = ref([])
let imageConfig = null

const charByName = reactive(new Map())
const charAvatar = reactive(new Map())
const charDescNames = ref([])

const owned = ref([])
const completed = ref({})
const uid = ref('')

const search = ref('')
const charSearch = ref('')
const regionFilter = ref('all')
const typeFilter = ref('all')
const statusFilter = ref('all')

const expandedKeys = reactive(new Set())

const charCollapsed = ref(false)
const recommendCollapsed = ref(false)
const allCollapsed = ref(false)

/* el-collapse 用「展开项的 name 数组」表达状态，这里跟上面三个布尔值互转，
   脚本里那几处 charCollapsed.value = ... 不用改 */
const COLLAPSE_KEYS = [
  ['char', charCollapsed],
  ['recommend', recommendCollapsed],
  ['all', allCollapsed],
]
const activeCollapse = computed(() =>
  COLLAPSE_KEYS.filter(([, c]) => !c.value).map(([k]) => k),
)
function onCollapseChange(names) {
  for (const [k, c] of COLLAPSE_KEYS) c.value = !names.includes(k)
}

const resetOpen = ref(false)
const fileInput = ref(null)

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'done', label: '已完成' },
  { value: 'achieved', label: '已送完' },
  { value: 'incomplete', label: '未完成' },
]

const regionOptions = computed(() => [
  { value: 'all', label: '全部地区' },
  ...regions.value.map((r) => ({ value: r, label: r })),
])

const typeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'interior', label: '室内' },
  { value: 'exterior', label: '室外' },
]

const pad2 = (n) => String(n).padStart(2, '0')
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}
const todayFileStr = () => todayStr().replace(/-/g, '')
const typeLabel = (t) => (t === 'exterior' ? '室外' : t === 'interior' ? '室内' : '?')
const getOrder = (name) => charByName.get(name)?.order ?? 9999

const sanitizeOwned = (list) =>
  Array.isArray(list) ? list.filter((x) => typeof x === 'string' && !EXCLUDED.test(x)) : []

const cardMap = computed(() => {
  const ownedSet = new Set(owned.value)
  const map = new Map()

  for (const set of sets.value) {
    const chars = (Array.isArray(set.preferredCharacters) ? set.preferredCharacters : [])
      .filter((c) => !EXCLUDED.test(c))
      .slice()
      .sort((a, b) => getOrder(a) - getOrder(b))

    const doneArr = completed.value[set.key] || []
    const ownedChars = chars.filter((c) => ownedSet.has(c))
    let progress

    if (!ownedChars.length) {
      progress = { status: 'unowned', text: '未拥有角色', completed: false }
    } else {
      const doneOwned = ownedChars.filter((c) => doneArr.includes(c))
      const allDone = doneOwned.length === ownedChars.length
      if (allDone && ownedChars.length === chars.length)
        progress = { status: 'done', text: '已完成', completed: true }
      else if (allDone) progress = { status: 'achieved', text: '已送完', completed: true }
      else
        progress = {
          status: 'incomplete',
          text: `${doneOwned.length} / ${ownedChars.length}`,
          completed: false,
        }
    }

    map.set(set.key, {
      chars,
      progress,
      done: doneArr,
      thumb: set.key && imageConfig ? imageConfig.prefix + set.key + imageConfig.ext : '',
    })
  }
  return map
})

const recommendations = computed(() => {
  const ownedSet = new Set(owned.value)
  if (!ownedSet.size) return []

  const candidates = []
  for (const set of sets.value) {
    const info = cardMap.value.get(set.key)
    if (!info || !info.chars.length) continue

    const ownedInSet = info.chars.filter((c) => ownedSet.has(c))
    if (!ownedInSet.length) continue

    const pending = ownedInSet.filter((c) => !info.done.includes(c))
    if (!pending.length) continue

    candidates.push({
      set,
      pendingCount: pending.length,
      ratio: ownedInSet.length / info.chars.length,
    })
  }

  candidates.sort((a, b) => {
    if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount
    if (b.ratio !== a.ratio) return b.ratio - a.ratio
    return (a.set.id ?? 0) - (b.set.id ?? 0)
  })

  return candidates.slice(0, 5).map((c) => c.set)
})

const filteredSets = computed(() => {
  const kw = search.value.trim().toLowerCase()
  const out = []

  for (const s of sets.value) {
    if (regionFilter.value !== 'all' && s.region !== regionFilter.value) continue
    if (typeFilter.value !== 'all' && s.type !== typeFilter.value) continue

    const info = cardMap.value.get(s.key)
    if (statusFilter.value !== 'all' && info?.progress.status !== statusFilter.value) continue

    if (kw) {
      const chars = s.preferredCharacters || []
      const hitName = (s.name || '').toLowerCase().includes(kw)
      const hitChar = chars.some((c) => c.toLowerCase().includes(kw))
      if (!hitName && !hitChar) continue
    }
    out.push(s)
  }

  return out.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
})

const visibleCharNames = computed(() => {
  const q = charSearch.value.trim().toLowerCase()
  return charDescNames.value.filter((n) => !q || n.toLowerCase().includes(q))
})

function loadStored() {
  try {
    const o = localStorage.getItem(KEY_OWNED)
    owned.value = sanitizeOwned(o ? JSON.parse(o) : [])
  } catch {
    owned.value = []
  }

  try {
    const raw = localStorage.getItem(KEY_COMPLETED)
    const obj = raw ? JSON.parse(raw) : {}
    const out = {}
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const k in obj) {
        if (Array.isArray(obj[k])) out[k] = sanitizeOwned(obj[k])
      }
    }
    completed.value = out
  } catch {
    completed.value = {}
  }

  try {
    uid.value = localStorage.getItem(KEY_UID) || ''
  } catch {
    uid.value = ''
  }
}

function saveOwned() {
  try {
    localStorage.setItem(KEY_OWNED, JSON.stringify(owned.value))
  } catch {}
}
function saveCompleted() {
  try {
    localStorage.setItem(KEY_COMPLETED, JSON.stringify(completed.value))
  } catch {}
}
function saveUid() {
  try {
    if (uid.value) localStorage.setItem(KEY_UID, uid.value)
    else localStorage.removeItem(KEY_UID)
  } catch {}
}

function toggleOwned(name) {
  if (!name || EXCLUDED.test(name)) return
  const i = owned.value.indexOf(name)
  if (i >= 0) owned.value.splice(i, 1)
  else owned.value.push(name)
  saveOwned()
}

function toggleExpand(key) {
  if (!key) return
  if (expandedKeys.has(key)) expandedKeys.delete(key)
  else expandedKeys.add(key)
}

function toggleSetChar(set, name) {
  if (!set?.key || !name || EXCLUDED.test(name)) return

  if (!owned.value.includes(name)) {
    toast.error(`未拥有「${name}」，先去上面的角色栏勾选`)
    return
  }
  if (!(set.preferredCharacters || []).includes(name)) return

  const cur = completed.value[set.key] ? [...completed.value[set.key]] : []
  const i = cur.indexOf(name)
  if (i >= 0) cur.splice(i, 1)
  else cur.push(name)

  const next = { ...completed.value }
  if (cur.length) next[set.key] = cur
  else delete next[set.key]
  completed.value = next

  saveCompleted()
}

function onUidInput(val) {
  const cleaned = val.replace(/\D/g, '').slice(0, 15)
  uid.value = cleaned
  saveUid()
}

function exportArchive() {
  if (!owned.value.length && !Object.keys(completed.value).length) {
    toast.error('还没有可导出的记录')
    return
  }

  const validKeys = new Set(sets.value.map((s) => s.key))
  const filteredCompleted = {}
  for (const key in completed.value) {
    if (!validKeys.has(key)) continue
    const arr = completed.value[key]
    if (arr?.length) filteredCompleted[key] = arr.slice()
  }

  const payload = {
    schema: 'genshin-homeworld-gift-sets',
    uid: uid.value.trim(),
    exportedAt: todayStr(),
    owned: owned.value.slice(),
    completed: filteredCompleted,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = uid.value.trim()
    ? `赠礼套装存档记录-${uid.value.trim()}-${todayFileStr()}.json`
    : `赠礼套装存档记录-${todayFileStr()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)

  toast.success('已导出存档')
}

function importData(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('JSON 格式错误')
  }
  if (!data || typeof data !== 'object') throw new Error('存档格式无效')
  if (data.schema && data.schema !== 'genshin-homeworld-gift-sets')
    throw new Error('存档 schema 不匹配')
  if (!Array.isArray(data.owned)) throw new Error('缺少 owned 数组')
  if (data.completed && (typeof data.completed !== 'object' || Array.isArray(data.completed)))
    throw new Error('completed 格式错误')

  const validKeys = new Set(sets.value.map((s) => s.key))

  owned.value = sanitizeOwned(data.owned)

  const next = {}
  if (data.completed) {
    for (const key in data.completed) {
      if (!validKeys.has(key)) continue
      if (!Array.isArray(data.completed[key])) continue
      next[key] = sanitizeOwned(data.completed[key])
    }
  }
  completed.value = next

  uid.value = typeof data.uid === 'string' ? data.uid : ''

  saveOwned()
  saveCompleted()
  saveUid()

  search.value = ''
  regionFilter.value = 'all'
  typeFilter.value = 'all'
  statusFilter.value = 'all'
  charSearch.value = ''
  charCollapsed.value = owned.value.length > 0

  toast.success(`已导入：${owned.value.length} 个角色`)
}

function onImportFile(ev) {
  const file = ev.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      importData(reader.result)
    } catch (err) {
      toast.error(`导入失败：${err.message}`)
    }
    ev.target.value = ''
  }
  reader.readAsText(file)
}

/* el-dialog 的按钮不会自己关弹窗（原来 Modal 组件会），确认后补一下 */
function confirmReset() {
  doReset()
  resetOpen.value = false
}

function doReset() {
  owned.value = []
  completed.value = {}
  uid.value = ''
  expandedKeys.clear()

  saveOwned()
  saveCompleted()
  saveUid()

  search.value = ''
  regionFilter.value = 'all'
  typeFilter.value = 'all'
  statusFilter.value = 'all'
  charSearch.value = ''
  charCollapsed.value = false

  toast.success('已重置')
}

onMounted(async () => {
  try {
    const data = await loadGiftSetData()
    const dict = await loadGlobalScript(IMAGE_DICT_URL, 'IMAGE_DICT').catch(() => null)

    imageConfig = data?.config?.image || null
    sets.value = Array.isArray(data?.sets) ? data.sets.slice() : []
    regions.value = Array.isArray(data?.regions) ? data.regions.slice() : []

    if (dict?.characters) {
      const cfg = dict.config?.characters
      const tmp = new Map()
      for (const [key, item] of Object.entries(dict.characters)) {
        if (!item?.name || item.order === 1) continue
        tmp.set(item.name, { key, order: item.order ?? 9999 })

        let url = ''
        if (item.url) url = item.url
        else if (cfg)
          url = /\.(webp|png|jpe?g)$/i.test(key) ? cfg.prefix + key : cfg.prefix + key + cfg.ext
        if (url) charAvatar.set(item.name, url)
      }
      tmp.forEach((v, k) => charByName.set(k, v))
      charDescNames.value = Array.from(tmp.entries())
        .sort((a, b) => a[1].order - b[1].order)
        .map(([name]) => name)
        .reverse()
    }

    loadStored()
    charCollapsed.value = owned.value.length > 0
    loading.value = false
  } catch (e) {
    errorMsg.value = e?.message || '未知错误'
    loading.value = false
  }
})
</script>

<template>
  <el-container class="ah-shell" direction="vertical">
    <el-header class="ah-shell__bar ah-shell__bar--row">
      <el-input
        v-model="uid"
        aria-label="UID"
        placeholder="UID"
        inputmode="numeric"
        maxlength="15"
        spellcheck="false"
        class="ah-uid shrink-0"
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
        aria-hidden="true"
        tabindex="-1"
        @change="onImportFile"
      />
    </el-header>

    <div class="min-h-0 overflow-y-auto">
      <div v-if="loading" class="p-3 text-sm text-muted">正在加载套装数据…</div>

      <div v-else-if="errorMsg" class="grid justify-items-center gap-3 p-8 text-center">
        <el-text class="el-text el-text--default ah-text-danger font-semibold ah-text-block">数据加载失败</el-text>
        <el-text class="el-text el-text--small ah-text-muted ah-text-block">{{ errorMsg }}</el-text>
        <el-button size="small" @click="() => location.reload()">
          <span>重新加载</span>
        </el-button>
      </div>

      <template v-else>
        <el-collapse
          :model-value="activeCollapse"
          @change="onCollapseChange"
          class="ah-gift__collapse"
        >
          <el-collapse-item name="char">
            <template #title>
              <el-text class="el-text el-text--default ah-text-ink font-semibold">我的角色</el-text>
              <el-text class="el-text el-text--small ah-text-muted ah-text-gap">{{ owned.length }}</el-text>
            </template>
            <div class="grid gap-2">
            <el-input
              v-model="charSearch"
              placeholder="搜索角色"
              aria-label="搜索角色"
              clearable
              class="min-w-0"
              autocomplete="off"
              spellcheck="false"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <div class="grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-2">
              <el-checkbox
                v-for="name in visibleCharNames"
                :key="name"
                :model-value="owned.includes(name)"
                class="ah-gift__char"
                :class="
                  owned.includes(name)
                    ? 'border-accent bg-accent-soft'
                    : 'border-line bg-surface opacity-50'
                "
                :title="name"
                @change="toggleOwned(name)"
              >
                <span
                  class="relative grid size-8 place-items-center overflow-hidden rounded-ctl bg-thumb text-[10px] font-semibold text-muted"
                >
                  <span aria-hidden="true">{{ name.charAt(0) }}</span>
                  <img
                    v-if="charAvatar.get(name)"
                    :src="charAvatar.get(name)"
                    alt=""
                    loading="lazy"
                    class="absolute inset-0 size-full object-cover"
                    @error="(ev) => ev.target.remove()"
                  />
                </span>
                <span class="w-full truncate text-center text-[10px] text-muted">
                  {{ name }}
                </span>
              </el-checkbox>
            </div>
          </div>
          </el-collapse-item>

          <el-collapse-item v-if="recommendations.length" name="recommend">
            <template #title>
              <el-text class="el-text el-text--default ah-text-ink font-semibold">推荐套装</el-text>
              <el-text class="el-text el-text--small ah-text-muted ah-text-gap">前 {{ recommendations.length }}</el-text>
            </template>
            <div class="grid gap-2">
            <article
              v-for="s in recommendations"
              :key="`r-${s.key}`"
              class="rounded-panel border border-line bg-surface"
            >
              <div
                role="button"
                tabindex="0"
                class="flex w-full items-center gap-2 p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                :aria-expanded="expandedKeys.has(s.key)"
                @click="toggleExpand(s.key)"
                @keydown.enter.prevent="toggleExpand(s.key)"
                @keydown.space.prevent="toggleExpand(s.key)"
              >

                <span
                  class="relative h-9 shrink-0 overflow-hidden rounded-ctl bg-thumb"
                  style="aspect-ratio: 2 / 1"
                >
                  <img
                    v-if="cardMap.get(s.key)?.thumb"
                    :src="cardMap.get(s.key).thumb"
                    alt=""
                    loading="lazy"
                    class="size-full object-contain"
                  />
                  <el-tag size="small" type="danger" effect="dark" class="absolute left-0 top-0">
                    推荐
                  </el-tag>
                </span>

                <span class="grid min-w-0 flex-1 gap-1">
                  <span class="truncate text-sm font-medium text-ink">{{ s.name }}</span>
                  <el-text class="el-text el-text--small ah-text-muted">{{ s.region }} · {{ typeLabel(s.type) }}</el-text>
                </span>

                <span class="shrink-0 text-xs tabular-nums text-muted">
                  {{ cardMap.get(s.key)?.progress.text }}
                </span>

                <el-icon class="shrink-0 text-muted">
                  <ArrowUp v-if="expandedKeys.has(s.key)" />
                  <ArrowDown v-else />
                </el-icon>
              </div>

              <div v-if="expandedKeys.has(s.key)" class="grid gap-2 border-t border-line p-2">
                <div class="grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-2">
                  <el-checkbox
                    v-for="name in cardMap.get(s.key)?.chars || []"
                    :key="`${s.key}-${name}`"
                    :model-value="(cardMap.get(s.key)?.done || []).includes(name)"
                    class="ah-gift__char"
                    :class="
                      !owned.includes(name)
                        ? 'border-line bg-surface opacity-50'
                        : (cardMap.get(s.key)?.done || []).includes(name)
                          ? 'border-accent bg-accent-soft'
                          : 'border-line-2 bg-surface'
                    "
                    :title="name"
                    @change="toggleSetChar(s, name)"
                  >
                    <span
                      class="relative grid size-8 place-items-center overflow-hidden rounded-ctl bg-thumb text-[10px] font-semibold text-muted"
                    >
                      <span aria-hidden="true">{{ name.charAt(0) }}</span>
                      <img
                        v-if="charAvatar.get(name)"
                        :src="charAvatar.get(name)"
                        alt=""
                        loading="lazy"
                        class="absolute inset-0 size-full object-cover"
                        @error="(ev) => ev.target.remove()"
                      />
                    </span>
                    <span class="w-full truncate text-center text-[10px] text-muted">
                      {{ name }}
                    </span>
                  </el-checkbox>
                </div>
              </div>
            </article>
          </div>
          </el-collapse-item>

          <el-collapse-item name="all">
            <template #title>
              <el-text class="el-text el-text--default ah-text-ink font-semibold">全部套装</el-text>
              <el-text class="el-text el-text--small ah-text-muted ah-text-gap">{{ filteredSets.length }} / {{ sets.length }}</el-text>
            </template>
            <div class="grid gap-2">
            <el-input
              v-model="search"
              placeholder="搜索套装名 / 角色名"
              aria-label="搜索套装名 / 角色名"
              clearable
              class="min-w-0"
              autocomplete="off"
              spellcheck="false"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <div class="grid grid-cols-3 gap-2">
              <el-select v-model="regionFilter" placeholder="地区" aria-label="地区" class="w-full">
                <el-option
                  v-for="o in regionOptions"
                  :key="o.value"
                  :label="o.label"
                  :value="o.value"
                />
              </el-select>
              <el-select v-model="typeFilter" placeholder="类型" aria-label="类型" class="w-full">
                <el-option
                  v-for="o in typeOptions"
                  :key="o.value"
                  :label="o.label"
                  :value="o.value"
                />
              </el-select>
              <el-select v-model="statusFilter" placeholder="状态" aria-label="状态" class="w-full">
                <el-option
                  v-for="o in STATUS_OPTIONS"
                  :key="o.value"
                  :label="o.label"
                  :value="o.value"
                />
              </el-select>
            </div>

            <el-empty
              v-if="!filteredSets.length"
              :description="sets.length ? '没有匹配的套装' : '套装数据未加载，请检查 data.js'"
            />

            <article
              v-for="s in filteredSets"
              :key="s.key"
              class="rounded-panel border"
              :class="
                cardMap.get(s.key)?.progress.completed
                  ? 'border-accent bg-sunken/50 opacity-70'
                  : 'border-line bg-surface'
              "
            >
              <div
                role="button"
                tabindex="0"
                class="flex w-full items-center gap-2 p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                :aria-expanded="expandedKeys.has(s.key)"
                @click="toggleExpand(s.key)"
                @keydown.enter.prevent="toggleExpand(s.key)"
                @keydown.space.prevent="toggleExpand(s.key)"
              >

                <span
                  class="h-9 shrink-0 overflow-hidden rounded-ctl bg-thumb"
                  style="aspect-ratio: 2 / 1"
                >
                  <img
                    v-if="cardMap.get(s.key)?.thumb"
                    :src="cardMap.get(s.key).thumb"
                    alt=""
                    loading="lazy"
                    class="size-full object-contain"
                  />
                </span>

                <span class="grid min-w-0 flex-1 gap-1">
                  <span class="truncate text-sm font-medium text-ink">
                    {{ s.name || '(未命名)' }}
                  </span>
                  <el-text class="el-text el-text--small ah-text-muted">{{ s.region }} · {{ typeLabel(s.type) }}</el-text>
                </span>

                <span
                  class="shrink-0 text-xs tabular-nums"
                  :class="
                    cardMap.get(s.key)?.progress.completed ? 'text-accent-strong' : 'text-muted'
                  "
                >
                  {{ cardMap.get(s.key)?.progress.text }}
                </span>

                <el-icon class="shrink-0 text-muted">
                  <ArrowUp v-if="expandedKeys.has(s.key)" />
                  <ArrowDown v-else />
                </el-icon>
              </div>

              <div v-if="expandedKeys.has(s.key)" class="grid gap-2 border-t border-line p-2">
                <div v-if="!cardMap.get(s.key)?.chars.length" class="p-2 text-xs text-muted">
                  无偏好角色数据
                </div>
                <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-2">
                  <el-checkbox
                    v-for="name in cardMap.get(s.key).chars"
                    :key="`${s.key}-${name}`"
                    :model-value="cardMap.get(s.key).done.includes(name)"
                    class="ah-gift__char"
                    :class="
                      !owned.includes(name)
                        ? 'border-line bg-surface opacity-50'
                        : cardMap.get(s.key).done.includes(name)
                          ? 'border-accent bg-accent-soft'
                          : 'border-line-2 bg-surface'
                    "
                    :title="name"
                    @change="toggleSetChar(s, name)"
                  >
                    <span
                      class="relative grid size-8 place-items-center overflow-hidden rounded-ctl bg-thumb text-[10px] font-semibold text-muted"
                    >
                      <span aria-hidden="true">{{ name.charAt(0) }}</span>
                      <img
                        v-if="charAvatar.get(name)"
                        :src="charAvatar.get(name)"
                        alt=""
                        loading="lazy"
                        class="absolute inset-0 size-full object-cover"
                        @error="(ev) => ev.target.remove()"
                      />
                    </span>
                    <span class="w-full truncate text-center text-[10px] text-muted">
                      {{ name }}
                    </span>
                  </el-checkbox>
                </div>
              </div>
            </article>
          </div>
          </el-collapse-item>
        </el-collapse>
      </template>
    </div>

    <el-footer class="ah-shell__bar ah-shell__bar--bottom safe-bottom">
      <el-button type="danger" class="w-full" @click="resetOpen = true">
        <el-icon><Delete /></el-icon>
        <span>重置全部数据</span>
      </el-button>
    </el-footer>

    <el-dialog
      v-model="resetOpen"
      title="重置全部数据"
      width="min(420px, 88vw)"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-text class="el-text el-text--large ah-text-block">将清空「我拥有的角色」和所有完成记录，此操作不可撤销。</el-text>
      <template #footer>
        <el-button @click="resetOpen = false">取消</el-button>
        <el-button type="danger" @click="confirmReset">重置</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<style scoped>
/* 角色块用 el-checkbox 拿语义（role=checkbox / aria-checked / 空格切换），
   外观是头像块：藏掉 EP 自带的勾选框，状态交给外框颜色表达 */
.ah-gift__char {
  width: 100%;
}

.ah-gift__char :deep(.el-checkbox__input) {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.ah-gift__char :deep(.el-checkbox__label) {
  display: grid;
  justify-items: center;
  gap: 4px;
  width: 100%;
}

/* 勾选框是透明的，焦点环画在整块上，键盘用户才看得见走到哪 */
.ah-gift__char:focus-within {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}

/* 修复：EP checkbox 固定 32px 高会把头像块（32px 图标 + 名字）挤爆，
   放开高度、去掉 inline-flex 的 30px 右边距，让格子按内容撑成竖长方形 */
.ah-gift__char {
  display: block;
  width: 100%;
  box-sizing: border-box;
  justify-self: stretch;
  min-width: 0;
  height: auto;
  min-height: 0;
  margin: 0;
  padding: 4px 0;
}

/* 与编辑器偏好角色格一致：悬浮提示可移除 */
.ah-gift__char:hover {
  border-color: var(--color-danger);
}

.ah-gift__char :deep(.el-checkbox__label) {
  padding: 0;
  gap: 6px;
}

/* EP collapse 内容默认只有 padding-bottom:25px，没有左右内边距，
   筛选行会顶到页面边缘 */
.ah-gift__collapse :deep(.el-collapse-item__header) {
  padding: 0 16px;
}

.ah-gift__collapse :deep(.el-collapse-item__content) {
  padding: 12px 16px;
}

/* EP 给 .el-select 带了 margin-right:8px（input-group 那条还带 margin:0 -20px），
   在 grid-cols-3 里会把下拉框推出格子，弹窗跟着偏 */
.ah-gift__collapse :deep(.el-select) {
  margin: 0;
}

/* 推荐角标：只留右下角圆角（左上角跟着缩略图走），再缩小一圈 */
.ah-gift__collapse :deep(.el-tag) {
  border-radius: 0 0 4px 0;
  padding: 0 4px;
  height: 16px;
  line-height: 16px;
  font-size: 10px;
}
</style>
