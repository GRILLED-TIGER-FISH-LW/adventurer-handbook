<script setup>
import { useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'

const router = useRouter()
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
        class="grid size-9 place-items-center rounded-ctl bg-accent-soft text-accent-strong"
        aria-hidden="true"
      >
        <Icon :name="t.meta.icon" size="sm" />
      </span>
      <span class="grid gap-1">
        <span class="text-sm font-semibold text-ink">{{ t.meta.label }}</span>
        <span class="text-xs text-muted">{{ t.meta.desc }}</span>
      </span>
    </RouterLink>
  </div>
</template>
