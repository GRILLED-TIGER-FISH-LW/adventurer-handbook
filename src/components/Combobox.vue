<script setup>
import { computed, nextTick, ref, useId } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  placeholder: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
  /* 单项最大显示数 */
  max: { type: Number, default: 40 },
})

const emit = defineEmits(['update:modelValue', 'select'])

const uid = useId()
const listId = `cb-${uid}`
const optId = (i) => `cb-${uid}-${i}`

const inputEl = ref(null)
const open = ref(false)
const highlight = ref(0)

const options = computed(() => {
  const q = props.modelValue.trim().toLowerCase()
  const matched = (q ? props.items.filter((x) => x.toLowerCase().includes(q)) : props.items).slice(
    0,
    props.max,
  )
  return matched.map((v) => ({ value: v, isNew: false }))
})

const activeId = computed(() =>
  open.value && options.value.length ? optId(highlight.value) : undefined,
)

function onFocus() {
  highlight.value = 0
  open.value = true
}

function onInput(e) {
  emit('update:modelValue', e.target.value)
  highlight.value = 0
  open.value = true
}

function onKeydown(e) {
  const n = options.value.length
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!open.value) open.value = true
    else highlight.value = n ? Math.min(highlight.value + 1, n - 1) : 0
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlight.value = n ? Math.max(highlight.value - 1, 0) : 0
  } else if (e.key === 'Enter') {
    if (!open.value || !n) return
    e.preventDefault()
    choose(highlight.value)
  } else if (e.key === 'Escape') {
    if (open.value) {
      e.preventDefault()
      open.value = false
    }
  }
}

async function choose(i) {
  const it = options.value[i]
  if (!it) return
  emit('update:modelValue', it.value)
  emit('select', it.value)
  open.value = false
  await nextTick()
  inputEl.value?.focus()
}

function onBlur() {
  setTimeout(() => {
    open.value = false
  }, 150)
}

function onOptionDown(e, i) {
  e.preventDefault()
  choose(i)
}
</script>

<template>
  <div class="relative">
    <div class="relative flex items-center">
      <slot name="prefix" />
      <input
        ref="inputEl"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="open"
        :aria-controls="open ? listId : undefined"
        :aria-activedescendant="activeId"
        :aria-label="ariaLabel || undefined"
        :value="modelValue"
        :placeholder="placeholder || undefined"
        autocomplete="off"
        spellcheck="false"
        class="h-10 w-full min-w-0 rounded-ctl border border-line-2 bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-soft"
        :class="$slots.prefix && 'pl-11'"
        @focus="onFocus"
        @input="onInput"
        @keydown="onKeydown"
        @blur="onBlur"
      />
    </div>

    <ul
      v-if="open"
      :id="listId"
      role="listbox"
      class="absolute inset-x-0 top-[calc(100%+4px)] z-30 max-h-60 overflow-y-auto rounded-panel border border-line-2 bg-surface p-1 shadow-float"
    >
      <li v-if="!options.length" class="px-2 py-1.5 text-xs text-muted">
        无匹配，可直接输入新值
      </li>
      <li
        v-for="(it, i) in options"
        :id="optId(i)"
        :key="it.value"
        role="option"
        :aria-selected="it.value === modelValue"
        class="cursor-pointer truncate rounded-ctl px-2 py-1.5 text-sm"
        :class="[
          it.value === modelValue ? 'font-medium text-accent-strong' : 'text-ink',
          i === highlight ? 'bg-hover' : it.value === modelValue ? 'bg-accent-soft' : '',
        ]"
        @mouseenter="highlight = i"
        @pointerdown="onOptionDown($event, i)"
      >
        {{ it.value }}
      </li>
    </ul>
  </div>
</template>
