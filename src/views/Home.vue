<script setup>
import { useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'

const router = useRouter()
const tools = router.options.routes.filter((r) => r.meta?.label)
</script>

<template>
  <div class="grid grid-cols-2 content-start gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4">
    <RouterLink
      v-for="t in tools"
      :key="t.path"
      :to="t.path"
      class="grid content-start gap-2 rounded-panel border border-line bg-surface p-3 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
    >
      <span
        class="grid size-8 place-items-center rounded-ctl bg-accent-soft text-accent-strong"
        aria-hidden="true"
      >
        <Icon :name="t.meta.icon" size="sm" />
      </span>

      <span class="grid min-w-0 gap-1">
        <span class="truncate text-body-sm-medium text-ink">{{ t.meta.label }}</span>
        <span class="line-clamp-2 text-caption text-muted">{{ t.meta.desc }}</span>
      </span>
    </RouterLink>
  </div>
</template>
