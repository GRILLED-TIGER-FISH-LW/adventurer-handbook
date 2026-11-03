<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import Btn from '../components/Btn.vue'
import Dropdown from '../components/Dropdown.vue'
import Modal from '../components/Modal.vue'
import Icon from '../components/Icon.vue'
import { useToast } from '../composables/useToast.js'
import { loadGlobalScript, loadGiftSetData } from '../composables/useData.js'

const KEY_OWNED = 'genshin_homeworld_gift_sets_owned_v1'
const KEY_COMPLETED = 'genshin_homeworld_gift_sets_completed_v1'
const KEY_UID = 'genshin_homeworld_gift_sets_uid_v1'

const ICON_DICT_URL =
  'https://grilled-tiger-fish-lw.github.io/genshin-guide/shared/gi-icons/icon-dict.js'

const EXCLUDED = new Set(['旅行者'])
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
  Array.isArray(list) ? list.filter((x) => typeof x === 'string' && !EXCLUDED.has(x)) : []

const cardMap = computed(() => {
  const ownedSet = new Set(owned.value)
  const map = new Map()

  for (const set of sets.value) {
    const chars = (Array.isArray(set.preferredCharacters) ? set.preferredCharacters : [])
      .filter((c) => !EXCLUDED.has(c))
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
  if (!name || EXCLUDED.has(name)) return
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
  if (!set?.key || !name || EXCLUDED.has(name)) return

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
    const dict = await loadGlobalScript(ICON_DICT_URL, 'ICON_DICT').catch(() => null)

    imageConfig = data?.config?.image || null
    sets.value = Array.isArray(data?.sets) ? data.sets.slice() : []
    regions.value = Array.isArray(data?.regions) ? data.regions.slice() : []

    if (dict?.characters) {
      const cfg = dict.config?.characters
      const tmp = new Map()
      for (const [key, item] of Object.entries(dict.characters)) {
        if (!item?.name || EXCLUDED.has(item.name)) continue
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
  <div class="grid h-full grid-rows-[auto_minmax(0,1fr)_auto]">
    <header class="flex items-center gap-2 border-b border-line bg-canvas p-2">
      <input
        :value="uid"
        type="text"
        aria-label="UID"
        placeholder="UID"
        inputmode="numeric"
        maxlength="15"
        spellcheck="false"
        class="h-9 w-24 shrink-0 rounded-ctl border border-line-2 bg-surface px-2.5 text-center text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-soft"
        @input="onUidInput($event.target.value)"
      />
      <div class="flex flex-1 justify-end gap-1.5">
        <Btn size="sm" @click="exportArchive">
          <template #icon><Icon name="ui.export" size="sm" /></template>
          导出
        </Btn>
        <Btn size="sm" @click="fileInput?.click()">
          <template #icon><Icon name="ui.import" size="sm" /></template>
          导入
        </Btn>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept=".json,application/json"
        class="hidden"
        @change="onImportFile"
      />
    </header>

    <div class="min-h-0 overflow-y-auto">
      <div v-if="loading" class="p-3 text-sm text-muted">正在加载套装数据…</div>

      <div v-else-if="errorMsg" class="grid justify-items-center gap-3 p-8 text-center">
        <p class="text-sm font-semibold text-danger">数据加载失败</p>
        <p class="text-xs text-muted">{{ errorMsg }}</p>
        <Btn size="sm" @click="() => location.reload()">重新加载</Btn>
      </div>

      <template v-else>
        <section class="border-b border-line">
          <button
            type="button"
            class="flex w-full items-center gap-2 px-2 py-1.5 text-left"
            :aria-expanded="!charCollapsed"
            @click="charCollapsed = !charCollapsed"
          >
            <span class="text-sm font-semibold text-ink">我的角色</span>
            <span class="text-xs text-muted">{{ owned.length }}</span>
            <Icon
              :name="charCollapsed ? 'ui.chevronDown' : 'ui.chevronUp'"
              bold
              size="sm"
              class="ml-auto text-muted"
            />
          </button>

          <div v-if="!charCollapsed" class="grid gap-1.5 px-2 pb-2">
            <input
              v-model="charSearch"
              type="text"
              class="h-9 w-full min-w-0 rounded-ctl border border-line-2 bg-surface px-2.5 text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-soft"
              placeholder="搜索角色"
              autocomplete="off"
              spellcheck="false"
            />

            <div class="grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-1.5">
              <button
                v-for="name in visibleCharNames"
                :key="name"
                type="button"
                class="grid justify-items-center gap-0.5 rounded-ctl border p-1"
                :class="
                  owned.includes(name)
                    ? 'border-accent bg-accent-soft'
                    : 'border-line bg-surface opacity-50'
                "
                :aria-pressed="owned.includes(name)"
                :title="name"
                @click="toggleOwned(name)"
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
                <span class="w-full truncate text-center text-[10px] text-muted">{{ name }}</span>
              </button>
            </div>
          </div>
        </section>

        <section v-if="recommendations.length" class="border-b border-line">
          <button
            type="button"
            class="flex w-full items-center gap-2 px-2 py-1.5 text-left"
            :aria-expanded="!recommendCollapsed"
            @click="recommendCollapsed = !recommendCollapsed"
          >
            <span class="text-sm font-semibold text-ink">推荐套装</span>
            <span class="text-xs text-muted">前 {{ recommendations.length }}</span>
            <Icon
              :name="recommendCollapsed ? 'ui.chevronDown' : 'ui.chevronUp'"
              bold
              size="sm"
              class="ml-auto text-muted"
            />
          </button>

          <div v-if="!recommendCollapsed" class="grid gap-1.5 px-2 pb-2">
            <article
              v-for="s in recommendations"
              :key="`r-${s.key}`"
              class="rounded-panel border border-line bg-surface"
            >
              <button
                type="button"
                class="flex w-full items-center gap-2 p-1.5 text-left"
                :aria-expanded="expandedKeys.has(s.key)"
                @click="toggleExpand(s.key)"
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
                  <span
                    class="absolute left-0 top-0 rounded-br-ctl bg-accent-solid px-1 text-[10px] leading-4 text-on-accent"
                  >
                    推荐
                  </span>
                </span>

                <span class="grid min-w-0 flex-1 gap-0.5">
                  <span class="truncate text-sm font-medium text-ink">{{ s.name }}</span>
                  <span class="text-xs text-muted">{{ s.region }} · {{ typeLabel(s.type) }}</span>
                </span>

                <span class="shrink-0 text-xs tabular-nums text-muted">
                  {{ cardMap.get(s.key)?.progress.text }}
                </span>

                <Icon
                  :name="expandedKeys.has(s.key) ? 'ui.chevronUp' : 'ui.chevronDown'"
                  bold
                  size="sm"
                  class="shrink-0 text-muted"
                />
              </button>

              <div v-if="expandedKeys.has(s.key)" class="grid gap-1.5 border-t border-line p-1.5">
                <div class="grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-1.5">
                  <button
                    v-for="name in cardMap.get(s.key)?.chars || []"
                    :key="`${s.key}-${name}`"
                    type="button"
                    class="grid justify-items-center gap-0.5 rounded-ctl border p-1"
                    :class="
                      !owned.includes(name)
                        ? 'border-line bg-surface opacity-50'
                        : (cardMap.get(s.key)?.done || []).includes(name)
                          ? 'border-accent bg-accent-soft'
                          : 'border-line-2 bg-surface'
                    "
                    :aria-pressed="(cardMap.get(s.key)?.done || []).includes(name)"
                    :title="name"
                    @click="toggleSetChar(s, name)"
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
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section>
          <button
            type="button"
            class="flex w-full items-center gap-2 px-2 py-1.5 text-left"
            :aria-expanded="!allCollapsed"
            @click="allCollapsed = !allCollapsed"
          >
            <span class="text-sm font-semibold text-ink">全部套装</span>
            <span class="text-xs text-muted">{{ filteredSets.length }} / {{ sets.length }}</span>
            <Icon
              :name="allCollapsed ? 'ui.chevronDown' : 'ui.chevronUp'"
              bold
              size="sm"
              class="ml-auto text-muted"
            />
          </button>

          <div v-if="!allCollapsed" class="grid gap-1.5 px-2 pb-2">
            <div class="relative flex items-center">
              <Icon
                name="ui.search"
                size="sm"
                class="pointer-events-none absolute left-2.5 text-muted"
              />
              <input
                v-model="search"
                type="text"
                class="h-9 w-full min-w-0 rounded-ctl border border-line-2 bg-surface pl-8 pr-8 text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-soft"
                placeholder="搜索套装名 / 角色名"
                autocomplete="off"
                spellcheck="false"
              />
              <button
                v-if="search"
                type="button"
                class="absolute right-1.5 grid size-6 place-items-center rounded-full text-muted hover:bg-hover"
                aria-label="清除搜索"
                @click="search = ''"
              >
                <Icon name="ui.close" size="sm" />
              </button>
            </div>

            <div class="grid grid-cols-3 gap-1.5">
              <Dropdown v-model="regionFilter" :options="regionOptions" label="地区" />
              <Dropdown v-model="typeFilter" :options="typeOptions" label="类型" />
              <Dropdown v-model="statusFilter" :options="STATUS_OPTIONS" label="状态" />
            </div>

            <div v-if="!filteredSets.length" class="grid justify-items-center gap-3 p-8 text-center">
              <Icon name="ui.inbox" size="lg" class="text-faint" />
              <p class="text-sm text-muted">
                {{ sets.length ? '没有匹配的套装' : '套装数据未加载，请检查 data.js' }}
              </p>
            </div>

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
              <button
                type="button"
                class="flex w-full items-center gap-2 p-1.5 text-left"
                :aria-expanded="expandedKeys.has(s.key)"
                @click="toggleExpand(s.key)"
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

                <span class="grid min-w-0 flex-1 gap-0.5">
                  <span class="truncate text-sm font-medium text-ink">
                    {{ s.name || '(未命名)' }}
                  </span>
                  <span class="text-xs text-muted">{{ s.region }} · {{ typeLabel(s.type) }}</span>
                </span>

                <span
                  class="shrink-0 text-xs tabular-nums"
                  :class="
                    cardMap.get(s.key)?.progress.completed ? 'text-accent-strong' : 'text-muted'
                  "
                >
                  {{ cardMap.get(s.key)?.progress.text }}
                </span>

                <Icon
                  :name="expandedKeys.has(s.key) ? 'ui.chevronUp' : 'ui.chevronDown'"
                  bold
                  size="sm"
                  class="shrink-0 text-muted"
                />
              </button>

              <div v-if="expandedKeys.has(s.key)" class="grid gap-1.5 border-t border-line p-1.5">
                <div v-if="!cardMap.get(s.key)?.chars.length" class="p-1.5 text-xs text-muted">
                  无偏好角色数据
                </div>
                <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-1.5">
                  <button
                    v-for="name in cardMap.get(s.key).chars"
                    :key="`${s.key}-${name}`"
                    type="button"
                    class="grid justify-items-center gap-0.5 rounded-ctl border p-1"
                    :class="
                      !owned.includes(name)
                        ? 'border-line bg-surface opacity-50'
                        : cardMap.get(s.key).done.includes(name)
                          ? 'border-accent bg-accent-soft'
                          : 'border-line-2 bg-surface'
                    "
                    :aria-pressed="cardMap.get(s.key).done.includes(name)"
                    :title="name"
                    @click="toggleSetChar(s, name)"
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
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </template>
    </div>

    <div class="border-t border-line bg-canvas p-2">
      <Btn variant="danger" class="w-full" size="sm" @click="resetOpen = true">
        <template #icon><Icon name="ui.trash" size="sm" /></template>
        重置全部数据
      </Btn>
    </div>

    <Modal
      v-model="resetOpen"
      title="重置全部数据"
      message="将清空「我拥有的角色」和所有完成记录，此操作不可撤销。"
      confirm-text="重置"
      danger
      persistent
      @confirm="doReset"
    />
  </div>
</template>
