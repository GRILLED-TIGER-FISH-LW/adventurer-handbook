<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { theme, toggleTheme } from '../composables/useTheme.js'
import Icon from './Icon.vue'

defineEmits(['open-menu'])

const route = useRoute()
const title = computed(() => route.meta?.label || '提瓦特冒险之证')
const themeLabel = computed(() =>
  theme.value === 'dark' ? '切换到浅色模式' : '切换到深色模式',
)
</script>

<template>
  <header class="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-canvas px-4">
    <button
      type="button"
      class="grid size-9 shrink-0 place-items-center rounded-ctl border border-line-2 bg-surface text-ink"
      aria-label="打开菜单"
      @click="$emit('open-menu')"
    >
      <Icon name="app.hamburger" size="sm" />
    </button>

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
