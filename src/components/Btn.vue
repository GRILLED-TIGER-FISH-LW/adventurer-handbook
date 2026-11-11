<script setup>
import { computed } from 'vue'

const props = defineProps({
  /* primary  实心强调（accent-solid + 白字）
     secondary 描边（默认）
     ghost     无底无边，工具栏用
     danger    危险操作 */
  variant: {
    type: String,
    default: 'secondary',
    validator: (v) => ['primary', 'secondary', 'ghost', 'danger'].includes(v),
  },
  /* md 标准按钮 / sm 紧凑按钮（工具栏、列表行、卡片角） */
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['md', 'sm'].includes(v),
  },
  /* 纯图标：去掉左右 padding，锁定正方形。必须自己传 aria-label */
  square: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

/* Notion button：内边距 10×18、字 14/500、行高 1.3、圆角 8（高度由内边距决定）
   Notion ghost：内边距 8×12，作紧凑档
   方形图标钮：Notion 无规格，统一取图标钮档 36px */
const MD = 'px-btn-x py-btn-y text-button gap-2'
const SM = 'px-btn-ghost-x py-btn-ghost-y text-button gap-2'
const MD_SQ = 'size-icon-btn p-0 gap-0'
const SM_SQ = 'size-icon-btn p-0 gap-0'

const VARIANTS = {
  primary: 'bg-accent-solid text-on-accent hover:bg-accent-hover',
  secondary: 'bg-surface text-ink border border-line-2 hover:bg-hover',
  ghost: 'bg-transparent text-body hover:bg-hover',
  danger: 'bg-danger-soft text-danger hover:bg-danger-soft/70',
}

const isDisabled = computed(() => props.disabled || props.loading)

const rootClass = computed(() => [
  'relative inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md',
  'font-medium select-none',
  'transition-transform duration-100 ease-spring active:scale-[0.98]',
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
  'disabled:pointer-events-none disabled:opacity-50',
  VARIANTS[props.variant],
  props.square ? (props.size === 'sm' ? SM_SQ : MD_SQ) : props.size === 'sm' ? SM : MD,
])

/* 图标槽尺寸：20px / 36px = 55%，40px 高时 50%，都不再是原来那 44% */
const iconBox = computed(() => (props.size === 'sm' ? 'size-4' : 'size-5'))
</script>

<template>
  <button
    type="button"
    :class="rootClass"
    :disabled="isDisabled"
    :aria-busy="loading || undefined"
  >
    <span class="contents" :class="loading && 'invisible'">
      <span
        v-if="$slots.icon"
        class="grid shrink-0 place-items-center [&>svg]:size-full"
        :class="iconBox"
      >
        <slot name="icon" />
      </span>
      <slot />
    </span>

    <span
      v-if="loading"
      class="absolute inset-0 grid place-items-center"
      aria-hidden="true"
    >
      <span
        class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      ></span>
    </span>
  </button>
</template>
