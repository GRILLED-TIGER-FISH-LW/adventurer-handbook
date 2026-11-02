<script setup>
import { computed, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from './Icon.vue'

const open = defineModel({ type: Boolean, default: false })

const route = useRoute()
const router = useRouter()

const items = computed(() => [
  { path: '/', label: '首页', icon: 'nav.home' },
  ...router.options.routes
    .filter((r) => r.meta?.label)
    .map((r) => ({ path: r.path, label: r.meta.label, icon: r.meta.icon })),
])

const isActive = (path) => route.path === path

function close() {
  open.value = false
}

watch(() => route.fullPath, close)

const appRoot = document.getElementById('app')

watch(open, (v) => {
  if (appRoot) appRoot.inert = v
  if (v) document.addEventListener('keydown', onKey)
  else document.removeEventListener('keydown', onKey)
})

function onKey(e) {
  if (e.key === 'Escape') close()
}

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  if (appRoot) appRoot.inert = false
})

function go(path) {
  router.push(path)
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dr">
      <div v-if="open" class="fixed inset-0 z-[90] bg-mask" @mousedown.self="close"></div>
    </Transition>

    <Transition name="drp">
      <aside
        v-if="open"
        role="dialog"
        aria-modal="true"
        aria-label="功能导航"
        class="fixed inset-y-0 left-0 z-[100] flex w-64 max-w-[85vw] flex-col border-r border-line bg-canvas"
      >
        <div class="flex h-14 shrink-0 items-center border-b border-line px-4">
          <h2 class="text-sm font-semibold text-ink">功能导航</h2>
        </div>

        <nav class="grid gap-1 overflow-y-auto p-2">
          <button
            v-for="item in items"
            :key="item.path"
            type="button"
            class="flex h-11 items-center gap-2.5 rounded-ctl px-3 text-left text-sm"
            :class="
              isActive(item.path)
                ? 'bg-surface font-semibold text-ink'
                : 'text-body hover:bg-hover'
            "
            :aria-current="isActive(item.path) ? 'page' : undefined"
            @click="go(item.path)"
          >
            <span
              class="grid size-5 shrink-0 place-items-center"
              :class="isActive(item.path) ? 'text-accent-strong' : 'text-muted'"
            >
              <Icon :name="item.icon" size="sm" />
            </span>
            <span class="min-w-0 truncate">{{ item.label }}</span>
          </button>
        </nav>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dr-enter-active,
.dr-leave-active {
  transition: opacity 200ms var(--ease-spring);
}
.dr-enter-from,
.dr-leave-to {
  opacity: 0;
}

.drp-enter-active,
.drp-leave-active {
  transition: transform 200ms var(--ease-spring);
}
.drp-enter-from,
.drp-leave-to {
  transform: translateX(-100%);
}
</style>
