<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { theme, toggleTheme } from '../composables/useTheme.js'
import SolarIcon from './SolarIcon.vue'

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
    <el-button
      v-if="showMenu"
      circle
      aria-label="打开菜单"
      @click="$emit('open-menu')"
    >
      <SolarIcon name="hamburger-menu" size="20" aria-hidden="true" />
    </el-button>

    <span
      v-if="titleIcon"
      class="grid size-7 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-strong"
      aria-hidden="true"
    >
      <SolarIcon :name="titleIcon" :bold="true" size="20" />
    </span>

    <h1 class="min-w-0 flex-1 truncate text-heading-5 text-ink">{{ title }}</h1>

    <el-button circle :aria-label="themeLabel" @click="toggleTheme">
      <SolarIcon :name="theme === 'dark' ? 'moon' : 'sun-2'" :bold="true" size="20" aria-hidden="true" />
    </el-button>
  </header>
</template>
