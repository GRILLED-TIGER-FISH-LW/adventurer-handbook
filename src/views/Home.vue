<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
/* 自动从路由表生成卡片，不手写第二份工具列表 */
const tools = router.options.routes.filter((r) => r.meta?.label)
</script>

<template>
  <div class="grid content-start gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
    <RouterLink
      v-for="t in tools"
      :key="t.path"
      :to="t.path"
      class="grid gap-3 rounded-panel border border-line bg-surface p-4 hover:bg-hover"
    >
      <span
        class="grid size-9 place-items-center rounded-ctl bg-accent-soft text-sm font-semibold text-accent-strong"
        aria-hidden="true"
      >
        {{ t.meta.label.slice(0, 1) }}
      </span>
      <span class="grid gap-1">
        <span class="text-sm font-semibold text-ink">{{ t.meta.label }}</span>
        <span class="text-xs text-muted">{{ t.meta.desc }}</span>
      </span>
    </RouterLink>
  </div>
</template>
