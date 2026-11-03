<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { theme, toggleTheme } from '../composables/useTheme.js'
import Icon from './Icon.vue'

defineEmits(['open-menu'])

const route = useRoute()
/* label 给主站工具页（进导航）；title 给内部页（编辑器） */
const title = computed(() => route.meta?.label || route.meta?.title || '提瓦特冒险之证')
const titleIcon = computed(() => route.meta?.icon || '')
/* 内部页不给菜单入口 */
const showMenu = computed(() => !route.meta?.internal)
const themeLabel = computed(() =>
  theme.value === 'dark' ? '切换到浅色模式' : '切换到深色模式',
)
</script>

<template>
  <header class="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-canvas px-3">
    <button
      v-if="showMenu"
      type="button"
      class="grid size-9 shrink-0 place-items-center rounded-ctl border border-line-2 bg-surface text-ink"
      aria-label="打开菜单"
      @click="$emit('open-menu')"
    >
      <Icon name="app.hamburger" size="sm" />
    </button>

    <span
      v-if="titleIcon"
      class="grid size-7 shrink-0 place-items-center rounded-ctl bg-accent-soft text-accent-strong"
      aria-hidden="true"
    >
      <Icon :name="titleIcon" size="sm" />
    </span>

    <h1 class="min-w-0 flex-1 truncate text-base font-semibold text-ink">{{ title }}</h1>

    <button
      type="button"
      class="grid size-9 shrink-0 place-items-center rounded-ctl border border-line-2 bg-surface text-ink"
      :aria-label="themeLabel"
      @click="toggleTheme"
    >
      <Icon :name="theme === 'dark' ? 'app.moon' : 'app.sun'" size="sm" />
    </button>
  </header>
</template>
