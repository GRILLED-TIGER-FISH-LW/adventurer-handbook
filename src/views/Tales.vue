<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import Btn from '../components/Btn.vue'
import Field from '../components/Field.vue'
import Dropdown from '../components/Dropdown.vue'
import Modal from '../components/Modal.vue'
import Icon from '../components/Icon.vue'
import { useToast } from '../composables/useToast.js'
import { loadGlobalScript, loadTalesData } from '../composables/useData.js'

const STORAGE_KEY = 'genshin_travelers_tales_completed_v2'
const LEGACY_KEY = 'genshin_travelers_tales_completed_v1'
const UID_KEY = 'genshin_travelers_tales_uid_v1'

const ICON_DICT_URL =
  'https://grilled-tiger-fish-lw.github.io/genshin-guide/shared/gi-icons/icon-dict.js'

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
const clearOpen = ref(false)

const entryKey = (e) => `${e.character || ''}·${e.version || ''}·${e.title || ''}`
const cleanText = (s) => String(s ?? '').replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim()

function buildAvatarCache(dict) {
  const cfg = dict?.config?.characters
  if (!dict?.characters || !cfg) return
  for (const key in dict.characters) {
    const item = dict.characters[key]
    if (!item?.name) continue
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
      if (item?.name) m.set(item.name, typeof item.order === 'number' ? item.order : 9999)
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

function confirmClear() {
  if (done.size === 0) {
    toast.show('暂无已完成的旅闻')
    return
  }
  clearOpen.value = true
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
  const cleaned = val.replace(/\D/g, '')
  uid.value = cleaned
  try {
    if (cleaned) localStorage.setItem(UID_KEY, cleaned)
    else localStorage.removeItem(UID_KEY)
  } catch {}
}

onMounted(async () => {
  try {
    const data = await loadTalesData()
    const dict = await loadGlobalScript(ICON_DICT_URL, 'ICON_DICT').catch(() => null)

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
    <header class="grid gap-1.5 border-b border-line bg-canvas p-2">
      <div class="flex items-center gap-2">
        <div class="relative flex min-w-0 flex-1 items-center">
          <Icon
            name="ui.search"
            size="sm"
            class="pointer-events-none absolute left-2.5 text-muted"
          />
          <input
            v-model="search"
            type="text"
            class="h-9 w-full min-w-0 rounded-ctl border border-line-2 bg-surface pl-8 pr-8 text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-soft"
            placeholder="搜索角色名 / 旅闻名"
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

        <div
          class="flex shrink-0 items-center gap-1 rounded-ctl bg-accent-soft px-2 py-1 text-xs text-accent-strong"
        >
          <span>已完成</span>
          <span class="font-semibold tabular-nums">{{ done.size }}</span>
          <span aria-hidden="true">/</span>
          <span class="tabular-nums">{{ total }}</span>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-1.5">
        <Dropdown v-model="version" :options="versionOptions" label="版本" />
        <Dropdown v-model="status" :options="statusOptions" label="状态" />
        <Dropdown v-model="visibility" :options="visibilityOptions" label="类型" />
      </div>

      <div class="flex items-center gap-2">
        <div class="w-24 shrink-0">
          <Field
            :model-value="uid"
            aria-label="UID"
            placeholder="UID"
            inputmode="numeric"
            maxlength="15"
            @update:model-value="onUidInput"
          />
        </div>
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
      </div>
    </header>

    <div class="min-h-0 overflow-y-auto p-2">
      <div v-if="loading" class="p-4 text-sm text-muted">正在加载旅闻数据…</div>

      <div v-else-if="errorMsg" class="grid justify-items-center gap-3 p-8 text-center">
        <p class="text-sm font-semibold text-danger">数据加载失败</p>
        <p class="text-xs text-muted">{{ errorMsg }}</p>
        <Btn size="sm" @click="() => location.reload()">重新加载</Btn>
      </div>

      <div v-else-if="!rows.length" class="grid justify-items-center gap-3 p-8 text-center">
        <Icon name="ui.inbox" size="lg" class="text-faint" />
        <p class="text-sm text-muted">没有找到匹配的旅闻</p>
      </div>

      <div v-else class="grid gap-1.5">
        <article
          v-for="row in rows"
          :key="row.key"
          role="checkbox"
          :aria-checked="row.isDone"
          :aria-label="`${row.e.character} ${row.e.version} ${row.e.title}`"
          tabindex="0"
          class="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 rounded-panel border p-2.5"
          :class="
            row.isDone ? 'border-line-3 bg-sunken/60' : 'border-line bg-surface hover:bg-hover'
          "
          @click="toggle(row)"
          @keydown.enter.prevent="toggle(row)"
          @keydown.space.prevent="toggle(row)"
        >
          <div
            class="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-ctl bg-sunken text-sm font-semibold text-muted"
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

          <div class="flex min-w-0 items-center gap-1.5">
            <span class="shrink-0 text-sm font-medium text-ink">{{ row.e.character }}</span>
            <span
              class="shrink-0 rounded bg-accent-soft px-1 text-[10px] font-medium leading-4 text-accent-strong tabular-nums"
            >
              {{ row.e.version }}
            </span>
            <span
              class="min-w-0 truncate text-sm"
              :class="row.e.hidden ? 'text-danger' : 'text-body'"
            >
              {{ row.e.title }}
            </span>
          </div>

          <span
            class="grid size-5 shrink-0 place-items-center rounded-ctl border"
            :class="
              row.isDone
                ? 'border-accent-solid bg-accent-solid text-on-accent'
                : 'border-line-2 bg-surface text-transparent'
            "
            aria-hidden="true"
          >
            <Icon name="ui.check" size="sm" />
          </span>

          <div v-if="row.metas.length" class="col-span-3 grid gap-0.5">
            <div
              v-for="m in row.metas"
              :key="m.id"
              class="flex min-w-0 items-baseline gap-1.5 text-xs"
            >
              <span class="shrink-0 text-muted">{{ m.label }}</span>
              <span class="min-w-0 text-gold">{{ m.value }}</span>
            </div>
          </div>

          <div v-if="row.desc" class="col-span-3 text-xs leading-relaxed text-muted">
            {{ row.desc }}
          </div>
        </article>
      </div>
    </div>

    <div class="border-t border-line bg-canvas p-2">
      <Btn variant="danger" class="w-full" size="sm" @click="confirmClear">
        <template #icon><Icon name="ui.trash" size="sm" /></template>
        清空全部记录
      </Btn>
    </div>

    <Modal
      v-model="clearOpen"
      title="清空完成记录"
      :message="`确定清空所有完成标记吗？共 ${done.size} 条。建议先导出存档备份进度，清空后无法恢复。`"
      confirm-text="确认清空"
      danger
      persistent
      @confirm="doClear"
    />
  </div>
</template>
